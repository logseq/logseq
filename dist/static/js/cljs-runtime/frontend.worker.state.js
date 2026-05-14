goog.provide('frontend.worker.state');
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.state !== 'undefined') && (typeof frontend.worker.state._STAR_main_thread !== 'undefined')){
} else {
frontend.worker.state._STAR_main_thread = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.worker.state._LT_invoke_main_thread_STAR_ = (function frontend$worker$state$_LT_invoke_main_thread_STAR_(qkw,direct_pass_args_QMARK_,args_list){
var main_thread = cljs.core.deref(frontend.worker.state._STAR_main_thread);
if((main_thread == null)){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"<invoke-main-thread-error","<invoke-main-thread-error",2070918841),qkw], 0));

throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("main-thread has not been initialized",cljs.core.PersistentArrayMap.EMPTY);
} else {
}

return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(main_thread,qkw,direct_pass_args_QMARK_,args_list);
});
/**
 * invoke main thread api
 */
frontend.worker.state._LT_invoke_main_thread = (function frontend$worker$state$_LT_invoke_main_thread(var_args){
var args__5732__auto__ = [];
var len__5726__auto___67604 = arguments.length;
var i__5727__auto___67605 = (0);
while(true){
if((i__5727__auto___67605 < len__5726__auto___67604)){
args__5732__auto__.push((arguments[i__5727__auto___67605]));

var G__67606 = (i__5727__auto___67605 + (1));
i__5727__auto___67605 = G__67606;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.worker.state._LT_invoke_main_thread.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.worker.state._LT_invoke_main_thread.cljs$core$IFn$_invoke$arity$variadic = (function (qkw,args){
return frontend.worker.state._LT_invoke_main_thread_STAR_(qkw,false,args);
}));

(frontend.worker.state._LT_invoke_main_thread.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.worker.state._LT_invoke_main_thread.cljs$lang$applyTo = (function (seq67536){
var G__67538 = cljs.core.first(seq67536);
var seq67536__$1 = cljs.core.next(seq67536);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67538,seq67536__$1);
}));

if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.state !== 'undefined') && (typeof frontend.worker.state._STAR_state !== 'undefined')){
} else {
frontend.worker.state._STAR_state = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword("auth","id-token","auth/id-token",-332149946),new cljs.core.Keyword(null,"config","config",994861415),new cljs.core.Keyword("auth","refresh-token","auth/refresh-token",-1024820760),new cljs.core.Keyword("auth","access-token","auth/access-token",-657486615),new cljs.core.Keyword("git","current-repo","git/current-repo",107438825),new cljs.core.Keyword("db","latest-transact-time","db/latest-transact-time",202350481),new cljs.core.Keyword("worker","context","worker/context",-1507477131),new cljs.core.Keyword("rtc","downloading-graph?","rtc/downloading-graph?",1833177913),new cljs.core.Keyword("thread-atom","online-event","thread-atom/online-event",-68671588)],[null,cljs.core.PersistentArrayMap.EMPTY,null,null,null,cljs.core.PersistentArrayMap.EMPTY,cljs.core.PersistentArrayMap.EMPTY,false,cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null)]));
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.state !== 'undefined') && (typeof frontend.worker.state._STAR_rtc_ws_url !== 'undefined')){
} else {
frontend.worker.state._STAR_rtc_ws_url = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.state !== 'undefined') && (typeof frontend.worker.state._STAR_sqlite !== 'undefined')){
} else {
frontend.worker.state._STAR_sqlite = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.state !== 'undefined') && (typeof frontend.worker.state._STAR_sqlite_conns !== 'undefined')){
} else {
frontend.worker.state._STAR_sqlite_conns = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.state !== 'undefined') && (typeof frontend.worker.state._STAR_datascript_conns !== 'undefined')){
} else {
frontend.worker.state._STAR_datascript_conns = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.state !== 'undefined') && (typeof frontend.worker.state._STAR_client_ops_conns !== 'undefined')){
} else {
frontend.worker.state._STAR_client_ops_conns = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.state !== 'undefined') && (typeof frontend.worker.state._STAR_opfs_pools !== 'undefined')){
} else {
frontend.worker.state._STAR_opfs_pools = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.worker.state.get_sqlite_conn = (function frontend$worker$state$get_sqlite_conn(var_args){
var G__67566 = arguments.length;
switch (G__67566) {
case 1:
return frontend.worker.state.get_sqlite_conn.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.worker.state.get_sqlite_conn.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.worker.state.get_sqlite_conn.cljs$core$IFn$_invoke$arity$1 = (function (repo){
return frontend.worker.state.get_sqlite_conn.cljs$core$IFn$_invoke$arity$2(repo,new cljs.core.Keyword(null,"db","db",993250759));
}));

(frontend.worker.state.get_sqlite_conn.cljs$core$IFn$_invoke$arity$2 = (function (repo,which_db){
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"db","db",993250759),null,new cljs.core.Keyword(null,"client-ops","client-ops",-1058023795),null,new cljs.core.Keyword(null,"search","search",1564939822),null], null), null),which_db)){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(which_db),"\n","(contains? #{:db :client-ops :search} which-db)"].join('')));
}

