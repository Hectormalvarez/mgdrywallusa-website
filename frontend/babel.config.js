/**
 * Babel config for Jest only — not used by Next.js (which has its own SWC compiler).
 * Needed to transform MSW's ESM .mjs files into CJS for Jest.
 */
module.exports = {
  env: {
    test: {
      presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
    },
  },
};
