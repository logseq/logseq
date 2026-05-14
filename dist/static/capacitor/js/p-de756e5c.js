/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
const o=(o,r,t)=>"function"==typeof t?t(o,r):"string"==typeof t?o[t]===r[t]:Array.isArray(r)?r.includes(o):o===r,r=(r,t,a)=>void 0!==r&&(Array.isArray(r)?r.some((r=>o(r,t,a))):o(r,t,a));export{o as c,r as i}