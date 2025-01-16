import { test } from './fixtures'
import { expect } from '@playwright/test'
import { callPageAPI } from './utils'
import { Page } from 'playwright'

async function createDBGraph(page: Page) {
  await page.locator(`#left-sidebar .cp__graphs-selector > a`).click()
  await page.click('text="Create db graph"')
  await page.waitForSelector('.new-graph')
  const name = `e2e-db-${Date.now()}`
  await page.waitForTimeout(100)
  await page.keyboard.type(name)
  await page.locator('.new-graph > .ui__button').click()
  return name
}

test.skip('test db graph', async ({ page }) => {
  const name = await createDBGraph(page)
  await page.waitForSelector(`a[title="logseq_db_${name}"]`)

  await page.pause()
})

test('(File graph): block related apis',
  async ({ page }) => {
    const callAPI = callPageAPI.bind(null, page)

    const bPageName = 'block-test-page'
    await callAPI('create_page', bPageName, null, { createFirstBlock: false })
    await callAPI('create_page', bPageName, null, { createFirstBlock: false })
    await page.waitForSelector(`body[data-page="${bPageName}"]`)

    let p = await callAPI('get_current_page')
    const bp = await callAPI('append_block_in_page', bPageName, 'tests')

    expect(p.name).toBe(bPageName)

    p = await callAPI('get_page', bPageName)

    expect(p.name).toBe(bPageName)

    await callAPI('edit_block', bp.uuid)

    const b = (await callAPI('get_current_block'))
    expect(Object.keys(b)).toContain('uuid')

    await page.waitForSelector('.block-editor > textarea')
    await page.locator('.block-editor > textarea').fill('')
    const content = 'test api'
    await page.type('.block-editor > textarea', content)

    const editingContent = await callAPI('get_editing_block_content')
    expect(editingContent).toBe(content)

    // create
    let b1 = await callAPI('insert_block', b.uuid, content)
    b1 = await callAPI('get_block', b1.uuid)

    expect(b1.parent.id).toBe(b.id)

    // update
    const content1 = content + '+ update!'
    await callAPI('update_block', b1.uuid, content1)
    b1 = await callAPI('get_block', b1.uuid)

    expect(b1.content).toBe(content1)

    // remove
    await callAPI('remove_block', b1.uuid)
    b1 = await callAPI('get_block', b1.uuid)

    expect(b1).toBeNull()

    // traverse
    b1 = await callAPI('insert_block', b.uuid, content1, { sibling: true })
    const nb = await callAPI('get_next_sibling_block', b.uuid)
    const pb = await callAPI('get_previous_sibling_block', b1.uuid)

    expect(nb.uuid).toBe(b1.uuid)
    expect(pb.uuid).toBe(b.uuid)

    // move
    await callAPI('move_block', b.uuid, b1.uuid)
    const mb = await callAPI('get_next_sibling_block', b1.uuid)

    expect(mb.uuid).toBe(b.uuid)

    // properties
    // FIXME: redundant api call
    await callAPI('upsert_block_property', b1.uuid, 'a')
    await callAPI('upsert_block_property', b1.uuid, 'a', 1)
    let prop1 = await callAPI('get_block_property', b1.uuid, 'a')

    expect(prop1).toBe(1)

    await callAPI('upsert_block_property', b1.uuid, 'a', 2)
    prop1 = await callAPI('get_block_property', b1.uuid, 'a')

    expect(prop1).toBe(2)

    await callAPI('remove_block_property', b1.uuid, 'a')
    prop1 = await callAPI('get_block_property', b1.uuid, 'a')

    expect(prop1).toBeNull()

    await callAPI('upsert_block_property', b1.uuid, 'a', 1)
    await callAPI('upsert_block_property', b1.uuid, 'b', 1)

    prop1 = await callAPI('get_block_properties', b1.uuid)

    expect(prop1).toEqual({ a: 1, b: 1 })

    // await page.pause()
  })

