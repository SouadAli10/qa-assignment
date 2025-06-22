import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/index.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: false,
    screenshotOnRunFailure: false,
    chromeWebSecurity: false,
    env: {
      golangAPI: 'http://localhost:3001',
      nodeAPI: 'http://localhost:3000'
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
}) 