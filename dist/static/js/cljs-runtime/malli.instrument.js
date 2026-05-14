goog.provide('malli.instrument');
goog.scope(function(){
  malli.instrument.goog$module$goog$object = goog.module.get('goog.object');
});
malli.instrument._ns_js_path = (function malli$instrument$_ns_js_path(ns){
return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.munge,clojure.string.split.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns),/\./)));
});
malli.instrument._prop_js_path = (function malli$instrument$_prop_js_path(ns,prop){
return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.munge,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(clojure.string.split.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns),/\./),cljs.core.name(prop))));
});
malli.instrument._get_prop = (function malli$instrument$_get_prop(ns,prop){
return malli.instrument.goog$module$goog$object.getValueByKeys(goog.global,malli.instrument._prop_js_path(ns,prop));
});
malli.instrument._get_ns = (function malli$instrument$_get_ns(ns){
return malli.instrument.goog$module$goog$object.getValueByKeys(goog.global,malli.instrument._ns_js_path(ns));
});
malli.instrument._find_var = (function malli$instrument$_find_var(n,s){
return malli.instrument._get_prop(n,s);
});
malli.instrument._original = (function malli$instrument$_original(f){
return malli.instrument.goog$module$goog$object.get(f,"malli$instrument$original");
});
malli.instrument._instrumented_QMARK_ = (function malli$instrument$_instrumented_QMARK_(f){
return malli.instrument.goog$module$goog$object.get(f,"malli$instrument$instrumented?") === true;
});
malli.instrument.meta_fn = (function malli$instrument$meta_fn(f,m){
var new_f = goog.bind(f,({}));
Object.assign(new_f,f);

var x134746_135287 = new_f;
(x134746_135287.cljs$core$IMeta$ = cljs.core.PROTOCOL_SENTINEL);

(x134746_135287.cljs$core$IMeta$_meta$arity$1 = (function (_){
var ___$1 = this;
return m;
}));


return new_f;
});
malli.instrument._filter_ns = (function malli$instrument$_filter_ns(var_args){
var args__5732__auto__ = [];
var len__5726__auto___135288 = arguments.length;
var i__5727__auto___135289 = (0);
while(true){
if((i__5727__auto___135289 < len__5726__auto___135288)){
args__5732__auto__.push((arguments[i__5727__auto___135289]));

var G__135290 = (i__5727__auto___135289 + (1));
i__5727__auto___135289 = G__135290;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return malli.instrument._filter_ns.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(malli.instrument._filter_ns.cljs$core$IFn$_invoke$arity$variadic = (function (ns){
return (function (n,_,___$1){
var fexpr__134760 = cljs.core.set(ns);
return (fexpr__134760.cljs$core$IFn$_invoke$arity$1 ? fexpr__134760.cljs$core$IFn$_invoke$arity$1(n) : fexpr__134760.call(null,n));
});
}));

(malli.instrument._filter_ns.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(malli.instrument._filter_ns.cljs$lang$applyTo = (function (seq134751){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq134751));
}));

malli.instrument._filter_var = (function malli$instrument$_filter_var(f){
return (function (n,s,d){
var G__134761 = (new cljs.core.Var(cljs.core.constantly(malli.instrument._find_var(n,s)),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(n,s),d));
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(G__134761) : f.call(null,G__134761));
});
});
malli.instrument._filter_schema = (function malli$instrument$_filter_schema(f){
return (function (_,___$1,p__134766){
var map__134767 = p__134766;
var map__134767__$1 = cljs.core.__destructure_map(map__134767);
var schema = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134767__$1,new cljs.core.Keyword(null,"schema","schema",-1582001791));
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(schema) : f.call(null,schema));
});
});
malli.instrument._arity__GT_schema = (function malli$instrument$_arity__GT_schema(fn_schema){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (schema){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"arity","arity",-1808556135).cljs$core$IFn$_invoke$arity$1(malli.core._function_info(malli.core.schema.cljs$core$IFn$_invoke$arity$1(schema))),schema], null);
}),cljs.core.rest(fn_schema)));
});
malli.instrument._variadic_QMARK_ = (function malli$instrument$_variadic_QMARK_(f){
return malli.instrument.goog$module$goog$object.get(f,"cljs$core$IFn$_invoke$arity$variadic");
});
malli.instrument._max_fixed_arity = (function malli$instrument$_max_fixed_arity(f){
return malli.instrument.goog$module$goog$object.get(f,"cljs$lang$maxFixedArity");
});
malli.instrument._pure_variadic_QMARK_ = (function malli$instrument$_pure_variadic_QMARK_(f){
var max_fixed_arity = malli.instrument._max_fixed_arity(f);
var and__5000__auto__ = max_fixed_arity;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = malli.instrument._variadic_QMARK_(f);
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.every_QMARK_((function (p1__134768_SHARP_){
return (!(cljs.core.fn_QMARK_(malli.instrument.goog$module$goog$object.get(f,["cljs$core$IFn$_invoke$arity$",cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__134768_SHARP_)].join('')))));
}),cljs.core.range.cljs$core$IFn$_invoke$arity$1((20)));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
});
malli.instrument._replace_variadic_fn = (function malli$instrument$_replace_variadic_fn(original_fn,n,s,opts){
var accessor = "cljs$core$IFn$_invoke$arity$variadic";
var arity_fn = malli.instrument.goog$module$goog$object.get(original_fn,accessor);
if(cljs.core.truth_(arity_fn)){
malli.instrument.goog$module$goog$object.set(original_fn,"malli$instrument$instrumented?",true);

var max_fixed_arity = malli.instrument._max_fixed_arity(original_fn);
var instrumented_variadic_fn = malli.core._instrument.cljs$core$IFn$_invoke$arity$2(opts,(function() { 
var G__135294__delegate = function (args){
var vec__134779 = cljs.core.split_at(max_fixed_arity,cljs.core.vec(args));
var fixed_args = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134779,(0),null);
var rest_args = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134779,(1),null);
var final_args = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(fixed_args),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.not_empty(rest_args)], null));
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(arity_fn,final_args);
};
var G__135294 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__135298__i = 0, G__135298__a = new Array(arguments.length -  0);
while (G__135298__i < G__135298__a.length) {G__135298__a[G__135298__i] = arguments[G__135298__i + 0]; ++G__135298__i;}
  args = new cljs.core.IndexedSeq(G__135298__a,0,null);
} 
return G__135294__delegate.call(this,args);};
G__135294.cljs$lang$maxFixedArity = 0;
G__135294.cljs$lang$applyTo = (function (arglist__135299){
var args = cljs.core.seq(arglist__135299);
return G__135294__delegate(args);
});
G__135294.cljs$core$IFn$_invoke$arity$variadic = G__135294__delegate;
return G__135294;
})()
);
var instrumented_wrapper = (function() { 
var G__135300__delegate = function (args){
var vec__134798 = cljs.core.split_at(max_fixed_arity,cljs.core.vec(args));
var fixed_args = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134798,(0),null);
var rest_args = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134798,(1),null);
var final_args = cljs.core.vec(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.list_STAR_,cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(fixed_args),cljs.core.not_empty(rest_args))));
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(instrumented_variadic_fn,final_args);
};
var G__135300 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__135301__i = 0, G__135301__a = new Array(arguments.length -  0);
while (G__135301__i < G__135301__a.length) {G__135301__a[G__135301__i] = arguments[G__135301__i + 0]; ++G__135301__i;}
  args = new cljs.core.IndexedSeq(G__135301__a,0,null);
} 
return G__135300__delegate.call(this,args);};
G__135300.cljs$lang$maxFixedArity = 0;
G__135300.cljs$lang$applyTo = (function (arglist__135303){
var args = cljs.core.seq(arglist__135303);
return G__135300__delegate(args);
});
G__135300.cljs$core$IFn$_invoke$arity$variadic = G__135300__delegate;
return G__135300;
})()
;
malli.instrument.goog$module$goog$object.set(instrumented_wrapper,"malli$instrument$original",arity_fn);

malli.instrument.goog$module$goog$object.set(malli.instrument._get_prop(n,s),"malli$instrument$instrumented?",true);

malli.instrument.goog$module$goog$object.set(malli.instrument._get_prop(n,s),accessor,instrumented_wrapper);

