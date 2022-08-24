import { injectAxe, checkA11y, getViolations, reportViolations } from 'axe-playwright'
import { test } from './fixtures'
import { createRandomPage } from './utils'


test('check a11y for the whole page', async ({ page }) => {
    await injectAxe(page)
    await createRandomPage(page)
    await checkA11y(page, null, {
        detailedReport: true,
    })
})
