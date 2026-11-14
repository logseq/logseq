import { logseq, type EditorCommandProgram } from '@logseq/libs'

let activated = 0
let invoked = 0

void logseq.ready(async () => {
  if (++activated !== 1) throw new Error('Repeated activation')
  const register = logseq.Commands.registerEditorCommand
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
