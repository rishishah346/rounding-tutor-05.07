/**
 * Common JavaScript functions used across multiple pages
 */

// Reset the lesson
function resetLesson() {
    fetch('/api/reset', {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'reset' && data.redirect) {
            // Redirect to the index page
            window.location.href = data.redirect;
        } else {
            console.error('Invalid reset response:', data);
        }
    })
    .catch(error => {
        console.error('Error resetting lesson:', error);
        // Fallback: redirect to index page even if there's an error
        window.location.href = '/';
    });
}

// Display error message
function displayError(message, targetElement) {
    const errorElement = document.createElement('div');
    errorElement.className = 'text-center py-12 text-red-600';
    errorElement.innerHTML = `<p>${message}</p>`;
    
    if (targetElement) {
        targetElement.innerHTML = '';
        targetElement.appendChild(errorElement);
    } else {
        console.error(message);
    }
}

// Add event listener after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize reset button if it exists
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
        resetButton.addEventListener('click', resetLesson);
    }
});