/**
* Redesigned Decimal1 Practice Page - Stage 3 Complete Practice Functionality
* File: static/js/pages/decimal1_practice_redesigned.js
*/

class RedesignedPracticePage {
    constructor() {
        this.currentStage = '1.1'; // Start at practice stage 1.1
        this.questionsAttempted = 0;
        this.questionsCorrect = 0;
        this.consecutiveCorrect = 0;
        this.currentQuestion = null;
        this.selectedAnswer = null;
        this.backendSessionData = null; // NEW: Store backend session state
        this.initialProgressCalculated = false; // NEW: Track if we've done initial calculation
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadBackendState(); // NEW: Load backend state first
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
            loading: document.getElementById('loading')
        };
    }

    // NEW: Load backend session state
    loadBackendState() {
        this.showLoading();
        
        // Fetch current stage and session information from backend
        fetch('/api/current-stage')
            .then(response => response.json())
            .then(data => {
                this.hideLoading();
                
                // Check for redirect (user might be in wrong place)
                if (data.redirect) {
                    console.log('Backend suggests redirect to:', data.redirect);
                    // For practice page, we'll respect redirects but also show current state
                    if (!window.location.pathname.includes('practice')) {
                        window.location.href = data.redirect;
                        return;
                    }
                }
                
                // Store backend session data
                this.backendSessionData = data;
                
                // Update local state from backend if available
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
                
                // Now update progress with backend data and load content
                this.updateProgressFromBackend();
                this.loadInitialContent();
                
            })
            .catch(error => {
                console.error('Error loading backend state:', error);
                this.hideLoading();
                
                // Fallback to default state if backend fails
                console.log('Using fallback state due to backend error');
                this.updateProgress();
                this.loadInitialContent();
            });
    }

    // NEW: Update progress based on backend session data
    updateProgressFromBackend() {
        if (!this.backendSessionData) {
            console.log('No backend data, using local progress calculation');
            this.updateProgress();
            return;
        }
        
        // Get actual lesson progress from backend session state
        const learningState = this.backendSessionData.learning_state;
        let calculatedProgress;
        
        if (learningState) {
            // Use backend session data to calculate progress
            calculatedProgress = this.calculateProgressFromBackendState(learningState);
            console.log('Progress calculated from backend state:', calculatedProgress);
        } else {
            // Fallback to local calculation
            calculatedProgress = this.calculateOverallLessonProgress();
            console.log('Using local progress calculation as fallback:', calculatedProgress);
        }
        
        // Update progress bar
        if (this.elements.progressBar) {
            this.elements.progressBar.style.height = `${calculatedProgress}%`;
        }
        
        // Update percentage display
        if (this.elements.progressPercentage) {
            this.elements.progressPercentage.textContent = `${Math.round(calculatedProgress)}%`;
        }
        
        console.log(`Backend-driven progress: ${Math.round(calculatedProgress)}% (Stage: ${this.currentStage})`);
    }

    // NEW: Calculate progress from backend session state
    calculateProgressFromBackendState(learningState) {
        // Define the lesson structure and progress mapping (same as before)
        const lessonStages = {
            // Examples 1.1 and 1.2 (already completed)
            'example_1_1': 10,  // Example 1.1 - COMPLETED
            'example_1_2': 20,  // Example 1.2 - COMPLETED
            
            // Practice stages (current page)
            '1.1': 30,  // Practice 1.1
            '1.2': 40,  // Practice 1.2  
            '1.3': 50,  // Practice 1.3
            
            // Examples 2.1 and 2.2 (future)
            'example_2_1': 60,  // Example 2.1
            'example_2_2': 70,  // Example 2.2
            
            // Practice stages 2 (future)
            '2.1': 80,  // Practice 2.1
            '2.2': 90,  // Practice 2.2
            
            // Special stages
            'stretch': 100,
            'complete': 100
        };
        
        const currentStage = learningState.stage || '1.1';
        
        // Determine if we're in examples mode or practice mode
        const showingExample = learningState.showing_example || false;
        
        // Calculate base progress for current stage
        let baseProgress;
        
        if (showingExample) {
            // If showing examples, we're between stages or transitioning
            if (currentStage === '2.1') {
                // Showing 2.1 examples after completing 1.3 practice
                baseProgress = 60; // At example 2.1 stage
            } else {
                // Default to stage progress
                baseProgress = lessonStages[currentStage] || 20;
            }
        } else {
            // In practice mode, use stage-based progress
            baseProgress = lessonStages[currentStage] || 20;
        }
        
        // Add micro-progress within current stage based on backend data
        if (learningState.consecutive_correct > 0 && !showingExample) {
            const questionsNeededForStage = this.getQuestionsNeededForStage(currentStage);
            const microProgress = Math.min(1, learningState.consecutive_correct / questionsNeededForStage);
            const stageWidth = 10; // Each practice stage is worth 10%
            const previousStageProgress = Math.max(0, baseProgress - stageWidth);
            baseProgress = previousStageProgress + (microProgress * stageWidth);
        }
        
        // Ensure minimum progress (examples complete)
        return Math.min(100, Math.max(20, baseProgress));
    }

    initializeEventListeners() {
        // Reset button
        document.getElementById('reset-button')?.addEventListener('click', () => this.resetLesson());
    }

    // Global lesson progress calculation (matches examples page logic)
    calculateOverallLessonProgress() {
        // Define the lesson structure and progress mapping
        const lessonStages = {
            // Examples 1.1 and 1.2 (already completed)
            'example_1_1': 10,  // Example 1.1 - COMPLETED
            'example_1_2': 20,  // Example 1.2 - COMPLETED
            
            // Practice stages (current page)
            '1.1': 30,  // Practice 1.1
            '1.2': 40,  // Practice 1.2  
            '1.3': 50,  // Practice 1.3
            
            // Examples 2.1 and 2.2 (future)
            'example_2_1': 60,  // Example 2.1
            'example_2_2': 70,  // Example 2.2
            
            // Practice stages 2 (future)
            '2.1': 80,  // Practice 2.1
            '2.2': 90,  // Practice 2.2
            
            // Special stages
            'stretch': 100,
            'complete': 100
        };
        
        // Get base progress for current stage
        let baseProgress = lessonStages[this.currentStage] || 20; // Default to 20% (examples complete)
        
        // Add micro-progress within current stage based on questions attempted
        if (this.questionsAttempted > 0) {
            const questionsNeededForStage = this.getQuestionsNeededForStage(this.currentStage);
            const microProgress = Math.min(1, this.consecutiveCorrect / questionsNeededForStage);
            const stageWidth = 10; // Each practice stage is worth 10%
            const previousStageProgress = Math.max(0, baseProgress - stageWidth);
            baseProgress = previousStageProgress + (microProgress * stageWidth);
        }
        
        return Math.min(100, Math.max(20, baseProgress)); // Minimum 20% (examples done)
    }

    getQuestionsNeededForStage(stage) {
        // Define how many consecutive correct answers are needed to advance
        const requirements = {
            '1.1': 1,  // Need 1 correct for stage 1.1
            '1.2': 1,  // Need 1 correct for stage 1.2
            '1.3': 2,  // Need 2 consecutive correct for stage 1.3
        };
        return requirements[stage] || 1;
    }

    updateProgress() {
        // Calculate overall lesson progress
        const overallProgress = this.calculateOverallLessonProgress();
        
        // Update progress bar
        if (this.elements.progressBar) {
            this.elements.progressBar.style.height = `${overallProgress}%`;
        }
        
        // Update percentage display
        if (this.elements.progressPercentage) {
            this.elements.progressPercentage.textContent = `${Math.round(overallProgress)}%`;
        }
        
        console.log(`Overall lesson progress: ${Math.round(overallProgress)}% (Practice stage: ${this.currentStage})`);
    }

    loadInitialContent() {
        // Load examples and practice content
        this.loadExamplesContent();
        this.loadPracticeContent();
        this.loadTutorContent();
    }

    loadExamplesContent() {
        // Load detailed examples into left side of whiteboard
        const examplesContainer = document.getElementById('examples-content');
        if (examplesContainer) {
            examplesContainer.innerHTML = `
                <div class="space-y-6">
                    <!-- Example 1.1 - Detailed Step-by-Step -->
                    <div class="example-detailed bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
                        <div class="example-header bg-blue-100 px-4 py-3 border-b border-blue-200">
                            <div class="flex items-center justify-between">
                                <h4 class="font-semibold text-blue-800">Example 1.1</h4>
                                <span class="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded">Completed</span>
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
                                    <h5 class="font-semibold text-blue-700 text-sm">Identify the 1st decimal place</h5>
                                </div>
                                <div class="step-visual bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-3">
                                    <div class="math-display text-center">
                                        <span class="text-2xl font-mono font-bold text-gray-800">12.6</span><span class="text-2xl font-mono font-bold text-red-600 border-r-2 border-red-600 pr-1">|</span><span class="text-2xl font-mono font-bold text-gray-400">32</span>
                                    </div>
                                    <div class="annotation text-center mt-2">
                                        <span class="text-xs text-red-600 font-medium">1st decimal place</span>
                                    </div>
                                </div>
                                <div class="step-explanation text-xs text-blue-600">
                                    The first digit after the decimal point is <strong>6</strong>. This is our "rounding digit". Draw a line after it.
                                </div>
                            </div>

                            <!-- Step 2 -->
                            <div class="step bg-white border border-blue-100 rounded-lg p-3">
                                <div class="step-header flex items-center mb-3">
                                    <span class="step-number w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">2</span>
                                    <h5 class="font-semibold text-blue-700 text-sm">Check the next digit</h5>
                                </div>
                                <div class="step-visual bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-3">
                                    <div class="math-display text-center">
                                        <span class="text-2xl font-mono font-bold text-gray-800">12.6</span><span class="text-2xl font-mono font-bold text-red-600 border-r-2 border-red-600 pr-1">|</span><span class="text-2xl font-mono font-bold text-orange-600 bg-orange-100 px-1">3</span><span class="text-2xl font-mono font-bold text-gray-400">2</span>
                                    </div>
                                    <div class="annotation text-center mt-2">
                                        <span class="text-xs text-orange-600 font-medium">Next digit is 3 (less than 5)</span>
                                    </div>
                                </div>
                                <div class="step-explanation text-xs text-blue-600">
                                    The digit to the right is <strong>3</strong>. Since 3 is less than 5, we keep the rounding digit the same.
                                </div>
                            </div>

                            <!-- Step 3 -->
                            <div class="step bg-white border border-blue-100 rounded-lg p-3">
                                <div class="step-header flex items-center mb-3">
                                    <span class="step-number w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">3</span>
                                    <h5 class="font-semibold text-blue-700 text-sm">Remove digits after the line</h5>
                                </div>
                                <div class="step-visual bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-3">
                                    <div class="math-display text-center">
                                        <span class="text-2xl font-mono font-bold text-green-700">12.6</span>
                                    </div>
                                    <div class="annotation text-center mt-2">
                                        <span class="text-xs text-green-600 font-medium">Final answer</span>
                                    </div>
                                </div>
                                <div class="step-explanation text-xs text-blue-600">
                                    Remove all digits after the line. <strong>12.6</strong> is our final answer.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Example 1.2 - Detailed Step-by-Step -->
                    <div class="example-detailed bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
                        <div class="example-header bg-blue-100 px-4 py-3 border-b border-blue-200">
                            <div class="flex items-center justify-between">
                                <h4 class="font-semibold text-blue-800">Example 1.2</h4>
                                <span class="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded">Completed</span>
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
                                    <h5 class="font-semibold text-blue-700 text-sm">Identify the 1st decimal place</h5>
                                </div>
                                <div class="step-visual bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-3">
                                    <div class="math-display text-center">
                                        <span class="text-2xl font-mono font-bold text-gray-800">12.6</span><span class="text-2xl font-mono font-bold text-red-600 border-r-2 border-red-600 pr-1">|</span><span class="text-2xl font-mono font-bold text-gray-400">82</span>
                                    </div>
                                    <div class="annotation text-center mt-2">
                                        <span class="text-xs text-red-600 font-medium">1st decimal place</span>
                                    </div>
                                </div>
                                <div class="step-explanation text-xs text-blue-600">
                                    The first digit after the decimal point is <strong>6</strong>. Draw a line after it.
                                </div>
                            </div>

                            <!-- Step 2 -->
                            <div class="step bg-white border border-blue-100 rounded-lg p-3">
                                <div class="step-header flex items-center mb-3">
                                    <span class="step-number w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">2</span>
                                    <h5 class="font-semibold text-blue-700 text-sm">Check the next digit</h5>
                                </div>
                                <div class="step-visual bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-3">
                                    <div class="math-display text-center">
                                        <span class="text-2xl font-mono font-bold text-gray-800">12.6</span><span class="text-2xl font-mono font-bold text-red-600 border-r-2 border-red-600 pr-1">|</span><span class="text-2xl font-mono font-bold text-orange-600 bg-orange-100 px-1">8</span><span class="text-2xl font-mono font-bold text-gray-400">2</span>
                                    </div>
                                    <div class="annotation text-center mt-2">
                                        <span class="text-xs text-orange-600 font-medium">Next digit is 8 (5 or greater)</span>
                                    </div>
                                </div>
                                <div class="step-explanation text-xs text-blue-600">
                                    The digit to the right is <strong>8</strong>. Since 8 is 5 or greater, we round up by adding 1 to the rounding digit.
                                </div>
                            </div>

                            <!-- Step 3 -->
                            <div class="step bg-white border border-blue-100 rounded-lg p-3">
                                <div class="step-header flex items-center mb-3">
                                    <span class="step-number w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">3</span>
                                    <h5 class="font-semibold text-blue-700 text-sm">Round up and remove extra digits</h5>
                                </div>
                                <div class="step-visual bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-3">
                                    <div class="math-display text-center">
                                        <span class="text-2xl font-mono font-bold text-green-700">12.7</span>
                                    </div>
                                    <div class="annotation text-center mt-2">
                                        <span class="text-xs text-green-600 font-medium">Final answer (6 became 7)</span>
                                    </div>
                                </div>
                                <div class="step-explanation text-xs text-blue-600">
                                    The 6 becomes 7 (rounded up), and we remove digits after the line. <strong>12.7</strong> is our final answer.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Reference Card -->
                    <div class="reference-card bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-700 mb-3 flex items-center">
                            <span class="w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">?</span>
                            Quick Reference
                        </h4>
                        <div class="space-y-2 text-xs text-gray-600">
                            <div class="flex items-start">
                                <span class="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                                <span><strong>If next digit ≥ 5:</strong> Round up (add 1 to rounding digit)</span>
                            </div>
                            <div class="flex items-start">
                                <span class="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                                <span><strong>If next digit < 5:</strong> Keep rounding digit the same</span>
                            </div>
                            <div class="flex items-start">
                                <span class="w-2 h-2 bg-purple-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                                <span><strong>Always:</strong> Remove all digits after the cut-off line</span>
                            </div>
                        </div>
                    </div>

                    <!-- Tips Section -->
                    <div class="tips-card bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 class="font-semibold text-yellow-800 mb-3 flex items-center">
                            <span class="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">💡</span>
                            Practice Tips
                        </h4>
                        <div class="space-y-2 text-xs text-yellow-700">
                            <div>• Always identify the target decimal place first</div>
                            <div>• Draw an imaginary line after the rounding digit</div>
                            <div>• Look at the very next digit to decide: round up or keep same</div>
                            <div>• Remember: 5, 6, 7, 8, 9 = round up; 0, 1, 2, 3, 4 = keep same</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    loadPracticeContent() {
        // Load practice questions into right side of whiteboard
        const practiceContainer = document.getElementById('practice-content');
        if (practiceContainer) {
            practiceContainer.innerHTML = `
                <div class="space-y-4">
                    <!-- Current Stage Indicator -->
                    <div class="stage-indicator bg-green-50 border border-green-200 rounded-lg p-3">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="font-semibold text-green-800 text-sm">Practice Stage ${this.currentStage}</h4>
                            <span class="text-xs bg-green-200 text-green-700 px-2 py-1 rounded">Active</span>
                        </div>
                        <div class="text-xs text-green-700">
                            ${this.getStageDescription(this.currentStage)}
                        </div>
                        <div class="mt-2 text-xs text-green-600">
                            Progress: ${this.consecutiveCorrect}/${this.getQuestionsNeededForStage(this.currentStage)} consecutive correct needed
                        </div>
                    </div>

                    <!-- Practice Question Container -->
                    <div id="question-container" class="question-area bg-white border border-gray-200 rounded-lg p-3">
                        <h4 class="font-semibold text-gray-800 mb-3 text-sm">Current Question</h4>
                        
                        <!-- Question Text -->
                        <div id="question-text" class="text-sm font-medium text-gray-800 mb-3"></div>
                        
                        <!-- Choices Container -->
                        <div id="choices-container" class="space-y-2 mb-3">
                            <!-- Choices will be inserted here by JavaScript -->
                        </div>
                        
                        <!-- Submit Button -->
                        <button id="submit-answer" class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-3 rounded text-sm transition-all" disabled>
                            Submit Answer
                        </button>
                    </div>

                    <!-- Feedback Container (hidden initially) -->
                    <div id="feedback-container" class="feedback-area bg-gray-50 border border-gray-200 rounded-lg p-3 hidden">
                        <!-- Feedback will be inserted here by JavaScript -->
                    </div>

                    <!-- Next Button Container -->
                    <div id="next-button-container" class="text-center hidden">
                        <button id="next-button" class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded text-sm transition-all">
                            Next Question
                        </button>
                    </div>

                    <!-- Progress Info -->
                    <div class="progress-info bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <h4 class="font-semibold text-gray-700 mb-2 text-sm">Session Progress</h4>
                        <div class="grid grid-cols-2 gap-3 text-xs text-gray-600">
                            <div>
                                <div class="font-medium">Questions Attempted</div>
                                <div class="text-base font-bold text-blue-600" id="questions-attempted">${this.questionsAttempted}</div>
                            </div>
                            <div>
                                <div class="font-medium">Correct Answers</div>
                                <div class="text-base font-bold text-green-600" id="questions-correct">${this.questionsCorrect}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Initialize practice functionality
        this.initializePractice();
    }

    initializePractice() {
        // Set up event listeners for practice functionality
        const submitButton = document.getElementById('submit-answer');
        const nextButton = document.getElementById('next-button');
        
        if (submitButton) {
            submitButton.addEventListener('click', () => this.submitAnswer());
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', () => this.nextQuestion());
        }
        
        // Load the first question
        this.fetchQuestion();
    }

    fetchQuestion() {
        this.showLoading();
        
        fetch('/api/decimal1/practice/question')
            .then(response => response.json())
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
                this.showError('Failed to load question. Please try again.');
            });
    }

    displayQuestion(question) {
        this.currentQuestion = question;
        this.selectedAnswer = null;
        
        // Update question text
        const questionText = document.getElementById('question-text');
        if (questionText) {
            questionText.textContent = question.question_text;
        }
        
        // Clear and populate choices
        const choicesContainer = document.getElementById('choices-container');
        if (choicesContainer) {
            choicesContainer.innerHTML = '';
            
            for (const [letter, answer] of Object.entries(question.choices)) {
                const choiceElement = document.createElement('div');
                choiceElement.className = 'choice-item p-2 border rounded cursor-pointer hover:bg-gray-50 transition-all text-sm';
                choiceElement.innerHTML = `
                    <span class="font-medium">${letter})</span> ${answer}
                `;
                choiceElement.dataset.letter = letter;
                
                choiceElement.addEventListener('click', () => this.selectChoice(choiceElement));
                choicesContainer.appendChild(choiceElement);
            }
        }
        
        // Reset submit button
        const submitButton = document.getElementById('submit-answer');
        if (submitButton) {
            submitButton.disabled = true;
        }
        
        // Hide feedback and next button
        this.hideFeedback();
        this.hideNextButton();
        
        // Show question container
        const questionContainer = document.getElementById('question-container');
        if (questionContainer) {
            questionContainer.classList.remove('hidden');
        }
    }

    selectChoice(choiceElement) {
        // Remove selected class from all choices
        const choices = document.querySelectorAll('.choice-item');
        choices.forEach(item => {
            item.classList.remove('selected', 'bg-blue-50', 'border-blue-500');
        });
        
        // Add selected class to this choice
        choiceElement.classList.add('selected', 'bg-blue-50', 'border-blue-500');
        
        // Update selected answer
        this.selectedAnswer = choiceElement.dataset.letter;
        
        // Enable submit button
        const submitButton = document.getElementById('submit-answer');
        if (submitButton) {
            submitButton.disabled = false;
        }
    }

    submitAnswer() {
        if (!this.selectedAnswer) return;
        
        // Disable submit button
        const submitButton = document.getElementById('submit-answer');
        if (submitButton) {
            submitButton.disabled = true;
        }
        
        this.showLoading();
        
        // Send answer to server
        fetch('/api/verify-answer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                answer: this.selectedAnswer
            }),
        })
        .then(response => response.json())
        .then(data => {
            this.hideLoading();
            
            // CRITICAL: Update backend session data from response
            if (data.learning_state || data.next_stage) {
                this.syncWithBackendResponse(data);
            } else {
                // Fallback: update local stats
                this.questionsAttempted++;
                if (data.is_correct) {
                    this.questionsCorrect++;
                    this.consecutiveCorrect++;
                } else {
                    this.consecutiveCorrect = 0;
                }
                
                // Update stage if provided
                if (data.next_stage) {
                    this.currentStage = data.next_stage;
                }
            }
            
            // Handle redirects
            if (data.next_stage_redirect) {
                window.location.href = data.next_stage_redirect;
                return;
            }
            
            // Show feedback
            this.displayFeedback(data);
            
            // Highlight answers
            this.highlightAnswers(data.is_correct);
            
            // Show next button
            this.showNextButton();
            
            // Update progress displays with backend-synced data
            this.updateProgressDisplays();
            this.updateProgressFromBackend(); // Use backend data for progress
            
            // Check for stage completion and update content accordingly
            if (data.stage_completed) {
                this.handleStageCompletion(data);
            }
        })
        .catch(error => {
            console.error('Error verifying answer:', error);
            this.hideLoading();
            this.showError('Failed to verify answer. Please try again.');
        });
    }

    // NEW: Sync local state with backend response
    syncWithBackendResponse(data) {
        console.log('Syncing with backend response:', data);
        
        // Update from backend learning state if available
        if (data.learning_state) {
            // Create a mock backend session data structure
            this.backendSessionData = {
                learning_state: data.learning_state
            };
            
            // Update local state from backend
            this.currentStage = data.learning_state.stage || this.currentStage;
            this.questionsAttempted = data.learning_state.questions_attempted || this.questionsAttempted + 1;
            this.questionsCorrect = data.learning_state.correct_answers || this.questionsCorrect + (data.is_correct ? 1 : 0);
            this.consecutiveCorrect = data.learning_state.consecutive_correct || (data.is_correct ? this.consecutiveCorrect + 1 : 0);
        } else {
            // Fallback: update manually
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

    // NEW: Handle stage completion events
    handleStageCompletion(data) {
        console.log('Stage completed:', data);
        
        // Update the stage indicator on the practice side
        const stageIndicator = document.querySelector('.stage-indicator');
        if (stageIndicator) {
            // Add completion animation
            stageIndicator.classList.add('stage-completed');
            
            // Update text to show completion
            const stageTitle = stageIndicator.querySelector('h4');
            if (stageTitle) {
                stageTitle.innerHTML = `Practice Stage ${this.currentStage} <span class="text-green-600">✓ Complete</span>`;
            }
            
            // Update status badge
            const statusBadge = stageIndicator.querySelector('span');
            if (statusBadge) {
                statusBadge.textContent = 'Complete!';
                statusBadge.className = 'text-xs bg-green-200 text-green-700 px-2 py-1 rounded';
            }
        }
        
        // If transitioning to next major section (like from 1.3 to 2.1), show special message
        if (data.showing_new_examples) {
            setTimeout(() => {
                this.showTransitionMessage(data);
            }, 1500);
        }
    }

    // NEW: Show transition message for major section changes
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
                            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-sm transition-all">
                        Continue to Next Section
                    </button>
                </div>
            `;
            
            practiceContainer.innerHTML = transitionHTML;
        }
    }

    displayFeedback(data) {
        const feedbackContainer = document.getElementById('feedback-container');
        if (feedbackContainer) {
            const feedbackClass = data.is_correct ? 
                'bg-green-50 border-green-200' : 
                'bg-red-50 border-red-200';
                
            feedbackContainer.className = `feedback-area border rounded-lg p-3 ${feedbackClass}`;
            feedbackContainer.innerHTML = `
                <div class="text-sm">
                    <h4 class="font-semibold mb-2 ${data.is_correct ? 'text-green-800' : 'text-red-800'}">
                        ${data.is_correct ? 'Correct!' : 'Not quite right'}
                    </h4>
                    <div class="text-xs ${data.is_correct ? 'text-green-700' : 'text-red-700'}">
                        ${data.feedback}
                    </div>
                </div>
            `;
            feedbackContainer.classList.remove('hidden');
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
            
            // If answer is incorrect, highlight the correct one
            if (!isCorrect && item.dataset.letter === this.currentQuestion.correct_letter) {
                item.classList.add('bg-green-50', 'border-green-500');
            }
        });
    }

    showNextButton() {
        const nextButtonContainer = document.getElementById('next-button-container');
        if (nextButtonContainer) {
            nextButtonContainer.classList.remove('hidden');
        }
    }

    hideNextButton() {
        const nextButtonContainer = document.getElementById('next-button-container');
        if (nextButtonContainer) {
            nextButtonContainer.classList.add('hidden');
        }
    }

    hideFeedback() {
        const feedbackContainer = document.getElementById('feedback-container');
        if (feedbackContainer) {
            feedbackContainer.classList.add('hidden');
        }
    }

    nextQuestion() {
        // Hide feedback and next button
        this.hideFeedback();
        this.hideNextButton();
        
        // Fetch next question
        this.fetchQuestion();
    }

    updateProgressDisplays() {
        // Update the progress info display
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
                    <button onclick="window.location.href='/'" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-sm">
                        Continue Lesson
                    </button>
                </div>
            `;
        }
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
        // Load inactive tutor content
        if (this.elements.tutorText) {
            this.elements.tutorText.innerHTML = `
                <p>Math tutor is ready to help when needed.</p>
                <p class="text-gray-500 text-sm mt-2">(Currently inactive - will be enhanced later)</p>
            `;
        }
    }

    resetLesson() {
        fetch('/api/reset', { method: 'POST' })
            .then(response => response.json())
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
        this.elements.loading?.classList.remove('hidden');
    }

    hideLoading() {
        this.elements.loading?.classList.add('hidden');
    }

    showError(message) {
        console.error(message);
        alert(message);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new RedesignedPracticePage();
});