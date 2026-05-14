goog.provide('frontend.handler.plugin');
frontend.handler.plugin.normalize_keyword_for_json = (function frontend$handler$plugin$normalize_keyword_for_json(input){
if(cljs.core.truth_(input)){
var f = (function (p__100908){
var vec__100909 = p__100908;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100909,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100909,(1),null);
if((k instanceof cljs.core.Keyword)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [camel_snake_kebab.core.__GT_camelCase(cljs.core.name(k)),v], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v], null);
}
});
return clojure.walk.postwalk((function (x){
if(cljs.core.map_QMARK_(x)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(f,x));
} else {
if(cljs.core.uuid_QMARK_(x)){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(x);
} else {
return x;

}
}
}),input);
} else {
return null;
}
});
frontend.handler.plugin.invoke_exported_api = (function frontend$handler$plugin$invoke_exported_api(var_args){
var args__5732__auto__ = [];
var len__5726__auto___101237 = arguments.length;
var i__5727__auto___101238 = (0);
while(true){
if((i__5727__auto___101238 < len__5726__auto___101237)){
args__5732__auto__.push((arguments[i__5727__auto___101238]));

var G__101239 = (i__5727__auto___101238 + (1));
i__5727__auto___101238 = G__101239;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.handler.plugin.invoke_exported_api.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.handler.plugin.invoke_exported_api.cljs$core$IFn$_invoke$arity$variadic = (function (type,args){
try{return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(cljs.core.js_invoke,(window.logseq["api"]),cljs.core.name(type),args);
}catch (e100916){var e = e100916;
return console.error(e);
}}));

(frontend.handler.plugin.invoke_exported_api.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.handler.plugin.invoke_exported_api.cljs$lang$applyTo = (function (seq100914){
var G__100915 = cljs.core.first(seq100914);
var seq100914__$1 = cljs.core.next(seq100914);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__100915,seq100914__$1);
}));

frontend.handler.plugin.markdown_to_html = (function frontend$handler$plugin$markdown_to_html(s){
try{if(typeof s === 'string'){
return window.marked.parse(s);
} else {
return s;
}
}catch (e100919){if((e100919 instanceof Error)){
var e = e100919;
console.error(e);

return s;
} else {
throw e100919;

}
}});
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.plugin !== 'undefined') && (typeof frontend.handler.plugin.central_endpoint !== 'undefined')){
} else {
frontend.handler.plugin.central_endpoint = "https://raw.githubusercontent.com/logseq/marketplace/master/";
}
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.plugin !== 'undefined') && (typeof frontend.handler.plugin.plugins_url !== 'undefined')){
} else {
frontend.handler.plugin.plugins_url = [frontend.handler.plugin.central_endpoint,"plugins.json"].join('');
}
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.plugin !== 'undefined') && (typeof frontend.handler.plugin.stats_url !== 'undefined')){
} else {
frontend.handler.plugin.stats_url = [frontend.handler.plugin.central_endpoint,"stats.json"].join('');
}
frontend.handler.plugin.setup_global_apis_for_web_BANG_ = (function frontend$handler$plugin$setup_global_apis_for_web_BANG_(){
if(((frontend.util.web_platform_QMARK_) && ((window.apis == null)))){
var e = (new window.EventEmitter3());
return (window.apis = e);
} else {
return null;
}
});
frontend.handler.plugin.unlink_plugin_for_web_BANG_ = (function frontend$handler$plugin$unlink_plugin_for_web_BANG_(key){
frontend.handler.plugin.invoke_exported_api.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"unlink_installed_web_plugin","unlink_installed_web_plugin",-1190200576),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([key], 0));

return frontend.handler.plugin.invoke_exported_api.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"unlink_plugin_user_settings","unlink_plugin_user_settings",349152795),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([key], 0));
});
frontend.handler.plugin.assets_theme_to_file = (function frontend$handler$plugin$assets_theme_to_file(theme){
if(cljs.core.truth_(theme)){
var G__100930 = theme;
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__100930,new cljs.core.Keyword(null,"url","url",276297046),(function (p1__100926_SHARP_){
var G__100931 = p1__100926_SHARP_;
if((G__100931 == null)){
return null;
} else {
return clojure.string.replace_first(G__100931,"assets://","file://");
}
}));
} else {
return G__100930;
}
} else {
return null;
}
});
frontend.handler.plugin.load_plugin_preferences = (function frontend$handler$plugin$load_plugin_preferences(){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.plugin.invoke_exported_api(new cljs.core.Keyword(null,"load_user_preferences","load_user_preferences",1651561867)),(function (p1__100935_SHARP_){
return cljs_bean.core.__GT_clj(p1__100935_SHARP_);
})),(function (p1__100936_SHARP_){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","preferences","plugin/preferences",668527388),p1__100936_SHARP_);
})),(function (p1__100937_SHARP_){
return console.error(p1__100937_SHARP_);
}));
});
frontend.handler.plugin.save_plugin_preferences_BANG_ = (function frontend$handler$plugin$save_plugin_preferences_BANG_(var_args){
var G__100945 = arguments.length;
switch (G__100945) {
case 1:
return frontend.handler.plugin.save_plugin_preferences_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.plugin.save_plugin_preferences_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.plugin.save_plugin_preferences_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (input){
return frontend.handler.plugin.save_plugin_preferences_BANG_.cljs$core$IFn$_invoke$arity$2(input,true);
}));

(frontend.handler.plugin.save_plugin_preferences_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (input,reload_state_QMARK_){
var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core.map_QMARK_(input);
if(and__5000__auto__){
return cljs_bean.core.__GT_js(input);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var input__$1 = temp__5804__auto__;
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(LSPluginCore.saveUserPreferences(input__$1),(function (){
if(cljs.core.truth_(reload_state_QMARK_)){
return frontend.handler.plugin.load_plugin_preferences();
} else {
return null;
}
}));
} else {
return null;
}
}));

(frontend.handler.plugin.save_plugin_preferences_BANG_.cljs$lang$maxFixedArity = 2);

frontend.handler.plugin.gh_repo_url = (function frontend$handler$plugin$gh_repo_url(repo){
return ["https://github.com/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo)].join('');
});
frontend.handler.plugin.pkg_asset = (function frontend$handler$plugin$pkg_asset(id,asset){
if(cljs.core.truth_((function (){var and__5000__auto__ = asset;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.starts_with_QMARK_(asset,"http");
} else {
return and__5000__auto__;
}
})())){
return asset;
} else {
var temp__5804__auto__ = (function (){var and__5000__auto__ = asset;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.replace(asset,/^[.\/]+/,"");
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var asset__$1 = temp__5804__auto__;
return [frontend.handler.plugin.central_endpoint,"packages/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(asset__$1)].join('');
} else {
return null;
}
}
});
frontend.handler.plugin.load_marketplace_plugins = (function frontend$handler$plugin$load_marketplace_plugins(refresh_QMARK_){
if(cljs.core.truth_((function (){var or__5002__auto__ = refresh_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (new cljs.core.Keyword("plugin","marketplace-pkgs","plugin/marketplace-pkgs",637462798).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)) == null);
}
})())){
return promesa.core.create.cljs$core$IFn$_invoke$arity$1((function (resolve,reject){
var on_ok = (function (res){
var temp__5802__auto__ = (function (){var and__5000__auto__ = res;
if(cljs.core.truth_(and__5000__auto__)){
return cljs_bean.core.__GT_clj(res);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var res__$1 = temp__5802__auto__;
var pkgs = new cljs.core.Keyword(null,"packages","packages",1549741112).cljs$core$IFn$_invoke$arity$1(res__$1);
var pkgs__$1 = (cljs.core.truth_(frontend.util.electron_QMARK_())?pkgs:(function (){var G__100967 = pkgs;
if((G__100967 == null)){
return null;
} else {
return cljs.core.filterv((function (p1__100964_SHARP_){
return ((new cljs.core.Keyword(null,"web","web",-654701153).cljs$core$IFn$_invoke$arity$1(p1__100964_SHARP_) === true) || ((!(new cljs.core.Keyword(null,"effect","effect",347343289).cljs$core$IFn$_invoke$arity$1(p1__100964_SHARP_) === true))));
}),G__100967);
}
})());
frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","marketplace-pkgs","plugin/marketplace-pkgs",637462798),pkgs__$1);

return (resolve.cljs$core$IFn$_invoke$arity$1 ? resolve.cljs$core$IFn$_invoke$arity$1(pkgs__$1) : resolve.call(null,pkgs__$1));
} else {
return (reject.cljs$core$IFn$_invoke$arity$1 ? reject.cljs$core$IFn$_invoke$arity$1(null) : reject.call(null,null));
}
});
if(cljs.core.truth_(frontend.state.http_proxy_enabled_or_val_QMARK_())){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"httpFetchJSON","httpFetchJSON",787765788),frontend.handler.plugin.plugins_url], 0)),on_ok),reject);
} else {
return frontend.util.fetch.cljs$core$IFn$_invoke$arity$3(frontend.handler.plugin.plugins_url,on_ok,reject);
}
}));
} else {
return promesa.core.resolved(new cljs.core.Keyword("plugin","marketplace-pkgs","plugin/marketplace-pkgs",637462798).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
}
});
frontend.handler.plugin.load_marketplace_stats = (function frontend$handler$plugin$load_marketplace_stats(refresh_QMARK_){
if(cljs.core.truth_((function (){var or__5002__auto__ = refresh_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (new cljs.core.Keyword("plugin","marketplace-stats","plugin/marketplace-stats",1801405730).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)) == null);
}
})())){
return promesa.core.create.cljs$core$IFn$_invoke$arity$1((function (resolve,reject){
var on_ok = (function (res){
var temp__5802__auto__ = (function (){var and__5000__auto__ = res;
if(cljs.core.truth_(and__5000__auto__)){
return cljs_bean.core.__GT_clj(res);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var res__$1 = temp__5802__auto__;
frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","marketplace-stats","plugin/marketplace-stats",1801405730),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__100970){
var vec__100971 = p__100970;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100971,(0),null);
var stat = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100971,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(stat,new cljs.core.Keyword(null,"total_downloads","total_downloads",-1370933259),cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (a,b){
return (a + cljs.core.get.cljs$core$IFn$_invoke$arity$2(b,(2)));
}),(0),new cljs.core.Keyword(null,"releases","releases",460978484).cljs$core$IFn$_invoke$arity$1(stat)))], null);
}),res__$1)));

