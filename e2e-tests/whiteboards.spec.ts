import { expect } from '@playwright/test'
import { test } from './fixtures'

test('enable whiteboards', async ({ page }) => {
    await page.click('#head .toolbar-dots-btn')
    await page.click('#head .dropdown-wrapper >> text=Settings')
    await page.click('.settings-modal a[data-id=features]')
    await page.click('text=Whiteboards >> .. >> .ui__toggle')
    await page.keyboard.press('Escape')
    await expect(page.locator('.nav-header .whiteboard')).toBeVisible()
})

test('create new whiteboard', async ({ page }) => {
    await page.click('.nav-header .whiteboard')
    await page.click('#tl-create-whiteboard')
    await expect(page.locator('.logseq-tldraw')).toBeVisible()
})

test('set whiteboard title', async ({ page }) => {
    const title = "my-whiteboard"
    await page.click('.whiteboard-page-title')
    await page.type('.whiteboard-page-title .title', title)
    await page.keyboard.press('Enter')
    await expect(page.locator('.whiteboard-page-title .title')).toContainText(title);
})

test('select rectangle tool', async ({ page }) => {
    await page.keyboard.press('8')
    await expect(page.locator('.tl-geometry-tools-pane-anchor [title="Rectangle (8)"]')).toHaveAttribute('data-selected', 'true')
})

test('draw a rectangle', async ({ page }) => {
    const canvas = await page.waitForSelector('.logseq-tldraw');
    const bounds = (await canvas.boundingBox())!;

    await page.keyboard.press('8')

    await page.mouse.move(bounds.x, bounds.y);
    await page.mouse.down();

    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.up();

    await expect(page.locator('.logseq-tldraw .tl-positioned-svg rect')).not.toHaveCount(0);
})

test('zoom in', async ({ page }) => {
    await page.click('#tl-zoom-in')
    await expect(page.locator('#tl-zoom')).toContainText('125%');
})

test('zoom out', async ({ page }) => {
    await page.click('#tl-zoom-out')
    await expect(page.locator('#tl-zoom')).toContainText('100%');
})

test('open context menu', async ({ page }) => {
    await page.locator('.logseq-tldraw').click({button: "right"})
    await expect(page.locator('.tl-context-menu')).toBeVisible()
})

test('close context menu on esc', async ({ page }) => {
    await page.keyboard.press('Escape')
    await expect(page.locator('.tl-context-menu')).toBeHidden()
})
