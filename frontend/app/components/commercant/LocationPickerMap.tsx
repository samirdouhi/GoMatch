"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Search, X } from "lucide-react";

export type LocationData = {
  lat: number;
  lng: number;
  address: string;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

// Custom red pin marker matching GoMatch brand
const markerIcon = L.divIcon({
  html: `<div style="
    position:relative;
    width:22px;height:22px;
    background:#ef4444;
    border:3px solid #fff;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 3px 10px rgba(0,0,0,0.5);
  "></div>`,
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          "Accept-Language": "fr",
          "User-Agent": "GoMatch-App/1.0",
        },
      }
    );
    if (!res.ok) return "";
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? "";
  } catch {
    return "";
  }
}

async function geocodeSearch(query: string): Promise<NominatimResult[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
      {
        headers: {
          "Accept-Language": "fr",
          "User-Agent": "GoMatch-App/1.0",
        },
      }
    );
    if (!res.ok) return [];
    return (await res.json()) as NominatimResult[];
  } catch {
    return [];
  }
}

// Sub-component: handles map clicks + programmatic panning
function MapController({
  onMapClick,
  panTo,
}: {
  onMapClick: (lat: number, lng: number) => void;
  panTo: [number, number] | null;
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (panTo) {
      map.setView(panTo, 15, { animate: true });
    }
  }, [map, panTo]);

  return null;
}

type Props = {
  value: LocationData | null;
  onChange: (data: LocationData) => void;
};

// Morocco center as default view
const MOROCCO_CENTER: [number, number] = [31.7917, -7.0926];

export default function LocationPickerMap({ value, onChange }: Props) {
  const [panTo, setPanTo] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const position: [number, number] | null = value
    ? [value.lat, value.lng]
    : null;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMapClick(lat: number, lng: number) {
    setIsGeocoding(true);
    const address = await reverseGeocode(lat, lng);
    setIsGeocoding(false);
    onChange({ lat, lng, address });
    setSearchQuery(address);
  }

  function handleSearchInput(query: string) {
    setSearchQuery(query);
    setShowResults(false);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      const results = await geocodeSearch(query);
      setSearchResults(results);
      setShowResults(results.length > 0);
      setIsSearching(false);
    }, 500);
  }

  function handleResultSelect(result: NominatimResult) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setPanTo([lat, lng]);
    onChange({ lat, lng, address: result.display_name });
    setSearchQuery(result.display_name);
    setShowResults(false);
    setSearchResults([]);
  }

  function handleGpsLocation() {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPanTo([lat, lng]);
        setIsGeocoding(true);
        const address = await reverseGeocode(lat, lng);
        setIsGeocoding(false);
        onChange({ lat, lng, address });
        setSearchQuery(address);
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
      }
    );
  }

  function clearSearch() {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search bar */}
      <div ref={searchRef} className="relative">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 transition focus-within:border-orange-400/60 focus-within:ring-2 focus-within:ring-orange-400/20">
          <Search className="h-4 w-4 shrink-0 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="Rechercher une adresse sur la carte..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          />
          {isSearching && (
            <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
          )}
          {searchQuery && !isSearching && (
            <button
              type="button"
              onClick={clearSearch}
              className="shrink-0 text-zinc-500 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            {searchResults.map((result) => (
              <button
                key={result.place_id}
                type="button"
                onClick={() => handleResultSelect(result)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition hover:bg-white/[0.05]"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                <span className="line-clamp-2 text-zinc-200">
                  {result.display_name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map + GPS button */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10" style={{ height: 340 }}>
        <MapContainer
          center={position ?? MOROCCO_CENTER}
          zoom={position ? 14 : 5}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapController onMapClick={handleMapClick} panTo={panTo} />
          {position && <Marker position={position} icon={markerIcon} />}
        </MapContainer>

        {/* GPS button overlay */}
        <button
          type="button"
          onClick={handleGpsLocation}
          disabled={gpsLoading}
          title="Utiliser ma position GPS"
          className="absolute bottom-3 right-3 z-[500] flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/90 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-zinc-800 disabled:opacity-60"
        >
          {gpsLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
          ) : (
            <Navigation className="h-4 w-4 text-orange-400" />
          )}
          Ma position
        </button>

        {/* Geocoding overlay */}
        {isGeocoding && (
          <div className="absolute inset-0 z-[400] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/90 px-4 py-2 text-sm text-white">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
              Localisation en cours…
            </div>
          </div>
        )}
      </div>

      {/* Coordinates display */}
      {value ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Latitude
            </p>
            <p className="mt-1 font-mono text-sm text-orange-300">
              {value.lat.toFixed(6)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Longitude
            </p>
            <p className="mt-1 font-mono text-sm text-orange-300">
              {value.lng.toFixed(6)}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-zinc-500">
          Cliquez sur la carte ou recherchez une adresse pour placer votre commerce
        </p>
      )}
    </div>
  );
}
