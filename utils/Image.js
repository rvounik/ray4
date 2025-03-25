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
    {
        id: 'wall-snow',
        src: 'assets/images/wall-snow.png',
        img: new Image()
    },
    {
        id: 'floor-snow',
        src: 'assets/images/floor-snow.jpg',
        img: new Image()
    },
    {
        id: 'night-sky',
        src: 'assets/images/sky-night.jpg',
        img: new Image()
    },
    {
        id: 'transparency_mask',
        src: 'assets/images/transparency_mask.png',
        img: new Image()
    },
];

// preload images
images.forEach(image => {
    image.img.src = image.src;
});

export const findImageById = id => images.find(image => image.id === id);

export const areAllImageAssetsLoaded = () =>
    images.every(image => image.img.naturalWidth > 0);
