import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, modKey, searchAndJumpToPage, renamePage, randomString } from './utils'

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

test('should navigate to corresponding page on undo', async ({ page, block }) => {
  const page1 = await createRandomPage(page)

  await block.mustType('text 1')
  await page.waitForTimeout(500) // Wait for 500ms autosave period to expire

  const page2 = await createRandomPage(page)

  await page.keyboard.press(modKey + '+z')
  await page.waitForTimeout(100)
  expect(await page.innerText('.page-title .title')).toBe(page1)

  await page.keyboard.press(modKey + '+z')
  await page.waitForTimeout(100)
  await expect(page.locator('text="text 1"')).toHaveCount(0)
})


test('undo/redo of a renamed page should be preserved', async ({ page, block }) => {
  const page1 = await createRandomPage(page)

  await block.mustType('text 1')
  await page.waitForTimeout(500) // Wait for 500ms autosave period to expire

  await renamePage(page, randomString(10))
  await page.click('.ui__confirm-modal button')

  await page.keyboard.press(modKey + '+z')
  await page.waitForTimeout(100)

  await expect(page.locator('text="text 1"')).toHaveCount(0)
})
