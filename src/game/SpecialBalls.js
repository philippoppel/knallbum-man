/**
 * Special Ball Types
 * Different ball behaviors for more varied gameplay
 */
import { Ball } from './Ball.js';
import { BALL_COLORS } from '../utils/constants.js';

// Splitter Ball - splits into 3 smaller balls on explosion
export class SplitterBall extends Ball {
    constructor(x, y, radius, speed, color) {
        super(x, y, radius, speed, color);
        this.type = 'splitter';
        this.glowColor = 'rgba(255, 100, 100, 0.6)';
    }

    static createRandom(canvasWidth, canvasHeight, speed, radiusMin = 14, radiusMax = 22) {
        const radius = radiusMin + Math.random() * (radiusMax - radiusMin);
        const x = radius + Math.random() * (canvasWidth - radius * 2);
        const y = radius + Math.random() * (canvasHeight - radius * 2);
        const color = { main: '#ff6b6b', glow: 'rgba(255, 107, 107, 0.5)' };
        const actualSpeed = speed * (0.4 + Math.random() * 0.4);
        return new SplitterBall(x, y, radius, actualSpeed, color);
    }

    render(ctx) {
        if (!this.alive) return;
        super.render(ctx);

        // Draw split indicator
        const pulse = 1 + Math.sin(this.pulsePhase * 2) * 0.1;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2 + this.pulsePhase * 0.5;
            const x1 = this.x + Math.cos(angle) * this.radius * 0.3 * pulse;
            const y1 = this.y + Math.sin(angle) * this.radius * 0.3 * pulse;
            const x2 = this.x + Math.cos(angle) * this.radius * 0.7 * pulse;
            const y2 = this.y + Math.sin(angle) * this.radius * 0.7 * pulse;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
        }
        ctx.stroke();
    }

    getFragments(canvasWidth, canvasHeight) {
        const fragments = [];
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2 + Math.random() * 0.5;
            const dist = this.radius * 1.5;
            const newX = Math.max(10, Math.min(canvasWidth - 10, this.x + Math.cos(angle) * dist));
            const newY = Math.max(10, Math.min(canvasHeight - 10, this.y + Math.sin(angle) * dist));
            const newRadius = this.radius * 0.5;
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) * 1.5;

            const fragment = new Ball(newX, newY, newRadius, 0, this.color);
            fragment.vx = Math.cos(angle) * speed;
            fragment.vy = Math.sin(angle) * speed;
            fragment.isFragment = true;
            fragments.push(fragment);
        }
        return fragments;
    }
}

// Ghost Ball - fades in and out, harder to see
export class GhostBall extends Ball {
    constructor(x, y, radius, speed, color) {
        super(x, y, radius, speed, color);
        this.type = 'ghost';
        this.visibilityPhase = Math.random() * Math.PI * 2;
        this.fadeSpeed = 0.03 + Math.random() * 0.02;
    }

    static createRandom(canvasWidth, canvasHeight, speed, radiusMin = 12, radiusMax = 18) {
        const radius = radiusMin + Math.random() * (radiusMax - radiusMin);
        const x = radius + Math.random() * (canvasWidth - radius * 2);
        const y = radius + Math.random() * (canvasHeight - radius * 2);
        const color = { main: '#b8b8ff', glow: 'rgba(184, 184, 255, 0.3)' };
        const actualSpeed = speed * (0.6 + Math.random() * 0.4);
        return new GhostBall(x, y, radius, actualSpeed, color);
    }

    update(dt, engine) {
        super.update(dt, engine);
        this.visibilityPhase += this.fadeSpeed;
    }

    getOpacity() {
        return 0.2 + (Math.sin(this.visibilityPhase) + 1) * 0.4;
    }

    render(ctx) {
        if (!this.alive) return;

        const opacity = this.getOpacity();
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.05;
        const r = this.radius * pulse;

        ctx.globalAlpha = opacity;

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

        ctx.globalAlpha = 1;
    }
}

// Bomber Ball - creates a delayed secondary explosion
export class BomberBall extends Ball {
    constructor(x, y, radius, speed, color) {
        super(x, y, radius, speed, color);
        this.type = 'bomber';
        this.fuseTime = 0.8 + Math.random() * 0.4; // seconds until second explosion
    }

    static createRandom(canvasWidth, canvasHeight, speed, radiusMin = 14, radiusMax = 20) {
        const radius = radiusMin + Math.random() * (radiusMax - radiusMin);
        const x = radius + Math.random() * (canvasWidth - radius * 2);
        const y = radius + Math.random() * (canvasHeight - radius * 2);
        const color = { main: '#ffa500', glow: 'rgba(255, 165, 0, 0.5)' };
        const actualSpeed = speed * (0.3 + Math.random() * 0.4);
        return new BomberBall(x, y, radius, actualSpeed, color);
    }

    render(ctx) {
        if (!this.alive) return;
        super.render(ctx);

        // Draw fuse/bomb indicator
        const pulse = Math.sin(this.pulsePhase * 3) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 50, 50, ${0.3 + pulse * 0.4})`;
        ctx.arc(this.x, this.y - this.radius * 0.3, this.radius * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Spark
        if (pulse > 0.7) {
            ctx.beginPath();
            ctx.fillStyle = '#ffff00';
            ctx.arc(this.x, this.y - this.radius * 0.6, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Chain Ball - when exploded, draws a lightning chain to nearest ball
export class ChainBall extends Ball {
    constructor(x, y, radius, speed, color) {
        super(x, y, radius, speed, color);
        this.type = 'chain';
        this.chainRange = 150;
    }

    static createRandom(canvasWidth, canvasHeight, speed, radiusMin = 10, radiusMax = 16) {
        const radius = radiusMin + Math.random() * (radiusMax - radiusMin);
        const x = radius + Math.random() * (canvasWidth - radius * 2);
        const y = radius + Math.random() * (canvasHeight - radius * 2);
        const color = { main: '#00ffff', glow: 'rgba(0, 255, 255, 0.5)' };
        const actualSpeed = speed * (0.5 + Math.random() * 0.5);
        return new ChainBall(x, y, radius, actualSpeed, color);
    }

    render(ctx) {
        if (!this.alive) return;
        super.render(ctx);

        // Draw chain link indicator
        const pulse = 1 + Math.sin(this.pulsePhase * 2) * 0.2;
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.lineWidth = 2;

        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            const offset = (i - 0.5) * this.radius * 0.4;
            ctx.ellipse(this.x + offset, this.y, this.radius * 0.3 * pulse, this.radius * 0.5 * pulse, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    findChainTarget(balls) {
        let nearest = null;
        let nearestDist = this.chainRange;

        for (const ball of balls) {
            if (ball === this || !ball.alive) continue;
            const dx = ball.x - this.x;
            const dy = ball.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = ball;
            }
        }
        return nearest;
    }
}

// Helper to create random special ball
export function createRandomSpecialBall(type, canvasWidth, canvasHeight, speed, radiusMin, radiusMax) {
    switch (type) {
        case 'splitter':
            return SplitterBall.createRandom(canvasWidth, canvasHeight, speed, radiusMin, radiusMax);
        case 'ghost':
            return GhostBall.createRandom(canvasWidth, canvasHeight, speed, radiusMin, radiusMax);
        case 'bomber':
            return BomberBall.createRandom(canvasWidth, canvasHeight, speed, radiusMin, radiusMax);
        case 'chain':
            return ChainBall.createRandom(canvasWidth, canvasHeight, speed, radiusMin, radiusMax);
        default:
            return Ball.createRandom(canvasWidth, canvasHeight, speed, radiusMin, radiusMax);
    }
}
