goog.provide('datascript.impl.entity');





datascript.impl.entity.entid = (function datascript$impl$entity$entid(db,eid){
if(((typeof eid === 'number') || (((cljs.core.sequential_QMARK_(eid)) || ((eid instanceof cljs.core.Keyword)))))){
return datascript.db.entid(db,eid);
} else {
return null;
}
});
datascript.impl.entity.entity = (function datascript$impl$entity$entity(db,eid){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

var temp__5804__auto__ = datascript.impl.entity.entid(db,eid);
if(cljs.core.truth_(temp__5804__auto__)){
var e = temp__5804__auto__;
if(datascript.db.numeric_eid_exists_QMARK_(db,e)){
var G__49810 = db;
var G__49811 = e;
var G__49812 = cljs.core.volatile_BANG_(false);
var G__49813 = cljs.core.volatile_BANG_(cljs.core.PersistentArrayMap.EMPTY);
return (datascript.impl.entity.__GT_Entity.cljs$core$IFn$_invoke$arity$4 ? datascript.impl.entity.__GT_Entity.cljs$core$IFn$_invoke$arity$4(G__49810,G__49811,G__49812,G__49813) : datascript.impl.entity.__GT_Entity.call(null,G__49810,G__49811,G__49812,G__49813));
} else {
return null;
}
} else {
return null;
}
});
datascript.impl.entity.entity_attr = (function datascript$impl$entity$entity_attr(db,a,datoms){
if(datascript.db.multival_QMARK_(db,a)){
if(datascript.db.ref_QMARK_(db,a)){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p1__49814_SHARP_,p2__49815_SHARP_){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(p1__49814_SHARP_,datascript.impl.entity.entity(db,new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(p2__49815_SHARP_)));
}),cljs.core.PersistentHashSet.EMPTY,datoms);
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p1__49817_SHARP_,p2__49818_SHARP_){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(p1__49817_SHARP_,new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(p2__49818_SHARP_));
}),cljs.core.PersistentHashSet.EMPTY,datoms);
}
} else {
if(datascript.db.ref_QMARK_(db,a)){
return datascript.impl.entity.entity(db,new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datoms)));
} else {
return new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datoms));
}
}
});
datascript.impl.entity._lookup_backwards = (function datascript$impl$entity$_lookup_backwards(db,eid,attr,not_found){
var temp__5802__auto__ = cljs.core.not_empty(datascript.db._search(db,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,attr,eid], null)));
if(cljs.core.truth_(temp__5802__auto__)){
var datoms = temp__5802__auto__;
if(datascript.db.component_QMARK_(db,attr)){
return datascript.impl.entity.entity(db,new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datoms)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p1__49822_SHARP_,p2__49824_SHARP_){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(p1__49822_SHARP_,datascript.impl.entity.entity(db,new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(p2__49824_SHARP_)));
}),cljs.core.PersistentHashSet.EMPTY,datoms);
}
} else {
return not_found;
}
});
datascript.impl.entity.multival__GT_js = (function datascript$impl$entity$multival__GT_js(val){
if(cljs.core.truth_(val)){
return cljs.core.to_array(val);
} else {
return null;
}
});
datascript.impl.entity.js_seq = (function datascript$impl$entity$js_seq(e){
(datascript.impl.entity.touch.cljs$core$IFn$_invoke$arity$1 ? datascript.impl.entity.touch.cljs$core$IFn$_invoke$arity$1(e) : datascript.impl.entity.touch.call(null,e));

var iter__5480__auto__ = (function datascript$impl$entity$js_seq_$_iter__49845(s__49846){
return (new cljs.core.LazySeq(null,(function (){
var s__49846__$1 = s__49846;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__49846__$1);
if(temp__5804__auto__){
var s__49846__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__49846__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__49846__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__49848 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__49847 = (0);
while(true){
if((i__49847 < size__5479__auto__)){
var vec__49853 = cljs.core._nth(c__5478__auto__,i__49847);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__49853,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__49853,(1),null);
cljs.core.chunk_append(b__49848,((datascript.db.multival_QMARK_(e.db,a))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [a,datascript.impl.entity.multival__GT_js(v)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [a,v], null)));

var G__50039 = (i__49847 + (1));
i__49847 = G__50039;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__49848),datascript$impl$entity$js_seq_$_iter__49845(cljs.core.chunk_rest(s__49846__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__49848),null);
}
} else {
var vec__49863 = cljs.core.first(s__49846__$2);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__49863,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__49863,(1),null);
return cljs.core.cons(((datascript.db.multival_QMARK_(e.db,a))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [a,datascript.impl.entity.multival__GT_js(v)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [a,v], null)),datascript$impl$entity$js_seq_$_iter__49845(cljs.core.rest(s__49846__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.deref(e.cache));
});

/**
* @constructor
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.IFn}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.ILookup}
*/
datascript.impl.entity.Entity = (function (db,eid,touched,cache){
this.db = db;
this.eid = eid;
this.touched = touched;
this.cache = cache;
this.cljs$lang$protocol_mask$partition0$ = 2162164483;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(datascript.impl.entity.Entity.prototype.entry_set = (function (){
var self__ = this;
var this$ = this;
return cljs.core.to_array(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.to_array,datascript.impl.entity.js_seq(this$)));
}));

(datascript.impl.entity.Entity.prototype.forEach = (function() {
var G__50046 = null;
var G__50046__1 = (function (f){
var self__ = this;
var this$ = this;
var seq__49887 = cljs.core.seq(datascript.impl.entity.js_seq(this$));
var chunk__49888 = null;
var count__49889 = (0);
var i__49890 = (0);
while(true){
if((i__49890 < count__49889)){
var vec__49913 = chunk__49888.cljs$core$IIndexed$_nth$arity$2(null,i__49890);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__49913,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__49913,(1),null);
(f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(v,a,this$) : f.call(null,v,a,this$));


var G__50051 = seq__49887;
var G__50052 = chunk__49888;
var G__50053 = count__49889;
var G__50054 = (i__49890 + (1));
seq__49887 = G__50051;
chunk__49888 = G__50052;
count__49889 = G__50053;
i__49890 = G__50054;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__49887);
if(temp__5804__auto__){
var seq__49887__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__49887__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__49887__$1);
var G__50058 = cljs.core.chunk_rest(seq__49887__$1);
var G__50059 = c__5525__auto__;
var G__50060 = cljs.core.count(c__5525__auto__);
var G__50061 = (0);
seq__49887 = G__50058;
chunk__49888 = G__50059;
count__49889 = G__50060;
i__49890 = G__50061;
continue;
} else {
var vec__49917 = cljs.core.first(seq__49887__$1);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__49917,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__49917,(1),null);
(f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(v,a,this$) : f.call(null,v,a,this$));


var G__50063 = cljs.core.next(seq__49887__$1);
var G__50064 = null;
var G__50066 = (0);
var G__50067 = (0);
seq__49887 = G__50063;
chunk__49888 = G__50064;
count__49889 = G__50066;
i__49890 = G__50067;
continue;
}
} else {
return null;
}
}
break;
}
});
var G__50046__2 = (function (f,use_as_this){
var self__ = this;
var this$ = this;
var seq__49921 = cljs.core.seq(datascript.impl.entity.js_seq(this$));
var chunk__49922 = null;
var count__49923 = (0);
var i__49924 = (0);
while(true){
if((i__49924 < count__49923)){
var vec__49938 = chunk__49922.cljs$core$IIndexed$_nth$arity$2(null,i__49924);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__49938,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__49938,(1),null);
f.call(use_as_this,v,a,this$);


var G__50071 = seq__49921;
var G__50072 = chunk__49922;
var G__50073 = count__49923;
var G__50074 = (i__49924 + (1));
seq__49921 = G__50071;
chunk__49922 = G__50072;
count__49923 = G__50073;
i__49924 = G__50074;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__49921);
if(temp__5804__auto__){
var seq__49921__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__49921__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__49921__$1);
var G__50076 = cljs.core.chunk_rest(seq__49921__$1);
var G__50077 = c__5525__auto__;
var G__50078 = cljs.core.count(c__5525__auto__);
var G__50079 = (0);
seq__49921 = G__50076;
chunk__49922 = G__50077;
count__49923 = G__50078;
i__49924 = G__50079;
continue;
} else {
var vec__49942 = cljs.core.first(seq__49921__$1);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__49942,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__49942,(1),null);
f.call(use_as_this,v,a,this$);


var G__50080 = cljs.core.next(seq__49921__$1);
var G__50081 = null;
var G__50082 = (0);
var G__50083 = (0);
seq__49921 = G__50080;
chunk__49922 = G__50081;
count__49923 = G__50082;
i__49924 = G__50083;
continue;
}
} else {
return null;
}
}
break;
}
});
G__50046 = function(f,use_as_this){
switch(arguments.length){
case 1:
return G__50046__1.call(this,f);
case 2:
return G__50046__2.call(this,f,use_as_this);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__50046.cljs$core$IFn$_invoke$arity$1 = G__50046__1;
G__50046.cljs$core$IFn$_invoke$arity$2 = G__50046__2;
return G__50046;
})()
);

