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
      this.LEARNING_STEPS = [1, 10]; // minutes for first learning steps
    }

    async loadDeck(file) {
      this.currentDeckFile = file;
      const rawCards = await fetch(file).then(r => r.json());
      const savedState = JSON.parse(localStorage.getItem(`srs:${file}`) || "{}");

      this.cards = rawCards.map((card, i) => {
        const id = `${file}::${i}`;
        return savedState[id] ? { ...card, ...savedState[id], id } : {
          id,
          front: card.front,
          back: card.back,
          state: "new",       // new | learning | review
          interval: 0,        // in days
          ease: 2.5,
          due: Date.now(),    // timestamp
          reps: 0
        };
      });

      this.buildReviewQueue();
      this.updateStats();
    }

    // Build review queue: interleave review → learning → new
    buildReviewQueue() {
      const now = Date.now();

      const review = this.cards.filter(c => c.state === "review" && c.due <= now);
      const learning = this.cards.filter(c => c.state === "learning");
      const newCards = this.cards.filter(c => c.state === "new").slice(0, 20);

      const shuffledReview = this.shuffle(review);
      const shuffledLearning = this.shuffle(learning);
      const shuffledNew = this.shuffle(newCards);

      // Interleave: review → learning → new
      const queue = [];
      while (shuffledReview.length || shuffledLearning.length || shuffledNew.length) {
        if (shuffledReview.length) queue.push(shuffledReview.shift());
        if (shuffledLearning.length) queue.push(shuffledLearning.shift());
        if (shuffledNew.length) queue.push(shuffledNew.shift());
      }

      this.reviewQueue = queue;
      this.getNextCard();
      this.updateStats();
    }

    // Get the next card that is actually due
    getNextCard() {
      const now = Date.now();

      while (this.reviewQueue.length) {
        const next = this.reviewQueue.shift();
        if (next.due <= now) {
          currentCard = next;
          showCard();
          this.updateStats();
          return;
        } else {
          // Not due yet → put at end of queue
          this.reviewQueue.push(next);
        }
      }

      // No cards are currently due
      flashcard.textContent = "✅ No cards are due right now. Come back later!";
      currentCard = null;
      this.updateStats();
    }

    // Grade the current card
    gradeCard(rating) {
        if (!currentCard) return;
        const card = currentCard;
        const now = Date.now();

        // Find the card in this.cards and update it
        const idx = this.cards.findIndex(c => c.id === card.id);
        if (idx === -1) return;

        switch (rating) {
            case "again":
                card.state = "learning";
                card.interval = 0;
                card.due = now + 60 * 1000; // 1 min
                card.reps = 0;
                break;
            case "hard":
                card.state = "learning";
                card.due = now + 10 * 60 * 1000; // 10 min
                break;
            case "good":
                card.reps += 1;
                if (card.reps === 1) {
                    card.state = "learning";
                    card.due = now + this.LEARNING_STEPS[1] * 60 * 1000;
                } else {
                    card.state = "review";
                    card.interval = card.interval ? Math.max(1, Math.round(card.interval * card.ease)) : 1;
                    card.due = now + card.interval * 86400000;
                }
                break;
            case "easy":
                card.reps += 1;
                card.ease += 0.15;
                card.state = "review";
                card.interval = card.interval ? card.interval * 2.5 : 4;
                card.due = now + card.interval * 86400000;
                break;
        }

        // Save back to this.cards
        this.cards[idx] = { ...card };

        // Save state
        this.saveCardState(card);

        // Update stats *before* next card
        this.updateStats();

        // Add back to queue if due
        if (card.due <= Date.now()) this.reviewQueue.push(card);

        // Next card
        this.getNextCard();
    }

    // Update stats for progress bar
    updateStats() {
      const total = this.cards.length;

      const newCount = this.cards.filter(c => c.state === "new").length;
      const learningCount = this.cards.filter(c => c.state === "learning").length;
      const reviewCount = this.cards.filter(c => c.state === "review" || 
                                               (c.state === "learning" && c.reps > 1)).length;

      document.getElementById("new-count").textContent = newCount;
      document.getElementById("learning-count").textContent = learningCount;
      document.getElementById("review-count").textContent = reviewCount;

      const done = learningCount + reviewCount;
      const percent = total ? Math.round((done / total) * 100) : 0;
      document.getElementById("progress-bar").style.width = `${percent}%`;
    }

    // Save card state to localStorage
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

    // Fisher-Yates shuffle
    shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
  }

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
    if (subCategory.value) srs.loadDeck(subCategory.value);
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
    germanVoice = voices.find(v => v.lang === "de-DE") || null;
  }
  speechSynthesis.onvoiceschanged = loadGermanVoice;
  loadGermanVoice();

  function speak(text) {
    if (!text || !germanVoice) return;
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

  // Buttons to grade card (example: you can add UI buttons for these)
  document.getElementById("btnAgain")?.addEventListener("click", () => srs.gradeCard("again"));
  document.getElementById("btnHard")?.addEventListener("click", () => srs.gradeCard("hard"));
  document.getElementById("btnGood")?.addEventListener("click", () => srs.gradeCard("good"));
  document.getElementById("btnEasy")?.addEventListener("click", () => srs.gradeCard("easy"));

  // copyright
  yearSpan.textContent = today.getFullYear();
});
