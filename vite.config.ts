import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";
import type { Plugin } from "vite";

const BUILD_ID = Date.now().toString();

function versionJsonPlugin(): Plugin {
  return {
    name: "emit-version-json",
    apply: "build",
    closeBundle() {
      try {
        const outDir = path.resolve(__dirname, "dist");
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(
          path.join(outDir, "version.json"),
          JSON.stringify({ build: BUILD_ID }),
        );
      } catch {
        // noop
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  define: {
    "import.meta.env.VITE_BUILD_ID": JSON.stringify(BUILD_ID),
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    versionJsonPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
