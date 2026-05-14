goog.provide('frontend.extensions.pdf.core');

frontend.extensions.pdf.core._STAR_highlight_last_color = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"yellow","yellow",-881035449));
frontend.extensions.pdf.core.open_external_win_BANG_ = (function frontend$extensions$pdf$core$open_external_win_BANG_(pdf_current){
return frontend.extensions.pdf.windows.open_pdf_in_new_window_BANG_(frontend.extensions.pdf.core.system_embed_playground,pdf_current);
});
frontend.extensions.pdf.core.reset_current_pdf_BANG_ = (function frontend$extensions$pdf$core$reset_current_pdf_BANG_(){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("pdf","current","pdf/current",-1087936477),null);
});
frontend.extensions.pdf.core.pdf_highlight_finder = rum.core.lazy_build(rum.core.build_defcs,(function (state,viewer){
var _STAR_mounted_QMARK_ = new cljs.core.Keyword("frontend.extensions.pdf.core","mounted?","frontend.extensions.pdf.core/mounted?",1240414367).cljs$core$IFn$_invoke$arity$1(state);
if(cljs.core.truth_(viewer)){
var temp__5804__auto___134050 = frontend.state.sub(new cljs.core.Keyword("pdf","ref-highlight","pdf/ref-highlight",-1374529267));
if(cljs.core.truth_(temp__5804__auto___134050)){
var ref_hl_134051 = temp__5804__auto___134050;
setTimeout((function (){
if(cljs.core.truth_(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(ref_hl_134051))){
return frontend.extensions.pdf.utils.scroll_to_highlight(viewer,ref_hl_134051);
} else {
return (viewer.currentPageNumber = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$1(ref_hl_134051);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (1);
}
})());
}
}),(cljs.core.truth_(cljs.core.deref(_STAR_mounted_QMARK_))?(50):(500)));

setTimeout((function (){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("pdf","ref-highlight","pdf/ref-highlight",-1374529267),null);
}),(1000));
} else {
}
} else {
}

return daiquiri.interpreter.interpret(cljs.core.reset_BANG_(_STAR_mounted_QMARK_,true));
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$,rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.extensions.pdf.core","mounted?","frontend.extensions.pdf.core/mounted?",1240414367))], null),"frontend.extensions.pdf.core/pdf-highlight-finder");
frontend.extensions.pdf.core.pdf_page_finder = rum.core.lazy_build(rum.core.build_defc,(function (viewer){
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(viewer)){
var temp__5804__auto__ = new cljs.core.Keyword("pdf","current","pdf/current",-1087936477).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
if(cljs.core.truth_(temp__5804__auto__)){
var _ = temp__5804__auto__;
var active_hl = new cljs.core.Keyword("pdf","ref-highlight","pdf/ref-highlight",-1374529267).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
if(cljs.core.truth_(active_hl)){
return null;
} else {
return viewer.eventBus.on(cljs.core.name(new cljs.core.Keyword(null,"restore-last-page","restore-last-page",-1367707745)),(function (last_page){
if(cljs.core.truth_(last_page)){
return (viewer.currentPageNumber = frontend.util.safe_parse_int(last_page));
} else {
return null;
}
}));
}
} else {
return null;
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [viewer], null));

return null;
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.extensions.pdf.core/pdf-page-finder");
/**
 * Watches for changes in the pdf container's width and adjusts the viewer.
 */
frontend.extensions.pdf.core.pdf_resizer = rum.core.lazy_build(rum.core.build_defc,(function (viewer){
var el_ref = rum.core.use_ref(null);
var adjust_main_size_BANG_ = (function (){var G__133294 = (function (width){
var root_el = document.documentElement;
root_el.style.setProperty("--ph-view-container-width",width);

return (frontend.extensions.pdf.utils.adjust_viewer_size_BANG_.cljs$core$IFn$_invoke$arity$1 ? frontend.extensions.pdf.utils.adjust_viewer_size_BANG_.cljs$core$IFn$_invoke$arity$1(viewer) : frontend.extensions.pdf.utils.adjust_viewer_size_BANG_.call(null,viewer));
});
var G__133295 = (200);
return (frontend.util.debounce.cljs$core$IFn$_invoke$arity$2 ? frontend.util.debounce.cljs$core$IFn$_invoke$arity$2(G__133294,G__133295) : frontend.util.debounce.call(null,G__133294,G__133295));
})();
var group_id = viewer.$groupIdentity;
logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto___134057 = (function (){var and__5000__auto__ = cljs.core.fn_QMARK_(window.interact);
if(and__5000__auto__){
return rum.core.deref(el_ref);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto___134057)){
var el_134058 = temp__5804__auto___134057;
interact(el_134058).draggable(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"listeners","listeners",394544445),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"move","move",-2110884309),(function (e){
var width = document.documentElement.clientWidth;
var offset = e.rect.left;
var el_ratio = (offset / width).toFixed((6));
var target_el = document.getElementById(["pdf-layout-container_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(group_id)].join(''));
if(cljs.core.truth_(target_el)){
var width__$1 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var x__5090__auto__ = (function (){var x__5087__auto__ = (el_ratio * (100));
var y__5088__auto__ = (20);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var y__5091__auto__ = (80);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})()),"vw"].join('');
target_el.style.setProperty("width",width__$1);

return (adjust_main_size_BANG_.cljs$core$IFn$_invoke$arity$1 ? adjust_main_size_BANG_.cljs$core$IFn$_invoke$arity$1(width__$1) : adjust_main_size_BANG_.call(null,width__$1));
} else {
return null;
}
})], null)], null))).styleCursor(false).on("dragstart",(function (){
return document.documentElement.classList.add("is-resizing-buf");
})).on("dragend",(function (){
return document.documentElement.classList.remove("is-resizing-buf");
}));
} else {
}

return (function (){
return cljs.core.List.EMPTY;
});
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("span",{'ref':el_ref,'className':"extensions__pdf-resizer"},[]);
}),null,"frontend.extensions.pdf.core/pdf-resizer");
/**
 * The contextual menu which appears over a text selection and allows e.g. creating a highlight.
 */
frontend.extensions.pdf.core.pdf_highlights_ctx_menu = rum.core.lazy_build(rum.core.build_defc,(function (viewer,p__133316,p__133317){
var map__133318 = p__133316;
var map__133318__$1 = cljs.core.__destructure_map(map__133318);
var highlight = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133318__$1,new cljs.core.Keyword(null,"highlight","highlight",-800930873));
var point = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133318__$1,new cljs.core.Keyword(null,"point","point",1813198264));
var selection = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133318__$1,new cljs.core.Keyword(null,"selection","selection",975998651));
var map__133319 = p__133317;
var map__133319__$1 = cljs.core.__destructure_map(map__133319);
var clear_ctx_menu_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133319__$1,new cljs.core.Keyword(null,"clear-ctx-menu!","clear-ctx-menu!",1081183125));
var add_hl_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133319__$1,new cljs.core.Keyword(null,"add-hl!","add-hl!",-832546833));
var upd_hl_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133319__$1,new cljs.core.Keyword(null,"upd-hl!","upd-hl!",-275023274));
var del_hl_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133319__$1,new cljs.core.Keyword(null,"del-hl!","del-hl!",-703533207));
logseq.shui.hooks.use_effect_BANG_((function (){
var cb = (function (){
return (clear_ctx_menu_BANG_.cljs$core$IFn$_invoke$arity$0 ? clear_ctx_menu_BANG_.cljs$core$IFn$_invoke$arity$0() : clear_ctx_menu_BANG_.call(null));
});
var doc = frontend.extensions.pdf.windows.resolve_own_document(viewer);
setTimeout((function (){
return doc.addEventListener("click",cb);
}));

return (function (){
return doc.removeEventListener("click",cb);
});
}),cljs.core.PersistentVector.EMPTY);

var _STAR_el = rum.core.use_ref(null);
var cnt = viewer.container;
var body = (function (){var G__133329 = cnt.ownerDocument;
if((G__133329 == null)){
return null;
} else {
return G__133329.body;
}
})();
var key_alt_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((function (){var G__133333 = body;
var G__133333__$1 = (((G__133333 == null))?null:G__133333.dataset);
if((G__133333__$1 == null)){
return null;
} else {
return G__133333__$1.activeKeystroke;
}
})(),"Alt");
var head_height = (0);
var top = ((new cljs.core.Keyword(null,"y","y",-1757859776).cljs$core$IFn$_invoke$arity$1(point) + cnt.scrollTop) - head_height);
var left = (new cljs.core.Keyword(null,"x","x",2099068185).cljs$core$IFn$_invoke$arity$1(point) + cnt.scrollLeft);
var id = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(highlight);
var new_QMARK_ = (id == null);
var new__AMPERSAND__highlight_mode_QMARK_ = (function (){var and__5000__auto__ = cljs.core.deref(frontend.extensions.pdf.toolbar._STAR_highlight_mode_QMARK_);
if(cljs.core.truth_(and__5000__auto__)){
return new_QMARK_;
} else {
return and__5000__auto__;
}
})();
var show_ctx_menu_QMARK_ = (function (){var and__5000__auto__ = cljs.core.not(new__AMPERSAND__highlight_mode_QMARK_);
if(and__5000__auto__){
var or__5002__auto__ = cljs.core.not(selection);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto____$1 = selection;
if(cljs.core.truth_(and__5000__auto____$1)){
var or__5002__auto____$1 = frontend.state.sub(new cljs.core.Keyword("pdf","auto-open-ctx-menu?","pdf/auto-open-ctx-menu?",-1579137381));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return key_alt_QMARK_;
}
} else {
return and__5000__auto____$1;
}
}
} else {
return and__5000__auto__;
}
})();
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(highlight);
var area_QMARK_ = (!(clojure.string.blank_QMARK_(new cljs.core.Keyword(null,"image","image",-58725096).cljs$core$IFn$_invoke$arity$1(content))));
var action_fn_BANG_ = (function (action,clear_QMARK_){
var temp__5804__auto__ = (function (){var and__5000__auto__ = action;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.name(action);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var action__$1 = temp__5804__auto__;
var highlight_134064__$1 = ((cljs.core.fn_QMARK_(highlight))?(highlight.cljs$core$IFn$_invoke$arity$0 ? highlight.cljs$core$IFn$_invoke$arity$0() : highlight.call(null)):highlight);
var content_134065__$1 = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(highlight_134064__$1);
var owner_win_134066 = frontend.extensions.pdf.windows.resolve_own_window(viewer);
var G__133343_134067 = action__$1;
switch (G__133343_134067) {
case "ref":
frontend.extensions.pdf.assets.copy_hl_ref_BANG_(highlight_134064__$1,viewer);

break;
case "copy":
frontend.util.copy_to_clipboard_BANG_.cljs$core$IFn$_invoke$arity$variadic((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(content_134065__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.extensions.pdf.utils.fix_selection_text_breakline(selection.toString());
}
})(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"owner-window","owner-window",-2139116435),owner_win_134066], 0));

frontend.extensions.pdf.utils.clear_all_selection.cljs$core$IFn$_invoke$arity$0();

break;
case "link":
frontend.extensions.pdf.assets.goto_block_ref_BANG_(highlight_134064__$1);

break;
case "del":
(del_hl_BANG_.cljs$core$IFn$_invoke$arity$1 ? del_hl_BANG_.cljs$core$IFn$_invoke$arity$1(highlight_134064__$1) : del_hl_BANG_.call(null,highlight_134064__$1));

frontend.extensions.pdf.assets.del_ref_block_BANG_(highlight_134064__$1);

frontend.extensions.pdf.assets.unlink_hl_area_image$(viewer,new cljs.core.Keyword("pdf","current","pdf/current",-1087936477).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),highlight_134064__$1);

break;
case "hook":

break;
default:
var properties_134070 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),action__$1], null);
if(cljs.core.not(id)){
var highlight_134076__$2 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([highlight_134064__$1,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),frontend.extensions.pdf.utils.gen_uuid(),new cljs.core.Keyword(null,"properties","properties",685819552),properties_134070], null)], 0));
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((add_hl_BANG_.cljs$core$IFn$_invoke$arity$1 ? add_hl_BANG_.cljs$core$IFn$_invoke$arity$1(highlight_134076__$2) : add_hl_BANG_.call(null,highlight_134076__$2))),(function (highlight_SINGLEQUOTE_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.pdf.utils.clear_all_selection.cljs$core$IFn$_invoke$arity$1(owner_win_134066)),(function (___41611__auto__){
return promesa.protocols._promise(frontend.extensions.pdf.assets.copy_hl_ref_BANG_(highlight_SINGLEQUOTE_,viewer));
}));
}));
}));
} else {
var G__133358_134077 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(highlight_134064__$1,new cljs.core.Keyword(null,"properties","properties",685819552),properties_134070);
(upd_hl_BANG_.cljs$core$IFn$_invoke$arity$1 ? upd_hl_BANG_.cljs$core$IFn$_invoke$arity$1(G__133358_134077) : upd_hl_BANG_.call(null,G__133358_134077));
}