(datascript.impl.entity.Entity.prototype.get = (function (attr){
var self__ = this;
var this$ = this;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(attr,":db/id")){
return self__.eid;
} else {
if(datascript.db.reverse_ref_QMARK_(attr)){
return datascript.impl.entity.multival__GT_js(datascript.impl.entity._lookup_backwards(self__.db,self__.eid,datascript.db.reverse_ref(attr),null));
} else {
var G__49947 = (datascript.impl.entity.lookup_entity.cljs$core$IFn$_invoke$arity$2 ? datascript.impl.entity.lookup_entity.cljs$core$IFn$_invoke$arity$2(this$,attr) : datascript.impl.entity.lookup_entity.call(null,this$,attr));
if(datascript.db.multival_QMARK_(self__.db,attr)){
return datascript.impl.entity.multival__GT_js(G__49947);
} else {
return G__49947;
}
}
}
}));

(datascript.impl.entity.Entity.prototype.key_set = (function (){
var self__ = this;
var this$ = this;
return cljs.core.to_array(cljs.core.keys(this$));
}));

(datascript.impl.entity.Entity.prototype.entries = (function (){
var self__ = this;
var this$ = this;
return cljs.core.es6_entries_iterator(datascript.impl.entity.js_seq(this$));
}));

(datascript.impl.entity.Entity.prototype.value_set = (function (){
var self__ = this;
var this$ = this;
return cljs.core.to_array(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,datascript.impl.entity.js_seq(this$)));
}));

