/** renders a top-down map of the viewable area with a line representing the viewing angle */
export const drawMiniMap = (context, state, grid) => {
    const minimapSize = 150;
    const cellDisplaySize = 20; // each grid cell appears as 20x20
    const scaleFactor = cellDisplaySize / state.engine.resolution;
    const minimapCenter = { x: minimapSize / 2, y: minimapSize / 2 };
    const gridDisplayRadius = 5; // how many units to show top/down/right/left
    const playerGridX = Math.floor(state.player.x / state.engine.resolution);
    const playerGridY = Math.floor(state.player.y / state.engine.resolution);

    context.save();

    context.translate(25, 425);

    // clip
    context.beginPath();
    context.arc(minimapSize/2, minimapSize/2, minimapSize/2, 0, Math.PI * 2);
    context.clip();

    // background
    context.fillStyle = '#074506';
    context.globalAlpha = 0.25;
    context.fillRect(0, 0, minimapSize, minimapSize);

    // walls as a unified shape / path (prevents antialias artifacts)
    context.fillStyle = '#4FD34B';
    context.beginPath();
    for (let row = playerGridY - gridDisplayRadius; row <= playerGridY + gridDisplayRadius; row++) {
        for (let col = playerGridX - gridDisplayRadius; col <= playerGridX + gridDisplayRadius; col++) {
            if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
                if (grid[row][col] > 0) {
                    // get world coordinates of the cell's top-left corner.
                    const worldX = col * state.engine.resolution;
                    const worldY = row * state.engine.resolution;

                    // convert world coordinates to minimap coordinates by subtracting the players exact position and then scaling
                    const miniX = minimapCenter.x + (worldX - state.player.x) * scaleFactor;
                    const miniY = minimapCenter.y + (worldY - state.player.y) * scaleFactor;
                    context.rect(miniX, miniY, cellDisplaySize, cellDisplaySize);
                }
            }
        }
    }
    context.fill();

    // player
    context.fillStyle = '#ffffff';
    context.fillRect(minimapCenter.x - 1, minimapCenter.y - 1, 2, 2);

    // line of sight
    const toRadians = (deg) => deg * Math.PI / 180;
    const lineLengthMinimap = 500 * scaleFactor;
    const endX = minimapCenter.x + Math.cos(toRadians(state.player.rotation)) * lineLengthMinimap;
    const endY = minimapCenter.y + Math.sin(toRadians(state.player.rotation)) * lineLengthMinimap;
    context.strokeStyle = '#B8FFC2';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(minimapCenter.x, minimapCenter.y);
    context.lineTo(endX, endY);
    context.stroke();
    context.restore();
};
