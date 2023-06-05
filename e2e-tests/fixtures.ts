import * as fs from 'fs'
import * as path from 'path'
import { test as base, expect, ConsoleMessage, Locator } from '@playwright/test';
import { ElectronApplication, Page, BrowserContext, _electron as electron } from 'playwright'
import { loadLocalGraph, openLeftSidebar, randomString } from './utils';
import { autocompleteMenu, LogseqFixtures } from './types';

let electronApp: ElectronApplication
let context: BrowserContext
let page: Page

// For testing special characters in graph name / path
let repoName = "@" + randomString(10)
let testTmpDir = path.resolve(__dirname, '../tmp')

if (fs.existsSync(testTmpDir)) {
  fs.rmSync(testTmpDir, { recursive: true })
}

export let graphDir = path.resolve(testTmpDir, "#e2e-test", repoName)

// NOTE: This following is a console log watcher for error logs.
// Save and print all logs when error happens.
let logs: string = '';
const consoleLogWatcher = (msg: ConsoleMessage) => {
  const text = msg.text();

  // List of error messages to ignore
  const ignoreErrors = [
    /net/,
    /^Error with Permissions-Policy header:/
  ];

  // If the text matches any of the ignoreErrors, return early
  if (ignoreErrors.some(error => text.match(error))) {
    console.log(`WARN:: ${text}\n`)
    return;
  }

  logs += text + '\n';
  expect(text, logs).not.toMatch(/^(Failed to|Uncaught|Assert failed)/);
  expect(text, logs).not.toMatch(/^Error/);
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
  await context.tracing.startChunk();

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

  // inject testing flags
  await page.evaluate(
    () => {
      Object.assign(window, {
        __E2E_TESTING__: true,
      })
    },
  )

  // Direct Electron console to watcher
  page.on('console', consoleLogWatcher)
  page.on('crash', () => {
    expect(false, "Page must not crash").toBeTruthy()
  })
  page.on('pageerror', (err) => {
    console.log(err)
    // expect(false, 'Page must not have errors!').toBeTruthy()
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

    await expect(page.locator('.notification-close-button')).not.toBeVisible()

    const rightSidebar = page.locator('.cp__right-sidebar-inner')
    if (await rightSidebar.isVisible()) {
      await page.click('button.toggle-right-sidebar', {delay: 100})
    }
  }
})

// hijack electron app into the test context
// FIXME: add type to `block`
export const test = base.extend<LogseqFixtures>({
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
        await page.$eval('.add-button-link-wrap', (element) => {
          element.scrollIntoView();
        });
        let blockCount = await page.locator('.page-blocks-inner .ls-block').count()
        // the next element after all blocks.
        await page.click('.add-button-link-wrap', { delay: 100 })
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
        await page.waitForSelector(`.ls-block >> nth=${total - 1}`, { state: 'attached', timeout: 50000 })
        await page.waitForSelector(`.ls-block >> nth=${total}`, { state: 'detached', timeout: 50000 })
      },
      waitForSelectedBlocks: async (total: number): Promise<void> => {
        // NOTE: `nth=` counts from 0.
        await page.waitForSelector(`.ls-block.selected >> nth=${total - 1}`, { timeout: 1000 })
      },
      escapeEditing: async (): Promise<void> => {
        const blockEdit = page.locator('.ls-block textarea >> nth=0')
        while (await blockEdit.isVisible()) {
          await page.keyboard.press('Escape')
        }
        const blockSelect = page.locator('.ls-block.selected')
        while (await blockSelect.isVisible()) {
          await page.keyboard.press('Escape')
        }
      },
      activeEditing: async (nth: number): Promise<void> => {
        await page.waitForSelector(`.ls-block >> nth=${nth}`, { timeout: 1000 })
        // scroll, for isVisible test
        await page.$eval(`.ls-block >> nth=${nth}`, (element) => {
          element.scrollIntoView();
        });
        // when blocks are nested, the first block(the parent) is selected.
        if (
          (await page.isVisible(`.ls-block >> nth=${nth} >> .editor-wrapper >> textarea`)) &&
          !(await page.isVisible(`.ls-block >> nth=${nth} >> .block-children-container >> textarea`))) {
          return;
        }
        await page.click(`.ls-block >> nth=${nth} >> .block-content`, { delay: 10, timeout: 100000 })
        await page.waitForSelector(`.ls-block >> nth=${nth} >> .editor-wrapper >> textarea`, { timeout: 1000, state: 'visible' })
      },
      isEditing: async (): Promise<boolean> => {
        const locator = page.locator('.ls-block textarea >> nth=0')
        return await locator.isVisible()
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

  autocompleteMenu: async ({ }, use) => {
    const autocompleteMenu: autocompleteMenu = {
      expectVisible: async (modalName?: string) => {
        const modal = page.locator(modalName ? `[data-modal-name="${modalName}"]` : `[data-modal-name]`)
        if (await modal.isVisible()) {
          await page.waitForTimeout(100)
          await expect(modal).toBeVisible()
        } else {
          await modal.waitFor({ state: 'visible', timeout: 1000 })
        }
      },
      expectHidden: async (modalName?: string) => {
        const modal = page.locator(modalName ? `[data-modal-name="${modalName}"]` : `[data-modal-name]`)
        if (!await modal.isVisible()) {
          await page.waitForTimeout(100)
          await expect(modal).not.toBeVisible()
        } else {
          await modal.waitFor({ state: 'hidden', timeout: 1000 })
        }
      }
    }
    await use(autocompleteMenu)
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


let getTracingFilePath = function(): string {
  return `e2e-dump/trace-${Date.now()}.zip.dump`
}


test.afterAll(async () => {
  await context.tracing.stopChunk({ path: getTracingFilePath() });
})


/**
 * Trace all tests in a file
 */
export let traceAll = function(){
  test.beforeAll(async () => {
    await context.tracing.startChunk();
  })

  test.afterAll(async () => {
    await context.tracing.stopChunk({ path: getTracingFilePath() });
  })
}
