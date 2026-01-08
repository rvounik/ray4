
// should play only once
export const playSound = sound => {
    let audio = new Audio();
    audio.src = sound;
    audio.play();
};

// it loops and its added to state so it can be stopped
export const playMusic = (sound, state) => {
    const audio = new Audio(sound);
    const buffer = 0.24; // magic number to provide seamless transition

    // disable native looping due to workaround below
    audio.loop = false;
    audio.preload = "auto";

    // prevent audible gap by restarting slightly early (known issue with Audio object)
    audio.addEventListener('timeupdate', function () {
        if (audio.currentTime > audio.duration - buffer) {
            audio.currentTime = 0;
            audio.play();
        }
    }, false);

    audio.muted = false;
    audio.play();

    state.currentTrack = audio;
};


// it can only stop music that was started with playMusic
export const stopMusic = state => {
    if (state?.currentTrack) {
        state.currentTrack.pause();
    }
}
