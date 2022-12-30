import { expect } from '@playwright/test'
import { test } from './fixtures'

test('enabled plugin system default', async ({ page }) => {
  const pluginFlag = page.locator('.toolbar-plugins-manager')

  await expect(pluginFlag).toBeVisible()

  await pluginFlag.click()

  await expect(page.locator('text=Plugins')).toBeVisible()
  await expect(page.locator('text=Settings')).toBeVisible()
})