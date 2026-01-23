/**
 * Main Game Class - Simple & Fun
 * Classic levels with clear progression
 */
import { Ball } from './Ball.js';
import { SplitterBall, GhostBall, BomberBall, ChainBall, createRandomSpecialBall } from './SpecialBalls.js';
import { FaceBall, FaceExplosion, preloadFaces } from './FaceBall.js';
import { Explosion } from './Explosion.js';
import { Particle } from './Particle.js';
import { ChainLine, ComboPopup, PreviewCircle } from './Effects.js';
import { PowerUp, PowerUpEffect } from './PowerUps.js';
import { Leaderboard } from './Leaderboard.js';
import { getLevelConfig, STORAGE_KEYS, COMBO_TIME_WINDOW, BALL_COLORS } from '../utils/constants.js';

export class Game {
    constructor(engine, inputManager, audioManager) {
        this.engine = engine;
        this.input = inputManager;
        this.audio = audioManager;

        // Leaderboard
        this.leaderboard = new Leaderboard();

        // Game state
        this.state = 'waiting';
        this.level = 1;
        this.score = 0;
        this.highscore = this.getLeaderboardHighscore();
        this.maxLevel = this.loadMaxLevel();

        // Round state
        this.clickUsed = false;
        this.caughtThisRound = 0;
        this.currentCombo = 1;
        this.maxCombo = 0;
        this.lastExplosionTime = 0;
        this.waveStats = [];
        this.currentWave = 0;

        // Power-ups
        this.activePowerUps = [];
        this.scoreMultiplier = 1;
        this.multiplierEndTime = 0;
        this.extraClick = false;
        this.pendingExplosions = 0;

        // Preview
        this.preview = new PreviewCircle();
        this.engine.addEntity(this.preview);

        // UI
        this.ui = {
            target: document.getElementById('target'),
            combo: document.getElementById('combo'),
            score: document.getElementById('score'),
            highscore: document.getElementById('highscore'),
            level: document.getElementById('level'),
            progress: document.getElementById('progress'),
            instructions: document.getElementById('instructions'),
            result: document.getElementById('result'),
            pauseOverlay: document.getElementById('pauseOverlay'),
            nextBtn: document.getElementById('nextBtn'),
            restartBtn: document.getElementById('restartBtn'),
            pauseRestartBtn: document.getElementById('pauseRestartBtn'),
            soundToggle: document.getElementById('soundToggle'),
            canvasWrapper: document.getElementById('canvasWrapper')
        };

        this.setupInputHandlers();
        this.setupUIHandlers();
        this.setupVisibilityHandler();

        // Preload face images then start
        preloadFaces().then(() => {
            // Try to restore saved game state
            if (!this.restoreGameState()) {
                this.initLevel();
            }
        });
    }

