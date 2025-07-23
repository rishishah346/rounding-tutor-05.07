animateImageTransition(container, oldImage, newImage, goingForward = true) {
    // Ensure old image is properly positioned for exit animation
    oldImage.style.position = 'absolute';
    oldImage.style.top = '0';
    oldImage.style.left = '0';
    oldImage/**
* Redesigned Decimal1 Examples Page with Separated Content - ANIMATION FIX
* File: static/js/pages/decimal1_examples_redesigned.js
*/

class RedesignedExamplePage {
constructor() {
    this.currentExample = 1;
    this.currentStep = 1;
    this.totalExamples = 2;
    this.exampleData = null;
    this.isTypewriting = false;
    this.typewriterTimeout = null;
    this.lastStep = 1; // Track previous step for animation direction
    
    this.initializeElements();
    this.initializeEventListeners();
    this.loadCurrentExample();
}

initializeElements() {
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
        
        // Example tracking
        currentExampleSpan: document.getElementById('current-example'),
        totalExamplesSpan: document.getElementById('total-examples'),
        
        // Loading
        loading: document.getElementById('loading')
    };
}

initializeEventListeners() {
    // Navigation buttons
    this.elements.nextButton?.addEventListener('click', () => this.nextStep());
    this.elements.prevButton?.addEventListener('click', () => this.prevStep());
    this.elements.nextExampleButton?.addEventListener('click', () => this.nextExample());
    
    // Reset button
    document.getElementById('reset-button')?.addEventListener('click', () => this.resetLesson());
}

async loadCurrentExample() {
    try {
        this.showLoading();
        
        const apiEndpoint = this.currentExample === 1 ? 'first' : 'second';
        const response = await fetch(`/api/decimal1/examples/${apiEndpoint}`);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        this.exampleData = data;
        this.updateExampleInfo();
        this.updateWhiteboardTitle();
        
        this.currentStep = 1;
        // FIX: Reset lastStep to 0 when loading a new example to ensure forward animation
        this.lastStep = 0;
        this.loadCurrentStep();
        
    } catch (error) {
        console.error('Error loading example:', error);
        this.showError('Failed to load example. Please try again.');
    } finally {
        this.hideLoading();
    }
}

updateExampleInfo() {
    const { exampleTitle, exampleQuestion, totalSteps, currentExampleSpan, totalExamplesSpan } = this.elements;
    
    if (exampleTitle) exampleTitle.textContent = `Example ${this.currentExample}`;
    if (exampleQuestion) exampleQuestion.textContent = this.exampleData.question_text;
    if (totalSteps) totalSteps.textContent = this.exampleData.total_steps;
    if (currentExampleSpan) currentExampleSpan.textContent = this.currentExample;
    if (totalExamplesSpan) totalExamplesSpan.textContent = this.totalExamples;
}

loadCurrentStep() {
    if (!this.exampleData?.steps) {
        console.error('No example data available');
        return;
    }
    
    const stepData = this.exampleData.steps[this.currentStep - 1];
    if (!stepData) {
        console.error('Invalid step number:', this.currentStep);
        return;
    }
    
    this.updateProgress();
    this.updateWhiteboardContent(stepData.image_content);
    
    // Clean and validate text before starting typewriter
    const cleanText = this.cleanAndValidateText(stepData.text_content);
    this.startTypewriter(cleanText);
    
    this.updateNavigationButtons();
    this.updateWhiteboardTitle();
    
    // Update lastStep for next transition
    this.lastStep = this.currentStep;
}

// Clean and validate text function
cleanAndValidateText(text) {
    if (!text || typeof text !== 'string') {
        console.warn('Invalid text provided to typewriter:', text);
        return 'Step explanation loading...';
    }
    
    // Remove any null characters, control characters, or other problematic characters
    let cleanText = text.replace(/[\x00-\x08\x0E-\x1F\x7F]/g, '');
    
    // Ensure the text is properly encoded
    try {
        // Decode any HTML entities
        const tempElement = document.createElement('div');
        tempElement.innerHTML = cleanText;
        cleanText = tempElement.textContent || tempElement.innerText || cleanText;
    } catch (e) {
        console.warn('Could not decode HTML entities:', e);
    }
    
    // Fallback text if cleaning resulted in empty or very short text
    if (!cleanText || cleanText.trim().length < 5) {
        console.warn('Text too short after cleaning, using fallback');
        return this.getFallbackText(this.currentStep);
    }
    
    return cleanText.trim();
}

// Fallback text for each step
getFallbackText(stepNumber) {
    const fallbackTexts = {
        1: "Identify the digit in the 1st decimal place. This is the first digit after the decimal point. We will call it the \"rounding digit\".",
        2: "Check the digit to the right of the \"cut off\" line. If this digit is less than 5 we keep our rounding digit the same.",
        3: "Remove all digits after the \"cut off\" line. We have now rounded the number to 1 decimal place."
    };
    
    return fallbackTexts[stepNumber] || "Step explanation is loading...";
}

updateWhiteboardContent(imageContent) {
    // Hide math display elements
    if (this.elements.mathDisplay) this.elements.mathDisplay.style.display = 'none';
    if (this.elements.mathAnnotation) this.elements.mathAnnotation.style.display = 'none';

    const whiteboardContent = document.getElementById('whiteboard-content');
    if (!whiteboardContent) return;
    
    // Get or create example display container
    let exampleDisplay = document.getElementById('example-display');
    if (!exampleDisplay) {
        exampleDisplay = document.createElement('div');
        exampleDisplay.id = 'example-display';
        whiteboardContent.appendChild(exampleDisplay);
    }
    
    // Handle image loading and animation
    this.loadStepImage(exampleDisplay, imageContent);
}

loadStepImage(container, imageContent) {
    const existingImage = container.querySelector('#step-image');
    const imageElement = this.createImageElement();
    
    const imagePath = `/static/images/stage1_${this.currentExample}_step${this.currentStep}.jpg`;
    imageElement.src = imagePath;
    imageElement.alt = `Step ${this.currentStep} - Example ${this.currentExample}`;
    
    // FIX: Determine animation direction based on step movement
    // When going to a new example (lastStep was reset to 0), always animate forward
    // When going to previous example (lastStep was set to 999), always animate backward
    const goingForward = (this.currentStep > this.lastStep) || (this.lastStep === 0);
    
    console.log(`Animation direction: ${goingForward ? 'forward' : 'backward'} (currentStep: ${this.currentStep}, lastStep: ${this.lastStep})`);
    
    imageElement.onload = () => {
        if (existingImage) {
            this.animateImageTransition(container, existingImage, imageElement, goingForward);
        } else {
            imageElement.id = 'step-image';
            this.resetImageStyles(imageElement);
            container.appendChild(imageElement);
        }
    };
    
    imageElement.onerror = () => {
        console.error(`Failed to load image: ${imagePath}`);
        this.showFallbackContent(container, imageContent);
    };
    
    // Start loading
    if (existingImage) {
        this.prepareImageForTransition(imageElement, goingForward);
        container.appendChild(imageElement);
    } else {
        container.appendChild(imageElement);
    }
}

createImageElement() {
    const img = document.createElement('img');
    Object.assign(img.style, {
        width: 'auto',
        height: 'auto',
        maxWidth: '600px',
        maxHeight: '450px',
        objectFit: 'contain',
        display: 'block'
    });
    return img;
}

prepareImageForTransition(imageElement, goingForward) {
    imageElement.id = 'step-image-new';
    
    // Set initial position based on direction BEFORE adding transition
    const initialTransform = goingForward ? 'translateY(100%)' : 'translateY(-100%)';
    
    Object.assign(imageElement.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        margin: 'auto',
        transform: initialTransform,
        opacity: '0',
        transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out'
    });
}

