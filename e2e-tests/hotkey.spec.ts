import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, newBlock, lastBlock, IsMac, IsLinux } from './utils'

test('open search dialog', async ({ page }) => {
  if (IsMac) {
    await page.keyboard.press('Meta+k')
  } else if (IsLinux) {
    await page.keyboard.press('Control+k')
  } else {
    // TODO: test on Windows and other platforms
    expect(false)
  }

  await page.waitForSelector('[placeholder="Type a note or search your graph"]')
  await page.keyboard.press('Escape')
  await page.waitForSelector('[placeholder="Type a note or search your graph"]', { state: 'hidden' })
})

// See-also: https://github.com/logseq/logseq/issues/3278
test('insert link', async ({ page }) => {
  await createRandomPage(page)

  let hotKey = 'Control+l'
  let selectAll = 'Control+a'
  if (IsMac) {
    hotKey = 'Meta+l'
    selectAll = 'Meta+a'
  }

  // Case 1: empty link
  await lastBlock(page)
  await page.press(':nth-match(textarea, 1)', hotKey)
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('[]()')
  await page.type(':nth-match(textarea, 1)', 'Logseq Website')
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('[Logseq Website]()')

  // Case 2: link with label
  await newBlock(page)
  await page.type(':nth-match(textarea, 1)', 'Logseq')
  await page.press(':nth-match(textarea, 1)', selectAll)
  await page.press(':nth-match(textarea, 1)', hotKey)
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('[Logseq]()')
  await page.type(':nth-match(textarea, 1)', 'https://logseq.com/')
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('[Logseq](https://logseq.com/)')

  // Case 3: link with URL
  await newBlock(page)
  await page.type(':nth-match(textarea, 1)', 'https://logseq.com/')
  await page.press(':nth-match(textarea, 1)', selectAll)
  await page.press(':nth-match(textarea, 1)', hotKey)
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('[](https://logseq.com/)')
  await page.type(':nth-match(textarea, 1)', 'Logseq')
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('[Logseq](https://logseq.com/)')
})
