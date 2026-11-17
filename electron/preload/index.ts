import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("nexus", {
  appVersion: "0.1.0",
  platform: process.platform
});

export {};