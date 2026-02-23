const gameEl = document.getElementById('game');
const capyEl = document.getElementById('capy');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const nightOverlayEl = document.getElementById('night-overlay');
const gameOverEl = document.getElementById('game-over');
const youWonEl = document.getElementById('you-won');
// Audio assets
const gameOverSound = new Audio('assets/gameOver.wav');
const youWonSound = new Audio('assets/youWon.wav');
gameOverSound.preload = 'auto';
youWonSound.preload = 'auto';
gameOverSound.volume = 1;
youWonSound.volume = 1;

let lastTime = null;
let gameSpeed = 1;
let gameOver = false;
let score = 0;
let winShown = false;
let isPausedForWin = false;

const gameHeight = gameEl.clientHeight; 
const gameWidth = gameEl.clientWidth;

const GROUND_HEIGHT = Number.parseInt(gameHeight * 0.25); 

const CAPY_WIDTH = 120;
const CAPY_HEIGHT = 105;
const CAPY_FRAME_WIDTH = 120;
const CAPY_FRAMES = 5;
const CAPY_ANIMATION_SPEED = 0.05; // seconds per frame
const GRAVITY = 2800; // pixels per second^2
const JUMP_VELOCITY = 1300; // pixels per second

const capy = {
    x: Number.parseInt(gameWidth * 0.05),
    y: gameHeight - GROUND_HEIGHT - CAPY_HEIGHT,
    vy: 0,
    isJumping: false,
    isOnGround: true
};

let capyAnimationTime = 0;

function setCapyPosition() {
    // Only animate when capy is on ground
    if (capy.isOnGround) {
        capyAnimationTime += 0.01; // rough delta, update with actual delta
        const frameIndex = Math.floor((capyAnimationTime / CAPY_ANIMATION_SPEED) % CAPY_FRAMES);
        const bgPositionX = frameIndex * CAPY_FRAME_WIDTH;
        capyEl.style.backgroundPositionX = `-${bgPositionX}px`;
    } else {
        // Reset to first frame when jumping
        capyEl.style.backgroundPositionX = '0px';
    }
    capyEl.style.transform = `translate(${capy.x}px, ${capy.y}px) scaleX(-1)`;
}

function handleJump() {
    if (!capy.isOnGround || gameOver) return;
    capy.vy = JUMP_VELOCITY;
    capy.isJumping = true;
    capy.isOnGround = false;
}

document.addEventListener('keydown', (e) => {
if (e.code === 'Space' || e.code === 'ArrowUp') {
    handleJump();
}
});

function updateCapy(delta) {
    capy.vy -= GRAVITY * delta;
    capy.y -= capy.vy * delta;

    const groundY = gameHeight - GROUND_HEIGHT - CAPY_HEIGHT;
    if (capy.y > groundY) {
        capy.y = groundY;
        capy.vy = 0;
        capy.isJumping = false;
        capy.isOnGround = true;
    }

    setCapyPosition();
}

const OBSTACLE_MIN_GAP = Number.parseInt(gameWidth * 0.5); 
const OBSTACLE_MAX_GAP = Number.parseInt(gameWidth * 0.65);
const OBSTACLE_SPEED = 300; // base speed, scaled by gameSpeed
const OBSTACLE_FRAME_WIDTH = 96; // width of each frame in sprite sheet
const OBSTACLE_FRAMES = 7; // number of frames in your sprite sheet
const OBSTACLE_ANIMATION_SPEED = 0.1; // seconds per frame

let obstacles = [];
let nextObstacleTime = 0;

