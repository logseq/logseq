import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, enterNextBlock, modKey, editNthBlock, moveCursorToBeginning, moveCursorToEnd } from './utils'
import { dispatch_kb_events } from './util/keyboard-events'

// Create a random page with some pre-defined blocks
// - a
// - b
//   id:: UUID
// - ((id))
async function setUpBlocks(page, block) {
  await createRandomPage(page)

  await block.mustFill('a')
  await block.enterNext()
  await block.mustFill('b')
  await page.keyboard.press(modKey + '+c')
  await page.waitForTimeout(100)
  await block.enterNext()
  await page.keyboard.press(modKey + '+v')
  await page.waitForTimeout(100)
}

test('backspace at the beginning of a refed block #9406', async ({ page, block }) => {
  await setUpBlocks(page, block)
  await editNthBlock(page, 1)
  await moveCursorToBeginning(page)
  await page.keyboard.press('Backspace')
  await expect(page.locator('textarea >> nth=0')).toHaveText("ab")
  await expect(await block.selectionStart()).toEqual(1)
  await expect(page.locator('.block-ref >> text="ab"')).toHaveCount(1);
})

test('delete at the end of a prev block before a refed block #9406', async ({ page, block }) => {
  await setUpBlocks(page, block)
  await editNthBlock(page, 0)
  await moveCursorToEnd(page)
  await page.keyboard.press('Delete')
  await expect(page.locator('textarea >> nth=0')).toHaveText("ab")
  await expect(await block.selectionStart()).toEqual(1)
  await expect(page.locator('.block-ref >> text="ab"')).toHaveCount(1);
})

test('delete selected blocks, block ref should be replaced by content #9406', async ({ page, block }) => {
  await setUpBlocks(page, block)
  await editNthBlock(page, 0)
  await page.waitForTimeout(100)
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.up('Shift')
  await block.waitForSelectedBlocks(2)
  await page.keyboard.press('Backspace')
  await expect(page.locator('.ls-block')).toHaveCount(1)
  await editNthBlock(page, 0)
  await expect(page.locator('textarea >> nth=0')).toHaveText("b")
})

test('delete and undo #9406', async ({ page, block }) => {
  await setUpBlocks(page, block)
  await editNthBlock(page, 0)
  await page.waitForTimeout(100)
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.up('Shift')
  await block.waitForSelectedBlocks(2)
  await page.keyboard.press('Backspace')
  await expect(page.locator('.ls-block')).toHaveCount(1)
  await page.keyboard.press(modKey + '+z')
  await page.waitForTimeout(100)
  await expect(page.locator('.ls-block')).toHaveCount(3)
  await expect(page.locator('.block-ref >> text="b"')).toHaveCount(1);
})
