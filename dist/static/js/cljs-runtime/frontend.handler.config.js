goog.provide('frontend.handler.config');
/**
 * Parse repo configuration file content
 */
frontend.handler.config.parse_repo_config = (function frontend$handler$config$parse_repo_config(content){
return borkdude.rewrite_edn.parse_string(content);
});
frontend.handler.config.repo_config_set_key_value = (function frontend$handler$config$repo_config_set_key_value(path,k,v){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
var temp__5804__auto____$1 = (frontend.db.get_file.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_file.cljs$core$IFn$_invoke$arity$1(path) : frontend.db.get_file.call(null,path));
if(cljs.core.truth_(temp__5804__auto____$1)){
var content = temp__5804__auto____$1;
frontend.handler.repo_config.read_repo_config(content);

var result = frontend.handler.config.parse_repo_config(((clojure.string.blank_QMARK_(content))?"{}":content));
var ks = ((cljs.core.vector_QMARK_(k))?k:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [k], null));
var v__$1 = (function (){var G__102706 = v;
if(cljs.core.map_QMARK_(v)){
return cljs.core.reduce_kv((function (a,k__$1,v__$1){
return borkdude.rewrite_edn.assoc(a,k__$1,v__$1);
}),borkdude.rewrite_edn.parse_string("{}"),G__102706);
} else {
return G__102706;
}
})();
var new_result = borkdude.rewrite_edn.assoc_in(result,ks,v__$1);
var new_content = cljs.core.str.cljs$core$IFn$_invoke$arity$1(new_result);
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo)){
frontend.handler.db_based.editor.save_file_BANG_(path,new_content);
} else {
frontend.handler.file_based.file.set_file_content_BANG_(repo,path,new_content);
}

return null;
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.config.set_config_BANG_ = (function frontend$handler$config$set_config_BANG_(k,v){
var path = "logseq/config.edn";
return frontend.handler.config.repo_config_set_key_value(path,k,v);
});
frontend.handler.config.toggle_ui_show_brackets_BANG_ = (function frontend$handler$config$toggle_ui_show_brackets_BANG_(){
var show_brackets_QMARK_ = frontend.state.show_brackets_QMARK_();
return frontend.handler.config.set_config_BANG_(new cljs.core.Keyword("ui","show-brackets?","ui/show-brackets?",659790606),(!(show_brackets_QMARK_)));
});
frontend.handler.config.toggle_logical_outdenting_BANG_ = (function frontend$handler$config$toggle_logical_outdenting_BANG_(){
var logical_outdenting_QMARK_ = frontend.state.logical_outdenting_QMARK_();
return frontend.handler.config.set_config_BANG_(new cljs.core.Keyword("editor","logical-outdenting?","editor/logical-outdenting?",-234289706),cljs.core.not(logical_outdenting_QMARK_));
});
frontend.handler.config.toggle_show_full_blocks_BANG_ = (function frontend$handler$config$toggle_show_full_blocks_BANG_(){
var show_full_blocks_QMARK_ = frontend.state.show_full_blocks_QMARK_();
return frontend.handler.config.set_config_BANG_(new cljs.core.Keyword("ui","show-full-blocks?","ui/show-full-blocks?",-87079885),cljs.core.not(show_full_blocks_QMARK_));
});
frontend.handler.config.toggle_auto_expand_block_refs_BANG_ = (function frontend$handler$config$toggle_auto_expand_block_refs_BANG_(){
var auto_expand_block_refs_QMARK_ = frontend.state.auto_expand_block_refs_QMARK_();
return frontend.handler.config.set_config_BANG_(new cljs.core.Keyword("ui","auto-expand-block-refs?","ui/auto-expand-block-refs?",-1188664588),cljs.core.not(auto_expand_block_refs_QMARK_));
});
frontend.handler.config.toggle_ui_enable_tooltip_BANG_ = (function frontend$handler$config$toggle_ui_enable_tooltip_BANG_(){
var enable_tooltip_QMARK_ = frontend.state.enable_tooltip_QMARK_();
return frontend.handler.config.set_config_BANG_(new cljs.core.Keyword("ui","enable-tooltip?","ui/enable-tooltip?",1082007831),cljs.core.not(enable_tooltip_QMARK_));
});
frontend.handler.config.toggle_preferred_pasting_file_BANG_ = (function frontend$handler$config$toggle_preferred_pasting_file_BANG_(){
var preferred_pasting_file_QMARK_ = frontend.state.preferred_pasting_file_QMARK_();
return frontend.handler.config.set_config_BANG_(new cljs.core.Keyword("editor","preferred-pasting-file?","editor/preferred-pasting-file?",-1242172921),cljs.core.not(preferred_pasting_file_QMARK_));
});

//# sourceMappingURL=frontend.handler.config.js.map
