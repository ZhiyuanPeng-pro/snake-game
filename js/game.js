import {
    CELL_SIZE,
    DIRECTIONS, OPPOSITE_DIR,
    MIN_SPEED, SCORE_PER_FOOD, SCORE_THRESHOLD,
    DIFFICULTY,
    OBSTACLE_MIN_CELLS, OBSTACLE_MAX_CELLS,
    OBSTACLE_MIN_TOTAL, OBSTACLE_MAX_TOTAL,
    FOOD_TIMEOUT, FOOD_BLINK_DURATION
} from './constants.js';
import { getHighScore, setHighScore } from './storage.js';

export class Game {
    constructor(canvas, gridSize, difficulty = 'medium', obstaclesEnabled = false) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = gridSize;
        this.canvasSize = gridSize * CELL_SIZE;
        this.canvas.width = this.canvasSize;
        this.canvas.height = this.canvasSize;

        this.difficulty = difficulty;
        this.obstaclesEnabled = obstaclesEnabled;
        this.reset();
    }

    reset() {
        const size = this.gridSize;
        const startX = Math.floor(size / 2);
        const startY = Math.floor(size / 2);
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = DIRECTIONS.RIGHT;

        this.obstacles = [];
        this.food = this.generateFood();
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;

        if (this.obstaclesEnabled) {
            this.generateObstacles();
        }

        const diff = DIFFICULTY[this.difficulty] || DIFFICULTY.medium;
        this.initialSpeed = diff.initialSpeed;
        this.speedStep = diff.speedStep;
        this.currentInterval = this.initialSpeed;

        if (this.gameLoopId) clearTimeout(this.gameLoopId);
        this.gameLoopId = null;
        this.foodBlinkTimerId = null;

        this.draw();
    }

    generateFood() {
        const free = this.getFreeCells();
        if (free.length === 0) return null;
        const pos = free[Math.floor(Math.random() * free.length)];
        return {
            x: pos.x,
            y: pos.y,
            createdAt: Date.now(),
            blinking: false
        };
    }

    getFreeCells() {
        const occupied = new Set([
            ...this.snake.map(s => `${s.x},${s.y}`),
            ...this.obstacles.map(o => `${o.x},${o.y}`)
        ]);
        const free = [];
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                if (!occupied.has(`${x},${y}`)) {
                    free.push({ x, y });
                }
            }
        }
        return free;
    }

    generateObstacles() {
        this.obstacles = [];
        const free = this.getFreeCells();
        // Случайное общее количество клеток препятствий
        const totalCells = OBSTACLE_MIN_TOTAL +
            Math.floor(Math.random() * (OBSTACLE_MAX_TOTAL - OBSTACLE_MIN_TOTAL + 1));
        if (free.length < totalCells) return;

        const occupied = new Set(free.map(c => `${c.x},${c.y}`));
        const used = new Set();
        let remaining = totalCells;

        while (remaining > 0) {
            const clusterSize = Math.min(
                remaining,
                OBSTACLE_MIN_CELLS + Math.floor(Math.random() * (OBSTACLE_MAX_CELLS - OBSTACLE_MIN_CELLS + 1))
            );
            const availableStarts = free.filter(c => !used.has(`${c.x},${c.y}`));
            if (availableStarts.length === 0) break;
            const start = availableStarts[Math.floor(Math.random() * availableStarts.length)];
            const cluster = [start];
            used.add(`${start.x},${start.y}`);
            for (let i = 1; i < clusterSize; i++) {
                const last = cluster[cluster.length - 1];
                const neighbors = this.getNeighbors(last.x, last.y).filter(n => {
                    const key = `${n.x},${n.y}`;
                    return occupied.has(key) && !used.has(key);
                });
                if (neighbors.length === 0) break;
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                cluster.push(next);
                used.add(`${next.x},${next.y}`);
            }
            this.obstacles.push(...cluster);
            remaining -= cluster.length;
        }
    }

    getNeighbors(x, y) {
        const candidates = [
            { x: x - 1, y },
            { x: x + 1, y },
            { x, y: y - 1 },
            { x, y: y + 1 }
        ];
        return candidates.filter(c =>
            c.x >= 0 && c.x < this.gridSize && c.y >= 0 && c.y < this.gridSize
        );
    }

    changeDirection(newDir) {
        if (newDir && OPPOSITE_DIR[newDir] !== this.direction) {
            this.nextDirection = newDir;
        }
    }

    move() {
        if (this.gameOver || this.isPaused) return;

        this.direction = this.nextDirection;
        const head = this.snake[0];
        let newHead = { x: head.x, y: head.y };

        switch (this.direction) {
            case DIRECTIONS.UP:    newHead.y--; break;
            case DIRECTIONS.DOWN:  newHead.y++; break;
            case DIRECTIONS.LEFT:  newHead.x--; break;
            case DIRECTIONS.RIGHT: newHead.x++; break;
        }

        if (newHead.x < 0 || newHead.x >= this.gridSize ||
            newHead.y < 0 || newHead.y >= this.gridSize) {
            this.endGame();
            return;
        }

        const bodyWithoutTail = this.snake.slice(0, -1);
        if (bodyWithoutTail.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
            this.endGame();
            return;
        }

        if (this.obstaclesEnabled && this.obstacles.some(o => o.x === newHead.x && o.y === newHead.y)) {
            this.endGame();
            return;
        }

        this.snake.unshift(newHead);

        if (this.food && newHead.x === this.food.x && newHead.y === this.food.y) {
            this.score += SCORE_PER_FOOD;
            this.updateSpeed();
            this.food = this.generateFood();
        } else {
            this.snake.pop();
        }

        this.checkFoodTimeout();
        this.draw();
        this.scheduleMove();
    }

    checkFoodTimeout() {
        if (!this.food || this.gameOver) return;
        const now = Date.now();
        const age = now - this.food.createdAt;
        if (!this.food.blinking && age >= FOOD_TIMEOUT) {
            this.food.blinking = true;
            this.food.blinkStart = now;
        }
        if (this.food.blinking && (now - this.food.blinkStart) >= FOOD_BLINK_DURATION) {
            this.food = this.generateFood();
        }
    }

    updateSpeed() {
        const speedLevels = Math.floor(this.score / SCORE_THRESHOLD);
        const newInterval = this.initialSpeed - speedLevels * this.speedStep;
        this.currentInterval = Math.max(MIN_SPEED, newInterval);
    }

    scheduleMove() {
        if (this.gameLoopId) clearTimeout(this.gameLoopId);
        if (this.gameOver || this.isPaused) return;
        this.gameLoopId = setTimeout(() => this.move(), this.currentInterval);
    }

    start() {
        if (this.gameOver) return;
        if (this.isPaused) return;
        this.scheduleMove();
    }

    pause() {
        this.isPaused = true;
        if (this.gameLoopId) {
            clearTimeout(this.gameLoopId);
            this.gameLoopId = null;
        }
    }

    resume() {
        if (this.gameOver) return;
        this.isPaused = false;
        this.scheduleMove();
    }

    endGame() {
        this.gameOver = true;
        if (this.gameLoopId) clearTimeout(this.gameLoopId);
        if (this.score > getHighScore()) {
            setHighScore(this.score);
        }
        this.draw();
        document.getElementById('gameOverMessage').classList.remove('hidden');
    }

    draw() {
        const ctx = this.ctx;
        const size = this.canvasSize;
        ctx.clearRect(0, 0, size, size);

        ctx.strokeStyle = '#16a085';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.gridSize; i++) {
            const pos = i * CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, size);
            ctx.stroke();
            ctx.moveTo(0, pos);
            ctx.lineTo(size, pos);
            ctx.stroke();
        }

        if (this.obstaclesEnabled) {
            ctx.fillStyle = '#7f8c8d';
            for (const o of this.obstacles) {
                ctx.fillRect(o.x * CELL_SIZE, o.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }

        if (this.food) {
            const alpha = this.food.blinking
                ? 0.3 + 0.7 * Math.abs(Math.sin(Date.now() / 150))
                : 1.0;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(this.food.x * CELL_SIZE, this.food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.globalAlpha = 1.0;
        }

        ctx.fillStyle = '#2ecc71';
        for (const seg of this.snake) {
            ctx.fillRect(seg.x * CELL_SIZE, seg.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
        if (this.snake.length > 0) {
            const head = this.snake[0];
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(head.x * CELL_SIZE, head.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }

        document.getElementById('scoreDisplay').textContent = this.score;
        document.getElementById('highScoreDisplay').textContent = getHighScore();
    }
}