import { Page, Locator } from 'playwright'
import { expect, ConsoleMessage } from '@playwright/test'
import * as pathlib from 'path'
import { modKey } from './util/basic'

// TODO: The file should be a facade of utils in the /util folder
// No more additional functions should be added to this file
// Move the functions to the corresponding files in the /util folder
// Criteria: If the same selector is shared in multiple functions, they should be in the same file
export * from './util/basic'
export * from './util/search-modal'
export * from './util/page'

/**
* Locate the last block in the inner editor
* @param page The Playwright Page object.
* @returns The locator of the last block.
*/
export async function lastBlock(page: Page): Promise<Locator> {
  // discard any popups
  await page.keyboard.press('Escape')
  // click last block
  if (await page.locator('text="Click here to edit..."').isVisible()) {
    await page.click('text="Click here to edit..."')
  } else {
    await page.click('.page-blocks-inner .ls-block >> nth=-1')
  }
  // wait for textarea
  await page.waitForSelector('textarea >> nth=0', { state: 'visible' })
  await page.waitForTimeout(100)
  return page.locator('textarea >> nth=0')
}

/**
 * Press Enter and create the next block.
 * @param page The Playwright Page object.
 */
export async function enterNextBlock(page: Page): Promise<Locator> {
  // Move cursor to the end of the editor
  await page.press('textarea >> nth=0', modKey + '+a') // select all
  await page.press('textarea >> nth=0', 'ArrowRight')
  let blockCount = await page.locator('.page-blocks-inner .ls-block').count()
  await page.press('textarea >> nth=0', 'Enter')
  await page.waitForTimeout(10)
  await page.waitForSelector(`.ls-block >> nth=${blockCount} >> textarea`, { state: 'visible' })
  return page.locator('textarea >> nth=0')
}

