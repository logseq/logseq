goog.provide('logseq.api');
goog.scope(function(){
  logseq.api.goog$module$goog$object = goog.module.get('goog.object');
});
logseq.api._LT_pull_block = (function logseq$api$_LT_pull_block(id_or_name){
if(cljs.core.truth_(id_or_name)){
var eid = ((cljs.core.uuid_QMARK_(id_or_name))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id_or_name], null):((((cljs.core.vector_QMARK_(id_or_name)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(id_or_name),(2)))))?id_or_name:((typeof id_or_name === 'number')?id_or_name:(cljs.core.truth_((function (){var and__5000__auto__ = typeof id_or_name === 'string';
if(and__5000__auto__){
return (frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(id_or_name) : frontend.util.uuid_string_QMARK_.call(null,id_or_name));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(id_or_name)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),(frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(id_or_name) : frontend.util.page_name_sanity_lc.call(null,id_or_name))], null)
))));
var G__131678 = frontend.state.get_current_repo();
var G__131679 = eid;
return (frontend.db.async._LT_pull.cljs$core$IFn$_invoke$arity$2 ? frontend.db.async._LT_pull.cljs$core$IFn$_invoke$arity$2(G__131678,G__131679) : frontend.db.async._LT_pull.call(null,G__131678,G__131679));
} else {
return null;
}
});
logseq.api.db_graph_QMARK_ = (function logseq$api$db_graph_QMARK_(){
var G__131680 = frontend.state.get_current_repo();
if((G__131680 == null)){
return null;
} else {
return frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(G__131680);
}
});
logseq.api.get_caller_plugin_id = (function logseq$api$get_caller_plugin_id(){
return logseq.api.goog$module$goog$object.get(window,"$$callerPluginID");
});
logseq.api.sanitize_user_property_name = (function logseq$api$sanitize_user_property_name(k){
if(typeof k === 'string'){
return clojure.string.lower_case(clojure.string.replace(clojure.string.trim(k),/^[:_]+/,""));
} else {
return k;
}
});
logseq.api.install_plugin_hook = (function logseq$api$install_plugin_hook(pid,hook,opts){
return frontend.state.install_plugin_hook.cljs$core$IFn$_invoke$arity$3(pid,hook,cljs_bean.core.__GT_clj(opts));
});
goog.exportSymbol('logseq.api.install_plugin_hook', logseq.api.install_plugin_hook);
logseq.api.uninstall_plugin_hook = (function logseq$api$uninstall_plugin_hook(pid,hook_or_all){
return frontend.state.uninstall_plugin_hook(pid,hook_or_all);
});
goog.exportSymbol('logseq.api.uninstall_plugin_hook', logseq.api.uninstall_plugin_hook);
logseq.api.should_exec_plugin_hook = (function logseq$api$should_exec_plugin_hook(pid,hook){
return frontend.handler.plugin.plugin_hook_installed_QMARK_(pid,hook);
});
goog.exportSymbol('logseq.api.should_exec_plugin_hook', logseq.api.should_exec_plugin_hook);
logseq.api.get_state_from_store = (function logseq$api$get_state_from_store(path){
var temp__5804__auto__ = ((typeof path === 'string')?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [path], null):cljs_bean.core.__GT_clj(path));
if(cljs.core.truth_(temp__5804__auto__)){
var path__$1 = temp__5804__auto__;
var G__131683 = path__$1;
var G__131683__$1 = (((G__131683 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131681_SHARP_){
if(clojure.string.starts_with_QMARK_(p1__131681_SHARP_,"@")){
return cljs.core.subs.cljs$core$IFn$_invoke$arity$2(p1__131681_SHARP_,(1));
} else {
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(p1__131681_SHARP_);
}
}),G__131683));
var G__131683__$2 = (((G__131683__$1 == null))?null:cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),G__131683__$1));
var G__131683__$3 = (((G__131683__$2 == null))?null:(function (p1__131682_SHARP_){
if(frontend.util.atom_QMARK_(p1__131682_SHARP_)){
return cljs.core.deref(p1__131682_SHARP_);
} else {
return p1__131682_SHARP_;
}
})(G__131683__$2));
var G__131683__$4 = (((G__131683__$3 == null))?null:logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(G__131683__$3));
if((G__131683__$4 == null)){
return null;
} else {
return cljs_bean.core.__GT_js(G__131683__$4);
}
} else {
return null;
}
});
goog.exportSymbol('logseq.api.get_state_from_store', logseq.api.get_state_from_store);
logseq.api.set_state_from_store = (function logseq$api$set_state_from_store(path,value){
var temp__5804__auto__ = ((typeof path === 'string')?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [path], null):cljs_bean.core.__GT_clj(path));
if(cljs.core.truth_(temp__5804__auto__)){
var path__$1 = temp__5804__auto__;
var G__131686 = path__$1;
var G__131686__$1 = (((G__131686 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131684_SHARP_){
if(clojure.string.starts_with_QMARK_(p1__131684_SHARP_,"@")){
return cljs.core.subs.cljs$core$IFn$_invoke$arity$2(p1__131684_SHARP_,(1));
} else {
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(p1__131684_SHARP_);
}
}),G__131686));
var G__131686__$2 = (((G__131686__$1 == null))?null:cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,G__131686__$1));
if((G__131686__$2 == null)){
return null;
} else {
return (function (p1__131685_SHARP_){
return frontend.state.set_state_BANG_(p1__131685_SHARP_,cljs_bean.core.__GT_clj(value));
})(G__131686__$2);
}
} else {
return null;
}
});
goog.exportSymbol('logseq.api.set_state_from_store', logseq.api.set_state_from_store);
logseq.api.get_app_info = (function logseq$api$get_app_info(){
return cljs_bean.core.__GT_js(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"version","version",425292698),frontend.version.version,new cljs.core.Keyword(null,"supportDb","supportDb",-1562326338),true], null)));
});
goog.exportSymbol('logseq.api.get_app_info', logseq.api.get_app_info);
logseq.api.get_user_configs = (function logseq$api$get_user_configs(){
return cljs_bean.core.__GT_js(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"current-graph","current-graph",1546435330),new cljs.core.Keyword(null,"preferred-start-of-week","preferred-start-of-week",-662727035),new cljs.core.Keyword(null,"preferred-theme-mode","preferred-theme-mode",959815621),new cljs.core.Keyword(null,"enabled-journals","enabled-journals",-914705497),new cljs.core.Keyword(null,"preferred-workflow","preferred-workflow",-1794663444),new cljs.core.Keyword(null,"preferred-todo","preferred-todo",595464434),new cljs.core.Keyword(null,"preferred-language","preferred-language",-1247855017),new cljs.core.Keyword(null,"enabled-flashcards","enabled-flashcards",2032664407),new cljs.core.Keyword(null,"preferred-date-format","preferred-date-format",459860922),new cljs.core.Keyword(null,"me","me",-139006693),new cljs.core.Keyword(null,"show-brackets","show-brackets",-860247746),new cljs.core.Keyword(null,"preferred-format","preferred-format",-1784393121)],[frontend.state.get_current_repo(),frontend.state.get_start_of_week(),new cljs.core.Keyword("ui","theme","ui/theme",-1247877132).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),frontend.state.enable_journals_QMARK_.cljs$core$IFn$_invoke$arity$0(),frontend.state.get_preferred_workflow(),frontend.state.get_preferred_todo(),new cljs.core.Keyword(null,"preferred-language","preferred-language",-1247855017).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),frontend.state.enable_flashcards_QMARK_.cljs$core$IFn$_invoke$arity$0(),frontend.state.get_date_formatter(),frontend.state.get_me(),frontend.state.show_brackets_QMARK_(),frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0()])));
});
goog.exportSymbol('logseq.api.get_user_configs', logseq.api.get_user_configs);
/**
 * @param {...*} var_args
 */
logseq.api.get_current_graph_configs = (function() { 
var logseq$api$get_current_graph_configs__delegate = function (keys){
var G__131688 = frontend.state.get_config.cljs$core$IFn$_invoke$arity$0();
var G__131688__$1 = (((G__131688 == null))?null:(function (p1__131687_SHARP_){
if(cljs.core.seq(keys)){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(p1__131687_SHARP_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword,keys));
} else {
return p1__131687_SHARP_;
}
})(G__131688));
if((G__131688__$1 == null)){
return null;
} else {
return cljs_bean.core.__GT_js(G__131688__$1);
}
};
var logseq$api$get_current_graph_configs = function (var_args){
var keys = null;
if (arguments.length > 0) {
var G__131822__i = 0, G__131822__a = new Array(arguments.length -  0);
while (G__131822__i < G__131822__a.length) {G__131822__a[G__131822__i] = arguments[G__131822__i + 0]; ++G__131822__i;}
  keys = new cljs.core.IndexedSeq(G__131822__a,0,null);
} 
return logseq$api$get_current_graph_configs__delegate.call(this,keys);};
logseq$api$get_current_graph_configs.cljs$lang$maxFixedArity = 0;
logseq$api$get_current_graph_configs.cljs$lang$applyTo = (function (arglist__131823){
var keys = cljs.core.seq(arglist__131823);
return logseq$api$get_current_graph_configs__delegate(keys);
});
logseq$api$get_current_graph_configs.cljs$core$IFn$_invoke$arity$variadic = logseq$api$get_current_graph_configs__delegate;
return logseq$api$get_current_graph_configs;
})()
;
goog.exportSymbol('logseq.api.get_current_graph_configs', logseq.api.get_current_graph_configs);
logseq.api.set_current_graph_configs = (function logseq$api$set_current_graph_configs(configs){
var temp__5804__auto__ = cljs_bean.core.__GT_clj(configs);
if(cljs.core.truth_(temp__5804__auto__)){
var configs__$1 = temp__5804__auto__;
if(cljs.core.map_QMARK_(configs__$1)){
var seq__131689 = cljs.core.seq(configs__$1);
var chunk__131690 = null;
var count__131691 = (0);
var i__131692 = (0);
while(true){
if((i__131692 < count__131691)){
var vec__131699 = chunk__131690.cljs$core$IIndexed$_nth$arity$2(null,i__131692);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131699,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131699,(1),null);
frontend.handler.config.set_config_BANG_(k,v);


var G__131824 = seq__131689;
var G__131825 = chunk__131690;
var G__131826 = count__131691;
var G__131827 = (i__131692 + (1));
seq__131689 = G__131824;
chunk__131690 = G__131825;
count__131691 = G__131826;
i__131692 = G__131827;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__131689);
if(temp__5804__auto____$1){
var seq__131689__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__131689__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__131689__$1);
var G__131828 = cljs.core.chunk_rest(seq__131689__$1);
var G__131829 = c__5525__auto__;
var G__131830 = cljs.core.count(c__5525__auto__);
var G__131831 = (0);
seq__131689 = G__131828;
chunk__131690 = G__131829;
count__131691 = G__131830;
i__131692 = G__131831;
continue;
} else {
var vec__131702 = cljs.core.first(seq__131689__$1);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131702,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131702,(1),null);
frontend.handler.config.set_config_BANG_(k,v);


var G__131832 = cljs.core.next(seq__131689__$1);
var G__131833 = null;
var G__131834 = (0);
var G__131835 = (0);
seq__131689 = G__131832;
chunk__131690 = G__131833;
count__131691 = G__131834;
i__131692 = G__131835;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return null;
}
} else {
return null;
}
});
goog.exportSymbol('logseq.api.set_current_graph_configs', logseq.api.set_current_graph_configs);
logseq.api.get_current_graph_favorites = (function logseq$api$get_current_graph_favorites(){
if(cljs.core.truth_(logseq.api.db_graph_QMARK_())){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.page.get_favorites(),(function (p1__131705_SHARP_){
return cljs_bean.core.__GT_js(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(p1__131705_SHARP_));
}));
} else {
var G__131706 = new cljs.core.Keyword(null,"favorites","favorites",1740773480).cljs$core$IFn$_invoke$arity$1(frontend.state.get_config.cljs$core$IFn$_invoke$arity$0());
var G__131706__$1 = (((G__131706 == null))?null:cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,G__131706));
var G__131706__$2 = (((G__131706__$1 == null))?null:cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.string_QMARK_,G__131706__$1));
if((G__131706__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_js(G__131706__$2);
}
}
});
goog.exportSymbol('logseq.api.get_current_graph_favorites', logseq.api.get_current_graph_favorites);
logseq.api.get_current_graph_recent = (function logseq$api$get_current_graph_recent(){
var G__131708 = frontend.handler.recent.get_recent_pages();
var G__131708__$1 = (((G__131708 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131707_SHARP_){
return frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__131707_SHARP_));
}),G__131708));
var G__131708__$2 = (((G__131708__$1 == null))?null:cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,G__131708__$1));
var G__131708__$3 = (((G__131708__$2 == null))?null:logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(G__131708__$2));
if((G__131708__$3 == null)){
return null;
} else {
return cljs_bean.core.__GT_js(G__131708__$3);
}
});
goog.exportSymbol('logseq.api.get_current_graph_recent', logseq.api.get_current_graph_recent);
logseq.api.get_current_graph_templates = (function logseq$api$get_current_graph_templates(){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_all_templates(repo)),(function (templates){
return promesa.protocols._promise((function (){var G__131709 = templates;
var G__131709__$1 = (((G__131709 == null))?null:logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(G__131709));
if((G__131709__$1 == null)){
return null;
} else {
return cljs_bean.core.__GT_js(G__131709__$1);
}
})());
}));
}));
} else {
return null;
}
});
goog.exportSymbol('logseq.api.get_current_graph_templates', logseq.api.get_current_graph_templates);
logseq.api.get_current_graph = (function logseq$api$get_current_graph(){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.config.demo_repo,repo)){
return null;
} else {
return cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"url","url",276297046),repo,new cljs.core.Keyword(null,"name","name",1843675177),(frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(repo) : frontend.util.node_path.basename.call(null,repo)),new cljs.core.Keyword(null,"path","path",-188191168),frontend.config.get_repo_dir(repo)], null));
}
} else {
return null;
}
});
goog.exportSymbol('logseq.api.get_current_graph', logseq.api.get_current_graph);
logseq.api.check_current_is_db_graph = logseq.api.db_graph_QMARK_;
goog.exportSymbol('logseq.api.check_current_is_db_graph', logseq.api.check_current_is_db_graph);
logseq.api.show_themes = (function logseq$api$show_themes(){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("modal","show-themes-modal","modal/show-themes-modal",238725999)], null));
});
goog.exportSymbol('logseq.api.show_themes', logseq.api.show_themes);
logseq.api.set_theme_mode = (function logseq$api$set_theme_mode(mode){
return frontend.state.set_theme_mode_BANG_(mode);
});
goog.exportSymbol('logseq.api.set_theme_mode', logseq.api.set_theme_mode);
logseq.api.load_plugin_config = (function logseq$api$load_plugin_config(path){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2(null,(frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(path,"package.json") : frontend.util.node_path.join.call(null,path,"package.json")));
} else {
return console.log("TODO: load plugin package.json from web plugin.");
}
});
goog.exportSymbol('logseq.api.load_plugin_config', logseq.api.load_plugin_config);
logseq.api.load_plugin_readme = (function logseq$api$load_plugin_readme(path){
return frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2(null,(frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(path,"readme.md") : frontend.util.node_path.join.call(null,path,"readme.md")));
});
goog.exportSymbol('logseq.api.load_plugin_readme', logseq.api.load_plugin_readme);
logseq.api.save_plugin_package_json = (function logseq$api$save_plugin_package_json(path,data){
var repo = "";
var path__$1 = (frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(path,"package.json") : frontend.util.node_path.join.call(null,path,"package.json"));
return frontend.fs.write_plain_text_file_BANG_(repo,null,path__$1,JSON.stringify(data,null,(2)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null));
});
goog.exportSymbol('logseq.api.save_plugin_package_json', logseq.api.save_plugin_package_json);
logseq.api.save_focused_code_editor_content = (function logseq$api$save_focused_code_editor_content(){
return frontend.handler.code.save_code_editor_BANG_();
});
goog.exportSymbol('logseq.api.save_focused_code_editor_content', logseq.api.save_focused_code_editor_content);
logseq.api.write_rootdir_file = (function logseq$api$write_rootdir_file(file,content,sub_root,root_dir){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(""),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(root_dir,sub_root) : frontend.util.node_path.join.call(null,root_dir,sub_root))),(function (path){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(path,"")),(function (exist_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(exist_QMARK_)?null:frontend.fs.mkdir_recur_BANG_(path))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(path,file) : frontend.util.node_path.join.call(null,path,file))),(function (user_path){
return promesa.protocols._mcat(promesa.protocols._promise(clojure.string.starts_with_QMARK_(user_path,path)),(function (sub_dir_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(sub_dir_QMARK_)?null:(function (){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("logseq.api",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"debug","debug",-1608172596),user_path,new cljs.core.Keyword(null,"line","line",212345235),241], null)),null);

throw (new Error("write file denied"));
})()
)),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.node_path.dirname.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.dirname.cljs$core$IFn$_invoke$arity$1(user_path) : frontend.util.node_path.dirname.call(null,user_path))),(function (user_path_root){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(user_path_root,"")),(function (exist_QMARK___$1){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(exist_QMARK___$1)?null:frontend.fs.mkdir_recur_BANG_(user_path_root))),(function (___$2){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.write_plain_text_file_BANG_(repo,null,user_path,content,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null))),(function (___$3){
return promesa.protocols._promise(user_path);
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
});
logseq.api.write_dotdir_file = (function logseq$api$write_dotdir_file(file,content,sub_root){
var G__131711 = frontend.handler.plugin.get_ls_dotdir_root();
if((G__131711 == null)){
return null;
} else {
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(G__131711,(function (p1__131710_SHARP_){
return logseq.api.write_rootdir_file(file,content,sub_root,p1__131710_SHARP_);
}));
}
});
goog.exportSymbol('logseq.api.write_dotdir_file', logseq.api.write_dotdir_file);
logseq.api.write_assetsdir_file = (function logseq$api$write_assetsdir_file(file,content,sub_root){
var temp__5802__auto__ = frontend.config.get_current_repo_assets_root();
if(cljs.core.truth_(temp__5802__auto__)){
var assets_dir = temp__5802__auto__;
return logseq.api.write_rootdir_file(file,content,sub_root,assets_dir);
} else {
return false;
}
});
goog.exportSymbol('logseq.api.write_assetsdir_file', logseq.api.write_assetsdir_file);
logseq.api.read_rootdir_file = (function logseq$api$read_rootdir_file(file,sub_root,root_dir){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(root_dir,sub_root) : frontend.util.node_path.join.call(null,root_dir,sub_root))),(function (path){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(path,file) : frontend.util.node_path.join.call(null,path,file))),(function (user_path){
return promesa.protocols._mcat(promesa.protocols._promise(clojure.string.starts_with_QMARK_(user_path,path)),(function (sub_dir_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(sub_dir_QMARK_)?null:(function (){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("logseq.api",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"debug","debug",-1608172596),user_path,new cljs.core.Keyword(null,"line","line",212345235),265], null)),null);

throw (new Error("read file denied"));
})()
)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2("",user_path)),(function (exist_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(exist_QMARK_)?null:(function (){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("logseq.api",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"debug","debug",-1608172596),user_path,new cljs.core.Keyword(null,"line","line",212345235),267], null)),null);

