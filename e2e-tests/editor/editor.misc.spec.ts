import { expect } from '@playwright/test'
import { test } from '../fixtures'
import {
  createRandomPage,
  enterNextBlock,
  modKey,
  repeatKeyPress,
  STD_DELAY,
} from '../utils'
import { dispatch_kb_events } from '../util/keyboard-events'
import * as kb_events from '../util/keyboard-events'

test('hashtag and square brackets in same line #4178', async ({ page }) => {
  await createRandomPage(page)

  await page.type('textarea >> nth=0', '#foo bar')
  await enterNextBlock(page)
  await page.type('textarea >> nth=0', 'bar [[blah]]', { delay: STD_DELAY })

  await repeatKeyPress(page, 'ArrowLeft', 12)

  await page.type('textarea >> nth=0', ' ')
  await page.press('textarea >> nth=0', 'ArrowLeft')

  await page.type('textarea >> nth=0', '#')
  await page.waitForSelector('text="Search for a page"', { state: 'visible' })

  await page.type('textarea >> nth=0', 'fo')

  await page.click('.absolute >> text=' + 'foo')

  expect(await page.inputValue('textarea >> nth=0')).toBe('#foo bar [[blah]]')
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
  await expect(page.locator('.editor-inner')).toHaveCount(0, {
    timeout: STD_DELAY * 5,
  })
})

test('create new page from bracketing text #4971', async ({ page, block }) => {
  let title = 'Page not Exists yet'
  await createRandomPage(page)

  await block.mustType(`[[${title}]]`)

  await page.keyboard.press(modKey + '+o', { delay: STD_DELAY })

  // Check page title equals to `title`
  expect(await page.locator('h1.title').innerText()).toContain(title)

  // Check there're linked references
  await page.waitForSelector(`.references .ls-block >> nth=1`, {
    state: 'detached',
    timeout: STD_DELAY,
  })
})

test.skip('next block and cursor position', async ({ page, block }) => {
  await createRandomPage(page)

  // Press Enter and check cursor position, with markup
  await block.mustType('abcde`12345', { toBe: 'abcde`12345`' }) // "`" auto-completes

  await repeatKeyPress(page, 'ArrowLeft', 7)

  expect(await block.selectionStart()).toBe(5) // after letter 'e'

  await block.enterNext()
  expect(await block.selectionStart()).toBe(0) // should at the beginning of the next block

  const locator = page.locator('textarea >> nth=0')
  await expect(locator).toHaveText('`12345`', { timeout: STD_DELAY * 5 })
})

test(
  'Press CJK Left Black Lenticular Bracket `【` by 2 times #3251 should trigger [[]], ' +
    'but dont trigger RIME #3440 ',
  // cases should trigger [[]] #3251
  async ({ page, block }) => {
    // This test requires dev mode
    test.skip(
      process.env.RELEASE === 'true',
      'not available for release version'
    )

    // @ts-ignore
    for (let [idx, events] of [
      kb_events.win10_pinyin_left_full_square_bracket,
      kb_events.macos_pinyin_left_full_square_bracket,
      // TODO: support #3741
      // kb_events.win10_legacy_pinyin_left_full_square_bracket,
    ].entries()) {
      await createRandomPage(page)
      let check_text = '#3251 test ' + idx
      await block.mustFill(check_text + '【')
      await dispatch_kb_events(page, ':nth-match(textarea, 1)', events)
      expect(await page.inputValue(':nth-match(textarea, 1)')).toBe(
        check_text + '【'
      )
      await block.mustFill(check_text + '【【')
      await dispatch_kb_events(page, ':nth-match(textarea, 1)', events)
      expect(await page.inputValue(':nth-match(textarea, 1)')).toBe(
        check_text + '[[]]'
      )
    }

    // @ts-ignore dont trigger RIME #3440
    for (let [idx, events] of [
      kb_events.macos_pinyin_selecting_candidate_double_left_square_bracket,
      kb_events.win10_RIME_selecting_candidate_double_left_square_bracket,
    ].entries()) {
      await createRandomPage(page)
      let check_text = '#3440 test ' + idx
      await block.mustFill(check_text)
      await dispatch_kb_events(page, ':nth-match(textarea, 1)', events)
      expect(await page.inputValue(':nth-match(textarea, 1)')).toBe(check_text)
      await dispatch_kb_events(page, ':nth-match(textarea, 1)', events)
      expect(await page.inputValue(':nth-match(textarea, 1)')).toBe(check_text)
    }
  }
)

