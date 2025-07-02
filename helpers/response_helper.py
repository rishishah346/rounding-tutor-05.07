"""Helper functions for formatting API responses."""
from flask import jsonify

def format_example_response(learning_sequence, example_question, explanation):
    """Format response for an example step."""
    return jsonify({
        'step_type': 'model',
        'stage': learning_sequence.get_current_stage(),
        'example_number': learning_sequence.current_example,
        'question': example_question,
        'explanation': explanation,
        'is_example': True
    })

def format_practice_response(learning_sequence, formatted_question):
    """Format response for a practice question."""
    return jsonify({
        'step_type': 'practice',
        'stage': learning_sequence.get_current_stage(),
        'question': formatted_question,
        'is_example': False
    })

def format_complete_response():
    """Format response for lesson completion."""
    return jsonify({
        'step_type': 'complete',
        'message': "Congratulations! You've completed all the stages in this lesson."
    })

def format_error_response(error):
    """Format error response."""
    return jsonify({'error': str(error)}), 500
