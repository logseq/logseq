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
var G__113165__delegate = function (property,opts){
var text = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","description","logseq.property/description",-336236200)))?"Add description":"Empty"
);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(text,"Empty")){
return daiquiri.interpreter.interpret((function (){var G__111153 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"empty-btn",new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697)], null),opts], 0));
var G__111154 = text;
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__111153,G__111154) : logseq.shui.ui.button.call(null,G__111153,G__111154));
})());
} else {
return daiquiri.interpreter.interpret((function (){var G__111158 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"empty-btn !text-base",new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697)], null),opts], 0));
var G__111159 = text;
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__111158,G__111159) : logseq.shui.ui.button.call(null,G__111158,G__111159));
})());
}
};
var G__113165 = function (property,var_args){
var opts = null;
if (arguments.length > 1) {
var G__113168__i = 0, G__113168__a = new Array(arguments.length -  1);
while (G__113168__i < G__113168__a.length) {G__113168__a[G__113168__i] = arguments[G__113168__i + 1]; ++G__113168__i;}
  opts = new cljs.core.IndexedSeq(G__113168__a,0,null);
} 
return G__113165__delegate.call(this,property,opts);};
G__113165.cljs$lang$maxFixedArity = 1;
G__113165.cljs$lang$applyTo = (function (arglist__113171){
var property = cljs.core.first(arglist__113171);
var opts = cljs.core.rest(arglist__113171);
return G__113165__delegate(property,opts);
});
G__113165.cljs$core$IFn$_invoke$arity$variadic = G__113165__delegate;
return G__113165;
})()
,null,"frontend.components.property.value/property-empty-btn-value");
frontend.components.property.value.property_empty_text_value = rum.core.lazy_build(rum.core.build_defc,(function (property,p__111166){
var map__111167 = p__111166;
var map__111167__$1 = cljs.core.__destructure_map(map__111167);
var property_position = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111167__$1,new cljs.core.Keyword(null,"property-position","property-position",-1150084538));
var table_view_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111167__$1,new cljs.core.Keyword(null,"table-view?","table-view?",2073887505));
var attrs111164 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"empty-text-btn",new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697)], null)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs111164))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["inline-flex","items-center","cursor-pointer","w-full"], null)], null),attrs111164], 0))):{'className':"inline-flex items-center cursor-pointer w-full"}),((cljs.core.map_QMARK_(attrs111164))?[(cljs.core.truth_(table_view_QMARK_)?null:(cljs.core.truth_(property_position)?daiquiri.interpreter.interpret((function (){var temp__5802__auto__ = new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285).cljs$core$IFn$_invoke$arity$1(property);
if(cljs.core.truth_(temp__5802__auto__)){
var icon = temp__5802__auto__;
return frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic(icon,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color?","color?",-1891974356),true], null)], 0));
} else {
return frontend.ui.icon("line-dashed");
}
})()):"Empty"))]:[daiquiri.interpreter.interpret(attrs111164),(cljs.core.truth_(table_view_QMARK_)?null:(cljs.core.truth_(property_position)?daiquiri.interpreter.interpret((function (){var temp__5802__auto__ = new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285).cljs$core$IFn$_invoke$arity$1(property);
if(cljs.core.truth_(temp__5802__auto__)){
var icon = temp__5802__auto__;
return frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic(icon,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color?","color?",-1891974356),true], null)], 0));
} else {
return frontend.ui.icon("line-dashed");
}
})()):"Empty"))]));
}),null,"frontend.components.property.value/property-empty-text-value");
frontend.components.property.value.get_selected_blocks = (function frontend$components$property$value$get_selected_blocks(){
var G__111186 = frontend.state.get_selection_block_ids();
var G__111186__$1 = (((G__111186 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
var G__111187 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__111187) : frontend.db.entity.call(null,G__111187));
}),G__111186));
var G__111186__$2 = (((G__111186__$1 == null))?null:cljs.core.seq(G__111186__$1));
var G__111186__$3 = (((G__111186__$2 == null))?null:frontend.handler.block.get_top_level_blocks(G__111186__$2));
if((G__111186__$3 == null)){
return null;
} else {
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.property_QMARK_,G__111186__$3);
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
var repo_113198 = frontend.state.get_current_repo();
var blocks_113199 = frontend.components.property.value.get_operating_blocks(block);
frontend.handler.property.batch_set_block_property_BANG_(repo_113198,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),blocks_113199),new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285),(cljs.core.truth_(icon)?cljs.core.select_keys(icon,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"color","color",1011675173)], null)):null));

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

var container = (function (){var or__5002__auto__ = (function (){var G__111212 = document.activeElement;
if((G__111212 == null)){
return null;
} else {
return G__111212.closest(".page");
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return goog.dom.getElement("main-content-container");
}
})();
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285));
var G__111215 = (function (){
var temp__5804__auto__ = (function (){var G__111216 = container.querySelector(["#ls-block-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block))].join(''));
if((G__111216 == null)){
return null;
} else {
return G__111216.querySelector(".block-main-container");
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var target = temp__5804__auto__;
frontend.state.set_editor_action_BANG_(new cljs.core.Keyword(null,"property-icon-picker","property-icon-picker",-1440308098));

var G__111220 = target;
var G__111221 = (function (){
return frontend.components.icon.icon_search(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),on_chosen_BANG_,new cljs.core.Keyword(null,"icon-value","icon-value",-510636889),icon,new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362),(!((icon == null)))], null));
});
var G__111222 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"ls-icon-picker","ls-icon-picker",1363108390),new cljs.core.Keyword(null,"on-after-hide","on-after-hide",-1040754229),(function (){
return frontend.state.set_editor_action_BANG_(null);
}),new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"onEscapeKeyDown","onEscapeKeyDown",1908839912),(function (){
if(cljs.core.truth_(editing_QMARK_)){
return frontend.handler.editor.restore_last_saved_cursor_BANG_.cljs$core$IFn$_invoke$arity$0();
} else {
return null;
}
})], null),new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__111220,G__111221,G__111222) : logseq.shui.ui.popup_show_BANG_.call(null,G__111220,G__111221,G__111222));
} else {
return null;
}
});
return (frontend.util.schedule.cljs$core$IFn$_invoke$arity$1 ? frontend.util.schedule.cljs$core$IFn$_invoke$arity$1(G__111215) : frontend.util.schedule.call(null,G__111215));
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
var len__5726__auto___113308 = arguments.length;
var i__5727__auto___113309 = (0);
while(true){
if((i__5727__auto___113309 < len__5726__auto___113308)){
args__5732__auto__.push((arguments[i__5727__auto___113309]));

var G__113316 = (i__5727__auto___113309 + (1));
i__5727__auto___113309 = G__113316;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return frontend.components.property.value._LT_create_new_block_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(frontend.components.property.value._LT_create_new_block_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (block,property,value,p__111253){
var map__111255 = p__111253;
var map__111255__$1 = cljs.core.__destructure_map(map__111255);
var edit_block_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__111255__$1,new cljs.core.Keyword(null,"edit-block?","edit-block?",-310383789),true);
var batch_op_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111255__$1,new cljs.core.Keyword(null,"batch-op?","batch-op?",-2122405648));
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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
return promesa.protocols._promise((function (){var G__111266 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new_block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__111266) : frontend.db.entity.call(null,G__111266));
})());
}));
}));
}));
}));
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.db.new_block_id.cljs$core$IFn$_invoke$arity$0 ? frontend.db.new_block_id.cljs$core$IFn$_invoke$arity$0() : frontend.db.new_block_id.call(null))),(function (new_block_id){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.property.create_property_text_block_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property),value,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"new-block-id","new-block-id",2138942695),new_block_id], null))),(function (_){
return promesa.protocols._promise((function (){var G__111270 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new_block_id], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__111270) : frontend.db.entity.call(null,G__111270));
})());
}));
}));
}));
}
});
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(batch_op_QMARK_)?promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2(_LT_create_block,frontend.components.property.value.get_operating_blocks(block))):promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(_LT_create_block(block)),(function (new_block){
return promesa.protocols._promise(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new_block], null));
}));
})))),(function (blocks){
return promesa.protocols._promise((function (){var first_block = cljs.core.first(blocks);
if(cljs.core.truth_(edit_block_QMARK_)){
var G__111287_113336 = first_block;
var G__111288_113337 = new cljs.core.Keyword(null,"max","max",61366548);
var G__111289_113338 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"container-id","container-id",1274665684),new cljs.core.Keyword(null,"unknown-container","unknown-container",1739831473)], null);
(frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3 ? frontend.handler.editor.edit_block_BANG_.cljs$core$IFn$_invoke$arity$3(G__111287_113336,G__111288_113337,G__111289_113338) : frontend.handler.editor.edit_block_BANG_.call(null,G__111287_113336,G__111288_113337,G__111289_113338));
} else {
}

return first_block;
})());
}));
}));
}));

(frontend.components.property.value._LT_create_new_block_BANG_.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(frontend.components.property.value._LT_create_new_block_BANG_.cljs$lang$applyTo = (function (seq111246){
var G__111247 = cljs.core.first(seq111246);
var seq111246__$1 = cljs.core.next(seq111246);
var G__111248 = cljs.core.first(seq111246__$1);
var seq111246__$2 = cljs.core.next(seq111246__$1);
var G__111249 = cljs.core.first(seq111246__$2);
var seq111246__$3 = cljs.core.next(seq111246__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__111247,G__111248,G__111249,seq111246__$3);
}));

frontend.components.property.value._LT_set_class_as_property_BANG_ = (function frontend$components$property$value$_LT_set_class_as_property_BANG_(repo,property){
return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(repo,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),new cljs.core.Keyword("db.cardinality","one","db.cardinality/one",1428352190),new cljs.core.Keyword("db","valueType","db/valueType",1827971944),new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079),new cljs.core.Keyword("db","index","db/index",-1531680669),true,new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),new cljs.core.Keyword(null,"node","node",581201198),new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
});
/**
 * If a class and in a class schema context, add the property to its schema.
 *   Otherwise, add a block's property and its value
 */
