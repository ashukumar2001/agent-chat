import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [TanStackRouterVite({ target: 'react', autoCodeSplitting: true, routesDirectory: "./src/react-app/routes", generatedRouteTree: "./src/react-app/routeTree.gen.ts", }), react({
    babel: {
      plugins: [
        ["babel-plugin-react-compiler", {}],
      ]
    }
  }), tailwindcss(), cloudflare(),],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/react-app"),
      "@worker": path.resolve(__dirname, "./src/worker"),
    },
  },
});
