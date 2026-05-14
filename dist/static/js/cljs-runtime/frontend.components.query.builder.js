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
var G__117317 = arguments.length;
switch (G__117317) {
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
return frontend.components.select.select(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"items","items",1031954938),((cljs.core.map_QMARK_(cljs.core.first(items)))?items:cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__117313_SHARP_){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"value","value",305978217)],[p1__117313_SHARP_]);
}),items)),new cljs.core.Keyword(null,"on-chosen","on-chosen",-114535900),on_chosen], null),options], 0)));
}));

(frontend.components.query.builder.select.cljs$lang$maxFixedArity = 3);

frontend.components.query.builder.append_tree_BANG_ = (function frontend$components$query$builder$append_tree_BANG_(_STAR_tree,p__117319,loc,x){
var map__117320 = p__117319;
var map__117320__$1 = cljs.core.__destructure_map(map__117320);
var toggle_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117320__$1,new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425));
var toggle_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__117320__$1,new cljs.core.Keyword(null,"toggle?","toggle?",-664005476),true);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_tree,(function (p1__117318_SHARP_){
return frontend.handler.query.builder.append_element(p1__117318_SHARP_,loc,x);
}));

if(cljs.core.truth_(toggle_QMARK_)){
return (toggle_fn.cljs$core$IFn$_invoke$arity$0 ? toggle_fn.cljs$core$IFn$_invoke$arity$0() : toggle_fn.call(null));
} else {
return null;
}
});
frontend.components.query.builder.search = rum.core.lazy_build(rum.core.build_defcs,(function (state,_on_submit,_on_cancel){
var _STAR_input_value = new cljs.core.Keyword("frontend.components.query.builder","input-value","frontend.components.query.builder/input-value",-953596856).cljs$core$IFn$_invoke$arity$1(state);
return daiquiri.core.create_element("input",{'id':"query-builder-search",'autoFocus':true,'placeholder':"Full text search",'aria-label':"Full text search",'onChange':rum.core.mark_sync_update((function (p1__117321_SHARP_){
return cljs.core.reset_BANG_(_STAR_input_value,frontend.util.evalue(p1__117321_SHARP_));
})),'className':"form-input block sm:text-sm sm:leading-5"},[]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.query.builder","input-value","frontend.components.query.builder/input-value",-953596856)),frontend.mixins.event_mixin.cljs$core$IFn$_invoke$arity$1((function (state){
return frontend.mixins.on_key_down.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.PersistentArrayMap(null, 2, [(13),(function (state__$1,e){
var input_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state__$1,new cljs.core.Keyword("frontend.components.query.builder","input-value","frontend.components.query.builder/input-value",-953596856));
if(clojure.string.blank_QMARK_(cljs.core.deref(input_value))){
return null;
} else {
frontend.util.stop(e);

var on_submit_119021 = cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state__$1));
var G__117324_119022 = cljs.core.deref(input_value);
(on_submit_119021.cljs$core$IFn$_invoke$arity$1 ? on_submit_119021.cljs$core$IFn$_invoke$arity$1(G__117324_119022) : on_submit_119021.call(null,G__117324_119022));

return cljs.core.reset_BANG_(input_value,null);
}
}),(27),(function (_state,_e){
var vec__117325 = new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state);
var _on_submit = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117325,(0),null);
var on_cancel = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117325,(1),null);
return (on_cancel.cljs$core$IFn$_invoke$arity$0 ? on_cancel.cljs$core$IFn$_invoke$arity$0() : on_cancel.call(null));
})], null));
}))], null),"frontend.components.query.builder/search");
if((typeof frontend !== 'undefined') && (typeof frontend.components !== 'undefined') && (typeof frontend.components.query !== 'undefined') && (typeof frontend.components.query.builder !== 'undefined') && (typeof frontend.components.query.builder._STAR_between_dates !== 'undefined')){
} else {
frontend.components.query.builder._STAR_between_dates = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
frontend.components.query.builder.datepicker = rum.core.lazy_build(rum.core.build_defcs,(function (state,id,placeholder,p__117332){
var map__117335 = p__117332;
var map__117335__$1 = cljs.core.__destructure_map(map__117335);
var on_select = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117335__$1,new cljs.core.Keyword(null,"on-select","on-select",-192407950));
var _STAR_input_value = new cljs.core.Keyword("frontend.components.query.builder","input-value","frontend.components.query.builder/input-value",-953596856).cljs$core$IFn$_invoke$arity$1(state);
return daiquiri.interpreter.interpret((function (){var G__117345 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"secondary","secondary",-669381460),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__117347 = e.target;
var G__117348 = (function (){var select_handle_BANG_ = (function (d){
var gd_119026 = frontend.date.js_date__GT_goog_date(d);
var journal_date_119027 = frontend.date.js_date__GT_journal_title(gd_119026);
cljs.core.reset_BANG_(_STAR_input_value,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [journal_date_119027,d], null));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.components.query.builder._STAR_between_dates,cljs.core.assoc,id,journal_date_119027);

var G__117351_119029 = on_select;
if((G__117351_119029 == null)){
} else {
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(G__117351_119029,cljs.core.PersistentVector.EMPTY);
}

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
});
return frontend.ui.single_calendar(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"initial-focus","initial-focus",1154999719),false,new cljs.core.Keyword(null,"selected","selected",574897764),(function (){var G__117352 = cljs.core.deref(_STAR_input_value);
if((G__117352 == null)){
return null;
} else {
return cljs.core.second(G__117352);
}
})(),new cljs.core.Keyword(null,"on-select","on-select",-192407950),select_handle_BANG_], null));
})();
var G__117349 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"query-datepicker","query-datepicker",1707199171),new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"p-0"], null),new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__117347,G__117348,G__117349) : logseq.shui.ui.popup_show_BANG_.call(null,G__117347,G__117348,G__117349));
})], null);
var G__117346 = (function (){var or__5002__auto__ = cljs.core.first(cljs.core.deref(_STAR_input_value));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return placeholder;
}
})();
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__117345,G__117346) : logseq.shui.ui.button.call(null,G__117345,G__117346));
})());
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.query.builder","input-value","frontend.components.query.builder/input-value",-953596856)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-unmount","will-unmount",-808051550),(function (state){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.components.query.builder._STAR_between_dates,cljs.core.dissoc,cljs.core.first(new cljs.core.Keyword("rum","args","rum/args",1315791754).cljs$core$IFn$_invoke$arity$1(state)));

return state;
})], null)], null),"frontend.components.query.builder/datepicker");
frontend.components.query.builder.between = rum.core.lazy_build(rum.core.build_defcs,(function (state,p__117354){
var map__117355 = p__117354;
var map__117355__$1 = cljs.core.__destructure_map(map__117355);
var opts = map__117355__$1;
var tree = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117355__$1,new cljs.core.Keyword(null,"tree","tree",-196312028));
var loc = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117355__$1,new cljs.core.Keyword(null,"loc","loc",-584284901));
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
})], null)], 0))),frontend.components.query.builder.datepicker(new cljs.core.Keyword(null,"end","end",-268185958),"End date",opts)]),(function (){var attrs117428 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Submit",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var map__117537 = cljs.core.deref(frontend.components.query.builder._STAR_between_dates);
var map__117537__$1 = cljs.core.__destructure_map(map__117537);
var start = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117537__$1,new cljs.core.Keyword(null,"start","start",-355208981));
var end = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117537__$1,new cljs.core.Keyword(null,"end","end",-268185958));
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
return daiquiri.core.create_element("p",((cljs.core.map_QMARK_(attrs117428))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["pt-2"], null)], null),attrs117428], 0))):{'className':"pt-2"}),((cljs.core.map_QMARK_(attrs117428))?null:[daiquiri.interpreter.interpret(attrs117428)]));
})()]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.query.builder","start","frontend.components.query.builder/start",997146870)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.query.builder","end","frontend.components.query.builder/end",-1534550361))], null),"frontend.components.query.builder/between");
frontend.components.query.builder.property_select = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_mode,_STAR_property,_STAR_private_property_QMARK_){
var vec__117613 = rum.core.use_state(null);
var properties = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117613,(0),null);
var set_properties_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117613,(1),null);
var properties__$1 = (function (){var G__117617 = properties;
if(cljs.core.not(cljs.core.deref(_STAR_private_property_QMARK_))){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.built_in_QMARK_,G__117617);
} else {
return G__117617;
}
})();
logseq.shui.hooks.use_effect_BANG_((function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_all_properties.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"remove-built-in-property?","remove-built-in-property?",454663723),false,new cljs.core.Keyword(null,"remove-non-queryable-built-in-property?","remove-non-queryable-built-in-property?",1219338536),true], null)], 0))),(function (properties__$2){
return promesa.protocols._promise((set_properties_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_properties_BANG_.cljs$core$IFn$_invoke$arity$1(properties__$2) : set_properties_BANG_.call(null,properties__$2)));
}));
}));
}),cljs.core.PersistentVector.EMPTY);

