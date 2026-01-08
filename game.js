import { levels } from './constants/Levels.js';
import Scenes from './constants/Scenes.js';
import { clearCanvas } from './modules/Canvas.js';
import { areAllImageAssetsLoaded } from './modules/Image.js';
import createInputHandlers, { KEYCODE_LEFT, KEYCODE_RIGHT, KEYCODE_UP, KEYCODE_DOWN, KEYCODE_SHIFT } from './modules/Input.js';
import { handleKeyPresses } from './modules/Input.js';
import { drawHand } from './modules/Hand.js';
import { drawWalls, drawFloor } from './modules/Core.js';
import { drawEnemies } from './modules/Enemy.js';
import { drawMiniMap } from './modules/MiniMap.js';
import { drawSky } from './modules/Sky.js';
import { drawWater } from './modules/Water.js';
import { weatherParticles, helicopter } from './modules/Effects.js';
import { mouseDownHandler, mouseUpHandler } from './modules/Input.js';
import { preload, intro, title, prelude, restart, dead } from './modules/Screen.js';
import { playMusic, playSound, stopMusic } from "./modules/Sound.js";

// import classes
import Particle from './modules/Particle.js';
import Enemy from './modules/Enemy.js';

const context = document.getElementById('canvas').getContext('2d');
context.imageSmoothingEnabled = false;
context.mozImageSmoothingEnabled = false;
context.webkitImageSmoothingEnabled = false;
context.msImageSmoothingEnabled = false;

const state = {
    player: {
        x: 150, // see override in levels.js
        y: 150,
        rotation: 0,
        speed: 3,
        height: 300, // vertical viewing angle
        bop: 0, // bouncing effect
        energy: 100
    },
    engine: {
        width: 800,
        height: 600,
        rayCount: 800, // equal to width = 1x1 pixel mode
        fieldOfVision: 55,
        resolution: 100 // configure each grid cell to be 100x100 pixels
    },
    hand: {
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
    scenes: {
        currentScene: Scenes.PRELOAD,
        intro: {
            timeOut: 0,
        },
        title: {
            signalOffset: 0,
        },
        prelude: {
            timeOut: 0
        },
        game: {
            level: 1,
            weatherParticles: [],
            counter: 0
        }
    },
    enemies: [],
    assetsLoaded: false,
    wallDepthBuffer: [],
    clickableContexts: [],
    currentTrack: null
};

window.addEventListener(
    "keydown",
    event => {
        if ([KEYCODE_LEFT, KEYCODE_RIGHT, KEYCODE_UP, KEYCODE_DOWN, KEYCODE_SHIFT].includes(event.keyCode)) {
            event.preventDefault();
        }
    });

const { handleKeyDown, handleKeyUp } = createInputHandlers(state);

/** register global event listeners **/
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
window.addEventListener('mousedown', event => mouseDownHandler(event, state) );
window.addEventListener('mouseup', event => mouseUpHandler(event, state) )

// todo: can the particle method be reused here?
const drawGunShells = () => {
    state.hand.shells.forEach(shell => {
        shell.update();
        shell.draw(context);
    });

    // remove shells that have moved off-screen (y > 600)
    state.hand.shells = state.hand.shells.filter(shell => shell.y <= 600);
};

/** loads and sets up all the properties that make up the level (runs only once) **/
const setUpLevel = () => {

    // reset
    context.globalAlpha = 1;
    state.clickableContexts = [];

    state.scenes.currentScene = Scenes.LEVEL;

    const { enemies, data } = levels[state.scenes.game.level];

    state.scenes.prelude.timeOut = 0;
    state.player.x = data.player.x;
    state.player.y = data.player.y;
    state.player.rotation = data.player.rotation;

    // set up enemy state
    enemies.forEach(enemy => {
        state.enemies.push(new Enemy(
            context,
            enemy
        ));
    })

    // set up weather state
    for (let i = 0; i < 100; i++) {
        state.scenes.game.weatherParticles.push(
            new Particle(
            Math.random() * 3200, // the width of the entire 360 degree world (4 * 800)
            0 - (Math.random() * state.engine.height),
            1 + (2 * Math.random())
        ));
    }

    // sound configuration
    if (state.scenes.game.level === 1) {
        playSound('assets/sounds/helicopter.mp3');
    }

    stopMusic(state);
    setTimeout(() => {
        playMusic('assets/sounds/level1.mp3', state);
    }, 5000)
}

/** handles level-specific special effects **/
const drawLevelEffects  = () => {
    switch (state.scenes.game.level) {
        case 1:

            // prevent snow falling on inside section
            if (state.player.x > 2700 || state.player.y < 2400) {
                weatherParticles(context, state);
            }

            // helicopter moving away from player
            if (state.scenes.game.counter < 500) {
                helicopter(context, state);
            }

            // move to level 2
            if (state.player.x > 900 && state.player.x < 1000 && state.player.y > 4250) {
                state.scenes.game.level = 2;
                state.scenes.currentScene = Scenes.PRELUDE;
            }
            break;
        default:
            break;
    }
}

const update = () => {
    const { grid, enemies, data } = levels[state.scenes.game.level];

    if (state.assetsLoaded) {
        switch(state.scenes.currentScene) {
            case Scenes.PRELOAD: {
                clearCanvas(context);
                preload(context);
                break;
            }
            case Scenes.INTRO: {
                clearCanvas(context);
                intro(context, state);
                break;
            }
            case Scenes.TITLE: {
                clearCanvas(context);
                title(context, state);
                break;
            }
            case Scenes.PRELUDE: {
                clearCanvas(context);
                prelude(context, state, setUpLevel);
                break;
            }
            case Scenes.LEVEL: {
                state.scenes.game.counter++;
                clearCanvas(context, data.fog?.color);
                drawSky(context, state, data);
                drawWater(context, state, data);
                drawFloor(state, context, data);
                drawWalls(state, context, grid, data);
                drawEnemies(context, state);
                drawHand(state, context);
                drawGunShells();
                drawLevelEffects();
                drawMiniMap(context, state, grid);
                handleKeyPresses(state, grid);
                break;
            }
            case Scenes.DEAD: {
                clearCanvas(context, data.fog?.color);
                drawSky(context, state, data);
                drawFloor(state, context, data);
                drawWalls(state, context, grid, data);
                dead(context, state);
                break;
            }
            case Scenes.RESTART: {
                restart(context);
                break;
            }
            default:
                break;
        }
    } else if (areAllImageAssetsLoaded()) {
        state.assetsLoaded = true;
        state.scenes.intro.timeOut = 0;
        state.scenes.currentScene = Scenes.INTRO;
        stopMusic(state);
        playMusic('assets/sounds/start.mp3', state);
    }
};

update();
setInterval(update, 1000 / 60);