return (resolve.cljs$core$IFn$_invoke$arity$1 ? resolve.cljs$core$IFn$_invoke$arity$1(null) : resolve.call(null,null));
} else {
return (reject.cljs$core$IFn$_invoke$arity$1 ? reject.cljs$core$IFn$_invoke$arity$1(null) : reject.call(null,null));
}
});
if(cljs.core.truth_(frontend.state.http_proxy_enabled_or_val_QMARK_())){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"httpFetchJSON","httpFetchJSON",787765788),frontend.handler.plugin.stats_url], 0)),on_ok),reject);
} else {
return frontend.util.fetch.cljs$core$IFn$_invoke$arity$3(frontend.handler.plugin.stats_url,on_ok,reject);
}
}));
} else {
return promesa.core.resolved(null);
}
});
frontend.handler.plugin.check_or_update_marketplace_plugin_BANG_ = (function frontend$handler$plugin$check_or_update_marketplace_plugin_BANG_(p__100977,error_handler){
var map__100978 = p__100977;
var map__100978__$1 = cljs.core.__destructure_map(map__100978);
var pkg = map__100978__$1;
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__100978__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("plugin","installing","plugin/installing",-755703581).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
if(cljs.core.truth_(and__5000__auto__)){
return (!(frontend.handler.common.plugin.installed_QMARK_(id)));
} else {
return and__5000__auto__;
}
})())){
return null;
} else {
frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","installing","plugin/installing",-755703581),pkg);

return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.plugin.load_marketplace_plugins(false),(function (manifests){
var mft_101241 = cljs.core.some((function (p1__100976_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p1__100976_SHARP_),id)){
return p1__100976_SHARP_;
} else {
return null;
}
}),manifests);
var opts_101242 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(pkg,new cljs.core.Keyword(null,"logger","logger",-220675947)),mft_101241], 0));
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"updateMarketPlugin","updateMarketPlugin",-1044261342),opts_101242], 0));
} else {
frontend.handler.common.plugin.async_install_or_update_for_web_BANG_(opts_101242);
}

return true;
})),(function (e){
frontend.state.reset_all_updates_state();

(error_handler.cljs$core$IFn$_invoke$arity$1 ? error_handler.cljs$core$IFn$_invoke$arity$1(e) : error_handler.call(null,e));

frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","installing","plugin/installing",-755703581),null);

return console.error(e);
}));
}
});
frontend.handler.plugin.get_plugin_inst = (function frontend$handler$plugin$get_plugin_inst(pid){
try{return LSPluginCore.ensurePlugin(cljs.core.name(pid));
}catch (e100981){var _e = e100981;
return null;
}});
frontend.handler.plugin.call_plugin_user_model_BANG_ = (function frontend$handler$plugin$call_plugin_user_model_BANG_(pid,key,args){
var temp__5804__auto__ = frontend.handler.plugin.get_plugin_inst(pid);
if(cljs.core.truth_(temp__5804__auto__)){
var pl = temp__5804__auto__;
var caller = pl.caller;
return caller.callUserModelAsync.apply(caller,cljs_bean.core.__GT_js(cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$2(cljs.core.name(key),args)));
} else {
return null;
}
});
frontend.handler.plugin.call_plugin_user_command_BANG_ = (function frontend$handler$plugin$call_plugin_user_command_BANG_(pid,key,args){
var temp__5804__auto__ = (function (){var and__5000__auto__ = key;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("plugin","simple-commands","plugin/simple-commands",234820996).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid)));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var commands = temp__5804__auto__;
var temp__5804__auto____$1 = medley.core.find_first.cljs$core$IFn$_invoke$arity$2((function (p1__100984_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(cljs.core.second(p1__100984_SHARP_)),key);
}),commands);
if(cljs.core.truth_(temp__5804__auto____$1)){
var matched = temp__5804__auto____$1;
var vec__100998 = matched;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100998,(0),null);
var cmd = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100998,(1),null);
var action = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100998,(2),null);
var pid__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__100998,(3),null);
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"exec-plugin-cmd","exec-plugin-cmd",1049730302),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"type","type",1174270348),cljs.core.type,new cljs.core.Keyword(null,"key","key",-1516042587),key,new cljs.core.Keyword(null,"pid","pid",1018387698),pid__$1,new cljs.core.Keyword(null,"cmd","cmd",-302931143),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cmd,new cljs.core.Keyword(null,"args","args",1315556576),args),new cljs.core.Keyword(null,"action","action",-811238024),action], null)], null));
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.plugin.open_updates_downloading = (function frontend$handler$plugin$open_updates_downloading(){
if(((cljs.core.not(new cljs.core.Keyword("plugin","updates-downloading?","plugin/updates-downloading?",1294108608).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))) && (cljs.core.seq(frontend.state.all_available_coming_updates.cljs$core$IFn$_invoke$arity$0())))){
frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","updates-coming","plugin/updates-coming",104160263),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__101001_SHARP_){
if(cljs.core.truth_(frontend.state.coming_update_new_version_QMARK_(cljs.core.second(p1__101001_SHARP_)))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(p1__101001_SHARP_,(1),cljs.core.dissoc,new cljs.core.Keyword(null,"error-code","error-code",180497232));
} else {
return p1__101001_SHARP_;
}
}),new cljs.core.Keyword("plugin","updates-coming","plugin/updates-coming",104160263).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))));

return frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","updates-downloading?","plugin/updates-downloading?",1294108608),true);
} else {
return null;
}
});
frontend.handler.plugin.close_updates_downloading = (function frontend$handler$plugin$close_updates_downloading(){
if(cljs.core.truth_(new cljs.core.Keyword("plugin","updates-downloading?","plugin/updates-downloading?",1294108608).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","updates-downloading?","plugin/updates-downloading?",1294108608),false);
} else {
return null;
}
});
frontend.handler.plugin.has_setting_schema_QMARK_ = (function frontend$handler$plugin$has_setting_schema_QMARK_(id){
var temp__5804__auto__ = (function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.plugin.get_plugin_inst(cljs.core.name(id));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var pl = temp__5804__auto__;
return cljs.core.boolean$(pl.settingsSchema);
} else {
return null;
}
});
frontend.handler.plugin.get_enabled_plugins_if_setting_schema = (function frontend$handler$plugin$get_enabled_plugins_if_setting_schema(){
var temp__5804__auto__ = cljs.core.seq(frontend.state.get_enabled_QMARK__installed_plugins.cljs$core$IFn$_invoke$arity$4(false,true,true,true));
if(temp__5804__auto__){
var plugins = temp__5804__auto__;
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__101046_SHARP_){
return frontend.handler.plugin.has_setting_schema_QMARK_(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p1__101046_SHARP_));
}),plugins);
} else {
return null;
}
});
frontend.handler.plugin.setup_install_listener_BANG_ = (function frontend$handler$plugin$setup_install_listener_BANG_(){
var channel = cljs.core.name(new cljs.core.Keyword(null,"lsp-updates","lsp-updates",1924425351));
var listener = (function (ctx,evt){
var e_101253 = (function (){var or__5002__auto__ = evt;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ctx;
}
})();
var temp__5804__auto___101257 = cljs_bean.core.__GT_clj(e_101253);
if(cljs.core.truth_(temp__5804__auto___101257)){
var map__101047_101258 = temp__5804__auto___101257;
var map__101047_101259__$1 = cljs.core.__destructure_map(map__101047_101258);
var status_101260 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101047_101259__$1,new cljs.core.Keyword(null,"status","status",-1997798413));
var payload_101261 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101047_101259__$1,new cljs.core.Keyword(null,"payload","payload",-383036092));
var only_check_101262 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101047_101259__$1,new cljs.core.Keyword(null,"only-check","only-check",-1961506795));
var G__101048_101263 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(status_101260);
var G__101048_101264__$1 = (((G__101048_101263 instanceof cljs.core.Keyword))?G__101048_101263.fqn:null);
switch (G__101048_101264__$1) {
case "completed":
var map__101050_101266 = payload_101261;
var map__101050_101267__$1 = cljs.core.__destructure_map(map__101050_101266);
var id_101268 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101050_101267__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var dst_101269 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101050_101267__$1,new cljs.core.Keyword(null,"dst","dst",844682948));
var name_101270 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101050_101267__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var title_101271 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101050_101267__$1,new cljs.core.Keyword(null,"title","title",636505583));
var theme_101272 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101050_101267__$1,new cljs.core.Keyword(null,"theme","theme",-1247880880));
var web_pkg_101273 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101050_101267__$1,new cljs.core.Keyword(null,"web-pkg","web-pkg",304735692));
var name_101274__$1 = (function (){var or__5002__auto__ = title_101271;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = name_101270;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "Untitled";
}
}
})();
if(cljs.core.truth_(only_check_101262)){
frontend.state.consume_updates_from_coming_plugin_BANG_(payload_101261,false);
} else {
if(frontend.handler.common.plugin.installed_QMARK_(id_101268)){
var temp__5804__auto___101282__$1 = frontend.handler.plugin.get_plugin_inst(id_101268);
if(cljs.core.truth_(temp__5804__auto___101282__$1)){
var pl_101283 = temp__5804__auto___101282__$1;
promesa.core.then.cljs$core$IFn$_invoke$arity$2(pl_101283.reload(),(function (){
if(cljs.core.not(frontend.util.electron_QMARK_())){
(pl_101283.options.version = new cljs.core.Keyword(null,"version","version",425292698).cljs$core$IFn$_invoke$arity$1(web_pkg_101273));

(pl_101283.options.webPkg = cljs_bean.core.__GT_js(web_pkg_101273));

frontend.handler.plugin.invoke_exported_api.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"save_installed_web_plugin","save_installed_web_plugin",-1105585138),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pl_101283.toJSON(false)], 0));
} else {
}

frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","update-plugin","plugin/update-plugin",-675946380),name_101274__$1,pl_101283.options.version], 0)),new cljs.core.Keyword(null,"success","success",1890645906));

return frontend.state.consume_updates_from_coming_plugin_BANG_(payload_101261,true);
}));
} else {
}
} else {
promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(LSPluginCore.register(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),id_101268,new cljs.core.Keyword(null,"url","url",276297046),dst_101269,new cljs.core.Keyword(null,"webPkg","webPkg",-614725372),web_pkg_101273], null))),(function (){
var temp__5804__auto____$1 = frontend.handler.plugin.get_plugin_inst(id_101268);
if(cljs.core.truth_(temp__5804__auto____$1)){
var pl = temp__5804__auto____$1;
if(cljs.core.truth_(theme_101272)){
setTimeout((function (){
return (frontend.handler.plugin.select_a_plugin_theme.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.plugin.select_a_plugin_theme.cljs$core$IFn$_invoke$arity$1(id_101268) : frontend.handler.plugin.select_a_plugin_theme.call(null,id_101268));
}),(300));
} else {
}

if(cljs.core.truth_(pl.isWebPlugin)){
frontend.handler.plugin.invoke_exported_api.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"save_installed_web_plugin","save_installed_web_plugin",-1105585138),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pl.toJSON(false)], 0));
} else {
}

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","installed-plugin","plugin/installed-plugin",-2110374590),name_101274__$1], 0)),new cljs.core.Keyword(null,"success","success",1890645906));
} else {
return null;
}
})),(function (e__$1){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(["Install failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name_101274__$1),"\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e__$1.message)].join(''),new cljs.core.Keyword(null,"error","error",-978969032));
}));
}
}

break;
case "error":
var error_code_101297 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.replace(new cljs.core.Keyword(null,"error-code","error-code",180497232).cljs$core$IFn$_invoke$arity$1(payload_101261),/^[\s\:\[]+/,""));
var fake_error_QMARK__101298 = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"no-new-version","no-new-version",-944956961),null], null), null),error_code_101297);
var vec__101051_101299 = (function (){var G__101054 = error_code_101297;
var G__101054__$1 = (((G__101054 instanceof cljs.core.Keyword))?G__101054.fqn:null);
switch (G__101054__$1) {
case "no-new-version":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("plugin","up-to-date","plugin/up-to-date",-1634846608),":)"], 0)),new cljs.core.Keyword(null,"success","success",1890645906)], null);

