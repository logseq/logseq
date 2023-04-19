import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, enterNextBlock, lastBlock, modKey } from './utils'
import { dispatch_kb_events } from './util/keyboard-events'
import * as kb_events from './util/keyboard-events'

test('property text deleted on Ctrl+C when its value mixes [[link]] and other text #9100', async ({ page, block }) => {
  await createRandomPage(page)

  await block.mustType('category:: [[A]] and [[B]] test')

  await page.keyboard.press(modKey + '+c', { delay: 10 })

  await expect(page.locator('textarea >> nth=0')).toHaveValue('category:: [[A]] and [[B]] test')
})
