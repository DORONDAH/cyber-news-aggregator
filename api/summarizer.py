import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

async def summarize_article(content: str):
    if not content:
        return "No content available for summarization."

    # Use GEMINI_API_KEY for free-tier reliability
    key = os.getenv("GEMINI_API_KEY")

    if not key or key == "your_gemini_api_key_here":
        print(f"DEBUG: GEMINI_API_KEY is missing. (Found: {key})")
        return f"• Summarizer: GEMINI_API_KEY not found in Vercel.\n• Please check your Vercel Environment Variables.\n• Make sure the name is exactly GEMINI_API_KEY."

    try:
        print(f"DEBUG: Initializing Gemini with key starting with: {key[:5]}...")
        genai.configure(api_key=key)

        # Use gemini-1.5-flash for maximum compatibility and speed
        # We also add safety_settings to ensure cybersecurity news isn't blocked
        model = genai.GenerativeModel(
            model_name='gemini-1.5-flash',
            safety_settings=[
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
        )

        prompt = f"""You are a cybersecurity expert. Analyze the following news article:
{content}

Tasks:
1. Select the most appropriate category from this list: Ransomware, Vulnerability, Data Breach, Malware, Policy/Legal, General.
2. Summarize the article into 3 key bullet points in non-technical language.

Output format:
CATEGORY: [Selected Category]
SUMMARY:
[3 Bullet Points]"""

        print(f"DEBUG: Calling Gemini API for summary and category...")
        response = model.generate_content(prompt)

        # Handle the case where the response might be blocked or empty
        if not response:
            return "Summary not available. (No response from AI)"

        try:
            if response.text:
                print("DEBUG: Gemini response received successfully.")
                return response.text
        except ValueError:
            # This happens if the response was blocked by safety filters
            # even after we set them to BLOCK_NONE
            return "Summary blocked by Gemini safety filters. Please check the content for sensitive terms."

        return "Summary not available. (Empty response from AI)"

    except Exception as e:
        error_message = str(e)
        print(f"CRITICAL ERROR in Gemini summarization: {error_message}")
        return f"Summary not available via Gemini. (Error: {error_message})"
