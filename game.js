const gameEl = document.getElementById('game');
const dinoEl = document.getElementById('dino');
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restart');

let lastTime = null;
let gameSpeed = 1;
let gameOver = false;
let score = 0;

const gameHeight = gameEl.clientHeight; 
const gameWidth = gameEl.clientWidth;

const GROUND_HEIGHT = Number.parseInt(gameHeight * 0.25); 

const DINO_WIDTH = 120;
const DINO_HEIGHT = 105;
const DINO_FRAME_WIDTH = 120; // width of each frame in sprite sheet
const DINO_FRAMES = 5; // number of frames in your sprite sheet
const DINO_ANIMATION_SPEED = 0.1; // seconds per frame
const GRAVITY = 2700; // pixels per second^2
const JUMP_VELOCITY = 1000; // pixels per second

const dino = {
    x: Number.parseInt(gameWidth * 0.05),
    y: gameHeight - GROUND_HEIGHT - DINO_HEIGHT,
    vy: 0,
    isJumping: false,
    isOnGround: true
};

let dinoAnimationTime = 0;

function setDinoPosition() {
    // Only animate when dino is on ground
    if (dino.isOnGround) {
        dinoAnimationTime += 0.01; // rough delta, update with actual delta
        const frameIndex = Math.floor((dinoAnimationTime / DINO_ANIMATION_SPEED) % DINO_FRAMES);
        const bgPositionX = frameIndex * DINO_FRAME_WIDTH;
        dinoEl.style.backgroundPositionX = `-${bgPositionX}px`;
    } else {
        // Reset to first frame when jumping
        dinoEl.style.backgroundPositionX = '0px';
    }
    dinoEl.style.transform = `translate(${dino.x}px, ${dino.y}px) scaleX(-1)`;
}

function handleJump() {
    if (!dino.isOnGround || gameOver) return;
    dino.vy = JUMP_VELOCITY;
    dino.isJumping = true;
    dino.isOnGround = false;
}

document.addEventListener('keydown', (e) => {
if (e.code === 'Space' || e.code === 'ArrowUp') {
    handleJump();
}
});

function updateDino(delta) {
    dino.vy -= GRAVITY * delta;
    dino.y -= dino.vy * delta;

    const groundY = gameHeight - GROUND_HEIGHT - DINO_HEIGHT;
    if (dino.y > groundY) {
        dino.y = groundY;
        dino.vy = 0;
        dino.isJumping = false;
        dino.isOnGround = true;
    }

    setDinoPosition();
}

const OBSTACLE_MIN_GAP = Number.parseInt(gameWidth * 0.5); 
const OBSTACLE_MAX_GAP = Number.parseInt(gameWidth * 0.65);
const OBSTACLE_SPEED = 300; // base speed, scaled by gameSpeed

let obstacles = [];
let nextObstacleTime = 0;

function createObstacle() {
    const obstacleEl = document.createElement('div');
    obstacleEl.classList.add('obstacle');
    gameEl.appendChild(obstacleEl);

    const obstacle = {
        el: obstacleEl,
        x: gameWidth,
        y: gameHeight - GROUND_HEIGHT - 75,
        width: 75,
        height: 75
    };

    obstacleEl.style.transform = `translate(${obstacle.x}px, ${obstacle.y}px)`;
    obstacles.push(obstacle);
}

function updateObstacles(delta) {
    nextObstacleTime -= delta;
    if (nextObstacleTime <= 0) {
        createObstacle();
        const gap = OBSTACLE_MIN_GAP + Math.random() * (OBSTACLE_MAX_GAP - OBSTACLE_MIN_GAP);
        nextObstacleTime = gap / (OBSTACLE_SPEED * gameSpeed);
    }

    obstacles.forEach((obstacle) => {
        obstacle.x -= OBSTACLE_SPEED * gameSpeed * delta;
        obstacle.el.style.transform = `translate(${obstacle.x}px, ${obstacle.y}px)`;
    });

    obstacles = obstacles.filter((obstacle) => {
        if (obstacle.x + obstacle.width < 0) {
        obstacle.el.remove();
        return false;
        }
        return true;
    });
}

function rectsOverlap(r1, r2) {
    return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
    );
}

function checkCollisions() {
    const dinoRect = {
        x: dino.x,
        y: dino.y,
        width: DINO_WIDTH,
        height: DINO_HEIGHT
    };

    for (const obstacle of obstacles) {
        const obstacleRect = {
        x: obstacle.x,
        y: obstacle.y,
        width: obstacle.width,
        height: obstacle.height
        };

        if (rectsOverlap(dinoRect, obstacleRect)) {
        handleGameOver();
        break;
        }
    }
}

let bestScore = Number(localStorage.getItem('dinoBestScore') || 0);

function updateBestScore() {
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('dinoBestScore', String(bestScore));
  }
}

function handleGameOver() {
    gameOver = true;
    updateBestScore();
    restartBtn.classList.remove('hidden');
}

const SCORE_PER_SECOND = 40;
const SPEED_INCREASE_RATE = 0.05; // per seco nd

function updateScore(delta) {
    score += SCORE_PER_SECOND * delta * gameSpeed;
    const displayScore = String(Math.floor(score)).padStart(5, '0');
    scoreEl.textContent = displayScore;

    // Gradually increase game speed
    gameSpeed += SPEED_INCREASE_RATE * delta;

    //   updateDayNight();
}

function resetGame() {
    obstacles.forEach(o => o.el.remove());
    obstacles = [];

    score = 0;
    gameSpeed = 1;
    scoreEl.textContent = '00000';

    dino.y = gameHeight - GROUND_HEIGHT - DINO_HEIGHT;
    dino.vy = 0;
    dino.isOnGround = true;
    setDinoPosition();

    gameOver = false;
    restartBtn.classList.add('hidden');
    lastTime = null; // reset time so delta doesn't spike
    requestAnimationFrame(update);
}

restartBtn.addEventListener('click', resetGame);

document.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') && gameOver) {
        resetGame();
    }
});

document.addEventListener('keydown', (e) => {
if (e.code === 'Escape') {
    handleGameOver();
}
});

let isNight = false;
let nextToggleScore = 500; // first flip around 500 pts

function updateDayNight() {
    if (score >= nextToggleScore) {
        isNight = !isNight;
        nextToggleScore += 500;

        if (isNight) {
            gameEl.style.background = '#111827';
            gameEl.style.borderColor = '#e5e7eb';
        } else {
            gameEl.style.background = '#f9fafb';
            gameEl.style.borderColor = '#111827';
        }
    }
}

gameEl.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameOver) {
        resetGame();
    } else {
        handleJump();
    }
}, { passive: false });

function update(time) {
    if (lastTime === null) {
        lastTime = time;
        requestAnimationFrame(update);
        return;
    }
    const delta = (time - lastTime) / 1000;
    lastTime = time;

    if (gameOver) return;

    updateDino(delta);
    updateObstacles(delta);
    updateScore(delta);
    checkCollisions();

    requestAnimationFrame(update);
}

requestAnimationFrame(update);