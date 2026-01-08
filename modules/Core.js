import { toRadians } from './Utils.js';
import { findImageById } from './Image.js';
import BitmapSlice from './BitmapSlice.js';

/** removes fish-eye (edge distortions) by adjusting ray length based on its angle to the projection (basic trigonometry) */
const normalizeRayLength = (rayLength, rayIndex, state) => {
    const degreesToPlayerCenter = state.player.rotation - (state.engine.fieldOfVision / 2) + (rayIndex * (state.engine.fieldOfVision / state.engine.rayCount));
    const angleDiff = degreesToPlayerCenter - state.player.rotation;

    return Math.cos(toRadians(angleDiff)) * rayLength;
};

/** returns the shortest ray length to next wall segment / map edge, and the verticalHit boolean (to set fractional coordinate for texture map) */
const getShortestRayToWallSegment = (rayRotation, state, grid) => {
    const rotation = (rayRotation % 360 + 360) % 360; // keeps rotation in range 0 - 360
    const radians = toRadians(rotation);

    // based on the angle, return the sign (1 if ray points right/down, -1 if left/up) used to travel along the ray to the next grid unit
    let stepX = Math.sign(Math.cos(radians));
    let stepY = Math.sign(Math.sin(radians));

    // calculate horizontal (deltaX) and vertical (deltaY) distance from player.x to next vertical/horizontal grid line
    let deltaX = (stepX > 0)
        ? state.engine.resolution - (state.player.x % state.engine.resolution)
        : (state.player.x % state.engine.resolution);
    let deltaY = (stepY > 0)
        ? state.engine.resolution - (state.player.y % state.engine.resolution)
        : (state.player.y % state.engine.resolution);

    const small = 1e-6; // this is a common way to prevent divide by zero
    const cosAbs = Math.abs(Math.cos(radians)); // basic trigonometry: the absolute value of the cosine of the angle
    const sinAbs = Math.abs(Math.sin(radians));// basic trigonometry: the absolute value of the sine of the angle

    // compute the actual distance (length) of the ray (in the right angle) to the next vertical/horizontal line in the grid (the map)
    let distX = (cosAbs < small) ? Infinity : deltaX / cosAbs;
    let distY = (sinAbs < small) ? Infinity : deltaY / sinAbs;

    // distance between successive vertical (rayStepX) and horizontal (rayStepY) intersections along the ray
    let rayStepX = Math.abs(state.engine.resolution / Math.cos(radians));
    let rayStepY = Math.abs(state.engine.resolution / Math.sin(radians));

    let distance = 0;
    let hit = false;
    let verticalHit = false;
    let wallId = null;
    let rayX = state.player.x;
    let rayY = state.player.y;

    // keep increasing the ray length with the stepX/Y values until a wall is hit or a max distance is reached (as a safety mechanism)
    while (!hit && distance < 3000) {
        if (distX < distY) {
            // it will hit vertical intersection first: move rayX to the next vertical line
            rayX += stepX * state.engine.resolution;
            distance = distX;   // use vertical distance
            distX += rayStepX;  // prepare for the next vertical hit
            verticalHit = true; // sets whether vertical intersection was hit first: needed to do texture mapping later
        } else {
            // it will hit horizontal intersection first: move rayY to the next horizontal line
            rayY += stepY * state.engine.resolution;
            distance = distY;    // use horizontal distance
            distY += rayStepY;   // prepare for the next horizontal hit
            verticalHit = false; // sets whether vertical intersection was hit first: needed to do texture mapping later
        }

        // determine grid indices for the current ray position
        let gridX = Math.floor(rayX / state.engine.resolution);
        let gridY = Math.floor(rayY / state.engine.resolution);

        // calculated grid cell is out of bounds, break the loop
        if (gridX < 0 || gridX >= grid[0].length ||
            gridY < 0 || gridY >= grid.length) {
            return { distance, verticalHit: null, wallId };
        }

        // calculated grid cell is a wall unit, break the loop
        if (grid[gridY][gridX] > 0) {
            wallId = grid[gridY][gridX];
            hit = true;

            break;
        }
    }

    return { distance, verticalHit, wallId };
};