break;
default:
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [error_code_101297,new cljs.core.Keyword(null,"error","error",-978969032)], null);

}
})();
var msg_101300 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101051_101299,(0),null);
var type_101301 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101051_101299,(1),null);
var pending_QMARK__101302 = cljs.core.seq(new cljs.core.Keyword("plugin","updates-pending","plugin/updates-pending",-1190878256).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
if(cljs.core.truth_((function (){var and__5000__auto__ = only_check_101262;
if(cljs.core.truth_(and__5000__auto__)){
return pending_QMARK__101302;
} else {
return and__5000__auto__;
}
})())){
frontend.state.consume_updates_from_coming_plugin_BANG_(payload_101261,false);
} else {
if(((cljs.core.not(only_check_101262)) && (cljs.core.not(pending_QMARK__101302)))){
frontend.state.consume_updates_from_coming_plugin_BANG_(payload_101261,true);
} else {
}

frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2([((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"error","error",-978969032),type_101301))?"[Error]":""),["<",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(payload_101261)),"> "].join(''),cljs.core.str.cljs$core$IFn$_invoke$arity$1(msg_101300)].join(''),type_101301);
}

if(fake_error_QMARK__101298){
} else {
console.error("Update Error:",new cljs.core.Keyword(null,"error-code","error-code",180497232).cljs$core$IFn$_invoke$arity$1(payload_101261));
}

break;
default:

}
} else {
}

setTimeout((function (){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","installing","plugin/installing",-755703581),null);
}),(512));

return true;
});
window.apis.addListener(channel,listener);

return (function (){
return window.apis.removeListener(channel,listener);
});
});
frontend.handler.plugin.normalize_plugin_metadata = (function frontend$handler$plugin$normalize_plugin_metadata(metadata){
var G__101055 = metadata;
if((!(typeof new cljs.core.Keyword(null,"author","author",2111686192).cljs$core$IFn$_invoke$arity$1(metadata) === 'string'))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__101055,new cljs.core.Keyword(null,"author","author",2111686192),(function (){var or__5002__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(metadata,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"author","author",2111686192),new cljs.core.Keyword(null,"name","name",1843675177)], null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})());
} else {
return G__101055;
}
});
frontend.handler.plugin.register_plugin = (function frontend$handler$plugin$register_plugin(plugin_metadata){
var temp__5804__auto__ = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(plugin_metadata));
if(cljs.core.truth_(temp__5804__auto__)){
var pid = temp__5804__auto__;
var G__101056 = plugin_metadata;
var G__101056__$1 = (((G__101056 == null))?null:frontend.handler.plugin.normalize_plugin_metadata(G__101056));
if((G__101056__$1 == null)){
return null;
} else {
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.state.state,cljs.core.update_in,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-plugins","plugin/installed-plugins",-1068618034)], null),cljs.core.assoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pid,G__101056__$1], 0));
}
} else {
return null;
}
});
frontend.handler.plugin.host_mounted_BANG_ = (function frontend$handler$plugin$host_mounted_BANG_(){
var and__5000__auto__ = frontend.config.lsp_enabled_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return LSPluginCore.hostMounted();
} else {
return and__5000__auto__;
}
});
frontend.handler.plugin.register_plugin_slash_command = (function frontend$handler$plugin$register_plugin_slash_command(pid,p__101058){
var vec__101059 = p__101058;
var cmd = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101059,(0),null);
var actions = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101059,(1),null);
var temp__5804__auto__ = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid);
if(cljs.core.truth_(temp__5804__auto__)){
var pid__$1 = temp__5804__auto__;
if(cljs.core.contains_QMARK_(new cljs.core.Keyword("plugin","installed-plugins","plugin/installed-plugins",-1068618034).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),pid__$1)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.state.state,cljs.core.update_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-slash-commands","plugin/installed-slash-commands",-58447235),pid__$1], null),cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.merge,cljs.core.PersistentArrayMap.EMPTY),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentHashMap.fromArrays([cmd],[cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__101057_SHARP_){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(p1__101057_SHARP_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pid","pid",1018387698),pid__$1], null));
}),actions)])], 0));

frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"rebuild-slash-commands-list","rebuild-slash-commands-list",-639662306)], null));

return true;
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.plugin.unregister_plugin_slash_command = (function frontend$handler$plugin$unregister_plugin_slash_command(pid){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.state,medley.core.dissoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-slash-commands","plugin/installed-slash-commands",-58447235),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid)], null));

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"rebuild-slash-commands-list","rebuild-slash-commands-list",-639662306)], null));
});
frontend.handler.plugin.keybinding_mode_handler_map = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"global","global",93595047),new cljs.core.Keyword("shortcut.handler","editor-global","shortcut.handler/editor-global",-799336480),new cljs.core.Keyword(null,"non-editing","non-editing",-24940958),new cljs.core.Keyword("shortcut.handler","global-non-editing-only","shortcut.handler/global-non-editing-only",-2118756985),new cljs.core.Keyword(null,"editing","editing",1365491601),new cljs.core.Keyword("shortcut.handler","block-editing-only","shortcut.handler/block-editing-only",794342449)], null);
frontend.handler.plugin.simple_cmd__GT_palette_cmd = (function frontend$handler$plugin$simple_cmd__GT_palette_cmd(pid,p__101063,action){
var map__101064 = p__101063;
var map__101064__$1 = cljs.core.__destructure_map(map__101064);
var cmd = map__101064__$1;
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101064__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101064__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101064__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var desc = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101064__$1,new cljs.core.Keyword(null,"desc","desc",2093485764));
var keybinding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101064__$1,new cljs.core.Keyword(null,"keybinding","keybinding",1090151579));
var palette_cmd = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(["plugin.",cljs.core.str.cljs$core$IFn$_invoke$arity$1(pid),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(key)].join('')),new cljs.core.Keyword(null,"desc","desc",2093485764),(function (){var or__5002__auto__ = desc;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return label;
}
})(),new cljs.core.Keyword(null,"shortcut","shortcut",-431647697),(function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"binding","binding",539932593).cljs$core$IFn$_invoke$arity$1(keybinding);
if(cljs.core.truth_(temp__5804__auto__)){
var shortcut = temp__5804__auto__;
if(cljs.core.truth_(frontend.util.mac_QMARK_)){
var or__5002__auto__ = new cljs.core.Keyword(null,"mac","mac",-1879391650).cljs$core$IFn$_invoke$arity$1(keybinding);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return shortcut;
}
} else {
return shortcut;
}
} else {
return null;
}
})(),new cljs.core.Keyword(null,"handler-id","handler-id",1160395333),(function (){var mode = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"mode","mode",654403691).cljs$core$IFn$_invoke$arity$1(keybinding);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"global","global",93595047);
}
})();
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.handler.plugin.keybinding_mode_handler_map,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(mode));
})(),new cljs.core.Keyword(null,"action","action",-811238024),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"exec-plugin-cmd","exec-plugin-cmd",1049730302),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"type","type",1174270348),type,new cljs.core.Keyword(null,"key","key",-1516042587),key,new cljs.core.Keyword(null,"pid","pid",1018387698),pid,new cljs.core.Keyword(null,"cmd","cmd",-302931143),cmd,new cljs.core.Keyword(null,"action","action",-811238024),action], null)], null));
})], null);
return palette_cmd;
});
frontend.handler.plugin.simple_cmd_keybinding__GT_shortcut_args = (function frontend$handler$plugin$simple_cmd_keybinding__GT_shortcut_args(pid,key,keybinding){
var id = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(["plugin.",cljs.core.str.cljs$core$IFn$_invoke$arity$1(pid),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(key)].join(''));
var binding = new cljs.core.Keyword(null,"binding","binding",539932593).cljs$core$IFn$_invoke$arity$1(keybinding);
var binding__$1 = (function (){var G__101065 = ((typeof binding === 'string')?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [binding], null):cljs.core.vec(binding));
var G__101065__$1 = (((G__101065 == null))?null:cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,G__101065));
if((G__101065__$1 == null)){
return null;
} else {
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(frontend.modules.shortcut.utils.undecorate_binding,G__101065__$1);
}
})();
var binding__$2 = (cljs.core.truth_(frontend.util.mac_QMARK_)?(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"mac","mac",-1879391650).cljs$core$IFn$_invoke$arity$1(keybinding);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return binding__$1;
}
})():binding__$1);
var mode = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"mode","mode",654403691).cljs$core$IFn$_invoke$arity$1(keybinding);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"global","global",93595047);
}
})();
var mode__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.handler.plugin.keybinding_mode_handler_map,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(mode));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [mode__$1,id,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"binding","binding",539932593),binding__$2], null)], null);
});
frontend.handler.plugin.register_plugin_simple_command = (function frontend$handler$plugin$register_plugin_simple_command(pid,p__101066,action){
var map__101067 = p__101066;
var map__101067__$1 = cljs.core.__destructure_map(map__101067);
var cmd = map__101067__$1;
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101067__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var temp__5804__auto__ = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid);
if(cljs.core.truth_(temp__5804__auto__)){
var pid__$1 = temp__5804__auto__;
if(cljs.core.contains_QMARK_(new cljs.core.Keyword("plugin","installed-plugins","plugin/installed-plugins",-1068618034).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),pid__$1)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.state.state,cljs.core.update_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","simple-commands","plugin/simple-commands",234820996),pid__$1], null),cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.conj,cljs.core.PersistentVector.EMPTY),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [type,cmd,action,pid__$1], null)], 0));

return true;
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.plugin.unregister_plugin_simple_command = (function frontend$handler$plugin$unregister_plugin_simple_command(pid){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.state,medley.core.dissoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","simple-commands","plugin/simple-commands",234820996),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid)], null));
});
frontend.handler.plugin.register_plugin_ui_item = (function frontend$handler$plugin$register_plugin_ui_item(pid,p__101070){
var map__101071 = p__101070;
var map__101071__$1 = cljs.core.__destructure_map(map__101071);
var opts = map__101071__$1;
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101071__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101071__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var temp__5804__auto__ = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid);
if(cljs.core.truth_(temp__5804__auto__)){
var pid__$1 = temp__5804__auto__;
if(cljs.core.contains_QMARK_(new cljs.core.Keyword("plugin","installed-plugins","plugin/installed-plugins",-1068618034).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),pid__$1)){
var items_101314 = (function (){var or__5002__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-ui-items","plugin/installed-ui-items",1418448868),pid__$1], null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentVector.EMPTY;
}
})();
var items_101315__$1 = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__101069_SHARP_){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(key,new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(cljs.core.second(p1__101069_SHARP_)));
}),items_101314);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-ui-items","plugin/installed-ui-items",1418448868),pid__$1], null),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(items_101315__$1,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [type,opts,pid__$1], null)));

return true;
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.plugin.unregister_plugin_ui_items = (function frontend$handler$plugin$unregister_plugin_ui_items(pid){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-ui-items","plugin/installed-ui-items",1418448868),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid)], null),cljs.core.PersistentVector.EMPTY);
});
frontend.handler.plugin.register_plugin_resources = (function frontend$handler$plugin$register_plugin_resources(pid,type,p__101074){
var map__101075 = p__101074;
var map__101075__$1 = cljs.core.__destructure_map(map__101075);
var opts = map__101075__$1;
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101075__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var temp__5804__auto__ = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid);
if(cljs.core.truth_(temp__5804__auto__)){
var pid__$1 = temp__5804__auto__;
var temp__5804__auto____$1 = (function (){var and__5000__auto__ = key;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(type);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var type__$1 = temp__5804__auto____$1;
var path = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-resources","plugin/installed-resources",-1742961043),pid__$1,type__$1], null);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.state.state,cljs.core.update_in,path,cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc,cljs.core.PersistentArrayMap.EMPTY),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([key,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pid","pid",1018387698),pid__$1], null)], 0))], 0));

