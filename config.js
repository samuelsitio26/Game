// ====================================
// GAME CONFIGURATION FILE
// ====================================
// File ini berisi semua pengaturan, konstanta, dan konfigurasi game
// Mudah untuk dimodifikasi oleh pemula tanpa menyentuh logika game utama

// ====================================
// CANVAS & DISPLAY SETTINGS
// ====================================
const CANVAS_CONFIG = {
  width: 800,
  height: 600,
};

// ====================================
// PLAYER SETTINGS
// ====================================
const PLAYER_CONFIG = {
  width: 50,
  height: 30,
  speed: 7,
  maxLives: 3, // Ubah dari 100000000000000 ke nilai normal
  startingLives: 3,
};

// ====================================
// BULLET SETTINGS
// ====================================
const BULLET_CONFIG = {
  width: 5,
  height: 15,
  speed: 10,
  color: "#00ff41",
};

// ====================================
// ENEMY/INVADER SETTINGS
// ====================================
const INVADER_CONFIG = {
  width: 40,
  height: 30,
  initialSpeed: 1,
  speedIncreasePerLevel: 0.5,
  rows: 5,
  cols: 10,
  gap: 10,
  initialShootChance: 0.001,
  shootChanceIncreasePerLevel: 0.0005,
  points: {
    topRow: 30, // Invader paling atas
    middleRow: 20, // Invader tengah
    bottomRow: 10, // Invader paling bawah
  },
};

// ====================================
// BOSS SETTINGS
// ====================================
const BOSS_CONFIG = {
  width: 120,
  height: 80,
  speed: 2,
  health: {
    level1: 100,
    level2: 150,
    level3: 200,
    level4: 300,
  },
  points: 500,
  appearanceLevel: 5, // Boss muncul setiap level ke-5
};

// ====================================
// SHIELD SETTINGS
// ====================================
const SHIELD_CONFIG = {
  width: 80,
  height: 60,
  count: 4,
  health: 3, // Berapa kali bisa terkena tembakan
};

// ====================================
// POWER-UP SETTINGS
// ====================================
const POWERUP_CONFIG = {
  duration: 600, // Durasi dalam frame (10 detik pada 60 FPS)
  spawnChance: 0.15, // 15% chance setelah membunuh enemy
  types: {
    doubleShot: {
      name: "Double Shot",
      color: "#00aaff",
      symbol: "💥",
    },
    laser: {
      name: "Laser Beam",
      color: "#ff0044",
      symbol: "⚡",
    },
    spread: {
      name: "Spread Shot",
      color: "#ffaa00",
      symbol: "🔥",
    },
    shield: {
      name: "Extra Shield",
      color: "#44ff00",
      symbol: "🛡️",
    },
    life: {
      name: "Extra Life",
      color: "#ff44aa",
      symbol: "❤️",
    },
  },
};

// ====================================
// GAME MECHANICS
// ====================================
const GAME_CONFIG = {
  maxLevel: 20,
  invincibilityDuration: 120, // Frames (2 detik pada 60 FPS)
  comboTimeLimit: 180, // Frames untuk mempertahankan combo
  scoringSystem: {
    invaderKill: 10,
    bossKill: 500,
    comboBonus: 5, // Bonus per combo hit
    levelComplete: 1000,
  },
};

// ====================================
// MISSION MODE SETTINGS
// ====================================
const MISSION_CONFIG = {
  maxMissions: 10, // Total 10 misi
  missionTypes: {
    1: { type: "eliminate", target: 50, description: "Hancurkan 50 alien" },
    2: { type: "survive", target: 60, description: "Bertahan selama 60 detik" },
    3: { type: "score", target: 5000, description: "Raih skor 5.000 poin" },
    4: { type: "eliminate", target: 75, description: "Hancurkan 75 alien" },
    5: { type: "boss", target: 1, description: "Kalahkan Boss Level 5" },
    6: { type: "survive", target: 90, description: "Bertahan selama 90 detik" },
    7: { type: "score", target: 15000, description: "Raih skor 15.000 poin" },
    8: { type: "eliminate", target: 100, description: "Hancurkan 100 alien" },
    9: { type: "combo", target: 20, description: "Raih combo 20x" },
    10: { type: "final_boss", target: 1, description: "Kalahkan Final Boss" },
  },
  rewards: {
    1: 1000,
    2: 1500,
    3: 2000,
    4: 2500,
    5: 5000,
    6: 3000,
    7: 3500,
    8: 4000,
    9: 4500,
    10: 10000,
  },
};

