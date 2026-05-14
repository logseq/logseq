/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
const r=(r,t,n)=>{if("undefined"==typeof MutationObserver)return;const u=new MutationObserver((r=>{n(e(r,t))}));return u.observe(r,{childList:!0,subtree:!0}),u},e=(r,e)=>{let n;return r.forEach((r=>{for(let u=0;u<r.addedNodes.length;u++)n=t(r.addedNodes[u],e)||n})),n},t=(r,e)=>{if(1!==r.nodeType)return;const t=r;return(t.tagName===e.toUpperCase()?[t]:Array.from(t.querySelectorAll(e))).find((r=>r.value===t.value))};export{r as w}