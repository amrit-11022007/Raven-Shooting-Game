/* Auto-scale version (based on both width & height)
   - Fixes HiDPI click mapping
   - Auto-scales crow & explosion sizes using both width and height
   - Keeps core game logic intact
*/

/* --- UI elements --- */
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

/* show/hide screens */
function showScreen(key) {
  Object.values(screens).forEach((s) => s && s.classList.remove("show"));
  if (key && screens[key]) screens[key].classList.add("show");
}

/* device detection */
function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) ||
    (window.innerWidth <= 768 && "ontouchstart" in window)
  );
}

/* navigation */
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
    instructionContent.innerHTML = `<div class="card"><p><strong>Mobile — landscape recommended</strong></p>
      <ul>
        <li>Rotate to landscape. Tap crows to shoot.</li>
        <li>Don't let any crow escape off the left edge.</li>
        <li>Score displays top-left.</li>
      </ul></div>`;
  } else {
    instructionContent.innerHTML = `<div class="card"><p><strong>PC / Laptop</strong></p>
      <ul>
        <li>Use the mouse to click crows.</li>
        <li>No keyboard required — aim and click.</li>
      </ul></div>`;
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
  showScreen(null);
});

/* --- Canvas & game state --- */
const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
const collisionCanvas = document.getElementById("collisionCanvas");
const collisionCtx = collisionCanvas.getContext("2d");

let score = 0,
  gameOver = false,
  ravens = [],
  explosions = [];
let timeToNextRaven = 0,
  ravenInterval = 650,
  lastTime = 0;
let gameLoopActive = false;

/* Global auto-scale factor (based on both width & height)
   - scale is in (0,1], 1 means base size, smaller reduces sizes
   - base reference chosen to look good on large screens
*/
function computeScaleFactor() {
  const baseW = 1200; // reference width
  const baseH = 800; // reference height
  const sx = window.innerWidth / baseW;
  const sy = window.innerHeight / baseH;
  // use both width and height: take the smaller to maintain fit
  const scale = Math.min(sx, sy, 1.0);
  return Math.max(0.48, scale); // clamp lower bound so items don't vanish on very small screens
}

/* HiDPI canvas resize with scale factor application */
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

  // set transform so drawing uses CSS pixels coordinates
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  collisionCtx.setTransform(ratio, 0, 0, ratio, 0, 0);

  // update global scale
  window.gameScale = computeScaleFactor();
}

window.addEventListener("resize", () => {
  resizeCanvas();
  checkOrientation();
});

/* Raven class (uses CSS-pixel coordinates) */
class Raven {
  constructor() {
    // sprite assumed to have frames horizontally
    this.spriteWidth = 271;
    this.spriteHeight = 194;
    // base size modifier (before global scale)
    const baseSize = Math.random() * 0.40 + 0.33; // original distribution but smaller
    this.sizeModifier = baseSize * (window.gameScale || 1);
    this.width = this.spriteWidth * this.sizeModifier;
    this.height = this.spriteHeight * this.sizeModifier;

    // place at right edge
    this.x = canvas.width / (window.devicePixelRatio || 1) + Math.random() * 80;
    this.y =
      Math.random() *
      (canvas.height / (window.devicePixelRatio || 1) - this.height);

    // speed scales with size (smaller = faster) and global scale
    const speedBase = Math.random() * 3 + 2.5;
    this.directionX =
      (speedBase + Math.random() * 2) * (1 + (1 - this.sizeModifier)); // smaller move a bit faster
    this.directionY = Math.random() * 2 - 1;
    this.markedForDeletion = false;
    this.image = new Image();
    this.image.src = "raven.png"; // ensure file exists here

    this.frame = 0;
    this.maxFrame = 4;
    this.timeSinceFlap = 0;
    this.flapInterval = Math.random() * 120 + 60;

    this.randomColors = [
      Math.floor(Math.random() * 254) + 1,
      Math.floor(Math.random() * 254) + 1,
      Math.floor(Math.random() * 254) + 1,
    ];
    this.color = `rgb(${this.randomColors.join(",")})`;
  }

  update(deltaTime) {
    // bounce vertical bounds
    const maxY = canvas.height / (window.devicePixelRatio || 1) - this.height;
    if (this.y < 0 || this.y > maxY) this.directionY *= -1;

    this.x -= this.directionX;
    this.y -= this.directionY;

    this.timeSinceFlap += deltaTime;
    if (this.timeSinceFlap > this.flapInterval) {
      this.frame = (this.frame + 1) % (this.maxFrame + 1);
      this.timeSinceFlap = 0;
    }

    if (this.x + this.width < -50) {
      // left escape -> game over
      this.markedForDeletion = true;
      gameOver = true;
    }
  }

