goog.provide('rewrite_clj.zip.findz');
rewrite_clj.zip.findz.tag_predicate = (function rewrite_clj$zip$findz$tag_predicate(var_args){
var args__5732__auto__ = [];
var len__5726__auto___67623 = arguments.length;
var i__5727__auto___67624 = (0);
while(true){
if((i__5727__auto___67624 < len__5726__auto___67623)){
args__5732__auto__.push((arguments[i__5727__auto___67624]));

var G__67625 = (i__5727__auto___67624 + (1));
i__5727__auto___67624 = G__67625;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return rewrite_clj.zip.findz.tag_predicate.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(rewrite_clj.zip.findz.tag_predicate.cljs$core$IFn$_invoke$arity$variadic = (function (t,p__67540){
var vec__67542 = p__67540;
var additional = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67542,(0),null);
if(cljs.core.truth_(additional)){
return (function (node){
var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(rewrite_clj.zip.base.tag(node),t);
if(and__5000__auto__){
return (additional.cljs$core$IFn$_invoke$arity$1 ? additional.cljs$core$IFn$_invoke$arity$1(node) : additional.call(null,node));
} else {
return and__5000__auto__;
}
});
} else {
return (function (p1__67527_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(rewrite_clj.zip.base.tag(p1__67527_SHARP_),t);
});
}
}));

(rewrite_clj.zip.findz.tag_predicate.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(rewrite_clj.zip.findz.tag_predicate.cljs$lang$applyTo = (function (seq67528){
var G__67529 = cljs.core.first(seq67528);
var seq67528__$1 = cljs.core.next(seq67528);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67529,seq67528__$1);
}));

rewrite_clj.zip.findz.position_in_range_QMARK_ = (function rewrite_clj$zip$findz$position_in_range_QMARK_(zloc,pos){
var vec__67553 = ((cljs.core.map_QMARK_(pos))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"row","row",-570139521).cljs$core$IFn$_invoke$arity$1(pos),new cljs.core.Keyword(null,"col","col",-1959363084).cljs$core$IFn$_invoke$arity$1(pos)], null):pos);
var r = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67553,(0),null);
var c = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67553,(1),null);
if((((r <= (0))) || ((c <= (0))))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("zipper row and col positions are ones-based",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pos","pos",-864607220),pos], null));
} else {
}

var vec__67556 = rewrite_clj.custom_zipper.core.position_span(zloc);
var vec__67559 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67556,(0),null);
var zstart_row = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67559,(0),null);
var zstart_col = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67559,(1),null);
var vec__67562 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67556,(1),null);
var zend_row = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67562,(0),null);
var zend_col = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67562,(1),null);
var and__5000__auto__ = (r >= zstart_row);
if(and__5000__auto__){
var and__5000__auto____$1 = (r <= zend_row);
if(and__5000__auto____$1){
var and__5000__auto____$2 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(r,zstart_row))?(c >= zstart_col):true);
if(and__5000__auto____$2){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(r,zend_row)){
return (c < zend_col);
} else {
return true;
}
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
});
/**
 * Return `zloc` located to the first node satisfying predicate `p?` else nil.
 * Search starts at the current node and continues via movement function `f`.
 * 
 * `f` defaults to [[right]]
 */
