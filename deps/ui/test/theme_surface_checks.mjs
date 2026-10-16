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
