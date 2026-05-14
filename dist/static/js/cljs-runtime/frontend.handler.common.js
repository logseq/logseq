goog.provide('frontend.handler.common');
goog.scope(function(){
  frontend.handler.common.goog$module$goog$object = goog.module.get('goog.object');
});
var module$node_modules$ignore$index=shadow.js.require("module$node_modules$ignore$index", {});
frontend.handler.common.copy_to_clipboard_without_id_property_BANG_ = (function frontend$handler$common$copy_to_clipboard_without_id_property_BANG_(repo,format,raw_text,html,blocks){
var blocks_SINGLEQUOTE_ = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","raw-title","block/raw-title",1833669090).cljs$core$IFn$_invoke$arity$1((function (){var G__102614 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__102614) : frontend.db.entity.call(null,G__102614));
})()));
}),blocks);
return frontend.util.copy_to_clipboard_BANG_.cljs$core$IFn$_invoke$arity$variadic(frontend.handler.property.remove_id_property(repo,format,raw_text),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"html","html",-998796897),html,new cljs.core.Keyword(null,"graph","graph",1558099509),repo,new cljs.core.Keyword(null,"blocks","blocks",-610462153),blocks_SINGLEQUOTE_], 0));
});
frontend.handler.common.config_with_document_mode = (function frontend$handler$common$config_with_document_mode(config){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword("document","mode?","document/mode?",-994203479),frontend.state.sub(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("document","mode?","document/mode?",-994203479)], null)));
});
frontend.handler.common.ignore_files = (function frontend$handler$common$ignore_files(pattern,paths){
return cljs_bean.core.__GT_clj(module$node_modules$ignore$index().add(pattern).filter(cljs_bean.core.__GT_js(paths)));
});
frontend.handler.common.safe_read_string = (function frontend$handler$common$safe_read_string(content,error_message_or_handler){
try{return cljs.reader.read_string.cljs$core$IFn$_invoke$arity$1(content);
}catch (e102615){var e = e102615;
console.error(e);

if(cljs.core.fn_QMARK_(error_message_or_handler)){
(error_message_or_handler.cljs$core$IFn$_invoke$arity$1 ? error_message_or_handler.cljs$core$IFn$_invoke$arity$1(e) : error_message_or_handler.call(null,e));
} else {
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([error_message_or_handler], 0));
}

return cljs.core.PersistentArrayMap.EMPTY;
}});
frontend.handler.common.listen_to_scroll_BANG_ = (function frontend$handler$common$listen_to_scroll_BANG_(element){
var _STAR_scroll_timer = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var on_scroll = (function (){
if(cljs.core.truth_(cljs.core.deref(_STAR_scroll_timer))){
clearTimeout(cljs.core.deref(_STAR_scroll_timer));
} else {
}

frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","scrolling?","ui/scrolling?",-365025943),true);

frontend.state.save_scroll_position_BANG_.cljs$core$IFn$_invoke$arity$1(frontend.util.scroll_top.cljs$core$IFn$_invoke$arity$0());

frontend.state.save_main_container_position_BANG_(frontend.handler.common.goog$module$goog$object.get(goog.dom.getElement("main-content-container"),"scrollTop"));

return cljs.core.reset_BANG_(_STAR_scroll_timer,setTimeout((function (){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("ui","scrolling?","ui/scrolling?",-365025943),false);
}),(500)));
});
var debounced_on_scroll = goog.functions.debounce(on_scroll,(100));
return element.addEventListener("scroll",debounced_on_scroll,false);
});

//# sourceMappingURL=frontend.handler.common.js.map
