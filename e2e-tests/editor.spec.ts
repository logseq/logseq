import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage } from './utils'
import { dispatch_kb_events } from './util/keyboard-events'
import * as kb_events from './util/keyboard-events'

test(
  "press Chinese parenthesis 【 by 2 times #3251 should trigger [[]], " +
  "but dont trigger RIME #3440 ",
  // cases should trigger [[]] #3251
  async ({ page }) => {
    for (let left_full_bracket of [
      kb_events.macos_pinyin_left_full_bracket,
      kb_events.win10_pinyin_left_full_bracket,
      // TODO: support #3741
      // kb_events.win10_legacy_pinyin_left_full_bracket,
    ]) {
      await createRandomPage(page)
      await page.type(':nth-match(textarea, 1)', "【")
      await dispatch_kb_events(page, ':nth-match(textarea, 1)', left_full_bracket)
      expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('【')
      await page.type(':nth-match(textarea, 1)', "【")
      await dispatch_kb_events(page, ':nth-match(textarea, 1)', left_full_bracket)
      expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('[[]]')
    };

    // dont trigger RIME #3440
    for (let [idx, selecting_candidate_left_bracket] of [
      kb_events.macos_pinyin_selecting_candidate_double_left_bracket,
      kb_events.win10_RIME_selecting_candidate_double_left_bracket
    ].entries()) {
      await createRandomPage(page)
      let check_text = "#3440 test " + idx
      await page.type(':nth-match(textarea, 1)', check_text)
      await dispatch_kb_events(page, ':nth-match(textarea, 1)', selecting_candidate_left_bracket)
      expect(await page.inputValue(':nth-match(textarea, 1)')).toBe(check_text)
      await dispatch_kb_events(page, ':nth-match(textarea, 1)', selecting_candidate_left_bracket)
      expect(await page.inputValue(':nth-match(textarea, 1)')).toBe(check_text)
    }
  })

test('hashtag and quare brackets in same line #4178', async ({ page }) => {
  await createRandomPage(page)

  await page.type(':nth-match(textarea, 1)', '#foo bar')
  await page.press(':nth-match(textarea, 1)', 'Enter')
  await page.type(':nth-match(textarea, 1)', 'bar [[blah]]')
  for (let i = 0; i < 12; i++) {
    await page.press(':nth-match(textarea, 1)', 'ArrowLeft')
  }
  await page.type(':nth-match(textarea, 1)', ' ')
  await page.press(':nth-match(textarea, 1)', 'ArrowLeft')

  await page.type(':nth-match(textarea, 1)', '#')
  await page.waitForSelector('text="Search for a page"', { state: 'visible' })

  await page.type(':nth-match(textarea, 1)', 'fo')

  await page.click('.absolute >> text=' + 'foo')

  expect(await page.inputValue(':nth-match(textarea, 1)')).toBe(
    '#foo bar [[blah]]'
  )
})

// FIXME: ClipboardItem is not defined when running with this test
// test('copy & paste block ref and replace its content', async ({ page }) => {
//   await createRandomPage(page)

//   await page.type(':nth-match(textarea, 1)', 'Some random text')
//   if (IsMac) {
//     await page.keyboard.press('Meta+c')
//   } else {
//     await page.keyboard.press('Control+c')
//   }

//   await page.pause()

//   await page.press(':nth-match(textarea, 1)', 'Enter')
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
//     await page.press(':nth-match(textarea, 1)', 'ArrowLeft')
//   }

//   // Trigger replace-block-reference-with-content-at-point
//   if (IsMac) {
//     await page.keyboard.press('Meta+Shift+r')
//   } else {
//     await page.keyboard.press('Control+Shift+v')
//   }  
// })
  
