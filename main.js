const words =
  "The orange clock rested beside a notebook filled with unfinished thoughts, its hands pointing to a forgotten hour. A silver umbrella leaned against the corner of the wall, waiting for a rain that might never come, its fabric still smelling of last autumn's storms. People often forget how strange time feels when nothing is urgent, how it pools in quiet rooms like spilled water. The coffee on the table had gone cold, but its aroma still lingered like a quiet reminder of a conversation that ended too soon. Someone had left a map folded under a glass of water, the edges curling slightly as continents slowly drowned. Birds outside argued in short bursts of sound that blended with the hum of distant traffic, a symphony of elsewhere. A man in a red coat crossed the street without looking, a flash of primary color in a grayscale afternoon. His shadow stretched longer than it should, bending around a puddle that reflected a single, defiant patch of blue sky. Somewhere nearby, a child laughed at something invisible, holding a balloon that drifted lazily in the wind, a tether to a simpler gravity. The street vendor adjusted his hat, counted a few coins, and started humming an old tune his father once sang. None of it mattered much, but it all somehow felt connected, a web of fragile, simultaneous existences. A door creaked open, and a faint echo rolled through the hallway, carrying the scent of other lives. The air smelled faintly of paper and dust, like an old library that had forgotten the last visitor, the stories slowly settling. Someone dropped a pen, and it rolled beneath a chair, spinning slowly before stopping, its purpose suspended. The television in the next room mumbled about weather patterns and late-night headlines, a ghost narrating the world. A cat stared at the screen as if it understood every word, its tail twitching at the silent commas. In another part of the city, a train screeched to a stop, a metallic sigh of relief. Passengers shuffled, half-asleep, clutching bags filled with ordinary lives and unspoken regrets. Lights flickered across glass windows, creating momentary patterns that disappeared as quickly as they formed, a cinema for no one. A poster on the wall announced something exciting, but no one seemed to read it, the letters fading in the sun. Somewhere else, a clock struck three, though it wasn't clear if it was morning or afternoon, a chime lost in time. A phone vibrated, but no one picked up, its tiny light pulsing like a silent alarm. Rain began to fall in hesitant drops, tracing slow paths down windowpanes, drawing temporary maps. The world outside blurred into a series of gentle motions—small, unrelated, but strangely human, a dance of accident and intention. A leaf clung to the edge of the railing, trembling in the wind, unsure whether to fall or stay, a perfect model of indecision. A forgotten glove lay on a park bench, its fingers curled into a empty grasp. A woman on a balcony watered her plants, each drop a tiny prism catching the weak light. In a cafe, steam rose from a cup, carrying with it the ghost of a sigh. A book lay face down on a sofa, preserving a sentence for an unknown duration. A streetlight flickered on early, challenging the dusk with its orange glow. A bicycle leaned against a fence, one wheel spinning slowly, propelled by a gust of wind. Through an open window, a radio played a static-laced song from another decade. A man tied his shoe, double-knotting it with unnecessary force. A paper bag tumbled down the street, performing a chaotic ballet before catching on a grate. A couple sat in silence on a bus, their shoulders almost touching. A fly buzzed against a windowpane, persistent in its confusion. A shopkeeper arranged fruit into a bright, precarious pyramid. A cloud passed before the sun, and the world momentarily dimmed. A child drew on the pavement with chalk, creating a universe that the next rain would erase. A siren wailed in the distance, a rising and falling note of emergency. An old man fed pigeons, his pockets full of crumbs and quiet generosity. A neon sign sputtered, its message incomplete. A moth batted against a bare bulb, captivated by its own destruction. A puddle perfectly reflected a neon sign, upside down and brilliant. Someone whistled a few notes of a song, then stopped. A screen door slammed shut, the sound echoing in the quiet alley. A single set of footprints marked the damp sand before being washed away. A traffic light turned from red to green, and nothing moved. The moon was visible in the afternoon sky, a pale and distant spectator. A receipt fluttered from a trash can, a brief record of a minor transaction. A man checked his watch, though he had nowhere to be. A woman paused mid-stride to look at the sky, as if searching for an answer. The wind chimes on a porch played a random, gentle melody. A drop of condensation raced its peers down the side of a glass. In a high-rise, a single light burned in the twilight. A dog barked once, then settled back into silence. The photocopier in an office hummed and flashed, replicating something unimportant. A key turned in a lock, a solid, satisfying sound of arrival. A curtain billowed inward, filled with the breath of the outside world. Someone shuffled a deck of cards, the sound a soft riffling of potential. A fire escape ladder cast a shadow like a cage on the brick wall. The ice in a glass shifted, settling into a new configuration. A street sweeper passed, its brushes whirring against the asphalt. A light in a refrigerator went out as the door closed. A notification appeared on a phone, glowed for a moment, and then faded away. All of it was happening at once, a chorus of the mundane, beautiful in its indifference."
    .replace(/[.,—–!?'"""]/g, "")
    .split(/\s+/);

const wordsCount = words.length;
let spaceTimeTrigger = false;

let gameTime = 30 * 1000;
window.timer = null;
window.gameStart = null;

const options = [30, 60, 120, 180];

// Cache DOM elements
const container = document.getElementById("numbers");
const wordsContainer = document.getElementById("words");
const cursor = document.getElementById("cursor");
const gameElement = document.getElementById("game");
const infoElement = document.getElementById("info");

function disableNumbers() {
  document.querySelectorAll(".number").forEach((btn) => {
    btn.classList.add("disabled");
    btn.style.pointerEvents = "none";
    btn.style.opacity = "0.5";
  });
}

// function enableNumbers() {
//   document.querySelectorAll(".number").forEach((btn) => {
//     btn.classList.remove("disabled", "active");
//     btn.style.pointerEvents = "auto";
//     btn.style.opacity = "1";
//   });
// }

options.forEach((value) => {
  const box = document.createElement("div");
  box.className = "number";
  box.innerText = value;

  box.addEventListener("click", () => {
    window.gameEvent = value;
    gameTime = value * 1000;

    document
      .querySelectorAll(".number")
      .forEach((n) => n.classList.remove("active"));
    box.classList.add("active");
    
    infoElement.innerHTML = value;
    console.log(value)

    newGame();
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

function formatWord(word) {
  return `<div class="word"><span class="letter">${word
    .split("")
    .join('</span><span class="letter">')}</span></div> `;
}

function addClass(element, name) {
  if (!element) return;
  element.className += " " + name;
}

function removeClass(element, name) {
  if (!element) return;
  element.classList.remove(name);
}

function appendWords(count) {
  const fragment = document.createDocumentFragment();
  const tempDiv = document.createElement("div");
  
  for (let i = 0; i < count; i++) {
    tempDiv.innerHTML = formatWord(randomWord());
    fragment.appendChild(tempDiv.firstChild);
  }
  
  wordsContainer.appendChild(fragment);
}

function newGame() {
  wordsContainer.innerHTML = "";
  
  // Start with just 100 words - more will be added dynamically
  appendWords(100);

  addClass(document.querySelector(".word"), "current");
  addClass(document.querySelector(".letter"), "current");

  // enableNumbers();

  window.timer = null;
  window.gameStart = null;
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

let keystrokeCount = 0;

gameElement.addEventListener("keydown", (e) => {
  const key = e.key;
  const currentWord = document.querySelector(".word.current");
  const currentLetter = document.querySelector(".letter.current");
  const expected = currentLetter?.innerHTML || " ";
  const isLetter = key.length === 1 && key !== " ";

  const isSpace = key === " ";
  const isBackSpace = key === "Backspace";
  const isFirstLetter = currentLetter === currentWord?.firstChild;

  // Timer
  if (!window.timer && isLetter) {
    disableNumbers();
    window.timer = setInterval(() => {
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
      infoElement.textContent = sLeft;
    }, 1000);
  }

  if (document.querySelector("#game.over")) {
    return;
  }

  if (isLetter) {
    spaceTimeTrigger = true;
    if (currentLetter) {
      addClass(currentLetter, key === expected ? "correct" : "incorrect");
      removeClass(currentLetter, "current");
      if (currentLetter.nextSibling) {
        addClass(currentLetter.nextSibling, "current");
      }
    } else {
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
      const lettersToInValided = [
        ...document.querySelectorAll(".word.current .letter:not(.correct)"),
      ];
      lettersToInValided.forEach((letter) => {
        addClass(letter, "incorrect");
      });
    }

    removeClass(currentWord, "current");
    addClass(currentWord?.nextElementSibling, "current");
    if (currentLetter) {
      removeClass(currentLetter, "current");
    }
    addClass(currentWord?.nextElementSibling?.firstChild, "current");
  }

  if (isBackSpace) {
    if (currentLetter && !isFirstLetter) {
      const prev = currentLetter.previousSibling;
      removeClass(currentLetter, "current");
      addClass(prev, "current");

      if (currentLetter.classList.contains("extra")) {
        currentLetter.remove();
      } else {
        prev.classList.remove("incorrect", "correct");
      }
    } else if (
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
    } else if (!currentLetter) {
      const last = currentWord.lastChild;
      addClass(last, "current");

      if (last.classList.contains("extra")) {
        last.remove();
      } else {
        last.classList.remove("incorrect", "correct");
      }
    }
  }

  // Move the lines/words
  if (currentWord && currentWord.getBoundingClientRect().top > 395) {
    const margin = parseInt(wordsContainer.style.marginTop || "0", 10);
    wordsContainer.style.marginTop = margin - 35 + "px";
  }

  // Infinite word generation - check every 3 keystrokes
  if (++keystrokeCount % 3 === 0 && currentWord) {
    const containerBottom = wordsContainer.getBoundingClientRect().bottom;
    const cursorTop = currentWord.getBoundingClientRect().top;
    
    if (containerBottom - cursorTop < 300) {
      appendWords(50);
    }
  }

  // Move the cursor
  const nextLetter = document.querySelector(".letter.current");
  const nextWord = document.querySelector(".word.current");
  
  if (nextLetter) {
    const rect = nextLetter.getBoundingClientRect();
    cursor.style.top = rect.top + 2 + "px";
    cursor.style.left = rect.left + "px";
  } else if (nextWord) {
    const rect = nextWord.getBoundingClientRect();
    cursor.style.top = rect.top + 2 + "px";
    cursor.style.left = rect.right + "px";
  }
});

document.getElementById("newGame").addEventListener("click", () => {
  window.location.reload();
});

newGame();

function storeScore(wpm) {
  if (wpm === undefined) {
    fetchSpeeds();
    return;
  }

  let scores = JSON.parse(localStorage.getItem("shifty-scores")) || [];
  
  const timestamp = new Date().toISOString();
  
  scores.push({ wpm: Math.round(wpm), time: (gameTime/1000), timestamp });
  
  scores.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  scores = scores.slice(0, 5);
  
  localStorage.setItem("shifty-scores", JSON.stringify(scores));
  
  fetchSpeeds();
}

function fetchSpeeds() {
  const ul = document.querySelector(".speed-container ul");
  ul.innerHTML = '';
  
  const scores = JSON.parse(localStorage.getItem("shifty-scores")) || [];
  
  if (scores.length > 0) {
    scores.forEach((score) => {
      const listItem = document.createElement("li");
      
      const date = new Date(score.timestamp);
      const formattedDate = date.toLocaleDateString();
      
      listItem.innerText = `WPM: ${Math.round(score.wpm)} - Time: ${score.time}s`;
      ul.appendChild(listItem);
    });
  } else {
    const listItem = document.createElement("li");
    listItem.innerText = "No scores yet";
    listItem.style.opacity = "0.7";
    ul.appendChild(listItem);
  }
}

function gameOver() {
  clearInterval(window.timer);
  addClass(gameElement, "over");
  const score = getWpm();
  const roundedScore = Math.round(score);
  infoElement.innerHTML = `WPM: ${roundedScore}`;
  storeScore(roundedScore);
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
    gameElement.focus();
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
  
  setupEventListeners();
  checkMobile();
  
  return checkMobile;
}

const checkMobile = initMobileUI();

window.addEventListener('load', checkMobile);