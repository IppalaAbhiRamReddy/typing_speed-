// Typing Speed Test Application

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

        this.currentParagraph = '';
        this.startTime = null;
        this.timerInterval = null;
        this.correctChars = 0;
        this.totalChars = 0;
        this.state = 'IDLE'; // IDLE, RUNNING, FINISHED

        this.initializeElements();
        this.bindEvents();
        this.loadNewParagraph();
    }

    initializeElements() {
        this.typingInput = document.getElementById('typingInput');
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
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startTest());
        this.resetBtn.addEventListener('click', () => this.resetTest());
        this.newTestBtn.addEventListener('click', () => this.resetTest());
        this.typingInput.addEventListener('input', () => this.handleTyping());
    }

    loadNewParagraph() {
        const randomIndex = Math.floor(Math.random() * this.paragraphs.length);
        this.currentParagraph = this.paragraphs[randomIndex];
        this.paragraphDisplay.innerHTML = '';
        this.currentParagraph.split('').forEach(char => {
            const span = document.createElement('span');
            span.textContent = char;
            this.paragraphDisplay.appendChild(span);
        });
    }

    startTest() {
        this.resetTest();
        this.typingInput.disabled = false;
        this.typingInput.focus();
        this.startTime = Date.now();
        this.state = 'RUNNING';
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }

    handleTyping() {
        const typedText = this.typingInput.value;
        const chars = this.paragraphDisplay.querySelectorAll('span');
        this.correctChars = 0;
        this.totalChars = typedText.length;

        chars.forEach((span, index) => {
            const typedChar = typedText[index];
            if (typedChar == null) {
                span.classList.remove('correct', 'incorrect');
            } else if (typedChar === span.textContent) {
                span.classList.add('correct');
                span.classList.remove('incorrect');
                this.correctChars++;
            } else {
                span.classList.add('incorrect');
                span.classList.remove('correct');
            }
        });

        this.updateStats();

        if (typedText === this.currentParagraph) {
            this.finishTest();
        }
    }

    updateStats() {
        const elapsedSeconds = (Date.now() - this.startTime) / 1000 || 1;
        const words = this.correctChars / 5;
        const minutes = elapsedSeconds / 60;
        const wpm = Math.round(words / minutes);
        const accuracy = this.totalChars ? Math.round((this.correctChars / this.totalChars) * 100) : 100;

        this.wpmDisplay.textContent = wpm;
        this.accuracyDisplay.textContent = `${accuracy}%`;
    }

    updateTimer() {
        const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
        const seconds = String(elapsedSeconds % 60).padStart(2, '0');
        this.timerDisplay.textContent = `${minutes}:${seconds}`;
    }

    finishTest() {
        clearInterval(this.timerInterval);
        this.state = 'FINISHED';
        this.typingInput.disabled = true;
        this.displayResults();
    }

    displayResults() {
        const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
        const seconds = String(elapsedSeconds % 60).padStart(2, '0');

        this.finalWpm.textContent = this.wpmDisplay.textContent;
        this.finalAccuracy.textContent = this.accuracyDisplay.textContent;
        this.finalTime.textContent = `${minutes}:${seconds}`;
        this.resultsContainer.classList.add('show');

        const wpm = parseInt(this.wpmDisplay.textContent);
        this.motivationalMessage.textContent =
            wpm > 70 ? "🔥 You're lightning fast!" :
            wpm > 40 ? "💪 Great speed! Keep improving!" :
            "✨ Keep practicing — accuracy builds speed!";
    }

    resetTest() {
        clearInterval(this.timerInterval);
        this.typingInput.value = '';
        this.typingInput.disabled = true;
        this.timerDisplay.textContent = '0:00';
        this.wpmDisplay.textContent = '0';
        this.accuracyDisplay.textContent = '100%';
        this.resultsContainer.classList.remove('show');
        this.correctChars = 0;
        this.totalChars = 0;
        this.state = 'IDLE';
        this.loadNewParagraph();
    }
}

document.addEventListener('DOMContentLoaded', () => new TypingSpeedTest());
