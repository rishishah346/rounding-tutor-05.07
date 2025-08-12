/**
* Decimal1 Practice Page - Complete Redesigned Implementation
* File: static/js/pages/decimal1_practice_redesigned.js
* Enhanced with robust error handling, accessibility, and UX improvements
* FIXED: Continue button now properly disabled until submit button is pressed
*/

class RedesignedPracticePage {
    constructor() {
        this.currentStage = '1.1';
        this.questionsAttempted = 0;
        this.questionsCorrect = 0;
        this.consecutiveCorrect = 0;
        this.currentQuestion = null;
        this.selectedAnswer = null;
        this.backendSessionData = null;
        this.initialProgressCalculated = false;
        this.isSubmitting = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.sessionStartTime = Date.now();
        this.questionStartTime = null;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeAccessibility();
        this.loadBackendState();
    }

    initializeElements() {
        this.elements = {
            // Progress elements
            progressBar: document.getElementById('progress-bar'),
            progressPercentage: document.getElementById('progress-percentage'),
            
            // Whiteboard elements
            whiteboardLeft: document.getElementById('whiteboard-left'),
            whiteboardRight: document.getElementById('whiteboard-right'),
            
            // Tutor elements  
            tutorText: document.getElementById('tutor-text'),
            
            // Loading
            loading: document.getElementById('loading'),
            
            // Additional elements for better UX
            errorContainer: this.createErrorContainer(),
            connectionStatus: this.createConnectionStatus()
        };
    }

    createErrorContainer() {
        const container = document.createElement('div');
        container.id = 'error-container';
        container.className = 'fixed top-4 right-4 z-50 hidden';
        container.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-sm">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800">Error</h3>
                        <div class="mt-1 text-sm text-red-700" id="error-message"></div>
                        <div class="mt-2">
                            <button id="error-retry" class="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors">
                                Retry
                            </button>
                            <button id="error-dismiss" class="text-sm text-red-600 hover:text-red-800 px-3 py-1 transition-colors">
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(container);
        return container;
    }

