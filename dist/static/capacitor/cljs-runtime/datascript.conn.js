goog.provide('datascript.conn');

/**
* @constructor
 * @implements {cljs.core.IWatchable}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.IReset}
 * @implements {cljs.core.ISwap}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IDeref}
 * @implements {extend_clj.core.IAtom3}
 * @implements {cljs.core.ILookup}
*/
datascript.conn.Conn = (function (atom,validator,watches,meta){
this.atom = atom;
this.validator = validator;
this.watches = watches;
this.meta = meta;
this.cljs$lang$protocol_mask$partition1$ = 98306;
this.cljs$lang$protocol_mask$partition0$ = 6455552;
});
(datascript.conn.Conn.prototype.equiv = (function (other__43353__auto__){
var self__ = this;
var this__43352__auto__ = this;
return this__43352__auto__.cljs$core$IEquiv$_equiv$arity$2(null,other__43353__auto__);
}));

(datascript.conn.Conn.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = (function (this__43352__auto__,oldv__43360__auto__,newv__43355__auto__){
var self__ = this;
var this__43352__auto____$1 = this;
var seq__50147 = cljs.core.seq(self__.watches);
var chunk__50148 = null;
var count__50149 = (0);
var i__50150 = (0);
while(true){
if((i__50150 < count__50149)){
var vec__50173 = chunk__50148.cljs$core$IIndexed$_nth$arity$2(null,i__50150);
var k__43361__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50173,(0),null);
var f__43356__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50173,(1),null);
(f__43356__auto__.cljs$core$IFn$_invoke$arity$4 ? f__43356__auto__.cljs$core$IFn$_invoke$arity$4(k__43361__auto__,this__43352__auto____$1,oldv__43360__auto__,newv__43355__auto__) : f__43356__auto__.call(null,k__43361__auto__,this__43352__auto____$1,oldv__43360__auto__,newv__43355__auto__));


var G__50605 = seq__50147;
var G__50606 = chunk__50148;
var G__50607 = count__50149;
var G__50608 = (i__50150 + (1));
seq__50147 = G__50605;
chunk__50148 = G__50606;
count__50149 = G__50607;
i__50150 = G__50608;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__50147);
if(temp__5804__auto__){
var seq__50147__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__50147__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__50147__$1);
var G__50611 = cljs.core.chunk_rest(seq__50147__$1);
var G__50612 = c__5525__auto__;
var G__50613 = cljs.core.count(c__5525__auto__);
var G__50614 = (0);
seq__50147 = G__50611;
chunk__50148 = G__50612;
count__50149 = G__50613;
i__50150 = G__50614;
continue;
} else {
var vec__50177 = cljs.core.first(seq__50147__$1);
var k__43361__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50177,(0),null);
var f__43356__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50177,(1),null);
(f__43356__auto__.cljs$core$IFn$_invoke$arity$4 ? f__43356__auto__.cljs$core$IFn$_invoke$arity$4(k__43361__auto__,this__43352__auto____$1,oldv__43360__auto__,newv__43355__auto__) : f__43356__auto__.call(null,k__43361__auto__,this__43352__auto____$1,oldv__43360__auto__,newv__43355__auto__));


var G__50618 = cljs.core.next(seq__50147__$1);
var G__50619 = null;
var G__50620 = (0);
var G__50621 = (0);
seq__50147 = G__50618;
chunk__50148 = G__50619;
count__50149 = G__50620;
i__50150 = G__50621;
continue;
}
} else {
return null;
}
}
break;
}
}));

(datascript.conn.Conn.prototype.cljs$core$IWatchable$_add_watch$arity$3 = (function (this__43352__auto__,key__43362__auto__,f__43356__auto__){
var self__ = this;
var this__43352__auto____$1 = this;
(this__43352__auto____$1.watches = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.watches,key__43362__auto__,f__43356__auto__));

return this__43352__auto____$1;
}));

(datascript.conn.Conn.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = (function (this__43352__auto__,key__43362__auto__){
var self__ = this;
var this__43352__auto____$1 = this;
return (this__43352__auto____$1.watches = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.watches,key__43362__auto__));
}));

(datascript.conn.Conn.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (o__43354__auto__,other__43353__auto__){
var self__ = this;
var o__43354__auto____$1 = this;
return (o__43354__auto____$1 === other__43353__auto__);
}));

(datascript.conn.Conn.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__43352__auto__){
var self__ = this;
var this__43352__auto____$1 = this;
return goog.getUid(this__43352__auto____$1);
}));

