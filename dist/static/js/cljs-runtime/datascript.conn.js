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
(datascript.conn.Conn.prototype.equiv = (function (other__45621__auto__){
var self__ = this;
var this__45620__auto__ = this;
return this__45620__auto__.cljs$core$IEquiv$_equiv$arity$2(null,other__45621__auto__);
}));

(datascript.conn.Conn.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = (function (this__45620__auto__,oldv__45628__auto__,newv__45623__auto__){
var self__ = this;
var this__45620__auto____$1 = this;
var seq__56642 = cljs.core.seq(self__.watches);
var chunk__56643 = null;
var count__56644 = (0);
var i__56645 = (0);
while(true){
if((i__56645 < count__56644)){
var vec__56657 = chunk__56643.cljs$core$IIndexed$_nth$arity$2(null,i__56645);
var k__45629__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56657,(0),null);
var f__45624__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56657,(1),null);
(f__45624__auto__.cljs$core$IFn$_invoke$arity$4 ? f__45624__auto__.cljs$core$IFn$_invoke$arity$4(k__45629__auto__,this__45620__auto____$1,oldv__45628__auto__,newv__45623__auto__) : f__45624__auto__.call(null,k__45629__auto__,this__45620__auto____$1,oldv__45628__auto__,newv__45623__auto__));


var G__57109 = seq__56642;
var G__57110 = chunk__56643;
var G__57111 = count__56644;
var G__57112 = (i__56645 + (1));
seq__56642 = G__57109;
chunk__56643 = G__57110;
count__56644 = G__57111;
i__56645 = G__57112;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__56642);
if(temp__5804__auto__){
var seq__56642__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__56642__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__56642__$1);
var G__57199 = cljs.core.chunk_rest(seq__56642__$1);
var G__57200 = c__5525__auto__;
var G__57201 = cljs.core.count(c__5525__auto__);
var G__57202 = (0);
seq__56642 = G__57199;
chunk__56643 = G__57200;
count__56644 = G__57201;
i__56645 = G__57202;
continue;
} else {
var vec__56662 = cljs.core.first(seq__56642__$1);
var k__45629__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56662,(0),null);
var f__45624__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56662,(1),null);
(f__45624__auto__.cljs$core$IFn$_invoke$arity$4 ? f__45624__auto__.cljs$core$IFn$_invoke$arity$4(k__45629__auto__,this__45620__auto____$1,oldv__45628__auto__,newv__45623__auto__) : f__45624__auto__.call(null,k__45629__auto__,this__45620__auto____$1,oldv__45628__auto__,newv__45623__auto__));


var G__57203 = cljs.core.next(seq__56642__$1);
var G__57204 = null;
var G__57206 = (0);
var G__57207 = (0);
seq__56642 = G__57203;
chunk__56643 = G__57204;
count__56644 = G__57206;
i__56645 = G__57207;
continue;
}
} else {
return null;
}
}
break;
}
}));

(datascript.conn.Conn.prototype.cljs$core$IWatchable$_add_watch$arity$3 = (function (this__45620__auto__,key__45630__auto__,f__45624__auto__){
var self__ = this;
var this__45620__auto____$1 = this;
(this__45620__auto____$1.watches = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.watches,key__45630__auto__,f__45624__auto__));

return this__45620__auto____$1;
}));

(datascript.conn.Conn.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = (function (this__45620__auto__,key__45630__auto__){
var self__ = this;
var this__45620__auto____$1 = this;
return (this__45620__auto____$1.watches = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.watches,key__45630__auto__));
}));

(datascript.conn.Conn.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (o__45622__auto__,other__45621__auto__){
var self__ = this;
var o__45622__auto____$1 = this;
return (o__45622__auto____$1 === other__45621__auto__);
}));

(datascript.conn.Conn.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__45620__auto__){
var self__ = this;
var this__45620__auto____$1 = this;
return goog.getUid(this__45620__auto____$1);
}));

