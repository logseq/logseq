goog.provide('frontend.components.property.config');
/**
 * Update commands after task status and priority's closed values has been changed
 */
frontend.components.property.config.re_init_commands_BANG_ = (function frontend$components$property$config$re_init_commands_BANG_(property){
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853),null,new cljs.core.Keyword("logseq.property","priority","logseq.property/priority",239228411),null], null), null),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property))){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("init","commands","init/commands",315507426)], null));
} else {
return null;
}
});
/**
 * Create new closed value and returns its block UUID.
 */
frontend.components.property.config._LT_upsert_closed_value_BANG_ = (function frontend$components$property$config$_LT_upsert_closed_value_BANG_(property,item){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.property.upsert_closed_value_BANG_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),item)),(function (___40947__auto__){
return promesa.protocols._promise(frontend.components.property.config.re_init_commands_BANG_(property));
}));
}));
});
frontend.components.property.config.loop_focusable_elements_BANG_ = (function frontend$components$property$config$loop_focusable_elements_BANG_(var_args){
var G__70372 = arguments.length;
switch (G__70372) {
case 1:
return frontend.components.property.config.loop_focusable_elements_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.components.property.config.loop_focusable_elements_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.components.property.config.loop_focusable_elements_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (cnt){
return frontend.components.property.config.loop_focusable_elements_BANG_.cljs$core$IFn$_invoke$arity$2(cnt,".ui__button:not([disabled]), .ui__input, .ui__textarea");
}));

(frontend.components.property.config.loop_focusable_elements_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (cnt,selectors){
var temp__5804__auto__ = (function (){var G__70373 = cnt;
var G__70373__$1 = (((G__70373 == null))?null:G__70373.querySelectorAll(selectors));
if((G__70373__$1 == null)){
return null;
} else {
return cljs.core.seq(G__70373__$1);
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var els = temp__5804__auto__;
var active = document.activeElement;
var current_idx = els.indexOf(active);
var total_len = cljs.core.count(els);
var to_idx = ((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((-1),current_idx)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(total_len,(current_idx + (1))))))?(0):(current_idx + (1))
);
var G__70374 = els;
var G__70374__$1 = (((G__70374 == null))?null:cljs.core.nth.cljs$core$IFn$_invoke$arity$2(G__70374,to_idx));
if((G__70374__$1 == null)){
return null;
} else {
return G__70374__$1.focus();
}
} else {
return null;
}
}));

(frontend.components.property.config.loop_focusable_elements_BANG_.cljs$lang$maxFixedArity = 2);