return daiquiri.core.create_element("div",{'className':"flex flex-col gap-1"},[daiquiri.core.create_element("div",{'className':"flex flex-row justify-between gap-1 items-center px-1 pb-1 border-b"},[daiquiri.core.create_element("label",{'className':"opacity-50 cursor select-none text-sm",'htmlFor':"built-in"},["Show built-in properties"]),daiquiri.interpreter.interpret((function (){var G__117724 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),"built-in",new cljs.core.Keyword(null,"value","value",305978217),cljs.core.deref(_STAR_private_property_QMARK_),new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),(function (){
return cljs.core.reset_BANG_(_STAR_private_property_QMARK_,cljs.core.not(cljs.core.deref(_STAR_private_property_QMARK_)));
})], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__117724) : logseq.shui.ui.checkbox.call(null,G__117724));
})())]),daiquiri.interpreter.interpret(frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__117602_SHARP_){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword(null,"value","value",305978217)],[new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__117602_SHARP_),new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(p1__117602_SHARP_)]);
}),properties__$1),(function (p__117757){
var map__117760 = p__117757;
var map__117760__$1 = cljs.core.__destructure_map(map__117760);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117760__$1,new cljs.core.Keyword(null,"value","value",305978217));
var db_ident = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117760__$1,new cljs.core.Keyword("db","ident","db/ident",-737096));
cljs.core.reset_BANG_(_STAR_mode,"property-value");

