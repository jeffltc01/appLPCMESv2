import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5510,
    proxy: {
      "/api": {
        target: "http://localhost:5500",
        changeOrigin: true,
      },
    },
  },
});
