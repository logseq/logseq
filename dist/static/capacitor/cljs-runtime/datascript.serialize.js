goog.provide('datascript.serialize');
datascript.serialize.marker_kw = (0);
datascript.serialize.marker_other = (1);
datascript.serialize.marker_inf = (2);
datascript.serialize.marker_minus_inf = (3);
datascript.serialize.marker_nan = (4);
datascript.serialize.if_cljs = (function datascript$serialize$if_cljs(env,then,else$){
if(cljs.core.truth_(new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(env))){
return then;
} else {
return else$;
}
});
datascript.serialize.array_get = (function datascript$serialize$array_get(d,i){
if(cljs.core.array_QMARK_(d)){
return (d[i]);
} else {
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(d,i);
}
});
datascript.serialize.dict_get = (function datascript$serialize$dict_get(d,k){
if(cljs.core.map_QMARK_(d)){
return (d.cljs$core$IFn$_invoke$arity$1 ? d.cljs$core$IFn$_invoke$arity$1(k) : d.call(null,k));
} else {
return (d[k]);
}
});
datascript.serialize.array_QMARK_ = (function datascript$serialize$array_QMARK_(a){
return ((cljs.core.array_QMARK_(a)) || (cljs.core.vector_QMARK_(a)));
});
datascript.serialize.amap = (function datascript$serialize$amap(f,xs){
var arr = (new Array(cljs.core.count(xs)));
cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (idx,x){
(arr[idx] = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(x) : f.call(null,x)));

return (idx + (1));
}),(0),xs);

return arr;
});
datascript.serialize.amap_indexed = (function datascript$serialize$amap_indexed(f,xs){
var arr = (new Array(cljs.core.count(xs)));
cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (idx,x){
(arr[idx] = (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(idx,x) : f.call(null,idx,x)));

return (idx + (1));
}),(0),xs);

return arr;
});
/**
 * Looks for a datom with attribute exactly bigger than the given one
 */
datascript.serialize.attr_comparator = (function datascript$serialize$attr_comparator(d1,d2){
if((d2.a == null)){
return (-1);
} else {
if((cljs.core.compare(d1.a,d2.a) <= (0))){
return (-1);
} else {
return (1);

}
}
});
/**
 * All attrs in a DB, distinct, sorted
 */
datascript.serialize.all_attrs = (function datascript$serialize$all_attrs(db){
if(cljs.core.empty_QMARK_(new cljs.core.Keyword(null,"aevt","aevt",-585148059).cljs$core$IFn$_invoke$arity$1(db))){
return cljs.core.PersistentVector.EMPTY;
} else {
var attrs = cljs.core.transient$(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(cljs.core.first(new cljs.core.Keyword(null,"aevt","aevt",-585148059).cljs$core$IFn$_invoke$arity$1(db)))], null));
while(true){
var attr = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(attrs,(cljs.core.count(attrs) - (1)));
var left = datascript.db.datom.cljs$core$IFn$_invoke$arity$3((0),attr,null);
var right = datascript.db.datom.cljs$core$IFn$_invoke$arity$3((2147483647),null,null);
var next_attr = new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(cljs.core.first(me.tonsky.persistent_sorted_set.slice.cljs$core$IFn$_invoke$arity$4(new cljs.core.Keyword(null,"aevt","aevt",-585148059).cljs$core$IFn$_invoke$arity$1(db),left,right,datascript.serialize.attr_comparator)));
if((!((next_attr == null)))){
var G__51386 = cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(attrs,next_attr);
attrs = G__51386;
continue;
} else {
return cljs.core.persistent_BANG_(attrs);
}
break;
}
}
});
datascript.serialize.freeze_kw = cljs.core.str;
datascript.serialize.thaw_kw = (function datascript$serialize$thaw_kw(s){
if(clojure.string.starts_with_QMARK_(s,":")){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(s,(1)));
} else {
return s;
}
});
/**
 * Serialized structure breakdown:
 * 
 * count    :: number    
 * tx0      :: number
 * max-eid  :: number
 * max-tx   :: number
 * schema   :: freezed :schema
 * attrs    :: [keywords ...]
 * keywords :: [keywords ...]
 * eavt     :: [[e a-idx v dtx] ...]
 * a-idx    :: index in attrs
 * v        :: (string | number | boolean | [0 <index in keywords>] | [1 <freezed v>])
 * dtx      :: tx - tx0
 * aevt     :: [<index in eavt> ...]
 * avet     :: [<index in eavt> ...]
 */