    setupVisibilityHandler() {
        // Save game when user switches away (mobile app switch, tab change)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveGameState();
            }
        });

        // Also save on page unload
        window.addEventListener('pagehide', () => {
            this.saveGameState();
        });
    }

    saveGameState() {
        // Only save if game is in progress (not ended, not at start)
        if (this.state === 'ended' || (this.state === 'waiting' && !this.clickUsed && this.score === 0)) {
            return;
        }

        const state = {
            level: this.level,
            score: this.score,
            timestamp: Date.now()
        };

        localStorage.setItem('knallbumman-gamestate', JSON.stringify(state));
    }

    restoreGameState() {
        try {
            const saved = localStorage.getItem('knallbumman-gamestate');
            if (!saved) return false;

            const state = JSON.parse(saved);

            // Only restore if saved less than 1 hour ago
            if (Date.now() - state.timestamp > 60 * 60 * 1000) {
                localStorage.removeItem('knallbumman-gamestate');
                return false;
            }

            // Restore state
            this.level = state.level;
            this.score = state.score;

            // Clear saved state
            localStorage.removeItem('knallbumman-gamestate');

            // Start at the saved level
            this.initLevel();
            this.showBonus('⏸️ Fortgesetzt!', this.engine.width / 2, this.engine.height / 2);

            return true;
        } catch (e) {
            return false;
        }
    }

    clearGameState() {
        localStorage.removeItem('knallbumman-gamestate');
    }

    getConfig() {
        return getLevelConfig(this.level, this.engine.width, this.engine.height);
    }

    // What unlocks at each level - shown visually with explanation
    getUnlocks(level) {
        const unlocks = [];
        if (level === 3) unlocks.push({ emoji: '⭐', name: 'Power-Ups', desc: '💥2x Explosion · ✨3x Punkte · 🐌Zeitlupe · ❄️Einfrieren' });
        if (level === 5) unlocks.push({ emoji: '✂️', name: 'Splitter-Kugeln', desc: 'Teilt sich in 3 kleine Kugeln' });
        if (level === 7) unlocks.push({ emoji: '👻', name: 'Geister-Kugeln', desc: 'Halb-durchsichtig, extra Punkte' });
        if (level === 10) unlocks.push({ emoji: '💣', name: 'Bomber-Kugeln', desc: 'Explodiert nochmal nach kurzer Zeit' });
        if (level === 15) unlocks.push({ emoji: '⚡', name: 'Ketten-Kugeln', desc: 'Löst automatisch nächste Kugel aus' });
        return unlocks;
    }

    setupInputHandlers() {
        this.input.onClick((x, y) => this.handleClick(x, y));
        this.input.onMove((x, y) => this.handleMove(x, y));
        this.input.onDoubleTap(() => this.togglePause());
    }

    setupUIHandlers() {
        this.ui.restartBtn.addEventListener('click', () => {
            // Shuffle balls if waiting, full restart if game over
            if (this.state === 'waiting' && !this.clickUsed) {
                this.shuffleBalls();
            } else {
                this.restart();
            }
        });
        this.ui.nextBtn.addEventListener('click', () => this.nextLevel());
        this.ui.soundToggle.addEventListener('click', () => this.toggleSound());
        this.ui.pauseRestartBtn.addEventListener('click', () => {
            this.ui.pauseOverlay.classList.remove('visible');
            this.engine.resume();
            this.restart();
        });
    }

    handleClick(x, y) {
        if (this.state === 'ended' || this.engine.isPaused) return;
        if (this.state !== 'waiting') return;

        // Consume extra click if this is the second click
        if (this.extraClick) {
            this.extraClick = false;
        }

        this.audio.init();
        this.clickUsed = true;
        this.state = 'playing';
        this.ui.instructions.classList.remove('visible');
        this.preview.setVisible(false);

        // Collect power-ups
        const config = this.getConfig();
        const powerUps = this.engine.entities.filter(e => e instanceof PowerUp && e.alive);
        for (const powerUp of powerUps) {
            if (powerUp.isInRange(x, y, config.explosionRadius)) {
                this.collectPowerUp(powerUp);
            }
        }

        // Create explosion
        const color = BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];
        let radius = config.explosionRadius;

        if (this.hasPowerUp('mega')) {
            radius *= 2;
            this.removePowerUp('mega');
        }

        this.createExplosion(x, y, color, radius, config.explosionDuration);
        this.audio.playExplosion(0, color.main);
    }

    handleMove(x, y) {
        this.preview.setPosition(x, y);

        if (this.state === 'waiting' && !this.clickUsed && this.input.isPointerOver) {
            this.preview.setVisible(true);
            const config = this.getConfig();
            let radius = config.explosionRadius;
            if (this.hasPowerUp('mega')) radius *= 2;
            this.preview.setRadius(radius);
            this.preview.setScale(config.scale);

            // Count balls in range
            const balls = this.engine.entities.filter(e => e instanceof Ball && e.alive);
            let inRange = 0;
            balls.forEach(ball => {
                if (ball.isInRange(x, y, radius)) inRange++;
            });
            this.preview.setBallsInRange(inRange);
        } else {
            this.preview.setVisible(false);
        }
    }

    collectPowerUp(powerUp) {
        const { type, config } = powerUp.collect();
        this.audio.playPowerUp(type);

        if (config.duration > 0) {
            this.activePowerUps.push(new PowerUpEffect(type, config, Date.now()));
        }

        // Show what the power-up does
        const descriptions = {
            mega: '💥 MEGA - 2x Explosion!',
            multiplier: '✨ 3x PUNKTE!',
            slowmo: '🐌 ZEITLUPE!',
            magnet: '🧲 MAGNET!',
            extraClick: '👆 +1 KLICK!',
            freeze: '❄️ EINFRIEREN!'
        };

        this.showBonus(descriptions[type] || config.emoji, powerUp.x, powerUp.y - 30);

        switch (type) {
            case 'mega':
                this.activePowerUps.push(new PowerUpEffect(type, config, Date.now()));
                break;
            case 'multiplier':
                this.scoreMultiplier = 3;
                this.multiplierEndTime = Date.now() + config.duration;
                break;
        }
    }

    showBonus(text, x, y) {
        // Create floating text element
        const bonus = document.createElement('div');
        bonus.className = 'floating-bonus';
        bonus.textContent = text;
        bonus.style.cssText = `
            position: fixed;
            left: ${Math.min(window.innerWidth - 150, Math.max(10, x))}px;
            top: ${Math.max(10, y)}px;
            color: #ffd700;
            font-size: 1.1rem;
            font-weight: bold;
            text-shadow: 0 0 10px rgba(255,215,0,0.8), 2px 2px 4px rgba(0,0,0,0.8);
            pointer-events: none;
            z-index: 1000;
            animation: floatUp 1.5s ease-out forwards;
            white-space: nowrap;
        `;
        document.body.appendChild(bonus);
        setTimeout(() => bonus.remove(), 1500);
    }

    hasPowerUp(type) {
        return this.activePowerUps.some(p => p.type === type && !p.isExpired());
    }

    removePowerUp(type) {
        const index = this.activePowerUps.findIndex(p => p.type === type);
        if (index > -1) this.activePowerUps.splice(index, 1);
    }

    togglePause() {
        if (this.state === 'playing' || this.state === 'waiting') {
            const isPaused = this.engine.togglePause();
            this.ui.pauseOverlay.classList.toggle('visible', isPaused);
        }
    }

    toggleSound() {
        this.audio.init();
        const enabled = this.audio.toggle();
        this.ui.soundToggle.textContent = enabled ? '🔊' : '🔇';
        this.ui.soundToggle.classList.toggle('muted', !enabled);
    }

    initLevel() {
        const config = this.getConfig();

        // Clear entities
        this.engine.entities = this.engine.entities.filter(e => e === this.preview);

        // Reset state
        this.caughtThisRound = 0;
        this.clickUsed = false;
        this.currentCombo = 1;
        this.maxCombo = 0;
        this.waveStats = [];
        this.currentWave = 0;
        this.state = 'waiting';
        this.scoreMultiplier = 1;
        this.multiplierEndTime = 0;
        this.extraClick = false;
        this.activePowerUps = [];
        this.pendingExplosions = 0;

        // Create balls
        this.createBalls(config);

        // Maybe spawn power-up (from level 3)
        if (this.level >= 3 && Math.random() < 0.3 + this.level * 0.02) {
            const powerUp = PowerUp.createRandom(this.engine.width, this.engine.height, config.scale);
            this.engine.addEntity(powerUp);
        }

        // Update UI
        this.showInstructions();
        this.ui.result.classList.remove('visible');
        this.ui.nextBtn.style.display = 'none';
        this.engine.resume();
        this.updateUI();
    }

    createBalls(config) {
        const totalBalls = config.ballCount;

        // Special ball chances based on level
        const splitterChance = this.level >= 5 ? Math.min(0.15, (this.level - 5) * 0.02) : 0;
        const ghostChance = this.level >= 7 ? Math.min(0.1, (this.level - 7) * 0.015) : 0;
        const bomberChance = this.level >= 10 ? Math.min(0.1, (this.level - 10) * 0.015) : 0;
        const chainChance = this.level >= 15 ? Math.min(0.1, (this.level - 15) * 0.01) : 0;

        // Face balls - 1-2 per level, bonus points!
        const faceCount = Math.min(2, Math.floor(this.level / 3) + 1);

        for (let i = 0; i < totalBalls; i++) {
            let ball;
            const rand = Math.random();

            // First few balls can be face balls
            if (i < faceCount) {
                ball = FaceBall.createRandom(this.engine.width, this.engine.height, config.ballSpeed * 0.8, config.ballRadiusMin, config.ballRadiusMax);
            } else if (rand < chainChance) {
                ball = createRandomSpecialBall('chain', this.engine.width, this.engine.height, config.ballSpeed, config.ballRadiusMin, config.ballRadiusMax);
            } else if (rand < chainChance + bomberChance) {
                ball = createRandomSpecialBall('bomber', this.engine.width, this.engine.height, config.ballSpeed, config.ballRadiusMin, config.ballRadiusMax);
            } else if (rand < chainChance + bomberChance + ghostChance) {
                ball = createRandomSpecialBall('ghost', this.engine.width, this.engine.height, config.ballSpeed, config.ballRadiusMin, config.ballRadiusMax);
            } else if (rand < chainChance + bomberChance + ghostChance + splitterChance) {
                ball = createRandomSpecialBall('splitter', this.engine.width, this.engine.height, config.ballSpeed, config.ballRadiusMin, config.ballRadiusMax);
            } else {
                ball = Ball.createRandom(this.engine.width, this.engine.height, config.ballSpeed, config.ballRadiusMin, config.ballRadiusMax);
            }

            this.engine.addEntity(ball);
        }
    }

    showInstructions() {
        const config = this.getConfig();
        const unlocks = this.getUnlocks(this.level);

        let html = `<h2>Level ${this.level}</h2>`;
        html += `<p>Triff ${config.targetCount} von ${config.ballCount} Kugeln</p>`;

        // Show unlock for this level
        if (unlocks.length > 0) {
            html += `<div style="margin: 10px 0; padding: 10px; background: rgba(126,232,250,0.15); border-radius: 8px; border: 1px solid rgba(126,232,250,0.3);">`;
            html += `<div><span style="font-size: 1.3rem;">${unlocks[0].emoji}</span> <span style="color: var(--accent-primary); font-weight: bold;">NEU: ${unlocks[0].name}</span></div>`;
            html += `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">${unlocks[0].desc}</div>`;
            html += `</div>`;
        }

        // Face balls legend (always show)
        html += `<div style="margin-top: 10px; font-size: 0.7rem; color: var(--text-muted); display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">`;
        html += `<span title="Extra Explosion">👨 +💥</span>`;
        html += `<span title="3x Punkte">👩 +✨</span>`;
        html += `<span title="Extra Klick">👶 +👆</span>`;
        html += `</div>`;

        html += `<p class="hint" style="margin-top: 8px;">Tippe um zu starten</p>`;

        this.ui.instructions.innerHTML = html;
        this.ui.instructions.classList.add('visible');

        // Auto-hide overlay after 3 seconds
        clearTimeout(this.overlayTimeout);
        this.overlayTimeout = setTimeout(() => {
            this.ui.instructions.classList.remove('visible');
        }, 3000);
    }

    shuffleBalls() {
        // Reposition all balls randomly without changing their types
        const config = this.getConfig();
        const balls = this.engine.entities.filter(e => e instanceof Ball && e.alive);

        balls.forEach(ball => {
            const margin = ball.radius * 2;
            ball.x = margin + Math.random() * (this.engine.width - margin * 2);
            ball.y = margin + Math.random() * (this.engine.height - margin * 2);

            // New random direction
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            ball.vx = Math.cos(angle) * speed;
            ball.vy = Math.sin(angle) * speed;
        });
    }

    createExplosion(x, y, color, radius, duration, sourceX, sourceY) {
        const config = this.getConfig();
        const explosion = new Explosion(x, y, color, radius, duration);
        this.engine.addEntity(explosion);

        const particles = Particle.createBurst(x, y, color, 15, config.scale);
        particles.forEach(p => this.engine.addEntity(p));

        if (sourceX !== undefined && sourceY !== undefined) {
            this.engine.addEntity(new ChainLine(sourceX, sourceY, x, y, config.scale));
        }

        return explosion;
    }

    triggerBallExplosion(ball, sourceX, sourceY) {
        if (!ball.explode()) return;

        const config = this.getConfig();
        const now = Date.now();

        // Combo
        if (now - this.lastExplosionTime < COMBO_TIME_WINDOW) {
            this.currentCombo++;
            if (this.currentCombo > 1) {
                this.audio.playCombo(this.currentCombo);
                this.engine.addEntity(new ComboPopup(ball.x, ball.y - 30 * config.scale, this.currentCombo, config.scale));
            }
        } else {
            this.currentCombo = 1;
        }
        this.lastExplosionTime = now;
        this.maxCombo = Math.max(this.maxCombo, this.currentCombo);

        // Wave tracking
        if (!this.waveStats[this.currentWave]) this.waveStats[this.currentWave] = 0;
        this.waveStats[this.currentWave]++;

        // Score
        this.caughtThisRound++;
        const points = 10 * this.level * this.currentCombo * this.scoreMultiplier;
        this.score += points;

        // Special ball effects
        let explosionRadius = config.explosionRadius;

        if (ball.type === 'face') {
            // Face ball - show big face explosion + special bonus!
            this.engine.addEntity(new FaceExplosion(ball.x, ball.y, ball.faceId, config.scale));
            this.audio.playFaceSound(ball.faceId);
            this.score += 100 * this.level; // Big bonus points

            // Each family member has a special effect!
            if (ball.faceId === 'papa') {
                // Oppi: Größere Explosion - triggers another explosion
                this.pendingExplosions++;
                setTimeout(() => {
                    this.pendingExplosions--;
                    if (this.state === 'playing') {
                        this.createExplosion(ball.x, ball.y, ball.color, explosionRadius * 1.8, config.explosionDuration);
                    }
                }, 200);
                this.showBonus('💥 OPPI-POWER!', ball.x, ball.y - 50);
            } else if (ball.faceId === 'mama') {
                // Babsi: Punkte-Boost - 3x multiplier for next few seconds
                this.scoreMultiplier = 3;
                this.multiplierEndTime = Date.now() + 4000;
                this.showBonus('✨ 3x PUNKTE!', ball.x, ball.y - 50);
            } else if (ball.faceId === 'kind') {
                // Nico: Extra Versuch
                this.extraClick = true;
                this.showBonus('👆 +1 KLICK!', ball.x, ball.y - 50);
            }
        } else if (ball.type === 'splitter') {
            this.audio.playSplitterExplosion();
            const fragments = ball.getFragments(this.engine.width, this.engine.height);
            fragments.forEach(f => this.engine.addEntity(f));
        } else if (ball.type === 'ghost') {
            this.audio.playGhostExplosion();
        } else if (ball.type === 'bomber') {
            this.audio.playBomberExplosion();
            this.pendingExplosions++;
            setTimeout(() => {
                this.pendingExplosions--;
                if (this.state === 'playing') {
                    this.createExplosion(ball.x, ball.y, ball.color, explosionRadius * 1.5, config.explosionDuration, ball.x, ball.y);
                }
            }, ball.fuseTime * 1000);
        } else if (ball.type === 'chain') {
            this.audio.playChainLightning();
            const balls = this.engine.entities.filter(e => e instanceof Ball && e.alive && e !== ball);
            const target = ball.findChainTarget(balls);
            if (target) {
                this.engine.addEntity(new ChainLine(ball.x, ball.y, target.x, target.y, config.scale));
                this.pendingExplosions++;
                setTimeout(() => {
                    this.pendingExplosions--;
                    if (target.alive && this.state === 'playing') {
                        this.triggerBallExplosion(target, ball.x, ball.y);
                    }
                }, 50);
            }
        } else {
            this.audio.playExplosion(this.currentWave, ball.color.main);
        }

        this.createExplosion(ball.x, ball.y, ball.color, explosionRadius, config.explosionDuration, sourceX, sourceY);

        // Screen shake
        if (this.currentCombo >= 3) {
            this.engine.shake(Math.min(this.currentCombo * 2, 10));
            this.ui.canvasWrapper.classList.add('shake');
            setTimeout(() => this.ui.canvasWrapper.classList.remove('shake'), 150);
        }

        this.updateUI();
    }

    update(dt) {
        // Update power-ups
        this.activePowerUps = this.activePowerUps.filter(p => !p.isExpired());

        // Check multiplier timeout (from power-ups or Babsi)
        if (this.scoreMultiplier > 1 && this.multiplierEndTime && Date.now() > this.multiplierEndTime) {
            this.scoreMultiplier = 1;
            this.multiplierEndTime = 0;
        }

        if (this.state !== 'playing') return;

        const balls = this.engine.entities.filter(e => e instanceof Ball && e.alive);
        const explosions = this.engine.entities.filter(e => e instanceof Explosion && e.active);

        // Check explosions hitting balls
        let anyNewTrigger = false;
        explosions.forEach(explosion => {
            balls.forEach(ball => {
                if (ball.alive && explosion.checkCollision(ball)) {
                    this.triggerBallExplosion(ball, explosion.x, explosion.y);
                    anyNewTrigger = true;
                }
            });
        });

        if (anyNewTrigger) {
            setTimeout(() => this.currentWave++, 50);
        }

        // Check game end - wait for all explosions including pending delayed ones
        if (explosions.length === 0 && this.pendingExplosions === 0 && this.clickUsed) {
            // If player has extra click from Nico, let them use it
            if (this.extraClick) {
                this.state = 'waiting';
                this.clickUsed = false;
                this.preview.setVisible(true);
                this.showBonus('👆 NOCHMAL KLICKEN!', this.engine.width / 2, this.engine.height / 2);
            } else {
                this.endRound();
            }
        }
    }

    endRound() {
        const config = this.getConfig();
        const success = this.caughtThisRound >= config.targetCount;

        this.state = 'ended';

        const overlay = this.ui.result;
        const h2 = document.createElement('h2');
        const p = document.createElement('p');

        overlay.innerHTML = '';

        if (success) {
            overlay.className = 'overlay visible success';
            h2.textContent = this.caughtThisRound >= config.ballCount ? '🌟 PERFEKT!' : '✓ Geschafft!';

            // Bonus points
            const efficiency = this.caughtThisRound - config.targetCount;
            let bonus = 0;
            if (efficiency > 0) bonus = efficiency * 25 * this.level;
            bonus += 50 * this.level; // Level completion bonus
            this.score += bonus;

            p.textContent = `${this.caughtThisRound}/${config.ballCount} Kugeln • x${this.maxCombo} Combo`;
            if (bonus > 0) p.textContent += ` • +${bonus}`;

            // Update max level
            if (this.level >= this.maxLevel) {
                this.maxLevel = this.level + 1;
                this.saveMaxLevel();
            }

            overlay.appendChild(h2);
            overlay.appendChild(p);
            this.showChainStats(overlay);

            // Show next button only
            this.ui.nextBtn.style.display = 'inline-block';
            this.ui.restartBtn.style.display = 'none';

            this.audio.playSuccess();
        } else {
            // GAME OVER - 1 Leben!
            overlay.className = 'overlay visible fail';
            h2.textContent = '💀 GAME OVER';

            const finalScore = document.createElement('div');
            finalScore.className = 'final-score';
            finalScore.innerHTML = `<span>Endpunktzahl</span><strong>${this.score.toLocaleString()}</strong>`;

            p.textContent = `Level ${this.level} • ${this.caughtThisRound}/${config.targetCount} Kugeln`;

            overlay.appendChild(h2);
            overlay.appendChild(finalScore);
            overlay.appendChild(p);
            this.showChainStats(overlay);

            // Check for new highscore and show leaderboard
            const isNewHighscore = this.score > this.highscore;
            if (isNewHighscore) {
                this.highscore = this.score;
            }

            // Submit score to leaderboard
            const submittedEntryId = this.leaderboard.submitScore(this.score, this.caughtThisRound, this.maxCombo, this.level);
            this.lastSubmittedEntryId = submittedEntryId;

            // Show leaderboard
            this.showLeaderboard(overlay, isNewHighscore);

            // Show restart button (full reset), hide next
            this.ui.nextBtn.style.display = 'none';
            this.ui.restartBtn.style.display = 'inline-block';
            this.ui.restartBtn.textContent = 'Nochmal!';

            this.audio.playGameOver();
        }

        this.updateUI();
    }

    showChainStats(container) {
        if (this.waveStats.length === 0) return;

        const statsDiv = document.createElement('div');
        statsDiv.className = 'chain-stats';
        statsDiv.id = 'chainStats';

        const maxHits = Math.max(...this.waveStats, 1);

        this.waveStats.forEach((hits, i) => {
            if (hits > 0) {
                const div = document.createElement('div');
                div.className = 'chain-stat';
                div.innerHTML = `
                    <span class="wave-label">Welle ${i + 1}</span>
                    <div class="wave-bar" style="width: ${(hits / maxHits) * 100}px"></div>
                    <span class="wave-count">${hits}</span>
                `;
                statsDiv.appendChild(div);
            }
        });

        container.appendChild(statsDiv);
    }

    showLeaderboard(container, isNewHighscore) {
        const leaderboardDiv = document.createElement('div');
        leaderboardDiv.className = 'leaderboard-section';

        // Name input for new highscore
        if (isNewHighscore) {
            const nameSection = document.createElement('div');
            nameSection.className = 'name-input-section';
            nameSection.innerHTML = `
                <div class="new-highscore-banner">🏆 Neuer Rekord!</div>
                <div class="name-input-row">
                    <input type="text" id="playerNameInput" placeholder="Dein Name" maxlength="15"
                           value="${this.leaderboard.playerName || ''}" />
                    <button id="saveNameBtn" class="btn small">OK</button>
                </div>
            `;
            leaderboardDiv.appendChild(nameSection);

            // Add event listener after appending
            setTimeout(() => {
                const input = document.getElementById('playerNameInput');
                const saveBtn = document.getElementById('saveNameBtn');
                if (input && saveBtn) {
                    input.focus();
                    const saveName = () => {
                        const name = input.value.trim();
                        if (name) {
                            this.leaderboard.savePlayerName(name);
                            // Update the submitted entry with the new name
                            if (this.lastSubmittedEntryId) {
                                const entry = this.leaderboard.entries.find(e => e.id === this.lastSubmittedEntryId);
                                if (entry) {
                                    entry.name = name;
                                    this.leaderboard.saveLocal();
                                }
                            }
                            this.refreshLeaderboardDisplay();
                        }
                    };
                    saveBtn.addEventListener('click', saveName);
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') saveName();
                    });
                }
            }, 50);
        }

        // Leaderboard title
        const title = document.createElement('div');
        title.className = 'leaderboard-title';
        title.textContent = '🏅 Bestenliste';
        leaderboardDiv.appendChild(title);

        // Leaderboard entries
        const entriesDiv = document.createElement('div');
        entriesDiv.className = 'leaderboard-entries';
        entriesDiv.id = 'leaderboardEntries';
        this.renderLeaderboardEntries(entriesDiv);
        leaderboardDiv.appendChild(entriesDiv);

        container.appendChild(leaderboardDiv);
    }

    renderLeaderboardEntries(container) {
        const entries = this.leaderboard.getTopEntries(5);
        container.innerHTML = '';

        if (entries.length === 0) {
            container.innerHTML = '<div class="leaderboard-empty">Noch keine Einträge</div>';
            return;
        }

        entries.forEach((entry, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            const isCurrentEntry = this.lastSubmittedEntryId && entry.id === this.lastSubmittedEntryId;
            const entryDiv = document.createElement('div');
            entryDiv.className = `leaderboard-entry ${isCurrentEntry ? 'highlight' : ''}`;
            entryDiv.innerHTML = `
                <span class="rank">${medal}</span>
                <span class="name">${entry.name || 'Anonym'}</span>
                <span class="entry-score">${this.leaderboard.formatScore(entry.score)}</span>
            `;
            container.appendChild(entryDiv);
        });
    }

    refreshLeaderboardDisplay() {
        const container = document.getElementById('leaderboardEntries');
        if (container) {
            this.renderLeaderboardEntries(container);
        }
    }

    getLeaderboardHighscore() {
        const entries = this.leaderboard.getTopEntries(1);
        return entries.length > 0 ? entries[0].score : 0;
    }

    updateUI() {
        const config = this.getConfig();
        this.ui.target.textContent = `${this.caughtThisRound} / ${config.targetCount}`;
        this.ui.combo.textContent = `x${this.currentCombo}`;
        this.ui.score.textContent = this.score.toLocaleString();
        this.ui.highscore.textContent = this.highscore.toLocaleString();
        this.ui.level.textContent = this.level;

        const progress = Math.min(100, (this.caughtThisRound / config.targetCount) * 100);
        this.ui.progress.style.width = `${progress}%`;

        // Update restart button text based on state
        if (this.state === 'waiting' && !this.clickUsed) {
            this.ui.restartBtn.textContent = '🔀 Mischen';
        } else {
            this.ui.restartBtn.textContent = 'Nochmal!';
        }
    }

    restart() {
        // Full reset - back to level 1 with score 0
        this.level = 1;
        this.score = 0;
        this.ui.restartBtn.textContent = 'Neustart';
        this.clearGameState();
        this.initLevel();
    }

    nextLevel() {
        this.level++;
        this.audio.playLevelUp();
        this.initLevel();
    }

    loadMaxLevel() {
        return parseInt(localStorage.getItem(STORAGE_KEYS.MAX_LEVEL)) || 1;
    }

    saveMaxLevel() {
        localStorage.setItem(STORAGE_KEYS.MAX_LEVEL, this.maxLevel);
    }
}
