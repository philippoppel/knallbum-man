/**
 * Achievements System
 * Track and reward player accomplishments
 */

export class AchievementManager {
    constructor() {
        this.achievements = this.initAchievements();
        this.unlockedIds = this.loadUnlocked();
        this.pendingNotifications = [];

        // Stats tracking
        this.stats = this.loadStats();
    }

    initAchievements() {
        return [
            // Combo achievements
            { id: 'combo5', name: 'Combo-Starter', description: '5er Combo erreichen', icon: '⚡', check: (s) => s.maxCombo >= 5 },
            { id: 'combo10', name: 'Combo-Meister', description: '10er Combo erreichen', icon: '💥', check: (s) => s.maxCombo >= 10 },
            { id: 'combo20', name: 'Combo-Legende', description: '20er Combo erreichen', icon: '🌟', check: (s) => s.maxCombo >= 20 },

            // Level achievements
            { id: 'level5', name: 'Anfänger', description: 'Level 5 erreichen', icon: '🎮', check: (s) => s.maxLevel >= 5 },
            { id: 'level10', name: 'Fortgeschritten', description: 'Level 10 erreichen', icon: '🎯', check: (s) => s.maxLevel >= 10 },
            { id: 'level20', name: 'Experte', description: 'Level 20 erreichen', icon: '👑', check: (s) => s.maxLevel >= 20 },
            { id: 'level50', name: 'Großmeister', description: 'Level 50 erreichen', icon: '🏆', check: (s) => s.maxLevel >= 50 },

            // Score achievements
            { id: 'score1k', name: 'Punktesammler', description: '1.000 Punkte erreichen', icon: '💰', check: (s) => s.highscore >= 1000 },
            { id: 'score10k', name: 'Punktejäger', description: '10.000 Punkte erreichen', icon: '💎', check: (s) => s.highscore >= 10000 },
            { id: 'score50k', name: 'Punktekönig', description: '50.000 Punkte erreichen', icon: '🤑', check: (s) => s.highscore >= 50000 },

            // Efficiency achievements
            { id: 'perfect', name: 'Perfektionist', description: 'Alle Kugeln in einem Level treffen', icon: '✨', check: (s) => s.perfectLevels >= 1 },
            { id: 'perfect5', name: 'Präzision', description: '5 perfekte Level', icon: '🎯', check: (s) => s.perfectLevels >= 5 },

            // Wave achievements
            { id: 'wave5', name: 'Wellenmacher', description: '5 Wellen in einer Kettenreaktion', icon: '🌊', check: (s) => s.maxWaves >= 5 },
            { id: 'wave10', name: 'Tsunami', description: '10 Wellen in einer Kettenreaktion', icon: '🌀', check: (s) => s.maxWaves >= 10 },

            // Play time achievements
            { id: 'games10', name: 'Dauerspieler', description: '10 Spiele gespielt', icon: '🎲', check: (s) => s.gamesPlayed >= 10 },
            { id: 'games50', name: 'Süchtig', description: '50 Spiele gespielt', icon: '🔥', check: (s) => s.gamesPlayed >= 50 },
            { id: 'games100', name: 'Keine Rettung', description: '100 Spiele gespielt', icon: '💀', check: (s) => s.gamesPlayed >= 100 },

            // Ball destruction achievements
            { id: 'balls100', name: 'Zerstörer', description: '100 Kugeln gesprengt', icon: '💣', check: (s) => s.totalBallsDestroyed >= 100 },
            { id: 'balls1000', name: 'Vernichter', description: '1.000 Kugeln gesprengt', icon: '☄️', check: (s) => s.totalBallsDestroyed >= 1000 },
            { id: 'balls5000', name: 'Apokalypse', description: '5.000 Kugeln gesprengt', icon: '🌋', check: (s) => s.totalBallsDestroyed >= 5000 },

            // Special achievements
            { id: 'oneshot', name: 'One-Shot', description: 'Level mit nur 1 Kugel im Ziel gewinnen', icon: '🎱', check: (s) => s.oneshotWins >= 1 },
            { id: 'speedrun', name: 'Schnellstarter', description: 'Level in unter 3 Sekunden gewinnen', icon: '⚡', check: (s) => s.fastWins >= 1 },
            { id: 'comeback', name: 'Comeback', description: 'Nach 3 Niederlagen gewinnen', icon: '💪', check: (s) => s.comebacks >= 1 },

            // Mode achievements
            { id: 'endless100', name: 'Endlos-Läufer', description: '100 Kugeln im Endlos-Modus', icon: '♾️', check: (s) => s.endlessMaxBalls >= 100 },
            { id: 'timeattack', name: 'Zeitdruck', description: '500 Punkte im Zeitangriff-Modus', icon: '⏰', check: (s) => s.timeAttackHighscore >= 500 },

            // Secret achievements
            { id: 'secret1', name: '???', description: 'Finde das Geheimnis', icon: '❓', check: (s) => s.secretFound, hidden: true },
        ];
    }

