// Run in the served Web app, using a disposable graph/origin.
// Load this file in DevTools, then await runEditorBrowserTests().
// Every assertion drives the production editor and worker, not a mock.
globalThis.runEditorBrowserTests = async function (filter = '') {
  const results = [];
  globalThis.editorBrowserProgress = {results, done: false};
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const wait = async predicate => {
    for (let i = 0; i < 200; i++) {
      if (await predicate()) return;
      await pause(10);
    }
    throw new Error('Editor did not become ready');
  };
  const input = () => document.querySelector('.ed-input');
  const surface = () => document.querySelector('.block-editor');
  const text = () => surface()?.textContent.replaceAll('\u200b', '');
  const key = (name, modifiers = {}) => {
    const event = new KeyboardEvent('keydown', {
      key: name, bubbles: true, cancelable: true, ...modifiers,
    });
    (input() || document.body).dispatchEvent(event);
    return event;
  };
  const insert = value => input().dispatchEvent(new InputEvent('beforeinput', {
    inputType: 'insertText', data: value, bubbles: true, cancelable: true,
  }));
  const composition = (state, value = '') => input().dispatchEvent(
    new CompositionEvent('composition' + state, {data: value, bubbles: true}),
  );
  const select = async (lo, hi) => {
    key('Home');
    for (let i = 0; i < lo; i++) key('ArrowRight');
    for (let i = lo; i < hi; i++) key('ArrowRight', {shiftKey: true});
    await pause(20);
  };
  const fixture = async (titles, child = false) => {
    key('Escape');
    await pause(50);
    const name = 'Editor regression ' + crypto.randomUUID();
    const page = await logseq.api.create_page(name, {}, {});
    const blocks = [];
    for (const title of titles)
      blocks.push(await logseq.api.append_block_in_page(name, title, {}));
    if (child) await logseq.api.insert_block(blocks[0].uuid, 'child', {sibling: false});
    location.hash = '#/page/' + page.uuid;
    await wait(() => document.querySelector('#block-content-' + blocks[0].uuid));
    document.querySelector('#block-content-' + blocks[0].uuid).scrollIntoView({block: 'start'});
    document.querySelector('#block-content-' + blocks[0].uuid).click();
    try { await wait(() => input() && document.activeElement === input() && document.querySelector('.ed-caret')); }
    catch (error) { throw new Error(JSON.stringify({fixture: blocks[0].uuid, input: input()?.id, active: document.activeElement?.id, caret: !!document.querySelector('.ed-caret')})); }
    await pause(30);
    return {page, blocks};
  };
  const assert = (condition, evidence) => {
    if (!condition) throw new Error(JSON.stringify(evidence));
  };
  const test = async (name, run) => {
    if (typeof filter === 'function' ? !filter(name) : !name.includes(filter)) return;
    try { results.push({name, passed: true, evidence: await run()}); }
    catch (error) { results.push({name, passed: false, error: String(error), detail: JSON.stringify(error, Object.getOwnPropertyNames(error))}); }
  };

  await wait(() => document.querySelector('.page-blocks-inner'));
  const blockReferenceFixture = async title => {
    key('Escape'); await pause(50);
    const name = 'Block reference regression ' + crypto.randomUUID();
    await logseq.api.create_page(name, {}, {});
    const target = await logseq.api.append_block_in_page(name, title, {});
    return {target, ...(await fixture(['prefix [[' + target.uuid + ']] suffix']))};
  };
  const assertNativeInsertion = phase => {
    const selection = window.getSelection();
    assert(document.activeElement === input() && selection.rangeCount > 0
      && selection.isCollapsed, {phase, active: document.activeElement?.id,
        ranges: selection.rangeCount, collapsed: selection.isCollapsed});
  };
  const prepareNativeMenu = () => {
    const selected = surface().querySelector('.ed-sel').getBoundingClientRect();
    const target = document.elementFromPoint(selected.x + 2, selected.y + selected.height / 2);
    const coordinates = {clientX: selected.x + 2, clientY: selected.y + selected.height / 2};
    target.dispatchEvent(new MouseEvent('mousedown', {
      ...coordinates, button: 2, buttons: 2, bubbles: true, cancelable: true,
    }));
    return {target, coordinates};
  };
  for (const [title, lo, hi, expected] of [
    ['hello world', 6, 11, 'world'],
    ['hello **bold** world', 6, 14, '**bold**'],
    ['a😀中z', 1, 4, '😀中'],
    ['first\nsecond', 0, 12, 'first\nsecond'],
  ]) {
    await test('Regression: native context menu exposes selected text ' + JSON.stringify(title), async () => {
      await fixture([title]); key('Home', {metaKey: true});
      for (const character of title.slice(0, lo)) key('ArrowRight');
      for (const character of title.slice(lo, hi)) key('ArrowRight', {shiftKey: true});
      await pause(20);
      const {target, coordinates} = prepareNativeMenu();
      const selected = window.getSelection().toString().replaceAll('\u200b', '');
      assert(selected.replaceAll('\n', '') === expected.replaceAll('\n', ''), {selected, expected});
      const copied = new DataTransfer();
      target.dispatchEvent(new ClipboardEvent('copy', {clipboardData: copied, bubbles: true, cancelable: true}));
      assert(copied.getData('text/plain') === expected, {copied: copied.getData('text/plain'), expected});
      target.dispatchEvent(new MouseEvent('contextmenu', {...coordinates, button: 2, bubbles: true, cancelable: true}));
      await pause(30);
      assert(document.activeElement === input(), {active: document.activeElement?.id});
      insert('x'); await pause(20); assertNativeInsertion('typing after native menu');
      assert(text() === title.slice(0, lo) + 'x' + title.slice(hi), {value: text()});
    });
  }
  await test('Regression: native context menu preserves a dragged selection', async () => {
    await fixture(['hello world']); key('Home');
    const node = [...surface().querySelectorAll('.ed-r')].find(run => run.textContent === 'hello world').firstChild;
    const point = offset => {
      const range = document.createRange(); range.setStart(node, offset); range.setEnd(node, offset);
      const rect = range.getBoundingClientRect(); return {clientX: rect.x, clientY: rect.y + rect.height / 2};
    };
    const target = node.parentElement;
    target.dispatchEvent(new MouseEvent('mousedown', {...point(6), button: 0, buttons: 1, bubbles: true, cancelable: true}));
    target.dispatchEvent(new MouseEvent('mousemove', {...point(11), buttons: 1, bubbles: true}));
    target.dispatchEvent(new MouseEvent('mouseup', {...point(11), button: 0, bubbles: true}));
    await pause(20);
    const menu = prepareNativeMenu();
    assert(window.getSelection().toString() === 'world', {selected: window.getSelection().toString()});
    menu.target.dispatchEvent(new MouseEvent('contextmenu', {...menu.coordinates, button: 2, bubbles: true, cancelable: true}));
    await pause(30); key('ArrowRight'); await pause(20);
    assertNativeInsertion('dismissing native menu and collapsing selection');
    insert('x'); await pause(20);
    assert(text() === 'hello worldx', {value: text()});
  });
  await test('Regression: consecutive input retains the native insertion selection', async () => {
    await fixture(['base']); key('End');
    for (const character of 'abcdef') {
      insert(character); await pause(20); assertNativeInsertion(character);
    }
    assert(text() === 'baseabcdef', {value: text()});
  });
  await test('Regression: composition preview retains the native insertion selection', async () => {
    await fixture(['base']); key('End');
    composition('start');
    try {
      composition('update', 'ni'); await pause(20);
      assertNativeInsertion('composition preview');
    } finally { composition('end', '你'); }
    await pause(20); assertNativeInsertion('composition commit');
    insert('x'); await pause(20); assertNativeInsertion('continued input');
    assert(text() === 'base你x', {value: text()});
  });
  await test('Regression: collapsing a painted selection restores native insertion', async () => {
    await fixture(['base']); await select(0, 4);
    const range = document.createRange();
    range.selectNodeContents([...surface().querySelectorAll('.ed-r')]
      .find(run => run.textContent === 'base'));
    window.getSelection().removeAllRanges(); window.getSelection().addRange(range);
    assert(!window.getSelection().isCollapsed
      && window.getSelection().getRangeAt(0).cloneContents().textContent === 'base',
      {selected: window.getSelection().getRangeAt(0).cloneContents().textContent});
    key('ArrowRight'); await pause(20); assertNativeInsertion('selection collapsed');
    insert('x'); await pause(20); assertNativeInsertion('continued input');
    assert(text() === 'basex', {value: text()});
  });
  await test('Regression: block references display only the first line', async () => {
    const {target, blocks} = await blockReferenceFixture('first line\nsecond line');
    key('Home', {metaKey: true});
    assert(text() === 'prefix [[first line]] suffix', {value: text(), target: target.uuid});
    key('Escape'); await pause(450);
    const read = document.getElementById('block-content-' + blocks[0].uuid);
    assert(read.textContent.includes('first line') && !read.textContent.includes('second line'), {value: read.textContent});
  });
  await test('Regression: block references navigate and select as immutable units', async () => {
    const {target} = await blockReferenceFixture('reference content');
    key('Home', {metaKey: true});
    for (let i = 0; i < 7; i++) key('ArrowRight');
    key('ArrowRight');
    assert(input().__lsEd.caret_off === 47, {offset: input().__lsEd.caret_off, target: target.uuid});
    key('ArrowLeft');
    assert(input().__lsEd.caret_off === 7, {offset: input().__lsEd.caret_off});
    key('ArrowRight', {shiftKey: true}); insert('replacement');
    assert(text() === 'prefix replacement suffix', {value: text()});
  });
  await test('Regression: block reference saves preserve UUID identity', async () => {
    const {target, blocks} = await blockReferenceFixture('unique target ' + crypto.randomUUID());
    key('End', {metaKey: true}); insert(' edited'); key('Escape'); await pause(450);
    const saved = (await logseq.api.get_block(blocks[0].uuid)).content;
    assert(saved === 'prefix [[' + target.uuid + ']] suffix edited', {saved, target: target.uuid});
    assert(!(await logseq.api.get_page(target.content)), {createdPage: target.content});
  });
  await test('Regression: block reference math renders LaTeX in edit and read mode', async () => {
    const {blocks} = await blockReferenceFixture('$x^2$\nhidden second line');
    assert(surface().querySelector('.katex'), {value: text()});
    key('Escape'); await pause(450);
    assert(document.getElementById('block-content-' + blocks[0].uuid).querySelector('.katex'), {mode: 'read'});
  });
  await test('Regression: actual math block references render LaTeX', async () => {
    const {blocks: [target]} = await fixture(['']);
    insert('/'); insert('math'); await wait(() => document.querySelector('[role=dialog]'));
    key('Enter'); await pause(450); key('a', {metaKey: true}); insert('x^2\nhidden line'); key('Escape'); await pause(450);
    const math = await logseq.api.get_block(target.uuid);
    assert(math[':logseq.property.node/display-type'] === 'math', {math});
    const {blocks} = await fixture(['[[' + target.uuid + ']]']);
    assert(surface().querySelector('.katex'), {value: text()});
    key('Escape'); await pause(450);
    assert(document.getElementById('block-content-' + blocks[0].uuid).querySelector('.katex'), {mode: 'read'});
  });
  await test('Regression: replacing block reference changes the rendered target', async () => {
    const {target, blocks, page} = await blockReferenceFixture('target A');
    const other = await logseq.api.append_block_in_page(page.uuid, 'target B', {});
    key('Home', {metaKey: true}); key('a', {metaKey: true});
    insert('prefix [[' + other.uuid + ']] suffix'); await pause(100);
    assert(text() === 'prefix [[target B]] suffix', {value: text(), first: target.uuid, other: other.uuid});
    key('Escape'); await pause(450);
    assert((await logseq.api.get_block(blocks[0].uuid)).content === 'prefix [[' + other.uuid + ']] suffix', {mode: 'saved'});
  });
  await test('Regression: newly typed block reference cannot retain an interior caret', async () => {
    const {target, blocks} = await blockReferenceFixture('target');
    key('a', {metaKey: true}); insert(''); insert('['); insert('['); insert(target.uuid);
    assert(input().__lsEd.caret_off === 40, {offset: input().__lsEd.caret_off});
    insert('x'); key('Escape'); await pause(450);
    const saved = (await logseq.api.get_block(blocks[0].uuid)).content;
    assert(saved === '[[' + target.uuid + ']]x', {saved, target: target.uuid});
  });
  for (const direction of ['forward', 'backward']) {
    await test('Regression: block reference word deletion stays whole ' + direction, async () => {
      const {target} = await blockReferenceFixture('target');
      key('a', {metaKey: true}); insert(direction === 'forward' ? ' [[' + target.uuid + ']]' : '[[' + target.uuid + ']] ');
      key(direction === 'forward' ? 'Home' : 'End', {metaKey: true});
      key(direction === 'forward' ? 'Delete' : 'Backspace', {altKey: true});
      assert(text() === '', {value: text(), target: target.uuid});
    });
    await test('Regression: block reference merge inserts separator ' + direction, async () => {
      const {target} = await blockReferenceFixture('target');
      const {blocks} = await fixture(['[[' + target.uuid + ']]', 'text']);
      if (direction === 'forward') { key('End', {metaKey: true}); key('Delete'); }
      else {
        document.getElementById('block-content-' + blocks[1].uuid).click(); await wait(() => input()?.id.endsWith(blocks[1].uuid));
        key('Home', {metaKey: true}); key('Backspace');
      }
      await pause(450); key('Escape'); await pause(450);
      const saved = (await logseq.api.get_block(blocks[0].uuid)).content;
      assert(saved === '[[' + target.uuid + ']] text', {saved});
    });
  }
  await test('Regression: wrapped block reference end caret follows its final visual row', async () => {
    await blockReferenceFixture('long reference ' + 'one two three four five six seven eight '.repeat(12));
    key('Home', {metaKey: true}); for (let i = 0; i < 7; i++) key('ArrowRight'); key('ArrowRight');
    const content = document.querySelector('.ed-block-ref');
    const range = document.createRange(); range.selectNodeContents(content);
    const rects = [...range.getClientRects()].filter(r => r.width > 0);
    const last = rects.at(-1); const caret = document.querySelector('.ed-caret').getBoundingClientRect();
    assert(Math.abs(caret.top - last.top) < 5 && Math.abs(caret.left - last.right) < 5, {caret: {top: caret.top, left: caret.left}, last: {top: last.top, right: last.right}});
  });
  await test('Regression: click entry never paints the fallback end caret', async () => {
    const value = 'click near the start rather than at the end of this long block';
    const {blocks} = await fixture([value]); key('Escape'); await pause(450);
    const content = document.getElementById('block-content-' + blocks[0].uuid);
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    const node = walker.nextNode();
    const range = document.createRange(); range.setStart(node, 3); range.collapse(true);
    const rect = range.getBoundingClientRect(); const x = rect.left, y = rect.top + rect.height / 2;
    const positions = [];
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.target.matches?.('.ed-pos') && record.attributeName === 'style' && record.oldValue)
          positions.push(record.oldValue);
      }
    });
    observer.observe(document.body, {subtree: true, attributes: true, attributeOldValue: true});
    try {
      for (const type of ['mousedown', 'mouseup', 'click']) content.dispatchEvent(new MouseEvent(type, {bubbles: true, clientX: x, clientY: y}));
      await wait(() => input() && document.activeElement === input()); await pause(100);
      assert(input().__lsEd.caret_off === 3, {offset: input().__lsEd.caret_off});
      const editorLeft = surface().getBoundingClientRect().left;
      const limit = x - editorLeft + 20;
      const painted = positions.map(p => /padding(?:-inline|-left)?:\s*([\d.]+)px/.exec(p)?.[1]).filter(Boolean).map(Number);
      assert(painted.every(px => px < limit), {positions, painted, limit});
      return {positions, offset: input().__lsEd.caret_off};
    } finally { observer.disconnect(); }
  });
  await test('Regression: master autopair preserves selected whitespace', async () => {
    for (const opener of ['[', '$']) {
      await fixture(['a  b']); await select(1, 3); insert(opener);
      const closer = opener === '[' ? ']' : '$';
      assert(text() === 'a' + opener + closer + '  b', {opener, value: text()});
    }
  });
  await test('Regression: master autopair closer overtypes selected content', async () => {
    await fixture(['a]bc']); await select(1, 3); insert(']');
    assert(text() === 'a]bc' && input().__lsEd.caret_off === 2, {value: text(), offset: input().__lsEd.caret_off});
  });
  await test('Regression: master slash Backspace deletes only the trigger', async () => {
    await fixture(['//']); key('Home', {metaKey: true}); key('ArrowRight'); key('Backspace');
    assert(text() === '/', {value: text()});
  });
  await test('Regression: moving caret stays visible and resumes idle blinking', async () => {
    await fixture(['arrow visibility']); key('Home'); await pause(400);
    for (const direction of ['ArrowRight', 'ArrowLeft']) {
      const caret = document.querySelector('.ed-caret');
      caret.getAnimations()[0].currentTime = 750;
      key(direction);
      await new Promise(requestAnimationFrame);
      assert(getComputedStyle(caret).opacity === '1', {direction, opacity: getComputedStyle(caret).opacity});
    }
    const caret = document.querySelector('.ed-caret');
    const states = new Set();
    for (let i = 0; i < 12; i++) { states.add(getComputedStyle(caret).opacity); await pause(100); }
    assert(states.has('0') && states.has('1'), {states: [...states]});
  });
  await test('Regression: wrapped lines support Down Up Home End and selection', async () => {
    const value = 'First line wraps naturally: ' + 'one two three four five six seven eight nine ten '.repeat(12);
    const {blocks} = await fixture([value, 'next']); key('Home', {metaKey: true});
    const top = document.querySelector('.ed-caret').getBoundingClientRect().top;
    key('ArrowDown');
    const next = document.querySelector('.ed-caret').getBoundingClientRect().top;
    assert(next > top + 10 && input().id.endsWith(blocks[0].uuid), {top, next, id: input().id});
    key('Home'); const lo = input().__lsEd.caret_off;
    key('End'); const hi = input().__lsEd.caret_off;
    assert(hi > lo, {lo, hi});
    key('Home'); key('ArrowUp');
    assert(input().__lsEd.caret_off === 0, {offset: input().__lsEd.caret_off});
    key('ArrowDown', {shiftKey: true}); insert('X');
    assert(text().startsWith('X') && text().length < value.length, {text: text()});
  });
  await test('Regression: wrapped unbroken text has consistent row navigation', async () => {
    const {blocks} = await fixture(['a'.repeat(600), 'next']); key('Home', {metaKey: true});
    const initial = document.querySelector('.ed-caret').getBoundingClientRect().top;
    key('ArrowDown'); key('Home'); const start = input().__lsEd.caret_off;
    const second = document.querySelector('.ed-caret').getBoundingClientRect().top;
    assert(start > 0 && second > initial + 10, {start, initial, second});
    key('ArrowUp'); assert(input().__lsEd.caret_off === 0 && input().id.endsWith(blocks[0].uuid), {offset: input().__lsEd.caret_off});
    key('ArrowDown'); assert(document.querySelector('.ed-caret').getBoundingClientRect().top > initial + 10, {offset: input().__lsEd.caret_off});
  });
  await test('Regression: Enter and indent keep following rows mounted', async () => {
    const {blocks} = await fixture(['parent', 'current', ...Array.from({length: 20}, (_, i) => 'following ' + i)]);
    await wait(() => document.getElementById('block-content-' + blocks.at(-1).uuid));
    const contents = blocks.slice(2).map(b => document.getElementById('block-content-' + b.uuid));
    const removed = [];
    const observer = new MutationObserver(records => {
      for (const record of records) for (const node of record.removedNodes)
        for (const content of contents) if (node === content || node.contains?.(content)) removed.push(content.id);
    });
    observer.observe(document.querySelector('.page-blocks-inner'), {childList: true, subtree: true});
    try {
      key('End'); key('Enter'); await pause(450); key('Tab'); await pause(450);
      assert(removed.length === 0 && contents.every((node, i) => node === document.getElementById('block-content-' + blocks[i + 2].uuid)), {removed});
    } finally { observer.disconnect(); }
  });
  await test('Regression: arrow navigation stays within a frame budget', async () => {
    await fixture(['a'.repeat(600)]); key('Home', {metaKey: true}); await pause(400);
    const samples = [];
    for (let i = 0; i < 60; i++) {
      const start = performance.now();
      key('ArrowRight', {repeat: i > 0});
      samples.push(performance.now() - start);
      await new Promise(requestAnimationFrame);
    }
    const sorted = [...samples].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * .95)];
    assert(p95 < 8.33, {p95, samples});
    assert(input().__lsEd.caret_off === 60, {offset: input().__lsEd.caret_off});
    return {p95, median: sorted[Math.floor(sorted.length / 2)]};
  });
  await test('Regression: edit references retain brackets and URL geometry', async () => {
    const {blocks} = await fixture(['prefix [[reference label]] https://example.com/path tail']);
    key('Escape'); await pause(450);
    const read = document.querySelector('#block-content-' + blocks[0].uuid + ' a.external-link');
    const readStyle = getComputedStyle(read);
    const readText = document.createRange(); readText.selectNodeContents(read);
    const expected = {font: readStyle.font, color: readStyle.color, height: [...readText.getClientRects()].at(-1).height};
    document.getElementById('block-content-' + blocks[0].uuid).click(); await wait(() => input());
    key('Home', {metaKey: true});
    const reference = document.querySelector('.ed-page-ref');
    const url = document.querySelector('.ed-url');
    assert(reference.textContent === '[[reference label]]', {reference: reference.textContent});
    const actual = getComputedStyle(url);
    assert(actual.font === expected.font && actual.color === expected.color && Math.abs(url.getBoundingClientRect().height - expected.height) <= 1,
      {expected, actual: {font: actual.font, color: actual.color, height: url.getBoundingClientRect().height}});
  });
  await test('Regression: entering a rendered reference block reuses loaded titles', async () => {
    key('Escape'); await pause(50);
    const name = 'Loaded reference ' + crypto.randomUUID();
    const target = await logseq.api.create_page(name, {}, {});
    const {blocks} = await fixture(['[[' + target.uuid + ']] [[' + target.uuid + ']]']);
    key('Escape'); await pause(450);
    const original = Worker.prototype.postMessage;
    const requests = [];
    Worker.prototype.postMessage = function(message, ...rest) {
      requests.push(JSON.stringify(message));
      return original.call(this, message, ...rest);
    };
    try {
      document.getElementById('block-content-' + blocks[0].uuid).click();
      await wait(() => input() && document.activeElement === input());
      const pulls = requests.filter(m => m.includes('thread-api/pull'));
      assert(pulls.length === 0 && text().includes(name), {pulls, value: text()});
    } finally { Worker.prototype.postMessage = original; }
  });
  for (const url of ['http://example.com/path', 'https://example.com/path']) {
    await test('Regression: URL deletes character by character ' + url, async () => {
      const {blocks} = await fixture([url]); key('End', {metaKey: true});
      key('Backspace');
      assert(text() === url.slice(0, -1), {value: text()});
      key('Home', {metaKey: true}); key('Delete');
      assert(text() === url.slice(1, -1), {value: text()});
      key('Escape'); await pause(450);
      assert((await logseq.api.get_block(blocks[0].uuid)).content === url.slice(1, -1), {value: text()});
    });
  }
  for (const [opener, closer, pairWithoutSelection] of [
    ['[', ']', true], ['{', '}', true], ['(', ')', true], ['`', '`', true], ['~', '~', true],
    ['*', '*', false], ['_', '_', false], ['^', '^', false], ['=', '=', false], ['/', '/', false], ['+', '+', false], ['$', '$', true],
  ]) {
    await test('Regression: master autopair ' + opener, async () => {
      await fixture(['']); insert(opener);
      assert(text() === (pairWithoutSelection ? opener + closer : opener), {opener, value: text()});
      if (pairWithoutSelection) {
        key('Backspace'); assert(text() === '', {opener, deleted: text()});
      }
      await fixture(['word']); await select(0, 4); insert(opener);
      assert(text() === opener + 'word' + closer, {opener, wrapped: text()});
      insert('X'); assert(text() === opener + 'X' + closer, {opener, replaced: text()});
    });
  }
  await test('Regression: nested reference autopair deletion and overtype', async () => {
    await fixture(['']); insert('['); insert('['); await pause(50);
    assert(text() === '[[]]' && input().__lsEd.caret_off === 2, {value: text(), offset: input().__lsEd.caret_off});
    key('Backspace'); assert(text() === '[]' && input().__lsEd.caret_off === 1, {value: text(), offset: input().__lsEd.caret_off});
    key('Backspace'); assert(text() === '', {value: text()});
    insert('['); insert('['); insert(']'); insert(']');
    assert(text() === '[[]]' && input().__lsEd.caret_off === 4, {value: text(), offset: input().__lsEd.caret_off});
    await fixture(['abc']); key('End'); insert('(');
    assert(text() === 'abc(', {value: text()});
    await fixture(['']); insert('`'); insert('`'); insert('`');
    assert(text() === '``````' && input().__lsEd.caret_off === 3, {value: text(), offset: input().__lsEd.caret_off});
    insert('x'); insert('`'); assert(input().__lsEd.caret_off === 5, {value: text(), offset: input().__lsEd.caret_off});
  });

  await test('Multiline flow preserves empty lines and caret navigation', async () => {
    const {blocks} = await fixture(['first\n\nthird\nlast']);
    key('Home', {metaKey: true});
    const top = document.querySelector('.ed-caret').getBoundingClientRect().top;
    key('ArrowDown'); key('Home');
    const blank = document.querySelector('.ed-caret').getBoundingClientRect().top;
    assert(blank > top + 10, {top, blank});
    insert('B'); key('ArrowDown'); key('Home'); insert('C');
    key('End', {metaKey: true});
    const end = document.querySelector('.ed-caret').getBoundingClientRect().top;
    insert('\n\n');
    const trailing = document.querySelector('.ed-caret').getBoundingClientRect().top;
    assert(trailing > end + 20, {end, trailing});
    key('Backspace'); key('Backspace'); key('Escape'); await pause(450);
    const stored = await logseq.api.get_block(blocks[0].uuid);
    assert(stored.content === 'first\nB\nCthird\nlast', {content: stored.content});
  });
  await test('Multiline flow keeps source spans through selection and reference reveal', async () => {
    await fixture(['first\n[[flow page]]\nlast']);
    key('Home', {metaKey: true});
    for (let i = 0; i < 6; i++) key('ArrowRight');
    const pill = document.querySelector('.ed-pill');
    assert(pill, {text: text()});
    pill.click();
    assert(document.querySelector('.ed-raw') && document.activeElement === input(), {text: text()});
    key('Home', {metaKey: true});
    for (let i = 0; i < 7; i++) key('ArrowRight', {shiftKey: true});
    assert(document.querySelectorAll('.ed-sel').length >= 2, {selection: document.querySelectorAll('.ed-sel').length});
    insert('X');
    assert(text().startsWith('X[flow page]]\nlast'), {text: text()});
  });
  await test('Multiline flow crosses a bounded flow edge into an empty line', async () => {
    const lines = Array.from({length: 65}, (_, i) => 'Line ' + i);
    lines[31] = '[[flow edge]]'; lines[32] = '';
    const {blocks} = await fixture([lines.join('\n')]);
    const expected = (await logseq.api.get_block(blocks[0].uuid)).content.split('\n');
    key('Home', {metaKey: true});
    for (let i = 0; i < 31; i++) key('ArrowDown');
    key('End');
    const edge = document.querySelector('.ed-caret').getBoundingClientRect().top - surface().getBoundingClientRect().top;
    key('ArrowDown'); key('Home');
    const viewportTop = document.querySelector('.ed-caret').getBoundingClientRect().top;
    const blank = viewportTop - surface().getBoundingClientRect().top;
    assert(blank > edge + 10 && viewportTop > 48 && viewportTop < innerHeight - 24,
      {edge, blank, viewportTop, viewportHeight: innerHeight});
    insert('B'); key('ArrowDown'); key('Home'); insert('C');
    key('Escape'); await pause(450);
    expected[32] = 'B'; expected[33] = 'CLine 33';
    const stored = await logseq.api.get_block(blocks[0].uuid);
    assert(stored.content === expected.join('\n'), {content: stored.content});
  });
  await test('Multiline atomic content is rendered once across a flow edge', async () => {
    const prefix = Array(30).fill('plain').join('\n');
    const content = prefix + '\n$$' + Array(20).fill('x').join('\n') + '$$\ntail';
    const {blocks} = await fixture([content]);
    key('Home', {metaKey: true});
    assert(document.querySelectorAll('.ed-pill.ed-latex').length === 1,
      {pills: document.querySelectorAll('.ed-pill.ed-latex').length});
    document.querySelector('.ed-pill.ed-latex').click();
    assert(document.querySelectorAll('.ed-raw.ed-latex').length === 1 && document.activeElement === input(),
      {raw: document.querySelectorAll('.ed-raw.ed-latex').length});
    key('Escape'); await pause(450);
    const stored = await logseq.api.get_block(blocks[0].uuid);
    assert(stored.content === content, {content: stored.content});
  });
  await test('Stationary caret avoids repeated IME anchor style writes', async () => {
    await fixture(['stationary']); key('Home'); await pause(400);
    let writes = 0;
    const observer = new MutationObserver(records => writes += records.length);
    observer.observe(input(), {attributes: true, attributeFilter: ['style']});
    try {
      key('Home'); key('Home'); await pause(30);
      assert(writes === 0, {writes});
    } finally { observer.disconnect(); }
  });

  for (const logical of [false, true]) {
    await test('Outdent configuration ' + (logical ? 'logical' : 'direct'), async () => {
      key('Escape'); await pause(50);
      const prior = await logseq.api.get_current_graph_configs('editor/logical-outdenting?');
      try {
        await logseq.api.set_current_graph_configs({'editor/logical-outdenting?': logical});
        const name = 'Outdent regression ' + crypto.randomUUID();
        const page = await logseq.api.create_page(name, {}, {});
        const parent = await logseq.api.append_block_in_page(name, 'parent', {});
        const before = await logseq.api.insert_block(parent.uuid, 'before', {sibling: false});
        const current = await logseq.api.insert_block(before.uuid, 'abcdef', {sibling: true});
        const after = await logseq.api.insert_block(current.uuid, 'after', {sibling: true});
        const own = await logseq.api.insert_block(current.uuid, 'own', {sibling: false});
        location.hash = '#/page/' + page.uuid;
        await wait(() => document.querySelector('#block-content-' + current.uuid));
        document.querySelector('#block-content-' + current.uuid).click();
        await wait(() => input() && document.activeElement === input());
        await select(2, 2); insert('X'); key('Tab', {shiftKey: true});
        await wait(async () => (await logseq.api.get_page_blocks_tree(page.uuid)).length === 2);
        await pause(150);
        const tree = await logseq.api.get_page_blocks_tree(page.uuid);
        const parentChildren = tree[0].children.map(b => b.uuid);
        const ownChildren = tree[1].children.map(b => b.uuid);
        assert(JSON.stringify(parentChildren) === JSON.stringify(logical ? [before.uuid, after.uuid] : [before.uuid])
          && JSON.stringify(ownChildren) === JSON.stringify(logical ? [own.uuid] : [own.uuid, after.uuid])
          && tree[1].uuid === current.uuid && tree[1].content === 'abXcdef'
          && input()?.id.includes(current.uuid) && document.activeElement === input(),
          {logical, parentChildren, ownChildren, title: tree[1].content, active: input()?.id});
        insert('Y'); key('Escape'); await pause(450);
        const stored = await logseq.api.get_block(current.uuid);
        assert(stored.content === 'abXYcdef', {logical, content: stored.content});
      } finally {
        await logseq.api.set_current_graph_configs({'editor/logical-outdenting?': prior ?? false});
      }
    });
  }

  for (const [kind, left] of [
    ['reference', 'prefix [[merge reference]]'],
    ['tag', 'prefix #merge-tag'],
    ['URL', 'prefix https://example.test/path'],
    ['plain', 'prefix'],
  ]) for (const direction of ['Backspace', 'Delete']) {
    await test('Merge separator ' + kind + ' ' + direction, async () => {
      const {page, blocks} = await fixture([left, 'suffix']);
      const prefix = (await logseq.api.get_block(blocks[0].uuid)).content;
      if (direction === 'Backspace') {
        key('Escape'); await pause(60);
        document.querySelector('#block-content-' + blocks[1].uuid).click();
        await wait(() => input()?.id.includes(blocks[1].uuid) && document.activeElement === input());
        key('Home');
      } else key('End');
      key(direction);
      await wait(async () => (await logseq.api.get_page_blocks_tree(page.uuid)).length === 1);
      await pause(100);
      const stored = await logseq.api.get_block(blocks[0].uuid);
      const expected = prefix + (kind === 'plain' ? '' : ' ') + 'suffix';
      assert(stored.content === expected && input()?.id.includes(blocks[0].uuid)
        && document.activeElement === input(), {kind, direction, expected, actual: stored.content, active: document.activeElement?.id});
      insert('X'); key('Escape'); await pause(450);
      const continued = await logseq.api.get_block(blocks[0].uuid);
      assert(continued.content === expected.replace(/suffix$/, 'Xsuffix'),
        {kind, direction, actual: continued.content});
    });
  }

  await test('Unicode before an opening parenthesis', async () => {
    await fixture(['中文😀']);
    key('End'); insert('('); await pause(30);
    assert(text() === '中文😀(', {text: text()});
  });
  await test('Enter replaces selected text', async () => {
    const {page} = await fixture(['abcDEFghi']);
    await select(3, 6); key('Enter'); await pause(600);
    const blocks = await logseq.api.get_page_blocks_tree(page.uuid);
    const titles = blocks.map(block => block.content);
    assert(JSON.stringify(titles) === JSON.stringify(['abc', 'ghi']), {titles});
  });
  await test('Enter at start preserves content identity and children', async () => {
    const {page, blocks} = await fixture(['original'], true);
    key('Home'); key('Enter'); await pause(600);
    const tree = await logseq.api.get_page_blocks_tree(page.uuid);
    assert(tree.length === 2 && tree[0].content === '' && tree[1].uuid === blocks[0].uuid
      && tree[1].content === 'original' && tree[1].children.length === 1, {tree});
  });
  for (const [title, prefix, lo, hi, remaining] of [
    ['selected suffix', '', 0, 9, 'suffix'],
    ['original', '  ', 2, 2, 'original'],
    ['selected suffix', '  ', 2, 11, 'suffix'],
  ]) await test('Enter before nonblank suffix preserves identity ' + prefix + title, async () => {
    const {page, blocks} = await fixture([title], true);
    if (prefix) { key('Home'); insert(prefix); }
    await select(lo, hi); key('Enter');
    await pause(600);
    const tree = await logseq.api.get_page_blocks_tree(page.uuid);
    assert(tree[0].content === '' && tree[1].uuid === blocks[0].uuid
      && tree[1].content === remaining && tree[1].children.length === 1
      && input()?.id.includes(tree[0].uuid) && document.activeElement === input(),
      {title, lo, hi, tree, active: document.activeElement?.id});
  });
  await test('Enter at zoomed root start inserts a child', async () => {
    const {page, blocks} = await fixture(['zoomed root']);
    key('Escape'); await pause(50);
    location.hash = '#/block/' + blocks[0].uuid;
    await wait(() => document.querySelector('[data-cid="zoom-' + blocks[0].uuid + '"] #block-content-' + blocks[0].uuid));
    document.querySelector('#block-content-' + blocks[0].uuid).click();
    await wait(() => input()?.id.includes(blocks[0].uuid) && document.activeElement === input());
    key('Home'); key('Enter'); await pause(600);
    const tree = await logseq.api.get_page_blocks_tree(page.uuid);
    const stored = tree.find(b => b.uuid === blocks[0].uuid);
    assert(stored.content === '' && stored.children.length === 1
      && stored.children[0].content === 'zoomed root', {tree});
  });
  await test('Cancelling IME preserves selection text', async () => {
    await fixture(['abcDEFghi']); await select(3, 6);
    composition('start'); composition('update', '中'); composition('end');
    await pause(30); assert(text() === 'abcDEFghi', {text: text()});
  });
  await test('IME preedit is visible and committed only once', async () => {
    const {blocks} = await fixture(['abcDEFghi']); await select(3, 6);
    composition('start'); composition('update', '中文'); await pause(30);
    assert(text() === 'abc中文ghi', {text: text()});
    await pause(450);
    const stored = await logseq.api.get_block(blocks[0].uuid);
    assert(stored.content === 'abcDEFghi', {stored});
    composition('end', '中文'); await pause(30);
    assert(text() === 'abc中文ghi', {text: text()});
  });
  await test('IME owns candidate arrows and structural shortcuts', async () => {
    await fixture(['first', 'second']); const original = input().id;
    key('End'); composition('start'); composition('update', '中');
    key('ArrowDown', {isComposing: true}); await pause(30);
    assert(input()?.id === original, {original, active: input()?.id});
    key('Enter', {shiftKey: true, isComposing: true});
    key('Delete', {isComposing: true}); await pause(30);
    composition('end'); await pause(30);
    assert(input()?.id === original && text() === 'first', {text: text(), active: input()?.id});
  });
  await test('Clipboard shortcuts reach native clipboard events', async () => {
    await fixture(['clipboard']);
    const prevented = ['c', 'x', 'v'].map(name => key(name, {metaKey: true}).defaultPrevented);
    assert(prevented.every(value => !value), {prevented});
  });
  await test('Caret follows insertion on the next frame without remount', async () => {
    await fixture(['ab']); key('End'); await pause(20);
    const caret = document.querySelector('.ed-caret');
    const before = caret.getBoundingClientRect().x; insert('x');
    await new Promise(resolve => requestAnimationFrame(resolve));
    const current = document.querySelector('.ed-caret');
    assert(current === caret && current.getBoundingClientRect().x > before,
      {exists: !!current, same: current === caret, before, after: current?.getBoundingClientRect().x});
  });
  await test('Caret geometry is measured after the content patch once', async () => {
    await fixture(['geometry']); key('End'); await pause(30);
    let calls = 0;
    const original = Range.prototype.getClientRects;
    Range.prototype.getClientRects = function (...args) {
      calls++; return Reflect.apply(original, this, args);
    };
    try { insert('X'); }
    finally { Range.prototype.getClientRects = original; }
    assert(calls === 1 && text() === 'geometryX', {calls, text: text()});
  });
  await test('IME input anchor follows the visible caret after insertion', async () => {
    await fixture(['anchor']); key('End'); insert('XYZ');
    const scratch = input().getBoundingClientRect();
    const caret = document.querySelector('.ed-caret').getBoundingClientRect();
    assert(Math.abs(scratch.x - caret.x) <= 1 && Math.abs(scratch.y - caret.y) <= 1,
      {scratch: scratch.toJSON(), caret: caret.toJSON()});
  });
  await test('Remount key is consumed by one owner', async () => {
    const {blocks} = await fixture(['ownership']);
    let targetCalls = 0;
    const target = event => { if (event.key === 'Home') targetCalls++; };
    document.body.addEventListener('keydown', target);
    try {
      document.body.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Home', bubbles: true, cancelable: true,
      }));
      insert('X'); key('Escape'); await pause(450);
      const stored = await logseq.api.get_block(blocks[0].uuid);
      assert(targetCalls === 0 && stored.content === 'Xownership',
        {targetCalls, content: stored.content});
    } finally { document.body.removeEventListener('keydown', target); }
  });
  await test('Measured line navigation publishes the new caret', async () => {
    await fixture(['alpha beta']);
    key('End', {metaKey: true});
    assert(input().__lsEd.caret_off === 10, {phase: 'end', caret: input().__lsEd.caret_off});
    key('Home');
    assert(input().__lsEd.caret_off === 0, {phase: 'home', caret: input().__lsEd.caret_off});
    key('End');
    assert(input().__lsEd.caret_off === 10, {phase: 'end again', caret: input().__lsEd.caret_off});
  });
  await test('Immediate Undo and Redo preserve typed text', async () => {
    const {blocks} = await fixture(['base']); key('End'); insert('suffix');
    key('z', {metaKey: true}); await pause(600);
    key('z', {metaKey: true, shiftKey: true}); await pause(600);
    const stored = await logseq.api.get_block(blocks[0].uuid);
    assert(stored?.content === 'basesuffix', {stored, text: text()});
  });
  await test('Rejected autosave keeps unsaved text dirty', async () => {
    const {blocks} = await fixture(['base']); key('End');
    const original = Worker.prototype.postMessage;
    let rejected = false;
    Worker.prototype.postMessage = function (message, ...rest) {
      if (!rejected && message.argumentList?.[0]?.value === 'thread-api/apply-outliner-ops') {
        rejected = true; throw new Error('Injected editor save rejection');
      }
      return Reflect.apply(original, this, [message, ...rest]);
    };
    try { insert('suffix'); await pause(500); }
    finally { Worker.prototype.postMessage = original; }
    assert(rejected, {rejected});
    await logseq.api.update_block(blocks[0].uuid, 'remote'); await pause(600);
    assert(text() === 'basesuffix', {text: text()});
    key('Escape'); await pause(450);
    const stored = await logseq.api.get_block(blocks[0].uuid);
    assert(stored.content === 'basesuffix', {stored});
  });
  await test('Rejected Enter restores the original editor and queued input', async () => {
    const {page, blocks} = await fixture(['before']); key('End');
    const original = Worker.prototype.postMessage;
    let rejected = false;
    Worker.prototype.postMessage = function (message, ...rest) {
      if (!rejected && message.argumentList?.[0]?.value === 'thread-api/apply-outliner-ops'
        && message.argumentList?.[1]?.value.includes('insert-blocks')) {
        rejected = true; throw new Error('Injected editor insertion rejection');
      }
      return Reflect.apply(original, this, [message, ...rest]);
    };
    try { key('Enter'); insert('X'); await pause(600); }
    finally { Worker.prototype.postMessage = original; }
    assert(rejected && input()?.id.includes(blocks[0].uuid)
      && document.activeElement === input() && text() === 'beforeX',
      {rejected, input: input()?.id, active: document.activeElement?.id, text: text()});
    key('Escape'); await pause(450);
    const tree = await logseq.api.get_page_blocks_tree(page.uuid);
    assert(tree.length === 1 && tree[0].content === 'beforeX', {tree});
  });
  for (const direction of ['Backspace', 'Delete']) {
    await test('Rejected merge preparation releases input ' + direction, async () => {
      const {page, blocks} = await fixture(direction === 'Backspace'
        ? ['prefix [[failure reference]]', 'suffix']
        : ['prefix', 'suffix [[failure reference]]']);
      let current = blocks[0];
      if (direction === 'Backspace') {
        key('Escape'); await pause(50); current = blocks[1];
        document.querySelector('#block-content-' + current.uuid).click();
        await wait(() => input()?.id.includes(current.uuid) && document.activeElement === input());
        key('Home');
      } else key('End');
      const prior = text();
      const original = Worker.prototype.postMessage;
      let rejected = false;
      Worker.prototype.postMessage = function (message, ...rest) {
        if (!rejected && message.argumentList?.[0]?.value === 'thread-api/get-case-page'
          && message.argumentList?.[1]?.value.includes('failure reference')) {
          rejected = true; throw new Error('Injected editor reference rejection');
        }
        return Reflect.apply(original, this, [message, ...rest]);
      };
      try { key(direction); await pause(120); }
      finally { Worker.prototype.postMessage = original; }
      assert(rejected, {rejected});
      insert('X'); await pause(40);
      assert(text() === (direction === 'Backspace' ? 'X' + prior : prior + 'X')
        && input()?.id.includes(current.uuid) && document.activeElement === input(),
        {direction, prior, text: text(), active: document.activeElement?.id});
      key('Escape'); await pause(450);
      const tree = await logseq.api.get_page_blocks_tree(page.uuid);
      assert(tree.length === 2, {tree});
    });
  }
  await test('Pending merge cannot move queued text across an explicit block click', async () => {
    const {page, blocks} = await fixture(['prefix', 'suffix', 'other']);
    key('Escape'); await pause(50);
    document.querySelector('#block-content-' + blocks[1].uuid).click();
    await wait(() => input()?.id.includes(blocks[1].uuid) && document.activeElement === input());
    key('Home');
    const original = Worker.prototype.postMessage;
    let held;
    Worker.prototype.postMessage = function (message, ...rest) {
      if (!held && message.argumentList?.[0]?.value === 'thread-api/apply-outliner-ops'
        && message.argumentList?.[1]?.value.includes('delete-blocks')) {
        held = [this, message, rest]; return;
      }
      return Reflect.apply(original, this, [message, ...rest]);
    };
    try {
      key('Backspace'); await wait(() => held);
      insert('X');
      document.querySelector('#block-content-' + blocks[2].uuid).click();
      insert('Y');
      const [worker, message, rest] = held;
      Worker.prototype.postMessage = original;
      Reflect.apply(original, worker, [message, ...rest]); held = undefined;
      await wait(() => input()?.id.includes(blocks[2].uuid) && document.activeElement === input());
      await pause(600);
      assert(input()?.id.includes(blocks[2].uuid) && text() === 'otherY'
        && document.activeElement === input(), {text: text(), active: document.activeElement?.id});
      key('Escape'); await pause(450);
      const tree = await logseq.api.get_page_blocks_tree(page.uuid);
      assert(tree.length === 2 && tree[0].content === 'prefixXsuffix'
        && tree[1].content === 'otherY', {tree});
    } finally {
      Worker.prototype.postMessage = original;
      if (held) Reflect.apply(original, held[0], [held[1], ...held[2]]);
    }
  });
  await test('Repeated Enter and Backspace preserve exact block count and focus', async () => {
    const {page} = await fixture(['held']); key('End');
    for (let i = 0; i < 20; i++) { key('Enter', {repeat: i > 0}); await pause(20); }
    try { await wait(async () => (await logseq.api.get_page_blocks_tree(page.uuid)).length === 21); }
    catch (error) { throw new Error(JSON.stringify({phase: 'held Enter', tree: await logseq.api.get_page_blocks_tree(page.uuid)})); }
    let tree = await logseq.api.get_page_blocks_tree(page.uuid);
    assert(tree.length === 21 && input() && document.activeElement === input(), {count: tree.length, active: document.activeElement?.id});
    for (let i = 0; i < 20; i++) { key('Backspace', {repeat: i > 0}); await pause(20); }
    try { await wait(async () => (await logseq.api.get_page_blocks_tree(page.uuid)).length === 1); }
    catch (error) { throw new Error(JSON.stringify({phase: 'held Backspace', tree: await logseq.api.get_page_blocks_tree(page.uuid)})); }
    tree = await logseq.api.get_page_blocks_tree(page.uuid);
    assert(tree.length === 1 && tree[0].content === 'held' && document.activeElement === input(), {tree, active: document.activeElement?.id});
  });
  await test('Repeated Delete preserves the merge boundary and preceding text', async () => {
    const {page} = await fixture(['first', 'A', 'B', 'C', 'D']); key('End');
    for (let i = 0; i < 4; i++) { key('Delete', {repeat: i > 0}); await pause(10); }
    await pause(800);
    const tree = await logseq.api.get_page_blocks_tree(page.uuid);
    assert(JSON.stringify(tree.map(b => b.content)) === JSON.stringify(['first', 'C', 'D']), {tree, text: text()});
  });
  await test('Rejected optimistic split preserves subsequent input and splits', async () => {
    const {page} = await fixture(['before']); key('End');
    const original = Worker.prototype.postMessage;
    let held, released = false, rejected = false;
    Worker.prototype.postMessage = function (message, ...rest) {
      if (message.argumentList?.[0]?.value === 'thread-api/apply-outliner-ops'
        && message.argumentList?.[1]?.value.includes('insert-blocks')) {
        if (!held) { held = [this, message, rest]; return; }
        if (released && !rejected) {
          rejected = true; throw new Error('Injected second optimistic insertion rejection');
        }
      }
      return Reflect.apply(original, this, [message, ...rest]);
    };
    try {
      key('Enter'); await wait(() => held); insert('A');
      key('Enter'); insert('B'); key('Enter'); insert('C');
      released = true; Reflect.apply(original, held[0], [held[1], ...held[2]]);
      await pause(1500);
      assert(rejected && text() === 'C' && document.activeElement === input(),
        {rejected, text: text(), active: document.activeElement?.id});
      key('Escape'); await pause(450);
      const tree = await logseq.api.get_page_blocks_tree(page.uuid);
      assert(JSON.stringify(tree.map(b => b.content)) === JSON.stringify(['before', 'AB', 'C']), {tree});
    } finally {
      Worker.prototype.postMessage = original;
      if (held && !released) Reflect.apply(original, held[0], [held[1], ...held[2]]);
      await pause(500);
    }
  });
  await test('Optimistic Enter paints text and pointer moves before worker completion', async () => {
    const {page} = await fixture(['before']); key('End');
    const original = Worker.prototype.postMessage;
    let held;
    Worker.prototype.postMessage = function (message, ...rest) {
      if (!held && message.argumentList?.[0]?.value === 'thread-api/apply-outliner-ops'
        && message.argumentList?.[1]?.value.includes('insert-blocks')) {
        held = [this, message, rest]; return;
      }
      return Reflect.apply(original, this, [message, ...rest]);
    };
    try {
      key('Enter'); await wait(() => held);
      for (let i = 0; i < 6; i++) {
        if (i) key('Enter');
        insert('row' + i);
        await pause(20);
        assert(text() === 'row' + i && input().__lsEd.caret_off === 4,
          {phase: 'pending insert', i, text: text(), caret: input().__lsEd.caret_off});
      }
      const run = surface().querySelector('.ed-r');
      const range = document.createRange(); range.setStart(run.firstChild, 1); range.collapse(true);
      const rect = range.getBoundingClientRect();
      run.dispatchEvent(new MouseEvent('mousedown', {
        clientX: rect.x, clientY: rect.y + rect.height / 2,
        button: 0, buttons: 1, bubbles: true, cancelable: true,
      }));
      document.dispatchEvent(new MouseEvent('mouseup', {button: 0, bubbles: true}));
      assert(input().__lsEd.caret_off === 1,
        {phase: 'pending pointer', caret: input().__lsEd.caret_off});
      insert('!');
      Worker.prototype.postMessage = original;
      Reflect.apply(original, held[0], [held[1], ...held[2]]); held = undefined;
      await pause(1500);
      assert(text() === 'r!ow5' && input().__lsEd.caret_off === 2
        && document.activeElement === input(),
        {phase: 'settled caret', text: text(), caret: input().__lsEd.caret_off});
      key('Escape'); await pause(450);
      const tree = await logseq.api.get_page_blocks_tree(page.uuid);
      assert(JSON.stringify(tree.map(b => b.content)) ===
        JSON.stringify(['before', 'row0', 'row1', 'row2', 'row3', 'row4', 'r!ow5']), {tree});
      return {count: tree.length, contents: tree.map(b => b.content)};
    } finally {
      Worker.prototype.postMessage = original;
      if (held) Reflect.apply(original, held[0], [held[1], ...held[2]]);
      await pause(500);
    }
  });
  await test('Text typed immediately after Enter belongs to the new block', async () => {
    const {page} = await fixture(['before']); key('End'); key('Enter'); insert('after');
    await pause(900);
    const tree = await logseq.api.get_page_blocks_tree(page.uuid);
    assert(tree.length === 2 && tree[0].content === 'before' && tree[1].content === 'after', {tree});
  });
  await test('Indent and outdent preserve identity, children and live text', async () => {
    const {page, blocks} = await fixture(['parent', 'sibling']);
    key('Escape'); await pause(30);
    document.querySelector('[data-block-title="sibling"] .block-content').click();
    await wait(() => input()?.dataset.blockId === blocks[1].uuid && document.activeElement === input());
    key('End'); insert('typed'); key('Tab'); await pause(500);
    let tree = await logseq.api.get_page_blocks_tree(page.uuid);
    assert(tree.length === 1 && tree[0].children[0]?.uuid === blocks[1].uuid
      && tree[0].children[0].content === 'siblingtyped', {tree});
    key('Tab', {shiftKey: true}); await pause(500);
    tree = await logseq.api.get_page_blocks_tree(page.uuid);
    assert(tree.length === 2 && tree[1].uuid === blocks[1].uuid && tree[1].content === 'siblingtyped', {tree});
  });
  await test('Caret keeps blinking during continuous text input', async () => {
    await fixture(['blink']); key('End'); await pause(20);
    const caret = document.querySelector('.ed-caret');
    const animation = caret.getAnimations()[0];
    assert(animation, {animation: getComputedStyle(caret).animationName});
    const start = animation.currentTime;
    for (let i = 0; i < 50; i++) {
      insert('x'); await pause(20);
      assert(document.querySelector('.ed-caret') === caret, {at: i});
    }
    assert(animation.currentTime > start + 700 && document.activeElement === input(),
      {start, end: animation.currentTime, active: document.activeElement?.id});
  });
  const paste = (target, value) => {
    const data = new DataTransfer();
    data.setData('text/plain', value);
    const event = new ClipboardEvent('paste', {clipboardData: data, bubbles: true, cancelable: true});
    target.dispatchEvent(event);
    return event;
  };
  await test('Review follow-up: autosave preserves whitespace until exit', async () => {
    const {blocks} = await fixture(['base']);
    key('a', {metaKey: true}); insert('  value  '); await pause(650);
    const saved = (await logseq.api.get_block(blocks[0].uuid)).content;
    assert(saved === '  value  ' && text() === '  value  ', {saved, value: text()});
    key('Escape'); await pause(450);
    assert((await logseq.api.get_block(blocks[0].uuid)).content === 'value', {phase: 'exit'});
  });
  await test('Review follow-up: opening and switching ordinary blocks trim at the boundary', async () => {
    const {blocks} = await fixture(['base', 'other']);
    key('a', {metaKey: true}); insert('  first  '); await pause(650);
    document.getElementById('block-content-' + blocks[1].uuid).click();
    await wait(() => input()?.id.endsWith(blocks[1].uuid)); await pause(450);
    assert((await logseq.api.get_block(blocks[0].uuid)).content === 'first', {phase: 'switch'});
    key('Escape'); await pause(450);
    await logseq.api.update_block(blocks[0].uuid, '  externally spaced  ');
    await pause(450); document.getElementById('block-content-' + blocks[0].uuid).click();
    await wait(() => input()?.id.endsWith(blocks[0].uuid));
    assert(text() === 'externally spaced', {phase: 'open', value: text()});
  });
  for (const navigate of [false, true]) {
    await test('Review follow-up: trim when leaving through ' + (navigate ? 'navigation' : 'blur'), async () => {
      const {blocks} = await fixture(['base']);
      key('a', {metaKey: true}); insert('  boundary  '); await pause(650);
      if (navigate) location.hash = '#/all-pages';
      else document.getElementById('head').dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
      await pause(650);
      const saved = (await logseq.api.get_block(blocks[0].uuid)).content;
      assert(saved === 'boundary' && !input(), {saved, editing: input()?.id});
    });
  }
  await test('Review follow-up: heading autosave retains trailing whitespace', async () => {
    const {blocks} = await fixture(['base']);
    key('a', {metaKey: true}); insert('## heading  '); await pause(650);
    const saved = (await logseq.api.get_block(blocks[0].uuid)).content;
    assert(saved === 'heading  ', {saved});
    key('Escape'); await pause(450);
    assert((await logseq.api.get_block(blocks[0].uuid)).content === 'heading', {phase: 'exit'});
  });
  await test('Review follow-up: splitting trims the block that leaves editing', async () => {
    const {blocks} = await fixture(['base']);
    key('a', {metaKey: true}); insert('  split boundary  '); key('End'); key('Enter');
    await pause(650);
    const saved = (await logseq.api.get_block(blocks[0].uuid)).content;
    assert(saved === 'split boundary' && !input()?.id.endsWith(blocks[0].uuid)
      && text() === '', {saved, editing: input()?.id, value: text()});
  });
  for (const exit of [false, true]) {
    await test('Review follow-up: newer save wins delayed reference parsing' + (exit ? ' on exit' : ''), async () => {
      const {blocks} = await fixture(['base']);
      const original = Worker.prototype.postMessage;
      let held, released = false;
      Worker.prototype.postMessage = function(message, ...rest) {
        if (!held && message.argumentList?.[0]?.value === 'thread-api/get-case-page') {
          held = {worker: this, message, rest}; return;
        }
        return Reflect.apply(original, this, [message, ...rest]);
      };
      try {
        key('a', {metaKey: true}); insert('old [[Save order ' + crypto.randomUUID() + ']]');
        await wait(() => held);
        key('a', {metaKey: true}); insert('newer');
        if (exit) key('Escape');
        await pause(650);
        released = true; Reflect.apply(original, held.worker, [held.message, ...held.rest]);
        await pause(800);
        const saved = (await logseq.api.get_block(blocks[0].uuid)).content;
        assert(saved === 'newer', {saved, exit, live: text()});
      } finally {
        Worker.prototype.postMessage = original;
        if (held && !released) Reflect.apply(original, held.worker, [held.message, ...held.rest]);
      }
    });
  }
  await test('Review follow-up: code source survives save, exit and remount verbatim', async () => {
    const {page, blocks} = await fixture(['']);
    document.dispatchEvent(new CustomEvent('ls:editor-command', {detail: {command: 'code-block', from: 0, to: 0}}));
    await wait(() => document.querySelector('.CodeMirror')?.CodeMirror);
    const cm = document.querySelector('.CodeMirror').CodeMirror;
    const source = '  #literal [[not a page]]\n';
    cm.focus(); cm.setValue(source); await pause(650);
    const saved = await logseq.api.get_block(blocks[0].uuid);
    assert(saved.content === source, {phase: 'autosave', saved, widget: cm.getValue()});
    cm.getOption('extraKeys').Esc(cm); await pause(450);
    assert((await logseq.api.get_block(blocks[0].uuid)).content === source, {phase: 'exit'});
    await fixture(['temporary route']); location.hash = '#/page/' + page.uuid;
    await wait(() => document.querySelector('.CodeMirror')?.CodeMirror);
    const reopened = document.querySelector('.CodeMirror').CodeMirror;
    reopened.focus(); await pause(100);
    assert(reopened.getValue() === source, {phase: 'reopen', value: reopened.getValue()});
    reopened.getOption('extraKeys').Esc(reopened); await pause(450);
  });
  await test('Review follow-up: math source preserves whitespace and literal references', async () => {
    const {blocks} = await fixture(['']);
    document.dispatchEvent(new CustomEvent('ls:editor-command', {detail: {command: 'math-block', from: 0, to: 0}}));
    await pause(450); key('a', {metaKey: true}); insert('  #literal [[not a page]]\n'); await pause(650);
    const source = '  #literal [[not a page]]\n';
    const saved = await logseq.api.get_block(blocks[0].uuid);
    assert(saved.content === source, {phase: 'autosave', saved, value: text()});
    key('Escape'); await pause(450);
    assert((await logseq.api.get_block(blocks[0].uuid)).content === source, {phase: 'exit'});
  });
  await test('Review follow-up: search input owns copy and cut with block selection', async () => {
    const {blocks} = await fixture(['must remain']); key('Escape'); await pause(100);
    document.querySelector('[aria-label="Search"]').click();
    await wait(() => document.querySelector('.cp__cmdk-search-input'));
    const field = document.querySelector('.cp__cmdk-search-input');
    field.value = 'query'; field.focus(); field.select();
    const prevented = [];
    for (const type of ['copy', 'cut']) {
      const data = new DataTransfer();
      const event = new ClipboardEvent(type, {clipboardData: data, bubbles: true, cancelable: true});
      field.dispatchEvent(event); prevented.push(event.defaultPrevented);
    }
    await pause(650);
    document.querySelector('[aria-label="Search"]').click();
    await wait(() => !document.querySelector('.cp__cmdk-search-input'));
    await wait(() => document.activeElement === document.querySelector('[aria-label="Search"]'));
    assert(prevented.every(v => !v) && (await logseq.api.get_block(blocks[0].uuid))?.content === 'must remain', {prevented});
  });
  await test('Review follow-up: plain external paste resolves fresh tags and page references', async () => {
    const {page} = await fixture(['target']); key('Escape'); await pause(100);
    const tag = 'paste-tag-' + crypto.randomUUID();
    const ref = 'Paste page ' + crypto.randomUUID();
    paste(document.body, 'hello #' + tag + ' [[' + ref + ']]'); await pause(800);
    const tree = await logseq.api.get_page_blocks_tree(page.uuid);
    assert(tree.length === 2 && tree[1].content.startsWith('hello #')
      && tree[1].tags?.some(t => t.name === tag)
      && tree[1].refs?.some(r => r.name === ref.toLowerCase()), {tree});
    assert(await logseq.api.get_page(tag), {tag});
    assert(await logseq.api.get_page(ref), {ref});
  });
  await test('Review follow-up: delayed structured paste preserves a later editing session', async () => {
    const {page, blocks} = await fixture(['target', 'other']);
    const original = Worker.prototype.postMessage;
    let held, released = false;
    Worker.prototype.postMessage = function(message, ...rest) {
      if (!held && message.argumentList?.[0]?.value === 'thread-api/paste-extract-blocks') {
        held = {worker: this, message, rest}; return;
      }
      return Reflect.apply(original, this, [message, ...rest]);
    };
    try {
      paste(input(), '- pasted one\n- pasted two'); await wait(() => held);
      document.getElementById('block-content-' + blocks[1].uuid).click();
      await wait(() => input()?.id.endsWith(blocks[1].uuid)); key('End'); insert(' AFTER');
      released = true; Reflect.apply(original, held.worker, [held.message, ...held.rest]);
      await pause(800);
      assert(input()?.id.endsWith(blocks[1].uuid) && text() === 'other AFTER', {input: input()?.id, value: text()});
      const tree = await logseq.api.get_page_blocks_tree(page.uuid);
      assert(tree.length === 4, {tree});
    } finally {
      Worker.prototype.postMessage = original;
      if (held && !released) Reflect.apply(original, held.worker, [held.message, ...held.rest]);
    }
  });
  await test('Review follow-up: Enter reopens the selected sidebar occurrence', async () => {
    const {page, blocks} = await fixture(['shared occurrence']); key('Escape'); await pause(100);
    await logseq.api.open_in_right_sidebar(page.uuid);
    const selector = '[data-cid="sidebar"] #block-content-' + blocks[0].uuid;
    await wait(() => document.querySelector(selector));
    document.querySelector(selector).click(); await wait(() => input()?.closest('[data-cid]')?.dataset.cid === 'sidebar');
    key('Escape'); await pause(100); key('Enter'); await pause(300);
    assert(input()?.closest('[data-cid]')?.dataset.cid === 'sidebar', {scope: input()?.closest('[data-cid]')?.dataset.cid});
  });
  await test('Review follow-up: vertical navigation does bounded fragment discovery', async () => {
    await fixture([Array.from({length: 500}, (_, i) => 'Line ' + i + ' **bold** and `code` https://example.com').join('\n')]);
    key('Home', {metaKey: true}); await pause(30);
    const original = Element.prototype.querySelectorAll;
    let visits = 0, queries = 0;
    Element.prototype.querySelectorAll = function(selector) {
      const result = Reflect.apply(original, this, [selector]);
      if (selector === '.ed-r') { visits += result.length; queries++; }
      return result;
    };
    try {
      key('ArrowDown', {shiftKey: true}); await pause(30);
      const fragments = Reflect.apply(original, surface(), ['.ed-r']).length;
      assert(visits <= fragments * 12, {visits, queries, fragments});
      assert(input().__lsEd.caret_off > 0, {offset: input().__lsEd.caret_off});
      return {visits, queries, fragments};
    } finally { Element.prototype.querySelectorAll = original; }
  });
  await test('Review follow-up: unmatched bracket input stays within the long-text budget', async () => {
    await fixture([('item [unfinished\n').repeat(2000)]); key('End', {metaKey: true});
    const samples = [];
    for (let i = 0; i < 10; i++) {
      await new Promise(requestAnimationFrame);
      const start = performance.now(); insert('x'); samples.push(performance.now() - start);
    }
    const median = [...samples].sort((a, b) => a - b)[4];
    assert(median < 20, {median, samples}); return {median, samples};
  });
  await test('Review: rejected exit preserves input received during saving', async () => {
    const {blocks} = await fixture(['base']); key('End'); insert('before');
    const original = Worker.prototype.postMessage;
    let rejected = false;
    Worker.prototype.postMessage = function(message, ...rest) {
      if (!rejected && message.argumentList?.[0]?.value === 'thread-api/apply-outliner-ops') {
        rejected = true; throw new Error('Injected exit save rejection');
      }
      return Reflect.apply(original, this, [message, ...rest]);
    };
    try { key('Escape'); insert('AFTER'); await pause(650); }
    finally { Worker.prototype.postMessage = original; }
    assert(rejected && text() === 'basebeforeAFTER', {rejected, value: text()});
    key('Escape'); await pause(450);
    assert((await logseq.api.get_block(blocks[0].uuid)).content === 'basebeforeAFTER', {mode: 'persisted'});
  });
  await test('Review: structured paste waits for optimistic split persistence', async () => {
    const {page} = await fixture(['base']); key('End');
    const original = Worker.prototype.postMessage;
    let held;
    Worker.prototype.postMessage = function(message, ...rest) {
      if (!held && message.argumentList?.[0]?.value === 'thread-api/apply-outliner-ops'
          && message.argumentList?.[1]?.value.includes('insert-blocks')) {
        held = {worker: this, message, rest}; return;
      }
      return Reflect.apply(original, this, [message, ...rest]);
    };
    try {
      key('Enter'); await wait(() => held && input());
      paste(input(), '- pasted one\n- pasted two'); await pause(120);
      Reflect.apply(original, held.worker, [held.message, ...held.rest]);
      await pause(700);
    } finally { Worker.prototype.postMessage = original; }
    key('Escape'); await pause(450);
    const titles = (await logseq.api.get_page_blocks_tree(page.uuid)).map(b => b.content);
    assert(titles.join('|') === 'base|pasted one|pasted two', {titles});
  });
  await test('Review: link form owns its clipboard paste', async () => {
    await fixture(['link source']); key('l', {metaKey: true});
    await wait(() => document.querySelector('.ls-editor-link-form input'));
    const field = document.querySelector('.ls-editor-link-form input'); field.focus();
    const event = paste(field, 'https://example.com');
    assert(!event.defaultPrevented && text() === 'link source', {prevented: event.defaultPrevented, value: text()});
    key('Escape');
  });
  await test('Review: normal paste uses current external clipboard content', async () => {
    const {page} = await fixture(['internal original']); key('Escape'); await pause(100);
    const data = new DataTransfer();
    document.body.dispatchEvent(new ClipboardEvent('copy', {clipboardData: data, bubbles: true, cancelable: true}));
    assert(data.getData('text/plain').includes('internal original'), {copied: data.getData('text/plain')});
    paste(document.body, 'external replacement'); await pause(650); key('Escape'); await pause(450);
    const titles = (await logseq.api.get_page_blocks_tree(page.uuid)).map(b => b.content);
    assert(titles.join('|') === 'internal original|external replacement', {titles});
  });
  await test('Review: sidebar navigation and selection stay in their tree', async () => {
    await fixture(['main block']); key('Escape'); await pause(100);
    const name = 'Sidebar review ' + crypto.randomUUID();
    const page = await logseq.api.create_page(name, {}, {});
    const first = await logseq.api.append_block_in_page(name, 'sidebar first', {});
    const second = await logseq.api.append_block_in_page(name, 'sidebar second', {});
    await logseq.api.open_in_right_sidebar(page.uuid);
    await wait(() => document.getElementById('block-content-' + first.uuid));
    const content = document.getElementById('block-content-' + first.uuid);
    content.scrollIntoView(); content.click(); await wait(() => input()?.id.endsWith(first.uuid));
    key('End'); key('ArrowDown'); await pause(350);
    assert(input()?.id.endsWith(second.uuid), {input: input()?.id, expected: second.uuid});
    key('Home'); key('ArrowUp'); await pause(350);
    assert(input()?.id.endsWith(first.uuid), {input: input()?.id, expected: first.uuid});
    key('Escape'); await pause(100);
    const copied = new DataTransfer();
    document.body.dispatchEvent(new ClipboardEvent('copy', {clipboardData: copied, bubbles: true, cancelable: true}));
    assert(copied.getData('text/plain') === '- sidebar first\n', {copied: copied.getData('text/plain')});
  });
  await test('Review: navigation resets selection to the current page tree', async () => {
    const {blocks} = await fixture(['old zoom']); key('Escape'); await pause(100);
    location.hash = '#/block/' + blocks[0].uuid;
    await wait(() => document.querySelector('[data-cid="zoom-' + blocks[0].uuid + '"]'));
    document.getElementById('block-content-' + blocks[0].uuid).click(); await wait(() => input());
    key('Escape'); await pause(100);
    const name = 'Selection navigation ' + crypto.randomUUID();
    const page = await logseq.api.create_page(name, {}, {});
    const block = await logseq.api.append_block_in_page(name, 'current page', {});
    location.hash = '#/page/' + page.uuid;
    await wait(() => document.getElementById('block-content-' + block.uuid));
    key('a', {metaKey: true, shiftKey: true}); await pause(50);
    const copied = new DataTransfer();
    document.body.dispatchEvent(new ClipboardEvent('copy', {clipboardData: copied, bubbles: true, cancelable: true}));
    assert(copied.getData('text/plain') === '- current page\n', {copied: copied.getData('text/plain')});
  });
  await test('Review: reopening an editor releases selection subscriptions', async () => {
    const {blocks} = await fixture(['selection lifecycle']);
    const original = Selection.prototype.removeAllRanges;
    let updates = 0;
    Selection.prototype.removeAllRanges = function(...args) { updates++; return Reflect.apply(original, this, args); };
    const selectWord = async () => {
      key('Home', {metaKey: true}); await pause(30); updates = 0;
      key('ArrowRight', {shiftKey: true}); await pause(30); return updates;
    };
    try {
      const before = await selectWord();
      for (let i = 0; i < 5; i++) {
        key('Escape'); await pause(100);
        document.getElementById('block-content-' + blocks[0].uuid).click(); await wait(() => input()); await pause(50);
      }
      const after = await selectWord(); assert(before === 1 && after === before, {before, after});
    } finally { Selection.prototype.removeAllRanges = original; }
  });
  await test('Review: editor unmount removes document double-click listeners', async () => {
    const {blocks} = await fixture(['listener lifecycle']); key('Escape'); await pause(100);
    const add = document.addEventListener, remove = document.removeEventListener;
    const retained = new Set(); let added = 0;
    document.addEventListener = function(type, fn, ...args) {
      if (type === 'dblclick') { retained.add(fn); added++; }
      return Reflect.apply(add, this, [type, fn, ...args]);
    };
    document.removeEventListener = function(type, fn, ...args) {
      if (type === 'dblclick') retained.delete(fn);
      return Reflect.apply(remove, this, [type, fn, ...args]);
    };
    try {
      for (let i = 0; i < 5; i++) {
        document.getElementById('block-content-' + blocks[0].uuid).click(); await wait(() => input());
        key('Escape'); await pause(120);
      }
      assert(added === 5 && retained.size === 0, {added, retained: retained.size});
    } finally { document.addEventListener = add; document.removeEventListener = remove; }
  });
  await test('Review: double-click word beginnings do not include the preceding word', async () => {
    await fixture(['one two']);
    const span = [...surface().querySelectorAll('.ed-r')].find(e => e.textContent === 'one two');
    const range = document.createRange(); range.setStart(span.firstChild, 4); range.setEnd(span.firstChild, 5);
    const rect = range.getBoundingClientRect();
    span.dispatchEvent(new MouseEvent('dblclick', {bubbles: true, cancelable: true,
      clientX: rect.left + rect.width * .2, clientY: rect.top + rect.height / 2}));
    await pause(30); insert('X');
    assert(text() === 'one X', {value: text()});
  });
  await test('Review: calendar labels follow the selected locale', async () => {
    const {blocks} = await fixture(['calendar']);
    document.dispatchEvent(new CustomEvent('ls:editor-command', {detail: {command: 'scheduled', block: blocks[0].uuid}}));
    await wait(() => document.querySelector('.ls-date-month-select'));
    const lang = JSON.parse(localStorage.getItem('preferred-language') || '"en"');
    const formatter = new Intl.DateTimeFormat(lang, {month: 'long'});
    const label = document.querySelector('.ls-date-month-select').textContent;
    assert(label === formatter.format(new Date()), {lang, label});
    document.querySelector('.ls-date-month-select').click(); await pause(50);
    const months = [...document.querySelectorAll('.ls-date-month-menu [role=menuitem]')].map(e => e.textContent);
    assert(months.length === 12 && months.every((label, i) => label === formatter.format(new Date(2026, i, 1))), {lang, months});
    const labels = [...document.querySelectorAll('.ls-cal-nav-btn')].map(e => e.getAttribute('aria-label'));
    assert(labels.join('|') === (lang === 'zh-CN' ? '上个月|下个月' : 'Previous month|Next month'), {lang, labels});
    key('Escape');
  });
  console.table(results);
  globalThis.editorBrowserProgress.done = true;
  return results;
};

