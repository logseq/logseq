import { expect } from '@playwright/test'
import { test } from './fixtures'
import { IsMac } from './utils';

if (!IsMac) {
    test('Window should not be maximized on first launch', async ({ page, app }) => {
        await expect(page.locator('.window-controls .maximize-toggle.maximize')).toHaveCount(1)
    })

    test('Window should be maximized and icon should change on maximize-toggle click', async ({ page }) => {
        await page.click('.window-controls .maximize-toggle.maximize')

        await expect(page.locator('.window-controls .maximize-toggle.restore')).toHaveCount(1)
    })

    test('Window should be restored and icon should change on maximize-toggle click', async ({ page }) => {
        await page.click('.window-controls .maximize-toggle.restore')

        await expect(page.locator('.window-controls .maximize-toggle.maximize')).toHaveCount(1)
    })
}
