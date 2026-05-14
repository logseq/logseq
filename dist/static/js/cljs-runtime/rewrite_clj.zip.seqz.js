goog.provide('rewrite_clj.zip.seqz');
/**
 * Returns true if current node in `zloc` is a sequence.
 */
rewrite_clj.zip.seqz.seq_QMARK_ = (function rewrite_clj$zip$seqz$seq_QMARK_(zloc){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"namespaced-map","namespaced-map",1235665380),null,new cljs.core.Keyword(null,"vector","vector",1902966158),null,new cljs.core.Keyword(null,"list","list",765357683),null,new cljs.core.Keyword(null,"set","set",304602554),null,new cljs.core.Keyword(null,"map","map",1371690461),null,new cljs.core.Keyword(null,"forms","forms",2045992350),null], null), null),rewrite_clj.zip.base.tag(zloc));
});
/**
 * Returns true if current node in `zloc` is a list.
 */
rewrite_clj.zip.seqz.list_QMARK_ = (function rewrite_clj$zip$seqz$list_QMARK_(zloc){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(rewrite_clj.zip.base.tag(zloc),new cljs.core.Keyword(null,"list","list",765357683));
});
/**
 * Returns true if current node in `zloc` is a vector.
 */
rewrite_clj.zip.seqz.vector_QMARK_ = (function rewrite_clj$zip$seqz$vector_QMARK_(zloc){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(rewrite_clj.zip.base.tag(zloc),new cljs.core.Keyword(null,"vector","vector",1902966158));
});
/**
 * Returns true if current node in `zloc` is a set.
 */
rewrite_clj.zip.seqz.set_QMARK_ = (function rewrite_clj$zip$seqz$set_QMARK_(zloc){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(rewrite_clj.zip.base.tag(zloc),new cljs.core.Keyword(null,"set","set",304602554));
});
/**
 * Returns true if current node in `zloc` is a map.
 */
rewrite_clj.zip.seqz.map_QMARK_ = (function rewrite_clj$zip$seqz$map_QMARK_(zloc){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(rewrite_clj.zip.base.tag(zloc),new cljs.core.Keyword(null,"map","map",1371690461));
});
/**
 * Returns true if the current node in `zloc` is a namespaced map.
 */
rewrite_clj.zip.seqz.namespaced_map_QMARK_ = (function rewrite_clj$zip$seqz$namespaced_map_QMARK_(zloc){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(rewrite_clj.zip.base.tag(zloc),new cljs.core.Keyword(null,"namespaced-map","namespaced-map",1235665380));
});
rewrite_clj.zip.seqz.map_seq = (function rewrite_clj$zip$seqz$map_seq(f,zloc){
if(rewrite_clj.zip.seqz.seq_QMARK_(zloc)){
} else {
throw (new Error("Assert failed: (seq? zloc)"));
}

var temp__5802__auto__ = rewrite_clj.zip.move.down(zloc);
if(cljs.core.truth_(temp__5802__auto__)){
var zloc_n0 = temp__5802__auto__;
var G__67655 = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(zloc_n0) : f.call(null,zloc_n0));
var G__67655__$1 = (((G__67655 == null))?null:cljs.core.iterate((function (loc){
var temp__5804__auto__ = rewrite_clj.zip.move.right(loc);
if(cljs.core.truth_(temp__5804__auto__)){
var zloc_n = temp__5804__auto__;
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(zloc_n) : f.call(null,zloc_n));
} else {
return null;
}
}),G__67655));
var G__67655__$2 = (((G__67655__$1 == null))?null:cljs.core.take_while.cljs$core$IFn$_invoke$arity$2(cljs.core.identity,G__67655__$1));
var G__67655__$3 = (((G__67655__$2 == null))?null:cljs.core.last(G__67655__$2));
if((G__67655__$3 == null)){
return null;
} else {
return rewrite_clj.zip.move.up(G__67655__$3);
}
} else {
return zloc;
}
});
rewrite_clj.zip.seqz.map_vals_STAR_ = (function rewrite_clj$zip$seqz$map_vals_STAR_(f,map_loc){
var loc = rewrite_clj.zip.move.down(map_loc);
var parent = map_loc;
while(true){
if(cljs.core.not((function (){var and__5000__auto__ = loc;
if(cljs.core.truth_(and__5000__auto__)){
return rewrite_clj.custom_zipper.core.node(loc);
} else {
return and__5000__auto__;
}
})())){
return parent;
} else {
var temp__5802__auto__ = rewrite_clj.zip.move.right(loc);
if(cljs.core.truth_(temp__5802__auto__)){
var zloc_map_value = temp__5802__auto__;
var temp__5802__auto____$1 = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(zloc_map_value) : f.call(null,zloc_map_value));
if(cljs.core.truth_(temp__5802__auto____$1)){
var new_zloc_map_value = temp__5802__auto____$1;
var G__67665 = rewrite_clj.zip.move.right(new_zloc_map_value);
var G__67666 = rewrite_clj.zip.move.up(new_zloc_map_value);
loc = G__67665;
parent = G__67666;
continue;
} else {
var G__67667 = rewrite_clj.zip.move.right(zloc_map_value);
var G__67668 = parent;
loc = G__67667;
parent = G__67668;
continue;
}
} else {
return parent;
}
}
break;
}
});
rewrite_clj.zip.seqz.map_loc = (function rewrite_clj$zip$seqz$map_loc(zloc){
if(rewrite_clj.zip.seqz.namespaced_map_QMARK_(zloc)){
return rewrite_clj.zip.move.rightmost(rewrite_clj.zip.move.down(zloc));
} else {
return zloc;
}
});
rewrite_clj.zip.seqz.container_loc = (function rewrite_clj$zip$seqz$container_loc(zloc,map_loc){
if(rewrite_clj.zip.seqz.namespaced_map_QMARK_(zloc)){
return rewrite_clj.zip.move.up(map_loc);
} else {
return map_loc;
}
});
/**
 * Returns `zloc` with function `f` applied to each value node of the current node.
 * Current node must be map node.
 * 
 *   `zloc` location is unchanged.
 * 
 *   `f` arg is zloc positioned at value node and should return:
 *   - an updated zloc with zloc positioned at value node
 *   - a falsey value to leave value node unchanged
 * 
 *   Folks typically use [[edit]] for `f`.
 */
