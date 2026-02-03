// Energy Alignment Quiz - Main Application Logic
// Redesigned for one-question-at-a-time premium experience

// App State
const AppState = {
    currentScreen: 'welcome',
    currentQuestionIndex: 0,
    allQuestions: [],
    answers: {},
    results: null
};

// DOM Elements
const DOM = {
    screens: {
        welcome: document.getElementById('welcome-screen'),
        quiz: document.getElementById('quiz-screen'),
        results: document.getElementById('results-screen')
    },
    startBtn: document.getElementById('start-quiz'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    quizContent: document.getElementById('quiz-content'),
    resultsContainer: document.querySelector('.results-container')
};

// Initialize App
function init() {
    // Build flat question array
    AppState.allQuestions = getAllQuestions();

    DOM.startBtn.addEventListener('click', startQuiz);
    DOM.prevBtn.addEventListener('click', prevQuestion);
    DOM.nextBtn.addEventListener('click', nextQuestion);
}

// Flatten all questions from sections into single array
function getAllQuestions() {
    const questions = [];
    sectionOrder.forEach(sectionKey => {
        const section = quizData[sectionKey];
        section.questions.forEach(question => {
            questions.push({
                ...question,
                sectionKey: sectionKey,
                sectionTitle: section.title,
                sectionIcon: section.icon,
                sectionSubtitle: section.subtitle
            });
        });
    });
    return questions;
}

// Navigation Functions
function showScreen(screenName) {
    Object.values(DOM.screens).forEach(screen => {
        screen.classList.remove('active');
    });
    DOM.screens[screenName].classList.add('active');
    AppState.currentScreen = screenName;
    window.scrollTo(0, 0);
}

function startQuiz() {
    AppState.currentQuestionIndex = 0;
    AppState.answers = {};
    showScreen('quiz');
    renderQuestion();
}

function prevQuestion() {
    if (AppState.currentQuestionIndex > 0) {
        AppState.currentQuestionIndex--;
        renderQuestion('prev');
    }
}

function nextQuestion() {
    // Validate current question
    if (!validateCurrentQuestion()) {
        return;
    }

    if (AppState.currentQuestionIndex < AppState.allQuestions.length - 1) {
        AppState.currentQuestionIndex++;
        renderQuestion('next');
    } else {
        // Calculate results and show
        calculateAndShowResults();
    }
}

// Validation
function validateCurrentQuestion() {
    const question = AppState.allQuestions[AppState.currentQuestionIndex];
    const answer = AppState.answers[question.id];
    const questionCard = document.querySelector('.question-card');

    if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
        if (questionCard) {
            questionCard.classList.add('invalid');
            shakeElement(questionCard);
        }
        return false;
    }

    if (questionCard) {
        questionCard.classList.remove('invalid');
    }
    return true;
}

function shakeElement(element) {
    element.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

// Add shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    .question-card.invalid {
        border-color: var(--error) !important;
    }
