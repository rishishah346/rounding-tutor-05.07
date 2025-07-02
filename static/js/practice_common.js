/**
 * Common JavaScript for all practice pages
 */

// Base class for practice pages
class PracticePage {
    constructor() {
        this.elements = {
            // Practice elements
            questionText: document.getElementById('question-text'),
            choicesContainer: document.getElementById('choices-container'),
            submitButton: document.getElementById('submit-answer'),
            feedbackContainer: document.getElementById('feedback-container'),
            nextButton: document.getElementById('next-button'),
            questionContainer: document.getElementById('question-container'),
            
            // Loading element
            loadingElement: document.getElementById('loading'),
            
            // Reset button
            resetButton: document.getElementById('reset-button')
        };

        // State Management
        this.state = {
            currentQuestion: null,
            selectedAnswer: null,
            currentStage: null,
            questionsAttempted: 0,
            questionsCorrect: 0,
            consecutiveCorrect: 0,
            consecutiveErrors: 0
        };

        // Response data from last answer verification
        this.lastResponseData = null;

        // Bind methods
        this.fetchQuestion = this.fetchQuestion.bind(this);
        this.displayQuestion = this.displayQuestion.bind(this);
        this.selectChoice = this.selectChoice.bind(this);
        this.submitAnswer = this.submitAnswer.bind(this);
        this.displayFeedback = this.displayFeedback.bind(this);
        this.nextQuestion = this.nextQuestion.bind(this);
        this.resetLesson = this.resetLesson.bind(this);

        // Initialize event listeners
        this.initEventListeners();
    }

    // Initialize event listeners
    initEventListeners() {
        if (this.elements.submitButton) {
            this.elements.submitButton.addEventListener('click', this.submitAnswer);
        }

        if (this.elements.nextButton) {
            this.elements.nextButton.addEventListener('click', this.nextQuestion);
        }

        if (this.elements.resetButton) {
            this.elements.resetButton.addEventListener('click', this.resetLesson);
        }
    }

    // Fetch a new question
    fetchQuestion() {
        // To be implemented by subclass
        console.warn('fetchQuestion() should be implemented by subclass');
    }

    // Display the question
    displayQuestion(data) {
        // Store the current question
        this.state.currentQuestion = data;
        this.state.selectedAnswer = null;

        // Set question text
        if (this.elements.questionText) {
            this.elements.questionText.textContent = data.question_text;
        }

        // Clear previous choices
        if (this.elements.choicesContainer) {
            this.elements.choicesContainer.innerHTML = '';
        }

        // Add choices
        if (data.choices && this.elements.choicesContainer) {
            for (const [letter, answer] of Object.entries(data.choices)) {
                const choiceElement = document.createElement('div');
                choiceElement.className = 'choice-item p-4 border rounded-md shadow-sm cursor-pointer hover:bg-gray-50';
                choiceElement.innerHTML = `
                    <span class="font-semibold">${letter})</span> ${answer}
                `;
                choiceElement.dataset.letter = letter;

                // Add click event
                choiceElement.addEventListener('click', () => this.selectChoice(choiceElement));

                this.elements.choicesContainer.appendChild(choiceElement);
            }
        }

        // Show question container
        if (this.elements.questionContainer) {
            this.elements.questionContainer.classList.remove('hidden');
        }

        // Hide feedback container
        if (this.elements.feedbackContainer) {
            this.elements.feedbackContainer.classList.add('hidden');
        }

        // Disable submit button initially
        if (this.elements.submitButton) {
            this.elements.submitButton.disabled = true;
        }

        // Hide next button
        if (this.elements.nextButton) {
            this.elements.nextButton.classList.add('hidden');
        }
    }

