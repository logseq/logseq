goog.provide('frontend.handler.jump');
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.jump !== 'undefined') && (typeof frontend.handler.jump._STAR_current_keys !== 'undefined')){
} else {
frontend.handler.jump._STAR_current_keys = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.jump !== 'undefined') && (typeof frontend.handler.jump._STAR_jump_data !== 'undefined')){
} else {
frontend.handler.jump._STAR_jump_data = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
frontend.handler.jump.prefix_keys = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["j","k","l"], null);
frontend.handler.jump.other_keys = new cljs.core.PersistentVector(null, 23, 5, cljs.core.PersistentVector.EMPTY_NODE, ["a","s","d","f","g","h","q","w","e","r","t","y","u","i","o","p","z","x","c","v","b","n","m"], null);
if((typeof frontend !== 'undefined') && (typeof frontend.handler !== 'undefined') && (typeof frontend.handler.jump !== 'undefined') && (typeof frontend.handler.jump.full_start_keys !== 'undefined')){
} else {
frontend.handler.jump.full_start_keys = cljs.core.set(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(frontend.handler.jump.prefix_keys,frontend.handler.jump.other_keys));
}
/**
 * Notice: at most 92 keys for now
 */
frontend.handler.jump.generate_keys = (function frontend$handler$jump$generate_keys(n){
return cljs.core.vec(cljs.core.take.cljs$core$IFn$_invoke$arity$2(n,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(frontend.handler.jump.other_keys,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (k){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__105611_SHARP_){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(k),cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__105611_SHARP_)].join('');
}),frontend.handler.jump.other_keys);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.handler.jump.prefix_keys], 0)))));
});
frontend.handler.jump.clear_jump_hints_BANG_ = (function frontend$handler$jump$clear_jump_hints_BANG_(){
cljs.core.dorun.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(dommy.core.remove_BANG_,dommy.utils.__GT_Array(document.getElementsByClassName("jtrigger-id"))));

return cljs.core.reset_BANG_(frontend.handler.jump._STAR_current_keys,null);
});
frontend.handler.jump.exit_BANG_ = (function frontend$handler$jump$exit_BANG_(){
var temp__5804__auto___105631 = new cljs.core.Keyword(null,"key-down-handler","key-down-handler",1352306780).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.handler.jump._STAR_jump_data));
if(cljs.core.truth_(temp__5804__auto___105631)){
var event_handler_105632 = temp__5804__auto___105631;
window.removeEventListener("keydown",event_handler_105632);
} else {
}

cljs.core.reset_BANG_(frontend.handler.jump._STAR_current_keys,null);

cljs.core.reset_BANG_(frontend.handler.jump._STAR_jump_data,cljs.core.PersistentArrayMap.EMPTY);

return frontend.handler.jump.clear_jump_hints_BANG_();
});
frontend.handler.jump.get_trigger = (function frontend$handler$jump$get_trigger(triggers,key){
var idx = cljs.core.deref(frontend.handler.jump._STAR_current_keys).indexOf(key);
if((idx >= (0))){
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(triggers,idx);
} else {
return null;
}
});
frontend.handler.jump.trigger_BANG_ = (function frontend$handler$jump$trigger_BANG_(key,e){
var map__105616 = cljs.core.deref(frontend.handler.jump._STAR_jump_data);
var map__105616__$1 = cljs.core.__destructure_map(map__105616);
var triggers = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105616__$1,new cljs.core.Keyword(null,"triggers","triggers",-1443678770));
var _mode = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105616__$1,new cljs.core.Keyword(null,"_mode","_mode",1455298843));
var trigger = frontend.handler.jump.get_trigger(triggers,clojure.string.trim(key));
if(cljs.core.truth_((function (){var or__5002__auto__ = trigger;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (((clojure.string.trim(key)).length) >= (2));
}
})())){
frontend.util.stop(e);

frontend.state.clear_selection_BANG_();

frontend.handler.jump.exit_BANG_();

if(cljs.core.truth_(trigger)){
if(dommy.core.has_class_QMARK_(trigger,"block-content")){
var block_id = (function (){var G__105617 = dommy.core.attr(trigger,"blockid");
if((G__105617 == null)){
return null;
} else {
return cljs.core.uuid(G__105617);
}
})();
var container_id = (function (){var G__105619 = dommy.core.attr(trigger,"containerid");
if((G__105619 == null)){
return null;
} else {
return frontend.util.safe_parse_int(G__105619);
}
})();
var block = (cljs.core.truth_(block_id)?(function (){var G__105620 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__105620) : frontend.db.entity.call(null,G__105620));
})():null);
if(cljs.core.truth_(block)){
var G__105621 = block;
var G__105622 = new cljs.core.Keyword(null,"max","max",61366548);
var G__105623 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),container_id], null);
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__105621,G__105622,G__105623) : frontend.handler.editor.edit_block_BANG_.call(null,G__105621,G__105622,G__105623));
} else {
return null;
}
} else {
return trigger.click();
}
} else {
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3("Invalid jump",new cljs.core.Keyword(null,"error","error",-978969032),true);
}
} else {
return null;
}
});
frontend.handler.jump.jump_to = (function frontend$handler$jump$jump_to(){
if(cljs.core.empty_QMARK_(dommy.utils.__GT_Array(document.getElementsByClassName("jtrigger-id")))){
var current_block_id = (function (){var or__5002__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(frontend.state.get_edit_block());
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.core.first(frontend.state.get_selection_block_ids());
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((function (){var G__105626 = frontend.state.get_current_page();
return (frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(G__105626) : frontend.db.get_page.call(null,G__105626));
})());
}
}
})();
var current_block = ((cljs.core.uuid_QMARK_(current_block_id))?(function (){var G__105627 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),current_block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__105627) : frontend.db.entity.call(null,G__105627));
})():null);
var collapsed_QMARK_ = (function (){var or__5002__auto__ = frontend.state.get_block_collapsed(current_block_id);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(current_block);
}
})();
if(cljs.core.truth_(collapsed_QMARK_)){
frontend.handler.editor.expand_block_BANG_(current_block_id);
} else {
}

