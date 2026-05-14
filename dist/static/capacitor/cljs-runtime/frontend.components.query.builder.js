goog.provide('frontend.components.query.builder');
frontend.components.query.builder.page_block_selector = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_find){
return daiquiri.core.create_element("div",{'onPointerDown':(function (e){
return frontend.util.stop_propagation(e);
}),'className':"filter-item"},[frontend.ui.select(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"label","label",1718410804),"Blocks",new cljs.core.Keyword(null,"value","value",305978217),"block",new cljs.core.Keyword(null,"selected","selected",574897764),cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_find),new cljs.core.Keyword(null,"page","page",849072397))], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"label","label",1718410804),"Pages",new cljs.core.Keyword(null,"value","value",305978217),"page",new cljs.core.Keyword(null,"selected","selected",574897764),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_find),new cljs.core.Keyword(null,"page","page",849072397))], null)], null),(function (e,v){
frontend.util.stop(e);

return cljs.core.reset_BANG_(_STAR_find,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(v));
}))]);
}),null,"frontend.components.query.builder/page-block-selector");
frontend.components.query.builder.select = (function frontend$components$query$builder$select(var_args){
var G__70736 = arguments.length;
switch (G__70736) {
case 2:
return frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$2 = (function (items,on_chosen){
return frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$3(items,on_chosen,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$3 = (function (items,on_chosen,options){
return frontend.components.select.select(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"items","items",1031954938),((cljs.core.map_QMARK_(cljs.core.first(items)))?items:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__70734_SHARP_){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"value","value",305978217)],[p1__70734_SHARP_]);
}),items)),new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),on_chosen], null),options], 0)));
}));

(frontend.components.query.builder.select.cljs$lang$maxFixedArity = 3);

frontend.components.query.builder.append_tree_BANG_ = (function frontend$components$query$builder$append_tree_BANG_(_STAR_tree,p__70738,loc,x){
var map__70739 = p__70738;
var map__70739__$1 = cljs.core.__destructure_map(map__70739);
var toggle_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70739__$1,new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425));
var toggle_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__70739__$1,new cljs.core.Keyword(null,"toggle?","toggle?",-664005476),true);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_tree,(function (p1__70737_SHARP_){
return frontend.handler.query.builder.append_element(p1__70737_SHARP_,loc,x);
}));

if(cljs.core.truth_(toggle_QMARK_)){
return (toggle_fn.cljs$core$IFn$_invoke$arity$0 ? toggle_fn.cljs$core$IFn$_invoke$arity$0() : toggle_fn.call(null));
} else {
return null;
}
});
frontend.components.query.builder.search = rum.core.lazy_build(rum.core.build_defcs,(function (state,_on_submit,_on_cancel){
var _STAR_input_value = new cljs.core.Keyword("frontend.components.query.builder","input-value","frontend.components.query.builder/input-value",-953596856).cljs$core$IFn$_invoke$arity$1(state);
return daiquiri.core.create_element("input",{'id':"query-builder-search",'autoFocus':true,'placeholder':"Full text search",'aria-label':"Full text search",'onChange':rum.core.mark_sync_update((function (p1__70740_SHARP_){
return cljs.core.reset_BANG_(_STAR_input_value,frontend.util.evalue(p1__70740_SHARP_));
})),'className':"form-input block sm:text-sm sm:leading-5"},[]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.query.builder","input-value","frontend.components.query.builder/input-value",-953596856)),frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$1((function (state){
return frontend.mixins.on_key_down.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.PersistentArrayMap(null, 2, [(13),(function (state__$1,e){
var input_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state__$1,new cljs.core.Keyword("frontend.components.query.builder","input-value","frontend.components.query.builder/input-value",-953596856));
if(clojure.string.blank_QMARK_(cljs.core.deref(input_value))){
return null;
} else {
frontend.util.stop(e);

var on_submit_71079 = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state__$1));
var G__70742_71080 = cljs.core.deref(input_value);
(on_submit_71079.cljs$core$IFn$_invoke$arity$1 ? on_submit_71079.cljs$core$IFn$_invoke$arity$1(G__70742_71080) : on_submit_71079.call(null,G__70742_71080));

return cljs.core.reset_BANG_(input_value,null);
}
}),(27),(function (_state,_e){
var vec__70743 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var _on_submit = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70743,(0),null);
var on_cancel = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70743,(1),null);
return (on_cancel.cljs$core$IFn$_invoke$arity$0 ? on_cancel.cljs$core$IFn$_invoke$arity$0() : on_cancel.call(null));
})], null));
}))], null),"frontend.components.query.builder/search");
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.query !== 'undefined') && (typeof frontend.components.query.builder !== 'undefined') && (typeof frontend.components.query.builder._STAR_between_dates !== 'undefined')){
} else {
frontend.components.query.builder._STAR_between_dates = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
frontend.components.query.builder.datepicker = rum.core.lazy_build(rum.core.build_defcs,(function (state,id,placeholder,p__70746){
var map__70747 = p__70746;
var map__70747__$1 = cljs.core.__destructure_map(map__70747);
var on_select = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70747__$1,new cljs.core.Keyword(null,"on-select","on-select",-192407950));
var _STAR_input_value = new cljs.core.Keyword("frontend.components.query.builder","input-value","frontend.components.query.builder/input-value",-953596856).cljs$core$IFn$_invoke$arity$1(state);
return daiquiri.interpreter.interpret((function (){var G__70755 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"secondary","secondary",-669381460),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__70757 = e.target;
var G__70758 = (function (){var select_handle_BANG_ = (function (d){
var gd_71082 = frontend.date.js_date__GT_goog_date(d);
var journal_date_71083 = frontend.date.js_date__GT_journal_title(gd_71082);
cljs.core.reset_BANG_(_STAR_input_value,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [journal_date_71083,d], null));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.components.query.builder._STAR_between_dates,cljs.core.assoc,id,journal_date_71083);

var G__70760_71084 = on_select;
if((G__70760_71084 == null)){
} else {
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__70760_71084,cljs.core.PersistentVector.EMPTY);
}

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
});
return frontend.ui.single_calendar(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"initial-focus","initial-focus",1154999719),false,new cljs.core.Keyword(null,"selected","selected",574897764),(function (){var G__70761 = cljs.core.deref(_STAR_input_value);
if((G__70761 == null)){
return null;
} else {
return cljs.core.second(G__70761);
}
})(),new cljs.core.Keyword(null,"on-select","on-select",-192407950),select_handle_BANG_], null));
})();
var G__70759 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"query-datepicker","query-datepicker",1707199171),new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"p-0"], null),new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__70757,G__70758,G__70759) : logseq.shui.ui.popup_show_BANG_.call(null,G__70757,G__70758,G__70759));
})], null);
var G__70756 = (function (){var or__5002__auto__ = cljs.core.first(cljs.core.deref(_STAR_input_value));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return placeholder;
}
})();
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__70755,G__70756) : logseq.shui.ui.button.call(null,G__70755,G__70756));
})());
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.query.builder","input-value","frontend.components.query.builder/input-value",-953596856)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.components.query.builder._STAR_between_dates,cljs.core.dissoc,cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)));

