import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { chromium } from 'playwright'

const repoRoot = path.resolve(import.meta.dirname, '../../..')
const publishCss = fs.readFileSync(
  path.join(repoRoot, 'deps/publish/src/logseq/publish/publish.css'),
  'utf8')

test('published nested task bullets stay outside the task status row on mobile', async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    deviceScaleFactor: 3,
  })

  try {
    await page.setContent(`
      <!doctype html>
      <html>
        <head>
          <style>${publishCss}</style>
          <style>
            .page { width: 330px; margin: 24px; }
            .property-icon { background: rgb(0, 102, 255); }
          </style>
        </head>
        <body>
          <main class="page">
            <div class="block-children">
              <ul id="tasks" class="blocks">
                <li id="task" class="block"><div id="content" class="block-content"><span id="status" class="positioned-properties block-left"><span class="positioned-property"><span class="property-value"><span class="property-icon ls-icon-Todo"></span></span></span></span><span class="block-text">Refresh the roadmap page on iPhone</span></div></li>
              </ul>
            </div>
          </main>
        </body>
      </html>`)

    const layout = await page.evaluate(() => {
      const list = document.querySelector('#tasks')
      const block = document.querySelector('#task')
      const content = document.querySelector('#content')
      const status = document.querySelector('#status')
      const statusIcon = status.querySelector('.property-icon')
      const before = getComputedStyle(block, '::before')
      const listStyle = getComputedStyle(list)
      const blockRect = block.getBoundingClientRect()
      const contentRect = content.getBoundingClientRect()
      const statusRect = status.getBoundingClientRect()
      const statusIconRect = statusIcon.getBoundingClientRect()
      const markerTop = Number.parseFloat(before.top)
      const markerHeight = Number.parseFloat(before.height)

      return {
        listStyleType: listStyle.listStyleType,
        markerContent: before.content,
        markerLeft: before.left,
        contentLeft: contentRect.left - blockRect.left,
        statusLeft: statusRect.left - blockRect.left,
        markerCenterY: markerTop + markerHeight / 2,
        statusIconCenterY: statusIconRect.top - blockRect.top + statusIconRect.height / 2,
      }
    })

    assert.equal(layout.listStyleType, 'none')
    assert.equal(layout.markerContent, '""')
    assert.equal(layout.markerLeft, '0px')
    assert.ok(
      layout.contentLeft >= 24,
      `expected content to reserve bullet space, got ${layout.contentLeft}`)
    assert.ok(
      layout.statusLeft >= 24,
      `expected status icon to start after bullet space, got ${layout.statusLeft}`)
    assert.ok(
      Math.abs(layout.statusIconCenterY - layout.markerCenterY) <= 1,
      `expected status icon to align with bullet center, got status=${layout.statusIconCenterY} marker=${layout.markerCenterY}`)
  } finally {
    await browser.close()
  }
})
