// Energy Alignment Quiz - Main Application Logic

// App State
const AppState = {
    currentScreen: 'welcome',
    currentSection: 0,
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
    DOM.startBtn.addEventListener('click', startQuiz);
    DOM.prevBtn.addEventListener('click', prevSection);
    DOM.nextBtn.addEventListener('click', nextSection);
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
    AppState.currentSection = 0;
    AppState.answers = {};
    showScreen('quiz');
    renderSection();
}

function prevSection() {
    if (AppState.currentSection > 0) {
        AppState.currentSection--;
        renderSection();
    }
}

function nextSection() {
    // Validate current section
    if (!validateSection()) {
        return;
    }

    if (AppState.currentSection < sectionOrder.length - 1) {
        AppState.currentSection++;
        renderSection();
    } else {
        // Calculate results and show
        calculateAndShowResults();
    }
}

// Validation
function validateSection() {
    const sectionKey = sectionOrder[AppState.currentSection];
    const section = quizData[sectionKey];
    let isValid = true;
    let firstInvalid = null;

    section.questions.forEach(question => {
        const answer = AppState.answers[question.id];
        const questionCard = document.querySelector(`[data-question-id="${question.id}"]`);

        if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
            isValid = false;
            if (questionCard) {
                questionCard.classList.add('invalid');
                if (!firstInvalid) {
                    firstInvalid = questionCard;
                }
            }
        } else {
            if (questionCard) {
                questionCard.classList.remove('invalid');
            }
        }
    });

    if (!isValid && firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        shakeElement(firstInvalid);
    }

    return isValid;
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
function renderSection() {
    const sectionKey = sectionOrder[AppState.currentSection];
    const section = quizData[sectionKey];

    updateProgress();
    updateNavigation();

    const html = `
        <div class="section-header">
            <span class="section-icon">${section.icon}</span>
            <h2 class="section-title">${section.title}</h2>
            <p class="section-subtitle">${section.subtitle}</p>
        </div>
        <div class="questions-container">
            ${section.questions.map((q, idx) => renderQuestion(q, idx + 1)).join('')}
        </div>
    `;

    DOM.quizContent.innerHTML = html;
    attachQuestionListeners();
    window.scrollTo(0, 0);
}

function renderQuestion(question, number) {
    const currentAnswer = AppState.answers[question.id] || '';

    let inputHtml = '';

    switch (question.type) {
        case 'text':
            inputHtml = `
                <input type="text" 
                    class="text-input" 
                    id="${question.id}"
                    placeholder="${question.placeholder || ''}"
                    value="${currentAnswer}">
            `;
            break;

        case 'single':
        case 'categorical':
            inputHtml = `
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
            break;

        case 'likert':
            inputHtml = `
                <div class="likert-scale">
                    ${[1, 2, 3, 4, 5].map(val => `
                        <label class="likert-option ${currentAnswer === String(val) ? 'selected' : ''}" data-value="${val}">
                            <input type="radio" class="option-radio" name="${question.id}" value="${val}" ${currentAnswer === String(val) ? 'checked' : ''}>
                            <span class="likert-number">${val}</span>
                            <span class="likert-label">${getLikertShortLabel(val)}</span>
                        </label>
                    `).join('')}
                </div>
                <div class="scale-labels">
                    <span>Strongly Disagree</span>
                    <span>Strongly Agree</span>
                </div>
            `;
            break;
    }

    return `
        <div class="question-card" data-question-id="${question.id}">
            <p class="question-text">
                <span class="question-number">${number}.</span>
                ${question.text}
            </p>
            ${inputHtml}
        </div>
    `;
}

function getLikertShortLabel(value) {
    const labels = {
        1: 'SD',
        2: 'D',
        3: 'N',
        4: 'A',
        5: 'SA'
    };
    return labels[value];
}

function attachQuestionListeners() {
    // Text inputs
    document.querySelectorAll('.text-input').forEach(input => {
        input.addEventListener('input', (e) => {
            AppState.answers[e.target.id] = e.target.value;
        });
    });

    // Radio options (single, categorical, likert)
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

            // Remove invalid state
            const card = label.closest('.question-card');
            if (card) card.classList.remove('invalid');
        });
    });

    // Likert options
    document.querySelectorAll('.likert-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const radio = option.querySelector('.option-radio');
            const questionId = radio.name;
            const value = radio.value;

            // Update state
            AppState.answers[questionId] = value;

            // Update UI
            const siblings = option.parentElement.querySelectorAll('.likert-option');
            siblings.forEach(sib => sib.classList.remove('selected'));
            option.classList.add('selected');

            // Remove invalid state
            const card = option.closest('.question-card');
            if (card) card.classList.remove('invalid');
        });
    });
}

function updateProgress() {
    const totalSections = sectionOrder.length;
    const progress = ((AppState.currentSection + 1) / totalSections) * 100;
    DOM.progressFill.style.width = `${progress}%`;
    DOM.progressText.textContent = `Section ${AppState.currentSection + 1} of ${totalSections}`;
}

function updateNavigation() {
    DOM.prevBtn.disabled = AppState.currentSection === 0;

    const isLastSection = AppState.currentSection === sectionOrder.length - 1;
    DOM.nextBtn.innerHTML = isLastSection
        ? `<span>See Results</span>
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
            <p class="report-greeting">✨ Hi ${results.userName}!</p>
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
            <h3 class="dimensions-title">📊 Your Energy Dimensions</h3>
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
            <h3 class="dimensions-title">🎯 Composite Insights</h3>
            <div class="dimension-grid">
                ${renderDimensionItem('OGI', results.indices.OGI, true)}
                ${renderDimensionItem('RCI', results.indices.RCI, false)}
                ${renderDimensionItem('BMH', results.indices.BMH, false)}
            </div>
        </div>
        
        <!-- Key Insights -->
        <div class="insights-section">
            <h3 class="insights-title">💡 Key Insights for You</h3>
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
                <h2 class="oto-title">🌟 21-Day Energy Reset Program</h2>
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
                            Customized for your archetype's needs
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
                
                <p class="oto-guarantee">🛡️ 100% Satisfaction Guarantee | Start transforming today</p>
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
    // For inverse dimensions (where lower is better), show inverted bar for visual clarity
    const displayValue = isInverse ? 100 - value : value;
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
    AppState.currentSection = 0;
    AppState.answers = {};
    AppState.results = null;
    showScreen('welcome');
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
