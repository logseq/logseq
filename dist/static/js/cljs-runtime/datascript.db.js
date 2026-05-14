goog.provide('datascript.db');
goog.scope(function(){
  datascript.db.goog$module$goog$array = goog.module.get('goog.array');
});
datascript.db.Exception = Error;

datascript.db.IllegalArgumentException = Error;

datascript.db.UnsupportedOperationException = Error;
datascript.db.e0 = (0);
datascript.db.tx0 = (536870912);
datascript.db.emax = (2147483647);
datascript.db.txmax = (2147483647);
datascript.db.implicit_schema = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","unique","db/unique",329396388),new cljs.core.Keyword("db.unique","identity","db.unique/identity",1675950722)], null)], null);
datascript.db.seqable_QMARK_ = (function datascript$db$seqable_QMARK_(x){
return (((!(typeof x === 'string'))) && (((cljs.core.seqable_QMARK_(x)) || (me.tonsky.persistent_sorted_set.arrays.array_QMARK_(x)))));
});
/**
 * Take the &env from a macro, and tell whether we are expanding into cljs.
 */
datascript.db.cljs_env_QMARK_ = (function datascript$db$cljs_env_QMARK_(env){
return cljs.core.boolean$(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env));
});
datascript.db.combine_hashes = (function datascript$db$combine_hashes(x,y){
return cljs.core.hash_combine(x,y);
});
datascript.db.hash_datom = (function datascript$db$hash_datom(d){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not implemented: (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.db.hash_datom),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [d], null))].join(''),cljs.core.PersistentArrayMap.EMPTY);
});
datascript.db.equiv_datom = (function datascript$db$equiv_datom(d,o){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not implemented: (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.db.equiv_datom),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [d,o], null))].join(''),cljs.core.PersistentArrayMap.EMPTY);
});
datascript.db.seq_datom = (function datascript$db$seq_datom(d){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not implemented: (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.db.seq_datom),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [d], null))].join(''),cljs.core.PersistentArrayMap.EMPTY);
});
datascript.db.nth_datom = (function datascript$db$nth_datom(var_args){
var G__52829 = arguments.length;
switch (G__52829) {
case 2:
return datascript.db.nth_datom.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.db.nth_datom.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.db.nth_datom.cljs$core$IFn$_invoke$arity$2 = (function (d,i){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not implemented: (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.db.nth_datom),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [d,i], null))].join(''),cljs.core.PersistentArrayMap.EMPTY);
}));

(datascript.db.nth_datom.cljs$core$IFn$_invoke$arity$3 = (function (d,i,not_found){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not implemented: (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.db.nth_datom),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [d,i,not_found], null))].join(''),cljs.core.PersistentArrayMap.EMPTY);
}));

(datascript.db.nth_datom.cljs$lang$maxFixedArity = 3);

datascript.db.assoc_datom = (function datascript$db$assoc_datom(d,k,v){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not implemented: (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.db.assoc_datom),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [d,k,v], null))].join(''),cljs.core.PersistentArrayMap.EMPTY);
});
datascript.db.val_at_datom = (function datascript$db$val_at_datom(d,k,not_found){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not implemented: (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.db.val_at_datom),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [d,k,not_found], null))].join(''),cljs.core.PersistentArrayMap.EMPTY);
});

/**
 * @interface
 */
datascript.db.IDatom = function(){};

var datascript$db$IDatom$datom_tx$dyn_54527 = (function (this$){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (datascript.db.datom_tx[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5351__auto__.call(null,this$));
} else {
var m__5349__auto__ = (datascript.db.datom_tx["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5349__auto__.call(null,this$));
} else {
throw cljs.core.missing_protocol("IDatom.datom-tx",this$);
}
}
});
datascript.db.datom_tx = (function datascript$db$datom_tx(this$){
if((((!((this$ == null)))) && ((!((this$.datascript$db$IDatom$datom_tx$arity$1 == null)))))){
return this$.datascript$db$IDatom$datom_tx$arity$1(this$);
} else {
return datascript$db$IDatom$datom_tx$dyn_54527(this$);
}
});

var datascript$db$IDatom$datom_added$dyn_54528 = (function (this$){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (datascript.db.datom_added[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5351__auto__.call(null,this$));
} else {
var m__5349__auto__ = (datascript.db.datom_added["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5349__auto__.call(null,this$));
} else {
throw cljs.core.missing_protocol("IDatom.datom-added",this$);
}
}
});
datascript.db.datom_added = (function datascript$db$datom_added(this$){
if((((!((this$ == null)))) && ((!((this$.datascript$db$IDatom$datom_added$arity$1 == null)))))){
return this$.datascript$db$IDatom$datom_added$arity$1(this$);
} else {
return datascript$db$IDatom$datom_added$dyn_54528(this$);
}
});

var datascript$db$IDatom$datom_get_idx$dyn_54529 = (function (this$){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (datascript.db.datom_get_idx[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5351__auto__.call(null,this$));
} else {
var m__5349__auto__ = (datascript.db.datom_get_idx["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5349__auto__.call(null,this$));
} else {
throw cljs.core.missing_protocol("IDatom.datom-get-idx",this$);
}
}
});
datascript.db.datom_get_idx = (function datascript$db$datom_get_idx(this$){
if((((!((this$ == null)))) && ((!((this$.datascript$db$IDatom$datom_get_idx$arity$1 == null)))))){
return this$.datascript$db$IDatom$datom_get_idx$arity$1(this$);
} else {
return datascript$db$IDatom$datom_get_idx$dyn_54529(this$);
}
});

var datascript$db$IDatom$datom_set_idx$dyn_54530 = (function (this$,value){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (datascript.db.datom_set_idx[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(this$,value) : m__5351__auto__.call(null,this$,value));
} else {
var m__5349__auto__ = (datascript.db.datom_set_idx["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(this$,value) : m__5349__auto__.call(null,this$,value));
} else {
throw cljs.core.missing_protocol("IDatom.datom-set-idx",this$);
}
}
});
datascript.db.datom_set_idx = (function datascript$db$datom_set_idx(this$,value){
if((((!((this$ == null)))) && ((!((this$.datascript$db$IDatom$datom_set_idx$arity$2 == null)))))){
return this$.datascript$db$IDatom$datom_set_idx$arity$2(this$,value);
} else {
return datascript$db$IDatom$datom_set_idx$dyn_54530(this$,value);
}
});


/**
* @constructor
 * @implements {cljs.core.IIndexed}
 * @implements {datascript.db.IDatom}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.ILookup}
*/
datascript.db.Datom = (function (e,a,v,tx,idx,_hash){
this.e = e;
this.a = a;
this.v = v;
this.tx = tx;
this.idx = idx;
this._hash = _hash;
this.cljs$lang$protocol_mask$partition0$ = 2162164496;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(datascript.db.Datom.prototype.datascript$db$IDatom$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.Datom.prototype.datascript$db$IDatom$datom_tx$arity$1 = (function (d){
var self__ = this;
var d__$1 = this;
if((self__.tx > (0))){
return self__.tx;
} else {
return (- self__.tx);
}
}));

(datascript.db.Datom.prototype.datascript$db$IDatom$datom_added$arity$1 = (function (d){
var self__ = this;
var d__$1 = this;
return (self__.tx > (0));
}));

(datascript.db.Datom.prototype.datascript$db$IDatom$datom_get_idx$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.idx;
}));

(datascript.db.Datom.prototype.datascript$db$IDatom$datom_set_idx$arity$2 = (function (_,value){
var self__ = this;
var ___$1 = this;
return (self__.idx = (value | (0)));
}));

(datascript.db.Datom.prototype.cljs$core$IHash$_hash$arity$1 = (function (d){
var self__ = this;
var d__$1 = this;
if((self__._hash === (0))){
return (self__._hash = datascript.db.hash_datom(d__$1));
} else {
return self__._hash;
}
}));

(datascript.db.Datom.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (d,o){
var self__ = this;
var d__$1 = this;
return (((o instanceof datascript.db.Datom)) && (datascript.db.equiv_datom(d__$1,o)));
}));

(datascript.db.Datom.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (d){
var self__ = this;
var d__$1 = this;
return datascript.db.seq_datom(d__$1);
}));

(datascript.db.Datom.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (d,k){
var self__ = this;
var d__$1 = this;
return datascript.db.val_at_datom(d__$1,k,null);
}));

(datascript.db.Datom.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (d,k,nf){
var self__ = this;
var d__$1 = this;
return datascript.db.val_at_datom(d__$1,k,nf);
}));

(datascript.db.Datom.prototype.cljs$core$IIndexed$_nth$arity$2 = (function (this$,i){
var self__ = this;
var this$__$1 = this;
return datascript.db.nth_datom.cljs$core$IFn$_invoke$arity$2(this$__$1,i);
}));

(datascript.db.Datom.prototype.cljs$core$IIndexed$_nth$arity$3 = (function (this$,i,not_found){
var self__ = this;
var this$__$1 = this;
return datascript.db.nth_datom.cljs$core$IFn$_invoke$arity$3(this$__$1,i,not_found);
}));

(datascript.db.Datom.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (d,k,v__$1){
var self__ = this;
var d__$1 = this;
return datascript.db.assoc_datom(d__$1,k,v__$1);
}));

(datascript.db.Datom.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (d,writer,opts){
var self__ = this;
var d__$1 = this;
return cljs.core.pr_sequential_writer(writer,cljs.core.pr_writer,"#datascript/Datom ["," ","]",opts,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [d__$1.e,d__$1.a,d__$1.v,d__$1.datascript$db$IDatom$datom_tx$arity$1(null),d__$1.datascript$db$IDatom$datom_added$arity$1(null)], null));
}));

(datascript.db.Datom.getBasis = (function (){
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.with_meta(new cljs.core.Symbol(null,"e","e",-1273166571,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"number","number",-1084057331,null)], null)),new cljs.core.Symbol(null,"a","a",-482876059,null),new cljs.core.Symbol(null,"v","v",1661996586,null),cljs.core.with_meta(new cljs.core.Symbol(null,"tx","tx",2107161945,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"number","number",-1084057331,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"idx","idx",-1600747296,null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"number","number",-1084057331,null),new cljs.core.Keyword(null,"mutable","mutable",875778266),true], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"_hash","_hash",-2130838312,null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"number","number",-1084057331,null),new cljs.core.Keyword(null,"mutable","mutable",875778266),true], null))], null);
}));

(datascript.db.Datom.cljs$lang$type = true);

(datascript.db.Datom.cljs$lang$ctorStr = "datascript.db/Datom");

(datascript.db.Datom.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"datascript.db/Datom");
}));

/**
 * Positional factory function for datascript.db/Datom.
 */
datascript.db.__GT_Datom = (function datascript$db$__GT_Datom(e,a,v,tx,idx,_hash){
return (new datascript.db.Datom(e,a,v,tx,idx,_hash));
});

goog.exportSymbol("datascript.db.Datom",datascript.db.Datom);
datascript.db.datom = (function datascript$db$datom(var_args){
var G__52893 = arguments.length;
switch (G__52893) {
case 3:
return datascript.db.datom.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return datascript.db.datom.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return datascript.db.datom.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.db.datom.cljs$core$IFn$_invoke$arity$3 = (function (e,a,v){
return (new datascript.db.Datom(e,a,v,(536870912),(0),(0)));
}));

(datascript.db.datom.cljs$core$IFn$_invoke$arity$4 = (function (e,a,v,tx){
return (new datascript.db.Datom(e,a,v,tx,(0),(0)));
}));

(datascript.db.datom.cljs$core$IFn$_invoke$arity$5 = (function (e,a,v,tx,added){
return (new datascript.db.Datom(e,a,v,(cljs.core.truth_(added)?tx:(- tx)),(0),(0)));
}));

(datascript.db.datom.cljs$lang$maxFixedArity = 5);

datascript.db.datom_QMARK_ = (function datascript$db$datom_QMARK_(x){
return (x instanceof datascript.db.Datom);
});
datascript.db.hash_datom = (function datascript$db$hash_datom(d){
return null;
});

datascript.db.hash_datom = (function datascript$db$hash_datom(d){
return datascript.db.combine_hashes(datascript.db.combine_hashes(cljs.core.hash(d.e),cljs.core.hash(d.a)),cljs.core.hash(d.v));
});
datascript.db.equiv_datom = (function datascript$db$equiv_datom(d,o){
return null;
});

datascript.db.equiv_datom = (function datascript$db$equiv_datom(d,o){
return (((d.e === o.e)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(d.a,o.a)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(d.v,o.v)))));
});
datascript.db.seq_datom = (function datascript$db$seq_datom(d){
return null;
});

datascript.db.seq_datom = (function datascript$db$seq_datom(d){
return (new cljs.core.List(null,d.e,(new cljs.core.List(null,d.a,(new cljs.core.List(null,d.v,(new cljs.core.List(null,d.datascript$db$IDatom$datom_tx$arity$1(null),(new cljs.core.List(null,d.datascript$db$IDatom$datom_added$arity$1(null),null,(1),null)),(2),null)),(3),null)),(4),null)),(5),null));
});
datascript.db.val_at_datom = (function datascript$db$val_at_datom(d,k,not_found){
return null;
});

datascript.db.val_at_datom = (function datascript$db$val_at_datom(d,k,not_found){
if((k instanceof cljs.core.Keyword)){
var G__52909 = k;
var G__52909__$1 = (((G__52909 instanceof cljs.core.Keyword))?G__52909.fqn:null);
switch (G__52909__$1) {
case "e":
return d.e;

break;
case "a":
return d.a;

break;
case "v":
return d.v;

break;
case "tx":
return d.datascript$db$IDatom$datom_tx$arity$1(null);

break;
case "added":
return d.datascript$db$IDatom$datom_added$arity$1(null);

break;
default:
return not_found;

}
} else {
if(typeof k === 'string'){
var G__52911 = k;
switch (G__52911) {
case "e":
return d.e;

break;
case "a":
return d.a;

break;
case "v":
return d.v;

break;
case "tx":
return d.datascript$db$IDatom$datom_tx$arity$1(null);

break;
case "added":
return d.datascript$db$IDatom$datom_added$arity$1(null);

break;
default:
return not_found;

}
} else {
return not_found;

}
}
});
datascript.db.nth_datom = (function datascript$db$nth_datom(var_args){
var G__52915 = arguments.length;
switch (G__52915) {
case 2:
return datascript.db.nth_datom.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.db.nth_datom.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.db.nth_datom.cljs$core$IFn$_invoke$arity$2 = (function (d,i){
return null;
}));

(datascript.db.nth_datom.cljs$core$IFn$_invoke$arity$3 = (function (d,i,not_found){
return null;
}));

(datascript.db.nth_datom.cljs$lang$maxFixedArity = 3);


datascript.db.nth_datom = (function datascript$db$nth_datom(var_args){
var G__52924 = arguments.length;
switch (G__52924) {
case 2:
return datascript.db.nth_datom.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.db.nth_datom.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.db.nth_datom.cljs$core$IFn$_invoke$arity$2 = (function (d,i){
var G__52929 = i;
switch (G__52929) {
case (0):
return d.e;

break;
case (1):
return d.a;

break;
case (2):
return d.v;

break;
case (3):
return d.datascript$db$IDatom$datom_tx$arity$1(null);

break;
case (4):
return d.datascript$db$IDatom$datom_added$arity$1(null);

break;
default:
throw (new Error(["Datom/-nth: Index out of bounds: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(i)].join('')));

}
}));

(datascript.db.nth_datom.cljs$core$IFn$_invoke$arity$3 = (function (d,i,not_found){
var G__52934 = i;
switch (G__52934) {
case (0):
return d.e;

break;
case (1):
return d.a;

break;
case (2):
return d.v;

break;
case (3):
return d.datascript$db$IDatom$datom_tx$arity$1(null);

break;
case (4):
return d.datascript$db$IDatom$datom_added$arity$1(null);

break;
default:
return not_found;

}
}));

(datascript.db.nth_datom.cljs$lang$maxFixedArity = 3);

datascript.db.assoc_datom = (function datascript$db$assoc_datom(d,k,v){
return null;
});

datascript.db.assoc_datom = (function datascript$db$assoc_datom(d,k,v){
var G__52935 = k;
var G__52935__$1 = (((G__52935 instanceof cljs.core.Keyword))?G__52935.fqn:null);
switch (G__52935__$1) {
case "e":
return datascript.db.datom.cljs$core$IFn$_invoke$arity$5(v,d.a,d.v,d.datascript$db$IDatom$datom_tx$arity$1(null),d.datascript$db$IDatom$datom_added$arity$1(null));

break;
case "a":
return datascript.db.datom.cljs$core$IFn$_invoke$arity$5(d.e,v,d.v,d.datascript$db$IDatom$datom_tx$arity$1(null),d.datascript$db$IDatom$datom_added$arity$1(null));

break;
case "v":
return datascript.db.datom.cljs$core$IFn$_invoke$arity$5(d.e,d.a,v,d.datascript$db$IDatom$datom_tx$arity$1(null),d.datascript$db$IDatom$datom_added$arity$1(null));

break;
case "tx":
return datascript.db.datom.cljs$core$IFn$_invoke$arity$5(d.e,d.a,d.v,v,d.datascript$db$IDatom$datom_added$arity$1(null));

break;
case "added":
return datascript.db.datom.cljs$core$IFn$_invoke$arity$5(d.e,d.a,d.v,d.datascript$db$IDatom$datom_tx$arity$1(null),v);

break;
default:
throw (new datascript.db.IllegalArgumentException(["invalid key for #datascript/Datom: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(k)].join('')));

}
});
datascript.db.datom_from_reader = (function datascript$db$datom_from_reader(vec){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(datascript.db.datom,vec);
});
datascript.db.cmp = (function datascript$db$cmp(x,y){
if((x == null)){
return (0);
} else {
if((y == null)){
return (0);
} else {
return cljs.core.long$(cljs.core.compare(x,y));
}
}
});
datascript.db.class_identical_QMARK_ = (function datascript$db$class_identical_QMARK_(x,y){
return (cljs.core.type(x) === cljs.core.type(y));
});
datascript.db.class_compare = (function datascript$db$class_compare(x,y){
return datascript.db.goog$module$goog$array.defaultCompare(cljs.core.type__GT_str(cljs.core.type(x)),cljs.core.type__GT_str(cljs.core.type(y)));
});
datascript.db.ihash = (function datascript$db$ihash(x){
return cljs.core.hash(x);
});
datascript.db.value_compare = (function datascript$db$value_compare(x,y){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not implemented: (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.db.value_compare),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [x,y], null))].join(''),cljs.core.PersistentArrayMap.EMPTY);
});
datascript.db.seq_compare = (function datascript$db$seq_compare(xs,ys){
var cx = cljs.core.count(xs);
var cy = cljs.core.count(ys);
if((cx < cy)){
return (-1);
} else {
if((cx > cy)){
return (1);
} else {
var xs__$1 = xs;
var ys__$1 = ys;
while(true){
if(cljs.core.empty_QMARK_(xs__$1)){
return (0);
} else {
var x = cljs.core.first(xs__$1);
var y = cljs.core.first(ys__$1);
if((((x == null)) && ((y == null)))){
var G__54543 = cljs.core.next(xs__$1);
var G__54544 = cljs.core.next(ys__$1);
xs__$1 = G__54543;
ys__$1 = G__54544;
continue;
} else {
if((x == null)){
return (-1);
} else {
if((y == null)){
return (1);
} else {
var v = datascript.db.value_compare(x,y);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,(0))){
var G__54546 = cljs.core.next(xs__$1);
var G__54547 = cljs.core.next(ys__$1);
xs__$1 = G__54546;
ys__$1 = G__54547;
continue;
} else {
return v;
}

}
}
}
}
break;
}

}
}
});
datascript.db.value_compare = (function datascript$db$value_compare(x,y){
return null;
});

datascript.db.value_compare = (function datascript$db$value_compare(x,y){
try{if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(x,y)){
return (0);
} else {
if(((cljs.core.sequential_QMARK_(x)) && (cljs.core.sequential_QMARK_(y)))){
return datascript.db.seq_compare(x,y);
} else {
if((((!((x == null))))?(((((x.cljs$lang$protocol_mask$partition1$ & (2048))) || ((cljs.core.PROTOCOL_SENTINEL === x.cljs$core$IComparable$))))?true:(((!x.cljs$lang$protocol_mask$partition1$))?cljs.core.native_satisfies_QMARK_(cljs.core.IComparable,x):false)):cljs.core.native_satisfies_QMARK_(cljs.core.IComparable,x))){
return cljs.core._compare(x,y);
} else {
if((!(datascript.db.class_identical_QMARK_(x,y)))){
return datascript.db.class_compare(x,y);
} else {
if(((typeof x === 'number') || (((typeof x === 'string') || (((cljs.core.array_QMARK_(x)) || (((x === true) || (x === false))))))))){
return datascript.db.goog$module$goog$array.defaultCompare(x,y);
} else {
return (datascript.db.ihash(x) - datascript.db.ihash(y));

}
}
}
}
}
}catch (e53051){if((e53051 instanceof Error)){
var e = e53051;
if((!(datascript.db.class_identical_QMARK_(x,y)))){
return datascript.db.class_compare(x,y);
} else {
throw e;
}
} else {
throw e53051;

}
}});
datascript.db.value_cmp = (function datascript$db$value_cmp(x,y){
if((x == null)){
return (0);
} else {
if((y == null)){
return (0);
} else {
return datascript.db.value_compare(x,y);
}
}
});
datascript.db.cmp_datoms_eavt = (function datascript$db$cmp_datoms_eavt(d1,d2){
var c__51391__auto__ = (d1.e - d2.e);
if(((0) === c__51391__auto__)){
var c__51391__auto____$1 = datascript.db.cmp(d1.a,d2.a);
if(((0) === c__51391__auto____$1)){
var c__51391__auto____$2 = datascript.db.value_cmp(d1.v,d2.v);
if(((0) === c__51391__auto____$2)){
var c__51391__auto____$3 = (d1.datascript$db$IDatom$datom_tx$arity$1(null) - d2.datascript$db$IDatom$datom_tx$arity$1(null));
if(((0) === c__51391__auto____$3)){
return (0);
} else {
return c__51391__auto____$3;
}
} else {
return c__51391__auto____$2;
}
} else {
return c__51391__auto____$1;
}
} else {
return c__51391__auto__;
}
});
datascript.db.cmp_datoms_aevt = (function datascript$db$cmp_datoms_aevt(d1,d2){
var c__51391__auto__ = datascript.db.cmp(d1.a,d2.a);
if(((0) === c__51391__auto__)){
var c__51391__auto____$1 = (d1.e - d2.e);
if(((0) === c__51391__auto____$1)){
var c__51391__auto____$2 = datascript.db.value_cmp(d1.v,d2.v);
if(((0) === c__51391__auto____$2)){
var c__51391__auto____$3 = (d1.datascript$db$IDatom$datom_tx$arity$1(null) - d2.datascript$db$IDatom$datom_tx$arity$1(null));
if(((0) === c__51391__auto____$3)){
return (0);
} else {
return c__51391__auto____$3;
}
} else {
return c__51391__auto____$2;
}
} else {
return c__51391__auto____$1;
}
} else {
return c__51391__auto__;
}
});
datascript.db.cmp_datoms_avet = (function datascript$db$cmp_datoms_avet(d1,d2){
var c__51391__auto__ = datascript.db.cmp(d1.a,d2.a);
if(((0) === c__51391__auto__)){
var c__51391__auto____$1 = datascript.db.value_cmp(d1.v,d2.v);
if(((0) === c__51391__auto____$1)){
var c__51391__auto____$2 = (d1.e - d2.e);
if(((0) === c__51391__auto____$2)){
var c__51391__auto____$3 = (d1.datascript$db$IDatom$datom_tx$arity$1(null) - d2.datascript$db$IDatom$datom_tx$arity$1(null));
if(((0) === c__51391__auto____$3)){
return (0);
} else {
return c__51391__auto____$3;
}
} else {
return c__51391__auto____$2;
}
} else {
return c__51391__auto____$1;
}
} else {
return c__51391__auto__;
}
});
datascript.db.cmp_attr_quick = (function datascript$db$cmp_attr_quick(a1,a2){
if((a1 instanceof cljs.core.Keyword)){
return cljs.core._compare(a1,a2);
} else {
return datascript.db.goog$module$goog$array.defaultCompare(a1,a2);
}
});
datascript.db.cmp_datoms_eav_quick = (function datascript$db$cmp_datoms_eav_quick(d1,d2){
var c__51391__auto__ = (d1.e - d2.e);
if(((0) === c__51391__auto__)){
var c__51391__auto____$1 = datascript.db.cmp_attr_quick(d1.a,d2.a);
if(((0) === c__51391__auto____$1)){
var c__51391__auto____$2 = datascript.db.value_compare(d1.v,d2.v);
if(((0) === c__51391__auto____$2)){
return (0);
} else {
return c__51391__auto____$2;
}
} else {
return c__51391__auto____$1;
}
} else {
return c__51391__auto__;
}
});
datascript.db.cmp_datoms_eavt_quick = (function datascript$db$cmp_datoms_eavt_quick(d1,d2){
var c__51391__auto__ = (d1.e - d2.e);
if(((0) === c__51391__auto__)){
var c__51391__auto____$1 = datascript.db.cmp_attr_quick(d1.a,d2.a);
if(((0) === c__51391__auto____$1)){
var c__51391__auto____$2 = datascript.db.value_compare(d1.v,d2.v);
if(((0) === c__51391__auto____$2)){
var c__51391__auto____$3 = (d1.datascript$db$IDatom$datom_tx$arity$1(null) - d2.datascript$db$IDatom$datom_tx$arity$1(null));
if(((0) === c__51391__auto____$3)){
return (0);
} else {
return c__51391__auto____$3;
}
} else {
return c__51391__auto____$2;
}
} else {
return c__51391__auto____$1;
}
} else {
return c__51391__auto__;
}
});
datascript.db.cmp_datoms_aevt_quick = (function datascript$db$cmp_datoms_aevt_quick(d1,d2){
var c__51391__auto__ = datascript.db.cmp_attr_quick(d1.a,d2.a);
if(((0) === c__51391__auto__)){
var c__51391__auto____$1 = (d1.e - d2.e);
if(((0) === c__51391__auto____$1)){
var c__51391__auto____$2 = datascript.db.value_compare(d1.v,d2.v);
if(((0) === c__51391__auto____$2)){
var c__51391__auto____$3 = (d1.datascript$db$IDatom$datom_tx$arity$1(null) - d2.datascript$db$IDatom$datom_tx$arity$1(null));
if(((0) === c__51391__auto____$3)){
return (0);
} else {
return c__51391__auto____$3;
}
} else {
return c__51391__auto____$2;
}
} else {
return c__51391__auto____$1;
}
} else {
return c__51391__auto__;
}
});
datascript.db.cmp_datoms_avet_quick = (function datascript$db$cmp_datoms_avet_quick(d1,d2){
var c__51391__auto__ = datascript.db.cmp_attr_quick(d1.a,d2.a);
if(((0) === c__51391__auto__)){
var c__51391__auto____$1 = datascript.db.value_compare(d1.v,d2.v);
if(((0) === c__51391__auto____$1)){
var c__51391__auto____$2 = (d1.e - d2.e);
if(((0) === c__51391__auto____$2)){
var c__51391__auto____$3 = (d1.datascript$db$IDatom$datom_tx$arity$1(null) - d2.datascript$db$IDatom$datom_tx$arity$1(null));
if(((0) === c__51391__auto____$3)){
return (0);
} else {
return c__51391__auto____$3;
}
} else {
return c__51391__auto____$2;
}
} else {
return c__51391__auto____$1;
}
} else {
return c__51391__auto__;
}
});
datascript.db.diff_sorted = (function datascript$db$diff_sorted(a,b,cmp){
var only_a = cljs.core.PersistentVector.EMPTY;
var only_b = cljs.core.PersistentVector.EMPTY;
var both = cljs.core.PersistentVector.EMPTY;
var a__$1 = a;
var b__$1 = b;
while(true){
if(cljs.core.empty_QMARK_(a__$1)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.not_empty(only_a),cljs.core.not_empty(cljs.core.into.cljs$core$IFn$_invoke$arity$2(only_b,b__$1)),cljs.core.not_empty(both)], null);
} else {
if(cljs.core.empty_QMARK_(b__$1)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.not_empty(cljs.core.into.cljs$core$IFn$_invoke$arity$2(only_a,a__$1)),cljs.core.not_empty(only_b),cljs.core.not_empty(both)], null);
} else {
var first_a = cljs.core.first(a__$1);
var first_b = cljs.core.first(b__$1);
var diff = (function (){try{return (cmp.cljs$core$IFn$_invoke$arity$2 ? cmp.cljs$core$IFn$_invoke$arity$2(first_a,first_b) : cmp.call(null,first_a,first_b));
}catch (e53169){if((e53169 instanceof Error)){
var _ = e53169;
return new cljs.core.Keyword(null,"incomparable","incomparable",1634329662);
} else {
throw e53169;

}
}})();
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(diff,new cljs.core.Keyword(null,"incomparable","incomparable",1634329662))){
var G__54559 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(only_a,first_a);
var G__54560 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(only_b,first_b);
var G__54561 = both;
var G__54562 = cljs.core.next(a__$1);
var G__54563 = cljs.core.next(b__$1);
only_a = G__54559;
only_b = G__54560;
both = G__54561;
a__$1 = G__54562;
b__$1 = G__54563;
continue;
} else {
if((diff === (0))){
var G__54567 = only_a;
var G__54568 = only_b;
var G__54569 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(both,first_a);
var G__54570 = cljs.core.next(a__$1);
var G__54571 = cljs.core.next(b__$1);
only_a = G__54567;
only_b = G__54568;
both = G__54569;
a__$1 = G__54570;
b__$1 = G__54571;
continue;
} else {
if((diff < (0))){
var G__54572 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(only_a,first_a);
var G__54573 = only_b;
var G__54574 = both;
var G__54575 = cljs.core.next(a__$1);
var G__54576 = b__$1;
only_a = G__54572;
only_b = G__54573;
both = G__54574;
a__$1 = G__54575;
b__$1 = G__54576;
continue;
} else {
if((diff > (0))){
var G__54577 = only_a;
var G__54578 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(only_b,first_b);
var G__54579 = both;
var G__54580 = a__$1;
var G__54581 = cljs.core.next(b__$1);
only_a = G__54577;
only_b = G__54578;
both = G__54579;
a__$1 = G__54580;
b__$1 = G__54581;
continue;
} else {
return null;
}
}
}
}

}
}
break;
}
});
datascript.db.hash_db = (function datascript$db$hash_db(db){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not implemented: (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.db.hash_db),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [db], null))].join(''),cljs.core.PersistentArrayMap.EMPTY);
});
datascript.db.hash_fdb = (function datascript$db$hash_fdb(db){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not implemented: (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.db.hash_fdb),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [db], null))].join(''),cljs.core.PersistentArrayMap.EMPTY);
});
datascript.db.equiv_db = (function datascript$db$equiv_db(db,other){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not implemented: (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.db.equiv_db),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [db,other], null))].join(''),cljs.core.PersistentArrayMap.EMPTY);
});
datascript.db.restore_db = (function datascript$db$restore_db(keys){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not implemented: (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.db.restore_db),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [keys], null))].join(''),cljs.core.PersistentArrayMap.EMPTY);
});
datascript.db.indexing_QMARK_ = (function datascript$db$indexing_QMARK_(db,attr){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not implemented: (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.db.indexing_QMARK_),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [db,attr], null))].join(''),cljs.core.PersistentArrayMap.EMPTY);
});
datascript.db.pr_db = (function datascript$db$pr_db(db,w,opts){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not implemented: (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.db.pr_db),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [db,w,opts], null))].join(''),cljs.core.PersistentArrayMap.EMPTY);
});
datascript.db.resolve_datom = (function datascript$db$resolve_datom(db,e,a,v,t,default_e,default_tx){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not implemented: (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.db.resolve_datom),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [db,e,a,v,t,default_e,default_tx], null))].join(''),cljs.core.PersistentArrayMap.EMPTY);
});
datascript.db.components__GT_pattern = (function datascript$db$components__GT_pattern(db,index,c0,c1,c2,c3,default_e,default_tx){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not implemented: (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.db.components__GT_pattern),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [db,index,c0,c1,c2,c3,default_e,default_tx], null))].join(''),cljs.core.PersistentArrayMap.EMPTY);
});