throw (new Error("file not existed"));
})()
)),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2("",user_path)),(function (content){
return promesa.protocols._promise(content);
}));
}));
}));
}));
}));
}));
}));
}));
});
logseq.api.read_dotdir_file = (function logseq$api$read_dotdir_file(file,sub_root){
var G__131713 = frontend.handler.plugin.get_ls_dotdir_root();
if((G__131713 == null)){
return null;
} else {
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(G__131713,(function (p1__131712_SHARP_){
return logseq.api.read_rootdir_file(file,sub_root,p1__131712_SHARP_);
}));
}
});
logseq.api.read_assetsdir_file = (function logseq$api$read_assetsdir_file(file,sub_root){
var temp__5804__auto__ = frontend.config.get_current_repo_assets_root();
if(cljs.core.truth_(temp__5804__auto__)){
var root_dir = temp__5804__auto__;
return logseq.api.read_rootdir_file(file,sub_root,root_dir);
} else {
return null;
}
});
logseq.api.unlink_rootdir_file_BANG_ = (function logseq$api$unlink_rootdir_file_BANG_(file,sub_root,root_dir){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(""),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(root_dir,sub_root) : frontend.util.node_path.join.call(null,root_dir,sub_root))),(function (path){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(path,file) : frontend.util.node_path.join.call(null,path,file))),(function (user_path){
return promesa.protocols._mcat(promesa.protocols._promise(clojure.string.starts_with_QMARK_(user_path,path)),(function (sub_dir_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(sub_dir_QMARK_)?null:(function (){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("logseq.api",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"debug","debug",-1608172596),user_path,new cljs.core.Keyword(null,"line","line",212345235),287], null)),null);

throw (new Error("access file denied"));
})()
)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2("",user_path)),(function (exist_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(exist_QMARK_)?null:(function (){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("logseq.api",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"debug","debug",-1608172596),user_path,new cljs.core.Keyword(null,"line","line",212345235),289], null)),null);

throw (new Error("file not existed"));
})()
)),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.unlink_BANG_(repo,user_path,cljs.core.PersistentArrayMap.EMPTY)),(function (___$2){
return promesa.impl.resolved(null);
}));
}));
}));
}));
}));
}));
}));
}));
}));
});
logseq.api.unlink_dotdir_file_BANG_ = (function logseq$api$unlink_dotdir_file_BANG_(file,sub_root){
var G__131715 = frontend.handler.plugin.get_ls_dotdir_root();
if((G__131715 == null)){
return null;
} else {
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(G__131715,(function (p1__131714_SHARP_){
return logseq.api.unlink_rootdir_file_BANG_(file,sub_root,p1__131714_SHARP_);
}));
}
});
logseq.api.unlink_assetsdir_file_BANG_ = (function logseq$api$unlink_assetsdir_file_BANG_(file,sub_root){
var temp__5804__auto__ = frontend.config.get_current_repo_assets_root();
if(cljs.core.truth_(temp__5804__auto__)){
var root_dir = temp__5804__auto__;
return logseq.api.unlink_rootdir_file_BANG_(file,sub_root,root_dir);
} else {
return null;
}
});
logseq.api.write_user_tmp_file = (function logseq$api$write_user_tmp_file(file,content){
return logseq.api.write_dotdir_file(file,content,"tmp");
});
goog.exportSymbol('logseq.api.write_user_tmp_file', logseq.api.write_user_tmp_file);
logseq.api.write_plugin_storage_file = (function logseq$api$write_plugin_storage_file(plugin_id,file,content,assets_QMARK_){
var plugin_id__$1 = (frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(plugin_id) : frontend.util.node_path.basename.call(null,plugin_id));
var sub_root = (frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2("storages",plugin_id__$1) : frontend.util.node_path.join.call(null,"storages",plugin_id__$1));
if(assets_QMARK_ === true){
return logseq.api.write_assetsdir_file(file,content,sub_root);
} else {
return logseq.api.write_dotdir_file(file,content,sub_root);
}
});
goog.exportSymbol('logseq.api.write_plugin_storage_file', logseq.api.write_plugin_storage_file);
logseq.api.read_plugin_storage_file = (function logseq$api$read_plugin_storage_file(plugin_id,file,assets_QMARK_){
var plugin_id__$1 = (frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(plugin_id) : frontend.util.node_path.basename.call(null,plugin_id));
var sub_root = (frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2("storages",plugin_id__$1) : frontend.util.node_path.join.call(null,"storages",plugin_id__$1));
if(assets_QMARK_ === true){
return logseq.api.read_assetsdir_file(file,sub_root);
} else {
return logseq.api.read_dotdir_file(file,sub_root);
}
});
goog.exportSymbol('logseq.api.read_plugin_storage_file', logseq.api.read_plugin_storage_file);
logseq.api.unlink_plugin_storage_file = (function logseq$api$unlink_plugin_storage_file(plugin_id,file,assets_QMARK_){
var plugin_id__$1 = (frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(plugin_id) : frontend.util.node_path.basename.call(null,plugin_id));
var sub_root = (frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2("storages",plugin_id__$1) : frontend.util.node_path.join.call(null,"storages",plugin_id__$1));
if(assets_QMARK_ === true){
return logseq.api.unlink_assetsdir_file_BANG_(file,sub_root);
} else {
return logseq.api.unlink_dotdir_file_BANG_(file,sub_root);
}
});
goog.exportSymbol('logseq.api.unlink_plugin_storage_file', logseq.api.unlink_plugin_storage_file);
logseq.api.exist_plugin_storage_file = (function logseq$api$exist_plugin_storage_file(plugin_id,file,assets_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((assets_QMARK_ === true)?frontend.config.get_current_repo_assets_root():frontend.handler.plugin.get_ls_dotdir_root())),(function (root){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(plugin_id) : frontend.util.node_path.basename.call(null,plugin_id))),(function (plugin_id__$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2((frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$3 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$3(root,"storages",plugin_id__$1) : frontend.util.node_path.join.call(null,root,"storages",plugin_id__$1)),file)),(function (exist_QMARK_){
return promesa.protocols._promise(exist_QMARK_);
}));
}));
}));
}));
});
goog.exportSymbol('logseq.api.exist_plugin_storage_file', logseq.api.exist_plugin_storage_file);
logseq.api.clear_plugin_storage_files = (function logseq$api$clear_plugin_storage_files(plugin_id,assets_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((assets_QMARK_ === true)?frontend.config.get_current_repo_assets_root():frontend.handler.plugin.get_ls_dotdir_root())),(function (root){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(plugin_id) : frontend.util.node_path.basename.call(null,plugin_id))),(function (plugin_id__$1){
return promesa.protocols._promise(frontend.fs.rmdir_BANG_((frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$3 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$3(root,"storages",plugin_id__$1) : frontend.util.node_path.join.call(null,root,"storages",plugin_id__$1))));
}));
}));
}));
});
goog.exportSymbol('logseq.api.clear_plugin_storage_files', logseq.api.clear_plugin_storage_files);
logseq.api.list_plugin_storage_files = (function logseq$api$list_plugin_storage_files(plugin_id,assets_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((assets_QMARK_ === true)?frontend.config.get_current_repo_assets_root():frontend.handler.plugin.get_ls_dotdir_root())),(function (root){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1 ? frontend.util.node_path.basename.cljs$core$IFn$_invoke$arity$1(plugin_id) : frontend.util.node_path.basename.call(null,plugin_id))),(function (plugin_id__$1){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$3 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$3(root,"storages",plugin_id__$1) : frontend.util.node_path.join.call(null,root,"storages",plugin_id__$1))),(function (files_path){
return promesa.protocols._mcat(promesa.protocols._promise(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"listdir","listdir",-609252713),files_path], 0))),(function (files){
return promesa.protocols._promise(((cljs.core.js_iterable_QMARK_(files))?cljs_bean.core.__GT_js(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131716_SHARP_){
var G__131717 = clojure.string.replace_first(p1__131716_SHARP_,files_path,"");
if((G__131717 == null)){
return null;
} else {
return clojure.string.replace(G__131717,/^\/+/,"");
}
}),files)):null));
}));
}));
}));
}));
}));
});
goog.exportSymbol('logseq.api.list_plugin_storage_files', logseq.api.list_plugin_storage_files);
logseq.api.load_user_preferences = (function logseq$api$load_user_preferences(){
var repo = "";
var path = frontend.handler.plugin.get_ls_dotdir_root();
var path__$1 = (frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(path,"preferences.json") : frontend.util.node_path.join.call(null,path,"preferences.json"));
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.create_if_not_exists.cljs$core$IFn$_invoke$arity$3(repo,null,path__$1)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2(null,path__$1)),(function (json){
return promesa.protocols._mcat(promesa.protocols._promise(((clojure.string.blank_QMARK_(json))?"{}":json)),(function (json__$1){
return promesa.protocols._promise(JSON.parse(json__$1));
}));
}));
}));
}));
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.idb.get_item(path__$1)),(function (json){
return promesa.protocols._promise((function (){var or__5002__auto__ = json;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ({});
}
})());
}));
}));
}
});
goog.exportSymbol('logseq.api.load_user_preferences', logseq.api.load_user_preferences);
logseq.api.save_user_preferences = (function logseq$api$save_user_preferences(data){
if(cljs.core.truth_(data)){
var repo = "";
var path = frontend.handler.plugin.get_ls_dotdir_root();
var path__$1 = (frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(path,"preferences.json") : frontend.util.node_path.join.call(null,path,"preferences.json"));
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return frontend.fs.write_plain_text_file_BANG_(repo,null,path__$1,JSON.stringify(data,null,(2)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"skip-compare?","skip-compare?",82692960),true], null));
} else {
return frontend.idb.set_item_BANG_(path__$1,data);
}
} else {
return null;
}
});
goog.exportSymbol('logseq.api.save_user_preferences', logseq.api.save_user_preferences);
logseq.api.load_plugin_user_settings = frontend.handler.plugin.make_fn_to_load_dotdir_json("settings",({}));
goog.exportSymbol('logseq.api.load_plugin_user_settings', logseq.api.load_plugin_user_settings);
logseq.api.save_plugin_user_settings = (function logseq$api$save_plugin_user_settings(key,data){
return frontend.handler.plugin.make_fn_to_save_dotdir_json("settings")(key,data);
});
goog.exportSymbol('logseq.api.save_plugin_user_settings', logseq.api.save_plugin_user_settings);
logseq.api.load_installed_web_plugins = (function logseq$api$load_installed_web_plugins(){
var getter = frontend.handler.plugin.make_fn_to_load_dotdir_json("installed-plugins-for-web",({}));
var G__131718 = getter(new cljs.core.Keyword(null,"all","all",892129742));
if((G__131718 == null)){
return null;
} else {
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(G__131718,cljs.core.second);
}
});
goog.exportSymbol('logseq.api.load_installed_web_plugins', logseq.api.load_installed_web_plugins);
logseq.api.save_installed_web_plugin = (function logseq$api$save_installed_web_plugin(var_args){
var G__131720 = arguments.length;
switch (G__131720) {
case 1:
return logseq.api.save_installed_web_plugin.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return logseq.api.save_installed_web_plugin.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});
goog.exportSymbol('logseq.api.save_installed_web_plugin', logseq.api.save_installed_web_plugin);

(logseq.api.save_installed_web_plugin.cljs$core$IFn$_invoke$arity$1 = (function (plugin){
return logseq.api.save_installed_web_plugin.cljs$core$IFn$_invoke$arity$2(plugin,false);
}));

(logseq.api.save_installed_web_plugin.cljs$core$IFn$_invoke$arity$2 = (function (plugin,remove_QMARK_){
var temp__5804__auto__ = (function (){var G__131721 = plugin;
var G__131721__$1 = (((G__131721 == null))?null:G__131721.key);
if((G__131721__$1 == null)){
return null;
} else {
return cljs.core.name(G__131721__$1);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
var setter = frontend.handler.plugin.make_fn_to_save_dotdir_json("installed-plugins-for-web");
var plugin__$1 = JSON.parse(JSON.stringify(plugin));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = logseq.api.load_installed_web_plugins();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ({});
}
})()),(function (plugins){
return promesa.protocols._mcat(promesa.protocols._promise(((remove_QMARK_ === true)?(cljs.core.truth_((plugins[id]))?delete plugins[id]:null):logseq.api.goog$module$goog$object.set(plugins,id,plugin__$1))),(function (___41611__auto__){
return promesa.protocols._promise(setter(new cljs.core.Keyword(null,"all","all",892129742),plugins));
}));
}));
}));
} else {
return null;
}
}));

