import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import test, {after} from 'node:test';
import {measureKeymapRecording, assertKeymapRecording, measureRecordingBounds, assertRecordingBounds} from './keymap_record_checks.mjs';
import {measureKeymapSearch, assertKeymapSearch, measureKeymapCategories, assertKeymapCategories} from './keymap_search_checks.mjs';
import {measureSettingsNavigation, assertSettingsNavigation} from './settings_nav_geometry.mjs';
import {measureModalTheme, assertModalTheme, measureKeymapFilterPaint, assertKeymapFilterPaint, measureAccentControls, assertAccentControls, measureThemeAliases, measureSemanticAliases, assertThemeAliases, measureGraphSwitch, assertGraphSwitch} from './theme_surface_checks.mjs';
import {measureSurfaceMotion, assertSurfaceMotion} from './surface_motion_checks.mjs';
import {measureControlHits, assertControlHits} from './overlay_hit_checks.mjs';
import {measurePropertyPicker, assertPropertyPicker} from './property_picker_checks.mjs';
import {measureTransferDialog, assertDialogCloseGeometry, assertExportTypography} from './transfer_dialog_checks.mjs';
import {measureImportView, assertImportView} from './import_view_checks.mjs';
import {measureDockGeometry, assertDockGeometry} from './split_geometry_checks.mjs';
import {measureHelpMenu, assertHelpMenu, measureShortcutHelp, assertShortcutHelp, measureCollapsedShortcutHelp, assertCollapsedShortcutHelp, measureShortcutTableLayout, assertShortcutTableLayout, shortcutHelpDesktopReference} from './shortcut_help_checks.mjs';
import {measureHandbook, assertHandbook, assertHandbookImages, assertHandbookSearch, assertHandbookCleared, handbookDesktopReference, measureHandbookArticle, assertHandbookArticle, handbookIntroductionArticleReference, handbookJournalsArticleReference, measureHandbookSearchPaint, assertHandbookSearchPaint, handbookSearchPaintReference} from './handbook_checks.mjs';
import {measureBugReport, assertBugReport, bugReportDesktopReference, measureClipboardInspector, assertClipboardInspector} from './bug_report_checks.mjs';
import {measureHandbookCategoryContent, assertHandbookCategoryContent, handbookCategoryContentReference} from './handbook_checks.mjs';
import {measureHandbookArticleHeader, assertHandbookArticleHeader, handbookArticleHeaderReference} from './handbook_checks.mjs';

import {measurePageTitleLayout, assertPageTitleLayout} from './page_title_checks.mjs';

