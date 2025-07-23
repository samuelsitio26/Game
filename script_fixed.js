const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game state
let gameState = "menu"; // 'menu', 'playing', 'gameOver', 'win'
let score = 0;
let lives = 100000000000000;
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

// New game features
let combo = 0;
let maxCombo = 0;
let weaponType = "normal"; // 'normal', 'double', 'laser', 'spread'
let weaponTimer = 0;
let highScore = localStorage.getItem("spaceInvadersHighScore") || 0;
let soundEnabled = true;
let musicEnabled = true;
let invincibilityTimer = 0; // Player invincibility after getting hit

// Audio Context
let audioContext = null;

// Settings object - HARUS DIINISIALISASI DI ATAS
let settings = {
  soundEnabled: true,
  musicEnabled: true,
  difficulty: "normal",
  graphics: "high",
  controlMode: "mouse", // 'mouse', 'keyboard', 'both'
  godMode: false,
  mouseActive: true, // New mouse control toggle
};

// Make settings globally accessible
window.settings = settings;

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
let invaderDirection = 1;
let invaderShootChance = 0.001;
const invaderRows = 5;
const invaderCols = 10;
const invaderGap = 10;
const powerUpDuration = 600;

// Boss system
let currentBoss = null;
let bossLevel = 0; // 0=no boss, 1=small, 2=medium, 3=large, 4=huge
let maxLevel = 5;

// Canvas dimensions
canvas.width = 800;
canvas.height = 600;

// Boss settings
const bossWidth = 120;
const bossHeight = 80;
const bossSpeed = 2;

// Shield settings
const shieldWidth = 80;
const shieldHeight = 60;
const shieldsCount = 4;

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

// Enhanced Audio System
function playSound(frequency, waveType = "sine", volume = 0.1, duration = 0.2) {
  if (!settings.soundEnabled || !audioContext) return;

  try {
    // Validate all parameters
    if (!frequency || typeof frequency !== "number" || !isFinite(frequency)) {
      frequency = 440; // Default frequency
    }
    if (!volume || typeof volume !== "number" || !isFinite(volume)) {
      volume = 0.1; // Default volume
    }
    if (!duration || typeof duration !== "number" || !isFinite(duration)) {
      duration = 0.2; // Default duration
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Validate and clamp parameters
    const safeVolume = Math.max(0.001, Math.min(1, volume));
    const safeDuration = Math.max(0.01, Math.min(5, duration));
    const safeFrequency = Math.max(20, Math.min(20000, frequency));

    oscillator.frequency.setValueAtTime(
      safeFrequency,
      audioContext.currentTime
    );
    oscillator.type = waveType;

    gainNode.gain.setValueAtTime(safeVolume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + safeDuration
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + safeDuration);
  } catch (error) {
    console.log("Audio error:", error);
  }
}

// Background Music System
let backgroundMusic = null;
let musicInitialized = false;
let musicPreloaded = false;
let musicAllowed = false; // Flag to control when music is actually allowed to play

function initBackgroundMusic() {
  console.log("initBackgroundMusic called");
  if (!musicInitialized) {
    backgroundMusic = document.getElementById("backgroundMusic");
    console.log("backgroundMusic element:", backgroundMusic);

    if (backgroundMusic) {
      backgroundMusic.volume = 0.3; // Set volume to 30%
      backgroundMusic.loop = true;

      // Preload the music completely
      backgroundMusic.addEventListener("loadstart", () => {
        console.log("Background music loading started");
      });

      backgroundMusic.addEventListener("loadeddata", () => {
        console.log("Background music data loaded");
        musicPreloaded = true;
      });

      // Handle music loading and error events
      backgroundMusic.addEventListener("canplaythrough", () => {
        console.log("Background music ready to play");
        musicPreloaded = true;
        // Remove auto-start to prevent unwanted music playback
      });

      backgroundMusic.addEventListener("error", (e) => {
        console.log("Background music error:", e);
        console.log("Error details:", e.target.error);
      });

      // Remove aggressive auto-resume that causes audio leaks
      // backgroundMusic.addEventListener("pause", () => { ... });

      // Test if file exists
      backgroundMusic.addEventListener("loadedmetadata", () => {
        console.log(
          "Music file loaded successfully, duration:",
          backgroundMusic.duration
        );
      });

      // Preload the music immediately
      console.log("Starting music load...");
      backgroundMusic.load();
      musicInitialized = true;
    } else {
      console.log("backgroundMusic element not found!");
    }
  }
}

function startBackgroundMusic() {
  console.log("startBackgroundMusic called");
  console.log("backgroundMusic:", backgroundMusic);
  console.log("settings.musicEnabled:", settings.musicEnabled);
  console.log("musicAllowed:", musicAllowed);

  // Strict control: only play if explicitly allowed and enabled
  if (!backgroundMusic || !settings.musicEnabled || !musicAllowed) {
    console.log("Exiting: conditions not met for music playback");
    return;
  }

  try {
    // Stop any existing playback first
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    backgroundMusic.volume = 0.3;

    const playPromise = backgroundMusic.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("Background music started successfully!");
        })
        .catch((error) => {
          console.log("Could not play background music:", error);
          // NO automatic retry to prevent audio leaks
        });
    }
  } catch (error) {
    console.log("Background music start error:", error);
  }
}

