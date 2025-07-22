const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game state
let gameState = "menu"; // 'menu', 'playing', 'gameOver', 'win'
let score = 0;
let lives = 3;
let level = 1;
let gameSpeed = 1;

// Game objects
let player;
let bullets = [];
let enemyBullets = [];
let invaders = [];
let powerUps = [];
let particles = [];
let shields = [];
let stars = [];
let boss = null;
let mouseX = 0; // Mouse position for control
let keys = {};
let mouse = { x: 0, y: 0, clicked: false };

// New game features
let combo = 0;
let maxCombo = 0;
let weaponType = "normal"; // 'normal', 'double', 'laser', 'spread'
let weaponTimer = 0;
let highScore = localStorage.getItem("spaceInvadersHighScore") || 0;
let soundEnabled = true;
let musicEnabled = true;

// Audio Context
let audioContext = null;

// Game settings
const playerWidth = 50;
const playerHeight = 30;
const playerSpeed = 7;

const bulletWidth = 5;
const bulletHeight = 15;
const bulletSpeed = 10;

const invaderWidth = 40;
const invaderHeight = 30;
let invaderSpeed = 1;
const invaderRows = 5;
const invaderCols = 10;
const invaderGap = 10;
let invaderDirection = 1;
let invadersMoveDown = false;
let invaderShootChance = 0.001; // Chance per frame per invader

// Boss settings
const bossWidth = 120;
const bossHeight = 80;
const bossSpeed = 2;

// Shield settings
const shieldWidth = 80;
const shieldHeight = 60;
const shieldsCount = 4;

// Audio
const backgroundMusic = document.getElementById("backgroundMusic");
const shootSound = document.getElementById("shootSound");
const explosionSound = document.getElementById("explosionSound");
const powerupSound = document.getElementById("powerupSound");
const bossMusic = document.getElementById("bossMusic");
const gameOverSound = document.getElementById("gameOverSound");
const levelCompleteSound = document.getElementById("levelCompleteSound");

// Enhanced Audio System
function createAudioContext() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  return audioContext;
}

function playSound(type, volume = 0.3) {
  if (!soundEnabled) return;

  const audioContext = createAudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.5
  );

  switch (type) {
    case "shoot":
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        400,
        audioContext.currentTime + 0.1
      );
      oscillator.type = "square";
      break;
    case "explosion":
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        50,
        audioContext.currentTime + 0.3
      );
      oscillator.type = "sawtooth";
      break;
    case "powerup":
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
      oscillator.type = "sine";
      break;
    case "hit":
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        100,
        audioContext.currentTime + 0.1
      );
      oscillator.type = "triangle";
      break;
  }

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

// Initialize Web Audio API
function initAudio() {
  if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log("Web Audio API initialized successfully");
    } catch (error) {
      console.log("Could not initialize Web Audio API:", error);
    }
  }
}

function playBackgroundMusic() {
  if (!musicEnabled) return;

  // Generate procedural background music
  const audioContext = createAudioContext();
  const playTone = (freq, duration, delay = 0) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.frequency.value = freq;
    osc.type = "sine";

    gain.gain.setValueAtTime(0.05, audioContext.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + delay + duration
    );

    osc.start(audioContext.currentTime + delay);
    osc.stop(audioContext.currentTime + delay + duration);
  };

  // Play ambient space music
  const playAmbientLoop = () => {
    const notes = [220, 246.94, 261.63, 293.66, 329.63]; // A, B, C, D, E
    notes.forEach((note, i) => {
      playTone(note, 2, i * 0.5);
      playTone(note * 0.5, 4, i * 0.5); // Bass
    });

    setTimeout(playAmbientLoop, 8000);
  };

  setTimeout(playAmbientLoop, 1000);
}

// UI Elements
const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");
const levelElement = document.getElementById("level");
const startMenu = document.getElementById("startMenu");
const gameOverMenu = document.getElementById("gameOverMenu");
const winMenu = document.getElementById("winMenu");