return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.state._STAR_sqlite_conns),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [repo,which_db], null));
}));

(frontend.worker.state.get_sqlite_conn.cljs$lang$maxFixedArity = 2);

frontend.worker.state.get_datascript_conn = (function frontend$worker$state$get_datascript_conn(repo){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.state._STAR_datascript_conns),repo);
});
frontend.worker.state.get_client_ops_conn = (function frontend$worker$state$get_client_ops_conn(repo){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.state._STAR_client_ops_conns),repo);
});
frontend.worker.state.get_opfs_pool = (function frontend$worker$state$get_opfs_pool(repo){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.state._STAR_opfs_pools),repo);
});
frontend.worker.state.tx_idle_QMARK_ = (function frontend$worker$state$tx_idle_QMARK_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___67612 = arguments.length;
var i__5727__auto___67613 = (0);
while(true){
if((i__5727__auto___67613 < len__5726__auto___67612)){
args__5732__auto__.push((arguments[i__5727__auto___67613]));

var G__67614 = (i__5727__auto___67613 + (1));
i__5727__auto___67613 = G__67614;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.worker.state.tx_idle_QMARK_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.worker.state.tx_idle_QMARK_.cljs$core$IFn$_invoke$arity$variadic = (function (repo,p__67588){
var map__67589 = p__67588;
var map__67589__$1 = cljs.core.__destructure_map(map__67589);
var diff = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__67589__$1,new cljs.core.Keyword(null,"diff","diff",2135942783),(1000));
if(cljs.core.truth_(repo)){
var last_input_time = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.state._STAR_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","latest-transact-time","db/latest-transact-time",202350481),repo], null));
var or__5002__auto__ = (last_input_time == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var now = logseq.common.util.time_ms();
return ((now - last_input_time) >= diff);
}
} else {
return null;
}
}));

(frontend.worker.state.tx_idle_QMARK_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.worker.state.tx_idle_QMARK_.cljs$lang$applyTo = (function (seq67584){
var G__67585 = cljs.core.first(seq67584);
var seq67584__$1 = cljs.core.next(seq67584);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67585,seq67584__$1);
}));

frontend.worker.state.set_db_latest_tx_time_BANG_ = (function frontend$worker$state$set_db_latest_tx_time_BANG_(repo){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.state._STAR_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","latest-transact-time","db/latest-transact-time",202350481),repo], null),logseq.common.util.time_ms());
});
frontend.worker.state.get_context = (function frontend$worker$state$get_context(){
return new cljs.core.Keyword("worker","context","worker/context",-1507477131).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.worker.state._STAR_state));
});
frontend.worker.state.set_context_BANG_ = (function frontend$worker$state$set_context_BANG_(context){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.state._STAR_state,cljs.core.assoc,new cljs.core.Keyword("worker","context","worker/context",-1507477131),context);
});
frontend.worker.state.update_context_BANG_ = (function frontend$worker$state$update_context_BANG_(context){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.state._STAR_state,cljs.core.update,new cljs.core.Keyword("worker","context","worker/context",-1507477131),(function (c){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([c,context], 0));
}));
});
frontend.worker.state.get_config = (function frontend$worker$state$get_config(repo){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.state._STAR_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"config","config",994861415),repo], null));
});
frontend.worker.state.get_current_repo = (function frontend$worker$state$get_current_repo(){
return new cljs.core.Keyword("git","current-repo","git/current-repo",107438825).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.worker.state._STAR_state));
});
frontend.worker.state.set_new_state_BANG_ = (function frontend$worker$state$set_new_state_BANG_(new_state){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.worker.state._STAR_state,(function (old_state){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([old_state,new_state], 0));
}));
});
frontend.worker.state.get_date_formatter = (function frontend$worker$state$get_date_formatter(repo){
return logseq.common.config.get_date_formatter(frontend.worker.state.get_config(repo));
});
frontend.worker.state.set_rtc_downloading_graph_BANG_ = (function frontend$worker$state$set_rtc_downloading_graph_BANG_(value){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.state._STAR_state,cljs.core.assoc,new cljs.core.Keyword("rtc","downloading-graph?","rtc/downloading-graph?",1833177913),value);
});
frontend.worker.state.get_id_token = (function frontend$worker$state$get_id_token(){
return new cljs.core.Keyword("auth","id-token","auth/id-token",-332149946).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.worker.state._STAR_state));
});

//# sourceMappingURL=frontend.worker.state.js.map
