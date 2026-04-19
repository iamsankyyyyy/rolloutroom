import os
from autogen import config_list_from_dotenv

llm_config = config_list_from_dotenv()


GROQ_API_KEY = os.environ.get("GROQ_API_KEY")  # set this in environment

print(
    "LLM CONFIG USING:",
    {
        "model": "llama-3.3-70b-versatile",
        "base_url": "https://api.groq.com/openai/v1",
        "api_key_present": GROQ_API_KEY is not None,
    },
)

config_list = [
    {
        "model": "llama-3.3-70b-versatile",
        "api_type": "openai",
        "base_url": "https://api.groq.com/openai/v1",
        "api_key": GROQ_API_KEY,
        "request_timeout": 60,  # seconds
    }
]

llm_config = {
    "config_list": config_list,
    "temperature": 0.7,
    "timeout": 60,  # AG2/AutoGen-level timeout
}