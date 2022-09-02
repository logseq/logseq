import { expect } from '@playwright/test'
import { test } from './fixtures'

test('enable whiteboards', async ({ page }) => {
    await page.click('#head .toolbar-dots-btn')
    await page.click('#head .dropdown-wrapper .ti-settings')
    await page.click('.settings-modal a[data-id=features]')
    await page.click('text=Whiteboards >> .. >> .ui__toggle')
    await page.keyboard.press('Escape')
    await expect(page.locator('.nav-header .whiteboard')).toBeVisible()
})

test('create new whiteboard', async ({ page }) => {
    await page.click('.nav-header .whiteboard')
    await page.click('#main-content-container .dashboard-create-card')
    await expect(page.locator('.logseq-tldraw')).toBeVisible()
})

test('set whiteboard title', async ({ page }) => {
    const title = "my-whiteboard"
    await page.click('.whiteboard-page-title')
    await page.type('.whiteboard-page-title .title', title)
    await page.keyboard.press('Enter')
    await expect(page.locator('.whiteboard-page-title .title')).toContainText(title);
})

test('open context menu', async ({ page }) => {
    await page.locator('.logseq-tldraw').click({button: "right"})
    await expect(page.locator('.tl-context-menu')).toBeVisible()
})

test('close context menu on esc', async ({ page }) => {
    await page.keyboard.press('Escape')
    await expect(page.locator('.tl-context-menu')).toBeHidden()
})
