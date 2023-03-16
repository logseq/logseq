import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createPage, modKey, searchAndJumpToPage } from './utils'

test('undo/redo stack should be different for each page', async ({ page, block }) => {
  const page1 = "Page 1"
  await createPage(page, page1)

  await block.mustType('text 1')
  await page.waitForTimeout(500) // Wait for 500ms autosave period to expire

  await createPage(page, "Page 2")

  await page.keyboard.press(modKey + '+z')
  await page.waitForTimeout(100)

  await searchAndJumpToPage(page, page1)
  await page.waitForTimeout(500)

  await expect(page.locator('text="text 1"')).toHaveCount(1)
})
