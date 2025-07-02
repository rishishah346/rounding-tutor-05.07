"""Generates questions based on the current learning stage."""
import random
import decimal
from config import STAGES, QUESTION_RULES

class QuestionGenerator:
    """Generates questions based on the current learning stage."""

    def __init__(self):
        # Stage 1.1 Questions (no rounding up, only 2 digits after decimal)
        self.stage1_1_questions = [
            {"number": "13.62", "decimal_places": 1, "answer": "13.6", "rounding_up": False},
            {"number": "4.21", "decimal_places": 1, "answer": "4.2", "rounding_up": False},
            {"number": "87.54", "decimal_places": 1, "answer": "87.5", "rounding_up": False},
            {"number": "16.12", "decimal_places": 1, "answer": "16.1", "rounding_up": False},
            {"number": "25.31", "decimal_places": 1, "answer": "25.3", "rounding_up": False},
            {"number": "9.42", "decimal_places": 1, "answer": "9.4", "rounding_up": False},
            {"number": "67.21", "decimal_places": 1, "answer": "67.2", "rounding_up": False},
            {"number": "3.01", "decimal_places": 1, "answer": "3.0", "rounding_up": False}
        ]

        # Stage 1.2 Questions (with rounding up, only 2 digits after decimal)
        self.stage1_2_questions = [
            {"number": "0.17", "decimal_places": 1, "answer": "0.2", "rounding_up": True},
            {"number": "22.46", "decimal_places": 1, "answer": "22.5", "rounding_up": True},
            {"number": "8.88", "decimal_places": 1, "answer": "8.9", "rounding_up": True},
            {"number": "7.66", "decimal_places": 1, "answer": "7.7", "rounding_up": True},
            {"number": "11.57", "decimal_places": 1, "answer": "11.6", "rounding_up": True},
            {"number": "5.79", "decimal_places": 1, "answer": "5.8", "rounding_up": True},
            {"number": "42.65", "decimal_places": 1, "answer": "42.7", "rounding_up": True},
            {"number": "3.85", "decimal_places": 1, "answer": "3.9", "rounding_up": True}
        ]

        # Stage 1.3 Questions (mixed rounding, 2-4 digits after decimal)
        self.stage1_3_questions = [
            {"number": "7.231", "decimal_places": 1, "answer": "7.2", "rounding_up": False},
            {"number": "12.758", "decimal_places": 1, "answer": "12.8", "rounding_up": True},
            {"number": "45.3495", "decimal_places": 1, "answer": "45.3", "rounding_up": False},
            {"number": "6.6782", "decimal_places": 1, "answer": "6.7", "rounding_up": True},
            {"number": "33.149", "decimal_places": 1, "answer": "33.1", "rounding_up": False},
            {"number": "19.872", "decimal_places": 1, "answer": "19.9", "rounding_up": True},
            {"number": "0.2548", "decimal_places": 1, "answer": "0.3", "rounding_up": True},
            {"number": "1.423", "decimal_places": 1, "answer": "1.4", "rounding_up": False},
            {"number": "88.501", "decimal_places": 1, "answer": "88.5", "rounding_up": False},
            {"number": "54.1796", "decimal_places": 1, "answer": "54.2", "rounding_up": True},
            {"number": "7.849", "decimal_places": 1, "answer": "7.8", "rounding_up": False},
            {"number": "23.554", "decimal_places": 1, "answer": "23.6", "rounding_up": True}
        ]

        # Stage 2.1 Questions
        self.stage2_1_questions = [
            {"number": "4.859", "decimal_places": 2, "answer": "4.86", "rounding_up": True},
            {"number": "9.1234", "decimal_places": 3, "answer": "9.123", "rounding_up": False},
            {"number": "6.728", "decimal_places": 2, "answer": "6.73", "rounding_up": True},
            {"number": "0.234", "decimal_places": 2, "answer": "0.23", "rounding_up": False},
            {"number": "19.8765", "decimal_places": 3, "answer": "19.877", "rounding_up": True},
            {"number": "3.786", "decimal_places": 2, "answer": "3.79", "rounding_up": True},
            {"number": "78.1237", "decimal_places": 3, "answer": "78.124", "rounding_up": True},
            {"number": "12.345", "decimal_places": 2, "answer": "12.35", "rounding_up": True},
            {"number": "0.6789", "decimal_places": 3, "answer": "0.679", "rounding_up": True},
            {"number": "5.676", "decimal_places": 2, "answer": "5.68", "rounding_up": True},
            {"number": "100.2345", "decimal_places": 3, "answer": "100.235", "rounding_up": True},
            {"number": "23.875", "decimal_places": 2, "answer": "23.88", "rounding_up": True},
            {"number": "5.5555", "decimal_places": 3, "answer": "5.556", "rounding_up": True},
            {"number": "99.949", "decimal_places": 2, "answer": "99.95", "rounding_up": True}
        ]
        
        # New questions for stage 2.2 (from your spreadsheet)
        self.stage2_2_questions = [
            {"number": "3.4461", "decimal_places": 2, "answer": "3.45", "rounding_up": True},
            {"number": "14.2375", "decimal_places": 2, "answer": "14.24", "rounding_up": True},
            {"number": "0.12678", "decimal_places": 3, "answer": "0.127", "rounding_up": True},
            {"number": "88.7541", "decimal_places": 2, "answer": "88.75", "rounding_up": False},
            {"number": "5.12389", "decimal_places": 2, "answer": "5.12", "rounding_up": False}
        ]
        
        # Initialize the question_sets dictionary
        self.question_sets = {
            STAGES["ROUNDING_1DP_NO_UP"]: self.stage1_1_questions,
            STAGES["ROUNDING_1DP_WITH_UP"]: self.stage1_2_questions,
            STAGES["ROUNDING_1DP_BOTH"]: self.stage1_3_questions,
            STAGES["ROUNDING_2DP"]: self.stage2_1_questions,
            STAGES["ROUNDING_2DP_STAGE_2"]: self.stage2_2_questions
        }


    def generate_question(self, stage_rules, learning_sequence=None):
        """Generates a question based on stage rules."""
        current_stage = learning_sequence.get_current_stage() if learning_sequence else None

        # For practice questions
        if stage_rules.get("avoid_rounding_up", False) and current_stage == STAGES["ROUNDING_1DP_NO_UP"]:
            return self._get_unused_question(self.stage1_1_questions, STAGES["ROUNDING_1DP_NO_UP"], learning_sequence)
        elif stage_rules.get("must_round_up", False) and current_stage == STAGES["ROUNDING_1DP_WITH_UP"]:
            return self._get_unused_question(self.stage1_2_questions, STAGES["ROUNDING_1DP_WITH_UP"], learning_sequence)
        elif stage_rules.get("mixed_rounding", False) and current_stage == STAGES["ROUNDING_1DP_BOTH"]:
            return self._get_unused_question(self.stage1_3_questions, STAGES["ROUNDING_1DP_BOTH"], learning_sequence)
        # In the generate_question method, add this after the other condition checks
        elif stage_rules.get("mixed_rounding", False) and current_stage == STAGES["ROUNDING_2DP"]:
            return self._get_unused_question(self.stage2_1_questions, STAGES["ROUNDING_2DP"], learning_sequence)
        elif stage_rules.get("mixed_rounding", False) and current_stage == STAGES["ROUNDING_2DP_STAGE_2"]:
            return self._get_unused_question(self.stage2_2_questions, STAGES["ROUNDING_2DP_STAGE_2"], learning_sequence)
        elif stage_rules.get("must_have_nines", False):
        # For stretch questions...
            return self._get_unused_question(self.stage2_1_questions + self.stage2_2_questions, STAGES["ROUNDING_2DP"], learning_sequence)
        elif stage_rules.get("must_have_nines", False):
            # For stretch questions, dynamically generate them
            base_question = random.choice(self.stage1_1_questions + self.stage1_2_questions)
            
            # Modify the number to have a 9 in the rounding position
            num_parts = base_question["number"].split('.')
            decimal_part = '9' + num_parts[1][1:]
            
            # Add random digits if needed for the specified length
            digits = random.choice(stage_rules["digits_after_decimal"]) if isinstance(stage_rules.get("digits_after_decimal"), list) else 2
            
            while len(decimal_part) < digits:
                decimal_part += str(random.randint(0, 9))
                
            new_number = num_parts[0] + '.' + decimal_part
            
            # Calculate the correct answer (always rounds up for 9)
            whole_part = int(num_parts[0])
            answer = str(whole_part + 1) + '.0'
            
            return {
                "number": new_number,
                "decimal_places": 1,
                "answer": answer,
                "rounding_up": True
            }
        else:
            # Default case: mix questions from all pools
            all_questions = self.stage1_1_questions + self.stage1_2_questions + self.stage1_3_questions
            return random.choice(all_questions)

    def _get_unused_question(self, question_set, stage, learning_sequence):
        """Get a question that hasn't been used yet, or reset if all used."""
        if not learning_sequence:
            return random.choice(question_set)
            
        used_indices = learning_sequence.get_used_questions(stage)
        available_indices = set(range(len(question_set))) - used_indices
        
        # If all questions have been used, reset the tracking
        if not available_indices:
            learning_sequence.reset_used_questions(stage)
            available_indices = set(range(len(question_set)))
            
        # Select a random unused question
        question_idx = random.choice(list(available_indices))
        question = question_set[question_idx]
        
        # Mark this question as used
        learning_sequence.add_used_question(stage, question_idx)
        
        return question

    def generate_distractors(self, question):
        """Generates distractors based on common misconceptions."""
        number = question["number"]
        decimal_places = question["decimal_places"]
        correct_answer = question["answer"]
        
        # Parse the original number
        num = decimal.Decimal(number)
        
        # Create the appropriate quantize value (e.g., Decimal('0.1') for 1 decimal place)
        quantize_value = decimal.Decimal('0.1' + '0' * (decimal_places - 1)) if decimal_places > 0 else decimal.Decimal('1')
        
        # Generate distractors
        distractors = []
        
        # Distractor 1: Not rounding correctly
        if question["rounding_up"]:
            # Should round up but didn't
            distractor = str(num.quantize(quantize_value, rounding=decimal.ROUND_DOWN))
            distractors.append(distractor)
        else:
            # Shouldn't round up but did
            distractor = str(num.quantize(quantize_value, rounding=decimal.ROUND_UP))
            distractors.append(distractor)
            
        # Distractor 2: Rounding to wrong decimal place
        wrong_places = decimal_places + 1
        wrong_quantize_value = decimal.Decimal('0.1' + '0' * (wrong_places - 1)) if wrong_places > 0 else decimal.Decimal('1')
        distractor = str(num.quantize(wrong_quantize_value))
        distractors.append(distractor)
        
        # Distractor 3: Rounding to the nearest whole number
        distractor = str(num.quantize(decimal.Decimal('1'))).rstrip(".0")
        distractors.append(distractor)
        
        # Remove any duplicates and the correct answer
        distractors = [d for d in distractors if d != correct_answer]
        
        # If we have fewer than 3 distractors, add some
        while len(distractors) < 3:
            # Generate a random distractor by slightly altering the correct answer
            random_distractor = str(float(correct_answer) + random.choice([0.1, -0.1, 0.01, -0.01]))
            if random_distractor not in distractors and random_distractor != correct_answer:
                distractors.append(random_distractor)
                
        return distractors[:3]  # Return exactly 3 distractors

    def format_multiple_choice(self, question):
        """Formats a question as multiple choice."""
        correct_answer = question["answer"]
        distractors = self.generate_distractors(question)
        
        # Combine correct answer and distractors
        all_choices = [correct_answer] + distractors
        random.shuffle(all_choices)  # Randomize the order
        
        # Map to A, B, C, D
        choices = {
            "A": all_choices[0],
            "B": all_choices[1],
            "C": all_choices[2],
            "D": all_choices[3]
        }
        
        # Find which letter is the correct answer
        correct_letter = next(letter for letter, answer in choices.items() if answer == correct_answer)
        
        return {
            "question_text": f"Round {question['number']} to {question['decimal_places']} decimal place{'s' if question['decimal_places'] > 1 else ''}",
            "choices": choices,
            "correct_letter": correct_letter,
            "original_question": question
        }