goog.provide('frontend.handler.ui');
goog.scope(function(){
  frontend.handler.ui.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.handler.ui._STAR_right_sidebar_resized_at = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(Date.now());
frontend.handler.ui.persist_right_sidebar_width_BANG_ = (function frontend$handler$ui$persist_right_sidebar_width_BANG_(width){
frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","sidebar-width","ui/sidebar-width",929889300),width);

return frontend.storage.set("ls-right-sidebar-width",width);
});
frontend.handler.ui.restore_right_sidebar_width_BANG_ = (function frontend$handler$ui$restore_right_sidebar_width_BANG_(){
var temp__5804__auto__ = frontend.storage.get("ls-right-sidebar-width");
if(cljs.core.truth_(temp__5804__auto__)){
var width = temp__5804__auto__;
return frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","sidebar-width","ui/sidebar-width",929889300),width);
} else {
return null;
}
});
frontend.handler.ui.close_left_sidebar_BANG_ = (function frontend$handler$ui$close_left_sidebar_BANG_(){
var temp__5804__auto__ = goog.dom.getElement("close-left-bar");
if(cljs.core.truth_(temp__5804__auto__)){
var elem = temp__5804__auto__;
return elem.click();
} else {
return null;
}
});
frontend.handler.ui.toggle_right_sidebar_BANG_ = (function frontend$handler$ui$toggle_right_sidebar_BANG_(){
if(cljs.core.truth_(new cljs.core.Keyword("ui","sidebar-open?","ui/sidebar-open?",-1099744887).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))){
} else {
frontend.handler.ui.restore_right_sidebar_width_BANG_();
}

return frontend.state.toggle_sidebar_open_QMARK__BANG_();
});
frontend.handler.ui.persist_right_sidebar_state_BANG_ = (function frontend$handler$ui$persist_right_sidebar_state_BANG_(){
var sidebar_open_QMARK_ = new cljs.core.Keyword("ui","sidebar-open?","ui/sidebar-open?",-1099744887).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var data = (cljs.core.truth_(sidebar_open_QMARK_)?new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"blocks","blocks",-610462153),new cljs.core.Keyword("sidebar","blocks","sidebar/blocks",1063715475).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),new cljs.core.Keyword(null,"collapsed","collapsed",-628494523),new cljs.core.Keyword("ui","sidebar-collapsed-blocks","ui/sidebar-collapsed-blocks",395046921).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),new cljs.core.Keyword(null,"open?","open?",1238443125),true], null):new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"open?","open?",1238443125),false], null));
return frontend.storage.set("ls-right-sidebar-state",data);
});
frontend.handler.ui.restore_right_sidebar_state_BANG_ = (function frontend$handler$ui$restore_right_sidebar_state_BANG_(){
var temp__5804__auto__ = frontend.storage.get("ls-right-sidebar-state");
if(cljs.core.truth_(temp__5804__auto__)){
var data_SINGLEQUOTE_ = temp__5804__auto__;
var map__101465 = data_SINGLEQUOTE_;
var map__101465__$1 = cljs.core.__destructure_map(map__101465);
var open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101465__$1,new cljs.core.Keyword(null,"open?","open?",1238443125));
var collapsed = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101465__$1,new cljs.core.Keyword(null,"collapsed","collapsed",-628494523));
var blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101465__$1,new cljs.core.Keyword(null,"blocks","blocks",-610462153));
if(cljs.core.truth_(open_QMARK_)){
frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","sidebar-open?","ui/sidebar-open?",-1099744887),open_QMARK_);

frontend.state.set_state_BANG_(new cljs.core.Keyword("sidebar","blocks","sidebar/blocks",1063715475),blocks);

frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","sidebar-collapsed-blocks","ui/sidebar-collapsed-blocks",395046921),collapsed);

return frontend.handler.ui.restore_right_sidebar_width_BANG_();
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.ui.toggle_contents_BANG_ = (function frontend$handler$ui$toggle_contents_BANG_(){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var current_repo = temp__5804__auto__;
var id = "contents";
if(cljs.core.truth_(frontend.state.sidebar_block_exists_QMARK_(id))){
return frontend.state.sidebar_remove_block_BANG_(id);
} else {
return frontend.state.sidebar_add_block_BANG_(current_repo,id,new cljs.core.Keyword(null,"contents","contents",-1567174023));
}
} else {
return null;
}
});
frontend.handler.ui.toggle_help_BANG_ = (function frontend$handler$ui$toggle_help_BANG_(){
return frontend.state.toggle_BANG_(new cljs.core.Keyword("ui","help-open?","ui/help-open?",-1862197612));
});
frontend.handler.ui.toggle_settings_modal_BANG_ = (function frontend$handler$ui$toggle_settings_modal_BANG_(){
if(cljs.core.truth_(new cljs.core.Keyword("srs","mode?","srs/mode?",-258295984).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))){
return null;
} else {
return frontend.state.toggle_settings_BANG_();
}
});
frontend.handler.ui.re_render_root_BANG_ = (function frontend$handler$ui$re_render_root_BANG_(var_args){
var G__101467 = arguments.length;
switch (G__101467) {
case 0:
return frontend.handler.ui.re_render_root_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.handler.ui.re_render_root_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.ui.re_render_root_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return frontend.handler.ui.re_render_root_BANG_.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.handler.ui.re_render_root_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (p__101468){
var map__101469 = p__101468;
var map__101469__$1 = cljs.core.__destructure_map(map__101469);
var clear_query_state_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__101469__$1,new cljs.core.Keyword(null,"clear-query-state?","clear-query-state?",1559208878),true);
var _PERCENT_ = (function (){
if(cljs.core.truth_(clear_query_state_QMARK_)){
frontend.db.react.clear_query_state_BANG_();
} else {
}

var seq__101470_101510 = cljs.core.seq(cljs.core.keys(cljs.core.deref(frontend.db.react.component__GT_query_key)));
var chunk__101471_101511 = null;
var count__101472_101512 = (0);
var i__101473_101513 = (0);
while(true){
if((i__101473_101513 < count__101472_101512)){
var component_101514 = chunk__101471_101511.cljs$core$IIndexed$_nth$arity$2(null,i__101473_101513);
rum.core.request_render(component_101514);


var G__101515 = seq__101470_101510;
var G__101516 = chunk__101471_101511;
var G__101517 = count__101472_101512;
var G__101518 = (i__101473_101513 + (1));
seq__101470_101510 = G__101515;
chunk__101471_101511 = G__101516;
count__101472_101512 = G__101517;
i__101473_101513 = G__101518;
continue;
} else {
var temp__5804__auto___101519 = cljs.core.seq(seq__101470_101510);
if(temp__5804__auto___101519){
var seq__101470_101520__$1 = temp__5804__auto___101519;
if(cljs.core.chunked_seq_QMARK_(seq__101470_101520__$1)){
var c__5525__auto___101521 = cljs.core.chunk_first(seq__101470_101520__$1);
var G__101522 = cljs.core.chunk_rest(seq__101470_101520__$1);
var G__101523 = c__5525__auto___101521;
var G__101524 = cljs.core.count(c__5525__auto___101521);
var G__101525 = (0);
seq__101470_101510 = G__101522;
chunk__101471_101511 = G__101523;
count__101472_101512 = G__101524;
i__101473_101513 = G__101525;
continue;
} else {
var component_101526 = cljs.core.first(seq__101470_101520__$1);
rum.core.request_render(component_101526);


var G__101527 = cljs.core.next(seq__101470_101520__$1);
var G__101528 = null;
var G__101529 = (0);
var G__101530 = (0);
seq__101470_101510 = G__101527;
chunk__101471_101511 = G__101528;
count__101472_101512 = G__101529;
i__101473_101513 = G__101530;
continue;
}
} else {
}
}
break;
}

var temp__5804__auto___101531 = frontend.state.get_root_component();
if(cljs.core.truth_(temp__5804__auto___101531)){
var component_101532 = temp__5804__auto___101531;
rum.core.request_render(component_101532);
} else {
}

return null;
})()
;
if((_PERCENT_ == null)){
} else {
throw (new Error("Assert failed: (nil? %)"));
}

return _PERCENT_;
}));

