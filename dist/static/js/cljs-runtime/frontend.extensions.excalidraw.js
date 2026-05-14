goog.provide('frontend.extensions.excalidraw');
goog.scope(function(){
  frontend.extensions.excalidraw.goog$module$goog$object = goog.module.get('goog.object');
});
var module$node_modules$$excalidraw$excalidraw$dist$excalidraw_production_min=shadow.js.require("module$node_modules$$excalidraw$excalidraw$dist$excalidraw_production_min", {});
frontend.extensions.excalidraw.excalidraw = frontend.rum.adapt_class.cljs$core$IFn$_invoke$arity$1(module$node_modules$$excalidraw$excalidraw$dist$excalidraw_production_min.Excalidraw);
frontend.extensions.excalidraw.from_json = (function frontend$extensions$excalidraw$from_json(text){
if(clojure.string.blank_QMARK_(text)){
return null;
} else {
try{return JSON.parse(text);
}catch (e131917){var e = e131917;
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["from json error:"], 0));

console.dir(e);

return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2((frontend.util.format.cljs$core$IFn$_invoke$arity$1 ? frontend.util.format.cljs$core$IFn$_invoke$arity$1("Could not load this invalid excalidraw file") : frontend.util.format.call(null,"Could not load this invalid excalidraw file")),new cljs.core.Keyword(null,"error","error",-978969032));
}}
});
frontend.extensions.excalidraw.update_draw_content_width = (function frontend$extensions$excalidraw$update_draw_content_width(state){
var temp__5804__auto__ = rum.core.dom_node(state);
if(cljs.core.truth_(temp__5804__auto__)){
var el = temp__5804__auto__;
var el_131950__$1 = el.querySelector(".draw-wrap");
while(true){
if((((el_131950__$1 == null)) || ((((void 0 === el_131950__$1)) || ((void 0 === el_131950__$1.classList)))))){
} else {
if(cljs.core.truth_(el_131950__$1.classList.contains("block-content"))){
var client_width_131951 = el_131950__$1.clientWidth;
var width_131952 = (((client_width_131951 === (0)))?el_131950__$1.getBoundingClientRect.width:client_width_131951);
cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.extensions.excalidraw","draw-width","frontend.extensions.excalidraw/draw-width",-681100043).cljs$core$IFn$_invoke$arity$1(state),width_131952);
} else {
var G__131953 = el_131950__$1.parentNode;
el_131950__$1 = G__131953;
continue;

}
}
break;
}

return state;
} else {
return null;
}
});
frontend.extensions.excalidraw.excalidraw_theme = (function frontend$extensions$excalidraw$excalidraw_theme(ui_theme){
return ui_theme;
});
frontend.extensions.excalidraw.draw_inner = rum.core.lazy_build(rum.core.build_defcs,(function (state,data,option){
var ref = rum.core.create_ref();
var _STAR_draw_width = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.extensions.excalidraw","draw-width","frontend.extensions.excalidraw/draw-width",-681100043));
var _STAR_zen_mode_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.extensions.excalidraw","zen-mode?","frontend.extensions.excalidraw/zen-mode?",1559773511));
var _STAR_view_mode_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.extensions.excalidraw","view-mode?","frontend.extensions.excalidraw/view-mode?",525380621));
var _STAR_grid_mode_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.extensions.excalidraw","grid-mode?","frontend.extensions.excalidraw/grid-mode?",-1189627787));
var wide_mode_QMARK_ = frontend.state.sub(new cljs.core.Keyword("ui","wide-mode?","ui/wide-mode?",-1881882061));
var _STAR_elements = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.extensions.excalidraw","elements","frontend.extensions.excalidraw/elements",1745667967));
var map__131918 = option;
var map__131918__$1 = cljs.core.__destructure_map(map__131918);
var file = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131918__$1,new cljs.core.Keyword(null,"file","file",-1269645878));
var block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__131918__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638));
if(cljs.core.truth_(data)){
return daiquiri.core.create_element("div",{'onPointerDown':(function (e){
return frontend.util.stop(e);
}),'className':"overflow-hidden"},[daiquiri.core.create_element("div",{'style':{'fontSize':(10)},'className':"my-1"},[daiquiri.core.create_element("a",{'onClick':frontend.handler.ui.toggle_wide_mode_BANG_,'className':"mr-2"},[daiquiri.interpreter.interpret((function (){var G__131921 = "Wide Mode (%s)";
var G__131922 = (cljs.core.truth_(wide_mode_QMARK_)?"ON":"OFF");
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__131921,G__131922) : frontend.util.format.call(null,G__131921,G__131922));
})())]),daiquiri.core.create_element("a",{'onClick':(function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_zen_mode_QMARK_,cljs.core.not);
}),'className':"mr-2"},[daiquiri.interpreter.interpret((function (){var G__131925 = "Zen Mode (%s)";
var G__131926 = (cljs.core.truth_(cljs.core.deref(_STAR_zen_mode_QMARK_))?"ON":"OFF");
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__131925,G__131926) : frontend.util.format.call(null,G__131925,G__131926));
})())]),daiquiri.core.create_element("a",{'onClick':(function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_view_mode_QMARK_,cljs.core.not);
}),'className':"mr-2"},[daiquiri.interpreter.interpret((function (){var G__131929 = "View Mode (%s)";
var G__131930 = (cljs.core.truth_(cljs.core.deref(_STAR_view_mode_QMARK_))?"ON":"OFF");
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__131929,G__131930) : frontend.util.format.call(null,G__131929,G__131930));
})())]),daiquiri.core.create_element("a",{'onClick':(function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_grid_mode_QMARK_,cljs.core.not);
}),'className':"mr-2"},[daiquiri.interpreter.interpret((function (){var G__131933 = "Grid Mode (%s)";
var G__131934 = (cljs.core.truth_(cljs.core.deref(_STAR_grid_mode_QMARK_))?"ON":"OFF");
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__131933,G__131934) : frontend.util.format.call(null,G__131933,G__131934));
})())]),daiquiri.core.create_element("a",{'onClick':(function (){
var temp__5804__auto__ = (function (){var G__131935 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (frontend.db.pull.cljs$core$IFn$_invoke$arity$1 ? frontend.db.pull.cljs$core$IFn$_invoke$arity$1(G__131935) : frontend.db.pull.call(null,G__131935));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var block = temp__5804__auto__;
return (frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword(null,"max","max",61366548)) : frontend.handler.editor.edit_block_BANG_.call(null,block,new cljs.core.Keyword(null,"max","max",61366548)));
} else {
return null;
}
}),'className':"mr-2"},["Edit Block"])]),daiquiri.core.create_element("div",{'ref':ref,'onPointerDown':(function (e){
frontend.util.stop(e);

return frontend.state.set_block_component_editing_mode_BANG_(true);
}),'onBlur':(function (){
return frontend.state.set_block_component_editing_mode_BANG_(false);
}),'style':{'width':cljs.core.deref(_STAR_draw_width),'height':(cljs.core.truth_(wide_mode_QMARK_)?(650):(500))},'className':"draw-wrap"},[daiquiri.interpreter.interpret((function (){var G__131940 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (elements,app_state,files){
if(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("down",frontend.extensions.excalidraw.goog$module$goog$object.get(app_state,"cursorButton"));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = frontend.extensions.excalidraw.goog$module$goog$object.get(app_state,"draggingElement");
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = frontend.extensions.excalidraw.goog$module$goog$object.get(app_state,"editingElement");
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = frontend.extensions.excalidraw.goog$module$goog$object.get(app_state,"editingGroupId");
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
return frontend.extensions.excalidraw.goog$module$goog$object.get(app_state,"editingLinearElement");
}
}
}
}
})())){
return null;
} else {
var elements__GT_clj = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(elements,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], null)], 0));
if(((cljs.core.seq(elements__GT_clj)) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(elements__GT_clj,cljs.core.deref(_STAR_elements))))){
cljs.core.reset_BANG_(_STAR_elements,elements__GT_clj);

return frontend.handler.draw.save_excalidraw_BANG_(file,module$node_modules$$excalidraw$excalidraw$dist$excalidraw_production_min.serializeAsJSON(elements,app_state,files,"local"));
} else {
return null;
}
}
}),new cljs.core.Keyword(null,"zen-mode-enabled","zen-mode-enabled",-955634269),cljs.core.deref(_STAR_zen_mode_QMARK_),new cljs.core.Keyword(null,"view-mode-enabled","view-mode-enabled",-588220561),cljs.core.deref(_STAR_view_mode_QMARK_),new cljs.core.Keyword(null,"grid-mode-enabled","grid-mode-enabled",584978327),cljs.core.deref(_STAR_grid_mode_QMARK_),new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (){
return rum.core.deref(ref).firstChild.focus();
}),new cljs.core.Keyword(null,"initial-data","initial-data",-1315709804),data,new cljs.core.Keyword(null,"theme","theme",-1247880880),frontend.extensions.excalidraw.excalidraw_theme(frontend.state.sub(new cljs.core.Keyword("ui","theme","ui/theme",-1247877132)))], null)], 0));
return (frontend.extensions.excalidraw.excalidraw.cljs$core$IFn$_invoke$arity$1 ? frontend.extensions.excalidraw.excalidraw.cljs$core$IFn$_invoke$arity$1(G__131940) : frontend.extensions.excalidraw.excalidraw.call(null,G__131940));
})())])]);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2((800),new cljs.core.Keyword("frontend.extensions.excalidraw","draw-width","frontend.extensions.excalidraw/draw-width",-681100043)),rum.core.local.cljs$core$IFn$_invoke$arity$2(true,new cljs.core.Keyword("frontend.extensions.excalidraw","zen-mode?","frontend.extensions.excalidraw/zen-mode?",1559773511)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.extensions.excalidraw","view-mode?","frontend.extensions.excalidraw/view-mode?",525380621)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.extensions.excalidraw","grid-mode?","frontend.extensions.excalidraw/grid-mode?",-1189627787)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.extensions.excalidraw","elements","frontend.extensions.excalidraw/elements",1745667967)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.extensions.excalidraw","resize-observer","frontend.extensions.excalidraw/resize-observer",1997499684)),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (state){
cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.extensions.excalidraw","resize-observer","frontend.extensions.excalidraw/resize-observer",1997499684).cljs$core$IFn$_invoke$arity$1(state),(new ResizeObserver(goog.functions.debounce((function (){
return cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.extensions.excalidraw","draw-width","frontend.extensions.excalidraw/draw-width",-681100043).cljs$core$IFn$_invoke$arity$1(state),(0));
}),(300)))));

