import { findImageById } from "./Image.js";

export const drawSky = (context, state, data) => {
    switch (state.scenes.game.level) {
        case 1: {
            const sky = findImageById(data.sky.imageId).img;
            const skyWidth = sky.width;
            const skyOffsetX = Math.floor(-(state.player.rotation / 360) * skyWidth);
            context.drawImage(sky, skyOffsetX % skyWidth, 0, 3800, 300);
            context.drawImage(sky, (skyOffsetX % skyWidth) + skyWidth, 0, 3800, 300);

            const drawAurora = (id, worldX) => {
                const img = findImageById(id).img;
                const screenX = (worldX + skyOffsetX) % skyWidth;

                if (screenX < -img.width) {
                    context.drawImage(img, screenX + skyWidth, 0);
                }

                context.drawImage(img, screenX, 0);
            };

            const auroraAlpha = Math.abs(Math.sin((state.scenes.game.counter/200)));

            context.globalAlpha = 0.5 + auroraAlpha;
            drawAurora('aurora-left', 0);
            context.globalAlpha = 1.5 - auroraAlpha;
            drawAurora('aurora-right', 100);
            context.globalAlpha = 1;

            break;
        }

        case 2:
            const sky = findImageById(data.sky.imageId).img;
            const skyWidth = sky.width;
            const skyOffsetX = Math.floor(-(state.player.rotation / 360) * skyWidth);
            context.drawImage(sky, skyOffsetX % skyWidth, 0, 3800, 300);
            context.drawImage(sky, (skyOffsetX % skyWidth) + skyWidth, 0, 3800, 300);

            const drawAurora = (id, worldX) => {
                const img = findImageById(id).img;
                const screenX = (worldX + skyOffsetX) % skyWidth;

                if (screenX < -img.width) {
                    context.drawImage(img, screenX + skyWidth, 0);
                }

                context.drawImage(img, screenX, 0);
            };

            break;
        default:
            break;
    }
};
