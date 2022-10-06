import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage } from './utils'

test('should not spawn any dialogs', async ({ page, block }) => {
  await createRandomPage(page)

  page.on('dialog', async dialog => {
    expect(false).toBeTruthy()
    await dialog.dismiss()
  })

  await page.keyboard.type('<iframe src="javascript:confirm(1);" />')
  await block.enterNext()

  await page.keyboard.type('<button id="test-xss-button" onclick="confirm(1)">Click me!</button>')
  await block.enterNext()
  await page.click('#test-xss-button')

  expect(true).toBeTruthy()
})