    createConnectionStatus() {
        const container = document.createElement('div');
        container.id = 'connection-status';
        container.className = 'fixed bottom-4 left-4 z-40 hidden';
        container.innerHTML = `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-sm">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div id="connection-indicator" class="h-3 w-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div class="ml-2 text-sm text-yellow-800" id="connection-text">
                        Checking connection...
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(container);
        return container;
    }

    initializeAccessibility() {
        // Add ARIA labels to progress bar
        if (this.elements.progressBar) {
            this.elements.progressBar.setAttribute('role', 'progressbar');
            this.elements.progressBar.setAttribute('aria-label', 'Lesson progress');
            this.elements.progressBar.setAttribute('aria-valuemin', '0');
            this.elements.progressBar.setAttribute('aria-valuemax', '100');
        }

        // Add keyboard navigation for choices
        document.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('choice-item')) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.target.click();
                }
            }
        });

        this.setupFocusManagement();
    }

    setupFocusManagement() {
        this.createAriaLiveRegion();
        this.focusAfterUpdate = null;
    }

    createAriaLiveRegion() {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'aria-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);
        this.ariaLiveRegion = liveRegion;
    }

    announceToScreenReader(message) {
        if (this.ariaLiveRegion) {
            this.ariaLiveRegion.textContent = message;
        }
    }

    loadBackendState() {
        this.showLoading();
        this.showConnectionStatus('Connecting to server...');
        
        this.fetchWithRetry('/api/current-stage', {
            method: 'GET'
        })
        .then(data => {
            this.hideLoading();
            this.hideConnectionStatus();
            
            if (data.redirect) {
                console.log('Backend suggests redirect to:', data.redirect);
                if (!window.location.pathname.includes('practice')) {
                    window.location.href = data.redirect;
                    return;
                }
            }
            
            this.backendSessionData = data;
            
            if (data.learning_state) {
                this.currentStage = data.learning_state.stage || '1.1';
                this.questionsAttempted = data.learning_state.questions_attempted || 0;
                this.questionsCorrect = data.learning_state.correct_answers || 0;
                this.consecutiveCorrect = data.learning_state.consecutive_correct || 0;
            }
            
            console.log('Backend state loaded:', {
                stage: this.currentStage,
                attempted: this.questionsAttempted,
                correct: this.questionsCorrect,
                consecutive: this.consecutiveCorrect
            });
            
            this.updateProgressFromBackend();
            this.loadInitialContent();
            this.announceToScreenReader(`Practice page loaded. Current stage: ${this.currentStage}`);
            
        })
        .catch(error => {
            console.error('Error loading backend state:', error);
            this.hideLoading();
            this.showConnectionError('Failed to connect to server. Using offline mode.');
            
            console.log('Using fallback state due to backend error');
            this.updateProgress();
            this.loadInitialContent();
            this.announceToScreenReader('Practice page loaded in offline mode');
        });
    }

    async fetchWithRetry(url, options = {}, retryCount = 0) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.retryCount = 0;
            return data;

        } catch (error) {
            if (retryCount < this.maxRetries) {
                console.log(`Attempt ${retryCount + 1} failed, retrying...`);
                await this.delay(Math.pow(2, retryCount) * 1000);
                return this.fetchWithRetry(url, options, retryCount + 1);
            } else {
                throw error;
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showConnectionStatus(message, type = 'warning') {
        const status = this.elements.connectionStatus;
        const indicator = document.getElementById('connection-indicator');
        const text = document.getElementById('connection-text');
        
        if (status && indicator && text) {
            text.textContent = message;
            
            indicator.className = `h-3 w-3 rounded-full ${
                type === 'success' ? 'bg-green-400' :
                type === 'error' ? 'bg-red-400' :
                'bg-yellow-400'
            }`;
            
            status.classList.remove('hidden');
            
            if (type === 'success') {
                setTimeout(() => this.hideConnectionStatus(), 3000);
            }
        }
    }

    hideConnectionStatus() {
        if (this.elements.connectionStatus) {
            this.elements.connectionStatus.classList.add('hidden');
        }
    }

    showConnectionError(message) {
        const errorContainer = this.elements.errorContainer;
        const errorMessage = document.getElementById('error-message');
        const retryButton = document.getElementById('error-retry');
        const dismissButton = document.getElementById('error-dismiss');
        
        if (errorContainer && errorMessage) {
            errorMessage.textContent = message;
            errorContainer.classList.remove('hidden');
            
            if (retryButton) {
                retryButton.onclick = () => {
                    this.hideError();
                    this.loadBackendState();
                };
            }
            
            if (dismissButton) {
                dismissButton.onclick = () => this.hideError();
            }
            
            setTimeout(() => this.hideError(), 10000);
        }
    }

    hideError() {
        if (this.elements.errorContainer) {
            this.elements.errorContainer.classList.add('hidden');
        }
    }

    initializeEventListeners() {
        // Reset button
        document.getElementById('reset-button')?.addEventListener('click', () => this.resetLesson());
        
        // Return to examples button
        document.getElementById('return-to-examples')?.addEventListener('click', () => this.returnToExamples());
        
        // Continue practice button
        document.getElementById('continue-practice')?.addEventListener('click', () => this.handleContinueButton());
        
        // Add visibility change handler to detect when tab becomes active
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.backendSessionData) {
                this.refreshBackendState();
            }
        });

        // Add beforeunload handler to warn about unsaved progress
        window.addEventListener('beforeunload', (e) => {
            if (this.questionsAttempted > 0 && !this.isLessonComplete()) {
                e.preventDefault();
                e.returnValue = 'You have unsaved progress. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    handleContinueButton() {
        // If a question has been submitted and answered, move to next question
        if (this.selectedAnswer && this.currentQuestion) {
            this.nextQuestion();
        }
        // If no question is currently active, fetch a new one
        else {
            this.fetchQuestion();
        }
    }

    async refreshBackendState() {
        try {
            const data = await this.fetchWithRetry('/api/current-stage');
            this.backendSessionData = data;
            this.updateProgressFromBackend();
            console.log('State refreshed on tab focus');
        } catch (error) {
            console.log('Could not refresh state:', error);
        }
    }

    isLessonComplete() {
        return this.currentStage === 'complete' || this.currentStage === '2.1';
    }

    updateProgressFromBackend() {
        if (!this.backendSessionData) {
            console.log('No backend data, using local progress calculation');
            this.updateProgress();
            return;
        }
        
        const learningState = this.backendSessionData.learning_state;
        let calculatedProgress;
        
        if (learningState) {
            calculatedProgress = this.calculateProgressFromBackendState(learningState);
            console.log('Progress calculated from backend state:', calculatedProgress);
        } else {
            calculatedProgress = this.calculateOverallLessonProgress();
            console.log('Using local progress calculation as fallback:', calculatedProgress);
        }
        
        this.animateProgressUpdate(calculatedProgress);
        
        if (this.elements.progressBar) {
            this.elements.progressBar.setAttribute('aria-valuenow', Math.round(calculatedProgress));
        }
        
        console.log(`Backend-driven progress: ${Math.round(calculatedProgress)}% (Stage: ${this.currentStage})`);
    }

    animateProgressUpdate(targetProgress) {
        if (!this.elements.progressBar || !this.elements.progressPercentage) return;
        
        const currentProgress = parseFloat(this.elements.progressBar.style.height) || 0;
        const difference = targetProgress - currentProgress;
        const duration = 800;
        const steps = 30;
        const stepValue = difference / steps;
        const stepDuration = duration / steps;
        
        let currentStep = 0;
        
        const animate = () => {
            if (currentStep < steps) {
                const newProgress = currentProgress + (stepValue * currentStep);
                this.elements.progressBar.style.height = `${newProgress}%`;
                this.elements.progressPercentage.textContent = `${Math.round(newProgress)}%`;
                currentStep++;
                setTimeout(animate, stepDuration);
            } else {
                this.elements.progressBar.style.height = `${targetProgress}%`;
                this.elements.progressPercentage.textContent = `${Math.round(targetProgress)}%`;
            }
        };
        
        animate();
    }

    calculateProgressFromBackendState(learningState) {
        const lessonStages = {
            'example_1_1': 10,
            'example_1_2': 20,
            '1.1': 30,
            '1.2': 40,
            '1.3': 50,
            'example_2_1': 60,
            'example_2_2': 70,
            '2.1': 80,
            '2.2': 90,
            'stretch': 100,
            'complete': 100
        };
        
        const currentStage = learningState.stage || '1.1';
        const showingExample = learningState.showing_example || false;
        
        let baseProgress;
        
        if (showingExample) {
            if (currentStage === '2.1') {
                baseProgress = 60;
            } else {
                baseProgress = lessonStages[currentStage] || 20;
            }
        } else {
            baseProgress = lessonStages[currentStage] || 20;
        }
        
        if (learningState.consecutive_correct > 0 && !showingExample) {
            const questionsNeededForStage = this.getQuestionsNeededForStage(currentStage);
            const microProgress = Math.min(1, learningState.consecutive_correct / questionsNeededForStage);
            const stageWidth = 10;
            const previousStageProgress = Math.max(0, baseProgress - stageWidth);
            baseProgress = previousStageProgress + (microProgress * stageWidth);
        }
        
        return Math.min(100, Math.max(20, baseProgress));
    }

    calculateOverallLessonProgress() {
        const lessonStages = {
            'example_1_1': 10,
            'example_1_2': 20,
            '1.1': 30,
            '1.2': 40,
            '1.3': 50,
            'example_2_1': 60,
            'example_2_2': 70,
            '2.1': 80,
            '2.2': 90,
            'stretch': 100,
            'complete': 100
        };
        
        let baseProgress = lessonStages[this.currentStage] || 20;
        
        if (this.questionsAttempted > 0) {
            const questionsNeededForStage = this.getQuestionsNeededForStage(this.currentStage);
            const microProgress = Math.min(1, this.consecutiveCorrect / questionsNeededForStage);
            const stageWidth = 10;
            const previousStageProgress = Math.max(0, baseProgress - stageWidth);
            baseProgress = previousStageProgress + (microProgress * stageWidth);
        }
        
        return Math.min(100, Math.max(20, baseProgress));
    }

    getQuestionsNeededForStage(stage) {
        const requirements = {
            '1.1': 1,
            '1.2': 1,
            '1.3': 2,
        };
        return requirements[stage] || 1;
    }

    updateProgress() {
        const overallProgress = this.calculateOverallLessonProgress();
        this.animateProgressUpdate(overallProgress);
        console.log(`Overall lesson progress: ${Math.round(overallProgress)}% (Practice stage: ${this.currentStage})`);
    }

    loadInitialContent() {
        this.loadExamplesContent();
        this.loadPracticeContent();
        this.loadTutorContent();
        
        // CRITICAL: Ensure continue button starts disabled
        const continueButton = document.getElementById('continue-practice');
        if (continueButton) {
            continueButton.disabled = true;
        }
    }

    loadExamplesContent() {
        const examplesContainer = document.getElementById('examples-content');
        if (examplesContainer) {
            examplesContainer.innerHTML = `
                <div class="space-y-6">
                    <!-- Example 1 -->
                    <div class="example-detailed bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
                        <div class="example-header bg-blue-100 px-4 py-3 border-b border-blue-200">
                            <div class="flex items-center justify-between">
                                <h4 class="font-semibold text-blue-800">Example 1</h4>
                            </div>
                            <div class="text-sm text-blue-700 mt-1">
                                <strong>Round 12.632 to 1 decimal place</strong>
                            </div>
                        </div>
                        
                        <div class="example-steps p-4 space-y-4">
                            <!-- Step 1 -->
                            <div class="step bg-white border border-blue-100 rounded-lg p-3">
                                <div class="step-header flex items-center mb-3">
                                    <span class="step-number w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">1</span>
                                    <h5 class="font-semibold text-blue-700 text-sm">Step 1</h5>
                                </div>
                                <div class="step-visual bg-white border border-gray-200 rounded-lg p-4 mb-3 text-center">
                                    <img src="/static/images/stage1_1_step1.jpg" alt="Step 1 - Identify the 1st decimal place" class="max-w-full h-auto mx-auto rounded" style="max-height: 200px;">
                                </div>
                                <div class="step-explanation text-sm text-blue-600 p-3 bg-blue-25 rounded">
                                    Identify the digit in the 1st decimal place. This is the first digit after the decimal point. We will call it the "rounding digit". Draw a "cut off" line after the rounding digit.
                                </div>
                            </div>

                            <!-- Step 2 -->
                            <div class="step bg-white border border-blue-100 rounded-lg p-3">
                                <div class="step-header flex items-center mb-3">
                                    <span class="step-number w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">2</span>
                                    <h5 class="font-semibold text-blue-700 text-sm">Step 2</h5>
                                </div>
                                <div class="step-visual bg-white border border-gray-200 rounded-lg p-4 mb-3 text-center">
                                    <img src="/static/images/stage1_1_step2.jpg" alt="Step 2 - Check the next digit" class="max-w-full h-auto mx-auto rounded" style="max-height: 200px;">
                                </div>
                                <div class="step-explanation text-sm text-blue-600 p-3 bg-blue-25 rounded">
                                    Check the digit to the right of the "cut off" line. If this digit is less than 5 we keep our rounding digit the same.
                                </div>
                            </div>

                            <!-- Step 3 -->
                            <div class="step bg-white border border-blue-100 rounded-lg p-3">
                                <div class="step-header flex items-center mb-3">
                                    <span class="step-number w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">3</span>
                                    <h5 class="font-semibold text-blue-700 text-sm">Step 3</h5>
                                </div>
                                <div class="step-visual bg-white border border-gray-200 rounded-lg p-4 mb-3 text-center">
                                    <img src="/static/images/stage1_1_step3.jpg" alt="Step 3 - Final answer" class="max-w-full h-auto mx-auto rounded" style="max-height: 200px;">
                                </div>
                                <div class="step-explanation text-sm text-blue-600 p-3 bg-blue-25 rounded">
                                    Remove all digits after the "cut off" line. We have now rounded the number to 1 decimal place.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Example 2 -->
                    <div class="example-detailed bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
                        <div class="example-header bg-blue-100 px-4 py-3 border-b border-blue-200">
                            <div class="flex items-center justify-between">
                                <h4 class="font-semibold text-blue-800">Example 2</h4>
                            </div>
                            <div class="text-sm text-blue-700 mt-1">
                                <strong>Round 12.682 to 1 decimal place</strong>
                            </div>
                        </div>
                        
                        <div class="example-steps p-4 space-y-4">
                            <!-- Step 1 -->
                            <div class="step bg-white border border-blue-100 rounded-lg p-3">
                                <div class="step-header flex items-center mb-3">
                                    <span class="step-number w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">1</span>
                                    <h5 class="font-semibold text-blue-700 text-sm">Step 1</h5>
                                </div>
                                <div class="step-visual bg-white border border-gray-200 rounded-lg p-4 mb-3 text-center">
                                    <img src="/static/images/stage1_2_step1.jpg" alt="Step 1 - Identify the 1st decimal place" class="max-w-full h-auto mx-auto rounded" style="max-height: 200px;">
                                </div>
                                <div class="step-explanation text-sm text-blue-600 p-3 bg-blue-25 rounded">
                                    Identify the digit in the 1st decimal place. This is the first digit after the decimal point. We will call it the "rounding digit". Draw a "cut off" line after the rounding digit.
                                </div>
                            </div>

                            <!-- Step 2 -->
                            <div class="step bg-white border border-blue-100 rounded-lg p-3">
                                <div class="step-header flex items-center mb-3">
                                    <span class="step-number w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">2</span>
                                    <h5 class="font-semibold text-blue-700 text-sm">Step 2</h5>
                                </div>
                                <div class="step-visual bg-white border border-gray-200 rounded-lg p-4 mb-3 text-center">
                                    <img src="/static/images/stage1_2_step2.jpg" alt="Step 2 - Check the next digit" class="max-w-full h-auto mx-auto rounded" style="max-height: 200px;">
                                </div>
                                <div class="step-explanation text-sm text-blue-600 p-3 bg-blue-25 rounded">
                                    Check the digit to the right of the "cut off" line. If this digit is 5 or bigger we need to round up. We do this by adding 1 to the rounding digit.
                                </div>
                            </div>

                            <!-- Step 3 -->
                            <div class="step bg-white border border-blue-100 rounded-lg p-3">
                                <div class="step-header flex items-center mb-3">
                                    <span class="step-number w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">3</span>
                                    <h5 class="font-semibold text-blue-700 text-sm">Step 3</h5>
                                </div>
                                <div class="step-visual bg-white border border-gray-200 rounded-lg p-4 mb-3 text-center">
                                    <img src="/static/images/stage1_2_step3.jpg" alt="Step 3 - Final answer" class="max-w-full h-auto mx-auto rounded" style="max-height: 200px;">
                                </div>
                                <div class="step-explanation text-sm text-blue-600 p-3 bg-blue-25 rounded">
                                    Remove all digits after the "cut off" line. We have now rounded the number to 1 decimal place. Notice that the 6 has changed to a 7 as we rounded up.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    loadPracticeContent() {
        const practiceContainer = document.getElementById('practice-content');
        if (practiceContainer) {
            practiceContainer.innerHTML = `
                <div class="space-y-4">
                    <!-- Practice Question Container -->
                    <div id="question-container" class="question-area bg-white border border-gray-200 rounded-lg p-3">
                        <!-- Question Text -->
                        <div id="question-text" class="font-medium text-gray-800 mb-3" role="main" aria-live="polite"></div>
                        
                        <!-- Choices Container -->
                        <div id="choices-container" class="space-y-1 mb-3" role="radiogroup" aria-label="Answer choices">
                            <!-- Choices will be inserted here by JavaScript -->
                        </div>
                        
                        <!-- Submit Button -->
                        <button id="submit-answer" class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-3 rounded transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" disabled>
                            Submit Answer
                        </button>
                    </div>
                </div>
            `;
        }
        
        this.initializePractice();
    }

    initializePractice() {
        const submitButton = document.getElementById('submit-answer');
        const continueButton = document.getElementById('continue-practice');
        
        if (submitButton) {
            submitButton.addEventListener('click', () => this.submitAnswer());
        }
        
        if (continueButton) {
            continueButton.addEventListener('click', () => this.nextQuestion());
            // CRITICAL: Ensure continue button starts disabled
            continueButton.disabled = true;
        }
        
        this.fetchQuestion();
    }

    fetchQuestion() {
        this.showLoading();
        this.questionStartTime = Date.now();
        
        this.fetchWithRetry('/api/decimal1/practice/question')
            .then(data => {
                this.hideLoading();
                
                if (data.lesson_complete) {
                    this.handleLessonComplete(data);
                } else {
                    this.displayQuestion(data.question);
                }
            })
            .catch(error => {
                console.error('Error fetching question:', error);
                this.hideLoading();
                this.showConnectionError('Failed to load question. Please check your internet connection and try again.');
            });
    }

    displayQuestion(question) {
        this.currentQuestion = question;
        this.selectedAnswer = null;
        
        const questionText = document.getElementById('question-text');
        if (questionText) {
            questionText.className = 'font-medium text-gray-800 mb-3';
            questionText.textContent = question.question_text;
        }
        
        const choicesContainer = document.getElementById('choices-container');
        if (choicesContainer) {
            choicesContainer.innerHTML = '';
            
            for (const [letter, answer] of Object.entries(question.choices)) {
                const choiceElement = document.createElement('div');
                choiceElement.className = 'choice-item p-1.5 border rounded cursor-pointer hover:bg-gray-50 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-1';
                choiceElement.innerHTML = `
                    <span class="font-medium">${letter})</span> ${answer}
                `;
                choiceElement.dataset.letter = letter;
                choiceElement.setAttribute('role', 'radio');
                choiceElement.setAttribute('aria-checked', 'false');
                choiceElement.setAttribute('tabindex', '0');
                choiceElement.setAttribute('aria-label', `Choice ${letter}: ${answer}`);
                
                choiceElement.addEventListener('click', () => this.selectChoice(choiceElement));
                choiceElement.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.selectChoice(choiceElement);
                    }
                });
                
                choicesContainer.appendChild(choiceElement);
            }
        }
        
        const submitButton = document.getElementById('submit-answer');
        if (submitButton) {
            submitButton.disabled = true;
        }
        
        // CRITICAL: Ensure continue button is disabled when new question loads
        const continueButton = document.getElementById('continue-practice');
        if (continueButton) {
            continueButton.disabled = true;
        }
        
        const questionContainer = document.getElementById('question-container');
        if (questionContainer) {
            questionContainer.classList.remove('hidden');
        }
        
        this.announceToScreenReader(`New question loaded: ${question.question_text}`);
    }

    selectChoice(choiceElement) {
        // Remove selected class from all choices
        const choices = document.querySelectorAll('.choice-item');
        choices.forEach(item => {
            item.classList.remove('selected', 'bg-blue-50', 'border-blue-500');
            item.setAttribute('aria-checked', 'false');
        });
        
        // Add selected class to this choice
        choiceElement.classList.add('selected', 'bg-blue-50', 'border-blue-500');
        choiceElement.setAttribute('aria-checked', 'true');
        
        // Update selected answer
        this.selectedAnswer = choiceElement.dataset.letter;
        
        // Enable submit button (but keep continue button disabled)
        const submitButton = document.getElementById('submit-answer');
        if (submitButton) {
            submitButton.disabled = false;
        }
        
        this.announceToScreenReader(`Selected answer ${this.selectedAnswer}`);
    }

    submitAnswer() {
        if (!this.selectedAnswer || this.isSubmitting) return;
        
        this.isSubmitting = true;
        
        const submitButton = document.getElementById('submit-answer');
        const continueButton = document.getElementById('continue-practice');
        
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
        }
        
        // CRITICAL: Keep continue button disabled during submission
        if (continueButton) {
            continueButton.disabled = true;
        }
        
        this.showLoading();
        
        const responseTime = this.questionStartTime ? Date.now() - this.questionStartTime : 0;
        
        this.fetchWithRetry('/api/verify-answer', {
            method: 'POST',
            body: JSON.stringify({
                answer: this.selectedAnswer,
                response_time: responseTime
            })
        })
        .then(data => {
            this.hideLoading();
            this.isSubmitting = false;
            
            // Reset submit button text but keep it disabled
            if (submitButton) {
                submitButton.textContent = 'Submit Answer';
                submitButton.disabled = true;
            }
            
            // CRITICAL: Only enable continue button AFTER successful submission
            if (continueButton) {
                continueButton.disabled = false;
            }
            
            this.syncWithBackendResponse(data);
            
            if (data.next_stage_redirect) {
                window.location.href = data.next_stage_redirect;
                return;
            }
            
            this.highlightAnswers(data.is_correct);
            this.updateProgressDisplays();
            this.updateProgressFromBackend();
            
            if (data.stage_completed) {
                this.handleStageCompletion(data);
            }
            
            const resultText = data.is_correct ? 'Correct answer!' : 'Incorrect answer.';
            this.announceToScreenReader(`${resultText} Answer submitted. Click Continue for next question.`);
            
        })
        .catch(error => {
            console.error('Error verifying answer:', error);
            this.hideLoading();
            this.isSubmitting = false;
            
            // Reset submit button on error
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Submit Answer';
            }
            
            // Keep continue button disabled on error
            if (continueButton) {
                continueButton.disabled = true;
            }
            
            this.showConnectionError('Failed to submit answer. Please check your connection and try again.');
        });
    }

    syncWithBackendResponse(data) {
        console.log('Syncing with backend response:', data);
        
        if (data.learning_state) {
            this.backendSessionData = {
                learning_state: data.learning_state
            };
            
            this.currentStage = data.learning_state.stage || this.currentStage;
            this.questionsAttempted = data.learning_state.questions_attempted || this.questionsAttempted + 1;
            this.questionsCorrect = data.learning_state.correct_answers || this.questionsCorrect + (data.is_correct ? 1 : 0);
            this.consecutiveCorrect = data.learning_state.consecutive_correct || (data.is_correct ? this.consecutiveCorrect + 1 : 0);
        } else {
            this.questionsAttempted++;
            if (data.is_correct) {
                this.questionsCorrect++;
                this.consecutiveCorrect++;
            } else {
                this.consecutiveCorrect = 0;
            }
            
            if (data.next_stage) {
                this.currentStage = data.next_stage;
            }
        }
        
        console.log('State after sync:', {
            stage: this.currentStage,
            attempted: this.questionsAttempted,
            correct: this.questionsCorrect,
            consecutive: this.consecutiveCorrect
        });
    }

    handleStageCompletion(data) {
        console.log('Stage completed:', data);
        
        const stageIndicator = document.querySelector('.stage-indicator');
        if (stageIndicator) {
            stageIndicator.classList.add('stage-completed');
            
            const stageTitle = stageIndicator.querySelector('h4');
            if (stageTitle) {
                stageTitle.innerHTML = `Practice Stage ${this.currentStage} <span class="text-green-600">✓ Complete</span>`;
            }
            
            const statusBadge = stageIndicator.querySelector('span');
            if (statusBadge) {
                statusBadge.textContent = 'Complete!';
                statusBadge.className = 'text-xs bg-green-200 text-green-700 px-2 py-1 rounded';
            }
        }
        
        if (data.showing_new_examples) {
            setTimeout(() => {
                this.showTransitionMessage(data);
            }, 1500);
        }
        
        this.announceToScreenReader(`Stage ${this.currentStage} completed! Great job!`);
    }

    showTransitionMessage(data) {
        const practiceContainer = document.getElementById('practice-content');
        if (practiceContainer) {
            const transitionHTML = `
                <div class="transition-message text-center py-8 bg-gradient-to-b from-blue-50 to-green-50 rounded-lg border-2 border-blue-200">
                    <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-800 mb-2">Stage Complete!</h3>
                    <p class="text-sm text-gray-600 mb-4">Great progress! You're moving to the next section.</p>
                    <div class="text-xs text-blue-600 mb-4">
                        <div>✓ Mastered rounding to 1 decimal place</div>
                        <div>→ Ready for 2-3 decimal places</div>
                    </div>
                    <button onclick="window.location.href='${data.next_stage_redirect || '/rounding/decimal2/examples'}'" 
                            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                        Continue to Next Section
                    </button>
                </div>
            `;
            
            practiceContainer.innerHTML = transitionHTML;
            this.announceToScreenReader('Practice section complete! Ready to continue to the next section.');
        }
    }

    highlightAnswers(isCorrect) {
        const choices = document.querySelectorAll('.choice-item');
        choices.forEach(item => {
            if (item.dataset.letter === this.selectedAnswer) {
                item.classList.remove('bg-blue-50', 'border-blue-500');
                if (isCorrect) {
                    item.classList.add('bg-green-50', 'border-green-500');
                } else {
                    item.classList.add('bg-red-50', 'border-red-500');
                }
            }
            
            if (!isCorrect && item.dataset.letter === this.currentQuestion.correct_letter) {
                item.classList.add('bg-green-50', 'border-green-500');
            }
        });
    }

    nextQuestion() {
        // CRITICAL: Reset continue button back to disabled state for next question
        const continueButton = document.getElementById('continue-practice');
        if (continueButton) {
            continueButton.disabled = true;
        }
        
        this.fetchQuestion();
    }

    updateProgressDisplays() {
        const questionsAttemptedEl = document.getElementById('questions-attempted');
        const questionsCorrectEl = document.getElementById('questions-correct');
        
        if (questionsAttemptedEl) {
            questionsAttemptedEl.textContent = this.questionsAttempted;
        }
        
        if (questionsCorrectEl) {
            questionsCorrectEl.textContent = this.questionsCorrect;
        }
    }

    handleLessonComplete(data) {
        const practiceContainer = document.getElementById('practice-content');
        if (practiceContainer) {
            practiceContainer.innerHTML = `
                <div class="text-center py-8">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-green-600 mb-2">Practice Complete!</h3>
                    <p class="text-sm text-gray-600 mb-4">${data.message}</p>
                    <button onclick="window.location.href='/'" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                        Continue Lesson
                    </button>
                </div>
            `;
        }
        
        this.announceToScreenReader('Congratulations! You have completed the practice section.');
    }

    getStageDescription(stage) {
        const descriptions = {
            '1.1': 'Practice rounding to 1 decimal place (no rounding up required)',
            '1.2': 'Practice rounding to 1 decimal place (with rounding up)',
            '1.3': 'Practice mixed rounding to 1 decimal place'
        };
        return descriptions[stage] || 'Practice rounding problems';
    }

    loadTutorContent() {
        if (this.elements.tutorText) {
            this.elements.tutorText.innerHTML = `
                <p>Math tutor is ready to help when needed.</p>
                <p class="text-gray-500 text-sm mt-2">(Tutor features will be enhanced in future updates)</p>
            `;
        }
    }

    returnToExamples() {
        window.location.href = '/rounding/examples';
    }

    resetLesson() {
        if (this.questionsAttempted > 3) {
            const confirmed = confirm('Are you sure you want to reset your lesson progress? This will clear all your current progress.');
            if (!confirmed) return;
        }
        
        this.fetchWithRetry('/api/reset', { method: 'POST' })
            .then(data => {
                if (data.status === 'reset' && data.redirect) {
                    window.location.href = data.redirect;
                }
            })
            .catch(error => {
                console.error('Error resetting lesson:', error);
                window.location.href = '/';
            });
    }

    // Utility methods
    showLoading() {
        if (this.elements.loading) {
            this.elements.loading.classList.remove('hidden');
        }
    }

    hideLoading() {
        if (this.elements.loading) {
            this.elements.loading.classList.add('hidden');
        }
    }

    showError(message) {
        console.error(message);
        this.showConnectionError(message);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new RedesignedPracticePage();
});