return malli.instrument.goog$module$goog$object.set(malli.instrument._get_ns(n),s,malli.instrument.meta_fn(original_fn,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"instrumented-symbol","instrumented-symbol",-216975268),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(n,s)], null)));
} else {
return null;
}
});
malli.instrument._replace_multi_arity = (function malli$instrument$_replace_multi_arity(original_fn,n,s,opts){
var schema = new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1(opts);
malli.instrument.goog$module$goog$object.set(original_fn,"malli$instrument$instrumented?",true);

malli.instrument.goog$module$goog$object.set(malli.instrument._get_ns(n),s,malli.instrument.meta_fn(original_fn,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"instrumented-symbol","instrumented-symbol",-216975268),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(n,s)], null)));

var seq__134818 = cljs.core.seq(malli.instrument._arity__GT_schema(schema));
var chunk__134819 = null;
var count__134820 = (0);
var i__134821 = (0);
while(true){
if((i__134821 < count__134820)){
var vec__134828 = chunk__134819.cljs$core$IIndexed$_nth$arity$2(null,i__134821);
var arity = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134828,(0),null);
var f_schema = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134828,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(arity,new cljs.core.Keyword(null,"varargs","varargs",1030150858))){
malli.instrument._replace_variadic_fn(original_fn,n,s,opts);
} else {
var accessor_135313 = ["cljs$core$IFn$_invoke$arity$",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arity)].join('');
var arity_fn_135314 = malli.instrument.goog$module$goog$object.get(original_fn,accessor_135313);
if(cljs.core.truth_(arity_fn_135314)){
var instrumented_fn_135315 = malli.core._instrument.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"schema","schema",-1582001791),f_schema),arity_fn_135314);
malli.instrument.goog$module$goog$object.set(instrumented_fn_135315,"malli$instrument$original",arity_fn_135314);

malli.instrument.goog$module$goog$object.set(instrumented_fn_135315,"malli$instrument$instrumented?",true);

malli.instrument.goog$module$goog$object.set(malli.instrument._get_prop(n,s),accessor_135313,instrumented_fn_135315);
} else {
}
}


var G__135316 = seq__134818;
var G__135317 = chunk__134819;
var G__135318 = count__134820;
var G__135319 = (i__134821 + (1));
seq__134818 = G__135316;
chunk__134819 = G__135317;
count__134820 = G__135318;
i__134821 = G__135319;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__134818);
if(temp__5804__auto__){
var seq__134818__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__134818__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__134818__$1);
var G__135321 = cljs.core.chunk_rest(seq__134818__$1);
var G__135322 = c__5525__auto__;
var G__135323 = cljs.core.count(c__5525__auto__);
var G__135324 = (0);
seq__134818 = G__135321;
chunk__134819 = G__135322;
count__134820 = G__135323;
i__134821 = G__135324;
continue;
} else {
var vec__134832 = cljs.core.first(seq__134818__$1);
var arity = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134832,(0),null);
var f_schema = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134832,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(arity,new cljs.core.Keyword(null,"varargs","varargs",1030150858))){
malli.instrument._replace_variadic_fn(original_fn,n,s,opts);
} else {
var accessor_135325 = ["cljs$core$IFn$_invoke$arity$",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arity)].join('');
var arity_fn_135326 = malli.instrument.goog$module$goog$object.get(original_fn,accessor_135325);
if(cljs.core.truth_(arity_fn_135326)){
var instrumented_fn_135328 = malli.core._instrument.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"schema","schema",-1582001791),f_schema),arity_fn_135326);
malli.instrument.goog$module$goog$object.set(instrumented_fn_135328,"malli$instrument$original",arity_fn_135326);

malli.instrument.goog$module$goog$object.set(instrumented_fn_135328,"malli$instrument$instrumented?",true);

malli.instrument.goog$module$goog$object.set(malli.instrument._get_prop(n,s),accessor_135325,instrumented_fn_135328);
} else {
}
}