// Player class
class Player {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.shootCooldown = 0;
  }

  draw() {
    // Draw spaceship with realistic design
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // Main body gradient
    const bodyGradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x,
      this.y + this.height
    );
    bodyGradient.addColorStop(0, "#00ff41");
    bodyGradient.addColorStop(0.3, "#00cc33");
    bodyGradient.addColorStop(0.7, "#008822");
    bodyGradient.addColorStop(1, "#004411");

    // Draw main hull
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.moveTo(centerX, this.y); // Top point
    ctx.lineTo(this.x + this.width * 0.8, this.y + this.height); // Bottom right
    ctx.lineTo(this.x + this.width * 0.6, this.y + this.height * 0.8); // Inner right
    ctx.lineTo(this.x + this.width * 0.4, this.y + this.height * 0.8); // Inner left
    ctx.lineTo(this.x + this.width * 0.2, this.y + this.height); // Bottom left
    ctx.closePath();
    ctx.fill();

    // Engine glow effect
    const engineGradient = ctx.createRadialGradient(
      centerX,
      this.y + this.height,
      5,
      centerX,
      this.y + this.height,
      15
    );
    engineGradient.addColorStop(0, "rgba(0, 150, 255, 0.8)");
    engineGradient.addColorStop(1, "rgba(0, 150, 255, 0)");

    ctx.fillStyle = engineGradient;
    ctx.fillRect(centerX - 15, this.y + this.height, 30, 10);

    // Cockpit
    const cockpitGradient = ctx.createRadialGradient(
      centerX,
      this.y + 10,
      2,
      centerX,
      this.y + 10,
      8
    );
    cockpitGradient.addColorStop(0, "#00ffff");
    cockpitGradient.addColorStop(0.5, "#0088cc");
    cockpitGradient.addColorStop(1, "#004466");

    ctx.fillStyle = cockpitGradient;
    ctx.beginPath();
    ctx.arc(centerX, this.y + 10, 8, 0, Math.PI * 2);
    ctx.fill();

    // Wing details
    ctx.fillStyle = "#00aa22";
    ctx.fillRect(this.x, centerY, 10, 8);
    ctx.fillRect(this.x + this.width - 10, centerY, 10, 8);

    // Weapon mounts
    if (weaponType !== "normal") {
      ctx.fillStyle = "#ffaa00";
      ctx.fillRect(this.x + 5, this.y + 5, 4, 15);
      ctx.fillRect(this.x + this.width - 9, this.y + 5, 4, 15);
    }
  }

  update() {
    // Mouse control using mouseX from event listeners
    if (mouseX > 0 && mouseX < canvas.width) {
      const targetX = mouseX - this.width / 2;
      const distance = targetX - this.x;
      this.x += distance * 0.1; // Smooth following
    }

    // Keyboard control
    if (keys["ArrowLeft"] && this.x > 0) {
      this.x -= playerSpeed;
    }
    if (keys["ArrowRight"] && this.x < canvas.width - this.width) {
      this.x += playerSpeed;
    }

    // Clamp to screen bounds
    this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));

    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }

    this.draw();
  }

  shoot() {
    if (this.shootCooldown === 0) {
      const bulletX = this.x + this.width / 2 - bulletWidth / 2;
      const bulletY = this.y;

      switch (weaponType) {
        case "normal":
          bullets.push(
            new Bullet(
              bulletX,
              bulletY,
              bulletWidth,
              bulletHeight,
              "#ff4444",
              bulletSpeed
            )
          );
          playSound("shoot", 0.2);
          break;
        case "double":
          bullets.push(
            new Bullet(
              bulletX - 10,
              bulletY,
              bulletWidth,
              bulletHeight,
              "#ff4444",
              bulletSpeed
            )
          );
          bullets.push(
            new Bullet(
              bulletX + 10,
              bulletY,
              bulletWidth,
              bulletHeight,
              "#ff4444",
              bulletSpeed
            )
          );
          playSound("shoot", 0.3);
          break;
        case "laser":
          bullets.push(
            new LaserBullet(
              bulletX,
              bulletY,
              bulletWidth * 3,
              bulletHeight * 4,
              "#00ff00",
              bulletSpeed * 1.5
            )
          );
          playSound("shoot", 0.4);
          break;
        case "spread":
          for (let i = -2; i <= 2; i++) {
            const angle = i * 0.3;
            bullets.push(
              new SpreadBullet(
                bulletX,
                bulletY,
                bulletWidth,
                bulletHeight,
                "#ffff00",
                bulletSpeed,
                angle
              )
            );
          }
          playSound("shoot", 0.5);
          break;
      }

      this.shootCooldown = weaponType === "laser" ? 20 : 10; // Cooldown frames
    }
  }
}