/**
* Create and locate a new block at the end of the inner editor
* @param page The Playwright Page object
* @returns The locator of the last block
*/
export async function newInnerBlock(page: Page): Promise<Locator> {
  await lastBlock(page)
  await page.press('textarea >> nth=0', 'Enter')

  return page.locator('textarea >> nth=0')
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

export async function openLeftSidebar(page: Page): Promise<void> {
  let sidebar = page.locator('#left-sidebar')

  // Left sidebar is toggled by `is-open` class
  if (!/is-open/.test(await sidebar.getAttribute('class') || '')) {
    await page.click('#left-menu.button')
    await page.waitForTimeout(10)
    await expect(sidebar).toHaveClass(/is-open/)
  }
}

export async function loadLocalGraph(page: Page, path: string): Promise<void> {
  await setMockedOpenDirPath(page, path);

  const onboardingOpenButton = page.locator('strong:has-text("Choose a folder")')

  if (await onboardingOpenButton.isVisible()) {
    await onboardingOpenButton.click()
  } else {
    console.log("No onboarding button, loading file manually")
    let sidebar = page.locator('#left-sidebar')
    if (!/is-open/.test(await sidebar.getAttribute('class') || '')) {
      await page.click('#left-menu.button')
      await expect(sidebar).toHaveClass(/is-open/)
    }

    await page.click('#left-sidebar #repo-switch');
    await page.waitForSelector('#left-sidebar .dropdown-wrapper >> text="Add new graph"',
      { state: 'visible', timeout: 5000 })
    await page.click('text=Add new graph')

    expect(page.locator('#repo-name')).toHaveText(pathlib.basename(path))
  }

  setMockedOpenDirPath(page, ''); // reset it

  await page.waitForSelector(':has-text("Parsing files")', {
    state: 'hidden',
    timeout: 1000 * 60 * 5,
  })

  const title = await page.title()
  if (title === "Import data into Logseq" || title === "Add another repo") {
    await page.click('a.button >> text=Skip')
  }

  await page.waitForFunction('window.document.title === "Logseq"')
  await page.waitForTimeout(500)

  // If there is an error notification from a previous test graph being deleted,
  // close it first so it doesn't cover up the UI
  let n = await page.locator('.notification-close-button').count()
  if (n > 1) {
    await page.locator('button >> text="Clear all"').click()
  } else if (n == 1) {
    await page.locator('.notification-close-button').click()
  }
  await expect(page.locator('.notification-close-button').first()).not.toBeVisible({ timeout: 2000 })

  console.log('Graph loaded for ' + path)
}

export async function editFirstBlock(page: Page) {
  await page.click('.ls-block .block-content >> nth=0')
}

/**
 * Wait for a console message with a given prefix to appear, and return the full text of the message
 * Or reject after a timeout
 *
 * @param page
 * @param prefix - the prefix to look for
 * @param timeout - the timeout in ms
 * @returns the full text of the console message
 */
export async function captureConsoleWithPrefix(page: Page, prefix: string, timeout: number = 3000): Promise<string> {
  return new Promise((resolve, reject) => {
    let console_handler = (msg: ConsoleMessage) => {
      let text = msg.text()
      if (text.startsWith(prefix)) {
        page.removeListener('console', console_handler)
        resolve(text.substring(prefix.length))
      }
    }
    page.on('console', console_handler)
    setTimeout(reject.bind("timeout"), timeout)
  })
}

export async function queryPermission(page: Page, permission: PermissionName): Promise<boolean> {
  // Check if WebAPI clipboard supported
  return await page.evaluate(async (eval_permission: PermissionName): Promise<boolean> => {
    if (typeof navigator.permissions == "undefined")
      return Promise.resolve(false);
    return navigator.permissions.query({
      name: eval_permission
    }).then((result: PermissionStatus): boolean => {
      return (result.state == "granted" || result.state == "prompt")
    })
  }, permission)
}

export async function doesClipboardItemExists(page: Page): Promise<boolean> {
  // Check if WebAPI clipboard supported
  return await page.evaluate((): boolean => {
    return typeof ClipboardItem !== "undefined"
  })
}

export async function getIsWebAPIClipboardSupported(page: Page): Promise<boolean> {
  // @ts-ignore "clipboard-write" is not included in TS's type definition for permissionName
  return await queryPermission(page, "clipboard-write") && await doesClipboardItemExists(page)
}

export async function navigateToStartOfBlock(page: Page, block: Block) {
  const selectionStart = await block.selectionStart()
  for (let i = 0; i < selectionStart; i++) {
    await page.keyboard.press('ArrowLeft')
  }
}

/**
 * Selects a certain length of text in a textarea,
 * starting from a specified number of characters from the end of the text.
 * @param {Page} page - The Page object.
 * @param {number} shiftBackward - The number of characters from the end of the text to start the selection.
 * @param {number} selectionLength - The number of characters to select.
 * @return {Promise<void>} - Promise which resolves when the text selection is done.
 */
export async function selectText(
  page: Page,
  shiftBackward: number,
  selectionLength: number
): Promise<void> {
  // Move to the start of the text to select
  for (let i = 0; i < shiftBackward; i++) {
    await page.keyboard.press('ArrowLeft')
  }

  // Select the text
  await page.keyboard.down('Shift')
  for (let i = 0; i < selectionLength; i++) {
    await page.keyboard.press('ArrowRight')
  }
  await page.keyboard.up('Shift')
}

/**
 * Retrieves the selected text in a textarea.
 * @param {Page} page - The page object.
 * @return {Promise<string | null>} - Promise which resolves to the selected text or null.
 */
export async function getSelection(page: Page): Promise<string | null> {
  const selection = await page.evaluate(() => {
    const textarea = document.querySelector('textarea')
    return textarea?.value.substring(textarea.selectionStart, textarea.selectionEnd) || null
  })

  return selection
}

/**
 * Retrieves the current cursor position in a textarea.
 * @param {Page} page - The page object.
 * @return {Promise<number | null>} - Promise which resolves to the cursor position or null.
 */
export async function getCursorPos(page: Page): Promise<number | null> {
  const cursorPosition = await page.evaluate(() => {
    const textarea = document.querySelector('textarea');
    return textarea ? textarea.selectionStart : null;
  });

  return cursorPosition;
}