var f = (function (){
var selected_block_or_editing_block = (function (){var or__5002__auto__ = cljs.core.first(frontend.state.get_selection_blocks());
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__105628 = frontend.state.get_editing_block_dom_id();
var G__105628__$1 = (((G__105628 == null))?null:document.getElementById(G__105628));
if((G__105628__$1 == null)){
return null;
} else {
return frontend.util.rec_get_node(G__105628__$1,".ls-block");
}
}
})();
var triggers = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (n){
return cljs.core.some((function (class$){
return n.closest(class$);
}),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [".view-actions",null,".ls-table-cell",null,".positioned-properties",null], null), null));
}),(cljs.core.truth_(selected_block_or_editing_block)?dommy.utils.__GT_Array(selected_block_or_editing_block.getElementsByClassName("jtrigger")):dommy.utils.__GT_Array(document.getElementsByClassName("jtrigger"))));
if(cljs.core.seq(triggers)){
cljs.core.reset_BANG_(frontend.handler.jump._STAR_jump_data,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"mode","mode",654403691),new cljs.core.Keyword(null,"property","property",-1114278232),new cljs.core.Keyword(null,"triggers","triggers",-1443678770),triggers], null));

var keys = frontend.handler.jump.generate_keys(cljs.core.count(triggers));
var key_down_handler = (function (e){
var k = frontend.util.ekey(e);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,"Escape")){
return frontend.handler.jump.exit_BANG_();
} else {
if(((cljs.core.contains_QMARK_(frontend.handler.jump.full_start_keys,k)) && (cljs.core.seq(new cljs.core.Keyword(null,"triggers","triggers",-1443678770).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.handler.jump._STAR_jump_data)))))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.handler.jump._STAR_jump_data,cljs.core.update,new cljs.core.Keyword(null,"chords","chords",234981817),(function (s){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(s),cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.util.ekey(e))].join('');
}));

var chords = new cljs.core.Keyword(null,"chords","chords",234981817).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.handler.jump._STAR_jump_data));
return frontend.handler.jump.trigger_BANG_(chords,e);
} else {
return null;
}
}
});
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.handler.jump._STAR_jump_data,cljs.core.assoc,new cljs.core.Keyword(null,"key-down-handler","key-down-handler",1352306780),key_down_handler);

cljs.core.reset_BANG_(frontend.handler.jump._STAR_current_keys,keys);

cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (id,dom){
var class$ = ((dommy.core.has_class_QMARK_(dom,"ui__checkbox"))?"jtrigger-id text-sm border rounded ml-4 px-1 shadow-xs":"jtrigger-id text-sm border rounded ml-2 px-1 shadow-xs");
var view = (function (){var or__5002__auto__ = dom.closest(".jtrigger-view");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return dom;
}
})();
return dommy.core.append_BANG_.cljs$core$IFn$_invoke$arity$2(view,dommy.core.set_text_BANG_(dommy.core.set_attr_BANG_.cljs$core$IFn$_invoke$arity$3(dommy.core.create_element.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"div","div",1057191632)),new cljs.core.Keyword(null,"class","class",-2030961996),class$),cljs.core.nth.cljs$core$IFn$_invoke$arity$2(keys,id)));
}),cljs.core.take.cljs$core$IFn$_invoke$arity$2(cljs.core.count(keys),triggers)));

return window.addEventListener("keydown",key_down_handler);
} else {
return null;
}
});
if(cljs.core.truth_(collapsed_QMARK_)){
return setTimeout(f,(100));
} else {
return f();
}
} else {
return null;
}
});

//# sourceMappingURL=frontend.handler.jump.js.map
