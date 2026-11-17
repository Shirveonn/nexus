import { DEFAULT_WIDGETS } from "@/theme/defaults";
import type { WidgetId, WidgetLayout, WidgetSpan } from "@/types/settings";

/** Pure helpers for the dashboard layout. Kept free of React so they're easy to test. */

export function clampSpan(value: number): WidgetSpan {
  return Math.min(4, Math.max(1, Math.round(value))) as WidgetSpan;
}

/** Moves widget `id` so it sits at `targetIndex` in the list. */
export function moveWidget(widgets: WidgetLayout[], id: WidgetId, targetIndex: number): WidgetLayout[] {
  const from = widgets.findIndex(w => w.id === id);
  if (from === -1) return widgets;
  const to = Math.min(widgets.length - 1, Math.max(0, targetIndex));
  if (from === to) return widgets;
  const next = [...widgets];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Moves a widget one step among the *visible* widgets (hidden ones are skipped). */
export function nudgeWidget(widgets: WidgetLayout[], id: WidgetId, direction: -1 | 1): WidgetLayout[] {
  const visible = widgets.filter(w => w.visible);
  const pos = visible.findIndex(w => w.id === id);
  const neighbour = visible[pos + direction];
  if (pos === -1 || !neighbour) return widgets;
  return moveWidget(widgets, id, widgets.findIndex(w => w.id === neighbour.id));
}

export function setSpan(widgets: WidgetLayout[], id: WidgetId, span: number): WidgetLayout[] {
  return widgets.map(w => (w.id === id ? { ...w, span: clampSpan(span) } : w));
}

export function setVisible(widgets: WidgetLayout[], id: WidgetId, visible: boolean): WidgetLayout[] {
  return widgets.map(w => (w.id === id ? { ...w, visible } : w));
}

/**
 * Repairs a stored layout: drops unknown/duplicate widgets, fixes spans,
 * and appends any widgets added in newer versions of NEXUS (with their default visibility).
 */
export function normalizeLayout(input: unknown): WidgetLayout[] {
  if (!Array.isArray(input)) return structuredClone(DEFAULT_WIDGETS);
  const known = new Set(DEFAULT_WIDGETS.map(w => w.id));
  const seen = new Set<WidgetId>();
  const result: WidgetLayout[] = [];
  for (const raw of input) {
    if (typeof raw !== "object" || raw === null) continue;
    const { id, span, visible } = raw as Partial<WidgetLayout>;
    if (!id || !known.has(id) || seen.has(id)) continue;
    seen.add(id);
    result.push({ id, span: clampSpan(typeof span === "number" ? span : 2), visible: visible !== false });
  }
  for (const def of DEFAULT_WIDGETS) {
    if (!seen.has(def.id)) result.push({ ...def });
  }
  return result;
}