// Dispatch-to-DOM time includes production signal stabilization and layout.
// Frame intervals describe the connected display, not a simulated 120 Hz clock.
globalThis.runEditorBrowserPerf = async function (lineCounts = [1, 100, 500], rich = false) {
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const results = [];
  const percentile = (xs, fraction) => [...xs].sort((a, b) => a - b)[Math.ceil(xs.length * fraction) - 1];
  for (const lines of lineCounts) {
    document.querySelector('.ed-input')?.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
    await pause(80);
    const name = 'Editor performance ' + crypto.randomUUID();
    const page = await logseq.api.create_page(name, {}, {});
    const content = Array.from({length: lines}, (_, i) => rich
      ? `Line ${i} **bold** [[Page ${i}]] #topic https://example.com/${i} \`code\``
      : 'Line ' + i + ' plain text').join('\n');
    const block = await logseq.api.append_block_in_page(name, content, {});
    location.hash = '#/page/' + page.uuid;
    let row;
    for (let i = 0; i < 200; i++) {
      row = document.querySelector('#block-content-' + block.uuid);
      if (row) break;
      await pause(10);
    }
    if (!row) throw new Error('Performance fixture did not mount');
    row.click(); await pause(450);
    const input = () => document.querySelector('.ed-input');
    input().dispatchEvent(new KeyboardEvent('keydown', {key: 'Home', bubbles: true, cancelable: true}));
    await pause(30);
    const caret = document.querySelector('.ed-caret');
    const samples = [], intervals = [];
    let previous;
    for (let i = 0; i < 40; i++) {
      const timestamp = await new Promise(resolve => requestAnimationFrame(resolve));
      if (previous !== undefined) intervals.push(timestamp - previous);
      previous = timestamp;
      const start = performance.now();
      input().dispatchEvent(new InputEvent('beforeinput', {
        inputType: 'insertText', data: 'x', bubbles: true, cancelable: true,
      }));
      samples.push(performance.now() - start);
      if (document.querySelector('.ed-caret') !== caret) throw new Error('Caret remounted during performance run');
    }
    results.push({lines, rich, samples: samples.length, inputP50Ms: percentile(samples, .5),
      inputP95Ms: percentile(samples, .95), inputMaxMs: Math.max(...samples),
      frameP50Ms: percentile(intervals, .5), frameP95Ms: percentile(intervals, .95)});
  }
  return results;
};
