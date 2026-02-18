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
        print("DEBUG: GEMINI_API_KEY is missing. Falling back to mock.")
        return "• This is a mock summary.\n• Please add a GEMINI_API_KEY to your Vercel Environment Variables.\n• You can get one for free at aistudio.google.com."

    try:
        print(f"DEBUG: Initializing Gemini with key starting with: {key[:5]}...")
        genai.configure(api_key=key)

        # Use gemini-1.5-pro for the latest "Pro" capabilities
        # We also add safety_settings to ensure cybersecurity news isn't blocked
        model = genai.GenerativeModel(
            model_name='gemini-1.5-pro',
            safety_settings=[
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
        )

        prompt = f"You are a cybersecurity expert. Summarize the following news article into 3 key bullet points in non-technical language:\n\n{content}"

        print(f"DEBUG: Calling Gemini API...")
        response = model.generate_content(prompt)

        if response and response.text:
            print("DEBUG: Gemini response received successfully.")
            return response.text
        else:
            return "Summary not available. (Empty response from AI)"

    except Exception as e:
        error_message = str(e)
        print(f"CRITICAL ERROR in Gemini summarization: {error_message}")
        return f"Summary not available via Gemini. (Error: {error_message})"
