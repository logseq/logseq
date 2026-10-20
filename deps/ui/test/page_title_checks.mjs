import assert from 'node:assert/strict';

export function measurePageTitleLayout() {
  const title = document.querySelector('.ls-page-title');
  const block = title?.querySelector('.ls-block');
  const row = title?.querySelector('.is-page-title-row');
  if (!title || !block || !row) throw new Error('A mounted page title is required');
  const bounds = title.getBoundingClientRect();
  const inner = block.getBoundingClientRect();
  const content = row.getBoundingClientRect();
  const icon = title.querySelector('.ls-page-icon button');
  const control = icon?.getBoundingClientRect();
  const glyph = icon?.querySelector('.ls-icon-color-wrap')?.getBoundingClientRect();
  const head = document.querySelector('#main-content-container .page-tabs .ls-view-head');
  return {
    objectHeadGap: head ? head.getBoundingClientRect().top - bounds.bottom : null,
    topInset: content.top - inner.top,
    bottomInset: inner.bottom - content.bottom,
    leadingOffset: content.left - bounds.left,
    trailingInset: bounds.right - content.right,
    icon: control ? {
      width: control.width, height: control.height,
      topInset: control.top - content.top,
      glyphInset: glyph ? glyph.top - control.top : null
    } : null
  };
}

export function assertPageTitleLayout(value) {
  const near = (actual, expected, label) =>
    assert.ok(Math.abs(actual - expected) < 0.1, `${label}: expected ${expected}, got ${actual}`);
  near(value.topInset, 2, 'Title block top padding');
  near(value.bottomInset, 2, 'Title block bottom padding');
  near(value.leadingOffset, value.icon ? -36 : -30, 'Title row leading offset');
  near(value.trailingInset, 0, 'Title row trailing edge');
  if (value.objectHeadGap !== null) near(value.objectHeadGap, 40, 'Object view header gap');
  if (value.icon) {
    near(value.icon.width, 38, 'Title icon width');
    near(value.icon.height, 38, 'Title icon height');
    near(value.icon.topInset, 8, 'Title icon top inset');
    near(value.icon.glyphInset, 0, 'Title icon glyph alignment');
  }
}
