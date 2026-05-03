"""
route_optimizer.py — Optimise l'ordre des étapes d'un itinéraire pour minimiser
la distance totale parcourue.

Algorithme : Nearest Neighbor (approximation du TSP), O(n²).
Garantit un parcours géographiquement cohérent sans zigzag.
"""
from __future__ import annotations

import math
from typing import List, Optional, Tuple

from app.models.response_models import PlanStep


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _step_coords(step: PlanStep) -> Optional[Tuple[float, float]]:
    if step.latitude is not None and step.longitude is not None:
        return (step.latitude, step.longitude)
    return None


def optimize_route(
    steps: List[PlanStep],
    start_lat: Optional[float] = None,
    start_lon: Optional[float] = None,
) -> List[PlanStep]:
    """
    Réordonne les étapes (hors match et transport) pour minimiser le trajet.

    Les étapes de type 'match' et 'transport' sont FIXÉES à leur position
    chronologique. Le reste est optimisé géographiquement.
    """
    if len(steps) <= 2:
        return steps

    # Séparer les étapes fixes (match / transport) des libres
    fixed_indices = {
        i for i, s in enumerate(steps)
        if s.type in ("match", "transport")
    }
    free_steps = [s for i, s in enumerate(steps) if i not in fixed_indices]

    if len(free_steps) <= 1:
        return steps

    # Nearest-neighbor depuis le point de départ
    current_lat = start_lat or (free_steps[0].latitude or 34.02)
    current_lon = start_lon or (free_steps[0].longitude or -6.84)

    remaining = list(free_steps)
    ordered_free: List[PlanStep] = []

    while remaining:
        best_idx = 0
        best_dist = float("inf")
        for i, step in enumerate(remaining):
            coords = _step_coords(step)
            if coords:
                d = _haversine(current_lat, current_lon, coords[0], coords[1])
            else:
                d = 0.0
            if d < best_dist:
                best_dist = d
                best_idx = i

        chosen = remaining.pop(best_idx)
        ordered_free.append(chosen)
        coords = _step_coords(chosen)
        if coords:
            current_lat, current_lon = coords

    # Reconstruire la liste finale en respectant la position des étapes fixes
    result: List[PlanStep] = []
    free_iter = iter(ordered_free)
    for i, step in enumerate(steps):
        if i in fixed_indices:
            result.append(step)
        else:
            result.append(next(free_iter))

    return result


def extract_route_polyline(steps: List[PlanStep]) -> List[List[float]]:
    """
    Extrait les coordonnées [lat, lng] de chaque étape pour affichage sur la carte.
    Retourne une liste de points pour dessiner le tracé de l'itinéraire.
    """
    points: List[List[float]] = []
    for step in steps:
        if step.latitude is not None and step.longitude is not None:
            points.append([step.latitude, step.longitude])
    return points


def compute_total_distance_km(steps: List[PlanStep]) -> float:
    """Calcule la distance totale de l'itinéraire en km."""
    total = 0.0
    prev_coords: Optional[Tuple[float, float]] = None
    for step in steps:
        coords = _step_coords(step)
        if coords and prev_coords:
            total += _haversine(prev_coords[0], prev_coords[1], coords[0], coords[1])
        if coords:
            prev_coords = coords
    return round(total, 2)
