// Shared fixture content for pixel parity (blocks slice).
// 1x1 red PNG as a data URI — deterministic, no network needed.
export const IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';

export const FIXTURE_PAGE = 'PPFixture';

export const BLOCKS = [
  { content: 'Plain text block with no formatting at all.' },
  { content: '**Bold text** and *italic text* and ~~strikethrough~~ mixed.' },
  { content: 'Inline `code snippet` inside a sentence here.' },
  { content: 'Page ref [[Alpha]] and another [[Beta Page]] inline.' },
  { content: 'Tags #parity and #[[multi word tag]] inline.' },
  { content: 'Block ref ((a0a1a2a3-b4b5-c6c7-d8d9-e0e1e2e3e4e5)) raw.' },
  { content: 'Inline math $a^2+b^2=c^2$ inside text.' },
  { content: 'Display math $$E=mc^2$$' },
  { content: '==Highlighted text== inline.' },
  { content: 'TODO Task alpha [#A]' },
  { content: 'DOING Task beta [#B]' },
  { content: 'DONE Task gamma [#C]' },
  { content: '# Heading one' },
  { content: '## Heading two' },
  { content: '### Heading three' },
  { content: '> Quote block content line' },
  {
    content: 'List parent',
    children: [
      { content: 'item one', children: [{ content: 'deep child' }] },
      { content: 'item two' },
    ],
  },
  { content: '- [ ] unchecked task item' },
  { content: '- [x] checked task item' },
  { content: '```python\ndef hello():\n    print("hi")\n```' },
  { content: '| Col A | Col B |\n|---|---|\n| a1 | b1 |\n| a2 | b2 |' },
  { content: `Image below: ![tiny](${IMG})` },
  { content: '中文混排 long text block to check CJK rendering and line wrapping behavior across implementations.' },
  {
    content: 'Nested level 0',
    children: [
      {
        content: 'Nested level 1',
        children: [
          { content: 'Nested level 2', children: [{ content: 'Nested level 3' }] },
        ],
      },
    ],
  },
  {
    content: 'Collapsible parent',
    children: [{ content: 'fold me child', children: [{ content: 'fold me grandchild' }] }],
  },
  { content: 'Block with properties' },
];

// Properties to upsert on the last block.
export const PROPS = [
  ['source-url', 'https://example.com'],
  ['rating', '5'],
];