(logseq.api.save_installed_web_plugin.cljs$lang$maxFixedArity = 2);

logseq.api.unlink_installed_web_plugin = (function logseq$api$unlink_installed_web_plugin(key){
return logseq.api.save_installed_web_plugin.cljs$core$IFn$_invoke$arity$2(({"key": key}),true);
});
goog.exportSymbol('logseq.api.unlink_installed_web_plugin', logseq.api.unlink_installed_web_plugin);
logseq.api.unlink_plugin_user_settings = frontend.handler.plugin.make_fn_to_unlink_dotdir_json("settings");
goog.exportSymbol('logseq.api.unlink_plugin_user_settings', logseq.api.unlink_plugin_user_settings);
logseq.api.register_plugin_slash_command = (function logseq$api$register_plugin_slash_command(pid,cmd_actions){
var temp__5804__auto__ = cljs_bean.core.__GT_clj(cmd_actions);
if(cljs.core.truth_(temp__5804__auto__)){
var vec__131723 = temp__5804__auto__;
var cmd = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131723,(0),null);
var actions = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131723,(1),null);
return frontend.handler.plugin.register_plugin_slash_command(pid,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cmd,cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__131722_SHARP_){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.first(p1__131722_SHARP_))], null),cljs.core.rest(p1__131722_SHARP_));
}),actions)], null));
} else {
return null;
}
});
goog.exportSymbol('logseq.api.register_plugin_slash_command', logseq.api.register_plugin_slash_command);
logseq.api.register_plugin_simple_command = (function logseq$api$register_plugin_simple_command(pid,cmd_action,palette_QMARK_){
var temp__5804__auto__ = cljs_bean.core.__GT_clj(cmd_action);
if(cljs.core.truth_(temp__5804__auto__)){
var vec__131726 = temp__5804__auto__;
var cmd = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131726,(0),null);
var action = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131726,(1),null);
var action__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(action,(0),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.first(action)));
var cmd__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cmd,new cljs.core.Keyword(null,"key","key",-1516042587),clojure.string.replace(clojure.string.replace(clojure.string.trim(new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(cmd)),":","-"),/^([0-9])/,"_$1"));
var key = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(cmd__$1);
var keybinding = new cljs.core.Keyword(null,"keybinding","keybinding",1090151579).cljs$core$IFn$_invoke$arity$1(cmd__$1);
var palette_cmd = frontend.handler.plugin.simple_cmd__GT_palette_cmd(pid,cmd__$1,action__$1);
var action_SINGLEQUOTE_ = (function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"exec-plugin-cmd","exec-plugin-cmd",1049730302),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"type","type",1174270348),cljs.core.type,new cljs.core.Keyword(null,"key","key",-1516042587),key,new cljs.core.Keyword(null,"pid","pid",1018387698),pid,new cljs.core.Keyword(null,"cmd","cmd",-302931143),cmd__$1,new cljs.core.Keyword(null,"action","action",-811238024),action__$1], null)], null));
});
frontend.handler.plugin.register_plugin_simple_command(pid,cmd__$1,action__$1);

if(cljs.core.truth_(palette_QMARK_)){
frontend.handler.command_palette.register(palette_cmd);
} else {
}

var temp__5804__auto____$1 = (function (){var and__5000__auto__ = keybinding;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.handler.plugin.simple_cmd_keybinding__GT_shortcut_args(pid,key,keybinding);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var shortcut_args = temp__5804__auto____$1;
var dispatch_cmd = (function (_e){
if(cljs.core.truth_(palette_QMARK_)){
return frontend.handler.command_palette.invoke_command(palette_cmd);
} else {
return action_SINGLEQUOTE_();
}
});
var vec__131729 = cljs.core.update.cljs$core$IFn$_invoke$arity$5(shortcut_args,(2),cljs.core.merge,cmd__$1,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"fn","fn",-1175266204),dispatch_cmd,new cljs.core.Keyword(null,"cmd","cmd",-302931143),palette_cmd], null));
var mode_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131729,(0),null);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131729,(1),null);
var shortcut_map = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131729,(2),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mode_id,new cljs.core.Keyword("shortcut.handler","block-editing-only","shortcut.handler/block-editing-only",794342449))){
return frontend.modules.shortcut.config.add_shortcut_BANG_.cljs$core$IFn$_invoke$arity$3(mode_id,id,shortcut_map);
} else {
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("shortcut","register-shortcut","shortcut/register-shortcut",-1487318401),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [mode_id,id,shortcut_map], null)], 0));

return frontend.modules.shortcut.core.register_shortcut_BANG_.cljs$core$IFn$_invoke$arity$3(mode_id,id,shortcut_map);

}
} else {
return null;
}
} else {
return null;
}
});
goog.exportSymbol('logseq.api.register_plugin_simple_command', logseq.api.register_plugin_simple_command);
logseq.api.unregister_plugin_simple_command = (function logseq$api$unregister_plugin_simple_command(pid){
frontend.handler.plugin.unregister_plugin_simple_command(pid);

var cmds_matched = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__131732_SHARP_){
return clojure.string.includes_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p1__131732_SHARP_)),["plugin.",cljs.core.str.cljs$core$IFn$_invoke$arity$1(pid)].join(''));
}),cljs.core.vals(cljs.core.deref(frontend.modules.shortcut.config._STAR_shortcut_cmds)));
if(cljs.core.seq(cmds_matched)){
var seq__131733 = cljs.core.seq(cmds_matched);
var chunk__131734 = null;
var count__131735 = (0);
var i__131736 = (0);
while(true){
if((i__131736 < count__131735)){
var cmd = chunk__131734.cljs$core$IIndexed$_nth$arity$2(null,i__131736);
frontend.handler.command_palette.unregister(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(cmd));

if(cljs.core.seq(new cljs.core.Keyword(null,"shortcut","shortcut",-431647697).cljs$core$IFn$_invoke$arity$1(cmd))){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("shortcut","unregister-shortcut","shortcut/unregister-shortcut",-1191227358),cmd], 0));

frontend.modules.shortcut.core.unregister_shortcut_BANG_(new cljs.core.Keyword(null,"handler-id","handler-id",1160395333).cljs$core$IFn$_invoke$arity$1(cmd),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(cmd));
} else {
}


var G__131837 = seq__131733;
var G__131838 = chunk__131734;
var G__131839 = count__131735;
var G__131840 = (i__131736 + (1));
seq__131733 = G__131837;
chunk__131734 = G__131838;
count__131735 = G__131839;
i__131736 = G__131840;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__131733);
if(temp__5804__auto__){
var seq__131733__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__131733__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__131733__$1);
var G__131841 = cljs.core.chunk_rest(seq__131733__$1);
var G__131842 = c__5525__auto__;
var G__131843 = cljs.core.count(c__5525__auto__);
var G__131844 = (0);
seq__131733 = G__131841;
chunk__131734 = G__131842;
count__131735 = G__131843;
i__131736 = G__131844;
continue;
} else {
var cmd = cljs.core.first(seq__131733__$1);
frontend.handler.command_palette.unregister(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(cmd));

if(cljs.core.seq(new cljs.core.Keyword(null,"shortcut","shortcut",-431647697).cljs$core$IFn$_invoke$arity$1(cmd))){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("shortcut","unregister-shortcut","shortcut/unregister-shortcut",-1191227358),cmd], 0));

frontend.modules.shortcut.core.unregister_shortcut_BANG_(new cljs.core.Keyword(null,"handler-id","handler-id",1160395333).cljs$core$IFn$_invoke$arity$1(cmd),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(cmd));
} else {
}


var G__131845 = cljs.core.next(seq__131733__$1);
var G__131846 = null;
var G__131847 = (0);
var G__131848 = (0);
seq__131733 = G__131845;
chunk__131734 = G__131846;
count__131735 = G__131847;
i__131736 = G__131848;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return null;
}
});
goog.exportSymbol('logseq.api.unregister_plugin_simple_command', logseq.api.unregister_plugin_simple_command);
logseq.api.register_search_service = (function logseq$api$register_search_service(pid,name,opts){
return frontend.handler.plugin.register_plugin_search_service(pid,name,cljs_bean.core.__GT_clj(opts));
});
goog.exportSymbol('logseq.api.register_search_service', logseq.api.register_search_service);
logseq.api.unregister_search_services = (function logseq$api$unregister_search_services(pid){
return frontend.handler.plugin.unregister_plugin_search_services(pid);
});
goog.exportSymbol('logseq.api.unregister_search_services', logseq.api.unregister_search_services);
logseq.api.register_plugin_ui_item = (function logseq$api$register_plugin_ui_item(pid,type,opts){
var temp__5804__auto__ = cljs_bean.core.__GT_clj(opts);
if(cljs.core.truth_(temp__5804__auto__)){
var opts__$1 = temp__5804__auto__;
return frontend.handler.plugin.register_plugin_ui_item(pid,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts__$1,new cljs.core.Keyword(null,"type","type",1174270348),type));
} else {
return null;
}
});
goog.exportSymbol('logseq.api.register_plugin_ui_item', logseq.api.register_plugin_ui_item);
logseq.api.relaunch = (function logseq$api$relaunch(){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["relaunchApp"], 0));
});
goog.exportSymbol('logseq.api.relaunch', logseq.api.relaunch);
logseq.api.quit = (function logseq$api$quit(){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["quitApp"], 0));
});
goog.exportSymbol('logseq.api.quit', logseq.api.quit);
logseq.api.open_external_link = (function logseq$api$open_external_link(url){
if(cljs.core.truth_(cljs.core.re_find(/https?:\/\//,url))){
return apis.openExternal(url);
} else {
return null;
}
});
goog.exportSymbol('logseq.api.open_external_link', logseq.api.open_external_link);
/**
 * @param {...*} var_args
 */
logseq.api.invoke_external_command = (function() { 
var logseq$api$invoke_external_command__delegate = function (type,args){
var temp__5804__auto__ = (function (){var and__5000__auto__ = clojure.string.starts_with_QMARK_(type,"logseq.");
if(and__5000__auto__){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(frontend.util.safe_lower_case(clojure.string.replace(type,/^logseq./,"")));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
var temp__5804__auto____$1 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.handler.command_palette.get_commands_unique(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [id,new cljs.core.Keyword(null,"action","action",-811238024)], null));
if(cljs.core.truth_(temp__5804__auto____$1)){
var action = temp__5804__auto____$1;
return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(frontend.handler.plugin.hook_lifecycle_fn_BANG_,id,action,args);
} else {
return null;
}
} else {
return null;
}
};
var logseq$api$invoke_external_command = function (type,var_args){
var args = null;
if (arguments.length > 1) {
var G__131849__i = 0, G__131849__a = new Array(arguments.length -  1);
while (G__131849__i < G__131849__a.length) {G__131849__a[G__131849__i] = arguments[G__131849__i + 1]; ++G__131849__i;}
  args = new cljs.core.IndexedSeq(G__131849__a,0,null);
} 
return logseq$api$invoke_external_command__delegate.call(this,type,args);};
logseq$api$invoke_external_command.cljs$lang$maxFixedArity = 1;
logseq$api$invoke_external_command.cljs$lang$applyTo = (function (arglist__131850){
var type = cljs.core.first(arglist__131850);
var args = cljs.core.rest(arglist__131850);
return logseq$api$invoke_external_command__delegate(type,args);
});
logseq$api$invoke_external_command.cljs$core$IFn$_invoke$arity$variadic = logseq$api$invoke_external_command__delegate;
return logseq$api$invoke_external_command;
})()
;
goog.exportSymbol('logseq.api.invoke_external_command', logseq.api.invoke_external_command);
logseq.api.set_left_sidebar_visible = (function logseq$api$set_left_sidebar_visible(flag){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(flag,"toggle")){
frontend.state.toggle_left_sidebar_BANG_();
} else {
frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","left-sidebar-open?","ui/left-sidebar-open?",899579728),cljs.core.boolean$(flag));
}

return null;
});
goog.exportSymbol('logseq.api.set_left_sidebar_visible', logseq.api.set_left_sidebar_visible);
logseq.api.set_right_sidebar_visible = (function logseq$api$set_right_sidebar_visible(flag){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(flag,"toggle")){
frontend.state.toggle_sidebar_open_QMARK__BANG_();
} else {
frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","sidebar-open?","ui/sidebar-open?",-1099744887),cljs.core.boolean$(flag));
}

return null;
});
goog.exportSymbol('logseq.api.set_right_sidebar_visible', logseq.api.set_right_sidebar_visible);
logseq.api.clear_right_sidebar_blocks = (function logseq$api$clear_right_sidebar_blocks(opts){
frontend.state.clear_sidebar_blocks_BANG_();

var temp__5804__auto___131851 = (function (){var and__5000__auto__ = opts;
if(cljs.core.truth_(and__5000__auto__)){
return cljs_bean.core.__GT_clj(opts);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto___131851)){
var opts_131852__$1 = temp__5804__auto___131851;
var and__5000__auto___131853 = new cljs.core.Keyword(null,"close","close",1835149582).cljs$core$IFn$_invoke$arity$1(opts_131852__$1);
if(cljs.core.truth_(and__5000__auto___131853)){
frontend.state.hide_right_sidebar_BANG_();
} else {
}
} else {
}

return null;
});
goog.exportSymbol('logseq.api.clear_right_sidebar_blocks', logseq.api.clear_right_sidebar_blocks);
logseq.api.push_state = (function logseq$api$push_state(k,params,query){
var k__$1 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(k);
var page_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k__$1,new cljs.core.Keyword(null,"page","page",849072397));
var params__$1 = cljs_bean.core.__GT_clj(params);
var query__$1 = cljs_bean.core.__GT_clj(query);
if(page_QMARK_){
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(params__$1),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"anchor","anchor",1549638489),new cljs.core.Keyword(null,"anchor","anchor",1549638489).cljs$core$IFn$_invoke$arity$1(query__$1),new cljs.core.Keyword(null,"push","push",799791267),true], null));
} else {
return reitit.frontend.easy.push_state.cljs$core$IFn$_invoke$arity$3(k__$1,params__$1,query__$1);
}
});
goog.exportSymbol('logseq.api.push_state', logseq.api.push_state);
logseq.api.replace_state = (function logseq$api$replace_state(k,params,query){
var k__$1 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(k);
var page_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k__$1,new cljs.core.Keyword(null,"page","page",849072397));
var params__$1 = cljs_bean.core.__GT_clj(params);
var query__$1 = cljs_bean.core.__GT_clj(query);
var temp__5802__auto__ = (function (){var and__5000__auto__ = page_QMARK_;
if(and__5000__auto__){
return new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(params__$1);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var page_name = temp__5802__auto__;
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$2(page_name,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"anchor","anchor",1549638489),new cljs.core.Keyword(null,"anchor","anchor",1549638489).cljs$core$IFn$_invoke$arity$1(query__$1),new cljs.core.Keyword(null,"push","push",799791267),false], null));
} else {
return reitit.frontend.easy.replace_state.cljs$core$IFn$_invoke$arity$3(k__$1,params__$1,query__$1);
}
});
goog.exportSymbol('logseq.api.replace_state', logseq.api.replace_state);
logseq.api.get_external_plugin = (function logseq$api$get_external_plugin(pid){
var temp__5804__auto__ = frontend.handler.plugin.get_plugin_inst(pid);
if(cljs.core.truth_(temp__5804__auto__)){
var pl = temp__5804__auto__;
return pl.toJSON();
} else {
return null;
}
});
goog.exportSymbol('logseq.api.get_external_plugin', logseq.api.get_external_plugin);
logseq.api.invoke_external_plugin_cmd = (function logseq$api$invoke_external_plugin_cmd(pid,cmd_group,cmd_key,cmd_args){
var G__131737 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cmd_group);
var G__131737__$1 = (((G__131737 instanceof cljs.core.Keyword))?G__131737.fqn:null);
switch (G__131737__$1) {
case "models":
return frontend.handler.plugin.call_plugin_user_model_BANG_(pid,cmd_key,cmd_args);

break;
case "commands":
return frontend.handler.plugin.call_plugin_user_command_BANG_(pid,cmd_key,cmd_args);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__131737__$1)].join('')));

}
});
goog.exportSymbol('logseq.api.invoke_external_plugin_cmd', logseq.api.invoke_external_plugin_cmd);
logseq.api.check_editing = (function logseq$api$check_editing(){
if(cljs.core.truth_(frontend.state.get_edit_input_id())){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block()));
} else {
return false;
}
});
goog.exportSymbol('logseq.api.check_editing', logseq.api.check_editing);
logseq.api.exit_editing_mode = (function logseq$api$exit_editing_mode(select_QMARK_){
frontend.handler.editor.escape_editing.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"select?","select?",-1012224063),select_QMARK_], null)], 0));

