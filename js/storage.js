const HIGH_SCORE_KEY = 'snake_high_score';
const CUSTOM_KEYS_KEY = 'snake_custom_keys';
const OBSTACLES_KEY = 'snake_obstacles';

export function getHighScore() {
    const val = localStorage.getItem(HIGH_SCORE_KEY);
    return val ? parseInt(val, 10) : 0;
}

export function setHighScore(score) {
    localStorage.setItem(HIGH_SCORE_KEY, score.toString());
}

export function getCustomKeys() {
    const stored = localStorage.getItem(CUSTOM_KEYS_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return null;
        }
    }
    return null;
}

export function setCustomKeys(keys) {
    localStorage.setItem(CUSTOM_KEYS_KEY, JSON.stringify(keys));
}

export function getObstaclesEnabled() {
    const val = localStorage.getItem(OBSTACLES_KEY);
    return val === 'true';  // по умолчанию false
}

export function setObstaclesEnabled(enabled) {
    localStorage.setItem(OBSTACLES_KEY, enabled.toString());
}