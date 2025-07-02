"""
Enhanced Student Profile for AI Personalization
File: models/student_profile.py
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import json

@dataclass
class QuestionResult:
    """Individual question result for tracking"""
    question_id: str
    stage: str
    topic: str = "rounding"  # NEW: Track which topic this question belongs to
    is_correct: bool = False
    student_answer: str = ""
    correct_answer: str = ""
    response_time_seconds: float = 0
    misconception_type: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)

@dataclass
class StudentProfile:
    """Comprehensive student profile for AI personalization with multi-topic support"""
    
    # Basic performance tracking
    total_questions: int = 0
    total_correct: int = 0
    consecutive_correct: int = 0
    consecutive_errors: int = 0
    current_stage: str = "1.1"
    current_topic: str = "rounding"  # NEW: Track current topic
    
    # Detailed tracking
    question_history: List[QuestionResult] = field(default_factory=list)
    misconception_patterns: Dict[str, int] = field(default_factory=dict)
    stage_performance: Dict[str, Dict[str, int]] = field(default_factory=dict)
    
    # NEW: Topic-specific performance tracking
    topic_performance: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    
    # Session context
    session_start_time: datetime = field(default_factory=datetime.now)
    total_time_spent_minutes: float = 0
    questions_this_session: int = 0
    
    # Emotional/behavioral indicators
    average_response_time: float = 0
    response_time_trend: str = "stable"  # "improving", "declining", "stable"
    engagement_level: str = "normal"  # "high", "normal", "low"
    
    # Learning preferences (discovered over time)
    learns_from_mistakes_quickly: bool = True
    prefers_encouragement: bool = True
    responds_to_challenges: bool = False
    
    def add_question_result(self, result: QuestionResult):
        """Add a new question result and update all metrics"""
        
        # Add to history
        self.question_history.append(result)
        
        # Update basic counters
        self.total_questions += 1
        self.questions_this_session += 1
        
        if result.is_correct:
            self.total_correct += 1
            self.consecutive_correct += 1
            self.consecutive_errors = 0
        else:
            self.consecutive_correct = 0
            self.consecutive_errors += 1
            
        # Update misconception tracking
        if result.misconception_type:
            if result.misconception_type not in self.misconception_patterns:
                self.misconception_patterns[result.misconception_type] = 0
            self.misconception_patterns[result.misconception_type] += 1
            
        # Update stage performance
        if result.stage not in self.stage_performance:
            self.stage_performance[result.stage] = {"attempted": 0, "correct": 0}
        self.stage_performance[result.stage]["attempted"] += 1
        if result.is_correct:
            self.stage_performance[result.stage]["correct"] += 1
            
        # NEW: Update topic-specific performance
        if result.topic not in self.topic_performance:
            self.topic_performance[result.topic] = {
                "questions_attempted": 0,
                "questions_correct": 0,
                "current_stage": result.stage,
                "last_activity": result.timestamp,
                "stages_completed": set(),
                "misconceptions": {}
            }
        
        topic_data = self.topic_performance[result.topic]
        topic_data["questions_attempted"] += 1
        if result.is_correct:
            topic_data["questions_correct"] += 1
        topic_data["current_stage"] = result.stage
        topic_data["last_activity"] = result.timestamp
        
        # Track topic-specific misconceptions
        if result.misconception_type:
            if result.misconception_type not in topic_data["misconceptions"]:
                topic_data["misconceptions"][result.misconception_type] = 0
            topic_data["misconceptions"][result.misconception_type] += 1
            
        # Update response time tracking
        self._update_response_time_metrics(result.response_time_seconds)
        
        # Update behavioral indicators
        self._update_behavioral_indicators()
        
    def _update_response_time_metrics(self, new_time: float):
        """Update response time trends"""
        if self.total_questions == 1:
            self.average_response_time = new_time
        else:
            # Rolling average
            self.average_response_time = (
                (self.average_response_time * (self.total_questions - 1) + new_time) / 
                self.total_questions
            )
            
        # Analyze trend (simple version)
        if len(self.question_history) >= 3:
            recent_times = [q.response_time_seconds for q in self.question_history[-3:]]
            if recent_times[-1] < recent_times[0] * 0.8:
                self.response_time_trend = "improving"
            elif recent_times[-1] > recent_times[0] * 1.2:
                self.response_time_trend = "declining"
            else:
                self.response_time_trend = "stable"
                
    def _update_behavioral_indicators(self):
        """Update learning preferences and engagement"""
        
        # Check if student learns from mistakes quickly
        if self.consecutive_errors >= 2:
            self.learns_from_mistakes_quickly = False
        elif self.consecutive_correct >= 3 and any(not q.is_correct for q in self.question_history[-5:]):
            self.learns_from_mistakes_quickly = True
            
        # Determine engagement level
        if self.questions_this_session > 10 and self.total_time_spent_minutes < 20:
            self.engagement_level = "high"
        elif self.average_response_time > 30:
            self.engagement_level = "low"
        else:
            self.engagement_level = "normal"
            
        # Check if student responds to challenges
        if self.success_rate > 0.8 and self.consecutive_correct >= 4:
            self.responds_to_challenges = True
            
    @property
    def success_rate(self) -> float:
        """Calculate overall success rate"""
        if self.total_questions == 0:
            return 0.0
        return self.total_correct / self.total_questions
    
    @property
    def current_stage_success_rate(self) -> float:
        """Success rate for current stage"""
        if self.current_stage not in self.stage_performance:
            return 0.0
        stage_data = self.stage_performance[self.current_stage]
        if stage_data["attempted"] == 0:
            return 0.0
        return stage_data["correct"] / stage_data["attempted"]
    
    @property
    def most_common_misconception(self) -> Optional[str]:
        """Get the most frequent misconception type"""
        if not self.misconception_patterns:
            return None
        return max(self.misconception_patterns.items(), key=lambda x: x[1])[0]
    
    @property
    def is_struggling(self) -> bool:
        """Determine if student is currently struggling"""
        return (
            self.consecutive_errors >= 2 or
            self.success_rate < 0.4 or
            self.current_stage_success_rate < 0.3
        )
    
    @property
    def is_excelling(self) -> bool:
        """Determine if student is excelling"""
        return (
            self.consecutive_correct >= 4 or
            (self.success_rate > 0.8 and self.total_questions >= 5)
        )
    
    def get_recent_performance_summary(self, last_n: int = 5) -> Dict[str, Any]:
        """Get summary of recent performance"""
        if len(self.question_history) == 0:
            return {"questions": 0, "correct": 0, "success_rate": 0.0}
            
        recent_questions = self.question_history[-last_n:]
        correct_count = sum(1 for q in recent_questions if q.is_correct)
        
        return {
            "questions": len(recent_questions),
            "correct": correct_count,
            "success_rate": correct_count / len(recent_questions),
            "average_time": sum(q.response_time_seconds for q in recent_questions) / len(recent_questions),
            "misconceptions": [q.misconception_type for q in recent_questions if q.misconception_type]
        }
    
    # NEW: Topic-specific methods
    
    def get_topic_performance(self, topic: str) -> Dict[str, Any]:
        """Get performance summary for a specific topic"""
        if topic not in self.topic_performance:
            return {
                "questions_attempted": 0,
                "questions_correct": 0,
                "success_rate": 0.0,
                "current_stage": "1.1",
                "last_activity": None,
                "misconceptions": {}
            }
        
        topic_data = self.topic_performance[topic]
        success_rate = (
            topic_data["questions_correct"] / topic_data["questions_attempted"] 
            if topic_data["questions_attempted"] > 0 else 0.0
        )
        
        return {
            "questions_attempted": topic_data["questions_attempted"],
            "questions_correct": topic_data["questions_correct"],
            "success_rate": success_rate,
            "current_stage": topic_data["current_stage"],
            "last_activity": topic_data["last_activity"],
            "misconceptions": topic_data["misconceptions"]
        }
    
    def get_topic_questions(self, topic: str) -> List[QuestionResult]:
        """Get all questions for a specific topic"""
        return [q for q in self.question_history if q.topic == topic]
    
    def get_topic_success_rate(self, topic: str) -> float:
        """Get success rate for a specific topic"""
        topic_questions = self.get_topic_questions(topic)
        if not topic_questions:
            return 0.0
        correct_count = sum(1 for q in topic_questions if q.is_correct)
        return correct_count / len(topic_questions)
    
    def is_struggling_in_topic(self, topic: str) -> bool:
        """Determine if student is struggling in a specific topic"""
        topic_questions = self.get_topic_questions(topic)
        if len(topic_questions) < 3:
            return False
        
        # Check recent performance in this topic
        recent_topic_questions = topic_questions[-3:]
        recent_correct = sum(1 for q in recent_topic_questions if q.is_correct)
        
        return (
            recent_correct == 0 or
            self.get_topic_success_rate(topic) < 0.4
        )
    
    def is_excelling_in_topic(self, topic: str) -> bool:
        """Determine if student is excelling in a specific topic"""
        topic_questions = self.get_topic_questions(topic)
        if len(topic_questions) < 3:
            return False
        
        # Check if recent performance is strong
        recent_topic_questions = topic_questions[-4:]
        recent_correct = sum(1 for q in recent_topic_questions if q.is_correct)
        
        return (
            recent_correct >= 3 or
            self.get_topic_success_rate(topic) > 0.8
        )
    
    def switch_topic(self, new_topic: str):
        """Switch to a different topic and update current topic tracking"""
        self.current_topic = new_topic
        
        # Reset consecutive counters when switching topics
        self.consecutive_correct = 0
        self.consecutive_errors = 0
        
        # Update current stage to the topic's current stage if available
        if new_topic in self.topic_performance:
            self.current_stage = self.topic_performance[new_topic]["current_stage"]
        else:
            # Default stage for new topics
            self.current_stage = "1.1"
    
    def get_overall_progress_summary(self) -> Dict[str, Any]:
        """Get a comprehensive progress summary across all topics"""
        topic_summaries = {}
        for topic in self.topic_performance:
            topic_summaries[topic] = self.get_topic_performance(topic)
        
        return {
            "total_questions": self.total_questions,
            "total_correct": self.total_correct,
            "overall_success_rate": self.success_rate,
            "current_topic": self.current_topic,
            "session_duration_minutes": self.total_time_spent_minutes,
            "topics": topic_summaries,
            "engagement_level": self.engagement_level,
            "learning_preferences": {
                "learns_from_mistakes_quickly": self.learns_from_mistakes_quickly,
                "prefers_encouragement": self.prefers_encouragement,
                "responds_to_challenges": self.responds_to_challenges
            }
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for session storage"""
        # Convert topic_performance sets to lists for JSON serialization
        topic_performance_serializable = {}
        for topic, data in self.topic_performance.items():
            topic_data = data.copy()
            if "stages_completed" in topic_data:
                topic_data["stages_completed"] = list(topic_data["stages_completed"])
            if "last_activity" in topic_data and isinstance(topic_data["last_activity"], datetime):
                topic_data["last_activity"] = topic_data["last_activity"].isoformat()
            topic_performance_serializable[topic] = topic_data
        
        return {
            "total_questions": self.total_questions,
            "total_correct": self.total_correct,
            "consecutive_correct": self.consecutive_correct,
            "consecutive_errors": self.consecutive_errors,
            "current_stage": self.current_stage,
            "current_topic": self.current_topic,
            "misconception_patterns": self.misconception_patterns,
            "stage_performance": self.stage_performance,
            "topic_performance": topic_performance_serializable,
            "session_start_time": self.session_start_time.isoformat(),
            "total_time_spent_minutes": self.total_time_spent_minutes,
            "questions_this_session": self.questions_this_session,
            "average_response_time": self.average_response_time,
            "response_time_trend": self.response_time_trend,
            "engagement_level": self.engagement_level,
            "learns_from_mistakes_quickly": self.learns_from_mistakes_quickly,
            "prefers_encouragement": self.prefers_encouragement,
            "responds_to_challenges": self.responds_to_challenges,
            # Note: question_history excluded for session storage size
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'StudentProfile':
        """Create from dictionary (session restoration)"""
        profile = cls()
        
        profile.total_questions = data.get("total_questions", 0)
        profile.total_correct = data.get("total_correct", 0)
        profile.consecutive_correct = data.get("consecutive_correct", 0)
        profile.consecutive_errors = data.get("consecutive_errors", 0)
        profile.current_stage = data.get("current_stage", "1.1")
        profile.current_topic = data.get("current_topic", "rounding")
        profile.misconception_patterns = data.get("misconception_patterns", {})
        profile.stage_performance = data.get("stage_performance", {})
        profile.total_time_spent_minutes = data.get("total_time_spent_minutes", 0)
        profile.questions_this_session = data.get("questions_this_session", 0)
        profile.average_response_time = data.get("average_response_time", 0)
        profile.response_time_trend = data.get("response_time_trend", "stable")
        profile.engagement_level = data.get("engagement_level", "normal")
        profile.learns_from_mistakes_quickly = data.get("learns_from_mistakes_quickly", True)
        profile.prefers_encouragement = data.get("prefers_encouragement", True)
        profile.responds_to_challenges = data.get("responds_to_challenges", False)
        
        # Restore topic performance
        topic_performance_data = data.get("topic_performance", {})
        for topic, topic_data in topic_performance_data.items():
            restored_data = topic_data.copy()
            if "stages_completed" in restored_data:
                restored_data["stages_completed"] = set(restored_data["stages_completed"])
            if "last_activity" in restored_data and isinstance(restored_data["last_activity"], str):
                try:
                    restored_data["last_activity"] = datetime.fromisoformat(restored_data["last_activity"])
                except:
                    restored_data["last_activity"] = datetime.now()
            profile.topic_performance[topic] = restored_data
        
        # Parse session start time
        if "session_start_time" in data:
            try:
                profile.session_start_time = datetime.fromisoformat(data["session_start_time"])
            except:
                profile.session_start_time = datetime.now()
        
        return profile