cljs.core.deref(new cljs.core.Keyword("frontend.extensions.excalidraw","resize-observer","frontend.extensions.excalidraw/resize-observer",1997499684).cljs$core$IFn$_invoke$arity$1(state)).observe(frontend.ui.main_node());

return frontend.extensions.excalidraw.update_draw_content_width(state);
}),new cljs.core.Keyword(null,"did-update","did-update",-2143702256),frontend.extensions.excalidraw.update_draw_content_width,new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
return cljs.core.deref(new cljs.core.Keyword("frontend.extensions.excalidraw","resize-observer","frontend.extensions.excalidraw/resize-observer",1997499684).cljs$core$IFn$_invoke$arity$1(state)).disconnect();
})], null)], null),"frontend.extensions.excalidraw/draw-inner");
frontend.extensions.excalidraw.draw_container = rum.core.lazy_build(rum.core.build_defcs,(function (state,option){
var _STAR_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.extensions.excalidraw","data","frontend.extensions.excalidraw/data",-1371036113));
var _STAR_loading_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.extensions.excalidraw","loading?","frontend.extensions.excalidraw/loading?",-1335058663));
var loading_QMARK_ = rum.core.react(_STAR_loading_QMARK_);
var data = rum.core.react(_STAR_data);
var db_restoring_QMARK_ = frontend.state.sub(new cljs.core.Keyword("db","restoring?","db/restoring?",-1653366233));
if(cljs.core.truth_(new cljs.core.Keyword(null,"file","file",-1269645878).cljs$core$IFn$_invoke$arity$1(option))){
if(cljs.core.truth_(db_restoring_QMARK_)){
var attrs131941 = frontend.ui.loading.cljs$core$IFn$_invoke$arity$0();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs131941))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-center"], null)], null),attrs131941], 0))):{'className':"ls-center"}),((cljs.core.map_QMARK_(attrs131941))?null:[daiquiri.interpreter.interpret(attrs131941)]));
} else {
if(loading_QMARK_ === false){
return frontend.extensions.excalidraw.draw_inner(data,option);
} else {
return null;

}
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var vec__131942 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var option = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131942,(0),null);
var file = new cljs.core.Keyword(null,"file","file",-1269645878).cljs$core$IFn$_invoke$arity$1(option);
var _STAR_data = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var _STAR_loading_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(true);
if(cljs.core.truth_(file)){
frontend.handler.draw.load_excalidraw_file(file,(function (data){
var data__$1 = frontend.extensions.excalidraw.from_json(data);
cljs.core.reset_BANG_(_STAR_data,data__$1);

return cljs.core.reset_BANG_(_STAR_loading_QMARK_,false);
}));
} else {
}

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(state,new cljs.core.Keyword("frontend.extensions.excalidraw","data","frontend.extensions.excalidraw/data",-1371036113),_STAR_data,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.extensions.excalidraw","loading?","frontend.extensions.excalidraw/loading?",-1335058663),_STAR_loading_QMARK_], 0));
})], null)], null),"frontend.extensions.excalidraw/draw-container");
frontend.extensions.excalidraw.draw = rum.core.lazy_build(rum.core.build_defc,(function (option){
var repo = frontend.state.get_current_repo();
if(((frontend.config.local_file_based_graph_QMARK_(repo)) && (((cljs.core.not(frontend.util.electron_QMARK_())) && (cljs.core.not(frontend.mobile.util.native_platform_QMARK_())))))){
return null;
} else {
return frontend.extensions.excalidraw.draw_container(option);
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.extensions.excalidraw/draw");

//# sourceMappingURL=frontend.extensions.excalidraw.js.map
