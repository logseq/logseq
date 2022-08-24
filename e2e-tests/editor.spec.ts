import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, enterNextBlock, systemModifier, IsMac } from './utils'
import { dispatch_kb_events } from './util/keyboard-events'
import * as kb_events from './util/keyboard-events'

test('hashtag and quare brackets in same line #4178', async ({ page }) => {
  await createRandomPage(page)

  await page.type('textarea >> nth=0', '#foo bar')
  await enterNextBlock(page)
  await page.type('textarea >> nth=0', 'bar [[blah]]', { delay: 100 })

  for (let i = 0; i < 12; i++) {
    await page.press('textarea >> nth=0', 'ArrowLeft')
  }
  await page.type('textarea >> nth=0', ' ')
  await page.press('textarea >> nth=0', 'ArrowLeft')

  await page.type('textarea >> nth=0', '#')
  await page.waitForSelector('text="Search for a page"', { state: 'visible' })

  await page.type('textarea >> nth=0', 'fo')

  await page.click('.absolute >> text=' + 'foo')

  expect(await page.inputValue('textarea >> nth=0')).toBe(
    '#foo bar [[blah]]'
  )
})

test('disappeared children #4814', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustType('parent')
  await block.enterNext()
  expect(await block.indent()).toBe(true)

  for (let i = 0; i < 5; i++) {
    await block.mustType(i.toString())
    await block.enterNext()
  }

  // collapse
  await page.click('.block-control >> nth=0')

  // expand
  await page.click('.block-control >> nth=0')

  await block.waitForBlocks(7) // 1 + 5 + 1 empty

  // Ensures there's no active editor
  await expect(page.locator('.editor-inner')).toHaveCount(0, { timeout: 500 })
})

test('create new page from bracketing text #4971', async ({ page, block }) => {
  let title = 'Page not Exists yet'
  await createRandomPage(page)

  await block.mustType(`[[${title}]]`)

  await page.keyboard.press(systemModifier('Control+o'))

  // Check page title equals to `title`
  await page.waitForTimeout(100)
  expect(await page.locator('h1.title').innerText()).toContain(title)

  // Check there're linked references
  await page.waitForSelector(`.references .ls-block >> nth=1`, { state: 'detached', timeout: 100 })
})

test.skip('backspace and cursor position #4897', async ({ page, block }) => {
  await createRandomPage(page)

  // Delete to previous block, and check cursor postion, with markup
  await block.mustFill('`012345`')
  await block.enterNext()
  await block.mustType('`abcdef', { toBe: '`abcdef`' }) // "`" auto-completes

  expect(await block.selectionStart()).toBe(7)
  expect(await block.selectionEnd()).toBe(7)
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('ArrowLeft')
  }
  expect(await block.selectionStart()).toBe(0)

  await page.keyboard.press('Backspace')
  await block.waitForBlocks(1) // wait for delete and re-render
  expect(await block.selectionStart()).toBe(8)
})

test.skip('next block and cursor position', async ({ page, block }) => {
  await createRandomPage(page)

  // Press Enter and check cursor postion, with markup
  await block.mustType('abcde`12345', { toBe: 'abcde`12345`' }) // "`" auto-completes
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('ArrowLeft')
  }
  expect(await block.selectionStart()).toBe(5) // after letter 'e'

  await block.enterNext()
  expect(await block.selectionStart()).toBe(0) // should at the beginning of the next block

  const locator = page.locator('textarea >> nth=0')
  await expect(locator).toHaveText('`12345`', { timeout: 1000 })
})

test(
  "Press CJK Left Black Lenticular Bracket `【` by 2 times #3251 should trigger [[]], " +
  "but dont trigger RIME #3440 ",
  // cases should trigger [[]] #3251
  async ({ page, block }) => {
    for (let [idx, events] of [
      kb_events.win10_pinyin_left_full_square_bracket,
      kb_events.macos_pinyin_left_full_square_bracket
      // TODO: support #3741
      // kb_events.win10_legacy_pinyin_left_full_square_bracket,
    ].entries()) {
      await createRandomPage(page)
      let check_text = "#3251 test " + idx
      await block.mustFill(check_text + "【")
      await dispatch_kb_events(page, ':nth-match(textarea, 1)', events)
      expect(await page.inputValue(':nth-match(textarea, 1)')).toBe(check_text + '【')
      await block.mustFill(check_text + "【【")
      await dispatch_kb_events(page, ':nth-match(textarea, 1)', events)
      expect(await page.inputValue(':nth-match(textarea, 1)')).toBe(check_text + '[[]]')
    };

    // dont trigger RIME #3440
    for (let [idx, events] of [
      kb_events.macos_pinyin_selecting_candidate_double_left_square_bracket,
      kb_events.win10_RIME_selecting_candidate_double_left_square_bracket
    ].entries()) {
      await createRandomPage(page)
      let check_text = "#3440 test " + idx
      await block.mustFill(check_text)
      await dispatch_kb_events(page, ':nth-match(textarea, 1)', events)
      expect(await page.inputValue(':nth-match(textarea, 1)')).toBe(check_text)
      await dispatch_kb_events(page, ':nth-match(textarea, 1)', events)
      expect(await page.inputValue(':nth-match(textarea, 1)')).toBe(check_text)
    }
  })

