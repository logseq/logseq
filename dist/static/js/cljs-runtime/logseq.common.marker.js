goog.provide('logseq.common.marker');
logseq.common.marker.marker_pattern = (function logseq$common$marker$marker_pattern(format){
return cljs.core.re_pattern(["^",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(format,new cljs.core.Keyword(null,"markdown","markdown",1227225089)))?"(#+\\s+)?":"(\\*+\\s+)?"),"(NOW|LATER|TODO|DOING|DONE|WAITING|WAIT|CANCELED|CANCELLED|IN-PROGRESS)?\\s?"].join(''));
});
logseq.common.marker.clean_marker = (function logseq$common$marker$clean_marker(content,format){
return clojure.string.replace_first(content,logseq.common.marker.marker_pattern(format),"");
});

//# sourceMappingURL=logseq.common.marker.js.map
