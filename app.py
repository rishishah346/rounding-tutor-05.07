"""
Math Tutor - Main Application
A Flask application that teaches students mathematics across multiple topics.
"""
from flask import Flask, render_template, request, jsonify, session, url_for, redirect
import os
import json
import logging
from functools import wraps
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Local imports
from config import SESSION_KEY, STAGES
from models.learning_sequence import LearningSequence
from models.question_generator import QuestionGenerator
from models.verifier import Verifier
from services.content_service import ContentService
from helpers.session_helper import prepare_session_data, load_learning_sequence_from_session
from helpers.response_helper import (
    format_example_response, 
    format_practice_response, 
    format_complete_response,
    format_error_response
)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = SESSION_KEY if 'SESSION_KEY' in globals() else os.urandom(24)

# Initialize services
learning_sequence = LearningSequence()
question_generator = QuestionGenerator()
verifier = Verifier()
content_service = ContentService()

# Error handler decorator
def handle_errors(f):
    """Decorator to handle errors in route handlers."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error in {f.__name__}: {e}", exc_info=True)
            return format_error_response(e)
    return decorated_function

# Session setup
@app.before_request
def before_request():
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())

# ==========================================
# MAIN NAVIGATION ROUTES
# ==========================================

@app.route('/')
def index():
    """Homepage with topic selection."""
    # Clear any existing session to start fresh
    session.clear()
    return render_template('pages/topic_selection.html')

# Topic redirect routes
@app.route('/rounding')
def rounding_home():
    """Redirect to rounding introduction."""
    return redirect(url_for('rounding_intro'))

@app.route('/fractions')
def fractions_home():
    """Redirect to fractions introduction."""
    return redirect(url_for('fractions_intro'))

# ==========================================
# ROUNDING TOPIC ROUTES
# ==========================================

@app.route('/rounding/intro')
def rounding_intro():
    """Rounding lesson introduction page."""
    # Set topic in session
    session['current_topic'] = 'rounding'
    
    # Reset the learning sequence when starting the intro
    learning_sequence.reset()
    session.clear()
    session['current_topic'] = 'rounding'  # Restore topic after clear
    return render_template('pages/rounding/lesson_intro.html')

@app.route('/rounding/examples')
def rounding_examples():
    """Rounding examples page route."""
    # Ensure we're in rounding topic
    if session.get('current_topic') != 'rounding':
        return redirect(url_for('rounding_intro'))
        
    # Check if user is in the correct stage
    if 'learning_state' not in session:
        # New user, initialize the learning sequence
        learning_sequence.reset()
        learning_sequence.current_stage = STAGES["ROUNDING_1DP_NO_UP"]
        learning_sequence.showing_example = True
        learning_sequence.current_example = 1
        session['learning_state'] = prepare_session_data(learning_sequence, topic='rounding')
    elif session['learning_state']['stage'] != STAGES["ROUNDING_1DP_NO_UP"] or not session['learning_state']['showing_example']:
        # User is in the wrong stage, redirect to appropriate page
        return redirect(url_for('rounding_current_stage'))
    
    return render_template('pages/rounding/decimal1_examples.html')

@app.route('/rounding/practice')
def rounding_practice():
    """Rounding practice page route."""
    # Ensure we're in rounding topic
    if session.get('current_topic') != 'rounding':
        return redirect(url_for('rounding_intro'))
        
    # Check if user is in the correct stage
    if 'learning_state' not in session:
        return redirect(url_for('rounding_intro'))
    
    # Check the current stage and whether we're done with examples
    if session['learning_state']['showing_example']:
        return redirect(url_for('rounding_examples'))
    
    return render_template('pages/rounding/decimal1_practice.html')

@app.route('/rounding/decimal1/practice')
def rounding_decimal1_practice():
    """Decimal 1 Practice page route."""
    # Ensure we're in rounding topic
    if session.get('current_topic') != 'rounding':
        return redirect(url_for('rounding_intro'))
        
    # Check if user is in the correct stage
    if 'learning_state' not in session:
        return redirect(url_for('rounding_intro'))
    
    # Check the current stage and whether we're done with examples
    if session['learning_state']['showing_example']:
        return redirect(url_for('rounding_examples'))
    
    return render_template('pages/rounding/decimal1_practice.html')

@app.route('/rounding/decimal2/examples')
def rounding_decimal2_examples():
    """Decimal 2 Examples page route for rounding."""
    if session.get('current_topic') != 'rounding':
        return redirect(url_for('rounding_intro'))
        
    logger.info("Rounding decimal2 examples page requested")
    
    # Check if user is in the correct stage
    if 'learning_state' not in session:
        logger.info("No learning state found, redirecting to intro")
        return redirect(url_for('rounding_intro'))
    
    # If we're in stage 2.1 but not showing examples, redirect to practice
    if session['learning_state']['stage'] == STAGES["ROUNDING_2DP"] and not session['learning_state']['showing_example']:
        logger.info("Stage 2.1 but showing_example is False, redirecting to practice")
        return redirect(url_for('rounding_decimal2_practice'))
    
    # Set up for examples if needed - force example mode
    if session['learning_state']['stage'] == STAGES["ROUNDING_2DP"]:
        logger.info("Setting up session for stage 2.1 examples")
        learning_sequence.current_stage = STAGES["ROUNDING_2DP"]
        learning_sequence.showing_example = True
        learning_sequence.current_example = 1
        session['learning_state'] = prepare_session_data(learning_sequence, topic='rounding')
    else:
        # If not in the right stage, update to proper stage
        logger.info(f"Not in stage 2.1, currently in {session['learning_state']['stage']}")
        learning_sequence.current_stage = STAGES["ROUNDING_2DP"]
        learning_sequence.showing_example = True
        learning_sequence.current_example = 1
        session['learning_state'] = prepare_session_data(learning_sequence, topic='rounding')
    
    return render_template('pages/rounding/decimal23_examples.html')

@app.route('/rounding/decimal2/practice')
def rounding_decimal2_practice():
    """Decimal 2 Practice page route for rounding."""
    if session.get('current_topic') != 'rounding':
        return redirect(url_for('rounding_intro'))
        
    # Check if user is in the correct stage
    if 'learning_state' not in session:
        return redirect(url_for('rounding_intro'))
    
    # Check if we should be showing examples
    if session['learning_state']['stage'] == STAGES["ROUNDING_2DP"] and session['learning_state']['showing_example']:
        logger.info("Should be showing examples, redirecting to decimal2_examples")
        return redirect(url_for('rounding_decimal2_examples'))
    
    # Set up practice mode
    learning_sequence.showing_example = False
    session['learning_state'] = prepare_session_data(learning_sequence, topic='rounding')
    
    return render_template('pages/rounding/decimal23_practice.html')

@app.route('/rounding/decimal23/practice')
def rounding_decimal23_practice():
    """Decimal 2 and 3 Practice page route for rounding."""
    if session.get('current_topic') != 'rounding':
        return redirect(url_for('rounding_intro'))
        
    # Check if user is in the correct stage
    if 'learning_state' not in session:
        return redirect(url_for('rounding_intro'))
    
    # Check if we should be showing examples
    if session['learning_state']['stage'] == STAGES["ROUNDING_2DP"] and session['learning_state']['showing_example']:
        logger.info("Should be showing examples, redirecting to decimal23_examples")
        return redirect(url_for('rounding_decimal2_examples'))
    
    # Set up practice mode
    learning_sequence.showing_example = False
    session['learning_state'] = prepare_session_data(learning_sequence, topic='rounding')
    
    return render_template('pages/rounding/decimal23_practice.html')

# Routes for stretch content
@app.route('/rounding/stretch/examples')
def rounding_stretch_examples():
    """Stretch Examples page route for rounding."""
    if session.get('current_topic') != 'rounding':
        return redirect(url_for('rounding_intro'))
        
    # Check if user is in the correct stage
    if 'learning_state' not in session:
        return redirect(url_for('rounding_intro'))
    
    # If we're in stretch stage but not showing examples, redirect to practice
    if session['learning_state']['stage'] == STAGES["STRETCH"] and not session['learning_state']['showing_example']:
        return redirect(url_for('rounding_stretch_practice'))
    
    # Set up for examples if needed
    if session['learning_state']['stage'] == STAGES["STRETCH"]:
        learning_sequence.showing_example = True
        learning_sequence.current_example = 1
        session['learning_state'] = prepare_session_data(learning_sequence, topic='rounding')
    
    return render_template('pages/rounding/stretch_examples.html')

@app.route('/rounding/stretch/practice')
def rounding_stretch_practice():
    """Stretch Practice page route for rounding."""
    if session.get('current_topic') != 'rounding':
        return redirect(url_for('rounding_intro'))
        
    # Check if user is in the correct stage
    if 'learning_state' not in session:
        return redirect(url_for('rounding_intro'))
    
    # Check if we should be showing examples
    if session['learning_state']['stage'] == STAGES["STRETCH"] and session['learning_state']['showing_example']:
        return redirect(url_for('rounding_stretch_examples'))
    
    return render_template('pages/rounding/stretch_practice.html')

@app.route('/rounding/complete')
def rounding_complete():
    """Rounding lesson completion page."""
    if session.get('current_topic') != 'rounding':
        return redirect(url_for('rounding_intro'))
        
    # Check if user has actually completed the lesson
    if 'learning_state' not in session or session['learning_state']['stage'] != STAGES["COMPLETE"]:
        return redirect(url_for('rounding_intro'))
    
    return render_template('pages/rounding/complete.html')

# ==========================================
# FRACTIONS TOPIC ROUTES (Placeholder)
# ==========================================

@app.route('/fractions/intro')
def fractions_intro():
    """Fractions lesson introduction page."""
    # Set topic in session
    session['current_topic'] = 'fractions'
    
    # For now, show a placeholder - we'll implement this in Phase 2
    return render_template('pages/fractions/coming_soon.html')

@app.route('/fractions/examples')
def fractions_examples():
    """Fractions examples page route."""
    if session.get('current_topic') != 'fractions':
        return redirect(url_for('fractions_intro'))
    
    # Placeholder for Phase 2
    return render_template('pages/fractions/coming_soon.html')

@app.route('/fractions/practice') 
def fractions_practice():
    """Fractions practice page route."""
    if session.get('current_topic') != 'fractions':
        return redirect(url_for('fractions_intro'))
    
    # Placeholder for Phase 2
    return render_template('pages/fractions/coming_soon.html')

# ==========================================
# SHARED API ROUTES (Topic-aware)
# ==========================================

@app.route('/api/next-step', methods=['GET'])
@handle_errors
def next_step():
    """API endpoint to get the next learning step."""
    current_topic = session.get('current_topic', 'rounding')
    
    if current_topic == 'rounding':
        return rounding_next_step()
    elif current_topic == 'fractions':
        # Placeholder for Phase 2
        return jsonify({'redirect': url_for('fractions_intro')})
    else:
        return jsonify({'redirect': url_for('index')})

def rounding_next_step():
    """Handle next step logic for rounding topic."""
    logger.info("--- ROUNDING NEXT STEP REQUEST ---")
    
    # Load or create learning sequence from session
    current_sequence = load_learning_sequence_from_session(learning_sequence, topic='rounding')
    logger.debug(f"Current stage: {current_sequence.get_current_stage()}")
    
    # Get current stage details
    current_stage = current_sequence.get_current_stage()
    
    # Check if we've reached the end of the lesson
    if current_stage == STAGES["COMPLETE"]:
        logger.info("Lesson complete, returning completion message")
        return format_complete_response()
    
    stage_rules = current_sequence.get_stage_rules()
    
    # Check if we should model an example
    should_model = current_sequence.should_model_example()
    logger.debug(f"Should model: {should_model}")
    
    if should_model:
        return serve_rounding_example(current_sequence, stage_rules)
    else:
        return serve_rounding_practice_question(current_sequence, stage_rules)

def serve_rounding_example(current_sequence, stage_rules):
    """Redirect to appropriate rounding examples page."""
    logger.info(f"Redirecting for rounding example #{current_sequence.current_example}")
    
    # Update session state
    session['learning_state'] = prepare_session_data(current_sequence, topic='rounding')
    
    # Redirect to the appropriate examples page based on stage
    if current_sequence.current_stage == STAGES["ROUNDING_1DP_NO_UP"]:
        return jsonify({'redirect': url_for('rounding_examples')})
    elif current_sequence.current_stage == STAGES["ROUNDING_2DP"]:
        if session['learning_state']['showing_example']:
            return jsonify({'redirect': url_for('rounding_decimal2_examples')})
        else:
            return jsonify({'redirect': url_for('rounding_decimal23_practice')})
    elif current_sequence.current_stage == STAGES["STRETCH"]:
        return jsonify({'redirect': url_for('rounding_stretch_examples')})
    else:
        return jsonify({'redirect': url_for('rounding_practice')})

def serve_rounding_practice_question(current_sequence, stage_rules):
    """Generate and serve a rounding practice question."""
    logger.info("Returning rounding practice question")
    
    question = question_generator.generate_question(stage_rules, current_sequence)
    formatted_question = question_generator.format_multiple_choice(question)
    
    # Store the question in session for verification later
    session['current_question'] = json.dumps(formatted_question)
    
    # Update session
    session['learning_state'] = prepare_session_data(current_sequence, topic='rounding')
    
    return format_practice_response(current_sequence, formatted_question)

@app.route('/api/verify-answer', methods=['POST'])
@handle_errors
def verify_answer():
    """API endpoint to verify a student's answer."""
    current_topic = session.get('current_topic', 'rounding')
    
    if current_topic == 'rounding':
        return verify_rounding_answer()
    elif current_topic == 'fractions':
        # Placeholder for Phase 2
        return jsonify({'error': 'Fractions not implemented yet'}), 400
    else:
        return jsonify({'error': 'Unknown topic'}), 400

