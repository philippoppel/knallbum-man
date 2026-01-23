/**
 * Face Ball - Special balls with family faces
 * On explosion, face grows big momentarily
 */
import { Ball } from './Ball.js';

// Preload face images
const FACES = [
    { id: 'papa', src: './assets/faces/papa.png', name: 'Papa' },
    { id: 'mama', src: './assets/faces/mama.png', name: 'Mama' },
    { id: 'kind', src: './assets/faces/kind.png', name: 'Kind' }
];

const loadedImages = {};
let imagesLoaded = false;

// Preload all face images
export function preloadFaces() {
    if (imagesLoaded) return Promise.resolve();

    const promises = FACES.map(face => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                loadedImages[face.id] = img;
                resolve();
            };
            img.onerror = () => resolve(); // Continue even if image fails
            img.src = face.src;
        });
    });

    return Promise.all(promises).then(() => {
        imagesLoaded = true;
    });
}

export class FaceBall extends Ball {
    constructor(x, y, radius, speed, faceId) {
        // Use a neutral color for the ball background
        const color = { main: '#ffcc88', glow: '#ffeecc' };
        super(x, y, radius, speed, color);

        this.type = 'face';
        this.faceId = faceId || FACES[Math.floor(Math.random() * FACES.length)].id;
        this.image = loadedImages[this.faceId];
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.wobble = 0;
        this.wobbleSpeed = 0.05 + Math.random() * 0.03;
    }

    update(dt, engine) {
        super.update(dt, engine);
        this.rotation += this.rotationSpeed;
        this.wobble += this.wobbleSpeed;
    }

    render(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Slight wobble effect
        const wobbleScale = 1 + Math.sin(this.wobble) * 0.05;
        ctx.scale(wobbleScale, wobbleScale);
        ctx.rotate(this.rotation);

        if (this.image) {
            // Draw face image
            const size = this.radius * 2.2;
            ctx.drawImage(this.image, -size/2, -size/2, size, size);
        } else {
            // Fallback: draw colored circle with smile
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color.main;
            ctx.fill();

            // Simple face
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(-this.radius * 0.3, -this.radius * 0.2, this.radius * 0.12, 0, Math.PI * 2);
            ctx.arc(this.radius * 0.3, -this.radius * 0.2, this.radius * 0.12, 0, Math.PI * 2);
            ctx.fill();

            // Smile
            ctx.beginPath();
            ctx.arc(0, this.radius * 0.1, this.radius * 0.4, 0, Math.PI);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.restore();
    }

    static createRandom(canvasWidth, canvasHeight, speed, radiusMin, radiusMax) {
        const radius = radiusMin + Math.random() * (radiusMax - radiusMin);
        const margin = radius * 2;
        const x = margin + Math.random() * (canvasWidth - margin * 2);
        const y = margin + Math.random() * (canvasHeight - margin * 2);

        return new FaceBall(x, y, radius * 1.3, speed, null); // Slightly bigger than normal balls
    }
}

/**
 * Face Explosion Effect - Shows face growing big then fading
 */
export class FaceExplosion {
    constructor(x, y, faceId, scale = 1) {
        this.x = x;
        this.y = y;
        this.faceId = faceId;
        this.image = loadedImages[faceId];
        this.scale = scale;

        this.size = 50 * scale;
        this.targetSize = 250 * scale;
        this.currentSize = this.size;
        this.alpha = 1;
        this.phase = 'grow'; // grow, hold, fade
        this.holdTime = 0;

        this.isDead = false;
        this.layer = 50; // Render above balls

        this.rotation = (Math.random() - 0.5) * 0.3;
    }

    update(dt) {
        if (this.phase === 'grow') {
            this.currentSize += (this.targetSize - this.currentSize) * 0.15;
            if (this.currentSize > this.targetSize * 0.95) {
                this.phase = 'hold';
            }
        } else if (this.phase === 'hold') {
            this.holdTime += dt;
            if (this.holdTime > 0.3) {
                this.phase = 'fade';
            }
        } else if (this.phase === 'fade') {
            this.alpha -= 0.05;
            this.currentSize *= 1.02;
            if (this.alpha <= 0) {
                this.isDead = true;
            }
        }
    }

    render(ctx) {
        if (this.isDead) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.image) {
            ctx.drawImage(
                this.image,
                -this.currentSize / 2,
                -this.currentSize / 2,
                this.currentSize,
                this.currentSize
            );
        } else {
            // Fallback circle
            ctx.beginPath();
            ctx.arc(0, 0, this.currentSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffcc88';
            ctx.fill();
        }

        ctx.restore();
    }
}
