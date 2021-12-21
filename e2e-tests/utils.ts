import { Page, Locator } from 'playwright'
import { expect } from '@playwright/test'
import process from 'process'

export const IsMac = process.platform === 'darwin'
export const IsLinux = process.platform === 'linux'
export const IsWindows = process.platform === 'win32'

export function randomString(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

export async function appFirstLoaded(page: Page) {
    await page.waitForSelector('text=This is a demo graph, changes will not be saved until you open a local folder')
}

export async function createRandomPage(page: Page) {
    const randomTitle = randomString(20)

    // Click #search-button
    await page.click('#search-button')
    // Fill [placeholder="Search or create page"]
    await page.fill('[placeholder="Search or create page"]', randomTitle)
    // Click text=/.*New page: "new page".*/
    await page.click('text=/.*New page: ".*/')
    // wait for textarea of first block
    await page.waitForSelector(':nth-match(textarea, 1)', { state: 'visible' })
}

/**
* Locate the last block in the inner editor
* @param page The Playwright Page object.
* @returns The locator of the last block.
*/
export async function lastInnerBlock(page: Page): Promise<Locator> {
    // discard any popups
    await page.keyboard.press('Escape')
    // click last block
    await page.click('.page-blocks-inner .ls-block >> nth=-1')
    // wait for textarea
    await page.waitForSelector(':nth-match(textarea, 1)', { state: 'visible' })

    return page.locator(':nth-match(textarea, 1)')
}

export async function lastBlock(page: Page): Promise<Locator> {
    // discard any popups
    await page.keyboard.press('Escape')
    // click last block
    await page.click('.ls-block >> nth=-1')
    // wait for textarea
    await page.waitForSelector(':nth-match(textarea, 1)', { state: 'visible' })

    return page.locator(':nth-match(textarea, 1)')
}

/**
* Create and locate a new block at the end of the inner editor
* @param page The Playwright Page object 
* @returns The locator of the last block
*/
export async function newInnerBlock(page: Page): Promise<Locator> {
    await lastInnerBlock(page)
    await page.press(':nth-match(textarea, 1)', 'Enter')

    return page.locator(':nth-match(textarea, 1)')
}

export async function newBlock(page: Page): Promise<Locator> {
    await lastBlock(page)
    await page.press(':nth-match(textarea, 1)', 'Enter')

    return page.locator(':nth-match(textarea, 1)')
}

export async function escapeToCodeEditor(page: Page): Promise<void> {
    await page.press('.block-editor textarea', 'Escape')
    await page.waitForSelector('.CodeMirror pre', { state: 'visible' })

    await page.waitForTimeout(500)
    await page.click('.CodeMirror pre')
    await page.waitForTimeout(500)

    await page.waitForSelector('.CodeMirror textarea', { state: 'visible' })
}

export async function escapeToBlockEditor(page: Page): Promise<void> {
    await page.waitForTimeout(500)
    await page.click('.CodeMirror pre')
    await page.waitForTimeout(500)

    await page.press('.CodeMirror textarea', 'Escape')
    await page.waitForTimeout(500)
}
