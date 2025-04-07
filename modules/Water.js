import { findImageById } from "./Image.js";

export const drawWater = (context, state, data) => {

    // prevent bleed by creating a static background first
    context.fillStyle = '#202030';
    context.fillRect(0, 300, 800, 300);

    // draw 2 overlapping images of sea water and add y offset to one so it appears to be moving water
    const water = findImageById('water').img;
    const waterOffsetX = 500 + Math.floor(-(state.player.rotation / 360) * 2000);
    const waterOffsetY = 300 + Math.abs(25 * Math.sin((state.scenes.game.counter / 200)));
    context.globalAlpha = 0.5;
    context.drawImage(water, waterOffsetX, 300, 2000, 300);
    context.globalAlpha = 0.5;
    context.drawImage(water, waterOffsetX, waterOffsetY, 2000, 300);
    context.globalAlpha = 1;

    // on top of that add a gradient so the sea visual is faded out towards the horizon
    const gradient = context.createLinearGradient(0, 300, 0, 600);
    gradient.addColorStop(0, "#202030");
    gradient.addColorStop(1, "rgba(10, 10, 60, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 300, 800, 300);
}
