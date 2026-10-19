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
    input:input?{...measure(input),value:input.value,focused:input.ownerDocument.activeElement===input}:null,
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
  for(const axis of ['width','height'])
    assert.equal(actual.viewport[axis],reference.viewport[axis],`viewport ${axis}`);
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

export function assertHandbookSearch(actual,reference) {
  assert.ok(actual.input && reference.input,'search field exists');
  for(const key of ['x','y','width','height'])
    assert.ok(Math.abs(actual.input.rect[key]-reference.input.rect[key])<.2,
      `search ${key}: ${actual.input.rect[key]} versus ${reference.input.rect[key]}`);
  for(const key of ['font','line','weight','padding','color','background'])
    assert.equal(actual.input[key],reference.input[key],`search ${key}`);
}

export function assertHandbookCleared(actual) {
  assert.equal(actual.input.value,'','clear empties the search');
  assert.equal(actual.input.focused,true,'clear restores input focus');
}

export function measureHandbookArticle(root) {
  const panel=root.querySelector('.cp__handbooks-popup');
  const scroll=panel.querySelector('#handbook-scroll,.cp__handbooks-content');
  return {scrollTop:scroll.scrollTop,nestedParagraphs:panel.querySelectorAll('p p').length,
    codes:[...panel.querySelectorAll('code')].map(element=>element.textContent),
    videoSources:[...panel.querySelectorAll('video')].map(video=>
      video.getAttribute('src') || video.querySelector('source')?.getAttribute('src'))};
}

export function assertHandbookArticle(actual,reference) {
  assert.equal(actual.scrollTop,0,'a newly opened article starts at the top');
  assert.equal(actual.nestedParagraphs,0,'article paragraphs remain siblings after embedded media');
  for (const key of ['videoSources','codes']) {
    assert.equal(actual[key].length,reference[key].length,`article ${key} count`);
    for (const [index,value] of actual[key].entries())
      assert.equal(value,reference[key][index],`article ${key} ${index}`);
  }
}

export const handbookIntroductionArticleReference={nestedParagraphs:0,codes:[],videoSources:[
  'https://handbooks.pages.dev/assets/2_2_ClickPageRef.mp4',
  'https://handbooks.pages.dev/assets/2_3_ClickBlockRef.mp4',
]};

export const handbookJournalsArticleReference={nestedParagraphs:0,videoSources:[],
  codes:['#hashtag','[[double brackets]]']};

// Measured reference dashboard at 1280x720, light/classic, with no hovered card.
export const handbookDesktopReference = {
  "viewport": {
    "height": 720,
    "width": 1280
  },
  "panel": {
    "rect": {
      "height": 619.1953125,
      "width": 420,
      "x": 828,
      "y": 42.8046875
    },
    "background": "rgb(255, 255, 255)",
    "radius": "8px",
    "color": "rgb(23, 23, 23)"
  },
  "header": {
    "rect": {
      "height": 48,
      "width": 418,
      "x": 829,
      "y": 43.8046875
    }
  },
  "title": {
    "font": "20px",
    "weight": "700",
    "color": "rgb(23, 23, 23)",
    "line": 28
  },
  "input": {
    "rect": {
      "height": 33.5,
      "width": 380,
      "x": 848,
      "y": 100.8046875
    },
    "font": "16px",
    "weight": "500",
    "color": "rgb(23, 23, 23)",
    "line": 16,
    "padding": "7px 24px",
    "background": "rgba(0, 0, 0, 0)"
  },
  "cards": [
    {
      "rect": {
        "height": 97,
        "width": 386,
        "x": 845,
        "y": 195.3046875
      },
      "background": "rgb(247, 247, 247)",
      "font": "14px",
      "weight": "400",
      "color": "rgb(23, 23, 23)",
      "radius": "8px"
    },
    {
      "rect": {
        "height": 86,
        "width": 386,
        "x": 845,
        "y": 300.3046875
      },
      "background": "rgb(247, 247, 247)",
      "font": "14px",
      "weight": "400",
      "color": "rgb(23, 23, 23)",
      "radius": "8px"
    }
  ],
  "categories": [
    {
      "rect": {
        "height": 72,
        "width": 187,
        "x": 845,
        "y": 434.3046875
      },
      "background": "rgb(247, 247, 247)",
      "font": "16px",
      "weight": "400",
      "color": "rgb(23, 23, 23)",
      "radius": "4px"
    },
    {
      "rect": {
        "height": 72,
        "width": 187,
        "x": 1044,
        "y": 434.3046875
      },
      "background": "rgb(247, 247, 247)",
      "font": "16px",
      "weight": "400",
      "color": "rgb(23, 23, 23)",
      "radius": "4px"
    },
    {
      "rect": {
        "height": 72,
        "width": 187,
        "x": 845,
        "y": 518.3046875
      },
      "background": "rgb(247, 247, 247)",
      "font": "16px",
      "weight": "400",
      "color": "rgb(23, 23, 23)",
      "radius": "4px"
    }
  ],
  "images": [
    {
      "width": 70,
      "height": 52.5
    },
    {
      "width": 70,
      "height": 52.5
    }
  ]
};
