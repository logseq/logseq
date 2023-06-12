import { expect } from '@playwright/test'
import { test } from './fixtures'
import { createRandomPage, escapeToCodeEditor, escapeToBlockEditor } from './utils'

/**
 * NOTE: CodeMirror is a complex library that requires a lot of setup to work.
 * This test suite is designed to test the basic functionality of the editor.
 * It is not intended to test the full functionality of CodeMirror.
 * For more information, see: https://codemirror.net/doc/manual.html
 */

// TODO: Fix test that started intermittently failing some time around
// https://github.com/logseq/logseq/pull/9540
test.skip('switch code editing mode', async ({ page }) => {
  await createRandomPage(page)

  // NOTE: ` will trigger auto-pairing in Logseq
  // NOTE: ( will trigger auto-pairing in CodeMirror
  // NOTE: waitForTimeout is needed to ensure that the hotkey handler is finished (shift+enter)
  // NOTE: waitForTimeout is needed to ensure that the CodeMirror editor is fully loaded and unloaded
  // NOTE: multiple textarea elements are existed in the editor, be careful to select the right one

  // code block with 0 line
  await page.type('textarea >> nth=0', '```clojure\n')
  // line number: 1
  await page.waitForSelector('.CodeMirror pre', { state: 'visible' })
  expect(await page.locator('.CodeMirror-gutter-wrapper .CodeMirror-linenumber').innerText()).toBe('1')
  // lang label: clojure
  expect(await page.innerText('.block-body .extensions__code-lang')).toBe('clojure')

  await page.press('.CodeMirror textarea', 'Escape')
  await page.waitForSelector('.CodeMirror pre', { state: 'hidden' })
  expect(await page.inputValue('textarea >> nth=0')).toBe('```clojure\n```')

  await page.waitForTimeout(200)
  await page.press('textarea >> nth=0', 'Escape')
  await page.waitForSelector('.CodeMirror pre', { state: 'visible' })

  // NOTE: must wait here, await loading of CodeMirror editor
  await page.waitForTimeout(200)
  await page.click('.CodeMirror pre')
  await page.waitForTimeout(200)

  await page.type('.CodeMirror textarea', '(+ 1 1')
  await page.press('.CodeMirror textarea', 'Escape')
  await page.waitForSelector('.CodeMirror pre', { state: 'hidden' })
  expect(await page.inputValue('.block-editor textarea')).toBe('```clojure\n(+ 1 1)\n```')

  await page.waitForTimeout(200) // editor unloading
  await page.press('.block-editor textarea', 'Escape')
  await page.waitForTimeout(200) // editor loading
  // click position is estimated to be at the beginning of the first line
  await page.click('.CodeMirror pre', { position: { x: 1, y: 5 } })
  await page.waitForTimeout(200)

  await page.type('.CodeMirror textarea', ';; comment\n\n  \n')

  await page.press('.CodeMirror textarea', 'Escape')
  await page.waitForSelector('.CodeMirror pre', { state: 'hidden' })
  expect(await page.inputValue('.block-editor textarea')).toBe('```clojure\n;; comment\n\n  \n(+ 1 1)\n```')
})


test('convert from block content to code', async ({ page }) => {
  await createRandomPage(page)

  await page.type('.block-editor textarea', '```')
  await page.press('.block-editor textarea', 'Shift+Enter')
  await page.waitForTimeout(200) // wait for hotkey handler
  await page.press('.block-editor textarea', 'Escape')
  await page.waitForSelector('.CodeMirror pre', { state: 'visible' })

  await page.waitForTimeout(500)
  await page.click('.CodeMirror pre')
  await page.waitForTimeout(500)
  expect(await page.locator('.CodeMirror-gutter-wrapper .CodeMirror-linenumber >> nth=-1').innerText()).toBe('1')

  await page.press('.CodeMirror textarea', 'Escape')
  await page.waitForTimeout(500)

  expect(await page.inputValue('.block-editor textarea')).toBe('```\n```')

  // reset block, code block with 1 line
  await page.fill('.block-editor textarea', '```\n\n```')
  await page.waitForTimeout(200) // wait for fill
  await escapeToCodeEditor(page)
  expect(await page.locator('.CodeMirror-gutter-wrapper .CodeMirror-linenumber >> nth=-1').innerText()).toBe('1')
  await escapeToBlockEditor(page)
  expect(await page.inputValue('.block-editor textarea')).toBe('```\n\n```')

  // reset block, code block with 2 line
  await page.fill('.block-editor textarea', '```\n\n\n```')
  await page.waitForTimeout(200)
  await escapeToCodeEditor(page)
  expect(await page.locator('.CodeMirror-gutter-wrapper .CodeMirror-linenumber >> nth=-1').innerText()).toBe('2')
  await escapeToBlockEditor(page)
  expect(await page.inputValue('.block-editor textarea')).toBe('```\n\n\n```')

  await page.fill('.block-editor textarea', '```\n  indented\nsecond line\n\n```')
  await page.waitForTimeout(200)
  await escapeToCodeEditor(page)
  await escapeToBlockEditor(page)
  expect(await page.inputValue('.block-editor textarea')).toBe('```\n  indented\nsecond line\n\n```')

  await page.fill('.block-editor textarea', '```\n  indented\n  indented\n```')
  await page.waitForTimeout(200)
  await escapeToCodeEditor(page)
  await escapeToBlockEditor(page)
  expect(await page.inputValue('.block-editor textarea')).toBe('```\n  indented\n  indented\n```')
})

