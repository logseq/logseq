goog.provide('frontend.components.whiteboard');
goog.scope(function(){
  frontend.components.whiteboard.goog$module$shadow$loader = goog.module.get('shadow.loader');
});
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.whiteboard !== 'undefined') && (typeof frontend.components.whiteboard.tldraw_loaded_QMARK_ !== 'undefined')){
} else {
frontend.components.whiteboard.tldraw_loaded_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
frontend.components.whiteboard.tldraw_app = rum.core.lazy_build(rum.core.build_defc,(function (page_uuid,shape_id){
var loaded_QMARK_ = rum.core.react(frontend.components.whiteboard.tldraw_loaded_QMARK_);
var draw_component = (cljs.core.truth_(loaded_QMARK_)?(((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.tldraw !== 'undefined') && (typeof frontend.extensions.tldraw.tldraw_app !== 'undefined'))?(new cljs.core.Var((function (){
return frontend.extensions.tldraw.tldraw_app;
}),cljs.core.with_meta(new cljs.core.Symbol("frontend.extensions.tldraw","tldraw-app","frontend.extensions.tldraw/tldraw-app",-147934778,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("cljs.analyzer","no-resolve","cljs.analyzer/no-resolve",-1872351017),true], null)),null)):null):null);
if(cljs.core.truth_(draw_component)){
return daiquiri.interpreter.interpret((draw_component.cljs$core$IFn$_invoke$arity$2 ? draw_component.cljs$core$IFn$_invoke$arity$2(page_uuid,shape_id) : draw_component.call(null,page_uuid,shape_id)));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.whiteboard.goog$module$shadow$loader.load(new cljs.core.Keyword(null,"tldraw","tldraw",-1177214555))),(function (_){
return promesa.protocols._promise(cljs.core.reset_BANG_(frontend.components.whiteboard.tldraw_loaded_QMARK_,true));
}));
}));

return state;
})], null)], null),"frontend.components.whiteboard/tldraw-app");
frontend.components.whiteboard.tldraw_preview = rum.core.lazy_build(rum.core.build_defc,(function (page_uuid){
if(cljs.core.truth_(page_uuid)){
var vec__91342 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(true) : logseq.shui.hooks.use_state.call(null,true));
var loading_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91342,(0),null);
var set_loading_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91342,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.whiteboard.goog$module$shadow$loader.load(new cljs.core.Keyword(null,"tldraw","tldraw",-1177214555))),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block(frontend.state.get_current_repo(),page_uuid)),(function (___40947__auto____$1){
return promesa.protocols._promise((set_loading_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_loading_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_loading_BANG_.call(null,false)));
}));
}));
}));
}),cljs.core.PersistentVector.EMPTY);

if(cljs.core.truth_(loading_QMARK_)){
return null;
} else {
var tldr = frontend.handler.whiteboard.get_page_tldr(page_uuid);
var generate_preview = (((typeof frontend !== 'undefined') && (typeof frontend.extensions !== 'undefined') && (typeof frontend.extensions.tldraw !== 'undefined') && (typeof frontend.extensions.tldraw.generate_preview !== 'undefined'))?(new cljs.core.Var((function (){
return frontend.extensions.tldraw.generate_preview;
}),cljs.core.with_meta(new cljs.core.Symbol("frontend.extensions.tldraw","generate-preview","frontend.extensions.tldraw/generate-preview",-109262068,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("cljs.analyzer","no-resolve","cljs.analyzer/no-resolve",-1872351017),true], null)),null)):null);
if(cljs.core.truth_(generate_preview)){
return daiquiri.interpreter.interpret((generate_preview.cljs$core$IFn$_invoke$arity$1 ? generate_preview.cljs$core$IFn$_invoke$arity$1(tldr) : generate_preview.call(null,tldr)));
} else {
return null;
}
}
} else {
return null;
}
}),null,"frontend.components.whiteboard/tldraw-preview");
/**
 * Shows a references count for any block or page.
 * When clicked, a dropdown menu will show the reference details
 */
