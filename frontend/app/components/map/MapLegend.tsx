const legendItems = [
  { key: "stadium", label: "Stade", color: "#ef4444" },
  { key: "fanzone", label: "Fan zone", color: "#f59e0b" },
  { key: "restaurant", label: "Restaurant", color: "#10b981" },
  { key: "activity", label: "Activité", color: "#3b82f6" },
  { key: "hotel", label: "Hôtel", color: "#8b5cf6" },
];

export default function MapLegend() {
  return (
    <div className="flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      {legendItems.map((item) => (
        <div
          key={item.key}
          className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2"
        >
          <span
            className="block h-3 w-3 rounded-full border border-white"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-white">{item.label}</span>
        </div>
      ))}
    </div>
  );
}