rewrite_clj.zip.findz.find = (function rewrite_clj$zip$findz$find(var_args){
var G__67570 = arguments.length;
switch (G__67570) {
case 2:
return rewrite_clj.zip.findz.find.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return rewrite_clj.zip.findz.find.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.zip.findz.find.cljs$core$IFn$_invoke$arity$2 = (function (zloc,p_QMARK_){
return rewrite_clj.zip.findz.find.cljs$core$IFn$_invoke$arity$3(zloc,rewrite_clj.zip.move.right,p_QMARK_);
}));

(rewrite_clj.zip.findz.find.cljs$core$IFn$_invoke$arity$3 = (function (zloc,f,p_QMARK_){
return cljs.core.first(cljs.core.drop_while.cljs$core$IFn$_invoke$arity$2(cljs.core.complement(p_QMARK_),cljs.core.take_while.cljs$core$IFn$_invoke$arity$2(cljs.core.complement(rewrite_clj.zip.move.end_QMARK_),cljs.core.take_while.cljs$core$IFn$_invoke$arity$2(cljs.core.identity,cljs.core.iterate(f,zloc)))));
}));

(rewrite_clj.zip.findz.find.cljs$lang$maxFixedArity = 3);

/**
 * Return `zloc` located to the last node spanning position `pos` that satisfies predicate `p?` else `nil`.
 * Search is depth-first from the current node.
 * 
 *   NOTE: Does not ignore whitespace/comment nodes.
 */
rewrite_clj.zip.findz.find_last_by_pos = (function rewrite_clj$zip$findz$find_last_by_pos(var_args){
var G__67576 = arguments.length;
switch (G__67576) {
case 2:
return rewrite_clj.zip.findz.find_last_by_pos.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return rewrite_clj.zip.findz.find_last_by_pos.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.zip.findz.find_last_by_pos.cljs$core$IFn$_invoke$arity$2 = (function (zloc,pos){
return rewrite_clj.zip.findz.find_last_by_pos.cljs$core$IFn$_invoke$arity$3(zloc,pos,cljs.core.constantly(true));
}));

(rewrite_clj.zip.findz.find_last_by_pos.cljs$core$IFn$_invoke$arity$3 = (function (zloc,pos,p_QMARK_){
return cljs.core.last(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__67573_SHARP_){
var and__5000__auto__ = (p_QMARK_.cljs$core$IFn$_invoke$arity$1 ? p_QMARK_.cljs$core$IFn$_invoke$arity$1(p1__67573_SHARP_) : p_QMARK_.call(null,p1__67573_SHARP_));
if(cljs.core.truth_(and__5000__auto__)){
return rewrite_clj.zip.findz.position_in_range_QMARK_(p1__67573_SHARP_,pos);
} else {
return and__5000__auto__;
}
}),cljs.core.take_while.cljs$core$IFn$_invoke$arity$2(cljs.core.complement(rewrite_clj.zip.move.end_QMARK_),cljs.core.take_while.cljs$core$IFn$_invoke$arity$2(cljs.core.identity,cljs.core.iterate(rewrite_clj.custom_zipper.core.next,zloc)))));
}));

(rewrite_clj.zip.findz.find_last_by_pos.cljs$lang$maxFixedArity = 3);

/**
 * Return `zloc` located to the first node satisfying predicate `p?` else `nil`.
 * Search is depth-first from the current node.
 */
rewrite_clj.zip.findz.find_depth_first = (function rewrite_clj$zip$findz$find_depth_first(zloc,p_QMARK_){
return rewrite_clj.zip.findz.find.cljs$core$IFn$_invoke$arity$3(zloc,rewrite_clj.zip.move.next,p_QMARK_);
});
/**
 * Return `zloc` located to the next node satisfying predicate `p?` else `nil`.
 * Search starts one movement `f` from the current node and continues via `f`.
 * 
 * `f` defaults to [[right]]
 */
rewrite_clj.zip.findz.find_next = (function rewrite_clj$zip$findz$find_next(var_args){
var G__67587 = arguments.length;
switch (G__67587) {
case 2:
return rewrite_clj.zip.findz.find_next.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return rewrite_clj.zip.findz.find_next.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.zip.findz.find_next.cljs$core$IFn$_invoke$arity$2 = (function (zloc,p_QMARK_){
return rewrite_clj.zip.findz.find_next.cljs$core$IFn$_invoke$arity$3(zloc,rewrite_clj.zip.move.right,p_QMARK_);
}));

(rewrite_clj.zip.findz.find_next.cljs$core$IFn$_invoke$arity$3 = (function (zloc,f,p_QMARK_){
var G__67590 = zloc;
var G__67590__$1 = (((G__67590 == null))?null:(f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(G__67590) : f.call(null,G__67590)));
if((G__67590__$1 == null)){
return null;
} else {
return rewrite_clj.zip.findz.find.cljs$core$IFn$_invoke$arity$3(G__67590__$1,f,p_QMARK_);
}
}));

(rewrite_clj.zip.findz.find_next.cljs$lang$maxFixedArity = 3);

/**
 * Return `zloc` located to next node satisfying predicate `p?` else `nil`.
 * Search starts depth-first after the current node.
 */
rewrite_clj.zip.findz.find_next_depth_first = (function rewrite_clj$zip$findz$find_next_depth_first(zloc,p_QMARK_){
return rewrite_clj.zip.findz.find_next.cljs$core$IFn$_invoke$arity$3(zloc,rewrite_clj.zip.move.next,p_QMARK_);
});
/**
 * Return `zloc` located to the first node with tag `t` else `nil`.
 * Search starts at the current node and continues via movement function `f`.
 * 
 * `f` defaults to [[right]]
 */
rewrite_clj.zip.findz.find_tag = (function rewrite_clj$zip$findz$find_tag(var_args){
var G__67596 = arguments.length;
switch (G__67596) {
case 2:
return rewrite_clj.zip.findz.find_tag.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return rewrite_clj.zip.findz.find_tag.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.zip.findz.find_tag.cljs$core$IFn$_invoke$arity$2 = (function (zloc,t){
return rewrite_clj.zip.findz.find_tag.cljs$core$IFn$_invoke$arity$3(zloc,rewrite_clj.zip.move.right,t);
}));

(rewrite_clj.zip.findz.find_tag.cljs$core$IFn$_invoke$arity$3 = (function (zloc,f,t){
return rewrite_clj.zip.findz.find.cljs$core$IFn$_invoke$arity$3(zloc,f,(function (p1__67594_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(rewrite_clj.zip.base.tag(p1__67594_SHARP_),t);
}));
}));

(rewrite_clj.zip.findz.find_tag.cljs$lang$maxFixedArity = 3);

/**
 * Return `zloc` located to the next node with tag `t` else `nil`.
 *   Search starts one movement `f` after the current node and continues via `f`.
 * 
 * `f` defaults to [[right]]
 */
rewrite_clj.zip.findz.find_next_tag = (function rewrite_clj$zip$findz$find_next_tag(var_args){
var G__67599 = arguments.length;
switch (G__67599) {
case 2:
return rewrite_clj.zip.findz.find_next_tag.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return rewrite_clj.zip.findz.find_next_tag.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.zip.findz.find_next_tag.cljs$core$IFn$_invoke$arity$2 = (function (zloc,t){
return rewrite_clj.zip.findz.find_next_tag.cljs$core$IFn$_invoke$arity$3(zloc,rewrite_clj.zip.move.right,t);
}));

(rewrite_clj.zip.findz.find_next_tag.cljs$core$IFn$_invoke$arity$3 = (function (zloc,f,t){
return rewrite_clj.zip.findz.find_next.cljs$core$IFn$_invoke$arity$3(zloc,f,rewrite_clj.zip.findz.tag_predicate(t));
}));

(rewrite_clj.zip.findz.find_next_tag.cljs$lang$maxFixedArity = 3);

/**
 * Return `zloc` located to the last node spanning position `pos` with tag `t` else `nil`.
 *   Search is depth-first from the current node.
 */
rewrite_clj.zip.findz.find_tag_by_pos = (function rewrite_clj$zip$findz$find_tag_by_pos(zloc,pos,t){
return rewrite_clj.zip.findz.find_last_by_pos.cljs$core$IFn$_invoke$arity$3(zloc,pos,(function (p1__67600_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(rewrite_clj.zip.base.tag(p1__67600_SHARP_),t);
}));
});
/**
 * Return `zloc` located to the the first token node satisfying predicate `p?`.
 *   Search starts at the current node and continues via movement function `f`.
 * 
 * `f` defaults to [[right]]
 */
rewrite_clj.zip.findz.find_token = (function rewrite_clj$zip$findz$find_token(var_args){
var G__67603 = arguments.length;
switch (G__67603) {
case 2:
return rewrite_clj.zip.findz.find_token.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return rewrite_clj.zip.findz.find_token.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.zip.findz.find_token.cljs$core$IFn$_invoke$arity$2 = (function (zloc,p_QMARK_){
return rewrite_clj.zip.findz.find_token.cljs$core$IFn$_invoke$arity$3(zloc,rewrite_clj.zip.move.right,p_QMARK_);
}));

(rewrite_clj.zip.findz.find_token.cljs$core$IFn$_invoke$arity$3 = (function (zloc,f,p_QMARK_){
return rewrite_clj.zip.findz.find.cljs$core$IFn$_invoke$arity$3(zloc,f,rewrite_clj.zip.findz.tag_predicate.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"token","token",-1211463215),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p_QMARK_], 0)));
}));

(rewrite_clj.zip.findz.find_token.cljs$lang$maxFixedArity = 3);

/**
 * Return `zloc` located to the next token node satisfying predicate `p?` else `nil`.
 *   Search starts one movement `f` after the current node and continues via `f`.
 * 
 * `f` defaults to [[right]]
 */
rewrite_clj.zip.findz.find_next_token = (function rewrite_clj$zip$findz$find_next_token(var_args){
var G__67608 = arguments.length;
switch (G__67608) {
case 2:
return rewrite_clj.zip.findz.find_next_token.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return rewrite_clj.zip.findz.find_next_token.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.zip.findz.find_next_token.cljs$core$IFn$_invoke$arity$2 = (function (zloc,p_QMARK_){
return rewrite_clj.zip.findz.find_next_token.cljs$core$IFn$_invoke$arity$3(zloc,rewrite_clj.zip.move.right,p_QMARK_);
}));

(rewrite_clj.zip.findz.find_next_token.cljs$core$IFn$_invoke$arity$3 = (function (zloc,f,p_QMARK_){
return rewrite_clj.zip.findz.find_token.cljs$core$IFn$_invoke$arity$3((f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(zloc) : f.call(null,zloc)),f,p_QMARK_);
}));

(rewrite_clj.zip.findz.find_next_token.cljs$lang$maxFixedArity = 3);

/**
 * Return `zloc` located to the first token node that `sexpr`esses to `v` else `nil`.
 * Search starts from the current node and continues via movement function `f`.
 * 
 * `v` can be a single value or a set. When `v` is a set, matches on any value in set.
 * 
 * `f` defaults to [[right]] in short form call.
 * 
 *   See docs for [sexpr nuances](/doc/01-user-guide.adoc#sexpr-nuances).
 */
rewrite_clj.zip.findz.find_value = (function rewrite_clj$zip$findz$find_value(var_args){
var G__67617 = arguments.length;
switch (G__67617) {
case 2:
return rewrite_clj.zip.findz.find_value.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return rewrite_clj.zip.findz.find_value.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.zip.findz.find_value.cljs$core$IFn$_invoke$arity$2 = (function (zloc,v){
return rewrite_clj.zip.findz.find_value.cljs$core$IFn$_invoke$arity$3(zloc,rewrite_clj.zip.move.right,v);
}));

(rewrite_clj.zip.findz.find_value.cljs$core$IFn$_invoke$arity$3 = (function (zloc,f,v){
var p_QMARK_ = ((cljs.core.set_QMARK_(v))?cljs.core.comp.cljs$core$IFn$_invoke$arity$2(v,rewrite_clj.zip.base.sexpr):(function (p1__67611_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(rewrite_clj.zip.base.sexpr(p1__67611_SHARP_),v);
}));
return rewrite_clj.zip.findz.find_token.cljs$core$IFn$_invoke$arity$3(zloc,f,p_QMARK_);
}));

(rewrite_clj.zip.findz.find_value.cljs$lang$maxFixedArity = 3);

/**
 * Return `zloc` located to the next token node that `sexpr`esses to `v` else `nil`.
 * Search starts one movement `f` from the current location, and continues via `f`.
 * 
 * `v` can be a single value or a set. When `v` is a set matches on any value in set.
 * 
 * `f` defaults to [[right]] in short form call.
 * 
 *   See docs for [sexpr nuances](/doc/01-user-guide.adoc#sexpr-nuances).
 */
rewrite_clj.zip.findz.find_next_value = (function rewrite_clj$zip$findz$find_next_value(var_args){
var G__67619 = arguments.length;
switch (G__67619) {
case 2:
return rewrite_clj.zip.findz.find_next_value.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return rewrite_clj.zip.findz.find_next_value.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.zip.findz.find_next_value.cljs$core$IFn$_invoke$arity$2 = (function (zloc,v){
return rewrite_clj.zip.findz.find_next_value.cljs$core$IFn$_invoke$arity$3(zloc,rewrite_clj.zip.move.right,v);
}));

(rewrite_clj.zip.findz.find_next_value.cljs$core$IFn$_invoke$arity$3 = (function (zloc,f,v){
return rewrite_clj.zip.findz.find_value.cljs$core$IFn$_invoke$arity$3((f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(zloc) : f.call(null,zloc)),f,v);
}));

(rewrite_clj.zip.findz.find_next_value.cljs$lang$maxFixedArity = 3);


//# sourceMappingURL=rewrite_clj.zip.findz.js.map