return null;
});
goog.exportSymbol('logseq.api.exit_editing_mode', logseq.api.exit_editing_mode);
logseq.api.insert_at_editing_cursor = (function logseq$api$insert_at_editing_cursor(content){
var temp__5804__auto__ = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto__)){
var input_id = temp__5804__auto__;
frontend.commands.simple_insert_BANG_(input_id,content,cljs.core.PersistentArrayMap.EMPTY);

var temp__5804__auto____$1 = goog.dom.getElement(input_id);
if(cljs.core.truth_(temp__5804__auto____$1)){
var input = temp__5804__auto____$1;
return input.focus();
} else {
return null;
}
} else {
return null;
}
});
goog.exportSymbol('logseq.api.insert_at_editing_cursor', logseq.api.insert_at_editing_cursor);
logseq.api.restore_editing_cursor = (function logseq$api$restore_editing_cursor(){
var temp__5804__auto__ = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto__)){
var input_id = temp__5804__auto__;
var temp__5804__auto____$1 = goog.dom.getElement(input_id);
if(cljs.core.truth_(temp__5804__auto____$1)){
var input = temp__5804__auto____$1;
if(cljs.core.truth_((frontend.util.el_visible_in_viewport_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.el_visible_in_viewport_QMARK_.cljs$core$IFn$_invoke$arity$1(input) : frontend.util.el_visible_in_viewport_QMARK_.call(null,input)))){
return input.focus();
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});
goog.exportSymbol('logseq.api.restore_editing_cursor', logseq.api.restore_editing_cursor);
logseq.api.get_editing_cursor_position = (function logseq$api$get_editing_cursor_position(){
var temp__5804__auto__ = frontend.state.get_edit_input_id();
if(cljs.core.truth_(temp__5804__auto__)){
var input_id = temp__5804__auto__;
return cljs_bean.core.__GT_js(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(frontend.util.cursor.get_caret_pos.cljs$core$IFn$_invoke$arity$1(goog.dom.getElement(input_id))));
} else {
return null;
}
});
goog.exportSymbol('logseq.api.get_editing_cursor_position', logseq.api.get_editing_cursor_position);
logseq.api.get_editing_block_content = (function logseq$api$get_editing_block_content(){
return frontend.state.get_edit_content();
});
goog.exportSymbol('logseq.api.get_editing_block_content', logseq.api.get_editing_block_content);
logseq.api.get_selected_blocks = (function logseq$api$get_selected_blocks(){
var temp__5804__auto__ = frontend.state.selection_QMARK_();
if(temp__5804__auto__){
var blocks = temp__5804__auto__;
var blocks__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (el){
var G__131738 = el.getAttribute("blockid");
var G__131738__$1 = (((G__131738 == null))?null:frontend.db.model.query_block_by_uuid(G__131738));
if((G__131738__$1 == null)){
return null;
} else {
return logseq.api.block.into_properties.cljs$core$IFn$_invoke$arity$1(G__131738__$1);
}
}),blocks);
return cljs_bean.core.__GT_js(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(blocks__$1));
} else {
return null;
}
});
goog.exportSymbol('logseq.api.get_selected_blocks', logseq.api.get_selected_blocks);
logseq.api.clear_selected_blocks = (function logseq$api$clear_selected_blocks(){
return frontend.state.clear_selection_BANG_();
});
goog.exportSymbol('logseq.api.clear_selected_blocks', logseq.api.clear_selected_blocks);
logseq.api.get_current_page = (function logseq$api$get_current_page(){
var temp__5804__auto__ = frontend.state.get_current_page();
if(cljs.core.truth_(temp__5804__auto__)){
var page = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api._LT_pull_block(page)),(function (page__$1){
return promesa.protocols._promise((function (){var temp__5804__auto____$1 = (function (){var and__5000__auto__ = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page__$1);
if(cljs.core.truth_(and__5000__auto__)){
var G__131739 = page__$1;
if((G__131739 == null)){
return null;
} else {
return logseq.api.block.into_properties.cljs$core$IFn$_invoke$arity$2(frontend.state.get_current_repo(),G__131739);
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var page__$2 = temp__5804__auto____$1;
return cljs_bean.core.__GT_js(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(page__$2));
} else {
return null;
}
})());
}));
}));
} else {
return null;
}
});
goog.exportSymbol('logseq.api.get_current_page', logseq.api.get_current_page);
logseq.api.get_page = (function logseq$api$get_page(id_or_page_name){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__131740 = frontend.state.get_current_repo();
var G__131741 = ((typeof id_or_page_name === 'number')?id_or_page_name:(cljs.core.truth_((frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(id_or_page_name) : frontend.util.uuid_string_QMARK_.call(null,id_or_page_name)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(id_or_page_name)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),(frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(id_or_page_name) : frontend.util.page_name_sanity_lc.call(null,id_or_page_name))], null)
));
return (frontend.db.async._LT_pull.cljs$core$IFn$_invoke$arity$2 ? frontend.db.async._LT_pull.cljs$core$IFn$_invoke$arity$2(G__131740,G__131741) : frontend.db.async._LT_pull.call(null,G__131740,G__131741));
})()),(function (page){
return promesa.protocols._promise((function (){var temp__5804__auto__ = (function (){var and__5000__auto__ = new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(and__5000__auto__)){
var G__131742 = page;
if((G__131742 == null)){
return null;
} else {
return logseq.api.block.into_properties.cljs$core$IFn$_invoke$arity$2(frontend.state.get_current_repo(),G__131742);
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var page__$1 = temp__5804__auto__;
return cljs_bean.core.__GT_js(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(page__$1));
} else {
return null;
}
})());
}));
}));
});
goog.exportSymbol('logseq.api.get_page', logseq.api.get_page);
logseq.api.get_all_pages = (function logseq$api$get_all_pages(){
var db = frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var G__131744 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (page){
return logseq.common.util.uuid_string_QMARK_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.hidden_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131743_SHARP_){
return frontend.db.utils.pull.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(p1__131743_SHARP_));
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","name","block/name",1619760316)))));
var G__131744__$1 = (((G__131744 == null))?null:logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(G__131744));
if((G__131744__$1 == null)){
return null;
} else {
return cljs_bean.core.__GT_js(G__131744__$1);
}
});
goog.exportSymbol('logseq.api.get_all_pages', logseq.api.get_all_pages);
logseq.api.create_page = (function logseq$api$create_page(name,properties,opts){
var properties__$1 = cljs_bean.core.__GT_clj(properties);
var db_base_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var map__131745 = cljs_bean.core.__GT_clj(opts);
var map__131745__$1 = cljs.core.__destructure_map(map__131745);
var redirect = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131745__$1,new cljs.core.Keyword(null,"redirect","redirect",-1975673286));
var format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131745__$1,new cljs.core.Keyword(null,"format","format",-1306924766));
var journal = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131745__$1,new cljs.core.Keyword(null,"journal","journal",1585898830));
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api._LT_pull_block(name)),(function (page){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(page)?null:(function (){var G__131746 = name;
var G__131747 = (function (){var G__131748 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),((cljs.core.boolean_QMARK_(redirect))?redirect:true),new cljs.core.Keyword(null,"journal?","journal?",-897756522),journal,new cljs.core.Keyword(null,"format","format",-1306924766),format], null);
if((!(db_base_QMARK_))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__131748,new cljs.core.Keyword(null,"properties","properties",685819552),properties__$1);
} else {
return G__131748;
}
})();
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__131746,G__131747) : frontend.handler.page._LT_create_BANG_.call(null,G__131746,G__131747));
})())),(function (new_page){
return promesa.protocols._mcat(promesa.protocols._promise(((((db_base_QMARK_) && (cljs.core.seq(properties__$1))))?logseq.api.block.save_db_based_block_properties_BANG_(new_page,properties__$1):null)),(function (_){
return promesa.protocols._promise((function (){var G__131749 = (function (){var or__5002__auto__ = page;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new_page;
}
})();
var G__131749__$1 = (((G__131749 == null))?null:new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(G__131749));
var G__131749__$2 = (((G__131749__$1 == null))?null:frontend.db.utils.pull.cljs$core$IFn$_invoke$arity$1(G__131749__$1));
var G__131749__$3 = (((G__131749__$2 == null))?null:logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(G__131749__$2));
if((G__131749__$3 == null)){
return null;
} else {
return cljs_bean.core.__GT_js(G__131749__$3);
}
})());
}));
}));
}));
}));
});
goog.exportSymbol('logseq.api.create_page', logseq.api.create_page);
logseq.api.create_journal_page = (function logseq$api$create_journal_page(date){
var date__$1 = (new Date(date));
var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core.not(isNaN(date__$1.getTime()));
if(and__5000__auto__){
return logseq.common.util.date_time.format((new goog.date.Date(date__$1)),"yyyy-MM-dd");
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var datestr = temp__5804__auto__;
return logseq.api.create_page(datestr,null,({"journal": true, "redirect": false}));
} else {
return null;
}
});
goog.exportSymbol('logseq.api.create_journal_page', logseq.api.create_journal_page);
logseq.api.delete_page = (function logseq$api$delete_page(name){
return (frontend.handler.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$2(name,null) : frontend.handler.page._LT_delete_BANG_.call(null,name,null));
});
goog.exportSymbol('logseq.api.delete_page', logseq.api.delete_page);
logseq.api.rename_page = frontend.handler.page.rename_BANG_;
goog.exportSymbol('logseq.api.rename_page', logseq.api.rename_page);
logseq.api.open_in_right_sidebar = (function logseq$api$open_in_right_sidebar(block_id_or_uuid){
return frontend.handler.editor.open_block_in_sidebar_BANG_(((typeof block_id_or_uuid === 'number')?block_id_or_uuid:logseq.sdk.utils.uuid_or_throw_error(block_id_or_uuid)));
});
goog.exportSymbol('logseq.api.open_in_right_sidebar', logseq.api.open_in_right_sidebar);
logseq.api.new_block_uuid = (function logseq$api$new_block_uuid(){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1((frontend.db.new_block_id.cljs$core$IFn$_invoke$arity$0 ? frontend.db.new_block_id.cljs$core$IFn$_invoke$arity$0() : frontend.db.new_block_id.call(null)));
});
goog.exportSymbol('logseq.api.new_block_uuid', logseq.api.new_block_uuid);
logseq.api.select_block = (function logseq$api$select_block(block_uuid){
var temp__5804__auto__ = frontend.db.model.get_block_by_uuid(logseq.sdk.utils.uuid_or_throw_error(block_uuid));
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
frontend.handler.editor.select_block_BANG_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block));

