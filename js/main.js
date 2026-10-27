/* ============================================================
   German Flashcards – main.js
   Same dataset links and the same flow as before:
   batch (15, then 10 new + 5 review) -> next/repeat -> quiz.
   New: Leitner self-rating, typing quiz, due review across decks,
   stats/streak, keyboard + swipe, backup, and a set of bug fixes.
   ============================================================ */
(() => {
  'use strict';

  /* ---------- DOM ---------- */
  const $ = id => document.getElementById(id);

  const mainCategory = $('main-category');
  const subCategory = $('sub-category');
  const statsEl = $('stats');
  const noticeEl = $('notice');
  const reviewDueBtn = $('review-due');

  const study = $('study');
  const flashcard = $('flashcard');
  const cardText = $('card-text');
  const cardExample = $('card-example');
  const cardCount = $('card-count');
  const slider = $('card-slider');
  const ttsBtn = $('tts-btn');
  const rating = $('rating');
  const showAnswerBtn = $('show-answer');
  const shuffleBtn = $('shuffle');
  const resetBtn = $('restart');
  const reverseBtn = $('reverse');
  const batchActions = $('batch-actions');
  const repeatBatchBtn = $('repeat-batch');
  const nextBatchBtn = $('next-batch');
  const startQuizBtn = $('start-quiz');
  const exitReviewBtn = $('exit-review');

  const quizContainer = $('quiz-container');
  const quizType = $('quiz-type');
  const quizProgress = $('quiz-progress');
  const quizQuestion = $('quiz-question');
  const quizOptions = $('quiz-options');
  const quizForm = $('quiz-type-form');
  const quizInput = $('quiz-input');
  const umlautBar = $('umlaut-bar');
  const quizFeedback = $('quiz-feedback');
  const quizNext = $('quiz-next');
  const quizExit = $('quiz-exit');
  const quizResult = $('quiz-result');
  const quizSummary = $('quiz-summary');
  const quizWrongList = $('quiz-wrong-list');
  const quizRetry = $('quiz-retry');

  const autoplayBox = $('autoplay');
  const dailyGoalSel = $('daily-goal');
  const settingsBox = $('settings');
  const yearSpan = $('year');
  const toast = $('toast');
  const toastText = $('toast-text');
  const toastUndo = $('toast-undo');
  const themeSel = $('theme');

  /* ---------- Constants ---------- */
  //const basePath = '';
  const basePath = 'https://jonnypaemyint.github.io/flashcards/';

  const FIRST_BATCH = 15;     // new cards in batch 0
  const BATCH_STEP = 10;      // new cards in every later batch
  const BATCH_SIZE = 15;      // total cards per batch (new + review)
  const LONG_PRESS_MS = 450;
  const SWIPE_PX = 50;
  const REVIEW_LIMIT = 20;
  const RETRY_GAP = 3;           // an "Again" card returns after this many other cards
  const DAY = 86400000;
  const INTERVALS = [0, 0, 1, 3, 7, 14];   // days until due, by Leitner box (1-5)

  const KEYS = {
    session: 'dl.session',
    progress: 'dl.progress',
    stats: 'dl.stats',
    settings: 'dl.settings'
  };

  // colours live in CSS (--card-1..4) so they change with the theme
  const flashcardColors = ['var(--card-1)', 'var(--card-2)', 'var(--card-3)', 'var(--card-4)'];

  /* ---------- Datasets: loaded from data/manifest.json ---------- */
  let datasets = {};        // category id -> [{name, file}]  or  {group: [{name, file}]}
  let categoryNames = {};   // category id -> label for the first dropdown

  async function loadManifest() {
    const res = await fetch(basePath + 'data/manifest.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const m = await res.json();
    const withBase = l => ({ name: l.name, file: basePath + l.file });
    const ds = {};
    const names = {};
    (m.categories || []).forEach(cat => {
      names[cat.id] = cat.name || cat.id;
      if (Array.isArray(cat.groups)) {
        ds[cat.id] = {};
        cat.groups.forEach(g => { ds[cat.id][g.name] = (g.lessons || []).map(withBase); });
      } else {
        ds[cat.id] = (cat.lessons || []).map(withBase);
      }
    });
    if (!Object.keys(ds).length) throw new Error('empty manifest');
    datasets = ds;
    categoryNames = names;
  }

  function fillMainCategories() {
    mainCategory.innerHTML = '';
    Object.keys(datasets).forEach(id => {
      const o = document.createElement('option');
      o.value = id;
      o.textContent = categoryNames[id] || id;
      mainCategory.appendChild(o);
    });
  }

  /* ---------- Safe localStorage ---------- */
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v == null ? fallback : JSON.parse(v);
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
    }
  };

  /* ---------- State ---------- */
  let settings = Object.assign(
    { autoplay: false, reverse: false, quizType: 'choice', dailyGoal: 20, theme: 'auto' },
    store.get(KEYS.settings, {})
  );
  let progress = store.get(KEYS.progress, {}) || {};   // key -> {box, due, seen, reps}
  let stats = store.get(KEYS.stats, {}) || {};         // {date, today, streak}

  let mode = 'batch';            // 'batch' | 'review'
  let allCards = [];             // whole deck (or the review list)
  let cards = [];                // cards of the current batch
  let indexOrder = [];
  let currentIndex = 0;
  let currentBatch = 0;
  let flipped = false;
  let revealedCard = null;       // card whose answer was seen: ratings stay until it is rated
  let undoSnap = null;           // state before the last rating
  let toastTimer = null;
  let finished = false;
  let finishKind = null;         // 'batch' | 'all' | 'review'
  let finishText = '';
  let emptyText = 'Loading...';
  let reverseMode = !!settings.reverse;
  let shuffled = false;
  let busy = false;              // true while the slide animation runs
  let loadToken = 0;             // ignores out-of-date fetches
  const reviewSeen = new Map();  // card -> last batch it was used as review

  // quiz
  let quizMode = false;
  let quizData = [];
  let quizIndex = 0;
  let quizStart = 0;
  let quizAnswered = false;

  /* ---------- Small helpers ---------- */
  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const goal = () => Number(settings.dailyGoal) || 20;

  /* Which side of a card is German? (used by typing quiz + auto-play) */
  const DE_WORDS = new Set(['ich','du','er','sie','es','wir','ihr','und','ist','nicht','ein','eine','einen','zu','mit','von','den','dem','der','die','das','auf','für','im','bin','bist','sind','haben','habe','wie','wo','wer','kann','möchte','bitte','danke','ja','nein','auch','aber','oder','mein','meine','dein','sich','wird','werden','nach','bei','aus','um']);
  const EN_WORDS = new Set(['the','to','is','are','and','of','you','he','she','it','we','they','my','your','his','her','i','a','do','does','not','how','what','where','who','can','please','thank','yes','no','at','be','have','has','was']);

  function germanScore(text) {
    const t = String(text);
    let sc = (t.match(/[äöüßÄÖÜ]/g) || []).length * 2;
    for (const w of t.toLowerCase().split(/[^a-zäöüß]+/)) {
      if (!w) continue;
      if (DE_WORDS.has(w)) sc += 1;
      if (EN_WORDS.has(w)) sc -= 1;
    }
    if (/^(der|die|das)\s/i.test(t)) sc += 2;
    if (/^to\s/i.test(t)) sc -= 2;
    return sc;
  }

  const looksGerman = text => germanScore(text) > 0;

  // What to read aloud for the card as currently shown
  function speechTarget(card) {
    const side = visibleSide();
    if (side === 'front') return spokenText(card, 'front');            // the German word
    if (looksGerman(card.back)) return spokenText(card, 'back');       // a German example sentence
    return reverseMode ? '' : spokenText(card, 'front');               // English shown: read German only once revealed
  }

  function dayKey(offset = 0) {
    const d = new Date(Date.now() + offset * DAY);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  const cardKey = c => (c._file || '') + '|' + c.front;
  const currentCard = () => cards[indexOrder[currentIndex]];
  const isRevealed = () => !finished && cards.length > 0 && revealedCard === currentCard();

  function visibleSide() {
    return reverseMode ? (flipped ? 'front' : 'back') : (flipped ? 'back' : 'front');
  }

  // "der Hund, -e (Tier)" -> "der Hund"; "Ja." -> "Ja"; keeps "z.B." intact
  function cleanAnswer(str) {
    str = String(str).split('(')[0];
    str = str.replace(/,\s*[-–]\S*/g, '');       // plural markers ", -s", ", -e"
    str = str.split(/\s[-–]\s/)[0];               // " - explanation"
    return str.replace(/[.!?]+\s*$/, '').trim();
  }

  // Looser comparison for typing: case, spaces, punctuation, ä/ae, ß/ss
  function normalize(s) {
    return String(s).normalize('NFC').toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[.,;:!?"'’“”()]/g, '')
      .replace(/\s+/g, ' ').trim();
  }

  const lowSpaces = s => String(s).toLowerCase().replace(/\s+/g, ' ').trim();

  function notice(msg) {
    noticeEl.textContent = msg;
    clearTimeout(notice.t);
    notice.t = setTimeout(() => { noticeEl.textContent = ''; }, 4000);
  }

  // Writes text; colours a leading der/die/das for noun-like entries
  function renderText(target, text) {
    text = String(text);
    target.textContent = '';
    const m = /^(der|die|das)\s+([\s\S]+)$/i.exec(text);
    const head = text.split(/[,(\n]/)[0].trim();
    const nounLike = m && head.split(/\s+/).length <= 3 && !/[.!?]$/.test(head);
    if (nounLike) {
      const span = document.createElement('span');
      span.className = 'article ' + m[1].toLowerCase();
      span.textContent = m[1];
      target.append(span, ' ' + m[2]);
    } else {
      target.textContent = text;
    }
  }

  /* ---------- Progress (Leitner boxes) ---------- */
  function applyRating(card, r) {          // r: 1 Again, 2 Hard, 3 Good, 4 Easy
    const now = Date.now();
    const k = cardKey(card);
    const p = progress[k] || { box: 0, due: 0, seen: 0, reps: 0 };
    const base = p.box || 1;
    let box;
    if (r === 1) box = 1;
    else if (r === 2) box = base;
    else if (r === 3) box = Math.min(5, base + 1);
    else box = Math.min(5, base + 2);
    const days = INTERVALS[box] * (r === 2 ? 0.5 : 1);
    progress[k] = { box, due: now + days * DAY, seen: now, reps: (p.reps || 0) + 1 };
    store.set(KEYS.progress, progress);
  }

  function bumpStats() {
    const t = dayKey();
    if (stats.date !== t) {
      stats.streak = stats.date === dayKey(-1) ? (stats.streak || 0) + 1 : 1;
      stats.date = t;
      stats.today = 0;
    }
    stats.today = (stats.today || 0) + 1;
    store.set(KEYS.stats, stats);
    if (stats.today === goal()) {
      notice('Daily goal reached! 🎉');
      confettiBurst();
    }
  }

  function renderStats() {
    const t = dayKey();
    const today = stats.date === t ? stats.today || 0 : 0;
    const streak = stats.date === t || stats.date === dayKey(-1) ? stats.streak || 0 : 0;
    const now = Date.now();
    let learned = 0;
    for (const c of allCards) {
      const p = progress[cardKey(c)];
      if (p && p.box >= 4) learned++;
    }
    let text = `Today ${today}/${goal()} · 🔥 ${streak}`;
    if (mode === 'review') text = 'Session · ' + text;
    else text += ` · Learned ${learned}/${allCards.length}`;
    statsEl.textContent = text;

    // Pill: "Study today" = due cards (all decks) + new cards from this deck, up to what is left of the goal.
    // Once the goal is met it becomes "Review N" (due cards only); with nothing to do it is hidden.
    const left = Math.max(goal() - today, 0);
    const totalDue = dueCount();
    const available = totalDue + newCardsInDeck().length;
    if (mode === 'review') {
      reviewDueBtn.hidden = false;
      reviewDueBtn.textContent = 'Exit session';
    } else if (left > 0 && available > 0) {
      reviewDueBtn.hidden = false;
      reviewDueBtn.textContent = `Study today · ${Math.min(left, available)}`;
    } else if (totalDue > 0) {
      reviewDueBtn.hidden = false;
      reviewDueBtn.textContent = `Review ${totalDue}`;
    } else {
      reviewDueBtn.hidden = true;
    }
  }

  /* ---------- Dropdowns ---------- */
  function populateSubcategories(category, preferredFile) {
    subCategory.innerHTML = '';
    const ds = datasets[category];
    if (!ds) return;

    const add = (parent, item) => {
      const o = document.createElement('option');
      o.value = item.file;
      o.textContent = item.name;
      parent.appendChild(o);
    };

    if (Array.isArray(ds)) {
      ds.forEach(item => add(subCategory, item));
    } else {
      Object.keys(ds).forEach(group => {
        const og = document.createElement('optgroup');
        og.label = group;
        ds[group].forEach(item => add(og, item));
        subCategory.appendChild(og);
      });
    }

    const opts = Array.from(subCategory.options);
    const pick = opts.find(o => o.value === preferredFile) || opts[0];
    if (pick) pick.selected = true;
  }

  mainCategory.addEventListener('change', () => {
    leaveQuizUI();
    populateSubcategories(mainCategory.value);
    loadCards(subCategory.value);
  });

  subCategory.addEventListener('change', () => {
    leaveQuizUI();
    if (subCategory.value) loadCards(subCategory.value);
  });

  /* ---------- Loading & batches ---------- */
  async function loadCards(file, restore) {
    const token = ++loadToken;
    mode = 'batch';
    leaveFinished();
    reviewSeen.clear();
    allCards = [];
    cards = [];
    indexOrder = [];
    emptyText = 'Loading...';
    renderCard();

    try {
      const res = await fetch(file);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (token !== loadToken) return;          // a newer load replaced this one
      allCards = (Array.isArray(data) ? data : [])
        .filter(c => c && c.front != null && c.back != null)
        .map(c => { c.front = String(c.front); c.back = String(c.back); c._file = file; return c; });
    } catch (err) {
      if (token !== loadToken) return;
      emptyText = 'Failed to load flashcards.';
      renderCard();
      renderStats();
      return;
    }

    if (!allCards.length) emptyText = 'No flashcards available.';

    const useRestore = restore && restore.sub === file;
    loadBatch(useRestore ? restore.batch | 0 : 0);
    if (useRestore) applyRestore(restore);

    renderStats();
    renderCard();
    saveSession();
  }

  const lastBatchIndex = () =>
    allCards.length <= FIRST_BATCH ? 0 : Math.ceil((allCards.length - FIRST_BATCH) / BATCH_STEP);

  function freshRange(i) {
    const start = i === 0 ? 0 : FIRST_BATCH + BATCH_STEP * (i - 1);
    const size = i === 0 ? FIRST_BATCH : BATCH_STEP;
    return [start, Math.min(start + size, allCards.length)];
  }

  function loadBatch(index) {
    if (!allCards.length) { setDeck([]); return; }
    index = Math.max(0, Math.min(index, lastBatchIndex()));
    currentBatch = index;

    const [start, end] = freshRange(index);
    const fresh = allCards.slice(start, end);
    fresh.forEach(c => { c.isOld = false; });

    let review = [];
    if (index > 0) {
      const now = Date.now();
      const dueOf = c => { const p = progress[cardKey(c)]; return p ? p.due : now; };
      const pool = allCards.slice(0, start);
      // most overdue first (Again/Hard cards), then least recently used as review
      pool.sort((a, b) =>
        (dueOf(a) - dueOf(b)) ||
        ((reviewSeen.get(a) ?? -1) - (reviewSeen.get(b) ?? -1)));
      review = pool.slice(0, Math.max(0, BATCH_SIZE - fresh.length));
      review.forEach(c => { c.isOld = true; reviewSeen.set(c, index); });
    }

    setDeck([...fresh, ...review]);
  }

  function setDeck(list) {
    cards = list;
    indexOrder = cards.map((_, i) => i);
    shuffled = false;
    currentIndex = 0;
    flipped = false;
    leaveFinished();
    changeFlashcardColour();
    syncToggleButtons();
  }

  function applyRestore(s) {
    if (Array.isArray(s.order) && s.order.length >= cards.length && s.order.length <= cards.length * 2 &&
        s.order.every(i => Number.isInteger(i) && i >= 0 && i < cards.length)) {
      indexOrder = s.order.slice();
      shuffled = !!s.shuffled;
    }
    currentIndex = Math.min(Math.max(s.index | 0, 0), Math.max(indexOrder.length - 1, 0));
    syncToggleButtons();
  }

  function leaveFinished() {
    finished = false;
    revealedCard = null;
    clearUndo();
    finishKind = null;
    finishText = '';
  }

  function syncToggleButtons() {
    shuffleBtn.classList.toggle('active-shuffle', shuffled);
    reverseBtn.checked = reverseMode;
  }

  function saveSession() {
    if (mode !== 'batch' || !allCards.length) return;
    store.set(KEYS.session, {
      main: mainCategory.value,
      sub: subCategory.value,
      batch: currentBatch,
      index: currentIndex,
      shuffled,
      order: indexOrder
    });
  }

  function legacySession() {
    try {
      const main = localStorage.getItem('mainCategory');
      const sub = localStorage.getItem('subCategory');
      if (main && datasets[main]) return { main, sub, batch: 0, index: 0 };
    } catch { /* ignore */ }
    return null;
  }

  /* ---------- Rendering ---------- */
  function changeFlashcardColour() {
    const color = flashcardColors[Math.floor(Math.random() * flashcardColors.length)];
    flashcard.style.setProperty('--card-bg', color);
  }

  /* Shrink the font until the text fits inside the card */
  const FIT_MAX = 30;
  const FIT_MIN = 13;

  function fitText() {
    if (!flashcard.clientHeight) return;               // study view is hidden
    const cs = getComputedStyle(flashcard);
    const availH = flashcard.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const availW = flashcard.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const gap = parseFloat(cs.rowGap) || 0;
    const tooBig = () =>
      cardText.offsetHeight + (cardExample.hidden ? 0 : cardExample.offsetHeight + gap) > availH ||
      cardText.offsetWidth > availW;

    flashcard.style.fontSize = FIT_MAX + 'px';
    let size = FIT_MAX;
    while (size > FIT_MIN && tooBig()) {
      size--;
      flashcard.style.fontSize = size + 'px';
    }
  }

  function renderCard() {
    renderCardCore();
    fitText();
  }

  function renderCardCore() {
    const has = cards.length > 0;

    if (!has) {
      cardText.textContent = emptyText;
      cardExample.hidden = true;
      cardExample.textContent = '';
      flashcard.classList.remove('flipped', 'old-card');
      flashcard.removeAttribute('data-hint');
      ttsBtn.classList.add('hidden');
      rating.hidden = true;
      showAnswerBtn.hidden = true;
      batchActions.hidden = true;
      cardCount.textContent = '0/0';
      slider.max = 0;
      slider.value = 0;
      return;
    }

    const card = currentCard();
    flashcard.classList.toggle('old-card', !!card.isOld && !finished);
    flashcard.classList.toggle('flipped', flipped && !finished);

    if (finished) {
      cardText.textContent = finishText;
      cardExample.hidden = true;
      cardExample.textContent = '';
      flashcard.removeAttribute('data-hint');
    } else {
      renderText(cardText, card[visibleSide()]);
      const showExample = flipped && card.example;
      cardExample.textContent = showExample ? String(card.example) : '';
      cardExample.hidden = !showExample;
      flashcard.setAttribute('data-hint', isRevealed() ? 'Rate to continue • swipe to skip' : 'Hold to hear • Swipe to move');
    }

    ttsBtn.classList.toggle('hidden', finished);
    rating.hidden = !isRevealed();

    showAnswerBtn.hidden = finished || isRevealed();   // the rating buttons take this spot once revealed
    batchActions.hidden = !finished;
    repeatBatchBtn.hidden = !(finishKind === 'batch' || finishKind === 'all');
    nextBatchBtn.hidden = finishKind !== 'batch';
    startQuizBtn.hidden = finishKind !== 'all';
    exitReviewBtn.hidden = finishKind !== 'review';


    cardCount.textContent = (currentIndex + 1) + '/' + indexOrder.length;
    slider.max = indexOrder.length - 1;
    slider.value = currentIndex;
  }

  /* ---------- Navigation ---------- */
  // After a slide the next card should appear un-flipped at once,
  // not spin back through the 3D flip transition.
  function renderCardInstant() {
    revealedCard = null;
    flashcard.style.transition = 'none';
    renderCard();
    void flashcard.offsetWidth;            // commit the un-animated state
    flashcard.style.transition = '';
  }

  function slide(direction, callback) {
    if (busy) return;
    busy = true;
    const cls = direction === 'next' ? 'slide-left' : 'slide-right';
    flashcard.classList.add(cls);
    ttsBtn.classList.add('hidden');
    stopSpeaking();
    setTimeout(() => {
      flashcard.classList.remove(cls);
      busy = false;
      callback();
    }, 350);
  }

  function goNext() {
    if (busy || finished || !cards.length) return;
    if (currentIndex < indexOrder.length - 1) {
      slide('next', () => {
        currentIndex++;
        flipped = false;
        changeFlashcardColour();
        renderCardInstant();
        saveSession();
        maybeAutoplay();
      });
    } else {
      finishDeck();
    }
  }

  function goPrev() {
    if (busy || !cards.length) return;
    if (finished) {
      leaveFinished();
      currentIndex = indexOrder.length - 1;
      flipped = false;
      renderCard();
      saveSession();
      return;
    }
    if (currentIndex > 0) {
      slide('prev', () => {
        currentIndex--;
        flipped = false;
        changeFlashcardColour();
        renderCardInstant();
        saveSession();
        maybeAutoplay();
      });
    }
  }

  let flipTimer = null;
  function flipCard() {
    if (finished || !cards.length) return;
    flipped = !flipped;
    if (flipped) revealedCard = currentCard();
    flashcard.classList.toggle('flipped', flipped);
    clearTimeout(flipTimer);
    flipTimer = setTimeout(renderCard, 180);      // swap text while the card is edge-on
    maybeAutoplay();
  }

  function finishDeck() {
    flipped = false;
    finished = true;

    if (mode === 'review') {
      finishKind = 'review';
      finishText = 'Session complete!\n\nCards you rated Again or Hard will come back sooner.\n\n🎉 Well done! 🎉';
    } else {
      const [, end] = freshRange(currentBatch);
      if (end < allCards.length) {
        finishKind = 'batch';
        finishText = `Great! Batch ${currentBatch + 1} completed.\n\nClick "Next batch" to continue or "Repeat" to practise more.\n\nSome old cards will reappear to help you remember.\n\n🎉 Well done! 🎉`;
      } else {
        finishKind = 'all';
        finishText = 'You’ve completed all the flashcards.\n\nClick "Start Quiz" to test how much you’ve remembered or "Repeat" to practise more.\n\n🎉 Well done! 🎉';
      }
    }

    renderCard();
    renderStats();
    confettiBurst();
    flashcard.classList.add('celebrate');
    setTimeout(() => flashcard.classList.remove('celebrate'), 500);
    saveSession();
  }

  function confettiBurst() {
    if (typeof confetti === 'function') {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }

  function rate(r) {
    if (busy || finished || !cards.length || !isRevealed()) return;
    const card = currentCard();
    const k = cardKey(card);
    undoSnap = {
      card, k,
      prev: progress[k] ? { ...progress[k] } : null,
      stats: { ...stats },
      order: indexOrder.slice(),
      index: currentIndex
    };
    applyRating(card, r);
    bumpStats();

    // Again: bring the card back a few cards later (once) for another try now
    if (r === 1) {
      const idx = indexOrder[currentIndex];
      if (indexOrder.indexOf(idx, currentIndex + 1) === -1) {
        indexOrder.splice(Math.min(indexOrder.length, currentIndex + 1 + RETRY_GAP), 0, idx);
      }
    }

    renderStats();
    showToast(r === 1 ? 'Again · back in a few cards' : 'Rated ' + ['Again', 'Hard', 'Good', 'Easy'][r - 1]);
    goNext();
  }

  /* ---------- Undo the last rating ---------- */
  function showToast(text) {
    toastText.textContent = text;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(clearUndo, 5000);
  }

  function clearUndo() {
    undoSnap = null;
    clearTimeout(toastTimer);
    toast.hidden = true;
  }

  function undoRating() {
    const s = undoSnap;
    if (!s || busy) return;
    clearUndo();
    leaveFinished();
    if (s.prev) progress[s.k] = s.prev; else delete progress[s.k];
    store.set(KEYS.progress, progress);
    stats = s.stats;
    store.set(KEYS.stats, stats);
    indexOrder = s.order;
    currentIndex = s.index;
    flipped = true;
    revealedCard = s.card;          // back on the rated card, answer showing, ratings available
    renderCard();
    renderStats();
    saveSession();
  }

  toastUndo.addEventListener('click', undoRating);

  /* ---------- Buttons ---------- */
  showAnswerBtn.addEventListener('click', flipCard);

  rating.addEventListener('click', e => {
    const b = e.target.closest('button[data-rate]');
    if (b) rate(Number(b.dataset.rate));
  });

  shuffleBtn.addEventListener('click', () => {
    if (!cards.length) return;
    leaveFinished();
    indexOrder = shuffleInPlace(cards.map((_, i) => i));
    shuffled = true;
    currentIndex = 0;
    flipped = false;
    changeFlashcardColour();
    syncToggleButtons();
    renderCard();
    saveSession();
  });

  resetBtn.addEventListener('click', () => {
    if (!cards.length) return;
    leaveFinished();
    indexOrder = cards.map((_, i) => i);
    shuffled = false;
    currentIndex = 0;
    flipped = false;
    changeFlashcardColour();
    syncToggleButtons();
    renderCard();
    saveSession();
  });

  reverseBtn.addEventListener('click', () => {
    reverseMode = !reverseMode;
    settings.reverse = reverseMode;
    store.set(KEYS.settings, settings);
    flipped = false;
    revealedCard = null;
    syncToggleButtons();
    renderCard();
    settingsDone(reverseMode ? 'Reverse on: answers come first' : 'Reverse off');
  });

  nextBatchBtn.addEventListener('click', () => {
    loadBatch(currentBatch + 1);
    renderCard();
    saveSession();
  });

  repeatBatchBtn.addEventListener('click', () => {
    loadBatch(currentBatch);
    renderCard();
    saveSession();
  });

  startQuizBtn.addEventListener('click', () => startQuiz());

  exitReviewBtn.addEventListener('click', () => {
    loadCards(subCategory.value, store.get(KEYS.session, null));
  });

  slider.addEventListener('input', e => {
    currentIndex = Number(e.target.value);
    flipped = false;
    leaveFinished();
    renderCard();
    saveSession();
  });

  autoplayBox.addEventListener('change', () => {
    settings.autoplay = autoplayBox.checked;
    store.set(KEYS.settings, settings);
  });

  reviewDueBtn.addEventListener('click', () => (mode === 'review' ? exitReviewBtn.click() : startSession()));

  /* ---------- Speech ---------- */
  const hasSpeech = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  function pickVoice() {
    const voices = speechSynthesis.getVoices();
    return voices.find(v => v.lang === 'de-DE' && /google/i.test(v.name)) ||
           voices.find(v => v.lang === 'de-DE') ||
           voices.find(v => v.lang && v.lang.startsWith('de')) ||
           null;
  }

  function stopSpeaking() {
    if (hasSpeech) speechSynthesis.cancel();
    ttsBtn.classList.remove('speaking');
  }

  function speak(text) {
    if (!hasSpeech || !text) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    u.rate = 0.9;
    const voice = pickVoice();
    if (voice) u.voice = voice;           // without a voice the browser still uses lang
    u.onstart = () => ttsBtn.classList.add('speaking');
    u.onend = u.onerror = () => ttsBtn.classList.remove('speaking');
    speechSynthesis.speak(u);
  }

  // Optional JSON fields ttsFront / ttsBack override what is spoken.
  function spokenText(card, side) {
    const override = card[side === 'front' ? 'ttsFront' : 'ttsBack'];
    return override ? String(override) : cleanAnswer(card[side]);
  }

  function speakCurrent() {
    if (finished || !cards.length) return;
    speak(speechTarget(currentCard()));
  }

  function maybeAutoplay() {
    if (!settings.autoplay || finished || !cards.length) return;
    speak(speechTarget(currentCard()));
  }

  ttsBtn.addEventListener('click', speakCurrent);

  /* ---------- Card gestures: tap = flip, hold = speak, swipe = next/prev ---------- */
  let down = null;
  let pressTimer = null;
  let longPressed = false;

  flashcard.addEventListener('pointerdown', e => {
    if (finished || busy) return;
    down = { x: e.clientX, y: e.clientY, moved: false };
    longPressed = false;
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      if (down && !down.moved) { longPressed = true; speakCurrent(); }
    }, LONG_PRESS_MS);
  });

  flashcard.addEventListener('pointermove', e => {
    if (!down) return;
    if (Math.abs(e.clientX - down.x) > 10 || Math.abs(e.clientY - down.y) > 10) {
      down.moved = true;
      clearTimeout(pressTimer);
    }
  });

  function endPress(e, cancelled) {
    clearTimeout(pressTimer);
    if (!down) return;
    const d = down;
    down = null;
    if (cancelled || longPressed) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext(); else goPrev();
    } else if (!d.moved) {
      flipCard();
    }
  }

  flashcard.addEventListener('pointerup', e => endPress(e, false));
  flashcard.addEventListener('pointercancel', e => endPress(e, true));
  flashcard.addEventListener('pointerleave', e => {
    // touch devices fire pointerleave right after pointerup; only cancel if still pressed
    if (down && hasSpeech && longPressed) stopSpeaking();
    endPress(e, true);
  });

  flashcard.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      flipCard();
    }
  });

  /* ---------- Keyboard shortcuts ---------- */
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (quizMode || study.hidden || e.target === flashcard) return;

    switch (e.key) {
      case 'ArrowRight': goNext(); break;
      case 'ArrowLeft': goPrev(); break;
      case ' ':
        if (tag === 'BUTTON') return;
        e.preventDefault();
        flipCard();
        break;
      case 's': case 'S': speakCurrent(); break;
      case 'u': case 'U': undoRating(); break;
      case '1': case '2': case '3': case '4':
        if (!rating.hidden) rate(Number(e.key));
        break;
      default: break;
    }
  });

  /* ---------- Study today: due cards + new cards, sized to the daily goal ---------- */
  const todayCount = () => (stats.date === dayKey() ? stats.today || 0 : 0);

  function dueCount() {
    const now = Date.now();
    let n = 0;
    for (const [k, p] of Object.entries(progress)) {
      if (p && p.due <= now && k.includes('|')) n++;
    }
    return n;
  }

  function dueEntries() {
    const now = Date.now();
    return Object.entries(progress)
      .filter(([k, p]) => p && p.due <= now && k.includes('|'))
      .sort((a, b) => (a[1].due - b[1].due) || (a[1].box - b[1].box));   // most overdue first
  }

  // Cards of the open deck that have never been rated (one per front text)
  function newCardsInDeck() {
    if (mode !== 'batch') return [];
    const seen = new Set();
    return allCards.filter(c => {
      const k = cardKey(c);
      if (progress[k] || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  async function startSession() {
    const left = Math.max(goal() - todayCount(), 0);
    const due = dueEntries().slice(0, left > 0 ? left : REVIEW_LIMIT);
    const fresh = left > 0 ? newCardsInDeck().slice(0, Math.max(left - due.length, 0)) : [];

    if (!due.length && !fresh.length) {
      notice('Nothing to study right now — nice work! 🎉');
      return;
    }

    const t0 = loadToken;
    reviewDueBtn.disabled = true;
    notice('Preparing today’s session…');

    // due cards may come from other decks: fetch those files and pick the wanted cards
    const wanted = new Set(due.map(([k]) => k));
    const files = [...new Set(due.map(([k]) => k.slice(0, k.indexOf('|'))))];
    const byKey = new Map();

    await Promise.all(files.map(async f => {
      try {
        const res = await fetch(f);
        if (!res.ok) return;
        const data = await res.json();
        for (const c of data) {
          if (!c || c.front == null || c.back == null) continue;
          const card = { ...c, front: String(c.front), back: String(c.back), _file: f, isOld: true };
          const k = cardKey(card);
          if (wanted.has(k)) byKey.set(k, card);
        }
      } catch { /* skip files that fail */ }
    }));

    reviewDueBtn.disabled = false;
    if (t0 !== loadToken) return;                 // the learner switched deck meanwhile

    fresh.forEach(c => { c.isOld = false; });
    const list = [...due.map(([k]) => byKey.get(k)).filter(Boolean), ...fresh];
    if (!list.length) {
      notice('Could not load the cards. Are the data files reachable?');
      return;
    }

    ++loadToken;                                  // cancel any pending lesson load
    leaveQuizUI();
    mode = 'review';
    allCards = list;
    setDeck(list);
    noticeEl.textContent = '';
    renderStats();
    renderCard();
  }

  /* ---------- Quiz ---------- */
  function startQuiz(source) {
    clearUndo();
    const seen = new Set();
    const list = (source || allCards).filter(c => !seen.has(c.front) && seen.add(c.front));
    if (!list.length) return;
    shuffleInPlace(list);

    quizData = list.map(c => ({
      card: c,
      q: reverseMode ? c.back : c.front,
      a: reverseMode ? c.front : c.back,
      isCorrect: false,
      timeTaken: 0,
      startTime: 0
    }));
    quizIndex = 0;
    quizStart = Date.now();
    quizMode = true;

    study.hidden = true;
    quizContainer.hidden = false;
    showQuizQuestion();
  }

  function leaveQuizUI() {
    if (!quizMode) return;
    quizMode = false;
    quizContainer.hidden = true;
    study.hidden = false;
  }

  // Cards are German on the front. The back is English, or sometimes a German
  // sentence (then the front looks like "sein (be)": the English gloss is in brackets).
  //  typing : show the English, type the German front
  //  choice : front -> back, flipped by Reverse (sentence cards use the gloss instead)
  function qaFor(cur) {
    const c = cur.card;
    const gloss = (c.front.match(/\(([^)]+)\)\s*$/) || [])[1];
    const useGloss = !!gloss && looksGerman(c.back);
    let q, ansSide;
    if (quizType.value === 'typing') {
      ansSide = 'front';
      q = useGloss ? gloss : c.back;
    } else if (reverseMode) {
      ansSide = 'front';
      q = c.back;
    } else if (useGloss) {
      ansSide = 'front';
      q = gloss;
    } else {
      ansSide = 'back';
      q = c.front;
    }
    return { q, a: c[ansSide], ansSide };
  }

  function showQuizQuestion() {
    const cur = quizData[quizIndex];
    Object.assign(cur, qaFor(cur));
    quizAnswered = false;
    cur.startTime = Date.now();

    quizResult.hidden = true;
    quizQuestion.hidden = false;
    quizProgress.hidden = false;
    quizNext.hidden = false;
    quizNext.textContent = 'Skip';
    quizFeedback.textContent = '';
    quizFeedback.className = '';

    renderText(quizQuestion, cur.q);
    updateQuizProgress();

    const typing = quizType.value === 'typing';
    quizOptions.hidden = typing;
    quizForm.hidden = !typing;
    quizOptions.classList.remove('locked');
    quizOptions.innerHTML = '';

    if (typing) {
      quizInput.value = '';
      quizInput.placeholder = 'Type it in German';
      quizInput.readOnly = false;
      quizInput.focus();
    } else {
      buildOptions(cur);
    }
  }

  function updateQuizProgress() {
    const done = quizData.filter(q => q.isCorrect).length;
    quizProgress.textContent = `Question ${quizIndex + 1} of ${quizData.length} · ✅ ${done}`;
  }

  function buildOptions(cur) {
    const side = c => cleanAnswer(c[cur.ansSide]);
    const correct = cleanAnswer(cur.a);
    const pool = [...new Set(allCards.map(side))].filter(x => x && x !== correct);
    shuffleInPlace(pool);
    const options = shuffleInPlace([correct, ...pool.slice(0, 3)]);

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = opt;
      btn.addEventListener('click', () => answerChoice(btn, opt, correct));
      quizOptions.appendChild(btn);
    });
  }

  function answerChoice(btn, selected, correct) {
    if (quizAnswered) return;
    const cur = quizData[quizIndex];
    const ok = selected === correct;
    quizOptions.classList.add('locked');
    Array.from(quizOptions.children).forEach(b => {
      if (b.textContent === correct) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });
    recordAnswer(cur, ok, ok ? '✅ Correct!' : `❌ Wrong! Correct answer: ${cur.a}`);
  }

  function checkTyped() {
    if (quizAnswered) return;
    const cur = quizData[quizIndex];
    const typed = quizInput.value.trim();
    if (!typed) {
      quizFeedback.className = 'bad';
      quizFeedback.textContent = 'Type an answer, or press Skip.';
      return;
    }

    const cleaned = cleanAnswer(cur.a);
    const variants = [...new Set([cleaned, ...cleaned.split(/\s*[\/;]\s*/)])].filter(Boolean);
    const exact = variants.some(v => lowSpaces(v) === lowSpaces(typed));
    const loose = exact || variants.some(v => normalize(v) === normalize(typed));

    quizInput.readOnly = true;
    if (exact) recordAnswer(cur, true, '✅ Correct!');
    else if (loose) recordAnswer(cur, true, `✅ Correct — with the special characters: ${cleaned}`);
    else recordAnswer(cur, false, `❌ Wrong! Correct answer: ${cur.a}`);
  }

  function skipQuestion() {
    if (quizAnswered) return;
    const cur = quizData[quizIndex];
    if (quizType.value === 'typing') quizInput.readOnly = true;
    else {
      quizOptions.classList.add('locked');
      const correct = cleanAnswer(cur.a);
      Array.from(quizOptions.children).forEach(b => {
        if (b.textContent === correct) b.classList.add('correct');
      });
    }
    recordAnswer(cur, false, `⚠ Skipped. Correct answer: ${cur.a}`, 'warning');
  }

  function recordAnswer(cur, ok, message, flashStatus) {
    quizAnswered = true;
    cur.isCorrect = ok;
    cur.timeTaken = Date.now() - cur.startTime;
    applyRating(cur.card, ok ? 3 : 1);          // quiz results feed the Leitner boxes too

    quizFeedback.className = ok ? 'ok' : 'bad';
    quizFeedback.textContent = message;
    flashQuiz(flashStatus || (ok ? 'correct' : 'wrong'));
    updateQuizProgress();
    quizNext.textContent = quizIndex + 1 >= quizData.length ? 'See results' : 'Next Question';
    renderStats();
  }

  function flashQuiz(status) {
    quizQuestion.classList.remove('flash-correct', 'flash-wrong', 'flash-warning');
    void quizQuestion.offsetWidth;               // restart the animation
    quizQuestion.classList.add('flash-' + status);
    setTimeout(() => quizQuestion.classList.remove('flash-' + status), 800);
  }

  function goNextQuiz() {
    quizIndex++;
    if (quizIndex >= quizData.length) showQuizResult();
    else showQuizQuestion();
  }

  function formatTime(ms) {
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  }

  function showQuizResult() {
    quizQuestion.hidden = true;
    quizOptions.hidden = true;
    quizForm.hidden = true;
    quizNext.hidden = true;
    quizProgress.hidden = true;
    quizFeedback.textContent = '';
    quizResult.hidden = false;

    const total = quizData.length;
    const correctCount = quizData.filter(q => q.isCorrect).length;
    const wrong = quizData.filter(q => !q.isCorrect);
    const avg = quizData.reduce((s, q) => s + q.timeTaken, 0) / total;
    const ratio = correctCount / total;
    const performance = ratio >= 0.8 ? "Excellent! You're brilliant!"
      : ratio >= 0.5 ? 'Good! Keep practicing.'
      : 'Needs improvement. Keep trying!';

    quizSummary.textContent =
      `Well done! You completed the quiz!\n` +
      `✅ Correct: ${correctCount}   ❌ Wrong: ${wrong.length}\n` +
      `⏱ Total time: ${formatTime(Date.now() - quizStart)} · Per question: ${formatTime(avg)}\n` +
      performance;

    quizWrongList.innerHTML = '';
    wrong.forEach(q => {
      const li = document.createElement('li');
      li.textContent = `${q.q}  →  ${q.a}`;
      quizWrongList.appendChild(li);
    });

    quizRetry.hidden = wrong.length === 0;
    quizRetry.textContent = `Practise mistakes (${wrong.length})`;
    confettiBurst();
  }

  quizNext.addEventListener('click', () => {
    if (!quizAnswered) skipQuestion();
    else goNextQuiz();
  });

  quizForm.addEventListener('submit', e => {
    e.preventDefault();
    if (quizAnswered) goNextQuiz();
    else checkTyped();
  });

  umlautBar.addEventListener('mousedown', e => e.preventDefault());   // keep input focus
  umlautBar.addEventListener('click', e => {
    const b = e.target.closest('button[data-char]');
    if (!b || quizInput.readOnly) return;
    quizInput.setRangeText(b.dataset.char, quizInput.selectionStart, quizInput.selectionEnd, 'end');
    quizInput.focus();
  });

  quizRetry.addEventListener('click', () => {
    const wrongCards = quizData.filter(q => !q.isCorrect).map(q => q.card);
    if (wrongCards.length) startQuiz(wrongCards);
  });

  quizExit.addEventListener('click', () => {
    leaveQuizUI();
    if (mode === 'batch') {
      loadBatch(0);                 // same as before: back to the first batch
      saveSession();
    }
    renderCard();
    renderStats();
  });

  quizType.addEventListener('change', () => {
    settings.quizType = quizType.value;
    store.set(KEYS.settings, settings);
    if (quizMode && quizResult.hidden && !quizAnswered) showQuizQuestion();
  });

  /* ---------- Settings & mobile touches ---------- */
  function applyTheme() {
    const t = ['light', 'dark'].includes(settings.theme) ? settings.theme : 'auto';
    document.documentElement.setAttribute('data-theme', t);
  }

  function settingsDone(msg) {
    settingsBox.open = false;
    notice(msg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // These run after the Shuffle / Restart handlers registered earlier
  shuffleBtn.addEventListener('click', () => { if (cards.length) settingsDone('Cards shuffled'); });
  resetBtn.addEventListener('click', () => { if (cards.length) settingsDone('Back to the original order'); });

  dailyGoalSel.addEventListener('change', () => {
    settings.dailyGoal = Number(dailyGoalSel.value) || 20;
    store.set(KEYS.settings, settings);
    renderStats();
    notice('Daily goal: ' + goal() + ' cards');
  });

  flashcard.addEventListener('contextmenu', e => e.preventDefault());   // long press must not open a menu
  themeSel.addEventListener('change', () => {
    settings.theme = themeSel.value;
    store.set(KEYS.settings, settings);
    applyTheme();
  });

  window.addEventListener('resize', fitText);

  /* ---------- Init ---------- */
  async function init() {
    yearSpan.textContent = new Date().getFullYear();
    autoplayBox.checked = !!settings.autoplay;
    dailyGoalSel.value = String(goal());
    themeSel.value = ['light', 'dark'].includes(settings.theme) ? settings.theme : 'auto';
    applyTheme();
    quizType.value = settings.quizType === 'typing' ? 'typing' : 'choice';
    syncToggleButtons();

    try {
      await loadManifest();
    } catch (err) {
      emptyText = 'Could not load the lesson list (data/manifest.json).';
      renderCard();
      renderStats();
      return;
    }
    fillMainCategories();

    const saved = store.get(KEYS.session, null) || legacySession();
    const main = saved && datasets[saved.main] ? saved.main : Object.keys(datasets)[0];
    mainCategory.value = main;
    populateSubcategories(main, saved && saved.sub);

    renderStats();
    await loadCards(subCategory.value, saved);
  }

  init();
})();
