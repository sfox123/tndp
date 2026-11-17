import {
  Bird,
  CloudRain,
  CloudRainWind,
  Droplets,
  Fish,
  FolderOpen,
  LandPlot,
  Layers,
  Map,
  MapPinned,
  PawPrint,
  Sun,
  ThermometerSnowflake,
  TriangleAlert,
  Waves,
  Wheat,
  type LucideIcon,
} from "lucide-react";

// One icon and one tint per topic: the same icons as the portal's district page,
// with tints from this site's palette (see .topic-icon in globals.css).
type Tone = "green" | "water" | "dry" | "hazard" | "plain";

const ICONS: Record<string, { icon: LucideIcon; tone: Tone }> = {
  overview: { icon: MapPinned, tone: "green" },
  hazards: { icon: TriangleAlert, tone: "hazard" },
  rainfall: { icon: CloudRain, tone: "water" },
  land: { icon: LandPlot, tone: "green" },
  soils: { icon: Layers, tone: "dry" },
  water: { icon: Droplets, tone: "water" },
  crops: { icon: Wheat, tone: "dry" },
  animals: { icon: PawPrint, tone: "green" },
  maps: { icon: Map, tone: "plain" },

  drought: { icon: Sun, tone: "dry" },
  rains: { icon: CloudRainWind, tone: "water" },
  floods: { icon: Waves, tone: "water" },
  extreme: { icon: ThermometerSnowflake, tone: "hazard" },
  livestock: { icon: PawPrint, tone: "green" },
  poultry: { icon: Bird, tone: "green" },
  fisheries: { icon: Fish, tone: "water" },

  other: { icon: FolderOpen, tone: "plain" },
};

const PX = { sm: 14, md: 19, lg: 28 } as const;

export function CategoryIcon({ id, size = "md" }: { id: string; size?: keyof typeof PX }) {
  const { icon: Icon, tone } = ICONS[id] ?? ICONS.other;
  return (
    <span className="topic-icon" data-tone={tone} data-size={size} aria-hidden="true">
      <Icon size={PX[size]} strokeWidth={1.75} />
    </span>
  );
}