cljs.core.reset_BANG_(frontend.extensions.pdf.core._STAR_highlight_last_color,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(action__$1));

}

var and__5000__auto__ = clear_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return setTimeout((function (){
return (clear_ctx_menu_BANG_.cljs$core$IFn$_invoke$arity$0 ? clear_ctx_menu_BANG_.cljs$core$IFn$_invoke$arity$0() : clear_ctx_menu_BANG_.call(null));
}),(68));
} else {
return and__5000__auto__;
}
} else {
return null;
}
});
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(new__AMPERSAND__highlight_mode_QMARK_)){
setTimeout((function (){
return action_fn_BANG_(cljs.core.deref(frontend.extensions.pdf.core._STAR_highlight_last_color),true);
}),(300));
} else {
var el_134080 = rum.core.deref(_STAR_el);
var map__133363_134081 = frontend.util.calc_delta_rect_offset(el_134080,el_134080.closest(".extensions__pdf-viewer"));
var map__133363_134082__$1 = cljs.core.__destructure_map(map__133363_134081);
var x_134083 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133363_134082__$1,new cljs.core.Keyword(null,"x","x",2099068185));
var y_134084 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133363_134082__$1,new cljs.core.Keyword(null,"y","y",-1757859776));
(el_134080.style.transform = ["translate3d(",cljs.core.str.cljs$core$IFn$_invoke$arity$1((((x_134083 < (0)))?(x_134083 - (5)):(0))),"px,",cljs.core.str.cljs$core$IFn$_invoke$arity$1((((y_134084 < (0)))?(y_134084 - (5)):(0))),"px",",0)"].join(''));
}

return (function (){
return cljs.core.List.EMPTY;
});
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("ul",{'ref':_STAR_el,'style':{'top':top,'left':left,'visibility':(cljs.core.truth_(show_ctx_menu_QMARK_)?"visible":"hidden")},'onClick':(function (e){
e.stopPropagation();

var temp__5804__auto__ = e.target.dataset.action;
if(cljs.core.truth_(temp__5804__auto__)){
var action = temp__5804__auto__;
return action_fn_BANG_(action,true);
} else {
return null;
}
}),'className':"extensions__pdf-hls-ctx-menu"},[daiquiri.core.create_element("li",{'className':"item-colors"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$extensions$pdf$core$iter__133371(s__133372){
return (new cljs.core.LazySeq(null,(function (){
var s__133372__$1 = s__133372;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__133372__$1);
if(temp__5804__auto__){
var s__133372__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__133372__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__133372__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__133374 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__133373 = (0);
while(true){
if((i__133373 < size__5479__auto__)){
var it = cljs.core._nth(c__5478__auto__,i__133373);
cljs.core.chunk_append(b__133374,daiquiri.core.create_element("a",{'key':it,'data-color':it,'data-action':it},[daiquiri.interpreter.interpret(it)]));

var G__134088 = (i__133373 + (1));
i__133373 = G__134088;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__133374),frontend$extensions$pdf$core$iter__133371(cljs.core.chunk_rest(s__133372__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__133374),null);
}
} else {
var it = cljs.core.first(s__133372__$2);
return cljs.core.cons(daiquiri.core.create_element("a",{'key':it,'data-color':it,'data-action':it},[daiquiri.interpreter.interpret(it)]),frontend$extensions$pdf$core$iter__133371(cljs.core.rest(s__133372__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["yellow","red","green","blue","purple"], null));
})())]),daiquiri.interpreter.interpret((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.item","li.item",1019267471),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-action","data-action",821237678),"ref"], null),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("pdf","copy-ref","pdf/copy-ref",1111581184)], 0))], null);
} else {
return and__5000__auto__;
}
})()),daiquiri.interpreter.interpret((function (){var and__5000__auto__ = (!(area_QMARK_));
if(and__5000__auto__){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.item","li.item",1019267471),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-action","data-action",821237678),"copy"], null),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("pdf","copy-text","pdf/copy-text",-1645704266)], 0))], null);
} else {
return and__5000__auto__;
}
})()),daiquiri.interpreter.interpret((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.item","li.item",1019267471),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-action","data-action",821237678),"link"], null),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("pdf","linked-ref","pdf/linked-ref",-925157547)], 0))], null);
} else {
return and__5000__auto__;
}
})()),daiquiri.interpreter.interpret((function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.item","li.item",1019267471),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-action","data-action",821237678),"del"], null),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"delete","delete",-1768633620)], 0))], null);
} else {
return and__5000__auto__;
}
})()),(cljs.core.truth_((function (){var and__5000__auto__ = frontend.config.lsp_enabled_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (!(area_QMARK_));
} else {
return and__5000__auto__;
}
})())?cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$extensions$pdf$core$iter__133398(s__133399){
return (new cljs.core.LazySeq(null,(function (){
var s__133399__$1 = s__133399;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__133399__$1);
if(temp__5804__auto__){
var s__133399__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__133399__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__133399__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__133401 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__133400 = (0);
while(true){
if((i__133400 < size__5479__auto__)){
var vec__133406 = cljs.core._nth(c__5478__auto__,i__133400);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133406,(0),null);
var map__133409 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133406,(1),null);
var map__133409__$1 = cljs.core.__destructure_map(map__133409);
var _cmd = map__133409__$1;
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133409__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133409__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var extras = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133409__$1,new cljs.core.Keyword(null,"extras","extras",-1110348066));
var action = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133406,(2),null);
var pid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133406,(3),null);
cljs.core.chunk_append(b__133401,daiquiri.core.create_element("li",{'key':key,'data-action':"hook",'onClick':((function (i__133400,vec__133406,_,map__133409,map__133409__$1,_cmd,key,label,extras,action,pid,c__5478__auto__,size__5479__auto__,b__133401,s__133399__$2,temp__5804__auto__,_STAR_el,cnt,body,key_alt_QMARK_,head_height,top,left,id,new_QMARK_,new__AMPERSAND__highlight_mode_QMARK_,show_ctx_menu_QMARK_,content,area_QMARK_,action_fn_BANG_,map__133318,map__133318__$1,highlight,point,selection,map__133319,map__133319__$1,clear_ctx_menu_BANG_,add_hl_BANG_,upd_hl_BANG_,del_hl_BANG_){
return (function (){
var highlight__$1 = ((cljs.core.fn_QMARK_(highlight))?(highlight.cljs$core$IFn$_invoke$arity$0 ? highlight.cljs$core$IFn$_invoke$arity$0() : highlight.call(null)):highlight);
frontend.commands.exec_plugin_simple_command_BANG_(pid,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),key,new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(highlight__$1),new cljs.core.Keyword(null,"point","point",1813198264),point], null),action);

if(new cljs.core.Keyword(null,"clearSelection","clearSelection",839903009).cljs$core$IFn$_invoke$arity$1(extras) === true){
return frontend.extensions.pdf.utils.clear_all_selection.cljs$core$IFn$_invoke$arity$0();
} else {
return null;
}
});})(i__133400,vec__133406,_,map__133409,map__133409__$1,_cmd,key,label,extras,action,pid,c__5478__auto__,size__5479__auto__,b__133401,s__133399__$2,temp__5804__auto__,_STAR_el,cnt,body,key_alt_QMARK_,head_height,top,left,id,new_QMARK_,new__AMPERSAND__highlight_mode_QMARK_,show_ctx_menu_QMARK_,content,area_QMARK_,action_fn_BANG_,map__133318,map__133318__$1,highlight,point,selection,map__133319,map__133319__$1,clear_ctx_menu_BANG_,add_hl_BANG_,upd_hl_BANG_,del_hl_BANG_))
,'className':"item"},[daiquiri.interpreter.interpret(label)]));