(datascript.conn.Conn.prototype.cljs$core$IReset$_reset_BANG_$arity$2 = (function (this__43352__auto__,newv__43355__auto__){
var self__ = this;
var this__43352__auto____$1 = this;
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(this__43352__auto____$1.extend_clj$core$IAtom3$swap_STAR_$arity$3(null,cljs.core.constantly(newv__43355__auto__),cljs.core.List.EMPTY),(1));
}));

(datascript.conn.Conn.prototype.cljs$core$ISwap$_swap_BANG_$arity$2 = (function (this__43352__auto__,f__43356__auto__){
var self__ = this;
var this__43352__auto____$1 = this;
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(this__43352__auto____$1.extend_clj$core$IAtom3$swap_STAR_$arity$3(null,f__43356__auto__,cljs.core.List.EMPTY),(1));
}));

(datascript.conn.Conn.prototype.cljs$core$ISwap$_swap_BANG_$arity$3 = (function (this__43352__auto__,f__43356__auto__,a__43357__auto__){
var self__ = this;
var this__43352__auto____$1 = this;
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(this__43352__auto____$1.extend_clj$core$IAtom3$swap_STAR_$arity$3(null,f__43356__auto__,(new cljs.core.List(null,a__43357__auto__,null,(1),null))),(1));
}));

(datascript.conn.Conn.prototype.cljs$core$ISwap$_swap_BANG_$arity$4 = (function (this__43352__auto__,f__43356__auto__,a__43357__auto__,b__43358__auto__){
var self__ = this;
var this__43352__auto____$1 = this;
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(this__43352__auto____$1.extend_clj$core$IAtom3$swap_STAR_$arity$3(null,f__43356__auto__,(new cljs.core.List(null,a__43357__auto__,(new cljs.core.List(null,b__43358__auto__,null,(1),null)),(2),null))),(1));
}));

(datascript.conn.Conn.prototype.cljs$core$ISwap$_swap_BANG_$arity$5 = (function (this__43352__auto__,f__43356__auto__,a__43357__auto__,b__43358__auto__,xs__43359__auto__){
var self__ = this;
var this__43352__auto____$1 = this;
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(this__43352__auto____$1.extend_clj$core$IAtom3$swap_STAR_$arity$3(null,f__43356__auto__,cljs.core.cons(a__43357__auto__,cljs.core.cons(b__43358__auto__,xs__43359__auto__))),(1));
}));

(datascript.conn.Conn.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__43352__auto__){
var self__ = this;
var this__43352__auto____$1 = this;
return self__.meta;
}));

(datascript.conn.Conn.prototype.cljs$core$IDeref$_deref$arity$1 = (function (this__43352__auto__){
var self__ = this;
var this__43352__auto____$1 = this;
return this__43352__auto____$1.extend_clj$core$IAtom3$deref_impl$arity$1(null);
}));

(datascript.conn.Conn.prototype.extend_clj$core$IAtom3$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.conn.Conn.prototype.extend_clj$core$IAtom3$validate$arity$3 = (function (this__43352__auto__,validator__43364__auto__,value__43365__auto__){
var self__ = this;
var this__43352__auto____$1 = this;
if((!((validator__43364__auto__ == null)))){
if(cljs.core.truth_((validator__43364__auto__.cljs$core$IFn$_invoke$arity$1 ? validator__43364__auto__.cljs$core$IFn$_invoke$arity$1(value__43365__auto__) : validator__43364__auto__.call(null,value__43365__auto__)))){
return null;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Invalid reference state",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),value__43365__auto__], null));
}
} else {
return null;
}
}));

(datascript.conn.Conn.prototype.extend_clj$core$IAtom3$notify_watches$arity$3 = (function (this__43352__auto__,oldv__43360__auto__,newv__43355__auto__){
var self__ = this;
var this__43352__auto____$1 = this;
var seq__50201 = cljs.core.seq(self__.watches);
var chunk__50202 = null;
var count__50203 = (0);
var i__50204 = (0);
while(true){
if((i__50204 < count__50203)){
var vec__50215 = chunk__50202.cljs$core$IIndexed$_nth$arity$2(null,i__50204);
var k__43361__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50215,(0),null);
var w__43366__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50215,(1),null);
(w__43366__auto__.cljs$core$IFn$_invoke$arity$4 ? w__43366__auto__.cljs$core$IFn$_invoke$arity$4(k__43361__auto__,this__43352__auto____$1,oldv__43360__auto__,newv__43355__auto__) : w__43366__auto__.call(null,k__43361__auto__,this__43352__auto____$1,oldv__43360__auto__,newv__43355__auto__));


var G__50636 = seq__50201;
var G__50637 = chunk__50202;
var G__50638 = count__50203;
var G__50639 = (i__50204 + (1));
seq__50201 = G__50636;
chunk__50202 = G__50637;
count__50203 = G__50638;
i__50204 = G__50639;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__50201);
if(temp__5804__auto__){
var seq__50201__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__50201__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__50201__$1);
var G__50642 = cljs.core.chunk_rest(seq__50201__$1);
var G__50643 = c__5525__auto__;
var G__50644 = cljs.core.count(c__5525__auto__);
var G__50645 = (0);
seq__50201 = G__50642;
chunk__50202 = G__50643;
count__50203 = G__50644;
i__50204 = G__50645;
continue;
} else {
var vec__50220 = cljs.core.first(seq__50201__$1);
var k__43361__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50220,(0),null);
var w__43366__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50220,(1),null);
(w__43366__auto__.cljs$core$IFn$_invoke$arity$4 ? w__43366__auto__.cljs$core$IFn$_invoke$arity$4(k__43361__auto__,this__43352__auto____$1,oldv__43360__auto__,newv__43355__auto__) : w__43366__auto__.call(null,k__43361__auto__,this__43352__auto____$1,oldv__43360__auto__,newv__43355__auto__));