frontend.components.property.value._LT_add_property_BANG_ = (function frontend$components$property$value$_LT_add_property_BANG_(var_args){
var G__111307 = arguments.length;
switch (G__111307) {
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

(frontend.components.property.value._LT_add_property_BANG_.cljs$core$IFn$_invoke$arity$4 = (function (block,property_id,property_value,p__111312){
var map__111313 = p__111312;
var map__111313__$1 = cljs.core.__destructure_map(map__111313);
var selected_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111313__$1,new cljs.core.Keyword(null,"selected?","selected?",-742502788));
var exit_edit_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__111313__$1,new cljs.core.Keyword(null,"exit-edit?","exit-edit?",1607853059),true);
var class_schema_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111313__$1,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900));
var entity_id_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111313__$1,new cljs.core.Keyword(null,"entity-id?","entity-id?",450489382));
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

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = class_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return class_schema_QMARK_;
} else {
return and__5000__auto__;
}
})())?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(property) : logseq.db.class_QMARK_.call(null,property)))?frontend.components.property.value._LT_set_class_as_property_BANG_(repo,property):null)),(function (___41611__auto__){
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
var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
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
var _STAR_outliner_ops_STAR__orig_val__111413 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__111415 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__111415);

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

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"set-block-property","set-block-property",-301154301)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"set-block-property","set-block-property",-301154301)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__111413);
}}
})())),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.seq(new cljs.core.Keyword("view","selected-blocks","view/selected-blocks",-92053027).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))))?frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Property updated!",new cljs.core.Keyword(null,"success","success",1890645906)):null)),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(((many_QMARK_)?null:(cljs.core.truth_(exit_edit_QMARK_)?(function (){
frontend.ui.hide_popups_until_preview_popup_BANG_();

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
})()
:(cljs.core.truth_(selected_QMARK_)?(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null)):null)))),(function (___41611__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise(((((many_QMARK_) || (checkbox_QMARK_)))?null:(function (){var temp__5804__auto__ = frontend.state.get_input();
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
return input.focus();
} else {
return null;
}
})())),(function (___41611__auto____$3){
return promesa.protocols._promise(((checkbox_QMARK_)?frontend.state.set_editor_action_data_BANG_(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"focus-property-value","focus-property-value",1385743147),new cljs.core.Keyword(null,"property","property",-1114278232),property], null)):null));
}));
}));
}));
}));
}));
}));

(frontend.components.property.value._LT_add_property_BANG_.cljs$lang$maxFixedArity = 4);

frontend.components.property.value.add_or_remove_property_value = (function frontend$components$property$value$add_or_remove_property_value(block,property,value,selected_QMARK_,p__111431){
var map__111432 = p__111431;
var map__111432__$1 = cljs.core.__destructure_map(map__111432);
var opts = map__111432__$1;
var refresh_result_f = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111432__$1,new cljs.core.Keyword(null,"refresh-result-f","refresh-result-f",-1242092515));
var entity_id_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111432__$1,new cljs.core.Keyword(null,"entity-id?","entity-id?",450489382));
var many_QMARK_ = logseq.db.frontend.property.many_QMARK_(property);
var blocks = frontend.components.property.value.get_operating_blocks(block);
var repo = frontend.state.get_current_repo();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children?","children?",-1199594108),false], null)], 0))),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = selected_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079),new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(property))) && (((typeof value === 'number') && (cljs.core.not((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(value) : frontend.db.entity.call(null,value)))))));
} else {
return and__5000__auto__;
}
})())?frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(repo,value,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children?","children?",-1199594108),false], null)], 0)):null)),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(selected_QMARK_)?frontend.components.property.value._LT_add_property_BANG_.cljs$core$IFn$_invoke$arity$4(block,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),value,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"selected?","selected?",-742502788),selected_QMARK_,new cljs.core.Keyword(null,"entity-id?","entity-id?",450489382),entity_id_QMARK_,new cljs.core.Keyword(null,"exit-edit?","exit-edit?",1607853059),(((!((new cljs.core.Keyword(null,"exit-edit?","exit-edit?",1607853059).cljs$core$IFn$_invoke$arity$1(opts) == null))))?new cljs.core.Keyword(null,"exit-edit?","exit-edit?",1607853059).cljs$core$IFn$_invoke$arity$1(opts):(!(many_QMARK_)))], null)):promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var test_QMARK___49426__auto__ = frontend.util.node_test_QMARK_;
var ops__49427__auto__ = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var editor_info__49428__auto__ = frontend.state.get_editor_info();
cljs.core.reset_BANG_(frontend.state._STAR_editor_info,editor_info__49428__auto__);

if(cljs.core.truth_(ops__49427__auto__)){
var seq__111443 = cljs.core.seq(blocks);
var chunk__111444 = null;
var count__111445 = (0);
var i__111446 = (0);
while(true){
if((i__111446 < count__111445)){
var block__$1 = chunk__111444.cljs$core$IIndexed$_nth$arity$2(null,i__111446);
frontend.handler.db_based.property.delete_property_value_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),value);


var G__113380 = seq__111443;
var G__113381 = chunk__111444;
var G__113382 = count__111445;
var G__113383 = (i__111446 + (1));
seq__111443 = G__113380;
chunk__111444 = G__113381;
count__111445 = G__113382;
i__111446 = G__113383;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__111443);
if(temp__5804__auto__){
var seq__111443__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__111443__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__111443__$1);
var G__113384 = cljs.core.chunk_rest(seq__111443__$1);
var G__113385 = c__5525__auto__;
var G__113386 = cljs.core.count(c__5525__auto__);
var G__113387 = (0);
seq__111443 = G__113384;
chunk__111444 = G__113385;
count__111445 = G__113386;
i__111446 = G__113387;
continue;
} else {
var block__$1 = cljs.core.first(seq__111443__$1);
frontend.handler.db_based.property.delete_property_value_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),value);


var G__113388 = cljs.core.next(seq__111443__$1);
var G__113389 = null;
var G__113390 = (0);
var G__113391 = (0);
seq__111443 = G__113388;
chunk__111444 = G__113389;
count__111445 = G__113390;
i__111446 = G__113391;
continue;
}
} else {
return null;
}
}
break;
}
} else {
var _STAR_outliner_ops_STAR__orig_val__111455 = frontend.modules.outliner.op._STAR_outliner_ops_STAR_;
var _STAR_outliner_ops_STAR__temp_val__111456 = cljs.core.transient$(cljs.core.PersistentVector.EMPTY);
(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__temp_val__111456);

try{var seq__111457_113392 = cljs.core.seq(blocks);
var chunk__111458_113393 = null;
var count__111459_113394 = (0);
var i__111460_113395 = (0);
while(true){
if((i__111460_113395 < count__111459_113394)){
var block_113396__$1 = chunk__111458_113393.cljs$core$IIndexed$_nth$arity$2(null,i__111460_113395);
frontend.handler.db_based.property.delete_property_value_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_113396__$1),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),value);


var G__113397 = seq__111457_113392;
var G__113398 = chunk__111458_113393;
var G__113399 = count__111459_113394;
var G__113400 = (i__111460_113395 + (1));
seq__111457_113392 = G__113397;
chunk__111458_113393 = G__113398;
count__111459_113394 = G__113399;
i__111460_113395 = G__113400;
continue;
} else {
var temp__5804__auto___113401 = cljs.core.seq(seq__111457_113392);
if(temp__5804__auto___113401){
var seq__111457_113402__$1 = temp__5804__auto___113401;
if(cljs.core.chunked_seq_QMARK_(seq__111457_113402__$1)){
var c__5525__auto___113403 = cljs.core.chunk_first(seq__111457_113402__$1);
var G__113404 = cljs.core.chunk_rest(seq__111457_113402__$1);
var G__113405 = c__5525__auto___113403;
var G__113406 = cljs.core.count(c__5525__auto___113403);
var G__113407 = (0);
seq__111457_113392 = G__113404;
chunk__111458_113393 = G__113405;
count__111459_113394 = G__113406;
i__111460_113395 = G__113407;
continue;
} else {
var block_113408__$1 = cljs.core.first(seq__111457_113402__$1);
frontend.handler.db_based.property.delete_property_value_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_113408__$1),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),value);


var G__113409 = cljs.core.next(seq__111457_113402__$1);
var G__113410 = null;
var G__113411 = (0);
var G__113412 = (0);
seq__111457_113392 = G__113409;
chunk__111458_113393 = G__113410;
count__111459_113394 = G__113411;
i__111460_113395 = G__113412;
continue;
}
} else {
}
}
break;
}

