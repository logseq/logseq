/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import{g as o}from"./p-c61cc894.js";var n,i;!function(o){o.Unimplemented="UNIMPLEMENTED",o.Unavailable="UNAVAILABLE"}(n||(n={})),function(o){o.Body="body",o.Ionic="ionic",o.Native="native",o.None="none"}(i||(i={}));const t={getEngine(){const n=o();if(null==n?void 0:n.isPluginAvailable("Keyboard"))return n.Plugins.Keyboard},getResizeMode(){const o=this.getEngine();return(null==o?void 0:o.getResizeMode)?o.getResizeMode().catch((o=>{if(o.code!==n.Unimplemented)throw o})):Promise.resolve(void 0)}};export{t as K,i as a}