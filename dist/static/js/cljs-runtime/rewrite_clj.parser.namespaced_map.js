goog.provide('rewrite_clj.parser.namespaced_map');
rewrite_clj.parser.namespaced_map.parse_qualifier = (function rewrite_clj$parser$namespaced_map$parse_qualifier(reader){
var auto_resolved_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(":",rewrite_clj.reader.read_while.cljs$core$IFn$_invoke$arity$2(reader,(function (c){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(":",c);
})));
var prefix = rewrite_clj.reader.read_until(reader,(function (c){
var or__5002__auto__ = rewrite_clj.reader.boundary_QMARK_(c);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return rewrite_clj.reader.whitespace_QMARK_(c);
}
}));
return rewrite_clj.node.namespaced_map.map_qualifier_node(auto_resolved_QMARK_,((cljs.core.seq(prefix))?prefix:null));
});
rewrite_clj.parser.namespaced_map.parse_to_next_elem = (function rewrite_clj$parser$namespaced_map$parse_to_next_elem(reader,read_next){
var nodes = cljs.core.PersistentVector.EMPTY;
while(true){
var n = (read_next.cljs$core$IFn$_invoke$arity$1 ? read_next.cljs$core$IFn$_invoke$arity$1(reader) : read_next.call(null,reader));
if(cljs.core.truth_((function (){var and__5000__auto__ = n;
if(cljs.core.truth_(and__5000__auto__)){
return rewrite_clj.node.whitespace.whitespace_QMARK_(n);
} else {
return and__5000__auto__;
}
})())){
var G__65815 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(nodes,n);
nodes = G__65815;
continue;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [nodes,n], null);
}
break;
}
});
/**
 * The caller has parsed up to `#:` and delegates the details to us.
 */
rewrite_clj.parser.namespaced_map.parse_namespaced_map = (function rewrite_clj$parser$namespaced_map$parse_namespaced_map(reader,read_next){
rewrite_clj.reader.ignore(reader);

var qualifier_node = rewrite_clj.parser.namespaced_map.parse_qualifier(reader);
if(((cljs.core.not(qualifier_node.auto_resolved_QMARK_)) && ((qualifier_node.prefix == null)))){
rewrite_clj.reader.throw_reader(reader,"namespaced map expects a namespace");
} else {
}

var vec__65812 = rewrite_clj.parser.namespaced_map.parse_to_next_elem(reader,read_next);
var whitespace_nodes = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65812,(0),null);
var map_node = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__65812,(1),null);
if(((cljs.core.not(map_node)) || (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"map","map",1371690461),rewrite_clj.node.protocols.tag(map_node))))){
rewrite_clj.reader.throw_reader(reader,"namespaced map expects a map");
} else {
}

return rewrite_clj.node.namespaced_map.namespaced_map_node(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [qualifier_node], null),whitespace_nodes,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [map_node], null)], 0)));
});

//# sourceMappingURL=rewrite_clj.parser.namespaced_map.js.map
