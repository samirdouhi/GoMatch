"use client";

import dynamic from "next/dynamic";
import type { MapItem, MapItemType } from "./types";

const ExperienceMap = dynamic(() => import("./ExperienceMap"), {
  ssr: false,
});

type ExperienceMapClientProps = {
  center?: [number, number];
  zoom?: number;
  height?: string;
  visibleTypes?: MapItemType[];
  items?: MapItem[];
  selectedItem?: MapItem | null;
  onSelectItem?: (item: MapItem) => void;
  focusKey?: number;
  routeSegments?: [number, number][][];
  routeDistanceLabel?: string;
  routeDurationLabel?: string;
  startPoint?: [number, number] | null;
  liveUserPosition?: [number, number] | null;
  liveUserAccuracy?: number | null;
  navigationMode?: "live" | "manual";
  onSelectStartPoint?: (position: [number, number]) => void;
};

export default function ExperienceMapClient(
  props: ExperienceMapClientProps
) {
  return <ExperienceMap {...props} />;
}