def verify_rounding_answer():
    """Verify answer for rounding topic."""
    # Get the student's answer
    data = request.json
    student_answer = data.get('answer')
    logger.info(f"Received rounding answer: {student_answer}")
    
    # Store the current stage before any updates
    old_stage = learning_sequence.current_stage
    old_consecutive = learning_sequence.consecutive_correct
    
    # Retrieve the current question from session
    if 'current_question' not in session:
        return jsonify({'error': 'No active question found'}), 400
        
    current_question = json.loads(session['current_question'])
    
    # Add the student's answer to the question dict
    current_question["student_answer"] = student_answer
    
    # Verify the answer
    is_correct, verification_steps, misconception = verifier.verify_answer(
        current_question,
        student_answer
    )
    
    # CRITICAL FIX: Ensure verification steps use the correct question data
    if verification_steps["original_number"] != current_question["original_question"]["number"]:
        logger.error(f"MISMATCH: Verification steps use {verification_steps['original_number']} but question is {current_question['original_question']['number']}")
        verification_steps["original_number"] = current_question["original_question"]["number"]
    
    # Update learning sequence based on the answer
    learning_sequence.update_progress(is_correct)

    # Track student profile data
    from helpers.session_helper import update_student_profile_with_question
    student_profile = update_student_profile_with_question(
        current_question,
        {
            'is_correct': is_correct,
            'student_answer': student_answer,
            'correct_answer': current_question['choices'][current_question['correct_letter']],
            'misconception': misconception
        },
        response_time=0
    )
    
    # After state
    new_stage = learning_sequence.current_stage
    new_consecutive = learning_sequence.consecutive_correct
    
    # Special handling for transition to stage 2.1
    if old_stage == STAGES["ROUNDING_1DP_BOTH"] and new_stage == STAGES["ROUNDING_2DP"]:
        learning_sequence.showing_example = True
        learning_sequence.current_example = 1
    
    stage_completed = old_stage != new_stage
    showing_new_examples = stage_completed and learning_sequence.showing_example
    
    # Update session with new state
    session['learning_state'] = prepare_session_data(learning_sequence, topic='rounding')
    
    # Create student context for motivational messaging
    student_context = {
        'consecutive_correct': learning_sequence.consecutive_correct,
        'consecutive_errors': 0 if learning_sequence.consecutive_correct > 0 else 1,
        'questions_attempted': learning_sequence.questions_attempted,
        'current_stage': learning_sequence.current_stage,
        'is_correct': is_correct,
        'stage_just_completed': stage_completed
    }
    
    # Get enhanced feedback with motivational messaging
    feedback = content_service.get_feedback(
        current_question,
        verification_steps,
        is_correct,
        misconception,
        student_context
    )
    
    # Handle special redirects
    if old_stage == STAGES["ROUNDING_1DP_BOTH"] and new_stage == STAGES["ROUNDING_2DP"]:
        return jsonify({
            'is_correct': is_correct,
            'feedback': feedback,
            'verification_steps': verification_steps,
            'next_stage': new_stage,
            'stage_completed': stage_completed,
            'showing_new_examples': True,
            'lesson_complete': False,
            'next_stage_redirect': url_for('rounding_decimal2_examples')
        })
    
    # Normal response
    return jsonify({
        'is_correct': is_correct,
        'feedback': feedback,
        'verification_steps': verification_steps,
        'next_stage': new_stage,
        'stage_completed': stage_completed,
        'showing_new_examples': showing_new_examples,
        'lesson_complete': new_stage == STAGES["COMPLETE"]
    })

