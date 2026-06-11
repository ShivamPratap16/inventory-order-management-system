import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev server listens on 5173 and is exposed on all interfaces so it works
// from inside a Docker container too.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
