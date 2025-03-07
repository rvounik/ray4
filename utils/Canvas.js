export const clearCanvas = (context, color = '#000000') => {
    const gradient = context.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, "#444444");
    gradient.addColorStop(0.4, "#000000");
    gradient.addColorStop(0.6, "#000000");
    gradient.addColorStop(1, "#444444");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 800, 600);
};

export const shadeCanvas = (context, alpha, {x,y,w,h}) => {
    context.fillStyle = "#000000";
    context.globalAlpha = (alpha) / 500;
    context.fillRect(x,y,w,h);
    context.globalAlpha = 1.0;
}
