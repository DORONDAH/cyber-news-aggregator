import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key and api_key != "your_openai_api_key_here" else None

async def summarize_article(content: str):
    if not content:
        return "No content available for summarization."

    if not client:
        print("DEBUG: OpenAI client NOT initialized. Check OPENAI_API_KEY environment variable.")
        # Mock summary for testing without API key
        return "• This is a mock summary for testing purposes.\n• AI summarization requires a valid OpenAI API key in the .env file.\n• The system is correctly parsing and storing article content."

    try:
        print(f"DEBUG: Calling OpenAI with content length: {len(content)}")
        response = client.chat.completions.create(
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