resetImageStyles(imageElement) {
    Object.assign(imageElement.style, {
        position: 'static',
        transform: 'none',
        opacity: '1',
        transition: 'none'
    });
}

animateImageTransition(container, oldImage, newImage, goingForward = true) {
    oldImage.style.transition = 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out';
    
    // Force reflow to ensure initial position is set
    container.offsetHeight;
    
    // Animate: old image exits in correct direction, new image enters
    if (goingForward) {
        oldImage.style.transform = 'translateY(-100%)'; // Exit upward
        newImage.style.transform = 'translateY(0)'; // Enter from bottom
    } else {
        oldImage.style.transform = 'translateY(100%)'; // Exit downward  
        newImage.style.transform = 'translateY(0)'; // Enter from top
    }
    
    oldImage.style.opacity = '0';
    newImage.style.opacity = '1';
    
    // Cleanup after animation
    setTimeout(() => {
        oldImage.remove();
        newImage.id = 'step-image';
        this.resetImageStyles(newImage);
    }, 500);
}

showFallbackContent(container, imageContent) {
    const fallbackDiv = document.createElement('div');
    fallbackDiv.innerHTML = `
        <div style="font-family: 'Courier New', monospace; font-size: 3rem; font-weight: bold; color: #1f2937; margin-bottom: 1rem;">
            ${imageContent?.display_text || 'Image not found'}
        </div>
        <div style="font-size: 0.875rem; color: #dc2626; font-weight: 500;">
            ${imageContent?.annotation || 'Could not load step image'}
        </div>
    `;
    container.innerHTML = '';
    container.appendChild(fallbackDiv);
}

