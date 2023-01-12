import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, newBlock, lastBlock, IsMac, IsLinux } from './utils'

test('open search dialog', async ({ page }) => {
  if (IsMac) {
    await page.keyboard.press('Meta+k')
  } else {
    await page.keyboard.press('Control+k')
  }

  await page.waitForSelector('[placeholder="Search or create page"]')
  await page.keyboard.press('Escape')
  await page.waitForSelector('[placeholder="Search or create page"]', { state: 'hidden' })
})

test('insert link #3278', async ({ page }) => {
  await createRandomPage(page)

  let hotKey = 'Control+l'
  let selectAll = 'Control+a'
  if (IsMac) {
    hotKey = 'Meta+l'
    selectAll = 'Meta+a'
  }

  // Case 1: empty link
  await lastBlock(page)
  await page.press('textarea >> nth=0', hotKey)
  expect(await page.inputValue('textarea >> nth=0')).toBe('[]()')
  await page.type('textarea >> nth=0', 'Logseq Website')
  expect(await page.inputValue('textarea >> nth=0')).toBe('[Logseq Website]()')
  await page.fill('textarea >> nth=0', '[Logseq Website](https://logseq.com)')

  // Case 2: link with label
  await newBlock(page)
  await page.type('textarea >> nth=0', 'Logseq')
  await page.press('textarea >> nth=0', selectAll)
  await page.press('textarea >> nth=0', hotKey)
  expect(await page.inputValue('textarea >> nth=0')).toBe('[Logseq]()')
  await page.type('textarea >> nth=0', 'https://logseq.com/')
  expect(await page.inputValue('textarea >> nth=0')).toBe('[Logseq](https://logseq.com/)')

  // Case 3: link with URL
  await newBlock(page)
  await page.type('textarea >> nth=0', 'https://logseq.com/')
  await page.press('textarea >> nth=0', selectAll)
  await page.press('textarea >> nth=0', hotKey)
  expect(await page.inputValue('textarea >> nth=0')).toBe('[](https://logseq.com/)')
  await page.type('textarea >> nth=0', 'Logseq')
  expect(await page.inputValue('textarea >> nth=0')).toBe('[Logseq](https://logseq.com/)')
})
