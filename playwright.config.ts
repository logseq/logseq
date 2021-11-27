import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: './e2e-tests',
  maxFailures: 1,
  use: {
    screenshot: 'only-on-failure',
  }
}

export default config