var G__50650 = cljs.core.next(seq__50201__$1);
var G__50651 = null;
var G__50652 = (0);
var G__50653 = (0);
seq__50201 = G__50650;
chunk__50202 = G__50651;
count__50203 = G__50652;
i__50204 = G__50653;
continue;
}
} else {
return null;
}
}
break;
}
}));

(datascript.conn.Conn.prototype.extend_clj$core$IAtom3$swap_STAR_$arity$3 = (function (this__43352__auto__,f__43356__auto__,args__43367__auto__){
var self__ = this;
var this__43352__auto____$1 = this;
var oldv__43360__auto__ = cljs.core.deref(this__43352__auto____$1);
var newv__43355__auto__ = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f__43356__auto__,oldv__43360__auto__,args__43367__auto__);
this__43352__auto____$1.extend_clj$core$IAtom3$validate$arity$3(null,self__.validator,newv__43355__auto__);

this__43352__auto____$1.extend_clj$core$IAtom3$compare_and_set_impl$arity$3(null,oldv__43360__auto__,newv__43355__auto__);

this__43352__auto____$1.extend_clj$core$IAtom3$notify_watches$arity$3(null,oldv__43360__auto__,newv__43355__auto__);

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [oldv__43360__auto__,newv__43355__auto__], null);
}));

(datascript.conn.Conn.prototype.extend_clj$core$IAtom3$deref_impl$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return new cljs.core.Keyword(null,"db","db",993250759).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(self__.atom));
}));

(datascript.conn.Conn.prototype.extend_clj$core$IAtom3$compare_and_set_impl$arity$3 = (function (this$,oldv,newv){
var self__ = this;
var this$__$1 = this;
return cljs.core.compare_and_set_BANG_(self__.atom,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(self__.atom),new cljs.core.Keyword(null,"db","db",993250759),oldv),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(self__.atom),new cljs.core.Keyword(null,"db","db",993250759),newv));
}));

(datascript.conn.Conn.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__43352__auto__,k__43361__auto__){
var self__ = this;
var this__43352__auto____$1 = this;
return this__43352__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__43361__auto__,null);
}));

(datascript.conn.Conn.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__43352__auto__,k__43361__auto__,not_found__43363__auto__){
var self__ = this;
var this__43352__auto____$1 = this;
var G__50244 = k__43361__auto__;
var G__50244__$1 = (((G__50244 instanceof cljs.core.Keyword))?G__50244.fqn:null);
switch (G__50244__$1) {
case "atom":
return self__.atom;

break;
default:
return not_found__43363__auto__;

}
}));

(datascript.conn.Conn.getBasis = (function (){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"atom","atom",1243487874,null),new cljs.core.Symbol(null,"validator","validator",-325659154,null),new cljs.core.Symbol(null,"watches","watches",1367433992,null),new cljs.core.Symbol(null,"meta","meta",-1154898805,null)], null);
}));

(datascript.conn.Conn.cljs$lang$type = true);

(datascript.conn.Conn.cljs$lang$ctorStr = "datascript.conn/Conn");

(datascript.conn.Conn.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"datascript.conn/Conn");
}));

/**
 * Positional factory function for datascript.conn/Conn.
 */
datascript.conn.__GT_Conn = (function datascript$conn$__GT_Conn(atom,validator,watches,meta){
return (new datascript.conn.Conn(atom,validator,watches,meta));
});


