goog.provide('rewrite_clj.parser.keyword');
rewrite_clj.parser.keyword.parse_keyword = (function rewrite_clj$parser$keyword$parse_keyword(reader){
rewrite_clj.reader.ignore(reader);

var temp__5802__auto__ = rewrite_clj.reader.peek(reader);
if(cljs.core.truth_(temp__5802__auto__)){
var c = temp__5802__auto__;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(c,":")){
rewrite_clj.reader.next(reader);

return rewrite_clj.node.keyword.keyword_node.cljs$core$IFn$_invoke$arity$2(rewrite_clj.reader.read_keyword(reader),true);
} else {
return rewrite_clj.node.keyword.keyword_node.cljs$core$IFn$_invoke$arity$1(rewrite_clj.reader.read_keyword(reader));
}
} else {
return rewrite_clj.reader.throw_reader(reader,"unexpected EOF while reading keyword.");
}
});

//# sourceMappingURL=rewrite_clj.parser.keyword.js.map
