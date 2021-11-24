import { Page } from 'playwright'
import { expect } from '@playwright/test'


export function randomString(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

export async function openSidebar(page: Page) {
    let sidebarVisible = await page.isVisible('#sidebar-nav-wrapper .left-sidebar-inner')
    if (!sidebarVisible) {
        await page.click('#left-menu.button')
    }
    await page.waitForSelector('#sidebar-nav-wrapper .left-sidebar-inner', { state: 'visible' })
}

export async function createRandomPage(page: Page) {
    const randomTitle = randomString(20)

    // Click #sidebar-nav-wrapper a:has-text("New page")
    await page.click('#sidebar-nav-wrapper a:has-text("New page")')
    // Fill [placeholder="Search or create page"]
    await page.fill('[placeholder="Search or create page"]', randomTitle)
    // Click text=/.*New page: "new page".*/
    await page.click('text=/.*New page: ".*/')
    // wait for textarea of first block
    await page.waitForSelector(':nth-match(textarea, 1)', { state: 'visible' })
}

export async function lastBlock(page: Page) {
    // discard any popups
    await page.keyboard.press('Escape')
    // click last block
    await page.click('.ls-block >> nth=-1')
    // wait for textarea
    await page.waitForSelector(':nth-match(textarea, 1)', { state: 'visible' })
}

export async function newBlock(page: Page) {
    await lastBlock(page)
    await page.press(':nth-match(textarea, 1)', 'Enter')
}
