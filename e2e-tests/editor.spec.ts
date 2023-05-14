import { expect } from '@playwright/test'
import { test } from './fixtures'
import {
  createRandomPage,
  enterNextBlock,
  modKey,
  selectText,
  getSelection,
  getCursorPos,
} from './utils'
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

test('hashtag search page auto-complete', async ({ page, block }) => {
  await createRandomPage(page)

  await block.activeEditing(0)

  await page.type('textarea >> nth=0', '#', { delay: 100 })
  await page.waitForSelector('text="Search for a page"', { state: 'visible' })
  await page.keyboard.press('Escape', { delay: 50 })

  await block.mustFill("done")

  await enterNextBlock(page)
  await page.type('textarea >> nth=0', 'Some #', { delay: 100 })
  await page.waitForSelector('text="Search for a page"', { state: 'visible' })
  await page.keyboard.press('Escape', { delay: 50 })

  await block.mustFill("done")
})

test('hashtag search #[[ page auto-complete', async ({ page, block }) => {
  await createRandomPage(page)

  await block.activeEditing(0)

  await page.type('textarea >> nth=0', '#[[', { delay: 100 })
  await page.waitForSelector('text="Search for a page"', { state: 'visible' })
  await page.keyboard.press('Escape', { delay: 50 })
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

  await page.keyboard.press(modKey + '+o')

  // Check page title equals to `title`
  await page.waitForTimeout(100)
  expect(await page.locator('h1.title').innerText()).toContain(title)

  // Check there're linked references
  await page.waitForSelector(`.references .ls-block >> nth=1`, { state: 'detached', timeout: 100 })
})

test.skip('backspace and cursor position #4897', async ({ page, block }) => {
  await createRandomPage(page)

  // Delete to previous block, and check cursor position, with markup
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

  // Press Enter and check cursor position, with markup
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
    // This test requires dev mode
    test.skip(process.env.RELEASE === 'true', 'not available for release version')

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

  await block.mustType('Some random text')

  await page.keyboard.press(modKey + '+c')

  await page.press('textarea >> nth=0', 'Enter')
  await block.waitForBlocks(2)
  await page.waitForTimeout(100)
  await page.keyboard.press(modKey + '+v')
  await page.waitForTimeout(100)
  await page.keyboard.press('Enter')

  // Check if the newly created block-ref has the same referenced content
  await expect(page.locator('.block-ref >> text="Some random text"')).toHaveCount(1);

  // Move cursor into the block ref
  for (let i = 0; i < 4; i++) {
    await page.press('textarea >> nth=0', 'ArrowLeft')
  }

  await expect(page.locator('textarea >> nth=0')).not.toHaveValue('Some random text')

  // FIXME: Sometimes the cursor is in the end of the editor
  for (let i = 0; i < 4; i++) {
    await page.press('textarea >> nth=0', 'ArrowLeft')
  }

  // Trigger replace-block-reference-with-content-at-point
  await page.keyboard.press(modKey + '+Shift+r')

  await expect(page.locator('textarea >> nth=0')).toHaveValue('Some random text')

  await block.escapeEditing()

  await expect(page.locator('.block-ref >> text="Some random text"')).toHaveCount(0);
  await expect(page.locator('text="Some random text"')).toHaveCount(2);
})

test('copy and paste block after editing new block #5962', async ({ page, block }) => {
  await createRandomPage(page)

  // Create a block and copy it in block-select mode
  await block.mustType('Block being copied')
  await page.keyboard.press('Escape')
  await expect(page.locator('.ls-block.selected')).toHaveCount(1)

  await page.keyboard.press(modKey + '+c', { delay: 10 })

  await page.keyboard.press('Enter')
  await expect(page.locator('.ls-block.selected')).toHaveCount(0)
  await expect(page.locator('textarea >> nth=0')).toBeVisible()
  await page.keyboard.press('Enter')
  await block.waitForBlocks(2)

  await block.mustType('Typed block')

  await page.keyboard.press(modKey + '+v')
  await expect(page.locator('text="Typed block"')).toHaveCount(1)
  await block.waitForBlocks(3)
})

