import { expect } from '@playwright/test'
import { test } from './fixtures'
import { IsMac, createRandomPage, newBlock, newInnerBlock, lastBlock, lastInnerBlock } from './utils'


test('page alias', async ({ page }) => {
  let hotkeyOpenLink = 'Control+o'
  let hotkeyBack = 'Control+['
  if (IsMac) {
    hotkeyOpenLink = 'Meta+o'
    hotkeyBack = 'Meta+['
  }

  // shortcut opening test
  await createRandomPage(page)

  await page.fill(':nth-match(textarea, 1)', '[[page alias test target page]]')
  await page.keyboard.press(hotkeyOpenLink)

  // build target Page with alias
  await page.type(':nth-match(textarea, 1)', 'alias:: [[page alias test alias page]]')
  await page.press(':nth-match(textarea, 1)', 'Enter') // double Enter for exit property editing
  await page.press(':nth-match(textarea, 1)', 'Enter')
  await page.type(':nth-match(textarea, 1)', 'page alias test content')
  await page.keyboard.press(hotkeyBack)

  // create alias ref in origin Page
  await newBlock(page)
  await page.type(':nth-match(textarea, 1)', '[[page alias test alias page]]')
  await page.keyboard.press(hotkeyOpenLink)

  // shortcut opening test
  await lastInnerBlock(page)
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('page alias test content')
  await newInnerBlock(page)
  await page.type(':nth-match(textarea, 1)', 'yet another page alias test content')
  await page.keyboard.press(hotkeyBack)

  // pressing enter opening test
  await lastInnerBlock(page)
  await page.press(':nth-match(textarea, 1)', 'ArrowLeft')
  await page.press(':nth-match(textarea, 1)', 'ArrowLeft')
  await page.press(':nth-match(textarea, 1)', 'ArrowLeft')
  await page.press(':nth-match(textarea, 1)', 'Enter')
  await lastInnerBlock(page)
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('yet another page alias test content')
  await newInnerBlock(page)
  await page.type(':nth-match(textarea, 1)', 'still another page alias test content')
  await page.keyboard.press(hotkeyBack)

  // clicking opening test
  await page.click('.page-blocks-inner .ls-block .page-ref >> nth=-1')
  await lastInnerBlock(page)
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('still another page alias test content')

  // TODO: test alias from graph clicking
  // TODO: test alias from search clicking
})