`;
document.head.appendChild(style);

// Render Functions
function renderQuestion(direction = 'none') {
    const question = AppState.allQuestions[AppState.currentQuestionIndex];
    const questionNumber = AppState.currentQuestionIndex + 1;
    const totalQuestions = AppState.allQuestions.length;

    updateProgress();
    updateNavigation();

    // Determine animation class
    let animationClass = 'fade-in';
    if (direction === 'next') animationClass = 'slide-in-right';
    if (direction === 'prev') animationClass = 'slide-in-left';

    const html = `
        <div class="question-wrapper ${animationClass}">
            <div class="section-indicator">
                <span class="section-icon">${question.sectionIcon}</span>
                <span class="section-name">${question.sectionTitle}</span>
            </div>
            <div class="question-card" data-question-id="${question.id}">
                <p class="question-text">
                    <span class="question-number">${questionNumber}.</span>
                    ${question.text}
                </p>
                ${renderQuestionInput(question)}
            </div>
        </div>
    `;

    DOM.quizContent.innerHTML = html;
    attachQuestionListeners(question);
    window.scrollTo(0, 0);
}

function renderQuestionInput(question) {
    const currentAnswer = AppState.answers[question.id];

    switch (question.type) {
        case 'text':
            return `
                <input type="text" 
                    class="text-input" 
                    id="${question.id}"
                    placeholder="${question.placeholder || ''}"
                    value="${currentAnswer || ''}">
            `;

        case 'single':
        case 'categorical':
            return `
                <div class="options-grid">
                    ${question.options.map(opt => `
                        <label class="option-label ${currentAnswer === opt.value ? 'selected' : ''}" data-value="${opt.value}">
                            <input type="radio" class="option-radio" name="${question.id}" value="${opt.value}" ${currentAnswer === opt.value ? 'checked' : ''}>
                            <span class="option-indicator"></span>
                            <span class="option-text">${opt.label}</span>
                        </label>
                    `).join('')}
                </div>
            `;

        case 'likert':
            // Personality test style circles (no slider, varying sizes)
            const selectedValue = parseInt(currentAnswer) || 0;
            return `
                <div class="personality-scale">
                    <span class="scale-label scale-label-left">Disagree</span>
                    <div class="scale-circles">
                        ${[1, 2, 3, 4, 5].map(val => {
                // Size classes: ends are larger, middle is smaller
                const sizeClass = val === 1 || val === 5 ? 'size-lg' :
                    val === 2 || val === 4 ? 'size-md' : 'size-sm';
                // Color classes: left side teal, right side green, middle neutral
                const colorClass = val <= 2 ? 'color-disagree' :
                    val >= 4 ? 'color-agree' : 'color-neutral';
                return `
                                <div class="scale-circle ${sizeClass} ${colorClass} ${selectedValue === val ? 'selected' : ''}" 
                                     data-value="${val}">
                                </div>
                            `;
            }).join('')}
                    </div>
                    <span class="scale-label scale-label-right">Agree</span>
                </div>
            `;

        default:
            return '';
    }
}

function getLikertLabel(value) {
    const labels = {
        1: 'Strongly Disagree',
        2: 'Disagree',
        3: 'Neutral',
        4: 'Agree',
        5: 'Strongly Agree'
    };
    return labels[value] || '';
}

function attachQuestionListeners(question) {
    // Text inputs
    const textInput = document.querySelector('.text-input');
    if (textInput) {
        textInput.addEventListener('input', (e) => {
            AppState.answers[e.target.id] = e.target.value;
            removeInvalidState();
        });
        textInput.focus();
    }

    // Radio options (single, categorical)
    document.querySelectorAll('.option-label').forEach(label => {
        label.addEventListener('click', (e) => {
            const radio = label.querySelector('.option-radio');
            const questionId = radio.name;
            const value = radio.value;

            // Update state
            AppState.answers[questionId] = value;

            // Update UI
            const siblings = label.parentElement.querySelectorAll('.option-label');
            siblings.forEach(sib => sib.classList.remove('selected'));
            label.classList.add('selected');

            removeInvalidState();
        });
    });

    // Personality scale circles (likert)
    const scaleCircles = document.querySelectorAll('.scale-circle');
    if (scaleCircles.length > 0) {
        scaleCircles.forEach(circle => {
            circle.addEventListener('click', () => {
                const value = circle.dataset.value;

                // Update state
                AppState.answers[question.id] = value;

                // Update UI - remove selected from all, add to clicked
                scaleCircles.forEach(c => c.classList.remove('selected'));
                circle.classList.add('selected');

                removeInvalidState();
            });
        });
    }
}

function removeInvalidState() {
    const card = document.querySelector('.question-card');
    if (card) card.classList.remove('invalid');
}

function updateProgress() {
    const totalQuestions = AppState.allQuestions.length;
    const progress = ((AppState.currentQuestionIndex + 1) / totalQuestions) * 100;
    DOM.progressFill.style.width = `${progress}%`;
    DOM.progressText.textContent = `Question ${AppState.currentQuestionIndex + 1} of ${totalQuestions}`;
}

function updateNavigation() {
    DOM.prevBtn.disabled = AppState.currentQuestionIndex === 0;

    const isLastQuestion = AppState.currentQuestionIndex === AppState.allQuestions.length - 1;
    DOM.nextBtn.innerHTML = isLastQuestion
        ? `<span>See My Results</span>
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M5 12h14M12 5l7 7-7 7"/>
           </svg>`
        : `<span>Next</span>
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M5 12h14M12 5l7 7-7 7"/>
           </svg>`;
}

// Results Functions
function calculateAndShowResults() {
    AppState.results = ScoringEngine.calculateResults(AppState.answers);
    showScreen('results');
    renderResults();
}

function renderResults() {
    const { results } = AppState;

    const html = `
        <!-- Report Header -->
        <div class="report-header">
            <p class="report-greeting">Hi ${results.userName},</p>
            <h1 class="report-title">Your Energy Alignment Report</h1>
        </div>
        
        <!-- Score Display -->
        <div class="score-display">
            <div class="score-circle" style="border-color: ${results.archetype.color}">
                <span class="score-value">${results.eas}</span>
                <span class="score-label">Energy Score</span>
            </div>
        </div>
        
        <!-- Archetype Card -->
        <div class="archetype-card" style="border-color: ${results.archetype.color}40">
            <span class="archetype-icon">${results.archetype.icon}</span>
            <h2 class="archetype-name" style="color: ${results.archetype.color}">${results.archetype.name}</h2>
            <p class="archetype-description">${results.archetype.description}</p>
        </div>
        
        <!-- Dimension Scores -->
        <div class="dimensions-section">
            <h3 class="dimensions-title">Your Energy Dimensions</h3>
            <div class="dimension-grid">
                ${renderDimensionItem('RO', results.dimensions.RO, true)}
                ${renderDimensionItem('EO', results.dimensions.EO, true)}
                ${renderDimensionItem('BD', results.dimensions.BD, true)}
                ${renderDimensionItem('BB', results.dimensions.BB, true)}
                ${renderDimensionItem('SP', results.dimensions.SP, false)}
                ${renderDimensionItem('SS', results.dimensions.SS, false)}
            </div>
        </div>
        
        <!-- Composite Indices -->
        <div class="dimensions-section">
            <h3 class="dimensions-title">Composite Insights</h3>
            <div class="dimension-grid">
                ${renderDimensionItem('OGI', results.indices.OGI, true)}
                ${renderDimensionItem('RCI', results.indices.RCI, false)}
                ${renderDimensionItem('BMH', results.indices.BMH, false)}
            </div>
        </div>
        
        <!-- Key Insights -->
        <div class="insights-section">
            <h3 class="insights-title">Key Insights for You</h3>
            <ul class="insight-list">
                ${results.insights.map(insight => `
                    <li class="insight-item">
                        <span class="insight-icon">${insight.icon}</span>
                        <span class="insight-text">${insight.text}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
        
        <!-- OTO Section -->
        <div class="oto-section">
            <div class="oto-content">
                <span class="oto-badge">Special Offer for You</span>
                <h2 class="oto-title">21-Day Energy Reset Program</h2>
                <p class="oto-subtitle">${results.archetype.otoMessage}</p>
                
                <div class="oto-benefits">
                    <div class="oto-benefit">
                        <span class="benefit-icon">🎯</span>
                        <div class="benefit-text">
                            <strong>Daily Energy Practices</strong>
                            5-10 minute rituals designed for busy women
                        </div>
                    </div>
                    <div class="oto-benefit">
                        <span class="benefit-icon">🧘</span>
                        <div class="benefit-text">
                            <strong>Guided Meditations</strong>
                            Customized for your energy phase
                        </div>
                    </div>
                    <div class="oto-benefit">
                        <span class="benefit-icon">📱</span>
                        <div class="benefit-text">
                            <strong>WhatsApp Community</strong>
                            Connect with like-minded women
                        </div>
                    </div>
                    <div class="oto-benefit">
                        <span class="benefit-icon">💫</span>
                        <div class="benefit-text">
                            <strong>Energy Tracking Journal</strong>
                            Monitor your transformation daily
                        </div>
                    </div>
                    <div class="oto-benefit">
                        <span class="benefit-icon">🎁</span>
                        <div class="benefit-text">
                            <strong>Bonus: Manifestation Toolkit</strong>
                            Affirmations, visualizations & more
                        </div>
                    </div>
                    <div class="oto-benefit">
                        <span class="benefit-icon">👑</span>
                        <div class="benefit-text">
                            <strong>Live Q&A with Ritu</strong>
                            Weekly group coaching calls
                        </div>
                    </div>
                </div>
                
                <button class="oto-cta" onclick="handleOTOClick()">
                    <span>Yes! I Want to Reset My Energy</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </button>
                
                <p class="oto-guarantee">100% Satisfaction Guarantee | Start transforming today</p>
            </div>
        </div>
        
        <!-- Retake Quiz -->
        <div style="text-align: center; margin-top: var(--space-10);">
            <button class="btn-secondary" onclick="retakeQuiz()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 4v6h6M23 20v-6h-6"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
                <span>Retake Quiz</span>
            </button>
        </div>
    `;

    DOM.resultsContainer.innerHTML = html;

    // Animate dimension bars after a short delay
    setTimeout(() => {
        document.querySelectorAll('.dimension-fill').forEach(fill => {
            const width = fill.getAttribute('data-width');
            fill.style.width = width;
        });
    }, 300);
}

function renderDimensionItem(key, value, isInverse) {
    const info = dimensionInfo[key];
    const barColor = isInverse
        ? (value > 60 ? 'var(--error)' : value > 30 ? 'var(--warning)' : 'var(--success)')
        : (value > 60 ? 'var(--success)' : value > 30 ? 'var(--warning)' : 'var(--error)');

    return `
        <div class="dimension-item">
            <div class="dimension-header">
                <span class="dimension-name">
                    <span class="dimension-icon">${info.icon}</span>
                    ${info.name}
                </span>
                <span class="dimension-value">${value}%</span>
            </div>
            <div class="dimension-bar">
                <div class="dimension-fill" data-width="${value}%" style="width: 0%; background: ${barColor}"></div>
            </div>
        </div>
    `;
}

// Action Handlers
function handleOTOClick() {
    // In V1, just show an alert. In production, this would redirect to payment/booking
    alert('🎉 Thank you for your interest in the 21-Day Energy Reset!\n\nRitu will be in touch with you soon to help you begin your transformation journey.');
}

function retakeQuiz() {
    AppState.currentQuestionIndex = 0;
    AppState.answers = {};
    AppState.results = null;
    showScreen('welcome');
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
