import { expect } from '@playwright/test'
import { test } from './fixtures'
import { IsMac } from './utils';

if (!IsMac) {
    test('window should not be maximized on first launch', async ({ page, app }) => {
        await expect(page.locator('.window-controls .maximize-toggle.maximize')).toHaveCount(1)
    })

    test('window should be maximized and icon should change on maximize-toggle click', async ({ page }) => {
        await page.click('.window-controls .maximize-toggle.maximize')

        await expect(page.locator('.window-controls .maximize-toggle.restore')).toHaveCount(1)
    })

    test('window should be restored and icon should change on maximize-toggle click', async ({ page }) => {
        await page.click('.window-controls .maximize-toggle.restore')

        await expect(page.locator('.window-controls .maximize-toggle.maximize')).toHaveCount(1)
    })

    test('window controls should be hidden on fullscreen mode', async ({ page }) => {
        // Keyboard press F11 won't work, probably because it's a chromium shortcut (not a document event)
        await page.evaluate(`window.document.body.requestFullscreen()`)

        await expect(page.locator('.window-controls .maximize-toggle')).toHaveCount(0)
    })

    test('window controls should be visible when we exit fullscreen mode', async ({ page }) => {
        await page.click('.window-controls .fullscreen-toggle')

        await expect(page.locator('.window-controls')).toHaveCount(1)
    })
}