var G__135329 = cljs.core.next(seq__134818__$1);
var G__135330 = null;
var G__135331 = (0);
var G__135332 = (0);
seq__134818 = G__135329;
chunk__134819 = G__135330;
count__134820 = G__135331;
i__134821 = G__135332;
continue;
}
} else {
return null;
}
}
break;
}
});
malli.instrument._replace_fn = (function malli$instrument$_replace_fn(original_fn,n,s,opts){
try{if(cljs.core.truth_(malli.instrument._pure_variadic_QMARK_(original_fn))){
return malli.instrument._replace_variadic_fn(original_fn,n,s,opts);
} else {
if(cljs.core.truth_(malli.instrument._max_fixed_arity(original_fn))){
return malli.instrument._replace_multi_arity(original_fn,n,s,opts);
} else {
var instrumented_fn = malli.instrument.meta_fn(malli.core._instrument.cljs$core$IFn$_invoke$arity$2(opts,original_fn),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"instrumented-symbol","instrumented-symbol",-216975268),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.name(n),cljs.core.name(s))], null));
malli.instrument.goog$module$goog$object.set(original_fn,"malli$instrument$instrumented?",true);

malli.instrument.goog$module$goog$object.set(instrumented_fn,"malli$instrument$instrumented?",true);

malli.instrument.goog$module$goog$object.set(instrumented_fn,"malli$instrument$original",original_fn);

return malli.instrument.goog$module$goog$object.set(malli.instrument._get_ns(n),cljs.core.munge(cljs.core.name(s)),instrumented_fn);

}
}
}catch (e134837){var e = e134837;
if((e instanceof cljs.core.ExceptionInfo)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Schema error when instrumenting function: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.name(n),cljs.core.name(s)))," - ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.ex_message(e))].join(''),cljs.core.ex_data(e));
} else {
throw (new Error(["Schema error when instrumenting function: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.name(n),cljs.core.name(s))),". ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e)].join('')));
}
}});
malli.instrument._strument_BANG_ = (function malli$instrument$_strument_BANG_(var_args){
var G__134850 = arguments.length;
switch (G__134850) {
case 0:
return malli.instrument._strument_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return malli.instrument._strument_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(malli.instrument._strument_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return malli.instrument._strument_BANG_.cljs$core$IFn$_invoke$arity$1(null);
}));

(malli.instrument._strument_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (p__134851){
var map__134852 = p__134851;
var map__134852__$1 = cljs.core.__destructure_map(map__134852);
var options = map__134852__$1;
var mode = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__134852__$1,new cljs.core.Keyword(null,"mode","mode",654403691),new cljs.core.Keyword(null,"instrument","instrument",-960698844));
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__134852__$1,new cljs.core.Keyword(null,"data","data",-232669377),malli.core.function_schemas.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"cljs","cljs",1492417629)));
var filters = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134852__$1,new cljs.core.Keyword(null,"filters","filters",974726919));
var gen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134852__$1,new cljs.core.Keyword(null,"gen","gen",142575302));
var report = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134852__$1,new cljs.core.Keyword(null,"report","report",1394055010));
var skip_instrumented_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__134852__$1,new cljs.core.Keyword(null,"skip-instrumented?","skip-instrumented?",1366613843),false);
var seq__134853 = cljs.core.seq(data);
var chunk__134858 = null;
var count__134859 = (0);
var i__134860 = (0);
while(true){
if((i__134860 < count__134859)){
var vec__135067 = chunk__134858.cljs$core$IIndexed$_nth$arity$2(null,i__134860);
var n = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135067,(0),null);
var d = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135067,(1),null);
var seq__134861_135335 = cljs.core.seq(d);
var chunk__134862_135336 = null;
var count__134863_135337 = (0);
var i__134864_135338 = (0);
while(true){
if((i__134864_135338 < count__134863_135337)){
var vec__135100_135340 = chunk__134862_135336.cljs$core$IIndexed$_nth$arity$2(null,i__134864_135338);
var s_135341 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135100_135340,(0),null);
var d_135342__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135100_135340,(1),null);
if(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.not(filters);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return cljs.core.some(((function (seq__134861_135335,chunk__134862_135336,count__134863_135337,i__134864_135338,seq__134853,chunk__134858,count__134859,i__134860,or__5002__auto__,vec__135100_135340,s_135341,d_135342__$1,vec__135067,n,d,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_){
return (function (p1__134845_SHARP_){
return (p1__134845_SHARP_.cljs$core$IFn$_invoke$arity$3 ? p1__134845_SHARP_.cljs$core$IFn$_invoke$arity$3(n,s_135341,d_135342__$1) : p1__134845_SHARP_.call(null,n,s_135341,d_135342__$1));
});})(seq__134861_135335,chunk__134862_135336,count__134863_135337,i__134864_135338,seq__134853,chunk__134858,count__134859,i__134860,or__5002__auto__,vec__135100_135340,s_135341,d_135342__$1,vec__135067,n,d,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_))
,filters);
}
})())){
var temp__5804__auto___135343 = malli.instrument._find_var(n,s_135341);
if(cljs.core.truth_(temp__5804__auto___135343)){
var v_135344 = temp__5804__auto___135343;
var G__135103_135345 = mode;
var G__135103_135346__$1 = (((G__135103_135345 instanceof cljs.core.Keyword))?G__135103_135345.fqn:null);
switch (G__135103_135346__$1) {
case "instrument":
var original_fn_135348 = (function (){var or__5002__auto__ = malli.instrument._original(v_135344);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return v_135344;
}
})();
var dgen_135349 = (function (){var $ = cljs.core.select_keys(options,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"scope","scope",-439358418),new cljs.core.Keyword(null,"report","report",1394055010),new cljs.core.Keyword(null,"gen","gen",142575302)], null));
var $__$1 = (function (){var G__135104 = $;
if(cljs.core.truth_(report)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__135104,new cljs.core.Keyword(null,"report","report",1394055010),((function (seq__134861_135335,chunk__134862_135336,count__134863_135337,i__134864_135338,seq__134853,chunk__134858,count__134859,i__134860,G__135104,$,original_fn_135348,G__135103_135345,G__135103_135346__$1,v_135344,temp__5804__auto___135343,vec__135100_135340,s_135341,d_135342__$1,vec__135067,n,d,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_){
return (function (r){
return ((function (seq__134861_135335,chunk__134862_135336,count__134863_135337,i__134864_135338,seq__134853,chunk__134858,count__134859,i__134860,G__135104,$,original_fn_135348,G__135103_135345,G__135103_135346__$1,v_135344,temp__5804__auto___135343,vec__135100_135340,s_135341,d_135342__$1,vec__135067,n,d,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_){
return (function (t,data__$1){
var G__135105 = t;
var G__135106 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(data__$1,new cljs.core.Keyword(null,"fn-name","fn-name",-766594004),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.name(n),cljs.core.name(s_135341)));
return (r.cljs$core$IFn$_invoke$arity$2 ? r.cljs$core$IFn$_invoke$arity$2(G__135105,G__135106) : r.call(null,G__135105,G__135106));
});
;})(seq__134861_135335,chunk__134862_135336,count__134863_135337,i__134864_135338,seq__134853,chunk__134858,count__134859,i__134860,G__135104,$,original_fn_135348,G__135103_135345,G__135103_135346__$1,v_135344,temp__5804__auto___135343,vec__135100_135340,s_135341,d_135342__$1,vec__135067,n,d,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_))
});})(seq__134861_135335,chunk__134862_135336,count__134863_135337,i__134864_135338,seq__134853,chunk__134858,count__134859,i__134860,G__135104,$,original_fn_135348,G__135103_135345,G__135103_135346__$1,v_135344,temp__5804__auto___135343,vec__135100_135340,s_135341,d_135342__$1,vec__135067,n,d,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_))
);
} else {
return G__135104;
}
})();
var $__$2 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([$__$1,d_135342__$1], 0));
if(cljs.core.truth_((function (){var and__5000__auto__ = gen;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"gen","gen",142575302).cljs$core$IFn$_invoke$arity$1(d_135342__$1) === true;
} else {
return and__5000__auto__;
}
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3($__$2,new cljs.core.Keyword(null,"gen","gen",142575302),gen);
} else {
if(new cljs.core.Keyword(null,"gen","gen",142575302).cljs$core$IFn$_invoke$arity$1(d_135342__$1) === true){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2($__$2,new cljs.core.Keyword(null,"gen","gen",142575302));
} else {
return $__$2;

}
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = original_fn_135348;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((function (){var and__5000__auto____$1 = skip_instrumented_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return malli.instrument._instrumented_QMARK_(v_135344);
} else {
return and__5000__auto____$1;
}
})());
} else {
return and__5000__auto__;
}
})())){
malli.instrument._replace_fn(original_fn_135348,n,s_135341,dgen_135349);
} else {
}

break;
case "unstrument":
if(malli.instrument._instrumented_QMARK_(v_135344)){
var original_fn_135354 = (function (){var or__5002__auto__ = malli.instrument._original(v_135344);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return v_135344;
}
})();
if(cljs.core.truth_(malli.instrument._pure_variadic_QMARK_(original_fn_135354))){
var accessor_135355 = "cljs$core$IFn$_invoke$arity$variadic";
var variadic_fn_135356 = malli.instrument.goog$module$goog$object.get(v_135344,accessor_135355);
var orig_variadic_fn_135357 = malli.instrument.goog$module$goog$object.get(variadic_fn_135356,"malli$instrument$original");
malli.instrument.goog$module$goog$object.set(original_fn_135354,accessor_135355,orig_variadic_fn_135357);
} else {
if(cljs.core.truth_(malli.instrument._max_fixed_arity(original_fn_135354))){
var seq__135107_135358 = cljs.core.seq(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.range.cljs$core$IFn$_invoke$arity$1((20)),"variadic"));
var chunk__135110_135359 = null;
var count__135111_135360 = (0);
var i__135112_135361 = (0);
while(true){
if((i__135112_135361 < count__135111_135360)){
var arity_135362 = chunk__135110_135359.cljs$core$IIndexed$_nth$arity$2(null,i__135112_135361);
var accessor_135363 = ["cljs$core$IFn$_invoke$arity$",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arity_135362)].join('');
var arity_fn_135364 = malli.instrument.goog$module$goog$object.get(original_fn_135354,accessor_135363);
if(cljs.core.truth_(arity_fn_135364)){
var orig_135365 = malli.instrument.goog$module$goog$object.get(arity_fn_135364,"malli$instrument$original");
malli.instrument.goog$module$goog$object.set(original_fn_135354,accessor_135363,orig_135365);


var G__135366 = seq__135107_135358;
var G__135367 = chunk__135110_135359;
var G__135368 = count__135111_135360;
var G__135369 = (i__135112_135361 + (1));
seq__135107_135358 = G__135366;
chunk__135110_135359 = G__135367;
count__135111_135360 = G__135368;
i__135112_135361 = G__135369;
continue;
} else {
var G__135370 = seq__135107_135358;
var G__135371 = chunk__135110_135359;
var G__135372 = count__135111_135360;
var G__135373 = (i__135112_135361 + (1));
seq__135107_135358 = G__135370;
chunk__135110_135359 = G__135371;
count__135111_135360 = G__135372;
i__135112_135361 = G__135373;
continue;
}
} else {
var temp__5804__auto___135374__$1 = cljs.core.seq(seq__135107_135358);
if(temp__5804__auto___135374__$1){
var seq__135107_135375__$1 = temp__5804__auto___135374__$1;
if(cljs.core.chunked_seq_QMARK_(seq__135107_135375__$1)){
var c__5525__auto___135376 = cljs.core.chunk_first(seq__135107_135375__$1);
var G__135377 = cljs.core.chunk_rest(seq__135107_135375__$1);
var G__135378 = c__5525__auto___135376;
var G__135379 = cljs.core.count(c__5525__auto___135376);
var G__135380 = (0);
seq__135107_135358 = G__135377;
chunk__135110_135359 = G__135378;
count__135111_135360 = G__135379;
i__135112_135361 = G__135380;
continue;
} else {
var arity_135381 = cljs.core.first(seq__135107_135375__$1);
var accessor_135382 = ["cljs$core$IFn$_invoke$arity$",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arity_135381)].join('');
var arity_fn_135383 = malli.instrument.goog$module$goog$object.get(original_fn_135354,accessor_135382);
if(cljs.core.truth_(arity_fn_135383)){
var orig_135384 = malli.instrument.goog$module$goog$object.get(arity_fn_135383,"malli$instrument$original");
malli.instrument.goog$module$goog$object.set(original_fn_135354,accessor_135382,orig_135384);


var G__135385 = cljs.core.next(seq__135107_135375__$1);
var G__135386 = null;
var G__135387 = (0);
var G__135388 = (0);
seq__135107_135358 = G__135385;
chunk__135110_135359 = G__135386;
count__135111_135360 = G__135387;
i__135112_135361 = G__135388;
continue;
} else {
var G__135389 = cljs.core.next(seq__135107_135375__$1);
var G__135390 = null;
var G__135391 = (0);
var G__135392 = (0);
seq__135107_135358 = G__135389;
chunk__135110_135359 = G__135390;
count__135111_135360 = G__135391;
i__135112_135361 = G__135392;
continue;
}
}
} else {
}
}
break;
}
} else {
malli.instrument.goog$module$goog$object.set(malli.instrument._get_ns(n),cljs.core.munge(cljs.core.name(s_135341)),original_fn_135354);

}
}
} else {
}