// STEP 2: Add this JavaScript to enhance the progress bar with hover tooltips
// Add this to your decimal1_practice_redesigned.js file

// Function to add hover areas and tooltips to progress bar
function enhanceProgressBarWithTooltips() {
    const progressBarTrack = document.querySelector('.progress-bar-track');
    
    if (!progressBarTrack) {
        console.log('Progress bar track not found');
        return;
    }
    
    // Remove any existing hover elements
    const existingHoverElements = progressBarTrack.querySelectorAll('.progress-bar-hover, .progress-tooltip');
    existingHoverElements.forEach(el => el.remove());
    
    // Create hover areas
    const bottomHoverArea = document.createElement('div');
    bottomHoverArea.className = 'progress-bar-bottom-hover';
    bottomHoverArea.title = 'Rounding to 1 decimal place'; // Fallback tooltip
    
    const topHoverArea = document.createElement('div');
    topHoverArea.className = 'progress-bar-top-hover';
    topHoverArea.title = 'Rounding to more than 1 decimal place'; // Fallback tooltip
    
    // Create custom tooltips
    const bottomTooltip = document.createElement('div');
    bottomTooltip.className = 'progress-tooltip bottom-section';
    bottomTooltip.textContent = 'Rounding to 1 decimal place';
    
    const topTooltip = document.createElement('div');
    topTooltip.className = 'progress-tooltip top-section';
    topTooltip.textContent = 'Rounding to more than 1 decimal place';
    
    // Add hover event listeners
    bottomHoverArea.addEventListener('mouseenter', () => {
        bottomTooltip.classList.add('show');
        console.log('Hovering over bottom section');
    });
    
    bottomHoverArea.addEventListener('mouseleave', () => {
        bottomTooltip.classList.remove('show');
    });
    
    topHoverArea.addEventListener('mouseenter', () => {
        topTooltip.classList.add('show');
        console.log('Hovering over top section');
    });
    
    topHoverArea.addEventListener('mouseleave', () => {
        topTooltip.classList.remove('show');
    });
    
    // Append elements to progress bar track
    progressBarTrack.appendChild(bottomHoverArea);
    progressBarTrack.appendChild(topHoverArea);
    progressBarTrack.appendChild(bottomTooltip);
    progressBarTrack.appendChild(topTooltip);
    
    console.log('Progress bar tooltips added successfully');
}