@app.route('/api/next-example', methods=['POST'])
@handle_errors
def next_example():
    """API endpoint to advance to the next example or to practice."""
    current_topic = session.get('current_topic', 'rounding')
    
    if current_topic == 'rounding':
        return rounding_next_example()
    elif current_topic == 'fractions':
        # Placeholder for Phase 2
        return jsonify({'status': 'success'})
    else:
        return jsonify({'error': 'Unknown topic'}), 400

def rounding_next_example():
    """Handle next example for rounding topic."""
    logger.info("--- ROUNDING NEXT EXAMPLE CALLED ---")
    
    # Check specific progression conditions for rounding
    if ('learning_state' in session and
        session['learning_state']['stage'] == STAGES["ROUNDING_1DP_NO_UP"] and
        session['learning_state']['current_example'] == 1 and
        session['learning_state']['showing_example'] == True):
        learning_sequence.current_example = 2
        learning_sequence.showing_example = True
    elif ('learning_state' in session and
          session['learning_state']['stage'] == STAGES["ROUNDING_1DP_NO_UP"] and
          session['learning_state']['current_example'] == 2 and
          session['learning_state']['showing_example'] == True):
        learning_sequence.current_example = 3
        learning_sequence.showing_example = False
    elif ('learning_state' in session and
          session['learning_state']['stage'] == STAGES["ROUNDING_2DP"] and
          session['learning_state']['current_example'] == 1 and
          session['learning_state']['showing_example'] == True):
        learning_sequence.current_example = 2
        learning_sequence.showing_example = True
    elif ('learning_state' in session and
          session['learning_state']['stage'] == STAGES["ROUNDING_2DP"] and
          session['learning_state']['current_example'] == 2 and
          session['learning_state']['showing_example'] == True):
        learning_sequence.current_example = 3
        learning_sequence.showing_example = False
    else:
        learning_sequence.next_example()
    
    # Update session
    session['learning_state'] = prepare_session_data(learning_sequence, topic='rounding')
    
    return jsonify({'status': 'success'})

