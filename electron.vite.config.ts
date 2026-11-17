import { defineConfig, externalizeDepsPlugin, loadEnv } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import type { Plugin } from "vite";

/**
 * Strict Content-Security-Policy for production builds.
 * (Dev mode is skipped because Vite's hot reload needs inline scripts.)
 * The Supabase project from .env is the only outside server the app may talk to.
 */
function contentSecurityPolicy(supabaseUrl: string | undefined): Plugin {
  let origin = "";
  let wsOrigin = "";
  if (supabaseUrl) {
    const url = new URL(supabaseUrl);
    origin = url.origin;
    wsOrigin = `${url.protocol === "https:" ? "wss:" : "ws:"}//${url.host}`;
  }
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${origin}`.trim(),
    "font-src 'self' data:",
    `connect-src 'self' ${origin} ${wsOrigin}`.trim(),
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'"
  ].join("; ");

  return {
    name: "nexus-csp",
    apply: "build",
    transformIndexHtml: html => html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`)
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      build: { rollupOptions: { input: { index: resolve("electron/main/index.ts") } } }
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
      build: { rollupOptions: { input: { index: resolve("electron/preload/index.ts") } } }
    },
    renderer: {
      resolve: { alias: { "@": resolve("src/renderer/src") } },
      plugins: [react(), contentSecurityPolicy(env.RENDERER_VITE_SUPABASE_URL)]
    }
  };
});
