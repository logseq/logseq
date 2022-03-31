import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, openLeftSidebar, searchAndJumpToPage } from './utils'

/***
 * Test side bar features
 ***/

test('favorite item and recent item test', async ({ page }) => {
  await openLeftSidebar(page)
  // add page to fav
  const fav_page_name = await createRandomPage(page)
  let favs = await page.$$('.favorite-item a')
  let previous_fav_count = favs.length
  await page.click('.ui__dropdown-trigger')
  await page.click(':nth-match(.ui__dropdown-trigger .dropdown-wrapper a, 1)')
  // click from another page
  const another_page_name = await createRandomPage(page)
  expect(await page.innerText(':nth-match(.favorite-item a, 1)')).toBe('◦' + fav_page_name)
  await page.click(":nth-match(.favorite-item, 1)")
  expect(await page.innerText('.page-title .title')).toBe(fav_page_name)

  expect(await page.innerText(':nth-match(.recent-item a, 1)')).toBe('◦' + fav_page_name)
  expect(await page.innerText(':nth-match(.recent-item a, 2)')).toBe('◦' + another_page_name)

  // remove fav
  await page.click('.ui__dropdown-trigger')
  await page.click(':nth-match(.ui__dropdown-trigger .dropdown-wrapper a, 1)')
  await page.waitForTimeout(1000)
  favs = await page.$$('.favorite-item a')
  expect(favs.length).toEqual(previous_fav_count)

  // click from fav page
  await page.click(':nth-match(.recent-item a, 2)')
  expect(await page.innerText('.page-title .title')).toBe(another_page_name)
})


test('recent is updated #4320', async ({ page }) => {
  const page1 = await createRandomPage(page)
  await page.fill('textarea >> nth=0', 'Random Thought')

  const page2 = await createRandomPage(page)
  await page.fill('textarea >> nth=0', 'Another Random Thought')

  const firstRecent = page.locator('.nav-content-item.recent li >> nth=0')
  expect(await firstRecent.textContent()).toContain(page2)

  const secondRecent = page.locator('.nav-content-item.recent li >> nth=1')
  expect(await secondRecent.textContent()).toContain(page1)

  // then jump back
  await searchAndJumpToPage(page, page1)
  expect(await firstRecent.textContent()).toContain(page1)
  expect(await secondRecent.textContent()).toContain(page2)
})
