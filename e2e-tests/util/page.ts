import { Page } from '@playwright/test'

export async function activateNewPage(page: Page) {
  await page.click('.ls-block >> nth=0')
  await page.waitForTimeout(500)
}

export async function renamePage(page: Page, new_name: string) {
  await page.click('.ls-page-title .page-title')
  await page.waitForSelector('input[type="text"]')
  await page.fill('input[type="text"]', '')
  await page.type('.title input', new_name)
  await page.keyboard.press('Enter')
  await page.click('.ui__confirm-modal button')
}
