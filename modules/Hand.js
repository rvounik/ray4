import { toRadians } from './Utils.js';
import { findImageById } from './Image.js';
import { playSound } from './Sound.js';
import { clearCanvas } from './Canvas.js';
import Shell from './Shell.js';

/** renders a hand with a utility item and make it move dynamically, whilst also applying the head-bop effect */
export const drawHand = (state, context) => {
    const interpolate = (start, end, t) => start + (end - start) * t;

    const smoothing = 5;
    const threshold = 0.5;
    let utility;

    switch (state.scenes.game.level) {
        case 1:
            utility = findImageById('hand-phone').img;

            break;

        case 2:
            utility = findImageById('hand-gun').img;

            if (state.controls.fireHeld && state.hand.splitTimer <= 0) {
                context.globalAlpha = 0.3;
                clearCanvas(context, '#FAF89D');
                context.globalAlpha = 1;

                // hand flash
                const gradient = context.createRadialGradient(680, 380, 0, 600, 400, 500);
                gradient.addColorStop(0, "rgba(255, 255, 0, 1)");
                gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                context.fillStyle = gradient;
                context.beginPath();
                context.arc(600, 400, 500, 0, Math.PI * 2);
                context.fill();

                state.hand.splitTimer = 25;
                playSound('assets/sounds/gunshot.mp3');
                const vx = Math.random() * 2 - 1; // velocity
                const vy = -Math.random(); // (initial) upward speed
                state.hand.shells.push(new Shell(640, 420, vx, vy));
            }

            break;
        default:
            break;
    }

    // snap to target position when close enough, then deplete the timer, then set new random coordinates and reset timer
    if (Math.abs(state.hand.position.x - state.hand.target.x) < threshold && Math.abs(state.hand.position.y - state.hand.target.y) < threshold) {
        state.hand.position.x = state.hand.target.x;
        state.hand.position.y = state.hand.target.y;
        state.hand.count--;

        if (state.hand.count < 0) {
            state.hand.target.x = 560 + (Math.random() * 20 - 10);
            state.hand.target.y = 360 + (Math.random() * 10 - 5);
            state.hand.count = 100;
        }
    } else {
        state.hand.position.x = interpolate(state.hand.position.x, state.hand.target.x, 1 / smoothing);
        state.hand.position.y = interpolate(state.hand.position.y, state.hand.target.y, 1 / smoothing);
    }

    context.save();

    // deal with gun firing animation
    if (state.hand.splitTimer > 0) {
        context.translate(800, 600);
        context.rotate(toRadians(state.hand.splitTimer / 2));
        context.translate(-800, -600);
        state.hand.splitTimer -= 1;
    }

    context.translate(0, (Math.sin(state.player.bop) * 15));
    context.drawImage(utility, state.hand.position.x, state.hand.position.y);

    if (state.scenes.game.level === 1) {
        // deal with radar projection
        context.fillColor = "#ffffff";
        context.opacity = 1;
        context.fillRect(state.hand.position.x + 42, state.hand.position.y + 5, 65, 150);
        drawWaypointArrow(context, state, {x: 950, y: 4350})
    }

    context.restore();

};

export const drawWaypointArrow = (context, state, exitPos) => {
    const playerRotationRad = toRadians(state.player.rotation);
    const dx = exitPos.x - state.player.x;
    const dy = exitPos.y - state.player.y;
    const angleToExit = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy) / 25;
    const phoneX = state.hand.position.x + 42;
    const phoneY = state.hand.position.y + 5;
    const phoneWidth = 65;
    const phoneHeight = 150;
    const gps = findImageById('tracker_bg').img;

    let relativeAngle = angleToExit - playerRotationRad;

    while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;
    while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;

    // background
    context.save();
    context.fillStyle = "#ffffff";
    context.globalAlpha = 1;
    context.fillRect(phoneX, phoneY, phoneWidth, phoneHeight);

    context.drawImage(gps, state.hand.position.x + 43, state.hand.position.y + 7, 65, 146);

    context.globalAlpha = 0.5;
    if ((state.scenes.game.counter % 100) < 95) {
        context.font = "12px Arial";
        context.fillStyle = '#bb0000';
        context.fillText('tracking', phoneX + 12, phoneY + 35);
    }

    context.restore();

    // arrow
    const centerX = phoneX + phoneWidth / 2;
    const centerY = phoneY + phoneHeight / 2;

    context.save();
    context.translate(centerX, centerY);
    context.rotate(relativeAngle); // Now using the corrected angle
    context.fillStyle = "#bb0000";
    context.beginPath();
    context.moveTo(0, -20);
    context.lineTo(-10, 10);
    context.lineTo(10, 10);
    context.closePath();
    context.fill();
    context.rotate(-relativeAngle);

    context.font = "12px Arial";
    context.fillStyle = '#000000';
    context.fillText(`${distance.toFixed(0)}m`, -10, 50);

    context.restore();


};
