const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game state
let gameState = "menu"; // 'menu', 'playing', 'gameOver', 'win', 'mission', 'quickplay'
let gameMode = "normal"; // 'normal', 'mission', 'quickplay'
let score = 0;
let lives = PLAYER_CONFIG?.startingLives || 3; // Menggunakan konfigurasi dari config.js
let level = 1;
let gameSpeed = 1;

// Mission Mode Variables
let currentMission = 1;
let missionProgress = 0;
let missionTimer = 0;
let missionStartTime = 0;
let missionCompleted = false;
let completedMissions = JSON.parse(
  localStorage.getItem("completedMissions") || "[]"
);

// Quick Play Mode Variables
let quickPlayTimer = 0;
let quickPlayHighScore = localStorage.getItem("quickPlayHighScore") || 0;
let alienWaveTimer = 0;
let quickPlayAliens = [];
let quickPlayDifficulty = 1;

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
let invincibilityTimer = 0; // Player invincibility after getting hit

// Audio Context
let audioContext = null;

// Settings object - Menggunakan DEFAULT_SETTINGS dari config.js
let settings = DEFAULT_SETTINGS
  ? { ...DEFAULT_SETTINGS }
  : {
      soundEnabled: true,
      musicEnabled: true,
      difficulty: "normal",
      graphics: "high",
      controlMode: "mouse",
      godMode: false,
      mouseActive: true,
    };

// Make settings globally accessible
window.settings = settings;

// Canvas dimensions - Menggunakan CANVAS_CONFIG dari config.js dengan ukuran tetap
if (CANVAS_CONFIG) {
  canvas.width = CANVAS_CONFIG.width; // 900px
  canvas.height = CANVAS_CONFIG.height; // 600px
} else {
  canvas.width = 900; // Fallback ke ukuran baru
  canvas.height = 600;
}

// Fungsi untuk menjaga ukuran canvas tetap konsisten
function updateCanvasSize() {
  // Set ukuran internal canvas (rendering)
  canvas.width = CANVAS_CONFIG?.width || 900;
  canvas.height = CANVAS_CONFIG?.height || 600;

  // Set ukuran display CSS dengan !important untuk override zoom
  canvas.style.width = "900px";
  canvas.style.height = "600px";
  canvas.style.transform = "scale(1)";
  canvas.style.transformOrigin = "center";
}

// Boss system
let currentBoss = null;
let bossLevel = 0; // 0=no boss, 1=small, 2=medium, 3=large, 4=huge

