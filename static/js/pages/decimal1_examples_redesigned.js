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
            // REMOVED: pauseButton and skipButton references
            
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
        
        // REMOVED: Typewriter controls event listeners
        
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
        // Hide the math display and annotation text elements
        this.elements.mathDisplay.style.display = 'none';
        this.elements.mathAnnotation.style.display = 'none';

        // Get the whiteboard content container
        const whiteboardContent = document.getElementById('whiteboard-content');
        
        // Create or update the title inside the whiteboard
        this.updateWhiteboardTitle();
        
        // Get or create the example-display div (the centered container)
        let exampleDisplay = document.getElementById('example-display');
        if (!exampleDisplay) {
            exampleDisplay = document.createElement('div');
            exampleDisplay.id = 'example-display';
            whiteboardContent.appendChild(exampleDisplay);
        }
        
        // Check if there's an existing image to animate out
        const existingImage = exampleDisplay.querySelector('#step-image');
        
        // Create new image element
        const imageElement = document.createElement('img');
        imageElement.id = 'step-image-new'; // Temporary ID
        imageElement.style.width = 'auto';
        imageElement.style.height = 'auto';
        imageElement.style.maxWidth = '600px';
        imageElement.style.maxHeight = '450px';
        imageElement.style.objectFit = 'contain';
        imageElement.style.display = 'block';
        imageElement.style.position = 'absolute';
        imageElement.style.top = '0';
        imageElement.style.left = '0';
        imageElement.style.right = '0';
        imageElement.style.bottom = '0';
        imageElement.style.margin = 'auto';

        // Set the image source
        const stepNumber = this.currentStep;
        const exampleNumber = this.currentExample;

        let imagePath;
        if (exampleNumber === 1) {
            imagePath = `/static/images/stage1_1_step${stepNumber}.jpg`;
        } else {
            imagePath = `/static/images/stage1_2_step${stepNumber}.jpg`;
        }

        console.log(`Attempting to load image: ${imagePath}`);
        imageElement.src = imagePath;
        imageElement.alt = `Step ${stepNumber} - Example ${exampleNumber}`;
        
        imageElement.onload = () => {
            console.log(`Successfully loaded image: ${imagePath}`);
            
            if (existingImage) {
                // Animate the transition
                this.animateSlideTransition(exampleDisplay, existingImage, imageElement);
            } else {
                // First image, position it correctly and show it
                imageElement.style.position = 'static'; // Use normal positioning for centering
                imageElement.style.transform = 'none';
                imageElement.style.opacity = '1';
                imageElement.style.transition = 'none';
                imageElement.id = 'step-image'; // Change to final ID
                exampleDisplay.appendChild(imageElement);
            }
        };
        
        imageElement.onerror = () => {
            console.error(`Failed to load image: ${imagePath}`);
            // Fallback: show text if image fails to load
            const fallbackDiv = document.createElement('div');
            fallbackDiv.innerHTML = `
                <div style="font-family: 'Courier New', monospace; font-size: 3rem; font-weight: bold; color: #1f2937; margin-bottom: 1rem;">${imageContent.display_text || 'Image not found'}</div>
                <div style="font-size: 0.875rem; color: #dc2626; font-weight: 500;">${imageContent.annotation || 'Could not load step image'}</div>
            `;
            exampleDisplay.innerHTML = '';
            exampleDisplay.appendChild(fallbackDiv);
        };

        // Start loading the new image
        if (!existingImage) {
            // For first load, use normal positioning
            imageElement.style.position = 'static';
            imageElement.style.transform = 'none';
            imageElement.style.opacity = '1';
            imageElement.style.transition = 'none';
            exampleDisplay.appendChild(imageElement);
        } else {
            // Position new image off-screen initially (it will slide in after onload)
            imageElement.style.transform = 'translateY(100%)';
            imageElement.style.opacity = '0';
            imageElement.style.transition = 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out';
            exampleDisplay.appendChild(imageElement);
        }
    }
    
    updateWhiteboardTitle() {
        const whiteboardContent = document.getElementById('whiteboard-content');
        
        // Get or create the title container
        let titleContainer = document.getElementById('whiteboard-title');
        if (!titleContainer) {
            titleContainer = document.createElement('div');
            titleContainer.id = 'whiteboard-title';
            whiteboardContent.appendChild(titleContainer);
        }
        
        // Update the title content
        const exampleTitle = `Example ${this.currentExample}`;
        const questionText = this.exampleData ? this.exampleData.question_text : '';
        
        titleContainer.innerHTML = `
            <h2>${exampleTitle}</h2>
            <p>${questionText}</p>
        `;
    }
    
    animateSlideTransition(container, oldImage, newImage) {
        // Set up the transition
        oldImage.style.transition = 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out';
        newImage.style.transition = 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out';
        
        // Force a reflow to ensure initial styles are applied
        container.offsetHeight;
        
        // Animate old image out (slide up)
        oldImage.style.transform = 'translateY(-100%)';
        oldImage.style.opacity = '0';
        
        // Animate new image in (slide up from bottom)
        newImage.style.transform = 'translateY(0)';
        newImage.style.opacity = '1';
        
        // Clean up after animation completes
        setTimeout(() => {
            if (oldImage && oldImage.parentNode) {
                oldImage.parentNode.removeChild(oldImage);
            }
            newImage.id = 'step-image'; // Change to final ID
            newImage.style.position = 'static'; // Reset positioning
            newImage.style.transition = 'none'; // Remove transition for future updates
        }, 500); // Match the transition duration
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
    
    // REMOVED: skipTypewriter() method
    // REMOVED: togglePause() method
    
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