/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
const n=(n,o)=>null!==o.closest(n),o=(n,o)=>"string"==typeof n&&n.length>0?Object.assign({"ion-color":!0,[`ion-color-${n}`]:!0},o):o,r=n=>{const o={};return(n=>void 0!==n?(Array.isArray(n)?n:n.split(" ")).filter((n=>null!=n)).map((n=>n.trim())).filter((n=>""!==n)):[])(n).forEach((n=>o[n]=!0)),o},t=/^[a-z][a-z0-9+\-.]*:/,l=async(n,o,r,l)=>{if(null!=n&&"#"!==n[0]&&!t.test(n)){const t=document.querySelector("ion-router");if(t)return null!=o&&o.preventDefault(),t.push(n,r,l)}return!1};export{o as c,r as g,n as h,l as o}