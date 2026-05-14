goog.provide('frontend.security');
var module$node_modules$dompurify$dist$purify=shadow.js.require("module$node_modules$dompurify$dist$purify", {});
frontend.security.sanitization_options = cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"ADD_TAGS","ADD_TAGS",-1262226946),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["iframe"], null),new cljs.core.Keyword(null,"ADD_ATTR","ADD_ATTR",995175892),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["is"], null),new cljs.core.Keyword(null,"ALLOW_UNKNOWN_PROTOCOLS","ALLOW_UNKNOWN_PROTOCOLS",-2099585817),true], null));
frontend.security.sanitize_html = (function frontend$security$sanitize_html(html){
return module$node_modules$dompurify$dist$purify.sanitize(html,frontend.security.sanitization_options);
});

//# sourceMappingURL=frontend.security.js.map
