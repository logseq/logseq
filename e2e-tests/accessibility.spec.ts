import { injectAxe, checkA11y } from 'axe-playwright'
import { test } from './fixtures'
import { createRandomPage } from './utils'


test('check a11y for the whole page', async ({ page }) => {
    await page.waitForTimeout(2000) // wait for everything be ready
    await injectAxe(page)
    await page.waitForTimeout(2000) // wait for everything be ready
    await createRandomPage(page)
    await page.waitForTimeout(2000) // wait for everything be ready
    await checkA11y(page, null, {
        detailedReport: true,
    })
})