(datascript.impl.entity.Entity.prototype.toString = (function (){
var self__ = this;
var this$ = this;
return cljs.core.pr_str_STAR_(this$);
}));

(datascript.impl.entity.Entity.prototype.keys = (function (){
var self__ = this;
var this$ = this;
return cljs.core.es6_iterator(cljs.core.keys(this$));
}));

(datascript.impl.entity.Entity.prototype.values = (function (){
var self__ = this;
var this$ = this;
return cljs.core.es6_iterator(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,datascript.impl.entity.js_seq(this$)));
}));

(datascript.impl.entity.Entity.prototype.equiv = (function (other){
var self__ = this;
var this$ = this;
return (datascript.impl.entity.equiv_entity.cljs$core$IFn$_invoke$arity$2 ? datascript.impl.entity.equiv_entity.cljs$core$IFn$_invoke$arity$2(this$,other) : datascript.impl.entity.equiv_entity.call(null,this$,other));
}));

(datascript.impl.entity.Entity.prototype.has = (function (attr){
var self__ = this;
var this$ = this;
return (!((this$.get(attr) == null)));
}));

(datascript.impl.entity.Entity.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this$,attr){
var self__ = this;
var this$__$1 = this;
return (datascript.impl.entity.lookup_entity.cljs$core$IFn$_invoke$arity$3 ? datascript.impl.entity.lookup_entity.cljs$core$IFn$_invoke$arity$3(this$__$1,attr,null) : datascript.impl.entity.lookup_entity.call(null,this$__$1,attr,null));
}));

(datascript.impl.entity.Entity.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this$,attr,not_found){
var self__ = this;
var this$__$1 = this;
return (datascript.impl.entity.lookup_entity.cljs$core$IFn$_invoke$arity$3 ? datascript.impl.entity.lookup_entity.cljs$core$IFn$_invoke$arity$3(this$__$1,attr,not_found) : datascript.impl.entity.lookup_entity.call(null,this$__$1,attr,not_found));
}));

(datascript.impl.entity.Entity.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (_,writer,opts){
var self__ = this;
var ___$1 = this;
return cljs.core._pr_writer(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(self__.cache),new cljs.core.Keyword("db","id","db/id",-1388397098),self__.eid),writer,opts);
}));

