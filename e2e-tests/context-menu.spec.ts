import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage } from './utils'

test('open context menu', async ({ page }) => {
    await createRandomPage(page)

    await page.locator('span.bullet-container >> nth=0').click({button: "right"})

    await expect(page.locator('#custom-context-menu')).toBeVisible()
})

test('close context menu on esc', async ({ page }) => {
    await createRandomPage(page)
  
    await page.locator('span.bullet-container >> nth=0').click({button: "right"})

    await page.keyboard.press('Escape')
  
    await expect(page.locator('#custom-context-menu')).toHaveCount(0)
})

test('close context menu by left clicking on empty space', async ({ page }) => {
    await createRandomPage(page)
  
    await page.locator('span.bullet-container >> nth=0').click({button: "right"})

    await page.mouse.click(0, 200, {button: "left"})
  
    await expect(page.locator('#custom-context-menu')).toHaveCount(0)
})

test('close context menu by clicking on a menu item', async ({ page }) => {
    await createRandomPage(page)

    await page.locator('span.bullet-container >> nth=0').click({button: "right"})

    await page.locator('#custom-context-menu .menu-link >> nth=0').click()

    await expect(page.locator('#custom-context-menu')).toHaveCount(0)
})

test('close context menu by clicking on a block', async ({ page }) => {
    await createRandomPage(page)

    await page.locator('span.bullet-container >> nth=0').click({button: "right"})

    const elementHandle = await page.$('.block-content >> nth=0');

    const box = await elementHandle.boundingBox();

    await page.mouse.click(box.x + box.width - 5, box.y + box.height / 2);

    await expect(page.locator('#custom-context-menu')).toHaveCount(0)
})