// Variabel dinamis yang menggunakan konfigurasi
let invaderSpeed = 1;
let invaderDirection = 1;
let invaderShootChance = 0.001;

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
function playSound(soundType = "shoot", customVolume = null) {
  if (!settings.soundEnabled || !audioContext) return;

  try {
    // Gunakan konfigurasi audio dari config.js
    const audioConfig = AUDIO_CONFIG?.soundTypes?.[soundType] ||
      AUDIO_CONFIG?.soundTypes?.shoot || {
        frequency: 440,
        type: "sine",
        duration: 0.2,
      };

    const frequency = audioConfig.frequency;
    const waveType = audioConfig.type;
    const duration = audioConfig.duration;
    const volume = customVolume || AUDIO_CONFIG?.soundEffectsVolume || 0.1;

    // Validate all parameters
    let validFrequency = frequency;
    let validVolume = volume;
    let validDuration = duration;

    if (
      !validFrequency ||
      typeof validFrequency !== "number" ||
      !isFinite(validFrequency)
    ) {
      validFrequency = 440; // Default frequency
    }
    if (
      !validVolume ||
      typeof validVolume !== "number" ||
      !isFinite(validVolume)
    ) {
      validVolume = 0.1; // Default volume
    }
    if (
      !validDuration ||
      typeof validDuration !== "number" ||
      !isFinite(validDuration)
    ) {
      validDuration = 0.2; // Default duration
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Validate and clamp parameters
    const safeVolume =
      Math.max(0.001, Math.min(1, validVolume)) *
      (AUDIO_CONFIG?.masterVolume || 0.3);
    const safeDuration = Math.max(0.01, Math.min(5, validDuration));
    const safeFrequency = Math.max(20, Math.min(20000, validFrequency));

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
      // Menggunakan volume dari konfigurasi
      backgroundMusic.volume = AUDIO_CONFIG?.musicVolume || 0.3;
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

// Desktop UI Elements (for split layout)
const scoreElementDesktop = document.getElementById("score-desktop");
const livesElementDesktop = document.getElementById("lives-desktop");
const levelElementDesktop = document.getElementById("level-desktop");

const startMenu = document.getElementById("startMenu");
const gameOverMenu = document.getElementById("gameOverMenu");
const winMenu = document.getElementById("winMenu");

// Mobile Detection
function isMobile() {
  return (
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  );
}

// Canvas Auto-Resize for Mobile
function handleMobileCanvas() {
  if (isMobile()) {
    // Mobile device detected - CSS will handle the sizing
    console.log("Mobile device detected, using responsive canvas");
  } else {
    // Desktop - ensure fixed size
    console.log("Desktop device detected, using fixed canvas size");
  }
}

// Player class
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    // Menggunakan konfigurasi dari config.js
    this.width = PLAYER_CONFIG?.width || 50;
    this.height = PLAYER_CONFIG?.height || 30;
    this.speed = PLAYER_CONFIG?.speed || 7;
    this.color = EFFECTS_CONFIG?.colors?.player || "#00ff41";
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

    // Main body gradient - menggunakan konfigurasi warna
    const bodyGradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x,
      this.y + this.height
    );
    const gradientColors = EFFECTS_CONFIG?.colors?.playerGradient || [
      "#00ff41",
      "#00cc33",
      "#008822",
      "#004411",
    ];

    gradientColors.forEach((color, index) => {
      bodyGradient.addColorStop(index / (gradientColors.length - 1), color);
    });

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
        this.x -= this.speed;
      }
      if (keys["ArrowRight"] && this.x < canvas.width - this.width) {
        this.x += this.speed;
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
      const bulletWidth = BULLET_CONFIG?.width || 5;
      const bulletHeight = BULLET_CONFIG?.height || 15;
      const bulletSpeed = BULLET_CONFIG?.speed || 10;

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
              BULLET_CONFIG?.color || "#ff4444",
              bulletSpeed
            )
          );
          playSound("shoot");
          break;
        case "double":
          bullets.push(
            new Bullet(
              bulletX - 10,
              bulletY,
              bulletWidth,
              bulletHeight,
              BULLET_CONFIG?.color || "#ff4444",
              bulletSpeed
            )
          );
          bullets.push(
            new Bullet(
              bulletX + 10,
              bulletY,
              bulletWidth,
              bulletHeight,
              BULLET_CONFIG?.color || "#ff4444",
              bulletSpeed
            )
          );
          playSound("shoot");
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
          playSound("powerup");
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
          playSound("shoot");
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
      const bulletWidth = BULLET_CONFIG?.width || 5;
      const bulletHeight = BULLET_CONFIG?.height || 15;

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
      playSound("explosion");
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
  // Pastikan canvas ukuran tetap konsisten
  updateCanvasSize();

  // Initialize player - menggunakan konfigurasi dari config.js dengan jarak lebih baik
  const playerWidth = PLAYER_CONFIG?.width || 50;
  const playerHeight = PLAYER_CONFIG?.height || 30;
  const playerX = (canvas.width - playerWidth) / 2;
  const playerY = canvas.height - playerHeight - 40; // Ditambah dari 20 ke 40 untuk jarak lebih baik
  player = new Player(playerX, playerY); // Constructor sudah dimodifikasi

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

  // Create stars background
  createStars();

  console.log("Game initialized with", invaders.length, "invaders");
}

