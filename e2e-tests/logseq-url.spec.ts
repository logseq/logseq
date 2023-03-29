import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, lastBlock, IsMac, IsLinux } from './utils'

test("Logseq URLs (same graph)", async ({ page, block }) => {
  let paste_key = IsMac ? 'Meta+v' : 'Control+v'
  // create a page with identify block
  let identify_text = "URL redirect target"
  let page_title = await createRandomPage(page)
  await block.mustFill(identify_text)

  // paste current page's URL to another page, then redirect through the URL
  await page.click('.ui__dropdown-trigger .toolbar-dots-btn')
  await page.locator("text=Copy page URL").click()
  await createRandomPage(page)
  await block.mustFill("") // to enter editing mode
  await page.keyboard.press(paste_key)
  // paste returns a promise which is async, so we need give it a little bit
  // more time
  await page.waitForTimeout(100)
  let cursor_locator = page.locator('textarea >> nth=0')
  expect(await cursor_locator.inputValue()).toContain("page=" + page_title)
  await cursor_locator.press("Enter")
  if (IsMac) { // FIXME: support Logseq URL on Linux (XDG)
    page.locator('a.external-link >> nth=0').click()
    await page.waitForNavigation()
    await page.waitForTimeout(500)
    cursor_locator = await lastBlock(page)
    expect(await cursor_locator.inputValue()).toBe(identify_text)
  }

  // paste the identify block's URL to another page, then redirect through the URL
  await page.click('span.bullet >> nth=0', { button: "right" })
  await page.locator("text=Copy block URL").click()
  await createRandomPage(page)
  await block.mustFill("") // to enter editing mode
  await page.keyboard.press(paste_key)
  await page.waitForTimeout(100)
  cursor_locator = page.locator('textarea >> nth=0')
  expect(await cursor_locator.inputValue()).toContain("block-id=")
  await cursor_locator.press("Enter")
  if (IsMac) { // FIXME: support Logseq URL on Linux (XDG)
    page.locator('a.external-link >> nth=0').click()
    await page.waitForNavigation()
    await page.waitForTimeout(500)
    cursor_locator = await lastBlock(page)
    expect(await cursor_locator.inputValue()).toBe(identify_text)
  }
})
