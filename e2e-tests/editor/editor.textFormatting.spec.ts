import { expect } from '@playwright/test'
import { test } from '../fixtures'
import {
  createRandomPage,
  modKey,
  getSelection,
  repeatKeyPress,
  moveCursor,
  getCursorPos,
  selectCharacters,
} from '../utils'

test.skip('backspace and cursor position #4897', async ({ page, block }) => {
  await createRandomPage(page)

  // Delete to previous block, and check cursor position, with markup
  await block.mustFill('`012345`')
  await block.enterNext()
  await block.mustType('`abcdef', { toBe: '`abcdef`' }) // "`" auto-completes

  expect(await block.selectionStart()).toBe(7)
  expect(await block.selectionEnd()).toBe(7)

  await repeatKeyPress(page, 'ArrowLeft', 7)

  expect(await block.selectionStart()).toBe(0)

  await page.keyboard.press('Backspace')
  await block.waitForBlocks(1) // wait for delete and re-render
  expect(await block.selectionStart()).toBe(8)
})

test.describe('Text Formatting', () => {
  const formats = [
    { name: 'bold', prefix: '**', postfix: '**', shortcut: modKey + '+b' },
    { name: 'italic', prefix: '*', postfix: '*', shortcut: modKey + '+i' },
    {
      name: 'strikethrough',
      prefix: '~~',
      postfix: '~~',
      shortcut: modKey + '+Shift+s',
    },
    // {
    //   name: 'underline',
    //   prefix: '<u>',
    //   postfix: '</u>',
    //   shortcut: modKey + '+u',
    // },
  ]

  for (const format of formats) {
    test.describe(`${format.name} formatting`, () => {
      test('Applying to an empty selection inserts placeholder formatting and places cursor correctly', async ({
        page,
        block,
      }) => {
        await createRandomPage(page)

        const text = 'Lorem ipsum'
        await block.mustFill(text)

        // move the cursor to the end of Lorem
        await repeatKeyPress(page, 'ArrowLeft', text.length - 'ipsum'.length)
        await page.keyboard.press('Space')

        // Apply formatting
        await page.keyboard.press(format.shortcut)

        await expect(page.locator('textarea >> nth=0')).toHaveText(
          `Lorem ${format.prefix}${format.postfix} ipsum`
        )

        // Verify cursor position
        const cursorPos = await getCursorPos(page)
        expect(cursorPos).toBe(' ipsum'.length + format.prefix.length)
      })

      test('Applying to an entire block encloses the block in formatting and places cursor correctly', async ({
        page,
        block,
      }) => {
        await createRandomPage(page)

        const text = 'Lorem ipsum-dolor sit.'
        await block.mustFill(text)

        // Select the entire block
        await page.keyboard.press(modKey + '+a')

        // Apply formatting
        await page.keyboard.press(format.shortcut)

        await expect(page.locator('textarea >> nth=0')).toHaveText(
          `${format.prefix}${text}${format.postfix}`
        )

        // Verify cursor position
        const cursorPosition = await getCursorPos(page)
        expect(cursorPosition).toBe(format.prefix.length + text.length)
      })

      test('Applying and then removing from a word connected with a special character correctly formats and then reverts', async ({
        page,
        block,
      }) => {
        await createRandomPage(page)

        await block.mustFill('Lorem ipsum-dolor sit.')

        // Select 'ipsum'
        // Move the cursor to the desired position
        await moveCursor(page, -16)

        // Select the desired length of text
        await selectCharacters(page, 5)

        // Apply formatting
        await page.keyboard.press(format.shortcut)

        // Verify that 'ipsum' is formatted
        await expect(page.locator('textarea >> nth=0')).toHaveText(
          `Lorem ${format.prefix}ipsum${format.postfix}-dolor sit.`
        )

        // Re-select 'ipsum'
        // Move the cursor to the desired position
        await moveCursor(page, -5)

        // Select the desired length of text
        await selectCharacters(page, 5)

        // Remove formatting
        await page.keyboard.press(format.shortcut)
        await expect(page.locator('textarea >> nth=0')).toHaveText(
          'Lorem ipsum-dolor sit.'
        )

        // Verify the word 'ipsum' is still selected
        const selection = await getSelection(page)
        expect(selection).toBe('ipsum')
      })
    })
  }
})
