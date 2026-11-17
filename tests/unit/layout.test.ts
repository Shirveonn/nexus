import { describe, expect, it } from "vitest";
import { clampSpan, moveWidget, normalizeLayout, nudgeWidget, setSpan } from "@/features/dashboard/layout";
import { DEFAULT_WIDGETS } from "@/theme/defaults";
import type { WidgetLayout } from "@/types/settings";

const ids = (w: WidgetLayout[]) => w.map(x => x.id);

describe("dashboard layout", () => {
  it("moves widgets", () => {
    expect(ids(moveWidget(DEFAULT_WIDGETS, "activity", 0)).slice(0, 2)).toEqual(["activity", "hero"]);
    expect(moveWidget(DEFAULT_WIDGETS, "hero", 0)).toBe(DEFAULT_WIDGETS);
  });

  it("nudges among visible widgets only", () => {
    // clock is hidden and sits between activity and notes; nudging activity right should not land next to a hidden widget only
    const w: WidgetLayout[] = [
      { id: "hero", span: 4, visible: true },
      { id: "clock", span: 1, visible: false },
      { id: "quick", span: 2, visible: true }
    ];
    expect(ids(nudgeWidget(w, "hero", 1))).toEqual(["clock", "quick", "hero"]);
    expect(nudgeWidget(w, "hero", -1)).toBe(w);
  });

  it("clamps spans", () => {
    expect(clampSpan(0)).toBe(1);
    expect(clampSpan(7)).toBe(4);
    expect(clampSpan(2.6)).toBe(3);
    expect(setSpan(DEFAULT_WIDGETS, "quick", 10).find(w => w.id === "quick")?.span).toBe(4);
  });

  it("repairs stored layouts", () => {
    const repaired = normalizeLayout([{ id: "quick", span: 9 }, { id: "quick" }, { id: "evil" }, null, "x"]);
    expect(repaired[0]).toEqual({ id: "quick", span: 4, visible: true });
    expect(new Set(ids(repaired))).toEqual(new Set(ids(DEFAULT_WIDGETS)));
    // Missing widgets come back with their default visibility (so new widgets appear for existing users).
    for (const w of repaired.filter(w => w.id !== "quick")) {
      expect(w.visible).toBe(DEFAULT_WIDGETS.find(d => d.id === w.id)!.visible);
    }
    expect(normalizeLayout(undefined)).toEqual(DEFAULT_WIDGETS);
  });
});
