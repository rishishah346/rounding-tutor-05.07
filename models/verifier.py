"""Verifies student answers for rounding questions."""
import decimal

class Verifier:
    """Verifies student answers for rounding questions."""

    def verify_answer(self, question, student_answer):
        """Verifies if the student's answer is correct."""

        # Get the correct answer from the question
        correct_letter = question["correct_letter"]

        # Check if student answer matches correct answer
        is_correct = student_answer == correct_letter

        # Get the numerical values
        original_number = question["original_question"]["number"]
        decimal_places = question["original_question"]["decimal_places"]
        student_value = question["choices"][student_answer]
        correct_value = question["choices"][correct_letter]

        # Record verification steps
        verification_steps = self._get_verification_steps(
            original_number,
            decimal_places,
            correct_value
        )

        # CRITICAL FIX: Double-check that verification steps use the correct original number
        if verification_steps["original_number"] != original_number:
            print(f"WARNING: Fixing mismatch in verification steps: {verification_steps['original_number']} to {original_number}")
            verification_steps["original_number"] = original_number

        # Enhanced misconception analysis
        enhanced_misconception = None
        if not is_correct:
            enhanced_misconception = self._analyze_misconception_enhanced(
                original_number, 
                decimal_places, 
                student_value, 
                correct_value, 
                student_answer,
                question["choices"]
            )

        return is_correct, verification_steps, enhanced_misconception


    def _get_verification_steps(self, number, decimal_places, correct_answer):
        """Records detailed verification steps."""
        # Convert to Decimal for precise handling
        num = decimal.Decimal(number)
        
        # Identify the digit in the target decimal place
        target_digit_idx = number.find(".") + decimal_places
        
        if target_digit_idx < len(number):
            target_digit = number[target_digit_idx]
        else:
            target_digit = "0"
            
        # Identify the digit to the right
        right_digit_idx = target_digit_idx + 1
        
        if right_digit_idx < len(number):
            right_digit = number[right_digit_idx]
        else:
            right_digit = "0"
            
        # Determine if rounding up is needed
        round_up = int(right_digit) >= 5
        
        steps = {
            "original_number": number,
            "decimal_places": decimal_places,
            "target_digit": target_digit,
            "right_digit": right_digit,
            "round_up": round_up,
            "round_up_text": "round up" if round_up else "keep the same",
            "correct_answer": correct_answer
        }
        
        return steps

    def _identify_misconception(self, number, decimal_places, student_value, correct_value):
        """Identifies common misconceptions based on the student's answer."""

        # For simplicity in the POC, we'll identify a few common misconceptions
        misconceptions = {
            "should_round_up": "You identified the correct decimal place, but didn't round up when you should have.",
            "shouldnt_round_up": "You identified the correct decimal place, but rounded up when you shouldn't have.",
            "wrong_place": "You might be rounding to the wrong decimal place.",
            "rounding_to_whole": "You appear to be rounding to the nearest whole number instead of the specified decimal place.",
            "over_rounded": "You've rounded to fewer decimal places than requested.",
            "under_rounded": "You've rounded to more decimal places than requested.",
            "left_off_trailing_0": "You've left off the trailing zero that should be included when rounding to this decimal place."
        }

        # Add more detailed explanation to help generate better feedback
        detailed_misconception = f"Your answer of {student_value} indicates a misconception: "

        # Check if rounded to whole number
        if "." not in student_value:
            return detailed_misconception + misconceptions["rounding_to_whole"]

        # Check decimal places in student answer
        student_decimal_part = student_value.split(".")[1]

        if len(student_decimal_part) != decimal_places:
            if len(student_decimal_part) < decimal_places:
                return detailed_misconception + misconceptions["over_rounded"]
            else:
                return detailed_misconception + misconceptions["under_rounded"]

        # Check if should have rounded up but didn't
        if decimal.Decimal(student_value) < decimal.Decimal(correct_value):
            return detailed_misconception + misconceptions["should_round_up"]

        # Check if should not have rounded up but did
        if decimal.Decimal(student_value) > decimal.Decimal(correct_value):
            return detailed_misconception + misconceptions["shouldnt_round_up"]

        # Check if trailing zeros are missing
        if decimal_places > len(student_decimal_part) and student_value[-1] != '0':
            return detailed_misconception + misconceptions["left_off_trailing_0"]

        # Default
        return detailed_misconception + "There seems to be a misunderstanding of the rounding process."

    def _analyze_misconception_enhanced(self, number, decimal_places, student_value, correct_value, student_letter, all_choices):
        """Enhanced misconception analysis that returns structured data for AI consumption."""

        # Get the original misconception text using your existing logic
        original_misconception = self._identify_misconception(number, decimal_places, student_value, correct_value)

        # Analyze the specific choice the student made
        choice_analysis = self._analyze_student_choice(student_value, correct_value, all_choices, number, decimal_places)

        # Determine misconception category and AI context
        misconception_data = {
            # Keep original text for backward compatibility
            'original_text': original_misconception,

            # Structured data for AI
            'type': self._categorize_misconception_type(original_misconception),
            'student_action': choice_analysis['student_action'],
            'correct_concept': choice_analysis['correct_concept'],
            'difficulty_factors': self._identify_difficulty_factors(number, decimal_places),
            'choice_analysis': choice_analysis,

            # AI-friendly summary
            'ai_context': {
                'what_student_did': choice_analysis['interpretation'],
                'what_should_happen': choice_analysis['correct_process'],
                'key_concept_missed': choice_analysis['missed_concept'],
                'suggested_focus': choice_analysis['suggested_focus']
            }
        }

        return misconception_data

    def _analyze_student_choice(self, student_value, correct_value, all_choices, number, decimal_places):
        """Analyze what the student's specific choice reveals about their thinking."""

        # Convert values to numbers for analysis
        try:
            student_num = float(student_value)
            correct_num = float(correct_value)
            original_num = float(number)
        except:
            return self._fallback_choice_analysis()

        # Analyze the relationship between student choice and correct answer
        if student_num == correct_num:
            return self._correct_choice_analysis()

        # Check if student truncated instead of rounded
        truncated_value = self._get_truncated_value(number, decimal_places)
        if abs(student_num - truncated_value) < 0.0001:
            return {
                'student_action': 'truncated_instead_of_rounded',
                'correct_concept': 'rounding_vs_truncation',
                'interpretation': f'Student chopped off digits after {decimal_places} decimal place(s) instead of rounding',
                'correct_process': f'Should look at digit after {decimal_places} decimal place(s) and round accordingly',
                'missed_concept': 'rounding_rule_when_digit_5_or_greater',
                'suggested_focus': 'demonstrate_difference_between_truncation_and_rounding'
            }

        # Check if student rounded in wrong direction
        if student_num < correct_num:
            return {
                'student_action': 'rounded_down_when_should_round_up',
                'correct_concept': 'rounding_up_rule',
                'interpretation': 'Student rounded down when the digit warranted rounding up',
                'correct_process': 'When the digit is 5 or greater, round up',
                'missed_concept': 'rounding_up_when_digit_5_or_greater',
                'suggested_focus': 'practice_identifying_when_to_round_up'
            }
        elif student_num > correct_num:
            return {
                'student_action': 'rounded_up_when_should_round_down',
                'correct_concept': 'rounding_down_rule',
                'interpretation': 'Student rounded up when the digit warranted rounding down',
                'correct_process': 'When the digit is less than 5, keep the target digit the same',
                'missed_concept': 'rounding_down_when_digit_less_than_5',
                'suggested_focus': 'practice_identifying_when_to_round_down'
            }

        # Check if wrong decimal place
        decimal_diff = abs(len(student_value.split('.')[-1]) - decimal_places) if '.' in student_value else decimal_places
        if decimal_diff > 0:
            return {
                'student_action': 'rounded_to_wrong_decimal_place',
                'correct_concept': 'decimal_place_identification',
                'interpretation': f'Student rounded to {len(student_value.split(".")[-1]) if "." in student_value else 0} decimal place(s) instead of {decimal_places}',
                'correct_process': f'Count {decimal_places} place(s) after the decimal point',
                'missed_concept': 'counting_decimal_places',
                'suggested_focus': 'practice_identifying_target_decimal_place'
            }

        # Generic analysis for other cases
        return {
            'student_action': 'general_rounding_error',
            'correct_concept': 'rounding_process',
            'interpretation': 'Student made an error in the rounding process',
            'correct_process': 'Identify target digit, check next digit, round accordingly',
            'missed_concept': 'systematic_rounding_approach',
            'suggested_focus': 'review_step_by_step_rounding_process'
        }

    def _get_truncated_value(self, number, decimal_places):
        """Get what the value would be if truncated (not rounded)."""
        try:
            if '.' not in number:
                return float(number)

            parts = number.split('.')
            if len(parts[1]) <= decimal_places:
                return float(number)

            truncated = parts[0] + '.' + parts[1][:decimal_places]
            return float(truncated)
        except:
            return 0.0

    def _categorize_misconception_type(self, original_text):
        """Categorize the misconception for AI processing."""
        if not original_text:
            return "unknown_error"

        text_lower = original_text.lower()

        if "round up" in text_lower and "should" in text_lower:
            return "rounding_direction_confusion"
        elif "round down" in text_lower and "should" in text_lower:
            return "rounding_direction_confusion"
        elif "whole number" in text_lower:  # ← Move this BEFORE decimal place check
            return "place_value_confusion"
        elif "decimal place" in text_lower or "wrong place" in text_lower:
            return "decimal_place_confusion"
        elif "trailing zero" in text_lower:
            return "decimal_notation_confusion"
        else:
            return "general_rounding_error"


    def _identify_difficulty_factors(self, number, decimal_places):
        """Identify what makes this particular question challenging."""
        factors = []

        # Check for 9s in the number
        if '9' in number:
            factors.append("contains_nines")

        # Check if rounding position has high digit
        try:
            decimal_part = number.split('.')[1]
            if len(decimal_part) > decimal_places:
                next_digit = int(decimal_part[decimal_places])
                if next_digit >= 5:
                    factors.append("requires_rounding_up")

                if next_digit == 5:
                    factors.append("borderline_case_5")
        except:
            pass

        # Check number of digits after decimal
        try:
            decimal_length = len(number.split('.')[1])
            if decimal_length > 3:
                factors.append("many_decimal_digits")
        except:
            pass

        # Check if target decimal place is beyond first
        if decimal_places > 1:
            factors.append("multi_decimal_place_target")

        return factors

    def _fallback_choice_analysis(self):
        """Fallback analysis when numerical analysis fails."""
        return {
            'student_action': 'unanalyzed_error',
            'correct_concept': 'rounding_process',
            'interpretation': 'Error in rounding process',
            'correct_process': 'Follow step-by-step rounding procedure',
            'missed_concept': 'systematic_approach',
            'suggested_focus': 'review_rounding_steps'
        }

    def _correct_choice_analysis(self):
        """Analysis for correct answers (shouldn't be called in misconception context)."""
        return {
            'student_action': 'correct_rounding',
            'correct_concept': 'successful_rounding',
            'interpretation': 'Student applied rounding correctly',
            'correct_process': 'Proper identification and application of rounding rules',
            'missed_concept': 'none',
            'suggested_focus': 'continue_current_approach'
        }
