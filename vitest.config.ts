import swc from "unplugin-swc";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: "./",
    globals: true,
    isolate: false,
    passWithNoTests: true,
    include: ["tests/unit/**/*.test.ts"],
    env: loadEnv("test", process.cwd(), ""),
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      reportsDirectory: "coverage/unit",
      include: ["src/**/*.ts"],
    },
    benchmark: {
      include: ["tests/bench/**/*.bench.ts"],
    },
  },
  plugins: [swc.vite({ module: { type: "es6" } })],
});
