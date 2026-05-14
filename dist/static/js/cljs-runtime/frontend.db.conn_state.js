goog.provide('frontend.db.conn_state');
if((typeof frontend !== 'undefined') && (typeof frontend.db !== 'undefined') && (typeof frontend.db.conn_state !== 'undefined') && (typeof frontend.db.conn_state.conns !== 'undefined')){
} else {
frontend.db.conn_state.conns = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
frontend.db.conn_state.get_repo_path = (function frontend$db$conn_state$get_repo_path(url){
if(typeof url === 'string'){
} else {
throw (new Error(["Assert failed: ",["url is not a string: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.type(url))].join(''),"\n","(string? url)"].join('')));
}

return url;
});
frontend.db.conn_state.get_conn = (function frontend$db$conn_state$get_conn(repo){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.db.conn_state.conns),frontend.db.conn_state.get_repo_path(repo));
});

//# sourceMappingURL=frontend.db.conn_state.js.map