test('copy & paste block ref and replace its content', async ({
  page,
  block,
}) => {
  await createRandomPage(page)

  await block.mustType('Some random text')

  await page.keyboard.press(modKey + '+c')

  await page.press('textarea >> nth=0', 'Enter', { delay: STD_DELAY })
  await block.waitForBlocks(2)
  await page.keyboard.press(modKey + '+v', { delay: STD_DELAY })
  await page.keyboard.press('Enter')

  // Check if the newly created block-ref has the same referenced content
  await expect(
    page.locator('.block-ref >> text="Some random text"')
  ).toHaveCount(1)

  // Move cursor into the block ref
  repeatKeyPress(page, 'ArrowLeft', 4)

  await expect(page.locator('textarea >> nth=0')).not.toHaveValue(
    'Some random text'
  )

  // FIXME: Sometimes the cursor is in the end of the editor
  await repeatKeyPress(page, 'ArrowLeft', 4)

  // Trigger replace-block-reference-with-content-at-point
  await page.keyboard.press(modKey + '+Shift+r')

  await expect(page.locator('textarea >> nth=0')).toHaveValue(
    'Some random text'
  )

  await block.escapeEditing()

  await expect(
    page.locator('.block-ref >> text="Some random text"')
  ).toHaveCount(0)
  await expect(page.locator('text="Some random text"')).toHaveCount(2)
})

test('copy and paste block after editing new block #5962', async ({
  page,
  block,
}) => {
  await createRandomPage(page)

  // Create a block and copy it in block-select mode
  await block.mustType('Block being copied')
  await page.keyboard.press('Escape')
  await expect(page.locator('.ls-block.selected')).toHaveCount(1)

  await page.keyboard.press(modKey + '+c', { delay: STD_DELAY })

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

test('press escape when link/image dialog is open, should restore focus to input', async ({
  page,
  block,
}) => {
  await createRandomPage(page)

  // Step 1: Open the slash command menu
  let dataModalSelector = '[data-modal-name="commands"]'
  test.step('Open the slash command menu', async () => {
    await page.keyboard.press('/', { delay: STD_DELAY })
    // wait for the slash command menu to appear
    await expect(page.locator(dataModalSelector)).toBeVisible()
  })

  // Step 2: Open & close the link dialog
  dataModalSelector = '[data-modal-name="input"]'
  test.step('Open & close the link dialog', async () => {
    // Open the link dialog
    await page.keyboard.type('link', { delay: STD_DELAY })
    await page.keyboard.press('Enter', { delay: STD_DELAY })
    // wait for the link dialog to appear
    await expect(page.locator(dataModalSelector)).toBeVisible()
    // Press escape; should close link dialog and restore focus to the block textarea
    await page.keyboard.press('Escape', { delay: STD_DELAY })
    await expect(page.locator(dataModalSelector)).not.toBeVisible()
  })

  // step 3: Check if the block textarea is focused
  test.step('Check if the block textarea is focused', async () => {
    expect(await block.isEditing()).toBe(true)
  })
})

test('should show text after soft return when node is collapsed #5074', async ({
  page,
  block,
}) => {
  await createRandomPage(page)

  await page.type('textarea >> nth=0', 'Before soft return', {
    delay: STD_DELAY,
  })
  await page.keyboard.press('Shift+Enter', { delay: STD_DELAY })
  await page.type('textarea >> nth=0', 'After soft return', {
    delay: STD_DELAY,
  })

  await block.enterNext()
  expect(await block.indent()).toBe(true)
  await block.mustType('Child text')

  // collapse
  await page.click('.block-control >> nth=0')
  await block.waitForBlocks(1)

  // select the block that has the soft return
  await page.keyboard.press('ArrowDown', { delay: STD_DELAY })
  await page.keyboard.press('Enter', { delay: STD_DELAY })

  await expect(page.locator('textarea >> nth=0')).toHaveText(
    'Before soft return\nAfter soft return'
  )

  // zoom into the block
  page.click('a.block-control + a')
  await page.waitForTimeout(STD_DELAY)

  // select the block that has the soft return
  await page.keyboard.press('ArrowDown', { delay: STD_DELAY })
  await page.keyboard.press('Enter', { delay: STD_DELAY })

  await expect(page.locator('textarea >> nth=0')).toHaveText(
    'Before soft return\nAfter soft return'
  )
})

test('should not erase typed text when expanding block quickly after typing #3891', async ({
  page,
  block,
}) => {
  await createRandomPage(page)

  await block.mustFill('initial text,')
  await page.waitForTimeout(500)
  await page.type('textarea >> nth=0', ' then expand', { delay: STD_DELAY })
  // A quick cmd-down mus * 2t not destroy the typed text
  await page.keyboard.press(modKey + '+ArrowDown', { delay: STD_DELAY * 5 })
  expect(await page.inputValue('textarea >> nth=0')).toBe(
    'initial text, then expand'
  )

  // First undo should delete the last typed information, not undo a no-op expand action
  await page.keyboard.press(modKey + '+z')
  expect(await page.inputValue('textarea >> nth=0')).toBe('initial text,')

  await page.keyboard.press(modKey + '+z')
  expect(await page.inputValue('textarea >> nth=0')).toBe('')
})