datascript.conn.__GT_Conn = (function datascript$conn$__GT_Conn(var_args){
var G__50269 = arguments.length;
switch (G__50269) {
case 1:
return datascript.conn.__GT_Conn.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___50674 = arguments.length;
var i__5727__auto___50676 = (0);
while(true){
if((i__5727__auto___50676 < len__5726__auto___50674)){
args_arr__5751__auto__.push((arguments[i__5727__auto___50676]));

var G__50678 = (i__5727__auto___50676 + (1));
i__5727__auto___50676 = G__50678;
continue;
} else {
}
break;
}

var argseq__5752__auto__ = ((((1) < args_arr__5751__auto__.length))?(new cljs.core.IndexedSeq(args_arr__5751__auto__.slice((1)),(0),null)):null);
return datascript.conn.__GT_Conn.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5752__auto__);

}
});

(datascript.conn.__GT_Conn.cljs$core$IFn$_invoke$arity$1 = (function (atom){
return (new datascript.conn.Conn(atom,null,cljs.core.PersistentArrayMap.EMPTY,cljs.core.PersistentArrayMap.EMPTY));
}));

(datascript.conn.__GT_Conn.cljs$core$IFn$_invoke$arity$variadic = (function (atom,rest__43368__auto__){
var opts__43369__auto__ = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.array_map,rest__43368__auto__);
var ref__43370__auto__ = (new datascript.conn.Conn(atom,null,cljs.core.PersistentArrayMap.EMPTY,cljs.core.PersistentArrayMap.EMPTY));
var temp__5808__auto___50679 = new cljs.core.Keyword(null,"validator","validator",-1966190681).cljs$core$IFn$_invoke$arity$1(opts__43369__auto__);
if((temp__5808__auto___50679 == null)){
} else {
var validator__43364__auto___50683 = temp__5808__auto___50679;
ref__43370__auto__.extend_clj$core$IAtom3$validate$arity$3(null,validator__43364__auto___50683,cljs.core.deref(ref__43370__auto__));

(ref__43370__auto__.validator = validator__43364__auto___50683);
}

var temp__5808__auto___50684 = new cljs.core.Keyword(null,"meta","meta",1499536964).cljs$core$IFn$_invoke$arity$1(opts__43369__auto__);
if((temp__5808__auto___50684 == null)){
} else {
var meta__43371__auto___50685 = temp__5808__auto___50684;
cljs.core.reset_meta_BANG_(ref__43370__auto__,meta__43371__auto___50685);
}

return ref__43370__auto__;
}));

/** @this {Function} */
(datascript.conn.__GT_Conn.cljs$lang$applyTo = (function (seq50255){
var G__50257 = cljs.core.first(seq50255);
var seq50255__$1 = cljs.core.next(seq50255);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__50257,seq50255__$1);
}));

(datascript.conn.__GT_Conn.cljs$lang$maxFixedArity = (1));


datascript.conn.make_conn = (function datascript$conn$make_conn(opts){
var G__50294 = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(opts);
return (datascript.conn.__GT_Conn.cljs$core$IFn$_invoke$arity$1 ? datascript.conn.__GT_Conn.cljs$core$IFn$_invoke$arity$1(G__50294) : datascript.conn.__GT_Conn.call(null,G__50294));
});
datascript.conn.with$ = (function datascript$conn$with(var_args){
var G__50302 = arguments.length;
switch (G__50302) {
case 2:
return datascript.conn.with$.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.conn.with$.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.conn.with$.cljs$core$IFn$_invoke$arity$2 = (function (db,tx_data){
return datascript.conn.with$.cljs$core$IFn$_invoke$arity$3(db,tx_data,null);
}));

(datascript.conn.with$.cljs$core$IFn$_invoke$arity$3 = (function (db,tx_data,tx_meta){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

if((db instanceof datascript.db.FilteredDB)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Filtered DB cannot be modified",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transaction","filtered","transaction/filtered",1699706605)], null));
} else {
return datascript.db.transact_tx_data(datascript.db.__GT_TxReport(db,db,cljs.core.PersistentVector.EMPTY,cljs.core.PersistentArrayMap.EMPTY,tx_meta),tx_data);
}
}));

(datascript.conn.with$.cljs$lang$maxFixedArity = 3);

/**
 * Applies transaction to an immutable db value, returning new immutable db value. Same as `(:db-after (with db tx-data))`.
 */
