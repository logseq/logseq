goog.provide('frontend.handler.plugin_config');
/**
 * Full path to plugins.edn
 */
frontend.handler.plugin_config.plugin_config_path = (function frontend$handler$plugin_config$plugin_config_path(){
return logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.global_config.global_config_dir(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["plugins.edn"], 0));
});
/**
 * Vec of plugin keys to store in plugins.edn and to compare with installed-plugins state
 */
frontend.handler.plugin_config.common_plugin_keys = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(cljs.core.first,cljs.core.rest(frontend.schema.handler.plugin_config.Plugin));
/**
 * Adds or updates a plugin from plugin.edn
 */
frontend.handler.plugin_config.add_or_update_plugin = (function frontend$handler$plugin_config$add_or_update_plugin(p__105733){
var map__105734 = p__105733;
var map__105734__$1 = cljs.core.__destructure_map(map__105734);
var plugin = map__105734__$1;
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105734__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2(null,frontend.handler.plugin_config.plugin_config_path())),(function (content){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.str.cljs$core$IFn$_invoke$arity$1(borkdude.rewrite_edn.assoc(borkdude.rewrite_edn.parse_string(content),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(id),cljs.core.select_keys(plugin,frontend.handler.plugin_config.common_plugin_keys)))),(function (updated_content){
return promesa.protocols._promise(frontend.fs.write_plain_text_file_BANG_("",null,frontend.handler.plugin_config.plugin_config_path(),updated_content,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null)));
}));
}));
}));
});
/**
 * Removes a plugin from plugin.edn
 */
frontend.handler.plugin_config.remove_plugin = (function frontend$handler$plugin_config$remove_plugin(plugin_id){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2("",frontend.handler.plugin_config.plugin_config_path())),(function (content){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.str.cljs$core$IFn$_invoke$arity$1(borkdude.rewrite_edn.dissoc(borkdude.rewrite_edn.parse_string(content),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(plugin_id)))),(function (updated_content){
return promesa.protocols._promise(frontend.fs.write_plain_text_file_BANG_("",null,frontend.handler.plugin_config.plugin_config_path(),updated_content,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null)));
}));
}));
}));
});
frontend.handler.plugin_config.create_plugin_config_file_if_not_exists = (function frontend$handler$plugin_config$create_plugin_config_file_if_not_exists(){
var content = (function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__105736_105756 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__105737_105757 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__105738_105758 = true;
var _STAR_print_fn_STAR__temp_val__105739_105759 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__105738_105758);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__105739_105759);

try{cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(cljs.core.update_vals(new cljs.core.Keyword("plugin","installed-plugins","plugin/installed-plugins",-1068618034).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),(function (p1__105735_SHARP_){
return cljs.core.select_keys(p1__105735_SHARP_,frontend.handler.plugin_config.common_plugin_keys);
})));
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__105737_105757);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__105736_105756);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})();
return frontend.fs.create_if_not_exists.cljs$core$IFn$_invoke$arity$4("",null,frontend.handler.plugin_config.plugin_config_path(),content);
});
/**
 * Given installed plugins state and plugins from plugins.edn,
 * returns map of plugins to install and uninstall
 */
