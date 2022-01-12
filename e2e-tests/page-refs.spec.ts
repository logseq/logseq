import { expect } from '@playwright/test'
import { test } from './fixtures'
import { IsMac, createRandomPage, newBlock, newInnerBlock, randomString, lastInnerBlock } from './utils'

/*** 
 * Test alias features
 * Test search refering features
 * Consider diacritics
 ***/

async function alias_test (page, page_name: string){
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

  await page.fill(':nth-match(textarea, 1)', '[[' + target_name + ']]')
  await page.keyboard.press(hotkeyOpenLink)

  // build target Page with alias
  await page.type(':nth-match(textarea, 1)', 'alias:: [[' + alias_name + ']]')
  await page.press(':nth-match(textarea, 1)', 'Enter') // double Enter for exit property editing
  await page.press(':nth-match(textarea, 1)', 'Enter')
  await page.type(':nth-match(textarea, 1)', alias_test_content_1)
  await page.keyboard.press(hotkeyBack)

  // create alias ref in origin Page
  await newBlock(page)
  await page.type(':nth-match(textarea, 1)', '[[' + alias_name + ']]')
  await page.keyboard.press(hotkeyOpenLink)

  // shortcut opening test
  await lastInnerBlock(page)
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe(alias_test_content_1)
  await newInnerBlock(page)
  await page.type(':nth-match(textarea, 1)', alias_test_content_2)
  await page.keyboard.press(hotkeyBack)

  // pressing enter opening test
  await lastInnerBlock(page)
  await page.press(':nth-match(textarea, 1)', 'ArrowLeft')
  await page.press(':nth-match(textarea, 1)', 'ArrowLeft')
  await page.press(':nth-match(textarea, 1)', 'ArrowLeft')
  await page.press(':nth-match(textarea, 1)', 'Enter')
  await lastInnerBlock(page)
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe(alias_test_content_2)
  await newInnerBlock(page)
  await page.type(':nth-match(textarea, 1)', alias_test_content_3)
  await page.keyboard.press(hotkeyBack)

  // clicking opening test
  await page.waitForSelector('.page-blocks-inner .ls-block .page-ref >> nth=-1')
  await page.click('.page-blocks-inner .ls-block .page-ref >> nth=-1')
  await lastInnerBlock(page)
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe(alias_test_content_3)

  // TODO: test alias from graph clicking

  // test alias from search
  await page.click('#search-button')
  await page.waitForSelector('[placeholder="Search or create page"]')
  await page.fill('[placeholder="Search or create page"]', alias_name)
  await page.waitForTimeout(500)

  const results = await page.$$('#ui__ac-inner .block')
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
  await lastInnerBlock(page)
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe(alias_test_content_3)

  // test search clicking (block)
  await page.click('#search-button')
  await page.waitForSelector('[placeholder="Search or create page"]')
  await page.fill('[placeholder="Search or create page"]', alias_name)
  await page.waitForTimeout(500)
  page.click(":nth-match(.menu-link, 2)")
  await page.waitForNavigation()
  await lastInnerBlock(page)
  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe("[[" + alias_name + "]]")
  await page.keyboard.press(hotkeyBack)

  // TODO: search clicking (alias property)
}

// test('page alias', async ({ page }) => {
//   await alias_test(page, "p")
// })


test('page diacritic alias', async ({ page }) => {
  await alias_test(page, "ü")
})