var r__49429__auto__ = cljs.core.persistent_BANG_(frontend.modules.outliner.op._STAR_outliner_ops_STAR_);
if(test_QMARK___49426__auto__){
if(cljs.core.seq(r__49429__auto__)){
return logseq.outliner.op.apply_ops_BANG_(frontend.state.get_current_repo(),frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$1(false),r__49429__auto__,frontend.state.get_date_formatter(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
return null;
}
} else {
if(cljs.core.seq(r__49429__auto__)){
var request_id__49430__auto__ = (frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0 ? frontend.state.get_worker_next_request_id.cljs$core$IFn$_invoke$arity$0() : frontend.state.get_worker_next_request_id.call(null));
var request__49431__auto__ = (function (){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","apply-outliner-ops","thread-api/apply-outliner-ops",654139693),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),r__49429__auto__,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null),new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id__49430__auto__,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-id","client-id",-464622140),new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))], 0))], 0));
});
var response__49432__auto__ = (frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.state.add_worker_request_BANG_.cljs$core$IFn$_invoke$arity$2(request_id__49430__auto__,request__49431__auto__) : frontend.state.add_worker_request_BANG_.call(null,request_id__49430__auto__,request__49431__auto__));
return response__49432__auto__;
} else {
return null;
}
}
}finally {(frontend.modules.outliner.op._STAR_outliner_ops_STAR_ = _STAR_outliner_ops_STAR__orig_val__111455);
}}
})()),(function (___41611__auto____$2){
return promesa.protocols._promise((((((!(many_QMARK_))) || (((many_QMARK_) && ((cljs.core.count(cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property))) <= (1)))))))?(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null)):null));
}));
})))),(function (___41611__auto____$2){
return promesa.protocols._promise(((cljs.core.fn_QMARK_(refresh_result_f))?(refresh_result_f.cljs$core$IFn$_invoke$arity$0 ? refresh_result_f.cljs$core$IFn$_invoke$arity$0() : refresh_result_f.call(null)):null));
}));
}));
}));
}));
});
frontend.components.property.value.repeat_setting = rum.core.lazy_build(rum.core.build_defc,(function (block,property){
var opts = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"exit-edit?","exit-edit?",1607853059),false], null);
var block__$1 = (function (){var G__111483 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__111483) : frontend.db.sub_block.call(null,G__111483));
})();
return daiquiri.core.create_element("div",{'className':"p-4 flex flex-col gap-4 w-64"},[daiquiri.core.create_element("div",{'className':"mb-4"},[daiquiri.core.create_element("div",{'className':"flex flex-row items-center gap-1"},[(function (){var attrs111519 = (function (){var G__111521 = block__$1;
var G__111522 = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.repeat","repeated?","logseq.property.repeat/repeated?",1908121789)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property.repeat","repeated?","logseq.property.repeat/repeated?",1908121789)));
var G__111523 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),(function (value){
if(cljs.core.truth_(value)){
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword("logseq.property.repeat","temporal-property","logseq.property.repeat/temporal-property",834610784),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property));
} else {
return frontend.handler.db_based.property.remove_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword("logseq.property.repeat","temporal-property","logseq.property.repeat/temporal-property",834610784));
}
}));
return (frontend.components.property.value.property_value.cljs$core$IFn$_invoke$arity$3 ? frontend.components.property.value.property_value.cljs$core$IFn$_invoke$arity$3(G__111521,G__111522,G__111523) : frontend.components.property.value.property_value.call(null,G__111521,G__111522,G__111523));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs111519))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["w-4"], null)], null),attrs111519], 0))):{'className':"w-4"}),((cljs.core.map_QMARK_(attrs111519))?null:[daiquiri.interpreter.interpret(attrs111519)]));
})(),(cljs.core.truth_((function (){var G__111538 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property);
var fexpr__111537 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.property","deadline","logseq.property/deadline",1685901604),null,new cljs.core.Keyword("logseq.property","scheduled","logseq.property/scheduled",1644520943),null], null), null);
return (fexpr__111537.cljs$core$IFn$_invoke$arity$1 ? fexpr__111537.cljs$core$IFn$_invoke$arity$1(G__111538) : fexpr__111537.call(null,G__111538));
})())?daiquiri.core.create_element("div",null,["Repeat task"]):daiquiri.core.create_element("div",null,["Repeat ",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"date","date",-1463434462),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property)))?"date":"datetime")]))])]),daiquiri.core.create_element("div",{'className':"flex flex-row gap-2"},[daiquiri.core.create_element("div",{'className':"flex text-muted-foreground mr-4"},["Every"]),(function (){var attrs111578 = (function (){var G__111592 = block__$1;
var G__111593 = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.repeat","recur-frequency","logseq.property.repeat/recur-frequency",871615922)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property.repeat","recur-frequency","logseq.property.repeat/recur-frequency",871615922)));
var G__111594 = opts;
return (frontend.components.property.value.property_value.cljs$core$IFn$_invoke$arity$3 ? frontend.components.property.value.property_value.cljs$core$IFn$_invoke$arity$3(G__111592,G__111593,G__111594) : frontend.components.property.value.property_value.call(null,G__111592,G__111593,G__111594));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs111578))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["w-6"], null)], null),attrs111578], 0))):{'className':"w-6"}),((cljs.core.map_QMARK_(attrs111578))?null:[daiquiri.interpreter.interpret(attrs111578)]));
})(),(function (){var attrs111591 = (function (){var G__111596 = block__$1;
var G__111597 = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.repeat","recur-unit","logseq.property.repeat/recur-unit",690306247)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property.repeat","recur-unit","logseq.property.repeat/recur-unit",690306247)));
var G__111598 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"property","property",-1114278232),property);
return (frontend.components.property.value.property_value.cljs$core$IFn$_invoke$arity$3 ? frontend.components.property.value.property_value.cljs$core$IFn$_invoke$arity$3(G__111596,G__111597,G__111598) : frontend.components.property.value.property_value.call(null,G__111596,G__111597,G__111598));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs111591))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["w-20"], null)], null),attrs111591], 0))):{'className':"w-20"}),((cljs.core.map_QMARK_(attrs111591))?null:[daiquiri.interpreter.interpret(attrs111591)]));
})()]),(function (){var properties = (function (){var G__111599 = new cljs.core.Keyword("db","id","db/id",-1388397098);
var G__111600 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853)))], null),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (property__$1){
return ((cljs.core.not((logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(property__$1) : logseq.db.built_in_QMARK_.call(null,property__$1)))) && ((cljs.core.count(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property__$1)) >= (2))));
}),logseq.outliner.property.get_block_full_properties((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1))));
return (frontend.util.distinct_by.cljs$core$IFn$_invoke$arity$2 ? frontend.util.distinct_by.cljs$core$IFn$_invoke$arity$2(G__111599,G__111600) : frontend.util.distinct_by.call(null,G__111599,G__111600));
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
return daiquiri.core.create_element("div",{'className':"flex flex-col gap-2"},[daiquiri.core.create_element("div",{'className':"text-muted-foreground"},["When"]),daiquiri.interpreter.interpret((function (){var G__111673 = (function (){var G__111676 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-value-change","on-value-change",-621835289),(function (v){
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword("logseq.property.repeat","checked-property","logseq.property.repeat/checked-property",1866365553),v);
})], null);
if(cljs.core.truth_(property_id)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__111676,new cljs.core.Keyword(null,"default-value","default-value",232220170),property_id);
} else {
return G__111676;
}
})();
var G__111674 = (function (){var G__111677 = (function (){var G__111678 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Select a property"], null);
return (logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1(G__111678) : logseq.shui.ui.select_value.call(null,G__111678));
})();
return (logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$1(G__111677) : logseq.shui.ui.select_trigger.call(null,G__111677));
})();
var G__111675 = (function (){var G__111679 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (choice){
var G__111680 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(choice)),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(choice)], null);
var G__111681 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(choice);
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__111680,G__111681) : logseq.shui.ui.select_item.call(null,G__111680,G__111681));
}),properties);
return (logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1(G__111679) : logseq.shui.ui.select_content.call(null,G__111679));
})();
return (logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3(G__111673,G__111674,G__111675) : logseq.shui.ui.select.call(null,G__111673,G__111674,G__111675));
})()),daiquiri.core.create_element("div",{'className':"flex flex-row gap-1"},[daiquiri.core.create_element("div",{'className':"text-muted-foreground"},["is:"]),(cljs.core.truth_(done_choice)?daiquiri.interpreter.interpret(logseq.db.frontend.property.property_value_content(done_choice)):null)])]);
})()]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.property.value/repeat-setting");
frontend.components.property.value.calendar_inner = rum.core.lazy_build(rum.core.build_defcs,(function (state,id,p__111686){
var map__111687 = p__111686;
var map__111687__$1 = cljs.core.__destructure_map(map__111687);
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111687__$1,new cljs.core.Keyword(null,"block","block",664686210));
var property = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111687__$1,new cljs.core.Keyword(null,"property","property",-1114278232));
var datetime_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111687__$1,new cljs.core.Keyword(null,"datetime?","datetime?",-1173480100));
var on_change = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111687__$1,new cljs.core.Keyword(null,"on-change","on-change",-732046149));
var del_btn_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111687__$1,new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362));
var on_delete = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__111687__$1,new cljs.core.Keyword(null,"on-delete","on-delete",-1882190355));
var block__$1 = (function (){var G__111690 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__111690) : frontend.db.sub_block.call(null,G__111690));
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_((frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(journal) : frontend.db.get_page.call(null,journal)))?null:(function (){var G__111730 = journal;
var G__111731 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__111730,G__111731) : frontend.handler.page._LT_create_BANG_.call(null,G__111730,G__111731));
})())),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.fn_QMARK_(on_change))?(function (){var value__$2 = (cljs.core.truth_(datetime_QMARK_)?cljs_time.coerce.to_long(d):(frontend.db.get_page.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_page.cljs$core$IFn$_invoke$arity$1(journal) : frontend.db.get_page.call(null,journal)));
return (on_change.cljs$core$IFn$_invoke$arity$1 ? on_change.cljs$core$IFn$_invoke$arity$1(value__$2) : on_change.call(null,value__$2));
})():null)),(function (___41611__auto____$1){
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
return daiquiri.core.create_element("div",{'className':"flex flex-row gap-2"},[daiquiri.core.create_element("div",{'className':"flex flex-col"},[frontend.ui.nlp_calendar((function (){var G__111761 = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"initial-focus","initial-focus",1154999719),true,new cljs.core.Keyword(null,"datetime?","datetime?",-1173480100),datetime_QMARK_,new cljs.core.Keyword(null,"selected","selected",574897764),initial_day,new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.deref(_STAR_ident),new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362),del_btn_QMARK_,new cljs.core.Keyword(null,"on-delete","on-delete",-1882190355),on_delete,new cljs.core.Keyword(null,"on-day-click","on-day-click",1918658076),select_handler_BANG_], null);
if(cljs.core.truth_(initial_month)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__111761,new cljs.core.Keyword(null,"default-month","default-month",-187077446),initial_month);
} else {
return G__111761;
}
})())]),daiquiri.interpreter.interpret((function (){var G__111764 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"orientation","orientation",623557579),"vertical"], null);
return (logseq.shui.ui.separator.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.separator.cljs$core$IFn$_invoke$arity$1(G__111764) : logseq.shui.ui.separator.call(null,G__111764));
})()),frontend.components.property.value.repeat_setting(block__$1,property)]);
}),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,rum.core.local.cljs$core$IFn$_invoke$arity$2(["calendar-inner-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(Date.now())].join(''),new cljs.core.Keyword("frontend.components.property.value","identity","frontend.components.property.value/identity",1619434455)),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
frontend.state.set_editor_action_BANG_(new cljs.core.Keyword(null,"property-set-date","property-set-date",-266599778));

return state;
}),new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
setTimeout((function (){
var G__111791 = cljs.core.deref(new cljs.core.Keyword("frontend.components.property.value","identity","frontend.components.property.value/identity",1619434455).cljs$core$IFn$_invoke$arity$1(state));
var G__111791__$1 = (((G__111791 == null))?null:document.getElementById(G__111791));
var G__111791__$2 = (((G__111791__$1 == null))?null:G__111791__$1.querySelector("[aria-selected=true]"));
if((G__111791__$2 == null)){
return null;
} else {
return G__111791__$2.focus();
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
var vec__111873 = rum.core.use_state(cljs_time.core.now());
var current_time = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__111873,(0),null);
var set_current_time_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__111873,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
var timer = setInterval((function (){
var G__111903 = cljs_time.core.now();
return (set_current_time_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_current_time_BANG_.cljs$core$IFn$_invoke$arity$1(G__111903) : set_current_time_BANG_.call(null,G__111903));
}),(((1000) * (60)) * (3)));
return (function (){
return clearInterval(timer);
});
}),cljs.core.PersistentVector.EMPTY);