frontend.components.property.config.set_property_description_BANG_ = (function frontend$components$property$config$set_property_description_BANG_(property,description){
var temp__5802__auto__ = new cljs.core.Keyword("logseq.property","description","logseq.property/description",-336236200).cljs$core$IFn$_invoke$arity$1(property);
if(cljs.core.truth_(temp__5802__auto__)){
var ent = temp__5802__auto__;
return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.outliner.core.block_with_updated_at(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(ent),new cljs.core.Keyword("block","title","block/title",710445684),description], null))], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
if(clojure.string.blank_QMARK_(description)){
return null;
} else {
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","description","logseq.property/description",-336236200),description);
}
}
});
frontend.components.property.config._LT_create_class_if_not_exists_BANG_ = (function frontend$components$property$config$_LT_create_class_if_not_exists_BANG_(value){
if(typeof value === 'string'){
var page_name = clojure.string.trim(value);
if(clojure.string.blank_QMARK_(page_name)){
return null;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.page._LT_create_class_BANG_(page_name,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false], null))),(function (page){
return promesa.protocols._promise(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(page));
}));
}));
}
} else {
return null;
}
});
frontend.components.property.config.class_select = rum.core.lazy_build(rum.core.build_defc,(function (property,p__70397){
var map__70398 = p__70397;
var map__70398__$1 = cljs.core.__destructure_map(map__70398);
var multiple_choices_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__70398__$1,new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490),true);
var disabled_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70398__$1,new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181));
var default_open_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70398__$1,new cljs.core.Keyword(null,"default-open?","default-open?",-2082763144));
var no_class_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70398__$1,new cljs.core.Keyword(null,"no-class?","no-class?",-42395826));
var on_hide = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70398__$1,new cljs.core.Keyword(null,"on-hide","on-hide",1263105709));
var _STAR_ref = rum.core.use_ref(null);
var schema_classes = new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486).cljs$core$IFn$_invoke$arity$1(property);
var attrs70396 = (function (){var content_fn = (function (p__70399){
var map__70400 = p__70399;
var map__70400__$1 = cljs.core.__destructure_map(map__70400);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70400__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var toggle_fn = (function (){
if(cljs.core.fn_QMARK_(on_hide)){
(on_hide.cljs$core$IFn$_invoke$arity$0 ? on_hide.cljs$core$IFn$_invoke$arity$0() : on_hide.call(null));
} else {
}

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(id) : logseq.shui.ui.popup_hide_BANG_.call(null,id));
});
var classes = frontend.db.model.get_all_readable_classes(frontend.state.get_current_repo(),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"except-root-class?","except-root-class?",-345353595),true], null));
var options = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (class$){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(class$),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(class$)], null);
}),classes);
var options__$1 = (cljs.core.truth_(no_class_QMARK_)?cljs.core.cons(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),"Skip choosing tag",new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"no-tag","no-tag",-2051082798)], null),options):options);
var opts = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),new cljs.core.Keyword(null,"dropdown?","dropdown?",-1027769147),new cljs.core.Keyword(null,"show-new-when-not-exact-match?","show-new-when-not-exact-match?",1510536201),new cljs.core.Keyword(null,"extract-fn","extract-fn",-339752723),new cljs.core.Keyword(null,"input-default-placeholder","input-default-placeholder",-1040139250),new cljs.core.Keyword(null,"extract-chosen-fn","extract-chosen-fn",1058364622),new cljs.core.Keyword(null,"input-opts","input-opts",1688681135),new cljs.core.Keyword(null,"close-modal?","close-modal?",-207518383),new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490),new cljs.core.Keyword(null,"items","items",1031954938),new cljs.core.Keyword(null,"selected-choices","selected-choices",1913324317)],[(function (value,select_QMARK_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value,new cljs.core.Keyword(null,"no-tag","no-tag",-2051082798))){
return toggle_fn();
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.property.config._LT_create_class_if_not_exists_BANG_(value)),(function (result){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var or__5002__auto__ = result;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return value;
}
})()),(function (value_SINGLEQUOTE_){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_(select_QMARK_)?new cljs.core.Keyword("db","add","db/add",235286841):new cljs.core.Keyword("db","retract","db/retract",-1549825231)),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),value_SINGLEQUOTE_], null)], null)], null)),(function (tx_data){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),tx_data,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"update-property","update-property",348681633)], null))),(function (_){
return promesa.protocols._promise((cljs.core.truth_(multiple_choices_QMARK_)?null:toggle_fn()));
}));
}));
}));
}));
}));
}
}),false,true,new cljs.core.Keyword(null,"label","label",1718410804),(cljs.core.truth_(multiple_choices_QMARK_)?"Choose tags":"Choose tag"),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
var G__70401 = frontend.util.ekey(e);
switch (G__70401) {
case "Escape":
frontend.util.stop(e);

return toggle_fn();

break;
default:
return null;

}
})], null),false,multiple_choices_QMARK_,options__$1,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),schema_classes)]);
return frontend.components.select.select(opts);
});
if(cljs.core.truth_(default_open_QMARK_)){
return content_fn(null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-1.cursor-pointer","div.flex.flex-1.cursor-pointer",-774426367),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_ref,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(cljs.core.truth_(disabled_QMARK_)?cljs.core.constantly(null):(function (p1__70375_SHARP_){
var G__70402 = p1__70375_SHARP_.target;
var G__70403 = content_fn;
var G__70404 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"ls-node-tags-sub-pane","ls-node-tags-sub-pane",-1694940447)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__70402,G__70403,G__70404) : logseq.shui.ui.popup_show_BANG_.call(null,G__70402,G__70403,G__70404));
}))], null),((cljs.core.seq(schema_classes))?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-1.flex-row.items-center.flex-wrap.gap-2","div.flex.flex-1.flex-row.items-center.flex-wrap.gap-2",-862167387),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"max-w-[300px]"], null),(function (){var iter__5480__auto__ = (function frontend$components$property$config$iter__70405(s__70406){
return (new cljs.core.LazySeq(null,(function (){
var s__70406__$1 = s__70406;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__70406__$1);
if(temp__5804__auto__){
var s__70406__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__70406__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__70406__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__70408 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__70407 = (0);
while(true){
if((i__70407 < size__5479__auto__)){
var class$ = cljs.core._nth(c__5478__auto__,i__70407);
cljs.core.chunk_append(b__70408,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.text-sm","a.text-sm",-884048665),["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(class$))].join('')], null));

var G__70733 = (i__70407 + (1));
i__70407 = G__70733;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__70408),frontend$components$property$config$iter__70405(cljs.core.chunk_rest(s__70406__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__70408),null);
}
} else {
var class$ = cljs.core.first(s__70406__$2);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.text-sm","a.text-sm",-884048665),["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(class$))].join('')], null),frontend$components$property$config$iter__70405(cljs.core.rest(s__70406__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(schema_classes);
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity-60.pl-1.top-1.relative.hover:opacity-80.active:opacity-60","span.opacity-60.pl-1.top-1.relative.hover:opacity-80.active:opacity-60",-982812794),logseq.shui.ui.tabler_icon("edit")], null)], null):frontend.components.property.value.property_empty_btn_value(property))], null);
}
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs70396))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-1","col-span-3"], null)], null),attrs70396], 0))):{'className':"flex flex-1 col-span-3"}),((cljs.core.map_QMARK_(attrs70396))?null:[daiquiri.interpreter.interpret(attrs70396)]));
}),null,"frontend.components.property.config/class-select");
frontend.components.property.config.name_edit_pane = rum.core.lazy_build(rum.core.build_defc,(function (property,p__70410){
var map__70411 = p__70410;
var map__70411__$1 = cljs.core.__destructure_map(map__70411);
var set_sub_open_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70411__$1,new cljs.core.Keyword(null,"set-sub-open!","set-sub-open!",-2053118824));
var disabled_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70411__$1,new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181));
var _STAR_form_data = rum.core.use_ref(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword(null,"title","title",636505583),(function (){var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})(),new cljs.core.Keyword(null,"description","description",-1428560544),(function (){var or__5002__auto__ = logseq.db.frontend.property.property_value_content(new cljs.core.Keyword("logseq.property","description","logseq.property/description",-336236200).cljs$core$IFn$_invoke$arity$1(property));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})()], null));
var vec__70412 = rum.core.use_state(rum.core.deref(_STAR_form_data));
var form_data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70412,(0),null);
var set_form_data_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70412,(1),null);
var vec__70415 = rum.core.use_state(false);
var saving_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70415,(0),null);
var set_saving_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70415,(1),null);
var _STAR_el = rum.core.use_ref(null);
var _STAR_input_ref = rum.core.use_ref(null);
var title = frontend.util.trim_safe(new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(form_data));
var description = frontend.util.trim_safe(new cljs.core.Keyword(null,"description","description",-1428560544).cljs$core$IFn$_invoke$arity$1(form_data));
logseq.shui.hooks.use_effect_BANG_((function (){
return setTimeout((function (){
var G__70418 = rum.core.deref(_STAR_el);
if((G__70418 == null)){
return null;
} else {
return G__70418.focus();
}
}),(32));
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'onKeyDown':(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Tab",e.key)){
return frontend.components.property.config.loop_focusable_elements_BANG_.cljs$core$IFn$_invoke$arity$1(rum.core.deref(_STAR_el));
} else {
return null;
}
}),'tabIndex':(-1),'ref':_STAR_el,'className':"ls-property-name-edit-pane outline-none"},[daiquiri.core.create_element("div",{'className':"flex items-center input-wrap"},[frontend.components.icon.icon_picker(new cljs.core.Keyword(null,"icon","icon",1679606541).cljs$core$IFn$_invoke$arity$1(form_data),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (_e,icon){
var G__70436 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(form_data,new cljs.core.Keyword(null,"icon","icon",1679606541),icon);
return (set_form_data_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_form_data_BANG_.cljs$core$IFn$_invoke$arity$1(G__70436) : set_form_data_BANG_.call(null,G__70436));
}),new cljs.core.Keyword(null,"popup-opts","popup-opts",-1667184839),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),"start"], null),new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362),cljs.core.boolean$(new cljs.core.Keyword(null,"icon","icon",1679606541).cljs$core$IFn$_invoke$arity$1(form_data)),new cljs.core.Keyword(null,"empty-label","empty-label",-288358384),"?"], null)),daiquiri.interpreter.interpret((function (){var G__70439 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_input_ref,new cljs.core.Keyword(null,"size","size",1098693007),"sm",new cljs.core.Keyword(null,"default-value","default-value",232220170),title,new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"name",new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_,new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
var G__70440 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(form_data,new cljs.core.Keyword(null,"title","title",636505583),frontend.util.trim_safe(frontend.util.evalue(e)));
return (set_form_data_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_form_data_BANG_.cljs$core$IFn$_invoke$arity$1(G__70440) : set_form_data_BANG_.call(null,G__70440));
})], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__70439) : logseq.shui.ui.input.call(null,G__70439));
})())]),(function (){var attrs70425 = (function (){var G__70441 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"description",new cljs.core.Keyword(null,"default-value","default-value",232220170),description,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_,new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
var G__70442 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(form_data,new cljs.core.Keyword(null,"description","description",-1428560544),frontend.util.trim_safe(frontend.util.evalue(e)));
return (set_form_data_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_form_data_BANG_.cljs$core$IFn$_invoke$arity$1(G__70442) : set_form_data_BANG_.call(null,G__70442));
})], null);
return (logseq.shui.ui.textarea.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.textarea.cljs$core$IFn$_invoke$arity$1(G__70441) : logseq.shui.ui.textarea.call(null,G__70441));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs70425))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pt-2"], null)], null),attrs70425], 0))):{'className':"pt-2"}),((cljs.core.map_QMARK_(attrs70425))?null:[daiquiri.interpreter.interpret(attrs70425)]));
})(),(function (){var dirty_QMARK_ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(rum.core.deref(_STAR_form_data),form_data);
var attrs70434 = (function (){var G__70443 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"size","size",1098693007),"sm",new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(function (){var or__5002__auto__ = saving_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (!(dirty_QMARK_));
}
})(),new cljs.core.Keyword(null,"variant","variant",-424354234),((dirty_QMARK_)?new cljs.core.Keyword(null,"default","default",-1987822328):new cljs.core.Keyword(null,"secondary","secondary",-669381460)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(set_saving_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_saving_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_saving_BANG_.call(null,true));

return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(promesa.core.all(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [frontend.handler.db_based.property.upsert_property_BANG_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"property-name","property-name",-1399851434),title,new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285),new cljs.core.Keyword(null,"icon","icon",1679606541).cljs$core$IFn$_invoke$arity$1(form_data)], null)], null)),((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(description,new cljs.core.Keyword(null,"description","description",-1428560544).cljs$core$IFn$_invoke$arity$1(rum.core.deref(_STAR_form_data))))?frontend.components.property.config.set_property_description_BANG_(property,description):null)], null)),(function (){
return (set_sub_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sub_open_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_sub_open_BANG_.call(null,false));
})),(function (p1__70409_SHARP_){
var G__70445 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__70409_SHARP_);
var G__70446 = new cljs.core.Keyword(null,"error","error",-978969032);
return (logseq.shui.ui.toast_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.toast_BANG_.cljs$core$IFn$_invoke$arity$2(G__70445,G__70446) : logseq.shui.ui.toast_BANG_.call(null,G__70445,G__70446));
})),(function (){
return (set_saving_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_saving_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_saving_BANG_.call(null,false));
}));
})], null);
var G__70444 = "Save";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__70443,G__70444) : logseq.shui.ui.button.call(null,G__70443,G__70444));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs70434))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pt-2","flex","justify-end"], null)], null),attrs70434], 0))):{'className':"pt-2 flex justify-end"}),((cljs.core.map_QMARK_(attrs70434))?null:[daiquiri.interpreter.interpret(attrs70434)]));
})()]);
}),null,"frontend.components.property.config/name-edit-pane");
frontend.components.property.config.choice_base_edit_form = rum.core.lazy_build(rum.core.build_defc,(function (own_property,block){
var create_QMARK_ = new cljs.core.Keyword(null,"create?","create?",-1986446702).cljs$core$IFn$_invoke$arity$1(block);
var uuid = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
var _STAR_form_data = rum.core.use_ref(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"value","value",305978217),(function (){var or__5002__auto__ = cljs.core.str.cljs$core$IFn$_invoke$arity$1(logseq.db.frontend.property.closed_value_content(block));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})(),new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword(null,"description","description",-1428560544),(function (){var or__5002__auto__ = logseq.db.frontend.property.property_value_content(new cljs.core.Keyword("logseq.property","description","logseq.property/description",-336236200).cljs$core$IFn$_invoke$arity$1(block));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})()], null));
var vec__70448 = rum.core.use_state(rum.core.deref(_STAR_form_data));
var form_data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70448,(0),null);
var set_form_data_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70448,(1),null);
var _STAR_input_ref = rum.core.use_ref(null);
logseq.shui.hooks.use_effect_BANG_((function (){
if(cljs.core.truth_(create_QMARK_)){
return setTimeout((function (){
var G__70451 = rum.core.deref(_STAR_input_ref);
if((G__70451 == null)){
return null;
} else {
return G__70451.focus();
}
}),(60));
} else {
return null;
}
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'className':"ls-base-edit-form"},[daiquiri.core.create_element("div",{'className':"flex items-center input-wrap"},[frontend.components.icon.icon_picker(new cljs.core.Keyword(null,"icon","icon",1679606541).cljs$core$IFn$_invoke$arity$1(form_data),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (_e,icon){
var G__70471 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(form_data,new cljs.core.Keyword(null,"icon","icon",1679606541),icon);
return (set_form_data_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_form_data_BANG_.cljs$core$IFn$_invoke$arity$1(G__70471) : set_form_data_BANG_.call(null,G__70471));
}),new cljs.core.Keyword(null,"empty-label","empty-label",-288358384),"?",new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362),cljs.core.boolean$(new cljs.core.Keyword(null,"icon","icon",1679606541).cljs$core$IFn$_invoke$arity$1(form_data)),new cljs.core.Keyword(null,"popup-opts","popup-opts",-1667184839),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),"start"], null)], null)),daiquiri.interpreter.interpret((function (){var G__70474 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"ref","ref",1289896967),_STAR_input_ref,new cljs.core.Keyword(null,"size","size",1098693007),"sm",new cljs.core.Keyword(null,"default-value","default-value",232220170),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(form_data),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
var G__70475 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(form_data,new cljs.core.Keyword(null,"value","value",305978217),frontend.util.trim_safe(frontend.util.evalue(e)));
return (set_form_data_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_form_data_BANG_.cljs$core$IFn$_invoke$arity$1(G__70475) : set_form_data_BANG_.call(null,G__70475));
}),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"title"], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__70474) : logseq.shui.ui.input.call(null,G__70474));
})())]),(function (){var attrs70458 = (function (){var G__70476 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"description",new cljs.core.Keyword(null,"default-value","default-value",232220170),new cljs.core.Keyword(null,"description","description",-1428560544).cljs$core$IFn$_invoke$arity$1(form_data),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
var G__70477 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(form_data,new cljs.core.Keyword(null,"description","description",-1428560544),frontend.util.trim_safe(frontend.util.evalue(e)));
return (set_form_data_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_form_data_BANG_.cljs$core$IFn$_invoke$arity$1(G__70477) : set_form_data_BANG_.call(null,G__70477));
})], null);
return (logseq.shui.ui.textarea.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.textarea.cljs$core$IFn$_invoke$arity$1(G__70476) : logseq.shui.ui.textarea.call(null,G__70476));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs70458))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pt-2"], null)], null),attrs70458], 0))):{'className':"pt-2"}),((cljs.core.map_QMARK_(attrs70458))?null:[daiquiri.interpreter.interpret(attrs70458)]));
})(),(function (){var attrs70469 = (function (){var dirty_QMARK_ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(rum.core.deref(_STAR_form_data),form_data);
var G__70478 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"size","size",1098693007),"sm",new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(!(dirty_QMARK_)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.components.property.config._LT_upsert_closed_value_BANG_(own_property,(function (){var G__70480 = form_data;
if(cljs.core.truth_(uuid)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__70480,new cljs.core.Keyword(null,"id","id",-1388402092),uuid);
} else {
return G__70480;
}
})()),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})),(function (p1__70447_SHARP_){
var G__70481 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__70447_SHARP_);
var G__70482 = new cljs.core.Keyword(null,"error","error",-978969032);
return (logseq.shui.ui.toast_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.toast_BANG_.cljs$core$IFn$_invoke$arity$2(G__70481,G__70482) : logseq.shui.ui.toast_BANG_.call(null,G__70481,G__70482));
}));
}),new cljs.core.Keyword(null,"variant","variant",-424354234),((dirty_QMARK_)?new cljs.core.Keyword(null,"default","default",-1987822328):new cljs.core.Keyword(null,"secondary","secondary",-669381460))], null);
var G__70479 = "Save";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__70478,G__70479) : logseq.shui.ui.button.call(null,G__70478,G__70479));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs70469))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pt-2","flex","justify-end"], null)], null),attrs70469], 0))):{'className':"pt-2 flex justify-end"}),((cljs.core.map_QMARK_(attrs70469))?null:[daiquiri.interpreter.interpret(attrs70469)]));
})()]);
}),null,"frontend.components.property.config/choice-base-edit-form");
frontend.components.property.config.restore_root_highlight_item_BANG_ = (function frontend$components$property$config$restore_root_highlight_item_BANG_(id){
return setTimeout((function (){
var G__70483 = goog.dom.getElement(id);
if((G__70483 == null)){
return null;
} else {
return G__70483.focus();
}
}),(32));
});
frontend.components.property.config.dropdown_editor_menuitem = rum.core.lazy_build(rum.core.build_defc,(function (p__70487){
var map__70488 = p__70487;
var map__70488__$1 = cljs.core.__destructure_map(map__70488);
var toggle_checked_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70488__$1,new cljs.core.Keyword(null,"toggle-checked?","toggle-checked?",1549681434));
var disabled_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70488__$1,new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181));
var submenu_content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70488__$1,new cljs.core.Keyword(null,"submenu-content","submenu-content",-1896531140));
var on_toggle_checked_change = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70488__$1,new cljs.core.Keyword(null,"on-toggle-checked-change","on-toggle-checked-change",644403327));
var desc = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70488__$1,new cljs.core.Keyword(null,"desc","desc",2093485764));
var checkbox_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70488__$1,new cljs.core.Keyword(null,"checkbox?","checkbox?",2007099436));
var sub_content_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70488__$1,new cljs.core.Keyword(null,"sub-content-props","sub-content-props",-1536970259));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70488__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70488__$1,new cljs.core.Keyword(null,"title","title",636505583));
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70488__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var item_props = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70488__$1,new cljs.core.Keyword(null,"item-props","item-props",-1762062444));
var submenu_content__$1 = (cljs.core.truth_(disabled_QMARK_)?null:submenu_content);
var item_props_SINGLEQUOTE_ = (cljs.core.truth_((function (){var and__5000__auto__ = disabled_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"on-select","on-select",-192407950).cljs$core$IFn$_invoke$arity$1(item_props);
} else {
return and__5000__auto__;
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(item_props,new cljs.core.Keyword(null,"on-select","on-select",-192407950),(function (){
return null;
})):item_props);
var vec__70489 = rum.core.use_state(false);
var sub_open_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70489,(0),null);
var set_sub_open_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70489,(1),null);
var toggle_QMARK_ = cljs.core.boolean_QMARK_(toggle_checked_QMARK_);
var id1 = cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = id;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.random_uuid();
}
})());
var id2 = ["d2-",id1].join('');
var or_close_menu_sub_BANG_ = (function (){
if(((cljs.core.not(logseq.shui.popup.core.get_popup(new cljs.core.Keyword(null,"ls-icon-picker","ls-icon-picker",1363108390)))) && (((cljs.core.not(logseq.shui.popup.core.get_popup(new cljs.core.Keyword(null,"ls-base-edit-form","ls-base-edit-form",602084072)))) && (cljs.core.not(logseq.shui.popup.core.get_popup(new cljs.core.Keyword(null,"ls-node-tags-sub-pane","ls-node-tags-sub-pane",-1694940447)))))))){
(set_sub_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sub_open_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_sub_open_BANG_.call(null,false));

return frontend.components.property.config.restore_root_highlight_item_BANG_(id1);
} else {
return null;
}
});
var wrap_menuitem = (cljs.core.truth_(submenu_content__$1)?(function (p1__70484_SHARP_){
var G__70492 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"open","open",-1763596448),sub_open_QMARK_,new cljs.core.Keyword(null,"on-open-change","on-open-change",687272862),(function (v){
if(cljs.core.truth_(v)){
return (set_sub_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sub_open_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_sub_open_BANG_.call(null,true));
} else {
return or_close_menu_sub_BANG_();
}
})], null);
var G__70493 = (function (){var G__70495 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),id1], null),item_props_SINGLEQUOTE_], 0));
var G__70496 = p1__70484_SHARP_;
return (logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_sub_trigger.cljs$core$IFn$_invoke$arity$2(G__70495,G__70496) : logseq.shui.ui.dropdown_menu_sub_trigger.call(null,G__70495,G__70496));
})();
var G__70494 = (function (){var G__70497 = (function (){var G__70498 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"hideWhenDetached","hideWhenDetached",1715341126),true,new cljs.core.Keyword(null,"onEscapeKeyDown","onEscapeKeyDown",1908839912),or_close_menu_sub_BANG_], null),sub_content_props], 0));
var G__70499 = ((cljs.core.fn_QMARK_(submenu_content__$1))?(function (){var G__70500 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"set-sub-open!","set-sub-open!",-2053118824),set_sub_open_BANG_,new cljs.core.Keyword(null,"id","id",-1388402092),id1], null);
return (submenu_content__$1.cljs$core$IFn$_invoke$arity$1 ? submenu_content__$1.cljs$core$IFn$_invoke$arity$1(G__70500) : submenu_content__$1.call(null,G__70500));
})():submenu_content__$1);
return (logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_sub_content.cljs$core$IFn$_invoke$arity$2(G__70498,G__70499) : logseq.shui.ui.dropdown_menu_sub_content.call(null,G__70498,G__70499));
})();
return (logseq.shui.ui.dropdown_menu_portal.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dropdown_menu_portal.cljs$core$IFn$_invoke$arity$1(G__70497) : logseq.shui.ui.dropdown_menu_portal.call(null,G__70497));
})();
return (logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_sub.cljs$core$IFn$_invoke$arity$3(G__70492,G__70493,G__70494) : logseq.shui.ui.dropdown_menu_sub.call(null,G__70492,G__70493,G__70494));
}):(function (p1__70485_SHARP_){
var G__70501 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-select","on-select",-192407950),(function (){
if(toggle_QMARK_){
var G__70503 = goog.dom.getElement(id2);
if((G__70503 == null)){
return null;
} else {
return G__70503.click();
}
} else {
return null;
}
}),new cljs.core.Keyword(null,"id","id",-1388402092),id1], null),item_props_SINGLEQUOTE_], 0));
var G__70502 = p1__70485_SHARP_;
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__70501,G__70502) : logseq.shui.ui.dropdown_menu_item.call(null,G__70501,G__70502));
}));
return daiquiri.interpreter.interpret(wrap_menuitem(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.inner-wrap.cursor-pointer","div.inner-wrap.cursor-pointer",2113192722),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),frontend.util.classnames(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_], null)], null))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.property-setting-title","div.property-setting-title",-1456152546),(function (){var G__70506 = icon;
var G__70506__$1 = (((G__70506 == null))?null:cljs.core.name(G__70506));
if((G__70506__$1 == null)){
return null;
} else {
return logseq.shui.ui.tabler_icon(G__70506__$1,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"size","size",1098693007),(14),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"-1"], null)], null));
}
})(),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),title], null),title], null)], null),((cljs.core.fn_QMARK_(desc))?(desc.cljs$core$IFn$_invoke$arity$0 ? desc.cljs$core$IFn$_invoke$arity$0() : desc.call(null)):((cljs.core.boolean_QMARK_(toggle_checked_QMARK_))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.scale-90.flex.items-center","span.scale-90.flex.items-center",-251362293),(function (){var f = (cljs.core.truth_(checkbox_QMARK_)?logseq.shui.ui.checkbox:logseq.shui.ui.switch$);
var G__70507 = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"id","id",-1388402092),id2,new cljs.core.Keyword(null,"size","size",1098693007),"sm",new cljs.core.Keyword(null,"checked","checked",-50955819),toggle_checked_QMARK_,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__70486_SHARP_){
return frontend.util.stop_propagation(p1__70486_SHARP_);
}),new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),(function (){var or__5002__auto__ = on_toggle_checked_change;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.identity;
}
})()], null);
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(G__70507) : f.call(null,G__70507));
})()], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label","label",1718410804),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),desc], null),(cljs.core.truth_(disabled_QMARK_)?logseq.shui.ui.tabler_icon("forbid-2",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null)):null)], null)
))], null)));
}),null,"frontend.components.property.config/dropdown-editor-menuitem");
frontend.components.property.config.choice_item_content = rum.core.lazy_build(rum.core.build_defc,(function (property,block,p__70513){
var map__70514 = p__70513;
var map__70514__$1 = cljs.core.__destructure_map(map__70514);
var disabled_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70514__$1,new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181));
var delete_choice_BANG_ = (function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.property.delete_closed_value_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block))),(function (___40947__auto__){
return promesa.protocols._promise(frontend.components.property.config.re_init_commands_BANG_(property));
}));
}));
});
var update_icon_BANG_ = (function (icon){
return frontend.handler.property.set_block_property_BANG_(frontend.state.get_current_repo(),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285),cljs.core.select_keys(icon,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"color","color",1011675173)], null)));
});
var icon = new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285).cljs$core$IFn$_invoke$arity$1(block);
var value = logseq.db.frontend.property.closed_value_content(block);
var attrs70512 = (function (){var G__70515 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"title","title",636505583),"Drag && Drop to reorder"], null);
var G__70516 = logseq.shui.ui.tabler_icon("grip-vertical",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__70515,G__70516) : logseq.shui.ui.button.call(null,G__70515,G__70516));
})();
return daiquiri.core.create_element("li",((cljs.core.map_QMARK_(attrs70512))?daiquiri.interpreter.element_attributes(attrs70512):null),((cljs.core.map_QMARK_(attrs70512))?[frontend.components.icon.icon_picker(icon,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (_e,icon__$1){
return update_icon_BANG_(icon__$1);
}),new cljs.core.Keyword(null,"popup-opts","popup-opts",-1667184839),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),"start"], null),new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362),cljs.core.boolean$(icon),new cljs.core.Keyword(null,"empty-label","empty-label",-288358384),"?",new cljs.core.Keyword(null,"button-opts","button-opts",1112045560),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),"Set Icon"], null)], null)),daiquiri.core.create_element("strong",{'onClick':(function (e){
var G__70517 = e.target;
var G__70518 = (function (){
return frontend.components.property.config.choice_base_edit_form(property,block);
});
var G__70519 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"ls-base-edit-form","ls-base-edit-form",602084072),new cljs.core.Keyword(null,"align","align",1964212802),"start"], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__70517,G__70518,G__70519) : logseq.shui.ui.popup_show_BANG_.call(null,G__70517,G__70518,G__70519));
})},[daiquiri.interpreter.interpret(value)]),daiquiri.interpreter.interpret((function (){var G__70536 = (function (){var G__70538 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),true,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_], null);
var G__70539 = (function (){var G__70540 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"title","title",636505583),"More settings"], null);
var G__70541 = logseq.shui.ui.tabler_icon("dots",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(16)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__70540,G__70541) : logseq.shui.ui.button.call(null,G__70540,G__70541));
})();
return (logseq.shui.ui.dropdown_menu_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_trigger.cljs$core$IFn$_invoke$arity$2(G__70538,G__70539) : logseq.shui.ui.dropdown_menu_trigger.call(null,G__70538,G__70539));
})();
var G__70537 = (function (){var G__70542 = (function (){var property_type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var property__$1 = (function (){var G__70544 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__70544) : frontend.db.sub_block.call(null,G__70544));
})();
var default_type_QMARK_ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"number","number",1570378438),null,new cljs.core.Keyword(null,"default","default",-1987822328),null], null), null),property_type);
var default_value = ((default_type_QMARK_)?new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662).cljs$core$IFn$_invoke$arity$1(property__$1):null);
var default_value_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(default_value),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
if(default_type_QMARK_){
var G__70545 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"default value",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var value__$1 = ((default_value_QMARK_)?null:new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property__$1),new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662),value__$1);
})], null);
var G__70546 = (function (){var G__70548 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),"default value",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"title","title",636505583),"Set as default choice",new cljs.core.Keyword(null,"class","class",-2030961996),"mr-1 opacity-50 hover:opacity-100",new cljs.core.Keyword(null,"checked","checked",-50955819),default_value_QMARK_], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__70548) : logseq.shui.ui.checkbox.call(null,G__70548));
})();
var G__70547 = "Set as default choice";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__70545,G__70546,G__70547) : logseq.shui.ui.dropdown_menu_item.call(null,G__70545,G__70546,G__70547));
} else {
return null;
}
})();
var G__70543 = (function (){var G__70549 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),"delete",new cljs.core.Keyword(null,"class","class",-2030961996),"del",new cljs.core.Keyword(null,"on-click","on-click",1632826543),delete_choice_BANG_], null);
var G__70550 = frontend.ui.icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"scale-90 pr-1 opacity-80"], null));
var G__70551 = "Delete";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__70549,G__70550,G__70551) : logseq.shui.ui.dropdown_menu_item.call(null,G__70549,G__70550,G__70551));
})();
return (logseq.shui.ui.dropdown_menu_content.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_content.cljs$core$IFn$_invoke$arity$2(G__70542,G__70543) : logseq.shui.ui.dropdown_menu_content.call(null,G__70542,G__70543));
})();
return (logseq.shui.ui.dropdown_menu.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu.cljs$core$IFn$_invoke$arity$2(G__70536,G__70537) : logseq.shui.ui.dropdown_menu.call(null,G__70536,G__70537));
})())]:[daiquiri.interpreter.interpret(attrs70512),frontend.components.icon.icon_picker(icon,new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),(function (_e,icon__$1){
return update_icon_BANG_(icon__$1);
}),new cljs.core.Keyword(null,"popup-opts","popup-opts",-1667184839),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),"start"], null),new cljs.core.Keyword(null,"del-btn?","del-btn?",-1094924362),cljs.core.boolean$(icon),new cljs.core.Keyword(null,"empty-label","empty-label",-288358384),"?",new cljs.core.Keyword(null,"button-opts","button-opts",1112045560),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),"Set Icon"], null)], null)),daiquiri.core.create_element("strong",{'onClick':(function (e){
var G__70552 = e.target;
var G__70553 = (function (){
return frontend.components.property.config.choice_base_edit_form(property,block);
});
var G__70554 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"ls-base-edit-form","ls-base-edit-form",602084072),new cljs.core.Keyword(null,"align","align",1964212802),"start"], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__70552,G__70553,G__70554) : logseq.shui.ui.popup_show_BANG_.call(null,G__70552,G__70553,G__70554));
})},[daiquiri.interpreter.interpret(value)]),daiquiri.interpreter.interpret((function (){var G__70571 = (function (){var G__70573 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"as-child","as-child",1364710342),true,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),disabled_QMARK_], null);
var G__70574 = (function (){var G__70575 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"title","title",636505583),"More settings"], null);
var G__70576 = logseq.shui.ui.tabler_icon("dots",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(16)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__70575,G__70576) : logseq.shui.ui.button.call(null,G__70575,G__70576));
})();
return (logseq.shui.ui.dropdown_menu_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_trigger.cljs$core$IFn$_invoke$arity$2(G__70573,G__70574) : logseq.shui.ui.dropdown_menu_trigger.call(null,G__70573,G__70574));
})();
var G__70572 = (function (){var G__70577 = (function (){var property_type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var property__$1 = (function (){var G__70579 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__70579) : frontend.db.sub_block.call(null,G__70579));
})();
var default_type_QMARK_ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"number","number",1570378438),null,new cljs.core.Keyword(null,"default","default",-1987822328),null], null), null),property_type);
var default_value = ((default_type_QMARK_)?new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662).cljs$core$IFn$_invoke$arity$1(property__$1):null);
var default_value_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(default_value),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
if(default_type_QMARK_){
var G__70580 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),"default value",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var value__$1 = ((default_value_QMARK_)?null:new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property__$1),new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662),value__$1);
})], null);
var G__70581 = (function (){var G__70583 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),"default value",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"title","title",636505583),"Set as default choice",new cljs.core.Keyword(null,"class","class",-2030961996),"mr-1 opacity-50 hover:opacity-100",new cljs.core.Keyword(null,"checked","checked",-50955819),default_value_QMARK_], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__70583) : logseq.shui.ui.checkbox.call(null,G__70583));
})();
var G__70582 = "Set as default choice";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__70580,G__70581,G__70582) : logseq.shui.ui.dropdown_menu_item.call(null,G__70580,G__70581,G__70582));
} else {
return null;
}
})();
var G__70578 = (function (){var G__70584 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),"delete",new cljs.core.Keyword(null,"class","class",-2030961996),"del",new cljs.core.Keyword(null,"on-click","on-click",1632826543),delete_choice_BANG_], null);
var G__70585 = frontend.ui.icon("x",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"scale-90 pr-1 opacity-80"], null));
var G__70586 = "Delete";
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$3(G__70584,G__70585,G__70586) : logseq.shui.ui.dropdown_menu_item.call(null,G__70584,G__70585,G__70586));
})();
return (logseq.shui.ui.dropdown_menu_content.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_content.cljs$core$IFn$_invoke$arity$2(G__70577,G__70578) : logseq.shui.ui.dropdown_menu_content.call(null,G__70577,G__70578));
})();
return (logseq.shui.ui.dropdown_menu.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu.cljs$core$IFn$_invoke$arity$2(G__70571,G__70572) : logseq.shui.ui.dropdown_menu.call(null,G__70571,G__70572));
})())]));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.property.config/choice-item-content");
frontend.components.property.config.add_existing_values = rum.core.lazy_build(rum.core.build_defc,(function (property,values,p__70587){
var map__70588 = p__70587;
var map__70588__$1 = cljs.core.__destructure_map(map__70588);
var toggle_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70588__$1,new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425));
return daiquiri.core.create_element("div",{'className':"flex flex-col gap-1 w-64 p-4 overflow-y-auto max-h-[50dvh]"},[daiquiri.core.create_element("div",null,["Existing values:"]),daiquiri.core.create_element("ol",null,[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$property$config$iter__70592(s__70593){
return (new cljs.core.LazySeq(null,(function (){
var s__70593__$1 = s__70593;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__70593__$1);
if(temp__5804__auto__){
var s__70593__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__70593__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__70593__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__70595 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__70594 = (0);
while(true){
if((i__70594 < size__5479__auto__)){
var value = cljs.core._nth(c__5478__auto__,i__70594);
cljs.core.chunk_append(b__70595,(function (){var attrs70591 = new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(value);
return daiquiri.core.create_element("li",((cljs.core.map_QMARK_(attrs70591))?daiquiri.interpreter.element_attributes(attrs70591):null),((cljs.core.map_QMARK_(attrs70591))?null:[daiquiri.interpreter.interpret(attrs70591)]));
})());

var G__70741 = (i__70594 + (1));
i__70594 = G__70741;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__70595),frontend$components$property$config$iter__70592(cljs.core.chunk_rest(s__70593__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__70595),null);
}
} else {
var value = cljs.core.first(s__70593__$2);
return cljs.core.cons((function (){var attrs70591 = new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(value);
return daiquiri.core.create_element("li",((cljs.core.map_QMARK_(attrs70591))?daiquiri.interpreter.element_attributes(attrs70591):null),((cljs.core.map_QMARK_(attrs70591))?null:[daiquiri.interpreter.interpret(attrs70591)]));
})(),frontend$components$property$config$iter__70592(cljs.core.rest(s__70593__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(values);
})())]),daiquiri.interpreter.interpret((function (){var G__70600 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.property.add_existing_values_to_closed_values_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__70602){
var map__70603 = p__70602;
var map__70603__$1 = cljs.core.__destructure_map(map__70603);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70603__$1,new cljs.core.Keyword(null,"value","value",305978217));
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(value);
}),values))),(function (_){
return promesa.protocols._promise((toggle_fn.cljs$core$IFn$_invoke$arity$0 ? toggle_fn.cljs$core$IFn$_invoke$arity$0() : toggle_fn.call(null)));
}));
}));
})], null);
var G__70601 = "Add choices";
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__70600,G__70601) : logseq.shui.ui.button.call(null,G__70600,G__70601));
})())]);
}),null,"frontend.components.property.config/add-existing-values");
frontend.components.property.config.choices_sub_pane = rum.core.lazy_build(rum.core.build_defc,(function (property,p__70614){
var map__70615 = p__70614;
var map__70615__$1 = cljs.core.__destructure_map(map__70615);
var opts = map__70615__$1;
var disabled_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70615__$1,new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181));
var values = new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property);
var choices = cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (value){
var G__70616 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__70616) : frontend.db.sub_block.call(null,G__70616));
}),values));
var choice_items = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
var id = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),cljs.core.str.cljs$core$IFn$_invoke$arity$1(id),new cljs.core.Keyword(null,"value","value",305978217),id,new cljs.core.Keyword(null,"content","content",15833224),frontend.components.property.config.choice_item_content(property,block,opts)], null);
}),choices);
var attrs70613 = ((cljs.core.seq(choices))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul.choices-list","ul.choices-list",434220868),frontend.components.dnd.items(choice_items,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"sort-by-inner-element?","sort-by-inner-element?",235482267),false,new cljs.core.Keyword(null,"on-drag-end","on-drag-end",520272671),(function (_,p__70617){
var map__70618 = p__70617;
var map__70618__$1 = cljs.core.__destructure_map(map__70618);
var active_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70618__$1,new cljs.core.Keyword(null,"active-id","active-id",-59238656));
var over_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70618__$1,new cljs.core.Keyword(null,"over-id","over-id",257293900));
var direction = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70618__$1,new cljs.core.Keyword(null,"direction","direction",-633359395));
var move_down_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,new cljs.core.Keyword(null,"down","down",1565245570));
var over = (function (){var G__70619 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(over_id)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__70619) : frontend.db.entity.call(null,G__70619));
})();
var active = (function (){var G__70620 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.uuid(active_id)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__70620) : frontend.db.entity.call(null,G__70620));
})();
var over_order = new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(over);
var new_order = ((move_down_QMARK_)?(function (){var next_order = logseq.db.common.order.get_next_order((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),property,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(over));
return logseq.db.common.order.gen_key(over_order,next_order);
})():(function (){var prev_order = logseq.db.common.order.get_prev_order((frontend.db.get_db.cljs$core$IFn$_invoke$arity$0 ? frontend.db.get_db.cljs$core$IFn$_invoke$arity$0() : frontend.db.get_db.call(null)),property,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(over));
return logseq.db.common.order.gen_key(prev_order,over_order);
})());
return frontend.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.state.get_current_repo(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(active),new cljs.core.Keyword("block","order","block/order",-1429282437),new_order], null),logseq.outliner.core.block_with_updated_at(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property)], null))], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
})], null))], null),(logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null))], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs70613))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["ls-property-dropdown","ls-property-choices-sub-pane"], null)], null),attrs70613], 0))):{'className':"ls-property-dropdown ls-property-choices-sub-pane"}),((cljs.core.map_QMARK_(attrs70613))?[(cljs.core.truth_(disabled_QMARK_)?null:frontend.components.property.config.dropdown_editor_menuitem(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"plus","plus",211540661),new cljs.core.Keyword(null,"title","title",636505583),"Add choice",new cljs.core.Keyword(null,"item-props","item-props",-1762062444),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_property_values.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentArrayMap.EMPTY], 0))),(function (values__$1){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property))),(function (existing_values){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.seq(existing_values))?(function (){var existing_ids = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),existing_values));
var existing_titles = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.property_value_content,existing_values));
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__70634){
var map__70635 = p__70634;
var map__70635__$1 = cljs.core.__destructure_map(map__70635);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70635__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70635__$1,new cljs.core.Keyword(null,"value","value",305978217));
var or__5002__auto__ = (function (){var G__70636 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value);
return (existing_ids.cljs$core$IFn$_invoke$arity$1 ? existing_ids.cljs$core$IFn$_invoke$arity$1(G__70636) : existing_ids.call(null,G__70636));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (existing_titles.cljs$core$IFn$_invoke$arity$1 ? existing_titles.cljs$core$IFn$_invoke$arity$1(label) : existing_titles.call(null,label));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return clojure.string.blank_QMARK_(label);
}
}
}),values__$1);
})():cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__70637){
var map__70638 = p__70637;
var map__70638__$1 = cljs.core.__destructure_map(map__70638);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70638__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var _value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70638__$1,new cljs.core.Keyword(null,"_value","_value",1295875052));
return clojure.string.blank_QMARK_(label);
}),values__$1))),(function (values_SINGLEQUOTE_){
return promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.seq(values_SINGLEQUOTE_))?frontend.db.async._LT_get_blocks(frontend.state.get_current_repo(),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__70640){
var map__70641 = p__70640;
var map__70641__$1 = cljs.core.__destructure_map(map__70641);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70641__$1,new cljs.core.Keyword(null,"value","value",305978217));
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value);
}),values__$1)):null)),(function (___40947__auto__){
return promesa.protocols._promise((function (){var G__70643 = e.target;
var G__70644 = (function (p__70646){
var map__70647 = p__70646;
var map__70647__$1 = cljs.core.__destructure_map(map__70647);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70647__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var opts__$1 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(id) : logseq.shui.ui.popup_hide_BANG_.call(null,id));
})], null);
if(cljs.core.seq(values_SINGLEQUOTE_)){
return frontend.components.property.config.add_existing_values(property,values_SINGLEQUOTE_,opts__$1);
} else {
return frontend.components.property.config.choice_base_edit_form(property,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"create?","create?",-1986446702),true], null));
}
});
var G__70645 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"ls-base-edit-form","ls-base-edit-form",602084072),new cljs.core.Keyword(null,"align","align",1964212802),"start"], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__70643,G__70644,G__70645) : logseq.shui.ui.popup_show_BANG_.call(null,G__70643,G__70644,G__70645));
})());
}));
})));
}));
}));
}));
}));
})], null)], null)))]:[daiquiri.interpreter.interpret(attrs70613),(cljs.core.truth_(disabled_QMARK_)?null:frontend.components.property.config.dropdown_editor_menuitem(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"plus","plus",211540661),new cljs.core.Keyword(null,"title","title",636505583),"Add choice",new cljs.core.Keyword(null,"item-props","item-props",-1762062444),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_property_values.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.PersistentArrayMap.EMPTY], 0))),(function (values__$1){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property))),(function (existing_values){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.seq(existing_values))?(function (){var existing_ids = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),existing_values));
var existing_titles = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.property_value_content,existing_values));
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__70661){
var map__70662 = p__70661;
var map__70662__$1 = cljs.core.__destructure_map(map__70662);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70662__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70662__$1,new cljs.core.Keyword(null,"value","value",305978217));
var or__5002__auto__ = (function (){var G__70663 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value);
return (existing_ids.cljs$core$IFn$_invoke$arity$1 ? existing_ids.cljs$core$IFn$_invoke$arity$1(G__70663) : existing_ids.call(null,G__70663));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (existing_titles.cljs$core$IFn$_invoke$arity$1 ? existing_titles.cljs$core$IFn$_invoke$arity$1(label) : existing_titles.call(null,label));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return clojure.string.blank_QMARK_(label);
}
}
}),values__$1);
})():cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__70664){
var map__70665 = p__70664;
var map__70665__$1 = cljs.core.__destructure_map(map__70665);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70665__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var _value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70665__$1,new cljs.core.Keyword(null,"_value","_value",1295875052));
return clojure.string.blank_QMARK_(label);
}),values__$1))),(function (values_SINGLEQUOTE_){
return promesa.protocols._promise(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(((cljs.core.seq(values_SINGLEQUOTE_))?frontend.db.async._LT_get_blocks(frontend.state.get_current_repo(),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__70666){
var map__70667 = p__70666;
var map__70667__$1 = cljs.core.__destructure_map(map__70667);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70667__$1,new cljs.core.Keyword(null,"value","value",305978217));
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value);
}),values__$1)):null)),(function (___40947__auto__){
return promesa.protocols._promise((function (){var G__70668 = e.target;
var G__70669 = (function (p__70672){
var map__70673 = p__70672;
var map__70673__$1 = cljs.core.__destructure_map(map__70673);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70673__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var opts__$1 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(id) : logseq.shui.ui.popup_hide_BANG_.call(null,id));
})], null);
if(cljs.core.seq(values_SINGLEQUOTE_)){
return frontend.components.property.config.add_existing_values(property,values_SINGLEQUOTE_,opts__$1);
} else {
return frontend.components.property.config.choice_base_edit_form(property,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"create?","create?",-1986446702),true], null));
}
});
var G__70670 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"ls-base-edit-form","ls-base-edit-form",602084072),new cljs.core.Keyword(null,"align","align",1964212802),"start"], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__70668,G__70669,G__70670) : logseq.shui.ui.popup_show_BANG_.call(null,G__70668,G__70669,G__70670));
})());
}));
})));
}));
}));
}));
}));
})], null)], null)))]));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.property.config/choices-sub-pane");
frontend.components.property.config.checkbox_state_mapping = rum.core.lazy_build(rum.core.build_defc,(function (choices){
var select_cp = (function (opts){
var G__70674 = opts;
var G__70675 = (function (){var G__70677 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"h-8"], null);
var G__70678 = (function (){var G__70679 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Select a choice"], null);
return (logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_value.cljs$core$IFn$_invoke$arity$1(G__70679) : logseq.shui.ui.select_value.call(null,G__70679));
})();
return (logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_trigger.cljs$core$IFn$_invoke$arity$2(G__70677,G__70678) : logseq.shui.ui.select_trigger.call(null,G__70677,G__70678));
})();
var G__70676 = (function (){var G__70680 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (choice){
var G__70681 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(choice)),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(choice)], null);
var G__70682 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(choice);
return (logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.select_item.cljs$core$IFn$_invoke$arity$2(G__70681,G__70682) : logseq.shui.ui.select_item.call(null,G__70681,G__70682));
}),choices);
return (logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.select_content.cljs$core$IFn$_invoke$arity$1(G__70680) : logseq.shui.ui.select_content.call(null,G__70680));
})();
return (logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.select.cljs$core$IFn$_invoke$arity$3(G__70674,G__70675,G__70676) : logseq.shui.ui.select.call(null,G__70674,G__70675,G__70676));
});
var checked_choice = cljs.core.some((function (choice){
if(new cljs.core.Keyword("logseq.property","choice-checkbox-state","logseq.property/choice-checkbox-state",-1272422863).cljs$core$IFn$_invoke$arity$1(choice) === true){
return choice;
} else {
return null;
}
}),choices);
var unchecked_choice = cljs.core.some((function (choice){
if(new cljs.core.Keyword("logseq.property","choice-checkbox-state","logseq.property/choice-checkbox-state",-1272422863).cljs$core$IFn$_invoke$arity$1(choice) === false){
return choice;
} else {
return null;
}
}),choices);
return daiquiri.core.create_element("div",{'className':"flex flex-col gap-4 text-sm p-2"},[daiquiri.core.create_element("div",{'className':"flex flex-col gap-2"},[daiquiri.core.create_element("div",null,["Map unchecked to"]),daiquiri.interpreter.interpret(select_cp((function (){var G__70688 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-value-change","on-value-change",-621835289),(function (value){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.property.set_block_property_BANG_(value,new cljs.core.Keyword("logseq.property","choice-checkbox-state","logseq.property/choice-checkbox-state",-1272422863),false)),(function (___40947__auto__){
return promesa.protocols._promise((cljs.core.truth_(unchecked_choice)?frontend.handler.db_based.property.remove_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(unchecked_choice),new cljs.core.Keyword("logseq.property","choice-checkbox-state","logseq.property/choice-checkbox-state",-1272422863)):null));
}));
}));
})], null);
if(cljs.core.truth_(unchecked_choice)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__70688,new cljs.core.Keyword(null,"default-value","default-value",232220170),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(unchecked_choice));
} else {
return G__70688;
}
})())),daiquiri.core.create_element("div",{'className':"mt-2"},["Map checked to"]),daiquiri.interpreter.interpret(select_cp((function (){var G__70690 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-value-change","on-value-change",-621835289),(function (value){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.property.set_block_property_BANG_(value,new cljs.core.Keyword("logseq.property","choice-checkbox-state","logseq.property/choice-checkbox-state",-1272422863),true)),(function (___40947__auto__){
return promesa.protocols._promise((cljs.core.truth_(checked_choice)?frontend.handler.db_based.property.remove_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(checked_choice),new cljs.core.Keyword("logseq.property","choice-checkbox-state","logseq.property/choice-checkbox-state",-1272422863)):null));
}));
}));
})], null);
if(cljs.core.truth_(checked_choice)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__70690,new cljs.core.Keyword(null,"default-value","default-value",232220170),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(checked_choice));
} else {
return G__70690;
}
})()))])]);
}),null,"frontend.components.property.config/checkbox-state-mapping");
frontend.components.property.config.position_labels = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"layout-distribute-horizontal","layout-distribute-horizontal",2032118826),new cljs.core.Keyword(null,"title","title",636505583),"Block properties"], null),new cljs.core.Keyword(null,"block-left","block-left",-1266158554),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"layout-align-right","layout-align-right",303903846),new cljs.core.Keyword(null,"title","title",636505583),"Beginning of the block"], null),new cljs.core.Keyword(null,"block-right","block-right",-1578897705),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"layout-align-left","layout-align-left",630094119),new cljs.core.Keyword(null,"title","title",636505583),"End of the block"], null),new cljs.core.Keyword(null,"block-below","block-below",1808846787),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"layout-align-top","layout-align-top",735656807),new cljs.core.Keyword(null,"title","title",636505583),"Below the block"], null)], null);
frontend.components.property.config.ui_position_sub_pane = rum.core.lazy_build(rum.core.build_defc,(function (property,p__70691){
var map__70692 = p__70691;
var map__70692__$1 = cljs.core.__destructure_map(map__70692);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70692__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var set_sub_open_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70692__$1,new cljs.core.Keyword(null,"set-sub-open!","set-sub-open!",-2053118824));
var _ui_position = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70692__$1,new cljs.core.Keyword(null,"_ui-position","_ui-position",1799231441));
var handle_select_BANG_ = (function (e){
var temp__5804__auto__ = (function (){var G__70693 = e.target;
var G__70693__$1 = (((G__70693 == null))?null:G__70693.dataset);
if((G__70693__$1 == null)){
return null;
} else {
return G__70693__$1.value;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var v = temp__5804__auto__;
frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","ui-position","logseq.property/ui-position",1869200864),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(v));

(set_sub_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sub_open_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_sub_open_BANG_.call(null,false));

return frontend.components.property.config.restore_root_highlight_item_BANG_(id);
} else {
return null;
}
});
var item_props = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-select","on-select",-192407950),handle_select_BANG_], null);
return daiquiri.core.create_element("div",{'className':"ls-property-dropdown ls-property-ui-position-sub-pane"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$property$config$iter__70694(s__70695){
return (new cljs.core.LazySeq(null,(function (){
var s__70695__$1 = s__70695;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__70695__$1);
if(temp__5804__auto__){
var s__70695__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__70695__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__70695__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__70697 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__70696 = (0);
while(true){
if((i__70696 < size__5479__auto__)){
var vec__70698 = cljs.core._nth(c__5478__auto__,i__70696);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70698,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70698,(1),null);
cljs.core.chunk_append(b__70697,(function (){var item_props__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(item_props,new cljs.core.Keyword(null,"data-value","data-value",-1897915206),k);
return frontend.components.property.config.dropdown_editor_menuitem(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(v,new cljs.core.Keyword(null,"item-props","item-props",-1762062444),item_props__$1));
})());

var G__70770 = (i__70696 + (1));
i__70696 = G__70770;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__70697),frontend$components$property$config$iter__70694(cljs.core.chunk_rest(s__70695__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__70697),null);
}
} else {
var vec__70701 = cljs.core.first(s__70695__$2);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70701,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70701,(1),null);
return cljs.core.cons((function (){var item_props__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(item_props,new cljs.core.Keyword(null,"data-value","data-value",-1897915206),k);
return frontend.components.property.config.dropdown_editor_menuitem(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(v,new cljs.core.Keyword(null,"item-props","item-props",-1762062444),item_props__$1));
})(),frontend$components$property$config$iter__70694(cljs.core.rest(s__70695__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(frontend.components.property.config.position_labels);
})())]);
}),null,"frontend.components.property.config/ui-position-sub-pane");
frontend.components.property.config.property_type_label = (function frontend$components$property$config$property_type_label(property_type){
var G__70704 = property_type;
var G__70704__$1 = (((G__70704 instanceof cljs.core.Keyword))?G__70704.fqn:null);
switch (G__70704__$1) {
case "default":
return "Text";

break;
case "datetime":
return "DateTime";

break;
default:
return cljs.core.comp.cljs$core$IFn$_invoke$arity$2(clojure.string.capitalize,cljs.core.name)(property_type);

}
});
frontend.components.property.config.handle_delete_property_BANG_ = (function frontend$components$property$config$handle_delete_property_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___70772 = arguments.length;
var i__5727__auto___70773 = (0);
while(true){
if((i__5727__auto___70773 < len__5726__auto___70772)){
args__5732__auto__.push((arguments[i__5727__auto___70773]));

var G__70774 = (i__5727__auto___70773 + (1));
i__5727__auto___70773 = G__70774;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.components.property.config.handle_delete_property_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.components.property.config.handle_delete_property_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (block,property,p__70708){
var map__70709 = p__70708;
var map__70709__$1 = cljs.core.__destructure_map(map__70709);
var class_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70709__$1,new cljs.core.Keyword(null,"class?","class?",385834571));
var class_schema_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70709__$1,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900));
var class_QMARK___$1 = (function (){var or__5002__auto__ = class_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.class_QMARK_.call(null,block));
}
})();
var remove_BANG_ = (function (){
var repo = frontend.state.get_current_repo();
if(cljs.core.truth_((function (){var and__5000__auto__ = class_QMARK___$1;
if(cljs.core.truth_(and__5000__auto__)){
return class_schema_QMARK_;
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.db_based.property.class_remove_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property));
} else {
return frontend.handler.property.remove_block_property_BANG_(repo,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
}
});
if(cljs.core.truth_((function (){var and__5000__auto__ = class_QMARK___$1;
if(cljs.core.truth_(and__5000__auto__)){
return class_schema_QMARK_;
} else {
return and__5000__auto__;
}
})())){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2((function (){var G__70710 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"Are you sure you want to delete the property from this tag?"], null);
var G__70711 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"delete-property-from-class","delete-property-from-class",-642796606),new cljs.core.Keyword(null,"data-reminder","data-reminder",1296338874),new cljs.core.Keyword(null,"ok","ok",967785236)], null);
return (logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$2(G__70710,G__70711) : logseq.shui.ui.dialog_confirm_BANG_.call(null,G__70710,G__70711));
})(),remove_BANG_);
} else {
return promesa.core.then.cljs$core$IFn$_invoke$arity$2((function (){var G__70712 = "Are you sure you want to delete the property from this node?";
var G__70713 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"delete-property-from-node","delete-property-from-node",1320027558),new cljs.core.Keyword(null,"data-reminder","data-reminder",1296338874),new cljs.core.Keyword(null,"ok","ok",967785236)], null);
return (logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$2(G__70712,G__70713) : logseq.shui.ui.dialog_confirm_BANG_.call(null,G__70712,G__70713));
})(),remove_BANG_);
}
}));