return state;
})], null)], null),"frontend.components.query.builder/datepicker");
frontend.components.query.builder.between = rum.core.lazy_build(rum.core.build_defcs,(function (state,p__70762){
var map__70763 = p__70762;
var map__70763__$1 = cljs.core.__destructure_map(map__70763);
var opts = map__70763__$1;
var tree = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70763__$1,new cljs.core.Keyword(null,"tree","tree",-196312028));
var loc = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70763__$1,new cljs.core.Keyword(null,"loc","loc",-584284901));
return daiquiri.core.create_element("div",{'onPointerDown':(function (e){
return frontend.util.stop_propagation(e);
}),'className':"between-date p-4"},[daiquiri.core.create_element("div",{'className':"flex flex-row items-center gap-2"},[daiquiri.core.create_element("div",{'className':"font-medium"},["Between: "]),frontend.components.query.builder.datepicker(new cljs.core.Keyword(null,"start","start",-355208981),"Start date",cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-select","on-select",-192407950),(function (){
var temp__5804__auto__ = document.querySelector(".query-builder-datepicker[data-key=end]");
if(cljs.core.truth_(temp__5804__auto__)){
var end_input = temp__5804__auto__;
if(clojure.string.blank_QMARK_(end_input.value)){
return end_input.focus();
} else {
return null;
}
} else {
return null;
}
})], null)], 0))),frontend.components.query.builder.datepicker(new cljs.core.Keyword(null,"end","end",-268185958),"End date",opts)]),(function (){var attrs70766 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Submit",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var map__70769 = cljs.core.deref(frontend.components.query.builder._STAR_between_dates);
var map__70769__$1 = cljs.core.__destructure_map(map__70769);
var start = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70769__$1,new cljs.core.Keyword(null,"start","start",-355208981));
var end = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70769__$1,new cljs.core.Keyword(null,"end","end",-268185958));
if(cljs.core.truth_((function (){var and__5000__auto__ = start;
if(cljs.core.truth_(and__5000__auto__)){
return end;
} else {
return and__5000__auto__;
}
})())){
var clause = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"between","between",1131099276),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151),start], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151),end], null)], null);
frontend.components.query.builder.append_tree_BANG_(tree,opts,loc,clause);

return cljs.core.reset_BANG_(frontend.components.query.builder._STAR_between_dates,cljs.core.PersistentArrayMap.EMPTY);
} else {
return null;
}
})], 0));
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs70766))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pt-2"], null)], null),attrs70766], 0))):{'className':"pt-2"}),((cljs.core.map_QMARK_(attrs70766))?null:[daiquiri.interpreter.interpret(attrs70766)]));
})()]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.query.builder","start","frontend.components.query.builder/start",997146870)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.query.builder","end","frontend.components.query.builder/end",-1534550361))], null),"frontend.components.query.builder/between");
frontend.components.query.builder.property_select = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_mode,_STAR_property,_STAR_private_property_QMARK_){
var vec__70777 = rum.core.use_state(null);
var properties = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70777,(0),null);
var set_properties_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70777,(1),null);
var properties__$1 = (function (){var G__70780 = properties;
if(cljs.core.not(cljs.core.deref(_STAR_private_property_QMARK_))){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.built_in_QMARK_,G__70780);
} else {
return G__70780;
}
})();
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_all_properties.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"remove-built-in-property?","remove-built-in-property?",454663723),false,new cljs.core.Keyword(null,"remove-non-queryable-built-in-property?","remove-non-queryable-built-in-property?",1219338536),true], null)], 0))),(function (properties__$2){
return promesa.protocols._promise((set_properties_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_properties_BANG_.cljs$core$IFn$_invoke$arity$1(properties__$2) : set_properties_BANG_.call(null,properties__$2)));
}));
}));
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'className':"flex flex-col gap-1"},[daiquiri.core.create_element("div",{'className':"flex flex-row justify-between gap-1 items-center px-1 pb-1 border-b"},[daiquiri.core.create_element("label",{'className':"opacity-50 cursor select-none text-sm",'htmlFor':"built-in"},["Show built-in properties"]),daiquiri.interpreter.interpret((function (){var G__70791 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),"built-in",new cljs.core.Keyword(null,"value","value",305978217),cljs.core.deref(_STAR_private_property_QMARK_),new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),(function (){
return cljs.core.reset_BANG_(_STAR_private_property_QMARK_,cljs.core.not(cljs.core.deref(_STAR_private_property_QMARK_)));
})], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__70791) : logseq.shui.ui.checkbox.call(null,G__70791));
})())]),daiquiri.interpreter.interpret(frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__70775_SHARP_){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword(null,"value","value",305978217)],[new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__70775_SHARP_),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(p1__70775_SHARP_)]);
}),properties__$1),(function (p__70799){
var map__70800 = p__70799;
var map__70800__$1 = cljs.core.__destructure_map(map__70800);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70800__$1,new cljs.core.Keyword(null,"value","value",305978217));
var db_ident = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70800__$1,new cljs.core.Keyword("db","ident","db/ident",-737096));
cljs.core.reset_BANG_(_STAR_mode,"property-value");

return cljs.core.reset_BANG_(_STAR_property,((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()))?db_ident:cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(value)));
})))]);
}),null,"frontend.components.query.builder/property-select");
frontend.components.query.builder.property_value_select_inner = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_property,_STAR_private_property_QMARK_,_STAR_find,_STAR_tree,opts,loc,values,p__70806){
var map__70807 = p__70806;
var map__70807__$1 = cljs.core.__destructure_map(map__70807);
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70807__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
var values_SINGLEQUOTE_ = cljs.core.cons(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),"Select all",new cljs.core.Keyword(null,"value","value",305978217),"Select all"], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__70803_SHARP_){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"original-value","original-value",-1784606036)],[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(p1__70803_SHARP_)),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(p1__70803_SHARP_)]);
}),values));
var find_SINGLEQUOTE_ = rum.core.react(_STAR_find);
return daiquiri.interpreter.interpret(frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$2(values_SINGLEQUOTE_,(function (p__70813){
var map__70814 = p__70813;
var map__70814__$1 = cljs.core.__destructure_map(map__70814);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70814__$1,new cljs.core.Keyword(null,"value","value",305978217));
var original_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70814__$1,new cljs.core.Keyword(null,"original-value","original-value",-1784606036));
var k = (cljs.core.truth_(db_graph_QMARK_)?(cljs.core.truth_(cljs.core.deref(_STAR_private_property_QMARK_))?new cljs.core.Keyword(null,"private-property","private-property",1080779061):new cljs.core.Keyword(null,"property","property",-1114278232)):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(find_SINGLEQUOTE_,new cljs.core.Keyword(null,"page","page",849072397)))?new cljs.core.Keyword(null,"page-property","page-property",-417044665):new cljs.core.Keyword(null,"property","property",-1114278232)
));
var x = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value,"Select all"))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,cljs.core.deref(_STAR_property)], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,cljs.core.deref(_STAR_property),original_value], null));
cljs.core.reset_BANG_(_STAR_property,null);

