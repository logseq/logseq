import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, editFirstBlock, newInnerBlock } from './utils'

test('set heading to 1 using', async ({ page }) => {
    await createRandomPage(page)

    await page.type('textarea >> nth=0', 'foo')

    await page.keyboard.press('Escape', { delay: 50 })

    await page.locator('span.bullet-container >> nth=0').click({button: "right"})

    await page.locator('#custom-context-menu .to-heading-button[title="Heading 1"]').click()

    await editFirstBlock(page)
    await page.waitForTimeout(500)

    expect(await page.inputValue('textarea >> nth=0')).toBe('# foo')

    await page.keyboard.press('Escape', { delay: 50 })

    expect(await page.locator('.ls-block .block-content >> nth=0').innerHTML()).toContain('<h1>foo</h1>')
})

test('remove heading', async ({ page }) => {
  await page.locator('span.bullet-container >> nth=0').click({button: "right"})

  await page.locator('#custom-context-menu .to-heading-button[title="Remove heading"]').click()

  expect(await page.locator('.ls-block .block-content >> nth=0').innerHTML()).toContain('foo')
})

test('set heading to 2', async ({ page }) => {
  await page.locator('span.bullet-container >> nth=0').click({button: "right"})

  await page.locator('#custom-context-menu .to-heading-button[title="Heading 2"]').click()

  expect(await page.locator('.ls-block .block-content >> nth=0').innerHTML()).toContain('<h2>foo</h2>')
})

test('switch to auto heading', async ({ page }) => {
  await page.locator('span.bullet-container >> nth=0').click({button: "right"})

  await page.locator('#custom-context-menu .to-heading-button[title="Auto heading"]').click()

  await editFirstBlock(page)
  await page.waitForTimeout(500)

  expect(await page.inputValue('textarea >> nth=0')).toBe('foo')

  await page.keyboard.press('Escape', { delay: 50 })

  expect(await page.locator('.ls-block .block-content >> nth=0').innerHTML()).toContain('<h2>foo</h2>')
})

test('set heading of nested block to auto', async ({ page }) => {
  await newInnerBlock(page)
  await page.waitForTimeout(500)

  await page.type('textarea >> nth=0', 'bar')

  await page.keyboard.press("Tab")

  await page.keyboard.press('Escape', { delay: 50 })

  await page.locator('span.bullet-container >> nth=1').click({button: "right"})

  await page.locator('#custom-context-menu .to-heading-button[title="Auto heading"]').click()

  expect(await page.locator('.ls-block .block-content >> nth=1').innerHTML()).toContain('<h3>bar</h3>')
})

test('view nested block on a dedicated page', async ({ page }) => {
  await page.locator('span.bullet-container >> nth=1').click()

  expect(await page.locator('.ls-block .block-content >> nth=0').innerHTML()).toContain('<h1>bar</h1>')
})