test('copy & paste block ref and replace its content', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustFill('Some random text')
  // FIXME: copy instantly will make content disappear
  await page.waitForTimeout(1000)
  if (IsMac) {
    await page.keyboard.press('Meta+c')
  } else {
    await page.keyboard.press('Control+c')
  }

  await page.press('textarea >> nth=0', 'Enter')
  if (IsMac) {
    await page.keyboard.press('Meta+v')
  } else {
    await page.keyboard.press('Control+v')
  }
  await page.keyboard.press('Enter')

  const blockRef = page.locator('.block-ref >> text="Some random text"');

  // Check if the newly created block-ref has the same referenced content
  await expect(blockRef).toHaveCount(1);

  // Move cursor into the block ref
  for (let i = 0; i < 4; i++) {
    await page.press('textarea >> nth=0', 'ArrowLeft')
  }

  // Trigger replace-block-reference-with-content-at-point
  if (IsMac) {
    await page.keyboard.press('Meta+Shift+r')
  } else {
    await page.keyboard.press('Control+Shift+v')
  }
})

test('copy and paste block after editing new block #5962', async ({ page, block }) => {
  await createRandomPage(page)

  // Create a block and copy it in block-select mode
  await block.mustFill('Block being copied')
  await page.waitForTimeout(100)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(100)
  if (IsMac) {
    await page.keyboard.press('Meta+c')
  } else {
    await page.keyboard.press('Control+c')
  }
  // await page.waitForTimeout(100)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(100)
  await page.keyboard.press('Enter')

  await page.waitForTimeout(100)
  // Create a new block with some text
  await page.keyboard.insertText("Typed block")

  // Quickly paste the copied block
  if (IsMac) {
    await page.keyboard.press('Meta+v')
  } else {
    await page.keyboard.press('Control+v')
  }

  await expect(page.locator('text="Typed block"')).toHaveCount(1);
})

test('undo and redo after starting an action should not destroy text #6267', async ({ page, block }) => {
  await createRandomPage(page)

  // Get one piece of undo state onto the stack
  await block.mustType('text1 ')
  await page.waitForTimeout(500) // Wait for 500ms autosave period to expire

  // Then type more, start an action prompt, and undo
  await page.keyboard.type('text2 ', { delay: 50 })
  for (const char of '[[') {
    await page.keyboard.type(char, { delay: 50 })
  }
  await expect(page.locator(`[data-modal-name="page-search"]`)).toBeVisible()
  if (IsMac) {
    await page.keyboard.press('Meta+z')
  } else {
    await page.keyboard.press('Control+z')
  }
  await page.waitForTimeout(100)

  // Should close the action menu when we undo the action prompt
  await expect(page.locator(`[data-modal-name="page-search"]`)).not.toBeVisible()

  // It should undo to the last saved state, and not erase the previous undo action too
  await expect(page.locator('text="text1"')).toHaveCount(1)

  // And it should keep what was undone as a redo action
  if (IsMac) {
    await page.keyboard.press('Meta+Shift+z')
  } else {
    await page.keyboard.press('Control+Shift+z')
  }
  await expect(page.locator('text="text2"')).toHaveCount(1)
})

test('undo after starting an action should close the action menu #6269', async ({ page, block }) => {
  for (const [commandTrigger, modalName] of [['/', 'commands'], ['[[', 'page-search']]) {
    await createRandomPage(page)

    // Open the action modal
    await block.mustType('text1 ')
    await page.waitForTimeout(550)
    for (const char of commandTrigger) {
      await page.keyboard.type(char)
    }
    await expect(page.locator(`[data-modal-name="${modalName}"]`)).toBeVisible()

    // Undo, removing "/today", and closing the action modal
    if (IsMac) {
      await page.keyboard.press('Meta+z')
    } else {
      await page.keyboard.press('Control+z')
    }
    await page.waitForTimeout(100)
    await expect(page.locator('text="/today"')).toHaveCount(0)
    await expect(page.locator(`[data-modal-name="${modalName}"]`)).not.toBeVisible()
  }
})