// Create invaders formation
function createInvaders() {
  invaders = [];
  currentBoss = null;

  // Menggunakan konfigurasi dari config.js
  const invaderWidth = INVADER_CONFIG?.width || 35;
  const invaderHeight = INVADER_CONFIG?.height || 25;
  const invaderGap = INVADER_CONFIG?.gap || 15;
  const rows = INVADER_CONFIG?.rows || 4;
  const cols = INVADER_CONFIG?.cols || 8;
  const levelConfig = getLevelConfig ? getLevelConfig(level) : null;

  // Update speed and shoot chance berdasarkan level
  invaderSpeed = getEnemySpeed ? getEnemySpeed(level) : 1 + (level - 1) * 0.5;
  invaderShootChance = getEnemyShootChance
    ? getEnemyShootChance(level)
    : 0.001 + (level - 1) * 0.0005;

  // Level system: 1-4 boss levels, 5 final alien swarm
  if (level <= 4) {
    // Boss levels 1-4
    bossLevel = level;
    const bossWidth = BOSS_CONFIG?.width || 120;
    const bossX = (canvas.width - (80 + level * 40)) / 2;
    const bossY = 50;
    currentBoss = new Boss(bossX, bossY, bossLevel);

    // Add some support invaders for boss levels dengan jarak yang lebih baik
    const supportCount = Math.min(level * 2, 6); // Dikurangi dari 8 ke 6
    const startX = (canvas.width - 3 * (invaderWidth + invaderGap)) / 2; // Posisi tengah
    const startY = 220; // Lebih jauh dari player

    for (let i = 0; i < supportCount; i++) {
      const x = startX + (i % 3) * (invaderWidth + invaderGap + 20); // Gap lebih besar
      const y = startY + Math.floor(i / 3) * (invaderHeight + invaderGap + 15);
      invaders.push(
        new Invader(x, y, invaderWidth, invaderHeight, "#00aaff", 15)
      );
    }

    console.log(
      `Level ${level}: Boss ${bossLevel} created with ${supportCount} support invaders`
    );
  } else if (level === 5) {
    // Final level - only aliens, no boss dengan formasi yang lebih rapi
    bossLevel = 0;

    // Hitung posisi untuk formasi yang seimbang
    const totalWidth = cols * invaderWidth + (cols - 1) * invaderGap;
    const totalHeight = rows * invaderHeight + (rows - 1) * invaderGap;
    const startX = (canvas.width - totalWidth) / 2; // Posisi tengah horizontal
    const startY = 60; // Jauh dari player

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
            color = "#ffff44"; // Yellow - second row
            points = 30;
            break;
          case 2:
            color = "#44ffff"; // Cyan - third row
            points = 25;
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
  // Update mobile/traditional UI
  scoreElement.textContent = `Score: ${score}`;
  livesElement.textContent = `Lives: ${lives}`;

  // Update desktop split UI
  if (scoreElementDesktop) scoreElementDesktop.textContent = `Score: ${score}`;
  if (livesElementDesktop) livesElementDesktop.textContent = `Lives: ${lives}`;

  // Handle different game modes
  if (gameMode === "mission") {
    updateMissionUI();
  } else if (gameMode === "quickplay") {
    updateQuickPlayUI();
  } else {
    levelElement.textContent = `Level: ${level}`;
    if (levelElementDesktop)
      levelElementDesktop.textContent = `Level: ${level}`;
  }

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

  if (gameMode === "quickplay") {
    displayText += ` | Best: ${quickPlayHighScore}`;
  } else if (highScore > 0) {
    displayText += ` | Best: ${highScore}`;
  }

  scoreElement.innerHTML = displayText;
}

// ====================================
// MISSION MODE FUNCTIONS
// ====================================

// Initialize Mission Mode
function initMissionMode() {
  gameMode = "mission";
  gameState = "playing";
  missionProgress = 0;
  missionTimer = 0;
  missionStartTime = Date.now();
  missionCompleted = false;

  // Reset game stats
  score = 0;
  lives = PLAYER_CONFIG?.startingLives || 3;
  level = 1;
  combo = 0;
  weaponType = "normal";
  weaponTimer = 0;
  invincibilityTimer = 0;

  // Clear arrays
  bullets = [];
  enemyBullets = [];
  invaders = [];
  powerUps = [];
  particles = [];
  shields = [];
  stars = [];
  currentBoss = null;

  // Initialize mission based on type
  const mission = MISSION_CONFIG.missionTypes[currentMission];
  if (mission) {
    if (mission.type === "boss" || mission.type === "final_boss") {
      // Create boss for boss missions
      const bossX = (canvas.width - 120) / 2;
      const bossY = 50;
      currentBoss = new Boss(
        bossX,
        bossY,
        currentMission === 10 ? 4 : Math.min(currentMission, 3)
      );
    } else {
      // Create normal invaders for other missions
      createInvaders();
    }
  }

  // Initialize player and other game elements
  initGame();

  // Create stars for background effect
  createStars();

  updateMissionUI();
}

// Check Mission Completion
function checkMissionComplete() {
  if (gameMode !== "mission" || missionCompleted) return;

  const mission = MISSION_CONFIG.missionTypes[currentMission];
  if (!mission) return;

  let isComplete = false;

  switch (mission.type) {
    case "eliminate":
      if (missionProgress >= mission.target) isComplete = true;
      break;
    case "survive":
      const surviveTime = Math.floor((Date.now() - missionStartTime) / 1000);
      if (surviveTime >= mission.target) isComplete = true;
      break;
    case "score":
      if (score >= mission.target) isComplete = true;
      break;
    case "combo":
      if (combo >= mission.target) isComplete = true;
      break;
    case "boss":
    case "final_boss":
      if (currentBoss && currentBoss.health <= 0) isComplete = true;
      break;
  }

  if (isComplete) {
    missionCompleted = true;
    const reward = MISSION_CONFIG.rewards[currentMission] || 1000;
    score += reward;

    // Save completion
    if (!completedMissions.includes(currentMission)) {
      completedMissions.push(currentMission);
      localStorage.setItem(
        "completedMissions",
        JSON.stringify(completedMissions)
      );
    }

    // Show mission complete
    setTimeout(() => {
      if (currentMission >= MISSION_CONFIG.maxMissions) {
        alert(
          `🎉 SEMUA MISI SELESAI! 🎉\nReward: ${reward} points\nTotal Score: ${score}`
        );
        gameState = "menu";
      } else {
        alert(
          `✅ MISI ${currentMission} SELESAI!\nReward: ${reward} points\nScore: ${score}`
        );
        currentMission++;
        if (currentMission <= MISSION_CONFIG.maxMissions) {
          initMissionMode();
        } else {
          gameState = "menu";
        }
      }
    }, 100);
  }
}

// Update Mission UI
function updateMissionUI() {
  const mission = MISSION_CONFIG.missionTypes[currentMission];
  if (!mission) return;

  let progressText = "";

  switch (mission.type) {
    case "eliminate":
      progressText = `${missionProgress}/${mission.target} alien dihancurkan`;
      break;
    case "survive":
      const surviveTime = Math.floor((Date.now() - missionStartTime) / 1000);
      progressText = `${surviveTime}/${mission.target} detik bertahan`;
      break;
    case "score":
      progressText = `${score}/${mission.target} skor`;
      break;
    case "combo":
      progressText = `${combo}/${mission.target} combo`;
      break;
    case "boss":
    case "final_boss":
      progressText = currentBoss
        ? `Boss HP: ${currentBoss.health}`
        : "Tunggu Boss...";
      break;
  }

  levelElement.textContent = `Misi ${currentMission}: ${mission.description} | ${progressText}`;
  if (levelElementDesktop)
    levelElementDesktop.textContent = `Misi ${currentMission}: ${mission.description} | ${progressText}`;
}

// ====================================
// QUICK PLAY MODE FUNCTIONS
// ====================================

// Quick Play Alien Class
class QuickPlayAlien {
  constructor(type, startX, startY) {
    const config = QUICKPLAY_CONFIG.alienTypes[type];
    this.type = type;
    this.width = config.width;
    this.height = config.height;
    this.speed = config.speed * (quickPlayDifficulty * 0.1 + 1);
    this.health = config.health;
    this.maxHealth = config.health;
    this.points = config.points;
    this.spawnPattern = config.spawnPattern;

    // Set position based on spawn pattern
    this.x = startX;
    this.y = startY;
    this.targetX = this.x;
    this.targetY = canvas.height / 2; // Target tengah layar

    // Movement properties
    this.phase = Math.random() * Math.PI * 2;
    this.amplitude = 30;
    this.color = this.getColorByType();
  }

  getColorByType() {
    switch (this.type) {
      case "small":
        return "#00ff88";
      case "medium":
        return "#ffaa00";
      case "fast":
        return "#ff4444";
      default:
        return "#ffffff";
    }
  }

  update() {
    // Movement pattern: dari atas ke tengah dengan sedikit zigzag
    if (this.spawnPattern === "center_to_edges") {
      // Bergerak dari tengah atas ke samping
      this.y += this.speed;
      this.x += Math.sin(this.phase) * 2;
      this.phase += 0.1;

      // Ketika sampai tengah, bergerak ke samping
      if (this.y >= canvas.height / 2) {
        this.x += this.x < canvas.width / 2 ? -this.speed : this.speed;
      }
    } else if (this.spawnPattern === "top_to_center") {
      // Bergerak langsung ke tengah
      const dx = canvas.width / 2 - this.x;
      const dy = canvas.height / 2 - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 5) {
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
      } else {
        // Berputar di tengah
        this.x += Math.cos(this.phase) * 2;
        this.y += Math.sin(this.phase) * 2;
        this.phase += 0.08;
      }
    } else {
      // Random movement
      this.y += this.speed;
      this.x += Math.sin(this.phase) * 3;
      this.phase += 0.15;
    }

    this.draw();
  }

  draw() {
    // Health-based color intensity
    const healthRatio = this.health / this.maxHealth;
    const alpha = 0.3 + healthRatio * 0.7;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Draw alien body
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw health bar if damaged
    if (this.health < this.maxHealth) {
      const barWidth = this.width;
      const barHeight = 4;
      const barY = this.y - 8;

      // Background
      ctx.fillStyle = "#444";
      ctx.fillRect(this.x, barY, barWidth, barHeight);

      // Health
      ctx.fillStyle =
        healthRatio > 0.5 ? "#0f0" : healthRatio > 0.25 ? "#ff0" : "#f00";
      ctx.fillRect(this.x, barY, barWidth * healthRatio, barHeight);
    }

    // Glow effect
    const glowSize = this.width + 10;
    const gradient = ctx.createRadialGradient(
      this.x + this.width / 2,
      this.y + this.height / 2,
      0,
      this.x + this.width / 2,
      this.y + this.height / 2,
      glowSize / 2
    );
    gradient.addColorStop(0, this.color + "44");
    gradient.addColorStop(1, "transparent");

    ctx.fillStyle = gradient;
    ctx.fillRect(this.x - 5, this.y - 5, glowSize, glowSize);

    ctx.restore();
  }

  takeDamage(damage = 1) {
    this.health -= damage;
    return this.health <= 0;
  }
}