var G__134109 = (i__133400 + (1));
i__133400 = G__134109;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__133401),frontend$extensions$pdf$core$iter__133398(cljs.core.chunk_rest(s__133399__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__133401),null);
}
} else {
var vec__133421 = cljs.core.first(s__133399__$2);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133421,(0),null);
var map__133424 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133421,(1),null);
var map__133424__$1 = cljs.core.__destructure_map(map__133424);
var _cmd = map__133424__$1;
var key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133424__$1,new cljs.core.Keyword(null,"key","key",-1516042587));
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133424__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var extras = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133424__$1,new cljs.core.Keyword(null,"extras","extras",-1110348066));
var action = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133421,(2),null);
var pid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133421,(3),null);
return cljs.core.cons(daiquiri.core.create_element("li",{'key':key,'data-action':"hook",'onClick':((function (vec__133421,_,map__133424,map__133424__$1,_cmd,key,label,extras,action,pid,s__133399__$2,temp__5804__auto__,_STAR_el,cnt,body,key_alt_QMARK_,head_height,top,left,id,new_QMARK_,new__AMPERSAND__highlight_mode_QMARK_,show_ctx_menu_QMARK_,content,area_QMARK_,action_fn_BANG_,map__133318,map__133318__$1,highlight,point,selection,map__133319,map__133319__$1,clear_ctx_menu_BANG_,add_hl_BANG_,upd_hl_BANG_,del_hl_BANG_){
return (function (){
var highlight__$1 = ((cljs.core.fn_QMARK_(highlight))?(highlight.cljs$core$IFn$_invoke$arity$0 ? highlight.cljs$core$IFn$_invoke$arity$0() : highlight.call(null)):highlight);
frontend.commands.exec_plugin_simple_command_BANG_(pid,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),key,new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(highlight__$1),new cljs.core.Keyword(null,"point","point",1813198264),point], null),action);

if(new cljs.core.Keyword(null,"clearSelection","clearSelection",839903009).cljs$core$IFn$_invoke$arity$1(extras) === true){
return frontend.extensions.pdf.utils.clear_all_selection.cljs$core$IFn$_invoke$arity$0();
} else {
return null;
}
});})(vec__133421,_,map__133424,map__133424__$1,_cmd,key,label,extras,action,pid,s__133399__$2,temp__5804__auto__,_STAR_el,cnt,body,key_alt_QMARK_,head_height,top,left,id,new_QMARK_,new__AMPERSAND__highlight_mode_QMARK_,show_ctx_menu_QMARK_,content,area_QMARK_,action_fn_BANG_,map__133318,map__133318__$1,highlight,point,selection,map__133319,map__133319__$1,clear_ctx_menu_BANG_,add_hl_BANG_,upd_hl_BANG_,del_hl_BANG_))
,'className':"item"},[daiquiri.interpreter.interpret(label)]),frontend$extensions$pdf$core$iter__133398(cljs.core.rest(s__133399__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(frontend.state.get_plugins_commands_with_type(new cljs.core.Keyword(null,"highlight-context-menu-item","highlight-context-menu-item",494511872)));
})()):null)]);
}),null,"frontend.extensions.pdf.core/pdf-highlights-ctx-menu");
frontend.extensions.pdf.core.pdf_highlights_text_region = rum.core.lazy_build(rum.core.build_defc,(function (viewer,vw_hl,hl,p__133440){
var map__133441 = p__133440;
var map__133441__$1 = cljs.core.__destructure_map(map__133441);
var show_ctx_menu_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133441__$1,new cljs.core.Keyword(null,"show-ctx-menu!","show-ctx-menu!",-29500810));
var map__133445 = hl;
var map__133445__$1 = cljs.core.__destructure_map(map__133445);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133445__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var map__133446 = new cljs.core.Keyword(null,"position","position",-2011731912).cljs$core$IFn$_invoke$arity$1(vw_hl);
var map__133446__$1 = cljs.core.__destructure_map(map__133446);
var rects = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133446__$1,new cljs.core.Keyword(null,"rects","rects",1714526167));
var map__133447 = new cljs.core.Keyword(null,"properties","properties",685819552).cljs$core$IFn$_invoke$arity$1(hl);
var map__133447__$1 = cljs.core.__destructure_map(map__133447);
var color = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133447__$1,new cljs.core.Keyword(null,"color","color",1011675173));
var open_ctx_menu_BANG_ = (function (e){
e.preventDefault();

var x = e.clientX;
var y = e.clientY;
var G__133450 = viewer;
var G__133451 = hl;
var G__133452 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"x","x",2099068185),x,new cljs.core.Keyword(null,"y","y",-1757859776),y], null);
return (show_ctx_menu_BANG_.cljs$core$IFn$_invoke$arity$3 ? show_ctx_menu_BANG_.cljs$core$IFn$_invoke$arity$3(G__133450,G__133451,G__133452) : show_ctx_menu_BANG_.call(null,G__133450,G__133451,G__133452));
});
var dragstart_handle_BANG_ = (function (e){
var temp__5804__auto__ = (function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return e.dataTransfer;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var dt = temp__5804__auto__;
cljs.core.reset_BANG_(frontend.components.block._STAR_dragging_QMARK_,true);

frontend.extensions.pdf.assets.ensure_ref_block_BANG_(frontend.state.get_current_pdf(),hl,null);

return dt.setData("text/plain",["((",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),"))"].join(''));
} else {
return null;
}
});
return daiquiri.core.create_element("div",{'id':["hl_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join(''),'onClick':open_ctx_menu_BANG_,'onContextMenu':open_ctx_menu_BANG_,'className':"extensions__pdf-hls-text-region"},[daiquiri.interpreter.interpret(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,rect){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.hls-text-region-item","div.hls-text-region-item",-1046800817),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"key","key",-1516042587),idx,new cljs.core.Keyword(null,"style","style",-496642736),rect,new cljs.core.Keyword(null,"draggable","draggable",1676206163),"true",new cljs.core.Keyword(null,"on-drag-start","on-drag-start",-47712205),dragstart_handle_BANG_,new cljs.core.Keyword(null,"data-color","data-color",-1132407184),color], null)], null);
}),rects))]);
}),null,"frontend.extensions.pdf.core/pdf-highlights-text-region");
frontend.extensions.pdf.core.pdf_highlight_area_region = rum.core.lazy_build(rum.core.build_defc,(function (viewer,vw_hl,hl,p__133482){
var map__133483 = p__133482;
var map__133483__$1 = cljs.core.__destructure_map(map__133483);
var ops = map__133483__$1;
var show_ctx_menu_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133483__$1,new cljs.core.Keyword(null,"show-ctx-menu!","show-ctx-menu!",-29500810));
var map__133484 = hl;
var map__133484__$1 = cljs.core.__destructure_map(map__133484);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133484__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var _STAR_el = rum.core.use_ref(null);
var _STAR_dirty = rum.core.use_ref(null);
var _STAR_ops_ref = rum.core.use_ref(ops);
var open_ctx_menu_BANG_ = (function (e){
e.preventDefault();

if(cljs.core.truth_(rum.core.deref(_STAR_dirty))){
return null;
} else {
var x = e.clientX;
var y = e.clientY;
var G__133489 = viewer;
var G__133490 = hl;
var G__133491 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"x","x",2099068185),x,new cljs.core.Keyword(null,"y","y",-1757859776),y], null);
return (show_ctx_menu_BANG_.cljs$core$IFn$_invoke$arity$3 ? show_ctx_menu_BANG_.cljs$core$IFn$_invoke$arity$3(G__133489,G__133490,G__133491) : show_ctx_menu_BANG_.call(null,G__133489,G__133490,G__133491));
}
});
var dragstart_handle_BANG_ = (function (e){
var temp__5804__auto__ = (function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return e.dataTransfer;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var dt = temp__5804__auto__;
return dt.setData("text/plain",["((",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),"))"].join(''));
} else {
return null;
}
});
var update_hl_BANG_ = (function (hl__$1){
var G__133492 = rum.core.deref(_STAR_ops_ref);
var G__133492__$1 = (((G__133492 == null))?null:new cljs.core.Keyword(null,"upd-hl!","upd-hl!",-275023274).cljs$core$IFn$_invoke$arity$1(G__133492));
if((G__133492__$1 == null)){
return null;
} else {
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__133492__$1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [hl__$1], null));
}
});
logseq.shui.hooks.use_effect_BANG_((function (){
return rum.core.set_ref_BANG_(_STAR_ops_ref,ops);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [ops], null));

logseq.shui.hooks.use_effect_BANG_((function (){
var el = rum.core.deref(_STAR_el);
var it = interact(el).resizable(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"edges","edges",-694791395),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"left","left",-399115937),true,new cljs.core.Keyword(null,"right","right",-452581833),true,new cljs.core.Keyword(null,"top","top",-1856271961),true,new cljs.core.Keyword(null,"bottom","bottom",-1550509018),true], null),new cljs.core.Keyword(null,"listeners","listeners",394544445),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"start","start",-355208981),(function (_e){
return rum.core.set_ref_BANG_(_STAR_dirty,true);
}),new cljs.core.Keyword(null,"end","end",-268185958),(function (e){
var vw_pos = new cljs.core.Keyword(null,"position","position",-2011731912).cljs$core$IFn$_invoke$arity$1(vw_hl);
var target = e.target;
var vw_rect = e.rect;
var vec__133494 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__133473_SHARP_){
var val = target.getAttribute(["data-",cljs.core.name(p1__133473_SHARP_)].join(''));
if((!((val == null)))){
return parseFloat(val);
} else {
return (0);
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"x","x",2099068185),new cljs.core.Keyword(null,"y","y",-1757859776)], null));
var dx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133494,(0),null);
var dy = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133494,(1),null);
var to_top = (cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(vw_pos,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"bounding","bounding",-2125178263),new cljs.core.Keyword(null,"top","top",-1856271961)], null)) + dy);
var to_left = (cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(vw_pos,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"bounding","bounding",-2125178263),new cljs.core.Keyword(null,"left","left",-399115937)], null)) + dx);
var to_w = vw_rect.width;
var to_h = vw_rect.height;
var to_vw_pos = cljs.core.update.cljs$core$IFn$_invoke$arity$variadic(vw_pos,new cljs.core.Keyword(null,"bounding","bounding",-2125178263),cljs.core.assoc,new cljs.core.Keyword(null,"top","top",-1856271961),to_top,new cljs.core.Keyword(null,"left","left",-399115937),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([to_left,new cljs.core.Keyword(null,"width","width",-384071477),to_w,new cljs.core.Keyword(null,"height","height",1025178622),to_h], 0));
var to_sc_pos = frontend.extensions.pdf.utils.vw_to_scaled_pos(viewer,to_vw_pos);
var hl_SINGLEQUOTE__134125 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(hl,new cljs.core.Keyword(null,"position","position",-2011731912),to_sc_pos);
var hl_SINGLEQUOTE__134126__$1 = cljs.core.assoc_in(hl_SINGLEQUOTE__134125,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"image","image",-58725096)], null),Date.now());
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.pdf.assets.persist_hl_area_image$(viewer,new cljs.core.Keyword("pdf","current","pdf/current",-1087936477).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),hl_SINGLEQUOTE__134126__$1,hl,new cljs.core.Keyword(null,"bounding","bounding",-2125178263).cljs$core$IFn$_invoke$arity$1(to_vw_pos))),(function (result){
return promesa.protocols._promise(setTimeout((function (){
(target.style.transform = "translate(0, 0)");

target.removeAttribute("data-x");

target.removeAttribute("data-y");

var hl_SINGLEQUOTE___$2 = ((datascript.impl.entity.entity_QMARK_(result))?cljs.core.assoc_in(hl_SINGLEQUOTE__134126__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"image","image",-58725096)], null),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(result)):hl_SINGLEQUOTE__134126__$1);
return update_hl_BANG_(hl_SINGLEQUOTE___$2);
}),(200)));
}));
}));

return setTimeout((function (){
return rum.core.set_ref_BANG_(_STAR_dirty,false);
}));
}),new cljs.core.Keyword(null,"move","move",-2110884309),(function (e){
var target = e.target;
var x = target.getAttribute("data-x");
var y = target.getAttribute("data-y");
var bx = (((!((x == null))))?parseFloat(x):(0));
var by = (((!((y == null))))?parseFloat(y):(0));
(target.style.width = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(e.rect.width),"px"].join(''));

(target.style.height = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(e.rect.height),"px"].join(''));

var ax = (bx + e.deltaRect.left);
var ay = (by + e.deltaRect.top);
(target.style.transform = ["translate(",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ax),"px, ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ay),"px)"].join(''));

target.setAttribute("data-x",ax);

return target.setAttribute("data-y",ay);
})], null),new cljs.core.Keyword(null,"modifiers","modifiers",50378834),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [interact.modifiers.restrict(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"restriction","restriction",-1380234912),el.closest(".page")], null)))], null),new cljs.core.Keyword(null,"inertia","inertia",-1478343701),true], null)));
return (function (){
return it.unset();
});
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [hl], null));

return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(vw_hl,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"position","position",-2011731912),new cljs.core.Keyword(null,"bounding","bounding",-2125178263)], null));
if(cljs.core.truth_(temp__5804__auto__)){
var vw_bounding = temp__5804__auto__;
var map__133528 = new cljs.core.Keyword(null,"properties","properties",685819552).cljs$core$IFn$_invoke$arity$1(hl);
var map__133528__$1 = cljs.core.__destructure_map(map__133528);
var color = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133528__$1,new cljs.core.Keyword(null,"color","color",1011675173));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.extensions__pdf-hls-area-region","div.extensions__pdf-hls-area-region",-850888181),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"id","id",-1388402092),["hl_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join(''),new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_el,new cljs.core.Keyword(null,"style","style",-496642736),vw_bounding,new cljs.core.Keyword(null,"data-color","data-color",-1132407184),color,new cljs.core.Keyword(null,"draggable","draggable",1676206163),"true",new cljs.core.Keyword(null,"on-drag-start","on-drag-start",-47712205),dragstart_handle_BANG_,new cljs.core.Keyword(null,"on-click","on-click",1632826543),open_ctx_menu_BANG_,new cljs.core.Keyword(null,"on-context-menu","on-context-menu",-1330744340),open_ctx_menu_BANG_], null)], null);
} else {
return null;
}
})());
}),null,"frontend.extensions.pdf.core/pdf-highlight-area-region");
/**
 * Displays the highlights over a pdf document.
 */
