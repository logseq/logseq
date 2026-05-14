goog.provide('frontend.components.property.value');
frontend.components.property.value.entity_map_QMARK_ = (function frontend$components$property$value$entity_map_QMARK_(m){
var and__5000__auto__ = cljs.core.map_QMARK_(m);
if(and__5000__auto__){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(m);
} else {
return and__5000__auto__;
}
});
frontend.components.property.value.property_empty_btn_value = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__70223__delegate = function (property,opts){
var text = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","description","logseq.property/description",-336236200)))?"Add description":"Empty"
);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(text,"Empty")){
return daiquiri.interpreter.interpret((function (){var G__69717 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"empty-btn",new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697)], null),opts], 0));
var G__69718 = text;
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__69717,G__69718) : logseq.shui.ui.button.call(null,G__69717,G__69718));
})());
} else {
return daiquiri.interpreter.interpret((function (){var G__69722 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"empty-btn !text-base",new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697)], null),opts], 0));
var G__69723 = text;
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__69722,G__69723) : logseq.shui.ui.button.call(null,G__69722,G__69723));
})());
}
};
var G__70223 = function (property,var_args){
var opts = null;
if (arguments.length > 1) {
var G__70224__i = 0, G__70224__a = new Array(arguments.length -  1);
while (G__70224__i < G__70224__a.length) {G__70224__a[G__70224__i] = arguments[G__70224__i + 1]; ++G__70224__i;}
  opts = new cljs.core.IndexedSeq(G__70224__a,0,null);
} 
return G__70223__delegate.call(this,property,opts);};
G__70223.cljs$lang$maxFixedArity = 1;
G__70223.cljs$lang$applyTo = (function (arglist__70225){
var property = cljs.core.first(arglist__70225);
var opts = cljs.core.rest(arglist__70225);
return G__70223__delegate(property,opts);
});
G__70223.cljs$core$IFn$_invoke$arity$variadic = G__70223__delegate;
return G__70223;
})()
,null,"frontend.components.property.value/property-empty-btn-value");
frontend.components.property.value.property_empty_text_value = rum.core.lazy_build(rum.core.build_defc,(function (property,p__69726){
var map__69727 = p__69726;
var map__69727__$1 = cljs.core.__destructure_map(map__69727);
var property_position = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69727__$1,new cljs.core.Keyword(null,"property-position","property-position",-1150084538));
var table_view_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69727__$1,new cljs.core.Keyword(null,"table-view?","table-view?",2073887505));
var attrs69724 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"empty-text-btn",new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697)], null)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs69724))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["inline-flex","items-center","cursor-pointer","w-full"], null)], null),attrs69724], 0))):{'className':"inline-flex items-center cursor-pointer w-full"}),((cljs.core.map_QMARK_(attrs69724))?[(cljs.core.truth_(table_view_QMARK_)?null:(cljs.core.truth_(property_position)?daiquiri.interpreter.interpret((function (){var temp__5802__auto__ = new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285).cljs$core$IFn$_invoke$arity$1(property);
if(cljs.core.truth_(temp__5802__auto__)){
var icon = temp__5802__auto__;
return frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic(icon,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color?","color?",-1891974356),true], null)], 0));
} else {
return frontend.ui.icon("line-dashed");
}
})()):"Empty"))]:[daiquiri.interpreter.interpret(attrs69724),(cljs.core.truth_(table_view_QMARK_)?null:(cljs.core.truth_(property_position)?daiquiri.interpreter.interpret((function (){var temp__5802__auto__ = new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285).cljs$core$IFn$_invoke$arity$1(property);
if(cljs.core.truth_(temp__5802__auto__)){
var icon = temp__5802__auto__;
return frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic(icon,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color?","color?",-1891974356),true], null)], 0));
} else {
return frontend.ui.icon("line-dashed");
}
})()):"Empty"))]));
}),null,"frontend.components.property.value/property-empty-text-value");
frontend.components.property.value.get_selected_blocks = (function frontend$components$property$value$get_selected_blocks(){
var G__69735 = frontend.state.get_selection_block_ids();
var G__69735__$1 = (((G__69735 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
var G__69736 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__69736) : frontend.db.entity.call(null,G__69736));
}),G__69735));
var G__69735__$2 = (((G__69735__$1 == null))?null:cljs.core.seq(G__69735__$1));
var G__69735__$3 = (((G__69735__$2 == null))?null:frontend.handler.block.get_top_level_blocks(G__69735__$2));
if((G__69735__$3 == null)){
return null;
} else {
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.property_QMARK_,G__69735__$3);
}
});
frontend.components.property.value.get_operating_blocks = (function frontend$components$property$value$get_operating_blocks(block){
var selected_blocks = frontend.components.property.value.get_selected_blocks();
var view_selected_blocks = new cljs.core.Keyword("view","selected-blocks","view/selected-blocks",-92053027).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
var or__5002__auto__ = cljs.core.seq(selected_blocks);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.core.seq(view_selected_blocks);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block], null);
}
}
});
frontend.components.property.value.batch_operation_QMARK_ = (function frontend$components$property$value$batch_operation_QMARK_(){
var selected_blocks = frontend.components.property.value.get_selected_blocks();
var view_selected_blocks = new cljs.core.Keyword("view","selected-blocks","view/selected-blocks",-92053027).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state));
return (((cljs.core.count(selected_blocks) > (1))) || (cljs.core.seq(view_selected_blocks)));
});
frontend.components.property.value.icon_row = rum.core.lazy_build(rum.core.build_defc,(function (block,editing_QMARK_){
var icon_value = new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285).cljs$core$IFn$_invoke$arity$1(block);
var clear_overlay_BANG_ = (function (){
(logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));

return (logseq.shui.ui.popup_hide_all_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_all_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_all_BANG_.call(null));
});
var on_chosen_BANG_ = (function (_e,icon){
var repo_70230 = frontend.state.get_current_repo();
var blocks_70231 = frontend.components.property.value.get_operating_blocks(block);
frontend.handler.property.batch_set_block_property_BANG_(repo_70230,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),blocks_70231),new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285),(cljs.core.truth_(icon)?cljs.core.select_keys(icon,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"color","color",1011675173)], null)):null));

clear_overlay_BANG_();

if(cljs.core.truth_(editing_QMARK_)){
return frontend.handler.editor.restore_last_saved_cursor_BANG_.cljs$core$IFn$_invoke$arity$0();
} else {
return null;
}
});
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(editing_QMARK_)){
clear_overlay_BANG_();

var container = (function (){var or__5002__auto__ = (function (){var G__69747 = document.activeElement;
if((G__69747 == null)){
return null;
} else {
return G__69747.closest(".page");
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return goog.dom.getElement("main-content-container");
}
})();
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285));
var G__69748 = (function (){
var temp__5804__auto__ = (function (){var G__69750 = container.querySelector(["#ls-block-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))].join(''));
if((G__69750 == null)){
return null;
} else {
return G__69750.querySelector(".block-main-container");
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var target = temp__5804__auto__;
frontend.state.set_editor_action_BANG_(new cljs.core.Keyword(null,"property-icon-picker","property-icon-picker",-1440308098));

var G__69751 = target;
var G__69752 = (function (){
return frontend.components.icon.icon_search(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),on_chosen_BANG_,new cljs.core.Keyword(null,"icon-value","icon-value",-510636889),icon,new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362),(!((icon == null)))], null));
});
var G__69753 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"ls-icon-picker","ls-icon-picker",1363108390),new cljs.core.Keyword(null,"on-after-hide","on-after-hide",-1040754229),(function (){
return frontend.state.set_editor_action_BANG_(null);
}),new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"onEscapeKeyDown","onEscapeKeyDown",1908839912),(function (){
if(cljs.core.truth_(editing_QMARK_)){
return frontend.handler.editor.restore_last_saved_cursor_BANG_.cljs$core$IFn$_invoke$arity$0();
} else {
return null;
}
})], null),new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__69751,G__69752,G__69753) : logseq.shui.ui.popup_show_BANG_.call(null,G__69751,G__69752,G__69753));
} else {
return null;
}
});
return (frontend.util.schedule.cljs$core$IFn$_invoke$arity$1 ? frontend.util.schedule.cljs$core$IFn$_invoke$arity$1(G__69748) : frontend.util.schedule.call(null,G__69748));
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [editing_QMARK_], null));

return daiquiri.core.create_element("div",{'className':"col-span-3 flex flex-row items-center gap-2"},[frontend.components.icon.icon_picker(icon_value,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),frontend.config.publishing_QMARK_,new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362),(!((icon_value == null))),new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),on_chosen_BANG_], null))]);
}),null,"frontend.components.property.value/icon-row");
frontend.components.property.value.select_type_QMARK_ = (function frontend$components$property$value$select_type_QMARK_(block,property){
var type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
return ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"date","date",-1463434462),null,new cljs.core.Keyword(null,"number","number",1570378438),null,new cljs.core.Keyword(null,"property","property",-1114278232),null,new cljs.core.Keyword(null,"page","page",849072397),null,new cljs.core.Keyword(null,"node","node",581201198),null,new cljs.core.Keyword(null,"class","class",-2030961996),null], null), null),type)) || (((cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property))) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword(null,"number","number",1570378438))))))));
});
frontend.components.property.value._LT_create_new_block_BANG_ = (function frontend$components$property$value$_LT_create_new_block_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___70246 = arguments.length;
var i__5727__auto___70247 = (0);
while(true){
if((i__5727__auto___70247 < len__5726__auto___70246)){
args__5732__auto__.push((arguments[i__5727__auto___70247]));

var G__70248 = (i__5727__auto___70247 + (1));
i__5727__auto___70247 = G__70248;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return frontend.components.property.value._LT_create_new_block_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(frontend.components.property.value._LT_create_new_block_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (block,property,value,p__69759){
var map__69760 = p__69759;
var map__69760__$1 = cljs.core.__destructure_map(map__69760);
var edit_block_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__69760__$1,new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),true);
var batch_op_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69760__$1,new cljs.core.Keyword(null,"batch-op?","batch-op?",-2122405648));
if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword("logseq.property","hide?","logseq.property/hide?",68365746).cljs$core$IFn$_invoke$arity$1(property);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662));
}
})())){
} else {
frontend.ui.hide_popups_until_preview_popup_BANG_();

(logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
}

var _LT_create_block = (function (block__$1){
if(((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default","default",-1987822328),null,new cljs.core.Keyword(null,"url","url",276297046),null], null), null),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property))) && ((!(logseq.db.frontend.property.many_QMARK_(property)))))){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662).cljs$core$IFn$_invoke$arity$1(property)),(function (default_value){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.db.new_block_id.cljs$core$IFn$_invoke$arity$0 ? frontend.db.new_block_id.cljs$core$IFn$_invoke$arity$0() : frontend.db.new_block_id.call(null))),(function (new_block_id){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var value_SINGLEQUOTE_ = (cljs.core.truth_((function (){var and__5000__auto__ = default_value;
if(cljs.core.truth_(and__5000__auto__)){
return ((typeof value === 'string') && (clojure.string.blank_QMARK_(value)));
} else {
return and__5000__auto__;
}
})())?logseq.db.frontend.property.property_value_content(default_value):value);
return frontend.handler.db_based.property.create_property_text_block_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property),value_SINGLEQUOTE_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"new-block-id","new-block-id",2138942695),new_block_id], null));
})()),(function (_){
return promesa.protocols._promise((function (){var G__69762 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new_block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__69762) : frontend.db.entity.call(null,G__69762));
})());
}));
}));
}));
}));
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.db.new_block_id.cljs$core$IFn$_invoke$arity$0 ? frontend.db.new_block_id.cljs$core$IFn$_invoke$arity$0() : frontend.db.new_block_id.call(null))),(function (new_block_id){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.property.create_property_text_block_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property),value,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"new-block-id","new-block-id",2138942695),new_block_id], null))),(function (_){
return promesa.protocols._promise((function (){var G__69763 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new_block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__69763) : frontend.db.entity.call(null,G__69763));
})());
}));
}));
}));
}
});
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(batch_op_QMARK_)?promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2(_LT_create_block,frontend.components.property.value.get_operating_blocks(block))):promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(_LT_create_block(block)),(function (new_block){
return promesa.protocols._promise(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new_block], null));
}));
})))),(function (blocks){
return promesa.protocols._promise((function (){var first_block = cljs.core.first(blocks);
if(cljs.core.truth_(edit_block_QMARK_)){
var G__69764_70263 = first_block;
var G__69765_70264 = new cljs.core.Keyword(null,"max","max",61366548);
var G__69766_70265 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"unknown-container","unknown-container",1739831473)], null);
(frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__69764_70263,G__69765_70264,G__69766_70265) : frontend.handler.editor.edit_block_BANG_.call(null,G__69764_70263,G__69765_70264,G__69766_70265));
} else {
}

return first_block;
})());
}));
}));
}));

(frontend.components.property.value._LT_create_new_block_BANG_.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(frontend.components.property.value._LT_create_new_block_BANG_.cljs$lang$applyTo = (function (seq69755){
var G__69756 = cljs.core.first(seq69755);
var seq69755__$1 = cljs.core.next(seq69755);
var G__69757 = cljs.core.first(seq69755__$1);
var seq69755__$2 = cljs.core.next(seq69755__$1);
var G__69758 = cljs.core.first(seq69755__$2);
var seq69755__$3 = cljs.core.next(seq69755__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69756,G__69757,G__69758,seq69755__$3);
}));

frontend.components.property.value._LT_set_class_as_property_BANG_ = (function frontend$components$property$value$_LT_set_class_as_property_BANG_(repo,property){
return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),new cljs.core.Keyword("db.cardinality","one","db.cardinality/one",1428352190),new cljs.core.Keyword("db","valueType","db/valueType",1827971944),new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079),new cljs.core.Keyword("db","index","db/index",-1531680669),true,new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),new cljs.core.Keyword(null,"node","node",581201198),new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
});
/**
 * If a class and in a class schema context, add the property to its schema.
 *   Otherwise, add a block's property and its value
 */
frontend.components.property.value._LT_add_property_BANG_ = (function frontend$components$property$value$_LT_add_property_BANG_(var_args){
var G__69769 = arguments.length;
switch (G__69769) {
case 3:
return frontend.components.property.value._LT_add_property_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return frontend.components.property.value._LT_add_property_BANG_.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.components.property.value._LT_add_property_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (block,property_id,property_value){
return frontend.components.property.value._LT_add_property_BANG_.cljs$core$IFn$_invoke$arity$4(block,property_id,property_value,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.components.property.value._LT_add_property_BANG_.cljs$core$IFn$_invoke$arity$4 = (function (block,property_id,property_value,p__69770){
var map__69771 = p__69770;
var map__69771__$1 = cljs.core.__destructure_map(map__69771);
var selected_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69771__$1,new cljs.core.Keyword(null,"selected?","selected?",-742502788));
var exit_edit_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__69771__$1,new cljs.core.Keyword(null,"exit-edit?","exit-edit?",1607853059),true);
var class_schema_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69771__$1,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900));
var entity_id_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69771__$1,new cljs.core.Keyword(null,"entity-id?","entity-id?",450489382));
var repo = frontend.state.get_current_repo();
var class_QMARK_ = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.class_QMARK_.call(null,block));
var property = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(property_id) : frontend.db.entity.call(null,property_id));
var many_QMARK_ = logseq.db.frontend.property.many_QMARK_(property);
var checkbox_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property));
var blocks = frontend.components.property.value.get_operating_blocks(block);
if(cljs.core.qualified_keyword_QMARK_(property_id)){
} else {
throw (new Error(["Assert failed: ","property to add must be a keyword","\n","(qualified-keyword? property-id)"].join('')));
}

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = class_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return class_schema_QMARK_;
} else {
return and__5000__auto__;
}
})())?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(property) : logseq.db.class_QMARK_.call(null,property)))?frontend.components.property.value._LT_set_class_as_property_BANG_(repo,property):null)),(function (___40947__auto__){
return promesa.protocols._promise(frontend.handler.db_based.property.class_add_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),property_id));
}));
})):(function (){var block_ids = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks);
var set_query_list_view_QMARK_ = (function (){var and__5000__auto__ = new cljs.core.Keyword("logseq.property","query","logseq.property/query",-97414126).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_id,new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_value,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.view","type.list","logseq.property.view/type.list",-1164828502)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property.view","type.list","logseq.property.view/type.list",-1164828502)))))));
} else {
return and__5000__auto__;
}
})();
var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
frontend.handler.property.batch_set_block_property_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,block_ids,property_id,property_value,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"entity-id?","entity-id?",450489382),entity_id_QMARK_], null)], 0));

