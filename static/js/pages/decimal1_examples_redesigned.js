/**
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
        this.isTransitioning = false; // NEW: Prevent rapid clicks during transitions
        this.lastTitleContent = null; // Track title content changes for animation
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadCurrentExample();
    }
    
    initializeElements() {
        this.elements = {
            // Progress elements - simplified
            progressBar: document.getElementById('progress-bar'),
            progressPercentage: document.getElementById('progress-percentage'),
            
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
        // Navigation buttons with debouncing
        this.elements.nextButton?.addEventListener('click', () => this.debouncedNextStep());
        this.elements.prevButton?.addEventListener('click', () => this.debouncedPrevStep());
        this.elements.nextExampleButton?.addEventListener('click', () => this.nextExample());
        
        // Reset button
        document.getElementById('reset-button')?.addEventListener('click', () => this.resetLesson());
    }
    
    // NEW: Debounced navigation methods to prevent rapid clicking
    debouncedNextStep() {
        if (this.isTransitioning) {
            console.log('Transition in progress, ignoring click');
            return;
        }
        console.log('Next step clicked');
        this.nextStep();
    }
    
    debouncedPrevStep() {
        if (this.isTransitioning) {
            console.log('Transition in progress, ignoring click');
            return;
        }
        console.log('Previous step clicked');
        this.prevStep();
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
        const { exampleTitle, exampleQuestion, currentExampleSpan, totalExamplesSpan } = this.elements;
        
        if (exampleTitle) exampleTitle.textContent = `Example ${this.currentExample}`;
        if (exampleQuestion) exampleQuestion.textContent = this.exampleData.question_text;
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
        
        // Update whiteboard title (this will animate if content changed)
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
        // NEW: Prevent multiple simultaneous transitions
        if (this.isTransitioning) {
            console.log('Transition already in progress, skipping');
            return;
        }
        
        console.log('Starting image transition, setting isTransitioning = true');
        this.isTransitioning = true;
        
        // FIXED: Clean up any orphaned images first
        this.cleanupOrphanedImages(container);
        
        const existingImage = container.querySelector('#step-image');
        const imageElement = this.createImageElement();
        
        const imagePath = `/static/images/stage1_${this.currentExample}_step${this.currentStep}.jpg`;
        imageElement.src = imagePath;
        imageElement.alt = `Step ${this.currentStep} - Example ${this.currentExample}`;
        
        // FIX: Determine animation direction based on step movement
        const goingForward = (this.currentStep > this.lastStep) || (this.lastStep === 0);
        
        console.log(`Animation direction: ${goingForward ? 'forward' : 'backward'} (currentStep: ${this.currentStep}, lastStep: ${this.lastStep})`);
        
        imageElement.onload = () => {
            if (existingImage) {
                this.animateImageTransition(container, existingImage, imageElement, goingForward);
            } else {
                imageElement.id = 'step-image';
                this.resetImageStyles(imageElement);
                container.appendChild(imageElement);
                console.log('No existing image, setting isTransitioning = false');
                this.isTransitioning = false; // Reset flag
                this.updateNavigationButtons(); // Re-enable buttons
            }
        };
        
        imageElement.onerror = () => {
            console.error(`Failed to load image: ${imagePath}`);
            this.showFallbackContent(container, imageContent);
            console.log('Image load error, setting isTransitioning = false');
            this.isTransitioning = false; // Reset flag
            this.updateNavigationButtons(); // Re-enable buttons
        };
        
        // Start loading
        if (existingImage) {
            this.prepareImageForTransition(imageElement, goingForward);
            container.appendChild(imageElement);
        } else {
            container.appendChild(imageElement);
        }
    }
    
    // NEW: Clean up any orphaned images that might be left over
    cleanupOrphanedImages(container) {
        const orphanedImages = container.querySelectorAll('img:not(#step-image)');
        orphanedImages.forEach(img => {
            console.log('Removing orphaned image:', img.id || img.className);
            img.remove();
        });
        
        // Also clean up any images with temporary IDs
        const tempImages = container.querySelectorAll('#step-image-new, #step-image-old');
        tempImages.forEach(img => {
            console.log('Removing temporary image:', img.id);
            img.remove();
        });
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
            transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
            zIndex: '10' // NEW: Ensure new image is on top
        });
    }
    
    resetImageStyles(imageElement) {
        Object.assign(imageElement.style, {
            position: 'static',
            transform: 'none',
            opacity: '1',
            transition: 'none',
            zIndex: 'auto'
        });
    }
    
    animateImageTransition(container, oldImage, newImage, goingForward = true) {
        // NEW: Give old image a temporary ID and lower z-index
        oldImage.id = 'step-image-old';
        oldImage.style.zIndex = '5';
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
        
        // FIXED: More robust cleanup after animation
        setTimeout(() => {
            // Double-check that elements still exist before manipulating them
            if (oldImage && oldImage.parentNode) {
                oldImage.remove();
            }
            
            if (newImage && newImage.parentNode) {
                newImage.id = 'step-image';
                this.resetImageStyles(newImage);
            }
            
            // Clean up any remaining orphaned images
            this.cleanupOrphanedImages(container);
            
            // Reset transition flag and re-enable buttons
            console.log('Animation completed, setting isTransitioning = false');
            this.isTransitioning = false;
            this.updateNavigationButtons(); // Re-enable buttons
            
            console.log('Animation cleanup completed');
        }, 600); // Slightly longer than animation duration to ensure completion
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
        
        const exampleTitle = `Example ${this.currentExample}`;
        const questionText = this.exampleData?.question_text || 'Loading...';
        const newContent = `${exampleTitle}: ${questionText}`;
        
        let titleContainer = document.getElementById('whiteboard-title');
        if (!titleContainer) {
            // First time creating the title - no animation needed
            titleContainer = document.createElement('div');
            titleContainer.id = 'whiteboard-title';
            titleContainer.innerHTML = `
                <h2>${exampleTitle}</h2>
                <p>${questionText}</p>
            `;
            mainWhiteboard.appendChild(titleContainer);
            this.lastTitleContent = newContent; // Store for comparison
            return;
        }
        
        // Check if content has actually changed
        if (this.lastTitleContent === newContent) {
            return; // No change, no animation needed
        }
        
        // Content has changed - animate the transition
        this.animateTitleTransition(titleContainer, exampleTitle, questionText);
        this.lastTitleContent = newContent; // Update stored content
    }
    
    animateTitleTransition(titleContainer, exampleTitle, questionText) {
        // Update the content first
        titleContainer.innerHTML = `
            <h2>${exampleTitle}</h2>
            <p>${questionText}</p>
        `;
        
        // Exaggerated bounce animation
        // Step 1: Scale up dramatically with big bounce
        titleContainer.style.transition = 'transform 0.5s cubic-bezier(0.68, -0.8, 0.265, 1.8)';
        titleContainer.style.transform = 'scale(1.4)';
        
        setTimeout(() => {
            // Step 2: Bounce back to normal size with exaggerated easing
            titleContainer.style.transition = 'transform 0.4s cubic-bezier(0.68, -0.6, 0.265, 1.6)';
            titleContainer.style.transform = 'scale(1)';
        }, 250);
        
        setTimeout(() => {
            // Step 3: Clean up transitions
            titleContainer.style.transition = 'none';
            console.log('Title exaggerated bounce animation completed');
        }, 650);
    }
    
    // Global lesson progress calculation
    calculateOverallLessonProgress() {
        // Define the lesson structure and progress mapping
        const lessonStages = {
            // Examples 1.1 and 1.2 (current page handles both)
            'example_1_1': 10,  // Example 1.1
            'example_1_2': 20,  // Example 1.2
            
            // Practice stages
            '1.1': 30,  // Practice 1.1
            '1.2': 40,  // Practice 1.2  
            '1.3': 50,  // Practice 1.3
            
            // Examples 2.1 and 2.2
            'example_2_1': 60,  // Example 2.1
            'example_2_2': 70,  // Example 2.2
            
            // Practice stages 2
            '2.1': 80,  // Practice 2.1
            '2.2': 90,  // Practice 2.2
            
            // Special stages
            'stretch': 100,
            'complete': 100
        };
        
        // Determine current stage
        let currentStageKey;
        
        // If we're on examples page, determine which example we're showing
        if (this.exampleData) {
            if (this.currentExample === 1) {
                // Example 1 - check if we've completed it
                if (this.currentStep >= this.exampleData.total_steps) {
                    currentStageKey = 'example_1_2'; // Completed example 1, moving to example 2
                } else {
                    currentStageKey = 'example_1_1'; // Still in example 1
                }
            } else if (this.currentExample === 2) {
                // Example 2
                if (this.currentStep >= this.exampleData.total_steps) {
                    currentStageKey = 'example_2_2'; // Completed example 2
                } else {
                    currentStageKey = 'example_2_1'; // Still in example 2
                }
            }
        } else {
            // If we don't have example data, default to first stage
            currentStageKey = 'example_1_1';
        }
        
        // Get base progress for current stage
        let baseProgress = lessonStages[currentStageKey] || 0;
        
        // Add micro-progress within current stage for examples
        if (this.exampleData && currentStageKey.startsWith('example_')) {
            const stepProgress = (this.currentStep - 1) / this.exampleData.total_steps;
            const stageWidth = 10; // Each example stage is worth 10%
            baseProgress = Math.max(0, baseProgress - stageWidth) + (stepProgress * stageWidth);
        }
        
        return Math.min(100, Math.max(0, baseProgress));
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
        
        // For now, we'll handle stretch mode detection differently since we don't have session access
        // This can be enhanced later when we have backend integration
        
        console.log(`Overall lesson progress: ${Math.round(overallProgress)}%`);
    }
    
    // Add stretch animation to progress bar
    addStretchAnimation() {
        if (this.elements.progressBar) {
            this.elements.progressBar.classList.add('stretch-pulse');
        }
    }
    
    // Remove stretch animation from progress bar
    removeStretchAnimation() {
        if (this.elements.progressBar) {
            this.elements.progressBar.classList.remove('stretch-pulse');
        }
    }
    
    // Simplified step list update (removed since we're removing step indicators)
    updateStepList() {
        // Remove step list functionality as we're simplifying the progress bar
        // The overall lesson progress is now shown instead
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
            
            // Only disable if at beginning OR during transition
            this.elements.prevButton.disabled = isAtVeryBeginning || this.isTransitioning;
            
            if (isAtFirstStepOfLaterExample && !this.isTransitioning) {
                this.elements.prevButton.textContent = 'Previous Example';
            } else if (!this.isTransitioning) {
                this.elements.prevButton.textContent = 'Previous Step';
            }
        }
        
        // Update Next button and Next Example button
        if (this.elements.nextButton) {
            // Only disable during transitions, not based on step position
            this.elements.nextButton.disabled = this.isTransitioning;
            
            if (!this.isTransitioning) {
                if (this.currentStep >= this.exampleData.total_steps) {
                    if (this.currentExample < this.totalExamples) {
                        // At the last step of an example that's not the final example
                        this.elements.nextExampleButton?.classList.add('hidden');
                        this.elements.nextButton.textContent = 'Next Example';
                    } else {
                        // At the last step of the final example
                        this.elements.nextExampleButton?.classList.add('hidden');
                        this.elements.nextButton.textContent = 'Continue';
                    }
                } else {
                    // Not at the last step of current example
                    this.elements.nextExampleButton?.classList.add('hidden');
                    this.elements.nextButton.textContent = 'Next Step';
                }
            }
        }
        
        console.log(`Buttons updated - isTransitioning: ${this.isTransitioning}, nextButton.disabled: ${this.elements.nextButton?.disabled}`);
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
        const speed = 25; // Reduced from 50ms to 25ms for faster typing
        
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