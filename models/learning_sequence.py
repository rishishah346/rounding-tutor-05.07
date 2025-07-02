"""Controls the learning sequence and student progression."""
from config import STAGES, ADVANCEMENT_CRITERIA, QUESTION_RULES

class LearningSequence:
    """Controls the learning sequence and student progression."""

    def __init__(self):
        self.current_stage = STAGES["ROUNDING_1DP_NO_UP"]  # Start at stage 1.1
        self.correct_answers = 0
        self.consecutive_correct = 0
        self.questions_attempted = 0
        self.stage_results = {
            STAGES["ROUNDING_1DP_NO_UP"]: {"attempted": 0, "correct": 0},
            STAGES["ROUNDING_1DP_WITH_UP"]: {"attempted": 0, "correct": 0},
            STAGES["ROUNDING_1DP_BOTH"]: {"attempted": 0, "correct": 0},
            STAGES["ROUNDING_2DP"]: {"attempted": 0, "correct": 0}
        }
        self.showing_example = True  # Start with an example
        self.current_example = 1  # Start with the first example
        self.used_questions = {  # Track questions already shown to student
            STAGES["ROUNDING_1DP_NO_UP"]: set(),
            STAGES["ROUNDING_1DP_WITH_UP"]: set(),
            STAGES["ROUNDING_1DP_BOTH"]: set(),
            STAGES["ROUNDING_2DP"]: set(),
            STAGES["STRETCH"]: set()
        }

    def get_current_stage(self):
        """Returns the current learning stage."""
        return self.current_stage

    def get_stage_rules(self):
        """Gets the rules for generating questions in the current stage."""
        return QUESTION_RULES.get(self.current_stage, QUESTION_RULES[STAGES["ROUNDING_1DP_NO_UP"]])

    def update_progress(self, is_correct):
        """Updates student progress based on performance."""
        self.questions_attempted += 1
        
        # Update stage-specific results
        if self.current_stage in self.stage_results:
            self.stage_results[self.current_stage]["attempted"] += 1
            if is_correct:
                self.stage_results[self.current_stage]["correct"] += 1
        
        if is_correct:
            self.correct_answers += 1
            self.consecutive_correct += 1
        else:
            self.consecutive_correct = 0
        
        # Check for stage advancement criteria - keep existing stages
        if self.current_stage == STAGES["ROUNDING_1DP_NO_UP"] and is_correct:
            self.current_stage = STAGES["ROUNDING_1DP_WITH_UP"]  # Move to stage 1.2 after one correct
            self.consecutive_correct = 0
            self.showing_example = False
        elif self.current_stage == STAGES["ROUNDING_1DP_WITH_UP"] and is_correct:
            self.current_stage = STAGES["ROUNDING_1DP_BOTH"]  # Move to stage 1.3 after one correct
            self.consecutive_correct = 0
            self.showing_example = False
        elif self.current_stage == STAGES["ROUNDING_1DP_BOTH"] and self.consecutive_correct >= 2:
            # Move to 2dp examples instead of stretch or complete
            self.current_stage = STAGES["ROUNDING_2DP"]
            self.consecutive_correct = 0
            self.showing_example = True  # Show examples for 2dp content
            self.current_example = 1  # Reset to first example
        
        # Add the new progression rule for stage 2.1 to 2.2
        elif self.current_stage == STAGES["ROUNDING_2DP"] and self.consecutive_correct >= 2:
            # Move to stage 2.2 after two consecutive correct answers
            self.current_stage = STAGES["ROUNDING_2DP_STAGE_2"]
            self.consecutive_correct = 0
            self.showing_example = False
        
        # Add the new progression rule for stage 2.2 to stretch/complete
        elif self.current_stage == STAGES["ROUNDING_2DP_STAGE_2"] and is_correct:
            # Check if eligible for stretch content
            total_attempted = sum(stage["attempted"] for stage in self.stage_results.values())
            total_correct = sum(stage["correct"] for stage in self.stage_results.values())
            
            if total_attempted > 0 and (total_correct / total_attempted) >= 0.8:
                self.current_stage = STAGES["STRETCH"]  # Move to stretch after 80% correct
                self.consecutive_correct = 0
                self.showing_example = True  # Show examples for stretch content
                self.current_example = 1  # Reset to first example
            else:
                self.current_stage = STAGES["COMPLETE"]  # End lesson if not eligible for stretch


    def should_model_example(self):
        """Determines if we should show a model example."""
        return self.showing_example

    def next_example(self):
        """Advances to the next example or to practice questions."""
        print(f"next_example called: current_stage={self.current_stage}, current_example={self.current_example}, showing_example={self.showing_example}")
        
        self.current_example += 1

        # Force "showing_example" to False when we've seen example 2 in stage 1.1
        if self.current_stage == STAGES["ROUNDING_1DP_NO_UP"] and self.current_example > 2:
            self.showing_example = False
            print(" Forcing showing_example to False to move to practice questions")

        # Safety check to prevent jumping from example 1 to 3
        if self.current_stage == STAGES["ROUNDING_1DP_NO_UP"] and self.current_example > 2 and self.showing_example:
            # Set to exactly 2 to force showing the second example
            self.current_example = 2
            print(" Safety check triggered, setting current_example to 2")

        # If we've shown all examples for this stage, move to questions
        if ((self.current_stage == STAGES["ROUNDING_1DP_NO_UP"] and self.current_example > 2) or
            (self.current_stage == STAGES["ROUNDING_2DP"] and self.current_example > 2) or
            (self.current_stage == STAGES["STRETCH"] and self.current_example > 2)):
            self.showing_example = False
            print(" All examples shown, setting showing_example to False")

        print(f"next_example returning: current_example={self.current_example}, showing_example={self.showing_example}")

    def get_current_example_number(self):
        """Returns the current example number."""
        return self.current_example

    def is_showing_example(self):
        """Returns whether we're currently showing an example."""
        return self.showing_example

    def add_used_question(self, stage, question_idx):
        """Mark a question as used for the current stage."""
        if stage in self.used_questions:
            self.used_questions[stage].add(question_idx)

    def reset_used_questions(self, stage=None):
        """Reset the used questions tracking."""
        if stage:
            if stage in self.used_questions:
                self.used_questions[stage] = set()
        else:
            for key in self.used_questions:
                self.used_questions[key] = set()

    def get_used_questions(self, stage):
        """Get the set of used question indices for a stage."""
        return self.used_questions.get(stage, set())

    def reset(self):
        """Resets the learning sequence."""
        self.__init__()