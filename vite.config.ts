import type { UserConfig } from "vite";

import { PluginOption } from "vite";

function reload(): PluginOption {
  return {
    name: "reload",
    handleHotUpdate({ file, server }) {
      server.ws.send({
        type: "full-reload",
      });
      return [];
    },
  };
}

export default {
  plugins: [reload()],
  resolve: {
    alias: {},
  },
  esbuild: {
    supported: {
      "top-level-await": true,
    },
  },
  optimizeDeps: {
    exclude: ["jolt-physics"],
    esbuildOptions: {
      supported: {
        "top-level-await": true,
      },
    },
  },
} satisfies UserConfig;
