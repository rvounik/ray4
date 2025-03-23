const images = [
    {
        id: 'stone_wall',
        src: 'assets/images/stone_wall.jpg',
        img: new Image()
    },
    {
        id: 'floor',
        src: 'assets/images/floor.jpg',
        img: new Image()
    },
    {
        id: 'mud',
        src: 'assets/images/mud.png',
        img: new Image()
    },
    {
        id: 'floor-1500-a',
        type: 'floor',
        src: 'assets/images/floor-1500-a.jpg',
        img: new Image()
    },
    {
        id: 'gun-hand',
        src: 'assets/images/gun-hand.png',
        img: new Image()
    },
    {
        id: 'wall',
        src: 'assets/images/800x600_pixelated.png',
        img: new Image()
    },
    {
        id: 'enemy-a',
        src: 'assets/images/spritesheet_enemy_a.png',
        img: new Image()
    },
    {
        id: 'title',
        src: 'assets/images/title.png',
        img: new Image()
    },
    {
        id: 'signal',
        src: 'assets/images/signal.png',
        img: new Image()
    },
];

// preload images
images.forEach(image => {
    image.img.src = image.src;
});

//
// const loadAndFixImage = (src, onLoad) => {
//     const img = new Image();
//     img.src = src;
//     img.onload = () => {
//         // Create an offscreen canvas with the same dimensions as the image
//         const offscreenCanvas = document.createElement('canvas');
//         offscreenCanvas.width = img.width;
//         offscreenCanvas.height = img.height;
//         const ctx = offscreenCanvas.getContext('2d');
//
//         // For example, to flip vertically:
//         ctx.translate(0, img.height);
//         ctx.scale(1, -1);
//
//         // Or, to rotate by 180 degrees (which is equivalent to vertical + horizontal flip)
//         // ctx.translate(img.width, img.height);
//         // ctx.rotate(Math.PI);
//
//         // Draw the image onto the offscreen canvas
//         ctx.drawImage(img, 0, 0);
//
//         // Now call the callback with the offscreen canvas as the "fixed" image
//         onLoad(offscreenCanvas);
//     };
// }

// preload images
// images.forEach(image => {
//     if (image.type && image.type === 'floor') {
//         // image.img.src = image.src;
//
//         // loadAndFixImage(image.src, (fixedImage) => {
//         //     image.img = fixedImage; // replace the Image with the canvas
//         // });
//     }
// });

export const findImageById = id => images.find(image => image.id === id);

export const areAllImageAssetsLoaded = () =>
    images.every(image => image.img.naturalWidth > 0);