return null;
} else {
return null;
}
});
goog.exportSymbol('logseq.api.select_block', logseq.api.select_block);
logseq.api.edit_block = (function logseq$api$edit_block(block_uuid,opts){
var temp__5804__auto__ = (function (){var and__5000__auto__ = block_uuid;
if(cljs.core.truth_(and__5000__auto__)){
return logseq.sdk.utils.uuid_or_throw_error(block_uuid);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block_uuid__$1 = temp__5804__auto__;
var temp__5804__auto____$1 = frontend.db.model.query_block_by_uuid(block_uuid__$1);
if(cljs.core.truth_(temp__5804__auto____$1)){
var block = temp__5804__auto____$1;
var map__131750 = cljs_bean.core.__GT_clj(opts);
var map__131750__$1 = cljs.core.__destructure_map(map__131750);
var pos = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__131750__$1,new cljs.core.Keyword(null,"pos","pos",-864607220),new cljs.core.Keyword(null,"max","max",61366548));
var G__131751 = block;
var G__131752 = pos;
var G__131753 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"unknown-container","unknown-container",1739831473)], null);
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__131751,G__131752,G__131753) : frontend.handler.editor.edit_block_BANG_.call(null,G__131751,G__131752,G__131753));
} else {
return null;
}
} else {
return null;
}
});
goog.exportSymbol('logseq.api.edit_block', logseq.api.edit_block);
logseq.api._LT_ensure_page_loaded = (function logseq$api$_LT_ensure_page_loaded(block_uuid_or_page_name){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_current_repo()),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(repo,cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_uuid_or_page_name),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"children-props","children-props",919638355),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"*","*",345799209,null)], null),new cljs.core.Keyword(null,"nested-children?","nested-children?",1651323711),true], null)], 0))),(function (block){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var temp__5804__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block));
if(cljs.core.truth_(temp__5804__auto__)){
var page_id = temp__5804__auto__;
var temp__5804__auto____$1 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(page_id) : frontend.db.entity.call(null,page_id)));
if(cljs.core.truth_(temp__5804__auto____$1)){
var page_uuid = temp__5804__auto____$1;
return frontend.db.async._LT_get_block(repo,page_uuid);
} else {
return null;
}
} else {
return null;
}
})()),(function (_){
return promesa.protocols._promise(block);
}));
}));
}));
}));
});
logseq.api.insert_block = (function logseq$api$insert_block(block_uuid_or_page_name,content,opts){
if(clojure.string.blank_QMARK_(block_uuid_or_page_name)){
throw (new Error("Page title or block UUID shouldn't be empty."));
} else {
}

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__131754 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_uuid_or_page_name);
return (frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(G__131754) : frontend.util.uuid_string_QMARK_.call(null,G__131754));
})()),(function (block_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api._LT_pull_block(cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_uuid_or_page_name))),(function (block){
return promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = block_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(block);
} else {
return and__5000__auto__;
}
})())?(function(){throw (new Error("Block not exists"))})():promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(cljs_bean.core.__GT_clj(opts)),(function (p__131755){
var map__131756 = p__131755;
var map__131756__$1 = cljs.core.__destructure_map(map__131756);
var before = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131756__$1,new cljs.core.Keyword(null,"before","before",-1633692388));
var sibling = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131756__$1,new cljs.core.Keyword(null,"sibling","sibling",-1183865000));
var focus = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131756__$1,new cljs.core.Keyword(null,"focus","focus",234677911));
var customUUID = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131756__$1,new cljs.core.Keyword(null,"customUUID","customUUID",-1924598770));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131756__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var autoOrderedList = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131756__$1,new cljs.core.Keyword(null,"autoOrderedList","autoOrderedList",154272789));
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(block_uuid_or_page_name) : frontend.util.uuid_string_QMARK_.call(null,block_uuid_or_page_name)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,cljs.core.uuid(block_uuid_or_page_name)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_uuid_or_page_name,null], null))),(function (p__131757){
var vec__131758 = p__131757;
var page_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131758,(0),null);
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131758,(1),null);
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(page_name)?(frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1 ? frontend.util.page_name_sanity_lc.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.util.page_name_sanity_lc.call(null,page_name)):null)),(function (page_name__$1){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = page_name__$1;
if(cljs.core.truth_(and__5000__auto__)){
return (logseq.db.get_page((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),page_name__$1) == null);
} else {
return and__5000__auto__;
}
})())?(function (){var G__131761 = block_uuid_or_page_name;
var G__131762 = cljs.core.PersistentArrayMap.EMPTY;
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__131761,G__131762) : frontend.handler.page._LT_create_BANG_.call(null,G__131761,G__131762));
})():null)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = customUUID;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(properties);
}
})()),(function (custom_uuid){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(custom_uuid)?logseq.sdk.utils.uuid_or_throw_error(custom_uuid):null)),(function (custom_uuid__$1){
return promesa.protocols._mcat(promesa.protocols._promise((((focus == null))?true:focus)),(function (edit_block_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = custom_uuid__$1;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.db.model.query_block_by_uuid(custom_uuid__$1);
} else {
return and__5000__auto__;
}
})())?(function(){throw (new Error((frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("Custom block UUID already exists (%s).",custom_uuid__$1) : frontend.util.format.call(null,"Custom block UUID already exists (%s).",custom_uuid__$1))))})():null)),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(sibling);
if(and__5000__auto__){
var and__5000__auto____$1 = before;
if(cljs.core.truth_(and__5000__auto____$1)){
return block_uuid;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?(function (){var block__$1 = (function (){var G__131763 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__131763) : frontend.db.entity.call(null,G__131763));
})();
var first_child = logseq.db.get_first_child((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1));
if(cljs.core.truth_(first_child)){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(first_child);
} else {
return block_uuid;
}
})():block_uuid)),(function (block_uuid_SINGLEQUOTE_){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(block_uuid_SINGLEQUOTE_,block_uuid)),(function (insert_at_first_child_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(insert_at_first_child_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,true], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [sibling,before], null))),(function (p__131764){
var vec__131765 = p__131764;
var sibling_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131765,(0),null);
var before_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131765,(1),null);
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = sibling_QMARK_ === false;
if(and__5000__auto__){
var and__5000__auto____$1 = before_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(insert_at_first_child_QMARK_);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?false:before_QMARK_)),(function (before_QMARK___$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.api_insert_new_block_BANG_(content,new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid_SINGLEQUOTE_,new cljs.core.Keyword(null,"sibling?","sibling?",-1086129060),sibling_QMARK_,new cljs.core.Keyword(null,"before?","before?",765621039),before_QMARK___$1,new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),edit_block_QMARK_,new cljs.core.Keyword(null,"page","page",849072397),page_name__$1,new cljs.core.Keyword(null,"custom-uuid","custom-uuid",-1095135430),custom_uuid__$1,new cljs.core.Keyword(null,"ordered-list?","ordered-list?",-1717075082),((cljs.core.boolean_QMARK_(autoOrderedList))?autoOrderedList:false),new cljs.core.Keyword(null,"properties","properties",685819552),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties,(cljs.core.truth_(custom_uuid__$1)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),custom_uuid__$1], null):null)], 0))], null))),(function (new_block){
return promesa.protocols._promise(cljs_bean.core.__GT_js(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(new_block)));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}))));
}));
}));
}));
});
goog.exportSymbol('logseq.api.insert_block', logseq.api.insert_block);
logseq.api.insert_batch_block = (function logseq$api$insert_batch_block(block_uuid,batch_blocks,opts){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api._LT_ensure_page_loaded(block_uuid)),(function (block){
return promesa.protocols._promise((cljs.core.truth_(block)?(function (){var temp__5804__auto__ = cljs_bean.core.__GT_clj(batch_blocks);
if(cljs.core.truth_(temp__5804__auto__)){
var bb = temp__5804__auto__;
var bb__$1 = (((!(cljs.core.vector_QMARK_(bb))))?(new cljs.core.PersistentVector(null,1,(5),cljs.core.PersistentVector.EMPTY_NODE,[bb],null)):bb);
var map__131768 = cljs_bean.core.__GT_clj(opts);
var map__131768__$1 = cljs.core.__destructure_map(map__131768);
var sibling = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131768__$1,new cljs.core.Keyword(null,"sibling","sibling",-1183865000));
var keepUUID = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131768__$1,new cljs.core.Keyword(null,"keepUUID","keepUUID",-1526059320));
var before = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131768__$1,new cljs.core.Keyword(null,"before","before",-1633692388));
var keep_uuid_QMARK_ = (function (){var or__5002__auto__ = keepUUID;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return false;
}
})();
var _ = (cljs.core.truth_(keep_uuid_QMARK_)?(function (){var seq__131769 = cljs.core.seq(logseq.outliner.core.tree_vec_flatten.cljs$core$IFn$_invoke$arity$2(bb__$1,new cljs.core.Keyword(null,"children","children",-940561982)));
var chunk__131770 = null;
var count__131771 = (0);
var i__131772 = (0);
while(true){
if((i__131772 < count__131771)){
var block__$1 = chunk__131770.cljs$core$IIndexed$_nth$arity$2(null,i__131772);
var uuid_131855 = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"properties","properties",685819552).cljs$core$IFn$_invoke$arity$1(block__$1));
if(cljs.core.truth_((function (){var and__5000__auto__ = uuid_131855;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.db.model.query_block_by_uuid(logseq.sdk.utils.uuid_or_throw_error(uuid_131855));
} else {
return and__5000__auto__;
}
})())){
throw (new Error((frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("Custom block UUID already exists (%s).",uuid_131855) : frontend.util.format.call(null,"Custom block UUID already exists (%s).",uuid_131855))));
} else {
}


var G__131856 = seq__131769;
var G__131857 = chunk__131770;
var G__131858 = count__131771;
var G__131859 = (i__131772 + (1));
seq__131769 = G__131856;
chunk__131770 = G__131857;
count__131771 = G__131858;
i__131772 = G__131859;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__131769);
if(temp__5804__auto____$1){
var seq__131769__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__131769__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__131769__$1);
var G__131860 = cljs.core.chunk_rest(seq__131769__$1);
var G__131861 = c__5525__auto__;
var G__131862 = cljs.core.count(c__5525__auto__);
var G__131863 = (0);
seq__131769 = G__131860;
chunk__131770 = G__131861;
count__131771 = G__131862;
i__131772 = G__131863;
continue;
} else {
var block__$1 = cljs.core.first(seq__131769__$1);
var uuid_131864 = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"properties","properties",685819552).cljs$core$IFn$_invoke$arity$1(block__$1));
if(cljs.core.truth_((function (){var and__5000__auto__ = uuid_131864;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.db.model.query_block_by_uuid(logseq.sdk.utils.uuid_or_throw_error(uuid_131864));
} else {
return and__5000__auto__;
}
})())){
throw (new Error((frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("Custom block UUID already exists (%s).",uuid_131864) : frontend.util.format.call(null,"Custom block UUID already exists (%s).",uuid_131864))));
} else {
}


var G__131865 = cljs.core.next(seq__131769__$1);
var G__131866 = null;
var G__131867 = (0);
var G__131868 = (0);
seq__131769 = G__131865;
chunk__131770 = G__131866;
count__131771 = G__131867;
i__131772 = G__131868;
continue;
}
} else {
return null;
}
}
break;
}
})():null);
var block__$1 = (cljs.core.truth_(before)?(function (){var G__131773 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(logseq.db.get_left_sibling((function (){var G__131774 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__131774) : frontend.db.entity.call(null,G__131774));
})()));
return (frontend.db.pull.cljs$core$IFn$_invoke$arity$1 ? frontend.db.pull.cljs$core$IFn$_invoke$arity$1(G__131773) : frontend.db.pull.call(null,G__131773));
})():block);
var G__131775 = frontend.handler.editor.insert_block_tree_after_target(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),sibling,bb__$1,cljs.core.get.cljs$core$IFn$_invoke$arity$3(block__$1,new cljs.core.Keyword("block","format","block/format",-1212045901),new cljs.core.Keyword(null,"markdown","markdown",1227225089)),keep_uuid_QMARK_);
if((G__131775 == null)){
return null;
} else {
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(G__131775,(function (results){
var G__131776 = results;
var G__131776__$1 = (((G__131776 == null))?null:new cljs.core.Keyword(null,"blocks","blocks",-610462153).cljs$core$IFn$_invoke$arity$1(G__131776));
var G__131776__$2 = (((G__131776__$1 == null))?null:logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(G__131776__$1));
if((G__131776__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_js(G__131776__$2);
}
}));
}
} else {
return null;
}
})():null));
}));
}));
});
goog.exportSymbol('logseq.api.insert_batch_block', logseq.api.insert_batch_block);
logseq.api.remove_block = (function logseq$api$remove_block(block_uuid,_opts){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_current_repo()),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api._LT_pull_block(block_uuid)),(function (_){
return promesa.protocols._promise(frontend.handler.editor.delete_block_aux_BANG_(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.sdk.utils.uuid_or_throw_error(block_uuid),new cljs.core.Keyword(null,"repo","repo",-1999060679),repo], null)));
}));
}));
}));
});
goog.exportSymbol('logseq.api.remove_block', logseq.api.remove_block);
logseq.api.update_block = (function logseq$api$update_block(block_uuid,content,opts){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_current_repo()),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)),(function (db_base_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api._LT_pull_block(block_uuid)),(function (block){
return promesa.protocols._mcat(promesa.protocols._promise(cljs_bean.core.__GT_clj(opts)),(function (opts__$1){
return promesa.protocols._promise((cljs.core.truth_(block)?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = db_base_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (!((new cljs.core.Keyword(null,"properties","properties",685819552).cljs$core$IFn$_invoke$arity$1(opts__$1) == null)));
} else {
return and__5000__auto__;
}
})())?logseq.api.block.save_db_based_block_properties_BANG_(block,new cljs.core.Keyword(null,"properties","properties",685819552).cljs$core$IFn$_invoke$arity$1(opts__$1)):null)),(function (___41611__auto__){
return promesa.protocols._promise(frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$4(repo,logseq.sdk.utils.uuid_or_throw_error(block_uuid),content,(cljs.core.truth_(db_base_QMARK_)?cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(opts__$1,new cljs.core.Keyword(null,"properties","properties",685819552)):opts__$1)));
}));
})):null));
}));
}));
}));
}));
}));
});
goog.exportSymbol('logseq.api.update_block', logseq.api.update_block);
logseq.api.move_block = (function logseq$api$move_block(src_block_uuid,target_block_uuid,opts){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api._LT_pull_block(src_block_uuid)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api._LT_pull_block(target_block_uuid)),(function (___$1){
return promesa.protocols._promise((function (){var map__131777 = cljs_bean.core.__GT_clj(opts);
var map__131777__$1 = cljs.core.__destructure_map(map__131777);
var before = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131777__$1,new cljs.core.Keyword(null,"before","before",-1633692388));
var children = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131777__$1,new cljs.core.Keyword(null,"children","children",-940561982));
var move_to = ((cljs.core.boolean$(before))?new cljs.core.Keyword(null,"top","top",-1856271961):((cljs.core.boolean$(children))?new cljs.core.Keyword(null,"nested","nested",18943849):null
));
var src_block = frontend.db.model.query_block_by_uuid(logseq.sdk.utils.uuid_or_throw_error(src_block_uuid));
var target_block = frontend.db.model.query_block_by_uuid(logseq.sdk.utils.uuid_or_throw_error(target_block_uuid));
return frontend.handler.dnd.move_blocks(null,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [src_block], null),target_block,null,move_to);
})());
}));
}));
}));
});
goog.exportSymbol('logseq.api.move_block', logseq.api.move_block);
logseq.api.get_block = (function logseq$api$get_block(id,opts){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block(frontend.state.get_current_repo(),id)),(function (_){
return promesa.protocols._promise(logseq.api.block.get_block(id,(function (){var or__5002__auto__ = opts;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ({"includePage": true});
}
})()));
}));
}));
});
goog.exportSymbol('logseq.api.get_block', logseq.api.get_block);
logseq.api.get_current_block = (function logseq$api$get_current_block(opts){
var block = frontend.state.get_edit_block();
var block__$1 = (function (){var or__5002__auto__ = block;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__131778 = (function (){var or__5002__auto____$1 = cljs.core.first(frontend.state.get_selection_blocks());
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return goog.dom.getElement(frontend.state.get_editing_block_dom_id());
}
})();
var G__131778__$1 = (((G__131778 == null))?null:G__131778.getAttribute("blockid"));
if((G__131778__$1 == null)){
return null;
} else {
return frontend.db.model.get_block_by_uuid(G__131778__$1);
}
}
})();
return logseq.api.get_block(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1),opts);
});
goog.exportSymbol('logseq.api.get_current_block', logseq.api.get_current_block);
logseq.api.get_previous_sibling_block = (function logseq$api$get_previous_sibling_block(block_uuid,opts){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.sdk.utils.uuid_or_throw_error(block_uuid)),(function (id){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api._LT_pull_block(id)),(function (block){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api.block._LT_sync_children_blocks_BANG_(block)),(function (_){
return promesa.protocols._promise((cljs.core.truth_(block)?(function (){var temp__5804__auto__ = logseq.db.get_left_sibling((function (){var G__131779 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__131779) : frontend.db.entity.call(null,G__131779));
})());
if(cljs.core.truth_(temp__5804__auto__)){
var sibling = temp__5804__auto__;
return logseq.api.get_block(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(sibling),opts);
} else {
return null;
}
})():null));
}));
}));
}));
}));
});
goog.exportSymbol('logseq.api.get_previous_sibling_block', logseq.api.get_previous_sibling_block);
logseq.api.get_next_sibling_block = (function logseq$api$get_next_sibling_block(block_uuid,opts){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.sdk.utils.uuid_or_throw_error(block_uuid)),(function (id){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api._LT_pull_block(id)),(function (block){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api.block._LT_sync_children_blocks_BANG_(block)),(function (_){
return promesa.protocols._promise((cljs.core.truth_(block)?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.db.get_right_sibling((function (){var G__131780 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__131780) : frontend.db.entity.call(null,G__131780));
})())),(function (sibling){
return promesa.protocols._promise(logseq.api.get_block(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(sibling),opts));
}));
})):null));
}));
}));
}));
}));
});
goog.exportSymbol('logseq.api.get_next_sibling_block', logseq.api.get_next_sibling_block);
logseq.api.set_block_collapsed = (function logseq$api$set_block_collapsed(block_uuid,opts){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.sdk.utils.uuid_or_throw_error(block_uuid)),(function (block_uuid__$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),block_uuid__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"children?","children?",-1199594108),false], 0))),(function (_){
return promesa.protocols._promise((function (){var temp__5804__auto__ = frontend.db.model.get_block_by_uuid(block_uuid__$1);
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var opts__$1 = cljs_bean.core.__GT_clj(opts);
var opts__$2 = ((((typeof opts__$1 === 'string') || (cljs.core.boolean_QMARK_(opts__$1))))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"flag","flag",1088647881),opts__$1], null):opts__$1);
var map__131781 = opts__$2;
var map__131781__$1 = cljs.core.__destructure_map(map__131781);
var flag = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131781__$1,new cljs.core.Keyword(null,"flag","flag",1088647881));
var flag__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("toggle",flag))?cljs.core.not(frontend.util.collapsed_QMARK_(block)):cljs.core.boolean$(flag));
if(flag__$1){
frontend.handler.editor.collapse_block_BANG_(block_uuid__$1);
} else {
frontend.handler.editor.expand_block_BANG_(block_uuid__$1);
}

