goog.provide('borkdude.rewrite_edn');
/**
 * Same as rewrite-clj.parser/parse-string-all
 */
borkdude.rewrite_edn.parse_string = (function borkdude$rewrite_edn$parse_string(s){
return rewrite_clj.parser.parse_string_all(s);
});
/**
 * Same as rewrite-clj.node/sexpr
 */
borkdude.rewrite_edn.sexpr = (function borkdude$rewrite_edn$sexpr(node){
return rewrite_clj.node.sexpr.cljs$core$IFn$_invoke$arity$1(node);
});
/**
 * Associates k to v in node (which may be a forms node as returned by parse-string or map node).
 *   Both k and v are coerced into nodes.
 */
borkdude.rewrite_edn.assoc = (function borkdude$rewrite_edn$assoc(node,k,v){
return borkdude.rewrite_edn.impl.assoc(node,k,v);
});
/**
 * Returns the value mapped to k, default or nil if key not present.
 */
borkdude.rewrite_edn.get = (function borkdude$rewrite_edn$get(var_args){
var G__70843 = arguments.length;
switch (G__70843) {
case 2:
return borkdude.rewrite_edn.get.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return borkdude.rewrite_edn.get.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(borkdude.rewrite_edn.get.cljs$core$IFn$_invoke$arity$2 = (function (node,k){
return borkdude.rewrite_edn.get.cljs$core$IFn$_invoke$arity$3(node,k,rewrite_clj.node.coerce(null));
}));

(borkdude.rewrite_edn.get.cljs$core$IFn$_invoke$arity$3 = (function (node,k,default$){
return borkdude.rewrite_edn.impl.get(node,k,default$);
}));

(borkdude.rewrite_edn.get.cljs$lang$maxFixedArity = 3);

/**
 * Returns the value in a nested associative structure,
 *   where ks is a sequence of keys. Returns nil if the key
 *   is not present, or the not-found value if supplied.
 */
borkdude.rewrite_edn.get_in = (function borkdude$rewrite_edn$get_in(var_args){
var G__70851 = arguments.length;
switch (G__70851) {
case 2:
return borkdude.rewrite_edn.get_in.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return borkdude.rewrite_edn.get_in.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(borkdude.rewrite_edn.get_in.cljs$core$IFn$_invoke$arity$2 = (function (node,ks){
return borkdude.rewrite_edn.get_in.cljs$core$IFn$_invoke$arity$3(node,ks,rewrite_clj.node.coerce(null));
}));

(borkdude.rewrite_edn.get_in.cljs$core$IFn$_invoke$arity$3 = (function (node,ks,not_found){
return borkdude.rewrite_edn.impl.get_in(node,ks,not_found);
}));

(borkdude.rewrite_edn.get_in.cljs$lang$maxFixedArity = 3);

/**
 * Associates value under keys ks in map node with v.
 */
borkdude.rewrite_edn.assoc_in = (function borkdude$rewrite_edn$assoc_in(node,ks,v){
return borkdude.rewrite_edn.impl.assoc_in(node,ks,v);
});
/**
 * Updates value under key k in map node. Function f receives
 *   node. Return value is coerced into node.
 */
borkdude.rewrite_edn.update = (function borkdude$rewrite_edn$update(var_args){
var args__5732__auto__ = [];
var len__5726__auto___70889 = arguments.length;
var i__5727__auto___70890 = (0);
while(true){
if((i__5727__auto___70890 < len__5726__auto___70889)){
args__5732__auto__.push((arguments[i__5727__auto___70890]));

var G__70891 = (i__5727__auto___70890 + (1));
i__5727__auto___70890 = G__70891;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return borkdude.rewrite_edn.update.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(borkdude.rewrite_edn.update.cljs$core$IFn$_invoke$arity$variadic = (function (node,k,f,args){
return borkdude.rewrite_edn.impl.update.cljs$core$IFn$_invoke$arity$4(node,k,f,args);
}));

(borkdude.rewrite_edn.update.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(borkdude.rewrite_edn.update.cljs$lang$applyTo = (function (seq70864){
var G__70866 = cljs.core.first(seq70864);
var seq70864__$1 = cljs.core.next(seq70864);
var G__70867 = cljs.core.first(seq70864__$1);
var seq70864__$2 = cljs.core.next(seq70864__$1);
var G__70868 = cljs.core.first(seq70864__$2);
var seq70864__$3 = cljs.core.next(seq70864__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__70866,G__70867,G__70868,seq70864__$3);
}));

/**
 * Updates value under keys ks in map node. Function f receives
 *   node. Return value is coerced into node.
 */
borkdude.rewrite_edn.update_in = (function borkdude$rewrite_edn$update_in(var_args){
var args__5732__auto__ = [];
var len__5726__auto___70892 = arguments.length;
var i__5727__auto___70893 = (0);
while(true){
if((i__5727__auto___70893 < len__5726__auto___70892)){
args__5732__auto__.push((arguments[i__5727__auto___70893]));

var G__70894 = (i__5727__auto___70893 + (1));
i__5727__auto___70893 = G__70894;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return borkdude.rewrite_edn.update_in.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(borkdude.rewrite_edn.update_in.cljs$core$IFn$_invoke$arity$variadic = (function (node,ks,f,args){
return borkdude.rewrite_edn.impl.update_in(node,ks,f,args);
}));

(borkdude.rewrite_edn.update_in.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(borkdude.rewrite_edn.update_in.cljs$lang$applyTo = (function (seq70874){
var G__70875 = cljs.core.first(seq70874);
var seq70874__$1 = cljs.core.next(seq70874);
var G__70876 = cljs.core.first(seq70874__$1);
var seq70874__$2 = cljs.core.next(seq70874__$1);
var G__70877 = cljs.core.first(seq70874__$2);
var seq70874__$3 = cljs.core.next(seq70874__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__70875,G__70876,G__70877,seq70874__$3);
}));

/**
 * Maps f over keys of node (which may be a forms node as returned by
 *   parse-string or map node).
 */
borkdude.rewrite_edn.map_keys = (function borkdude$rewrite_edn$map_keys(f,node){
return borkdude.rewrite_edn.impl.map_keys(f,node);
});
borkdude.rewrite_edn.dissoc = (function borkdude$rewrite_edn$dissoc(node,k){
return borkdude.rewrite_edn.impl.dissoc(node,k);
});
borkdude.rewrite_edn.keys = (function borkdude$rewrite_edn$keys(node){
return borkdude.rewrite_edn.impl.keys(node);
});
borkdude.rewrite_edn.conj = (function borkdude$rewrite_edn$conj(node,v){
return borkdude.rewrite_edn.impl.conj(node,v);
});
borkdude.rewrite_edn.fnil = (function borkdude$rewrite_edn$fnil(f,nil_replacement){
return borkdude.rewrite_edn.impl.fnil(f,nil_replacement);
});

//# sourceMappingURL=borkdude.rewrite_edn.js.map