/**
 * @interface
 */
datascript.db.ISearch = function(){};

var datascript$db$ISearch$_search$dyn_54583 = (function (data,pattern){
var x__5350__auto__ = (((data == null))?null:data);
var m__5351__auto__ = (datascript.db._search[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(data,pattern) : m__5351__auto__.call(null,data,pattern));
} else {
var m__5349__auto__ = (datascript.db._search["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(data,pattern) : m__5349__auto__.call(null,data,pattern));
} else {
throw cljs.core.missing_protocol("ISearch.-search",data);
}
}
});
datascript.db._search = (function datascript$db$_search(data,pattern){
if((((!((data == null)))) && ((!((data.datascript$db$ISearch$_search$arity$2 == null)))))){
return data.datascript$db$ISearch$_search$arity$2(data,pattern);
} else {
return datascript$db$ISearch$_search$dyn_54583(data,pattern);
}
});

datascript.db.fsearch = (function datascript$db$fsearch(data,pattern){
return cljs.core.first(datascript.db._search(data,pattern));
});

/**
 * @interface
 */
datascript.db.IIndexAccess = function(){};

var datascript$db$IIndexAccess$_datoms$dyn_54584 = (function (db,index,c0,c1,c2,c3){
var x__5350__auto__ = (((db == null))?null:db);
var m__5351__auto__ = (datascript.db._datoms[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$6 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$6(db,index,c0,c1,c2,c3) : m__5351__auto__.call(null,db,index,c0,c1,c2,c3));
} else {
var m__5349__auto__ = (datascript.db._datoms["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$6 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$6(db,index,c0,c1,c2,c3) : m__5349__auto__.call(null,db,index,c0,c1,c2,c3));
} else {
throw cljs.core.missing_protocol("IIndexAccess.-datoms",db);
}
}
});
datascript.db._datoms = (function datascript$db$_datoms(db,index,c0,c1,c2,c3){
if((((!((db == null)))) && ((!((db.datascript$db$IIndexAccess$_datoms$arity$6 == null)))))){
return db.datascript$db$IIndexAccess$_datoms$arity$6(db,index,c0,c1,c2,c3);
} else {
return datascript$db$IIndexAccess$_datoms$dyn_54584(db,index,c0,c1,c2,c3);
}
});

var datascript$db$IIndexAccess$_seek_datoms$dyn_54585 = (function (db,index,c0,c1,c2,c3){
var x__5350__auto__ = (((db == null))?null:db);
var m__5351__auto__ = (datascript.db._seek_datoms[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$6 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$6(db,index,c0,c1,c2,c3) : m__5351__auto__.call(null,db,index,c0,c1,c2,c3));
} else {
var m__5349__auto__ = (datascript.db._seek_datoms["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$6 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$6(db,index,c0,c1,c2,c3) : m__5349__auto__.call(null,db,index,c0,c1,c2,c3));
} else {
throw cljs.core.missing_protocol("IIndexAccess.-seek-datoms",db);
}
}
});
datascript.db._seek_datoms = (function datascript$db$_seek_datoms(db,index,c0,c1,c2,c3){
if((((!((db == null)))) && ((!((db.datascript$db$IIndexAccess$_seek_datoms$arity$6 == null)))))){
return db.datascript$db$IIndexAccess$_seek_datoms$arity$6(db,index,c0,c1,c2,c3);
} else {
return datascript$db$IIndexAccess$_seek_datoms$dyn_54585(db,index,c0,c1,c2,c3);
}
});

var datascript$db$IIndexAccess$_rseek_datoms$dyn_54588 = (function (db,index,c0,c1,c2,c3){
var x__5350__auto__ = (((db == null))?null:db);
var m__5351__auto__ = (datascript.db._rseek_datoms[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$6 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$6(db,index,c0,c1,c2,c3) : m__5351__auto__.call(null,db,index,c0,c1,c2,c3));
} else {
var m__5349__auto__ = (datascript.db._rseek_datoms["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$6 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$6(db,index,c0,c1,c2,c3) : m__5349__auto__.call(null,db,index,c0,c1,c2,c3));
} else {
throw cljs.core.missing_protocol("IIndexAccess.-rseek-datoms",db);
}
}
});
datascript.db._rseek_datoms = (function datascript$db$_rseek_datoms(db,index,c0,c1,c2,c3){
if((((!((db == null)))) && ((!((db.datascript$db$IIndexAccess$_rseek_datoms$arity$6 == null)))))){
return db.datascript$db$IIndexAccess$_rseek_datoms$arity$6(db,index,c0,c1,c2,c3);
} else {
return datascript$db$IIndexAccess$_rseek_datoms$dyn_54588(db,index,c0,c1,c2,c3);
}
});

var datascript$db$IIndexAccess$_index_range$dyn_54590 = (function (db,attr,start,end){
var x__5350__auto__ = (((db == null))?null:db);
var m__5351__auto__ = (datascript.db._index_range[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$4 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$4(db,attr,start,end) : m__5351__auto__.call(null,db,attr,start,end));
} else {
var m__5349__auto__ = (datascript.db._index_range["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$4 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$4(db,attr,start,end) : m__5349__auto__.call(null,db,attr,start,end));
} else {
throw cljs.core.missing_protocol("IIndexAccess.-index-range",db);
}
}
});
datascript.db._index_range = (function datascript$db$_index_range(db,attr,start,end){
if((((!((db == null)))) && ((!((db.datascript$db$IIndexAccess$_index_range$arity$4 == null)))))){
return db.datascript$db$IIndexAccess$_index_range$arity$4(db,attr,start,end);
} else {
return datascript$db$IIndexAccess$_index_range$dyn_54590(db,attr,start,end);
}
});

datascript.db.validate_indexed = (function datascript$db$validate_indexed(db,index,c0,c1,c2,c3){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(index,new cljs.core.Keyword(null,"avet","avet",1383857032))){
var temp__5808__auto__ = c0;
if((temp__5808__auto__ == null)){
return null;
} else {
var attr = temp__5808__auto__;
if(datascript.db.indexing_QMARK_(db,attr)){
return null;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Attribute ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attr], 0))," should be marked as :db/index true"].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"index-access","index-access",-1548960265),new cljs.core.Keyword(null,"index","index",-1531685915),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword(null,"components","components",-1073188942),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [c0,c1,c2,c3], null)], null));
}
}
} else {
return null;
}
});

/**
 * @interface
 */
datascript.db.IDB = function(){};

var datascript$db$IDB$_schema$dyn_54598 = (function (db){
var x__5350__auto__ = (((db == null))?null:db);
var m__5351__auto__ = (datascript.db._schema[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(db) : m__5351__auto__.call(null,db));
} else {
var m__5349__auto__ = (datascript.db._schema["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(db) : m__5349__auto__.call(null,db));
} else {
throw cljs.core.missing_protocol("IDB.-schema",db);
}
}
});
datascript.db._schema = (function datascript$db$_schema(db){
if((((!((db == null)))) && ((!((db.datascript$db$IDB$_schema$arity$1 == null)))))){
return db.datascript$db$IDB$_schema$arity$1(db);
} else {
return datascript$db$IDB$_schema$dyn_54598(db);
}
});

var datascript$db$IDB$_attrs_by$dyn_54603 = (function (db,property){
var x__5350__auto__ = (((db == null))?null:db);
var m__5351__auto__ = (datascript.db._attrs_by[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(db,property) : m__5351__auto__.call(null,db,property));
} else {
var m__5349__auto__ = (datascript.db._attrs_by["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(db,property) : m__5349__auto__.call(null,db,property));
} else {
throw cljs.core.missing_protocol("IDB.-attrs-by",db);
}
}
});
datascript.db._attrs_by = (function datascript$db$_attrs_by(db,property){
if((((!((db == null)))) && ((!((db.datascript$db$IDB$_attrs_by$arity$2 == null)))))){
return db.datascript$db$IDB$_attrs_by$arity$2(db,property);
} else {
return datascript$db$IDB$_attrs_by$dyn_54603(db,property);
}
});

datascript.db.db_transient = (function datascript$db$db_transient(db){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),cljs.core.transient$),new cljs.core.Keyword(null,"aevt","aevt",-585148059),cljs.core.transient$),new cljs.core.Keyword(null,"avet","avet",1383857032),cljs.core.transient$);
});
datascript.db.db_persistent_BANG_ = (function datascript$db$db_persistent_BANG_(db){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),cljs.core.persistent_BANG_),new cljs.core.Keyword(null,"aevt","aevt",-585148059),cljs.core.persistent_BANG_),new cljs.core.Keyword(null,"avet","avet",1383857032),cljs.core.persistent_BANG_);
});

/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {cljs.core.IKVReduce}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.ICloneable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
datascript.db.DB = (function (schema,eavt,aevt,avet,max_eid,max_tx,rschema,pull_patterns,pull_attrs,hash,__meta,__extmap,__hash){
this.schema = schema;
this.eavt = eavt;
this.aevt = aevt;
this.avet = avet;
this.max_eid = max_eid;
this.max_tx = max_tx;
this.rschema = rschema;
this.pull_patterns = pull_patterns;
this.pull_attrs = pull_attrs;
this.hash = hash;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(datascript.db.DB.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(datascript.db.DB.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k53309,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__53319 = k53309;
var G__53319__$1 = (((G__53319 instanceof cljs.core.Keyword))?G__53319.fqn:null);
switch (G__53319__$1) {
case "schema":
return self__.schema;

break;
case "eavt":
return self__.eavt;

break;
case "aevt":
return self__.aevt;

break;
case "avet":
return self__.avet;

break;
case "max-eid":
return self__.max_eid;

break;
case "max-tx":
return self__.max_tx;

break;
case "rschema":
return self__.rschema;

break;
case "pull-patterns":
return self__.pull_patterns;

break;
case "pull-attrs":
return self__.pull_attrs;

break;
case "hash":
return self__.hash;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k53309,else__5303__auto__);

}
}));

(datascript.db.DB.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__53320){
var vec__53321 = p__53320;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__53321,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__53321,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(datascript.db.DB.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#datascript.db.DB{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"schema","schema",-1582001791),self__.schema],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"eavt","eavt",-666437073),self__.eavt],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"aevt","aevt",-585148059),self__.aevt],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"avet","avet",1383857032),self__.avet],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"max-eid","max-eid",2134868075),self__.max_eid],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"max-tx","max-tx",1119558339),self__.max_tx],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"rschema","rschema",-1196134054),self__.rschema],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"pull-patterns","pull-patterns",-343695048),self__.pull_patterns],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"pull-attrs","pull-attrs",-974863177),self__.pull_attrs],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"hash","hash",-13781596),self__.hash],null))], null),self__.__extmap));
}));

(datascript.db.DB.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__53308){
var self__ = this;
var G__53308__$1 = this;
return (new cljs.core.RecordIter((0),G__53308__$1,10,new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"schema","schema",-1582001791),new cljs.core.Keyword(null,"eavt","eavt",-666437073),new cljs.core.Keyword(null,"aevt","aevt",-585148059),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword(null,"max-eid","max-eid",2134868075),new cljs.core.Keyword(null,"max-tx","max-tx",1119558339),new cljs.core.Keyword(null,"rschema","rschema",-1196134054),new cljs.core.Keyword(null,"pull-patterns","pull-patterns",-343695048),new cljs.core.Keyword(null,"pull-attrs","pull-attrs",-974863177),new cljs.core.Keyword(null,"hash","hash",-13781596)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(datascript.db.DB.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(datascript.db.DB.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new datascript.db.DB(self__.schema,self__.eavt,self__.aevt,self__.avet,self__.max_eid,self__.max_tx,self__.rschema,self__.pull_patterns,self__.pull_attrs,self__.hash,self__.__meta,self__.__extmap,self__.__hash));
}));

(datascript.db.DB.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (10 + cljs.core.count(self__.__extmap));
}));

(datascript.db.DB.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (-1515640948 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(datascript.db.DB.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this53310,other53311){
var self__ = this;
var this53310__$1 = this;
return (((!((other53311 == null)))) && ((((this53310__$1.constructor === other53311.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this53310__$1.schema,other53311.schema)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this53310__$1.eavt,other53311.eavt)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this53310__$1.aevt,other53311.aevt)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this53310__$1.avet,other53311.avet)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this53310__$1.max_eid,other53311.max_eid)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this53310__$1.max_tx,other53311.max_tx)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this53310__$1.rschema,other53311.rschema)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this53310__$1.pull_patterns,other53311.pull_patterns)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this53310__$1.pull_attrs,other53311.pull_attrs)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this53310__$1.hash,other53311.hash)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this53310__$1.__extmap,other53311.__extmap)))))))))))))))))))))))));
}));

(datascript.db.DB.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 10, [new cljs.core.Keyword(null,"schema","schema",-1582001791),null,new cljs.core.Keyword(null,"max-tx","max-tx",1119558339),null,new cljs.core.Keyword(null,"hash","hash",-13781596),null,new cljs.core.Keyword(null,"aevt","aevt",-585148059),null,new cljs.core.Keyword(null,"avet","avet",1383857032),null,new cljs.core.Keyword(null,"max-eid","max-eid",2134868075),null,new cljs.core.Keyword(null,"eavt","eavt",-666437073),null,new cljs.core.Keyword(null,"pull-attrs","pull-attrs",-974863177),null,new cljs.core.Keyword(null,"pull-patterns","pull-patterns",-343695048),null,new cljs.core.Keyword(null,"rschema","rschema",-1196134054),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new datascript.db.DB(self__.schema,self__.eavt,self__.aevt,self__.avet,self__.max_eid,self__.max_tx,self__.rschema,self__.pull_patterns,self__.pull_attrs,self__.hash,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(datascript.db.DB.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k53309){
var self__ = this;
var this__5307__auto____$1 = this;
var G__53331 = k53309;
var G__53331__$1 = (((G__53331 instanceof cljs.core.Keyword))?G__53331.fqn:null);
switch (G__53331__$1) {
case "schema":
case "eavt":
case "aevt":
case "avet":
case "max-eid":
case "max-tx":
case "rschema":
case "pull-patterns":
case "pull-attrs":
case "hash":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k53309);

}
}));

(datascript.db.DB.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__53308){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__53332 = cljs.core.keyword_identical_QMARK_;
var expr__53333 = k__5309__auto__;
if(cljs.core.truth_((pred__53332.cljs$core$IFn$_invoke$arity$2 ? pred__53332.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"schema","schema",-1582001791),expr__53333) : pred__53332.call(null,new cljs.core.Keyword(null,"schema","schema",-1582001791),expr__53333)))){
return (new datascript.db.DB(G__53308,self__.eavt,self__.aevt,self__.avet,self__.max_eid,self__.max_tx,self__.rschema,self__.pull_patterns,self__.pull_attrs,self__.hash,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__53332.cljs$core$IFn$_invoke$arity$2 ? pred__53332.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"eavt","eavt",-666437073),expr__53333) : pred__53332.call(null,new cljs.core.Keyword(null,"eavt","eavt",-666437073),expr__53333)))){
return (new datascript.db.DB(self__.schema,G__53308,self__.aevt,self__.avet,self__.max_eid,self__.max_tx,self__.rschema,self__.pull_patterns,self__.pull_attrs,self__.hash,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__53332.cljs$core$IFn$_invoke$arity$2 ? pred__53332.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"aevt","aevt",-585148059),expr__53333) : pred__53332.call(null,new cljs.core.Keyword(null,"aevt","aevt",-585148059),expr__53333)))){
return (new datascript.db.DB(self__.schema,self__.eavt,G__53308,self__.avet,self__.max_eid,self__.max_tx,self__.rschema,self__.pull_patterns,self__.pull_attrs,self__.hash,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__53332.cljs$core$IFn$_invoke$arity$2 ? pred__53332.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"avet","avet",1383857032),expr__53333) : pred__53332.call(null,new cljs.core.Keyword(null,"avet","avet",1383857032),expr__53333)))){
return (new datascript.db.DB(self__.schema,self__.eavt,self__.aevt,G__53308,self__.max_eid,self__.max_tx,self__.rschema,self__.pull_patterns,self__.pull_attrs,self__.hash,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__53332.cljs$core$IFn$_invoke$arity$2 ? pred__53332.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"max-eid","max-eid",2134868075),expr__53333) : pred__53332.call(null,new cljs.core.Keyword(null,"max-eid","max-eid",2134868075),expr__53333)))){
return (new datascript.db.DB(self__.schema,self__.eavt,self__.aevt,self__.avet,G__53308,self__.max_tx,self__.rschema,self__.pull_patterns,self__.pull_attrs,self__.hash,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__53332.cljs$core$IFn$_invoke$arity$2 ? pred__53332.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"max-tx","max-tx",1119558339),expr__53333) : pred__53332.call(null,new cljs.core.Keyword(null,"max-tx","max-tx",1119558339),expr__53333)))){
return (new datascript.db.DB(self__.schema,self__.eavt,self__.aevt,self__.avet,self__.max_eid,G__53308,self__.rschema,self__.pull_patterns,self__.pull_attrs,self__.hash,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__53332.cljs$core$IFn$_invoke$arity$2 ? pred__53332.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"rschema","rschema",-1196134054),expr__53333) : pred__53332.call(null,new cljs.core.Keyword(null,"rschema","rschema",-1196134054),expr__53333)))){
return (new datascript.db.DB(self__.schema,self__.eavt,self__.aevt,self__.avet,self__.max_eid,self__.max_tx,G__53308,self__.pull_patterns,self__.pull_attrs,self__.hash,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__53332.cljs$core$IFn$_invoke$arity$2 ? pred__53332.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"pull-patterns","pull-patterns",-343695048),expr__53333) : pred__53332.call(null,new cljs.core.Keyword(null,"pull-patterns","pull-patterns",-343695048),expr__53333)))){
return (new datascript.db.DB(self__.schema,self__.eavt,self__.aevt,self__.avet,self__.max_eid,self__.max_tx,self__.rschema,G__53308,self__.pull_attrs,self__.hash,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__53332.cljs$core$IFn$_invoke$arity$2 ? pred__53332.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"pull-attrs","pull-attrs",-974863177),expr__53333) : pred__53332.call(null,new cljs.core.Keyword(null,"pull-attrs","pull-attrs",-974863177),expr__53333)))){
return (new datascript.db.DB(self__.schema,self__.eavt,self__.aevt,self__.avet,self__.max_eid,self__.max_tx,self__.rschema,self__.pull_patterns,G__53308,self__.hash,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__53332.cljs$core$IFn$_invoke$arity$2 ? pred__53332.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"hash","hash",-13781596),expr__53333) : pred__53332.call(null,new cljs.core.Keyword(null,"hash","hash",-13781596),expr__53333)))){
return (new datascript.db.DB(self__.schema,self__.eavt,self__.aevt,self__.avet,self__.max_eid,self__.max_tx,self__.rschema,self__.pull_patterns,self__.pull_attrs,G__53308,self__.__meta,self__.__extmap,null));
} else {
return (new datascript.db.DB(self__.schema,self__.eavt,self__.aevt,self__.avet,self__.max_eid,self__.max_tx,self__.rschema,self__.pull_patterns,self__.pull_attrs,self__.hash,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__53308),null));
}
}
}
}
}
}
}
}
}
}
}));

