// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  // Run tests sequentially — we're capturing screenshots, not running in parallel
  workers: 1,

  use: {
    // Static file server started via webServer below
    baseURL: 'http://localhost:3000',
  },

  // Auto-start a static file server before the tests run
  webServer: {
    command: 'npx serve . -p 3000 --no-clipboard',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  reporter: [['list'], ['html', { outputFolder: 'tests/report', open: 'never' }]],
});
