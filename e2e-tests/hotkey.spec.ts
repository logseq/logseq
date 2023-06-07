import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, enterNextBlock, lastBlock, modKey, IsLinux, closeSearchBox } from './utils'

test('open search dialog', async ({ page }) => {
  await page.waitForTimeout(200)
  await closeSearchBox(page)
  await page.keyboard.press(modKey + '+k')

  await page.waitForSelector('[placeholder="Search or create page"]')
  await page.keyboard.press('Escape')
  await page.waitForSelector('[placeholder="Search or create page"]', { state: 'hidden' })
})

test('insert link #3278', async ({ page }) => {
  await createRandomPage(page)

  let hotKey = modKey + '+l'
  let selectAll = modKey + '+a'

  // Case 1: empty link
  await lastBlock(page)
  await page.press('textarea >> nth=0', hotKey)
  expect(await page.inputValue('textarea >> nth=0')).toBe('[]()')
  await page.type('textarea >> nth=0', 'Logseq Website')
  expect(await page.inputValue('textarea >> nth=0')).toBe('[Logseq Website]()')
  await page.fill('textarea >> nth=0', '[Logseq Website](https://logseq.com)')

  // Case 2: link with label
  await enterNextBlock(page)
  await page.type('textarea >> nth=0', 'Logseq')
  await page.press('textarea >> nth=0', selectAll)
  await page.press('textarea >> nth=0', hotKey)
  expect(await page.inputValue('textarea >> nth=0')).toBe('[Logseq]()')
  await page.type('textarea >> nth=0', 'https://logseq.com/')
  expect(await page.inputValue('textarea >> nth=0')).toBe('[Logseq](https://logseq.com/)')

  // Case 3: link with URL
  await enterNextBlock(page)
  await page.type('textarea >> nth=0', 'https://logseq.com/')
  await page.press('textarea >> nth=0', selectAll)
  await page.press('textarea >> nth=0', hotKey)
  expect(await page.inputValue('textarea >> nth=0')).toBe('[](https://logseq.com/)')
  await page.type('textarea >> nth=0', 'Logseq')
  expect(await page.inputValue('textarea >> nth=0')).toBe('[Logseq](https://logseq.com/)')
})