frontend.components.whiteboard.references_count = rum.core.lazy_build(rum.core.build_defcs,(function() {
var G__91421 = null;
var G__91421__3 = (function (state,page_name_or_uuid,classname){
return daiquiri.interpreter.interpret((frontend.components.whiteboard.references_count.cljs$core$IFn$_invoke$arity$3 ? frontend.components.whiteboard.references_count.cljs$core$IFn$_invoke$arity$3(page_name_or_uuid,classname,null) : frontend.components.whiteboard.references_count.call(null,page_name_or_uuid,classname,null)));
});
var G__91421__4 = (function (state,page_name_or_uuid,classname,_opts){
if(cljs.core.truth_(page_name_or_uuid)){
var _STAR_open_QMARK_ = new cljs.core.Keyword("frontend.components.whiteboard","open?","frontend.components.whiteboard/open?",-1929590370).cljs$core$IFn$_invoke$arity$1(state);
var page_entity = frontend.db.model.get_page(page_name_or_uuid);
var page = frontend.db.model.sub_block(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity));
var refs_count = cljs.core.count(new cljs.core.Keyword("block","_refs","block/_refs",830218531).cljs$core$IFn$_invoke$arity$1(page));
if((refs_count > (0))){
return daiquiri.interpreter.interpret((function (){var G__91357 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"open","open",-1763596448),cljs.core.deref(_STAR_open_QMARK_),new cljs.core.Keyword(null,"on-open-change","on-open-change",687272862),(function (o){
return cljs.core.reset_BANG_(_STAR_open_QMARK_,o);
})], null);
var G__91358 = (function (){var G__91360 = cljs.core.PersistentArrayMap.EMPTY;
var G__91361 = (function (){var G__91362 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-75 hover:opacity-100"], null);
var G__91363 = refs_count;
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__91362,G__91363) : logseq.shui.ui.button.call(null,G__91362,G__91363));
})();
return (logseq.shui.ui.popover_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.popover_trigger.cljs$core$IFn$_invoke$arity$2(G__91360,G__91361) : logseq.shui.ui.popover_trigger.call(null,G__91360,G__91361));
})();
var G__91359 = (function (){var G__91364 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-open-auto-focus","on-open-auto-focus",391348920),(function (p1__91345_SHARP_){
return p1__91345_SHARP_.preventDefault();
})], null);
var G__91365 = (function (){var G__91367 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class-name","class-name",945142584),"popper-arrow"], null);
return (logseq.shui.ui.popover_arrow.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popover_arrow.cljs$core$IFn$_invoke$arity$1(G__91367) : logseq.shui.ui.popover_arrow.call(null,G__91367));
})();
var G__91366 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),classname], null),frontend.components.reference.references(page,cljs.core.PersistentArrayMap.EMPTY)], null);
return (logseq.shui.ui.popover_content.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popover_content.cljs$core$IFn$_invoke$arity$3(G__91364,G__91365,G__91366) : logseq.shui.ui.popover_content.call(null,G__91364,G__91365,G__91366));
})();
return (logseq.shui.ui.popover.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popover.cljs$core$IFn$_invoke$arity$3(G__91357,G__91358,G__91359) : logseq.shui.ui.popover.call(null,G__91357,G__91358,G__91359));
})());
} else {
return null;
}
} else {
return null;
}
});
G__91421 = function(state,page_name_or_uuid,classname,_opts){
switch(arguments.length){
case 3:
return G__91421__3.call(this,state,page_name_or_uuid,classname);
case 4:
return G__91421__4.call(this,state,page_name_or_uuid,classname,_opts);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__91421.cljs$core$IFn$_invoke$arity$3 = G__91421__3;
G__91421.cljs$core$IFn$_invoke$arity$4 = G__91421__4;
return G__91421;
})()
,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.whiteboard","open?","frontend.components.whiteboard/open?",-1929590370))], null),"frontend.components.whiteboard/references-count");
frontend.components.whiteboard.get_page_human_update_time = (function frontend$components$whiteboard$get_page_human_update_time(page){
var map__91368 = page;
var map__91368__$1 = cljs.core.__destructure_map(map__91368);
var updated_at = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91368__$1,new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551));
var created_at = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91368__$1,new cljs.core.Keyword("block","created-at","block/created-at",1440015));
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(created_at,updated_at))?frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("whiteboard","dashboard-card-created","whiteboard/dashboard-card-created",-1651021771)], 0)):frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("whiteboard","dashboard-card-edited","whiteboard/dashboard-card-edited",1417624794)], 0)))),frontend.util.human_time((new Date(updated_at)))].join('');
});
frontend.components.whiteboard.dashboard_preview_card = rum.core.lazy_build(rum.core.build_defc,(function (whiteboard,p__91369){
var map__91370 = p__91369;
var map__91370__$1 = cljs.core.__destructure_map(map__91370);
var checked = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91370__$1,new cljs.core.Keyword(null,"checked","checked",-50955819));
var on_checked_change = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91370__$1,new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819));
var show_checked_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91370__$1,new cljs.core.Keyword(null,"show-checked?","show-checked?",-405251948));
return daiquiri.core.create_element("div",{'data-checked':checked,'style':{'filter':(cljs.core.truth_((function (){var and__5000__auto__ = show_checked_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(checked);
} else {
return and__5000__auto__;
}
})())?"opacity(0.5)":"none")},'onClick':(function (e){
frontend.util.stop(e);

if(cljs.core.truth_(show_checked_QMARK_)){
var G__91371 = cljs.core.not(checked);
return (on_checked_change.cljs$core$IFn$_invoke$arity$1 ? on_checked_change.cljs$core$IFn$_invoke$arity$1(G__91371) : on_checked_change.call(null,G__91371));
} else {
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(whiteboard));
}
}),'className':"dashboard-card dashboard-preview-card cursor-pointer hover:shadow-lg"},[daiquiri.core.create_element("div",{'className':"dashboard-card-title"},[daiquiri.core.create_element("div",{'className':"flex w-full items-center"},[(function (){var attrs91372 = ((logseq.common.util.uuid_string_QMARK_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(whiteboard)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-50","span.opacity-50",949060710),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"untitled","untitled",301293696)], 0))], null):new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(whiteboard));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs91372))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["dashboard-card-title-name","font-bold"], null)], null),attrs91372], 0))):{'className':"dashboard-card-title-name font-bold"}),((cljs.core.map_QMARK_(attrs91372))?null:[daiquiri.interpreter.interpret(attrs91372)]));
})(),daiquiri.core.create_element("div",{'className':"flex-1"},null),daiquiri.core.create_element("div",{'tabIndex':(-1),'style':{'visibility':(cljs.core.truth_(show_checked_QMARK_)?"visible":null)},'onClick':frontend.util.stop_propagation,'className':"dashboard-card-checkbox"},[daiquiri.interpreter.interpret(frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),checked,new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (){
var G__91376 = cljs.core.not(checked);
return (on_checked_change.cljs$core$IFn$_invoke$arity$1 ? on_checked_change.cljs$core$IFn$_invoke$arity$1(G__91376) : on_checked_change.call(null,G__91376));
})], null)))])]),daiquiri.core.create_element("div",{'className':"flex w-full opacity-50"},[daiquiri.core.create_element("div",null,[frontend.components.whiteboard.get_page_human_update_time(whiteboard)]),daiquiri.core.create_element("div",{'className':"flex-1"},null),frontend.components.whiteboard.references_count(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(whiteboard),null,cljs.core.PersistentArrayMap.EMPTY)])]),frontend.ui.lazy_visible((function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-4.h-64.flex.justify-center","div.p-4.h-64.flex.justify-center",722712029),frontend.components.whiteboard.tldraw_preview(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(whiteboard))], null);
}))]);
}),null,"frontend.components.whiteboard/dashboard-preview-card");
frontend.components.whiteboard.dashboard_create_card = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'id':"tl-create-whiteboard",'onClick':(function (e){
frontend.util.stop(e);

return frontend.handler.whiteboard._LT_create_new_whiteboard_and_redirect_BANG_.cljs$core$IFn$_invoke$arity$0();
}),'className':"dashboard-card dashboard-create-card cursor-pointer"},[daiquiri.interpreter.interpret(frontend.ui.icon("plus")),(function (){var attrs91379 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("whiteboard","dashboard-card-new-whiteboard","whiteboard/dashboard-card-new-whiteboard",-423217066)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs91379))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["dashboard-create-card-caption","select-none"], null)], null),attrs91379], 0))):{'className':"dashboard-create-card-caption select-none"}),((cljs.core.map_QMARK_(attrs91379))?null:[daiquiri.interpreter.interpret(attrs91379)]));
})()]);
}),null,"frontend.components.whiteboard/dashboard-create-card");
frontend.components.whiteboard.whiteboard_dashboard = rum.core.lazy_build(rum.core.build_defc,(function (){
var vec__91380 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var whiteboards = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91380,(0),null);
var set_whiteboards_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91380,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_whiteboards(frontend.state.get_current_repo())),(function (result){
return promesa.protocols._promise((set_whiteboards_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_whiteboards_BANG_.cljs$core$IFn$_invoke$arity$1(result) : set_whiteboards_BANG_.call(null,result)));
}));
}));
}),cljs.core.PersistentVector.EMPTY);

