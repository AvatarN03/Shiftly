# **Shiftly — Minimalistic Typing Speed Game**

Shiftly is a lightweight, distraction-free typing speed test built entirely with **HTML**, **CSS**, and **JavaScript**.
It generates a continuous stream of words and measures how fast and accurately you can type within a selected time duration.

No frameworks. No dependencies. Just a clean UI and smooth typing experience.

---

## **🚀 Features**

- ⌨️ **Real-time typing test** with instant feedback
- 🕒 **Multiple timer options** — 30s, 60s, 120s, 180s
- 🔄 **Infinite word generation** — never runs out of words
- 📊 **WPM (Words Per Minute) measurement**
- 💾 **Score history** — tracks your last 5 attempts
- 📱 **Mobile support** — works with external keyboards
- ⚡ **Runs offline** — no internet required
- 🧩 **Fully customizable** word list & timer values

---

## **📂 Project Structure**

```
Shiftly/
├── index.html          # Semantic application shell
├── css/                # Modular Shiftly 2.0 stylesheets
│   ├── variables.css
│   ├── base.css
│   ├── shell.css
│   ├── typing.css
│   ├── result.css
│   ├── settings.css
│   └── dev-toolbar.css
├── js/                 # Empty implementation modules to be authored
│   ├── types.js
│   ├── words.js
│   ├── sound.js
│   ├── state.js
│   ├── typing-engine.js
│   ├── result-renderer.js
│   ├── settings.js
│   ├── dev-toolbar.js
│   └── main.js
├── assets/             # Icons and images
├── AGENT.md            # Shiftly 2.0 engineering specification
└── README.md           # Project documentation
```

---

## **🛠️ Technologies Used**

- **HTML5** – UI structure
- **CSS3** – Styling, layout, responsiveness
- **JavaScript (Vanilla JS)** – Logic, timers, input handling, scoring
- **LocalStorage** – Score persistence

---

## **📸 User Interface Overview**

- Displays a continuous stream of words in a clean layout
- Highlights current word and letter being typed
- Shows countdown timer during gameplay
- Presents WPM score when time expires
- Displays score history of last 5 attempts

---

## **🎮 How to Play**

1. Open the website (`index.html`) in your browser
2. Choose a timer duration (30 / 60 / 120 / 180 seconds)
3. Click on the game area to start (keyboard will auto-focus)
4. Type the words exactly as shown on screen
5. Press **space** after each word to move to the next
6. Use **backspace** to correct mistakes
7. When time ends, your WPM score is displayed and saved

---

## **🧠 How It Works (Under the Hood)**

### **Word Stream**
The JS file contains a large paragraph of text, cleaned and split into words:

```javascript
const words =
  "The orange clock rested beside a notebook filled with..." 
    .replace(/[.,—–!?'"""]/g, "")  // Remove punctuation
    .split(/\s+/);                  // Split by whitespace
```

### **Infinite Word Generation**
Words are dynamically appended as you type, ensuring you never run out:

```javascript
// Checks every 3 keystrokes if more words are needed
if (containerBottom - cursorTop < 300) {
  appendWords(50);  // Adds 50 more words
}
```

### **Game Timer**

```javascript
const options = [30, 60, 120, 180];  // Timer options in seconds
let gameTime = 30 * 1000;            // Default: 30 seconds
```

### **Gameplay Flow**
1. Timer starts when user begins typing
2. Letters are marked as correct (green) or incorrect (red)
3. Words auto-scroll as you progress
4. WPM is calculated based on correctly typed words
5. Score is saved to localStorage for history tracking

### **WPM Calculation**

```javascript
WPM = (correctWords / gameTime) * 60000
```

---

## **🎨 Customization**

### **Modify Timer Options**
In `main.js`:

```javascript
const options = [30, 60, 120, 180];  // Add or remove values
```

### **Customize Word List**
Change the paragraph at the top of `main.js`:

```javascript
const words = "your custom text here"
  .replace(/[.,—–!?'"""]/g, "")
  .split(/\s+/);
```

### **Adjust Word Generation**
Modify how many words are initially loaded and dynamically added:

```javascript
// In newGame()
appendWords(100);  // Initial word count

// In infinite scroll check
appendWords(50);   // Words added each time
```

### **Styling**
UI layout and visuals are split across the files in `css/`. Load them in this order: `variables.css`, `base.css`, `shell.css`, `typing.css`, `result.css`, `settings.css`, then `dev-toolbar.css`.

---

## **📱 Mobile Support**

- Auto-detects mobile devices
- Prompts user to connect external keyboard
- Hidden input element triggers mobile keyboard
- All keystrokes are captured and processed

---

## **💾 Score History**

- Automatically saves last 5 scores to localStorage
- Displays WPM and time duration for each attempt
- Sorted by most recent first
- Persists across browser sessions

---

## **🧪 Future Enhancements**

- Global leaderboard (backend integration)
- Dark mode toggle
- Difficulty levels (common words vs advanced vocabulary)
- ustom text/paragraph import
- WPM graph visualization over time
- Accuracy percentage display
- Sound effects for correct/incorrect typing
- Practice mode (no timer)

---

## **🚀 Getting Started**

### **Run Locally**

1. Clone or download this repository
2. Open `index.html` in any modern browser
3. Start typing!

### **Deploy**

Host on any static site platform:
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

---

## **🤝 Contributing**

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

## **📜 License**

This project is open-source and available under the **MIT License**.

---

## **👨‍💻 Author**

Built with ❤️ by Prashanth Naidu

---

**Happy Typing! ⌨️