test('undo and redo after starting an action should not destroy text #6267', async ({ page, block }) => {
  await createRandomPage(page)

  // Get one piece of undo state onto the stack
  await block.mustType('text1 ')
  await page.waitForTimeout(500) // Wait for 500ms autosave period to expire

  // Then type more, start an action prompt, and undo
  await page.keyboard.type('text2 ', { delay: 50 })
  await page.keyboard.type('[[', { delay: 50 })

  await expect(page.locator(`[data-modal-name="page-search"]`)).toBeVisible()
  await page.keyboard.press(modKey + '+z')
  await page.waitForTimeout(100)

  // Should close the action menu when we undo the action prompt
  await expect(page.locator(`[data-modal-name="page-search"]`)).not.toBeVisible()

  // It should undo to the last saved state, and not erase the previous undo action too
  await expect(page.locator('text="text1"')).toHaveCount(1)

  // And it should keep what was undone as a redo action
  await page.keyboard.press(modKey + '+Shift+z')
  await expect(page.locator('text="text1 text2 [[]]"')).toHaveCount(1)
})

test('undo after starting an action should close the action menu #6269', async ({ page, block }) => {
  for (const [commandTrigger, modalName] of [['/', 'commands'], ['[[', 'page-search']]) {
    await createRandomPage(page)

    // Open the action modal
    await block.mustType('text1 ')
    await page.waitForTimeout(550)
    await page.keyboard.type(commandTrigger, { delay: 20 })

    await page.waitForTimeout(100) // Tolerable delay for the action menu to open
    await expect(page.locator(`[data-modal-name="${modalName}"]`)).toBeVisible()

    // Undo, removing "/today", and closing the action modal
    await page.keyboard.press(modKey + '+z')
    await page.waitForTimeout(100)
    await expect(page.locator('text="/today"')).toHaveCount(0)
    await expect(page.locator(`[data-modal-name="${modalName}"]`)).not.toBeVisible()
  }
})

test('#6266 moving cursor outside of brackets should close autocomplete menu', async ({ page, block, autocompleteMenu }) => {
  for (const [commandTrigger, modalName] of [['[[', 'page-search'], ['((', 'block-search']]) {
    // First, left arrow
    await createRandomPage(page)

    await block.mustFill('t ')
    await page.keyboard.type(commandTrigger, { delay: 20 })

    await page.waitForTimeout(100) // Sometimes it doesn't trigger without this
    await autocompleteMenu.expectVisible(modalName)

    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(100)
    await autocompleteMenu.expectHidden(modalName)

    // Then, right arrow
    await createRandomPage(page)

    await block.mustFill('t ')
    await page.keyboard.type(commandTrigger, { delay: 20 })

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
    await block.mustFill('t ')
    await page.keyboard.type(commandTrigger, { delay: 20 })

    await page.waitForTimeout(100)
    await page.keyboard.type("some block search text")
    await page.waitForTimeout(100) // Sometimes it doesn't trigger without this
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
    await block.mustFill('t ')
    await page.keyboard.type(commandTrigger, { delay: 20 })

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
    await block.mustType('test ')
    await page.keyboard.type(commandTrigger, { delay: 20 })

    await page.waitForTimeout(100)
    if (commandTrigger === '[[') {
      await autocompleteMenu.expectVisible(modalName)
    }

    await page.keyboard.type("search", { delay: 20 })
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
    await page.keyboard.type(commandTrigger, { delay: 20 })

    await page.waitForTimeout(100) // Sometimes it doesn't trigger without this
    await autocompleteMenu.expectVisible(modalName)

    await block.escapeEditing()
    await autocompleteMenu.expectHidden(modalName)

    // Move cursor left until it's inside the brackets; shouldn't open autocomplete menu
    await page.locator('.block-content').click()
    await page.waitForTimeout(100)
    await autocompleteMenu.expectHidden(modalName)

    await page.keyboard.press('ArrowLeft', { delay: 50 })
    await autocompleteMenu.expectHidden(modalName)

    await page.keyboard.press('ArrowLeft', { delay: 50 })
    await autocompleteMenu.expectHidden(modalName)

    // Type a letter, this should open the autocomplete menu
    await page.keyboard.type('z', { delay: 20 })
    await page.waitForTimeout(100)
    await autocompleteMenu.expectVisible(modalName)
  }
})

