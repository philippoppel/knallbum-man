/**
 * Game Modes
 * Different ways to play the game
 */

export const GAME_MODES = {
    classic: {
        id: 'classic',
        name: 'Klassisch',
        description: 'Erreiche das Ziel in jedem Level',
        icon: '🎮',
        hasLevels: true,
        hasTimeLimit: false,
        hasEndless: false
    },
    endless: {
        id: 'endless',
        name: 'Endlos',
        description: 'Wie lange kannst du überleben?',
        icon: '♾️',
        hasLevels: false,
        hasTimeLimit: false,
        hasEndless: true
    },
    timeAttack: {
        id: 'timeAttack',
        name: 'Zeitangriff',
        description: '60 Sekunden - maximale Punkte!',
        icon: '⏱️',
        hasLevels: false,
        hasTimeLimit: true,
        timeLimit: 60000,
        hasEndless: false
    },
    puzzle: {
        id: 'puzzle',
        name: 'Puzzle',
        description: 'Finde den perfekten Klick',
        icon: '🧩',
        hasLevels: true,
        hasTimeLimit: false,
        hasEndless: false,
        isPuzzle: true
    },
    zen: {
        id: 'zen',
        name: 'Zen',
        description: 'Entspanntes Spielen ohne Druck',
        icon: '🧘',
        hasLevels: false,
        hasTimeLimit: false,
        hasEndless: true,
        isZen: true
    }
};

// Endless mode configuration
export class EndlessMode {
    constructor() {
        this.ballsDestroyed = 0;
        this.wave = 1;
        this.spawnRate = 2000; // ms between spawns
        this.lastSpawnTime = 0;
        this.difficultyMultiplier = 1;
        this.clicksRemaining = 3;
        this.maxClicks = 3;
    }

    reset() {
        this.ballsDestroyed = 0;
        this.wave = 1;
        this.spawnRate = 2000;
        this.lastSpawnTime = Date.now();
        this.difficultyMultiplier = 1;
        this.clicksRemaining = 3;
    }

    update(currentBallCount, minBalls = 10, maxBalls = 30) {
        const now = Date.now();

        // Increase difficulty over time
        this.difficultyMultiplier = 1 + (this.ballsDestroyed / 50) * 0.2;

        // Dynamic spawn rate
        this.spawnRate = Math.max(500, 2000 - this.ballsDestroyed * 10);

        // Check if we need to spawn more balls
        if (now - this.lastSpawnTime > this.spawnRate && currentBallCount < maxBalls) {
            this.lastSpawnTime = now;
            const spawnCount = Math.min(3, maxBalls - currentBallCount);
            return spawnCount;
        }

        // Check wave progression
        if (this.ballsDestroyed > 0 && this.ballsDestroyed % 20 === 0) {
            this.wave = Math.floor(this.ballsDestroyed / 20) + 1;
        }

        return 0;
    }

    onBallDestroyed() {
        this.ballsDestroyed++;

        // Give extra click every 25 balls
        if (this.ballsDestroyed % 25 === 0) {
            this.clicksRemaining = Math.min(this.clicksRemaining + 1, this.maxClicks + 2);
            return { extraClick: true };
        }
        return {};
    }

    useClick() {
        if (this.clicksRemaining > 0) {
            this.clicksRemaining--;
            return true;
        }
        return false;
    }

    isGameOver() {
        return this.clicksRemaining <= 0;
    }

    getConfig() {
        return {
            ballSpeed: 0.4 * this.difficultyMultiplier,
            explosionRadius: Math.max(50, 75 - this.wave * 2),
            explosionDuration: 2.5
        };
    }
}

// Time Attack mode configuration
export class TimeAttackMode {
    constructor(timeLimit = 60000) {
        this.timeLimit = timeLimit;
        this.startTime = 0;
        this.score = 0;
        this.ballsDestroyed = 0;
        this.isRunning = false;
        this.clicksUsed = 0;
    }

    reset() {
        this.startTime = Date.now();
        this.score = 0;
        this.ballsDestroyed = 0;
        this.isRunning = true;
        this.clicksUsed = 0;
    }

    getRemainingTime() {
        if (!this.isRunning) return this.timeLimit;
        const elapsed = Date.now() - this.startTime;
        return Math.max(0, this.timeLimit - elapsed);
    }

