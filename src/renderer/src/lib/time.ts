/** "just now", "5 min ago", "3 h ago", "yesterday", "4 days ago", or a date. */
export function relativeTime(when: Date | string | number, now: number = Date.now()): string {
  const then = new Date(when).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(then).toLocaleDateString([], { day: "numeric", month: "short", year: new Date(now).getFullYear() === new Date(then).getFullYear() ? undefined : "numeric" });
}