return cljs.core.reset_BANG_(_STAR_property,((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo()))?db_ident:cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(value)));
})))]);
}),null,"frontend.components.query.builder/property-select");
frontend.components.query.builder.property_value_select_inner = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_property,_STAR_private_property_QMARK_,_STAR_find,_STAR_tree,opts,loc,values,p__117782){
var map__117784 = p__117782;
var map__117784__$1 = cljs.core.__destructure_map(map__117784);
var db_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117784__$1,new cljs.core.Keyword(null,"db-graph?","db-graph?",-533494876));
var values_SINGLEQUOTE_ = cljs.core.cons(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),"Select all",new cljs.core.Keyword(null,"value","value",305978217),"Select all"], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__117775_SHARP_){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"original-value","original-value",-1784606036)],[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(p1__117775_SHARP_)),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(p1__117775_SHARP_)]);
}),values));
var find_SINGLEQUOTE_ = rum.core.react(_STAR_find);
return daiquiri.interpreter.interpret(frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$2(values_SINGLEQUOTE_,(function (p__117803){
var map__117804 = p__117803;
var map__117804__$1 = cljs.core.__destructure_map(map__117804);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117804__$1,new cljs.core.Keyword(null,"value","value",305978217));
var original_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117804__$1,new cljs.core.Keyword(null,"original-value","original-value",-1784606036));
var k = (cljs.core.truth_(db_graph_QMARK_)?(cljs.core.truth_(cljs.core.deref(_STAR_private_property_QMARK_))?new cljs.core.Keyword(null,"private-property","private-property",1080779061):new cljs.core.Keyword(null,"property","property",-1114278232)):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(find_SINGLEQUOTE_,new cljs.core.Keyword(null,"page","page",849072397)))?new cljs.core.Keyword(null,"page-property","page-property",-417044665):new cljs.core.Keyword(null,"property","property",-1114278232)
));
var x = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value,"Select all"))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,cljs.core.deref(_STAR_property)], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,cljs.core.deref(_STAR_property),original_value], null));
cljs.core.reset_BANG_(_STAR_property,null);

return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,x);
})));
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,frontend.db_mixins.query], null),"frontend.components.query.builder/property-value-select-inner");
frontend.components.query.builder.property_value_select = rum.core.lazy_build(rum.core.build_defc,(function (repo,_STAR_property,_STAR_private_property_QMARK_,_STAR_find,_STAR_tree,opts,loc){
var db_graph_QMARK_ = logseq.db.sqlite.util.db_based_graph_QMARK_(repo);
var vec__117807 = rum.core.use_state(null);
var values = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117807,(0),null);
var set_values_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117807,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (_property){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(db_graph_QMARK_)?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_property_values(cljs.core.deref(_STAR_property))),(function (result){
return promesa.protocols._promise(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__117822){
var map__117825 = p__117822;
var map__117825__$1 = cljs.core.__destructure_map(map__117825);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117825__$1,new cljs.core.Keyword(null,"label","label",1718410804));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),label,new cljs.core.Keyword(null,"value","value",305978217),label], null);
}),result));
}));
})):promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto____$1){
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
var vec__117851 = rum.core.use_state(null);
var values = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117851,(0),null);
var set_values_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117851,(1),null);
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
logseq.shui.hooks.use_effect_BANG_((function (){
var result = frontend.db.model.get_all_readable_classes(repo,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"except-root-class?","except-root-class?",-345353595),true], null));
return (set_values_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_values_BANG_.cljs$core$IFn$_invoke$arity$1(result) : set_values_BANG_.call(null,result));
}),cljs.core.PersistentVector.EMPTY);