if(cljs.core.truth_((function (){var and__5000__auto__ = set_query_list_view_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236).cljs$core$IFn$_invoke$arity$1(block) == null);
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.property.batch_set_block_property_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,block_ids,new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108)) : frontend.db.entity.call(null,new cljs.core.Keyword("block","page","block/page",822314108)))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"entity-id?","entity-id?",450489382),entity_id_QMARK_], null)], 0));
} else {
return null;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__69775 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__69776 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__69776);

try{frontend.handler.property.batch_set_block_property_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,block_ids,property_id,property_value,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"entity-id?","entity-id?",450489382),entity_id_QMARK_], null)], 0));

if(cljs.core.truth_((function (){var and__5000__auto__ = set_query_list_view_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236).cljs$core$IFn$_invoke$arity$1(block) == null);
} else {
return and__5000__auto__;
}
})())){
frontend.handler.property.batch_set_block_property_BANG_.cljs$core$IFn$_invoke$arity$variadic(repo,block_ids,new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108)) : frontend.db.entity.call(null,new cljs.core.Keyword("block","page","block/page",822314108)))),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"entity-id?","entity-id?",450489382),entity_id_QMARK_], null)], 0));
} else {
}

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"set-block-property","set-block-property",-301154301)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"set-block-property","set-block-property",-301154301)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__69775);
}}
})())),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.seq(new cljs.core.Keyword("view","selected-blocks","view/selected-blocks",-92053027).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))))?frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Property updated!",new cljs.core.Keyword(null,"success","success",1890645906)):null)),(function (___40947__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(((many_QMARK_)?null:(cljs.core.truth_(exit_edit_QMARK_)?(function (){
frontend.ui.hide_popups_until_preview_popup_BANG_();

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
})()
:(cljs.core.truth_(selected_QMARK_)?(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null)):null)))),(function (___40947__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(((((many_QMARK_) || (checkbox_QMARK_)))?null:(function (){var temp__5804__auto__ = frontend.state.get_input();
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
return input.focus();
} else {
return null;
}
})())),(function (___40947__auto____$3){
return promesa.protocols._promise(((checkbox_QMARK_)?frontend.state.set_editor_action_data_BANG_(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"focus-property-value","focus-property-value",1385743147),new cljs.core.Keyword(null,"property","property",-1114278232),property], null)):null));
}));
}));
}));
}));
}));
}));

(frontend.components.property.value._LT_add_property_BANG_.cljs$lang$maxFixedArity = 4);

frontend.components.property.value.add_or_remove_property_value = (function frontend$components$property$value$add_or_remove_property_value(block,property,value,selected_QMARK_,p__69782){
var map__69783 = p__69782;
var map__69783__$1 = cljs.core.__destructure_map(map__69783);
var opts = map__69783__$1;
var refresh_result_f = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69783__$1,new cljs.core.Keyword(null,"refresh-result-f","refresh-result-f",-1242092515));
var entity_id_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69783__$1,new cljs.core.Keyword(null,"entity-id?","entity-id?",450489382));
var many_QMARK_ = logseq.db.frontend.property.many_QMARK_(property);
var blocks = frontend.components.property.value.get_operating_blocks(block);
var repo = frontend.state.get_current_repo();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children?","children?",-1199594108),false], null)], 0))),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = selected_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079),new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(property))) && (((typeof value === 'number') && (cljs.core.not((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(value) : frontend.db.entity.call(null,value)))))));
} else {
return and__5000__auto__;
}
})())?frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(repo,value,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children?","children?",-1199594108),false], null)], 0)):null)),(function (___40947__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(selected_QMARK_)?frontend.components.property.value._LT_add_property_BANG_.cljs$core$IFn$_invoke$arity$4(block,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),value,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"selected?","selected?",-742502788),selected_QMARK_,new cljs.core.Keyword(null,"entity-id?","entity-id?",450489382),entity_id_QMARK_,new cljs.core.Keyword(null,"exit-edit?","exit-edit?",1607853059),(((!((new cljs.core.Keyword(null,"exit-edit?","exit-edit?",1607853059).cljs$core$IFn$_invoke$arity$1(opts) == null))))?new cljs.core.Keyword(null,"exit-edit?","exit-edit?",1607853059).cljs$core$IFn$_invoke$arity$1(opts):(!(many_QMARK_)))], null)):promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var test_QMARK___60293__auto__ = frontend.util.node_test_QMARK_;
var ops__60294__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__60295__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__60295__auto__);

if(cljs.core.truth_(ops__60294__auto__)){
var seq__69784 = cljs.core.seq(blocks);
var chunk__69785 = null;
var count__69786 = (0);
var i__69787 = (0);
while(true){
if((i__69787 < count__69786)){
var block__$1 = chunk__69785.cljs$core$IIndexed$_nth$arity$2(null,i__69787);
frontend.handler.db_based.property.delete_property_value_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),value);


var G__70306 = seq__69784;
var G__70307 = chunk__69785;
var G__70308 = count__69786;
var G__70309 = (i__69787 + (1));
seq__69784 = G__70306;
chunk__69785 = G__70307;
count__69786 = G__70308;
i__69787 = G__70309;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__69784);
if(temp__5804__auto__){
var seq__69784__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__69784__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__69784__$1);
var G__70310 = cljs.core.chunk_rest(seq__69784__$1);
var G__70311 = c__5525__auto__;
var G__70312 = cljs.core.count(c__5525__auto__);
var G__70313 = (0);
seq__69784 = G__70310;
chunk__69785 = G__70311;
count__69786 = G__70312;
i__69787 = G__70313;
continue;
} else {
var block__$1 = cljs.core.first(seq__69784__$1);
frontend.handler.db_based.property.delete_property_value_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),value);


var G__70314 = cljs.core.next(seq__69784__$1);
var G__70316 = null;
var G__70317 = (0);
var G__70319 = (0);
seq__69784 = G__70314;
chunk__69785 = G__70316;
count__69786 = G__70317;
i__69787 = G__70319;
continue;
}
} else {
return null;
}
}
break;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__69791 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__69792 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__69792);

try{var seq__69793_70320 = cljs.core.seq(blocks);
var chunk__69794_70321 = null;
var count__69795_70322 = (0);
var i__69796_70323 = (0);
while(true){
if((i__69796_70323 < count__69795_70322)){
var block_70324__$1 = chunk__69794_70321.cljs$core$IIndexed$_nth$arity$2(null,i__69796_70323);
frontend.handler.db_based.property.delete_property_value_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_70324__$1),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),value);


var G__70325 = seq__69793_70320;
var G__70326 = chunk__69794_70321;
var G__70327 = count__69795_70322;
var G__70328 = (i__69796_70323 + (1));
seq__69793_70320 = G__70325;
chunk__69794_70321 = G__70326;
count__69795_70322 = G__70327;
i__69796_70323 = G__70328;
continue;
} else {
var temp__5804__auto___70329 = cljs.core.seq(seq__69793_70320);
if(temp__5804__auto___70329){
var seq__69793_70332__$1 = temp__5804__auto___70329;
if(cljs.core.chunked_seq_QMARK_(seq__69793_70332__$1)){
var c__5525__auto___70333 = cljs.core.chunk_first(seq__69793_70332__$1);
var G__70334 = cljs.core.chunk_rest(seq__69793_70332__$1);
var G__70335 = c__5525__auto___70333;
var G__70336 = cljs.core.count(c__5525__auto___70333);
var G__70337 = (0);
seq__69793_70320 = G__70334;
chunk__69794_70321 = G__70335;
count__69795_70322 = G__70336;
i__69796_70323 = G__70337;
continue;
} else {
var block_70338__$1 = cljs.core.first(seq__69793_70332__$1);
frontend.handler.db_based.property.delete_property_value_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_70338__$1),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),value);


var G__70339 = cljs.core.next(seq__69793_70332__$1);
var G__70340 = null;
var G__70341 = (0);
var G__70342 = (0);
seq__69793_70320 = G__70339;
chunk__69794_70321 = G__70340;
count__69795_70322 = G__70341;
i__69796_70323 = G__70342;
continue;
}
} else {
}
}
break;
}

var r__60296__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___60293__auto__){
if(cljs.core.seq(r__60296__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__60296__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__60296__auto__)){
var request_id__60297__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__60298__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__60296__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__60297__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__60299__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__60297__auto__,request__60298__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__60297__auto__,request__60298__auto__));
return response__60299__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__69791);
}}
})()),(function (___40947__auto____$2){
return promesa.protocols._promise((((((!(many_QMARK_))) || (((many_QMARK_) && ((cljs.core.count(cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property))) <= (1)))))))?(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null)):null));
}));
})))),(function (___40947__auto____$2){
return promesa.protocols._promise(((cljs.core.fn_QMARK_(refresh_result_f))?(refresh_result_f.cljs$core$IFn$_invoke$arity$0 ? refresh_result_f.cljs$core$IFn$_invoke$arity$0() : refresh_result_f.call(null)):null));
}));
}));
}));
}));
});
frontend.components.property.value.repeat_setting = rum.core.lazy_build(rum.core.build_defc,(function (block,property){
var opts = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"exit-edit?","exit-edit?",1607853059),false], null);
var block__$1 = (function (){var G__69807 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__69807) : frontend.db.sub_block.call(null,G__69807));
})();
return daiquiri.core.create_element("div",{'className':"p-4 flex flex-col gap-4 w-64"},[daiquiri.core.create_element("div",{'className':"mb-4"},[daiquiri.core.create_element("div",{'className':"flex flex-row items-center gap-1"},[(function (){var attrs69814 = (function (){var G__69815 = block__$1;
var G__69816 = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.repeat","repeated?","logseq.property.repeat/repeated?",1908121789)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property.repeat","repeated?","logseq.property.repeat/repeated?",1908121789)));
var G__69817 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),(function (value){
if(cljs.core.truth_(value)){
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword("logseq.property.repeat","temporal-property","logseq.property.repeat/temporal-property",834610784),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property));
} else {
return frontend.handler.db_based.property.remove_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword("logseq.property.repeat","temporal-property","logseq.property.repeat/temporal-property",834610784));
}
}));
return (frontend.components.property.value.property_value.cljs$core$IFn$_invoke$arity$3 ? frontend.components.property.value.property_value.cljs$core$IFn$_invoke$arity$3(G__69815,G__69816,G__69817) : frontend.components.property.value.property_value.call(null,G__69815,G__69816,G__69817));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs69814))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["w-4"], null)], null),attrs69814], 0))):{'className':"w-4"}),((cljs.core.map_QMARK_(attrs69814))?null:[daiquiri.interpreter.interpret(attrs69814)]));
})(),(cljs.core.truth_((function (){var G__69823 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property);
var fexpr__69822 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.property","deadline","logseq.property/deadline",1685901604),null,new cljs.core.Keyword("logseq.property","scheduled","logseq.property/scheduled",1644520943),null], null), null);
return (fexpr__69822.cljs$core$IFn$_invoke$arity$1 ? fexpr__69822.cljs$core$IFn$_invoke$arity$1(G__69823) : fexpr__69822.call(null,G__69823));
})())?daiquiri.core.create_element("div",null,["Repeat task"]):daiquiri.core.create_element("div",null,["Repeat ",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"date","date",-1463434462),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property)))?"date":"datetime")]))])]),daiquiri.core.create_element("div",{'className':"flex flex-row gap-2"},[daiquiri.core.create_element("div",{'className':"flex text-muted-foreground mr-4"},["Every"]),(function (){var attrs69832 = (function (){var G__69840 = block__$1;
var G__69841 = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.repeat","recur-frequency","logseq.property.repeat/recur-frequency",871615922)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property.repeat","recur-frequency","logseq.property.repeat/recur-frequency",871615922)));
var G__69842 = opts;
return (frontend.components.property.value.property_value.cljs$core$IFn$_invoke$arity$3 ? frontend.components.property.value.property_value.cljs$core$IFn$_invoke$arity$3(G__69840,G__69841,G__69842) : frontend.components.property.value.property_value.call(null,G__69840,G__69841,G__69842));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs69832))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["w-6"], null)], null),attrs69832], 0))):{'className':"w-6"}),((cljs.core.map_QMARK_(attrs69832))?null:[daiquiri.interpreter.interpret(attrs69832)]));
})(),(function (){var attrs69839 = (function (){var G__69843 = block__$1;
var G__69844 = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.repeat","recur-unit","logseq.property.repeat/recur-unit",690306247)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property.repeat","recur-unit","logseq.property.repeat/recur-unit",690306247)));
var G__69845 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"property","property",-1114278232),property);
return (frontend.components.property.value.property_value.cljs$core$IFn$_invoke$arity$3 ? frontend.components.property.value.property_value.cljs$core$IFn$_invoke$arity$3(G__69843,G__69844,G__69845) : frontend.components.property.value.property_value.call(null,G__69843,G__69844,G__69845));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs69839))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["w-20"], null)], null),attrs69839], 0))):{'className':"w-20"}),((cljs.core.map_QMARK_(attrs69839))?null:[daiquiri.interpreter.interpret(attrs69839)]));
})()]),(function (){var properties = (function (){var G__69846 = new cljs.core.Keyword("db","id","db/id",-1388397098);
var G__69847 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853)))], null),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (property__$1){
return ((cljs.core.not((logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(property__$1) : logseq.db.built_in_QMARK_.call(null,property__$1)))) && ((cljs.core.count(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property__$1)) >= (2))));
}),logseq.outliner.property.get_block_full_properties((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1))));
return (frontend.util.distinct_by.cljs$core$IFn$_invoke$arity$2 ? frontend.util.distinct_by.cljs$core$IFn$_invoke$arity$2(G__69846,G__69847) : frontend.util.distinct_by.call(null,G__69846,G__69847));
})();
var status_property = (function (){var or__5002__auto__ = new cljs.core.Keyword("logseq.property.repeat","checked-property","logseq.property.repeat/checked-property",1866365553).cljs$core$IFn$_invoke$arity$1(block__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853)));
}
})();
var property_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(status_property);
var done_choice = (function (){var or__5002__auto__ = cljs.core.some((function (choice){
if(new cljs.core.Keyword("logseq.property","choice-checkbox-state","logseq.property/choice-checkbox-state",-1272422863).cljs$core$IFn$_invoke$arity$1(choice) === true){
return choice;
} else {
return null;
}
}),new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(status_property));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","status.done","logseq.property/status.done",-1827582082)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property","status.done","logseq.property/status.done",-1827582082)));
}
})();
return daiquiri.core.create_element("div",{'className':"flex flex-col gap-2"},[daiquiri.core.create_element("div",{'className':"text-muted-foreground"},["When"]),daiquiri.interpreter.interpret((function (){var G__69859 = (function (){var G__69862 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-value-change","on-value-change",-621835289),(function (v){
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword("logseq.property.repeat","checked-property","logseq.property.repeat/checked-property",1866365553),v);
})], null);
if(cljs.core.truth_(property_id)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__69862,new cljs.core.Keyword(null,"default-value","default-value",232220170),property_id);
} else {
return G__69862;
}
})();
var G__69860 = (function (){var G__69863 = (function (){var G__69864 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Select a property"], null);
return (logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1(G__69864) : logseq.shui.ui.select_value.call(null,G__69864));
})();
return (logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$1(G__69863) : logseq.shui.ui.select_trigger.call(null,G__69863));
})();
var G__69861 = (function (){var G__69865 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (choice){
var G__69866 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(choice)),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(choice)], null);
var G__69867 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(choice);
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__69866,G__69867) : logseq.shui.ui.select_item.call(null,G__69866,G__69867));
}),properties);
return (logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1(G__69865) : logseq.shui.ui.select_content.call(null,G__69865));
})();
return (logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3(G__69859,G__69860,G__69861) : logseq.shui.ui.select.call(null,G__69859,G__69860,G__69861));
})()),daiquiri.core.create_element("div",{'className':"flex flex-row gap-1"},[daiquiri.core.create_element("div",{'className':"text-muted-foreground"},["is:"]),(cljs.core.truth_(done_choice)?daiquiri.interpreter.interpret(logseq.db.frontend.property.property_value_content(done_choice)):null)])]);
})()]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.property.value/repeat-setting");
frontend.components.property.value.calendar_inner = rum.core.lazy_build(rum.core.build_defcs,(function (state,id,p__69870){
var map__69871 = p__69870;
var map__69871__$1 = cljs.core.__destructure_map(map__69871);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69871__$1,new cljs.core.Keyword(null,"block","block",664686210));
var property = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69871__$1,new cljs.core.Keyword(null,"property","property",-1114278232));
var datetime_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69871__$1,new cljs.core.Keyword(null,"datetime?","datetime?",-1173480100));
var on_change = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69871__$1,new cljs.core.Keyword(null,"on-change","on-change",-732046149));
var del_btn_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69871__$1,new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362));
var on_delete = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69871__$1,new cljs.core.Keyword(null,"on-delete","on-delete",-1882190355));
var block__$1 = (function (){var G__69872 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__69872) : frontend.db.sub_block.call(null,G__69872));
})();
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(block__$1,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
var value__$1 = ((cljs.core.map_QMARK_(value))?(function (){var temp__5804__auto__ = new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366).cljs$core$IFn$_invoke$arity$1(value);
if(cljs.core.truth_(temp__5804__auto__)){
var day = temp__5804__auto__;
var t = (frontend.date.journal_day__GT_utc_ms.cljs$core$IFn$_invoke$arity$1 ? frontend.date.journal_day__GT_utc_ms.cljs$core$IFn$_invoke$arity$1(day) : frontend.date.journal_day__GT_utc_ms.call(null,day));
return (new Date(t));
} else {
return null;
}
})():((typeof value === 'number')?(new Date(value)):(function (){var d = (new Date());
d.setHours((0),(0),(0));

return d;
})()
));
var _STAR_ident = new cljs.core.Keyword("frontend.components.property.value","identity","frontend.components.property.value/identity",1619434455).cljs$core$IFn$_invoke$arity$1(state);
var initial_day = value__$1;
var initial_month = (cljs.core.truth_(value__$1)?(function (){var d = cljs_time.coerce.to_date_time(value__$1);
return (new Date(cljs_time.core.last_day_of_the_month.cljs$core$IFn$_invoke$arity$1(cljs_time.core.date_time.cljs$core$IFn$_invoke$arity$2(cljs_time.core.year(d),cljs_time.core.month(d)))));
})():null);
var select_handler_BANG_ = (function (d){
if(cljs.core.truth_(d)){
var journal = frontend.date.js_date__GT_journal_title(d);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(journal) : frontend.db.get_page.call(null,journal)))?null:(function (){var G__69873 = journal;
var G__69874 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__69873,G__69874) : frontend.handler.page._LT_create_BANG_.call(null,G__69873,G__69874));
})())),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.fn_QMARK_(on_change))?(function (){var value__$2 = (cljs.core.truth_(datetime_QMARK_)?cljs_time.coerce.to_long(d):(frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(journal) : frontend.db.get_page.call(null,journal)));
return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(value__$2) : on_change.call(null,value__$2));
})():null)),(function (___40947__auto____$1){
return promesa.protocols._promise((cljs.core.truth_(datetime_QMARK_)?null:(function (){
(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(id) : logseq.shui.ui.popup_hide_BANG_.call(null,id));

frontend.ui.hide_popups_until_preview_popup_BANG_();

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
})()
));
}));
}));
}));
} else {
return null;
}
});
return daiquiri.core.create_element("div",{'className':"flex flex-row gap-2"},[daiquiri.core.create_element("div",{'className':"flex flex-col"},[frontend.ui.nlp_calendar((function (){var G__69878 = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"initial-focus","initial-focus",1154999719),true,new cljs.core.Keyword(null,"datetime?","datetime?",-1173480100),datetime_QMARK_,new cljs.core.Keyword(null,"selected","selected",574897764),initial_day,new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.deref(_STAR_ident),new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362),del_btn_QMARK_,new cljs.core.Keyword(null,"on-delete","on-delete",-1882190355),on_delete,new cljs.core.Keyword(null,"on-day-click","on-day-click",1918658076),select_handler_BANG_], null);
if(cljs.core.truth_(initial_month)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__69878,new cljs.core.Keyword(null,"default-month","default-month",-187077446),initial_month);
} else {
return G__69878;
}
})())]),daiquiri.interpreter.interpret((function (){var G__69880 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"orientation","orientation",623557579),"vertical"], null);
return (logseq.shui.ui.separator.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.separator.cljs$core$IFn$_invoke$arity$1(G__69880) : logseq.shui.ui.separator.call(null,G__69880));
})()),frontend.components.property.value.repeat_setting(block__$1,property)]);
}),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,rum.core.local.cljs$core$IFn$_invoke$arity$2(["calendar-inner-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(Date.now())].join(''),new cljs.core.Keyword("frontend.components.property.value","identity","frontend.components.property.value/identity",1619434455)),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
frontend.state.set_editor_action_BANG_(new cljs.core.Keyword(null,"property-set-date","property-set-date",-266599778));

return state;
}),new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
setTimeout((function (){
var G__69881 = cljs.core.deref(new cljs.core.Keyword("frontend.components.property.value","identity","frontend.components.property.value/identity",1619434455).cljs$core$IFn$_invoke$arity$1(state));
var G__69881__$1 = (((G__69881 == null))?null:document.getElementById(G__69881));
var G__69881__$2 = (((G__69881__$1 == null))?null:G__69881__$1.querySelector("[aria-selected=true]"));
if((G__69881__$2 == null)){
return null;
} else {
return G__69881__$2.focus();
}
}),(16));