// Initialize Quick Play Mode
function initQuickPlayMode() {
  gameMode = "quickplay";
  gameState = "playing";
  quickPlayTimer = 0;
  alienWaveTimer = 0;
  quickPlayAliens = [];
  quickPlayDifficulty = 1;

  // Reset game stats
  score = 0;
  lives = PLAYER_CONFIG?.startingLives || 3;
  combo = 0;

  // Initialize player and game elements
  initGame();
  updateQuickPlayUI();
}

// Spawn Quick Play Aliens
function spawnQuickPlayWave() {
  const difficulty =
    QUICKPLAY_CONFIG.difficultyProgression[settings.difficulty] ||
    QUICKPLAY_CONFIG.difficultyProgression.normal;

  const alienCount = Math.floor(difficulty.alienCount * quickPlayDifficulty);
  const types = ["small", "medium", "fast"];

  for (let i = 0; i < alienCount; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const config = QUICKPLAY_CONFIG.alienTypes[type];

    let startX, startY;

    // Spawn positions based on pattern
    switch (config.spawnPattern) {
      case "center_to_edges":
        startX = canvas.width / 2 + (Math.random() - 0.5) * 100;
        startY = -50;
        break;
      case "top_to_center":
        startX = Math.random() * canvas.width;
        startY = -50;
        break;
      default: // random
        startX = Math.random() * (canvas.width - config.width);
        startY = -50;
    }

    quickPlayAliens.push(new QuickPlayAlien(type, startX, startY));
  }

  // Increase difficulty gradually
  quickPlayDifficulty += 0.1;
}

