export const positionedText = cfg => {
    cfg.context.font = cfg.font || "30px Arial";
    cfg.context.fillStyle = cfg.color || "#ffffff";
    cfg.context.fillText(cfg.text, (!cfg.x && cfg.x !== 0) ? (800 / 2) - (cfg.context.measureText(cfg.text).width / 2) : cfg.x, cfg.y);
}
