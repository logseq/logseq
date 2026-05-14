goog.provide('arrangement.core');
/**
 * Ordered sequence of predicates to test to determine the relative ordering of
 *   various data types.
 */
arrangement.core.type_predicates = new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.nil_QMARK_,cljs.core.false_QMARK_,cljs.core.true_QMARK_,cljs.core.number_QMARK_,cljs.core.char_QMARK_,cljs.core.string_QMARK_,cljs.core.keyword_QMARK_,cljs.core.symbol_QMARK_,cljs.core.list_QMARK_,cljs.core.vector_QMARK_,cljs.core.set_QMARK_,cljs.core.map_QMARK_], null);
/**
 * Determines a numeric priority for the given value based on its general
 *   type. See `type-predicates` for the ordering.
 */
arrangement.core.type_priority = (function arrangement$core$type_priority(x){
var i = (0);
while(true){
if((i < cljs.core.count(arrangement.core.type_predicates))){
var p = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(arrangement.core.type_predicates,i);
if(cljs.core.truth_((p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(x) : p.call(null,x)))){
return i;
} else {
var G__70572 = (i + (1));
i = G__70572;
continue;
}
} else {
return i;
}
break;
}
});
/**
 * True if the values in a certain priority class are directly comparable.
 */
arrangement.core.directly_comparable_QMARK_ = (function arrangement$core$directly_comparable_QMARK_(p){
return ((((3) <= p)) && ((p <= (7))));
});
/**
 * Get the type of the given object as a string. For Clojure, gets the name of
 *   the class of the object. For ClojureScript, gets either the `name` attribute
 *   or the protocol name if the `name` attribute doesn't exist.
 */
arrangement.core.type_name = (function arrangement$core$type_name(x){
var t = cljs.core.type(x);
var n = t.name;
if(cljs.core.empty_QMARK_(n)){
return cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([t], 0));
} else {
return n;
}
});
/**
 * Compare sequences using the given comparator. If any element of the
 *   sequences orders differently, it determines the ordering. Otherwise, if the
 *   prefix matches, the longer sequence sorts later.
 */
arrangement.core.compare_seqs = (function arrangement$core$compare_seqs(xs,ys){
while(true){
if(((cljs.core.seq(xs)) && (cljs.core.seq(ys)))){
var x = cljs.core.first(xs);
var y = cljs.core.first(ys);
var o = (arrangement.core.rank.cljs$core$IFn$_invoke$arity$2 ? arrangement.core.rank.cljs$core$IFn$_invoke$arity$2(x,y) : arrangement.core.rank.call(null,x,y));
if((o === (0))){
var G__70577 = cljs.core.next(xs);
var G__70578 = cljs.core.next(ys);
xs = G__70577;
ys = G__70578;
continue;
} else {
return o;
}
} else {
return (cljs.core.count(xs) - cljs.core.count(ys));
}
break;
}
});
/**
 * Comparator function that provides a total ordering of EDN values. Values of
 *   different types sort in order of their types, per `type-priority`. `false`
 *   is before `true`, numbers are ordered by magnitude regardless of type, and
 *   characters, strings, keywords, and symbols are ordered lexically.
 * 
 *   Sequential collections are sorted by comparing their elements one at a time.
 *   If the sequences have equal leading elements, the longer one is ordered later.
 *   Sets and maps are compared by cardinality first, then elements in sorted
 *   order.
 * 
 *   All other types are sorted by type name. If the type implements `Comparable`,
 *   the instances of it are compared using `compare`. Otherwise, the values are
 *   ordered by print representation. This has the default behavior of ordering by
 *   hash code if the type does not implement a custom print format.
 */
arrangement.core.rank = (function arrangement$core$rank(a,b){
if((a === b)){
return (0);
} else {
var pri_a = arrangement.core.type_priority(a);
var pri_b = arrangement.core.type_priority(b);
if((pri_a < pri_b)){
return (-1);
} else {
if((pri_a > pri_b)){
return (1);
} else {
if(arrangement.core.directly_comparable_QMARK_(pri_a)){
return cljs.core.compare(a,b);
} else {
if(cljs.core.set_QMARK_(a)){
var size_diff = (cljs.core.count(a) - cljs.core.count(b));
if((size_diff === (0))){
return arrangement.core.compare_seqs(cljs.core.sort.cljs$core$IFn$_invoke$arity$2(arrangement.core.rank,a),cljs.core.sort.cljs$core$IFn$_invoke$arity$2(arrangement.core.rank,b));
} else {
return size_diff;
}
} else {
if(cljs.core.map_QMARK_(a)){
var size_diff = (cljs.core.count(a) - cljs.core.count(b));
if((size_diff === (0))){
return arrangement.core.compare_seqs(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3(cljs.core.key,arrangement.core.rank,cljs.core.seq(a)),cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3(cljs.core.key,arrangement.core.rank,cljs.core.seq(b)));
} else {
return size_diff;
}
} else {
if(cljs.core.coll_QMARK_(a)){
return arrangement.core.compare_seqs(a,b);
} else {
var class_diff = cljs.core.compare(arrangement.core.type_name(a),arrangement.core.type_name(b));
if((class_diff === (0))){
return cljs.core.compare(a,b);
} else {
return class_diff;
}

}
}
}
}
}
}
}
});

//# sourceMappingURL=arrangement.core.js.map
