goog.provide('frontend.util.file_based.priority');
frontend.util.file_based.priority.add_or_update_priority = (function frontend$util$file_based$priority$add_or_update_priority(content,format,priority){
var priority_pattern = /(\[#[ABC]\])?\s?/;
var vec__102168 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"org","org",1495985),format))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [/\*+\s/,/\n\*+\s/], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [/#+\s/,/\n#+\s/], null));
var re_pattern = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102168,(0),null);
var new_line_re_pattern = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102168,(1),null);
var skip_hash_pos = (function (){var temp__5802__auto__ = cljs.core.seq(frontend.util.re_pos(new_line_re_pattern,content));
if(temp__5802__auto__){
var matches = temp__5802__auto__;
var vec__102171 = cljs.core.last(matches);
var start_pos = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102171,(0),null);
var content__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102171,(1),null);
return (start_pos + cljs.core.count(content__$1));
} else {
return cljs.core.count((frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2 ? frontend.util.safe_re_find.cljs$core$IFn$_invoke$arity$2(re_pattern,content) : frontend.util.safe_re_find.call(null,re_pattern,content)));
}
})();
var skip_marker_pos = (function (){var temp__5802__auto__ = cljs.core.seq(frontend.util.re_pos(frontend.handler.file_based.status.bare_marker_pattern,cljs.core.subs.cljs$core$IFn$_invoke$arity$2(content,skip_hash_pos)));
if(temp__5802__auto__){
var matches = temp__5802__auto__;
var vec__102174 = cljs.core.last(matches);
var start_pos = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102174,(0),null);
var content__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102174,(1),null);
return (start_pos + cljs.core.count(content__$1));
} else {
return (0);
}
})();
var pos = (skip_hash_pos + skip_marker_pos);
var new_content = [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(0),pos),clojure.string.replace_first(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(content,pos),priority_pattern,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(priority)," "].join(''))].join('');
return new_content;
});

//# sourceMappingURL=frontend.util.file_based.priority.js.map
