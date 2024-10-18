import { expect } from '@playwright/test'
import { test } from './fixtures'
import {loadLocalE2eTestsPlugin } from './logseq-api.spec'
import { callPageAPI } from './utils'

test.skip('enabled plugin system default', async ({ page }) => {
  const callAPI = callPageAPI.bind(null, page)

  const pluginEnabled = await callAPI('get_state_from_store', 'plugin/enabled')
  await expect(pluginEnabled).toBe(true)

  expect(await page.evaluate(`typeof logseq.api.get_current_graph`))
    .toBe('function')

  const currentGraph = await callAPI('get_current_graph')
  expect(Object.keys(currentGraph)).toEqual(['url', 'name', 'path'])
})

test.skip('play a plugin<logseq-journals-calendar> from the Marketplace', async ({ page }) => {
  await page.keyboard.press('t+p')
  const searchInput = page.locator('.search-ctls .form-input')
  await searchInput.type('journals')

  const pluginCards = page.locator('.cp__plugins-item-card')

  if (await pluginCards.count()) {
    await pluginCards.locator('.ctl .ls-icon-settings').hover()
    await page.locator('text=Uninstall').click()

    const confirmYes = page.locator('button').locator('text=Yes')
    await confirmYes.click()
  }

  // install a plugin from Marketplace
  await page.locator('button').locator('text=Marketplace').click()
  await page.locator('text=Journals calendar')

  await page.locator('.cp__plugins-item-card').first().locator('text=Install').click()
  // wait for the plugin installed
  await page.locator('.cp__plugins-item-card').first().locator('text=Installed')
  await page.locator('a.ui__modal-close').click()

  // toolbar plugins manager
  const pluginFlag = page.locator('.toolbar-plugins-manager-trigger')

  await expect(pluginFlag).toBeVisible()

  await pluginFlag.click()

  await expect(pluginFlag.locator('text=Plugins')).toBeVisible()
  await expect(pluginFlag.locator('text=Settings')).toBeVisible()

  await page.locator('text=goto-today').click()
  await page.locator('body').click()

  const goToToday = page.locator('#logseq-journals-calendar--goto-today').locator('a.button')
  await expect(goToToday).toBeVisible()
  await goToToday.click()

  // TODO: debug
  await expect(page.locator('body[data-page="page"]')).toBeVisible()
})

test(`play a plugin from local`, async ({ page }) => {
  const callAPI = callPageAPI.bind(null, page)
  const _pLoaded = await loadLocalE2eTestsPlugin(page)

  const loc = page.locator('#a-plugin-for-e2e-tests')
  await loc.waitFor({ state: 'visible' })

  await callAPI(`push_state`, 'page', {name: 'contents'})

  const b = await callAPI(`append_block_in_page`, 'Contents', 'target e2e block')

  expect(typeof b?.uuid).toBe('string')
  await expect(page.locator('text=[DB] hook: changed')).toBeVisible()

  // 65a0beee-7e01-4e72-8d38-089d923a63de
  await callAPI(`insert_block`, b.uuid,
    'new custom uuid block', { customUUID: '65a0beee-7e01-4e72-8d38-089d923a63de' })

  await expect(page.locator('text=[DB] hook: block changed')).toBeVisible()

  // await page.waitForSelector('#test-pause')
})