test('#6266 moving cursor outside of brackets should close autocomplete menu', async ({ page, block, autocompleteMenu }) => {
  for (const [commandTrigger, modalName] of [['[[', 'page-search'], ['((', 'block-search']]) {
    // First, left arrow
    await createRandomPage(page)

    await block.mustFill('')
    for (const char of commandTrigger) {
      await page.keyboard.type(char)
      await page.waitForTimeout(10) // Sometimes it doesn't trigger without this
    }
    await autocompleteMenu.expectVisible(modalName)

    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(100)
    await autocompleteMenu.expectHidden(modalName)

    // Then, right arrow
    await createRandomPage(page)

    await block.mustFill('')
    for (const char of commandTrigger) {
      await page.keyboard.type(char)
      await page.waitForTimeout(10) // Sometimes it doesn't trigger without this
    }
    await page.waitForTimeout(100)
    await autocompleteMenu.expectVisible(modalName)

    await page.waitForTimeout(100)
    // Move cursor outside of the space strictly between the double brackets
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(100)
    await autocompleteMenu.expectHidden(modalName)
  }
})

// Old logic would fail this because it didn't do the check if @search-timeout was set
test('#6266 moving cursor outside of parens immediately after searching should still close autocomplete menu', async ({ page, block, autocompleteMenu }) => {
  for (const [commandTrigger, modalName] of [['((', 'block-search']]) {
    await createRandomPage(page)

    // Open the autocomplete menu
    // TODO: Maybe remove these "text " entries in tests that don't need them
    await block.mustFill('')
    await page.waitForTimeout(550)
    for (const char of commandTrigger) {
      await page.keyboard.type(char)
      await page.waitForTimeout(10) // Sometimes it doesn't trigger without this
    }
    await page.waitForTimeout(100)
    await page.keyboard.type("some block search text")
    await autocompleteMenu.expectVisible(modalName)

    // Move cursor outside of the space strictly between the double parens
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(100)
    await autocompleteMenu.expectHidden(modalName)
  }
})

test('pressing up and down should NOT close autocomplete menu', async ({ page, block, autocompleteMenu }) => {
  for (const [commandTrigger, modalName] of [['[[', 'page-search'], ['((', 'block-search']]) {
    await createRandomPage(page)

    // Open the autocomplete menu
    await block.mustFill('')
    for (const char of commandTrigger) {
      await page.keyboard.type(char)
      await page.waitForTimeout(10) // Sometimes it doesn't trigger without this
    }
    await autocompleteMenu.expectVisible(modalName)
    const cursorPos = await block.selectionStart()

    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(100)
    await autocompleteMenu.expectVisible(modalName)
    await expect(await block.selectionStart()).toEqual(cursorPos)

    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100)
    await autocompleteMenu.expectVisible(modalName)
    await expect(await block.selectionStart()).toEqual(cursorPos)
  }
})

test('moving cursor inside of brackets should NOT close autocomplete menu', async ({ page, block, autocompleteMenu }) => {
  for (const [commandTrigger, modalName] of [['[[', 'page-search'], ['((', 'block-search']]) {
    await createRandomPage(page)

    // Open the autocomplete menu
    await block.mustFill('')
    for (const char of commandTrigger) {
      await page.keyboard.type(char)
      await page.waitForTimeout(10) // Sometimes it doesn't trigger without this
    }
    await page.waitForTimeout(100)
    if (commandTrigger === '[[') {
      await autocompleteMenu.expectVisible(modalName)
    }

    await page.keyboard.type("search")
    await page.waitForTimeout(100)
    await autocompleteMenu.expectVisible(modalName)

    // Move cursor, still inside the brackets
    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(100)
    await autocompleteMenu.expectVisible(modalName)
  }
})