// Bullet class
class Bullet {
  constructor(x, y, width, height, color, speed) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.speed = speed;
  }

  draw() {
    // Draw bullet with glow effect
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;
  }

  update() {
    this.y -= this.speed;
    this.draw();
  }
}

// Invader class
class Invader {
  constructor(x, y, width, height, color, points = 10) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.points = points;
    this.animFrame = 0;
  }

  draw() {
    ctx.save();

    // Create pulsing glow effect
    const pulseIntensity = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;

    // Shadow/glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;

    // Main body (oval shaped)
    ctx.fillStyle = this.color;
    ctx.globalAlpha = pulseIntensity;

    // Draw alien body
    ctx.beginPath();
    ctx.ellipse(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width * 0.4,
      this.height * 0.3,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw alien head
    ctx.beginPath();
    ctx.ellipse(
      this.x + this.width / 2,
      this.y + this.height * 0.3,
      this.width * 0.3,
      this.height * 0.2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw eyes (glowing)
    ctx.fillStyle = "#ff0000";
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ff0000";

    // Left eye
    ctx.beginPath();
    ctx.arc(
      this.x + this.width * 0.35,
      this.y + this.height * 0.25,
      3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Right eye
    ctx.beginPath();
    ctx.arc(
      this.x + this.width * 0.65,
      this.y + this.height * 0.25,
      3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw tentacles/legs
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = pulseIntensity;
    ctx.shadowBlur = 5;
    ctx.shadowColor = this.color;

    for (let i = 0; i < 4; i++) {
      const legX = this.x + (this.width / 5) * (i + 1);
      const legY = this.y + this.height * 0.6;
      const legEndY = this.y + this.height * 0.9;
      const wave = Math.sin(Date.now() * 0.01 + i) * 3;

      ctx.beginPath();
      ctx.moveTo(legX, legY);
      ctx.lineTo(legX + wave, legEndY);
      ctx.stroke();
    }

    ctx.restore();
  }

  update() {
    this.x += invaderSpeed * invaderDirection * gameSpeed;
    this.draw();
  }
}

// PowerUp class
class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.type = type; // 'rapid', 'life', 'points', 'double', 'laser', 'spread', 'shield'
    this.speed = 2;
  }

  draw() {
    let color;
    switch (this.type) {
      case "rapid":
        color = "#ffff00";
        break;
      case "life":
        color = "#ff00ff";
        break;
      case "points":
        color = "#00ffff";
        break;
      case "double":
        color = "#ff8800";
        break;
      case "laser":
        color = "#00ff00";
        break;
      case "spread":
        color = "#8800ff";
        break;
      case "shield":
        color = "#0088ff";
        break;
    }

    ctx.save();

    // Create rotating and pulsing effect
    const rotation = Date.now() * 0.005;
    const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;

    // Glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;

    // Translate to center for rotation
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(rotation);

    // Draw outer glow ring
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2 + 5, 0, Math.PI * 2);
    ctx.stroke();

    // Draw main power-up body (hexagon)
    ctx.fillStyle = color;
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = Math.cos(angle) * (this.width / 2);
      const y = Math.sin(angle) * (this.height / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Draw inner bright core
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 4, 0, Math.PI * 2);
    ctx.fill();

    // Reset transformation
    ctx.rotate(-rotation);
    ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));

    // Draw symbol
    ctx.fillStyle = "#000";
    ctx.globalAlpha = 1;
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.shadowBlur = 0;

    let symbol;
    switch (this.type) {
      case "rapid":
        symbol = "⚡";
        break;
      case "life":
        symbol = "❤";
        break;
      case "points":
        symbol = "★";
        break;
      case "double":
        symbol = "⚆";
        break;
      case "laser":
        symbol = "▲";
        break;
      case "spread":
        symbol = "◆";
        break;
      case "shield":
        symbol = "🛡";
        break;
    }
    ctx.fillText(symbol, this.x + this.width / 2, this.y + this.height / 2 + 4);

    ctx.restore();
  }

  update() {
    this.y += this.speed;
    this.draw();
  }
}

