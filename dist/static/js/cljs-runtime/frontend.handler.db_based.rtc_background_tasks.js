goog.provide('frontend.handler.db_based.rtc_background_tasks');
frontend.handler.db_based.rtc_background_tasks.run_background_task_when_not_publishing = (function frontend$handler$db_based$rtc_background_tasks$run_background_task_when_not_publishing(key_SINGLEQUOTE_,task){
if(frontend.config.publishing_QMARK_){
return null;
} else {
return frontend.common.missionary.run_background_task(key_SINGLEQUOTE_,task);
}
});
frontend.handler.db_based.rtc_background_tasks.run_background_task_when_not_publishing(new cljs.core.Keyword("frontend.handler.db-based.rtc-background-tasks","restart-rtc-to-reconnect","frontend.handler.db-based.rtc-background-tasks/restart-rtc-to-reconnect",1855716871),missionary.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.constantly(null),cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr128427_block_1 = (function frontend$handler$db_based$rtc_background_tasks$cr128427_block_1(cr128427_state){
try{var cr128427_place_2 = missionary.core.unpark();
var cr128427_place_3 = cljs.core.__destructure_map;
var cr128427_place_4 = cr128427_place_2;
var cr128427_place_5 = (function (){var G__128473 = cr128427_place_4;
var fexpr__128472 = cr128427_place_3;
return (fexpr__128472.cljs$core$IFn$_invoke$arity$1 ? fexpr__128472.cljs$core$IFn$_invoke$arity$1(G__128473) : fexpr__128472.call(null,G__128473));
})();
var cr128427_place_6 = cljs.core.get;
var cr128427_place_7 = cr128427_place_5;
var cr128427_place_8 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr128427_place_9 = (function (){var G__128475 = cr128427_place_7;
var G__128476 = cr128427_place_8;
var fexpr__128474 = cr128427_place_6;
return (fexpr__128474.cljs$core$IFn$_invoke$arity$2 ? fexpr__128474.cljs$core$IFn$_invoke$arity$2(G__128475,G__128476) : fexpr__128474.call(null,G__128475,G__128476));
})();
var cr128427_place_10 = cljs.core.get;
var cr128427_place_11 = cr128427_place_5;
var cr128427_place_12 = new cljs.core.Keyword(null,"t","t",-1397832519);
var cr128427_place_13 = (function (){var G__128478 = cr128427_place_11;
var G__128479 = cr128427_place_12;
var fexpr__128477 = cr128427_place_10;
return (fexpr__128477.cljs$core$IFn$_invoke$arity$2 ? fexpr__128477.cljs$core$IFn$_invoke$arity$2(G__128478,G__128479) : fexpr__128477.call(null,G__128478,G__128479));
})();
var cr128427_place_14 = cr128427_place_9;
var cr128427_place_15 = cr128427_place_14;
var cr128427_place_16 = null;
if(cljs.core.truth_(cr128427_place_15)){
(cr128427_state[(0)] = cr128427_block_3);

(cr128427_state[(1)] = cr128427_place_13);

(cr128427_state[(2)] = cr128427_place_16);

(cr128427_state[(3)] = cr128427_place_9);

return cr128427_state;
} else {
(cr128427_state[(0)] = cr128427_block_2);

(cr128427_state[(1)] = cr128427_place_14);

(cr128427_state[(2)] = cr128427_place_16);

(cr128427_state[(3)] = cr128427_place_9);

return cr128427_state;
}
}catch (e128471){var cr128427_exception = e128471;
(cr128427_state[(0)] = null);

throw cr128427_exception;
}});
var cr128427_block_5 = (function frontend$handler$db_based$rtc_background_tasks$cr128427_block_5(cr128427_state){
try{var cr128427_place_13 = (cr128427_state[(1)]);
var cr128427_place_9 = (cr128427_state[(3)]);
var cr128427_place_22 = cljs.core._EQ_;
var cr128427_place_23 = cr128427_place_9;
var cr128427_place_24 = logseq.db.get_graph_rtc_uuid;
var cr128427_place_25 = frontend.db.get_db;
var cr128427_place_26 = (function (){var fexpr__128481 = cr128427_place_25;
return (fexpr__128481.cljs$core$IFn$_invoke$arity$0 ? fexpr__128481.cljs$core$IFn$_invoke$arity$0() : fexpr__128481.call(null));
})();
var cr128427_place_27 = (function (){var G__128483 = cr128427_place_26;
var fexpr__128482 = cr128427_place_24;
return (fexpr__128482.cljs$core$IFn$_invoke$arity$1 ? fexpr__128482.cljs$core$IFn$_invoke$arity$1(G__128483) : fexpr__128482.call(null,G__128483));
})();
var cr128427_place_28 = (function (){var G__128485 = cr128427_place_23;
var G__128486 = cr128427_place_27;
var fexpr__128484 = cr128427_place_22;
return (fexpr__128484.cljs$core$IFn$_invoke$arity$2 ? fexpr__128484.cljs$core$IFn$_invoke$arity$2(G__128485,G__128486) : fexpr__128484.call(null,G__128485,G__128486));
})();
var cr128427_place_29 = (5000);
var cr128427_place_30 = logseq.common.util.time_ms;
var cr128427_place_31 = (function (){var fexpr__128487 = cr128427_place_30;
return (fexpr__128487.cljs$core$IFn$_invoke$arity$0 ? fexpr__128487.cljs$core$IFn$_invoke$arity$0() : fexpr__128487.call(null));
})();
var cr128427_place_32 = cr128427_place_13;
var cr128427_place_33 = (cr128427_place_31 - cr128427_place_32);
var cr128427_place_34 = (cr128427_place_29 > cr128427_place_33);
var cr128427_place_35 = ((cr128427_place_28) && (cr128427_place_34));
(cr128427_state[(0)] = cr128427_block_6);

(cr128427_state[(1)] = null);

(cr128427_state[(4)] = cr128427_place_35);

return cr128427_state;
}catch (e128480){var cr128427_exception = e128480;
(cr128427_state[(0)] = null);

(cr128427_state[(1)] = null);

(cr128427_state[(2)] = null);

(cr128427_state[(4)] = null);

(cr128427_state[(3)] = null);

throw cr128427_exception;
}});
var cr128427_block_0 = (function frontend$handler$db_based$rtc_background_tasks$cr128427_block_0(cr128427_state){
try{var cr128427_place_0 = (1);
var cr128427_place_1 = frontend.handler.db_based.rtc_flows.rtc_try_restart_flow;
(cr128427_state[(0)] = cr128427_block_1);

return missionary.core.fork(cr128427_place_0,cr128427_place_1);
}catch (e128488){var cr128427_exception = e128488;
(cr128427_state[(0)] = null);

throw cr128427_exception;
}});
var cr128427_block_6 = (function frontend$handler$db_based$rtc_background_tasks$cr128427_block_6(cr128427_state){
try{var cr128427_place_20 = (cr128427_state[(4)]);
(cr128427_state[(0)] = cr128427_block_7);

(cr128427_state[(4)] = null);

(cr128427_state[(2)] = cr128427_place_20);

return cr128427_state;
}catch (e128489){var cr128427_exception = e128489;
(cr128427_state[(0)] = null);

(cr128427_state[(2)] = null);

(cr128427_state[(4)] = null);

(cr128427_state[(3)] = null);

throw cr128427_exception;
}});
var cr128427_block_10 = (function frontend$handler$db_based$rtc_background_tasks$cr128427_block_10(cr128427_state){
try{var cr128427_place_61 = missionary.core.unpark();
(cr128427_state[(0)] = cr128427_block_11);

(cr128427_state[(1)] = cr128427_place_61);

return cr128427_state;
}catch (e128490){var cr128427_exception = e128490;
(cr128427_state[(0)] = null);

(cr128427_state[(1)] = null);

throw cr128427_exception;
}});
var cr128427_block_7 = (function frontend$handler$db_based$rtc_background_tasks$cr128427_block_7(cr128427_state){
try{var cr128427_place_16 = (cr128427_state[(2)]);
var cr128427_place_36 = null;
if(cljs.core.truth_(cr128427_place_16)){
(cr128427_state[(0)] = cr128427_block_9);

(cr128427_state[(2)] = null);

(cr128427_state[(1)] = cr128427_place_36);

return cr128427_state;
} else {
(cr128427_state[(0)] = cr128427_block_8);

(cr128427_state[(2)] = null);

(cr128427_state[(3)] = null);

(cr128427_state[(1)] = cr128427_place_36);

return cr128427_state;
}
}catch (e128491){var cr128427_exception = e128491;
(cr128427_state[(0)] = null);

(cr128427_state[(2)] = null);

(cr128427_state[(3)] = null);

throw cr128427_exception;
}});
var cr128427_block_11 = (function frontend$handler$db_based$rtc_background_tasks$cr128427_block_11(cr128427_state){
try{var cr128427_place_36 = (cr128427_state[(1)]);
(cr128427_state[(0)] = null);

(cr128427_state[(1)] = null);

return cr128427_place_36;
}catch (e128492){var cr128427_exception = e128492;
(cr128427_state[(0)] = null);

(cr128427_state[(1)] = null);

throw cr128427_exception;
}});
var cr128427_block_9 = (function frontend$handler$db_based$rtc_background_tasks$cr128427_block_9(cr128427_state){
try{var cr128427_place_9 = (cr128427_state[(3)]);
var cr128427_place_38 = lambdaisland.glogi.log;
var cr128427_place_39 = "frontend.handler.db-based.rtc-background-tasks";
var cr128427_place_40 = new cljs.core.Keyword(null,"info","info",-317069002);
var cr128427_place_41 = cljs.core.identity;
var cr128427_place_42 = new cljs.core.Keyword(null,"trying-to-restart-rtc","trying-to-restart-rtc",-1476604561);
var cr128427_place_43 = cr128427_place_9;
var cr128427_place_44 = new cljs.core.Keyword(null,"t","t",-1397832519);
var cr128427_place_45 = cljs_time.core.now;
var cr128427_place_46 = (function (){var fexpr__128494 = cr128427_place_45;
return (fexpr__128494.cljs$core$IFn$_invoke$arity$0 ? fexpr__128494.cljs$core$IFn$_invoke$arity$0() : fexpr__128494.call(null));
})();
var cr128427_place_47 = new cljs.core.Keyword(null,"line","line",212345235);
var cr128427_place_48 = 32;
var cr128427_place_49 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr128427_place_47,cr128427_place_48,cr128427_place_42,cr128427_place_43,cr128427_place_44,cr128427_place_46]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr128427_place_50 = (function (){var G__128496 = cr128427_place_49;
var fexpr__128495 = cr128427_place_41;
return (fexpr__128495.cljs$core$IFn$_invoke$arity$1 ? fexpr__128495.cljs$core$IFn$_invoke$arity$1(G__128496) : fexpr__128495.call(null,G__128496));
})();
var cr128427_place_51 = null;
var cr128427_place_52 = (function (){var G__128498 = cr128427_place_39;
var G__128499 = cr128427_place_40;
var G__128500 = cr128427_place_50;
var G__128501 = cr128427_place_51;
var fexpr__128497 = cr128427_place_38;
return (fexpr__128497.cljs$core$IFn$_invoke$arity$4 ? fexpr__128497.cljs$core$IFn$_invoke$arity$4(G__128498,G__128499,G__128500,G__128501) : fexpr__128497.call(null,G__128498,G__128499,G__128500,G__128501));
})();
var cr128427_place_53 = frontend.common.missionary._LT__BANG_;
var cr128427_place_54 = frontend.handler.db_based.rtc._LT_rtc_start_BANG_;
var cr128427_place_55 = frontend.state.get_current_repo;
var cr128427_place_56 = (function (){var fexpr__128502 = cr128427_place_55;
return (fexpr__128502.cljs$core$IFn$_invoke$arity$0 ? fexpr__128502.cljs$core$IFn$_invoke$arity$0() : fexpr__128502.call(null));
})();
var cr128427_place_57 = new cljs.core.Keyword(null,"stop-before-start?","stop-before-start?",1190543403);
var cr128427_place_58 = false;
var cr128427_place_59 = (function (){var G__128504 = cr128427_place_56;
var G__128505 = cr128427_place_57;
var G__128506 = cr128427_place_58;
var fexpr__128503 = cr128427_place_54;
return (fexpr__128503.cljs$core$IFn$_invoke$arity$3 ? fexpr__128503.cljs$core$IFn$_invoke$arity$3(G__128504,G__128505,G__128506) : fexpr__128503.call(null,G__128504,G__128505,G__128506));
})();
var cr128427_place_60 = (function (){var G__128508 = cr128427_place_59;
var fexpr__128507 = cr128427_place_53;
return (fexpr__128507.cljs$core$IFn$_invoke$arity$1 ? fexpr__128507.cljs$core$IFn$_invoke$arity$1(G__128508) : fexpr__128507.call(null,G__128508));
})();
(cr128427_state[(0)] = cr128427_block_10);

(cr128427_state[(3)] = null);

return missionary.core.park(cr128427_place_60);
}catch (e128493){var cr128427_exception = e128493;
(cr128427_state[(0)] = null);

(cr128427_state[(1)] = null);

(cr128427_state[(3)] = null);

throw cr128427_exception;
}});
var cr128427_block_3 = (function frontend$handler$db_based$rtc_background_tasks$cr128427_block_3(cr128427_state){
try{var cr128427_place_13 = (cr128427_state[(1)]);
var cr128427_place_18 = cr128427_place_13;
var cr128427_place_19 = cr128427_place_18;
var cr128427_place_20 = null;
if(cljs.core.truth_(cr128427_place_19)){
(cr128427_state[(0)] = cr128427_block_5);

(cr128427_state[(4)] = cr128427_place_20);

return cr128427_state;
} else {
(cr128427_state[(0)] = cr128427_block_4);

(cr128427_state[(1)] = null);

(cr128427_state[(1)] = cr128427_place_18);

(cr128427_state[(4)] = cr128427_place_20);

return cr128427_state;
}
}catch (e128509){var cr128427_exception = e128509;
(cr128427_state[(0)] = null);

(cr128427_state[(1)] = null);

(cr128427_state[(2)] = null);

(cr128427_state[(3)] = null);

throw cr128427_exception;
}});
var cr128427_block_2 = (function frontend$handler$db_based$rtc_background_tasks$cr128427_block_2(cr128427_state){
try{var cr128427_place_14 = (cr128427_state[(1)]);
var cr128427_place_17 = cr128427_place_14;
(cr128427_state[(0)] = cr128427_block_7);

(cr128427_state[(1)] = null);

(cr128427_state[(2)] = cr128427_place_17);

return cr128427_state;
}catch (e128510){var cr128427_exception = e128510;
(cr128427_state[(0)] = null);

(cr128427_state[(1)] = null);

(cr128427_state[(2)] = null);

(cr128427_state[(3)] = null);

throw cr128427_exception;
}});
var cr128427_block_8 = (function frontend$handler$db_based$rtc_background_tasks$cr128427_block_8(cr128427_state){
try{var cr128427_place_37 = null;
(cr128427_state[(0)] = cr128427_block_11);

(cr128427_state[(1)] = cr128427_place_37);

return cr128427_state;
}catch (e128511){var cr128427_exception = e128511;
(cr128427_state[(0)] = null);

(cr128427_state[(1)] = null);

throw cr128427_exception;
}});
var cr128427_block_4 = (function frontend$handler$db_based$rtc_background_tasks$cr128427_block_4(cr128427_state){
try{var cr128427_place_18 = (cr128427_state[(1)]);
var cr128427_place_21 = cr128427_place_18;
(cr128427_state[(0)] = cr128427_block_6);

(cr128427_state[(1)] = null);

(cr128427_state[(4)] = cr128427_place_21);

return cr128427_state;
}catch (e128512){var cr128427_exception = e128512;
(cr128427_state[(0)] = null);

(cr128427_state[(1)] = null);

(cr128427_state[(2)] = null);

(cr128427_state[(4)] = null);

(cr128427_state[(3)] = null);

throw cr128427_exception;
}});
return cloroutine.impl.coroutine((function (){var G__128513 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__128513[(0)] = cr128427_block_0);

return G__128513;
})());
})(),missionary.core.ap_run)));
frontend.handler.db_based.rtc_background_tasks.run_background_task_when_not_publishing(new cljs.core.Keyword("frontend.handler.db-based.rtc-background-tasks","notify-client-need-upgrade-when-larger-remote-schema-version-exists","frontend.handler.db-based.rtc-background-tasks/notify-client-need-upgrade-when-larger-remote-schema-version-exists",2038630927),missionary.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.constantly(null),cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr128515_block_0 = (function frontend$handler$db_based$rtc_background_tasks$cr128515_block_0(cr128515_state){
try{var cr128515_place_0 = (1);
var cr128515_place_1 = missionary.core.eduction;
var cr128515_place_2 = cljs.core.filter;
var cr128515_place_3 = (function (p1__128514_SHARP_){
return cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("rtc.log","higher-remote-schema-version-exists","rtc.log/higher-remote-schema-version-exists",1466780034),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__128514_SHARP_));
});
var cr128515_place_4 = (function (){var G__128555 = cr128515_place_3;
var fexpr__128554 = cr128515_place_2;
return (fexpr__128554.cljs$core$IFn$_invoke$arity$1 ? fexpr__128554.cljs$core$IFn$_invoke$arity$1(G__128555) : fexpr__128554.call(null,G__128555));
})();
var cr128515_place_5 = frontend.handler.db_based.rtc_flows.rtc_log_flow;
var cr128515_place_6 = (function (){var G__128557 = cr128515_place_4;
var G__128558 = cr128515_place_5;
var fexpr__128556 = cr128515_place_1;
return (fexpr__128556.cljs$core$IFn$_invoke$arity$2 ? fexpr__128556.cljs$core$IFn$_invoke$arity$2(G__128557,G__128558) : fexpr__128556.call(null,G__128557,G__128558));
})();
(cr128515_state[(0)] = cr128515_block_1);

return missionary.core.fork(cr128515_place_0,cr128515_place_6);
}catch (e128553){var cr128515_exception = e128553;
(cr128515_state[(0)] = null);

throw cr128515_exception;
}});
var cr128515_block_1 = (function frontend$handler$db_based$rtc_background_tasks$cr128515_block_1(cr128515_state){
try{var cr128515_place_7 = missionary.core.unpark();
var cr128515_place_8 = cljs.core.__destructure_map;
var cr128515_place_9 = cr128515_place_7;
var cr128515_place_10 = (function (){var G__128561 = cr128515_place_9;
var fexpr__128560 = cr128515_place_8;
return (fexpr__128560.cljs$core$IFn$_invoke$arity$1 ? fexpr__128560.cljs$core$IFn$_invoke$arity$1(G__128561) : fexpr__128560.call(null,G__128561));
})();
var cr128515_place_11 = cljs.core.get;
var cr128515_place_12 = cr128515_place_10;
var cr128515_place_13 = new cljs.core.Keyword(null,"repo","repo",-1999060679);
var cr128515_place_14 = (function (){var G__128563 = cr128515_place_12;
var G__128564 = cr128515_place_13;
var fexpr__128562 = cr128515_place_11;
return (fexpr__128562.cljs$core$IFn$_invoke$arity$2 ? fexpr__128562.cljs$core$IFn$_invoke$arity$2(G__128563,G__128564) : fexpr__128562.call(null,G__128563,G__128564));
})();
var cr128515_place_15 = cljs.core.get;
var cr128515_place_16 = cr128515_place_10;
var cr128515_place_17 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr128515_place_18 = (function (){var G__128566 = cr128515_place_16;
var G__128567 = cr128515_place_17;
var fexpr__128565 = cr128515_place_15;
return (fexpr__128565.cljs$core$IFn$_invoke$arity$2 ? fexpr__128565.cljs$core$IFn$_invoke$arity$2(G__128566,G__128567) : fexpr__128565.call(null,G__128566,G__128567));
})();
var cr128515_place_19 = cljs.core.get;
var cr128515_place_20 = cr128515_place_10;
var cr128515_place_21 = new cljs.core.Keyword(null,"remote-schema-version","remote-schema-version",-925454925);
var cr128515_place_22 = (function (){var G__128569 = cr128515_place_20;
var G__128570 = cr128515_place_21;
var fexpr__128568 = cr128515_place_19;
return (fexpr__128568.cljs$core$IFn$_invoke$arity$2 ? fexpr__128568.cljs$core$IFn$_invoke$arity$2(G__128569,G__128570) : fexpr__128568.call(null,G__128569,G__128570));
})();
var cr128515_place_23 = cljs.core.get;
var cr128515_place_24 = cr128515_place_10;
var cr128515_place_25 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr128515_place_26 = (function (){var G__128572 = cr128515_place_24;
var G__128573 = cr128515_place_25;
var fexpr__128571 = cr128515_place_23;
return (fexpr__128571.cljs$core$IFn$_invoke$arity$2 ? fexpr__128571.cljs$core$IFn$_invoke$arity$2(G__128572,G__128573) : fexpr__128571.call(null,G__128572,G__128573));
})();
var cr128515_place_27 = cr128515_place_26;
var cr128515_place_28 = cr128515_place_27;
var cr128515_place_29 = cljs.core.Keyword;
var cr128515_place_30 = (cr128515_place_28 instanceof cr128515_place_29);
var cr128515_place_31 = null;
if(cr128515_place_30){
(cr128515_state[(0)] = cr128515_block_3);

(cr128515_state[(1)] = cr128515_place_14);

(cr128515_state[(2)] = cr128515_place_18);

(cr128515_state[(3)] = cr128515_place_31);

(cr128515_state[(4)] = cr128515_place_22);

(cr128515_state[(5)] = cr128515_place_27);

return cr128515_state;
} else {
(cr128515_state[(0)] = cr128515_block_2);

(cr128515_state[(1)] = cr128515_place_14);

(cr128515_state[(2)] = cr128515_place_18);

(cr128515_state[(3)] = cr128515_place_31);

(cr128515_state[(4)] = cr128515_place_22);

return cr128515_state;
}
}catch (e128559){var cr128515_exception = e128559;
(cr128515_state[(0)] = null);

throw cr128515_exception;
}});
var cr128515_block_2 = (function frontend$handler$db_based$rtc_background_tasks$cr128515_block_2(cr128515_state){
try{var cr128515_place_32 = null;
(cr128515_state[(0)] = cr128515_block_4);

(cr128515_state[(3)] = cr128515_place_32);

return cr128515_state;
}catch (e128574){var cr128515_exception = e128574;
(cr128515_state[(0)] = null);

(cr128515_state[(1)] = null);

(cr128515_state[(2)] = null);

(cr128515_state[(3)] = null);

(cr128515_state[(4)] = null);

throw cr128515_exception;
}});
var cr128515_block_3 = (function frontend$handler$db_based$rtc_background_tasks$cr128515_block_3(cr128515_state){
try{var cr128515_place_27 = (cr128515_state[(5)]);
var cr128515_place_33 = cr128515_place_27;
var cr128515_place_34 = cr128515_place_33.fqn;
(cr128515_state[(0)] = cr128515_block_4);

(cr128515_state[(5)] = null);

(cr128515_state[(3)] = cr128515_place_34);

return cr128515_state;
}catch (e128575){var cr128515_exception = e128575;
(cr128515_state[(0)] = null);

(cr128515_state[(1)] = null);

(cr128515_state[(2)] = null);

(cr128515_state[(3)] = null);

(cr128515_state[(4)] = null);

(cr128515_state[(5)] = null);

throw cr128515_exception;
}});
var cr128515_block_4 = (function frontend$handler$db_based$rtc_background_tasks$cr128515_block_4(cr128515_state){
try{var cr128515_place_31 = (cr128515_state[(3)]);
var cr128515_place_35 = cr128515_place_31;
var cr128515_place_36 = null;
var G__128577 = cr128515_place_35;
switch (G__128577) {
case "download":
(cr128515_state[(0)] = cr128515_block_5);

(cr128515_state[(3)] = null);

(cr128515_state[(3)] = cr128515_place_36);

return cr128515_state;

break;
default:
(cr128515_state[(0)] = cr128515_block_6);

(cr128515_state[(1)] = null);

(cr128515_state[(2)] = null);

(cr128515_state[(3)] = null);

(cr128515_state[(4)] = null);

(cr128515_state[(3)] = cr128515_place_36);

return cr128515_state;

}
}catch (e128576){var cr128515_exception = e128576;
(cr128515_state[(0)] = null);

(cr128515_state[(1)] = null);

(cr128515_state[(2)] = null);

(cr128515_state[(3)] = null);

(cr128515_state[(4)] = null);

throw cr128515_exception;
}});
var cr128515_block_5 = (function frontend$handler$db_based$rtc_background_tasks$cr128515_block_5(cr128515_state){
try{var cr128515_place_14 = (cr128515_state[(1)]);
var cr128515_place_18 = (cr128515_state[(2)]);
var cr128515_place_22 = (cr128515_state[(4)]);
var cr128515_place_37 = frontend.handler.db_based.rtc.notification_download_higher_schema_graph_BANG_;
var cr128515_place_38 = cr128515_place_14;
var cr128515_place_39 = cr128515_place_18;
var cr128515_place_40 = cr128515_place_22;
var cr128515_place_41 = (function (){var G__128580 = cr128515_place_38;
var G__128581 = cr128515_place_39;
var G__128582 = cr128515_place_40;
var fexpr__128579 = cr128515_place_37;
return (fexpr__128579.cljs$core$IFn$_invoke$arity$3 ? fexpr__128579.cljs$core$IFn$_invoke$arity$3(G__128580,G__128581,G__128582) : fexpr__128579.call(null,G__128580,G__128581,G__128582));
})();
(cr128515_state[(0)] = cr128515_block_7);

(cr128515_state[(1)] = null);

(cr128515_state[(2)] = null);

(cr128515_state[(4)] = null);

(cr128515_state[(3)] = cr128515_place_41);

return cr128515_state;
}catch (e128578){var cr128515_exception = e128578;
(cr128515_state[(0)] = null);

(cr128515_state[(1)] = null);

(cr128515_state[(2)] = null);

(cr128515_state[(3)] = null);

(cr128515_state[(4)] = null);

throw cr128515_exception;
}});
var cr128515_block_6 = (function frontend$handler$db_based$rtc_background_tasks$cr128515_block_6(cr128515_state){
try{var cr128515_place_42 = frontend.handler.notification.show_BANG_;
var cr128515_place_43 = "The server has a graph with a higher schema version, the client may need to upgrade.";
var cr128515_place_44 = new cljs.core.Keyword(null,"warning","warning",-1685650671);
var cr128515_place_45 = (function (){var G__128585 = cr128515_place_43;
var G__128586 = cr128515_place_44;
var fexpr__128584 = cr128515_place_42;
return (fexpr__128584.cljs$core$IFn$_invoke$arity$2 ? fexpr__128584.cljs$core$IFn$_invoke$arity$2(G__128585,G__128586) : fexpr__128584.call(null,G__128585,G__128586));
})();
(cr128515_state[(0)] = cr128515_block_7);

(cr128515_state[(3)] = cr128515_place_45);

return cr128515_state;
}catch (e128583){var cr128515_exception = e128583;
(cr128515_state[(0)] = null);

(cr128515_state[(3)] = null);

throw cr128515_exception;
}});
var cr128515_block_7 = (function frontend$handler$db_based$rtc_background_tasks$cr128515_block_7(cr128515_state){
try{var cr128515_place_36 = (cr128515_state[(3)]);
(cr128515_state[(0)] = null);

(cr128515_state[(3)] = null);

return cr128515_place_36;
}catch (e128587){var cr128515_exception = e128587;
(cr128515_state[(0)] = null);

(cr128515_state[(3)] = null);

throw cr128515_exception;
}});
return cloroutine.impl.coroutine((function (){var G__128588 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((6));
(G__128588[(0)] = cr128515_block_0);

return G__128588;
})());
})(),missionary.core.ap_run)));
frontend.handler.db_based.rtc_background_tasks.run_background_task_when_not_publishing(new cljs.core.Keyword("frontend.handler.db-based.rtc-background-tasks","stop-rtc-if-needed","frontend.handler.db-based.rtc-background-tasks/stop-rtc-if-needed",520711379),missionary.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.constantly(null),cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr128589_block_0 = (function frontend$handler$db_based$rtc_background_tasks$cr128589_block_0(cr128589_state){
try{var cr128589_place_0 = (1);
var cr128589_place_1 = frontend.handler.db_based.rtc_flows.logout_or_graph_switch_flow;
(cr128589_state[(0)] = cr128589_block_1);

return missionary.core.fork(cr128589_place_0,cr128589_place_1);
}catch (e128603){var cr128589_exception = e128603;
(cr128589_state[(0)] = null);

throw cr128589_exception;
}});
var cr128589_block_1 = (function frontend$handler$db_based$rtc_background_tasks$cr128589_block_1(cr128589_state){
try{var cr128589_place_2 = missionary.core.unpark();
var cr128589_place_3 = lambdaisland.glogi.log;
var cr128589_place_4 = "frontend.handler.db-based.rtc-background-tasks";
var cr128589_place_5 = new cljs.core.Keyword(null,"info","info",-317069002);
var cr128589_place_6 = cljs.core.identity;
var cr128589_place_7 = new cljs.core.Keyword(null,"try-to-stop-rtc-if-needed","try-to-stop-rtc-if-needed",-2093831810);
var cr128589_place_8 = cr128589_place_2;
var cr128589_place_9 = new cljs.core.Keyword(null,"line","line",212345235);
var cr128589_place_10 = 60;
var cr128589_place_11 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr128589_place_7,cr128589_place_8,cr128589_place_9,cr128589_place_10]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr128589_place_12 = (function (){var G__128606 = cr128589_place_11;
var fexpr__128605 = cr128589_place_6;
return (fexpr__128605.cljs$core$IFn$_invoke$arity$1 ? fexpr__128605.cljs$core$IFn$_invoke$arity$1(G__128606) : fexpr__128605.call(null,G__128606));
})();
var cr128589_place_13 = null;
var cr128589_place_14 = (function (){var G__128608 = cr128589_place_4;
var G__128609 = cr128589_place_5;
var G__128610 = cr128589_place_12;
var G__128611 = cr128589_place_13;
var fexpr__128607 = cr128589_place_3;
return (fexpr__128607.cljs$core$IFn$_invoke$arity$4 ? fexpr__128607.cljs$core$IFn$_invoke$arity$4(G__128608,G__128609,G__128610,G__128611) : fexpr__128607.call(null,G__128608,G__128609,G__128610,G__128611));
})();
var cr128589_place_15 = frontend.common.missionary._LT__BANG_;
var cr128589_place_16 = frontend.handler.db_based.rtc._LT_rtc_stop_BANG_;
var cr128589_place_17 = (function (){var fexpr__128612 = cr128589_place_16;
return (fexpr__128612.cljs$core$IFn$_invoke$arity$0 ? fexpr__128612.cljs$core$IFn$_invoke$arity$0() : fexpr__128612.call(null));
})();
var cr128589_place_18 = (function (){var G__128614 = cr128589_place_17;
var fexpr__128613 = cr128589_place_15;
return (fexpr__128613.cljs$core$IFn$_invoke$arity$1 ? fexpr__128613.cljs$core$IFn$_invoke$arity$1(G__128614) : fexpr__128613.call(null,G__128614));
})();
(cr128589_state[(0)] = cr128589_block_2);

return missionary.core.park(cr128589_place_18);
}catch (e128604){var cr128589_exception = e128604;
(cr128589_state[(0)] = null);

throw cr128589_exception;
}});
var cr128589_block_2 = (function frontend$handler$db_based$rtc_background_tasks$cr128589_block_2(cr128589_state){
try{var cr128589_place_19 = missionary.core.unpark();
(cr128589_state[(0)] = null);

return cr128589_place_19;
}catch (e128615){var cr128589_exception = e128615;
(cr128589_state[(0)] = null);

throw cr128589_exception;
}});
return cloroutine.impl.coroutine((function (){var G__128616 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__128616[(0)] = cr128589_block_0);

return G__128616;
})());
})(),missionary.core.ap_run)));
frontend.handler.db_based.rtc_background_tasks.run_background_task_when_not_publishing(new cljs.core.Keyword("frontend.handler.db-based.rtc-background-tasks","auto-start-rtc-if-possible","frontend.handler.db-based.rtc-background-tasks/auto-start-rtc-if-possible",-1681669003),missionary.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.constantly(null),cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr128617_block_0 = (function frontend$handler$db_based$rtc_background_tasks$cr128617_block_0(cr128617_state){
try{var cr128617_place_0 = (1);
var cr128617_place_1 = frontend.handler.db_based.rtc_flows.trigger_start_rtc_flow;
(cr128617_state[(0)] = cr128617_block_1);

return missionary.core.fork(cr128617_place_0,cr128617_place_1);
}catch (e128647){var cr128617_exception = e128647;
(cr128617_state[(0)] = null);

throw cr128617_exception;
}});
var cr128617_block_1 = (function frontend$handler$db_based$rtc_background_tasks$cr128617_block_1(cr128617_state){
try{var cr128617_place_2 = missionary.core.unpark();
var cr128617_place_3 = cljs.core.nth;
var cr128617_place_4 = cr128617_place_2;
var cr128617_place_5 = (0);
var cr128617_place_6 = null;
var cr128617_place_7 = (function (){var G__128650 = cr128617_place_4;
var G__128651 = cr128617_place_5;
var G__128652 = cr128617_place_6;
var fexpr__128649 = cr128617_place_3;
return (fexpr__128649.cljs$core$IFn$_invoke$arity$3 ? fexpr__128649.cljs$core$IFn$_invoke$arity$3(G__128650,G__128651,G__128652) : fexpr__128649.call(null,G__128650,G__128651,G__128652));
})();
var cr128617_place_8 = cljs.core.nth;
var cr128617_place_9 = cr128617_place_2;
var cr128617_place_10 = (1);
var cr128617_place_11 = null;
var cr128617_place_12 = (function (){var G__128654 = cr128617_place_9;
var G__128655 = cr128617_place_10;
var G__128656 = cr128617_place_11;
var fexpr__128653 = cr128617_place_8;
return (fexpr__128653.cljs$core$IFn$_invoke$arity$3 ? fexpr__128653.cljs$core$IFn$_invoke$arity$3(G__128654,G__128655,G__128656) : fexpr__128653.call(null,G__128654,G__128655,G__128656));
})();
var cr128617_place_13 = lambdaisland.glogi.log;
var cr128617_place_14 = "frontend.handler.db-based.rtc-background-tasks";
var cr128617_place_15 = new cljs.core.Keyword(null,"info","info",-317069002);
var cr128617_place_16 = cljs.core.identity;
var cr128617_place_17 = new cljs.core.Keyword(null,"try-to-start-rtc","try-to-start-rtc",-96997866);
var cr128617_place_18 = cr128617_place_7;
var cr128617_place_19 = cr128617_place_12;
var cr128617_place_20 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr128617_place_18,cr128617_place_19], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr128617_place_21 = new cljs.core.Keyword(null,"line","line",212345235);
var cr128617_place_22 = 70;
var cr128617_place_23 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr128617_place_17,cr128617_place_20,cr128617_place_21,cr128617_place_22]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr128617_place_24 = (function (){var G__128658 = cr128617_place_23;
var fexpr__128657 = cr128617_place_16;
return (fexpr__128657.cljs$core$IFn$_invoke$arity$1 ? fexpr__128657.cljs$core$IFn$_invoke$arity$1(G__128658) : fexpr__128657.call(null,G__128658));
})();
var cr128617_place_25 = null;
var cr128617_place_26 = (function (){var G__128660 = cr128617_place_14;
var G__128661 = cr128617_place_15;
var G__128662 = cr128617_place_24;
var G__128663 = cr128617_place_25;
var fexpr__128659 = cr128617_place_13;
return (fexpr__128659.cljs$core$IFn$_invoke$arity$4 ? fexpr__128659.cljs$core$IFn$_invoke$arity$4(G__128660,G__128661,G__128662,G__128663) : fexpr__128659.call(null,G__128660,G__128661,G__128662,G__128663));
})();
var cr128617_place_27 = frontend.common.missionary._LT__BANG_;
var cr128617_place_28 = frontend.handler.db_based.rtc._LT_rtc_start_BANG_;
var cr128617_place_29 = cr128617_place_12;
var cr128617_place_30 = cr128617_place_29;
var cr128617_place_31 = null;
if(cljs.core.truth_(cr128617_place_30)){
(cr128617_state[(0)] = cr128617_block_3);

(cr128617_state[(1)] = cr128617_place_28);

(cr128617_state[(2)] = cr128617_place_31);

(cr128617_state[(3)] = cr128617_place_27);

(cr128617_state[(4)] = cr128617_place_29);

return cr128617_state;
} else {
(cr128617_state[(0)] = cr128617_block_2);

(cr128617_state[(1)] = cr128617_place_28);

(cr128617_state[(2)] = cr128617_place_31);

(cr128617_state[(3)] = cr128617_place_27);

return cr128617_state;
}
}catch (e128648){var cr128617_exception = e128648;
(cr128617_state[(0)] = null);

throw cr128617_exception;
}});
var cr128617_block_2 = (function frontend$handler$db_based$rtc_background_tasks$cr128617_block_2(cr128617_state){
try{var cr128617_place_32 = frontend.state.get_current_repo;
var cr128617_place_33 = (function (){var fexpr__128665 = cr128617_place_32;
return (fexpr__128665.cljs$core$IFn$_invoke$arity$0 ? fexpr__128665.cljs$core$IFn$_invoke$arity$0() : fexpr__128665.call(null));
})();
(cr128617_state[(0)] = cr128617_block_4);

(cr128617_state[(2)] = cr128617_place_33);

return cr128617_state;
}catch (e128664){var cr128617_exception = e128664;
(cr128617_state[(0)] = null);

(cr128617_state[(1)] = null);

(cr128617_state[(2)] = null);

(cr128617_state[(3)] = null);

throw cr128617_exception;
}});
var cr128617_block_3 = (function frontend$handler$db_based$rtc_background_tasks$cr128617_block_3(cr128617_state){
try{var cr128617_place_29 = (cr128617_state[(4)]);
var cr128617_place_34 = cr128617_place_29;
(cr128617_state[(0)] = cr128617_block_4);

(cr128617_state[(4)] = null);

(cr128617_state[(2)] = cr128617_place_34);

return cr128617_state;
}catch (e128666){var cr128617_exception = e128666;
(cr128617_state[(0)] = null);

(cr128617_state[(1)] = null);

(cr128617_state[(2)] = null);

(cr128617_state[(3)] = null);

(cr128617_state[(4)] = null);

throw cr128617_exception;
}});
var cr128617_block_4 = (function frontend$handler$db_based$rtc_background_tasks$cr128617_block_4(cr128617_state){
try{var cr128617_place_28 = (cr128617_state[(1)]);
var cr128617_place_31 = (cr128617_state[(2)]);
var cr128617_place_27 = (cr128617_state[(3)]);
var cr128617_place_35 = (function (){var G__128669 = cr128617_place_31;
var fexpr__128668 = cr128617_place_28;
return (fexpr__128668.cljs$core$IFn$_invoke$arity$1 ? fexpr__128668.cljs$core$IFn$_invoke$arity$1(G__128669) : fexpr__128668.call(null,G__128669));
})();
var cr128617_place_36 = (function (){var G__128671 = cr128617_place_35;
var fexpr__128670 = cr128617_place_27;
return (fexpr__128670.cljs$core$IFn$_invoke$arity$1 ? fexpr__128670.cljs$core$IFn$_invoke$arity$1(G__128671) : fexpr__128670.call(null,G__128671));
})();
(cr128617_state[(0)] = cr128617_block_5);

(cr128617_state[(1)] = null);

(cr128617_state[(2)] = null);

(cr128617_state[(3)] = null);

return missionary.core.park(cr128617_place_36);
}catch (e128667){var cr128617_exception = e128667;
(cr128617_state[(0)] = null);

(cr128617_state[(1)] = null);

(cr128617_state[(2)] = null);

(cr128617_state[(3)] = null);

throw cr128617_exception;
}});
var cr128617_block_5 = (function frontend$handler$db_based$rtc_background_tasks$cr128617_block_5(cr128617_state){
try{var cr128617_place_37 = missionary.core.unpark();
(cr128617_state[(0)] = null);

return cr128617_place_37;
}catch (e128672){var cr128617_exception = e128672;
(cr128617_state[(0)] = null);

throw cr128617_exception;
}});
return cloroutine.impl.coroutine((function (){var G__128673 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__128673[(0)] = cr128617_block_0);

return G__128673;
})());
})(),missionary.core.ap_run)));

//# sourceMappingURL=frontend.handler.db_based.rtc_background_tasks.js.map
