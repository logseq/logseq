import assert from 'node:assert/strict';

export function measureKeymapRecording() {
  const popup = document.querySelector('.shortcut-filter-popover');
  const pane = document.querySelector('.cp__shortcut-page-x');
  const ids = Array.from(document.querySelectorAll('.cp__shortcut-page-x [id],.shortcut-filter-popover [id]')).map(el => el.id);
  return {
    open: !!popup,
    triggerId: document.querySelector('.shortcut-keystroke-trigger')?.id,
    activeLabel: document.activeElement?.getAttribute('aria-label'),
    popupText: popup?.textContent,
    popupRect: popup?.getBoundingClientRect().toJSON(),
    anchorRect: document.querySelector('.shortcut-keystroke-trigger')?.parentElement.getBoundingClientRect().toJSON(),
    pending: popup?.querySelector('[data-recording-pending]')?.getAttribute('data-recording-pending'),
    strokes: popup ? Array.from(popup.querySelectorAll('[data-shortcut-binding]')).map(el => el.getAttribute('data-shortcut-binding')) : [],
    rows: Array.from(pane.querySelectorAll('.ls-kbd-label')).map(el => el.textContent),
    query: pane.querySelector('input').value,
    commandPalettes: document.querySelectorAll('.cp__cmdk-search-input').length,
    settings: document.querySelectorAll('.cp__settings-inner').length,
    duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
  };
}

export function assertKeymapRecording(state, {open, stroke, rows, triggerId, focused = false}) {
  assert.equal(state.open, open);
  if (triggerId) assert.equal(state.triggerId, triggerId, 'Recording must preserve its focus-return trigger');
  if (focused) assert.equal(state.activeLabel, 'Search by keys');
  assert.equal(state.settings, 1);
  assert.equal(state.commandPalettes, 0, 'Recording must suppress command execution');
  assert.equal(state.duplicateIds.length, 0, 'Keycap metadata must not replace unique node identifiers');
  if (stroke) assert.ok(state.strokes.includes(stroke), `Missing recorded stroke ${stroke}`);
  if (rows !== undefined) assert.equal(state.rows.length, rows);
  if (open) {
    assert.equal(state.query, '');
    assert.ok(state.popupRect.width > 280 && state.popupRect.width <= 290);
    assert.ok(Math.abs(state.popupRect.right - state.anchorRect.right) <= 2);
    assert.ok(Math.abs(state.popupRect.top - state.anchorRect.bottom - 5) <= 1,
      'Recording must retain the four-point anchor gap and surface border');
  }
}
