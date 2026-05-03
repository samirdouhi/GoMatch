import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = "RecoService"
    APP_VERSION: str = "5.0.0"

    GATEWAY_BASE_URL: str = os.getenv("GATEWAY_BASE_URL", "http://localhost:5266")

    PROFILE_SERVICE_PATH: str = os.getenv("PROFILE_SERVICE_PATH", "/profile")
    BUSINESS_SERVICE_PATH: str = os.getenv("BUSINESS_SERVICE_PATH", "/business")
    MATCH_SERVICE_PATH: str = os.getenv("MATCH_SERVICE_PATH", "/event-matches")
    DISCOVERY_SERVICE_PATH: str = os.getenv("DISCOVERY_SERVICE_PATH", "/decouverte")

    HTTP_TIMEOUT_SECONDS: float = float(os.getenv("HTTP_TIMEOUT_SECONDS", "15"))
    VERIFY_SSL: bool = os.getenv("VERIFY_SSL", "false").lower() == "true"

    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "claude-sonnet-4-6")
    LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "1200"))


settings = Settings()
