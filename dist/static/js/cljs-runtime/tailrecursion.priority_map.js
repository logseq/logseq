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
return cljs.core.seq((function (){var iter__5480__auto__ = (function tailrecursion$priority_map$iter__68708(s__68709){
return (new cljs.core.LazySeq(null,(function (){
var s__68709__$1 = s__68709;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__68709__$1);
if(temp__5804__auto__){
var xs__6360__auto__ = temp__5804__auto__;
var vec__68719 = cljs.core.first(xs__6360__auto__);
var priority = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68719,(0),null);
var item_set = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68719,(1),null);
var iterys__5476__auto__ = ((function (s__68709__$1,vec__68719,priority,item_set,xs__6360__auto__,temp__5804__auto__,coll__$1){
return (function tailrecursion$priority_map$iter__68708_$_iter__68710(s__68711){
return (new cljs.core.LazySeq(null,((function (s__68709__$1,vec__68719,priority,item_set,xs__6360__auto__,temp__5804__auto__,coll__$1){
return (function (){
var s__68711__$1 = s__68711;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__68711__$1);
if(temp__5804__auto____$1){
var s__68711__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__68711__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__68711__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__68713 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__68712 = (0);
while(true){
if((i__68712 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__68712);
cljs.core.chunk_append(b__68713,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,(self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1 ? self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1(item) : self__.item__GT_priority.call(null,item))], null));

var G__69264 = (i__68712 + (1));
i__68712 = G__69264;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__68713),tailrecursion$priority_map$iter__68708_$_iter__68710(cljs.core.chunk_rest(s__68711__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__68713),null);
}
} else {
var item = cljs.core.first(s__68711__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,(self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1 ? self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1(item) : self__.item__GT_priority.call(null,item))], null),tailrecursion$priority_map$iter__68708_$_iter__68710(cljs.core.rest(s__68711__$2)));
}
} else {
return null;
}
break;
}
});})(s__68709__$1,vec__68719,priority,item_set,xs__6360__auto__,temp__5804__auto__,coll__$1))
,null,null));
});})(s__68709__$1,vec__68719,priority,item_set,xs__6360__auto__,temp__5804__auto__,coll__$1))
;
var fs__5477__auto__ = cljs.core.seq(iterys__5476__auto__(item_set));
if(fs__5477__auto__){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(fs__5477__auto__,tailrecursion$priority_map$iter__68708(cljs.core.rest(s__68709__$1)));
} else {
var G__69265 = cljs.core.rest(s__68709__$1);
s__68709__$1 = G__69265;
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
return cljs.core.seq((function (){var iter__5480__auto__ = (function tailrecursion$priority_map$iter__68752(s__68753){
return (new cljs.core.LazySeq(null,(function (){
var s__68753__$1 = s__68753;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__68753__$1);
if(temp__5804__auto__){
var xs__6360__auto__ = temp__5804__auto__;
var vec__68764 = cljs.core.first(xs__6360__auto__);
var priority = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68764,(0),null);
var item_set = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68764,(1),null);
var iterys__5476__auto__ = ((function (s__68753__$1,vec__68764,priority,item_set,xs__6360__auto__,temp__5804__auto__,coll__$1){
return (function tailrecursion$priority_map$iter__68752_$_iter__68754(s__68755){
return (new cljs.core.LazySeq(null,((function (s__68753__$1,vec__68764,priority,item_set,xs__6360__auto__,temp__5804__auto__,coll__$1){
return (function (){
var s__68755__$1 = s__68755;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__68755__$1);
if(temp__5804__auto____$1){
var s__68755__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__68755__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__68755__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__68757 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__68756 = (0);
while(true){
if((i__68756 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__68756);
cljs.core.chunk_append(b__68757,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,priority], null));

var G__69266 = (i__68756 + (1));
i__68756 = G__69266;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__68757),tailrecursion$priority_map$iter__68752_$_iter__68754(cljs.core.chunk_rest(s__68755__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__68757),null);
}
} else {
var item = cljs.core.first(s__68755__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,priority], null),tailrecursion$priority_map$iter__68752_$_iter__68754(cljs.core.rest(s__68755__$2)));
}
} else {
return null;
}
break;
}
});})(s__68753__$1,vec__68764,priority,item_set,xs__6360__auto__,temp__5804__auto__,coll__$1))
,null,null));
});})(s__68753__$1,vec__68764,priority,item_set,xs__6360__auto__,temp__5804__auto__,coll__$1))
;
var fs__5477__auto__ = cljs.core.seq(iterys__5476__auto__(item_set));
if(fs__5477__auto__){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(fs__5477__auto__,tailrecursion$priority_map$iter__68752(cljs.core.rest(s__68753__$1)));
} else {
var G__69267 = cljs.core.rest(s__68753__$1);
s__68753__$1 = G__69267;
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
return cljs.core.seq((function (){var iter__5480__auto__ = (function tailrecursion$priority_map$iter__68882(s__68883){
return (new cljs.core.LazySeq(null,(function (){
var s__68883__$1 = s__68883;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__68883__$1);
if(temp__5804__auto__){
var xs__6360__auto__ = temp__5804__auto__;
var vec__68890 = cljs.core.first(xs__6360__auto__);
var priority = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68890,(0),null);
var item_set = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68890,(1),null);
var iterys__5476__auto__ = ((function (s__68883__$1,vec__68890,priority,item_set,xs__6360__auto__,temp__5804__auto__,this$__$1){
return (function tailrecursion$priority_map$iter__68882_$_iter__68884(s__68885){
return (new cljs.core.LazySeq(null,((function (s__68883__$1,vec__68890,priority,item_set,xs__6360__auto__,temp__5804__auto__,this$__$1){
return (function (){
var s__68885__$1 = s__68885;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__68885__$1);
if(temp__5804__auto____$1){
var s__68885__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__68885__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__68885__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__68887 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__68886 = (0);
while(true){
if((i__68886 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__68886);
cljs.core.chunk_append(b__68887,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,(self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1 ? self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1(item) : self__.item__GT_priority.call(null,item))], null));

var G__69271 = (i__68886 + (1));
i__68886 = G__69271;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__68887),tailrecursion$priority_map$iter__68882_$_iter__68884(cljs.core.chunk_rest(s__68885__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__68887),null);
}
} else {
var item = cljs.core.first(s__68885__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,(self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1 ? self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1(item) : self__.item__GT_priority.call(null,item))], null),tailrecursion$priority_map$iter__68882_$_iter__68884(cljs.core.rest(s__68885__$2)));
}
} else {
return null;
}
break;
}
});})(s__68883__$1,vec__68890,priority,item_set,xs__6360__auto__,temp__5804__auto__,this$__$1))
,null,null));
});})(s__68883__$1,vec__68890,priority,item_set,xs__6360__auto__,temp__5804__auto__,this$__$1))
;
var fs__5477__auto__ = cljs.core.seq(iterys__5476__auto__(item_set));
if(fs__5477__auto__){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(fs__5477__auto__,tailrecursion$priority_map$iter__68882(cljs.core.rest(s__68883__$1)));
} else {
var G__69272 = cljs.core.rest(s__68883__$1);
s__68883__$1 = G__69272;
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
return cljs.core.seq((function (){var iter__5480__auto__ = (function tailrecursion$priority_map$iter__68904(s__68905){
return (new cljs.core.LazySeq(null,(function (){
var s__68905__$1 = s__68905;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__68905__$1);
if(temp__5804__auto__){
var xs__6360__auto__ = temp__5804__auto__;
var vec__68918 = cljs.core.first(xs__6360__auto__);
var priority = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68918,(0),null);
var item_set = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68918,(1),null);
var iterys__5476__auto__ = ((function (s__68905__$1,vec__68918,priority,item_set,xs__6360__auto__,temp__5804__auto__,this$__$1){
return (function tailrecursion$priority_map$iter__68904_$_iter__68906(s__68907){
return (new cljs.core.LazySeq(null,((function (s__68905__$1,vec__68918,priority,item_set,xs__6360__auto__,temp__5804__auto__,this$__$1){
return (function (){
var s__68907__$1 = s__68907;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__68907__$1);
if(temp__5804__auto____$1){
var s__68907__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__68907__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__68907__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__68909 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__68908 = (0);
while(true){
if((i__68908 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__68908);
cljs.core.chunk_append(b__68909,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,priority], null));

var G__69274 = (i__68908 + (1));
i__68908 = G__69274;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__68909),tailrecursion$priority_map$iter__68904_$_iter__68906(cljs.core.chunk_rest(s__68907__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__68909),null);
}
} else {
var item = cljs.core.first(s__68907__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,priority], null),tailrecursion$priority_map$iter__68904_$_iter__68906(cljs.core.rest(s__68907__$2)));
}
} else {
return null;
}
break;
}
});})(s__68905__$1,vec__68918,priority,item_set,xs__6360__auto__,temp__5804__auto__,this$__$1))
,null,null));
});})(s__68905__$1,vec__68918,priority,item_set,xs__6360__auto__,temp__5804__auto__,this$__$1))
;
var fs__5477__auto__ = cljs.core.seq(iterys__5476__auto__(item_set));
if(fs__5477__auto__){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(fs__5477__auto__,tailrecursion$priority_map$iter__68904(cljs.core.rest(s__68905__$1)));
} else {
var G__69278 = cljs.core.rest(s__68905__$1);
s__68905__$1 = G__69278;
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
var G__68954 = (arguments.length - (1));
switch (G__68954) {
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

(tailrecursion.priority_map.PersistentPriorityMap.prototype.apply = (function (self__,args68650){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args68650)));
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
var fexpr__68964 = (cljs.core.truth_(ascending_QMARK_)?cljs.core.seq:cljs.core.rseq);
return (fexpr__68964.cljs$core$IFn$_invoke$arity$1 ? fexpr__68964.cljs$core$IFn$_invoke$arity$1(this$__$1) : fexpr__68964.call(null,this$__$1));
}));

(tailrecursion.priority_map.PersistentPriorityMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = (function (this$,k,ascending_QMARK_){
var self__ = this;
var this$__$1 = this;
var sets = (cljs.core.truth_(ascending_QMARK_)?cljs.core.subseq.cljs$core$IFn$_invoke$arity$3(self__.priority__GT_set_of_items,cljs.core._GT__EQ_,k):cljs.core.rsubseq.cljs$core$IFn$_invoke$arity$3(self__.priority__GT_set_of_items,cljs.core._LT__EQ_,k));
if(cljs.core.truth_(self__.keyfn)){
return cljs.core.seq((function (){var iter__5480__auto__ = (function tailrecursion$priority_map$iter__68966(s__68967){
return (new cljs.core.LazySeq(null,(function (){
var s__68967__$1 = s__68967;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__68967__$1);
if(temp__5804__auto__){
var xs__6360__auto__ = temp__5804__auto__;
var vec__68972 = cljs.core.first(xs__6360__auto__);
var priority = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68972,(0),null);
var item_set = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68972,(1),null);
var iterys__5476__auto__ = ((function (s__68967__$1,vec__68972,priority,item_set,xs__6360__auto__,temp__5804__auto__,sets,this$__$1){
return (function tailrecursion$priority_map$iter__68966_$_iter__68968(s__68969){
return (new cljs.core.LazySeq(null,((function (s__68967__$1,vec__68972,priority,item_set,xs__6360__auto__,temp__5804__auto__,sets,this$__$1){
return (function (){
var s__68969__$1 = s__68969;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__68969__$1);
if(temp__5804__auto____$1){
var s__68969__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__68969__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__68969__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__68971 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__68970 = (0);
while(true){
if((i__68970 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__68970);
cljs.core.chunk_append(b__68971,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,(self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1 ? self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1(item) : self__.item__GT_priority.call(null,item))], null));

var G__69294 = (i__68970 + (1));
i__68970 = G__69294;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__68971),tailrecursion$priority_map$iter__68966_$_iter__68968(cljs.core.chunk_rest(s__68969__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__68971),null);
}
} else {
var item = cljs.core.first(s__68969__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,(self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1 ? self__.item__GT_priority.cljs$core$IFn$_invoke$arity$1(item) : self__.item__GT_priority.call(null,item))], null),tailrecursion$priority_map$iter__68966_$_iter__68968(cljs.core.rest(s__68969__$2)));
}
} else {
return null;
}
break;
}
});})(s__68967__$1,vec__68972,priority,item_set,xs__6360__auto__,temp__5804__auto__,sets,this$__$1))
,null,null));
});})(s__68967__$1,vec__68972,priority,item_set,xs__6360__auto__,temp__5804__auto__,sets,this$__$1))
;
var fs__5477__auto__ = cljs.core.seq(iterys__5476__auto__(item_set));
if(fs__5477__auto__){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(fs__5477__auto__,tailrecursion$priority_map$iter__68966(cljs.core.rest(s__68967__$1)));
} else {
var G__69300 = cljs.core.rest(s__68967__$1);
s__68967__$1 = G__69300;
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
return cljs.core.seq((function (){var iter__5480__auto__ = (function tailrecursion$priority_map$iter__68986(s__68987){
return (new cljs.core.LazySeq(null,(function (){
var s__68987__$1 = s__68987;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__68987__$1);
if(temp__5804__auto__){
var xs__6360__auto__ = temp__5804__auto__;
var vec__68993 = cljs.core.first(xs__6360__auto__);
var priority = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68993,(0),null);
var item_set = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68993,(1),null);
var iterys__5476__auto__ = ((function (s__68987__$1,vec__68993,priority,item_set,xs__6360__auto__,temp__5804__auto__,sets,this$__$1){
return (function tailrecursion$priority_map$iter__68986_$_iter__68988(s__68989){
return (new cljs.core.LazySeq(null,((function (s__68987__$1,vec__68993,priority,item_set,xs__6360__auto__,temp__5804__auto__,sets,this$__$1){
return (function (){
var s__68989__$1 = s__68989;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__68989__$1);
if(temp__5804__auto____$1){
var s__68989__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__68989__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__68989__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__68991 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__68990 = (0);
while(true){
if((i__68990 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__68990);
cljs.core.chunk_append(b__68991,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,priority], null));

var G__69303 = (i__68990 + (1));
i__68990 = G__69303;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__68991),tailrecursion$priority_map$iter__68986_$_iter__68988(cljs.core.chunk_rest(s__68989__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__68991),null);
}
} else {
var item = cljs.core.first(s__68989__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [item,priority], null),tailrecursion$priority_map$iter__68986_$_iter__68988(cljs.core.rest(s__68989__$2)));
}
} else {
return null;
}
break;
}
});})(s__68987__$1,vec__68993,priority,item_set,xs__6360__auto__,temp__5804__auto__,sets,this$__$1))
,null,null));
});})(s__68987__$1,vec__68993,priority,item_set,xs__6360__auto__,temp__5804__auto__,sets,this$__$1))
;
var fs__5477__auto__ = cljs.core.seq(iterys__5476__auto__(item_set));
if(fs__5477__auto__){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(fs__5477__auto__,tailrecursion$priority_map$iter__68986(cljs.core.rest(s__68987__$1)));
} else {
var G__69305 = cljs.core.rest(s__68987__$1);
s__68987__$1 = G__69305;
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
var G__69009 = cljs.core.val(entry);
return (self__.keyfn.cljs$core$IFn$_invoke$arity$1 ? self__.keyfn.cljs$core$IFn$_invoke$arity$1(G__69009) : self__.keyfn.call(null,G__69009));
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
var G__69025 = arguments.length;
switch (G__69025) {
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
var len__5726__auto___69313 = arguments.length;
var i__5727__auto___69314 = (0);
while(true){
if((i__5727__auto___69314 < len__5726__auto___69313)){
args__5732__auto__.push((arguments[i__5727__auto___69314]));

var G__69315 = (i__5727__auto___69314 + (1));
i__5727__auto___69314 = G__69315;
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
var G__69317 = cljs.core.nnext(in$);
var G__69318 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(out,cljs.core.first(in$),cljs.core.second(in$));
in$ = G__69317;
out = G__69318;
continue;
} else {
return out;
}
break;
}
}));

(tailrecursion.priority_map.priority_map.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(tailrecursion.priority_map.priority_map.cljs$lang$applyTo = (function (seq69042){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq69042));
}));

/**
 * keyval => key val
 *   Returns a new priority map with supplied
 *   mappings, using the supplied comparator.
 */
tailrecursion.priority_map.priority_map_by = (function tailrecursion$priority_map$priority_map_by(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69323 = arguments.length;
var i__5727__auto___69324 = (0);
while(true){
if((i__5727__auto___69324 < len__5726__auto___69323)){
args__5732__auto__.push((arguments[i__5727__auto___69324]));

var G__69325 = (i__5727__auto___69324 + (1));
i__5727__auto___69324 = G__69325;
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
var G__69328 = cljs.core.nnext(in$);
var G__69329 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(out,cljs.core.first(in$),cljs.core.second(in$));
in$ = G__69328;
out = G__69329;
continue;
} else {
return out;
}
break;
}
}));

(tailrecursion.priority_map.priority_map_by.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(tailrecursion.priority_map.priority_map_by.cljs$lang$applyTo = (function (seq69053){
var G__69054 = cljs.core.first(seq69053);
var seq69053__$1 = cljs.core.next(seq69053);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69054,seq69053__$1);
}));

/**
 * keyval => key val
 *   Returns a new priority map with supplied
 *   mappings, using the supplied keyfn.
 */
tailrecursion.priority_map.priority_map_keyfn = (function tailrecursion$priority_map$priority_map_keyfn(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69336 = arguments.length;
var i__5727__auto___69337 = (0);
while(true){
if((i__5727__auto___69337 < len__5726__auto___69336)){
args__5732__auto__.push((arguments[i__5727__auto___69337]));

var G__69338 = (i__5727__auto___69337 + (1));
i__5727__auto___69337 = G__69338;
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
var G__69340 = cljs.core.nnext(in$);
var G__69341 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(out,cljs.core.first(in$),cljs.core.second(in$));
in$ = G__69340;
out = G__69341;
continue;
} else {
return out;
}
break;
}
}));

(tailrecursion.priority_map.priority_map_keyfn.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(tailrecursion.priority_map.priority_map_keyfn.cljs$lang$applyTo = (function (seq69074){
var G__69075 = cljs.core.first(seq69074);
var seq69074__$1 = cljs.core.next(seq69074);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69075,seq69074__$1);
}));

/**
 * keyval => key val
 *   Returns a new priority map with supplied
 *   mappings, using the supplied keyfn and comparator.
 */
tailrecursion.priority_map.priority_map_keyfn_by = (function tailrecursion$priority_map$priority_map_keyfn_by(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69343 = arguments.length;
var i__5727__auto___69344 = (0);
while(true){
if((i__5727__auto___69344 < len__5726__auto___69343)){
args__5732__auto__.push((arguments[i__5727__auto___69344]));

var G__69345 = (i__5727__auto___69344 + (1));
i__5727__auto___69344 = G__69345;
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
var G__69347 = cljs.core.nnext(in$);
var G__69348 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(out,cljs.core.first(in$),cljs.core.second(in$));
in$ = G__69347;
out = G__69348;
continue;
} else {
return out;
}
break;
}
}));

(tailrecursion.priority_map.priority_map_keyfn_by.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(tailrecursion.priority_map.priority_map_keyfn_by.cljs$lang$applyTo = (function (seq69092){
var G__69093 = cljs.core.first(seq69092);
var seq69092__$1 = cljs.core.next(seq69092);
var G__69094 = cljs.core.first(seq69092__$1);
var seq69092__$2 = cljs.core.next(seq69092__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69093,G__69094,seq69092__$2);
}));


//# sourceMappingURL=tailrecursion.priority_map.js.map
