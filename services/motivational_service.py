"""
Motivational Service for Rounding Tutor
Provides performance-based motivational messaging to enhance student feedback
"""

import random
from typing import Dict, Any, Optional

class MotivationalService:
    """Generates motivational messaging based on student performance and context."""
    
    def __init__(self):
        # Performance-based positive feedback templates - CONCISE
        self.positive_templates = {
            "struggling": [
                "Good! {mathematical_feedback} You're getting it!",
                "Nice! {mathematical_feedback} That's progress!",
                "Well done! {mathematical_feedback} Keep it up!",
                "Great! {mathematical_feedback} You're improving!",
                "Excellent! {mathematical_feedback} Much better!"
            ],
            "progressing": [
                "Good work! {mathematical_feedback}",
                "Nice job! {mathematical_feedback}",
                "Well done! {mathematical_feedback}",
                "Correct! {mathematical_feedback}",
                "Great! {mathematical_feedback}"
            ],
            "excelling": [
                "Perfect! {mathematical_feedback}",
                "Excellent! {mathematical_feedback}",
                "Outstanding! {mathematical_feedback}",
                "Superb! {mathematical_feedback}",
                "Brilliant! {mathematical_feedback}"
            ]
        }
        
        # Performance-based supportive feedback templates - POSITIVE & EMPOWERING for struggling
        self.supportive_templates = {
            "struggling": [
                "You're learning! {mathematical_feedback} Each practice builds your understanding.",
                "Good effort! {mathematical_feedback} Every mathematician practices to improve.",
                "Keep going! {mathematical_feedback}  Progress takes practice.",
                "Nice try! {mathematical_feedback} You're developing these skills step by step.",
                "Well done trying! {mathematical_feedback} Each attempt teaches you something."
            ],
            "progressing": [
                "Close! {mathematical_feedback}",
                "Almost! {mathematical_feedback}",
                "Good try! {mathematical_feedback}",
                "Nice attempt! {mathematical_feedback}",
                "So close! {mathematical_feedback}"
            ],
            "excelling": [
                "Oops! {mathematical_feedback}",
                "Almost! {mathematical_feedback}",
                "Close one! {mathematical_feedback}",
                "Good try! {mathematical_feedback}",
                "Nice attempt! {mathematical_feedback}"
            ]
        }
        
        # Misconception-specific encouragement - POSITIVE & EMPOWERING
        self.misconception_encouragement = {
            "place_value_confusion": "You're learning this step by step!",
            "rounding_direction_confusion": "The 5-or-more rule is coming together!",
            "decimal_place_confusion": "Counting is getting easier!",
            "rounding_to_whole_number": "Good progress with decimals!",
            "truncation_vs_rounding": "You're mastering the difference!",
            "general_rounding_error": "Each step builds your skills!",
            "nines_difficulty": "You're tackling the tough ones!",
            "borderline_case_5": "You're handling the challenging cases!"
        }
        
        # Stage transition celebration messages
        self.stage_transition_messages = {
            "1.1_to_1.2": "Great progress! You've mastered rounding down - now let's practice rounding up!",
            "1.2_to_1.3": "Excellent! You can round up and down - time to mix it up!",
            "1.3_to_2.1": "Outstanding! You've conquered 1 decimal place - ready for the next challenge?",
            "2.1_to_2.2": "Impressive! You're handling multiple decimal places really well!",
            "general": "Fantastic progress! You're ready for the next level of challenges."
        }
        
        # Consecutive achievement messages - SHORTER
        self.achievement_messages = {
            2: "Two in a row!",
            3: "Three straight!",
            4: "Four correct!",
            5: "Five in a row!",
            6: "Six straight!"
        }

    def get_motivational_context(self, is_correct: bool, student_context: Dict[str, Any], 
                               misconception_type: Optional[str] = None) -> str:
        """
        Generate motivational opening and closing based on performance.
        
        Args:
            is_correct: Whether the student answered correctly
            student_context: Dictionary containing performance metrics
            misconception_type: Type of misconception if answer was incorrect
            
        Returns:
            Template string with {mathematical_feedback} placeholder
        """
        performance_level = self._assess_performance_level(student_context)
        
        if is_correct:
            return self._get_positive_motivation(performance_level, student_context)
        else:
            return self._get_supportive_motivation(performance_level, student_context, misconception_type)

    def _assess_performance_level(self, context: Dict[str, Any]) -> str:
        """
        Assess student performance level based on context.
        Returns: "struggling", "progressing", or "excelling"
        """
        consecutive_correct = context.get('consecutive_correct', 0)
        questions_attempted = context.get('questions_attempted', 0)
        
        # Check for excelling pattern
        if consecutive_correct >= 3:
            return "excelling"
        
        # Check for REAL struggling pattern - be more careful here
        if questions_attempted >= 4 and consecutive_correct == 0:
            return "struggling"
        
        # Check recent performance for struggling - must have several attempts with no success
        if questions_attempted >= 6 and consecutive_correct <= 1:
            return "struggling"
        
        # Default to progressing (this includes most students)
        return "progressing"

    def _get_positive_motivation(self, performance_level: str, context: Dict[str, Any]) -> str:
        """Generate positive motivational message for correct answers."""
        consecutive_correct = context.get('consecutive_correct', 0)
        
        # Check for achievement milestone
        if consecutive_correct in self.achievement_messages:
            achievement_msg = self.achievement_messages[consecutive_correct]
            base_template = random.choice(self.positive_templates[performance_level])
            return f"{achievement_msg} {base_template}"
        
        # Regular positive feedback
        return random.choice(self.positive_templates[performance_level])

    def _get_supportive_motivation(self, performance_level: str, context: Dict[str, Any], 
                                 misconception_type: Optional[str] = None) -> str:
        """Generate supportive motivational message for incorrect answers."""
        base_template = random.choice(self.supportive_templates[performance_level])
        
        # Add misconception-specific encouragement if available
        if misconception_type and misconception_type in self.misconception_encouragement:
            encouragement = self.misconception_encouragement[misconception_type]
            # Insert encouragement after mathematical feedback
            template_parts = base_template.split('{mathematical_feedback}')
            if len(template_parts) == 2:
                return f"{template_parts[0]}{{mathematical_feedback}} {encouragement}{template_parts[1]}"
        
        return base_template

    def get_stage_transition_message(self, previous_stage: str, current_stage: str) -> str:
        """Generate celebration message for advancing to new stage."""
        transition_key = f"{previous_stage}_to_{current_stage}"
        
        if transition_key in self.stage_transition_messages:
            return self.stage_transition_messages[transition_key]
        else:
            return self.stage_transition_messages["general"]

    def add_custom_template(self, performance_level: str, is_positive: bool, template: str):
        """
        Add custom template for testing/customization.
        
        Args:
            performance_level: "struggling", "progressing", or "excelling"  
            is_positive: True for correct answers, False for incorrect
            template: Template string with {mathematical_feedback} placeholder
        """
        if is_positive:
            if performance_level in self.positive_templates:
                self.positive_templates[performance_level].append(template)
        else:
            if performance_level in self.supportive_templates:
                self.supportive_templates[performance_level].append(template)

    def get_performance_summary(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get summary of student performance for debugging/monitoring.
        
        Returns:
            Dictionary with performance analysis
        """
        return {
            "performance_level": self._assess_performance_level(context),
            "consecutive_correct": context.get('consecutive_correct', 0),
            "questions_attempted": context.get('questions_attempted', 0),
            "current_stage": context.get('current_stage', 'unknown'),
            "has_achievement": context.get('consecutive_correct', 0) in self.achievement_messages
        }