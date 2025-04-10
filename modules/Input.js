import { toRadians } from './Utils.js';

export const KEYCODE_LEFT = 37;
export const KEYCODE_RIGHT = 39;
export const KEYCODE_UP = 38;
export const KEYCODE_DOWN = 40;
export const KEYCODE_SHIFT = 16;

/** check if given x,y is on a non-traversable tile in the grid array */
const checkWallCollision = (x, y, grid) => {
    const gridX = Math.floor(x / 100);
    const gridY = Math.floor(y / 100);

    if (
        gridX < 0 || gridY < 0 ||
        gridX >= grid[0].length || gridY >= grid.length ||
        grid[gridY][gridX] > 0
    ) {
        return true;
    }

    return false;
};

/** returns new coordinates for given starting point, angle, and distance/length */
const getNewCoordsForAngle = (x, y, rotation, length) => {
    return [
        x + length * Math.cos(toRadians(rotation)),
        y + length * Math.sin(toRadians(rotation))
    ];
};

export const handleKeyPresses = (state, grid) => {
    const player = state.player;

    if (state.controls.upHeld || state.controls.downHeld) {

        // increase the head bopping effect
        state.player.bop+=0.15;

        const newCoords = getNewCoordsForAngle(
            player.x,
            player.y,
            player.rotation,
            state.controls.upHeld ? player.speed : -player.speed
        );
        if (!checkWallCollision(newCoords[0], newCoords[1], grid)) {
            player.x = newCoords[0];
            player.y = newCoords[1];
        }
    }

    if (state.controls.leftHeld) {
        player.rotation -= player.speed;
        if (player.rotation < 0) {
            player.rotation += 360;
        }
    }

    if (state.controls.rightHeld) {
        player.rotation += player.speed;
        if (player.rotation >= 360) {
            player.rotation -= 360;
        }
    }
};

/**
 * Check if there is a context provided matching the clicked mouse coordinates, then execute its associated action
 */
export const mouseDownHandler = (event, state) => {
    state.mouseDown = true;

    let mouseX = (event.clientX - document.getElementById("canvas").offsetLeft);
    let mouseY = (event.clientY - document.getElementById("canvas").offsetTop);

    if (mouseX < 0 || mouseX > 800 || mouseY < 0 || mouseY > 600) {
        return false;
    } else {
        state.mouseX = mouseX;
        state.mouseY = mouseY;
        state.clickableContexts.map(clickableContext => {
            if (mouseX > clickableContext.x
                && mouseX < clickableContext.x + clickableContext.width
                && mouseY > clickableContext.y
                && mouseY < clickableContext.y + clickableContext.height
            ) {

                // store action in state so it runs as long as mouseup event is not triggered
                if (clickableContext.repeat) {
                    state.mouseDownAction = () => { clickableContext.action(); };
                }

                clickableContext.action();
            }
        });
    }
}

/**
 * Cancels the mousedown and removes the stored action
 */
export const mouseUpHandler = (event, state) => {
    state.mouseDown = false;
    state.mouseDownAction = null;
};

export function createButton(context, x, y, w, h, fill, color, text, font) {
    const textWidth = context.measureText(text).width;

    context.font = font;

    context.translate(x, y);
    context.fillStyle = fill;
    context.fillRect(0,0, w, h);
    context.translate(-x, -y);

    // text
    context.fillStyle = color;
    context.fillText(text, x + ((w - textWidth) / 2), y + (h/2) + 7); // extra margin was needed
}

export default function createInputHandlers(state) {
    const handleKeyDown = (event) => {
        switch (event.keyCode) {
            case KEYCODE_LEFT:
                state.controls.rightHeld = false;
                state.controls.leftHeld = true;
                break;
            case KEYCODE_RIGHT:
                state.controls.leftHeld = false;
                state.controls.rightHeld = true;
                break;
            case KEYCODE_UP:
                state.controls.downHeld = false;
                state.controls.upHeld = true;
                break;
            case KEYCODE_DOWN:
                state.controls.upHeld = false;
                state.controls.downHeld = true;
                break;
            case KEYCODE_SHIFT:
                state.controls.fireHeld = true;
                break;
        }
    };

    const handleKeyUp = (event) => {
        switch (event.keyCode) {
            case KEYCODE_LEFT:
                state.controls.leftHeld = false;
                break;
            case KEYCODE_RIGHT:
                state.controls.rightHeld = false;
                break;
            case KEYCODE_UP:
                state.controls.upHeld = false;
                break;
            case KEYCODE_DOWN:
                state.controls.downHeld = false;
                break;
            case KEYCODE_SHIFT:
                state.controls.fireHeld = false;
                state.hand.splitTimer = 0;
                break;
        }
    };

    return { handleKeyDown, handleKeyUp, createButton };
}
