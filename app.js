import { level1 } from './constants/level1.js';
import { clearCanvas, shadeCanvas } from './utils/Canvas.js';
import { playSound } from './utils/Sound.js';
import { findImageById, areAllImageAssetsLoaded } from './utils/Image.js';
import createInputHandlers, { KEYCODE_LEFT, KEYCODE_RIGHT, KEYCODE_UP, KEYCODE_DOWN, KEYCODE_SHIFT } from './utils/Input.js';
import { handleKeyPresses } from './utils/Input.js';
import { toRadians, sortBy } from './utils/Utils.js';
import BitmapSlice from './components/BitmapSlice.js';
import Shell from './utils/Shell.js';
import Enemy from './utils/Enemy.js';
import { positionedText } from './utils/Type.js';

const context = document.getElementById('canvas').getContext('2d');
context.imageSmoothingEnabled = false;
context.mozImageSmoothingEnabled = false;
context.webkitImageSmoothingEnabled = false;
context.msImageSmoothingEnabled = false;

const state = {
    player: {
        x: 950,
        y: 200,
        rotation: 0,
        speed: 3,
        height: 300, // vertical viewing angle
        bop: 0,
        energy: 100
    },
    engine: {
        width: 800,
        height: 600,
        rayCount: 800, // 1x1 pixel mode
        fieldOfVision: 55,
        resolution: 100 // configure each grid cell to be 100x100 pixels
    },
    gun: {
        position: { x: 560, y: 350 },
        target: { x: 560, y: 350 },
        count: 100,
        splitTimer: 0, // timeout between shots
        shells: [],
        killedOffset: 0,
        weaponPower: 10
    },
    controls: {
        upHeld: false,
        downHeld: false,
        rightHeld: false,
        leftHeld: false,
        fireHeld: false
    },
    enemies: [],
    assetsLoaded: false,
    wallDepthBuffer: [],
    scene: 'game'
};

window.addEventListener(
    "keydown",
    event => {
        if ([KEYCODE_LEFT, KEYCODE_RIGHT, KEYCODE_UP, KEYCODE_DOWN, KEYCODE_SHIFT].includes(event.keyCode)) {
            event.preventDefault();
        }
    });

const { handleKeyDown, handleKeyUp } = createInputHandlers(state);

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

/** removes fish-eye (edge distortions) by adjusting ray length based on its angle to the projection (basic trigonometry) */
const normalizeRayLength = (rayLength, rayIndex) => {
    const degreesToPlayerCenter = state.player.rotation - (state.engine.fieldOfVision / 2) + (rayIndex * (state.engine.fieldOfVision / state.engine.rayCount));
    const angleDiff = degreesToPlayerCenter - state.player.rotation;

    return Math.cos(toRadians(angleDiff)) * rayLength;
};

/** returns the shortest ray length to next wall segment / map edge, and the verticalHit boolean (to set fractional coordinate for texture map) */
const getShortestRayToWallSegment = (rayRotation) => {
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
        if (gridX < 0 || gridX >= level1[0].length ||
            gridY < 0 || gridY >= level1.length) {
            return { distance, verticalHit: null };
        }

        // calculated grid cell is a wall unit, break the loop
        if (level1[gridY][gridX] === 1) {
            hit = true;
            break;
        }
    }

    return { distance, verticalHit };
};