(frontend.handler.ui.re_render_root_BANG_.cljs$lang$maxFixedArity = 1);

frontend.handler.ui.highlight_element_BANG_ = (function frontend$handler$ui$highlight_element_BANG_(fragment){
var id = (function (){var and__5000__auto__ = (cljs.core.count(fragment) > (36));
if(and__5000__auto__){
return cljs.core.subs.cljs$core$IFn$_invoke$arity$2(fragment,(cljs.core.count(fragment) - (36)));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return (frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(id) : frontend.util.uuid_string_QMARK_.call(null,id));
} else {
return and__5000__auto__;
}
})())){
var elements = frontend.util.get_blocks_by_id(id);
if(cljs.core.truth_(cljs.core.first(elements))){
frontend.util.scroll_to_element(frontend.handler.ui.goog$module$goog$object.get(cljs.core.first(elements),"id"));
} else {
}

return frontend.state.exit_editing_and_set_selected_blocks_BANG_.cljs$core$IFn$_invoke$arity$1(elements);
} else {
var temp__5804__auto__ = goog.dom.getElement(fragment);
if(cljs.core.truth_(temp__5804__auto__)){
var element = temp__5804__auto__;
frontend.util.scroll_to_element(fragment);

dommy.core.add_class_BANG_.cljs$core$IFn$_invoke$arity$2(element,"block-highlight");

return setTimeout((function (){
return dommy.core.remove_class_BANG_.cljs$core$IFn$_invoke$arity$2(element,"block-highlight");
}),(4000));
} else {
return null;
}
}
});
frontend.handler.ui.add_style_if_exists_BANG_ = (function frontend$handler$ui$add_style_if_exists_BANG_(){
var temp__5804__auto__ = (function (){var or__5002__auto__ = frontend.state.get_custom_css_link();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.db.model.get_custom_css();
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var style = temp__5804__auto__;
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.assets._LT_expand_assets_links_for_db_graph(style)),(function (style__$1){
return promesa.protocols._promise(frontend.util.add_style_BANG_(style__$1));
}));
}));
} else {
var G__101474 = frontend.config.expand_relative_assets_path(style);
if((G__101474 == null)){
return null;
} else {
return frontend.util.add_style_BANG_(G__101474);
}
}
} else {
return null;
}
});
frontend.handler.ui.reset_custom_css_BANG_ = (function frontend$handler$ui$reset_custom_css_BANG_(){
var temp__5804__auto___101533 = goog.dom.getElement("logseq-custom-theme-id");
if(cljs.core.truth_(temp__5804__auto___101533)){
var el_style_101534 = temp__5804__auto___101533;
dommy.core.remove_BANG_.cljs$core$IFn$_invoke$arity$1(el_style_101534);
} else {
}

return frontend.handler.ui.add_style_if_exists_BANG_();
});
frontend.handler.ui._STAR_js_execed = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
frontend.handler.ui.exec_js_if_exists__AMPERSAND__allowed_BANG_ = (function frontend$handler$ui$exec_js_if_exists__AMPERSAND__allowed_BANG_(t){
var temp__5804__auto__ = (function (){var or__5002__auto__ = frontend.state.get_custom_js_link();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.config.get_custom_js_path.cljs$core$IFn$_invoke$arity$0();
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var href = temp__5804__auto__;
var k = ["ls-js-allowed-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(href)].join('');
var execed = (function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.handler.ui._STAR_js_execed,cljs.core.conj,href);
});
var execed_QMARK_ = cljs.core.contains_QMARK_(cljs.core.deref(frontend.handler.ui._STAR_js_execed),href);
var ask_allow = (function (){
var r = confirm((t.cljs$core$IFn$_invoke$arity$1 ? t.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("plugin","custom-js-alert","plugin/custom-js-alert",-1359208866)) : t.call(null,new cljs.core.Keyword("plugin","custom-js-alert","plugin/custom-js-alert",-1359208866))));
if(cljs.core.truth_(r)){
frontend.storage.set(k,Date.now());
} else {
frontend.storage.set(k,false);
}

return r;
});
var allowed_BANG_ = frontend.storage.get(k);
var should_ask_QMARK_ = (((allowed_BANG_ == null)) || (((Date.now() - allowed_BANG_) > (604800000))));
var exec_fn = (function (p1__101475_SHARP_){
var temp__5804__auto____$1 = (function (){var and__5000__auto__ = p1__101475_SHARP_;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.trim(p1__101475_SHARP_);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var scripts = temp__5804__auto____$1;
if(clojure.string.blank_QMARK_(scripts)){
return null;
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = (!(should_ask_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return ask_allow();
}
})())){
try{eval(scripts);

return execed();
}catch (e101476){var e = e101476;
return console.error("[custom js]",e);
}} else {
return null;
}
}
} else {
return null;
}
});
if((((!(execed_QMARK_))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(false,allowed_BANG_)))){
if(clojure.string.starts_with_QMARK_(href,"http")){
if(cljs.core.truth_((function (){var or__5002__auto__ = (!(should_ask_QMARK_));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return ask_allow();
}
})())){
return frontend.loader.load.cljs$core$IFn$_invoke$arity$2(href,(function (){
console.log("[custom js]",href);

return execed();
}));
} else {
return null;
}
} else {
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
var temp__5804__auto____$1 = (frontend.db.get_file.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_file.cljs$core$IFn$_invoke$arity$1(href) : frontend.db.get_file.call(null,href));
if(cljs.core.truth_(temp__5804__auto____$1)){
var script = temp__5804__auto____$1;
return exec_fn(script);
} else {
return null;
}
} else {
var repo_dir = frontend.config.get_repo_dir(frontend.state.get_current_repo());
var rpath = logseq.common.path.relative_path(repo_dir,href);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.fs.file_exists_QMARK_.cljs$core$IFn$_invoke$arity$2(repo_dir,rpath)),(function (exists_QMARK_){
return promesa.protocols._promise((cljs.core.truth_(exists_QMARK_)?frontend.util.p_handle.cljs$core$IFn$_invoke$arity$2(frontend.fs.read_file.cljs$core$IFn$_invoke$arity$2(repo_dir,rpath),exec_fn):null));
}));
}));

}
}
} else {
return null;
}
} else {
return null;
}
});
frontend.handler.ui.toggle_wide_mode_BANG_ = (function frontend$handler$ui$toggle_wide_mode_BANG_(){
frontend.storage.set(new cljs.core.Keyword("ui","wide-mode","ui/wide-mode",2105536944),cljs.core.not(frontend.state.get_wide_mode_QMARK_()));

return frontend.state.toggle_wide_mode_BANG_();
});
/**
 * Reorder matched if grouped
 */