    getProgress() {
        return 1 - (this.getRemainingTime() / this.timeLimit);
    }

    isTimeUp() {
        return this.getRemainingTime() <= 0;
    }

    addScore(points) {
        this.score += points;
    }

    onBallDestroyed(combo) {
        this.ballsDestroyed++;
        const points = 10 * combo;
        this.addScore(points);

        // Time bonus for combos
        if (combo >= 5) {
            return { timeBonus: combo * 100 }; // Add milliseconds
        }
        return {};
    }

    addTime(ms) {
        this.timeLimit += ms;
    }

    getConfig() {
        // Difficulty increases as time runs out
        const urgency = this.getProgress();
        return {
            ballSpeed: 0.4 + urgency * 0.3,
            explosionRadius: 70,
            explosionDuration: 2.5,
            ballCount: 15 + Math.floor(urgency * 10)
        };
    }
}

// Puzzle mode - predefined ball positions
export class PuzzleMode {
    constructor() {
        this.currentPuzzle = 0;
        this.puzzles = this.generatePuzzles();
    }

    generatePuzzles() {
        return [
            // Puzzle 1: Simple line
            {
                name: "Die Linie",
                balls: [
                    { x: 0.2, y: 0.5 },
                    { x: 0.35, y: 0.5 },
                    { x: 0.5, y: 0.5 },
                    { x: 0.65, y: 0.5 },
                    { x: 0.8, y: 0.5 }
                ],
                target: 5,
                hint: "Triff die Mitte"
            },
            // Puzzle 2: Circle
            {
                name: "Der Kreis",
                balls: Array.from({ length: 8 }, (_, i) => ({
                    x: 0.5 + Math.cos(i / 8 * Math.PI * 2) * 0.25,
                    y: 0.5 + Math.sin(i / 8 * Math.PI * 2) * 0.25
                })),
                target: 8,
                hint: "Das Zentrum ist der Schlüssel"
            },
            // Puzzle 3: Triangle
            {
                name: "Das Dreieck",
                balls: [
                    { x: 0.5, y: 0.25 },
                    { x: 0.3, y: 0.65 },
                    { x: 0.7, y: 0.65 },
                    { x: 0.4, y: 0.45 },
                    { x: 0.6, y: 0.45 },
                    { x: 0.5, y: 0.55 }
                ],
                target: 6,
                hint: "Von oben nach unten"
            },
            // Puzzle 4: Scattered
            {
                name: "Das Chaos",
                balls: [
                    { x: 0.15, y: 0.2 },
                    { x: 0.85, y: 0.3 },
                    { x: 0.25, y: 0.8 },
                    { x: 0.75, y: 0.75 },
                    { x: 0.5, y: 0.5 },
                    { x: 0.4, y: 0.35 },
                    { x: 0.6, y: 0.65 }
                ],
                target: 5,
                hint: "Manchmal ist die Mitte nicht der beste Ort"
            },
            // Puzzle 5: Two clusters
            {
                name: "Zwei Welten",
                balls: [
                    { x: 0.25, y: 0.4 },
                    { x: 0.2, y: 0.5 },
                    { x: 0.3, y: 0.5 },
                    { x: 0.25, y: 0.6 },
                    { x: 0.75, y: 0.4 },
                    { x: 0.7, y: 0.5 },
                    { x: 0.8, y: 0.5 },
                    { x: 0.75, y: 0.6 }
                ],
                target: 8,
                hint: "Verbinde die Welten"
            },
            // More puzzles...
            {
                name: "Die Spirale",
                balls: Array.from({ length: 10 }, (_, i) => ({
                    x: 0.5 + Math.cos(i / 10 * Math.PI * 4) * (0.1 + i * 0.025),
                    y: 0.5 + Math.sin(i / 10 * Math.PI * 4) * (0.1 + i * 0.025)
                })),
                target: 8,
                hint: "Folge der Spirale"
            },
            {
                name: "Das X",
                balls: [
                    { x: 0.2, y: 0.2 }, { x: 0.35, y: 0.35 },
                    { x: 0.8, y: 0.2 }, { x: 0.65, y: 0.35 },
                    { x: 0.5, y: 0.5 },
                    { x: 0.2, y: 0.8 }, { x: 0.35, y: 0.65 },
                    { x: 0.8, y: 0.8 }, { x: 0.65, y: 0.65 }
                ],
                target: 9,
                hint: "X markiert den Punkt"
            },
            {
                name: "Der Diamant",
                balls: [
                    { x: 0.5, y: 0.15 },
                    { x: 0.3, y: 0.35 }, { x: 0.7, y: 0.35 },
                    { x: 0.2, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.8, y: 0.5 },
                    { x: 0.3, y: 0.65 }, { x: 0.7, y: 0.65 },
                    { x: 0.5, y: 0.85 }
                ],
                target: 9,
                hint: "Edelsteine haben viele Facetten"
            }
        ];
    }

