goog.provide('frontend.extensions.zotero');
frontend.extensions.zotero.term_chan = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$0();
frontend.extensions.zotero.debounce_chan_mult = cljs.core.async.mult(frontend.extensions.zotero.api.debounce(frontend.extensions.zotero.term_chan,(500)));
frontend.extensions.zotero.zotero_search_item = rum.core.lazy_build(rum.core.build_defc,(function (p__73416,id){
var map__73417 = p__73416;
var map__73417__$1 = cljs.core.__destructure_map(map__73417);
var item = map__73417__$1;
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73417__$1,new cljs.core.Keyword(null,"data","data",-232669377));
var vec__73418 = rum.core.use_state(false);
var is_creating_page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73418,(0),null);
var set_is_creating_page_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73418,(1),null);
var title = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(data);
var type = new cljs.core.Keyword(null,"item-type","item-type",-73995695).cljs$core$IFn$_invoke$arity$1(data);
var abstract$ = [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"abstract-note","abstract-note",338534968).cljs$core$IFn$_invoke$arity$1(data),(0),(200)),"..."].join('');
return daiquiri.core.create_element("div",{'onClick':(function (){
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_73430){
var state_val_73431 = (state_73430[(1)]);
if((state_val_73431 === (1))){
var inst_73421 = (set_is_creating_page_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_is_creating_page_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_is_creating_page_BANG_.call(null,true));
var inst_73422 = [new cljs.core.Keyword(null,"block-dom-id","block-dom-id",1375977027)];
var inst_73423 = [id];
var inst_73424 = cljs.core.PersistentHashMap.fromArrays(inst_73422,inst_73423);
var inst_73425 = frontend.extensions.zotero.handler.create_zotero_page.cljs$core$IFn$_invoke$arity$2(item,inst_73424);
var state_73430__$1 = (function (){var statearr_73432 = state_73430;
(statearr_73432[(7)] = inst_73421);

return statearr_73432;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_73430__$1,(2),inst_73425);
} else {
if((state_val_73431 === (2))){
var inst_73427 = (state_73430[(2)]);
var inst_73428 = (set_is_creating_page_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_is_creating_page_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_is_creating_page_BANG_.call(null,false));
var state_73430__$1 = (function (){var statearr_73433 = state_73430;
(statearr_73433[(8)] = inst_73427);

return statearr_73433;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_73430__$1,inst_73428);
} else {
return null;
}
}
});
return (function() {
var frontend$extensions$zotero$state_machine__32051__auto__ = null;
var frontend$extensions$zotero$state_machine__32051__auto____0 = (function (){
var statearr_73434 = [null,null,null,null,null,null,null,null,null];
(statearr_73434[(0)] = frontend$extensions$zotero$state_machine__32051__auto__);

(statearr_73434[(1)] = (1));

return statearr_73434;
});
var frontend$extensions$zotero$state_machine__32051__auto____1 = (function (state_73430){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_73430);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e73435){var ex__32054__auto__ = e73435;
var statearr_73436_73793 = state_73430;
(statearr_73436_73793[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_73430[(4)]))){
var statearr_73437_73794 = state_73430;
(statearr_73437_73794[(1)] = cljs.core.first((state_73430[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__73795 = state_73430;
state_73430 = G__73795;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$extensions$zotero$state_machine__32051__auto__ = function(state_73430){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$state_machine__32051__auto____0.call(this);
case 1:
return frontend$extensions$zotero$state_machine__32051__auto____1.call(this,state_73430);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$state_machine__32051__auto____0;
frontend$extensions$zotero$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$state_machine__32051__auto____1;
return frontend$extensions$zotero$state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_73439 = f__32125__auto__();
(statearr_73439[(6)] = c__32124__auto__);

return statearr_73439;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
}),'className':"zotero-search-item px-2 py-2 border-b cursor-pointer border-solid last:border-none relative"},[daiquiri.interpreter.interpret(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.font-medium.mb-1.mr-1.text-sm","span.font-medium.mb-1.mr-1.text-sm",1021597182),title], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.zotero-search-item-type.text-xs.p-1.rounded","span.zotero-search-item-type.text-xs.p-1.rounded",1831300718),type], null)], null)], null),(function (){var attrs73440 = abstract$;
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs73440))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-sm","opacity-60"], null)], null),attrs73440], 0))):{'className':"text-sm opacity-60"}),((cljs.core.map_QMARK_(attrs73440))?null:[attrs73440]));
})()], null)),(cljs.core.truth_(is_creating_page)?daiquiri.core.create_element("div",{'className':"zotero-search-item-loading-indicator"},[(function (){var attrs73441 = frontend.components.svg.refresh.cljs$core$IFn$_invoke$arity$0();
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs73441))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["animate-spin-reverse"], null)], null),attrs73441], 0))):{'className':"animate-spin-reverse"}),((cljs.core.map_QMARK_(attrs73441))?null:[daiquiri.interpreter.interpret(attrs73441)]));
})()]):null)]);
}),null,"frontend.extensions.zotero/zotero-search-item");
frontend.extensions.zotero.zotero_search = rum.core.lazy_build(rum.core.build_defc,(function (id){
var vec__73442 = rum.core.use_state("");
var term = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73442,(0),null);
var set_term_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73442,(1),null);
var vec__73445 = rum.core.use_state(cljs.core.PersistentVector.EMPTY);
var search_result = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73445,(0),null);
var set_search_result_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73445,(1),null);
var vec__73448 = rum.core.use_state("");
var prev_page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73448,(0),null);
var set_prev_page_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73448,(1),null);
var vec__73451 = rum.core.use_state("");
var next_page = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73451,(0),null);
var set_next_page_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73451,(1),null);
var vec__73454 = rum.core.use_state("");
var prev_search_term = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73454,(0),null);
var set_prev_search_term_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73454,(1),null);
var vec__73457 = rum.core.use_state(null);
var search_error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73457,(0),null);
var set_search_error_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73457,(1),null);
var vec__73460 = rum.core.use_state(false);
var is_searching = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73460,(0),null);
var set_is_searching_BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__73460,(1),null);
var search_fn = (function (s_term,start){
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_73491){
var state_val_73492 = (state_73491[(1)]);
if((state_val_73492 === (1))){
var inst_73463 = clojure.string.blank_QMARK_(s_term);
var state_73491__$1 = state_73491;
if(inst_73463){
var statearr_73493_73796 = state_73491__$1;
(statearr_73493_73796[(1)] = (2));

} else {
var statearr_73494_73797 = state_73491__$1;
(statearr_73494_73797[(1)] = (3));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73492 === (2))){
var state_73491__$1 = state_73491;
var statearr_73495_73798 = state_73491__$1;
(statearr_73495_73798[(2)] = null);

(statearr_73495_73798[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73492 === (3))){
var inst_73466 = (set_is_searching_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_is_searching_BANG_.cljs$core$IFn$_invoke$arity$1(true) : set_is_searching_BANG_.call(null,true));
var inst_73468 = frontend.extensions.zotero.api.query_top_items.cljs$core$IFn$_invoke$arity$2(s_term,start);
var state_73491__$1 = (function (){var statearr_73496 = state_73491;
(statearr_73496[(7)] = inst_73466);

return statearr_73496;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_73491__$1,(5),inst_73468);
} else {
if((state_val_73492 === (4))){
var inst_73489 = (state_73491[(2)]);
var state_73491__$1 = state_73491;
return cljs.core.async.impl.ioc_helpers.return_chan(state_73491__$1,inst_73489);
} else {
if((state_val_73492 === (5))){
var inst_73471 = (state_73491[(8)]);
var inst_73470 = (state_73491[(2)]);
var inst_73471__$1 = cljs.core.__destructure_map(inst_73470);
var inst_73472 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_73471__$1,new cljs.core.Keyword(null,"success","success",1890645906));
var inst_73473 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_73471__$1,new cljs.core.Keyword(null,"next","next",-117701485));
var inst_73474 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_73471__$1,new cljs.core.Keyword(null,"prev","prev",-1597069226));
var inst_73475 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_73471__$1,new cljs.core.Keyword(null,"result","result",1415092211));
var inst_73476 = inst_73472 === false;
var state_73491__$1 = (function (){var statearr_73497 = state_73491;
(statearr_73497[(8)] = inst_73471__$1);

(statearr_73497[(9)] = inst_73473);

(statearr_73497[(10)] = inst_73474);

(statearr_73497[(11)] = inst_73475);

return statearr_73497;
})();
if(cljs.core.truth_(inst_73476)){
var statearr_73498_73799 = state_73491__$1;
(statearr_73498_73799[(1)] = (6));

} else {
var statearr_73499_73800 = state_73491__$1;
(statearr_73499_73800[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73492 === (6))){
var inst_73471 = (state_73491[(8)]);
var inst_73478 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(inst_73471);
var inst_73479 = (set_search_error_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_search_error_BANG_.cljs$core$IFn$_invoke$arity$1(inst_73478) : set_search_error_BANG_.call(null,inst_73478));
var state_73491__$1 = state_73491;
var statearr_73500_73801 = state_73491__$1;
(statearr_73500_73801[(2)] = inst_73479);

(statearr_73500_73801[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73492 === (7))){
var inst_73473 = (state_73491[(9)]);
var inst_73474 = (state_73491[(10)]);
var inst_73475 = (state_73491[(11)]);
var inst_73481 = (set_prev_search_term_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_prev_search_term_BANG_.cljs$core$IFn$_invoke$arity$1(s_term) : set_prev_search_term_BANG_.call(null,s_term));
var inst_73482 = (set_next_page_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_next_page_BANG_.cljs$core$IFn$_invoke$arity$1(inst_73473) : set_next_page_BANG_.call(null,inst_73473));
var inst_73483 = (set_prev_page_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_prev_page_BANG_.cljs$core$IFn$_invoke$arity$1(inst_73474) : set_prev_page_BANG_.call(null,inst_73474));
var inst_73484 = (set_search_result_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_search_result_BANG_.cljs$core$IFn$_invoke$arity$1(inst_73475) : set_search_result_BANG_.call(null,inst_73475));
var state_73491__$1 = (function (){var statearr_73501 = state_73491;
(statearr_73501[(12)] = inst_73481);

(statearr_73501[(13)] = inst_73482);

(statearr_73501[(14)] = inst_73483);

return statearr_73501;
})();
var statearr_73502_73802 = state_73491__$1;
(statearr_73502_73802[(2)] = inst_73484);

(statearr_73502_73802[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73492 === (8))){
var inst_73486 = (state_73491[(2)]);
var inst_73487 = (set_is_searching_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_is_searching_BANG_.cljs$core$IFn$_invoke$arity$1(false) : set_is_searching_BANG_.call(null,false));
var state_73491__$1 = (function (){var statearr_73503 = state_73491;
(statearr_73503[(15)] = inst_73486);

return statearr_73503;
})();
var statearr_73504_73803 = state_73491__$1;
(statearr_73504_73803[(2)] = inst_73487);

(statearr_73504_73803[(1)] = (4));


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
var frontend$extensions$zotero$state_machine__32051__auto__ = null;
var frontend$extensions$zotero$state_machine__32051__auto____0 = (function (){
var statearr_73505 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_73505[(0)] = frontend$extensions$zotero$state_machine__32051__auto__);

(statearr_73505[(1)] = (1));

return statearr_73505;
});
var frontend$extensions$zotero$state_machine__32051__auto____1 = (function (state_73491){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_73491);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e73506){var ex__32054__auto__ = e73506;
var statearr_73507_73804 = state_73491;
(statearr_73507_73804[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_73491[(4)]))){
var statearr_73508_73805 = state_73491;
(statearr_73508_73805[(1)] = cljs.core.first((state_73491[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__73806 = state_73491;
state_73491 = G__73806;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$extensions$zotero$state_machine__32051__auto__ = function(state_73491){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$state_machine__32051__auto____0.call(this);
case 1:
return frontend$extensions$zotero$state_machine__32051__auto____1.call(this,state_73491);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$state_machine__32051__auto____0;
frontend$extensions$zotero$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$state_machine__32051__auto____1;
return frontend$extensions$zotero$state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_73509 = f__32125__auto__();
(statearr_73509[(6)] = c__32124__auto__);

return statearr_73509;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
});
logseq.shui.hooks.use_effect_BANG_((function (){
var d_chan = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$0();
cljs.core.async.tap.cljs$core$IFn$_invoke$arity$2(frontend.extensions.zotero.debounce_chan_mult,d_chan);

var c__32124__auto___73807 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_73520){
var state_val_73521 = (state_73520[(1)]);
if((state_val_73521 === (1))){
var state_73520__$1 = state_73520;
var statearr_73522_73808 = state_73520__$1;
(statearr_73522_73808[(2)] = null);

(statearr_73522_73808[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73521 === (2))){
var state_73520__$1 = state_73520;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_73520__$1,(4),d_chan);
} else {
if((state_val_73521 === (3))){
var inst_73518 = (state_73520[(2)]);
var state_73520__$1 = state_73520;
return cljs.core.async.impl.ioc_helpers.return_chan(state_73520__$1,inst_73518);
} else {
if((state_val_73521 === (4))){
var inst_73512 = (state_73520[(2)]);
var inst_73513 = search_fn(inst_73512,"0");
var state_73520__$1 = state_73520;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_73520__$1,(5),inst_73513);
} else {
if((state_val_73521 === (5))){
var inst_73515 = (state_73520[(2)]);
var state_73520__$1 = (function (){var statearr_73523 = state_73520;
(statearr_73523[(7)] = inst_73515);

return statearr_73523;
})();
var statearr_73524_73809 = state_73520__$1;
(statearr_73524_73809[(2)] = null);

(statearr_73524_73809[(1)] = (2));


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
var frontend$extensions$zotero$state_machine__32051__auto__ = null;
var frontend$extensions$zotero$state_machine__32051__auto____0 = (function (){
var statearr_73525 = [null,null,null,null,null,null,null,null];
(statearr_73525[(0)] = frontend$extensions$zotero$state_machine__32051__auto__);

(statearr_73525[(1)] = (1));

return statearr_73525;
});
var frontend$extensions$zotero$state_machine__32051__auto____1 = (function (state_73520){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_73520);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e73526){var ex__32054__auto__ = e73526;
var statearr_73527_73810 = state_73520;
(statearr_73527_73810[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_73520[(4)]))){
var statearr_73528_73811 = state_73520;
(statearr_73528_73811[(1)] = cljs.core.first((state_73520[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__73812 = state_73520;
state_73520 = G__73812;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$extensions$zotero$state_machine__32051__auto__ = function(state_73520){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$state_machine__32051__auto____0.call(this);
case 1:
return frontend$extensions$zotero$state_machine__32051__auto____1.call(this,state_73520);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$state_machine__32051__auto____0;
frontend$extensions$zotero$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$state_machine__32051__auto____1;
return frontend$extensions$zotero$state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_73529 = f__32125__auto__();
(statearr_73529[(6)] = c__32124__auto___73807);

return statearr_73529;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
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
var c__32124__auto___73815 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_73535){
var state_val_73536 = (state_73535[(1)]);
if((state_val_73536 === (1))){
var inst_73531 = frontend.util.evalue(e);
var state_73535__$1 = state_73535;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_73535__$1,(2),frontend.extensions.zotero.term_chan,inst_73531);
} else {
if((state_val_73536 === (2))){
var inst_73533 = (state_73535[(2)]);
var state_73535__$1 = state_73535;
return cljs.core.async.impl.ioc_helpers.return_chan(state_73535__$1,inst_73533);
} else {
return null;
}
}
});
return (function() {
var frontend$extensions$zotero$state_machine__32051__auto__ = null;
var frontend$extensions$zotero$state_machine__32051__auto____0 = (function (){
var statearr_73537 = [null,null,null,null,null,null,null];
(statearr_73537[(0)] = frontend$extensions$zotero$state_machine__32051__auto__);

(statearr_73537[(1)] = (1));

return statearr_73537;
});
var frontend$extensions$zotero$state_machine__32051__auto____1 = (function (state_73535){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_73535);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e73539){var ex__32054__auto__ = e73539;
var statearr_73540_73816 = state_73535;
(statearr_73540_73816[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_73535[(4)]))){
var statearr_73543_73817 = state_73535;
(statearr_73543_73817[(1)] = cljs.core.first((state_73535[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__73818 = state_73535;
state_73535 = G__73818;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$extensions$zotero$state_machine__32051__auto__ = function(state_73535){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$state_machine__32051__auto____0.call(this);
case 1:
return frontend$extensions$zotero$state_machine__32051__auto____1.call(this,state_73535);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$state_machine__32051__auto____0;
frontend$extensions$zotero$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$state_machine__32051__auto____1;
return frontend$extensions$zotero$state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_73544 = f__32125__auto__();
(statearr_73544[(6)] = c__32124__auto___73815);

return statearr_73544;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));


var G__73548 = frontend.util.evalue(e);
return (set_term_BANG_.cljs$core$IFn$_invoke$arity$1 ? set_term_BANG_.cljs$core$IFn$_invoke$arity$1(G__73548) : set_term_BANG_.call(null,G__73548));
})),'className':"flex-1 focus:outline-none"},[]),(cljs.core.truth_(is_searching)?daiquiri.interpreter.interpret(frontend.ui.loading.cljs$core$IFn$_invoke$arity$1("")):null)]),(cljs.core.truth_(search_error)?daiquiri.core.create_element("div",{'className':"h-2 text-sm text-error mb-2"},[["Search error: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(search_error),""].join('')]):null),((cljs.core.seq(search_result))?(function (){var attrs73530 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (item){
return rum.core.with_key(frontend.extensions.zotero.zotero_search_item(item,id),new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(item));
}),search_result);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs73530))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["p-2"], null)], null),attrs73530], 0))):{'className':"p-2"}),((cljs.core.map_QMARK_(attrs73530))?[((clojure.string.blank_QMARK_(prev_page))?null:daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("prev",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(goog.dom.getElement("zotero-search").parentNode.scrollTop = (0));

return search_fn(prev_search_term,prev_page);
})], 0)))),((clojure.string.blank_QMARK_(next_page))?null:daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("next",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
(goog.dom.getElement("zotero-search").parentNode.scrollTop = (0));

return search_fn(prev_search_term,next_page);
})], 0))))]:[daiquiri.interpreter.interpret(attrs73530),((clojure.string.blank_QMARK_(prev_page))?null:daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("prev",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
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
})),'className':"form-select"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$extensions$zotero$iter__73556(s__73557){
return (new cljs.core.LazySeq(null,(function (){
var s__73557__$1 = s__73557;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__73557__$1);
if(temp__5804__auto__){
var s__73557__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__73557__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__73557__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__73559 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__73558 = (0);
while(true){
if((i__73558 < size__5479__auto__)){
var type = cljs.core._nth(c__5478__auto__,i__73558);
cljs.core.chunk_append(b__73559,daiquiri.core.create_element("option",{'key':type,'value':type},[clojure.string.capitalize(type)]));

var G__73819 = (i__73558 + (1));
i__73558 = G__73819;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__73559),frontend$extensions$zotero$iter__73556(cljs.core.chunk_rest(s__73557__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__73559),null);
}
} else {
var type = cljs.core.first(s__73557__$2);
return cljs.core.cons(daiquiri.core.create_element("option",{'key':type,'value':type},[clojure.string.capitalize(type)]),frontend$extensions$zotero$iter__73556(cljs.core.rest(s__73557__$2)));
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
return daiquiri.core.create_element("div",null,[daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'className':"title w-72",'htmlFor':"zotero_overwrite_mode"},["Overwrite existing item page?"]),daiquiri.core.create_element("div",null,[(function (){var attrs73564 = frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"overwrite-mode?","overwrite-mode?",-1715124409)),(function (){
return frontend.extensions.zotero.setting.set_setting_BANG_(new cljs.core.Keyword(null,"overwrite-mode?","overwrite-mode?",-1715124409),cljs.core.not(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"overwrite-mode?","overwrite-mode?",-1715124409))));
}),true);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs73564))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["rounded-md","sm:max-w-xs"], null)], null),attrs73564], 0))):{'className':"rounded-md sm:max-w-xs"}),((cljs.core.map_QMARK_(attrs73564))?null:[daiquiri.interpreter.interpret(attrs73564)]));
})()])]),(cljs.core.truth_(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"overwrite-mode?","overwrite-mode?",-1715124409)))?frontend.ui.admonition(new cljs.core.Keyword(null,"warning","warning",-1685650671),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-error","p.text-error",1957631830),"Dangerous! This will delete and recreate Zotero existing page! Make sure to backup your notes first in case something goes wrong. Make sure you don't put any personal item in previous Zotero page and it's OK to overwrite the page!"], null)):null)]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.extensions.zotero/overwrite-mode-setting");
frontend.extensions.zotero.attachment_setting = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",null,[daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'className':"title w-72",'htmlFor':"zotero_include_attachment_links"},["Include attachment links?"]),daiquiri.core.create_element("div",null,[(function (){var attrs73567 = frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"include-attachments?","include-attachments?",1105323115)),(function (){
return frontend.extensions.zotero.setting.set_setting_BANG_(new cljs.core.Keyword(null,"include-attachments?","include-attachments?",1105323115),cljs.core.not(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"include-attachments?","include-attachments?",1105323115))));
}),true);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs73567))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["rounded-md","sm:max-w-xs"], null)], null),attrs73567], 0))):{'className':"rounded-md sm:max-w-xs"}),((cljs.core.map_QMARK_(attrs73567))?null:[daiquiri.interpreter.interpret(attrs73567)]));
})()])]),(cljs.core.truth_(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"include-attachments?","include-attachments?",1105323115)))?daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'className':"title w-72",'htmlFor':"zotero_attachments_block_text"},["Attachment under block of:"]),daiquiri.core.create_element("div",{'className':"mt-1 sm:mt-0 sm:col-span-2"},[daiquiri.core.create_element("div",{'className':"max-w-lg rounded-md"},[daiquiri.core.create_element("input",{'defaultValue':frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"attachments-block-text","attachments-block-text",455049244)),'onBlur':(function (e){
return frontend.extensions.zotero.setting.set_setting_BANG_(new cljs.core.Keyword(null,"attachments-block-text","attachments-block-text",455049244),frontend.util.evalue(e));
}),'className':"form-input block"},[])])])]):null),(cljs.core.truth_(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"include-attachments?","include-attachments?",1105323115)))?daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'className':"title w-72",'htmlFor':"zotero_linked_attachment_base_directory"},["Zotero linked attachment base directory",daiquiri.core.create_element("a",{'title':"If you store attached files in Zotero \u2014 the default \u2014 this setting does not affect you. It only applies to linked files. If you're using the ZotFile plugin to help with a linked-file workflow, you should configure it to store linked files within the base directory you've configured. Click to learn more.",'href':"https://www.zotero.org/support/preferences/advanced#linked_attachment_base_directory",'target':"_blank",'className':"ml-2"},[daiquiri.interpreter.interpret(frontend.components.svg.info())])]),daiquiri.core.create_element("div",{'className':"mt-1 sm:mt-0 sm:col-span-2"},[daiquiri.core.create_element("div",{'className':"max-w-lg rounded-md"},[daiquiri.core.create_element("input",{'defaultValue':frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"zotero-linked-attachment-base-directory","zotero-linked-attachment-base-directory",-799816118)),'placeholder':"/Users/Sarah/Dropbox",'onBlur':(function (e){
return frontend.extensions.zotero.setting.set_setting_BANG_(new cljs.core.Keyword(null,"zotero-linked-attachment-base-directory","zotero-linked-attachment-base-directory",-799816118),frontend.util.evalue(e));
}),'className':"form-input block"},[])])])]):null)]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.extensions.zotero/attachment-setting");
frontend.extensions.zotero.prefer_citekey_setting = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'title':"Make sure to install Better BibTeX and pin your item first",'className':"title w-72",'htmlFor':"zotero_prefer_citekey"},["Use citekey as your page title?"]),daiquiri.core.create_element("div",null,[(function (){var attrs73572 = frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"prefer-citekey?","prefer-citekey?",2120866291)),(function (){
return frontend.extensions.zotero.setting.set_setting_BANG_(new cljs.core.Keyword(null,"prefer-citekey?","prefer-citekey?",2120866291),cljs.core.not(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"prefer-citekey?","prefer-citekey?",2120866291))));
}),true);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs73572))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["rounded-md","sm:max-w-xs"], null)], null),attrs73572], 0))):{'className':"rounded-md sm:max-w-xs"}),((cljs.core.map_QMARK_(attrs73572))?null:[daiquiri.interpreter.interpret(attrs73572)]));
})()])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.extensions.zotero/prefer-citekey-setting");
frontend.extensions.zotero.api_key_setting = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'className':"title w-72",'htmlFor':"zotero_api_key"},["Zotero API key"]),daiquiri.core.create_element("div",{'className':"mt-1 sm:mt-0 sm:col-span-2"},[daiquiri.core.create_element("div",{'className':"max-w-lg rounded-md"},[daiquiri.core.create_element("input",{'defaultValue':frontend.extensions.zotero.setting.api_key(),'placeholder':"Please enter your Zotero API key",'onBlur':(function (e){
return frontend.extensions.zotero.setting.set_api_key(frontend.util.evalue(e));
}),'className':"form-input block"},[])])])]);
}),null,"frontend.extensions.zotero/api-key-setting");
frontend.extensions.zotero.notes_setting = rum.core.lazy_build(rum.core.build_defc,(function (){
return daiquiri.core.create_element("div",null,[daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'className':"title w-72",'htmlFor':"zotero_include_notes"},["Include notes?"]),daiquiri.core.create_element("div",null,[(function (){var attrs73578 = frontend.ui.toggle.cljs$core$IFn$_invoke$arity$3(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"include-notes?","include-notes?",1426313915)),(function (){
return frontend.extensions.zotero.setting.set_setting_BANG_(new cljs.core.Keyword(null,"include-notes?","include-notes?",1426313915),cljs.core.not(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"include-notes?","include-notes?",1426313915))));
}),true);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs73578))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["rounded-md","sm:max-w-xs"], null)], null),attrs73578], 0))):{'className':"rounded-md sm:max-w-xs"}),((cljs.core.map_QMARK_(attrs73578))?null:[daiquiri.interpreter.interpret(attrs73578)]));
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
})),'className':"form-input block w-full sm:text-sm sm:leading-5 my-2"},[]),daiquiri.core.create_element("div",{'className':"mt-5 sm:mt-4 sm:flex sm:flex-row-reverse"},[(function (){var attrs73587 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Submit",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"class","class",-2030961996),"ui__modal-enter",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var profile_name = clojure.string.trim(cljs.core.deref(input));
if(clojure.string.blank_QMARK_(profile_name)){
} else {
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.zotero.setting.add_profile(profile_name)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.zotero.setting.set_profile(profile_name)),(function (___$1){
return promesa.protocols._promise(cljs.core.reset_BANG_(profile_STAR_,profile_name));
}));
}));
}));
}

