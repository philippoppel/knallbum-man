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

export const COMBO_TIME_WINDOW = 1200; // ms - generous window for satisfying chain reactions

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

    const ballCount = Math.min(6 + level * 3, 40);

    // Target percentage increases gently: 45% at level 1 → 60% at level 20
    const targetPercent = Math.min(0.45 + level * 0.01, 0.60);
    const targetCount = Math.max(3, Math.floor(ballCount * targetPercent));

    // Ball speed increases gradually (slower ramp, lower cap)
    const ballSpeed = Math.min(0.5 + level * 0.08, 1.8) * scale;

    // Minimum distance between balls increases slowly (closer = easier chains)
    const minBallDistance = Math.min(25 + level * 1.5, 50) * scale;

    return {
        ballCount,
        targetCount,
        ballSpeed,
        explosionRadius: Math.max(80 - level * 1.0, 55) * scale,
        explosionDuration: Math.max(3.0 - level * 0.03, 2.0),
        ballRadiusMin: 12 * scale,
        ballRadiusMax: 20 * scale,
        minBallDistance,
        scale: scale
    };
}
