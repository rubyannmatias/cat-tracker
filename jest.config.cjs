module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.cjs'],
  
  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(supertest|@testing-library|uuid)/)',
    'server/(?!.*\\.cjs$)'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    'server/**/*.js',
    '!src/main.js',
    '!**/node_modules/**'
  ],
  
  // Coverage thresholds - temporarily disabled for initial setup
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true
};