return state;
}),new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));

(logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));

frontend.state.set_editor_action_BANG_(null);

return state;
})], null)], null),"frontend.components.property.value/calendar-inner");
frontend.components.property.value.overdue = rum.core.lazy_build(rum.core.build_defc,(function (date,content){
var vec__69885 = rum.core.use_state(cljs_time.core.now());
var current_time = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69885,(0),null);
var set_current_time_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69885,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
var timer = setInterval((function (){
var G__69888 = cljs_time.core.now();
return (set_current_time_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_current_time_BANG_.cljs$core$IFn$_invoke$arity$1(G__69888) : set_current_time_BANG_.call(null,G__69888));
}),(((1000) * (60)) * (3)));
return (function (){
return clearInterval(timer);
});
}),cljs.core.PersistentVector.EMPTY);

var overdue_QMARK_ = (cljs.core.truth_(date)?cljs_time.core.after_QMARK_(current_time,cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(date,cljs_time.core.seconds.cljs$core$IFn$_invoke$arity$1((59)))):null);
var attrs69884 = (function (){var G__69889 = cljs.core.PersistentArrayMap.EMPTY;
if(cljs.core.truth_(overdue_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__69889,new cljs.core.Keyword(null,"class","class",-2030961996),"overdue",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"title","title",636505583),"Overdue"], 0));
} else {
return G__69889;
}
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs69884))?daiquiri.interpreter.element_attributes(attrs69884):null),((cljs.core.map_QMARK_(attrs69884))?[daiquiri.interpreter.interpret(content)]:[daiquiri.interpreter.interpret(attrs69884),daiquiri.interpreter.interpret(content)]));
}),null,"frontend.components.property.value/overdue");
frontend.components.property.value.human_date_label = (function frontend$components$property$value$human_date_label(date){
var given_date = frontend.date.start_of_day(date);
var now = cljs_time.local.local_now();
var today = frontend.date.start_of_day(now);
var tomorrow = cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(today,cljs_time.core.days.cljs$core$IFn$_invoke$arity$1((1)));
var yesterday = cljs_time.core.minus.cljs$core$IFn$_invoke$arity$2(today,cljs_time.core.days.cljs$core$IFn$_invoke$arity$1((1)));
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs_time.core.before_QMARK_(given_date,today);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(cljs_time.core.before_QMARK_(given_date,yesterday));
} else {
return and__5000__auto__;
}
})())){
return "Yesterday";
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(cljs_time.core.before_QMARK_(given_date,today));
if(and__5000__auto__){
return cljs_time.core.before_QMARK_(given_date,tomorrow);
} else {
return and__5000__auto__;
}
})())){
return "Today";
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(cljs_time.core.before_QMARK_(given_date,tomorrow));
if(and__5000__auto__){
return cljs_time.core.before_QMARK_(given_date,cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(tomorrow,cljs_time.core.days.cljs$core$IFn$_invoke$arity$1((1))));
} else {
return and__5000__auto__;
}
})())){
return "Tomorrow";
} else {
return null;

}
}
}
});
frontend.components.property.value.datetime_value = rum.core.lazy_build(rum.core.build_defc,(function (value,property_id,repeated_task_QMARK_){
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = cljs_time.core.to_default_time_zone(cljs_time.coerce.from_long(value));
if(cljs.core.truth_(temp__5804__auto__)){
var date = temp__5804__auto__;
var content = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ls-datetime.flex.flex-row.gap-1.items-center","div.ls-datetime.flex.flex-row.gap-1.items-center",-1207539895),(function (){var temp__5804__auto____$1 = frontend.state.get_component(new cljs.core.Keyword("block","page-cp","block/page-cp",975876274));
if(cljs.core.truth_(temp__5804__auto____$1)){
var page_cp = temp__5804__auto____$1;
var page_title = frontend.date.journal_name.cljs$core$IFn$_invoke$arity$1(date);
return rum.core.with_key((function (){var G__69892 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"disable-preview?","disable-preview?",1485814365),true,new cljs.core.Keyword(null,"show-non-exists-page?","show-non-exists-page?",-1180311666),true,new cljs.core.Keyword(null,"label","label",1718410804),frontend.components.property.value.human_date_label(date)], null);
var G__69893 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","name","block/name",1619760316),page_title], null);
return (page_cp.cljs$core$IFn$_invoke$arity$2 ? page_cp.cljs$core$IFn$_invoke$arity$2(G__69892,G__69893) : page_cp.call(null,G__69892,G__69893));
})(),page_title);
} else {
return null;
}
})(),(function (){var date__$1 = (new Date(value));
var hours = date__$1.getHours();
var minutes = date__$1.getMinutes();
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.select-none","span.select-none",461310438),[frontend.util.zero_pad(hours),":",frontend.util.zero_pad(minutes)].join('')], null);
})()], null);
if(cljs.core.truth_((function (){var or__5002__auto__ = repeated_task_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.property","deadline","logseq.property/deadline",1685901604),null,new cljs.core.Keyword("logseq.property","scheduled","logseq.property/scheduled",1644520943),null], null), null),property_id);
}
})())){
return frontend.components.property.value.overdue(date,content);
} else {
return content;
}
} else {
return null;
}
})());
}),null,"frontend.components.property.value/datetime-value");
frontend.components.property.value.delete_block_property_BANG_ = (function frontend$components$property$value$delete_block_property_BANG_(block,property){
frontend.handler.editor.move_cross_boundary_up_down(new cljs.core.Keyword(null,"up","up",-269712113),cljs.core.PersistentArrayMap.EMPTY);

return frontend.handler.property.remove_block_property_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
});
frontend.components.property.value.date_picker = rum.core.lazy_build(rum.core.build_defc,(function (value,p__69894){
var map__69895 = p__69894;
var map__69895__$1 = cljs.core.__destructure_map(map__69895);
var on_change = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69895__$1,new cljs.core.Keyword(null,"on-change","on-change",-732046149));
var datetime_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69895__$1,new cljs.core.Keyword(null,"datetime?","datetime?",-1173480100));
var other_position_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69895__$1,new cljs.core.Keyword(null,"other-position?","other-position?",-1396628322));
var editing_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69895__$1,new cljs.core.Keyword(null,"editing?","editing?",1646440800));
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69895__$1,new cljs.core.Keyword(null,"block","block",664686210));
var property = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69895__$1,new cljs.core.Keyword(null,"property","property",-1114278232));
var on_delete = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69895__$1,new cljs.core.Keyword(null,"on-delete","on-delete",-1882190355));
var del_btn_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69895__$1,new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362));
var multiple_values_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69895__$1,new cljs.core.Keyword(null,"multiple-values?","multiple-values?",1567692022));
var _STAR_el = rum.core.use_ref(null);
var content_fn = (function (p__69896){
var map__69897 = p__69896;
var map__69897__$1 = cljs.core.__destructure_map(map__69897);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69897__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
return frontend.components.property.value.calendar_inner(id,new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword(null,"property","property",-1114278232),property,new cljs.core.Keyword(null,"on-change","on-change",-732046149),on_change,new cljs.core.Keyword(null,"value","value",305978217),value,new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362),del_btn_QMARK_,new cljs.core.Keyword(null,"on-delete","on-delete",-1882190355),on_delete,new cljs.core.Keyword(null,"datetime?","datetime?",-1173480100),datetime_QMARK_], null));
});
var open_popup_BANG_ = (function (e){
if(cljs.core.truth_((function (){var or__5002__auto__ = frontend.util.meta_key_QMARK_(e);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.util.shift_key_QMARK_(e);
}
})())){
return null;
} else {
frontend.util.stop(e);

frontend.handler.editor.save_current_block_BANG_.cljs$core$IFn$_invoke$arity$0();

if(frontend.config.publishing_QMARK_){
return null;
} else {
var G__69904 = e.target;
var G__69905 = content_fn;
var G__69906 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"align","align",1964212802),"start",new cljs.core.Keyword(null,"auto-focus?","auto-focus?",1021654593),true], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__69904,G__69905,G__69906) : logseq.shui.ui.popup_show_BANG_.call(null,G__69904,G__69905,G__69906));
}
}
});
var repeated_task_QMARK_ = new cljs.core.Keyword("logseq.property.repeat","repeated?","logseq.property.repeat/repeated?",1908121789).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(editing_QMARK_)){
return daiquiri.interpreter.interpret(content_fn(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"date-picker","date-picker",882557010)], null)));
} else {
if(cljs.core.truth_(multiple_values_QMARK_)){
return daiquiri.interpreter.interpret((function (){var G__69909 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"class","class",-2030961996),"jtrigger h-6 empty-btn",new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),open_popup_BANG_,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["Backspace",null,"Delete",null], null), null),frontend.util.ekey(e))){
return frontend.components.property.value.delete_block_property_BANG_(block,property);
} else {
return null;
}
})], null);
var G__69910 = frontend.ui.icon("calendar-plus",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(16)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__69909,G__69910) : logseq.shui.ui.button.call(null,G__69909,G__69910));
})());
} else {
return daiquiri.interpreter.interpret((function (){var G__69921 = new cljs.core.Keyword(null,"div.flex.flex-1.flex-row.gap-1.items-center.flex-wrap","div.flex.flex-1.flex-row.gap-1.items-center.flex-wrap",418909079);
var G__69922 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_el,new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),(0),new cljs.core.Keyword(null,"class","class",-2030961996),"jtrigger min-h-[24px]",new cljs.core.Keyword(null,"on-click","on-click",1632826543),open_popup_BANG_,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
var G__69924 = frontend.util.ekey(e);
switch (G__69924) {
case "Backspace":
case "Delete":
return frontend.components.property.value.delete_block_property_BANG_(block,property);

break;
case " ":
case "Enter":
var G__69925_70355 = rum.core.deref(_STAR_el);
if((G__69925_70355 == null)){
} else {
G__69925_70355.click();
}

return frontend.util.stop(e);

break;
default:
return null;

}
})], null);
var G__69923 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.gap-1.items-center","div.flex.flex-row.gap-1.items-center",1211135204),(cljs.core.truth_(repeated_task_QMARK_)?frontend.ui.icon("repeat",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),(14),new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-40"], null)):null),((cljs.core.map_QMARK_(value))?(function (){var date = cljs_time.coerce.to_date_time((function (){var G__69926 = new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366).cljs$core$IFn$_invoke$arity$1(value);
return (frontend.date.journal_day__GT_utc_ms.cljs$core$IFn$_invoke$arity$1 ? frontend.date.journal_day__GT_utc_ms.cljs$core$IFn$_invoke$arity$1(G__69926) : frontend.date.journal_day__GT_utc_ms.call(null,G__69926));
})());
var compare_value = (function (){var G__69927 = date;
var G__69927__$1 = (((G__69927 == null))?null:cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(G__69927,cljs_time.core.days.cljs$core$IFn$_invoke$arity$1((1))));
if((G__69927__$1 == null)){
return null;
} else {
return cljs_time.core.minus.cljs$core$IFn$_invoke$arity$2(G__69927__$1,cljs_time.core.seconds.cljs$core$IFn$_invoke$arity$1((1)));
}
})();
var content = (function (){var temp__5804__auto__ = frontend.state.get_component(new cljs.core.Keyword("block","page-cp","block/page-cp",975876274));
if(cljs.core.truth_(temp__5804__auto__)){
var page_cp = temp__5804__auto__;
return rum.core.with_key((function (){var G__69928 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"disable-preview?","disable-preview?",1485814365),true,new cljs.core.Keyword(null,"meta-click?","meta-click?",-448948649),other_position_QMARK_,new cljs.core.Keyword(null,"label","label",1718410804),frontend.components.property.value.human_date_label(cljs_time.core.to_default_time_zone(date))], null);
var G__69929 = value;
return (page_cp.cljs$core$IFn$_invoke$arity$2 ? page_cp.cljs$core$IFn$_invoke$arity$2(G__69928,G__69929) : page_cp.call(null,G__69928,G__69929));
})(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value));
} else {
return null;
}
})();
if(cljs.core.truth_((function (){var or__5002__auto__ = repeated_task_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.property","deadline","logseq.property/deadline",1685901604),null,new cljs.core.Keyword("logseq.property","scheduled","logseq.property/scheduled",1644520943),null], null), null),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property));
}
})())){
return frontend.components.property.value.overdue(compare_value,content);
} else {
return content;
}
})():((typeof value === 'number')?frontend.components.property.value.datetime_value(value,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),repeated_task_QMARK_):frontend.components.property.value.property_empty_btn_value(null)
))], null);
return (logseq.shui.ui.trigger_as.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.trigger_as.cljs$core$IFn$_invoke$arity$3(G__69921,G__69922,G__69923) : logseq.shui.ui.trigger_as.call(null,G__69921,G__69922,G__69923));
})());
}
}
}),null,"frontend.components.property.value/date-picker");
frontend.components.property.value.property_value_date_picker = rum.core.lazy_build(rum.core.build_defc,(function (block,property,value,opts){
var multiple_values_QMARK_ = logseq.db.frontend.property.many_QMARK_(property);
var repo = frontend.state.get_current_repo();
var datetime_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"datetime","datetime",494675702),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property));
return frontend.components.property.value.date_picker(value,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"block","block",664686210),block,new cljs.core.Keyword(null,"property","property",-1114278232),property,new cljs.core.Keyword(null,"datetime?","datetime?",-1173480100),datetime_QMARK_,new cljs.core.Keyword(null,"multiple-values?","multiple-values?",1567692022),multiple_values_QMARK_,new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (value__$1){
var blocks = frontend.components.property.value.get_operating_blocks(block);
return frontend.handler.property.batch_set_block_property_BANG_(repo,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),((datetime_QMARK_)?value__$1:new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value__$1)));
}),new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362),(!((value == null))),new cljs.core.Keyword(null,"on-delete","on-delete",-1882190355),(function (e){
frontend.util.stop_propagation(e);

var blocks_70356 = frontend.components.property.value.get_operating_blocks(block);
frontend.handler.property.batch_set_block_property_BANG_(repo,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks_70356),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),null);

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null)], 0)));
}),null,"frontend.components.property.value/property-value-date-picker");
frontend.components.property.value._LT_create_page_if_not_exists_BANG_ = (function frontend$components$property$value$_LT_create_page_if_not_exists_BANG_(block,property,classes,page){
var page_STAR_ = clojure.string.trim(page);
var vec__69933 = ((((cljs.core.seq(classes)) && ((!(cljs.core.contains_QMARK_(logseq.db.frontend.property.db_attribute_properties,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property)))))))?(function (){var or__5002__auto__ = cljs.core.seq(cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.trim,cljs.core.rest(cljs.core.re_find(/(.*)#(.*)$/,page_STAR_))));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [page_STAR_,null], null);
}
})():new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [page_STAR_,null], null));
var page__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69933,(0),null);
var inline_class = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69933,(1),null);
var page_entity = logseq.db.get_case_page((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),page__$1);
var id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page_entity);
var class_QMARK_ = (function (){var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
if(and__5000__auto__){
return (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.class_QMARK_.call(null,block));
} else {
return and__5000__auto__;
}
}
})();
var page_QMARK_ = (logseq.db.internal_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.internal_page_QMARK_.cljs$core$IFn$_invoke$arity$1(page_entity) : logseq.db.internal_page_QMARK_.call(null,page_entity));
if(cljs.core.truth_((function (){var or__5002__auto__ = (id == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = class_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(page_QMARK_);
} else {
return and__5000__auto__;
}
}
})())){
var inline_class_uuid = (cljs.core.truth_(inline_class)?(function (){var or__5002__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(logseq.db.get_case_page((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),inline_class));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.components.property.value",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"msg","msg",-1386103444),"Given inline class does not exist",new cljs.core.Keyword(null,"inline-class","inline-class",1765361162),inline_class,new cljs.core.Keyword(null,"line","line",212345235),595], null)),null);

return null;
}
})():null);
var create_options = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false,new cljs.core.Keyword(null,"tags","tags",1771418977),(cljs.core.truth_(inline_class_uuid)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [inline_class_uuid], null):cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.take.cljs$core$IFn$_invoke$arity$2((1),classes)))], null);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(class_QMARK_)?frontend.handler.db_based.page._LT_create_class_BANG_(page__$1,create_options):(frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(page__$1,create_options) : frontend.handler.page._LT_create_BANG_.call(null,page__$1,create_options)))),(function (page__$2){
return promesa.protocols._promise(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(page__$2));
}));
}));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = class_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = page_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return id;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.page.convert_to_tag_BANG_(page_entity)),(function (_){
return promesa.protocols._promise(id);
}));
}));
} else {
return id;

}
}
});
frontend.components.property.value.sort_select_items = (function frontend$components$property$value$sort_select_items(property,selected_choices,items){
if(cljs.core.truth_(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property))){
return items;
} else {
return cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(cljs.core.juxt.cljs$core$IFn$_invoke$arity$2((function (item){
return cljs.core.not((function (){var G__69941 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(item);
return (selected_choices.cljs$core$IFn$_invoke$arity$1 ? selected_choices.cljs$core$IFn$_invoke$arity$1(G__69941) : selected_choices.call(null,G__69941));
})());
}),logseq.db.frontend.property.property_value_content),items);
}
});
frontend.components.property.value.select_aux = rum.core.lazy_build(rum.core.build_defc,(function (block,property,p__69948){
var map__69957 = p__69948;
var map__69957__$1 = cljs.core.__destructure_map(map__69957);
var opts = map__69957__$1;
var items = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69957__$1,new cljs.core.Keyword(null,"items","items",1031954938));
var selected_choices = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69957__$1,new cljs.core.Keyword(null,"selected-choices","selected-choices",1913324317));
var multiple_choices_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69957__$1,new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490));
var selected_choices__$1 = cljs.core.set(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__69943_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837),p1__69943_SHARP_);
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,selected_choices)));
var clear_value = ["No ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property))].join('');
var clear_value_label = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1.text-sm","div.flex.flex-row.items-center.gap-1.text-sm",1556443449),frontend.ui.icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),clear_value], null)], null);
var vec__69964 = (function (){var G__69967 = frontend.components.property.value.sort_select_items(property,selected_choices__$1,items);
return (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(G__69967) : logseq.shui.hooks.use_state.call(null,G__69967));
})();
var items__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69964,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69964,(1),null);
var items_SINGLEQUOTE_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__69944_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(p1__69944_SHARP_));
}),((((cljs.core.seq(selected_choices__$1)) && (((cljs.core.not(multiple_choices_QMARK_)) && (((cljs.core.not((function (){var and__5000__auto____$2 = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.class_QMARK_.call(null,block));
if(cljs.core.truth_(and__5000__auto____$2)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509));
} else {
return and__5000__auto____$2;
}
})())) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607)))))))))?cljs.core.concat.cljs$core$IFn$_invoke$arity$2(items__$1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"value","value",305978217),clear_value,new cljs.core.Keyword(null,"label","label",1718410804),clear_value_label,new cljs.core.Keyword(null,"clear?","clear?",1363344639),true], null)], null)):items__$1));
var k = new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900);
var f = cljs.core.get.cljs$core$IFn$_invoke$arity$2(opts,k);
var f_SINGLEQUOTE_ = (function (chosen,selected_QMARK_){
if(cljs.core.truth_((function (){var or__5002__auto__ = ((cljs.core.not(multiple_choices_QMARK_)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(chosen,clear_value)));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = multiple_choices_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(chosen,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [clear_value], null));
} else {
return and__5000__auto__;
}
}
})())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var blocks = frontend.components.property.value.get_operating_blocks(block);
var block_ids = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks);
return frontend.handler.property.batch_remove_block_property_BANG_(frontend.state.get_current_repo(),block_ids,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
})()),(function (___40947__auto__){
return promesa.protocols._promise(((new cljs.core.Keyword(null,"exit-edit?","exit-edit?",1607853059).cljs$core$IFn$_invoke$arity$1(opts) === false)?null:(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null))));
}));
}));
} else {
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(chosen,selected_QMARK_) : f.call(null,chosen,selected_QMARK_));
}
});
return frontend.components.select.select(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"selected-choices","selected-choices",1913324317),selected_choices__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"items","items",1031954938),items_SINGLEQUOTE_,k,f_SINGLEQUOTE_], 0)));
}),null,"frontend.components.property.value/select-aux");
frontend.components.property.value.get_node_icon = (function frontend$components$property$value$get_node_icon(node){
if(cljs.core.truth_((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(node) : logseq.db.class_QMARK_.call(null,node)))){
return "hash";
} else {
if(cljs.core.truth_((logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(node) : logseq.db.property_QMARK_.call(null,node)))){
return "letter-p";
} else {
if(cljs.core.truth_(logseq.db.frontend.entity_util.page_QMARK_(node))){
return "page";
} else {
return "letter-n";

}
}
}
});
frontend.components.property.value.select_node = rum.core.lazy_build(rum.core.build_defc,(function (property,p__69978,result){
var map__69979 = p__69978;
var map__69979__$1 = cljs.core.__destructure_map(map__69979);
var opts = map__69979__$1;
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69979__$1,new cljs.core.Keyword(null,"block","block",664686210));
var multiple_choices_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69979__$1,new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490));
var dropdown_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69979__$1,new cljs.core.Keyword(null,"dropdown?","dropdown?",-1027769147));
var input_opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69979__$1,new cljs.core.Keyword(null,"input-opts","input-opts",1688681135));
var on_input = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69979__$1,new cljs.core.Keyword(null,"on-input","on-input",-267523366));
var add_new_choice_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69979__$1,new cljs.core.Keyword(null,"add-new-choice!","add-new-choice!",-1703027977));
var target = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69979__$1,new cljs.core.Keyword(null,"target","target",253001721));
var repo = frontend.state.get_current_repo();
var classes = new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486).cljs$core$IFn$_invoke$arity$1(property);
var tags_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
var alias_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","alias","block/alias",-2112644699),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
var tags_or_alias_QMARK_ = ((tags_QMARK_) || (alias_QMARK_));
var block__$1 = (function (){var or__5002__auto__ = (function (){var G__69980 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__69980) : frontend.db.entity.call(null,G__69980));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return block;
}
})();
var selected_choices = (cljs.core.truth_(block__$1)?(function (){var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(block__$1,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
if(cljs.core.truth_(temp__5804__auto__)){
var v = temp__5804__auto__;
if(cljs.core.every_QMARK_(frontend.components.property.value.entity_map_QMARK_,v)){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),v);
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v)], null);
}
} else {
return null;
}
})():null);
var parent_property_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509));
var children_pages = ((parent_property_QMARK_)?frontend.db.model.get_structured_children(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1)):null);
var property_type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var nodes = ((parent_property_QMARK_)?(function (){var exclude_ids = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(id) : frontend.db.entity.call(null,id)));
}),children_pages)),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1));
var options = (cljs.core.truth_((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(block__$1) : logseq.db.class_QMARK_.call(null,block__$1)))?frontend.db.model.get_all_classes(repo):result);
var excluded_options = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (e){
return cljs.core.contains_QMARK_(exclude_ids,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(e));
}),options);
return excluded_options;
})():((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"property","property",-1114278232),null,new cljs.core.Keyword(null,"class","class",-2030961996),null], null), null),property_type))?(function (){var classes__$1 = frontend.db.model.get_all_classes.cljs$core$IFn$_invoke$arity$variadic(repo,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"except-root-class?","except-root-class?",-345353595),true,new cljs.core.Keyword(null,"except-private-tags?","except-private-tags?",1020635160),(!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.property","template-applied-to","logseq.property/template-applied-to",-429124322),null], null), null),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property))))], null)], 0));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_type,new cljs.core.Keyword(null,"class","class",-2030961996))){
return classes__$1;
} else {
return frontend.handler.property.get_class_property_choices();
}
})():((cljs.core.seq(classes))?cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (class$){
return frontend.db.model.get_class_objects(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(class$));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([classes], 0))):((cljs.core.empty_QMARK_(result))?(function (){var v = cljs.core.get.cljs$core$IFn$_invoke$arity$2(block__$1,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__69973_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__69973_SHARP_));
}),((cljs.core.every_QMARK_(frontend.components.property.value.entity_map_QMARK_,v))?v:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [v], null)));
})():cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (node){
var node_SINGLEQUOTE_ = (cljs.core.truth_(new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(node))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(node),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(node)):node);
var node__$1 = (function (){var or__5002__auto__ = (function (){var G__69982 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(node_SINGLEQUOTE_);
if((G__69982 == null)){
return null;
} else {
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__69982) : frontend.db.entity.call(null,G__69982));
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return node;
}
})();
var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(node__$1));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = ((alias_QMARK_) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((function (){var or__5002__auto____$1 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block__$1));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1);
}
})(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(node__$1))));
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(node__$1));
if(or__5002__auto____$2){
return or__5002__auto____$2;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_type,new cljs.core.Keyword(null,"class","class",-2030961996))){
var G__69983 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(node__$1);
return (logseq.db.private_tags.cljs$core$IFn$_invoke$arity$1 ? logseq.db.private_tags.cljs$core$IFn$_invoke$arity$1(G__69983) : logseq.db.private_tags.call(null,G__69983));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = property_type;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(property_type,new cljs.core.Keyword(null,"node","node",581201198));
} else {
return and__5000__auto__;
}
})())){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_type,new cljs.core.Keyword(null,"page","page",849072397))){
return cljs.core.not((frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(node__$1) : frontend.db.page_QMARK_.call(null,node__$1)));
} else {
return (!(cljs.core.contains_QMARK_((logseq.db.get_entity_types.cljs$core$IFn$_invoke$arity$1 ? logseq.db.get_entity_types.cljs$core$IFn$_invoke$arity$1(node__$1) : logseq.db.get_entity_types.call(null,node__$1)),property_type)));
}
} else {
return false;

}
}
}
}
}
}),result))
)));
var options = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (node){
var node__$1 = (cljs.core.truth_(new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(node))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(node),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(node)):node);
var id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(node__$1);
var vec__69984 = ((cljs.core.integer_QMARK_(id))?(function (){var node_title = ((cljs.core.seq(new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486).cljs$core$IFn$_invoke$arity$1(property)))?logseq.db.frontend.content.recur_replace_uuid_in_block_title.cljs$core$IFn$_invoke$arity$1(node__$1):frontend.handler.block.block_unique_title(node__$1));
var title = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(node_title,(0),(256));
var node__$2 = (function (){var or__5002__auto__ = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(id) : frontend.db.entity.call(null,id));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return node__$1;
}
})();
var icon = frontend.components.property.value.get_node_icon(node__$2);
var header = (cljs.core.truth_((frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(node__$2) : frontend.db.page_QMARK_.call(null,node__$2)))?null:(function (){var temp__5804__auto__ = frontend.state.get_component(new cljs.core.Keyword("block","breadcrumb","block/breadcrumb",1725167425));
if(cljs.core.truth_(temp__5804__auto__)){
var breadcrumb = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.opacity-70","div.text-xs.opacity-70",-1130707358),(function (){var G__69987 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"search?","search?",785472524),true], null);
var G__69988 = frontend.state.get_current_repo();
var G__69989 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(node__$2);
var G__69990 = cljs.core.PersistentArrayMap.EMPTY;
return (breadcrumb.cljs$core$IFn$_invoke$arity$4 ? breadcrumb.cljs$core$IFn$_invoke$arity$4(G__69987,G__69988,G__69989,G__69990) : breadcrumb.call(null,G__69987,G__69988,G__69989,G__69990));
})()], null);
} else {
return null;
}
})());
var label = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1","div.flex.flex-row.items-center.gap-1",-1023433319),(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486).cljs$core$IFn$_invoke$arity$1(property);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"property","property",-1114278232),null,new cljs.core.Keyword(null,"class","class",-2030961996),null], null), null),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property));
}
})())?null:frontend.ui.icon(icon,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),title], null)], null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [header,label], null);
})():new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(node__$1)], null));
var header = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69984,(0),null);
var label = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69984,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(node__$1,new cljs.core.Keyword(null,"header","header",119441134),header,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"label-value","label-value",-1719020519),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(node__$1),new cljs.core.Keyword(null,"label","label",1718410804),label,new cljs.core.Keyword(null,"value","value",305978217),id,new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),((tags_QMARK_) && (cljs.core.contains_QMARK_(clojure.set.union.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.class","Whiteboard","logseq.class/Whiteboard",1013698452),null,new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081),null], null), null),logseq.db.internal_tags),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(node__$1))))], 0));
}),nodes);
var classes_SINGLEQUOTE_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (class$){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.class","Root","logseq.class/Root",273783827),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(class$));
}),classes);
var opts_SINGLEQUOTE_ = (function (){var G__69991 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),new cljs.core.Keyword(null,"dropdown?","dropdown?",-1027769147),new cljs.core.Keyword(null,"show-new-when-not-exact-match?","show-new-when-not-exact-match?",1510536201),new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),new cljs.core.Keyword(null,"input-default-placeholder","input-default-placeholder",-1040139250),new cljs.core.Keyword(null,"extract-chosen-fn","extract-chosen-fn",1058364622),new cljs.core.Keyword(null,"input-opts","input-opts",1688681135),new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490),new cljs.core.Keyword(null,"items","items",1031954938),new cljs.core.Keyword(null,"on-input","on-input",-267523366),new cljs.core.Keyword(null,"selected-choices","selected-choices",1913324317)],[(function (chosen,selected_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050))) && ((!(cljs.core.integer_QMARK_(chosen)))))),(function (add_tag_property_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.integer_QMARK_(chosen))?chosen:((clojure.string.blank_QMARK_(clojure.string.trim(chosen)))?null:((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050)))?(function (){
(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","new-property","editor/new-property",-1370252491),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"block","block",664686210),block__$1,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900),true,new cljs.core.Keyword(null,"property-key","property-key",972402246),chosen,new cljs.core.Keyword(null,"target","target",253001721),target], null)], null));
})()
:frontend.components.property.value._LT_create_page_if_not_exists_BANG_(block__$1,property,classes_SINGLEQUOTE_,chosen))))),(function (id){
return promesa.protocols._mcat(promesa.protocols._promise(((((cljs.core.integer_QMARK_(id)) && (cljs.core.not(logseq.db.frontend.entity_util.page_QMARK_((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(id) : frontend.db.entity.call(null,id)))))))?frontend.db.async._LT_get_block(repo,id):null)),(function (_){
return promesa.protocols._promise((cljs.core.truth_(id)?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.property.value.add_or_remove_property_value(block__$1,property,id,selected_QMARK_,cljs.core.PersistentArrayMap.EMPTY)),(function (___40947__auto__){
return promesa.protocols._promise(((cljs.core.fn_QMARK_(add_new_choice_BANG_))?(function (){var G__69993 = (function (){var e = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(id) : frontend.db.entity.call(null,id));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),cljs.core.select_keys(e,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null)),new cljs.core.Keyword(null,"label","label",1718410804),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(e)], null);
})();
return (add_new_choice_BANG_.cljs$core$IFn$_invoke$arity$1 ? add_new_choice_BANG_.cljs$core$IFn$_invoke$arity$1(G__69993) : add_new_choice_BANG_.call(null,G__69993));
})():null));
}));
})):(cljs.core.truth_(add_tag_property_QMARK_)?null:lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.components.property.value",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"msg","msg",-1386103444),"No :db/id found or created for chosen",new cljs.core.Keyword(null,"chosen","chosen",-1422409985),chosen,new cljs.core.Keyword(null,"line","line",212345235),833], null)),null))));
}));
}));
}));
}));
}),dropdown_QMARK_,((((((parent_property_QMARK_) && (cljs.core.contains_QMARK_(cljs.core.set(children_pages),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1))))) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property))) && (cljs.core.seq(clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),classes_SINGLEQUOTE_)),logseq.db.private_tags)))))))?false:true),(function (x){
var or__5002__auto__ = new cljs.core.Keyword(null,"label-value","label-value",-1719020519).cljs$core$IFn$_invoke$arity$1(x);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(x);
}
}),((tags_QMARK_)?"Set tags":((alias_QMARK_)?"Set alias":["Set ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property))].join('')
)),new cljs.core.Keyword(null,"value","value",305978217),input_opts,multiple_choices_QMARK_,options,goog.functions.debounce(on_input,(50)),selected_choices])], 0));
if(((cljs.core.seq(classes_SINGLEQUOTE_)) && ((!(tags_or_alias_QMARK_))))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__69991,new cljs.core.Keyword(null,"transform-fn","transform-fn",1106801327),(function (results,input){
var temp__5802__auto__ = (function (){var and__5000__auto__ = cljs.core.empty_QMARK_(results);
if(and__5000__auto__){
return cljs.core.re_find(/(.*)#(.*)$/,input);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var vec__69994 = temp__5802__auto__;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69994,(0),null);
var new_page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69994,(1),null);
var class_input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69994,(2),null);
var repo__$1 = frontend.state.get_current_repo();
var descendent_classes = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__69976_SHARP_){
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$2 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$2(repo__$1,p1__69976_SHARP_) : frontend.db.entity.call(null,repo__$1,p1__69976_SHARP_));
}),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__69975_SHARP_){
return frontend.db.model.get_structured_children(repo__$1,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__69975_SHARP_));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([classes_SINGLEQUOTE_], 0)));
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new_page),"#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(p))].join(''),new cljs.core.Keyword(null,"label","label",1718410804),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new_page),"#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(p))].join('')], null);
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__69977_SHARP_){
return clojure.string.includes_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(p1__69977_SHARP_),class_input);
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(classes_SINGLEQUOTE_,descendent_classes)));
} else {
return results;
}
}));
} else {
return G__69991;
}
})();
return frontend.components.property.value.select_aux(block__$1,property,opts_SINGLEQUOTE_);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.property.value/select-node");
frontend.components.property.value.property_value_select_node = rum.core.lazy_build(rum.core.build_defc,(function (block,property,opts,p__69997){
var map__69998 = p__69997;
var map__69998__$1 = cljs.core.__destructure_map(map__69998);
var _STAR_show_new_property_config_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69998__$1,new cljs.core.Keyword(null,"*show-new-property-config?","*show-new-property-config?",-1054571618));
var vec__69999 = rum.core.use_state(null);
var initial_choices = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69999,(0),null);
var set_initial_choices_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69999,(1),null);
var vec__70002 = rum.core.use_state(null);
var result = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70002,(0),null);
var set_result_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70002,(1),null);
var set_result_and_initial_choices_BANG_ = (function (value){
(set_initial_choices_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_initial_choices_BANG_.cljs$core$IFn$_invoke$arity$1(value) : set_initial_choices_BANG_.call(null,value));

return (set_result_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_result_BANG_.cljs$core$IFn$_invoke$arity$1(value) : set_result_BANG_.call(null,value));
});
var input_opts = (function (_){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(cljs.core.truth_(_STAR_show_new_property_config_QMARK_)){
return cljs.core.reset_BANG_(_STAR_show_new_property_config_QMARK_,false);
} else {
return null;
}
}),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
var G__70005 = frontend.util.ekey(e);
switch (G__70005) {
case "Escape":
var temp__5804__auto__ = new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(temp__5804__auto__)){
var f = temp__5804__auto__;
return (f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null));
} else {
return null;
}

