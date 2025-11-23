document.addEventListener('DOMContentLoaded', () => {
  const mainCategory = document.getElementById('main-category');
  const subCategory = document.getElementById('sub-category');
  const cardContainer = document.querySelector(".card-container");
  const flashcard = document.getElementById('flashcard');
  const cardCount = document.getElementById('card-count');
  const slider = document.getElementById('card-slider');
  const flashCardButtons = document.querySelector(".controls");
  const nextBtn = document.getElementById('next');
  const prevBtn = document.getElementById('prev');
  const flipBtn = document.getElementById('flip');
  const shuffleBtn = document.getElementById('shuffle');
  const resetBtn = document.getElementById('restart');
  const reverseBtn = document.getElementById('reverse');
  const nextBatchBtn = document.getElementById("next-batch");  
  const repeatBatchBtn = document.getElementById('repeat-batch');
  const yearSpan = document.getElementById("year");
  

  const today = new Date();
  
  //const basePath = ""
  const basePath = "https://jonnypaemyint.github.io/flashcards/"

  let cards = [];
  let indexOrder = [];
  let currentIndex = 0;
  let flipped = false;
  let finished = false;
  let reverseMode = false; // new variable to track reverse mode
  let quizMode = false;
  let currentCardIndex = 1;

  // BATCH
  let allCards = [];          // Full deck (all batches)
  let batchIndex = 0;         // Tracks which batch is showing
  let batchSize = 15;         // Number of cards per batch
  let totalBatches = 0;
  let currentBatch = 0;
  let previousCards = [];
  let reviewHistory = new Map(); // card -> last batch index it was used for
  let lastLoadedNewCards = [];

  const flashcardColors = [
                            '#d4edc4', // green
                            '#fff4b3', // yellow
                            '#ffd6d1', // coral
                            '#cbe7ff'  // blue
                          ];

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
      { name: "Verbs mit preposition", file: basePath + "data/verbs/preposition_verbs.json" }
    ],
    word_relationships: [
      { name: "Opposite words", file: basePath + "data/word_relationships/antonyms.json" },
      { name: "Similar words", file: basePath + "data/word_relationships/synonyms.json" },  
      { name: "Common prepositions", file: basePath + "data/word_relationships/prepositions.json" },
      { name: "Common adverbs", file: basePath + "data/word_relationships/adverb.json" },   
      { name: "Word families, compound nouns", file: basePath + "data/word_relationships/compounds.json" },
      { name: "Verbs to nouns", file: basePath + "data/word_relationships/verbs_nomen.json" },
      { name: "Prefixed verbs to nouns", file: basePath + "data/word_relationships/prefixed_verbs_nomen.json" },
      { name: "Fixed expressions, idiomatic phrases", file: basePath + "data/word_relationships/idioms.json" }
    ],
    situations: [
      { name: "Booking tickets, directions", file: basePath + "data/situations/travel.json" },
      { name: "Ordering food", file:basePath +  "data/situations/restaurant.json" },   
      { name: "Office/school terms, phrases", file: basePath + "data/situations/work_school.json" },
      { name: "Sports, hobbies, leisure", file: basePath + "data/situations/hobbies.json" },
      { name: "Health, accidents, urgent situations", file: basePath + "data/situations/emergencies.json" }
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
  
  // Populate subcategory based on main category with grouped headers
  function populateSubcategories(category) {
    subCategory.innerHTML = '';

    if (!datasets[category]) return;

    const ds = datasets[category];

    if (Array.isArray(ds)) {

      // Normal flat datasets
      ds.forEach((item, index) => {
        const option = document.createElement('option');
        option.value = item.file;
        option.textContent = item.name;
        if (index === 0) option.selected = true;
        subCategory.appendChild(option);
      });

    } else {

      // Grouped dataset (like 'sicher')
      Object.keys(ds).forEach(groupName => {
        // Add a non-selectable group header with arrow
        const headerOption = document.createElement('option');
        headerOption.textContent = `▶ ${groupName}`; // arrow to indicate group
        headerOption.disabled = true;
        headerOption.style.fontWeight = 'bold';
        headerOption.style.backgroundColor = '#f0f0f0';
        headerOption.style.color = '#333';
        subCategory.appendChild(headerOption);

        // Add items under the header
        ds[groupName].forEach(item => {
          const option = document.createElement('option');
          option.value = item.file;
          option.textContent = `   ${item.name}`; // indent for readability
          subCategory.appendChild(option);
        });
      });

    }

    // Automatically select and load the first selectable item
    const firstSelectable = Array.from(subCategory.options).find(opt => !opt.disabled);

    if (firstSelectable) {
      firstSelectable.selected = true;
      loadCards(firstSelectable.value);
    }
    
  }

  mainCategory.addEventListener('change', () => {
    populateSubcategories(mainCategory.value);
  });

  subCategory.addEventListener('change', () => {
    if (subCategory.value) loadCards(subCategory.value);
  });

  // Set default main category to "phrases"
  mainCategory.value = 'phrases';
  populateSubcategories('phrases');


  // load flasch cards
  async function loadCards(file) {
    flashcard.textContent = 'Loading...';

    try {
      const res = await fetch(file);
      allCards = await res.json();

      batchIndex = 0; // reset batch index
      previousCards = []; // rest previous card

      totalBatches = Math.ceil(allCards.length / batchSize);
      
      loadBatch(batchIndex); // load first batch

    } catch (err) {
      flashcard.textContent = 'Failed to load flashcards.';
    }

    if (quizMode == true) startQuizMode();
  }

  function loadBatch(index, isRepeat = false) {
    if (!allCards.length) return;

    const freshCount = index === 0 ? 15 : 10;

    let newCards;

    if (isRepeat && lastLoadedNewCards.length && index === currentBatch) {
      // Reload previous fresh cards
      newCards = lastLoadedNewCards.slice();
      newCards.forEach(card => card.isOld = false);
    } else {
      const start = previousCards.length;
      const end = Math.min(start + freshCount, allCards.length);
      newCards = allCards.slice(start, end);
      newCards.forEach(card => card.isOld = false);

      // Store for repeat button
      lastLoadedNewCards = newCards.slice();
    }

    let reviewCards = [];

    if (index > 0) {
      const usedSet = new Set(newCards);
      const eligibleReview = previousCards.filter(c => !usedSet.has(c));

      // Sort by least recently reviewed
      eligibleReview.sort((a, b) => {
        const lastA = reviewHistory.get(a) ?? -1;
        const lastB = reviewHistory.get(b) ?? -1;
        return lastA - lastB;
      });

      // Fill the batch to make batchSize
      const needed = batchSize - newCards.length;
      reviewCards = eligibleReview.slice(0, needed);
      reviewCards.forEach(card => reviewHistory.set(card, index));
      reviewCards.forEach(card => card.isOld = true);
    }

    // Final batch to display
    cards = [...newCards, ...reviewCards];

    // Only count fresh cards for previousCards
    if (!isRepeat) previousCards.push(...newCards);

    // Reset deck/UI
    resetDeckOriginal();
    nextBatchBtn.style.display = "none";
    repeatBatchBtn.style.display = "none";
    flashCardButtons.style.display = "flex";

    //console.log("Batch:", index, 
    //            "New:", newCards.length, 
    //            "Review:", reviewCards.length, 
    //            "Final:", cards.length);
}

  function getUniqueReviewCards(previousCards, excludeCards, count = 5) {
    // Filter out cards already in the current batch
    const pool = previousCards.filter(card => !excludeCards.includes(card));

    // Use a Set to make sure we only get unique cards
    const uniquePool = Array.from(new Set(pool));

    // Shuffle the unique pool
    shuffleArray(uniquePool);

    // Return only the requested number of review cards
    return uniquePool.slice(0, Math.min(count, uniquePool.length));
}

  function returnShuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function resetDeckOriginal() {
    indexOrder = cards.map((_, i) => i);
    restFlashCards();
    showCard();
  }

  function resetDeckShuffled() {
    indexOrder = cards.map((_, i) => i);
    shuffleArray(indexOrder);
    restFlashCards();
    showCard();
    changeflashcardcolour()
  }

  nextBatchBtn.addEventListener("click", () => {
      currentBatch++;
      loadBatch(currentBatch);
      nextBatchBtn.style.display = "none";
      repeatBatchBtn.style.display = "none";
  });

  repeatBatchBtn.addEventListener("click", () => {
    loadBatch(currentBatch, true); // reload same batch
    nextBatchBtn.style.display = "none";
    repeatBatchBtn.style.display = "none";
  });

  reverseBtn.addEventListener('click', () => {
    reverseMode = !reverseMode;   // toggle reverse mode
    flipped = false;              // reset flip state
    finished = false
    showCard();

    // toggle visual style
    if (reverseMode) {
      reverseBtn.classList.add('active-reverse');
    } else {
      reverseBtn.classList.remove('active-reverse');
    }

  });

  function showCard() {
    if (!cards.length) {
      flashcard.textContent = 'No flashcards available.';
      return;
    }

    const card = cards[indexOrder[currentIndex]];

    let content = reverseMode
        ? (flipped ? card.front : card.back)
        : (flipped ? card.back : card.front);

    if (card.isOld) {
      content = "(Review) \n\n" + content;
      flashcard.classList.add('old-card');
    }else{
      flashcard.classList.remove('old-card');
    }

    flashcard.textContent = content;

    // Handle flip display
    if (flipped) {
      flashcard.classList.add('flipped');
    } else {
      flashcard.classList.remove('flipped');
    }

    cardCount.textContent = (currentIndex + 1) + "/" + cards.length;

    slider.max = cards.length - 1;
    slider.value = currentIndex;

    if (!finished) startQuizBtn.style.display = "none";

  }

  function changeflashcardcolour(){
    //Pick random color for flashcard
    const randomColor = flashcardColors[Math.floor(Math.random() * flashcardColors.length)];
    flashcard.style.border = '3px solid #fff';
    flashcard.style.background = randomColor;
  }

  slider.addEventListener('input', (e) => {
    currentIndex = parseInt(e.target.value);
    flipped = false;
    showCard();
  });

  preventDoubleClick(flashcard, () => {
    if(finished) return; // come to the end of the flash card. disable flip function;

    flipped = !flipped; 
    flashcard.classList.toggle('flipped');
    showCard();
  });

  preventDoubleClick(nextBtn, () => {
    if (currentIndex < cards.length - 1) {
      currentIndex = (currentIndex + 1) % cards.length;
      flipped = false;
      showCard();

    } else {
      flipped = false;
      finished = true;
      showCard();

      const totalCards = allCards.length;
      const cardsSeen = previousCards.length;

      //console.log("totalCards", totalCards, "cardsSeen", cardsSeen);

      if(cardsSeen < totalCards) {
        flashcard.textContent = `Great! Batch ${currentBatch + 1} completed.\n\nClick "Next" to continue or "Repeat" to practise more.\n\nSome old cards will reappear to help you remember.`;
        nextBatchBtn.style.display = "block";
        repeatBatchBtn.style.display = "block";
        flashCardButtons.style.display = "none";
        startQuizBtn.style.display = "none";

        return;
      }

      let quizInfo = 'Well done! You’ve completed all the flashcards.\n\nClick "Start Quiz" to test how much you’ve remembered.';
      if (currentBatch >= 0) {
         quizInfo = quizInfo.replace(/\./g,"") + ' or "Repeat" to practise more.';
         repeatBatchBtn.style.display = "block";
      }

      nextBatchBtn.style.display = "none";
      flashcard.textContent = quizInfo;
      flashCardButtons.style.display = "none";
      startQuizBtn.style.display = "block";
    }

    changeflashcardcolour();
  });

  preventDoubleClick(prevBtn, () => {
    if (currentIndex > 0) {
      if(finished == true){
          currentIndex = cards.length - 1; // last card
          finished = false;
      }else{
        currentIndex = (currentIndex - 1 + cards.length) % cards.length;
      }
      flipped = false;
      showCard();           
    } 
    changeflashcardcolour();
  });

  flipBtn.onclick = () => { flipped = !flipped; showCard(); };
  shuffleBtn.onclick = resetDeckShuffled;
  resetBtn.onclick = resetDeckOriginal;

  function preventDoubleClick(button, callback, delay = 500) {
    let clickable = true;
    button.addEventListener('click', () => {
      if (!clickable) return;
      clickable = false;
      callback();
      setTimeout(() => { clickable = true; }, delay);
    });
  }

  [nextBtn, prevBtn, shuffleBtn, resetBtn].forEach(btn => {
    preventDoubleClick(btn, () => btn.click());
  });

  //copyright year
  yearSpan.textContent = today.getFullYear();


  function stripAfterDashOrParen(str) {
    // Remove anything after "("
    str = str.split("(")[0].trim();

    // Remove hyphen only when followed by a space "- "
    if (str.includes("- ")) {
        str = str.split("- ")[0].trim();
    }

    // Remove dot and everything after it
    if (str.includes(".")) {
        str = str.split(".")[0].trim();
    }

    return str;
  }

  // -----------------------
  // QUIZ MODE
  // -----------------------

  const quizContainer = document.getElementById("quiz-container");
  const startQuizBtn = document.getElementById("start-quiz");
  const quizQuestion = document.getElementById("quiz-question");
  const quizOptions = document.getElementById("quiz-options");
  const quizNext = document.getElementById("quiz-next");
  const quizExit = document.getElementById("quiz-exit");
  const quizProgress = document.getElementById("quiz-progress");
  //const quizButton = document.querySelector(".quiz-button");
  
  let quizData = [];
  let quizIndex = 0;
  let quizStartTime;

  // Add a flag to prevent multiple rapid clicks
  let quizProcessing = false;

  quizExit.disabled = true;

  // Load quiz data from current flashcards
  function loadQuizData() {
    quizData = allCards.map(card => ({
      question: card.front,
      answer: card.back
    }));
    shuffleArray(quizData);
  }

  // Start quiz mode
  startQuizBtn.addEventListener("click", () => {
    quizStartTime = Date.now(); // start the total quiz timer
    startQuizMode();
  });

  // Display question + options
  function showQuizQuestion() {
    const current = quizData[quizIndex];

    current.startTime = Date.now(); // start the timing;
    quizQuestion.textContent = current.question;
    
    // Update progress
    quizProgress.textContent = `Question ${quizIndex + 1} of ${quizData.length}`;

    const options = generateOptions(current.answer);
    quizOptions.innerHTML = "";

    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.textContent = opt;
      btn.onclick = () => checkQuizAnswer(opt, current.answer);
      quizOptions.appendChild(btn);
    });
  }

  function showQuizResult(){
    quizQuestion.textContent = "Well done! You completed the quiz!";

    const totalTime = Date.now() - quizStartTime; // total quiz duration
    const totalTimeFormatted = formatTime(totalTime);

    const correctCount = quizData.filter(q => q.isCorrect).length;
    const wrongCount = quizData.length - correctCount;

    // Average time in seconds
    const avgTimeMs = quizData.reduce((sum, q) => sum + (q.timeTaken || 0), 0) / quizData.length;
    const avgTimeFormatted = formatTime(avgTimeMs);


    // Define feedback messages
    const performance = correctCount / quizData.length >= 0.8
        ? "Excellent! You're brilliant!"
        : correctCount / quizData.length >= 0.5
        ? "Good! Keep practicing."
        : "Needs improvement. Keep trying!";


    const timeInfo = totalTime >= 1 
        ? `⏱ Total time: ${totalTimeFormatted}. Per question: ${avgTimeFormatted}`
        : `⏱ Average per question: ${avgTimeFormatted}`

    // Reuse the option buttons
    const optionButtons = quizOptions.querySelectorAll("button");

    optionButtons[0].textContent = `✅ Correct: ${correctCount}`;
    optionButtons[1].textContent = `❌ Wrong: ${wrongCount}`;
    optionButtons[2].textContent = timeInfo;
    optionButtons[3].textContent = performance;

    // Disable buttons so user can't click them
    optionButtons.forEach(btn => btn.disabled = true);

    // Hide Next button and show Exit button
    quizNext.disabled = true;
    quizNext.style.display = "none";

    quizExit.disabled = false;
    quizExit.style.display = "block";    
  }

  // Create 4 options (1 correct + 3 random)
  function generateOptions(correct) {
    correct = stripAfterDashOrParen(correct);
    const allAnswers = cards.map(c => stripAfterDashOrParen(c.back));
    
    // Filter out the correct answer and remove duplicates
    const wrongSet = new Set(allAnswers.filter(a => a !== correct));
    const wrong = Array.from(wrongSet);
    shuffleArray(wrong);

    const options = [correct, ...wrong.slice(0, 3)];
    shuffleArray(options);
    return options;
  }

  // Check answer
  function checkQuizAnswer(selected, correct) {

    const current = quizData[quizIndex];
    const formattedAnaswer = stripAfterDashOrParen(correct);

    // save user answer
    current.userAnswer = selected;
    current.isCorrect = selected === formattedAnaswer;
    current.timeTaken = Date.now() - current.startTime;

    if (current.isCorrect) {
      flashQuizQuestion("correct", "✅ Correct!");
    } else {
      flashQuizQuestion("wrong", `❌ Wrong! Correct answer: ${correct}`);
    }

  }

  function flashQuizQuestion(status, message) {
    // status: "correct", "wrong", or "warning"
    // message: text to show in #quiz-question
    quizQuestion.textContent = message;

    // Remove all previous flash classes
    quizQuestion.classList.remove("flash-correct", "flash-wrong", "flash-warning");

    // Add the new flash class
    quizQuestion.classList.add(`flash-${status}`);

    // Remove the class after animation completes
    setTimeout(() => {
        quizQuestion.classList.remove(`flash-${status}`);

        // Enable Next button only for correct/wrong (not warning)
        if (status !== "warning") {
            quizNext.disabled = false;
        }
    }, 800);
  }

  function goToNextQuizQuestion() {
      if (quizProcessing) return; // ignore if already processing
      quizProcessing = true;

      setTimeout(() => {
          quizIndex++;
          if (quizIndex >= quizData.length) {
              showQuizResult();
              return;
          }
          showQuizQuestion();
          quizProcessing = false; // allow next action
      }, 1000);
  }

  // Next question
  quizNext.addEventListener("click", () => {
    const current = quizData[quizIndex];

    if (!current.userAnswer) {
        flashQuizQuestion("warning", "⚠ You didn't select an answer! This question will count as wrong.");

        // Mark as wrong automatically
        current.isCorrect = false;
        current.userAnswer = null;
        current.timeTaken = Date.now() - current.startTime;

        goToNextQuizQuestion();
        return;
    }

    // normal condition
    quizIndex++;

    if (quizIndex >= quizData.length) {
        showQuizResult();
        return;
    }

    showQuizQuestion();
  });

  function formatTime(ms) {
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  }

  // Exit quiz mode
  quizExit.addEventListener("click", () => {
    exitQuizMode();
  });

  function startQuizMode(){
    quizMode = true;
    loadQuizData();

    quizIndex = 0;
    cardContainer.style.display = "none";
    flashCardButtons.style.display = "none";
    startQuizBtn.style.display = "none";
    repeatBatchBtn.style.display = "none";
    nextBatchBtn.style.display = "none";
    quizContainer.style.display = "block";
    showQuizQuestion();

    quizNext.disabled = false;
    quizNext.style.display = "block";

    quizExit.disabled = true;
    quizExit.style.display = "none";
  }

  function exitQuizMode(){
    quizContainer.style.display = "none";
    cardContainer.style.display = "block";
    flashCardButtons.style.display = "flex";

    resetBatchAndQuizMode(); // rest batch and quiz mode
    resetDeckOriginal(); // rest the flash cards;
    loadBatch(0); // load the first batch
    showCard(); // show the cards
  }

  function resetBatchAndQuizMode(){
    currentBatch = 0;
    batchIndex = 0;

    quizMode = false;
    quizIndex = 0;
  }

  function restFlashCards(){
    currentIndex = 0;
    flipped = false;
    finished = false;
  }

});
