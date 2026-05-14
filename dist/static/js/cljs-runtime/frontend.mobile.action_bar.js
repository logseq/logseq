goog.provide('frontend.mobile.action_bar');
goog.scope(function(){
  frontend.mobile.action_bar.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.mobile.action_bar.action_command = (function frontend$mobile$action_bar$action_command(icon,description,command_handler){
var callback = (function (){
frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-action-bar?","mobile/show-action-bar?",-1280463440),false);

return (frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.clear_selection_BANG_.call(null));
});
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.bottom-action.flex-row","button.bottom-action.flex-row",1523316063),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (_event){
(command_handler.cljs$core$IFn$_invoke$arity$0 ? command_handler.cljs$core$IFn$_invoke$arity$0() : command_handler.call(null));

return callback();
})], null),frontend.ui.icon(icon,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fontSize","fontSize",919623033),(23)], null)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.description","div.description",1049154676),description], null)], null);
});
frontend.mobile.action_bar.action_bar = rum.core.lazy_build(rum.core.build_defcs,(function (state){
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = frontend.state.sub(new cljs.core.Keyword("mobile","actioned-block","mobile/actioned-block",347869705));
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var map__130695 = block;
var map__130695__$1 = cljs.core.__destructure_map(map__130695);
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130695__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var children = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130695__$1,new cljs.core.Keyword("block","children","block/children",-1040716209));
var last_child_block_id = ((cljs.core.empty_QMARK_(children))?null:new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.last(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__130689_SHARP_){
return cljs.core.not((function (){var G__130696 = frontend.state.get_current_repo();
var G__130697 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__130689_SHARP_);
return (frontend.db.parents_collapsed_QMARK_.cljs$core$IFn$_invoke$arity$2 ? frontend.db.parents_collapsed_QMARK_.cljs$core$IFn$_invoke$arity$2(G__130696,G__130697) : frontend.db.parents_collapsed_QMARK_.call(null,G__130696,G__130697));
})());
}),(function (){var G__130698 = frontend.state.get_current_repo();
var G__130699 = uuid;
return (frontend.db.get_block_children.cljs$core$IFn$_invoke$arity$2 ? frontend.db.get_block_children.cljs$core$IFn$_invoke$arity$2(G__130698,G__130699) : frontend.db.get_block_children.call(null,G__130698,G__130699));
})()))));
var tag_id_130700 = (function (){var or__5002__auto__ = last_child_block_id;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return uuid;
}
})();
var bottom_el_130701 = goog.dom.getElement(["block-content-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(tag_id_130700)].join(''));
var bottom_130702 = frontend.mobile.action_bar.goog$module$goog$object.get(bottom_el_130701.getBoundingClientRect(),"bottom");
var vw_height_130703 = (function (){var or__5002__auto__ = window.visualViewport.height;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return document.documentElement.clientHeight;
}
})();
var delta_130704 = ((vw_height_130703 - bottom_130702) - (170));
if((delta_130704 < (0))){
frontend.util.app_scroll_container_node.cljs$core$IFn$_invoke$arity$0().scrollBy(({"top": ((10) - delta_130704)}));
} else {
}

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.action-bar","div.action-bar",-1385184157),new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.action-bar-commands","div.action-bar-commands",-1470619390),frontend.mobile.action_bar.action_command("infinity","Card",(function (){
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return frontend.extensions.fsrs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null));
} else {
return frontend.extensions.srs.batch_make_cards_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null));
}
})),frontend.mobile.action_bar.action_command("copy","Copy",(function (){
return frontend.handler.editor.copy_selection_blocks(false);
})),frontend.mobile.action_bar.action_command("cut","Cut",(function (){
return frontend.handler.editor.cut_selection_blocks(true);
})),frontend.mobile.action_bar.action_command("trash","Delete",(function (){
return frontend.handler.editor.delete_block_aux_BANG_(block);
})),frontend.mobile.action_bar.action_command("registered","Copy ref",(function (_event){
return frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$2(uuid,frontend.util.ref.__GT_block_ref);
})),frontend.mobile.action_bar.action_command("link","Copy url",(function (_event){
var current_repo = frontend.state.get_current_repo();
var tap_f = (function (block_id){
return frontend.util.url.get_logseq_graph_uuid_url.cljs$core$IFn$_invoke$arity$3(null,current_repo,block_id);
});
return frontend.handler.editor.copy_block_ref_BANG_.cljs$core$IFn$_invoke$arity$2(uuid,tap_f);
})),(cljs.core.truth_(frontend.mobile.util.native_ipad_QMARK_())?frontend.mobile.action_bar.action_command("text-direction-ltr","Right sidebar",(function (_event){
var current_repo = frontend.state.get_current_repo();
return frontend.state.sidebar_add_block_BANG_(current_repo,uuid,new cljs.core.Keyword(null,"block-ref","block-ref",362929756));
})):null)], null)], null);
} else {
return null;
}
})());
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$1((function (state){
return frontend.mixins.hide_when_esc_or_outside.cljs$core$IFn$_invoke$arity$variadic(state,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-hide","on-hide",1263105709),(function (){
(frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0 ? frontend.handler.editor.clear_selection_BANG_.cljs$core$IFn$_invoke$arity$0() : frontend.handler.editor.clear_selection_BANG_.call(null));

return frontend.state.set_state_BANG_(new cljs.core.Keyword("mobile","show-action-bar?","mobile/show-action-bar?",-1280463440),false);
})], 0));
}))], null),"frontend.mobile.action-bar/action-bar");

//# sourceMappingURL=frontend.mobile.action_bar.js.map