frontend.handler.ui.reorder_matched = (function frontend$handler$ui$reorder_matched(state){
var vec__101477 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var matched = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101477,(0),null);
var map__101480 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101477,(1),null);
var map__101480__$1 = cljs.core.__destructure_map(map__101480);
var grouped_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101480__$1,new cljs.core.Keyword(null,"grouped?","grouped?",531080948));
if(cljs.core.truth_(grouped_QMARK_)){
var _STAR_idx = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((-1));
var inc_idx = (function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_idx,cljs.core.inc);
});
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,(function (){var iter__5480__auto__ = (function frontend$handler$ui$reorder_matched_$_iter__101481(s__101482){
return (new cljs.core.LazySeq(null,(function (){
var s__101482__$1 = s__101482;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__101482__$1);
if(temp__5804__auto__){
var s__101482__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__101482__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__101482__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__101484 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__101483 = (0);
while(true){
if((i__101483 < size__5479__auto__)){
var vec__101485 = cljs.core._nth(c__5478__auto__,i__101483);
var _group = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101485,(0),null);
var matched__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101485,(1),null);
cljs.core.chunk_append(b__101484,cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (i__101483,vec__101485,_group,matched__$1,c__5478__auto__,size__5479__auto__,b__101484,s__101482__$2,temp__5804__auto__,_STAR_idx,inc_idx,vec__101477,matched,map__101480,map__101480__$1,grouped_QMARK_){
return (function (item){
inc_idx();

return item;
});})(i__101483,vec__101485,_group,matched__$1,c__5478__auto__,size__5479__auto__,b__101484,s__101482__$2,temp__5804__auto__,_STAR_idx,inc_idx,vec__101477,matched,map__101480,map__101480__$1,grouped_QMARK_))
,matched__$1)));

var G__101535 = (i__101483 + (1));
i__101483 = G__101535;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__101484),frontend$handler$ui$reorder_matched_$_iter__101481(cljs.core.chunk_rest(s__101482__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__101484),null);
}
} else {
var vec__101488 = cljs.core.first(s__101482__$2);
var _group = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101488,(0),null);
var matched__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101488,(1),null);
return cljs.core.cons(cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (vec__101488,_group,matched__$1,s__101482__$2,temp__5804__auto__,_STAR_idx,inc_idx,vec__101477,matched,map__101480,map__101480__$1,grouped_QMARK_){
return (function (item){
inc_idx();

return item;
});})(vec__101488,_group,matched__$1,s__101482__$2,temp__5804__auto__,_STAR_idx,inc_idx,vec__101477,matched,map__101480,map__101480__$1,grouped_QMARK_))
,matched__$1)),frontend$handler$ui$reorder_matched_$_iter__101481(cljs.core.rest(s__101482__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.group_by(new cljs.core.Keyword(null,"group","group",582596132),matched));
})());
} else {
return matched;
}
});
frontend.handler.ui.auto_complete_prev = (function frontend$handler$ui$auto_complete_prev(state,e){
var current_idx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.ui","current-idx","frontend.ui/current-idx",441919612));
var matched = frontend.handler.ui.reorder_matched(state);
frontend.util.stop(e);

if((cljs.core.deref(current_idx) >= (1))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(current_idx,cljs.core.dec);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(current_idx),(0))){
cljs.core.reset_BANG_(current_idx,(cljs.core.count(matched) - (1)));
} else {

}
}

