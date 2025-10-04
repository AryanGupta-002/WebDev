// Quiz state
const quizState = {
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    timer: null,
    timeLeft: 30,
    answerSelected: false
};

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const loader = document.getElementById('loader');
const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const homeBtn = document.getElementById('home-btn');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const currentQuestionElement = document.getElementById('current-question');
const totalQuestionsElement = document.getElementById('total-questions');
const currentScoreElement = document.getElementById('current-score');
const finalScoreElement = document.getElementById('final-score');
const correctAnswersElement = document.getElementById('correct-answers');
const wrongAnswersElement = document.getElementById('wrong-answers');
const accuracyElement = document.getElementById('accuracy');
const timerElement = document.getElementById('timer');
const progressBar = document.querySelector('.progress-bar');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    startBtn.addEventListener('click', startQuiz);
    nextBtn.addEventListener('click', moveToNextQuestion);
    playAgainBtn.addEventListener('click', resetQuiz);
    homeBtn.addEventListener('click', goToWelcomeScreen);
});

// Fetch questions from API
async function fetchQuestions() {
    try {
        const response = await fetch('https://opentdb.com/api.php?amount=10&category=18&difficulty=medium&type=multiple');
        if (!response.ok) throw new Error('Failed to fetch questions');

        const data = await response.json();
        quizState.questions = data.results.map(q => ({
            question: q.question,
            correct_answer: q.correct_answer,
            incorrect_answers: q.incorrect_answers
        }));

        if (quizState.questions.length === 0) throw new Error('No questions returned');
    } catch (error) {
        console.error('Error fetching questions from API:', error);
        alert('Failed to load questions from API. Using default mock data.');

        quizState.questions = [
            {
                question: "What is the capital of France?",
                correct_answer: "Paris",
                incorrect_answers: ["London", "Berlin", "Madrid"]
            },
            {
                question: "Which planet is known as the Red Planet?",
                correct_answer: "Mars",
                incorrect_answers: ["Venus", "Jupiter", "Mercury"]
            },
            {
                question: "What is the largest mammal on Earth?",
                correct_answer: "Blue Whale",
                incorrect_answers: ["African Elephant", "Giraffe", "Polar Bear"]
            },
            {
                question: "Which programming language was created by James Gosling?",
                correct_answer: "Java",
                incorrect_answers: ["Python", "C++", "JavaScript"]
            },
            {
                question: "In which year did World War II end?",
                correct_answer: "1945",
                incorrect_answers: ["1939", "1944", "1950"]
            }
        ];
    }
}

// Quiz Flow
async function startQuiz() {
    showLoader();
    try {
        await fetchQuestions();
        setupQuiz();
        hideLoader();
        showScreen(quizScreen);
        startTimer();
    } catch (error) {
        console.error('Error starting quiz:', error);
        alert('Quiz could not be started.');
        hideLoader();
        showScreen(welcomeScreen);
    }
}

function setupQuiz() {
    quizState.currentQuestionIndex = 0;
    quizState.score = 0;
    quizState.correctAnswers = 0;
    quizState.wrongAnswers = 0;
    totalQuestionsElement.textContent = quizState.questions.length;
    currentScoreElement.textContent = quizState.score;
    displayQuestion();
}

function displayQuestion() {
    quizState.answerSelected = false;
    quizState.timeLeft = 30;
    updateTimerDisplay();

    const question = quizState.questions[quizState.currentQuestionIndex];
    questionText.innerHTML = decodeEntities(question.question);

    currentQuestionElement.textContent = quizState.currentQuestionIndex + 1;
    const progress = (quizState.currentQuestionIndex / quizState.questions.length) * 100;
    progressBar.style.width = `${progress}%`;

    optionsContainer.innerHTML = '';
    const options = [...question.incorrect_answers, question.correct_answer];
    shuffleArray(options);

    options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.classList.add('option');
        optionElement.innerHTML = `
            <div class="option-prefix">${String.fromCharCode(65 + index)}</div>
            <div class="option-text">${decodeEntities(option)}</div>
        `;
        optionElement.addEventListener('click', () => {
            if (quizState.answerSelected) return;
            quizState.answerSelected = true;
            clearInterval(quizState.timer);

            const selected = option;
            const correct = question.correct_answer;

            if (selected === correct) {
                optionElement.classList.add('correct');
                quizState.score += 10;
                quizState.correctAnswers++;
                currentScoreElement.textContent = quizState.score;
            } else {
                optionElement.classList.add('wrong');
                quizState.wrongAnswers++;
                optionsContainer.querySelectorAll('.option').forEach(opt => {
                    if (opt.querySelector('.option-text').textContent === decodeEntities(correct)) {
                        opt.classList.add('correct');
                    }
                });
            }

            optionsContainer.querySelectorAll('.option').forEach(opt => opt.style.cursor = 'default');
            nextBtn.style.display = 'block';
        });

        optionsContainer.appendChild(optionElement);
    });

    nextBtn.style.display = 'none';
}

function moveToNextQuestion() {
    clearInterval(quizState.timer);
    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
        quizState.currentQuestionIndex++;
        displayQuestion();
        startTimer();
    } else {
        showResults();
    }
}

function showResults() {
    finalScoreElement.textContent = quizState.score;
    correctAnswersElement.textContent = quizState.correctAnswers;
    wrongAnswersElement.textContent = quizState.wrongAnswers;

    const accuracy = quizState.questions.length > 0
        ? Math.round((quizState.correctAnswers / quizState.questions.length) * 100)
        : 0;
    accuracyElement.textContent = `${accuracy}%`;

    showScreen(resultsScreen);
}

function resetQuiz() {
    clearInterval(quizState.timer);
    quizState.currentQuestionIndex = 0;
    quizState.score = 0;
    quizState.correctAnswers = 0;
    quizState.wrongAnswers = 0;
    startQuiz();
}

function goToWelcomeScreen() {
    clearInterval(quizState.timer);
    showScreen(welcomeScreen);
}

// Timer Logic
function startTimer() {
    clearInterval(quizState.timer);
    quizState.timeLeft = 30;
    updateTimerDisplay();

    quizState.timer = setInterval(() => {
        quizState.timeLeft--;
        updateTimerDisplay();
        if (quizState.timeLeft <= 0) {
            clearInterval(quizState.timer);
            handleTimeUp();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(quizState.timeLeft / 60);
    const seconds = quizState.timeLeft % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timerElement.style.color = quizState.timeLeft <= 5 ? '#f44336' : '';
}

function handleTimeUp() {
    quizState.answerSelected = true;
    quizState.wrongAnswers++;

    const correct = quizState.questions[quizState.currentQuestionIndex].correct_answer;
    optionsContainer.querySelectorAll('.option').forEach(opt => {
        if (opt.querySelector('.option-text').textContent === decodeEntities(correct)) {
            opt.classList.add('correct');
        }
        opt.style.cursor = 'default';
    });

    nextBtn.style.display = 'block';
}

// Screen Control
function showLoader() {
    hideAllScreens();
    loader.style.display = 'block';
}

function hideLoader() {
    loader.style.display = 'none';
}

function showScreen(screen) {
    hideAllScreens();
    screen.classList.add('active-screen');
}

function hideAllScreens() {
    welcomeScreen.classList.remove('active-screen');
    quizScreen.classList.remove('active-screen');
    resultsScreen.classList.remove('active-screen');
}

// Helpers
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function decodeEntities(str) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
}
