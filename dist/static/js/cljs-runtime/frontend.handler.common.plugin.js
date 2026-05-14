goog.provide('frontend.handler.common.plugin');
frontend.handler.common.plugin.get_web_plugin_checker_url_BANG_ = (function frontend$handler$common$plugin$get_web_plugin_checker_url_BANG_(var_args){
var G__100352 = arguments.length;
switch (G__100352) {
case 1:
return frontend.handler.common.plugin.get_web_plugin_checker_url_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.common.plugin.get_web_plugin_checker_url_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.common.plugin.get_web_plugin_checker_url_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (repo){
return frontend.handler.common.plugin.get_web_plugin_checker_url_BANG_.cljs$core$IFn$_invoke$arity$2(repo,"");
}));

(frontend.handler.common.plugin.get_web_plugin_checker_url_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (repo,version){
var G__100355 = "https://plugins.logseq.io/r2";
var G__100356 = repo;
var G__100357 = (((!(typeof version === 'string')))?"":version);
return (frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$3 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$3(G__100355,G__100356,G__100357) : frontend.util.node_path.join.call(null,G__100355,G__100356,G__100357));
}));

(frontend.handler.common.plugin.get_web_plugin_checker_url_BANG_.cljs$lang$maxFixedArity = 2);

frontend.handler.common.plugin.fetch_web_plugin_entry_info = (function frontend$handler$common$plugin$fetch_web_plugin_entry_info(repo,version){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.common.plugin.get_web_plugin_checker_url_BANG_.cljs$core$IFn$_invoke$arity$2(repo,version)),(function (url){
return promesa.protocols._mcat(promesa.protocols._promise(window.fetch(url)),(function (res){
return promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = res.ok;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(res.status,(200));
} else {
return and__5000__auto__;
}
})())?promesa.core.then.cljs$core$IFn$_invoke$arity$2(res.json(),(function (p1__100358_SHARP_){
return cljs_bean.core.__GT_clj(p1__100358_SHARP_);
})):promesa.core.then.cljs$core$IFn$_invoke$arity$2(res.text(),(function (error_text){
throw (new Error(["web-plugin-entry-error:",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error_text)].join('')));
}))));
}));
}));
}));
});
/**
 * For the given plugin id, returns boolean indicating if it is installed
 */
frontend.handler.common.plugin.installed_QMARK_ = (function frontend$handler$common$plugin$installed_QMARK_(id){
return cljs.core.contains_QMARK_(new cljs.core.Keyword("plugin","installed-plugins","plugin/installed-plugins",-1068618034).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(id));
});
frontend.handler.common.plugin.emit_lsp_updates_BANG_ = (function frontend$handler$common$plugin$emit_lsp_updates_BANG_(payload){
console.log("debug:lsp-updates:",payload);

return window.apis.emit(cljs.core.name(new cljs.core.Keyword(null,"lsp-updates","lsp-updates",1924425351)),cljs_bean.core.__GT_js(payload));
});
frontend.handler.common.plugin.async_install_or_update_for_web_BANG_ = (function frontend$handler$common$plugin$async_install_or_update_for_web_BANG_(p__100361){
var map__100362 = p__100361;
var map__100362__$1 = cljs.core.__destructure_map(map__100362);
var manifest = map__100362__$1;
var version = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100362__$1,new cljs.core.Keyword(null,"version","version",425292698));
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100362__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
var only_check = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100362__$1,new cljs.core.Keyword(null,"only-check","only-check",-1961506795));
console.log("debug:plugin:",(cljs.core.truth_(only_check)?"Checking":"Installing")," #",repo);

