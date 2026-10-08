// Run in the served Web app, using a disposable graph/origin.
// Load this file in DevTools, then await runEditorBrowserTests().
// Every assertion drives the production editor and worker, not a mock.
globalThis.runEditorBrowserTests = async function (filter = '') {
  const results = [];
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
    await wait(() => input() && document.activeElement === input() && document.querySelector('.ed-caret'));
    await pause(30);
    return {page, blocks};
  };
  const assert = (condition, evidence) => {
    if (!condition) throw new Error(JSON.stringify(evidence));
  };
  const test = async (name, run) => {
    if (!name.includes(filter)) return;
    try { results.push({name, passed: true, evidence: await run()}); }
    catch (error) { results.push({name, passed: false, error: String(error)}); }
  };

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
    const {page, blocks} = await fixture(['prefix [[delayed reference]]', 'suffix', 'other']);
    key('Escape'); await pause(50);
    document.querySelector('#block-content-' + blocks[1].uuid).click();
    await wait(() => input()?.id.includes(blocks[1].uuid) && document.activeElement === input());
    key('Home');
    const original = Worker.prototype.postMessage;
    let held;
    Worker.prototype.postMessage = function (message, ...rest) {
      if (!held && message.argumentList?.[0]?.value === 'thread-api/get-case-page'
        && message.argumentList?.[1]?.value.includes('delayed reference')) {
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
      assert(tree.length === 2 && tree[0].content.endsWith(' Xsuffix')
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
  console.table(results);
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
