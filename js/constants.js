export const CELL_SIZE = 20;

export const INITIAL_SPEED = 150;
export const MIN_SPEED = 50;
export const SCORE_PER_FOOD = 10;
export const SCORE_THRESHOLD = 50;
export const SPEED_STEP = 5;

// Препятствия: диапазон общего количества клеток (будет выбран случайно)
export const OBSTACLE_MIN_TOTAL = 20;
export const OBSTACLE_MAX_TOTAL = 50;
export const OBSTACLE_MIN_CELLS = 4;   // мин. клеток в одном кластере
export const OBSTACLE_MAX_CELLS = 8;   // макс. клеток в одном кластере

// Таймаут еды
export const FOOD_TIMEOUT = 7000;
export const FOOD_BLINK_DURATION = 2000;

export const DIRECTIONS = {
    UP: 'UP',
    DOWN: 'DOWN',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT'
};

export const OPPOSITE_DIR = {
    UP: 'DOWN',
    DOWN: 'UP',
    LEFT: 'RIGHT',
    RIGHT: 'LEFT'
};

export const DIFFICULTY = {
    easy:   { initialSpeed: 200, speedStep: 5 },
    medium: { initialSpeed: 150, speedStep: 5 },
    hard:   { initialSpeed: 100, speedStep: 3 }
};

export function calculateGrid(windowWidth, windowHeight) {
    const maxFieldSize = Math.floor(Math.min(windowWidth, windowHeight) * 0.8);
    const gridSize = Math.floor(maxFieldSize / CELL_SIZE);
    const canvasSize = gridSize * CELL_SIZE;
    return { gridSize, canvasSize };
}