(datascript.conn.Conn.prototype.cljs$core$IReset$_reset_BANG_$arity$2 = (function (this__45620__auto__,newv__45623__auto__){
var self__ = this;
var this__45620__auto____$1 = this;
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(this__45620__auto____$1.extend_clj$core$IAtom3$swap_STAR_$arity$3(null,cljs.core.constantly(newv__45623__auto__),cljs.core.List.EMPTY),(1));
}));

(datascript.conn.Conn.prototype.cljs$core$ISwap$_swap_BANG_$arity$2 = (function (this__45620__auto__,f__45624__auto__){
var self__ = this;
var this__45620__auto____$1 = this;
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(this__45620__auto____$1.extend_clj$core$IAtom3$swap_STAR_$arity$3(null,f__45624__auto__,cljs.core.List.EMPTY),(1));
}));

(datascript.conn.Conn.prototype.cljs$core$ISwap$_swap_BANG_$arity$3 = (function (this__45620__auto__,f__45624__auto__,a__45625__auto__){
var self__ = this;
var this__45620__auto____$1 = this;
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(this__45620__auto____$1.extend_clj$core$IAtom3$swap_STAR_$arity$3(null,f__45624__auto__,(new cljs.core.List(null,a__45625__auto__,null,(1),null))),(1));
}));

(datascript.conn.Conn.prototype.cljs$core$ISwap$_swap_BANG_$arity$4 = (function (this__45620__auto__,f__45624__auto__,a__45625__auto__,b__45626__auto__){
var self__ = this;
var this__45620__auto____$1 = this;
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(this__45620__auto____$1.extend_clj$core$IAtom3$swap_STAR_$arity$3(null,f__45624__auto__,(new cljs.core.List(null,a__45625__auto__,(new cljs.core.List(null,b__45626__auto__,null,(1),null)),(2),null))),(1));
}));

(datascript.conn.Conn.prototype.cljs$core$ISwap$_swap_BANG_$arity$5 = (function (this__45620__auto__,f__45624__auto__,a__45625__auto__,b__45626__auto__,xs__45627__auto__){
var self__ = this;
var this__45620__auto____$1 = this;
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(this__45620__auto____$1.extend_clj$core$IAtom3$swap_STAR_$arity$3(null,f__45624__auto__,cljs.core.cons(a__45625__auto__,cljs.core.cons(b__45626__auto__,xs__45627__auto__))),(1));
}));

(datascript.conn.Conn.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__45620__auto__){
var self__ = this;
var this__45620__auto____$1 = this;
return self__.meta;
}));

(datascript.conn.Conn.prototype.cljs$core$IDeref$_deref$arity$1 = (function (this__45620__auto__){
var self__ = this;
var this__45620__auto____$1 = this;
return this__45620__auto____$1.extend_clj$core$IAtom3$deref_impl$arity$1(null);
}));

(datascript.conn.Conn.prototype.extend_clj$core$IAtom3$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.conn.Conn.prototype.extend_clj$core$IAtom3$validate$arity$3 = (function (this__45620__auto__,validator__45632__auto__,value__45633__auto__){
var self__ = this;
var this__45620__auto____$1 = this;
if((!((validator__45632__auto__ == null)))){
if(cljs.core.truth_((validator__45632__auto__.cljs$core$IFn$_invoke$arity$1 ? validator__45632__auto__.cljs$core$IFn$_invoke$arity$1(value__45633__auto__) : validator__45632__auto__.call(null,value__45633__auto__)))){
return null;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Invalid reference state",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),value__45633__auto__], null));
}
} else {
return null;
}
}));

