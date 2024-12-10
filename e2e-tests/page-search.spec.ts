import { expect, Page } from '@playwright/test'
import { test } from './fixtures'
import { Block } from './types'
import { modKey, createRandomPage, newInnerBlock, randomString, lastBlock, enterNextBlock } from './utils'
import { searchPage, closeSearchBox } from './util/search-modal'

/***
 * Test alias features
 * Test search referring features
 * Consider diacritics
 ***/

let hotkeyOpenLink = modKey + '+o'
let hotkeyBack = modKey + '+['

test('Search page and blocks (diacritics)', async ({ page, block }) => {
  const rand = randomString(20)

  // diacritic opening test
  await createRandomPage(page)

  await block.mustType('[[Einführung in die Allgemeine Sprachwissenschaft' + rand + ']] diacritic-block-1', { delay: 10 })
  await page.waitForTimeout(500)
  await page.keyboard.press(hotkeyOpenLink, { delay: 10 })
  await page.waitForTimeout(500)

  const pageTitle = page.locator('.page-title').first()
  expect(await pageTitle.innerText()).toEqual('Einführung in die Allgemeine Sprachwissenschaft' + rand)

  await page.waitForTimeout(500)

  // build target Page with diacritics
  await block.activeEditing(0)
  await block.mustType('Diacritic title test content', { delay: 10 })

  await block.enterNext()
  await block.mustType('[[Einführung in die Allgemeine Sprachwissenschaft' + rand + ']] diacritic-block-2', { delay: 10 })
  await page.keyboard.press(hotkeyBack)

  // check if diacritics are indexed
  const results = await searchPage(page, 'Einführung in die Allgemeine Sprachwissenschaft' + rand)
  await expect(results.length).toEqual(6) // 1 page + 2 block + 2 page content + 1 current page
  await closeSearchBox(page)
})

test('Search CJK', async ({ page, block }) => {
  const rand = randomString(20)

  // diacritic opening test
  await createRandomPage(page)

  await block.mustType('[[今日daytime进度条' + rand + ']] diacritic-block-1', { delay: 10 })
  await page.waitForTimeout(500)
  await page.keyboard.press(hotkeyOpenLink, { delay: 10 })
  await page.waitForTimeout(500)

  const pageTitle = page.locator('.page-title').first()
  expect(await pageTitle.innerText()).toEqual('今日daytime进度条' + rand)

  await page.waitForTimeout(500)

  // check if CJK are indexed
  const results = await searchPage(page, '进度')
  await expect(results.length).toEqual(5) // 1 page + 1 block + 1 page content + new whiteboard
  await closeSearchBox(page)
})

async function alias_test(block: Block, page: Page, page_name: string, search_kws: string[]) {
  await createRandomPage(page)

  const rand = randomString(10)
  let target_name = page_name + ' target ' + rand
  let alias_name = page_name + ' alias ' + rand
  let alias_test_content_1 = randomString(20)
  let alias_test_content_2 = randomString(20)
  let alias_test_content_3 = randomString(20)

  await page.type('textarea >> nth=0', '[[' + target_name)
  await page.keyboard.press(hotkeyOpenLink)

  await lastBlock(page)

  // build target Page with alias
  // the target page will contains the content in
  //   alias_test_content_1,
  //   alias_test_content_2, and
  //   alias_test_content_3 sequentially, to validate the target page state
  await page.type('textarea >> nth=0', 'alias:: [[' + alias_name, { delay: 10 })
  await page.keyboard.press('Enter', { delay: 200 }) // Enter for finishing selection
  await page.keyboard.press('Enter', { delay: 200 }) // double Enter for exit property editing
  await page.keyboard.press('Enter', { delay: 200 }) // double Enter for exit property editing
  await page.waitForTimeout(200)
  await block.activeEditing(1)
  await page.type('textarea >> nth=0', alias_test_content_1)
  await lastBlock(page)
  page.keyboard.press(hotkeyBack)

  await page.waitForNavigation()
  await block.escapeEditing()
  // create alias ref in origin Page
  await block.activeEditing(0)
  await block.enterNext()
  await page.type('textarea >> nth=0', '[[' + alias_name, { delay: 20 })
  await page.keyboard.press('Enter') // Enter for finishing selection
  await page.waitForTimeout(100)

  page.keyboard.press(hotkeyOpenLink)
  await page.waitForNavigation()
  await block.escapeEditing()

  // shortcut opening test
  await block.activeEditing(1)
  expect(await page.inputValue('textarea >> nth=0')).toBe(alias_test_content_1)

  await enterNextBlock(page)
  await page.type('textarea >> nth=0', alias_test_content_2)
  page.keyboard.press(hotkeyBack)

  await page.waitForNavigation()
  await block.escapeEditing()
  // pressing enter on alias opening test
  await block.activeEditing(1)
  await page.press('textarea >> nth=0', 'ArrowLeft')
  await page.press('textarea >> nth=0', 'ArrowLeft')
  await page.press('textarea >> nth=0', 'ArrowLeft')
  page.press('textarea >> nth=0', 'Enter')
  await page.waitForNavigation()
  await block.escapeEditing()
  await block.activeEditing(2)
  expect(await page.inputValue('textarea >> nth=0')).toBe(alias_test_content_2)
  await newInnerBlock(page)
  await page.type('textarea >> nth=0', alias_test_content_3)
  page.keyboard.press(hotkeyBack)

  await page.waitForNavigation()
  await block.escapeEditing()
  // clicking alias ref opening test
  await block.activeEditing(1)
  await block.enterNext()
  await page.waitForSelector('.page-blocks-inner .ls-block .page-ref >> nth=-1')
  await page.click('.page-blocks-inner .ls-block .page-ref >> nth=-1')
  await lastBlock(page)
  expect(await page.inputValue('textarea >> nth=0')).toBe(alias_test_content_3)

  // TODO: test alias from graph clicking

  // test alias from search
  for (let kw of search_kws) {
    let kw_name = kw + ' alias ' + rand

    const results = await searchPage(page, kw_name)

    // test search results
    expect(await results[0].innerText()).toContain(alias_name.normalize('NFKC'))

    // test search entering (page)
    page.keyboard.press("Enter")
    await page.waitForNavigation()
    await page.waitForSelector('.ls-block span.inline')

    // test search clicking (block)
    await searchPage(page, kw_name)
  }
}

test('page diacritic alias', async ({ block, page }) => {
  await alias_test(block, page, "ü", ["ü", "ü", "Ü"])
})
