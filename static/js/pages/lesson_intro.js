/**
 * Lesson Intro JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if the user is in the right stage
    // If not, redirect to the appropriate page based on their progress
    fetch('/api/current-stage')
        .then(response => response.json())
        .then(data => {
            if (data.redirect) {
                window.location.href = data.redirect;
            }
        })
        .catch(error => {
            console.error('Error checking current stage:', error);
        });
});