updateWhiteboardTitle() {
    const mainWhiteboard = document.getElementById('main-whiteboard');
    if (!mainWhiteboard) return;
    
    let titleContainer = document.getElementById('whiteboard-title');
    if (!titleContainer) {
        titleContainer = document.createElement('div');
        titleContainer.id = 'whiteboard-title';
        mainWhiteboard.appendChild(titleContainer);
    }
    
    const exampleTitle = `Example ${this.currentExample}`;
    const questionText = this.exampleData?.question_text || 'Loading...';
    
    titleContainer.innerHTML = `
        <h2>${exampleTitle}</h2>
        <p>${questionText}</p>
    `;
}

updateProgress() {
    if (!this.exampleData) return;
    
    const progressPercent = (this.currentStep / this.exampleData.total_steps) * 100;
    
    if (this.elements.progressBar) this.elements.progressBar.style.width = `${progressPercent}%`;
    if (this.elements.currentStep) this.elements.currentStep.textContent = this.currentStep;
    if (this.elements.progressPercentage) this.elements.progressPercentage.textContent = `${Math.round(progressPercent)}%`;
    
    this.updateStepList();
}

updateStepList() {
    const stepItems = this.elements.stepList?.querySelectorAll('.step-item');
    if (!stepItems) return;
    
    stepItems.forEach((item, index) => {
        const stepNumber = index + 1;
        const indicator = item.querySelector('.step-indicator');
        const text = item.querySelector('span');
        
        if (stepNumber < this.currentStep) {
            this.setStepState(item, indicator, text, 'completed');
        } else if (stepNumber === this.currentStep) {
            this.setStepState(item, indicator, text, 'active');
        } else {
            this.setStepState(item, indicator, text, 'future');
        }
    });
}

setStepState(item, indicator, text, state) {
    const states = {
        completed: {
            itemClass: 'step-item completed',
            indicatorClass: 'step-indicator w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-semibold',
            textClass: 'text-sm text-gray-700'
        },
        active: {
            itemClass: 'step-item active',
            indicatorClass: 'step-indicator w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold',
            textClass: 'text-sm text-gray-700'
        },
        future: {
            itemClass: 'step-item',
            indicatorClass: 'step-indicator w-6 h-6 rounded-full bg-gray-300 text-gray-600 text-xs flex items-center justify-center',
            textClass: 'text-sm text-gray-500'
        }
    };
    
    const config = states[state];
    item.className = config.itemClass;
    if (indicator) indicator.className = config.indicatorClass;
    if (text) text.className = config.textClass;
}

