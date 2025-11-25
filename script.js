const screens = {
  welcome: document.getElementById("welcomeScreen"),
  device: document.getElementById("deviceScreen"),
  instruction: document.getElementById("instructionScreen"),
  rotate: document.getElementById("rotateScreen"),
  wrongDevice: document.getElementById("wrongDeviceScreen"),
  gameOver: document.getElementById("gameOverScreen"),
};
const nextButton = document.getElementById("nextButton");
const startButton = document.getElementById("startButton");
const deviceButtons = Array.from(document.querySelectorAll(".deviceButton"));
const instructionContent = document.getElementById("instructionContent");
const wrongDeviceMessage = document.getElementById("wrongDeviceMessage");
const backToDeviceBtn = document.getElementById("backToDeviceBtn");
const playAgainButton = document.getElementById("playAgainButton");
const deviceAgainButton = document.getElementById("deviceAgainButton");
const finalScore = document.getElementById("finalScore");
const scoreDisplay = document.getElementById("scoreDisplay");
const statusDisplay = document.getElementById("statusDisplay");

let selectedDevice = null;
let shouldCheckOrientation = false;
let hasRotatedOnce = false;
let gameStarted = false;
let gameInitialized = false;

function showScreen(key) {
  Object.values(screens).forEach((s) => s.classList.remove("show"));
  if (screens[key]) screens[key].classList.add("show");
}

// Helpers
function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) ||
    (window.innerWidth <= 768 && "ontouchstart" in window)
  );
}

// Navigation
nextButton.addEventListener("click", () => showScreen("device"));

deviceButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedDevice = btn.dataset.device;
    shouldCheckOrientation = selectedDevice === "mobile";
    showInstructions();
    showScreen("instruction");
  });
});

function showInstructions() {
  if (selectedDevice === "mobile") {
    instructionContent.innerHTML = `
      <div class="card">
        <p><strong>Mobile — landscape recommended</strong></p>
        <ul>
          <li>Rotate to landscape. Tap crows to shoot.</li>
          <li>Don't let any crow escape off the left edge.</li>
          <li>Quick rounds — your score appears at top-left.</li>
        </ul>
      </div>`;
  } else {
    instructionContent.innerHTML = `
      <div class="card">
        <p><strong>PC / Laptop</strong></p>
        <ul>
          <li>Use the mouse to click crows.</li>
          <li>Keyboard not required — just aim and click.</li>
        </ul>
      </div>`;
  }
}

backToDeviceBtn.addEventListener("click", () => {
  selectedDevice = null;
  showScreen("device");
});

deviceAgainButton.addEventListener("click", () => {
  selectedDevice = null;
  resetGameState();
  showScreen("device");
});

playAgainButton.addEventListener("click", () => {
  resetGameState();
  startGameplay();
  showScreen(null); // hide overlays
});

// -------------------------------------------------------------
// Canvas & Game logic (kept core logic but improved rendering)
const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
const collisionCanvas = document.getElementById("collisionCanvas");
const collisionCtx = collisionCanvas.getContext("2d");

let score = 0,
  gameOver = false,
  ravens = [],
  explosions = [];
let timeToNextRaven = 0,
  ravenInterval = 500,
  lastTime = 0;

// HiDPI scaling
function resizeCanvas() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const ratio = window.devicePixelRatio || 1;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  collisionCanvas.style.width = w + "px";
  collisionCanvas.style.height = h + "px";
  canvas.width = Math.floor(w * ratio);
  canvas.height = Math.floor(h * ratio);
  collisionCanvas.width = Math.floor(w * ratio);
  collisionCanvas.height = Math.floor(h * ratio);
  // reset transforms for proper scaling
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  collisionCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

window.addEventListener("resize", () => {
  resizeCanvas();
  checkOrientation();
});

