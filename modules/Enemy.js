import { playSound } from "./Sound.js";
import { sortBy, toRadians } from "./Utils.js";
import { findImageById } from "./Image.js";

export default class Enemy {
    constructor(context, cfg) {
        this.x = cfg.x;
        this.y = cfg.y;
        this.speed = cfg.speed;
        this.type = cfg.type;
        this.path = cfg.path;
        this.pathIndex = 0;
        this.patrolDirection = 1;
        this.frameTimer = 25;
        this.currentFrame = 1;
        this.state = 'walk';
        this.energy = 100;
        this.context = context;
        this.weaponPower = cfg.weaponPower;
    }

    shoot(screenX = null, state) {
        if (this.state !== 'dead'){
            this.state = 'shoot'
        }

        // only perform the shooting logic when the timer hits zero
        if (this.frameTimer < 0) {

            // show hand flash if enemy is shown on screen
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

            depleteEnergy(this.weaponPower, state);

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
                    this.currentFrame = 13; // the static pointing-hand-at-you frame
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

/** depletes player energy until depleted, then switches scene **/
const depleteEnergy = (value, state) => {
    state.player.energy -= value;

    if (state.player.energy <= 0) {
        state.scenes.currentScene = 'dead';
    }
}

export const drawEnemies = (context, state, fadeToGameOverScene) => {
    const maxVisibleDistance = 600;
    const shootingRange = 250;
    const projectionPlaneDistance = (state.engine.width / 2) / Math.tan(toRadians(state.engine.fieldOfVision / 2));
    const scaleModifier = 0.2; // magic number for overall sprite scaling

    // sort enemies by distance to the player
    sortBy(state.enemies, (enemy) => {
        const dx = enemy.x - state.player.x;
        const dy = enemy.y - state.player.y;
        return Math.sqrt(dx * dx + dy * dy);
    });

    state.enemies.forEach(enemy => {

        // calculate distance to enemy
        const deltaX = enemy.x - state.player.x;
        const deltaY = enemy.y - state.player.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const playerAngleRad = toRadians(state.player.rotation);

        // compute forward (how far in front) and right (side offset) using dot and cross concepts (this is a common concept so I used chatGPT to apply)
        const forward = deltaX * Math.cos(playerAngleRad) + deltaY * Math.sin(playerAngleRad);
        const right = -deltaX * Math.sin(playerAngleRad) + deltaY * Math.cos(playerAngleRad);

        // always update enemy movement (even if off-screen)
        enemy.update(forward);

        const frameWidth = 204;
        const spriteScale = (projectionPlaneDistance / forward) * scaleModifier;
        const enemyImage = findImageById(enemy.type).img;
        const frameHeight = enemyImage.height;
        const spriteHeight = frameHeight * spriteScale;
        const spriteWidth = frameWidth * spriteScale;
        const enemyAngle = Math.atan2(right, forward);
        const screenX = (state.engine.width / 2) + Math.tan(enemyAngle) * projectionPlaneDistance - spriteWidth / 2;
        const screenY = (state.engine.height / 2) - spriteHeight / 2;
        const halfFOV = toRadians(state.engine.fieldOfVision / 2);

        // only draw enemy if it is in front and within visible distance
        if (forward > 0 && forward < maxVisibleDistance) {
            if (Math.abs(enemyAngle) <= halfFOV) {
                drawEnemySpriteWithOcclusion(
                    enemyImage,
                    frameWidth,
                    frameHeight,
                    screenX,
                    screenY,
                    spriteWidth,
                    spriteHeight,
                    forward,
                    enemy,
                    maxVisibleDistance,
                    context,
                    state
                );

                // and if the player is shooting, deplete energy, too
                if (enemy.state !== 'dead' && state.hand.splitTimer > 23) {

                    // player is shooting at enemy as its being drawn, drain energy
                    enemy.energy -= state.hand.weaponPower;

                    if (enemy.energy <= 0) {
                        enemy.state = 'dead';
                        playSound('assets/sounds/death-robot.mp3');
                    }
                }

            }
        }

        if (enemy.state === 'dead') {
            return;
        }

        // if the enemy is still alive and within range (regardless of whether it’s in front) it should shoot
        if (distance < shootingRange) {
            if (forward > 0) {
                const enemyCenterColumn = Math.floor(screenX + (spriteWidth / 2));

                if (
                    enemyCenterColumn >= 0 &&
                    enemyCenterColumn < state.engine.width &&
                    forward < state.wallDepthBuffer[enemyCenterColumn]
                ) {
                    enemy.shoot(screenX, state); // shoot with flash
                }
            } else {
                enemy.shoot(null, state); // shoot without flash
            }
        } else {
            enemy.state = 'walk';
        }
    });
};

/** draws each vertical column of enemy sprite and checks if it should be positioned in front of a wall segment in the corresponding view column */
const drawEnemySpriteWithOcclusion = (
    enemyImage,
    frameWidth,
    frameHeight,
    screenX,
    screenY,
    spriteWidth,
    spriteHeight,
    enemyDepth,
    enemy,
    maxVisibleDistance,
    context,
    state
) => {
    for (let x = 0; x < spriteWidth; x++) {
        const screenColumn = Math.floor(screenX + x);
        if (
            screenColumn >= 0 &&
            screenColumn < state.engine.width &&
            enemyDepth < state.wallDepthBuffer[screenColumn]
        ) {
            // calculate source column offset based on the current animation frame
            const sourceX = Math.floor((x / spriteWidth) * frameWidth) + (204 * enemy.currentFrame);
            context.globalAlpha = 1.25 - (enemyDepth / maxVisibleDistance);
            context.drawImage(
                enemyImage,
                sourceX, 0,
                1, frameHeight,     // source width, height (one vertical slice).
                screenColumn, screenY + 10, // add magic number to prevent float)
                1, spriteHeight
            );
            context.globalAlpha = 1;
        }
    }
};

