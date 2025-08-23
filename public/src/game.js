// --- Assets & State ---
let sistersImg;
let sisters;
let items = [];
let particles = [];
let confetti = [];
let score = 0;
let best = parseInt(localStorage.getItem('iyer_feed_best') || '0');

let playing = false;
let gameOverScreen = false;
let timeLeft = 30;
let clock;
let shakeFrames = 0;

let cnv;

// Smooth movement
let moveLeft = false;
let moveRight = false;
const speed = 10; // px/frame, feels smooth on 60fps

// Game Over panel animation
let goOverlayA = 0;         // overlay alpha 0→180
let goPanelY;               // animated Y of panel
let goPanelTargetY;         // resting Y
let goPulse = 0;            // subtle scale pulse for Replay button

// Sounds (reuse existing files)
const sCatch = new Audio("./sounds/catch.mp3");
const sCoffee = new Audio("./sounds/coffee.mp3");
const sRock = new Audio("./sounds/rock.mp3");
const sGameOver = new Audio("./sounds/gameover.mp3");

// --- p5 lifecycle ---
function preload() {
  sistersImg = loadImage("./images/sisters-sprite.png");
}

function setup() {
  textAlign(CENTER, CENTER);
  textSize(28);
  const startBtn = document.getElementById("gStart");
  if (startBtn) startBtn.addEventListener("click", startGame);
}

function draw() {
  if (!playing && !gameOverScreen) return; // remain invisible until play

  // Background gradient / vignette
  setGradient(0, 0, width, height, color(242, 246, 255), color(210, 225, 255));
  drawVignette();

  push();
  if (shakeFrames > 0) {
    translate(random(-10, 10), random(-10, 10));
    shakeFrames--;
  }

  if (playing) {
    // movement
    if (moveLeft)  sisters.x = max(sisters.w/2, sisters.x - speed);
    if (moveRight) sisters.x = min(width - sisters.w/2, sisters.x + speed);

    // spawn & render items
    if (random() < 0.22) addItem();
    fill(0);
    textSize(28);
    for (let it of items) {
      it.y += it.v;
      text(it.t, it.x, it.y);
    }

    // collisions — ellipse around sprite (all sides)
    items = items.filter(it => {
      const dx = it.x - sisters.x;
      const dy = it.y - sisters.y;
      const rx = sisters.w * 0.28;
      const ry = sisters.h * 0.40;
      if ((dx*dx)/(rx*rx) + (dy*dy)/(ry*ry) <= 1) {
        if (it.t === "🪨") {
          score = max(0, score - 2);
          sRock.currentTime = 0; sRock.play();
          shakeFrames = 12;
          spawnBurst(it.x, it.y, "#ff4d4d"); // red pop on hit
        } else {
          score += (it.t === "☕") ? 1 : 2;
          (it.t === "☕" ? sCoffee : sCatch).play();
          spawnBurst(it.x, it.y, it.t === "☕" ? "#ffcc00" : "#18a558"); // coffee gold / food green
        }
        return false;
      }
      return it.y < height + 22;
    });
  }

  // particles
  updateParticles();

  // shadow
  noStroke();
  fill(0, 0, 0, 25);
  ellipse((sisters?.x ?? width/2), height - 40, (sisters?.w ?? 120) * 0.7, 22);

  // sprite
  if (sistersImg && (playing || gameOverScreen)) {
    image(sistersImg, sisters.x - sisters.w/2, sisters.y - sisters.h/2, sisters.w, sisters.h);
  }
  pop();

  // HUD during play
  if (playing) {
    drawHUD();
  }

  // Game over overlay & panel
  if (gameOverScreen) {
    drawGameOverOverlayAndPanel();
    updateConfetti();
  }
}

// --- Input ---
function keyPressed() {
  if (gameOverScreen) {
    if (key === 'r' || key === 'R') replay();
    if (keyCode === ESCAPE) exitToPage();
    return;
  }
  if (keyCode === LEFT_ARROW || key === 'a' || key === 'A') moveLeft = true;
  if (keyCode === RIGHT_ARROW || key === 'd' || key === 'D') moveRight = true;
}
function keyReleased() {
  if (keyCode === LEFT_ARROW || key === 'a' || key === 'A') moveLeft = false;
  if (keyCode === RIGHT_ARROW || key === 'd' || key === 'D') moveRight = false;
}