test('(DB graph): block related apis',
  async ({ page }) => {
    const name = await createDBGraph(page)
    await page.waitForSelector(`a[title="logseq_db_${name}"]`)

    const callAPI = callPageAPI.bind(null, page)

    const bPageName = 'block-test-page'
    await callAPI('create_page', bPageName, null, { createFirstBlock: false })
    await callAPI('create_page', bPageName, null, { createFirstBlock: false })
    await page.waitForSelector(`body[data-page="${bPageName}"]`)

    let p = await callAPI('get_current_page')
    const bp = await callAPI('append_block_in_page', bPageName, 'tests')

    expect(p.name).toBe(bPageName)

    p = await callAPI('get_page', bPageName)

    expect(p.name).toBe(bPageName)

    await callAPI('edit_block', bp.uuid)

    const b = (await callAPI('get_current_block'))
    expect(Object.keys(b)).toContain('uuid')

    await page.waitForSelector('.block-editor > textarea')
    await page.locator('.block-editor > textarea').fill('')
    const content = 'test api'
    await page.type('.block-editor > textarea', content)

    const editingContent = await callAPI('get_editing_block_content')
    expect(editingContent).toBe(content)

    // create
    let b1 = await callAPI('insert_block', b.uuid, content)
    b1 = await callAPI('get_block', b1.uuid)

    expect(b1.parent.id).toBe(b.id)

    // update
    const content1 = content + '+ update!'
    await callAPI('update_block', b1.uuid, content1)
    b1 = await callAPI('get_block', b1.uuid)

    expect(b1.content).toBe(content1)

    // remove
    await callAPI('remove_block', b1.uuid)
    b1 = await callAPI('get_block', b1.uuid)

    expect(b1).toBeNull()

    // traverse
    b1 = await callAPI('insert_block', b.uuid, content1, { sibling: true })
    const nb = await callAPI('get_next_sibling_block', b.uuid)
    const pb = await callAPI('get_previous_sibling_block', b1.uuid)

    expect(nb.uuid).toBe(b1.uuid)
    expect(pb.uuid).toBe(b.uuid)

    // move
    await callAPI('move_block', b.uuid, b1.uuid)
    const mb = await callAPI('get_next_sibling_block', b1.uuid)

    expect(mb.uuid).toBe(b.uuid)

    // properties
    await callAPI('upsert_block_property', b1.uuid, 'a', 'a')
    let prop1 = await callAPI('get_block_property', b1.uuid, 'a')

    expect(prop1.title).toBe('a')

    await callAPI('upsert_block_property', b1.uuid, 'a', 'b')
    prop1 = await callAPI('get_block_property', b1.uuid, 'a')

    expect(prop1.title).toBe('b')

    await callAPI('remove_block_property', b1.uuid, 'a')
    prop1 = await callAPI('get_block_property', b1.uuid, 'a')

    expect(prop1).toBeNull()

    await callAPI('upsert_block_property', b1.uuid, 'a', 'a')
    await callAPI('upsert_block_property', b1.uuid, 'b', 'b')

    prop1 = await callAPI('get_block_properties', b1.uuid)

    expect(prop1).toEqual({ ':plugin.property/a': 'a', ':plugin.property/b': 'b' })

    // properties entity & schema
    await callAPI('upsert_property', 'p1')
    prop1 = await callAPI('get_property', 'p1')

    expect(prop1.title).toBe('p1')
    expect(prop1.ident).toBe(':plugin.property/p1')

    await callAPI('upsert_property', 'map1', { type: 'map' })
    await callAPI('upsert_block_property', b1.uuid, 'map1', { a: 1 })
    prop1 = await callAPI('get_property', 'map1')
    const b1p = await callAPI('get_block_property', b1.uuid, 'map1')

    expect(prop1.schema.type).toBe('map')
    expect(b1p).toEqual({a: 1})

    // await page.pause()
  })