// ====================================
// QUICK PLAY MODE SETTINGS
// ====================================
const QUICKPLAY_CONFIG = {
  alienWaveInterval: 180, // Frames antara gelombang alien (3 detik)
  alienTypes: {
    small: {
      width: 25,
      height: 20,
      speed: 2,
      health: 1,
      points: 50,
      spawnPattern: "center_to_edges", // Alien muncul dari tengah ke tepi
    },
    medium: {
      width: 35,
      height: 25,
      speed: 1.5,
      health: 2,
      points: 100,
      spawnPattern: "top_to_center",
    },
    fast: {
      width: 20,
      height: 15,
      speed: 4,
      health: 1,
      points: 75,
      spawnPattern: "random",
    },
  },
  difficultyProgression: {
    easy: { alienCount: 3, speedMultiplier: 0.8 },
    normal: { alienCount: 5, speedMultiplier: 1.0 },
    hard: { alienCount: 8, speedMultiplier: 1.3 },
  },
};

// ====================================
// AUDIO SETTINGS
// ====================================
const AUDIO_CONFIG = {
  masterVolume: 0.3,
  soundEffectsVolume: 0.5,
  musicVolume: 0.3,
  soundTypes: {
    shoot: {
      frequency: 800,
      type: "square",
      duration: 0.1,
    },
    explosion: {
      frequency: 200,
      type: "sawtooth",
      duration: 0.3,
    },
    powerup: {
      frequency: 1200,
      type: "sine",
      duration: 0.5,
    },
    hit: {
      frequency: 400,
      type: "triangle",
      duration: 0.2,
    },
    boss: {
      frequency: 150,
      type: "square",
      duration: 1.0,
    },
  },
};

// ====================================
// VISUAL EFFECTS
// ====================================
const EFFECTS_CONFIG = {
  particles: {
    explosionCount: 10,
    lifetime: 60, // Frames
    speed: 3,
  },
  stars: {
    count: 50,
    speed: 1,
    maxSize: 3,
  },
  colors: {
    player: "#00ff41",
    playerGradient: ["#00ff41", "#00cc33", "#008822", "#004411"],
    enemy: "#ff4444",
    enemyGradient: ["#ff4444", "#cc3333", "#882222", "#441111"],
    boss: "#ff0080",
    bossGradient: ["#ff0080", "#cc0066", "#880044", "#440022"],
    background: "#001122",
    ui: "#00ff41",
    text: "#ffffff",
  },
};

// ====================================
// DEFAULT GAME SETTINGS
// ====================================
const DEFAULT_SETTINGS = {
  soundEnabled: true,
  musicEnabled: true,
  difficulty: "normal", // easy, normal, hard, extreme
  graphics: "high", // low, medium, high
  controlMode: "both", // mouse, keyboard, both
  godMode: false, // Cheat mode
  mouseActive: true,
  showFPS: false,
  showDebugInfo: false,
};

// ====================================
// DIFFICULTY MODIFIERS
// ====================================
const DIFFICULTY_CONFIG = {
  easy: {
    enemySpeedMultiplier: 0.7,
    enemyShootMultiplier: 0.5,
    playerLives: 5,
    powerUpChance: 0.25,
  },
  normal: {
    enemySpeedMultiplier: 1.0,
    enemyShootMultiplier: 1.0,
    playerLives: 3,
    powerUpChance: 0.15,
  },
  hard: {
    enemySpeedMultiplier: 1.3,
    enemyShootMultiplier: 1.5,
    playerLives: 2,
    powerUpChance: 0.1,
  },
  extreme: {
    enemySpeedMultiplier: 1.8,
    enemyShootMultiplier: 2.0,
    playerLives: 1,
    powerUpChance: 0.05,
  },
};

// ====================================
// CONTROL BINDINGS
// ====================================
const CONTROLS_CONFIG = {
  keyboard: {
    moveLeft: ["ArrowLeft", "a", "A"],
    moveRight: ["ArrowRight", "d", "D"],
    shoot: ["Space", " "],
    pause: ["Escape", "p", "P"],
    restart: ["r", "R"],
  },
  mouse: {
    enabled: true,
    shootOnClick: true,
    followMouse: true,
  },
};

// ====================================
// LEVEL PROGRESSION
// ====================================
const LEVEL_CONFIG = {
  progression: {
    1: { enemies: 50, bossLevel: false, theme: "space" },
    2: { enemies: 60, bossLevel: false, theme: "asteroid" },
    3: { enemies: 70, bossLevel: false, theme: "nebula" },
    4: { enemies: 80, bossLevel: false, theme: "galaxy" },
    5: { enemies: 0, bossLevel: true, theme: "boss_mothership" },
    6: { enemies: 90, bossLevel: false, theme: "wormhole" },
    7: { enemies: 100, bossLevel: false, theme: "blackhole" },
    8: { enemies: 110, bossLevel: false, theme: "supernova" },
    9: { enemies: 120, bossLevel: false, theme: "quasar" },
    10: { enemies: 0, bossLevel: true, theme: "boss_destroyer" },
  },
};