break;
default:
return null;

}
})], null);
});
var opts_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"block","block",664686210),block,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"input-opts","input-opts",1688681135),input_opts,new cljs.core.Keyword(null,"on-input","on-input",-267523366),(function (v){
if(clojure.string.blank_QMARK_(v)){
return (set_result_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_result_BANG_.cljs$core$IFn$_invoke$arity$1(initial_choices) : set_result_BANG_.call(null,initial_choices));
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.search.block_search(frontend.state.get_current_repo(),v,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"enable-snippet?","enable-snippet?",-692858749),false,new cljs.core.Keyword(null,"built-in?","built-in?",2078421512),false], null))),(function (result__$1){
return promesa.protocols._promise((set_result_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_result_BANG_.cljs$core$IFn$_invoke$arity$1(result__$1) : set_result_BANG_.call(null,result__$1)));
}));
}));
}
}),new cljs.core.Keyword(null,"add-new-choice!","add-new-choice!",-1703027977),(function (new_choice){
var G__70006 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(initial_choices),new_choice);
return (set_initial_choices_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_initial_choices_BANG_.cljs$core$IFn$_invoke$arity$1(G__70006) : set_initial_choices_BANG_.call(null,G__70006));
})], 0));
var repo = frontend.state.get_current_repo();
var classes = new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486).cljs$core$IFn$_invoke$arity$1(property);
var class_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property));
var non_root_classes = (function (){var G__70007 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (c){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(c),new cljs.core.Keyword("logseq.class","Root","logseq.class/Root",273783827));
}),classes);
if(class_QMARK_){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__70007,(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083))));
} else {
return G__70007;
}
})();
var parent_property_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509));
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = parent_property_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.not((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.class_QMARK_.call(null,block)));
if(and__5000__auto____$1){
return (logseq.db.internal_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.internal_page_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.internal_page_QMARK_.call(null,block));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_tag_pages(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)))))),(function (result__$1){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.built_in_QMARK_,result__$1)),(function (result_SINGLEQUOTE_){
return promesa.protocols._promise(set_result_and_initial_choices_BANG_(result_SINGLEQUOTE_));
}));
}));
}));
} else {
if(parent_property_QMARK_){
return null;
} else {
if(cljs.core.seq(non_root_classes)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (class$){
return frontend.db.async._LT_get_tag_objects(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(class$));
}),non_root_classes))),(function (result__$1){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,result__$1))),(function (result_SINGLEQUOTE_){
return promesa.protocols._promise(set_result_and_initial_choices_BANG_(result_SINGLEQUOTE_));
}));
}));
}));
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_property_values(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property))),(function (result__$1){
return promesa.protocols._promise(set_result_and_initial_choices_BANG_(result__$1));
}));
}));

}
}
}
}),cljs.core.PersistentVector.EMPTY);

