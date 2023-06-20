import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  // The directory where the tests are located
  // The order of the tests is determined by the file names alphabetically.
  testDir: './e2e-tests',

  // The number of retries before marking a test as failed.
  maxFailures: 1,

  // The number of Logseq instances to run in parallel.
  // NOTE: must be 1 for now, otherwise tests will fail.
  workers: 1,

  // 'github' for GitHub Actions CI to generate annotations, plus a concise 'dot'.
  // default 'list' when running locally.
  reporter: process.env.CI ? 'github' : 'list',

  // Fail the build on CI if test.only is present.
  forbidOnly: !!process.env.CI,

  use: {
    // SCapture screenshot after each test failure.
    screenshot: 'only-on-failure',
  },
}

export default config