function stopBackgroundMusic() {
  if (backgroundMusic) {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
  }
  musicAllowed = false; // Disable music playback
}

function pauseBackgroundMusic() {
  if (backgroundMusic) {
    backgroundMusic.pause();
  }
}

function resumeBackgroundMusic() {
  if (backgroundMusic && settings.musicEnabled) {
    backgroundMusic.play().catch(console.log);
  }
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
    // Skip drawing if invincible and flashing
    if (
      invincibilityTimer > 0 &&
      Math.floor(invincibilityTimer / 5) % 2 === 0
    ) {
      return; // Flash effect - don't draw every few frames
    }

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
    // Control based on settings
    const controlMode = settings.controlMode || "mouse";
    const mouseActive = settings.mouseActive !== false; // Default to true

    if ((controlMode === "mouse" || controlMode === "both") && mouseActive) {
      // Mouse control using mouseX from event listeners
      if (mouseX > 0 && mouseX < canvas.width) {
        const targetX = mouseX - this.width / 2;
        const distance = targetX - this.x;
        this.x += distance * 0.1; // Smooth following
      }
    }

    if (controlMode === "keyboard" || controlMode === "both") {
      // Keyboard control
      if (keys["ArrowLeft"] && this.x > 0) {
        this.x -= playerSpeed;
      }
      if (keys["ArrowRight"] && this.x < canvas.width - this.width) {
        this.x += playerSpeed;
      }
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
          playSound(800, "square", 0.2, 0.1);
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
          playSound(900, "square", 0.3, 0.1);
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
          playSound(1200, "sine", 0.4, 0.2);
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
          playSound(700, "sawtooth", 0.3, 0.15);
          break;
      }

      this.shootCooldown = weaponType === "rapid" ? 5 : 10;
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
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }

  update() {
    this.y -= this.speed;
    this.draw();
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
    this.draw();
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
    this.velocityX = Math.sin(angle) * speed;
    this.velocityY = Math.cos(angle) * speed;
  }

  update() {
    this.x += this.velocityX;
    this.y -= this.velocityY;
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

    ctx.restore();
  }

  update() {
    this.x += invaderSpeed * invaderDirection;
    this.draw();
  }

  shoot() {
    if (Math.random() < invaderShootChance) {
      enemyBullets.push(
        new EnemyBullet(
          this.x + this.width / 2 - bulletWidth / 2,
          this.y + this.height,
          bulletWidth,
          bulletHeight,
          "#ff4444",
          3
        )
      );
    }
  }
}

// Boss class
class Boss {
  constructor(x, y, bossType) {
    this.bossType = bossType; // 1=small, 2=medium, 3=large, 4=huge

    // Boss size based on type
    switch (bossType) {
      case 1: // Small Boss
        this.width = 80;
        this.height = 60;
        this.health = 30;
        this.maxHealth = 30;
        this.speed = 2;
        this.color = "#ff6600";
        this.points = 500;
        break;
      case 2: // Medium Boss
        this.width = 120;
        this.height = 80;
        this.health = 60;
        this.maxHealth = 60;
        this.speed = 1.5;
        this.color = "#ff3300";
        this.points = 1000;
        break;
      case 3: // Large Boss
        this.width = 160;
        this.height = 100;
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 1;
        this.color = "#cc0000";
        this.points = 2000;
        break;
      case 4: // Huge Boss
        this.width = 200;
        this.height = 120;
        this.health = 150;
        this.maxHealth = 150;
        this.speed = 0.8;
        this.color = "#990000";
        this.points = 5000;
        break;
    }

    this.x = x;
    this.y = y;
    this.direction = 1;
    this.shootCooldown = 0;
    this.shootPattern = 0;
    this.isDestroyed = false;
  }

