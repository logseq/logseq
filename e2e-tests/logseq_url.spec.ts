import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, lastBlock, captureConsoleWithPrefix, IsMac, IsLinux, getIsWebAPIClipboardSupported } from './utils'

test(
  "Logseq URLs (same graph)",
  async ({ page, block }) => {
    let paste_key = IsMac ? 'Meta+v' : 'Control+v'
    let IsWebAPIClipboardSupported = await getIsWebAPIClipboardSupported(page)
    // create a page with identify block
    let identify_text = "URL redirect target"
    let page_title = await createRandomPage(page)
    await block.mustFill(identify_text)

    // paste current page's URL to another page, then redirect throught the URL
    await page.click('.ui__dropdown-trigger')
    if (!IsWebAPIClipboardSupported){
        let promise_capture = captureConsoleWithPrefix(page, "Copy without `clipboard-write` permission:")
        await page.locator("text=Copy page URL").click()
        let copied_text = await promise_capture
        await createRandomPage(page)
        await block.mustFill(copied_text)
    } else {
        await page.locator("text=Copy page URL").click()
        await createRandomPage(page)
        await block.mustFill("") // to enter editing mode
        await page.keyboard.press(paste_key)
    }
    let cursor_locator = page.locator('textarea >> nth=0')
    expect(await cursor_locator.inputValue()).toContain("page=" + page_title)
    await cursor_locator.press("Enter")
    if (!IsLinux) { // FIXME: support Logseq URL on Linux (XDG)
        page.locator('a.external-link >> nth=0').click()
        await page.waitForNavigation()
        await page.waitForTimeout(500)
        cursor_locator = await lastBlock(page)
        expect(await cursor_locator.inputValue()).toBe(identify_text)
    }

    // paste the identify block's URL to another page, then redirect throught the URL
    await page.click('span.bullet >> nth=0', { button: "right" })
    if (!IsWebAPIClipboardSupported){
        let promise_capture = captureConsoleWithPrefix(page, "Copy without `clipboard-write` permission:")
        await page.locator("text=Copy block URL").click()
        let copied_text = await promise_capture
        await createRandomPage(page)
        await block.mustFill(copied_text)
    } else {
        await page.locator("text=Copy block URL").click()
        await createRandomPage(page)
        await block.mustFill("") // to enter editing mode
        await page.keyboard.press(paste_key)
    }
    cursor_locator = page.locator('textarea >> nth=0')
    expect(await cursor_locator.inputValue()).toContain("block-id=")
    await cursor_locator.press("Enter")
    if (!IsLinux) { // FIXME: support Logseq URL on Linux (XDG)
        page.locator('a.external-link >> nth=0').click()
        await page.waitForNavigation()
        await page.waitForTimeout(500)
        cursor_locator = await lastBlock(page)
        expect(await cursor_locator.inputValue()).toBe(identify_text)
    }
})