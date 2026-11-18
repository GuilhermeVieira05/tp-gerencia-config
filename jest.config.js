module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  // Aceitacao precisa da API no ar: roda separado (jest.acceptance.config.js)
  testPathIgnorePatterns: ['/node_modules/', '/tests/acceptance/'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { rootDir: '.', strict: true, esModuleInterop: true } }],
  },
};
