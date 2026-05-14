goog.provide('frontend.handler.db_based.rtc_flows');
frontend.handler.db_based.rtc_flows.rtc_log_flow = missionary.core.watch(new cljs.core.Keyword("rtc","log","rtc/log",-1596481285).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state)));
frontend.handler.db_based.rtc_flows.rtc_download_log_flow = missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (p1__109062_SHARP_){
return cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("rtc.log","download","rtc.log/download",-2144210573),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__109062_SHARP_));
})),frontend.handler.db_based.rtc_flows.rtc_log_flow);
frontend.handler.db_based.rtc_flows.rtc_upload_log_flow = missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (p1__109068_SHARP_){
return cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("rtc.log","upload","rtc.log/upload",-1832742059),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__109068_SHARP_));
})),frontend.handler.db_based.rtc_flows.rtc_log_flow);
frontend.handler.db_based.rtc_flows.rtc_misc_log_flow = missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.remove.cljs$core$IFn$_invoke$arity$1((function (p1__109073_SHARP_){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("rtc.log","download","rtc.log/download",-2144210573),null,new cljs.core.Keyword("rtc.log","upload","rtc.log/upload",-1832742059),null], null), null),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(p1__109073_SHARP_));
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
var map__109085 = m;
var map__109085__$1 = cljs.core.__destructure_map(map__109085);
var rtc_lock = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109085__$1,new cljs.core.Keyword(null,"rtc-lock","rtc-lock",1338966560));
var last_stop_exception_ex_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109085__$1,new cljs.core.Keyword(null,"last-stop-exception-ex-data","last-stop-exception-ex-data",800047332));
var graph_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109085__$1,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522));
var login_user = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__109085__$1,new cljs.core.Keyword(null,"login-user","login-user",1935565562));
if((((!((new cljs.core.Keyword(null,"email","email",1415816706).cljs$core$IFn$_invoke$arity$1(login_user) == null)))) && ((((!((graph_uuid == null)))) && (((cljs.core.not(rtc_lock)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("rtc.exception","ws-timeout","rtc.exception/ws-timeout",456034739),new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(last_stop_exception_ex_data))) && (navigator.onLine === true))))))))){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid,new cljs.core.Keyword(null,"t","t",-1397832519),logseq.common.util.time_ms()], null);
} else {
return null;
}
})),missionary.core.latest.cljs$core$IFn$_invoke$arity$variadic((function (rtc_state,_,login_user){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(rtc_state,new cljs.core.Keyword(null,"login-user","login-user",1935565562),login_user);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.handler.db_based.rtc_flows.rtc_state_flow,frontend.common.missionary.continue_flow.cljs$core$IFn$_invoke$arity$1(frontend.handler.db_based.rtc_flows.network_online_change_flow),frontend.flows.current_login_user_flow], 0))));
frontend.handler.db_based.rtc_flows.logout_or_graph_switch_flow = frontend.common.missionary.mix.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (p1__109086_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"logout","logout",1418564329),p1__109086_SHARP_);
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
frontend.handler.db_based.rtc_flows.document_visible_AMPERSAND_rtc_not_running_flow = cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr109087_block_18 = (function frontend$handler$db_based$rtc_flows$cr109087_block_18(cr109087_state){
try{var cr109087_place_38 = missionary.core.unpark();
(cr109087_state[(0)] = cr109087_block_19);

(cr109087_state[(3)] = cr109087_place_38);

return cr109087_state;
}catch (e109307){var cr109087_exception = e109307;
(cr109087_state[(0)] = cr109087_block_20);

(cr109087_state[(3)] = null);

(cr109087_state[(1)] = true);

(cr109087_state[(2)] = cr109087_exception);

return cr109087_state;
}});
var cr109087_block_14 = (function frontend$handler$db_based$rtc_flows$cr109087_block_14(cr109087_state){
try{var cr109087_place_32 = null;
(cr109087_state[(0)] = cr109087_block_16);

(cr109087_state[(4)] = cr109087_place_32);

return cr109087_state;
}catch (e109311){var cr109087_exception = e109311;
(cr109087_state[(0)] = cr109087_block_20);

(cr109087_state[(3)] = null);

(cr109087_state[(4)] = null);

(cr109087_state[(1)] = true);

(cr109087_state[(2)] = cr109087_exception);

return cr109087_state;
}});
var cr109087_block_0 = (function frontend$handler$db_based$rtc_flows$cr109087_block_0(cr109087_state){
try{var cr109087_place_0 = frontend.flows.document_visibility_state_flow;
(cr109087_state[(0)] = cr109087_block_1);

return missionary.core.switch$(cr109087_place_0);
}catch (e109315){var cr109087_exception = e109315;
(cr109087_state[(0)] = null);

throw cr109087_exception;
}});
var cr109087_block_4 = (function frontend$handler$db_based$rtc_flows$cr109087_block_4(cr109087_state){
try{var cr109087_place_11 = missionary.core.unpark();
(cr109087_state[(0)] = cr109087_block_11);

(cr109087_state[(3)] = cr109087_place_11);

return cr109087_state;
}catch (e109317){var cr109087_exception = e109317;
(cr109087_state[(0)] = cr109087_block_12);

(cr109087_state[(3)] = null);

(cr109087_state[(2)] = cr109087_exception);

return cr109087_state;
}});
var cr109087_block_15 = (function frontend$handler$db_based$rtc_flows$cr109087_block_15(cr109087_state){
try{var cr109087_place_2 = (cr109087_state[(2)]);
var cr109087_place_33 = cr109087_place_2;
var cr109087_place_34 = (function(){throw cr109087_place_33})();
(cr109087_state[(0)] = null);

(cr109087_state[(1)] = null);

(cr109087_state[(2)] = null);

return null;
}catch (e109323){var cr109087_exception = e109323;
(cr109087_state[(0)] = cr109087_block_20);

(cr109087_state[(1)] = true);

(cr109087_state[(2)] = cr109087_exception);

return cr109087_state;
}});
var cr109087_block_16 = (function frontend$handler$db_based$rtc_flows$cr109087_block_16(cr109087_state){
try{var cr109087_place_31 = (cr109087_state[(4)]);
(cr109087_state[(0)] = cr109087_block_19);

(cr109087_state[(4)] = null);

(cr109087_state[(3)] = cr109087_place_31);

return cr109087_state;
}catch (e109326){var cr109087_exception = e109326;
(cr109087_state[(0)] = cr109087_block_20);

(cr109087_state[(3)] = null);

(cr109087_state[(4)] = null);

(cr109087_state[(1)] = true);

(cr109087_state[(2)] = cr109087_exception);

return cr109087_state;
}});
var cr109087_block_13 = (function frontend$handler$db_based$rtc_flows$cr109087_block_13(cr109087_state){
try{var cr109087_place_30 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr109087_place_31 = null;
if(cljs.core.truth_(cr109087_place_30)){
(cr109087_state[(0)] = cr109087_block_15);

(cr109087_state[(3)] = null);

return cr109087_state;
} else {
(cr109087_state[(0)] = cr109087_block_14);

(cr109087_state[(4)] = cr109087_place_31);

return cr109087_state;
}
}catch (e109329){var cr109087_exception = e109329;
(cr109087_state[(0)] = cr109087_block_20);

(cr109087_state[(3)] = null);

(cr109087_state[(1)] = true);

(cr109087_state[(2)] = cr109087_exception);

return cr109087_state;
}});
var cr109087_block_3 = (function frontend$handler$db_based$rtc_flows$cr109087_block_3(cr109087_state){
try{var cr109087_place_9 = (1);
var cr109087_place_10 = missionary.core.none;
(cr109087_state[(0)] = cr109087_block_4);

return missionary.core.fork(cr109087_place_9,cr109087_place_10);
}catch (e109336){var cr109087_exception = e109336;
(cr109087_state[(0)] = cr109087_block_12);

(cr109087_state[(3)] = null);

(cr109087_state[(2)] = cr109087_exception);

return cr109087_state;
}});
var cr109087_block_9 = (function frontend$handler$db_based$rtc_flows$cr109087_block_9(cr109087_state){
try{var cr109087_place_25 = new cljs.core.Keyword(null,"document-visible&rtc-not-running","document-visible&rtc-not-running",-1278071938);
(cr109087_state[(0)] = cr109087_block_10);

(cr109087_state[(4)] = cr109087_place_25);

return cr109087_state;
}catch (e109341){var cr109087_exception = e109341;
(cr109087_state[(0)] = cr109087_block_12);

(cr109087_state[(4)] = null);

(cr109087_state[(3)] = null);

(cr109087_state[(2)] = cr109087_exception);

return cr109087_state;
}});
var cr109087_block_7 = (function frontend$handler$db_based$rtc_flows$cr109087_block_7(cr109087_state){
try{var cr109087_place_22 = (1);
var cr109087_place_23 = missionary.core.none;
(cr109087_state[(0)] = cr109087_block_8);

return missionary.core.fork(cr109087_place_22,cr109087_place_23);
}catch (e109346){var cr109087_exception = e109346;
(cr109087_state[(0)] = cr109087_block_12);

(cr109087_state[(4)] = null);

(cr109087_state[(3)] = null);

(cr109087_state[(2)] = cr109087_exception);

return cr109087_state;
}});
var cr109087_block_11 = (function frontend$handler$db_based$rtc_flows$cr109087_block_11(cr109087_state){
try{var cr109087_place_8 = (cr109087_state[(3)]);
(cr109087_state[(0)] = cr109087_block_20);

(cr109087_state[(3)] = null);

(cr109087_state[(2)] = cr109087_place_8);

return cr109087_state;
}catch (e109350){var cr109087_exception = e109350;
(cr109087_state[(0)] = cr109087_block_12);

(cr109087_state[(3)] = null);

(cr109087_state[(2)] = cr109087_exception);

return cr109087_state;
}});
var cr109087_block_12 = (function frontend$handler$db_based$rtc_flows$cr109087_block_12(cr109087_state){
try{var cr109087_place_2 = (cr109087_state[(2)]);
var cr109087_place_26 = cr109087_place_2;
var cr109087_place_27 = missionary.Cancelled;
var cr109087_place_28 = (cr109087_place_26 instanceof cr109087_place_27);
var cr109087_place_29 = null;
if(cr109087_place_28){
(cr109087_state[(0)] = cr109087_block_17);

(cr109087_state[(3)] = cr109087_place_29);

return cr109087_state;
} else {
(cr109087_state[(0)] = cr109087_block_13);

(cr109087_state[(3)] = cr109087_place_29);

return cr109087_state;
}
}catch (e109355){var cr109087_exception = e109355;
(cr109087_state[(0)] = cr109087_block_20);

(cr109087_state[(1)] = true);

(cr109087_state[(2)] = cr109087_exception);

return cr109087_state;
}});
var cr109087_block_10 = (function frontend$handler$db_based$rtc_flows$cr109087_block_10(cr109087_state){
try{var cr109087_place_21 = (cr109087_state[(4)]);
(cr109087_state[(0)] = cr109087_block_11);

(cr109087_state[(4)] = null);

(cr109087_state[(3)] = cr109087_place_21);

return cr109087_state;
}catch (e109364){var cr109087_exception = e109364;
(cr109087_state[(0)] = cr109087_block_12);

(cr109087_state[(4)] = null);

(cr109087_state[(3)] = null);

(cr109087_state[(2)] = cr109087_exception);

return cr109087_state;
}});
var cr109087_block_6 = (function frontend$handler$db_based$rtc_flows$cr109087_block_6(cr109087_state){
try{var cr109087_place_12 = (cr109087_state[(4)]);
var cr109087_place_16 = missionary.core.unpark();
var cr109087_place_17 = cr109087_place_12.cljs$core$IFn$_invoke$arity$1(cr109087_place_16);
var cr109087_place_18 = cljs.core.not;
var cr109087_place_19 = cr109087_place_17;
var cr109087_place_20 = (function (){var G__109382 = cr109087_place_19;
var fexpr__109381 = cr109087_place_18;
return (fexpr__109381.cljs$core$IFn$_invoke$arity$1 ? fexpr__109381.cljs$core$IFn$_invoke$arity$1(G__109382) : fexpr__109381.call(null,G__109382));
})();
var cr109087_place_21 = null;
if(cljs.core.truth_(cr109087_place_20)){
(cr109087_state[(0)] = cr109087_block_9);

(cr109087_state[(4)] = null);

(cr109087_state[(4)] = cr109087_place_21);

return cr109087_state;
} else {
(cr109087_state[(0)] = cr109087_block_7);

(cr109087_state[(4)] = null);

(cr109087_state[(4)] = cr109087_place_21);

return cr109087_state;
}
}catch (e109371){var cr109087_exception = e109371;
(cr109087_state[(0)] = cr109087_block_12);

(cr109087_state[(3)] = null);

(cr109087_state[(4)] = null);

(cr109087_state[(2)] = cr109087_exception);

return cr109087_state;
}});
var cr109087_block_5 = (function frontend$handler$db_based$rtc_flows$cr109087_block_5(cr109087_state){
try{var cr109087_place_12 = new cljs.core.Keyword(null,"rtc-lock","rtc-lock",1338966560);
var cr109087_place_13 = frontend.common.missionary.snapshot_of_flow;
var cr109087_place_14 = frontend.handler.db_based.rtc_flows.rtc_state_flow;
var cr109087_place_15 = (function (){var G__109386 = cr109087_place_14;
var fexpr__109385 = cr109087_place_13;
return (fexpr__109385.cljs$core$IFn$_invoke$arity$1 ? fexpr__109385.cljs$core$IFn$_invoke$arity$1(G__109386) : fexpr__109385.call(null,G__109386));
})();
(cr109087_state[(0)] = cr109087_block_6);

(cr109087_state[(4)] = cr109087_place_12);

return missionary.core.park(cr109087_place_15);
}catch (e109384){var cr109087_exception = e109384;
(cr109087_state[(0)] = cr109087_block_12);

(cr109087_state[(3)] = null);

(cr109087_state[(2)] = cr109087_exception);

return cr109087_state;
}});
var cr109087_block_17 = (function frontend$handler$db_based$rtc_flows$cr109087_block_17(cr109087_state){
try{var cr109087_place_2 = (cr109087_state[(2)]);
var cr109087_place_35 = cr109087_place_2;
var cr109087_place_36 = (1);
var cr109087_place_37 = missionary.core.none;
(cr109087_state[(0)] = cr109087_block_18);

return missionary.core.fork(cr109087_place_36,cr109087_place_37);
}catch (e109387){var cr109087_exception = e109387;
(cr109087_state[(0)] = cr109087_block_20);

(cr109087_state[(3)] = null);

(cr109087_state[(1)] = true);

(cr109087_state[(2)] = cr109087_exception);

return cr109087_state;
}});
var cr109087_block_20 = (function frontend$handler$db_based$rtc_flows$cr109087_block_20(cr109087_state){
try{var cr109087_place_3 = (cr109087_state[(1)]);
var cr109087_place_2 = (cr109087_state[(2)]);
var cr109087_place_39 = (cljs.core.truth_(cr109087_place_3)?(function(){throw cr109087_place_2})():cr109087_place_2);
(cr109087_state[(0)] = null);

(cr109087_state[(1)] = null);

(cr109087_state[(2)] = null);

return cr109087_place_39;
}catch (e109397){var cr109087_exception = e109397;
(cr109087_state[(0)] = null);

(cr109087_state[(1)] = null);

(cr109087_state[(2)] = null);

throw cr109087_exception;
}});
var cr109087_block_8 = (function frontend$handler$db_based$rtc_flows$cr109087_block_8(cr109087_state){
try{var cr109087_place_24 = missionary.core.unpark();
(cr109087_state[(0)] = cr109087_block_10);

(cr109087_state[(4)] = cr109087_place_24);

return cr109087_state;
}catch (e109419){var cr109087_exception = e109419;
(cr109087_state[(0)] = cr109087_block_12);

(cr109087_state[(4)] = null);

(cr109087_state[(3)] = null);

(cr109087_state[(2)] = cr109087_exception);

return cr109087_state;
}});
var cr109087_block_19 = (function frontend$handler$db_based$rtc_flows$cr109087_block_19(cr109087_state){
try{var cr109087_place_29 = (cr109087_state[(3)]);
(cr109087_state[(0)] = cr109087_block_20);

(cr109087_state[(3)] = null);

(cr109087_state[(2)] = cr109087_place_29);

return cr109087_state;
}catch (e109421){var cr109087_exception = e109421;
(cr109087_state[(0)] = cr109087_block_20);

(cr109087_state[(3)] = null);

(cr109087_state[(1)] = true);

(cr109087_state[(2)] = cr109087_exception);

return cr109087_state;
}});
var cr109087_block_2 = (function frontend$handler$db_based$rtc_flows$cr109087_block_2(cr109087_state){
try{var cr109087_place_1 = (cr109087_state[(3)]);
var cr109087_place_4 = cljs.core._EQ_;
var cr109087_place_5 = "visible";
var cr109087_place_6 = cr109087_place_1;
var cr109087_place_7 = (function (){var G__109429 = cr109087_place_5;
var G__109430 = cr109087_place_6;
var fexpr__109428 = cr109087_place_4;
return (fexpr__109428.cljs$core$IFn$_invoke$arity$2 ? fexpr__109428.cljs$core$IFn$_invoke$arity$2(G__109429,G__109430) : fexpr__109428.call(null,G__109429,G__109430));
})();
var cr109087_place_8 = null;
if(cljs.core.truth_(cr109087_place_7)){
(cr109087_state[(0)] = cr109087_block_5);

(cr109087_state[(3)] = null);

(cr109087_state[(3)] = cr109087_place_8);

return cr109087_state;
} else {
(cr109087_state[(0)] = cr109087_block_3);

(cr109087_state[(3)] = null);

(cr109087_state[(3)] = cr109087_place_8);

return cr109087_state;
}
}catch (e109426){var cr109087_exception = e109426;
(cr109087_state[(0)] = cr109087_block_12);

(cr109087_state[(3)] = null);

(cr109087_state[(2)] = cr109087_exception);

return cr109087_state;
}});
var cr109087_block_1 = (function frontend$handler$db_based$rtc_flows$cr109087_block_1(cr109087_state){
try{var cr109087_place_1 = missionary.core.unpark();
var cr109087_place_2 = null;
var cr109087_place_3 = false;
(cr109087_state[(0)] = cr109087_block_2);

(cr109087_state[(3)] = cr109087_place_1);

(cr109087_state[(2)] = cr109087_place_2);

(cr109087_state[(1)] = cr109087_place_3);

return cr109087_state;
}catch (e109434){var cr109087_exception = e109434;
(cr109087_state[(0)] = null);

throw cr109087_exception;
}});
return cloroutine.impl.coroutine((function (){var G__109436 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__109436[(0)] = cr109087_block_0);

return G__109436;
})());
})(),missionary.core.ap_run);
frontend.handler.db_based.rtc_flows.network_online_AMPERSAND_rtc_not_running_flow = cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr109437_block_15 = (function frontend$handler$db_based$rtc_flows$cr109437_block_15(cr109437_state){
try{var cr109437_place_2 = (cr109437_state[(1)]);
var cr109437_place_30 = cr109437_place_2;
var cr109437_place_31 = (function(){throw cr109437_place_30})();
(cr109437_state[(0)] = null);

(cr109437_state[(1)] = null);

(cr109437_state[(3)] = null);

return null;
}catch (e109593){var cr109437_exception = e109593;
(cr109437_state[(0)] = cr109437_block_20);

(cr109437_state[(3)] = true);

(cr109437_state[(1)] = cr109437_exception);

return cr109437_state;
}});
var cr109437_block_10 = (function frontend$handler$db_based$rtc_flows$cr109437_block_10(cr109437_state){
try{var cr109437_place_18 = (cr109437_state[(4)]);
(cr109437_state[(0)] = cr109437_block_11);

(cr109437_state[(4)] = null);

(cr109437_state[(2)] = cr109437_place_18);

return cr109437_state;
}catch (e109616){var cr109437_exception = e109616;
(cr109437_state[(0)] = cr109437_block_12);

(cr109437_state[(2)] = null);

(cr109437_state[(4)] = null);

(cr109437_state[(1)] = cr109437_exception);

return cr109437_state;
}});
var cr109437_block_0 = (function frontend$handler$db_based$rtc_flows$cr109437_block_0(cr109437_state){
try{var cr109437_place_0 = frontend.flows.network_online_event_flow;
(cr109437_state[(0)] = cr109437_block_1);

return missionary.core.switch$(cr109437_place_0);
}catch (e109620){var cr109437_exception = e109620;
(cr109437_state[(0)] = null);

throw cr109437_exception;
}});
var cr109437_block_4 = (function frontend$handler$db_based$rtc_flows$cr109437_block_4(cr109437_state){
try{var cr109437_place_8 = missionary.core.unpark();
(cr109437_state[(0)] = cr109437_block_11);

(cr109437_state[(2)] = cr109437_place_8);

return cr109437_state;
}catch (e109633){var cr109437_exception = e109633;
(cr109437_state[(0)] = cr109437_block_12);

(cr109437_state[(2)] = null);

(cr109437_state[(1)] = cr109437_exception);

return cr109437_state;
}});
var cr109437_block_6 = (function frontend$handler$db_based$rtc_flows$cr109437_block_6(cr109437_state){
try{var cr109437_place_9 = (cr109437_state[(4)]);
var cr109437_place_13 = missionary.core.unpark();
var cr109437_place_14 = cr109437_place_9.cljs$core$IFn$_invoke$arity$1(cr109437_place_13);
var cr109437_place_15 = cljs.core.not;
var cr109437_place_16 = cr109437_place_14;
var cr109437_place_17 = (function (){var G__109658 = cr109437_place_16;
var fexpr__109657 = cr109437_place_15;
return (fexpr__109657.cljs$core$IFn$_invoke$arity$1 ? fexpr__109657.cljs$core$IFn$_invoke$arity$1(G__109658) : fexpr__109657.call(null,G__109658));
})();
var cr109437_place_18 = null;
if(cljs.core.truth_(cr109437_place_17)){
(cr109437_state[(0)] = cr109437_block_9);

(cr109437_state[(4)] = null);

(cr109437_state[(4)] = cr109437_place_18);

return cr109437_state;
} else {
(cr109437_state[(0)] = cr109437_block_7);

(cr109437_state[(4)] = null);

(cr109437_state[(4)] = cr109437_place_18);

return cr109437_state;
}
}catch (e109651){var cr109437_exception = e109651;
(cr109437_state[(0)] = cr109437_block_12);

(cr109437_state[(2)] = null);

(cr109437_state[(4)] = null);

(cr109437_state[(1)] = cr109437_exception);

return cr109437_state;
}});
var cr109437_block_20 = (function frontend$handler$db_based$rtc_flows$cr109437_block_20(cr109437_state){
try{var cr109437_place_2 = (cr109437_state[(1)]);
var cr109437_place_3 = (cr109437_state[(3)]);
var cr109437_place_36 = (cljs.core.truth_(cr109437_place_3)?(function(){throw cr109437_place_2})():cr109437_place_2);
(cr109437_state[(0)] = null);

(cr109437_state[(1)] = null);

(cr109437_state[(3)] = null);

return cr109437_place_36;
}catch (e109670){var cr109437_exception = e109670;
(cr109437_state[(0)] = null);

(cr109437_state[(1)] = null);

(cr109437_state[(3)] = null);

throw cr109437_exception;
}});
var cr109437_block_19 = (function frontend$handler$db_based$rtc_flows$cr109437_block_19(cr109437_state){
try{var cr109437_place_26 = (cr109437_state[(2)]);
(cr109437_state[(0)] = cr109437_block_20);

(cr109437_state[(2)] = null);

(cr109437_state[(1)] = cr109437_place_26);

return cr109437_state;
}catch (e109683){var cr109437_exception = e109683;
(cr109437_state[(0)] = cr109437_block_20);

(cr109437_state[(2)] = null);

(cr109437_state[(3)] = true);

(cr109437_state[(1)] = cr109437_exception);

return cr109437_state;
}});
var cr109437_block_1 = (function frontend$handler$db_based$rtc_flows$cr109437_block_1(cr109437_state){
try{var cr109437_place_1 = missionary.core.unpark();
var cr109437_place_2 = null;
var cr109437_place_3 = false;
(cr109437_state[(0)] = cr109437_block_2);

(cr109437_state[(2)] = cr109437_place_1);

(cr109437_state[(1)] = cr109437_place_2);

(cr109437_state[(3)] = cr109437_place_3);

return cr109437_state;
}catch (e109685){var cr109437_exception = e109685;
(cr109437_state[(0)] = null);

throw cr109437_exception;
}});
var cr109437_block_8 = (function frontend$handler$db_based$rtc_flows$cr109437_block_8(cr109437_state){
try{var cr109437_place_21 = missionary.core.unpark();
(cr109437_state[(0)] = cr109437_block_10);

(cr109437_state[(4)] = cr109437_place_21);

return cr109437_state;
}catch (e109688){var cr109437_exception = e109688;
(cr109437_state[(0)] = cr109437_block_12);

(cr109437_state[(2)] = null);

(cr109437_state[(4)] = null);

(cr109437_state[(1)] = cr109437_exception);

return cr109437_state;
}});
var cr109437_block_11 = (function frontend$handler$db_based$rtc_flows$cr109437_block_11(cr109437_state){
try{var cr109437_place_5 = (cr109437_state[(2)]);
(cr109437_state[(0)] = cr109437_block_20);

(cr109437_state[(2)] = null);

(cr109437_state[(1)] = cr109437_place_5);

return cr109437_state;
}catch (e109692){var cr109437_exception = e109692;
(cr109437_state[(0)] = cr109437_block_12);

(cr109437_state[(2)] = null);

(cr109437_state[(1)] = cr109437_exception);

return cr109437_state;
}});
var cr109437_block_18 = (function frontend$handler$db_based$rtc_flows$cr109437_block_18(cr109437_state){
try{var cr109437_place_35 = missionary.core.unpark();
(cr109437_state[(0)] = cr109437_block_19);

(cr109437_state[(2)] = cr109437_place_35);

return cr109437_state;
}catch (e109695){var cr109437_exception = e109695;
(cr109437_state[(0)] = cr109437_block_20);

(cr109437_state[(2)] = null);

(cr109437_state[(3)] = true);

(cr109437_state[(1)] = cr109437_exception);

return cr109437_state;
}});
var cr109437_block_12 = (function frontend$handler$db_based$rtc_flows$cr109437_block_12(cr109437_state){
try{var cr109437_place_2 = (cr109437_state[(1)]);
var cr109437_place_23 = cr109437_place_2;
var cr109437_place_24 = missionary.Cancelled;
var cr109437_place_25 = (cr109437_place_23 instanceof cr109437_place_24);
var cr109437_place_26 = null;
if(cr109437_place_25){
(cr109437_state[(0)] = cr109437_block_17);

(cr109437_state[(2)] = cr109437_place_26);

return cr109437_state;
} else {
(cr109437_state[(0)] = cr109437_block_13);

(cr109437_state[(2)] = cr109437_place_26);

return cr109437_state;
}
}catch (e109699){var cr109437_exception = e109699;
(cr109437_state[(0)] = cr109437_block_20);

(cr109437_state[(3)] = true);

(cr109437_state[(1)] = cr109437_exception);

return cr109437_state;
}});
var cr109437_block_3 = (function frontend$handler$db_based$rtc_flows$cr109437_block_3(cr109437_state){
try{var cr109437_place_6 = (1);
var cr109437_place_7 = missionary.core.none;
(cr109437_state[(0)] = cr109437_block_4);

return missionary.core.fork(cr109437_place_6,cr109437_place_7);
}catch (e109703){var cr109437_exception = e109703;
(cr109437_state[(0)] = cr109437_block_12);

(cr109437_state[(2)] = null);

(cr109437_state[(1)] = cr109437_exception);

return cr109437_state;
}});
var cr109437_block_7 = (function frontend$handler$db_based$rtc_flows$cr109437_block_7(cr109437_state){
try{var cr109437_place_19 = (1);
var cr109437_place_20 = missionary.core.none;
(cr109437_state[(0)] = cr109437_block_8);

return missionary.core.fork(cr109437_place_19,cr109437_place_20);
}catch (e109707){var cr109437_exception = e109707;
(cr109437_state[(0)] = cr109437_block_12);

(cr109437_state[(2)] = null);

(cr109437_state[(4)] = null);

(cr109437_state[(1)] = cr109437_exception);

return cr109437_state;
}});
var cr109437_block_13 = (function frontend$handler$db_based$rtc_flows$cr109437_block_13(cr109437_state){
try{var cr109437_place_27 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr109437_place_28 = null;
if(cljs.core.truth_(cr109437_place_27)){
(cr109437_state[(0)] = cr109437_block_15);

(cr109437_state[(2)] = null);

return cr109437_state;
} else {
(cr109437_state[(0)] = cr109437_block_14);

(cr109437_state[(4)] = cr109437_place_28);

return cr109437_state;
}
}catch (e109710){var cr109437_exception = e109710;
(cr109437_state[(0)] = cr109437_block_20);

(cr109437_state[(2)] = null);

(cr109437_state[(3)] = true);

(cr109437_state[(1)] = cr109437_exception);

return cr109437_state;
}});
var cr109437_block_2 = (function frontend$handler$db_based$rtc_flows$cr109437_block_2(cr109437_state){
try{var cr109437_place_1 = (cr109437_state[(2)]);
var cr109437_place_4 = cr109437_place_1;
var cr109437_place_5 = null;
if(cljs.core.truth_(cr109437_place_4)){
(cr109437_state[(0)] = cr109437_block_5);

(cr109437_state[(2)] = null);

(cr109437_state[(2)] = cr109437_place_5);

return cr109437_state;
} else {
(cr109437_state[(0)] = cr109437_block_3);

(cr109437_state[(2)] = null);

(cr109437_state[(2)] = cr109437_place_5);

return cr109437_state;
}
}catch (e109711){var cr109437_exception = e109711;
(cr109437_state[(0)] = cr109437_block_12);

(cr109437_state[(2)] = null);

(cr109437_state[(1)] = cr109437_exception);

return cr109437_state;
}});
var cr109437_block_17 = (function frontend$handler$db_based$rtc_flows$cr109437_block_17(cr109437_state){
try{var cr109437_place_2 = (cr109437_state[(1)]);
var cr109437_place_32 = cr109437_place_2;
var cr109437_place_33 = (1);
var cr109437_place_34 = missionary.core.none;
(cr109437_state[(0)] = cr109437_block_18);

return missionary.core.fork(cr109437_place_33,cr109437_place_34);
}catch (e109714){var cr109437_exception = e109714;
(cr109437_state[(0)] = cr109437_block_20);

(cr109437_state[(2)] = null);

(cr109437_state[(3)] = true);

(cr109437_state[(1)] = cr109437_exception);

return cr109437_state;
}});
var cr109437_block_5 = (function frontend$handler$db_based$rtc_flows$cr109437_block_5(cr109437_state){
try{var cr109437_place_9 = new cljs.core.Keyword(null,"rtc-lock","rtc-lock",1338966560);
var cr109437_place_10 = frontend.common.missionary.snapshot_of_flow;
var cr109437_place_11 = frontend.handler.db_based.rtc_flows.rtc_state_flow;
var cr109437_place_12 = (function (){var G__109721 = cr109437_place_11;
var fexpr__109720 = cr109437_place_10;
return (fexpr__109720.cljs$core$IFn$_invoke$arity$1 ? fexpr__109720.cljs$core$IFn$_invoke$arity$1(G__109721) : fexpr__109720.call(null,G__109721));
})();
(cr109437_state[(0)] = cr109437_block_6);

(cr109437_state[(4)] = cr109437_place_9);

return missionary.core.park(cr109437_place_12);
}catch (e109718){var cr109437_exception = e109718;
(cr109437_state[(0)] = cr109437_block_12);

(cr109437_state[(2)] = null);

(cr109437_state[(1)] = cr109437_exception);

return cr109437_state;
}});
var cr109437_block_14 = (function frontend$handler$db_based$rtc_flows$cr109437_block_14(cr109437_state){
try{var cr109437_place_29 = null;
(cr109437_state[(0)] = cr109437_block_16);

(cr109437_state[(4)] = cr109437_place_29);

return cr109437_state;
}catch (e109723){var cr109437_exception = e109723;
(cr109437_state[(0)] = cr109437_block_20);

(cr109437_state[(4)] = null);

(cr109437_state[(2)] = null);

(cr109437_state[(3)] = true);

(cr109437_state[(1)] = cr109437_exception);

return cr109437_state;
}});
var cr109437_block_9 = (function frontend$handler$db_based$rtc_flows$cr109437_block_9(cr109437_state){
try{var cr109437_place_22 = new cljs.core.Keyword(null,"network-online&rtc-not-running","network-online&rtc-not-running",-1315392544);
(cr109437_state[(0)] = cr109437_block_10);

(cr109437_state[(4)] = cr109437_place_22);

return cr109437_state;
}catch (e109726){var cr109437_exception = e109726;
(cr109437_state[(0)] = cr109437_block_12);

(cr109437_state[(2)] = null);

(cr109437_state[(4)] = null);

(cr109437_state[(1)] = cr109437_exception);

return cr109437_state;
}});
var cr109437_block_16 = (function frontend$handler$db_based$rtc_flows$cr109437_block_16(cr109437_state){
try{var cr109437_place_28 = (cr109437_state[(4)]);
(cr109437_state[(0)] = cr109437_block_19);

(cr109437_state[(4)] = null);

(cr109437_state[(2)] = cr109437_place_28);

return cr109437_state;
}catch (e109731){var cr109437_exception = e109731;
(cr109437_state[(0)] = cr109437_block_20);

(cr109437_state[(4)] = null);

(cr109437_state[(2)] = null);

(cr109437_state[(3)] = true);

(cr109437_state[(1)] = cr109437_exception);

return cr109437_state;
}});
return cloroutine.impl.coroutine((function (){var G__109735 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__109735[(0)] = cr109437_block_0);

return G__109735;
})());
})(),missionary.core.ap_run);
frontend.handler.db_based.rtc_flows.trigger_start_rtc_flow = frontend.common.missionary.debounce((200),missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (p__109740){
var vec__109741 = p__109740;
var current_user = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__109741,(0),null);
var trigger_event = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__109741,(1),null);
if(cljs.core.truth_(current_user)){
return trigger_event;
} else {
return null;
}
})),missionary.core.latest.cljs$core$IFn$_invoke$arity$variadic(cljs.core.vector,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.flows.current_login_user_flow,cljs.core.apply.cljs$core$IFn$_invoke$arity$2(frontend.common.missionary.mix,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (user){
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
})),missionary.core.watch(frontend.handler.db_based.rtc_flows._STAR_rtc_start_trigger)),missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1(cljs.core.vector),frontend.handler.db_based.rtc_flows.document_visible_AMPERSAND_rtc_not_running_flow),missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1(cljs.core.vector),frontend.handler.db_based.rtc_flows.network_online_AMPERSAND_rtc_not_running_flow)], null))], 0))));

//# sourceMappingURL=frontend.handler.db_based.rtc_flows.js.map
