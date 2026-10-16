import assert from 'node:assert/strict';

export function measureKeymapRecording() {
  const popup = document.querySelector('.shortcut-filter-popover');
  const pane = document.querySelector('.cp__shortcut-page-x');
  const ids = Array.from(document.querySelectorAll('.cp__shortcut-page-x [id],.shortcut-filter-popover [id]')).map(el => el.id);
  return {
    open: !!popup,
    triggerId: document.querySelector('.shortcut-keystroke-trigger')?.id,
    activeLabel: document.activeElement?.getAttribute('aria-label'),
    activeInPopup: popup?.contains(document.activeElement) ?? false,
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
    assert.equal(state.activeInPopup, true, 'Recording must keep focus inside its popup');
    assert.equal(state.query, '');
    assert.ok(state.popupRect.width > 280 && state.popupRect.width <= 290);
    assert.ok(Math.abs(state.popupRect.right - state.anchorRect.right) <= 2);
    assert.ok(Math.abs(state.popupRect.top - state.anchorRect.bottom - 5) <= 1,
      'Recording must retain the four-point anchor gap and surface border');
    if (state.strokes.length <= 1) {
      assert.ok(state.popupRect.height >= 99 && state.popupRect.height <= 103,
        'An empty or short recording must retain the compact popup height');
    }
  }
}

export function measureRecordingBounds() {
  const popup = document.querySelector('.shortcut-filter-popover');
  const remove = popup.querySelector('[aria-label="Remove filter"]');
  const bounds = el => el.getBoundingClientRect().toJSON();
  const keys = Array.from(popup.querySelectorAll('[data-shortcut-binding]'));
  return {
    popup: bounds(popup),
    keys: keys.map(bounds),
    remove: bounds(remove),
    removeHit: document.elementFromPoint(
      remove.getBoundingClientRect().x + remove.getBoundingClientRect().width / 2,
      remove.getBoundingClientRect().y + remove.getBoundingClientRect().height / 2,
    )?.closest('button') === remove,
  };
}

export function assertRecordingBounds(state) {
  assert.equal(state.keys.length, 5);
  const contains = rect => rect.left >= state.popup.left + 15
    && rect.right <= state.popup.right - 15
    && rect.top >= state.popup.top && rect.bottom <= state.popup.bottom;
  for (const key of state.keys) assert.ok(contains(key), 'Every recorded key must stay inside the popup content');
  assert.ok(contains(state.remove), 'The remove action must stay inside the popup content');
  assert.ok(state.remove.width >= 15.9 && state.remove.height >= 15.9, 'Recorded keys must not shrink the remove action');
  assert.equal(state.removeHit, true, 'Recorded keys must not cover the remove action');
  for (const key of state.keys) {
    assert.ok(key.right <= state.remove.left || key.left >= state.remove.right
      || key.bottom <= state.remove.top || key.top >= state.remove.bottom,
    'Recorded keys must not overlap the remove action');
  }
}
