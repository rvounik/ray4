import { toRadians } from './Utils.js';
import { level1 } from '../constants/level1.js';

export const KEYCODE_LEFT = 37;
export const KEYCODE_RIGHT = 39;
export const KEYCODE_UP = 38;
export const KEYCODE_DOWN = 40;

/** check if given x,y is on a non-traversable tile in the grid array */
const checkWallCollision = (x, y) => {
    const gridX = Math.floor(x / 100);
    const gridY = Math.floor(y / 100);

    if (
        gridX < 0 || gridY < 0 ||
        gridX >= level1[0].length || gridY >= level1.length ||
        level1[gridY][gridX] === 1
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

export const handleKeyPresses = (state) => {
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
        if (!checkWallCollision(newCoords[0], newCoords[1])) {
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
        }
    };

    return { handleKeyDown, handleKeyUp };
}