(datascript.db.DB.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"schema","schema",-1582001791),self__.schema,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"eavt","eavt",-666437073),self__.eavt,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"aevt","aevt",-585148059),self__.aevt,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"avet","avet",1383857032),self__.avet,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"max-eid","max-eid",2134868075),self__.max_eid,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"max-tx","max-tx",1119558339),self__.max_tx,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"rschema","rschema",-1196134054),self__.rschema,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"pull-patterns","pull-patterns",-343695048),self__.pull_patterns,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"pull-attrs","pull-attrs",-974863177),self__.pull_attrs,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"hash","hash",-13781596),self__.hash,null))], null),self__.__extmap));
}));

(datascript.db.DB.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__53308){
var self__ = this;
var this__5299__auto____$1 = this;
return (new datascript.db.DB(self__.schema,self__.eavt,self__.aevt,self__.avet,self__.max_eid,self__.max_tx,self__.rschema,self__.pull_patterns,self__.pull_attrs,self__.hash,G__53308,self__.__extmap,self__.__hash));
}));

(datascript.db.DB.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(datascript.db.DB.getBasis = (function (){
return new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"schema","schema",58529736,null),new cljs.core.Symbol(null,"eavt","eavt",974094454,null),new cljs.core.Symbol(null,"aevt","aevt",1055383468,null),new cljs.core.Symbol(null,"avet","avet",-1270578737,null),new cljs.core.Symbol(null,"max-eid","max-eid",-519567694,null),new cljs.core.Symbol(null,"max-tx","max-tx",-1534877430,null),new cljs.core.Symbol(null,"rschema","rschema",444397473,null),new cljs.core.Symbol(null,"pull-patterns","pull-patterns",1296836479,null),new cljs.core.Symbol(null,"pull-attrs","pull-attrs",665668350,null),new cljs.core.Symbol(null,"hash","hash",1626749931,null)], null);
}));

(datascript.db.DB.cljs$lang$type = true);

(datascript.db.DB.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"datascript.db/DB",null,(1),null));
}));

(datascript.db.DB.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"datascript.db/DB");
}));

/**
 * Positional factory function for datascript.db/DB.
 */
datascript.db.__GT_DB = (function datascript$db$__GT_DB(schema,eavt,aevt,avet,max_eid,max_tx,rschema,pull_patterns,pull_attrs,hash){
return (new datascript.db.DB(schema,eavt,aevt,avet,max_eid,max_tx,rschema,pull_patterns,pull_attrs,hash,null,null,null));
});

/**
 * Factory function for datascript.db/DB, taking a map of keywords to field values.
 */
datascript.db.map__GT_DB = (function datascript$db$map__GT_DB(G__53313){
var extmap__5342__auto__ = (function (){var G__53344 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__53313,new cljs.core.Keyword(null,"schema","schema",-1582001791),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"eavt","eavt",-666437073),new cljs.core.Keyword(null,"aevt","aevt",-585148059),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword(null,"max-eid","max-eid",2134868075),new cljs.core.Keyword(null,"max-tx","max-tx",1119558339),new cljs.core.Keyword(null,"rschema","rschema",-1196134054),new cljs.core.Keyword(null,"pull-patterns","pull-patterns",-343695048),new cljs.core.Keyword(null,"pull-attrs","pull-attrs",-974863177),new cljs.core.Keyword(null,"hash","hash",-13781596)], 0));
if(cljs.core.record_QMARK_(G__53313)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__53344);
} else {
return G__53344;
}
})();
return (new datascript.db.DB(new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1(G__53313),new cljs.core.Keyword(null,"eavt","eavt",-666437073).cljs$core$IFn$_invoke$arity$1(G__53313),new cljs.core.Keyword(null,"aevt","aevt",-585148059).cljs$core$IFn$_invoke$arity$1(G__53313),new cljs.core.Keyword(null,"avet","avet",1383857032).cljs$core$IFn$_invoke$arity$1(G__53313),new cljs.core.Keyword(null,"max-eid","max-eid",2134868075).cljs$core$IFn$_invoke$arity$1(G__53313),new cljs.core.Keyword(null,"max-tx","max-tx",1119558339).cljs$core$IFn$_invoke$arity$1(G__53313),new cljs.core.Keyword(null,"rschema","rschema",-1196134054).cljs$core$IFn$_invoke$arity$1(G__53313),new cljs.core.Keyword(null,"pull-patterns","pull-patterns",-343695048).cljs$core$IFn$_invoke$arity$1(G__53313),new cljs.core.Keyword(null,"pull-attrs","pull-attrs",-974863177).cljs$core$IFn$_invoke$arity$1(G__53313),new cljs.core.Keyword(null,"hash","hash",-13781596).cljs$core$IFn$_invoke$arity$1(G__53313),null,cljs.core.not_empty(extmap__5342__auto__),null));
});


(datascript.db.DB.prototype.clojure$data$Diff$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.DB.prototype.clojure$data$Diff$diff_similar$arity$2 = (function (a,b){
var a__$1 = this;
return datascript.db.diff_sorted(a__$1.eavt,new cljs.core.Keyword(null,"eavt","eavt",-666437073).cljs$core$IFn$_invoke$arity$1(b),datascript.db.cmp_datoms_eav_quick);
}));

(datascript.db.DB.prototype.cljs$core$IPrintWithWriter$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.DB.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (db,w,opts){
var db__$1 = this;
return datascript.db.pr_db(db__$1,w,opts);
}));

(datascript.db.DB.prototype.cljs$core$ICounted$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.DB.prototype.cljs$core$ICounted$_count$arity$1 = (function (db){
var db__$1 = this;
return cljs.core.count(db__$1.eavt);
}));

(datascript.db.DB.prototype.cljs$core$IReversible$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.DB.prototype.cljs$core$IReversible$_rseq$arity$1 = (function (db){
var db__$1 = this;
return cljs.core._rseq(db__$1.eavt);
}));

(datascript.db.DB.prototype.cljs$core$IHash$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.DB.prototype.cljs$core$IHash$_hash$arity$1 = (function (db){
var db__$1 = this;
return datascript.db.hash_db(db__$1);
}));

(datascript.db.DB.prototype.cljs$core$IEquiv$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.DB.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (db,other){
var db__$1 = this;
return datascript.db.equiv_db(db__$1,other);
}));

(datascript.db.DB.prototype.cljs$core$IEditableCollection$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.DB.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = (function (db){
var db__$1 = this;
return datascript.db.db_transient(db__$1);
}));

(datascript.db.DB.prototype.cljs$core$IEmptyableCollection$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.DB.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = (function (db){
var db__$1 = this;
return cljs.core.with_meta(datascript.db.restore_db(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"schema","schema",-1582001791),db__$1.schema,new cljs.core.Keyword(null,"rschema","rschema",-1196134054),db__$1.rschema,new cljs.core.Keyword(null,"eavt","eavt",-666437073),cljs.core.empty(db__$1.eavt),new cljs.core.Keyword(null,"aevt","aevt",-585148059),cljs.core.empty(db__$1.aevt),new cljs.core.Keyword(null,"avet","avet",1383857032),cljs.core.empty(db__$1.avet)], null)),cljs.core.meta(db__$1));
}));

(datascript.db.DB.prototype.cljs$core$ITransientCollection$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.DB.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = (function (db,key){
var db__$1 = this;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("datascript.DB/conj! is not supported",cljs.core.PersistentArrayMap.EMPTY);
}));

(datascript.db.DB.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = (function (db){
var db__$1 = this;
return datascript.db.db_persistent_BANG_(db__$1);
}));

(datascript.db.DB.prototype.clojure$data$EqualityPartition$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.DB.prototype.clojure$data$EqualityPartition$equality_partition$arity$1 = (function (x){
var x__$1 = this;
return new cljs.core.Keyword("datascript","db","datascript/db",-1190971692);
}));

(datascript.db.DB.prototype.datascript$db$IIndexAccess$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.DB.prototype.datascript$db$IIndexAccess$_datoms$arity$6 = (function (db,index,c0,c1,c2,c3){
var db__$1 = this;
datascript.db.validate_indexed(db__$1,index,c0,c1,c2,c3);

return me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(cljs.core.get.cljs$core$IFn$_invoke$arity$2(db__$1,index),datascript.db.components__GT_pattern(db__$1,index,c0,c1,c2,c3,(0),(536870912)),datascript.db.components__GT_pattern(db__$1,index,c0,c1,c2,c3,(2147483647),(2147483647)));
}));

(datascript.db.DB.prototype.datascript$db$IIndexAccess$_seek_datoms$arity$6 = (function (db,index,c0,c1,c2,c3){
var db__$1 = this;
datascript.db.validate_indexed(db__$1,index,c0,c1,c2,c3);

return me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(cljs.core.get.cljs$core$IFn$_invoke$arity$2(db__$1,index),datascript.db.components__GT_pattern(db__$1,index,c0,c1,c2,c3,(0),(536870912)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4((2147483647),null,null,(2147483647)));
}));

(datascript.db.DB.prototype.datascript$db$IIndexAccess$_rseek_datoms$arity$6 = (function (db,index,c0,c1,c2,c3){
var db__$1 = this;
datascript.db.validate_indexed(db__$1,index,c0,c1,c2,c3);

return me.tonsky.persistent_sorted_set.rslice.cljs$core$IFn$_invoke$arity$3(cljs.core.get.cljs$core$IFn$_invoke$arity$2(db__$1,index),datascript.db.components__GT_pattern(db__$1,index,c0,c1,c2,c3,(2147483647),(2147483647)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4((0),null,null,(536870912)));
}));

(datascript.db.DB.prototype.datascript$db$IIndexAccess$_index_range$arity$4 = (function (db,attr,start,end){
var db__$1 = this;
datascript.db.validate_indexed(db__$1,new cljs.core.Keyword(null,"avet","avet",1383857032),attr,null,null,null);

var attr__51595__auto___54644 = attr;
if((((attr__51595__auto___54644 instanceof cljs.core.Keyword)) || (typeof attr__51595__auto___54644 === 'string'))){
} else {
var at__51596__auto___54645 = (new cljs.core.List(null,new cljs.core.Symbol(null,"-index-range","-index-range",898114142,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"db","db",-1661185010,null),(new cljs.core.List(null,attr,(new cljs.core.List(null,start,(new cljs.core.List(null,end,null,(1),null)),(2),null)),(3),null)),(4),null)),(5),null));
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Bad entity attribute ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attr__51595__auto___54644], 0))," at ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([at__51596__auto___54645], 0)),", expected keyword or string"].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"attribute","attribute",-2074029119),attr__51595__auto___54644,new cljs.core.Keyword(null,"context","context",-830191113),at__51596__auto___54645,new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078)], null));
}

return me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(db__$1.avet,datascript.db.resolve_datom(db__$1,null,attr,start,null,(0),(536870912)),datascript.db.resolve_datom(db__$1,null,attr,end,null,(2147483647),(2147483647)));
}));

(datascript.db.DB.prototype.datascript$db$IDB$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.DB.prototype.datascript$db$IDB$_schema$arity$1 = (function (db){
var db__$1 = this;
return db__$1.schema;
}));

(datascript.db.DB.prototype.datascript$db$IDB$_attrs_by$arity$2 = (function (db,property){
var db__$1 = this;
var fexpr__53401 = db__$1.rschema;
return (fexpr__53401.cljs$core$IFn$_invoke$arity$1 ? fexpr__53401.cljs$core$IFn$_invoke$arity$1(property) : fexpr__53401.call(null,property));
}));

(datascript.db.DB.prototype.datascript$db$ISearch$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.DB.prototype.datascript$db$ISearch$_search$arity$2 = (function (db,pattern){
var db__$1 = this;
var vec__53403 = pattern;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__53403,(0),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__53403,(1),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__53403,(2),null);
var tx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__53403,(3),null);
var eavt = db__$1.eavt;
var aevt = db__$1.aevt;
var avet = db__$1.avet;
var pred = (function (p1__53287_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,p1__53287_SHARP_);
});
var multival_QMARK_ = cljs.core.contains_QMARK_(datascript.db._attrs_by(db__$1,new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234)),a);
if(cljs.core.truth_(e)){
if(cljs.core.truth_(a)){
if((!((v == null)))){
if(cljs.core.truth_(tx)){
return me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(eavt,datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,a,v,tx),datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,a,v,tx));
} else {
return me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(eavt,datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,a,v,(536870912)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,a,v,(2147483647)));
}
} else {
if(cljs.core.truth_(tx)){
return cljs.core.__GT_Eduction(cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (d){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tx,d.datascript$db$IDatom$datom_tx$arity$1(null));
})),me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(eavt,datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,a,null,(536870912)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,a,null,(2147483647))));
} else {
return me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(eavt,datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,a,null,(536870912)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,a,null,(2147483647)));
}
}
} else {
if((!((v == null)))){
if(cljs.core.truth_(tx)){
return cljs.core.__GT_Eduction(cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (d){
return ((pred(d.v)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tx,d.datascript$db$IDatom$datom_tx$arity$1(null))));
})),me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(eavt,datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,null,null,(536870912)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,null,null,(2147483647))));
} else {
return cljs.core.__GT_Eduction(cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (d){
return pred(d.v);
})),me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(eavt,datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,null,null,(536870912)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,null,null,(2147483647))));
}
} else {
if(cljs.core.truth_(tx)){
return cljs.core.__GT_Eduction(cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (d){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tx,d.datascript$db$IDatom$datom_tx$arity$1(null));
})),me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(eavt,datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,null,null,(536870912)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,null,null,(2147483647))));
} else {
return me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(eavt,datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,null,null,(536870912)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,null,null,(2147483647)));
}
}
}
} else {
if(cljs.core.truth_(a)){
if((!((v == null)))){
if(cljs.core.truth_(tx)){
if(datascript.db.indexing_QMARK_(db__$1,a)){
return cljs.core.__GT_Eduction(cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (d){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tx,d.datascript$db$IDatom$datom_tx$arity$1(null));
})),me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(avet,datascript.db.datom.cljs$core$IFn$_invoke$arity$4((0),a,v,(536870912)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4((2147483647),a,v,(2147483647))));
} else {
return cljs.core.__GT_Eduction(cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (d){
return ((pred(d.v)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tx,d.datascript$db$IDatom$datom_tx$arity$1(null))));
})),me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(aevt,datascript.db.datom.cljs$core$IFn$_invoke$arity$4((0),a,null,(536870912)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4((2147483647),a,null,(2147483647))));
}
} else {
if(datascript.db.indexing_QMARK_(db__$1,a)){
return me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(avet,datascript.db.datom.cljs$core$IFn$_invoke$arity$4((0),a,v,(536870912)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4((2147483647),a,v,(2147483647)));
} else {
return cljs.core.__GT_Eduction(cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (d){
return pred(d.v);
})),me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(aevt,datascript.db.datom.cljs$core$IFn$_invoke$arity$4((0),a,null,(536870912)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4((2147483647),a,null,(2147483647))));
}
}
} else {
if(cljs.core.truth_(tx)){
return cljs.core.__GT_Eduction(cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (d){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tx,d.datascript$db$IDatom$datom_tx$arity$1(null));
})),me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(aevt,datascript.db.datom.cljs$core$IFn$_invoke$arity$4((0),a,null,(536870912)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4((2147483647),a,null,(2147483647))));
} else {
return me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$3(aevt,datascript.db.datom.cljs$core$IFn$_invoke$arity$4((0),a,null,(536870912)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4((2147483647),a,null,(2147483647)));
}
}
} else {
if((!((v == null)))){
if(cljs.core.truth_(tx)){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (d){
return ((pred(d.v)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tx,d.datascript$db$IDatom$datom_tx$arity$1(null))));
}),eavt);
} else {
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (d){
return pred(d.v);
}),eavt);
}
} else {
if(cljs.core.truth_(tx)){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (d){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tx,d.datascript$db$IDatom$datom_tx$arity$1(null));
}),eavt);
} else {
return eavt;
}
}
}
}
}));
datascript.db.db_QMARK_ = (function datascript$db$db_QMARK_(x){
var and__5000__auto__ = (((!((x == null))))?((((false) || ((cljs.core.PROTOCOL_SENTINEL === x.datascript$db$ISearch$))))?true:(((!x.cljs$lang$protocol_mask$partition$))?cljs.core.native_satisfies_QMARK_(datascript.db.ISearch,x):false)):cljs.core.native_satisfies_QMARK_(datascript.db.ISearch,x));
if(and__5000__auto__){
var and__5000__auto____$1 = (((!((x == null))))?((((false) || ((cljs.core.PROTOCOL_SENTINEL === x.datascript$db$IIndexAccess$))))?true:(((!x.cljs$lang$protocol_mask$partition$))?cljs.core.native_satisfies_QMARK_(datascript.db.IIndexAccess,x):false)):cljs.core.native_satisfies_QMARK_(datascript.db.IIndexAccess,x));
if(and__5000__auto____$1){
if((!((x == null)))){
if(((false) || ((cljs.core.PROTOCOL_SENTINEL === x.datascript$db$IDB$)))){
return true;
} else {
if((!x.cljs$lang$protocol_mask$partition$)){
return cljs.core.native_satisfies_QMARK_(datascript.db.IDB,x);
} else {
return false;
}
}
} else {
return cljs.core.native_satisfies_QMARK_(datascript.db.IDB,x);
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
});

/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {cljs.core.IKVReduce}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.ICloneable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
datascript.db.FilteredDB = (function (unfiltered_db,pred,hash,__meta,__extmap,__hash){
this.unfiltered_db = unfiltered_db;
this.pred = pred;
this.hash = hash;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(datascript.db.FilteredDB.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(datascript.db.FilteredDB.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k53422,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__53429 = k53422;
var G__53429__$1 = (((G__53429 instanceof cljs.core.Keyword))?G__53429.fqn:null);
switch (G__53429__$1) {
case "unfiltered-db":
return self__.unfiltered_db;

break;
case "pred":
return self__.pred;

break;
case "hash":
return self__.hash;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k53422,else__5303__auto__);

}
}));

(datascript.db.FilteredDB.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__53433){
var vec__53434 = p__53433;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__53434,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__53434,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(datascript.db.FilteredDB.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#datascript.db.FilteredDB{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"unfiltered-db","unfiltered-db",-1363720391),self__.unfiltered_db],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"pred","pred",1927423397),self__.pred],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"hash","hash",-13781596),self__.hash],null))], null),self__.__extmap));
}));

(datascript.db.FilteredDB.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__53421){
var self__ = this;
var G__53421__$1 = this;
return (new cljs.core.RecordIter((0),G__53421__$1,3,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"unfiltered-db","unfiltered-db",-1363720391),new cljs.core.Keyword(null,"pred","pred",1927423397),new cljs.core.Keyword(null,"hash","hash",-13781596)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(datascript.db.FilteredDB.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(datascript.db.FilteredDB.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new datascript.db.FilteredDB(self__.unfiltered_db,self__.pred,self__.hash,self__.__meta,self__.__extmap,self__.__hash));
}));

(datascript.db.FilteredDB.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (3 + cljs.core.count(self__.__extmap));
}));

(datascript.db.FilteredDB.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (-351969977 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(datascript.db.FilteredDB.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this53423,other53424){
var self__ = this;
var this53423__$1 = this;
return (((!((other53424 == null)))) && ((((this53423__$1.constructor === other53424.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this53423__$1.unfiltered_db,other53424.unfiltered_db)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this53423__$1.pred,other53424.pred)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this53423__$1.hash,other53424.hash)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this53423__$1.__extmap,other53424.__extmap)))))))))));
}));

(datascript.db.FilteredDB.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"hash","hash",-13781596),null,new cljs.core.Keyword(null,"pred","pred",1927423397),null,new cljs.core.Keyword(null,"unfiltered-db","unfiltered-db",-1363720391),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new datascript.db.FilteredDB(self__.unfiltered_db,self__.pred,self__.hash,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(datascript.db.FilteredDB.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k53422){
var self__ = this;
var this__5307__auto____$1 = this;
var G__53464 = k53422;
var G__53464__$1 = (((G__53464 instanceof cljs.core.Keyword))?G__53464.fqn:null);
switch (G__53464__$1) {
case "unfiltered-db":
case "pred":
case "hash":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k53422);

}
}));

(datascript.db.FilteredDB.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__53421){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__53468 = cljs.core.keyword_identical_QMARK_;
var expr__53469 = k__5309__auto__;
if(cljs.core.truth_((pred__53468.cljs$core$IFn$_invoke$arity$2 ? pred__53468.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"unfiltered-db","unfiltered-db",-1363720391),expr__53469) : pred__53468.call(null,new cljs.core.Keyword(null,"unfiltered-db","unfiltered-db",-1363720391),expr__53469)))){
return (new datascript.db.FilteredDB(G__53421,self__.pred,self__.hash,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__53468.cljs$core$IFn$_invoke$arity$2 ? pred__53468.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"pred","pred",1927423397),expr__53469) : pred__53468.call(null,new cljs.core.Keyword(null,"pred","pred",1927423397),expr__53469)))){
return (new datascript.db.FilteredDB(self__.unfiltered_db,G__53421,self__.hash,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__53468.cljs$core$IFn$_invoke$arity$2 ? pred__53468.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"hash","hash",-13781596),expr__53469) : pred__53468.call(null,new cljs.core.Keyword(null,"hash","hash",-13781596),expr__53469)))){
return (new datascript.db.FilteredDB(self__.unfiltered_db,self__.pred,G__53421,self__.__meta,self__.__extmap,null));
} else {
return (new datascript.db.FilteredDB(self__.unfiltered_db,self__.pred,self__.hash,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__53421),null));
}
}
}
}));

(datascript.db.FilteredDB.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"unfiltered-db","unfiltered-db",-1363720391),self__.unfiltered_db,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"pred","pred",1927423397),self__.pred,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"hash","hash",-13781596),self__.hash,null))], null),self__.__extmap));
}));

(datascript.db.FilteredDB.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__53421){
var self__ = this;
var this__5299__auto____$1 = this;
return (new datascript.db.FilteredDB(self__.unfiltered_db,self__.pred,self__.hash,G__53421,self__.__extmap,self__.__hash));
}));

(datascript.db.FilteredDB.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(datascript.db.FilteredDB.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"unfiltered-db","unfiltered-db",276811136,null),new cljs.core.Symbol(null,"pred","pred",-727012372,null),new cljs.core.Symbol(null,"hash","hash",1626749931,null)], null);
}));

(datascript.db.FilteredDB.cljs$lang$type = true);

(datascript.db.FilteredDB.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"datascript.db/FilteredDB",null,(1),null));
}));

(datascript.db.FilteredDB.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"datascript.db/FilteredDB");
}));

/**
 * Positional factory function for datascript.db/FilteredDB.
 */
datascript.db.__GT_FilteredDB = (function datascript$db$__GT_FilteredDB(unfiltered_db,pred,hash){
return (new datascript.db.FilteredDB(unfiltered_db,pred,hash,null,null,null));
});

/**
 * Factory function for datascript.db/FilteredDB, taking a map of keywords to field values.
 */
datascript.db.map__GT_FilteredDB = (function datascript$db$map__GT_FilteredDB(G__53425){
var extmap__5342__auto__ = (function (){var G__53478 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__53425,new cljs.core.Keyword(null,"unfiltered-db","unfiltered-db",-1363720391),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"pred","pred",1927423397),new cljs.core.Keyword(null,"hash","hash",-13781596)], 0));
if(cljs.core.record_QMARK_(G__53425)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__53478);
} else {
return G__53478;
}
})();
return (new datascript.db.FilteredDB(new cljs.core.Keyword(null,"unfiltered-db","unfiltered-db",-1363720391).cljs$core$IFn$_invoke$arity$1(G__53425),new cljs.core.Keyword(null,"pred","pred",1927423397).cljs$core$IFn$_invoke$arity$1(G__53425),new cljs.core.Keyword(null,"hash","hash",-13781596).cljs$core$IFn$_invoke$arity$1(G__53425),null,cljs.core.not_empty(extmap__5342__auto__),null));
});


(datascript.db.FilteredDB.prototype.cljs$core$ILookup$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.FilteredDB.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (_,___$1){
var ___$2 = this;
throw (new Error("-lookup is not supported on FilteredDB"));
}));

(datascript.db.FilteredDB.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (_,___$1,___$2){
var ___$3 = this;
throw (new Error("-lookup is not supported on FilteredDB"));
}));

(datascript.db.FilteredDB.prototype.cljs$core$IPrintWithWriter$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.FilteredDB.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (db,w,opts){
var db__$1 = this;
return datascript.db.pr_db(db__$1,w,opts);
}));

(datascript.db.FilteredDB.prototype.cljs$core$ICounted$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.FilteredDB.prototype.cljs$core$ICounted$_count$arity$1 = (function (db){
var db__$1 = this;
return cljs.core.count(datascript.db._datoms(db__$1,new cljs.core.Keyword(null,"eavt","eavt",-666437073),null,null,null,null));
}));

(datascript.db.FilteredDB.prototype.cljs$core$IHash$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.FilteredDB.prototype.cljs$core$IHash$_hash$arity$1 = (function (db){
var db__$1 = this;
return datascript.db.hash_fdb(db__$1);
}));

(datascript.db.FilteredDB.prototype.cljs$core$IEquiv$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.FilteredDB.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (db,other){
var db__$1 = this;
return datascript.db.equiv_db(db__$1,other);
}));

(datascript.db.FilteredDB.prototype.cljs$core$IEmptyableCollection$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.FilteredDB.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = (function (_){
var ___$1 = this;
throw (new Error("-empty is not supported on FilteredDB"));
}));

