import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/react-app/routes",
      generatedRouteTree: "./src/react-app/routeTree.gen.ts",
    }),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", {}]],
      },
    }),
    tailwindcss(),
    cloudflare(),
  ],
  define: {
    "import.meta.env.VITE_DODO_PRO_PRODUCT_ID": JSON.stringify(
      process.env.DODO_PRO_PRODUCT_ID,
    ),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/react-app"),
      "@worker": path.resolve(__dirname, "./src/worker"),
    },
  },
});