var temp__5804__auto__ = goog.dom.getElement(["ac-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(current_idx))].join(''));
if(cljs.core.truth_(temp__5804__auto__)){
var element = temp__5804__auto__;
var modal = frontend.handler.ui.goog$module$goog$object.get(goog.dom.getElement("ui__ac"),"parentElement");
var height = (function (){var or__5002__auto__ = frontend.handler.ui.goog$module$goog$object.get(modal,"offsetHeight");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (300);
}
})();
var scroll_top = (frontend.handler.ui.goog$module$goog$object.get(element,"offsetTop") - (height / (2)));
return (modal.scrollTop = scroll_top);
} else {
return null;
}
});
frontend.handler.ui.auto_complete_next = (function frontend$handler$ui$auto_complete_next(state,e){
var current_idx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.ui","current-idx","frontend.ui/current-idx",441919612));
var matched = frontend.handler.ui.reorder_matched(state);
frontend.util.stop(e);

var total_101536 = cljs.core.count(matched);
if((cljs.core.deref(current_idx) >= (total_101536 - (1)))){
cljs.core.reset_BANG_(current_idx,(0));
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(current_idx,cljs.core.inc);
}

var temp__5804__auto__ = goog.dom.getElement(["ac-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(current_idx))].join(''));
if(cljs.core.truth_(temp__5804__auto__)){
var element = temp__5804__auto__;
var modal = frontend.handler.ui.goog$module$goog$object.get(goog.dom.getElement("ui__ac"),"parentElement");
var height = (function (){var or__5002__auto__ = frontend.handler.ui.goog$module$goog$object.get(modal,"offsetHeight");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (300);
}
})();
var scroll_top = (frontend.handler.ui.goog$module$goog$object.get(element,"offsetTop") - (height / (2)));
return (modal.scrollTop = scroll_top);
} else {
return null;
}
});
frontend.handler.ui.auto_complete_complete = (function frontend$handler$ui$auto_complete_complete(state,e){
var vec__101491 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var _matched = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101491,(0),null);
var map__101494 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101491,(1),null);
var map__101494__$1 = cljs.core.__destructure_map(map__101494);
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101494__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
var on_enter = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101494__$1,new cljs.core.Keyword(null,"on-enter","on-enter",-928988216));
var matched = frontend.handler.ui.reorder_matched(state);
var current_idx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.ui","current-idx","frontend.ui/current-idx",441919612));
frontend.util.stop(e);

