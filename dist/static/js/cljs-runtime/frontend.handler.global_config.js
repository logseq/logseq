goog.provide('frontend.handler.global_config');
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.global_config !== 'undefined') && (typeof frontend.handler.global_config.root_dir !== 'undefined')){
} else {
frontend.handler.global_config.root_dir = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
/**
 * Fetch config dir in a global config context
 */
frontend.handler.global_config.global_config_dir = (function frontend$handler$global_config$global_config_dir(){
return logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(cljs.core.deref(frontend.handler.global_config.root_dir),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["config"], 0));
});
/**
 * Fetch config dir in a general context, not just for global config
 */
frontend.handler.global_config.safe_global_config_dir = (function frontend$handler$global_config$safe_global_config_dir(){
if(cljs.core.truth_(cljs.core.deref(frontend.handler.global_config.root_dir))){
return frontend.handler.global_config.global_config_dir();
} else {
return null;
}
});
/**
 * Fetch config path in a global config context
 */
frontend.handler.global_config.global_config_path = (function frontend$handler$global_config$global_config_path(){
return logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(cljs.core.deref(frontend.handler.global_config.root_dir),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["config","config.edn"], 0));
});
/**
 * Fetch config path in a general context, not just for global config
 */
frontend.handler.global_config.safe_global_config_path = (function frontend$handler$global_config$safe_global_config_path(){
if(cljs.core.truth_(cljs.core.deref(frontend.handler.global_config.root_dir))){
return frontend.handler.global_config.global_config_path();
} else {
return null;
}
});
frontend.handler.global_config.set_global_config_state_BANG_ = (function frontend$handler$global_config$set_global_config_state_BANG_(content){
var config = clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1(content);
frontend.state.set_global_config_BANG_(config,content);

return config;
});
frontend.handler.global_config.default_content = ";; This global config file applies a configuration to all graphs. Any config\n;; keys from a graph's logseq/config.edn can used here. A graph's\n;; logseq/config.edn overrides config keys in this file except for maps which\n;; are merged. As an example of merging, the following global and local configs:\n;;   {:shortcuts {:ui/toggle-theme \"t z\"}}\n;;   {:shortcuts {:ui/toggle-brackets \"t b\"}}\n;;\n;;  would result in the final config:\n;;   {:shortcuts {:ui/toggle-theme \"t z\"\n;;                :ui/toggle-brackets \"t b\"}}\n\n{}\n";
frontend.handler.global_config.create_global_config_file_if_not_exists = (function frontend$handler$global_config$create_global_config_file_if_not_exists(repo_url){
var config_dir = frontend.handler.global_config.global_config_dir();
var config_path = frontend.handler.global_config.global_config_path();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.mkdir_if_not_exists(config_dir)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.create_if_not_exists.cljs$core$IFn$_invoke$arity$4(repo_url,null,config_path,frontend.handler.global_config.default_content)),(function (file_exists_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(file_exists_QMARK_)?null:frontend.handler.global_config.set_global_config_state_BANG_(frontend.handler.global_config.default_content)));
}));
}));
}));
});
/**
 * Sets global config state from config file
 */
frontend.handler.global_config.restore_global_config_BANG_ = (function frontend$handler$global_config$restore_global_config_BANG_(){
var config_path = frontend.handler.global_config.global_config_path();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2(null,config_path)),(function (config_content){
return promesa.protocols._promise(frontend.handler.global_config.set_global_config_state_BANG_(config_content));
}));
}));
});
frontend.handler.global_config.set_global_config_kv_BANG_ = (function frontend$handler$global_config$set_global_config_kv_BANG_(k,v){
var result = borkdude.rewrite_edn.parse_string((function (){var or__5002__auto__ = frontend.state.get_global_config_str_content();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "{}";
}
})());
var ks = ((cljs.core.sequential_QMARK_(k))?k:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [k], null));
var v__$1 = (function (){var G__101062 = v;
if(cljs.core.map_QMARK_(v)){
return cljs.core.reduce_kv((function (a,k__$1,v__$1){
return borkdude.rewrite_edn.assoc(a,k__$1,v__$1);
}),borkdude.rewrite_edn.parse_string("{}"),G__101062);
} else {
return G__101062;
}
})();
var new_result = ((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(ks))) && ((v__$1 == null))))?borkdude.rewrite_edn.dissoc(result,cljs.core.first(ks)):borkdude.rewrite_edn.assoc_in(result,ks,v__$1));
var new_str_content = cljs.core.str.cljs$core$IFn$_invoke$arity$1(new_result);
frontend.fs.write_plain_text_file_BANG_(null,null,frontend.handler.global_config.global_config_path(),new_str_content,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null));

return frontend.state.set_global_config_BANG_(borkdude.rewrite_edn.sexpr(new_result),new_str_content);
});
/**
 * This component has four responsibilities on start:
 * - Fetch root-dir for later use with config paths
 * - Manage ui state of global config
 * - Create a global config dir and file if it doesn't exist
 * - Start a file watcher for global config dir if it's not already started.
 *   Watcher ensures client db is seeded with correct file data.
 */
frontend.handler.global_config.start = (function frontend$handler$global_config$start(p__101072){
var map__101073 = p__101072;
var map__101073__$1 = cljs.core.__destructure_map(map__101073);
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101073__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.timeout.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["getLogseqDotDirRoot"], 0))),(function (root_dir_SINGLEQUOTE_){
return promesa.protocols._promise(cljs.core.reset_BANG_(frontend.handler.global_config.root_dir,root_dir_SINGLEQUOTE_));
}));
}))),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.global_config.restore_global_config_BANG_()),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.global_config.create_global_config_file_if_not_exists(repo)),(function (___41611__auto____$2){
return promesa.protocols._promise(frontend.fs.watch_dir_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.handler.global_config.global_config_dir(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"global-dir","global-dir",-1891401566),true], null)));
}));
}));
}));
})),(6000)),(function (e){
return console.error("cannot start global-config",e);
}));
});

//# sourceMappingURL=frontend.handler.global_config.js.map
