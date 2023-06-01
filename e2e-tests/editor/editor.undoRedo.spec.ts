import { expect } from '@playwright/test'
import { test } from '../fixtures'
import { createRandomPage, modKey, STD_DELAY } from '../utils'

test('undo and redo after starting an action should not destroy text #6267', async ({
  page,
  block,
}) => {
  await createRandomPage(page)

  // Get one piece of undo state onto the stack
  await block.mustType('text1 ')
  await page.waitForTimeout(STD_DELAY * 5) // Wait for 500ms autosave period to expire

  // Then type more, start an action prompt, and undo
  await page.keyboard.type('text2 ', { delay: STD_DELAY })
  await page.keyboard.type('[[', { delay: STD_DELAY })

  await expect(page.locator(`[data-modal-name="page-search"]`)).toBeVisible()
  await page.keyboard.press(modKey + '+z', { delay: STD_DELAY })

  // Should close the action menu when we undo the action prompt
  await expect(
    page.locator(`[data-modal-name="page-search"]`)
  ).not.toBeVisible()

  // It should undo to the last saved state, and not erase the previous undo action too
  await expect(page.locator('text="text1"')).toHaveCount(1)

  // And it should keep what was undone as a redo action
  await page.keyboard.press(modKey + '+Shift+z')
  await expect(page.locator('text="text1 text2 [[]]"')).toHaveCount(1)
})

test('undo after starting an action should close the action menu #6269', async ({
  page,
  block,
}) => {
  for (const [commandTrigger, modalName] of [
    ['/', 'commands'],
    ['[[', 'page-search'],
  ]) {
    await createRandomPage(page)

    // Open the action modal
    await block.mustType('text1 ', { delay: STD_DELAY })
    await page.keyboard.type(commandTrigger, { delay: STD_DELAY })

    await expect(page.locator(`[data-modal-name="${modalName}"]`)).toBeVisible()

    // Undo, removing "/today", and closing the action modal
    await page.keyboard.press(modKey + '+z', { delay: STD_DELAY })
    await expect(page.locator('text="/today"')).toHaveCount(0)
    await expect(
      page.locator(`[data-modal-name="${modalName}"]`)
    ).not.toBeVisible()
  }
})

test('should keep correct undo and redo seq after indenting or outdenting the block #7615', async ({
  page,
  block,
}) => {
  await createRandomPage(page)

  await block.mustFill('foo')

  await page.keyboard.press('Enter')
  await expect(page.locator('textarea >> nth=0')).toHaveText('')
  await block.indent()
  await block.mustFill('bar')
  await expect(page.locator('textarea >> nth=0')).toHaveText('bar')

  await page.keyboard.press(modKey + '+z')
  // should undo "bar" input
  await expect(page.locator('textarea >> nth=0')).toHaveText('')
  await page.keyboard.press(modKey + '+Shift+z')
  // should redo "bar" input
  await expect(page.locator('textarea >> nth=0')).toHaveText('bar')
  await page.keyboard.press('Shift+Tab')

  await page.keyboard.press('Enter')
  await expect(page.locator('textarea >> nth=0')).toHaveText('')
  // swap input seq
  await block.mustFill('baz')
  await block.indent()

  await page.keyboard.press(modKey + '+z')
  // should undo indention
  await expect(page.locator('textarea >> nth=0')).toHaveText('baz')
  await page.keyboard.press('Shift+Tab')

  await page.keyboard.press('Enter')
  await expect(page.locator('textarea >> nth=0')).toHaveText('')
  // #7615
  await page.keyboard.type('aaa')
  await block.indent()
  await page.keyboard.type(' bbb')
  await expect(page.locator('textarea >> nth=0')).toHaveText('aaa bbb')
  await page.keyboard.press(modKey + '+z')
  await expect(page.locator('textarea >> nth=0')).toHaveText('aaa')
  await page.keyboard.press(modKey + '+z')
  await expect(page.locator('textarea >> nth=0')).toHaveText('aaa')
  await page.keyboard.press(modKey + '+z')
  await expect(page.locator('textarea >> nth=0')).toHaveText('')
  await page.keyboard.press(modKey + '+Shift+z')
  await expect(page.locator('textarea >> nth=0')).toHaveText('aaa')
  await page.keyboard.press(modKey + '+Shift+z')
  await expect(page.locator('textarea >> nth=0')).toHaveText('aaa')
  await page.keyboard.press(modKey + '+Shift+z')
  await expect(page.locator('textarea >> nth=0')).toHaveText('aaa bbb')
})