if(((cljs.core.seq(matched)) && ((cljs.core.count(matched) > cljs.core.deref(current_idx))))){
var G__101495 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(matched,cljs.core.deref(current_idx));
var G__101496 = e;
return (on_chosen.cljs$core$IFn$_invoke$arity$2 ? on_chosen.cljs$core$IFn$_invoke$arity$2(G__101495,G__101496) : on_chosen.call(null,G__101495,G__101496));
} else {
var and__5000__auto__ = on_enter;
if(cljs.core.truth_(and__5000__auto__)){
return (on_enter.cljs$core$IFn$_invoke$arity$1 ? on_enter.cljs$core$IFn$_invoke$arity$1(state) : on_enter.call(null,state));
} else {
return and__5000__auto__;
}
}
});
frontend.handler.ui.auto_complete_shift_complete = (function frontend$handler$ui$auto_complete_shift_complete(state,e){
var vec__101497 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var _matched = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101497,(0),null);
var map__101500 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101497,(1),null);
var map__101500__$1 = cljs.core.__destructure_map(map__101500);
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101500__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
var on_shift_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101500__$1,new cljs.core.Keyword(null,"on-shift-chosen","on-shift-chosen",-310778328));
var on_enter = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101500__$1,new cljs.core.Keyword(null,"on-enter","on-enter",-928988216));
var matched = frontend.handler.ui.reorder_matched(state);
var current_idx = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.ui","current-idx","frontend.ui/current-idx",441919612));
frontend.util.stop(e);

