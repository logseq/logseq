import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, lastBlock } from './utils'

test(
  "Logseq URLs (same graph)",
  async ({ page, block }) => {
    // create a page with identify block
    let identify_text = "URL redirect target"
    let page_title = await createRandomPage(page)
    await block.mustFill(identify_text)

    // paste current page's URL to another page, then redirect throught the URL
    await page.click('.ui__dropdown-trigger')
    await page.locator("text=Copy page URL").click()
    await createRandomPage(page)
    await block.mustFill("") // to focus the editor
    await page.keyboard.press("Meta+v")
    let cursor_locator = page.locator('textarea >> nth=0')
    expect(await cursor_locator.inputValue()).toContain("page=" + page_title)
    await cursor_locator.press("Enter")
    await page.locator('a.external-link >> nth=0').click()
    await page.waitForNavigation()
    cursor_locator = await lastBlock(page)
    expect(await cursor_locator.inputValue()).toBe(identify_text)

    // paste the identify block's URL to another page, then redirect throught the URL
    await page.click('span.bullet >> nth=0', { button: "right" })
    await page.locator("text=Copy block URL").click()
    await createRandomPage(page)
    await block.mustFill("") // to focus the editor
    await page.keyboard.press("Meta+v")
    cursor_locator = page.locator('textarea >> nth=0')
    expect(await cursor_locator.inputValue()).toContain("block-id=")
    await cursor_locator.press("Enter")
    await page.locator('a.external-link >> nth=0').click()
    await page.waitForNavigation()
    cursor_locator = await lastBlock(page)
    expect(await cursor_locator.inputValue()).toBe(identify_text)
  })