test('selecting text inside of brackets should NOT close autocomplete menu', async ({ page, block, autocompleteMenu }) => {
  for (const [commandTrigger, modalName] of [['[[', 'page-search'], ['((', 'block-search']]) {
    await createRandomPage(page)

    // Open the autocomplete menu
    await block.mustFill('')
    await page.keyboard.type(commandTrigger, { delay: 20 })

    await page.waitForTimeout(100)
    await autocompleteMenu.expectVisible(modalName)

    await page.keyboard.type("some page search text", { delay: 10 })
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
    await block.mustFill('test ')
    await page.keyboard.type(commandTrigger, { delay: 20 })

    await page.waitForTimeout(100)
    await autocompleteMenu.expectVisible(modalName)

    await page.keyboard.type("some page search text", { delay: 10 })
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
    await page.keyboard.type(commandTrigger, { delay: 20 })

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
    await page.keyboard.type(commandTrigger, { delay: 20 })

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

test('should show text after soft return when node is collapsed #5074', async ({ page, block }) => {
  const delay = 300
  await createRandomPage(page)

  await page.type('textarea >> nth=0', 'Before soft return', { delay: 10 })
  await page.keyboard.press('Shift+Enter', { delay: 10 })
  await page.type('textarea >> nth=0', 'After soft return', { delay: 10 })

  await block.enterNext()
  expect(await block.indent()).toBe(true)
  await block.mustType('Child text')

  // collapse
  await page.click('.block-control >> nth=0')
  await block.waitForBlocks(1)

  // select the block that has the soft return
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(delay)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(delay)

  await expect(page.locator('textarea >> nth=0')).toHaveText('Before soft return\nAfter soft return')

  // zoom into the block
  page.click('a.block-control + a')
  await page.waitForNavigation()
  await page.waitForTimeout(delay * 3)

  // select the block that has the soft return
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(delay)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(delay)

  await expect(page.locator('textarea >> nth=0')).toHaveText('Before soft return\nAfter soft return')
})

test('should not erase typed text when expanding block quickly after typing #3891', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustFill('initial text,')
  await page.waitForTimeout(500)
  await page.type('textarea >> nth=0', ' then expand', { delay: 10 })
  // A quick cmd-down must not destroy the typed text
  await page.keyboard.press(modKey + '+ArrowDown')
  await page.waitForTimeout(500)
  expect(await page.inputValue('textarea >> nth=0')).toBe(
    'initial text, then expand'
  )

  // First undo should delete the last typed information, not undo a no-op expand action
  await page.keyboard.press(modKey + '+z')
  expect(await page.inputValue('textarea >> nth=0')).toBe(
    'initial text,'
  )

  await page.keyboard.press(modKey + '+z')
  expect(await page.inputValue('textarea >> nth=0')).toBe(
    ''
  )
})

test('should keep correct undo and redo seq after indenting or outdenting the block #7615',async({page,block}) => {
  await createRandomPage(page)

  await block.mustFill("foo")

  await page.keyboard.press("Enter")
  await expect(page.locator('textarea >> nth=0')).toHaveText("")
  await block.indent()
  await block.mustFill("bar")
  await expect(page.locator('textarea >> nth=0')).toHaveText("bar")

  await page.keyboard.press(modKey + '+z')
  // should undo "bar" input
  await expect(page.locator('textarea >> nth=0')).toHaveText("")
  await page.keyboard.press(modKey + '+Shift+z')
  // should redo "bar" input
  await expect(page.locator('textarea >> nth=0')).toHaveText("bar")
  await page.keyboard.press("Shift+Tab")

  await page.keyboard.press("Enter")
  await expect(page.locator('textarea >> nth=0')).toHaveText("")
  // swap input seq
  await block.mustFill("baz")
  await block.indent()

  await page.keyboard.press(modKey + '+z')
  // should undo indention
  await expect(page.locator('textarea >> nth=0')).toHaveText("baz")
  await page.keyboard.press("Shift+Tab")

  await page.keyboard.press("Enter")
  await expect(page.locator('textarea >> nth=0')).toHaveText("")
  // #7615
  await page.keyboard.type("aaa")
  await block.indent()
  await page.keyboard.type(" bbb")
  await expect(page.locator('textarea >> nth=0')).toHaveText("aaa bbb")
  await page.keyboard.press(modKey + '+z')
  await expect(page.locator('textarea >> nth=0')).toHaveText("aaa")
  await page.keyboard.press(modKey + '+z')
  await expect(page.locator('textarea >> nth=0')).toHaveText("aaa")
  await page.keyboard.press(modKey + '+z')
  await expect(page.locator('textarea >> nth=0')).toHaveText("")
  await page.keyboard.press(modKey + '+Shift+z')
  await expect(page.locator('textarea >> nth=0')).toHaveText("aaa")
  await page.keyboard.press(modKey + '+Shift+z')
  await expect(page.locator('textarea >> nth=0')).toHaveText("aaa")
  await page.keyboard.press(modKey + '+Shift+z')
  await expect(page.locator('textarea >> nth=0')).toHaveText("aaa bbb")
})

test('apply bold formatting with empty selection', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustFill('Lorem ')

  // Apply bold formatting
  await page.keyboard.press(modKey + '+b')

  await expect(page.locator('textarea >> nth=0')).toHaveText('Lorem ****')

  // Verify cursor position
  const cursorPosition = await getCursorPos(page)

  // Considering 'Lorem ' is 6 characters long and '****' is 4 characters long
  // the expected cursor position should be 6 + 4/2 = 8
  expect(cursorPosition).toBe(8)
})

test('apply bold formatting to the entire block', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustFill('Lorem ipsum-dolor sit.')

  // Select the entire block
  await page.keyboard.press(modKey + '+a')

  // Apply bold formatting
  await page.keyboard.press(modKey + '+b')

  // Verify that the text is now bold
  await expect(page.locator('textarea >> nth=0')).toHaveText(
    '**Lorem ipsum-dolor sit.**'
  )

  // Verify cursor position
  const cursorPosition = await getCursorPos(page)

  // Considering 'Lorem ipsum-dolor sit.' is 22 characters long
  // Cursor should be at the end of the text and before the end of the formatting characters
  expect(cursorPosition).toBe(24)
})

