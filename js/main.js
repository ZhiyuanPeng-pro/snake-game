import { Game } from './game.js';
import { loadCustomKeys, keyToDirection, initKeyBindingUI } from './input.js';
import { getHighScore, setHighScore, getObstaclesEnabled, setObstaclesEnabled } from './storage.js';
import { calculateGrid } from './constants.js';

const canvas = document.getElementById('gameCanvas');
let game;
let currentGridSize;

const newGameBtn = document.getElementById('newGameBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetHighScoreBtn = document.getElementById('resetHighScoreBtn');
const difficultySelect = document.getElementById('difficultySelect');
const obstaclesCheckbox = document.getElementById('obstaclesCheckbox');
const gameOverMsg = document.getElementById('gameOverMessage');

document.getElementById('highScoreDisplay').textContent = getHighScore();
obstaclesCheckbox.checked = getObstaclesEnabled();

// Инициализируем клавиши и UI для их смены
loadCustomKeys();
initKeyBindingUI();

function startNewGame() {
    gameOverMsg.classList.add('hidden');
    const difficulty = difficultySelect.value;
    const obstacles = obstaclesCheckbox.checked;
    setObstaclesEnabled(obstacles);

    const { gridSize, canvasSize } = calculateGrid(window.innerWidth, window.innerHeight);
    currentGridSize = gridSize;
    canvas.width = canvas.height = canvasSize;
    canvas.style.width = canvasSize + 'px';
    canvas.style.height = canvasSize + 'px';

    if (game && game.gameLoopId) clearTimeout(game.gameLoopId);
    game = new Game(canvas, gridSize, difficulty, obstacles);
    game.start();
}

newGameBtn.addEventListener('click', startNewGame);

pauseBtn.addEventListener('click', () => {
    if (!game) return;
    if (game.gameOver) return;
    if (game.isPaused) {
        game.resume();
        pauseBtn.textContent = 'Пауза';
    } else {
        game.pause();
        pauseBtn.textContent = 'Продолжить';
    }
});

resetHighScoreBtn.addEventListener('click', () => {
    setHighScore(0);
    document.getElementById('highScoreDisplay').textContent = '0';
    if (game) {
        if (game.gameLoopId) clearTimeout(game.gameLoopId);
        game.reset();
        game.draw();
    }
});

window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    // Если происходит назначение клавиш – не обрабатываем управление
    if (document.querySelector('.listening')) return;
    const dir = keyToDirection(e);
    if (dir && game && !game.gameOver) {
        e.preventDefault();
        game.changeDirection(dir);
    }
});

let resizeDebounce;
window.addEventListener('resize', () => {
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(startNewGame, 300);
});

startNewGame();