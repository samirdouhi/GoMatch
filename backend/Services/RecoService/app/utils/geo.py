from math import radians, sin, cos, sqrt, atan2
from typing import Optional


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius_km = 6371.0

    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    )
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return earth_radius_km * c


def compute_distance_km(
    user_lat: Optional[float],
    user_lon: Optional[float],
    item_lat: Optional[float],
    item_lon: Optional[float],
) -> Optional[float]:
    if None in (user_lat, user_lon, item_lat, item_lon):
        return None
    return haversine_km(user_lat, user_lon, item_lat, item_lon)


def distance_text(distance_km: Optional[float]) -> Optional[str]:
    if distance_km is None:
        return None
    if distance_km < 1:
        return f"{int(distance_km * 1000)} m"
    return f"{distance_km:.1f} km"