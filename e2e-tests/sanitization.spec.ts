import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage } from './utils'

test('custom html should not spawn any dialogs', async ({ page, block }) => {
  page.on('dialog', async dialog => {
    expect(false).toBeTruthy()
    await dialog.dismiss()
  })

  await createRandomPage(page)

  await page.keyboard.type('<iframe src="javascript:confirm(1);" />', { delay: 5 })
  await block.enterNext()

  await page.keyboard.type('<button id="test-xss-button" onclick="confirm(1)">Click me!</button>', { delay: 5 })
  await block.enterNext()
  await page.keyboard.type('<details open id="test-xss-toggle" ontoggle="confirm(1)">test</details>', { delay: 5 })
  await block.enterNext()

  await page.click('#test-xss-toggle')
  await page.click('#test-xss-button')

  expect(true).toBeTruthy()
})

test('custom hiccup should not spawn any dialogs', async ({ page, block }) => {
  page.on('dialog', async dialog => {
    expect(false).toBeTruthy()
    await dialog.dismiss()
  })

  await createRandomPage(page)

  await page.keyboard.type('[:iframe {:src "javascript:confirm(1);"}]', { delay: 5 })
  await block.enterNext()

  expect(true).toBeTruthy()
})

test('"is" attribute should be allowed for plugin purposes', async ({ page, block }) => {
  await createRandomPage(page)

  await page.keyboard.type('[:div {:is "custom-element" :id "custom-element-id"}]', { delay: 5 })
  await block.enterNext()

  await expect(page.locator('#custom-element-id')).toHaveAttribute('is', 'custom-element');
})
