/**
 * Redesigned Decimal1 Examples Page with Separated Content
 * File: static/js/pages/decimal1_examples_redesigned.js
 */

class RedesignedExamplePage {
    constructor() {
        this.currentExample = 1;
        this.currentStep = 1;
        this.totalExamples = 2;
        this.exampleData = null;
        this.isTypewriting = false;
        
        // DOM elements
        this.elements = {
            // Progress elements
            progressBar: document.getElementById('progress-bar'),
            currentStep: document.getElementById('current-step'),
            totalSteps: document.getElementById('total-steps'),
            progressPercentage: document.getElementById('progress-percentage'),
            stepList: document.getElementById('step-list'),
            
            // Navigation
            prevButton: document.getElementById('prev-step'),
            nextButton: document.getElementById('next-step'),
            nextExampleButton: document.getElementById('next-example'),
            
            // Content areas
            exampleTitle: document.getElementById('example-title'),
            exampleQuestion: document.getElementById('example-question'),
            mathDisplay: document.getElementById('math-display'),
            mathAnnotation: document.getElementById('math-annotation'),
            
            // Tutor elements
            typewriterText: document.getElementById('typewriter-text'),
            cursor: document.getElementById('cursor'),
            pauseButton: document.getElementById('pause-text'),
            skipButton: document.getElementById('speed-text'),
            
            // Example tracking
            currentExampleSpan: document.getElementById('current-example'),
            totalExamplesSpan: document.getElementById('total-examples'),
            
            // Loading
            loading: document.getElementById('loading')
        };
        
        this.initializeEventListeners();
        this.loadCurrentExample();
    }
    
    initializeEventListeners() {
        // Navigation buttons
        this.elements.nextButton.addEventListener('click', () => this.nextStep());
        this.elements.prevButton.addEventListener('click', () => this.prevStep());
        this.elements.nextExampleButton.addEventListener('click', () => this.nextExample());
        
        // Typewriter controls
        this.elements.pauseButton.addEventListener('click', () => this.togglePause());
        this.elements.skipButton.addEventListener('click', () => this.skipTypewriter());
        
        // Reset button
        const resetButton = document.getElementById('reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetLesson());
        }
    }
    
    async loadCurrentExample() {
        try {
            this.showLoading();
            
            const response = await fetch(`/api/decimal1/examples/${this.currentExample === 1 ? 'first' : 'second'}`);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.exampleData = data;
            this.hideLoading();
            
            // Update example info
            this.elements.exampleTitle.textContent = `Example ${this.currentExample}`;
            this.elements.exampleQuestion.textContent = data.question_text;
            this.elements.currentExampleSpan.textContent = this.currentExample;
            this.elements.totalExamplesSpan.textContent = this.totalExamples;
            
            // Update total steps
            this.elements.totalSteps.textContent = data.total_steps;
            
            // Load first step
            this.currentStep = 1;
            this.loadCurrentStep();
            
        } catch (error) {
            console.error('Error loading example:', error);
            this.hideLoading();
            this.showError('Failed to load example. Please try again.');
        }
    }
    
    loadCurrentStep() {
        if (!this.exampleData || !this.exampleData.steps) {
            console.error('No example data available');
            return;
        }
        
        const stepData = this.exampleData.steps[this.currentStep - 1];
        if (!stepData) {
            console.error('Invalid step number:', this.currentStep);
            return;
        }
        
        // Update progress
        this.updateProgress();
        
        // Update whiteboard content
        this.updateWhiteboardContent(stepData.image_content);
        
        // Start typewriter effect for text
        this.startTypewriter(stepData.text_content);
        
        // Update navigation buttons
        this.updateNavigationButtons();
    }
    
    updateWhiteboardContent(imageContent) {
        // Update math display
        this.elements.mathDisplay.textContent = imageContent.display_text;
        this.elements.mathAnnotation.textContent = imageContent.annotation;
        
        // Add visual highlighting based on highlight_position
        this.applyHighlighting(imageContent.highlight_position);
    }
    
    applyHighlighting(highlightPosition) {
        // Remove previous highlighting
        this.elements.mathDisplay.className = 'text-6xl font-bold mb-4';
        this.elements.mathAnnotation.className = 'text-sm text-red-600';
        
        // Apply specific highlighting based on position
        switch (highlightPosition) {
            case 'after_6':
                // Could add special styling for highlighting the cut-off position
                this.elements.mathAnnotation.className = 'text-sm text-red-600 font-bold';
                break;
            case 'after_line':
                // Highlight the digit after the line
                this.elements.mathAnnotation.className = 'text-sm text-orange-600 font-bold';
                break;
            case 'complete':
                // Show final answer styling
                this.elements.mathDisplay.className = 'text-6xl font-bold mb-4 text-green-700';
                this.elements.mathAnnotation.className = 'text-sm text-green-600 font-bold';
                break;
        }
    }
    
