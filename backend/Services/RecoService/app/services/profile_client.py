import json
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

PROFILE_SERVICE_URL = "https://localhost:7114"


def get_user_profile(access_token: str):
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    response = requests.get(
        f"{PROFILE_SERVICE_URL}/api/touriste/profile/me",
        headers=headers,
        verify=False,
        timeout=10
    )
    response.raise_for_status()
    return response.json()


def extract_preferences(profile: dict) -> list[str]:
    raw = profile.get("preferencesJson")

    if not raw:
        return []

    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [str(x) for x in parsed]
        return []
    except Exception:
        return []