(datascript.conn.Conn.prototype.extend_clj$core$IAtom3$notify_watches$arity$3 = (function (this__45620__auto__,oldv__45628__auto__,newv__45623__auto__){
var self__ = this;
var this__45620__auto____$1 = this;
var seq__56682 = cljs.core.seq(self__.watches);
var chunk__56684 = null;
var count__56685 = (0);
var i__56686 = (0);
while(true){
if((i__56686 < count__56685)){
var vec__56699 = chunk__56684.cljs$core$IIndexed$_nth$arity$2(null,i__56686);
var k__45629__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56699,(0),null);
var w__45634__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56699,(1),null);
(w__45634__auto__.cljs$core$IFn$_invoke$arity$4 ? w__45634__auto__.cljs$core$IFn$_invoke$arity$4(k__45629__auto__,this__45620__auto____$1,oldv__45628__auto__,newv__45623__auto__) : w__45634__auto__.call(null,k__45629__auto__,this__45620__auto____$1,oldv__45628__auto__,newv__45623__auto__));


var G__57215 = seq__56682;
var G__57216 = chunk__56684;
var G__57217 = count__56685;
var G__57218 = (i__56686 + (1));
seq__56682 = G__57215;
chunk__56684 = G__57216;
count__56685 = G__57217;
i__56686 = G__57218;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__56682);
if(temp__5804__auto__){
var seq__56682__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__56682__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__56682__$1);
var G__57219 = cljs.core.chunk_rest(seq__56682__$1);
var G__57220 = c__5525__auto__;
var G__57221 = cljs.core.count(c__5525__auto__);
var G__57222 = (0);
seq__56682 = G__57219;
chunk__56684 = G__57220;
count__56685 = G__57221;
i__56686 = G__57222;
continue;
} else {
var vec__56707 = cljs.core.first(seq__56682__$1);
var k__45629__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56707,(0),null);
var w__45634__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56707,(1),null);
(w__45634__auto__.cljs$core$IFn$_invoke$arity$4 ? w__45634__auto__.cljs$core$IFn$_invoke$arity$4(k__45629__auto__,this__45620__auto____$1,oldv__45628__auto__,newv__45623__auto__) : w__45634__auto__.call(null,k__45629__auto__,this__45620__auto____$1,oldv__45628__auto__,newv__45623__auto__));


var G__57223 = cljs.core.next(seq__56682__$1);
var G__57224 = null;
var G__57225 = (0);
var G__57226 = (0);
seq__56682 = G__57223;
chunk__56684 = G__57224;
count__56685 = G__57225;
i__56686 = G__57226;
continue;
}
} else {
return null;
}
}
break;
}
}));

(datascript.conn.Conn.prototype.extend_clj$core$IAtom3$swap_STAR_$arity$3 = (function (this__45620__auto__,f__45624__auto__,args__45635__auto__){
var self__ = this;
var this__45620__auto____$1 = this;
var oldv__45628__auto__ = cljs.core.deref(this__45620__auto____$1);
var newv__45623__auto__ = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f__45624__auto__,oldv__45628__auto__,args__45635__auto__);
this__45620__auto____$1.extend_clj$core$IAtom3$validate$arity$3(null,self__.validator,newv__45623__auto__);

this__45620__auto____$1.extend_clj$core$IAtom3$compare_and_set_impl$arity$3(null,oldv__45628__auto__,newv__45623__auto__);

this__45620__auto____$1.extend_clj$core$IAtom3$notify_watches$arity$3(null,oldv__45628__auto__,newv__45623__auto__);

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [oldv__45628__auto__,newv__45623__auto__], null);
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

(datascript.conn.Conn.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__45620__auto__,k__45629__auto__){
var self__ = this;
var this__45620__auto____$1 = this;
return this__45620__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__45629__auto__,null);
}));

