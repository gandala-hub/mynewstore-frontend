import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

function federationCssCompatibility(): Plugin {
  return {
    name: "federation-css-array-compatibility",
    apply: "build",
    generateBundle(_options, bundle) {
      const remoteEntry = Object.values(bundle).find(
        (output) => output.type === "chunk" && output.fileName.endsWith("remoteEntry.js"),
      );
      if (remoteEntry?.type === "chunk") {
        remoteEntry.code = remoteEntry.code.replace(
          /a\(`__v__css__\/[^`]*`,!1,(`\.\/[^`]*`)\)/,
          "a([],!1,$1)",
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "products",
      filename: "remoteEntry.js",
      exposes: {
        "./ProductApp": "./src/ProductApp.tsx",
      },
      shared: ["react", "react-dom"],
    }),
    federationCssCompatibility(),
  ],
  server: {
    port: 5174,
    strictPort: true,
  },
  preview: {
    port: 4174,
    strictPort: true,
  },
  build: {
    target: "esnext",
    cssCodeSplit: false,
  },
});