return true;
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.plugin.unregister_plugin_resources = (function frontend$handler$plugin$unregister_plugin_resources(pid){
var temp__5804__auto__ = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid);
if(cljs.core.truth_(temp__5804__auto__)){
var pid__$1 = temp__5804__auto__;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.state,medley.core.dissoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-resources","plugin/installed-resources",-1742961043),pid__$1], null));

return true;
} else {
return null;
}
});
frontend.handler.plugin.register_plugin_search_service = (function frontend$handler$plugin$register_plugin_search_service(pid,name,opts){
var temp__5804__auto__ = (function (){var and__5000__auto__ = name;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var pid__$1 = temp__5804__auto__;
return frontend.state.install_plugin_service.cljs$core$IFn$_invoke$arity$4(pid__$1,new cljs.core.Keyword(null,"search","search",1564939822),name,opts);
} else {
return null;
}
});
frontend.handler.plugin.unregister_plugin_search_services = (function frontend$handler$plugin$unregister_plugin_search_services(pid){
var temp__5804__auto__ = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid);
if(cljs.core.truth_(temp__5804__auto__)){
var pid__$1 = temp__5804__auto__;
return frontend.state.uninstall_plugin_service(pid__$1,new cljs.core.Keyword(null,"search","search",1564939822));
} else {
return null;
}
});
frontend.handler.plugin.unregister_plugin_themes = (function frontend$handler$plugin$unregister_plugin_themes(var_args){
var G__101079 = arguments.length;
switch (G__101079) {
case 1:
return frontend.handler.plugin.unregister_plugin_themes.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.plugin.unregister_plugin_themes.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.plugin.unregister_plugin_themes.cljs$core$IFn$_invoke$arity$1 = (function (pid){
return frontend.handler.plugin.unregister_plugin_themes.cljs$core$IFn$_invoke$arity$2(pid,true);
}));

(frontend.handler.plugin.unregister_plugin_themes.cljs$core$IFn$_invoke$arity$2 = (function (pid,effect){
return LSPluginCore.unregisterTheme(cljs.core.name(pid),effect);
}));

(frontend.handler.plugin.unregister_plugin_themes.cljs$lang$maxFixedArity = 2);

frontend.handler.plugin.get_installed_hooks = (function frontend$handler$plugin$get_installed_hooks(){
return new cljs.core.Keyword("plugin","installed-hooks","plugin/installed-hooks",-227057271).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.handler.plugin.plugin_hook_installed_QMARK_ = (function frontend$handler$plugin$plugin_hook_installed_QMARK_(pid,hook){
var temp__5804__auto__ = (function (){var and__5000__auto__ = pid;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.plugin.get_installed_hooks();
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var hooks = temp__5804__auto__;
return cljs.core.contains_QMARK_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(hooks,hook),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid));
} else {
return null;
}
});
frontend.handler.plugin.db_block_hook_installed_QMARK_ = (function frontend$handler$plugin$db_block_hook_installed_QMARK_(uuid){
var temp__5804__auto__ = (function (){var and__5000__auto__ = uuid;
if(cljs.core.truth_(and__5000__auto__)){
return ["hook:db:block_",clojure.string.replace(cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid),"-","_")].join('');
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var hook = temp__5804__auto__;
return cljs.core.boolean$(cljs.core.seq(cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.handler.plugin.get_installed_hooks(),hook)));
} else {
return null;
}
});
frontend.handler.plugin.create_local_renderer_register = (function frontend$handler$plugin$create_local_renderer_register(type,_STAR_providers){
return (function (pid,key,p__101083){
var map__101084 = p__101083;
var map__101084__$1 = cljs.core.__destructure_map(map__101084);
var opts = map__101084__$1;
var subs_SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101084__$1,new cljs.core.Keyword(null,"subs","subs",-186681991));
var render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101084__$1,new cljs.core.Keyword(null,"render","render",-1408033454));
var temp__5804__auto__ = (function (){var and__5000__auto__ = key;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(key);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var key__$1 = temp__5804__auto__;
frontend.handler.plugin.register_plugin_resources(pid,type,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),key__$1,new cljs.core.Keyword(null,"subs","subs",-186681991),subs_SINGLEQUOTE_,new cljs.core.Keyword(null,"render","render",-1408033454),render], null)], 0)));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_providers,cljs.core.conj,pid);

return (function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_providers,cljs.core.disj,pid);
});
} else {
return null;
}
});
});
frontend.handler.plugin.create_local_renderer_getter = (function frontend$handler$plugin$create_local_renderer_getter(var_args){
var G__101087 = arguments.length;
switch (G__101087) {
case 2:
return frontend.handler.plugin.create_local_renderer_getter.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.handler.plugin.create_local_renderer_getter.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.plugin.create_local_renderer_getter.cljs$core$IFn$_invoke$arity$2 = (function (type,_STAR_providers){
return frontend.handler.plugin.create_local_renderer_getter.cljs$core$IFn$_invoke$arity$3(type,_STAR_providers,false);
}));

(frontend.handler.plugin.create_local_renderer_getter.cljs$core$IFn$_invoke$arity$3 = (function (type,_STAR_providers,many_QMARK_){
return (function (key){
var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core.seq(cljs.core.deref(_STAR_providers));
if(and__5000__auto__){
var and__5000__auto____$1 = key;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(key);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var key__$1 = temp__5804__auto__;
var temp__5804__auto____$1 = cljs.core.seq(cljs.core.flatten(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (pid){
return frontend.state.get_plugin_resource(pid,type,key__$1);
}),cljs.core.deref(_STAR_providers)))));
if(temp__5804__auto____$1){
var rs = temp__5804__auto____$1;
if(cljs.core.truth_(many_QMARK_)){
return rs;
} else {
return cljs.core.first(rs);
}
} else {
return null;
}
} else {
return null;
}
});
}));

(frontend.handler.plugin.create_local_renderer_getter.cljs$lang$maxFixedArity = 3);

if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.plugin !== 'undefined') && (typeof frontend.handler.plugin._STAR_fenced_code_providers !== 'undefined')){
} else {
frontend.handler.plugin._STAR_fenced_code_providers = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
}
frontend.handler.plugin.register_fenced_code_renderer = frontend.handler.plugin.create_local_renderer_register(new cljs.core.Keyword(null,"fenced-code-renderers","fenced-code-renderers",2028100130),frontend.handler.plugin._STAR_fenced_code_providers);
frontend.handler.plugin.hook_fenced_code_by_lang = frontend.handler.plugin.create_local_renderer_getter.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"fenced-code-renderers","fenced-code-renderers",2028100130),frontend.handler.plugin._STAR_fenced_code_providers);
frontend.handler.plugin._STAR_extensions_enhancer_providers = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
frontend.handler.plugin.register_extensions_enhancer = frontend.handler.plugin.create_local_renderer_register(new cljs.core.Keyword(null,"extensions-enhancers","extensions-enhancers",-1229704403),frontend.handler.plugin._STAR_extensions_enhancer_providers);
frontend.handler.plugin.hook_extensions_enhancers_by_key = frontend.handler.plugin.create_local_renderer_getter.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"extensions-enhancers","extensions-enhancers",-1229704403),frontend.handler.plugin._STAR_extensions_enhancer_providers,true);
frontend.handler.plugin._STAR_route_renderer_providers = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
frontend.handler.plugin.register_route_renderer = frontend.handler.plugin.create_local_renderer_register(new cljs.core.Keyword(null,"route-renderers","route-renderers",254600293),frontend.handler.plugin._STAR_route_renderer_providers);
frontend.handler.plugin.get_route_renderers = frontend.handler.plugin.create_local_renderer_getter.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"route-renderers","route-renderers",254600293),frontend.handler.plugin._STAR_route_renderer_providers,true);
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.plugin !== 'undefined') && (typeof frontend.handler.plugin._STAR_daemon_renderer_providers !== 'undefined')){
} else {
frontend.handler.plugin._STAR_daemon_renderer_providers = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
}
frontend.handler.plugin.register_daemon_renderer = frontend.handler.plugin.create_local_renderer_register(new cljs.core.Keyword(null,"daemon-renderers","daemon-renderers",-245158167),frontend.handler.plugin._STAR_daemon_renderer_providers);
frontend.handler.plugin.get_daemon_renderers = frontend.handler.plugin.create_local_renderer_getter.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"daemon-renderers","daemon-renderers",-245158167),frontend.handler.plugin._STAR_daemon_renderer_providers,true);
frontend.handler.plugin.select_a_plugin_theme = (function frontend$handler$plugin$select_a_plugin_theme(pid){
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.group_by(new cljs.core.Keyword(null,"pid","pid",1018387698),new cljs.core.Keyword("plugin","installed-themes","plugin/installed-themes",1969555197).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))),pid);
if(cljs.core.truth_(temp__5804__auto__)){
var themes = temp__5804__auto__;
var temp__5804__auto____$1 = frontend.handler.plugin.assets_theme_to_file(cljs.core.first(themes));
if(cljs.core.truth_(temp__5804__auto____$1)){
var theme = temp__5804__auto____$1;
return LSPluginCore.selectTheme(cljs_bean.core.__GT_js(theme));
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.plugin.update_plugin_settings_state = (function frontend$handler$plugin$update_plugin_settings_state(id,settings){
return frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-plugins","plugin/installed-plugins",-1068618034),id,new cljs.core.Keyword(null,"settings","settings",1556144875)], null),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(settings,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.boolean$(new cljs.core.Keyword(null,"disabled","disabled",-1529784218).cljs$core$IFn$_invoke$arity$1(settings))));
});
frontend.handler.plugin.open_settings_file_in_default_app_BANG_ = (function frontend$handler$plugin$open_settings_file_in_default_app_BANG_(id_or_plugin){
var temp__5804__auto__ = ((cljs.core.coll_QMARK_(id_or_plugin))?id_or_plugin:frontend.state.get_plugin_by_id(id_or_plugin));
if(cljs.core.truth_(temp__5804__auto__)){
var plugin = temp__5804__auto__;
var temp__5804__auto____$1 = new cljs.core.Keyword(null,"usf","usf",-1824885303).cljs$core$IFn$_invoke$arity$1(plugin);
if(cljs.core.truth_(temp__5804__auto____$1)){
var file_path = temp__5804__auto____$1;
return apis.openPath(file_path);
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.plugin.open_plugin_settings_BANG_ = (function frontend$handler$plugin$open_plugin_settings_BANG_(var_args){
var G__101091 = arguments.length;
switch (G__101091) {
case 1:
return frontend.handler.plugin.open_plugin_settings_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.plugin.open_plugin_settings_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.plugin.open_plugin_settings_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (id){
return frontend.handler.plugin.open_plugin_settings_BANG_.cljs$core$IFn$_invoke$arity$2(id,false);
}));

(frontend.handler.plugin.open_plugin_settings_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (id,nav_QMARK_){
var temp__5804__auto__ = (function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.state.get_plugin_by_id(id);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var plugin = temp__5804__auto__;
if(cljs.core.truth_(frontend.handler.plugin.has_setting_schema_QMARK_(id))){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("go","plugins-settings","go/plugins-settings",-583021288),id,nav_QMARK_,(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(plugin);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(plugin);
}
})()], null));
} else {
return frontend.handler.plugin.open_settings_file_in_default_app_BANG_(plugin);
}
} else {
return null;
}
}));

(frontend.handler.plugin.open_plugin_settings_BANG_.cljs$lang$maxFixedArity = 2);

frontend.handler.plugin.open_report_modal_BANG_ = (function frontend$handler$plugin$open_report_modal_BANG_(var_args){
var G__101093 = arguments.length;
switch (G__101093) {
case 0:
return frontend.handler.plugin.open_report_modal_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 2:
return frontend.handler.plugin.open_report_modal_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.plugin.open_report_modal_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.handler.plugin.open_report_modal_BANG_.cljs$core$IFn$_invoke$arity$2(null,null);
}));

(frontend.handler.plugin.open_report_modal_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (pid,name){
var G__101094 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-1","div.p-1",-1297123687),(cljs.core.truth_(pid)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1.opacity-90.font-bold.pb-1.flex.item-center.gap-1","h1.opacity-90.font-bold.pb-1.flex.item-center.gap-1",-1185476214),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-red-rx-10.flex.items-center","span.text-red-rx-10.flex.items-center",1894461045),logseq.shui.ui.tabler_icon("alert-triangle-filled",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(20)], null))], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),name,"  ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"code","code",1586293142),"#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(pid)], null)], null)], null):null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"If any plugin is unavailable or you think it contains malicious code,\n        please email ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.hover:underline","a.hover:underline",-1510791830),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"href","href",-793805698),["mailto://support@logseq.com?subject=Report plugin from Logseq Marketplace",(cljs.core.truth_(pid)?[" (#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(pid),")"].join(''):null)].join('')], null),"support@logseq.com"], null)," . Mention the name of the plugin and the URL of its GitHub repository.\n       The Logseq team usually responds within a business day."], null)], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__101094) : logseq.shui.ui.dialog_open_BANG_.call(null,G__101094));
}));

