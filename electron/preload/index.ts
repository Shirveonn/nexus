import { contextBridge, webFrame } from "electron";
import { version } from "../../package.json";

/**
 * The only bridge between the sandboxed UI and Electron.
 * Keep this surface small: every function here is reachable from the renderer.
 */
contextBridge.exposeInMainWorld("nexus", {
  appVersion: version,
  platform: process.platform,
  setZoomFactor: (factor: number) => {
    if (typeof factor !== "number" || !Number.isFinite(factor)) return;
    webFrame.setZoomFactor(Math.min(1.3, Math.max(0.8, factor)));
  }
});

export {};