/** draw a pseudo-3d projection consisting of 1px-wide wall segments, based on position and rotation of the player, mapped to the grid in mapData */
export const drawWalls = (state, context, grid, data) => {
    const rotationStart = state.player.rotation - (state.engine.fieldOfVision / 2);
    const rotationIncrement = state.engine.fieldOfVision / state.engine.rayCount;
    const textureHeight = 600; // need to hard-code this since the actual texture is unknown at this point

    for (let ray = 0; ray < state.engine.rayCount; ray++) {
        const rayAngle = rotationStart + (ray * rotationIncrement);
        const hitResult = getShortestRayToWallSegment(rayAngle, state, grid);
        const hitX = state.player.x + hitResult.distance * Math.cos(toRadians(rayAngle));
        const hitY = state.player.y + hitResult.distance * Math.sin(toRadians(rayAngle));

        let rayLength = normalizeRayLength(hitResult.distance, ray, state);
        let wallHeight = (state.engine.resolution * 5) / (rayLength / state.engine.resolution); // magic number alert
        let destY, destHeight, srcY, srcHeight;

        // if parts of the bitmap is outside the view area (eg close up to a wall) calculate the portion (clip) that needs to be drawn
        if (wallHeight > 600) {
            let clippedPixels = wallHeight - 600; // how many pixels are off-screen
            destY = 0;
            destHeight = 600;
            srcY = Math.floor((clippedPixels / 2 / wallHeight) * textureHeight);
            srcHeight = textureHeight - (2 * srcY);
        } else {
            destY = state.player.height - wallHeight / 2;
            destHeight = wallHeight;
            srcY = 0;
            srcHeight = textureHeight;
        }

        // calculate the offset (fractional part) of the texture for both horizontal and vertical direction, with the verticalHit variable determining which to use
        let fracX = hitX % state.engine.resolution; // the remainder after dividing the hit coordinate by grid size, eg:
        let fracY = hitY % state.engine.resolution; // if a wall cell is 100px wide and the ray hits 30 pixels from the left edge, the fractional part is 30
        let epsilon = 0.0001;
        let hitOffset;

        // if fracX,fracY are almost equal, select hitOffset based on the angle instead: fracX for nearly horizontal rays and fracY for nearly vertical rays
        // todo: no longer needed?
        if (Math.abs(fracX - fracY) < epsilon) {
            console.log('if you see this, this code is still needed and you can remove the comment')
            let normAngle = rayAngle % 360;
            if ((normAngle > 45 && normAngle < 135) || (normAngle > 225 && normAngle < 315)) {
                hitOffset = fracX;
            } else {
                hitOffset = fracY;
            }
        } else {
            if (hitResult.verticalHit !== null) {
                hitOffset = hitResult.verticalHit ? fracY : fracX;
            }
        }

        let texture;

        if (hitResult.wallId) {
            texture = findImageById(data.textures.walls[hitResult.wallId]).img;

            // map the hit offset to a coordinate of the texture (based on the texture's width)
            let textureX = Math.floor((hitOffset / state.engine.resolution) * texture.width);

            context.drawImage(
                texture,            // source image
                textureX, srcY,     // source x and y (starting point in texture)
                1, srcHeight,       // source width and height (1px slice of texture)
                ray, destY,         // destination x and y on canvas
                1, destHeight       // destination width and height
            );
            if (data.fog?.color) {
                if (hitResult.verticalHit !== null) {
                    context.fillStyle = data.fog.color;
                    context.globalAlpha = rayLength / 800; // the further, the darker. so, the higher rayLength, the darker.
                    context.fillRect(ray, destY - 1, 1, destHeight + 2);
                    context.globalAlpha = 1;
                }
            }
        }

        // store the computed ray lengths in state (the enemy drawing makes use of this)
        state.wallDepthBuffer[ray] = rayLength;
    }
};

/** renders the floor using scaled bitmap slices to create a pseudo-3d effect (re-used my mario kart routine here) */
export const drawFloor = (state, context, data) => {
    const scaleAmplitude = 0.1; // controls the zoom level of the texture. should be directly related to translationSpeed! (safe: 0.1)

    const cfg = {
        startScale: 0.5,
        scaleAmplitude,
        translationSpeed: 2.92, // controls the movement of the texture. should be directly related to scaleAmplitude! (safe: 3)
        dimensions: {
            startX: 0, // start x pos of the slice
            endX: state.engine.width,
            startY: state.player.height, // start y pos of the slice (horizon)
            endY: state.engine.height,
            offsetX: 1095, // offset to shift the texture (after rotating) to make it fit the grid layout perfectly (magic numbers)
            offsetY: -590
        },
        pixelsPerSlice: 1,
        pivotPoint: { x: state.engine.width / 2, y: (state.engine.height / 2) + 600 } // to align with ray casting, the vantage point should be distant, not at the bottom
    };

    const sliceCount = (cfg.dimensions.endY - cfg.dimensions.startY) / cfg.pixelsPerSlice;

    for (let index = 0; index < sliceCount; index++ ) {
        let slice = new BitmapSlice(
            context,
            findImageById(data.textures.floor)
        );

        slice.draw(
            cfg,
            state.player,
            index
        );

        if (data.fog?.color) {
            context.fillStyle = data.fog.color;
            context.globalAlpha = (1 - (index / 300));
            context.fillRect(0, 300 + index, 800, 1);
            context.globalAlpha = 1.0;
        }
    }
};
