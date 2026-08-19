import { writeFileSync } from "node:fs";
import type { BenchmarkResult } from "vitest";
import {
  experimental_getRunnerTask,
  type Reporter,
  type TestModule,
} from "vitest/node";

function nearestRankPercentile(
  samples: readonly number[],
  percentile: number,
): number {
  const sortedSamples = [...samples].sort((left, right) => left - right);
  const rank = Math.ceil(percentile * sortedSamples.length);

  return sortedSamples[Math.max(0, rank - 1)] ?? 0;
}

function formatMilliseconds(value: number): string {
  return `${value.toFixed(4)} ms`;
}

type PortableBenchmarkResult = {
  file: string;
  fullName: string;
  name: string;
  median: number;
  p95: number;
  sampleCount: number;
  samples: readonly number[];
};

function normalizedPath(path: string): string {
  const normalized = path.replaceAll("\\", "/");
  const sourceIndex = normalized.lastIndexOf("/src/");

  return sourceIndex >= 0 ? normalized.slice(sourceIndex + 1) : normalized;
}

export class PercentileBenchmarkReporter implements Reporter {
  onTestRunEnd(testModules: readonly TestModule[]): void {
    const results: PortableBenchmarkResult[] = [];

    for (const testModule of testModules) {
      for (const testCase of testModule.children.allTests()) {
        const task = experimental_getRunnerTask(testCase);
        const benchmark = (
          task.result as { benchmark?: BenchmarkResult } | undefined
        )?.benchmark;

        if (benchmark?.samples.length) {
          results.push({
            file: normalizedPath(testModule.relativeModuleId),
            fullName: testCase.fullName,
            name: benchmark.name,
            median: benchmark.median,
            p95: nearestRankPercentile(benchmark.samples, 0.95),
            sampleCount: benchmark.samples.length,
            samples: [...benchmark.samples],
          });
        }
      }
    }

    if (!results.length) return;

    console.log("\n BENCH  Median and nearest-rank p95");
    for (const result of results) {
      console.log(
        `   - ${result.name}: median ${formatMilliseconds(result.median)}; p95 ${formatMilliseconds(result.p95)}; samples ${result.sampleCount}`,
      );
    }

    const outputPath = process.env.CSB_BENCHMARK_OUTPUT;
    if (outputPath) {
      writeFileSync(
        outputPath,
        `${JSON.stringify(
          {
            schemaVersion: 1,
            runtime: {
              node: process.version,
              platform: process.platform,
              architecture: process.arch,
            },
            percentileMethod: "nearest-rank",
            benchmarks: results,
          },
          null,
          2,
        )}\n`,
        "utf8",
      );
      console.log("Benchmark JSON evidence written in UTF-8.");
    }

    const logOutputPath = process.env.CSB_BENCHMARK_LOG_OUTPUT;
    if (logOutputPath) {
      writeFileSync(
        logOutputPath,
        [
          "BENCHMARK EVIDENCE",
          `Node: ${process.version}`,
          `Platform: ${process.platform} ${process.arch}`,
          "Percentile method: nearest-rank",
          ...results.map(
            (result) =>
              `${result.file} | ${result.name} | median ${formatMilliseconds(result.median)} | p95 ${formatMilliseconds(result.p95)} | samples ${result.sampleCount}`,
          ),
          "",
        ].join("\n"),
        "utf8",
      );
      console.log("Benchmark log evidence written in UTF-8.");
    }
  }
}
