import { Page, Locator } from 'playwright'
import { expect } from '@playwright/test'
import process from 'process'

export const IsMac = process.platform === 'darwin'
export const IsLinux = process.platform === 'linux'
export const IsWindows = process.platform === 'win32'

export function randomString(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export async function createRandomPage(page: Page) {
  const randomTitle = randomString(20)

  // Click #search-button
  await page.click('#search-button')
  // Fill [placeholder="Search or create page"]
  await page.fill('[placeholder="Search or create page"]', randomTitle)
  // Click text=/.*New page: "new page".*/
  await page.click('text=/.*New page: ".*/')
  // wait for textarea of first block
  await page.waitForSelector(':nth-match(textarea, 1)', { state: 'visible' })

  return randomTitle;
}

export async function createPage(page: Page, page_name: string) {// Click #search-button
  await page.click('#search-button')
  // Fill [placeholder="Search or create page"]
  await page.fill('[placeholder="Search or create page"]', page_name)
  // Click text=/.*New page: "new page".*/
  await page.click('text=/.*New page: ".*/')
  // wait for textarea of first block
  await page.waitForSelector(':nth-match(textarea, 1)', { state: 'visible' })

  return page_name;
}


export async function searchAndJumpToPage(page: Page, pageTitle: string) {
  await page.click('#search-button')
  await page.fill('[placeholder="Search or create page"]', pageTitle)
  await page.waitForSelector(`[data-page-ref="${pageTitle}"]`, { state: 'visible' })
  await page.click(`[data-page-ref="${pageTitle}"]`)
  return pageTitle;
}

/**
* Locate the last block in the inner editor
* @param page The Playwright Page object.
* @returns The locator of the last block.
*/
export async function lastInnerBlock(page: Page): Promise<Locator> {
  // discard any popups
  await page.keyboard.press('Escape')
  // click last block
  await page.waitForSelector('.page-blocks-inner .ls-block >> nth=-1')
  await page.click('.page-blocks-inner .ls-block >> nth=-1')
  // wait for textarea
  await page.waitForSelector(':nth-match(textarea, 1)', { state: 'visible' })
  return page.locator(':nth-match(textarea, 1)')
}

export async function lastBlock(page: Page): Promise<Locator> {
  // discard any popups
  await page.keyboard.press('Escape')
  // click last block
  await page.click('.ls-block >> nth=-1')
  // wait for textarea
  await page.waitForSelector(':nth-match(textarea, 1)', { state: 'visible' })

  return page.locator(':nth-match(textarea, 1)')
}

/**
* Create and locate a new block at the end of the inner editor
* @param page The Playwright Page object
* @returns The locator of the last block
*/
export async function newInnerBlock(page: Page): Promise<Locator> {
  await lastInnerBlock(page)
  await page.press(':nth-match(textarea, 1)', 'Enter')

  return page.locator(':nth-match(textarea, 1)')
}

export async function newBlock(page: Page): Promise<Locator> {
  await lastBlock(page)
  await page.press(':nth-match(textarea, 1)', 'Enter')

  return page.locator(':nth-match(textarea, 1)')
}

export async function escapeToCodeEditor(page: Page): Promise<void> {
  await page.press('.block-editor textarea', 'Escape')
  await page.waitForSelector('.CodeMirror pre', { state: 'visible' })

  await page.waitForTimeout(300)
  await page.click('.CodeMirror pre')
  await page.waitForTimeout(300)

  await page.waitForSelector('.CodeMirror textarea', { state: 'visible' })
}

export async function escapeToBlockEditor(page: Page): Promise<void> {
  await page.waitForTimeout(300)
  await page.click('.CodeMirror pre')
  await page.waitForTimeout(300)

  await page.press('.CodeMirror textarea', 'Escape')
  await page.waitForTimeout(300)
}

export async function setMockedOpenDirPath(
  page: Page,
  path?: string
): Promise<void> {
  // set next open directory
  await page.evaluate(
    ([path]) => {
      Object.assign(window, {
        __MOCKED_OPEN_DIR_PATH__: path,
      })
    },
    [path]
  )
}

export async function loadLocalGraph(page: Page, path?: string): Promise<void> {
  await setMockedOpenDirPath(page, path);

  await page.click('#left-menu.button')
  const hasOpenButton = await page.$('#head >> .button >> text=Open')

  if (hasOpenButton) {
    await page.click('#head >> .button >> text=Open')
  } else {
    let sidebar = page.locator('#left-sidebar')
    if (!/is-open/.test(await sidebar.getAttribute('class'))) {
      await page.click('#left-menu.button')
      expect(await sidebar.getAttribute('class')).toMatch(/is-open/)
    }

    await page.click('#left-sidebar #repo-switch');
    await page.waitForSelector('#left-sidebar .dropdown-wrapper >> text="Add new graph"', { state: 'visible' })

    await page.click('text=Add new graph')
    await page.waitForSelector('h1:has-text("Open a local directory")', { state: 'visible' })
    await page.click('h1:has-text("Open a local directory")')
  }

  setMockedOpenDirPath(page, ''); // reset it

  await page.waitForSelector(':has-text("Parsing files")', {
    state: 'hidden',
    timeout: 1000 * 60 * 5,
  })

  await page.waitForFunction('window.document.title != "Loading"')

  console.log('Graph loaded for ' + path)
}

export async function activateNewPage(page: Page) {
  await page.click('.ls-block >> nth=0')
  await page.waitForTimeout(500)
}