function createObstacle() {
    const obstacleEl = document.createElement('div');
    obstacleEl.classList.add('obstacle');
    gameEl.appendChild(obstacleEl);

    const obstacle = {
        el: obstacleEl,
        x: gameWidth,
        y: gameHeight - GROUND_HEIGHT - 96,
        width: 96,
        height: 96,
        animationTime: 0
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
        
        // Animate sprite
        obstacle.animationTime += delta;
        const frameIndex = Math.floor((obstacle.animationTime / OBSTACLE_ANIMATION_SPEED) % OBSTACLE_FRAMES);
        const bgPositionX = frameIndex * OBSTACLE_FRAME_WIDTH;
        obstacle.el.style.backgroundPositionX = `-${bgPositionX}px`;
        
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
    const capyRect = {
        x: capy.x,
        y: capy.y,
        width: CAPY_WIDTH,
        height: CAPY_HEIGHT
    };

    for (const obstacle of obstacles) {
        const obstacleRect = {
        x: obstacle.x,
        y: obstacle.y,
        width: obstacle.width,
        height: obstacle.height
        };

        if (rectsOverlap(capyRect, obstacleRect)) {
        handleGameOver();
        break;
        }
    }
}

let isNight = false;
let nextToggleScore = 500; // first flip around 500 pts

function updateDayNight() {
    if (score >= nextToggleScore) {
        isNight = !isNight;
        nextToggleScore += 500;
        
        if (isNight) {
            nightOverlayEl.classList.remove('hidden');
        } else {
            nightOverlayEl.classList.add('hidden');
        }
    }
}

let bestScore = Number(localStorage.getItem('capyBestScore') || 0);

function updateBestScore() {
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('capyBestScore', String(bestScore));
  }
}

function showYouWon() {
        isPausedForWin = true;
        winShown = true;
        if (youWonEl) youWonEl.classList.remove('hidden');
        // play win sound (safe-guard promise rejection)
        try {
            youWonSound.currentTime = 0;
            youWonSound.play().catch(() => {});
        } catch (e) {
            // ignore if playback is blocked
        }
}

function hideYouWon(continueGame = false) {
        if (youWonEl) youWonEl.classList.add('hidden');
        isPausedForWin = false;
        if (continueGame) {
                // resume loop, reset lastTime to avoid large delta
                lastTime = null;
                requestAnimationFrame(update);
        }
}

function handleGameOver() {
    gameOver = true;
    updateBestScore();
    gameOverEl.classList.remove('hidden');
    try {
        gameOverSound.currentTime = 0;
        gameOverSound.play().catch(() => {});
    } catch (e) {
        // ignore play errors
    }
}

const SCORE_PER_SECOND = 10;
const SPEED_INCREASE_RATE = 0.05; // per second

function updateScore(delta) {
    score += SCORE_PER_SECOND * delta * gameSpeed;
    const displayScore = String(Math.floor(score)).padStart(5, '0');
    scoreEl.textContent = displayScore;
    
    // Update high score display
    const displayHighScore = String(Math.floor(bestScore)).padStart(5, '0');
    highScoreEl.textContent = `Best: ${displayHighScore}`;

    // Gradually increase game speed
    gameSpeed += SPEED_INCREASE_RATE * delta;

    updateDayNight();

    // Trigger win screen once at 1000 points
    if (!winShown && score >= 1000) {
        showYouWon();
    }
}

function resetGame() {
    obstacles.forEach(o => o.el.remove());
    obstacles = [];

    score = 0;
    gameSpeed = 1;
    scoreEl.textContent = '00000';
    isNight = false;
    nextToggleScore = 500;
    nightOverlayEl.classList.add('hidden');    

    capy.y = gameHeight - GROUND_HEIGHT - CAPY_HEIGHT;
    capy.vy = 0;
    capy.isOnGround = true;
    setCapyPosition();

    gameOver = false;
    winShown = false;
    isPausedForWin = false;
    if (youWonEl) youWonEl.classList.add('hidden');
    gameOverEl.classList.add('hidden');
    lastTime = null; // reset time so delta doesn't spike
    requestAnimationFrame(update);
}

document.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'ArrowUp') && gameOver) {
        resetGame();
    }
});

gameEl.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (isPausedForWin) {
        hideYouWon(true);
        return;
    }
    if (gameOver) {
        resetGame();
    } else {
        handleJump();
    }
}, { passive: false });

// Keyboard shortcuts while win overlay is visible
document.addEventListener('keydown', (e) => {
    if (!isPausedForWin) return;
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        hideYouWon(true);
    }
});

function update(time) {
    if (lastTime === null) {
        lastTime = time;
        requestAnimationFrame(update);
        return;
    }
    const delta = (time - lastTime) / 1000;
    lastTime = time;

    if (gameOver) return;

    if (isPausedForWin) return;

    updateCapy(delta);
    updateObstacles(delta);
    updateScore(delta);
    checkCollisions();

    requestAnimationFrame(update);
}

requestAnimationFrame(update);