  draw() {
    // draw on collision layer with unique color
    collisionCtx.fillStyle = this.color;
    collisionCtx.fillRect(this.x, this.y, this.width, this.height);

    // draw visible sprite (with frames)
    if (this.image.complete) {
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
    } else {
      // fallback rectangle if image not loaded yet
      ctx.fillStyle = "#444";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
}

/* Explosion class (smaller relative to raven) */
class Explosion {
  constructor(x, y, size) {
    this.image = new Image();
    this.image.src = "boom.png";
    this.spriteWidth = 200;
    this.spriteHeight = 179;
    // size is based on the raven size; apply global scale to keep it proportional
    const scale = window.gameScale || 1;
    this.size = Math.max(32, (size * 0.65) * scale);
    this.x = x;
    this.y = y;
    this.frame = 0;
    this.timeSince = 0;
    this.frameInterval = 80;
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
    if (this.image.complete) {
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
    } else {
      ctx.beginPath();
      ctx.arc(
        this.x + this.size / 2,
        this.y + this.size / 2,
        this.size / 2,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "orange";
      ctx.fill();
    }
  }
}

/* Score & display */
function drawScore() {
  scoreDisplay.textContent = `Score: ${score}`;
}

/* Click handling: convert CSS pixels -> actual canvas pixel coords for getImageData */
function handleClickPixel(pixelX, pixelY) {
  // read pixel from collision canvas (actual canvas pixels)
  try {
    const data = collisionCtx.getImageData(pixelX, pixelY, 1, 1).data;
    const [r, g, b, a] = data;
    if (a === 0) return; // transparent, nothing
    ravens.forEach((raven) => {
      if (
        raven.randomColors[0] === r &&
        raven.randomColors[1] === g &&
        raven.randomColors[2] === b
      ) {
        raven.markedForDeletion = true;
        score++;
        drawScore();
        const size = Math.max(raven.width, raven.height);
        const ex = raven.x + raven.width / 2 - size * 0.5;
        const ey = raven.y + raven.height / 2 - size * 0.5;
        explosions.push(new Explosion(ex, ey, size));
      }
    });
  } catch (err) {
    // getImageData may throw if coordinates outside canvas bounds
    // silently ignore out-of-bounds clicks
  }
}

/* Pointer event handlers map to actual canvas pixels */
function onPointerClickClient(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const cssX = clientX - rect.left;
  const cssY = clientY - rect.top;
  const actualX = Math.floor(cssX * ratio);
  const actualY = Math.floor(cssY * ratio);
  handleClickPixel(actualX, actualY);
}

/* Mouse & touch input */
canvas.addEventListener("click", (e) => {
  onPointerClickClient(e.clientX, e.clientY);
});

canvas.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    const t = e.touches[0];
    onPointerClickClient(t.clientX, t.clientY);
  },
  { passive: false }
);

/* Game loop */
function spawnRaven() {
  ravens.push(new Raven());
  // sort for draw order (smaller in front)
  ravens.sort((a, b) => a.width - b.width);
}

function animate(timestamp) {
  if (!gameLoopActive) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  collisionCtx.clearRect(0, 0, collisionCanvas.width, collisionCanvas.height);

  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  timeToNextRaven += deltaTime;

  // dynamic interval influenced by scale (smaller screens -> slightly slower spawn)
  const scaleFactor = window.gameScale || 1;
  const adjustedInterval = ravenInterval / (0.9 + scaleFactor * 0.6);

  if (timeToNextRaven > adjustedInterval) {
    spawnRaven();
    timeToNextRaven = 0;
  }

  [...ravens, ...explosions].forEach((obj) => obj.update(deltaTime));
  [...ravens, ...explosions].forEach((obj) => obj.draw());

  ravens = ravens.filter((r) => !r.markedForDeletion);
  explosions = explosions.filter((e) => !e.markedForDeletion);

  if (!gameOver) {
    requestAnimationFrame(animate);
  } else {
    onGameOver();
  }
}

function onGameOver() {
  finalScore.textContent = `Your Score: ${score}`;
  showScreen("gameOver");
  gameLoopActive = false;
}

/* Init / reset */
function initGame() {
  resizeCanvas();
  ctx.font = '42px Impact, "Arial Black", sans-serif';
  lastTime = performance.now();
  gameLoopActive = true;
  requestAnimationFrame(animate);
  drawScore();
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

/* Orientation & device checks */
function checkOrientation() {
  if (!shouldCheckOrientation || !gameStarted) return true;
  const isLandscape = window.innerWidth > window.innerHeight;
  if (!isLandscape) {
    if (!hasRotatedOnce && !gameInitialized) {
      showScreen("rotate");
    } else {
      statusDisplay.textContent = "Rotate to continue";
      showScreen(null);
      window.gamePaused = true;
    }
    return false;
  }
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

/* Start game flow */
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
    } else {
      gameLoopActive = true;
      lastTime = performance.now();
      requestAnimationFrame(animate);
    }
  }
});

/* Start helper for play again */
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

/* initial setup */
resizeCanvas();
drawScore();

/* expose small API for debugging from console if needed */
window._game = { resetGameState, startGameplay, spawnRaven };

/* End of file */