(frontend.components.property.config.handle_delete_property_BANG_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.components.property.config.handle_delete_property_BANG_.cljs$lang$applyTo = (function (seq70705){
var G__70706 = cljs.core.first(seq70705);
var seq70705__$1 = cljs.core.next(seq70705);
var G__70707 = cljs.core.first(seq70705__$1);
var seq70705__$2 = cljs.core.next(seq70705__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__70706,G__70707,seq70705__$2);
}));

frontend.components.property.config.property_type_sub_pane = rum.core.lazy_build(rum.core.build_defc,(function (property,p__70714){
var map__70715 = p__70714;
var map__70715__$1 = cljs.core.__destructure_map(map__70715);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70715__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var set_sub_open_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70715__$1,new cljs.core.Keyword(null,"set-sub-open!","set-sub-open!",-2053118824));
var _position = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70715__$1,new cljs.core.Keyword(null,"_position","_position",-1032999486));
var handle_select_BANG_ = (function (e){
var temp__5804__auto__ = (function (){var G__70716 = e.target;
var G__70716__$1 = (((G__70716 == null))?null:G__70716.dataset);
if((G__70716__$1 == null)){
return null;
} else {
return G__70716__$1.value;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var v = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.property.upsert_property_BANG_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(v)], null),cljs.core.PersistentArrayMap.EMPTY)),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((set_sub_open_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_sub_open_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_sub_open_BANG_.call(null,false))),(function (___40947__auto____$1){
return promesa.protocols._promise(frontend.components.property.config.restore_root_highlight_item_BANG_(id));
}));
}));
}));
} else {
return null;
}
});
var item_props = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-select","on-select",-192407950),handle_select_BANG_], null);
var schema_types = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (type){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),frontend.components.property.config.property_type_label(type),new cljs.core.Keyword(null,"value","value",305978217),type], null);
}),logseq.db.frontend.property.type.user_built_in_property_types);
return daiquiri.core.create_element("div",{'className':"ls-property-dropdown ls-property-type-sub-pane"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$property$config$iter__70717(s__70718){
return (new cljs.core.LazySeq(null,(function (){
var s__70718__$1 = s__70718;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__70718__$1);
if(temp__5804__auto__){
var s__70718__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__70718__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__70718__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__70720 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__70719 = (0);
while(true){
if((i__70719 < size__5479__auto__)){
var map__70721 = cljs.core._nth(c__5478__auto__,i__70719);
var map__70721__$1 = cljs.core.__destructure_map(map__70721);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70721__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70721__$1,new cljs.core.Keyword(null,"value","value",305978217));
cljs.core.chunk_append(b__70720,(function (){var option = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),label,new cljs.core.Keyword(null,"title","title",636505583),label,new cljs.core.Keyword(null,"desc","desc",2093485764),"",new cljs.core.Keyword(null,"item-props","item-props",-1762062444),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(item_props,new cljs.core.Keyword(null,"data-value","data-value",-1897915206),value)], null);
return frontend.components.property.config.dropdown_editor_menuitem(option);
})());

var G__70776 = (i__70719 + (1));
i__70719 = G__70776;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__70720),frontend$components$property$config$iter__70717(cljs.core.chunk_rest(s__70718__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__70720),null);
}
} else {
var map__70722 = cljs.core.first(s__70718__$2);
var map__70722__$1 = cljs.core.__destructure_map(map__70722);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70722__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70722__$1,new cljs.core.Keyword(null,"value","value",305978217));
return cljs.core.cons((function (){var option = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),label,new cljs.core.Keyword(null,"title","title",636505583),label,new cljs.core.Keyword(null,"desc","desc",2093485764),"",new cljs.core.Keyword(null,"item-props","item-props",-1762062444),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(item_props,new cljs.core.Keyword(null,"data-value","data-value",-1897915206),value)], null);
return frontend.components.property.config.dropdown_editor_menuitem(option);
})(),frontend$components$property$config$iter__70717(cljs.core.rest(s__70718__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(schema_types);
})())]);
}),null,"frontend.components.property.config/property-type-sub-pane");
frontend.components.property.config.default_value_subitem = rum.core.lazy_build(rum.core.build_defc,(function (property){
var property_type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var option = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),property_type))?(function (){var default_value = new cljs.core.Keyword("logseq.property","scalar-default-value","logseq.property/scalar-default-value",1595723014).cljs$core$IFn$_invoke$arity$1(property);
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"settings-2","settings-2",-602252974),new cljs.core.Keyword(null,"title","title",636505583),"Default value",new cljs.core.Keyword(null,"toggle-checked?","toggle-checked?",1549681434),cljs.core.boolean$(default_value),new cljs.core.Keyword(null,"checkbox?","checkbox?",2007099436),true,new cljs.core.Keyword(null,"on-toggle-checked-change","on-toggle-checked-change",644403327),(function (){
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","scalar-default-value","logseq.property/scalar-default-value",1595723014),cljs.core.not(default_value));
})], null);
})():(function (){var default_value = new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662).cljs$core$IFn$_invoke$arity$1(property);
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"settings-2","settings-2",-602252974),new cljs.core.Keyword(null,"title","title",636505583),"Default value",new cljs.core.Keyword(null,"desc","desc",2093485764),(cljs.core.truth_(default_value)?logseq.db.frontend.property.property_value_content(default_value):"Set value"),new cljs.core.Keyword(null,"submenu-content","submenu-content",-1896531140),(function (){
return frontend.components.property.default_value.default_value_config(property);
})], null);
})());
return frontend.components.property.config.dropdown_editor_menuitem(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(option,new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),frontend.config.publishing_QMARK_));
}),null,"frontend.components.property.config/default-value-subitem");
/**
 * property: block entity
 */