    updateProgress() {
        // Update step indicators
        const progressPercent = (this.currentStep / this.exampleData.total_steps) * 100;
        this.elements.progressBar.style.width = `${progressPercent}%`;
        this.elements.currentStep.textContent = this.currentStep;
        this.elements.progressPercentage.textContent = `${Math.round(progressPercent)}%`;
        
        // Update step list
        const stepItems = this.elements.stepList.querySelectorAll('.step-item');
        stepItems.forEach((item, index) => {
            const stepNumber = index + 1;
            const indicator = item.querySelector('.step-indicator');
            const text = item.querySelector('span');
            
            if (stepNumber < this.currentStep) {
                // Completed step
                item.className = 'step-item completed';
                indicator.className = 'step-indicator w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-semibold';
                text.className = 'text-sm text-gray-700';
            } else if (stepNumber === this.currentStep) {
                // Current step
                item.className = 'step-item active';
                indicator.className = 'step-indicator w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold';
                text.className = 'text-sm text-gray-700';
            } else {
                // Future step
                item.className = 'step-item';
                indicator.className = 'step-indicator w-6 h-6 rounded-full bg-gray-300 text-gray-600 text-xs flex items-center justify-center';
                text.className = 'text-sm text-gray-500';
            }
        });
    }
    
    updateNavigationButtons() {
        // Update Previous button
        this.elements.prevButton.disabled = this.currentStep === 1;
        
        // Update Next button
        if (this.currentStep >= this.exampleData.total_steps) {
            // Last step - show Next Example or Complete
            if (this.currentExample < this.totalExamples) {
                this.elements.nextExampleButton.classList.remove('hidden');
                this.elements.nextButton.textContent = 'Continue';
            } else {
                this.elements.nextButton.textContent = 'Complete Examples';
            }
        } else {
            this.elements.nextExampleButton.classList.add('hidden');
            this.elements.nextButton.textContent = 'Next Step';
        }
    }
    
    startTypewriter(text) {
        // Clear current text
        this.elements.typewriterText.textContent = '';
        this.isTypewriting = true;
        this.elements.cursor.style.display = 'inline';
        
        // Typewriter parameters
        const speed = 50; // milliseconds per character
        let index = 0;
        
        const typeNextCharacter = () => {
            if (index < text.length && this.isTypewriting) {
                this.elements.typewriterText.textContent += text.charAt(index);
                index++;
                setTimeout(typeNextCharacter, speed);
            } else {
                // Typewriting complete
                this.isTypewriting = false;
                this.elements.cursor.style.display = 'inline'; // Keep cursor visible
            }
        };
        
        typeNextCharacter();
    }
    
    skipTypewriter() {
        this.isTypewriting = false;
        // Get the full text from current step
        if (this.exampleData && this.exampleData.steps[this.currentStep - 1]) {
            const fullText = this.exampleData.steps[this.currentStep - 1].text_content;
            this.elements.typewriterText.textContent = fullText;
        }
    }
    
    togglePause() {
        // Toggle typewriter pausing (implementation depends on how you want to handle this)
        this.isTypewriting = !this.isTypewriting;
        this.elements.pauseButton.textContent = this.isTypewriting ? '⏸️ Pause' : '▶️ Resume';
    }
    
    nextStep() {
        if (this.currentStep < this.exampleData.total_steps) {
            this.currentStep++;
            this.loadCurrentStep();
        } else if (this.currentExample < this.totalExamples) {
            // Move to next example
            this.nextExample();
        } else {
            // Complete examples
            this.completeExamples();
        }
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.loadCurrentStep();
        }
    }
    
    nextExample() {
        if (this.currentExample < this.totalExamples) {
            this.currentExample++;
            this.loadCurrentExample();
        }
    }
    
    async completeExamples() {
        try {
            const response = await fetch('/api/decimal1/examples/complete', {
                method: 'POST'
            });
            const data = await response.json();
            
            if (data.status === 'success') {
                // Redirect to practice page
                window.location.href = '/decimal1/practice';
            }
        } catch (error) {
            console.error('Error completing examples:', error);
        }
    }
    
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
        // Simple error display - you could make this more sophisticated
        alert(message);
    }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const examplePage = new RedesignedExamplePage();
});