// Particle class
class Particle {
  constructor(x, y, vx, vy, color, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = Math.random() * 4 + 2;
    this.gravity = 0.1;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity; // Add gravity effect
    this.rotation += this.rotationSpeed;
    this.life--;

    // Fade out and shrink over time
    const alpha = this.life / this.maxLife;
    const currentSize = this.size * alpha;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Draw particle with glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;

    // Draw as a diamond/star shape
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const x = Math.cos(angle) * currentSize;
      const y = Math.sin(angle) * currentSize;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

// Laser Bullet Class (more powerful)
class LaserBullet {
  constructor(x, y, width, height, color, speed) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.speed = speed;
    this.damage = 3; // More damage than normal bullets
    this.glowIntensity = 0;
  }

  update() {
    this.y -= this.speed;
    this.glowIntensity = (this.glowIntensity + 0.2) % (Math.PI * 2);
  }

  draw() {
    const glow = Math.sin(this.glowIntensity) * 0.3 + 0.7;

    // Create laser beam effect
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.color;

    // Draw laser beam
    ctx.fillStyle = this.color;
    ctx.globalAlpha = glow;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw inner bright core
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.8;
    ctx.fillRect(
      this.x + this.width * 0.3,
      this.y,
      this.width * 0.4,
      this.height
    );

    ctx.restore();
  }
}

// SpreadBullet class
class SpreadBullet extends Bullet {
  constructor(x, y, width, height, color, speed, angle) {
    super(x, y, width, height, color, speed);
    this.angle = angle;
    this.vx = Math.sin(angle) * speed;
    this.vy = -Math.cos(angle) * speed;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.draw();
  }
}

// EnemyBullet class
class EnemyBullet extends Bullet {
  constructor(x, y, width, height, color, speed) {
    super(x, y, width, height, color, speed);
  }

  update() {
    this.y += this.speed; // Move down instead of up
    this.draw();
  }
}

// Boss class
class Boss {
  constructor(x, y, width, height, color, health) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.health = health;
    this.maxHealth = health;
    this.direction = 1;
    this.shootCooldown = 0;
    this.animFrame = 0;
  }

  draw() {
    this.animFrame += 0.1;
    const pulse = Math.sin(this.animFrame) * 5;

    // Draw boss body with gradient
    const gradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x + this.width,
      this.y + this.height
    );
    gradient.addColorStop(0, "#ff0066");
    gradient.addColorStop(0.5, "#ff3399");
    gradient.addColorStop(1, "#cc0044");

    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, this.y + pulse, this.width, this.height);

    // Draw eyes
    ctx.fillStyle = "#ffff00";
    ctx.fillRect(this.x + 20, this.y + 20 + pulse, 15, 15);
    ctx.fillRect(this.x + 85, this.y + 20 + pulse, 15, 15);

    // Draw health bar
    const healthBarWidth = this.width;
    const healthBarHeight = 8;
    const healthPercentage = this.health / this.maxHealth;

    ctx.fillStyle = "#ff0000";
    ctx.fillRect(this.x, this.y - 15, healthBarWidth, healthBarHeight);
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(
      this.x,
      this.y - 15,
      healthBarWidth * healthPercentage,
      healthBarHeight
    );
  }

  update() {
    // Move horizontally
    this.x += bossSpeed * this.direction;
    if (this.x <= 0 || this.x + this.width >= canvas.width) {
      this.direction *= -1;
    }

    // Shooting pattern
    if (this.shootCooldown <= 0) {
      // Triple shot
      for (let i = 0; i < 3; i++) {
        const bulletX = this.x + (this.width / 4) * (i + 1);
        const bulletY = this.y + this.height;
        enemyBullets.push(
          new EnemyBullet(bulletX, bulletY, 8, 12, "#ff00ff", 5)
        );
      }
      this.shootCooldown = 60; // 1 second at 60fps
    }
    this.shootCooldown--;

    this.draw();
  }
}