@app.route('/api/current-stage')
@handle_errors
def current_stage():
    """API endpoint to get the current stage and determine where the user should be."""
    current_topic = session.get('current_topic', 'rounding')
    
    if 'learning_state' not in session:
        return jsonify({})

    if current_topic == 'rounding':
        return rounding_current_stage()
    elif current_topic == 'fractions':
        # Placeholder for Phase 2
        return jsonify({'redirect': url_for('fractions_intro')})
    else:
        return jsonify({'redirect': url_for('index')})

def rounding_current_stage():
    """Handle current stage logic for rounding topic."""
    current_stage = session['learning_state']['stage']
    logger.info(f"Rounding current stage check: {current_stage}")
    
    if current_stage == STAGES["ROUNDING_1DP_NO_UP"]:
        if session['learning_state']['showing_example']:
            return jsonify({'redirect': url_for('rounding_examples')})
        else:
            return jsonify({'redirect': url_for('rounding_practice')})
    elif current_stage == STAGES["ROUNDING_1DP_WITH_UP"]:
        return jsonify({'redirect': url_for('rounding_practice')})
    elif current_stage == STAGES["ROUNDING_1DP_BOTH"]:
        return jsonify({'redirect': url_for('rounding_practice')})
    elif current_stage == STAGES["ROUNDING_2DP"]:
        if session['learning_state']['showing_example']:
            return jsonify({'redirect': url_for('rounding_decimal2_examples')})
        else:
            return jsonify({'redirect': url_for('rounding_decimal23_practice')})
    elif current_stage == STAGES["STRETCH"]:
        if session['learning_state']['showing_example']:
            return jsonify({'redirect': url_for('rounding_stretch_examples')})
        else:
            return jsonify({'redirect': url_for('rounding_stretch_practice')})
    elif current_stage == STAGES["COMPLETE"]:
        return jsonify({'redirect': url_for('rounding_complete')})
    
    return jsonify({})

