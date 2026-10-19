import assert from 'node:assert/strict';

export function measureTransferDialog(dialog) {
  const box = element => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      x: rect.x, y: rect.y, width: rect.width, height: rect.height,
      size: Number.parseFloat(style.fontSize), weight: style.fontWeight,
      line: Number.parseFloat(style.lineHeight), color: style.color,
      marginTop: Number.parseFloat(style.marginTop),
      marginBottom: Number.parseFloat(style.marginBottom), opacity: style.opacity,
    };
  };
  const close = dialog.querySelector('button[aria-label="Close"]');
  const title = dialog.querySelector('h1');
  const hourlyNote = Array.from(dialog.querySelectorAll('span')).find(element =>
    element.textContent === 'Backup will be created every hour.');
  assertPresent(close, 'Close button');
  assertPresent(title, 'Export title');
  assertPresent(hourlyNote, 'Backup schedule note');
  return {
    dialog: box(dialog), close: box(close), title: box(title),
    actions: Array.from(dialog.querySelectorAll('[role="button"]')).map(box),
    descriptions: Array.from(dialog.querySelectorAll('p')).map(box),
    hourlyNote: box(hourlyNote),
  };

  function assertPresent(element, label) {
    if (!element) throw new Error(`${label} is missing from the mounted dialog`);
  }
}

export function assertDialogCloseGeometry(measurement) {
  const {dialog, close} = measurement;
  assert.ok(Math.abs(close.y - dialog.y - 17) < 0.6,
    `Close button must stay 16 points inside the card border: top offset ${close.y - dialog.y}`);
  assert.ok(Math.abs(dialog.x + dialog.width - close.x - close.width - 17) < 0.6,
    'Close button must use the card right edge');
}

export function assertExportTypography(measurement, colors) {
  const {title, actions, descriptions} = measurement;
  assert.equal(measurement.hourlyNote.size, 14);
  assert.equal(measurement.hourlyNote.line, 20);
  assert.equal(title.size, 36);
  assert.equal(title.weight, '500');
  assert.equal(title.line, 54);
  assert.equal(title.marginTop, 0);
  assert.equal(title.marginBottom, 32);
  assert.equal(title.color, colors.title);
  assert.equal(actions.length, 5);
  for (const action of actions) {
    assert.equal(action.color, colors.link);
    assert.equal(action.size, 16);
    assert.equal(action.weight, '500');
    assert.equal(action.line, 24);
  }
  assert.equal(descriptions.length, 4);
  for (const description of descriptions) {
    assert.equal(description.size, 14);
    assert.equal(description.line, 20);
    assert.equal(description.marginTop, 8);
    assert.equal(description.marginBottom, 0);
    assert.equal(description.opacity, '0.7');
    assert.equal(description.color, colors.description);
  }
}
