/**
 * Game Constants
 */

export const BALL_COLORS = [
    { main: '#7ee8fa', glow: 'rgba(126, 232, 250, 0.4)' },
    { main: '#eec0c6', glow: 'rgba(238, 192, 198, 0.4)' },
    { main: '#a0e7a0', glow: 'rgba(160, 231, 160, 0.4)' },
    { main: '#ffd89b', glow: 'rgba(255, 216, 155, 0.4)' },
    { main: '#c9b1ff', glow: 'rgba(201, 177, 255, 0.4)' },
    { main: '#ff9b9b', glow: 'rgba(255, 155, 155, 0.4)' }
];

export const COMBO_TIME_WINDOW = 800; // ms

export const STORAGE_KEYS = {
    HIGHSCORE: 'knallbumman-highscore',
    MAX_LEVEL: 'knallbumman-maxlevel',
    COMPLETED_LEVELS: 'knallbumman-completed'
};

// Base dimensions for scaling calculations
export const BASE_WIDTH = 700;
export const BASE_HEIGHT = 500;

export function getLevelConfig(level, canvasWidth = BASE_WIDTH, canvasHeight = BASE_HEIGHT) {
    // Calculate scale factor based on canvas size
    const scaleX = canvasWidth / BASE_WIDTH;
    const scaleY = canvasHeight / BASE_HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    return {
        ballCount: Math.min(6 + level * 3, 40),
        targetCount: Math.min(2 + Math.floor(level * 1.2), 28),
        ballSpeed: Math.min(0.3 + level * 0.08, 1.8) * scale,
        explosionRadius: Math.max(75 - level * 1.5, 45) * scale,
        explosionDuration: Math.max(2.8 - level * 0.04, 1.8),
        ballRadiusMin: 12 * scale,
        ballRadiusMax: 20 * scale,
        scale: scale
    };
}
