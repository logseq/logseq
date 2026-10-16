import assert from 'node:assert/strict';

export function measureSettingsNavigation(root) {
  return Array.from(root.querySelectorAll('.settings-menu-item')).map(button => {
    const row = button.getBoundingClientRect();
    const image = button.querySelector('.ls-nav-item-icon').getBoundingClientRect();
    const textNode = node => {
      if (node.nodeType === 3 && node.textContent.trim()) return node;
      for (const child of node.childNodes) {
        const found = textNode(child);
        if (found) return found;
      }
    };
    const label = textNode(button);
    if (!label) throw new Error('Settings navigation label is missing');
    const range = document.createRange();
    range.selectNodeContents(label);
    const text = range.getBoundingClientRect();
    return {
      label: label.textContent,
      height: row.height,
      iconInset: image.left - row.left,
      gap: text.left - image.right,
      textInset: text.left - row.left,
      textRight: text.right - row.right,
      centerDelta: (image.top + image.bottom - row.top - row.bottom) / 2,
    };
  });
}

export function assertSettingsNavigation(rows) {
  assert.equal(rows.length, 5, 'All settings destinations must remain mounted');
  for (const row of rows) {
    const near = (name, expected) => assert.ok(
      Math.abs(row[name] - expected) <= 0.5,
      `${row.label}: ${name} is ${row[name]}, expected ${expected}`,
    );
    near('height', 32);
    near('iconInset', 8);
    near('gap', 4);
    near('textInset', 30);
    near('centerDelta', 0);
    assert.ok(row.textRight <= -8, `${row.label}: text extends outside its row`);
  }
}
