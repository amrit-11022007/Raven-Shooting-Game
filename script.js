const welcomeScreen = document.getElementById("welcomeScreen");
const deviceScreen = document.getElementById("deviceScreen");
const instructionScreen = document.getElementById("instructionScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const nextButton = document.getElementById("nextButton");
const startButton = document.getElementById("startButton");
const playAgainButton = document.getElementById("playAgainButton");
const orientationWarning = document.getElementById("orientationWarning");
const instructionContent = document.getElementById("instructionContent");
const finalScore = document.getElementById("finalScore");

let gameStarted = false;
let selectedDevice = null;
let shouldCheckOrientation = false;

// Next button - go to device selection
nextButton.addEventListener("click", () => {
  welcomeScreen.style.display = "none";
  deviceScreen.style.display = "flex";
});

// Device selection
document.querySelectorAll(".deviceButton").forEach((button) => {
  button.addEventListener("click", (e) => {
    selectedDevice = e.target.dataset.device;
    deviceScreen.style.display = "none";
    showInstructions();
  });
});

function showInstructions() {
  instructionScreen.style.display = "flex";

  if (selectedDevice === "mobile") {
    instructionContent.innerHTML = `
                    <p><strong>📱 Mobile Instructions:</strong></p>
                    <p>🔄 <strong>Rotate your device to landscape mode</strong> for the best experience.</p>
                    <p>👆 <strong>Tap on the crows</strong> to shoot them down.</p>
                    <p>⚡ Don't let any crow escape off the left side of the screen!</p>
                    <p>🎯 Score points for every crow you hit.</p>
                `;
    shouldCheckOrientation = true;
  } else {
    instructionContent.innerHTML = `
                    <p><strong>💻 PC Instructions:</strong></p>
                    <p>🖱️ <strong>Click on the crows</strong> to shoot them down.</p>
                    <p>⚡ Don't let any crow escape off the left side of the screen!</p>
                    <p>🎯 Score points for every crow you hit.</p>
                    <p>🎮 Good luck and have fun!</p>
                `;
    shouldCheckOrientation = false;
  }
}

// Check orientation (only for mobile)
function checkOrientation() {
  if (!shouldCheckOrientation || !gameStarted) return;

  const isLandscape = window.innerWidth > window.innerHeight;

  if (!isLandscape) {
    orientationWarning.style.display = "flex";
    if (window.gameLoopActive) {
      window.gamePaused = true;
    }
  } else {
    orientationWarning.style.display = "none";
    if (window.gamePaused) {
      window.gamePaused = false;
      if (!gameOver) requestAnimationFrame(animate);
    }
  }
}

startButton.addEventListener("click", () => {
  instructionScreen.style.display = "none";
  gameStarted = true;

  if (shouldCheckOrientation) {
    checkOrientation();
  }

  initGame();
});

playAgainButton.addEventListener("click", () => {
  // Reset game state
  score = 0;
  gameOver = false;
  ravens = [];
  explosions = [];
  timeToNextRaven = 0;
  lastTime = 0;
  window.gamePaused = false;

  // Hide game over screen
  gameOverScreen.style.display = "none";

  // Restart game
  animate(0);
});

window.addEventListener("resize", checkOrientation);
window.addEventListener("orientationchange", checkOrientation);

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
const collisionCanvas = document.getElementById("collisionCanvas");
const collisionCtx = collisionCanvas.getContext("2d");

let score = 0;
let gameOver = false;
let timeToNextRaven = 0;
let ravenInterval = 500;
let lastTime = 0;
let ravens = [];
let explosions = [];

window.gameLoopActive = false;
window.gamePaused = false;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  collisionCanvas.width = window.innerWidth;
  collisionCanvas.height = window.innerHeight;
}

