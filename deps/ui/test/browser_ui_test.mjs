import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import test, {after} from 'node:test';
import {measureKeymapRecording, assertKeymapRecording, measureRecordingBounds, assertRecordingBounds} from './keymap_record_checks.mjs';
import {measureKeymapSearch, assertKeymapSearch, measureKeymapCategories, assertKeymapCategories} from './keymap_search_checks.mjs';
import {measureSettingsNavigation, assertSettingsNavigation} from './settings_nav_geometry.mjs';
import {measureModalTheme, assertModalTheme, measureKeymapFilterPaint, assertKeymapFilterPaint} from './theme_surface_checks.mjs';
import {measureSurfaceMotion, assertSurfaceMotion} from './surface_motion_checks.mjs';
import {measureControlHits, assertControlHits} from './overlay_hit_checks.mjs';

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
