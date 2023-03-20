import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createPage, createRandomPage, openLeftSidebar, randomString, searchAndJumpToPage } from './utils'

/***
 * Test side bar features
 ***/

test('favorite item and recent item test', async ({ page }) => {
  await openLeftSidebar(page)
  // add page to fav
  const fav_page_name = await createRandomPage(page)
  let favs = await page.$$('.favorite-item a')
  let previous_fav_count = favs.length
  await page.click('.ui__dropdown-trigger .toolbar-dots-btn')
  await page.locator("text=Add to Favorites").click()
  // click from another page
  const another_page_name = await createRandomPage(page)
  expect(await page.innerText(':nth-match(.favorite-item a, 1)')).toBe(fav_page_name)
  await page.waitForTimeout(500);
  await page.click(":nth-match(.favorite-item, 1)")
  await page.waitForTimeout(500);
  expect(await page.innerText('.page-title .title')).toBe(fav_page_name)

  expect(await page.innerText(':nth-match(.recent-item a, 1)')).toBe(fav_page_name)
  expect(await page.innerText(':nth-match(.recent-item a, 2)')).toBe(another_page_name)

  // remove fav
  await page.click('.ui__dropdown-trigger .toolbar-dots-btn')
  await page.locator("text=Unfavorite page").click()
  await expect(page.locator('.favorite-item a')).toHaveCount(previous_fav_count)

  // click from fav page
  await page.click(':nth-match(.recent-item a, 2)')
  await expect(page.locator('.page-title .title')).toHaveText(another_page_name)
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
  await page.waitForTimeout(500)
  expect(await firstRecent.textContent()).toContain(page1)
  expect(await secondRecent.textContent()).toContain(page2)
})

test('recent file name is displayed correctly #6297', async ({ page }) => {
  const pageName = randomString(5) + "_@#$%^&*()_" + randomString(5)
  await createPage(page, pageName)
  await page.fill('textarea >> nth=0', 'Random Content')

  const firstRecent = page.locator('.nav-content-item.recent li >> nth=0')
  expect(await firstRecent.textContent()).toContain(pageName)
})
