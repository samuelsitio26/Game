# 🚀 Space Invaders Game

## 📂 File Structure Update

**NEW: Code has been refactored for better maintainability!**

The game code is now split into two main files:

- `config.js` - All game configuration and settings (EASY TO MODIFY)
- `script_fixed.js` - Main game logic and functionality

## 🎮 Live Demo

**[Play the Game Now!](https://samuelsitio26.github.io/Game/)**

Experience the classic Space Invaders gameplay directly in your browser - no downloads required!

## 🔧 Easy Configuration

### Modifying Game Settings (config.js)

The new `config.js` file makes it super easy to customize the game:

```javascript
// Want more lives? Change this:
const PLAYER_CONFIG = {
  startingLives: 5, // Default: 3
};

// Want easier game? Modify this:
const DIFFICULTY_CONFIG = {
  easy: {
    enemySpeedMultiplier: 0.5, // Slower enemies
    playerLives: 10, // More lives
  },
};

// Want different colors? Update this:
const EFFECTS_CONFIG = {
  colors: {
    player: "#ff0000", // Red player ship
    enemy: "#00ff00", // Green enemies
  },
};
```

### Quick Settings You Can Change:

1. **Player Lives**: Edit `PLAYER_CONFIG.startingLives`
2. **Enemy Speed**: Modify `INVADER_CONFIG.initialSpeed`
3. **Power-up Frequency**: Change `POWERUP_CONFIG.spawnChance`
4. **Game Colors**: Update `EFFECTS_CONFIG.colors`
5. **Audio Volume**: Adjust `AUDIO_CONFIG.masterVolume`
6. **Canvas Size**: Modify `CANVAS_CONFIG.width/height`

## Overview

A classic Space Invaders game built with HTML5, CSS3, and JavaScript. Defend Earth from alien invasion in this retro-style arcade game!

## Game Screenshots

### Main Menu

![Main Menu](image/Screenshot%202025-07-23%20080943.png)

The game features an elegant main menu with:

- **Start Mission** button to begin the game
- **Quick Play** option for immediate action
- Navigation tabs for Main, Settings, Controls, and About
- Real-time display of Score, Lives, and Level
- Retro space-themed design with animated starfield background

### Gameplay

![Gameplay](image/Screenshot%202025-07-23%20080921.png)

Active gameplay showing:

- Player spaceship at the bottom (blue ship)
- Enemy invaders descending from the top
- Bullet projectiles flying across the screen
- Boss enemy with health bar (30/30)
- Real-time score tracking and game statistics
- Mouse control indicator in the UI

## Features

### 🎮 Game Mechanics

- **Classic Space Invaders gameplay** - Shoot alien invaders before they reach Earth
- **Progressive difficulty** - Enemies become faster and more numerous as levels advance
- **Boss battles** - Face powerful boss enemies with health bars
- **Multiple lives system** - Start with 3 lives, lose one when hit by enemies
- **Score system** - Earn points for destroying enemies and completing levels

### 🎯 Controls

- **Mouse control** - Move your spaceship with mouse movement
- **Click to shoot** - Fire bullets by clicking
- **Keyboard support** - Alternative controls available

### 🎨 Visual Design

- **Retro space theme** - Dark space background with twinkling stars
- **Neon UI elements** - Green glowing interface with futuristic styling
- **Smooth animations** - Fluid movement and particle effects
- **Responsive design** - Adapts to different screen sizes

### 🔧 Technical Features

- **Pure HTML5/CSS3/JavaScript** - No external dependencies
- **Canvas-based rendering** - Smooth 60fps gameplay
- **Local high score tracking** - Best scores saved locally
- **Multiple game modes** - Mission mode and Quick Play options

## How to Play

1. **Launch the game** by opening `index.html` in your web browser
2. **Click "Start Mission"** from the main menu to begin
3. **Move your spaceship** using your mouse
4. **Click to shoot** bullets at the descending alien invaders
5. **Avoid enemy fire** - Don't let enemy bullets hit your ship
6. **Defeat the boss** - Each level ends with a boss battle
7. **Progress through levels** - Complete objectives to advance

## Game Stats Display

The game features a comprehensive HUD showing:

- **Score**: Current points earned
- **Lives**: Remaining lives (starts at 3)
- **Level**: Current level progression
- **Best Score**: Personal high score record
- **Boss Health**: Health bar for boss enemies

## 👨‍💻 Developer Guide

### File Structure

```
Game/
├── index.html          # Main HTML file
├── style.css          # Game styling and animations
├── config.js          # 🎯 GAME CONFIGURATION (EDIT THIS!)
├── script_fixed.js    # Main game logic
├── song/              # Audio files
└── image/             # Game screenshots
```

### For Beginners: Modifying the Game

**Start with `config.js`** - this file contains all the settings you can easily change:

#### 1. Make the Game Easier

```javascript
// In config.js, find DIFFICULTY_CONFIG and modify:
easy: {
  enemySpeedMultiplier: 0.3,  // Much slower enemies
  enemyShootMultiplier: 0.2,  // Less enemy shooting
  playerLives: 10,            // More lives
  powerUpChance: 0.5          // More power-ups
}
```

#### 2. Change Game Appearance

```javascript
// Colors in EFFECTS_CONFIG:
colors: {
  player: "#ff0000",          // Red player
  enemy: "#ffff00",           // Yellow enemies
  background: "#000080"       // Dark blue background
}
```

#### 3. Adjust Game Speed

```javascript
// In PLAYER_CONFIG:
speed: 10,  // Faster player movement (default: 7)

// In INVADER_CONFIG:
initialSpeed: 0.5,  // Slower enemies (default: 1)
```

#### 4. Modify Power-ups

```javascript
// In POWERUP_CONFIG:
duration: 1200,      // Power-ups last longer (default: 600)
spawnChance: 0.3     // More frequent power-ups (default: 0.15)
```

#### 5. Change Audio Settings

```javascript
// In AUDIO_CONFIG:
masterVolume: 0.5,        // Louder audio (default: 0.3)
soundEffectsVolume: 0.8   // Louder sound effects
```

### Advanced Modifications

For more complex changes, edit `script_fixed.js`:

- **New enemy types**: Modify the `Invader` class
- **New weapons**: Add cases to the weapon switch in Player.shoot()
- **New game modes**: Modify the game state logic
- **Custom levels**: Edit the `createInvaders()` function

### Configuration Tips

1. **Always backup** files before making changes
2. **Test incrementally** - change one thing at a time
3. **Use browser developer tools** to debug errors
4. **Check browser console** for error messages
5. **Start with small values** when experimenting

### Common Modifications

- **God Mode**: Set `godMode: true` in DEFAULT_SETTINGS
- **Infinite Lives**: Set `startingLives: 999` in PLAYER_CONFIG
- **Super Speed**: Increase `speed` values in configs
- **Rainbow Mode**: Modify color arrays in EFFECTS_CONFIG

## Installation & Setup

1. Clone or download this repository
2. Open `index.html` in any modern web browser
3. No additional setup required - the game runs entirely in the browser!

## Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## Game Files Structure

```
Game/
├── index.html          # Main game file
├── script.js           # Game logic and mechanics
├── script_fixed.js     # Alternative/fixed version
├── style.css           # Game styling and animations
├── Readme.md           # This documentation
└── image/              # Game screenshots
    ├── Screenshot 2025-07-23 080921.png  # Gameplay screenshot
    └── Screenshot 2025-07-23 080943.png  # Main menu screenshot
```

## Contributing

Feel free to contribute to this project by:

- Reporting bugs
- Suggesting new features
- Improving game mechanics
- Enhancing visual effects
- Optimizing performance

## License

This project is open source. Feel free to use, modify, and distribute as needed.

---

**Enjoy defending Earth from the alien invasion! 🛸👾**
