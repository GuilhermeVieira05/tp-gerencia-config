// Testes de aceitacao (caixa-preta): exigem a API em execucao em BASE_URL.
const base = require('./jest.config');

module.exports = {
  ...base,
  roots: ['<rootDir>/tests/acceptance'],
  testPathIgnorePatterns: ['/node_modules/'],
  testTimeout: 15000,
};
