import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronLeft, ChevronRight, EyeOff, GripVertical } from "lucide-react";
import { useSettings } from "@/store/settingsStore";
import type { WidgetLayout, WidgetSpan } from "@/types/settings";
import { clampSpan } from "./layout";
import { widgetDefinitions } from "./widgets";

const SIZE_LABELS: Record<WidgetSpan, string> = { 1: "S", 2: "M", 3: "L", 4: "XL" };
export const DRAG_MIME = "application/x-nexus-widget";

/** Number of columns the dashboard grid currently has (it collapses on narrow windows). */
function gridColumns(grid: HTMLElement): number {
  return getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length || 4;
}

export function WidgetFrame({ layout, index, editing }: { layout: WidgetLayout; index: number; editing: boolean }) {
  const def = widgetDefinitions[layout.id];
  const { moveWidget, nudgeWidget, setWidgetSpan, setWidgetVisible } = useSettings.getState();
  const frameRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [previewSpan, setPreviewSpan] = useState<WidgetSpan | null>(null);
  const span = previewSpan ?? layout.span;

  function startResize(event: ReactPointerEvent<HTMLDivElement>) {
    const frame = frameRef.current;
    const grid = frame?.parentElement;
    if (!frame || !grid) return;
    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);

    const cols = gridColumns(grid);
    const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
    const colWidth = (grid.clientWidth + gap) / cols;
    const startX = event.clientX;
    const startCols = Math.max(1, Math.round((frame.getBoundingClientRect().width + gap) / colWidth));
    // Map the visible column count back to the 1–4 span scale.
    const scale = 4 / cols;
    let latest = layout.span;

    const onMove = (e: PointerEvent) => {
      const visibleCols = Math.min(cols, Math.max(1, Math.round(startCols + (e.clientX - startX) / colWidth)));
      latest = clampSpan(visibleCols * scale);
      setPreviewSpan(latest);
    };
    const onUp = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
      setPreviewSpan(null);
      setWidgetSpan(layout.id, latest);
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  }

  const body = <def.Component />;

  return (
    <div
      ref={frameRef}
      className={`widget span-${span} ${editing ? "widget--editing" : ""} ${dragOver ? "widget--drag-over" : ""} ${dragging ? "widget--dragging" : ""}`}
      onDragOver={e => {
        if (!editing || !e.dataTransfer.types.includes(DRAG_MIME)) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault();
        setDragOver(false);
        const id = e.dataTransfer.getData(DRAG_MIME) as WidgetLayout["id"];
        if (id && id !== layout.id) moveWidget(id, index);
      }}
    >
      {editing && (
        <div
          className="widget-toolbar"
          draggable
          onDragStart={e => {
            e.dataTransfer.setData(DRAG_MIME, layout.id);
            e.dataTransfer.effectAllowed = "move";
            const frame = frameRef.current;
            if (frame) e.dataTransfer.setDragImage(frame, 24, 18);
            setDragging(true);
          }}
          onDragEnd={() => setDragging(false)}
          title="Drag to move"
        >
          <GripVertical size={15} className="widget-grip" aria-hidden />
          <span className="widget-toolbar__title">{def.title}</span>
          <button className="icon-button" aria-label={`Move ${def.title} earlier`} onClick={() => nudgeWidget(layout.id, -1)}><ChevronLeft size={15} /></button>
          <button className="icon-button" aria-label={`Move ${def.title} later`} onClick={() => nudgeWidget(layout.id, 1)}><ChevronRight size={15} /></button>
          <div className="size-picker" role="radiogroup" aria-label={`${def.title} size`}>
            {([1, 2, 3, 4] as WidgetSpan[]).map(s => (
              <button key={s} role="radio" aria-checked={layout.span === s} className={layout.span === s ? "active" : ""} onClick={() => setWidgetSpan(layout.id, s)}>
                {SIZE_LABELS[s]}
              </button>
            ))}
          </div>
          <button className="icon-button" aria-label={`Hide ${def.title}`} onClick={() => setWidgetVisible(layout.id, false)}><EyeOff size={15} /></button>
        </div>
      )}

      <div className="widget-body" ref={el => { if (el) el.inert = editing; }}>
        {def.bare ? body : (
          <section className="panel widget-panel">
            <div className="panel-heading">
              <div><h3>{def.title}</h3><p>{def.description}</p></div>
              <def.icon size={17} className="muted-icon" />
            </div>
            <div className="widget-content">{body}</div>
          </section>
        )}
      </div>

      {editing && <div className="resize-handle" onPointerDown={startResize} title="Drag to resize" aria-hidden />}
    </div>
  );
}
