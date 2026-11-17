import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  moveWidget, normalizeLayout, nudgeWidget, setSpan, setVisible
} from "@/features/dashboard/layout";
import { DEFAULT_APPEARANCE, DEFAULT_WIDGETS } from "@/theme/defaults";
import { cleanName, sanitizeAppearance } from "@/theme/themeFile";
import type {
  Appearance, BackgroundSettings, SavedTheme, SidebarSettings, WidgetId, WidgetLayout
} from "@/types/settings";

export const SETTINGS_STORAGE_KEY = "nexus-settings";

interface SettingsState {
  appearance: Appearance;
  widgets: WidgetLayout[];
  savedThemes: SavedTheme[];
  notes: string;

  setAppearance: (patch: Partial<Omit<Appearance, "background" | "sidebar">>) => void;
  setBackground: (patch: Partial<BackgroundSettings>) => void;
  setSidebar: (patch: Partial<SidebarSettings>) => void;
  applyAppearance: (appearance: Appearance) => void;
  resetAppearance: () => void;

  saveTheme: (name: string, appearance?: Appearance) => SavedTheme;
  deleteTheme: (id: string) => void;
  renameTheme: (id: string, name: string) => void;

  moveWidget: (id: WidgetId, targetIndex: number) => void;
  nudgeWidget: (id: WidgetId, direction: -1 | 1) => void;
  setWidgetSpan: (id: WidgetId, span: number) => void;
  setWidgetVisible: (id: WidgetId, visible: boolean) => void;
  resetLayout: () => void;

  setNotes: (notes: string) => void;
  resetAll: () => void;
}

type PersistedSettings = Pick<SettingsState, "appearance" | "widgets" | "savedThemes" | "notes">;

const initialData = (): PersistedSettings => ({
  appearance: structuredClone(DEFAULT_APPEARANCE),
  widgets: structuredClone(DEFAULT_WIDGETS),
  savedThemes: [],
  notes: ""
});

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Validates anything read back from disk so a corrupted file can never break the app. */
export function restoreSettings(raw: unknown): PersistedSettings {
  const data = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const themes = Array.isArray(data.savedThemes) ? data.savedThemes : [];
  return {
    appearance: sanitizeAppearance(data.appearance),
    widgets: normalizeLayout(data.widgets),
    savedThemes: themes
      .filter((t): t is Record<string, unknown> => typeof t === "object" && t !== null)
      .filter(t => typeof t.id === "string")
      .map(t => ({
        id: t.id as string,
        name: cleanName(t.name),
        appearance: sanitizeAppearance(t.appearance),
        createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now()
      })),
    notes: typeof data.notes === "string" ? data.notes.slice(0, 20_000) : ""
  };
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...initialData(),

      setAppearance: patch => set(s => ({ appearance: sanitizeAppearance({ ...s.appearance, ...patch }, s.appearance) })),
      setBackground: patch =>
        set(s => ({ appearance: sanitizeAppearance({ ...s.appearance, background: { ...s.appearance.background, ...patch } }, s.appearance) })),
      setSidebar: patch =>
        set(s => ({ appearance: sanitizeAppearance({ ...s.appearance, sidebar: { ...s.appearance.sidebar, ...patch } }, s.appearance) })),
      applyAppearance: appearance => set({ appearance: sanitizeAppearance(appearance) }),
      resetAppearance: () => set({ appearance: structuredClone(DEFAULT_APPEARANCE) }),

      saveTheme: (name, appearance) => {
        const theme: SavedTheme = {
          id: newId(),
          name: cleanName(name),
          appearance: sanitizeAppearance(appearance ?? get().appearance),
          createdAt: Date.now()
        };
        set(s => ({ savedThemes: [theme, ...s.savedThemes] }));
        return theme;
      },
      deleteTheme: id => set(s => ({ savedThemes: s.savedThemes.filter(t => t.id !== id) })),
      renameTheme: (id, name) =>
        set(s => ({ savedThemes: s.savedThemes.map(t => (t.id === id ? { ...t, name: cleanName(name) } : t)) })),

      moveWidget: (id, targetIndex) => set(s => ({ widgets: moveWidget(s.widgets, id, targetIndex) })),
      nudgeWidget: (id, direction) => set(s => ({ widgets: nudgeWidget(s.widgets, id, direction) })),
      setWidgetSpan: (id, span) => set(s => ({ widgets: setSpan(s.widgets, id, span) })),
      setWidgetVisible: (id, visible) => set(s => ({ widgets: setVisible(s.widgets, id, visible) })),
      resetLayout: () => set({ widgets: structuredClone(DEFAULT_WIDGETS) }),

      setNotes: notes => set({ notes: notes.slice(0, 20_000) }),
      resetAll: () => set(initialData())
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: s => ({ appearance: s.appearance, widgets: s.widgets, savedThemes: s.savedThemes, notes: s.notes }),
      merge: (persisted, current) => ({ ...current, ...restoreSettings(persisted) })
    }
  )
);