test('apply and remove bold formatting to a word connected with a special character', async ({
  page,
  block,
}) => {
  await createRandomPage(page)

  await block.mustFill('Lorem ipsum-dolor sit.')

  // Select 'ipsum'
  await selectText(page, 16, 5)

  // Apply bold formatting
  await page.keyboard.press(modKey + '+b')

  // Verify that 'ipsum' is bold
  await expect(page.locator('textarea >> nth=0')).toHaveText(
    'Lorem **ipsum**-dolor sit.'
  )

  // Re-select 'ipsum'
  await selectText(page, 5, 5)

  // Remove bold formatting
  await page.keyboard.press(modKey + '+b')

  // Verify that 'ipsum' is no longer bold and is still selected
  await expect(page.locator('textarea >> nth=0')).toHaveText(
    'Lorem ipsum-dolor sit.'
  )

  // Verify the word 'ipsum' is still selected
  const selection = await getSelection(page)
  expect(selection).toBe('ipsum')
})

test('apply italic formatting with empty selection', async ({
  page,
  block,
}) => {
  await createRandomPage(page)

  await block.mustFill('Lorem ')

  // Apply italic formatting
  await page.keyboard.press(modKey + '+i')

  await expect(page.locator('textarea >> nth=0')).toHaveText('Lorem **')

  // Verify cursor position
  const cursorPosition = await getCursorPos(page)

  // Considering 'Lorem ' is 6 characters long and '**' is 2 characters long
  // the expected cursor position should be 6 + 2/2 = 7
  expect(cursorPosition).toBe(7)
})