  draw() {
    // Boss body with gradient
    const gradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x,
      this.y + this.height
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(0.5, "#ffffff");
    gradient.addColorStop(1, "#000000");

    ctx.fillStyle = gradient;

    // Main body
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Boss details based on type
    ctx.fillStyle = "#ffff00";
    if (this.bossType >= 2) {
      // Eyes
      ctx.fillRect(this.x + this.width * 0.2, this.y + this.height * 0.2, 8, 8);
      ctx.fillRect(this.x + this.width * 0.7, this.y + this.height * 0.2, 8, 8);
    }

    if (this.bossType >= 3) {
      // Weapons
      ctx.fillStyle = "#666666";
      ctx.fillRect(
        this.x,
        this.y + this.height * 0.6,
        this.width * 0.1,
        this.height * 0.3
      );
      ctx.fillRect(
        this.x + this.width * 0.9,
        this.y + this.height * 0.6,
        this.width * 0.1,
        this.height * 0.3
      );
    }

    // Health bar
    const barWidth = this.width * 0.8;
    const barHeight = 6;
    const barX = this.x + this.width * 0.1;
    const barY = this.y - 15;

    // Background
    ctx.fillStyle = "#333333";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle =
      healthPercent > 0.6
        ? "#00ff00"
        : healthPercent > 0.3
        ? "#ffff00"
        : "#ff0000";
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Health text
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      `Boss ${this.bossType} - ${this.health}/${this.maxHealth}`,
      this.x + this.width / 2,
      barY - 3
    );
  }

  update() {
    // Movement
    this.x += this.speed * this.direction;

    // Bounce off walls
    if (this.x <= 0 || this.x + this.width >= canvas.width) {
      this.direction *= -1;
      this.y += 20;
    }

    // Shooting patterns
    this.shootCooldown--;
    if (this.shootCooldown <= 0) {
      this.shoot();
      this.shootCooldown = 60 - this.bossType * 10; // Faster shooting for higher boss types
    }

    this.draw();
  }

  shoot() {
    const centerX = this.x + this.width / 2;
    const bottomY = this.y + this.height;

    switch (this.bossType) {
      case 1: // Single shot
        enemyBullets.push(
          new EnemyBullet(centerX - 2, bottomY, 4, 10, "#ff6600", 4)
        );
        break;
      case 2: // Double shot
        enemyBullets.push(
          new EnemyBullet(centerX - 15, bottomY, 4, 10, "#ff3300", 4)
        );
        enemyBullets.push(
          new EnemyBullet(centerX + 15, bottomY, 4, 10, "#ff3300", 4)
        );
        break;
      case 3: // Triple shot
        enemyBullets.push(
          new EnemyBullet(centerX - 20, bottomY, 4, 10, "#cc0000", 5)
        );
        enemyBullets.push(
          new EnemyBullet(centerX, bottomY, 4, 10, "#cc0000", 5)
        );
        enemyBullets.push(
          new EnemyBullet(centerX + 20, bottomY, 4, 10, "#cc0000", 5)
        );
        break;
      case 4: // Spread pattern
        for (let i = -2; i <= 2; i++) {
          enemyBullets.push(
            new EnemyBullet(centerX + i * 25, bottomY, 4, 10, "#990000", 6)
          );
        }
        break;
    }

    playSound(400, "square", 0.2, 0.3);
  }

  takeDamage(damage = 1) {
    this.health -= damage;
    if (this.health <= 0) {
      this.isDestroyed = true;
      score += this.points;
      createExplosion(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.color
      );
      playSound(300, "sawtooth", 0.5, 1);
      return true;
    }
    return false;
  }
}

// Enemy Bullet class
class EnemyBullet extends Bullet {
  constructor(x, y, width, height, color, speed) {
    super(x, y, width, height, color, speed);
  }

  update() {
    this.y += this.speed; // Move down instead of up
    this.draw();
  }
}

// Initialize complete game
function initGame() {
  // Initialize player
  const playerX = (canvas.width - playerWidth) / 2;
  const playerY = canvas.height - playerHeight - 20;
  player = new Player(playerX, playerY, playerWidth, playerHeight, "lime");

  // Reset game arrays
  bullets = [];
  enemyBullets = [];
  powerUps = [];
  particles = [];
  invaders = [];

  // Reset game variables
  combo = 0;
  weaponType = "normal";
  weaponTimer = 0;
  invincibilityTimer = 0;

  // Create invaders
  createInvaders();

  console.log("Game initialized with", invaders.length, "invaders");
}

