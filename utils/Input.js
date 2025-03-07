export const KEYCODE_LEFT = 37;
export const KEYCODE_RIGHT = 39;
export const KEYCODE_UP = 38;
export const KEYCODE_DOWN = 40;

export const handleKeyPresses = (state, getNewCoordsForAngle) => {
    const player = state.player;

    if (state.upHeld || state.downHeld) {
        const newCoords = getNewCoordsForAngle(
            player.x,
            player.y,
            player.rotation,
            state.upHeld ? player.speed : -player.speed
        );
        player.x = newCoords[0];
        player.y = newCoords[1];
    }

    if (state.leftHeld) {
        player.rotation -= player.speed;
        if (player.rotation < 0) {
            player.rotation += 360;
        }
    }

    if (state.rightHeld) {
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
                state.rightHeld = false;
                state.leftHeld = true;
                break;
            case KEYCODE_RIGHT:
                state.leftHeld = false;
                state.rightHeld = true;
                break;
            case KEYCODE_UP:
                state.downHeld = false;
                state.upHeld = true;
                break;
            case KEYCODE_DOWN:
                state.upHeld = false;
                state.downHeld = true;
                break;
        }
    };

    const handleKeyUp = (event) => {
        switch (event.keyCode) {
            case KEYCODE_LEFT:
                state.leftHeld = false;
                break;
            case KEYCODE_RIGHT:
                state.rightHeld = false;
                break;
            case KEYCODE_UP:
                state.upHeld = false;
                break;
            case KEYCODE_DOWN:
                state.downHeld = false;
                break;
        }
    };

    return { handleKeyDown, handleKeyUp };
}