test('apply italic formatting to the entire block', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustFill('Lorem ipsum-dolor sit.')

  // Select the entire block
  await page.keyboard.press(modKey + '+a')

  // Apply italic formatting
  await page.keyboard.press(modKey + '+i')

  await expect(page.locator('textarea >> nth=0')).toHaveText(
    '*Lorem ipsum-dolor sit.*'
  )

  // Verify cursor position
  const cursorPosition = await getCursorPos(page)
  expect(cursorPosition).toBe(23)
})

test('apply and remove italic formatting to a word connected with a special character', async ({
  page,
  block,
}) => {
  await createRandomPage(page)

  await block.mustFill('Lorem ipsum-dolor sit.')

  // Select 'ipsum'
  await selectText(page, 16, 5)

  // Apply italic formatting
  await page.keyboard.press(modKey + '+i')

  // Verify that 'ipsum' is italic
  await expect(page.locator('textarea >> nth=0')).toHaveText(
    'Lorem *ipsum*-dolor sit.'
  )

  // Re-select 'ipsum'
  await selectText(page, 5, 5)

  // Remove italic formatting
  await page.keyboard.press(modKey + '+i')

  // Verify that 'ipsum' is no longer italic and is still selected
  await expect(page.locator('textarea >> nth=0')).toHaveText(
    'Lorem ipsum-dolor sit.'
  )

  // Verify the word 'ipsum' is still selected
  const selection = await getSelection(page)

  expect(selection).toBe('ipsum')
})

test('apply strikethrough formatting with empty selection', async ({
  page,
  block,
}) => {
  await createRandomPage(page)

  await block.mustFill('Lorem ')

  // Apply italic formatting
  await page.keyboard.press(modKey + '+Shift+s')

  await expect(page.locator('textarea >> nth=0')).toHaveText('Lorem ~~~~')

  // Verify cursor position
  const cursorPosition = await getCursorPos(page)

  // Considering 'Lorem ' is 6 characters long and '**' is 2 characters long
  // the expected cursor position should be 6 + 2/2 = 7
  expect(cursorPosition).toBe(8)
})

test('apply strikethrough formatting to the entire block', async ({
  page,
  block,
}) => {
  await createRandomPage(page)

  await block.mustFill('Lorem ipsum-dolor sit.')

  // Select the entire block
  await page.keyboard.press(modKey + '+a')

  // Apply strikethrough formatting
  await page.keyboard.press(modKey + '+Shift+s')

  await expect(page.locator('textarea >> nth=0')).toHaveText(
    '~~Lorem ipsum-dolor sit.~~'
  )

  // Verify cursor position
  const cursorPosition = await getCursorPos(page)
  expect(cursorPosition).toBe(24)
})

test('apply and remove strikethrough formatting to a word connected with a special character', async ({
  page,
  block,
}) => {
  await createRandomPage(page)

  await block.mustFill('Lorem ipsum-dolor sit.')

  // Select 'ipsum'
  await selectText(page, 16, 5)

  // Apply strikethrough formatting
  await page.keyboard.press(modKey + '+Shift+s')

  // Verify that 'ipsum' is strikethrough
  await expect(page.locator('textarea >> nth=0')).toHaveText(
    'Lorem ~~ipsum~~-dolor sit.'
  )

  // Re-select 'ipsum'
  await selectText(page, 5, 5)

  // Remove strikethrough formatting
  await page.keyboard.press(modKey + '+Shift+s')

  // Verify that 'ipsum' is no longer strikethrough and is still selected
  await expect(page.locator('textarea >> nth=0')).toHaveText(
    'Lorem ipsum-dolor sit.'
  )

  // Verify the word 'ipsum' is still selected
  const selection = await getSelection(page)
  expect(selection).toBe('ipsum')
})