frontend.extensions.pdf.core.pdf_highlights_region_container = rum.core.lazy_build(rum.core.build_defc,(function (viewer,page_hls,ops){
return daiquiri.core.create_element("div",{'className':"hls-region-container"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$extensions$pdf$core$iter__133540(s__133541){
return (new cljs.core.LazySeq(null,(function (){
var s__133541__$1 = s__133541;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__133541__$1);
if(temp__5804__auto__){
var s__133541__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__133541__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__133541__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__133543 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__133542 = (0);
while(true){
if((i__133542 < size__5479__auto__)){
var hl = cljs.core._nth(c__5478__auto__,i__133542);
cljs.core.chunk_append(b__133543,(function (){var vw_hl = cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(hl,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"position","position",-2011731912)], null),((function (i__133542,hl,c__5478__auto__,size__5479__auto__,b__133543,s__133541__$2,temp__5804__auto__){
return (function (p1__133534_SHARP_){
return frontend.extensions.pdf.utils.scaled_to_vw_pos(viewer,p1__133534_SHARP_);
});})(i__133542,hl,c__5478__auto__,size__5479__auto__,b__133543,s__133541__$2,temp__5804__auto__))
);
return rum.core.with_key((cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(hl,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"image","image",-58725096)], null)))?frontend.extensions.pdf.core.pdf_highlight_area_region(viewer,vw_hl,hl,ops):frontend.extensions.pdf.core.pdf_highlights_text_region(viewer,vw_hl,hl,ops)),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(hl));
})());

var G__134127 = (i__133542 + (1));
i__133542 = G__134127;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__133543),frontend$extensions$pdf$core$iter__133540(cljs.core.chunk_rest(s__133541__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__133543),null);
}
} else {
var hl = cljs.core.first(s__133541__$2);
return cljs.core.cons((function (){var vw_hl = cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(hl,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"position","position",-2011731912)], null),((function (hl,s__133541__$2,temp__5804__auto__){
return (function (p1__133534_SHARP_){
return frontend.extensions.pdf.utils.scaled_to_vw_pos(viewer,p1__133534_SHARP_);
});})(hl,s__133541__$2,temp__5804__auto__))
);
return rum.core.with_key((cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(hl,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"image","image",-58725096)], null)))?frontend.extensions.pdf.core.pdf_highlight_area_region(viewer,vw_hl,hl,ops):frontend.extensions.pdf.core.pdf_highlights_text_region(viewer,vw_hl,hl,ops)),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(hl));
})(),frontend$extensions$pdf$core$iter__133540(cljs.core.rest(s__133541__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(page_hls);
})())]);
}),null,"frontend.extensions.pdf.core/pdf-highlights-region-container");
frontend.extensions.pdf.core.pdf_highlight_area_selection = rum.core.lazy_build(rum.core.build_defc,(function (viewer,p__133563){
var map__133564 = p__133563;
var map__133564__$1 = cljs.core.__destructure_map(map__133564);
var show_ctx_menu_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133564__$1,new cljs.core.Keyword(null,"show-ctx-menu!","show-ctx-menu!",-29500810));
var viewer_clt = viewer.viewer.classList;
var cnt_el = viewer.container;
var _STAR_el = rum.core.use_ref(null);
var _STAR_start_el = rum.core.use_ref(null);
var _STAR_cnt_rect = rum.core.use_ref(null);
var _STAR_page_el = rum.core.use_ref(null);
var _STAR_page_rect = rum.core.use_ref(null);
var _STAR_start_xy = rum.core.use_ref(null);
var vec__133567 = rum.core.use_state(null);
var start = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133567,(0),null);
var set_start_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133567,(1),null);
var vec__133570 = rum.core.use_state(null);
var end = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133570,(0),null);
var set_end_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133570,(1),null);
var vec__133573 = frontend.rum.use_atom(frontend.extensions.pdf.toolbar._STAR_area_mode_QMARK_);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133573,(0),null);
var set_area_mode_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133573,(1),null);
var should_start = (function (e){
var target = e.target;
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(target.classList.contains("extensions__pdf-hls-area-region"));
if(and__5000__auto__){
return target.closest(".page");
} else {
return and__5000__auto__;
}
})())){
var and__5000__auto__ = e;
if(cljs.core.truth_(and__5000__auto__)){
var or__5002__auto__ = e.metaKey;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = e.shiftKey;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.core.deref(frontend.extensions.pdf.toolbar._STAR_area_mode_QMARK_);
}
}
} else {
return and__5000__auto__;
}
} else {
return null;
}
});
var reset_coords_BANG_ = (function (){
(set_start_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_start_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_start_BANG_.call(null,null));

(set_end_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_end_BANG_.cljs$core$IFn$_invoke$arity$1(null) : set_end_BANG_.call(null,null));

rum.core.set_ref_BANG_(_STAR_start_xy,null);

rum.core.set_ref_BANG_(_STAR_start_el,null);

rum.core.set_ref_BANG_(_STAR_cnt_rect,null);

rum.core.set_ref_BANG_(_STAR_page_el,null);

return rum.core.set_ref_BANG_(_STAR_page_rect,null);
});
var calc_coords_BANG_ = (function (page_x,page_y){
if(cljs.core.truth_(cnt_el)){
var cnt_rect = rum.core.deref(_STAR_cnt_rect);
var cnt_rect__$1 = (function (){var or__5002__auto__ = cnt_rect;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs_bean.core.__GT_clj(cnt_el.getBoundingClientRect().toJSON());
}
})();
var page_rect = rum.core.deref(_STAR_page_rect);
var vec__133588 = rum.core.deref(_STAR_start_xy);
var start_x = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133588,(0),null);
var start_y = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133588,(1),null);
var dx_left_QMARK_ = (start_x > page_x);
var dy_top_QMARK_ = (start_y > page_y);
var page_left = new cljs.core.Keyword(null,"left","left",-399115937).cljs$core$IFn$_invoke$arity$1(page_rect);
var page_right = new cljs.core.Keyword(null,"right","right",-452581833).cljs$core$IFn$_invoke$arity$1(page_rect);
var page_top = new cljs.core.Keyword(null,"top","top",-1856271961).cljs$core$IFn$_invoke$arity$1(page_rect);
var page_bottom = new cljs.core.Keyword(null,"bottom","bottom",-1550509018).cljs$core$IFn$_invoke$arity$1(page_rect);
var ___$1 = rum.core.set_ref_BANG_(_STAR_cnt_rect,cnt_rect__$1);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"x","x",2099068185),((function (p1__133558_SHARP_){
if(dx_left_QMARK_){
if((p1__133558_SHARP_ < page_left)){
return page_left;
} else {
return p1__133558_SHARP_;
}
} else {
if((p1__133558_SHARP_ > page_right)){
return page_right;
} else {
return p1__133558_SHARP_;
}
}
})(page_x) + cnt_el.scrollLeft),new cljs.core.Keyword(null,"y","y",-1757859776),((function (p1__133559_SHARP_){
if(dy_top_QMARK_){
if((p1__133559_SHARP_ < page_top)){
return page_top;
} else {
return p1__133559_SHARP_;
}
} else {
if((p1__133559_SHARP_ > page_bottom)){
return page_bottom;
} else {
return p1__133559_SHARP_;
}
}
})(page_y) + cnt_el.scrollTop)], null);
} else {
return null;
}
});
var calc_rect = (function (start__$1,end__$1){
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"left","left",-399115937),(function (){var x__5090__auto__ = new cljs.core.Keyword(null,"x","x",2099068185).cljs$core$IFn$_invoke$arity$1(start__$1);
var y__5091__auto__ = new cljs.core.Keyword(null,"x","x",2099068185).cljs$core$IFn$_invoke$arity$1(end__$1);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})(),new cljs.core.Keyword(null,"top","top",-1856271961),(function (){var x__5090__auto__ = new cljs.core.Keyword(null,"y","y",-1757859776).cljs$core$IFn$_invoke$arity$1(start__$1);
var y__5091__auto__ = new cljs.core.Keyword(null,"y","y",-1757859776).cljs$core$IFn$_invoke$arity$1(end__$1);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})(),new cljs.core.Keyword(null,"width","width",-384071477),Math.abs((new cljs.core.Keyword(null,"x","x",2099068185).cljs$core$IFn$_invoke$arity$1(end__$1) - new cljs.core.Keyword(null,"x","x",2099068185).cljs$core$IFn$_invoke$arity$1(start__$1))),new cljs.core.Keyword(null,"height","height",1025178622),Math.abs((new cljs.core.Keyword(null,"y","y",-1757859776).cljs$core$IFn$_invoke$arity$1(end__$1) - new cljs.core.Keyword(null,"y","y",-1757859776).cljs$core$IFn$_invoke$arity$1(start__$1)))], null);
});
var disable_text_selection_BANG_ = (function (p1__133560_SHARP_){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(viewer_clt,(cljs.core.truth_(p1__133560_SHARP_)?"add":"remove"),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["disabled-text-selection"], 0));
});
var fn_move = logseq.shui.hooks.use_callback((function (e){
var G__133594 = calc_coords_BANG_(e.pageX,e.pageY);
return (set_end_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_end_BANG_.cljs$core$IFn$_invoke$arity$1(G__133594) : set_end_BANG_.call(null,G__133594));
}),cljs.core.PersistentVector.EMPTY);
logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = cnt_el;
if(cljs.core.truth_(temp__5804__auto__)){
var root = temp__5804__auto__;
var fn_start = (function (e){
if(cljs.core.truth_(should_start(e))){
var target = e.target;
var page_el = target.closest(".page");
var vec__133597 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [e.pageX,e.pageY], null);
var x = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133597,(0),null);
var y = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133597,(1),null);
rum.core.set_ref_BANG_(_STAR_start_el,target);

rum.core.set_ref_BANG_(_STAR_start_xy,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [x,y], null));

rum.core.set_ref_BANG_(_STAR_page_el,page_el);

rum.core.set_ref_BANG_(_STAR_page_rect,(function (){var G__133601 = page_el;
var G__133601__$1 = (((G__133601 == null))?null:G__133601.getBoundingClientRect());
var G__133601__$2 = (((G__133601__$1 == null))?null:G__133601__$1.toJSON());
if((G__133601__$2 == null)){
return null;
} else {
return cljs_bean.core.__GT_clj(G__133601__$2);
}
})());

var G__133602_134135 = calc_coords_BANG_(x,y);
(set_start_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_start_BANG_.cljs$core$IFn$_invoke$arity$1(G__133602_134135) : set_start_BANG_.call(null,G__133602_134135));

disable_text_selection_BANG_(true);

return root.addEventListener("mousemove",fn_move);
} else {
reset_coords_BANG_();

return disable_text_selection_BANG_(false);
}
});
var fn_end = (function (e){
var temp__5804__auto____$1 = rum.core.deref(_STAR_start_el);
if(cljs.core.truth_(temp__5804__auto____$1)){
var start_el = temp__5804__auto____$1;
var end_134137__$1 = calc_coords_BANG_(e.pageX,e.pageY);
var rect_134138 = calc_rect(start,end_134137__$1);
if((((new cljs.core.Keyword(null,"width","width",-384071477).cljs$core$IFn$_invoke$arity$1(rect_134138) > (10))) && ((new cljs.core.Keyword(null,"height","height",1025178622).cljs$core$IFn$_invoke$arity$1(rect_134138) > (10))))){
var temp__5804__auto___134139__$2 = start_el.closest(".page");
if(cljs.core.truth_(temp__5804__auto___134139__$2)){
var page_el_134140 = temp__5804__auto___134139__$2;
var page_number_134141 = (page_el_134140.dataset.pageNumber | (0));
var page_pos_134142 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rect_134138,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"top","top",-1856271961),(new cljs.core.Keyword(null,"top","top",-1856271961).cljs$core$IFn$_invoke$arity$1(rect_134138) - page_el_134140.offsetTop),new cljs.core.Keyword(null,"left","left",-399115937),(new cljs.core.Keyword(null,"left","left",-399115937).cljs$core$IFn$_invoke$arity$1(rect_134138) - page_el_134140.offsetLeft)], null)], 0));
var vw_pos_134143 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"bounding","bounding",-2125178263),page_pos_134142,new cljs.core.Keyword(null,"rects","rects",1714526167),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"page","page",849072397),page_number_134141], null);
var sc_pos_134144 = frontend.extensions.pdf.utils.vw_to_scaled_pos(viewer,vw_pos_134143);
var point_134145 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"x","x",2099068185),e.clientX,new cljs.core.Keyword(null,"y","y",-1757859776),e.clientY], null);
var hl_134146 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),null,new cljs.core.Keyword(null,"page","page",849072397),page_number_134141,new cljs.core.Keyword(null,"position","position",-2011731912),sc_pos_134144,new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"text","text",-1790561697),"",new cljs.core.Keyword(null,"image","image",-58725096),Date.now()], null),new cljs.core.Keyword(null,"properties","properties",685819552),cljs.core.PersistentArrayMap.EMPTY], null);
var G__133608_134149 = viewer;
var G__133609_134150 = hl_134146;
var G__133610_134151 = point_134145;
var G__133611_134152 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"reset-fn","reset-fn",-690887550),(function (){
return reset_coords_BANG_();
})], null);
(show_ctx_menu_BANG_.cljs$core$IFn$_invoke$arity$4 ? show_ctx_menu_BANG_.cljs$core$IFn$_invoke$arity$4(G__133608_134149,G__133609_134150,G__133610_134151,G__133611_134152) : show_ctx_menu_BANG_.call(null,G__133608_134149,G__133609_134150,G__133610_134151,G__133611_134152));

(set_area_mode_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_area_mode_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_area_mode_BANG_.call(null,false));
} else {
}
} else {
reset_coords_BANG_();
}

disable_text_selection_BANG_(false);

return root.removeEventListener("mousemove",fn_move);
} else {
return null;
}
});
var G__133613_134153 = root;
G__133613_134153.addEventListener("mousedown",fn_start);

G__133613_134153.addEventListener("mouseup",fn_end,({"once": true}));


