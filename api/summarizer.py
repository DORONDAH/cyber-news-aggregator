import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

async def summarize_article(content: str):
    if not content:
        return "No content available for summarization."

    # Fetch key inside function to ensure we get the latest environment variable in serverless
    key = os.getenv("OPENAI_API_KEY")

    if not key or key == "your_openai_api_key_here":
        print("DEBUG: OPENAI_API_KEY is missing or is the default placeholder.")
        return "• This is a mock summary for testing purposes.\n• AI summarization requires a valid OpenAI API key in the Vercel settings.\n• Please ensure you have added the key and REDEPLOYED your app."

    try:
        print(f"DEBUG: Initializing OpenAI client with key starting with: {key[:8]}...")
        local_client = OpenAI(api_key=key)

        print(f"DEBUG: Calling OpenAI with content length: {len(content)}")
        response = local_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a cybersecurity expert. Summarize the following news article into 3 key bullet points in non-technical language."},
                {"role": "user", "content": content}
            ],
            max_tokens=150
        )
        print("DEBUG: OpenAI response received successfully.")
        return response.choices[0].message.content
    except Exception as e:
        print(f"CRITICAL ERROR in OpenAI summarization: {str(e)}")
        return f"Summary not available. (Error: {str(e)})"
