import assert from 'node:assert/strict';

const heading=(text,font,line,rect)=>({text,font,line,rect,weight:'400',
  color:'rgb(23, 23, 23)',background:'rgba(0, 0, 0, 0)',padding:'0px',radius:'0px'});
const action=(text,y)=>({text,font:'16px',line:24,weight:'400',
  color:'rgb(27, 104, 152)',background:'rgb(220, 220, 220)',padding:'8px 16px',radius:'8px',
  rect:{x:323,y,width:896,height:64}});

export const bugReportDesktopReference={
  headings:[
    heading('Bug report','30px',36,{x:708.78125,y:80,width:150.4296875,height:36}),
    heading('Is the bug you encountered related to these features?','24px',31.9999,
      {x:323,y:212,width:896,height:31.9921875}),
    heading('Or...','24px',31.9999,{x:323,y:363.9921875,width:896,height:31.9921875})],
  actions:[action('Clipboard helperInspect and collect clipboard data',275.9921875),
    action('Submit a bug reportHelp Make Logseq Better!',427.984375)],
  card:{font:'16px',line:24,weight:'400',color:'rgb(23, 23, 23)',
    background:'rgb(234, 234, 234)',padding:'32px',radius:'8px',
    rect:{x:291,y:180,width:960,height:351.984375}}
};

export function measureBugReport(root) {
  const main=root.querySelector('#main-content-container');
  const measure=element => {
    const style=getComputedStyle(element),rect=element.getBoundingClientRect();
    return {text:element.textContent,font:style.fontSize,line:Number.parseFloat(style.lineHeight),
      weight:style.fontWeight,color:style.color,background:style.backgroundColor,
      padding:style.padding,radius:style.borderRadius,
      rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}};
  };
  return {hash:location.hash.split('?')[0],
    headings:Array.from(main.querySelectorAll('h1,[role="heading"][aria-level="1"]')).map(measure),
    card:measure(main.querySelector('.cp__bug-report-reporter')),
    actions:Array.from(main.querySelectorAll('.cp__bug-report-item-button')).map(measure)};
}

export function assertBugReport(actual,reference) {
  assert.equal(actual.hash,'#/bug-report');
  assert.equal(actual.headings.length,3);
  assert.equal(actual.actions.length,2);
  for (const [label,values] of [['headings',actual.headings],['actions',actual.actions],['card',[actual.card]]]) {
    const expected=label==='card'?[reference.card]:reference[label];
    for (const [index,value] of values.entries()) {
      for (const key of ['text','font','weight','color','background','padding','radius']) {
        if (label==='card' && key==='text') continue;
        assert.equal(value[key],expected[index][key],`${label} ${index} ${key}`);
      }
      assert.ok(Math.abs(value.line-expected[index].line)<.1,`${label} ${index} line height`);
      for (const key of ['x','y','width','height']) {
        assert.ok(Math.abs(value.rect[key]-expected[index].rect[key])<.2,
          `${label} ${index} ${key}: ${value.rect[key]} versus ${expected[index].rect[key]}`);
      }
    }
  }
}

export function measureClipboardInspector(root) {
  const main=root.querySelector('#main-content-container');
  const input=main.querySelector('input');
  const code=main.querySelector('pre code');
  return {hash:location.hash.split('?')[0],
    input:input?{placeholder:input.placeholder,height:input.getBoundingClientRect().height}:null,
    result:code?JSON.parse(code.textContent):null,
    foreground:code?{pre:getComputedStyle(code.parentElement).color,code:getComputedStyle(code).color}:null,
    buttons:Array.from(main.querySelectorAll('button')).map(button=>({
      label:button.getAttribute('aria-label')||button.textContent.trim(),
      height:button.getBoundingClientRect().height}))};
}

export function assertClipboardInspector(actual,{result=null,foreground}={}) {
  assert.equal(actual.hash,'#/bug-report-tool/clipboard-data-inspector');
  assert.deepEqual(JSON.parse(JSON.stringify(actual.result)),JSON.parse(JSON.stringify(result)));
  if (result===null) {
    assert.equal(actual.input.placeholder,'Long press here to paste if you are on mobile');
    assert.equal(actual.input.height,38);
    assert.deepEqual(Array.from(actual.buttons,button=>button.label),['Go back']);
  } else {
    assert.equal(actual.input,null);
    assert.deepEqual(Array.from(actual.buttons,button=>button.label),['Copy the result','Create an issue','Go back']);
    if (foreground) {
      assert.equal(actual.foreground.pre,foreground,'diagnostic Pre foreground');
      assert.equal(actual.foreground.code,foreground,'diagnostic Code foreground');
    }
  }
  for (const button of actual.buttons) assert.equal(button.height,28);
}
