import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
MODEL_ID = 'gemini-2.0-flash'
SUMMARY_PROMPT = """You are a cybersecurity expert. Analyze the following news article:
{content}

Tasks:
1. Select the most appropriate category from this EXACT list: Ransomware, Vulnerability, Data Breach, Malware, Policy/Legal, General.
   - Use 'Ransomware' for any extortion/lock-up attacks.
   - Use 'Vulnerability' for bugs, CVEs, and zero-days.
   - Use 'Data Breach' for leaks and stolen info.
   - Use 'Malware' for viruses, trojans, and botnets.
   - Use 'Policy/Legal' for laws, arrests, and government regulations.
   - Use 'General' only if none of the above fit.
2. Assign a SEVERITY level from this EXACT list: Low, Medium, High, Critical.
   - Critical: Active wide-scale exploits, major infrastructure hits.
   - High: Confirmed breaches of large orgs, new zero-days.
   - Medium: General malware news, patched vulnerabilities.
   - Low: Policy news, minor updates.
3. Summarize the article into exactly 3 punchy bullet points. Focus on impact and technical details.

Output format:
CATEGORY: [Exact Category Name]
SEVERITY: [Exact Severity Level]
SUMMARY:
• [Point 1]
• [Point 2]
• [Point 3]"""

async def summarize_article(content: str) -> str:
    """Summarizes a cybersecurity news article using Gemini 2.0 Flash."""
    if not content:
        return "No content available for summarization."

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY not found in environment.")
        return "AI Summarization unavailable. Please check your GEMINI_API_KEY."

    try:
        client = genai.Client(api_key=api_key)
        prompt = SUMMARY_PROMPT.format(content=content)

        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                safety_settings=[
                    types.SafetySetting(category='HARM_CATEGORY_HARASSMENT', threshold='BLOCK_NONE'),
                    types.SafetySetting(category='HARM_CATEGORY_HATE_SPEECH', threshold='BLOCK_NONE'),
                    types.SafetySetting(category='HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold='BLOCK_NONE'),
                    types.SafetySetting(category='HARM_CATEGORY_DANGEROUS_CONTENT', threshold='BLOCK_NONE'),
                ]
            )
        )

        if not response or not response.text:
            return "Summary unavailable from AI."

        return response.text

    except Exception as e:
        logger.error(f"Gemini Summarization Error: {e}")
        return f"Summarization failed. Error: {str(e)}"
