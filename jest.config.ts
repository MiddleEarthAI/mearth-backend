/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from "@jest/types";
import { pathsToModuleNameMapper } from "ts-jest";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  modulePaths: ["<rootDir>"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/coverage/**",
  ],
  coverageReporters: ["text", "json", "html"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  verbose: true,
};

export default config;