/** renders a gun-in-hand and make it move dynamically, whilst also applying the head-bop effect */
const drawGun = () => {
    const interpolate = (start, end, t) => start + (end - start) * t;
    const gun = findImageById('gun-hand').img;
    const smoothing = 5;
    const threshold = 0.5;

    // snap to target position when close enough, then deplete the timer, then set new random coordinates and reset timer
    if (Math.abs(state.gun.position.x - state.gun.target.x) < threshold && Math.abs(state.gun.position.y - state.gun.target.y) < threshold) {
        state.gun.position.x = state.gun.target.x;
        state.gun.position.y = state.gun.target.y;
        state.gun.count--;

        if (state.gun.count < 0) {
            state.gun.target.x = 560 + (Math.random() * 20 - 10);
            state.gun.target.y = 350 + (Math.random() * 20 - 10);
            state.gun.count = 100;
        }
    } else {
        state.gun.position.x = interpolate(state.gun.position.x, state.gun.target.x, 1 / smoothing);
        state.gun.position.y = interpolate(state.gun.position.y, state.gun.target.y, 1 / smoothing);
    }

    if (state.controls.fireHeld && state.gun.splitTimer <= 0) {
        context.globalAlpha = 0.3;
        clearCanvas(context, '#FAF89D');
        context.globalAlpha = 1;

        // gun flash
        const gradient = context.createRadialGradient(680, 380, 0, 600, 400, 500);
        gradient.addColorStop(0, "rgba(255, 255, 0, 1)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(600, 400, 500, 0, Math.PI * 2);
        context.fill();

        state.gun.splitTimer = 25;
        playSound('assets/sounds/gunshot.mp3');
        const vx = Math.random() * 2 - 1; // velocity
        const vy = -Math.random(); // (initial) upward speed
        state.gun.shells.push(new Shell(640, 420, vx, vy));
    }

    context.save();

    // rotate the gun hand depending on the gun animation countdown
    if (state.gun.splitTimer > 0) {
        context.translate(800,600);
        context.rotate(toRadians(state.gun.splitTimer / 2));
        context.translate(-800,-600);
        state.gun.splitTimer-=1;
    }

    context.translate(0, (Math.sin(state.player.bop) * 15));
    context.drawImage(gun, state.gun.position.x, state.gun.position.y);
    context.restore();
};

const drawGunShells = () => {
    state.gun.shells.forEach(shell => {
        shell.update();
        shell.draw(context);
    });

    // remove shells that have moved off-screen (y > 600)
    state.gun.shells = state.gun.shells.filter(shell => shell.y <= 600);
};

const depleteEnergy = (value) => {
    state.player.energy -= value;
}

const drawEnemies = () => {
    const maxVisibleDistance = 600;    // Beyond this, enemy isn't drawn.
    const shootingRange = 250;         // Enemies shoot if within this distance
    const projectionPlaneDistance = (state.engine.width / 2) / Math.tan(toRadians(state.engine.fieldOfVision / 2));
    const scaleModifier = 0.2;         // Magic number for overall sprite scaling.

    // Sort enemies by distance to the player.
    sortBy(state.enemies, (enemy) => {
        const dx = enemy.x - state.player.x;
        const dy = enemy.y - state.player.y;
        return Math.sqrt(dx * dx + dy * dy);
    });

    state.enemies.forEach(enemy => {

        // calculate distance to enemy
        const deltaX = enemy.x - state.player.x;
        const deltaY = enemy.y - state.player.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const playerAngleRad = toRadians(state.player.rotation);

        // compute forward (how far in front) and right (side offset) using dot and cross concepts (this is a common concept so I used chatGPT to apply)
        const forward = deltaX * Math.cos(playerAngleRad) + deltaY * Math.sin(playerAngleRad);
        const right = -deltaX * Math.sin(playerAngleRad) + deltaY * Math.cos(playerAngleRad);

        // always update enemy movement (even if off-screen)
        enemy.update(forward);

        const frameWidth = 204;
        const spriteScale = (projectionPlaneDistance / forward) * scaleModifier;
        const enemyImage = findImageById(enemy.type).img;
        const frameHeight = enemyImage.height;
        const spriteHeight = frameHeight * spriteScale;
        const spriteWidth = frameWidth * spriteScale;
        const enemyAngle = Math.atan2(right, forward);
        const screenX = (state.engine.width / 2) + Math.tan(enemyAngle) * projectionPlaneDistance - spriteWidth / 2;
        const screenY = (state.engine.height / 2) - spriteHeight / 2;
        const halfFOV = toRadians(state.engine.fieldOfVision / 2);

        // only draw enemy if it is in front and within visible distance
        if (forward > 0 && forward < maxVisibleDistance) {
            if (Math.abs(enemyAngle) <= halfFOV) {
                drawEnemySpriteWithOcclusion(
                    enemyImage,
                    frameWidth,
                    frameHeight,
                    screenX,
                    screenY,
                    spriteWidth,
                    spriteHeight,
                    forward,
                    enemy,
                    maxVisibleDistance
                );

                // oh and if the player is shooting, deplete energy, too
                if (enemy.state !== 'dead' && state.gun.splitTimer > 23) {
                    // player is shooting at enemy as its being drawn, drain energy
                    enemy.energy-=state.gun.weaponPower;

                    if (enemy.energy <= 0) {
                        enemy.state = 'dead';
                        playSound('assets/sounds/death-robot.mp3');
                    }
                }

            }
        }

        if (enemy.state === 'dead') {
            return;
        }

        // if the enemy is still alive and within range (regardless of whether it’s in front) it should shoot
        if (distance < shootingRange) {
            if (forward > 0) {
                const enemyCenterColumn = Math.floor(screenX + (spriteWidth / 2));

                if (
                    enemyCenterColumn >= 0 &&
                    enemyCenterColumn < state.engine.width &&
                    forward < state.wallDepthBuffer[enemyCenterColumn]
                ) {
                    enemy.shoot(screenX, depleteEnergy); // shoot with flash
                }
            } else {
                enemy.shoot(null, depleteEnergy); // shoot without flash
            }
        } else {
            enemy.state = 'walk';
        }
    });
};

/** draws each vertical column of enemy sprite and checks if it should be positioned in front of a wall segment in the corresponding view column */
const drawEnemySpriteWithOcclusion = (
    enemyImage,
    frameWidth,
    frameHeight,
    screenX,
    screenY,
    spriteWidth,
    spriteHeight,
    enemyDepth,
    enemy,
    maxVisibleDistance
) => {
    for (let x = 0; x < spriteWidth; x++) {
        const screenColumn = Math.floor(screenX + x);
        if (
            screenColumn >= 0 &&
            screenColumn < state.engine.width &&
            enemyDepth < state.wallDepthBuffer[screenColumn]
        ) {
            // Calculate source column offset based on the current animation frame.
            const sourceX = Math.floor((x / spriteWidth) * frameWidth) + (204 * enemy.currentFrame);
            context.globalAlpha = 1.25 - (enemyDepth / maxVisibleDistance);
            context.drawImage(
                enemyImage,
                sourceX, 0,         // Source x, y.
                1, frameHeight,     // Source width, height (one vertical slice).
                screenColumn, screenY + 10, // Destination x, y (with fine-tuning offset).
                1, spriteHeight     // Destination width, height.
            );
            context.globalAlpha = 1;
        }
    }
};


/** renders a top-down map of the viewable area with a line representing the viewing angle */
const drawMiniMap = () => {
    const minimapSize = 150;
    const cellDisplaySize = 20; // each grid cell appears as 20x20
    const scaleFactor = cellDisplaySize / state.engine.resolution;
    const minimapCenter = { x: minimapSize / 2, y: minimapSize / 2 };
    const gridDisplayRadius = 5; // how many units to show top/down/right/left
    const playerGridX = Math.floor(state.player.x / state.engine.resolution);
    const playerGridY = Math.floor(state.player.y / state.engine.resolution);

    context.save();

    // center
    context.translate(state.engine.width / 2 - (minimapSize / 2), 10);

    // clip
    context.beginPath();
    context.arc(minimapSize/2, minimapSize/2, minimapSize/2, 0, Math.PI * 2);
    context.clip();

    // background
    context.fillStyle = '#074506';
    context.globalAlpha = 0.25;
    context.fillRect(0, 0, minimapSize, minimapSize);

    // walls as a unified shape / path
    context.fillStyle = '#4FD34B';
    context.beginPath();
    for (let row = playerGridY - gridDisplayRadius; row <= playerGridY + gridDisplayRadius; row++) {
        for (let col = playerGridX - gridDisplayRadius; col <= playerGridX + gridDisplayRadius; col++) {
            if (row >= 0 && row < level1.length && col >= 0 && col < level1[0].length) {
                if (level1[row][col] === 1) {
                    // get world coordinates of the cell's top-left corner.
                    const worldX = col * state.engine.resolution;
                    const worldY = row * state.engine.resolution;

                    // convert world coordinates to minimap coordinates by subtracting the players exact position and then scaling
                    const miniX = minimapCenter.x + (worldX - state.player.x) * scaleFactor;
                    const miniY = minimapCenter.y + (worldY - state.player.y) * scaleFactor;
                    context.rect(miniX, miniY, cellDisplaySize, cellDisplaySize);
                }
            }
        }
    }
    context.fill();

    // player
    context.fillStyle = '#ffffff';
    context.fillRect(minimapCenter.x - 1, minimapCenter.y - 1, 2, 2);

    // line of sight
    const toRadians = (deg) => deg * Math.PI / 180;
    const lineLengthMinimap = 500 * scaleFactor;
    const endX = minimapCenter.x + Math.cos(toRadians(state.player.rotation)) * lineLengthMinimap;
    const endY = minimapCenter.y + Math.sin(toRadians(state.player.rotation)) * lineLengthMinimap;
    context.strokeStyle = '#B8FFC2';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(minimapCenter.x, minimapCenter.y);
    context.lineTo(endX, endY);
    context.stroke();
    context.restore();
};

/** renders the floor using scaled bitmap slices to create a pseudo-3d effect */
const drawFloor = () => {
    const scaleAmplitude = 0.1; // controls the zoom level of the texture. should be directly related to translationSpeed! safe: 0.1

    const cfg = {
        startScale: 0.5,
        scaleAmplitude,
        translationSpeed: 2.92, // the higher, the SLOWER controls the movement of the texture. should be directly related to scaleAmplitude! safe: 3
        dimensions: {
            startX: 0, // start x pos of the slice
            endX: state.engine.width,
            startY: state.player.height, // start y pos of the slice (horizon)
            endY: state.engine.height,
            offsetX: 1080, // offset to shift the texture (after rotating) to make it fit the grid layout perfectly (magic numbers)
            offsetY: -590
        },
        pixelsPerSlice: 1,
        pivotPoint: { x: state.engine.width / 2, y: (state.engine.height / 2) + 600 } // to align with ray casting, the vantage point should be distant, not at the bottom
    };

    const sliceCount = (cfg.dimensions.endY - cfg.dimensions.startY) / cfg.pixelsPerSlice;

    for (let index = 0; index < sliceCount; index++ ) {
        let slice = new BitmapSlice(
            context,
            findImageById('floor-1500-a')
        );

        slice.draw(
            cfg,
            state.player,
            index
        );

        context.fillStyle = "#000000";
        context.globalAlpha = (1 - (index / 300));
        context.fillRect(0, 300 + index,800,1);
        context.globalAlpha = 1.0;
    }
};

/** draw a pseudo-3d projection consisting of 1px-wide segments, based on position and rotation of the player, mapped to the grid in mapData */
const drawProjection = () => {
    const rotationStart = state.player.rotation - (state.engine.fieldOfVision / 2);
    const rotationIncrement = state.engine.fieldOfVision / state.engine.rayCount;
    const texture = findImageById('wall').img;

    for (let ray = 0; ray < state.engine.rayCount; ray++) {
        const rayAngle = rotationStart + (ray * rotationIncrement);
        const hitResult = getShortestRayToWallSegment(rayAngle, ray === 560);
        const hitX = state.player.x + hitResult.distance * Math.cos(toRadians(rayAngle));
        const hitY = state.player.y + hitResult.distance * Math.sin(toRadians(rayAngle));

        let rayLength = normalizeRayLength(hitResult.distance, ray);
        let wallHeight = (state.engine.resolution * 5) / (rayLength / state.engine.resolution); // magic number alert
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
        let fracX = hitX % state.engine.resolution; // the remainder after dividing the hit coordinate by grid size, eg:
        let fracY = hitY % state.engine.resolution; // if a wall cell is 100px wide and the ray hits 30 pixels from the left edge, the fractional part is 30
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
            if (hitResult.verticalHit !== null) {
                hitOffset = hitResult.verticalHit ? fracY : fracX;
            }
        }

        // map the hit offset to a coordinate of the texture (based on the texture's width)
        let textureX = Math.floor((hitOffset / state.engine.resolution) * texture.width);

        context.drawImage(
            texture,            // source image
            textureX, srcY,     // source x and y (starting point in texture)
            1, srcHeight,       // source width and height (1px slice of texture)
            ray, destY,         // destination x and y on canvas
            1, destHeight       // destination width and height
        );

        if (hitResult.verticalHit !== null) {
            // shadeCanvas(context, rayLength / 2, {x: ray, y: destY, w: 1, h: destHeight})

            context.fillStyle = "#000000";
            context.globalAlpha = rayLength / 500; // the further, the darker. so, the higher rayLength, the darker.
            context.fillRect(ray,destY-1,1,destHeight+2);
            context.globalAlpha = 1.0;
        }

        // store the computed ray lengths in state (the enemy drawing makes use of this)
        state.wallDepthBuffer[ray] = rayLength;
    }
};

