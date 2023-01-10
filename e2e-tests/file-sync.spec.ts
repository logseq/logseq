import { expect } from '@playwright/test'
import { test } from './fixtures'

test('sync login', async ({ page, block, graphDir }) => {
  const graphName = graphDir.substring(graphDir.lastIndexOf('/') + 1)
  console.log(`Using graphDir ${graphDir} ${graphName}`)

  await page.waitForSelector('text=Login')

  await page.evaluate(() => {
    window["frontend"].handler.user.login_with_username_password_e2e(
      process.env.LOGSEQ_SYNC_TEST_ACCOUNT,
      process.env.LOGSEQ_SYNC_TEST_ACCOUNT_PASSWORD,
      process.env.LOGSEQ_SYNC_CLIENT_ID,
      process.env.LOGSEQ_SYNC_CLIENT_SECRET
    )
  })

  // login ok, cloud icon appears
  await page.waitForSelector('.cp__file-sync-indicator a.cloud.off', { timeout: 10000 })
  await page.waitForSelector('text=Skip >> nth=1', { timeout: 10000 })
  await page.click('text=Skip >> nth=1')

  await page.locator('.cp__file-sync-indicator a.cloud.off > .ui__icon').first().click()
  await page.waitForSelector('text=Create remote graph', { timeout: 10000 })
  await page.locator('text=Create remote graph').click();

  await page.waitForSelector('text=Secure this remote graph!', { timeout: 10000 })
  await page.locator('[placeholder="Password"]').fill("Logseq@gh-ci")
  await page.locator('[placeholder="Re-enter the password"]').fill("Logseq@gh-ci")

  await page.waitForSelector('text=Password fields are matching!')

  await page.locator('button:has-text("Submit")').click()

  // fist sync, begin syncing
  // await page.locator('.cp__file-sync-indicator a.cloud.on.queuing').waitFor({ timeout: 10000 })
  // first sync, finished
  await page.waitForSelector('.cp__file-sync-indicator a.cloud.on.idle', { timeout: 20000, state: 'attached' })

  await page.locator('text=Learn about your sync status').waitFor({ timeout: 200000 })
  await page.locator('button:has-text("Got it!")').waitFor({ timeout: 10000 })

  await page.locator('button:has-text("Got it!")').click()
  await page.locator('text=Learn about your sync status').waitFor({ timeout: 2000, state: 'hidden' })

  await block.clickNext()
  await block.mustType("Hello Logseq Sync")

  await page.locator('.cp__file-sync-indicator a.cloud.on.queuing').waitFor({ timeout: 10000, state: 'attached' })

  await page.locator('text=Congrats on your first successful sync!').waitFor({ timeout: 10000 })
  await page.locator('text=Done').waitFor({ timeout: 10000 })
  await page.locator('button:has-text("Done")').click()

  // wait for sync finished
  await page.locator('.cp__file-sync-indicator a.cloud.on.idle').waitFor({ timeout: 30000 })

  // goto "All Graphs"
  await page.locator('#repo-switch').click()
  await page.locator('[aria-label="Navigation menu"] div:has-text("All graphs")').nth(3).click()
  await page.waitForFunction(() => window.location.href.endsWith('/graphs'))

  await page.locator('button:has-text("Refresh")').click()

  // TODO: delete
  await page.locator(`text=${graphName}Remove >> a`).nth(1).click()
  await page.locator(`#graphs >> text=${graphName}`).waitFor({state: 'detached'})

  await page.waitForTimeout(50000)
})