function mousePressed() {
  if (!gameOverScreen) return;

  // recompute button positions consistently
  const panelW = min(560, width * 0.9);
  const panelH = 320;
  const panelX = (width - panelW) / 2;
  const panelY = goPanelY;

  const { bx1, by1, bw, bh, bx2, by2 } = gameOverButtons(panelW, panelH, panelX, panelY);

  // Replay
  if (mouseX > bx1 && mouseX < bx1 + bw && mouseY > by1 && mouseY < by1 + bh) {
    replay();
  }
  // Exit
  else if (mouseX > bx2 && mouseX < bx2 + bw && mouseY > by2 && mouseY < by2 + bh) {
    exitToPage();
  }
}
// --- Game flow ---
function startGame() {
  if (playing) return;
  playing = true;
  gameOverScreen = false;

  if (!cnv) {
    cnv = createCanvas(windowWidth, windowHeight);
    cnv.position(0, 0);
    cnv.style('z-index', '9999');
    cnv.style('position', 'fixed');
  }
  fullscreen(true);

  items = [];
  particles = [];
  confetti = [];
  score = 0;
  timeLeft = 30;

  sisters = { x: width/2, y: height - 110, w: 130, h: 120 };

  if (clock) clearInterval(clock);
  clock = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) showGameOver();
  }, 1000);
}

function showGameOver() {
  playing = false;
  clearInterval(clock);
  best = max(best, score);
  localStorage.setItem('iyer_feed_best', best);
  sGameOver.play();

  // animate overlay/panel
  gameOverScreen = true;
  goOverlayA = 0;
  goPanelY = height + 40;
  goPanelTargetY = height * 0.5;
  goPulse = 0;

  // confetti celebration
  spawnConfetti(140);
}

function replay() {
  // soft reset (keeps overlay until we re-enter startGame visuals)
  gameOverScreen = false;
  startGame();
}

function exitToPage() {
  gameOverScreen = false;
  clearInterval(clock);
  if (cnv) cnv.remove();
  cnv = null;
}

// --- Rendering helpers ---
function drawHUD() {
  const boxW = 180, boxH = 120;
  const boxX = 20, boxY = 20;

  noStroke();
  fill(0, 160);
  rect(boxX, boxY, boxW, boxH, 16);

  fill(255);
  textAlign(LEFT, CENTER);

  textSize(28);
  text(`⭐ ${score}`, boxX + 20, boxY + 30);

  textSize(22);
  text(`🏆 ${best}`, boxX + 20, boxY + 65);

  text(`⏱️ ${timeLeft}s`, boxX + 20, boxY + 95);
}

function drawGameOverOverlayAndPanel() {
  // overlay fade-in
  goOverlayA = lerp(goOverlayA, 180, 0.08);
  fill(0, goOverlayA);
  rect(0, 0, width, height);

  // panel slide-in
  goPanelY = lerp(goPanelY, goPanelTargetY, 0.12);

  // panel dims/anchors
  const panelW = min(560, width * 0.9);
  const panelH = 320;
  const panelX = (width - panelW) / 2;
  const panelTop = goPanelY - panelH / 2;
  const panelBottom = panelTop + panelH;
  const cx = width / 2;

  // glassy panel
  push();
  drawingContext.shadowColor = 'rgba(0,0,0,0.25)';
  drawingContext.shadowBlur = 16;
  noStroke();
  fill(255, 230);
  rect(panelX, panelTop, panelW, panelH, 20);
  pop();

  // title & stats — centered with proportional vertical placement
  push();
  fill(20);
  textAlign(CENTER, CENTER);

  textSize(48);
  text("Game Over", cx, panelTop + panelH * 0.28);
  pop();

  // buttons (with hover + pulse on Replay)
  const { bx1, by1, bw, bh, bx2, by2 } = gameOverButtons(panelW, panelH, panelX, goPanelY);

  // hover detect
  const hoveredReplay = mouseX > bx1 && mouseX < bx1 + bw && mouseY > by1 && mouseY < by1 + bh;
  const hoveredExit   = mouseX > bx2 && mouseX < bx2 + bw && mouseY > by2 && mouseY < by2 + bh;

  // Replay button
  goPulse += 0.08;
  const pulseScale = 1 + 0.03 * sin(goPulse);
  push();
  translate(bx1 + bw/2, by1 + bh/2);
  scale(hoveredReplay ? 1.06 : pulseScale);
  drawButton(-bw/2, -bh/2, bw, bh, hoveredReplay, "#3a86ff", "Replay  (R)");
  pop();

  // Exit button
  drawButton(bx2, by2, bw, bh, hoveredExit, "#ef476f", "Exit  (Esc)");
}