@app.route('/api/reset', methods=['POST'])
@handle_errors
def reset_lesson():
    """API endpoint to reset the lesson."""
    logger.info("Reset endpoint called")
    
    # Clear session including student profile
    from helpers.session_helper import reset_student_profile
    session.clear()
    reset_student_profile()
    
    # Reset learning sequence
    learning_sequence.reset()
    logger.info("Session cleared and learning sequence reset")
    
    # Return a redirect instruction
    return jsonify({'status': 'reset', 'redirect': '/'})

# ==========================================
# ROUNDING-SPECIFIC API ENDPOINTS
# ==========================================

# Add these updated endpoints to your app.py file

@app.route('/api/decimal1/examples/first')
@handle_errors
def decimal1_examples_first():
    """API endpoint to get the first example data with separated content."""
    if session.get('current_topic') != 'rounding':
        return jsonify({'error': 'Wrong topic'}), 400
        
    # Update session state
    learning_sequence.current_example = 1
    learning_sequence.showing_example = True
    session['learning_state'] = prepare_session_data(learning_sequence, topic='rounding')

    # Example 1 data with separated content structure
    example_data = {
        "example_number": 1,
        "question_text": "Round 12.632 to 1 decimal place",
        "total_steps": 3,
        "steps": [
            {
                "step_number": 1,
                "image_content": {
                    "display_text": "12.6|32",
                    "annotation": "1st decimal place",
                    "highlight_position": "after_6"
                },
                "text_content": "Identify the digit in the 1st decimal place. This is the first digit after the decimal point. We will call it the \"rounding digit\". Draw a \"cut off\" line after the rounding digit."
            },
            {
                "step_number": 2,
                "image_content": {
                    "display_text": "12.6|32",
                    "annotation": "Next digit is 3 (less than 5)",
                    "highlight_position": "after_line"
                },
                "text_content": "Check the digit to the right of the \"cut off\" line. If this digit is less than 5 we keep our rounding digit the same."
            },
            {
                "step_number": 3,
                "image_content": {
                    "display_text": "12.6",
                    "annotation": "Final answer",
                    "highlight_position": "complete"
                },
                "text_content": "Remove all digits after the \"cut off\" line. We have now rounded the number to 1 decimal place."
            }
        ],
        "answer": "12.6"
    }
    
    return jsonify(example_data)