const session = 'logseq-ui-regressions';
const origin = process.env.LOGSEQ_UI_TEST_URL || 'http://localhost:3001';
const browser = (...args) => execFileSync('agent-browser', ['--session', session, ...args], {encoding: 'utf8', timeout: 30000}).trim();
const evaluate = source => JSON.parse(browser('eval', source));
const open = () => {
  browser('open', origin);
  browser('wait', '--fn', "document.querySelector('.cp__graphs-selector .item')?.textContent.includes('Demo') === true");
};
const button = name => browser('find', 'role', 'button', 'click', '--name', name, '--exact');
const clickInView = selector => {
  evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`);
  browser('click', selector);
};
const openSettings = () => {
  evaluate("document.dispatchEvent(new CustomEvent('ls:open-dialog',{detail:{name:'settings'}}))");
  browser('wait', '200');
};
after(() => browser('close'));

test('Unchanged built-in titles exit with Escape, Enter and blur', () => {
  open();
  browser('open', `${origin.replace(/#.*$/, '')}#/page/Task`);
  browser('wait', '--fn', "document.querySelector('.ls-page-title .block-title-wrap') !== null");
  for (const key of ['Escape', 'Enter']) {
    browser('click', '.ls-page-title .block-title-wrap');
    browser('wait', '--fn', "document.activeElement === document.querySelector('.ls-page-title .ed-input')");
    browser('press', key);
    browser('wait', '--fn', "document.querySelector('.ls-page-title .editor-wrapper') === null");
  }
  browser('click', '.ls-page-title .block-title-wrap');
  browser('wait', '--fn', "document.activeElement === document.querySelector('.ls-page-title .ed-input')");
  button('More');
  browser('wait', '--fn', "document.querySelector('.ls-page-title .editor-wrapper') === null");
  browser('press', 'Escape');
  browser('wait', '--fn', "document.activeElement?.id === 'toolbar-dots-btn'");
  browser('press', 'Enter');
  browser('wait', '--fn', "document.querySelector('[role=menu]') !== null");
  browser('press', 'Escape');
});

test('Page titles retain block padding and their trailing content edge', () => {
  open();
  browser('find', 'text', 'Journals', 'click', '--exact');
  browser('wait', '--fn', "document.querySelector('.ls-page-title .is-page-title-row') !== null");
  assertPageTitleLayout(evaluate(`(${measurePageTitleLayout.toString()})()`));
  browser('open', `${origin.replace(/#.*$/, '')}#/page/Task`);
  browser('wait', '--fn', "document.querySelector('.page-tabs .ls-view-head') !== null");
  const objects = evaluate(`(${measurePageTitleLayout.toString()})()`);
  assert.notEqual(objects.objectHeadGap, null);
  assertPageTitleLayout(objects);
});

test('Table title actions retain hover and isolate navigation from sidebar opening', () => {
  open();
  const taskUrl = `${origin.replace(/#.*$/, '')}#/page/Task`;
  browser('open', taskUrl);
  browser('wait', '--fn', "document.querySelector('.page-tabs .ls-view-head') !== null");
  if (!evaluate("document.querySelector('.table-block-title') !== null")) {
    button('New node');
    browser('wait', '--fn', "document.querySelector('.table-block-title') !== null");
  }
  const closeSidebar = () => {
    if (evaluate(`document.querySelector('button[aria-label="Close"]') !== null`)) button('Toggle right sidebar');
  };
  closeSidebar();
  const row = evaluate("document.querySelector('.table-block-title').closest('.ls-block').id");
  const uuid = row.replace(/^ls-block-/, '');
  const selector = `[id="${row}"] .table-block-title`;
  browser('hover', selector);
  browser('wait', '--fn', `getComputedStyle(document.querySelector(${JSON.stringify(selector + ' .ls-title-ghosts')})).opacity === '1'`);
  const geometry = evaluate(`(() => {
    const title = document.querySelector(${JSON.stringify(selector)});
    const rect = title.getBoundingClientRect();
    return {height: rect.height, overflow: getComputedStyle(title).overflow,
      buttons: [...title.querySelectorAll('button')].map(button => {
        const bounds = button.getBoundingClientRect();
        return {width: bounds.width, height: bounds.height, top: bounds.top - rect.top};
      })};
  })()`);
  assert.equal(geometry.height, 32);
  assert.equal(geometry.overflow, 'hidden');
  assert.equal(geometry.buttons.length, 2);
  assert.ok(geometry.buttons.every(button => button.width === 24 && button.height === 24 && button.top === 4));
  browser('hover', selector + ' button[aria-label="Open"]');
  assert.equal(evaluate(`getComputedStyle(document.querySelector(${JSON.stringify(selector + ' .ls-title-ghosts')})).opacity`), '1');
  browser('click', selector + ' button[aria-label="Open"]');
  browser('wait', '--fn', `location.hash.startsWith(${JSON.stringify('#/page/' + uuid)})`);
  assert.equal(evaluate(`document.querySelector('button[aria-label="Close"]') !== null`), false,
    'Open must not bubble into the title sidebar action');
  browser('open', taskUrl);
  browser('wait', '--fn', `document.querySelector(${JSON.stringify(selector)}) !== null`);
  const hash = evaluate('location.hash');
  browser('click', selector + ' button[aria-label="Open in sidebar"]');
  browser('wait', '--fn', `document.querySelector('button[aria-label="Close"]') !== null`);
  assert.equal(evaluate('location.hash'), hash, 'Sidebar opening must preserve the main route');
  closeSidebar();
  browser('hover', '#head');
  browser('wait', '--fn', `getComputedStyle(document.querySelector(${JSON.stringify(selector + ' .ls-title-ghosts')})).opacity === '0'`);
});

test('Table titles retain rich editing, cell anchoring and focus after submission', () => {
  open();
  browser('open', `${origin.replace(/#.*$/, '')}#/page/Task`);
  browser('wait', '--fn', "document.querySelector('.page-tabs .ls-view-head') !== null");
  if (!evaluate("document.querySelector('.table-block-title') !== null")) {
    button('New node');
    browser('wait', '--fn', "document.querySelector('.table-block-title') !== null");
  }
  if (evaluate(`document.querySelector('button[aria-label="Close"]') !== null`)) button('Toggle right sidebar');
  const row = evaluate("document.querySelector('.table-block-title').closest('.ls-block').id");
  const selector = `[id="${row}"] .table-block-title`;
  const hash = evaluate('location.hash');
  for (const key of ['Escape', 'Enter']) {
    browser('click', selector);
    browser('wait', '--fn', "document.activeElement === document.querySelector('.ls-table-block .ed-input')");
    const geometry = evaluate(`(() => {
      const title = document.querySelector(${JSON.stringify(selector)});
      const content = document.querySelector('.ls-table-block');
      const popup = document.querySelector('#ls-table-block-editor');
      const editor = content.querySelector('.editor-wrapper');
      const caret = content.querySelector('.ed-caret').getBoundingClientRect();
      const pads = content.querySelectorAll('.ed-pad');
      const end = pads[pads.length - 1].getBoundingClientRect();
      return {top: content.getBoundingClientRect().top - title.getBoundingClientRect().top,
        contentWidth: content.getBoundingClientRect().width,
        editorWidth: editor.getBoundingClientRect().width,
        popupWidth: popup.getBoundingClientRect().width, caretEndGap: caret.left - end.left};
    })()`);
    assert.ok(Math.abs(geometry.top) < 1);
    assert.equal(geometry.contentWidth, 342);
    assert.equal(geometry.editorWidth, 338);
    assert.equal(geometry.popupWidth, 358);
    assert.ok(Math.abs(geometry.caretEndGap) < 1, 'The visible caret must start at the title end');
    browser('press', key);
    browser('wait', '--fn', "document.querySelector('.ls-table-block') === null");
    assert.equal(evaluate('document.activeElement.id'), evaluate(`document.querySelector(${JSON.stringify(selector)}).id`));
    assert.equal(evaluate('location.hash'), hash);
    assert.equal(evaluate(`document.querySelector('button[aria-label="Close"]') !== null`), false);
  }
});

test('Rapid table title replacement persists through immediate Enter and reload', () => {
  open();
  browser('open', `${origin.replace(/#.*$/, '')}#/page/Task`);
  browser('wait', '--fn', "document.querySelector('.page-tabs .ls-view-head') !== null");
  if (!evaluate("document.querySelector('.table-block-title') !== null")) {
    button('New node');
    browser('wait', '--fn', "document.querySelector('.table-block-title') !== null");
  }
  if (evaluate(`document.querySelector('button[aria-label="Close"]') !== null`)) button('Toggle right sidebar');
  const row = evaluate("document.querySelector('.table-block-title').closest('.ls-block').id");
  const uuid = row.replace(/^ls-block-/, '');
  const selector = `[id="${row}"] .table-block-title`;
  const original = evaluate(`(async () => (await logseq.api.get_block(${JSON.stringify(uuid)})).content)()`);
  const replace = text => {
    browser('click', selector);
    browser('wait', '--fn', "document.activeElement === document.querySelector('.ls-table-block .ed-input')");
    browser('press', 'Meta+a');
    browser('keyboard', 'type', text);
    browser('press', 'Enter');
    browser('wait', '--fn', "document.querySelector('.ls-table-block .ed-input') === null");
  };
  try {
    for (const text of ['Rapid submit', 'Rapid café 中文 👋 ' + 'x'.repeat(200)]) {
      replace(text);
      browser('wait', '--fn', `document.querySelector(${JSON.stringify(selector)})?.textContent === ${JSON.stringify(text)}`);
      browser('reload');
      browser('wait', '--fn', `document.querySelector(${JSON.stringify(selector)})?.textContent === ${JSON.stringify(text)}`);
    }
  } finally {
    replace(original);
    browser('wait', '--fn', `(async () => (await logseq.api.get_block(${JSON.stringify(uuid)})).content === ${JSON.stringify(original)})()`);
  }
});

test('Rich title selections cover styled Unicode text across every wrapped row', () => {
  open();
  browser('open', `${origin.replace(/#.*$/, '')}#/page/Task`);
  browser('wait', '--fn', "document.querySelector('.table-block-title') !== null");
  const row = evaluate("document.querySelector('.table-block-title').closest('.ls-block').id");
  const uuid = row.replace(/^ls-block-/, '');
  const selector = `[id="${row}"] .table-block-title`;
  const original = evaluate(`(async () => (await logseq.api.get_block(${JSON.stringify(uuid)})).content)()`);
  browser('click', selector);
  browser('wait', '--fn', "document.activeElement === document.querySelector('.ls-table-block .ed-input')");
  try {
    for (const source of [
      'A **bold title** 汉字 café 👋 with enough words to overflow the entire table column',
      'A `code` ==marked== 汉字 café 👋 with enough words to overflow the entire table column'
    ]) {
      browser('press', 'Meta+a');
      browser('keyboard', 'type', source);
      browser('wait', '--fn', `document.querySelector('.ed-line').textContent.replaceAll(String.fromCharCode(8203), '') === ${JSON.stringify(source)}`);
      browser('press', 'Meta+a');
      browser('wait', '--fn', "document.querySelectorAll('.ed-sel').length > 0");
      const geometry = evaluate(`(() => {
        const editor = document.querySelector('.block-editor').getBoundingClientRect();
        const selected = [...document.querySelectorAll('.ed-sel')].map(n => n.getBoundingClientRect());
        const textRects = [...document.querySelectorAll('.ed-r:not(.ed-pad)')].flatMap(node => {
          const range = document.createRange(); range.selectNodeContents(node);
          return [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0);
        });
        return {
          rows: new Set(textRects.map(r => Math.round(r.top))).size,
          covered: textRects.every(r => selected.some(s =>
            s.left <= r.left + 1 && s.right >= r.right - 1 &&
            s.top <= r.top + 1 && s.bottom >= r.bottom - 1)),
          contained: selected.every(r => r.left >= editor.left - 1 && r.right <= editor.right + 1 &&
            r.top >= editor.top - 1 && r.bottom <= editor.bottom + 1)
        };
      })()`);
      assert.ok(geometry.rows >= 2, 'The selection fixture must really wrap');
      assert.ok(geometry.covered, 'Every selected text fragment must have its own painted coverage');
      assert.ok(geometry.contained, 'Selection backgrounds must stay inside the edited paragraph');
      browser('press', 'ArrowRight');
      browser('wait', '--fn', "document.querySelectorAll('.ed-sel').length === 0");
    }
  } finally {
    browser('press', 'Meta+a');
    browser('keyboard', 'type', original);
    browser('press', 'Enter');
    browser('wait', '--fn', `(async () => (await logseq.api.get_block(${JSON.stringify(uuid)})).content === ${JSON.stringify(original)})()`);
  }
});

test('Pages tag filters keep live multi-selection and restore reference titles', () => {
  open();
  browser('find','text','Pages','click','--exact');
  browser('wait','--fn',"document.querySelector('[id^=vfilter-]') !== null");
  button('Filter');
  browser('click','[role="menu"] button:has-text("Tags")');
  browser('wait','--fn',"document.querySelector('input[placeholder=Tags]') !== null");
  button('Journal');
  assert.equal(evaluate("document.activeElement === document.querySelector('input[placeholder=Tags]')"),true,'row selection returns focus to search');
  browser('find','role','checkbox','click','--name','Page','--exact');
  assert.equal(evaluate("document.activeElement === document.querySelector('input[placeholder=Tags]')"),true,'checkbox selection returns focus to search');
  browser('fill','input[placeholder=Tags]','Journal');
  browser('press','Enter');
  assert.equal(evaluate("document.querySelector('input[placeholder=Tags]').value"),'Journal','selection preserves the query');
  assert.equal(evaluate("document.activeElement === document.querySelector('input[placeholder=Tags]')"),true,'keyboard selection preserves search focus');
  browser('press','Enter');
  assert.equal(evaluate("document.querySelectorAll('.ls-vf-chip').length"),1,'tag values share one filter');
  assert.equal(evaluate("document.querySelector('input[placeholder=Tags]') !== null"),true,'selection keeps the picker open');
  assert.equal(evaluate("document.querySelector('.ls-vf-chip').textContent.includes('Journal') && document.querySelector('.ls-vf-chip').textContent.includes('Page')"),true,'tag titles render immediately');
  browser('press','Escape');browser('reload');
  browser('wait','--fn',"document.querySelector('.ls-vf-chip')?.textContent.includes('Journal') && document.querySelector('.ls-vf-chip')?.textContent.includes('Page')");
  browser('click','[id^=vchip-value-]');
  browser('wait','--fn',"document.querySelector('input[placeholder=Tags]') !== null");
  assert.equal(evaluate("[...document.querySelectorAll('[role=menu] input[type=checkbox]')].filter(input=>input.checked).length"),2,'reopening restores both selected tags');
  assert.equal(evaluate("getComputedStyle(document.querySelector('input[placeholder=Tags]')).paddingLeft"),'12px','existing value search uses the reference inset');
  assert.equal(evaluate("[...document.querySelectorAll('[role=menu] button')].find(button=>button.textContent==='Empty').getBoundingClientRect().height"),28,'Empty uses the shared small-button height');
  for (const name of ['Journal','Page']) browser('find','role','checkbox','click','--name',name,'--exact');
  assert.equal(evaluate("document.querySelectorAll('.ls-vf-chip').length"),1,'editing to an empty set preserves the clause');
  assert.equal(evaluate("document.querySelector('[id^=vchip-value-]').textContent"),'All');
  button('Empty');
  assert.equal(evaluate("document.querySelector('[id^=vchip-value-]').textContent"),'Empty');
  assert.equal(evaluate("document.querySelector('input[placeholder=Tags]') !== null"),true,'Empty keeps the existing-value editor open');
  browser('press','Escape');
  browser('wait','--fn',"document.querySelector('input[placeholder=Tags]') === null");
  const chips=evaluate("[...document.querySelector('.ls-vf-chip').querySelectorAll('button')].map(button=>({height:button.getBoundingClientRect().height,font:getComputedStyle(button).fontSize}))");
  assert.ok(chips.every(control=>control.height===28),'filter controls retain the reference height');
  assert.equal(evaluate("document.querySelector('.ls-vf-chip button[aria-label=Delete]').getBoundingClientRect().width"),26,'Delete retains its compact reference width');
  assert.ok(chips.slice(0,3).every(control=>control.font==='12px'),'filter labels retain the reference typography');
  browser('click','.ls-vf-chip button[aria-label=Delete]');
  browser('wait','--fn',"document.querySelector('.ls-vf-chip') === null");
});

test('Page name filters retain rapid input, persist Unicode and normalize operator changes', () => {
  open();
  browser('find','text','Pages','click','--exact');
  browser('wait','--fn',"document.querySelector('[id^=vfilter-]') !== null");
  button('Filter');
  browser('click','[role=menu] button:has-text("Page name")');
  browser('wait','--fn',"document.querySelector('[id^=vchip-input-]') !== null");
  browser('type','[id^=vchip-input-]','x'.repeat(200));
  assert.equal(evaluate("document.querySelector('[id^=vchip-input-]').value"),'x'.repeat(200));
  browser('fill','[id^=vchip-input-]','café 中文 😀');
  browser('wait','--fn',"[...document.querySelectorAll('button')].some(button=>button.textContent.trim()==='All')");
  browser('reload');
  browser('wait','--fn',"document.querySelector('[id^=vchip-input-]')?.value === 'café 中文 😀'");
  browser('click','[id^=vchip-op-]');
  browser('find','role','menuitem','click','--name','is','--exact');
  browser('wait','--fn',"document.querySelector('[id^=vchip-input-]') === null && document.querySelector('[id^=vchip-value-]')?.textContent === 'All'");
  browser('click','.ls-vf-chip button[aria-label=Delete]');
  browser('wait','--fn',"document.querySelector('.ls-vf-chip') === null");
});

test('Pages value filters open and apply both empty-value actions', () => {
  open();
  browser('find','text','Pages','click','--exact');
  browser('wait','--fn',"document.querySelector('[id^=vfilter-]') !== null");
  for (const action of ['Is Empty','Is Not Empty']) {
    button('Filter');
    browser('click','[role="menu"] button:has-text("Tags")');
    browser('wait','--fn',"document.querySelector('input[placeholder=Tags]') !== null");
    button(action);
    browser('wait','--fn',"document.querySelector('.ls-vf-chip') !== null && document.querySelector('input[placeholder=Tags]') === null");
    browser('click','.ls-vf-chip button[aria-label=Delete]');
    browser('wait','--fn',"document.querySelector('.ls-vf-chip') === null");
  }
});

test('dock resize handles overlay adjacent panes without reserving content width', () => {
  open();
  const measure = () => evaluate(`(${measureDockGeometry.toString()})(document)`);
  for (const name of ['Toggle left sidebar', 'Toggle right sidebar']) {
    const left = name.includes('left');
    if (measure().find(split => split.left === left).closed) button(name);
  }
  browser('wait', '350');
  assertDockGeometry(measure());
  for (const name of ['Toggle right sidebar', 'Toggle left sidebar']) {
    button(name);
    browser('wait', '350');
    assertDockGeometry(measure());
    button(name);
    browser('wait', '350');
  }
  button('Toggle right sidebar');
});

test('Help opens complete shortcut content and reopens collapsed panels', () => {
  browser('set', 'viewport', '1280', '720');
  open();
  button('Toggle help menu');
  assertHelpMenu(evaluate(`(${measureHelpMenu.toString()})(document)`));
  browser('find', 'role', 'button', 'click', '--name', 'Keyboard shortcuts', '--exact');
  browser('wait', '--fn', "document.querySelector('.cp__shortcut-page') !== null");
  assertShortcutHelp(evaluate(`(${measureShortcutHelp.toString()})(document)`));
  browser('wait', '--fn', `document.fonts.status === "loaded" && !!document.querySelector('.cp__shortcut-page .katex') && !!document.querySelector('.cp__shortcut-page pre code[data-highlighted="yes"]')`);
  browser('find', 'text', 'Markdown syntax', 'click', '--exact');
  assertShortcutTableLayout(evaluate(`(${measureShortcutTableLayout.toString()})(document)`), shortcutHelpDesktopReference);
  browser('click', '.item-type-shortcut-settings > div button[aria-label="Keyboard shortcuts"]');
  assertCollapsedShortcutHelp(evaluate(`(${measureCollapsedShortcutHelp.toString()})(document)`));
  button('Toggle right sidebar');
  button('Toggle help menu');
  browser('find', 'role', 'button', 'click', '--name', 'Keyboard shortcuts', '--exact');
  browser('wait', '--fn', "document.querySelectorAll('.item-type-shortcut-settings').length === 1 && !document.querySelector('.cp__right-split.is-collapsed')");
  assertShortcutHelp(evaluate(`(${measureShortcutHelp.toString()})(document)`));
});

test('Handbook preserves dashboard geometry, search focus and published article content', () => {
  browser('set', 'viewport', '1280', '720');
  open();
  button('More');
  browser('find', 'role', 'menuitem', 'click', '--name', 'Appearance', '--exact');
  button('light light');
  button('Logseq classic color');
  browser('press', 'Escape');
  button('Toggle help menu');
  button('Handbook');
  browser('wait', '--fn', "document.querySelector('#handbook-search') !== null && [...document.querySelectorAll('.cp__handbooks-popup img')].length === 2 && [...document.querySelectorAll('.cp__handbooks-popup img')].every(image=>image.complete && image.naturalWidth>0)");
  browser('find', 'role', 'heading', 'click', '--name', 'Help', '--exact');
  const measure = () => evaluate(`(${measureHandbook.toString()})(document)`);
  const actual = measure();
  assertHandbook(actual, handbookDesktopReference);
  assertHandbookSearch(actual, handbookDesktopReference);
  assertHandbookImages(actual, handbookDesktopReference);
  assertHandbookCategoryContent(evaluate(`(${measureHandbookCategoryContent.toString()})(document)`),handbookCategoryContentReference);
  const paint = () => evaluate(`(${measureHandbookSearchPaint.toString()})(document)`);
  browser('click', '#handbook-search');
  assertHandbookSearchPaint(paint(), handbookSearchPaintReference.light.focused);
  browser('fill', '#handbook-search', 'sync');
  browser('press', 'Tab');
  assertHandbookSearchPaint(paint(), {...handbookSearchPaintReference.light.focused,shadows:[]});
  browser('press', 'Enter');
  assertHandbookCleared(measure());
  for (const theme of ['dark','light']) {
    browser('press', 'Tab');
    browser('press', 't');browser('press', 't');
    assertHandbookSearchPaint(paint(), handbookSearchPaintReference[theme].blurred);
    browser('click', '#handbook-search');
    assertHandbookSearchPaint(paint(), handbookSearchPaintReference[theme].focused);
  }
  for (const width of [1,32,63,64,80,1280]) {
    browser('set', 'viewport', String(width), '720');
    browser('wait', '--fn', `Number.parseFloat(document.querySelector('.cp__handbooks-popup').style.width) === ${Math.min(420,Math.max(0,width-64))}`);
    assert.equal(evaluate("document.activeElement === document.querySelector('#handbook-search')"),true,'resize preserves search focus');
  }
  browser('find','role','button','click','--name','The only features you need to get started with Logseq','--exact');
  browser('wait','--fn',"document.querySelectorAll('.cp__handbooks-popup video').length === 2 && [...document.querySelectorAll('.cp__handbooks-popup video')].every(video=>video.readyState>=1)");
  assertHandbookArticle(evaluate(`(${measureHandbookArticle.toString()})(document)`),handbookIntroductionArticleReference);
  assertHandbookArticleHeader(evaluate(`(${measureHandbookArticleHeader.toString()})(document)`),handbookArticleHeaderReference);
  button('Next chapter');
  browser('wait','--fn',"document.querySelector('.cp__handbooks-popup').textContent.includes('Fundamental 1:') && [...document.querySelectorAll('.cp__handbooks-popup video')].every(video=>video.readyState>=1)");
  button('Next chapter');
  browser('wait','--fn',"document.querySelectorAll('.cp__handbooks-popup code').length === 2");
  assertHandbookArticle(evaluate(`(${measureHandbookArticle.toString()})(document)`),handbookJournalsArticleReference);
  browser('press','Escape');
  browser('wait', '--fn', "document.querySelector('#handbook-panel') === null");
  assert.equal(evaluate("document.activeElement === document.querySelector('#help-menu-trigger')"),true,'article dismissal returns to the surviving Help trigger');
  browser('press','Enter');
  browser('wait','--fn',"document.querySelector('.cp__sidebar-help-menu-popup') !== null");
  browser('press','Escape');
  browser('wait','--fn',"document.querySelector('.cp__sidebar-help-menu-popup') === null");
});

test('Help opens the diagnostic page and its resettable clipboard tool', () => {
  browser('set', 'viewport', '1280', '720');
  open();
  const splits=evaluate(`(${measureDockGeometry.toString()})(document)`);
  if (splits.find(split=>split.left).closed) button('Toggle left sidebar');
  if (!splits.find(split=>!split.left).closed) button('Toggle right sidebar');
  button('More');
  browser('find', 'role', 'menuitem', 'click', '--name', 'Appearance', '--exact');
  button('light light');
  button('Logseq classic color');
  browser('press', 'Escape');
  button('Toggle help menu');
  button('Bug report');
  browser('wait', '--fn', "document.querySelector('.cp__bug-report-reporter') !== null");
  assertBugReport(evaluate(`(${measureBugReport.toString()})(document)`),bugReportDesktopReference);
  button('Clipboard helper');
  assertClipboardInspector(evaluate(`(${measureClipboardInspector.toString()})(document)`));
  button('Go back');
  assertBugReport(evaluate(`(${measureBugReport.toString()})(document)`),bugReportDesktopReference);
  button('Clipboard helper');
  browser('reload');
  browser('wait', '--fn', "document.querySelector('#clipboard-inspector-input') !== null");
  assertClipboardInspector(evaluate(`(${measureClipboardInspector.toString()})(document)`));
  button('Go back');
});

test('Import keeps shared typography, theme and option geometry', () => {
  open();
  button('More');
  browser('find', 'role', 'menuitem', 'click', '--name', 'Appearance', '--exact');
  button('light light');
  button('Logseq classic color');
  browser('press', 'Escape');
  button('More');
  browser('find', 'role', 'menuitem', 'click', '--name', 'Import', '--exact');
  browser('wait', '--fn', "document.querySelector('#import-options') !== null");
  assertImportView(evaluate(`(${measureImportView.toString()})(document.querySelector('#importer'))`), {
    text: 'rgb(23, 23, 23)', card: 'rgb(243, 243, 243)', choice: 'rgb(226, 226, 226)',
  });
});

test('export dialog keeps theme typography and card-relative close placement', () => {
  open();
  button('More');
  browser('find', 'role', 'menuitem', 'click', '--name', 'Appearance', '--exact');
  button('light light');
  button('Logseq classic color');
  browser('press', 'Escape');
  button('More');
  browser('find', 'role', 'menuitem', 'click', '--name', 'Export graph', '--exact');
  browser('wait', '--fn', "getComputedStyle(document.querySelector('.ls-dialog-export-graph')).transform === 'matrix(1, 0, 0, 1, 0, 0)'");
  const measurement = evaluate(`(${measureTransferDialog.toString()})(document.querySelector('.ls-dialog-export-graph'))`);
  assertDialogCloseGeometry(measurement);
  assertExportTypography(measurement, {
    title: 'rgb(23, 23, 23)', link: 'rgb(27, 104, 152)', description: 'rgb(67, 63, 56)',
  });
  browser('press', 'Escape');
});

test('graph switch keeps the shared trailing indicator geometry', () => {
  open();
  assertGraphSwitch(evaluate(`(${measureGraphSwitch.toString()})(document.querySelector('.cp__graphs-selector > .item'))`));
});

test('web chrome omits native-only performance controls', () => {
  open();
  assert.equal(evaluate("document.querySelector('[aria-label=\"dialog\"]') === null"), true);
});

test('graph switch focuses its first action so Enter opens graph creation', () => {
  open();
  browser('click', '.cp__graphs-selector > .item');
  browser('wait', '--fn', "document.activeElement?.textContent === 'Create db graph'");
  browser('press', 'Enter');
  browser('wait', '--fn', "document.querySelector('#ls-dialog-title-new-graph') !== null");
  assert.equal(evaluate("document.activeElement?.tagName"), 'INPUT');
  browser('press', 'Escape');
});

test('graph menu Escape returns focus through the popup lifecycle', () => {
  open();
  browser('click', '.cp__graphs-selector > .item');
  browser('wait', '--fn', "document.activeElement?.textContent === 'Create db graph'");
  browser('press', 'Escape');
  browser('wait', '--fn', "document.activeElement === document.querySelector('.cp__graphs-selector > .item')");
  assert.equal(evaluate("document.querySelector('.repos-list[data-open]') === null"), true);
});

test('table property pickers retain shared paint and full-sized rows while filtering', () => {
  open();
  browser('click', '.all-pages-nav .item');
  browser('wait', '--fn', "document.querySelector('[aria-label=\"Select row\"]') !== null");
  browser('click', '[aria-label="Select row"]:first-of-type');
  button('Set property');
  browser('wait', '--fn', "document.querySelector('.ls-property-dialog .lui-list-item') !== null");
  assertPropertyPicker(evaluate(`(${measurePropertyPicker.toString()})()`));
  browser('fill', '.ls-property-dialog input', 'Priority');
  browser('wait', '--fn', "document.querySelector('.ls-property-dialog .lui-list-item')?.textContent === 'Priority'");
  assertPropertyPicker(evaluate(`(${measurePropertyPicker.toString()})()`));
  browser('press', 'Enter');
  browser('wait', '--fn', "document.querySelector('.ls-property-dialog')?.textContent.includes('Urgent') === true");
  browser('press', 'Escape');
  browser('wait', '--fn', "document.querySelector('.ls-property-dialog') === null");
  browser('click', '[aria-label="Select all"]');
});

test('empty overlay chrome passes pointers through after popup and modal dismissal', () => {
  open();
  browser('errors', '--clear');
  if (evaluate("document.querySelector('#left-sidebar').getBoundingClientRect().width") === 0) {
    button('Toggle left sidebar');
  }
  browser('click', '.all-pages-nav .item');
  browser('wait', '--fn', "document.querySelector('[id^=vsort-]') !== null");
  const verify = selector => assertControlHits(evaluate(
    `(${measureControlHits.toString()})(${JSON.stringify(selector)})`,
  ));
  const main = '.view-actions button, .ls-view-tab';
  for (let cycle = 0; cycle < 2; cycle += 1) {
    verify(main);
    button('Sort groups by');
    browser('wait', '--fn', "document.querySelector('.ls-sort-order') !== null");
    verify('.ls-sort-order, .ls-sort-x, .ls-sort-delete');
    browser('click', '.ls-sort-order');
    browser('wait', '--fn', "document.querySelectorAll('.ls-sort-option').length === 2");
    verify('.ls-sort-option');
    browser('press', 'Escape');
    browser('wait', '--fn', "document.querySelector('.ls-sort-option') === null");
    browser('press', 'Escape');
    browser('wait', '--fn', "document.querySelector('.ls-sort-order') === null");
    verify(main);
    openSettings();
    browser('wait', '--fn', "document.querySelector('[role=dialog] button') !== null");
    verify('[role=dialog] button[aria-label=Close]');
    assert.ok(evaluate(`(${measureControlHits.toString()})(${JSON.stringify(main)})`)
      .every(control => !control.receivesPointer), 'The modal must still block background controls');
    button('Close');
    browser('wait', '--fn', "document.querySelector('[role=dialog]') === null");
    verify(main);
  }
  assert.equal(browser('errors'), '');
});

const appendBlock = text => {
  evaluate("document.querySelector('.block-add-button').scrollIntoView({block:'center'})");
  browser('click', '.block-add-button');
  browser('wait', '--fn', "document.querySelector('.ed-input') !== null");
  const uuid = evaluate("document.querySelector('.ed-input').getAttribute('data-block-id')");
  browser('keyboard', 'type', text);
  return uuid;
};

test('sidebar group headings match the reference and collapse their content', () => {
  open();
  if (evaluate("document.querySelector('#left-sidebar').getBoundingClientRect().width") === 0) {
    button('Toggle left sidebar');
  }
  assert.deepEqual(evaluate("[...document.querySelectorAll('#left-sidebar .wrap-th')].map(e => getComputedStyle(e).opacity)"),
    ['0.5', '0.5', '0.5']);
  for (let cycle = 0; cycle < 2; cycle += 1) {
    browser('click', '.sidebar-content-group.recent .hd');
    browser('wait', '--fn', "!document.querySelector('.sidebar-content-group.recent').classList.contains('is-expand')");
    assert.equal(evaluate("document.querySelector('.sidebar-content-group.recent .bd')"), null,
      'Collapsed groups must remove interactive rows, including their keyboard targets');
    browser('click', '.sidebar-content-group.recent .hd');
    browser('wait', '--fn', "document.querySelector('.sidebar-content-group.recent .bd') !== null");
  }
});
const assertExited = () => {
  browser('wait', '250');
  assert.equal(evaluate("document.querySelectorAll('.editor-wrapper').length"), 0);
  assert.equal(evaluate("document.querySelectorAll('#ui__ac,#date-time-picker,.ls-editor-link-form').length"), 0);
};

test('Escape saves the block and exits editing with a slash menu open', () => {
  open();
  const text = 'Escape persistence /dead';
  const uuid = appendBlock(text);
  browser('press', 'Escape');
  assertExited();
  browser('reload');
  browser('wait', '--fn', `document.querySelector('#ls-block-${uuid}') !== null`);
  assert.ok(evaluate(`document.querySelector('#ls-block-${uuid}').textContent`).includes(text));
});

test('outside press saves the block and closes the command menu', () => {
  open();
  const text = 'Outside persistence /sched';
  const uuid = appendBlock(text);
  browser('click', '#head');
  assertExited();
  browser('reload');
  browser('wait', '--fn', `document.querySelector('#ls-block-${uuid}') !== null`);
  assert.ok(evaluate(`document.querySelector('#ls-block-${uuid}').textContent`).includes(text));
});

for (const command of ['deadline', 'scheduled']) {
  test(`/${command} opens its calendar, applies a date and exits on Escape`, () => {
    open();
    browser('errors', '--clear');
    const uuid = appendBlock(`Calendar ${command} /${command}`);
    browser('press', 'Enter');
    assert.equal(evaluate("document.querySelectorAll('#date-time-picker').length"), 1);
    browser('press', 'Enter');
    browser('wait', '300');
    browser('press', 'Escape');
    assertExited();
    assert.ok(evaluate("document.querySelector('#main-content-container')?.textContent || document.body.textContent").includes(command === 'deadline' ? 'Deadline' : 'Scheduled'));
    assert.equal(browser('errors'), '', 'calendar and repeat controls must mount without renderer errors');
    browser('reload');
    browser('wait', '--fn', `document.querySelector('#ls-block-${uuid}') !== null`);
    assert.ok(evaluate(`document.querySelector('#ls-block-${uuid}').textContent`).includes(command === 'deadline' ? 'Deadline' : 'Scheduled'));
  });
}

test('moving the caret back into an existing page reference opens completion', () => {
  open();
  appendBlock('Reference [[foo]] suffix');
  for (let move = 0; move < 9; move++) browser('press', 'ArrowLeft');
  assert.equal(evaluate("document.querySelectorAll('#ui__ac').length"), 1);
  browser('press', 'Escape');
  assertExited();
});

test('Escape exits editing even with text selected', () => {
  open();
  appendBlock('Selected text');
  browser('press', 'Control+a');
  browser('press', 'Escape');
  assertExited();
});

const editBlock = uuid => {
  browser('click', `#ls-block-${uuid} .block-content`);
  browser('wait', '--fn', `document.querySelector('.ed-input')?.getAttribute('data-block-id') === '${uuid}'`);
};
const editedText = () => evaluate("document.querySelector('.editor-wrapper')?.textContent.replaceAll('\\u200b', '')");
const history = redo => {
  browser('press', redo ? 'Control+Shift+z' : 'Control+z');
  browser('wait', '300');
};

for (const redo of [false, true]) {
  test(`${redo ? 'redo' : 'undo'} restores the caret after typing`, () => {
    open();
    const uuid = appendBlock('abcd');
    browser('press', 'Escape');
    assertExited();
    editBlock(uuid);
    browser('press', 'ArrowLeft');
    browser('press', 'ArrowLeft');
    browser('keyboard', 'type', 'X');
    assert.equal(editedText(), 'abXcd');
    history(false);
    if (redo) history(true);
    browser('keyboard', 'type', '!');
    assert.equal(editedText(), redo ? 'abX!cd' : 'ab!cd');
  });
  test(`${redo ? 'redo' : 'undo'} restores the block and caret after Enter`, () => {
    open();
    const uuid = appendBlock('abcd');
    browser('press', 'Escape');
    assertExited();
    editBlock(uuid);
    browser('press', 'ArrowLeft');
    browser('press', 'ArrowLeft');
    browser('press', 'Enter');
    browser('wait', '300');
    history(false);
    if (redo) history(true);
    browser('keyboard', 'type', '!');
    assert.equal(editedText(), redo ? '!cd' : 'ab!cd');
  });
  test(`${redo ? 'redo' : 'undo'} restores the block and caret after Backspace merge`, () => {
    open();
    appendBlock('ab');
    browser('press', 'Enter');
    browser('wait', '300');
    browser('keyboard', 'type', 'cd');
    browser('wait', '500');
    browser('press', 'ArrowLeft');
    browser('press', 'ArrowLeft');
    browser('press', 'Backspace');
    browser('wait', '300');
    history(false);
    if (redo) history(true);
    browser('keyboard', 'type', '!');
    assert.equal(editedText(), redo ? 'ab!cd' : '!cd');
  });
  test(`${redo ? 'redo' : 'undo'} restores the caret after indentation`, () => {
    open();
    appendBlock('Indent parent');
    browser('press', 'Enter');
    browser('wait', '300');
    browser('keyboard', 'type', 'abcd');
    const uuid = evaluate("document.querySelector('.ed-input').getAttribute('data-block-id')");
    browser('press', 'Escape');
    assertExited();
    editBlock(uuid);
    browser('press', 'ArrowLeft');
    browser('press', 'ArrowLeft');
    browser('press', 'Tab');
    browser('wait', '300');
    history(false);
    if (redo) history(true);
    assert.equal(evaluate("document.querySelector('.ed-input')?.getAttribute('data-block-id')"), uuid);
    browser('keyboard', 'type', '!');
    assert.equal(editedText(), 'ab!cd');
  });
  test(`${redo ? 'redo' : 'undo'} restores the editing target after a block paste`, () => {
    open();
    const uuid = appendBlock('abcd');
    browser('press', 'Escape');
    assertExited();
    editBlock(uuid);
    browser('press', 'ArrowLeft');
    browser('press', 'ArrowLeft');
    evaluate("(() => {const data=new DataTransfer();data.setData('text/plain','- first\\n- second');document.querySelector('.ed-input').dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));return true;})()");
    browser('wait', '500');
    assert.equal(editedText(), 'second');
    history(false);
    if (redo) history(true);
    browser('keyboard', 'type', '!');
    assert.equal(editedText(), redo ? 'second!' : 'ab!cd');
  });
}

test('search focuses its input and closes on Escape or outside press, then reopens', () => {
  open();
  browser('errors', '--clear');
  browser('click', '#search-button');
  browser('wait', '--fn', "document.activeElement === document.querySelector('.cp__cmdk-search-input')");
  browser('keyboard', 'type', 'Search fixture');
  assert.equal(evaluate("document.querySelector('.cp__cmdk-search-input').value"), 'Search fixture');
  browser('press', 'Escape');
  browser('wait', '--fn', "document.querySelector('.cp__cmdk-search-input')?.value === ''");
  browser('press', 'Escape');
  browser('wait', '--fn', "document.querySelector('.cp__cmdk-search-input') === null");
  browser('click', '#search-button');
  browser('wait', '--fn', "document.activeElement === document.querySelector('.cp__cmdk-search-input')");
  browser('click', '#head');
  browser('wait', '--fn', "document.querySelector('.cp__cmdk-search-input') === null");
  browser('click', '#search-button');
  browser('wait', '--fn', "document.activeElement === document.querySelector('.cp__cmdk-search-input')");
  browser('press', 'Escape');
  browser('wait', '--fn', "document.querySelector('.cp__cmdk-search-input') === null");
  assert.equal(browser('errors'), '', 'search lifecycle must not reject the retained dialog');
});

test('graph-switch trigger toggles without an outside-press reopen', () => {
  open();
  if (!evaluate("document.querySelector('#left-sidebar')?.classList.contains('is-open') === true")) button('Toggle left sidebar');
  for (let cycle = 0; cycle < 3; cycle++) {
    browser('click', '.cp__graphs-selector .item');
    assert.equal(evaluate("document.querySelectorAll('.repos-list:not([data-ending-style])').length"), 1);
    browser('click', '.cp__graphs-selector .item');
    browser('wait', '200');
    assert.equal(evaluate("document.querySelectorAll('.repos-list:not([data-ending-style])').length"), 0);
  }
});

test('More menu keeps icons before labels and readable highlighted text', () => {
  open();
  button('More');
  assert.equal(evaluate("(()=>{const row=Array.from(document.querySelectorAll('.ui__dropdown-menu-item')).find(e=>e.textContent==='Settings');const icon=row.querySelector('.lui-menu-item-icon'),label=row.querySelector('.lui-menu-item-label');return icon.getBoundingClientRect().right<=label.getBoundingClientRect().left})()"), true);
  assert.equal(evaluate("(()=>{const rows=document.querySelectorAll('.ui__dropdown-menu-item');return getComputedStyle(rows[0]).color===getComputedStyle(rows[1]).color})()"), true);
});

test('More menu recovers its content height while the retained viewport resizes', () => {
  open();
  browser('set', 'viewport', '1280', '720');
  button('More');
  const measure = "(()=>{const menu=document.querySelector('.ls-dots-menu');const r=menu.getBoundingClientRect();return {id:menu.id,x:r.x,y:r.y,width:r.width,height:r.height,client:menu.clientHeight,scroll:menu.scrollHeight}})()";
  const initial = evaluate(measure);
  try {
    for (const height of [200, 720, 300, 720]) {
      browser('set', 'viewport', '1280', String(height));
      const expected = Math.min(initial.height, height - 45);
      browser('wait', '--fn', `Math.abs(document.querySelector('.ls-dots-menu').getBoundingClientRect().height-${expected})<1`);
      const menu = evaluate(measure);
      assert.equal(menu.id, initial.id, 'resize retains the open menu');
      assert.equal(menu.x, 1019);
      assert.equal(menu.y, 40);
      assert.equal(menu.width, 256);
      assert.ok(Math.abs(menu.height - expected) < 1);
      if (height === 200) {
        assert.ok(menu.scroll > menu.client, 'short menus retain scrollable content');
        browser('scroll', 'down', '1000', '--selector', '.ls-dots-menu');
        browser('wait', '--fn', "(()=>{const menu=document.querySelector('.ls-dots-menu');return Math.abs(menu.scrollTop-(menu.scrollHeight-menu.clientHeight))<1})()");
        const bottom = evaluate("(()=>{const menu=document.querySelector('.ls-dots-menu');const tail=Array.from(menu.querySelectorAll('[role=menuitem]')).at(-1);return {menu:menu.getBoundingClientRect().bottom,tail:tail.getBoundingClientRect().bottom}})()");
        assert.ok(bottom.tail <= bottom.menu, 'the last menu item remains reachable after repositioning');
      }
    }
  } finally {
    browser('press', 'Escape');
    browser('set', 'viewport', '1280', '720');
  }
});

test('right-sidebar panel headings use neutral disclosure chrome', () => {
  open();
  button('Toggle right sidebar');
  button('Contents');
  assert.equal(evaluate("(()=>{const heading=document.querySelector('[id^=sidebar-panel-header-]');return getComputedStyle(heading).backgroundColor})()"), 'rgba(0, 0, 0, 0)');
});

test('task status stays before the block text', () => {
  open();
  appendBlock('Task scrolling fixture');
  const lines = Array.from({length: 40}, (_, index) => `- Task fixture ${index}`).join('\n');
  evaluate(`(() => {const data=new DataTransfer();data.setData('text/plain',${JSON.stringify(lines)});document.querySelector('.ed-input').dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));return true;})()`);
  browser('wait', '--fn', "document.querySelector('.editor-wrapper')?.textContent.replaceAll('\\u200b', '') === 'Task fixture 39'");
  browser('press', 'Escape');
  assertExited();
  const uuid = appendBlock('Task placement parity');
  browser('press', 'Control+Enter');
  browser('wait', '300');
  browser('press', 'Escape');
  assertExited();
  const metrics = evaluate(`(() => {const block=document.querySelector('#ls-block-${uuid}');const status=block.querySelector('.positioned-properties.block-left').getBoundingClientRect();const title=block.querySelector('.block-content').getBoundingClientRect();return {statusRight:status.right,titleLeft:title.left};})()`);
  assert.ok(metrics.statusRight<=metrics.titleLeft, 'task status must precede the title instead of following the full-width content');
  assert.equal(evaluate(`document.querySelector('#ls-block-${uuid} .positioned-properties.block-left [data-name="app:todo"]') !== null`), true, 'the task status uses its configured icon');
  evaluate(`(()=>{const trigger=document.querySelector('#ls-block-${uuid} .pv-closed-value');trigger.click();trigger.click();})()`);
  browser('wait', '300');
  assert.equal(evaluate("document.querySelectorAll('.ls-property-select-popup').length"), 0, 'an asynchronous option load must not reopen a canceled picker');
  browser('click', `#ls-block-${uuid} .pv-closed-value`);
  assert.equal(evaluate("document.querySelectorAll('input[placeholder=\"Set Status\"]').length > 0"), true);
  browser('wait', '--fn', "document.querySelector('.ls-property-select-popup')?.textContent.includes('Todo') === true");
  const picker = evaluate("(()=>{const popup=document.querySelector('.ls-property-select-popup');return {color:getComputedStyle(popup).backgroundColor,rowHeight:popup.querySelector('.lui-list-item').getBoundingClientRect().height,chosen:popup.querySelectorAll('.ls-property-select-check').length};})()");
  assert.notEqual(picker.color, 'rgba(0, 0, 0, 0)', 'the status picker has an opaque card background');
  assert.equal(picker.rowHeight, 32);
  assert.equal(picker.chosen, 1, 'the current value has a check mark');
  browser('click', `#ls-block-${uuid} .pv-closed-value`);
  assert.equal(evaluate("document.querySelectorAll('input[placeholder=\"Set Status\"]').length"), 0, 'a second trigger press closes the status picker');
  browser('click', `#ls-block-${uuid} .pv-closed-value`);
  browser('wait', '--fn', "document.querySelector('.ls-property-select-popup')?.textContent.includes('Done') === true");
  browser('find', 'text', 'Done', 'click', '--exact');
  browser('wait', '--fn', `document.querySelector('#ls-block-${uuid} .positioned-properties.block-left [data-name="app:done"]') !== null`);
  browser('reload');
  browser('wait', '--fn', `document.querySelector('#ls-block-${uuid} .positioned-properties.block-left [data-name="app:done"]') !== null`);
  clickInView(`#ls-block-${uuid} .pv-closed-value`);
  browser('wait', '--fn', "document.querySelector('.ls-property-select-popup')?.textContent.includes('Clear') === true");
  browser('find', 'text', 'Clear', 'click', '--exact');
  browser('wait', '--fn', `document.querySelector('#ls-block-${uuid} .positioned-properties.block-left') === null`);
});

test('task priority has its icon and persists picker changes', () => {
  open();
  const uuid = appendBlock('Priority parity /priority high');
  browser('press', 'Enter');
  browser('wait', '--fn', `document.querySelector('#ls-block-${uuid} .pv-closed-value[aria-label="High"]') !== null`);
  browser('press', 'Escape');
  assertExited();
  assert.equal(evaluate(`document.querySelector('#ls-block-${uuid} [data-name="app:priority-lvl-high"]') !== null`), true);
  browser('click', `#ls-block-${uuid} .pv-closed-value[aria-label="High"]`);
  browser('wait', '--fn', "document.querySelector('.ls-property-select-popup')?.textContent.includes('Urgent') === true");
  browser('find', 'text', 'Urgent', 'click', '--exact');
  browser('reload');
  browser('wait', '--fn', `document.querySelector('#ls-block-${uuid} [data-name="app:priority-lvl-urgent"]') !== null`);
});

test('dialog and recorder motion retain their shared timing and center', () => {
  open();
  openSettings();
  assertSurfaceMotion(evaluate(`(${measureSurfaceMotion.toString()})('.lui-dialog')`),
    {duration: 0.2, easing: 'ease-out'});
  button('Keymap');
  button('Search by keys');
  browser('wait', '--fn', "document.querySelector('.shortcut-filter-popover[data-open]') !== null");
  assertSurfaceMotion(evaluate(`(${measureSurfaceMotion.toString()})('.shortcut-filter-popover')`),
    {duration: 0.15, easing: 'ease'});
  browser('press', 'Escape');
  browser('wait', '--fn', "document.querySelector('.shortcut-filter-popover') === null");
  button('Close');
  browser('wait', '--fn', "document.querySelector('.lui-dialog') === null");
});

test('keymap search, filters and category disclosure respond to input', () => {
  open();
  openSettings();
  button('Keymap');
  browser('wait', '--fn', "document.querySelector('.cp__shortcut-page-x input') !== null");
  const allCount = evaluate("document.querySelectorAll('.shortcut-row').length");
  browser('fill', '.cp__shortcut-page-x input', 'Undo');
  browser('wait', '--fn', "document.querySelectorAll('.shortcut-row').length === 1");
  assert.equal(evaluate("document.querySelectorAll('.shortcut-row').length"), 1, 'search narrows the command list');
  assert.ok(evaluate("document.querySelector('.shortcut-row').textContent").includes('Undo'));
  browser('fill', '.cp__shortcut-page-x input', '');
  button('Unset');
  const unsetCount = evaluate("document.querySelectorAll('.shortcut-row').length");
  assert.ok(unsetCount > 0 && unsetCount < allCount);
  assert.equal(evaluate("Array.from(document.querySelectorAll('.shortcut-row')).every(e=>e.textContent.includes('Unset'))"), true);
  button('Disabled');
  assert.equal(evaluate("Array.from(document.querySelectorAll('.shortcut-row')).every(e=>e.textContent.includes('Disabled'))"), true);
  button('All');
  const count = evaluate("document.querySelectorAll('.shortcut-row').length");
  button('Toggle categories pane');
  assert.equal(evaluate("document.querySelectorAll('.shortcut-row').length"), 0);
  button('Toggle categories pane');
  assert.equal(evaluate("document.querySelectorAll('.shortcut-row').length"), count);
});

test('font settings update live and survive a full reload', () => {
  open();
  openSettings();
  button('Serif');
  assert.equal(evaluate("document.documentElement.getAttribute('data-font')"), 'serif');
  browser('reload');
  browser('wait', '--fn', "document.querySelector('#head') !== null || document.body.textContent.includes('SyntaxError')");
  assert.equal(evaluate("document.querySelectorAll('#head').length"), 1, 'persisted settings must not break startup');
  assert.equal(evaluate("document.documentElement.getAttribute('data-font')"), 'serif');
  openSettings();
  button('Default');
});


test('settings switches match the reference dimensions and persist clicks', () => {
  open();
  openSettings();
  button('Editor');
  const selector = '.ui__switch input[role=switch]';
  const metrics = evaluate(`(() => {const s=document.querySelector('${selector}');const r=s.getBoundingClientRect();const t=getComputedStyle(s,'::after');return [r.width,r.height,t.width,t.height];})()`);
  assert.deepEqual(metrics, [32,18,'12px','12px']);
  assert.equal(evaluate(`getComputedStyle(document.querySelector('${selector}'),'::after').translate`), 'none', 'the thumb must not combine Tailwind translate with its switch transform');
  const before = evaluate(`document.querySelector('${selector}').checked`);
  browser('click', selector + ':first-of-type');
  browser('wait', '250');
  assert.equal(evaluate(`document.querySelector('${selector}').checked`), !before);
  button('Close');
  browser('reload');
  browser('wait', '--fn', "document.querySelector('#head') !== null");
  openSettings();
  button('Editor');
  assert.equal(evaluate(`document.querySelector('${selector}').checked`), !before);
});

test('Appearance reads saved graph preferences immediately after a reload', () => {
  open();
  const show = () => {
    button('More');
    browser('find', 'role', 'menuitem', 'click', '--name', 'Appearance', '--exact');
  };
  const selector = '#appearance_settings .it:nth-child(4) input[role=switch]';
  const checked = () => evaluate(`document.querySelector('${selector}').checked`);
  show();
  const before = checked();
  try {
    if (checked()) browser('click', selector);
    browser('wait', '--fn', `document.querySelector('${selector}').checked===false`);
    browser('press', 'Escape');
    browser('reload');
    browser('wait', '--fn', "document.querySelector('#head') !== null");
    show();
    assert.equal(checked(), false, 'opening Appearance must not depend on opening Settings first');
  } finally {
    if (checked() !== before) {
      browser('click', selector);
      browser('wait', '--fn', `document.querySelector('${selector}').checked===${before}`);
    }
    browser('press', 'Escape');
  }
});

test('Appearance switches share reference chrome across light and dark themes', () => {
  open();
  button('More');
  browser('find', 'role', 'menuitem', 'click', '--name', 'Appearance', '--exact');
  try {
    for (const [theme, accent, thumb, off, on] of [
      ['dark', 'Logseq classic color', 'rgb(0, 45, 56)', 'rgb(41, 69, 86)', 'rgb(3, 125, 186)'],
      ['light', 'Logseq classic color', 'rgb(255, 255, 255)', 'rgb(232, 232, 232)', 'rgb(3, 125, 186)'],
      ['dark', 'Blue', 'rgb(28, 28, 28)', 'rgb(41, 41, 41)', 'rgb(0, 145, 255)'],
    ]) {
      browser('find', 'role', 'button', 'click', '--name', accent, '--exact');
      browser('find', 'text', theme, 'click', '--exact');
      browser('wait', '--fn', `document.body.classList.contains('dark-theme')===${theme === 'dark'}`);
      const controls = evaluate("Array.from(document.querySelectorAll('.ui__switch input[role=switch]')).map(e=>{const r=e.getBoundingClientRect();const t=getComputedStyle(e,'::after');return {checked:e.checked,width:r.width,height:r.height,track:getComputedStyle(e).backgroundColor,thumb:t.backgroundColor,thumbWidth:t.width,thumbHeight:t.height}})");
      assert.equal(controls.length, 2);
      for (const control of controls) {
        assert.deepEqual([control.width,control.height,control.thumbWidth,control.thumbHeight], [32,18,'12px','12px']);
        assert.equal(control.thumb, thumb);
        assert.equal(control.track, control.checked ? on : off);
      }
    }
  } finally {
    browser('find', 'role', 'button', 'click', '--name', 'Logseq classic color', '--exact');
    browser('find', 'text', 'light', 'click', '--exact');
    browser('press', 'Escape');
  }
});


test('selecting an empty page reference consumes its autopaired closing brackets', () => {
  open();
  appendBlock('[[Completion target]]');
  browser('press', 'Escape');
  assertExited();
  appendBlock('[[');
  browser('press', 'Enter');
  assert.equal(editedText().endsWith(']]]]'), false);
});

test('settings editor aligns its switches with multiline labels', () => {
  open();
  openSettings();
  button('Editor');
  const metrics = evaluate("(() => {const rows=[...document.querySelectorAll('.panel-wrap > .it')];const r=rows.find(e=>e.textContent.includes('Show all lines of a block reference'));const s=r.querySelector('[role=switch]').getBoundingClientRect();const label=r.firstElementChild.getBoundingClientRect();const panel=document.querySelector('.panel-wrap').getBoundingClientRect();return {x:s.x-panel.x,center:s.y+s.height/2-label.y-label.height/2};})()");
  assert.ok(Math.abs(metrics.center+3)<0.5, `switch is ${metrics.center}px away from the label center instead of the reference -3px`);
  assert.ok(Math.abs(metrics.x-209.328125)<0.5, `switch starts at ${metrics.x}px instead of the reference column`);
});


for (const level of [1,2,3,4,5,6]) {
  test(`heading ${level} keeps its font size and text origin while editing`, () => {
    open();
    const uuid = appendBlock('#'.repeat(level) + ' Heading parity');
    browser('press', 'Escape');
    assertExited();
    const read = evaluate(`(() => {const h=document.querySelector('#ls-block-${uuid} h${level}');const style=getComputedStyle(h);const walker=document.createTreeWalker(h,NodeFilter.SHOW_TEXT);const range=document.createRange();range.selectNode(walker.nextNode());const rect=range.getBoundingClientRect();return {font:style.fontSize,x:rect.x,y:rect.y};})()`);
    editBlock(uuid);
    const editing = evaluate(`(() => {const h=document.querySelector('#ls-block-${uuid} .ed-line');const style=getComputedStyle(h);const walker=document.createTreeWalker(h,NodeFilter.SHOW_TEXT);const range=document.createRange();range.selectNode(walker.nextNode());const rect=range.getBoundingClientRect();return {font:style.fontSize,x:rect.x,y:rect.y};})()`);
    assert.equal(editing.font, read.font);
    assert.ok(Math.abs(editing.x-read.x)<0.5, `text x moved from ${read.x} to ${editing.x}`);
    assert.ok(Math.abs(editing.y-read.y)<0.5, `text y moved from ${read.y} to ${editing.y}`);
  });
}

test('settings navigation keeps icons before labels across tab changes and reopen', () => {
  open();
  openSettings();
  const verify = () => assertSettingsNavigation(evaluate(
    `(${measureSettingsNavigation.toString()})(document.querySelector('[role="dialog"]'))`,
  ));
  verify();
  for (const name of ['Editor', 'Keymap', 'Advanced', 'Features', 'General']) {
    button(name);
    verify();
  }
  button('Close');
  openSettings();
  verify();
  button('Close');
});

test('modal surfaces retain valid theme colors across mode changes and reopen', () => {
  open();
  openSettings();
  button('General');
  const verify = () => assertModalTheme(evaluate(
    `(${measureModalTheme.toString()})(document.querySelector('[role="dialog"]'))`,
  ));
  for (const mode of ['light', 'dark', 'light']) {
    button(`${mode} ${mode}`);
    verify();
  }
  button('Close');
  openSettings();
  verify();
  button('Close');
});

for (const surface of ['settings', 'appearance']) {
  test(`${surface} accent choices remain separated and each click selects its own color`, () => {
    open();
    if (surface === 'settings') {
      openSettings();
      button('General');
    } else {
      browser('click', '#head button[aria-label="More"]');
      browser('find', 'role', 'menuitem', 'click', '--name', 'Appearance', '--exact');
    }
    const choices = ['none', 'logseq', 'tomato', 'red', 'crimson', 'pink', 'plum',
      'purple', 'violet', 'indigo', 'blue', 'cyan', 'teal', 'green', 'grass', 'orange'];
    for (const mode of ['light', 'dark']) {
      button(`${mode} ${mode}`);
      const controls = evaluate(`(${measureAccentControls.toString()})(document.body)`);
      assertAccentControls(controls);
      controls.forEach((control, index) => {
        button(control.label);
        assert.equal(evaluate("document.documentElement.getAttribute('data-color')"), choices[index]);
        assertThemeAliases(evaluate(`(${measureThemeAliases.toString()})(document.body)`));
        assertThemeAliases(evaluate(`(${measureSemanticAliases.toString()})(document.body)`));
      });
    }
    button('Logseq classic color');
    button('light light');
    if (surface === 'settings') button('Close');
    else browser('press', 'Escape');
  });
}

test('keymap filter selection retains readable text on its muted surface', () => {
  open();
  openSettings();
  const verify = () => assertKeymapFilterPaint(evaluate(
    `(${measureKeymapFilterPaint.toString()})(document.querySelector('[role="dialog"]'))`,
  ));
  for (const mode of ['light', 'dark', 'light']) {
    button('General');
    button(`${mode} ${mode}`);
    button('Keymap');
    for (const index of [1, 2, 3, 0]) {
      const target = evaluate(`document.querySelectorAll('.shortcut-filter-pills button')[${index}].id`);
      browser('click', `#${target}`);
      verify();
    }
  }
  button('Close');
});

test('keymap query ranks commands, updates counts and clears without replacing its field', () => {
  open();
  openSettings();
  button('Keymap');
  const measure = () => evaluate(`(${measureKeymapSearch.toString()})(document.querySelector('[role="dialog"]'))`);
  const inputId = measure().inputId;
  browser('fill', `#${inputId}`, 'Undo');
  assertKeymapSearch(measure(), {query: 'Undo', inputId});
  button('Disabled · 1');
  assert.equal(measure().labels.length, 1);
  button('Disabled · 1');
  assertKeymapSearch(measure(), {query: 'Undo', inputId});
  button('Clear search');
  assertKeymapSearch(measure(), {query: '', inputId, focused: true});
  browser('fill', `#${inputId}`, 'zzzz-no-shortcut');
  assertKeymapSearch(measure(), {query: 'zzzz-no-shortcut', inputId});
  button('Clear search');
  assertKeymapSearch(measure(), {query: '', inputId, focused: true});
  button('Close');
});

test('category toggle collapses mixed groups and preserves search and filter round trips', () => {
  open();
  openSettings();
  button('Keymap');
  const measure = () => evaluate(`(${measureKeymapCategories.toString()})(document.querySelector('[role="dialog"]'))`);
  const {inputId, commands} = measure();
  const verify = (count, grouped = true, tools = true) => assertKeymapCategories(measure(), {inputId, commands: count, grouped, tools});
  verify(commands);
  button('Basics');
  assert.ok(measure().commands > 0 && measure().commands < commands);
  button('Toggle categories pane');
  verify(0);
  browser('fill', `#${inputId}`, 'Undo');
  verify(13, false, false);
  button('Clear search');
  verify(0);
  button('Disabled · 4');
  verify(4, false);
  button('All · 115');
  verify(0);
  button('Basics');
  assert.ok(measure().commands > 0 && measure().commands < commands);
  button('Toggle categories pane');
  verify(0);
  button('Toggle categories pane');
  verify(commands);
  button('Close');
  openSettings();
  button('Keymap');
  assertKeymapCategories(measure(), {inputId: measure().inputId, commands});
  button('Close');
});

test('key search records keys without running shortcuts and retains its filter on dismissal', () => {
  const recording = () => evaluate(`(${measureKeymapRecording.toString()})()`);
  open();
  openSettings();
  button('Keymap');
  const input = evaluate("document.querySelector('.cp__shortcut-page-x input').id");
  browser('fill', `#${input}`, 'Undo');
  button('Search by keys');
  assert.equal(evaluate("document.querySelectorAll('.shortcut-filter-popover').length"), 1);
  assert.equal(evaluate(`document.getElementById('${input}').value`), '');
  const triggerId = recording().triggerId;
  browser('press', 'Meta+k');
  browser('wait', '--fn', `document.querySelector('.shortcut-filter-popover [data-shortcut-binding="meta+k"]') !== null`);
  assert.equal(evaluate("document.querySelectorAll('.cp__cmdk-search-input').length"), 0);
  assert.equal(evaluate("document.querySelectorAll('.shortcut-row').length"), 1);
  assertKeymapRecording(recording(), {open: true, stroke: 'meta+k', rows: 1, triggerId});
  browser('press', 'Shift+/');
  browser('wait', '--fn', `document.querySelector('.shortcut-filter-popover [data-shortcut-binding="shift+/"]') !== null`);
  assert.ok(recording().rows.includes('Toggle help'));
  browser('press', 'Tab');
  browser('wait', '--fn', `document.querySelector('.shortcut-filter-popover [data-shortcut-binding="tab"]') !== null`);
  assert.ok(evaluate("document.querySelector('.shortcut-filter-popover').textContent").includes('Tab'));
  browser('press', 'Enter');
  browser('wait', '--fn', `document.querySelector('.shortcut-filter-popover [data-shortcut-binding="enter"]') !== null`);
  assert.ok(evaluate("document.querySelector('.shortcut-filter-popover').textContent").includes('⏎'));
  browser('press', 'Escape');
  browser('wait', '--fn', "document.querySelector('.shortcut-filter-popover') === null");
  assert.equal(evaluate("document.querySelectorAll('.shortcut-filter-popover').length"), 0);
  assert.equal(evaluate("document.querySelectorAll('[role=dialog]').length"), 1);
  assertKeymapRecording(recording(), {open: false, triggerId, focused: true});
  button('Clear keystroke filter');
  assert.ok(evaluate("document.querySelectorAll('.shortcut-row').length") > 100);
  button('Search by keys');
  for (let i = 0; i < 5; i += 1) browser('press', 'PageDown');
  browser('wait', '--fn', "document.querySelectorAll('.shortcut-filter-popover [data-shortcut-binding]').length === 5");
  assertRecordingBounds(evaluate(`(${measureRecordingBounds.toString()})()`));
  button('Remove filter');
  browser('press', 'g');
  browser('press', 'j');
  assert.ok(evaluate("document.querySelector('.shortcut-filter-popover').textContent").includes('J'));
  browser('press', 'Backspace');
  browser('press', 'Escape');
  button('Clear keystroke filter');
  button('Close');
});
