import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text'], // 'lcov' est indispensable pour SonarQube
}

export default createJestConfig(config)

