import { findImageById } from "./Image.js";

/** generic update method to render falling particles like snow, rain etc **/
export const weatherParticles = (context, state) => {
    state.scenes.game.weatherParticles.forEach(particle => {
        particle.update(state);
        particle.draw(context);

        // if particle reaches vLimit, reset to top with random offset
        if (particle.y > 600) {
            particle.y = -Math.random() * 50;
            particle.x = Math.random() * 3200;
        }
    });
};

export const helicopter = (context, state, data) => {
    const helicopterWorldX = 2000;
    const helicopterWorldY = 200;
    const initialRadius = 20;
    const depletionRate = 8;
    const radius = Math.max(initialRadius - depletionRate * (state.scenes.game.counter/200), 0);
    const heliCounter = ((state.scenes.game.counter/200) * 800) % 200;
    const isLightVisible = (heliCounter) < 10 || ((heliCounter) > 60 && (heliCounter) < 70);
    const worldWidth = 3200;
    const offsetX = Math.floor(-(state.player.rotation / 360) * worldWidth);
    const screenX = ((helicopterWorldX + offsetX) % worldWidth + worldWidth) % worldWidth;
    const screenY = helicopterWorldY;
    const scale = Math.max(1 - (state.scenes.game.counter/200) * 0.5, 0.1);
    const scaledRadius = radius * scale;
    const heliYOffset = -40 * scale;
    const lightXOffset = 20;

    if (isLightVisible) {
        context.save();
        context.translate(screenX, screenY);
        context.scale(scale, scale);

        const gradient = context.createRadialGradient(lightXOffset, 0, 0, lightXOffset, 0, scaledRadius);
        gradient.addColorStop(0, "rgba(255, 0, 0, 1)");
        gradient.addColorStop(1, "rgba(255, 0, 0, 0)");

        context.fillStyle = gradient;
        context.beginPath();
        context.arc(lightXOffset, 0, scaledRadius, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }

    context.save();
    context.translate(screenX, screenY + heliYOffset);
    context.scale(scale, scale);
    const helicopter = findImageById('helicopter').img;
    context.drawImage(helicopter, -50, -25, 140, 70);
    context.restore();
};





