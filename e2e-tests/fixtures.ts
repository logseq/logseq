import fs from 'fs'
import path from 'path'
import { test as base } from '@playwright/test';
import { ElectronApplication, Page, BrowserContext, _electron as electron } from 'playwright'
import { randomString } from './utils';

let electronApp: ElectronApplication
let context: BrowserContext
let page: Page
let repoName = randomString(10)
export let graphDir = path.resolve(__dirname, '../tmp/e2e-graph', repoName)

base.beforeAll(async () => {
  if (electronApp) {
    return ;
  }

  fs.mkdirSync(graphDir, {
    recursive: true,
  });

  electronApp = await electron.launch({
    cwd: "./static",
    args: ["electron.js"],
    env: {
      ...process.env,
      LOGSEQ_OVERWRITE_OPEN_DIR: graphDir
    }
  })

  context = electronApp.context()
  await context.tracing.start({ screenshots: true, snapshots: true });

  // NOTE: The following ensures App first start with the correct path.

  const appPath = await electronApp.evaluate(async ({ app }) => {
    return app.getAppPath()
  })
  console.log("Test start with AppPath:", appPath)

  page = await electronApp.firstWindow()

  await page.waitForLoadState('domcontentloaded')
  await page.waitForFunction('window.document.title != "Loading"')
  await page.waitForSelector('text=This is a demo graph, changes will not be saved until you open a local folder')

  page.once('load', async () => {
    console.log('Page loaded!')
    await page.screenshot({ path: 'startup.png' })
  })

  // load temporary graph
  await page.click('#head >> .button >> text=Open')
  
  // make sure the temp graph is loaded
  await page.waitForSelector(`#left-sidebar >> text=${repoName}`)
})

base.beforeEach(async () => {
  // discard any dialog by ESC
  if (page) {
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
  }
})

base.afterAll(async () => {
  // if (electronApp) {
  //  await electronApp.close()
  //}
})



// hijack electron app into the test context
export const test = base.extend<{ page: Page, context: BrowserContext, app: ElectronApplication }>({
  page: async ({ }, use) => {
    await use(page);
  },
  context: async ({ }, use) => {
    await use(context);
  },
  app: async ({ }, use) => {
    await use(electronApp);
  }
});
