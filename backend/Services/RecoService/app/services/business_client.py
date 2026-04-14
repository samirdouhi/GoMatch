import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BUSINESS_SERVICE_URL = "https://localhost:59006"


def get_nearby_commerces(latitude: float, longitude: float, rayon_km: float = 10):
    response = requests.get(
        f"{BUSINESS_SERVICE_URL}/api/Commerces/proches",
        params={
            "latitude": latitude,
            "longitude": longitude,
            "rayonKm": rayon_km
        },
        verify=False,
        timeout=10
    )
    response.raise_for_status()
    return response.json()