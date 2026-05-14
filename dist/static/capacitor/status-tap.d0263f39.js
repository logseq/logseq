(()=>{var e=("undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{}).parcelRequired5b2;e.register("2m267",(function(t,n){var o,r,i,s;o=t.exports,r="startStatusTap",i=()=>f,Object.defineProperty(o,r,{get:i,set:s,enumerable:!0,configurable:!0});
/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
var a=e("enGNP"),d=e("2Wo0m"),l=e("1WzNu");const f=()=>{const e=window;e.addEventListener("statusTap",(()=>{(0,a.readTask)((()=>{const t=e.innerWidth,n=e.innerHeight,o=document.elementFromPoint(t/2,n/2);if(!o)return;const r=(0,d.a)(o);r&&new Promise((e=>(0,l.c)(r,e))).then((()=>{(0,a.writeTask)((async()=>{r.style.setProperty("--overflow","hidden"),await(0,d.s)(r,300),r.style.removeProperty("--overflow")}))}))}))}))}}))})();
//# sourceMappingURL=status-tap.d0263f39.js.map