frontend.handler.plugin_config.determine_plugins_to_change = (function frontend$handler$plugin_config$determine_plugins_to_change(installed_plugins,edn_plugins){
var installed_plugins_set = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__105740_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.select_keys(p1__105740_SHARP_,frontend.handler.plugin_config.common_plugin_keys),new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p1__105740_SHARP_)));
}),cljs.core.vals(installed_plugins)));
var edn_plugins_set = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__105742){
var vec__105743 = p__105742;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105743,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__105743,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(v,new cljs.core.Keyword(null,"id","id",-1388402092),k);
}),edn_plugins));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(installed_plugins_set,edn_plugins_set)){
return cljs.core.PersistentArrayMap.EMPTY;
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"install","install",-655751038),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__105741_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__105741_SHARP_,new cljs.core.Keyword(null,"plugin-action","plugin-action",2020834682),"install");
}),clojure.set.difference.cljs$core$IFn$_invoke$arity$2(edn_plugins_set,installed_plugins_set)),new cljs.core.Keyword(null,"uninstall","uninstall",-284438062),cljs.core.vec(clojure.set.difference.cljs$core$IFn$_invoke$arity$2(installed_plugins_set,edn_plugins_set))], null);
}
});
frontend.handler.plugin_config.open_install_plugin_from_github_modal = (function frontend$handler$plugin_config$open_install_plugin_from_github_modal(){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("go","install-plugin-from-github","go/install-plugin-from-github",1433230947)], null));
});
frontend.handler.plugin_config.open_replace_plugins_modal = (function frontend$handler$plugin_config$open_replace_plugins_modal(){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2(null,frontend.handler.plugin_config.plugin_config_path())),(function (edn_plugins_STAR_){
return promesa.protocols._mcat(promesa.protocols._promise(clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1(edn_plugins_STAR_)),(function (edn_plugins){
return promesa.protocols._promise((function (){var temp__5802__auto__ = malli.error.humanize.cljs$core$IFn$_invoke$arity$1(malli.core.explain.cljs$core$IFn$_invoke$arity$2(frontend.schema.handler.plugin_config.Plugins_edn,edn_plugins));
if(cljs.core.truth_(temp__5802__auto__)){
var errors = temp__5802__auto__;
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Invalid plugins.edn provided. See javascript console for specific errors",new cljs.core.Keyword(null,"error","error",-978969032));

lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.plugin-config",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"plugin-edn-errors","plugin-edn-errors",-699885047),errors,new cljs.core.Keyword(null,"line","line",212345235),91], null)),null);

return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Invalid plugins.edn, errors: ",errors], 0));
} else {
var plugins_to_change = frontend.handler.plugin_config.determine_plugins_to_change(new cljs.core.Keyword("plugin","installed-plugins","plugin/installed-plugins",-1068618034).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),edn_plugins);
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("go","plugins-from-file","go/plugins-from-file",-231716743),plugins_to_change], null));
}
})());
}));
}));
})),(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"reader-exception","reader-exception",-1938323098),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(cljs.core.ex_data(e)))){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Malformed plugins.edn provided. Please check the file has correct edn syntax.",new cljs.core.Keyword(null,"error","error",-978969032));
} else {
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.plugin-config",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"unexpected-error","unexpected-error",1973845951),e,new cljs.core.Keyword(null,"line","line",212345235),101], null)),null);
}
}));
});
/**
 * Replaces current plugins given plugins to install and uninstall
 */
frontend.handler.plugin_config.replace_plugins = (function frontend$handler$plugin_config$replace_plugins(plugins){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.plugin-config",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"uninstall-plugins","uninstall-plugins",-167708943),new cljs.core.Keyword(null,"uninstall","uninstall",-284438062).cljs$core$IFn$_invoke$arity$1(plugins),new cljs.core.Keyword(null,"line","line",212345235),106], null)),null);

var seq__105746_105760 = cljs.core.seq(new cljs.core.Keyword(null,"uninstall","uninstall",-284438062).cljs$core$IFn$_invoke$arity$1(plugins));
var chunk__105747_105761 = null;
var count__105748_105762 = (0);
var i__105749_105763 = (0);
while(true){
if((i__105749_105763 < count__105748_105762)){
var plugin_105764 = chunk__105747_105761.cljs$core$IIndexed$_nth$arity$2(null,i__105749_105763);
frontend.handler.common.plugin.unregister_plugin(cljs.core.name(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(plugin_105764)));


var G__105765 = seq__105746_105760;
var G__105766 = chunk__105747_105761;
var G__105767 = count__105748_105762;
var G__105768 = (i__105749_105763 + (1));
seq__105746_105760 = G__105765;
chunk__105747_105761 = G__105766;
count__105748_105762 = G__105767;
i__105749_105763 = G__105768;
continue;
} else {
var temp__5804__auto___105769 = cljs.core.seq(seq__105746_105760);
if(temp__5804__auto___105769){
var seq__105746_105770__$1 = temp__5804__auto___105769;
if(cljs.core.chunked_seq_QMARK_(seq__105746_105770__$1)){
var c__5525__auto___105771 = cljs.core.chunk_first(seq__105746_105770__$1);
var G__105772 = cljs.core.chunk_rest(seq__105746_105770__$1);
var G__105773 = c__5525__auto___105771;
var G__105774 = cljs.core.count(c__5525__auto___105771);
var G__105775 = (0);
seq__105746_105760 = G__105772;
chunk__105747_105761 = G__105773;
count__105748_105762 = G__105774;
i__105749_105763 = G__105775;
continue;
} else {
var plugin_105776 = cljs.core.first(seq__105746_105770__$1);
frontend.handler.common.plugin.unregister_plugin(cljs.core.name(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(plugin_105776)));


var G__105777 = cljs.core.next(seq__105746_105770__$1);
var G__105778 = null;
var G__105779 = (0);
var G__105780 = (0);
seq__105746_105760 = G__105777;
chunk__105747_105761 = G__105778;
count__105748_105762 = G__105779;
i__105749_105763 = G__105780;
continue;
}
} else {
}
}
break;
}

lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.plugin-config",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"install-plugins","install-plugins",-1876490807),new cljs.core.Keyword(null,"install","install",-655751038).cljs$core$IFn$_invoke$arity$1(plugins),new cljs.core.Keyword(null,"line","line",212345235),109], null)),null);

var seq__105750 = cljs.core.seq(new cljs.core.Keyword(null,"install","install",-655751038).cljs$core$IFn$_invoke$arity$1(plugins));
var chunk__105751 = null;
var count__105752 = (0);
var i__105753 = (0);
while(true){
if((i__105753 < count__105752)){
var plugin = chunk__105751.cljs$core$IIndexed$_nth$arity$2(null,i__105753);
frontend.handler.common.plugin.install_marketplace_plugin_BANG_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(plugin,new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.name(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(plugin))));


var G__105781 = seq__105750;
var G__105782 = chunk__105751;
var G__105783 = count__105752;
var G__105784 = (i__105753 + (1));
seq__105750 = G__105781;
chunk__105751 = G__105782;
count__105752 = G__105783;
i__105753 = G__105784;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__105750);
if(temp__5804__auto__){
var seq__105750__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__105750__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__105750__$1);
var G__105785 = cljs.core.chunk_rest(seq__105750__$1);
var G__105786 = c__5525__auto__;
var G__105787 = cljs.core.count(c__5525__auto__);
var G__105788 = (0);
seq__105750 = G__105785;
chunk__105751 = G__105786;
count__105752 = G__105787;
i__105753 = G__105788;
continue;
} else {
var plugin = cljs.core.first(seq__105750__$1);
frontend.handler.common.plugin.install_marketplace_plugin_BANG_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(plugin,new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.name(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(plugin))));


var G__105789 = cljs.core.next(seq__105750__$1);
var G__105790 = null;
var G__105791 = (0);
var G__105792 = (0);
seq__105750 = G__105789;
chunk__105751 = G__105790;
count__105752 = G__105791;
i__105753 = G__105792;
continue;
}
} else {
return null;
}
}
break;
}
});
/**
 * Sets up a listener for the lsp-installed event to update plugins.edn
 */