return null;
} else {
return null;
}
})());
}));
}));
}));
});
goog.exportSymbol('logseq.api.set_block_collapsed', logseq.api.set_block_collapsed);
logseq.api._resolve_property_prefix_for_db = (function logseq$api$_resolve_property_prefix_for_db(plugin){
if(cljs.core.truth_((function (){var G__131782 = window.LSPlugin;
var G__131782__$1 = (((G__131782 == null))?null:G__131782.PluginLocal);
if((G__131782__$1 == null)){
return null;
} else {
return (plugin instanceof G__131782__$1);
}
})())){
var G__131783 = plugin.id;
var G__131783__$1 = (((G__131783 == null))?null:logseq.api.sanitize_user_property_name(G__131783));
if((G__131783__$1 == null)){
return null;
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__131783__$1),"."].join('');
}
} else {
return null;
}
});
logseq.api._get_property = (function logseq$api$_get_property(plugin,k){
var temp__5804__auto__ = (function (){var and__5000__auto__ = typeof k === 'string';
if(and__5000__auto__){
var G__131784 = k;
var G__131784__$1 = (((G__131784 == null))?null:logseq.api.sanitize_user_property_name(G__131784));
if((G__131784__$1 == null)){
return null;
} else {
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(G__131784__$1);
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var k_SINGLEQUOTE_ = temp__5804__auto__;
var prefix = logseq.api._resolve_property_prefix_for_db(plugin);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.qualified_keyword_QMARK_(k_SINGLEQUOTE_))?k_SINGLEQUOTE_:logseq.api.block.get_db_ident_for_user_property_name([prefix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(k)].join('')))),(function (k__$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.utils.pull.cljs$core$IFn$_invoke$arity$1(k__$1)),(function (p){
return promesa.protocols._promise(p);
}));
}));
}));
} else {
return null;
}
});
logseq.api.get_property = (function logseq$api$get_property(k){
var this$ = this;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api._get_property(this$,k)),(function (prop){
return promesa.protocols._promise(cljs_bean.core.__GT_js(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(prop,new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(prop)))));
}));
}));
});
goog.exportSymbol('logseq.api.get_property', logseq.api.get_property);
/**
 * schema:
 *  {:type :default | :keyword | :map | :date | :checkbox
 *   :cardinality :many | :one
 *   :hide? true
 *   :view-context :page
 *   :public? false}
 *   
 */
