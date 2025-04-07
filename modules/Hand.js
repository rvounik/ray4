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
    // Convert player's rotation (assumed in degrees) to radians
    const playerRotationRad = toRadians(state.player.rotation);

    // Calculate the vector from player to exit
    const dx = exitPos.x - state.player.x;
    const dy = exitPos.y - state.player.y;
    // Global angle from the player to the exit in radians
    const angleToExit = Math.atan2(dy, dx);

    const distance = Math.sqrt(dx * dx + dy * dy) / 50;

    // Compute the relative angle that the arrow needs to point
    let relativeAngle = angleToExit - playerRotationRad;

    // Optional: if your arrow is drawn with its tip pointing up (i.e. along negative Y),
    // you may need to subtract PI/2 to align it correctly.
    // relativeAngle -= Math.PI / 2;

    // Normalize the angle between -PI and PI
    while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;
    while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;

    // Draw the smartphone background
    const phoneX = state.hand.position.x + 42;
    const phoneY = state.hand.position.y + 5;
    const phoneWidth = 65;
    const phoneHeight = 150;
    context.save();
    context.fillStyle = "#ffffff";
    context.globalAlpha = 1;
    context.fillRect(phoneX, phoneY, phoneWidth, phoneHeight);
    context.restore();

    // Draw the arrow on the phone screen
    const centerX = phoneX + phoneWidth / 2;
    const centerY = phoneY + phoneHeight / 2;
    context.save();
    context.translate(centerX, centerY);
    context.rotate(relativeAngle); // Now using the corrected angle

    // Draw a simple arrow: tip pointing upward
    context.fillStyle = "#ff0000"; // arrow color
    context.beginPath();
    context.moveTo(0, -20);    // arrow tip
    context.lineTo(-10, 10);   // bottom left
    context.lineTo(10, 10);    // bottom right
    context.closePath();
    context.fill();
    context.rotate(-relativeAngle);

    context.font = "12px Arial";
    context.fillStyle = '#000000';
    context.fillText(distance.toFixed(0), -10, 50);

    context.restore();


};