frontend.handler.plugin_config.setup_install_listener_BANG_ = (function frontend$handler$plugin_config$setup_install_listener_BANG_(){
var channel = cljs.core.name(new cljs.core.Keyword(null,"lsp-updates","lsp-updates",1924425351));
var listener = (function frontend$handler$plugin_config$setup_install_listener_BANG__$_listener(_,e){
var temp__5804__auto__ = cljs_bean.core.__GT_clj(e);
if(cljs.core.truth_(temp__5804__auto__)){
var map__105754 = temp__5804__auto__;
var map__105754__$1 = cljs.core.__destructure_map(map__105754);
var status = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105754__$1,new cljs.core.Keyword(null,"status","status",-1997798413));
var payload = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105754__$1,new cljs.core.Keyword(null,"payload","payload",-383036092));
var only_check = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105754__$1,new cljs.core.Keyword(null,"only-check","only-check",-1961506795));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(status,"completed")) && (cljs.core.not(only_check)))){
var map__105755 = payload;
var map__105755__$1 = cljs.core.__destructure_map(map__105755);
var theme = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105755__$1,new cljs.core.Keyword(null,"theme","theme",-1247880880));
var effect = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105755__$1,new cljs.core.Keyword(null,"effect","effect",347343289));
return frontend.handler.plugin_config.add_or_update_plugin(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(payload,new cljs.core.Keyword(null,"version","version",425292698),new cljs.core.Keyword(null,"installed-version","installed-version",-802921561).cljs$core$IFn$_invoke$arity$1(payload),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"effect","effect",347343289),cljs.core.boolean$(effect),new cljs.core.Keyword(null,"theme","theme",-1247880880),cljs.core.boolean$(theme)], 0)));
} else {
return null;
}
} else {
return null;
}
});
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
window.apis.addListener(channel,listener);
} else {
}

return (function (){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return window.apis.removeListener(channel,listener);
} else {
return null;
}
});
});
/**
 * This component has just one responsibility on start, to create a plugins.edn
 *   if none exists
 */
frontend.handler.plugin_config.start = (function frontend$handler$plugin_config$start(){
return frontend.handler.plugin_config.create_plugin_config_file_if_not_exists();
});

//# sourceMappingURL=frontend.handler.plugin_config.js.map
