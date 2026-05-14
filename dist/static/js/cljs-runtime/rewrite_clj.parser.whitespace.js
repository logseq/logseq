goog.provide('rewrite_clj.parser.whitespace');
/**
 * Parse as much whitespace as possible. The created node can either contain
 * only linebreaks or only space/tabs.
 */
rewrite_clj.parser.whitespace.parse_whitespace = (function rewrite_clj$parser$whitespace$parse_whitespace(reader){
var c = rewrite_clj.reader.peek(reader);
if(rewrite_clj.reader.linebreak_QMARK_(c)){
return rewrite_clj.node.whitespace.newline_node(rewrite_clj.reader.read_while.cljs$core$IFn$_invoke$arity$2(reader,rewrite_clj.reader.linebreak_QMARK_));
} else {
if(rewrite_clj.reader.comma_QMARK_(c)){
return rewrite_clj.node.whitespace.comma_node(rewrite_clj.reader.read_while.cljs$core$IFn$_invoke$arity$2(reader,rewrite_clj.reader.comma_QMARK_));
} else {
return rewrite_clj.node.whitespace.whitespace_node(rewrite_clj.reader.read_while.cljs$core$IFn$_invoke$arity$2(reader,rewrite_clj.reader.space_QMARK_));

}
}
});

//# sourceMappingURL=rewrite_clj.parser.whitespace.js.map
