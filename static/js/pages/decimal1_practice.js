/**
 * Decimal1 Practice Page Implementation
 */
document.addEventListener('DOMContentLoaded', function() {
    // Create the page class that extends the base PracticePage
    class Decimal1PracticePage extends PracticePage {
        constructor() {
            super(); // Call parent constructor
            this.initialize();
        }

        // Initialize the page
        initialize() {
            this.fetchQuestion();
        }

        // Fetch a new question
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
                    this.displayError('Something went wrong. Please try refreshing the page.');
                });
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
        }
    }

    // Initialize the page
    const decimal1PracticePage = new Decimal1PracticePage();
});