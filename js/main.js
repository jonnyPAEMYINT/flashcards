document.addEventListener('DOMContentLoaded', () => {
  const flashcard = document.getElementById('flashcard');
  const nextBtn = document.getElementById('next');
  const prevBtn = document.getElementById('prev');
  const flipBtn = document.getElementById('flip');
  const shuffleBtn = document.getElementById('shuffle'); // Shuffle button
  const resetBtn = document.getElementById('reset');     // Reset button
  const categorySelect = document.getElementById('category');

  let cards = [];
  let indexOrder = [];
  let currentIndex = 0;
  let flipped = false;

  async function loadCards(file = 'data/flashcards_phrases.json') {
    flashcard.textContent = 'Loading...';
    try {
      const res = await fetch(file);
      cards = await res.json();
      resetDeckOriginal();
    } catch (err) {
      flashcard.textContent = 'Failed to load flashcards.';
    }
  }

  // Shuffle helper
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Reset deck to original order
  function resetDeckOriginal() {
    indexOrder = cards.map((_, i) => i); // original order
    currentIndex = 0;
    flipped = false;
    showCard();
  }

  // Reset deck with shuffle
  function resetDeckShuffled() {
    indexOrder = cards.map((_, i) => i);
    shuffleArray(indexOrder);
    currentIndex = 0;
    flipped = false;
    showCard();
  }

  function showCard() {
    if (cards.length === 0) {
      flashcard.textContent = 'No flashcards available.';
      return;
    }
    const card = cards[indexOrder[currentIndex]];
    flashcard.textContent = flipped ? card.back : card.front;
  }

  nextBtn.onclick = () => {
    currentIndex = (currentIndex + 1) % cards.length;
    flipped = false;
    showCard();
  };

  prevBtn.onclick = () => {
    currentIndex = (currentIndex - 1 + cards.length) % cards.length;
    flipped = false;
    showCard();
  };

  flipBtn.onclick = () => {
    flipped = !flipped;
    showCard();
  };

  shuffleBtn.onclick = () => {
    resetDeckShuffled();
  };

  resetBtn.onclick = () => {
    resetDeckOriginal();
  };

  categorySelect.onchange = () => {
    loadCards(categorySelect.value);
  };

  loadCards(); // default load
});