// Create invaders formation
function createInvaders() {
  invaders = [];
  currentBoss = null;

  // Level system: 1-4 boss levels, 5 final alien swarm
  if (level <= 4) {
    // Boss levels 1-4
    bossLevel = level;
    const bossX = (canvas.width - (80 + level * 40)) / 2;
    const bossY = 50;
    currentBoss = new Boss(bossX, bossY, bossLevel);

    // Add some support invaders for boss levels
    const supportCount = Math.min(level * 2, 8);
    const startX = 100;
    const startY = 200;

    for (let i = 0; i < supportCount; i++) {
      const x = startX + (i % 4) * (invaderWidth + invaderGap);
      const y = startY + Math.floor(i / 4) * (invaderHeight + invaderGap);
      invaders.push(
        new Invader(x, y, invaderWidth, invaderHeight, "#00aaff", 15)
      );
    }

    console.log(
      `Level ${level}: Boss ${bossLevel} created with ${supportCount} support invaders`
    );
  } else if (level === 5) {
    // Final level - only aliens, no boss
    bossLevel = 0;
    const rows = 6;
    const cols = 12;
    const startX = 50;
    const startY = 50;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * (invaderWidth + invaderGap);
        const y = startY + row * (invaderHeight + invaderGap);

        // Different colors for different rows
        let color = "#00ff00";
        let points = 10;

        switch (row) {
          case 0:
            color = "#ff4444"; // Red - top row, most points
            points = 50;
            break;
          case 1:
          case 2:
            color = "#ffff44"; // Yellow - middle rows
            points = 30;
            break;
          default:
            color = "#44ff44"; // Green - bottom rows
            points = 20;
            break;
        }

        invaders.push(
          new Invader(x, y, invaderWidth, invaderHeight, color, points)
        );
      }
    }

    console.log(`Level 5: Final alien swarm with ${invaders.length} invaders`);
  } else {
    // Game complete
    gameState = "win";
    updateHighScore();
    playSound(1000, "sine", 0.3, 2);
    setTimeout(() => {
      alert("🎉 CONGRATULATIONS! You have completed all levels! 🎉");
      gameState = "menu";
    }, 100);
    return;
  }

  invaderSpeed = 1 + (level - 1) * 0.5;
  invaderShootChance = 0.001 + (level - 1) * 0.0005;
}

// PowerUp class
class PowerUp {
  constructor(x, y, width, height, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.speed = 2;
    this.pulseTime = 0;
  }

  draw() {
    this.pulseTime += 0.1;
    const pulse = Math.sin(this.pulseTime) * 0.3 + 0.7;

    ctx.save();
    ctx.globalAlpha = pulse;

    // Different colors for different power-ups
    let color;
    let symbol;

    switch (this.type) {
      case "spread":
        color = "#ff4444";
        symbol = "⚡";
        break;
      case "rapid":
        color = "#44ff44";
        symbol = "🔥";
        break;
      case "pierce":
        color = "#4444ff";
        symbol = "💎";
        break;
      default:
        color = "#ffff44";
        symbol = "⭐";
    }

    // Draw power-up box
    ctx.fillStyle = color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw symbol
    ctx.fillStyle = "#000";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(symbol, this.x + this.width / 2, this.y + this.height / 2 + 6);

    ctx.restore();
  }

  update() {
    this.y += this.speed;
    this.draw();
  }
}

// Check collision between two rectangles
function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

// Create explosion particles
function createExplosion(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const speed = Math.random() * 3 + 2;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: color,
      life: 30,
      maxLife: 30,
    });
  }
}

