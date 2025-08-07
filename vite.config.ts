import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

// Safe way to get directory that works in both bundled and non-bundled environments
const getDirname = () => {
  if (typeof import.meta.dirname !== 'undefined') {
    return import.meta.dirname;
  }
  // Fallback for bundled environments
  return process.cwd();
};

const dirname = getDirname();

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "client", "src"),
      "@shared": path.resolve(dirname, "shared"),
      "@assets": path.resolve(dirname, "attached_assets"),
    },
  },
  root: path.resolve(dirname, "client"),
  build: {
    outDir: path.resolve(dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
