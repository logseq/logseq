import assert from 'node:assert/strict';

export function measureModalTheme(dialog) {
  const style = getComputedStyle(dialog);
  const backdrop = dialog.closest('.lui-modal-layer').querySelector('.lui-modal-backdrop');
  const input = dialog.querySelector('.ls-select-wrap [role="combobox"]');
  return {
    mode: document.documentElement.getAttribute('data-theme'),
    surface: style.backgroundColor,
    foreground: style.color,
    border: style.borderColor,
    backdrop: getComputedStyle(backdrop).backgroundColor,
    inputSurface: input ? getComputedStyle(input).backgroundColor : null,
    inlineChannels: ['--background', '--card', '--border', '--primary', '--ring'].map(
      name => [name, document.documentElement.style.getPropertyValue(name)],
    ),
  };
}

export function assertModalTheme(paint) {
  const alpha = color => {
    if (!color.includes('/') && !color.startsWith('rgba(') && !color.startsWith('hsla(')) return 1;
    const match = color.match(/(?:,|\/)\s*([\d.]+)(%?)\s*\)$/);
    assert.ok(match, `Cannot read color alpha: ${color}`);
    return Number(match[1]) / (match[2] ? 100 : 1);
  };
  assert.equal(alpha(paint.surface), 1, 'Dialog surface must be opaque');
  assert.equal(alpha(paint.backdrop), 0.9, 'Modal backdrop must use ninety percent of the background');
  assert.notEqual(paint.border, paint.foreground, 'Dialog border must resolve its own color');
  if (paint.inputSurface) assert.equal(paint.surface, paint.inputSurface, 'Dialog and language field share the background token');
  for (const [name, value] of paint.inlineChannels) assert.equal(value, '', `Stylesheet must own ${name}`);
  if (paint.mode === 'light') {
    assert.equal(paint.surface, 'rgb(255, 255, 255)');
    assert.equal(paint.border, 'rgb(235, 234, 235)');
  }
}

export function measureKeymapFilterPaint(dialog) {
  const filters = dialog.querySelector('.shortcut-filter-pills');
  const expected = getComputedStyle(filters).color;
  return Array.from(filters.querySelectorAll('button')).map(button => ({
    label: button.textContent,
    selected: button.getAttribute('aria-pressed'),
    foreground: getComputedStyle(button).color,
    expected,
  }));
}

export function assertKeymapFilterPaint(filters) {
  assert.equal(filters.length, 4);
  for (const filter of filters) {
    assert.equal(filter.foreground, filter.expected, `${filter.label}: muted filter surface must retain its inherited text color`);
  }
}

export function measureAccentControls(dialog) {
  return Array.from(dialog.querySelectorAll('button')).filter(button =>
    button.style.background.startsWith('var(--rx-') && button.style.background.endsWith('-09)'),
  ).map(button => {
    const rect = button.getBoundingClientRect();
    return {
      label: button.getAttribute('aria-label'),
      x: rect.x, y: rect.y, width: rect.width, height: rect.height,
      hit: document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
        ?.closest('button') === button,
    };
  });
}

export function assertAccentControls(controls) {
  assert.equal(controls.length, 16, 'The accent picker retains every choice');
  for (const control of controls) {
    assert.equal(control.width, 20, `${control.label}: width`);
    assert.equal(control.height, 20, `${control.label}: height`);
    assert.equal(control.hit, true, `${control.label}: its center must activate this choice`);
  }
  for (let i = 0; i < controls.length; i++) {
    const row = Math.floor(i / 8);
    assert.ok(Math.abs(controls[i].x - controls[0].x - i % 8 * 28) < 0.1,
      `${controls[i].label}: eight-point horizontal gap`);
    assert.ok(Math.abs(controls[i].y - controls[0].y - row * 28) < 0.1,
      `${controls[i].label}: eight choices per row with an eight-point gap`);
  }
}
