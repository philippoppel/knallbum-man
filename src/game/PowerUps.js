/**
 * Power-Up System
 * Collectible power-ups that enhance gameplay
 */

export class PowerUp {
    constructor(x, y, type, scale = 1) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 18 * scale;
        this.scale = scale;
        this.alive = true;
        this.isDead = false;
        this.layer = 5;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.rotationAngle = 0;

        // Float animation
        this.baseY = y;
        this.floatPhase = Math.random() * Math.PI * 2;

        // Config based on type
        this.config = PowerUp.TYPES[type];
    }

    static TYPES = {
        mega: {
            emoji: '🔥',
            color: '#ff4444',
            glow: 'rgba(255, 68, 68, 0.5)',
            name: 'Mega-Explosion',
            description: 'Doppelter Explosionsradius',
            duration: 0 // instant
        },
        slowmo: {
            emoji: '⏱️',
            color: '#44aaff',
            glow: 'rgba(68, 170, 255, 0.5)',
            name: 'Zeitlupe',
            description: 'Alles verlangsamt sich',
            duration: 5000
        },
        multiplier: {
            emoji: '💎',
            color: '#aa44ff',
            glow: 'rgba(170, 68, 255, 0.5)',
            name: 'Multiplikator',
            description: 'x3 Punkte',
            duration: 8000
        },
        magnet: {
            emoji: '🧲',
            color: '#ff44aa',
            glow: 'rgba(255, 68, 170, 0.5)',
            name: 'Magnet',
            description: 'Zieht Kugeln an',
            duration: 4000
        },
        extraClick: {
            emoji: '👆',
            color: '#44ff44',
            glow: 'rgba(68, 255, 68, 0.5)',
            name: 'Extra Klick',
            description: '+1 Klick',
            duration: 0
        },
        freeze: {
            emoji: '❄️',
            color: '#88ffff',
            glow: 'rgba(136, 255, 255, 0.5)',
            name: 'Einfrieren',
            description: 'Stoppt alle Kugeln',
            duration: 3000
        }
    };

    static createRandom(canvasWidth, canvasHeight, scale = 1) {
        const types = Object.keys(PowerUp.TYPES);
        const type = types[Math.floor(Math.random() * types.length)];
        const padding = 50;
        const x = padding + Math.random() * (canvasWidth - padding * 2);
        const y = padding + Math.random() * (canvasHeight - padding * 2);
        return new PowerUp(x, y, type, scale);
    }

    update(dt) {
        if (!this.alive) return;

        this.pulsePhase += 0.05;
        this.rotationAngle += 0.02;
        this.floatPhase += 0.03;

        // Float up and down
        this.y = this.baseY + Math.sin(this.floatPhase) * 5 * this.scale;
    }

    render(ctx) {
        if (!this.alive) return;

        const pulse = 1 + Math.sin(this.pulsePhase) * 0.15;
        const r = this.radius * pulse;

        // Outer glow ring
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(this.x, this.y, r * 0.5, this.x, this.y, r * 2);
        gradient.addColorStop(0, this.config.glow);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, r * 2, 0, Math.PI * 2);
        ctx.fill();

        // Rotating ring
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotationAngle);

        ctx.beginPath();
        ctx.strokeStyle = this.config.color;
        ctx.lineWidth = 2 * this.scale;
        ctx.setLineDash([5 * this.scale, 5 * this.scale]);
        ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();

        // Inner circle
        ctx.beginPath();
        const innerGradient = ctx.createRadialGradient(
            this.x - r * 0.2, this.y - r * 0.2, 0,
            this.x, this.y, r
        );
        innerGradient.addColorStop(0, '#ffffff');
        innerGradient.addColorStop(0.5, this.config.color);
        innerGradient.addColorStop(1, this.config.color);
        ctx.fillStyle = innerGradient;
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Emoji
        const fontSize = Math.round(r * 1.2);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.config.emoji, this.x, this.y);
    }

    collect() {
        this.alive = false;
        this.isDead = true;
        return {
            type: this.type,
            config: this.config
        };
    }

    isInRange(x, y, range) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy) < range + this.radius;
    }
}

// Active power-up effect tracker
export class PowerUpEffect {
    constructor(type, config, startTime) {
        this.type = type;
        this.config = config;
        this.startTime = startTime;
        this.duration = config.duration;
        this.active = true;
    }

    getRemainingTime() {
        if (this.duration === 0) return 0;
        const elapsed = Date.now() - this.startTime;
        return Math.max(0, this.duration - elapsed);
    }

    isExpired() {
        if (this.duration === 0) return true;
        return this.getRemainingTime() <= 0;
    }

    getProgress() {
        if (this.duration === 0) return 0;
        return 1 - (this.getRemainingTime() / this.duration);
    }
}
