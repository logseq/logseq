import assert from 'node:assert/strict';

export function measureKeymapSearch(dialog) {
  const pane = dialog.querySelector('.cp__shortcut-page-x');
  const input = pane.querySelector('input');
  const labels = Array.from(pane.querySelectorAll('.ls-kbd-label')).map(node => node.textContent);
  return {
    inputId: input.id,
    query: input.value,
    inputFocused: document.activeElement === input,
    labels,
    categories: pane.querySelectorAll('.th').length,
    pills: Array.from(pane.querySelectorAll('.shortcut-filter-pills button')).map(button => button.textContent),
    clearCount: pane.querySelectorAll('button[aria-label="Clear search"]').length,
    emptyState: pane.textContent.includes('No matching shortcuts'),
  };
}

export function assertKeymapSearch(state, {query, inputId, focused = false}) {
  assert.equal(state.inputId, inputId, 'Search input must keep its mounted identity');
  assert.equal(state.query, query);
  if (focused) assert.equal(state.inputFocused, true, 'Clearing restores search focus');
  assert.equal(state.clearCount, query.trim() ? 1 : 0);
  if (query === 'Undo') {
    assert.ok(state.labels.length > 1, 'Search must fuzzy-match command identifiers and labels');
    assert.equal(state.labels[0], 'Undo', 'Strongest match must rank first');
    assert.equal(state.categories, 0, 'Search results flatten categories');
    assert.deepEqual(Array.from(state.labels), [
      'Undo', 'Outdent block', 'Move cursor down / Select down',
      'Move cursor left / Open selected block at beginning',
      'Move cursor right / Open selected block at end', 'Follow link under cursor',
      'Outdent block', 'Zoom out editing block / Backwards otherwise',
      'Move cursor to the end of a block', 'PDF: Close current pdf doc',
      'PDF: Search text of current pdf doc', 'PDF: Next page of current pdf doc',
      'PDF: Previous page of current pdf doc',
    ], 'Results retain category order and rank within categories');
    assert.equal(Number(state.pills[0].split('·')[1]), new Set(state.labels).size);
  }
  if (query === 'zzzz-no-shortcut') {
    assert.deepEqual(Array.from(state.labels), []);
    assert.equal(state.emptyState, true);
    assert.ok(state.pills.every(label => Number(label.split('·')[1]) === 0));
  }
  if (!query.trim()) assert.ok(state.categories > 0, 'Clearing restores grouped commands');
}

export function measureKeymapCategories(dialog) {
  const pane = dialog.querySelector('.cp__shortcut-page-x');
  return {
    categories: Array.from(pane.querySelectorAll('.th')).map(node => node.textContent),
    commands: pane.querySelectorAll('.shortcut-row').length,
    inputId: pane.querySelector('input').id,
    tools: pane.querySelectorAll('button[aria-label="Toggle categories pane"], button[aria-label="Refresh all"]').length,
  };
}

export function assertKeymapCategories(state, {inputId, commands, grouped = true, tools = true}) {
  assert.equal(state.inputId, inputId, 'Category transitions preserve the search field');
  assert.equal(state.commands, commands);
  assert.equal(state.tools, tools ? 2 : 0, 'Query results hide category actions');
  assert.deepEqual(Array.from(state.categories), grouped ? [
    'Basics', 'Navigation', 'Block editing general', 'Block command editing',
    'Block selection (press Esc to quit selection)', 'Formatting', 'Toggle',
    'Plugins', 'Others',
  ] : [], 'Unfiltered groups include empty categories');
}