var overdue_QMARK_ = (cljs.core.truth_(date)?cljs_time.core.after_QMARK_(current_time,cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(date,cljs_time.core.seconds.cljs$core$IFn$_invoke$arity$1((59)))):null);
var attrs111862 = (function (){var G__111956 = cljs.core.PersistentArrayMap.EMPTY;
if(cljs.core.truth_(overdue_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__111956,new cljs.core.Keyword(null,"class","class",-2030961996),"overdue",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"title","title",636505583),"Overdue"], 0));
} else {
return G__111956;
}
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs111862))?daiquiri.interpreter.element_attributes(attrs111862):null),((cljs.core.map_QMARK_(attrs111862))?[daiquiri.interpreter.interpret(content)]:[daiquiri.interpreter.interpret(attrs111862),daiquiri.interpreter.interpret(content)]));
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
return rum.core.with_key((function (){var G__111990 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"disable-preview?","disable-preview?",1485814365),true,new cljs.core.Keyword(null,"show-non-exists-page?","show-non-exists-page?",-1180311666),true,new cljs.core.Keyword(null,"label","label",1718410804),frontend.components.property.value.human_date_label(date)], null);
var G__111991 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","name","block/name",1619760316),page_title], null);
return (page_cp.cljs$core$IFn$_invoke$arity$2 ? page_cp.cljs$core$IFn$_invoke$arity$2(G__111990,G__111991) : page_cp.call(null,G__111990,G__111991));
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
frontend.components.property.value.date_picker = rum.core.lazy_build(rum.core.build_defc,(function (value,p__112004){
var map__112006 = p__112004;
var map__112006__$1 = cljs.core.__destructure_map(map__112006);
var on_change = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112006__$1,new cljs.core.Keyword(null,"on-change","on-change",-732046149));
var datetime_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112006__$1,new cljs.core.Keyword(null,"datetime?","datetime?",-1173480100));
var other_position_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112006__$1,new cljs.core.Keyword(null,"other-position?","other-position?",-1396628322));
var editing_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112006__$1,new cljs.core.Keyword(null,"editing?","editing?",1646440800));
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112006__$1,new cljs.core.Keyword(null,"block","block",664686210));
var property = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112006__$1,new cljs.core.Keyword(null,"property","property",-1114278232));
var on_delete = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112006__$1,new cljs.core.Keyword(null,"on-delete","on-delete",-1882190355));
var del_btn_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112006__$1,new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362));
var multiple_values_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112006__$1,new cljs.core.Keyword(null,"multiple-values?","multiple-values?",1567692022));
var _STAR_el = rum.core.use_ref(null);
var content_fn = (function (p__112011){
var map__112012 = p__112011;
var map__112012__$1 = cljs.core.__destructure_map(map__112012);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112012__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
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
var G__112016 = e.target;
var G__112017 = content_fn;
var G__112018 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"align","align",1964212802),"start",new cljs.core.Keyword(null,"auto-focus?","auto-focus?",1021654593),true], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__112016,G__112017,G__112018) : logseq.shui.ui.popup_show_BANG_.call(null,G__112016,G__112017,G__112018));
}
}
});
var repeated_task_QMARK_ = new cljs.core.Keyword("logseq.property.repeat","repeated?","logseq.property.repeat/repeated?",1908121789).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(editing_QMARK_)){
return daiquiri.interpreter.interpret(content_fn(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"date-picker","date-picker",882557010)], null)));
} else {
if(cljs.core.truth_(multiple_values_QMARK_)){
return daiquiri.interpreter.interpret((function (){var G__112023 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"class","class",-2030961996),"jtrigger h-6 empty-btn",new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),open_popup_BANG_,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["Backspace",null,"Delete",null], null), null),frontend.util.ekey(e))){
return frontend.components.property.value.delete_block_property_BANG_(block,property);
} else {
return null;
}
})], null);
var G__112024 = frontend.ui.icon("calendar-plus",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(16)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__112023,G__112024) : logseq.shui.ui.button.call(null,G__112023,G__112024));
})());
} else {
return daiquiri.interpreter.interpret((function (){var G__112034 = new cljs.core.Keyword(null,"div.flex.flex-1.flex-row.gap-1.items-center.flex-wrap","div.flex.flex-1.flex-row.gap-1.items-center.flex-wrap",418909079);
var G__112035 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_el,new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),(0),new cljs.core.Keyword(null,"class","class",-2030961996),"jtrigger min-h-[24px]",new cljs.core.Keyword(null,"on-click","on-click",1632826543),open_popup_BANG_,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
var G__112037 = frontend.util.ekey(e);
switch (G__112037) {
case "Backspace":
case "Delete":
return frontend.components.property.value.delete_block_property_BANG_(block,property);

break;
case " ":
case "Enter":
var G__112038_113462 = rum.core.deref(_STAR_el);
if((G__112038_113462 == null)){
} else {
G__112038_113462.click();
}

return frontend.util.stop(e);

break;
default:
return null;

}
})], null);
var G__112036 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.gap-1.items-center","div.flex.flex-row.gap-1.items-center",1211135204),(cljs.core.truth_(repeated_task_QMARK_)?frontend.ui.icon("repeat",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),(14),new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-40"], null)):null),((cljs.core.map_QMARK_(value))?(function (){var date = cljs_time.coerce.to_date_time((function (){var G__112039 = new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366).cljs$core$IFn$_invoke$arity$1(value);
return (frontend.date.journal_day__GT_utc_ms.cljs$core$IFn$_invoke$arity$1 ? frontend.date.journal_day__GT_utc_ms.cljs$core$IFn$_invoke$arity$1(G__112039) : frontend.date.journal_day__GT_utc_ms.call(null,G__112039));
})());
var compare_value = (function (){var G__112040 = date;
var G__112040__$1 = (((G__112040 == null))?null:cljs_time.core.plus.cljs$core$IFn$_invoke$arity$2(G__112040,cljs_time.core.days.cljs$core$IFn$_invoke$arity$1((1))));
if((G__112040__$1 == null)){
return null;
} else {
return cljs_time.core.minus.cljs$core$IFn$_invoke$arity$2(G__112040__$1,cljs_time.core.seconds.cljs$core$IFn$_invoke$arity$1((1)));
}
})();
var content = (function (){var temp__5804__auto__ = frontend.state.get_component(new cljs.core.Keyword("block","page-cp","block/page-cp",975876274));
if(cljs.core.truth_(temp__5804__auto__)){
var page_cp = temp__5804__auto__;
return rum.core.with_key((function (){var G__112041 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"disable-preview?","disable-preview?",1485814365),true,new cljs.core.Keyword(null,"meta-click?","meta-click?",-448948649),other_position_QMARK_,new cljs.core.Keyword(null,"label","label",1718410804),frontend.components.property.value.human_date_label(cljs_time.core.to_default_time_zone(date))], null);
var G__112042 = value;
return (page_cp.cljs$core$IFn$_invoke$arity$2 ? page_cp.cljs$core$IFn$_invoke$arity$2(G__112041,G__112042) : page_cp.call(null,G__112041,G__112042));
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
return (logseq.shui.ui.trigger_as.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.trigger_as.cljs$core$IFn$_invoke$arity$3(G__112034,G__112035,G__112036) : logseq.shui.ui.trigger_as.call(null,G__112034,G__112035,G__112036));
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

var blocks_113497 = frontend.components.property.value.get_operating_blocks(block);
frontend.handler.property.batch_set_block_property_BANG_(repo,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks_113497),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),null);

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null)], 0)));
}),null,"frontend.components.property.value/property-value-date-picker");
frontend.components.property.value._LT_create_page_if_not_exists_BANG_ = (function frontend$components$property$value$_LT_create_page_if_not_exists_BANG_(block,property,classes,page){
var page_STAR_ = clojure.string.trim(page);
var vec__112050 = ((((cljs.core.seq(classes)) && ((!(cljs.core.contains_QMARK_(logseq.db.frontend.property.db_attribute_properties,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property)))))))?(function (){var or__5002__auto__ = cljs.core.seq(cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.trim,cljs.core.rest(cljs.core.re_find(/(.*)#(.*)$/,page_STAR_))));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [page_STAR_,null], null);
}
})():new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [page_STAR_,null], null));
var page__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112050,(0),null);
var inline_class = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112050,(1),null);
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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
return cljs.core.not((function (){var G__112062 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(item);
return (selected_choices.cljs$core$IFn$_invoke$arity$1 ? selected_choices.cljs$core$IFn$_invoke$arity$1(G__112062) : selected_choices.call(null,G__112062));
})());
}),logseq.db.frontend.property.property_value_content),items);
}
});
frontend.components.property.value.select_aux = rum.core.lazy_build(rum.core.build_defc,(function (block,property,p__112067){
var map__112068 = p__112067;
var map__112068__$1 = cljs.core.__destructure_map(map__112068);
var opts = map__112068__$1;
var items = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112068__$1,new cljs.core.Keyword(null,"items","items",1031954938));
var selected_choices = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112068__$1,new cljs.core.Keyword(null,"selected-choices","selected-choices",1913324317));
var multiple_choices_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112068__$1,new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490));
var selected_choices__$1 = cljs.core.set(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__112064_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837),p1__112064_SHARP_);
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,selected_choices)));
var clear_value = ["No ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property))].join('');
var clear_value_label = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1.text-sm","div.flex.flex-row.items-center.gap-1.text-sm",1556443449),frontend.ui.icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),clear_value], null)], null);
var vec__112069 = (function (){var G__112074 = frontend.components.property.value.sort_select_items(property,selected_choices__$1,items);
return (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(G__112074) : logseq.shui.hooks.use_state.call(null,G__112074));
})();
var items__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112069,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112069,(1),null);
var items_SINGLEQUOTE_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__112065_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(p1__112065_SHARP_));
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var blocks = frontend.components.property.value.get_operating_blocks(block);
var block_ids = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks);
return frontend.handler.property.batch_remove_block_property_BANG_(frontend.state.get_current_repo(),block_ids,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
})()),(function (___41611__auto__){
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
frontend.components.property.value.select_node = rum.core.lazy_build(rum.core.build_defc,(function (property,p__112104,result){
var map__112105 = p__112104;
var map__112105__$1 = cljs.core.__destructure_map(map__112105);
var opts = map__112105__$1;
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112105__$1,new cljs.core.Keyword(null,"block","block",664686210));
var multiple_choices_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112105__$1,new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490));
var dropdown_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112105__$1,new cljs.core.Keyword(null,"dropdown?","dropdown?",-1027769147));
var input_opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112105__$1,new cljs.core.Keyword(null,"input-opts","input-opts",1688681135));
var on_input = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112105__$1,new cljs.core.Keyword(null,"on-input","on-input",-267523366));
var add_new_choice_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112105__$1,new cljs.core.Keyword(null,"add-new-choice!","add-new-choice!",-1703027977));
var target = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112105__$1,new cljs.core.Keyword(null,"target","target",253001721));
var repo = frontend.state.get_current_repo();
var classes = new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486).cljs$core$IFn$_invoke$arity$1(property);
var tags_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
var alias_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","alias","block/alias",-2112644699),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
var tags_or_alias_QMARK_ = ((tags_QMARK_) || (alias_QMARK_));
var block__$1 = (function (){var or__5002__auto__ = (function (){var G__112106 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__112106) : frontend.db.entity.call(null,G__112106));
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
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__112095_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__112095_SHARP_));
}),((cljs.core.every_QMARK_(frontend.components.property.value.entity_map_QMARK_,v))?v:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [v], null)));
})():cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (node){
var node_SINGLEQUOTE_ = (cljs.core.truth_(new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(node))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(node),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(node)):node);
var node__$1 = (function (){var or__5002__auto__ = (function (){var G__112112 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(node_SINGLEQUOTE_);
if((G__112112 == null)){
return null;
} else {
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__112112) : frontend.db.entity.call(null,G__112112));
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
var G__112113 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(node__$1);
return (logseq.db.private_tags.cljs$core$IFn$_invoke$arity$1 ? logseq.db.private_tags.cljs$core$IFn$_invoke$arity$1(G__112113) : logseq.db.private_tags.call(null,G__112113));
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
var vec__112115 = ((cljs.core.integer_QMARK_(id))?(function (){var node_title = ((cljs.core.seq(new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486).cljs$core$IFn$_invoke$arity$1(property)))?logseq.db.frontend.content.recur_replace_uuid_in_block_title.cljs$core$IFn$_invoke$arity$1(node__$1):frontend.handler.block.block_unique_title(node__$1));
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
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.opacity-70","div.text-xs.opacity-70",-1130707358),(function (){var G__112152 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"search?","search?",785472524),true], null);
var G__112153 = frontend.state.get_current_repo();
var G__112154 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(node__$2);
var G__112155 = cljs.core.PersistentArrayMap.EMPTY;
return (breadcrumb.cljs$core$IFn$_invoke$arity$4 ? breadcrumb.cljs$core$IFn$_invoke$arity$4(G__112152,G__112153,G__112154,G__112155) : breadcrumb.call(null,G__112152,G__112153,G__112154,G__112155));
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
var header = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112115,(0),null);
var label = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112115,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(node__$1,new cljs.core.Keyword(null,"header","header",119441134),header,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"label-value","label-value",-1719020519),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(node__$1),new cljs.core.Keyword(null,"label","label",1718410804),label,new cljs.core.Keyword(null,"value","value",305978217),id,new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),((tags_QMARK_) && (cljs.core.contains_QMARK_(clojure.set.union.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.class","Whiteboard","logseq.class/Whiteboard",1013698452),null,new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081),null], null), null),logseq.db.internal_tags),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(node__$1))))], 0));
}),nodes);
var classes_SINGLEQUOTE_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (class$){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.class","Root","logseq.class/Root",273783827),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(class$));
}),classes);
var opts_SINGLEQUOTE_ = (function (){var G__112167 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),new cljs.core.Keyword(null,"dropdown?","dropdown?",-1027769147),new cljs.core.Keyword(null,"show-new-when-not-exact-match?","show-new-when-not-exact-match?",1510536201),new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),new cljs.core.Keyword(null,"input-default-placeholder","input-default-placeholder",-1040139250),new cljs.core.Keyword(null,"extract-chosen-fn","extract-chosen-fn",1058364622),new cljs.core.Keyword(null,"input-opts","input-opts",1688681135),new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490),new cljs.core.Keyword(null,"items","items",1031954938),new cljs.core.Keyword(null,"on-input","on-input",-267523366),new cljs.core.Keyword(null,"selected-choices","selected-choices",1913324317)],[(function (chosen,selected_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050))) && ((!(cljs.core.integer_QMARK_(chosen)))))),(function (add_tag_property_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.integer_QMARK_(chosen))?chosen:((clojure.string.blank_QMARK_(clojure.string.trim(chosen)))?null:((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050)))?(function (){
(logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("editor","new-property","editor/new-property",-1370252491),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"block","block",664686210),block__$1,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900),true,new cljs.core.Keyword(null,"property-key","property-key",972402246),chosen,new cljs.core.Keyword(null,"target","target",253001721),target], null)], null));
})()
:frontend.components.property.value._LT_create_page_if_not_exists_BANG_(block__$1,property,classes_SINGLEQUOTE_,chosen))))),(function (id){
return promesa.protocols._mcat(promesa.protocols._promise(((((cljs.core.integer_QMARK_(id)) && (cljs.core.not(logseq.db.frontend.entity_util.page_QMARK_((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(id) : frontend.db.entity.call(null,id)))))))?frontend.db.async._LT_get_block(repo,id):null)),(function (_){
return promesa.protocols._promise((cljs.core.truth_(id)?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.property.value.add_or_remove_property_value(block__$1,property,id,selected_QMARK_,cljs.core.PersistentArrayMap.EMPTY)),(function (___41611__auto__){
return promesa.protocols._promise(((cljs.core.fn_QMARK_(add_new_choice_BANG_))?(function (){var G__112183 = (function (){var e = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(id) : frontend.db.entity.call(null,id));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),cljs.core.select_keys(e,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null)),new cljs.core.Keyword(null,"label","label",1718410804),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(e)], null);
})();
return (add_new_choice_BANG_.cljs$core$IFn$_invoke$arity$1 ? add_new_choice_BANG_.cljs$core$IFn$_invoke$arity$1(G__112183) : add_new_choice_BANG_.call(null,G__112183));
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
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__112167,new cljs.core.Keyword(null,"transform-fn","transform-fn",1106801327),(function (results,input){
var temp__5802__auto__ = (function (){var and__5000__auto__ = cljs.core.empty_QMARK_(results);
if(and__5000__auto__){
return cljs.core.re_find(/(.*)#(.*)$/,input);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var vec__112237 = temp__5802__auto__;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112237,(0),null);
var new_page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112237,(1),null);
var class_input = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112237,(2),null);
var repo__$1 = frontend.state.get_current_repo();
var descendent_classes = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__112102_SHARP_){
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$2 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$2(repo__$1,p1__112102_SHARP_) : frontend.db.entity.call(null,repo__$1,p1__112102_SHARP_));
}),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__112101_SHARP_){
return frontend.db.model.get_structured_children(repo__$1,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__112101_SHARP_));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([classes_SINGLEQUOTE_], 0)));
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new_page),"#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(p))].join(''),new cljs.core.Keyword(null,"label","label",1718410804),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new_page),"#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(p))].join('')], null);
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__112103_SHARP_){
return clojure.string.includes_QMARK_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(p1__112103_SHARP_),class_input);
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(classes_SINGLEQUOTE_,descendent_classes)));
} else {
return results;
}
}));
} else {
return G__112167;
}
})();
return frontend.components.property.value.select_aux(block__$1,property,opts_SINGLEQUOTE_);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"frontend.components.property.value/select-node");
frontend.components.property.value.property_value_select_node = rum.core.lazy_build(rum.core.build_defc,(function (block,property,opts,p__112247){
var map__112248 = p__112247;
var map__112248__$1 = cljs.core.__destructure_map(map__112248);
var _STAR_show_new_property_config_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112248__$1,new cljs.core.Keyword(null,"*show-new-property-config?","*show-new-property-config?",-1054571618));
var vec__112251 = rum.core.use_state(null);
var initial_choices = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112251,(0),null);
var set_initial_choices_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112251,(1),null);
var vec__112254 = rum.core.use_state(null);
var result = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112254,(0),null);
var set_result_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112254,(1),null);
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
var G__112261 = frontend.util.ekey(e);
switch (G__112261) {
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.search.block_search(frontend.state.get_current_repo(),v,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"enable-snippet?","enable-snippet?",-692858749),false,new cljs.core.Keyword(null,"built-in?","built-in?",2078421512),false], null))),(function (result__$1){
return promesa.protocols._promise((set_result_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_result_BANG_.cljs$core$IFn$_invoke$arity$1(result__$1) : set_result_BANG_.call(null,result__$1)));
}));
}));
}
}),new cljs.core.Keyword(null,"add-new-choice!","add-new-choice!",-1703027977),(function (new_choice){
var G__112266 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(initial_choices),new_choice);
return (set_initial_choices_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_initial_choices_BANG_.cljs$core$IFn$_invoke$arity$1(G__112266) : set_initial_choices_BANG_.call(null,G__112266));
})], 0));
var repo = frontend.state.get_current_repo();
var classes = new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486).cljs$core$IFn$_invoke$arity$1(property);
var class_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property));
var non_root_classes = (function (){var G__112268 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (c){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(c),new cljs.core.Keyword("logseq.class","Root","logseq.class/Root",273783827));
}),classes);
if(class_QMARK_){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__112268,(frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083))));
} else {
return G__112268;
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.all(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (class$){
return frontend.db.async._LT_get_tag_objects(repo,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(class$));
}),non_root_classes))),(function (result__$1){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,result__$1))),(function (result_SINGLEQUOTE_){
return promesa.protocols._promise(set_result_and_initial_choices_BANG_(result_SINGLEQUOTE_));
}));
}));
}));
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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
frontend.components.property.value.select = rum.core.lazy_build(rum.core.build_defcs,(function (state,block,property,p__112302,p__112303){
var map__112304 = p__112302;
var map__112304__$1 = cljs.core.__destructure_map(map__112304);
var select_opts = map__112304__$1;
var multiple_choices_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112304__$1,new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490));
var dropdown_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112304__$1,new cljs.core.Keyword(null,"dropdown?","dropdown?",-1027769147));
var content_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112304__$1,new cljs.core.Keyword(null,"content-props","content-props",687449284));
var map__112305 = p__112303;
var map__112305__$1 = cljs.core.__destructure_map(map__112305);
var opts = map__112305__$1;
var _STAR_show_new_property_config_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112305__$1,new cljs.core.Keyword(null,"*show-new-property-config?","*show-new-property-config?",-1054571618));
var exit_edit_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112305__$1,new cljs.core.Keyword(null,"exit-edit?","exit-edit?",1607853059));
var _STAR_values = new cljs.core.Keyword("frontend.components.property.value","values","frontend.components.property.value/values",363263824).cljs$core$IFn$_invoke$arity$1(state);
var refresh_result_f = new cljs.core.Keyword("frontend.components.property.value","refresh-result-f","frontend.components.property.value/refresh-result-f",-1257872111).cljs$core$IFn$_invoke$arity$1(state);
var values = rum.core.react(_STAR_values);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"loading","loading",-737050189),values)){
return null;
} else {
var type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var closed_values_QMARK_ = cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property));
var items = ((closed_values_QMARK_)?(function (){var date_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property.repeat","recur-unit","logseq.property.repeat/recur-unit",690306247))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"date","date",-1463434462),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"property","property",-1114278232).cljs$core$IFn$_invoke$arity$1(opts)))));
var values__$1 = (function (){var G__112310 = new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property);
if(date_QMARK_){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (b){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.property.repeat","recur-unit.minute","logseq.property.repeat/recur-unit.minute",-1513655085),null,new cljs.core.Keyword("logseq.property.repeat","recur-unit.hour","logseq.property.repeat/recur-unit.hour",1438884954),null], null), null),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(b));
}),G__112310);
} else {
return G__112310;
}
})();
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (block__$1){
var icon = frontend.handler.property.util.get_block_property_value(block__$1,new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285));
var value = logseq.db.frontend.property.closed_value_content(block__$1);
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"label","label",1718410804),(cljs.core.truth_(icon)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.gap-1.items-center","div.flex.flex-row.gap-1.items-center",1211135204),frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic(icon,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color?","color?",-1891974356),true], null)], 0)),value], null):value),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block__$1),new cljs.core.Keyword(null,"label-value","label-value",-1719020519),value], null);
}),values__$1);
})():cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__112317){
var map__112318 = p__112317;
var map__112318__$1 = cljs.core.__destructure_map(map__112318);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112318__$1,new cljs.core.Keyword(null,"value","value",305978217));
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112318__$1,new cljs.core.Keyword(null,"label","label",1718410804));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),label,new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value)], null);
}),values)));
var items__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"date","date",-1463434462),type))?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (m){
var label = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__112321 = new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(m);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__112321) : frontend.db.entity.call(null,G__112321));
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
var selected_choices = ((cljs.core.every_QMARK_((function (p1__112277_SHARP_){
var and__5000__auto__ = cljs.core.map_QMARK_(p1__112277_SHARP_);
if(and__5000__auto__){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(p1__112277_SHARP_);
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
var G__112334 = frontend.util.ekey(e);
switch (G__112334) {
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
var vec__112335 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var block = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112335,(0),null);
var property = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112335,(1),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112335,(2),null);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
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
var value_block__$1 = ((((cljs.core.coll_QMARK_(value_block)) && (cljs.core.every_QMARK_(frontend.components.property.value.entity_map_QMARK_,value_block))))?cljs.core.set(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__112363_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__112363_SHARP_),new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837));
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
return daiquiri.interpreter.interpret((function (){var G__112371 = value_block__$1;
var G__112372 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"create-new-block","create-new-block",1377747253),(function (){
return frontend.components.property.value._LT_create_new_block_BANG_(block,property,"");
}),new cljs.core.Keyword(null,"property-ident","property-ident",697145839),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property)], null);
return (table_text_property_render.cljs$core$IFn$_invoke$arity$2 ? table_text_property_render.cljs$core$IFn$_invoke$arity$2(G__112371,G__112372) : table_text_property_render.call(null,G__112371,G__112372));
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
return daiquiri.interpreter.interpret((function (){var G__112380 = config;
var G__112381 = logseq.db.sort_by_order(value_block__$1);
return (blocks_container.cljs$core$IFn$_invoke$arity$2 ? blocks_container.cljs$core$IFn$_invoke$arity$2(G__112380,G__112381) : blocks_container.call(null,G__112380,G__112381));
})());
} else {
return rum.core.with_key((function (){var G__112386 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config,new cljs.core.Keyword(null,"property-default-value?","property-default-value?",769811896),default_value_QMARK_);
var G__112387 = value_block__$1;
return (block_container.cljs$core$IFn$_invoke$arity$2 ? block_container.cljs$core$IFn$_invoke$arity$2(G__112386,G__112387) : block_container.call(null,G__112386,G__112387));
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
return rum.core.with_key((function (){var G__112391 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"disable-preview?","disable-preview?",1485814365),true,new cljs.core.Keyword(null,"tag?","tag?",1714008252),class_QMARK_], null);
var G__112392 = v_block;
return (page_cp.cljs$core$IFn$_invoke$arity$2 ? page_cp.cljs$core$IFn$_invoke$arity$2(G__112391,G__112392) : page_cp.call(null,G__112391,G__112392));
})(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(v_block));
} else {
return frontend.components.property.value.property_normal_block_value(block,property,v_block,opts);

}
}),null,"frontend.components.property.value/property-block-value");
frontend.components.property.value.closed_value_item = rum.core.lazy_build(rum.core.build_defc,(function (value,p__112393){
var map__112394 = p__112393;
var map__112394__$1 = cljs.core.__destructure_map(map__112394);
var inline_text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112394__$1,new cljs.core.Keyword(null,"inline-text","inline-text",910915394));
var icon_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112394__$1,new cljs.core.Keyword(null,"icon?","icon?",-1663815703));
if(cljs.core.truth_(value)){
var eid = (cljs.core.truth_(frontend.components.property.value.entity_map_QMARK_(value))?new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),value], null));
var block = (function (){var or__5002__auto__ = (function (){var G__112395 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(eid) : frontend.db.entity.call(null,eid)));
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__112395) : frontend.db.sub_block.call(null,G__112395));
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
var attrs112396 = frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic(icon,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color?","color?",-1891974356),true], null)], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs112396))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-1","h-6"], null)], null),attrs112396], 0))):{'className':"flex flex-row items-center gap-1 h-6"}),((cljs.core.map_QMARK_(attrs112396))?[(cljs.core.truth_(value_SINGLEQUOTE_)?(function (){var attrs112399 = value_SINGLEQUOTE_;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs112399))?daiquiri.interpreter.element_attributes(attrs112399):null),((cljs.core.map_QMARK_(attrs112399))?null:[daiquiri.interpreter.interpret(attrs112399)]));
})():null)]:[daiquiri.interpreter.interpret(attrs112396),(cljs.core.truth_(value_SINGLEQUOTE_)?(function (){var attrs112429 = value_SINGLEQUOTE_;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs112429))?daiquiri.interpreter.element_attributes(attrs112429):null),((cljs.core.map_QMARK_(attrs112429))?null:[daiquiri.interpreter.interpret(attrs112429)]));
})():null)]));
}
} else {
if(cljs.core.truth_(property_block_QMARK_)){
return daiquiri.interpreter.interpret(value_SINGLEQUOTE_);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.type,new cljs.core.Keyword(null,"number","number",1570378438))){
return daiquiri.core.create_element("span",{'className':"number"},[cljs.core.str.cljs$core$IFn$_invoke$arity$1(value_SINGLEQUOTE_)]);
} else {
return daiquiri.interpreter.interpret((function (){var G__112445 = cljs.core.PersistentArrayMap.EMPTY;
var G__112446 = new cljs.core.Keyword(null,"markdown","markdown",1227225089);
var G__112447 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(value_SINGLEQUOTE_);
return (inline_text.cljs$core$IFn$_invoke$arity$3 ? inline_text.cljs$core$IFn$_invoke$arity$3(G__112445,G__112446,G__112447) : inline_text.call(null,G__112445,G__112446,G__112447));
})());

}
}
}
} else {
return null;
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.property.value/closed-value-item");
frontend.components.property.value.select_item = rum.core.lazy_build(rum.core.build_defc,(function (property,type,value,p__112679){
var map__112681 = p__112679;
var map__112681__$1 = cljs.core.__destructure_map(map__112681);
var opts = map__112681__$1;
var page_cp = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112681__$1,new cljs.core.Keyword(null,"page-cp","page-cp",1066562595));
var inline_text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112681__$1,new cljs.core.Keyword(null,"inline-text","inline-text",910915394));
var other_position_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112681__$1,new cljs.core.Keyword(null,"other-position?","other-position?",-1396628322));
var property_position = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112681__$1,new cljs.core.Keyword(null,"property-position","property-position",-1150084538));
var table_view_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112681__$1,new cljs.core.Keyword(null,"table-view?","table-view?",2073887505));
var _icon_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112681__$1,new cljs.core.Keyword(null,"_icon?","_icon?",341031076));
var closed_values_QMARK_ = cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property));
var tag_QMARK_ = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"tag?","tag?",1714008252).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("block","tags","block/tags",1814948340));
}
})();
var inline_text_cp = (function (content){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center","div.flex.flex-row.items-center",2086153476),(function (){var G__112684 = cljs.core.PersistentArrayMap.EMPTY;
var G__112685 = new cljs.core.Keyword(null,"markdown","markdown",1227225089);
var G__112686 = logseq.common.util.macro.expand_value_if_macro(content,frontend.state.get_macros());
return (inline_text.cljs$core$IFn$_invoke$arity$3 ? inline_text.cljs$core$IFn$_invoke$arity$3(G__112684,G__112685,G__112686) : inline_text.call(null,G__112684,G__112685,G__112686));
})()], null);
});
var attrs112676 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value,new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837)))?frontend.components.property.value.property_empty_btn_value(property):((closed_values_QMARK_)?frontend.components.property.value.closed_value_item(value,opts):(cljs.core.truth_((function (){var or__5002__auto__ = logseq.db.frontend.entity_util.page_QMARK_(value);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.seq(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(value));
}
})())?(cljs.core.truth_(value)?(function (){var opts__$1 = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"disable-preview?","disable-preview?",1485814365),true,new cljs.core.Keyword(null,"tag?","tag?",1714008252),tag_QMARK_,new cljs.core.Keyword(null,"property-position","property-position",-1150084538),property_position,new cljs.core.Keyword(null,"other-position?","other-position?",-1396628322),other_position_QMARK_,new cljs.core.Keyword(null,"table-view?","table-view?",2073887505),table_view_QMARK_,new cljs.core.Keyword(null,"ignore-alias?","ignore-alias?",1336725364),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","alias","block/alias",-2112644699),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property)),new cljs.core.Keyword(null,"on-context-menu","on-context-menu",-1330744340),(function (e){
frontend.util.stop(e);

var G__112687 = e.target;
var G__112688 = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),(function (){var G__112690 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"open",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(value));
})], null);
var G__112691 = ["Open ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(value))].join('');
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__112690,G__112691) : logseq.shui.ui.dropdown_menu_item.call(null,G__112690,G__112691));
})(),(function (){var G__112693 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"open sidebar",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.sidebar_add_block_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value),new cljs.core.Keyword(null,"page","page",849072397));
})], null);
var G__112694 = "Open in sidebar";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__112693,G__112694) : logseq.shui.ui.dropdown_menu_item.call(null,G__112693,G__112694));
})()], null);
});
var G__112689 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null),new cljs.core.Keyword(null,"align","align",1964212802),"start"], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__112687,G__112688,G__112689) : logseq.shui.ui.popup_show_BANG_.call(null,G__112687,G__112688,G__112689));
})], null);
return rum.core.with_key((page_cp.cljs$core$IFn$_invoke$arity$2 ? page_cp.cljs$core$IFn$_invoke$arity$2(opts__$1,value) : page_cp.call(null,opts__$1,value)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value));
})():null):((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"property","property",-1114278232),null,new cljs.core.Keyword(null,"page","page",849072397),null,new cljs.core.Keyword(null,"node","node",581201198),null,new cljs.core.Keyword(null,"class","class",-2030961996),null], null), null),type))?(function (){var temp__5804__auto__ = frontend.state.get_component(new cljs.core.Keyword("block","reference","block/reference",1588749254));
if(cljs.core.truth_(temp__5804__auto__)){
var reference = temp__5804__auto__;
if(cljs.core.truth_(value)){
var G__112695 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"table-view?","table-view?",2073887505),table_view_QMARK_], null);
var G__112696 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(value);
return (reference.cljs$core$IFn$_invoke$arity$2 ? reference.cljs$core$IFn$_invoke$arity$2(G__112695,G__112696) : reference.call(null,G__112695,G__112696));
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
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs112676))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["select-item","cursor-pointer"], null)], null),attrs112676], 0))):{'className':"select-item cursor-pointer"}),((cljs.core.map_QMARK_(attrs112676))?null:[daiquiri.interpreter.interpret(attrs112676)]));
}),null,"frontend.components.property.value/select-item");
frontend.components.property.value.single_value_select = rum.core.lazy_build(rum.core.build_defc,(function (block,property,value,select_opts,p__112702){
var map__112704 = p__112702;
var map__112704__$1 = cljs.core.__destructure_map(map__112704);
var opts = map__112704__$1;
var value_render = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112704__$1,new cljs.core.Keyword(null,"value-render","value-render",882962329));
var _STAR_el = rum.core.use_ref(null);
var editing_QMARK_ = new cljs.core.Keyword(null,"editing?","editing?",1646440800).cljs$core$IFn$_invoke$arity$1(opts);
var type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var select_opts_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(select_opts,new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490),false);
var popup_content = (function frontend$components$property$value$content_fn(target){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.property-select","div.property-select",-1891938982),(function (){var G__112706 = type;
var G__112706__$1 = (((G__112706 instanceof cljs.core.Keyword))?G__112706.fqn:null);
switch (G__112706__$1) {
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
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__112706__$1)].join('')));

}
})()], null);
});
var trigger_id = ["trigger-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"container-id","container-id",1274665684).cljs$core$IFn$_invoke$arity$1(opts)),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property))].join('');
var show_popup_BANG_ = (function (target){
var G__112710 = target;
var G__112711 = (function (){
return popup_content(target);
});
var G__112712 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"align","align",1964212802),"start",new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"auto-focus?","auto-focus?",1021654593),true,new cljs.core.Keyword(null,"trigger-id","trigger-id",-599381518),trigger_id], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__112710,G__112711,G__112712) : logseq.shui.ui.popup_show_BANG_.call(null,G__112710,G__112711,G__112712));
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
return daiquiri.interpreter.interpret((function (){var G__112727 = (cljs.core.truth_(new cljs.core.Keyword(null,"other-position?","other-position?",-1396628322).cljs$core$IFn$_invoke$arity$1(opts))?new cljs.core.Keyword(null,"div.jtrigger","div.jtrigger",49308519):new cljs.core.Keyword(null,"div.jtrigger.flex.flex-1.w-full.cursor-pointer","div.jtrigger.flex.flex-1.w-full.cursor-pointer",-1585419265));
var G__112728 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_el,new cljs.core.Keyword(null,"id","id",-1388402092),trigger_id,new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),(0),new cljs.core.Keyword(null,"on-click","on-click",1632826543),show_BANG_,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
var G__112731 = frontend.util.ekey(e);
switch (G__112731) {
case "Backspace":
case "Delete":
return frontend.components.property.value.delete_block_property_BANG_(block,property);

break;
case " ":
case "Enter":
var G__112732_113759 = rum.core.deref(_STAR_el);
if((G__112732_113759 == null)){
} else {
G__112732_113759.click();
}

return frontend.util.stop(e);

break;
default:
return null;

}
})], null);
var G__112729 = ((clojure.string.blank_QMARK_(value))?frontend.components.property.value.property_empty_text_value(property,opts):(value_render.cljs$core$IFn$_invoke$arity$0 ? value_render.cljs$core$IFn$_invoke$arity$0() : value_render.call(null)));
return (logseq.shui.ui.trigger_as.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.trigger_as.cljs$core$IFn$_invoke$arity$3(G__112727,G__112728,G__112729) : logseq.shui.ui.trigger_as.call(null,G__112727,G__112728,G__112729));
})());
}
}),null,"frontend.components.property.value/single-value-select");
frontend.components.property.value.property_value_inner = (function frontend$components$property$value$property_value_inner(block,property,value,p__112737){
var map__112738 = p__112737;
var map__112738__$1 = cljs.core.__destructure_map(map__112738);
var opts = map__112738__$1;
var inline_text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112738__$1,new cljs.core.Keyword(null,"inline-text","inline-text",910915394));
var page_cp = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112738__$1,new cljs.core.Keyword(null,"page-cp","page-cp",1066562595));
var dom_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112738__$1,new cljs.core.Keyword(null,"dom-id","dom-id",-1588236703));
var row_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112738__$1,new cljs.core.Keyword(null,"row?","row?",394970415));
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
})], null),"Set default value"], null):(cljs.core.truth_(text_ref_type_QMARK_)?frontend.components.property.value.property_block_value(value,block,property,page_cp,opts):(function (){var G__112740 = cljs.core.PersistentArrayMap.EMPTY;
var G__112741 = new cljs.core.Keyword(null,"markdown","markdown",1227225089);
var G__112742 = logseq.common.util.macro.expand_value_if_macro(cljs.core.str.cljs$core$IFn$_invoke$arity$1(value),frontend.state.get_macros());
return (inline_text.cljs$core$IFn$_invoke$arity$3 ? inline_text.cljs$core$IFn$_invoke$arity$3(G__112740,G__112741,G__112742) : inline_text.call(null,G__112740,G__112741,G__112742));
})()
))], null);
});
frontend.components.property.value.single_number_input = rum.core.lazy_build(rum.core.build_defc,(function (block,property,value_block,table_view_QMARK_){
var vec__112782 = rum.core.use_state(false);
var editing_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112782,(0),null);
var set_editing_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112782,(1),null);
var _STAR_ref = rum.core.use_ref(null);
var _STAR_input_ref = rum.core.use_ref(null);
var number_value = logseq.db.frontend.property.property_value_content(value_block);
var vec__112785 = rum.core.use_state(number_value);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112785,(0),null);
var set_value_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__112785,(1),null);
var set_property_value_BANG_ = (function() { 
var G__113774__delegate = function (value__$1,p__112788){
var map__112789 = p__112788;
var map__112789__$1 = cljs.core.__destructure_map(map__112789);
var exit_editing_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__112789__$1,new cljs.core.Keyword(null,"exit-editing?","exit-editing?",101580309),true);
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((((((!(clojure.string.blank_QMARK_(value__$1)))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.trim(cljs.core.str.cljs$core$IFn$_invoke$arity$1(number_value)),clojure.string.trim(cljs.core.str.cljs$core$IFn$_invoke$arity$1(value__$1))))))?frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),value__$1):null)),(function (___41611__auto__){
return promesa.protocols._promise((cljs.core.truth_(exit_editing_QMARK_)?(set_editing_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_editing_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_editing_BANG_.call(null,false)):null));
}));
}));
};
var G__113774 = function (value__$1,var_args){
var p__112788 = null;
if (arguments.length > 1) {
var G__113776__i = 0, G__113776__a = new Array(arguments.length -  1);
while (G__113776__i < G__113776__a.length) {G__113776__a[G__113776__i] = arguments[G__113776__i + 1]; ++G__113776__i;}
  p__112788 = new cljs.core.IndexedSeq(G__113776__a,0,null);
} 
return G__113774__delegate.call(this,value__$1,p__112788);};
G__113774.cljs$lang$maxFixedArity = 1;
G__113774.cljs$lang$applyTo = (function (arglist__113777){
var value__$1 = cljs.core.first(arglist__113777);
var p__112788 = cljs.core.rest(arglist__113777);
return G__113774__delegate(value__$1,p__112788);
});
G__113774.cljs$core$IFn$_invoke$arity$variadic = G__113774__delegate;
return G__113774;
})()
;
return daiquiri.core.create_element("div",{'ref':_STAR_ref,'onClick':(function (){
frontend.state.clear_selection_BANG_();

return (set_editing_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_editing_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_editing_BANG_.call(null,true));
}),'className':"ls-number flex flex-1 jtrigger"},[(cljs.core.truth_(editing_QMARK_)?daiquiri.interpreter.interpret((function (){var G__112827 = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_input_ref,new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),true,new cljs.core.Keyword(null,"class","class",-2030961996),["ls-number-input h-6 px-0 py-0 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base",(cljs.core.truth_(table_view_QMARK_)?" text-sm":null)].join(''),new cljs.core.Keyword(null,"value","value",305978217),value,new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
var G__112830 = frontend.util.evalue(e);
return (set_value_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_value_BANG_.cljs$core$IFn$_invoke$arity$1(G__112830) : set_value_BANG_.call(null,G__112830));
}),new cljs.core.Keyword(null,"on-blur","on-blur",814300747),(function (_e){
return set_property_value_BANG_(value);
}),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
var input = rum.core.deref(_STAR_input_ref);
var pos = frontend.util.cursor.pos(input);
var k = frontend.util.ekey(e);
if(frontend.util.input_text_selected_QMARK_(input)){
return null;
} else {
var G__112833 = k;
switch (G__112833) {
case "ArrowUp":
case "ArrowDown":
frontend.util.stop_propagation(e);

(set_editing_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_editing_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_editing_BANG_.call(null,false));

frontend.handler.editor.move_cross_boundary_up_down(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("ArrowUp",frontend.util.ekey(e)))?new cljs.core.Keyword(null,"up","up",-269712113):new cljs.core.Keyword(null,"down","down",1565245570)),cljs.core.PersistentArrayMap.EMPTY);

return set_property_value_BANG_(value,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"exit-editing?","exit-editing?",101580309),false], null));

