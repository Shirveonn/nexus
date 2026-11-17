import type { BackgroundPresetId } from "@/types/settings";

/** Built-in wallpapers. They are pure CSS so they cost nothing and work offline. */
export const backgroundPresets: { id: BackgroundPresetId; name: string; css: string }[] = [
  {
    id: "aurora",
    name: "Aurora",
    css: "radial-gradient(ellipse at 15% 20%, #1f6f6b 0%, transparent 45%), radial-gradient(ellipse at 80% 10%, #3a2d8f 0%, transparent 50%), radial-gradient(ellipse at 60% 90%, #12476b 0%, transparent 55%), #070a12"
  },
  {
    id: "sunset",
    name: "Sunset",
    css: "radial-gradient(ellipse at 20% 100%, #c2410c 0%, transparent 50%), radial-gradient(ellipse at 85% 85%, #9d174d 0%, transparent 50%), linear-gradient(180deg, #120a1f 0%, #2b0f2e 60%, #3b1220 100%)"
  },
  {
    id: "deep-sea",
    name: "Deep sea",
    css: "radial-gradient(ellipse at 50% 0%, #0e4f7a 0%, transparent 60%), radial-gradient(ellipse at 10% 90%, #063a4a 0%, transparent 50%), linear-gradient(180deg, #04121f 0%, #020a12 100%)"
  },
  {
    id: "synthwave",
    name: "Synthwave",
    css: "radial-gradient(ellipse at 50% 110%, #ff2fa0 0%, transparent 45%), radial-gradient(ellipse at 50% 40%, #6d28d9 0%, transparent 60%), linear-gradient(180deg, #0b0221 0%, #1a0536 100%)"
  },
  {
    id: "grid",
    name: "Grid",
    css: "linear-gradient(rgba(120, 150, 255, 0.07) 1px, transparent 1px) 0 0 / 40px 40px, linear-gradient(90deg, rgba(120, 150, 255, 0.07) 1px, transparent 1px) 0 0 / 40px 40px, radial-gradient(ellipse at 50% 0%, #17204a 0%, #080a14 70%)"
  },
  {
    id: "mono",
    name: "Mono",
    css: "radial-gradient(ellipse at 30% 20%, #2a2a2e 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, #1c1c20 0%, transparent 50%), #0a0a0b"
  }
];

export const backgroundPresetById = (id: BackgroundPresetId) =>
  backgroundPresets.find(p => p.id === id) ?? backgroundPresets[0];
