goog.provide('open_spaced_repetition.cljc_fsrs.scheduler');
/**
 * This is our placeholder for DSR parameter predictions.
 */
open_spaced_repetition.cljc_fsrs.scheduler.empty_schedule = (function open_spaced_repetition$cljc_fsrs$scheduler$empty_schedule(card){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (schedule,rating){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(schedule,rating,card);
}),cljs.core.PersistentArrayMap.EMPTY,cljs.core.keys(open_spaced_repetition.cljc_fsrs.parameters.__GT_rating));
});
/**
 * `:again` means we've forgotten the card, count it
 */
open_spaced_repetition.cljc_fsrs.scheduler.calculate_lapses = (function open_spaced_repetition$cljc_fsrs$scheduler$calculate_lapses(schedule){
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(schedule,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"again","again",1312602037),new cljs.core.Keyword(null,"lapses","lapses",1460246370)], null),cljs.core.inc);
});
if((typeof open_spaced_repetition !== 'undefined') && (typeof open_spaced_repetition.cljc_fsrs !== 'undefined') && (typeof open_spaced_repetition.cljc_fsrs.scheduler !== 'undefined') && (typeof open_spaced_repetition.cljc_fsrs.scheduler.calculate_state !== 'undefined')){
} else {
/**
 * What should the next `:state` of the card be?
 */
open_spaced_repetition.cljc_fsrs.scheduler.calculate_state = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__125289 = cljs.core.get_global_hierarchy;
return (fexpr__125289.cljs$core$IFn$_invoke$arity$0 ? fexpr__125289.cljs$core$IFn$_invoke$arity$0() : fexpr__125289.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("open-spaced-repetition.cljc-fsrs.scheduler","calculate-state"),(function (_schedule,card){
return new cljs.core.Keyword(null,"state","state",-1988618099).cljs$core$IFn$_invoke$arity$1(card);
}),new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
open_spaced_repetition.cljc_fsrs.scheduler.calculate_state.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"new","new",-2085437848),(function (schedule,_card){
return cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(schedule,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"again","again",1312602037),new cljs.core.Keyword(null,"state","state",-1988618099)], null),new cljs.core.Keyword(null,"learning","learning",612366512)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hard","hard",2068420191),new cljs.core.Keyword(null,"state","state",-1988618099)], null),new cljs.core.Keyword(null,"learning","learning",612366512)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"good","good",511701169),new cljs.core.Keyword(null,"state","state",-1988618099)], null),new cljs.core.Keyword(null,"learning","learning",612366512)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"easy","easy",315769928),new cljs.core.Keyword(null,"state","state",-1988618099)], null),new cljs.core.Keyword(null,"review","review",1101692435));
}));
open_spaced_repetition.cljc_fsrs.scheduler.state_change_when_learning = (function open_spaced_repetition$cljc_fsrs$scheduler$state_change_when_learning(schedule){
return cljs.core.assoc_in(cljs.core.assoc_in(schedule,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"good","good",511701169),new cljs.core.Keyword(null,"state","state",-1988618099)], null),new cljs.core.Keyword(null,"review","review",1101692435)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"easy","easy",315769928),new cljs.core.Keyword(null,"state","state",-1988618099)], null),new cljs.core.Keyword(null,"review","review",1101692435));
});
open_spaced_repetition.cljc_fsrs.scheduler.calculate_state.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"learning","learning",612366512),(function (schedule,_card){
return open_spaced_repetition.cljc_fsrs.scheduler.state_change_when_learning(schedule);
}));
open_spaced_repetition.cljc_fsrs.scheduler.calculate_state.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"relearning","relearning",-395034959),(function (schedule,_card){
return open_spaced_repetition.cljc_fsrs.scheduler.state_change_when_learning(schedule);
}));
open_spaced_repetition.cljc_fsrs.scheduler.calculate_state.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"review","review",1101692435),(function (schedule,_card){
return cljs.core.assoc_in(schedule,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"again","again",1312602037),new cljs.core.Keyword(null,"state","state",-1988618099)], null),new cljs.core.Keyword(null,"relearning","relearning",-395034959));
}));
if((typeof open_spaced_repetition !== 'undefined') && (typeof open_spaced_repetition.cljc_fsrs !== 'undefined') && (typeof open_spaced_repetition.cljc_fsrs.scheduler !== 'undefined') && (typeof open_spaced_repetition.cljc_fsrs.scheduler.calculate_difficulty_stability !== 'undefined')){
} else {
/**
 * What should be the next DS values?
 */
open_spaced_repetition.cljc_fsrs.scheduler.calculate_difficulty_stability = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__125305 = cljs.core.get_global_hierarchy;
return (fexpr__125305.cljs$core$IFn$_invoke$arity$0 ? fexpr__125305.cljs$core$IFn$_invoke$arity$0() : fexpr__125305.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("open-spaced-repetition.cljc-fsrs.scheduler","calculate-difficulty-stability"),(function (_schedule,card,_params){
return new cljs.core.Keyword(null,"state","state",-1988618099).cljs$core$IFn$_invoke$arity$1(card);
}),new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
open_spaced_repetition.cljc_fsrs.scheduler.calculate_difficulty_stability.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"new","new",-2085437848),(function (schedule,_card,p__125309){
var map__125310 = p__125309;
var map__125310__$1 = cljs.core.__destructure_map(map__125310);
var weights = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125310__$1,new cljs.core.Keyword(null,"weights","weights",-1097626197));
return cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(schedule,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"again","again",1312602037),new cljs.core.Keyword(null,"difficulty","difficulty",755680807)], null),open_spaced_repetition.cljc_fsrs.parameters.init_difficulty(weights,new cljs.core.Keyword(null,"again","again",1312602037))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hard","hard",2068420191),new cljs.core.Keyword(null,"difficulty","difficulty",755680807)], null),open_spaced_repetition.cljc_fsrs.parameters.init_difficulty(weights,new cljs.core.Keyword(null,"hard","hard",2068420191))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"good","good",511701169),new cljs.core.Keyword(null,"difficulty","difficulty",755680807)], null),open_spaced_repetition.cljc_fsrs.parameters.init_difficulty(weights,new cljs.core.Keyword(null,"good","good",511701169))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"easy","easy",315769928),new cljs.core.Keyword(null,"difficulty","difficulty",755680807)], null),open_spaced_repetition.cljc_fsrs.parameters.init_difficulty(weights,new cljs.core.Keyword(null,"easy","easy",315769928))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"again","again",1312602037),new cljs.core.Keyword(null,"stability","stability",1733225509)], null),open_spaced_repetition.cljc_fsrs.parameters.init_stability(weights,new cljs.core.Keyword(null,"again","again",1312602037))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hard","hard",2068420191),new cljs.core.Keyword(null,"stability","stability",1733225509)], null),open_spaced_repetition.cljc_fsrs.parameters.init_stability(weights,new cljs.core.Keyword(null,"hard","hard",2068420191))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"good","good",511701169),new cljs.core.Keyword(null,"stability","stability",1733225509)], null),open_spaced_repetition.cljc_fsrs.parameters.init_stability(weights,new cljs.core.Keyword(null,"good","good",511701169))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"easy","easy",315769928),new cljs.core.Keyword(null,"stability","stability",1733225509)], null),open_spaced_repetition.cljc_fsrs.parameters.init_stability(weights,new cljs.core.Keyword(null,"easy","easy",315769928)));
}));
open_spaced_repetition.cljc_fsrs.scheduler.calculate_difficulty_stability.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"learning","learning",612366512),(function (schedule,_card,_params){
return schedule;
}));
open_spaced_repetition.cljc_fsrs.scheduler.calculate_difficulty_stability.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"relearning","relearning",-395034959),(function (schedule,_card,_params){
return schedule;
}));
open_spaced_repetition.cljc_fsrs.scheduler.calculate_difficulty_stability.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"review","review",1101692435),(function (schedule,p__125314,p__125315){
var map__125316 = p__125314;
var map__125316__$1 = cljs.core.__destructure_map(map__125316);
var elapsed_days = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125316__$1,new cljs.core.Keyword(null,"elapsed-days","elapsed-days",1972412563));
var difficulty = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125316__$1,new cljs.core.Keyword(null,"difficulty","difficulty",755680807));
var stability = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125316__$1,new cljs.core.Keyword(null,"stability","stability",1733225509));
var map__125317 = p__125315;
var map__125317__$1 = cljs.core.__destructure_map(map__125317);
var weights = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__125317__$1,new cljs.core.Keyword(null,"weights","weights",-1097626197));
var retrievability = open_spaced_repetition.cljc_fsrs.parameters.calculate_retrievability(elapsed_days,stability);
return cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(schedule,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"again","again",1312602037),new cljs.core.Keyword(null,"difficulty","difficulty",755680807)], null),open_spaced_repetition.cljc_fsrs.parameters.next_difficulty(difficulty,new cljs.core.Keyword(null,"again","again",1312602037),weights)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hard","hard",2068420191),new cljs.core.Keyword(null,"difficulty","difficulty",755680807)], null),open_spaced_repetition.cljc_fsrs.parameters.next_difficulty(difficulty,new cljs.core.Keyword(null,"hard","hard",2068420191),weights)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"good","good",511701169),new cljs.core.Keyword(null,"difficulty","difficulty",755680807)], null),open_spaced_repetition.cljc_fsrs.parameters.next_difficulty(difficulty,new cljs.core.Keyword(null,"good","good",511701169),weights)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"easy","easy",315769928),new cljs.core.Keyword(null,"difficulty","difficulty",755680807)], null),open_spaced_repetition.cljc_fsrs.parameters.next_difficulty(difficulty,new cljs.core.Keyword(null,"easy","easy",315769928),weights)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"again","again",1312602037),new cljs.core.Keyword(null,"stability","stability",1733225509)], null),open_spaced_repetition.cljc_fsrs.parameters.next_stability(difficulty,stability,retrievability,new cljs.core.Keyword(null,"again","again",1312602037),weights)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hard","hard",2068420191),new cljs.core.Keyword(null,"stability","stability",1733225509)], null),open_spaced_repetition.cljc_fsrs.parameters.next_stability(difficulty,stability,retrievability,new cljs.core.Keyword(null,"hard","hard",2068420191),weights)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"good","good",511701169),new cljs.core.Keyword(null,"stability","stability",1733225509)], null),open_spaced_repetition.cljc_fsrs.parameters.next_stability(difficulty,stability,retrievability,new cljs.core.Keyword(null,"good","good",511701169),weights)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"easy","easy",315769928),new cljs.core.Keyword(null,"stability","stability",1733225509)], null),open_spaced_repetition.cljc_fsrs.parameters.next_stability(difficulty,stability,retrievability,new cljs.core.Keyword(null,"easy","easy",315769928),weights));
}));
if((typeof open_spaced_repetition !== 'undefined') && (typeof open_spaced_repetition.cljc_fsrs !== 'undefined') && (typeof open_spaced_repetition.cljc_fsrs.scheduler !== 'undefined') && (typeof open_spaced_repetition.cljc_fsrs.scheduler.calculate_due !== 'undefined')){
} else {
/**
 * What's the best next time to repeat this card?
 */
open_spaced_repetition.cljc_fsrs.scheduler.calculate_due = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__125320 = cljs.core.get_global_hierarchy;
return (fexpr__125320.cljs$core$IFn$_invoke$arity$0 ? fexpr__125320.cljs$core$IFn$_invoke$arity$0() : fexpr__125320.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("open-spaced-repetition.cljc-fsrs.scheduler","calculate-due"),(function (_schedule,card,_now,_params){
return new cljs.core.Keyword(null,"state","state",-1988618099).cljs$core$IFn$_invoke$arity$1(card);
}),new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
open_spaced_repetition.cljc_fsrs.scheduler.calculate_due.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"new","new",-2085437848),(function (schedule,_card,now,params){
var easy_interval = open_spaced_repetition.cljc_fsrs.parameters.next_interval(params,cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(schedule,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"easy","easy",315769928),new cljs.core.Keyword(null,"stability","stability",1733225509)], null)));
return cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(schedule,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"again","again",1312602037),new cljs.core.Keyword(null,"due","due",-1754731313)], null),tick.core._GT__GT_(now,tick.core.new_duration((1),new cljs.core.Keyword(null,"minutes","minutes",1319166394)))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hard","hard",2068420191),new cljs.core.Keyword(null,"due","due",-1754731313)], null),tick.core._GT__GT_(now,tick.core.new_duration((5),new cljs.core.Keyword(null,"minutes","minutes",1319166394)))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"good","good",511701169),new cljs.core.Keyword(null,"due","due",-1754731313)], null),tick.core._GT__GT_(now,tick.core.new_duration((10),new cljs.core.Keyword(null,"minutes","minutes",1319166394)))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"easy","easy",315769928),new cljs.core.Keyword(null,"due","due",-1754731313)], null),tick.core._GT__GT_(now,tick.core.new_period(easy_interval,new cljs.core.Keyword(null,"days","days",-1394072564)))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"again","again",1312602037),new cljs.core.Keyword(null,"scheduled-days","scheduled-days",-90831308)], null),(0)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hard","hard",2068420191),new cljs.core.Keyword(null,"scheduled-days","scheduled-days",-90831308)], null),(0)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"good","good",511701169),new cljs.core.Keyword(null,"scheduled-days","scheduled-days",-90831308)], null),(0)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"easy","easy",315769928),new cljs.core.Keyword(null,"scheduled-days","scheduled-days",-90831308)], null),easy_interval);
}));
open_spaced_repetition.cljc_fsrs.scheduler.due_change_when_learning = (function open_spaced_repetition$cljc_fsrs$scheduler$due_change_when_learning(schedule,now,params){
var good_interval = open_spaced_repetition.cljc_fsrs.parameters.next_interval(params,cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(schedule,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"good","good",511701169),new cljs.core.Keyword(null,"stability","stability",1733225509)], null)));
var easy_interval = (function (){var x__5087__auto__ = (good_interval + (1));
var y__5088__auto__ = open_spaced_repetition.cljc_fsrs.parameters.next_interval(params,cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(schedule,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"easy","easy",315769928),new cljs.core.Keyword(null,"stability","stability",1733225509)], null)));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
return cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(schedule,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"again","again",1312602037),new cljs.core.Keyword(null,"due","due",-1754731313)], null),tick.core._GT__GT_(now,tick.core.new_duration((5),new cljs.core.Keyword(null,"minutes","minutes",1319166394)))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hard","hard",2068420191),new cljs.core.Keyword(null,"due","due",-1754731313)], null),tick.core._GT__GT_(now,tick.core.new_duration((10),new cljs.core.Keyword(null,"minutes","minutes",1319166394)))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"good","good",511701169),new cljs.core.Keyword(null,"due","due",-1754731313)], null),tick.core._GT__GT_(now,tick.core.new_period(good_interval,new cljs.core.Keyword(null,"days","days",-1394072564)))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"easy","easy",315769928),new cljs.core.Keyword(null,"due","due",-1754731313)], null),tick.core._GT__GT_(now,tick.core.new_period(easy_interval,new cljs.core.Keyword(null,"days","days",-1394072564)))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"again","again",1312602037),new cljs.core.Keyword(null,"scheduled-days","scheduled-days",-90831308)], null),(0)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hard","hard",2068420191),new cljs.core.Keyword(null,"scheduled-days","scheduled-days",-90831308)], null),(0)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"good","good",511701169),new cljs.core.Keyword(null,"scheduled-days","scheduled-days",-90831308)], null),good_interval),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"easy","easy",315769928),new cljs.core.Keyword(null,"scheduled-days","scheduled-days",-90831308)], null),easy_interval);
});
open_spaced_repetition.cljc_fsrs.scheduler.calculate_due.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"learning","learning",612366512),(function (schedule,_card,now,params){
return open_spaced_repetition.cljc_fsrs.scheduler.due_change_when_learning(schedule,now,params);
}));
open_spaced_repetition.cljc_fsrs.scheduler.calculate_due.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"relearning","relearning",-395034959),(function (schedule,_card,now,params){
return open_spaced_repetition.cljc_fsrs.scheduler.due_change_when_learning(schedule,now,params);
}));
open_spaced_repetition.cljc_fsrs.scheduler.calculate_due.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"review","review",1101692435),(function (schedule,_card,now,params){
var hard_interval = open_spaced_repetition.cljc_fsrs.parameters.next_interval(params,cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(schedule,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hard","hard",2068420191),new cljs.core.Keyword(null,"stability","stability",1733225509)], null)));
var good_interval = open_spaced_repetition.cljc_fsrs.parameters.next_interval(params,cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(schedule,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"good","good",511701169),new cljs.core.Keyword(null,"stability","stability",1733225509)], null)));
var hard_interval__$1 = (function (){var x__5090__auto__ = hard_interval;
var y__5091__auto__ = good_interval;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var good_interval__$1 = (function (){var x__5087__auto__ = good_interval;
var y__5088__auto__ = (hard_interval__$1 + (1));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var easy_interval = (function (){var x__5087__auto__ = open_spaced_repetition.cljc_fsrs.parameters.next_interval(params,cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(schedule,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"easy","easy",315769928),new cljs.core.Keyword(null,"stability","stability",1733225509)], null)));
var y__5088__auto__ = (good_interval__$1 + (1));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
return cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(schedule,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"again","again",1312602037),new cljs.core.Keyword(null,"due","due",-1754731313)], null),tick.core._GT__GT_(now,tick.core.new_duration((5),new cljs.core.Keyword(null,"minutes","minutes",1319166394)))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hard","hard",2068420191),new cljs.core.Keyword(null,"due","due",-1754731313)], null),tick.core._GT__GT_(now,tick.core.new_period(hard_interval__$1,new cljs.core.Keyword(null,"days","days",-1394072564)))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"good","good",511701169),new cljs.core.Keyword(null,"due","due",-1754731313)], null),tick.core._GT__GT_(now,tick.core.new_period(good_interval__$1,new cljs.core.Keyword(null,"days","days",-1394072564)))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"easy","easy",315769928),new cljs.core.Keyword(null,"due","due",-1754731313)], null),tick.core._GT__GT_(now,tick.core.new_period(easy_interval,new cljs.core.Keyword(null,"days","days",-1394072564)))),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"again","again",1312602037),new cljs.core.Keyword(null,"scheduled-days","scheduled-days",-90831308)], null),(0)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"hard","hard",2068420191),new cljs.core.Keyword(null,"scheduled-days","scheduled-days",-90831308)], null),hard_interval__$1),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"good","good",511701169),new cljs.core.Keyword(null,"scheduled-days","scheduled-days",-90831308)], null),good_interval__$1),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"easy","easy",315769928),new cljs.core.Keyword(null,"scheduled-days","scheduled-days",-90831308)], null),easy_interval);
}));
/**
 * When should we repeat this card next?
 */
open_spaced_repetition.cljc_fsrs.scheduler.next_repeat_schedule = (function open_spaced_repetition$cljc_fsrs$scheduler$next_repeat_schedule(card,repeat_time_instant,params){
return open_spaced_repetition.cljc_fsrs.scheduler.calculate_due.cljs$core$IFn$_invoke$arity$4(open_spaced_repetition.cljc_fsrs.scheduler.calculate_difficulty_stability.cljs$core$IFn$_invoke$arity$3(open_spaced_repetition.cljc_fsrs.scheduler.calculate_state.cljs$core$IFn$_invoke$arity$2(open_spaced_repetition.cljc_fsrs.scheduler.calculate_lapses(open_spaced_repetition.cljc_fsrs.scheduler.empty_schedule(card)),card),card,params),card,repeat_time_instant,params);
});

//# sourceMappingURL=open_spaced_repetition.cljc_fsrs.scheduler.js.map
