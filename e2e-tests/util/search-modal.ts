import { Page, Locator, ElementHandle } from '@playwright/test'
import { randomString } from './basic'

export async function closeSearchBox(page: Page): Promise<void> {
    await page.keyboard.press("Escape") // escape (potential) search box typing
    await page.waitForTimeout(500)
    await page.keyboard.press("Escape") // escape modal
}

export async function createRandomPage(page: Page) {
    const randomTitle = randomString(20)
    await closeSearchBox(page)
    // Click #search-button
    await page.click('#search-button')
    // Fill [placeholder="Search or create page"]
    await page.fill('[placeholder="Search or create page"]', randomTitle)
    // Click text=/.*New page: "new page".*/
    await page.click('text=/.*New page:".*/')
    // Wait for h1 to be from our new page
    await page.waitForSelector(`h1 >> text="${randomTitle}"`, { state: 'visible' })
    // wait for textarea of first block
    await page.waitForSelector('textarea >> nth=0', { state: 'visible' })

    return randomTitle;
}

export async function createPage(page: Page, page_name: string) {// Click #search-button
    await closeSearchBox(page)
    await page.click('#search-button')
    // Fill [placeholder="Search or create page"]
    await page.fill('[placeholder="Search or create page"]', page_name)
    // Click text=/.*New page: "new page".*/
    await page.click('text=/.*New page:".*/')
    // wait for textarea of first block
    await page.waitForSelector('textarea >> nth=0', { state: 'visible' })

    return page_name;
  }

export async function searchAndJumpToPage(page: Page, pageTitle: string) {
    await closeSearchBox(page)
    await page.click('#search-button')
    await page.type('[placeholder="Search or create page"]', pageTitle)
    await page.waitForSelector(`[data-page-ref="${pageTitle}"]`, { state: 'visible' })
    page.click(`[data-page-ref="${pageTitle}"]`)
    await page.waitForNavigation()
    return pageTitle;
}

/**
 * type a search query into the search box
 * stop at the point where search box shows up
 *
 * @param page the pw page object
 * @param query the search query to type into the search box
 * @returns the HTML element for the search results ui
 */
export async function searchPage(page: Page, query: string): Promise<ElementHandle<SVGElement | HTMLElement>[]>{
    await closeSearchBox(page)
    await page.click('#search-button')
    await page.waitForSelector('[placeholder="Search or create page"]')
    await page.fill('[placeholder="Search or create page"]', query)
    await page.waitForTimeout(2000) // wait longer for search contents to render

    return page.$$('#ui__ac-inner>div');
}