return (function (){
var G__133614 = root;
G__133614.removeEventListener("mousedown",fn_start);

G__133614.removeEventListener("mouseup",fn_end);

return G__133614;
});
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [start], null));

return daiquiri.core.create_element("div",{'ref':_STAR_el,'className':"extensions__pdf-area-selection"},[(cljs.core.truth_((function (){var and__5000__auto__ = start;
if(cljs.core.truth_(and__5000__auto__)){
return end;
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("div",{'style':daiquiri.interpreter.element_attributes(calc_rect(start,end)),'className':"shadow-rect"},[]):null)]);
}),null,"frontend.extensions.pdf.core/pdf-highlight-area-selection");
frontend.extensions.pdf.core.pdf_highlights = rum.core.lazy_build(rum.core.build_defc,(function (el,viewer,initial_hls,loaded_pages,p__133654){
var map__133655 = p__133654;
var map__133655__$1 = cljs.core.__destructure_map(map__133655);
var set_dirty_hls_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133655__$1,new cljs.core.Keyword(null,"set-dirty-hls!","set-dirty-hls!",-1468393512));
var doc = el.ownerDocument;
var win = doc.defaultView;
var _STAR_mounted = rum.core.use_ref(false);
var vec__133656 = rum.core.use_state(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"selection","selection",975998651),null,new cljs.core.Keyword(null,"range","range",1639692286),null,new cljs.core.Keyword(null,"collapsed","collapsed",-628494523),null,new cljs.core.Keyword(null,"point","point",1813198264),null], null));
var sel_state = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133656,(0),null);
var set_sel_state_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133656,(1),null);
var vec__133659 = rum.core.use_state(initial_hls);
var highlights = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133659,(0),null);
var set_highlights_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133659,(1),null);
var vec__133662 = rum.core.use_state(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"highlight","highlight",-800930873),null,new cljs.core.Keyword(null,"vw-pos","vw-pos",1025034976),null,new cljs.core.Keyword(null,"selection","selection",975998651),null,new cljs.core.Keyword(null,"point","point",1813198264),null,new cljs.core.Keyword(null,"reset-fn","reset-fn",-690887550),null], null));
var ctx_menu_state = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133662,(0),null);
var set_ctx_menu_state_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133662,(1),null);
var clear_ctx_menu_BANG_ = logseq.shui.hooks.use_callback((function (){
var reset_fn = new cljs.core.Keyword(null,"reset-fn","reset-fn",-690887550).cljs$core$IFn$_invoke$arity$1(ctx_menu_state);
var G__133668_134155 = cljs.core.PersistentArrayMap.EMPTY;
(set_ctx_menu_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_ctx_menu_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__133668_134155) : set_ctx_menu_state_BANG_.call(null,G__133668_134155));

var and__5000__auto__ = cljs.core.fn_QMARK_(reset_fn);
if(and__5000__auto__){
return (reset_fn.cljs$core$IFn$_invoke$arity$0 ? reset_fn.cljs$core$IFn$_invoke$arity$0() : reset_fn.call(null));
} else {
return and__5000__auto__;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [ctx_menu_state], null));
var show_ctx_menu_BANG_ = (function() { 
var G__134156__delegate = function (viewer__$1,hl,point,ops){
var vw_pos = frontend.extensions.pdf.utils.scaled_to_vw_pos(viewer__$1,new cljs.core.Keyword(null,"position","position",-2011731912).cljs$core$IFn$_invoke$arity$1(hl));
var G__133672 = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.merge,cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"highlight","highlight",-800930873),hl,new cljs.core.Keyword(null,"vw-pos","vw-pos",1025034976),vw_pos,new cljs.core.Keyword(null,"point","point",1813198264),point], null),ops));
return (set_ctx_menu_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_ctx_menu_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__133672) : set_ctx_menu_state_BANG_.call(null,G__133672));
};
var G__134156 = function (viewer__$1,hl,point,var_args){
var ops = null;
if (arguments.length > 3) {
var G__134157__i = 0, G__134157__a = new Array(arguments.length -  3);
while (G__134157__i < G__134157__a.length) {G__134157__a[G__134157__i] = arguments[G__134157__i + 3]; ++G__134157__i;}
  ops = new cljs.core.IndexedSeq(G__134157__a,0,null);
} 
return G__134156__delegate.call(this,viewer__$1,hl,point,ops);};
G__134156.cljs$lang$maxFixedArity = 3;
G__134156.cljs$lang$applyTo = (function (arglist__134158){
var viewer__$1 = cljs.core.first(arglist__134158);
arglist__134158 = cljs.core.next(arglist__134158);
var hl = cljs.core.first(arglist__134158);
arglist__134158 = cljs.core.next(arglist__134158);
var point = cljs.core.first(arglist__134158);
var ops = cljs.core.rest(arglist__134158);
return G__134156__delegate(viewer__$1,hl,point,ops);
});
G__134156.cljs$core$IFn$_invoke$arity$variadic = G__134156__delegate;
return G__134156;
})()
;
var add_hl_BANG_ = (function (hl){
if(cljs.core.truth_(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(hl))){
var highlights__$1 = frontend.extensions.pdf.utils.fix_nested_js(highlights);
var highlights_SINGLEQUOTE_ = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(highlights__$1,hl);
(set_highlights_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_highlights_BANG_.cljs$core$IFn$_invoke$arity$1(highlights_SINGLEQUOTE_) : set_highlights_BANG_.call(null,highlights_SINGLEQUOTE_));

var temp__5802__auto__ = (function (){var and__5000__auto__ = frontend.extensions.pdf.assets.area_highlight_QMARK_(hl);
if(cljs.core.truth_(and__5000__auto__)){
return frontend.extensions.pdf.utils.scaled_to_vw_pos(viewer,new cljs.core.Keyword(null,"position","position",-2011731912).cljs$core$IFn$_invoke$arity$1(hl));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var vw_pos = temp__5802__auto__;
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.pdf.assets.persist_hl_area_image$(viewer,new cljs.core.Keyword("pdf","current","pdf/current",-1087936477).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)),hl,null,new cljs.core.Keyword(null,"bounding","bounding",-2125178263).cljs$core$IFn$_invoke$arity$1(vw_pos))),(function (result){
return promesa.protocols._promise(((datascript.impl.entity.entity_QMARK_(result))?(function (){var hl_SINGLEQUOTE_ = cljs.core.assoc_in(hl,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"image","image",-58725096)], null),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(result));
var G__133679_134159 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (hl__$1){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(hl__$1),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(hl_SINGLEQUOTE_))){
return hl_SINGLEQUOTE_;
} else {
return hl__$1;
}
}),highlights_SINGLEQUOTE_);
(set_highlights_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_highlights_BANG_.cljs$core$IFn$_invoke$arity$1(G__133679_134159) : set_highlights_BANG_.call(null,G__133679_134159));

return hl_SINGLEQUOTE_;
})():(function(){throw (new Error(["[pdf] unexpected persist asset image return:",cljs.core.str.cljs$core$IFn$_invoke$arity$1(result)].join('')))})()));
}));
})),(function (e){
return console.error(e);
}));
} else {
return hl;
}
} else {
return null;
}
});
var upd_hl_BANG_ = (function (hl){
var highlights__$1 = frontend.extensions.pdf.utils.fix_nested_js(highlights);
var temp__5804__auto__ = medley.core.find_first.cljs$core$IFn$_invoke$arity$2((function (p1__133626_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(cljs.core.second(p1__133626_SHARP_)),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(hl));
}),medley.core.indexed.cljs$core$IFn$_invoke$arity$1(highlights__$1));
if(cljs.core.truth_(temp__5804__auto__)){
var vec__133686 = temp__5804__auto__;
var target_idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133686,(0),null);
var G__133689_134160 = cljs.core.assoc_in(highlights__$1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [target_idx], null),hl);
(set_highlights_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_highlights_BANG_.cljs$core$IFn$_invoke$arity$1(G__133689_134160) : set_highlights_BANG_.call(null,G__133689_134160));

return frontend.extensions.pdf.assets.update_hl_block_BANG_(hl);
} else {
return null;
}
});
var del_hl_BANG_ = (function (hl){
var temp__5804__auto__ = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(hl);
if(cljs.core.truth_(temp__5804__auto__)){
var id = temp__5804__auto__;
var G__133690 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__133628_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p1__133628_SHARP_));
}),highlights));
return (set_highlights_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_highlights_BANG_.cljs$core$IFn$_invoke$arity$1(G__133690) : set_highlights_BANG_.call(null,G__133690));
} else {
return null;
}
});
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(rum.core.deref(_STAR_mounted))){
return (set_dirty_hls_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_dirty_hls_BANG_.cljs$core$IFn$_invoke$arity$1(highlights) : set_dirty_hls_BANG_.call(null,highlights));
} else {
return rum.core.set_ref_BANG_(_STAR_mounted,true);
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [highlights], null));

logseq.shui.hooks.use_effect_BANG_((function (){
var fn_selection_ok = (function (e){
var selection = doc.getSelection();
var sel_range = selection.getRangeAt((0));
if(cljs.core.truth_(selection.isCollapsed)){
var G__133695 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"collapsed","collapsed",-628494523),true], null);
return (set_sel_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sel_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__133695) : set_sel_state_BANG_.call(null,G__133695));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = sel_range;
if(cljs.core.truth_(and__5000__auto__)){
return el.contains(sel_range.commonAncestorContainer);
} else {
return and__5000__auto__;
}
})())){
var G__133696 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"collapsed","collapsed",-628494523),false,new cljs.core.Keyword(null,"selection","selection",975998651),selection,new cljs.core.Keyword(null,"range","range",1639692286),sel_range,new cljs.core.Keyword(null,"point","point",1813198264),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"x","x",2099068185),e.clientX,new cljs.core.Keyword(null,"y","y",-1757859776),e.clientY], null)], null);
return (set_sel_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sel_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__133696) : set_sel_state_BANG_.call(null,G__133696));
} else {
return null;
}
}
});
var fn_selection = (function (){
var _STAR_dirty = cljs.core.volatile_BANG_(false);
var fn_dirty = (function (){
return cljs.core.vreset_BANG_(_STAR_dirty,true);
});
doc.addEventListener("selectionchange",fn_dirty);

return doc.addEventListener("mouseup",(function (e){
var and__5000__auto___134172 = cljs.core.deref(_STAR_dirty);
if(cljs.core.truth_(and__5000__auto___134172)){
fn_selection_ok(e);
} else {
}

return doc.removeEventListener("selectionchange",fn_dirty);
}),({"once": true}));
});
var fn_resize = cljs.core.partial.cljs$core$IFn$_invoke$arity$2(frontend.extensions.pdf.utils.adjust_viewer_size_BANG_,viewer);
if(cljs.core.truth_(el)){
el.addEventListener("mousedown",fn_selection);
} else {
}

if(cljs.core.truth_(win)){
win.addEventListener("resize",fn_resize);
} else {
}

return (function (){
if(cljs.core.truth_(el)){
el.removeEventListener("mousedown",fn_selection);
} else {
}

if(cljs.core.truth_(win)){
return win.removeEventListener("resize",fn_resize);
} else {
return null;
}
});
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [viewer], null));

logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = (function (){var and__5000__auto__ = cljs.core.not(new cljs.core.Keyword(null,"collapsed","collapsed",-628494523).cljs$core$IFn$_invoke$arity$1(sel_state));
if(and__5000__auto__){
return new cljs.core.Keyword(null,"range","range",1639692286).cljs$core$IFn$_invoke$arity$1(sel_state);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var sel_range = temp__5804__auto__;
var point_134176 = new cljs.core.Keyword(null,"point","point",1813198264).cljs$core$IFn$_invoke$arity$1(sel_state);
var selection_134177 = new cljs.core.Keyword(null,"selection","selection",975998651).cljs$core$IFn$_invoke$arity$1(sel_state);
var hl_fn_134178 = (function (){
var temp__5804__auto____$1 = frontend.extensions.pdf.utils.get_page_from_range(sel_range);
if(cljs.core.truth_(temp__5804__auto____$1)){
var page_info = temp__5804__auto____$1;
var temp__5804__auto____$2 = frontend.extensions.pdf.utils.get_range_rects_LT__page_cnt(sel_range,new cljs.core.Keyword(null,"page-el","page-el",-124721580).cljs$core$IFn$_invoke$arity$1(page_info));
if(cljs.core.truth_(temp__5804__auto____$2)){
var sel_rects = temp__5804__auto____$2;
var page = (new cljs.core.Keyword(null,"page-number","page-number",556880104).cljs$core$IFn$_invoke$arity$1(page_info) | (0));
var bounding = frontend.extensions.pdf.utils.get_bounding_rect(sel_rects);
var vw_pos = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"bounding","bounding",-2125178263),bounding,new cljs.core.Keyword(null,"rects","rects",1714526167),sel_rects,new cljs.core.Keyword(null,"page","page",849072397),page], null);
var sc_pos = frontend.extensions.pdf.utils.vw_to_scaled_pos(viewer,vw_pos);
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),null,new cljs.core.Keyword(null,"page","page",849072397),page,new cljs.core.Keyword(null,"position","position",-2011731912),sc_pos,new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"text","text",-1790561697),frontend.extensions.pdf.utils.fix_selection_text_breakline(selection_134177.toString())], null),new cljs.core.Keyword(null,"properties","properties",685819552),cljs.core.PersistentArrayMap.EMPTY], null);
} else {
return null;
}
} else {
return null;
}
});
setTimeout((function (){
var G__133703 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"highlight","highlight",-800930873),hl_fn_134178,new cljs.core.Keyword(null,"selection","selection",975998651),selection_134177,new cljs.core.Keyword(null,"point","point",1813198264),point_134176], null);
return (set_ctx_menu_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_ctx_menu_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__133703) : set_ctx_menu_state_BANG_.call(null,G__133703));
}));

return (0);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"range","range",1639692286).cljs$core$IFn$_invoke$arity$1(sel_state)], null));

logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto___134181 = (function (){var and__5000__auto__ = cljs.core.sequential_QMARK_(highlights);
if(and__5000__auto__){
return cljs.core.group_by(new cljs.core.Keyword(null,"page","page",849072397),highlights);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto___134181)){
var grouped_hls_134182 = temp__5804__auto___134181;
var seq__133707_134183 = cljs.core.seq(loaded_pages);
var chunk__133708_134184 = null;
var count__133709_134185 = (0);
var i__133710_134186 = (0);
while(true){
if((i__133710_134186 < count__133709_134185)){
var page_134187 = chunk__133708_134184.cljs$core$IIndexed$_nth$arity$2(null,i__133710_134186);
var temp__5804__auto___134188__$1 = frontend.extensions.pdf.utils.resolve_hls_layer_BANG_(viewer,page_134187);
if(cljs.core.truth_(temp__5804__auto___134188__$1)){
var hls_layer_134189 = temp__5804__auto___134188__$1;
var page_hls_134190 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(grouped_hls_134182,page_134187);
var hls_render_134191 = frontend.extensions.pdf.core.pdf_highlights_region_container(viewer,page_hls_134190,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"show-ctx-menu!","show-ctx-menu!",-29500810),show_ctx_menu_BANG_,new cljs.core.Keyword(null,"upd-hl!","upd-hl!",-275023274),upd_hl_BANG_], null));
var mounted_root_134192 = hls_layer_134189.mountedRoot;
if((mounted_root_134192 == null)){
(hls_layer_134189.mountedRoot = rum.core.mount(hls_render_134191,hls_layer_134189));
} else {
mounted_root_134192.render(hls_render_134191);
}
} else {
}


var G__134194 = seq__133707_134183;
var G__134195 = chunk__133708_134184;
var G__134196 = count__133709_134185;
var G__134197 = (i__133710_134186 + (1));
seq__133707_134183 = G__134194;
chunk__133708_134184 = G__134195;
count__133709_134185 = G__134196;
i__133710_134186 = G__134197;
continue;
} else {
var temp__5804__auto___134199__$1 = cljs.core.seq(seq__133707_134183);
if(temp__5804__auto___134199__$1){
var seq__133707_134200__$1 = temp__5804__auto___134199__$1;
if(cljs.core.chunked_seq_QMARK_(seq__133707_134200__$1)){
var c__5525__auto___134201 = cljs.core.chunk_first(seq__133707_134200__$1);
var G__134202 = cljs.core.chunk_rest(seq__133707_134200__$1);
var G__134203 = c__5525__auto___134201;
var G__134204 = cljs.core.count(c__5525__auto___134201);
var G__134205 = (0);
seq__133707_134183 = G__134202;
chunk__133708_134184 = G__134203;
count__133709_134185 = G__134204;
i__133710_134186 = G__134205;
continue;
} else {
var page_134206 = cljs.core.first(seq__133707_134200__$1);
var temp__5804__auto___134207__$2 = frontend.extensions.pdf.utils.resolve_hls_layer_BANG_(viewer,page_134206);
if(cljs.core.truth_(temp__5804__auto___134207__$2)){
var hls_layer_134208 = temp__5804__auto___134207__$2;
var page_hls_134209 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(grouped_hls_134182,page_134206);
var hls_render_134210 = frontend.extensions.pdf.core.pdf_highlights_region_container(viewer,page_hls_134209,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"show-ctx-menu!","show-ctx-menu!",-29500810),show_ctx_menu_BANG_,new cljs.core.Keyword(null,"upd-hl!","upd-hl!",-275023274),upd_hl_BANG_], null));
var mounted_root_134211 = hls_layer_134208.mountedRoot;
if((mounted_root_134211 == null)){
(hls_layer_134208.mountedRoot = rum.core.mount(hls_render_134210,hls_layer_134208));
} else {
mounted_root_134211.render(hls_render_134210);
}
} else {
}


var G__134212 = cljs.core.next(seq__133707_134200__$1);
var G__134213 = null;
var G__134214 = (0);
var G__134215 = (0);
seq__133707_134183 = G__134212;
chunk__133708_134184 = G__134213;
count__133709_134185 = G__134214;
i__133710_134186 = G__134215;
continue;
}
} else {
}
}
break;
}
} else {
}

return (function (){
return cljs.core.List.EMPTY;
});
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [loaded_pages,highlights], null));

return daiquiri.core.create_element("div",{'className':"extensions__pdf-highlights-cnt"},[(function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"highlight","highlight",-800930873).cljs$core$IFn$_invoke$arity$1(ctx_menu_state);
if(cljs.core.truth_(temp__5804__auto__)){
var _hl = temp__5804__auto__;
return ReactDOM.createPortal(frontend.extensions.pdf.core.pdf_highlights_ctx_menu(viewer,ctx_menu_state,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"clear-ctx-menu!","clear-ctx-menu!",1081183125),clear_ctx_menu_BANG_,new cljs.core.Keyword(null,"add-hl!","add-hl!",-832546833),add_hl_BANG_,new cljs.core.Keyword(null,"del-hl!","del-hl!",-703533207),del_hl_BANG_,new cljs.core.Keyword(null,"upd-hl!","upd-hl!",-275023274),upd_hl_BANG_], null)),el.querySelector(".pp-holder"));
} else {
return null;
}
})(),frontend.extensions.pdf.core.pdf_page_finder(viewer),frontend.extensions.pdf.core.pdf_highlight_area_selection(viewer,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"clear-ctx-menu!","clear-ctx-menu!",1081183125),clear_ctx_menu_BANG_,new cljs.core.Keyword(null,"show-ctx-menu!","show-ctx-menu!",-29500810),show_ctx_menu_BANG_,new cljs.core.Keyword(null,"add-hl!","add-hl!",-832546833),add_hl_BANG_], null))]);
}),null,"frontend.extensions.pdf.core/pdf-highlights");
frontend.extensions.pdf.core.pdf_viewer = rum.core.lazy_build(rum.core.build_defc,(function (_url,pdf_document,p__133723,ops){
var map__133724 = p__133723;
var map__133724__$1 = cljs.core.__destructure_map(map__133724);
var identity = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133724__$1,new cljs.core.Keyword(null,"identity","identity",1647396035));
var filename = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133724__$1,new cljs.core.Keyword(null,"filename","filename",-1428840783));
var initial_hls = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133724__$1,new cljs.core.Keyword(null,"initial-hls","initial-hls",-344014820));
var initial_page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133724__$1,new cljs.core.Keyword(null,"initial-page","initial-page",1974282031));
var initial_error = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133724__$1,new cljs.core.Keyword(null,"initial-error","initial-error",-1070014476));
var _STAR_el_ref = rum.core.create_ref();
var vec__133725 = rum.core.use_state(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"viewer","viewer",-783949853),null,new cljs.core.Keyword(null,"bus","bus",-1090873603),null,new cljs.core.Keyword(null,"link","link",-1769163468),null,new cljs.core.Keyword(null,"el","el",-1618201118),null], null));
var state = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133725,(0),null);
var set_state_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133725,(1),null);
var vec__133728 = rum.core.use_state(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"loaded-pages","loaded-pages",1539616565),cljs.core.PersistentVector.EMPTY], null));
var ano_state = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133728,(0),null);
var set_ano_state_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133728,(1),null);
var vec__133731 = rum.core.use_state(false);
var page_ready_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133731,(0),null);
var set_page_ready_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133731,(1),null);
var vec__133734 = frontend.rum.use_atom(frontend.extensions.pdf.toolbar._STAR_area_dashed_QMARK_);
var area_dashed_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133734,(0),null);
var _set_area_dashed_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133734,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
var event_bus = (new pdfjsViewer.EventBus());
var link_service = (new pdfjsViewer.PDFLinkService(({"eventBus": event_bus, "externalLinkTarget": (2)})));
var el = rum.core.deref(_STAR_el_ref);
var viewer = (new pdfjsViewer.PDFViewer(({"container": el, "eventBus": event_bus, "linkService": link_service, "findController": (new pdfjsViewer.PDFFindController(({"linkService": link_service, "eventBus": event_bus}))), "textLayerMode": (2), "annotationMode": (2), "removePageBorders": true})));
var in_system_win_QMARK_ = cljs.core.boolean$(el.closest(".is-system-window"));
(viewer.$groupIdentity = identity);

(viewer.$inSystemWindow = in_system_win_QMARK_);

link_service.setDocument(pdf_document);

link_service.setViewer(viewer);

var G__133740_134221 = event_bus;
G__133740_134221.on("pagesinit",(function (){
(viewer.currentScaleValue = "auto");

return (set_page_ready_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_page_ready_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_page_ready_BANG_.call(null,true));
}));

G__133740_134221.on(cljs.core.name(new cljs.core.Keyword(null,"ls-update-extra-state","ls-update-extra-state",893479284)),(function (p1__133718_SHARP_){
var temp__5804__auto__ = cljs_bean.core.__GT_clj(p1__133718_SHARP_);
if(cljs.core.truth_(temp__5804__auto__)){
var extra = temp__5804__auto__;
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"set-hls-extra!","set-hls-extra!",2055356477).cljs$core$IFn$_invoke$arity$1(ops),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [extra], null));
} else {
return null;
}
}));


promesa.core.then.cljs$core$IFn$_invoke$arity$2(viewer.setDocument(pdf_document),(function (){
var G__133742 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"viewer","viewer",-783949853),viewer,new cljs.core.Keyword(null,"bus","bus",-1090873603),event_bus,new cljs.core.Keyword(null,"link","link",-1769163468),link_service,new cljs.core.Keyword(null,"el","el",-1618201118),el], null);
return (set_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__133742) : set_state_BANG_.call(null,G__133742));
}));

(window.lsActivePdfViewer = viewer);

setTimeout((function (){
return (viewer.currentPageNumber = initial_page);
}),(16));

return (function (){
pdf_document.destroy();

(window.lsActivePdfViewer = null);

return viewer.cleanup();
});
}),cljs.core.PersistentVector.EMPTY);

logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = new cljs.core.Keyword(null,"viewer","viewer",-783949853).cljs$core$IFn$_invoke$arity$1(state);
if(cljs.core.truth_(temp__5804__auto__)){
var viewer = temp__5804__auto__;
if(cljs.core.truth_(frontend.extensions.pdf.windows.check_viewer_in_system_win_QMARK_(viewer))){
var G__133743 = frontend.extensions.pdf.windows.resolve_own_document(viewer);
if((G__133743 == null)){
return null;
} else {
return (G__133743.title = filename);
}
} else {
return null;
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"viewer","viewer",-783949853).cljs$core$IFn$_invoke$arity$1(state)], null));

logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = new cljs.core.Keyword(null,"viewer","viewer",-783949853).cljs$core$IFn$_invoke$arity$1(state);
if(cljs.core.truth_(temp__5804__auto__)){
var viewer = temp__5804__auto__;
var fn_textlayer_ready = (function (p){
var G__133744 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"loaded-pages","loaded-pages",1539616565),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"loaded-pages","loaded-pages",1539616565).cljs$core$IFn$_invoke$arity$1(ano_state),(p.pageNumber | (0)))], null);
return (set_ano_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_ano_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__133744) : set_ano_state_BANG_.call(null,G__133744));
});
var G__133745_134227 = viewer.eventBus;
G__133745_134227.on("textlayerrendered",fn_textlayer_ready);


return (function (){
var G__133747 = viewer.eventBus;
G__133747.off("textlayerrendered",fn_textlayer_ready);

return G__133747;
});
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"viewer","viewer",-783949853).cljs$core$IFn$_invoke$arity$1(state),new cljs.core.Keyword(null,"loaded-pages","loaded-pages",1539616565).cljs$core$IFn$_invoke$arity$1(ano_state)], null));

var viewer = new cljs.core.Keyword(null,"viewer","viewer",-783949853).cljs$core$IFn$_invoke$arity$1(state);
var in_system_window_QMARK_ = (function (){var G__133751 = viewer;
if((G__133751 == null)){
return null;
} else {
return G__133751.$inSystemWindow;
}
})();
return daiquiri.core.create_element("div",{'className':"extensions__pdf-viewer-cnt visible-scrollbar"},[daiquiri.core.create_element("div",{'ref':_STAR_el_ref,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["extensions__pdf-viewer","overflow-x-auto","absolute",frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"is-area-dashed","is-area-dashed",510137497),area_dashed_QMARK_], null)], null))], null))},[daiquiri.core.create_element("div",{'className':"pdfViewer"},["viewer pdf"]),daiquiri.core.create_element("div",{'className':"pp-holder"},null),frontend.extensions.pdf.core.pdf_highlight_finder(viewer),(cljs.core.truth_((function (){var and__5000__auto__ = page_ready_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = viewer;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(initial_error);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?daiquiri.interpreter.interpret(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.with_key(frontend.extensions.pdf.core.pdf_highlights(new cljs.core.Keyword(null,"el","el",-1618201118).cljs$core$IFn$_invoke$arity$1(state),viewer,initial_hls,new cljs.core.Keyword(null,"loaded-pages","loaded-pages",1539616565).cljs$core$IFn$_invoke$arity$1(ano_state),ops),"pdf-highlights")], null)):null)]),(cljs.core.truth_((function (){var and__5000__auto__ = page_ready_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return viewer;
} else {
return and__5000__auto__;
}
})())?daiquiri.interpreter.interpret(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_(in_system_window_QMARK_)?null:rum.core.with_key(frontend.extensions.pdf.core.pdf_resizer(viewer),"pdf-resizer")),rum.core.with_key(frontend.extensions.pdf.toolbar.pdf_toolbar(viewer,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-external-window!","on-external-window!",244908467),(function (){
return frontend.extensions.pdf.core.open_external_win_BANG_(frontend.state.get_current_pdf());
})], null)),"pdf-toolbar")], null)):null)]);
}),null,"frontend.extensions.pdf.core/pdf-viewer");
frontend.extensions.pdf.core.pdf_password_input = rum.core.lazy_build(rum.core.build_defcs,(function (state,confirm_fn){
var password = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.extensions.pdf.core","password","frontend.extensions.pdf.core/password",-195127968));
return daiquiri.core.create_element("div",{'className':"container"},[daiquiri.core.create_element("div",{'className':"text-lg mb-4"},["Password required"]),daiquiri.core.create_element("div",{'className':"sm:flex sm:items-start"},[daiquiri.core.create_element("div",{'className':"mt-3 text-center sm:mt-0 sm:text-left"},[daiquiri.core.create_element("h3",{'id':"modal-headline",'className':"leading-6 font-medium"},["This document is password protected. Please enter a password:"])])]),daiquiri.core.create_element("input",{'autoFocus':true,'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.reset_BANG_(password,frontend.util.evalue(e));
})),'className':"form-input block w-full sm:text-sm sm:leading-5 my-2 mb-4"},[]),(function (){var attrs133795 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Submit",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var password__$1 = cljs.core.deref(password);
return (confirm_fn.cljs$core$IFn$_invoke$arity$1 ? confirm_fn.cljs$core$IFn$_invoke$arity$1(password__$1) : confirm_fn.call(null,password__$1));
})], null)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs133795))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mt-5","sm:mt-4","flex"], null)], null),attrs133795], 0))):{'className':"mt-5 sm:mt-4 flex"}),((cljs.core.map_QMARK_(attrs133795))?null:[daiquiri.interpreter.interpret(attrs133795)]));
})()]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.extensions.pdf.core","password","frontend.extensions.pdf.core/password",-195127968))], null),"frontend.extensions.pdf.core/pdf-password-input");
if((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.pdf !== 'undefined') && (typeof frontend.extensions.pdf.core !== 'undefined') && (typeof frontend.extensions.pdf.core.debounced_set_property_BANG_ !== 'undefined')){
} else {
frontend.extensions.pdf.core.debounced_set_property_BANG_ = goog.functions.debounce(frontend.handler.property.set_block_property_BANG_,(300));
}
frontend.extensions.pdf.core.debounce_set_last_visit_page_BANG_ = (function frontend$extensions$pdf$core$debounce_set_last_visit_page_BANG_(asset,last_visit_page){
if(((typeof last_visit_page === 'number') && ((last_visit_page > (0))))){
var G__133803 = frontend.state.get_current_repo();
var G__133804 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(asset);
var G__133805 = new cljs.core.Keyword("logseq.property.asset","last-visit-page","logseq.property.asset/last-visit-page",2107803535);
var G__133806 = last_visit_page;
return (frontend.extensions.pdf.core.debounced_set_property_BANG_.cljs$core$IFn$_invoke$arity$4 ? frontend.extensions.pdf.core.debounced_set_property_BANG_.cljs$core$IFn$_invoke$arity$4(G__133803,G__133804,G__133805,G__133806) : frontend.extensions.pdf.core.debounced_set_property_BANG_.call(null,G__133803,G__133804,G__133805,G__133806));
} else {
return null;
}
});
frontend.extensions.pdf.core.pdf_loader = rum.core.lazy_build(rum.core.build_defc,(function (p__133822){
var map__133823 = p__133822;
var map__133823__$1 = cljs.core.__destructure_map(map__133823);
var pdf_current = map__133823__$1;
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133823__$1,new cljs.core.Keyword(null,"url","url",276297046));
var hls_file = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133823__$1,new cljs.core.Keyword(null,"hls-file","hls-file",192681120));
var identity = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133823__$1,new cljs.core.Keyword(null,"identity","identity",1647396035));
var filename = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133823__$1,new cljs.core.Keyword(null,"filename","filename",-1428840783));
var repo = frontend.state.get_current_repo();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$0();
var _STAR_doc_ref = rum.core.use_ref(null);
var vec__133824 = rum.core.use_state(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),null,new cljs.core.Keyword(null,"pdf-document","pdf-document",-1928964968),null,new cljs.core.Keyword(null,"status","status",-1997798413),null], null));
var loader_state = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133824,(0),null);
var set_loader_state_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133824,(1),null);
var vec__133827 = rum.core.use_state(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"initial-hls","initial-hls",-344014820),null,new cljs.core.Keyword(null,"latest-hls","latest-hls",-510805948),null,new cljs.core.Keyword(null,"extra","extra",1612569067),null,new cljs.core.Keyword(null,"loaded","loaded",-1246482293),false,new cljs.core.Keyword(null,"error","error",-978969032),null], null));
var hls_state = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133827,(0),null);
var set_hls_state_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133827,(1),null);
var vec__133830 = rum.core.use_state(null);
var doc_password = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133830,(0),null);
var set_doc_password_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133830,(1),null);
var vec__133833 = rum.core.use_state((1));
var initial_page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133833,(0),null);
var set_initial_page_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133833,(1),null);
var set_dirty_hls_BANG_ = (function (latest_hls){
var G__133837 = (function (p1__133809_SHARP_){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p1__133809_SHARP_,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"initial-hls","initial-hls",-344014820),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"latest-hls","latest-hls",-510805948),latest_hls], null)], 0));
});
return (set_hls_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_hls_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__133837) : set_hls_state_BANG_.call(null,G__133837));
});
var set_hls_extra_BANG_ = (function (extra){
if(cljs.core.truth_(db_based_QMARK_)){
return frontend.extensions.pdf.core.debounce_set_last_visit_page_BANG_(new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(pdf_current),new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$1(extra));
} else {
var G__133839 = (function (p1__133810_SHARP_){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p1__133810_SHARP_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"extra","extra",1612569067),extra], null)], 0));
});
return (set_hls_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_hls_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__133839) : set_hls_state_BANG_.call(null,G__133839));
}
});
if(cljs.core.truth_(db_based_QMARK_)){
} else {
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(pdf_current)){
return frontend.extensions.pdf.assets.file_based_ensure_ref_page_BANG_(pdf_current);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [pdf_current], null));
}

if(cljs.core.truth_(db_based_QMARK_)){
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(pdf_current)){
var pdf_block = new cljs.core.Keyword(null,"block","block",664686210).cljs$core$IFn$_invoke$arity$1(pdf_current);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_pdf_annotations(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(pdf_block))),(function (data){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property.pdf","hl-value","logseq.property.pdf/hl-value",545829402),data)),(function (highlights){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__133843 = (function (){var or__5002__auto__ = new cljs.core.Keyword("logseq.property.asset","last-visit-page","logseq.property.asset/last-visit-page",2107803535).cljs$core$IFn$_invoke$arity$1(pdf_block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (1);
}
})();
return (set_initial_page_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_initial_page_BANG_.cljs$core$IFn$_invoke$arity$1(G__133843) : set_initial_page_BANG_.call(null,G__133843));
})()),(function (___41611__auto__){
return promesa.protocols._promise((function (){var G__133844 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"initial-hls","initial-hls",-344014820),highlights,new cljs.core.Keyword(null,"latest-hls","latest-hls",-510805948),highlights,new cljs.core.Keyword(null,"loaded","loaded",-1246482293),true], null);
return (set_hls_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_hls_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__133844) : set_hls_state_BANG_.call(null,G__133844));
})());
}));
}));
}));
}));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [pdf_current], null));
} else {
logseq.shui.hooks.use_effect_BANG_((function (){
promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.pdf.assets.file_based_load_hls_data$(pdf_current)),(function (data){
return promesa.protocols._mcat(promesa.protocols._promise(data),(function (p__133845){
var map__133846 = p__133845;
var map__133846__$1 = cljs.core.__destructure_map(map__133846);
var highlights = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133846__$1,new cljs.core.Keyword(null,"highlights","highlights",945143465));
var extra = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133846__$1,new cljs.core.Keyword(null,"extra","extra",1612569067));
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__133847 = (function (){var or__5002__auto__ = (function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$1(extra);
if(cljs.core.truth_(temp__5804__auto__)){
var page = temp__5804__auto__;
return frontend.util.safe_parse_int(page);
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (1);
}
})();
return (set_initial_page_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_initial_page_BANG_.cljs$core$IFn$_invoke$arity$1(G__133847) : set_initial_page_BANG_.call(null,G__133847));
})()),(function (___41611__auto__){
return promesa.protocols._promise((function (){var G__133849 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"initial-hls","initial-hls",-344014820),highlights,new cljs.core.Keyword(null,"latest-hls","latest-hls",-510805948),highlights,new cljs.core.Keyword(null,"extra","extra",1612569067),extra,new cljs.core.Keyword(null,"loaded","loaded",-1246482293),true], null);
return (set_hls_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_hls_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__133849) : set_hls_state_BANG_.call(null,G__133849));
})());
}));
}));
}));
})),(function (e){
console.error("[load hls error]",e);

var msg = [cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__133853 = "Error: failed to load the highlights file: \"%s\". \n";
var G__133854 = new cljs.core.Keyword(null,"hls-file","hls-file",192681120).cljs$core$IFn$_invoke$arity$1(pdf_current);
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2(G__133853,G__133854) : frontend.util.format.call(null,G__133853,G__133854));
})()),cljs.core.str.cljs$core$IFn$_invoke$arity$1(e)].join('');
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.Keyword(null,"error","error",-978969032));

