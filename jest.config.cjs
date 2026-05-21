module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/firebase/**/*.js',
    'src/components/**/*.jsx'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.jsx?$': ['babel-jest', { configFile: './babel.config.cjs' }]
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/firebase/**/*.js',
    'src/components/**/*.jsx',
    'src/pages/ServiceDetail.jsx'
  ],
  coverageReporters: ['lcov', 'text'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
