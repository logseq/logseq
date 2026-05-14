goog.provide('frontend.common.thread_api');
frontend.common.thread_api._STAR_thread_apis = cljs.core.volatile_BANG_(cljs.core.PersistentArrayMap.EMPTY);
frontend.common.thread_api._STAR_profile = cljs.core.volatile_BANG_(cljs.core.PersistentArrayMap.EMPTY);
/**
 * Return a promise whose value is transit-str.
 */
frontend.common.thread_api.remote_function = (function frontend$common$thread_api$remote_function(qualified_kw_str,args_direct_passthrough_QMARK_,args_transit_str_or_args_array){
var qkw = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(qualified_kw_str);
frontend.common.thread_api._STAR_profile.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.update.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_profile.cljs$core$IDeref$_deref$arity$1(null),qkw,cljs.core.inc));

var temp__5802__auto__ = (function (){var fexpr__43961 = cljs.core.deref(frontend.common.thread_api._STAR_thread_apis);
return (fexpr__43961.cljs$core$IFn$_invoke$arity$1 ? fexpr__43961.cljs$core$IFn$_invoke$arity$1(qkw) : fexpr__43961.call(null,qkw));
})();
if(cljs.core.truth_(temp__5802__auto__)){
var f = temp__5802__auto__;
var result = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,(function (){var G__43962 = args_transit_str_or_args_array;
if(cljs.core.not(args_direct_passthrough_QMARK_)){
return logseq.db.read_transit_str(G__43962);
} else {
return G__43962;
}
})());
var result_promise = ((cljs.core.fn_QMARK_(result))?(new Promise(result)):result);
return promesa.core.chain.cljs$core$IFn$_invoke$arity$2(result_promise,logseq.db.write_transit_str);
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["not found thread-api: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(qualified_kw_str)].join(''),cljs.core.PersistentArrayMap.EMPTY);
}
});

//# sourceMappingURL=frontend.common.thread_api.js.map
