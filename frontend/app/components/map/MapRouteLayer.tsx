"use client";

import { Polyline, Tooltip } from "react-leaflet";

type MapRouteLayerProps = {
  segments: [number, number][][];
  distanceLabel?: string;
  durationLabel?: string;
};

export default function MapRouteLayer({
  segments,
  distanceLabel,
  durationLabel,
}: MapRouteLayerProps) {
  if (!segments || segments.length === 0) {
    return null;
  }

  return (
    <>
      {segments.map((segment, index) => {
        if (!segment || segment.length < 2) return null;

        const middleIndex = Math.floor(segment.length / 2);
        const middlePoint = segment[middleIndex];

        return (
          <Polyline
            key={`segment-${index}`}
            positions={segment}
            pathOptions={{
              color: "#f97316",
              weight: 5,
              opacity: 0.9,
            }}
          >
            {index === segments.length - 1 && middlePoint ? (
              <Tooltip
                permanent
                direction="top"
                position={middlePoint}
                offset={[0, -8]}
              >
                <span className="text-xs font-medium">
                  {distanceLabel && durationLabel
                    ? `${distanceLabel} • ${durationLabel}`
                    : "Parcours"}
                </span>
              </Tooltip>
            ) : null}
          </Polyline>
        );
      })}
    </>
  );
}