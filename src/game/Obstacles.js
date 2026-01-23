/**
 * Obstacles
 * Environmental hazards and modifiers
 */

// Wall - blocks explosions and balls bounce off
export class Wall {
    constructor(x, y, width, height, scale = 1) {
        this.x = x;
        this.y = y;
        this.width = width * scale;
        this.height = height * scale;
        this.scale = scale;
        this.isDead = false;
        this.layer = 1;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }

    static createRandom(canvasWidth, canvasHeight, scale = 1) {
        const isHorizontal = Math.random() > 0.5;
        const width = isHorizontal ? (80 + Math.random() * 100) : 15;
        const height = isHorizontal ? 15 : (80 + Math.random() * 100);
        const padding = 80;
        const x = padding + Math.random() * (canvasWidth - padding * 2 - width);
        const y = padding + Math.random() * (canvasHeight - padding * 2 - height);
        return new Wall(x, y, width, height, scale);
    }

    update(dt) {
        this.pulsePhase += 0.02;
    }

    render(ctx) {
        const glow = 0.3 + Math.sin(this.pulsePhase) * 0.1;

        // Glow effect
        ctx.shadowColor = 'rgba(126, 232, 250, 0.5)';
        ctx.shadowBlur = 10 * this.scale;

        // Main wall
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, `rgba(126, 232, 250, ${glow})`);
        gradient.addColorStop(0.5, `rgba(126, 232, 250, ${glow + 0.2})`);
        gradient.addColorStop(1, `rgba(126, 232, 250, ${glow})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Border
        ctx.strokeStyle = 'rgba(126, 232, 250, 0.8)';
        ctx.lineWidth = 2 * this.scale;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.shadowBlur = 0;
    }

    // Check if a point is inside the wall
    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    // Check if explosion radius intersects wall
    blocksExplosion(expX, expY, expRadius) {
        // Find closest point on rectangle to circle center
        const closestX = Math.max(this.x, Math.min(expX, this.x + this.width));
        const closestY = Math.max(this.y, Math.min(expY, this.y + this.height));

        const dx = expX - closestX;
        const dy = expY - closestY;
        return Math.sqrt(dx * dx + dy * dy) < expRadius;
    }

    // Bounce a ball off the wall
    bounceBall(ball) {
        const nextX = ball.x + ball.vx;
        const nextY = ball.y + ball.vy;

        // Check collision with wall
        if (nextX + ball.radius > this.x && nextX - ball.radius < this.x + this.width &&
            nextY + ball.radius > this.y && nextY - ball.radius < this.y + this.height) {

            // Determine which side was hit
            const overlapLeft = (ball.x + ball.radius) - this.x;
            const overlapRight = (this.x + this.width) - (ball.x - ball.radius);
            const overlapTop = (ball.y + ball.radius) - this.y;
            const overlapBottom = (this.y + this.height) - (ball.y - ball.radius);

            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);

            if (minOverlapX < minOverlapY) {
                ball.vx *= -1;
                if (overlapLeft < overlapRight) {
                    ball.x = this.x - ball.radius;
                } else {
                    ball.x = this.x + this.width + ball.radius;
                }
            } else {
                ball.vy *= -1;
                if (overlapTop < overlapBottom) {
                    ball.y = this.y - ball.radius;
                } else {
                    ball.y = this.y + this.height + ball.radius;
                }
            }
            return true;
        }
        return false;
    }
}

// Black Hole - attracts nearby balls
export class BlackHole {
    constructor(x, y, scale = 1) {
        this.x = x;
        this.y = y;
        this.radius = 25 * scale;
        this.attractionRadius = 120 * scale;
        this.strength = 0.3;
        this.scale = scale;
        this.isDead = false;
        this.layer = 0;
        this.rotationAngle = 0;
        this.pulsePhase = 0;
    }

    static createRandom(canvasWidth, canvasHeight, scale = 1) {
        const padding = 100;
        const x = padding + Math.random() * (canvasWidth - padding * 2);
        const y = padding + Math.random() * (canvasHeight - padding * 2);
        return new BlackHole(x, y, scale);
    }

    update(dt) {
        this.rotationAngle += 0.05;
        this.pulsePhase += 0.03;
    }

    render(ctx) {
        // Attraction field
        const fieldPulse = 0.3 + Math.sin(this.pulsePhase) * 0.1;
        const fieldGradient = ctx.createRadialGradient(
            this.x, this.y, this.radius,
            this.x, this.y, this.attractionRadius
        );
        fieldGradient.addColorStop(0, `rgba(100, 0, 150, ${fieldPulse})`);
        fieldGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = fieldGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.attractionRadius, 0, Math.PI * 2);
        ctx.fill();

        // Spiral arms
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotationAngle);

        ctx.strokeStyle = 'rgba(150, 50, 200, 0.4)';
        ctx.lineWidth = 3 * this.scale;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            const startAngle = (i / 3) * Math.PI * 2;
            for (let t = 0; t < Math.PI * 2; t += 0.1) {
                const r = this.radius + t * 15 * this.scale;
                const angle = startAngle + t;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                if (t === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        ctx.restore();

        // Core
        const coreGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        coreGradient.addColorStop(0, '#000000');
        coreGradient.addColorStop(0.7, '#1a0033');
        coreGradient.addColorStop(1, '#330066');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Event horizon glow
        ctx.strokeStyle = '#9933ff';
        ctx.lineWidth = 2 * this.scale;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Apply gravitational pull to a ball
    attractBall(ball) {
        const dx = this.x - ball.x;
        const dy = this.y - ball.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.attractionRadius && dist > this.radius) {
            const force = this.strength * (1 - dist / this.attractionRadius);
            ball.vx += (dx / dist) * force;
            ball.vy += (dy / dist) * force;

            // Cap velocity
            const maxSpeed = 3;
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            if (speed > maxSpeed) {
                ball.vx = (ball.vx / speed) * maxSpeed;
                ball.vy = (ball.vy / speed) * maxSpeed;
            }
        }

        // Destroy ball if it reaches the core
        if (dist < this.radius * 0.5) {
            return true; // Ball should be destroyed
        }
        return false;
    }
}

// Reflector - bounces explosion waves in a different direction
export class Reflector {
    constructor(x, y, angle, scale = 1) {
        this.x = x;
        this.y = y;
        this.angle = angle; // radians
        this.length = 60 * scale;
        this.scale = scale;
        this.isDead = false;
        this.layer = 1;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.lastReflectTime = 0;
    }

    static createRandom(canvasWidth, canvasHeight, scale = 1) {
        const padding = 80;
        const x = padding + Math.random() * (canvasWidth - padding * 2);
        const y = padding + Math.random() * (canvasHeight - padding * 2);
        const angle = Math.random() * Math.PI;
        return new Reflector(x, y, angle, scale);
    }

    update(dt) {
        this.pulsePhase += 0.04;
    }

    render(ctx) {
        const glow = 0.5 + Math.sin(this.pulsePhase) * 0.2;

        // Calculate endpoints
        const dx = Math.cos(this.angle) * this.length / 2;
        const dy = Math.sin(this.angle) * this.length / 2;

        const x1 = this.x - dx;
        const y1 = this.y - dy;
        const x2 = this.x + dx;
        const y2 = this.y + dy;

        // Glow effect
        ctx.shadowColor = 'rgba(255, 255, 100, 0.8)';
        ctx.shadowBlur = 15 * this.scale;

        // Main line
        ctx.strokeStyle = `rgba(255, 255, 100, ${glow + 0.3})`;
        ctx.lineWidth = 6 * this.scale;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Arrow indicators showing reflection direction
        const perpAngle = this.angle + Math.PI / 2;
        const arrowDist = 15 * this.scale;
        const arrowSize = 8 * this.scale;

        ctx.strokeStyle = `rgba(255, 255, 100, ${glow})`;
        ctx.lineWidth = 2 * this.scale;

        for (let side = -1; side <= 1; side += 2) {
            const ax = this.x + Math.cos(perpAngle) * arrowDist * side;
            const ay = this.y + Math.sin(perpAngle) * arrowDist * side;

            ctx.beginPath();
            ctx.moveTo(ax - Math.cos(perpAngle) * arrowSize * side, ay - Math.sin(perpAngle) * arrowSize * side);
            ctx.lineTo(ax, ay);
            ctx.stroke();
        }

        ctx.shadowBlur = 0;
    }

    // Check if an explosion should be reflected
    // Returns new explosion position if reflected, null otherwise
    reflectExplosion(expX, expY, expRadius) {
        // Check if explosion is close to the reflector line
        const dx = Math.cos(this.angle) * this.length / 2;
        const dy = Math.sin(this.angle) * this.length / 2;

        const x1 = this.x - dx;
        const y1 = this.y - dy;
        const x2 = this.x + dx;
        const y2 = this.y + dy;

        // Distance from point to line segment
        const dist = this.pointToLineDistance(expX, expY, x1, y1, x2, y2);

        if (dist < expRadius && Date.now() - this.lastReflectTime > 500) {
            this.lastReflectTime = Date.now();

            // Calculate reflection point on the other side
            const perpAngle = this.angle + Math.PI / 2;
            const reflectDist = expRadius * 1.5;

            // Determine which side the explosion is on
            const side = ((expX - this.x) * Math.sin(this.angle) - (expY - this.y) * Math.cos(this.angle)) > 0 ? -1 : 1;

            return {
                x: this.x + Math.cos(perpAngle) * reflectDist * side,
                y: this.y + Math.sin(perpAngle) * reflectDist * side
            };
        }
        return null;
    }

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
