import { mapData } from './constants/mapData.js';
import { clearCanvas, shadeCanvas } from './utils/Canvas.js';
import { findImageById, areAllImageAssetsLoaded } from './utils/Image.js';
import createInputHandlers, { KEYCODE_LEFT, KEYCODE_RIGHT, KEYCODE_UP, KEYCODE_DOWN } from './utils/Input.js';
import { handleKeyPresses } from './utils/Input.js';

const context = document.getElementById('canvas').getContext('2d');
context.imageSmoothingEnabled = false;
context.mozImageSmoothingEnabled = false;
context.webkitImageSmoothingEnabled = false;
context.msImageSmoothingEnabled = false;

const state = {
    player: {
        x: 258.2,
        y: 221.7,
        rotation: 0,
        speed: 3,
        height: 300 // vertical viewing angle
    },
    rayCount: 800, // 1x1 pixel mode
    fieldOfVision: 55,
    resolution: 100, // configure each grid cell to be 100x100 pixels
    upHeld: false,
    downHeld: false,
    rightHeld: false,
    leftHeld: false,
    assetsLoaded: false
};

window.addEventListener(
    "keydown",
    event => {
        if ([KEYCODE_LEFT, KEYCODE_RIGHT, KEYCODE_UP, KEYCODE_DOWN].includes(event.keyCode)) {
            event.preventDefault();
        }
    });

const { handleKeyDown, handleKeyUp } = createInputHandlers(state);

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

// returns new coordinates for given starting point, angle, and distance/length
const getNewCoordsForAngle = (x, y, rotation, length) => {
    return [
        x + length * Math.cos(toRadians(rotation)),
        y + length * Math.sin(toRadians(rotation))
    ];
};

// converts degrees (0-360) to radians which is the standard unit for trigonometric calculations
const toRadians = degrees => degrees * Math.PI / 180;

// removes fish-eye (edge distortions) by adjusting ray length based on its angle to the projection (basic trigonometry)
const normalizeRayLength = (rayLength, rayIndex) => {
    const degreesToPlayerCenter = state.player.rotation - (state.fieldOfVision / 2) + (rayIndex * (state.fieldOfVision / state.rayCount));
    const angleDiff = degreesToPlayerCenter - state.player.rotation;

    return Math.cos(toRadians(angleDiff)) * rayLength;
};

// returns the shortest ray length to next wall segment / map edge, and the verticalHit boolean (to set fractional coordinate for texture map)
const getShortestRayToWallSegment = (rayRotation) => {
    const rotation = (rayRotation % 360 + 360) % 360; // always in range 0 - 360
    const radians = toRadians(rotation);

    // based on the angle, return the sign (1 if ray points right/down, -1 if left/up) used to travel along the ray to the next grid unit
    let stepX = Math.sign(Math.cos(radians));
    let stepY = Math.sign(Math.sin(radians));

    // calculate horizontal (deltaX) and vertical (deltaY) distance from player.x to next vertical/horizontal grid line
    let deltaX = (stepX > 0)
        ? state.resolution - (state.player.x % state.resolution)
        : (state.player.x % state.resolution);
    let deltaY = (stepY > 0)
        ? state.resolution - (state.player.y % state.resolution)
        : (state.player.y % state.resolution);

    const small = 1e-6; // this is a common way to prevent divide by zero
    const cosAbs = Math.abs(Math.cos(radians)); // basic trigonometry: the absolute value of the cosine of the angle
    const sinAbs = Math.abs(Math.sin(radians));// basic trigonometry: the absolute value of the sine of the angle

    // compute the actual distance (length) of the ray (in the right angle) to the next vertical/horizontal line in the grid (the map)
    let distX = (cosAbs < small) ? Infinity : deltaX / cosAbs;
    let distY = (sinAbs < small) ? Infinity : deltaY / sinAbs;

    // distance between successive vertical (rayStepX) and horizontal (rayStepY) intersections along the ray
    let rayStepX = Math.abs(state.resolution / Math.cos(radians));
    let rayStepY = Math.abs(state.resolution / Math.sin(radians));

    let distance = 0;
    let hit = false;
    let verticalHit = false;
    let rayX = state.player.x;
    let rayY = state.player.y;

    // keep increasing the ray length with the stepX/Y values until a wall is hit or a max distance is reached (as a safety mechanism)
    while (!hit && distance < 1000) {
        if (distX < distY) {
            // it will hit vertical intersection first: move rayX to the next vertical line
            rayX += stepX * state.resolution;
            distance = distX;   // use vertical distance
            distX += rayStepX;  // prepare for the next vertical hit
            verticalHit = true; // sets whether vertical intersection was hit first: needed to do texture mapping later
        } else {
            // it will hit horizontal intersection first: move rayY to the next horizontal line
            rayY += stepY * state.resolution;
            distance = distY;   // use horizontal distance
            distY += rayStepY;  // prepare for the next horizontal hit
            verticalHit = false; // sets whether vertical intersection was hit first: needed to do texture mapping later
        }

        // determine grid indices for the current ray position
        let gridX = Math.floor(rayX / state.resolution);
        let gridY = Math.floor(rayY / state.resolution);

        // calculated grid cell is out of bounds, break the loop
        if (gridX < 0 || gridX >= mapData[0].length ||
            gridY < 0 || gridY >= mapData.length) {
            return { distance, verticalHit };
        }

        // calculated grid cell is a wall unit, break the loop
        if (mapData[gridY][gridX] === 1) {
            hit = true;
            break;
        }
    }

    return { distance, verticalHit };
};

