import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: './e2e-tests',
  maxFailures: 1,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // NOTE: must be 1 for now, otherwise tests will fail.
  use: {
    screenshot: 'only-on-failure',
  }
}

export default config
