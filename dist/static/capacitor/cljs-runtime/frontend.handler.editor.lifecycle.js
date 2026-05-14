goog.provide('frontend.handler.editor.lifecycle');
frontend.handler.editor.lifecycle.did_mount_BANG_ = (function frontend$handler$editor$lifecycle$did_mount_BANG_(state){
var vec__74034_74039 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var map__74037_74040 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74034_74039,(0),null);
var map__74037_74041__$1 = cljs.core.__destructure_map(map__74037_74040);
var block_parent_id_74042 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__74037_74041__$1,new cljs.core.Keyword(null,"block-parent-id","block-parent-id",801282550));
var id_74043 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__74034_74039,(1),null);
var content_74044 = frontend.state.get_edit_content();
var input_74045 = frontend.state.get_input();
var node_74046 = frontend.util.rec_get_node(input_74045,"ls-block");
var container_id_74047 = (cljs.core.truth_(node_74046)?(function (){var temp__5804__auto__ = dommy.core.attr(node_74046,"containerid");
if(cljs.core.truth_(temp__5804__auto__)){
var container_id_str = temp__5804__auto__;
return frontend.util.safe_parse_int(container_id_str);
} else {
return null;
}
})():null);
input_74045.focus();

if(cljs.core.truth_(container_id_74047)){
frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","container-id","editor/container-id",1915616583),container_id_74047);
} else {
}

if(cljs.core.truth_(block_parent_id_74042)){
frontend.state.set_editing_block_dom_id_BANG_(block_parent_id_74042);
} else {
}

if(cljs.core.truth_(content_74044)){
frontend.handler.editor.restore_cursor_pos_BANG_(id_74043,content_74044);
} else {
}

var temp__5804__auto___74048 = goog.dom.getElement(id_74043);
if(cljs.core.truth_(temp__5804__auto___74048)){
var element_74049 = temp__5804__auto___74048;
setTimeout((function (){
return frontend.util.scroll_editor_cursor(element_74049);
}),(50));
} else {
}

if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"redo","redo",501190664),null,new cljs.core.Keyword(null,"undo","undo",-1818036302),null], null), null),cljs.core.deref(new cljs.core.Keyword("editor","op","editor/op",-441449246).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))))){
} else {
var page_id_74050 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1((function (){var G__74038 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block());
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__74038) : frontend.db.entity.call(null,G__74038));
})()));
var repo_74051 = frontend.state.get_current_repo();
if(cljs.core.truth_(page_id_74050)){
frontend.undo_redo.record_editor_info_BANG_(repo_74051,frontend.state.get_editor_info());
} else {
}
}

frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","op","editor/op",-441449246),null);

return state;
});
frontend.handler.editor.lifecycle.lifecycle = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),frontend.handler.editor.lifecycle.did_mount_BANG_], null);

//# sourceMappingURL=frontend.handler.editor.lifecycle.js.map