return frontend.components.property.value.select_node(property,opts_SINGLEQUOTE_,result);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.property.value/property-value-select-node");
frontend.components.property.value.select = rum.core.lazy_build(rum.core.build_defcs,(function (state,block,property,p__70009,p__70010){
var map__70011 = p__70009;
var map__70011__$1 = cljs.core.__destructure_map(map__70011);
var select_opts = map__70011__$1;
var multiple_choices_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70011__$1,new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490));
var dropdown_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70011__$1,new cljs.core.Keyword(null,"dropdown?","dropdown?",-1027769147));
var content_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70011__$1,new cljs.core.Keyword(null,"content-props","content-props",687449284));
var map__70012 = p__70010;
var map__70012__$1 = cljs.core.__destructure_map(map__70012);
var opts = map__70012__$1;
var _STAR_show_new_property_config_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70012__$1,new cljs.core.Keyword(null,"*show-new-property-config?","*show-new-property-config?",-1054571618));
var exit_edit_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70012__$1,new cljs.core.Keyword(null,"exit-edit?","exit-edit?",1607853059));
var _STAR_values = new cljs.core.Keyword("frontend.components.property.value","values","frontend.components.property.value/values",363263824).cljs$core$IFn$_invoke$arity$1(state);
var refresh_result_f = new cljs.core.Keyword("frontend.components.property.value","refresh-result-f","frontend.components.property.value/refresh-result-f",-1257872111).cljs$core$IFn$_invoke$arity$1(state);
var values = rum.core.react(_STAR_values);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"loading","loading",-737050189),values)){
return null;
} else {
var type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var closed_values_QMARK_ = cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property));
var items = ((closed_values_QMARK_)?(function (){var date_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property.repeat","recur-unit","logseq.property.repeat/recur-unit",690306247))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"date","date",-1463434462),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"property","property",-1114278232).cljs$core$IFn$_invoke$arity$1(opts)))));
var values__$1 = (function (){var G__70013 = new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property);
if(date_QMARK_){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.property.repeat","recur-unit.minute","logseq.property.repeat/recur-unit.minute",-1513655085),null,new cljs.core.Keyword("logseq.property.repeat","recur-unit.hour","logseq.property.repeat/recur-unit.hour",1438884954),null], null), null),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(b));
}),G__70013);
} else {
return G__70013;
}
})();
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (block__$1){
var icon = frontend.handler.property.util.get_block_property_value(block__$1,new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285));
var value = logseq.db.frontend.property.closed_value_content(block__$1);
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"label","label",1718410804),(cljs.core.truth_(icon)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.gap-1.items-center","div.flex.flex-row.gap-1.items-center",1211135204),frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic(icon,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color?","color?",-1891974356),true], null)], 0)),value], null):value),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword(null,"label-value","label-value",-1719020519),value], null);
}),values__$1);
})():cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__70014){
var map__70015 = p__70014;
var map__70015__$1 = cljs.core.__destructure_map(map__70015);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70015__$1,new cljs.core.Keyword(null,"value","value",305978217));
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70015__$1,new cljs.core.Keyword(null,"label","label",1718410804));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),label,new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value)], null);
}),values)));
var items__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"date","date",-1463434462),type))?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (m){
var label = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__70016 = new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(m);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__70016) : frontend.db.entity.call(null,G__70016));
})());
if(cljs.core.truth_(label)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"label","label",1718410804),label);
} else {
return null;
}
}),items):items));
var on_chosen = (function (chosen,selected_QMARK_){
var value = ((cljs.core.map_QMARK_(chosen))?new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(chosen):chosen);
return frontend.components.property.value.add_or_remove_property_value(block,property,value,selected_QMARK_,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"entity-id?","entity-id?",450489382),((cljs.core.integer_QMARK_(value))?true:null),new cljs.core.Keyword(null,"exit-edit?","exit-edit?",1607853059),exit_edit_QMARK_,new cljs.core.Keyword(null,"refresh-result-f","refresh-result-f",-1242092515),refresh_result_f], null));
});
var selected_choices_SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
var selected_choices = ((cljs.core.every_QMARK_((function (p1__70008_SHARP_){
var and__5000__auto__ = cljs.core.map_QMARK_(p1__70008_SHARP_);
if(and__5000__auto__){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__70008_SHARP_);
} else {
return and__5000__auto__;
}
}),selected_choices_SINGLEQUOTE_))?cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),selected_choices_SINGLEQUOTE_):new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [selected_choices_SINGLEQUOTE_], null));
return frontend.components.property.value.select_aux(block,property,cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),new cljs.core.Keyword(null,"dropdown?","dropdown?",-1027769147),new cljs.core.Keyword(null,"show-new-when-not-exact-match?","show-new-when-not-exact-match?",1510536201),new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),new cljs.core.Keyword(null,"input-default-placeholder","input-default-placeholder",-1040139250),new cljs.core.Keyword(null,"extract-chosen-fn","extract-chosen-fn",1058364622),new cljs.core.Keyword(null,"input-opts","input-opts",1688681135),new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490),new cljs.core.Keyword(null,"items","items",1031954938),new cljs.core.Keyword(null,"selected-choices","selected-choices",1913324317)],[content_props,on_chosen,dropdown_QMARK_,(!(((closed_values_QMARK_) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"date","date",-1463434462),type))))),(function (x){
var or__5002__auto__ = new cljs.core.Keyword(null,"label-value","label-value",-1719020519).cljs$core$IFn$_invoke$arity$1(x);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(x);
}
}),["Set ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property))].join(''),new cljs.core.Keyword(null,"value","value",305978217),(function (_){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"on-blur","on-blur",814300747),(function (){
var temp__5804__auto__ = new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900).cljs$core$IFn$_invoke$arity$1(select_opts);
if(cljs.core.truth_(temp__5804__auto__)){
var f = temp__5804__auto__;
return (f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null));
} else {
return null;
}
}),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(cljs.core.truth_(_STAR_show_new_property_config_QMARK_)){
return cljs.core.reset_BANG_(_STAR_show_new_property_config_QMARK_,false);
} else {
return null;
}
}),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
var G__70018 = frontend.util.ekey(e);
switch (G__70018) {
case "Escape":
var temp__5804__auto__ = new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900).cljs$core$IFn$_invoke$arity$1(select_opts);
if(cljs.core.truth_(temp__5804__auto__)){
var f = temp__5804__auto__;
return (f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null));
} else {
return null;
}