const fadeToGameOverScene = () => {
    const gun = findImageById('gun-hand').img;

    if (state.gun.killedOffset === 0) { playSound('assets/sounds/death.mp3') }

    state.gun.killedOffset+=1;
    state.player.height-=0.3;
    context.save();
    context.translate(800,600 + state.gun.killedOffset);
    context.rotate(toRadians(40));
    context.translate(-800,-600);
    context.drawImage(gun, 560, 380);
    context.restore();
    context.globalAlpha = state.gun.killedOffset / 50;
    context.fillStyle = "#000000";
    context.fillRect(0, 0, 800, 600);

    if (state.gun.killedOffset > 100) {
        context.globalAlpha = 0;
        state.scene = 'game-over';
    }
}

const drawGameOver = () => {
    context.globalAlpha += 0.001;
    positionedText({ context, text: 'GAME OVER', y: 280, font: "120px Butcherman", color: '#dd0000' });
}

const update = () => {
    clearCanvas(context, '#000000');
    if (state.assetsLoaded) {
        switch(state.scene) {
            case 'preload': {
                break;
            }
            case 'intro': {
                break;
            }
            case 'start': {
                break;
            }
            case 'game': {
                drawFloor();
                drawProjection();

                if (state.player.energy <= 0) { return fadeToGameOverScene() }

                drawEnemies();
                drawGun();
                drawGunShells();
                drawMiniMap();
                handleKeyPresses(state);
                break;
            }
            case 'game-over': {
                drawGameOver();
                break;
            }
            default:
                break;
        }

    } else if (areAllImageAssetsLoaded()) {
        state.assetsLoaded = true;
        playSound('assets/sounds/level1.mp3');

        // add enemies on load
        state.enemies.push(new Enemy(1450, 400, 'enemy-a', [
            { endX : 1450, endY: 400 },
            { endX : 1450, endY: 200 },
            { endX : 250, endY: 200 },
            { endX : 250, endY: 600 },
        ], context, 5));
        state.enemies.push(new Enemy(250, 200, 'enemy-a', [
            { endX : 250, endY: 200 },
            { endX : 250, endY: 600 },
        ], context, 5));
    }
};

update();
setInterval(update, 1000 / 60);
