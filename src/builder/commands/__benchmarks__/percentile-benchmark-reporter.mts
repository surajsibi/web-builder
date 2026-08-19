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

export class PercentileBenchmarkReporter implements Reporter {
  onTestRunEnd(testModules: readonly TestModule[]): void {
    const results: BenchmarkResult[] = [];

    for (const testModule of testModules) {
      for (const testCase of testModule.children.allTests()) {
        const task = experimental_getRunnerTask(testCase);
        const benchmark = (
          task.result as { benchmark?: BenchmarkResult } | undefined
        )?.benchmark;

        if (benchmark?.samples.length) results.push(benchmark);
      }
    }

    if (!results.length) return;

    console.log("\n BENCH  Median and nearest-rank p95");
    for (const result of results) {
      console.log(
        `   · ${result.name}: median ${formatMilliseconds(result.median)}; p95 ${formatMilliseconds(nearestRankPercentile(result.samples, 0.95))}; samples ${result.samples.length}`,
      );
    }
  }
}
