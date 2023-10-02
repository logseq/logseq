import { test } from './fixtures'
import { createRandomPage } from './utils'
import { expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await createRandomPage(page)
    await page.waitForTimeout(2000)
    const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(['meta-viewport'])
        .setLegacyMode()
        .analyze()

    expect(accessibilityScanResults.violations).toEqual([]);
})
