import { positionedText } from "./Type.js";
import { addClickableContext } from "./Canvas.js";
import Scenes from "../constants/Scenes.js";
import { playMusic, playSound, stopMusic } from "./Sound.js";
import { findImageById } from "./Image.js";
import { toRadians } from "./Utils.js";

export const preload = (context) => {
    positionedText({ context, text: 'LOADING', y: 280, font: "24px Arial", color: '#ffffff' });
}

export const intro = (context, state) => {
    context.save();
    positionedText({ context, text: 'Scientists discover a strange audio signal.', x: 25, y: 25, font: "24px Arial", color: '#ffffff' });
    const startButtonColor = "#009900";
    context.strokeStyle=startButtonColor;
    context.lineWidth = 2;
    context.strokeRect(670, 500, 80, 50);
    context.fillStyle = startButtonColor;
    context.font = "22px Arial";
    context.fillText("SKIP", 685, 534);
    context.restore();

    addClickableContext(state.clickableContexts, 'toTitle', 670, 500, 80, 50, () => {
        state.scenes.currentScene = Scenes.TITLE;
        stopMusic(state);
        playMusic('assets/sounds/start.mp3', state);
        state.clickableContexts = [];
    });
}

export const title = (context, state) => {
    const title = findImageById('title').img;
    const signal = findImageById('signal').img;

    state.scenes.title.signalOffset--;
    if (state.scenes.title.signalOffset < -800) {
        state.scenes.title.signalOffset = 0;
    }

    context.drawImage(title, 113, 80);

    context.globalAlpha = Math.random()/5 + 0.8;
    context.drawImage(signal, state.scenes.title.signalOffset-800, 200);
    context.drawImage(signal, state.scenes.title.signalOffset, 200);
    context.drawImage(signal, state.scenes.title.signalOffset+800, 200);
    context.globalAlpha = 1;

    context.save();
    const startButtonColor = "#009900";
    context.strokeStyle=startButtonColor;
    context.lineWidth = 2;
    context.strokeRect(350, 500, 100, 50);
    context.fillStyle = startButtonColor;
    context.font = "22px Arial";
    context.fillText("START", 365, 534);
    context.restore();

    addClickableContext(state.clickableContexts, 'toGame', 300, 500, 200, 60, () => {
        state.scenes.currentScene = Scenes.PRELUDE;
        state.clickableContexts = [];
    });
}

export const prelude = (context, state, callback) => {
    state.scenes.prelude.timeOut += 10;

    context.save();
    context.globalAlpha = state.scenes.prelude.timeOut <= 100 ? state.scenes.prelude.timeOut / 100 : (200 - state.scenes.prelude.timeOut) / 100;

    context.font = "22px Arial";
    context.fillStyle = '#ffffff';
    context.fillText("August 2037", 340, 250);

    context.font = "18px Arial";
    context.fillStyle = '#aaaaaa';
    context.fillText("Nuuk, Greenland", 340, 280);

    context.restore();

    if (state.scenes.prelude.timeOut > 200) {
        callback();
        state.scenes.currentScene = 'level';
    }
};


export const dead = (context, state) => {
    const gun = findImageById('hand-gun').img;

    if (state.hand.killedOffset === 0) {
        stopMusic(state); // stop any music
        playSound('assets/sounds/death.mp3');
    }

    state.hand.killedOffset+=1;
    state.player.height-=0.3;
    context.save();
    context.translate(800,600 + state.hand.killedOffset);
    context.rotate(toRadians(40));
    context.translate(-800,-600);
    context.drawImage(gun, 560, 380);
    context.restore();
    context.globalAlpha = state.hand.killedOffset / 50;
    context.fillStyle = "#000000";
    context.fillRect(0, 0, 800, 600);

    if (state.hand.killedOffset > 100) {
        context.globalAlpha = 0;
        state.scenes.currentScene = Scenes.RESTART;
        // todo: playSound('assets/sounds/gameover.mp3'); ? maybe on a setTimeout?
    }
}

export const restart = (context) => {
    context.globalAlpha += 0.001;
    positionedText({ context, text: 'GAME OVER', y: 280, font: "120px Butcherman", color: '#dd0000' });
    // todo: add restart button
}
