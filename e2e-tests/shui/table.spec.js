import { expect } from '@playwright/test'
import fs from 'fs/promises'
import path from 'path'
import { test } from '../fixtures'
import { randomString, editFirstBlock, navigateToStartOfBlock, createRandomPage } from '../utils'

test.setTimeout(60000)

const KEY_DELAY = 100

// The following function assumes that the block is currently in edit mode, 
// and it just enters a simple table
const inputSimpleTable = async (page) => {
  await page.keyboard.type('| Header A | Header B |')
  await page.keyboard.press('Shift+Enter')
  await page.keyboard.type('| A1 | B1 |') 
  await page.keyboard.press('Shift+Enter')
  await page.keyboard.type('| A2 | B2 |')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(KEY_DELAY)
}

// The following function does not assume any state, and will prepend the provided lines to the 
// first block of the document 
const prependPropsToFirstBlock = async (page, block, ...props) => {
  await editFirstBlock(page) 
  await page.waitForTimeout(KEY_DELAY) 
  await navigateToStartOfBlock(page, block)
  await page.waitForTimeout(KEY_DELAY) 

  for (const prop of props) {
    await page.keyboard.type(prop)
    await page.waitForTimeout(KEY_DELAY)
    await page.keyboard.press('Shift+Enter')
    await page.waitForTimeout(KEY_DELAY)
  }

  await page.keyboard.press('Escape')
  await page.waitForTimeout(KEY_DELAY)
}

const setPropInFirstBlock = async (page, block, prop, value) => {
  await editFirstBlock(page)
  await page.waitForTimeout(KEY_DELAY)
  await navigateToStartOfBlock(page, block)
  await page.waitForTimeout(KEY_DELAY)

  const inputValue = await page.inputValue('textarea >> nth=0')

  const match = inputValue.match(new RegExp(`${prop}::(.*)(\n|$)`))

  if (!match) {
    await page.keyboard.press('Shift+Enter')
    await page.waitForTimeout(KEY_DELAY)
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(KEY_DELAY)
    await page.keyboard.type(`${prop}:: ${value}`)
    // await page.waitForTimeout(1000)
    // await page.waitForTimeout(KEY_DELAY)
    // await page.keyboard.type(prop + ':: ' + value)
    // await page.waitForTimeout(1000)
    // await page.keyboard.press('Shift+Enter')
    await page.waitForTimeout(KEY_DELAY)
    await page.keyboard.press('Escape')
    return await page.waitForTimeout(KEY_DELAY)
  }

  const [propLine, propValue, propTernary] = match
  const startIndex = match.index
  const endIndex = startIndex + propLine.length - propTernary.length

  // Go to the of the prop
  for (let i = 0; i < endIndex; i++) {
    await page.keyboard.press('ArrowRight')
  }

  // Delete the value of the prop 
  for (let i = 0; i < propValue.length; i++) {
    await page.keyboard.press('Backspace')
  }

  // Input the new value of the prop
  await page.keyboard.type(" " + value.trim())
  await page.waitForTimeout(KEY_DELAY)
  await page.keyboard.press('Escape')
  return await page.waitForTimeout(KEY_DELAY)
}


test('table can have it\'s version changed via props', async ({ page, block, graphDir }) => {
  const pageTitle = await createRandomPage(page)

  // create a v1 table 
  inputSimpleTable(page)

  // find and confirm existence of first data cell
  await expect(await page.locator('table tbody tr >> nth=0').innerHTML()).toContain('A1</td>')

  // change to a version 2 table
  await setPropInFirstBlock(page, block, 'logseq.table.version', '2')

  // find and confirm existence of first data cell in new format
  await expect(await page.getByTestId('v2-table-container').innerHTML()).toContain('A1</div>')
})

test('table can configure logseq.color::', async ({ page, block, graphDir }) => {
  const pageTitle = await createRandomPage(page)

  // create a v1 table 
  await page.keyboard.type('logseq.table.version:: 2')
  await page.keyboard.press('Shift+Enter')
  await inputSimpleTable(page)

  // check for default general config 
  await expect(await page.getByTestId('v2-table-gradient-accent')).not.toBeVisible()

  await setPropInFirstBlock(page, block, 'logseq.color', 'red')

  // check for gradient accent 
  await expect(await page.getByTestId('v2-table-gradient-accent')).toBeVisible()
})