    // Handle choice selection
    selectChoice(choiceElement) {
        // Remove selected class from all choices
        const choices = document.querySelectorAll('.choice-item');
        choices.forEach(item => {
            item.classList.remove('selected');
            item.classList.remove('bg-blue-50', 'border-blue-500');
            item.classList.remove('bg-green-50', 'border-green-500');
            item.classList.remove('bg-red-50', 'border-red-500');
        });

        // Add selected class to this choice
        choiceElement.classList.add('selected');
        choiceElement.classList.add('bg-blue-50', 'border-blue-500');

        // Update selected answer
        this.state.selectedAnswer = choiceElement.dataset.letter;

        // Enable submit button
        if (this.elements.submitButton) {
            this.elements.submitButton.disabled = false;
        }
    }

    // Submit answer method
    submitAnswer() {
        if (!this.state.selectedAnswer) return;

        // Disable submit button
        if (this.elements.submitButton) {
            this.elements.submitButton.disabled = true;
        }

        // Show loading
        this.showLoading();

        // Send answer to server
        fetch('/api/verify-answer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                answer: this.state.selectedAnswer
            }),
        })
        .then(response => response.json())
        .then(data => {
            // Hide loading
            this.hideLoading();

            // Store the previous stage before updating
            const previousStage = this.state.currentStage;

            // Update state with result
            this.state.currentStage = data.next_stage;
            this.state.questionsAttempted++;
            
            if (data.is_correct) {
                this.state.questionsCorrect++;
                this.state.consecutiveCorrect++;
                this.state.consecutiveErrors = 0; // Reset error count
            } else {
                this.state.consecutiveCorrect = 0; // Reset correct count
                this.state.consecutiveErrors++;
            }

            this.lastResponseData = data;

            // Check for redirect instruction
            if (data.redirect) {
                console.log("Redirect instruction received:", data.redirect);
                // Redirect to the specified URL
                window.location.href = data.redirect;
                return; // Stop processing further
            }

            // AI Companion Event Triggers
            this.triggerAICompanionEvents(data, previousStage);

            // Show feedback
            this.displayFeedback(data);

            // Highlight correct/incorrect answers
            this.highlightAnswers(data.is_correct);

            // Show next button
            if (this.elements.nextButton) {
                this.elements.nextButton.classList.remove('hidden');
            }
        })
        .catch(error => {
            console.error('Error verifying answer:', error);
            this.hideLoading();
            this.displayError('Something went wrong. Please try again.');
        });
    }

    // AI Companion Event Triggers
    triggerAICompanionEvents(data, previousStage) {
        // Check if AI companion is available
        if (!window.aiCompanion) {
            console.log('AI companion not available');
            return;
        }

        // Prevent duplicate messages within 5 seconds
        const now = Date.now();
        const timeSinceLastMessage = now - this.lastAIMessageTime;

        // Add debug logging
        console.log('AI Trigger Check:', {
            is_correct: data.is_correct,
            consecutiveCorrect: this.state.consecutiveCorrect,
            consecutiveErrors: this.state.consecutiveErrors,
            questionsAttempted: this.state.questionsAttempted,
            timeSinceLastMessage: timeSinceLastMessage
        });

        // Trigger encouragement after consecutive correct answers
        if (data.is_correct && this.state.consecutiveCorrect >= 3) {
            // Only trigger every 3rd correct answer to avoid spam
            if (this.state.consecutiveCorrect % 3 === 0) {
                this.sendAIMessage('encouragement', {
                    consecutive_correct: this.state.consecutiveCorrect,
                    questions_attempted: this.state.questionsAttempted,
                    total_correct: this.state.questionsCorrect
                }, false);
            }
        }

        // Trigger support after repeated errors (with cooldown)
        if (!data.is_correct && this.state.consecutiveErrors >= 2) {
            if (this.lastAIMessageType !== 'struggle_support' || timeSinceLastMessage > 5000) {
                this.sendAIMessage('struggle_support', {
                    wrong_answers: this.state.consecutiveErrors,
                    current_concept: this.getCurrentConceptName(),
                    error_pattern: this.identifyErrorPattern(data),
                    questions_attempted: this.state.questionsAttempted
                }, true);
            }
        }

        // Trigger stage transition message
        if (data.stage_completed && previousStage !== data.next_stage) {
            this.sendAIMessage('stage_transition', {
                previous_stage: previousStage,
                current_stage: data.next_stage,
                previous_stage_description: this.getStageDescription(previousStage),
                current_stage_description: this.getStageDescription(data.next_stage),
                questions_correct: this.state.questionsCorrect,
                questions_attempted: this.state.questionsAttempted
            }, true);
        }

        // Trigger completion message
        if (data.lesson_complete) {
            this.sendAIMessage('completion', {
                stage_name: this.getCurrentConceptName(),
                correct_answers: this.state.questionsCorrect,
                total_questions: this.state.questionsAttempted,
                success_rate: Math.round((this.state.questionsCorrect / this.state.questionsAttempted) * 100)
            }, false);
        }
    }

    // Helper method to send AI messages with tracking
    sendAIMessage(messageType, context, autoExpand) {
        this.lastAIMessageTime = Date.now();
        this.lastAIMessageType = messageType;
        window.aiCompanion.requestMessage(messageType, context, autoExpand);
    }

    // Get description for current concept being practiced
    getCurrentConceptName() {
        const stage = this.state.currentStage;
        const concepts = {
            "1.1": "rounding to 1 decimal place (no rounding up)",
            "1.2": "rounding to 1 decimal place (with rounding up)",
            "1.3": "rounding to 1 decimal place (mixed problems)",
            "2.1": "rounding to 2 decimal places",
            "2.2": "rounding to 2 decimal places (complex numbers)",
            "stretch": "challenging rounding problems",
            "complete": "decimal rounding mastery"
        };
        
        return concepts[stage] || "decimal rounding";
    }

    // Get stage descriptions for AI messages
    getStageDescription(stage) {
        const descriptions = {
            "1.1": "rounding to 1 decimal place without rounding up",
            "1.2": "rounding to 1 decimal place with rounding up",
            "1.3": "rounding to 1 decimal place with mixed problems",
            "2.1": "rounding to 2 decimal places",
            "2.2": "rounding to 2 decimal places with more complex numbers",
            "stretch": "challenging rounding problems",
            "complete": "all rounding concepts"
        };
        
        return descriptions[stage] || "rounding practice";
    }

    // Identify potential error patterns for AI context
    identifyErrorPattern(data) {
        // Basic error pattern identification
        // This can be enhanced with more sophisticated analysis
        
        if (!data.is_correct && this.state.currentQuestion) {
            const studentAnswer = data.verification_steps?.student_answer;
            const correctAnswer = data.verification_steps?.correct_answer;
            
            // Simple pattern detection
            if (studentAnswer && correctAnswer) {
                const studentNum = parseFloat(studentAnswer);
                const correctNum = parseFloat(correctAnswer);
                
                if (studentNum > correctNum) {
                    return "rounding up when should round down";
                } else if (studentNum < correctNum) {
                    return "rounding down when should round up";
                } else {
                    return "decimal place confusion";
                }
            }
        }
        
        return "inconsistent application of rounding rules";
    }

    // Display feedback
    displayFeedback(data) {
        const feedbackClass = data.is_correct ? 
            'feedback-correct bg-green-50 border-l-4 border-green-500' : 
            'feedback-incorrect bg-red-50 border-l-4 border-red-500';

        if (this.elements.feedbackContainer) {
            this.elements.feedbackContainer.innerHTML = `
                <div class="p-4 ${feedbackClass}">
                    <h3 class="font-semibold mb-2">${data.is_correct ? 'Correct!' : 'Not quite right'}</h3>
                    <div class="feedback-content">
                        ${data.feedback}
                    </div>
                </div>
            `;
            this.elements.feedbackContainer.classList.remove('hidden');
        }

        // Check if we're transitioning from stage 1.3 to 2.1 and update next button text
        if (data.stage_completed && 
            data.next_stage === '2.1' && 
            this.elements.nextButton) {
            this.elements.nextButton.textContent = 'Continue to Examples';
            this.elements.nextButton.classList.add('bg-green-600');
            this.elements.nextButton.classList.remove('bg-blue-600');
        } else if (this.elements.nextButton) {
            this.elements.nextButton.textContent = 'Next Question';
            this.elements.nextButton.classList.add('bg-blue-600');
            this.elements.nextButton.classList.remove('bg-green-600');
        }
    }

    // Highlight answers
    highlightAnswers(isCorrect) {
        const choices = document.querySelectorAll('.choice-item');
        choices.forEach(item => {
            if (item.dataset.letter === this.state.selectedAnswer) {
                item.classList.remove('bg-blue-50', 'border-blue-500');
                if (isCorrect) {
                    item.classList.add('bg-green-50', 'border-green-500');
                } else {
                    item.classList.add('bg-red-50', 'border-red-500');
                }
            }

            // If answer is incorrect, highlight the correct one
            if (!isCorrect && item.dataset.letter === this.state.currentQuestion.correct_letter) {
                item.classList.add('bg-green-50', 'border-green-500');
            }
        });
    }

    // Move to next question
    nextQuestion() {
        // Check if we need to redirect to next stage
        if (this.lastResponseData && this.lastResponseData.next_stage_redirect) {
            // Redirect to the next stage
            window.location.href = this.lastResponseData.next_stage_redirect;
            return;
        }

        // Hide next button
        if (this.elements.nextButton) {
            this.elements.nextButton.classList.add('hidden');
        }

        // Hide feedback
        if (this.elements.feedbackContainer) {
            this.elements.feedbackContainer.classList.add('hidden');
        }

        // Fetch next question or move to next stage
        this.fetchQuestion();
    }

    // Show loading indicator
    showLoading() {
        if (this.elements.loadingElement) {
            this.elements.loadingElement.classList.remove('hidden');
        }
    }

    // Hide loading indicator
    hideLoading() {
        if (this.elements.loadingElement) {
            this.elements.loadingElement.classList.add('hidden');
        }
    }

    // Reset lesson
    resetLesson() {
        fetch('/api/reset', {
            method: 'POST',
        })
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

    // Display error
    displayError(message) {
        this.hideLoading();
        if (this.elements.feedbackContainer) {
            this.elements.feedbackContainer.innerHTML = `<div class="p-4 bg-red-50 text-red-600">${message}</div>`;
            this.elements.feedbackContainer.classList.remove('hidden');
        }
    }

    // Handle lesson completion
    handleLessonComplete(data) {
        if (this.elements.questionContainer) {
            this.elements.questionContainer.classList.add('hidden');
        }

        if (this.elements.feedbackContainer) {
            this.elements.feedbackContainer.innerHTML = `
                <div class="text-center py-12">
                    <h2 class="text-2xl font-bold text-green-600 mb-4">Lesson Complete!</h2>
                    <p class="mb-6">${data.message}</p>
                    <button id="restart-lesson" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Restart Lesson
                    </button>
                </div>
            `;
            this.elements.feedbackContainer.classList.remove('hidden');

            // Add event listener for restart button
            const restartButton = document.getElementById('restart-lesson');
            if (restartButton) {
                restartButton.addEventListener('click', this.resetLesson);
            }
        }

        // Trigger completion message to AI companion
        if (window.aiCompanion) {
            this.sendAIMessage('completion', {
                stage_name: this.getCurrentConceptName(),
                correct_answers: this.state.questionsCorrect,
                total_questions: this.state.questionsAttempted,
                success_rate: Math.round((this.state.questionsCorrect / this.state.questionsAttempted) * 100)
            }, false);
        }
    }
}

// Make the PracticePage class available globally
window.PracticePage = PracticePage;