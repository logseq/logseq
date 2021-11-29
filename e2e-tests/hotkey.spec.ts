import { test, expect } from '@playwright/test'
import { ElectronApplication, Page, BrowserContext, _electron as electron } from 'playwright'
import { createRandomPage, newBlock, lastBlock, appFirstLoaded, IsMac, IsLinux } from './utils'

let electronApp: ElectronApplication
let context: BrowserContext
let page: Page

test.beforeAll(async () => {
    electronApp = await electron.launch({
        cwd: "./static",
        args: ["electron.js"],
    })

    context = electronApp.context()
    await context.tracing.start({ screenshots: true, snapshots: true });
})

test.beforeEach(async () => {
    // discard any dialog by ESC
    if (page) {
        await page.keyboard.press('Escape')
        await page.keyboard.press('Escape')
    } else {
        page = await electronApp.firstWindow()
    }
})

test.afterAll(async () => {
    await electronApp.close()
})

test('open search dialog', async () => {
    await appFirstLoaded(page)

    if (IsMac) {
        await page.keyboard.press('Meta+k')
    } else if (IsLinux) {
        await page.keyboard.press('Control+k')
    } else {
        // TODO: test on Windows and other platforms
        expect(false)
    }

    await page.waitForSelector('[placeholder="Search or create page"]')
})

// See-also: https://github.com/logseq/logseq/issues/3278
test('insert link', async () => {
    await createRandomPage(page)

    let hotKey = 'Control+l'
    let selectAll = 'Control+a'
    if (IsMac) {
        hotKey = 'Meta+l'
        selectAll = 'Meta+a'
    }

    // Case 1: empty link
    await lastBlock(page)
    await page.press(':nth-match(textarea, 1)', hotKey)
    expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('[]()')
    await page.type(':nth-match(textarea, 1)', 'Logseq Website')
    expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('[Logseq Website]()')

    // Case 2: link with label
    await newBlock(page)
    await page.type(':nth-match(textarea, 1)', 'Logseq')
    await page.press(':nth-match(textarea, 1)', selectAll)
    await page.press(':nth-match(textarea, 1)', hotKey)
    expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('[Logseq]()')
    await page.type(':nth-match(textarea, 1)', 'https://logseq.com/')
    expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('[Logseq](https://logseq.com/)')

    // Case 3: link with URL
    await newBlock(page)
    await page.type(':nth-match(textarea, 1)', 'https://logseq.com/')
    await page.press(':nth-match(textarea, 1)', selectAll)
    await page.press(':nth-match(textarea, 1)', hotKey)
    expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('[](https://logseq.com/)')
    await page.type(':nth-match(textarea, 1)', 'Logseq')
    expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('[Logseq](https://logseq.com/)')
})