(datascript.db.FilteredDB.prototype.cljs$core$IAssociative$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.FilteredDB.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (_,___$1){
var ___$2 = this;
throw (new Error("-contains-key? is not supported on FilteredDB"));
}));

(datascript.db.FilteredDB.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (_,___$1,___$2){
var ___$3 = this;
throw (new Error("-assoc is not supported on FilteredDB"));
}));

(datascript.db.FilteredDB.prototype.datascript$db$IIndexAccess$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.FilteredDB.prototype.datascript$db$IIndexAccess$_datoms$arity$6 = (function (db,index,c0,c1,c2,c3){
var db__$1 = this;
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2(db__$1.pred,datascript.db._datoms(db__$1.unfiltered_db,index,c0,c1,c2,c3));
}));

(datascript.db.FilteredDB.prototype.datascript$db$IIndexAccess$_seek_datoms$arity$6 = (function (db,index,c0,c1,c2,c3){
var db__$1 = this;
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2(db__$1.pred,datascript.db._seek_datoms(db__$1.unfiltered_db,index,c0,c1,c2,c3));
}));

(datascript.db.FilteredDB.prototype.datascript$db$IIndexAccess$_rseek_datoms$arity$6 = (function (db,index,c0,c1,c2,c3){
var db__$1 = this;
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2(db__$1.pred,datascript.db._rseek_datoms(db__$1.unfiltered_db,index,c0,c1,c2,c3));
}));

(datascript.db.FilteredDB.prototype.datascript$db$IIndexAccess$_index_range$arity$4 = (function (db,attr,start,end){
var db__$1 = this;
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2(db__$1.pred,datascript.db._index_range(db__$1.unfiltered_db,attr,start,end));
}));

(datascript.db.FilteredDB.prototype.datascript$db$IDB$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.FilteredDB.prototype.datascript$db$IDB$_schema$arity$1 = (function (db){
var db__$1 = this;
return datascript.db._schema(db__$1.unfiltered_db);
}));

(datascript.db.FilteredDB.prototype.datascript$db$IDB$_attrs_by$arity$2 = (function (db,property){
var db__$1 = this;
return datascript.db._attrs_by(db__$1.unfiltered_db,property);
}));

(datascript.db.FilteredDB.prototype.datascript$db$ISearch$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.db.FilteredDB.prototype.datascript$db$ISearch$_search$arity$2 = (function (db,pattern){
var db__$1 = this;
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2(db__$1.pred,datascript.db._search(db__$1.unfiltered_db,pattern));
}));
datascript.db.unfiltered_db = (function datascript$db$unfiltered_db(db){
if((db instanceof datascript.db.FilteredDB)){
return db.unfiltered_db;
} else {
return db;
}
});
datascript.db.attr__GT_properties = (function datascript$db$attr__GT_properties(k,v){
var G__53498 = v;
var G__53498__$1 = (((G__53498 instanceof cljs.core.Keyword))?G__53498.fqn:null);
switch (G__53498__$1) {
case "db.unique/identity":
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","unique","db/unique",329396388),new cljs.core.Keyword("db.unique","identity","db.unique/identity",1675950722),new cljs.core.Keyword("db","index","db/index",-1531680669)], null);

break;
case "db.unique/value":
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","unique","db/unique",329396388),new cljs.core.Keyword("db.unique","value","db.unique/value",276903088),new cljs.core.Keyword("db","index","db/index",-1531680669)], null);

break;
case "db.cardinality/many":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234)], null);

break;
case "db.type/ref":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079),new cljs.core.Keyword("db","index","db/index",-1531680669)], null);

break;
default:
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","isComponent","db/isComponent",423352398),k)) && (v === true))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","isComponent","db/isComponent",423352398)], null);
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","index","db/index",-1531680669),k)) && (v === true))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","index","db/index",-1531680669)], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","tupleAttrs","db/tupleAttrs",250080092),k)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.type","tuple","db.type/tuple",938234914),new cljs.core.Keyword("db","index","db/index",-1531680669)], null);
} else {
return cljs.core.PersistentVector.EMPTY;

}
}
}

}
});
/**
 * e.g. :reg/semester => #{:reg/semester+course+student ...}
 */
datascript.db.attr_tuples = (function datascript$db$attr_tuples(schema,rschema){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m,tuple_attr){
return datascript.util.reduce_indexed((function (m__$1,src_attr,idx){
return cljs.core.update.cljs$core$IFn$_invoke$arity$5(m__$1,src_attr,cljs.core.assoc,tuple_attr,idx);
}),m,new cljs.core.Keyword("db","tupleAttrs","db/tupleAttrs",250080092).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(schema,tuple_attr)));
}),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword("db.type","tuple","db.type/tuple",938234914).cljs$core$IFn$_invoke$arity$1(rschema));
});
datascript.db.rschema = (function datascript$db$rschema(schema){

var rschema = cljs.core.reduce_kv((function (m,attr,keys__GT_values){
if((keys__GT_values instanceof cljs.core.Keyword)){
return m;
} else {
return cljs.core.reduce_kv((function (m__$1,key,value){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m__$2,prop){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(m__$2,prop,datascript.util.conjs,attr);
}),m__$1,datascript.db.attr__GT_properties(key,value));
}),cljs.core.update.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword("db","ident","db/ident",-737096),(function (coll){
if(cljs.core.truth_(coll)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(coll,attr);
} else {
return cljs.core.PersistentHashSet.createAsIfByAssoc([attr]);
}
})),keys__GT_values);
}
}),cljs.core.PersistentArrayMap.EMPTY,schema);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(rschema,new cljs.core.Keyword("db","attrTuples","db/attrTuples",860541631),datascript.db.attr_tuples(schema,rschema));
});
datascript.db.validate_schema_key = (function datascript$db$validate_schema_key(a,k,v,expected){
if((((v == null)) || (cljs.core.contains_QMARK_(expected,v)))){
return null;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Bad attribute specification for ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentArrayMap.createAsIfByAssoc([a,cljs.core.PersistentArrayMap.createAsIfByAssoc([k,v])])], 0)),", expected one of ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(expected)].join(''),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("schema","validation","schema/validation",1178447161),new cljs.core.Keyword(null,"attribute","attribute",-2074029119),a,new cljs.core.Keyword(null,"key","key",-1516042587),k,new cljs.core.Keyword(null,"value","value",305978217),v], null));
}
});
datascript.db.validate_schema = (function datascript$db$validate_schema(schema){
var seq__53518 = cljs.core.seq(schema);
var chunk__53519 = null;
var count__53520 = (0);
var i__53521 = (0);
while(true){
if((i__53521 < count__53520)){
var vec__53541 = chunk__53519.cljs$core$IIndexed$_nth$arity$2(null,i__53521);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__53541,(0),null);
var kv = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__53541,(1),null);
var comp_QMARK__54690 = new cljs.core.Keyword("db","isComponent","db/isComponent",423352398).cljs$core$IFn$_invoke$arity$2(kv,false);
datascript.db.validate_schema_key(a,new cljs.core.Keyword("db","isComponent","db/isComponent",423352398),new cljs.core.Keyword("db","isComponent","db/isComponent",423352398).cljs$core$IFn$_invoke$arity$1(kv),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [true,null,false,null], null), null));

if(cljs.core.truth_((function (){var and__5000__auto__ = comp_QMARK__54690;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(kv),new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079));
} else {
return and__5000__auto__;
}
})())){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Bad attribute specification for ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a], 0)),": {:db/isComponent true} should also have {:db/valueType :db.type/ref}"].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("schema","validation","schema/validation",1178447161),new cljs.core.Keyword(null,"attribute","attribute",-2074029119),a,new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword("db","isComponent","db/isComponent",423352398)], null));
} else {
}

datascript.db.validate_schema_key(a,new cljs.core.Keyword("db","unique","db/unique",329396388),new cljs.core.Keyword("db","unique","db/unique",329396388).cljs$core$IFn$_invoke$arity$1(kv),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db.unique","identity","db.unique/identity",1675950722),null,new cljs.core.Keyword("db.unique","value","db.unique/value",276903088),null], null), null));

datascript.db.validate_schema_key(a,new cljs.core.Keyword("db","valueType","db/valueType",1827971944),new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(kv),datascript.schema.type_QMARK_);

datascript.db.validate_schema_key(a,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(kv),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),null,new cljs.core.Keyword("db.cardinality","one","db.cardinality/one",1428352190),null], null), null));

if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.type","tuple","db.type/tuple",938234914),new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(kv))) && ((!(cljs.core.contains_QMARK_(kv,new cljs.core.Keyword("db","tupleAttrs","db/tupleAttrs",250080092))))))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Bad attribute specification for ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a], 0)),": {:db/valueType :db.type/tuple} should also have :db/tupleAttrs"].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("schema","validation","schema/validation",1178447161),new cljs.core.Keyword(null,"attribute","attribute",-2074029119),a,new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword("db","valueType","db/valueType",1827971944)], null));
} else {
}

if(cljs.core.contains_QMARK_(kv,new cljs.core.Keyword("db","tupleAttrs","db/tupleAttrs",250080092))){
var ex_data_54693 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("schema","validation","schema/validation",1178447161),new cljs.core.Keyword(null,"attribute","attribute",-2074029119),a,new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword("db","tupleAttrs","db/tupleAttrs",250080092)], null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(kv))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a], 0))," has :db/tupleAttrs, must be :db.cardinality/one"].join(''),ex_data_54693);
} else {
}

var attrs_54694 = new cljs.core.Keyword("db","tupleAttrs","db/tupleAttrs",250080092).cljs$core$IFn$_invoke$arity$1(kv);
if(cljs.core.sequential_QMARK_(attrs_54694)){
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a], 0))," :db/tupleAttrs must be a sequential collection, got: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attrs_54694], 0))].join(''),ex_data_54693);
}

if(cljs.core.empty_QMARK_(attrs_54694)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a], 0))," :db/tupleAttrs can\u2019t be empty"].join(''),ex_data_54693);
} else {
}

var seq__53550_54696 = cljs.core.seq(attrs_54694);
var chunk__53552_54697 = null;
var count__53553_54698 = (0);
var i__53554_54699 = (0);
while(true){
if((i__53554_54699 < count__53553_54698)){
var attr_54700 = chunk__53552_54697.cljs$core$IIndexed$_nth$arity$2(null,i__53554_54699);
var ex_data_54701__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ex_data_54693,new cljs.core.Keyword(null,"value","value",305978217),attr_54700);
if(cljs.core.contains_QMARK_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(schema,attr_54700),new cljs.core.Keyword("db","tupleAttrs","db/tupleAttrs",250080092))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a], 0))," :db/tupleAttrs can\u2019t depend on another tuple attribute: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attr_54700], 0))].join(''),ex_data_54701__$1);
} else {
}

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(schema,attr_54700)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a], 0))," :db/tupleAttrs can\u2019t depend on :db.cardinality/many attribute: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attr_54700], 0))].join(''),ex_data_54701__$1);
} else {
}


var G__54702 = seq__53550_54696;
var G__54703 = chunk__53552_54697;
var G__54704 = count__53553_54698;
var G__54705 = (i__53554_54699 + (1));
seq__53550_54696 = G__54702;
chunk__53552_54697 = G__54703;
count__53553_54698 = G__54704;
i__53554_54699 = G__54705;
continue;
} else {
var temp__5804__auto___54706 = cljs.core.seq(seq__53550_54696);
if(temp__5804__auto___54706){
var seq__53550_54708__$1 = temp__5804__auto___54706;
if(cljs.core.chunked_seq_QMARK_(seq__53550_54708__$1)){
var c__5525__auto___54709 = cljs.core.chunk_first(seq__53550_54708__$1);
var G__54710 = cljs.core.chunk_rest(seq__53550_54708__$1);
var G__54711 = c__5525__auto___54709;
var G__54712 = cljs.core.count(c__5525__auto___54709);
var G__54713 = (0);
seq__53550_54696 = G__54710;
chunk__53552_54697 = G__54711;
count__53553_54698 = G__54712;
i__53554_54699 = G__54713;
continue;
} else {
var attr_54714 = cljs.core.first(seq__53550_54708__$1);
var ex_data_54715__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ex_data_54693,new cljs.core.Keyword(null,"value","value",305978217),attr_54714);
if(cljs.core.contains_QMARK_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(schema,attr_54714),new cljs.core.Keyword("db","tupleAttrs","db/tupleAttrs",250080092))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a], 0))," :db/tupleAttrs can\u2019t depend on another tuple attribute: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attr_54714], 0))].join(''),ex_data_54715__$1);
} else {
}

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(schema,attr_54714)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a], 0))," :db/tupleAttrs can\u2019t depend on :db.cardinality/many attribute: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attr_54714], 0))].join(''),ex_data_54715__$1);
} else {
}


var G__54717 = cljs.core.next(seq__53550_54708__$1);
var G__54718 = null;
var G__54719 = (0);
var G__54720 = (0);
seq__53550_54696 = G__54717;
chunk__53552_54697 = G__54718;
count__53553_54698 = G__54719;
i__53554_54699 = G__54720;
continue;
}
} else {
}
}
break;
}
} else {
}


var G__54721 = seq__53518;
var G__54722 = chunk__53519;
var G__54723 = count__53520;
var G__54724 = (i__53521 + (1));
seq__53518 = G__54721;
chunk__53519 = G__54722;
count__53520 = G__54723;
i__53521 = G__54724;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__53518);
if(temp__5804__auto__){
var seq__53518__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__53518__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__53518__$1);
var G__54726 = cljs.core.chunk_rest(seq__53518__$1);
var G__54727 = c__5525__auto__;
var G__54728 = cljs.core.count(c__5525__auto__);
var G__54729 = (0);
seq__53518 = G__54726;
chunk__53519 = G__54727;
count__53520 = G__54728;
i__53521 = G__54729;
continue;
} else {
var vec__53562 = cljs.core.first(seq__53518__$1);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__53562,(0),null);
var kv = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__53562,(1),null);
var comp_QMARK__54730 = new cljs.core.Keyword("db","isComponent","db/isComponent",423352398).cljs$core$IFn$_invoke$arity$2(kv,false);
datascript.db.validate_schema_key(a,new cljs.core.Keyword("db","isComponent","db/isComponent",423352398),new cljs.core.Keyword("db","isComponent","db/isComponent",423352398).cljs$core$IFn$_invoke$arity$1(kv),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [true,null,false,null], null), null));

if(cljs.core.truth_((function (){var and__5000__auto__ = comp_QMARK__54730;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(kv),new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079));
} else {
return and__5000__auto__;
}
})())){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Bad attribute specification for ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a], 0)),": {:db/isComponent true} should also have {:db/valueType :db.type/ref}"].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("schema","validation","schema/validation",1178447161),new cljs.core.Keyword(null,"attribute","attribute",-2074029119),a,new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword("db","isComponent","db/isComponent",423352398)], null));
} else {
}

datascript.db.validate_schema_key(a,new cljs.core.Keyword("db","unique","db/unique",329396388),new cljs.core.Keyword("db","unique","db/unique",329396388).cljs$core$IFn$_invoke$arity$1(kv),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db.unique","identity","db.unique/identity",1675950722),null,new cljs.core.Keyword("db.unique","value","db.unique/value",276903088),null], null), null));

datascript.db.validate_schema_key(a,new cljs.core.Keyword("db","valueType","db/valueType",1827971944),new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(kv),datascript.schema.type_QMARK_);

datascript.db.validate_schema_key(a,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(kv),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),null,new cljs.core.Keyword("db.cardinality","one","db.cardinality/one",1428352190),null], null), null));

if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.type","tuple","db.type/tuple",938234914),new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(kv))) && ((!(cljs.core.contains_QMARK_(kv,new cljs.core.Keyword("db","tupleAttrs","db/tupleAttrs",250080092))))))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Bad attribute specification for ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a], 0)),": {:db/valueType :db.type/tuple} should also have :db/tupleAttrs"].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("schema","validation","schema/validation",1178447161),new cljs.core.Keyword(null,"attribute","attribute",-2074029119),a,new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword("db","valueType","db/valueType",1827971944)], null));
} else {
}

if(cljs.core.contains_QMARK_(kv,new cljs.core.Keyword("db","tupleAttrs","db/tupleAttrs",250080092))){
var ex_data_54735 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("schema","validation","schema/validation",1178447161),new cljs.core.Keyword(null,"attribute","attribute",-2074029119),a,new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword("db","tupleAttrs","db/tupleAttrs",250080092)], null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(kv))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a], 0))," has :db/tupleAttrs, must be :db.cardinality/one"].join(''),ex_data_54735);
} else {
}

var attrs_54736 = new cljs.core.Keyword("db","tupleAttrs","db/tupleAttrs",250080092).cljs$core$IFn$_invoke$arity$1(kv);
if(cljs.core.sequential_QMARK_(attrs_54736)){
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a], 0))," :db/tupleAttrs must be a sequential collection, got: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attrs_54736], 0))].join(''),ex_data_54735);
}

if(cljs.core.empty_QMARK_(attrs_54736)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a], 0))," :db/tupleAttrs can\u2019t be empty"].join(''),ex_data_54735);
} else {
}

var seq__53579_54738 = cljs.core.seq(attrs_54736);
var chunk__53581_54739 = null;
var count__53582_54740 = (0);
var i__53583_54741 = (0);
while(true){
if((i__53583_54741 < count__53582_54740)){
var attr_54742 = chunk__53581_54739.cljs$core$IIndexed$_nth$arity$2(null,i__53583_54741);
var ex_data_54743__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ex_data_54735,new cljs.core.Keyword(null,"value","value",305978217),attr_54742);
if(cljs.core.contains_QMARK_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(schema,attr_54742),new cljs.core.Keyword("db","tupleAttrs","db/tupleAttrs",250080092))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a], 0))," :db/tupleAttrs can\u2019t depend on another tuple attribute: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attr_54742], 0))].join(''),ex_data_54743__$1);
} else {
}

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(schema,attr_54742)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a], 0))," :db/tupleAttrs can\u2019t depend on :db.cardinality/many attribute: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attr_54742], 0))].join(''),ex_data_54743__$1);
} else {
}


var G__54746 = seq__53579_54738;
var G__54747 = chunk__53581_54739;
var G__54748 = count__53582_54740;
var G__54750 = (i__53583_54741 + (1));
seq__53579_54738 = G__54746;
chunk__53581_54739 = G__54747;
count__53582_54740 = G__54748;
i__53583_54741 = G__54750;
continue;
} else {
var temp__5804__auto___54751__$1 = cljs.core.seq(seq__53579_54738);
if(temp__5804__auto___54751__$1){
var seq__53579_54752__$1 = temp__5804__auto___54751__$1;
if(cljs.core.chunked_seq_QMARK_(seq__53579_54752__$1)){
var c__5525__auto___54753 = cljs.core.chunk_first(seq__53579_54752__$1);
var G__54754 = cljs.core.chunk_rest(seq__53579_54752__$1);
var G__54755 = c__5525__auto___54753;
var G__54756 = cljs.core.count(c__5525__auto___54753);
var G__54757 = (0);
seq__53579_54738 = G__54754;
chunk__53581_54739 = G__54755;
count__53582_54740 = G__54756;
i__53583_54741 = G__54757;
continue;
} else {
var attr_54758 = cljs.core.first(seq__53579_54752__$1);
var ex_data_54759__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ex_data_54735,new cljs.core.Keyword(null,"value","value",305978217),attr_54758);
if(cljs.core.contains_QMARK_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(schema,attr_54758),new cljs.core.Keyword("db","tupleAttrs","db/tupleAttrs",250080092))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a], 0))," :db/tupleAttrs can\u2019t depend on another tuple attribute: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attr_54758], 0))].join(''),ex_data_54759__$1);
} else {
}

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(schema,attr_54758)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a], 0))," :db/tupleAttrs can\u2019t depend on :db.cardinality/many attribute: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attr_54758], 0))].join(''),ex_data_54759__$1);
} else {
}


var G__54761 = cljs.core.next(seq__53579_54752__$1);
var G__54762 = null;
var G__54763 = (0);
var G__54764 = (0);
seq__53579_54738 = G__54761;
chunk__53581_54739 = G__54762;
count__53582_54740 = G__54763;
i__53583_54741 = G__54764;
continue;
}
} else {
}
}
break;
}
} else {
}


var G__54765 = cljs.core.next(seq__53518__$1);
var G__54766 = null;
var G__54767 = (0);
var G__54768 = (0);
seq__53518 = G__54765;
chunk__53519 = G__54766;
count__53520 = G__54767;
i__53521 = G__54768;
continue;
}
} else {
return null;
}
}
break;
}
});
datascript.db.empty_db = (function datascript$db$empty_db(schema,opts){
if((((schema == null)) || (cljs.core.map_QMARK_(schema)))){
} else {
throw (new Error("Assert failed: (or (nil? schema) (map? schema))"));
}

datascript.db.validate_schema(schema);

return datascript.db.map__GT_DB(cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"schema","schema",-1582001791),new cljs.core.Keyword(null,"max-tx","max-tx",1119558339),new cljs.core.Keyword(null,"hash","hash",-13781596),new cljs.core.Keyword(null,"aevt","aevt",-585148059),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword(null,"max-eid","max-eid",2134868075),new cljs.core.Keyword(null,"eavt","eavt",-666437073),new cljs.core.Keyword(null,"pull-attrs","pull-attrs",-974863177),new cljs.core.Keyword(null,"pull-patterns","pull-patterns",-343695048),new cljs.core.Keyword(null,"rschema","rschema",-1196134054)],[schema,(536870912),cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0)),me.tonsky.persistent_sorted_set.sorted_set_STAR_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"cmp","cmp",575646375),datascript.db.cmp_datoms_aevt)),me.tonsky.persistent_sorted_set.sorted_set_STAR_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"cmp","cmp",575646375),datascript.db.cmp_datoms_avet)),(0),me.tonsky.persistent_sorted_set.sorted_set_STAR_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"cmp","cmp",575646375),datascript.db.cmp_datoms_eavt)),datascript.lru.cache((100)),datascript.lru.cache((100)),datascript.db.rschema(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","unique","db/unique",329396388),new cljs.core.Keyword("db.unique","identity","db.unique/identity",1675950722)], null)], null),schema], 0)))]));
});
datascript.db.init_max_eid = (function datascript$db$init_max_eid(rschema,eavt,avet){
var max = (function (p1__53667_SHARP_,p2__53666_SHARP_){
if(cljs.core.truth_((function (){var and__5000__auto__ = p2__53666_SHARP_;
if(cljs.core.truth_(and__5000__auto__)){
return (p2__53666_SHARP_ > p1__53667_SHARP_);
} else {
return and__5000__auto__;
}
})())){
return p2__53666_SHARP_;
} else {
return p1__53667_SHARP_;
}
});
var max_eid = (function (){var G__53688 = me.tonsky.persistent_sorted_set.rslice.cljs$core$IFn$_invoke$arity$3(eavt,datascript.db.datom.cljs$core$IFn$_invoke$arity$4(((536870912) - (1)),null,null,(2147483647)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4((0),null,null,(536870912)));
var G__53688__$1 = (((G__53688 == null))?null:cljs.core.first(G__53688));
if((G__53688__$1 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(G__53688__$1);
}
})();
var res = max((0),max_eid);
var max_ref = (function (attr){
var G__53706 = me.tonsky.persistent_sorted_set.rslice.cljs$core$IFn$_invoke$arity$3(avet,datascript.db.datom.cljs$core$IFn$_invoke$arity$4(((536870912) - (1)),attr,((536870912) - (1)),(2147483647)),datascript.db.datom.cljs$core$IFn$_invoke$arity$4((0),attr,(0),(536870912)));
var G__53706__$1 = (((G__53706 == null))?null:cljs.core.first(G__53706));
if((G__53706__$1 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(G__53706__$1);
}
});
var refs = new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079).cljs$core$IFn$_invoke$arity$1(rschema);
var res__$1 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (res__$1,attr){
return max(res__$1,max_ref(attr));
}),res,refs);
return res__$1;
});
datascript.db.init_db = (function datascript$db$init_db(datoms,schema,opts){
var temp__5808__auto___54772 = cljs.core.first(cljs.core.drop_while.cljs$core$IFn$_invoke$arity$2(datascript.db.datom_QMARK_,datoms));
if((temp__5808__auto___54772 == null)){
} else {
var not_datom_54773 = temp__5808__auto___54772;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["init-db expects list of Datoms, got ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.type(not_datom_54773)], 0))].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"init-db","init-db",1595181278)], null));
}

datascript.db.validate_schema(schema);

var rschema = datascript.db.rschema(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","unique","db/unique",329396388),new cljs.core.Keyword("db.unique","identity","db.unique/identity",1675950722)], null)], null),schema], 0)));
var indexed = new cljs.core.Keyword("db","index","db/index",-1531680669).cljs$core$IFn$_invoke$arity$1(rschema);
var arr = (function (){var G__53765 = datoms;
if((!(me.tonsky.persistent_sorted_set.arrays.array_QMARK_(datoms)))){
return me.tonsky.persistent_sorted_set.arrays.into_array(G__53765);
} else {
return G__53765;
}
})();
var _ = me.tonsky.persistent_sorted_set.arrays.asort(arr,datascript.db.cmp_datoms_eavt_quick);
var eavt = me.tonsky.persistent_sorted_set.from_sorted_array.cljs$core$IFn$_invoke$arity$4(datascript.db.cmp_datoms_eavt,arr,arr.length,opts);
var ___$1 = me.tonsky.persistent_sorted_set.arrays.asort(arr,datascript.db.cmp_datoms_aevt_quick);
var aevt = me.tonsky.persistent_sorted_set.from_sorted_array.cljs$core$IFn$_invoke$arity$4(datascript.db.cmp_datoms_aevt,arr,arr.length,opts);
var avet_datoms = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (d){
return cljs.core.contains_QMARK_(indexed,d.a);
}),datoms);
var avet_arr = cljs.core.to_array(avet_datoms);
var ___$2 = me.tonsky.persistent_sorted_set.arrays.asort(avet_arr,datascript.db.cmp_datoms_avet_quick);
var avet = me.tonsky.persistent_sorted_set.from_sorted_array.cljs$core$IFn$_invoke$arity$4(datascript.db.cmp_datoms_avet,avet_arr,avet_arr.length,opts);
var max_eid = datascript.db.init_max_eid(rschema,eavt,avet);
var max_tx = cljs.core.transduce.cljs$core$IFn$_invoke$arity$4(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (d){
return d.datascript$db$IDatom$datom_tx$arity$1(null);
})),cljs.core.max,(536870912),eavt);
return datascript.db.map__GT_DB(cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"schema","schema",-1582001791),new cljs.core.Keyword(null,"max-tx","max-tx",1119558339),new cljs.core.Keyword(null,"hash","hash",-13781596),new cljs.core.Keyword(null,"aevt","aevt",-585148059),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword(null,"max-eid","max-eid",2134868075),new cljs.core.Keyword(null,"eavt","eavt",-666437073),new cljs.core.Keyword(null,"pull-attrs","pull-attrs",-974863177),new cljs.core.Keyword(null,"pull-patterns","pull-patterns",-343695048),new cljs.core.Keyword(null,"rschema","rschema",-1196134054)],[schema,max_tx,cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0)),aevt,avet,max_eid,eavt,datascript.lru.cache((100)),datascript.lru.cache((100)),rschema]));
});
datascript.db.restore_db = (function datascript$db$restore_db(p__53782){
var map__53786 = p__53782;
var map__53786__$1 = cljs.core.__destructure_map(map__53786);
var keys = map__53786__$1;
var schema = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__53786__$1,new cljs.core.Keyword(null,"schema","schema",-1582001791));
var eavt = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__53786__$1,new cljs.core.Keyword(null,"eavt","eavt",-666437073));
var aevt = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__53786__$1,new cljs.core.Keyword(null,"aevt","aevt",-585148059));
var avet = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__53786__$1,new cljs.core.Keyword(null,"avet","avet",1383857032));
var max_eid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__53786__$1,new cljs.core.Keyword(null,"max-eid","max-eid",2134868075));
var max_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__53786__$1,new cljs.core.Keyword(null,"max-tx","max-tx",1119558339));
return null;
});