(frontend.handler.plugin.open_report_modal_BANG_.cljs$lang$maxFixedArity = 2);

frontend.handler.plugin.parse_user_md_content = (function frontend$handler$plugin$parse_user_md_content(content,p__101095){
var map__101096 = p__101095;
var map__101096__$1 = cljs.core.__destructure_map(map__101096);
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101096__$1,new cljs.core.Keyword(null,"url","url",276297046));
try{if(clojure.string.blank_QMARK_(content)){
return null;
} else {
var content__$1 = (((!(clojure.string.blank_QMARK_(url))))?clojure.string.replace(content,/!\[[^\]]*\]\((.*?)\s*(\"(?:.*[^\"])\")?\s*\)/,(function (p__101098){
var vec__101099 = p__101098;
var matched = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101099,(0),null);
var link = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101099,(1),null);
if(cljs.core.truth_((function (){var and__5000__auto__ = link;
if(cljs.core.truth_(and__5000__auto__)){
return (!(clojure.string.starts_with_QMARK_(link,"http")));
} else {
return and__5000__auto__;
}
})())){
return clojure.string.replace(matched,link,(frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(url,link) : frontend.util.node_path.join.call(null,url,link)));
} else {
return matched;
}
})):content);
return frontend.format.to_html(content__$1,new cljs.core.Keyword(null,"markdown","markdown",1227225089),logseq.graph_parser.mldoc.default_config.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"markdown","markdown",1227225089)));
}
}catch (e101097){var e = e101097;
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.plugin",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"parse-user-md-exception","parse-user-md-exception",168116088),e,new cljs.core.Keyword(null,"line","line",212345235),549], null)),null);

return content;
}});
frontend.handler.plugin.open_readme_BANG_ = (function frontend$handler$plugin$open_readme_BANG_(url,item,display){
var repo = new cljs.core.Keyword(null,"repo","repo",-1999060679).cljs$core$IFn$_invoke$arity$1(item);
if((repo == null)){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.plugin.invoke_exported_api.cljs$core$IFn$_invoke$arity$variadic("load_plugin_readme",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([url], 0))),(function (content){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.plugin.parse_user_md_content(content,item)),(function (content__$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = clojure.string.blank_QMARK_(clojure.string.trim(content__$1));
if(and__5000__auto__){
throw (new Error("blank readme content"));
} else {
return and__5000__auto__;
}
})()),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","active-readme","plugin/active-readme",-677043988),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [content__$1,item], null))),(function (___41611__auto____$1){
return promesa.protocols._promise((function (){var G__101104 = (function (_){
return (display.cljs$core$IFn$_invoke$arity$0 ? display.cljs$core$IFn$_invoke$arity$0() : display.call(null));
});
var G__101105 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),"plugin-readme",new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"max-h-[86vh] overflow-auto"], null)], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__101104,G__101105) : logseq.shui.ui.dialog_open_BANG_.call(null,G__101104,G__101105));
})());
}));
}));
}));
}));
})),(function (p1__101103_SHARP_){
console.warn(p1__101103_SHARP_);

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("No README content.",new cljs.core.Keyword(null,"warning","warning",-1685650671));
}));
} else {
var G__101106 = (function (_){
return (display.cljs$core$IFn$_invoke$arity$2 ? display.cljs$core$IFn$_invoke$arity$2(item,null) : display.call(null,item,null));
});
var G__101107 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"label","label",1718410804),"plugin-readme"], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__101106,G__101107) : logseq.shui.ui.dialog_open_BANG_.call(null,G__101106,G__101107));
}
});
frontend.handler.plugin.load_unpacked_plugin = (function frontend$handler$plugin$load_unpacked_plugin(){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["openDialog"], 0))),(function (path){
return promesa.protocols._promise((cljs.core.truth_(new cljs.core.Keyword("plugin","selected-unpacked-pkg","plugin/selected-unpacked-pkg",-286319185).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))?null:frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","selected-unpacked-pkg","plugin/selected-unpacked-pkg",-286319185),path)));
}));
}));
} else {
return null;
}
});
frontend.handler.plugin.reset_unpacked_state = (function frontend$handler$plugin$reset_unpacked_state(){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","selected-unpacked-pkg","plugin/selected-unpacked-pkg",-286319185),null);
});
frontend.handler.plugin.hook_plugin = (function frontend$handler$plugin$hook_plugin(tag,type,payload,plugin_id){
if(cljs.core.truth_(frontend.config.lsp_enabled_QMARK_)){
try{return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(LSPluginCore,["hook",clojure.string.capitalize(cljs.core.name(tag))].join(''),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.name(type),((cljs.core.coll_QMARK_(payload))?cljs_bean.core.__GT_js(frontend.handler.plugin.normalize_keyword_for_json(payload)):payload),(((plugin_id instanceof cljs.core.Keyword))?cljs.core.name(plugin_id):plugin_id)], 0));
}catch (e101109){var e = e101109;
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.plugin",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"invoke-hook-exception","invoke-hook-exception",519764098),e,new cljs.core.Keyword(null,"line","line",212345235),592], null)),null);
}} else {
return null;
}
});
frontend.handler.plugin.hook_plugin_app = (function frontend$handler$plugin$hook_plugin_app(var_args){
var G__101114 = arguments.length;
switch (G__101114) {
case 2:
return frontend.handler.plugin.hook_plugin_app.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.handler.plugin.hook_plugin_app.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.plugin.hook_plugin_app.cljs$core$IFn$_invoke$arity$2 = (function (type,payload){
return frontend.handler.plugin.hook_plugin_app.cljs$core$IFn$_invoke$arity$3(type,payload,null);
}));

(frontend.handler.plugin.hook_plugin_app.cljs$core$IFn$_invoke$arity$3 = (function (type,payload,plugin_id){
return frontend.handler.plugin.hook_plugin(new cljs.core.Keyword(null,"app","app",-560961707),type,payload,plugin_id);
}));

(frontend.handler.plugin.hook_plugin_app.cljs$lang$maxFixedArity = 3);

frontend.handler.plugin.hook_plugin_editor = (function frontend$handler$plugin$hook_plugin_editor(var_args){
var G__101117 = arguments.length;
switch (G__101117) {
case 2:
return frontend.handler.plugin.hook_plugin_editor.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.handler.plugin.hook_plugin_editor.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.plugin.hook_plugin_editor.cljs$core$IFn$_invoke$arity$2 = (function (type,payload){
return frontend.handler.plugin.hook_plugin_editor.cljs$core$IFn$_invoke$arity$3(type,payload,null);
}));

(frontend.handler.plugin.hook_plugin_editor.cljs$core$IFn$_invoke$arity$3 = (function (type,payload,plugin_id){
return frontend.handler.plugin.hook_plugin(new cljs.core.Keyword(null,"editor","editor",-989377770),type,payload,plugin_id);
}));

(frontend.handler.plugin.hook_plugin_editor.cljs$lang$maxFixedArity = 3);

frontend.handler.plugin.hook_plugin_db = (function frontend$handler$plugin$hook_plugin_db(var_args){
var G__101120 = arguments.length;
switch (G__101120) {
case 2:
return frontend.handler.plugin.hook_plugin_db.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.handler.plugin.hook_plugin_db.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.plugin.hook_plugin_db.cljs$core$IFn$_invoke$arity$2 = (function (type,payload){
return frontend.handler.plugin.hook_plugin_db.cljs$core$IFn$_invoke$arity$3(type,payload,null);
}));

(frontend.handler.plugin.hook_plugin_db.cljs$core$IFn$_invoke$arity$3 = (function (type,payload,plugin_id){
return frontend.handler.plugin.hook_plugin(new cljs.core.Keyword(null,"db","db",993250759),type,payload,plugin_id);
}));

(frontend.handler.plugin.hook_plugin_db.cljs$lang$maxFixedArity = 3);

frontend.handler.plugin.hook_plugin_block_changes = (function frontend$handler$plugin$hook_plugin_block_changes(p__101122){
var map__101123 = p__101122;
var map__101123__$1 = cljs.core.__destructure_map(map__101123);
var blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101123__$1,new cljs.core.Keyword(null,"blocks","blocks",-610462153));
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101123__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101123__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
var tx_data_SINGLEQUOTE_ = cljs.core.group_by(cljs.core.first,tx_data);
var blocks_SINGLEQUOTE_ = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__101121_SHARP_){
var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__101121_SHARP_);
if(cljs.core.truth_(temp__5804__auto__)){
var uuid = temp__5804__auto__;
return frontend.handler.plugin.db_block_hook_installed_QMARK_(uuid);
} else {
return null;
}
}),blocks);
var seq__101124 = cljs.core.seq(blocks_SINGLEQUOTE_);
var chunk__101125 = null;
var count__101126 = (0);
var i__101127 = (0);
while(true){
if((i__101127 < count__101126)){
var b = chunk__101125.cljs$core$IIndexed$_nth$arity$2(null,i__101127);
var type_101353 = ["block:",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b))].join('');
frontend.handler.plugin.hook_plugin_db.cljs$core$IFn$_invoke$arity$2(type_101353,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"block","block",664686210),b,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),cljs.core.get.cljs$core$IFn$_invoke$arity$2(tx_data_SINGLEQUOTE_,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b)),new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),tx_meta], null));


