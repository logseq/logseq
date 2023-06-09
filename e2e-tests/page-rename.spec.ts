import { expect, Page } from '@playwright/test'
import { test } from './fixtures'
import { closeSearchBox, createPage, randomLowerString, randomString, renamePage, searchPage } from './utils'

/***
 * Test rename feature
 ***/

async function page_rename_test(page: Page, original_page_name: string, new_page_name: string) {
  const rand = randomString(10)
  let original_name = original_page_name + rand
  let new_name = new_page_name + rand

  await createPage(page, original_name)

  // Rename page in UI
  await renamePage(page, new_name)
  await page.click('.ui__confirm-modal button')

  expect(await page.innerText('.page-title .title')).toBe(new_name)

  // TODO: Test if page is renamed in re-entrance

  // TODO: Test if page is hierarchy
}

async function homepage_rename_test(page: Page, original_page_name: string, new_page_name: string) {

  const rand = randomString(10)
  let original_name = original_page_name + rand
  let new_name = new_page_name + rand

  await createPage(page, original_name)

  // Toggle settings
  await page.click('#main-content-container')
  await page.keyboard.press('t')
  await page.keyboard.press('s')

  await page.click('a[data-id="features"]')
  await page.click('#settings div:nth-child(1) a')

  await page.type('input', original_name)
  await page.click('[aria-label="Close"]')

  expect(await page.locator('.home-nav span.flex-1').innerText()).toBe(original_name);

  await renamePage(page, new_name)
  await page.click('.ui__confirm-modal button')

  expect(await page.locator('.home-nav span.flex-1').innerText()).toBe(new_name);

  // Reenable journal
  await page.click('#main-content-container')
  await page.keyboard.press('t')
  await page.keyboard.press('s')
  await page.click('a[data-id="features"]')
  await page.click('#settings div:nth-child(1) a')
  await page.click('[aria-label="Close"]')

}

test('page rename test', async ({ page }) => {
  // TODO: Fix commented out test. Started failing after https://github.com/logseq/logseq/pull/6945
  // await homepage_rename_test(page, "abcd", "a/b/c/d")
  await page_rename_test(page, "abcd", "a.b.c.d")
  await page_rename_test(page, "abcd", "a/b/c/d")

  // The page name in page search are not updated after changing the capitalization of the page name #9577
  // https://github.com/logseq/logseq/issues/9577
  // Expect the page name to be updated in the search results
  await page_rename_test(page, "DcBA_", "dCBA_")
  const results = await searchPage(page, "DcBA_")
  // search result 0 is the new page & 1 is the new whiteboard
  const thirdResultRow = await results[2].innerText()
  expect(thirdResultRow).toContain("dCBA_");
  expect(thirdResultRow).not.toContain("DcBA_");
  await closeSearchBox(page)
})

// TODO introduce more samples when #4722 is fixed
test('page title property test', async ({ page }) => {
  // Edit Title Property and Double Enter (ETPDE)
  // exit editing via insert new block
  let rand = randomLowerString(10)
  let original_name = "etpde old" + rand
  let new_name = "etpde new" + rand
  await createPage(page, original_name)
  // add some spaces to test if it is trimmed
  await page.type(':nth-match(textarea, 1)', 'title:: ' + new_name + "     ")
  await page.press(':nth-match(textarea, 1)', 'Enter') // DWIM property mode creates new line
  await page.press(':nth-match(textarea, 1)', 'Enter')
  expect(await page.innerText('.page-title .title')).toBe(new_name)

  // Edit Title Property and Esc (ETPE)
  // exit editing via moving out focus
  rand = randomLowerString(10)
  original_name = "etpe old " + rand
  new_name = "etpe new " + rand
  await createPage(page, original_name)
  await page.type(':nth-match(textarea, 1)', 'title:: ' + new_name)
  await page.press(':nth-match(textarea, 1)', 'Escape')
  expect(await page.innerText('.page-title .title')).toBe(new_name)
})