test.fixme('apply and remove underline formatting to a word connected with a special character', async ({
  page,
  block,
}) => {
  await createRandomPage(page)

  await block.mustFill('Lorem ipsum-dolor sit.')

  // Select 'ipsum'
  await selectText(page, 16, 5)

  // Apply strikethrough formatting
  await page.keyboard.press(modKey + '+u')

  // Verify that 'ipsum' is strikethrough
  await expect(page.locator('textarea >> nth=0')).toHaveText(
    'Lorem <u>ipsum</u>-dolor sit.'
  )

  // Re-select 'ipsum'
  await selectText(page, 5, 5)

  // Remove strikethrough formatting
  await page.keyboard.press(modKey + '+u')

  // Verify that 'ipsum' is no longer strikethrough and is still selected
  await expect(page.locator('textarea >> nth=0')).toHaveText(
    'Lorem ipsum-dolor sit.'
  )

  // Verify the word 'ipsum' is still selected
  const selection = await getSelection(page)
  expect(selection).toBe('ipsum')
})

test('apply and remove all formatting to a word connected with a special character', async ({
  page,
  block,
}) => {
  await createRandomPage(page)

  await block.mustFill('Lorem ipsum-dolor sit.')

  // Select 'ipsum'
  await selectText(page, 16, 5)

  // Apply italic formatting
  await page.keyboard.press(modKey + '+i')
  await expect(page.locator('textarea >> nth=0')).toHaveText(
    'Lorem *ipsum*-dolor sit.'
  )

  // Re-select 'ipsum'
  await selectText(page, 6, 7)

  // Apply strikethrough formatting
  await page.keyboard.press(modKey + '+Shift+s')
  await expect(page.locator('textarea >> nth=0')).toHaveText(
    'Lorem ~~*ipsum*~~-dolor sit.'
  )
  // select '~~ipsum~~'
  await selectText(page, 9, 11)

  // Apply bold formatting
  await page.keyboard.press(modKey + '+b')
  await expect(page.locator('textarea >> nth=0')).toHaveText(
    'Lorem **~~*ipsum*~~**-dolor sit.'
  )

  await selectText(page, 8, 5)

  // Remove italic formatting
  await page.keyboard.press(modKey + '+i')
  await expect(page.locator('textarea >> nth=0')).toHaveText(
    'Lorem **~~ipsum~~**-dolor sit.'
  )

  // Remove strikethrough formatting
  await page.keyboard.press(modKey + '+Shift+s')
  await expect(page.locator('textarea >> nth=0')).toHaveText(
    'Lorem **ipsum**-dolor sit.'
  )

  // Remove bold formatting
  await page.keyboard.press(modKey + '+b')
  await expect(page.locator('textarea >> nth=0')).toHaveText(
    'Lorem ipsum-dolor sit.'
  )

  const selection = await getSelection(page)

  expect(selection).toBe('ipsum')
})

test('square brackets auto-pairing', async ({ page }) => {
  await createRandomPage(page)

  // type an open square bracket
  page.type('textarea >> nth=0', '[', { delay: 100 })

  // Verify that a closing square bracket was automatically added
  await expect(page.locator('textarea >> nth=0')).toHaveText('[]')

  // Verify that the cursor is between the square brackets
  const cursorPosition = await getCursorPos(page)
  expect(cursorPosition).toBe(1)
})

test('curly brackets auto-pairing', async ({ page }) => {
  await createRandomPage(page)

  // type an open curly bracket
  page.type('textarea >> nth=0', '{', { delay: 100 })

  // Verify that a closing curly bracket was automatically added
  await expect(page.locator('textarea >> nth=0')).toHaveText('{}')

  // Verify that the cursor is between the curly brackets
  const cursorPosition = await getCursorPos(page)
  expect(cursorPosition).toBe(1)
})

test('parentheses auto-pairing', async ({ page }) => {
  await createRandomPage(page)

  // type an open parenthesis
  page.type('textarea >> nth=0', '(', { delay: 100 })

  // Verify that a closing parenthesis was automatically added
  await expect(page.locator('textarea >> nth=0')).toHaveText('()')

  // Verify that the cursor is between the parentheses
  const cursorPosition = await getCursorPos(page)
  expect(cursorPosition).toBe(1)
})