var G__101362 = seq__101124;
var G__101363 = chunk__101125;
var G__101364 = count__101126;
var G__101365 = (i__101127 + (1));
seq__101124 = G__101362;
chunk__101125 = G__101363;
count__101126 = G__101364;
i__101127 = G__101365;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__101124);
if(temp__5804__auto__){
var seq__101124__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__101124__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__101124__$1);
var G__101368 = cljs.core.chunk_rest(seq__101124__$1);
var G__101369 = c__5525__auto__;
var G__101370 = cljs.core.count(c__5525__auto__);
var G__101371 = (0);
seq__101124 = G__101368;
chunk__101125 = G__101369;
count__101126 = G__101370;
i__101127 = G__101371;
continue;
} else {
var b = cljs.core.first(seq__101124__$1);
var type_101372 = ["block:",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b))].join('');
frontend.handler.plugin.hook_plugin_db.cljs$core$IFn$_invoke$arity$2(type_101372,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"block","block",664686210),b,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),cljs.core.get.cljs$core$IFn$_invoke$arity$2(tx_data_SINGLEQUOTE_,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b)),new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),tx_meta], null));


var G__101373 = cljs.core.next(seq__101124__$1);
var G__101374 = null;
var G__101375 = (0);
var G__101376 = (0);
seq__101124 = G__101373;
chunk__101125 = G__101374;
count__101126 = G__101375;
i__101127 = G__101376;
continue;
}
} else {
return null;
}
}
break;
}
});
frontend.handler.plugin.hook_plugin_block_slot = (function frontend$handler$plugin$hook_plugin_block_slot(block,payload){
var temp__5804__auto__ = (function (){var and__5000__auto__ = block;
if(cljs.core.truth_(and__5000__auto__)){
return ["slot:",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))].join('');
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var type = temp__5804__auto__;
return frontend.handler.plugin.hook_plugin_editor.cljs$core$IFn$_invoke$arity$3(type,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([payload,block], 0)),null);
} else {
return null;
}
});
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.plugin !== 'undefined') && (typeof frontend.handler.plugin._STAR_ls_dotdir_root !== 'undefined')){
} else {
frontend.handler.plugin._STAR_ls_dotdir_root = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.handler.plugin.get_ls_dotdir_root = (function frontend$handler$plugin$get_ls_dotdir_root(){
return cljs.core.deref(frontend.handler.plugin._STAR_ls_dotdir_root);
});
frontend.handler.plugin.init_ls_dotdir_root = (function frontend$handler$plugin$init_ls_dotdir_root(){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2((cljs.core.truth_(frontend.util.electron_QMARK_())?electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["getLogseqDotDirRoot"], 0)):"LSPUserDotRoot/"),(function (p1__101130_SHARP_){
cljs.core.reset_BANG_(frontend.handler.plugin._STAR_ls_dotdir_root,p1__101130_SHARP_);

return p1__101130_SHARP_;
}));
});
frontend.handler.plugin.make_fn_to_load_dotdir_json = (function frontend$handler$plugin$make_fn_to_load_dotdir_json(dirname,default$){
return (function (key){
var temp__5804__auto__ = (function (){var and__5000__auto__ = key;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.name(key);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var key__$1 = temp__5804__auto__;
var repo = "";
var dotroot = frontend.handler.plugin.get_ls_dotdir_root();
var filepath = (function (){var G__101131 = dotroot;
var G__101132 = dirname;
var G__101133 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(key__$1),".json"].join('');
return (frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$3 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$3(G__101131,G__101132,G__101133) : frontend.util.node_path.join.call(null,G__101131,G__101132,G__101133));
})();
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.create_if_not_exists.cljs$core$IFn$_invoke$arity$4(repo,null,filepath,JSON.stringify(default$))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2(null,filepath)),(function (json){
return promesa.protocols._promise(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [filepath,JSON.parse(json)], null));
}));
}));
}));
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.idb.get_item(filepath)),(function (data){
return promesa.protocols._promise(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [filepath,(function (){var or__5002__auto__ = data;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return default$;
}
})()], null));
}));
}));
}
} else {
return null;
}
});
});
frontend.handler.plugin.make_fn_to_save_dotdir_json = (function frontend$handler$plugin$make_fn_to_save_dotdir_json(dirname){
return (function (key,data){
var temp__5804__auto__ = (function (){var and__5000__auto__ = key;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.name(key);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var key__$1 = temp__5804__auto__;
var repo = "";
var dotroot = frontend.handler.plugin.get_ls_dotdir_root();
var filepath = (function (){var G__101138 = dotroot;
var G__101139 = dirname;
var G__101140 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(key__$1),".json"].join('');
return (frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$3 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$3(G__101138,G__101139,G__101140) : frontend.util.node_path.join.call(null,G__101138,G__101139,G__101140));
})();
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return frontend.fs.write_plain_text_file_BANG_(repo,null,filepath,JSON.stringify(data,null,(2)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null));
} else {
return frontend.idb.set_item_BANG_(filepath,data);
}
} else {
return null;
}
});
});
frontend.handler.plugin.make_fn_to_unlink_dotdir_json = (function frontend$handler$plugin$make_fn_to_unlink_dotdir_json(dirname){
return (function (key){
var temp__5804__auto__ = (function (){var and__5000__auto__ = key;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.name(key);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var key__$1 = temp__5804__auto__;
var repo = "";
var dotroot = frontend.handler.plugin.get_ls_dotdir_root();
var filepath = (function (){var G__101141 = dotroot;
var G__101142 = dirname;
var G__101143 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(key__$1),".json"].join('');
return (frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$3 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$3(G__101141,G__101142,G__101143) : frontend.util.node_path.join.call(null,G__101141,G__101142,G__101143));
})();
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return frontend.fs.unlink_BANG_(repo,filepath,null);
} else {
return frontend.idb.remove_item_BANG_(filepath);
}
} else {
return null;
}
});
});
frontend.handler.plugin.show_themes_modal_BANG_ = (function frontend$handler$plugin$show_themes_modal_BANG_(var_args){
var G__101145 = arguments.length;
switch (G__101145) {
case 0:
return frontend.handler.plugin.show_themes_modal_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.handler.plugin.show_themes_modal_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.plugin.show_themes_modal_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.handler.plugin.show_themes_modal_BANG_.cljs$core$IFn$_invoke$arity$1(false);
}));

(frontend.handler.plugin.show_themes_modal_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (classic_QMARK_){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("modal","show-themes-modal","modal/show-themes-modal",238725999),classic_QMARK_], null));
}));

(frontend.handler.plugin.show_themes_modal_BANG_.cljs$lang$maxFixedArity = 1);

frontend.handler.plugin.goto_plugins_dashboard_BANG_ = (function frontend$handler$plugin$goto_plugins_dashboard_BANG_(){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("go","plugins","go/plugins",1900072925)], null));
});
frontend.handler.plugin.goto_plugins_settings_BANG_ = (function frontend$handler$plugin$goto_plugins_settings_BANG_(){
var temp__5804__auto__ = cljs.core.first(cljs.core.seq(frontend.handler.plugin.get_enabled_plugins_if_setting_schema()));
if(cljs.core.truth_(temp__5804__auto__)){
var pl = temp__5804__auto__;
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("go","plugins-settings","go/plugins-settings",-583021288),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(pl)], null));
} else {
return null;
}
});
frontend.handler.plugin.get_user_default_plugins = (function frontend$handler$plugin$get_user_default_plugins(){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2((cljs.core.truth_(frontend.util.electron_QMARK_())?electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["getUserDefaultPlugins"], 0)):frontend.handler.plugin.invoke_exported_api(new cljs.core.Keyword(null,"load_installed_web_plugins","load_installed_web_plugins",977747133))),(function (p1__101146_SHARP_){
return cljs_bean.core.__GT_clj(p1__101146_SHARP_);
})),(function (plugins){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__101147_SHARP_){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"url","url",276297046)],[p1__101147_SHARP_]);
}),plugins);
} else {
var G__101149 = cljs.core.vals(plugins);
if((G__101149 == null)){
return null;
} else {
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__101148_SHARP_){
return new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(p1__101148_SHARP_);
}),G__101149);
}
}
})),(function (e){
return console.error("[get-user-default-plugins:error]",e);
}));
});
frontend.handler.plugin.set_auto_checking_BANG_ = (function frontend$handler$plugin$set_auto_checking_BANG_(v){
var v__$1 = cljs.core.boolean$(v);
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Updates: ",((v__$1)?"start":"finish")," auto-checking..."], 0));

return frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","updates-auto-checking?","plugin/updates-auto-checking?",1617323181),v__$1);
});
frontend.handler.plugin.get_auto_checking_QMARK_ = (function frontend$handler$plugin$get_auto_checking_QMARK_(){
return new cljs.core.Keyword("plugin","updates-auto-checking?","plugin/updates-auto-checking?",1617323181).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
});
frontend.handler.plugin.get_user_checking_QMARK_ = (function frontend$handler$plugin$get_user_checking_QMARK_(){
return cljs.core.boolean$(cljs.core.seq(new cljs.core.Keyword("plugin","updates-pending","plugin/updates-pending",-1190878256).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))));
});
frontend.handler.plugin.get_updates_downloading_QMARK_ = (function frontend$handler$plugin$get_updates_downloading_QMARK_(){
return cljs.core.boolean$(new cljs.core.Keyword("plugin","updates-downloading?","plugin/updates-downloading?",1294108608).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
});
frontend.handler.plugin.cancel_user_checking_BANG_ = (function frontend$handler$plugin$cancel_user_checking_BANG_(){
if(((frontend.handler.plugin.get_user_checking_QMARK_()) && (cljs.core.not(frontend.handler.plugin.get_auto_checking_QMARK_())))){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","updates-pending","plugin/updates-pending",-1190878256),cljs.core.PersistentArrayMap.EMPTY);
} else {
return null;
}
});
frontend.handler.plugin.user_check_enabled_for_updates_BANG_ = (function frontend$handler$plugin$user_check_enabled_for_updates_BANG_(theme_QMARK_){
var user_checking_QMARK_ = frontend.handler.plugin.get_user_checking_QMARK_();
var auto_checking_QMARK_ = frontend.handler.plugin.get_auto_checking_QMARK_();
if(cljs.core.truth_(auto_checking_QMARK_)){
frontend.handler.plugin.set_auto_checking_BANG_(false);
} else {
}

if(cljs.core.truth_((function (){var or__5002__auto__ = auto_checking_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (!(user_checking_QMARK_));
}
})())){
var temp__5804__auto__ = cljs.core.seq(cljs.core.take.cljs$core$IFn$_invoke$arity$2((32),frontend.state.get_enabled_QMARK__installed_plugins.cljs$core$IFn$_invoke$arity$1(theme_QMARK_)));
if(temp__5804__auto__){
var plugins = temp__5804__auto__;
frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","updates-pending","plugin/updates-pending",-1190878256),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (v){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(v)),v], null);
}),plugins)));

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","consume-updates","plugin/consume-updates",-331798674)], null));
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.plugin.auto_check_enabled_for_updates_BANG_ = (function frontend$handler$plugin$auto_check_enabled_for_updates_BANG_(){
if((((!(frontend.handler.plugin.get_updates_downloading_QMARK_()))) && (((cljs.core.not(frontend.handler.plugin.get_auto_checking_QMARK_())) && ((!(frontend.handler.plugin.get_user_checking_QMARK_()))))))){
var temp__5804__auto__ = cljs.core.seq(cljs.core.take.cljs$core$IFn$_invoke$arity$2((16),cljs.core.shuffle(frontend.state.get_enabled_QMARK__installed_plugins.cljs$core$IFn$_invoke$arity$1(null))));
if(temp__5804__auto__){
var plugins = temp__5804__auto__;
frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","updates-pending","plugin/updates-pending",-1190878256),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (v){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(v)),v], null);
}),plugins)));

frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","consume-updates","plugin/consume-updates",-331798674)], null));

return frontend.handler.plugin.set_auto_checking_BANG_(true);
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.plugin.get_enabled_auto_check_for_updates_QMARK_ = (function frontend$handler$plugin$get_enabled_auto_check_for_updates_QMARK_(){
return (!(frontend.storage.get(new cljs.core.Keyword(null,"lsp-last-auto-updates","lsp-last-auto-updates",1901307330)) === false));
});
frontend.handler.plugin.set_enabled_auto_check_for_updates = (function frontend$handler$plugin$set_enabled_auto_check_for_updates(v_QMARK_){
return frontend.storage.set(new cljs.core.Keyword(null,"lsp-last-auto-updates","lsp-last-auto-updates",1901307330),cljs.core.boolean$(v_QMARK_));
});
frontend.handler.plugin.call_plugin = (function frontend$handler$plugin$call_plugin(pl,type,payload){
if(cljs.core.truth_(pl)){
return pl.caller.call(cljs.core.name(type),cljs_bean.core.__GT_js(payload));
} else {
return null;
}
});
frontend.handler.plugin.request_callback = (function frontend$handler$plugin$request_callback(pl,req_id,payload){
return frontend.handler.plugin.call_plugin(pl,new cljs.core.Keyword(null,"#lsp#request#callback","#lsp#request#callback",442990365),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"requestId","requestId",1929208145),req_id,new cljs.core.Keyword(null,"payload","payload",-383036092),payload], null));
});
frontend.handler.plugin.op_pinned_toolbar_item_BANG_ = (function frontend$handler$plugin$op_pinned_toolbar_item_BANG_(key,op){
var pinned = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","preferences","plugin/preferences",668527388),new cljs.core.Keyword(null,"pinnedToolbarItems","pinnedToolbarItems",889309943)], null));
var pinned__$1 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.EMPTY,pinned);
var temp__5804__auto__ = (function (){var G__101154 = op;
var G__101154__$1 = (((G__101154 instanceof cljs.core.Keyword))?G__101154.fqn:null);
switch (G__101154__$1) {
case "add":
return cljs.core.conj;

break;
case "remove":
return cljs.core.disj;

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__101154__$1)].join('')));

}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var op_fn = temp__5804__auto__;
return frontend.handler.plugin.save_plugin_preferences_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pinnedToolbarItems","pinnedToolbarItems",889309943),(function (){var G__101155 = pinned__$1;
var G__101156 = cljs.core.name(key);
return (op_fn.cljs$core$IFn$_invoke$arity$2 ? op_fn.cljs$core$IFn$_invoke$arity$2(G__101155,G__101156) : op_fn.call(null,G__101155,G__101156));
})()], null));
} else {
return null;
}
});
frontend.handler.plugin.hook_lifecycle_fn_BANG_ = (function frontend$handler$plugin$hook_lifecycle_fn_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___101393 = arguments.length;
var i__5727__auto___101394 = (0);
while(true){
if((i__5727__auto___101394 < len__5726__auto___101393)){
args__5732__auto__.push((arguments[i__5727__auto___101394]));

var G__101396 = (i__5727__auto___101394 + (1));
i__5727__auto___101394 = G__101396;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.handler.plugin.hook_lifecycle_fn_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.handler.plugin.hook_lifecycle_fn_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (type,f,args){
if(cljs.core.truth_((function (){var and__5000__auto__ = type;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.fn_QMARK_(f);
} else {
return and__5000__auto__;
}
})())){
if(cljs.core.truth_(frontend.config.lsp_enabled_QMARK_)){
frontend.handler.plugin.hook_plugin_app.cljs$core$IFn$_invoke$arity$2([cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"before-command-invoked","before-command-invoked",882704254)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(type)].join(''),null);
} else {
}

cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,args);

if(cljs.core.truth_(frontend.config.lsp_enabled_QMARK_)){
return frontend.handler.plugin.hook_plugin_app.cljs$core$IFn$_invoke$arity$2([cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"after-command-invoked","after-command-invoked",-530377994)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(type)].join(''),null);
} else {
return null;
}
} else {
return null;
}
}));

(frontend.handler.plugin.hook_lifecycle_fn_BANG_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.handler.plugin.hook_lifecycle_fn_BANG_.cljs$lang$applyTo = (function (seq101157){
var G__101158 = cljs.core.first(seq101157);
var seq101157__$1 = cljs.core.next(seq101157);
var G__101159 = cljs.core.first(seq101157__$1);
var seq101157__$2 = cljs.core.next(seq101157__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__101158,G__101159,seq101157__$2);
}));

frontend.handler.plugin.load_plugin_from_web_url_BANG_ = (function frontend$handler$plugin$load_plugin_from_web_url_BANG_(url){
if((!(((typeof url === 'string') && (clojure.string.starts_with_QMARK_(url,"http")))))){
return promesa.core.rejected((new Error("Invalid web url")));
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(clojure.string.replace(url,/\/+$/,"")),(function (url__$1){
return promesa.protocols._mcat(promesa.protocols._promise(clojure.string.includes_QMARK_(url__$1,"github.com")),(function (github_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(github_QMARK_)?(function (){var G__101163 = cljs.core.re_find(/github.com\/([^\/]+\/[^\/]+)/,url__$1);
if((G__101163 == null)){
return null;
} else {
return cljs.core.last(G__101163);
}
})():null)),(function (github_repo){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(github_QMARK_)?(function (){var G__101167 = github_repo;
if((G__101167 == null)){
return null;
} else {
return frontend.handler.common.plugin.get_web_plugin_checker_url_BANG_.cljs$core$IFn$_invoke$arity$1(G__101167);
}
})():[cljs.core.str.cljs$core$IFn$_invoke$arity$1(url__$1),"/package.json"].join(''))),(function (package_url){
return promesa.protocols._mcat(promesa.protocols._promise(window.fetch([cljs.core.str.cljs$core$IFn$_invoke$arity$1(package_url),"?v=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(Date.now())].join(''))),(function (res){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = res.ok;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(res.status,(200));
} else {
return and__5000__auto__;
}
})())?promesa.core.then.cljs$core$IFn$_invoke$arity$2(res.json(),cljs_bean.core.__GT_clj):(function(){throw (new Error(res.text()))})())),(function (package$){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"logseq","logseq",-928939893).cljs$core$IFn$_invoke$arity$1(package$);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw (new Error("Illegal logseq package"));
}
})()),(function (logseq__$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var id = (cljs.core.truth_(github_QMARK_)?(function (){var G__101168 = github_repo;
if((G__101168 == null)){
return null;
} else {
return clojure.string.replace(G__101168,"/","_");
}
})():(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(logseq__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(package$);
}
})());
var repo = (function (){var or__5002__auto__ = github_repo;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return id;
}
})();
var theme_QMARK_ = (!(((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"theme","theme",-1247880880).cljs$core$IFn$_invoke$arity$1(logseq__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"themes","themes",-702786642).cljs$core$IFn$_invoke$arity$1(logseq__$1);
}
})() == null)));
return frontend.handler.common.plugin.emit_lsp_updates_BANG_(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"completed","completed",-486056503),new cljs.core.Keyword(null,"only-check","only-check",-1961506795),false,new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"dst","dst",844682948),repo,new cljs.core.Keyword(null,"theme","theme",-1247880880),theme_QMARK_,new cljs.core.Keyword(null,"web-pkg","web-pkg",304735692),(function (){var G__101169 = package$;
if(cljs.core.not(github_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__101169,new cljs.core.Keyword(null,"installedFromUserWebUrl","installedFromUserWebUrl",-1070272832),url__$1);
} else {
return G__101169;
}
})()], null)], null));
})()),(function (___41611__auto__){
return promesa.protocols._promise(url__$1);
}));
}));
}));
}));
}));
}));
}));
}));
}));
}
});
frontend.handler.plugin.lsp_indicator = rum.core.lazy_build(rum.core.build_defc,(function (){
var text = (function (){var or__5002__auto__ = frontend.state.sub(new cljs.core.Keyword("plugin","indicator-text","plugin/indicator-text",-221282032));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core.not(frontend.util.electron_QMARK_())){
return "LOADING";
} else {
return null;
}
}
})();
if(text === true){
return null;
} else {
return daiquiri.core.create_element("div",{'className':"flex align-items justify-center h-screen w-full preboot-loading"},[daiquiri.core.create_element("span",{'className':"flex items-center justify-center flex-col"},[(function (){var attrs101171 = frontend.components.svg.logo.cljs$core$IFn$_invoke$arity$0();
return daiquiri.core.create_element("small",((cljs.core.map_QMARK_(attrs101171))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["scale-250","opacity-50","mb-10","animate-pulse"], null)], null),attrs101171], 0))):{'className':"scale-250 opacity-50 mb-10 animate-pulse"}),((cljs.core.map_QMARK_(attrs101171))?null:[daiquiri.interpreter.interpret(attrs101171)]));
})(),daiquiri.core.create_element("small",{'style':{'right':"-8px",'minHeight':"24px"},'className':"block text-sm relative opacity-50"},[cljs.core.str.cljs$core$IFn$_invoke$arity$1(text)])])]);
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.handler.plugin/lsp-indicator");
frontend.handler.plugin.init_plugins_BANG_ = (function frontend$handler$plugin$init_plugins_BANG_(callback){
var el_101408 = document.createElement("div");
document.body.appendChild(el_101408);

rum.core.mount(frontend.handler.plugin.lsp_indicator(),el_101408);

return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.plugin.init_ls_dotdir_root()),(function (root){
return promesa.protocols._mcat(promesa.protocols._promise(LSPlugin.setupPluginCore(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"localUserConfigRoot","localUserConfigRoot",1613555808),root,new cljs.core.Keyword(null,"dotConfigRoot","dotConfigRoot",-1961584501),root], null)))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise((function (pid){
frontend.handler.plugin.unregister_plugin_slash_command(pid);

frontend.handler.plugin.invoke_exported_api.cljs$core$IFn$_invoke$arity$variadic("unregister_plugin_simple_command",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pid], 0));

frontend.handler.plugin.invoke_exported_api.cljs$core$IFn$_invoke$arity$variadic("uninstall_plugin_hook",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pid], 0));

frontend.handler.plugin.unregister_plugin_ui_items(pid);

frontend.handler.plugin.unregister_plugin_resources(pid);