rewrite_clj.zip.seqz.map_vals = (function rewrite_clj$zip$seqz$map_vals(f,zloc){
if(((rewrite_clj.zip.seqz.map_QMARK_(zloc)) || (rewrite_clj.zip.seqz.namespaced_map_QMARK_(zloc)))){
} else {
throw (new Error("Assert failed: (or (map? zloc) (namespaced-map? zloc))"));
}

return rewrite_clj.zip.seqz.container_loc(zloc,rewrite_clj.zip.seqz.map_vals_STAR_(f,rewrite_clj.zip.seqz.map_loc(zloc)));
});
rewrite_clj.zip.seqz.map_keys_STAR_ = (function rewrite_clj$zip$seqz$map_keys_STAR_(f,map_loc){
var loc = rewrite_clj.zip.move.down(map_loc);
var parent = map_loc;
while(true){
if(cljs.core.not((function (){var and__5000__auto__ = loc;
if(cljs.core.truth_(and__5000__auto__)){
return rewrite_clj.custom_zipper.core.node(loc);
} else {
return and__5000__auto__;
}
})())){
return parent;
} else {
var temp__5802__auto__ = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(loc) : f.call(null,loc));
if(cljs.core.truth_(temp__5802__auto__)){
var zloc_map_key = temp__5802__auto__;
var G__67669 = rewrite_clj.zip.move.right(rewrite_clj.zip.move.right(zloc_map_key));
var G__67670 = rewrite_clj.zip.move.up(zloc_map_key);
loc = G__67669;
parent = G__67670;
continue;
} else {
var G__67671 = rewrite_clj.zip.move.right(rewrite_clj.zip.move.right(loc));
var G__67672 = parent;
loc = G__67671;
parent = G__67672;
continue;
}
}
break;
}
});
/**
 * Returns `zloc` with function `f` applied to all key nodes of the current node.
 * Current node must be map node.
 * 
 *   `zloc` location is unchanged.
 * 
 *   `f` arg is zloc positioned at key node and should return:
 *   - an updated zloc with zloc positioned at key node
 *   - a falsey value to leave value node unchanged
 * 
 *   Folks typically use [[rewrite-clj.zip/edit]] for `f`.
 */
rewrite_clj.zip.seqz.map_keys = (function rewrite_clj$zip$seqz$map_keys(f,zloc){
if(((rewrite_clj.zip.seqz.map_QMARK_(zloc)) || (rewrite_clj.zip.seqz.namespaced_map_QMARK_(zloc)))){
} else {
throw (new Error("Assert failed: (or (map? zloc) (namespaced-map? zloc))"));
}

return rewrite_clj.zip.seqz.container_loc(zloc,rewrite_clj.zip.seqz.map_keys_STAR_(f,rewrite_clj.zip.seqz.map_loc(zloc)));
});
/**
 * Returns `zloc` with function `f` applied to all nodes of the current node.
 *   Current node must be a sequence node. Equivalent to [[rewrite-clj.zip/map-vals]] for maps.
 * 
 *   `zloc` location is unchanged.
 * 
 *   `f` arg is zloc positioned at
 *   - value nodes for maps
 *   - each element of a seq
 *   and is should return:
 *   - an updated zloc with zloc positioned at edited node
 *   - a falsey value to leave value node unchanged
 * 
 *   Folks typically use [[edit]] for `f`.
 */
