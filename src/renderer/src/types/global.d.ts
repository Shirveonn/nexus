/** API exposed by electron/preload/index.ts through contextBridge. */
export interface NexusBridge {
  appVersion: string;
  platform: NodeJS.Platform;
  setZoomFactor: (factor: number) => void;
}

declare global {
  interface Window {
    /** Undefined when the renderer runs in a plain browser (e.g. tests or a web preview). */
    nexus?: NexusBridge;
  }
}

export {};
