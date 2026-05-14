goog.provide('frontend.worker.thread_atom');
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","update-thread-atom","thread-api/update-thread-atom",-496405616),(function frontend$worker$thread_atom$thread_api__update_thread_atom(atom_key,new_value){
if((((atom_key instanceof cljs.core.Keyword)) && (("thread-atom" === cljs.core.namespace(atom_key))))){
} else {
throw (new Error("Assert failed: (and (keyword? atom-key) (identical? \"thread-atom\" (namespace atom-key)))"));
}

var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.state._STAR_state),atom_key);
if(cljs.core.truth_(temp__5804__auto__)){
var a = temp__5804__auto__;
cljs.core.reset_BANG_(a,new_value);

return null;
} else {
return null;
}
})));

//# sourceMappingURL=frontend.worker.thread_atom.js.map