function drawButton(x, y, w, h, hovered, baseColor, label) {
  push();
  noStroke();
  // base
  fill(hovered ? color(0,0,0,180) : color(0,0,0,140));
  rect(x+2, y+6, w, h, 14); // drop shadow
  fill(baseColor);
  rect(x, y, w, h, 14);
  // glossy top
  fill(255, 70);
  rect(x, y, w, h*0.45, 14, 14, 0, 0);

  // label
  fill(255);
  textSize(22);
  text(label, x + w/4, y + h/2 + 1);
  pop();
}

function drawVignette() {
  // soft vignette
  const steps = 16;
  noFill();
  for (let i = 0; i < steps; i++) {
    const a = map(i, 0, steps-1, 0, 120);
    stroke(0, a);
    rect(0 + i, 0 + i, width - 2*i, height - 2*i, 18);
  }
}

function gameOverButtons(panelW, panelH, panelX, panelY) {
  // Centered vertical stack near the bottom of the panel
  const w = 220, h = 54, gap = 18, bottomMargin = 24;
  const cx = panelX + panelW / 2;
  const panelTop = panelY - panelH / 2;
  const panelBottom = panelTop + panelH;

  const totalButtonsH = h * 2 + gap;
  const yStart = panelBottom - bottomMargin - totalButtonsH;

  const bx1 = cx - w / 2;
  const by1 = yStart;

  const bx2 = cx - w / 2;
  const by2 = yStart + h + gap;

  return { bx1, by1, bw: w, bh: h, bx2, by2 };
}


// --- Entities ---
function addItem() {
  const t = random() < 0.15 ? "🪨"
          : (random() < 0.5 ? "🥗" : (random() < 0.5 ? "🍎" : "☕"));
  items.push({ x: random(16, width - 16), y: -16, t, v: 1.4 + random(1.6) });
}

function spawnBurst(x, y, hex) {
  for (let i = 0; i < 14; i++) {
    particles.push({
      x, y,
      vx: random(-2.8, 2.8),
      vy: random(-3.4, -0.6),
      r: random(5, 10),
      c: hex,
      a: 255
    });
  }
}

function updateParticles() {
  noStroke();
  for (let p of particles) {
    fill(hexToRGB(p.c, p.a));
    ellipse(p.x, p.y, p.r);
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.07;      // gravity
    p.r *= 0.985;
    p.a *= 0.96;
  }
  particles = particles.filter(p => p.a > 8 && p.r > 1);
}

function spawnConfetti(n = 120) {
  confetti = [];
  const palette = ["#ffbe0b","#fb5607","#ff006e","#8338ec","#3a86ff","#06d6a0","#ffd166"];
  for (let i = 0; i < n; i++) {
    confetti.push({
      x: random(width*0.2, width*0.8),
      y: random(-height*0.3, -20),
      vx: random(-1, 1),
      vy: random(3, 6),
      s: random(6, 12),
      rot: random(TWO_PI),
      vr: random(-0.12, 0.12),
      c: random(palette),
      a: 255
    });
  }
}
function updateConfetti() {
  noStroke();
  for (let c of confetti) {
    push();
    translate(c.x, c.y);
    rotate(c.rot);
    fill(hexToRGB(c.c, c.a));
    rectMode(CENTER);
    rect(0, 0, c.s, c.s * 0.5, 2);
    pop();

    c.x += c.vx;
    c.y += c.vy;
    c.rot += c.vr;
    c.vy += 0.03; // gentle gravity
    c.a *= 0.995;
  }
  confetti = confetti.filter(c => c.y < height + 40 && c.a > 12);
}

// --- Utils ---
function setGradient(x, y, w, h, c1, c2) {
  noFill();
  for (let i = 0; i < h; i++) {
    const t = map(i, 0, h, 0, 1);
    const c = lerpColor(c1, c2, t);
    stroke(c);
    line(x, y + i, x + w, y + i);
  }
}
function hexToRGB(hex, a=255) {
  const c = color(hex);
  return color(red(c), green(c), blue(c), a);
}
function windowResized() {
  if (!cnv) return;
  resizeCanvas(windowWidth, windowHeight);
  if (sisters) sisters.y = height - 110;
}