return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,x);
})));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.query.builder/property-value-select-inner");
frontend.components.query.builder.property_value_select = rum.core.lazy_build(rum.core.build_defc,(function (repo,_STAR_property,_STAR_private_property_QMARK_,_STAR_find,_STAR_tree,opts,loc){
var db_graph_QMARK_ = logseq.db.sqlite.util.db_based_graph_QMARK_(repo);
var vec__70819 = rum.core.use_state(null);
var values = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70819,(0),null);
var set_values_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70819,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (_property){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(db_graph_QMARK_)?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_property_values(cljs.core.deref(_STAR_property))),(function (result){
return promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__70823){
var map__70824 = p__70823;
var map__70824__$1 = cljs.core.__destructure_map(map__70824);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70824__$1,new cljs.core.Keyword(null,"label","label",1718410804));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),label,new cljs.core.Keyword(null,"value","value",305978217),label], null);
}),result));
}));
})):promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_file_get_property_values(repo,cljs.core.deref(_STAR_property))),(function (result){
return promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (value){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),cljs.core.str.cljs$core$IFn$_invoke$arity$1(value),new cljs.core.Keyword(null,"value","value",305978217),value], null);
}),result));
}));
})))),(function (result){
return promesa.protocols._promise((set_values_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_values_BANG_.cljs$core$IFn$_invoke$arity$1(result) : set_values_BANG_.call(null,result)));
}));
}));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.deref(_STAR_property)], null));

return frontend.components.query.builder.property_value_select_inner(_STAR_property,_STAR_private_property_QMARK_,_STAR_find,_STAR_tree,opts,loc,values,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876),db_graph_QMARK_], null));
}),null,"frontend.components.query.builder/property-value-select");
frontend.components.query.builder.tags = rum.core.lazy_build(rum.core.build_defc,(function (repo,_STAR_tree,opts,loc){
var vec__70825 = rum.core.use_state(null);
var values = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70825,(0),null);
var set_values_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70825,(1),null);
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
logseq.shui.hooks.use_effect_BANG_((function (){
var result = frontend.db.model.get_all_readable_classes(repo,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"except-root-class?","except-root-class?",-345353595),true], null));
return (set_values_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_values_BANG_.cljs$core$IFn$_invoke$arity$1(result) : set_values_BANG_.call(null,result));
}),cljs.core.PersistentVector.EMPTY);

var items = cljs.core.sort.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),values));
return daiquiri.interpreter.interpret(frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$2(items,(function (p__70830){
var map__70831 = p__70830;
var map__70831__$1 = cljs.core.__destructure_map(map__70831);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70831__$1,new cljs.core.Keyword(null,"value","value",305978217));
return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [((db_based_QMARK_)?new cljs.core.Keyword(null,"tags","tags",1771418977):new cljs.core.Keyword(null,"page-tags","page-tags",-1009436025)),value], null));
})));
}),null,"frontend.components.query.builder/tags");
frontend.components.query.builder.page_search = rum.core.lazy_build(rum.core.build_defc,(function (on_chosen){
var vec__70833 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var result = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70833,(0),null);
var set_result_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70833,(1),null);
var vec__70836 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var loading_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70836,(0),null);
var set_loading_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70836,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
(set_loading_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_loading_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_loading_BANG_.call(null,true));

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","get-all-page-titles","thread-api/get-all-page-titles",1191294363),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo()], 0))),(function (result__$1){
return promesa.protocols._mcat(promesa.protocols._promise((set_result_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_result_BANG_.cljs$core$IFn$_invoke$arity$1(result__$1) : set_result_BANG_.call(null,result__$1))),(function (___40947__auto__){
return promesa.protocols._promise((set_loading_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_loading_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_loading_BANG_.call(null,false)));
}));
}));
}));
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.interpreter.interpret(frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$3(result,on_chosen,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"loading?","loading?",1905707049),loading_QMARK_], null)));
}),null,"frontend.components.query.builder/page-search");
frontend.components.query.builder.db_based_query_filter_picker = (function frontend$components$query$builder$db_based_query_filter_picker(state,_STAR_find,_STAR_tree,loc,clause,opts){
var _STAR_mode = new cljs.core.Keyword("frontend.components.query.builder","mode","frontend.components.query.builder/mode",2020350070).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_property = new cljs.core.Keyword("frontend.components.query.builder","property","frontend.components.query.builder/property",-278387025).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_private_property_QMARK_ = new cljs.core.Keyword("frontend.components.query.builder","private-property?","frontend.components.query.builder/private-property?",-1019066779).cljs$core$IFn$_invoke$arity$1(state);
var repo = frontend.state.get_current_repo();
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),(function (){var G__70857 = cljs.core.deref(_STAR_mode);
switch (G__70857) {
case "property":
return frontend.components.query.builder.property_select(_STAR_mode,_STAR_property,_STAR_private_property_QMARK_);

break;
case "property-value":
return frontend.components.query.builder.property_value_select(repo,_STAR_property,_STAR_private_property_QMARK_,_STAR_find,_STAR_tree,opts,loc);

break;
case "sample":
return frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$2(cljs.core.range.cljs$core$IFn$_invoke$arity$2((1),(101)),(function (p__70860){
var map__70861 = p__70860;
var map__70861__$1 = cljs.core.__destructure_map(map__70861);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70861__$1,new cljs.core.Keyword(null,"value","value",305978217));
return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sample","sample",79023601),frontend.util.safe_parse_int(value)], null));
}));

break;
case "tags":
return frontend.components.query.builder.tags(repo,_STAR_tree,opts,loc);

break;
case "task":
var items = (function (){var values = new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853))));
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.property_value_content,values);
})();
return frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$3(items,cljs.core.constantly(null),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490),true,new cljs.core.Keyword(null,"selected-choices","selected-choices",1913324317),cljs.core.PersistentHashSet.EMPTY,new cljs.core.Keyword(null,"extract-chosen-fn","extract-chosen-fn",1058364622),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"prompt-key","prompt-key",1549371683),new cljs.core.Keyword("select","default-select-multiple","select/default-select-multiple",-1340588908),new cljs.core.Keyword(null,"close-modal?","close-modal?",-207518383),false,new cljs.core.Keyword(null,"on-apply","on-apply",-1897056081),(function (choices){
if(cljs.core.seq(choices)){
return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,cljs.core.vec(cljs.core.cons(new cljs.core.Keyword(null,"task","task",-1476607993),choices)));
} else {
return null;
}
})], null));

