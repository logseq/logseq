import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, modKey, searchAndJumpToPage, renamePage, randomString, newInnerBlock } from './utils'

test('undo/redo on a page should work as expected', async ({ page, block }) => {
  const page1 = await createRandomPage(page)

  await block.mustType('text 1')
  await page.waitForTimeout(500) // Wait for 500ms autosave period to expire
  await expect(page.locator('text="text 1"')).toHaveCount(1)

  await page.keyboard.press(modKey + '+z')
  await page.waitForTimeout(100)
  await expect(page.locator('text="text 1"')).toHaveCount(0)

  await page.keyboard.press(modKey + '+Shift+z')
  await page.waitForTimeout(100)
  await expect(page.locator('text="text 1"')).toHaveCount(1)
})

test('should have an isolated undo/redo stack for each page', async ({ page, block }) => {
  const page1 = await createRandomPage(page)

  await block.mustType('text 1')
  await page.waitForTimeout(500) // Wait for 500ms autosave period to expire

  const page2 = await createRandomPage(page)

  await page.keyboard.press(modKey + '+z')
  await page.waitForTimeout(100)

  await searchAndJumpToPage(page, page1)
  await page.waitForTimeout(500)

  await expect(page.locator('text="text 1"')).toHaveCount(1)
})

test('undo/redo of a page should be not be allowed on block context', async ({ page, block }) => {
  const page1 = await createRandomPage(page)

  await block.mustType('text 1')
  await page.waitForTimeout(500) // Wait for 500ms autosave period to expire

  await page.locator('span.bullet-container >> nth=0').click()
  await page.waitForTimeout(200)

  await page.keyboard.press(modKey + '+z')
  await page.waitForTimeout(100)

  await searchAndJumpToPage(page, page1)
  await page.waitForTimeout(500)

  await expect(page.locator('text="text 1"')).toHaveCount(1)
})

test('undo/redo of a block should be allowed on page context', async ({ page, block }) => {
  const page1 = await createRandomPage(page)

  await page.locator('span.bullet-container >> nth=0').click()
  await page.waitForTimeout(200)

  await block.mustType('text 1')
  await page.waitForTimeout(500) // Wait for 500ms autosave period to expire

  await searchAndJumpToPage(page, page1)
  await page.waitForTimeout(500)

  await page.keyboard.press(modKey + '+z')
  await page.waitForTimeout(100)

  await expect(page.locator('text="text 1"')).toHaveCount(0)
})

test('undo/redo of a block should be allowed on nested context', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustType('text 1')
  await page.waitForTimeout(500) // Wait for 500ms autosave period to expire

  await newInnerBlock(page)
  await page.waitForTimeout(500)

  await page.type('textarea >> nth=0', 'text 2')

  await page.keyboard.press("Tab")

  await page.keyboard.press('Escape', { delay: 50 })

  await page.locator('span.bullet-container >> nth=1').click()
  await page.waitForTimeout(200)

  await page.type('textarea >> nth=0', 'text 3')

  await page.locator('.navigation.nav-left').click()

  await page.keyboard.press(modKey + '+z')
  await page.waitForTimeout(100)

  await expect(page.locator('text="text 3"')).toHaveCount(0)
})

test('undo/redo of a renamed page should be preserved', async ({ page, block }) => {
  const page1 = await createRandomPage(page)

  await block.mustType('text 1')
  await page.waitForTimeout(500) // Wait for 500ms autosave period to expire

  await renamePage(page, randomString(10))

  await page.keyboard.press(modKey + '+z')
  await page.waitForTimeout(100)

  await expect(page.locator('text="text 1"')).toHaveCount(0)
})