return (logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null));
})], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs73587))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","w-full","rounded-md","shadow-sm","sm:ml-3","sm:w-auto"], null)], null),attrs73587], 0))):{'className':"flex w-full rounded-md shadow-sm sm:ml-3 sm:w-auto"}),((cljs.core.map_QMARK_(attrs73587))?null:[daiquiri.interpreter.interpret(attrs73587)]));
})(),(function (){var attrs73588 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Cancel",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"on-click","on-click",1632826543),close_fn,new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-70 hover:opacity-100"], null)], 0));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs73588))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mt-3","flex","w-full","rounded-md","sm:mt-0","sm:w-auto"], null)], null),attrs73588], 0))):{'className':"mt-3 flex w-full rounded-md sm:mt-0 sm:w-auto"}),((cljs.core.map_QMARK_(attrs73588))?null:[daiquiri.interpreter.interpret(attrs73588)]));
})()])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.extensions.zotero","input","frontend.extensions.zotero/input",168338460))], null),"frontend.extensions.zotero/profile-name-dialog-inner");
frontend.extensions.zotero.zotero_profile_selector = rum.core.lazy_build(rum.core.build_defc,(function (profile_STAR_){
return daiquiri.core.create_element("div",{'className':"flex flex-row mb-4 items-center"},[daiquiri.core.create_element("label",{'className':"title mr-32",'htmlFor':"profile-select"},["Choose a profile:"]),daiquiri.core.create_element("div",{'className':"flex flex-row ml-4"},[daiquiri.core.create_element("select",{'style':{'padding':"0px 36px 0px 8px"},'value':cljs.core.deref(profile_STAR_),'onChange':rum.core.mark_sync_update((function (e){
var temp__5804__auto__ = frontend.util.evalue(e);
if(cljs.core.truth_(temp__5804__auto__)){
var profile = temp__5804__auto__;
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
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
var G__73611 = (function (p__73616){
var map__73617 = p__73616;
var map__73617__$1 = cljs.core.__destructure_map(map__73617);
var close = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73617__$1,new cljs.core.Keyword(null,"close","close",1835149582));
return frontend.extensions.zotero.profile_name_dialog_inner(profile_STAR_,close);
});
var G__73612 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"center","center",-748944368),new cljs.core.Keyword(null,"auto-width?","auto-width?",93515862),true], null);
return (logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dialog_open_BANG_.cljs$core$IFn$_invoke$arity$2(G__73611,G__73612) : logseq.shui.ui.dialog_open_BANG_.call(null,G__73611,G__73612));
})], 0))),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Delete profile!",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"small?","small?",95242445),true,new cljs.core.Keyword(null,"background","background",-863952629),"red",new cljs.core.Keyword(null,"class","class",-2030961996),"ml-4",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.extensions.zotero.setting.remove_profile(cljs.core.deref(profile_STAR_))),(function (_){
return promesa.protocols._promise(cljs.core.reset_BANG_(profile_STAR_,frontend.extensions.zotero.setting.get_profile()));
}));
}));
})], 0)))])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.extensions.zotero/zotero-profile-selector");
frontend.extensions.zotero.add_all_items = rum.core.lazy_build(rum.core.build_defcs,(function (state){
return daiquiri.core.create_element("div",null,[daiquiri.core.create_element("div",{'className':"row"},[daiquiri.core.create_element("label",{'className':"title w-72",'htmlFor':"zotero_import_all"},["Add all zotero items"]),(function (){var attrs73734 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(cljs.core.deref(new cljs.core.Keyword("frontend.extensions.zotero","fetching-button","frontend.extensions.zotero/fetching-button",-1071148561).cljs$core$IFn$_invoke$arity$1(state)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_73758){
var state_val_73759 = (state_73758[(1)]);
if((state_val_73759 === (1))){
var inst_73735 = new cljs.core.Keyword("frontend.extensions.zotero","fetching-button","frontend.extensions.zotero/fetching-button",-1071148561).cljs$core$IFn$_invoke$arity$1(state);
var inst_73736 = cljs.core.reset_BANG_(inst_73735,"Fetching..");
var inst_73737 = frontend.extensions.zotero.api.all_top_items_count();
var state_73758__$1 = (function (){var statearr_73760 = state_73758;
(statearr_73760[(7)] = inst_73736);

return statearr_73760;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_73758__$1,(2),inst_73737);
} else {
if((state_val_73759 === (2))){
var inst_73739 = (state_73758[(8)]);
var inst_73739__$1 = (state_73758[(2)]);
var inst_73740 = new cljs.core.Keyword("frontend.extensions.zotero","fetching-button","frontend.extensions.zotero/fetching-button",-1071148561).cljs$core$IFn$_invoke$arity$1(state);
var inst_73741 = cljs.core.reset_BANG_(inst_73740,"Add all");
var inst_73742 = ["This will import all your zotero items and add total number of ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(inst_73739__$1)," pages. Do you wish to continue?"].join('');
var inst_73743 = window.confirm(inst_73742);
var state_73758__$1 = (function (){var statearr_73761 = state_73758;
(statearr_73761[(8)] = inst_73739__$1);

(statearr_73761[(9)] = inst_73741);

return statearr_73761;
})();
if(cljs.core.truth_(inst_73743)){
var statearr_73762_73823 = state_73758__$1;
(statearr_73762_73823[(1)] = (3));

} else {
var statearr_73763_73824 = state_73758__$1;
(statearr_73763_73824[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73759 === (3))){
var inst_73739 = (state_73758[(8)]);
var inst_73745 = new cljs.core.Keyword("frontend.extensions.zotero","total","frontend.extensions.zotero/total",-611409901).cljs$core$IFn$_invoke$arity$1(state);
var inst_73746 = cljs.core.reset_BANG_(inst_73745,inst_73739);
var inst_73747 = new cljs.core.Keyword("frontend.extensions.zotero","progress","frontend.extensions.zotero/progress",-1187409602).cljs$core$IFn$_invoke$arity$1(state);
var inst_73748 = frontend.extensions.zotero.handler.add_all(inst_73747);
var state_73758__$1 = (function (){var statearr_73764 = state_73758;
(statearr_73764[(10)] = inst_73746);

return statearr_73764;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_73758__$1,(6),inst_73748);
} else {
if((state_val_73759 === (4))){
var state_73758__$1 = state_73758;
var statearr_73765_73825 = state_73758__$1;
(statearr_73765_73825[(2)] = null);

(statearr_73765_73825[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73759 === (5))){
var inst_73756 = (state_73758[(2)]);
var state_73758__$1 = state_73758;
return cljs.core.async.impl.ioc_helpers.return_chan(state_73758__$1,inst_73756);
} else {
if((state_val_73759 === (6))){
var inst_73750 = (state_73758[(2)]);
var inst_73751 = new cljs.core.Keyword("frontend.extensions.zotero","total","frontend.extensions.zotero/total",-611409901).cljs$core$IFn$_invoke$arity$1(state);
var inst_73752 = cljs.core.reset_BANG_(inst_73751,false);
var inst_73753 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Successfully added all items!",new cljs.core.Keyword(null,"success","success",1890645906));
var state_73758__$1 = (function (){var statearr_73766 = state_73758;
(statearr_73766[(11)] = inst_73750);

(statearr_73766[(12)] = inst_73752);

return statearr_73766;
})();
var statearr_73767_73826 = state_73758__$1;
(statearr_73767_73826[(2)] = inst_73753);

(statearr_73767_73826[(1)] = (5));


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
var frontend$extensions$zotero$state_machine__32051__auto__ = null;
var frontend$extensions$zotero$state_machine__32051__auto____0 = (function (){
var statearr_73768 = [null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_73768[(0)] = frontend$extensions$zotero$state_machine__32051__auto__);

(statearr_73768[(1)] = (1));

return statearr_73768;
});
var frontend$extensions$zotero$state_machine__32051__auto____1 = (function (state_73758){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_73758);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e73769){var ex__32054__auto__ = e73769;
var statearr_73770_73828 = state_73758;
(statearr_73770_73828[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_73758[(4)]))){
var statearr_73771_73829 = state_73758;
(statearr_73771_73829[(1)] = cljs.core.first((state_73758[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__73830 = state_73758;
state_73758 = G__73830;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$extensions$zotero$state_machine__32051__auto__ = function(state_73758){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$state_machine__32051__auto____0.call(this);
case 1:
return frontend$extensions$zotero$state_machine__32051__auto____1.call(this,state_73758);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$state_machine__32051__auto____0;
frontend$extensions$zotero$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$state_machine__32051__auto____1;
return frontend$extensions$zotero$state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_73772 = f__32125__auto__();
(statearr_73772[(6)] = c__32124__auto__);

return statearr_73772;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
})], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs73734))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mt-1","sm:mt-0","sm:col-span-2"], null)], null),attrs73734], 0))):{'className':"mt-1 sm:mt-0 sm:col-span-2"}),((cljs.core.map_QMARK_(attrs73734))?null:[daiquiri.interpreter.interpret(attrs73734)]));
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
var full_path = ["file://",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__73781 = frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"zotero-data-directory","zotero-data-directory",-218308088));
var G__73782 = "storage";
var G__73783 = item_key;
var G__73784 = filename__$1;
return (frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$4 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$4(G__73781,G__73782,G__73783,G__73784) : frontend.util.node_path.join.call(null,G__73781,G__73782,G__73783,G__73784));
})())].join('');
return daiquiri.interpreter.interpret(frontend.extensions.zotero.open_button(full_path));
}
}),null,"frontend.extensions.zotero/zotero-imported-file");
frontend.extensions.zotero.zotero_linked_file = rum.core.lazy_build(rum.core.build_defc,(function (path){
if(clojure.string.blank_QMARK_(frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"zotero-linked-attachment-base-directory","zotero-linked-attachment-base-directory",-799816118)))){
return daiquiri.core.create_element("p",{'className':"warning"},["This is a zotero linked file, setting Zotero linked attachment base directory would allow you to open the file in Logseq"]);
} else {
var path__$1 = clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1(path);
var full_path = ["file://",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__73790 = frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"zotero-linked-attachment-base-directory","zotero-linked-attachment-base-directory",-799816118));
var G__73791 = clojure.string.replace_first(path__$1,"attachments:","");
return (frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2 ? frontend.util.node_path.join.cljs$core$IFn$_invoke$arity$2(G__73790,G__73791) : frontend.util.node_path.join.call(null,G__73790,G__73791));
})())].join('');
return daiquiri.interpreter.interpret(frontend.extensions.zotero.open_button(full_path));
}
}),null,"frontend.extensions.zotero/zotero-linked-file");

//# sourceMappingURL=frontend.extensions.zotero.js.map