datascript.conn.db_with = (function datascript$conn$db_with(db,tx_data){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

return new cljs.core.Keyword(null,"db-after","db-after",-571884666).cljs$core$IFn$_invoke$arity$1(datascript.conn.with$.cljs$core$IFn$_invoke$arity$2(db,tx_data));
});
datascript.conn.conn_QMARK_ = (function datascript$conn$conn_QMARK_(conn){
var and__5000__auto__ = (((!((conn == null))))?(((((conn.cljs$lang$protocol_mask$partition0$ & (32768))) || ((cljs.core.PROTOCOL_SENTINEL === conn.cljs$core$IDeref$))))?true:(((!conn.cljs$lang$protocol_mask$partition0$))?cljs.core.native_satisfies_QMARK_(cljs.core.IDeref,conn):false)):cljs.core.native_satisfies_QMARK_(cljs.core.IDeref,conn));
if(and__5000__auto__){
var temp__5806__auto__ = cljs.core.deref(conn);
if((temp__5806__auto__ == null)){
return true;
} else {
var db = temp__5806__auto__;
return datascript.db.db_QMARK_(db);
}
} else {
return and__5000__auto__;
}
});
datascript.conn.conn_from_db = (function datascript$conn$conn_from_db(db){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

var temp__5806__auto__ = datascript.storage.storage(db);
if((temp__5806__auto__ == null)){
return datascript.conn.make_conn(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db","db",993250759),db], null));
} else {
var storage = temp__5806__auto__;
datascript.storage.store.cljs$core$IFn$_invoke$arity$1(db);

return datascript.conn.make_conn(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"db","db",993250759),db,new cljs.core.Keyword(null,"tx-tail","tx-tail",1116487556),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"db-last-stored","db-last-stored",-2068760702),db], null));
}
});
datascript.conn.conn_from_datoms = (function datascript$conn$conn_from_datoms(var_args){
var G__50420 = arguments.length;
switch (G__50420) {
case 1:
return datascript.conn.conn_from_datoms.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return datascript.conn.conn_from_datoms.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.conn.conn_from_datoms.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.conn.conn_from_datoms.cljs$core$IFn$_invoke$arity$1 = (function (datoms){
return datascript.conn.conn_from_db(datascript.db.init_db(datoms,null,cljs.core.PersistentArrayMap.EMPTY));
}));

(datascript.conn.conn_from_datoms.cljs$core$IFn$_invoke$arity$2 = (function (datoms,schema){
return datascript.conn.conn_from_db(datascript.db.init_db(datoms,schema,cljs.core.PersistentArrayMap.EMPTY));
}));

(datascript.conn.conn_from_datoms.cljs$core$IFn$_invoke$arity$3 = (function (datoms,schema,opts){
return datascript.conn.conn_from_db(datascript.db.init_db(datoms,schema,datascript.storage.maybe_adapt_storage(opts)));
}));

(datascript.conn.conn_from_datoms.cljs$lang$maxFixedArity = 3);

datascript.conn.create_conn = (function datascript$conn$create_conn(var_args){
var G__50430 = arguments.length;
switch (G__50430) {
case 0:
return datascript.conn.create_conn.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return datascript.conn.create_conn.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return datascript.conn.create_conn.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.conn.create_conn.cljs$core$IFn$_invoke$arity$0 = (function (){
return datascript.conn.conn_from_db(datascript.db.empty_db(null,cljs.core.PersistentArrayMap.EMPTY));
}));

(datascript.conn.create_conn.cljs$core$IFn$_invoke$arity$1 = (function (schema){
return datascript.conn.conn_from_db(datascript.db.empty_db(schema,cljs.core.PersistentArrayMap.EMPTY));
}));

(datascript.conn.create_conn.cljs$core$IFn$_invoke$arity$2 = (function (schema,opts){
return datascript.conn.conn_from_db(datascript.db.empty_db(schema,datascript.storage.maybe_adapt_storage(opts)));
}));

(datascript.conn.create_conn.cljs$lang$maxFixedArity = 2);

datascript.conn.restore_conn = (function datascript$conn$restore_conn(var_args){
var G__50445 = arguments.length;
switch (G__50445) {
case 1:
return datascript.conn.restore_conn.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return datascript.conn.restore_conn.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.conn.restore_conn.cljs$core$IFn$_invoke$arity$1 = (function (storage){
return datascript.conn.restore_conn.cljs$core$IFn$_invoke$arity$2(storage,cljs.core.PersistentArrayMap.EMPTY);
}));

(datascript.conn.restore_conn.cljs$core$IFn$_invoke$arity$2 = (function (storage,opts){
var temp__5808__auto__ = datascript.storage.restore_impl(storage,opts);
if((temp__5808__auto__ == null)){
return null;
} else {
var vec__50460 = temp__5808__auto__;
var db = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50460,(0),null);
var tail = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50460,(1),null);
return datascript.conn.make_conn(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"db","db",993250759),datascript.storage.db_with_tail(db,tail),new cljs.core.Keyword(null,"tx-tail","tx-tail",1116487556),tail,new cljs.core.Keyword(null,"db-last-stored","db-last-stored",-2068760702),db], null));
}
}));

(datascript.conn.restore_conn.cljs$lang$maxFixedArity = 2);

datascript.conn._transact_BANG_ = (function datascript$conn$_transact_BANG_(conn,tx_data,tx_meta){
if(datascript.conn.conn_QMARK_(conn)){
} else {
throw (new Error("Assert failed: (conn? conn)"));
}

var _STAR_report = cljs.core.volatile_BANG_(null);
var skip_store_QMARK_ = new cljs.core.Keyword(null,"skip-store?","skip-store?",-484019625).cljs$core$IFn$_invoke$arity$1(tx_meta);
var tx_meta_SINGLEQUOTE_ = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(tx_meta,new cljs.core.Keyword(null,"skip-store?","skip-store?",-484019625));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(conn,(function (db){
var r = datascript.conn.with$.cljs$core$IFn$_invoke$arity$3(db,tx_data,tx_meta_SINGLEQUOTE_);
cljs.core.vreset_BANG_(_STAR_report,r);

return new cljs.core.Keyword(null,"db-after","db-after",-571884666).cljs$core$IFn$_invoke$arity$1(r);
}));

var temp__5808__auto___50732 = datascript.storage.storage(cljs.core.deref(conn));
if((temp__5808__auto___50732 == null)){
} else {
var storage_50733 = temp__5808__auto___50732;
var map__50491_50734 = cljs.core.deref(_STAR_report);
var map__50491_50735__$1 = cljs.core.__destructure_map(map__50491_50734);
var db_50736 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__50491_50735__$1,new cljs.core.Keyword(null,"db-after","db-after",-571884666));
var datoms_50737 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__50491_50735__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var settings_50738 = me.tonsky.persistent_sorted_set.settings(new cljs.core.Keyword(null,"eavt","eavt",-666437073).cljs$core$IFn$_invoke$arity$1(db_50736));
var _STAR_atom_50739 = new cljs.core.Keyword(null,"atom","atom",-397043653).cljs$core$IFn$_invoke$arity$1(conn);
var tx_tail_SINGLEQUOTE__50740 = new cljs.core.Keyword(null,"tx-tail","tx-tail",1116487556).cljs$core$IFn$_invoke$arity$1(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(_STAR_atom_50739,cljs.core.update,new cljs.core.Keyword(null,"tx-tail","tx-tail",1116487556),cljs.core.conj,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datoms_50737], 0)));
if(cljs.core.truth_(skip_store_QMARK_)){
} else {
if((cljs.core.transduce.cljs$core$IFn$_invoke$arity$4(cljs.core.map.cljs$core$IFn$_invoke$arity$1(cljs.core.count),cljs.core._PLUS_,(0),tx_tail_SINGLEQUOTE__50740) > new cljs.core.Keyword(null,"branching-factor","branching-factor",1903198601).cljs$core$IFn$_invoke$arity$1(settings_50738))){
datascript.storage.store_impl_BANG_(db_50736,datascript.storage.storage_adapter(db_50736),false);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(_STAR_atom_50739,cljs.core.assoc,new cljs.core.Keyword(null,"tx-tail","tx-tail",1116487556),cljs.core.PersistentVector.EMPTY,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"db-last-stored","db-last-stored",-2068760702),db_50736], 0));
} else {
datascript.storage.store_tail(db_50736,tx_tail_SINGLEQUOTE__50740);
}
}
}

