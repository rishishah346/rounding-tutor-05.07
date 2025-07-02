# test_claude_api.py
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("LLM_API_KEY")
api_url = os.environ.get("LLM_API_URL")
model = os.environ.get("LLM_MODEL", "claude-3-haiku-20240307")

print(f"Testing Claude API...")
print(f"API URL: {api_url}")
print(f"Model: {model}")
print(f"API Key: {api_key[:10]}...{api_key[-10:] if api_key else 'None'}")

headers = {
    "Content-Type": "application/json",
    "x-api-key": api_key,
    "anthropic-version": "2023-06-01"
}

# Simple test payload
data = {
    "model": model,
    "system": "You are a helpful assistant.",
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 50
}

try:
    print(f"\nSending request...")
    print(f"Headers: {dict(headers)}")
    print(f"Payload: {json.dumps(data, indent=2)}")
    
    response = requests.post(
        api_url,
        headers=headers,
        json=data,
        timeout=10
    )
    
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body: {response.text}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✅ SUCCESS!")
        print(f"Message: {result.get('content', [{}])[0].get('text', 'No text found')}")
    else:
        print(f"\n❌ FAILED!")
        
except Exception as e:
    print(f"\n💥 EXCEPTION: {e}")