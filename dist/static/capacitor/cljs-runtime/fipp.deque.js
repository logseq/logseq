goog.provide('fipp.deque');
fipp.deque.create = cljs.core.vector;
fipp.deque.empty = cljs.core.PersistentVector.EMPTY;
fipp.deque.popl = (function fipp$deque$popl(v){
return cljs.core.subvec.cljs$core$IFn$_invoke$arity$2(v,(1));
});
fipp.deque.conjr = cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.conj,fipp.deque.empty);
fipp.deque.conjlr = (function fipp$deque$conjlr(l,deque,r){
return clojure.core.rrb_vector.catvec.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [l], null),deque,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [r], null));
});
fipp.deque.concat = clojure.core.rrb_vector.catvec;

//# sourceMappingURL=fipp.deque.js.map
