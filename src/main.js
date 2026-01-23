/**
 * Knallbum-Man
 * A chain reaction game
 *
 * Entry point - initializes all game systems
 */
import { GameEngine } from './engine/GameEngine.js';
import { InputManager } from './engine/InputManager.js';
import { AudioManager } from './engine/AudioManager.js';
import { Game } from './game/Game.js';

class App {
    constructor() {
        this.engine = null;
        this.inputManager = null;
        this.audioManager = null;
        this.game = null;

        this.init();
    }

    init() {
        // Create engine
        this.engine = new GameEngine('gameCanvas');

        // Create input manager
        this.inputManager = new InputManager(this.engine);

        // Create audio manager
        this.audioManager = new AudioManager();

        // Create game
        this.game = new Game(this.engine, this.inputManager, this.audioManager);

        // Add game update to engine loop
        this.engine.addSystem({
            update: (dt) => this.game.update(dt)
        });

        // Start engine
        this.engine.start();

        // Log startup
        console.log('Knallbum-Man initialized');
    }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new App());
} else {
    new App();
}
