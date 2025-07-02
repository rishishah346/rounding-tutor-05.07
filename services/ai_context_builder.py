"""
AI Context Builder - Packages misconception analysis and student data for AI consumption
File: services/ai_context_builder.py
"""

from typing import Dict, Any, Optional
from helpers.session_helper import get_student_profile, get_student_context_for_ai

class AIContextBuilder:
    """Builds rich context packages for AI personalization"""
    
    def __init__(self):
        pass
    
    def build_feedback_context(self, question_data: Dict, verification_steps: Dict, 
                              is_correct: bool, misconception_data: Optional[Dict]) -> Dict:
        """Build comprehensive context for AI feedback generation"""
        
        # Get student profile data
        student_profile = get_student_profile()
        student_context = get_student_context_for_ai()
        
        # Build the complete context package
        context = {
            # Question details
            "question_context": {
                "original_number": question_data.get("original_question", {}).get("number", ""),
                "target_decimal_places": question_data.get("original_question", {}).get("decimal_places", 1),
                "question_text": question_data.get("question_text", ""),
                "student_choice": question_data.get("student_answer", ""),
                "correct_answer": question_data.get("correct_letter", ""),
                "all_choices": question_data.get("choices", {})
            },
            
            # Mathematical analysis
            "mathematical_analysis": {
                "is_correct": is_correct,
                "verification_steps": verification_steps,
                "original_number": verification_steps.get("original_number", ""),
                "target_digit": verification_steps.get("target_digit", ""),
                "next_digit": verification_steps.get("next_digit", ""),
                "should_round_up": verification_steps.get("round_up", False),
                "correct_final_answer": verification_steps.get("correct_answer", "")
            },
            
            # Enhanced misconception analysis (if incorrect)
            "misconception_analysis": self._process_misconception_data(misconception_data) if misconception_data else None,
            
            # Student context
            "student_context": student_context,
            
            # Learning context
            "learning_context": {
                "current_stage": student_context["performance_summary"]["current_stage"],
                "is_struggling": student_context["learning_indicators"]["is_struggling"],
                "is_excelling": student_context["learning_indicators"]["is_excelling"],
                "recent_performance": student_context["recent_performance"],
                "common_misconceptions": list(student_context["misconception_patterns"].keys())
            }
        }
        
        return context
    
    def _process_misconception_data(self, misconception_data: Dict) -> Dict:
        """Process the enhanced misconception data for AI consumption"""
        
        if not misconception_data:
            return None
            
        return {
            # Basic misconception info
            "type": misconception_data.get("type", "unknown_error"),
            "student_action": misconception_data.get("student_action", "unknown_action"),
            "correct_concept": misconception_data.get("correct_concept", "unknown_concept"),
            
            # Detailed analysis
            "what_student_did": misconception_data.get("ai_context", {}).get("what_student_did", "Made an error"),
            "what_should_happen": misconception_data.get("ai_context", {}).get("what_should_happen", "Follow correct process"),
            "key_concept_missed": misconception_data.get("ai_context", {}).get("key_concept_missed", "Basic concept"),
            "suggested_focus": misconception_data.get("ai_context", {}).get("suggested_focus", "Review fundamentals"),
            
            # Difficulty factors
            "difficulty_factors": misconception_data.get("difficulty_factors", []),
            
            # Choice analysis
            "choice_interpretation": misconception_data.get("choice_analysis", {}).get("interpretation", ""),
            "missed_process": misconception_data.get("choice_analysis", {}).get("correct_process", ""),
            
            # Original text for backward compatibility
            "original_misconception_text": misconception_data.get("original_text", "")
        }
    
    def extract_legacy_misconception_text(self, misconception_data: Optional[Dict]) -> str:
        """Extract misconception text in the format your current system expects"""
        
        if not misconception_data:
            return None
            
        # Return the original text for backward compatibility with content_service.py
        return misconception_data.get("original_text", "There seems to be a misunderstanding of the rounding process.")
    
    def build_ai_prompt_context(self, feedback_context: Dict) -> Dict:
        """Build specific context for AI prompt generation (Phase 3)"""
        
        return {
            # Student state summary
            "student_state": {
                "performance_level": self._assess_performance_level(feedback_context["student_context"]),
                "emotional_state": self._assess_emotional_state(feedback_context),
                "learning_pattern": self._assess_learning_pattern(feedback_context["student_context"]),
                "motivation_needs": self._assess_motivation_needs(feedback_context)
            },
            
            # Question difficulty assessment
            "question_difficulty": {
                "complexity_factors": feedback_context.get("misconception_analysis", {}).get("difficulty_factors", []),
                "stage_appropriateness": self._assess_stage_difficulty(feedback_context),
                "concept_level": self._assess_concept_level(feedback_context)
            },
            
            # Personalization hints
            "personalization_hints": {
                "prefers_encouragement": feedback_context["student_context"]["learning_preferences"]["prefers_encouragement"],
                "learns_quickly": feedback_context["student_context"]["learning_preferences"]["learns_from_mistakes_quickly"],
                "responds_to_challenges": feedback_context["student_context"]["learning_preferences"]["responds_to_challenges"],
                "engagement_level": feedback_context["student_context"]["learning_indicators"]["engagement_level"]
            },
            
            # Suggested AI approach
            "suggested_approach": self._suggest_ai_approach(feedback_context)
        }
    
    def _assess_performance_level(self, student_context: Dict) -> str:
        """Assess overall student performance level"""
        success_rate = student_context["performance_summary"]["success_rate"]
        consecutive_correct = student_context["performance_summary"]["consecutive_correct"]
        
        if success_rate > 0.8 and consecutive_correct >= 3:
            return "excelling"
        elif success_rate > 0.6:
            return "progressing_well"
        elif success_rate > 0.4:
            return "struggling_some"
        else:
            return "struggling_significantly"
    
    def _assess_emotional_state(self, feedback_context: Dict) -> str:
        """Assess student's likely emotional state"""
        is_correct = feedback_context["mathematical_analysis"]["is_correct"]
        consecutive_errors = feedback_context["student_context"]["performance_summary"]["consecutive_errors"]
        is_struggling = feedback_context["learning_context"]["is_struggling"]
        
        if is_correct and not is_struggling:
            return "confident"
        elif is_correct and is_struggling:
            return "relieved"
        elif not is_correct and consecutive_errors >= 2:
            return "frustrated"
        elif not is_correct:
            return "confused"
        else:
            return "neutral"
    
    def _assess_learning_pattern(self, student_context: Dict) -> str:
        """Assess how the student learns best"""
        learns_quickly = student_context["learning_preferences"]["learns_from_mistakes_quickly"]
        response_trend = student_context["learning_indicators"]["response_time_trend"]
        
        if learns_quickly and response_trend == "improving":
            return "fast_learner"
        elif learns_quickly:
            return "quick_recovery"
        elif response_trend == "improving":
            return "steady_improver"
        else:
            return "needs_repetition"
    
    def _assess_motivation_needs(self, feedback_context: Dict) -> str:
        """Assess what kind of motivation the student needs"""
        emotional_state = self._assess_emotional_state(feedback_context)
        is_struggling = feedback_context["learning_context"]["is_struggling"]
        is_excelling = feedback_context["learning_context"]["is_excelling"]
        
        if emotional_state == "frustrated":
            return "reassurance_and_support"
        elif emotional_state == "confident" and is_excelling:
            return "challenge_and_celebration"
        elif is_struggling:
            return "encouragement_and_guidance"
        else:
            return "positive_reinforcement"
    
    def _assess_stage_difficulty(self, feedback_context: Dict) -> str:
        """Assess if question difficulty matches student level"""
        current_stage = feedback_context["learning_context"]["current_stage"]
        difficulty_factors = feedback_context.get("misconception_analysis", {}).get("difficulty_factors", [])
        
        if len(difficulty_factors) > 2:
            return "challenging_for_stage"
        elif len(difficulty_factors) == 0:
            return "easy_for_stage"
        else:
            return "appropriate_for_stage"
    
    def _assess_concept_level(self, feedback_context: Dict) -> str:
        """Assess the conceptual level of the question"""
        misconception_type = feedback_context.get("misconception_analysis", {}).get("type", "")
        
        concept_levels = {
            "decimal_place_confusion": "foundational",
            "rounding_direction_confusion": "procedural",
            "place_value_confusion": "foundational", 
            "decimal_notation_confusion": "advanced"
        }
        
        return concept_levels.get(misconception_type, "procedural")
    
    def _suggest_ai_approach(self, feedback_context: Dict) -> str:
        """Suggest the best AI approach for this student/situation"""
        motivation_needs = self._assess_motivation_needs(feedback_context)
        performance_level = self._assess_performance_level(feedback_context["student_context"])
        emotional_state = self._assess_emotional_state(feedback_context)
        
        if emotional_state == "frustrated":
            return "gentle_supportive_with_concrete_help"
        elif performance_level == "excelling":
            return "celebratory_with_next_challenge"
        elif motivation_needs == "encouragement_and_guidance":
            return "encouraging_with_specific_strategy"
        else:
            return "positive_with_clear_explanation"