/**
 * Particle Entity
 * Visual effect particles from explosions
 */
import { hexToRgb } from '../utils/helpers.js';

export class Particle {
    constructor(x, y, angle, speed, color) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.color = color;
        this.life = 1;
        this.decay = 0.015 + Math.random() * 0.015;
        this.size = 2 + Math.random() * 4;
        this.isDead = false;
        this.layer = 3;
    }

    static createBurst(x, y, color, count = 15, scale = 1) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = (2 + Math.random() * 4) * scale;
            const particle = new Particle(x, y, angle, speed, color);
            particle.size = (2 + Math.random() * 4) * scale;
            particles.push(particle);
        }
        return particles;
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= this.decay;

        if (this.life <= 0) {
            this.isDead = true;
        }
    }

    render(ctx) {
        if (this.life <= 0) return;

        const rgb = hexToRgb(this.color.main);

        ctx.beginPath();
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.life})`;
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
    }
}