@app.route('/api/decimal1/examples/second')
@handle_errors
def decimal1_examples_second():
    """API endpoint to get the second example data with separated content."""
    if session.get('current_topic') != 'rounding':
        return jsonify({'error': 'Wrong topic'}), 400
        
    learning_sequence.current_example = 2
    session['learning_state'] = prepare_session_data(learning_sequence, topic='rounding')
    
    # Example 2 data with separated content structure
    example_data = {
        "example_number": 2,
        "question_text": "Round 12.682 to 1 decimal place",
        "total_steps": 3,
        "steps": [
            {
                "step_number": 1,
                "image_content": {
                    "display_text": "12.6|82",
                    "annotation": "1st decimal place",
                    "highlight_position": "after_6"
                },
                "text_content": "Identify the digit in the 1st decimal place. This is the first digit after the decimal point. We will call it the \"rounding digit\". Draw a \"cut off\" line after the rounding digit."
            },
            {
                "step_number": 2,
                "image_content": {
                    "display_text": "12.6|82",
                    "annotation": "Next digit is 8 (5 or greater)",
                    "highlight_position": "after_line"
                },
                "text_content": "Check the digit to the right of the \"cut off\" line. If this digit is 5 or bigger we need to round up. We do this by adding 1 to the rounding digit."
            },
            {
                "step_number": 3,
                "image_content": {
                    "display_text": "12.7",
                    "annotation": "Final answer (6 became 7)",
                    "highlight_position": "complete"
                },
                "text_content": "Remove all digits after the \"cut off\" line. We have now rounded the number to 1 decimal place. Notice that the 6 has changed to a 7 as we rounded up."
            }
        ],
        "answer": "12.7"
    }
    
    return jsonify(example_data)

# Add new endpoint to get individual steps
@app.route('/api/decimal1/examples/<int:example_num>/step/<int:step_num>')
@handle_errors
def get_example_step(example_num, step_num):
    """Get a specific step of a specific example."""
    if session.get('current_topic') != 'rounding':
        return jsonify({'error': 'Wrong topic'}), 400
    
    # Get the appropriate example data
    if example_num == 1:
        response = decimal1_examples_first()
        example_data = response.get_json()
    elif example_num == 2:
        response = decimal1_examples_second()
        example_data = response.get_json()
    else:
        return jsonify({'error': 'Invalid example number'}), 400
    
    # Validate step number
    if step_num < 1 or step_num > len(example_data['steps']):
        return jsonify({'error': 'Invalid step number'}), 400
    
    # Return the specific step (array is 0-indexed)
    step_data = example_data['steps'][step_num - 1]
    
    return jsonify({
        'example_number': example_num,
        'step': step_data,
        'total_steps': example_data['total_steps'],
        'question_text': example_data['question_text']
    })

@app.route('/api/decimal1/examples/complete', methods=['POST'])
@handle_errors
def decimal1_examples_complete():
    """API endpoint to mark examples as complete and move to practice."""
    if session.get('current_topic') != 'rounding':
        return jsonify({'error': 'Wrong topic'}), 400
        
    learning_sequence.showing_example = False
    learning_sequence.current_example = 3
    session['learning_state'] = prepare_session_data(learning_sequence, topic='rounding')
    
    return jsonify({"status": "success"})

