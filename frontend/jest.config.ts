import type { Config } from "jest";

const config: Config = {
  testEnvironment: "<rootDir>/jest-env-jsdom-extended.ts",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.m?js$": ["babel-jest", { configFile: "./jest.babel.config.js" }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transformIgnorePatterns: [],
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
  modulePathIgnorePatterns: ["/e2e/"],
};

export default config;
