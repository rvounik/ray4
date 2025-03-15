export const playSound = sound => {
    let audio = new Audio();
    audio.src = sound;
    audio.play();
}
