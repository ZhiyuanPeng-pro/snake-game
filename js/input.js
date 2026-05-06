import { DIRECTIONS } from './constants.js';
import { getCustomKeys, setCustomKeys } from './storage.js';

// Коды клавиш по умолчанию (строковые значения, например 'ArrowUp')
const DEFAULT_KEYS = {
    [DIRECTIONS.UP]: 'ArrowUp',
    [DIRECTIONS.DOWN]: 'ArrowDown',
    [DIRECTIONS.LEFT]: 'ArrowLeft',
    [DIRECTIONS.RIGHT]: 'ArrowRight'
};

let currentKeys = { ...DEFAULT_KEYS };

// DOM-элементы для отображения назначенных клавиш
let keyDisplays = {
    [DIRECTIONS.UP]: null,
    [DIRECTIONS.DOWN]: null,
    [DIRECTIONS.LEFT]: null,
    [DIRECTIONS.RIGHT]: null
};

// Какое направление сейчас ожидает ввода (null – ни одно)
let listeningDirection = null;

export function loadCustomKeys() {
    const stored = getCustomKeys();
    if (stored) {
        currentKeys = { ...stored };
    }
    return currentKeys;
}

export function getCurrentKeys() {
    return currentKeys;
}

export function keyToDirection(e) {
    const key = e.key;
    const lowerKey = key.toLowerCase();
    for (const [dir, mappedKey] of Object.entries(currentKeys)) {
        if (mappedKey.toLowerCase() === lowerKey) {
            return dir;
        }
    }
    return null;
}

/**
 * Сохраняет текущие настройки в localStorage
 */
export function saveCurrentKeys() {
    setCustomKeys(currentKeys);
}

/**
 * Инициализирует интерактивные элементы для назначения клавиш
 */
export function initKeyBindingUI() {
    keyDisplays[DIRECTIONS.UP] = document.getElementById('keyUpDisplay');
    keyDisplays[DIRECTIONS.DOWN] = document.getElementById('keyDownDisplay');
    keyDisplays[DIRECTIONS.LEFT] = document.getElementById('keyLeftDisplay');
    keyDisplays[DIRECTIONS.RIGHT] = document.getElementById('keyRightDisplay');

    // Устанавливаем начальные надписи
    updateAllDisplays();

    // При клике на элемент начинаем ожидание клавиши
    for (const dir of Object.values(DIRECTIONS)) {
        const el = keyDisplays[dir];
        if (!el) continue;
        el.addEventListener('click', () => {
            // Сбросить предыдущее состояние
            if (listeningDirection) {
                keyDisplays[listeningDirection].classList.remove('listening');
            }
            listeningDirection = dir;
            el.classList.add('listening');
            el.textContent = '...';
        });
    }

    // Глобальный слушатель для захвата клавиши
    window.addEventListener('keydown', (e) => {
        // Если не ожидаем ввода – игнорируем
        if (!listeningDirection) return;

        e.preventDefault();
        const keyName = e.key; // например 'w', 'ArrowUp'

        // Запрещаем использовать уже назначенные клавиши (кроме текущей)
        for (const [dir, mappedKey] of Object.entries(currentKeys)) {
            if (dir !== listeningDirection && mappedKey.toLowerCase() === keyName.toLowerCase()) {
                alert('Эта клавиша уже используется!');
                // Очищаем состояние ожидания
                const el = keyDisplays[listeningDirection];
                el.classList.remove('listening');
                el.textContent = currentKeys[listeningDirection];
                listeningDirection = null;
                return;
            }
        }

        // Обновляем клавишу
        currentKeys[listeningDirection] = keyName;
        const el = keyDisplays[listeningDirection];
        el.classList.remove('listening');
        el.textContent = keyName;

        // Автоматически сохраняем
        saveCurrentKeys();

        listeningDirection = null;
    });
}

function updateAllDisplays() {
    for (const dir of Object.values(DIRECTIONS)) {
        if (keyDisplays[dir]) {
            keyDisplays[dir].textContent = currentKeys[dir];
        }
    }
}