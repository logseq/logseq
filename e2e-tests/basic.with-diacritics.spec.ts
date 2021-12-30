import { expect } from '@playwright/test'
import { test } from './fixtures'
import { IsMac, createRandomPage, newBlock, randomString, lastInnerBlock, activateNewPage} from './utils'


test('create page and blocks (diacritics)', async ({ page }) => {
  let hotkeyOpenLink = 'Control+o'
  let hotkeyBack = 'Control+['
  if (IsMac) {
    hotkeyOpenLink = 'Meta+o'
    hotkeyBack = 'Meta+['
  }

  // diacritic opening test
  await createRandomPage(page)
  const rand = randomString(20)

  await page.fill(':nth-match(textarea, 1)', '[[Einführung in die Allgemeine Sprachwissenschaft' + rand + ']] diacritic-block-1')
  await page.keyboard.press(hotkeyOpenLink)

  // build target Page with diacritics
  await activateNewPage(page)
  await page.type(':nth-match(textarea, 1)', 'Diacritic title test content')
  await page.keyboard.press(hotkeyBack)

  // visit target Page with diacritics (looks same but not same in Unicode)
  await newBlock(page)
  await page.type(':nth-match(textarea, 1)', '[[Einführung in die Allgemeine Sprachwissenschaft' + rand + ']] diacritic-block-2')
  await page.keyboard.press(hotkeyOpenLink)
  await lastInnerBlock(page)
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('Diacritic title test content')
  await page.keyboard.press(hotkeyBack)

  // check if diacritics are indexed
  await page.click('#search-button')
  await page.waitForSelector('[placeholder="Search or create page"]')
  await page.fill('[placeholder="Search or create page"]', 'Einführung in die Allgemeine Sprachwissenschaft' + rand)

  await page.waitForTimeout(500)
  const results = await page.$$('#ui__ac-inner .block')
  expect(results.length).toEqual(3) // 2 blocks + 1 page
  await page.keyboard.press("Escape")
})