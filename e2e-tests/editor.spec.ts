import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, enterNextBlock, editFirstBlock, IsMac } from './utils'
import { dispatch_kb_events } from './util/keyboard-events'
import * as kb_events from './util/keyboard-events'

test(
  "press Chinese parenthesis 【 by 2 times #3251 should trigger [[]], " +
  "but dont trigger RIME #3440 ",
  // cases should trigger [[]] #3251
  async ({ page }) => {
    for (let [idx, events] of [
      kb_events.win10_pinyin_left_full_square_bracket,
      kb_events.macos_pinyin_left_full_square_bracket
      // TODO: support #3741
      // kb_events.win10_legacy_pinyin_left_full_square_bracket,
    ].entries()) {
      await createRandomPage(page)
      let check_text = "#3251 test " + idx
      await page.fill(':nth-match(textarea, 1)', check_text + "【")
      await dispatch_kb_events(page, ':nth-match(textarea, 1)', events)
      expect(await page.inputValue(':nth-match(textarea, 1)')).toBe(check_text + '【')
      await page.fill(':nth-match(textarea, 1)', check_text + "【【")
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
      await page.fill(':nth-match(textarea, 1)', check_text)
      await dispatch_kb_events(page, ':nth-match(textarea, 1)', events)
      expect(await page.inputValue(':nth-match(textarea, 1)')).toBe(check_text)
      await dispatch_kb_events(page, ':nth-match(textarea, 1)', events)
      expect(await page.inputValue(':nth-match(textarea, 1)')).toBe(check_text)
    }
  })

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

test('backspace and cursor position', async ({ page, block }) => {
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
  expect(await block.selectionStart()).toBe(8)
})

// FIXME: ClipboardItem is not defined when running with this test
// test('copy & paste block ref and replace its content', async ({ page }) => {
//   await createRandomPage(page)

//   await page.type('textarea >> nth=0', 'Some random text')
//   if (IsMac) {
//     await page.keyboard.press('Meta+c')
//   } else {
//     await page.keyboard.press('Control+c')
//   }

//   await page.pause()

//   await page.press('textarea >> nth=0', 'Enter')
//   if (IsMac) {
//     await page.keyboard.press('Meta+v')
//   } else {
//     await page.keyboard.press('Control+v')
//   }
//   await page.keyboard.press('Escape')

//   const blockRef$ = page.locator('.block-ref >> text="Some random text"');

//   // Check if the newly created block-ref has the same referenced content
//   await expect(blockRef$).toHaveCount(1);

//   // Edit the last block
//   await blockRef$.press('Enter')

//   // Move cursor into the block ref
//   for (let i = 0; i < 4; i++) {
//     await page.press('textarea >> nth=0', 'ArrowLeft')
//   }

//   // Trigger replace-block-reference-with-content-at-point
//   if (IsMac) {
//     await page.keyboard.press('Meta+Shift+r')
//   } else {
//     await page.keyboard.press('Control+Shift+v')
//   }
// })