// Update Quick Play Mode
function updateQuickPlayMode() {
  if (gameMode !== "quickplay") return;

  quickPlayTimer++;
  alienWaveTimer++;

  // Spawn new waves
  if (alienWaveTimer >= QUICKPLAY_CONFIG.alienWaveInterval) {
    spawnQuickPlayWave();
    alienWaveTimer = 0;
  }

  // Update aliens
  quickPlayAliens.forEach((alien, index) => {
    alien.update();

    // Remove aliens that go off screen
    if (
      alien.x < -alien.width ||
      alien.x > canvas.width + alien.width ||
      alien.y > canvas.height + alien.height
    ) {
      quickPlayAliens.splice(index, 1);
    }

    // Check collision with player
    if (player && checkCollision(player, alien)) {
      if (invincibilityTimer <= 0) {
        lives--;
        invincibilityTimer = GAME_CONFIG?.invincibilityDuration || 120;
        playSound("hit");
        createExplosion(
          player.x + player.width / 2,
          player.y + player.height / 2,
          "#ff4444"
        );

        if (lives <= 0) {
          gameState = "gameOver";
          // Update high score for quick play
          if (score > quickPlayHighScore) {
            quickPlayHighScore = score;
            localStorage.setItem("quickPlayHighScore", quickPlayHighScore);
          }
        }
      }
      quickPlayAliens.splice(index, 1);
    }
  });

  // Check bullet collisions with quick play aliens
  bullets.forEach((bullet, bulletIndex) => {
    quickPlayAliens.forEach((alien, alienIndex) => {
      if (checkCollision(bullet, alien)) {
        const killed = alien.takeDamage();

        if (killed) {
          score += alien.points;
          combo++;
          maxCombo = Math.max(maxCombo, combo);

          playSound("explosion");
          createExplosion(
            alien.x + alien.width / 2,
            alien.y + alien.height / 2,
            alien.color
          );

          quickPlayAliens.splice(alienIndex, 1);

          // Chance for power-up
          if (Math.random() < 0.1) {
            const powerUpTypes = ["spread", "rapid", "pierce"];
            const randomType =
              powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            powerUps.push(new PowerUp(alien.x, alien.y, 20, 20, randomType));
          }
        }

        bullets.splice(bulletIndex, 1);
      }
    });
  });

  updateQuickPlayUI();
}

