/**
 * Visual Effects
 * Chain lines and combo popups
 */

export class ChainLine {
    constructor(x1, y1, x2, y2, scale = 1) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.life = 1;
        this.isDead = false;
        this.layer = 0;
        this.scale = scale;
    }

    update(dt) {
        this.life -= 0.03;
        if (this.life <= 0) {
            this.isDead = true;
        }
    }

    render(ctx) {
        if (this.life <= 0) return;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(126, 232, 250, ${this.life * 0.6})`;
        ctx.lineWidth = 2 * this.life * this.scale;
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
    }
}

export class ComboPopup {
    constructor(x, y, combo, scale = 1) {
        this.x = x;
        this.y = y;
        this.combo = combo;
        this.life = 1;
        this.isDead = false;
        this.layer = 10;
        this.scale = scale;
    }

    static COLORS = ['#ffd89b', '#a0e7a0', '#7ee8fa', '#eec0c6'];

    update(dt) {
        this.life -= 0.02;
        if (this.life <= 0) {
            this.isDead = true;
        }
    }

    render(ctx) {
        if (this.life <= 0) return;

        const colorIndex = Math.min(this.combo - 2, ComboPopup.COLORS.length - 1);
        const color = ComboPopup.COLORS[colorIndex];

        const fontSize = (20 + this.combo * 2) * this.scale;
        ctx.font = `bold ${fontSize}px "Outfit", sans-serif`;
        ctx.fillStyle = color;
        ctx.globalAlpha = this.life;
        ctx.textAlign = 'center';
        ctx.fillText(`x${this.combo}!`, this.x, this.y - (1 - this.life) * 30 * this.scale);
        ctx.globalAlpha = 1;
    }
}

export class PreviewCircle {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.radius = 75;
        this.visible = false;
        this.layer = 0;
        this.isDead = false;
        this.scale = 1;

        this.ballsInRange = 0;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setRadius(radius) {
        this.radius = radius;
    }

    setScale(scale) {
        this.scale = scale;
    }

    setVisible(visible) {
        this.visible = visible;
    }

    setBallsInRange(count) {
        this.ballsInRange = count;
    }

    update() {}

    render(ctx) {
        if (!this.visible) return;

        // Dashed circle
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(126, 232, 250, 0.3)';
        ctx.lineWidth = 2 * this.scale;
        ctx.setLineDash([5 * this.scale, 5 * this.scale]);
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Inner glow
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, 'rgba(126, 232, 250, 0.1)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Count text
        const fontSize = Math.round(14 * this.scale);
        ctx.font = `${fontSize}px "Space Mono", monospace`;
        ctx.fillStyle = this.ballsInRange > 0 ? 'rgba(160, 231, 160, 0.9)' : 'rgba(106, 106, 138, 0.9)';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.ballsInRange} in Reichweite`, this.x, this.y + this.radius + 20 * this.scale);
    }
}