var vec__91383 = frontend.rum.use_bounding_client_rect.cljs$core$IFn$_invoke$arity$0();
var ref = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91383,(0),null);
var rect = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91383,(1),null);
var vec__91386 = (cljs.core.truth_(rect)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rect.width,rect.height], null):null);
var container_width = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91386,(0),null);
var cols = (((container_width < (600)))?(1):(((container_width < (900)))?(2):(((container_width < (1200)))?(3):(4)
)));
var total_whiteboards = cljs.core.count(whiteboards);
var empty_cards = ((function (){var x__5087__auto__ = (cljs.math.ceil(((total_whiteboards + (1)) / cols)) * cols);
var y__5088__auto__ = ((2) * cols);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})() - (total_whiteboards + (1)));
var vec__91389 = rum.core.use_state(cljs.core.PersistentHashSet.EMPTY);
var checked_page_ids = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91389,(0),null);
var set_checked_page_ids = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91389,(1),null);
var has_checked_QMARK_ = cljs.core.not_empty(checked_page_ids);
return daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("h1",{'className':"select-none flex items-center whiteboard-dashboard-title title"},[(function (){var attrs91392 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"all-whiteboards","all-whiteboards",-1803913411)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs91392))?daiquiri.interpreter.element_attributes(attrs91392):null),((cljs.core.map_QMARK_(attrs91392))?[daiquiri.core.create_element("span",{'className':"opacity-50"},[[" \u00B7 ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(total_whiteboards)].join('')])]:[daiquiri.interpreter.interpret(attrs91392),daiquiri.core.create_element("span",{'className':"opacity-50"},[[" \u00B7 ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(total_whiteboards)].join('')])]));
})(),daiquiri.core.create_element("div",{'className':"flex-1"},null),(cljs.core.truth_(has_checked_QMARK_)?daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(cljs.core.count(checked_page_ids),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"icon","icon",1679606541),"trash",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var G__91397 = frontend.components.page.batch_delete_dialog(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return cljs.core.some((function (w){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(w),id)){
return w;
} else {
return null;
}
}),whiteboards);
}),checked_page_ids),(function (){
var G__91398_91422 = cljs.core.PersistentHashSet.EMPTY;
(set_checked_page_ids.cljs$core$IFn$_invoke$arity$1 ? set_checked_page_ids.cljs$core$IFn$_invoke$arity$1(G__91398_91422) : set_checked_page_ids.call(null,G__91398_91422));

return frontend.handler.route.redirect_to_whiteboard_dashboard_BANG_();
}));
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$1(G__91397) : logseq.shui.ui.dialog_open_BANG_.call(null,G__91397));
})], null)], 0))):null)]),daiquiri.core.create_element("div",{'ref':ref},[daiquiri.core.create_element("div",{'style':{'visibility':(((container_width == null))?"hidden":null),'gridTemplateColumns':["repeat(",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cols),", minmax(0, 1fr))"].join('')},'className':"gap-8 grid grid-rows-auto"},[((frontend.config.publishing_QMARK_)?null:frontend.components.whiteboard.dashboard_create_card()),cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$whiteboard$iter__91399(s__91400){
return (new cljs.core.LazySeq(null,(function (){
var s__91400__$1 = s__91400;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__91400__$1);
if(temp__5804__auto__){
var s__91400__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__91400__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__91400__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__91402 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__91401 = (0);
while(true){
if((i__91401 < size__5479__auto__)){
var whiteboard = cljs.core._nth(c__5478__auto__,i__91401);
cljs.core.chunk_append(b__91402,(function (){var id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(whiteboard);
return daiquiri.core.create_element(daiquiri.core.fragment,{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)},[frontend.components.whiteboard.dashboard_preview_card(whiteboard,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"show-checked?","show-checked?",-405251948),has_checked_QMARK_,new cljs.core.Keyword(null,"checked","checked",-50955819),cljs.core.boolean$((checked_page_ids.cljs$core$IFn$_invoke$arity$1 ? checked_page_ids.cljs$core$IFn$_invoke$arity$1(id) : checked_page_ids.call(null,id))),new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),((function (i__91401,id,whiteboard,c__5478__auto__,size__5479__auto__,b__91402,s__91400__$2,temp__5804__auto__,vec__91383,ref,rect,vec__91386,container_width,cols,total_whiteboards,empty_cards,vec__91389,checked_page_ids,set_checked_page_ids,has_checked_QMARK_,vec__91380,whiteboards,set_whiteboards_BANG_){
return (function (checked){
var G__91404 = (cljs.core.truth_(checked)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(checked_page_ids,id):cljs.core.disj.cljs$core$IFn$_invoke$arity$2(checked_page_ids,id));
return (set_checked_page_ids.cljs$core$IFn$_invoke$arity$1 ? set_checked_page_ids.cljs$core$IFn$_invoke$arity$1(G__91404) : set_checked_page_ids.call(null,G__91404));
});})(i__91401,id,whiteboard,c__5478__auto__,size__5479__auto__,b__91402,s__91400__$2,temp__5804__auto__,vec__91383,ref,rect,vec__91386,container_width,cols,total_whiteboards,empty_cards,vec__91389,checked_page_ids,set_checked_page_ids,has_checked_QMARK_,vec__91380,whiteboards,set_whiteboards_BANG_))
], null))]);
})());

var G__91423 = (i__91401 + (1));
i__91401 = G__91423;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__91402),frontend$components$whiteboard$iter__91399(cljs.core.chunk_rest(s__91400__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__91402),null);
}
} else {
var whiteboard = cljs.core.first(s__91400__$2);
return cljs.core.cons((function (){var id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(whiteboard);
return daiquiri.core.create_element(daiquiri.core.fragment,{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)},[frontend.components.whiteboard.dashboard_preview_card(whiteboard,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"show-checked?","show-checked?",-405251948),has_checked_QMARK_,new cljs.core.Keyword(null,"checked","checked",-50955819),cljs.core.boolean$((checked_page_ids.cljs$core$IFn$_invoke$arity$1 ? checked_page_ids.cljs$core$IFn$_invoke$arity$1(id) : checked_page_ids.call(null,id))),new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),((function (id,whiteboard,s__91400__$2,temp__5804__auto__,vec__91383,ref,rect,vec__91386,container_width,cols,total_whiteboards,empty_cards,vec__91389,checked_page_ids,set_checked_page_ids,has_checked_QMARK_,vec__91380,whiteboards,set_whiteboards_BANG_){
return (function (checked){
var G__91406 = (cljs.core.truth_(checked)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(checked_page_ids,id):cljs.core.disj.cljs$core$IFn$_invoke$arity$2(checked_page_ids,id));
return (set_checked_page_ids.cljs$core$IFn$_invoke$arity$1 ? set_checked_page_ids.cljs$core$IFn$_invoke$arity$1(G__91406) : set_checked_page_ids.call(null,G__91406));
});})(id,whiteboard,s__91400__$2,temp__5804__auto__,vec__91383,ref,rect,vec__91386,container_width,cols,total_whiteboards,empty_cards,vec__91389,checked_page_ids,set_checked_page_ids,has_checked_QMARK_,vec__91380,whiteboards,set_whiteboards_BANG_))
], null))]);
})(),frontend$components$whiteboard$iter__91399(cljs.core.rest(s__91400__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(whiteboards);
})()),cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$whiteboard$iter__91407(s__91408){
return (new cljs.core.LazySeq(null,(function (){
var s__91408__$1 = s__91408;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__91408__$1);
if(temp__5804__auto__){
var s__91408__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__91408__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__91408__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__91410 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__91409 = (0);
while(true){
if((i__91409 < size__5479__auto__)){
var n = cljs.core._nth(c__5478__auto__,i__91409);
cljs.core.chunk_append(b__91410,daiquiri.core.create_element("div",{'key':n,'className':"dashboard-card dashboard-bg-card"},[]));

var G__91424 = (i__91409 + (1));
i__91409 = G__91424;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__91410),frontend$components$whiteboard$iter__91407(cljs.core.chunk_rest(s__91408__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__91410),null);
}
} else {
var n = cljs.core.first(s__91408__$2);
return cljs.core.cons(daiquiri.core.create_element("div",{'key':n,'className':"dashboard-card dashboard-bg-card"},[]),frontend$components$whiteboard$iter__91407(cljs.core.rest(s__91408__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.range.cljs$core$IFn$_invoke$arity$1(empty_cards));
})())])])]);
}),null,"frontend.components.whiteboard/whiteboard-dashboard");
frontend.components.whiteboard.whiteboard_page = rum.core.lazy_build(rum.core.build_defc,(function (page_uuid,block_id){
var vec__91411 = frontend.rum.use_breakpoint.cljs$core$IFn$_invoke$arity$0();
var ref = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91411,(0),null);
var bp = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__91411,(1),null);
var page = (function (){var G__91414 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),page_uuid], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__91414) : frontend.db.entity.call(null,G__91414));
})();
return daiquiri.core.create_element("div",{'key':cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_uuid),'ref':ref,'data-breakpoint':cljs.core.name(bp),'style':{'padding':"0.5px",'zIndex':(0),'transform':"translateZ(0)",'textRendering':"geometricPrecision",'WebkitFontSmoothing':"subpixel-antialiased"},'className':"absolute w-full h-full whiteboard-page"},[daiquiri.core.create_element("div",{'data-html2canvas-ignore':true,'className':"whiteboard-page-title-root"},[daiquiri.core.create_element("div",{'style':{'color':"var(--ls-primary-text-color)",'userSelect':"none"},'className':"whiteboard-page-title"},[frontend.components.page.page_title_cp(page,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"*hover?","*hover?",-595965394),cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false)], null))]),frontend.components.whiteboard.references_count(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page),"text-md cursor-pointer",cljs.core.PersistentArrayMap.EMPTY)]),frontend.components.whiteboard.tldraw_app(page_uuid,block_id)]);
}),null,"frontend.components.whiteboard/whiteboard-page");
frontend.components.whiteboard.whiteboard_route = rum.core.lazy_build(rum.core.build_defc,(function (route_match){
var page_uuid_str = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(route_match,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"parameters","parameters",-1229919748),new cljs.core.Keyword(null,"path","path",-188191168),new cljs.core.Keyword(null,"name","name",1843675177)], null));
var map__91415 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(route_match,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"parameters","parameters",-1229919748),new cljs.core.Keyword(null,"query","query",-1288509510)], null));
var map__91415__$1 = cljs.core.__destructure_map(map__91415);
var block_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__91415__$1,new cljs.core.Keyword(null,"block-id","block-id",-70582834));
if(logseq.common.util.uuid_string_QMARK_(page_uuid_str)){
return frontend.components.whiteboard.whiteboard_page(cljs.core.uuid(page_uuid_str),block_id);
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.modules.shortcut.core.mixin.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("shortcut.handler","whiteboard","shortcut.handler/whiteboard",-364922674),false)], null),"frontend.components.whiteboard/whiteboard-route");
frontend.components.whiteboard.onboarding_welcome = rum.core.lazy_build(rum.core.build_defc,(function (close_fn){
return daiquiri.core.create_element("div",{'className':"cp__whiteboard-welcome"},[daiquiri.core.create_element("span",{'className':"head-bg"},null),(function (){var attrs91418 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","welcome-whiteboard-modal-title","on-boarding/welcome-whiteboard-modal-title",-1738898845)], 0));
return daiquiri.core.create_element("h1",((cljs.core.map_QMARK_(attrs91418))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-2xl","font-bold","flex-col","sm:flex-row"], null)], null),attrs91418], 0))):{'className':"text-2xl font-bold flex-col sm:flex-row"}),((cljs.core.map_QMARK_(attrs91418))?null:[daiquiri.interpreter.interpret(attrs91418)]));
})(),(function (){var attrs91419 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","welcome-whiteboard-modal-description","on-boarding/welcome-whiteboard-modal-description",-1310086322)], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs91419))?daiquiri.interpreter.element_attributes(attrs91419):null),((cljs.core.map_QMARK_(attrs91419))?null:[daiquiri.interpreter.interpret(attrs91419)]));
})(),(function (){var attrs91420 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","welcome-whiteboard-modal-skip","on-boarding/welcome-whiteboard-modal-skip",-1465544680)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),close_fn,new cljs.core.Keyword(null,"background","background",-863952629),"gray",new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-60 skip-welcome"], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs91420))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pt-6","flex","justify-center","space-x-2","sm:justify-end"], null)], null),attrs91420], 0))):{'className':"pt-6 flex justify-center space-x-2 sm:justify-end"}),((cljs.core.map_QMARK_(attrs91420))?[daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","welcome-whiteboard-modal-start","on-boarding/welcome-whiteboard-modal-start",-25803730)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.components.onboarding.quick_tour.ready((function (){
frontend.components.onboarding.quick_tour.start_whiteboard();

return (close_fn.cljs$core$IFn$_invoke$arity$0 ? close_fn.cljs$core$IFn$_invoke$arity$0() : close_fn.call(null));
}));
})], 0)))]:[daiquiri.interpreter.interpret(attrs91420),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("on-boarding","welcome-whiteboard-modal-start","on-boarding/welcome-whiteboard-modal-start",-25803730)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.components.onboarding.quick_tour.ready((function (){
frontend.components.onboarding.quick_tour.start_whiteboard();

return (close_fn.cljs$core$IFn$_invoke$arity$0 ? close_fn.cljs$core$IFn$_invoke$arity$0() : close_fn.call(null));
}));
})], 0)))]));
})()]);
}),null,"frontend.components.whiteboard/onboarding-welcome");

//# sourceMappingURL=frontend.components.whiteboard.js.map
