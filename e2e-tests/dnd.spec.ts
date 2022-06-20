import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, enterNextBlock } from './utils'

/**
 * Drag and Drop tests.
 *
 * NOTE: x = 30 is an estimation of left position of the drop target.
 */

test('drop to left center', async ({ page }) => {
  await createRandomPage(page)

  await page.fill('textarea >> nth=0', 'block a')
  await enterNextBlock(page)

  await page.fill('textarea >> nth=0', 'block b')
  await page.press('textarea >> nth=0', 'Escape')

  const bullet = page.locator('span.bullet-container >> nth=-1')
  const where = page.locator('.ls-block >> nth=0')
  await bullet.dragTo(where, {
    targetPosition: {
      x: 30,
      y: (await where.boundingBox()).height * 0.5
    }
  })

  await page.keyboard.press('Escape')

  const pageElem = page.locator('.page-blocks-inner')
  await expect(pageElem).toHaveText('block b\nblock a', {useInnerText: true})
})


test('drop to upper left', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustFill('block a')
  await block.enterNext()

  await block.mustFill('block b')
  await block.escapeEditing()

  const bullet = page.locator('span.bullet-container >> nth=-1')
  const where = page.locator('.ls-block >> nth=0')
  await bullet.dragTo(where, {
    targetPosition: {
      x: 0,
      y: 0
    }
  })

  await page.keyboard.press('Escape')

  const pageElem = page.locator('.page-blocks-inner')
  await expect(pageElem).toHaveText('block b\nblock a', {useInnerText: true})
})

test('drop to bottom left', async ({ page }) => {
  await createRandomPage(page)

  await page.fill('textarea >> nth=0', 'block a')
  await enterNextBlock(page)

  await page.fill('textarea >> nth=0', 'block b')
  await page.press('textarea >> nth=0', 'Escape')

  const bullet = page.locator('span.bullet-container >> nth=-1')
  const where = page.locator('.ls-block >> nth=0')
  await bullet.dragTo(where, {
    targetPosition: {
      x: 30,
      y: (await where.boundingBox()).height * 0.75
    }
  })

  await page.keyboard.press('Escape')

  const pageElem = page.locator('.page-blocks-inner')
  await expect(pageElem).toHaveText('block a\nblock b', {useInnerText: true})
})