break;
case "priority":
return frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$3(((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo))?(function (){var values = new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","priority","logseq.property/priority",239228411)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property","priority","logseq.property/priority",239228411))));
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.property_value_content,values);
})():logseq.graph_parser.db.built_in_priorities),cljs.core.constantly(null),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490),true,new cljs.core.Keyword(null,"selected-choices","selected-choices",1913324317),cljs.core.PersistentHashSet.EMPTY,new cljs.core.Keyword(null,"extract-chosen-fn","extract-chosen-fn",1058364622),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"prompt-key","prompt-key",1549371683),new cljs.core.Keyword("select","default-select-multiple","select/default-select-multiple",-1340588908),new cljs.core.Keyword(null,"close-modal?","close-modal?",-207518383),false,new cljs.core.Keyword(null,"on-apply","on-apply",-1897056081),(function (choices){
if(cljs.core.seq(choices)){
return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,cljs.core.vec(cljs.core.cons(new cljs.core.Keyword(null,"priority","priority",1431093715),choices)));
} else {
return null;
}
})], null));

break;
case "page":
return frontend.components.query.builder.page_search((function (p__70862){
var map__70863 = p__70862;
var map__70863__$1 = cljs.core.__destructure_map(map__70863);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70863__$1,new cljs.core.Keyword(null,"value","value",305978217));
return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page","page",849072397),value], null));
}));

break;
case "page reference":
return frontend.components.query.builder.page_search((function (p__70864){
var map__70865 = p__70864;
var map__70865__$1 = cljs.core.__destructure_map(map__70865);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70865__$1,new cljs.core.Keyword(null,"value","value",305978217));
return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151),value], null));
}));

break;
case "full text search":
return frontend.components.query.builder.search((function (v){
return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,v);
}),new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425).cljs$core$IFn$_invoke$arity$1(opts));

break;
case "between":
return frontend.components.query.builder.between(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"tree","tree",-196312028),_STAR_tree,new cljs.core.Keyword(null,"loc","loc",-584284901),loc,new cljs.core.Keyword(null,"clause","clause",1479668060),clause], null)], 0)));

break;
default:
return null;

}
})()], null);
});
frontend.components.query.builder.file_based_query_filter_picker = (function frontend$components$query$builder$file_based_query_filter_picker(state,_STAR_find,_STAR_tree,loc,clause,opts){
var _STAR_mode = new cljs.core.Keyword("frontend.components.query.builder","mode","frontend.components.query.builder/mode",2020350070).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_property = new cljs.core.Keyword("frontend.components.query.builder","property","frontend.components.query.builder/property",-278387025).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_private_property_QMARK_ = new cljs.core.Keyword("frontend.components.query.builder","private-property?","frontend.components.query.builder/private-property?",-1019066779).cljs$core$IFn$_invoke$arity$1(state);
var repo = frontend.state.get_current_repo();
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),(function (){var G__70871 = cljs.core.deref(_STAR_mode);
switch (G__70871) {
case "namespace":
var items = cljs.core.sort.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),frontend.db.file_based.model.get_all_namespace_parents(repo)));
return frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$2(items,(function (p__70872){
var map__70873 = p__70872;
var map__70873__$1 = cljs.core.__destructure_map(map__70873);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70873__$1,new cljs.core.Keyword(null,"value","value",305978217));
return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"namespace","namespace",-377510372),value], null));
}));

break;
case "tags":
return frontend.components.query.builder.tags(repo,_STAR_tree,opts,loc);

break;
case "property":
return frontend.components.query.builder.property_select(_STAR_mode,_STAR_property,_STAR_private_property_QMARK_);

break;
case "property-value":
return frontend.components.query.builder.property_value_select(repo,_STAR_property,_STAR_private_property_QMARK_,_STAR_find,_STAR_tree,opts,loc);

break;
case "sample":
return frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$2(cljs.core.range.cljs$core$IFn$_invoke$arity$2((1),(101)),(function (p__70874){
var map__70875 = p__70874;
var map__70875__$1 = cljs.core.__destructure_map(map__70875);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70875__$1,new cljs.core.Keyword(null,"value","value",305978217));
return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sample","sample",79023601),frontend.util.safe_parse_int(value)], null));
}));

break;
case "task":
return frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$3(((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo))?(function (){var values = new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853))));
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.property_value_content,values);
})():logseq.graph_parser.db.built_in_markers),cljs.core.constantly(null),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490),true,new cljs.core.Keyword(null,"selected-choices","selected-choices",1913324317),cljs.core.PersistentHashSet.EMPTY,new cljs.core.Keyword(null,"extract-chosen-fn","extract-chosen-fn",1058364622),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"prompt-key","prompt-key",1549371683),new cljs.core.Keyword("select","default-select-multiple","select/default-select-multiple",-1340588908),new cljs.core.Keyword(null,"close-modal?","close-modal?",-207518383),false,new cljs.core.Keyword(null,"on-apply","on-apply",-1897056081),(function (choices){
if(cljs.core.seq(choices)){
return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,cljs.core.vec(cljs.core.cons(new cljs.core.Keyword(null,"task","task",-1476607993),choices)));
} else {
return null;
}
})], null));

break;
case "priority":
return frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$3(((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo))?(function (){var values = new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","priority","logseq.property/priority",239228411)) : frontend.db.entity.call(null,new cljs.core.Keyword("logseq.property","priority","logseq.property/priority",239228411))));
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.property_value_content,values);
})():logseq.graph_parser.db.built_in_priorities),cljs.core.constantly(null),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"multiple-choices?","multiple-choices?",-1858892490),true,new cljs.core.Keyword(null,"selected-choices","selected-choices",1913324317),cljs.core.PersistentHashSet.EMPTY,new cljs.core.Keyword(null,"extract-chosen-fn","extract-chosen-fn",1058364622),new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"prompt-key","prompt-key",1549371683),new cljs.core.Keyword("select","default-select-multiple","select/default-select-multiple",-1340588908),new cljs.core.Keyword(null,"close-modal?","close-modal?",-207518383),false,new cljs.core.Keyword(null,"on-apply","on-apply",-1897056081),(function (choices){
if(cljs.core.seq(choices)){
return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,cljs.core.vec(cljs.core.cons(new cljs.core.Keyword(null,"priority","priority",1431093715),choices)));
} else {
return null;
}
})], null));

break;
case "page":
return frontend.components.query.builder.page_search((function (p__70876){
var map__70877 = p__70876;
var map__70877__$1 = cljs.core.__destructure_map(map__70877);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70877__$1,new cljs.core.Keyword(null,"value","value",305978217));
return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page","page",849072397),value], null));
}));

break;
case "page reference":
return frontend.components.query.builder.page_search((function (p__70878){
var map__70879 = p__70878;
var map__70879__$1 = cljs.core.__destructure_map(map__70879);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70879__$1,new cljs.core.Keyword(null,"value","value",305978217));
return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151),value], null));
}));

break;
case "full text search":
return frontend.components.query.builder.search((function (v){
return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,v);
}),new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425).cljs$core$IFn$_invoke$arity$1(opts));

break;
case "between":
return frontend.components.query.builder.between(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"tree","tree",-196312028),_STAR_tree,new cljs.core.Keyword(null,"loc","loc",-584284901),loc,new cljs.core.Keyword(null,"clause","clause",1479668060),clause], null)], 0)));

