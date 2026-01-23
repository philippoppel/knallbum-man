/**
 * Explosion Entity
 * Expanding explosion that can trigger other balls
 */
import { hexToRgb } from '../utils/helpers.js';

export class Explosion {
    constructor(x, y, color, maxRadius, duration) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.maxRadius = maxRadius;
        this.duration = duration;

        this.radius = 0;
        this.time = 0;
        this.active = true;
        this.isDead = false;
        this.hasTriggeredChain = false;
        this.layer = 2;

        // Callback for when balls are caught
        this.onCatch = null;
    }

    update(dt, engine) {
        if (!this.active) return;

        this.time += dt;
        const progress = this.time / this.duration;

        // Expansion phase
        if (progress < 0.3) {
            this.radius = this.maxRadius * (progress / 0.3);
        } else if (progress < 1) {
            this.radius = this.maxRadius;
        } else {
            this.active = false;
            this.isDead = true;
        }
    }

    render(ctx) {
        if (!this.active) return;

        const progress = this.time / this.duration;
        const alpha = progress < 0.7 ? 0.6 : 0.6 * (1 - (progress - 0.7) / 0.3);

        // Main explosion gradient
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );

        const rgb = hexToRgb(this.color.main);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.8})`);
        gradient.addColorStop(0.3, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Ring outline
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.arc(this.x, this.y, this.radius * 0.9, 0, Math.PI * 2);
        ctx.stroke();
    }

    checkCollision(ball) {
        if (!this.active || !ball.alive) return false;
        return ball.isInRange(this.x, this.y, this.radius);
    }
}