class Raven {
  constructor() {
    this.spriteWidth = 271;
    this.spriteHeight = 194;
    this.sizeModifier = Math.random() * 0.6 + 0.4;
    this.width = this.spriteWidth * this.sizeModifier;
    this.height = this.spriteHeight * this.sizeModifier;
    this.x = canvas.width / (window.devicePixelRatio || 1);
    this.y =
      Math.random() *
      (canvas.height / (window.devicePixelRatio || 1) - this.height);
    this.directionX = Math.random() * 5 + 3;
    this.directionY = Math.random() * 2 - 1;
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
    this.color = `rgb(${this.randomColors.join(",")})`;
  }
  update(deltaTime) {
    if (
      this.y < 0 ||
      this.y > canvas.height / (window.devicePixelRatio || 1) - this.height
    )
      this.directionY *= -1;
    this.x -= this.directionX;
    this.y -= this.directionY;
    this.timeSinceFlap += deltaTime;
    if (this.timeSinceFlap > this.flapInterval) {
      this.frame = (this.frame + 1) % (this.maxFrame + 1);
      this.timeSinceFlap = 0;
    }
    if (this.x < -this.width) {
      this.markedForDeletion = true;
      gameOver = true;
    }
  }
  draw() {
    // collision layer
    collisionCtx.fillStyle = this.color;
    collisionCtx.fillRect(this.x, this.y, this.width, this.height);
    // visible layer
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
    this.timeSince = 0;
    this.frameInterval = 200;
    this.markedForDeletion = false;
  }
  update(deltaTime) {
    this.timeSince += deltaTime;
    if (this.timeSince > this.frameInterval) {
      this.frame++;
      this.timeSince = 0;
      if (this.frame > 5) this.markedForDeletion = true;
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
  scoreDisplay.textContent = `Score: ${score}`;
}

function handleClick(x, y) {
  // pixel color detection from collision canvas
  const px = collisionCtx.getImageData(x, y, 1, 1).data;
  ravens.forEach((r) => {
    if (
      r.randomColors[0] === px[0] &&
      r.randomColors[1] === px[1] &&
      r.randomColors[2] === px[2]
    ) {
      r.markedForDeletion = true;
      score++;
      drawScore();
      const size = Math.max(r.width, r.height);
      const ex = r.x + r.width / 2 - size / 2;
      const ey = r.y + r.height / 2 - size / 2;
      explosions.push(new Explosion(ex, ey, size));
    }
  });
}

// Input
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;

    // convert CSS → actual canvas pixel coordinates
    const x = (e.clientX - rect.left) * ratio;
    const y = (e.clientY - rect.top) * ratio;

    handleClick(x, y);
});

canvas.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    const ratio = window.devicePixelRatio || 1;

    const x = (t.clientX - rect.left) * ratio;
    const y = (t.clientY - rect.top) * ratio;

    handleClick(x, y);
  },
  { passive: false }
);

let gameLoopActive = false;

function animate(timestamp) {
  if (gameLoopActive === false) return; // stopped
  if (window.gamePaused) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  collisionCtx.clearRect(0, 0, collisionCanvas.width, collisionCanvas.height);
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  timeToNextRaven += deltaTime;
  if (timeToNextRaven > ravenInterval) {
    ravens.push(new Raven());
    timeToNextRaven = 0;
    ravens.sort((a, b) => a.width - b.width);
  }
  [...ravens, ...explosions].forEach((obj) => obj.update(deltaTime));
  [...ravens, ...explosions].forEach((obj) => obj.draw());
  ravens = ravens.filter((r) => !r.markedForDeletion);
  explosions = explosions.filter((e) => !e.markedForDeletion);
  if (!gameOver) requestAnimationFrame(animate);
  else onGameOver();
}

function onGameOver() {
  finalScore.textContent = `Your Score: ${score}`;
  showScreen("gameOver");
  gameLoopActive = false;
}

function initGame() {
  resizeCanvas();
  ctx.font = "42px Impact, Arial Black, sans-serif";
  lastTime = performance.now();
  gameLoopActive = true;
  requestAnimationFrame(animate);
}

function resetGameState() {
  score = 0;
  gameOver = false;
  ravens = [];
  explosions = [];
  timeToNextRaven = 0;
  lastTime = 0;
  drawScore();
}

// Orientation & device validation
function checkOrientation() {
  if (!shouldCheckOrientation || !gameStarted) return true;
  const isLandscape = window.innerWidth > window.innerHeight;
  if (!isLandscape) {
    if (!hasRotatedOnce && !gameInitialized) {
      showScreen("rotate");
    } else {
      statusDisplay.textContent = "Rotate to continue";
      showScreen(null);
      /* keep HUD visible */ window.gamePaused = true;
    }
    return false;
  }
  // landscape ok
  statusDisplay.textContent = "";
  if (!hasRotatedOnce) {
    hasRotatedOnce = true;
    if (!gameInitialized) {
      initGame();
      gameInitialized = true;
    }
  }
  if (window.gamePaused) {
    window.gamePaused = false;
    lastTime = performance.now();
    requestAnimationFrame(animate);
  }
  return true;
}

function checkDeviceMatch() {
  const actuallyMobile = isMobileDevice();
  const selectedMobile = selectedDevice === "mobile";
  if (actuallyMobile !== selectedMobile) {
    wrongDeviceMessage.textContent = actuallyMobile
      ? "You chose PC but are on mobile."
      : "You chose Mobile but are on PC.";
    showScreen("wrongDevice");
    window.gamePaused = true;
    return false;
  }
  return true;
}

// Start game flow
startButton?.addEventListener("click", () => {
  if (!selectedDevice) return showScreen("device");
  showScreen(null);
  gameStarted = true;
  if (!checkDeviceMatch()) return;
  if (shouldCheckOrientation) {
    checkOrientation();
  } else {
    if (!gameInitialized) {
      initGame();
      gameInitialized = true;
    }
  }
});

// Public helper to start gameplay (used by play again)
function startGameplay() {
  resetGameState();
  if (!gameInitialized) {
    initGame();
    gameInitialized = true;
  } else {
    gameLoopActive = true;
    lastTime = performance.now();
    requestAnimationFrame(animate);
  }
}

// initialise UI
resizeCanvas();
drawScore();

// expose small API for debugging in console if needed
window._game = { resetGameState, startGameplay };