test('backtick auto-pairing', async ({ page }) => {
  await createRandomPage(page)

  // type an open square bracket
  page.type('textarea >> nth=0', '`', { delay: 100 })

  // Verify that a closing backtick was automatically added
  await expect(page.locator('textarea >> nth=0')).toHaveText('``')

  // Verify that the cursor is between the backticks
  const cursorPosition = await getCursorPos(page)
  expect(cursorPosition).toBe(1)
})

test.fixme('single quote auto-pairing', async ({ page }) => {
  await createRandomPage(page)

  // type an open single quote
  page.type('textarea >> nth=0', "'", { delay: 100 })

  // Verify that a closing single quote was automatically added
  await expect(page.locator('textarea >> nth=0')).toHaveText("''")

  // Verify that the cursor is between the single quotes
  const cursorPosition = await getCursorPos(page)
  expect(cursorPosition).toBe(1)
})

test.fixme('double quote auto-pairing', async ({ page }) => {
  await createRandomPage(page)

  // type an open double quote
  page.type('textarea >> nth=0', '"', { delay: 100 })

  // Verify that a closing double quote was automatically added
  await expect(page.locator('textarea >> nth=0')).toHaveText('""')

  // Verify that the cursor is between the double quotes
  const cursorPosition = await getCursorPos(page)
  expect(cursorPosition).toBe(1)
})

test.fixme('autopair pipe symbol', async ({ page }) => {
  await createRandomPage(page)

  // type an open pipe
  page.type('textarea >> nth=0', '|', { delay: 100 })

  // Verify that a closing pipe was automatically added
  await expect(page.locator('textarea >> nth=0')).toHaveText('||')

  // Verify that the cursor is between the pipes
  const cursorPosition = await getCursorPos(page)
  expect(cursorPosition).toBe(1)
})

test.fixme('only autopair tilda with text selection', async ({ page }) => {
  await createRandomPage(page)

  // type an open tilda
  page.type('textarea >> nth=0', '~', { delay: 100 })

  // Verify that an additional tilda was not automatically added
  await expect(page.locator('textarea >> nth=0')).toHaveText('~')

  // remove tilda
  await page.keyboard.press('Backspace')

  // add text
  await page.type('textarea >> nth=0', 'Lorem')

  // select text
  await page.keyboard.press(modKey + '+a')

  // Type a tilda
  await page.type('textarea >> nth=0', '~', { delay: 100 })

  // Verify that an additional tilda was automatically added around 'ipsum'
  await expect(page.locator('textarea >> nth=0')).toHaveText('~Lorem~')

  // Verify that the cursor is at the end of 'ipsum'
  const cursorPosition = await getCursorPos(page)
  expect(cursorPosition).toBe('~Lorem~'.length)
})

test('Only auto-pair asterisk with text selection', async ({
  page,
  block,
}) => {
  await createRandomPage(page)

  // type an open asterisk
  page.type('textarea >> nth=0', '*', { delay: 100 })

  // Verify that an additional asterisk was not automatically added
  await expect(page.locator('textarea >> nth=0')).toHaveText('*')

  // remove asterisk
  await page.keyboard.press('Backspace')

  // add text
  await block.mustType('Lorem')
  // select text
  await page.keyboard.press(modKey + '+a')

  // Type an asterisk
  await page.type('textarea >> nth=0', '*', { delay: 100 })

  // Verify that an additional asterisk was automatically added around 'ipsum'
  await expect(page.locator('textarea >> nth=0')).toHaveText('*Lorem*')

  // Verify 'Lorem' is selected
  const selection = await getSelection(page)
  expect(selection).toBe('Lorem')
})

