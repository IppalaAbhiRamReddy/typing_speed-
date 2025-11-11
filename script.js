// Typing Speed Test - updated for inline paragraph typing and countdown timers

class TypingSpeedTest {
  constructor() {
    this.paragraphs = [
      "The quick brown fox jumps over the lazy dog. This pangram sentence contains every letter of the alphabet at least once, making it perfect for typing practice and testing keyboard skills effectively.",
      "Technology has revolutionized the way we communicate and work. From smartphones to artificial intelligence, modern innovations continue to shape our daily lives in ways we never imagined possible.",
      "Learning to type efficiently is an essential skill in today's digital world. With consistent practice and proper technique, anyone can improve their typing speed and accuracy significantly.",
      "The sun rises in the east and sets in the west, creating beautiful patterns of light and shadow across the landscape. Nature provides endless inspiration for artists and writers alike.",
      "Reading books expands our knowledge and improves our vocabulary. Whether fiction or non-fiction, each book offers unique perspectives and valuable insights into different subjects.",
      "Exercise is crucial for maintaining good health and wellbeing. Regular physical activity helps strengthen muscles, improve cardiovascular health, and boost mental clarity and focus.",
      "Music has the power to evoke emotions and bring people together across cultures. From classical symphonies to modern pop songs, every genre offers something unique to listeners.",
      "Cooking is both an art and a science that brings joy to many. Following recipes carefully while adding personal touches creates delicious meals that friends and family will love.",
      "Travel broadens the mind and creates lasting memories. Exploring new places, trying different foods, and meeting diverse people enriches our understanding of the world.",
      "Time management skills are essential for success in both personal and professional life. Prioritizing tasks, setting realistic goals, and avoiding procrastination lead to better productivity."
    ];

    // UI references
    this.paragraphDisplay = document.getElementById('paragraphDisplay');
    this.timerDisplay = document.getElementById('timer');
    this.wpmDisplay = document.getElementById('wpm');
    this.accuracyDisplay = document.getElementById('accuracy');
    this.resultsContainer = document.getElementById('resultsContainer');
    this.finalWpm = document.getElementById('finalWpm');
    this.finalAccuracy = document.getElementById('finalAccuracy');
    this.finalTime = document.getElementById('finalTime');
    this.motivationalMessage = document.getElementById('motivationalMessage');
    this.startBtn = document.getElementById('startBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.newTestBtn = document.getElementById('newTestBtn');
    this.timerButtons = document.querySelectorAll('.timer-btn');
    this.topStats = document.getElementById('topStats');

    // state
    this.currentParagraph = '';
    this.chars = [];            // array of span elements
    this.typedIndex = 0;        // next char index user should type
    this.correctChars = 0;
    this.totalTyped = 0;
    this.state = 'IDLE';        // IDLE | RUNNING | FINISHED
    this.timerLength = 30;      // in seconds (default 30)
    this.remaining = this.timerLength;
    this.timerInterval = null;
    this.startTime = null;

    // init
    this.bindEvents();
    this.loadNewParagraph();
    this.updateTimerDisplay(this.timerLength);
  }

  bindEvents() {
    // keyboard typing captured when paragraphDisplay focused; also listen on document for convenience
    this.paragraphDisplay.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.paragraphDisplay.addEventListener('paste', (e) => e.preventDefault()); // disallow paste
    this.paragraphDisplay.addEventListener('click', () => this.paragraphDisplay.focus());

    // timer option buttons
    this.timerButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.timerButtons.forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        const s = parseInt(btn.getAttribute('data-seconds'),10);
        this.timerLength = s;
        this.resetTest();
        this.updateTimerDisplay(this.timerLength);
      });
    });

    // control buttons
    this.startBtn.addEventListener('click', () => {
      // load a new paragraph and focus the typing area (does not start timer)
      this.loadNewParagraph();
      this.paragraphDisplay.focus();
    });
    this.resetBtn.addEventListener('click', () => this.resetTest());
    this.newTestBtn.addEventListener('click', () => this.resetTest());
  }

  loadNewParagraph() {
    const randomIndex = Math.floor(Math.random() * this.paragraphs.length);
    this.currentParagraph = this.paragraphs[randomIndex];
    this.paragraphDisplay.innerHTML = '';
    this.chars = [];

    // create span for every char
    this.currentParagraph.split('').forEach((ch) => {
      const span = document.createElement('span');
      span.textContent = ch;
      span.classList.add('untyped');
      this.paragraphDisplay.appendChild(span);
      this.chars.push(span);
    });

    // reset cursor styling and states
    this.typedIndex = 0;
    this.correctChars = 0;
    this.totalTyped = 0;
    this.resultsContainer.classList.remove('show');
    this.updateTopStatsHidden(false);
    this.clearCursor();
    this.insertCursorAt(this.typedIndex);
    // ensure focus for immediate typing
    this.paragraphDisplay.classList.remove('paragraph-fade');
    void this.paragraphDisplay.offsetWidth; // force reflow
  }

  // key handling for typing over the paragraph
  handleKeyDown(e) {
    // ignore meta keys etc.
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // prevent default for keys that might scroll the page
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key) && e.key !== 'Backspace') {
      // allow space to be processed below, but prevent page scroll from spacebar if focused
      e.preventDefault();
    }

    if (this.state === 'IDLE') {
      // start testing on first usable key (excluding Shift, CapsLock, Tab...)
      if (this.isPrintableKey(e)) {
        this.startTest();
      }
    }

    if (this.state !== 'RUNNING') {
      // if not running, only allow backspace to correct (optional)
      if (e.key !== 'Backspace') {
        // do nothing else
        return;
      }
    }

    // handle keys
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (this.typedIndex > 0) {
        // remove cursor, process deletion
        this.removeCursorFrom(this.typedIndex);
        this.typedIndex--;
        const span = this.chars[this.typedIndex];
        if (span.classList.contains('correct')) {
          this.correctChars = Math.max(0, this.correctChars - 1);
        }
        // if typed previously (correct or incorrect), reduce totalTyped
        if (!span.classList.contains('untyped')) {
          this.totalTyped = Math.max(0, this.totalTyped - 1);
        }
        span.classList.remove('correct','incorrect');
        span.classList.add('untyped');
        this.insertCursorAt(this.typedIndex);
        this.updateStatsDuringTest();
      }
      return;
    }

    // printable character (includes space)
    if (this.isPrintableKey(e)) {
      e.preventDefault();
      const typedChar = e.key;
      // get expected char at typedIndex
      const expectedSpan = this.chars[this.typedIndex];
      if (!expectedSpan) {
        // typed beyond paragraph - ignore
        return;
      }
      // compare
      const expectedChar = expectedSpan.textContent;
      // normalize newline/enter: ignore Enter (we don't want to add)
      if (typedChar === 'Enter') return;

      // classification
      if (typedChar === expectedChar) {
        expectedSpan.classList.remove('untyped','incorrect');
        expectedSpan.classList.add('correct');
        this.correctChars++;
      } else {
        expectedSpan.classList.remove('untyped','correct');
        expectedSpan.classList.add('incorrect');
      }
      this.totalTyped++;
      this.typedIndex++;

      this.removeCursorFrom(this.typedIndex-1);
      this.insertCursorAt(this.typedIndex);

      // update stats (but hide WPM & accuracy until finish)
      this.updateStatsDuringTest();

      // if user typed full paragraph before time ends, finish early
      if (this.typedIndex >= this.chars.length) {
        this.finishTest();
      }
    }
  }

  isPrintableKey(e) {
    // treat single-character keys or space as printable
    if (e.key.length === 1) return true;
    if (e.key === 'Enter' || e.key === ' ') return true;
    return false;
  }

  startTest() {
    if (this.state === 'RUNNING') return;
    // set up timer
    this.state = 'RUNNING';
    this.remaining = this.timerLength;
    this.updateTimerDisplay(this.remaining);
    this.startTime = Date.now();
    this.updateTopStatsHidden(true);
    // fade-in paragraph
    this.paragraphDisplay.classList.add('paragraph-fade');
    this.clearCursor();
    this.insertCursorAt(this.typedIndex);

    // countdown interval
    this.timerInterval = setInterval(() => {
      this.remaining -= 1;
      this.updateTimerDisplay(this.remaining);
      if (this.remaining <= 5) {
        this.timerDisplay.classList.add('low');
      } else {
        this.timerDisplay.classList.remove('low');
      }
      if (this.remaining <= 0) {
        this.finishTest();
      }
    }, 1000);
  }

  updateTopStatsHidden(isTesting) {
    // topStats will get testing class to hide WPM & Accuracy during test
    if (isTesting) {
      this.topStats.classList.add('testing');
    } else {
      this.topStats.classList.remove('testing');
    }
  }

  updateTimerDisplay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const mm = String(m).padStart(1,'0');
    const ss = String(s).padStart(2,'0');
    this.timerDisplay.textContent = `${mm}:${ss}`;
  }

  updateStatsDuringTest() {
    // During test we still track WPM/Accuracy internally but keep them hidden
    // Compute WPM as (correctChars/5) / minutes elapsed
    const now = Date.now();
    const elapsedMs = Math.max(1, now - this.startTime || 1);
    const minutes = elapsedMs / 60000;
    const words = this.correctChars / 5;
    const wpm = Math.round(words / minutes) || 0;
    const accuracy = this.totalTyped ? Math.round((this.correctChars / this.totalTyped) * 100) : 100;

    // store in UI elements (hidden until show)
    this.wpmDisplay.textContent = wpm;
    this.accuracyDisplay.textContent = `${accuracy}%`;
  }

  finishTest() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    // compute final results using actual elapsed time (if started)
    const elapsedMs = this.startTime ? (Date.now() - this.startTime) : (this.timerLength * 1000);
    const minutes = Math.max( (elapsedMs / 60000), 1/60 ); // avoid division by 0
    const words = this.correctChars / 5;
    const wpm = Math.round(words / minutes) || 0;
    const accuracy = this.totalTyped ? Math.round((this.correctChars / this.totalTyped) * 100) : 100;

    // set final displays
    this.finalWpm.textContent = wpm;
    this.finalAccuracy.textContent = `${accuracy}%`;
    // time taken is timerLength - remaining (if started) else 0
    const usedSeconds = this.startTime ? Math.round(elapsedMs / 1000) : this.timerLength;
    const mm = Math.floor(usedSeconds / 60);
    const ss = usedSeconds % 60;
    this.finalTime.textContent = `${String(mm).padStart(1,'0')}:${String(ss).padStart(2,'0')}`;

    // show results area
    this.resultsContainer.classList.add('show');

    // motivational message
    this.motivationalMessage.textContent =
      wpm > 70 ? "🔥 You're lightning fast!" :
      wpm > 40 ? "💪 Great speed! Keep improving!" :
      "✨ Keep practicing — accuracy builds speed!";

    // finalize state
    this.state = 'FINISHED';
    // remove cursor
    this.clearCursor();
    // ensure WPM/Accuracy fields are visible again
    this.updateTopStatsHidden(false);
    // ensure timer display not red
    this.timerDisplay.classList.remove('low');
  }

  resetTest() {
    // clear interval
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.state = 'IDLE';
    this.correctChars = 0;
    this.totalTyped = 0;
    this.typedIndex = 0;
    this.remaining = this.timerLength;
    this.startTime = null;
    // reset UI
    this.updateTimerDisplay(this.timerLength);
    this.wpmDisplay.textContent = '0';
    this.accuracyDisplay.textContent = '100%';
    this.resultsContainer.classList.remove('show');
    this.updateTopStatsHidden(false);
    this.loadNewParagraph();
    // focus
    this.paragraphDisplay.focus();
  }

  insertCursorAt(index) {
    this.clearCursor();
    const span = this.chars[index];
    const cursor = document.createElement('i');
    cursor.className = 'cursor';
    if (span) {
      span.parentNode.insertBefore(cursor, span);
    } else {
      // append to end
      this.paragraphDisplay.appendChild(cursor);
    }
  }

  removeCursorFrom(index) {
    const existing = this.paragraphDisplay.querySelector('.cursor');
    if (existing) existing.remove();
  }

  clearCursor() {
    const existing = this.paragraphDisplay.querySelector('.cursor');
    if (existing) existing.remove();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new TypingSpeedTest();
  // ensure paragraph area is focusable initially
  app.paragraphDisplay.setAttribute('tabindex','0');
  app.paragraphDisplay.focus();
});