return cljs.core.deref(_STAR_report);
});
datascript.conn.transact_BANG_ = (function datascript$conn$transact_BANG_(var_args){
var G__50497 = arguments.length;
switch (G__50497) {
case 2:
return datascript.conn.transact_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.conn.transact_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.conn.transact_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (conn,tx_data){
return datascript.conn.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_data,null);
}));

(datascript.conn.transact_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (conn,tx_data,tx_meta){
if(datascript.conn.conn_QMARK_(conn)){
} else {
throw (new Error("Assert failed: (conn? conn)"));
}

var report = datascript.conn._transact_BANG_(conn,tx_data,tx_meta);
var seq__50506_50746 = cljs.core.seq(new cljs.core.Keyword(null,"listeners","listeners",394544445).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(new cljs.core.Keyword(null,"atom","atom",-397043653).cljs$core$IFn$_invoke$arity$1(conn))));
var chunk__50507_50747 = null;
var count__50508_50748 = (0);
var i__50509_50749 = (0);
while(true){
if((i__50509_50749 < count__50508_50748)){
var vec__50530_50753 = chunk__50507_50747.cljs$core$IIndexed$_nth$arity$2(null,i__50509_50749);
var __50754 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50530_50753,(0),null);
var callback_50755 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50530_50753,(1),null);
(callback_50755.cljs$core$IFn$_invoke$arity$1 ? callback_50755.cljs$core$IFn$_invoke$arity$1(report) : callback_50755.call(null,report));


var G__50756 = seq__50506_50746;
var G__50757 = chunk__50507_50747;
var G__50758 = count__50508_50748;
var G__50759 = (i__50509_50749 + (1));
seq__50506_50746 = G__50756;
chunk__50507_50747 = G__50757;
count__50508_50748 = G__50758;
i__50509_50749 = G__50759;
continue;
} else {
var temp__5804__auto___50760 = cljs.core.seq(seq__50506_50746);
if(temp__5804__auto___50760){
var seq__50506_50761__$1 = temp__5804__auto___50760;
if(cljs.core.chunked_seq_QMARK_(seq__50506_50761__$1)){
var c__5525__auto___50762 = cljs.core.chunk_first(seq__50506_50761__$1);
var G__50763 = cljs.core.chunk_rest(seq__50506_50761__$1);
var G__50764 = c__5525__auto___50762;
var G__50765 = cljs.core.count(c__5525__auto___50762);
var G__50766 = (0);
seq__50506_50746 = G__50763;
chunk__50507_50747 = G__50764;
count__50508_50748 = G__50765;
i__50509_50749 = G__50766;
continue;
} else {
var vec__50533_50767 = cljs.core.first(seq__50506_50761__$1);
var __50768 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50533_50767,(0),null);
var callback_50769 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50533_50767,(1),null);
(callback_50769.cljs$core$IFn$_invoke$arity$1 ? callback_50769.cljs$core$IFn$_invoke$arity$1(report) : callback_50769.call(null,report));


var G__50770 = cljs.core.next(seq__50506_50761__$1);
var G__50771 = null;
var G__50772 = (0);
var G__50773 = (0);
seq__50506_50746 = G__50770;
chunk__50507_50747 = G__50771;
count__50508_50748 = G__50772;
i__50509_50749 = G__50773;
continue;
}
} else {
}
}
break;
}