rewrite_clj.zip.seqz.map = (function rewrite_clj$zip$seqz$map(f,zloc){
if(rewrite_clj.zip.seqz.seq_QMARK_(zloc)){
} else {
throw (new Error("Assert failed: (seq? zloc)"));
}

if(((rewrite_clj.zip.seqz.map_QMARK_(zloc)) || (rewrite_clj.zip.seqz.namespaced_map_QMARK_(zloc)))){
return rewrite_clj.zip.seqz.map_vals(f,zloc);
} else {
return rewrite_clj.zip.seqz.map_seq(f,zloc);
}
});
/**
 * Returns `zloc` located to map key node's sexpr value matching `k` else `nil`.
 * 
 *   `k` should be:
 *   - a key for maps
 *   - a zero-based index for sequences
 * 
 *   NOTE: `k` will be compared against resolved keywords in maps.
 *   See docs for sexpr behavior on [namespaced elements](/doc/01-user-guide.adoc#namespaced-elements).
 */
rewrite_clj.zip.seqz.get = (function rewrite_clj$zip$seqz$get(zloc,k){
if(((rewrite_clj.zip.seqz.map_QMARK_(zloc)) || (((rewrite_clj.zip.seqz.namespaced_map_QMARK_(zloc)) || (((rewrite_clj.zip.seqz.seq_QMARK_(zloc)) && (cljs.core.integer_QMARK_(k)))))))){
} else {
throw (new Error("Assert failed: (or (map? zloc) (namespaced-map? zloc) (and (seq? zloc) (integer? k)))"));
}

if(rewrite_clj.zip.seqz.map_QMARK_(zloc)){
var G__67662 = zloc;
var G__67662__$1 = (((G__67662 == null))?null:rewrite_clj.zip.move.down(G__67662));
var G__67662__$2 = (((G__67662__$1 == null))?null:rewrite_clj.zip.findz.find_value.cljs$core$IFn$_invoke$arity$2(G__67662__$1,k));
if((G__67662__$2 == null)){
return null;
} else {
return rewrite_clj.zip.move.right(G__67662__$2);
}
} else {
if(rewrite_clj.zip.seqz.namespaced_map_QMARK_(zloc)){
var G__67663 = zloc;
var G__67663__$1 = (((G__67663 == null))?null:rewrite_clj.zip.move.down(G__67663));
var G__67663__$2 = (((G__67663__$1 == null))?null:rewrite_clj.zip.move.rightmost(G__67663__$1));
var G__67663__$3 = (((G__67663__$2 == null))?null:rewrite_clj.zip.move.down(G__67663__$2));
var G__67663__$4 = (((G__67663__$3 == null))?null:rewrite_clj.zip.findz.find_value.cljs$core$IFn$_invoke$arity$2(G__67663__$3,k));
if((G__67663__$4 == null)){
return null;
} else {
return rewrite_clj.zip.move.right(G__67663__$4);
}
} else {
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2((function (){var G__67664 = rewrite_clj.zip.move.down(zloc);
var G__67664__$1 = (((G__67664 == null))?null:cljs.core.iterate(rewrite_clj.zip.move.right,G__67664));
if((G__67664__$1 == null)){
return null;
} else {
return cljs.core.take_while.cljs$core$IFn$_invoke$arity$2(cljs.core.identity,G__67664__$1);
}
})(),k);

}
}
});
/**
 * Returns `zloc` with current node's `k` set to value `v`.
 * 
 *   `zloc` location is unchanged.
 * 
 *   `k` should be:
 *   - a key for maps
 *   - a zero-based index for sequences, an exception is thrown if index is out of bounds
 * 
 *   NOTE: `k` will be compared against resolved keywords in maps.
 *   See docs for sexpr behavior on [namespaced elements](/doc/01-user-guide.adoc#namespaced-elements).
 */
rewrite_clj.zip.seqz.assoc = (function rewrite_clj$zip$seqz$assoc(zloc,k,v){
return rewrite_clj.zip.seqz.container_loc(zloc,(function (){var temp__5802__auto__ = rewrite_clj.zip.seqz.get(zloc,k);
if(cljs.core.truth_(temp__5802__auto__)){
var value_loc = temp__5802__auto__;
return rewrite_clj.zip.move.up(rewrite_clj.zip.editz.replace(value_loc,v));
} else {
if(((rewrite_clj.zip.seqz.map_QMARK_(zloc)) || (rewrite_clj.zip.seqz.namespaced_map_QMARK_(zloc)))){
return rewrite_clj.zip.insert.append_child(rewrite_clj.zip.insert.append_child(rewrite_clj.zip.seqz.map_loc(zloc),k),v);
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["index out of bounds: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(k)].join(''),cljs.core.PersistentArrayMap.EMPTY);
}
}
})());
});

//# sourceMappingURL=rewrite_clj.zip.seqz.js.map
