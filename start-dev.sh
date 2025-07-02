#!/bin/bash

# Step 1: Activate your Python virtual environment
source fresh_venv/bin/activate

# Step 2: Start Flask app in the background on port 5001
flask run --port=5001 &

# Step 3: Start BrowserSync and watch files
browser-sync start --proxy "localhost:5001" --files "rounding-tutor/**/*.*"
