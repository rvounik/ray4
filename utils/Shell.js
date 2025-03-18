import { toRadians } from './Utils.js';

export default class Shell {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.rotation = 10 - Math.random() * 20;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        this.vy += 0.5;
    }

    draw(context) {
        context.fillStyle = '#888888';
        context.save();
        context.rotate(toRadians(this.rotation))
        context.fillRect(this.x, this.y, 10, 5);
        context.restore();
    }
}
