import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      ".next/",
      "node_modules/",
      "coverage/",
      "**/__tests__/**",
      "jest*.ts",
      "jest*.js",
      "jest-env-jsdom-extended.ts",
      "jest.babel.config.js",
      "postcss.config.mjs",
    ],
  },
];

export default eslintConfig;

