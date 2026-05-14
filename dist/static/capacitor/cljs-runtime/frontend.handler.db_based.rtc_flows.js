goog.provide('frontend.handler.db_based.rtc_flows');
frontend.handler.db_based.rtc_flows.rtc_log_flow = missionary.core.watch(new cljs.core.Keyword("rtc","log","rtc/log",-1596481285).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
frontend.handler.db_based.rtc_flows.rtc_download_log_flow = missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (p1__68054_SHARP_){
return cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("rtc.log","download","rtc.log/download",-2144210573),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__68054_SHARP_));
})),frontend.handler.db_based.rtc_flows.rtc_log_flow);
frontend.handler.db_based.rtc_flows.rtc_upload_log_flow = missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (p1__68055_SHARP_){
return cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("rtc.log","upload","rtc.log/upload",-1832742059),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__68055_SHARP_));
})),frontend.handler.db_based.rtc_flows.rtc_log_flow);
frontend.handler.db_based.rtc_flows.rtc_misc_log_flow = missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.remove.cljs$core$IFn$_invoke$arity$1((function (p1__68056_SHARP_){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("rtc.log","download","rtc.log/download",-2144210573),null,new cljs.core.Keyword("rtc.log","upload","rtc.log/upload",-1832742059),null], null), null),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__68056_SHARP_));
})),frontend.handler.db_based.rtc_flows.rtc_log_flow);
frontend.handler.db_based.rtc_flows.rtc_state_flow = missionary.core.watch(new cljs.core.Keyword("rtc","state","rtc/state",-1988572624).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
frontend.handler.db_based.rtc_flows.rtc_running_flow = missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"rtc-lock","rtc-lock",1338966560)),frontend.handler.db_based.rtc_flows.rtc_state_flow);
frontend.handler.db_based.rtc_flows.rtc_online_users_flow = frontend.common.missionary.throttle((500),missionary.core.eduction.cljs$core$IFn$_invoke$arity$variadic(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (m){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"open","open",-1763596448),new cljs.core.Keyword(null,"ws-state","ws-state",2128833478).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"rtc-state","rtc-state",1931374921).cljs$core$IFn$_invoke$arity$1(m)));
if(and__5000__auto__){
return new cljs.core.Keyword(null,"rtc-lock","rtc-lock",1338966560).cljs$core$IFn$_invoke$arity$1(m);
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.Keyword(null,"online-users","online-users",-747563810).cljs$core$IFn$_invoke$arity$1(m);
} else {
return null;
}
})),cljs.core.dedupe.cljs$core$IFn$_invoke$arity$0(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.handler.db_based.rtc_flows.rtc_state_flow], 0)));
frontend.handler.db_based.rtc_flows.network_online_change_flow = missionary.core.stream(missionary.core.relieve.cljs$core$IFn$_invoke$arity$1(missionary.core.observe((function frontend$handler$db_based$rtc_flows$ctor(emit_BANG_){
var origin_callback = window.ononline;
(window.ononline = emit_BANG_);

(emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(null) : emit_BANG_.call(null,null));

return (function frontend$handler$db_based$rtc_flows$ctor_$_dtor(){
return (window.ononline = origin_callback);
});
}))));
/**
 * emit an event when it's time to restart rtc loop.
 * conditions:
 * - user logged in
 * - no rtc loop running now
 * - last rtc stop-reason is websocket message timeout
 * - current js/navigator.onLine=true
 * - throttle 5000ms
 */