updateNavigationButtons() {
    // Update Previous button
    if (this.elements.prevButton) {
        const isAtVeryBeginning = (this.currentStep === 1 && this.currentExample === 1);
        const isAtFirstStepOfLaterExample = (this.currentStep === 1 && this.currentExample > 1);
        
        this.elements.prevButton.disabled = isAtVeryBeginning;
        
        if (isAtFirstStepOfLaterExample) {
            this.elements.prevButton.textContent = 'Previous Example';
        } else {
            this.elements.prevButton.textContent = 'Previous Step';
        }
    }
    
    // Update Next button and Next Example button
    if (this.currentStep >= this.exampleData.total_steps) {
        if (this.currentExample < this.totalExamples) {
            // At the last step of an example that's not the final example
            // Hide the redundant green button, but keep the logic the same
            this.elements.nextExampleButton?.classList.add('hidden');
            if (this.elements.nextButton) this.elements.nextButton.textContent = 'Next Example';
        } else {
            // At the last step of the final example
            this.elements.nextExampleButton?.classList.add('hidden');
            if (this.elements.nextButton) this.elements.nextButton.textContent = 'Continue';
        }
    } else {
        // Not at the last step of current example
        this.elements.nextExampleButton?.classList.add('hidden');
        if (this.elements.nextButton) this.elements.nextButton.textContent = 'Next Step';
    }
}

startTypewriter(text) {
    if (!this.elements.typewriterText || !this.elements.cursor) {
        console.warn('Typewriter elements not found');
        return;
    }
    
    // Stop any existing typewriter
    this.stopTypewriter();
    
    // Validate and clean text one more time
    const finalText = this.cleanAndValidateText(text);
    if (!finalText) {
        console.error('No valid text for typewriter');
        return;
    }
    
    console.log('Starting typewriter with text:', finalText.substring(0, 50) + '...');
    
    this.elements.typewriterText.textContent = '';
    this.isTypewriting = true;
    this.elements.cursor.style.display = 'inline';
    
    let index = 0;
    const speed = 50;
    
    const typeNextCharacter = () => {
        if (index < finalText.length && this.isTypewriting) {
            // Get the character and ensure it's valid
            const char = finalText.charAt(index);
            if (char) {
                this.elements.typewriterText.textContent += char;
            }
            index++;
            this.typewriterTimeout = setTimeout(typeNextCharacter, speed);
        } else {
            this.isTypewriting = false;
            this.elements.cursor.style.display = 'inline';
            console.log('Typewriter completed');
        }
    };
    
    typeNextCharacter();
}

// Stop typewriter function
stopTypewriter() {
    this.isTypewriting = false;
    if (this.typewriterTimeout) {
        clearTimeout(this.typewriterTimeout);
        this.typewriterTimeout = null;
    }
}

// Navigation methods
nextStep() {
    this.lastStep = this.currentStep; // Track where we came from
    if (this.currentStep < this.exampleData.total_steps) {
        this.currentStep++;
        this.loadCurrentStep();
    } else if (this.currentExample < this.totalExamples) {
        this.nextExample();
    } else {
        this.completeExamples();
    }
}

prevStep() {
    this.lastStep = this.currentStep; // Track where we came from
    if (this.currentStep > 1) {
        // Go back one step within current example
        this.currentStep--;
        this.loadCurrentStep();
    } else if (this.currentExample > 1) {
        // Go back to previous example (last step)
        this.currentExample--;
        this.loadPreviousExample();
    }
    // If we're at step 1 of example 1, button will be disabled
}

nextExample() {
    if (this.currentExample < this.totalExamples) {
        this.currentExample++;
        this.loadCurrentExample(); // This will reset lastStep to 0 for proper forward animation
    }
}

async loadPreviousExample() {
    try {
        this.showLoading();
        
        const apiEndpoint = this.currentExample === 1 ? 'first' : 'second';
        const response = await fetch(`/api/decimal1/examples/${apiEndpoint}`);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        this.exampleData = data;
        this.updateExampleInfo();
        this.updateWhiteboardTitle();
        
        // FIX: Set lastStep to a high number to force backward animation when going to previous example
        this.lastStep = 999; // Force backward animation
        this.currentStep = this.exampleData.total_steps;
        this.loadCurrentStep();
        
    } catch (error) {
        console.error('Error loading previous example:', error);
        this.showError('Failed to load previous example. Please try again.');
    } finally {
        this.hideLoading();
    }
}

async completeExamples() {
    try {
        const response = await fetch('/api/decimal1/examples/complete', { method: 'POST' });
        const data = await response.json();
        
        if (data.status === 'success') {
            window.location.href = '/decimal1/practice';
        }
    } catch (error) {
        console.error('Error completing examples:', error);
    }
}

resetLesson() {
    // Stop typewriter before resetting
    this.stopTypewriter();
    
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
    alert(message);
}
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
new RedesignedExamplePage();
});