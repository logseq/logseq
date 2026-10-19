import assert from 'node:assert/strict';

export function measureDockGeometry(root) {
  const box = element => {
    const r = element.getBoundingClientRect();
    return {x: r.x, y: r.y, width: r.width, height: r.height};
  };
  return Array.from(root.querySelectorAll('.cp__left-split, .cp__right-split')).map(split => {
    const panes = split.querySelector('.lui-split-panes');
    const handle = Array.from(split.children).find(child => child.classList.contains('lui-split-divider'));
    return {
      left: split.classList.contains('cp__left-split'),
      closed: split.classList.contains('is-collapsed'),
      first: box(panes.children[0]), second: box(panes.children[1]),
      handle: box(handle), hidden: getComputedStyle(handle).display === 'none',
    };
  });
}

export function assertDockGeometry(measurements) {
  assert.equal(measurements.length, 2);
  for (const split of measurements) {
    if (split.closed) {
      assert.equal(split.hidden, true);
      continue;
    }
    const boundary = split.first.x + split.first.width;
    assert.ok(Math.abs(split.second.x - boundary) < 0.1,
      `Resize handle must not reserve pane width: gap ${split.second.x - boundary}`);
    assert.equal(split.handle.width, 3);
    assert.ok(Math.abs(split.handle.x - boundary - (split.left ? -1 : 1)) < 0.1,
      'Resize handle must cover the reference pane edge');
  }
}
