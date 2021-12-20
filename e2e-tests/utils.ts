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
* Locate the last block in the editor
* @param page The Playwright Page object.
* @param inner_only If true, only return the .page-inner-block which has no 
extra blocks like linked references included. Defaults to false.
* @returns The locator of the last block.
*/
export async function lastBlock(page: Page, inner_only: Boolean = false): Promise<Locator> {
    // discard any popups
    await page.keyboard.press('Escape')
    // click last block
    if (inner_only) 
        await page.click('.page-blocks-inner .ls-block >> nth=-1')
    else
        await page.click('.ls-block >> nth=-1')
    // wait for textarea
    await page.waitForSelector(':nth-match(textarea, 1)', { state: 'visible' })

    return page.locator(':nth-match(textarea, 1)')
}

/**
* Create and locate a new block at the end of the editor
* @param page The Playwright Page object 
* @param inner_only If true, only consider the .page-inner-block that no extra 
blocks like linked references considered. Defaults to false.
* @returns The locator of the last block
*/
export async function newBlock(page: Page, inner_only: Boolean = false): Promise<Locator> {
    await lastBlock(page, inner_only)
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
