import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

import { PercentileBenchmarkReporter } from "./src/builder/commands/__benchmarks__/percentile-benchmark-reporter.mts";

export default defineConfig({
  root: process.env.CSB_BENCHMARK_ROOT,
  plugins: [tsconfigPaths(), react()],
  test: {
    benchmark: {
      includeSamples: true,
      reporters: ["default", new PercentileBenchmarkReporter()],
    },
    css: {
      include: [/project-dashboard-theme\.css$/],
    },
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    restoreMocks: true,
  },
});