(datascript.impl.entity.Entity.prototype.cljs$core$ICounted$_count$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
(datascript.impl.entity.touch.cljs$core$IFn$_invoke$arity$1 ? datascript.impl.entity.touch.cljs$core$IFn$_invoke$arity$1(this$__$1) : datascript.impl.entity.touch.call(null,this$__$1));

return cljs.core.count(cljs.core.deref(self__.cache));
}));

(datascript.impl.entity.Entity.prototype.cljs$core$IHash$_hash$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return (datascript.impl.entity.hash_entity.cljs$core$IFn$_invoke$arity$1 ? datascript.impl.entity.hash_entity.cljs$core$IFn$_invoke$arity$1(this$__$1) : datascript.impl.entity.hash_entity.call(null,this$__$1));
}));

(datascript.impl.entity.Entity.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this$,o){
var self__ = this;
var this$__$1 = this;
return (datascript.impl.entity.equiv_entity.cljs$core$IFn$_invoke$arity$2 ? datascript.impl.entity.equiv_entity.cljs$core$IFn$_invoke$arity$2(this$__$1,o) : datascript.impl.entity.equiv_entity.call(null,this$__$1,o));
}));

(datascript.impl.entity.Entity.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this$,k){
var self__ = this;
var this$__$1 = this;
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("datascript.impl.entity","nf","datascript.impl.entity/nf",-953741353),(datascript.impl.entity.lookup_entity.cljs$core$IFn$_invoke$arity$3 ? datascript.impl.entity.lookup_entity.cljs$core$IFn$_invoke$arity$3(this$__$1,k,new cljs.core.Keyword("datascript.impl.entity","nf","datascript.impl.entity/nf",-953741353)) : datascript.impl.entity.lookup_entity.call(null,this$__$1,k,new cljs.core.Keyword("datascript.impl.entity","nf","datascript.impl.entity/nf",-953741353))));
}));

(datascript.impl.entity.Entity.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
(datascript.impl.entity.touch.cljs$core$IFn$_invoke$arity$1 ? datascript.impl.entity.touch.cljs$core$IFn$_invoke$arity$1(this$__$1) : datascript.impl.entity.touch.call(null,this$__$1));

return cljs.core.seq(cljs.core.deref(self__.cache));
}));

(datascript.impl.entity.Entity.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__49960 = (arguments.length - (1));
switch (G__49960) {
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

(datascript.impl.entity.Entity.prototype.apply = (function (self__,args49881){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args49881)));
}));

(datascript.impl.entity.Entity.prototype.cljs$core$IFn$_invoke$arity$1 = (function (k){
var self__ = this;
var this$ = this;
return (datascript.impl.entity.lookup_entity.cljs$core$IFn$_invoke$arity$2 ? datascript.impl.entity.lookup_entity.cljs$core$IFn$_invoke$arity$2(this$,k) : datascript.impl.entity.lookup_entity.call(null,this$,k));
}));

(datascript.impl.entity.Entity.prototype.cljs$core$IFn$_invoke$arity$2 = (function (k,not_found){
var self__ = this;
var this$ = this;
return (datascript.impl.entity.lookup_entity.cljs$core$IFn$_invoke$arity$3 ? datascript.impl.entity.lookup_entity.cljs$core$IFn$_invoke$arity$3(this$,k,not_found) : datascript.impl.entity.lookup_entity.call(null,this$,k,not_found));
}));

(datascript.impl.entity.Entity.getBasis = (function (){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"db","db",-1661185010,null),new cljs.core.Symbol(null,"eid","eid",-2094915839,null),new cljs.core.Symbol(null,"touched","touched",1031397108,null),new cljs.core.Symbol(null,"cache","cache",403508473,null)], null);
}));

(datascript.impl.entity.Entity.cljs$lang$type = true);

(datascript.impl.entity.Entity.cljs$lang$ctorStr = "datascript.impl.entity/Entity");

(datascript.impl.entity.Entity.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"datascript.impl.entity/Entity");
}));

/**
 * Positional factory function for datascript.impl.entity/Entity.
 */
datascript.impl.entity.__GT_Entity = (function datascript$impl$entity$__GT_Entity(db,eid,touched,cache){
return (new datascript.impl.entity.Entity(db,eid,touched,cache));
});

