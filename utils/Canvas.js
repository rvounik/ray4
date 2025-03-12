
const gradients = [
    {
        id: 'dungeon',
        colors: [
            {offset: 0, color: "#444444"},
            {offset: 0.4, color: "#000000"},
            {offset: 0.6, color: "#000000"},
            {offset: 1, color: "#444444"}
        ]
    },
    {
        id: 'outside',
        colors: [
            {offset: 0, color: "#6698e4"},
            {offset: 1, color: "#773707"}
        ]
    },
]

export const clearCanvas = (context, color = '#000000', gradient = null) => {
    if (gradient) {
        const gradientConfig = gradients.find(grad => grad.id === gradient);

        if (gradientConfig) {
            const gradientOutput = context.createLinearGradient(0, 0, 0, 600);

            gradientConfig.colors.forEach(color => {
                gradientOutput.addColorStop(color.offset, color.color);
            });

            context.fillStyle = gradientOutput;
            context.fillRect(0, 0, 800, 600);
        }
    } else {
        context.fillStyle = color;
        context.fillRect(0, 0, 800, 600);
    }
};

export const shadeCanvas = (context, alpha, {x,y,w,h}) => {
    context.fillStyle = "#000000";
    context.globalAlpha = (alpha) / 500;
    context.fillRect(x,y,w,h);
    context.globalAlpha = 1.0;
}