    loadUnlocked() {
        try {
            return JSON.parse(localStorage.getItem('knallbumman-achievements')) || [];
        } catch {
            return [];
        }
    }

    saveUnlocked() {
        localStorage.setItem('knallbumman-achievements', JSON.stringify(this.unlockedIds));
    }

    loadStats() {
        try {
            return JSON.parse(localStorage.getItem('knallbumman-stats')) || this.getDefaultStats();
        } catch {
            return this.getDefaultStats();
        }
    }

    saveStats() {
        localStorage.setItem('knallbumman-stats', JSON.stringify(this.stats));
    }

    getDefaultStats() {
        return {
            maxCombo: 0,
            maxLevel: 1,
            highscore: 0,
            perfectLevels: 0,
            maxWaves: 0,
            gamesPlayed: 0,
            totalBallsDestroyed: 0,
            oneshotWins: 0,
            fastWins: 0,
            comebacks: 0,
            lossStreak: 0,
            endlessMaxBalls: 0,
            timeAttackHighscore: 0,
            secretFound: false
        };
    }

    updateStats(newStats) {
        // Merge new stats
        for (const [key, value] of Object.entries(newStats)) {
            if (typeof value === 'number') {
                if (key.startsWith('max') || key.endsWith('Highscore') || key === 'highscore') {
                    this.stats[key] = Math.max(this.stats[key] || 0, value);
                } else {
                    this.stats[key] = (this.stats[key] || 0) + value;
                }
            } else {
                this.stats[key] = value;
            }
        }
        this.saveStats();
        this.checkAchievements();
    }

    checkAchievements() {
        const newUnlocks = [];

        for (const achievement of this.achievements) {
            if (!this.unlockedIds.includes(achievement.id)) {
                if (achievement.check(this.stats)) {
                    this.unlockedIds.push(achievement.id);
                    newUnlocks.push(achievement);
                    this.pendingNotifications.push(achievement);
                }
            }
        }

        if (newUnlocks.length > 0) {
            this.saveUnlocked();
        }

        return newUnlocks;
    }

    getNextNotification() {
        return this.pendingNotifications.shift();
    }

    hasNotifications() {
        return this.pendingNotifications.length > 0;
    }

    getUnlockedCount() {
        return this.unlockedIds.length;
    }

    getTotalCount() {
        return this.achievements.filter(a => !a.hidden).length;
    }

    getProgress() {
        return this.getUnlockedCount() / this.getTotalCount();
    }

    getAllAchievements() {
        return this.achievements.map(a => ({
            ...a,
            unlocked: this.unlockedIds.includes(a.id),
            visible: !a.hidden || this.unlockedIds.includes(a.id)
        }));
    }
}

// Achievement notification - DOM based for better mobile support
export class AchievementNotification {
    constructor(achievement, x, y, scale = 1) {
        this.achievement = achievement;
        this.x = x;
        this.y = y;
        this.scale = scale;
        this.life = 1;
        this.phase = 0;
        this.isDead = false;
        this.layer = 100;
        this.element = null;

        // Create DOM element for better mobile rendering
        this.createDOMNotification();
    }

    createDOMNotification() {
        const existing = document.querySelector('.achievement-popup');
        if (existing) existing.remove();

        this.element = document.createElement('div');
        this.element.className = 'achievement-popup';
        this.element.innerHTML = `
            <span class="icon">${this.achievement.icon}</span>
            <div class="text">
                <span class="title">ACHIEVEMENT!</span>
                <span class="name">${this.achievement.name}</span>
            </div>
        `;
        document.body.appendChild(this.element);

        // Auto remove after animation
        setTimeout(() => {
            if (this.element) {
                this.element.style.animation = 'achievementSlide 0.3s ease reverse forwards';
                setTimeout(() => {
                    this.element?.remove();
                    this.element = null;
                }, 300);
            }
        }, 3000);
    }

    update(dt) {
        this.phase += 0.02;

        if (this.phase > Math.PI * 2.5) {
            this.life -= 0.03;
        }

        if (this.life <= 0) {
            this.isDead = true;
            if (this.element) {
                this.element.remove();
                this.element = null;
            }
        }
    }

    render(ctx) {
        // DOM-based rendering, no canvas drawing needed
        // But we keep this for compatibility
    }
}
