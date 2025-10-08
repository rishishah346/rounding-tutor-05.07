"""Provides explanations and feedback for rounding questions with integrated motivational messaging."""

from services.motivational_service import MotivationalService
from services.ai_feedback_service import AIFeedbackService  # NEW LINE
import os  # NEW LINE

class ContentService:
    """Handles generation of explanations and feedback for rounding questions."""
    
    def __init__(self):
        # Initialize the motivational service
        self.motivational_service = MotivationalService()
    
        # Initialize AI feedback service (NEW)
        self.ai_feedback_service = AIFeedbackService()
    
        # Check if AI is enabled (requires API key) (NEW)
        self.ai_enabled = bool(os.environ.get("LLM_API_KEY"))

    def get_explanation(self, question, verification_steps):
        """
        Gets a hardcoded explanation for a question.
        Used for modeling examples.
        """
        number = question['original_question']['number']
        decimal_places = question['original_question']['decimal_places']
        answer = question['original_question']['answer']
        
        # Find the target digit and the digit to its right
        target_digit = verification_steps['target_digit']
        right_digit = verification_steps['right_digit']
        should_round_up = verification_steps['round_up']
        
        # Build the explanation
        ordinal = self._get_ordinal_suffix(decimal_places)
        round_action = "round up" if should_round_up else "keep the same"
        
        change_text = f"This means we change {target_digit} to {int(target_digit) + 1}." if should_round_up else f"This means we keep {target_digit} as is."
        
        explanation = f"""
        Let's work through how to round {number} to {decimal_places} decimal place(s).

        Step 1: Identify the digit in the target decimal place.
        
        The target decimal place is the {decimal_places}{ordinal} digit after the decimal point.
        
        In {number}, this digit is {target_digit}.
        
        Step 2: Look at the digit to the right of this target digit.
        
        The digit to the right of {target_digit} is {right_digit}.
        
        Step 3: Apply the rounding rule.
        
        Since {right_digit} is {'5 or more' if should_round_up else 'less than 5'}, we {round_action} the target digit.
        
        {change_text}
        
        Step 4: Remove all digits after the target decimal place.
        
        The final answer is {answer}.
        """
        
        return explanation

    def get_feedback(self, question, verification_steps, is_correct, misconception_data=None, student_context=None, session_id=None):
        """Gets feedback for a student's answer with enhanced formatting and motivational messaging."""
        
        # CRITICAL FIX: Ensure feedback uses the correct question data
        expected_number = question["original_question"]["number"]
        if verification_steps["original_number"] != expected_number:
            print(f"ERROR: Feedback using wrong number - expected {expected_number}, got {verification_steps['original_number']}")
            # Fix the mismatch
            verification_steps["original_number"] = expected_number
        
        student_answer = question.get("student_answer", "")
        
        if is_correct:
            # Generate positive mathematical feedback - CONCISE
            mathematical_feedback = f"""{verification_steps['correct_answer']} is right."""
        else:
            # Determine if this is a repeated mistake
            attempt_number = 1
            if misconception_data and isinstance(misconception_data, dict):
                from helpers.session_helper import track_misconception_attempt
                misconception_type = misconception_data.get('type', 'unknown')
                attempt_number = track_misconception_attempt(misconception_type)
            
            # Use AI only for repeated mistakes (attempt 2+)
            if (self.ai_enabled and 
                misconception_data and 
                isinstance(misconception_data, dict) and 
                session_id and 
                attempt_number >= 2):  # NEW CONDITION
                
                try:
                    print(f"DEBUG: Using AI feedback (attempt #{attempt_number} for {misconception_type})")
                    mathematical_feedback = self.ai_feedback_service.generate_feedback(
                        question_data=question,
                        verification_steps=verification_steps,
                        misconception_data=misconception_data,
                        student_context=student_context or {},
                        session_id=session_id
                    )
                except Exception as e:
                    print(f"AI feedback failed, using fallback: {e}")
                    mathematical_feedback = self._generate_template_feedback(
                        question, verification_steps, misconception_data
                    )
            else:
                # First attempt or AI disabled - use template
                if attempt_number == 1:
                    print(f"DEBUG: Using template feedback (first attempt)")
                else:
                    print(f"DEBUG: Using template feedback (AI disabled)")
                mathematical_feedback = self._generate_template_feedback(
                    question, verification_steps, misconception_data
                )

        # Add motivational messaging if student context is provided
        if student_context:
            # Get misconception type for targeted support
            misconception_type = misconception_data.get('type') if misconception_data else None
            
            # Get motivational template from the motivational service
            motivational_template = self.motivational_service.get_motivational_context(
                is_correct, student_context, misconception_type
            )
            
            # Combine mathematical feedback with motivational messaging
            enhanced_feedback = motivational_template.format(
                mathematical_feedback=mathematical_feedback
            )
            
            return enhanced_feedback.strip()
        else:
            # Fallback to plain mathematical feedback if no student context
            return mathematical_feedback.strip()

    def _generate_template_feedback(self, question, verification_steps, misconception_data):
        """Generate template-based feedback (existing logic)"""
        if misconception_data and isinstance(misconception_data, dict):
            return self._generate_specific_misconception_feedback(
                question, verification_steps, misconception_data
            )
        else:
            return self._generate_generic_feedback(
                question, verification_steps
            )

    
    def _generate_specific_misconception_feedback(self, question, verification_steps, misconception_data):
        """Generate feedback specific to the identified misconception."""
        
        student_choice = question['choices'].get(question.get("student_answer", ""), "Unknown")
        original_number = verification_steps['original_number']
        decimal_places = verification_steps['decimal_places']
        correct_answer = verification_steps['correct_answer']
        target_digit = verification_steps['target_digit']
        next_digit = verification_steps['right_digit']
        should_round_up = verification_steps['round_up']
        
        # Get the misconception type and choice analysis
        misconception_type = misconception_data.get('type', '')
        choice_analysis = misconception_data.get('choice_analysis', {})
        student_action = choice_analysis.get('student_action', '')
        
        # First, check if student rounded to whole number (most obvious misconception)
        if '.' not in student_choice:
            # Student rounded to whole number instead of decimal places
            feedback = f"""You rounded {original_number} to a whole number ({student_choice}), but the question asks you to round to {decimal_places} decimal place{'s' if decimal_places > 1 else ''}. The correct answer is {correct_answer}."""
            
        # Check for rounding direction errors (student has correct decimal places but wrong direction)
        elif len(student_choice.split('.')[-1]) == decimal_places:
            # Student has right number of decimal places but wrong value - likely direction error
            try:
                student_num = float(student_choice)
                correct_num = float(correct_answer)
                
                if student_num > correct_num:
                    # Student rounded up when should round down
                    feedback = f"""You correctly identified the {decimal_places}{self._get_ordinal_suffix(decimal_places)} decimal place digit ({target_digit}), but when the next digit is {next_digit} (which is less than 5), you should keep the digit the same. The correct answer is {correct_answer}."""
                elif student_num < correct_num:
                    # Student rounded down when should round up
                    feedback = f"""You correctly identified the {decimal_places}{self._get_ordinal_suffix(decimal_places)} decimal place digit ({target_digit}), but when the next digit is {next_digit} (which is 5 or greater), you should round up. The {target_digit} becomes {int(target_digit) + 1}. The correct answer is {correct_answer}."""
                else:
                    # Same value but different representation? Shouldn't happen but fallback
                    feedback = self._generate_generic_feedback(question, verification_steps)
            except:
                feedback = self._generate_generic_feedback(question, verification_steps)
                
        # Check for wrong number of decimal places
        elif '.' in student_choice:
            student_decimal_places = len(student_choice.split('.')[-1])
            if student_decimal_places != decimal_places:
                feedback = f"""You rounded {original_number} to {student_decimal_places} decimal place{'s' if student_decimal_places != 1 else ''}, but the question asks you to round to {decimal_places} decimal place{'s' if decimal_places > 1 else ''}. The correct answer is {correct_answer}."""
            else:
                # Has right decimal places but wrong answer - check if truncation
                if 'truncated_instead_of_rounded' in student_action:
                    feedback = f"""You appear to have truncated (cut off) the digits after the {decimal_places}{self._get_ordinal_suffix(decimal_places)} decimal place rather than rounding. When rounding, you must look at the digit to the right of your target position. Since the next digit is {next_digit}, which is {'5 or greater' if int(next_digit) >= 5 else 'less than 5'}, you should {'round up' if int(next_digit) >= 5 else 'keep the digit the same'}. The correct answer is {correct_answer}."""
                else:
                    # Fallback to generic
                    feedback = self._generate_generic_feedback(question, verification_steps)
        else:
            # Fallback to generic feedback with some misconception context
            feedback = self._generate_generic_feedback(question, verification_steps)
            
            # Add a specific hint if we have one
            interpretation = choice_analysis.get('interpretation', '')
            if interpretation:
                clean_interpretation = interpretation.replace('Student ', 'You ').replace('student ', 'you ')
                feedback += f" Hint: {clean_interpretation}."
        
        return feedback

    def _generate_generic_feedback(self, question, verification_steps):
        """Generate generic step-by-step feedback when specific misconception isn't identified."""
        
        target_digit = verification_steps['target_digit']
        next_digit = verification_steps['right_digit']
        decimal_places = verification_steps['decimal_places']
        original_number = verification_steps['original_number']
        correct_answer = verification_steps['correct_answer']
        should_round_up = verification_steps['round_up']
        ordinal = self._get_ordinal_suffix(decimal_places)
        
        # Mathematically accurate generic feedback
        feedback = f"""To round {original_number} to {decimal_places} decimal place{'s' if decimal_places > 1 else ''}: identify the {decimal_places}{ordinal} decimal place digit ({target_digit}), then look at the next digit ({next_digit}). Since {next_digit} is {'5 or greater' if should_round_up else 'less than 5'}, you {'round the {target_digit} up to {int(target_digit) + 1}' if should_round_up else 'keep the {target_digit} the same'}. The correct answer is {correct_answer}."""
        
        return feedback

    def _get_ordinal_suffix(self, n):
        """Return the ordinal suffix for a number."""
        if n == 1:
            return "st"
        elif n == 2:
            return "nd"
        elif n == 3:
            return "rd"
        else:
            return "th"