break;
default:
(mode.cljs$core$IFn$_invoke$arity$2 ? mode.cljs$core$IFn$_invoke$arity$2(v_135344,d_135342__$1) : mode.call(null,v_135344,d_135342__$1));

}
} else {
}
} else {
}


var G__135393 = seq__134861_135335;
var G__135394 = chunk__134862_135336;
var G__135395 = count__134863_135337;
var G__135396 = (i__134864_135338 + (1));
seq__134861_135335 = G__135393;
chunk__134862_135336 = G__135394;
count__134863_135337 = G__135395;
i__134864_135338 = G__135396;
continue;
} else {
var temp__5804__auto___135397 = cljs.core.seq(seq__134861_135335);
if(temp__5804__auto___135397){
var seq__134861_135399__$1 = temp__5804__auto___135397;
if(cljs.core.chunked_seq_QMARK_(seq__134861_135399__$1)){
var c__5525__auto___135400 = cljs.core.chunk_first(seq__134861_135399__$1);
var G__135401 = cljs.core.chunk_rest(seq__134861_135399__$1);
var G__135402 = c__5525__auto___135400;
var G__135403 = cljs.core.count(c__5525__auto___135400);
var G__135404 = (0);
seq__134861_135335 = G__135401;
chunk__134862_135336 = G__135402;
count__134863_135337 = G__135403;
i__134864_135338 = G__135404;
continue;
} else {
var vec__135115_135405 = cljs.core.first(seq__134861_135399__$1);
var s_135406 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135115_135405,(0),null);
var d_135407__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135115_135405,(1),null);
if(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.not(filters);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return cljs.core.some(((function (seq__134861_135335,chunk__134862_135336,count__134863_135337,i__134864_135338,seq__134853,chunk__134858,count__134859,i__134860,or__5002__auto__,vec__135115_135405,s_135406,d_135407__$1,seq__134861_135399__$1,temp__5804__auto___135397,vec__135067,n,d,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_){
return (function (p1__134845_SHARP_){
return (p1__134845_SHARP_.cljs$core$IFn$_invoke$arity$3 ? p1__134845_SHARP_.cljs$core$IFn$_invoke$arity$3(n,s_135406,d_135407__$1) : p1__134845_SHARP_.call(null,n,s_135406,d_135407__$1));
});})(seq__134861_135335,chunk__134862_135336,count__134863_135337,i__134864_135338,seq__134853,chunk__134858,count__134859,i__134860,or__5002__auto__,vec__135115_135405,s_135406,d_135407__$1,seq__134861_135399__$1,temp__5804__auto___135397,vec__135067,n,d,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_))
,filters);
}
})())){
var temp__5804__auto___135408__$1 = malli.instrument._find_var(n,s_135406);
if(cljs.core.truth_(temp__5804__auto___135408__$1)){
var v_135409 = temp__5804__auto___135408__$1;
var G__135118_135410 = mode;
var G__135118_135411__$1 = (((G__135118_135410 instanceof cljs.core.Keyword))?G__135118_135410.fqn:null);
switch (G__135118_135411__$1) {
case "instrument":
var original_fn_135413 = (function (){var or__5002__auto__ = malli.instrument._original(v_135409);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return v_135409;
}
})();
var dgen_135414 = (function (){var $ = cljs.core.select_keys(options,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"scope","scope",-439358418),new cljs.core.Keyword(null,"report","report",1394055010),new cljs.core.Keyword(null,"gen","gen",142575302)], null));
var $__$1 = (function (){var G__135119 = $;
if(cljs.core.truth_(report)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__135119,new cljs.core.Keyword(null,"report","report",1394055010),((function (seq__134861_135335,chunk__134862_135336,count__134863_135337,i__134864_135338,seq__134853,chunk__134858,count__134859,i__134860,G__135119,$,original_fn_135413,G__135118_135410,G__135118_135411__$1,v_135409,temp__5804__auto___135408__$1,vec__135115_135405,s_135406,d_135407__$1,seq__134861_135399__$1,temp__5804__auto___135397,vec__135067,n,d,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_){
return (function (r){
return ((function (seq__134861_135335,chunk__134862_135336,count__134863_135337,i__134864_135338,seq__134853,chunk__134858,count__134859,i__134860,G__135119,$,original_fn_135413,G__135118_135410,G__135118_135411__$1,v_135409,temp__5804__auto___135408__$1,vec__135115_135405,s_135406,d_135407__$1,seq__134861_135399__$1,temp__5804__auto___135397,vec__135067,n,d,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_){
return (function (t,data__$1){
var G__135120 = t;
var G__135121 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(data__$1,new cljs.core.Keyword(null,"fn-name","fn-name",-766594004),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.name(n),cljs.core.name(s_135406)));
return (r.cljs$core$IFn$_invoke$arity$2 ? r.cljs$core$IFn$_invoke$arity$2(G__135120,G__135121) : r.call(null,G__135120,G__135121));
});
;})(seq__134861_135335,chunk__134862_135336,count__134863_135337,i__134864_135338,seq__134853,chunk__134858,count__134859,i__134860,G__135119,$,original_fn_135413,G__135118_135410,G__135118_135411__$1,v_135409,temp__5804__auto___135408__$1,vec__135115_135405,s_135406,d_135407__$1,seq__134861_135399__$1,temp__5804__auto___135397,vec__135067,n,d,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_))
});})(seq__134861_135335,chunk__134862_135336,count__134863_135337,i__134864_135338,seq__134853,chunk__134858,count__134859,i__134860,G__135119,$,original_fn_135413,G__135118_135410,G__135118_135411__$1,v_135409,temp__5804__auto___135408__$1,vec__135115_135405,s_135406,d_135407__$1,seq__134861_135399__$1,temp__5804__auto___135397,vec__135067,n,d,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_))
);
} else {
return G__135119;
}
})();
var $__$2 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([$__$1,d_135407__$1], 0));
if(cljs.core.truth_((function (){var and__5000__auto__ = gen;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"gen","gen",142575302).cljs$core$IFn$_invoke$arity$1(d_135407__$1) === true;
} else {
return and__5000__auto__;
}
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3($__$2,new cljs.core.Keyword(null,"gen","gen",142575302),gen);
} else {
if(new cljs.core.Keyword(null,"gen","gen",142575302).cljs$core$IFn$_invoke$arity$1(d_135407__$1) === true){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2($__$2,new cljs.core.Keyword(null,"gen","gen",142575302));
} else {
return $__$2;

}
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = original_fn_135413;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((function (){var and__5000__auto____$1 = skip_instrumented_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return malli.instrument._instrumented_QMARK_(v_135409);
} else {
return and__5000__auto____$1;
}
})());
} else {
return and__5000__auto__;
}
})())){
malli.instrument._replace_fn(original_fn_135413,n,s_135406,dgen_135414);
} else {
}