var version__$1 = ((cljs.core.not(only_check))?new cljs.core.Keyword(null,"latest-version","latest-version",-1985110248).cljs$core$IFn$_invoke$arity$1(manifest):version);
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.common.plugin.fetch_web_plugin_entry_info(repo,(cljs.core.truth_(only_check)?"":version__$1)),(function (web_pkg){
var web_pkg__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([web_pkg,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(manifest,new cljs.core.Keyword(null,"stat","stat",-1370599836),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"version","version",425292698),new cljs.core.Keyword(null,"only-check","only-check",-1961506795)], 0))], 0));
var latest_version = new cljs.core.Keyword(null,"version","version",425292698).cljs$core$IFn$_invoke$arity$1(web_pkg__$1);
var valid_latest_version = (cljs.core.truth_(only_check)?(function (){var coerced_current_version = frontend.util.sem_ver.coerce(version__$1);
var coerced_latest_version = frontend.util.sem_ver.coerce(latest_version);
if(cljs.core.truth_((function (){var and__5000__auto__ = coerced_current_version;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = coerced_latest_version;
if(cljs.core.truth_(and__5000__auto____$1)){
return (frontend.util.sem_ver.lt.cljs$core$IFn$_invoke$arity$2 ? frontend.util.sem_ver.lt.cljs$core$IFn$_invoke$arity$2(coerced_current_version,coerced_latest_version) : frontend.util.sem_ver.lt.call(null,coerced_current_version,coerced_latest_version));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return latest_version;
} else {
throw (new Error(new cljs.core.Keyword(null,"no-new-version","no-new-version",-944956961)));
}
})():null);
return frontend.handler.common.plugin.emit_lsp_updates_BANG_(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"completed","completed",-486056503),new cljs.core.Keyword(null,"only-check","only-check",-1961506795),only_check,new cljs.core.Keyword(null,"payload","payload",-383036092),(cljs.core.truth_(only_check)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(manifest,new cljs.core.Keyword(null,"latest-version","latest-version",-1985110248),valid_latest_version,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"latest-notes","latest-notes",-368663386),(function (){var G__100364 = web_pkg__$1;
var G__100364__$1 = (((G__100364 == null))?null:new cljs.core.Keyword(null,"_objectExtra","_objectExtra",-262784354).cljs$core$IFn$_invoke$arity$1(G__100364));
if((G__100364__$1 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"releaseNotes","releaseNotes",959586112).cljs$core$IFn$_invoke$arity$1(G__100364__$1);
}
})()], 0)):cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(manifest,new cljs.core.Keyword(null,"dst","dst",844682948),repo,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"version","version",425292698),latest_version,new cljs.core.Keyword(null,"web-pkg","web-pkg",304735692),web_pkg__$1], 0)))], null));
})),(function (e){
return frontend.handler.common.plugin.emit_lsp_updates_BANG_(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"only-check","only-check",-1961506795),only_check,new cljs.core.Keyword(null,"payload","payload",-383036092),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(manifest,new cljs.core.Keyword(null,"error-code","error-code",180497232),e.message)], null));
}));
});
/**
 * Installs plugin given plugin map with id
 */
frontend.handler.common.plugin.install_marketplace_plugin_BANG_ = (function frontend$handler$common$plugin$install_marketplace_plugin_BANG_(p__100374){
var map__100376 = p__100374;
var map__100376__$1 = cljs.core.__destructure_map(map__100376);
var manifest = map__100376__$1;
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100376__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("plugin","installing","plugin/installing",-755703581).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.common.plugin.installed_QMARK_(id);
} else {
return and__5000__auto__;
}
})())){
return null;
} else {
frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","installing","plugin/installing",-755703581),manifest);

if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"installMarketPlugin","installMarketPlugin",842572313),manifest], 0));
} else {
return frontend.handler.common.plugin.async_install_or_update_for_web_BANG_(manifest);
}
}
});
/**
 * Unregister and uninstall plugin given plugin id
 */
frontend.handler.common.plugin.unregister_plugin = (function frontend$handler$common$plugin$unregister_plugin(id){
return LSPluginCore.unregister(id);
});

//# sourceMappingURL=frontend.handler.common.plugin.js.map
