module.exports = {
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true,
          },
          transform: {
            react: {
              runtime: 'classic',
            },
          },
          target: 'es5',
          loose: false,
          externalHelpers: false,
          // Requires v1.2.50 or upper and requires target to be es2016 or upper.
          keepClassNames: false,
        },
      },
    ],
  },
};