break;
case "unstrument":
if(malli.instrument._instrumented_QMARK_(v_135409)){
var original_fn_135417 = (function (){var or__5002__auto__ = malli.instrument._original(v_135409);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return v_135409;
}
})();
if(cljs.core.truth_(malli.instrument._pure_variadic_QMARK_(original_fn_135417))){
var accessor_135418 = "cljs$core$IFn$_invoke$arity$variadic";
var variadic_fn_135419 = malli.instrument.goog$module$goog$object.get(v_135409,accessor_135418);
var orig_variadic_fn_135420 = malli.instrument.goog$module$goog$object.get(variadic_fn_135419,"malli$instrument$original");
malli.instrument.goog$module$goog$object.set(original_fn_135417,accessor_135418,orig_variadic_fn_135420);
} else {
if(cljs.core.truth_(malli.instrument._max_fixed_arity(original_fn_135417))){
var seq__135124_135421 = cljs.core.seq(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.range.cljs$core$IFn$_invoke$arity$1((20)),"variadic"));
var chunk__135127_135422 = null;
var count__135128_135423 = (0);
var i__135129_135424 = (0);
while(true){
if((i__135129_135424 < count__135128_135423)){
var arity_135426 = chunk__135127_135422.cljs$core$IIndexed$_nth$arity$2(null,i__135129_135424);
var accessor_135428 = ["cljs$core$IFn$_invoke$arity$",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arity_135426)].join('');
var arity_fn_135429 = malli.instrument.goog$module$goog$object.get(original_fn_135417,accessor_135428);
if(cljs.core.truth_(arity_fn_135429)){
var orig_135430 = malli.instrument.goog$module$goog$object.get(arity_fn_135429,"malli$instrument$original");
malli.instrument.goog$module$goog$object.set(original_fn_135417,accessor_135428,orig_135430);


var G__135431 = seq__135124_135421;
var G__135432 = chunk__135127_135422;
var G__135433 = count__135128_135423;
var G__135434 = (i__135129_135424 + (1));
seq__135124_135421 = G__135431;
chunk__135127_135422 = G__135432;
count__135128_135423 = G__135433;
i__135129_135424 = G__135434;
continue;
} else {
var G__135435 = seq__135124_135421;
var G__135436 = chunk__135127_135422;
var G__135437 = count__135128_135423;
var G__135438 = (i__135129_135424 + (1));
seq__135124_135421 = G__135435;
chunk__135127_135422 = G__135436;
count__135128_135423 = G__135437;
i__135129_135424 = G__135438;
continue;
}
} else {
var temp__5804__auto___135439__$2 = cljs.core.seq(seq__135124_135421);
if(temp__5804__auto___135439__$2){
var seq__135124_135440__$1 = temp__5804__auto___135439__$2;
if(cljs.core.chunked_seq_QMARK_(seq__135124_135440__$1)){
var c__5525__auto___135441 = cljs.core.chunk_first(seq__135124_135440__$1);
var G__135442 = cljs.core.chunk_rest(seq__135124_135440__$1);
var G__135443 = c__5525__auto___135441;
var G__135444 = cljs.core.count(c__5525__auto___135441);
var G__135445 = (0);
seq__135124_135421 = G__135442;
chunk__135127_135422 = G__135443;
count__135128_135423 = G__135444;
i__135129_135424 = G__135445;
continue;
} else {
var arity_135446 = cljs.core.first(seq__135124_135440__$1);
var accessor_135447 = ["cljs$core$IFn$_invoke$arity$",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arity_135446)].join('');
var arity_fn_135448 = malli.instrument.goog$module$goog$object.get(original_fn_135417,accessor_135447);
if(cljs.core.truth_(arity_fn_135448)){
var orig_135449 = malli.instrument.goog$module$goog$object.get(arity_fn_135448,"malli$instrument$original");
malli.instrument.goog$module$goog$object.set(original_fn_135417,accessor_135447,orig_135449);


var G__135450 = cljs.core.next(seq__135124_135440__$1);
var G__135451 = null;
var G__135452 = (0);
var G__135453 = (0);
seq__135124_135421 = G__135450;
chunk__135127_135422 = G__135451;
count__135128_135423 = G__135452;
i__135129_135424 = G__135453;
continue;
} else {
var G__135454 = cljs.core.next(seq__135124_135440__$1);
var G__135455 = null;
var G__135456 = (0);
var G__135457 = (0);
seq__135124_135421 = G__135454;
chunk__135127_135422 = G__135455;
count__135128_135423 = G__135456;
i__135129_135424 = G__135457;
continue;
}
}
} else {
}
}
break;
}
} else {
malli.instrument.goog$module$goog$object.set(malli.instrument._get_ns(n),cljs.core.munge(cljs.core.name(s_135406)),original_fn_135417);

}
}
} else {
}

break;
default:
(mode.cljs$core$IFn$_invoke$arity$2 ? mode.cljs$core$IFn$_invoke$arity$2(v_135409,d_135407__$1) : mode.call(null,v_135409,d_135407__$1));

}
} else {
}
} else {
}


var G__135459 = cljs.core.next(seq__134861_135399__$1);
var G__135460 = null;
var G__135461 = (0);
var G__135462 = (0);
seq__134861_135335 = G__135459;
chunk__134862_135336 = G__135460;
count__134863_135337 = G__135461;
i__134864_135338 = G__135462;
continue;
}
} else {
}
}
break;
}

