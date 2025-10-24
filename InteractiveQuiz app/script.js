(() => {
  "use strict";

  // QUESTIONS (English and Spanish)
  const quizData = {
    en: [
      { category: "HTML", difficulty: "easy", question: "Which tag is used for the main heading?", choices: ["<h1>", "<h6>", "<title>", "<head>"], correct: 0, hint: "Starts with 'h' and level 1" },
      { category: "CSS", difficulty: "easy", question: "Which property sets the background color?", choices: ["font-color", "bgcolor", "background-color", "color"], correct: 2, hint: "It's a compound word starting with 'background'" },
      { category: "JavaScript", difficulty: "medium", question: "Which keyword declares a variable?", choices: ["int", "var", "define", "vlet"], correct: 1, hint: "Old but still valid" },
      { category: "DOM", difficulty: "medium", question: "What does DOM stand for?", choices: ["Digital Ordinance Mode","Document Object Model","Desktop Object Model","Document Oriented Map"], correct: 1, hint: "It represents page structure" },
      { category: "JavaScript", difficulty: "hard", question: "Which method converts JSON to a JavaScript object?", choices: ["JSON.stringify()", "JSON.parse()", "JSON.convert()", "JSON.object()"], correct: 1, hint: "It's 'parse' not 'stringify'" },
      { category: "CSS", difficulty: "hard", question: "What does 'z-index' control?", choices: ["Color depth", "Stack order", "Font size", "Element width"], correct: 1, hint: "It affects layers" }
    ],
    
  };

  // STATE VARIABLES
  let currentLanguage = 'en';
  let allQuestions = [];
  let filteredQuestions = [];
  let currentIndex = 0;
  let score = 0;
  let userAnswers = [];
  let timeLeft = 0;
  let timerInterval = null;
  let hintUsed = false;
  let quizStarted = false;
  let timerPerQuestion = 10;
  let darkMode = false;
  let soundOn = true;
  let countdownInterval = null;

  // DOM ELEMENTS
  const body = document.body;
  const categoryEl = document.getElementById('category');
  const difficultyEl = document.getElementById('difficulty');
  const questionEl = document.getElementById('question');
  const choicesEl = document.getElementById('choices');
  const feedbackEl = document.getElementById('feedback');
  const nextBtn = document.getElementById('next-btn');
  const hintBtn = document.getElementById('hint-btn');
  const timerEl = document.getElementById('time');
  const scoreEl = document.getElementById('score');
  const scoreBreakdownEl = document.getElementById('score-breakdown');
  const resultBox = document.getElementById('result-box');
  const restartBtn = document.getElementById('restart-btn');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const darkmodeToggle = document.getElementById('darkmode-toggle');
  const soundToggle = document.getElementById('sound-toggle');
  const shareBtn = document.getElementById('share-btn');
  const languageSelect = document.getElementById('language-select');
  const difficultySelect = document.getElementById('difficulty-select');
  const categorySelect = document.getElementById('category-select');
  const startBtn = document.getElementById('start-btn');
  const timerInput = document.getElementById('timer-input');
  const startSection = document.getElementById('start-section');
  const countdownEl = document.getElementById('countdown');

  const correctSound = document.getElementById('correct-sound');
  const wrongSound = document.getElementById('wrong-sound');

  // UTILS
  function shuffleArray(arr) {
    for(let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // Populate category selector dynamically
    // Populate category selector dynamically based on questions in current language
  function populateCategories() {
    const categories = new Set(quizData[currentLanguage].map(q => q.category));
    categorySelect.innerHTML = '<option value="all">All</option>';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });
  }

  // Filter questions based on difficulty and category selections
  function filterQuestions() {
    const difficulty = difficultySelect.value;
    const category = categorySelect.value;
    let questions = quizData[currentLanguage].slice();

    if (difficulty !== 'all') {
      questions = questions.filter(q => q.difficulty === difficulty);
    }
    if (category !== 'all') {
      questions = questions.filter(q => q.category === category);
    }

    shuffleArray(questions);
    filteredQuestions = questions;
  }

  // Display a question and answers
  function displayQuestion() {
    clearInterval(timerInterval);
    hintUsed = false;
    hintBtn.disabled = false;
    feedbackEl.textContent = '';
    nextBtn.disabled = true;
    choicesEl.innerHTML = '';

    if (currentIndex >= filteredQuestions.length) {
      showResults();
      return;
    }

    const q = filteredQuestions[currentIndex];
    categoryEl.textContent = `${q.category}`;
    difficultyEl.textContent = `Difficulty: ${q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}`;
    questionEl.textContent = q.question;

    q.choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = choice;
      btn.type = 'button';
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', () => selectAnswer(idx, btn));
      choicesEl.appendChild(btn);
    });

    // Reset timer
    timeLeft = timerPerQuestion;
    timerEl.textContent = timeLeft;
    timerInterval = setInterval(() => {
      timeLeft--;
      timerEl.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        disableChoices();
        feedbackEl.textContent = currentLanguage === 'en' ? "Time's up!" : "¡Se acabó el tiempo!";
        feedbackEl.style.color = 'var(--danger)';
        playSound(false);
        userAnswers.push(null);
        nextBtn.disabled = false;
      }
    }, 1000);

    // Update progress bar
    const progressPercent = (currentIndex / filteredQuestions.length) * 100;
    progressBarFill.style.width = `${progressPercent}%`;
  }

  // Handle answer selection
  function selectAnswer(selectedIdx, button) {
    clearInterval(timerInterval);
    disableChoices();

    const q = filteredQuestions[currentIndex];
    const correctIdx = q.correct;

    userAnswers.push(selectedIdx);

    if (selectedIdx === correctIdx) {
      button.classList.add('correct');
      feedbackEl.textContent = currentLanguage === 'en' ? 'Correct! 🎉' : '¡Correcto! 🎉';
      feedbackEl.style.color = 'var(--success)';
      score++;
      playSound(true);
    } else {
      button.classList.add('wrong');
      feedbackEl.textContent = currentLanguage === 'en' ? `Wrong! Correct answer: ${q.choices[correctIdx]}` : `¡Incorrecto! Respuesta correcta: ${q.choices[correctIdx]}`;
      feedbackEl.style.color = 'var(--danger)';
      // Highlight correct answer
      [...choicesEl.children].forEach((btn, idx) => {
        if (idx === correctIdx) btn.classList.add('correct');
      });
      playSound(false);
    }
    nextBtn.disabled = false;
  }

  // Disable all choices to prevent multiple answers
  function disableChoices() {
    [...choicesEl.children].forEach(btn => {
      btn.disabled = true;
      btn.setAttribute('aria-pressed', 'false');
    });
  }

  // Use 50-50 hint: remove two wrong answers
  function useHint() {
    if (hintUsed) return;
    hintUsed = true;
    hintBtn.disabled = true;

    const q = filteredQuestions[currentIndex];
    const correctIdx = q.correct;
    const wrongIndexes = [];

    [...choicesEl.children].forEach((btn, idx) => {
      if (idx !== correctIdx) wrongIndexes.push(idx);
    });

    shuffleArray(wrongIndexes);

    // Remove two wrong answers visually
    for (let i = 0; i < 2; i++) {
      const idxToRemove = wrongIndexes[i];
      const btn = choicesEl.children[idxToRemove];
      btn.style.visibility = 'hidden';
      btn.disabled = true;
    }
  }

  // Show final results with score and breakdown
  function showResults() {
    quizStarted = false;
    startSection.classList.remove('hidden');
    categoryEl.textContent = '';
    difficultyEl.textContent = '';
    questionEl.textContent = '';
    choicesEl.innerHTML = '';
    feedbackEl.textContent = '';
    nextBtn.disabled = true;
    hintBtn.disabled = true;
    timerEl.textContent = '0';
    progressBarFill.style.width = '100%';

    // Hide quiz controls, show results box
    resultBox.classList.remove('hidden');

    scoreEl.textContent = currentLanguage === 'en' 
      ? `Your score: ${score} / ${filteredQuestions.length}`
      : `Tu puntuación: ${score} / ${filteredQuestions.length}`;

    // Breakdown per category
    const breakdown = {};
    filteredQuestions.forEach((q, idx) => {
      if (!breakdown[q.category]) breakdown[q.category] = { total: 0, correct: 0 };
      breakdown[q.category].total++;
      if (userAnswers[idx] === q.correct) breakdown[q.category].correct++;
    });

    scoreBreakdownEl.innerHTML = '';
    for (const cat in breakdown) {
      const catResult = document.createElement('p');
      catResult.textContent = currentLanguage === 'en' 
        ? `${cat}: ${breakdown[cat].correct} / ${breakdown[cat].total}`
        : `${cat}: ${breakdown[cat].correct} / ${breakdown[cat].total}`;
      scoreBreakdownEl.appendChild(catResult);
    }

    // Save to leaderboard
    saveLeaderboard(score);

    // Show leaderboard
    renderLeaderboard();
  }

  // Restart quiz
  function restartQuiz() {
    resultBox.classList.add('hidden');
    score = 0;
    currentIndex = 0;
    userAnswers = [];
    startSection.classList.remove('hidden');
  }

  // Start quiz (with countdown)
  function startQuiz() {
    if (quizStarted) return;
    timerPerQuestion = Math.min(Math.max(parseInt(timerInput.value) || 10, 5), 60);

    // Filter questions according to current selections
    filterQuestions();
    if (filteredQuestions.length === 0) {
      alert(currentLanguage === 'en' ? "No questions match selected filters." : "No hay preguntas que coincidan con los filtros seleccionados.");
      return;
    }

    quizStarted = true;
    score = 0;
    currentIndex = 0;
    userAnswers = [];
    startSection.classList.add('hidden');
    resultBox.classList.add('hidden');
    countdownEl.classList.remove('hidden');
    countdownEl.textContent = '3';

    let count = 3;
    countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        countdownEl.textContent = count;
      } else {
        clearInterval(countdownInterval);
        countdownEl.classList.add('hidden');
        displayQuestion();
      }
    }, 1000);
  }

  // Play sound feedback
  function playSound(correct) {
    if (!soundOn) return;
    if (correct) {
      correctSound.currentTime = 0;
      correctSound.play();
    } else {
      wrongSound.currentTime = 0;
      wrongSound.play();
    }
  }

  // Toggle dark mode
  function toggleDarkMode() {
    darkMode = !darkMode;
    body.classList.toggle('dark', darkMode);
    darkmodeToggle.textContent = darkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
    darkmodeToggle.setAttribute('aria-pressed', darkMode);
  }

  // Toggle sound on/off
  function toggleSound() {
    soundOn = !soundOn;
    soundToggle.textContent = soundOn ? '🔊 Sound On' : '🔇 Sound Off';
    soundToggle.setAttribute('aria-pressed', soundOn);
  }

  // Save score in leaderboard (localStorage)
  function saveLeaderboard(newScore) {
    const leaderboardKey = `quiz_leaderboard_${currentLanguage}`;
    const leaderboard = JSON.parse(localStorage.getItem(leaderboardKey)) || [];
    const entry = { score: newScore, date: new Date().toISOString() };
    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.score - a.score);
    if (leaderboard.length > 10) leaderboard.pop(); // keep top 10
    localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));
  }

  // Render leaderboard
  function renderLeaderboard() {
    const leaderboardKey = `quiz_leaderboard_${currentLanguage}`;
    const leaderboard = JSON.parse(localStorage.getItem(leaderboardKey)) || [];
    const leaderboardEl = document.getElementById('leaderboard');
    leaderboardEl.innerHTML = '';
    if (leaderboard.length === 0) {
      const li = document.createElement('li');
      li.textContent = currentLanguage === 'en' ? 'No scores yet.' : 'Aún no hay puntuaciones.';
      leaderboardEl.appendChild(li);
      return;
    }
    leaderboard.forEach(({score, date}, idx) => {
      const li = document.createElement('li');
      const dateStr = new Date(date).toLocaleDateString(currentLanguage);
      li.textContent = `${idx + 1}. ${score} (${dateStr})`;
      leaderboardEl.appendChild(li);
    });
  }

  // Change language handler
  function changeLanguage() {
    currentLanguage = languageSelect.value;
    populateCategories();
    resetFilters();
    restartQuiz();
  }

  // Reset filters to default
  function resetFilters() {
    difficultySelect.value = 'all';
    categorySelect.value = 'all';
  }

  // Event listeners
  nextBtn.addEventListener('click', () => {
    currentIndex++;
    displayQuestion();
  });

  hintBtn.addEventListener('click', useHint);
  restartBtn.addEventListener('click', restartQuiz);
  darkmodeToggle.addEventListener('click', toggleDarkMode);
  soundToggle.addEventListener('click', toggleSound);
  shareBtn.addEventListener('click', () => {
    const url = `${window.location.origin}${window.location.pathname}?score=${score}&lang=${currentLanguage}`;
    navigator.clipboard.writeText(url).then(() => {
      alert(currentLanguage === 'en' ? 'Score link copied to clipboard!' : '¡Enlace de puntuación copiado al portapapeles!');
    });
  });

  languageSelect.addEventListener('change', changeLanguage);
  difficultySelect.addEventListener('change', restartQuiz);
  categorySelect.addEventListener('change', restartQuiz);
  startBtn.addEventListener('click', startQuiz);
  

  // On load
  function init() {
    populateCategories();
    resetFilters();
    renderLeaderboard();
  }

  init();

})();