test('table can configure logseq.table.hover::', async ({ page, block, graphDir }) => {
  const pageTitle = await createRandomPage(page)

  // create a v1 table 
  await page.keyboard.type('logseq.table.version:: 2')
  await page.keyboard.press('Shift+Enter')
  await inputSimpleTable(page)

  await page.waitForTimeout(KEY_DELAY)
  await page.getByText('A1', { exact: true }).hover()
  await expect(await page.getByText('A1', { exact: true }).getAttribute('class')).toContain('bg-[color:var(--ls-quaternary-background-color)]')
  await expect(await page.getByText('B1', { exact: true }).getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')
  await expect(await page.getByText('A2', { exact: true }).getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')
  await expect(await page.getByText('B2', { exact: true }).getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')

  await setPropInFirstBlock(page, block, 'logseq.table.hover', 'row')

  await page.waitForTimeout(KEY_DELAY)
  await page.getByText('A1', { exact: true }).hover()
  await expect(await page.getByText('A1', { exact: true }).getAttribute('class')).toContain('bg-[color:var(--ls-quaternary-background-color)]')
  await expect(await page.getByText('B1', { exact: true }).getAttribute('class')).toContain('bg-[color:var(--ls-tertiary-background-color)]')
  await expect(await page.getByText('A2', { exact: true }).getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')
  await expect(await page.getByText('B2', { exact: true }).getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')

  await setPropInFirstBlock(page, block, 'logseq.table.hover', 'col')

  await page.waitForTimeout(KEY_DELAY)
  await page.getByText('A1', { exact: true }).hover()
  await expect(await page.getByText('A1', { exact: true }).getAttribute('class')).toContain('bg-[color:var(--ls-quaternary-background-color)]')
  await expect(await page.getByText('B1', { exact: true }).getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')
  await expect(await page.getByText('A2', { exact: true }).getAttribute('class')).toContain('bg-[color:var(--ls-tertiary-background-color)]')
  await expect(await page.getByText('B2', { exact: true }).getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')

  await setPropInFirstBlock(page, block, 'logseq.table.hover', 'both')

  await page.waitForTimeout(KEY_DELAY)
  await page.getByText('A1', { exact: true }).hover()
  await expect(await page.getByText('A1', { exact: true }).getAttribute('class')).toContain('bg-[color:var(--ls-quaternary-background-color)]')
  await expect(await page.getByText('B1', { exact: true }).getAttribute('class')).toContain('bg-[color:var(--ls-tertiary-background-color)]')
  await expect(await page.getByText('A2', { exact: true }).getAttribute('class')).toContain('bg-[color:var(--ls-tertiary-background-color)]')
  await expect(await page.getByText('B2', { exact: true }).getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')

  await setPropInFirstBlock(page, block, 'logseq.table.hover', 'none')

  await page.waitForTimeout(KEY_DELAY)
  await page.getByText('A1', { exact: true }).hover()
  await expect(await page.getByText('A1', { exact: true }).getAttribute('class')).not.toContain('bg-[color:var(--ls-quaternary-background-color)]')
  await expect(await page.getByText('B1', { exact: true }).getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')
  await expect(await page.getByText('A2', { exact: true }).getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')
  await expect(await page.getByText('B2', { exact: true }).getAttribute('class')).not.toContain('bg-[color:var(--ls-tertiary-background-color)]')
})

test('table can configure logseq.table.headers', async ({ page, block, graphDir }) => {
  const pageTitle = await createRandomPage(page)

  // create a table
  await page.keyboard.type('logseq.table.version:: 2')
  await page.keyboard.press('Shift+Enter')
  await inputSimpleTable(page)

  // Check none (default)
  await expect(await page.getByText('Header A', { exact: true })).toBeVisible()
  await expect(await page.getByText('Header A', { exact: true }).innerText()).toEqual("Header A")

  // Check none (explicit)
  await setPropInFirstBlock(page, block, 'logseq.table.headers', 'none')
  await expect(await page.getByText('Header A', { exact: true }).innerText()).toEqual("Header A")

  // Check uppercase
  await setPropInFirstBlock(page, block, 'logseq.table.headers', 'uppercase')
  await expect(await page.getByText('Header A', { exact: true }).innerText()).toEqual("HEADER A")

  // Check lowercase
  await setPropInFirstBlock(page, block, 'logseq.table.headers', 'lowercase')
  await expect(await page.getByText('Header A', { exact: true }).innerText()).toEqual("header a")

  // Check capitalize
  await setPropInFirstBlock(page, block, 'logseq.table.headers', 'capitalize')
  await expect(await page.getByText('Header A', { exact: true }).innerText()).toEqual("Header A")

  // Check capitalize-first
  await setPropInFirstBlock(page, block, 'logseq.table.headers', 'capitalize-first')
  await expect(await page.getByText('Header A', { exact: true }).innerText()).toEqual("Header a")
})

test('table can configure logseq.table.borders', async ({ page, block, graphDir }) => {
  const pageTitle = await createRandomPage(page)

  // create a table
  await page.keyboard.type('logseq.table.version:: 2')
  await page.keyboard.press('Shift+Enter')
  await inputSimpleTable(page)

  // Check true (default)
  await expect(await page.getByTestId('v2-table-container')).toHaveCSS("gap", /^[1-9].*/)

  // Check true (explicit)
  await setPropInFirstBlock(page, block, 'logseq.table.borders', 'true')
  await expect(await page.getByTestId('v2-table-container')).toHaveCSS("gap", /^[1-9].*/)

  // Check false
  await setPropInFirstBlock(page, block, 'logseq.table.borders', 'false')
  await expect(await page.getByTestId('v2-table-container')).not.toHaveCSS("gap", /^[1-9].*/)
})

test('table can configure logseq.table.stripes', async ({ page, block, graphDir }) => {
  const pageTitle = await createRandomPage(page)

  // create a table
  await page.keyboard.type('logseq.table.version:: 2')
  await page.keyboard.press('Shift+Enter')
  await inputSimpleTable(page)
  await page.waitForTimeout(KEY_DELAY)

  // Check false (default)
  await expect(await page.getByText('A1', { exact: true }).getAttribute('class')).toContain("bg-[color:var(--ls-primary-background-color)]")
  await expect(await page.getByText('A2', { exact: true }).getAttribute('class')).toContain("bg-[color:var(--ls-primary-background-color)]")

  // Check false (explicit)
  await setPropInFirstBlock(page, block, 'logseq.table.stripes', 'false')
  await expect(await page.getByText('A1', { exact: true }).getAttribute('class')).toContain("bg-[color:var(--ls-primary-background-color)]")
  await expect(await page.getByText('A2', { exact: true }).getAttribute('class')).toContain("bg-[color:var(--ls-primary-background-color)]")

  // Check false
  await setPropInFirstBlock(page, block, 'logseq.table.stripes', 'true')
  await expect(await page.getByText('A1', { exact: true }).getAttribute('class')).toContain("bg-[color:var(--ls-primary-background-color)]")
  await expect(await page.getByText('A2', { exact: true }).getAttribute('class')).toContain("bg-[color:var(--ls-secondary-background-color)]")
})

test('table can configure logseq.table.compact', async ({ page, block, graphDir }) => {
  const pageTitle = await createRandomPage(page)

  // create a table
  await page.keyboard.type('logseq.table.version:: 2')
  await page.keyboard.press('Shift+Enter')
  await inputSimpleTable(page)
  await page.waitForTimeout(KEY_DELAY)

  // Check false (default)
  const defaultClasses = await page.getByText('A1', { exact: true }).getAttribute('class')

  // Check false (explicit)
  await setPropInFirstBlock(page, block, 'logseq.table.compact', 'false')
  const falseClasses = await page.getByText('A1', { exact: true }).getAttribute('class')

  // Check false
  await setPropInFirstBlock(page, block, 'logseq.table.compact', 'true')
  const trueClasses = await page.getByText('A1', { exact: true }).getAttribute('class')

  const getPX = (str) => {
    const match = str.match(/px-\[([0-9\.]*)[a-z]*\]/)
    return match ? parseFloat(match[1]) : null
  }

  await expect(getPX(defaultClasses)).toEqual(getPX(falseClasses))
  await expect(getPX(defaultClasses)).toBeGreaterThan(getPX(trueClasses))
})

test('table can configure logseq.table.cols::', async ({ page, block, graphDir }) => {
  const pageTitle = await createRandomPage(page)

  // create a v1 table 
  await page.keyboard.type('logseq.table.version:: 2')
  await page.keyboard.press('Shift+Enter')
  await inputSimpleTable(page)

  // check for default general config 
  await expect(await page.getByText('A1', { exact: true })).toBeVisible()
  await expect(await page.getByText('B1', { exact: true })).toBeVisible()

  await setPropInFirstBlock(page, block, 'logseq.table.cols', 'Header A, Header B')
  await expect(await page.getByText('A1', { exact: true })).toBeVisible()
  await expect(await page.getByText('B1', { exact: true })).toBeVisible()

  await setPropInFirstBlock(page, block, 'logseq.table.cols', 'Header A')
  await expect(await page.getByText('A1', { exact: true })).toBeVisible()
  await expect(await page.getByText('B1', { exact: true })).not.toBeVisible()

  await setPropInFirstBlock(page, block, 'logseq.table.cols', 'Header B')
  await expect(await page.getByText('A1', { exact: true })).not.toBeVisible()
  await expect(await page.getByText('B1', { exact: true })).toBeVisible()
})
