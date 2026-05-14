goog.provide('capacitor.bootstrap');
goog.scope(function(){
  capacitor.bootstrap.goog$module$goog$object = goog.module.get('goog.object');
});
capacitor.bootstrap.restore_and_setup_BANG_ = (function capacitor$bootstrap$restore_and_setup_BANG_(repo){
if(cljs.core.truth_(repo)){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___51227__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.restore.restore_graph_BANG_(repo)),(function (_){
return promesa.protocols._promise(frontend.handler.repo_config.start(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo], null)));
}));
})),(function (){
return console.log("db restored, setting up repo hooks");
})),(function (error){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("capacitor.bootstrap",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"exception","exception",-335277064),error,new cljs.core.Keyword(null,"line","line",212345235),33], null)),error);
}));
} else {
return null;
}
});
capacitor.bootstrap.handle_connection_change = (function capacitor$bootstrap$handle_connection_change(e){
var online_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(capacitor.bootstrap.goog$module$goog$object.get(e,"type"),"online");
return frontend.state.set_online_BANG_(online_QMARK_);
});
capacitor.bootstrap.set_network_watcher_BANG_ = (function capacitor$bootstrap$set_network_watcher_BANG_(){
window.addEventListener("online",capacitor.bootstrap.handle_connection_change);

return window.addEventListener("offline",capacitor.bootstrap.handle_connection_change);
});
capacitor.bootstrap.start_BANG_ = (function capacitor$bootstrap$start_BANG_(render){
frontend.idb.start();

frontend.state.set_db_restoring_BANG_(true);

(render.cljs$core$IFn$_invoke$arity$0 ? render.cljs$core$IFn$_invoke$arity$0() : render.call(null));

frontend.context.i18n.start();

frontend.state.set_online_BANG_(navigator.onLine);

capacitor.bootstrap.set_network_watcher_BANG_();

promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(frontend.util.indexeddb_check_QMARK_(),(function (_e){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3("Sorry, it seems that your browser doesn't support IndexedDB, we recommend to use latest Chrome(Chromium) or Firefox(Non-private mode).",new cljs.core.Keyword(null,"error","error",-978969032),false);

return frontend.state.set_indexedb_support_BANG_(false);
}));

frontend.db.react.run_custom_queries_when_idle_BANG_();

capacitor.events.run_BANG_();

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___51203__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___51227__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db.browser.start_db_worker_BANG_()),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo.get_repos()),(function (repos){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_repos_BANG_(repos)),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(cljs.core.first(repos));
}
})()),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.empty_QMARK_(repos))?frontend.handler.repo.new_db_BANG_.cljs$core$IFn$_invoke$arity$1(frontend.config.demo_repo):capacitor.bootstrap.restore_and_setup_BANG_(repo))),(function (___$2){
return promesa.protocols._promise(cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug-start-repos","debug-start-repos",-291534982),repos], 0)));
}));
}));
}));
}));
}));
})),(function (e){
return console.error("Error while restoring repos: ",e);
})),(function (){
return frontend.state.set_db_restoring_BANG_(false);
}))),(function (___51192__auto__){
return promesa.protocols._promise(frontend.util._LT_app_wake_up_from_sleep_loop(cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false)));
}));
}));
});
capacitor.bootstrap.stop_BANG_ = (function capacitor$bootstrap$stop_BANG_(){
return cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["stop!"], 0));
});

//# sourceMappingURL=capacitor.bootstrap.js.map
