/**
 * Ball Entity
 * Bouncing ball that can be triggered to explode
 */
import { BALL_COLORS } from '../utils/constants.js';

export class Ball {
    constructor(x, y, radius, speed, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;

        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.alive = true;
        this.isDead = false;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.layer = 1;
    }

    static createRandom(canvasWidth, canvasHeight, speed, radiusMin = 12, radiusMax = 20) {
        const radius = radiusMin + Math.random() * (radiusMax - radiusMin);
        const x = radius + Math.random() * (canvasWidth - radius * 2);
        const y = radius + Math.random() * (canvasHeight - radius * 2);
        const color = BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];
        const actualSpeed = speed * (0.5 + Math.random() * 0.5);

        return new Ball(x, y, radius, actualSpeed, color);
    }

    update(dt, engine) {
        if (!this.alive) return;

        this.x += this.vx;
        this.y += this.vy;
        this.pulsePhase += 0.05;

        // Bounce off walls
        if (this.x - this.radius < 0 || this.x + this.radius > engine.width) {
            this.vx *= -1;
            this.x = Math.max(this.radius, Math.min(engine.width - this.radius, this.x));
        }
        if (this.y - this.radius < 0 || this.y + this.radius > engine.height) {
            this.vy *= -1;
            this.y = Math.max(this.radius, Math.min(engine.height - this.radius, this.y));
        }
    }

    render(ctx) {
        if (!this.alive) return;

        const pulse = 1 + Math.sin(this.pulsePhase) * 0.05;
        const r = this.radius * pulse;

        // Outer glow
        ctx.beginPath();
        const glowGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 2);
        glowGradient.addColorStop(0, this.color.glow);
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.arc(this.x, this.y, r * 2, 0, Math.PI * 2);
        ctx.fill();

        // Ball body
        ctx.beginPath();
        const ballGradient = ctx.createRadialGradient(
            this.x - r * 0.3, this.y - r * 0.3, 0,
            this.x, this.y, r
        );
        ballGradient.addColorStop(0, '#ffffff');
        ballGradient.addColorStop(0.3, this.color.main);
        ballGradient.addColorStop(1, this.color.main);
        ctx.fillStyle = ballGradient;
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    explode() {
        if (!this.alive) return false;
        this.alive = false;
        this.isDead = true;
        return true;
    }

    isInRange(x, y, range) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy) < range + this.radius;
    }
}
