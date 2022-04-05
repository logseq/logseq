import { expect } from '@playwright/test'
import { test } from './fixtures'
import { IsMac, createPage, newBlock, newInnerBlock, randomString, lastBlock } from './utils'

/***
 * Test rename feature
 ***/

async function page_rename_test(page, original_page_name: string, new_page_name: string) {
  let selectAll = 'Control+a'
  if (IsMac) {
    selectAll = 'Meta+a'
  }

  const rand = randomString(10)
  let original_name = original_page_name + rand
  let new_name = new_page_name + rand

  await createPage(page, original_name)
  await page.click('.page-title .title')
  await page.waitForSelector('input[type="text"]')
  await page.keyboard.press(selectAll)
  await page.keyboard.press('Backspace')
  await page.type('.title input', new_name)
  await page.keyboard.press('Enter')
  await page.click('.ui__confirm-modal button')

  expect(await page.innerText('.page-title .title')).toBe(new_name)

  // TODO: Test if page is renamed in re-entrance

  // TODO: Test if page is hierarchy
}

test('page rename test', async ({ page }) => {
  await page_rename_test(page, "abcd", "a.b.c.d")
  await page_rename_test(page, "abcd", "a/b/c/d")
})
