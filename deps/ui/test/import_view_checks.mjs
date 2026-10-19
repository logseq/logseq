import assert from 'node:assert/strict';

export function measureImportView(root) {
  const box = element => {
    if (!element) throw new Error('Import content is missing from the mounted view');
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      x: rect.x, y: rect.y, width: rect.width, height: rect.height,
      size: Number.parseFloat(style.fontSize), weight: style.fontWeight,
      line: Number.parseFloat(style.lineHeight), color: style.color,
      alignment: style.textAlign,
      background: style.backgroundColor, opacity: style.opacity,
      radius: Number.parseFloat(style.borderRadius),
      padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map(Number.parseFloat),
    };
  };
  const choices = Array.from(root.querySelectorAll('#import-choices > button, label.action-input'));
  return {
    headings: Array.from(root.querySelectorAll('h1,h2')).map(box),
    card: box(root.querySelector('#import-options, .importer')),
    choices: choices.map(element => ({
      ...box(element), title: box(element.querySelector('strong')),
      description: box(element.querySelector('small')),
    })),
  };
}

export function assertImportView(measurement, colors) {
  const {headings, card, choices} = measurement;
  assert.equal(headings.length, 4);
  const expected = [[36, 50.4, '400'], [20, 30, '400'], [28, 42, '500'], [19, 57, '400']];
  for (let i = 0; i < headings.length; i++) {
    assert.equal(headings[i].size, expected[i][0]);
    assert.ok(Math.abs(headings[i].line - expected[i][1]) < 0.1);
    assert.equal(headings[i].weight, expected[i][2]);
    assert.equal(headings[i].color, colors.text);
  }
  assert.equal(card.background, colors.card);
  assert.equal(card.radius, 20);
  [64, 32, 64, 32].forEach((value, index) => assert.equal(card.padding[index], value));
  assert.equal(choices.length, 5);
  for (let i = 0; i < choices.length; i++) {
    const choice = choices[i];
    assert.equal(choice.height, 62);
    assert.equal(choice.radius, 12);
    assert.equal(choice.opacity, '0.8');
    assert.equal(choice.background, colors.choice);
    assert.ok(Math.abs(choice.width - card.width + 80) < 0.6);
    assert.equal(choice.title.size, 18);
    assert.equal(choice.title.line, 27);
    assert.equal(choice.title.weight, '700');
    assert.equal(choice.title.alignment, 'start');
    assert.equal(choice.description.size, 11);
    assert.equal(choice.description.line, 16.5);
    assert.equal(choice.description.color, colors.text);
    assert.equal(choice.description.alignment, 'start');
    assert.ok(Math.abs(choice.title.x - choice.x - 62) < 0.6);
    if (i) assert.ok(Math.abs(choice.y - choices[i - 1].y - 80) < 0.6);
  }
}