datascript.db.restore_db = (function datascript$db$restore_db(p__53790){
var map__53791 = p__53790;
var map__53791__$1 = cljs.core.__destructure_map(map__53791);
var keys = map__53791__$1;
var schema = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__53791__$1,new cljs.core.Keyword(null,"schema","schema",-1582001791));
var eavt = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__53791__$1,new cljs.core.Keyword(null,"eavt","eavt",-666437073));
var aevt = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__53791__$1,new cljs.core.Keyword(null,"aevt","aevt",-585148059));
var avet = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__53791__$1,new cljs.core.Keyword(null,"avet","avet",1383857032));
var max_eid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__53791__$1,new cljs.core.Keyword(null,"max-eid","max-eid",2134868075));
var max_tx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__53791__$1,new cljs.core.Keyword(null,"max-tx","max-tx",1119558339));
return datascript.db.map__GT_DB(cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"schema","schema",-1582001791),new cljs.core.Keyword(null,"max-tx","max-tx",1119558339),new cljs.core.Keyword(null,"hash","hash",-13781596),new cljs.core.Keyword(null,"aevt","aevt",-585148059),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword(null,"max-eid","max-eid",2134868075),new cljs.core.Keyword(null,"eavt","eavt",-666437073),new cljs.core.Keyword(null,"pull-attrs","pull-attrs",-974863177),new cljs.core.Keyword(null,"pull-patterns","pull-patterns",-343695048),new cljs.core.Keyword(null,"rschema","rschema",-1196134054)],[schema,(function (){var or__5002__auto__ = max_tx;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (536870912);
}
})(),cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0)),aevt,avet,(function (){var or__5002__auto__ = max_eid;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})(),eavt,datascript.lru.cache((100)),datascript.lru.cache((100)),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"rschema","rschema",-1196134054).cljs$core$IFn$_invoke$arity$1(keys);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return datascript.db.rschema(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","unique","db/unique",329396388),new cljs.core.Keyword("db.unique","identity","db.unique/identity",1675950722)], null)], null),schema], 0)));
}
})()]));
});
datascript.db.with_schema = (function datascript$db$with_schema(db,schema){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db? db)"));
}

if((((schema == null)) || (cljs.core.map_QMARK_(schema)))){
} else {
throw (new Error("Assert failed: (or (nil? schema) (map? schema))"));
}

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword(null,"schema","schema",-1582001791),schema,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"rschema","rschema",-1196134054),datascript.db.rschema(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","unique","db/unique",329396388),new cljs.core.Keyword("db.unique","identity","db.unique/identity",1675950722)], null)], null),schema], 0))),new cljs.core.Keyword(null,"pull-patterns","pull-patterns",-343695048),datascript.lru.cache((100)),new cljs.core.Keyword(null,"pull-attrs","pull-attrs",-974863177),datascript.lru.cache((100)),new cljs.core.Keyword(null,"hash","hash",-13781596),cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0))], 0));
});
datascript.db.equiv_db_index = (function datascript$db$equiv_db_index(x,y){
var xs = cljs.core.seq(x);
var ys = cljs.core.seq(y);
while(true){
if((xs == null)){
return (ys == null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(xs),cljs.core.first(ys))){
var G__54779 = cljs.core.next(xs);
var G__54780 = cljs.core.next(ys);
xs = G__54779;
ys = G__54780;
continue;
} else {
return false;

}
}
break;
}
});
datascript.db.hash_db = (function datascript$db$hash_db(db){
return null;
});

datascript.db.hash_db = (function datascript$db$hash_db(db){
var h = cljs.core.deref(db.hash);
if((h === (0))){
return cljs.core.reset_BANG_(db.hash,datascript.db.combine_hashes(cljs.core.hash(db.schema),cljs.core.hash(db.eavt)));
} else {
return h;
}
});
datascript.db.hash_fdb = (function datascript$db$hash_fdb(db){
return null;
});

datascript.db.hash_fdb = (function datascript$db$hash_fdb(db){
var h = cljs.core.deref(db.hash);
var datoms = (function (){var or__5002__auto__ = datascript.db._datoms(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),null,null,null,null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentHashSet.EMPTY;
}
})();
if((h === (0))){
var datoms__$1 = (function (){var or__5002__auto__ = datascript.db._datoms(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),null,null,null,null);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentHashSet.EMPTY;
}
})();
return cljs.core.reset_BANG_(db.hash,datascript.db.combine_hashes(cljs.core.hash(datascript.db._schema(db)),cljs.core.hash_unordered_coll(datoms__$1)));
} else {
return h;
}
});
datascript.db.equiv_db = (function datascript$db$equiv_db(db,other){
return null;
});

datascript.db.equiv_db = (function datascript$db$equiv_db(db,other){
return (((((other instanceof datascript.db.DB)) || ((other instanceof datascript.db.FilteredDB)))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(datascript.db._schema(db),datascript.db._schema(other))) && (datascript.db.equiv_db_index(datascript.db._datoms(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),null,null,null,null),datascript.db._datoms(other,new cljs.core.Keyword(null,"eavt","eavt",-666437073),null,null,null,null))))));
});
datascript.db.pr_db = (function datascript$db$pr_db(db,w,opts){
return null;
});

datascript.db.pr_db = (function datascript$db$pr_db(db,w,opts){
cljs.core._write(w,"#datascript/DB {");

cljs.core._write(w,":schema ");

cljs.core.pr_writer(datascript.db._schema(db),w,opts);

cljs.core._write(w,", :datoms ");

cljs.core.pr_sequential_writer(w,(function (d,w__$1,opts__$1){
return cljs.core.pr_sequential_writer(w__$1,cljs.core.pr_writer,"["," ","]",opts__$1,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [d.e,d.a,d.v,datascript.db.datom_tx(d)], null));
}),"["," ","]",opts,datascript.db._datoms(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),null,null,null,null));

return cljs.core._write(w,"}");
});
datascript.db.db_from_reader = (function datascript$db$db_from_reader(p__53847){
var map__53848 = p__53847;
var map__53848__$1 = cljs.core.__destructure_map(map__53848);
var schema = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__53848__$1,new cljs.core.Keyword(null,"schema","schema",-1582001791));
var datoms = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__53848__$1,new cljs.core.Keyword(null,"datoms","datoms",-290874434));
return datascript.db.init_db(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__53849){
var vec__53850 = p__53849;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__53850,(0),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__53850,(1),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__53850,(2),null);
var tx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__53850,(3),null);
return datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,a,v,tx);
}),datoms),schema,cljs.core.PersistentArrayMap.EMPTY);
});
datascript.db.entid_strict = (function datascript$db$entid_strict(db,eid){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not implemented: (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.db.entid_strict),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [db,eid], null))].join(''),cljs.core.PersistentArrayMap.EMPTY);
});
datascript.db.ref_QMARK_ = (function datascript$db$ref_QMARK_(db,attr){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not implemented: (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.db.ref_QMARK_),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [db,attr], null))].join(''),cljs.core.PersistentArrayMap.EMPTY);
});
datascript.db.resolve_datom = (function datascript$db$resolve_datom(db,e,a,v,t,default_e,default_tx){
return null;
});

datascript.db.resolve_datom = (function datascript$db$resolve_datom(db,e,a,v,t,default_e,default_tx){
if((!((a == null)))){
var attr__51595__auto___54783 = a;
if((((attr__51595__auto___54783 instanceof cljs.core.Keyword)) || (typeof attr__51595__auto___54783 === 'string'))){
} else {
var at__51596__auto___54784 = (new cljs.core.List(null,new cljs.core.Symbol(null,"resolve-datom","resolve-datom",-294110827,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"db","db",-1661185010,null),(new cljs.core.List(null,e,(new cljs.core.List(null,a,(new cljs.core.List(null,v,(new cljs.core.List(null,t,null,(1),null)),(2),null)),(3),null)),(4),null)),(5),null)),(6),null));
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Bad entity attribute ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attr__51595__auto___54783], 0))," at ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([at__51596__auto___54784], 0)),", expected keyword or string"].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"attribute","attribute",-2074029119),attr__51595__auto___54783,new cljs.core.Keyword(null,"context","context",-830191113),at__51596__auto___54784,new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078)], null));
}
} else {
}

return datascript.db.datom.cljs$core$IFn$_invoke$arity$4((((!((e == null))))?datascript.db.entid_strict(db,e):default_e),a,(((((!((v == null)))) && (datascript.db.ref_QMARK_(db,a))))?datascript.db.entid_strict(db,v):v),(((!((t == null))))?datascript.db.entid_strict(db,t):default_tx));
});
datascript.db.components__GT_pattern = (function datascript$db$components__GT_pattern(db,index,c0,c1,c2,c3,default_e,default_tx){
return null;
});

datascript.db.components__GT_pattern = (function datascript$db$components__GT_pattern(db,index,c0,c1,c2,c3,default_e,default_tx){
var G__53961 = index;
var G__53961__$1 = (((G__53961 instanceof cljs.core.Keyword))?G__53961.fqn:null);
switch (G__53961__$1) {
case "eavt":
return datascript.db.resolve_datom(db,c0,c1,c2,c3,default_e,default_tx);

break;
case "aevt":
return datascript.db.resolve_datom(db,c1,c0,c2,c3,default_e,default_tx);

break;
case "avet":
return datascript.db.resolve_datom(db,c2,c0,c1,c3,default_e,default_tx);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__53961__$1)].join('')));

}
});
datascript.db.find_datom = (function datascript$db$find_datom(db,index,c0,c1,c2,c3){
datascript.db.validate_indexed(db,index,c0,c1,c2,c3);

var set = cljs.core.get.cljs$core$IFn$_invoke$arity$2(db,index);
var cmp = set.comparator;
var from = datascript.db.components__GT_pattern(db,index,c0,c1,c2,c3,(0),(536870912));
var to = datascript.db.components__GT_pattern(db,index,c0,c1,c2,c3,(2147483647),(2147483647));
var datom = (function (){var G__54007 = set;
var G__54007__$1 = (((G__54007 == null))?null:cljs.core.seq(G__54007));
var G__54007__$2 = (((G__54007__$1 == null))?null:me.tonsky.persistent_sorted_set.seek.cljs$core$IFn$_invoke$arity$2(G__54007__$1,from));
if((G__54007__$2 == null)){
return null;
} else {
return cljs.core.first(G__54007__$2);
}
})();
if((((!((datom == null)))) && (((0) <= (cmp.cljs$core$IFn$_invoke$arity$2 ? cmp.cljs$core$IFn$_invoke$arity$2(to,datom) : cmp.call(null,to,datom)))))){
return datom;
} else {
return null;
}
});

/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {cljs.core.IKVReduce}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.ICloneable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
datascript.db.TxReport = (function (db_before,db_after,tx_data,tempids,tx_meta,__meta,__extmap,__hash){
this.db_before = db_before;
this.db_after = db_after;
this.tx_data = tx_data;
this.tempids = tempids;
this.tx_meta = tx_meta;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(datascript.db.TxReport.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(datascript.db.TxReport.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k54028,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__54053 = k54028;
var G__54053__$1 = (((G__54053 instanceof cljs.core.Keyword))?G__54053.fqn:null);
switch (G__54053__$1) {
case "db-before":
return self__.db_before;

break;
case "db-after":
return self__.db_after;

break;
case "tx-data":
return self__.tx_data;

break;
case "tempids":
return self__.tempids;

break;
case "tx-meta":
return self__.tx_meta;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k54028,else__5303__auto__);

}
}));

(datascript.db.TxReport.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__54058){
var vec__54059 = p__54058;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54059,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54059,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(datascript.db.TxReport.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#datascript.db.TxReport{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"db-before","db-before",-553691536),self__.db_before],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"db-after","db-after",-571884666),self__.db_after],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"tx-data","tx-data",934159761),self__.tx_data],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"tempids","tempids",1767509089),self__.tempids],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),self__.tx_meta],null))], null),self__.__extmap));
}));

(datascript.db.TxReport.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__54027){
var self__ = this;
var G__54027__$1 = this;
return (new cljs.core.RecordIter((0),G__54027__$1,5,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"db-before","db-before",-553691536),new cljs.core.Keyword(null,"db-after","db-after",-571884666),new cljs.core.Keyword(null,"tx-data","tx-data",934159761),new cljs.core.Keyword(null,"tempids","tempids",1767509089),new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(datascript.db.TxReport.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(datascript.db.TxReport.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new datascript.db.TxReport(self__.db_before,self__.db_after,self__.tx_data,self__.tempids,self__.tx_meta,self__.__meta,self__.__extmap,self__.__hash));
}));

(datascript.db.TxReport.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (5 + cljs.core.count(self__.__extmap));
}));

(datascript.db.TxReport.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (-2022644885 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(datascript.db.TxReport.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this54037,other54038){
var self__ = this;
var this54037__$1 = this;
return (((!((other54038 == null)))) && ((((this54037__$1.constructor === other54038.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this54037__$1.db_before,other54038.db_before)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this54037__$1.db_after,other54038.db_after)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this54037__$1.tx_data,other54038.tx_data)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this54037__$1.tempids,other54038.tempids)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this54037__$1.tx_meta,other54038.tx_meta)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this54037__$1.__extmap,other54038.__extmap)))))))))))))));
}));

(datascript.db.TxReport.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"tempids","tempids",1767509089),null,new cljs.core.Keyword(null,"db-after","db-after",-571884666),null,new cljs.core.Keyword(null,"db-before","db-before",-553691536),null,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),null,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new datascript.db.TxReport(self__.db_before,self__.db_after,self__.tx_data,self__.tempids,self__.tx_meta,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(datascript.db.TxReport.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k54028){
var self__ = this;
var this__5307__auto____$1 = this;
var G__54085 = k54028;
var G__54085__$1 = (((G__54085 instanceof cljs.core.Keyword))?G__54085.fqn:null);
switch (G__54085__$1) {
case "db-before":
case "db-after":
case "tx-data":
case "tempids":
case "tx-meta":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k54028);

}
}));

(datascript.db.TxReport.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__54027){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__54090 = cljs.core.keyword_identical_QMARK_;
var expr__54091 = k__5309__auto__;
if(cljs.core.truth_((pred__54090.cljs$core$IFn$_invoke$arity$2 ? pred__54090.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"db-before","db-before",-553691536),expr__54091) : pred__54090.call(null,new cljs.core.Keyword(null,"db-before","db-before",-553691536),expr__54091)))){
return (new datascript.db.TxReport(G__54027,self__.db_after,self__.tx_data,self__.tempids,self__.tx_meta,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__54090.cljs$core$IFn$_invoke$arity$2 ? pred__54090.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"db-after","db-after",-571884666),expr__54091) : pred__54090.call(null,new cljs.core.Keyword(null,"db-after","db-after",-571884666),expr__54091)))){
return (new datascript.db.TxReport(self__.db_before,G__54027,self__.tx_data,self__.tempids,self__.tx_meta,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__54090.cljs$core$IFn$_invoke$arity$2 ? pred__54090.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tx-data","tx-data",934159761),expr__54091) : pred__54090.call(null,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),expr__54091)))){
return (new datascript.db.TxReport(self__.db_before,self__.db_after,G__54027,self__.tempids,self__.tx_meta,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__54090.cljs$core$IFn$_invoke$arity$2 ? pred__54090.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tempids","tempids",1767509089),expr__54091) : pred__54090.call(null,new cljs.core.Keyword(null,"tempids","tempids",1767509089),expr__54091)))){
return (new datascript.db.TxReport(self__.db_before,self__.db_after,self__.tx_data,G__54027,self__.tx_meta,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__54090.cljs$core$IFn$_invoke$arity$2 ? pred__54090.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),expr__54091) : pred__54090.call(null,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),expr__54091)))){
return (new datascript.db.TxReport(self__.db_before,self__.db_after,self__.tx_data,self__.tempids,G__54027,self__.__meta,self__.__extmap,null));
} else {
return (new datascript.db.TxReport(self__.db_before,self__.db_after,self__.tx_data,self__.tempids,self__.tx_meta,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__54027),null));
}
}
}
}
}
}));

(datascript.db.TxReport.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"db-before","db-before",-553691536),self__.db_before,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"db-after","db-after",-571884666),self__.db_after,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"tx-data","tx-data",934159761),self__.tx_data,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"tempids","tempids",1767509089),self__.tempids,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),self__.tx_meta,null))], null),self__.__extmap));
}));

(datascript.db.TxReport.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__54027){
var self__ = this;
var this__5299__auto____$1 = this;
return (new datascript.db.TxReport(self__.db_before,self__.db_after,self__.tx_data,self__.tempids,self__.tx_meta,G__54027,self__.__extmap,self__.__hash));
}));

(datascript.db.TxReport.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(datascript.db.TxReport.getBasis = (function (){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"db-before","db-before",1086839991,null),new cljs.core.Symbol(null,"db-after","db-after",1068646861,null),new cljs.core.Symbol(null,"tx-data","tx-data",-1720276008,null),new cljs.core.Symbol(null,"tempids","tempids",-886926680,null),new cljs.core.Symbol(null,"tx-meta","tx-meta",-1495152575,null)], null);
}));

(datascript.db.TxReport.cljs$lang$type = true);

(datascript.db.TxReport.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"datascript.db/TxReport",null,(1),null));
}));

(datascript.db.TxReport.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"datascript.db/TxReport");
}));

/**
 * Positional factory function for datascript.db/TxReport.
 */
datascript.db.__GT_TxReport = (function datascript$db$__GT_TxReport(db_before,db_after,tx_data,tempids,tx_meta){
return (new datascript.db.TxReport(db_before,db_after,tx_data,tempids,tx_meta,null,null,null));
});

/**
 * Factory function for datascript.db/TxReport, taking a map of keywords to field values.
 */
datascript.db.map__GT_TxReport = (function datascript$db$map__GT_TxReport(G__54047){
var extmap__5342__auto__ = (function (){var G__54098 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__54047,new cljs.core.Keyword(null,"db-before","db-before",-553691536),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"db-after","db-after",-571884666),new cljs.core.Keyword(null,"tx-data","tx-data",934159761),new cljs.core.Keyword(null,"tempids","tempids",1767509089),new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194)], 0));
if(cljs.core.record_QMARK_(G__54047)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__54098);
} else {
return G__54098;
}
})();
return (new datascript.db.TxReport(new cljs.core.Keyword(null,"db-before","db-before",-553691536).cljs$core$IFn$_invoke$arity$1(G__54047),new cljs.core.Keyword(null,"db-after","db-after",-571884666).cljs$core$IFn$_invoke$arity$1(G__54047),new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(G__54047),new cljs.core.Keyword(null,"tempids","tempids",1767509089).cljs$core$IFn$_invoke$arity$1(G__54047),new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194).cljs$core$IFn$_invoke$arity$1(G__54047),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

datascript.db.is_attr_QMARK_ = (function datascript$db$is_attr_QMARK_(db,attr,property){
return null;
});

datascript.db.is_attr_QMARK_ = (function datascript$db$is_attr_QMARK_(db,attr,property){
return cljs.core.contains_QMARK_(datascript.db._attrs_by(db,property),attr);
});
datascript.db.multival_QMARK_ = (function datascript$db$multival_QMARK_(db,attr){
return null;
});

datascript.db.multival_QMARK_ = (function datascript$db$multival_QMARK_(db,attr){
return datascript.db.is_attr_QMARK_(db,attr,new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234));
});
datascript.db.multi_value_QMARK_ = (function datascript$db$multi_value_QMARK_(db,attr,value){
return null;
});

datascript.db.multi_value_QMARK_ = (function datascript$db$multi_value_QMARK_(db,attr,value){
return ((datascript.db.is_attr_QMARK_(db,attr,new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234))) && (((me.tonsky.persistent_sorted_set.arrays.array_QMARK_(value)) || (((cljs.core.coll_QMARK_(value)) && ((!(cljs.core.map_QMARK_(value)))))))));
});
datascript.db.ref_QMARK_ = (function datascript$db$ref_QMARK_(db,attr){
return null;
});

datascript.db.ref_QMARK_ = (function datascript$db$ref_QMARK_(db,attr){
return datascript.db.is_attr_QMARK_(db,attr,new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079));
});
datascript.db.component_QMARK_ = (function datascript$db$component_QMARK_(db,attr){
return null;
});

datascript.db.component_QMARK_ = (function datascript$db$component_QMARK_(db,attr){
return datascript.db.is_attr_QMARK_(db,attr,new cljs.core.Keyword("db","isComponent","db/isComponent",423352398));
});
datascript.db.indexing_QMARK_ = (function datascript$db$indexing_QMARK_(db,attr){
return null;
});

datascript.db.indexing_QMARK_ = (function datascript$db$indexing_QMARK_(db,attr){
return datascript.db.is_attr_QMARK_(db,attr,new cljs.core.Keyword("db","index","db/index",-1531680669));
});
datascript.db.tuple_QMARK_ = (function datascript$db$tuple_QMARK_(db,attr){
return null;
});

datascript.db.tuple_QMARK_ = (function datascript$db$tuple_QMARK_(db,attr){
return datascript.db.is_attr_QMARK_(db,attr,new cljs.core.Keyword("db.type","tuple","db.type/tuple",938234914));
});
datascript.db.tuple_source_QMARK_ = (function datascript$db$tuple_source_QMARK_(db,attr){
return null;
});

datascript.db.tuple_source_QMARK_ = (function datascript$db$tuple_source_QMARK_(db,attr){
return datascript.db.is_attr_QMARK_(db,attr,new cljs.core.Keyword("db","attrTuples","db/attrTuples",860541631));
});
datascript.db.reverse_ref_QMARK_ = (function datascript$db$reverse_ref_QMARK_(attr){
return null;
});

datascript.db.reverse_ref_QMARK_ = (function datascript$db$reverse_ref_QMARK_(attr){
if((attr instanceof cljs.core.Keyword)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("_",cljs.core.nth.cljs$core$IFn$_invoke$arity$2(cljs.core.name(attr),(0)));
} else {
if(typeof attr === 'string'){
return cljs.core.boolean$(cljs.core.re_matches(/(?:([^\/]+)\/)?_([^\/]+)/,attr));
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Bad attribute type: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attr], 0)),", expected keyword or string"].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078),new cljs.core.Keyword(null,"attribute","attribute",-2074029119),attr], null));

}
}
});
datascript.db.reverse_ref = (function datascript$db$reverse_ref(attr){
if((attr instanceof cljs.core.Keyword)){
if(datascript.db.reverse_ref_QMARK_(attr)){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$2(cljs.core.namespace(attr),cljs.core.subs.cljs$core$IFn$_invoke$arity$2(cljs.core.name(attr),(1)));
} else {
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$2(cljs.core.namespace(attr),["_",cljs.core.name(attr)].join(''));
}
} else {
if(typeof attr === 'string'){
var vec__54123 = cljs.core.re_matches(/(?:([^\/]+)\/)?([^\/]+)/,attr);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54123,(0),null);
var ns = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54123,(1),null);
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54123,(2),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("_",cljs.core.nth.cljs$core$IFn$_invoke$arity$2(name,(0)))){
if(cljs.core.truth_(ns)){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns),"/",cljs.core.subs.cljs$core$IFn$_invoke$arity$2(name,(1))].join('');
} else {
return cljs.core.subs.cljs$core$IFn$_invoke$arity$2(name,(1));
}
} else {
if(cljs.core.truth_(ns)){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns),"/_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)].join('');
} else {
return ["_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)].join('');
}
}
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Bad attribute type: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attr], 0)),", expected keyword or string"].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078),new cljs.core.Keyword(null,"attribute","attribute",-2074029119),attr], null));

}
}
});
datascript.db.resolve_tuple_refs = (function datascript$db$resolve_tuple_refs(db,a,vs){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$3((function (a__$1,v){
if(((datascript.db.ref_QMARK_(db,a__$1)) && (cljs.core.sequential_QMARK_(v)))){
return datascript.db.entid_strict(db,v);
} else {
return v;
}
}),new cljs.core.Keyword("db","tupleAttrs","db/tupleAttrs",250080092).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(datascript.db._schema(db),a)),vs);
});
datascript.db.entid = (function datascript$db$entid(db,eid){
return null;
});

