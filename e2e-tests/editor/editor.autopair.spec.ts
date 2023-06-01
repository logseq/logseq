import { expect } from '@playwright/test'
import { test } from '../fixtures'
import {
  createRandomPage,
  enterNextBlock,
  modKey,
  getSelection,
  getCursorPos,
  STD_DELAY,
} from '../utils'

test.describe('Auto-pair symbols only with text selection', () => {
  const autoPairSymbols = [
    // { name: 'tilde', prefix: '~', postfix: '~' },
    { name: 'asterisk', prefix: '*', postfix: '*' },
    { name: 'underscore', prefix: '_', postfix: '_' },
    { name: 'caret', prefix: '^', postfix: '^' },
    { name: 'equal', prefix: '=', postfix: '=' },
    { name: 'slash', prefix: '/', postfix: '/' },
    { name: 'plus', prefix: '+', postfix: '+' },
  ]

  for (const symbol of autoPairSymbols) {
    test(`Only auto-pair ${symbol.name} with text selection`, async ({
      page,
      block,
    }) => {
      await createRandomPage(page)

      // type the symbol
      page.type('textarea >> nth=0', symbol.prefix, { delay: STD_DELAY })

      // Verify that there is no auto-pairing
      await expect(page.locator('textarea >> nth=0')).toHaveText(symbol.prefix)

      // remove prefix
      await page.keyboard.press('Backspace')

      // add text
      await block.mustType('Lorem')
      // select text
      await page.keyboard.press(modKey + '+a')

      // Type the prefix
      await page.type('textarea >> nth=0', symbol.prefix, { delay: STD_DELAY })

      // Verify that an additional postfix was automatically added around 'Lorem'
      await expect(page.locator('textarea >> nth=0')).toHaveText(
        `${symbol.prefix}Lorem${symbol.postfix}`
      )

      // Verify 'Lorem' is selected
      const selection = await getSelection(page)
      expect(selection).toBe('Lorem')
    })
  }
})

test.describe('Always auto-pair symbols', () => {
  // Define the symbols that should be auto-paired
  const autoPairSymbols = [
    { name: 'square brackets', prefix: '[', postfix: ']' },
    { name: 'curly brackets', prefix: '{', postfix: '}' },
    { name: 'parentheses', prefix: '(', postfix: ')' },
    // { name: 'angle brackets', prefix: '<', postfix: '>' },
    { name: 'backtick', prefix: '`', postfix: '`' },
    // { name: 'single quote', prefix: "'", postfix: "'" },
    // { name: 'double quote', prefix: '"', postfix: '"' },
  ]

  for (const symbol of autoPairSymbols) {
    test(`${symbol.name} auto-pairing`, async ({ page }) => {
      await createRandomPage(page)

      // Type prefix and check that the postfix is automatically added
      page.type('textarea >> nth=0', symbol.prefix, { delay: STD_DELAY })
      await expect(page.locator('textarea >> nth=0')).toHaveText(
        `${symbol.prefix}${symbol.postfix}`
      )

      // Check that the cursor is positioned correctly between the prefix and postfix
      const CursorPos = await getCursorPos(page)
      expect(CursorPos).toBe(symbol.prefix.length)
    })
  }
})
