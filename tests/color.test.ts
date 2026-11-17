import { describe, expect, it } from "vitest";
import { hexToRgb, isHexColor, readableTextOn, rgbToHex, shiftHue } from "@/lib/color";

describe("color helpers", () => {
  it("validates strict hex", () => {
    expect(isHexColor("#648cff")).toBe(true);
    expect(isHexColor("#fff")).toBe(false);
    expect(isHexColor("648cff")).toBe(false);
    expect(isHexColor(42)).toBe(false);
  });
  it("converts", () => {
    expect(hexToRgb("#648cff")).toEqual([100, 140, 255]);
    expect(rgbToHex(100, 140, 255)).toBe("#648cff");
  });
  it("shifts hue and keeps a valid color", () => {
    expect(shiftHue("#ff0000", 120)).toBe("#00ff00");
    expect(shiftHue("#648cff", 0)).toBe("#648cff");
    expect(isHexColor(shiftHue("#648cff", 35))).toBe(true);
  });
  it("picks readable text", () => {
    expect(readableTextOn("#ffffff")).toBe("#0b0d14");
    expect(readableTextOn("#000000")).toBe("#ffffff");
  });
});
