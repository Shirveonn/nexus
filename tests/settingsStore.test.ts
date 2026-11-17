import { describe, expect, it } from "vitest";
import { restoreSettings } from "@/store/settingsStore";
import { DEFAULT_APPEARANCE, DEFAULT_WIDGETS } from "@/theme/defaults";

describe("restoreSettings", () => {
  it("survives corrupted saved data", () => {
    const s = restoreSettings({ appearance: 5, widgets: "x", savedThemes: [null, { id: 3 }, { id: "a", name: 7, appearance: { accent: "#123456" } }], notes: 99 });
    expect(s.appearance).toEqual(DEFAULT_APPEARANCE);
    expect(s.widgets).toEqual(DEFAULT_WIDGETS);
    expect(s.savedThemes).toHaveLength(1);
    expect(s.savedThemes[0]).toMatchObject({ id: "a", name: "Untitled theme", appearance: { accent: "#123456" } });
    expect(s.notes).toBe("");
  });
  it("handles nothing saved yet", () => {
    expect(restoreSettings(undefined).appearance).toEqual(DEFAULT_APPEARANCE);
  });
});
