"use client";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Navigation, Search, X, Crosshair } from "lucide-react";

type LocationData = {
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

const markerIcon = L.divIcon({
  html: `
    <div style="position:relative;width:32px;height:44px;display:flex;flex-direction:column;align-items:center;">
      <div style="
        width:32px;
        height:32px;
        background:linear-gradient(135deg,#f97316,#ef4444);
        border:3px solid #fff;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 4px 16px rgba(239,68,68,0.55);
      "></div>
      <div style="
        width:4px;
        height:10px;
        background:rgba(239,68,68,0.35);
        border-radius:0 0 3px 3px;
        margin-top:-2px;
      "></div>
    </div>
  `,
  className: "",
  iconSize: [32, 44],
  iconAnchor: [16, 44],
  popupAnchor: [0, -44],
});

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          "Accept-Language": "fr",
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
        },
      }
    );

    if (!res.ok) return [];

    return (await res.json()) as NominatimResult[];
  } catch {
    return [];
  }
}

function MapController({
  onMapClick,
  panTo,
  onMapReady,
}: {
  onMapClick: (lat: number, lng: number) => void;
  panTo: [number, number] | null;
  onMapReady: (map: L.Map) => void;
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

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
  const mapRef = useRef<L.Map | null>(null);

  const position: [number, number] | null = value ? [value.lat, value.lng] : null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
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

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (query.trim().length < 3) {
      setSearchResults([]);
      setIsSearching(false);
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
        setGpsLoading(false);

        onChange({ lat, lng, address });
        setSearchQuery(address);
      },
      () => {
        setGpsLoading(false);
      }
    );
  }

  function handleZoomIn() {
    mapRef.current?.zoomIn();
  }

  function handleZoomOut() {
    mapRef.current?.zoomOut();
  }

  return (
    <div className="flex flex-col gap-3">
      <div ref={searchRef} className="relative">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/90 px-4 py-3 transition focus-within:border-orange-400/60 focus-within:ring-2 focus-within:ring-orange-400/20">
          <Search className="h-4 w-4 shrink-0 text-orange-400" />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="Rechercher une adresse (ville, quartier, rue…)"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          />

          {isSearching && (
            <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
          )}

          {searchQuery && !isSearching && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setShowResults(false);
              }}
              className="shrink-0 text-zinc-500 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full z-[600] mt-1 w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
            {searchResults.map((result) => (
              <button
                key={result.place_id}
                type="button"
                onClick={() => handleResultSelect(result)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition hover:bg-orange-500/10"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                <span className="line-clamp-2 text-zinc-200">{result.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        style={{ height: 450 }}
      >
        <MapContainer
          center={position ?? MOROCCO_CENTER}
          zoom={position ? 15 : 6}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          <MapController onMapClick={handleMapClick} panTo={panTo} onMapReady={handleMapReady} />

          {position && (
            <Marker position={position} icon={markerIcon}>
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <p style={{ marginBottom: 4, fontSize: 13, fontWeight: 600, color: "#111" }}>
                    Position du commerce
                  </p>

                  {value?.address ? (
                    <p style={{ fontSize: 12, lineHeight: 1.4, color: "#555" }}>
                      {value.address.slice(0, 100)}
                      {value.address.length > 100 ? "…" : ""}
                    </p>
                  ) : null}

                  <p
                    style={{
                      marginTop: 6,
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: "#888",
                    }}
                  >
                    {value?.lat.toFixed(5)}, {value?.lng.toFixed(5)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        <div className="absolute left-3 top-3 z-[500] flex flex-col overflow-hidden rounded-xl border border-zinc-200/40 bg-white shadow-lg">
          <button
            type="button"
            onClick={handleZoomIn}
            className="flex h-8 w-8 items-center justify-center text-lg font-light text-zinc-700 transition hover:bg-zinc-100"
            aria-label="Zoom avant"
          >
            +
          </button>

          <div className="h-px bg-zinc-200" />

          <button
            type="button"
            onClick={handleZoomOut}
            className="flex h-8 w-8 items-center justify-center text-lg font-light text-zinc-700 transition hover:bg-zinc-100"
            aria-label="Zoom arrière"
          >
            −
          </button>
        </div>

        <button
          type="button"
          onClick={handleGpsLocation}
          disabled={gpsLoading}
          title="Utiliser ma position GPS"
          className="absolute bottom-4 right-4 z-[500] flex items-center gap-2 rounded-xl border border-white/20 bg-white/95 px-3 py-2 text-xs font-semibold text-zinc-800 shadow-lg backdrop-blur transition hover:bg-white disabled:opacity-60"
        >
          {gpsLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          ) : (
            <Navigation className="h-4 w-4 text-orange-500" />
          )}
          Ma position
        </button>

        {!position && !isGeocoding && (
          <div className="pointer-events-none absolute bottom-14 left-1/2 z-[400] -translate-x-1/2">
            <div className="flex items-center gap-2 whitespace-nowrap rounded-full border border-orange-400/40 bg-zinc-900/90 px-4 py-2 text-xs font-medium text-orange-300 shadow-lg">
              <Crosshair className="h-3.5 w-3.5" />
              Cliquez sur la carte pour placer votre commerce
            </div>
          </div>
        )}

        {isGeocoding && (
          <div className="absolute inset-0 z-[400] flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/95 px-5 py-3 text-sm font-medium text-white shadow-xl">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
              Récupération de l&apos;adresse…
            </div>
          </div>
        )}
      </div>

      {value ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Latitude
            </p>
            <p className="mt-1 font-mono text-sm text-orange-300">{value.lat.toFixed(6)}</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Longitude
            </p>
            <p className="mt-1 font-mono text-sm text-orange-300">{value.lng.toFixed(6)}</p>
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-zinc-500">Aucune position sélectionnée</p>
      )}
    </div>
  );
}