return report;
}));

(datascript.conn.transact_BANG_.cljs$lang$maxFixedArity = 3);

datascript.conn.reset_conn_BANG_ = (function datascript$conn$reset_conn_BANG_(var_args){
var G__50547 = arguments.length;
switch (G__50547) {
case 2:
return datascript.conn.reset_conn_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.conn.reset_conn_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.conn.reset_conn_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (conn,db){
return datascript.conn.reset_conn_BANG_.cljs$core$IFn$_invoke$arity$3(conn,db,null);
}));

(datascript.conn.reset_conn_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (conn,db,tx_meta){
if(datascript.conn.conn_QMARK_(conn)){
} else {
throw (new Error("Assert failed: (conn? conn)"));
}

if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db/db? db)"));
}

var db_before = cljs.core.deref(conn);
var report = datascript.db.map__GT_TxReport(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"db-before","db-before",-553691536),db_before,new cljs.core.Keyword(null,"db-after","db-after",-571884666),db,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),cljs.core.concat.cljs$core$IFn$_invoke$arity$2((cljs.core.truth_(db_before)?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__50539_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__50539_SHARP_,new cljs.core.Keyword(null,"added","added",2057651688),false);
}),datascript.db._datoms(db_before,new cljs.core.Keyword(null,"eavt","eavt",-666437073),null,null,null,null)):null),datascript.db._datoms(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),null,null,null,null)),new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),tx_meta], null));
var temp__5806__auto___50781 = datascript.storage.storage(db_before);
if((temp__5806__auto___50781 == null)){
cljs.core.reset_BANG_(conn,db);
} else {
var storage_50782 = temp__5806__auto___50781;
datascript.storage.store.cljs$core$IFn$_invoke$arity$1(db);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"atom","atom",-397043653).cljs$core$IFn$_invoke$arity$1(conn),cljs.core.assoc,new cljs.core.Keyword(null,"db","db",993250759),db,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"tx-tail","tx-tail",1116487556),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"db-last-stored","db-last-stored",-2068760702),db], 0));
}

var seq__50554_50783 = cljs.core.seq(new cljs.core.Keyword(null,"listeners","listeners",394544445).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(new cljs.core.Keyword(null,"atom","atom",-397043653).cljs$core$IFn$_invoke$arity$1(conn))));
var chunk__50555_50784 = null;
var count__50556_50785 = (0);
var i__50557_50786 = (0);
while(true){
if((i__50557_50786 < count__50556_50785)){
var vec__50568_50787 = chunk__50555_50784.cljs$core$IIndexed$_nth$arity$2(null,i__50557_50786);
var __50788 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50568_50787,(0),null);
var callback_50789 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50568_50787,(1),null);
(callback_50789.cljs$core$IFn$_invoke$arity$1 ? callback_50789.cljs$core$IFn$_invoke$arity$1(report) : callback_50789.call(null,report));


