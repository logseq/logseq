import assert from 'node:assert/strict';

export function measureShortcutHelp(root) {
  const page = root.querySelector('.cp__shortcut-page');
  if (!page) return {present: false};
  const tables = Array.from(page.querySelectorAll('table'));
  return {
    present: true,
    tables: tables.map(table => ({
      rows: Array.from(table.rows).map(row => Array.from(row.cells).map(cell => cell.textContent.trim())),
      width: table.getBoundingClientRect().width,
    })),
    previews: tables[1] ? Array.from(tables[1].rows).slice(1).map(row => ({
      bold: !!row.cells[1].querySelector('b,strong'),
      italic: !!row.cells[1].querySelector('i,em'),
      deletion: !!row.cells[1].querySelector('del,s'),
      mark: !!row.cells[1].querySelector('mark'),
      math: !!row.cells[1].querySelector('.latex,.latex-inline'),
      code: !!row.cells[1].querySelector('code'),
      link: row.cells[1].querySelector('a')?.getAttribute('href'),
      image: !!row.cells[1].querySelector('img'),
    })) : [],
    search: !!page.querySelector('input[placeholder="Search shortcuts..."]'),
    keymap: !!page.querySelector('.cp__shortcut-page-x'),
    scrolls: page.querySelectorAll('.lui-scroll').length,
  };
}

export function assertShortcutHelp(measurement) {
  assert.equal(measurement.present, true, 'Help must open the complete shortcut page');
  assert.equal(measurement.tables.length, 2);
  assert.equal(measurement.tables[0].rows.length, 7, 'Six trigger rows plus the header');
  assert.equal(measurement.tables[1].rows.length, 11, 'Ten syntax examples plus the header');
  for (const [index, property] of [[0, 'bold'], [1, 'italic'], [2, 'deletion'], [3, 'mark'], [4, 'math'], [5, 'math'], [6, 'code'], [8, 'code'], [9, 'image']]) {
    assert.equal(measurement.previews[index][property], true, `Missing rich preview ${index}: ${property}`);
  }
  assert.equal(measurement.previews[7].link, 'https://www.example.com');
  assert.equal(measurement.search, true);
  assert.equal(measurement.keymap, true);
  assert.equal(measurement.scrolls, 0, 'The sidebar owns scrolling for the embedded keymap');
}


export function measureHelpMenu(root) {
  const menu = root.querySelector('.cp__sidebar-help-menu-popup');
  const trigger = root.querySelector('.cp__sidebar-help-btn');
  const rect = e => {const r = e.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  return {menu:rect(menu),trigger:rect(trigger),paint:{background:getComputedStyle(menu).backgroundColor,border:getComputedStyle(menu).borderColor,radius:getComputedStyle(menu).borderRadius},rows:Array.from(menu.querySelectorAll('button,[data-press-enabled],a.it')).map(e=>({rect:rect(e),font:getComputedStyle(e).fontSize,foreground:getComputedStyle(e).color}))};
}

export function assertHelpMenu(m, paint) {
  if (paint) assert.deepEqual(m.paint, paint);
  assert.equal(m.rows.length, 9);
  assert.ok(Math.abs(m.menu.width - 260) < .1, 'Help menu uses the reference width');
  assert.ok(m.menu.height > 350, 'Help menu must have room for its interactive rows');
  assert.ok(Math.abs(m.menu.right - m.trigger.right) < .1, 'Help menu follows its trigger');
  assert.ok(Math.abs(m.menu.bottom - m.trigger.y + 8) < .1, 'Help menu sits eight points above the trigger');
  for (const row of m.rows) {
    assert.equal(row.font, '16px');
    assert.ok(Math.abs(row.rect.height - 32) < .1);
    assert.ok(row.rect.y >= m.menu.y && row.rect.bottom <= m.menu.bottom, 'Every row stays within the interactive popup');
  }
}


export function measureCollapsedShortcutHelp(root) {
  const panel = root.querySelector('.item-type-shortcut-settings');
  return {height:panel.getBoundingClientRect().height,bodyHeight:panel.querySelector('.cp__shortcut-page')?.getBoundingClientRect().height ?? 0};
}

export function assertCollapsedShortcutHelp(m) {
  assert.equal(m.height, 32, 'A collapsed sidebar panel occupies only its header');
  assert.equal(m.bodyHeight, 0);
}
