document.addEventListener('DOMContentLoaded', () => {
  const mainCategory = document.getElementById('main-category');
  const subCategory = document.getElementById('sub-category');
  const cardContainer = document.querySelector(".card-container");
  const flashcard = document.getElementById('flashcard');
  const cardCount = document.getElementById('card-count');
  const flipBtn = document.getElementById('flip');
  const ttsBtn = document.getElementById("tts-btn");
  const yearSpan = document.getElementById("year");
  const progressInfo = document.getElementById("progress-info");

  const today = new Date();
  
  let cards = [];
  let currentCard = null;
  let flipped = false;
  let finished = false;
  let reverseMode = false;

  const basePath = "https://jonnypaemyint.github.io/flashcards/"


   // Define datasets
  const datasets = {
    phrases: [
      { name: "Greetings, small talk, daily expressions", file: basePath + "data/phrases/common_phrases.json" },
      { name: "Asking directions, transportation", file: basePath + "data/phrases/travel.json" },
      { name: "Restaurants, stores, prices", file: basePath + "data/phrases/shopping.json" },
      { name: "Doctor visits, emergencies", file: basePath + "data/phrases/health.json" }
    ],
    vocabulary: [
      { name: "Family members & relationships", file: basePath + "data/vocabulary/family.json" },
      { name: "Emotions & personality traits", file: basePath + "data/vocabulary/feelings.json" },
      { name: "Health & body", file: basePath + "data/vocabulary/health_body.json" },
      { name: "Clothes & describing people", file: basePath + "data/vocabulary/clothing.json" },
      { name: "Colours, Shapes, and Sizes", file: basePath + "data/vocabulary/colors_shapes_sizes.json" },
      { name: "Fruits, vegetables, meals, drinks", file: basePath + "data/vocabulary/food_drink.json" },
      { name: "Household items, rooms, objects", file: basePath + "data/vocabulary/daily_life.json" },
      { name: "City & nature", file: basePath + "data/vocabulary/places.json" },
      { name: "Pets, farm, wild", file: basePath + "data/vocabulary/animals.json" },
      { name: "Modes of transport", file: basePath + "data/vocabulary/transport.json" },
      { name: "Day, month, weather, seasons", file: basePath + "data/vocabulary/weather_season.json" },
      { name: "School & Education", file: basePath + "data/vocabulary/school_education.json" },
      { name: "Jobs & Professions", file: basePath + "data/vocabulary/jobs_professions.json" }
    ],
    verbs: [
      { name: "A1-A2 common verbs", file: basePath + "data/verbs/a12_common_verbs.json" },
      { name: "B1-B2 common verbs", file: basePath + "data/verbs/b12_common_verbs.json" },
      { name: "A1-B2 Präteritum – Perfekt (auxiliary verb)", file: basePath + "data/verbs/a1b2_past_perfekt_verbs.json" },
      { name: "Irregular verbs", file: basePath + "data/verbs/irregularverbs.json" },
      { name: "Dative verbs", file: basePath + "data/verbs/dative_verbs.json" },   
      { name: "Reflexive Verbs", file: basePath + "data/verbs/reflexive_verbs.json" },
      { name: "Modal Verbs", file: basePath + "data/verbs/modal_verbs.json" },
      { name: "Separable verbs", file: basePath + "data/verbs/separable_verbs.json" },
      { name: "Verbs mit preposition", file: basePath + "data/verbs/preposition_verbs.json" },
      { name: "Daily routine verbs", file: basePath + "data/verbs/daily_routine_verbs.json" },
      { name: "Health and body verbs", file: basePath + "data/verbs/health_body_verbs.json" },
      { name: "Feelings and states verbs", file: basePath + "data/verbs/feelings_states_verbs.json" },
      { name: "Movement and travel verbs", file: basePath + "data/verbs/movement_travel_verbs.json" },
      { name: "Communication and social verbs", file: basePath + "data/verbs/communication_social_verbs.json" },
      { name: "Work and study verbs", file: basePath + "data/verbs/work_study_verbs.json" },
      { name: "Shopping and money verbs", file: basePath + "data/verbs/shopping_money_verbs.json" },
      { name: "Technology and Internet verbs", file: basePath + "data/verbs/technology_internet_verbs.json" },
      { name: "Problem and solution verbs", file: basePath + "data/verbs/problem_solution_verbs.json" },
      { name: "Helping and dependence verbs", file: basePath + "data/verbs/helping_dependence_verbs.json" }
    ],
    word_relationships: [
      { name: "Opposite words", file: basePath + "data/word_relationships/antonyms.json" },
      { name: "Similar words", file: basePath + "data/word_relationships/synonyms.json" },  
      { name: "Common prepositions", file: basePath + "data/word_relationships/prepositions.json" },
      { name: "Common adverbs", file: basePath + "data/word_relationships/adverb.json" },   
      { name: "Word families, compound nouns", file: basePath + "data/word_relationships/compounds.json" },
      { name: "Verbs to nouns", file: basePath + "data/word_relationships/verbs_nomen.json" },
      { name: "Prefixed verbs to nouns", file: basePath + "data/word_relationships/prefixed_verbs_nomen.json" },
      { name: "German collocation", file: basePath + "data/word_relationships/collocation.json" },
      { name: "Fixed expressions", file: basePath + "data/word_relationships/fixed_expression.json" },
      { name: "Idiomatic phrases", file: basePath + "data/word_relationships/idioms.json" }
    ],
    situations: [
      { name: "Booking tickets, directions", file: basePath + "data/situations/travel.json" },
      { name: "Ordering food", file:basePath +  "data/situations/restaurant.json" },   
      { name: "Office/school terms, phrases", file: basePath + "data/situations/work_school.json" },
      { name: "Sports, hobbies, leisure", file: basePath + "data/situations/hobbies.json" },
      { name: "Health, accidents, urgent situations", file: basePath + "data/situations/emergencies.json" }
    ],
    challenge: [
        { name: "Ausspache Herausfordern", file: basePath + "data/challenge/speaking_30_days.json" }
    ],
    sicher: {
      "A2.1": [
        {name: "Lektion 1 (Ankommen)", file: basePath + "data/sicher/A2_1/a21_lektion1_ankommen.json"},
        {name: "Lektion 2 (Zu Hause)", file: basePath + "data/sicher/A2_1/a21_lektion2_zuhause.json"},
        {name: "Lektion 3 (Essen und trinken)", file: basePath + "data/sicher/A2_1/a21_lektion3_essen_und_trinken.json"},
        {name: "Lektion 4 (Arbeitswelt)", file: basePath + "data/sicher/A2_1/a21_lektion4_arbeitswelt.json"},
        {name: "Lektion 5 (Sport und Fitness)", file: basePath + "data/sicher/A2_1/a21_lektion5_sport_und_fitness.json"},
        {name: "Lektion 6 (Ausbildung und Karriere)", file: basePath + "data/sicher/A2_1/a21_lektion6_ausbildung_und_karriere.json"},
        {name: "Lektion 7 (Feste und Geschenke)", file: basePath + "data/sicher/A2_1/a21_lektion7_Feste_und_geschenke.json"}
      ],
      "A2.2": [
        {name: "Lektion 8 (Am Wochenende)", file: basePath + "data/sicher/A2_2/a22_lektion8_am_wochenende.json"},
        {name: "Lektion 9 (Meine Sachen)", file: basePath + "data/sicher/A2_2/a22_lektion9_meine_sachen.json"},
        {name: "Lektion 10 (Kommunikation)", file: basePath + "data/sicher/A2_2/a22_lektion10_kommunikation.json"},
        {name: "Lektion 11 (Unterwegs)", file: basePath + "data/sicher/A2_2/a22_lektion11_unterwegs.json"},
        {name: "Lektion 12 (Reisen)", file: basePath + "data/sicher/A2_2/a22_lektion12_reisen.json"},
        {name: "Lektion 13 (Geld)", file: basePath + "data/sicher/A2_2/a22_lektion13_geld.json"},
        {name: "Lektion 14 (Lebensstationen)", file: basePath + "data/sicher/A2_2/a22_lektion14_lebensstationen.json"}
      ],
      "B1.1": [
        {name: "Lektion 1 (Glück im Alltag)", file: basePath + "data/sicher/B1_1/b1_lektion1_glück_im_alltag.json"},
        {name: "Lektion 2 (Unterhaltung)", file: basePath + "data/sicher/B1_1/b1_lektion2_unterhaltung.json"},
        {name: "Lektion 3 (Gesund bleiben)", file: basePath + "data/sicher/B1_1/b1_lektion3_gesund_bleiben.json"},
        {name: "Lektion 4 (Sprachen)", file: basePath + "data/sicher/B1_1/b1_lektion4_sprachen.json"},
        {name: "Lektion 5 (Eine Arbeit finden)", file: basePath + "data/sicher/B1_1/b1_lektion5_eine_arbeit_finden.json"},
        {name: "Lektion 6 (Dienstleistung)", file: basePath + "data/sicher/B1_1/b1_lektion6_dienstleistung.json"},
        {name: "Lektion 7 (Rund ums Wohnen)", file: basePath + "data/sicher/B1_1/b1_lektion7_rund_ums_wohnen.json"}
      ],
      "B1.2": [
        {name: "Lektion 8 (Unter Kollegen)", file: basePath + "data/sicher/B1_2/b12_lektion8_unter_kollegen.json"},
        {name: "Lektion 9 (Virtuelle Welt)", file: basePath + "data/sicher/B1_2/b12_lektion9_virtuelle_welt.json"},
        {name: "Lektion 10 (Werbung und Konsum)", file: basePath + "data/sicher/B1_2/b12_lektion10_werbung_und_konsum.json"},
        {name: "Lektion 11 (Miteinander)", file: basePath + "data/sicher/B1_2/b12_lektion11_miteinander.json"},
        {name: "Lektion 12 (Soziales Engagement)", file: basePath + "data/sicher/B1_2/b12_lektion12_soziales_engagement.json"},
        {name: "Lektion 13 (Aus Politik und Geschichte)", file: basePath + "data/sicher/B1_2/b12_lektion13_aus_politik_und_geschichte.json"},
        {name: "Lektion 14 (Alte und neue Heimat)", file: basePath + "data/sicher/B1_2/b12_lektion14_alte_und_neue_heimat.json"}
      ]
    }
  };

  // SRS system
  class SRS {
    constructor() {
      this.cards = [];
      this.reviewQueue = [];
      this.currentDeckFile = null;

      // Adjustable learning steps (in minutes)
      this.LEARNING_STEPS = [1, 10, 60]; 

      this.NEW_LIMIT = 20;
      this.LEARN_AHEAD_MS = 20 * 60 * 1000; // 20 minutes
      this.LEARNING_REINSERT_GAP = 3; // cards later
      this.MAX_INTERVAL_DAYS = 365; // cap max interval
      this.FIRST_REVIEW_MS = 90 * 60 * 1000; // 1.5 hours first review

      this.DAILY_LIMIT_MS = 20 * 60 * 1000; // 20 minutes
      this.sessionStart = Date.now();
      this.sessionEnded = false;  
      this._dueTimer = null;


      this.sessionStats = {
        total: 0,
        new: 0,
        learning: 0,
        review: 0,
        again: 0,
        hard: 0,
        good: 0,
        easy: 0,
        startTime: Date.now()
      };

    }

    async loadDeck(file) {
      this.resetSessionStats();
      this.currentDeckFile = file;
      this.sessionStart = Date.now();
      this.sessionEnded = false;

      const rawCards = await fetch(file).then(r => r.json());
      const savedState = JSON.parse(localStorage.getItem(`srs:${file}`) || "{}");

      this.cards = rawCards.map((card, i) => {
        const id = `${file}::${i}`;
        return savedState[id]
          ? { ...card, ...savedState[id], id }
          : {
              id,
              front: card.front,
              back: card.back,
              state: "new",
              interval: 0,
              ease: 2.5,
              due: Date.now() + this.FIRST_REVIEW_MS, // set first review to 1.5h
              reps: 0
            };
      });

      this.buildReviewQueue();
      this.updateStats();

      // Reset global currentCard and flipped state
      currentCard = null;
      flipped = false;

      this.getNextCard("next");

      this.startDueWatcher();
    }

    buildReviewQueue() {
      const now = Date.now();

      const review = this.cards
        .filter(c => c.state === "review" && c.due <= now + this.LEARN_AHEAD_MS)
        .sort((a, b) => a.due - b.due);

      const learning = this.cards
        .filter(c => c.state === "learning")
        .sort((a, b) => a.reps - b.reps);

      const allowNew = !this.isSessionOver();
      const newCards = allowNew 
      ? this.cards.filter(c => c.state === "new").slice(0, this.NEW_LIMIT)
      : []; 

      const seen = new Set();
      this.reviewQueue = [...review, ...learning, ...newCards].filter(c => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });

    }

    getNextCard(direction = "next") {
      this.setUIState("card");

      if (this.isSessionOver()) {
        this.sessionEnded = true;
        currentCard = null;
        flashcard.textContent = "⏳ Daily limit reached. Come back tomorrow.";
        this.updateStats();
        return;
      }

      if (!this.reviewQueue.length) {
        this.buildReviewQueue();
      }

      if (!this.reviewQueue.length) {
        currentCard = null;
        this.showSessionSummary();
        
        const nextDue = this.cards
          .filter(c => c.due > Date.now())
          .sort((a, b) => a.due - b.due)[0];

        if (nextDue) {
            let ms = nextDue.due - Date.now();
            const days = Math.floor(ms / 86400000);
            ms %= 86400000;
            const hours = Math.floor(ms / 3600000);
            ms %= 3600000;
            const minutes = Math.ceil(ms / 60000);

            let nextText = [];
            if (days) nextText.push(`${days} day${days > 1 ? 's' : ''}`);
            if (hours) nextText.push(`${hours} hour${hours > 1 ? 's' : ''}`);
            if (minutes) nextText.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
            flashcard.textContent += `\nNext card in ${nextText.join(' ')}`;
        }

        this.updateStats();
        this.startDueWatcher();
        return;
      }

      const nextCard = this.reviewQueue.shift();
      slideCard(direction, () => {
        currentCard = nextCard;
        showCard();  // content updates AFTER slide animation
        this.updateStats();
      });

    }

    gradeCard(rating) {
      if (!currentCard) return;

      const card = currentCard;
      const now = Date.now();
      const idx = this.cards.findIndex(c => c.id === card.id);
      if (idx === -1) return;

      this.sessionStats.total++;
      this.sessionStats[rating]++;

      if (card.state === "new") this.sessionStats.new++;
      else if (card.state === "learning") this.sessionStats.learning++;
      else if (card.state === "review") this.sessionStats.review++;

      switch (rating) {
        case "again":
          card.state = "learning";
          card.interval = 0;
          card.reps = 0;
          card.due = now + 60 * 1000;
          card.ease = Math.max(1.3, card.ease - 0.2);
          break;

        case "hard":
          card.state = "learning";
          card.due = now + 5 * 60 * 1000;
          card.ease = Math.max(1.3, card.ease - 0.15);
          break;

        case "good":
          card.reps += 1;
          if (card.reps < this.LEARNING_STEPS.length) {
            card.state = "learning";
            card.due = now + this.LEARNING_STEPS[card.reps] * 60 * 1000;
          } else {
            card.state = "review";
            card.interval = card.interval
              ? Math.min(this.MAX_INTERVAL_DAYS, Math.round(card.interval * card.ease))
              : 1;
            card.due = now + card.interval * 86400000;
          }
          break;

        case "easy":
          card.reps += 1;
          card.ease += 0.15;
          card.state = "review";
          card.interval = card.interval ? Math.min(this.MAX_INTERVAL_DAYS, card.interval * 2.5) : 4;
          card.due = now + card.interval * 86400000;
          break;
      }

      // Reinsert learning card dynamically
      if (card.state === "learning") {
        const gap =
        rating === "again" ? 1 :
        rating === "hard"  ? 2 :
        Math.min(this.LEARNING_REINSERT_GAP, 5);
        const pos = Math.min(gap, this.reviewQueue.length);
        this.reviewQueue.splice(pos, 0, card);
      }

      this.cards[idx] = { ...card };
      this.saveCardState(card);
      this.updateStats();

      const direction = rating === "again" ? "right" : "left";
      this.getNextCard(direction);
    }

    updateStats() {
      const total = this.cards.length;
      const newCount = this.cards.filter(c => c.state === "new").length;
      const learningCount = this.cards.filter(c => c.state === "learning").length;
      const reviewCount = this.cards.filter(c => c.state === "review" || (c.state === "learning" && c.reps > 1)).length;

      document.getElementById("new-count").textContent = newCount;
      document.getElementById("learning-count").textContent = learningCount;
      document.getElementById("review-count").textContent = reviewCount;

      const done = learningCount + reviewCount;
      const percent = total ? Math.round((done / total) * 100) : 0;
      document.getElementById("progress-bar").style.width = `${percent}%`;
    }

    showSessionSummary() {
      this.setUIState("summary");
      const s = this.sessionStats;
      const durationMin = Math.max(
        1,
        Math.round((Date.now() - s.startTime) / 60000)
      );

      let retention = 0;
      const graded = s.again + s.hard + s.good + s.easy;
      if (graded) {
        retention = Math.round(((s.good + s.easy) / graded) * 100);
      }

      let summary = [
        "📊 Session summary",
        "",
        `Cards reviewed: ${s.total}`,
        `• New: ${s.new}`,
        `• Learning: ${s.learning}`,
        `• Review: ${s.review}`,
        "",
        `Performance: ${retention}% retention`,
        `Again: ${s.again}  Hard: ${s.hard}`,
        `Good: ${s.good}  Easy: ${s.easy}`,
        "",
        `Time spent: ${durationMin} min`
      ];

      flashcard.textContent = summary.join("\n");
    }

    saveCardState(card) {
      const deckKey = `srs:${this.currentDeckFile}`;
      const state = JSON.parse(localStorage.getItem(deckKey) || "{}");
      state[card.id] = {
        state: card.state,
        interval: card.interval,
        ease: card.ease,
        due: card.due,
        reps: card.reps
      };
      localStorage.setItem(deckKey, JSON.stringify(state));
    }

    startDueWatcher() {
      if (this._dueTimer) clearTimeout(this._dueTimer);

      const now = Date.now();
      const dueCards = this.cards.filter(c => c.due <= now);

      if (dueCards.length > 0 && !currentCard) {
        this.buildReviewQueue();
        this.getNextCard();
      }

      const upcoming = this.cards
        .filter(c => c.due > now)
        .sort((a, b) => a.due - b.due);

      if (upcoming.length > 0) {
        const nextDue = upcoming[0].due - now;
        this._dueTimer = setTimeout(() => this.startDueWatcher(), nextDue);
      }
    }

    isSessionOver() {
      return Date.now() - this.sessionStart >= this.DAILY_LIMIT_MS;
    }

    resetSessionStats() {
      this.sessionStats = {
        total: 0,
        new: 0,
        learning: 0,
        review: 0,
        again: 0,
        hard: 0,
        good: 0,
        easy: 0,
        startTime: Date.now()
      };
    }

    setUIState(mode) {
      if (mode === "card") {
        ttsBtn.classList.remove("hidden");
      } else {
        ttsBtn.classList.add("hidden");
      }
    }

  } // end of class

  const srs = new SRS();


  // Add this at the end of DOMContentLoaded
  populateSubcategories(mainCategory.value); // load subcategory and first deck on page load

  // Populate subcategory
  function populateSubcategories(category) {
    subCategory.innerHTML = '';
    const ds = datasets[category];
    if (!ds) return;

    if (Array.isArray(ds)) {
      ds.forEach((item, index) => {
        const option = document.createElement('option');
        option.value = item.file;
        option.textContent = item.name;
        subCategory.appendChild(option);
      });
    } else {
      Object.keys(ds).forEach(group => {
        const header = document.createElement('option');
        header.textContent = `▶ ${group}`;
        header.disabled = true;
        header.style.fontWeight = 'bold';
        subCategory.appendChild(header);

        ds[group].forEach(item => {
          const option = document.createElement('option');
          option.value = item.file;
          option.textContent = `   ${item.name}`;
          subCategory.appendChild(option);
        });
      });
    }

    const first = Array.from(subCategory.options).find(opt => !opt.disabled);
    if (first) {
      first.selected = true;
      srs.loadDeck(first.value); // <-- ensures first real deck is loaded
    }
  }

  mainCategory.addEventListener('change', () => populateSubcategories(mainCategory.value));
  subCategory.addEventListener('change', () => {
  if (subCategory.value) {
      flipped = false;
      currentCard = null;
      srs.loadDeck(subCategory.value);
    }
  });

  // Display current card
  function showCard() {
    if (!currentCard) {
      flashcard.textContent = "No cards!";
      return;
    }

    let content = reverseMode ? (flipped ? currentCard.front : currentCard.back)
                              : (flipped ? currentCard.back : currentCard.front);

    flashcard.textContent = content;
    flipped ? flashcard.classList.add("flipped") : flashcard.classList.remove("flipped");
  }

  // TTS
  let germanVoice = null;

  function loadGermanVoice() {
    const voices = speechSynthesis.getVoices();
    germanVoice =
      voices.find(v => v.lang === "de-DE" && v.name.toLowerCase().includes("google")) ||
      voices.find(v => v.lang === "de-DE") ||
      voices.find(v => v.lang.startsWith("de")) ||
      null;
  }
  
  speechSynthesis.onvoiceschanged = loadGermanVoice;
  loadGermanVoice();

  function speak(text) {
    if (!text || !germanVoice) return;
    text = stripAfterDashOrParen(text);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE"; u.voice = germanVoice; u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  flashcard.addEventListener("pointerdown", () => {
    pressStartTime = Date.now();
    longPressTriggered = false;

    requestAnimationFrame(() => {
      const checkLongPress = () => {
        const duration = Date.now() - pressStartTime;
        if (duration >= 450 && !longPressTriggered) {
          longPressTriggered = true;
          const text = flipped ? currentCard.back : currentCard.front;
          speak(text);
        }
        if (!longPressTriggered) requestAnimationFrame(checkLongPress);
      };
      requestAnimationFrame(checkLongPress);
    });
  });

  flashcard.addEventListener("pointerup", () => {
    const duration = Date.now() - pressStartTime;
    if (duration < 450) { flipped = !flipped; showCard(); }
    longPressTriggered = true;
  });

  flashcard.addEventListener("pointerleave", () => { longPressTriggered = true; if (speechSynthesis.speaking) speechSynthesis.cancel(); });

  ttsBtn.addEventListener("click", () => {
    if (!currentCard) return;
    const text = flipped ? currentCard.back : currentCard.front;
    speak(text);
  });

  function stripAfterDashOrParen(str) {
    return str
    .split("(")[0]
    .replace(/,\s*-\w+/g, "")
    .split("- ")[0]
    .split(".")[0]
    .trim();
  }

  function slideCard(direction, callback) {
    const className = direction === "next" ? "slide-left" : "slide-right";

      flashcard.classList.add(className);
      ttsBtn.classList.add("hidden");

      setTimeout(() => {
        flashcard.classList.remove(className);
        ttsBtn.classList.remove("hidden");
        callback();  // update card data AFTER slide
      }, 350);
  }

  // Buttons to grade card (example: you can add UI buttons for these)
  document.getElementById("btnAgain")?.addEventListener("click", () => srs.gradeCard("again"));
  document.getElementById("btnHard")?.addEventListener("click", () => srs.gradeCard("hard"));
  document.getElementById("btnGood")?.addEventListener("click", () => srs.gradeCard("good"));
  document.getElementById("btnEasy")?.addEventListener("click", () => srs.gradeCard("easy"));

  // copyright
  yearSpan.textContent = today.getFullYear();
});
