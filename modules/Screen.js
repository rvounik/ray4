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
    state.scenes.intro.timeOut += 0.01;
    const intro_a = findImageById('intro-a').img;
    const intro_b = findImageById('intro-b').img;
    const intro_c = findImageById('intro-c').img;

    context.save();

    if (state.scenes.intro.timeOut < 1) {
        context.globalAlpha = state.scenes.intro.timeOut;
        context.drawImage(intro_a, 0, 600 - (((state.scenes.intro.timeOut) * 600)));
    } else if (state.scenes.intro.timeOut < 5) {
        context.globalAlpha = 5 - state.scenes.intro.timeOut;
        context.drawImage(intro_a, 0, 0);
    } else if (state.scenes.intro.timeOut < 6) {
        context.globalAlpha = state.scenes.intro.timeOut - 5;
        context.drawImage(intro_b, 0, 600 - (((state.scenes.intro.timeOut - 5) * 600)));
    } else if (state.scenes.intro.timeOut < 11) {
        context.globalAlpha = 1 - (state.scenes.intro.timeOut - 10);
        context.drawImage(intro_b, 0, 0);
    } else if (state.scenes.intro.timeOut < 12) {
        context.globalAlpha = state.scenes.intro.timeOut - 11;
        context.drawImage(intro_c, 0, 600 - (((state.scenes.intro.timeOut - 11) * 600)));
    } else if (state.scenes.intro.timeOut < 17) {
        context.globalAlpha = 1 - (state.scenes.intro.timeOut - 16);
        context.drawImage(intro_c, 0, 0);
    }

    context.restore();

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

    addClickableContext(state.clickableContexts, 'toPrelude', 300, 500, 200, 60, () => {
        console.log('to prelude')
        state.clickableContexts = [];
        state.scenes.currentScene = Scenes.PRELUDE;
    });
}

export const prelude = (context, state, toGame) => {
    state.scenes.prelude.timeOut += 0.35;

    context.save();
    context.globalAlpha = state.scenes.prelude.timeOut <= 100 ? state.scenes.prelude.timeOut / 100 : (201 - state.scenes.prelude.timeOut) / 100;

    context.fillStyle = '#ffffff';
    context.font = "18px Arial";
    context.fillText("Qeqertaq Avannarleq, Greenland", 140, 180);
    context.fillStyle = '#aaaaaa';
    context.fillText("As the helicopter fades into the distance, you grab your tracking", 140, 220);
    context.fillText("device and turn around.The mysterious signal calls you.", 140, 260);

    const next = findImageById('arrow_next').img;
    context.drawImage(next, 730, 530);

    if (!state.clickableContexts.length) {
        addClickableContext(state.clickableContexts, 'toGame', 0, 0, 800, 600, () => {
            toGame();
        });
    }

    context.restore();

    if (state.scenes.prelude.timeOut > 200) {
        toGame()
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
