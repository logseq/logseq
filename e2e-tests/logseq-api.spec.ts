import { test } from './fixtures'
import { expect } from '@playwright/test'

test('block related apis',
  async ({ page }) => {
    const callAPI = callPageAPI.bind(null, page)

    const b = (await callAPI('get_current_block'))
    expect(Object.keys(b)).toContain('uuid')

    await callAPI('edit_block', b.uuid)

    await page.waitForSelector('.block-editor > textarea')
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
    await page.waitForTimeout(1000)
    b1 = await callAPI('get_block', b1.uuid)

    expect(b1.content).toBe(content1)

    // remove
    await callAPI('remove_block', b1.uuid)
    await page.waitForTimeout(500)
    b1 = await callAPI('get_block', b1.uuid)

    expect(b1).toBeNull()

    // await page.pause()
  })

/**
 * @param page
 * @param method
 * @param args
 */
export async function callPageAPI(page, method, ...args) {
  return await page.evaluate(([method, args]) => {
    // @ts-ignore
    return window.logseq.api[method]?.(...args)
  }, [method, args])
}
