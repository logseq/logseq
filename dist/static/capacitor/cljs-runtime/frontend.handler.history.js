goog.provide('frontend.handler.history');
frontend.handler.history.restore_cursor_BANG_ = (function frontend$handler$history$restore_cursor_BANG_(p__65997){
var map__65998 = p__65997;
var map__65998__$1 = cljs.core.__destructure_map(map__65998);
var editor_cursors = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65998__$1,new cljs.core.Keyword(null,"editor-cursors","editor-cursors",1786594845));
var block_content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65998__$1,new cljs.core.Keyword(null,"block-content","block-content",476919690));
var undo_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65998__$1,new cljs.core.Keyword(null,"undo?","undo?",85877626));
var map__65999 = (cljs.core.truth_(undo_QMARK_)?cljs.core.first(editor_cursors):(function (){var or__5002__auto__ = cljs.core.last(editor_cursors);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.first(editor_cursors);
}
})());
var map__65999__$1 = cljs.core.__destructure_map(map__65999);
var block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65999__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638));
var container_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65999__$1,new cljs.core.Keyword(null,"container-id","container-id",1274665684));
var start_pos = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65999__$1,new cljs.core.Keyword(null,"start-pos","start-pos",668789086));
var end_pos = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65999__$1,new cljs.core.Keyword(null,"end-pos","end-pos",-1643883926));
var pos = (cljs.core.truth_(undo_QMARK_)?(function (){var or__5002__auto__ = start_pos;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return end_pos;
}
})():(function (){var or__5002__auto__ = end_pos;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return start_pos;
}
})());
var temp__5804__auto__ = (function (){var G__66000 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (frontend.db.pull.cljs$core$IFn$_invoke$arity$1 ? frontend.db.pull.cljs$core$IFn$_invoke$arity$1(G__66000) : frontend.db.pull.call(null,G__66000));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
var G__66001 = block;
var G__66002 = pos;
var G__66003 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),container_id,new cljs.core.Keyword(null,"custom-content","custom-content",-8240001),block_content], null);
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__66001,G__66002,G__66003) : frontend.handler.editor.edit_block_BANG_.call(null,G__66001,G__66002,G__66003));
} else {
return null;
}
});
frontend.handler.history.restore_app_state_BANG_ = (function frontend$handler$history$restore_app_state_BANG_(state){
var route_data = new cljs.core.Keyword(null,"route-data","route-data",626955263).cljs$core$IFn$_invoke$arity$1(state);
var current_route = new cljs.core.Keyword(null,"route-match","route-match",-1450985937).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var current_route_data = frontend.persist_db.browser.get_route_data(current_route);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(route_data,current_route_data);
if(and__5000__auto__){
var and__5000__auto____$1 = route_data;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"home","home",-74557309),null,new cljs.core.Keyword(null,"all-journals","all-journals",-347015095),null,new cljs.core.Keyword(null,"page","page",849072397),null,new cljs.core.Keyword(null,"page-block","page-block",504302814),null], null), null),new cljs.core.Keyword(null,"to","to",192099007).cljs$core$IFn$_invoke$arity$1(route_data));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
frontend.handler.route.redirect_BANG_(route_data);
} else {
}

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.state,cljs.core.merge,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword(null,"route-data","route-data",626955263)));
});
frontend.handler.history.restore_cursor_and_state_BANG_ = (function frontend$handler$history$restore_cursor_and_state_BANG_(result){
frontend.state.set_state_BANG_(new cljs.core.Keyword("history","paused?","history/paused?",-21834005),true);

var map__66005_66007 = result;
var map__66005_66008__$1 = cljs.core.__destructure_map(map__66005_66007);
var data_66009 = map__66005_66008__$1;
var ui_state_str_66010 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66005_66008__$1,new cljs.core.Keyword(null,"ui-state-str","ui-state-str",1589208687));
var undo_QMARK__66011 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66005_66008__$1,new cljs.core.Keyword(null,"undo?","undo?",85877626));
if(cljs.core.truth_(ui_state_str_66010)){
var map__66006_66012 = logseq.db.read_transit_str(ui_state_str_66010);
var map__66006_66013__$1 = cljs.core.__destructure_map(map__66006_66012);
var old_state_66014 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66006_66013__$1,new cljs.core.Keyword(null,"old-state","old-state",1039580704));
var new_state_66015 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__66006_66013__$1,new cljs.core.Keyword(null,"new-state","new-state",-490349212));
if(cljs.core.truth_(undo_QMARK__66011)){
frontend.handler.history.restore_app_state_BANG_(old_state_66014);
} else {
frontend.handler.history.restore_app_state_BANG_(new_state_66015);
}
} else {
frontend.handler.history.restore_cursor_BANG_(data_66009);
}

return frontend.state.set_state_BANG_(new cljs.core.Keyword("history","paused?","history/paused?",-21834005),false);
});
var _STAR_last_request_66016 = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.handler.history.undo_aux_BANG_ = (function frontend$handler$history$undo_aux_BANG_(e){
if(cljs.core.truth_(new cljs.core.Keyword("editor","code-block-context","editor/code-block-context",-1384305346).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))){
return null;
} else {
frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","op","editor/op",-441449246),new cljs.core.Keyword(null,"undo","undo",-1818036302));

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.deref(_STAR_last_request_66016)),(function (___40947__auto__){
return promesa.protocols._promise((function (){var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
if(frontend.db.transact.request_finished_QMARK_()){
frontend.util.stop(e);

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","last-replace-ref-content-tx","editor/last-replace-ref-content-tx",831177325),repo], null),null)),(function (___40947__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0()),(function (___40947__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.clear_editor_action_BANG_()),(function (___40947__auto____$3){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_last_request_66016,frontend.undo_redo.undo(repo))),(function (___40947__auto____$4){
return promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.deref(_STAR_last_request_66016)),(function (result){
return promesa.protocols._promise(frontend.handler.history.restore_cursor_and_state_BANG_(result));
}));
})));
}));
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
})());
}));
}));
}
});
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.history !== 'undefined') && (typeof frontend.handler.history.undo_BANG_ !== 'undefined')){
} else {
frontend.handler.history.undo_BANG_ = goog.functions.debounce(frontend.handler.history.undo_aux_BANG_,(20));
}
var _STAR_last_request_66017 = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.handler.history.redo_aux_BANG_ = (function frontend$handler$history$redo_aux_BANG_(e){
if(cljs.core.truth_(new cljs.core.Keyword("editor","code-block-context","editor/code-block-context",-1384305346).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)))){
return null;
} else {
frontend.state.set_state_BANG_(new cljs.core.Keyword("editor","op","editor/op",-441449246),new cljs.core.Keyword(null,"redo","redo",501190664));

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.deref(_STAR_last_request_66017)),(function (___40947__auto__){
return promesa.protocols._promise((function (){var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
if(frontend.db.transact.request_finished_QMARK_()){
frontend.util.stop(e);

frontend.state.clear_editor_action_BANG_();

cljs.core.reset_BANG_(_STAR_last_request_66017,frontend.undo_redo.redo(repo));

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.deref(_STAR_last_request_66017)),(function (result){
return promesa.protocols._promise(frontend.handler.history.restore_cursor_and_state_BANG_(result));
}));
}));
} else {
return null;
}
} else {
return null;
}
})());
}));
}));
}
});
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.history !== 'undefined') && (typeof frontend.handler.history.redo_BANG_ !== 'undefined')){
} else {
frontend.handler.history.redo_BANG_ = goog.functions.debounce(frontend.handler.history.redo_aux_BANG_,(20));
}

//# sourceMappingURL=frontend.handler.history.js.map
