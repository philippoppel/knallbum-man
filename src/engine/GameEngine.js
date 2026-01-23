/**
 * Core Game Engine
 * Handles the game loop, canvas management, and coordinates all subsystems
 */
export class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Base dimensions for desktop
        this.desktopWidth = 700;
        this.desktopHeight = 500;

        // Actual game world dimensions (may change on mobile)
        this.baseWidth = this.desktopWidth;
        this.baseHeight = this.desktopHeight;
        this.scale = 1;

        this.lastTime = 0;
        this.deltaTime = 0;
        this.isRunning = false;
        this.isPaused = false;

        this.entities = [];
        this.systems = [];

        this.shakeIntensity = 0;
        this.shakeDecay = 0.9;

        this.isMobile = this.detectMobile();

        this.setupCanvas();
        this.setupResizeHandler();
    }

    detectMobile() {
        return window.innerWidth <= 768 ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0);
    }

    setupCanvas() {
        this.updateCanvasSize();
    }

    updateCanvasSize() {
        const wrapper = this.canvas.parentElement;
        this.isMobile = this.detectMobile();

        if (this.isMobile) {
            // Mobile: use full available space
            const availableWidth = window.innerWidth;
            const availableHeight = window.innerHeight - 120; // Account for header/controls

            // Use device pixel ratio for crisp rendering
            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            // Calculate dimensions maintaining aspect ratio but maximizing space
            const aspectRatio = this.desktopWidth / this.desktopHeight;
            let displayWidth = availableWidth;
            let displayHeight = availableWidth / aspectRatio;

            if (displayHeight > availableHeight) {
                displayHeight = availableHeight;
                displayWidth = displayHeight * aspectRatio;
            }

            // For mobile, we use the full display area
            displayWidth = availableWidth;
            displayHeight = availableHeight;

            // Set internal resolution (scaled for sharpness)
            this.baseWidth = Math.round(displayWidth * dpr);
            this.baseHeight = Math.round(displayHeight * dpr);

            // Cap at reasonable resolution to prevent performance issues
            const maxRes = 1400;
            if (this.baseWidth > maxRes) {
                const ratio = maxRes / this.baseWidth;
                this.baseWidth = maxRes;
                this.baseHeight = Math.round(this.baseHeight * ratio);
            }

            this.canvas.width = this.baseWidth;
            this.canvas.height = this.baseHeight;

            // Display size
            this.canvas.style.width = `${displayWidth}px`;
            this.canvas.style.height = `${displayHeight}px`;

            this.scale = displayWidth / this.baseWidth;
        } else {
            // Desktop: use fixed dimensions
            this.baseWidth = this.desktopWidth;
            this.baseHeight = this.desktopHeight;

            const maxWidth = Math.min(window.innerWidth - 20, this.baseWidth);
            const maxHeight = Math.min(window.innerHeight - 200, this.baseHeight);

            const aspectRatio = this.baseWidth / this.baseHeight;
            let width = maxWidth;
            let height = width / aspectRatio;

            if (height > maxHeight) {
                height = maxHeight;
                width = height * aspectRatio;
            }

            this.scale = width / this.baseWidth;

            this.canvas.width = this.baseWidth;
            this.canvas.height = this.baseHeight;

            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;

            document.documentElement.style.setProperty('--canvas-width', `${width}px`);
            document.documentElement.style.setProperty('--canvas-height', `${height}px`);
        }
    }

    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateCanvasSize();
            }, 100);
        });
    }

    get width() {
        return this.baseWidth;
    }

    get height() {
        return this.baseHeight;
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }

    clearEntities() {
        this.entities = [];
    }

    addSystem(system) {
        this.systems.push(system);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    stop() {
        this.isRunning = false;
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    shake(intensity) {
        this.shakeIntensity = Math.min(intensity, 15);
    }

    gameLoop(timestamp) {
        if (!this.isRunning) return;

        this.deltaTime = this.isPaused ? 0 : Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        this.update(this.deltaTime);
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(dt) {
        if (this.isPaused) return;

        // Update all entities
        for (const entity of this.entities) {
            if (entity.update) {
                entity.update(dt, this);
            }
        }

        // Remove dead entities
        this.entities = this.entities.filter(e => !e.isDead);

        // Update systems
        for (const system of this.systems) {
            if (system.update) {
                system.update(dt, this);
            }
        }

        // Update shake
        if (this.shakeIntensity > 0.1) {
            this.shakeIntensity *= this.shakeDecay;
        } else {
            this.shakeIntensity = 0;
        }
    }

    render() {
        this.ctx.save();

        // Apply screen shake
        if (this.shakeIntensity > 0) {
            this.ctx.translate(
                (Math.random() - 0.5) * this.shakeIntensity,
                (Math.random() - 0.5) * this.shakeIntensity
            );
        }

        // Clear canvas
        this.ctx.clearRect(-10, -10, this.width + 20, this.height + 20);

        // Draw background grid
        this.drawGrid();

        // Render all entities (sorted by layer)
        const sortedEntities = [...this.entities].sort((a, b) => (a.layer || 0) - (b.layer || 0));
        for (const entity of sortedEntities) {
            if (entity.render) {
                entity.render(this.ctx, this);
            }
        }

        // Render systems
        for (const system of this.systems) {
            if (system.render) {
                system.render(this.ctx, this);
            }
        }

        this.ctx.restore();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(126, 232, 250, 0.03)';
        this.ctx.lineWidth = 1;

        // Dynamic grid spacing based on canvas size
        const gridSize = Math.max(40, Math.round(this.width / 14));

        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    // Convert screen coordinates to canvas coordinates
    screenToCanvas(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.baseWidth / rect.width;
        const scaleY = this.baseHeight / rect.height;
        return {
            x: (screenX - rect.left) * scaleX,
            y: (screenY - rect.top) * scaleY
        };
    }

    getEntitiesByType(type) {
        return this.entities.filter(e => e instanceof type);
    }

    getEntitiesInRadius(x, y, radius, filterFn = null) {
        return this.entities.filter(entity => {
            if (filterFn && !filterFn(entity)) return false;
            if (!entity.x || !entity.y) return false;

            const dx = entity.x - x;
            const dy = entity.y - y;
            const entityRadius = entity.radius || 0;
            return Math.sqrt(dx * dx + dy * dy) < radius + entityRadius;
        });
    }
}
