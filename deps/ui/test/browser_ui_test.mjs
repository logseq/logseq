import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import test, {after} from 'node:test';

const session = 'logseq-ui-regressions';
const origin = process.env.LOGSEQ_UI_TEST_URL || 'http://localhost:3001';
const browser = (...args) => execFileSync('agent-browser', ['--session', session, ...args], {encoding: 'utf8', timeout: 30000}).trim();
const evaluate = source => JSON.parse(browser('eval', source));
const open = () => {
  browser('open', origin);
  browser('wait', '--fn', "document.querySelector('.cp__graphs-selector .item')?.textContent.includes('Demo') === true");
};
const button = name => browser('find', 'role', 'button', 'click', '--name', name, '--exact');
after(() => browser('close'));

const appendBlock = text => {
  browser('click', '.block-add-button');
  browser('wait', '--fn', "document.querySelector('.ed-input') !== null");
  const uuid = evaluate("document.querySelector('.ed-input').getAttribute('data-block-id')");
  browser('keyboard', 'type', text);
  return uuid;
};
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
}

test('one search-button click opens the palette and Escape closes it', () => {
  open();
  browser('click', '#search-button');
  assert.equal(evaluate("document.querySelectorAll('.cp__cmdk-search-input').length"), 1);
  browser('press', 'Escape');
  browser('press', 'Escape');
  assert.equal(evaluate("document.querySelectorAll('.cp__cmdk-search-input').length"), 0);
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

test('font settings update live and survive a full reload', () => {
  open();
  evaluate("document.dispatchEvent(new CustomEvent('ls:open-dialog',{detail:{name:'settings'}}))");
  button('Serif');
  assert.equal(evaluate("document.documentElement.getAttribute('data-font')"), 'serif');
  browser('reload');
  browser('wait', '--fn', "document.querySelector('#head') !== null || document.body.textContent.includes('SyntaxError')");
  assert.equal(evaluate("document.querySelectorAll('#head').length"), 1, 'persisted settings must not break startup');
  assert.equal(evaluate("document.documentElement.getAttribute('data-font')"), 'serif');
  evaluate("document.dispatchEvent(new CustomEvent('ls:open-dialog',{detail:{name:'settings'}}))");
  button('Default');
});


test('settings switches match the reference dimensions and persist clicks', () => {
  open();
  evaluate("document.dispatchEvent(new CustomEvent('ls:open-dialog',{detail:{name:'settings'}}))");
  button('Editor');
  const selector = '.ui__switch input[role=switch]';
  const metrics = evaluate(`(() => {const s=document.querySelector('${selector}');const r=s.getBoundingClientRect();const t=getComputedStyle(s,'::after');return [r.width,r.height,t.width,t.height];})()`);
  assert.deepEqual(metrics, [32,18,'12px','12px']);
  const before = evaluate(`document.querySelector('${selector}').checked`);
  browser('click', selector + ':first-of-type');
  browser('wait', '250');
  assert.equal(evaluate(`document.querySelector('${selector}').checked`), !before);
  button('Close');
  browser('reload');
  browser('wait', '--fn', "document.querySelector('#head') !== null");
  evaluate("document.dispatchEvent(new CustomEvent('ls:open-dialog',{detail:{name:'settings'}}))");
  button('Editor');
  assert.equal(evaluate(`document.querySelector('${selector}').checked`), !before);
});
