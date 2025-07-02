/**
 * Base ExamplePage class for all example pages
 * Used to share common functionality
 */
class ExamplePage {
    constructor() {
        this.elements = {
            // First example elements
            firstExampleContainer: document.getElementById('first-example-container'),
            firstExampleContent: document.getElementById('first-example-content'),
            firstExampleQuestion: document.getElementById('first-example-question'),
            stepsContainer1: document.getElementById('steps-container-1'),
            nextStepButton1: document.getElementById('next-step-button-1'),
            
            // Second example elements
            secondExampleColumn: document.getElementById('second-example-column'),
            secondExampleContainer: document.getElementById('second-example-container'),
            secondExampleContent: document.getElementById('second-example-content'),
            secondExampleQuestion: document.getElementById('second-example-question'),
            stepsContainer2: document.getElementById('steps-container-2'),
            nextStepButton2: document.getElementById('next-step-button-2'),
            
            // Other UI elements
            loadingElement: document.getElementById('loading'),
            resetButton: document.getElementById('reset-button')
        };

        // State Management
        this.state = {
            firstExample: {
                data: null,
                currentStep: 0,
                totalSteps: 3
            },
            secondExample: {
                data: null,
                currentStep: 0,
                totalSteps: 3
            }
        };

        // Bind methods
        this.handleNextStep = this.handleNextStep.bind(this);
        this.addStep = this.addStep.bind(this);
        this.scrollToLatestStep = this.scrollToLatestStep.bind(this);
        this.resetLesson = this.resetLesson.bind(this);
    }

    // Initialize event listeners
    initEventListeners() {
        if (this.elements.nextStepButton1) {
            this.elements.nextStepButton1.addEventListener('click', () => this.handleNextStep('first'));
        }

        if (this.elements.nextStepButton2) {
            this.elements.nextStepButton2.addEventListener('click', () => this.handleNextStep('second'));
        }

        if (this.elements.resetButton) {
            this.elements.resetButton.addEventListener('click', this.resetLesson);
        }
    }

    // Handle next step button click
    handleNextStep(exampleType) {
        const example = this.state[`${exampleType}Example`];
        const stepsContainer = this.elements[`stepsContainer${exampleType === 'first' ? '1' : '2'}`];
        
        // Increment the current step
        example.currentStep++;
        
        // If there are more steps to show
        if (example.currentStep < example.totalSteps) {
            // Add the next step
            this.addStep(stepsContainer, example.data.steps[example.currentStep], example.currentStep + 1);
            
            // Scroll to the new step
            this.scrollToLatestStep(stepsContainer);
        }
        
        // Update button text or action based on progress
        this.updateButtonState(exampleType);
    }

    // Add a step to the steps container
    addStep(container, stepData, stepNumber) {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step mb-4 bg-white rounded shadow-sm fade-in';
        
        // Create step header
        const stepLabel = document.createElement('h4');
        stepLabel.className = 'text-md font-semibold mb-3 text-blue-600';
        stepLabel.textContent = `Step ${stepNumber}`;
        stepDiv.appendChild(stepLabel);
        
        // Create image container if there's an image
        if (stepData.image) {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'flex justify-center items-center';
            
            const img = document.createElement('img');
            img.src = stepData.image;
            img.alt = `Step ${stepNumber}`;
            img.className = 'rounded-md step-image';
            
            imgContainer.appendChild(img);
            stepDiv.appendChild(imgContainer);
        }
        
        // Add explanation text
        const explanationDiv = document.createElement('div');
        explanationDiv.className = 'step-explanation mt-4 p-3 bg-gray-50 rounded-md';
        explanationDiv.textContent = stepData.explanation;
        
        stepDiv.appendChild(explanationDiv);
        container.appendChild(stepDiv);
    }

    // Scroll to the latest step
    scrollToLatestStep(container) {
        setTimeout(() => {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }, 50);
    }

    // Update button state
    updateButtonState(exampleType) {
        // This method should be implemented by subclasses
        console.warn('updateButtonState() not implemented');
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
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-center py-12 text-red-600';
        errorDiv.innerHTML = `<p>${message}</p>`;
        
        document.querySelector('.container').appendChild(errorDiv);
    }
}

// Make the ExamplePage class available globally
window.ExamplePage = ExamplePage;