if(((cljs.core.seq(matched)) && ((cljs.core.count(matched) > cljs.core.deref(current_idx))))){
var G__101502 = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(matched,cljs.core.deref(current_idx));
var G__101503 = false;
var fexpr__101501 = (function (){var or__5002__auto__ = on_shift_chosen;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return on_chosen;
}
})();
return (fexpr__101501.cljs$core$IFn$_invoke$arity$2 ? fexpr__101501.cljs$core$IFn$_invoke$arity$2(G__101502,G__101503) : fexpr__101501.call(null,G__101502,G__101503));
} else {
var and__5000__auto__ = on_enter;
if(cljs.core.truth_(and__5000__auto__)){
return (on_enter.cljs$core$IFn$_invoke$arity$1 ? on_enter.cljs$core$IFn$_invoke$arity$1(state) : on_enter.call(null,state));
} else {
return and__5000__auto__;
}
}
});
frontend.handler.ui.toggle_cards_BANG_ = (function frontend$handler$ui$toggle_cards_BANG_(){
if(cljs.core.truth_(logseq.shui.dialog.core.get_modal(new cljs.core.Keyword(null,"srs","srs",1327991978)))){
return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
} else {
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("modal","show-cards","modal/show-cards",1918730906)], null));
}
});
/**
 * Open a new Electron window.
 */
