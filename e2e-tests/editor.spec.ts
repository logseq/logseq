import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage } from './utils'

test('hashtag and quare brackets in same line #4178', async ({ page }) => {
    await createRandomPage(page)
  
    await page.type(':nth-match(textarea, 1)', '#foo bar')
    await page.press(':nth-match(textarea, 1)', 'Enter')
    await page.type(':nth-match(textarea, 1)', 'bar [[blah]]')
    for (let i = 0; i < 12; i++) {
      await page.press(':nth-match(textarea, 1)', 'ArrowLeft')
    }
    await page.type(':nth-match(textarea, 1)', ' ')
    await page.press(':nth-match(textarea, 1)', 'ArrowLeft')
  
    await page.type(':nth-match(textarea, 1)', '#')
    await page.waitForSelector('text="Search for a page"', { 'state': 'visible' })
  
    await page.type(':nth-match(textarea, 1)', 'fo')
  
    await page.click('.absolute >> text=' + 'foo')
  
    expect(await page.inputValue(':nth-match(textarea, 1)')).toBe('#foo bar [[blah]]')
  })
  