break;
case "Backspace":
if((pos === (0))){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.property.remove_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property))),(function (___41611__auto__){
return promesa.protocols._promise(frontend.handler.editor.move_cross_boundary_up_down(new cljs.core.Keyword(null,"up","up",-269712113),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pos","pos",-864607220),new cljs.core.Keyword(null,"max","max",61366548)], null)));
}));
}));
} else {
return null;
}

break;
case "Escape":
case "Enter":
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(set_property_value_BANG_(value)),(function (___41611__auto__){
return promesa.protocols._promise(rum.core.deref(_STAR_ref).focus());
}));
}));

break;
default:
return null;

}
}
})], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__112827) : logseq.shui.ui.input.call(null,G__112827));
})()):daiquiri.interpreter.interpret(value))]);
}),null,"frontend.components.property.value/single-number-input");
frontend.components.property.value.property_scalar_value_aux = rum.core.lazy_build(rum.core.build_defcs,(function (state,block,property,value_STAR_,p__112847){
var map__112850 = p__112847;
var map__112850__$1 = cljs.core.__destructure_map(map__112850);
var opts = map__112850__$1;
var editing_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112850__$1,new cljs.core.Keyword(null,"editing?","editing?",1646440800));
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112850__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
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
return daiquiri.interpreter.interpret((function (){var G__112865 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"checked","checked",-50955819),checked_QMARK_,new cljs.core.Keyword(null,"class","class",-2030961996),"mt-1",new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),(function (value__$1){
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
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__112865) : logseq.shui.ui.checkbox.call(null,G__112865));
})());
} else {
return frontend.components.property.value.single_value_select(block,property__$1,value,select_opts,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(opts,new cljs.core.Keyword(null,"editing?","editing?",1646440800),editing_QMARK_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"value-render","value-render",882962329),(function (){
return frontend.components.property.value.select_item(property__$1,type,value,opts);
})], 0)));
}
} else {
var G__112866 = type;
var G__112866__$1 = (((G__112866 instanceof cljs.core.Keyword))?G__112866.fqn:null);
switch (G__112866__$1) {
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
var attrs112861 = (function (){var G__112868 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"class","class",-2030961996),"jtrigger flex flex-row items-center",new cljs.core.Keyword(null,"disabled","disabled",-1529784218),frontend.config.publishing_QMARK_,new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),editing_QMARK_,new cljs.core.Keyword(null,"checked","checked",-50955819),value,new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),add_property_BANG_,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
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
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__112868) : logseq.shui.ui.checkbox.call(null,G__112868));
})();
return daiquiri.core.create_element("label",((cljs.core.map_QMARK_(attrs112861))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","w-full","as-scalar-value-wrap","cursor-pointer"], null)], null),attrs112861], 0))):{'className':"flex w-full as-scalar-value-wrap cursor-pointer"}),((cljs.core.map_QMARK_(attrs112861))?null:[daiquiri.interpreter.interpret(attrs112861)]));

break;
default:
var attrs112863 = frontend.components.property.value.property_value_inner(block,property__$1,value,opts);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs112863))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-1"], null)], null),attrs112863], 0))):{'className':"flex flex-1"}),((cljs.core.map_QMARK_(attrs112863))?null:[daiquiri.interpreter.interpret(attrs112863)]));

}
}

}
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$,rum.core.reactive], null),"frontend.components.property.value/property-scalar-value-aux");
frontend.components.property.value.property_scalar_value = rum.core.lazy_build(rum.core.build_defc,(function (block,property,value_STAR_,p__112870){
var map__112871 = p__112870;
var map__112871__$1 = cljs.core.__destructure_map(map__112871);
var opts = map__112871__$1;
var container_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112871__$1,new cljs.core.Keyword(null,"container-id","container-id",1274665684));
var editing_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112871__$1,new cljs.core.Keyword(null,"editing?","editing?",1646440800));
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
frontend.components.property.value.multiple_values_inner = rum.core.lazy_build(rum.core.build_defc,(function (block,property,v,p__112872){
var map__112873 = p__112872;
var map__112873__$1 = cljs.core.__destructure_map(map__112873);
var opts = map__112873__$1;
var on_chosen = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112873__$1,new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900));
var editing_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112873__$1,new cljs.core.Keyword(null,"editing?","editing?",1646440800));
var type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var date_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"date","date",-1463434462));
var _STAR_el = rum.core.use_ref(null);
var items = (function (){var G__112874 = (cljs.core.truth_(frontend.components.property.value.entity_map_QMARK_(v))?cljs.core.PersistentHashSet.createAsIfByAssoc([v]):v);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("block","tags","block/tags",1814948340))){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (v__$1){
return cljs.core.contains_QMARK_(logseq.db.hidden_tags,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(v__$1));
}),G__112874);
} else {
return G__112874;
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
var content_fn = (function (p__112875,target){
var map__112876 = p__112875;
var map__112876__$1 = cljs.core.__destructure_map(map__112876);
var _id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112876__$1,new cljs.core.Keyword(null,"_id","_id",-789960287));
var content_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112876__$1,new cljs.core.Keyword(null,"content-props","content-props",687449284));
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
var G__112877 = rum.core.deref(_STAR_el);
var G__112878 = (function (opts__$1){
return content_fn(opts__$1,target);
});
var G__112879 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"as-content?","as-content?",-609445867),false,new cljs.core.Keyword(null,"align","align",1964212802),"start",new cljs.core.Keyword(null,"auto-focus?","auto-focus?",1021654593),true], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__112877,G__112878,G__112879) : logseq.shui.ui.popup_show_BANG_.call(null,G__112877,G__112878,G__112879));
}
});
return daiquiri.core.create_element("div",{'tabIndex':"0",'ref':_STAR_el,'onClick':show_popup_BANG_,'onKeyDown':(function (e){
var G__112880 = e.key;
switch (G__112880) {
case " ":
case "Enter":
var G__112881_113824 = rum.core.deref(_STAR_el);
if((G__112881_113824 == null)){
} else {
G__112881_113824.click();
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
return daiquiri.interpreter.interpret(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-50.-ml-1","span.opacity-50.-ml-1",1632216631),","], null),(function (){var iter__5480__auto__ = (function frontend$components$property$value$iter__112891(s__112892){
return (new cljs.core.LazySeq(null,(function (){
var s__112892__$1 = s__112892;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__112892__$1);
if(temp__5804__auto__){
var s__112892__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__112892__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__112892__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__112894 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__112893 = (0);
while(true){
if((i__112893 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__112893);
cljs.core.chunk_append(b__112894,rum.core.with_key(frontend.components.property.value.select_item(property,type,item,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"show-popup!","show-popup!",791580912),show_popup_BANG_)),(function (){var or__5002__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(item);
}
})()));

var G__113828 = (i__112893 + (1));
i__112893 = G__113828;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__112894),frontend$components$property$value$iter__112891(cljs.core.chunk_rest(s__112892__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__112894),null);
}
} else {
var item = cljs.core.first(s__112892__$2);
return cljs.core.cons(rum.core.with_key(frontend.components.property.value.select_item(property,type,item,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opts,new cljs.core.Keyword(null,"show-popup!","show-popup!",791580912),show_popup_BANG_)),(function (){var or__5002__auto__ = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(item);
}
})()),frontend$components$property$value$iter__112891(cljs.core.rest(s__112892__$2)));
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
frontend.components.property.value.property_value = rum.core.lazy_build(rum.core.build_defcs,(function (state,block,property,p__112908){
var map__112909 = p__112908;
var map__112909__$1 = cljs.core.__destructure_map(map__112909);
var opts = map__112909__$1;
var show_tooltip_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112909__$1,new cljs.core.Keyword(null,"show-tooltip?","show-tooltip?",-1214081087));
var p_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112909__$1,new cljs.core.Keyword(null,"p-block","p-block",1335284937));
var p_property = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112909__$1,new cljs.core.Keyword(null,"p-property","p-property",-435865980));
var editing_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__112909__$1,new cljs.core.Keyword(null,"editing?","editing?",1646440800));
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
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1((function (){var G__113004 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__113004) : frontend.db.entity.call(null,G__113004));
})()));
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.gap-1","div.flex.flex-row.items-center.gap-1",-1023433319),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.warning","div.warning",-131852872),"Self reference"], null),(function (){var G__113006 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"class","class",-2030961996),"h-5",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.db_based.property.remove_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
})], null);
var G__113007 = "Fix it!";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__113006,G__113007) : logseq.shui.ui.button.call(null,G__113006,G__113007));
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
var G__113851 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(parents,parent);
parents = G__113851;
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
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-1.items-center.gap-1","div.flex.flex-1.items-center.gap-1",-1198043612),cljs.core.interpose.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-50.text-sm","span.opacity-50.text-sm",1914462525)," > "], null),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__113019){
var map__113020 = p__113019;
var map__113020__$1 = cljs.core.__destructure_map(map__113020);
var ancestor = map__113020__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__113020__$1,new cljs.core.Keyword("block","title","block/title",710445684));
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
var G__113021 = (function (){var G__113022 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"delayDuration","delayDuration",597947120),(1200)], null);
var G__113023 = (function (){var G__113025 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"onFocusCapture","onFocusCapture",-1273942772),(function (p1__112907_SHARP_){
return frontend.util.stop_propagation(p1__112907_SHARP_);
}),new cljs.core.Keyword(null,"as-child","as-child",1364710342),true], null);
var G__113026 = value_cp;
return (logseq.shui.ui.tooltip_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.tooltip_trigger.cljs$core$IFn$_invoke$arity$2(G__113025,G__113026) : logseq.shui.ui.tooltip_trigger.call(null,G__113025,G__113026));
})();
var G__113024 = (function (){var G__113027 = ["Change ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property))].join('');
return (logseq.shui.ui.tooltip_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.tooltip_content.cljs$core$IFn$_invoke$arity$1(G__113027) : logseq.shui.ui.tooltip_content.call(null,G__113027));
})();
return (logseq.shui.ui.tooltip.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.tooltip.cljs$core$IFn$_invoke$arity$3(G__113022,G__113023,G__113024) : logseq.shui.ui.tooltip.call(null,G__113022,G__113023,G__113024));
})();
return (logseq.shui.ui.tooltip_provider.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.tooltip_provider.cljs$core$IFn$_invoke$arity$1(G__113021) : logseq.shui.ui.tooltip_provider.call(null,G__113021));
} else {
return value_cp;
}
}
})());
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.property.value/property-value");

//# sourceMappingURL=frontend.components.property.value.js.map