datascript.db.entid = (function datascript$db$entid(db,eid){
while(true){
if(datascript.db.db_QMARK_(db)){
} else {
throw (new Error("Assert failed: (db? db)"));
}

if(((typeof eid === 'number') && ((eid > (0))))){
if((eid > (2147483647))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Highest supported entity id is ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(2147483647)], 0)),", got ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([eid], 0))].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"entity-id","entity-id",1485898093),new cljs.core.Keyword(null,"value","value",305978217),eid], null));
} else {
return eid;
}
} else {
if(cljs.core.sequential_QMARK_(eid)){
var vec__54133 = eid;
var attr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54133,(0),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54133,(1),null);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(eid),(2))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Lookup ref should contain 2 elements: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([eid], 0))].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("lookup-ref","syntax","lookup-ref/syntax",-317304012),new cljs.core.Keyword(null,"entity-id","entity-id",1485898093),eid], null));
} else {
if((!(datascript.db.is_attr_QMARK_(db,attr,new cljs.core.Keyword("db","unique","db/unique",329396388))))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Lookup ref attribute should be marked as :db/unique: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([eid], 0))].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("lookup-ref","unique","lookup-ref/unique",-960647710),new cljs.core.Keyword(null,"entity-id","entity-id",1485898093),eid], null));
} else {
if(datascript.db.tuple_QMARK_(db,attr)){
var value_SINGLEQUOTE_ = datascript.db.resolve_tuple_refs(db,attr,value);
return new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datascript.db._datoms(db,new cljs.core.Keyword(null,"avet","avet",1383857032),attr,value_SINGLEQUOTE_,null,null)));
} else {
if((value == null)){
return null;
} else {
return new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datascript.db._datoms(db,new cljs.core.Keyword(null,"avet","avet",1383857032),attr,value,null,null)));

}
}
}
}
} else {
if(cljs.core.array_QMARK_(eid)){
var G__54822 = db;
var G__54823 = cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(eid);
db = G__54822;
eid = G__54823;
continue;
} else {
if((eid instanceof cljs.core.Keyword)){
return new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datascript.db._datoms(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("db","ident","db/ident",-737096),eid,null,null)));
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Expected number or lookup ref for entity id, got ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([eid], 0))].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("entity-id","syntax","entity-id/syntax",1921317045),new cljs.core.Keyword(null,"entity-id","entity-id",1485898093),eid], null));

}
}
}
}
break;
}
});
datascript.db.numeric_eid_exists_QMARK_ = (function datascript$db$numeric_eid_exists_QMARK_(db,eid){
return null;
});

datascript.db.numeric_eid_exists_QMARK_ = (function datascript$db$numeric_eid_exists_QMARK_(db,eid){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(eid,new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datascript.db._seek_datoms(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),eid,null,null,null))));
});
datascript.db.entid_strict = (function datascript$db$entid_strict(db,eid){
return null;
});

datascript.db.entid_strict = (function datascript$db$entid_strict(db,eid){
var or__5002__auto__ = datascript.db.entid(db,eid);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Nothing found for entity id ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([eid], 0))].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("entity-id","missing","entity-id/missing",1234588374),new cljs.core.Keyword(null,"entity-id","entity-id",1485898093),eid], null));
}
});
datascript.db.entid_some = (function datascript$db$entid_some(db,eid){
return null;
});

datascript.db.entid_some = (function datascript$db$entid_some(db,eid){
if((!((eid == null)))){
return datascript.db.entid_strict(db,eid);
} else {
return null;
}
});
datascript.db._STAR_last_auto_tempid = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0));

/**
* @constructor
 * @implements {cljs.core.IPrintWithWriter}
*/
datascript.db.AutoTempid = (function (id){
this.id = id;
this.cljs$lang$protocol_mask$partition0$ = 2147483648;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(datascript.db.AutoTempid.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (d,writer,opts){
var self__ = this;
var d__$1 = this;
return cljs.core.pr_sequential_writer(writer,cljs.core.pr_writer,"#datascript/AutoTempid ["," ","]",opts,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [self__.id], null));
}));

(datascript.db.AutoTempid.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"id","id",252129435,null)], null);
}));

(datascript.db.AutoTempid.cljs$lang$type = true);

(datascript.db.AutoTempid.cljs$lang$ctorStr = "datascript.db/AutoTempid");

(datascript.db.AutoTempid.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"datascript.db/AutoTempid");
}));

/**
 * Positional factory function for datascript.db/AutoTempid.
 */
datascript.db.__GT_AutoTempid = (function datascript$db$__GT_AutoTempid(id){
return (new datascript.db.AutoTempid(id));
});

datascript.db.auto_tempid = (function datascript$db$auto_tempid(){
return (new datascript.db.AutoTempid(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(datascript.db._STAR_last_auto_tempid,cljs.core.inc)));
});
datascript.db.auto_tempid_QMARK_ = (function datascript$db$auto_tempid_QMARK_(x){
return null;
});

datascript.db.auto_tempid_QMARK_ = (function datascript$db$auto_tempid_QMARK_(x){
return (x instanceof datascript.db.AutoTempid);
});
datascript.db.assoc_auto_tempids = (function datascript$db$assoc_auto_tempids(db,tx_data){
var iter__5480__auto__ = (function datascript$db$assoc_auto_tempids_$_iter__54151(s__54152){
return (new cljs.core.LazySeq(null,(function (){
var s__54152__$1 = s__54152;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__54152__$1);
if(temp__5804__auto__){
var s__54152__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__54152__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__54152__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__54154 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__54153 = (0);
while(true){
if((i__54153 < size__5479__auto__)){
var entity = cljs.core._nth(c__5478__auto__,i__54153);
cljs.core.chunk_append(b__54154,((cljs.core.map_QMARK_(entity))?cljs.core.reduce_kv(((function (i__54153,entity,c__5478__auto__,size__5479__auto__,b__54154,s__54152__$2,temp__5804__auto__){
return (function (entity__$1,a,v){
if((!((((a instanceof cljs.core.Keyword)) || (typeof a === 'string'))))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity__$1,a,v);
} else {
if(((datascript.db.ref_QMARK_(db,a)) && (datascript.db.multi_value_QMARK_(db,a,v)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity__$1,a,(datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2 ? datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2(db,v) : datascript.db.assoc_auto_tempids.call(null,db,v)));
} else {
if(datascript.db.ref_QMARK_(db,a)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity__$1,a,cljs.core.first((function (){var G__54157 = db;
var G__54158 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [v], null);
return (datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2 ? datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2(G__54157,G__54158) : datascript.db.assoc_auto_tempids.call(null,G__54157,G__54158));
})()));
} else {
if(((datascript.db.reverse_ref_QMARK_(a)) && (cljs.core.sequential_QMARK_(v)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity__$1,a,(datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2 ? datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2(db,v) : datascript.db.assoc_auto_tempids.call(null,db,v)));
} else {
if(datascript.db.reverse_ref_QMARK_(a)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity__$1,a,cljs.core.first((function (){var G__54159 = db;
var G__54160 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [v], null);
return (datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2 ? datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2(G__54159,G__54160) : datascript.db.assoc_auto_tempids.call(null,G__54159,G__54160));
})()));
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity__$1,a,v);

}
}
}
}
}
});})(i__54153,entity,c__5478__auto__,size__5479__auto__,b__54154,s__54152__$2,temp__5804__auto__))
,cljs.core.PersistentArrayMap.EMPTY,((cljs.core.contains_QMARK_(entity,new cljs.core.Keyword("db","id","db/id",-1388397098)))?entity:cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity,new cljs.core.Keyword("db","id","db/id",-1388397098),datascript.db.auto_tempid()))):(function (){var G__54163 = cljs.core.volatile_BANG_(null);
if((function (){var and__5000__auto__ = cljs.core.sequential_QMARK_(entity);
if(and__5000__auto__){
var vec__54164 = cljs.core.vreset_BANG_(G__54163,entity);
var op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54164,(0),null);
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54164,(1),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54164,(2),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54164,(3),null);
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","add","db/add",235286841),op)) && (((datascript.db.ref_QMARK_(db,a)) && (true))));
} else {
return and__5000__auto__;
}
})()){
var vec__54167 = cljs.core.deref(G__54163);
var op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54167,(0),null);
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54167,(1),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54167,(2),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54167,(3),null);
if(datascript.db.multi_value_QMARK_(db,a,v)){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [op,e,a,(datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2 ? datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2(db,v) : datascript.db.assoc_auto_tempids.call(null,db,v))], null);
} else {
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [op,e,a,cljs.core.first((function (){var G__54170 = db;
var G__54171 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [v], null);
return (datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2 ? datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2(G__54170,G__54171) : datascript.db.assoc_auto_tempids.call(null,G__54170,G__54171));
})())], null);
}
} else {
return entity;

}
})()));

var G__54835 = (i__54153 + (1));
i__54153 = G__54835;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__54154),datascript$db$assoc_auto_tempids_$_iter__54151(cljs.core.chunk_rest(s__54152__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__54154),null);
}
} else {
var entity = cljs.core.first(s__54152__$2);
return cljs.core.cons(((cljs.core.map_QMARK_(entity))?cljs.core.reduce_kv(((function (entity,s__54152__$2,temp__5804__auto__){
return (function (entity__$1,a,v){
if((!((((a instanceof cljs.core.Keyword)) || (typeof a === 'string'))))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity__$1,a,v);
} else {
if(((datascript.db.ref_QMARK_(db,a)) && (datascript.db.multi_value_QMARK_(db,a,v)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity__$1,a,(datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2 ? datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2(db,v) : datascript.db.assoc_auto_tempids.call(null,db,v)));
} else {
if(datascript.db.ref_QMARK_(db,a)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity__$1,a,cljs.core.first((function (){var G__54176 = db;
var G__54177 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [v], null);
return (datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2 ? datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2(G__54176,G__54177) : datascript.db.assoc_auto_tempids.call(null,G__54176,G__54177));
})()));
} else {
if(((datascript.db.reverse_ref_QMARK_(a)) && (cljs.core.sequential_QMARK_(v)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity__$1,a,(datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2 ? datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2(db,v) : datascript.db.assoc_auto_tempids.call(null,db,v)));
} else {
if(datascript.db.reverse_ref_QMARK_(a)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity__$1,a,cljs.core.first((function (){var G__54178 = db;
var G__54179 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [v], null);
return (datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2 ? datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2(G__54178,G__54179) : datascript.db.assoc_auto_tempids.call(null,G__54178,G__54179));
})()));
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity__$1,a,v);

}
}
}
}
}
});})(entity,s__54152__$2,temp__5804__auto__))
,cljs.core.PersistentArrayMap.EMPTY,((cljs.core.contains_QMARK_(entity,new cljs.core.Keyword("db","id","db/id",-1388397098)))?entity:cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity,new cljs.core.Keyword("db","id","db/id",-1388397098),datascript.db.auto_tempid()))):(function (){var G__54182 = cljs.core.volatile_BANG_(null);
if((function (){var and__5000__auto__ = cljs.core.sequential_QMARK_(entity);
if(and__5000__auto__){
var vec__54183 = cljs.core.vreset_BANG_(G__54182,entity);
var op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54183,(0),null);
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54183,(1),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54183,(2),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54183,(3),null);
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","add","db/add",235286841),op)) && (((datascript.db.ref_QMARK_(db,a)) && (true))));
} else {
return and__5000__auto__;
}
})()){
var vec__54186 = cljs.core.deref(G__54182);
var op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54186,(0),null);
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54186,(1),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54186,(2),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54186,(3),null);
if(datascript.db.multi_value_QMARK_(db,a,v)){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [op,e,a,(datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2 ? datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2(db,v) : datascript.db.assoc_auto_tempids.call(null,db,v))], null);
} else {
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [op,e,a,cljs.core.first((function (){var G__54189 = db;
var G__54190 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [v], null);
return (datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2 ? datascript.db.assoc_auto_tempids.cljs$core$IFn$_invoke$arity$2(G__54189,G__54190) : datascript.db.assoc_auto_tempids.call(null,G__54189,G__54190));
})())], null);
}
} else {
return entity;

}
})()),datascript$db$assoc_auto_tempids_$_iter__54151(cljs.core.rest(s__54152__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(tx_data);
});
datascript.db.validate_datom = (function datascript$db$validate_datom(db,datom){
if(cljs.core.truth_((function (){var and__5000__auto__ = datom.datascript$db$IDatom$datom_added$arity$1(null);
if(cljs.core.truth_(and__5000__auto__)){
return datascript.db.is_attr_QMARK_(db,datom.a,new cljs.core.Keyword("db","unique","db/unique",329396388));
} else {
return and__5000__auto__;
}
})())){
var temp__5808__auto__ = cljs.core.not_empty(datascript.db._datoms(db,new cljs.core.Keyword(null,"avet","avet",1383857032),datom.a,datom.v,null,null));
if((temp__5808__auto__ == null)){
return null;
} else {
var found = temp__5808__auto__;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Cannot add ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datom], 0))," because of unique constraint: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([found], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","unique","transact/unique",-940992320),new cljs.core.Keyword(null,"attribute","attribute",-2074029119),datom.a,new cljs.core.Keyword(null,"datom","datom",-371556090),datom], null));
}
} else {
return null;
}
});
datascript.db.current_tx = (function datascript$db$current_tx(report){
return (cljs.core.long$(new cljs.core.Keyword(null,"max-tx","max-tx",1119558339).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"db-before","db-before",-553691536).cljs$core$IFn$_invoke$arity$1(report))) + (1));
});
datascript.db.next_eid = (function datascript$db$next_eid(db){
return (cljs.core.long$(new cljs.core.Keyword(null,"max-eid","max-eid",2134868075).cljs$core$IFn$_invoke$arity$1(db)) + (1));
});
datascript.db.tx_id_QMARK_ = (function datascript$db$tx_id_QMARK_(e){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(e,new cljs.core.Keyword("db","current-tx","db/current-tx",1600722132))) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(e,":db/current-tx")) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(e,"datomic.tx")) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(e,"datascript.tx")))))));
});
datascript.db.tempid_QMARK_ = (function datascript$db$tempid_QMARK_(x){
return ((((typeof x === 'number') && ((x < (0))))) || (((typeof x === 'string') || (datascript.db.auto_tempid_QMARK_(x)))));
});
datascript.db.new_eid_QMARK_ = (function datascript$db$new_eid_QMARK_(db,eid){
return (((eid > new cljs.core.Keyword(null,"max-eid","max-eid",2134868075).cljs$core$IFn$_invoke$arity$1(db))) && ((eid < (536870912))));
});
datascript.db.advance_max_eid = (function datascript$db$advance_max_eid(db,eid){
var G__54203 = db;
if(datascript.db.new_eid_QMARK_(db,eid)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__54203,new cljs.core.Keyword(null,"max-eid","max-eid",2134868075),eid);
} else {
return G__54203;
}
});
datascript.db.allocate_eid = (function datascript$db$allocate_eid(var_args){
var G__54205 = arguments.length;
switch (G__54205) {
case 2:
return datascript.db.allocate_eid.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return datascript.db.allocate_eid.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.db.allocate_eid.cljs$core$IFn$_invoke$arity$2 = (function (report,eid){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(report,new cljs.core.Keyword(null,"db-after","db-after",-571884666),datascript.db.advance_max_eid,eid);
}));

(datascript.db.allocate_eid.cljs$core$IFn$_invoke$arity$3 = (function (report,e,eid){
var G__54207 = report;
var G__54207__$1 = ((datascript.db.tx_id_QMARK_(e))?cljs.core.update.cljs$core$IFn$_invoke$arity$6(cljs.core.update.cljs$core$IFn$_invoke$arity$5(G__54207,new cljs.core.Keyword(null,"tempids","tempids",1767509089),cljs.core.assoc,e,eid),new cljs.core.Keyword("datascript.db","reverse-tempids","datascript.db/reverse-tempids",1165824950),cljs.core.update,eid,datascript.util.conjs,e):G__54207);
var G__54207__$2 = ((datascript.db.tempid_QMARK_(e))?cljs.core.update.cljs$core$IFn$_invoke$arity$6(cljs.core.update.cljs$core$IFn$_invoke$arity$5(G__54207__$1,new cljs.core.Keyword(null,"tempids","tempids",1767509089),cljs.core.assoc,e,eid),new cljs.core.Keyword("datascript.db","reverse-tempids","datascript.db/reverse-tempids",1165824950),cljs.core.update,eid,datascript.util.conjs,e):G__54207__$1);
var G__54207__$3 = (((((!(datascript.db.tempid_QMARK_(e)))) && (datascript.db.new_eid_QMARK_(new cljs.core.Keyword(null,"db-after","db-after",-571884666).cljs$core$IFn$_invoke$arity$1(report),eid))))?cljs.core.update.cljs$core$IFn$_invoke$arity$5(G__54207__$2,new cljs.core.Keyword(null,"tempids","tempids",1767509089),cljs.core.assoc,eid,eid):G__54207__$2);
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(G__54207__$3,new cljs.core.Keyword(null,"db-after","db-after",-571884666),datascript.db.advance_max_eid,eid);

}));

(datascript.db.allocate_eid.cljs$lang$maxFixedArity = 3);

datascript.db.remove_schema = (function datascript$db$remove_schema(db,datom){
var schema = new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1(db);
var e = datom.e;
var a = datom.a;
var v = datom.v;
var a_ident = a;
var v_ident = v;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(a_ident,new cljs.core.Keyword("db","ident","db/ident",-737096))){
if(cljs.core.not((schema.cljs$core$IFn$_invoke$arity$1 ? schema.cljs$core$IFn$_invoke$arity$1(v_ident) : schema.call(null,v_ident)))){
var err_msg = ["Schema with attribute ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(v_ident)," does not exist"].join('');
var err_map = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("retract","schema","retract/schema",1546437764),new cljs.core.Keyword(null,"attribute","attribute",-2074029119),v_ident], null);
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(err_msg,err_map);
} else {
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"schema","schema",-1582001791),e], null),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2((schema.cljs$core$IFn$_invoke$arity$1 ? schema.cljs$core$IFn$_invoke$arity$1(v_ident) : schema.call(null,v_ident)),a_ident)),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"schema","schema",-1582001791)], null),(function (p1__54214_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__54214_SHARP_,v_ident);
}));
}
} else {
var temp__5802__auto__ = (schema.cljs$core$IFn$_invoke$arity$1 ? schema.cljs$core$IFn$_invoke$arity$1(e) : schema.call(null,e));
if(cljs.core.truth_(temp__5802__auto__)){
var schema_entry = temp__5802__auto__;
if(cljs.core.truth_((schema.cljs$core$IFn$_invoke$arity$1 ? schema.cljs$core$IFn$_invoke$arity$1(schema_entry) : schema.call(null,schema_entry)))){
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"schema","schema",-1582001791),schema_entry], null),(function (p1__54215_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__54215_SHARP_,a_ident);
}));
} else {
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"schema","schema",-1582001791),e], null),(function (p1__54216_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(p1__54216_SHARP_,a_ident,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([v_ident], 0));
}));
}
} else {
var err_msg = ["Schema with entity id ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e)," does not exist"].join('');
var err_map = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("retract","schema","retract/schema",1546437764),new cljs.core.Keyword(null,"entity-id","entity-id",1485898093),e,new cljs.core.Keyword(null,"attribute","attribute",-2074029119),a,new cljs.core.Keyword(null,"value","value",305978217),e], null);
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(err_msg,err_map);
}
}
});
datascript.db.get_schema = (function datascript$db$get_schema(db){
var or__5002__auto__ = new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1(db);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
});
datascript.db.get_e_schema = (function datascript$db$get_e_schema(schema,e,db_ident){
var result = (schema.cljs$core$IFn$_invoke$arity$1 ? schema.cljs$core$IFn$_invoke$arity$1(e) : schema.call(null,e));
var s = (schema.cljs$core$IFn$_invoke$arity$1 ? schema.cljs$core$IFn$_invoke$arity$1(db_ident) : schema.call(null,db_ident));
if(cljs.core.map_QMARK_(result)){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([result,s], 0));
} else {
return s;
}
});
datascript.db.update_schema = (function datascript$db$update_schema(db,datom){
var schema = datascript.db.get_schema(db);
var e = datom.e;
var a = datom.a;
var v = datom.v;
var a_ident = a;
var v_ident = v;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(a_ident,new cljs.core.Keyword("db","ident","db/ident",-737096))){
return cljs.core.assoc_in(cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"schema","schema",-1582001791),v_ident], null),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var or__5002__auto__ = datascript.db.get_e_schema(schema,e,v_ident);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})(),cljs.core.PersistentHashMap.fromArrays([a_ident],[v_ident])], 0))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"schema","schema",-1582001791),e], null),v_ident);
} else {
var temp__5802__auto__ = (schema.cljs$core$IFn$_invoke$arity$1 ? schema.cljs$core$IFn$_invoke$arity$1(e) : schema.call(null,e));
if(cljs.core.truth_(temp__5802__auto__)){
var schema_entry = temp__5802__auto__;
if(cljs.core.truth_((schema.cljs$core$IFn$_invoke$arity$1 ? schema.cljs$core$IFn$_invoke$arity$1(schema_entry) : schema.call(null,schema_entry)))){
return cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"schema","schema",-1582001791),schema_entry,a_ident], null),v_ident);
} else {
return cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"schema","schema",-1582001791),e,a_ident], null),v_ident);
}
} else {
return cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"schema","schema",-1582001791),e], null),cljs.core.PersistentHashMap.fromArrays([a_ident],[v_ident]));
}
}
});
datascript.db.update_rschema = (function datascript$db$update_rschema(db){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"rschema","rschema",-1196134054),datascript.db.rschema(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","unique","db/unique",329396388),new cljs.core.Keyword("db.unique","identity","db.unique/identity",1675950722)], null)], null),datascript.db.get_schema(db)], 0))));
});
datascript.db.with_datom = (function datascript$db$with_datom(db,datom){
datascript.db.validate_datom(db,datom);

var indexing_QMARK_ = datascript.db.indexing_QMARK_(db,datom.a);
var schema_QMARK_ = (function (){var G__54228 = datom.a;
return (datascript.schema.schema_attr_QMARK_.cljs$core$IFn$_invoke$arity$1 ? datascript.schema.schema_attr_QMARK_.cljs$core$IFn$_invoke$arity$1(G__54228) : datascript.schema.schema_attr_QMARK_.call(null,G__54228));
})();
if(cljs.core.truth_(datom.datascript$db$IDatom$datom_added$arity$1(null))){
var G__54230 = db;
var G__54230__$1 = cljs.core.update.cljs$core$IFn$_invoke$arity$5(G__54230,new cljs.core.Keyword(null,"eavt","eavt",-666437073),me.tonsky.persistent_sorted_set.conj,datom,datascript.db.cmp_datoms_eavt_quick)
;
var G__54230__$2 = cljs.core.update.cljs$core$IFn$_invoke$arity$5(G__54230__$1,new cljs.core.Keyword(null,"aevt","aevt",-585148059),me.tonsky.persistent_sorted_set.conj,datom,datascript.db.cmp_datoms_aevt_quick)
;
var G__54230__$3 = ((indexing_QMARK_)?cljs.core.update.cljs$core$IFn$_invoke$arity$5(G__54230__$2,new cljs.core.Keyword(null,"avet","avet",1383857032),me.tonsky.persistent_sorted_set.conj,datom,datascript.db.cmp_datoms_avet_quick):G__54230__$2);
var G__54230__$4 = datascript.db.advance_max_eid(G__54230__$3,datom.e)
;
var G__54230__$5 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__54230__$4,new cljs.core.Keyword(null,"hash","hash",-13781596),cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0)))
;
if(cljs.core.truth_(schema_QMARK_)){
return datascript.db.update_rschema(datascript.db.update_schema(G__54230__$5,datom));
} else {
return G__54230__$5;
}
} else {
var temp__5806__auto__ = datascript.db.fsearch(db,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [datom.e,datom.a,datom.v], null));
if((temp__5806__auto__ == null)){
return db;
} else {
var removing = temp__5806__auto__;
var G__54232 = db;
var G__54232__$1 = cljs.core.update.cljs$core$IFn$_invoke$arity$5(G__54232,new cljs.core.Keyword(null,"eavt","eavt",-666437073),me.tonsky.persistent_sorted_set.disj,removing,datascript.db.cmp_datoms_eavt_quick)
;
var G__54232__$2 = cljs.core.update.cljs$core$IFn$_invoke$arity$5(G__54232__$1,new cljs.core.Keyword(null,"aevt","aevt",-585148059),me.tonsky.persistent_sorted_set.disj,removing,datascript.db.cmp_datoms_aevt_quick)
;
var G__54232__$3 = ((indexing_QMARK_)?cljs.core.update.cljs$core$IFn$_invoke$arity$5(G__54232__$2,new cljs.core.Keyword(null,"avet","avet",1383857032),me.tonsky.persistent_sorted_set.disj,removing,datascript.db.cmp_datoms_avet_quick):G__54232__$2);
var G__54232__$4 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__54232__$3,new cljs.core.Keyword(null,"hash","hash",-13781596),cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0)))
;
if(cljs.core.truth_(schema_QMARK_)){
return datascript.db.update_rschema(datascript.db.remove_schema(G__54232__$4,datom));
} else {
return G__54232__$4;
}
}
}
});
datascript.db.queue_tuple = (function datascript$db$queue_tuple(queue,tuple,idx,db,e,a,v){
var tuple_value = (function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(queue,tuple);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datascript.db._datoms(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),e,tuple,null,null)));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.core.vec(cljs.core.repeat.cljs$core$IFn$_invoke$arity$2(cljs.core.count(new cljs.core.Keyword("db","tupleAttrs","db/tupleAttrs",250080092).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(datascript.db._schema(db),tuple))),null));
}
}
})();
var tuple_value_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(tuple_value,idx,v);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(queue,tuple,tuple_value_SINGLEQUOTE_);
});
datascript.db.queue_tuples = (function datascript$db$queue_tuples(queue,tuples,db,e,a,v){
return cljs.core.reduce_kv((function (queue__$1,tuple,idx){
return datascript.db.queue_tuple(queue__$1,tuple,idx,db,e,a,v);
}),queue,tuples);
});
datascript.db.transact_report = (function datascript$db$transact_report(report,datom){
var db = new cljs.core.Keyword(null,"db-after","db-after",-571884666).cljs$core$IFn$_invoke$arity$1(report);
var a = new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom);
var report_SINGLEQUOTE_ = cljs.core.update.cljs$core$IFn$_invoke$arity$4(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(report,new cljs.core.Keyword(null,"db-after","db-after",-571884666),datascript.db.with_datom(db,datom)),new cljs.core.Keyword(null,"tx-data","tx-data",934159761),cljs.core.conj,datom);
if(datascript.db.tuple_source_QMARK_(db,a)){
var e = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom);
var v = (cljs.core.truth_(datascript.db.datom_added(datom))?new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom):null);
var queue = (function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("datascript.db","queued-tuples","datascript.db/queued-tuples",-762852029).cljs$core$IFn$_invoke$arity$1(report_SINGLEQUOTE_),e);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})();
var tuples = cljs.core.get.cljs$core$IFn$_invoke$arity$2(datascript.db._attrs_by(db,new cljs.core.Keyword("db","attrTuples","db/attrTuples",860541631)),a);
var queue_SINGLEQUOTE_ = datascript.db.queue_tuples(queue,tuples,db,e,a,v);
return cljs.core.update.cljs$core$IFn$_invoke$arity$5(report_SINGLEQUOTE_,new cljs.core.Keyword("datascript.db","queued-tuples","datascript.db/queued-tuples",-762852029),cljs.core.assoc,e,queue_SINGLEQUOTE_);
} else {
return report_SINGLEQUOTE_;
}
});
/**
 * Returns [entity' upserts]. Upsert attributes that resolve to existing entities
 * are removed from entity, rest are kept in entity for insertion. No validation is performed.
 * 
 * upserts :: {:name  {"Ivan"  1}
 *             :email {"ivan@" 2}
 *             :alias {"abc"   3
 *                     "def"   4}}}
 */
