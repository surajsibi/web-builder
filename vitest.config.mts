import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

import { PercentileBenchmarkReporter } from "./src/builder/commands/__benchmarks__/percentile-benchmark-reporter.mts";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    benchmark: {
      includeSamples: true,
      reporters: ["default", new PercentileBenchmarkReporter()],
    },
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    restoreMocks: true,
  },
});