logseq.api.upsert_property = (function logseq$api$upsert_property(k,schema,opts){
var this$ = this;
var temp__5804__auto__ = (function (){var and__5000__auto__ = typeof k === 'string';
if(and__5000__auto__){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(k);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var k_SINGLEQUOTE_ = temp__5804__auto__;
var prefix = (cljs.core.truth_((function (){var G__131786 = window.LSPlugin;
var G__131786__$1 = (((G__131786 == null))?null:G__131786.PluginLocal);
if((G__131786__$1 == null)){
return null;
} else {
return (this$ instanceof G__131786__$1);
}
})())?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(this$.id),"."].join(''):null);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = (function (){var G__131787 = opts;
if((G__131787 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__131787);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})()),(function (opts__$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(opts__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__131788 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(k);
if((G__131788 == null)){
return null;
} else {
return clojure.string.trim(G__131788);
}
}
})()),(function (name){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.qualified_keyword_QMARK_(k_SINGLEQUOTE_))?k_SINGLEQUOTE_:logseq.api.block.get_db_ident_for_user_property_name([prefix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(k)].join('')))),(function (k__$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = (function (){var G__131789 = schema;
var G__131789__$1 = (((G__131789 == null))?null:cljs_bean.core.__GT_clj(G__131789));
if((G__131789__$1 == null)){
return null;
} else {
return cljs.core.update_keys(G__131789__$1,(function (p1__131785_SHARP_){
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"public","public",1566243851),null,new cljs.core.Keyword(null,"hide","hide",-596913169),null], null), null),p1__131785_SHARP_)){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1([cljs.core.str.cljs$core$IFn$_invoke$arity$1((name.cljs$core$IFn$_invoke$arity$1 ? name.cljs$core$IFn$_invoke$arity$1(p1__131785_SHARP_) : name.call(null,p1__131785_SHARP_))),"?"].join(''));
} else {
return p1__131785_SHARP_;
}
}));
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})()),(function (schema__$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__131790 = schema__$1;
var G__131790__$1 = ((typeof new cljs.core.Keyword(null,"cardinality","cardinality",-104971109).cljs$core$IFn$_invoke$arity$1(schema__$1) === 'string')?cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__131790,new cljs.core.Keyword(null,"cardinality","cardinality",-104971109),cljs.core.keyword):G__131790);
if(typeof new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(schema__$1) === 'string'){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__131790__$1,new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(schema__$1))),new cljs.core.Keyword(null,"type","type",1174270348));
} else {
return G__131790__$1;
}
})()),(function (schema__$2){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.property.upsert_property_BANG_(k__$1,schema__$2,(function (){var G__131791 = opts__$1;
if(cljs.core.truth_(name)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__131791,new cljs.core.Keyword(null,"property-name","property-name",-1399851434),name);
} else {
return G__131791;
}
})())),(function (p){
return promesa.protocols._promise(cljs_bean.core.__GT_js(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(p)));
}));
}));
}));
}));
}));
}));
}));
} else {
return null;
}
});
goog.exportSymbol('logseq.api.upsert_property', logseq.api.upsert_property);
logseq.api.remove_property = (function logseq$api$remove_property(k){
var this$ = this;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api._get_property(this$,k)),(function (prop){
return promesa.protocols._promise((function (){var temp__5804__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(prop);
if(cljs.core.truth_(temp__5804__auto__)){
var uuid = temp__5804__auto__;
return frontend.handler.common.page._LT_delete_BANG_.cljs$core$IFn$_invoke$arity$variadic(uuid,null,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([null], 0));
} else {
return null;
}
})());
}));
}));
});
goog.exportSymbol('logseq.api.remove_property', logseq.api.remove_property);
logseq.api.upsert_block_property = (function logseq$api$upsert_block_property(block_uuid,keyname,value){
var this$ = this;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api.sanitize_user_property_name(keyname)),(function (keyname__$1){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.sdk.utils.uuid_or_throw_error(block_uuid)),(function (block_uuid__$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_current_repo()),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(repo,block_uuid__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"children?","children?",-1199594108),false], 0))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)),(function (db_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.util.safe_lower_case((((cljs.core.key instanceof cljs.core.Keyword))?cljs.core.name(keyname__$1):keyname__$1))),(function (key){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(db_QMARK_)?logseq.api.block.get_db_ident_for_user_property_name([logseq.api._resolve_property_prefix_for_db(this$),cljs.core.str.cljs$core$IFn$_invoke$arity$1(key)].join('')):key)),(function (key__$1){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = db_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(frontend.db.utils.entity.cljs$core$IFn$_invoke$arity$1(key__$1));
} else {
return and__5000__auto__;
}
})())?frontend.handler.db_based.property.upsert_property_BANG_(key__$1,cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"property-name","property-name",-1399851434),keyname__$1], null)):null)),(function (___$1){
return promesa.protocols._promise(frontend.handler.property.set_block_property_BANG_(repo,block_uuid__$1,key__$1,value));
}));
}));
}));
}));
}));
}));
}));
}));
}));
});
goog.exportSymbol('logseq.api.upsert_block_property', logseq.api.upsert_block_property);
logseq.api.remove_block_property = (function logseq$api$remove_block_property(block_uuid,key){
var this$ = this;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api.sanitize_user_property_name(key)),(function (key__$1){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.sdk.utils.uuid_or_throw_error(block_uuid)),(function (block_uuid__$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),block_uuid__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"children?","children?",-1199594108),false], 0))),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())),(function (db_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = (key__$1 instanceof cljs.core.Keyword);
if(and__5000__auto__){
return cljs.core.namespace(key__$1);
} else {
return and__5000__auto__;
}
})()),(function (key_ns_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(key_ns_QMARK_)?key__$1:frontend.util.safe_lower_case((((key__$1 instanceof cljs.core.Keyword))?cljs.core.name(key__$1):key__$1)))),(function (key__$2){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = db_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(key_ns_QMARK_);
} else {
return and__5000__auto__;
}
})())?logseq.api.block.get_db_ident_for_user_property_name([logseq.api._resolve_property_prefix_for_db(this$),cljs.core.str.cljs$core$IFn$_invoke$arity$1(key__$2)].join('')):key__$2)),(function (key__$3){
return promesa.protocols._promise(frontend.handler.property.remove_block_property_BANG_(frontend.state.get_current_repo(),block_uuid__$1,key__$3));
}));
}));
}));
}));
}));
}));
}));
}));
});
goog.exportSymbol('logseq.api.remove_block_property', logseq.api.remove_block_property);
logseq.api.get_block_property = (function logseq$api$get_block_property(block_uuid,key){
var this$ = this;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.sdk.utils.uuid_or_throw_error(block_uuid)),(function (block_uuid__$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),block_uuid__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"children?","children?",-1199594108),false], 0))),(function (_){
return promesa.protocols._promise((function (){var temp__5804__auto__ = (function (){var G__131792 = block_uuid__$1;
var G__131792__$1 = (((G__131792 == null))?null:frontend.db.model.get_block_by_uuid(G__131792));
if((G__131792__$1 == null)){
return null;
} else {
return new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(G__131792__$1);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var properties = temp__5804__auto__;
if(cljs.core.seq(properties)){
var key__$1 = logseq.api.sanitize_user_property_name(key);
var property_name = frontend.util.safe_lower_case((((key__$1 instanceof cljs.core.Keyword))?cljs.core.name(key__$1):key__$1));
var property_value = (function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties,key__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(property_name));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties,logseq.api.block.get_db_ident_for_user_property_name([logseq.api._resolve_property_prefix_for_db(this$),cljs.core.str.cljs$core$IFn$_invoke$arity$1(property_name)].join('')));
}
}
})();
var property_value__$1 = (function (){var temp__5802__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property_value);
if(cljs.core.truth_(temp__5802__auto__)){
var property_id = temp__5802__auto__;
return (frontend.db.pull.cljs$core$IFn$_invoke$arity$1 ? frontend.db.pull.cljs$core$IFn$_invoke$arity$1(property_id) : frontend.db.pull.call(null,property_id));
} else {
return property_value;
}
})();
var ret = logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(property_value__$1);
return cljs_bean.core.__GT_js(ret);
} else {
return null;
}
} else {
return null;
}
})());
}));
}));
}));
});
goog.exportSymbol('logseq.api.get_block_property', logseq.api.get_block_property);
logseq.api.get_block_properties = (function logseq$api$get_block_properties(block_uuid){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.sdk.utils.uuid_or_throw_error(block_uuid)),(function (block_uuid__$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),block_uuid__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"children?","children?",-1199594108),false], 0))),(function (_){
return promesa.protocols._promise((function (){var temp__5804__auto__ = frontend.db.model.get_block_by_uuid(block_uuid__$1);
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var properties = ((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()))?logseq.api.block.into_readable_db_properties(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block)):new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block));
return cljs_bean.core.__GT_js(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(properties));
} else {
return null;
}
})());
}));
}));
}));
});
goog.exportSymbol('logseq.api.get_block_properties', logseq.api.get_block_properties);
logseq.api.get_current_page_blocks_tree = (function logseq$api$get_current_page_blocks_tree(){
var temp__5804__auto__ = frontend.state.get_current_page();
if(cljs.core.truth_(temp__5804__auto__)){
var page = temp__5804__auto__;
var page_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(logseq.db.get_page((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),page));
var blocks = frontend.db.model.get_page_blocks_no_cache.cljs$core$IFn$_invoke$arity$1(page_id);
var blocks__$1 = frontend.modules.outliner.tree.blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$2(blocks,page_id);
var blocks__$2 = logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(blocks__$1);
return cljs_bean.core.__GT_js(blocks__$2);
} else {
return null;
}
});
goog.exportSymbol('logseq.api.get_current_page_blocks_tree', logseq.api.get_current_page_blocks_tree);
logseq.api.get_page_blocks_tree = (function logseq$api$get_page_blocks_tree(id_or_page_name){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api._LT_ensure_page_loaded(id_or_page_name)),(function (_){
return promesa.protocols._promise((function (){var temp__5804__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(frontend.db.model.get_page(id_or_page_name));
if(cljs.core.truth_(temp__5804__auto__)){
var page_id = temp__5804__auto__;
var blocks = frontend.db.model.get_page_blocks_no_cache.cljs$core$IFn$_invoke$arity$1(page_id);
var blocks__$1 = frontend.modules.outliner.tree.blocks__GT_vec_tree.cljs$core$IFn$_invoke$arity$2(blocks,page_id);
var blocks__$2 = logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(blocks__$1);
return cljs_bean.core.__GT_js(blocks__$2);
} else {
return null;
}
})());
}));
}));
});
goog.exportSymbol('logseq.api.get_page_blocks_tree', logseq.api.get_page_blocks_tree);
logseq.api.get_page_linked_references = (function logseq$api$get_page_linked_references(page_name_or_uuid){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_current_repo()),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(repo,page_name_or_uuid,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"children?","children?",-1199594108),false], 0))),(function (block){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var temp__5804__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
return frontend.db.async._LT_get_block_refs(repo,id);
} else {
return null;
}
})()),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise((new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block) == null)),(function (page_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(page_QMARK_)?frontend.db.model.get_page_referenced_blocks_full.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)):frontend.db.model.get_block_referenced_blocks(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)))),(function (ref_blocks){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = cljs.core.seq(ref_blocks);
if(and__5000__auto__){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,ref_blocks);
} else {
return and__5000__auto__;
}
})()),(function (ref_blocks__$1){
return promesa.protocols._promise(cljs_bean.core.__GT_js(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(ref_blocks__$1)));
}));
}));
}));
}));
}));
}));
}));
});
goog.exportSymbol('logseq.api.get_page_linked_references', logseq.api.get_page_linked_references);
logseq.api.get_pages_from_namespace = (function logseq$api$get_pages_from_namespace(ns){
var temp__5804__auto__ = (function (){var and__5000__auto__ = ns;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.state.get_current_repo();
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
var temp__5804__auto____$1 = frontend.db.file_based.model.get_namespace_pages(repo,ns);
if(cljs.core.truth_(temp__5804__auto____$1)){
var pages = temp__5804__auto____$1;
return cljs_bean.core.__GT_js(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(pages));
} else {
return null;
}
} else {
return null;
}
});
goog.exportSymbol('logseq.api.get_pages_from_namespace', logseq.api.get_pages_from_namespace);
logseq.api.get_pages_tree_from_namespace = (function logseq$api$get_pages_tree_from_namespace(ns){
var temp__5804__auto__ = (function (){var and__5000__auto__ = ns;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.state.get_current_repo();
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
var temp__5804__auto____$1 = frontend.db.file_based.model.get_namespace_hierarchy(repo,ns);
if(cljs.core.truth_(temp__5804__auto____$1)){
var pages = temp__5804__auto____$1;
return cljs_bean.core.__GT_js(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(pages));
} else {
return null;
}
} else {
return null;
}
});
goog.exportSymbol('logseq.api.get_pages_tree_from_namespace', logseq.api.get_pages_tree_from_namespace);
logseq.api.first_child_of_block = (function logseq$api$first_child_of_block(block){
var temp__5804__auto__ = new cljs.core.Keyword("block","_parent","block/_parent",-639389670).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var children = temp__5804__auto__;
var G__131793 = children;
var G__131793__$1 = (((G__131793 == null))?null:(frontend.db.model.sort_by_order.cljs$core$IFn$_invoke$arity$1 ? frontend.db.model.sort_by_order.cljs$core$IFn$_invoke$arity$1(G__131793) : frontend.db.model.sort_by_order.call(null,G__131793)));
if((G__131793__$1 == null)){
return null;
} else {
return cljs.core.first(G__131793__$1);
}
} else {
return null;
}
});
logseq.api.prepend_block_in_page = (function logseq$api$prepend_block_in_page(uuid_or_page_name,content,opts){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api._LT_pull_block(uuid_or_page_name)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.not((frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(uuid_or_page_name) : frontend.util.uuid_string_QMARK_.call(null,uuid_or_page_name)))),(function (page_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = page_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (frontend.db.model.get_page(uuid_or_page_name) == null);
} else {
return and__5000__auto__;
}
})()),(function (page_not_exist_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = page_not_exist_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var G__131794 = uuid_or_page_name;
var G__131795 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false,new cljs.core.Keyword(null,"format","format",-1306924766),frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0()], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__131794,G__131795) : frontend.handler.page._LT_create_BANG_.call(null,G__131794,G__131795));
} else {
return and__5000__auto__;
}
})()),(function (___$1){
return promesa.protocols._promise((function (){var temp__5804__auto__ = frontend.db.model.get_page(uuid_or_page_name);
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(logseq.api.block._LT_sync_children_blocks_BANG_(block),(function (){
var block_SINGLEQUOTE_ = logseq.api.first_child_of_block(block);
var opts__$1 = cljs_bean.core.__GT_clj(opts);
var vec__131796 = (cljs.core.truth_(block_SINGLEQUOTE_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_SINGLEQUOTE_,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts__$1,new cljs.core.Keyword(null,"before","before",-1633692388),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"sibling","sibling",-1183865000),true], 0))], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block,opts__$1], null));
var block__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131796,(0),null);
var opts__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131796,(1),null);
var target = cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1));
return logseq.api.insert_block(target,content,cljs_bean.core.__GT_js(opts__$2));
}));
} else {
return null;
}
})());
}));
}));
}));
}));
}));
});
goog.exportSymbol('logseq.api.prepend_block_in_page', logseq.api.prepend_block_in_page);
logseq.api.append_block_in_page = (function logseq$api$append_block_in_page(uuid_or_page_name,content,opts){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(logseq.api._LT_ensure_page_loaded(uuid_or_page_name)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.not((frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(uuid_or_page_name) : frontend.util.uuid_string_QMARK_.call(null,uuid_or_page_name)))),(function (page_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = page_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (frontend.db.model.get_page(uuid_or_page_name) == null);
} else {
return and__5000__auto__;
}
})()),(function (page_not_exist_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var and__5000__auto__ = page_not_exist_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var G__131799 = uuid_or_page_name;
var G__131800 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false,new cljs.core.Keyword(null,"format","format",-1306924766),frontend.state.get_preferred_format.cljs$core$IFn$_invoke$arity$0()], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__131799,G__131800) : frontend.handler.page._LT_create_BANG_.call(null,G__131799,G__131800));
} else {
return and__5000__auto__;
}
})()),(function (___$1){
return promesa.protocols._promise((function (){var temp__5804__auto__ = frontend.db.model.get_page(uuid_or_page_name);
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var target = cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block));
return logseq.api.insert_block(target,content,opts);
} else {
return null;
}
})());
}));
}));
}));
}));
}));
});
goog.exportSymbol('logseq.api.append_block_in_page', logseq.api.append_block_in_page);
logseq.api.validate_external_plugins = (function logseq$api$validate_external_plugins(urls){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"validateUserExternalPlugins","validateUserExternalPlugins",-316610937),urls], 0));
});
goog.exportSymbol('logseq.api.validate_external_plugins', logseq.api.validate_external_plugins);
logseq.api.__install_plugin = (function logseq$api$__install_plugin(manifest){
var temp__5804__auto__ = cljs_bean.core.__GT_clj(manifest);
if(cljs.core.truth_(temp__5804__auto__)){
var map__131801 = temp__5804__auto__;
var map__131801__$1 = cljs.core.__destructure_map(map__131801);
var manifest__$1 = map__131801__$1;
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131801__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131801__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
if(cljs.core.not((function (){var and__5000__auto__ = repo;
if(cljs.core.truth_(and__5000__auto__)){
return id;
} else {
return and__5000__auto__;
}
})())){
throw (new Error("[required] :repo :id"));
} else {
return frontend.handler.common.plugin.install_marketplace_plugin_BANG_(manifest__$1);
}
} else {
return null;
}
});
goog.exportSymbol('logseq.api.__install_plugin', logseq.api.__install_plugin);
logseq.api.q = (function logseq$api$q(query_string){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.query_dsl.query.cljs$core$IFn$_invoke$arity$3(repo,query_string,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"disable-reactive?","disable-reactive?",-1162731342),true,new cljs.core.Keyword(null,"return-promise?","return-promise?",-230582088),true], null))),(function (result){
return promesa.protocols._promise(cljs_bean.core.__GT_js(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(cljs.core.flatten(cljs.core.deref(result)))));
}));
}));
} else {
return null;
}
});
goog.exportSymbol('logseq.api.q', logseq.api.q);
logseq.api.datascript_query = (function logseq$api$datascript_query(var_args){
var args__5732__auto__ = [];
var len__5726__auto___131869 = arguments.length;
var i__5727__auto___131870 = (0);
while(true){
if((i__5727__auto___131870 < len__5726__auto___131869)){
args__5732__auto__.push((arguments[i__5727__auto___131870]));

var G__131871 = (i__5727__auto___131870 + (1));
i__5727__auto___131870 = G__131871;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return logseq.api.datascript_query.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});
goog.exportSymbol('logseq.api.datascript_query', logseq.api.datascript_query);

(logseq.api.datascript_query.cljs$core$IFn$_invoke$arity$variadic = (function (query,inputs){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
var temp__5804__auto____$1 = (frontend.db.get_db.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$1(repo) : frontend.db.get_db.call(null,repo));
if(cljs.core.truth_(temp__5804__auto____$1)){
var db = temp__5804__auto____$1;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.reader.read_string.cljs$core$IFn$_invoke$arity$1(query)),(function (query__$1){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__131802_SHARP_){
if(typeof p1__131802_SHARP_ === 'string'){
var G__131805 = p1__131802_SHARP_;
var G__131805__$1 = (((G__131805 == null))?null:cljs.reader.read_string.cljs$core$IFn$_invoke$arity$1(G__131805));
if((G__131805__$1 == null)){
return null;
} else {
return frontend.db.query_react.resolve_input.cljs$core$IFn$_invoke$arity$2(db,G__131805__$1);
}
} else {
if(cljs.core.fn_QMARK_(p1__131802_SHARP_)){
return (function() { 
var G__131872__delegate = function (args){
return p1__131802_SHARP_.apply(null,cljs.core.clj__GT_js(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(cljs_bean.core.__GT_js,args)));
};
var G__131872 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__131873__i = 0, G__131873__a = new Array(arguments.length -  0);
while (G__131873__i < G__131873__a.length) {G__131873__a[G__131873__i] = arguments[G__131873__i + 0]; ++G__131873__i;}
  args = new cljs.core.IndexedSeq(G__131873__a,0,null);
} 
return G__131872__delegate.call(this,args);};
G__131872.cljs$lang$maxFixedArity = 0;
G__131872.cljs$lang$applyTo = (function (arglist__131874){
var args = cljs.core.seq(arglist__131874);
return G__131872__delegate(args);
});
G__131872.cljs$core$IFn$_invoke$arity$variadic = G__131872__delegate;
return G__131872;
})()
;
} else {
return p1__131802_SHARP_;

}
}
}),inputs)),(function (resolved_inputs){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.apply.cljs$core$IFn$_invoke$arity$4(frontend.db.async._LT_q,repo,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),false], null),cljs.core.cons(query__$1,resolved_inputs))),(function (result){
return promesa.protocols._promise(cljs_bean.core.__GT_js(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$2(result,false)));
}));
}));
}));
}));
} else {
return null;
}
} else {
return null;
}
}));

(logseq.api.datascript_query.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(logseq.api.datascript_query.cljs$lang$applyTo = (function (seq131803){
var G__131804 = cljs.core.first(seq131803);
var seq131803__$1 = cljs.core.next(seq131803);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__131804,seq131803__$1);
}));