frontend.components.property.config.property_dropdown_options = (function frontend$components$property$config$property_dropdown_options(property,owner_block,values,p__70724){
var map__70725 = p__70724;
var map__70725__$1 = cljs.core.__destructure_map(map__70725);
var class_schema_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70725__$1,new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900));
var debug_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70725__$1,new cljs.core.Keyword(null,"debug?","debug?",-1831756173));
var with_title_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__70725__$1,new cljs.core.Keyword(null,"with-title?","with-title?",-1110963321),true);
var more_options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70725__$1,new cljs.core.Keyword(null,"more-options","more-options",1399478268));
var title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property);
var property_type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var property_type_label_SINGLEQUOTE_ = (function (){var G__70726 = property_type;
if((G__70726 == null)){
return null;
} else {
return frontend.components.property.config.property_type_label(G__70726);
}
})();
var enable_closed_values_QMARK_ = cljs.core.contains_QMARK_(logseq.db.frontend.property.type.closed_value_property_types,(function (){var or__5002__auto__ = property_type;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"default","default",-1987822328);
}
})());
var icon = new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285).cljs$core$IFn$_invoke$arity$1(property);
var icon__$1 = (cljs.core.truth_(icon)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.float-left.w-4.h-4.overflow-hidden.leading-4.relative","span.float-left.w-4.h-4.overflow-hidden.leading-4.relative",2244377),frontend.components.icon.icon.cljs$core$IFn$_invoke$arity$variadic(icon,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null)], 0))], null):null);
var built_in_QMARK_ = (logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(property) : logseq.db.built_in_QMARK_.call(null,property));
var disabled_QMARK_ = (function (){var or__5002__auto__ = built_in_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.config.publishing_QMARK_;
}
})();
var class_schema_QMARK___$1 = (function (){var and__5000__auto__ = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(owner_block) : logseq.db.class_QMARK_.call(null,owner_block));
if(cljs.core.truth_(and__5000__auto__)){
return class_schema_QMARK_;
} else {
return and__5000__auto__;
}
})();
var special_built_in_prop_QMARK_ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),null,new cljs.core.Keyword("block","created-at","block/created-at",1440015),null,new cljs.core.Keyword("block","tags","block/tags",1814948340),null,new cljs.core.Keyword("block","title","block/title",710445684),null], null), null),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
return cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(more_options,new cljs.core.PersistentVector(null, 13, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_(with_title_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3.font-medium.px-2.py-4.opacity-90.flex.items-center.gap-1","h3.font-medium.px-2.py-4.opacity-90.flex.items-center.gap-1",1983042018),logseq.shui.ui.tabler_icon("adjustments-alt"),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Configure property"], null)], null):null),((special_built_in_prop_QMARK_)?null:frontend.components.property.config.dropdown_editor_menuitem(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"pencil","pencil",-217778832),new cljs.core.Keyword(null,"title","title",636505583),"Property name",new cljs.core.Keyword(null,"desc","desc",2093485764),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1","span.flex.items-center.gap-1",-111995724),icon__$1,title], null),new cljs.core.Keyword(null,"submenu-content","submenu-content",-1896531140),(function (ops){
return frontend.components.property.config.name_edit_pane(property,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ops,new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),disabled_QMARK_));
})], null))),(function (){var disabled_QMARK__SINGLEQUOTE_ = (function (){var or__5002__auto__ = disabled_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = property_type;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(values);
} else {
return and__5000__auto__;
}
}
})();
return frontend.components.property.config.dropdown_editor_menuitem(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"letter-t","letter-t",-1315844495),new cljs.core.Keyword(null,"title","title",636505583),"Property type",new cljs.core.Keyword(null,"desc","desc",2093485764),(cljs.core.truth_(disabled_QMARK__SINGLEQUOTE_)?frontend.ui.tooltip(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),cljs.core.str.cljs$core$IFn$_invoke$arity$1(property_type_label_SINGLEQUOTE_)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.w-96","div.w-96",-1620230049),"The type of this property is locked once you start using it. This is to make sure all your existing information stays correct if the property type is changed later. To unlock, all uses of a property must be deleted."], null)):cljs.core.str.cljs$core$IFn$_invoke$arity$1(property_type_label_SINGLEQUOTE_)),new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),disabled_QMARK__SINGLEQUOTE_,new cljs.core.Keyword(null,"submenu-content","submenu-content",-1896531140),(function (ops){
return frontend.components.property.config.property_type_sub_pane(property,ops);
})], null));
})(),((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_type,new cljs.core.Keyword(null,"node","node",581201198))) && ((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),null], null), null),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property)))))))?frontend.components.property.config.dropdown_editor_menuitem(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"hash","hash",-13781596),new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),disabled_QMARK_,new cljs.core.Keyword(null,"title","title",636505583),"Specify node tags",new cljs.core.Keyword(null,"desc","desc",2093485764),"",new cljs.core.Keyword(null,"submenu-content","submenu-content",-1896531140),(function (_ops){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.px-4","div.px-4",472594622),frontend.components.property.config.class_select(property,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"default-open?","default-open?",-2082763144),false], null))], null);
})], null)):null),((((cljs.core.contains_QMARK_(logseq.db.frontend.property.type.default_value_ref_property_types,property_type)) && ((((!(logseq.db.frontend.property.many_QMARK_(property)))) && ((((!(((enable_closed_values_QMARK_) && (cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property))))))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","enable-history?","logseq.property/enable-history?",-805859602),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property)))))))))?frontend.components.property.config.default_value_subitem(property):null),((enable_closed_values_QMARK_)?(function (){var values__$1 = new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property);
return frontend.components.property.config.dropdown_editor_menuitem(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"list","list",765357683),new cljs.core.Keyword(null,"title","title",636505583),"Available choices",new cljs.core.Keyword(null,"desc","desc",2093485764),((cljs.core.seq(values__$1))?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(values__$1))," choices"].join(''):null),new cljs.core.Keyword(null,"submenu-content","submenu-content",-1896531140),(function (){
return frontend.components.property.config.choices_sub_pane(property,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),frontend.config.publishing_QMARK_], null));
})], null));
})():null),((enable_closed_values_QMARK_)?(function (){var values__$1 = new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property);
if((cljs.core.count(values__$1) >= (2))){
return frontend.components.property.config.dropdown_editor_menuitem(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),new cljs.core.Keyword(null,"title","title",636505583),"Checkbox state mapping",new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),frontend.config.publishing_QMARK_,new cljs.core.Keyword(null,"submenu-content","submenu-content",-1896531140),(function (){
return frontend.components.property.config.checkbox_state_mapping(values__$1);
})], null));
} else {
return null;
}
})():null),((((cljs.core.contains_QMARK_(logseq.db.frontend.property.type.cardinality_property_types,property_type)) && (cljs.core.not(disabled_QMARK_))))?(function (){var many_QMARK_ = logseq.db.frontend.property.many_QMARK_(property);
return frontend.components.property.config.dropdown_editor_menuitem(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"checks","checks",526134637),new cljs.core.Keyword(null,"title","title",636505583),"Multiple values",new cljs.core.Keyword(null,"toggle-checked?","toggle-checked?",1549681434),many_QMARK_,new cljs.core.Keyword(null,"on-toggle-checked-change","on-toggle-checked-change",644403327),(function (){
var update_cardinality_fn = (function (){
return frontend.handler.db_based.property.upsert_property_BANG_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),((many_QMARK_)?new cljs.core.Keyword(null,"one","one",935007904):new cljs.core.Keyword(null,"many","many",1092119164))], null),cljs.core.PersistentArrayMap.EMPTY);
});
if(((cljs.core.seq(values)) && ((!(many_QMARK_))))){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2((logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$1("This action cannot be undone. Do you want to change this property to have multiple values?") : logseq.shui.ui.dialog_confirm_BANG_.call(null,"This action cannot be undone. Do you want to change this property to have multiple values?")),update_cardinality_fn);
} else {
return update_cardinality_fn();
}
})], null));
})():null),((((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","enable-history?","logseq.property/enable-history?",-805859602),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property))) && ((!(special_built_in_prop_QMARK_)))))?(function (){var property_type__$1 = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var group_SINGLEQUOTE_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [(((((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050),null,new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),null], null), null),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property))))) && (((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"date","date",-1463434462),null,new cljs.core.Keyword(null,"number","number",1570378438),null,new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),null,new cljs.core.Keyword(null,"default","default",-1987822328),null,new cljs.core.Keyword(null,"node","node",581201198),null], null), null),property_type__$1)) && ((!(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),property_type__$1)) && (((cljs.core.empty_QMARK_(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property))) && (cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [null,null,new cljs.core.Keyword(null,"properties","properties",685819552),null], null), null),new cljs.core.Keyword("logseq.property","ui-position","logseq.property/ui-position",1869200864).cljs$core$IFn$_invoke$arity$1(property)))))))))))))?(function (){var position = new cljs.core.Keyword("logseq.property","ui-position","logseq.property/ui-position",1869200864).cljs$core$IFn$_invoke$arity$1(property);
return frontend.components.property.config.dropdown_editor_menuitem(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"float-left","float-left",915788932),new cljs.core.Keyword(null,"title","title",636505583),"UI position",new cljs.core.Keyword(null,"desc","desc",2093485764),(function (){var G__70727 = position;
var G__70727__$1 = (((G__70727 == null))?null:cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.components.property.config.position_labels,G__70727));
if((G__70727__$1 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(G__70727__$1);
}
})(),new cljs.core.Keyword(null,"item-props","item-props",-1762062444),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ui__position-trigger-item"], null),new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),frontend.config.publishing_QMARK_,new cljs.core.Keyword(null,"submenu-content","submenu-content",-1896531140),(function (ops){
return frontend.components.property.config.ui_position_sub_pane(property,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ops,new cljs.core.Keyword(null,"ui-position","ui-position",1013600792),position));
})], null));
})():null),(((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050),null,new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),null], null), null),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property)))))?frontend.components.property.config.dropdown_editor_menuitem(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"eye-off","eye-off",-2132727922),new cljs.core.Keyword(null,"title","title",636505583),"Hide by default",new cljs.core.Keyword(null,"toggle-checked?","toggle-checked?",1549681434),cljs.core.boolean$(new cljs.core.Keyword("logseq.property","hide?","logseq.property/hide?",68365746).cljs$core$IFn$_invoke$arity$1(property)),new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),frontend.config.publishing_QMARK_,new cljs.core.Keyword(null,"on-toggle-checked-change","on-toggle-checked-change",644403327),(function (p1__70723_SHARP_){
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","hide?","logseq.property/hide?",68365746),p1__70723_SHARP_);
})], null)):null),(((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050),null,new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),null], null), null),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property)))))?frontend.components.property.config.dropdown_editor_menuitem(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"eye-off","eye-off",-2132727922),new cljs.core.Keyword(null,"title","title",636505583),"Hide empty value",new cljs.core.Keyword(null,"toggle-checked?","toggle-checked?",1549681434),cljs.core.boolean$(new cljs.core.Keyword("logseq.property","hide-empty-value","logseq.property/hide-empty-value",2062325899).cljs$core$IFn$_invoke$arity$1(property)),new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),frontend.config.publishing_QMARK_,new cljs.core.Keyword(null,"on-toggle-checked-change","on-toggle-checked-change",644403327),(function (){
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","hide-empty-value","logseq.property/hide-empty-value",2062325899),cljs.core.not(new cljs.core.Keyword("logseq.property","hide-empty-value","logseq.property/hide-empty-value",2062325899).cljs$core$IFn$_invoke$arity$1(property)));
})], null)):null)], null));
if((cljs.core.count(group_SINGLEQUOTE_) > (0))){
return cljs.core.cons((logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null)),group_SINGLEQUOTE_);
} else {
return null;
}
})():null),(cljs.core.truth_((function (){var and__5000__auto__ = owner_block;
if(cljs.core.truth_(and__5000__auto__)){
return (!(special_built_in_prop_QMARK_));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),(logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null)),frontend.components.property.config.dropdown_editor_menuitem(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"share-3","share-3",221428101),new cljs.core.Keyword(null,"title","title",636505583),"Go to this property",new cljs.core.Keyword(null,"desc","desc",2093485764),"",new cljs.core.Keyword(null,"item-props","item-props",-1762062444),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-90 focus:opacity-100",new cljs.core.Keyword(null,"on-select","on-select",-192407950),(function (){
(logseq.shui.ui.popup_hide_all_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_all_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_all_BANG_.call(null));

return frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(property));
})], null)], null))], null):null),(cljs.core.truth_((function (){var and__5000__auto__ = enable_closed_values_QMARK_;
if(and__5000__auto__){
return owner_block;
} else {
return and__5000__auto__;
}
})())?(function (){var values__$1 = new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property);
if((cljs.core.count(values__$1) >= (2))){
var checked_QMARK_ = cljs.core.contains_QMARK_(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("logseq.property","checkbox-display-properties","logseq.property/checkbox-display-properties",-321532569).cljs$core$IFn$_invoke$arity$1(owner_block))),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property));
return frontend.components.property.config.dropdown_editor_menuitem(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),new cljs.core.Keyword(null,"title","title",636505583),(cljs.core.truth_(class_schema_QMARK___$1)?"Show as checkbox on tagged nodes":"Show as checkbox on node"),new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),frontend.config.publishing_QMARK_,new cljs.core.Keyword(null,"desc","desc",2093485764),(cljs.core.truth_(owner_block)?(function (){var G__70728 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),"show as checkbox",new cljs.core.Keyword(null,"size","size",1098693007),"sm",new cljs.core.Keyword(null,"checked","checked",-50955819),checked_QMARK_,new cljs.core.Keyword(null,"on-click","on-click",1632826543),frontend.util.stop_propagation,new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),(function (value){
if(cljs.core.truth_(value)){
return frontend.handler.db_based.property.set_block_property_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(owner_block),new cljs.core.Keyword("logseq.property","checkbox-display-properties","logseq.property/checkbox-display-properties",-321532569),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property));
} else {
return frontend.handler.db_based.property.delete_property_value_BANG_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(owner_block),new cljs.core.Keyword("logseq.property","checkbox-display-properties","logseq.property/checkbox-display-properties",-321532569),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property));
}
})], null);
return (logseq.shui.ui.switch$.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.switch$.cljs$core$IFn$_invoke$arity$1(G__70728) : logseq.shui.ui.switch$.call(null,G__70728));
})():null)], null));
} else {
return null;
}
})():null),(cljs.core.truth_((function (){var and__5000__auto__ = owner_block;
if(cljs.core.truth_(and__5000__auto__)){
if(cljs.core.truth_(class_schema_QMARK___$1)){
return cljs.core.contains_QMARK_(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050).cljs$core$IFn$_invoke$arity$1(owner_block))),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property));
} else {
return (!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),null], null), null),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property))));
}
} else {
return and__5000__auto__;
}
})())?frontend.components.property.config.dropdown_editor_menuitem(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"delete-property","delete-property",-1427299768),new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"x","x",2099068185),new cljs.core.Keyword(null,"title","title",636505583),(cljs.core.truth_(class_schema_QMARK___$1)?"Delete property from tag":"Delete property from node"),new cljs.core.Keyword(null,"desc","desc",2093485764),"",new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),false,new cljs.core.Keyword(null,"item-props","item-props",-1762062444),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-60 focus:!text-red-rx-09 focus:opacity-100",new cljs.core.Keyword(null,"on-select","on-select",-192407950),(function (e){
frontend.util.stop(e);

