import { expect, Page } from '@playwright/test'
import { test } from './fixtures'
import { IsMac, createRandomPage, newBlock, newInnerBlock, randomString, lastBlock, enterNextBlock } from './utils'

/***
 * Test alias features
 * Test search refering features
 * Consider diacritics
 ***/

 test('Search page and blocks (diacritics)', async ({ page }) => {
  let hotkeyOpenLink = 'Control+o'
  let hotkeyBack = 'Control+['
  if (IsMac) {
    hotkeyOpenLink = 'Meta+o'
    hotkeyBack = 'Meta+['
  }

  const rand = randomString(20)

  // diacritic opening test
  await createRandomPage(page)

  await page.fill('textarea >> nth=0', '[[Einführung in die Allgemeine Sprachwissenschaft' + rand + ']] diacritic-block-1')
  await page.keyboard.press(hotkeyOpenLink)

  // build target Page with diacritics
  await lastBlock(page)
  await page.type('textarea >> nth=0', 'Diacritic title test content')

  await page.keyboard.press('Enter')
  await page.fill('textarea >> nth=0', '[[Einführung in die Allgemeine Sprachwissenschaft' + rand + ']] diacritic-block-2')
  await page.keyboard.press(hotkeyBack)

  // check if diacritics are indexed
  await page.click('#search-button')
  await page.waitForSelector('[placeholder="Search or create page"]')
  await page.fill('[placeholder="Search or create page"]', 'Einführung in die Allgemeine Sprachwissenschaft' + rand)

  await page.waitForTimeout(500)
  const results = await page.$$('#ui__ac-inner>div')
  expect(results.length).toEqual(3) // 2 blocks + 1 page
  await page.keyboard.press("Escape")
})

async function alias_test(page: Page, page_name: string, search_kws: string[]) {
  let hotkeyOpenLink = 'Control+o'
  let hotkeyBack = 'Control+['
  if (IsMac) {
    hotkeyOpenLink = 'Meta+o'
    hotkeyBack = 'Meta+['
  }

  const rand = randomString(10)
  let target_name = page_name + ' target ' + rand
  let alias_name = page_name + ' alias ' + rand
  let alias_test_content_1 = randomString(20)
  let alias_test_content_2 = randomString(20)
  let alias_test_content_3 = randomString(20)

  // shortcut opening test
  let parent_title = await createRandomPage(page)

  await page.fill('textarea >> nth=0', '[[' + target_name + ']]')
  await page.keyboard.press(hotkeyOpenLink)

  await lastBlock(page)
  await page.waitForTimeout(500)

  // build target Page with alias
  // the target page will contains the content in
  //   alias_test_content_1,
  //   alias_test_content_2, and
  //   alias_test_content_3 sequentialy, to validate the target page state
  await page.type('textarea >> nth=0', 'alias:: [[' + alias_name)
  await page.press('textarea >> nth=0', 'Enter') // Enter for finishing selection
  await page.press('textarea >> nth=0', 'Enter') // double Enter for exit property editing
  await page.press('textarea >> nth=0', 'Enter') // double Enter for exit property editing
  await page.waitForTimeout(500)
  await page.type('textarea >> nth=0', alias_test_content_1)
  await page.keyboard.press(hotkeyBack)

  await page.waitForTimeout(100) // await navigation
  // create alias ref in origin Page
  await newBlock(page)
  await page.type('textarea >> nth=0', '[[' + alias_name)
  await page.press('textarea >> nth=0', 'Enter') // Enter for finishing selection
  await page.waitForTimeout(100)

  await page.keyboard.press(hotkeyOpenLink)
  await page.waitForTimeout(100) // await navigation

  // shortcut opening test
  await lastBlock(page)
  expect(await page.inputValue('textarea >> nth=0')).toBe(alias_test_content_1)

  await enterNextBlock(page)
  await page.type('textarea >> nth=0', alias_test_content_2)
  await page.keyboard.press(hotkeyBack)

  // pressing enter opening test
  await lastBlock(page)
  await page.press('textarea >> nth=0', 'ArrowLeft')
  await page.press('textarea >> nth=0', 'ArrowLeft')
  await page.press('textarea >> nth=0', 'ArrowLeft')
  await page.press('textarea >> nth=0', 'Enter')
  await lastBlock(page)
  expect(await page.inputValue('textarea >> nth=0')).toBe(alias_test_content_2)
  await newInnerBlock(page)
  await page.type('textarea >> nth=0', alias_test_content_3)
  await page.keyboard.press(hotkeyBack)

  // clicking opening test
  await page.waitForSelector('.page-blocks-inner .ls-block .page-ref >> nth=-1')
  await page.click('.page-blocks-inner .ls-block .page-ref >> nth=-1')
  await lastBlock(page)
  expect(await page.inputValue('textarea >> nth=0')).toBe(alias_test_content_3)

  // TODO: test alias from graph clicking

  // test alias from search
  for (let kw of search_kws) {
    let kw_name = kw + ' alias ' + rand

    await page.click('#search-button')
    await page.waitForSelector('[placeholder="Search or create page"]')
    await page.fill('[placeholder="Search or create page"]', kw_name)
    await page.waitForTimeout(500)

    const results = await page.$$('#ui__ac-inner>div')
    expect(results.length).toEqual(3) // page + block + alias property

    // test search results
    expect(await results[0].innerText()).toContain("Alias -> " + target_name)
    expect(await results[0].innerText()).toContain(alias_name)
    expect(await results[1].innerText()).toContain(parent_title)
    expect(await results[1].innerText()).toContain("[[" + alias_name + "]]")
    expect(await results[2].innerText()).toContain(target_name)
    expect(await results[2].innerText()).toContain("alias:: [[" + alias_name + "]]")

    // test search entering (page)
    page.keyboard.press("Enter")
    await page.waitForNavigation()
    await page.waitForTimeout(100)
    await lastBlock(page)
    expect(await page.inputValue('textarea >> nth=0')).toBe(alias_test_content_3)

    // test search clicking (block)
    await page.click('#search-button')
    await page.waitForSelector('[placeholder="Search or create page"]')
    await page.fill('[placeholder="Search or create page"]', kw_name)
    await page.waitForTimeout(500)
    page.click(":nth-match(.menu-link, 2)")
    await page.waitForNavigation()
    await page.waitForTimeout(500)
    await lastBlock(page)
    expect(await page.inputValue('textarea >> nth=0')).toBe("[[" + alias_name + "]]")
    await page.keyboard.press(hotkeyBack)
  }

  // TODO: search clicking (alias property)
}

test.skip('page diacritic alias', async ({ page }) => {
  await alias_test(page, "ü", ["ü", "ü", "Ü"])
})