@app.route('/api/decimal1/practice/question')
@handle_errors
def decimal1_practice_question():
    """API endpoint to get a practice question."""
    if session.get('current_topic') != 'rounding':
        return jsonify({'error': 'Wrong topic'}), 400
        
    current_sequence = load_learning_sequence_from_session(learning_sequence, topic='rounding')
    
    if current_sequence.get_current_stage() == STAGES["COMPLETE"]:
        return jsonify({
            'lesson_complete': True,
            'message': "Congratulations! You've completed all the stages in this lesson."
        })
    
    stage_rules = current_sequence.get_stage_rules()
    question = question_generator.generate_question(stage_rules, current_sequence)
    formatted_question = question_generator.format_multiple_choice(question)
    
    session['current_question'] = json.dumps(formatted_question)
    session['learning_state'] = prepare_session_data(current_sequence, topic='rounding')
    
    return jsonify({
        'lesson_complete': False,
        'stage': current_sequence.get_current_stage(),
        'question': formatted_question
    })

@app.route('/api/decimal2/examples/first')
@handle_errors
def decimal2_examples_first():
    """API endpoint to get the first example data for decimal2."""
    if session.get('current_topic') != 'rounding':
        return jsonify({'error': 'Wrong topic'}), 400
        
    learning_sequence.current_example = 1
    learning_sequence.showing_example = True
    session['learning_state'] = prepare_session_data(learning_sequence, topic='rounding')
    
    example_data = {
        'question_text': 'Round 12.632 to 2 decimal places',
        'steps': [
            {
                'explanation': 'Identify the digit in the 2nd decimal place. This is the second digit after the decimal point. We will call it the "rounding digit". Draw a "cut off" line after the rounding digit.',
                'image': '/static/images/stage2_1_step1.jpg'
            },
            {
                'explanation': 'Check the digit to the right of the "cut off" line. If this digit is less than 5 we keep our rounding digit the same.',
                'image': '/static/images/stage2_1_step2.jpg'
            },
            {
                'explanation': 'Remove all digits after the "cut off" line. We have now rounded the number to 2 decimal places.',
                'image': '/static/images/stage2_1_step3.jpg'
            }
        ],
        'answer': '12.63'
    }
    
    return jsonify(example_data)

@app.route('/api/decimal2/examples/second')
@handle_errors
def decimal2_examples_second():
    """API endpoint to get the second example data for decimal2."""
    if session.get('current_topic') != 'rounding':
        return jsonify({'error': 'Wrong topic'}), 400
        
    learning_sequence.current_example = 2
    session['learning_state'] = prepare_session_data(learning_sequence, topic='rounding')
    
    example_data = {
        'question_text': 'Round 12.678 to 3 decimal places',
        'steps': [
            {
                'explanation': 'Identify the digit in the 3rd decimal place. This is the third digit after the decimal point. We will call it the "rounding digit". Draw a "cut off" line after the rounding digit.',
                'image': '/static/images/stage2_2_step1.jpg'
            },
            {
                'explanation': 'Check the digit to the right of the "cut off" line. If this digit is 5 or bigger we need to round up. We do this by adding 1 to the rounding digit.',
                'image': '/static/images/stage2_2_step2.jpg'
            },
            {
                'explanation': 'Remove all digits after the "cut off" line. We have now rounded the number to 3 decimal places. Notice that the 7 has changed to an 8 as we rounded up.',
                'image': '/static/images/stage2_2_step3.jpg'
            }
        ],
        'answer': '12.68'
    }
    
    return jsonify(example_data)

@app.route('/api/decimal2/examples/complete', methods=['POST'])
@handle_errors
def decimal2_examples_complete():
    """API endpoint to mark decimal2 examples as complete and move to practice."""
    if session.get('current_topic') != 'rounding':
        return jsonify({'error': 'Wrong topic'}), 400
        
    learning_sequence.showing_example = False
    learning_sequence.current_example = 3
    session['learning_state'] = prepare_session_data(learning_sequence, topic='rounding')
    
    return jsonify({"status": "success"})

@app.route('/api/decimal2/practice/question')
@handle_errors
def decimal2_practice_question():
    """API endpoint to get a practice question for decimal2 stage."""
    if session.get('current_topic') != 'rounding':
        return jsonify({'error': 'Wrong topic'}), 400
        
    current_sequence = load_learning_sequence_from_session(learning_sequence, topic='rounding')
    
    if current_sequence.get_current_stage() == STAGES["COMPLETE"]:
        return jsonify({
            'lesson_complete': True,
            'message': "Congratulations! You've completed all the stages in this lesson."
        })
    
    stage_rules = current_sequence.get_stage_rules()
    question = question_generator.generate_question(stage_rules, current_sequence)
    formatted_question = question_generator.format_multiple_choice(question)
    
    session['current_question'] = json.dumps(formatted_question)
    session['learning_state'] = prepare_session_data(current_sequence, topic='rounding')
    
    return jsonify({
        'lesson_complete': False,
        'stage': current_sequence.get_current_stage(),
        'question': formatted_question
    })

