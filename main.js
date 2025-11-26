const words =
  "The orange clock rested beside a notebook filled with unfinished thoughts. A silver umbrella leaned against the corner of the wall, waiting for a rain that might never come. People often forget how strange time feels when nothing is urgent. The coffee on the table had gone cold, but its aroma still lingered like a quiet reminder. Someone had left a map folded under a glass of water, the edges curling slightly. Birds outside argued in short bursts of sound that blended with the hum of distant traffic. A man in a red coat crossed the street without looking. His shadow stretched longer than it should, bending around a puddle that reflected a patch of blue sky. Somewhere nearby, a child laughed at something invisible, holding a balloon that drifted lazily in the wind. The street vendor adjusted his hat, counted a few coins, and started humming an old tune. None of it mattered much, but it all somehow felt connected. A door creaked open, and a faint echo rolled through the hallway. The air smelled faintly of paper and dust, like an old library that had forgotten the last visitor. Someone dropped a pen, and it rolled beneath a chair, spinning slowly before stopping. The television in the next room mumbled about weather patterns and late-night headlines. A cat stared at the screen as if it understood every word. In another part of the city, a train screeched to a stop. Passengers shuffled, half-asleep, clutching bags filled with ordinary lives. Lights flickered across glass windows, creating momentary patterns that disappeared as quickly as they formed. A poster on the wall announced something exciting, but no one seemed to read it. Somewhere else, a clock struck three, though it wasn’t clear if it was morning or afternoon. A phone vibrated, but no one picked up. Rain began to fall in hesitant drops, tracing slow paths down windowpanes. The world outside blurred into a series of gentle motions—small, unrelated, but strangely human. A leaf clung to the edge of the railing, trembling in the wind, unsure whether to fall or stay."
    .replace(/[.,—–!?'"“”]/g, "") // remove punctuation
    .split(/\s+/); // split by any whitespace

const wordsCount = words.length;
let spaceTimeTrigger = false;


let gameTime = 30 * 1000;
// you can add the custom objects to window to handle
window.timer = null;
window.gameStart = null;

const options = [30, 60, 120, 180];

const container = document.getElementById("numbers");

function disableNumbers() {
  document.querySelectorAll(".number").forEach((btn) => {
    btn.classList.add("disabled");
    btn.style.pointerEvents = "none";
    btn.style.opacity = "0.5";
  });
}

function enableNumbers() {
  document.querySelectorAll(".number").forEach((btn) => {
    btn.classList.remove("disabled", "active");
    btn.style.pointerEvents = "auto";
    btn.style.opacity = "1";
  });
}

options.forEach((value) => {
  const box = document.createElement("div");
  box.className = "number";
  box.innerText = value;

  box.addEventListener("click", () => {
    window.gameEvent = value;
    gameTime = value * 1000;

    // Update UI
    document
      .querySelectorAll(".number")
      .forEach((n) => n.classList.remove("active"));
    box.classList.add("active");

    // Update info instantly
    document.getElementById("info").innerText = value;
  });

  container.appendChild(box);
});
setTimeout(() => {
  container.firstElementChild.classList.add("active");
}, 0);

function randomWord() {
  const randomIndex = Math.floor(Math.random() * wordsCount);

  return words[randomIndex];
}

//inserting the word in span
function formatWord(word) {
  return `<div class="word"><span class="letter">${word
    .split("")
    .join('</span><span class="letter">')}</span></div> `;
}

function addClass(element, name) {
  element.className += " " + name;
}

function removeClass(element, name) {
  if (!element) return;
  element.classList.remove(name);
  // replace was the good logic too
}

function newGame() {
  document.getElementById("words").innerHTML = "";
  for (let i = 0; i < 200; i++) {
    document.getElementById("words").innerHTML += formatWord(randomWord());
  }

  addClass(document.querySelector(".word"), "current");
  addClass(document.querySelector(".letter"), "current");

  // Reset info text
  document.getElementById("info").innerHTML = "30";

  // Allow selecting timer again
  window.gameEvent = 30;
  enableNumbers();

  window.timer = null;
}

function getWpm() {
  const words = [...document.querySelectorAll(".word")];
  const lastTypedWord = document.querySelector(".word.current");
  const lastTypedWordIndex = words.indexOf(lastTypedWord);
  const typedWords = words.slice(0, lastTypedWordIndex);
  const correctWords = typedWords.filter((word) => {
    const letters = [...word.children];
    const incorrectLetters = letters.filter((letter) =>
      letter.className.includes("incorrect")
    );
    const correctLetters = letters.filter((letter) =>
      letter.className.includes("correct")
    );

    return (
      incorrectLetters.length === 0 && correctLetters.length === letters.length
    );
  });
  return (correctWords.length / gameTime) * 60000;
}

document.getElementById("game").addEventListener("keydown", (e) => {
  const key = e.key;
  const currentWord = document.querySelector(".word.current");
  const currentLetter = document.querySelector(".letter.current");
  const expected = currentLetter?.innerHTML || " ";
  const isLetter = key.length === 1 && key !== " ";

  const isSpace = key === " ";
  const isBackSpace = key === "Backspace";
  const isFirstLetter = currentLetter === currentWord?.firstChild;

  //timer
  // isLetter check for the input is for the words related instead of Ctrl+R it will start then
  if (!window.timer && isLetter) {
    // ⛔ Disable time selection now
    disableNumbers();
    window.timer = setInterval(() => {
      console.log(window.gameStart);
      if (!window.gameStart) {
        window.gameStart = new Date().getTime();
      }
      const currentTime = new Date().getTime();
      const msPassed = currentTime - window.gameStart;
      const sPassed = parseInt(msPassed / 1000);
      const sLeft = Math.floor(gameTime / 1000) - sPassed;
      if (sLeft <= 0) {
        gameOver();
        return;
      }
      document.getElementById("info").innerHTML = sLeft;
    }, 1000);
  }

  // when the game is over then stop the script to execute
  if (document.querySelector("#game.over")) {
    return;
  }

  if (isLetter) {
    spaceTimeTrigger = true;
    if (currentLetter) {
      addClass(currentLetter, key === expected ? "correct" : "incorrect");
      removeClass(currentLetter, "current");
      // New concept learned the sibling
      if (currentLetter.nextSibling) {
        addClass(currentLetter.nextSibling, "current");
      }
    } else {
      // if the word is typed full and the user is typing without the space then the typed word will be appended in that word

      const incorrectLetter = document.createElement("span");
      incorrectLetter.innerHTML = key;
      incorrectLetter.className = "letter incorrect extra";
      if (currentWord) {
        currentWord.appendChild(incorrectLetter);
      }
    }
  }

  if (isSpace && spaceTimeTrigger) {
    if (expected != " ") {
      // learned the not childs to avoid , cool man
      // converting the object to array
      const lettersToInValided = [
        ...document.querySelectorAll(".word.current .letter:not(.correct)"),
      ];
      // looping
      lettersToInValided.forEach((letter) => {
        addClass(letter, "incorrect");
      });
    }

    removeClass(currentWord, "current");
    addClass(currentWord?.nextElementSibling, "current");
    if (currentLetter) {
      removeClass(currentLetter, "current");
    }
    addClass(currentWord?.nextElementSibling.firstChild, "current");
  }

  if (isBackSpace) {
    // Case 1: inside the word but not first letter
    if (currentLetter && !isFirstLetter) {
      const prev = currentLetter.previousSibling;
      removeClass(currentLetter, "current");
      addClass(prev, "current");

      // If this letter was an extra typed letter → remove the element
      if (currentLetter.classList.contains("extra")) {
        currentLetter.remove();
      } else {
        prev.classList.remove("incorrect", "correct");
      }
    }

    // Case 2: first letter → move to previous word
    else if (
      currentLetter &&
      isFirstLetter &&
      currentWord.previousElementSibling
    ) {
      removeClass(currentWord, "current");
      addClass(currentWord.previousElementSibling, "current");
      removeClass(currentLetter, "current");

      const prevLast = currentWord.previousElementSibling.lastChild;
      addClass(prevLast, "current");
      prevLast.classList.remove("incorrect", "correct");
    }

    // Case 3: no currentLetter → cursor after end of word
    else if (!currentLetter) {
      const last = currentWord.lastChild;
      addClass(last, "current");

      if (last.classList.contains("extra")) {
        last.remove();
      } else {
        last.classList.remove("incorrect", "correct");
      }
    }
  }

  //move the lines / words
  if (currentWord.getBoundingClientRect().top > 395) {
    const wordsContainer = document.getElementById("words");
    const margin = parseInt(wordsContainer.style.marginTop || "0", 10);
    wordsContainer.style.marginTop = margin - 35 + "px";
  }

  // move the cursor
  const nextLetter = document.querySelector(".letter.current");
  const nextWord = document.querySelector(".word.current");
  const cursor = document.getElementById("cursor");
  if (nextLetter) {
    cursor.style.top = nextLetter.getBoundingClientRect().top + 2 + "px";
    cursor.style.left = nextLetter.getBoundingClientRect().left + "px";
  } else {
    cursor.style.top = nextWord.getBoundingClientRect().top + 2 + "px";
    cursor.style.left = nextWord.getBoundingClientRect().right + "px"; // to move the cursor to the end of the word
  }
});

document.getElementById("newGame").addEventListener("click", () => {
  window.location.reload();
});

newGame();

function storeScore(wpm) {
  // If no WPM provided, just fetch and display existing scores
  if (wpm === undefined) {
    fetchSpeeds();
    return;
  }

  // Get existing scores from localStorage
  let scores = JSON.parse(localStorage.getItem("shifty-scores")) || [];
  
  const timestamp = new Date().toISOString();
  
  // Add new score
  scores.push({ wpm: Math.round(wpm), time: (gameTime/1000),  timestamp });
  
  // Sort scores by timestamp in descending order (newest first)
  scores.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Keep only the last 5 scores
  scores = scores.slice(0, 5);
  
  // Save back to localStorage
  localStorage.setItem("shifty-scores", JSON.stringify(scores));
  
  // Update the display
  fetchSpeeds();
}

function fetchSpeeds() {
  // Clear previous list items
  const ul = document.querySelector(".speed-container ul");
  ul.innerHTML = '';
  
  // Get scores from localStorage
  const scores = JSON.parse(localStorage.getItem("shifty-scores")) || [];
  
  if (scores.length > 0) {
    // Display scores in descending order (newest first)
    scores.forEach((score) => {
      const listItem = document.createElement("li");
      
      // Format the date to show only date (no time)
      const date = new Date(score.timestamp);
      const formattedDate = date.toLocaleDateString(); // Only date, no time
      
      listItem.innerText = `WPM: ${Math.round(score.wpm)} - Time: ${score.time}s`;
      ul.appendChild(listItem);
    });
  } else {
    // Show message if no scores available
    const listItem = document.createElement("li");
    listItem.innerText = "No scores yet";
    listItem.style.opacity = "0.7";
    ul.appendChild(listItem);
  }
}

// Also update the gameOver function to round the WPM
function gameOver() {
  clearInterval(window.timer);
  addClass(document.getElementById("game"), "over");
  const score = getWpm();
  const roundedScore = Math.round(score);
  document.getElementById("info").innerHTML = `WPM: ${roundedScore}`;
  storeScore(roundedScore); // Store rounded score
}

storeScore();



function initMobileUI() {
    const mobileUI = document.getElementById('mobileUI');
    const keyboardStatus = document.getElementById('keyboardStatus');
    const yesBtn = document.getElementById('playAnywayBtn');
    const noBtn = document.getElementById('checkKeyboardBtn');
    
    let initialized = false;
    
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 650;
    }
    
    function hideMobileUI() {
        mobileUI.classList.remove('active');
        document.getElementById('game').focus();
    }
    
    function showMobileUI() {
        mobileUI.classList.add('active');
    }
    
    function setupEventListeners() {
        if (initialized) return;
        
        yesBtn.addEventListener('click', () => {
            keyboardStatus.textContent = "✅ Great! You can play now.";
            keyboardStatus.className = 'keyboard-connected';
            setTimeout(hideMobileUI, 1000);
        });
        
        noBtn.addEventListener('click', () => {
            keyboardStatus.textContent = "🔗 Please connect an external keyboard for better experience";
            keyboardStatus.className = 'keyboard-not-connected';
        });
        
        initialized = true;
    }
    
    function checkMobile() {
        if (isMobileDevice()) {
            showMobileUI();
        } else {
            hideMobileUI();
        }
    }
    
    // Setup events once
    setupEventListeners();
    // Check initial state
    checkMobile();
    
    return checkMobile;
}

// Initialize once
const checkMobile = initMobileUI();

// Only check visibility on resize, don't reinitialize
window.addEventListener('resize', checkMobile);