datascript.impl.entity.entity_QMARK_ = (function datascript$impl$entity$entity_QMARK_(x){
return (x instanceof datascript.impl.entity.Entity);
});
datascript.impl.entity.equiv_entity = (function datascript$impl$entity$equiv_entity(this$,that){
return (((that instanceof datascript.impl.entity.Entity)) && ((((this$.db === that.db)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this$.eid,that.eid)))));
});
datascript.impl.entity.hash_entity = (function datascript$impl$entity$hash_entity(e){
return datascript.db.combine_hashes(cljs.core.hash(e.eid),goog.getUid(e.db));
});
datascript.impl.entity.lookup_entity = (function datascript$impl$entity$lookup_entity(var_args){
var G__49995 = arguments.length;
switch (G__49995) {
case 2:
return datascript.impl.entity.lookup_entity.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.impl.entity.lookup_entity.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.impl.entity.lookup_entity.cljs$core$IFn$_invoke$arity$2 = (function (this$,attr){
return datascript.impl.entity.lookup_entity.cljs$core$IFn$_invoke$arity$3(this$,attr,null);
}));

(datascript.impl.entity.lookup_entity.cljs$core$IFn$_invoke$arity$3 = (function (this$,attr,not_found){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(attr,new cljs.core.Keyword("db","id","db/id",-1388397098))){
return this$.eid;
} else {
if(datascript.db.reverse_ref_QMARK_(attr)){
return datascript.impl.entity._lookup_backwards(this$.db,this$.eid,datascript.db.reverse_ref(attr),not_found);
} else {
var temp__5806__auto__ = (function (){var fexpr__50001 = cljs.core.deref(this$.cache);
return (fexpr__50001.cljs$core$IFn$_invoke$arity$1 ? fexpr__50001.cljs$core$IFn$_invoke$arity$1(attr) : fexpr__50001.call(null,attr));
})();
if((temp__5806__auto__ == null)){
if(cljs.core.truth_(cljs.core.deref(this$.touched))){
return not_found;
} else {
var temp__5806__auto____$1 = cljs.core.not_empty(datascript.db._search(this$.db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [this$.eid,attr], null)));
if((temp__5806__auto____$1 == null)){
return not_found;
} else {
var datoms = temp__5806__auto____$1;
var value = datascript.impl.entity.entity_attr(this$.db,attr,datoms);
cljs.core.vreset_BANG_(this$.cache,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(this$.cache),attr,value));

return value;
}
}
} else {
var v = temp__5806__auto__;
return v;
}
}
}
}));

(datascript.impl.entity.lookup_entity.cljs$lang$maxFixedArity = 3);

datascript.impl.entity.touch_components = (function datascript$impl$entity$touch_components(db,a__GT_v){
return cljs.core.reduce_kv((function (acc,a,v){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(acc,a,((datascript.db.component_QMARK_(db,a))?((datascript.db.multival_QMARK_(db,a))?cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(datascript.impl.entity.touch,v)):(datascript.impl.entity.touch.cljs$core$IFn$_invoke$arity$1 ? datascript.impl.entity.touch.cljs$core$IFn$_invoke$arity$1(v) : datascript.impl.entity.touch.call(null,v))):v));
}),cljs.core.PersistentArrayMap.EMPTY,a__GT_v);
});
datascript.impl.entity.datoms__GT_cache = (function datascript$impl$entity$datoms__GT_cache(db,datoms){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,part){
var a = new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(cljs.core.first(part));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(acc,a,datascript.impl.entity.entity_attr(db,a,part));
}),cljs.core.PersistentArrayMap.EMPTY,cljs.core.partition_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"a","a",-2123407586),datoms));
});
datascript.impl.entity.touch = (function datascript$impl$entity$touch(e){
if((((e == null)) || (datascript.impl.entity.entity_QMARK_(e)))){
} else {
throw (new Error("Assert failed: (or (nil? e) (entity? e))"));
}

if((!((e == null)))){
if(cljs.core.truth_(cljs.core.deref(e.touched))){
} else {
var temp__5804__auto___50111 = cljs.core.not_empty(datascript.db._search(e.db,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [e.eid], null)));
if(cljs.core.truth_(temp__5804__auto___50111)){
var datoms_50115 = temp__5804__auto___50111;
cljs.core.vreset_BANG_(e.cache,datascript.impl.entity.touch_components(e.db,datascript.impl.entity.datoms__GT_cache(e.db,datoms_50115)));

cljs.core.vreset_BANG_(e.touched,true);
} else {
}
}

return e;
} else {
return null;
}
});
goog.exportSymbol("datascript.impl.entity.Entity",datascript.impl.entity.Entity);

//# sourceMappingURL=datascript.impl.entity.js.map
