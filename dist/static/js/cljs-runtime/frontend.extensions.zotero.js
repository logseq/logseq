goog.provide('frontend.extensions.zotero');
frontend.extensions.zotero.term_chan = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$0();
frontend.extensions.zotero.debounce_chan_mult = cljs.core.async.mult(frontend.extensions.zotero.api.debounce(frontend.extensions.zotero.term_chan,(500)));
frontend.extensions.zotero.zotero_search_item = rum.core.lazy_build(rum.core.build_defc,(function (p__120872,id){
var map__120873 = p__120872;
var map__120873__$1 = cljs.core.__destructure_map(map__120873);
var item = map__120873__$1;
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__120873__$1,new cljs.core.Keyword(null,"data","data",-232669377));
var vec__120874 = rum.core.use_state(false);
var is_creating_page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120874,(0),null);
var set_is_creating_page_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120874,(1),null);
var title = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(data);
var type = new cljs.core.Keyword(null,"item-type","item-type",-73995695).cljs$core$IFn$_invoke$arity$1(data);
var abstract$ = [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"abstract-note","abstract-note",338534968).cljs$core$IFn$_invoke$arity$1(data),(0),(200)),"..."].join('');
return daiquiri.core.create_element("div",{'onClick':(function (){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_120894){
var state_val_120895 = (state_120894[(1)]);
if((state_val_120895 === (1))){
var inst_120881 = (set_is_creating_page_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_is_creating_page_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_is_creating_page_BANG_.call(null,true));
var inst_120883 = [new cljs.core.Keyword(null,"block-dom-id","block-dom-id",1375977027)];
var inst_120885 = [id];
var inst_120886 = cljs.core.PersistentHashMap.fromArrays(inst_120883,inst_120885);
var inst_120887 = frontend.extensions.zotero.handler.create_zotero_page.cljs$core$IFn$_invoke$arity$2(item,inst_120886);
var state_120894__$1 = (function (){var statearr_120899 = state_120894;
(statearr_120899[(7)] = inst_120881);

return statearr_120899;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_120894__$1,(2),inst_120887);
} else {
if((state_val_120895 === (2))){
var inst_120890 = (state_120894[(2)]);
var inst_120891 = (set_is_creating_page_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_is_creating_page_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_is_creating_page_BANG_.call(null,false));
var state_120894__$1 = (function (){var statearr_120901 = state_120894;
(statearr_120901[(8)] = inst_120890);

return statearr_120901;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_120894__$1,inst_120891);
} else {
return null;
}
}
});
return (function() {
var frontend$extensions$zotero$state_machine__32004__auto__ = null;
var frontend$extensions$zotero$state_machine__32004__auto____0 = (function (){
var statearr_120906 = [null,null,null,null,null,null,null,null,null];
(statearr_120906[(0)] = frontend$extensions$zotero$state_machine__32004__auto__);

(statearr_120906[(1)] = (1));

return statearr_120906;
});
var frontend$extensions$zotero$state_machine__32004__auto____1 = (function (state_120894){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_120894);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e120907){var ex__32007__auto__ = e120907;
var statearr_120910_121883 = state_120894;
(statearr_120910_121883[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_120894[(4)]))){
var statearr_120911_121885 = state_120894;
(statearr_120911_121885[(1)] = cljs.core.first((state_120894[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__121887 = state_120894;
state_120894 = G__121887;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$extensions$zotero$state_machine__32004__auto__ = function(state_120894){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$state_machine__32004__auto____0.call(this);
case 1:
return frontend$extensions$zotero$state_machine__32004__auto____1.call(this,state_120894);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$state_machine__32004__auto____0;
frontend$extensions$zotero$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$state_machine__32004__auto____1;
return frontend$extensions$zotero$state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_120914 = f__32196__auto__();
(statearr_120914[(6)] = c__32195__auto__);

return statearr_120914;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
}),'className':"zotero-search-item px-2 py-2 border-b cursor-pointer border-solid last:border-none relative"},[daiquiri.interpreter.interpret(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.font-medium.mb-1.mr-1.text-sm","span.font-medium.mb-1.mr-1.text-sm",1021597182),title], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.zotero-search-item-type.text-xs.p-1.rounded","span.zotero-search-item-type.text-xs.p-1.rounded",1831300718),type], null)], null)], null),(function (){var attrs120921 = abstract$;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs120921))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm","opacity-60"], null)], null),attrs120921], 0))):{'className':"text-sm opacity-60"}),((cljs.core.map_QMARK_(attrs120921))?null:[attrs120921]));
})()], null)),(cljs.core.truth_(is_creating_page)?daiquiri.core.create_element("div",{'className':"zotero-search-item-loading-indicator"},[(function (){var attrs120923 = frontend.components.svg.refresh.cljs$core$IFn$_invoke$arity$0();
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs120923))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["animate-spin-reverse"], null)], null),attrs120923], 0))):{'className':"animate-spin-reverse"}),((cljs.core.map_QMARK_(attrs120923))?null:[daiquiri.interpreter.interpret(attrs120923)]));
})()]):null)]);
}),null,"frontend.extensions.zotero/zotero-search-item");
frontend.extensions.zotero.zotero_search = rum.core.lazy_build(rum.core.build_defc,(function (id){
var vec__120927 = rum.core.use_state("");
var term = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120927,(0),null);
var set_term_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120927,(1),null);
var vec__120930 = rum.core.use_state(cljs.core.PersistentVector.EMPTY);
var search_result = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120930,(0),null);
var set_search_result_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120930,(1),null);
var vec__120933 = rum.core.use_state("");
var prev_page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120933,(0),null);
var set_prev_page_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120933,(1),null);
var vec__120936 = rum.core.use_state("");
var next_page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120936,(0),null);
var set_next_page_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120936,(1),null);
var vec__120939 = rum.core.use_state("");
var prev_search_term = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120939,(0),null);
var set_prev_search_term_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120939,(1),null);
var vec__120942 = rum.core.use_state(null);
var search_error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120942,(0),null);
var set_search_error_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120942,(1),null);
var vec__120945 = rum.core.use_state(false);
var is_searching = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120945,(0),null);
var set_is_searching_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__120945,(1),null);
var search_fn = (function (s_term,start){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_120978){
var state_val_120979 = (state_120978[(1)]);
if((state_val_120979 === (1))){
var inst_120950 = clojure.string.blank_QMARK_(s_term);
var state_120978__$1 = state_120978;
if(inst_120950){
var statearr_120981_121903 = state_120978__$1;
(statearr_120981_121903[(1)] = (2));

} else {
var statearr_120982_121905 = state_120978__$1;
(statearr_120982_121905[(1)] = (3));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120979 === (2))){
var state_120978__$1 = state_120978;
var statearr_120983_121907 = state_120978__$1;
(statearr_120983_121907[(2)] = null);

(statearr_120983_121907[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120979 === (3))){
var inst_120953 = (set_is_searching_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_is_searching_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_is_searching_BANG_.call(null,true));
var inst_120955 = frontend.extensions.zotero.api.query_top_items.cljs$core$IFn$_invoke$arity$2(s_term,start);
var state_120978__$1 = (function (){var statearr_120986 = state_120978;
(statearr_120986[(7)] = inst_120953);

return statearr_120986;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_120978__$1,(5),inst_120955);
} else {
if((state_val_120979 === (4))){
var inst_120976 = (state_120978[(2)]);
var state_120978__$1 = state_120978;
return cljs.core.async.impl.ioc_helpers.return_chan(state_120978__$1,inst_120976);
} else {
if((state_val_120979 === (5))){
var inst_120958 = (state_120978[(8)]);
var inst_120957 = (state_120978[(2)]);
var inst_120958__$1 = cljs.core.__destructure_map(inst_120957);
var inst_120959 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_120958__$1,new cljs.core.Keyword(null,"success","success",1890645906));
var inst_120960 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_120958__$1,new cljs.core.Keyword(null,"next","next",-117701485));
var inst_120961 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_120958__$1,new cljs.core.Keyword(null,"prev","prev",-1597069226));
var inst_120962 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_120958__$1,new cljs.core.Keyword(null,"result","result",1415092211));
var inst_120963 = inst_120959 === false;
var state_120978__$1 = (function (){var statearr_120987 = state_120978;
(statearr_120987[(8)] = inst_120958__$1);

(statearr_120987[(9)] = inst_120960);

(statearr_120987[(10)] = inst_120961);

(statearr_120987[(11)] = inst_120962);

return statearr_120987;
})();
if(cljs.core.truth_(inst_120963)){
var statearr_120988_121914 = state_120978__$1;
(statearr_120988_121914[(1)] = (6));

} else {
var statearr_120989_121915 = state_120978__$1;
(statearr_120989_121915[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120979 === (6))){
var inst_120958 = (state_120978[(8)]);
var inst_120965 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(inst_120958);
var inst_120966 = (set_search_error_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_search_error_BANG_.cljs$core$IFn$_invoke$arity$1(inst_120965) : set_search_error_BANG_.call(null,inst_120965));
var state_120978__$1 = state_120978;
var statearr_120990_121916 = state_120978__$1;
(statearr_120990_121916[(2)] = inst_120966);

(statearr_120990_121916[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120979 === (7))){
var inst_120960 = (state_120978[(9)]);
var inst_120961 = (state_120978[(10)]);
var inst_120962 = (state_120978[(11)]);
var inst_120968 = (set_prev_search_term_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_prev_search_term_BANG_.cljs$core$IFn$_invoke$arity$1(s_term) : set_prev_search_term_BANG_.call(null,s_term));
var inst_120969 = (set_next_page_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_next_page_BANG_.cljs$core$IFn$_invoke$arity$1(inst_120960) : set_next_page_BANG_.call(null,inst_120960));
var inst_120970 = (set_prev_page_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_prev_page_BANG_.cljs$core$IFn$_invoke$arity$1(inst_120961) : set_prev_page_BANG_.call(null,inst_120961));
var inst_120971 = (set_search_result_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_search_result_BANG_.cljs$core$IFn$_invoke$arity$1(inst_120962) : set_search_result_BANG_.call(null,inst_120962));
var state_120978__$1 = (function (){var statearr_120992 = state_120978;
(statearr_120992[(12)] = inst_120968);

(statearr_120992[(13)] = inst_120969);

(statearr_120992[(14)] = inst_120970);

return statearr_120992;
})();
var statearr_120993_121919 = state_120978__$1;
(statearr_120993_121919[(2)] = inst_120971);

(statearr_120993_121919[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120979 === (8))){
var inst_120973 = (state_120978[(2)]);
var inst_120974 = (set_is_searching_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_is_searching_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_is_searching_BANG_.call(null,false));
var state_120978__$1 = (function (){var statearr_120994 = state_120978;
(statearr_120994[(15)] = inst_120973);

return statearr_120994;
})();
var statearr_120995_121921 = state_120978__$1;
(statearr_120995_121921[(2)] = inst_120974);

(statearr_120995_121921[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
});
return (function() {
var frontend$extensions$zotero$state_machine__32004__auto__ = null;
var frontend$extensions$zotero$state_machine__32004__auto____0 = (function (){
var statearr_120999 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_120999[(0)] = frontend$extensions$zotero$state_machine__32004__auto__);

(statearr_120999[(1)] = (1));

return statearr_120999;
});
var frontend$extensions$zotero$state_machine__32004__auto____1 = (function (state_120978){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_120978);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e121001){var ex__32007__auto__ = e121001;
var statearr_121002_121924 = state_120978;
(statearr_121002_121924[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_120978[(4)]))){
var statearr_121003_121925 = state_120978;
(statearr_121003_121925[(1)] = cljs.core.first((state_120978[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__121928 = state_120978;
state_120978 = G__121928;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$extensions$zotero$state_machine__32004__auto__ = function(state_120978){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$state_machine__32004__auto____0.call(this);
case 1:
return frontend$extensions$zotero$state_machine__32004__auto____1.call(this,state_120978);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$state_machine__32004__auto____0;
frontend$extensions$zotero$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$state_machine__32004__auto____1;
return frontend$extensions$zotero$state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_121006 = f__32196__auto__();
(statearr_121006[(6)] = c__32195__auto__);

return statearr_121006;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
logseq.shui.hooks.use_effect_BANG_((function (){
var d_chan = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$0();
cljs.core.async.tap.cljs$core$IFn$_invoke$arity$2(frontend.extensions.zotero.debounce_chan_mult,d_chan);

var c__32195__auto___121929 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_121018){
var state_val_121019 = (state_121018[(1)]);
if((state_val_121019 === (1))){
var state_121018__$1 = state_121018;
var statearr_121021_121931 = state_121018__$1;
(statearr_121021_121931[(2)] = null);

(statearr_121021_121931[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_121019 === (2))){
var state_121018__$1 = state_121018;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_121018__$1,(4),d_chan);
} else {
if((state_val_121019 === (3))){
var inst_121016 = (state_121018[(2)]);
var state_121018__$1 = state_121018;
return cljs.core.async.impl.ioc_helpers.return_chan(state_121018__$1,inst_121016);
} else {
if((state_val_121019 === (4))){
var inst_121010 = (state_121018[(2)]);
var inst_121011 = search_fn(inst_121010,"0");
var state_121018__$1 = state_121018;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_121018__$1,(5),inst_121011);
} else {
if((state_val_121019 === (5))){
var inst_121013 = (state_121018[(2)]);
var state_121018__$1 = (function (){var statearr_121032 = state_121018;
(statearr_121032[(7)] = inst_121013);

return statearr_121032;
})();
var statearr_121034_121933 = state_121018__$1;
(statearr_121034_121933[(2)] = null);

(statearr_121034_121933[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
});
return (function() {
var frontend$extensions$zotero$state_machine__32004__auto__ = null;
var frontend$extensions$zotero$state_machine__32004__auto____0 = (function (){
var statearr_121040 = [null,null,null,null,null,null,null,null];
(statearr_121040[(0)] = frontend$extensions$zotero$state_machine__32004__auto__);

(statearr_121040[(1)] = (1));

return statearr_121040;
});
var frontend$extensions$zotero$state_machine__32004__auto____1 = (function (state_121018){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_121018);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e121041){var ex__32007__auto__ = e121041;
var statearr_121042_121935 = state_121018;
(statearr_121042_121935[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_121018[(4)]))){
var statearr_121044_121937 = state_121018;
(statearr_121044_121937[(1)] = cljs.core.first((state_121018[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__121939 = state_121018;
state_121018 = G__121939;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$extensions$zotero$state_machine__32004__auto__ = function(state_121018){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$state_machine__32004__auto____0.call(this);
case 1:
return frontend$extensions$zotero$state_machine__32004__auto____1.call(this,state_121018);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$state_machine__32004__auto____0;
frontend$extensions$zotero$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$state_machine__32004__auto____1;
return frontend$extensions$zotero$state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_121049 = f__32196__auto__();
(statearr_121049[(6)] = c__32195__auto___121929);

return statearr_121049;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));


return (function (){
return cljs.core.async.untap(frontend.extensions.zotero.debounce_chan_mult,d_chan);
});
}),cljs.core.PersistentVector.EMPTY);

if(frontend.extensions.zotero.setting.valid_QMARK_()){
} else {
frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"zotero-setting","zotero-setting",-1619504499)], null));

frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3("Please setup Zotero API key and user/group id first!",new cljs.core.Keyword(null,"warn","warn",-436710552),false);
}

return daiquiri.core.create_element("div",{'id':"zotero-search",'className':"zotero-search"},[daiquiri.core.create_element("div",{'className':"flex items-center input-wrap"},[daiquiri.core.create_element("input",{'autoFocus':true,'placeholder':"Search for your Zotero articles (title, author, text, anything)",'value':term,'onChange':rum.core.mark_sync_update((function (e){
var c__32195__auto___121962 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_121105){
var state_val_121106 = (state_121105[(1)]);
if((state_val_121106 === (1))){
var inst_121101 = frontend.util.evalue(e);
var state_121105__$1 = state_121105;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_121105__$1,(2),frontend.extensions.zotero.term_chan,inst_121101);
} else {
if((state_val_121106 === (2))){
var inst_121103 = (state_121105[(2)]);
var state_121105__$1 = state_121105;
return cljs.core.async.impl.ioc_helpers.return_chan(state_121105__$1,inst_121103);
} else {
return null;
}
}
});
return (function() {
var frontend$extensions$zotero$state_machine__32004__auto__ = null;
var frontend$extensions$zotero$state_machine__32004__auto____0 = (function (){
var statearr_121123 = [null,null,null,null,null,null,null];
(statearr_121123[(0)] = frontend$extensions$zotero$state_machine__32004__auto__);

(statearr_121123[(1)] = (1));

return statearr_121123;
});
var frontend$extensions$zotero$state_machine__32004__auto____1 = (function (state_121105){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_121105);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e121127){var ex__32007__auto__ = e121127;
var statearr_121129_121964 = state_121105;
(statearr_121129_121964[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_121105[(4)]))){
var statearr_121131_121965 = state_121105;
(statearr_121131_121965[(1)] = cljs.core.first((state_121105[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__121968 = state_121105;
state_121105 = G__121968;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$extensions$zotero$state_machine__32004__auto__ = function(state_121105){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$state_machine__32004__auto____0.call(this);
case 1:
return frontend$extensions$zotero$state_machine__32004__auto____1.call(this,state_121105);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$state_machine__32004__auto____0;
frontend$extensions$zotero$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$state_machine__32004__auto____1;
return frontend$extensions$zotero$state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_121135 = f__32196__auto__();
(statearr_121135[(6)] = c__32195__auto___121962);

return statearr_121135;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));


var G__121137 = frontend.util.evalue(e);
return (set_term_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_term_BANG_.cljs$core$IFn$_invoke$arity$1(G__121137) : set_term_BANG_.call(null,G__121137));
})),'className':"flex-1 focus:outline-none"},[]),(cljs.core.truth_(is_searching)?daiquiri.interpreter.interpret(frontend.ui.loading.cljs$core$IFn$_invoke$arity$1("")):null)]),(cljs.core.truth_(search_error)?daiquiri.core.create_element("div",{'className':"h-2 text-sm text-error mb-2"},[["Search error: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(search_error),""].join('')]):null),((cljs.core.seq(search_result))?(function (){var attrs121099 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (item){
return rum.core.with_key(frontend.extensions.zotero.zotero_search_item(item,id),new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(item));
}),search_result);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs121099))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["p-2"], null)], null),attrs121099], 0))):{'className':"p-2"}),((cljs.core.map_QMARK_(attrs121099))?[((clojure.string.blank_QMARK_(prev_page))?null:daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("prev",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(goog.dom.getElement("zotero-search").parentNode.scrollTop = (0));

return search_fn(prev_search_term,prev_page);
})], 0)))),((clojure.string.blank_QMARK_(next_page))?null:daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("next",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(goog.dom.getElement("zotero-search").parentNode.scrollTop = (0));

return search_fn(prev_search_term,next_page);
})], 0))))]:[daiquiri.interpreter.interpret(attrs121099),((clojure.string.blank_QMARK_(prev_page))?null:daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("prev",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(goog.dom.getElement("zotero-search").parentNode.scrollTop = (0));

return search_fn(prev_search_term,prev_page);
})], 0)))),((clojure.string.blank_QMARK_(next_page))?null:daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("next",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(goog.dom.getElement("zotero-search").parentNode.scrollTop = (0));

return search_fn(prev_search_term,next_page);
})], 0))))]));
})():null)]);
}),null,"frontend.extensions.zotero/zotero-search");
frontend.extensions.zotero.user_or_group_setting = rum.core.lazy_build(rum.core.build_defcs,(function (state){
return daiquiri.core.create_element("div",null,[daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'className':"title w-72",'htmlFor':"zotero_type"},["Zotero user or group?"]),daiquiri.core.create_element("div",{'className':"mt-1 sm:mt-0 sm:col-span-2"},[daiquiri.core.create_element("div",{'className':"max-w-lg rounded-md"},[daiquiri.core.create_element("select",{'value':cljs.core.name(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"type","type",1174270348))),'onChange':rum.core.mark_sync_update((function (e){
var type = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(clojure.string.lower_case(frontend.util.evalue(e)));
return frontend.extensions.zotero.setting.set_setting_BANG_(new cljs.core.Keyword(null,"type","type",1174270348),type);
})),'className':"form-select"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$extensions$zotero$iter__121178(s__121179){
return (new cljs.core.LazySeq(null,(function (){
var s__121179__$1 = s__121179;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__121179__$1);
if(temp__5804__auto__){
var s__121179__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__121179__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__121179__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__121181 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__121180 = (0);
while(true){
if((i__121180 < size__5479__auto__)){
var type = cljs.core._nth(c__5478__auto__,i__121180);
cljs.core.chunk_append(b__121181,daiquiri.core.create_element("option",{'key':type,'value':type},[clojure.string.capitalize(type)]));

var G__121986 = (i__121180 + (1));
i__121180 = G__121986;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__121181),frontend$extensions$zotero$iter__121178(cljs.core.chunk_rest(s__121179__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__121181),null);
}
} else {
var type = cljs.core.first(s__121179__$2);
return cljs.core.cons(daiquiri.core.create_element("option",{'key':type,'value':type},[clojure.string.capitalize(type)]),frontend$extensions$zotero$iter__121178(cljs.core.rest(s__121179__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.name,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"user","user",1532431356),new cljs.core.Keyword(null,"group","group",582596132)], null)));
})())])])])]),daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'className':"title w-72",'htmlFor':"zotero_type_id"},["User or Group ID"]),daiquiri.core.create_element("div",{'className':"mt-1 sm:mt-0 sm:col-span-2"},[daiquiri.core.create_element("div",{'className':"max-w-lg rounded-md"},[daiquiri.core.create_element("input",{'defaultValue':frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"type-id","type-id",2030062700)),'placeholder':"User/Group id",'onBlur':(function (e){
return frontend.extensions.zotero.setting.set_setting_BANG_(new cljs.core.Keyword(null,"type-id","type-id",2030062700),frontend.util.evalue(e));
}),'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.reset_BANG_(new cljs.core.Keyword("frontend.extensions.zotero","type-id","frontend.extensions.zotero/type-id",1314510795).cljs$core$IFn$_invoke$arity$1(state),frontend.util.evalue(e));
})),'className':"form-input block"},[])])])]),(((((!(clojure.string.blank_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(new cljs.core.Keyword("frontend.extensions.zotero","type-id","frontend.extensions.zotero/type-id",1314510795).cljs$core$IFn$_invoke$arity$1(state))))))) && (cljs.core.not(cljs.core.re_matches(/^\d+$/,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(new cljs.core.Keyword("frontend.extensions.zotero","type-id","frontend.extensions.zotero/type-id",1314510795).cljs$core$IFn$_invoke$arity$1(state))))))))?frontend.ui.admonition(new cljs.core.Keyword(null,"warning","warning",-1685650671),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-error","p.text-error",1957631830),"User ID is different from username and can be found on the ",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a","a",-2123407586),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"href","href",-793805698),"https://www.zotero.org/settings/keys",new cljs.core.Keyword(null,"target","target",253001721),"_blank"], null),"https://www.zotero.org/settings/keys"], null)," page, it's a number of digits"], null)):null)]);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"type-id","type-id",2030062700)),new cljs.core.Keyword("frontend.extensions.zotero","type-id","frontend.extensions.zotero/type-id",1314510795)),rum.core.reactive], null),"frontend.extensions.zotero/user-or-group-setting");
frontend.extensions.zotero.overwrite_mode_setting = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",null,[daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'className':"title w-72",'htmlFor':"zotero_overwrite_mode"},["Overwrite existing item page?"]),daiquiri.core.create_element("div",null,[(function (){var attrs121218 = frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"overwrite-mode?","overwrite-mode?",-1715124409)),(function (){
return frontend.extensions.zotero.setting.set_setting_BANG_(new cljs.core.Keyword(null,"overwrite-mode?","overwrite-mode?",-1715124409),cljs.core.not(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"overwrite-mode?","overwrite-mode?",-1715124409))));
}),true);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs121218))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["rounded-md","sm:max-w-xs"], null)], null),attrs121218], 0))):{'className':"rounded-md sm:max-w-xs"}),((cljs.core.map_QMARK_(attrs121218))?null:[daiquiri.interpreter.interpret(attrs121218)]));
})()])]),(cljs.core.truth_(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"overwrite-mode?","overwrite-mode?",-1715124409)))?frontend.ui.admonition(new cljs.core.Keyword(null,"warning","warning",-1685650671),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-error","p.text-error",1957631830),"Dangerous! This will delete and recreate Zotero existing page! Make sure to backup your notes first in case something goes wrong. Make sure you don't put any personal item in previous Zotero page and it's OK to overwrite the page!"], null)):null)]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.extensions.zotero/overwrite-mode-setting");
frontend.extensions.zotero.attachment_setting = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",null,[daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'className':"title w-72",'htmlFor':"zotero_include_attachment_links"},["Include attachment links?"]),daiquiri.core.create_element("div",null,[(function (){var attrs121244 = frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"include-attachments?","include-attachments?",1105323115)),(function (){
return frontend.extensions.zotero.setting.set_setting_BANG_(new cljs.core.Keyword(null,"include-attachments?","include-attachments?",1105323115),cljs.core.not(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"include-attachments?","include-attachments?",1105323115))));
}),true);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs121244))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["rounded-md","sm:max-w-xs"], null)], null),attrs121244], 0))):{'className':"rounded-md sm:max-w-xs"}),((cljs.core.map_QMARK_(attrs121244))?null:[daiquiri.interpreter.interpret(attrs121244)]));
})()])]),(cljs.core.truth_(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"include-attachments?","include-attachments?",1105323115)))?daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'className':"title w-72",'htmlFor':"zotero_attachments_block_text"},["Attachment under block of:"]),daiquiri.core.create_element("div",{'className':"mt-1 sm:mt-0 sm:col-span-2"},[daiquiri.core.create_element("div",{'className':"max-w-lg rounded-md"},[daiquiri.core.create_element("input",{'defaultValue':frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"attachments-block-text","attachments-block-text",455049244)),'onBlur':(function (e){
return frontend.extensions.zotero.setting.set_setting_BANG_(new cljs.core.Keyword(null,"attachments-block-text","attachments-block-text",455049244),frontend.util.evalue(e));
}),'className':"form-input block"},[])])])]):null),(cljs.core.truth_(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"include-attachments?","include-attachments?",1105323115)))?daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'className':"title w-72",'htmlFor':"zotero_linked_attachment_base_directory"},["Zotero linked attachment base directory",daiquiri.core.create_element("a",{'title':"If you store attached files in Zotero \u2014 the default \u2014 this setting does not affect you. It only applies to linked files. If you're using the ZotFile plugin to help with a linked-file workflow, you should configure it to store linked files within the base directory you've configured. Click to learn more.",'href':"https://www.zotero.org/support/preferences/advanced#linked_attachment_base_directory",'target':"_blank",'className':"ml-2"},[daiquiri.interpreter.interpret(frontend.components.svg.info())])]),daiquiri.core.create_element("div",{'className':"mt-1 sm:mt-0 sm:col-span-2"},[daiquiri.core.create_element("div",{'className':"max-w-lg rounded-md"},[daiquiri.core.create_element("input",{'defaultValue':frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"zotero-linked-attachment-base-directory","zotero-linked-attachment-base-directory",-799816118)),'placeholder':"/Users/Sarah/Dropbox",'onBlur':(function (e){
return frontend.extensions.zotero.setting.set_setting_BANG_(new cljs.core.Keyword(null,"zotero-linked-attachment-base-directory","zotero-linked-attachment-base-directory",-799816118),frontend.util.evalue(e));
}),'className':"form-input block"},[])])])]):null)]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.extensions.zotero/attachment-setting");
frontend.extensions.zotero.prefer_citekey_setting = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'title':"Make sure to install Better BibTeX and pin your item first",'className':"title w-72",'htmlFor':"zotero_prefer_citekey"},["Use citekey as your page title?"]),daiquiri.core.create_element("div",null,[(function (){var attrs121290 = frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"prefer-citekey?","prefer-citekey?",2120866291)),(function (){
return frontend.extensions.zotero.setting.set_setting_BANG_(new cljs.core.Keyword(null,"prefer-citekey?","prefer-citekey?",2120866291),cljs.core.not(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"prefer-citekey?","prefer-citekey?",2120866291))));
}),true);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs121290))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["rounded-md","sm:max-w-xs"], null)], null),attrs121290], 0))):{'className':"rounded-md sm:max-w-xs"}),((cljs.core.map_QMARK_(attrs121290))?null:[daiquiri.interpreter.interpret(attrs121290)]));
})()])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.extensions.zotero/prefer-citekey-setting");
frontend.extensions.zotero.api_key_setting = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'className':"title w-72",'htmlFor':"zotero_api_key"},["Zotero API key"]),daiquiri.core.create_element("div",{'className':"mt-1 sm:mt-0 sm:col-span-2"},[daiquiri.core.create_element("div",{'className':"max-w-lg rounded-md"},[daiquiri.core.create_element("input",{'defaultValue':frontend.extensions.zotero.setting.api_key(),'placeholder':"Please enter your Zotero API key",'onBlur':(function (e){
return frontend.extensions.zotero.setting.set_api_key(frontend.util.evalue(e));
}),'className':"form-input block"},[])])])]);
}),null,"frontend.extensions.zotero/api-key-setting");
frontend.extensions.zotero.notes_setting = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",null,[daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'className':"title w-72",'htmlFor':"zotero_include_notes"},["Include notes?"]),daiquiri.core.create_element("div",null,[(function (){var attrs121333 = frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"include-notes?","include-notes?",1426313915)),(function (){
return frontend.extensions.zotero.setting.set_setting_BANG_(new cljs.core.Keyword(null,"include-notes?","include-notes?",1426313915),cljs.core.not(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"include-notes?","include-notes?",1426313915))));
}),true);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs121333))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["rounded-md","sm:max-w-xs"], null)], null),attrs121333], 0))):{'className':"rounded-md sm:max-w-xs"}),((cljs.core.map_QMARK_(attrs121333))?null:[daiquiri.interpreter.interpret(attrs121333)]));
})()])]),(cljs.core.truth_(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"include-notes?","include-notes?",1426313915)))?daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'className':"title",'htmlFor':"zotero_notes_block_text"},["Notes under block of:"]),daiquiri.core.create_element("div",{'className':"mt-1 sm:mt-0 sm:col-span-2"},[daiquiri.core.create_element("div",{'className':"max-w-lg rounded-md"},[daiquiri.core.create_element("input",{'defaultValue':frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"notes-block-text","notes-block-text",1546725518)),'onBlur':(function (e){
return frontend.extensions.zotero.setting.set_setting_BANG_(new cljs.core.Keyword(null,"notes-block-text","notes-block-text",1546725518),frontend.util.evalue(e));
}),'className':"form-input block"},[])])])]):null)]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.extensions.zotero/notes-setting");
frontend.extensions.zotero.page_prefix_setting = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'className':"title",'htmlFor':"zotero_page_prefix"},["Insert page name with prefix:"]),daiquiri.core.create_element("div",{'className':"mt-1 sm:mt-0 sm:col-span-2"},[daiquiri.core.create_element("div",{'className':"max-w-lg rounded-md"},[daiquiri.core.create_element("input",{'defaultValue':frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"page-insert-prefix","page-insert-prefix",1646035089)),'onBlur':(function (e){
return frontend.extensions.zotero.setting.set_setting_BANG_(new cljs.core.Keyword(null,"page-insert-prefix","page-insert-prefix",1646035089),frontend.util.evalue(e));
}),'className':"form-input block"},[])])])]);
}),null,"frontend.extensions.zotero/page-prefix-setting");
frontend.extensions.zotero.extra_tags_setting = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'title':"Extra tags to add for every imported page. Separate by comma, or leave it empty.",'className':"title",'htmlFor':"zotero_extra_tags"},["Extra tags to add:"]),daiquiri.core.create_element("div",{'className':"mt-1 sm:mt-0 sm:col-span-2"},[daiquiri.core.create_element("div",{'className':"max-w-lg rounded-md"},[daiquiri.core.create_element("input",{'defaultValue':frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"extra-tags","extra-tags",-1152617311)),'placeholder':"tag1,tag2,tag3",'onBlur':(function (e){
return frontend.extensions.zotero.setting.set_setting_BANG_(new cljs.core.Keyword(null,"extra-tags","extra-tags",-1152617311),frontend.util.evalue(e));
}),'className':"form-input block"},[])])])]);
}),null,"frontend.extensions.zotero/extra-tags-setting");
frontend.extensions.zotero.data_directory_setting = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'className':"title",'htmlFor':"zotero_data_directory"},["Zotero data directory",daiquiri.core.create_element("a",{'title':"Set Zotero data directory to open pdf attachment in Logseq. Click to learn more.",'href':"https://www.zotero.org/support/zotero_data",'target':"_blank",'className':"ml-2"},[daiquiri.interpreter.interpret(frontend.components.svg.info())])]),daiquiri.core.create_element("div",{'className':"mt-1 sm:mt-0 sm:col-span-2"},[daiquiri.core.create_element("div",{'className':"max-w-lg rounded-md"},[daiquiri.core.create_element("input",{'defaultValue':frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"zotero-data-directory","zotero-data-directory",-218308088)),'placeholder':"/Users/<username>/Zotero",'onBlur':(function (e){
return frontend.extensions.zotero.setting.set_setting_BANG_(new cljs.core.Keyword(null,"zotero-data-directory","zotero-data-directory",-218308088),frontend.util.evalue(e));
}),'className':"form-input block"},[])])])]);
}),null,"frontend.extensions.zotero/data-directory-setting");
frontend.extensions.zotero.profile_name_dialog_inner = rum.core.lazy_build(rum.core.build_defcs,(function (state,profile_STAR_,close_fn){
var input = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.extensions.zotero","input","frontend.extensions.zotero/input",168338460));
return daiquiri.core.create_element("div",{'className':"w-96"},[daiquiri.core.create_element("div",{'className':"sm:flex sm:items-start"},[daiquiri.core.create_element("div",{'className':"mt-3 text-center sm:mt-0 sm:text-left"},[daiquiri.core.create_element("h3",{'id':"modal-headline",'className':"text-lg leading-6 font-medium mt-2 pb-2"},["Please enter your profile name:"])])]),daiquiri.core.create_element("input",{'autoFocus':true,'defaultValue':"",'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.reset_BANG_(input,frontend.util.evalue(e));
})),'className':"form-input block w-full sm:text-sm sm:leading-5 my-2"},[]),daiquiri.core.create_element("div",{'className':"mt-5 sm:mt-4 sm:flex sm:flex-row-reverse"},[(function (){var attrs121411 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Submit",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"ui__modal-enter",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var profile_name = clojure.string.trim(cljs.core.deref(input));
if(clojure.string.blank_QMARK_(profile_name)){
} else {
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.zotero.setting.add_profile(profile_name)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.zotero.setting.set_profile(profile_name)),(function (___$1){
return promesa.protocols._promise(cljs.core.reset_BANG_(profile_STAR_,profile_name));
}));
}));
}));
}

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
})], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs121411))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","w-full","rounded-md","shadow-sm","sm:ml-3","sm:w-auto"], null)], null),attrs121411], 0))):{'className':"flex w-full rounded-md shadow-sm sm:ml-3 sm:w-auto"}),((cljs.core.map_QMARK_(attrs121411))?null:[daiquiri.interpreter.interpret(attrs121411)]));
})(),(function (){var attrs121418 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Cancel",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"on-click","on-click",1632826543),close_fn,new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-70 hover:opacity-100"], null)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs121418))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mt-3","flex","w-full","rounded-md","sm:mt-0","sm:w-auto"], null)], null),attrs121418], 0))):{'className':"mt-3 flex w-full rounded-md sm:mt-0 sm:w-auto"}),((cljs.core.map_QMARK_(attrs121418))?null:[daiquiri.interpreter.interpret(attrs121418)]));
})()])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.extensions.zotero","input","frontend.extensions.zotero/input",168338460))], null),"frontend.extensions.zotero/profile-name-dialog-inner");
frontend.extensions.zotero.zotero_profile_selector = rum.core.lazy_build(rum.core.build_defc,(function (profile_STAR_){
return daiquiri.core.create_element("div",{'className':"flex flex-row mb-4 items-center"},[daiquiri.core.create_element("label",{'className':"title mr-32",'htmlFor':"profile-select"},["Choose a profile:"]),daiquiri.core.create_element("div",{'className':"flex flex-row ml-4"},[daiquiri.core.create_element("select",{'style':{'padding':"0px 36px 0px 8px"},'value':cljs.core.deref(profile_STAR_),'onChange':rum.core.mark_sync_update((function (e){
var temp__5804__auto__ = frontend.util.evalue(e);
if(cljs.core.truth_(temp__5804__auto__)){
var profile = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.zotero.setting.set_profile(profile)),(function (_){
return promesa.protocols._promise(cljs.core.reset_BANG_(profile_STAR_,profile));
}));
}));
} else {
return null;
}
})),'className':"ml-1 rounded"},[daiquiri.interpreter.interpret(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (i,x){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"option","option",65132272),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),i,new cljs.core.Keyword(null,"value","value",305978217),x], null),x], null);
}),frontend.extensions.zotero.setting.all_profiles()))]),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("New profile",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"class","class",-2030961996),"ml-4",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var G__121464 = (function (p__121466){
var map__121467 = p__121466;
var map__121467__$1 = cljs.core.__destructure_map(map__121467);
var close = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__121467__$1,new cljs.core.Keyword(null,"close","close",1835149582));
return frontend.extensions.zotero.profile_name_dialog_inner(profile_STAR_,close);
});
var G__121465 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"center","center",-748944368),new cljs.core.Keyword(null,"auto-width?","auto-width?",93515862),true], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__121464,G__121465) : logseq.shui.ui.dialog_open_BANG_.call(null,G__121464,G__121465));
})], 0))),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Delete profile!",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"background","background",-863952629),"red",new cljs.core.Keyword(null,"class","class",-2030961996),"ml-4",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.zotero.setting.remove_profile(cljs.core.deref(profile_STAR_))),(function (_){
return promesa.protocols._promise(cljs.core.reset_BANG_(profile_STAR_,frontend.extensions.zotero.setting.get_profile()));
}));
}));
})], 0)))])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.extensions.zotero/zotero-profile-selector");
frontend.extensions.zotero.add_all_items = rum.core.lazy_build(rum.core.build_defcs,(function (state){
return daiquiri.core.create_element("div",null,[daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'className':"title w-72",'htmlFor':"zotero_import_all"},["Add all zotero items"]),(function (){var attrs121696 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(cljs.core.deref(new cljs.core.Keyword("frontend.extensions.zotero","fetching-button","frontend.extensions.zotero/fetching-button",-1071148561).cljs$core$IFn$_invoke$arity$1(state)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_121727){
var state_val_121728 = (state_121727[(1)]);
if((state_val_121728 === (1))){
var inst_121704 = new cljs.core.Keyword("frontend.extensions.zotero","fetching-button","frontend.extensions.zotero/fetching-button",-1071148561).cljs$core$IFn$_invoke$arity$1(state);
var inst_121705 = cljs.core.reset_BANG_(inst_121704,"Fetching..");
var inst_121706 = frontend.extensions.zotero.api.all_top_items_count();
var state_121727__$1 = (function (){var statearr_121730 = state_121727;
(statearr_121730[(7)] = inst_121705);

return statearr_121730;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_121727__$1,(2),inst_121706);
} else {
if((state_val_121728 === (2))){
var inst_121708 = (state_121727[(8)]);
var inst_121708__$1 = (state_121727[(2)]);
var inst_121709 = new cljs.core.Keyword("frontend.extensions.zotero","fetching-button","frontend.extensions.zotero/fetching-button",-1071148561).cljs$core$IFn$_invoke$arity$1(state);
var inst_121710 = cljs.core.reset_BANG_(inst_121709,"Add all");
var inst_121711 = ["This will import all your zotero items and add total number of ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(inst_121708__$1)," pages. Do you wish to continue?"].join('');
var inst_121712 = window.confirm(inst_121711);
var state_121727__$1 = (function (){var statearr_121734 = state_121727;
(statearr_121734[(8)] = inst_121708__$1);

(statearr_121734[(9)] = inst_121710);

return statearr_121734;
})();
if(cljs.core.truth_(inst_121712)){
var statearr_121735_122151 = state_121727__$1;
(statearr_121735_122151[(1)] = (3));

} else {
var statearr_121736_122153 = state_121727__$1;
(statearr_121736_122153[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_121728 === (3))){
var inst_121708 = (state_121727[(8)]);
var inst_121714 = new cljs.core.Keyword("frontend.extensions.zotero","total","frontend.extensions.zotero/total",-611409901).cljs$core$IFn$_invoke$arity$1(state);
var inst_121715 = cljs.core.reset_BANG_(inst_121714,inst_121708);
var inst_121716 = new cljs.core.Keyword("frontend.extensions.zotero","progress","frontend.extensions.zotero/progress",-1187409602).cljs$core$IFn$_invoke$arity$1(state);
var inst_121717 = frontend.extensions.zotero.handler.add_all(inst_121716);
var state_121727__$1 = (function (){var statearr_121738 = state_121727;
(statearr_121738[(10)] = inst_121715);

return statearr_121738;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_121727__$1,(6),inst_121717);
} else {
if((state_val_121728 === (4))){
var state_121727__$1 = state_121727;
var statearr_121740_122159 = state_121727__$1;
(statearr_121740_122159[(2)] = null);

(statearr_121740_122159[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_121728 === (5))){
var inst_121725 = (state_121727[(2)]);
var state_121727__$1 = state_121727;
return cljs.core.async.impl.ioc_helpers.return_chan(state_121727__$1,inst_121725);
} else {
if((state_val_121728 === (6))){
var inst_121719 = (state_121727[(2)]);
var inst_121720 = new cljs.core.Keyword("frontend.extensions.zotero","total","frontend.extensions.zotero/total",-611409901).cljs$core$IFn$_invoke$arity$1(state);
var inst_121721 = cljs.core.reset_BANG_(inst_121720,false);
var inst_121722 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Successfully added all items!",new cljs.core.Keyword(null,"success","success",1890645906));
var state_121727__$1 = (function (){var statearr_121741 = state_121727;
(statearr_121741[(11)] = inst_121719);

(statearr_121741[(12)] = inst_121721);

return statearr_121741;
})();
var statearr_121742_122162 = state_121727__$1;
(statearr_121742_122162[(2)] = inst_121722);

(statearr_121742_122162[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
});
return (function() {
var frontend$extensions$zotero$state_machine__32004__auto__ = null;
var frontend$extensions$zotero$state_machine__32004__auto____0 = (function (){
var statearr_121745 = [null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_121745[(0)] = frontend$extensions$zotero$state_machine__32004__auto__);

(statearr_121745[(1)] = (1));

return statearr_121745;
});
var frontend$extensions$zotero$state_machine__32004__auto____1 = (function (state_121727){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_121727);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e121751){var ex__32007__auto__ = e121751;
var statearr_121752_122169 = state_121727;
(statearr_121752_122169[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_121727[(4)]))){
var statearr_121760_122170 = state_121727;
(statearr_121760_122170[(1)] = cljs.core.first((state_121727[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__122172 = state_121727;
state_121727 = G__122172;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$extensions$zotero$state_machine__32004__auto__ = function(state_121727){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$state_machine__32004__auto____0.call(this);
case 1:
return frontend$extensions$zotero$state_machine__32004__auto____1.call(this,state_121727);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$state_machine__32004__auto____0;
frontend$extensions$zotero$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$state_machine__32004__auto____1;
return frontend$extensions$zotero$state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_121773 = f__32196__auto__();
(statearr_121773[(6)] = c__32195__auto__);

return statearr_121773;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
})], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs121696))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mt-1","sm:mt-0","sm:col-span-2"], null)], null),attrs121696], 0))):{'className':"mt-1 sm:mt-0 sm:col-span-2"}),((cljs.core.map_QMARK_(attrs121696))?null:[daiquiri.interpreter.interpret(attrs121696)]));
})()]),frontend.ui.admonition(new cljs.core.Keyword(null,"warning","warning",-1685650671),"If you have a lot of items in Zotero, adding them all can slow down Logseq. You can type /zotero to import specific item on demand instead."),(cljs.core.truth_(cljs.core.deref(new cljs.core.Keyword("frontend.extensions.zotero","total","frontend.extensions.zotero/total",-611409901).cljs$core$IFn$_invoke$arity$1(state)))?daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("div",{'className':"bg-greenred-200 py-3 rounded-lg col-span-full"},[daiquiri.core.create_element("progress",{'max':(cljs.core.deref(new cljs.core.Keyword("frontend.extensions.zotero","total","frontend.extensions.zotero/total",-611409901).cljs$core$IFn$_invoke$arity$1(state)) + (30)),'value':cljs.core.deref(new cljs.core.Keyword("frontend.extensions.zotero","progress","frontend.extensions.zotero/progress",-1187409602).cljs$core$IFn$_invoke$arity$1(state)),'className':"w-full"},[]),"Importing items from Zotero....Please wait..."])]):null)]);
}),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(null,new cljs.core.Keyword("frontend.extensions.zotero","progress","frontend.extensions.zotero/progress",-1187409602)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.extensions.zotero","total","frontend.extensions.zotero/total",-611409901)),rum.core.local.cljs$core$IFn$_invoke$arity$2("Add all",new cljs.core.Keyword("frontend.extensions.zotero","fetching-button","frontend.extensions.zotero/fetching-button",-1071148561)),rum.core.reactive], null),"frontend.extensions.zotero/add-all-items");
frontend.extensions.zotero.setting_rows = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",null,[frontend.extensions.zotero.api_key_setting(),frontend.extensions.zotero.user_or_group_setting(),frontend.extensions.zotero.prefer_citekey_setting(),frontend.extensions.zotero.attachment_setting(),frontend.extensions.zotero.notes_setting(),frontend.extensions.zotero.page_prefix_setting(),frontend.extensions.zotero.extra_tags_setting(),frontend.extensions.zotero.data_directory_setting(),frontend.extensions.zotero.overwrite_mode_setting()]);
}),null,"frontend.extensions.zotero/setting-rows");
frontend.extensions.zotero.settings = rum.core.lazy_build(rum.core.build_defcs,(function (state){
return daiquiri.core.create_element("div",{'className':"zotero-settings"},[daiquiri.core.create_element("h1",{'className':"mb-4 text-4xl font-bold mb-8"},["Zotero Settings"]),frontend.extensions.zotero.zotero_profile_selector(new cljs.core.Keyword("frontend.extensions.zotero","profile","frontend.extensions.zotero/profile",100514749).cljs$core$IFn$_invoke$arity$1(state)),rum.core.with_key(frontend.extensions.zotero.setting_rows(),cljs.core.deref(new cljs.core.Keyword("frontend.extensions.zotero","profile","frontend.extensions.zotero/profile",100514749).cljs$core$IFn$_invoke$arity$1(state))),frontend.extensions.zotero.add_all_items()]);
}),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2(frontend.extensions.zotero.setting.all_profiles(),new cljs.core.Keyword("frontend.extensions.zotero","all-profiles","frontend.extensions.zotero/all-profiles",1393094078)),rum.core.local.cljs$core$IFn$_invoke$arity$2(frontend.extensions.zotero.setting.get_profile(),new cljs.core.Keyword("frontend.extensions.zotero","profile","frontend.extensions.zotero/profile",100514749)),rum.core.reactive,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"should-update","should-update",-1292781795),(function (old_state,_new_state){
var all_profiles = frontend.extensions.zotero.setting.all_profiles();
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(all_profiles,cljs.core.deref(new cljs.core.Keyword("frontend.extensions.zotero","all-profiles","frontend.extensions.zotero/all-profiles",1393094078).cljs$core$IFn$_invoke$arity$1(old_state)));
})], null)], null),"frontend.extensions.zotero/settings");
frontend.extensions.zotero.open_button = (function frontend$extensions$zotero$open_button(full_path){
if(clojure.string.ends_with_QMARK_(clojure.string.lower_case(full_path),"pdf")){
return frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("open",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
var temp__5804__auto__ = frontend.extensions.pdf.assets.inflate_asset(full_path);
if(cljs.core.truth_(temp__5804__auto__)){
var current = temp__5804__auto__;
frontend.util.stop(e);

return frontend.state.set_state_BANG_(new cljs.core.Keyword("pdf","current","pdf/current",-1087936477),current);
} else {
return null;
}
})], 0));
} else {
return frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("open",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"target","target",253001721),"_blank",new cljs.core.Keyword(null,"href","href",-793805698),full_path], 0));
}
});
frontend.extensions.zotero.zotero_imported_file = rum.core.lazy_build(rum.core.build_defc,(function (item_key,filename){
if(clojure.string.blank_QMARK_(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"zotero-data-directory","zotero-data-directory",-218308088)))){
return daiquiri.core.create_element("p",{'className':"warning"},["This is a zotero imported file, setting Zotero data directory would allow you to open the file in Logseq"]);
} else {
var filename__$1 = clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1(filename);
var full_path = ["file://",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__121837 = frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"zotero-data-directory","zotero-data-directory",-218308088));
var G__121838 = "storage";
var G__121839 = item_key;
var G__121840 = filename__$1;
return (frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$4 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$4(G__121837,G__121838,G__121839,G__121840) : frontend.util.node_path.join.call(null,G__121837,G__121838,G__121839,G__121840));
})())].join('');
return daiquiri.interpreter.interpret(frontend.extensions.zotero.open_button(full_path));
}
}),null,"frontend.extensions.zotero/zotero-imported-file");
frontend.extensions.zotero.zotero_linked_file = rum.core.lazy_build(rum.core.build_defc,(function (path){
if(clojure.string.blank_QMARK_(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"zotero-linked-attachment-base-directory","zotero-linked-attachment-base-directory",-799816118)))){
return daiquiri.core.create_element("p",{'className':"warning"},["This is a zotero linked file, setting Zotero linked attachment base directory would allow you to open the file in Logseq"]);
} else {
var path__$1 = clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1(path);
var full_path = ["file://",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__121856 = frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"zotero-linked-attachment-base-directory","zotero-linked-attachment-base-directory",-799816118));
var G__121857 = clojure.string.replace_first(path__$1,"attachments:","");
return (frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(G__121856,G__121857) : frontend.util.node_path.join.call(null,G__121856,G__121857));
})())].join('');
return daiquiri.interpreter.interpret(frontend.extensions.zotero.open_button(full_path));
}
}),null,"frontend.extensions.zotero/zotero-linked-file");

//# sourceMappingURL=frontend.extensions.zotero.js.map
