import { logseq, type EditorCommandProgram } from '@logseq/libs'

let activated = 0
let invoked = 0

void logseq.ready(async () => {
  if (++activated !== 1) throw new Error('Repeated activation')
  const register = logseq.Commands.registerEditorCommand
  await register(
    { key: 'delete-special-pages', label: 'Delete special pages' },
    async () => {
      for (const suffix of ['111', '112', '113']) {
        const uuid = `00000000-0000-0000-0000-000000000${suffix}`
        let refused = false
        try {
          await logseq.Editor.deletePage(uuid)
        } catch (error) {
          refused = (error as Error).message.includes('Unsupported')
        }
        if (
          !refused ||
          !(await logseq.DB.datascriptQuery(
            `[:find ?page . :where [?page :block/uuid #uuid "${uuid}"]]`
          ))
        )
          throw new Error(
            'Special page deletion must be refused without data loss'
          )
      }
      return []
    }
  )
  logseq.Commands.registerEditorCommand(
    { key: 'editor-api-v2', label: 'Portable trees and pages' },
    async () => {
      const page = await logseq.Editor.createPage(
        'portable page',
        {},
        {
          customUUID: '00000000-0000-0000-0000-000000000108',
          redirect: false,
        }
      )
      if (!page) throw new Error('Page creation')
      await logseq.Editor.upsertBlockProperty(page.uuid, 'private', 7)
      const existing = await logseq.Editor.createPage('portable page')
      if (existing.uuid !== page.uuid || 'properties' in existing)
        throw new Error('Page reuse must not bypass graph-read authority')
      const first = await logseq.Editor.insertBlock(page.uuid, 'first')
      if (!first) throw new Error('First block')
      const second = await logseq.Editor.insertBlock(first.uuid, 'second', {
        sibling: true,
      })
      const nested = await logseq.Editor.insertBlock(first.uuid, 'nested')
      if (!second || !nested) throw new Error('Nested insertion')
      let tree = await logseq.Editor.getPageBlocksTree(page.uuid)
      if (
        tree.length !== 2 ||
        tree[0]?.uuid !== first.uuid ||
        tree[1]?.uuid !== second.uuid ||
        !JSON.stringify(tree[0]?.children).includes(nested.uuid)
      )
        throw new Error('Page tree shape')
      if (
        (await logseq.Editor.getBlockChildren(first.uuid))[0]?.uuid !==
        nested.uuid
      )
        throw new Error('Direct children')
      await logseq.Editor.updateBlock(second.uuid, 'patched', {
        properties: { score: 9, label: 'initial', flag: true },
      })
      await logseq.Editor.updateBlock(second.uuid, 'patched again', {
        properties: { score: null, label: 'replaced' },
      })
      const properties = await logseq.Editor.getBlockProperties(second.uuid)
      if (
        properties?.[':plugin.property.command-probe/score'] !== undefined ||
        properties?.[':plugin.property.command-probe/label'] !== 'replaced' ||
        properties?.[':plugin.property.command-probe/flag'] !== true
      )
        throw new Error('Property patch merge')
      await logseq.Editor.moveBlock(second.uuid, first.uuid, { before: true })
      tree = await logseq.Editor.getPageBlocksTree(page.id)
      if (tree[0]?.uuid !== second.uuid) throw new Error('Move before')
      await logseq.Editor.moveBlock(second.uuid, first.uuid, { children: true })
      if (
        !(await logseq.Editor.getBlockChildren(first.uuid)).some(
          (block) => block.uuid === second.uuid
        )
      )
        throw new Error('Move into')
      await logseq.Editor.moveBlock(second.uuid, first.uuid)
      tree = await logseq.Editor.getPageBlocksTree(page.uuid)
      if (tree[0]?.uuid !== first.uuid || tree[1]?.uuid !== second.uuid)
        throw new Error('Move after')
      try {
        await logseq.Editor.moveBlock(first.uuid, nested.uuid, {
          children: true,
        })
        throw new Error('Cycle must reject')
      } catch (error) {
        if (!(error instanceof Error) || error.message !== 'Invalid_request')
          throw error
      }
      await logseq.Editor.removeBlock(first.uuid)
      tree = await logseq.Editor.getPageBlocksTree(page.uuid)
      if (tree.length !== 1 || tree[0]?.uuid !== second.uuid)
        throw new Error('Subtree removal')
      if (!(await logseq.Editor.renamePage(page.uuid, 'portable renamed')))
        throw new Error('Page rename')
      if ((await logseq.Editor.getPage('portable renamed'))?.uuid !== page.uuid)
        throw new Error('Rename lookup')
      await logseq.Editor.deletePage('portable renamed')
      if (
        !(await logseq.DB.datascriptQuery(
          '[:find ?page . :where [?page :block/uuid #uuid "00000000-0000-0000-0000-000000000108"] [?page :logseq.property/deleted-at]]'
        ))
      )
        throw new Error('Page deletion')
      for (const action of [
        () => logseq.Editor.removeBlock('00000000-0000-0000-0000-000000000099'),
        () => logseq.Editor.deletePage('00000000-0000-0000-0000-000000000098'),
      ]) {
        try {
          await action()
          throw new Error('Current editor must be protected')
        } catch (error) {
          if (!(error instanceof Error) || error.message !== 'Unsupported')
            throw error
        }
      }
      return []
    }
  )
  await register(
    { key: 'editor-api-v1', label: 'Portable graph editor' },
    async () => {
      const page = await logseq.Editor.getCurrentPage()
      const current = await logseq.Editor.getCurrentBlock()
      if (
        page?.uuid !== '00000000-0000-0000-0000-000000000098' ||
        current?.uuid !== '00000000-0000-0000-0000-000000000099'
      )
        throw new Error('Editor snapshot')
      try {
        await logseq.Editor.updateBlock(current.uuid, 'overwrite buffer')
        throw new Error('Edited block must be protected')
      } catch (error) {
        if (!(error instanceof Error) || error.message !== 'Unsupported')
          throw error
      }
      const created = await logseq.Editor.insertBlock(
        page.uuid,
        'portable seed',
        {
          start: true,
          customUUID: '00000000-0000-0000-0000-000000000107',
        }
      )
      if (
        !created ||
        (await logseq.Editor.getBlock(created.id))?.title !== 'portable seed'
      ) {
        throw new Error('Insert round trip')
      }
      if (
        (await logseq.Editor.getPreviousSiblingBlock(created.uuid)) !== null ||
        (await logseq.Editor.getNextSiblingBlock(created.uuid))?.uuid !==
          current.uuid
      ) {
        throw new Error('First child placement')
      }
      await logseq.Editor.updateBlock(created.id, 'portable updated')
      if (
        (await logseq.Editor.getBlock({ uuid: created.uuid }))?.title !==
        'portable updated'
      ) {
        throw new Error('Update round trip')
      }
      await logseq.Editor.upsertBlockProperty(created.uuid, 'portable-score', 3)
      await logseq.Editor.upsertBlockProperty(created.uuid, 'portable-score', 4)
      const properties = await logseq.Editor.getBlockProperties(created.id)
      if (properties?.[':plugin.property.command-probe/portable-score'] !== 4) {
        throw new Error('Property round trip')
      }
      await logseq.Editor.removeBlockProperty(created.uuid, 'portable-score')
      const removed = await logseq.Editor.getBlockProperties(created.uuid)
      if (
        removed?.[':plugin.property.command-probe/portable-score'] !== undefined
      ) {
        throw new Error('Property removal')
      }
      return []
    }
  )
  await register({ key: 'greet', label: 'Portable greeting' }, async () => {
    const block = await logseq.Editor.getCurrentBlock()
    if (!block || (await logseq.Editor.checkEditing()) !== block.uuid) {
      throw new Error('Editor identity')
    }
    const text = await logseq.Editor.getEditingBlockContent()
    if (text !== '/greet') throw new Error('Trigger erased before callback')
    const titles = await logseq.DB.datascriptQuery<string[]>(
      '[:find [?title ...] :where [?e :block/title ?title]]'
    )
    if (!titles.includes('quickjs command probe'))
      throw new Error('Graph query')
    console.info('command', ++invoked)
    return [{ kind: 'insertText', text: `Hello ${invoked} 🦉` }]
  })
  await register({ key: 'date', label: 'Portable date' }, () => [
    { kind: 'insertText', text: 'Date' },
    { kind: 'showDatePicker' },
  ])
  await register({ key: 'exit', label: 'Portable exit' }, () => [
    { kind: 'exitEditing' },
  ])
  await register({ key: 'empty', label: 'Portable empty' }, () => [])
  await register({ key: 'late', label: 'Late registration' }, async () => {
    await register({ key: 'forbidden', label: 'Forbidden' }, () => [])
    return []
  })
  await register({ key: 'invalid', label: 'Invalid program' }, () => [
    { kind: 'exitEditing' },
    { kind: 'insertText', text: 'not applied' },
  ])
  await register({ key: 'read', label: 'Pending read' }, async () => {
    await logseq.Editor.getCurrentBlock()
    return [{ kind: 'insertText', text: 'late' }]
  })
  await register(
    { key: 'explicit', label: 'Explicit program' },
    (): EditorCommandProgram => [{ kind: 'insertText', text: 'explicit' }]
  )
})