class Raven {
  constructor() {
    this.spriteWidth = 271;
    this.spriteHeight = 194;
    this.sizeModifier = Math.random() * 0.6 + 0.4;
    this.width = this.spriteWidth * this.sizeModifier;
    this.height = this.spriteHeight * this.sizeModifier;
    this.x = canvas.width;
    this.y = Math.random() * (canvas.height - this.height);
    this.directionX = Math.random() * 5 + 3;
    this.directionY = Math.random() * 5 - 2.5;
    this.markedForDeletion = false;
    this.image = new Image();
    this.image.src = "raven.png";
    this.frame = 0;
    this.maxFrame = 4;
    this.timeSinceFlap = 0;
    this.flapInterval = Math.random() * 100 + 50;
    this.randomColors = [
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
    ];
    this.color = `rgb(${this.randomColors[0]},${this.randomColors[1]},${this.randomColors[2]})`;
  }
  update(deltaTime) {
    if (this.y < 0 || this.y > canvas.height - this.height) {
      this.directionY = this.directionY * -1;
    }
    this.x -= this.directionX;
    this.y -= this.directionY;
    if (this.x < 0 - this.width) {
      this.markedForDeletion = true;
    }
    this.timeSinceFlap += deltaTime;
    if (this.timeSinceFlap > this.flapInterval) {
      if (this.frame > this.maxFrame) {
        this.frame = 0;
      } else {
        this.frame++;
      }
      this.timeSinceFlap = 0;
    }
    if (this.x < 0 - this.width) {
      gameOver = true;
    }
  }
  draw() {
    collisionCtx.fillStyle = this.color;
    collisionCtx.fillRect(this.x, this.y, this.width, this.height);
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

class Explosion {
  constructor(x, y, size) {
    this.image = new Image();
    this.image.src = "boom.png";
    this.spriteWidth = 200;
    this.spriteHeight = 179;
    this.size = size;
    this.x = x;
    this.y = y;
    this.frame = 0;
    this.timeSinceLastFrame = 0;
    this.frameInterval = 200;
    this.markedForDeletion = false;
  }
  update(deltatime) {
    this.timeSinceLastFrame += deltatime;
    if (this.timeSinceLastFrame > this.frameInterval) {
      this.frame++;
      this.timeSinceLastFrame = 0;
      if (this.frame > 5) {
        this.markedForDeletion = true;
      }
    }
  }
  draw() {
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.size,
      this.size
    );
  }
}

function drawScore() {
  ctx.fillStyle = "black";
  ctx.fillText("Score: " + score, 50, 75);
  ctx.fillStyle = "white";
  ctx.fillText("Score: " + score, 55, 80);
}

function drawGameOver() {
  ctx.textAlign = "center";
  ctx.fillStyle = "black";
  ctx.fillText(
    "GAME OVER, your score is " + score,
    canvas.width / 2,
    canvas.height / 2
  );
  ctx.fillStyle = "white";
  ctx.fillText(
    "GAME OVER, your score is " + score,
    canvas.width / 2 + 5,
    canvas.height / 2 + 5
  );

  // Show game over screen with play again button
  finalScore.textContent = "Your Score: " + score;
  gameOverScreen.style.display = "flex";
}

function handleClick(x, y) {
  const detectPixelColor = collisionCtx.getImageData(x, y, 1, 1);
  const pc = detectPixelColor.data;
  ravens.forEach((object) => {
    if (
      object.randomColors[0] === pc[0] &&
      object.randomColors[1] === pc[1] &&
      object.randomColors[2] === pc[2]
    ) {
      object.markedForDeletion = true;
      score++;
      const size = Math.max(object.width, object.height);
      const ex = object.x + object.width / 2 - size / 2;
      const ey = object.y + object.height / 2 - size / 2;
      explosions.push(new Explosion(ex, ey, size));
    }
  });
}

// Mouse events
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  handleClick(x, y);
});

// Touch events for mobile
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  handleClick(x, y);
});

function animate(timestamp) {
  if (window.gamePaused) return;

  window.gameLoopActive = true;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  collisionCtx.clearRect(0, 0, canvas.width, canvas.height);
  let deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  timeToNextRaven += deltaTime;
  if (timeToNextRaven > ravenInterval) {
    ravens.push(new Raven());
    timeToNextRaven = 0;
    ravens.sort((a, b) => {
      return a.width - b.width;
    });
  }
  drawScore();
  [...ravens, ...explosions].forEach((object) => object.update(deltaTime));
  [...ravens, ...explosions].forEach((object) => object.draw());
  ravens = ravens.filter((object) => !object.markedForDeletion);
  explosions = explosions.filter((object) => !object.markedForDeletion);
  if (!gameOver) requestAnimationFrame(animate);
  else drawGameOver();
}

function initGame() {
  resizeCanvas();
  ctx.font = "50px Impact";
  window.addEventListener("resize", resizeCanvas);
  animate(0);
}
