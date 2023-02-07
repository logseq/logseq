import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, enterNextBlock, editFirstBlock } from './utils'

test('set heading to 1 using context menu', async ({ page }) => {
    await createRandomPage(page)

    await page.type('textarea >> nth=0', 'foo')

    await enterNextBlock(page)

    await page.locator('span.bullet-container >> nth=0').click({button: "right"})

    await page.locator('#custom-context-menu .to-heading-button[title="Heading 1"]').click()

    expect(await page.locator('.ls-block .block-content >> nth=0').innerHTML()).toContain('<h1>foo</h1>')
})

test('set heading to 2 using context menu', async ({ page }) => {
  await page.locator('span.bullet-container >> nth=0').click({button: "right"})

  await page.locator('#custom-context-menu .to-heading-button[title="Heading 2"]').click()

  expect(await page.locator('.ls-block .block-content >> nth=0').innerHTML()).toContain('<h2>foo</h2>')
})

test('set heading to auto using context menu', async ({ page }) => {
  await page.locator('span.bullet-container >> nth=0').click({button: "right"})

  await page.locator('#custom-context-menu .to-heading-button[title="Auto heading"]').click()

  expect(await page.locator('.ls-block .block-content >> nth=0').innerHTML()).toContain('<h2>foo</h2>')
})

test('remove heading using context menu', async ({ page }) => {
  await page.locator('span.bullet-container >> nth=0').click({button: "right"})

  await page.locator('#custom-context-menu .to-heading-button[title="Remove heading"]').click()

  expect(await page.locator('.ls-block .block-content >> nth=0').innerHTML()).toContain('foo')
})