datascript.db.resolve_upserts = (function datascript$db$resolve_upserts(db,entity){
var temp__5806__auto__ = cljs.core.not_empty(datascript.db._attrs_by(db,new cljs.core.Keyword("db.unique","identity","db.unique/identity",1675950722)));
if((temp__5806__auto__ == null)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [entity,null], null);
} else {
var idents = temp__5806__auto__;
var resolve = (function (a,v){
if((!(datascript.db.ref_QMARK_(db,a)))){
return new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datascript.db._datoms(db,new cljs.core.Keyword(null,"avet","avet",1383857032),a,v,null,null)));
} else {
if((!(datascript.db.tempid_QMARK_(v)))){
return new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datascript.db._datoms(db,new cljs.core.Keyword(null,"avet","avet",1383857032),a,datascript.db.entid(db,v),null,null)));
} else {
return null;
}
}
});
var split = (function (a,vs){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,v){
var temp__5806__auto____$1 = resolve(a,v);
if((temp__5806__auto____$1 == null)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(acc,(0),cljs.core.conj,v);
} else {
var e = temp__5806__auto____$1;
return cljs.core.update.cljs$core$IFn$_invoke$arity$5(acc,(1),cljs.core.assoc,v,e);
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.PersistentVector.EMPTY,cljs.core.PersistentArrayMap.EMPTY], null),vs);
});
return cljs.core.reduce_kv((function (p__54251,a,v){
var vec__54255 = p__54251;
var entity_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54255,(0),null);
var upserts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54255,(1),null);
var attr__51595__auto___54856 = a;
if((((attr__51595__auto___54856 instanceof cljs.core.Keyword)) || (typeof attr__51595__auto___54856 === 'string'))){
} else {
var at__51596__auto___54857 = entity;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Bad entity attribute ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attr__51595__auto___54856], 0))," at ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([at__51596__auto___54857], 0)),", expected keyword or string"].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"attribute","attribute",-2074029119),attr__51595__auto___54856,new cljs.core.Keyword(null,"context","context",-830191113),at__51596__auto___54857,new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078)], null));
}

if((v == null)){
var at__51602__auto___54858 = entity;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Cannot store nil as a value at ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([at__51602__auto___54858], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"value","value",305978217),null,new cljs.core.Keyword(null,"context","context",-830191113),at__51602__auto___54858,new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078)], null));
} else {
}

if((!(cljs.core.contains_QMARK_(idents,a)))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity_SINGLEQUOTE_,a,v),upserts], null);
} else {
if(datascript.db.multi_value_QMARK_(db,a,v)){
var vec__54261 = split(a,v);
var insert = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54261,(0),null);
var upsert = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54261,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__54264 = entity_SINGLEQUOTE_;
if((!(cljs.core.empty_QMARK_(insert)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__54264,a,insert);
} else {
return G__54264;
}
})(),(function (){var G__54265 = upserts;
if((!(cljs.core.empty_QMARK_(upsert)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__54265,a,upsert);
} else {
return G__54265;
}
})()], null);
} else {
var temp__5806__auto____$1 = resolve(a,v);
if((temp__5806__auto____$1 == null)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity_SINGLEQUOTE_,a,v),upserts], null);
} else {
var e = temp__5806__auto____$1;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [entity_SINGLEQUOTE_,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(upserts,a,cljs.core.PersistentArrayMap.createAsIfByAssoc([v,e]))], null);
}

}
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.PersistentArrayMap.EMPTY,cljs.core.PersistentArrayMap.EMPTY], null),entity);
}
});
/**
 * Throws if not all upserts point to the same entity.
 * Returns single eid that all upserts point to, or null.
 */
datascript.db.validate_upserts = (function datascript$db$validate_upserts(entity,upserts){
var upsert_ids = cljs.core.reduce_kv((function (m,a,v__GT_e){
return cljs.core.reduce_kv((function (m__$1,v,e){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m__$1,e,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [a,v], null));
}),m,v__GT_e);
}),cljs.core.PersistentArrayMap.EMPTY,upserts);
if(((2) <= cljs.core.count(upsert_ids))){
var vec__54266 = cljs.core.first(upsert_ids);
var e1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54266,(0),null);
var vec__54269 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54266,(1),null);
var a1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54269,(0),null);
var v1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54269,(1),null);
var vec__54272 = cljs.core.second(upsert_ids);
var e2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54272,(0),null);
var vec__54275 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54272,(1),null);
var a2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54275,(0),null);
var v2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54275,(1),null);
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Conflicting upserts: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [a1,v1], null)], 0))," resolves to ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([e1], 0)),", but ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [a2,v2], null)], 0))," resolves to ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([e2], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","upsert","transact/upsert",412688078),new cljs.core.Keyword(null,"assertion","assertion",-1645134882),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [e1,a1,v1], null),new cljs.core.Keyword(null,"conflict","conflict",1978796605),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [e2,a2,v2], null)], null));
} else {
var vec__54282 = cljs.core.first(upsert_ids);
var upsert_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54282,(0),null);
var vec__54285 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54282,(1),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54285,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54285,(1),null);
var eid = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity);
if((((!((upsert_id == null)))) && ((((!((eid == null)))) && ((((!(datascript.db.tempid_QMARK_(eid)))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(upsert_id,eid)))))))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Conflicting upsert: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [a,v], null)], 0))," resolves to ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([upsert_id], 0)),", but entity already has :db/id ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([eid], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","upsert","transact/upsert",412688078),new cljs.core.Keyword(null,"assertion","assertion",-1645134882),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [upsert_id,a,v], null),new cljs.core.Keyword(null,"conflict","conflict",1978796605),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),eid], null)], null));
} else {
}

return upsert_id;
}
});
datascript.db.maybe_wrap_multival = (function datascript$db$maybe_wrap_multival(db,a,vs){
if((!(((datascript.db.reverse_ref_QMARK_(a)) || (datascript.db.multival_QMARK_(db,a)))))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [vs], null);
} else {
if((!(((me.tonsky.persistent_sorted_set.arrays.array_QMARK_(vs)) || (((cljs.core.coll_QMARK_(vs)) && ((!(cljs.core.map_QMARK_(vs)))))))))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [vs], null);
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(vs),(2))) && (datascript.db.is_attr_QMARK_(db,cljs.core.first(vs),new cljs.core.Keyword("db.unique","identity","db.unique/identity",1675950722))))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [vs], null);
} else {
return vs;

}
}
}
});
datascript.db.explode = (function datascript$db$explode(db,entity){
var eid = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity);
var a_PLUS_vs = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,p__54298){
var vec__54299 = p__54298;
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54299,(0),null);
var vs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54299,(1),null);
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(acc,((datascript.db.tuple_QMARK_(db,a))?(1):(0)),cljs.core.conj,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [a,vs], null));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.PersistentVector.EMPTY,cljs.core.PersistentVector.EMPTY], null),entity));
var iter__5480__auto__ = (function datascript$db$explode_$_iter__54304(s__54305){
return (new cljs.core.LazySeq(null,(function (){
var s__54305__$1 = s__54305;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__54305__$1);
if(temp__5804__auto__){
var xs__6360__auto__ = temp__5804__auto__;
var vec__54315 = cljs.core.first(xs__6360__auto__);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54315,(0),null);
var vs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54315,(1),null);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(a,new cljs.core.Keyword("db","id","db/id",-1388397098))){
var _ = (function (){var attr__51595__auto__ = a;
if((((attr__51595__auto__ instanceof cljs.core.Keyword)) || (typeof attr__51595__auto__ === 'string'))){
return null;
} else {
var at__51596__auto__ = cljs.core.PersistentArrayMap.createAsIfByAssoc([new cljs.core.Keyword("db","id","db/id",-1388397098),eid,a,vs]);
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Bad entity attribute ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attr__51595__auto__], 0))," at ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([at__51596__auto__], 0)),", expected keyword or string"].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"attribute","attribute",-2074029119),attr__51595__auto__,new cljs.core.Keyword(null,"context","context",-830191113),at__51596__auto__,new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078)], null));
}
})();
var reverse_QMARK_ = datascript.db.reverse_ref_QMARK_(a);
var straight_a = ((reverse_QMARK_)?datascript.db.reverse_ref(a):a);
var ___$1 = ((((reverse_QMARK_) && ((!(datascript.db.ref_QMARK_(db,straight_a))))))?(function(){throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Bad attribute ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a], 0)),": reverse attribute name requires {:db/valueType :db.type/ref} in schema"].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078),new cljs.core.Keyword(null,"attribute","attribute",-2074029119),a,new cljs.core.Keyword(null,"context","context",-830191113),cljs.core.PersistentArrayMap.createAsIfByAssoc([new cljs.core.Keyword("db","id","db/id",-1388397098),eid,a,vs])], null))})():null);
var iterys__5476__auto__ = ((function (s__54305__$1,_,reverse_QMARK_,straight_a,___$1,vec__54315,a,vs,xs__6360__auto__,temp__5804__auto__,eid,a_PLUS_vs){
return (function datascript$db$explode_$_iter__54304_$_iter__54306(s__54307){
return (new cljs.core.LazySeq(null,((function (s__54305__$1,_,reverse_QMARK_,straight_a,___$1,vec__54315,a,vs,xs__6360__auto__,temp__5804__auto__,eid,a_PLUS_vs){
return (function (){
var s__54307__$1 = s__54307;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__54307__$1);
if(temp__5804__auto____$1){
var s__54307__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__54307__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__54307__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__54309 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__54308 = (0);
while(true){
if((i__54308 < size__5479__auto__)){
var v = cljs.core._nth(c__5478__auto__,i__54308);
cljs.core.chunk_append(b__54309,((((datascript.db.ref_QMARK_(db,straight_a)) && (cljs.core.map_QMARK_(v))))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(v,datascript.db.reverse_ref(a),eid):((reverse_QMARK_)?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),v,straight_a,eid], null):new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),eid,straight_a,v], null))));

var G__54877 = (i__54308 + (1));
i__54308 = G__54877;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__54309),datascript$db$explode_$_iter__54304_$_iter__54306(cljs.core.chunk_rest(s__54307__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__54309),null);
}
} else {
var v = cljs.core.first(s__54307__$2);
return cljs.core.cons(((((datascript.db.ref_QMARK_(db,straight_a)) && (cljs.core.map_QMARK_(v))))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(v,datascript.db.reverse_ref(a),eid):((reverse_QMARK_)?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),v,straight_a,eid], null):new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),eid,straight_a,v], null))),datascript$db$explode_$_iter__54304_$_iter__54306(cljs.core.rest(s__54307__$2)));
}
} else {
return null;
}
break;
}
});})(s__54305__$1,_,reverse_QMARK_,straight_a,___$1,vec__54315,a,vs,xs__6360__auto__,temp__5804__auto__,eid,a_PLUS_vs))
,null,null));
});})(s__54305__$1,_,reverse_QMARK_,straight_a,___$1,vec__54315,a,vs,xs__6360__auto__,temp__5804__auto__,eid,a_PLUS_vs))
;
var fs__5477__auto__ = cljs.core.seq(iterys__5476__auto__(datascript.db.maybe_wrap_multival(db,a,vs)));
if(fs__5477__auto__){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(fs__5477__auto__,datascript$db$explode_$_iter__54304(cljs.core.rest(s__54305__$1)));
} else {
var G__54887 = cljs.core.rest(s__54305__$1);
s__54305__$1 = G__54887;
continue;
}
} else {
var G__54888 = cljs.core.rest(s__54305__$1);
s__54305__$1 = G__54888;
continue;
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(a_PLUS_vs);
});
datascript.db.transact_add = (function datascript$db$transact_add(report,p__54332){
var vec__54333 = p__54332;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54333,(0),null);
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54333,(1),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54333,(2),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54333,(3),null);
var tx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54333,(4),null);
var ent = vec__54333;
var attr__51595__auto___54889 = a;
if((((attr__51595__auto___54889 instanceof cljs.core.Keyword)) || (typeof attr__51595__auto___54889 === 'string'))){
} else {
var at__51596__auto___54892 = ent;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Bad entity attribute ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attr__51595__auto___54889], 0))," at ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([at__51596__auto___54892], 0)),", expected keyword or string"].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"attribute","attribute",-2074029119),attr__51595__auto___54889,new cljs.core.Keyword(null,"context","context",-830191113),at__51596__auto___54892,new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078)], null));
}

if((v == null)){
var at__51602__auto___54894 = ent;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Cannot store nil as a value at ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([at__51602__auto___54894], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"value","value",305978217),null,new cljs.core.Keyword(null,"context","context",-830191113),at__51602__auto___54894,new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078)], null));
} else {
}

var tx__$1 = (function (){var or__5002__auto__ = tx;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return datascript.db.current_tx(report);
}
})();
var db = new cljs.core.Keyword(null,"db-after","db-after",-571884666).cljs$core$IFn$_invoke$arity$1(report);
var e__$1 = datascript.db.entid_strict(db,e);
var v__$1 = ((datascript.db.ref_QMARK_(db,a))?datascript.db.entid_strict(db,v):v);
var new_datom = datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e__$1,a,v__$1,tx__$1);
var multival_QMARK_ = datascript.db.multival_QMARK_(db,a);
var old_datom = ((multival_QMARK_)?datascript.db.fsearch(db,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [e__$1,a,v__$1], null)):datascript.db.fsearch(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [e__$1,a], null)));
if((old_datom == null)){
return datascript.db.transact_report(report,new_datom);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old_datom.v,v__$1)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(report,new cljs.core.Keyword("datascript.db","tx-redundant","datascript.db/tx-redundant",-1117921977),datascript.util.conjv,new_datom);
} else {
return datascript.db.transact_report(datascript.db.transact_report(report,datascript.db.datom.cljs$core$IFn$_invoke$arity$5(e__$1,a,old_datom.v,tx__$1,false)),new_datom);

}
}
});
datascript.db.transact_retract_datom = (function datascript$db$transact_retract_datom(report,d){
var tx = datascript.db.current_tx(report);
return datascript.db.transact_report(report,datascript.db.datom.cljs$core$IFn$_invoke$arity$5(d.e,d.a,d.v,tx,false));
});
datascript.db.retract_components = (function datascript$db$retract_components(db,datoms){
return cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentHashSet.EMPTY,cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (d){
return datascript.db.component_QMARK_(db,d.a);
})),cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (d){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db.fn","retractEntity","db.fn/retractEntity",-1423535441),d.v], null);
}))),datoms);
});
datascript.db.transact_tx_data_impl = (function datascript$db$transact_tx_data_impl(initial_report,initial_es){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Not implemented: (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(datascript.db.transact_tx_data_impl),clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [initial_report,initial_es], null))].join(''),cljs.core.PersistentArrayMap.EMPTY);
});
datascript.db.retry_with_tempid = (function datascript$db$retry_with_tempid(initial_report,report,es,tempid,upserted_eid){
var temp__5806__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("datascript.db","upserted-tempids","datascript.db/upserted-tempids",-1939648402).cljs$core$IFn$_invoke$arity$1(initial_report),tempid);
if((temp__5806__auto__ == null)){
var tempids_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"tempids","tempids",1767509089).cljs$core$IFn$_invoke$arity$1(report),tempid,upserted_eid);
var report_SINGLEQUOTE_ = cljs.core.update.cljs$core$IFn$_invoke$arity$5(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(initial_report,new cljs.core.Keyword(null,"tempids","tempids",1767509089),tempids_SINGLEQUOTE_),new cljs.core.Keyword("datascript.db","upserted-tempids","datascript.db/upserted-tempids",-1939648402),cljs.core.assoc,tempid,upserted_eid);

return datascript.db.transact_tx_data_impl(report_SINGLEQUOTE_,es);
} else {
var eid = temp__5806__auto__;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Conflicting upsert: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([tempid], 0))," resolves"," both to ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([upserted_eid], 0))," and ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([eid], 0))].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","upsert","transact/upsert",412688078)], null));
}
});
datascript.db.builtin_fn_QMARK_ = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword("db.fn","call","db.fn/call",-151594418),null,new cljs.core.Keyword("db","cas","db/cas",-451542322),null,new cljs.core.Keyword("db.fn","retractEntity","db.fn/retractEntity",-1423535441),null,new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),null,new cljs.core.Keyword("db","retract","db/retract",-1549825231),null,new cljs.core.Keyword("db.fn","retractAttribute","db.fn/retractAttribute",937402164),null,new cljs.core.Keyword("db.fn","cas","db.fn/cas",-379352172),null,new cljs.core.Keyword("db","add","db/add",235286841),null], null), null);
datascript.db.flush_tuples = (function datascript$db$flush_tuples(report){
var db = new cljs.core.Keyword(null,"db-after","db-after",-571884666).cljs$core$IFn$_invoke$arity$1(report);
return cljs.core.reduce_kv((function (entities,eid,tuples_PLUS_values){
return cljs.core.reduce_kv((function (entities__$1,tuple,value){
var value__$1 = ((cljs.core.every_QMARK_(cljs.core.nil_QMARK_,value))?null:value);
var current = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datascript.db._datoms(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),eid,tuple,null,null)));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value__$1,current)){
return entities__$1;
} else {
if((value__$1 == null)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(entities__$1,cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),eid,tuple,current], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("datascript.db","internal","datascript.db/internal",-249301114),true], null)));
} else {
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(entities__$1,cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),eid,tuple,value__$1], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("datascript.db","internal","datascript.db/internal",-249301114),true], null)));

}
}
}),entities,tuples_PLUS_values);
}),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword("datascript.db","queued-tuples","datascript.db/queued-tuples",-762852029).cljs$core$IFn$_invoke$arity$1(report));
});
datascript.db.check_value_tempids = (function datascript$db$check_value_tempids(report){
var temp__5802__auto__ = new cljs.core.Keyword("datascript.db","value-tempids","datascript.db/value-tempids",244806162).cljs$core$IFn$_invoke$arity$1(report);
if(cljs.core.truth_(temp__5802__auto__)){
var tempids = temp__5802__auto__;
var all_tempids = cljs.core.transient$(tempids);
var reduce_fn = (function (tempids__$1,datom){
if(cljs.core.truth_(datascript.db.datom_added(datom))){
return cljs.core.dissoc_BANG_.cljs$core$IFn$_invoke$arity$2(tempids__$1,new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(datom));
} else {
return tempids__$1;
}
});
var unused = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(reduce_fn,all_tempids,new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(report));
var unused__$1 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(reduce_fn,unused,new cljs.core.Keyword("datascript.db","tx-redundant","datascript.db/tx-redundant",-1117921977).cljs$core$IFn$_invoke$arity$1(report));
if((cljs.core.count(unused__$1) === (0))){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(report,new cljs.core.Keyword("datascript.db","value-tempids","datascript.db/value-tempids",244806162),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("datascript.db","tx-redundant","datascript.db/tx-redundant",-1117921977)], 0));
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Tempids used only as value in transaction: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.sort.cljs$core$IFn$_invoke$arity$1(cljs.core.vals(cljs.core.persistent_BANG_(unused__$1)))], 0))].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078),new cljs.core.Keyword(null,"tempids","tempids",1767509089),unused__$1], null));
}
} else {
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(report,new cljs.core.Keyword("datascript.db","value-tempids","datascript.db/value-tempids",244806162),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("datascript.db","tx-redundant","datascript.db/tx-redundant",-1117921977)], 0));
}
});
datascript.db.check_schema_update = (function datascript$db$check_schema_update(db,entity){
if(cljs.core.truth_(datascript.schema.schema_entity_QMARK_(entity))){
if(((cljs.core.contains_QMARK_(entity,new cljs.core.Keyword("db","ident","db/ident",-737096))) && (datascript.schema.is_system_keyword_QMARK_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(entity))))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Using namespace 'db' for attribute identifiers is not allowed",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","schema","transact/schema",1426844139),new cljs.core.Keyword(null,"entity","entity",-450970276),entity], null));
} else {
}

if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(entity);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(entity);
}
})())){
if(cljs.core.truth_(datascript.schema.schema_QMARK_(entity))){
return null;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Incomplete schema transaction attributes, expected :db/ident, :db/cardinality",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","schema","transact/schema",1426844139),new cljs.core.Keyword(null,"entity","entity",-450970276),entity], null));
}
} else {
return null;
}
} else {
return null;
}
});
datascript.db.transact_tx_data_impl = (function datascript$db$transact_tx_data_impl(initial_report,initial_es){
return null;
});

