goog.provide('frontend.handler.db_based.rtc_background_tasks');
frontend.handler.db_based.rtc_background_tasks.run_background_task_when_not_publishing = (function frontend$handler$db_based$rtc_background_tasks$run_background_task_when_not_publishing(key_SINGLEQUOTE_,task){
if(frontend.config.publishing_QMARK_){
return null;
} else {
return frontend.common.missionary.run_background_task(key_SINGLEQUOTE_,task);
}
});
frontend.handler.db_based.rtc_background_tasks.run_background_task_when_not_publishing(new cljs.core.Keyword("frontend.handler.db-based.rtc-background-tasks","restart-rtc-to-reconnect","frontend.handler.db-based.rtc-background-tasks/restart-rtc-to-reconnect",1855716871),missionary.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.constantly(null),cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr93688_block_11 = (function frontend$handler$db_based$rtc_background_tasks$cr93688_block_11(cr93688_state){
try{var cr93688_place_36 = (cr93688_state[(1)]);
(cr93688_state[(0)] = null);

(cr93688_state[(1)] = null);

return cr93688_place_36;
}catch (e93732){var cr93688_exception = e93732;
(cr93688_state[(0)] = null);

(cr93688_state[(1)] = null);

throw cr93688_exception;
}});
var cr93688_block_3 = (function frontend$handler$db_based$rtc_background_tasks$cr93688_block_3(cr93688_state){
try{var cr93688_place_13 = (cr93688_state[(1)]);
var cr93688_place_18 = cr93688_place_13;
var cr93688_place_19 = cr93688_place_18;
var cr93688_place_20 = null;
if(cljs.core.truth_(cr93688_place_19)){
(cr93688_state[(0)] = cr93688_block_5);

(cr93688_state[(4)] = cr93688_place_20);

return cr93688_state;
} else {
(cr93688_state[(0)] = cr93688_block_4);

(cr93688_state[(1)] = null);

(cr93688_state[(1)] = cr93688_place_18);

(cr93688_state[(4)] = cr93688_place_20);

return cr93688_state;
}
}catch (e93733){var cr93688_exception = e93733;
(cr93688_state[(0)] = null);

(cr93688_state[(1)] = null);

(cr93688_state[(2)] = null);

(cr93688_state[(3)] = null);

throw cr93688_exception;
}});
var cr93688_block_4 = (function frontend$handler$db_based$rtc_background_tasks$cr93688_block_4(cr93688_state){
try{var cr93688_place_18 = (cr93688_state[(1)]);
var cr93688_place_21 = cr93688_place_18;
(cr93688_state[(0)] = cr93688_block_6);

(cr93688_state[(1)] = null);

(cr93688_state[(4)] = cr93688_place_21);

return cr93688_state;
}catch (e93734){var cr93688_exception = e93734;
(cr93688_state[(0)] = null);

(cr93688_state[(2)] = null);

(cr93688_state[(4)] = null);

(cr93688_state[(1)] = null);

(cr93688_state[(3)] = null);

throw cr93688_exception;
}});
var cr93688_block_1 = (function frontend$handler$db_based$rtc_background_tasks$cr93688_block_1(cr93688_state){
try{var cr93688_place_2 = missionary.core.unpark();
var cr93688_place_3 = cljs.core.__destructure_map;
var cr93688_place_4 = cr93688_place_2;
var cr93688_place_5 = (function (){var G__93737 = cr93688_place_4;
var fexpr__93736 = cr93688_place_3;
return (fexpr__93736.cljs$core$IFn$_invoke$arity$1 ? fexpr__93736.cljs$core$IFn$_invoke$arity$1(G__93737) : fexpr__93736.call(null,G__93737));
})();
var cr93688_place_6 = cljs.core.get;
var cr93688_place_7 = cr93688_place_5;
var cr93688_place_8 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr93688_place_9 = (function (){var G__93739 = cr93688_place_7;
var G__93740 = cr93688_place_8;
var fexpr__93738 = cr93688_place_6;
return (fexpr__93738.cljs$core$IFn$_invoke$arity$2 ? fexpr__93738.cljs$core$IFn$_invoke$arity$2(G__93739,G__93740) : fexpr__93738.call(null,G__93739,G__93740));
})();
var cr93688_place_10 = cljs.core.get;
var cr93688_place_11 = cr93688_place_5;
var cr93688_place_12 = new cljs.core.Keyword(null,"t","t",-1397832519);
var cr93688_place_13 = (function (){var G__93742 = cr93688_place_11;
var G__93743 = cr93688_place_12;
var fexpr__93741 = cr93688_place_10;
return (fexpr__93741.cljs$core$IFn$_invoke$arity$2 ? fexpr__93741.cljs$core$IFn$_invoke$arity$2(G__93742,G__93743) : fexpr__93741.call(null,G__93742,G__93743));
})();
var cr93688_place_14 = cr93688_place_9;
var cr93688_place_15 = cr93688_place_14;
var cr93688_place_16 = null;
if(cljs.core.truth_(cr93688_place_15)){
(cr93688_state[(0)] = cr93688_block_3);

(cr93688_state[(1)] = cr93688_place_13);

(cr93688_state[(2)] = cr93688_place_9);

(cr93688_state[(3)] = cr93688_place_16);

return cr93688_state;
} else {
(cr93688_state[(0)] = cr93688_block_2);

(cr93688_state[(1)] = cr93688_place_14);

(cr93688_state[(2)] = cr93688_place_9);

(cr93688_state[(3)] = cr93688_place_16);

return cr93688_state;
}
}catch (e93735){var cr93688_exception = e93735;
(cr93688_state[(0)] = null);

throw cr93688_exception;
}});
var cr93688_block_7 = (function frontend$handler$db_based$rtc_background_tasks$cr93688_block_7(cr93688_state){
try{var cr93688_place_16 = (cr93688_state[(3)]);
var cr93688_place_36 = null;
if(cljs.core.truth_(cr93688_place_16)){
(cr93688_state[(0)] = cr93688_block_9);

(cr93688_state[(3)] = null);

(cr93688_state[(1)] = cr93688_place_36);

return cr93688_state;
} else {
(cr93688_state[(0)] = cr93688_block_8);

(cr93688_state[(2)] = null);

(cr93688_state[(3)] = null);

(cr93688_state[(1)] = cr93688_place_36);

return cr93688_state;
}
}catch (e93744){var cr93688_exception = e93744;
(cr93688_state[(0)] = null);

(cr93688_state[(2)] = null);

(cr93688_state[(3)] = null);

throw cr93688_exception;
}});
var cr93688_block_8 = (function frontend$handler$db_based$rtc_background_tasks$cr93688_block_8(cr93688_state){
try{var cr93688_place_37 = null;
(cr93688_state[(0)] = cr93688_block_11);

(cr93688_state[(1)] = cr93688_place_37);

return cr93688_state;
}catch (e93745){var cr93688_exception = e93745;
(cr93688_state[(0)] = null);

(cr93688_state[(1)] = null);

throw cr93688_exception;
}});
var cr93688_block_0 = (function frontend$handler$db_based$rtc_background_tasks$cr93688_block_0(cr93688_state){
try{var cr93688_place_0 = (1);
var cr93688_place_1 = frontend.handler.db_based.rtc_flows.rtc_try_restart_flow;
(cr93688_state[(0)] = cr93688_block_1);

return missionary.core.fork(cr93688_place_0,cr93688_place_1);
}catch (e93746){var cr93688_exception = e93746;
(cr93688_state[(0)] = null);

throw cr93688_exception;
}});
var cr93688_block_2 = (function frontend$handler$db_based$rtc_background_tasks$cr93688_block_2(cr93688_state){
try{var cr93688_place_14 = (cr93688_state[(1)]);
var cr93688_place_17 = cr93688_place_14;
(cr93688_state[(0)] = cr93688_block_7);

(cr93688_state[(1)] = null);

(cr93688_state[(3)] = cr93688_place_17);

return cr93688_state;
}catch (e93747){var cr93688_exception = e93747;
(cr93688_state[(0)] = null);

(cr93688_state[(1)] = null);

(cr93688_state[(2)] = null);

(cr93688_state[(3)] = null);

throw cr93688_exception;
}});
var cr93688_block_5 = (function frontend$handler$db_based$rtc_background_tasks$cr93688_block_5(cr93688_state){
try{var cr93688_place_13 = (cr93688_state[(1)]);
var cr93688_place_9 = (cr93688_state[(2)]);
var cr93688_place_22 = cljs.core._EQ_;
var cr93688_place_23 = cr93688_place_9;
var cr93688_place_24 = logseq.db.get_graph_rtc_uuid;
var cr93688_place_25 = frontend.db.get_db;
var cr93688_place_26 = (function (){var fexpr__93749 = cr93688_place_25;
return (fexpr__93749.cljs$core$IFn$_invoke$arity$0 ? fexpr__93749.cljs$core$IFn$_invoke$arity$0() : fexpr__93749.call(null));
})();
var cr93688_place_27 = (function (){var G__93751 = cr93688_place_26;
var fexpr__93750 = cr93688_place_24;
return (fexpr__93750.cljs$core$IFn$_invoke$arity$1 ? fexpr__93750.cljs$core$IFn$_invoke$arity$1(G__93751) : fexpr__93750.call(null,G__93751));
})();
var cr93688_place_28 = (function (){var G__93753 = cr93688_place_23;
var G__93754 = cr93688_place_27;
var fexpr__93752 = cr93688_place_22;
return (fexpr__93752.cljs$core$IFn$_invoke$arity$2 ? fexpr__93752.cljs$core$IFn$_invoke$arity$2(G__93753,G__93754) : fexpr__93752.call(null,G__93753,G__93754));
})();
var cr93688_place_29 = (5000);
var cr93688_place_30 = logseq.common.util.time_ms;
var cr93688_place_31 = (function (){var fexpr__93755 = cr93688_place_30;
return (fexpr__93755.cljs$core$IFn$_invoke$arity$0 ? fexpr__93755.cljs$core$IFn$_invoke$arity$0() : fexpr__93755.call(null));
})();
var cr93688_place_32 = cr93688_place_13;
var cr93688_place_33 = (cr93688_place_31 - cr93688_place_32);
var cr93688_place_34 = (cr93688_place_29 > cr93688_place_33);
var cr93688_place_35 = ((cr93688_place_28) && (cr93688_place_34));
(cr93688_state[(0)] = cr93688_block_6);

(cr93688_state[(1)] = null);

(cr93688_state[(4)] = cr93688_place_35);

return cr93688_state;
}catch (e93748){var cr93688_exception = e93748;
(cr93688_state[(0)] = null);

(cr93688_state[(1)] = null);

(cr93688_state[(2)] = null);

(cr93688_state[(4)] = null);

(cr93688_state[(3)] = null);

throw cr93688_exception;
}});
var cr93688_block_6 = (function frontend$handler$db_based$rtc_background_tasks$cr93688_block_6(cr93688_state){
try{var cr93688_place_20 = (cr93688_state[(4)]);
(cr93688_state[(0)] = cr93688_block_7);

(cr93688_state[(4)] = null);

(cr93688_state[(3)] = cr93688_place_20);

return cr93688_state;
}catch (e93756){var cr93688_exception = e93756;
(cr93688_state[(0)] = null);

(cr93688_state[(2)] = null);

(cr93688_state[(4)] = null);

(cr93688_state[(3)] = null);

throw cr93688_exception;
}});
var cr93688_block_10 = (function frontend$handler$db_based$rtc_background_tasks$cr93688_block_10(cr93688_state){
try{var cr93688_place_61 = missionary.core.unpark();
(cr93688_state[(0)] = cr93688_block_11);

(cr93688_state[(1)] = cr93688_place_61);

return cr93688_state;
}catch (e93757){var cr93688_exception = e93757;
(cr93688_state[(0)] = null);

(cr93688_state[(1)] = null);

throw cr93688_exception;
}});
var cr93688_block_9 = (function frontend$handler$db_based$rtc_background_tasks$cr93688_block_9(cr93688_state){
try{var cr93688_place_9 = (cr93688_state[(2)]);
var cr93688_place_38 = lambdaisland.glogi.log;
var cr93688_place_39 = "frontend.handler.db-based.rtc-background-tasks";
var cr93688_place_40 = new cljs.core.Keyword(null,"info","info",-317069002);
var cr93688_place_41 = cljs.core.identity;
var cr93688_place_42 = new cljs.core.Keyword(null,"trying-to-restart-rtc","trying-to-restart-rtc",-1476604561);
var cr93688_place_43 = cr93688_place_9;
var cr93688_place_44 = new cljs.core.Keyword(null,"t","t",-1397832519);
var cr93688_place_45 = cljs_time.core.now;
var cr93688_place_46 = (function (){var fexpr__93759 = cr93688_place_45;
return (fexpr__93759.cljs$core$IFn$_invoke$arity$0 ? fexpr__93759.cljs$core$IFn$_invoke$arity$0() : fexpr__93759.call(null));
})();
var cr93688_place_47 = new cljs.core.Keyword(null,"line","line",212345235);
var cr93688_place_48 = 32;
var cr93688_place_49 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr93688_place_44,cr93688_place_46,cr93688_place_47,cr93688_place_48,cr93688_place_42,cr93688_place_43]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr93688_place_50 = (function (){var G__93761 = cr93688_place_49;
var fexpr__93760 = cr93688_place_41;
return (fexpr__93760.cljs$core$IFn$_invoke$arity$1 ? fexpr__93760.cljs$core$IFn$_invoke$arity$1(G__93761) : fexpr__93760.call(null,G__93761));
})();
var cr93688_place_51 = null;
var cr93688_place_52 = (function (){var G__93763 = cr93688_place_39;
var G__93764 = cr93688_place_40;
var G__93765 = cr93688_place_50;
var G__93766 = cr93688_place_51;
var fexpr__93762 = cr93688_place_38;
return (fexpr__93762.cljs$core$IFn$_invoke$arity$4 ? fexpr__93762.cljs$core$IFn$_invoke$arity$4(G__93763,G__93764,G__93765,G__93766) : fexpr__93762.call(null,G__93763,G__93764,G__93765,G__93766));
})();
var cr93688_place_53 = frontend.common.missionary._LT__BANG_;
var cr93688_place_54 = frontend.handler.db_based.rtc._LT_rtc_start_BANG_;
var cr93688_place_55 = frontend.state.get_current_repo;
var cr93688_place_56 = (function (){var fexpr__93767 = cr93688_place_55;
return (fexpr__93767.cljs$core$IFn$_invoke$arity$0 ? fexpr__93767.cljs$core$IFn$_invoke$arity$0() : fexpr__93767.call(null));
})();
var cr93688_place_57 = new cljs.core.Keyword(null,"stop-before-start?","stop-before-start?",1190543403);
var cr93688_place_58 = false;
var cr93688_place_59 = (function (){var G__93769 = cr93688_place_56;
var G__93770 = cr93688_place_57;
var G__93771 = cr93688_place_58;
var fexpr__93768 = cr93688_place_54;
return (fexpr__93768.cljs$core$IFn$_invoke$arity$3 ? fexpr__93768.cljs$core$IFn$_invoke$arity$3(G__93769,G__93770,G__93771) : fexpr__93768.call(null,G__93769,G__93770,G__93771));
})();
var cr93688_place_60 = (function (){var G__93773 = cr93688_place_59;
var fexpr__93772 = cr93688_place_53;
return (fexpr__93772.cljs$core$IFn$_invoke$arity$1 ? fexpr__93772.cljs$core$IFn$_invoke$arity$1(G__93773) : fexpr__93772.call(null,G__93773));
})();
(cr93688_state[(0)] = cr93688_block_10);

(cr93688_state[(2)] = null);

return missionary.core.park(cr93688_place_60);
}catch (e93758){var cr93688_exception = e93758;
(cr93688_state[(0)] = null);

(cr93688_state[(2)] = null);

(cr93688_state[(1)] = null);

throw cr93688_exception;
}});
return cloroutine.impl.coroutine((function (){var G__93774 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__93774[(0)] = cr93688_block_0);

return G__93774;
})());
})(),missionary.core.ap_run)));
frontend.handler.db_based.rtc_background_tasks.run_background_task_when_not_publishing(new cljs.core.Keyword("frontend.handler.db-based.rtc-background-tasks","notify-client-need-upgrade-when-larger-remote-schema-version-exists","frontend.handler.db-based.rtc-background-tasks/notify-client-need-upgrade-when-larger-remote-schema-version-exists",2038630927),missionary.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.constantly(null),cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr93776_block_0 = (function frontend$handler$db_based$rtc_background_tasks$cr93776_block_0(cr93776_state){
try{var cr93776_place_0 = (1);
var cr93776_place_1 = missionary.core.eduction;
var cr93776_place_2 = cljs.core.filter;
var cr93776_place_3 = (function (p1__93775_SHARP_){
return cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("rtc.log","higher-remote-schema-version-exists","rtc.log/higher-remote-schema-version-exists",1466780034),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__93775_SHARP_));
});
var cr93776_place_4 = (function (){var G__93816 = cr93776_place_3;
var fexpr__93815 = cr93776_place_2;
return (fexpr__93815.cljs$core$IFn$_invoke$arity$1 ? fexpr__93815.cljs$core$IFn$_invoke$arity$1(G__93816) : fexpr__93815.call(null,G__93816));
})();
var cr93776_place_5 = frontend.handler.db_based.rtc_flows.rtc_log_flow;
var cr93776_place_6 = (function (){var G__93818 = cr93776_place_4;
var G__93819 = cr93776_place_5;
var fexpr__93817 = cr93776_place_1;
return (fexpr__93817.cljs$core$IFn$_invoke$arity$2 ? fexpr__93817.cljs$core$IFn$_invoke$arity$2(G__93818,G__93819) : fexpr__93817.call(null,G__93818,G__93819));
})();
(cr93776_state[(0)] = cr93776_block_1);

return missionary.core.fork(cr93776_place_0,cr93776_place_6);
}catch (e93814){var cr93776_exception = e93814;
(cr93776_state[(0)] = null);

throw cr93776_exception;
}});
var cr93776_block_1 = (function frontend$handler$db_based$rtc_background_tasks$cr93776_block_1(cr93776_state){
try{var cr93776_place_7 = missionary.core.unpark();
var cr93776_place_8 = cljs.core.__destructure_map;
var cr93776_place_9 = cr93776_place_7;
var cr93776_place_10 = (function (){var G__93822 = cr93776_place_9;
var fexpr__93821 = cr93776_place_8;
return (fexpr__93821.cljs$core$IFn$_invoke$arity$1 ? fexpr__93821.cljs$core$IFn$_invoke$arity$1(G__93822) : fexpr__93821.call(null,G__93822));
})();
var cr93776_place_11 = cljs.core.get;
var cr93776_place_12 = cr93776_place_10;
var cr93776_place_13 = new cljs.core.Keyword(null,"repo","repo",-1999060679);
var cr93776_place_14 = (function (){var G__93824 = cr93776_place_12;
var G__93825 = cr93776_place_13;
var fexpr__93823 = cr93776_place_11;
return (fexpr__93823.cljs$core$IFn$_invoke$arity$2 ? fexpr__93823.cljs$core$IFn$_invoke$arity$2(G__93824,G__93825) : fexpr__93823.call(null,G__93824,G__93825));
})();
var cr93776_place_15 = cljs.core.get;
var cr93776_place_16 = cr93776_place_10;
var cr93776_place_17 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr93776_place_18 = (function (){var G__93827 = cr93776_place_16;
var G__93828 = cr93776_place_17;
var fexpr__93826 = cr93776_place_15;
return (fexpr__93826.cljs$core$IFn$_invoke$arity$2 ? fexpr__93826.cljs$core$IFn$_invoke$arity$2(G__93827,G__93828) : fexpr__93826.call(null,G__93827,G__93828));
})();
var cr93776_place_19 = cljs.core.get;
var cr93776_place_20 = cr93776_place_10;
var cr93776_place_21 = new cljs.core.Keyword(null,"remote-schema-version","remote-schema-version",-925454925);
var cr93776_place_22 = (function (){var G__93830 = cr93776_place_20;
var G__93831 = cr93776_place_21;
var fexpr__93829 = cr93776_place_19;
return (fexpr__93829.cljs$core$IFn$_invoke$arity$2 ? fexpr__93829.cljs$core$IFn$_invoke$arity$2(G__93830,G__93831) : fexpr__93829.call(null,G__93830,G__93831));
})();
var cr93776_place_23 = cljs.core.get;
var cr93776_place_24 = cr93776_place_10;
var cr93776_place_25 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr93776_place_26 = (function (){var G__93833 = cr93776_place_24;
var G__93834 = cr93776_place_25;
var fexpr__93832 = cr93776_place_23;
return (fexpr__93832.cljs$core$IFn$_invoke$arity$2 ? fexpr__93832.cljs$core$IFn$_invoke$arity$2(G__93833,G__93834) : fexpr__93832.call(null,G__93833,G__93834));
})();
var cr93776_place_27 = cr93776_place_26;
var cr93776_place_28 = cr93776_place_27;
var cr93776_place_29 = cljs.core.Keyword;
var cr93776_place_30 = (cr93776_place_28 instanceof cr93776_place_29);
var cr93776_place_31 = null;
if(cr93776_place_30){
(cr93776_state[(0)] = cr93776_block_3);

(cr93776_state[(1)] = cr93776_place_31);

(cr93776_state[(2)] = cr93776_place_14);

(cr93776_state[(3)] = cr93776_place_18);

(cr93776_state[(4)] = cr93776_place_22);

(cr93776_state[(5)] = cr93776_place_27);

return cr93776_state;
} else {
(cr93776_state[(0)] = cr93776_block_2);

(cr93776_state[(1)] = cr93776_place_31);

(cr93776_state[(2)] = cr93776_place_14);

(cr93776_state[(3)] = cr93776_place_18);

(cr93776_state[(4)] = cr93776_place_22);

return cr93776_state;
}
}catch (e93820){var cr93776_exception = e93820;
(cr93776_state[(0)] = null);

throw cr93776_exception;
}});
var cr93776_block_2 = (function frontend$handler$db_based$rtc_background_tasks$cr93776_block_2(cr93776_state){
try{var cr93776_place_32 = null;
(cr93776_state[(0)] = cr93776_block_4);

(cr93776_state[(1)] = cr93776_place_32);

return cr93776_state;
}catch (e93835){var cr93776_exception = e93835;
(cr93776_state[(0)] = null);

(cr93776_state[(1)] = null);

(cr93776_state[(2)] = null);

(cr93776_state[(3)] = null);

(cr93776_state[(4)] = null);

throw cr93776_exception;
}});
var cr93776_block_3 = (function frontend$handler$db_based$rtc_background_tasks$cr93776_block_3(cr93776_state){
try{var cr93776_place_27 = (cr93776_state[(5)]);
var cr93776_place_33 = cr93776_place_27;
var cr93776_place_34 = cr93776_place_33.fqn;
(cr93776_state[(0)] = cr93776_block_4);

(cr93776_state[(5)] = null);

(cr93776_state[(1)] = cr93776_place_34);

return cr93776_state;
}catch (e93836){var cr93776_exception = e93836;
(cr93776_state[(0)] = null);

(cr93776_state[(1)] = null);

(cr93776_state[(2)] = null);

(cr93776_state[(3)] = null);

(cr93776_state[(4)] = null);

(cr93776_state[(5)] = null);

throw cr93776_exception;
}});
var cr93776_block_4 = (function frontend$handler$db_based$rtc_background_tasks$cr93776_block_4(cr93776_state){
try{var cr93776_place_31 = (cr93776_state[(1)]);
var cr93776_place_35 = cr93776_place_31;
var cr93776_place_36 = null;
var G__93838 = cr93776_place_35;
switch (G__93838) {
case "download":
(cr93776_state[(0)] = cr93776_block_5);

(cr93776_state[(1)] = null);

(cr93776_state[(1)] = cr93776_place_36);

return cr93776_state;

break;
default:
(cr93776_state[(0)] = cr93776_block_6);

(cr93776_state[(1)] = null);

(cr93776_state[(2)] = null);

(cr93776_state[(3)] = null);

(cr93776_state[(4)] = null);

(cr93776_state[(1)] = cr93776_place_36);

return cr93776_state;

}
}catch (e93837){var cr93776_exception = e93837;
(cr93776_state[(0)] = null);

(cr93776_state[(1)] = null);

(cr93776_state[(2)] = null);

(cr93776_state[(3)] = null);

(cr93776_state[(4)] = null);

throw cr93776_exception;
}});
var cr93776_block_5 = (function frontend$handler$db_based$rtc_background_tasks$cr93776_block_5(cr93776_state){
try{var cr93776_place_14 = (cr93776_state[(2)]);
var cr93776_place_18 = (cr93776_state[(3)]);
var cr93776_place_22 = (cr93776_state[(4)]);
var cr93776_place_37 = frontend.handler.db_based.rtc.notification_download_higher_schema_graph_BANG_;
var cr93776_place_38 = cr93776_place_14;
var cr93776_place_39 = cr93776_place_18;
var cr93776_place_40 = cr93776_place_22;
var cr93776_place_41 = (function (){var G__93841 = cr93776_place_38;
var G__93842 = cr93776_place_39;
var G__93843 = cr93776_place_40;
var fexpr__93840 = cr93776_place_37;
return (fexpr__93840.cljs$core$IFn$_invoke$arity$3 ? fexpr__93840.cljs$core$IFn$_invoke$arity$3(G__93841,G__93842,G__93843) : fexpr__93840.call(null,G__93841,G__93842,G__93843));
})();
(cr93776_state[(0)] = cr93776_block_7);

(cr93776_state[(2)] = null);

(cr93776_state[(3)] = null);

(cr93776_state[(4)] = null);

(cr93776_state[(1)] = cr93776_place_41);

return cr93776_state;
}catch (e93839){var cr93776_exception = e93839;
(cr93776_state[(0)] = null);

(cr93776_state[(1)] = null);

(cr93776_state[(2)] = null);

(cr93776_state[(3)] = null);

(cr93776_state[(4)] = null);

throw cr93776_exception;
}});
var cr93776_block_6 = (function frontend$handler$db_based$rtc_background_tasks$cr93776_block_6(cr93776_state){
try{var cr93776_place_42 = frontend.handler.notification.show_BANG_;
var cr93776_place_43 = "The server has a graph with a higher schema version, the client may need to upgrade.";
var cr93776_place_44 = new cljs.core.Keyword(null,"warning","warning",-1685650671);
var cr93776_place_45 = (function (){var G__93846 = cr93776_place_43;
var G__93847 = cr93776_place_44;
var fexpr__93845 = cr93776_place_42;
return (fexpr__93845.cljs$core$IFn$_invoke$arity$2 ? fexpr__93845.cljs$core$IFn$_invoke$arity$2(G__93846,G__93847) : fexpr__93845.call(null,G__93846,G__93847));
})();
(cr93776_state[(0)] = cr93776_block_7);

(cr93776_state[(1)] = cr93776_place_45);

return cr93776_state;
}catch (e93844){var cr93776_exception = e93844;
(cr93776_state[(0)] = null);

(cr93776_state[(1)] = null);

throw cr93776_exception;
}});
var cr93776_block_7 = (function frontend$handler$db_based$rtc_background_tasks$cr93776_block_7(cr93776_state){
try{var cr93776_place_36 = (cr93776_state[(1)]);
(cr93776_state[(0)] = null);

(cr93776_state[(1)] = null);

return cr93776_place_36;
}catch (e93848){var cr93776_exception = e93848;
(cr93776_state[(0)] = null);

(cr93776_state[(1)] = null);

throw cr93776_exception;
}});
return cloroutine.impl.coroutine((function (){var G__93849 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((6));
(G__93849[(0)] = cr93776_block_0);

return G__93849;
})());
})(),missionary.core.ap_run)));
frontend.handler.db_based.rtc_background_tasks.run_background_task_when_not_publishing(new cljs.core.Keyword("frontend.handler.db-based.rtc-background-tasks","stop-rtc-if-needed","frontend.handler.db-based.rtc-background-tasks/stop-rtc-if-needed",520711379),missionary.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.constantly(null),cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr93850_block_0 = (function frontend$handler$db_based$rtc_background_tasks$cr93850_block_0(cr93850_state){
try{var cr93850_place_0 = (1);
var cr93850_place_1 = frontend.handler.db_based.rtc_flows.logout_or_graph_switch_flow;
(cr93850_state[(0)] = cr93850_block_1);

return missionary.core.fork(cr93850_place_0,cr93850_place_1);
}catch (e93864){var cr93850_exception = e93864;
(cr93850_state[(0)] = null);

throw cr93850_exception;
}});
var cr93850_block_1 = (function frontend$handler$db_based$rtc_background_tasks$cr93850_block_1(cr93850_state){
try{var cr93850_place_2 = missionary.core.unpark();
var cr93850_place_3 = lambdaisland.glogi.log;
var cr93850_place_4 = "frontend.handler.db-based.rtc-background-tasks";
var cr93850_place_5 = new cljs.core.Keyword(null,"info","info",-317069002);
var cr93850_place_6 = cljs.core.identity;
var cr93850_place_7 = new cljs.core.Keyword(null,"try-to-stop-rtc-if-needed","try-to-stop-rtc-if-needed",-2093831810);
var cr93850_place_8 = cr93850_place_2;
var cr93850_place_9 = new cljs.core.Keyword(null,"line","line",212345235);
var cr93850_place_10 = 60;
var cr93850_place_11 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr93850_place_9,cr93850_place_10,cr93850_place_7,cr93850_place_8]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr93850_place_12 = (function (){var G__93867 = cr93850_place_11;
var fexpr__93866 = cr93850_place_6;
return (fexpr__93866.cljs$core$IFn$_invoke$arity$1 ? fexpr__93866.cljs$core$IFn$_invoke$arity$1(G__93867) : fexpr__93866.call(null,G__93867));
})();
var cr93850_place_13 = null;
var cr93850_place_14 = (function (){var G__93869 = cr93850_place_4;
var G__93870 = cr93850_place_5;
var G__93871 = cr93850_place_12;
var G__93872 = cr93850_place_13;
var fexpr__93868 = cr93850_place_3;
return (fexpr__93868.cljs$core$IFn$_invoke$arity$4 ? fexpr__93868.cljs$core$IFn$_invoke$arity$4(G__93869,G__93870,G__93871,G__93872) : fexpr__93868.call(null,G__93869,G__93870,G__93871,G__93872));
})();
var cr93850_place_15 = frontend.common.missionary._LT__BANG_;
var cr93850_place_16 = frontend.handler.db_based.rtc._LT_rtc_stop_BANG_;
var cr93850_place_17 = (function (){var fexpr__93873 = cr93850_place_16;
return (fexpr__93873.cljs$core$IFn$_invoke$arity$0 ? fexpr__93873.cljs$core$IFn$_invoke$arity$0() : fexpr__93873.call(null));
})();
var cr93850_place_18 = (function (){var G__93875 = cr93850_place_17;
var fexpr__93874 = cr93850_place_15;
return (fexpr__93874.cljs$core$IFn$_invoke$arity$1 ? fexpr__93874.cljs$core$IFn$_invoke$arity$1(G__93875) : fexpr__93874.call(null,G__93875));
})();
(cr93850_state[(0)] = cr93850_block_2);

return missionary.core.park(cr93850_place_18);
}catch (e93865){var cr93850_exception = e93865;
(cr93850_state[(0)] = null);

throw cr93850_exception;
}});
var cr93850_block_2 = (function frontend$handler$db_based$rtc_background_tasks$cr93850_block_2(cr93850_state){
try{var cr93850_place_19 = missionary.core.unpark();
(cr93850_state[(0)] = null);

return cr93850_place_19;
}catch (e93876){var cr93850_exception = e93876;
(cr93850_state[(0)] = null);

throw cr93850_exception;
}});
return cloroutine.impl.coroutine((function (){var G__93877 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__93877[(0)] = cr93850_block_0);

return G__93877;
})());
})(),missionary.core.ap_run)));
frontend.handler.db_based.rtc_background_tasks.run_background_task_when_not_publishing(new cljs.core.Keyword("frontend.handler.db-based.rtc-background-tasks","auto-start-rtc-if-possible","frontend.handler.db-based.rtc-background-tasks/auto-start-rtc-if-possible",-1681669003),missionary.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.constantly(null),cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr93878_block_0 = (function frontend$handler$db_based$rtc_background_tasks$cr93878_block_0(cr93878_state){
try{var cr93878_place_0 = (1);
var cr93878_place_1 = frontend.handler.db_based.rtc_flows.trigger_start_rtc_flow;
(cr93878_state[(0)] = cr93878_block_1);

return missionary.core.fork(cr93878_place_0,cr93878_place_1);
}catch (e93908){var cr93878_exception = e93908;
(cr93878_state[(0)] = null);

throw cr93878_exception;
}});
var cr93878_block_1 = (function frontend$handler$db_based$rtc_background_tasks$cr93878_block_1(cr93878_state){
try{var cr93878_place_2 = missionary.core.unpark();
var cr93878_place_3 = cljs.core.nth;
var cr93878_place_4 = cr93878_place_2;
var cr93878_place_5 = (0);
var cr93878_place_6 = null;
var cr93878_place_7 = (function (){var G__93911 = cr93878_place_4;
var G__93912 = cr93878_place_5;
var G__93913 = cr93878_place_6;
var fexpr__93910 = cr93878_place_3;
return (fexpr__93910.cljs$core$IFn$_invoke$arity$3 ? fexpr__93910.cljs$core$IFn$_invoke$arity$3(G__93911,G__93912,G__93913) : fexpr__93910.call(null,G__93911,G__93912,G__93913));
})();
var cr93878_place_8 = cljs.core.nth;
var cr93878_place_9 = cr93878_place_2;
var cr93878_place_10 = (1);
var cr93878_place_11 = null;
var cr93878_place_12 = (function (){var G__93915 = cr93878_place_9;
var G__93916 = cr93878_place_10;
var G__93917 = cr93878_place_11;
var fexpr__93914 = cr93878_place_8;
return (fexpr__93914.cljs$core$IFn$_invoke$arity$3 ? fexpr__93914.cljs$core$IFn$_invoke$arity$3(G__93915,G__93916,G__93917) : fexpr__93914.call(null,G__93915,G__93916,G__93917));
})();
var cr93878_place_13 = lambdaisland.glogi.log;
var cr93878_place_14 = "frontend.handler.db-based.rtc-background-tasks";
var cr93878_place_15 = new cljs.core.Keyword(null,"info","info",-317069002);
var cr93878_place_16 = cljs.core.identity;
var cr93878_place_17 = new cljs.core.Keyword(null,"try-to-start-rtc","try-to-start-rtc",-96997866);
var cr93878_place_18 = cr93878_place_7;
var cr93878_place_19 = cr93878_place_12;
var cr93878_place_20 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr93878_place_18,cr93878_place_19], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr93878_place_21 = new cljs.core.Keyword(null,"line","line",212345235);
var cr93878_place_22 = 70;
var cr93878_place_23 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr93878_place_17,cr93878_place_20,cr93878_place_21,cr93878_place_22]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr93878_place_24 = (function (){var G__93919 = cr93878_place_23;
var fexpr__93918 = cr93878_place_16;
return (fexpr__93918.cljs$core$IFn$_invoke$arity$1 ? fexpr__93918.cljs$core$IFn$_invoke$arity$1(G__93919) : fexpr__93918.call(null,G__93919));
})();
var cr93878_place_25 = null;
var cr93878_place_26 = (function (){var G__93921 = cr93878_place_14;
var G__93922 = cr93878_place_15;
var G__93923 = cr93878_place_24;
var G__93924 = cr93878_place_25;
var fexpr__93920 = cr93878_place_13;
return (fexpr__93920.cljs$core$IFn$_invoke$arity$4 ? fexpr__93920.cljs$core$IFn$_invoke$arity$4(G__93921,G__93922,G__93923,G__93924) : fexpr__93920.call(null,G__93921,G__93922,G__93923,G__93924));
})();
var cr93878_place_27 = frontend.common.missionary._LT__BANG_;
var cr93878_place_28 = frontend.handler.db_based.rtc._LT_rtc_start_BANG_;
var cr93878_place_29 = cr93878_place_12;
var cr93878_place_30 = cr93878_place_29;
var cr93878_place_31 = null;
if(cljs.core.truth_(cr93878_place_30)){
(cr93878_state[(0)] = cr93878_block_3);

(cr93878_state[(1)] = cr93878_place_27);

(cr93878_state[(2)] = cr93878_place_31);

(cr93878_state[(3)] = cr93878_place_28);

(cr93878_state[(4)] = cr93878_place_29);

return cr93878_state;
} else {
(cr93878_state[(0)] = cr93878_block_2);

(cr93878_state[(1)] = cr93878_place_27);

(cr93878_state[(2)] = cr93878_place_31);

(cr93878_state[(3)] = cr93878_place_28);

return cr93878_state;
}
}catch (e93909){var cr93878_exception = e93909;
(cr93878_state[(0)] = null);

throw cr93878_exception;
}});
var cr93878_block_2 = (function frontend$handler$db_based$rtc_background_tasks$cr93878_block_2(cr93878_state){
try{var cr93878_place_32 = frontend.state.get_current_repo;
var cr93878_place_33 = (function (){var fexpr__93926 = cr93878_place_32;
return (fexpr__93926.cljs$core$IFn$_invoke$arity$0 ? fexpr__93926.cljs$core$IFn$_invoke$arity$0() : fexpr__93926.call(null));
})();
(cr93878_state[(0)] = cr93878_block_4);

(cr93878_state[(2)] = cr93878_place_33);

return cr93878_state;
}catch (e93925){var cr93878_exception = e93925;
(cr93878_state[(0)] = null);

(cr93878_state[(1)] = null);

(cr93878_state[(2)] = null);

(cr93878_state[(3)] = null);

throw cr93878_exception;
}});
var cr93878_block_3 = (function frontend$handler$db_based$rtc_background_tasks$cr93878_block_3(cr93878_state){
try{var cr93878_place_29 = (cr93878_state[(4)]);
var cr93878_place_34 = cr93878_place_29;
(cr93878_state[(0)] = cr93878_block_4);

(cr93878_state[(4)] = null);

(cr93878_state[(2)] = cr93878_place_34);

return cr93878_state;
}catch (e93927){var cr93878_exception = e93927;
(cr93878_state[(0)] = null);

(cr93878_state[(1)] = null);

(cr93878_state[(2)] = null);

(cr93878_state[(3)] = null);

(cr93878_state[(4)] = null);

throw cr93878_exception;
}});
var cr93878_block_4 = (function frontend$handler$db_based$rtc_background_tasks$cr93878_block_4(cr93878_state){
try{var cr93878_place_27 = (cr93878_state[(1)]);
var cr93878_place_31 = (cr93878_state[(2)]);
var cr93878_place_28 = (cr93878_state[(3)]);
var cr93878_place_35 = (function (){var G__93930 = cr93878_place_31;
var fexpr__93929 = cr93878_place_28;
return (fexpr__93929.cljs$core$IFn$_invoke$arity$1 ? fexpr__93929.cljs$core$IFn$_invoke$arity$1(G__93930) : fexpr__93929.call(null,G__93930));
})();
var cr93878_place_36 = (function (){var G__93932 = cr93878_place_35;
var fexpr__93931 = cr93878_place_27;
return (fexpr__93931.cljs$core$IFn$_invoke$arity$1 ? fexpr__93931.cljs$core$IFn$_invoke$arity$1(G__93932) : fexpr__93931.call(null,G__93932));
})();
(cr93878_state[(0)] = cr93878_block_5);

(cr93878_state[(1)] = null);

(cr93878_state[(2)] = null);

(cr93878_state[(3)] = null);

return missionary.core.park(cr93878_place_36);
}catch (e93928){var cr93878_exception = e93928;
(cr93878_state[(0)] = null);

(cr93878_state[(1)] = null);

(cr93878_state[(2)] = null);

(cr93878_state[(3)] = null);

throw cr93878_exception;
}});
var cr93878_block_5 = (function frontend$handler$db_based$rtc_background_tasks$cr93878_block_5(cr93878_state){
try{var cr93878_place_37 = missionary.core.unpark();
(cr93878_state[(0)] = null);

return cr93878_place_37;
}catch (e93933){var cr93878_exception = e93933;
(cr93878_state[(0)] = null);

throw cr93878_exception;
}});
return cloroutine.impl.coroutine((function (){var G__93934 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__93934[(0)] = cr93878_block_0);

return G__93934;
})());
})(),missionary.core.ap_run)));

//# sourceMappingURL=frontend.handler.db_based.rtc_background_tasks.js.map