var G__135463 = seq__134853;
var G__135464 = chunk__134858;
var G__135465 = count__134859;
var G__135466 = (i__134860 + (1));
seq__134853 = G__135463;
chunk__134858 = G__135464;
count__134859 = G__135465;
i__134860 = G__135466;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__134853);
if(temp__5804__auto__){
var seq__134853__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__134853__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__134853__$1);
var G__135467 = cljs.core.chunk_rest(seq__134853__$1);
var G__135468 = c__5525__auto__;
var G__135469 = cljs.core.count(c__5525__auto__);
var G__135470 = (0);
seq__134853 = G__135467;
chunk__134858 = G__135468;
count__134859 = G__135469;
i__134860 = G__135470;
continue;
} else {
var vec__135138 = cljs.core.first(seq__134853__$1);
var n = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135138,(0),null);
var d = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135138,(1),null);
var seq__134854_135471 = cljs.core.seq(d);
var chunk__134855_135472 = null;
var count__134856_135473 = (0);
var i__134857_135474 = (0);
while(true){
if((i__134857_135474 < count__134856_135473)){
var vec__135218_135475 = chunk__134855_135472.cljs$core$IIndexed$_nth$arity$2(null,i__134857_135474);
var s_135476 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135218_135475,(0),null);
var d_135477__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135218_135475,(1),null);
if(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.not(filters);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return cljs.core.some(((function (seq__134854_135471,chunk__134855_135472,count__134856_135473,i__134857_135474,seq__134853,chunk__134858,count__134859,i__134860,or__5002__auto__,vec__135218_135475,s_135476,d_135477__$1,vec__135138,n,d,seq__134853__$1,temp__5804__auto__,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_){
return (function (p1__134845_SHARP_){
return (p1__134845_SHARP_.cljs$core$IFn$_invoke$arity$3 ? p1__134845_SHARP_.cljs$core$IFn$_invoke$arity$3(n,s_135476,d_135477__$1) : p1__134845_SHARP_.call(null,n,s_135476,d_135477__$1));
});})(seq__134854_135471,chunk__134855_135472,count__134856_135473,i__134857_135474,seq__134853,chunk__134858,count__134859,i__134860,or__5002__auto__,vec__135218_135475,s_135476,d_135477__$1,vec__135138,n,d,seq__134853__$1,temp__5804__auto__,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_))
,filters);
}
})())){
var temp__5804__auto___135478__$1 = malli.instrument._find_var(n,s_135476);
if(cljs.core.truth_(temp__5804__auto___135478__$1)){
var v_135479 = temp__5804__auto___135478__$1;
var G__135221_135482 = mode;
var G__135221_135483__$1 = (((G__135221_135482 instanceof cljs.core.Keyword))?G__135221_135482.fqn:null);
switch (G__135221_135483__$1) {
case "instrument":
var original_fn_135485 = (function (){var or__5002__auto__ = malli.instrument._original(v_135479);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return v_135479;
}
})();
var dgen_135486 = (function (){var $ = cljs.core.select_keys(options,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"scope","scope",-439358418),new cljs.core.Keyword(null,"report","report",1394055010),new cljs.core.Keyword(null,"gen","gen",142575302)], null));
var $__$1 = (function (){var G__135224 = $;
if(cljs.core.truth_(report)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__135224,new cljs.core.Keyword(null,"report","report",1394055010),((function (seq__134854_135471,chunk__134855_135472,count__134856_135473,i__134857_135474,seq__134853,chunk__134858,count__134859,i__134860,G__135224,$,original_fn_135485,G__135221_135482,G__135221_135483__$1,v_135479,temp__5804__auto___135478__$1,vec__135218_135475,s_135476,d_135477__$1,vec__135138,n,d,seq__134853__$1,temp__5804__auto__,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_){
return (function (r){
return ((function (seq__134854_135471,chunk__134855_135472,count__134856_135473,i__134857_135474,seq__134853,chunk__134858,count__134859,i__134860,G__135224,$,original_fn_135485,G__135221_135482,G__135221_135483__$1,v_135479,temp__5804__auto___135478__$1,vec__135218_135475,s_135476,d_135477__$1,vec__135138,n,d,seq__134853__$1,temp__5804__auto__,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_){
return (function (t,data__$1){
var G__135225 = t;
var G__135226 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(data__$1,new cljs.core.Keyword(null,"fn-name","fn-name",-766594004),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.name(n),cljs.core.name(s_135476)));
return (r.cljs$core$IFn$_invoke$arity$2 ? r.cljs$core$IFn$_invoke$arity$2(G__135225,G__135226) : r.call(null,G__135225,G__135226));
});
;})(seq__134854_135471,chunk__134855_135472,count__134856_135473,i__134857_135474,seq__134853,chunk__134858,count__134859,i__134860,G__135224,$,original_fn_135485,G__135221_135482,G__135221_135483__$1,v_135479,temp__5804__auto___135478__$1,vec__135218_135475,s_135476,d_135477__$1,vec__135138,n,d,seq__134853__$1,temp__5804__auto__,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_))
});})(seq__134854_135471,chunk__134855_135472,count__134856_135473,i__134857_135474,seq__134853,chunk__134858,count__134859,i__134860,G__135224,$,original_fn_135485,G__135221_135482,G__135221_135483__$1,v_135479,temp__5804__auto___135478__$1,vec__135218_135475,s_135476,d_135477__$1,vec__135138,n,d,seq__134853__$1,temp__5804__auto__,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_))
);
} else {
return G__135224;
}
})();
var $__$2 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([$__$1,d_135477__$1], 0));
if(cljs.core.truth_((function (){var and__5000__auto__ = gen;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"gen","gen",142575302).cljs$core$IFn$_invoke$arity$1(d_135477__$1) === true;
} else {
return and__5000__auto__;
}
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3($__$2,new cljs.core.Keyword(null,"gen","gen",142575302),gen);
} else {
if(new cljs.core.Keyword(null,"gen","gen",142575302).cljs$core$IFn$_invoke$arity$1(d_135477__$1) === true){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2($__$2,new cljs.core.Keyword(null,"gen","gen",142575302));
} else {
return $__$2;

}
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = original_fn_135485;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((function (){var and__5000__auto____$1 = skip_instrumented_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return malli.instrument._instrumented_QMARK_(v_135479);
} else {
return and__5000__auto____$1;
}
})());
} else {
return and__5000__auto__;
}
})())){
malli.instrument._replace_fn(original_fn_135485,n,s_135476,dgen_135486);
} else {
}

break;
case "unstrument":
if(malli.instrument._instrumented_QMARK_(v_135479)){
var original_fn_135492 = (function (){var or__5002__auto__ = malli.instrument._original(v_135479);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return v_135479;
}
})();
if(cljs.core.truth_(malli.instrument._pure_variadic_QMARK_(original_fn_135492))){
var accessor_135493 = "cljs$core$IFn$_invoke$arity$variadic";
var variadic_fn_135494 = malli.instrument.goog$module$goog$object.get(v_135479,accessor_135493);
var orig_variadic_fn_135495 = malli.instrument.goog$module$goog$object.get(variadic_fn_135494,"malli$instrument$original");
malli.instrument.goog$module$goog$object.set(original_fn_135492,accessor_135493,orig_variadic_fn_135495);
} else {
if(cljs.core.truth_(malli.instrument._max_fixed_arity(original_fn_135492))){
var seq__135230_135496 = cljs.core.seq(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.range.cljs$core$IFn$_invoke$arity$1((20)),"variadic"));
var chunk__135233_135497 = null;
var count__135234_135498 = (0);
var i__135235_135499 = (0);
while(true){
if((i__135235_135499 < count__135234_135498)){
var arity_135500 = chunk__135233_135497.cljs$core$IIndexed$_nth$arity$2(null,i__135235_135499);
var accessor_135501 = ["cljs$core$IFn$_invoke$arity$",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arity_135500)].join('');
var arity_fn_135502 = malli.instrument.goog$module$goog$object.get(original_fn_135492,accessor_135501);
if(cljs.core.truth_(arity_fn_135502)){
var orig_135503 = malli.instrument.goog$module$goog$object.get(arity_fn_135502,"malli$instrument$original");
malli.instrument.goog$module$goog$object.set(original_fn_135492,accessor_135501,orig_135503);


var G__135505 = seq__135230_135496;
var G__135506 = chunk__135233_135497;
var G__135507 = count__135234_135498;
var G__135508 = (i__135235_135499 + (1));
seq__135230_135496 = G__135505;
chunk__135233_135497 = G__135506;
count__135234_135498 = G__135507;
i__135235_135499 = G__135508;
continue;
} else {
var G__135510 = seq__135230_135496;
var G__135511 = chunk__135233_135497;
var G__135512 = count__135234_135498;
var G__135513 = (i__135235_135499 + (1));
seq__135230_135496 = G__135510;
chunk__135233_135497 = G__135511;
count__135234_135498 = G__135512;
i__135235_135499 = G__135513;
continue;
}
} else {
var temp__5804__auto___135514__$2 = cljs.core.seq(seq__135230_135496);
if(temp__5804__auto___135514__$2){
var seq__135230_135515__$1 = temp__5804__auto___135514__$2;
if(cljs.core.chunked_seq_QMARK_(seq__135230_135515__$1)){
var c__5525__auto___135516 = cljs.core.chunk_first(seq__135230_135515__$1);
var G__135517 = cljs.core.chunk_rest(seq__135230_135515__$1);
var G__135518 = c__5525__auto___135516;
var G__135519 = cljs.core.count(c__5525__auto___135516);
var G__135520 = (0);
seq__135230_135496 = G__135517;
chunk__135233_135497 = G__135518;
count__135234_135498 = G__135519;
i__135235_135499 = G__135520;
continue;
} else {
var arity_135521 = cljs.core.first(seq__135230_135515__$1);
var accessor_135522 = ["cljs$core$IFn$_invoke$arity$",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arity_135521)].join('');
var arity_fn_135523 = malli.instrument.goog$module$goog$object.get(original_fn_135492,accessor_135522);
if(cljs.core.truth_(arity_fn_135523)){
var orig_135524 = malli.instrument.goog$module$goog$object.get(arity_fn_135523,"malli$instrument$original");
malli.instrument.goog$module$goog$object.set(original_fn_135492,accessor_135522,orig_135524);


var G__135525 = cljs.core.next(seq__135230_135515__$1);
var G__135526 = null;
var G__135527 = (0);
var G__135528 = (0);
seq__135230_135496 = G__135525;
chunk__135233_135497 = G__135526;
count__135234_135498 = G__135527;
i__135235_135499 = G__135528;
continue;
} else {
var G__135529 = cljs.core.next(seq__135230_135515__$1);
var G__135530 = null;
var G__135531 = (0);
var G__135532 = (0);
seq__135230_135496 = G__135529;
chunk__135233_135497 = G__135530;
count__135234_135498 = G__135531;
i__135235_135499 = G__135532;
continue;
}
}
} else {
}
}
break;
}
} else {
malli.instrument.goog$module$goog$object.set(malli.instrument._get_ns(n),cljs.core.munge(cljs.core.name(s_135476)),original_fn_135492);

}
}
} else {
}

