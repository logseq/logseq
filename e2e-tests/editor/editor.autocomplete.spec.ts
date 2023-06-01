import { expect } from '@playwright/test'
import { test } from '../fixtures'
import { createRandomPage, enterNextBlock, STD_DELAY } from '../utils'

test('hashtag search page auto-complete', async ({ page, block }) => {
  await createRandomPage(page)

  await page.type('textarea >> nth=0', '#', { delay: STD_DELAY })
  await page.waitForSelector('text="Search for a page"', { state: 'visible' })
  await page.keyboard.press('Escape', { delay: STD_DELAY })

  await block.mustFill('done')

  await enterNextBlock(page)
  await page.type('textarea >> nth=0', 'Some #', { delay: STD_DELAY })
  await page.waitForSelector('text="Search for a page"', { state: 'visible' })
  await page.keyboard.press('Escape', { delay: STD_DELAY })

  await block.mustFill('done')
})

test('hashtag search #[[ page auto-complete', async ({ page, block }) => {
  await createRandomPage(page)

  await block.activeEditing(0)

  await page.type('textarea >> nth=0', '#[[', { delay: STD_DELAY })
  await page.waitForSelector('text="Search for a page"', { state: 'visible' })
  await page.keyboard.press('Escape', { delay: STD_DELAY })
})

test('#6266 moving cursor outside of brackets should close autocomplete menu', async ({
  page,
  block,
  autocompleteMenu,
}) => {
  for (const [commandTrigger, modalName] of [
    ['[[', 'page-search'],
    ['((', 'block-search'],
  ]) {
    // First, left arrow
    await createRandomPage(page)

    await block.mustFill('t ')
    await page.keyboard.type(commandTrigger, { delay: STD_DELAY })

    await autocompleteMenu.expectVisible(modalName)

    await page.keyboard.press('ArrowLeft', { delay: STD_DELAY })
    await autocompleteMenu.expectHidden(modalName)

    // Then, right arrow
    await createRandomPage(page)

    await block.mustFill('t ')
    await page.keyboard.type(commandTrigger, { delay: STD_DELAY })

    await autocompleteMenu.expectVisible(modalName)

    // Move cursor outside of the space strictly between the double brackets
    await page.keyboard.press('ArrowRight', { delay: STD_DELAY })
    await autocompleteMenu.expectHidden(modalName)
  }
})

// Old logic would fail this because it didn't do the check if @search-timeout was set
test('#6266 moving cursor outside of parens immediately after searching should still close autocomplete menu', async ({
  page,
  block,
  autocompleteMenu,
}) => {
  for (const [commandTrigger, modalName] of [['((', 'block-search']]) {
    await createRandomPage(page)

    // Open the autocomplete menu
    await block.mustFill('t ')
    await page.keyboard.type(commandTrigger, { delay: STD_DELAY })

    await page.keyboard.type('some block search text', { delay: STD_DELAY })
    await autocompleteMenu.expectVisible(modalName)

    // Move cursor outside of the space strictly between the double parens
    await page.keyboard.press('ArrowRight', { delay: STD_DELAY })
    await autocompleteMenu.expectHidden(modalName)
  }
})

test('pressing up and down should NOT close autocomplete menu', async ({
  page,
  block,
  autocompleteMenu,
}) => {
  for (const [commandTrigger, modalName] of [
    ['[[', 'page-search'],
    ['((', 'block-search'],
  ]) {
    await createRandomPage(page)

    // Open the autocomplete menu
    await block.mustFill('t ')
    await page.keyboard.type(commandTrigger, { delay: STD_DELAY })

    await autocompleteMenu.expectVisible(modalName)
    const cursorPos = await block.selectionStart()

    await page.keyboard.press('ArrowUp', { delay: STD_DELAY })
    await autocompleteMenu.expectVisible(modalName)
    expect(await block.selectionStart()).toEqual(cursorPos)

    await page.keyboard.press('ArrowDown', { delay: STD_DELAY })
    await autocompleteMenu.expectVisible(modalName)
    expect(await block.selectionStart()).toEqual(cursorPos)
  }
})