(datascript.conn.Conn.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__45620__auto__,k__45629__auto__,not_found__45631__auto__){
var self__ = this;
var this__45620__auto____$1 = this;
var G__56729 = k__45629__auto__;
var G__56729__$1 = (((G__56729 instanceof cljs.core.Keyword))?G__56729.fqn:null);
switch (G__56729__$1) {
case "atom":
return self__.atom;

break;
default:
return not_found__45631__auto__;

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
var G__56748 = arguments.length;
switch (G__56748) {
case 1:
return datascript.conn.__GT_Conn.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
var args_arr__5751__auto__ = [];
var len__5726__auto___57236 = arguments.length;
var i__5727__auto___57237 = (0);
while(true){
if((i__5727__auto___57237 < len__5726__auto___57236)){
args_arr__5751__auto__.push((arguments[i__5727__auto___57237]));

var G__57238 = (i__5727__auto___57237 + (1));
i__5727__auto___57237 = G__57238;
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

(datascript.conn.__GT_Conn.cljs$core$IFn$_invoke$arity$variadic = (function (atom,rest__45636__auto__){
var opts__45637__auto__ = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.array_map,rest__45636__auto__);
var ref__45638__auto__ = (new datascript.conn.Conn(atom,null,cljs.core.PersistentArrayMap.EMPTY,cljs.core.PersistentArrayMap.EMPTY));
var temp__5808__auto___57245 = new cljs.core.Keyword(null,"validator","validator",-1966190681).cljs$core$IFn$_invoke$arity$1(opts__45637__auto__);
if((temp__5808__auto___57245 == null)){
} else {
var validator__45632__auto___57246 = temp__5808__auto___57245;
ref__45638__auto__.extend_clj$core$IAtom3$validate$arity$3(null,validator__45632__auto___57246,cljs.core.deref(ref__45638__auto__));

(ref__45638__auto__.validator = validator__45632__auto___57246);
}

var temp__5808__auto___57248 = new cljs.core.Keyword(null,"meta","meta",1499536964).cljs$core$IFn$_invoke$arity$1(opts__45637__auto__);
if((temp__5808__auto___57248 == null)){
} else {
var meta__45639__auto___57249 = temp__5808__auto___57248;
cljs.core.reset_meta_BANG_(ref__45638__auto__,meta__45639__auto___57249);
}

return ref__45638__auto__;
}));

/** @this {Function} */
(datascript.conn.__GT_Conn.cljs$lang$applyTo = (function (seq56744){
var G__56746 = cljs.core.first(seq56744);
var seq56744__$1 = cljs.core.next(seq56744);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__56746,seq56744__$1);
}));

(datascript.conn.__GT_Conn.cljs$lang$maxFixedArity = (1));


datascript.conn.make_conn = (function datascript$conn$make_conn(opts){
var G__56772 = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(opts);
return (datascript.conn.__GT_Conn.cljs$core$IFn$_invoke$arity$1 ? datascript.conn.__GT_Conn.cljs$core$IFn$_invoke$arity$1(G__56772) : datascript.conn.__GT_Conn.call(null,G__56772));
});
datascript.conn.with$ = (function datascript$conn$with(var_args){
var G__56777 = arguments.length;
switch (G__56777) {
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
var G__56867 = arguments.length;
switch (G__56867) {
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
var G__56915 = arguments.length;
switch (G__56915) {
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
var G__56939 = arguments.length;
switch (G__56939) {
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
var vec__56951 = temp__5808__auto__;
var db = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56951,(0),null);
var tail = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__56951,(1),null);
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

var temp__5808__auto___57291 = datascript.storage.storage(cljs.core.deref(conn));
if((temp__5808__auto___57291 == null)){
} else {
var storage_57292 = temp__5808__auto___57291;
var map__56981_57294 = cljs.core.deref(_STAR_report);
var map__56981_57295__$1 = cljs.core.__destructure_map(map__56981_57294);
var db_57296 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56981_57295__$1,new cljs.core.Keyword(null,"db-after","db-after",-571884666));
var datoms_57297 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56981_57295__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var settings_57298 = me.tonsky.persistent_sorted_set.settings(new cljs.core.Keyword(null,"eavt","eavt",-666437073).cljs$core$IFn$_invoke$arity$1(db_57296));
var _STAR_atom_57299 = new cljs.core.Keyword(null,"atom","atom",-397043653).cljs$core$IFn$_invoke$arity$1(conn);
var tx_tail_SINGLEQUOTE__57300 = new cljs.core.Keyword(null,"tx-tail","tx-tail",1116487556).cljs$core$IFn$_invoke$arity$1(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(_STAR_atom_57299,cljs.core.update,new cljs.core.Keyword(null,"tx-tail","tx-tail",1116487556),cljs.core.conj,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datoms_57297], 0)));
if(cljs.core.truth_(skip_store_QMARK_)){
} else {
if((cljs.core.transduce.cljs$core$IFn$_invoke$arity$4(cljs.core.map.cljs$core$IFn$_invoke$arity$1(cljs.core.count),cljs.core._PLUS_,(0),tx_tail_SINGLEQUOTE__57300) > new cljs.core.Keyword(null,"branching-factor","branching-factor",1903198601).cljs$core$IFn$_invoke$arity$1(settings_57298))){
datascript.storage.store_impl_BANG_(db_57296,datascript.storage.storage_adapter(db_57296),false);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(_STAR_atom_57299,cljs.core.assoc,new cljs.core.Keyword(null,"tx-tail","tx-tail",1116487556),cljs.core.PersistentVector.EMPTY,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"db-last-stored","db-last-stored",-2068760702),db_57296], 0));
} else {
datascript.storage.store_tail(db_57296,tx_tail_SINGLEQUOTE__57300);
}
}
}

return cljs.core.deref(_STAR_report);
});
datascript.conn.transact_BANG_ = (function datascript$conn$transact_BANG_(var_args){
var G__56988 = arguments.length;
switch (G__56988) {
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
var seq__57004_57309 = cljs.core.seq(new cljs.core.Keyword(null,"listeners","listeners",394544445).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(new cljs.core.Keyword(null,"atom","atom",-397043653).cljs$core$IFn$_invoke$arity$1(conn))));
var chunk__57005_57310 = null;
var count__57006_57311 = (0);
var i__57007_57312 = (0);
while(true){
if((i__57007_57312 < count__57006_57311)){
var vec__57032_57314 = chunk__57005_57310.cljs$core$IIndexed$_nth$arity$2(null,i__57007_57312);
var __57315 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57032_57314,(0),null);
var callback_57316 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57032_57314,(1),null);
(callback_57316.cljs$core$IFn$_invoke$arity$1 ? callback_57316.cljs$core$IFn$_invoke$arity$1(report) : callback_57316.call(null,report));


var G__57317 = seq__57004_57309;
var G__57318 = chunk__57005_57310;
var G__57319 = count__57006_57311;
var G__57320 = (i__57007_57312 + (1));
seq__57004_57309 = G__57317;
chunk__57005_57310 = G__57318;
count__57006_57311 = G__57319;
i__57007_57312 = G__57320;
continue;
} else {
var temp__5804__auto___57322 = cljs.core.seq(seq__57004_57309);
if(temp__5804__auto___57322){
var seq__57004_57324__$1 = temp__5804__auto___57322;
if(cljs.core.chunked_seq_QMARK_(seq__57004_57324__$1)){
var c__5525__auto___57325 = cljs.core.chunk_first(seq__57004_57324__$1);
var G__57326 = cljs.core.chunk_rest(seq__57004_57324__$1);
var G__57327 = c__5525__auto___57325;
var G__57328 = cljs.core.count(c__5525__auto___57325);
var G__57329 = (0);
seq__57004_57309 = G__57326;
chunk__57005_57310 = G__57327;
count__57006_57311 = G__57328;
i__57007_57312 = G__57329;
continue;
} else {
var vec__57036_57332 = cljs.core.first(seq__57004_57324__$1);
var __57333 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57036_57332,(0),null);
var callback_57334 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57036_57332,(1),null);
(callback_57334.cljs$core$IFn$_invoke$arity$1 ? callback_57334.cljs$core$IFn$_invoke$arity$1(report) : callback_57334.call(null,report));


var G__57336 = cljs.core.next(seq__57004_57324__$1);
var G__57337 = null;
var G__57338 = (0);
var G__57339 = (0);
seq__57004_57309 = G__57336;
chunk__57005_57310 = G__57337;
count__57006_57311 = G__57338;
i__57007_57312 = G__57339;
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
var G__57044 = arguments.length;
switch (G__57044) {
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
var report = datascript.db.map__GT_TxReport(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"db-before","db-before",-553691536),db_before,new cljs.core.Keyword(null,"db-after","db-after",-571884666),db,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),cljs.core.concat.cljs$core$IFn$_invoke$arity$2((cljs.core.truth_(db_before)?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__57040_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__57040_SHARP_,new cljs.core.Keyword(null,"added","added",2057651688),false);
}),datascript.db._datoms(db_before,new cljs.core.Keyword(null,"eavt","eavt",-666437073),null,null,null,null)):null),datascript.db._datoms(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),null,null,null,null)),new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),tx_meta], null));
var temp__5806__auto___57363 = datascript.storage.storage(db_before);
if((temp__5806__auto___57363 == null)){
cljs.core.reset_BANG_(conn,db);
} else {
var storage_57367 = temp__5806__auto___57363;
datascript.storage.store.cljs$core$IFn$_invoke$arity$1(db);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"atom","atom",-397043653).cljs$core$IFn$_invoke$arity$1(conn),cljs.core.assoc,new cljs.core.Keyword(null,"db","db",993250759),db,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"tx-tail","tx-tail",1116487556),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"db-last-stored","db-last-stored",-2068760702),db], 0));
}