break;
default:
return null;

}
})], null);
}),multiple_choices_QMARK_,items__$1,selected_choices]));
}
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var _STAR_values = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"loading","loading",-737050189));
var refresh_result_f = (function (){
var vec__70019 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70019,(0),null);
var property = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70019,(1),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70019,(2),null);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property)))?new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(block):new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property))),(function (property_ident){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_property_values(property_ident)),(function (result){
return promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_values,result));
}));
}));
}));
});
refresh_result_f();

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(state,new cljs.core.Keyword("frontend.components.property.value","values","frontend.components.property.value/values",363263824),_STAR_values,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.components.property.value","refresh-result-f","frontend.components.property.value/refresh-result-f",-1257872111),refresh_result_f], 0));
})], null)], null),"frontend.components.property.value/select");
frontend.components.property.value.property_normal_block_value = rum.core.lazy_build(rum.core.build_defcs,(function (state,block,property,value_block,opts){
var container_id = new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(state);
var multiple_values_QMARK_ = logseq.db.frontend.property.many_QMARK_(property);
var block_container = frontend.state.get_component(new cljs.core.Keyword("block","container","block/container",510671002));
var blocks_container = frontend.state.get_component(new cljs.core.Keyword("block","blocks-container","block/blocks-container",409697112));
var value_block__$1 = ((((cljs.core.coll_QMARK_(value_block)) && (cljs.core.every_QMARK_(frontend.components.property.value.entity_map_QMARK_,value_block))))?cljs.core.set(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__70022_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__70022_SHARP_),new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837));
}),value_block)):value_block);
var default_value = new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662).cljs$core$IFn$_invoke$arity$1(property);
var default_value_QMARK_ = (function (){var and__5000__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(default_value);
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value_block__$1),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(default_value))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662))));
} else {
return and__5000__auto__;
}
})();
var table_text_property_render = new cljs.core.Keyword(null,"table-text-property-render","table-text-property-render",-261105507).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(table_text_property_render)){
return daiquiri.interpreter.interpret((function (){var G__70025 = value_block__$1;
var G__70026 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"create-new-block","create-new-block",1377747253),(function (){
return frontend.components.property.value._LT_create_new_block_BANG_(block,property,"");
}),new cljs.core.Keyword(null,"property-ident","property-ident",697145839),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property)], null);
return (table_text_property_render.cljs$core$IFn$_invoke$arity$2 ? table_text_property_render.cljs$core$IFn$_invoke$arity$2(G__70025,G__70026) : table_text_property_render.call(null,G__70025,G__70026));
})());
} else {
if(cljs.core.seq(value_block__$1)){
return daiquiri.core.create_element("div",{'style':daiquiri.interpreter.element_attributes(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662)))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"min-width","min-width",1926193728),(300)], null):cljs.core.PersistentArrayMap.EMPTY)),'className':"property-block-container content w-full"},[(function (){var config = new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(((multiple_values_QMARK_)?new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block):new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(value_block__$1))),new cljs.core.Keyword(null,"container-id","container-id",1274665684),container_id,new cljs.core.Keyword(null,"editor-box","editor-box",708759870),frontend.state.get_component(new cljs.core.Keyword("editor","box","editor/box",-1921770435)),new cljs.core.Keyword(null,"property-block?","property-block?",71503268),true,new cljs.core.Keyword(null,"on-block-content-pointer-down","on-block-content-pointer-down",1185021460),(cljs.core.truth_(default_value_QMARK_)?(function (_e){
return frontend.components.property.value._LT_create_new_block_BANG_(block,property,(function (){var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(default_value);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})());
}):null),new cljs.core.Keyword(null,"p-block","p-block",1335284937),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword(null,"p-property","p-property",-435865980),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword(null,"view?","view?",655244230),new cljs.core.Keyword(null,"view?","view?",655244230).cljs$core$IFn$_invoke$arity$1(opts)], null);
if(cljs.core.set_QMARK_(value_block__$1)){
return daiquiri.interpreter.interpret((function (){var G__70029 = config;
var G__70030 = logseq.db.sort_by_order(value_block__$1);
return (blocks_container.cljs$core$IFn$_invoke$arity$2 ? blocks_container.cljs$core$IFn$_invoke$arity$2(G__70029,G__70030) : blocks_container.call(null,G__70029,G__70030));
})());
} else {
return rum.core.with_key((function (){var G__70033 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"property-default-value?","property-default-value?",769811896),default_value_QMARK_);
var G__70034 = value_block__$1;
return (block_container.cljs$core$IFn$_invoke$arity$2 ? block_container.cljs$core$IFn$_invoke$arity$2(G__70033,G__70034) : block_container.call(null,G__70033,G__70034));
})(),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property)),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value_block__$1))].join(''));
}
})()]);
} else {
return daiquiri.core.create_element("div",{'tabIndex':(0),'style':{'minHeight':(20)},'onClick':(function (){
return frontend.components.property.value._LT_create_new_block_BANG_(block,property,"");
}),'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["w-full","h-full","jtrigger","ls-empty-text-property",(cljs.core.truth_(new cljs.core.Keyword(null,"table-view?","table-view?",2073887505).cljs$core$IFn$_invoke$arity$1(opts))?"cursor-pointer":"cursor-text")], null))},[]);

}
}
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword(null,"container-id","container-id",1274665684),frontend.state.get_next_container_id());
})], null)], null),"frontend.components.property.value/property-normal-block-value");
frontend.components.property.value.property_block_value = rum.core.lazy_build(rum.core.build_defc,(function (value,block,property,page_cp,opts){
var v_block = value;
var class_QMARK_ = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(v_block) : logseq.db.class_QMARK_.call(null,v_block));
if(cljs.core.truth_(logseq.db.frontend.entity_util.page_QMARK_(v_block))){
return rum.core.with_key((function (){var G__70037 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"disable-preview?","disable-preview?",1485814365),true,new cljs.core.Keyword(null,"tag?","tag?",1714008252),class_QMARK_], null);
var G__70038 = v_block;
return (page_cp.cljs$core$IFn$_invoke$arity$2 ? page_cp.cljs$core$IFn$_invoke$arity$2(G__70037,G__70038) : page_cp.call(null,G__70037,G__70038));
})(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v_block));
} else {
return frontend.components.property.value.property_normal_block_value(block,property,v_block,opts);

}
}),null,"frontend.components.property.value/property-block-value");
frontend.components.property.value.closed_value_item = rum.core.lazy_build(rum.core.build_defc,(function (value,p__70039){
var map__70040 = p__70039;
var map__70040__$1 = cljs.core.__destructure_map(map__70040);
var inline_text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70040__$1,new cljs.core.Keyword(null,"inline-text","inline-text",910915394));
var icon_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70040__$1,new cljs.core.Keyword(null,"icon?","icon?",-1663815703));
if(cljs.core.truth_(value)){
var eid = (cljs.core.truth_(frontend.components.property.value.entity_map_QMARK_(value))?new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),value], null));
var block = (function (){var or__5002__auto__ = (function (){var G__70041 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(eid) : frontend.db.entity.call(null,eid)));
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__70041) : frontend.db.sub_block.call(null,G__70041));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return value;
}
})();
var property_block_QMARK_ = logseq.db.frontend.property.property_created_block_QMARK_(block);
var value_SINGLEQUOTE_ = logseq.db.frontend.property.closed_value_content(block);
var icon = frontend.handler.property.util.get_block_property_value(block,new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285));
if(cljs.core.truth_(icon)){
if(cljs.core.truth_(icon_QMARK_)){
return daiquiri.interpreter.interpret(frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic(icon,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color?","color?",-1891974356),true], null)], 0)));
} else {
var attrs70042 = frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic(icon,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color?","color?",-1891974356),true], null)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs70042))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-1","h-6"], null)], null),attrs70042], 0))):{'className':"flex flex-row items-center gap-1 h-6"}),((cljs.core.map_QMARK_(attrs70042))?[(cljs.core.truth_(value_SINGLEQUOTE_)?(function (){var attrs70043 = value_SINGLEQUOTE_;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs70043))?daiquiri.interpreter.element_attributes(attrs70043):null),((cljs.core.map_QMARK_(attrs70043))?null:[daiquiri.interpreter.interpret(attrs70043)]));
})():null)]:[daiquiri.interpreter.interpret(attrs70042),(cljs.core.truth_(value_SINGLEQUOTE_)?(function (){var attrs70044 = value_SINGLEQUOTE_;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs70044))?daiquiri.interpreter.element_attributes(attrs70044):null),((cljs.core.map_QMARK_(attrs70044))?null:[daiquiri.interpreter.interpret(attrs70044)]));
})():null)]));
}
} else {
if(cljs.core.truth_(property_block_QMARK_)){
return daiquiri.interpreter.interpret(value_SINGLEQUOTE_);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.type,new cljs.core.Keyword(null,"number","number",1570378438))){
return daiquiri.core.create_element("span",{'className':"number"},[cljs.core.str.cljs$core$IFn$_invoke$arity$1(value_SINGLEQUOTE_)]);
} else {
return daiquiri.interpreter.interpret((function (){var G__70048 = cljs.core.PersistentArrayMap.EMPTY;
var G__70049 = new cljs.core.Keyword(null,"markdown","markdown",1227225089);
var G__70050 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(value_SINGLEQUOTE_);
return (inline_text.cljs$core$IFn$_invoke$arity$3 ? inline_text.cljs$core$IFn$_invoke$arity$3(G__70048,G__70049,G__70050) : inline_text.call(null,G__70048,G__70049,G__70050));
})());

}
}
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.property.value/closed-value-item");
frontend.components.property.value.select_item = rum.core.lazy_build(rum.core.build_defc,(function (property,type,value,p__70072){
var map__70073 = p__70072;
var map__70073__$1 = cljs.core.__destructure_map(map__70073);
var opts = map__70073__$1;
var page_cp = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70073__$1,new cljs.core.Keyword(null,"page-cp","page-cp",1066562595));
var inline_text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70073__$1,new cljs.core.Keyword(null,"inline-text","inline-text",910915394));
var other_position_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70073__$1,new cljs.core.Keyword(null,"other-position?","other-position?",-1396628322));
var property_position = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70073__$1,new cljs.core.Keyword(null,"property-position","property-position",-1150084538));
var table_view_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70073__$1,new cljs.core.Keyword(null,"table-view?","table-view?",2073887505));
var _icon_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70073__$1,new cljs.core.Keyword(null,"_icon?","_icon?",341031076));
var closed_values_QMARK_ = cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property));
var tag_QMARK_ = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"tag?","tag?",1714008252).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("block","tags","block/tags",1814948340));
}
})();
var inline_text_cp = (function (content){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center","div.flex.flex-row.items-center",2086153476),(function (){var G__70074 = cljs.core.PersistentArrayMap.EMPTY;
var G__70075 = new cljs.core.Keyword(null,"markdown","markdown",1227225089);
var G__70076 = logseq.common.util.macro.expand_value_if_macro(content,frontend.state.get_macros());
return (inline_text.cljs$core$IFn$_invoke$arity$3 ? inline_text.cljs$core$IFn$_invoke$arity$3(G__70074,G__70075,G__70076) : inline_text.call(null,G__70074,G__70075,G__70076));
})()], null);
});
var attrs70071 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value,new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837)))?frontend.components.property.value.property_empty_btn_value(property):((closed_values_QMARK_)?frontend.components.property.value.closed_value_item(value,opts):(cljs.core.truth_((function (){var or__5002__auto__ = logseq.db.frontend.entity_util.page_QMARK_(value);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.seq(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(value));
}
})())?(cljs.core.truth_(value)?(function (){var opts__$1 = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"disable-preview?","disable-preview?",1485814365),true,new cljs.core.Keyword(null,"tag?","tag?",1714008252),tag_QMARK_,new cljs.core.Keyword(null,"property-position","property-position",-1150084538),property_position,new cljs.core.Keyword(null,"other-position?","other-position?",-1396628322),other_position_QMARK_,new cljs.core.Keyword(null,"table-view?","table-view?",2073887505),table_view_QMARK_,new cljs.core.Keyword(null,"ignore-alias?","ignore-alias?",1336725364),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","alias","block/alias",-2112644699),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property)),new cljs.core.Keyword(null,"on-context-menu","on-context-menu",-1330744340),(function (e){
frontend.util.stop(e);

var G__70077 = e.target;
var G__70078 = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),(function (){var G__70080 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"open",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(value));
})], null);
var G__70081 = ["Open ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(value))].join('');
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__70080,G__70081) : logseq.shui.ui.dropdown_menu_item.call(null,G__70080,G__70081));
})(),(function (){var G__70082 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"open sidebar",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value),new cljs.core.Keyword(null,"page","page",849072397));
})], null);
var G__70083 = "Open in sidebar";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__70082,G__70083) : logseq.shui.ui.dropdown_menu_item.call(null,G__70082,G__70083));
})()], null);
});
var G__70079 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null),new cljs.core.Keyword(null,"align","align",1964212802),"start"], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__70077,G__70078,G__70079) : logseq.shui.ui.popup_show_BANG_.call(null,G__70077,G__70078,G__70079));
})], null);
return rum.core.with_key((page_cp.cljs$core$IFn$_invoke$arity$2 ? page_cp.cljs$core$IFn$_invoke$arity$2(opts__$1,value) : page_cp.call(null,opts__$1,value)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value));
})():null):((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"property","property",-1114278232),null,new cljs.core.Keyword(null,"page","page",849072397),null,new cljs.core.Keyword(null,"node","node",581201198),null,new cljs.core.Keyword(null,"class","class",-2030961996),null], null), null),type))?(function (){var temp__5804__auto__ = frontend.state.get_component(new cljs.core.Keyword("block","reference","block/reference",1588749254));
if(cljs.core.truth_(temp__5804__auto__)){
var reference = temp__5804__auto__;
if(cljs.core.truth_(value)){
var G__70084 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"table-view?","table-view?",2073887505),table_view_QMARK_], null);
var G__70085 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(value);
return (reference.cljs$core$IFn$_invoke$arity$2 ? reference.cljs$core$IFn$_invoke$arity$2(G__70084,G__70085) : reference.call(null,G__70084,G__70085));
} else {
return null;
}
} else {
return null;
}
})():((((cljs.core.map_QMARK_(value)) && ((!((logseq.db.frontend.property.property_value_content(value) == null))))))?(function (){var content = cljs.core.str.cljs$core$IFn$_invoke$arity$1(logseq.db.frontend.property.property_value_content(value));
return inline_text_cp(content);
})():inline_text_cp(cljs.core.str.cljs$core$IFn$_invoke$arity$1(value))
)))));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs70071))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["select-item","cursor-pointer"], null)], null),attrs70071], 0))):{'className':"select-item cursor-pointer"}),((cljs.core.map_QMARK_(attrs70071))?null:[daiquiri.interpreter.interpret(attrs70071)]));
}),null,"frontend.components.property.value/select-item");
frontend.components.property.value.single_value_select = rum.core.lazy_build(rum.core.build_defc,(function (block,property,value,select_opts,p__70086){
var map__70087 = p__70086;
var map__70087__$1 = cljs.core.__destructure_map(map__70087);
var opts = map__70087__$1;
var value_render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70087__$1,new cljs.core.Keyword(null,"value-render","value-render",882962329));
var _STAR_el = rum.core.use_ref(null);
var editing_QMARK_ = new cljs.core.Keyword(null,"editing?","editing?",1646440800).cljs$core$IFn$_invoke$arity$1(opts);
var type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var select_opts_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(select_opts,new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490),false);
var popup_content = (function frontend$components$property$value$content_fn(target){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.property-select","div.property-select",-1891938982),(function (){var G__70088 = type;
var G__70088__$1 = (((G__70088 instanceof cljs.core.Keyword))?G__70088.fqn:null);
switch (G__70088__$1) {
case "entity":
case "number":
case "default":
case "url":
return frontend.components.property.value.select(block,property,select_opts_SINGLEQUOTE_,opts);

break;
case "node":
case "class":
case "property":
case "page":
case "date":
return frontend.components.property.value.property_value_select_node(block,property,select_opts_SINGLEQUOTE_,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"target","target",253001721),target));

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__70088__$1)].join('')));

}
})()], null);
});
var trigger_id = ["trigger-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(opts)),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property))].join('');
var show_popup_BANG_ = (function (target){
var G__70089 = target;
var G__70090 = (function (){
return popup_content(target);
});
var G__70091 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"align","align",1964212802),"start",new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"auto-focus?","auto-focus?",1021654593),true,new cljs.core.Keyword(null,"trigger-id","trigger-id",-599381518),trigger_id], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__70089,G__70090,G__70091) : logseq.shui.ui.popup_show_BANG_.call(null,G__70089,G__70090,G__70091));
});
if(cljs.core.truth_(editing_QMARK_)){
return daiquiri.interpreter.interpret(popup_content(null));
} else {
var show_BANG_ = (function (e){
frontend.util.stop(e);

frontend.state.clear_selection_BANG_();

var target = (cljs.core.truth_(e)?e.target:null);
if(cljs.core.truth_((function (){var or__5002__auto__ = frontend.config.publishing_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = frontend.util.shift_key_QMARK_(e);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = frontend.util.meta_key_QMARK_(e);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = frontend.util.link_QMARK_(target);
if(or__5002__auto____$3){
return or__5002__auto____$3;
} else {
var temp__5804__auto__ = target.closest("a");
if(cljs.core.truth_(temp__5804__auto__)){
var node = temp__5804__auto__;
return (!(((dommy.core.has_class_QMARK_(node,"page-ref")) || (dommy.core.has_class_QMARK_(node,"tag")))));
} else {
return null;
}
}
}
}
}
})())){
return null;
} else {
return show_popup_BANG_(target);
}
});
return daiquiri.interpreter.interpret((function (){var G__70097 = (cljs.core.truth_(new cljs.core.Keyword(null,"other-position?","other-position?",-1396628322).cljs$core$IFn$_invoke$arity$1(opts))?new cljs.core.Keyword(null,"div.jtrigger","div.jtrigger",49308519):new cljs.core.Keyword(null,"div.jtrigger.flex.flex-1.w-full.cursor-pointer","div.jtrigger.flex.flex-1.w-full.cursor-pointer",-1585419265));
var G__70098 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_el,new cljs.core.Keyword(null,"id","id",-1388402092),trigger_id,new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),(0),new cljs.core.Keyword(null,"on-click","on-click",1632826543),show_BANG_,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
var G__70100 = frontend.util.ekey(e);
switch (G__70100) {
case "Backspace":
case "Delete":
return frontend.components.property.value.delete_block_property_BANG_(block,property);

break;
case " ":
case "Enter":
var G__70101_70361 = rum.core.deref(_STAR_el);
if((G__70101_70361 == null)){
} else {
G__70101_70361.click();
}

return frontend.util.stop(e);

break;
default:
return null;

}
})], null);
var G__70099 = ((clojure.string.blank_QMARK_(value))?frontend.components.property.value.property_empty_text_value(property,opts):(value_render.cljs$core$IFn$_invoke$arity$0 ? value_render.cljs$core$IFn$_invoke$arity$0() : value_render.call(null)));
return (logseq.shui.ui.trigger_as.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.trigger_as.cljs$core$IFn$_invoke$arity$3(G__70097,G__70098,G__70099) : logseq.shui.ui.trigger_as.call(null,G__70097,G__70098,G__70099));
})());
}
}),null,"frontend.components.property.value/single-value-select");
frontend.components.property.value.property_value_inner = (function frontend$components$property$value$property_value_inner(block,property,value,p__70102){
var map__70103 = p__70102;
var map__70103__$1 = cljs.core.__destructure_map(map__70103);
var opts = map__70103__$1;
var inline_text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70103__$1,new cljs.core.Keyword(null,"inline-text","inline-text",910915394));
var page_cp = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70103__$1,new cljs.core.Keyword(null,"page-cp","page-cp",1066562595));
var dom_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70103__$1,new cljs.core.Keyword(null,"dom-id","dom-id",-1588236703));
var row_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70103__$1,new cljs.core.Keyword(null,"row?","row?",394970415));
var multiple_values_QMARK_ = logseq.db.frontend.property.many_QMARK_(property);
var class$ = [(cljs.core.truth_(row_QMARK_)?null:"flex flex-1 "),((multiple_values_QMARK_)?"property-value-content":null)].join('');
var type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var text_ref_type_QMARK_ = (logseq.db.frontend.property.type.text_ref_property_types.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.property.type.text_ref_property_types.cljs$core$IFn$_invoke$arity$1(type) : logseq.db.frontend.property.type.text_ref_property_types.call(null,type));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.cursor-text","div.cursor-text",-691769383),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),(function (){var or__5002__auto__ = dom_id;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.random_uuid();
}
})(),new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),(0),new cljs.core.Keyword(null,"class","class",-2030961996),[class$," ",(cljs.core.truth_(text_ref_type_QMARK_)?null:"jtrigger")].join(''),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
if(cljs.core.truth_(text_ref_type_QMARK_)){
return null;
} else {
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["Backspace",null,"Delete",null], null), null),frontend.util.ekey(e))){
return frontend.components.property.value.delete_block_property_BANG_(block,property);
} else {
return null;
}
}
}),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"min-height","min-height",398480837),(24)], null)], null),((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property))) && ((new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(value) == null))))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.jtrigger.cursor-pointer.text-sm.px-2","div.jtrigger.cursor-pointer.text-sm.px-2",402431559),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.components.property.value._LT_create_new_block_BANG_(block,property,"");
})], null),"Set default value"], null):(cljs.core.truth_(text_ref_type_QMARK_)?frontend.components.property.value.property_block_value(value,block,property,page_cp,opts):(function (){var G__70104 = cljs.core.PersistentArrayMap.EMPTY;
var G__70105 = new cljs.core.Keyword(null,"markdown","markdown",1227225089);
var G__70106 = logseq.common.util.macro.expand_value_if_macro(cljs.core.str.cljs$core$IFn$_invoke$arity$1(value),frontend.state.get_macros());
return (inline_text.cljs$core$IFn$_invoke$arity$3 ? inline_text.cljs$core$IFn$_invoke$arity$3(G__70104,G__70105,G__70106) : inline_text.call(null,G__70104,G__70105,G__70106));
})()
))], null);
});
frontend.components.property.value.single_number_input = rum.core.lazy_build(rum.core.build_defc,(function (block,property,value_block,table_view_QMARK_){
var vec__70107 = rum.core.use_state(false);
var editing_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70107,(0),null);
var set_editing_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70107,(1),null);
var _STAR_ref = rum.core.use_ref(null);
var _STAR_input_ref = rum.core.use_ref(null);
var number_value = logseq.db.frontend.property.property_value_content(value_block);
var vec__70110 = rum.core.use_state(number_value);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70110,(0),null);
var set_value_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70110,(1),null);
var set_property_value_BANG_ = (function() { 
var G__70362__delegate = function (value__$1,p__70113){
var map__70114 = p__70113;
var map__70114__$1 = cljs.core.__destructure_map(map__70114);
var exit_editing_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__70114__$1,new cljs.core.Keyword(null,"exit-editing?","exit-editing?",101580309),true);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((((((!(clojure.string.blank_QMARK_(value__$1)))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.trim(cljs.core.str.cljs$core$IFn$_invoke$arity$1(number_value)),clojure.string.trim(cljs.core.str.cljs$core$IFn$_invoke$arity$1(value__$1))))))?frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),value__$1):null)),(function (___40947__auto__){
return promesa.protocols._promise((cljs.core.truth_(exit_editing_QMARK_)?(set_editing_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_editing_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_editing_BANG_.call(null,false)):null));
}));
}));
};
var G__70362 = function (value__$1,var_args){
var p__70113 = null;
if (arguments.length > 1) {
var G__70363__i = 0, G__70363__a = new Array(arguments.length -  1);
while (G__70363__i < G__70363__a.length) {G__70363__a[G__70363__i] = arguments[G__70363__i + 1]; ++G__70363__i;}
  p__70113 = new cljs.core.IndexedSeq(G__70363__a,0,null);
} 
return G__70362__delegate.call(this,value__$1,p__70113);};
G__70362.cljs$lang$maxFixedArity = 1;
G__70362.cljs$lang$applyTo = (function (arglist__70364){
var value__$1 = cljs.core.first(arglist__70364);
var p__70113 = cljs.core.rest(arglist__70364);
return G__70362__delegate(value__$1,p__70113);
});
G__70362.cljs$core$IFn$_invoke$arity$variadic = G__70362__delegate;
return G__70362;
})()
;
return daiquiri.core.create_element("div",{'ref':_STAR_ref,'onClick':(function (){
frontend.state.clear_selection_BANG_();

return (set_editing_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_editing_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_editing_BANG_.call(null,true));
}),'className':"ls-number flex flex-1 jtrigger"},[(cljs.core.truth_(editing_QMARK_)?daiquiri.interpreter.interpret((function (){var G__70118 = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_input_ref,new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),true,new cljs.core.Keyword(null,"class","class",-2030961996),["ls-number-input h-6 px-0 py-0 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base",(cljs.core.truth_(table_view_QMARK_)?" text-sm":null)].join(''),new cljs.core.Keyword(null,"value","value",305978217),value,new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
var G__70119 = frontend.util.evalue(e);
return (set_value_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_value_BANG_.cljs$core$IFn$_invoke$arity$1(G__70119) : set_value_BANG_.call(null,G__70119));
}),new cljs.core.Keyword(null,"on-blur","on-blur",814300747),(function (_e){
return set_property_value_BANG_(value);
}),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
var input = rum.core.deref(_STAR_input_ref);
var pos = frontend.util.cursor.pos(input);
var k = frontend.util.ekey(e);
if(frontend.util.input_text_selected_QMARK_(input)){
return null;
} else {
var G__70120 = k;
switch (G__70120) {
case "ArrowUp":
case "ArrowDown":
frontend.util.stop_propagation(e);

(set_editing_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_editing_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_editing_BANG_.call(null,false));

frontend.handler.editor.move_cross_boundary_up_down(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("ArrowUp",frontend.util.ekey(e)))?new cljs.core.Keyword(null,"up","up",-269712113):new cljs.core.Keyword(null,"down","down",1565245570)),cljs.core.PersistentArrayMap.EMPTY);

return set_property_value_BANG_(value,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"exit-editing?","exit-editing?",101580309),false], null));