// Call this function in your RedesignedPracticePage constructor
// Add this line to the end of your constructor method:
// this.enhanceProgressBarWithTooltips();

// OR call it after the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the page to fully load
    setTimeout(() => {
        enhanceProgressBarWithTooltips();
    }, 500);
});

// FIX: Override the existing tooltip JavaScript to remove delays
// Add this to your decimal1_practice_redesigned.js file

// Function to make tooltips appear instantly by overriding existing delays
function makeTooltipsInstant() {
    const bottomHoverArea = document.querySelector('.progress-bar-bottom-hover');
    const topHoverArea = document.querySelector('.progress-bar-top-hover');
    const bottomTooltip = document.querySelector('.progress-tooltip.bottom-section');
    const topTooltip = document.querySelector('.progress-tooltip.top-section');
    
    if (!bottomHoverArea || !topHoverArea || !bottomTooltip || !topTooltip) {
        console.log('Tooltip elements not found');
        return;
    }
    
    // Clear any existing event listeners by cloning the elements
    const newBottomHover = bottomHoverArea.cloneNode(true);
    const newTopHover = topHoverArea.cloneNode(true);
    
    bottomHoverArea.parentNode.replaceChild(newBottomHover, bottomHoverArea);
    topHoverArea.parentNode.replaceChild(newTopHover, topHoverArea);
    
    // Add new instant event listeners
    newBottomHover.addEventListener('mouseenter', () => {
        bottomTooltip.classList.add('show');
        topTooltip.classList.remove('show'); // Hide the other one
        console.log('Bottom tooltip shown instantly');
    });
    
    newBottomHover.addEventListener('mouseleave', () => {
        bottomTooltip.classList.remove('show');
    });
    
    newTopHover.addEventListener('mouseenter', () => {
        topTooltip.classList.add('show');
        bottomTooltip.classList.remove('show'); // Hide the other one
        console.log('Top tooltip shown instantly');
    });
    
    newTopHover.addEventListener('mouseleave', () => {
        topTooltip.classList.remove('show');
    });
    
    console.log('Instant tooltips enabled');
}