var seq__57058_57371 = cljs.core.seq(new cljs.core.Keyword(null,"listeners","listeners",394544445).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(new cljs.core.Keyword(null,"atom","atom",-397043653).cljs$core$IFn$_invoke$arity$1(conn))));
var chunk__57059_57372 = null;
var count__57060_57373 = (0);
var i__57061_57374 = (0);
while(true){
if((i__57061_57374 < count__57060_57373)){
var vec__57073_57375 = chunk__57059_57372.cljs$core$IIndexed$_nth$arity$2(null,i__57061_57374);
var __57376 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57073_57375,(0),null);
var callback_57377 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57073_57375,(1),null);
(callback_57377.cljs$core$IFn$_invoke$arity$1 ? callback_57377.cljs$core$IFn$_invoke$arity$1(report) : callback_57377.call(null,report));


var G__57379 = seq__57058_57371;
var G__57380 = chunk__57059_57372;
var G__57381 = count__57060_57373;
var G__57382 = (i__57061_57374 + (1));
seq__57058_57371 = G__57379;
chunk__57059_57372 = G__57380;
count__57060_57373 = G__57381;
i__57061_57374 = G__57382;
continue;
} else {
var temp__5804__auto___57383 = cljs.core.seq(seq__57058_57371);
if(temp__5804__auto___57383){
var seq__57058_57385__$1 = temp__5804__auto___57383;
if(cljs.core.chunked_seq_QMARK_(seq__57058_57385__$1)){
var c__5525__auto___57386 = cljs.core.chunk_first(seq__57058_57385__$1);
var G__57387 = cljs.core.chunk_rest(seq__57058_57385__$1);
var G__57388 = c__5525__auto___57386;
var G__57389 = cljs.core.count(c__5525__auto___57386);
var G__57390 = (0);
seq__57058_57371 = G__57387;
chunk__57059_57372 = G__57388;
count__57060_57373 = G__57389;
i__57061_57374 = G__57390;
continue;
} else {
var vec__57083_57391 = cljs.core.first(seq__57058_57385__$1);
var __57392 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57083_57391,(0),null);
var callback_57393 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__57083_57391,(1),null);
(callback_57393.cljs$core$IFn$_invoke$arity$1 ? callback_57393.cljs$core$IFn$_invoke$arity$1(report) : callback_57393.call(null,report));


var G__57395 = cljs.core.next(seq__57058_57385__$1);
var G__57396 = null;
var G__57397 = (0);
var G__57398 = (0);
seq__57058_57371 = G__57395;
chunk__57059_57372 = G__57396;
count__57060_57373 = G__57397;
i__57061_57374 = G__57398;
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
var temp__5808__auto___57400 = datascript.storage.storage(cljs.core.deref(conn));
if((temp__5808__auto___57400 == null)){
} else {
var storage_57401 = temp__5808__auto___57400;
datascript.storage.store_impl_BANG_(db,datascript.storage.storage_adapter(db),true);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"atom","atom",-397043653).cljs$core$IFn$_invoke$arity$1(conn),cljs.core.assoc,new cljs.core.Keyword(null,"tx-tail","tx-tail",1116487556),cljs.core.PersistentVector.EMPTY,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"db-last-stored","db-last-stored",-2068760702),db], 0));
}

return db;
});
datascript.conn.listen_BANG_ = (function datascript$conn$listen_BANG_(var_args){
var G__57099 = arguments.length;
switch (G__57099) {
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