break;
case "Backspace":
if((pos === (0))){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.property.remove_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property))),(function (___40947__auto__){
return promesa.protocols._promise(frontend.handler.editor.move_cross_boundary_up_down(new cljs.core.Keyword(null,"up","up",-269712113),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pos","pos",-864607220),new cljs.core.Keyword(null,"max","max",61366548)], null)));
}));
}));
} else {
return null;
}

break;
case "Escape":
case "Enter":
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(set_property_value_BANG_(value)),(function (___40947__auto__){
return promesa.protocols._promise(rum.core.deref(_STAR_ref).focus());
}));
}));

break;
default:
return null;

}
}
})], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__70118) : logseq.shui.ui.input.call(null,G__70118));
})()):daiquiri.interpreter.interpret(value))]);
}),null,"frontend.components.property.value/single-number-input");
frontend.components.property.value.property_scalar_value_aux = rum.core.lazy_build(rum.core.build_defcs,(function (state,block,property,value_STAR_,p__70121){
var map__70122 = p__70121;
var map__70122__$1 = cljs.core.__destructure_map(map__70122);
var opts = map__70122__$1;
var editing_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70122__$1,new cljs.core.Keyword(null,"editing?","editing?",1646440800));
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70122__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
var property__$1 = frontend.db.model.sub_block(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property));
var type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property__$1);
var batch_QMARK_ = frontend.components.property.value.batch_operation_QMARK_();
var closed_values_QMARK_ = cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property__$1));
var select_type_QMARK__SINGLEQUOTE_ = (function (){var or__5002__auto__ = frontend.components.property.value.select_type_QMARK_(block,property__$1);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = editing_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((batch_QMARK_) && (((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default","default",-1987822328),null,new cljs.core.Keyword(null,"url","url",276297046),null], null), null),type)) && (cljs.core.not(closed_values_QMARK_)))));
} else {
return and__5000__auto__;
}
}
})();
var select_opts = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),on_chosen], null);
var value = (cljs.core.truth_((function (){var and__5000__auto__ = frontend.components.property.value.entity_map_QMARK_(value_STAR_);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(value_STAR_),new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837));
} else {
return and__5000__auto__;
}
})())?null:value_STAR_);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property__$1))){
return frontend.components.property.value.icon_row(block,editing_QMARK_);
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"number","number",1570378438))) && (((cljs.core.not(editing_QMARK_)) && (cljs.core.not(closed_values_QMARK_)))))){
return frontend.components.property.value.single_number_input(block,property__$1,value,new cljs.core.Keyword(null,"table-view?","table-view?",2073887505).cljs$core$IFn$_invoke$arity$1(opts));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = select_type_QMARK__SINGLEQUOTE_;
if(cljs.core.truth_(and__5000__auto__)){
return (!(((cljs.core.not(closed_values_QMARK_)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"date","date",-1463434462))))));
} else {
return and__5000__auto__;
}
})())){
var classes = logseq.outliner.property.get_block_classes((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
var display_as_checkbox_QMARK_ = (function (){var and__5000__auto__ = cljs.core.some((function (block__$1){
return cljs.core.contains_QMARK_(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("logseq.property","checkbox-display-properties","logseq.property/checkbox-display-properties",-321532569).cljs$core$IFn$_invoke$arity$1(block__$1))),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property__$1));
}),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(classes,block));
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property__$1))) && (cljs.core.boolean_QMARK_(new cljs.core.Keyword("logseq.property","choice-checkbox-state","logseq.property/choice-checkbox-state",-1272422863).cljs$core$IFn$_invoke$arity$1(value_STAR_))));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(display_as_checkbox_QMARK_)){
var checked_QMARK_ = new cljs.core.Keyword("logseq.property","choice-checkbox-state","logseq.property/choice-checkbox-state",-1272422863).cljs$core$IFn$_invoke$arity$1(value_STAR_);
return daiquiri.interpreter.interpret((function (){var G__70128 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"checked","checked",-50955819),checked_QMARK_,new cljs.core.Keyword(null,"class","class",-2030961996),"mt-1",new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),(function (value__$1){
var choices = new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property__$1);
var choice = cljs.core.some((function (choice){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value__$1,new cljs.core.Keyword("logseq.property","choice-checkbox-state","logseq.property/choice-checkbox-state",-1272422863).cljs$core$IFn$_invoke$arity$1(choice))){
return choice;
} else {
return null;
}
}),choices);
if(cljs.core.truth_(choice)){
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property__$1),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(choice));
} else {
return null;
}
})], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__70128) : logseq.shui.ui.checkbox.call(null,G__70128));
})());
} else {
return frontend.components.property.value.single_value_select(block,property__$1,value,select_opts,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"editing?","editing?",1646440800),editing_QMARK_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"value-render","value-render",882962329),(function (){
return frontend.components.property.value.select_item(property__$1,type,value,opts);
})], 0)));
}
} else {
var G__70129 = type;
var G__70129__$1 = (((G__70129 instanceof cljs.core.Keyword))?G__70129.fqn:null);
switch (G__70129__$1) {
case "date":
case "datetime":
return frontend.components.property.value.property_value_date_picker(block,property__$1,value,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"editing?","editing?",1646440800),editing_QMARK_], null)], 0)));

break;
case "checkbox":
var add_property_BANG_ = (function (){
var value_SINGLEQUOTE_ = cljs.core.boolean$(cljs.core.not(value));
frontend.components.property.value._LT_add_property_BANG_.cljs$core$IFn$_invoke$arity$4(block,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property__$1),value_SINGLEQUOTE_,opts);

var temp__5804__auto__ = new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(temp__5804__auto__)){
var on_checked_change = temp__5804__auto__;
return (on_checked_change.cljs$core$IFn$_invoke$arity$1 ? on_checked_change.cljs$core$IFn$_invoke$arity$1(value_SINGLEQUOTE_) : on_checked_change.call(null,value_SINGLEQUOTE_));
} else {
return null;
}
});
var attrs70125 = (function (){var G__70130 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"class","class",-2030961996),"jtrigger flex flex-row items-center",new cljs.core.Keyword(null,"disabled","disabled",-1529784218),frontend.config.publishing_QMARK_,new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),editing_QMARK_,new cljs.core.Keyword(null,"checked","checked",-50955819),value,new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),add_property_BANG_,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.util.ekey(e),"Enter")){
add_property_BANG_();
} else {
}