break;
default:
return null;

}
})()], null);
});
frontend.components.query.builder.picker = rum.core.lazy_build(rum.core.build_defcs,(function (state,_STAR_find,_STAR_tree,loc,clause,opts){
var _STAR_mode = new cljs.core.Keyword("frontend.components.query.builder","mode","frontend.components.query.builder/mode",2020350070).cljs$core$IFn$_invoke$arity$1(state);
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo());
var filters = ((db_based_QMARK_)?frontend.handler.query.builder.db_based_block_filters:((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page","page",849072397),rum.core.react(_STAR_find)))?frontend.handler.query.builder.page_filters:frontend.handler.query.builder.block_filters));
var filters_and_ops = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(filters,frontend.handler.query.builder.operators);
var operator_QMARK_ = (function (p1__70880_SHARP_){
return cljs.core.contains_QMARK_(frontend.handler.query.builder.operators_set,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(p1__70880_SHARP_));
});
var attrs70889 = (cljs.core.truth_(cljs.core.deref(_STAR_mode))?((operator_QMARK_(cljs.core.deref(_STAR_mode)))?null:((db_based_QMARK_)?frontend.components.query.builder.db_based_query_filter_picker(state,_STAR_find,_STAR_tree,loc,clause,opts):frontend.components.query.builder.file_based_query_filter_picker(state,_STAR_find,_STAR_tree,loc,clause,opts))):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),((db_based_QMARK_)?null:new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),(cljs.core.truth_(cljs.core.deref(_STAR_find))?null:new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.p-2.justify-between","div.flex.flex-row.items-center.p-2.justify-between",1859527721),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ml-2","div.ml-2",1561421207),"Find: "], null),frontend.components.query.builder.page_block_selector(_STAR_find)], null)),(cljs.core.truth_(cljs.core.deref(_STAR_find))?null:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hr.m-0","hr.m-0",-256784560)], null))], null)),frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$3(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.name,filters_and_ops),(function (p__70891){
var map__70892 = p__70891;
var map__70892__$1 = cljs.core.__destructure_map(map__70892);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70892__$1,new cljs.core.Keyword(null,"value","value",305978217));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value,"all page tags")){
return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"all-page-tags","all-page-tags",-1759251965)], null));
} else {
if(operator_QMARK_(value)){
return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(value)], null));
} else {
return cljs.core.reset_BANG_(_STAR_mode,value);

}
}
}),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"input-default-placeholder","input-default-placeholder",-1040139250),"Add filter/operator"], null))], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs70889))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["query-builder-picker"], null)], null),attrs70889], 0))):{'className':"query-builder-picker"}),((cljs.core.map_QMARK_(attrs70889))?null:[daiquiri.interpreter.interpret(attrs70889)]));
}),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
frontend.state.clear_selection_BANG_();