var items = cljs.core.sort.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),values));
return daiquiri.interpreter.interpret(frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$2(items,(function (p__117861){
var map__117862 = p__117861;
var map__117862__$1 = cljs.core.__destructure_map(map__117862);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117862__$1,new cljs.core.Keyword(null,"value","value",305978217));
return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [((db_based_QMARK_)?new cljs.core.Keyword(null,"tags","tags",1771418977):new cljs.core.Keyword(null,"page-tags","page-tags",-1009436025)),value], null));
})));
}),null,"frontend.components.query.builder/tags");
frontend.components.query.builder.page_search = rum.core.lazy_build(rum.core.build_defc,(function (on_chosen){
var vec__117869 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var result = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117869,(0),null);
var set_result_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117869,(1),null);
var vec__117872 = (logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.hooks.use_state.cljs$core$IFn$_invoke$arity$1(null) : logseq.shui.hooks.use_state.call(null,null));
var loading_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117872,(0),null);
var set_loading_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__117872,(1),null);
logseq.shui.hooks.use_effect_BANG_((function (){
(set_loading_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_loading_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_loading_BANG_.call(null,true));

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","get-all-page-titles","thread-api/get-all-page-titles",1191294363),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo()], 0))),(function (result__$1){
return promesa.protocols._mcat(promesa.protocols._promise((set_result_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_result_BANG_.cljs$core$IFn$_invoke$arity$1(result__$1) : set_result_BANG_.call(null,result__$1))),(function (___41611__auto__){
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
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),(function (){var G__117891 = cljs.core.deref(_STAR_mode);
switch (G__117891) {
case "property":
return frontend.components.query.builder.property_select(_STAR_mode,_STAR_property,_STAR_private_property_QMARK_);

break;
case "property-value":
return frontend.components.query.builder.property_value_select(repo,_STAR_property,_STAR_private_property_QMARK_,_STAR_find,_STAR_tree,opts,loc);

break;
case "sample":
return frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$2(cljs.core.range.cljs$core$IFn$_invoke$arity$2((1),(101)),(function (p__117895){
var map__117896 = p__117895;
var map__117896__$1 = cljs.core.__destructure_map(map__117896);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117896__$1,new cljs.core.Keyword(null,"value","value",305978217));
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
return frontend.components.query.builder.page_search((function (p__117914){
var map__117919 = p__117914;
var map__117919__$1 = cljs.core.__destructure_map(map__117919);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117919__$1,new cljs.core.Keyword(null,"value","value",305978217));
return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page","page",849072397),value], null));
}));

break;
case "page reference":
return frontend.components.query.builder.page_search((function (p__117921){
var map__117922 = p__117921;
var map__117922__$1 = cljs.core.__destructure_map(map__117922);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117922__$1,new cljs.core.Keyword(null,"value","value",305978217));
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
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),(function (){var G__117941 = cljs.core.deref(_STAR_mode);
switch (G__117941) {
case "namespace":
var items = cljs.core.sort.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","title","block/title",710445684),frontend.db.file_based.model.get_all_namespace_parents(repo)));
return frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$2(items,(function (p__117943){
var map__117944 = p__117943;
var map__117944__$1 = cljs.core.__destructure_map(map__117944);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117944__$1,new cljs.core.Keyword(null,"value","value",305978217));
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
return frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$2(cljs.core.range.cljs$core$IFn$_invoke$arity$2((1),(101)),(function (p__117948){
var map__117949 = p__117948;
var map__117949__$1 = cljs.core.__destructure_map(map__117949);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117949__$1,new cljs.core.Keyword(null,"value","value",305978217));
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
return frontend.components.query.builder.page_search((function (p__117967){
var map__117971 = p__117967;
var map__117971__$1 = cljs.core.__destructure_map(map__117971);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117971__$1,new cljs.core.Keyword(null,"value","value",305978217));
return frontend.components.query.builder.append_tree_BANG_(_STAR_tree,opts,loc,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page","page",849072397),value], null));
}));

break;
case "page reference":
return frontend.components.query.builder.page_search((function (p__117975){
var map__117976 = p__117975;
var map__117976__$1 = cljs.core.__destructure_map(map__117976);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__117976__$1,new cljs.core.Keyword(null,"value","value",305978217));
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
var operator_QMARK_ = (function (p1__117996_SHARP_){
return cljs.core.contains_QMARK_(frontend.handler.query.builder.operators_set,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(p1__117996_SHARP_));
});
var attrs118430 = (cljs.core.truth_(cljs.core.deref(_STAR_mode))?((operator_QMARK_(cljs.core.deref(_STAR_mode)))?null:((db_based_QMARK_)?frontend.components.query.builder.db_based_query_filter_picker(state,_STAR_find,_STAR_tree,loc,clause,opts):frontend.components.query.builder.file_based_query_filter_picker(state,_STAR_find,_STAR_tree,loc,clause,opts))):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),((db_based_QMARK_)?null:new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),(cljs.core.truth_(cljs.core.deref(_STAR_find))?null:new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.items-center.p-2.justify-between","div.flex.flex-row.items-center.p-2.justify-between",1859527721),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ml-2","div.ml-2",1561421207),"Find: "], null),frontend.components.query.builder.page_block_selector(_STAR_find)], null)),(cljs.core.truth_(cljs.core.deref(_STAR_find))?null:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hr.m-0","hr.m-0",-256784560)], null))], null)),frontend.components.query.builder.select.cljs$core$IFn$_invoke$arity$3(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.name,filters_and_ops),(function (p__118445){
var map__118446 = p__118445;
var map__118446__$1 = cljs.core.__destructure_map(map__118446);
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__118446__$1,new cljs.core.Keyword(null,"value","value",305978217));
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
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs118430))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["query-builder-picker"], null)], null),attrs118430], 0))):{'className':"query-builder-picker"}),((cljs.core.map_QMARK_(attrs118430))?null:[daiquiri.interpreter.interpret(attrs118430)]));
}),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
frontend.state.clear_selection_BANG_();

return state;
})], null),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.query.builder","mode","frontend.components.query.builder/mode",2020350070)),rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.components.query.builder","property","frontend.components.query.builder/property",-278387025)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.query.builder","private-property?","frontend.components.query.builder/private-property?",-1019066779))], null),"frontend.components.query.builder/picker");
frontend.components.query.builder.add_filter = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_find,_STAR_tree,loc,clause){
return daiquiri.interpreter.interpret((function (){var G__118481 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"class","class",-2030961996),"jtrigger !px-1 h-6 add-filter text-muted-foreground",new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),frontend.util.stop_propagation,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var G__118489 = e.target;
var G__118490 = (function (p__118495){
var map__118496 = p__118495;
var map__118496__$1 = cljs.core.__destructure_map(map__118496);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__118496__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
return frontend.components.query.builder.picker(_STAR_find,_STAR_tree,loc,clause,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"toggle-fn","toggle-fn",-1172657425),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(id) : logseq.shui.ui.popup_hide_BANG_.call(null,id));
})], null));
});
var G__118491 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__118489,G__118490,G__118491) : logseq.shui.ui.popup_show_BANG_.call(null,G__118489,G__118490,G__118491));
})], null);
var G__118482 = frontend.ui.icon("plus",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(14)], null));
var G__118483 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null),loc))?"Filter":null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__118481,G__118482,G__118483) : logseq.shui.ui.button.call(null,G__118481,G__118482,G__118483));
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
var G__118514 = cljs.core.second(clause);
return (frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1 ? frontend.util.ref.__GT_page_ref.cljs$core$IFn$_invoke$arity$1(G__118514) : frontend.util.ref.__GT_page_ref.call(null,G__118514));
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
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(((((frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(frontend.state.get_current_repo())) && (cljs.core.qualified_keyword_QMARK_(cljs.core.second(clause)))))?new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__118529 = cljs.core.second(clause);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__118529) : frontend.db.entity.call(null,G__118529));
})()):(function (){var G__118530 = cljs.core.second(clause);
if((G__118530 == null)){
return null;
} else {
return cljs.core.name(G__118530);
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
var vec__118535 = clause;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118535,(0),null);
var _property = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118535,(1),null);
var start = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118535,(2),null);
var end = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118535,(3),null);
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
var G__119157__delegate = function (_STAR_tree,loc,clause,p__118565){
var map__118568 = p__118565;
var map__118568__$1 = cljs.core.__destructure_map(map__118568);
var operator_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__118568__$1,new cljs.core.Keyword(null,"operator?","operator?",68029935));
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
})], null),"Unwrap"], null):null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium.text-sm","div.font-medium.text-sm",619848115),"Wrap this filter with: "], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.gap-2","div.flex.flex-row.gap-2",-1457313917),(function (){var iter__5480__auto__ = (function frontend$components$query$builder$iter__118589(s__118590){
return (new cljs.core.LazySeq(null,(function (){
var s__118590__$1 = s__118590;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__118590__$1);
if(temp__5804__auto__){
var s__118590__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__118590__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__118590__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__118592 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__118591 = (0);
while(true){
if((i__118591 < size__5479__auto__)){
var op = cljs.core._nth(c__5478__auto__,i__118591);
cljs.core.chunk_append(b__118592,frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(clojure.string.upper_case(cljs.core.name(op)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"intent","intent",-390846953),"logseq",new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__118591,op,c__5478__auto__,size__5479__auto__,b__118592,s__118590__$2,temp__5804__auto__,map__118568,map__118568__$1,operator_QMARK_){
return (function (){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_tree,((function (i__118591,op,c__5478__auto__,size__5479__auto__,b__118592,s__118590__$2,temp__5804__auto__,map__118568,map__118568__$1,operator_QMARK_){
return (function (q){
var loc_SINGLEQUOTE_ = (cljs.core.truth_(operator_QMARK_)?cljs.core.vec(cljs.core.butlast(loc)):loc);
return frontend.handler.query.builder.wrap_operator(q,loc_SINGLEQUOTE_,op);
});})(i__118591,op,c__5478__auto__,size__5479__auto__,b__118592,s__118590__$2,temp__5804__auto__,map__118568,map__118568__$1,operator_QMARK_))
);

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
});})(i__118591,op,c__5478__auto__,size__5479__auto__,b__118592,s__118590__$2,temp__5804__auto__,map__118568,map__118568__$1,operator_QMARK_))
], 0)));

var G__119161 = (i__118591 + (1));
i__118591 = G__119161;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__118592),frontend$components$query$builder$iter__118589(cljs.core.chunk_rest(s__118590__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__118592),null);
}
} else {
var op = cljs.core.first(s__118590__$2);
return cljs.core.cons(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(clojure.string.upper_case(cljs.core.name(op)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"intent","intent",-390846953),"logseq",new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (op,s__118590__$2,temp__5804__auto__,map__118568,map__118568__$1,operator_QMARK_){
return (function (){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_tree,(function (q){
var loc_SINGLEQUOTE_ = (cljs.core.truth_(operator_QMARK_)?cljs.core.vec(cljs.core.butlast(loc)):loc);
return frontend.handler.query.builder.wrap_operator(q,loc_SINGLEQUOTE_,op);
}));

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
});})(op,s__118590__$2,temp__5804__auto__,map__118568,map__118568__$1,operator_QMARK_))
], 0)),frontend$components$query$builder$iter__118589(cljs.core.rest(s__118590__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(frontend.handler.query.builder.operators);
})()], null),(cljs.core.truth_(operator_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium.text-sm","div.font-medium.text-sm",619848115),"Replace with: "], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-row.gap-2","div.flex.flex-row.gap-2",-1457313917),(function (){var iter__5480__auto__ = (function frontend$components$query$builder$iter__118622(s__118623){
return (new cljs.core.LazySeq(null,(function (){
var s__118623__$1 = s__118623;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__118623__$1);
if(temp__5804__auto__){
var s__118623__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__118623__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__118623__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__118625 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__118624 = (0);
while(true){
if((i__118624 < size__5479__auto__)){
var op = cljs.core._nth(c__5478__auto__,i__118624);
cljs.core.chunk_append(b__118625,frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(clojure.string.upper_case(cljs.core.name(op)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"intent","intent",-390846953),"logseq",new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__118624,op,c__5478__auto__,size__5479__auto__,b__118625,s__118623__$2,temp__5804__auto__,map__118568,map__118568__$1,operator_QMARK_){
return (function (){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_tree,((function (i__118624,op,c__5478__auto__,size__5479__auto__,b__118625,s__118623__$2,temp__5804__auto__,map__118568,map__118568__$1,operator_QMARK_){
return (function (q){
return frontend.handler.query.builder.replace_element(q,loc,op);
});})(i__118624,op,c__5478__auto__,size__5479__auto__,b__118625,s__118623__$2,temp__5804__auto__,map__118568,map__118568__$1,operator_QMARK_))
);

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
});})(i__118624,op,c__5478__auto__,size__5479__auto__,b__118625,s__118623__$2,temp__5804__auto__,map__118568,map__118568__$1,operator_QMARK_))
], 0)));

var G__119168 = (i__118624 + (1));
i__118624 = G__119168;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__118625),frontend$components$query$builder$iter__118622(cljs.core.chunk_rest(s__118623__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__118625),null);
}
} else {
var op = cljs.core.first(s__118623__$2);
return cljs.core.cons(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(clojure.string.upper_case(cljs.core.name(op)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"intent","intent",-390846953),"logseq",new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (op,s__118623__$2,temp__5804__auto__,map__118568,map__118568__$1,operator_QMARK_){
return (function (){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_tree,(function (q){
return frontend.handler.query.builder.replace_element(q,loc,op);
}));

return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
});})(op,s__118623__$2,temp__5804__auto__,map__118568,map__118568__$1,operator_QMARK_))
], 0)),frontend$components$query$builder$iter__118622(cljs.core.rest(s__118623__$2)));
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
return daiquiri.core.create_element("a",{'onClick':(function (p1__118548_SHARP_){
var G__118648 = p1__118548_SHARP_.target;
var G__118649 = popup;
var G__118650 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__118648,G__118649,G__118650) : logseq.shui.ui.popup_show_BANG_.call(null,G__118648,G__118649,G__118650));
}),'className':"flex text-sm query-clause"},[daiquiri.interpreter.interpret(clause)]);
} else {
return daiquiri.core.create_element("div",{'className':"flex flex-row items-center gap-2 px-1 rounded border query-clause-btn"},[daiquiri.core.create_element("a",{'onClick':(function (p1__118553_SHARP_){
var G__118654 = p1__118553_SHARP_.target;
var G__118655 = popup;
var G__118656 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__118654,G__118655,G__118656) : logseq.shui.ui.popup_show_BANG_.call(null,G__118654,G__118655,G__118656));
}),'className':"flex query-clause"},[daiquiri.interpreter.interpret(frontend.components.query.builder.dsl_human_output(clause))])]);
}
};
var G__119157 = function (_STAR_tree,loc,clause,var_args){
var p__118565 = null;
if (arguments.length > 3) {
var G__119182__i = 0, G__119182__a = new Array(arguments.length -  3);
while (G__119182__i < G__119182__a.length) {G__119182__a[G__119182__i] = arguments[G__119182__i + 3]; ++G__119182__i;}
  p__118565 = new cljs.core.IndexedSeq(G__119182__a,0,null);
} 
return G__119157__delegate.call(this,_STAR_tree,loc,clause,p__118565);};
G__119157.cljs$lang$maxFixedArity = 3;
G__119157.cljs$lang$applyTo = (function (arglist__119184){
var _STAR_tree = cljs.core.first(arglist__119184);
arglist__119184 = cljs.core.next(arglist__119184);
var loc = cljs.core.first(arglist__119184);
arglist__119184 = cljs.core.next(arglist__119184);
var clause = cljs.core.first(arglist__119184);
var p__118565 = cljs.core.rest(arglist__119184);
return G__119157__delegate(_STAR_tree,loc,clause,p__118565);
});
G__119157.cljs$core$IFn$_invoke$arity$variadic = G__119157__delegate;
return G__119157;
})()
,null,"frontend.components.query.builder/clause-inner");
frontend.components.query.builder.clause = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_tree,_STAR_find,loc,clauses){
if(cljs.core.seq(clauses)){
var attrs118732 = (function (){var operator = cljs.core.first(clauses);
var kind = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(operator);
if(cljs.core.truth_((frontend.handler.query.builder.operators_set.cljs$core$IFn$_invoke$arity$1 ? frontend.handler.query.builder.operators_set.cljs$core$IFn$_invoke$arity$1(kind) : frontend.handler.query.builder.operators_set.call(null,kind)))){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.operator-clause.flex.flex-row.items-center","div.operator-clause.flex.flex-row.items-center",-1542341153),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-level","data-level",1364295892),cljs.core.count(loc)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.clause-bracket","div.clause-bracket",-988173709),"("], null),(function (){var G__118739 = _STAR_tree;
var G__118740 = _STAR_find;
var G__118741 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(loc,(0));
var G__118742 = kind;
var G__118743 = cljs.core.rest(clauses);
return (frontend.components.query.builder.clauses_group.cljs$core$IFn$_invoke$arity$5 ? frontend.components.query.builder.clauses_group.cljs$core$IFn$_invoke$arity$5(G__118739,G__118740,G__118741,G__118742,G__118743) : frontend.components.query.builder.clauses_group.call(null,G__118739,G__118740,G__118741,G__118742,G__118743));
})(),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.clause-bracket","div.clause-bracket",-988173709),")"], null)], null);
} else {
return frontend.components.query.builder.clause_inner(_STAR_tree,loc,clauses);
}
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs118732))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["query-builder-clause"], null)], null),attrs118732], 0))):{'className':"query-builder-clause"}),((cljs.core.map_QMARK_(attrs118732))?null:[daiquiri.interpreter.interpret(attrs118732)]));
} else {
return null;
}
}),null,"frontend.components.query.builder/clause");
frontend.components.query.builder.clauses_group = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_tree,_STAR_find,loc,kind,clauses){
var parens_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null))) && (((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(kind,new cljs.core.Keyword(null,"and","and",-971899817))) || ((cljs.core.count(clauses) > (1))))));
var attrs118758 = ((parens_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.clause-bracket","div.clause-bracket",-988173709),"("], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs118758))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["clauses-group"], null)], null),attrs118758], 0))):{'className':"clauses-group"}),((cljs.core.map_QMARK_(attrs118758))?[((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(kind,new cljs.core.Keyword(null,"and","and",-971899817))) && ((cljs.core.count(clauses) <= (1)))))))?null:frontend.components.query.builder.clause_inner(_STAR_tree,loc,clojure.string.upper_case(cljs.core.name(kind)),new cljs.core.Keyword(null,"operator?","operator?",68029935),true)),daiquiri.interpreter.interpret(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (i,item){
return frontend.components.query.builder.clause(_STAR_tree,_STAR_find,cljs.core.update.cljs$core$IFn$_invoke$arity$3(loc,(cljs.core.count(loc) - (1)),(function (p1__118750_SHARP_){
return ((p1__118750_SHARP_ + i) + (1));
})),item);
}),clauses)),((parens_QMARK_)?daiquiri.core.create_element("div",{'className':"clause-bracket"},[")"]):null),((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null)))?frontend.components.query.builder.add_filter(_STAR_find,_STAR_tree,loc,cljs.core.PersistentVector.EMPTY):null)]:[daiquiri.interpreter.interpret(attrs118758),((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(kind,new cljs.core.Keyword(null,"and","and",-971899817))) && ((cljs.core.count(clauses) <= (1)))))))?null:frontend.components.query.builder.clause_inner(_STAR_tree,loc,clojure.string.upper_case(cljs.core.name(kind)),new cljs.core.Keyword(null,"operator?","operator?",68029935),true)),daiquiri.interpreter.interpret(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (i,item){
return frontend.components.query.builder.clause(_STAR_tree,_STAR_find,cljs.core.update.cljs$core$IFn$_invoke$arity$3(loc,(cljs.core.count(loc) - (1)),(function (p1__118750_SHARP_){
return ((p1__118750_SHARP_ + i) + (1));
})),item);
}),clauses)),((parens_QMARK_)?daiquiri.core.create_element("div",{'className':"clause-bracket"},[")"]):null),((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(loc,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null)))?frontend.components.query.builder.add_filter(_STAR_find,_STAR_tree,loc,cljs.core.PersistentVector.EMPTY):null)]));
}),null,"frontend.components.query.builder/clauses-group");
frontend.components.query.builder.clause_tree = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_tree,_STAR_find){
var tree = rum.core.react(_STAR_tree);
var kind = (function (){var G__118827 = cljs.core.first(tree);
var fexpr__118826 = cljs.core.set(frontend.handler.query.builder.operators);
return (fexpr__118826.cljs$core$IFn$_invoke$arity$1 ? fexpr__118826.cljs$core$IFn$_invoke$arity$1(G__118827) : fexpr__118826.call(null,G__118827));
})();
var vec__118823 = (cljs.core.truth_(kind)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [kind,cljs.core.rest(tree)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"and","and",-971899817),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.deref(tree)], null)], null));
var kind_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118823,(0),null);
var clauses = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__118823,(1),null);
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
return daiquiri.core.create_element("div",{'className':"cp__query-builder"},[(function (){var attrs118907 = ((((cljs.core.seq(cljs.core.deref(_STAR_tree))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_tree),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"and","and",-971899817)], null)))))?frontend.components.query.builder.clause_tree(_STAR_tree,_STAR_find):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs118907))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cp__query-builder-filter"], null)], null),attrs118907], 0))):{'className':"cp__query-builder-filter"}),((cljs.core.map_QMARK_(attrs118907))?[frontend.components.query.builder.add_filter(_STAR_find,_STAR_tree,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null),cljs.core.PersistentVector.EMPTY)]:[daiquiri.interpreter.interpret(attrs118907),frontend.components.query.builder.add_filter(_STAR_find,_STAR_tree,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0)], null),cljs.core.PersistentVector.EMPTY)]));
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
var block__$1 = (function (){var G__118939 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null);
return (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(G__118939) : frontend.db.entity.call(null,G__118939));
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
