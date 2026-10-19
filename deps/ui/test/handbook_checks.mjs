import assert from 'node:assert/strict';

export function measureHandbook(root,reference=false) {
  const panel=root.querySelector('.cp__handbooks-popup');
  const measure=element=>{
    const style=getComputedStyle(element),rect=element.getBoundingClientRect();
    return {text:element.textContent.trim(),font:style.fontSize,line:Number.parseFloat(style.lineHeight),
      weight:style.fontWeight,color:style.color,background:style.backgroundColor,
      padding:style.padding,radius:style.borderRadius,
      rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}};
  };
  const header=panel.querySelector(reference?'.hd':'#handbook-header');
  const scroll=panel.querySelector(reference?'.cp__handbooks-content':'#handbook-scroll') ||
    root.querySelector(reference?'.cp__handbooks-content':'#handbook-scroll');
  const input=panel.querySelector('input');
  return {viewport:{width:innerWidth,height:innerHeight},panel:measure(panel),header:measure(header),
    title:measure(header.querySelector('h1,[role="heading"]')),
    input:input?measure(input):null,
    cards:[...panel.querySelectorAll(reference?'.topic-card':'button[id^="handbook-topic-"]')].map(measure),
    categories:[...panel.querySelectorAll(reference?'.category-card':'button[id^="handbook-category-"],#handbook-shortcuts')]
      .filter(element=>element.getBoundingClientRect().height>0).map(measure),
    images:[...panel.querySelectorAll('img')].map(image=>({src:image.currentSrc,
      naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,
      width:image.getBoundingClientRect().width,height:image.getBoundingClientRect().height})),
    scroll:{client:scroll.clientHeight,total:scroll.scrollHeight,top:scroll.scrollTop,
      overflow:getComputedStyle(scroll).overflowY,rect:measure(scroll).rect}};
}

export function assertHandbookImages(actual,reference) {
  assert.equal(actual.images.length,reference.images.length,'visible cover count');
  for(const [index,image] of actual.images.entries()) {
    assert.ok(image.naturalWidth>0 && image.naturalHeight>0,`cover ${index} loaded`);
    assert.ok(image.width>0 && image.height>0,`cover ${index} participates in layout`);
    assert.ok(Math.abs(image.width/image.height-image.naturalWidth/image.naturalHeight)<.01,
      `cover ${index} preserves its natural aspect ratio`);
    for(const dimension of ['width','height'])
      assert.ok(Math.abs(image[dimension]-reference.images[index][dimension])<.2,`cover ${index} ${dimension}`);
  }
}

export function assertHandbook(actual,reference) {
  assert.deepEqual(actual.viewport,reference.viewport);
  for(const key of ['x','y','width','height'])
    assert.ok(Math.abs(actual.panel.rect[key]-reference.panel.rect[key])<.2,
      `panel ${key}: ${actual.panel.rect[key]} versus ${reference.panel.rect[key]}`);
  for(const key of ['background','radius','color'])
    assert.equal(actual.panel[key],reference.panel[key],`panel ${key}`);
  assert.equal(actual.header.rect.height,reference.header.rect.height,'fixed header height');
  for(const key of ['font','weight','color'])
    assert.equal(actual.title[key],reference.title[key],`header title ${key}`);
  assert.ok(Math.abs(actual.title.line-reference.title.line)<.1,'header title line height');
  assert.equal(actual.input.font,reference.input.font,'search text size');
  assert.ok(actual.scroll.client>0 && actual.scroll.client<actual.panel.rect.height,'bounded body');
  assert.ok(['auto','scroll'].includes(actual.scroll.overflow),'body owns scrolling');
  for(const group of ['cards','categories']) {
    assert.equal(actual[group].length,reference[group].length,`${group} count`);
    for(const [index,item] of actual[group].entries()) {
      const expected=reference[group][index];
      for(const key of ['background','font','weight','color','radius'])
        assert.equal(item[key],expected[key],`${group} ${index} ${key}`);
      for(const key of ['x','y','width','height'])
        assert.ok(Math.abs(item.rect[key]-expected.rect[key])<.3,
          `${group} ${index} ${key}: ${item.rect[key]} versus ${expected.rect[key]}`);
    }
  }
}