@app.route('/api/decimal23/practice/question')
@handle_errors
def decimal23_practice_question():
    """API endpoint to get a practice question for decimal 2 and 3 stage."""
    if session.get('current_topic') != 'rounding':
        return jsonify({'error': 'Wrong topic'}), 400
        
    current_sequence = load_learning_sequence_from_session(learning_sequence, topic='rounding')
    
    if current_sequence.get_current_stage() == STAGES["COMPLETE"]:
        return jsonify({
            'lesson_complete': True,
            'message': "Congratulations! You've completed all the stages in this lesson."
        })
    
    stage_rules = current_sequence.get_stage_rules()
    question = question_generator.generate_question(stage_rules, current_sequence)
    formatted_question = question_generator.format_multiple_choice(question)
    
    session['current_question'] = json.dumps(formatted_question)
    session['learning_state'] = prepare_session_data(current_sequence, topic='rounding')
    
    return jsonify({
        'lesson_complete': False,
        'stage': current_sequence.get_current_stage(),
        'question': formatted_question
    })

# ==========================================
# DEBUG AND UTILITY ENDPOINTS
# ==========================================

@app.route('/debug-session')
def debug_session():
    """Debug endpoint to view current session data."""
    return jsonify({
        'current_topic': session.get('current_topic', 'none'),
        'learning_state': session.get('learning_state', {}),
        'current_question': session.get('current_question', {}),
        'user_id': session.get('user_id', 'no session')
    })

@app.route('/api/test', methods=['GET', 'POST'])
def test_endpoint():
    """Simple test endpoint to verify Flask is working."""
    return jsonify({
        'status': 'working', 
        'method': request.method,
        'session_id': session.get('user_id', 'no session'),
        'current_topic': session.get('current_topic', 'none')
    })

# ==========================================
# LEGACY ROUTE REDIRECTS (Backward Compatibility)
# ==========================================

# Redirect old routes to new topic-specific routes
@app.route('/lesson')
def legacy_lesson():
    """Legacy lesson route - redirect to rounding."""
    return redirect(url_for('rounding_intro'))

@app.route('/lesson-intro')
def legacy_lesson_intro():
    """Legacy lesson intro route - redirect to rounding."""
    return redirect(url_for('rounding_intro'))

@app.route('/examples')
def legacy_examples():
    """Legacy examples route - redirect to rounding."""
    return redirect(url_for('rounding_examples'))

@app.route('/practice')
def legacy_practice():
    """Legacy practice route - redirect to rounding."""
    return redirect(url_for('rounding_practice'))

@app.route('/decimal1/practice')
def legacy_decimal1_practice():
    """Legacy decimal1 practice route - redirect to rounding."""
    return redirect(url_for('rounding_decimal1_practice'))

@app.route('/decimal2/examples')
def legacy_decimal2_examples():
    """Legacy decimal2 examples route - redirect to rounding."""
    return redirect(url_for('rounding_decimal2_examples'))

@app.route('/decimal2/practice')
def legacy_decimal2_practice():
    """Legacy decimal2 practice route - redirect to rounding."""
    return redirect(url_for('rounding_decimal2_practice'))

@app.route('/decimal23/practice')
def legacy_decimal23_practice():
    """Legacy decimal23 practice route - redirect to rounding."""
    return redirect(url_for('rounding_decimal23_practice'))

@app.route('/stretch/examples')
def legacy_stretch_examples():
    """Legacy stretch examples route - redirect to rounding."""
    return redirect(url_for('rounding_stretch_examples'))

@app.route('/stretch/practice')
def legacy_stretch_practice():
    """Legacy stretch practice route - redirect to rounding."""
    return redirect(url_for('rounding_stretch_practice'))

@app.route('/complete')
def legacy_complete():
    """Legacy complete route - redirect to rounding."""
    return redirect(url_for('rounding_complete'))

if __name__ == '__main__':
    print("Starting Math Tutor Flask app...")
    print(f"Debug mode: {app.debug}")
    print("Available topics: Rounding (active), Fractions (coming soon)")
    app.run(debug=True, host='127.0.0.1', port=5000)