test('code block mixed input source', async ({ page }) => {
  await createRandomPage(page)

  await page.fill('.block-editor textarea', '```\n  ABC\n```')
  await page.waitForTimeout(500) // wait for fill
  await escapeToCodeEditor(page)
  await page.type('.CodeMirror textarea', '  DEF\nGHI')

  await page.waitForTimeout(500)
  await page.press('.CodeMirror textarea', 'Escape')
  await page.waitForTimeout(500)
  // NOTE: auto-indent is on
  expect(await page.inputValue('.block-editor textarea')).toBe('```\n  ABC  DEF\n  GHI\n```')
})

test('code block with text around', async ({ page }) => {
  await createRandomPage(page)

  await page.fill('.block-editor textarea', 'Heading\n```\n```\nFooter')
  await page.waitForTimeout(200)
  await escapeToCodeEditor(page)
  await page.type('.CodeMirror textarea', 'first\n  second')

  await page.waitForTimeout(500)
  await page.press('.CodeMirror textarea', 'Escape')
  await page.waitForTimeout(500)
  expect(await page.inputValue('.block-editor textarea')).toBe('Heading\n```\nfirst\n  second\n```\nFooter')
})

test('multiple code block', async ({ page }) => {
  await createRandomPage(page)

  // NOTE: the two code blocks are of the same content
  await page.fill('.block-editor textarea', '中文 Heading\n```clojure\n```\nMiddle 🚀\n```clojure\n```\nFooter')
  await page.waitForTimeout(200)

  await page.press('.block-editor textarea', 'Escape')
  await page.waitForSelector('.CodeMirror pre', { state: 'visible' })

  // first
  await page.waitForTimeout(500)
  await page.click('.CodeMirror pre >> nth=0')
  await page.waitForTimeout(500)

  await page.type('.CodeMirror textarea >> nth=0', ':key-test\n', { strict: true })
  await page.waitForTimeout(500)

  await page.press('.CodeMirror textarea >> nth=0', 'Escape')
  await page.waitForTimeout(500)
  expect(await page.inputValue('.block-editor textarea'))
    .toBe('中文 Heading\n```clojure\n:key-test\n\n```\nMiddle 🚀\n```clojure\n```\nFooter')

  // second
  await page.press('.block-editor textarea', 'Escape')
  await page.waitForSelector('.CodeMirror pre', { state: 'visible' })

  await page.waitForTimeout(500)
  await page.click('.CodeMirror >> nth=1 >> pre')
  await page.waitForTimeout(500)

  await page.type('.CodeMirror textarea >> nth=1', '\n  :key-test 日本語\n', { strict: true })
  await page.waitForTimeout(500)

  await page.press('.CodeMirror textarea >> nth=1', 'Escape')
  await page.waitForTimeout(500)
  expect(await page.inputValue('.block-editor textarea'))
    .toBe('中文 Heading\n```clojure\n:key-test\n\n```\nMiddle 🚀\n```clojure\n\n  :key-test 日本語\n\n```\nFooter')
})

test('click outside to exit', async ({ page }) => {
  await createRandomPage(page)

  await page.fill('.block-editor textarea', 'Header ``Click``\n```\n  ABC\n```')
  await page.waitForTimeout(200) // wait for fill
  await escapeToCodeEditor(page)
  await page.type('.CodeMirror textarea', '  DEF\nGHI')

  await page.waitForTimeout(500)
  await page.click('text=Click')
  await page.waitForTimeout(500)
  // NOTE: auto-indent is on
  expect(await page.inputValue('.block-editor textarea')).toBe('Header ``Click``\n```\n  ABC  DEF\n  GHI\n```')
})

test('click language label to exit #3463', async ({ page, block }) => {
  await createRandomPage(page)

  await page.fill('.block-editor textarea', '```cpp\n```')
  await page.waitForTimeout(200)
  await escapeToCodeEditor(page)
  await page.type('.CodeMirror textarea', '#include<iostream>')

  await page.waitForTimeout(500)
  await page.click('text=cpp') // the language label
  await page.waitForTimeout(500)
  expect(await page.inputValue('.block-editor textarea')).toBe('```cpp\n#include<iostream>\n```')
})

test('multi properties with code', async ({ page }) => {
  await createRandomPage(page)

  await page.fill('.block-editor textarea',
    'type:: code\n' +
    '类型:: 代码\n' +
    '```go\n' +
    'if err != nil {\n' +
    '\treturn err\n' +
    '}\n' +
    '```'
  )
  await page.waitForTimeout(200)
  await escapeToCodeEditor(page)

  // first character of code
  await page.click('.CodeMirror pre', { position: { x: 1, y: 5 } })
  await page.waitForTimeout(500)
  await page.type('.CodeMirror textarea', '// Returns nil\n')

  await page.waitForTimeout(500)
  await page.press('.CodeMirror textarea', 'Escape')
  await page.waitForTimeout(500)
  expect(await page.inputValue('.block-editor textarea')).toBe(
    'type:: code\n' +
    '类型:: 代码\n' +
    '```go\n' +
    '// Returns nil\n' +
    'if err != nil {\n' +
    '\treturn err\n' +
    '}\n' +
    '```'
  )
})
