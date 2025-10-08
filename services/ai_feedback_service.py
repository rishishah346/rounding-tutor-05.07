"""
AI Feedback Service - Generates personalized explanations for incorrect answers
File: services/ai_feedback_service.py
"""

from services.llm_service import LLMService
from services.ai_context_builder import AIContextBuilder
from helpers.session_helper import get_student_profile
import logging

logger = logging.getLogger(__name__)

class AIFeedbackService:
    """Handles AI-powered feedback generation for student mistakes"""
    
    def __init__(self):
        self.llm_service = LLMService()
        self.context_builder = AIContextBuilder()
        self.conversation_history = {}  # Session-based memory: {session_id: [messages]}
        
    def generate_feedback(self, question_data: dict, verification_steps: dict, 
                     misconception_data: dict, student_context: dict, 
                     session_id: str, attempt_number: int = 1) -> str:
        """
        Generate AI-powered feedback for an incorrect answer
        
        Args:
            question_data: The question that was asked
            verification_steps: Mathematical verification details
            misconception_data: Enhanced misconception analysis
            student_context: Student performance context
            session_id: Session identifier for conversation memory
            
        Returns:
            AI-generated feedback string
        """
        
        # Build comprehensive context
        full_context = self.context_builder.build_feedback_context(
            question_data, 
            verification_steps, 
            False,  # is_correct = False since we only use AI for wrong answers
            misconception_data
        )
        
        # Create the system prompt
        system_prompt = self._build_system_prompt()
        
        # Create the user prompt with all context
        user_prompt = self._build_user_prompt(full_context, misconception_data, attempt_number)
        
        # Get or create conversation history for this session
        if session_id not in self.conversation_history:
            self.conversation_history[session_id] = []
        
        # Add current exchange to history
        conversation = self.conversation_history[session_id].copy()
        conversation.append({
            "role": "user",
            "content": user_prompt
        })
        
        # Get AI response
        try:
            ai_response = self.llm_service.get_completion(
                prompt={
                    "system": system_prompt,
                    "user": user_prompt
                },
                conversation_history=conversation
            )
            
            # Verify the response meets requirements
            if self._verify_response(ai_response, misconception_data):
                # Add to conversation history for future context
                self.conversation_history[session_id].append({
                    "role": "user", 
                    "content": user_prompt
                })
                self.conversation_history[session_id].append({
                    "role": "assistant",
                    "content": ai_response
                })
                
                # Limit history to last 10 exchanges to prevent token overflow
                if len(self.conversation_history[session_id]) > 20:
                    self.conversation_history[session_id] = self.conversation_history[session_id][-20:]
                
                return ai_response
            else:
                logger.warning("AI response failed verification, using fallback")
                return self._generate_fallback_feedback(misconception_data, verification_steps)
                
        except Exception as e:
            logger.error(f"AI feedback generation failed: {e}")
            return self._generate_fallback_feedback(misconception_data, verification_steps)
    
    def _build_system_prompt(self) -> str:
        """Build the system prompt that defines AI behavior"""
        return """You are a mathematics tutor helping students learn decimal rounding. Your role is to provide clear, personalized feedback when students make mistakes.

CORE TEACHING PRINCIPLES:
- Focus on building understanding, not just memorizing procedures
- Use clear, language appropriate for students in their early teens
- Be encouraging and supportive, especially when students are struggling
- Never make students feel bad about mistakes - they're learning opportunities

FEEDBACK REQUIREMENTS:
1. Keep explanations under 100 words
2. Start with brief acknowledgment of the mistake
3. Explain what went wrong using the student's specific numbers or work
4. Guide them to the correct approach
5. Reinforce the key concept they need to remember
6. This is ONE-WAY feedback - the student CANNOT reply to you, so never ask questions or invite responses

PERSONALIZATION GUIDELINES:
- Adjust your explanation based on the student's performance pattern
- If they're struggling (multiple errors): Break it down into smaller steps, be extra patient
- If they're progressing well: Be brief and focus on the key point they missed
- If this is a repeated mistake: Acknowledge they've seen this before and try a different angle

LANGUAGE RULES:
- Use "you" to speak directly to the student
- Avoid saying "let's" or "we" - focus on THEIR work
- Reference their specific numbers and choices
- Never use phrases like "magic", "trick", "just remember", or "simply"
- Avoid rhetorical questions that might confuse
- NEVER invite a response with phrases like "Let me know...", "Does this make sense?", "Any questions?", "Feel free to ask...", etc.
- Do NOT use questions at the end of feedback - make statements instead

ENCOURAGEMENT RULES:
- Any encouragement must be DIRECTLY related to the specific mathematical concept being practiced
- Use phrases that reference the actual skill being learned (the specific operation, rule, or process)
- NEVER use generic phrases like "Counting is getting easier!", "Math is fun!", "Keep it up!" unless they directly relate to what the student is currently learning
- If you can't tie encouragement to the specific concept in this question, skip it entirely
- Good examples: "You're getting better at identifying [the relevant element]!", "You're mastering [the specific rule]!", "Your understanding of [the concept] is improving!"
- Bad examples: Generic praise that could apply to any math topic or unrelated skills

MEMORY:
- You have access to this conversation's history
- If your previous explanation DID work but they made the mistake again later: use the same approach that worked before
- If your previous explanation DIDN'T work and they made the mistake again: try a completely different approach
- If after trying a different approach they still get it wrong: try yet another angle - vary your explanations until something clicks

CRITICAL: Your explanation must directly address the specific misconception. Don't just restate the general rule - explain what they did wrong and why the correct approach is different."""

    def _build_user_prompt(self, full_context: dict, misconception_data: dict, attempt_number: int = 1) -> str:
        """Build the user prompt with all relevant context"""
        
        # Extract key information
        question = full_context["question_context"]["question_text"]
        student_choice = full_context["question_context"]["student_choice"]
        correct_answer = full_context["question_context"]["correct_answer"]
        
        misconception = misconception_data.get("ai_context", {})
        what_student_did = misconception.get("what_student_did", "Made an error")
        what_should_happen = misconception.get("what_should_happen", "Follow the correct rounding process")
        key_concept_missed = misconception.get("key_concept_missed", "rounding rule")
        
        # Student performance context
        student_perf = full_context["student_context"]["performance_summary"]
        is_struggling = full_context["learning_context"]["is_struggling"]
        
        prompt = f"""Generate feedback for this student's mistake:

QUESTION: {question}
STUDENT'S ANSWER: Choice {student_choice}
CORRECT ANSWER: Choice {correct_answer}

WHAT WENT WRONG:
{what_student_did}

WHAT SHOULD HAVE HAPPENED:
{what_should_happen}

KEY CONCEPT THEY MISSED:
{key_concept_missed}

STUDENT CONTEXT:
- Total questions attempted: {student_perf['total_questions']}
- Success rate: {int(student_perf['success_rate'] * 100)}%
- Currently struggling: {'Yes' if is_struggling else 'No'}
- Consecutive correct before this: {student_perf['consecutive_correct']}

ATTEMPT CONTEXT:
- This is attempt #{attempt_number} for this misconception type
{'- Template explanation was already provided' if attempt_number > 1 else '- This is the first time seeing this misconception'}
{'- Student made the same mistake again, need different approach' if attempt_number > 1 else ''}

Generate a personalized explanation that:
1. Acknowledges their specific mistake with their numbers
2. Explains clearly what went wrong
3. Shows them the correct approach
4. Is under 100 words
5. Addresses the misconception (not just restating the rule)

Your response should be ONLY the feedback text - no preamble, no meta-commentary."""

        return prompt
    
    def _verify_response(self, response: str, misconception_data: dict) -> bool:
        """
        Verify AI response meets quality requirements
        
        Returns:
            bool: True if response passes all checks
        """
        
        if not response or len(response) < 10:
            logger.warning("Response too short")
            return False
        
        # Check word count (roughly)
        word_count = len(response.split())
        if word_count > 120:  # Slightly over 100 to allow some flexibility
            logger.warning(f"Response too long: {word_count} words")
            return False
        
        # Check for prohibited phrases
        prohibited = ["magic", "trick", "simply", "just remember", "easy"]
        response_lower = response.lower()
        for phrase in prohibited:
            if phrase in response_lower:
                logger.warning(f"Response contains prohibited phrase: {phrase}")
                return False
        
        # Verify it references the specific misconception type
        misconception_type = misconception_data.get("type", "")
        key_terms = {
            "rounding_direction_confusion": ["round up", "round down", "5 or", "less than 5"],
            "decimal_place_confusion": ["decimal place", "first", "second", "third"],
            "place_value_confusion": ["whole number", "decimal point"],
            "decimal_notation_confusion": ["zero", "0"]
        }
        
        if misconception_type in key_terms:
            has_relevant_term = any(term in response_lower for term in key_terms[misconception_type])
            if not has_relevant_term:
                logger.warning(f"Response doesn't address misconception type: {misconception_type}")
                return False
        
        return True
    
    def _generate_fallback_feedback(self, misconception_data: dict, verification_steps: dict) -> str:
        """
        Generate template-based fallback feedback if AI fails
        
        This uses the existing content_service logic as a safety net
        """
        from services.content_service import ContentService
        content_service = ContentService()
        
        # Create a minimal question dict for the content service
        minimal_question = {
            "choices": {},
            "student_answer": "",
            "original_question": {
                "number": verification_steps.get("original_number", ""),
                "decimal_places": verification_steps.get("decimal_places", 1)
            }
        }
        
        return content_service._generate_specific_misconception_feedback(
            minimal_question,
            verification_steps,
            misconception_data
        )
    
    def clear_session_history(self, session_id: str):
        """Clear conversation history for a session"""
        if session_id in self.conversation_history:
            del self.conversation_history[session_id]
    
    def get_session_history_summary(self, session_id: str) -> dict:
        """Get summary of conversation history for debugging"""
        if session_id not in self.conversation_history:
            return {"exchanges": 0, "history": []}
        
        history = self.conversation_history[session_id]
        return {
            "exchanges": len(history) // 2,
            "history": [
                {
                    "role": msg["role"],
                    "preview": msg["content"][:100] + "..." if len(msg["content"]) > 100 else msg["content"]
                }
                for msg in history
            ]
        }