// Update particles
function updateParticles() {
  particles.forEach((particle, index) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life--;

    const alpha = particle.life / particle.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, 3, 3);
    ctx.restore();

    if (particle.life <= 0) {
      particles.splice(index, 1);
    }
  });
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

    // Reset star when it goes off screen
    if (this.y > canvas.height) {
      this.y = 0;
      this.x = Math.random() * canvas.width;
    }

    // Draw star
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.7})`;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

// Create stars
function createStars() {
  stars = [];
  for (let i = 0; i < 50; i++) {
    stars.push(
      new Star(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 2 + 1,
        Math.random() * 2 + 1
      )
    );
  }
}

// Update UI
function updateUI() {
  scoreElement.textContent = `Score: ${score}`;
  livesElement.textContent = `Lives: ${lives}`;
  levelElement.textContent = `Level: ${level}`;

  // Add combo, weapon info, and control mode to score element
  let displayText = `Score: ${score}`;
  if (combo > 0) {
    displayText += ` | Combo: ${combo}x`;
  }
  if (weaponType !== "normal") {
    displayText += ` | Weapon: ${weaponType.toUpperCase()}`;
  }

  // Show control mode
  const controlMode = settings.controlMode || "mouse";
  const controlIcon =
    controlMode === "mouse" ? "🖱️" : controlMode === "keyboard" ? "⌨️" : "🎮";
  displayText += ` | ${controlIcon} ${controlMode.toUpperCase()}`;

  if (highScore > 0) {
    displayText += ` | Best: ${highScore}`;
  }

  scoreElement.innerHTML = displayText;
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw stars background
  if (stars && stars.length > 0) {
    stars.forEach((star) => star.update());
  }

  // Handle different game states
  if (gameState === "paused") {
    // Draw pause screen overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);

    ctx.font = "24px Arial";
    ctx.fillText(
      "Press ESC or P to resume",
      canvas.width / 2,
      canvas.height / 2 + 50
    );
  }

  // Only update game logic when playing
  if (gameState === "playing" && player) {
    // Update particles first (behind everything)
    updateParticles();

    // Update and draw player
    player.update();

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].update();
      if (bullets[i].y < 0) {
        bullets.splice(i, 1);
      }
    }

    // Update enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      enemyBullets[i].update();
      if (enemyBullets[i].y > canvas.height) {
        enemyBullets.splice(i, 1);
        continue;
      }

      // Check collision with player
      if (checkCollision(enemyBullets[i], player)) {
        enemyBullets.splice(i, 1);
        if (!settings.godMode && invincibilityTimer <= 0) {
          lives--;
          invincibilityTimer = 120; // 2 seconds of invincibility at 60fps
          createExplosion(
            player.x + player.width / 2,
            player.y + player.height / 2,
            "red"
          );
          playSound(440, "sawtooth", 0.3, 0.5);

          if (lives <= 0) {
            gameState = "gameOver";
            updateHighScore();
            playSound(200, "sawtooth", 0.5, 2);
            setTimeout(() => {
              gameOver();
              document
                .getElementById("gameOverMenu")
                .classList.remove("hidden");
            }, 100);
            return;
          }
        }
      }
    }

    // Update invaders
    let shouldMoveDown = false;

    // Check boundaries first
    invaders.forEach((invader) => {
      if (invader.x <= 0 || invader.x + invader.width >= canvas.width) {
        shouldMoveDown = true;
      }
    });

    // Update invaders and check collisions
    for (let i = invaders.length - 1; i >= 0; i--) {
      const invader = invaders[i];
      invader.update();
      invader.shoot();

      // Check collision with bullets
      for (let j = bullets.length - 1; j >= 0; j--) {
        const bullet = bullets[j];
        if (checkCollision(bullet, invader)) {
          // Remove bullet and invader
          bullets.splice(j, 1);
          invaders.splice(i, 1);

          // Add score
          score += invader.points * (combo + 1);
          combo++;

          // Create explosion effect
          createExplosion(
            invader.x + invader.width / 2,
            invader.y + invader.height / 2,
            invader.color
          );

          // Play sound
          playSound(800, "square", 0.1, 0.1);

          // Chance to drop power-up
          if (Math.random() < 0.1) {
            const powerUpTypes = ["spread", "rapid", "pierce"];
            const type =
              powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            powerUps.push(
              new PowerUp(
                invader.x + invader.width / 2 - 10,
                invader.y,
                20,
                20,
                type
              )
            );
          }
          break; // Exit bullet loop since invader is destroyed
        }
      }

      // Only check player collision if invader still exists
      if (
        invaders[i] &&
        checkCollision(invaders[i], player) &&
        !settings.godMode &&
        invincibilityTimer <= 0
      ) {
        lives--;
        invincibilityTimer = 120; // 2 seconds of invincibility at 60fps
        createExplosion(
          player.x + player.width / 2,
          player.y + player.height / 2,
          "red"
        );
        playSound(440, "sawtooth", 0.3, 0.5);

        if (lives <= 0) {
          gameState = "gameOver";
          updateHighScore();
          playSound(200, "sawtooth", 0.5, 2);
          setTimeout(() => {
            gameOver();
            document.getElementById("gameOverMenu").classList.remove("hidden");
          }, 100);
          return;
        }
      }

      // Check if invaders reached bottom
      if (
        invaders[i] &&
        invaders[i].y + invaders[i].height >= canvas.height - 50 &&
        !settings.godMode
      ) {
        gameState = "gameOver";
        updateHighScore();
        playSound(200, "sawtooth", 0.5, 2);
        setTimeout(gameOver, 100);
        return;
      }
    }

    // Move invaders down and change direction
    if (shouldMoveDown) {
      invaderDirection *= -1;
      invaders.forEach((invader) => {
        invader.y += 20;
      });
    }

    // Check if level is complete (all invaders AND boss destroyed)
    if (invaders.length === 0 && (!currentBoss || currentBoss.isDestroyed)) {
      level++;

      // Check if game is complete
      if (level > maxLevel) {
        gameState = "win";
        updateHighScore();
        playSound(1000, "sine", 0.3, 2);
        setTimeout(() => {
          alert("🎉 CONGRATULATIONS! You have saved Earth! 🎉");
          gameState = "menu";
        }, 100);
        return;
      }

      createInvaders();
      playSound(1200, "sine", 0.2, 0.5);

      // Show level completion message briefly
      ctx.fillStyle = "#00ff00";
      ctx.font = "24px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        `Level ${level - 1} Complete!`,
        canvas.width / 2,
        canvas.height / 2 - 20
      );

      if (level <= 4) {
        ctx.fillText(
          `Get ready for Boss Level ${level}!`,
          canvas.width / 2,
          canvas.height / 2 + 20
        );
      } else {
        ctx.fillText(
          `Final Level: Alien Swarm!`,
          canvas.width / 2,
          canvas.height / 2 + 20
        );
      }

      // Pause briefly to show message
      gameState = "paused";
      setTimeout(() => {
        if (gameState === "paused") {
          gameState = "playing";
        }
      }, 2000);
    }

    // Update boss if present
    if (currentBoss && !currentBoss.isDestroyed) {
      currentBoss.update();

      // Check boss collision with bullets
      for (let j = bullets.length - 1; j >= 0; j--) {
        const bullet = bullets[j];
        if (checkCollision(bullet, currentBoss)) {
          bullets.splice(j, 1);

          if (currentBoss.takeDamage()) {
            // Boss destroyed
            playSound(500, "sine", 0.3, 1);
          } else {
            // Boss hit but not destroyed
            playSound(600, "triangle", 0.2, 0.2);
          }
          break;
        }
      }

      // Check boss collision with player
      if (
        checkCollision(currentBoss, player) &&
        !settings.godMode &&
        invincibilityTimer <= 0
      ) {
        lives--;
        invincibilityTimer = 120;
        createExplosion(
          player.x + player.width / 2,
          player.y + player.height / 2,
          "red"
        );
        playSound(440, "sawtooth", 0.3, 0.5);

        if (lives <= 0) {
          gameState = "gameOver";
          updateHighScore();
          playSound(200, "sawtooth", 0.5, 2);
          setTimeout(() => {
            gameOver();
            document.getElementById("gameOverMenu").classList.remove("hidden");
          }, 100);
          return;
        }
      }
    }

    // Update power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      powerUps[i].update();
      if (powerUps[i].y > canvas.height) {
        powerUps.splice(i, 1);
        continue;
      }

      // Check collision with player
      if (checkCollision(powerUps[i], player)) {
        weaponType = powerUps[i].type;
        weaponTimer = powerUpDuration;
        playSound(600, "sine", 0.2, 0.3);
        powerUps.splice(i, 1);
      }
    }

    // Update weapon timer
    if (weaponTimer > 0) {
      weaponTimer--;
      if (weaponTimer <= 0) {
        weaponType = "normal";
      }
    }

    // Update invincibility timer
    if (invincibilityTimer > 0) {
      invincibilityTimer--;
    }

    // Reset combo if no hits for a while
    if (bullets.length === 0) {
      combo = Math.max(0, combo - 1);
    }

    // Draw UI
    updateUI();
  }

  requestAnimationFrame(gameLoop);
}

// Event listeners
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;

  const controlMode = settings.controlMode || "mouse";

  if (e.key === " " && gameState === "playing" && player) {
    e.preventDefault();
    if (controlMode === "keyboard" || controlMode === "both") {
      player.shoot();
    }
  }

  if (e.key === "Escape" || e.key === "p" || e.key === "P") {
    if (gameState === "playing") {
      gameState = "paused";
      document.getElementById("pauseMenu").classList.remove("hidden");
      pauseBackgroundMusic();
    } else if (gameState === "paused") {
      gameState = "playing";
      document.getElementById("pauseMenu").classList.add("hidden");
      resumeBackgroundMusic();
    }
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Resume game
function resumeGame() {
  if (gameState === "paused") {
    gameState = "playing";
    pausedForNavigation = false; // Reset navigation pause flag
    resumeBackgroundMusic();
  }
}

// Pause game
function pauseGame() {
  if (gameState === "playing") {
    gameState = "paused";
    // Don't set pausedForNavigation here - this is for manual pause (ESC key)
    pauseBackgroundMusic();
  }
}

// Make functions globally accessible
window.resumeGame = resumeGame;
window.pauseGame = pauseGame;

// Menu event listeners
document.getElementById("startBtn").addEventListener("click", () => {
  console.log("Start button clicked!");
  gameState = "playing";
  pausedForNavigation = false; // Reset navigation pause flag
  startMenu.classList.add("hidden");

  // Initialize audio with user interaction
  initAudio();

  // Initialize and start background music with force
  initBackgroundMusic();
  musicAllowed = true; // Allow music only when user starts game
  console.log(
    "About to start background music, settings.musicEnabled:",
    settings.musicEnabled
  );
  if (settings.musicEnabled) {
    startBackgroundMusic();
  }

  // Initialize full game
  initGame();

  updateUI();
});

// Quick Play button
document.getElementById("quickPlayBtn").addEventListener("click", () => {
  console.log("Quick Play button clicked!");
  gameState = "playing";
  pausedForNavigation = false; // Reset navigation pause flag
  startMenu.classList.add("hidden");

  initAudio();

  // Initialize and start background music with force
  initBackgroundMusic();
  musicAllowed = true; // Allow music only when user starts game
  console.log(
    "About to start background music (Quick Play), settings.musicEnabled:",
    settings.musicEnabled
  );
  if (settings.musicEnabled) {
    startBackgroundMusic();
  }

  initGame();
  updateUI();
});

// Restart button
document.getElementById("restartBtn").addEventListener("click", () => {
  console.log("Restart button clicked!");
  // Hide game over menu
  document.getElementById("gameOverMenu").classList.add("hidden");

  // Reset all game state variables
  gameState = "playing";
  pausedForNavigation = false; // Reset navigation pause flag
  score = 0;
  lives = 100000000000000;
  level = 1;
  combo = 0;
  weaponType = "normal";
  weaponTimer = 0;
  invincibilityTimer = 0;
  maxCombo = 0;

  // Clear all arrays
  bullets = [];
  enemyBullets = [];
  invaders = [];
  powerUps = [];
  particles = [];
  shields = [];
  stars = [];
  boss = null;
  currentBoss = null;

  // Reset keys and mouse
  keys = {};
  mouseX = 0;

  // Hide all menus except canvas
  document.getElementById("startMenu").classList.add("hidden");
  document.getElementById("winMenu").classList.add("hidden");
  document.getElementById("pauseMenu").classList.add("hidden");

  // Re-initialize game objects and UI
  initGame();
  updateUI();

  // Re-initialize audio
  initAudio();
  initBackgroundMusic();
  musicAllowed = true; // Allow music for restart
  if (settings.musicEnabled) {
    startBackgroundMusic();
  }

  // Re-create stars for background
  createStars();

  // Ensure game loop continues
  if (typeof gameLoop === "function") {
    requestAnimationFrame(gameLoop);
  }
});

// Main menu from game over
document
  .getElementById("mainMenuFromGameOverBtn")
  .addEventListener("click", () => {
    console.log("Main menu from game over clicked!");
    document.getElementById("gameOverMenu").classList.add("hidden");
    document.getElementById("startMenu").classList.remove("hidden");
    gameState = "menu";

    // Start menu music
    if (settings.musicEnabled) {
      initBackgroundMusic();
      startBackgroundMusic();
    }
  });

// Resume button
document.getElementById("resumeBtn").addEventListener("click", () => {
  console.log("Resume button clicked!");
  document.getElementById("pauseMenu").classList.add("hidden");
  gameState = "playing";
  pausedForNavigation = false; // Reset navigation pause flag
  resumeBackgroundMusic();
});

// Main menu from pause
document.getElementById("mainMenuBtn").addEventListener("click", () => {
  console.log("Main menu from pause clicked!");
  document.getElementById("pauseMenu").classList.add("hidden");
  document.getElementById("startMenu").classList.remove("hidden");
  gameState = "menu";
  pausedForNavigation = false; // Reset navigation pause flag
  stopBackgroundMusic();

  // Start menu music
  if (settings.musicEnabled) {
    setTimeout(() => {
      initBackgroundMusic();
      startBackgroundMusic();
    }, 100);
  }
});

// Next level button
const nextLevelBtn = document.getElementById("nextLevelBtn");
if (nextLevelBtn) {
  nextLevelBtn.addEventListener("click", () => {
    console.log("Next level button clicked!");
    document.getElementById("winMenu").classList.add("hidden");
    gameState = "playing";
    createInvaders();
    updateUI();
  });
}

// Variable to track if game was paused for navigation
let pausedForNavigation = false;

// Navigation system
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    // Remove active class from all nav items
    document
      .querySelectorAll(".nav-item")
      .forEach((nav) => nav.classList.remove("active"));
    // Add active class to clicked item
    item.classList.add("active");

    const menuType = item.dataset.menu;

    // Handle different menu types
    if (menuType !== "main") {
      // Going to Settings/Controls/About from any state

      // Show the startMenu container for settings/controls/about
      document.getElementById("startMenu").classList.remove("hidden");

      // Hide all menu contents
      document
        .querySelectorAll(".menu-content")
        .forEach((content) => content.classList.add("hidden"));

      // Show only the selected menu content
      const contentId = `${menuType}Content`;
      document.getElementById(contentId).classList.remove("hidden");

      // Hide main menu content and pause overlay
      document.getElementById("mainContent").classList.add("hidden");
      document.getElementById("pauseMenu").classList.add("hidden");

      // Pause game if currently playing
      if (gameState === "playing") {
        gameState = "paused";
        pausedForNavigation = true; // Mark that we paused for navigation
        pauseBackgroundMusic();
      }
    } else {
      // Returning to Main menu

      if (pausedForNavigation && gameState === "paused") {
        // Resume game that was paused for navigation
        gameState = "playing";
        pausedForNavigation = false;

        // Hide all menus and resume game
        document.getElementById("startMenu").classList.add("hidden");
        document.getElementById("pauseMenu").classList.add("hidden");
        document
          .querySelectorAll(".menu-content")
          .forEach((content) => content.classList.add("hidden"));

        resumeBackgroundMusic();
      } else {
        // Show main menu (when truly in menu state)
        document.getElementById("startMenu").classList.remove("hidden");

        // Hide all menu contents first
        document
          .querySelectorAll(".menu-content")
          .forEach((content) => content.classList.add("hidden"));

        // Show main content
        document.getElementById("mainContent").classList.remove("hidden");
        document.getElementById("pauseMenu").classList.add("hidden");
      }
    }
  });
});

// Settings toggles
document.getElementById("soundToggle").addEventListener("click", (e) => {
  soundEnabled = !soundEnabled;
  e.target.textContent = soundEnabled ? "ON" : "OFF";
  e.target.classList.toggle("off", !soundEnabled);
});

document.getElementById("musicToggle").addEventListener("click", (e) => {
  musicEnabled = !musicEnabled;
  settings.musicEnabled = musicEnabled; // Update settings object
  e.target.textContent = musicEnabled ? "ON" : "OFF";
  e.target.classList.toggle("off", !musicEnabled);

  // Control background music
  if (musicEnabled && gameState === "playing") {
    initBackgroundMusic();
    startBackgroundMusic();
  } else {
    stopBackgroundMusic();
  }
});

// Mouse controls
canvas.addEventListener("mousemove", (e) => {
  const controlMode = settings.controlMode || "mouse";
  const mouseActive = settings.mouseActive !== false;
  if (
    (controlMode === "mouse" || controlMode === "both") &&
    mouseActive &&
    gameState === "playing" &&
    player
  ) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;

    // Scale mouse position to canvas coordinates
    mouseX = (mouseX / rect.width) * canvas.width;
  }
});

canvas.addEventListener("click", (e) => {
  const controlMode = settings.controlMode || "mouse";
  const mouseActive = settings.mouseActive !== false;
  if (
    (controlMode === "mouse" || controlMode === "both") &&
    mouseActive &&
    gameState === "playing" &&
    player
  ) {
    player.shoot();
  }
});

// Touch controls for mobile
canvas.addEventListener("touchstart", (e) => {
  if (e.cancelable) e.preventDefault();
  if (gameState === "playing" && player) {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    mouseX = touch.clientX - rect.left;
    mouseX = (mouseX / rect.width) * canvas.width;

    player.shoot();
  }
});

canvas.addEventListener("touchmove", (e) => {
  if (e.cancelable) e.preventDefault();
  if (gameState === "playing" && player) {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    mouseX = touch.clientX - rect.left;
    mouseX = (mouseX / rect.width) * canvas.width;
  }
});

// Initialize
updateUI();

// Initialize stars for background
createStars();

// Start game function
function startGame() {
  console.log("Starting game...");
  gameState = "playing";

  // Reset game state
  score = 0;
  lives = 100000000000000;
  level = 1;
  combo = 0;
  weaponType = "normal";
  weaponTimer = 0;
  invincibilityTimer = 0;

  // Clear all arrays
  bullets = [];
  enemyBullets = [];
  invaders = [];
  powerUps = [];
  particles = [];

  // Initialize game objects
  initGame();

  // Hide all menus and show canvas
  document.getElementById("startMenu").classList.add("hidden");
  document.getElementById("gameOverMenu").classList.add("hidden");
  document.getElementById("winMenu").classList.add("hidden");
  document.getElementById("pauseMenu").classList.add("hidden");

  // Initialize audio
  initAudio();

  // Initialize and start background music with force
  initBackgroundMusic();
  if (settings.musicEnabled) {
    console.log("Attempting to start background music...");
    startBackgroundMusic();
  }

  updateUI();
  console.log("Game started with", invaders.length, "invaders");
}

// Game over function
function gameOver() {
  gameState = "gameOver";
  updateHighScore();

  // Stop background music
  stopBackgroundMusic();

  // Show game over screen
  document.getElementById("gameOverMenu").classList.remove("hidden");
  document.getElementById("finalScore").textContent = `Final Score: ${score}`;
}

// Update high score
function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("spaceInvadersHighScore", highScore.toString());
  }
}

// Make startGame globally accessible
window.startGame = startGame;

// Initialize background music on page load
document.addEventListener("DOMContentLoaded", () => {
  // Initialize music system immediately
  console.log("DOM Content Loaded, initializing music...");

  // Set initial game state to menu
  gameState = "menu";

  // Show main menu, hide other menus
  document.getElementById("startMenu").classList.remove("hidden");
  document.getElementById("gameOverMenu").classList.add("hidden");
  document.getElementById("winMenu").classList.add("hidden");
  document.getElementById("pauseMenu").classList.add("hidden");

  // Initialize stars and UI
  createStars();
  updateUI();

  initBackgroundMusic();

  // Ensure settings are ready
  console.log("Settings on DOM load:", settings);

  // Start music after a short delay to ensure everything is loaded
  setTimeout(() => {
    console.log(
      "Delayed music start, gameState:",
      gameState,
      "musicEnabled:",
      settings.musicEnabled
    );
    if (settings.musicEnabled && gameState === "menu") {
      startBackgroundMusic();
    }
  }, 1000);
});

// Start game loop immediately for menu rendering
gameLoop();