test('moving cursor inside of brackets when autocomplete menu is closed should NOT open autocomplete menu', async ({ page, block, autocompleteMenu }) => {
  // Note: (( behaves differently and doesn't auto-trigger when typing in it after exiting the search prompt once
  for (const [commandTrigger, modalName] of [['[[', 'page-search']]) {
    await createRandomPage(page)

    // Open the autocomplete menu
    await block.mustFill('')
    for (const char of commandTrigger) {
      await page.keyboard.type(char)
      await page.waitForTimeout(10) // Sometimes it doesn't trigger without this
    }
    await autocompleteMenu.expectVisible(modalName)

    await block.escapeEditing()
    await autocompleteMenu.expectHidden(modalName)

    // Move cursor left until it's inside the brackets; shouldn't open autocomplete menu
    await page.locator('.block-content').click()
    await page.waitForTimeout(100)
    await autocompleteMenu.expectHidden(modalName)

    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(100)
    await autocompleteMenu.expectHidden(modalName)

    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(100)
    await autocompleteMenu.expectHidden(modalName)

    // Type a letter, this should open the autocomplete menu
    await page.keyboard.type('z')
    await page.waitForTimeout(100)
    await autocompleteMenu.expectVisible(modalName)
  }
})

test('selecting text inside of brackets should NOT close autocomplete menu', async ({ page, block, autocompleteMenu }) => {
  for (const [commandTrigger, modalName] of [['[[', 'page-search'], ['((', 'block-search']]) {
    await createRandomPage(page)

    // Open the autocomplete menu
    await block.mustFill('')
    for (const char of commandTrigger) {
      await page.keyboard.type(char)
      await page.waitForTimeout(10) // Sometimes it doesn't trigger without this
    }
    await page.waitForTimeout(100)
    await autocompleteMenu.expectVisible(modalName)

    await page.keyboard.type("some page search text")
    await page.waitForTimeout(100)
    await autocompleteMenu.expectVisible(modalName)

    // Select some text within the brackets
    await page.keyboard.press('Shift+ArrowLeft')
    await page.waitForTimeout(100)
    await autocompleteMenu.expectVisible(modalName)
  }
})

test('pressing backspace and remaining inside of brackets should NOT close autocomplete menu', async ({ page, block, autocompleteMenu }) => {
  for (const [commandTrigger, modalName] of [['[[', 'page-search'], ['((', 'block-search']]) {
    await createRandomPage(page)

    // Open the autocomplete menu
    await block.mustFill('')
    for (const char of commandTrigger) {
      await page.keyboard.type(char)
      await page.waitForTimeout(10) // Sometimes it doesn't trigger without this
    }
    await page.waitForTimeout(100)
    await autocompleteMenu.expectVisible(modalName)

    await page.keyboard.type("some page search text")
    await page.waitForTimeout(100)
    await autocompleteMenu.expectVisible(modalName)

    // Delete one character inside the brackets
    await page.keyboard.press('Backspace')
    await page.waitForTimeout(100)
    await autocompleteMenu.expectVisible(modalName)
  }
})
test('press escape when autocomplete menu is open, should close autocomplete menu only #6270', async ({ page, block }) => {
  for (const [commandTrigger, modalName] of [['[[', 'page-search'], ['/', 'commands']]) {
    await createRandomPage(page)

    // Open the action modal
    await block.mustFill('text ')
    await page.waitForTimeout(550)
    for (const char of commandTrigger) {
      await page.keyboard.type(char) // Type it one character at a time, because too quickly can fail to trigger it sometimes
    }
    await page.waitForTimeout(100)
    await expect(page.locator(`[data-modal-name="${modalName}"]`)).toBeVisible()
    await page.waitForTimeout(100)

    // Press escape; should close action modal instead of exiting edit mode
    await page.keyboard.press('Escape')
    await page.waitForTimeout(100)
    await expect(page.locator(`[data-modal-name="${modalName}"]`)).not.toBeVisible()
    await page.waitForTimeout(1000)
    expect(await block.isEditing()).toBe(true)
  }
})

test('press escape when link/image dialog is open, should restore focus to input', async ({ page, block }) => {
  for (const [commandTrigger, modalName] of [['/link', 'commands']]) {
    await createRandomPage(page)

    // Open the action modal
    await block.mustFill('')
    await page.waitForTimeout(550)
    for (const char of commandTrigger) {
      await page.keyboard.type(char) // Type it one character at a time, because too quickly can fail to trigger it sometimes
    }
    await page.waitForTimeout(100)
    await expect(page.locator(`[data-modal-name="${modalName}"]`)).toBeVisible()
    await page.waitForTimeout(100)

    // Press enter to open the link dialog
    await page.keyboard.press('Enter')
    await expect(page.locator(`[data-modal-name="input"]`)).toBeVisible()

    // Press escape; should close link dialog and restore focus to the block textarea
    await page.keyboard.press('Escape')
    await page.waitForTimeout(100)
    await expect(page.locator(`[data-modal-name="input"]`)).not.toBeVisible()
    await page.waitForTimeout(1000)
    expect(await block.isEditing()).toBe(true)
  }
})
