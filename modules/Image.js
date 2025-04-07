const images = [
    {
        id: 'hand-gun',
        src: 'assets/images/hand-gun.png',
        img: new Image()
    },
    {
        id: 'hand-phone',
        src: 'assets/images/hand-phone.png',
        img: new Image()
    },
    {
        id: 'enemy-a',
        src: 'assets/images/enemy-a.png',
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
        id: 'wall-stone',
        src: 'assets/images/wall-stone.png',
        img: new Image()
    },
    {
        id: 'wall-snow',
        src: 'assets/images/wall-snow.png',
        img: new Image()
    },
    {
        id: 'wall-rock',
        src: 'assets/images/wall-rock.png',
        img: new Image()
    },
    {
        id: 'wall-cave',
        src: 'assets/images/wall-cave.png',
        img: new Image()
    },
    {
        id: 'wall-cave-snow',
        src: 'assets/images/wall-cave-snow.png',
        img: new Image()
    },
    {
        id: 'wall-cave-snow-v3',
        src: 'assets/images/wall-cave-snow-v3.png',
        img: new Image()
    },
    {
        id: 'wall-cave-snow-end',
        src: 'assets/images/wall-cave-snow-end.png',
        img: new Image()
    },
    {
        id: 'wall-cave-2',
        src: 'assets/images/wall-cave-2.png',
        img: new Image()
    },
    {
        id: 'floor-level2',
        src: 'assets/images/floor-level2.jpg',
        img: new Image()
    },
    {
        id: 'floor-level1',
        src: 'assets/images/floor-level1.jpg',
        img: new Image()
    },
    {
        id: 'night-sky',
        src: 'assets/images/sky-night.jpg',
        img: new Image()
    },
    {
        id: 'aurora-left',
        src: 'assets/images/aurora-left.png',
        img: new Image()
    },
    {
        id: 'aurora-right',
        src: 'assets/images/aurora-right.png',
        img: new Image()
    },
    {
        id: 'water',
        src: 'assets/images/water.gif',
        img: new Image()
    },
    {
        id: 'helicopter',
        src: 'assets/images/helicopter.png',
        img: new Image()
    },
    {
        id: 'sky-cave',
        src: 'assets/images/sky-cave.jpg',
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