var G__50790 = seq__50554_50783;
var G__50791 = chunk__50555_50784;
var G__50792 = count__50556_50785;
var G__50793 = (i__50557_50786 + (1));
seq__50554_50783 = G__50790;
chunk__50555_50784 = G__50791;
count__50556_50785 = G__50792;
i__50557_50786 = G__50793;
continue;
} else {
var temp__5804__auto___50794 = cljs.core.seq(seq__50554_50783);
if(temp__5804__auto___50794){
var seq__50554_50795__$1 = temp__5804__auto___50794;
if(cljs.core.chunked_seq_QMARK_(seq__50554_50795__$1)){
var c__5525__auto___50796 = cljs.core.chunk_first(seq__50554_50795__$1);
var G__50797 = cljs.core.chunk_rest(seq__50554_50795__$1);
var G__50798 = c__5525__auto___50796;
var G__50799 = cljs.core.count(c__5525__auto___50796);
var G__50800 = (0);
seq__50554_50783 = G__50797;
chunk__50555_50784 = G__50798;
count__50556_50785 = G__50799;
i__50557_50786 = G__50800;
continue;
} else {
var vec__50575_50803 = cljs.core.first(seq__50554_50795__$1);
var __50804 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50575_50803,(0),null);
var callback_50805 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__50575_50803,(1),null);
(callback_50805.cljs$core$IFn$_invoke$arity$1 ? callback_50805.cljs$core$IFn$_invoke$arity$1(report) : callback_50805.call(null,report));


var G__50806 = cljs.core.next(seq__50554_50795__$1);
var G__50807 = null;
var G__50808 = (0);
var G__50809 = (0);
seq__50554_50783 = G__50806;
chunk__50555_50784 = G__50807;
count__50556_50785 = G__50808;
i__50557_50786 = G__50809;
continue;
}
} else {
}
}
break;
}

return db;
}));

(datascript.conn.reset_conn_BANG_.cljs$lang$maxFixedArity = 3);

datascript.conn.reset_schema_BANG_ = (function datascript$conn$reset_schema_BANG_(conn,schema){
if(datascript.conn.conn_QMARK_(conn)){
} else {
throw (new Error("Assert failed: (conn? conn)"));
}

var db = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(conn,datascript.db.with_schema,schema);
var temp__5808__auto___50814 = datascript.storage.storage(cljs.core.deref(conn));
if((temp__5808__auto___50814 == null)){
} else {
var storage_50815 = temp__5808__auto___50814;
datascript.storage.store_impl_BANG_(db,datascript.storage.storage_adapter(db),true);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"atom","atom",-397043653).cljs$core$IFn$_invoke$arity$1(conn),cljs.core.assoc,new cljs.core.Keyword(null,"tx-tail","tx-tail",1116487556),cljs.core.PersistentVector.EMPTY,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"db-last-stored","db-last-stored",-2068760702),db], 0));
}

return db;
});
datascript.conn.listen_BANG_ = (function datascript$conn$listen_BANG_(var_args){
var G__50588 = arguments.length;
switch (G__50588) {
case 2:
return datascript.conn.listen_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.conn.listen_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.conn.listen_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (conn,callback){
return datascript.conn.listen_BANG_.cljs$core$IFn$_invoke$arity$3(conn,cljs.core.rand.cljs$core$IFn$_invoke$arity$0(),callback);
}));

(datascript.conn.listen_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (conn,key,callback){
if(datascript.conn.conn_QMARK_(conn)){
} else {
throw (new Error("Assert failed: (conn? conn)"));
}

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"atom","atom",-397043653).cljs$core$IFn$_invoke$arity$1(conn),cljs.core.update,new cljs.core.Keyword(null,"listeners","listeners",394544445),cljs.core.assoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([key,callback], 0));

return key;
}));

(datascript.conn.listen_BANG_.cljs$lang$maxFixedArity = 3);

datascript.conn.unlisten_BANG_ = (function datascript$conn$unlisten_BANG_(conn,key){
if(datascript.conn.conn_QMARK_(conn)){
} else {
throw (new Error("Assert failed: (conn? conn)"));
}

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"atom","atom",-397043653).cljs$core$IFn$_invoke$arity$1(conn),cljs.core.update,new cljs.core.Keyword(null,"listeners","listeners",394544445),cljs.core.dissoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([key], 0));
});

//# sourceMappingURL=datascript.conn.js.map
