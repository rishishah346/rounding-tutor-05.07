"""Service for communicating with LLM APIs."""

import os
import requests
import json
import logging

logger = logging.getLogger(__name__)

class LLMService:
    """Service for interacting with LLM APIs."""
    
    def __init__(self, api_key=None):
        self.api_key = api_key or os.environ.get("LLM_API_KEY")
        self.api_url = os.environ.get("LLM_API_URL")
        self.model = os.environ.get("LLM_MODEL", "claude-3-haiku-20240307")
        
        if not self.api_key or not self.api_url:
            logger.warning("LLM API key or URL not set. AI companion will use fallback messages only.")
        
    def get_completion(self, prompt, conversation_history=None):
        """Gets a completion from the LLM API."""
        if not self.api_key or not self.api_url:
            return self._get_fallback_message(prompt)
        
        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01"
        }
        
        # Clean up conversation history - remove trailing whitespace
        messages = []
        if conversation_history:
            for msg in conversation_history:
                if isinstance(msg, dict) and 'content' in msg:
                    cleaned_msg = msg.copy()
                    cleaned_msg['content'] = str(msg['content']).strip()
                    messages.append(cleaned_msg)
                else:
                    messages.append(msg)
        
        # Add the new prompt if it's not already included
        if prompt.get("user") and not any(m.get("content") == prompt["user"] for m in messages):
            messages.append({"role": "user", "content": prompt["user"].strip()})
        
        data = {
            "model": self.model,
            "system": prompt.get("system", "You are a helpful assistant for students learning math.").strip(),
            "messages": messages,
            "max_tokens": 150,
            "temperature": 0.7
        }
        
        try:
            logger.debug(f"Sending request to LLM API: {json.dumps(data)[:200]}...")
            response = requests.post(
                self.api_url,
                headers=headers,
                data=json.dumps(data),
                timeout=10
            )
            response.raise_for_status()
            
            result = response.json()
            logger.debug(f"Received response from LLM API: {json.dumps(result)[:200]}...")
            
            # Extract and clean the content
            if "content" in result:
                content = result["content"]
                if isinstance(content, list) and len(content) > 0:
                    first_content = content[0]
                    if isinstance(first_content, dict) and 'text' in first_content:
                        # IMPORTANT: Strip trailing whitespace from the response
                        return first_content['text'].strip()
                    else:
                        return str(first_content).strip()
                elif isinstance(content, str):
                    return content.strip()
            elif "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"].strip()
            else:
                logger.warning("Unexpected response format from LLM API")
                logger.warning(f"Full response: {json.dumps(result)}")
                return self._get_fallback_message(prompt)
                
        except requests.exceptions.RequestException as e:
            logger.error(f"HTTP error getting LLM completion: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response status: {e.response.status_code}")
                logger.error(f"Response headers: {dict(e.response.headers)}")
                logger.error(f"Response body: {e.response.text}")
            return self._get_fallback_message(prompt)
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error from LLM API: {e}")
            return self._get_fallback_message(prompt)
        except Exception as e:
            logger.error(f"Unexpected error getting LLM completion: {e}")
            return self._get_fallback_message(prompt)

    
    def _get_fallback_message(self, prompt):
        """Returns a fallback message when API calls fail."""
        user_prompt = prompt.get("user", "").lower()
        
        if "welcome" in user_prompt or "introduce" in user_prompt:
            return "Hi there! I'm Math Helper, ready to support your decimal rounding practice."
        elif "encouragement" in user_prompt or "correct" in user_prompt:
            return "Great job! You're doing really well with your rounding practice."
        elif "transition" in user_prompt or "stage" in user_prompt:
            return "Excellent progress! You're ready to move on to the next level."
        elif "support" in user_prompt or "struggle" in user_prompt:
            return "Don't worry, everyone makes mistakes while learning. Keep practicing and you'll get it!"
        elif "completion" in user_prompt or "complete" in user_prompt:
            return "Congratulations! You've done an amazing job completing this lesson."
        else:
            return "I'm here to help with your math practice! Let me know if you have questions."

    def test_connection(self):
        """Tests the connection to the LLM API."""
        try:
            test_prompt = {
                "system": "You are a helpful assistant.",
                "user": "Respond with the word 'connected' if you can read this."
            }
            response = self.get_completion(test_prompt)
            
            # Handle the response properly - it should now be a string thanks to get_completion
            response_text = ""
            if isinstance(response, str):
                response_text = response
            elif isinstance(response, list) and len(response) > 0:
                # Backup handling in case get_completion didn't parse correctly
                response_text = response[0].get('text', '') if isinstance(response[0], dict) else str(response[0])
            else:
                response_text = str(response)
            
            if "connect" in response_text.lower():
                logger.info("LLM API connection successful")
                return True
            else:
                logger.warning(f"LLM API connected but unexpected response: {response_text}")
                return False
        except Exception as e:
            logger.error(f"LLM API connection failed: {e}")
            return False

    def get_api_status(self):
        """Returns a dictionary with API configuration status."""
        return {
            "api_key_configured": bool(self.api_key),
            "api_url_configured": bool(self.api_url),
            "model": self.model,
            "ready": bool(self.api_key and self.api_url)
        }

    def validate_api_key_format(self):
        """Validates that the API key appears to be in the correct format."""
        if not self.api_key:
            return False, "No API key configured"
        
        if not self.api_key.startswith("sk-ant-"):
            return False, "API key should start with 'sk-ant-'"
        
        if len(self.api_key) < 50:
            return False, "API key appears to be too short"
        
        return True, "API key format appears valid"

    def get_usage_estimate(self, text_length):
        """Estimates token usage for a given text length."""
        # Rough estimation: 1 token ≈ 4 characters for English text
        estimated_tokens = text_length // 4
        return {
            "estimated_input_tokens": estimated_tokens,
            "max_output_tokens": 150,  # As configured in get_completion
            "total_estimated_tokens": estimated_tokens + 150
        }