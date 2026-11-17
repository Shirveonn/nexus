import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import type { Plugin } from "vite";

/**
 * Strict Content-Security-Policy for production builds.
 * (Dev mode is skipped because Vite's hot reload needs inline scripts.)
 * When Supabase is added, extend connect-src with https://<project>.supabase.co and wss://<project>.supabase.co.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'"
].join("; ");

function contentSecurityPolicy(): Plugin {
  return {
    name: "nexus-csp",
    apply: "build",
    transformIndexHtml: html =>
      html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`)
  };
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve("electron/main/index.ts") }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve("electron/preload/index.ts") }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        "@": resolve("src/renderer/src")
      }
    },
    plugins: [react(), contentSecurityPolicy()]
  }
});