logseq.api.custom_query = (function logseq$api$custom_query(query_string){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var query = cljs.reader.read_string.cljs$core$IFn$_invoke$arity$1(query_string);
return frontend.db.query_custom.custom_query.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"query","query",-1288509510),query,new cljs.core.Keyword(null,"disable-reactive?","disable-reactive?",-1162731342),true,new cljs.core.Keyword(null,"return-promise?","return-promise?",-230582088),true], null));
})()),(function (result){
return promesa.protocols._promise(cljs_bean.core.__GT_js(logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(cljs.core.flatten(result))));
}));
}));
});
goog.exportSymbol('logseq.api.custom_query', logseq.api.custom_query);
logseq.api.download_graph_db = (function logseq$api$download_graph_db(){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
return frontend.handler.export$.export_repo_as_sqlite_db_BANG_(repo);
} else {
return null;
}
});
goog.exportSymbol('logseq.api.download_graph_db', logseq.api.download_graph_db);
logseq.api.download_graph_pages = (function logseq$api$download_graph_pages(){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
return frontend.handler.export$.export_repo_as_zip_BANG_(repo);
} else {
return null;
}
});
goog.exportSymbol('logseq.api.download_graph_pages', logseq.api.download_graph_pages);
logseq.api.exec_git_command = (function logseq$api$exec_git_command(args){
var temp__5804__auto__ = (function (){var and__5000__auto__ = args;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(cljs_bean.core.__GT_clj(args));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var args__$1 = temp__5804__auto__;
return frontend.handler.shell.run_git_command_BANG_(args__$1);
} else {
return null;
}
});
goog.exportSymbol('logseq.api.exec_git_command', logseq.api.exec_git_command);
logseq.api.show_msg = logseq.sdk.ui._show_msg;
goog.exportSymbol('logseq.api.show_msg', logseq.api.show_msg);
logseq.api.query_element_rect = logseq.sdk.ui.query_element_rect;
goog.exportSymbol('logseq.api.query_element_rect', logseq.api.query_element_rect);
logseq.api.query_element_by_id = logseq.sdk.ui.query_element_by_id;
goog.exportSymbol('logseq.api.query_element_by_id', logseq.api.query_element_by_id);
logseq.api.make_asset_url = logseq.sdk.assets.make_url;
goog.exportSymbol('logseq.api.make_asset_url', logseq.api.make_asset_url);
logseq.api.exper_load_scripts = (function logseq$api$exper_load_scripts(var_args){
var args__5732__auto__ = [];
var len__5726__auto___131875 = arguments.length;
var i__5727__auto___131876 = (0);
while(true){
if((i__5727__auto___131876 < len__5726__auto___131875)){
args__5732__auto__.push((arguments[i__5727__auto___131876]));

var G__131877 = (i__5727__auto___131876 + (1));
i__5727__auto___131876 = G__131877;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return logseq.api.exper_load_scripts.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});
goog.exportSymbol('logseq.api.exper_load_scripts', logseq.api.exper_load_scripts);

(logseq.api.exper_load_scripts.cljs$core$IFn$_invoke$arity$variadic = (function (pid,scripts){
var temp__5804__auto__ = frontend.handler.plugin.get_plugin_inst(pid);
if(cljs.core.truth_(temp__5804__auto__)){
var _pl = temp__5804__auto__;
var G__131809 = (function (){var iter__5480__auto__ = (function logseq$api$iter__131810(s__131811){
return (new cljs.core.LazySeq(null,(function (){
var s__131811__$1 = s__131811;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__131811__$1);
if(temp__5804__auto____$1){
var s__131811__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__131811__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__131811__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__131813 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__131812 = (0);
while(true){
if((i__131812 < size__5479__auto__)){
var s = cljs.core._nth(c__5478__auto__,i__131812);
var upt_status = ((function (i__131812,s,c__5478__auto__,size__5479__auto__,b__131813,s__131811__$2,temp__5804__auto____$1,_pl,temp__5804__auto__){
return (function (p1__131806_SHARP_){
return frontend.state.upt_plugin_resource(pid,new cljs.core.Keyword(null,"scripts","scripts",626373193),s,new cljs.core.Keyword(null,"status","status",-1997798413),p1__131806_SHARP_);
});})(i__131812,s,c__5478__auto__,size__5479__auto__,b__131813,s__131811__$2,temp__5804__auto____$1,_pl,temp__5804__auto__))
;
var init_QMARK_ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [null,null,new cljs.core.Keyword(null,"error","error",-978969032),null], null), null),new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(frontend.state.get_plugin_resource(pid,new cljs.core.Keyword(null,"scripts","scripts",626373193),s)));
cljs.core.chunk_append(b__131813,((init_QMARK_)?(function (){
frontend.handler.plugin.register_plugin_resources(pid,new cljs.core.Keyword(null,"scripts","scripts",626373193),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),s,new cljs.core.Keyword(null,"src","src",-1651076051),s], null));

upt_status(new cljs.core.Keyword(null,"pending","pending",-220036727));

return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.loader.load.cljs$core$IFn$_invoke$arity$3(s,null,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"attributes","attributes",-74013604),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-ref","data-ref",-1090558888),cljs.core.name(pid)], null)], null)),((function (i__131812,upt_status,init_QMARK_,s,c__5478__auto__,size__5479__auto__,b__131813,s__131811__$2,temp__5804__auto____$1,_pl,temp__5804__auto__){
return (function (){
return upt_status(new cljs.core.Keyword(null,"done","done",-889844188));
});})(i__131812,upt_status,init_QMARK_,s,c__5478__auto__,size__5479__auto__,b__131813,s__131811__$2,temp__5804__auto____$1,_pl,temp__5804__auto__))
),((function (i__131812,upt_status,init_QMARK_,s,c__5478__auto__,size__5479__auto__,b__131813,s__131811__$2,temp__5804__auto____$1,_pl,temp__5804__auto__){
return (function (){
return upt_status(new cljs.core.Keyword(null,"error","error",-978969032));
});})(i__131812,upt_status,init_QMARK_,s,c__5478__auto__,size__5479__auto__,b__131813,s__131811__$2,temp__5804__auto____$1,_pl,temp__5804__auto__))
);
})()
:null));

var G__131878 = (i__131812 + (1));
i__131812 = G__131878;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__131813),logseq$api$iter__131810(cljs.core.chunk_rest(s__131811__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__131813),null);
}
} else {
var s = cljs.core.first(s__131811__$2);
var upt_status = ((function (s,s__131811__$2,temp__5804__auto____$1,_pl,temp__5804__auto__){
return (function (p1__131806_SHARP_){
return frontend.state.upt_plugin_resource(pid,new cljs.core.Keyword(null,"scripts","scripts",626373193),s,new cljs.core.Keyword(null,"status","status",-1997798413),p1__131806_SHARP_);
});})(s,s__131811__$2,temp__5804__auto____$1,_pl,temp__5804__auto__))
;
var init_QMARK_ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [null,null,new cljs.core.Keyword(null,"error","error",-978969032),null], null), null),new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(frontend.state.get_plugin_resource(pid,new cljs.core.Keyword(null,"scripts","scripts",626373193),s)));
return cljs.core.cons(((init_QMARK_)?(function (){
frontend.handler.plugin.register_plugin_resources(pid,new cljs.core.Keyword(null,"scripts","scripts",626373193),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),s,new cljs.core.Keyword(null,"src","src",-1651076051),s], null));

upt_status(new cljs.core.Keyword(null,"pending","pending",-220036727));

return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.loader.load.cljs$core$IFn$_invoke$arity$3(s,null,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"attributes","attributes",-74013604),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-ref","data-ref",-1090558888),cljs.core.name(pid)], null)], null)),((function (upt_status,init_QMARK_,s,s__131811__$2,temp__5804__auto____$1,_pl,temp__5804__auto__){
return (function (){
return upt_status(new cljs.core.Keyword(null,"done","done",-889844188));
});})(upt_status,init_QMARK_,s,s__131811__$2,temp__5804__auto____$1,_pl,temp__5804__auto__))
),((function (upt_status,init_QMARK_,s,s__131811__$2,temp__5804__auto____$1,_pl,temp__5804__auto__){
return (function (){
return upt_status(new cljs.core.Keyword(null,"error","error",-978969032));
});})(upt_status,init_QMARK_,s,s__131811__$2,temp__5804__auto____$1,_pl,temp__5804__auto__))
);
})()
:null),logseq$api$iter__131810(cljs.core.rest(s__131811__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(scripts);
})();
var G__131809__$1 = (((G__131809 == null))?null:cljs.core.vec(G__131809));
if((G__131809__$1 == null)){
return null;
} else {
return promesa.core.all(G__131809__$1);
}
} else {
return null;
}
}));

(logseq.api.exper_load_scripts.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(logseq.api.exper_load_scripts.cljs$lang$applyTo = (function (seq131807){
var G__131808 = cljs.core.first(seq131807);
var seq131807__$1 = cljs.core.next(seq131807);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__131808,seq131807__$1);
}));

if((typeof logseq !== 'undefined') && (typeof logseq.api !== 'undefined') && (typeof logseq.api._STAR_request_k !== 'undefined')){
} else {
logseq.api._STAR_request_k = cljs.core.volatile_BANG_((0));
}
logseq.api.exper_request = (function logseq$api$exper_request(pid,options){
var temp__5804__auto__ = frontend.handler.plugin.get_plugin_inst(pid);
if(cljs.core.truth_(temp__5804__auto__)){
var pl = temp__5804__auto__;
var req_id = cljs.core.vreset_BANG_(logseq.api._STAR_request_k,(cljs.core.deref(logseq.api._STAR_request_k) + (1)));
var req_cb = (function (p1__131814_SHARP_){
return frontend.handler.plugin.request_callback(pl,req_id,p1__131814_SHARP_);
});
promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"httpRequest","httpRequest",-179408648),req_id,options], 0)),(function (p1__131815_SHARP_){
return req_cb(p1__131815_SHARP_);
})),(function (p1__131816_SHARP_){
return req_cb(p1__131816_SHARP_);
}));

return req_id;
} else {
return null;
}
});
goog.exportSymbol('logseq.api.exper_request', logseq.api.exper_request);
logseq.api.http_request_abort = (function logseq$api$http_request_abort(req_id){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"httpRequestAbort","httpRequestAbort",777669509),req_id], 0));
});
goog.exportSymbol('logseq.api.http_request_abort', logseq.api.http_request_abort);
logseq.api.get_template = (function logseq$api$get_template(name){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(name)?frontend.db.async._LT_get_template_by_name(name):null)),(function (block){
return promesa.protocols._promise((function (){var G__131817 = block;
var G__131817__$1 = (((G__131817 == null))?null:logseq.sdk.utils.normalize_keyword_for_json.cljs$core$IFn$_invoke$arity$1(G__131817));
if((G__131817__$1 == null)){
return null;
} else {
return cljs_bean.core.__GT_js(G__131817__$1);
}
})());
}));
}));
});
goog.exportSymbol('logseq.api.get_template', logseq.api.get_template);
logseq.api.insert_template = (function logseq$api$insert_template(target_uuid,template_name){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.page._LT_template_exists_QMARK_(template_name)),(function (exists_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(exists_QMARK_)?(function (){var temp__5804__auto__ = frontend.db.model.get_block_by_uuid(target_uuid);
if(cljs.core.truth_(temp__5804__auto__)){
var target = temp__5804__auto__;
frontend.handler.editor.insert_template_BANG_.cljs$core$IFn$_invoke$arity$3(null,template_name,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"target","target",253001721),target], null));

return null;
} else {
return null;
}
})():null));
}));
}));
});
goog.exportSymbol('logseq.api.insert_template', logseq.api.insert_template);
logseq.api.exist_template = (function logseq$api$exist_template(name){
return frontend.handler.page._LT_template_exists_QMARK_(name);
});
goog.exportSymbol('logseq.api.exist_template', logseq.api.exist_template);
logseq.api.create_template = (function logseq$api$create_template(target_uuid,template_name,opts){
if(cljs.core.truth_((function (){var and__5000__auto__ = template_name;
if(cljs.core.truth_(and__5000__auto__)){
return frontend.db.model.get_block_by_uuid(target_uuid);
} else {
return and__5000__auto__;
}
})())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs_bean.core.__GT_clj(opts)),(function (p__131818){
var map__131819 = p__131818;
var map__131819__$1 = cljs.core.__destructure_map(map__131819);
var overwrite = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131819__$1,new cljs.core.Keyword(null,"overwrite","overwrite",1291442417));
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_template_by_name(template_name)),(function (block){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.get_current_repo()),(function (repo){
return promesa.protocols._promise(((((cljs.core.not(block)) || (overwrite === true)))?(function (){
var temp__5804__auto___131879 = block;
if(cljs.core.truth_(temp__5804__auto___131879)){
var old_target_131880 = temp__5804__auto___131879;
var k_131881 = logseq.db.common.property_util.get_pid(repo,new cljs.core.Keyword("logseq.property","template","logseq.property/template",-1826514780));
frontend.handler.property.remove_block_property_BANG_(repo,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(old_target_131880),k_131881);
} else {
}

return frontend.handler.property.set_block_property_BANG_(repo,target_uuid,new cljs.core.Keyword("logseq.property","template","logseq.property/template",-1826514780),template_name);
})()
:(function(){throw (new Error("Template already exists!"))})()));
}));
}));
}));
}));
} else {
return null;
}
});
goog.exportSymbol('logseq.api.create_template', logseq.api.create_template);
logseq.api.remove_template = (function logseq$api$remove_template(name){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(name)?frontend.db.async._LT_get_template_by_name(name):null)),(function (block){
return promesa.protocols._promise((cljs.core.truth_(block)?(function (){var repo = frontend.state.get_current_repo();
var k = logseq.db.common.property_util.get_pid(repo,new cljs.core.Keyword("logseq.property","template","logseq.property/template",-1826514780));
return frontend.handler.property.remove_block_property_BANG_(repo,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),k);
})():null));
}));
}));
});
goog.exportSymbol('logseq.api.remove_template', logseq.api.remove_template);
logseq.api.search = (function logseq$api$search(q_SINGLEQUOTE_){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.handler.search.search.cljs$core$IFn$_invoke$arity$1(q_SINGLEQUOTE_),(function (p1__131820_SHARP_){
return cljs_bean.core.__GT_js(p1__131820_SHARP_);
}));
});
goog.exportSymbol('logseq.api.search', logseq.api.search);
logseq.api.set_focused_settings = (function logseq$api$set_focused_settings(pid){
var temp__5804__auto__ = frontend.state.get_plugin_by_id(pid);
if(cljs.core.truth_(temp__5804__auto__)){
var plugin = temp__5804__auto__;
frontend.state.set_state_BANG_(new cljs.core.Keyword("plugin","focused-settings","plugin/focused-settings",-1699334137),pid);

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("go","plugins-settings","go/plugins-settings",-583021288),pid,false,(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(plugin);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(plugin);
}
})()], null));
} else {
return null;
}
});
goog.exportSymbol('logseq.api.set_focused_settings', logseq.api.set_focused_settings);
logseq.api.force_save_graph = (function logseq$api$force_save_graph(){
return true;
});
goog.exportSymbol('logseq.api.force_save_graph', logseq.api.force_save_graph);
logseq.api.set_blocks_id = (function logseq$api$set_blocks_id(p1__131821_SHARP_){
return frontend.handler.editor.set_blocks_id_BANG_(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.uuid,p1__131821_SHARP_));
});
goog.exportSymbol('logseq.api.set_blocks_id', logseq.api.set_blocks_id);

//# sourceMappingURL=logseq.api.js.map
