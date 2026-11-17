import { create } from "zustand";
import type { Page } from "@/app/navigation";

export type SettingsTab = "account" | "themes" | "background" | "sidebar" | "dashboard" | "library";

interface Toast {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
}

interface UiState {
  page: Page;
  settingsTab: SettingsTab;
  editingLayout: boolean;
  friendsTab: "friends" | "requests" | "add" | "blocked";
  toasts: Toast[];
  navigate: (page: Page, tab?: SettingsTab) => void;
  setSettingsTab: (tab: SettingsTab) => void;
  setEditingLayout: (editing: boolean) => void;
  setFriendsTab: (tab: UiState["friendsTab"]) => void;
  toast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;

/** Session-only UI state (not saved to disk). */
export const useUi = create<UiState>()(set => ({
  page: "Home",
  settingsTab: "themes",
  editingLayout: false,
  friendsTab: "friends",
  toasts: [],
  navigate: (page, tab) => set(s => ({ page, settingsTab: tab ?? s.settingsTab, editingLayout: false })),
  setSettingsTab: settingsTab => set({ settingsTab }),
  setEditingLayout: editingLayout => set({ editingLayout }),
  setFriendsTab: friendsTab => set({ friendsTab }),
  toast: (message, tone = "info") => {
    const id = ++toastId;
    set(s => ({ toasts: [...s.toasts.slice(-3), { id, message, tone }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3500);
  },
  dismissToast: id => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
}));
