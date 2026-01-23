/**
 * Input Manager
 * Handles mouse and touch input with unified interface
 */
export class InputManager {
    constructor(engine) {
        this.engine = engine;
        this.canvas = engine.canvas;

        this.pointerX = 0;
        this.pointerY = 0;
        this.isPointerDown = false;
        this.isPointerOver = false;

        this.clickCallbacks = [];
        this.moveCallbacks = [];

        this.lastTapTime = 0;
        this.doubleTapDelay = 300;
        this.doubleTapCallbacks = [];

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handlePointerDown(e));
        this.canvas.addEventListener('mouseup', () => this.handlePointerUp());
        this.canvas.addEventListener('mouseenter', () => this.handlePointerEnter());
        this.canvas.addEventListener('mouseleave', () => this.handlePointerLeave());
        this.canvas.addEventListener('click', (e) => this.handleClick(e));

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Prevent context menu on long press
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    handlePointerMove(e) {
        const pos = this.engine.screenToCanvas(e.clientX, e.clientY);
        this.pointerX = pos.x;
        this.pointerY = pos.y;
        this.notifyMoveCallbacks(pos.x, pos.y);
    }

    handlePointerDown(e) {
        this.isPointerDown = true;
    }

    handlePointerUp() {
        this.isPointerDown = false;
    }

    handlePointerEnter() {
        this.isPointerOver = true;
    }

    handlePointerLeave() {
        this.isPointerOver = false;
    }

    handleClick(e) {
        const pos = this.engine.screenToCanvas(e.clientX, e.clientY);
        this.notifyClickCallbacks(pos.x, pos.y);
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.isPointerOver = true;

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const pos = this.engine.screenToCanvas(touch.clientX, touch.clientY);
            this.pointerX = pos.x;
            this.pointerY = pos.y;
            this.isPointerDown = true;
            this.notifyMoveCallbacks(pos.x, pos.y);
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const pos = this.engine.screenToCanvas(touch.clientX, touch.clientY);
            this.pointerX = pos.x;
            this.pointerY = pos.y;
            this.notifyMoveCallbacks(pos.x, pos.y);
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.isPointerDown = false;

        // Check for double tap
        const now = Date.now();
        if (now - this.lastTapTime < this.doubleTapDelay) {
            this.notifyDoubleTapCallbacks();
            this.lastTapTime = 0;
        } else {
            this.lastTapTime = now;
            // Single tap = click
            this.notifyClickCallbacks(this.pointerX, this.pointerY);
        }
    }

    handleKeyDown(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            this.notifyDoubleTapCallbacks();
        }
    }

    onClick(callback) {
        this.clickCallbacks.push(callback);
    }

    onMove(callback) {
        this.moveCallbacks.push(callback);
    }

    onDoubleTap(callback) {
        this.doubleTapCallbacks.push(callback);
    }

    offClick(callback) {
        const index = this.clickCallbacks.indexOf(callback);
        if (index > -1) {
            this.clickCallbacks.splice(index, 1);
        }
    }

    notifyClickCallbacks(x, y) {
        for (const callback of this.clickCallbacks) {
            callback(x, y);
        }
    }

    notifyMoveCallbacks(x, y) {
        for (const callback of this.moveCallbacks) {
            callback(x, y);
        }
    }

    notifyDoubleTapCallbacks() {
        for (const callback of this.doubleTapCallbacks) {
            callback();
        }
    }

    getPointerPosition() {
        return { x: this.pointerX, y: this.pointerY };
    }
}
