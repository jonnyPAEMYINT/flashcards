document.addEventListener('DOMContentLoaded', () => {
  const flashcard = document.getElementById('flashcard');
  const nextBtn = document.getElementById('next');
  const prevBtn = document.getElementById('prev');
  const flipBtn = document.getElementById('flip');
  const shuffleBtn = document.getElementById('shuffle'); // Shuffle button
  const resetBtn = document.getElementById('restart');     // Reset button
  const mainCategory = document.getElementById('main-category'); // new main category dropdown
  const subCategory = document.getElementById('sub-category');   // new subcategory dropdown
  const reverseBtn = document.getElementById('reverse');
  const cardCount = document.getElementById('card-count');
  const slider = document.getElementById('card-slider');
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
  let currentCardIndex = 1;

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

  /**

  // Populate subcategory based on main category
  function populateSubcategories(category) {
    subCategory.innerHTML = '';
    if (!datasets[category]) return;
    datasets[category].forEach((ds, index) => {
      const option = document.createElement('option');
      option.value = ds.file;
      option.textContent = ds.name;
      if (index === 0) option.selected = true; // select first subcategory by default
      subCategory.appendChild(option);
    });
    // Load the first subcategory automatically
    if (subCategory.value) loadCards(subCategory.value);
  }

  **/
  
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

  async function loadCards(file) {
    flashcard.textContent = 'Loading...';
    try {
      const res = await fetch(file);
      cards = await res.json();
      resetDeckOriginal();
    } catch (err) {
      flashcard.textContent = 'Failed to load flashcards.';
    }
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function resetDeckOriginal() {
    indexOrder = cards.map((_, i) => i);
    currentIndex = 0;
    flipped = false;
    showCard();
  }

  function resetDeckShuffled() {
    indexOrder = cards.map((_, i) => i);
    shuffleArray(indexOrder);
    currentIndex = 0;
    flipped = false;
    showCard();
    changeflashcardcolour()
  }

  reverseBtn.addEventListener('click', () => {
    reverseMode = !reverseMode;   // toggle reverse mode
    flipped = false;              // reset flip state
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

    // In reverse mode, show back first
    if (reverseMode) {
      flashcard.textContent = flipped ? card.front : card.back;
    } else {
      flashcard.textContent = flipped ? card.back : card.front;
    }

    //Pick random color for flashcard
    //const randomColor = flashcardColors[Math.floor(Math.random() * flashcardColors.length)];
    //flashcard.style.border = '3px solid #fff';
    //flashcard.style.background = randomColor;

    // Handle flip display
    if (flipped) {
      flashcard.classList.add('flipped');
    } else {
      flashcard.classList.remove('flipped');
    }

    cardCount.textContent = (currentIndex + 1) + "/" + cards.length;

    slider.max = cards.length - 1;
    slider.value = currentIndex;
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
      flashcard.textContent = "Well done! You’ve reached the end of the flashcards.";      
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

});
