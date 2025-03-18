import {playSound} from "./Sound.js";

export default class Enemy {
    constructor(x, y, type, path = [{ startX: x, endX : x, startY : y, endY: y }], context, weaponPower) {
        this.x = x;
        this.y = y;
        this.speed = 1;
        this.type = type;
        this.path = path;
        this.pathIndex = 0;
        this.patrolDirection = 1;
        this.frameTimer = 25;
        this.currentFrame = 1;
        this.state = 'walk';
        this.energy = 100;
        this.context = context;
        this.weaponPower = weaponPower;
    }

    shoot(screenX = null, depleteEnergy) {
        if (this.state !== 'dead'){
            this.state = 'shoot'
        }

        // only perform the shooting logic when the timer hits zero
        if (this.frameTimer < 0) {

            // show gun flash if enemy is shown on screen
            if (screenX) {
                const centerX = screenX + 95;
                const centerY = 255;
                const radius = 250;

                const gradient = this.context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
                gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
                gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

                this.context.fillStyle = gradient;
                this.context.beginPath();
                this.context.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.context.fill();
            }

            playSound('assets/sounds/laser.mp3');

            depleteEnergy(this.weaponPower);

            // reset timer (ready for next shot)
            this.frameTimer = 25;
        }
    }

    update() {
        const target = this.path[this.pathIndex];

        const deltaX = target.endX - this.x;
        const deltaY = target.endY - this.y;
        const distanceToTarget = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distanceToTarget < this.speed) {
            this.x = target.endX;
            this.y = target.endY;

            // reverse direction when path array is exhausted
            if (this.pathIndex === this.path.length - 1) {
                this.patrolDirection = -1;
            } else if (this.pathIndex === 0) {
                this.patrolDirection = 1;
            }

            // update path index by the current patrol direction
            this.pathIndex += this.patrolDirection;
            return;
        }

        // move towards the player
        const unitX = deltaX / distanceToTarget;
        const unitY = deltaY / distanceToTarget;

        switch (this.state) {
            case 'walk': {
                this.x += unitX * this.speed;
                this.y += unitY * this.speed;

                this.frameTimer--;

                if (this.frameTimer < 0) {
                    this.frameTimer = 25;

                    // go to next frame of walking animation
                    if (this.currentFrame < 11) {
                        this.currentFrame++;
                    } else {
                        this.currentFrame = 1;
                    }
                }
                break;
            }
            case 'shoot': {
                this.frameTimer--;

                if (this.frameTimer < 25) {
                    this.currentFrame = 13; // the static pointing-gun-at-you frame
                }

                break;
            }

            case 'dead': {
                this.currentFrame = 12; // the static corpse frame
                break;
            }

            default:

        }
    }
}