frontend.handler.ui.open_new_window_or_tab_BANG_ = (function frontend$handler$ui$open_new_window_or_tab_BANG_(target_repo){
if(cljs.core.truth_(target_repo)){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["openNewWindow",target_repo], 0));
} else {
return window.open([cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.config.app_website),"#/?graph=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(target_repo)].join(''),"_blank");
}
} else {
return null;
}
});
frontend.handler.ui.toggle_show_empty_hidden_properties_BANG_ = (function frontend$handler$ui$toggle_show_empty_hidden_properties_BANG_(){
var editing_block = frontend.state.get_edit_block();
var selected_ids = frontend.state.get_selection_block_ids();
var block_ids = (cljs.core.truth_(editing_block)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(selected_ids,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(editing_block)):selected_ids);
var _STAR_state = new cljs.core.Keyword("ui","show-empty-and-hidden-properties?","ui/show-empty-and-hidden-properties?",1338368380).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var map__101504 = cljs.core.deref(_STAR_state);
var map__101504__$1 = cljs.core.__destructure_map(map__101504);
var ids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101504__$1,new cljs.core.Keyword(null,"ids","ids",-998535796));
var mode = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101504__$1,new cljs.core.Keyword(null,"mode","mode",654403691));
var show_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101504__$1,new cljs.core.Keyword(null,"show?","show?",1543842127));
if(cljs.core.seq(block_ids)){
var block_ids_SINGLEQUOTE_ = cljs.core.set(block_ids);
return cljs.core.reset_BANG_(_STAR_state,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"mode","mode",654403691),new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword(null,"ids","ids",-998535796),block_ids_SINGLEQUOTE_,new cljs.core.Keyword(null,"show?","show?",1543842127),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mode,new cljs.core.Keyword(null,"global","global",93595047)))?true:((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(ids,block_ids_SINGLEQUOTE_))?true:cljs.core.not(show_QMARK_)
))], null));
} else {
return cljs.core.reset_BANG_(_STAR_state,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"mode","mode",654403691),new cljs.core.Keyword(null,"global","global",93595047),new cljs.core.Keyword(null,"show?","show?",1543842127),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mode,new cljs.core.Keyword(null,"block","block",664686210)))?true:cljs.core.not(show_QMARK_))], null));
}
});
frontend.handler.ui.scroll_to_anchor_block = (function frontend$handler$ui$scroll_to_anchor_block(ref,blocks,gallery_QMARK_){
if(cljs.core.truth_(ref)){
var anchor = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(frontend.state.get_route_match(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"query-params","query-params",900640534),new cljs.core.Keyword(null,"anchor","anchor",1549638489)], null));
var anchor_id = (cljs.core.truth_((function (){var and__5000__auto__ = anchor;
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.starts_with_QMARK_(anchor,"ls-block-");
} else {
return and__5000__auto__;
}
})())?(function (){var id = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(anchor,(9));
if(cljs.core.truth_((frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.uuid_string_QMARK_.cljs$core$IFn$_invoke$arity$1(id) : frontend.util.uuid_string_QMARK_.call(null,id)))){
return cljs.core.uuid(id);
} else {
return null;
}
})():null);
if(cljs.core.truth_((function (){var and__5000__auto__ = ref;
if(cljs.core.truth_(and__5000__auto__)){
return anchor_id;
} else {
return and__5000__auto__;
}
})())){
var block_ids = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks);
var find_idx = (function (anchor_id__$1){
var idx = block_ids.indexOf(anchor_id__$1);
if((idx > (0))){
return idx;
} else {
return null;
}
});
var idx = (function (){var or__5002__auto__ = find_idx(anchor_id);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var block = (function (){var G__101505 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),anchor_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__101505) : frontend.db.entity.call(null,G__101505));
})();
var parents = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),(function (){var G__101506 = frontend.state.get_current_repo();
var G__101507 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
var G__101508 = cljs.core.PersistentArrayMap.EMPTY;
return (frontend.db.get_block_parents.cljs$core$IFn$_invoke$arity$3 ? frontend.db.get_block_parents.cljs$core$IFn$_invoke$arity$3(G__101506,G__101507,G__101508) : frontend.db.get_block_parents.call(null,G__101506,G__101507,G__101508));
})());
return cljs.core.some(find_idx,parents);
}
})();
if(cljs.core.truth_(idx)){
return setTimeout((function (){
ref.scrollToIndex(({"index": idx}));

return setTimeout((function (){
return frontend.handler.ui.highlight_element_BANG_(anchor);
}),(200));
}),(cljs.core.truth_(gallery_QMARK_)?(100):(0)));
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

//# sourceMappingURL=frontend.handler.ui.js.map
