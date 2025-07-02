# test_endpoint_exists.py
import requests

try:
    # Test if Flask app is running
    response = requests.get('http://localhost:5000/', timeout=5)
    print(f"Flask app status: {response.status_code}")
    
    # Test if our AI endpoint exists (even if it fails, it should return an error, not hang)
    response = requests.post(
        'http://localhost:5000/api/ai/message',
        json={'message_type': 'test'},
        timeout=10
    )
    print(f"AI endpoint status: {response.status_code}")
    print(f"Response: {response.text}")
    
except requests.exceptions.Timeout:
    print("❌ Request timed out - Flask app may not be running or endpoint may be hanging")
except requests.exceptions.ConnectionError:
    print("❌ Cannot connect to Flask app - make sure it's running on localhost:5000")
except Exception as e:
    print(f"❌ Error: {e}")