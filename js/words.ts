// Curated English vocabulary for natural typing speed practice
export const INITIAL_PASSAGE = [
  "the", "orange", "clock", "rested", "beside", "a", "notebook",
  "filled", "with", "unfinished", "thoughts", "its", "hands",
  "pointing", "to", "a", "forgotten", "hour", "a", "silver",
  "umbrella", "leaned", "against", "the", "corner", "of", "the",
  "wall", "waiting", "for", "the", "rain", "through", "the",
  "tall", "window", "an", "amber", "light", "filtered", "softly",
  "casting", "long", "shadows", "across", "the", "wooden", "floor",
  "each", "keystroke", "echoed", "with", "deliberate", "precision",
  "in", "the", "quiet", "room", "where", "focus", "remained",
  "unbroken", "by", "the", "passing", "moments"
];

export const COMMON_WORDS = [
  "about", "above", "after", "again", "air", "all", "along", "also",
  "always", "another", "answer", "any", "around", "back", "before",
  "begin", "between", "both", "call", "came", "change", "city",
  "close", "come", "could", "country", "day", "different", "does",
  "each", "early", "earth", "end", "even", "every", "example",
  "eyes", "face", "family", "few", "find", "first", "follow", "form",
  "found", "four", "from", "get", "give", "good", "great", "group",
  "grow", "hand", "hard", "have", "head", "hear", "help", "here",
  "high", "home", "house", "idea", "important", "into", "just",
  "keep", "kind", "know", "land", "large", "last", "later", "learn",
  "leave", "left", "life", "light", "line", "little", "live", "look",
  "made", "make", "man", "many", "mean", "might", "mile", "miss",
  "more", "most", "move", "much", "must", "name", "near", "need",
  "never", "new", "next", "night", "number", "often", "once", "open",
  "order", "other", "our", "out", "over", "own", "page", "paper",
  "part", "people", "picture", "place", "plant", "point", "read",
  "right", "river", "run", "same", "school", "sea", "second", "seem",
  "sentence", "set", "several", "side", "small", "some", "something",
  "sound", "spell", "stand", "start", "state", "still", "story",
  "study", "such", "take", "talk", "tell", "than", "that", "their",
  "them", "then", "there", "these", "they", "thing", "think", "this",
  "those", "thought", "three", "through", "time", "together", "too",
  "took", "tree", "turn", "under", "until", "use", "very", "voice",
  "walk", "want", "water", "way", "well", "went", "were", "what",
  "when", "where", "which", "while", "white", "who", "why", "will",
  "with", "without", "word", "work", "world", "would", "write", "year"
];

export const WEAK_SPOTS_WORDS = [
  "thought", "weather", "other", "gather", "further", "leather",
  "there", "their", "breathe", "northern", "southern", "brother",
  "father", "mother", "rather", "feather", "together", "method"
];

let loadedWordPool = COMMON_WORDS;

export async function loadWordList() {
  try {
    const response = await fetch("./data/words-common.json");
    if (!response.ok) throw new Error(`Word list request failed: ${response.status}`);

    const words: unknown = await response.json();
    if (!Array.isArray(words)) throw new Error("Word list must be an array");

    const validWords = words.filter(
      (word): word is string => /^[a-z]+$/.test(word),
    );
    loadedWordPool = Array.from(new Set([...COMMON_WORDS, ...validWords]));
  } catch {
    // The bundled list keeps the app usable offline or when the data file is unavailable.
    loadedWordPool = COMMON_WORDS;
  }
}

export function getRandomWords(count: number, pool = loadedWordPool): string[] {
  const result: string[] = [];
  let previousWord = "";
  for (let i = 0; i < count; i++) {
    let word = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1) {
      while (word === previousWord) {
        word = pool[Math.floor(Math.random() * pool.length)];
      }
    }
    result.push(word);
    previousWord = word;
  }
  return result;
}

export function getDynamicPassage(count = 90): string[] {
  return getRandomWords(count);
}
