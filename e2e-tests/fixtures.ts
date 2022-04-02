import * as fs from 'fs'
import * as path from 'path'
import { test as base, expect, ConsoleMessage } from '@playwright/test';
import { ElectronApplication, Page, BrowserContext, _electron as electron } from 'playwright'
import { loadLocalGraph, randomString } from './utils';

let electronApp: ElectronApplication
let context: BrowserContext
let page: Page

let repoName = randomString(10)
let testTmpDir = path.resolve(__dirname, '../tmp')

if (fs.existsSync(testTmpDir)) {
    fs.rmdirSync(testTmpDir, { recursive: true })
}

export let graphDir = path.resolve(testTmpDir, "e2e-test", repoName)

// NOTE: This is a console log watcher for error logs.
const consoleLogWatcher = (msg: ConsoleMessage) => {
    // console.log(msg.text())
  let msgText = msg.text()
  expect(msgText).not.toMatch(/^Failed to/)

  // youtube video
  if (!msgText.match(/^Error with Permissions-Policy header: Unrecognized feature/)) {
    expect(msgText).not.toMatch(/^Error/)
  }

  expect(msgText).not.toMatch(/^Uncaught/)
  // NOTE: React warnings will be logged as error.
  // expect(msg.type()).not.toBe('error')
}

base.beforeAll(async () => {
  if (electronApp) {
    return
  }

  fs.mkdirSync(graphDir, {
    recursive: true,
  });

  electronApp = await electron.launch({
    cwd: "./static",
    args: ["electron.js"],
    locale: 'en',
  })
  context = electronApp.context()
  await context.tracing.start({ screenshots: true, snapshots: true });

  // NOTE: The following ensures App first start with the correct path.
  const info = await electronApp.evaluate(async ({ app }) => {

    return {
      "appPath": app.getAppPath(),
      "appData": app.getPath("appData"),
      "userData": app.getPath("userData"),
      "appName": app.getName(),
    }
  })
  console.log("Test start with:", info)

  page = await electronApp.firstWindow()
  // Direct Electron console to watcher
  page.on('console', consoleLogWatcher)
  page.on('crash', () => {
    expect('page must not crash!').toBe('page crashed')
  })
  page.on('pageerror', (err) => {
    console.error("[pageerror]", err)
    expect('page must not have errors!').toBe('page has some error')
  })

  await page.waitForLoadState('domcontentloaded')
  await page.waitForFunction('window.document.title != "Loading"')
  // NOTE: The following ensures first start.
  // await page.waitForSelector('text=This is a demo graph, changes will not be saved until you open a local folder')

  await page.waitForSelector(':has-text("Loading")', {
    state: "hidden",
    timeout: 1000 * 15,
  });

  page.once('load', async () => {
    console.log('Page loaded!')
    await page.screenshot({ path: 'startup.png' })
  })

  await loadLocalGraph(page, graphDir);
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
