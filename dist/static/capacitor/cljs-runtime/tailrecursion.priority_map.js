goog.provide('tailrecursion.priority_map');

/**
* @constructor
 * @implements {cljs.core.IReversible}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.IFn}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.IEmptyableCollection}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISorted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IStack}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
tailrecursion.priority_map.PersistentPriorityMap = (function (priority__GT_set_of_items,item__GT_priority,meta,keyfn,__hash){
this.priority__GT_set_of_items = priority__GT_set_of_items;
this.item__GT_priority = item__GT_priority;
this.meta = meta;
this.keyfn = keyfn;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2565220111;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this$,item){
var self__ = this;
var this$__$1 = this;
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(self__.item__GT_priority,item);
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (coll,item,not_found){
var self__ = this;
var coll__$1 = this;
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.item__GT_priority,item,not_found);
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (coll,writer,opts){
var self__ = this;
var coll__$1 = this;
var pr_pair = (function (keyval){
return cljs.core.pr_sequential_writer(writer,cljs.core.pr_writer,""," ","",opts,keyval);
});
return cljs.core.pr_sequential_writer(writer,pr_pair,"#tailrecursion.priority-map {",", ","}",opts,coll__$1);
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return self__.meta;
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$ICounted$_count$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return cljs.core.count(self__.item__GT_priority);
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$IStack$_peek$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
if((cljs.core.count(self__.item__GT_priority) === (0))){
return null;
} else {
var f = cljs.core.first(self__.priority__GT_set_of_items);
var item = cljs.core.first(cljs.core.val(f));
if(cljs.core.truth_(self__.keyfn)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,(self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1 ? self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1(item) : self__.item__GT_priority.call(null,item))], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,cljs.core.key(f)], null);
}
}
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$IStack$_pop$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
if((cljs.core.count(self__.item__GT_priority) === (0))){
throw (new Error("Can't pop empty priority map"));
} else {
var f = cljs.core.first(self__.priority__GT_set_of_items);
var item_set = cljs.core.val(f);
var item = cljs.core.first(item_set);
var priority_key = cljs.core.key(f);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(item_set),(1))){
return (new tailrecursion.priority_map.PersistentPriorityMap(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.priority__GT_set_of_items,priority_key),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.item__GT_priority,item),self__.meta,self__.keyfn,null));
} else {
return (new tailrecursion.priority_map.PersistentPriorityMap(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.priority__GT_set_of_items,priority_key,cljs.core.disj.cljs$core$IFn$_invoke$arity$2(item_set,item)),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.item__GT_priority,item),self__.meta,self__.keyfn,null));
}
}
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$IReversible$_rseq$arity$1 = (function (coll){
var self__ = this;
var coll__$1 = this;
if(cljs.core.truth_(self__.keyfn)){
return cljs.core.seq((function (){var iter__5480__auto__ = (function tailrecursion$priority_map$iter__67725(s__67726){
return (new cljs.core.LazySeq(null,(function (){
var s__67726__$1 = s__67726;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67726__$1);
if(temp__5804__auto__){
var xs__6360__auto__ = temp__5804__auto__;
var vec__67731 = cljs.core.first(xs__6360__auto__);
var priority = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67731,(0),null);
var item_set = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67731,(1),null);
var iterys__5476__auto__ = ((function (s__67726__$1,vec__67731,priority,item_set,xs__6360__auto__,temp__5804__auto__,coll__$1){
return (function tailrecursion$priority_map$iter__67725_$_iter__67727(s__67728){
return (new cljs.core.LazySeq(null,((function (s__67726__$1,vec__67731,priority,item_set,xs__6360__auto__,temp__5804__auto__,coll__$1){
return (function (){
var s__67728__$1 = s__67728;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__67728__$1);
if(temp__5804__auto____$1){
var s__67728__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__67728__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67728__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67730 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67729 = (0);
while(true){
if((i__67729 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__67729);
cljs.core.chunk_append(b__67730,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,(self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1 ? self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1(item) : self__.item__GT_priority.call(null,item))], null));

var G__67948 = (i__67729 + (1));
i__67729 = G__67948;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67730),tailrecursion$priority_map$iter__67725_$_iter__67727(cljs.core.chunk_rest(s__67728__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67730),null);
}
} else {
var item = cljs.core.first(s__67728__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,(self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1 ? self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1(item) : self__.item__GT_priority.call(null,item))], null),tailrecursion$priority_map$iter__67725_$_iter__67727(cljs.core.rest(s__67728__$2)));
}
} else {
return null;
}
break;
}
});})(s__67726__$1,vec__67731,priority,item_set,xs__6360__auto__,temp__5804__auto__,coll__$1))
,null,null));
});})(s__67726__$1,vec__67731,priority,item_set,xs__6360__auto__,temp__5804__auto__,coll__$1))
;
var fs__5477__auto__ = cljs.core.seq(iterys__5476__auto__(item_set));
if(fs__5477__auto__){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(fs__5477__auto__,tailrecursion$priority_map$iter__67725(cljs.core.rest(s__67726__$1)));
} else {
var G__67950 = cljs.core.rest(s__67726__$1);
s__67726__$1 = G__67950;
continue;
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.rseq(self__.priority__GT_set_of_items));
})());
} else {
return cljs.core.seq((function (){var iter__5480__auto__ = (function tailrecursion$priority_map$iter__67754(s__67755){
return (new cljs.core.LazySeq(null,(function (){
var s__67755__$1 = s__67755;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67755__$1);
if(temp__5804__auto__){
var xs__6360__auto__ = temp__5804__auto__;
var vec__67762 = cljs.core.first(xs__6360__auto__);
var priority = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67762,(0),null);
var item_set = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67762,(1),null);
var iterys__5476__auto__ = ((function (s__67755__$1,vec__67762,priority,item_set,xs__6360__auto__,temp__5804__auto__,coll__$1){
return (function tailrecursion$priority_map$iter__67754_$_iter__67756(s__67757){
return (new cljs.core.LazySeq(null,((function (s__67755__$1,vec__67762,priority,item_set,xs__6360__auto__,temp__5804__auto__,coll__$1){
return (function (){
var s__67757__$1 = s__67757;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__67757__$1);
if(temp__5804__auto____$1){
var s__67757__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__67757__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67757__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67759 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67758 = (0);
while(true){
if((i__67758 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__67758);
cljs.core.chunk_append(b__67759,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,priority], null));

var G__67952 = (i__67758 + (1));
i__67758 = G__67952;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67759),tailrecursion$priority_map$iter__67754_$_iter__67756(cljs.core.chunk_rest(s__67757__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67759),null);
}
} else {
var item = cljs.core.first(s__67757__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,priority], null),tailrecursion$priority_map$iter__67754_$_iter__67756(cljs.core.rest(s__67757__$2)));
}
} else {
return null;
}
break;
}
});})(s__67755__$1,vec__67762,priority,item_set,xs__6360__auto__,temp__5804__auto__,coll__$1))
,null,null));
});})(s__67755__$1,vec__67762,priority,item_set,xs__6360__auto__,temp__5804__auto__,coll__$1))
;
var fs__5477__auto__ = cljs.core.seq(iterys__5476__auto__(item_set));
if(fs__5477__auto__){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(fs__5477__auto__,tailrecursion$priority_map$iter__67754(cljs.core.rest(s__67755__$1)));
} else {
var G__67954 = cljs.core.rest(s__67755__$1);
s__67755__$1 = G__67954;
continue;
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.rseq(self__.priority__GT_set_of_items));
})());
}
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$IHash$_hash$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = cljs.core.hash_unordered_coll(this$__$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this$,other){
var self__ = this;
var this$__$1 = this;
return cljs.core._equiv(self__.item__GT_priority,other);
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return cljs.core.with_meta(tailrecursion.priority_map.PersistentPriorityMap.EMPTY,self__.meta);
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this$,item){
var self__ = this;
var this$__$1 = this;
var priority = (self__.item__GT_priority.cljs$core$IFn$_invoke$arity$2 ? self__.item__GT_priority.cljs$core$IFn$_invoke$arity$2(item,new cljs.core.Keyword("tailrecursion.priority-map","not-found","tailrecursion.priority-map/not-found",-436727517)) : self__.item__GT_priority.call(null,item,new cljs.core.Keyword("tailrecursion.priority-map","not-found","tailrecursion.priority-map/not-found",-436727517)));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(priority,new cljs.core.Keyword("tailrecursion.priority-map","not-found","tailrecursion.priority-map/not-found",-436727517))){
return this$__$1;
} else {
var priority_key = (self__.keyfn.cljs$core$IFn$_invoke$arity$1 ? self__.keyfn.cljs$core$IFn$_invoke$arity$1(priority) : self__.keyfn.call(null,priority));
var item_set = (self__.priority__GT_set_of_items.cljs$core$IFn$_invoke$arity$1 ? self__.priority__GT_set_of_items.cljs$core$IFn$_invoke$arity$1(priority_key) : self__.priority__GT_set_of_items.call(null,priority_key));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(item_set),(1))){
return (new tailrecursion.priority_map.PersistentPriorityMap(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.priority__GT_set_of_items,priority_key),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.item__GT_priority,item),self__.meta,self__.keyfn,null));
} else {
return (new tailrecursion.priority_map.PersistentPriorityMap(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.priority__GT_set_of_items,priority_key,cljs.core.disj.cljs$core$IFn$_invoke$arity$2(item_set,item)),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.item__GT_priority,item),self__.meta,self__.keyfn,null));
}
}
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this$,item,priority){
var self__ = this;
var this$__$1 = this;
var temp__5802__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.item__GT_priority,item,null);
if(cljs.core.truth_(temp__5802__auto__)){
var current_priority = temp__5802__auto__;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_priority,priority)){
return this$__$1;
} else {
var priority_key = (self__.keyfn.cljs$core$IFn$_invoke$arity$1 ? self__.keyfn.cljs$core$IFn$_invoke$arity$1(priority) : self__.keyfn.call(null,priority));
var current_priority_key = (self__.keyfn.cljs$core$IFn$_invoke$arity$1 ? self__.keyfn.cljs$core$IFn$_invoke$arity$1(current_priority) : self__.keyfn.call(null,current_priority));
var item_set = cljs.core.get.cljs$core$IFn$_invoke$arity$2(self__.priority__GT_set_of_items,current_priority_key);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(item_set),(1))){
return (new tailrecursion.priority_map.PersistentPriorityMap(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.priority__GT_set_of_items,current_priority_key),priority_key,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.priority__GT_set_of_items,priority_key,cljs.core.PersistentHashSet.EMPTY),item)),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.item__GT_priority,item,priority),self__.meta,self__.keyfn,null));
} else {
return (new tailrecursion.priority_map.PersistentPriorityMap(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(self__.priority__GT_set_of_items,current_priority_key,cljs.core.disj.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$2(self__.priority__GT_set_of_items,current_priority_key),item),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([priority_key,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.priority__GT_set_of_items,priority_key,cljs.core.PersistentHashSet.EMPTY),item)], 0)),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.item__GT_priority,item,priority),self__.meta,self__.keyfn,null));
}
}
} else {
var priority_key = (self__.keyfn.cljs$core$IFn$_invoke$arity$1 ? self__.keyfn.cljs$core$IFn$_invoke$arity$1(priority) : self__.keyfn.call(null,priority));
return (new tailrecursion.priority_map.PersistentPriorityMap(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.priority__GT_set_of_items,priority_key,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.priority__GT_set_of_items,priority_key,cljs.core.PersistentHashSet.EMPTY),item)),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.item__GT_priority,item,priority),self__.meta,self__.keyfn,null));
}
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this$,item){
var self__ = this;
var this$__$1 = this;
return cljs.core.contains_QMARK_(self__.item__GT_priority,item);
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
if(cljs.core.truth_(self__.keyfn)){
return cljs.core.seq((function (){var iter__5480__auto__ = (function tailrecursion$priority_map$iter__67781(s__67782){
return (new cljs.core.LazySeq(null,(function (){
var s__67782__$1 = s__67782;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67782__$1);
if(temp__5804__auto__){
var xs__6360__auto__ = temp__5804__auto__;
var vec__67787 = cljs.core.first(xs__6360__auto__);
var priority = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67787,(0),null);
var item_set = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67787,(1),null);
var iterys__5476__auto__ = ((function (s__67782__$1,vec__67787,priority,item_set,xs__6360__auto__,temp__5804__auto__,this$__$1){
return (function tailrecursion$priority_map$iter__67781_$_iter__67783(s__67784){
return (new cljs.core.LazySeq(null,((function (s__67782__$1,vec__67787,priority,item_set,xs__6360__auto__,temp__5804__auto__,this$__$1){
return (function (){
var s__67784__$1 = s__67784;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__67784__$1);
if(temp__5804__auto____$1){
var s__67784__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__67784__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67784__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67786 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67785 = (0);
while(true){
if((i__67785 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__67785);
cljs.core.chunk_append(b__67786,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,(self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1 ? self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1(item) : self__.item__GT_priority.call(null,item))], null));

var G__67961 = (i__67785 + (1));
i__67785 = G__67961;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67786),tailrecursion$priority_map$iter__67781_$_iter__67783(cljs.core.chunk_rest(s__67784__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67786),null);
}
} else {
var item = cljs.core.first(s__67784__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,(self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1 ? self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1(item) : self__.item__GT_priority.call(null,item))], null),tailrecursion$priority_map$iter__67781_$_iter__67783(cljs.core.rest(s__67784__$2)));
}
} else {
return null;
}
break;
}
});})(s__67782__$1,vec__67787,priority,item_set,xs__6360__auto__,temp__5804__auto__,this$__$1))
,null,null));
});})(s__67782__$1,vec__67787,priority,item_set,xs__6360__auto__,temp__5804__auto__,this$__$1))
;
var fs__5477__auto__ = cljs.core.seq(iterys__5476__auto__(item_set));
if(fs__5477__auto__){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(fs__5477__auto__,tailrecursion$priority_map$iter__67781(cljs.core.rest(s__67782__$1)));
} else {
var G__67962 = cljs.core.rest(s__67782__$1);
s__67782__$1 = G__67962;
continue;
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(self__.priority__GT_set_of_items);
})());
} else {
return cljs.core.seq((function (){var iter__5480__auto__ = (function tailrecursion$priority_map$iter__67795(s__67796){
return (new cljs.core.LazySeq(null,(function (){
var s__67796__$1 = s__67796;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67796__$1);
if(temp__5804__auto__){
var xs__6360__auto__ = temp__5804__auto__;
var vec__67802 = cljs.core.first(xs__6360__auto__);
var priority = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67802,(0),null);
var item_set = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67802,(1),null);
var iterys__5476__auto__ = ((function (s__67796__$1,vec__67802,priority,item_set,xs__6360__auto__,temp__5804__auto__,this$__$1){
return (function tailrecursion$priority_map$iter__67795_$_iter__67797(s__67798){
return (new cljs.core.LazySeq(null,((function (s__67796__$1,vec__67802,priority,item_set,xs__6360__auto__,temp__5804__auto__,this$__$1){
return (function (){
var s__67798__$1 = s__67798;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__67798__$1);
if(temp__5804__auto____$1){
var s__67798__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__67798__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67798__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67800 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67799 = (0);
while(true){
if((i__67799 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__67799);
cljs.core.chunk_append(b__67800,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,priority], null));

var G__67963 = (i__67799 + (1));
i__67799 = G__67963;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67800),tailrecursion$priority_map$iter__67795_$_iter__67797(cljs.core.chunk_rest(s__67798__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67800),null);
}
} else {
var item = cljs.core.first(s__67798__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,priority], null),tailrecursion$priority_map$iter__67795_$_iter__67797(cljs.core.rest(s__67798__$2)));
}
} else {
return null;
}
break;
}
});})(s__67796__$1,vec__67802,priority,item_set,xs__6360__auto__,temp__5804__auto__,this$__$1))
,null,null));
});})(s__67796__$1,vec__67802,priority,item_set,xs__6360__auto__,temp__5804__auto__,this$__$1))
;
var fs__5477__auto__ = cljs.core.seq(iterys__5476__auto__(item_set));
if(fs__5477__auto__){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(fs__5477__auto__,tailrecursion$priority_map$iter__67795(cljs.core.rest(s__67796__$1)));
} else {
var G__67966 = cljs.core.rest(s__67796__$1);
s__67796__$1 = G__67966;
continue;
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(self__.priority__GT_set_of_items);
})());
}
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this$,meta__$1){
var self__ = this;
var this$__$1 = this;
return (new tailrecursion.priority_map.PersistentPriorityMap(self__.priority__GT_set_of_items,self__.item__GT_priority,meta__$1,self__.keyfn,self__.__hash));
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this$,entry){
var self__ = this;
var this$__$1 = this;
if(cljs.core.vector_QMARK_(entry)){
return this$__$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry,(0)),cljs.core._nth(entry,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this$__$1,entry);
}
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__67831 = (arguments.length - (1));
switch (G__67831) {
case (1):
return self__.cljs$core$IFn$_invoke$arity$1((arguments[(1)]));

break;
case (2):
return self__.cljs$core$IFn$_invoke$arity$2((arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((arguments.length - (1)))].join('')));

}
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.apply = (function (self__,args67722){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args67722)));
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$IFn$_invoke$arity$1 = (function (item){
var self__ = this;
var this$ = this;
return this$.cljs$core$ILookup$_lookup$arity$2(null,item);
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$IFn$_invoke$arity$2 = (function (item,not_found){
var self__ = this;
var this$ = this;
return this$.cljs$core$ILookup$_lookup$arity$3(null,item,not_found);
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = (function (this$,ascending_QMARK_){
var self__ = this;
var this$__$1 = this;
var fexpr__67832 = (cljs.core.truth_(ascending_QMARK_)?cljs.core.seq:cljs.core.rseq);
return (fexpr__67832.cljs$core$IFn$_invoke$arity$1 ? fexpr__67832.cljs$core$IFn$_invoke$arity$1(this$__$1) : fexpr__67832.call(null,this$__$1));
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = (function (this$,k,ascending_QMARK_){
var self__ = this;
var this$__$1 = this;
var sets = (cljs.core.truth_(ascending_QMARK_)?cljs.core.subseq.cljs$core$IFn$_invoke$arity$3(self__.priority__GT_set_of_items,cljs.core._GT__EQ_,k):cljs.core.rsubseq.cljs$core$IFn$_invoke$arity$3(self__.priority__GT_set_of_items,cljs.core._LT__EQ_,k));
if(cljs.core.truth_(self__.keyfn)){
return cljs.core.seq((function (){var iter__5480__auto__ = (function tailrecursion$priority_map$iter__67834(s__67835){
return (new cljs.core.LazySeq(null,(function (){
var s__67835__$1 = s__67835;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67835__$1);
if(temp__5804__auto__){
var xs__6360__auto__ = temp__5804__auto__;
var vec__67840 = cljs.core.first(xs__6360__auto__);
var priority = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67840,(0),null);
var item_set = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67840,(1),null);
var iterys__5476__auto__ = ((function (s__67835__$1,vec__67840,priority,item_set,xs__6360__auto__,temp__5804__auto__,sets,this$__$1){
return (function tailrecursion$priority_map$iter__67834_$_iter__67836(s__67837){
return (new cljs.core.LazySeq(null,((function (s__67835__$1,vec__67840,priority,item_set,xs__6360__auto__,temp__5804__auto__,sets,this$__$1){
return (function (){
var s__67837__$1 = s__67837;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__67837__$1);
if(temp__5804__auto____$1){
var s__67837__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__67837__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67837__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67839 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67838 = (0);
while(true){
if((i__67838 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__67838);
cljs.core.chunk_append(b__67839,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,(self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1 ? self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1(item) : self__.item__GT_priority.call(null,item))], null));

var G__67974 = (i__67838 + (1));
i__67838 = G__67974;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67839),tailrecursion$priority_map$iter__67834_$_iter__67836(cljs.core.chunk_rest(s__67837__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67839),null);
}
} else {
var item = cljs.core.first(s__67837__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,(self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1 ? self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1(item) : self__.item__GT_priority.call(null,item))], null),tailrecursion$priority_map$iter__67834_$_iter__67836(cljs.core.rest(s__67837__$2)));
}
} else {
return null;
}
break;
}
});})(s__67835__$1,vec__67840,priority,item_set,xs__6360__auto__,temp__5804__auto__,sets,this$__$1))
,null,null));
});})(s__67835__$1,vec__67840,priority,item_set,xs__6360__auto__,temp__5804__auto__,sets,this$__$1))
;
var fs__5477__auto__ = cljs.core.seq(iterys__5476__auto__(item_set));
if(fs__5477__auto__){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(fs__5477__auto__,tailrecursion$priority_map$iter__67834(cljs.core.rest(s__67835__$1)));
} else {
var G__67976 = cljs.core.rest(s__67835__$1);
s__67835__$1 = G__67976;
continue;
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(sets);
})());
} else {
return cljs.core.seq((function (){var iter__5480__auto__ = (function tailrecursion$priority_map$iter__67848(s__67849){
return (new cljs.core.LazySeq(null,(function (){
var s__67849__$1 = s__67849;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__67849__$1);
if(temp__5804__auto__){
var xs__6360__auto__ = temp__5804__auto__;
var vec__67855 = cljs.core.first(xs__6360__auto__);
var priority = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67855,(0),null);
var item_set = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67855,(1),null);
var iterys__5476__auto__ = ((function (s__67849__$1,vec__67855,priority,item_set,xs__6360__auto__,temp__5804__auto__,sets,this$__$1){
return (function tailrecursion$priority_map$iter__67848_$_iter__67850(s__67851){
return (new cljs.core.LazySeq(null,((function (s__67849__$1,vec__67855,priority,item_set,xs__6360__auto__,temp__5804__auto__,sets,this$__$1){
return (function (){
var s__67851__$1 = s__67851;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__67851__$1);
if(temp__5804__auto____$1){
var s__67851__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__67851__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__67851__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__67853 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__67852 = (0);
while(true){
if((i__67852 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__67852);
cljs.core.chunk_append(b__67853,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,priority], null));

var G__67981 = (i__67852 + (1));
i__67852 = G__67981;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__67853),tailrecursion$priority_map$iter__67848_$_iter__67850(cljs.core.chunk_rest(s__67851__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__67853),null);
}
} else {
var item = cljs.core.first(s__67851__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,priority], null),tailrecursion$priority_map$iter__67848_$_iter__67850(cljs.core.rest(s__67851__$2)));
}
} else {
return null;
}
break;
}
});})(s__67849__$1,vec__67855,priority,item_set,xs__6360__auto__,temp__5804__auto__,sets,this$__$1))
,null,null));
});})(s__67849__$1,vec__67855,priority,item_set,xs__6360__auto__,temp__5804__auto__,sets,this$__$1))
;
var fs__5477__auto__ = cljs.core.seq(iterys__5476__auto__(item_set));
if(fs__5477__auto__){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(fs__5477__auto__,tailrecursion$priority_map$iter__67848(cljs.core.rest(s__67849__$1)));
} else {
var G__67983 = cljs.core.rest(s__67849__$1);
s__67849__$1 = G__67983;
continue;
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(sets);
})());
}
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = (function (this$,entry){
var self__ = this;
var this$__$1 = this;
var G__67862 = cljs.core.val(entry);
return (self__.keyfn.cljs$core$IFn$_invoke$arity$1 ? self__.keyfn.cljs$core$IFn$_invoke$arity$1(G__67862) : self__.keyfn.call(null,G__67862));
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$ISorted$_comparator$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return cljs.core.compare;
}));

(tailrecursion.priority_map.PersistentPriorityMap.getBasis = (function (){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"priority->set-of-items","priority->set-of-items",-1256537211,null),new cljs.core.Symbol(null,"item->priority","item->priority",-899999435,null),new cljs.core.Symbol(null,"meta","meta",-1154898805,null),new cljs.core.Symbol(null,"keyfn","keyfn",-1874375437,null),cljs.core.with_meta(new cljs.core.Symbol(null,"__hash","__hash",-1328796629,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mutable","mutable",875778266),true], null))], null);
}));

(tailrecursion.priority_map.PersistentPriorityMap.cljs$lang$type = true);

(tailrecursion.priority_map.PersistentPriorityMap.cljs$lang$ctorStr = "tailrecursion.priority-map/PersistentPriorityMap");

(tailrecursion.priority_map.PersistentPriorityMap.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"tailrecursion.priority-map/PersistentPriorityMap");
}));

/**
 * Positional factory function for tailrecursion.priority-map/PersistentPriorityMap.
 */
