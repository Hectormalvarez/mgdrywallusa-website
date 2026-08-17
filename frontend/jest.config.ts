import type { Config } from "jest";

const config: Config = {
  testEnvironment: "<rootDir>/jest-env-jsdom-extended.ts",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.m?js$": ["babel-jest", { configFile: "./jest.babel.config.js" }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@tests/(.*)$": "<rootDir>/tests/$1",
  },
  testMatch: ["<rootDir>/tests/**/*.test.{ts,tsx}"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transformIgnorePatterns: [],
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
  modulePathIgnorePatterns: ["/e2e/"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 85,
      statements: 85,
    },
  },
};

export default config;
