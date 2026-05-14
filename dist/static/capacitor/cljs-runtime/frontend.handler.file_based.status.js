goog.provide('frontend.handler.file_based.status');
frontend.handler.file_based.status.marker_pattern = logseq.common.marker.marker_pattern;
frontend.handler.file_based.status.bare_marker_pattern = /(NOW|LATER|TODO|DOING|DONE|WAITING|WAIT|CANCELED|CANCELLED|IN-PROGRESS){1}\s+/;
frontend.handler.file_based.status.add_or_update_marker = (function frontend$handler$file_based$status$add_or_update_marker(content,format,marker){
var vec__62007 = (function (){var G__62010 = format;
var G__62010__$1 = (((G__62010 instanceof cljs.core.Keyword))?G__62010.fqn:null);
switch (G__62010__$1) {
case "org":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [/^\*+\s/,/\n\*+\s/], null);

break;
case "markdown":
case "md":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [/^#+\s/,/\n#+\s/], null);

break;
default:
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [/^#+\s/,/\n#+\s/], null);

}
})();
var re_pattern = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62007,(0),null);
var new_line_re_pattern = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62007,(1),null);
var pos = (function (){var temp__5802__auto__ = cljs.core.seq(frontend.util.re_pos(new_line_re_pattern,content));
if(temp__5802__auto__){
var matches = temp__5802__auto__;
var vec__62012 = cljs.core.last(matches);
var start_pos = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62012,(0),null);
var content__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62012,(1),null);
return (start_pos + cljs.core.count(content__$1));
} else {
return cljs.core.count((frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(re_pattern,content) : frontend.util.safe_re_find.call(null,re_pattern,content)));
}
})();
var new_content = [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(0),pos),clojure.string.replace_first(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(content,pos),(frontend.handler.file_based.status.marker_pattern.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.file_based.status.marker_pattern.cljs$core$IFn$_invoke$arity$1(format) : frontend.handler.file_based.status.marker_pattern.call(null,format)),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(marker),((cljs.core.empty_QMARK_(marker))?"":" ")].join(''))].join('');
return new_content;
});
frontend.handler.file_based.status.cycle_marker_state = (function frontend$handler$file_based$status$cycle_marker_state(marker,preferred_workflow){
var G__62017 = marker;
switch (G__62017) {
case "TODO":
return "DOING";

break;
case "DOING":
return "DONE";

break;
case "LATER":
return "NOW";

break;
case "NOW":
return "DONE";

break;
case "DONE":
return null;

break;
default:
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"now","now",-1650525531),preferred_workflow)){
return "LATER";
} else {
return "TODO";
}

}
});
/**
 * The cycle-marker will cycle markers sequentially. You can find all its order in `cycle-marker-state`.
 * 
 *   It also accepts the specified `marker` and `new-marker`.
 *   If you don't specify it, it will automatically find it based on `content`.
 * 
 *   Returns [new-content new-marker].
 */
frontend.handler.file_based.status.cycle_marker = (function frontend$handler$file_based$status$cycle_marker(content,marker,new_marker,format,preferred_workflow){
var content__$1 = clojure.string.triml(content);
var marker__$1 = (function (){var or__5002__auto__ = cljs.core.not_empty(marker);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.last((function (){var G__62020 = (frontend.handler.file_based.status.marker_pattern.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.file_based.status.marker_pattern.cljs$core$IFn$_invoke$arity$1(format) : frontend.handler.file_based.status.marker_pattern.call(null,format));
var G__62021 = content__$1;
return (frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(G__62020,G__62021) : frontend.util.safe_re_find.call(null,G__62020,G__62021));
})());
}
})();
var new_marker__$1 = (function (){var or__5002__auto__ = cljs.core.not_empty(new_marker);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.handler.file_based.status.cycle_marker_state(marker__$1,preferred_workflow);
}
})();
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.file_based.status.add_or_update_marker(content__$1,format,new_marker__$1),new_marker__$1], null);
});

//# sourceMappingURL=frontend.handler.file_based.status.js.map
