import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

MATCH_SERVICE_URL = "https://localhost:7098"


def get_today_matches():
    response = requests.get(
        f"{MATCH_SERVICE_URL}/api/matches/world-cup/today",
        verify=False,
        timeout=10
    )
    response.raise_for_status()
    return response.json()


def get_upcoming_matches():
    response = requests.get(
        f"{MATCH_SERVICE_URL}/api/matches/world-cup/upcoming",
        verify=False,
        timeout=10
    )
    response.raise_for_status()
    return response.json()