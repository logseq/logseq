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

test.only('copy and paste block after editing new block', async ({ page, block }) => {
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
