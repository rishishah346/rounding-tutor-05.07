"""Configuration settings for the Rounding Tutor application."""
import os

# Session Configuration
SESSION_KEY = os.urandom(24)

# Learning Stages
STAGES = {
    "ROUNDING_1DP_NO_UP": "1.1",
    "ROUNDING_1DP_WITH_UP": "1.2",
    "ROUNDING_1DP_BOTH": "1.3",
    "ROUNDING_2DP": "2.1",  # Remains as 2.1
    "ROUNDING_2DP_STAGE_2": "2.2",  # New stage 2.2
    "STRETCH": "stretch",
    "COMPLETE": "complete"
}

# Advancement Criteria
ADVANCEMENT_CRITERIA = {
    "1.1": {"correct_required": 1},
    "1.2": {"correct_required": 1},
    "1.3": {"consecutive_correct_required": 2},
    "stretch_1": {"questions_required": 3}
}

# Question Generation Rules
QUESTION_RULES = {
    "1.1": {
        "decimal_places": 1,
        "digits_after_decimal": 2,
        "avoid_rounding_up": True,
        "avoid_rounding_nines": True,
        "example1": "Round 12.64 to 1 decimal place",
        "example2": "Round 5.462 to 1 decimal place"
    },
    "1.2": {
        "decimal_places": 1,
        "digits_after_decimal": 2,
        "must_round_up": True,
        "avoid_rounding_nines": True
    },
    "1.3": {
        "decimal_places": 1,
        "digits_after_decimal": [2, 3, 4],  # Random between 2-4
        "mixed_rounding": True,
        "avoid_rounding_nines": True
    },
    "2.1": {
        "decimal_places": [2, 3],
        "digits_after_decimal": [3, 4, 5],  # Random between 2-4
        "mixed_rounding": True,
        "avoid_rounding_nines": True,
        "example1": "Round 0.857 to 2 decimal places",
        "example2": "Round 21.6782 to 3 decimal places"
    },
     "2.2": {
        "decimal_places": [2, 3],
        "digits_after_decimal": [3, 4, 5],
        "mixed_rounding": True,
        "avoid_rounding_nines": False
    },
    "stretch": {
        "decimal_places": 1,
        "digits_after_decimal": [2, 3, 4],  # Random between 2-4
        "must_have_nines": True,
        "example1": "Round 12.97 to 1 decimal place",
        "example2": "Round 0.952 to 1 decimal place"
    }
}