break;
default:
(mode.cljs$core$IFn$_invoke$arity$2 ? mode.cljs$core$IFn$_invoke$arity$2(v_135479,d_135477__$1) : mode.call(null,v_135479,d_135477__$1));

}
} else {
}
} else {
}


var G__135533 = seq__134854_135471;
var G__135534 = chunk__134855_135472;
var G__135535 = count__134856_135473;
var G__135536 = (i__134857_135474 + (1));
seq__134854_135471 = G__135533;
chunk__134855_135472 = G__135534;
count__134856_135473 = G__135535;
i__134857_135474 = G__135536;
continue;
} else {
var temp__5804__auto___135537__$1 = cljs.core.seq(seq__134854_135471);
if(temp__5804__auto___135537__$1){
var seq__134854_135539__$1 = temp__5804__auto___135537__$1;
if(cljs.core.chunked_seq_QMARK_(seq__134854_135539__$1)){
var c__5525__auto___135540 = cljs.core.chunk_first(seq__134854_135539__$1);
var G__135541 = cljs.core.chunk_rest(seq__134854_135539__$1);
var G__135542 = c__5525__auto___135540;
var G__135543 = cljs.core.count(c__5525__auto___135540);
var G__135544 = (0);
seq__134854_135471 = G__135541;
chunk__134855_135472 = G__135542;
count__134856_135473 = G__135543;
i__134857_135474 = G__135544;
continue;
} else {
var vec__135247_135545 = cljs.core.first(seq__134854_135539__$1);
var s_135546 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135247_135545,(0),null);
var d_135547__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135247_135545,(1),null);
if(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.not(filters);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return cljs.core.some(((function (seq__134854_135471,chunk__134855_135472,count__134856_135473,i__134857_135474,seq__134853,chunk__134858,count__134859,i__134860,or__5002__auto__,vec__135247_135545,s_135546,d_135547__$1,seq__134854_135539__$1,temp__5804__auto___135537__$1,vec__135138,n,d,seq__134853__$1,temp__5804__auto__,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_){
return (function (p1__134845_SHARP_){
return (p1__134845_SHARP_.cljs$core$IFn$_invoke$arity$3 ? p1__134845_SHARP_.cljs$core$IFn$_invoke$arity$3(n,s_135546,d_135547__$1) : p1__134845_SHARP_.call(null,n,s_135546,d_135547__$1));
});})(seq__134854_135471,chunk__134855_135472,count__134856_135473,i__134857_135474,seq__134853,chunk__134858,count__134859,i__134860,or__5002__auto__,vec__135247_135545,s_135546,d_135547__$1,seq__134854_135539__$1,temp__5804__auto___135537__$1,vec__135138,n,d,seq__134853__$1,temp__5804__auto__,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_))
,filters);
}
})())){
var temp__5804__auto___135553__$2 = malli.instrument._find_var(n,s_135546);
if(cljs.core.truth_(temp__5804__auto___135553__$2)){
var v_135554 = temp__5804__auto___135553__$2;
var G__135250_135556 = mode;
var G__135250_135557__$1 = (((G__135250_135556 instanceof cljs.core.Keyword))?G__135250_135556.fqn:null);
switch (G__135250_135557__$1) {
case "instrument":
var original_fn_135559 = (function (){var or__5002__auto__ = malli.instrument._original(v_135554);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return v_135554;
}
})();
var dgen_135560 = (function (){var $ = cljs.core.select_keys(options,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"scope","scope",-439358418),new cljs.core.Keyword(null,"report","report",1394055010),new cljs.core.Keyword(null,"gen","gen",142575302)], null));
var $__$1 = (function (){var G__135252 = $;
if(cljs.core.truth_(report)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__135252,new cljs.core.Keyword(null,"report","report",1394055010),((function (seq__134854_135471,chunk__134855_135472,count__134856_135473,i__134857_135474,seq__134853,chunk__134858,count__134859,i__134860,G__135252,$,original_fn_135559,G__135250_135556,G__135250_135557__$1,v_135554,temp__5804__auto___135553__$2,vec__135247_135545,s_135546,d_135547__$1,seq__134854_135539__$1,temp__5804__auto___135537__$1,vec__135138,n,d,seq__134853__$1,temp__5804__auto__,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_){
return (function (r){
return ((function (seq__134854_135471,chunk__134855_135472,count__134856_135473,i__134857_135474,seq__134853,chunk__134858,count__134859,i__134860,G__135252,$,original_fn_135559,G__135250_135556,G__135250_135557__$1,v_135554,temp__5804__auto___135553__$2,vec__135247_135545,s_135546,d_135547__$1,seq__134854_135539__$1,temp__5804__auto___135537__$1,vec__135138,n,d,seq__134853__$1,temp__5804__auto__,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_){
return (function (t,data__$1){
var G__135253 = t;
var G__135254 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(data__$1,new cljs.core.Keyword(null,"fn-name","fn-name",-766594004),cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.name(n),cljs.core.name(s_135546)));
return (r.cljs$core$IFn$_invoke$arity$2 ? r.cljs$core$IFn$_invoke$arity$2(G__135253,G__135254) : r.call(null,G__135253,G__135254));
});
;})(seq__134854_135471,chunk__134855_135472,count__134856_135473,i__134857_135474,seq__134853,chunk__134858,count__134859,i__134860,G__135252,$,original_fn_135559,G__135250_135556,G__135250_135557__$1,v_135554,temp__5804__auto___135553__$2,vec__135247_135545,s_135546,d_135547__$1,seq__134854_135539__$1,temp__5804__auto___135537__$1,vec__135138,n,d,seq__134853__$1,temp__5804__auto__,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_))
});})(seq__134854_135471,chunk__134855_135472,count__134856_135473,i__134857_135474,seq__134853,chunk__134858,count__134859,i__134860,G__135252,$,original_fn_135559,G__135250_135556,G__135250_135557__$1,v_135554,temp__5804__auto___135553__$2,vec__135247_135545,s_135546,d_135547__$1,seq__134854_135539__$1,temp__5804__auto___135537__$1,vec__135138,n,d,seq__134853__$1,temp__5804__auto__,map__134852,map__134852__$1,options,mode,data,filters,gen,report,skip_instrumented_QMARK_))
);
} else {
return G__135252;
}
})();
var $__$2 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([$__$1,d_135547__$1], 0));
if(cljs.core.truth_((function (){var and__5000__auto__ = gen;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"gen","gen",142575302).cljs$core$IFn$_invoke$arity$1(d_135547__$1) === true;
} else {
return and__5000__auto__;
}
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3($__$2,new cljs.core.Keyword(null,"gen","gen",142575302),gen);
} else {
if(new cljs.core.Keyword(null,"gen","gen",142575302).cljs$core$IFn$_invoke$arity$1(d_135547__$1) === true){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2($__$2,new cljs.core.Keyword(null,"gen","gen",142575302));
} else {
return $__$2;

}
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = original_fn_135559;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((function (){var and__5000__auto____$1 = skip_instrumented_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return malli.instrument._instrumented_QMARK_(v_135554);
} else {
return and__5000__auto____$1;
}
})());
} else {
return and__5000__auto__;
}
})())){
malli.instrument._replace_fn(original_fn_135559,n,s_135546,dgen_135560);
} else {
}