frontend.handler.db_based.rtc_flows.rtc_try_restart_flow = frontend.common.missionary.throttle((5000),missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (m){
var map__68080 = m;
var map__68080__$1 = cljs.core.__destructure_map(map__68080);
var rtc_lock = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68080__$1,new cljs.core.Keyword(null,"rtc-lock","rtc-lock",1338966560));
var last_stop_exception_ex_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68080__$1,new cljs.core.Keyword(null,"last-stop-exception-ex-data","last-stop-exception-ex-data",800047332));
var graph_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68080__$1,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522));
var login_user = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68080__$1,new cljs.core.Keyword(null,"login-user","login-user",1935565562));
if((((!((new cljs.core.Keyword(null,"email","email",1415816706).cljs$core$IFn$_invoke$arity$1(login_user) == null)))) && ((((!((graph_uuid == null)))) && (((cljs.core.not(rtc_lock)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("rtc.exception","ws-timeout","rtc.exception/ws-timeout",456034739),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(last_stop_exception_ex_data))) && (navigator.onLine === true))))))))){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid,new cljs.core.Keyword(null,"t","t",-1397832519),logseq.common.util.time_ms()], null);
} else {
return null;
}
})),missionary.core.latest.cljs$core$IFn$_invoke$arity$variadic((function (rtc_state,_,login_user){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(rtc_state,new cljs.core.Keyword(null,"login-user","login-user",1935565562),login_user);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.handler.db_based.rtc_flows.rtc_state_flow,frontend.common.missionary.continue_flow.cljs$core$IFn$_invoke$arity$1(frontend.handler.db_based.rtc_flows.network_online_change_flow),frontend.flows.current_login_user_flow], 0))));
frontend.handler.db_based.rtc_flows.logout_or_graph_switch_flow = frontend.common.missionary.mix.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (p1__68089_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"logout","logout",1418564329),p1__68089_SHARP_);
})),frontend.flows.current_login_user_flow),missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (repo){
if(cljs.core.truth_(repo)){
return new cljs.core.Keyword(null,"graph-switch","graph-switch",1110417387);
} else {
return null;
}
})),frontend.flows.current_repo_flow)], 0));
frontend.handler.db_based.rtc_flows._STAR_rtc_start_trigger = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
frontend.handler.db_based.rtc_flows.trigger_rtc_start = (function frontend$handler$db_based$rtc_flows$trigger_rtc_start(repo){
if((!((repo == null)))){
} else {
throw (new Error("Assert failed: (some? repo)"));
}

return cljs.core.reset_BANG_(frontend.handler.db_based.rtc_flows._STAR_rtc_start_trigger,repo);
});
frontend.handler.db_based.rtc_flows.document_visible_AMPERSAND_rtc_not_running_flow = cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr68095_block_4 = (function frontend$handler$db_based$rtc_flows$cr68095_block_4(cr68095_state){
try{var cr68095_place_11 = missionary.core.unpark();
(cr68095_state[(0)] = cr68095_block_11);

(cr68095_state[(1)] = cr68095_place_11);

return cr68095_state;
}catch (e68234){var cr68095_exception = e68234;
(cr68095_state[(0)] = cr68095_block_12);

(cr68095_state[(1)] = null);

(cr68095_state[(2)] = cr68095_exception);

return cr68095_state;
}});
var cr68095_block_2 = (function frontend$handler$db_based$rtc_flows$cr68095_block_2(cr68095_state){
try{var cr68095_place_1 = (cr68095_state[(1)]);
var cr68095_place_4 = cljs.core._EQ_;
var cr68095_place_5 = "visible";
var cr68095_place_6 = cr68095_place_1;
var cr68095_place_7 = (function (){var G__68239 = cr68095_place_5;
var G__68240 = cr68095_place_6;
var fexpr__68238 = cr68095_place_4;
return (fexpr__68238.cljs$core$IFn$_invoke$arity$2 ? fexpr__68238.cljs$core$IFn$_invoke$arity$2(G__68239,G__68240) : fexpr__68238.call(null,G__68239,G__68240));
})();
var cr68095_place_8 = null;
if(cljs.core.truth_(cr68095_place_7)){
(cr68095_state[(0)] = cr68095_block_5);

(cr68095_state[(1)] = null);

(cr68095_state[(1)] = cr68095_place_8);

return cr68095_state;
} else {
(cr68095_state[(0)] = cr68095_block_3);

(cr68095_state[(1)] = null);

(cr68095_state[(1)] = cr68095_place_8);

return cr68095_state;
}
}catch (e68237){var cr68095_exception = e68237;
(cr68095_state[(0)] = cr68095_block_12);

(cr68095_state[(1)] = null);

(cr68095_state[(2)] = cr68095_exception);

return cr68095_state;
}});
var cr68095_block_11 = (function frontend$handler$db_based$rtc_flows$cr68095_block_11(cr68095_state){
try{var cr68095_place_8 = (cr68095_state[(1)]);
(cr68095_state[(0)] = cr68095_block_20);

(cr68095_state[(1)] = null);

(cr68095_state[(2)] = cr68095_place_8);

return cr68095_state;
}catch (e68241){var cr68095_exception = e68241;
(cr68095_state[(0)] = cr68095_block_12);

(cr68095_state[(1)] = null);

(cr68095_state[(2)] = cr68095_exception);

return cr68095_state;
}});
var cr68095_block_15 = (function frontend$handler$db_based$rtc_flows$cr68095_block_15(cr68095_state){
try{var cr68095_place_2 = (cr68095_state[(2)]);
var cr68095_place_33 = cr68095_place_2;
var cr68095_place_34 = (function(){throw cr68095_place_33})();
(cr68095_state[(0)] = null);

(cr68095_state[(2)] = null);

(cr68095_state[(3)] = null);

return null;
}catch (e68242){var cr68095_exception = e68242;
(cr68095_state[(0)] = cr68095_block_20);

(cr68095_state[(3)] = true);

(cr68095_state[(2)] = cr68095_exception);

return cr68095_state;
}});
var cr68095_block_5 = (function frontend$handler$db_based$rtc_flows$cr68095_block_5(cr68095_state){
try{var cr68095_place_12 = new cljs.core.Keyword(null,"rtc-lock","rtc-lock",1338966560);
var cr68095_place_13 = frontend.common.missionary.snapshot_of_flow;
var cr68095_place_14 = frontend.handler.db_based.rtc_flows.rtc_state_flow;
var cr68095_place_15 = (function (){var G__68245 = cr68095_place_14;
var fexpr__68244 = cr68095_place_13;
return (fexpr__68244.cljs$core$IFn$_invoke$arity$1 ? fexpr__68244.cljs$core$IFn$_invoke$arity$1(G__68245) : fexpr__68244.call(null,G__68245));
})();
(cr68095_state[(0)] = cr68095_block_6);

(cr68095_state[(4)] = cr68095_place_12);

return missionary.core.park(cr68095_place_15);
}catch (e68243){var cr68095_exception = e68243;
(cr68095_state[(0)] = cr68095_block_12);

(cr68095_state[(1)] = null);

(cr68095_state[(2)] = cr68095_exception);

return cr68095_state;
}});
var cr68095_block_7 = (function frontend$handler$db_based$rtc_flows$cr68095_block_7(cr68095_state){
try{var cr68095_place_22 = (1);
var cr68095_place_23 = missionary.core.none;
(cr68095_state[(0)] = cr68095_block_8);

return missionary.core.fork(cr68095_place_22,cr68095_place_23);
}catch (e68246){var cr68095_exception = e68246;
(cr68095_state[(0)] = cr68095_block_12);

(cr68095_state[(4)] = null);

(cr68095_state[(1)] = null);

(cr68095_state[(2)] = cr68095_exception);

return cr68095_state;
}});
var cr68095_block_19 = (function frontend$handler$db_based$rtc_flows$cr68095_block_19(cr68095_state){
try{var cr68095_place_29 = (cr68095_state[(1)]);
(cr68095_state[(0)] = cr68095_block_20);

(cr68095_state[(1)] = null);

(cr68095_state[(2)] = cr68095_place_29);

return cr68095_state;
}catch (e68247){var cr68095_exception = e68247;
(cr68095_state[(0)] = cr68095_block_20);

(cr68095_state[(1)] = null);

(cr68095_state[(3)] = true);

(cr68095_state[(2)] = cr68095_exception);

return cr68095_state;
}});
var cr68095_block_12 = (function frontend$handler$db_based$rtc_flows$cr68095_block_12(cr68095_state){
try{var cr68095_place_2 = (cr68095_state[(2)]);
var cr68095_place_26 = cr68095_place_2;
var cr68095_place_27 = missionary.Cancelled;
var cr68095_place_28 = (cr68095_place_26 instanceof cr68095_place_27);
var cr68095_place_29 = null;
if(cr68095_place_28){
(cr68095_state[(0)] = cr68095_block_17);

(cr68095_state[(1)] = cr68095_place_29);

return cr68095_state;
} else {
(cr68095_state[(0)] = cr68095_block_13);

(cr68095_state[(1)] = cr68095_place_29);

return cr68095_state;
}
}catch (e68248){var cr68095_exception = e68248;
(cr68095_state[(0)] = cr68095_block_20);

(cr68095_state[(3)] = true);

(cr68095_state[(2)] = cr68095_exception);

return cr68095_state;
}});
var cr68095_block_17 = (function frontend$handler$db_based$rtc_flows$cr68095_block_17(cr68095_state){
try{var cr68095_place_2 = (cr68095_state[(2)]);
var cr68095_place_35 = cr68095_place_2;
var cr68095_place_36 = (1);
var cr68095_place_37 = missionary.core.none;
(cr68095_state[(0)] = cr68095_block_18);

return missionary.core.fork(cr68095_place_36,cr68095_place_37);
}catch (e68249){var cr68095_exception = e68249;
(cr68095_state[(0)] = cr68095_block_20);

(cr68095_state[(1)] = null);

(cr68095_state[(3)] = true);

(cr68095_state[(2)] = cr68095_exception);

return cr68095_state;
}});
var cr68095_block_1 = (function frontend$handler$db_based$rtc_flows$cr68095_block_1(cr68095_state){
try{var cr68095_place_1 = missionary.core.unpark();
var cr68095_place_2 = null;
var cr68095_place_3 = false;
(cr68095_state[(0)] = cr68095_block_2);

(cr68095_state[(1)] = cr68095_place_1);

(cr68095_state[(2)] = cr68095_place_2);

(cr68095_state[(3)] = cr68095_place_3);

return cr68095_state;
}catch (e68250){var cr68095_exception = e68250;
(cr68095_state[(0)] = null);

throw cr68095_exception;
}});
var cr68095_block_6 = (function frontend$handler$db_based$rtc_flows$cr68095_block_6(cr68095_state){
try{var cr68095_place_12 = (cr68095_state[(4)]);
var cr68095_place_16 = missionary.core.unpark();
var cr68095_place_17 = cr68095_place_12.cljs$core$IFn$_invoke$arity$1(cr68095_place_16);
var cr68095_place_18 = cljs.core.not;
var cr68095_place_19 = cr68095_place_17;
var cr68095_place_20 = (function (){var G__68253 = cr68095_place_19;
var fexpr__68252 = cr68095_place_18;
return (fexpr__68252.cljs$core$IFn$_invoke$arity$1 ? fexpr__68252.cljs$core$IFn$_invoke$arity$1(G__68253) : fexpr__68252.call(null,G__68253));
})();
var cr68095_place_21 = null;
if(cljs.core.truth_(cr68095_place_20)){
(cr68095_state[(0)] = cr68095_block_9);

(cr68095_state[(4)] = null);

(cr68095_state[(4)] = cr68095_place_21);

return cr68095_state;
} else {
(cr68095_state[(0)] = cr68095_block_7);

(cr68095_state[(4)] = null);

(cr68095_state[(4)] = cr68095_place_21);

return cr68095_state;
}
}catch (e68251){var cr68095_exception = e68251;
(cr68095_state[(0)] = cr68095_block_12);

(cr68095_state[(1)] = null);

(cr68095_state[(4)] = null);

(cr68095_state[(2)] = cr68095_exception);

return cr68095_state;
}});
var cr68095_block_20 = (function frontend$handler$db_based$rtc_flows$cr68095_block_20(cr68095_state){
try{var cr68095_place_2 = (cr68095_state[(2)]);
var cr68095_place_3 = (cr68095_state[(3)]);
var cr68095_place_39 = (cljs.core.truth_(cr68095_place_3)?(function(){throw cr68095_place_2})():cr68095_place_2);
(cr68095_state[(0)] = null);

(cr68095_state[(2)] = null);

(cr68095_state[(3)] = null);

return cr68095_place_39;
}catch (e68254){var cr68095_exception = e68254;
(cr68095_state[(0)] = null);

(cr68095_state[(2)] = null);

(cr68095_state[(3)] = null);

throw cr68095_exception;
}});
var cr68095_block_10 = (function frontend$handler$db_based$rtc_flows$cr68095_block_10(cr68095_state){
try{var cr68095_place_21 = (cr68095_state[(4)]);
(cr68095_state[(0)] = cr68095_block_11);

(cr68095_state[(4)] = null);

(cr68095_state[(1)] = cr68095_place_21);

return cr68095_state;
}catch (e68255){var cr68095_exception = e68255;
(cr68095_state[(0)] = cr68095_block_12);

(cr68095_state[(4)] = null);

(cr68095_state[(1)] = null);

(cr68095_state[(2)] = cr68095_exception);

return cr68095_state;
}});
var cr68095_block_18 = (function frontend$handler$db_based$rtc_flows$cr68095_block_18(cr68095_state){
try{var cr68095_place_38 = missionary.core.unpark();
(cr68095_state[(0)] = cr68095_block_19);

(cr68095_state[(1)] = cr68095_place_38);

return cr68095_state;
}catch (e68256){var cr68095_exception = e68256;
(cr68095_state[(0)] = cr68095_block_20);

(cr68095_state[(1)] = null);

(cr68095_state[(3)] = true);

(cr68095_state[(2)] = cr68095_exception);

return cr68095_state;
}});
var cr68095_block_3 = (function frontend$handler$db_based$rtc_flows$cr68095_block_3(cr68095_state){
try{var cr68095_place_9 = (1);
var cr68095_place_10 = missionary.core.none;
(cr68095_state[(0)] = cr68095_block_4);

return missionary.core.fork(cr68095_place_9,cr68095_place_10);
}catch (e68257){var cr68095_exception = e68257;
(cr68095_state[(0)] = cr68095_block_12);

(cr68095_state[(1)] = null);

(cr68095_state[(2)] = cr68095_exception);

return cr68095_state;
}});
var cr68095_block_13 = (function frontend$handler$db_based$rtc_flows$cr68095_block_13(cr68095_state){
try{var cr68095_place_30 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr68095_place_31 = null;
if(cljs.core.truth_(cr68095_place_30)){
(cr68095_state[(0)] = cr68095_block_15);

(cr68095_state[(1)] = null);

return cr68095_state;
} else {
(cr68095_state[(0)] = cr68095_block_14);

(cr68095_state[(4)] = cr68095_place_31);

return cr68095_state;
}
}catch (e68258){var cr68095_exception = e68258;
(cr68095_state[(0)] = cr68095_block_20);

(cr68095_state[(1)] = null);

(cr68095_state[(3)] = true);

(cr68095_state[(2)] = cr68095_exception);

return cr68095_state;
}});
var cr68095_block_0 = (function frontend$handler$db_based$rtc_flows$cr68095_block_0(cr68095_state){
try{var cr68095_place_0 = frontend.flows.document_visibility_state_flow;
(cr68095_state[(0)] = cr68095_block_1);

return missionary.core.switch$(cr68095_place_0);
}catch (e68259){var cr68095_exception = e68259;
(cr68095_state[(0)] = null);

throw cr68095_exception;
}});
var cr68095_block_9 = (function frontend$handler$db_based$rtc_flows$cr68095_block_9(cr68095_state){
try{var cr68095_place_25 = new cljs.core.Keyword(null,"document-visible&rtc-not-running","document-visible&rtc-not-running",-1278071938);
(cr68095_state[(0)] = cr68095_block_10);

(cr68095_state[(4)] = cr68095_place_25);

return cr68095_state;
}catch (e68260){var cr68095_exception = e68260;
(cr68095_state[(0)] = cr68095_block_12);

(cr68095_state[(4)] = null);

(cr68095_state[(1)] = null);

(cr68095_state[(2)] = cr68095_exception);

return cr68095_state;
}});
var cr68095_block_14 = (function frontend$handler$db_based$rtc_flows$cr68095_block_14(cr68095_state){
try{var cr68095_place_32 = null;
(cr68095_state[(0)] = cr68095_block_16);

(cr68095_state[(4)] = cr68095_place_32);

return cr68095_state;
}catch (e68261){var cr68095_exception = e68261;
(cr68095_state[(0)] = cr68095_block_20);

(cr68095_state[(1)] = null);

(cr68095_state[(4)] = null);

(cr68095_state[(3)] = true);

(cr68095_state[(2)] = cr68095_exception);

return cr68095_state;
}});
var cr68095_block_8 = (function frontend$handler$db_based$rtc_flows$cr68095_block_8(cr68095_state){
try{var cr68095_place_24 = missionary.core.unpark();
(cr68095_state[(0)] = cr68095_block_10);

(cr68095_state[(4)] = cr68095_place_24);

return cr68095_state;
}catch (e68262){var cr68095_exception = e68262;
(cr68095_state[(0)] = cr68095_block_12);

(cr68095_state[(4)] = null);

(cr68095_state[(1)] = null);

(cr68095_state[(2)] = cr68095_exception);

return cr68095_state;
}});
var cr68095_block_16 = (function frontend$handler$db_based$rtc_flows$cr68095_block_16(cr68095_state){
try{var cr68095_place_31 = (cr68095_state[(4)]);
(cr68095_state[(0)] = cr68095_block_19);

(cr68095_state[(4)] = null);

(cr68095_state[(1)] = cr68095_place_31);

return cr68095_state;
}catch (e68263){var cr68095_exception = e68263;
(cr68095_state[(0)] = cr68095_block_20);

(cr68095_state[(1)] = null);

(cr68095_state[(4)] = null);

(cr68095_state[(3)] = true);

(cr68095_state[(2)] = cr68095_exception);

return cr68095_state;
}});
return cloroutine.impl.coroutine((function (){var G__68264 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__68264[(0)] = cr68095_block_0);

return G__68264;
})());
})(),missionary.core.ap_run);
frontend.handler.db_based.rtc_flows.network_online_AMPERSAND_rtc_not_running_flow = cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr68265_block_4 = (function frontend$handler$db_based$rtc_flows$cr68265_block_4(cr68265_state){
try{var cr68265_place_8 = missionary.core.unpark();
(cr68265_state[(0)] = cr68265_block_11);

(cr68265_state[(2)] = cr68265_place_8);

return cr68265_state;
}catch (e68347){var cr68265_exception = e68347;
(cr68265_state[(0)] = cr68265_block_12);

(cr68265_state[(2)] = null);

(cr68265_state[(3)] = cr68265_exception);

return cr68265_state;
}});
var cr68265_block_9 = (function frontend$handler$db_based$rtc_flows$cr68265_block_9(cr68265_state){
try{var cr68265_place_20 = new cljs.core.Keyword(null,"network-online&rtc-not-running","network-online&rtc-not-running",-1315392544);
(cr68265_state[(0)] = cr68265_block_10);

(cr68265_state[(4)] = cr68265_place_20);

return cr68265_state;
}catch (e68350){var cr68265_exception = e68350;
(cr68265_state[(0)] = cr68265_block_12);

(cr68265_state[(4)] = null);

(cr68265_state[(2)] = null);

(cr68265_state[(3)] = cr68265_exception);

return cr68265_state;
}});
var cr68265_block_16 = (function frontend$handler$db_based$rtc_flows$cr68265_block_16(cr68265_state){
try{var cr68265_place_26 = (cr68265_state[(4)]);
(cr68265_state[(0)] = cr68265_block_19);

(cr68265_state[(4)] = null);

(cr68265_state[(2)] = cr68265_place_26);

return cr68265_state;
}catch (e68353){var cr68265_exception = e68353;
(cr68265_state[(0)] = cr68265_block_20);

(cr68265_state[(4)] = null);

(cr68265_state[(2)] = null);

(cr68265_state[(1)] = true);

(cr68265_state[(3)] = cr68265_exception);

return cr68265_state;
}});
var cr68265_block_7 = (function frontend$handler$db_based$rtc_flows$cr68265_block_7(cr68265_state){
try{var cr68265_place_17 = (1);
var cr68265_place_18 = missionary.core.none;
(cr68265_state[(0)] = cr68265_block_8);

return missionary.core.fork(cr68265_place_17,cr68265_place_18);
}catch (e68355){var cr68265_exception = e68355;
(cr68265_state[(0)] = cr68265_block_12);

(cr68265_state[(4)] = null);

(cr68265_state[(2)] = null);

(cr68265_state[(3)] = cr68265_exception);

return cr68265_state;
}});
var cr68265_block_14 = (function frontend$handler$db_based$rtc_flows$cr68265_block_14(cr68265_state){
try{var cr68265_place_27 = null;
(cr68265_state[(0)] = cr68265_block_16);

(cr68265_state[(4)] = cr68265_place_27);

return cr68265_state;
}catch (e68358){var cr68265_exception = e68358;
(cr68265_state[(0)] = cr68265_block_20);

(cr68265_state[(4)] = null);

(cr68265_state[(2)] = null);

(cr68265_state[(1)] = true);

(cr68265_state[(3)] = cr68265_exception);

return cr68265_state;
}});
var cr68265_block_2 = (function frontend$handler$db_based$rtc_flows$cr68265_block_2(cr68265_state){
try{var cr68265_place_1 = (cr68265_state[(2)]);
var cr68265_place_4 = cr68265_place_1;
var cr68265_place_5 = null;
if(cljs.core.truth_(cr68265_place_4)){
(cr68265_state[(0)] = cr68265_block_5);

(cr68265_state[(2)] = null);

(cr68265_state[(2)] = cr68265_place_5);

return cr68265_state;
} else {
(cr68265_state[(0)] = cr68265_block_3);

(cr68265_state[(2)] = null);

(cr68265_state[(2)] = cr68265_place_5);

return cr68265_state;
}
}catch (e68359){var cr68265_exception = e68359;
(cr68265_state[(0)] = cr68265_block_12);

(cr68265_state[(2)] = null);

(cr68265_state[(3)] = cr68265_exception);

return cr68265_state;
}});
var cr68265_block_13 = (function frontend$handler$db_based$rtc_flows$cr68265_block_13(cr68265_state){
try{var cr68265_place_25 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr68265_place_26 = null;
if(cljs.core.truth_(cr68265_place_25)){
(cr68265_state[(0)] = cr68265_block_15);

(cr68265_state[(2)] = null);

return cr68265_state;
} else {
(cr68265_state[(0)] = cr68265_block_14);

(cr68265_state[(4)] = cr68265_place_26);

return cr68265_state;
}
}catch (e68360){var cr68265_exception = e68360;
(cr68265_state[(0)] = cr68265_block_20);

(cr68265_state[(2)] = null);

(cr68265_state[(1)] = true);

(cr68265_state[(3)] = cr68265_exception);

return cr68265_state;
}});
var cr68265_block_1 = (function frontend$handler$db_based$rtc_flows$cr68265_block_1(cr68265_state){
try{var cr68265_place_1 = missionary.core.unpark();
var cr68265_place_2 = null;
var cr68265_place_3 = false;
(cr68265_state[(0)] = cr68265_block_2);

(cr68265_state[(2)] = cr68265_place_1);

(cr68265_state[(3)] = cr68265_place_2);

(cr68265_state[(1)] = cr68265_place_3);

return cr68265_state;
}catch (e68363){var cr68265_exception = e68363;
(cr68265_state[(0)] = null);

throw cr68265_exception;
}});
var cr68265_block_6 = (function frontend$handler$db_based$rtc_flows$cr68265_block_6(cr68265_state){
try{var cr68265_place_12 = missionary.core.unpark();
var cr68265_place_13 = cljs.core.not;
var cr68265_place_14 = cr68265_place_12;
var cr68265_place_15 = (function (){var G__68395 = cr68265_place_14;
var fexpr__68394 = cr68265_place_13;
return (fexpr__68394.cljs$core$IFn$_invoke$arity$1 ? fexpr__68394.cljs$core$IFn$_invoke$arity$1(G__68395) : fexpr__68394.call(null,G__68395));
})();
var cr68265_place_16 = null;
if(cljs.core.truth_(cr68265_place_15)){
(cr68265_state[(0)] = cr68265_block_9);

(cr68265_state[(4)] = cr68265_place_16);

return cr68265_state;
} else {
(cr68265_state[(0)] = cr68265_block_7);

(cr68265_state[(4)] = cr68265_place_16);

return cr68265_state;
}
}catch (e68378){var cr68265_exception = e68378;
(cr68265_state[(0)] = cr68265_block_12);

(cr68265_state[(2)] = null);

(cr68265_state[(3)] = cr68265_exception);

return cr68265_state;
}});
var cr68265_block_11 = (function frontend$handler$db_based$rtc_flows$cr68265_block_11(cr68265_state){
try{var cr68265_place_5 = (cr68265_state[(2)]);
(cr68265_state[(0)] = cr68265_block_20);

(cr68265_state[(2)] = null);

(cr68265_state[(3)] = cr68265_place_5);

return cr68265_state;
}catch (e68419){var cr68265_exception = e68419;
(cr68265_state[(0)] = cr68265_block_12);

(cr68265_state[(2)] = null);

(cr68265_state[(3)] = cr68265_exception);

return cr68265_state;
}});
var cr68265_block_20 = (function frontend$handler$db_based$rtc_flows$cr68265_block_20(cr68265_state){
try{var cr68265_place_3 = (cr68265_state[(1)]);
var cr68265_place_2 = (cr68265_state[(3)]);
var cr68265_place_34 = (cljs.core.truth_(cr68265_place_3)?(function(){throw cr68265_place_2})():cr68265_place_2);
(cr68265_state[(0)] = null);

(cr68265_state[(1)] = null);

(cr68265_state[(3)] = null);

return cr68265_place_34;
}catch (e68452){var cr68265_exception = e68452;
(cr68265_state[(0)] = null);

(cr68265_state[(1)] = null);

(cr68265_state[(3)] = null);

throw cr68265_exception;
}});
var cr68265_block_19 = (function frontend$handler$db_based$rtc_flows$cr68265_block_19(cr68265_state){
try{var cr68265_place_24 = (cr68265_state[(2)]);
(cr68265_state[(0)] = cr68265_block_20);

(cr68265_state[(2)] = null);

(cr68265_state[(3)] = cr68265_place_24);

return cr68265_state;
}catch (e68455){var cr68265_exception = e68455;
(cr68265_state[(0)] = cr68265_block_20);

(cr68265_state[(2)] = null);

(cr68265_state[(1)] = true);

(cr68265_state[(3)] = cr68265_exception);

return cr68265_state;
}});
var cr68265_block_5 = (function frontend$handler$db_based$rtc_flows$cr68265_block_5(cr68265_state){
try{var cr68265_place_9 = frontend.common.missionary.snapshot_of_flow;
var cr68265_place_10 = frontend.handler.db_based.rtc_flows.rtc_running_flow;
var cr68265_place_11 = (function (){var G__68460 = cr68265_place_10;
var fexpr__68459 = cr68265_place_9;
return (fexpr__68459.cljs$core$IFn$_invoke$arity$1 ? fexpr__68459.cljs$core$IFn$_invoke$arity$1(G__68460) : fexpr__68459.call(null,G__68460));
})();
(cr68265_state[(0)] = cr68265_block_6);

return missionary.core.park(cr68265_place_11);
}catch (e68456){var cr68265_exception = e68456;
(cr68265_state[(0)] = cr68265_block_12);

(cr68265_state[(2)] = null);

(cr68265_state[(3)] = cr68265_exception);

return cr68265_state;
}});
var cr68265_block_10 = (function frontend$handler$db_based$rtc_flows$cr68265_block_10(cr68265_state){
try{var cr68265_place_16 = (cr68265_state[(4)]);
(cr68265_state[(0)] = cr68265_block_11);

(cr68265_state[(4)] = null);

(cr68265_state[(2)] = cr68265_place_16);

return cr68265_state;
}catch (e68463){var cr68265_exception = e68463;
(cr68265_state[(0)] = cr68265_block_12);

(cr68265_state[(4)] = null);

(cr68265_state[(2)] = null);

(cr68265_state[(3)] = cr68265_exception);

return cr68265_state;
}});
var cr68265_block_3 = (function frontend$handler$db_based$rtc_flows$cr68265_block_3(cr68265_state){
try{var cr68265_place_6 = (1);
var cr68265_place_7 = missionary.core.none;
(cr68265_state[(0)] = cr68265_block_4);

return missionary.core.fork(cr68265_place_6,cr68265_place_7);
}catch (e68470){var cr68265_exception = e68470;
(cr68265_state[(0)] = cr68265_block_12);

(cr68265_state[(2)] = null);

(cr68265_state[(3)] = cr68265_exception);

return cr68265_state;
}});
var cr68265_block_15 = (function frontend$handler$db_based$rtc_flows$cr68265_block_15(cr68265_state){
try{var cr68265_place_2 = (cr68265_state[(3)]);
var cr68265_place_28 = cr68265_place_2;
var cr68265_place_29 = (function(){throw cr68265_place_28})();
(cr68265_state[(0)] = null);

(cr68265_state[(1)] = null);

(cr68265_state[(3)] = null);

return null;
}catch (e68474){var cr68265_exception = e68474;
(cr68265_state[(0)] = cr68265_block_20);

(cr68265_state[(1)] = true);

(cr68265_state[(3)] = cr68265_exception);

return cr68265_state;
}});
var cr68265_block_18 = (function frontend$handler$db_based$rtc_flows$cr68265_block_18(cr68265_state){
try{var cr68265_place_33 = missionary.core.unpark();
(cr68265_state[(0)] = cr68265_block_19);

(cr68265_state[(2)] = cr68265_place_33);

return cr68265_state;
}catch (e68476){var cr68265_exception = e68476;
(cr68265_state[(0)] = cr68265_block_20);

(cr68265_state[(2)] = null);

(cr68265_state[(1)] = true);

(cr68265_state[(3)] = cr68265_exception);

return cr68265_state;
}});
var cr68265_block_12 = (function frontend$handler$db_based$rtc_flows$cr68265_block_12(cr68265_state){
try{var cr68265_place_2 = (cr68265_state[(3)]);
var cr68265_place_21 = cr68265_place_2;
var cr68265_place_22 = missionary.Cancelled;
var cr68265_place_23 = (cr68265_place_21 instanceof cr68265_place_22);
var cr68265_place_24 = null;
if(cr68265_place_23){
(cr68265_state[(0)] = cr68265_block_17);

(cr68265_state[(2)] = cr68265_place_24);

return cr68265_state;
} else {
(cr68265_state[(0)] = cr68265_block_13);

(cr68265_state[(2)] = cr68265_place_24);

return cr68265_state;
}
}catch (e68479){var cr68265_exception = e68479;
(cr68265_state[(0)] = cr68265_block_20);

(cr68265_state[(1)] = true);

(cr68265_state[(3)] = cr68265_exception);

return cr68265_state;
}});
var cr68265_block_8 = (function frontend$handler$db_based$rtc_flows$cr68265_block_8(cr68265_state){
try{var cr68265_place_19 = missionary.core.unpark();
(cr68265_state[(0)] = cr68265_block_10);

(cr68265_state[(4)] = cr68265_place_19);

return cr68265_state;
}catch (e68480){var cr68265_exception = e68480;
(cr68265_state[(0)] = cr68265_block_12);

(cr68265_state[(4)] = null);

(cr68265_state[(2)] = null);

(cr68265_state[(3)] = cr68265_exception);

return cr68265_state;
}});
var cr68265_block_17 = (function frontend$handler$db_based$rtc_flows$cr68265_block_17(cr68265_state){
try{var cr68265_place_2 = (cr68265_state[(3)]);
var cr68265_place_30 = cr68265_place_2;
var cr68265_place_31 = (1);
var cr68265_place_32 = missionary.core.none;
(cr68265_state[(0)] = cr68265_block_18);

return missionary.core.fork(cr68265_place_31,cr68265_place_32);
}catch (e68482){var cr68265_exception = e68482;
(cr68265_state[(0)] = cr68265_block_20);

(cr68265_state[(2)] = null);

(cr68265_state[(1)] = true);

(cr68265_state[(3)] = cr68265_exception);

return cr68265_state;
}});
var cr68265_block_0 = (function frontend$handler$db_based$rtc_flows$cr68265_block_0(cr68265_state){
try{var cr68265_place_0 = frontend.flows.network_online_event_flow;
(cr68265_state[(0)] = cr68265_block_1);

return missionary.core.switch$(cr68265_place_0);
}catch (e68484){var cr68265_exception = e68484;
(cr68265_state[(0)] = null);

throw cr68265_exception;
}});
return cloroutine.impl.coroutine((function (){var G__68486 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__68486[(0)] = cr68265_block_0);

return G__68486;
})());
})(),missionary.core.ap_run);
frontend.handler.db_based.rtc_flows.mobile_app_active_AMPERSAND_rtc_not_running_flow = cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr68489_block_19 = (function frontend$handler$db_based$rtc_flows$cr68489_block_19(cr68489_state){
try{var cr68489_place_24 = (cr68489_state[(3)]);
(cr68489_state[(0)] = cr68489_block_20);

(cr68489_state[(3)] = null);

(cr68489_state[(2)] = cr68489_place_24);

return cr68489_state;
}catch (e68587){var cr68489_exception = e68587;
(cr68489_state[(0)] = cr68489_block_20);

(cr68489_state[(3)] = null);

(cr68489_state[(1)] = true);

(cr68489_state[(2)] = cr68489_exception);

return cr68489_state;
}});
var cr68489_block_2 = (function frontend$handler$db_based$rtc_flows$cr68489_block_2(cr68489_state){
try{var cr68489_place_1 = (cr68489_state[(3)]);
var cr68489_place_4 = cr68489_place_1;
var cr68489_place_5 = null;
if(cljs.core.truth_(cr68489_place_4)){
(cr68489_state[(0)] = cr68489_block_5);

(cr68489_state[(3)] = null);

(cr68489_state[(3)] = cr68489_place_5);

return cr68489_state;
} else {
(cr68489_state[(0)] = cr68489_block_3);

(cr68489_state[(3)] = null);

(cr68489_state[(3)] = cr68489_place_5);

return cr68489_state;
}
}catch (e68588){var cr68489_exception = e68588;
(cr68489_state[(0)] = cr68489_block_12);

(cr68489_state[(3)] = null);

(cr68489_state[(2)] = cr68489_exception);

return cr68489_state;
}});
var cr68489_block_5 = (function frontend$handler$db_based$rtc_flows$cr68489_block_5(cr68489_state){
try{var cr68489_place_9 = frontend.common.missionary.snapshot_of_flow;
var cr68489_place_10 = frontend.handler.db_based.rtc_flows.rtc_running_flow;
var cr68489_place_11 = (function (){var G__68593 = cr68489_place_10;
var fexpr__68592 = cr68489_place_9;
return (fexpr__68592.cljs$core$IFn$_invoke$arity$1 ? fexpr__68592.cljs$core$IFn$_invoke$arity$1(G__68593) : fexpr__68592.call(null,G__68593));
})();
(cr68489_state[(0)] = cr68489_block_6);

return missionary.core.park(cr68489_place_11);
}catch (e68591){var cr68489_exception = e68591;
(cr68489_state[(0)] = cr68489_block_12);

(cr68489_state[(3)] = null);

(cr68489_state[(2)] = cr68489_exception);

return cr68489_state;
}});
var cr68489_block_14 = (function frontend$handler$db_based$rtc_flows$cr68489_block_14(cr68489_state){
try{var cr68489_place_27 = null;
(cr68489_state[(0)] = cr68489_block_16);

(cr68489_state[(4)] = cr68489_place_27);

return cr68489_state;
}catch (e68596){var cr68489_exception = e68596;
(cr68489_state[(0)] = cr68489_block_20);

(cr68489_state[(3)] = null);

(cr68489_state[(4)] = null);

(cr68489_state[(1)] = true);

(cr68489_state[(2)] = cr68489_exception);

return cr68489_state;
}});
var cr68489_block_17 = (function frontend$handler$db_based$rtc_flows$cr68489_block_17(cr68489_state){
try{var cr68489_place_2 = (cr68489_state[(2)]);
var cr68489_place_30 = cr68489_place_2;
var cr68489_place_31 = (1);
var cr68489_place_32 = missionary.core.none;
(cr68489_state[(0)] = cr68489_block_18);

return missionary.core.fork(cr68489_place_31,cr68489_place_32);
}catch (e68605){var cr68489_exception = e68605;
(cr68489_state[(0)] = cr68489_block_20);

(cr68489_state[(3)] = null);

(cr68489_state[(1)] = true);

(cr68489_state[(2)] = cr68489_exception);

return cr68489_state;
}});
var cr68489_block_15 = (function frontend$handler$db_based$rtc_flows$cr68489_block_15(cr68489_state){
try{var cr68489_place_2 = (cr68489_state[(2)]);
var cr68489_place_28 = cr68489_place_2;
var cr68489_place_29 = (function(){throw cr68489_place_28})();
(cr68489_state[(0)] = null);

(cr68489_state[(1)] = null);

(cr68489_state[(2)] = null);

return null;
}catch (e68622){var cr68489_exception = e68622;
(cr68489_state[(0)] = cr68489_block_20);

(cr68489_state[(1)] = true);

(cr68489_state[(2)] = cr68489_exception);

return cr68489_state;
}});
var cr68489_block_12 = (function frontend$handler$db_based$rtc_flows$cr68489_block_12(cr68489_state){
try{var cr68489_place_2 = (cr68489_state[(2)]);
var cr68489_place_21 = cr68489_place_2;
var cr68489_place_22 = missionary.Cancelled;
var cr68489_place_23 = (cr68489_place_21 instanceof cr68489_place_22);
var cr68489_place_24 = null;
if(cr68489_place_23){
(cr68489_state[(0)] = cr68489_block_17);

(cr68489_state[(3)] = cr68489_place_24);

return cr68489_state;
} else {
(cr68489_state[(0)] = cr68489_block_13);

(cr68489_state[(3)] = cr68489_place_24);

return cr68489_state;
}
}catch (e68632){var cr68489_exception = e68632;
(cr68489_state[(0)] = cr68489_block_20);

(cr68489_state[(1)] = true);

(cr68489_state[(2)] = cr68489_exception);

return cr68489_state;
}});
var cr68489_block_4 = (function frontend$handler$db_based$rtc_flows$cr68489_block_4(cr68489_state){
try{var cr68489_place_8 = missionary.core.unpark();
(cr68489_state[(0)] = cr68489_block_11);

(cr68489_state[(3)] = cr68489_place_8);

return cr68489_state;
}catch (e68639){var cr68489_exception = e68639;
(cr68489_state[(0)] = cr68489_block_12);

(cr68489_state[(3)] = null);

(cr68489_state[(2)] = cr68489_exception);

return cr68489_state;
}});
var cr68489_block_1 = (function frontend$handler$db_based$rtc_flows$cr68489_block_1(cr68489_state){
try{var cr68489_place_1 = missionary.core.unpark();
var cr68489_place_2 = null;
var cr68489_place_3 = false;
(cr68489_state[(0)] = cr68489_block_2);

(cr68489_state[(3)] = cr68489_place_1);

(cr68489_state[(2)] = cr68489_place_2);

(cr68489_state[(1)] = cr68489_place_3);

return cr68489_state;
}catch (e68644){var cr68489_exception = e68644;
(cr68489_state[(0)] = null);

throw cr68489_exception;
}});
var cr68489_block_8 = (function frontend$handler$db_based$rtc_flows$cr68489_block_8(cr68489_state){
try{var cr68489_place_19 = missionary.core.unpark();
(cr68489_state[(0)] = cr68489_block_10);

(cr68489_state[(4)] = cr68489_place_19);

return cr68489_state;
}catch (e68645){var cr68489_exception = e68645;
(cr68489_state[(0)] = cr68489_block_12);

(cr68489_state[(4)] = null);

(cr68489_state[(3)] = null);

(cr68489_state[(2)] = cr68489_exception);

return cr68489_state;
}});
var cr68489_block_0 = (function frontend$handler$db_based$rtc_flows$cr68489_block_0(cr68489_state){
try{var cr68489_place_0 = frontend.mobile.flows.mobile_app_state_flow;
(cr68489_state[(0)] = cr68489_block_1);

return missionary.core.switch$(cr68489_place_0);
}catch (e68646){var cr68489_exception = e68646;
(cr68489_state[(0)] = null);

throw cr68489_exception;
}});
var cr68489_block_3 = (function frontend$handler$db_based$rtc_flows$cr68489_block_3(cr68489_state){
try{var cr68489_place_6 = (1);
var cr68489_place_7 = missionary.core.none;
(cr68489_state[(0)] = cr68489_block_4);

return missionary.core.fork(cr68489_place_6,cr68489_place_7);
}catch (e68649){var cr68489_exception = e68649;
(cr68489_state[(0)] = cr68489_block_12);

(cr68489_state[(3)] = null);

(cr68489_state[(2)] = cr68489_exception);

return cr68489_state;
}});
var cr68489_block_18 = (function frontend$handler$db_based$rtc_flows$cr68489_block_18(cr68489_state){
try{var cr68489_place_33 = missionary.core.unpark();
(cr68489_state[(0)] = cr68489_block_19);

(cr68489_state[(3)] = cr68489_place_33);

return cr68489_state;
}catch (e68654){var cr68489_exception = e68654;
(cr68489_state[(0)] = cr68489_block_20);

(cr68489_state[(3)] = null);

(cr68489_state[(1)] = true);

(cr68489_state[(2)] = cr68489_exception);

return cr68489_state;
}});
var cr68489_block_10 = (function frontend$handler$db_based$rtc_flows$cr68489_block_10(cr68489_state){
try{var cr68489_place_16 = (cr68489_state[(4)]);
(cr68489_state[(0)] = cr68489_block_11);

(cr68489_state[(4)] = null);

(cr68489_state[(3)] = cr68489_place_16);

return cr68489_state;
}catch (e68660){var cr68489_exception = e68660;
(cr68489_state[(0)] = cr68489_block_12);

(cr68489_state[(4)] = null);

(cr68489_state[(3)] = null);

(cr68489_state[(2)] = cr68489_exception);

return cr68489_state;
}});
var cr68489_block_11 = (function frontend$handler$db_based$rtc_flows$cr68489_block_11(cr68489_state){
try{var cr68489_place_5 = (cr68489_state[(3)]);
(cr68489_state[(0)] = cr68489_block_20);

(cr68489_state[(3)] = null);

(cr68489_state[(2)] = cr68489_place_5);

return cr68489_state;
}catch (e68672){var cr68489_exception = e68672;
(cr68489_state[(0)] = cr68489_block_12);

(cr68489_state[(3)] = null);

(cr68489_state[(2)] = cr68489_exception);

return cr68489_state;
}});
var cr68489_block_7 = (function frontend$handler$db_based$rtc_flows$cr68489_block_7(cr68489_state){
try{var cr68489_place_17 = (1);
var cr68489_place_18 = missionary.core.none;
(cr68489_state[(0)] = cr68489_block_8);

return missionary.core.fork(cr68489_place_17,cr68489_place_18);
}catch (e68674){var cr68489_exception = e68674;
(cr68489_state[(0)] = cr68489_block_12);

(cr68489_state[(4)] = null);

(cr68489_state[(3)] = null);

(cr68489_state[(2)] = cr68489_exception);

return cr68489_state;
}});
var cr68489_block_6 = (function frontend$handler$db_based$rtc_flows$cr68489_block_6(cr68489_state){
try{var cr68489_place_12 = missionary.core.unpark();
var cr68489_place_13 = cljs.core.not;
var cr68489_place_14 = cr68489_place_12;
var cr68489_place_15 = (function (){var G__68677 = cr68489_place_14;
var fexpr__68676 = cr68489_place_13;
return (fexpr__68676.cljs$core$IFn$_invoke$arity$1 ? fexpr__68676.cljs$core$IFn$_invoke$arity$1(G__68677) : fexpr__68676.call(null,G__68677));
})();
var cr68489_place_16 = null;
if(cljs.core.truth_(cr68489_place_15)){
(cr68489_state[(0)] = cr68489_block_9);

(cr68489_state[(4)] = cr68489_place_16);

return cr68489_state;
} else {
(cr68489_state[(0)] = cr68489_block_7);

(cr68489_state[(4)] = cr68489_place_16);

return cr68489_state;
}
}catch (e68675){var cr68489_exception = e68675;
(cr68489_state[(0)] = cr68489_block_12);

(cr68489_state[(3)] = null);

(cr68489_state[(2)] = cr68489_exception);

return cr68489_state;
}});
var cr68489_block_16 = (function frontend$handler$db_based$rtc_flows$cr68489_block_16(cr68489_state){
try{var cr68489_place_26 = (cr68489_state[(4)]);
(cr68489_state[(0)] = cr68489_block_19);

(cr68489_state[(4)] = null);

(cr68489_state[(3)] = cr68489_place_26);

return cr68489_state;
}catch (e68678){var cr68489_exception = e68678;
(cr68489_state[(0)] = cr68489_block_20);

(cr68489_state[(3)] = null);

(cr68489_state[(4)] = null);

(cr68489_state[(1)] = true);

(cr68489_state[(2)] = cr68489_exception);

return cr68489_state;
}});
var cr68489_block_9 = (function frontend$handler$db_based$rtc_flows$cr68489_block_9(cr68489_state){
try{var cr68489_place_20 = new cljs.core.Keyword(null,"mobile-app-active&rtc-not-running","mobile-app-active&rtc-not-running",-334043858);
(cr68489_state[(0)] = cr68489_block_10);

(cr68489_state[(4)] = cr68489_place_20);

return cr68489_state;
}catch (e68679){var cr68489_exception = e68679;
(cr68489_state[(0)] = cr68489_block_12);

(cr68489_state[(4)] = null);

(cr68489_state[(3)] = null);

(cr68489_state[(2)] = cr68489_exception);

return cr68489_state;
}});
var cr68489_block_13 = (function frontend$handler$db_based$rtc_flows$cr68489_block_13(cr68489_state){
try{var cr68489_place_25 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr68489_place_26 = null;
if(cljs.core.truth_(cr68489_place_25)){
(cr68489_state[(0)] = cr68489_block_15);

(cr68489_state[(3)] = null);

return cr68489_state;
} else {
(cr68489_state[(0)] = cr68489_block_14);

(cr68489_state[(4)] = cr68489_place_26);

return cr68489_state;
}
}catch (e68681){var cr68489_exception = e68681;
(cr68489_state[(0)] = cr68489_block_20);

(cr68489_state[(3)] = null);

(cr68489_state[(1)] = true);

(cr68489_state[(2)] = cr68489_exception);

return cr68489_state;
}});
var cr68489_block_20 = (function frontend$handler$db_based$rtc_flows$cr68489_block_20(cr68489_state){
try{var cr68489_place_3 = (cr68489_state[(1)]);
var cr68489_place_2 = (cr68489_state[(2)]);
var cr68489_place_34 = (cljs.core.truth_(cr68489_place_3)?(function(){throw cr68489_place_2})():cr68489_place_2);
(cr68489_state[(0)] = null);

(cr68489_state[(1)] = null);

(cr68489_state[(2)] = null);

return cr68489_place_34;
}catch (e68682){var cr68489_exception = e68682;
(cr68489_state[(0)] = null);

(cr68489_state[(1)] = null);

(cr68489_state[(2)] = null);

throw cr68489_exception;
}});
return cloroutine.impl.coroutine((function (){var G__68684 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__68684[(0)] = cr68489_block_0);

return G__68684;
})());
})(),missionary.core.ap_run);
frontend.handler.db_based.rtc_flows.trigger_start_rtc_flow = frontend.common.missionary.debounce((200),missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (p__68685){
var vec__68686 = p__68685;
var current_user = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68686,(0),null);
var trigger_event = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68686,(1),null);
if(cljs.core.truth_(current_user)){
return trigger_event;
} else {
return null;
}
})),missionary.core.latest.cljs$core$IFn$_invoke$arity$variadic(cljs.core.vector,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.flows.current_login_user_flow,cljs.core.apply.cljs$core$IFn$_invoke$arity$2(frontend.common.missionary.mix,new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (user){
if(cljs.core.truth_(new cljs.core.Keyword(null,"email","email",1415816706).cljs$core$IFn$_invoke$arity$1(user))){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"login","login",55217519)], null);
} else {
return null;
}
})),frontend.flows.current_login_user_flow),missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (repo){
if(cljs.core.truth_(repo)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"graph-switch","graph-switch",1110417387),repo], null);
} else {
return null;
}
})),frontend.flows.current_repo_flow),missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (repo){
if(cljs.core.truth_(repo)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"trigger-rtc","trigger-rtc",-286448335),repo], null);
} else {
return null;
}
})),missionary.core.watch(frontend.handler.db_based.rtc_flows._STAR_rtc_start_trigger)),missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1(cljs.core.vector),frontend.handler.db_based.rtc_flows.document_visible_AMPERSAND_rtc_not_running_flow),missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1(cljs.core.vector),frontend.handler.db_based.rtc_flows.network_online_AMPERSAND_rtc_not_running_flow),missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1(cljs.core.vector),frontend.handler.db_based.rtc_flows.mobile_app_active_AMPERSAND_rtc_not_running_flow)], null))], 0))));

//# sourceMappingURL=frontend.handler.db_based.rtc_flows.js.map
