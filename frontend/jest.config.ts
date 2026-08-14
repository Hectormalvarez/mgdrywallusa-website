import type { Config } from "jest";

const config: Config = {
  testEnvironment: "<rootDir>/jest-env-jsdom-extended.ts",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.m?js$": "babel-jest",
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transformIgnorePatterns: [],
};

export default config;
