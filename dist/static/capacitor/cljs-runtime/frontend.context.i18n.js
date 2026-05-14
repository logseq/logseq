goog.provide('frontend.context.i18n');
frontend.context.i18n.dicts = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.dicts.dicts,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("tongue","fallback","tongue/fallback",1378320181),new cljs.core.Keyword(null,"en","en",88457073)], null)], 0));
frontend.context.i18n.translate = tongue.core.build_translate(frontend.context.i18n.dicts);
frontend.context.i18n.t = (function frontend$context$i18n$t(var_args){
var args__5732__auto__ = [];
var len__5726__auto___62456 = arguments.length;
var i__5727__auto___62457 = (0);
while(true){
if((i__5727__auto___62457 < len__5726__auto___62456)){
args__5732__auto__.push((arguments[i__5727__auto___62457]));

var G__62458 = (i__5727__auto___62457 + (1));
i__5727__auto___62457 = G__62458;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic = (function (args){
var preferred_language = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(frontend.state.sub(new cljs.core.Keyword(null,"preferred-language","preferred-language",-1247855017)));
try{return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(frontend.context.i18n.translate,preferred_language,args);
}catch (e62440){var e = e62440;
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.context.i18n",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"failed-translation","failed-translation",-790554549),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"arguments","arguments",-1182834456),args,new cljs.core.Keyword(null,"lang","lang",-1819677104),preferred_language], null),new cljs.core.Keyword(null,"line","line",212345235),23], null)),null);

frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"capture-error","capture-error",583122432),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),e,new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"failed-translation","failed-translation",-790554549),new cljs.core.Keyword(null,"arguments","arguments",-1182834456),args,new cljs.core.Keyword(null,"lang","lang",-1819677104),preferred_language], null)], null)], null));

return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(frontend.context.i18n.translate,new cljs.core.Keyword(null,"en","en",88457073),args);
}}));

(frontend.context.i18n.t.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.context.i18n.t.cljs$lang$applyTo = (function (seq62428){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq62428));
}));

frontend.context.i18n.tt = (function frontend$context$i18n$tt(var_args){
var args__5732__auto__ = [];
var len__5726__auto___62459 = arguments.length;
var i__5727__auto___62460 = (0);
while(true){
if((i__5727__auto___62460 < len__5726__auto___62459)){
args__5732__auto__.push((arguments[i__5727__auto___62460]));

var G__62461 = (i__5727__auto___62460 + (1));
i__5727__auto___62460 = G__62461;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.context.i18n.tt.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.context.i18n.tt.cljs$core$IFn$_invoke$arity$variadic = (function (keys){
var G__62451 = medley.core.find_first.cljs$core$IFn$_invoke$arity$2((function (p1__62442_SHARP_){
return (!(clojure.string.starts_with_QMARK_(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p1__62442_SHARP_], 0)),"{Missing key")));
}),keys);
if((G__62451 == null)){
return null;
} else {
return frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__62451], 0));
}
}));

(frontend.context.i18n.tt.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.context.i18n.tt.cljs$lang$applyTo = (function (seq62445){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq62445));
}));

frontend.context.i18n.fetch_local_language = (function frontend$context$i18n$fetch_local_language(){
return window.navigator.language;
});
frontend.context.i18n.start = (function frontend$context$i18n$start(){
var preferred_language = frontend.state.sub(new cljs.core.Keyword(null,"preferred-language","preferred-language",-1247855017));
if((preferred_language == null)){
return frontend.state.set_preferred_language_BANG_(frontend.context.i18n.fetch_local_language());
} else {
return null;
}
});

//# sourceMappingURL=frontend.context.i18n.js.map