// Update Quick Play UI
function updateQuickPlayUI() {
  const playTime = Math.floor(quickPlayTimer / 60); // Convert frames to seconds
  const quickPlayText = `Quick Play | Waktu: ${playTime}s | High Score: ${quickPlayHighScore} | Aliens: ${quickPlayAliens.length}`;

  // Safe UI update with error handling
  try {
    if (levelElement) levelElement.textContent = quickPlayText;
    if (levelElementDesktop) levelElementDesktop.textContent = quickPlayText;
  } catch (error) {
    console.warn("Error updating Quick Play UI:", error);
  }
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

    // Handle different game modes
    if (gameMode === "quickplay") {
      updateQuickPlayMode();
    } else if (gameMode === "mission") {
      checkMissionComplete();
    }

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

    // Update invaders (only for normal and mission modes, not quickplay)
    if (gameMode !== "quickplay") {
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

            // Update mission progress if in mission mode
            if (gameMode === "mission") {
              const mission = MISSION_CONFIG.missionTypes[currentMission];
              if (mission && mission.type === "eliminate") {
                missionProgress++;
              }
            }

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
              document
                .getElementById("gameOverMenu")
                .classList.remove("hidden");
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
        if (level > (GAME_CONFIG?.maxLevel || 20)) {
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
    } // End of gameMode !== "quickplay" block

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

            // Add boss score
            score += BOSS_CONFIG?.points || 500;

            // Update mission progress if in mission mode
            if (gameMode === "mission") {
              const mission = MISSION_CONFIG.missionTypes[currentMission];
              if (
                mission &&
                (mission.type === "boss" || mission.type === "final_boss")
              ) {
                // Boss mission completed, will be checked in checkMissionComplete
                checkMissionComplete();
              }
            }
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
        weaponTimer = POWERUP_CONFIG?.duration || 600;
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
  console.log("Start Mission button clicked!");

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

  // Hide menu
  startMenu.classList.add("hidden");
  pausedForNavigation = false; // Reset navigation pause flag

  // Initialize Mission Mode
  initMissionMode();
  updateUI();
});