// Call this function after the page loads and after any existing tooltip setup
document.addEventListener('DOMContentLoaded', () => {
    // Wait for existing tooltip setup, then override it
    setTimeout(() => {
        makeTooltipsInstant();
    }, 1000); // Wait 1 second for existing setup to complete, then override
});

// DIRECT FIX: Override the enhanceProgressBarWithTooltips function to remove delays
// Add this to the END of your decimal1_practice_redesigned.js file

// Override the existing function to remove any setTimeout delays
function enhanceProgressBarWithTooltips() {
    const progressBarTrack = document.querySelector('.progress-bar-track');
    
    if (!progressBarTrack) {
        console.log('Progress bar track not found');
        return;
    }
    
    // Remove any existing hover elements
    const existingHoverElements = progressBarTrack.querySelectorAll('.progress-bar-hover, .progress-tooltip');
    existingHoverElements.forEach(el => el.remove());
    
    // Create hover areas
    const bottomHoverArea = document.createElement('div');
    bottomHoverArea.className = 'progress-bar-bottom-hover';
    bottomHoverArea.title = 'Rounding to 1 decimal place';
    
    const topHoverArea = document.createElement('div');
    topHoverArea.className = 'progress-bar-top-hover';
    topHoverArea.title = 'Rounding to more than 1 decimal place';
    
    // Create custom tooltips
    const bottomTooltip = document.createElement('div');
    bottomTooltip.className = 'progress-tooltip bottom-section';
    bottomTooltip.textContent = 'Rounding to 1 decimal place';
    
    const topTooltip = document.createElement('div');
    topTooltip.className = 'progress-tooltip top-section';
    topTooltip.textContent = 'Rounding to more than 1 decimal place';
    
    // Add INSTANT hover event listeners (NO setTimeout, NO delays)
    bottomHoverArea.addEventListener('mouseenter', () => {
        bottomTooltip.style.opacity = '1';
        bottomTooltip.classList.add('show');
        topTooltip.style.opacity = '0';
        topTooltip.classList.remove('show');
    });
    
    bottomHoverArea.addEventListener('mouseleave', () => {
        bottomTooltip.style.opacity = '0';
        bottomTooltip.classList.remove('show');
    });
    
    topHoverArea.addEventListener('mouseenter', () => {
        topTooltip.style.opacity = '1';
        topTooltip.classList.add('show');
        bottomTooltip.style.opacity = '0';
        bottomTooltip.classList.remove('show');
    });
    
    topHoverArea.addEventListener('mouseleave', () => {
        topTooltip.style.opacity = '0';
        topTooltip.classList.remove('show');
    });
    
    // Append elements to progress bar track
    progressBarTrack.appendChild(bottomHoverArea);
    progressBarTrack.appendChild(topHoverArea);
    progressBarTrack.appendChild(bottomTooltip);
    progressBarTrack.appendChild(topTooltip);
    
    console.log('INSTANT progress bar tooltips added successfully');
}

// Call it immediately when DOM is ready, and again after a short delay to override any existing setup
document.addEventListener('DOMContentLoaded', () => {
    enhanceProgressBarWithTooltips(); // Call immediately
    
    // Also call after a short delay to override any existing setup
    setTimeout(() => {
        enhanceProgressBarWithTooltips();
    }, 100); // Much shorter delay, just to ensure it overrides
});