test('Only auto-pair underscore with text selection', async ({ page, block }) => {
  await createRandomPage(page)

  // type an underscore
  page.type('textarea >> nth=0', '_', { delay: 100 })

  // Verify that an additional asterisk was not automatically added
  await expect(page.locator('textarea >> nth=0')).toHaveText('_')

  // remove underscore
  await page.keyboard.press('Backspace')

  // add text
  await block.mustType('Lorem')
  // select text
  await page.keyboard.press(modKey + '+a')

  // Type an underscore
  await page.type('textarea >> nth=0', '_', { delay: 100 })

  // Verify that an additional asterisk was automatically added around 'ipsum'
  await expect(page.locator('textarea >> nth=0')).toHaveText('_Lorem_')

  // Verify 'Lorem' is selected
  const selection = await getSelection(page)
  expect(selection).toBe('Lorem')
})

test('Only auto-pair ^ symbol with text selection', async ({ page, block }) => {
  await createRandomPage(page)

  // type the symbol
  page.type('textarea >> nth=0', '^', { delay: 100 })

  // Verify that an additional sybmol was not automatically added
  await expect(page.locator('textarea >> nth=0')).toHaveText('^')

  // remove symbol
  await page.keyboard.press('Backspace')

  // add text
  await block.mustType('Lorem')
  // select text
  await page.keyboard.press(modKey + '+a')

  // Type the symbol
  await page.type('textarea >> nth=0', '^', { delay: 100 })

  // Verify that an additional symbol was automatically added around 'ipsum'
  await expect(page.locator('textarea >> nth=0')).toHaveText('^Lorem^')

  // Verify 'Lorem' is selected
  const selection = await getSelection(page)
  expect(selection).toBe('Lorem')
})

test('Only auto-pair = symbol with text selection', async ({ page, block }) => {
  await createRandomPage(page)

  // type the symbol
  page.type('textarea >> nth=0', '=', { delay: 100 })

  // Verify that an additional sybmol was not automatically added
  await expect(page.locator('textarea >> nth=0')).toHaveText('=')

  // remove symbol
  await page.keyboard.press('Backspace')

  // add text
  await block.mustType('Lorem')
  // select text
  await page.keyboard.press(modKey + '+a')

  // Type the symbol
  await page.type('textarea >> nth=0', '=', { delay: 100 })

  // Verify that an additional symbol was automatically added around 'ipsum'
  await expect(page.locator('textarea >> nth=0')).toHaveText('=Lorem=')

  // Verify 'Lorem' is selected
  const selection = await getSelection(page)
  expect(selection).toBe('Lorem')
})

test('Only auto-pair / symbol with text selection', async ({ page, block }) => {
  await createRandomPage(page)

  // type the symbol
  page.type('textarea >> nth=0', '/', { delay: 100 })

  // Verify that an additional sybmol was not automatically added
  await expect(page.locator('textarea >> nth=0')).toHaveText('/')

  // remove symbol
  await page.keyboard.press('Backspace')

  // add text
  await block.mustType('Lorem')
  // select text
  await page.keyboard.press(modKey + '+a')

  // Type the symbol
  await page.type('textarea >> nth=0', '/', { delay: 100 })

  // Verify that an additional symbol was automatically added around 'ipsum'
  await expect(page.locator('textarea >> nth=0')).toHaveText('/Lorem/')

  // Verify 'Lorem' is selected
  const selection = await getSelection(page)
  expect(selection).toBe('Lorem')
})

test('Only auto-pair + symbol with text selection', async ({ page, block }) => {
  await createRandomPage(page)

  // type the symbol
  page.type('textarea >> nth=0', '+', { delay: 100 })

  // Verify that an additional sybmol was not automatically added
  await expect(page.locator('textarea >> nth=0')).toHaveText('+')

  // remove symbol
  await page.keyboard.press('Backspace')

  // add text
  await block.mustType('Lorem')
  // select text
  await page.keyboard.press(modKey + '+a')

  // Type the symbol
  await page.type('textarea >> nth=0', '+', { delay: 100 })

  // Verify that an additional symbol was automatically added around 'ipsum'
  await expect(page.locator('textarea >> nth=0')).toHaveText('+Lorem+')

  // Verify 'Lorem' is selected
  const selection = await getSelection(page)
  expect(selection).toBe('Lorem')
})