break;
case "unstrument":
if(malli.instrument._instrumented_QMARK_(v_135554)){
var original_fn_135567 = (function (){var or__5002__auto__ = malli.instrument._original(v_135554);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return v_135554;
}
})();
if(cljs.core.truth_(malli.instrument._pure_variadic_QMARK_(original_fn_135567))){
var accessor_135568 = "cljs$core$IFn$_invoke$arity$variadic";
var variadic_fn_135569 = malli.instrument.goog$module$goog$object.get(v_135554,accessor_135568);
var orig_variadic_fn_135570 = malli.instrument.goog$module$goog$object.get(variadic_fn_135569,"malli$instrument$original");
malli.instrument.goog$module$goog$object.set(original_fn_135567,accessor_135568,orig_variadic_fn_135570);
} else {
if(cljs.core.truth_(malli.instrument._max_fixed_arity(original_fn_135567))){
var seq__135259_135571 = cljs.core.seq(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.range.cljs$core$IFn$_invoke$arity$1((20)),"variadic"));
var chunk__135262_135572 = null;
var count__135263_135573 = (0);
var i__135264_135574 = (0);
while(true){
if((i__135264_135574 < count__135263_135573)){
var arity_135575 = chunk__135262_135572.cljs$core$IIndexed$_nth$arity$2(null,i__135264_135574);
var accessor_135576 = ["cljs$core$IFn$_invoke$arity$",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arity_135575)].join('');
var arity_fn_135577 = malli.instrument.goog$module$goog$object.get(original_fn_135567,accessor_135576);
if(cljs.core.truth_(arity_fn_135577)){
var orig_135578 = malli.instrument.goog$module$goog$object.get(arity_fn_135577,"malli$instrument$original");
malli.instrument.goog$module$goog$object.set(original_fn_135567,accessor_135576,orig_135578);


var G__135579 = seq__135259_135571;
var G__135580 = chunk__135262_135572;
var G__135581 = count__135263_135573;
var G__135582 = (i__135264_135574 + (1));
seq__135259_135571 = G__135579;
chunk__135262_135572 = G__135580;
count__135263_135573 = G__135581;
i__135264_135574 = G__135582;
continue;
} else {
var G__135583 = seq__135259_135571;
var G__135584 = chunk__135262_135572;
var G__135585 = count__135263_135573;
var G__135586 = (i__135264_135574 + (1));
seq__135259_135571 = G__135583;
chunk__135262_135572 = G__135584;
count__135263_135573 = G__135585;
i__135264_135574 = G__135586;
continue;
}
} else {
var temp__5804__auto___135587__$3 = cljs.core.seq(seq__135259_135571);
if(temp__5804__auto___135587__$3){
var seq__135259_135588__$1 = temp__5804__auto___135587__$3;
if(cljs.core.chunked_seq_QMARK_(seq__135259_135588__$1)){
var c__5525__auto___135589 = cljs.core.chunk_first(seq__135259_135588__$1);
var G__135590 = cljs.core.chunk_rest(seq__135259_135588__$1);
var G__135591 = c__5525__auto___135589;
var G__135592 = cljs.core.count(c__5525__auto___135589);
var G__135593 = (0);
seq__135259_135571 = G__135590;
chunk__135262_135572 = G__135591;
count__135263_135573 = G__135592;
i__135264_135574 = G__135593;
continue;
} else {
var arity_135596 = cljs.core.first(seq__135259_135588__$1);
var accessor_135597 = ["cljs$core$IFn$_invoke$arity$",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arity_135596)].join('');
var arity_fn_135598 = malli.instrument.goog$module$goog$object.get(original_fn_135567,accessor_135597);
if(cljs.core.truth_(arity_fn_135598)){
var orig_135599 = malli.instrument.goog$module$goog$object.get(arity_fn_135598,"malli$instrument$original");
malli.instrument.goog$module$goog$object.set(original_fn_135567,accessor_135597,orig_135599);


var G__135600 = cljs.core.next(seq__135259_135588__$1);
var G__135601 = null;
var G__135602 = (0);
var G__135603 = (0);
seq__135259_135571 = G__135600;
chunk__135262_135572 = G__135601;
count__135263_135573 = G__135602;
i__135264_135574 = G__135603;
continue;
} else {
var G__135604 = cljs.core.next(seq__135259_135588__$1);
var G__135605 = null;
var G__135606 = (0);
var G__135607 = (0);
seq__135259_135571 = G__135604;
chunk__135262_135572 = G__135605;
count__135263_135573 = G__135606;
i__135264_135574 = G__135607;
continue;
}
}
} else {
}
}
break;
}
} else {
malli.instrument.goog$module$goog$object.set(malli.instrument._get_ns(n),cljs.core.munge(cljs.core.name(s_135546)),original_fn_135567);

}
}
} else {
}

break;
default:
(mode.cljs$core$IFn$_invoke$arity$2 ? mode.cljs$core$IFn$_invoke$arity$2(v_135554,d_135547__$1) : mode.call(null,v_135554,d_135547__$1));

}
} else {
}
} else {
}


var G__135608 = cljs.core.next(seq__134854_135539__$1);
var G__135609 = null;
var G__135610 = (0);
var G__135611 = (0);
seq__134854_135471 = G__135608;
chunk__134855_135472 = G__135609;
count__134856_135473 = G__135610;
i__134857_135474 = G__135611;
continue;
}
} else {
}
}
break;
}

var G__135612 = cljs.core.next(seq__134853__$1);
var G__135613 = null;
var G__135614 = (0);
var G__135615 = (0);
seq__134853 = G__135612;
chunk__134858 = G__135613;
count__134859 = G__135614;
i__134860 = G__135615;
continue;
}
} else {
return null;
}
}
break;
}
}));

(malli.instrument._strument_BANG_.cljs$lang$maxFixedArity = 1);

/**
 * Checks all registered function schemas using generative testing.
 * Returns nil or a map of symbol -> explanation in case of errors.
 */
malli.instrument.check = (function malli$instrument$check(var_args){
var G__135270 = arguments.length;
switch (G__135270) {
case 0:
return malli.instrument.check.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return malli.instrument.check.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(malli.instrument.check.cljs$core$IFn$_invoke$arity$0 = (function (){
return malli.instrument.check.cljs$core$IFn$_invoke$arity$1(null);
}));

(malli.instrument.check.cljs$core$IFn$_invoke$arity$1 = (function (options){
var res_STAR_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
malli.instrument._strument_BANG_.cljs$core$IFn$_invoke$arity$1(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(options,new cljs.core.Keyword(null,"mode","mode",654403691),(function (v,p__135272){
var map__135273 = p__135272;
var map__135273__$1 = cljs.core.__destructure_map(map__135273);
var schema = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135273__$1,new cljs.core.Keyword(null,"schema","schema",-1582001791));
var ns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135273__$1,new cljs.core.Keyword(null,"ns","ns",441598760));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135273__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var G__135274 = malli.generator.check.cljs$core$IFn$_invoke$arity$2(schema,malli.instrument._original(v));
if((G__135274 == null)){
return null;
} else {
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(res_STAR_,cljs.core.assoc,cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(ns,name),G__135274);
}
})));

return cljs.core.not_empty(cljs.core.deref(res_STAR_));
}));

(malli.instrument.check.cljs$lang$maxFixedArity = 1);

/**
 * Applies instrumentation for a filtered set of function Vars (e.g. `defn`s).
 * See [[malli.core/-instrument]] for possible options.
 */
malli.instrument.instrument_BANG_ = (function malli$instrument$instrument_BANG_(var_args){
var G__135280 = arguments.length;
switch (G__135280) {
case 0:
return malli.instrument.instrument_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return malli.instrument.instrument_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(malli.instrument.instrument_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return malli.instrument.instrument_BANG_.cljs$core$IFn$_invoke$arity$1(null);
}));

(malli.instrument.instrument_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (options){
return malli.instrument._strument_BANG_.cljs$core$IFn$_invoke$arity$1(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(options,new cljs.core.Keyword(null,"mode","mode",654403691),new cljs.core.Keyword(null,"instrument","instrument",-960698844)));
}));

(malli.instrument.instrument_BANG_.cljs$lang$maxFixedArity = 1);

/**
 * Removes instrumentation from a filtered set of function Vars (e.g. `defn`s).
 * See [[malli.core/-instrument]] for possible options.
 */
malli.instrument.unstrument_BANG_ = (function malli$instrument$unstrument_BANG_(var_args){
var G__135282 = arguments.length;
switch (G__135282) {
case 0:
return malli.instrument.unstrument_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return malli.instrument.unstrument_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(malli.instrument.unstrument_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return malli.instrument.unstrument_BANG_.cljs$core$IFn$_invoke$arity$1(null);
}));

(malli.instrument.unstrument_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (options){
return malli.instrument._strument_BANG_.cljs$core$IFn$_invoke$arity$1(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(options,new cljs.core.Keyword(null,"mode","mode",654403691),new cljs.core.Keyword(null,"unstrument","unstrument",-312041116)));
}));

(malli.instrument.unstrument_BANG_.cljs$lang$maxFixedArity = 1);


//# sourceMappingURL=malli.instrument.js.map