// Quick Play button
document.getElementById("quickPlayBtn").addEventListener("click", () => {
  console.log("Quick Play button clicked!");

  // Initialize audio with user interaction
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

  // Hide menu
  startMenu.classList.add("hidden");
  pausedForNavigation = false; // Reset navigation pause flag

  // Initialize Quick Play Mode
  initQuickPlayMode();
  updateUI();
});

// Restart button
document.getElementById("restartBtn").addEventListener("click", () => {
  console.log("Restart button clicked!");
  // Hide game over menu
  document.getElementById("gameOverMenu").classList.add("hidden");

  // Re-initialize audio
  initAudio();
  initBackgroundMusic();
  musicAllowed = true; // Allow music for restart
  if (settings.musicEnabled) {
    startBackgroundMusic();
  }

  // Restart based on current game mode
  if (gameMode === "mission") {
    currentMission = 1; // Reset to mission 1
    initMissionMode();
  } else if (gameMode === "quickplay") {
    initQuickPlayMode();
  } else {
    // Normal mode
    gameMode = "normal";
    gameState = "playing";
    pausedForNavigation = false;
    score = 0;
    lives = PLAYER_CONFIG?.startingLives || 3;
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

    // Initialize game objects and UI
    initGame();
  }

  updateUI();

  // Hide all menus except canvas
  document.getElementById("startMenu").classList.add("hidden");
  document.getElementById("winMenu").classList.add("hidden");
  document.getElementById("pauseMenu").classList.add("hidden");

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

  // Mobile detection and setup
  handleMobileCanvas();
  console.log(
    `Device type: ${isMobile() ? "Mobile" : "Desktop"}, Screen: ${
      window.innerWidth
    }x${window.innerHeight}`
  );

  // Pastikan canvas ukuran tetap sejak awal
  updateCanvasSize();

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

// Event listener untuk menjaga ukuran canvas tetap konsisten saat resize atau zoom
window.addEventListener("resize", () => {
  updateCanvasSize();
  handleMobileCanvas(); // Handle mobile canvas adjustments
});

// Event listener untuk mendeteksi zoom dan menjaga ukuran canvas
window.addEventListener("wheel", (e) => {
  if (e.ctrlKey) {
    // Zoom detected, maintain canvas size
    setTimeout(() => {
      updateCanvasSize();
      handleMobileCanvas();
    }, 100);
  }
});

// Periodic check untuk memastikan canvas tetap ukuran yang benar
setInterval(() => {
  if (canvas.style.width !== "900px" || canvas.style.height !== "600px") {
    updateCanvasSize();
  }
}, 1000);

// Initialize canvas size immediately
updateCanvasSize();

// Start game loop immediately for menu rendering
gameLoop();
