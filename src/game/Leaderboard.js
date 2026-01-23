/**
 * Global Leaderboard System
 * Uses JSONBin.io for free cloud storage
 */

const LEADERBOARD_KEY = 'knallbumman-leaderboard';
const API_URL = 'https://api.jsonbin.io/v3/b';
const BIN_ID = '678c1234abcd5678efgh9012'; // Placeholder - would need real bin

export class Leaderboard {
    constructor() {
        this.entries = this.loadLocal();
        this.playerName = this.loadPlayerName();
        this.lastSyncTime = 0;
    }

    loadLocal() {
        try {
            return JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
        } catch {
            return [];
        }
    }

    saveLocal() {
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(this.entries));
    }

    loadPlayerName() {
        return localStorage.getItem('knallbumman-playername') || '';
    }

    savePlayerName(name) {
        this.playerName = name;
        localStorage.setItem('knallbumman-playername', name);
    }

    submitScore(score, ballsDestroyed, maxCombo, wave) {
        const entry = {
            name: this.playerName || 'Anonym',
            score,
            ballsDestroyed,
            maxCombo,
            wave,
            timestamp: Date.now(),
            id: this.generateId()
        };

        // Add to local entries
        this.entries.push(entry);
        this.entries.sort((a, b) => b.score - a.score);
        this.entries = this.entries.slice(0, 100); // Keep top 100
        this.saveLocal();

        // Try to sync with server (gracefully fail if no connection)
        try {
            this.syncWithServer(entry);
        } catch (e) {
            console.log('Offline mode - score saved locally');
        }

        return entry.id;
    }

    async syncWithServer(newEntry) {
        // In a real implementation, this would POST to a backend
        // For now, we simulate it with a local "global" storage
        const globalKey = 'knallbumman-global-leaderboard';

        try {
            let globalEntries = JSON.parse(localStorage.getItem(globalKey)) || [];
            globalEntries.push(newEntry);
            globalEntries.sort((a, b) => b.score - a.score);
            globalEntries = globalEntries.slice(0, 100);
            localStorage.setItem(globalKey, JSON.stringify(globalEntries));

            // Merge global entries into local
            this.mergeGlobalEntries(globalEntries);
        } catch (e) {
            console.warn('Sync failed:', e);
        }
    }

    mergeGlobalEntries(globalEntries) {
        const merged = [...this.entries];

        for (const entry of globalEntries) {
            if (!merged.find(e => e.id === entry.id)) {
                merged.push(entry);
            }
        }

        merged.sort((a, b) => b.score - a.score);
        this.entries = merged.slice(0, 100);
        this.saveLocal();
    }

    getRank(score) {
        const rank = this.entries.findIndex(e => e.score <= score);
        return rank === -1 ? this.entries.length + 1 : rank + 1;
    }

    getTopEntries(count = 10) {
        return this.entries.slice(0, count);
    }

    getPersonalBest() {
        if (!this.playerName) return null;
        return this.entries.find(e => e.name === this.playerName);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatScore(score) {
        if (score >= 1000000) return (score / 1000000).toFixed(1) + 'M';
        if (score >= 1000) return (score / 1000).toFixed(1) + 'K';
        return score.toString();
    }

    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;

        if (diff < 60000) return 'Gerade eben';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' Min';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' Std';
        if (diff < 604800000) return Math.floor(diff / 86400000) + ' Tage';
        return new Date(timestamp).toLocaleDateString('de-DE');
    }
}