    getCurrentPuzzle() {
        return this.puzzles[this.currentPuzzle % this.puzzles.length];
    }

    nextPuzzle() {
        this.currentPuzzle++;
        return this.getCurrentPuzzle();
    }

    reset() {
        this.currentPuzzle = 0;
    }

    getPuzzleCount() {
        return this.puzzles.length;
    }

    getBallPositions(canvasWidth, canvasHeight, radiusMin, radiusMax) {
        const puzzle = this.getCurrentPuzzle();
        return puzzle.balls.map(b => ({
            x: b.x * canvasWidth,
            y: b.y * canvasHeight,
            radius: radiusMin + Math.random() * (radiusMax - radiusMin)
        }));
    }
}

// Daily Challenge
export class DailyChallenge {
    constructor() {
        this.seed = this.getDailySeed();
        this.challenge = this.generateChallenge();
        this.completed = this.loadCompleted();
    }

    getDailySeed() {
        const now = new Date();
        return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    }

    seededRandom() {
        // Simple seeded random
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    generateChallenge() {
        this.seed = this.getDailySeed(); // Reset seed

        const challenges = [
            { type: 'score', target: 500 + Math.floor(this.seededRandom() * 1000), description: 'Erreiche {target} Punkte' },
            { type: 'combo', target: 5 + Math.floor(this.seededRandom() * 10), description: 'Erreiche eine {target}er Combo' },
            { type: 'balls', target: 20 + Math.floor(this.seededRandom() * 30), description: 'Zerstöre {target} Kugeln' },
            { type: 'waves', target: 3 + Math.floor(this.seededRandom() * 5), description: 'Erzeuge {target} Wellen' },
            { type: 'levels', target: 2 + Math.floor(this.seededRandom() * 3), description: 'Schließe {target} Level ab' },
            { type: 'perfect', target: 1, description: 'Schließe ein Level perfekt ab' }
        ];

        const index = Math.floor(this.seededRandom() * challenges.length);
        const challenge = challenges[index];

        return {
            ...challenge,
            description: challenge.description.replace('{target}', challenge.target),
            date: this.getDailySeed(),
            reward: Math.floor(100 + this.seededRandom() * 400)
        };
    }

    loadCompleted() {
        try {
            const data = JSON.parse(localStorage.getItem('knallbumman-daily')) || {};
            return data.date === this.getDailySeed() ? data.completed : false;
        } catch {
            return false;
        }
    }

    saveCompleted() {
        localStorage.setItem('knallbumman-daily', JSON.stringify({
            date: this.getDailySeed(),
            completed: true
        }));
        this.completed = true;
    }

    checkProgress(stats) {
        if (this.completed) return { completed: true, progress: 1 };

        let progress = 0;
        switch (this.challenge.type) {
            case 'score':
                progress = Math.min(1, stats.score / this.challenge.target);
                break;
            case 'combo':
                progress = Math.min(1, stats.maxCombo / this.challenge.target);
                break;
            case 'balls':
                progress = Math.min(1, stats.ballsDestroyed / this.challenge.target);
                break;
            case 'waves':
                progress = Math.min(1, stats.maxWaves / this.challenge.target);
                break;
            case 'levels':
                progress = Math.min(1, stats.levelsCompleted / this.challenge.target);
                break;
            case 'perfect':
                progress = stats.perfectLevel ? 1 : 0;
                break;
        }

        const completed = progress >= 1;
        if (completed && !this.completed) {
            this.saveCompleted();
        }

        return { completed, progress };
    }

    getChallenge() {
        return this.challenge;
    }

    isCompleted() {
        return this.completed;
    }
}