datascript.serialize.serializable_impl = (function datascript$serialize$serializable_impl(db,p__51257){
var map__51258 = p__51257;
var map__51258__$1 = cljs.core.__destructure_map(map__51258);
var freeze_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__51258__$1,new cljs.core.Keyword(null,"freeze-fn","freeze-fn",-575885995),cljs.core.pr_str);
var freeze_kw = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__51258__$1,new cljs.core.Keyword(null,"freeze-kw","freeze-kw",391758233),datascript.serialize.freeze_kw);
if(cljs.core.truth_(datascript.storage.storage(db))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("serializable doesn't work with databases that have :storage",cljs.core.PersistentArrayMap.EMPTY);
} else {
}

var attrs = datascript.serialize.all_attrs(db);
var attrs_map = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,attrs,cljs.core.range.cljs$core$IFn$_invoke$arity$0()));
var _STAR_kws = cljs.core.volatile_BANG_(cljs.core.transient$(cljs.core.PersistentVector.EMPTY));
var _STAR_kw_map = cljs.core.volatile_BANG_(cljs.core.transient$(cljs.core.PersistentArrayMap.EMPTY));
var write_kw = (function (kw){
var idx = (function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_kw_map),kw);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var keywords = _STAR_kws.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.conj_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_kws.cljs$core$IDeref$_deref$arity$1(null),kw));
var idx = (cljs.core.count(keywords) - (1));
_STAR_kw_map.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_kw_map.cljs$core$IDeref$_deref$arity$1(null),kw,idx));

