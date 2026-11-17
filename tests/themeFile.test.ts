import { describe, expect, it } from "vitest";
import { DEFAULT_APPEARANCE } from "@/theme/defaults";
import { createThemeFile, parseThemeFile, sanitizeAppearance, slugify } from "@/theme/themeFile";

const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

describe("sanitizeAppearance", () => {
  it("returns defaults for garbage input", () => {
    expect(sanitizeAppearance(null)).toEqual(DEFAULT_APPEARANCE);
    expect(sanitizeAppearance("hello")).toEqual(DEFAULT_APPEARANCE);
    expect(sanitizeAppearance([1, 2])).toEqual(DEFAULT_APPEARANCE);
  });

  it("rejects colors that could inject CSS", () => {
    const a = sanitizeAppearance({ accent: "red; background: url(https://evil.example)" });
    expect(a.accent).toBe(DEFAULT_APPEARANCE.accent);
    expect(sanitizeAppearance({ accent: "#ABCDEF" }).accent).toBe("#abcdef");
  });

  it("rejects unknown palettes, presets and sidebar values", () => {
    const a = sanitizeAppearance({ palette: "hacker", background: { kind: "preset", preset: "nope" }, sidebar: { size: "huge", position: "top" } });
    expect(a.palette).toBe("midnight");
    expect(a.background.preset).toBe("aurora");
    expect(a.sidebar.size).toBe("standard");
    expect(a.sidebar.position).toBe("left");
  });

  it("only accepts image data URLs, never remote URLs", () => {
    expect(sanitizeAppearance({ background: { kind: "image", image: "https://example.com/track.png" } }).background)
      .toMatchObject({ kind: "none", image: null });
    expect(sanitizeAppearance({ background: { kind: "image", image: 'data:image/png;base64,abc")};x{' } }).background.image).toBeNull();
    expect(sanitizeAppearance({ background: { kind: "image", image: tinyPng } }).background).toMatchObject({ kind: "image", image: tinyPng });
  });

  it("clamps numeric ranges", () => {
    const a = sanitizeAppearance({ uiScale: 9, background: { dim: -5, blur: 500 } });
    expect(a.uiScale).toBe(1.3);
    expect(a.background.dim).toBe(0);
    expect(a.background.blur).toBe(20);
    expect(sanitizeAppearance({ uiScale: Number.NaN }).uiScale).toBe(1);
  });
});

describe("theme files", () => {
  it("round-trips through export and import", () => {
    const look = sanitizeAppearance({ palette: "nebula", accent: "#f17ac4", background: { kind: "preset", preset: "synthwave", dim: 30 } });
    const file = createThemeFile("Friday Night", look, true);
    const parsed = parseThemeFile(JSON.stringify(file));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.theme.name).toBe("Friday Night");
      expect(parsed.theme.appearance).toEqual(look);
    }
  });

  it("can strip the wallpaper image on export", () => {
    const look = sanitizeAppearance({ background: { kind: "image", image: tinyPng } });
    expect(createThemeFile("x", look, false).appearance.background).toMatchObject({ kind: "none", image: null });
    expect(createThemeFile("x", look, true).appearance.background.image).toBe(tinyPng);
  });

  it("gives friendly errors for bad files", () => {
    expect(parseThemeFile("{not json")).toEqual({ ok: false, error: expect.stringContaining("JSON") });
    expect(parseThemeFile(JSON.stringify({ hello: 1 }))).toEqual({ ok: false, error: expect.stringContaining("isn't a NEXUS theme") });
    expect(parseThemeFile(JSON.stringify({ format: "nexus-theme", version: 2, appearance: {} }))).toMatchObject({ ok: false });
  });

  it("cleans names", () => {
    const parsed = parseThemeFile(JSON.stringify({ format: "nexus-theme", version: 1, name: "  \u0000" + "x".repeat(100), appearance: {} }));
    expect(parsed.ok && parsed.theme.name.length).toBe(40);
    expect(slugify("My Cool Theme!!")).toBe("my-cool-theme");
  });
});
