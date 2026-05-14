(()=>{var e=("undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{}).parcelRequired5b2;e.register("4PcHG",(function(t,n){var o,r,i,a;o=t.exports,r="createSwipeBackGesture",i=()=>d,Object.defineProperty(o,r,{get:i,set:a,enumerable:!0,configurable:!0});
/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
var l=e("1WzNu"),s=e("bzABT"),c=e("GDK4o");const d=(e,t,n,o,r)=>{const i=e.ownerDocument.defaultView;let a=(0,s.i)(e);const d=e=>a?-e.deltaX:e.deltaX;return(0,c.createGesture)({el:e,gestureName:"goback-swipe",gesturePriority:101,threshold:10,canStart:n=>(a=(0,s.i)(e),(e=>{const{startX:t}=e;return a?t>=i.innerWidth-50:t<=50})(n)&&t()),onStart:n,onMove:e=>{const t=d(e)/i.innerWidth;o(t)},onEnd:e=>{const t=d(e),n=i.innerWidth,o=t/n,s=(e=>a?-e.velocityX:e.velocityX)(e),c=s>=0&&(s>.2||t>n/2),u=(c?1-o:o)*n;let f=0;if(u>5){const e=u/Math.abs(s);f=Math.min(e,540)}r(c,o<=0?.01:(0,l.k)(0,o,.9999),f)}})}}))})();
//# sourceMappingURL=swipe-back.8e405609.js.map