// Shield class
class Shield {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.blocks = [];
    this.createBlocks();
  }

  createBlocks() {
    const blockSize = 4;
    for (let row = 0; row < this.height / blockSize; row++) {
      this.blocks[row] = [];
      for (let col = 0; col < this.width / blockSize; col++) {
        // Create shield shape
        const centerX = this.width / blockSize / 2;
        const centerY = this.height / blockSize / 2;
        const distanceFromCenter = Math.sqrt(
          (col - centerX) ** 2 + (row - centerY) ** 2
        );

        if (distanceFromCenter < 8 && row < centerY + 3) {
          this.blocks[row][col] = true;
        }
      }
    }
  }

  draw() {
    const blockSize = 4;
    ctx.fillStyle = "#00ff00";
    for (let row = 0; row < this.blocks.length; row++) {
      for (let col = 0; col < this.blocks[row].length; col++) {
        if (this.blocks[row][col]) {
          ctx.fillRect(
            this.x + col * blockSize,
            this.y + row * blockSize,
            blockSize,
            blockSize
          );
        }
      }
    }
  }

  checkCollision(bulletX, bulletY, bulletWidth, bulletHeight) {
    const blockSize = 4;
    for (let row = 0; row < this.blocks.length; row++) {
      for (let col = 0; col < this.blocks[row].length; col++) {
        if (this.blocks[row][col]) {
          const blockX = this.x + col * blockSize;
          const blockY = this.y + row * blockSize;

          if (
            bulletX < blockX + blockSize &&
            bulletX + bulletWidth > blockX &&
            bulletY < blockY + blockSize &&
            bulletY + bulletHeight > blockY
          ) {
            // Destroy blocks around impact
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const r = row + dr;
                const c = col + dc;
                if (
                  r >= 0 &&
                  r < this.blocks.length &&
                  c >= 0 &&
                  c < this.blocks[r].length
                ) {
                  this.blocks[r][c] = false;
                }
              }
            }
            return true;
          }
        }
      }
    }
    return false;
  }
}