return state;
})], null),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.query.builder","mode","frontend.components.query.builder/mode",2020350070)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.query.builder","property","frontend.components.query.builder/property",-278387025)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.query.builder","private-property?","frontend.components.query.builder/private-property?",-1019066779))], null),"frontend.components.query.builder/picker");
frontend.components.query.builder.add_filter = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_find,_STAR_tree,loc,clause){
return daiquiri.interpreter.interpret((function (){var G__70901 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"class","class",-2030961996),"jtrigger !px-1 h-6 add-filter text-muted-foreground",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),frontend.util.stop_propagation,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__70904 = e.target;
var G__70905 = (function (p__70907){
var map__70908 = p__70907;
var map__70908__$1 = cljs.core.__destructure_map(map__70908);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70908__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
return frontend.components.query.builder.picker(_STAR_find,_STAR_tree,loc,clause,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(id) : logseq.shui.ui.popup_hide_BANG_.call(null,id));
})], null));
});
var G__70906 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__70904,G__70905,G__70906) : logseq.shui.ui.popup_show_BANG_.call(null,G__70904,G__70905,G__70906));
})], null);
var G__70902 = frontend.ui.icon("plus",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null));
var G__70903 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null),loc))?"Filter":null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__70901,G__70902,G__70903) : logseq.shui.ui.button.call(null,G__70901,G__70902,G__70903));
})());
}),null,"frontend.components.query.builder/add-filter");
frontend.components.query.builder.dsl_human_output = (function frontend$components$query$builder$dsl_human_output(clause){
var f = cljs.core.first(clause);
if(clojure.string.starts_with_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(f),"?")){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(clause);
} else {
if(typeof clause === 'string'){
return ["Search: ",clause].join('');
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(f),new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151))){
var G__70909 = cljs.core.second(clause);
return (frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(G__70909) : frontend.util.ref.__GT_page_ref.call(null,G__70909));
} else {
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"tags","tags",1771418977),null,new cljs.core.Keyword(null,"page-tags","page-tags",-1009436025),null], null), null),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(f))){
if(typeof cljs.core.second(clause) === 'string'){
return ["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.second(clause))].join('');
} else {
if((cljs.core.second(clause) instanceof cljs.core.Symbol)){
return ["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.second(clause))].join('');
} else {
return ["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.second(cljs.core.second(clause)))].join('');

}
}
} else {
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"page-property","page-property",-417044665),null,new cljs.core.Keyword(null,"property","property",-1114278232),null,new cljs.core.Keyword(null,"private-property","private-property",1080779061),null], null), null),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(f))){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(((((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())) && (cljs.core.qualified_keyword_QMARK_(cljs.core.second(clause)))))?new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__70912 = cljs.core.second(clause);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__70912) : frontend.db.entity.call(null,G__70912));
})()):(function (){var G__70913 = cljs.core.second(clause);
if((G__70913 == null)){
return null;
} else {
return cljs.core.name(G__70913);
}
})())),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((((cljs.core.vector_QMARK_(cljs.core.last(clause))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page-ref","page-ref",-1047131151),cljs.core.first(cljs.core.last(clause))))))?cljs.core.second(cljs.core.last(clause)):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((2),cljs.core.count(clause)))?"ALL":cljs.core.last(clause)
)))].join('');
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(f),new cljs.core.Keyword(null,"between","between",1131099276));
if(and__5000__auto__){
return frontend.db.query_dsl.get_timestamp_property(clause);
} else {
return and__5000__auto__;
}
})())){
var k = frontend.db.query_dsl.get_timestamp_property(clause);
var vec__70914 = clause;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70914,(0),null);
var _property = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70914,(1),null);
var start = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70914,(2),null);
var end = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__70914,(3),null);
var start__$1 = (((((start instanceof cljs.core.Keyword)) || ((start instanceof cljs.core.Symbol))))?cljs.core.name(start):cljs.core.second(start));
var end__$1 = (((((end instanceof cljs.core.Keyword)) || ((end instanceof cljs.core.Symbol))))?cljs.core.name(end):cljs.core.second(end));
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword("block","created-at","block/created-at",1440015)))?"Created":((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)))?"Updated":(function (){var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(k) : frontend.db.entity.call(null,k)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.name(k);
}
})()
)))," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(start__$1),(cljs.core.truth_(end__$1)?[" ~ ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(end__$1)].join(''):null)].join('');
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(f),new cljs.core.Keyword(null,"between","between",1131099276))){
var start = (((((cljs.core.second(clause) instanceof cljs.core.Keyword)) || ((cljs.core.second(clause) instanceof cljs.core.Symbol))))?cljs.core.name(cljs.core.second(clause)):cljs.core.second(cljs.core.second(clause)));
var end = (((((cljs.core.last(clause) instanceof cljs.core.Keyword)) || ((cljs.core.last(clause) instanceof cljs.core.Symbol))))?cljs.core.name(cljs.core.last(clause)):cljs.core.second(cljs.core.last(clause)));
return ["between: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(start)," ~ ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(end)].join('');
} else {
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"task","task",-1476607993),null,new cljs.core.Keyword(null,"priority","priority",1431093715),null], null), null),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(f))){
return [cljs.core.name(f),": ",clojure.string.join.cljs$core$IFn$_invoke$arity$2(" | ",cljs.core.rest(clause))].join('');
} else {
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"task","task",-1476607993),null,new cljs.core.Keyword(null,"page","page",849072397),null,new cljs.core.Keyword(null,"namespace","namespace",-377510372),null], null), null),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(f))){
return [cljs.core.name(f),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((cljs.core.vector_QMARK_(cljs.core.second(clause)))?cljs.core.second(cljs.core.second(clause)):cljs.core.second(clause)))].join('');
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((2),cljs.core.count(clause))){
return [cljs.core.name(f),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.second(clause))].join('');
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.handler.query.builder.__GT_dsl(clause));

}
}
}
}
}
}
}
}
}
}
});
frontend.components.query.builder.clause_inner = rum.core.lazy_build(rum.core.build_defc,(function() { 
var G__71156__delegate = function (_STAR_tree,loc,clause,p__70919){
var map__70920 = p__70919;
var map__70920__$1 = cljs.core.__destructure_map(map__70920);
var operator_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__70920__$1,new cljs.core.Keyword(null,"operator?","operator?",68029935));
var popup = new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-4.flex.flex-col.gap-2","div.p-4.flex.flex-col.gap-2",1074883200),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),"Delete",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_tree,(function (q){
var loc_SINGLEQUOTE_ = (cljs.core.truth_(operator_QMARK_)?cljs.core.vec(cljs.core.butlast(loc)):loc);
return frontend.handler.query.builder.remove_element(q,loc_SINGLEQUOTE_);
}));

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null),"Delete"], null),(cljs.core.truth_(operator_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),"Unwrap this operator",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_tree,(function (q){
var loc_SINGLEQUOTE_ = cljs.core.vec(cljs.core.butlast(loc));
return frontend.handler.query.builder.unwrap_operator(q,loc_SINGLEQUOTE_);
}));

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null),"Unwrap"], null):null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium.text-sm","div.font-medium.text-sm",619848115),"Wrap this filter with: "], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.gap-2","div.flex.flex-row.gap-2",-1457313917),(function (){var iter__5480__auto__ = (function frontend$components$query$builder$iter__70921(s__70922){
return (new cljs.core.LazySeq(null,(function (){
var s__70922__$1 = s__70922;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__70922__$1);
if(temp__5804__auto__){
var s__70922__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__70922__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__70922__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__70924 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__70923 = (0);
while(true){
if((i__70923 < size__5479__auto__)){
var op = cljs.core._nth(c__5478__auto__,i__70923);
cljs.core.chunk_append(b__70924,frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(clojure.string.upper_case(cljs.core.name(op)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"intent","intent",-390846953),"logseq",new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__70923,op,c__5478__auto__,size__5479__auto__,b__70924,s__70922__$2,temp__5804__auto__,map__70920,map__70920__$1,operator_QMARK_){
return (function (){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_tree,((function (i__70923,op,c__5478__auto__,size__5479__auto__,b__70924,s__70922__$2,temp__5804__auto__,map__70920,map__70920__$1,operator_QMARK_){
return (function (q){
var loc_SINGLEQUOTE_ = (cljs.core.truth_(operator_QMARK_)?cljs.core.vec(cljs.core.butlast(loc)):loc);
return frontend.handler.query.builder.wrap_operator(q,loc_SINGLEQUOTE_,op);
});})(i__70923,op,c__5478__auto__,size__5479__auto__,b__70924,s__70922__$2,temp__5804__auto__,map__70920,map__70920__$1,operator_QMARK_))
);

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
});})(i__70923,op,c__5478__auto__,size__5479__auto__,b__70924,s__70922__$2,temp__5804__auto__,map__70920,map__70920__$1,operator_QMARK_))
], 0)));

var G__71159 = (i__70923 + (1));
i__70923 = G__71159;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__70924),frontend$components$query$builder$iter__70921(cljs.core.chunk_rest(s__70922__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__70924),null);
}
} else {
var op = cljs.core.first(s__70922__$2);
return cljs.core.cons(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(clojure.string.upper_case(cljs.core.name(op)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"intent","intent",-390846953),"logseq",new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (op,s__70922__$2,temp__5804__auto__,map__70920,map__70920__$1,operator_QMARK_){
return (function (){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_tree,(function (q){
var loc_SINGLEQUOTE_ = (cljs.core.truth_(operator_QMARK_)?cljs.core.vec(cljs.core.butlast(loc)):loc);
return frontend.handler.query.builder.wrap_operator(q,loc_SINGLEQUOTE_,op);
}));

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
});})(op,s__70922__$2,temp__5804__auto__,map__70920,map__70920__$1,operator_QMARK_))
], 0)),frontend$components$query$builder$iter__70921(cljs.core.rest(s__70922__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(frontend.handler.query.builder.operators);
})()], null),(cljs.core.truth_(operator_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium.text-sm","div.font-medium.text-sm",619848115),"Replace with: "], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.gap-2","div.flex.flex-row.gap-2",-1457313917),(function (){var iter__5480__auto__ = (function frontend$components$query$builder$iter__70925(s__70926){
return (new cljs.core.LazySeq(null,(function (){
var s__70926__$1 = s__70926;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__70926__$1);
if(temp__5804__auto__){
var s__70926__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__70926__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__70926__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__70928 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__70927 = (0);
while(true){
if((i__70927 < size__5479__auto__)){
var op = cljs.core._nth(c__5478__auto__,i__70927);
cljs.core.chunk_append(b__70928,frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(clojure.string.upper_case(cljs.core.name(op)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"intent","intent",-390846953),"logseq",new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__70927,op,c__5478__auto__,size__5479__auto__,b__70928,s__70926__$2,temp__5804__auto__,map__70920,map__70920__$1,operator_QMARK_){
return (function (){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_tree,((function (i__70927,op,c__5478__auto__,size__5479__auto__,b__70928,s__70926__$2,temp__5804__auto__,map__70920,map__70920__$1,operator_QMARK_){
return (function (q){
return frontend.handler.query.builder.replace_element(q,loc,op);
});})(i__70927,op,c__5478__auto__,size__5479__auto__,b__70928,s__70926__$2,temp__5804__auto__,map__70920,map__70920__$1,operator_QMARK_))
);

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
});})(i__70927,op,c__5478__auto__,size__5479__auto__,b__70928,s__70926__$2,temp__5804__auto__,map__70920,map__70920__$1,operator_QMARK_))
], 0)));

var G__71174 = (i__70927 + (1));
i__70927 = G__71174;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__70928),frontend$components$query$builder$iter__70925(cljs.core.chunk_rest(s__70926__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__70928),null);
}
} else {
var op = cljs.core.first(s__70926__$2);
return cljs.core.cons(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(clojure.string.upper_case(cljs.core.name(op)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"intent","intent",-390846953),"logseq",new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (op,s__70926__$2,temp__5804__auto__,map__70920,map__70920__$1,operator_QMARK_){
return (function (){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_tree,(function (q){
return frontend.handler.query.builder.replace_element(q,loc,op);
}));

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
});})(op,s__70926__$2,temp__5804__auto__,map__70920,map__70920__$1,operator_QMARK_))
], 0)),frontend$components$query$builder$iter__70925(cljs.core.rest(s__70926__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentHashSet.createAsIfByAssoc([cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.lower_case(clause))]),frontend.handler.query.builder.operators));
})()], null)], null):null)], null);
if(cljs.core.truth_(operator_QMARK_)){
return daiquiri.core.create_element("a",{'onClick':(function (p1__70917_SHARP_){
var G__70938 = p1__70917_SHARP_.target;
var G__70939 = popup;
var G__70940 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__70938,G__70939,G__70940) : logseq.shui.ui.popup_show_BANG_.call(null,G__70938,G__70939,G__70940));
}),'className':"flex text-sm query-clause"},[daiquiri.interpreter.interpret(clause)]);
} else {
return daiquiri.core.create_element("div",{'className':"flex flex-row items-center gap-2 px-1 rounded border query-clause-btn"},[daiquiri.core.create_element("a",{'onClick':(function (p1__70918_SHARP_){
var G__70941 = p1__70918_SHARP_.target;
var G__70942 = popup;
var G__70943 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__70941,G__70942,G__70943) : logseq.shui.ui.popup_show_BANG_.call(null,G__70941,G__70942,G__70943));
}),'className':"flex query-clause"},[daiquiri.interpreter.interpret(frontend.components.query.builder.dsl_human_output(clause))])]);
}
};
var G__71156 = function (_STAR_tree,loc,clause,var_args){
var p__70919 = null;
if (arguments.length > 3) {
var G__71183__i = 0, G__71183__a = new Array(arguments.length -  3);
while (G__71183__i < G__71183__a.length) {G__71183__a[G__71183__i] = arguments[G__71183__i + 3]; ++G__71183__i;}
  p__70919 = new cljs.core.IndexedSeq(G__71183__a,0,null);
} 
return G__71156__delegate.call(this,_STAR_tree,loc,clause,p__70919);};
G__71156.cljs$lang$maxFixedArity = 3;
G__71156.cljs$lang$applyTo = (function (arglist__71184){
var _STAR_tree = cljs.core.first(arglist__71184);
arglist__71184 = cljs.core.next(arglist__71184);
var loc = cljs.core.first(arglist__71184);
arglist__71184 = cljs.core.next(arglist__71184);
var clause = cljs.core.first(arglist__71184);
var p__70919 = cljs.core.rest(arglist__71184);
return G__71156__delegate(_STAR_tree,loc,clause,p__70919);
});
G__71156.cljs$core$IFn$_invoke$arity$variadic = G__71156__delegate;
return G__71156;
})()
,null,"frontend.components.query.builder/clause-inner");
frontend.components.query.builder.clause = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_tree,_STAR_find,loc,clauses){
if(cljs.core.seq(clauses)){
var attrs70976 = (function (){var operator = cljs.core.first(clauses);
var kind = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(operator);
if(cljs.core.truth_((frontend.handler.query.builder.operators_set.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.query.builder.operators_set.cljs$core$IFn$_invoke$arity$1(kind) : frontend.handler.query.builder.operators_set.call(null,kind)))){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.operator-clause.flex.flex-row.items-center","div.operator-clause.flex.flex-row.items-center",-1542341153),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-level","data-level",1364295892),cljs.core.count(loc)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.clause-bracket","div.clause-bracket",-988173709),"("], null),(function (){var G__70977 = _STAR_tree;
var G__70978 = _STAR_find;
var G__70979 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(loc,(0));
var G__70980 = kind;
var G__70981 = cljs.core.rest(clauses);
return (frontend.components.query.builder.clauses_group.cljs$core$IFn$_invoke$arity$5 ? frontend.components.query.builder.clauses_group.cljs$core$IFn$_invoke$arity$5(G__70977,G__70978,G__70979,G__70980,G__70981) : frontend.components.query.builder.clauses_group.call(null,G__70977,G__70978,G__70979,G__70980,G__70981));
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.clause-bracket","div.clause-bracket",-988173709),")"], null)], null);
} else {
return frontend.components.query.builder.clause_inner(_STAR_tree,loc,clauses);
}
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs70976))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["query-builder-clause"], null)], null),attrs70976], 0))):{'className':"query-builder-clause"}),((cljs.core.map_QMARK_(attrs70976))?null:[daiquiri.interpreter.interpret(attrs70976)]));
} else {
return null;
}
}),null,"frontend.components.query.builder/clause");
frontend.components.query.builder.clauses_group = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_tree,_STAR_find,loc,kind,clauses){
var parens_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null))) && (((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(kind,new cljs.core.Keyword(null,"and","and",-971899817))) || ((cljs.core.count(clauses) > (1))))));
var attrs70983 = ((parens_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.clause-bracket","div.clause-bracket",-988173709),"("], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs70983))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["clauses-group"], null)], null),attrs70983], 0))):{'className':"clauses-group"}),((cljs.core.map_QMARK_(attrs70983))?[((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(kind,new cljs.core.Keyword(null,"and","and",-971899817))) && ((cljs.core.count(clauses) <= (1)))))))?null:frontend.components.query.builder.clause_inner(_STAR_tree,loc,clojure.string.upper_case(cljs.core.name(kind)),new cljs.core.Keyword(null,"operator?","operator?",68029935),true)),daiquiri.interpreter.interpret(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (i,item){
return frontend.components.query.builder.clause(_STAR_tree,_STAR_find,cljs.core.update.cljs$core$IFn$_invoke$arity$3(loc,(cljs.core.count(loc) - (1)),(function (p1__70982_SHARP_){
return ((p1__70982_SHARP_ + i) + (1));
})),item);
}),clauses)),((parens_QMARK_)?daiquiri.core.create_element("div",{'className':"clause-bracket"},[")"]):null),((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null)))?frontend.components.query.builder.add_filter(_STAR_find,_STAR_tree,loc,cljs.core.PersistentVector.EMPTY):null)]:[daiquiri.interpreter.interpret(attrs70983),((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(kind,new cljs.core.Keyword(null,"and","and",-971899817))) && ((cljs.core.count(clauses) <= (1)))))))?null:frontend.components.query.builder.clause_inner(_STAR_tree,loc,clojure.string.upper_case(cljs.core.name(kind)),new cljs.core.Keyword(null,"operator?","operator?",68029935),true)),daiquiri.interpreter.interpret(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (i,item){
return frontend.components.query.builder.clause(_STAR_tree,_STAR_find,cljs.core.update.cljs$core$IFn$_invoke$arity$3(loc,(cljs.core.count(loc) - (1)),(function (p1__70982_SHARP_){
return ((p1__70982_SHARP_ + i) + (1));
})),item);
}),clauses)),((parens_QMARK_)?daiquiri.core.create_element("div",{'className':"clause-bracket"},[")"]):null),((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null)))?frontend.components.query.builder.add_filter(_STAR_find,_STAR_tree,loc,cljs.core.PersistentVector.EMPTY):null)]));
}),null,"frontend.components.query.builder/clauses-group");
frontend.components.query.builder.clause_tree = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_tree,_STAR_find){
var tree = rum.core.react(_STAR_tree);
var kind = (function (){var G__71004 = cljs.core.first(tree);
var fexpr__71003 = cljs.core.set(frontend.handler.query.builder.operators);
return (fexpr__71003.cljs$core$IFn$_invoke$arity$1 ? fexpr__71003.cljs$core$IFn$_invoke$arity$1(G__71004) : fexpr__71003.call(null,G__71004));
})();
var vec__71000 = (cljs.core.truth_(kind)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [kind,cljs.core.rest(tree)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"and","and",-971899817),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.deref(tree)], null)], null));
var kind_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71000,(0),null);
var clauses = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__71000,(1),null);
return frontend.components.query.builder.clauses_group(_STAR_tree,_STAR_find,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null),kind_SINGLEQUOTE_,clauses);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.query.builder/clause-tree");
frontend.components.query.builder.sanitize_q = (function frontend$components$query$builder$sanitize_q(q_str){
if(clojure.string.blank_QMARK_(q_str)){
return "";
} else {
if(((logseq.common.util.wrapped_by_parens_QMARK_(q_str)) || (((logseq.common.util.wrapped_by_quotes_QMARK_(q_str)) || (((logseq.common.util.page_ref.page_ref_QMARK_(q_str)) || (clojure.string.starts_with_QMARK_(q_str,"[?")))))))){
return q_str;
} else {
return ["\"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(q_str),"\""].join('');
}
}
});
frontend.components.query.builder.get_q = (function frontend$components$query$builder$get_q(block){
return frontend.components.query.builder.sanitize_q((function (){var or__5002__auto__ = new cljs.core.Keyword("file-version","query-macro-title","file-version/query-macro-title",1175466731).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "";
}
}
})());
});
frontend.components.query.builder.builder = rum.core.lazy_build(rum.core.build_defcs,(function (state,_block,_option){
var _STAR_find = new cljs.core.Keyword("frontend.components.query.builder","find","frontend.components.query.builder/find",-1608822873).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_tree = new cljs.core.Keyword("frontend.components.query.builder","tree","frontend.components.query.builder/tree",1053242395).cljs$core$IFn$_invoke$arity$1(state);
return daiquiri.core.create_element("div",{'className':"cp__query-builder"},[(function (){var attrs71025 = ((((cljs.core.seq(cljs.core.deref(_STAR_tree))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_tree),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"and","and",-971899817)], null)))))?frontend.components.query.builder.clause_tree(_STAR_tree,_STAR_find):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs71025))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__query-builder-filter"], null)], null),attrs71025], 0))):{'className':"cp__query-builder-filter"}),((cljs.core.map_QMARK_(attrs71025))?[frontend.components.query.builder.add_filter(_STAR_find,_STAR_tree,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null),cljs.core.PersistentVector.EMPTY)]:[daiquiri.interpreter.interpret(attrs71025),frontend.components.query.builder.add_filter(_STAR_find,_STAR_tree,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null),cljs.core.PersistentVector.EMPTY)]));
})()]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.query.builder","find","frontend.components.query.builder/find",-1608822873)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"init","init",-1875481434),(function (state){
var block = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state));
var q_str = frontend.components.query.builder.get_q(block);
var query = logseq.common.util.safe_read_string.cljs$core$IFn$_invoke$arity$2(frontend.db.query_dsl.custom_readers,frontend.db.query_dsl.pre_transform_query(q_str));
var query_SINGLEQUOTE_ = ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Symbol(null,"and","and",668631710,null),null,new cljs.core.Symbol(null,"not","not",1044554643,null),null,new cljs.core.Symbol(null,"or","or",1876275696,null),null], null), null),cljs.core.first(query)))?query:(cljs.core.truth_(query)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"and","and",-971899817),query], null):new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"and","and",-971899817)], null)
));
var tree = frontend.handler.query.builder.from_dsl(query_SINGLEQUOTE_);
var _STAR_tree = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(tree);
cljs.core.add_watch(_STAR_tree,new cljs.core.Keyword(null,"updated","updated",-1627192056),(function (_,___$1,_old,_new){
if(cljs.core.truth_(block)){
var q = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"and","and",-971899817)], null),cljs.core.deref(_STAR_tree)))?"":(function (){var result = frontend.handler.query.builder.__GT_dsl(cljs.core.deref(_STAR_tree));
if(typeof result === 'string'){
return (frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("\"%s\"",result) : frontend.util.format.call(null,"\"%s\"",result));
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(result);
}
})());
var repo = frontend.state.get_current_repo();
var block__$1 = (function (){var G__71030 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__71030) : frontend.db.entity.call(null,G__71030));
})();
if(frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())){
return frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$3(repo,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1),q);
} else {
var content = clojure.string.replace(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(block__$1),/\{\{query[^}]+\}\}/,(frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("{{query %s}}",q) : frontend.util.format.call(null,"{{query %s}}",q)));
return frontend.handler.editor.save_block_BANG_.cljs$core$IFn$_invoke$arity$3(repo,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block__$1),content);
}
} else {
return null;
}
}));

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(state,new cljs.core.Keyword("frontend.components.query.builder","tree","frontend.components.query.builder/tree",1053242395),_STAR_tree);
}),new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
var q_str = frontend.components.query.builder.get_q(cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)));
var blocks_query_QMARK_ = new cljs.core.Keyword(null,"blocks?","blocks?",58578620).cljs$core$IFn$_invoke$arity$1(frontend.db.query_dsl.parse_query.cljs$core$IFn$_invoke$arity$1(q_str));
var find_mode = (cljs.core.truth_(blocks_query_QMARK_)?new cljs.core.Keyword(null,"block","block",664686210):((blocks_query_QMARK_ === false)?new cljs.core.Keyword(null,"page","page",849072397):null
));
if(cljs.core.truth_(find_mode)){
cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.components.query.builder","find","frontend.components.query.builder/find",-1608822873).cljs$core$IFn$_invoke$arity$1(state),find_mode);
} else {
}

return state;
})], null)], null),"frontend.components.query.builder/builder");

//# sourceMappingURL=frontend.components.query.builder.js.map