if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["Backspace",null,"Delete",null], null), null),frontend.util.ekey(e))){
return frontend.components.property.value.delete_block_property_BANG_(block,property__$1);
} else {
return null;
}
})], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__70130) : logseq.shui.ui.checkbox.call(null,G__70130));
})();
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs70125))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","w-full","as-scalar-value-wrap","cursor-pointer"], null)], null),attrs70125], 0))):{'className':"flex w-full as-scalar-value-wrap cursor-pointer"}),((cljs.core.map_QMARK_(attrs70125))?null:[daiquiri.interpreter.interpret(attrs70125)]));

break;
default:
var attrs70126 = frontend.components.property.value.property_value_inner(block,property__$1,value,opts);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs70126))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-1"], null)], null),attrs70126], 0))):{'className':"flex flex-1"}),((cljs.core.map_QMARK_(attrs70126))?null:[daiquiri.interpreter.interpret(attrs70126)]));

}
}

}
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$,rum.core.reactive], null),"frontend.components.property.value/property-scalar-value-aux");
frontend.components.property.value.property_scalar_value = rum.core.lazy_build(rum.core.build_defc,(function (block,property,value_STAR_,p__70131){
var map__70132 = p__70131;
var map__70132__$1 = cljs.core.__destructure_map(map__70132);
var opts = map__70132__$1;
var container_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70132__$1,new cljs.core.Keyword(null,"container-id","container-id",1274665684));
var editing_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70132__$1,new cljs.core.Keyword(null,"editing?","editing?",1646440800));
var block_editing_QMARK_ = frontend.state.sub_editing_QMARK_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [container_id,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null));
var editing = (function (){var or__5002__auto__ = editing_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = block_editing_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"property","property",-1114278232).cljs$core$IFn$_invoke$arity$1(frontend.state.get_editor_action_data())));
} else {
return and__5000__auto__;
}
}
})();
return frontend.components.property.value.property_scalar_value_aux(block,property,value_STAR_,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"editing?","editing?",1646440800),editing));
}),null,"frontend.components.property.value/property-scalar-value");
frontend.components.property.value.multiple_values_inner = rum.core.lazy_build(rum.core.build_defc,(function (block,property,v,p__70135){
var map__70136 = p__70135;
var map__70136__$1 = cljs.core.__destructure_map(map__70136);
var opts = map__70136__$1;
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70136__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
var editing_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70136__$1,new cljs.core.Keyword(null,"editing?","editing?",1646440800));
var type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var date_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"date","date",-1463434462));
var _STAR_el = rum.core.use_ref(null);
var items = (function (){var G__70137 = (cljs.core.truth_(frontend.components.property.value.entity_map_QMARK_(v))?cljs.core.PersistentHashSet.createAsIfByAssoc([v]):v);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("block","tags","block/tags",1814948340))){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (v__$1){
return cljs.core.contains_QMARK_(logseq.db.hidden_tags,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(v__$1));
}),G__70137);
} else {
return G__70137;
}
})();
var select_cp = (function (select_opts,target){
var select_opts__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490),true,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (){
if(cljs.core.truth_(on_chosen)){
return (on_chosen.cljs$core$IFn$_invoke$arity$0 ? on_chosen.cljs$core$IFn$_invoke$arity$0() : on_chosen.call(null));
} else {
return null;
}
})], null),select_opts,(cljs.core.truth_(editing_QMARK_)?null:new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dropdown?","dropdown?",-1027769147),false], null))], 0));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.property-select","div.property-select",-1891938982),((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"property","property",-1114278232),null,new cljs.core.Keyword(null,"page","page",849072397),null,new cljs.core.Keyword(null,"node","node",581201198),null,new cljs.core.Keyword(null,"class","class",-2030961996),null], null), null),type))?frontend.components.property.value.property_value_select_node(block,property,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(select_opts__$1,new cljs.core.Keyword(null,"target","target",253001721),target),opts):frontend.components.property.value.select(block,property,select_opts__$1,opts))], null);
});
if(cljs.core.truth_(editing_QMARK_)){
return daiquiri.interpreter.interpret(select_cp(cljs.core.PersistentArrayMap.EMPTY,null));
} else {
var toggle_fn = logseq.shui.ui.popup_hide_BANG_;
var content_fn = (function (p__70144,target){
var map__70145 = p__70144;
var map__70145__$1 = cljs.core.__destructure_map(map__70145);
var _id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70145__$1,new cljs.core.Keyword(null,"_id","_id",-789960287));
var content_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70145__$1,new cljs.core.Keyword(null,"content-props","content-props",687449284));
return select_cp(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"content-props","content-props",687449284),content_props], null),target);
});
var show_popup_BANG_ = (function (e){
var target = e.target;
if(cljs.core.truth_((function (){var or__5002__auto__ = frontend.util.link_QMARK_(target);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = target.closest("a");
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return frontend.config.publishing_QMARK_;
}
}
})())){
return null;
} else {
var G__70146 = rum.core.deref(_STAR_el);
var G__70147 = (function (opts__$1){
return content_fn(opts__$1,target);
});
var G__70148 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"as-content?","as-content?",-609445867),false,new cljs.core.Keyword(null,"align","align",1964212802),"start",new cljs.core.Keyword(null,"auto-focus?","auto-focus?",1021654593),true], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__70146,G__70147,G__70148) : logseq.shui.ui.popup_show_BANG_.call(null,G__70146,G__70147,G__70148));
}
});
return daiquiri.core.create_element("div",{'tabIndex':"0",'ref':_STAR_el,'onClick':show_popup_BANG_,'onKeyDown':(function (e){
var G__70149 = e.key;
switch (G__70149) {
case " ":
case "Enter":
var G__70150_70368 = rum.core.deref(_STAR_el);
if((G__70150_70368 == null)){
} else {
G__70150_70368.click();
}

return frontend.util.stop(e);

break;
case "Backspace":
case "Delete":
return frontend.components.property.value.delete_block_property_BANG_(block,property);

break;
default:
return new cljs.core.Keyword(null,"dune","dune",1737226819);

}
}),'className':"multi-values jtrigger flex flex-1 flex-row items-center flex-wrap gap-1"},[(function (){var not_empty_value_QMARK_ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),items),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837)], null));
if(((cljs.core.seq(items)) && (not_empty_value_QMARK_))){
return daiquiri.interpreter.interpret(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-50.-ml-1","span.opacity-50.-ml-1",1632216631),","], null),(function (){var iter__5480__auto__ = (function frontend$components$property$value$iter__70157(s__70158){
return (new cljs.core.LazySeq(null,(function (){
var s__70158__$1 = s__70158;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__70158__$1);
if(temp__5804__auto__){
var s__70158__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__70158__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__70158__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__70160 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__70159 = (0);
while(true){
if((i__70159 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__70159);
cljs.core.chunk_append(b__70160,rum.core.with_key(frontend.components.property.value.select_item(property,type,item,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"show-popup!","show-popup!",791580912),show_popup_BANG_)),(function (){var or__5002__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(item);
}
})()));

var G__70369 = (i__70159 + (1));
i__70159 = G__70369;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__70160),frontend$components$property$value$iter__70157(cljs.core.chunk_rest(s__70158__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__70160),null);
}
} else {
var item = cljs.core.first(s__70158__$2);
return cljs.core.cons(rum.core.with_key(frontend.components.property.value.select_item(property,type,item,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"show-popup!","show-popup!",791580912),show_popup_BANG_)),(function (){var or__5002__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(item);
}
})()),frontend$components$property$value$iter__70157(cljs.core.rest(s__70158__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(items);
})()),((date_QMARK_)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.components.property.value.property_value_date_picker(block,property,null,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425),toggle_fn], null))], null):null)));
} else {
if(date_QMARK_){
return frontend.components.property.value.property_value_date_picker(block,property,null,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425),toggle_fn], null));
} else {
return frontend.components.property.value.property_empty_text_value(property,opts);
}
}
})()]);
}
}),null,"frontend.components.property.value/multiple-values-inner");
frontend.components.property.value.multiple_values = rum.core.lazy_build(rum.core.build_defc,(function (block,property,opts){
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
var value_SINGLEQUOTE_ = ((cljs.core.coll_QMARK_(value))?value:(((!((value == null))))?cljs.core.PersistentHashSet.createAsIfByAssoc([value]):null));
return frontend.components.property.value.multiple_values_inner(block,property,value_SINGLEQUOTE_,opts);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.property.value/multiple-values");
frontend.components.property.value.property_value = rum.core.lazy_build(rum.core.build_defcs,(function (state,block,property,p__70170){
var map__70171 = p__70170;
var map__70171__$1 = cljs.core.__destructure_map(map__70171);
var opts = map__70171__$1;
var show_tooltip_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70171__$1,new cljs.core.Keyword(null,"show-tooltip?","show-tooltip?",-1214081087));
var p_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70171__$1,new cljs.core.Keyword(null,"p-block","p-block",1335284937));
var p_property = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70171__$1,new cljs.core.Keyword(null,"p-property","p-property",-435865980));
var editing_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70171__$1,new cljs.core.Keyword(null,"editing?","editing?",1646440800));
return frontend.ui.catch_error(frontend.ui.block_error("Something wrong",cljs.core.PersistentArrayMap.EMPTY),(function (){var block_cp = frontend.state.get_component(new cljs.core.Keyword("block","blocks-container","block/blocks-container",409697112));
var opts__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"page-cp","page-cp",1066562595),frontend.state.get_component(new cljs.core.Keyword("block","page-cp","block/page-cp",975876274)),new cljs.core.Keyword(null,"inline-text","inline-text",910915394),frontend.state.get_component(new cljs.core.Keyword("block","inline-text","block/inline-text",607091413)),new cljs.core.Keyword(null,"editor-box","editor-box",708759870),frontend.state.get_component(new cljs.core.Keyword("editor","box","editor/box",-1921770435)),new cljs.core.Keyword(null,"block-cp","block-cp",568894835),block_cp,new cljs.core.Keyword(null,"properties-cp","properties-cp",-1837867914),new cljs.core.Keyword(null,"properties-cp","properties-cp",-1837867914)], null)], 0));
var dom_id = ["ls-property-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property))].join('');
var editor_id = [dom_id,"-editor"].join('');
var type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var multiple_values_QMARK_ = logseq.db.frontend.property.many_QMARK_(property);
var v = (function (){var v = cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
var or__5002__auto__ = ((((multiple_values_QMARK_) && (((cljs.core.set_QMARK_(v)) || (((cljs.core.coll_QMARK_(v)) || ((v == null))))))))?v:((multiple_values_QMARK_)?cljs.core.PersistentHashSet.createAsIfByAssoc([v]):((cljs.core.set_QMARK_(v))?cljs.core.first(v):v
)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662).cljs$core$IFn$_invoke$arity$1(property);
}
})();
var self_value_or_embedded_QMARK_ = (function (v__$1){
var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v__$1),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var and__5000__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(v__$1)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
} else {
return and__5000__auto__;
}
}
});
if(cljs.core.truth_((function (){var and__5000__auto__ = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = frontend.components.property.value.entity_map_QMARK_(v);
if(cljs.core.truth_(and__5000__auto__)){
return self_value_or_embedded_QMARK_(v);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var and__5000__auto__ = cljs.core.coll_QMARK_(v);
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.every_QMARK_(frontend.components.property.value.entity_map_QMARK_,v);
if(and__5000__auto____$1){
return cljs.core.some(self_value_or_embedded_QMARK_,v);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var and__5000__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p_block,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p_property,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property))));
} else {
return and__5000__auto__;
}
}
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1((function (){var G__70199 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__70199) : frontend.db.entity.call(null,G__70199));
})()));
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1","div.flex.flex-row.items-center.gap-1",-1023433319),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.warning","div.warning",-131852872),"Self reference"], null),(function (){var G__70200 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"h-5",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.db_based.property.remove_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
})], null);
var G__70201 = "Fix it!";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__70200,G__70201) : logseq.shui.ui.button.call(null,G__70200,G__70201));
})()], null);
} else {
var empty_value_QMARK_ = ((cljs.core.coll_QMARK_(v))?cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(cljs.core.first(v))):null);
var closed_values_QMARK_ = cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property));
var property_ident = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property);
var value_cp = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.property-value-inner","div.property-value-inner",-696636967),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-type","data-type",-326421468),type,new cljs.core.Keyword(null,"class","class",-2030961996),[(cljs.core.truth_(empty_value_QMARK_)?"empty-value":null),(cljs.core.truth_(new cljs.core.Keyword(null,"other-position?","other-position?",-1396628322).cljs$core$IFn$_invoke$arity$1(opts__$1))?null:" w-full")].join('')], null),((((multiple_values_QMARK_) && (((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default","default",-1987822328),null,new cljs.core.Keyword(null,"url","url",276297046),null], null), null),type)) && (((cljs.core.not(closed_values_QMARK_)) && (cljs.core.not(editing_QMARK_))))))))?frontend.components.property.value.property_normal_block_value(block,property,v,opts__$1):((multiple_values_QMARK_)?frontend.components.property.value.multiple_values(block,property,opts__$1):(function (){var parent_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_ident,new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509));
var value_cp = frontend.components.property.value.property_scalar_value(block,property,v,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts__$1,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"editor-id","editor-id",1107175985),editor_id,new cljs.core.Keyword(null,"dom-id","dom-id",-1588236703),dom_id], null)], 0)));
var page_ancestors = ((parent_QMARK_)?(function (){var ancestor_pages = (function (){var parents = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block], null);
while(true){
var temp__5802__auto__ = new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509).cljs$core$IFn$_invoke$arity$1(cljs.core.last(parents));
if(cljs.core.truth_(temp__5802__auto__)){
var parent = temp__5802__auto__;
if(cljs.core.contains_QMARK_(cljs.core.set(parents),parent)){
return null;
} else {
var G__70370 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(parents,parent);
parents = G__70370;
continue;
}
} else {
return parents;
}
break;
}
})();
return cljs.core.butlast(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (e){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e));
}),cljs.core.reverse(ancestor_pages)));
})():null);
if(cljs.core.seq(page_ancestors)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-1.items-center.gap-1","div.flex.flex-1.items-center.gap-1",-1198043612),cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-50.text-sm","span.opacity-50.text-sm",1914462525)," > "], null),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__70202){
var map__70203 = p__70202;
var map__70203__$1 = cljs.core.__destructure_map(map__70203);
var ancestor = map__70203__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70203__$1,new cljs.core.Keyword("block","title","block/title",710445684));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.whitespace-nowrap","a.whitespace-nowrap",1924606794),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(ancestor));
})], null),title], null);
}),page_ancestors),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [value_cp], null)))], null);
} else {
return value_cp;
}
})()
))], null);
if(cljs.core.truth_(show_tooltip_QMARK_)){
var G__70204 = (function (){var G__70205 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"delayDuration","delayDuration",597947120),(1200)], null);
var G__70206 = (function (){var G__70208 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"onFocusCapture","onFocusCapture",-1273942772),(function (p1__70169_SHARP_){
return frontend.util.stop_propagation(p1__70169_SHARP_);
}),new cljs.core.Keyword(null,"as-child","as-child",1364710342),true], null);
var G__70209 = value_cp;
return (logseq.shui.ui.tooltip_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tooltip_trigger.cljs$core$IFn$_invoke$arity$2(G__70208,G__70209) : logseq.shui.ui.tooltip_trigger.call(null,G__70208,G__70209));
})();
var G__70207 = (function (){var G__70210 = ["Change ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property))].join('');
return (logseq.shui.ui.tooltip_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.tooltip_content.cljs$core$IFn$_invoke$arity$1(G__70210) : logseq.shui.ui.tooltip_content.call(null,G__70210));
})();
return (logseq.shui.ui.tooltip.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.tooltip.cljs$core$IFn$_invoke$arity$3(G__70205,G__70206,G__70207) : logseq.shui.ui.tooltip.call(null,G__70205,G__70206,G__70207));
})();
return (logseq.shui.ui.tooltip_provider.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.tooltip_provider.cljs$core$IFn$_invoke$arity$1(G__70204) : logseq.shui.ui.tooltip_provider.call(null,G__70204));
} else {
return value_cp;
}
}
})());
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.property.value/property-value");

//# sourceMappingURL=frontend.components.property.value.js.map
