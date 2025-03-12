const images = [
    {
        id: '800x600',
        src: 'assets/images/800x600.jpg',
        img: new Image()
    },
    {
        id: 'floor',
        src: 'assets/images/floor.jpg',
        img: new Image()
    }
];

// preload images
images.forEach(image => {
    image.img.src = image.src;
});

export const findImageById = id => images.find(image => image.id === id);

export const areAllImageAssetsLoaded = () =>
    images.every(image => image.img.naturalWidth > 0);
