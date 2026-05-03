"""
multi_day_planner.py — Planification multi-jours pour un séjour complet autour de la Coupe du Monde.

Structure générée :
  Jour 1 (arrivée) — Découverte initiale + repos
  Jour 2 (match)   — Programme complet autour du match
  Jour 3 (off)     — Journée tourisme culturel

Chaque jour retourne un DayPlan avec ses étapes et infos de sécurité.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from app.core.match_day_planner import build_match_day_plan
from app.core.off_day_planner import build_off_day_plan
from app.geo.route_optimizer import extract_route_polyline, optimize_route
from app.models.domain_models import CandidateItem
from app.models.response_models import DayPlan, PlanStep, SafetyInfo


def _fmt_date(dt: datetime) -> str:
    DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
    MONTHS = ["", "janvier", "février", "mars", "avril", "mai", "juin",
              "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
    return f"{DAYS[dt.weekday()]} {dt.day} {MONTHS[dt.month]} {dt.year}"


def _arrival_day_plan(
    candidates: List[CandidateItem],
    city: str = "Rabat",
) -> List[PlanStep]:
    """Génère un programme léger pour le jour d'arrivée."""
    from app.core.off_day_planner import build_off_day_plan

    # Version courte : seulement café + restaurant + balade
    full = build_off_day_plan(candidates, city=city)
    # Garder seulement 3 étapes : café, déjeuner, balade
    short = [s for s in full if s.type in ("cafe", "food", "culture")][:3]
    return short


def build_multi_day_plan(
    match: Optional[Dict[str, Any]],
    candidates: List[CandidateItem],
    user_lat: Optional[float] = None,
    user_lon: Optional[float] = None,
    user_to_stadium_km: Optional[float] = None,
    city: str = "Rabat",
    profile: Optional[Dict[str, Any]] = None,
) -> List[DayPlan]:
    """
    Génère un séjour de 3 jours.
    Retourne une liste de DayPlan.
    """
    now = datetime.now()
    days: List[DayPlan] = []

    # ── Jour 1 : Arrivée ────────────────────────────────────────────────────
    day1_steps = _arrival_day_plan(candidates, city)
    day1_steps = optimize_route(day1_steps, user_lat, user_lon)
    days.append(DayPlan(
        date=now.strftime("%Y-%m-%d"),
        label=f"Jour 1 — Arrivée à {city}",
        type="arrival",
        plan=day1_steps,
        route=extract_route_polyline(day1_steps),
        safety=None,
        match_info=None,
    ))

    # ── Jour 2 : Match day ──────────────────────────────────────────────────
    match_date = now + timedelta(days=1)
    if match:
        match_steps, safety = build_match_day_plan(
            match=match,
            candidates=candidates,
            user_lat=user_lat,
            user_lon=user_lon,
            user_to_stadium_km=user_to_stadium_km,
        )
        match_steps = optimize_route(match_steps, user_lat, user_lon)

        equipe1 = match.get("equipe1", "Équipe 1")
        equipe2 = match.get("equipe2", "Équipe 2")
        kickoff = match.get("kickoff", "20:00")
        stade = match.get("stade", "Stade")

        days.append(DayPlan(
            date=match_date.strftime("%Y-%m-%d"),
            label=f"Jour 2 — Match {equipe1} vs {equipe2}",
            type="match_day",
            plan=match_steps,
            route=extract_route_polyline(match_steps),
            safety=safety,
            match_info={
                "equipe1": equipe1,
                "equipe2": equipe2,
                "kickoff": kickoff,
                "stade": stade,
                "stade_lat": match.get("stade_latitude"),
                "stade_lng": match.get("stade_longitude"),
            },
        ))
    else:
        # Pas de match → journée off supplémentaire
        off_steps = build_off_day_plan(candidates, profile=profile, city=city)
        off_steps = optimize_route(off_steps, user_lat, user_lon)
        days.append(DayPlan(
            date=match_date.strftime("%Y-%m-%d"),
            label=f"Jour 2 — Exploration de {city}",
            type="off_day",
            plan=off_steps,
            route=extract_route_polyline(off_steps),
            safety=None,
            match_info=None,
        ))

    # ── Jour 3 : Off day / Retour ────────────────────────────────────────────
    day3_date = now + timedelta(days=2)
    off_steps = build_off_day_plan(candidates, profile=profile, city=city)
    off_steps = optimize_route(off_steps, user_lat, user_lon)
    days.append(DayPlan(
        date=day3_date.strftime("%Y-%m-%d"),
        label=f"Jour 3 — Dernière journée à {city}",
        type="off_day",
        plan=off_steps,
        route=extract_route_polyline(off_steps),
        safety=None,
        match_info=None,
    ))

    return days
