import assert from 'node:assert/strict';

export function measureControlHits(selector) {
  return Array.from(document.querySelectorAll(selector), control => {
    const rect = control.getBoundingClientRect();
    const target = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return {
      label: control.getAttribute('aria-label') || control.textContent,
      width: rect.width,
      height: rect.height,
      receivesPointer: target !== null && control.contains(target),
      hit: target?.className || target?.tagName || null,
    };
  });
}

export function assertControlHits(controls) {
  assert.ok(controls.length > 0, 'The exercised surface must contain controls');
  for (const control of controls) {
    assert.ok(control.width > 0 && control.height > 0, `${control.label}: control must be visible`);
    assert.ok(control.receivesPointer, `${control.label}: pointer intercepted by ${control.hit}`);
  }
}
