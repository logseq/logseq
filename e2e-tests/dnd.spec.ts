import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage } from './utils'

/**
 * Drag and Drop tests.
 *
 * NOTE: x = 30 is an estimation of left position of the drop target.
 */

test('drop to left center', async ({ page }) => {
  await createRandomPage(page)

  await page.fill(':nth-match(textarea, 1)', 'block a')
  await page.press(':nth-match(textarea, 1)', 'Enter')

  await page.fill(':nth-match(textarea, 1)', 'block b')
  await page.press(':nth-match(textarea, 1)', 'Escape')

  const bullet = page.locator('span.bullet-container >> nth=-1')
  const where = page.locator('div.ls-block >> nth=0')
  await bullet.dragTo(where, {
    targetPosition: {
      x: 30,
      y: (await where.boundingBox()).height * 0.5
    }
  })

  expect.soft(await page.locator('div.ls-block >> nth=0').innerText()).toBe("block b")
  expect.soft(await page.locator('div.ls-block >> nth=1').innerText()).toBe("block a")
})


test('drop to upper left', async ({ page }) => {
  await createRandomPage(page)

  await page.fill(':nth-match(textarea, 1)', 'block a')
  await page.press(':nth-match(textarea, 1)', 'Enter')

  await page.fill(':nth-match(textarea, 1)', 'block b')
  await page.press(':nth-match(textarea, 1)', 'Escape')

  const bullet = page.locator('span.bullet-container >> nth=-1')
  const where = page.locator('div.ls-block >> nth=0')
  await bullet.dragTo(where, {
    targetPosition: {
      x: 30,
      y: 5
    }
  })

  expect.soft(await page.locator('div.ls-block >> nth=0').innerText()).toBe("block b")
  expect.soft(await page.locator('div.ls-block >> nth=1').innerText()).toBe("block a")
})

test('drop to bottom left', async ({ page }) => {
  await createRandomPage(page)

  await page.fill(':nth-match(textarea, 1)', 'block a')
  await page.press(':nth-match(textarea, 1)', 'Enter')

  await page.fill(':nth-match(textarea, 1)', 'block b')
  await page.press(':nth-match(textarea, 1)', 'Escape')

  const bullet = page.locator('span.bullet-container >> nth=-1')
  const where = page.locator('div.ls-block >> nth=0')
  await bullet.dragTo(where, {
    targetPosition: {
      x: 30,
      y: (await where.boundingBox()).height * 0.75
    }
  })

  expect.soft(await page.locator('div.ls-block >> nth=0').innerText()).toBe("block a")
  expect.soft(await page.locator('div.ls-block >> nth=1').innerText()).toBe("block b")
})