datascript.db.transact_tx_data_impl = (function datascript$db$transact_tx_data_impl(initial_report,initial_es){
var initial_report_SINGLEQUOTE_ = initial_report;
var has_tuples_QMARK_ = (!(cljs.core.empty_QMARK_(datascript.db._attrs_by(new cljs.core.Keyword(null,"db-after","db-after",-571884666).cljs$core$IFn$_invoke$arity$1(initial_report),new cljs.core.Keyword("db.type","tuple","db.type/tuple",938234914)))));
var initial_es_SINGLEQUOTE_ = ((has_tuples_QMARK_)?cljs.core.interleave.cljs$core$IFn$_invoke$arity$2(initial_es,cljs.core.repeat.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("datascript.db","flush-tuples","datascript.db/flush-tuples",-797350002))):initial_es);
var report = initial_report_SINGLEQUOTE_;
var es = initial_es_SINGLEQUOTE_;
while(true){

if(cljs.core.empty_QMARK_(es)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$5(cljs.core.update.cljs$core$IFn$_invoke$arity$5(cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(datascript.db.check_value_tempids(report),new cljs.core.Keyword("datascript.db","upserted-tempids","datascript.db/upserted-tempids",-1939648402)),new cljs.core.Keyword("datascript.db","reverse-tempids","datascript.db/reverse-tempids",1165824950)),new cljs.core.Keyword(null,"tempids","tempids",1767509089),((function (report,es,initial_report_SINGLEQUOTE_,has_tuples_QMARK_,initial_es_SINGLEQUOTE_){
return (function (p1__54382_SHARP_){
return datascript.util.removem(datascript.db.auto_tempid_QMARK_,p1__54382_SHARP_);
});})(report,es,initial_report_SINGLEQUOTE_,has_tuples_QMARK_,initial_es_SINGLEQUOTE_))
),new cljs.core.Keyword(null,"tempids","tempids",1767509089),cljs.core.assoc,new cljs.core.Keyword("db","current-tx","db/current-tx",1600722132),datascript.db.current_tx(report)),new cljs.core.Keyword(null,"db-after","db-after",-571884666),cljs.core.update,new cljs.core.Keyword(null,"max-tx","max-tx",1119558339),cljs.core.inc);
} else {
var vec__54445 = es;
var seq__54446 = cljs.core.seq(vec__54445);
var first__54447 = cljs.core.first(seq__54446);
var seq__54446__$1 = cljs.core.next(seq__54446);
var entity = first__54447;
var entities = seq__54446__$1;
if((entity == null)){
var G__54947 = report;
var G__54948 = entities;
report = G__54947;
es = G__54948;
continue;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("datascript.db","flush-tuples","datascript.db/flush-tuples",-797350002),entity)){
if(cljs.core.contains_QMARK_(report,new cljs.core.Keyword("datascript.db","queued-tuples","datascript.db/queued-tuples",-762852029))){
var G__54951 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(report,new cljs.core.Keyword("datascript.db","queued-tuples","datascript.db/queued-tuples",-762852029));
var G__54952 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(datascript.db.flush_tuples(report),entities);
report = G__54951;
es = G__54952;
continue;
} else {
var G__54953 = report;
var G__54954 = entities;
report = G__54953;
es = G__54954;
continue;
}
} else {
var db = new cljs.core.Keyword(null,"db-after","db-after",-571884666).cljs$core$IFn$_invoke$arity$1(report);
var tempids = new cljs.core.Keyword(null,"tempids","tempids",1767509089).cljs$core$IFn$_invoke$arity$1(report);
if(cljs.core.map_QMARK_(entity)){
var old_eid = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity);
datascript.db.check_schema_update(db,entity);

if(datascript.db.tx_id_QMARK_(old_eid)){
var id = datascript.db.current_tx(report);
var G__54958 = datascript.db.allocate_eid.cljs$core$IFn$_invoke$arity$3(report,old_eid,id);
var G__54959 = cljs.core.cons(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity,new cljs.core.Keyword("db","id","db/id",-1388397098),id),entities);
report = G__54958;
es = G__54959;
continue;
} else {
if(cljs.core.sequential_QMARK_(old_eid)){
var id = datascript.db.entid_strict(db,old_eid);
var G__54960 = report;
var G__54961 = cljs.core.cons(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity,new cljs.core.Keyword("db","id","db/id",-1388397098),id),entities);
report = G__54960;
es = G__54961;
continue;
} else {
var vec__54449 = datascript.db.resolve_upserts(db,entity);
var entity_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54449,(0),null);
var upserts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54449,(1),null);
var upserted_eid = datascript.db.validate_upserts(entity_SINGLEQUOTE_,upserts);
if((!((upserted_eid == null)))){
if(((datascript.db.tempid_QMARK_(old_eid)) && (((cljs.core.contains_QMARK_(tempids,old_eid)) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(upserted_eid,cljs.core.get.cljs$core$IFn$_invoke$arity$2(tempids,old_eid))))))){
return datascript.db.retry_with_tempid(initial_report,report,initial_es,old_eid,upserted_eid);
} else {
var G__54963 = cljs.core.update.cljs$core$IFn$_invoke$arity$4(datascript.db.allocate_eid.cljs$core$IFn$_invoke$arity$3(report,old_eid,upserted_eid),new cljs.core.Keyword("datascript.db","tx-redundant","datascript.db/tx-redundant",-1117921977),datascript.util.conjv,datascript.db.datom.cljs$core$IFn$_invoke$arity$4(upserted_eid,null,null,(536870912)));
var G__54964 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(datascript.db.explode(db,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity_SINGLEQUOTE_,new cljs.core.Keyword("db","id","db/id",-1388397098),upserted_eid)),entities);
report = G__54963;
es = G__54964;
continue;
}
} else {
if(((typeof old_eid === 'number') || ((((old_eid == null)) || (((typeof old_eid === 'string') || (datascript.db.auto_tempid_QMARK_(old_eid)))))))){
var G__54965 = report;
var G__54966 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(datascript.db.explode(db,entity),entities);
report = G__54965;
es = G__54966;
continue;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Expected number, string or lookup ref for :db/id, got ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([old_eid], 0))].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("entity-id","syntax","entity-id/syntax",1921317045),new cljs.core.Keyword(null,"entity","entity",-450970276),entity], null));

}
}
}
}
} else {
if(cljs.core.sequential_QMARK_(entity)){
var vec__54454 = entity;
var op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54454,(0),null);
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54454,(1),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54454,(2),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54454,(3),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(op,new cljs.core.Keyword("db.fn","call","db.fn/call",-151594418))){
var vec__54457 = entity;
var seq__54458 = cljs.core.seq(vec__54457);
var first__54459 = cljs.core.first(seq__54458);
var seq__54458__$1 = cljs.core.next(seq__54458);
var _ = first__54459;
var first__54459__$1 = cljs.core.first(seq__54458__$1);
var seq__54458__$2 = cljs.core.next(seq__54458__$1);
var f = first__54459__$1;
var args = seq__54458__$2;
var G__54980 = report;
var G__54981 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(datascript.db.assoc_auto_tempids(db,cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f,db,args)),entities);
report = G__54980;
es = G__54981;
continue;
} else {
if((((op instanceof cljs.core.Keyword)) && (((cljs.core.not((datascript.db.builtin_fn_QMARK_.cljs$core$IFn$_invoke$arity$1 ? datascript.db.builtin_fn_QMARK_.cljs$core$IFn$_invoke$arity$1(op) : datascript.db.builtin_fn_QMARK_.call(null,op)))) && (true))))){
var temp__5806__auto__ = datascript.db.entid(db,op);
if((temp__5806__auto__ == null)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Can\u2019t find entity for transaction fn ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([op], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078),new cljs.core.Keyword(null,"operation","operation",-1267664310),new cljs.core.Keyword("db.fn","call","db.fn/call",-151594418),new cljs.core.Keyword(null,"tx-data","tx-data",934159761),entity], null));
} else {
var ident = temp__5806__auto__;
var fun = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datascript.db.fsearch(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [ident,new cljs.core.Keyword("db","fn","db/fn",-1175261470)], null)));
var args = cljs.core.next(entity);
if(cljs.core.fn_QMARK_(fun)){
var G__54984 = report;
var G__54985 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.apply.cljs$core$IFn$_invoke$arity$3(fun,db,args),entities);
report = G__54984;
es = G__54985;
continue;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Entity ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([op], 0))," expected to have :db/fn attribute with fn? value"].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078),new cljs.core.Keyword(null,"operation","operation",-1267664310),new cljs.core.Keyword("db.fn","call","db.fn/call",-151594418),new cljs.core.Keyword(null,"tx-data","tx-data",934159761),entity], null));
}
}
} else {
if(((datascript.db.tempid_QMARK_(e)) && (((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(op,new cljs.core.Keyword("db","add","db/add",235286841))) && (true))))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Can't use tempid in '",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([entity], 0)),"'. Tempids are allowed in :db/add only"].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078),new cljs.core.Keyword(null,"op","op",-1882987955),entity], null));
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(op,new cljs.core.Keyword("db.fn","cas","db.fn/cas",-379352172))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(op,new cljs.core.Keyword("db","cas","db/cas",-451542322))))){
var vec__54472 = entity;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54472,(0),null);
var e__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54472,(1),null);
var a__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54472,(2),null);
var ov = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54472,(3),null);
var nv = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54472,(4),null);
var e__$2 = datascript.db.entid_strict(db,e__$1);
var ___$1 = (function (){var attr__51595__auto__ = a__$1;
if((((attr__51595__auto__ instanceof cljs.core.Keyword)) || (typeof attr__51595__auto__ === 'string'))){
return null;
} else {
var at__51596__auto__ = entity;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Bad entity attribute ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attr__51595__auto__], 0))," at ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([at__51596__auto__], 0)),", expected keyword or string"].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"attribute","attribute",-2074029119),attr__51595__auto__,new cljs.core.Keyword(null,"context","context",-830191113),at__51596__auto__,new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078)], null));
}
})();
var ov__$1 = ((datascript.db.ref_QMARK_(db,a__$1))?datascript.db.entid_strict(db,ov):ov);
var nv__$1 = ((datascript.db.ref_QMARK_(db,a__$1))?datascript.db.entid_strict(db,nv):nv);
var ___$2 = (((nv__$1 == null))?(function (){var at__51602__auto__ = entity;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Cannot store nil as a value at ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([at__51602__auto__], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"value","value",305978217),null,new cljs.core.Keyword(null,"context","context",-830191113),at__51602__auto__,new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078)], null));
})():null);
var datoms = cljs.core.vec(datascript.db._search(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [e__$2,a__$1], null)));
if(datascript.db.multival_QMARK_(db,a__$1)){
if(cljs.core.truth_(cljs.core.some(((function (report,es,vec__54472,_,e__$1,a__$1,ov,nv,e__$2,___$1,ov__$1,nv__$1,___$2,datoms,vec__54454,op,e,a,v,db,tempids,vec__54445,seq__54446,first__54447,seq__54446__$1,entity,entities,initial_report_SINGLEQUOTE_,has_tuples_QMARK_,initial_es_SINGLEQUOTE_){
return (function (d){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(d.v,ov__$1);
});})(report,es,vec__54472,_,e__$1,a__$1,ov,nv,e__$2,___$1,ov__$1,nv__$1,___$2,datoms,vec__54454,op,e,a,v,db,tempids,vec__54445,seq__54446,first__54447,seq__54446__$1,entity,entities,initial_report_SINGLEQUOTE_,has_tuples_QMARK_,initial_es_SINGLEQUOTE_))
,datoms))){
var G__54995 = datascript.db.transact_add(report,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),e__$2,a__$1,nv__$1], null));
var G__54996 = entities;
report = G__54995;
es = G__54996;
continue;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([":db.fn/cas failed on datom [",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([e__$2], 0))," ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a__$1], 0))," ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"v","v",21465059),datoms)], 0)),"], expected ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([ov__$1], 0))].join(''),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","cas","transact/cas",816687170),new cljs.core.Keyword(null,"old","old",-1825222690),datoms,new cljs.core.Keyword(null,"expected","expected",1583670997),ov__$1,new cljs.core.Keyword(null,"new","new",-2085437848),nv__$1], null));
}
} else {
var v__$1 = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datoms));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v__$1,ov__$1)){
var G__54998 = datascript.db.transact_add(report,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),e__$2,a__$1,nv__$1], null));
var G__54999 = entities;
report = G__54998;
es = G__54999;
continue;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2([":db.fn/cas failed on datom [",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([e__$2], 0))," ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([a__$1], 0))," ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([v__$1], 0)),"], expected ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([ov__$1], 0))].join(''),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","cas","transact/cas",816687170),new cljs.core.Keyword(null,"old","old",-1825222690),cljs.core.first(datoms),new cljs.core.Keyword(null,"expected","expected",1583670997),ov__$1,new cljs.core.Keyword(null,"new","new",-2085437848),nv__$1], null));
}
}
} else {
if(datascript.db.tx_id_QMARK_(e)){
var G__55001 = datascript.db.allocate_eid.cljs$core$IFn$_invoke$arity$3(report,e,datascript.db.current_tx(report));
var G__55002 = cljs.core.cons(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [op,datascript.db.current_tx(report),a,v], null),entities);
report = G__55001;
es = G__55002;
continue;
} else {
if(((datascript.db.ref_QMARK_(db,a)) && (((datascript.db.tx_id_QMARK_(v)) && (true))))){
var G__55005 = datascript.db.allocate_eid.cljs$core$IFn$_invoke$arity$3(report,v,datascript.db.current_tx(report));
var G__55006 = cljs.core.cons(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [op,e,a,datascript.db.current_tx(report)], null),entities);
report = G__55005;
es = G__55006;
continue;
} else {
if(((datascript.db.ref_QMARK_(db,a)) && (((datascript.db.tempid_QMARK_(v)) && (true))))){
var temp__5806__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(tempids,v);
if((temp__5806__auto__ == null)){
var resolved = datascript.db.next_eid(db);
var report_SINGLEQUOTE_ = cljs.core.update.cljs$core$IFn$_invoke$arity$5(datascript.db.allocate_eid.cljs$core$IFn$_invoke$arity$3(report,v,resolved),new cljs.core.Keyword("datascript.db","value-tempids","datascript.db/value-tempids",244806162),cljs.core.assoc,resolved,v);
var G__55010 = report_SINGLEQUOTE_;
var G__55011 = es;
report = G__55010;
es = G__55011;
continue;
} else {
var resolved = temp__5806__auto__;
var report_SINGLEQUOTE_ = cljs.core.update.cljs$core$IFn$_invoke$arity$5(report,new cljs.core.Keyword("datascript.db","value-tempids","datascript.db/value-tempids",244806162),cljs.core.assoc,resolved,v);
var G__55013 = report_SINGLEQUOTE_;
var G__55014 = cljs.core.cons(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [op,e,a,resolved], null),entities);
report = G__55013;
es = G__55014;
continue;
}
} else {
var G__54479 = cljs.core.volatile_BANG_(null);
if((function (){var and__5000__auto__ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(op,new cljs.core.Keyword("db","add","db/add",235286841))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(op,new cljs.core.Keyword("db","retract","db/retract",-1549825231))));
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.not(new cljs.core.Keyword("datascript.db","internal","datascript.db/internal",-249301114).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(entity)));
if(and__5000__auto____$1){
var and__5000__auto____$2 = datascript.db.tuple_QMARK_(db,a);
if(and__5000__auto____$2){
var v_SINGLEQUOTE_ = cljs.core.vreset_BANG_(G__54479,datascript.db.resolve_tuple_refs(db,a,v));
return ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(v,v_SINGLEQUOTE_)) && (true));
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})()){
var v_SINGLEQUOTE_ = cljs.core.deref(G__54479);
var G__55015 = report;
var G__55016 = cljs.core.cons(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [op,e,a,v_SINGLEQUOTE_], null),entities);
report = G__55015;
es = G__55016;
continue;
} else {
if(datascript.db.tempid_QMARK_(e)){
var upserted_eid = ((datascript.db.is_attr_QMARK_(db,a,new cljs.core.Keyword("db.unique","identity","db.unique/identity",1675950722)))?new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datascript.db._datoms(db,new cljs.core.Keyword(null,"avet","avet",1383857032),a,v,null,null))):null);
var allocated_eid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(tempids,e);
if(cljs.core.truth_((function (){var and__5000__auto__ = upserted_eid;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = allocated_eid;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(upserted_eid,allocated_eid);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return datascript.db.retry_with_tempid(initial_report,report,initial_es,e,upserted_eid);
} else {
var eid = (function (){var or__5002__auto__ = upserted_eid;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = allocated_eid;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return datascript.db.next_eid(db);
}
}
})();
var G__55017 = datascript.db.allocate_eid.cljs$core$IFn$_invoke$arity$3(report,e,eid);
var G__55018 = cljs.core.cons(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [op,eid,a,v], null),entities);
report = G__55017;
es = G__55018;
continue;
}
} else {
var G__54481 = cljs.core.volatile_BANG_(null);
if(cljs.core.truth_((function (){var and__5000__auto__ = datascript.db.is_attr_QMARK_(db,a,new cljs.core.Keyword("db.unique","identity","db.unique/identity",1675950722));
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.contains_QMARK_(new cljs.core.Keyword("datascript.db","reverse-tempids","datascript.db/reverse-tempids",1165824950).cljs$core$IFn$_invoke$arity$1(report),e);
if(and__5000__auto____$1){
var upserted_eid = cljs.core.vreset_BANG_(G__54481,new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datascript.db._datoms(db,new cljs.core.Keyword(null,"avet","avet",1383857032),a,v,null,null))));
var and__5000__auto____$2 = e;
if(cljs.core.truth_(and__5000__auto____$2)){
var and__5000__auto____$3 = upserted_eid;
if(cljs.core.truth_(and__5000__auto____$3)){
return ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(e,upserted_eid)) && (true));
} else {
return and__5000__auto____$3;
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
})())){
var upserted_eid = cljs.core.deref(G__54481);
var tempids__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("datascript.db","reverse-tempids","datascript.db/reverse-tempids",1165824950).cljs$core$IFn$_invoke$arity$1(report),e);
var tempid = datascript.util.find(((function (report,es,tempids__$1,upserted_eid,G__54481,G__54479,vec__54454,op,e,a,v,db,tempids,vec__54445,seq__54446,first__54447,seq__54446__$1,entity,entities,initial_report_SINGLEQUOTE_,has_tuples_QMARK_,initial_es_SINGLEQUOTE_){
return (function (p1__54388_SHARP_){
return (!(cljs.core.contains_QMARK_(new cljs.core.Keyword("datascript.db","upserted-tempids","datascript.db/upserted-tempids",-1939648402).cljs$core$IFn$_invoke$arity$1(report),p1__54388_SHARP_)));
});})(report,es,tempids__$1,upserted_eid,G__54481,G__54479,vec__54454,op,e,a,v,db,tempids,vec__54445,seq__54446,first__54447,seq__54446__$1,entity,entities,initial_report_SINGLEQUOTE_,has_tuples_QMARK_,initial_es_SINGLEQUOTE_))
,tempids__$1);
if(cljs.core.truth_(tempid)){
return datascript.db.retry_with_tempid(initial_report,report,initial_es,tempid,upserted_eid);
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Conflicting upsert: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([e], 0))," resolves to ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([upserted_eid], 0))," via ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([entity], 0))].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","upsert","transact/upsert",412688078)], null));
}
} else {
if(((cljs.core.not(new cljs.core.Keyword("datascript.db","internal","datascript.db/internal",-249301114).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(entity)))) && (((datascript.db.tuple_QMARK_(db,a)) && (true))))){
var tuple_attrs = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"schema","schema",-1582001791),a,new cljs.core.Keyword("db","tupleAttrs","db/tupleAttrs",250080092)], null));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(tuple_attrs),cljs.core.count(v))) && (((cljs.core.every_QMARK_(cljs.core.some_QMARK_,v)) && (cljs.core.every_QMARK_(((function (report,es,tuple_attrs,G__54481,G__54479,vec__54454,op,e,a,v,db,tempids,vec__54445,seq__54446,first__54447,seq__54446__$1,entity,entities,initial_report_SINGLEQUOTE_,has_tuples_QMARK_,initial_es_SINGLEQUOTE_){
return (function (p__54483){
var vec__54484 = p__54483;
var tuple_attr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54484,(0),null);
var tuple_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54484,(1),null);
var db_value = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datascript.db._datoms(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),e,tuple_attr,null,null)));
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tuple_value,db_value);
});})(report,es,tuple_attrs,G__54481,G__54479,vec__54454,op,e,a,v,db,tempids,vec__54445,seq__54446,first__54447,seq__54446__$1,entity,entities,initial_report_SINGLEQUOTE_,has_tuples_QMARK_,initial_es_SINGLEQUOTE_))
,cljs.core.map.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,tuple_attrs,v))))))){
var G__55024 = report;
var G__55025 = entities;
report = G__55024;
es = G__55025;
continue;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Can\u2019t modify tuple attrs directly: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([entity], 0))].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078),new cljs.core.Keyword(null,"tx-data","tx-data",934159761),entity], null));
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(op,new cljs.core.Keyword("db","add","db/add",235286841))){
var G__55028 = datascript.db.transact_add(report,entity);
var G__55029 = entities;
report = G__55028;
es = G__55029;
continue;
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(op,new cljs.core.Keyword("db","retract","db/retract",-1549825231))) && ((((!((v == null)))) && (true))))){
var temp__5806__auto__ = datascript.db.entid(db,e);
if((temp__5806__auto__ == null)){
var G__55030 = report;
var G__55031 = entities;
report = G__55030;
es = G__55031;
continue;
} else {
var e__$1 = temp__5806__auto__;
var v__$1 = ((datascript.db.ref_QMARK_(db,a))?datascript.db.entid_strict(db,v):v);
var attr__51595__auto___55034 = a;
if((((attr__51595__auto___55034 instanceof cljs.core.Keyword)) || (typeof attr__51595__auto___55034 === 'string'))){
} else {
var at__51596__auto___55038 = entity;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Bad entity attribute ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attr__51595__auto___55034], 0))," at ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([at__51596__auto___55038], 0)),", expected keyword or string"].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"attribute","attribute",-2074029119),attr__51595__auto___55034,new cljs.core.Keyword(null,"context","context",-830191113),at__51596__auto___55038,new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078)], null));
}

if((v__$1 == null)){
var at__51602__auto___55045 = entity;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Cannot store nil as a value at ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([at__51602__auto___55045], 0))].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"value","value",305978217),null,new cljs.core.Keyword(null,"context","context",-830191113),at__51602__auto___55045,new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078)], null));
} else {
}

var temp__5806__auto____$1 = datascript.db.fsearch(db,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [e__$1,a,v__$1], null));
if((temp__5806__auto____$1 == null)){
var G__55047 = report;
var G__55048 = entities;
report = G__55047;
es = G__55048;
continue;
} else {
var old_datom = temp__5806__auto____$1;
var G__55050 = datascript.db.transact_retract_datom(report,old_datom);
var G__55051 = entities;
report = G__55050;
es = G__55051;
continue;
}
}
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(op,new cljs.core.Keyword("db.fn","retractAttribute","db.fn/retractAttribute",937402164))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(op,new cljs.core.Keyword("db","retract","db/retract",-1549825231))))){
var temp__5806__auto__ = datascript.db.entid(db,e);
if((temp__5806__auto__ == null)){
var G__55052 = report;
var G__55053 = entities;
report = G__55052;
es = G__55053;
continue;
} else {
var e__$1 = temp__5806__auto__;
var _ = (function (){var attr__51595__auto__ = a;
if((((attr__51595__auto__ instanceof cljs.core.Keyword)) || (typeof attr__51595__auto__ === 'string'))){
return null;
} else {
var at__51596__auto__ = entity;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Bad entity attribute ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([attr__51595__auto__], 0))," at ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([at__51596__auto__], 0)),", expected keyword or string"].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"attribute","attribute",-2074029119),attr__51595__auto__,new cljs.core.Keyword(null,"context","context",-830191113),at__51596__auto__,new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078)], null));
}
})();
var datoms = cljs.core.vec(datascript.db._search(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [e__$1,a], null)));
var G__55054 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(datascript.db.transact_retract_datom,report,datoms);
var G__55055 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(datascript.db.retract_components(db,datoms),entities);
report = G__55054;
es = G__55055;
continue;
}
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(op,new cljs.core.Keyword("db.fn","retractEntity","db.fn/retractEntity",-1423535441))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(op,new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935))))){
var temp__5806__auto__ = datascript.db.entid(db,e);
if((temp__5806__auto__ == null)){
var G__55056 = report;
var G__55057 = entities;
report = G__55056;
es = G__55057;
continue;
} else {
var e__$1 = temp__5806__auto__;
var e_datoms = cljs.core.vec(datascript.db._search(db,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [e__$1], null)));
var v_datoms = cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(((function (report,es,e_datoms,e__$1,temp__5806__auto__,G__54481,G__54479,vec__54454,op,e,a,v,db,tempids,vec__54445,seq__54446,first__54447,seq__54446__$1,entity,entities,initial_report_SINGLEQUOTE_,has_tuples_QMARK_,initial_es_SINGLEQUOTE_){
return (function (a__$1){
return datascript.db._search(db,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,a__$1,e__$1], null));
});})(report,es,e_datoms,e__$1,temp__5806__auto__,G__54481,G__54479,vec__54454,op,e,a,v,db,tempids,vec__54445,seq__54446,first__54447,seq__54446__$1,entity,entities,initial_report_SINGLEQUOTE_,has_tuples_QMARK_,initial_es_SINGLEQUOTE_))
,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datascript.db._attrs_by(db,new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079))], 0)));
var G__55060 = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(datascript.db.transact_retract_datom,report,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(e_datoms,v_datoms));
var G__55061 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(datascript.db.retract_components(db,e_datoms),entities);
report = G__55060;
es = G__55061;
continue;
}
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Unknown operation at ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([entity], 0)),", expected :db/add, :db/retract, :db.fn/call, :db.fn/retractAttribute, :db.fn/retractEntity or an ident corresponding to an installed transaction function (e.g. {:db/ident <keyword> :db/fn <Ifn>}, usage of :db/ident requires {:db/unique :db.unique/identity} in schema)"].join(''),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078),new cljs.core.Keyword(null,"operation","operation",-1267664310),op,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),entity], null));

}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
} else {
if(datascript.db.datom_QMARK_(entity)){
var vec__54487 = entity;
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54487,(0),null);
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54487,(1),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54487,(2),null);
var tx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54487,(3),null);
var added = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__54487,(4),null);
if(cljs.core.truth_(added)){
var G__55062 = datascript.db.transact_add(report,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),e,a,v,tx], null));
var G__55063 = entities;
report = G__55062;
es = G__55063;
continue;
} else {
var G__55064 = report;
var G__55065 = cljs.core.cons(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),e,a,v], null),entities);
report = G__55064;
es = G__55065;
continue;
}
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Bad entity type at ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([entity], 0)),", expected map or vector"].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078),new cljs.core.Keyword(null,"tx-data","tx-data",934159761),entity], null));

}
}
}
}
}
}
break;
}
});
datascript.db.transact_tx_data = (function datascript$db$transact_tx_data(report,es){
if((((es == null)) || (cljs.core.sequential_QMARK_(es)))){
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Bad transaction data ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([es], 0)),", expected sequential collection"].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword("transact","syntax","transact/syntax",-299207078),new cljs.core.Keyword(null,"tx-data","tx-data",934159761),es], null));
}

var es_SINGLEQUOTE_ = datascript.db.assoc_auto_tempids(new cljs.core.Keyword(null,"db-before","db-before",-553691536).cljs$core$IFn$_invoke$arity$1(report),es);
return datascript.db.transact_tx_data_impl(report,es_SINGLEQUOTE_);
});

//# sourceMappingURL=datascript.db.js.map