test('moving cursor inside of brackets should NOT close autocomplete menu', async ({
  page,
  block,
  autocompleteMenu,
}) => {
  for (const [commandTrigger, modalName] of [
    ['[[', 'page-search'],
    ['((', 'block-search'],
  ]) {
    await createRandomPage(page)

    // Open the autocomplete menu
    await block.mustType('test ')
    await page.keyboard.type(commandTrigger, { delay: STD_DELAY })

    if (commandTrigger === '[[') {
      await autocompleteMenu.expectVisible(modalName)
    }

    await page.keyboard.type('search', { delay: STD_DELAY })
    await autocompleteMenu.expectVisible(modalName)

    // Move cursor, still inside the brackets
    await page.keyboard.press('ArrowLeft', { delay: STD_DELAY })
    await autocompleteMenu.expectVisible(modalName)
  }
})

test('moving cursor inside of brackets when autocomplete menu is closed should NOT open autocomplete menu', async ({
  page,
  block,
  autocompleteMenu,
}) => {
  // Note: (( behaves differently and doesn't auto-trigger when typing in it after exiting the search prompt once
  for (const [commandTrigger, modalName] of [['[[', 'page-search']]) {
    await createRandomPage(page)

    // Open the autocomplete menu
    await block.mustFill('')
    await page.keyboard.type(commandTrigger, { delay: STD_DELAY })

    await autocompleteMenu.expectVisible(modalName)

    await block.escapeEditing()
    await autocompleteMenu.expectHidden(modalName)

    // Move cursor left until it's inside the brackets; shouldn't open autocomplete menu
    await page.locator('.block-content').click()
    await autocompleteMenu.expectHidden(modalName)

    await page.keyboard.press('ArrowLeft', { delay: STD_DELAY })
    await autocompleteMenu.expectHidden(modalName)

    await page.keyboard.press('ArrowLeft', { delay: STD_DELAY })
    await autocompleteMenu.expectHidden(modalName)

    // Type a letter, this should open the autocomplete menu
    await page.keyboard.type('z', { delay: STD_DELAY })
    await autocompleteMenu.expectVisible(modalName)
  }
})

test('selecting text inside of brackets should NOT close autocomplete menu', async ({
  page,
  block,
  autocompleteMenu,
}) => {
  for (const [commandTrigger, modalName] of [
    ['[[', 'page-search'],
    ['((', 'block-search'],
  ]) {
    await createRandomPage(page)

    // Open the autocomplete menu
    await block.mustFill('')
    await page.keyboard.type(commandTrigger, { delay: STD_DELAY })

    await autocompleteMenu.expectVisible(modalName)

    await page.keyboard.type('some page search text', { delay: STD_DELAY })
    await autocompleteMenu.expectVisible(modalName)

    // Select some text within the brackets
    await page.keyboard.press('Shift+ArrowLeft', { delay: STD_DELAY })
    await autocompleteMenu.expectVisible(modalName)
  }
})

test('pressing backspace and remaining inside of brackets should NOT close autocomplete menu', async ({
  page,
  block,
  autocompleteMenu,
}) => {
  for (const [commandTrigger, modalName] of [
    ['[[', 'page-search'],
    ['((', 'block-search'],
  ]) {
    await createRandomPage(page)

    // Open the autocomplete menu
    await block.mustFill('test ')
    await page.keyboard.type(commandTrigger, { delay: STD_DELAY })

    await autocompleteMenu.expectVisible(modalName)

    await page.keyboard.type('some page search text', { delay: STD_DELAY })
    await autocompleteMenu.expectVisible(modalName)

    // Delete one character inside the brackets
    await page.keyboard.press('Backspace', { delay: STD_DELAY })
    await autocompleteMenu.expectVisible(modalName)
  }
})

test('press escape when autocomplete menu is open, should close autocomplete menu only #6270', async ({
  page,
  block,
}) => {
  for (const [commandTrigger, modalName] of [
    ['[[', 'page-search'],
    ['/', 'commands'],
  ]) {
    await createRandomPage(page)

    // Open the action modal
    await block.mustFill('text ')
    await page.keyboard.type(commandTrigger, { delay: STD_DELAY })

    await expect(page.locator(`[data-modal-name="${modalName}"]`)).toBeVisible({
      timeout: STD_DELAY,
    })

    // Press escape; should close action modal instead of exiting edit mode
    await page.keyboard.press('Escape', { delay: STD_DELAY })
    await expect(
      page.locator(`[data-modal-name="${modalName}"]`)
    ).not.toBeVisible({ timeout: STD_DELAY * 5 })
    expect(await block.isEditing()).toBe(true)
  }
})
