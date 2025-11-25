# 🎯 Crow Shooter Game

A fun and engaging browser-based shooting game where players shoot down flying crows before they escape off the screen. Features responsive design for both desktop and mobile devices with device-specific controls and instructions.

![Game Preview](https://img.shields.io/badge/Platform-Web-blue) ![HTML5](https://img.shields.io/badge/HTML5-Canvas-orange) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)

## 🎮 Game Features

- **Interactive Welcome Screen** - Professional onboarding experience
- **Device Selection** - Choose between Mobile or PC for optimized gameplay
- **Device-Specific Instructions** - Tailored guidance for each platform
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Orientation Lock** - Mobile users are prompted to play in landscape mode
- **Touch & Click Support** - Tap on mobile, click on desktop
- **Sprite Animation** - Smooth flying crow animations with wing flapping
- **Explosion Effects** - Visual feedback when hitting targets
- **Score Tracking** - Keep track of your performance
- **Play Again Feature** - Instant restart without page reload

## 🚀 How to Play

### Starting the Game
1. Click **NEXT** on the welcome screen
2. Select your device type (**Mobile** or **PC**)
3. Read the instructions specific to your device
4. Click **START GAME** to begin

### Gameplay
- **Objective**: Shoot down as many crows as possible
- **Controls**: 
  - 🖱️ **PC**: Click on crows with your mouse
  - 👆 **Mobile**: Tap on crows with your finger
- **Warning**: Don't let crows escape off the left side of the screen - it's game over!
- **Scoring**: Each crow you hit increases your score by 1

### Game Over
- When a crow escapes, the game ends
- Your final score is displayed
- Click **PLAY AGAIN** to restart immediately

## 📁 Project Structure

```
crow-shooter-game/
│
├── index.html         # Main HTML file
├── style.css          # For styling the page
├── script.js          # The game logic goes here
├── raven.png          # Crow sprite sheet (271x194 per frame, 5 frames)
├── boom.png           # Explosion sprite sheet (200x179 per frame, 6 frames)
└── README.md          # This file
```

## 🛠️ Setup & Installation

### Quick Start
1. Clone this repository:
```bash
git clone https://github.com/yourusername/crow-shooter-game.git
cd crow-shooter-game
```

2. Add the required sprite images:
   - `raven.png` - Crow sprite sheet with 5 animation frames
   - `boom.png` - Explosion sprite sheet with 6 animation frames

3. Open `index.html` in your web browser:
```bash
# On macOS
open index.html

# On Linux
xdg-open index.html

# On Windows
start index.html
```

### Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No additional dependencies or build tools required
- Sprite images (raven.png and boom.png)

## 🎨 Customization

### Adjusting Difficulty
Edit the following variables in the JavaScript section:

```javascript
let ravenInterval = 500;  // Time between spawns (ms) - lower = harder
this.directionX = Math.random() * 5 + 3;  // Crow speed - higher = harder
```

### Changing Colors
Modify the CSS gradient in the `<style>` section:

```css
background: linear-gradient(to top, rgb(195, 234, 237), rgb(93, 179, 255), rgb(0, 102, 255));
```

### Canvas Size
The canvas automatically adjusts to window size, but you can set custom dimensions:

```javascript
canvas.width = 1920;  // Custom width
canvas.height = 1080; // Custom height
```

## 🎯 Technical Details

### Technologies Used
- **HTML5 Canvas** - For rendering graphics and animations
- **Vanilla JavaScript** - No frameworks or libraries
- **CSS3** - For styling and gradients
- **Touch Events API** - For mobile touch support

### Game Mechanics
- **Collision Detection** - Uses pixel-perfect color detection on a hidden canvas
- **Sprite Animation** - Frame-based animation system for smooth visuals
- **Delta Time** - Frame-rate independent animation timing
- **Object Pooling** - Efficient memory management for game objects

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📱 Mobile Features

- **Orientation Detection** - Prompts users to rotate to landscape
- **Touch Events** - Native touch support without delays
- **Responsive Canvas** - Automatically adjusts to screen size
- **No Zoom** - Prevents pinch-to-zoom for better gameplay
- **No Scroll** - Disables scrolling during gameplay

## 🐛 Known Issues

- Sprite images must be in the same directory as the HTML file
- Game pauses when browser tab is not active (by design)
- Very old browsers may not support HTML5 Canvas

## 🤝 Contributing

Contributions are welcome! Here are some ways you can contribute:

1. 🐛 Report bugs
2. 💡 Suggest new features
3. 🔧 Submit pull requests
4. 📖 Improve documentation

### Steps to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- Sprite animation technique inspired by classic 2D game development
- HTML5 Canvas tutorials from MDN Web Docs
- Mobile-first design principles

## 📧 Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter) - your.email@example.com

Project Link: [https://github.com/yourusername/crow-shooter-game](https://github.com/yourusername/crow-shooter-game)

---

### 🎮 Demo

Play the live demo: [Your GitHub Pages URL]

---

### ⭐ Star this repository if you found it helpful!

**Made with ❤️ and JavaScript**
