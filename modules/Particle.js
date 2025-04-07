export default class Particle {
    /**
     * @param {number} worldX - The fixed world angle (in degrees, 0–360)
     * @param {number} y - The current vertical position on screen
     * @param {number} size - The size of the particle
     */
    constructor(worldX, y, size) {
        this.worldX = worldX;
        this.y = y;
        this.size = size;
        this.x = 0; // the x position on screen (calculated each frame)
        this.centerX = 3200; // the width of the entire 360 degree world (3200)
    }

    reset() {
        this.y = 0 - (Math.random() * 650);
        this.size = 1 + (2 * Math.random());
    }

    /**
     * Updates the particle's screen position based on the player's rotation
     * @param {object} state - The game state (including player object)
     */
    update(state) {

        // calculate relative angle between player rotation and world orientation
        let angleDiff = (this.worldX - state.player.rotation + 360) % 360;
        if (angleDiff > 180) angleDiff -= 360; // Now angleDiff is between -180 and 180

        // convert angle to screen coordinate (when rotation increases 90 degrees, the x moves from 0 to 800)
        const centerX = this.centerX;
        this.x = centerX + (angleDiff / 180) * centerX;

        // make small adjustments to the x position to simulate air friction on the particle
        this.worldX += ((5 - (Math.random() * 10)) / 100);

        // increment vertical position depending on its size
        this.y += 2 + this.size;

        if (this.y > 650) {
            this.reset();
        }
    }

    // todo: this is likely to be extended when further particle effects are added (eg rain)
    draw(context) {
        context.fillStyle = 'white';
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
    }
}