return frontend.handler.plugin.unregister_plugin_search_services(pid);
})),(function (clear_commands_BANG_){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__101176 = LSPluginCore;
G__101176.on("registered",(function (pl){
return frontend.handler.plugin.register_plugin(cljs_bean.core.__GT_clj(JSON.parse(JSON.stringify(pl))));
}));

G__101176.on("beforeload",(function (pl){
var text = (cljs.core.truth_(frontend.util.electron_QMARK_())?(function (){var G__101177 = "Load plugin: %s...";
var G__101178 = pl.id;
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__101177,G__101178) : frontend.util.format.call(null,G__101177,G__101178));
})():null);
var G__101179 = text;
if((G__101179 == null)){
return null;
} else {
return frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","indicator-text","plugin/indicator-text",-221282032),G__101179);
}
}));

G__101176.on("reloaded",(function (pl){
return frontend.handler.plugin.register_plugin(cljs_bean.core.__GT_clj(JSON.parse(JSON.stringify(pl))));
}));

G__101176.on("unregistered",(function (pid){
var pid__$1 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid);
frontend.handler.plugin.unregister_plugin_themes.cljs$core$IFn$_invoke$arity$1(pid__$1);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.state,medley.core.dissoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","installed-plugins","plugin/installed-plugins",-1068618034),pid__$1], null));

return (clear_commands_BANG_.cljs$core$IFn$_invoke$arity$1 ? clear_commands_BANG_.cljs$core$IFn$_invoke$arity$1(pid__$1) : clear_commands_BANG_.call(null,pid__$1));
}));

G__101176.on("unlink-plugin",(function (pid){
var pid__$1 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(pid);
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"uninstallMarketPlugin","uninstallMarketPlugin",1767252086),cljs.core.name(pid__$1)], 0));
} else {
return frontend.handler.plugin.unlink_plugin_for_web_BANG_(pid__$1);
}
}));

G__101176.on("beforereload",(function (pl){
var pid = pl.id;
(clear_commands_BANG_.cljs$core$IFn$_invoke$arity$1 ? clear_commands_BANG_.cljs$core$IFn$_invoke$arity$1(pid) : clear_commands_BANG_.call(null,pid));

return frontend.handler.plugin.unregister_plugin_themes.cljs$core$IFn$_invoke$arity$2(pid,false);
}));

G__101176.on("disabled",(function (pid){
(clear_commands_BANG_.cljs$core$IFn$_invoke$arity$1 ? clear_commands_BANG_.cljs$core$IFn$_invoke$arity$1(pid) : clear_commands_BANG_.call(null,pid));

return frontend.handler.plugin.unregister_plugin_themes.cljs$core$IFn$_invoke$arity$1(pid);
}));

G__101176.on("themes-changed",(function (themes){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.state.state,cljs.core.assoc,new cljs.core.Keyword("plugin","installed-themes","plugin/installed-themes",1969555197),cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__101180){
var vec__101181 = p__101180;
var pid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101181,(0),null);
var vs = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101181,(1),null);
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__101173_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__101173_SHARP_,new cljs.core.Keyword(null,"pid","pid",1018387698),pid);
}),cljs_bean.core.__GT_clj(vs));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs_bean.core.__GT_clj(themes)], 0))));
}));

G__101176.on("theme-selected",(function (theme){
var theme__$1 = cljs_bean.core.__GT_clj(theme);
var theme__$2 = frontend.handler.plugin.assets_theme_to_file(theme__$1);
var url = new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(theme__$2);
var mode = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"mode","mode",654403691).cljs$core$IFn$_invoke$arity$1(theme__$2);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.state.sub(new cljs.core.Keyword("ui","theme","ui/theme",-1247877132));
}
})();
if(cljs.core.truth_(mode)){
frontend.state.set_custom_theme_BANG_.cljs$core$IFn$_invoke$arity$2(mode,theme__$2);

frontend.state.set_theme_mode_BANG_(mode);
} else {
}

frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","selected-theme","plugin/selected-theme",-172679220),url);

return frontend.handler.plugin.hook_plugin_app.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"theme-changed","theme-changed",-1173604306),theme__$2);
}));

G__101176.on("reset-custom-theme",(function (themes){
var themes__$1 = cljs_bean.core.__GT_clj(themes);
var custom_theme = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(themes__$1,new cljs.core.Keyword(null,"mode","mode",654403691));
var mode = new cljs.core.Keyword(null,"mode","mode",654403691).cljs$core$IFn$_invoke$arity$1(themes__$1);
frontend.state.set_custom_theme_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"light","light",1918998747),(((new cljs.core.Keyword(null,"light","light",1918998747).cljs$core$IFn$_invoke$arity$1(custom_theme) == null))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mode","mode",654403691),"light"], null):new cljs.core.Keyword(null,"light","light",1918998747).cljs$core$IFn$_invoke$arity$1(custom_theme)),new cljs.core.Keyword(null,"dark","dark",1818973999),(((new cljs.core.Keyword(null,"dark","dark",1818973999).cljs$core$IFn$_invoke$arity$1(custom_theme) == null))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mode","mode",654403691),"dark"], null):new cljs.core.Keyword(null,"dark","dark",1818973999).cljs$core$IFn$_invoke$arity$1(custom_theme))], null));

return frontend.state.set_theme_mode_BANG_(mode);
}));

G__101176.on("settings-changed",(function (id,settings){
var id__$1 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(id);
if(cljs.core.truth_((function (){var and__5000__auto__ = settings;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.contains_QMARK_(new cljs.core.Keyword("plugin","installed-plugins","plugin/installed-plugins",-1068618034).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),id__$1);
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.plugin.update_plugin_settings_state(id__$1,cljs_bean.core.__GT_clj(settings));
} else {
return null;
}
}));

G__101176.on("ready",(function (perf_table){
var temp__5804__auto__ = (function (){var and__5000__auto__ = perf_table;
if(cljs.core.truth_(and__5000__auto__)){
return perf_table.entries();
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var plugins = temp__5804__auto__;
return (function (perfs){
var seq__101184 = cljs.core.seq(perfs);
var chunk__101185 = null;
var count__101186 = (0);
var i__101187 = (0);
while(true){
if((i__101187 < count__101186)){
var perf = chunk__101185.cljs$core$IIndexed$_nth$arity$2(null,i__101187);
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","loader-perf-tip","plugin/loader-perf-tip",1893085954),cljs_bean.core.__GT_clj(perf)], null));


var G__101445 = seq__101184;
var G__101446 = chunk__101185;
var G__101447 = count__101186;
var G__101448 = (i__101187 + (1));
seq__101184 = G__101445;
chunk__101185 = G__101446;
count__101186 = G__101447;
i__101187 = G__101448;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__101184);
if(temp__5804__auto____$1){
var seq__101184__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__101184__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__101184__$1);
var G__101450 = cljs.core.chunk_rest(seq__101184__$1);
var G__101451 = c__5525__auto__;
var G__101452 = cljs.core.count(c__5525__auto__);
var G__101453 = (0);
seq__101184 = G__101450;
chunk__101185 = G__101451;
count__101186 = G__101452;
i__101187 = G__101453;
continue;
} else {
var perf = cljs.core.first(seq__101184__$1);
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("plugin","loader-perf-tip","plugin/loader-perf-tip",1893085954),cljs_bean.core.__GT_clj(perf)], null));


var G__101454 = cljs.core.next(seq__101184__$1);
var G__101455 = null;
var G__101456 = (0);
var G__101457 = (0);
seq__101184 = G__101454;
chunk__101185 = G__101455;
count__101186 = G__101456;
i__101187 = G__101457;
continue;
}
} else {
return null;
}
}
break;
}
})(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__101188){
var vec__101189 = p__101188;
var _k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101189,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101189,(1),null);
var temp__5804__auto____$1 = (function (){var and__5000__auto__ = (function (){var G__101192 = v;
var G__101192__$1 = (((G__101192 == null))?null:G__101192.o);
var G__101192__$2 = (((G__101192__$1 == null))?null:G__101192__$1.disabled);
if((G__101192__$2 == null)){
return null;
} else {
return cljs.core.not(G__101192__$2);
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return v.e;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var end = temp__5804__auto____$1;
if(((typeof end === 'number') && ((((end > (0))) && (((end - v.s) > (6000))))))){
return v;
} else {
return null;
}
} else {
return null;
}
}),plugins));
} else {
return null;
}
}));

return G__101176;
})()),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.plugin.get_user_default_plugins()),(function (default_plugins){
return promesa.protocols._mcat(promesa.protocols._promise(((((cljs.core.seq(default_plugins)) && (cljs.core.not(frontend.util.electron_QMARK_()))))?cljs.core.juxt.cljs$core$IFn$_invoke$arity$2((function (its){
return cljs.core.filterv((function (p1__101174_SHARP_){
return new cljs.core.Keyword(null,"theme","theme",-1247880880).cljs$core$IFn$_invoke$arity$1(p1__101174_SHARP_);
}),its);
}),(function (its){
return cljs.core.filterv((function (p1__101175_SHARP_){
return cljs.core.not(new cljs.core.Keyword(null,"theme","theme",-1247880880).cljs$core$IFn$_invoke$arity$1(p1__101175_SHARP_));
}),its);
}))(default_plugins):new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [default_plugins], null))),(function (p__101193){
var vec__101194 = p__101193;
var plugins0 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101194,(0),null);
var plugins_async = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101194,(1),null);
return promesa.protocols._mcat(promesa.protocols._promise(LSPluginCore.register(cljs_bean.core.__GT_js(((cljs.core.seq(plugins0))?plugins0:cljs.core.PersistentVector.EMPTY)),true)),(function (___$2){
return promesa.protocols._promise(plugins_async);
}));
}));
}));
}));
}));
}));
}));
})),(function (plugins_async){
frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","indicator-text","plugin/indicator-text",-221282032),true);

return setTimeout((function (){
(callback.cljs$core$IFn$_invoke$arity$0 ? callback.cljs$core$IFn$_invoke$arity$0() : callback.call(null));

var G__101202 = cljs.core.seq(plugins_async);
var G__101202__$1 = (((G__101202 == null))?null:promesa.core.delay.cljs$core$IFn$_invoke$arity$2(G__101202,(16)));
if((G__101202__$1 == null)){
return null;
} else {
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(G__101202__$1,(function (){
return LSPluginCore.register(cljs_bean.core.__GT_js(plugins_async),true);
}));
}
}),(cljs.core.truth_(frontend.util.electron_QMARK_())?(64):(0)));
})),(function (e){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.plugin",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"setup-plugin-system-error","setup-plugin-system-error",1363975168),e,new cljs.core.Keyword(null,"line","line",212345235),961], null)),null);

return frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","indicator-text","plugin/indicator-text",-221282032),["Fatal: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e)].join(''));
}));
});
/**
 * setup plugin core handler
 */
frontend.handler.plugin.setup_BANG_ = (function frontend$handler$plugin$setup_BANG_(callback){
if(cljs.core.not(frontend.config.lsp_enabled_QMARK_)){
return (callback.cljs$core$IFn$_invoke$arity$0 ? callback.cljs$core$IFn$_invoke$arity$0() : callback.call(null));
} else {
frontend.idb.start();

frontend.handler.plugin.setup_global_apis_for_web_BANG_();

return frontend.handler.plugin.init_plugins_BANG_(callback);
}
});

//# sourceMappingURL=frontend.handler.plugin.js.map
