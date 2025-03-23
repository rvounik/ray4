export const playSound = sound => {
    let audio = new Audio();
    audio.src = sound;
    audio.play();
};

export const playMusic = (sound, state) => {
    let audio = new Audio();
    audio.src = sound;
    audio.play(); // todo: how to loop?

    state.currentTrack = audio;
}

export const stopMusic = state => {
    state.currentTrack.pause();
}
