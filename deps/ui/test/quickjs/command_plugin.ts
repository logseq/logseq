import { logseq, type EditorCommandProgram } from '@logseq/libs'

let activated = 0
let invoked = 0

void logseq.ready(async () => {
  if (++activated !== 1) throw new Error('Repeated activation')
  const register = logseq.Commands.registerEditorCommand
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
