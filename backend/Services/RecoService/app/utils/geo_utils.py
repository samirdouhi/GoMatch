"""
geo_utils.py — Geographic utilities for GoMatch RecoService.

Re-exports core functions from geo.py and adds route coherence helpers.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from app.utils.geo import compute_distance_km, distance_text, haversine_km

__all__ = [
    "compute_distance_km",
    "distance_text",
    "haversine_km",
    "sort_by_route",
    "estimate_travel_minutes",
    "nearest_to_point",
]

_WALK_KMH = 4.0
_TRANSIT_KMH = 25.0


def estimate_travel_minutes(distance_km: Optional[float]) -> int:
    """Estimate travel time to a destination."""
    if distance_km is None:
        return 30
    if distance_km < 1.5:
        return max(10, int(distance_km / _WALK_KMH * 60))
    return max(15, int(distance_km / _TRANSIT_KMH * 60) + 8)


def sort_by_route(
    items: list,
    start_lat: float,
    start_lon: float,
    lat_attr: str = "latitude",
    lon_attr: str = "longitude",
) -> list:
    """
    Sort a list of place objects to minimize total walking distance.
    Uses a greedy nearest-neighbor algorithm from start_lat/lon.
    """
    remaining = list(items)
    ordered = []
    current_lat, current_lon = start_lat, start_lon

    while remaining:
        nearest = min(
            remaining,
            key=lambda x: compute_distance_km(
                current_lat, current_lon,
                getattr(x, lat_attr, None), getattr(x, lon_attr, None),
            ) or 9999.0
        )
        ordered.append(nearest)
        remaining.remove(nearest)
        current_lat = getattr(nearest, lat_attr, current_lat) or current_lat
        current_lon = getattr(nearest, lon_attr, current_lon) or current_lon

    return ordered


def nearest_to_point(
    items: list,
    lat: float,
    lon: float,
    lat_attr: str = "latitude",
    lon_attr: str = "longitude",
    n: int = 1,
) -> list:
    """Return the N nearest items to a geographic point."""
    scored = sorted(
        items,
        key=lambda x: compute_distance_km(
            lat, lon, getattr(x, lat_attr, None), getattr(x, lon_attr, None)
        ) or 9999.0,
    )
    return scored[:n]
