export default class Particle {
    /**
     * @param {number} worldX - The fixed world angle (in degrees, 0–360).
     * @param {number} y - The current vertical position on screen.
     * @param {number} size - The size
     */
    constructor(worldX, y, size) {
        this.worldX = worldX; // Fixed world position as an angle (0–360)
        this.y = y;
        this.size = size;
        this.x = 0; // Screen x will be computed each frame
    }

    /**
     * Updates the particle's screen position based on the player's rotation.
     * @param {object} state - The game state that includes player.rotation in degrees.
     */
    update(state) {
        // Compute the relative angle (difference) between the particle's world angle and the player's rotation.
        let angleDiff = (this.worldX - state.player.rotation + 360) % 360;
        if (angleDiff > 180) angleDiff -= 360; // Now angleDiff is between -180 and 180

        // Map this relative angle to a screen x coordinate.
        // When angleDiff is 0, the particle appears at the center (x = 400).
        // When angleDiff is +180, x = 800, and when -180, x = 0.
        const centerX = 3200;
        this.x = centerX + (angleDiff / 180) * centerX;

        // Fall vertically
        this.y += 1 + this.size;

        if (state.controls.upHeld) {
            // increase size as player is moving towards the visible flakes
            if (this.size < 15) {
                const sizeIncrease = this.size / ((700 - this.y) / 2)

                if (this.size - sizeIncrease < 15) {
                    this.size += sizeIncrease;
                }
            }
        }

        if (state.controls.downHeld) {
            // decrease size as player is moving away the visible flakes
            if (this.size > 1) {
                const sizeDecrease = this.size / (600 - this.y);

                if (this.size - sizeDecrease > 1) {
                    this.size -= sizeDecrease
                }
            }
        }

        // Reset particle if it falls off-screen (bottom)
        if (this.y > 600) {
            this.size = 1 + (2 * Math.random());
            this.y = 0 - (Math.random() * 600);
        }
    }

    draw(context) {
        context.fillStyle = 'white';
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
    }
}
