import assert from 'node:assert/strict';

export function measurePropertyPicker() {
  const popup = document.querySelector('.ls-property-dialog');
  const input = popup.querySelector('input');
  const rows = [...popup.querySelectorAll('.lui-list-item')];
  const selected = rows.find(row => row.hasAttribute('data-selected'));
  const style = getComputedStyle(popup);
  const field = getComputedStyle(input);
  return {
    width: popup.getBoundingClientRect().width,
    background: style.backgroundColor,
    border: style.borderWidth,
    radius: style.borderRadius,
    shadow: style.boxShadow,
    input: {
      focused: document.activeElement === input,
      height: input.getBoundingClientRect().height,
      border: field.borderWidth,
      radius: field.borderRadius,
      shadow: field.boxShadow,
      font: field.fontSize,
      line: field.lineHeight,
    },
    selected: {
      background: getComputedStyle(selected).backgroundColor,
      foreground: getComputedStyle(selected).color,
    },
    rowHeights: rows.map(row => row.getBoundingClientRect().height),
  };
}

export function assertPropertyPicker(paint) {
  assert.ok(Math.abs(paint.width - 226) < 0.6);
  assert.equal(paint.background, 'rgb(255, 255, 255)');
  assert.equal(paint.border, '1px');
  assert.equal(paint.radius, '6px');
  assert.ok(paint.shadow.includes('0px 4px 6px -1px'));
  assert.ok(paint.shadow.includes('0px 2px 4px -2px'));
  assert.equal(paint.input.focused, true);
  assert.ok(Math.abs(paint.input.height - 32) < 0.6);
  assert.equal(paint.input.border, '0px');
  assert.equal(paint.input.radius, '0px');
  assert.equal(paint.input.shadow, 'none');
  assert.equal(paint.input.font, '14px');
  assert.equal(paint.input.line, '20px');
  assert.equal(paint.selected.background, 'rgb(237, 237, 237)');
  assert.equal(paint.selected.foreground, 'rgb(22, 30, 46)');
  assert.ok(paint.rowHeights.length > 0);
  for (const height of paint.rowHeights) {
    assert.ok(Math.abs(height - 32) < 0.6, `Property option shrank to ${height}`);
  }
}