var G__133855 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"loaded","loaded",-1246482293),true,new cljs.core.Keyword(null,"error","error",-978969032),e], null);
return (set_hls_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_hls_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__133855) : set_hls_state_BANG_.call(null,G__133855));
}));

return (function (){
return cljs.core.List.EMPTY;
});
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [hls_file], null));
}

if(cljs.core.truth_(db_based_QMARK_)){
} else {
var persist_hls_data_BANG__134242 = logseq.shui.hooks.use_callback((function (){var G__133856 = (function (latest_hls,extra){
return frontend.extensions.pdf.assets.file_based_persist_hls_data$(pdf_current,latest_hls,extra);
});
var G__133857 = (4000);
return (frontend.util.debounce.cljs$core$IFn$_invoke$arity$2 ? frontend.util.debounce.cljs$core$IFn$_invoke$arity$2(G__133856,G__133857) : frontend.util.debounce.call(null,G__133856,G__133857));
})(),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [pdf_current], null));
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"completed","completed",-486056503),new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(loader_state))){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2((cljs.core.truth_(new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(hls_state))?null:promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._promise((function (){var G__133860 = new cljs.core.Keyword(null,"latest-hls","latest-hls",-510805948).cljs$core$IFn$_invoke$arity$1(hls_state);
var G__133861 = new cljs.core.Keyword(null,"extra","extra",1612569067).cljs$core$IFn$_invoke$arity$1(hls_state);
return (persist_hls_data_BANG__134242.cljs$core$IFn$_invoke$arity$2 ? persist_hls_data_BANG__134242.cljs$core$IFn$_invoke$arity$2(G__133860,G__133861) : persist_hls_data_BANG__134242.call(null,G__133860,G__133861));
})());
}))),(function (e){
return console.error("[write hls error]",e);
}));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"latest-hls","latest-hls",-510805948).cljs$core$IFn$_invoke$arity$1(hls_state),new cljs.core.Keyword(null,"extra","extra",1612569067).cljs$core$IFn$_invoke$arity$1(hls_state)], null));
}

logseq.shui.hooks.use_effect_BANG_((function (){
var loader_el = rum.core.deref(_STAR_doc_ref);
var get_doc$ = (function (opts){
return pdfjsLib.getDocument(opts).promise;
});
var opts = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"url","url",276297046),url,new cljs.core.Keyword(null,"password","password",417022471),(function (){var or__5002__auto__ = doc_password;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})(),new cljs.core.Keyword(null,"ownerDocument","ownerDocument",1761316797),loader_el.ownerDocument,new cljs.core.Keyword(null,"cMapUrl","cMapUrl",-2054175479),[(cljs.core.truth_((function (){var G__133863 = location.host;
if((G__133863 == null)){
return null;
} else {
return clojure.string.ends_with_QMARK_(G__133863,"logseq.com");
}
})())?"./static/":"./"),"js/pdfjs/cmaps/"].join(''),new cljs.core.Keyword(null,"cMapPacked","cMapPacked",377437190),true], null);
var G__133864_134254 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"loading","loading",-737050189)], null);
(set_loader_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_loader_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__133864_134254) : set_loader_state_BANG_.call(null,G__133864_134254));

promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(get_doc$(cljs.core.clj__GT_js(opts)),(function (doc){
var G__133865 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"pdf-document","pdf-document",-1928964968),doc,new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"completed","completed",-486056503)], null);
return (set_loader_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_loader_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__133865) : set_loader_state_BANG_.call(null,G__133865));
})),(function (p1__133817_SHARP_){
var G__133866 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),p1__133817_SHARP_], null);
return (set_loader_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_loader_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__133866) : set_loader_state_BANG_.call(null,G__133866));
}));

return (function (){
return cljs.core.List.EMPTY;
});
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [url,doc_password], null));

logseq.shui.hooks.use_effect_BANG_((function (){
var temp__5804__auto__ = new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(loader_state);
if(cljs.core.truth_(temp__5804__auto__)){
var error = temp__5804__auto__;
console.error("[PDF loader]",new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(loader_state));

var G__133871 = error.name;
switch (G__133871) {
case "MissingPDFException":
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(["Error: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error.message),"\n Is this the correct path?"].join(''),new cljs.core.Keyword(null,"error","error",-978969032),false);

return frontend.state.set_state_BANG_(new cljs.core.Keyword("pdf","current","pdf/current",-1087936477),null);

break;
case "InvalidPDFException":
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(["Error: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error.message),"\n","Is this .pdf file corrupted?\n","Please confirm with external pdf viewer."].join(''),new cljs.core.Keyword(null,"error","error",-978969032),false);

return frontend.state.set_state_BANG_(new cljs.core.Keyword("pdf","current","pdf/current",-1087936477),null);

break;
case "PasswordException":
var G__133872_134259 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),null], null);
(set_loader_state_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_loader_state_BANG_.cljs$core$IFn$_invoke$arity$1(G__133872_134259) : set_loader_state_BANG_.call(null,G__133872_134259));

var G__133873 = (function (p__133874){
var map__133875 = p__133874;
var map__133875__$1 = cljs.core.__destructure_map(map__133875);
var close = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133875__$1,new cljs.core.Keyword(null,"close","close",1835149582));
var on_password_fn = (function (password){
(close.cljs$core$IFn$_invoke$arity$0 ? close.cljs$core$IFn$_invoke$arity$0() : close.call(null));

return (set_doc_password_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_doc_password_BANG_.cljs$core$IFn$_invoke$arity$1(password) : set_doc_password_BANG_.call(null,password));
});
return frontend.extensions.pdf.core.pdf_password_input(on_password_fn);
});
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__133873) : logseq.shui.ui.dialog_open_BANG_.call(null,G__133873));

break;
default:
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(["Error: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error.name),"\n",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error.message),"\n","Please confirm with pdf file resource."].join(''),new cljs.core.Keyword(null,"error","error",-978969032),false);

return frontend.state.set_state_BANG_(new cljs.core.Keyword("pdf","current","pdf/current",-1087936477),null);

}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(loader_state)], null));

var ctx133892 = frontend.extensions.pdf.toolbar._STAR_highlights_ctx_STAR_;
return React.createElement(ctx133892.Provider,(function (){var obj133894 = ({"value":hls_state});
return obj133894;
})(),daiquiri.core.create_element("div",{'ref':_STAR_doc_ref,'className':"extensions__pdf-loader"},[(function (){var status_doc = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(loader_state);
var initial_hls = new cljs.core.Keyword(null,"initial-hls","initial-hls",-344014820).cljs$core$IFn$_invoke$arity$1(hls_state);
var initial_error = new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(hls_state);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(status_doc,new cljs.core.Keyword(null,"loading","loading",-737050189))){
var attrs133895 = frontend.components.svg.loading;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs133895))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","justify-center","items-center","h-screen","text-gray-500","text-lg"], null)], null),attrs133895], 0))):{'className':"flex justify-center items-center h-screen text-gray-500 text-lg"}),((cljs.core.map_QMARK_(attrs133895))?null:[daiquiri.interpreter.interpret(attrs133895)]));
} else {
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = (function (){var and__5000__auto__ = new cljs.core.Keyword(null,"loaded","loaded",-1246482293).cljs$core$IFn$_invoke$arity$1(hls_state);
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"pdf-document","pdf-document",-1928964968).cljs$core$IFn$_invoke$arity$1(loader_state);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var pdf_document = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.with_key(frontend.extensions.pdf.core.pdf_viewer(url,pdf_document,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"identity","identity",1647396035),identity,new cljs.core.Keyword(null,"filename","filename",-1428840783),filename,new cljs.core.Keyword(null,"initial-hls","initial-hls",-344014820),initial_hls,new cljs.core.Keyword(null,"initial-page","initial-page",1974282031),initial_page,new cljs.core.Keyword(null,"initial-error","initial-error",-1070014476),initial_error], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"set-dirty-hls!","set-dirty-hls!",-1468393512),set_dirty_hls_BANG_,new cljs.core.Keyword(null,"set-hls-extra!","set-hls-extra!",2055356477),set_hls_extra_BANG_], null)),"pdf-viewer")], null);
} else {
return null;
}
})());
}
})()]));
}),null,"frontend.extensions.pdf.core/pdf-loader");
frontend.extensions.pdf.core.pdf_container_outer = rum.core.lazy_build(rum.core.build_defc,(function (child){
var attrs133906 = child;
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs133906))?daiquiri.interpreter.element_attributes(attrs133906):null),((cljs.core.map_QMARK_(attrs133906))?null:[daiquiri.interpreter.interpret(attrs133906)]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.modules.shortcut.core.mixin.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("shortcut.handler","pdf","shortcut.handler/pdf",468089398),false)], null),"frontend.extensions.pdf.core/pdf-container-outer");
frontend.extensions.pdf.core.pdf_container = rum.core.lazy_build(rum.core.build_defc,(function (p__133958){
var map__133959 = p__133958;
var map__133959__$1 = cljs.core.__destructure_map(map__133959);
var pdf_current = map__133959__$1;
var identity = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__133959__$1,new cljs.core.Keyword(null,"identity","identity",1647396035));
var vec__133961 = rum.core.use_state(false);
var prepared = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133961,(0),null);
var set_prepared_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133961,(1),null);
var vec__133964 = rum.core.use_state(false);
var ready = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133964,(0),null);
var set_ready_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__133964,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return (set_prepared_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_prepared_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_prepared_BANG_.call(null,true));
}),cljs.core.PersistentVector.EMPTY);

logseq.shui.hooks.use_effect_BANG_((function (){
setTimeout((function (){
return (set_ready_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_ready_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_ready_BANG_.call(null,true));
}),(100));

return (function (){
return (set_ready_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_ready_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_ready_BANG_.call(null,false));
});
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [identity], null));

return daiquiri.core.create_element("div",{'id':["pdf-layout-container_",cljs.core.str.cljs$core$IFn$_invoke$arity$1(identity)].join(''),'className':"extensions__pdf-container"},[(cljs.core.truth_((function (){var and__5000__auto__ = prepared;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = identity;
if(cljs.core.truth_(and__5000__auto____$1)){
return ready;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?frontend.extensions.pdf.core.pdf_loader(pdf_current):null)]);
}),null,"frontend.extensions.pdf.core/pdf-container");
frontend.extensions.pdf.core.playground_effects = rum.core.lazy_build(rum.core.build_defc,(function (active){
logseq.shui.hooks.use_effect_BANG_((function (){
var flg = "is-pdf-active";
var cls = document.body.classList;
var and__5000__auto___134269 = active;
if(cljs.core.truth_(and__5000__auto___134269)){
cls.add(flg);
} else {
}

return (function (){
return cls.remove(flg);
});
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [active], null));

return null;
}),null,"frontend.extensions.pdf.core/playground-effects");
frontend.extensions.pdf.core.default_embed_playground = rum.core.lazy_build(rum.core.build_defcs,(function (state){
var pdf_current = frontend.state.sub(new cljs.core.Keyword("pdf","current","pdf/current",-1087936477));
var system_win_QMARK_ = frontend.state.sub(new cljs.core.Keyword("pdf","system-win?","pdf/system-win?",-2028066550));
return daiquiri.core.create_element("div",{'className':"extensions__pdf-playground"},[frontend.extensions.pdf.core.playground_effects(((cljs.core.not(system_win_QMARK_)) && ((!((pdf_current == null)))))),(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(system_win_QMARK_);
if(and__5000__auto__){
return pdf_current;
} else {
return and__5000__auto__;
}
})())?ReactDOM.createPortal(frontend.extensions.pdf.core.pdf_container_outer(frontend.extensions.pdf.core.pdf_container(pdf_current)),document.querySelector("#app-single-container")):null)]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$,rum.core.reactive], null),"frontend.extensions.pdf.core/default-embed-playground");
frontend.extensions.pdf.core.system_embed_playground = rum.core.lazy_build(rum.core.build_defcs,(function (){
var pdf_current = frontend.state.sub(new cljs.core.Keyword("pdf","current","pdf/current",-1087936477));
return frontend.extensions.pdf.core.pdf_container(pdf_current);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.extensions.pdf.core/system-embed-playground");

//# sourceMappingURL=frontend.extensions.pdf.core.js.map