// ====================================
// UTILITY FUNCTIONS
// ====================================
// Fungsi untuk mendapatkan konfigurasi berdasarkan level kesulitan
function getDifficultyConfig(difficulty = "normal") {
  return DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.normal;
}

// Fungsi untuk mendapatkan konfigurasi level
function getLevelConfig(level) {
  const config = LEVEL_CONFIG.progression[level];
  if (!config) {
    // Generate config untuk level tinggi
    const isBossLevel = level % 5 === 0;
    return {
      enemies: isBossLevel ? 0 : 50 + level * 10,
      bossLevel: isBossLevel,
      theme: isBossLevel ? `boss_level_${Math.floor(level / 5)}` : "space",
    };
  }
  return config;
}

// Fungsi untuk menghitung kecepatan enemy berdasarkan level
function getEnemySpeed(baseLevel) {
  const difficulty = getDifficultyConfig(
    window.settings?.difficulty || "normal"
  );
  return (
    (INVADER_CONFIG.initialSpeed +
      (baseLevel - 1) * INVADER_CONFIG.speedIncreasePerLevel) *
    difficulty.enemySpeedMultiplier
  );
}

// Fungsi untuk menghitung chance tembakan enemy
function getEnemyShootChance(baseLevel) {
  const difficulty = getDifficultyConfig(
    window.settings?.difficulty || "normal"
  );
  return (
    (INVADER_CONFIG.initialShootChance +
      (baseLevel - 1) * INVADER_CONFIG.shootChanceIncreasePerLevel) *
    difficulty.enemyShootMultiplier
  );
}

// Export semua konfigurasi ke window object agar bisa diakses dari file lain
if (typeof window !== "undefined") {
  window.CANVAS_CONFIG = CANVAS_CONFIG;
  window.PLAYER_CONFIG = PLAYER_CONFIG;
  window.BULLET_CONFIG = BULLET_CONFIG;
  window.INVADER_CONFIG = INVADER_CONFIG;
  window.BOSS_CONFIG = BOSS_CONFIG;
  window.SHIELD_CONFIG = SHIELD_CONFIG;
  window.POWERUP_CONFIG = POWERUP_CONFIG;
  window.GAME_CONFIG = GAME_CONFIG;
  window.AUDIO_CONFIG = AUDIO_CONFIG;
  window.EFFECTS_CONFIG = EFFECTS_CONFIG;
  window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
  window.DIFFICULTY_CONFIG = DIFFICULTY_CONFIG;
  window.CONTROLS_CONFIG = CONTROLS_CONFIG;
  window.LEVEL_CONFIG = LEVEL_CONFIG;

  // Export utility functions
  window.getDifficultyConfig = getDifficultyConfig;
  window.getLevelConfig = getLevelConfig;
  window.getEnemySpeed = getEnemySpeed;
  window.getEnemyShootChance = getEnemyShootChance;
}

// ====================================
// TIPS UNTUK MODIFIKASI
// ====================================
/*
PANDUAN UNTUK PEMULA:

1. MENGUBAH KESULITAN GAME:
   - Edit nilai di DIFFICULTY_CONFIG
   - Ubah PLAYER_CONFIG.startingLives untuk nyawa awal
   - Modifikasi INVADER_CONFIG.initialSpeed untuk kecepatan enemy

2. MENAMBAH POWER-UP BARU:
   - Tambahkan tipe baru di POWERUP_CONFIG.types
   - Tentukan nama, warna, dan symbol

3. MENGUBAH TAMPILAN:
   - Edit EFFECTS_CONFIG.colors untuk warna
   - Ubah CANVAS_CONFIG untuk ukuran layar
   - Modifikasi ukuran objek di *_CONFIG.width/height

4. MENYESUAIKAN AUDIO:
   - Ubah AUDIO_CONFIG.soundTypes untuk efek suara
   - Adjust volume di AUDIO_CONFIG

5. LEVEL DESIGN:
   - Edit LEVEL_CONFIG.progression untuk level khusus
   - Ubah BOSS_CONFIG.appearanceLevel untuk frekuensi boss

6. KONTROL:
   - Modifikasi CONTROLS_CONFIG untuk key binding baru

CONTOH PERUBAHAN MUDAH:
- Untuk game lebih mudah: ubah PLAYER_CONFIG.startingLives = 5
- Untuk enemy lebih lambat: ubah INVADER_CONFIG.initialSpeed = 0.5
- Untuk power-up lebih sering: ubah POWERUP_CONFIG.spawnChance = 0.3
*/