tailrecursion.priority_map.__GT_PersistentPriorityMap = (function tailrecursion$priority_map$__GT_PersistentPriorityMap(priority__GT_set_of_items,item__GT_priority,meta,keyfn,__hash){
return (new tailrecursion.priority_map.PersistentPriorityMap(priority__GT_set_of_items,item__GT_priority,meta,keyfn,__hash));
});

(tailrecursion.priority_map.PersistentPriorityMap.EMPTY = (new tailrecursion.priority_map.PersistentPriorityMap(cljs.core.sorted_map(),cljs.core.PersistentArrayMap.EMPTY,cljs.core.PersistentArrayMap.EMPTY,cljs.core.identity,null)));
tailrecursion.priority_map.pm_empty_by = (function tailrecursion$priority_map$pm_empty_by(comparator){
return (new tailrecursion.priority_map.PersistentPriorityMap(cljs.core.sorted_map_by(comparator),cljs.core.PersistentArrayMap.EMPTY,cljs.core.PersistentArrayMap.EMPTY,cljs.core.identity,null));
});
tailrecursion.priority_map.pm_empty_keyfn = (function tailrecursion$priority_map$pm_empty_keyfn(var_args){
var G__67875 = arguments.length;
switch (G__67875) {
case 1:
return tailrecursion.priority_map.pm_empty_keyfn.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return tailrecursion.priority_map.pm_empty_keyfn.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(tailrecursion.priority_map.pm_empty_keyfn.cljs$core$IFn$_invoke$arity$1 = (function (keyfn){
return (new tailrecursion.priority_map.PersistentPriorityMap(cljs.core.sorted_map(),cljs.core.PersistentArrayMap.EMPTY,cljs.core.PersistentArrayMap.EMPTY,keyfn,null));
}));

(tailrecursion.priority_map.pm_empty_keyfn.cljs$core$IFn$_invoke$arity$2 = (function (keyfn,comparator){
return (new tailrecursion.priority_map.PersistentPriorityMap(cljs.core.sorted_map_by(comparator),cljs.core.PersistentArrayMap.EMPTY,cljs.core.PersistentArrayMap.EMPTY,keyfn,null));
}));

(tailrecursion.priority_map.pm_empty_keyfn.cljs$lang$maxFixedArity = 2);

tailrecursion.priority_map.read_priority_map = (function tailrecursion$priority_map$read_priority_map(elems){
if(cljs.core.map_QMARK_(elems)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(tailrecursion.priority_map.PersistentPriorityMap.EMPTY,elems);
} else {
throw Error("Priority map literal expects a map for its elements.");
}
});
cljs.reader.register_tag_parser_BANG_("tailrecursion.priority-map",tailrecursion.priority_map.read_priority_map);
/**
 * keyval => key val
 *   Returns a new priority map with supplied mappings.
 */
tailrecursion.priority_map.priority_map = (function tailrecursion$priority_map$priority_map(var_args){
var args__5732__auto__ = [];
var len__5726__auto___67986 = arguments.length;
var i__5727__auto___67987 = (0);
while(true){
if((i__5727__auto___67987 < len__5726__auto___67986)){
args__5732__auto__.push((arguments[i__5727__auto___67987]));

var G__67988 = (i__5727__auto___67987 + (1));
i__5727__auto___67987 = G__67988;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return tailrecursion.priority_map.priority_map.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(tailrecursion.priority_map.priority_map.cljs$core$IFn$_invoke$arity$variadic = (function (keyvals){
var in$ = cljs.core.seq(keyvals);
var out = tailrecursion.priority_map.PersistentPriorityMap.EMPTY;
while(true){
if(in$){
var G__67992 = cljs.core.nnext(in$);
var G__67993 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(out,cljs.core.first(in$),cljs.core.second(in$));
in$ = G__67992;
out = G__67993;
continue;
} else {
return out;
}
break;
}
}));

(tailrecursion.priority_map.priority_map.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(tailrecursion.priority_map.priority_map.cljs$lang$applyTo = (function (seq67880){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq67880));
}));

/**
 * keyval => key val
 *   Returns a new priority map with supplied
 *   mappings, using the supplied comparator.
 */
tailrecursion.priority_map.priority_map_by = (function tailrecursion$priority_map$priority_map_by(var_args){
var args__5732__auto__ = [];
var len__5726__auto___67994 = arguments.length;
var i__5727__auto___67995 = (0);
while(true){
if((i__5727__auto___67995 < len__5726__auto___67994)){
args__5732__auto__.push((arguments[i__5727__auto___67995]));

var G__67996 = (i__5727__auto___67995 + (1));
i__5727__auto___67995 = G__67996;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return tailrecursion.priority_map.priority_map_by.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(tailrecursion.priority_map.priority_map_by.cljs$core$IFn$_invoke$arity$variadic = (function (comparator,keyvals){
var in$ = cljs.core.seq(keyvals);
var out = tailrecursion.priority_map.pm_empty_by(comparator);
while(true){
if(in$){
var G__67997 = cljs.core.nnext(in$);
var G__67998 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(out,cljs.core.first(in$),cljs.core.second(in$));
in$ = G__67997;
out = G__67998;
continue;
} else {
return out;
}
break;
}
}));

(tailrecursion.priority_map.priority_map_by.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(tailrecursion.priority_map.priority_map_by.cljs$lang$applyTo = (function (seq67885){
var G__67886 = cljs.core.first(seq67885);
var seq67885__$1 = cljs.core.next(seq67885);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67886,seq67885__$1);
}));

/**
 * keyval => key val
 *   Returns a new priority map with supplied
 *   mappings, using the supplied keyfn.
 */
tailrecursion.priority_map.priority_map_keyfn = (function tailrecursion$priority_map$priority_map_keyfn(var_args){
var args__5732__auto__ = [];
var len__5726__auto___67999 = arguments.length;
var i__5727__auto___68000 = (0);
while(true){
if((i__5727__auto___68000 < len__5726__auto___67999)){
args__5732__auto__.push((arguments[i__5727__auto___68000]));

var G__68001 = (i__5727__auto___68000 + (1));
i__5727__auto___68000 = G__68001;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return tailrecursion.priority_map.priority_map_keyfn.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(tailrecursion.priority_map.priority_map_keyfn.cljs$core$IFn$_invoke$arity$variadic = (function (keyfn,keyvals){
var in$ = cljs.core.seq(keyvals);
var out = tailrecursion.priority_map.pm_empty_keyfn.cljs$core$IFn$_invoke$arity$1(keyfn);
while(true){
if(in$){
var G__68002 = cljs.core.nnext(in$);
var G__68003 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(out,cljs.core.first(in$),cljs.core.second(in$));
in$ = G__68002;
out = G__68003;
continue;
} else {
return out;
}
break;
}
}));

(tailrecursion.priority_map.priority_map_keyfn.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(tailrecursion.priority_map.priority_map_keyfn.cljs$lang$applyTo = (function (seq67890){
var G__67891 = cljs.core.first(seq67890);
var seq67890__$1 = cljs.core.next(seq67890);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67891,seq67890__$1);
}));

/**
 * keyval => key val
 *   Returns a new priority map with supplied
 *   mappings, using the supplied keyfn and comparator.
 */
tailrecursion.priority_map.priority_map_keyfn_by = (function tailrecursion$priority_map$priority_map_keyfn_by(var_args){
var args__5732__auto__ = [];
var len__5726__auto___68004 = arguments.length;
var i__5727__auto___68005 = (0);
while(true){
if((i__5727__auto___68005 < len__5726__auto___68004)){
args__5732__auto__.push((arguments[i__5727__auto___68005]));

var G__68008 = (i__5727__auto___68005 + (1));
i__5727__auto___68005 = G__68008;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return tailrecursion.priority_map.priority_map_keyfn_by.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(tailrecursion.priority_map.priority_map_keyfn_by.cljs$core$IFn$_invoke$arity$variadic = (function (keyfn,comparator,keyvals){
var in$ = cljs.core.seq(keyvals);
var out = tailrecursion.priority_map.pm_empty_keyfn.cljs$core$IFn$_invoke$arity$2(keyfn,comparator);
while(true){
if(in$){
var G__68009 = cljs.core.nnext(in$);
var G__68010 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(out,cljs.core.first(in$),cljs.core.second(in$));
in$ = G__68009;
out = G__68010;
continue;
} else {
return out;
}
break;
}
}));

(tailrecursion.priority_map.priority_map_keyfn_by.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(tailrecursion.priority_map.priority_map_keyfn_by.cljs$lang$applyTo = (function (seq67898){
var G__67899 = cljs.core.first(seq67898);
var seq67898__$1 = cljs.core.next(seq67898);
var G__67900 = cljs.core.first(seq67898__$1);
var seq67898__$2 = cljs.core.next(seq67898__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67899,G__67900,seq67898__$2);
}));


//# sourceMappingURL=tailrecursion.priority_map.js.map
