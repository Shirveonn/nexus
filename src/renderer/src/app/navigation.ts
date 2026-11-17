import {
  Clapperboard, Gamepad2, Home, MessageSquare, Monitor, Settings, Trophy, Users, type LucideIcon
} from "lucide-react";

export type Page = "Home" | "Friends" | "Gaming" | "Arcade" | "Anime" | "Community" | "PC Center" | "Settings";
export type NavGroup = "MAIN" | "EXPLORE" | "SYSTEM";

export interface NavItem {
  label: Page;
  icon: LucideIcon;
  group: NavGroup;
  /** Roadmap version that will deliver this module (shown on placeholder pages). */
  plannedVersion?: string;
  summary?: string;
}

export const navGroups: NavGroup[] = ["MAIN", "EXPLORE", "SYSTEM"];

export const navigation: NavItem[] = [
  { label: "Home", icon: Home, group: "MAIN" },
  { label: "Friends", icon: Users, group: "MAIN", plannedVersion: "0.4.0", summary: "Friend requests, online status and friend profiles." },
  { label: "Gaming", icon: Gamepad2, group: "MAIN", plannedVersion: "0.5.0", summary: "Your game library, Roblox collections, favourites and launch buttons." },
  { label: "Arcade", icon: Trophy, group: "MAIN", plannedVersion: "0.8.0", summary: "Trivia, reaction games, multiplayer rooms, XP and leaderboards." },
  { label: "Anime", icon: Clapperboard, group: "EXPLORE", plannedVersion: "0.6.0", summary: "Watchlists, ratings, favourite anime and characters." },
  { label: "Community", icon: MessageSquare, group: "EXPLORE", plannedVersion: "0.7.0", summary: "Private messages, group chats, polls and an activity feed." },
  { label: "PC Center", icon: Monitor, group: "EXPLORE", plannedVersion: "0.9.0", summary: "CPU, GPU, RAM, storage and network monitoring." },
  { label: "Settings", icon: Settings, group: "SYSTEM" }
];

export const navItem = (page: Page) => navigation.find(n => n.label === page) ?? navigation[0];
