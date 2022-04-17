import * as fs from 'fs'
import * as path from 'path'
import { test as base, expect, ConsoleMessage, Locator } from '@playwright/test';
import { ElectronApplication, Page, BrowserContext, _electron as electron } from 'playwright'
import { loadLocalGraph, openLeftSidebar, randomString } from './utils';

let electronApp: ElectronApplication
let context: BrowserContext
let page: Page

let repoName = randomString(10)
let testTmpDir = path.resolve(__dirname, '../tmp')

if (fs.existsSync(testTmpDir)) {
  fs.rmSync(testTmpDir, { recursive: true })
}

export let graphDir = path.resolve(testTmpDir, "e2e-test", repoName)

// NOTE: This following is a console log watcher for error logs.
// Save and print all logs when error happens.
let logs: string
const consoleLogWatcher = (msg: ConsoleMessage) => {
  // console.log(msg.text())
  const text = msg.text()
  logs += text + '\n'
  expect(text, logs).not.toMatch(/^(Failed to|Uncaught)/)

  // youtube video
  if (!text.match(/^Error with Permissions-Policy header: Unrecognized feature/)) {
    expect(text, logs).not.toMatch(/^Error/)
  }

  // NOTE: React warnings will be logged as error.
  // expect(msg.type()).not.toBe('error')
}

base.beforeAll(async () => {
  if (electronApp) {
    return
  }

  console.log(`Creating test graph directory: ${graphDir}`)
  fs.mkdirSync(graphDir, {
    recursive: true,
  });

  electronApp = await electron.launch({
    cwd: "./static",
    args: ["electron.js"],
    locale: 'en',
    timeout: 10_000, // should be enough for the app to start
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
      "electronVersion": app.getVersion(),
    }
  })
  console.log("Test start with:", info)

  page = await electronApp.firstWindow()
  // Direct Electron console to watcher
  page.on('console', consoleLogWatcher)
  page.on('crash', () => {
    expect(false, "Page must not crash").toBeTruthy()
  })
  page.on('pageerror', (err) => {
    console.log(err)
    expect(false, 'Page must not have errors!').toBeTruthy()
  })

  await page.waitForLoadState('domcontentloaded')
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

  // render app
  await page.waitForFunction('window.document.title !== "Loading"')
  expect(await page.title()).toMatch(/^Logseq.*?/)
  await openLeftSidebar(page)
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

/**
 * Block provides helper functions for Logseq's block testing.
 */
interface Block {
  /** Must fill some text into a block, use `textarea >> nth=0` as selector. */
  mustFill(value: string): Promise<void>;
  /**
   * Must type input some text into an **empty** block.
   * **DO NOT USE** this if there's auto-complete
   */
  mustType(value: string, options?: { delay?: number, toBe?: string }): Promise<void>;
  /**
   * Press Enter and go to next block, require cursor to be in current block(editing mode).
   * When cursor is not at the end of block, trailing text will be moved to the next block.
   */
  enterNext(): Promise<Locator>;
  /** Click `.add-button-link-wrap` and create the next block. */
  clickNext(): Promise<Locator>;
  /** Indent block, return whether it's success. */
  indent(): Promise<boolean>;
  /** Unindent block, return whether it's success. */
  unindent(): Promise<boolean>;
  /** Await for a certain number of blocks, with default timeout. */
  waitForBlocks(total: number): Promise<void>;
  /** Await for a certain number of selected blocks, with default timeout. */
  waitForSelectedBlocks(total: number): Promise<void>;
  /** Escape editing mode, modal popup and selection. */
  escapeEditing(): Promise<void>;
  /** Find current selectionStart, i.e. text cursor position. */
  selectionStart(): Promise<number>;
  /** Find current selectionEnd. */
  selectionEnd(): Promise<number>;
}

// hijack electron app into the test context
// FIXME: add type to `block`
export const test = base.extend<{ page: Page, block: Block, context: BrowserContext, app: ElectronApplication, graphDir: string }>({
  page: async ({ }, use) => {
    await use(page);
  },

  // Timeout is used to avoid global timeout, local timeout will have a meaningful error report.
  // 1s timeout is enough for most of the test cases.
  // Timeout won't introduce additional sleeps.
  block: async ({ page }, use) => {
    const block = {
      mustFill: async (value: string) => {
        const locator: Locator = page.locator('textarea >> nth=0')
        await locator.waitFor({ timeout: 1000 })
        await locator.fill(value)
        await expect(locator).toHaveText(value, { timeout: 1000 })
      },
      mustType: async (value: string, options?: { delay?: number, toBe?: string }) => {
        const locator: Locator = page.locator('textarea >> nth=0')
        await locator.waitFor({ timeout: 1000 })
        const { delay = 50 } = options || {};
        const { toBe = value } = options || {};
        await locator.type(value, { delay })
        await expect(locator).toHaveText(toBe, { timeout: 1000 })
      },
      enterNext: async (): Promise<Locator> => {
        let blockCount = await page.locator('.page-blocks-inner .ls-block').count()
        await page.press('textarea >> nth=0', 'Enter')
        await page.waitForSelector(`.ls-block >> nth=${blockCount} >> textarea`, { state: 'visible', timeout: 1000 })
        return page.locator('textarea >> nth=0')
      },
      clickNext: async (): Promise<Locator> => {
        let blockCount = await page.locator('.page-blocks-inner .ls-block').count()
        // the next element after all blocks.
        await page.click('.add-button-link-wrap')
        await page.waitForSelector(`.ls-block >> nth=${blockCount} >> textarea`, { state: 'visible', timeout: 1000 })
        return page.locator('textarea >> nth=0')
      },
      indent: async (): Promise<boolean> => {
        const locator = page.locator('textarea >> nth=0')
        const before = await locator.boundingBox()
        await locator.press('Tab', { delay: 100 })
        return (await locator.boundingBox()).x > before.x
      },
      unindent: async (): Promise<boolean> => {
        const locator = page.locator('textarea >> nth=0')
        const before = await locator.boundingBox()
        await locator.press('Shift+Tab', { delay: 100 })
        return (await locator.boundingBox()).x < before.x
      },
      waitForBlocks: async (total: number): Promise<void> => {
        // NOTE: `nth=` counts from 0.
        await page.waitForSelector(`.ls-block >> nth=${total - 1}`, { timeout: 1000 })
        await page.waitForSelector(`.ls-block >> nth=${total}`, { state: 'detached', timeout: 1000 })
      },
      waitForSelectedBlocks: async (total: number): Promise<void> => {
        // NOTE: `nth=` counts from 0.
        await page.waitForSelector(`.ls-block.selected >> nth=${total - 1}`, { timeout: 1000 })
      },
      escapeEditing: async (): Promise<void> => {
        await page.keyboard.press('Escape')
        await page.keyboard.press('Escape')
      },
      selectionStart: async (): Promise<number> => {
        return await page.locator('textarea >> nth=0').evaluate(node => {
          const elem = <HTMLTextAreaElement>node
          return elem.selectionStart
        })
      },
      selectionEnd: async (): Promise<number> => {
        return await page.locator('textarea >> nth=0').evaluate(node => {
          const elem = <HTMLTextAreaElement>node
          return elem.selectionEnd
        })
      }
    }
    use(block)
  },

  context: async ({ }, use) => {
    await use(context);
  },
  app: async ({ }, use) => {
    await use(electronApp);
  },
  graphDir: async ({ }, use) => {
    await use(graphDir);
  },
});
