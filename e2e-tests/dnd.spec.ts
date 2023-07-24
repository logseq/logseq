import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, enterNextBlock } from './utils'

/**
 * Drag and Drop tests.
 *
 * When we drag and drop a block, it should always be moved under the target element,
 * unless the targer is the first element of its container. In that case, if we drop
 * it at the top half of the target, it should be moved on top of it.
 */

test('drop "block b" to the upper left area of "block a", which is the first element of a container', async ({ page, block }) => {
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

test('drop "block b" to the bottom left area of "block a", which is the first element of a container', async ({ page, block }) => {
  await createRandomPage(page)

  await page.fill('textarea >> nth=0', 'block a')
  await enterNextBlock(page)

  await page.fill('textarea >> nth=0', 'block b')
  await page.press('textarea >> nth=0', 'Escape')

  const bullet = page.locator('span.bullet-container >> nth=-1')
  const where = page.locator('.ls-block >> nth=0')
  await bullet.dragTo(where, {
    targetPosition: {
      x: 0,
      y: (await where.boundingBox())!.height * 0.75
    }
  })

  await page.keyboard.press('Escape')

  const pageElem = page.locator('.page-blocks-inner')
  await expect(pageElem).toHaveText('block a\nblock b', {useInnerText: true})
})

test('drop "block c" to the upper left area of "block b", which is the second element of a container', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustFill('block a')
  await block.enterNext()

  await block.mustFill('block b')
  await block.enterNext()

  await block.mustFill('block c')
  await block.escapeEditing()

  const bullet = page.locator('span.bullet-container >> nth=-1')
  const where = page.locator('.ls-block >> nth=1')
  await bullet.dragTo(where, {
    targetPosition: {
      x: 0,
      y: 0
    }
  })

  await page.keyboard.press('Escape')

  const pageElem = page.locator('.page-blocks-inner')
  await expect(pageElem).toHaveText('block a\nblock b\nblock c', {useInnerText: true})
})

test('drop "block c" to the bottom left area of "block a", which is the first element of a container', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustFill('block a')
  await block.enterNext()

  await block.mustFill('block b')
  await block.enterNext()

  await block.mustFill('block c')
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
  await expect(pageElem).toHaveText('block c\nblock a\nblock b', {useInnerText: true})
})