return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.components.property.config.handle_delete_property_BANG_.cljs$core$IFn$_invoke$arity$variadic(owner_block,property,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class-schema?","class-schema?",508813900),class_schema_QMARK___$1], null)], 0))),(function (___40947__auto__){
return promesa.protocols._promise((logseq.shui.ui.popup_hide_all_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_all_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_all_BANG_.call(null)));
}));
})),(function (){
return frontend.components.property.config.restore_root_highlight_item_BANG_(new cljs.core.Keyword(null,"delete-property","delete-property",-1427299768));
}));
})], null)], null)):null),(cljs.core.truth_(debug_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),(logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null)),frontend.components.property.config.dropdown_editor_menuitem(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword(null,"bug","bug",51265549),new cljs.core.Keyword(null,"title","title",636505583),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property)),new cljs.core.Keyword(null,"desc","desc",2093485764),"",new cljs.core.Keyword(null,"disabled?","disabled?",-1523234181),false,new cljs.core.Keyword(null,"item-props","item-props",-1762062444),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-60 focus:opacity-100 focus:!text-red-rx-08",new cljs.core.Keyword(null,"on-select","on-select",-192407950),(function (){
frontend.handler.common.developer.show_entity_data(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property));

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null)], null))], null):null)], null)));
});
frontend.components.property.config.property_dropdown = rum.core.lazy_build(rum.core.build_defcs,(function (state,property_STAR_,owner_block,opts){
var property = (function (){var G__70729 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property_STAR_);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__70729) : frontend.db.sub_block.call(null,G__70729));
})();
var owner_block__$1 = (cljs.core.truth_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(owner_block))?(function (){var G__70730 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(owner_block);
return (frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1 ? frontend.db.sub_block.cljs$core$IFn$_invoke$arity$1(G__70730) : frontend.db.sub_block.call(null,G__70730));
})():null);
var values = rum.core.react(new cljs.core.Keyword("frontend.components.property.config","values","frontend.components.property.config/values",-1610461519).cljs$core$IFn$_invoke$arity$1(state));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"loading","loading",-737050189),values)){
return null;
} else {
return daiquiri.interpreter.interpret(cljs.core.vec(cljs.core.cons(new cljs.core.Keyword(null,"<>","<>",1280186386),frontend.components.property.config.property_dropdown_options(property,owner_block__$1,values,opts))));
}
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var _STAR_values = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"loading","loading",-737050189));
var property = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
var ident = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property);
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_property_values(ident)),(function (result){
return promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_values,result));
}));
}));

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.components.property.config","values","frontend.components.property.config/values",-1610461519),_STAR_values);
})], null)], null),"frontend.components.property.config/property-dropdown");

//# sourceMappingURL=frontend.components.property.config.js.map