// draw a pseudo-3d projection consisting of 1px-wide segments, based on position and rotation of the player, mapped to the grid in mapData
const drawProjection = () => {
    const rotationStart = state.player.rotation - (state.fieldOfVision / 2);
    const rotationIncrement = state.fieldOfVision / state.rayCount;
    const texture = findImageById('800x600').img;

    for (let ray = 0; ray < state.rayCount; ray++) {
        const rayAngle = rotationStart + (ray * rotationIncrement);
        const hitResult = getShortestRayToWallSegment(rayAngle, ray === 560);
        const hitX = state.player.x + hitResult.distance * Math.cos(toRadians(rayAngle));
        const hitY = state.player.y + hitResult.distance * Math.sin(toRadians(rayAngle));

        let rayLength = normalizeRayLength(hitResult.distance, ray);
        let wallHeight = (state.resolution * 5) / (rayLength / state.resolution); // magic number alert
        let destY, destHeight, srcY, srcHeight;

        // if parts of the bitmap is outside the view area (eg close up to a wall) calculate the portion (clip) that needs to be drawn
        if (wallHeight > 600) {
            let clippedPixels = wallHeight - 600; // how many pixels are off-screen
            destY = 0;
            destHeight = 600;
            srcY = Math.floor((clippedPixels / 2 / wallHeight) * texture.height);
            srcHeight = texture.height - (2 * srcY);
        } else {
            destY = state.player.height - wallHeight / 2;
            destHeight = wallHeight;
            srcY = 0;
            srcHeight = texture.height;
        }

        // calculate the offset (fractional part) of the texture for both horizontal and vertical direction, with the verticalHit variable determining which to use
        let fracX = hitX % state.resolution; // the remainder after dividing the hit coordinate by grid size, eg:
        let fracY = hitY % state.resolution; // if a wall cell is 100px wide and the ray hits 30 pixels from the left edge, the fractional part is 30
        let epsilon = 0.0001;
        let hitOffset;

        // if fracX,fracY are almost equal, select hitOffset based on the angle instead: fracX for nearly horizontal rays and fracY for nearly vertical rays todo: no longer needed?
        if (Math.abs(fracX - fracY) < epsilon) {
            let normAngle = rayAngle % 360;
            if ((normAngle > 45 && normAngle < 135) || (normAngle > 225 && normAngle < 315)) {
                hitOffset = fracX;
            } else {
                hitOffset = fracY;
            }
        } else {
            hitOffset = hitResult.verticalHit ? fracY : fracX;
        }

        // map the hit offset to a coordinate of the texture (based on the texture's width)
        let textureX = Math.floor((hitOffset / state.resolution) * texture.width);

        context.drawImage(
            texture,            // source image
            textureX, srcY,     // source x and y (starting point in texture)
            1, srcHeight,       // source width and height (1px slice of texture)
            ray, destY,         // destination x and y on canvas
            1, destHeight       // destination width and height
        );

        shadeCanvas(context, rayLength, {x: ray, y: destY, w: 1, h: destHeight})
    }
};

const update = () => {
    clearCanvas(context);

    if (state.assetsLoaded) {
        drawProjection();
        handleKeyPresses(state, getNewCoordsForAngle);
    } else if (areAllImageAssetsLoaded()) {
        state.assetsLoaded = true;
    }
};

update();
setInterval(update, 1000 / 60);
