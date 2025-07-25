/**
* Redesigned Decimal1 Practice Page - Stage 1 Layout
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
        
        this.initializeElements();
        this.initializeEventListeners();
        this.updateProgress();
        this.loadInitialContent();
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
        // Placeholder for loading initial examples and practice content
        this.loadExamplesContent();
        this.loadPracticeContent();
        this.loadTutorContent();
    }

    loadExamplesContent() {
        // Load examples into left side of whiteboard
        const examplesContainer = document.getElementById('examples-content');
        if (examplesContainer) {
            examplesContainer.innerHTML = `
                <div class="space-y-4">
                    <!-- Example 1.1 -->
                    <div class="example-card bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-semibold text-blue-800">Example 1.1</h4>
                            <span class="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded">Completed</span>
                        </div>
                        <div class="text-sm text-blue-700 mb-2">
                            <strong>Question:</strong> Round 12.632 to 1 decimal place
                        </div>
                        <div class="text-sm text-blue-600">
                            <strong>Answer:</strong> 12.6
                        </div>
                        <div class="mt-3 text-xs text-blue-500 space-y-1">
                            <div>• Identify 1st decimal place: 6</div>
                            <div>• Next digit is 3 (less than 5)</div>
                            <div>• Keep the 6 the same</div>
                        </div>
                    </div>

                    <!-- Example 1.2 -->
                    <div class="example-card bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-semibold text-blue-800">Example 1.2</h4>
                            <span class="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded">Completed</span>
                        </div>
                        <div class="text-sm text-blue-700 mb-2">
                            <strong>Question:</strong> Round 12.682 to 1 decimal place
                        </div>
                        <div class="text-sm text-blue-600">
                            <strong>Answer:</strong> 12.7
                        </div>
                        <div class="mt-3 text-xs text-blue-500 space-y-1">
                            <div>• Identify 1st decimal place: 6</div>
                            <div>• Next digit is 8 (5 or greater)</div>
                            <div>• Round up: 6 becomes 7</div>
                        </div>
                    </div>

                    <!-- Reference section -->
                    <div class="reference-card bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                        <h4 class="font-semibold text-gray-700 mb-2">Quick Reference</h4>
                        <div class="text-xs text-gray-600 space-y-1">
                            <div><strong>Rule:</strong> If next digit ≥ 5, round up</div>
                            <div><strong>Rule:</strong> If next digit < 5, keep same</div>
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
                    <div class="stage-indicator bg-green-50 border border-green-200 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="font-semibold text-green-800">Practice Stage ${this.currentStage}</h4>
                            <span class="text-xs bg-green-200 text-green-700 px-2 py-1 rounded">Active</span>
                        </div>
                        <div class="text-sm text-green-700">
                            ${this.getStageDescription(this.currentStage)}
                        </div>
                        <div class="mt-2 text-xs text-green-600">
                            Progress: ${this.questionsCorrect}/${this.getQuestionsNeededForStage(this.currentStage)} correct
                        </div>
                    </div>

                    <!-- Practice Question Area -->
                    <div class="question-area bg-white border border-gray-200 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-800 mb-3">Current Question</h4>
                        <div class="text-sm text-gray-600 mb-4">
                            Practice questions will be loaded here based on the current stage.
                        </div>
                        
                        <!-- Placeholder for question content -->
                        <div class="question-placeholder bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <div class="text-gray-500 mb-2">🎯</div>
                            <div class="text-sm text-gray-600">Ready for practice questions</div>
                        </div>
                    </div>

                    <!-- Progress Info -->
                    <div class="progress-info bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-700 mb-2">Your Progress</h4>
                        <div class="grid grid-cols-2 gap-4 text-xs text-gray-600">
                            <div>
                                <div class="font-medium">Questions Attempted</div>
                                <div class="text-lg font-bold text-blue-600">${this.questionsAttempted}</div>
                            </div>
                            <div>
                                <div class="font-medium">Correct Answers</div>
                                <div class="text-lg font-bold text-green-600">${this.questionsCorrect}</div>
                            </div>
                        </div>
                    </div>
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
                <p>(Currently inactive - will be enhanced later)</p>
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