/**
 * Decimal2 Examples Page Implementation
 */
document.addEventListener('DOMContentLoaded', function() {
    // Create the page class that extends the base ExamplePage
    class Decimal2ExamplePage extends ExamplePage {
        constructor() {
            super(); // Call parent constructor
            this.initEventListeners();
            this.initialize();
        }

        // Initialize the page
        initialize() {
            this.fetchFirstExample();
        }

        // Fetch the first example data
        fetchFirstExample() {
            this.showLoading();
            
            // Fetch the first example data
            fetch('/api/decimal2/examples/first')
                .then(response => response.json())
                .then(data => {
                    this.hideLoading();
                    
                    // Store the data
                    this.state.firstExample.data = data;
                    
                    // Display the first example
                    this.displayFirstExample(data);
                })
                .catch(error => {
                    console.error('Error fetching first example:', error);
                    this.displayError('Something went wrong. Please try refreshing the page.');
                });
        }

        // Display the first example
        displayFirstExample(data) {
            // Set question text
            if (this.elements.firstExampleQuestion) {
                this.elements.firstExampleQuestion.textContent = data.question_text;
            }
            
            // Add the first step
            if (this.elements.stepsContainer1) {
                this.addStep(this.elements.stepsContainer1, data.steps[0], 1);
            }
        }

        // Update button state based on example progress
        updateButtonState(exampleType) {
            const example = this.state[`${exampleType}Example`];
            const button = this.elements[`nextStepButton${exampleType === 'first' ? '1' : '2'}`];
            
            // If we're at the last step
            if (example.currentStep >= example.totalSteps - 1) {
                if (exampleType === 'first') {
                    // Change to "Continue to Next Example"
                    button.textContent = "Continue to Next Example";
                    button.className = 'mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-md transition-all w-full';
                    
                    // Change the click handler to load the second example
                    button.onclick = () => this.loadSecondExample();
                } else {
                    // Change to "Continue to Practice"
                    button.textContent = "Continue to Practice";
                    button.className = 'mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-md transition-all w-full';
                    
                    // Change the click handler to navigate to practice
                    button.onclick = () => this.navigateToPractice();
                }
            }
        }

        // Load the second example
        loadSecondExample() {
            this.showLoading();
            
            // Disable the button to prevent double-clicks
            if (this.elements.nextStepButton1) {
                this.elements.nextStepButton1.disabled = true;
            }
            
            // Fetch the second example data
            fetch('/api/decimal2/examples/second')
                .then(response => response.json())
                .then(data => {
                    this.hideLoading();
                    
                    // Store the data
                    this.state.secondExample.data = data;
                    
                    // Display the second example
                    this.displaySecondExample(data);
                })
                .catch(error => {
                    console.error('Error fetching second example:', error);
                    this.displayError('Something went wrong. Please try refreshing the page.');
                });
        }

        // Display the second example
        displaySecondExample(data) {
            // Make the second example column visible
            if (this.elements.secondExampleColumn) {
                this.elements.secondExampleColumn.classList.remove('hidden');
            }
            
            // Set question text
            if (this.elements.secondExampleQuestion) {
                this.elements.secondExampleQuestion.textContent = data.question_text;
            }
            
            // Add the first step
            if (this.elements.stepsContainer2) {
                this.addStep(this.elements.stepsContainer2, data.steps[0], 1);
            }
            
            // Initialize button state
            this.updateButtonState('second');
        }

        // Navigate to practice page
        navigateToPractice() {
            // Disable the button to prevent double-clicks
            this.elements.nextStepButton2.disabled = true;
            
            // Make API call to update session state
            fetch('/api/decimal2/examples/complete', {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                // Redirect to practice page
                window.location.href = '/decimal23/practice';
            })
            .catch(error => {
                console.error('Error completing examples:', error);
                this.displayError('Something went wrong. Please try refreshing the page.');
            });
        }
    }

    // Initialize the page
    const decimal2ExamplePage = new Decimal2ExamplePage();
});