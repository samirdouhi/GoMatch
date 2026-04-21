import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = "RecoService"
    APP_VERSION: str = "2.0.0"

    GATEWAY_BASE_URL: str = os.getenv("GATEWAY_BASE_URL", "http://localhost:5266")

    PROFILE_SERVICE_PATH: str = os.getenv("PROFILE_SERVICE_PATH", "/profile")
    BUSINESS_SERVICE_PATH: str = os.getenv("BUSINESS_SERVICE_PATH", "/business")
    MATCH_SERVICE_PATH: str = os.getenv("MATCH_SERVICE_PATH", "/event-matches")
    DISCOVERY_SERVICE_PATH: str = os.getenv("DISCOVERY_SERVICE_PATH", "/decouverte")

    HTTP_TIMEOUT_SECONDS: float = float(os.getenv("HTTP_TIMEOUT_SECONDS", "15"))
    VERIFY_SSL: bool = os.getenv("VERIFY_SSL", "false").lower() == "true"


settings = Settings()