// Star class for background
class Star {
  constructor(x, y, speed, size) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.size = size;
  }

  update() {
    this.y += this.speed;
    if (this.y > canvas.height) {
      this.y = 0;
      this.x = Math.random() * canvas.width;
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

// Initialize game
function init() {
  const playerX = (canvas.width - playerWidth) / 2;
  const playerY = canvas.height - playerHeight - 20;
  player = new Player(playerX, playerY, playerWidth, playerHeight, "lime");

  bullets = [];
  enemyBullets = [];
  powerUps = [];
  particles = [];
  boss = null;
  combo = 0;
  weaponType = "normal";
  weaponTimer = 0;

  createInvaders();
  createShields();
  createStars();
  updateUI();
}

// Create invaders
function createInvaders() {
  invaders = [];
  invaderSpeed = 1 + (level - 1) * 0.5; // Increase speed each level
  invaderShootChance = 0.001 + (level - 1) * 0.0005; // Increase shooting frequency

  // Every 5th level is a boss level
  if (level % 5 === 0) {
    const bossX = (canvas.width - bossWidth) / 2;
    const bossY = 50;
    const bossHealth = 50 + (level / 5) * 20;
    boss = new Boss(bossX, bossY, bossWidth, bossHeight, "#ff0066", bossHealth);
    return;
  }

  for (let row = 0; row < invaderRows; row++) {
    for (let col = 0; col < invaderCols; col++) {
      const x = col * (invaderWidth + invaderGap) + 50;
      const y = row * (invaderHeight + invaderGap) + 50;

      // Different colors and points for different rows
      let color, points;
      if (row < 2) {
        color = "#ff00ff"; // Top rows - most points
        points = 30;
      } else if (row < 4) {
        color = "#00ffff"; // Middle rows
        points = 20;
      } else {
        color = "#ffff00"; // Bottom row - least points
        points = 10;
      }

      invaders.push(
        new Invader(x, y, invaderWidth, invaderHeight, color, points)
      );
    }
  }
}

// Create shields
function createShields() {
  shields = [];
  const shieldSpacing = canvas.width / (shieldsCount + 1);

  for (let i = 0; i < shieldsCount; i++) {
    const x = shieldSpacing * (i + 1) - shieldWidth / 2;
    const y = canvas.height - 200;
    shields.push(new Shield(x, y, shieldWidth, shieldHeight));
  }
}

// Create stars
function createStars() {
  stars = [];
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const speed = Math.random() * 2 + 0.5;
    const size = Math.random() * 2 + 1;
    stars.push(new Star(x, y, speed, size));
  }
}

// Create explosion particles
function createExplosion(x, y, color) {
  for (let i = 0; i < 10; i++) {
    const vx = (Math.random() - 0.5) * 8;
    const vy = (Math.random() - 0.5) * 8;
    particles.push(new Particle(x, y, vx, vy, color, 30));
  }
}

// Spawn power-ups randomly
function spawnPowerUp() {
  if (Math.random() < 0.15) {
    // 15% chance
    const x = Math.random() * (canvas.width - 20);
    const types = [
      "rapid",
      "life",
      "points",
      "double",
      "laser",
      "spread",
      "shield",
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    powerUps.push(new PowerUp(x, 0, type));
  }
}

// Update weapon timer
function updateWeaponTimer() {
  if (weaponTimer > 0) {
    weaponTimer--;
    if (weaponTimer <= 0) {
      weaponType = "normal";
    }
  }
}

// Update combo system
function updateCombo(points) {
  combo++;
  maxCombo = Math.max(maxCombo, combo);

  // Bonus points for combo
  const bonusPoints = Math.floor(combo / 5) * 10;
  score += points + bonusPoints;

  // Update high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("spaceInvadersHighScore", highScore);
  }
}

function resetCombo() {
  combo = 0;
}

// Update UI
function updateUI() {
  scoreElement.textContent = `Score: ${score}`;
  livesElement.textContent = `Lives: ${lives}`;
  levelElement.textContent = `Level: ${level}`;

  // Add combo and weapon info to score element
  let displayText = `Score: ${score}`;
  if (combo > 0) {
    displayText += ` | Combo: x${combo}`;
  }
  if (weaponType !== "normal") {
    displayText += ` | Weapon: ${weaponType.toUpperCase()}`;
  }
  if (highScore > 0) {
    displayText += ` | High: ${highScore}`;
  }

  scoreElement.innerHTML = displayText;
}

// Game loop
// Procedural background music system
let proceduralMusic = null;
let musicGain = null;

function startBackgroundMusic() {
  if (!audioContext || proceduralMusic) return;

  try {
    // Create music generator
    proceduralMusic = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();
    musicGain = audioContext.createGain();

    // Set up filter
    filter.type = "lowpass";
    filter.frequency.value = 800;
    filter.Q.value = 1;

    // Set up gain (volume)
    musicGain.gain.value = 0.05; // Very quiet background music

    // Connect the audio graph
    proceduralMusic.connect(filter);
    filter.connect(musicGain);
    musicGain.connect(audioContext.destination);

    // Generate ambient sci-fi music
    proceduralMusic.type = "sine";
    proceduralMusic.frequency.value = 60; // Low bass tone

    // Add frequency modulation
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.1; // Very slow modulation
    lfoGain.gain.value = 20; // Modulation depth

    lfo.connect(lfoGain);
    lfoGain.connect(proceduralMusic.frequency);

    proceduralMusic.start();
    lfo.start();
  } catch (error) {
    console.log("Could not start background music:", error);
  }
}

function stopBackgroundMusic() {
  if (proceduralMusic) {
    proceduralMusic.stop();
    proceduralMusic = null;
    musicGain = null;
  }
}

function gameLoop() {
  // Always clear and continue loop, but only update game when playing
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Show stars even in menu
  if (stars && stars.length > 0) {
    stars.forEach((star) => star.update());
  }

  if (gameState === "playing") {
    // Update weapon timer
    updateWeaponTimer();

    // Update player
    player.update();

    // Update bullets
    bullets.forEach((bullet, index) => {
      bullet.update();
      if (bullet.y < 0 || bullet.x < 0 || bullet.x > canvas.width) {
        bullets.splice(index, 1);
      }
    });

    // Update enemy bullets
    enemyBullets.forEach((bullet, index) => {
      bullet.update();
      if (bullet.y > canvas.height) {
        enemyBullets.splice(index, 1);
      }
    });

    // Update boss or invaders
    if (boss) {
      boss.update();
    } else {
      // Update invaders movement
      invadersMoveDown = false;
      invaders.forEach((invader) => {
        if (
          (invader.x + invader.width > canvas.width && invaderDirection > 0) ||
          (invader.x < 0 && invaderDirection < 0)
        ) {
          invaderDirection *= -1;
          invadersMoveDown = true;
        }
      });

      if (invadersMoveDown) {
        invaders.forEach((invader) => {
          invader.y += invaderHeight / 2;
        });
      }

      // Update invaders
      invaders.forEach((invader) => {
        invader.update();

        // Random enemy shooting
        if (Math.random() < invaderShootChance) {
          const bulletX = invader.x + invader.width / 2;
          const bulletY = invader.y + invader.height;
          enemyBullets.push(
            new EnemyBullet(bulletX, bulletY, 4, 8, "#ff00ff", 3)
          );
        }
      });
    }

    // Draw shields
    shields.forEach((shield) => shield.draw());

    // Update power-ups
    powerUps.forEach((powerUp, index) => {
      powerUp.update();
      if (powerUp.y > canvas.height) {
        powerUps.splice(index, 1);
      }
    });

    // Update particles
    particles.forEach((particle, index) => {
      particle.update();
      if (particle.life <= 0) {
        particles.splice(index, 1);
      }
    });

    // Collision detection - player bullets vs shields
    bullets.forEach((bullet, bulletIndex) => {
      shields.forEach((shield) => {
        if (
          shield.checkCollision(bullet.x, bullet.y, bullet.width, bullet.height)
        ) {
          bullets.splice(bulletIndex, 1);
        }
      });
    });

    // Collision detection - enemy bullets vs shields
    enemyBullets.forEach((bullet, bulletIndex) => {
      shields.forEach((shield) => {
        if (
          shield.checkCollision(bullet.x, bullet.y, bullet.width, bullet.height)
        ) {
          enemyBullets.splice(bulletIndex, 1);
        }
      });
    });

    // Collision detection - bullets vs boss
    if (boss) {
      bullets.forEach((bullet, bulletIndex) => {
        if (
          bullet.x < boss.x + boss.width &&
          bullet.x + bullet.width > boss.x &&
          bullet.y < boss.y + boss.height &&
          bullet.y + bullet.height > boss.y
        ) {
          boss.health -= weaponType === "laser" ? 3 : 1;
          updateCombo(50);
          createExplosion(bullet.x, bullet.y, "#ff0066");

          explosionSound.currentTime = 0;
          explosionSound.play().catch((e) => {});

          bullets.splice(bulletIndex, 1);

          if (boss.health <= 0) {
            updateCombo(500); // Bonus for defeating boss
            createExplosion(
              boss.x + boss.width / 2,
              boss.y + boss.height / 2,
              "#ff0066"
            );
            boss = null;

            // Chance to spawn multiple power-ups
            for (let i = 0; i < 3; i++) {
              spawnPowerUp();
            }
          }

          updateUI();
        }
      });
    }

    // Collision detection - bullets vs invaders
    bullets.forEach((bullet, bulletIndex) => {
      invaders.forEach((invader, invaderIndex) => {
        if (
          bullet.x < invader.x + invader.width &&
          bullet.x + bullet.width > invader.x &&
          bullet.y < invader.y + invader.height &&
          bullet.y + bullet.height > invader.y
        ) {
          // Collision detected
          updateCombo(invader.points);
          createExplosion(
            invader.x + invader.width / 2,
            invader.y + invader.height / 2,
            invader.color
          );

          // Play explosion sound
          explosionSound.currentTime = 0;
          explosionSound.play().catch((e) => {});

          bullets.splice(bulletIndex, 1);
          invaders.splice(invaderIndex, 1);

          // Chance to spawn power-up
          if (Math.random() < 0.15) {
            spawnPowerUp();
          }

          updateUI();
        }
      });
    });

    // Collision detection - enemy bullets vs player
    enemyBullets.forEach((bullet, index) => {
      if (
        bullet.x < player.x + player.width &&
        bullet.x + bullet.width > player.x &&
        bullet.y < player.y + player.height &&
        bullet.y + bullet.height > player.y
      ) {
        enemyBullets.splice(index, 1);
        lives--;
        resetCombo();
        createExplosion(
          player.x + player.width / 2,
          player.y + player.height / 2,
          "#00ff41"
        );
        updateUI();
      }
    });

    // Collision detection - player vs power-ups
    powerUps.forEach((powerUp, index) => {
      if (
        powerUp.x < player.x + player.width &&
        powerUp.x + powerUp.width > player.x &&
        powerUp.y < player.y + player.height &&
        powerUp.y + powerUp.height > player.y
      ) {
        // Power-up collected
        switch (powerUp.type) {
          case "rapid":
            player.shootCooldown = Math.max(0, player.shootCooldown - 5);
            break;
          case "life":
            lives++;
            break;
          case "points":
            score += 100;
            break;
          case "double":
            weaponType = "double";
            weaponTimer = 600; // 10 seconds at 60fps
            break;
          case "laser":
            weaponType = "laser";
            weaponTimer = 450; // 7.5 seconds
            break;
          case "spread":
            weaponType = "spread";
            weaponTimer = 300; // 5 seconds
            break;
          case "shield":
            createShields(); // Restore shields
            break;
        }

        powerUps.splice(index, 1);
        updateUI();
      }
    });

    // Check for level completion
    if ((!boss && invaders.length === 0) || (boss && !boss)) {
      level++;
      gameState = "win";
      document.getElementById(
        "winScore"
      ).textContent = `Score: ${score} | Max Combo: x${maxCombo}`;
      winMenu.classList.remove("hidden");
      return;
    }

    // Check for game over conditions
    let gameOver = false;

    // Invaders reached player or lives depleted
    if (!boss) {
      invaders.forEach((invader) => {
        if (invader.y + invader.height >= player.y) {
          gameOver = true;
        }
      });
    }

    if (gameOver || lives <= 0) {
      if (!gameOver) lives--; // Only reduce life if not already game over

      if (lives <= 0) {
        gameState = "gameOver";
        document.getElementById(
          "finalScore"
        ).textContent = `Final Score: ${score} | Max Combo: x${maxCombo} | High Score: ${highScore}`;
        gameOverMenu.classList.remove("hidden");
        return;
      } else {
        resetCombo();
        // Reset invaders position if they reached player
        if (!boss) {
          invaders.forEach((invader) => {
            invader.y = Math.min(invader.y, 50);
          });
        }
      }
      updateUI();
    } // Close if gameState === 'playing'

    requestAnimationFrame(gameLoop);
  } // Close gameLoop function

  // Event listeners
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === " " && gameState === "playing") {
      e.preventDefault();
      player.shoot();
    }
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });

  // Menu event listeners
  document.getElementById("startBtn").addEventListener("click", () => {
    gameState = "playing";
    startMenu.classList.add("hidden");

    // Initialize audio with user interaction
    initAudio();

    // Start background music after a short delay
    setTimeout(() => {
      startBackgroundMusic();
    }, 100);

    init();
    gameLoop();
  });

  document.getElementById("restartBtn").addEventListener("click", () => {
    // Reset game
    score = 0;
    lives = 3;
    level = 1;
    gameSpeed = 1;
    combo = 0;
    maxCombo = 0;
    weaponType = "normal";
    weaponTimer = 0;

    // Stop current music and restart
    stopBackgroundMusic();
    setTimeout(() => {
      startBackgroundMusic();
    }, 100);

    gameState = "playing";
    gameOverMenu.classList.add("hidden");
    init();
    gameLoop();
  });

  document.getElementById("nextLevelBtn").addEventListener("click", () => {
    gameSpeed += 0.2;
    gameState = "playing";
    winMenu.classList.add("hidden");
    init();
    gameLoop();
  });

  // Mouse controls
  canvas.addEventListener("mousemove", (e) => {
    if (gameState !== "playing" || !player) return;

    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;

    // Scale mouse position to canvas coordinates
    mouseX = (mouseX / rect.width) * canvas.width;

    // Also update mouse object for compatibility
    mouse.x = mouseX;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener("click", (e) => {
    if (gameState === "playing" && player) {
      mouse.clicked = true;
      player.shoot();
      setTimeout(() => {
        mouse.clicked = false;
      }, 100);
    }
  });

  // Touch controls for mobile
  canvas.addEventListener("touchstart", (e) => {
    if (e.cancelable) e.preventDefault(); // Only prevent if cancelable
    if (gameState === "playing" && player) {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      mouseX = touch.clientX - rect.left;
      mouseX = (mouseX / rect.width) * canvas.width;

      player.targetX = mouseX - player.width / 2;
      player.targetX = Math.max(
        0,
        Math.min(canvas.width - player.width, player.targetX)
      );
      player.shoot();
    }
  });

  canvas.addEventListener("touchmove", (e) => {
    if (e.cancelable) e.preventDefault(); // Only prevent if cancelable
    if (gameState === "playing" && player) {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      mouseX = touch.clientX - rect.left;
      mouseX = (mouseX / rect.width) * canvas.width;

      player.targetX = mouseX - player.width / 2;
      player.targetX = Math.max(
        0,
        Math.min(canvas.width - player.width, player.targetX)
      );
    }
  });

  // Initialize
  updateUI();

  // Initialize stars for background
  createStars();

  // Start game loop immediately for menu rendering
  gameLoop();
}