return idx;
}
})();
return [(0),idx];
});
var write_other = (function (v){
return [(1),(freeze_fn.cljs$core$IFn$_invoke$arity$1 ? freeze_fn.cljs$core$IFn$_invoke$arity$1(v) : freeze_fn.call(null,v))];
});
var write_v = (function (v){
if(typeof v === 'string'){
return v;
} else {
if(typeof v === 'number'){
if((Infinity === v)){
return [(2)];
} else {
if((-Infinity === v)){
return [(3)];
} else {
if(cljs.core.truth_(isNaN(v))){
return [(4)];
} else {
return v;

}
}
}
} else {
if(cljs.core.boolean_QMARK_(v)){
return v;
} else {
if((v instanceof cljs.core.Keyword)){
return write_kw(v);
} else {
return write_other(v);

}
}
}
}
});
var eavt = datascript.serialize.amap_indexed((function (idx,d){
d.datascript$db$IDatom$datom_set_idx$arity$2(null,idx);

var e = d.e;
var a = (function (){var G__51274 = d.a;
return (attrs_map.cljs$core$IFn$_invoke$arity$1 ? attrs_map.cljs$core$IFn$_invoke$arity$1(G__51274) : attrs_map.call(null,G__51274));
})();
var v = write_v(d.v);
var tx = (d.tx - (536870912));
return [e,a,v,tx];
}),new cljs.core.Keyword(null,"eavt","eavt",-666437073).cljs$core$IFn$_invoke$arity$1(db));
var aevt = datascript.serialize.amap_indexed((function (_,d){
return d.datascript$db$IDatom$datom_get_idx$arity$1(null);
}),new cljs.core.Keyword(null,"aevt","aevt",-585148059).cljs$core$IFn$_invoke$arity$1(db));
var avet = datascript.serialize.amap_indexed((function (_,d){
return d.datascript$db$IDatom$datom_get_idx$arity$1(null);
}),new cljs.core.Keyword(null,"avet","avet",1383857032).cljs$core$IFn$_invoke$arity$1(db));
var schema = (function (){var G__51281 = new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1(db);
return (freeze_fn.cljs$core$IFn$_invoke$arity$1 ? freeze_fn.cljs$core$IFn$_invoke$arity$1(G__51281) : freeze_fn.call(null,G__51281));
})();
var attrs__$1 = datascript.serialize.amap(freeze_kw,attrs);
var kws = datascript.serialize.amap(freeze_kw,cljs.core.persistent_BANG_(cljs.core.deref(_STAR_kws)));
return {"count":cljs.core.count(new cljs.core.Keyword(null,"eavt","eavt",-666437073).cljs$core$IFn$_invoke$arity$1(db)),"tx0":(536870912),"max-eid":new cljs.core.Keyword(null,"max-eid","max-eid",2134868075).cljs$core$IFn$_invoke$arity$1(db),"max-tx":new cljs.core.Keyword(null,"max-tx","max-tx",1119558339).cljs$core$IFn$_invoke$arity$1(db),"schema":schema,"attrs":attrs__$1,"keywords":kws,"eavt":eavt,"aevt":aevt,"avet":avet};
});
datascript.serialize.serializable = (function datascript$serialize$serializable(var_args){
var G__51289 = arguments.length;
switch (G__51289) {
case 1:
return datascript.serialize.serializable.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return datascript.serialize.serializable.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.serialize.serializable.cljs$core$IFn$_invoke$arity$1 = (function (db){
return datascript.serialize.serializable_impl(db,cljs.core.PersistentArrayMap.EMPTY);
}));

(datascript.serialize.serializable.cljs$core$IFn$_invoke$arity$2 = (function (db,opts){
return datascript.serialize.serializable_impl(db,opts);
}));

(datascript.serialize.serializable.cljs$lang$maxFixedArity = 2);

datascript.serialize.from_serializable = (function datascript$serialize$from_serializable(var_args){
var G__51319 = arguments.length;
switch (G__51319) {
case 1:
return datascript.serialize.from_serializable.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return datascript.serialize.from_serializable.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(datascript.serialize.from_serializable.cljs$core$IFn$_invoke$arity$1 = (function (from){
return datascript.serialize.from_serializable.cljs$core$IFn$_invoke$arity$2(from,cljs.core.PersistentArrayMap.EMPTY);
}));

(datascript.serialize.from_serializable.cljs$core$IFn$_invoke$arity$2 = (function (from,p__51328){
var map__51329 = p__51328;
var map__51329__$1 = cljs.core.__destructure_map(map__51329);
var opts = map__51329__$1;
var thaw_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__51329__$1,new cljs.core.Keyword(null,"thaw-fn","thaw-fn",-240544261),clojure.edn.read_string);
var thaw_kw = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__51329__$1,new cljs.core.Keyword(null,"thaw-kw","thaw-kw",1076733097),datascript.serialize.thaw_kw);
var tx0 = datascript.serialize.dict_get(from,"tx0");
var schema = (function (){var G__51332 = datascript.serialize.dict_get(from,"schema");
return (thaw_fn.cljs$core$IFn$_invoke$arity$1 ? thaw_fn.cljs$core$IFn$_invoke$arity$1(G__51332) : thaw_fn.call(null,G__51332));
})();
var _ = (function (){var fexpr__51337 = new cljs.core.Var(function(){return datascript.db.validate_schema;},new cljs.core.Symbol("datascript.db","validate-schema","datascript.db/validate-schema",-783030261,null),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"private","private",-558947994),new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.Keyword(null,"end-column","end-column",1425389514),new cljs.core.Keyword(null,"column","column",2078222095),new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"end-line","end-line",1837326455),new cljs.core.Keyword(null,"arglists","arglists",1661989754),new cljs.core.Keyword(null,"doc","doc",1913296891),new cljs.core.Keyword(null,"test","test",577538877)],[true,new cljs.core.Symbol(null,"datascript.db","datascript.db",-444456104,null),new cljs.core.Symbol(null,"validate-schema","validate-schema",758884380,null),"datascript/db.cljc",23,1,931,931,cljs.core.list(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"schema","schema",58529736,null)], null)),null,(cljs.core.truth_(datascript.db.validate_schema)?datascript.db.validate_schema.cljs$lang$test:null)]));
return (fexpr__51337.cljs$core$IFn$_invoke$arity$1 ? fexpr__51337.cljs$core$IFn$_invoke$arity$1(schema) : fexpr__51337.call(null,schema));
})();
var attrs = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(thaw_kw,datascript.serialize.dict_get(from,"attrs"));
var keywords = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(thaw_kw,datascript.serialize.dict_get(from,"keywords"));
var eavt = datascript.serialize.amap((function (arr){
var e = datascript.serialize.array_get(arr,(0));
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(attrs,datascript.serialize.array_get(arr,(1)));
var v = datascript.serialize.array_get(arr,(2));
var v__$1 = ((typeof v === 'number')?v:((typeof v === 'string')?v:((cljs.core.boolean_QMARK_(v))?v:((datascript.serialize.array_QMARK_(v))?(function (){var marker = datascript.serialize.array_get(v,(0));
var pred__51346 = cljs.core._EQ__EQ_;
var expr__51347 = marker;
if(cljs.core.truth_((pred__51346.cljs$core$IFn$_invoke$arity$2 ? pred__51346.cljs$core$IFn$_invoke$arity$2((0),expr__51347) : pred__51346.call(null,(0),expr__51347)))){
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(keywords,datascript.serialize.array_get(v,(1)));
} else {
if(cljs.core.truth_((pred__51346.cljs$core$IFn$_invoke$arity$2 ? pred__51346.cljs$core$IFn$_invoke$arity$2((1),expr__51347) : pred__51346.call(null,(1),expr__51347)))){
var G__51353 = datascript.serialize.array_get(v,(1));
return (thaw_fn.cljs$core$IFn$_invoke$arity$1 ? thaw_fn.cljs$core$IFn$_invoke$arity$1(G__51353) : thaw_fn.call(null,G__51353));
} else {
if(cljs.core.truth_((pred__51346.cljs$core$IFn$_invoke$arity$2 ? pred__51346.cljs$core$IFn$_invoke$arity$2((2),expr__51347) : pred__51346.call(null,(2),expr__51347)))){
return Infinity;
} else {
if(cljs.core.truth_((pred__51346.cljs$core$IFn$_invoke$arity$2 ? pred__51346.cljs$core$IFn$_invoke$arity$2((3),expr__51347) : pred__51346.call(null,(3),expr__51347)))){
return -Infinity;
} else {
if(cljs.core.truth_((pred__51346.cljs$core$IFn$_invoke$arity$2 ? pred__51346.cljs$core$IFn$_invoke$arity$2((4),expr__51347) : pred__51346.call(null,(4),expr__51347)))){
return NaN;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Unexpected value marker ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([marker], 0))," in ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([v], 0))], 0))].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"serialize","serialize",-69216574),new cljs.core.Keyword(null,"value","value",305978217),v], null));
}
}
}
}
}
})():(function(){throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Unexpected value type ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.type(v)], 0))," (",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([v], 0))], 0)),")"].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"serialize","serialize",-69216574),new cljs.core.Keyword(null,"value","value",305978217),v], null))})()
))));
var tx = (tx0 + datascript.serialize.array_get(arr,(3)));
return datascript.db.datom.cljs$core$IFn$_invoke$arity$4(e,a,v__$1,tx);
}),datascript.serialize.dict_get(from,"eavt"));
var aevt = (function (){var G__51359 = datascript.serialize.dict_get(from,"aevt");
if((G__51359 == null)){
return null;
} else {
return datascript.serialize.amap((function (p1__51309_SHARP_){
return (eavt[p1__51309_SHARP_]);
}),G__51359);
}
})();
var avet = (function (){var G__51363 = datascript.serialize.dict_get(from,"avet");
if((G__51363 == null)){
return null;
} else {
return datascript.serialize.amap((function (p1__51311_SHARP_){
return (eavt[p1__51311_SHARP_]);
}),G__51363);
}
})();
var settings = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"branching-factor","branching-factor",1903198601),datascript.serialize.dict_get(from,"branching-factor"),new cljs.core.Keyword(null,"ref-type","ref-type",-1367328851),(function (){var G__51364 = datascript.serialize.dict_get(from,"ref-type");
if((G__51364 == null)){
return null;
} else {
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(G__51364);
}
})()], null),cljs.core.select_keys(opts,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"branching-factor","branching-factor",1903198601),new cljs.core.Keyword(null,"ref-type","ref-type",-1367328851)], null))], 0));
return datascript.db.restore_db(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"schema","schema",-1582001791),schema,new cljs.core.Keyword(null,"eavt","eavt",-666437073),me.tonsky.persistent_sorted_set.from_sorted_array.cljs$core$IFn$_invoke$arity$4(datascript.db.cmp_datoms_eavt,eavt,eavt.length,settings),new cljs.core.Keyword(null,"aevt","aevt",-585148059),me.tonsky.persistent_sorted_set.from_sorted_array.cljs$core$IFn$_invoke$arity$4(datascript.db.cmp_datoms_aevt,aevt,aevt.length,settings),new cljs.core.Keyword(null,"avet","avet",1383857032),me.tonsky.persistent_sorted_set.from_sorted_array.cljs$core$IFn$_invoke$arity$4(datascript.db.cmp_datoms_avet,avet,avet.length,settings),new cljs.core.Keyword(null,"max-eid","max-eid",2134868075),datascript.serialize.dict_get(from,"max-eid"),new cljs.core.Keyword(null,"max-tx","max-tx",1119558339),datascript.serialize.dict_get(from,"max-tx")], null));
}));

(datascript.serialize.from_serializable.cljs$lang$maxFixedArity = 2);


//# sourceMappingURL=datascript.serialize.js.map
