goog.provide('frontend.worker.rtc.core');
frontend.worker.rtc.core.rtc_state_schema = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ws-state","ws-state",2128833478),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"enum","enum",1679018432),new cljs.core.Keyword(null,"connecting","connecting",-1347943866),new cljs.core.Keyword(null,"open","open",-1763596448),new cljs.core.Keyword(null,"closing","closing",-1862893890),new cljs.core.Keyword(null,"closed","closed",-919675359)], null)], null)], null);
frontend.worker.rtc.core.rtc_state_validator = malli.core.validator.cljs$core$IFn$_invoke$arity$1(frontend.worker.rtc.core.rtc_state_schema);
frontend.worker.rtc.core.sentinel = ({});
/**
 * Return a flow: receive messages from ws,
 *   and filter messages with :req-id=
 *   - `push-updates`
 *   - `online-users-updated`.
 *   - `push-asset-upload-updates`
 */
frontend.worker.rtc.core.get_remote_updates = (function frontend$worker$rtc$core$get_remote_updates(get_ws_create_task){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr106470_block_10 = (function frontend$worker$rtc$core$get_remote_updates_$_cr106470_block_10(cr106470_state){
try{var cr106470_place_2 = (cr106470_state[(2)]);
var cr106470_place_23 = cr106470_place_2;
var cr106470_place_24 = frontend.worker.rtc.core.sentinel;
(cr106470_state[(0)] = cr106470_block_11);

(cr106470_state[(3)] = cr106470_place_24);

return cr106470_state;
}catch (e106496){var cr106470_exception = e106496;
(cr106470_state[(0)] = cr106470_block_12);

(cr106470_state[(3)] = null);

(cr106470_state[(1)] = true);

(cr106470_state[(2)] = cr106470_exception);

return cr106470_state;
}});
var cr106470_block_8 = (function frontend$worker$rtc$core$get_remote_updates_$_cr106470_block_8(cr106470_state){
try{var cr106470_place_2 = (cr106470_state[(2)]);
var cr106470_place_21 = cr106470_place_2;
var cr106470_place_22 = (function(){throw cr106470_place_21})();
(cr106470_state[(0)] = null);

(cr106470_state[(1)] = null);

(cr106470_state[(2)] = null);

return null;
}catch (e106497){var cr106470_exception = e106497;
(cr106470_state[(0)] = cr106470_block_12);

(cr106470_state[(1)] = true);

(cr106470_state[(2)] = cr106470_exception);

return cr106470_state;
}});
var cr106470_block_3 = (function frontend$worker$rtc$core$get_remote_updates_$_cr106470_block_3(cr106470_state){
try{var cr106470_place_1 = (cr106470_state[(3)]);
var cr106470_place_4 = (1);
var cr106470_place_5 = missionary.core.eduction;
var cr106470_place_6 = cljs.core.filter;
var cr106470_place_7 = (function (data){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["push-asset-upload-updates",null,"push-updates",null,"online-users-updated",null], null), null),new cljs.core.Keyword(null,"req-id","req-id",-471642231).cljs$core$IFn$_invoke$arity$1(data));
});
var cr106470_place_8 = (function (){var G__106500 = cr106470_place_7;
var fexpr__106499 = cr106470_place_6;
return (fexpr__106499.cljs$core$IFn$_invoke$arity$1 ? fexpr__106499.cljs$core$IFn$_invoke$arity$1(G__106500) : fexpr__106499.call(null,G__106500));
})();
var cr106470_place_9 = frontend.worker.rtc.ws.recv_flow;
var cr106470_place_10 = cr106470_place_1;
var cr106470_place_11 = (function (){var G__106502 = cr106470_place_10;
var fexpr__106501 = cr106470_place_9;
return (fexpr__106501.cljs$core$IFn$_invoke$arity$1 ? fexpr__106501.cljs$core$IFn$_invoke$arity$1(G__106502) : fexpr__106501.call(null,G__106502));
})();
var cr106470_place_12 = (function (){var G__106504 = cr106470_place_8;
var G__106505 = cr106470_place_11;
var fexpr__106503 = cr106470_place_5;
return (fexpr__106503.cljs$core$IFn$_invoke$arity$2 ? fexpr__106503.cljs$core$IFn$_invoke$arity$2(G__106504,G__106505) : fexpr__106503.call(null,G__106504,G__106505));
})();
(cr106470_state[(0)] = cr106470_block_4);

(cr106470_state[(3)] = null);

return missionary.core.fork(cr106470_place_4,cr106470_place_12);
}catch (e106498){var cr106470_exception = e106498;
(cr106470_state[(0)] = cr106470_block_5);

(cr106470_state[(3)] = null);

(cr106470_state[(2)] = cr106470_exception);

return cr106470_state;
}});
var cr106470_block_1 = (function frontend$worker$rtc$core$get_remote_updates_$_cr106470_block_1(cr106470_state){
try{var cr106470_place_0 = get_ws_create_task;
(cr106470_state[(0)] = cr106470_block_2);

return missionary.core.park(cr106470_place_0);
}catch (e106506){var cr106470_exception = e106506;
(cr106470_state[(0)] = null);

throw cr106470_exception;
}});
var cr106470_block_4 = (function frontend$worker$rtc$core$get_remote_updates_$_cr106470_block_4(cr106470_state){
try{var cr106470_place_13 = missionary.core.unpark();
(cr106470_state[(0)] = cr106470_block_12);

(cr106470_state[(2)] = cr106470_place_13);

return cr106470_state;
}catch (e106507){var cr106470_exception = e106507;
(cr106470_state[(0)] = cr106470_block_5);

(cr106470_state[(2)] = cr106470_exception);

return cr106470_state;
}});
var cr106470_block_12 = (function frontend$worker$rtc$core$get_remote_updates_$_cr106470_block_12(cr106470_state){
try{var cr106470_place_3 = (cr106470_state[(1)]);
var cr106470_place_2 = (cr106470_state[(2)]);
var cr106470_place_25 = (cljs.core.truth_(cr106470_place_3)?(function(){throw cr106470_place_2})():cr106470_place_2);
var cr106470_place_26 = cr106470_place_25;
var cr106470_place_27 = frontend.worker.rtc.core.sentinel;
var cr106470_place_28 = (cr106470_place_26 === cr106470_place_27);
var cr106470_place_29 = null;
if(cr106470_place_28){
(cr106470_state[(0)] = cr106470_block_14);

(cr106470_state[(1)] = null);

(cr106470_state[(2)] = null);

return cr106470_state;
} else {
(cr106470_state[(0)] = cr106470_block_13);

(cr106470_state[(1)] = null);

(cr106470_state[(2)] = null);

(cr106470_state[(1)] = cr106470_place_25);

(cr106470_state[(2)] = cr106470_place_29);

return cr106470_state;
}
}catch (e106508){var cr106470_exception = e106508;
(cr106470_state[(0)] = null);

(cr106470_state[(1)] = null);

(cr106470_state[(2)] = null);

throw cr106470_exception;
}});
var cr106470_block_6 = (function frontend$worker$rtc$core$get_remote_updates_$_cr106470_block_6(cr106470_state){
try{var cr106470_place_18 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr106470_place_19 = null;
if(cljs.core.truth_(cr106470_place_18)){
(cr106470_state[(0)] = cr106470_block_8);

(cr106470_state[(3)] = null);

return cr106470_state;
} else {
(cr106470_state[(0)] = cr106470_block_7);

(cr106470_state[(4)] = cr106470_place_19);

return cr106470_state;
}
}catch (e106509){var cr106470_exception = e106509;
(cr106470_state[(0)] = cr106470_block_12);

(cr106470_state[(3)] = null);

(cr106470_state[(1)] = true);

(cr106470_state[(2)] = cr106470_exception);

return cr106470_state;
}});
var cr106470_block_5 = (function frontend$worker$rtc$core$get_remote_updates_$_cr106470_block_5(cr106470_state){
try{var cr106470_place_2 = (cr106470_state[(2)]);
var cr106470_place_14 = cr106470_place_2;
var cr106470_place_15 = CloseEvent;
var cr106470_place_16 = (cr106470_place_14 instanceof cr106470_place_15);
var cr106470_place_17 = null;
if(cr106470_place_16){
(cr106470_state[(0)] = cr106470_block_10);

(cr106470_state[(3)] = cr106470_place_17);

return cr106470_state;
} else {
(cr106470_state[(0)] = cr106470_block_6);

(cr106470_state[(3)] = cr106470_place_17);

return cr106470_state;
}
}catch (e106510){var cr106470_exception = e106510;
(cr106470_state[(0)] = cr106470_block_12);

(cr106470_state[(1)] = true);

(cr106470_state[(2)] = cr106470_exception);

return cr106470_state;
}});
var cr106470_block_13 = (function frontend$worker$rtc$core$get_remote_updates_$_cr106470_block_13(cr106470_state){
try{var cr106470_place_25 = (cr106470_state[(1)]);
var cr106470_place_30 = cr106470_place_25;
(cr106470_state[(0)] = cr106470_block_15);

(cr106470_state[(1)] = null);

(cr106470_state[(2)] = cr106470_place_30);

return cr106470_state;
}catch (e106511){var cr106470_exception = e106511;
(cr106470_state[(0)] = null);

(cr106470_state[(1)] = null);

(cr106470_state[(2)] = null);

throw cr106470_exception;
}});
var cr106470_block_15 = (function frontend$worker$rtc$core$get_remote_updates_$_cr106470_block_15(cr106470_state){
try{var cr106470_place_29 = (cr106470_state[(2)]);
(cr106470_state[(0)] = null);

(cr106470_state[(2)] = null);

return cr106470_place_29;
}catch (e106512){var cr106470_exception = e106512;
(cr106470_state[(0)] = null);

(cr106470_state[(2)] = null);

throw cr106470_exception;
}});
var cr106470_block_9 = (function frontend$worker$rtc$core$get_remote_updates_$_cr106470_block_9(cr106470_state){
try{var cr106470_place_19 = (cr106470_state[(4)]);
(cr106470_state[(0)] = cr106470_block_11);

(cr106470_state[(4)] = null);

(cr106470_state[(3)] = cr106470_place_19);

return cr106470_state;
}catch (e106513){var cr106470_exception = e106513;
(cr106470_state[(0)] = cr106470_block_12);

(cr106470_state[(4)] = null);

(cr106470_state[(3)] = null);

(cr106470_state[(1)] = true);

(cr106470_state[(2)] = cr106470_exception);

return cr106470_state;
}});
var cr106470_block_7 = (function frontend$worker$rtc$core$get_remote_updates_$_cr106470_block_7(cr106470_state){
try{var cr106470_place_20 = null;
(cr106470_state[(0)] = cr106470_block_9);

(cr106470_state[(4)] = cr106470_place_20);

return cr106470_state;
}catch (e106514){var cr106470_exception = e106514;
(cr106470_state[(0)] = cr106470_block_12);

(cr106470_state[(4)] = null);

(cr106470_state[(3)] = null);

(cr106470_state[(1)] = true);

(cr106470_state[(2)] = cr106470_exception);

return cr106470_state;
}});
var cr106470_block_14 = (function frontend$worker$rtc$core$get_remote_updates_$_cr106470_block_14(cr106470_state){
try{(cr106470_state[(0)] = cr106470_block_1);

return cr106470_state;
}catch (e106515){var cr106470_exception = e106515;
(cr106470_state[(0)] = null);

throw cr106470_exception;
}});
var cr106470_block_11 = (function frontend$worker$rtc$core$get_remote_updates_$_cr106470_block_11(cr106470_state){
try{var cr106470_place_17 = (cr106470_state[(3)]);
(cr106470_state[(0)] = cr106470_block_12);

(cr106470_state[(3)] = null);

(cr106470_state[(2)] = cr106470_place_17);

return cr106470_state;
}catch (e106516){var cr106470_exception = e106516;
(cr106470_state[(0)] = cr106470_block_12);

(cr106470_state[(3)] = null);

(cr106470_state[(1)] = true);

(cr106470_state[(2)] = cr106470_exception);

return cr106470_state;
}});
var cr106470_block_0 = (function frontend$worker$rtc$core$get_remote_updates_$_cr106470_block_0(cr106470_state){
try{(cr106470_state[(0)] = cr106470_block_1);

return cr106470_state;
}catch (e106517){var cr106470_exception = e106517;
(cr106470_state[(0)] = null);

throw cr106470_exception;
}});
var cr106470_block_2 = (function frontend$worker$rtc$core$get_remote_updates_$_cr106470_block_2(cr106470_state){
try{var cr106470_place_1 = missionary.core.unpark();
var cr106470_place_2 = null;
var cr106470_place_3 = false;
(cr106470_state[(0)] = cr106470_block_3);

(cr106470_state[(3)] = cr106470_place_1);

(cr106470_state[(2)] = cr106470_place_2);

(cr106470_state[(1)] = cr106470_place_3);

return cr106470_state;
}catch (e106518){var cr106470_exception = e106518;
(cr106470_state[(0)] = null);

throw cr106470_exception;
}});
return cloroutine.impl.coroutine((function (){var G__106519 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__106519[(0)] = cr106470_block_0);

return G__106519;
})());
})(),missionary.core.ap_run);
});
/**
 * Return a flow: emit if need to push local-updates
 */
frontend.worker.rtc.core.create_local_updates_check_flow = (function frontend$worker$rtc$core$create_local_updates_check_flow(repo,_STAR_auto_push_QMARK_,interval_ms){
var auto_push_flow = missionary.core.watch(_STAR_auto_push_QMARK_);
var clock_flow = frontend.common.missionary.clock.cljs$core$IFn$_invoke$arity$2(interval_ms,new cljs.core.Keyword(null,"clock","clock",-894301127));
var merge_flow = missionary.core.latest.cljs$core$IFn$_invoke$arity$variadic(cljs.core.vector,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([auto_push_flow,clock_flow], 0));
return missionary.core.eduction.cljs$core$IFn$_invoke$arity$variadic(cljs.core.filter.cljs$core$IFn$_invoke$arity$1(cljs.core.first),cljs.core.map.cljs$core$IFn$_invoke$arity$1(cljs.core.second),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (v){
if((frontend.worker.rtc.client_op.get_unpushed_block_ops_count(repo) > (0))){
return v;
} else {
return null;
}
})),merge_flow], 0));
});
/**
 * Return a flow: emit to pull remote-updates.
 *   reschedule next emit(INTERVAL-MS later) every time FLOW emit a value.
 */
frontend.worker.rtc.core.create_pull_remote_updates_flow = (function frontend$worker$rtc$core$create_pull_remote_updates_flow(interval_ms,flow){
var v = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"pull-remote-updates","pull-remote-updates",-472969758)], null);
var clock_flow = cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr106520_block_0 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106520_block_0(cr106520_state){
try{(cr106520_state[(0)] = cr106520_block_1);

return cr106520_state;
}catch (e106539){var cr106520_exception = e106539;
(cr106520_state[(0)] = null);

throw cr106520_exception;
}});
var cr106520_block_1 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106520_block_1(cr106520_state){
try{var cr106520_place_0 = (1);
var cr106520_place_1 = missionary.core.seed;
var cr106520_place_2 = cljs.core.range;
var cr106520_place_3 = (2);
var cr106520_place_4 = (function (){var G__106542 = cr106520_place_3;
var fexpr__106541 = cr106520_place_2;
return (fexpr__106541.cljs$core$IFn$_invoke$arity$1 ? fexpr__106541.cljs$core$IFn$_invoke$arity$1(G__106542) : fexpr__106541.call(null,G__106542));
})();
var cr106520_place_5 = (function (){var G__106544 = cr106520_place_4;
var fexpr__106543 = cr106520_place_1;
return (fexpr__106543.cljs$core$IFn$_invoke$arity$1 ? fexpr__106543.cljs$core$IFn$_invoke$arity$1(G__106544) : fexpr__106543.call(null,G__106544));
})();
(cr106520_state[(0)] = cr106520_block_2);

return missionary.core.fork(cr106520_place_0,cr106520_place_5);
}catch (e106540){var cr106520_exception = e106540;
(cr106520_state[(0)] = null);

throw cr106520_exception;
}});
var cr106520_block_2 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106520_block_2(cr106520_state){
try{var cr106520_place_6 = missionary.core.unpark();
var cr106520_place_7 = cr106520_place_6;
var cr106520_place_8 = null;
var G__106546 = cr106520_place_7;
switch (G__106546) {
case (0):
(cr106520_state[(0)] = cr106520_block_3);

(cr106520_state[(1)] = cr106520_place_8);

return cr106520_state;

break;
case (1):
(cr106520_state[(0)] = cr106520_block_5);

return cr106520_state;

break;
default:
(cr106520_state[(0)] = cr106520_block_6);

(cr106520_state[(1)] = cr106520_place_6);

return cr106520_state;

}
}catch (e106545){var cr106520_exception = e106545;
(cr106520_state[(0)] = null);

throw cr106520_exception;
}});
var cr106520_block_3 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106520_block_3(cr106520_state){
try{var cr106520_place_9 = missionary.core.sleep;
var cr106520_place_10 = interval_ms;
var cr106520_place_11 = v;
var cr106520_place_12 = (function (){var G__106549 = cr106520_place_10;
var G__106550 = cr106520_place_11;
var fexpr__106548 = cr106520_place_9;
return (fexpr__106548.cljs$core$IFn$_invoke$arity$2 ? fexpr__106548.cljs$core$IFn$_invoke$arity$2(G__106549,G__106550) : fexpr__106548.call(null,G__106549,G__106550));
})();
(cr106520_state[(0)] = cr106520_block_4);

return missionary.core.park(cr106520_place_12);
}catch (e106547){var cr106520_exception = e106547;
(cr106520_state[(0)] = null);

(cr106520_state[(1)] = null);

throw cr106520_exception;
}});
var cr106520_block_4 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106520_block_4(cr106520_state){
try{var cr106520_place_13 = missionary.core.unpark();
(cr106520_state[(0)] = cr106520_block_7);

(cr106520_state[(1)] = cr106520_place_13);

return cr106520_state;
}catch (e106551){var cr106520_exception = e106551;
(cr106520_state[(0)] = null);

(cr106520_state[(1)] = null);

throw cr106520_exception;
}});
var cr106520_block_5 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106520_block_5(cr106520_state){
try{(cr106520_state[(0)] = cr106520_block_1);

return cr106520_state;
}catch (e106552){var cr106520_exception = e106552;
(cr106520_state[(0)] = null);

throw cr106520_exception;
}});
var cr106520_block_6 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106520_block_6(cr106520_state){
try{var cr106520_place_6 = (cr106520_state[(1)]);
var cr106520_place_14 = "No matching clause: ";
var cr106520_place_15 = cr106520_place_6;
var cr106520_place_16 = [cr106520_place_14,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr106520_place_15)].join('');
var cr106520_place_17 = (new Error(cr106520_place_16));
var cr106520_place_18 = (function(){throw cr106520_place_17})();
(cr106520_state[(0)] = null);

(cr106520_state[(1)] = null);

return null;
}catch (e106553){var cr106520_exception = e106553;
(cr106520_state[(0)] = null);

(cr106520_state[(1)] = null);

throw cr106520_exception;
}});
var cr106520_block_7 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106520_block_7(cr106520_state){
try{var cr106520_place_8 = (cr106520_state[(1)]);
(cr106520_state[(0)] = null);

(cr106520_state[(1)] = null);

return cr106520_place_8;
}catch (e106554){var cr106520_exception = e106554;
(cr106520_state[(0)] = null);

(cr106520_state[(1)] = null);

throw cr106520_exception;
}});
return cloroutine.impl.coroutine((function (){var G__106555 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((2));
(G__106555[(0)] = cr106520_block_0);

return G__106555;
})());
})(),missionary.core.ap_run);
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr106556_block_6 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106556_block_6(cr106556_state){
try{var cr106556_place_17 = missionary.core.unpark();
(cr106556_state[(0)] = cr106556_block_15);

(cr106556_state[(2)] = cr106556_place_17);

return cr106556_state;
}catch (e106584){var cr106556_exception = e106584;
(cr106556_state[(0)] = cr106556_block_7);

(cr106556_state[(2)] = cr106556_exception);

return cr106556_state;
}});
var cr106556_block_2 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106556_block_2(cr106556_state){
try{var cr106556_place_9 = v;
(cr106556_state[(0)] = cr106556_block_17);

(cr106556_state[(1)] = cr106556_place_9);

return cr106556_state;
}catch (e106585){var cr106556_exception = e106585;
(cr106556_state[(0)] = null);

(cr106556_state[(1)] = null);

throw cr106556_exception;
}});
var cr106556_block_8 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106556_block_8(cr106556_state){
try{var cr106556_place_22 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr106556_place_23 = null;
if(cljs.core.truth_(cr106556_place_22)){
(cr106556_state[(0)] = cr106556_block_10);

(cr106556_state[(4)] = null);

return cr106556_state;
} else {
(cr106556_state[(0)] = cr106556_block_9);

(cr106556_state[(5)] = cr106556_place_23);

return cr106556_state;
}
}catch (e106586){var cr106556_exception = e106586;
(cr106556_state[(0)] = cr106556_block_15);

(cr106556_state[(4)] = null);

(cr106556_state[(3)] = true);

(cr106556_state[(2)] = cr106556_exception);

return cr106556_state;
}});
var cr106556_block_12 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106556_block_12(cr106556_state){
try{var cr106556_place_14 = (cr106556_state[(2)]);
var cr106556_place_27 = cr106556_place_14;
var cr106556_place_28 = (1);
var cr106556_place_29 = missionary.core.none;
(cr106556_state[(0)] = cr106556_block_13);

return missionary.core.fork(cr106556_place_28,cr106556_place_29);
}catch (e106587){var cr106556_exception = e106587;
(cr106556_state[(0)] = cr106556_block_15);

(cr106556_state[(4)] = null);

(cr106556_state[(3)] = true);

(cr106556_state[(2)] = cr106556_exception);

return cr106556_state;
}});
var cr106556_block_15 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106556_block_15(cr106556_state){
try{var cr106556_place_14 = (cr106556_state[(2)]);
var cr106556_place_15 = (cr106556_state[(3)]);
var cr106556_place_31 = (cljs.core.truth_(cr106556_place_15)?(function(){throw cr106556_place_14})():cr106556_place_14);
(cr106556_state[(0)] = cr106556_block_17);

(cr106556_state[(2)] = null);

(cr106556_state[(3)] = null);

(cr106556_state[(1)] = cr106556_place_31);

return cr106556_state;
}catch (e106588){var cr106556_exception = e106588;
(cr106556_state[(0)] = null);

(cr106556_state[(2)] = null);

(cr106556_state[(1)] = null);

(cr106556_state[(3)] = null);

throw cr106556_exception;
}});
var cr106556_block_13 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106556_block_13(cr106556_state){
try{var cr106556_place_30 = missionary.core.unpark();
(cr106556_state[(0)] = cr106556_block_14);

(cr106556_state[(4)] = cr106556_place_30);

return cr106556_state;
}catch (e106589){var cr106556_exception = e106589;
(cr106556_state[(0)] = cr106556_block_15);

(cr106556_state[(4)] = null);

(cr106556_state[(3)] = true);

(cr106556_state[(2)] = cr106556_exception);

return cr106556_state;
}});
var cr106556_block_4 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106556_block_4(cr106556_state){
try{var cr106556_place_13 = missionary.core.unpark();
var cr106556_place_14 = null;
var cr106556_place_15 = false;
(cr106556_state[(0)] = cr106556_block_5);

(cr106556_state[(2)] = cr106556_place_14);

(cr106556_state[(3)] = cr106556_place_15);

return cr106556_state;
}catch (e106590){var cr106556_exception = e106590;
(cr106556_state[(0)] = null);

(cr106556_state[(1)] = null);

throw cr106556_exception;
}});
var cr106556_block_16 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106556_block_16(cr106556_state){
try{var cr106556_place_6 = (cr106556_state[(1)]);
var cr106556_place_32 = "No matching clause: ";
var cr106556_place_33 = cr106556_place_6;
var cr106556_place_34 = [cr106556_place_32,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr106556_place_33)].join('');
var cr106556_place_35 = (new Error(cr106556_place_34));
var cr106556_place_36 = (function(){throw cr106556_place_35})();
(cr106556_state[(0)] = null);

(cr106556_state[(1)] = null);

return null;
}catch (e106591){var cr106556_exception = e106591;
(cr106556_state[(0)] = null);

(cr106556_state[(1)] = null);

throw cr106556_exception;
}});
var cr106556_block_7 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106556_block_7(cr106556_state){
try{var cr106556_place_14 = (cr106556_state[(2)]);
var cr106556_place_18 = cr106556_place_14;
var cr106556_place_19 = missionary.Cancelled;
var cr106556_place_20 = (cr106556_place_18 instanceof cr106556_place_19);
var cr106556_place_21 = null;
if(cr106556_place_20){
(cr106556_state[(0)] = cr106556_block_12);

(cr106556_state[(4)] = cr106556_place_21);

return cr106556_state;
} else {
(cr106556_state[(0)] = cr106556_block_8);

(cr106556_state[(4)] = cr106556_place_21);

return cr106556_state;
}
}catch (e106592){var cr106556_exception = e106592;
(cr106556_state[(0)] = cr106556_block_15);

(cr106556_state[(3)] = true);

(cr106556_state[(2)] = cr106556_exception);

return cr106556_state;
}});
var cr106556_block_1 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106556_block_1(cr106556_state){
try{var cr106556_place_6 = missionary.core.unpark();
var cr106556_place_7 = cr106556_place_6;
var cr106556_place_8 = null;
var G__106594 = cr106556_place_7;
switch (G__106594) {
case (0):
(cr106556_state[(0)] = cr106556_block_2);

(cr106556_state[(1)] = cr106556_place_8);

return cr106556_state;

break;
case (1):
(cr106556_state[(0)] = cr106556_block_3);

(cr106556_state[(1)] = cr106556_place_8);

return cr106556_state;

break;
default:
(cr106556_state[(0)] = cr106556_block_16);

(cr106556_state[(1)] = cr106556_place_6);

return cr106556_state;

}
}catch (e106593){var cr106556_exception = e106593;
(cr106556_state[(0)] = null);

throw cr106556_exception;
}});
var cr106556_block_10 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106556_block_10(cr106556_state){
try{var cr106556_place_14 = (cr106556_state[(2)]);
var cr106556_place_25 = cr106556_place_14;
var cr106556_place_26 = (function(){throw cr106556_place_25})();
(cr106556_state[(0)] = null);

(cr106556_state[(2)] = null);

(cr106556_state[(1)] = null);

(cr106556_state[(3)] = null);

return null;
}catch (e106595){var cr106556_exception = e106595;
(cr106556_state[(0)] = cr106556_block_15);

(cr106556_state[(3)] = true);

(cr106556_state[(2)] = cr106556_exception);

return cr106556_state;
}});
var cr106556_block_9 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106556_block_9(cr106556_state){
try{var cr106556_place_24 = null;
(cr106556_state[(0)] = cr106556_block_11);

(cr106556_state[(5)] = cr106556_place_24);

return cr106556_state;
}catch (e106596){var cr106556_exception = e106596;
(cr106556_state[(0)] = cr106556_block_15);

(cr106556_state[(5)] = null);

(cr106556_state[(4)] = null);

(cr106556_state[(3)] = true);

(cr106556_state[(2)] = cr106556_exception);

return cr106556_state;
}});
var cr106556_block_3 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106556_block_3(cr106556_state){
try{var cr106556_place_10 = frontend.common.missionary.continue_flow;
var cr106556_place_11 = flow;
var cr106556_place_12 = (function (){var G__106599 = cr106556_place_11;
var fexpr__106598 = cr106556_place_10;
return (fexpr__106598.cljs$core$IFn$_invoke$arity$1 ? fexpr__106598.cljs$core$IFn$_invoke$arity$1(G__106599) : fexpr__106598.call(null,G__106599));
})();
(cr106556_state[(0)] = cr106556_block_4);

return missionary.core.switch$(cr106556_place_12);
}catch (e106597){var cr106556_exception = e106597;
(cr106556_state[(0)] = null);

(cr106556_state[(1)] = null);

throw cr106556_exception;
}});
var cr106556_block_0 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106556_block_0(cr106556_state){
try{var cr106556_place_0 = (1);
var cr106556_place_1 = missionary.core.seed;
var cr106556_place_2 = cljs.core.range;
var cr106556_place_3 = (2);
var cr106556_place_4 = (function (){var G__106602 = cr106556_place_3;
var fexpr__106601 = cr106556_place_2;
return (fexpr__106601.cljs$core$IFn$_invoke$arity$1 ? fexpr__106601.cljs$core$IFn$_invoke$arity$1(G__106602) : fexpr__106601.call(null,G__106602));
})();
var cr106556_place_5 = (function (){var G__106604 = cr106556_place_4;
var fexpr__106603 = cr106556_place_1;
return (fexpr__106603.cljs$core$IFn$_invoke$arity$1 ? fexpr__106603.cljs$core$IFn$_invoke$arity$1(G__106604) : fexpr__106603.call(null,G__106604));
})();
(cr106556_state[(0)] = cr106556_block_1);

return missionary.core.fork(cr106556_place_0,cr106556_place_5);
}catch (e106600){var cr106556_exception = e106600;
(cr106556_state[(0)] = null);

throw cr106556_exception;
}});
var cr106556_block_14 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106556_block_14(cr106556_state){
try{var cr106556_place_21 = (cr106556_state[(4)]);
(cr106556_state[(0)] = cr106556_block_15);

(cr106556_state[(4)] = null);

(cr106556_state[(2)] = cr106556_place_21);

return cr106556_state;
}catch (e106605){var cr106556_exception = e106605;
(cr106556_state[(0)] = cr106556_block_15);

(cr106556_state[(4)] = null);

(cr106556_state[(3)] = true);

(cr106556_state[(2)] = cr106556_exception);

return cr106556_state;
}});
var cr106556_block_17 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106556_block_17(cr106556_state){
try{var cr106556_place_8 = (cr106556_state[(1)]);
(cr106556_state[(0)] = null);

(cr106556_state[(1)] = null);

return cr106556_place_8;
}catch (e106606){var cr106556_exception = e106606;
(cr106556_state[(0)] = null);

(cr106556_state[(1)] = null);

throw cr106556_exception;
}});
var cr106556_block_11 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106556_block_11(cr106556_state){
try{var cr106556_place_23 = (cr106556_state[(5)]);
(cr106556_state[(0)] = cr106556_block_14);

(cr106556_state[(5)] = null);

(cr106556_state[(4)] = cr106556_place_23);

return cr106556_state;
}catch (e106607){var cr106556_exception = e106607;
(cr106556_state[(0)] = cr106556_block_15);

(cr106556_state[(5)] = null);

(cr106556_state[(4)] = null);

(cr106556_state[(3)] = true);

(cr106556_state[(2)] = cr106556_exception);

return cr106556_state;
}});
var cr106556_block_5 = (function frontend$worker$rtc$core$create_pull_remote_updates_flow_$_cr106556_block_5(cr106556_state){
try{var cr106556_place_16 = clock_flow;
(cr106556_state[(0)] = cr106556_block_6);

return missionary.core.switch$(cr106556_place_16);
}catch (e106608){var cr106556_exception = e106608;
(cr106556_state[(0)] = cr106556_block_7);

(cr106556_state[(2)] = cr106556_exception);

return cr106556_state;
}});
return cloroutine.impl.coroutine((function (){var G__106609 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((6));
(G__106609[(0)] = cr106556_block_0);

return G__106609;
})());
})(),missionary.core.ap_run);
});
/**
 * Return a flow: emit event if need to notify the server to inject users-info to graph.
 */
frontend.worker.rtc.core.create_inject_users_info_flow = (function frontend$worker$rtc$core$create_inject_users_info_flow(repo,online_users_updated_flow){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr106610_block_20 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_20(cr106610_state){
try{var cr106610_place_15 = (cr106610_state[(2)]);
(cr106610_state[(0)] = cr106610_block_21);

(cr106610_state[(2)] = null);

(cr106610_state[(1)] = cr106610_place_15);

return cr106610_state;
}catch (e106677){var cr106610_exception = e106677;
(cr106610_state[(0)] = null);

(cr106610_state[(1)] = null);

(cr106610_state[(2)] = null);

throw cr106610_exception;
}});
var cr106610_block_21 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_21(cr106610_state){
try{var cr106610_place_4 = (cr106610_state[(1)]);
(cr106610_state[(0)] = null);

(cr106610_state[(1)] = null);

return cr106610_place_4;
}catch (e106678){var cr106610_exception = e106678;
(cr106610_state[(0)] = null);

(cr106610_state[(1)] = null);

throw cr106610_exception;
}});
var cr106610_block_11 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_11(cr106610_state){
try{var cr106610_place_52 = (1);
var cr106610_place_53 = missionary.core.none;
(cr106610_state[(0)] = cr106610_block_12);

return missionary.core.fork(cr106610_place_52,cr106610_place_53);
}catch (e106679){var cr106610_exception = e106679;
(cr106610_state[(0)] = null);

(cr106610_state[(1)] = null);

(cr106610_state[(2)] = null);

(cr106610_state[(3)] = null);

throw cr106610_exception;
}});
var cr106610_block_0 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_0(cr106610_state){
try{var cr106610_place_0 = frontend.worker.state.get_datascript_conn;
var cr106610_place_1 = repo;
var cr106610_place_2 = (function (){var G__106682 = cr106610_place_1;
var fexpr__106681 = cr106610_place_0;
return (fexpr__106681.cljs$core$IFn$_invoke$arity$1 ? fexpr__106681.cljs$core$IFn$_invoke$arity$1(G__106682) : fexpr__106681.call(null,G__106682));
})();
var cr106610_place_3 = cr106610_place_2;
var cr106610_place_4 = null;
if(cljs.core.truth_(cr106610_place_3)){
(cr106610_state[(0)] = cr106610_block_3);

(cr106610_state[(2)] = cr106610_place_2);

(cr106610_state[(1)] = cr106610_place_4);

return cr106610_state;
} else {
(cr106610_state[(0)] = cr106610_block_1);

(cr106610_state[(1)] = cr106610_place_4);

return cr106610_state;
}
}catch (e106680){var cr106610_exception = e106680;
(cr106610_state[(0)] = null);

throw cr106610_exception;
}});
var cr106610_block_2 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_2(cr106610_state){
try{var cr106610_place_7 = missionary.core.unpark();
(cr106610_state[(0)] = cr106610_block_21);

(cr106610_state[(1)] = cr106610_place_7);

return cr106610_state;
}catch (e106683){var cr106610_exception = e106683;
(cr106610_state[(0)] = null);

(cr106610_state[(1)] = null);

throw cr106610_exception;
}});
var cr106610_block_12 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_12(cr106610_state){
try{var cr106610_place_54 = missionary.core.unpark();
(cr106610_state[(0)] = cr106610_block_19);

(cr106610_state[(3)] = cr106610_place_54);

return cr106610_state;
}catch (e106684){var cr106610_exception = e106684;
(cr106610_state[(0)] = null);

(cr106610_state[(1)] = null);

(cr106610_state[(2)] = null);

(cr106610_state[(3)] = null);

throw cr106610_exception;
}});
var cr106610_block_3 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_3(cr106610_state){
try{var cr106610_place_2 = (cr106610_state[(2)]);
var cr106610_place_8 = cr106610_place_2;
var cr106610_place_9 = cljs.core.seq;
var cr106610_place_10 = (1);
var cr106610_place_11 = online_users_updated_flow;
(cr106610_state[(0)] = cr106610_block_4);

(cr106610_state[(2)] = null);

(cr106610_state[(3)] = cr106610_place_8);

(cr106610_state[(2)] = cr106610_place_9);

return missionary.core.fork(cr106610_place_10,cr106610_place_11);
}catch (e106685){var cr106610_exception = e106685;
(cr106610_state[(0)] = null);

(cr106610_state[(1)] = null);

(cr106610_state[(2)] = null);

throw cr106610_exception;
}});
var cr106610_block_14 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_14(cr106610_state){
try{var cr106610_place_61 = missionary.core.unpark();
var cr106610_place_62 = cr106610_place_61;
var cr106610_place_63 = null;
var G__106687 = cr106610_place_62;
switch (G__106687) {
case (0):
(cr106610_state[(0)] = cr106610_block_15);

(cr106610_state[(4)] = cr106610_place_63);

return cr106610_state;

break;
case (1):
(cr106610_state[(0)] = cr106610_block_16);

(cr106610_state[(4)] = cr106610_place_63);

return cr106610_state;

break;
default:
(cr106610_state[(0)] = cr106610_block_17);

(cr106610_state[(1)] = null);

(cr106610_state[(2)] = null);

(cr106610_state[(3)] = null);

(cr106610_state[(1)] = cr106610_place_61);

return cr106610_state;

}
}catch (e106686){var cr106610_exception = e106686;
(cr106610_state[(0)] = null);

(cr106610_state[(1)] = null);

(cr106610_state[(2)] = null);

(cr106610_state[(3)] = null);

throw cr106610_exception;
}});
var cr106610_block_6 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_6(cr106610_state){
try{var cr106610_place_18 = missionary.core.unpark();
(cr106610_state[(0)] = cr106610_block_20);

(cr106610_state[(2)] = cr106610_place_18);

return cr106610_state;
}catch (e106688){var cr106610_exception = e106688;
(cr106610_state[(0)] = null);

(cr106610_state[(1)] = null);

(cr106610_state[(2)] = null);

throw cr106610_exception;
}});
var cr106610_block_15 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_15(cr106610_state){
try{var cr106610_place_64 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr106610_place_65 = new cljs.core.Keyword(null,"inject-users-info","inject-users-info",-1403385625);
var cr106610_place_66 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr106610_place_64,cr106610_place_65]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
(cr106610_state[(0)] = cr106610_block_18);

(cr106610_state[(4)] = cr106610_place_66);

return cr106610_state;
}catch (e106689){var cr106610_exception = e106689;
(cr106610_state[(0)] = null);

(cr106610_state[(4)] = null);

(cr106610_state[(1)] = null);

(cr106610_state[(2)] = null);

(cr106610_state[(3)] = null);

throw cr106610_exception;
}});
var cr106610_block_5 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_5(cr106610_state){
try{var cr106610_place_16 = (1);
var cr106610_place_17 = missionary.core.none;
(cr106610_state[(0)] = cr106610_block_6);

return missionary.core.fork(cr106610_place_16,cr106610_place_17);
}catch (e106690){var cr106610_exception = e106690;
(cr106610_state[(0)] = null);

(cr106610_state[(1)] = null);

(cr106610_state[(2)] = null);

throw cr106610_exception;
}});
var cr106610_block_1 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_1(cr106610_state){
try{var cr106610_place_5 = (1);
var cr106610_place_6 = missionary.core.none;
(cr106610_state[(0)] = cr106610_block_2);

return missionary.core.fork(cr106610_place_5,cr106610_place_6);
}catch (e106691){var cr106610_exception = e106691;
(cr106610_state[(0)] = null);

(cr106610_state[(1)] = null);

throw cr106610_exception;
}});
var cr106610_block_18 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_18(cr106610_state){
try{var cr106610_place_63 = (cr106610_state[(4)]);
(cr106610_state[(0)] = cr106610_block_19);

(cr106610_state[(4)] = null);

(cr106610_state[(3)] = cr106610_place_63);

return cr106610_state;
}catch (e106692){var cr106610_exception = e106692;
(cr106610_state[(0)] = null);

(cr106610_state[(4)] = null);

(cr106610_state[(1)] = null);

(cr106610_state[(2)] = null);

(cr106610_state[(3)] = null);

throw cr106610_exception;
}});
var cr106610_block_9 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_9(cr106610_state){
try{var cr106610_place_43 = (cr106610_state[(3)]);
var cr106610_place_50 = cr106610_place_43;
(cr106610_state[(0)] = cr106610_block_10);

(cr106610_state[(3)] = null);

(cr106610_state[(5)] = cr106610_place_50);

return cr106610_state;
}catch (e106693){var cr106610_exception = e106693;
(cr106610_state[(0)] = null);

(cr106610_state[(3)] = null);

(cr106610_state[(1)] = null);

(cr106610_state[(2)] = null);

(cr106610_state[(5)] = null);

throw cr106610_exception;
}});
var cr106610_block_16 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_16(cr106610_state){
try{var cr106610_place_67 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr106610_place_68 = new cljs.core.Keyword(null,"pull-remote-updates","pull-remote-updates",-472969758);
var cr106610_place_69 = new cljs.core.Keyword(null,"from","from",1815293044);
var cr106610_place_70 = new cljs.core.Keyword(null,"x","x",2099068185);
var cr106610_place_71 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr106610_place_67,cr106610_place_68,cr106610_place_69,cr106610_place_70]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
(cr106610_state[(0)] = cr106610_block_18);

(cr106610_state[(4)] = cr106610_place_71);

return cr106610_state;
}catch (e106694){var cr106610_exception = e106694;
(cr106610_state[(0)] = null);

(cr106610_state[(4)] = null);

(cr106610_state[(1)] = null);

(cr106610_state[(2)] = null);

(cr106610_state[(3)] = null);

throw cr106610_exception;
}});
var cr106610_block_17 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_17(cr106610_state){
try{var cr106610_place_61 = (cr106610_state[(1)]);
var cr106610_place_72 = "No matching clause: ";
var cr106610_place_73 = cr106610_place_61;
var cr106610_place_74 = [cr106610_place_72,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr106610_place_73)].join('');
var cr106610_place_75 = (new Error(cr106610_place_74));
var cr106610_place_76 = (function(){throw cr106610_place_75})();
(cr106610_state[(0)] = null);

(cr106610_state[(1)] = null);

return null;
}catch (e106695){var cr106610_exception = e106695;
(cr106610_state[(0)] = null);

(cr106610_state[(1)] = null);

throw cr106610_exception;
}});
var cr106610_block_10 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_10(cr106610_state){
try{var cr106610_place_45 = (cr106610_state[(5)]);
var cr106610_place_51 = null;
if(cljs.core.truth_(cr106610_place_45)){
(cr106610_state[(0)] = cr106610_block_13);

(cr106610_state[(5)] = null);

(cr106610_state[(3)] = cr106610_place_51);

return cr106610_state;
} else {
(cr106610_state[(0)] = cr106610_block_11);

(cr106610_state[(5)] = null);

(cr106610_state[(3)] = cr106610_place_51);

return cr106610_state;
}
}catch (e106696){var cr106610_exception = e106696;
(cr106610_state[(0)] = null);

(cr106610_state[(1)] = null);

(cr106610_state[(2)] = null);

(cr106610_state[(5)] = null);

throw cr106610_exception;
}});
var cr106610_block_4 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_4(cr106610_state){
try{var cr106610_place_9 = (cr106610_state[(2)]);
var cr106610_place_12 = missionary.core.unpark();
var cr106610_place_13 = (function (){var G__106699 = cr106610_place_12;
var fexpr__106698 = cr106610_place_9;
return (fexpr__106698.cljs$core$IFn$_invoke$arity$1 ? fexpr__106698.cljs$core$IFn$_invoke$arity$1(G__106699) : fexpr__106698.call(null,G__106699));
})();
var cr106610_place_14 = cr106610_place_13;
var cr106610_place_15 = null;
if(cr106610_place_14){
(cr106610_state[(0)] = cr106610_block_7);

(cr106610_state[(2)] = null);

(cr106610_state[(4)] = cr106610_place_13);

(cr106610_state[(2)] = cr106610_place_15);

return cr106610_state;
} else {
(cr106610_state[(0)] = cr106610_block_5);

(cr106610_state[(2)] = null);

(cr106610_state[(3)] = null);

(cr106610_state[(2)] = cr106610_place_15);

return cr106610_state;
}
}catch (e106697){var cr106610_exception = e106697;
(cr106610_state[(0)] = null);

(cr106610_state[(1)] = null);

(cr106610_state[(2)] = null);

(cr106610_state[(3)] = null);

throw cr106610_exception;
}});
var cr106610_block_19 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_19(cr106610_state){
try{var cr106610_place_51 = (cr106610_state[(3)]);
(cr106610_state[(0)] = cr106610_block_20);

(cr106610_state[(3)] = null);

(cr106610_state[(2)] = cr106610_place_51);

return cr106610_state;
}catch (e106700){var cr106610_exception = e106700;
(cr106610_state[(0)] = null);

(cr106610_state[(1)] = null);

(cr106610_state[(2)] = null);

(cr106610_state[(3)] = null);

throw cr106610_exception;
}});
var cr106610_block_7 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_7(cr106610_state){
try{var cr106610_place_13 = (cr106610_state[(4)]);
var cr106610_place_8 = (cr106610_state[(3)]);
var cr106610_place_19 = cr106610_place_13;
var cr106610_place_20 = cljs.core.into;
var cr106610_place_21 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr106610_place_22 = cljs.core.map;
var cr106610_place_23 = cljs.core.juxt;
var cr106610_place_24 = new cljs.core.Keyword("user","uuid","user/uuid",2146253734);
var cr106610_place_25 = cljs.core.identity;
var cr106610_place_26 = (function (){var G__106703 = cr106610_place_24;
var G__106704 = cr106610_place_25;
var fexpr__106702 = cr106610_place_23;
return (fexpr__106702.cljs$core$IFn$_invoke$arity$2 ? fexpr__106702.cljs$core$IFn$_invoke$arity$2(G__106703,G__106704) : fexpr__106702.call(null,G__106703,G__106704));
})();
var cr106610_place_27 = cr106610_place_19;
var cr106610_place_28 = (function (){var G__106706 = cr106610_place_26;
var G__106707 = cr106610_place_27;
var fexpr__106705 = cr106610_place_22;
return (fexpr__106705.cljs$core$IFn$_invoke$arity$2 ? fexpr__106705.cljs$core$IFn$_invoke$arity$2(G__106706,G__106707) : fexpr__106705.call(null,G__106706,G__106707));
})();
var cr106610_place_29 = (function (){var G__106709 = cr106610_place_21;
var G__106710 = cr106610_place_28;
var fexpr__106708 = cr106610_place_20;
return (fexpr__106708.cljs$core$IFn$_invoke$arity$2 ? fexpr__106708.cljs$core$IFn$_invoke$arity$2(G__106709,G__106710) : fexpr__106708.call(null,G__106709,G__106710));
})();
var cr106610_place_30 = cljs.core.keep;
var cr106610_place_31 = (function (user_uuid){
var G__106611 = cljs.core.deref(cr106610_place_8);
var G__106612 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),user_uuid], null);
var G__106711 = G__106611;
var G__106712 = G__106612;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__106711,G__106712) : datascript.core.entity.call(null,G__106711,G__106712));
});
var cr106610_place_32 = cljs.core.keys;
var cr106610_place_33 = cr106610_place_29;
var cr106610_place_34 = (function (){var G__106714 = cr106610_place_33;
var fexpr__106713 = cr106610_place_32;
return (fexpr__106713.cljs$core$IFn$_invoke$arity$1 ? fexpr__106713.cljs$core$IFn$_invoke$arity$1(G__106714) : fexpr__106713.call(null,G__106714));
})();
var cr106610_place_35 = (function (){var G__106716 = cr106610_place_31;
var G__106717 = cr106610_place_34;
var fexpr__106715 = cr106610_place_30;
return (fexpr__106715.cljs$core$IFn$_invoke$arity$2 ? fexpr__106715.cljs$core$IFn$_invoke$arity$2(G__106716,G__106717) : fexpr__106715.call(null,G__106716,G__106717));
})();
var cr106610_place_36 = cljs.core.not_EQ_;
var cr106610_place_37 = cljs.core.count;
var cr106610_place_38 = cr106610_place_35;
var cr106610_place_39 = (function (){var G__106719 = cr106610_place_38;
var fexpr__106718 = cr106610_place_37;
return (fexpr__106718.cljs$core$IFn$_invoke$arity$1 ? fexpr__106718.cljs$core$IFn$_invoke$arity$1(G__106719) : fexpr__106718.call(null,G__106719));
})();
var cr106610_place_40 = cljs.core.count;
var cr106610_place_41 = cr106610_place_29;
var cr106610_place_42 = (function (){var G__106721 = cr106610_place_41;
var fexpr__106720 = cr106610_place_40;
return (fexpr__106720.cljs$core$IFn$_invoke$arity$1 ? fexpr__106720.cljs$core$IFn$_invoke$arity$1(G__106721) : fexpr__106720.call(null,G__106721));
})();
var cr106610_place_43 = (function (){var G__106723 = cr106610_place_39;
var G__106724 = cr106610_place_42;
var fexpr__106722 = cr106610_place_36;
return (fexpr__106722.cljs$core$IFn$_invoke$arity$2 ? fexpr__106722.cljs$core$IFn$_invoke$arity$2(G__106723,G__106724) : fexpr__106722.call(null,G__106723,G__106724));
})();
var cr106610_place_44 = cr106610_place_43;
var cr106610_place_45 = null;
if(cr106610_place_44){
(cr106610_state[(0)] = cr106610_block_9);

(cr106610_state[(4)] = null);

(cr106610_state[(3)] = null);

(cr106610_state[(3)] = cr106610_place_43);

(cr106610_state[(5)] = cr106610_place_45);

return cr106610_state;
} else {
(cr106610_state[(0)] = cr106610_block_8);

(cr106610_state[(4)] = null);

(cr106610_state[(3)] = null);

(cr106610_state[(3)] = cr106610_place_29);

(cr106610_state[(4)] = cr106610_place_35);

(cr106610_state[(5)] = cr106610_place_45);

return cr106610_state;
}
}catch (e106701){var cr106610_exception = e106701;
(cr106610_state[(0)] = null);

(cr106610_state[(4)] = null);

(cr106610_state[(1)] = null);

(cr106610_state[(2)] = null);

(cr106610_state[(3)] = null);

throw cr106610_exception;
}});
var cr106610_block_8 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_8(cr106610_state){
try{var cr106610_place_29 = (cr106610_state[(3)]);
var cr106610_place_35 = (cr106610_state[(4)]);
var cr106610_place_46 = cljs.core.some;
var cr106610_place_47 = (function (user_block){
var user = (function (){var G__106616 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(user_block);
var G__106727 = G__106616;
var fexpr__106726 = cr106610_place_29;
return (fexpr__106726.cljs$core$IFn$_invoke$arity$1 ? fexpr__106726.cljs$core$IFn$_invoke$arity$1(G__106727) : fexpr__106726.call(null,G__106727));
})();
var vec__106613 = clojure.data.diff(cljs.core.select_keys(user_block,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.user","name","logseq.property.user/name",-1360026016),new cljs.core.Keyword("logseq.property.user","email","logseq.property.user/email",-1655206063),new cljs.core.Keyword("logseq.property.user","avatar","logseq.property.user/avatar",-416548858)], null)),cljs.core.update_keys(cljs.core.select_keys(user,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("user","name","user/name",1848814598),new cljs.core.Keyword("user","email","user/email",1419686391),new cljs.core.Keyword("user","avatar","user/avatar",-1612128612)], null)),(function (k){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("logseq.property.user",cljs.core.name(k));
})));
var diff_r1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106613,(0),null);
var diff_r2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106613,(1),null);
return ((cljs.core.not((diff_r1 == null))) || (cljs.core.not((diff_r2 == null))));
});
var cr106610_place_48 = cr106610_place_35;
var cr106610_place_49 = (function (){var G__106729 = cr106610_place_47;
var G__106730 = cr106610_place_48;
var fexpr__106728 = cr106610_place_46;
return (fexpr__106728.cljs$core$IFn$_invoke$arity$2 ? fexpr__106728.cljs$core$IFn$_invoke$arity$2(G__106729,G__106730) : fexpr__106728.call(null,G__106729,G__106730));
})();
(cr106610_state[(0)] = cr106610_block_10);

(cr106610_state[(3)] = null);

(cr106610_state[(4)] = null);

(cr106610_state[(5)] = cr106610_place_49);

return cr106610_state;
}catch (e106725){var cr106610_exception = e106725;
(cr106610_state[(0)] = null);

(cr106610_state[(3)] = null);

(cr106610_state[(4)] = null);

(cr106610_state[(1)] = null);

(cr106610_state[(2)] = null);

(cr106610_state[(5)] = null);

throw cr106610_exception;
}});
var cr106610_block_13 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr106610_block_13(cr106610_state){
try{var cr106610_place_55 = (1);
var cr106610_place_56 = missionary.core.seed;
var cr106610_place_57 = cljs.core.range;
var cr106610_place_58 = (2);
var cr106610_place_59 = (function (){var G__106733 = cr106610_place_58;
var fexpr__106732 = cr106610_place_57;
return (fexpr__106732.cljs$core$IFn$_invoke$arity$1 ? fexpr__106732.cljs$core$IFn$_invoke$arity$1(G__106733) : fexpr__106732.call(null,G__106733));
})();
var cr106610_place_60 = (function (){var G__106735 = cr106610_place_59;
var fexpr__106734 = cr106610_place_56;
return (fexpr__106734.cljs$core$IFn$_invoke$arity$1 ? fexpr__106734.cljs$core$IFn$_invoke$arity$1(G__106735) : fexpr__106734.call(null,G__106735));
})();
(cr106610_state[(0)] = cr106610_block_14);

return missionary.core.fork(cr106610_place_55,cr106610_place_60);
}catch (e106731){var cr106610_exception = e106731;
(cr106610_state[(0)] = null);

(cr106610_state[(1)] = null);

(cr106610_state[(2)] = null);

(cr106610_state[(3)] = null);

throw cr106610_exception;
}});
return cloroutine.impl.coroutine((function (){var G__106736 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((6));
(G__106736[(0)] = cr106610_block_0);

return G__106736;
})());
})(),missionary.core.ap_run);
});
/**
 * Return a flow that emits all kinds of events:
 *   `:remote-update`: remote-updates data from server
 *   `:remote-asset-update`: remote asset-updates from server
 *   `:local-update-check`: event to notify to check if there're some new local-updates, then push to remote.
 *   `:online-users-updated`: online users info updated
 *   `:pull-remote-updates`: pull remote updates
 *   `:inject-users-info`: notify server to inject users-info into the graph
 */
frontend.worker.rtc.core.create_mixed_flow = (function frontend$worker$rtc$core$create_mixed_flow(repo,get_ws_create_task,_STAR_auto_push_QMARK_,_STAR_online_users){
var remote_updates_flow = missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (data){
var G__106737 = new cljs.core.Keyword(null,"req-id","req-id",-471642231).cljs$core$IFn$_invoke$arity$1(data);
switch (G__106737) {
case "push-updates":
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"remote-update","remote-update",-34961368),new cljs.core.Keyword(null,"value","value",305978217),data], null);

break;
case "online-users-updated":
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"online-users-updated","online-users-updated",-1559239163),new cljs.core.Keyword(null,"value","value",305978217),data], null);

break;
case "push-asset-upload-updates":
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"remote-asset-update","remote-asset-update",614305002),new cljs.core.Keyword(null,"value","value",305978217),data], null);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__106737)].join('')));

}
})),frontend.worker.rtc.core.get_remote_updates(get_ws_create_task));
var local_updates_check_flow = missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (data){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"local-update-check","local-update-check",1658079099),new cljs.core.Keyword(null,"value","value",305978217),data], null);
})),frontend.worker.rtc.core.create_local_updates_check_flow(repo,_STAR_auto_push_QMARK_,(2000)));
var inject_user_info_flow = frontend.worker.rtc.core.create_inject_users_info_flow(repo,missionary.core.watch(_STAR_online_users));
var mix_flow = frontend.common.missionary.mix.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([remote_updates_flow,local_updates_check_flow,inject_user_info_flow], 0));
return frontend.common.missionary.mix.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([mix_flow,frontend.worker.rtc.core.create_pull_remote_updates_flow((60000),mix_flow)], 0));
});
frontend.worker.rtc.core.create_ws_state_flow = (function frontend$worker$rtc$core$create_ws_state_flow(_STAR_current_ws){
return missionary.core.relieve.cljs$core$IFn$_invoke$arity$1(cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr106738_block_5 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr106738_block_5(cr106738_state){
try{var cr106738_place_3 = (cr106738_state[(3)]);
var cr106738_place_11 = frontend.worker.rtc.ws.create_mws_state_flow;
var cr106738_place_12 = cr106738_place_3;
var cr106738_place_13 = (function (){var G__106763 = cr106738_place_12;
var fexpr__106762 = cr106738_place_11;
return (fexpr__106762.cljs$core$IFn$_invoke$arity$1 ? fexpr__106762.cljs$core$IFn$_invoke$arity$1(G__106763) : fexpr__106762.call(null,G__106763));
})();
(cr106738_state[(0)] = cr106738_block_6);

(cr106738_state[(3)] = null);

return missionary.core.switch$(cr106738_place_13);
}catch (e106761){var cr106738_exception = e106761;
(cr106738_state[(0)] = cr106738_block_8);

(cr106738_state[(4)] = null);

(cr106738_state[(3)] = null);

(cr106738_state[(2)] = cr106738_exception);

return cr106738_state;
}});
var cr106738_block_13 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr106738_block_13(cr106738_state){
try{var cr106738_place_4 = (cr106738_state[(2)]);
var cr106738_place_24 = cr106738_place_4;
var cr106738_place_25 = (1);
var cr106738_place_26 = missionary.core.none;
(cr106738_state[(0)] = cr106738_block_14);

return missionary.core.fork(cr106738_place_25,cr106738_place_26);
}catch (e106764){var cr106738_exception = e106764;
(cr106738_state[(0)] = cr106738_block_16);

(cr106738_state[(3)] = null);

(cr106738_state[(1)] = true);

(cr106738_state[(2)] = cr106738_exception);

return cr106738_state;
}});
var cr106738_block_16 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr106738_block_16(cr106738_state){
try{var cr106738_place_5 = (cr106738_state[(1)]);
var cr106738_place_4 = (cr106738_state[(2)]);
var cr106738_place_28 = (cljs.core.truth_(cr106738_place_5)?(function(){throw cr106738_place_4})():cr106738_place_4);
(cr106738_state[(0)] = null);

(cr106738_state[(1)] = null);

(cr106738_state[(2)] = null);

return cr106738_place_28;
}catch (e106765){var cr106738_exception = e106765;
(cr106738_state[(0)] = null);

(cr106738_state[(1)] = null);

(cr106738_state[(2)] = null);

throw cr106738_exception;
}});
var cr106738_block_15 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr106738_block_15(cr106738_state){
try{var cr106738_place_18 = (cr106738_state[(3)]);
(cr106738_state[(0)] = cr106738_block_16);

(cr106738_state[(3)] = null);

(cr106738_state[(2)] = cr106738_place_18);

return cr106738_state;
}catch (e106766){var cr106738_exception = e106766;
(cr106738_state[(0)] = cr106738_block_16);

(cr106738_state[(3)] = null);

(cr106738_state[(1)] = true);

(cr106738_state[(2)] = cr106738_exception);

return cr106738_state;
}});
var cr106738_block_10 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr106738_block_10(cr106738_state){
try{var cr106738_place_21 = null;
(cr106738_state[(0)] = cr106738_block_12);

(cr106738_state[(4)] = cr106738_place_21);

return cr106738_state;
}catch (e106767){var cr106738_exception = e106767;
(cr106738_state[(0)] = cr106738_block_16);

(cr106738_state[(3)] = null);

(cr106738_state[(4)] = null);

(cr106738_state[(1)] = true);

(cr106738_state[(2)] = cr106738_exception);

return cr106738_state;
}});
var cr106738_block_4 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr106738_block_4(cr106738_state){
try{var cr106738_place_10 = missionary.core.unpark();
(cr106738_state[(0)] = cr106738_block_7);

(cr106738_state[(4)] = cr106738_place_10);

return cr106738_state;
}catch (e106768){var cr106738_exception = e106768;
(cr106738_state[(0)] = cr106738_block_8);

(cr106738_state[(4)] = null);

(cr106738_state[(2)] = cr106738_exception);

return cr106738_state;
}});
var cr106738_block_6 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr106738_block_6(cr106738_state){
try{var cr106738_place_14 = missionary.core.unpark();
(cr106738_state[(0)] = cr106738_block_7);

(cr106738_state[(4)] = cr106738_place_14);

return cr106738_state;
}catch (e106769){var cr106738_exception = e106769;
(cr106738_state[(0)] = cr106738_block_8);

(cr106738_state[(4)] = null);

(cr106738_state[(2)] = cr106738_exception);

return cr106738_state;
}});
var cr106738_block_0 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr106738_block_0(cr106738_state){
try{var cr106738_place_0 = missionary.core.watch;
var cr106738_place_1 = _STAR_current_ws;
var cr106738_place_2 = (function (){var G__106772 = cr106738_place_1;
var fexpr__106771 = cr106738_place_0;
return (fexpr__106771.cljs$core$IFn$_invoke$arity$1 ? fexpr__106771.cljs$core$IFn$_invoke$arity$1(G__106772) : fexpr__106771.call(null,G__106772));
})();
(cr106738_state[(0)] = cr106738_block_1);

return missionary.core.switch$(cr106738_place_2);
}catch (e106770){var cr106738_exception = e106770;
(cr106738_state[(0)] = null);

throw cr106738_exception;
}});
var cr106738_block_8 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr106738_block_8(cr106738_state){
try{var cr106738_place_4 = (cr106738_state[(2)]);
var cr106738_place_15 = cr106738_place_4;
var cr106738_place_16 = missionary.Cancelled;
var cr106738_place_17 = (cr106738_place_15 instanceof cr106738_place_16);
var cr106738_place_18 = null;
if(cr106738_place_17){
(cr106738_state[(0)] = cr106738_block_13);

(cr106738_state[(3)] = cr106738_place_18);

return cr106738_state;
} else {
(cr106738_state[(0)] = cr106738_block_9);

(cr106738_state[(3)] = cr106738_place_18);

return cr106738_state;
}
}catch (e106773){var cr106738_exception = e106773;
(cr106738_state[(0)] = cr106738_block_16);

(cr106738_state[(1)] = true);

(cr106738_state[(2)] = cr106738_exception);

return cr106738_state;
}});
var cr106738_block_12 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr106738_block_12(cr106738_state){
try{var cr106738_place_20 = (cr106738_state[(4)]);
(cr106738_state[(0)] = cr106738_block_15);

(cr106738_state[(4)] = null);

(cr106738_state[(3)] = cr106738_place_20);

return cr106738_state;
}catch (e106774){var cr106738_exception = e106774;
(cr106738_state[(0)] = cr106738_block_16);

(cr106738_state[(3)] = null);

(cr106738_state[(4)] = null);

(cr106738_state[(1)] = true);

(cr106738_state[(2)] = cr106738_exception);

return cr106738_state;
}});
var cr106738_block_1 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr106738_block_1(cr106738_state){
try{var cr106738_place_3 = missionary.core.unpark();
var cr106738_place_4 = null;
var cr106738_place_5 = false;
(cr106738_state[(0)] = cr106738_block_2);

(cr106738_state[(3)] = cr106738_place_3);

(cr106738_state[(2)] = cr106738_place_4);

(cr106738_state[(1)] = cr106738_place_5);

return cr106738_state;
}catch (e106775){var cr106738_exception = e106775;
(cr106738_state[(0)] = null);

throw cr106738_exception;
}});
var cr106738_block_7 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr106738_block_7(cr106738_state){
try{var cr106738_place_7 = (cr106738_state[(4)]);
(cr106738_state[(0)] = cr106738_block_16);

(cr106738_state[(4)] = null);

(cr106738_state[(2)] = cr106738_place_7);

return cr106738_state;
}catch (e106776){var cr106738_exception = e106776;
(cr106738_state[(0)] = cr106738_block_8);

(cr106738_state[(4)] = null);

(cr106738_state[(2)] = cr106738_exception);

return cr106738_state;
}});
var cr106738_block_3 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr106738_block_3(cr106738_state){
try{var cr106738_place_8 = (1);
var cr106738_place_9 = missionary.core.none;
(cr106738_state[(0)] = cr106738_block_4);

return missionary.core.fork(cr106738_place_8,cr106738_place_9);
}catch (e106777){var cr106738_exception = e106777;
(cr106738_state[(0)] = cr106738_block_8);

(cr106738_state[(4)] = null);

(cr106738_state[(2)] = cr106738_exception);

return cr106738_state;
}});
var cr106738_block_11 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr106738_block_11(cr106738_state){
try{var cr106738_place_4 = (cr106738_state[(2)]);
var cr106738_place_22 = cr106738_place_4;
var cr106738_place_23 = (function(){throw cr106738_place_22})();
(cr106738_state[(0)] = null);

(cr106738_state[(1)] = null);

(cr106738_state[(2)] = null);

return null;
}catch (e106778){var cr106738_exception = e106778;
(cr106738_state[(0)] = cr106738_block_16);

(cr106738_state[(1)] = true);

(cr106738_state[(2)] = cr106738_exception);

return cr106738_state;
}});
var cr106738_block_9 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr106738_block_9(cr106738_state){
try{var cr106738_place_19 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr106738_place_20 = null;
if(cljs.core.truth_(cr106738_place_19)){
(cr106738_state[(0)] = cr106738_block_11);

(cr106738_state[(3)] = null);

return cr106738_state;
} else {
(cr106738_state[(0)] = cr106738_block_10);

(cr106738_state[(4)] = cr106738_place_20);

return cr106738_state;
}
}catch (e106779){var cr106738_exception = e106779;
(cr106738_state[(0)] = cr106738_block_16);

(cr106738_state[(3)] = null);

(cr106738_state[(1)] = true);

(cr106738_state[(2)] = cr106738_exception);

return cr106738_state;
}});
var cr106738_block_2 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr106738_block_2(cr106738_state){
try{var cr106738_place_3 = (cr106738_state[(3)]);
var cr106738_place_6 = cr106738_place_3;
var cr106738_place_7 = null;
if(cljs.core.truth_(cr106738_place_6)){
(cr106738_state[(0)] = cr106738_block_5);

(cr106738_state[(4)] = cr106738_place_7);

return cr106738_state;
} else {
(cr106738_state[(0)] = cr106738_block_3);

(cr106738_state[(3)] = null);

(cr106738_state[(4)] = cr106738_place_7);

return cr106738_state;
}
}catch (e106780){var cr106738_exception = e106780;
(cr106738_state[(0)] = cr106738_block_8);

(cr106738_state[(3)] = null);

(cr106738_state[(2)] = cr106738_exception);

return cr106738_state;
}});
var cr106738_block_14 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr106738_block_14(cr106738_state){
try{var cr106738_place_27 = missionary.core.unpark();
(cr106738_state[(0)] = cr106738_block_15);

(cr106738_state[(3)] = cr106738_place_27);

return cr106738_state;
}catch (e106781){var cr106738_exception = e106781;
(cr106738_state[(0)] = cr106738_block_16);

(cr106738_state[(3)] = null);

(cr106738_state[(1)] = true);

(cr106738_state[(2)] = cr106738_exception);

return cr106738_state;
}});
return cloroutine.impl.coroutine((function (){var G__106782 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__106782[(0)] = cr106738_block_0);

return G__106782;
})());
})(),missionary.core.ap_run));
});
frontend.worker.rtc.core.create_rtc_state_flow = (function frontend$worker$rtc$core$create_rtc_state_flow(ws_state_flow){
return missionary.core.latest.cljs$core$IFn$_invoke$arity$variadic((function (ws_state){
var _PERCENT_ = (function (){var G__106783 = cljs.core.PersistentArrayMap.EMPTY;
if(cljs.core.truth_(ws_state)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106783,new cljs.core.Keyword(null,"ws-state","ws-state",2128833478),ws_state);
} else {
return G__106783;
}
})();
if(cljs.core.truth_((frontend.worker.rtc.core.rtc_state_validator.cljs$core$IFn$_invoke$arity$1 ? frontend.worker.rtc.core.rtc_state_validator.cljs$core$IFn$_invoke$arity$1(_PERCENT_) : frontend.worker.rtc.core.rtc_state_validator.call(null,_PERCENT_)))){
} else {
throw (new Error("Assert failed: (rtc-state-validator %)"));
}

return _PERCENT_;
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([missionary.core.reductions.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,null,ws_state_flow)], 0));
});
frontend.worker.rtc.core.add_migration_client_ops_BANG_ = (function frontend$worker$rtc$core$add_migration_client_ops_BANG_(repo,db,server_schema_version){
if(cljs.core.truth_(server_schema_version)){
var client_schema_version = logseq.db.get_graph_schema_version(db);
var added_ops = frontend.worker.rtc.migrate.add_migration_client_ops_BANG_(repo,db,server_schema_version,client_schema_version);
if(cljs.core.seq(added_ops)){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.rtc.core",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"add-migration-client-ops","add-migration-client-ops",-2078939828),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"server-schema-version","server-schema-version",765611123),server_schema_version,new cljs.core.Keyword(null,"client-schema-version","client-schema-version",-315922744),client_schema_version], null),new cljs.core.Keyword(null,"line","line",212345235),170], null)),null);
} else {
return null;
}
} else {
return null;
}
});
frontend.worker.rtc.core.update_remote_schema_version_BANG_ = (function frontend$worker$rtc$core$update_remote_schema_version_BANG_(conn,server_schema_version){
if(cljs.core.truth_(server_schema_version)){
var G__106784 = conn;
var G__106785 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(logseq.db.kv.cljs$core$IFn$_invoke$arity$2 ? logseq.db.kv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.kv","remote-schema-version","logseq.kv/remote-schema-version",988970829),server_schema_version) : logseq.db.kv.call(null,new cljs.core.Keyword("logseq.kv","remote-schema-version","logseq.kv/remote-schema-version",988970829),server_schema_version))], null);
var G__106786 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__106784,G__106785,G__106786) : datascript.core.transact_BANG_.call(null,G__106784,G__106785,G__106786));
} else {
return null;
}
});
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.rtc !== 'undefined') && (typeof frontend.worker.rtc.core !== 'undefined') && (typeof frontend.worker.rtc.core._STAR_rtc_lock !== 'undefined')){
} else {
frontend.worker.rtc.core._STAR_rtc_lock = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
/**
 * Use this fn to prevent multiple rtc-loops at same time.
 *   rtc-loop-task is stateless, but conn is not.
 *   we need to ensure that no two concurrent rtc-loop-tasks are modifying `conn` at the same time
 */
frontend.worker.rtc.core.holding_rtc_lock = (function frontend$worker$rtc$core$holding_rtc_lock(started_dfv,task){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr106787_block_0 = (function frontend$worker$rtc$core$holding_rtc_lock_$_cr106787_block_0(cr106787_state){
try{var cr106787_place_0 = cljs.core.compare_and_set_BANG_;
var cr106787_place_1 = frontend.worker.rtc.core._STAR_rtc_lock;
var cr106787_place_2 = null;
var cr106787_place_3 = true;
var cr106787_place_4 = (function (){var G__106810 = cr106787_place_1;
var G__106811 = cr106787_place_2;
var G__106812 = cr106787_place_3;
var fexpr__106809 = cr106787_place_0;
return (fexpr__106809.cljs$core$IFn$_invoke$arity$3 ? fexpr__106809.cljs$core$IFn$_invoke$arity$3(G__106810,G__106811,G__106812) : fexpr__106809.call(null,G__106810,G__106811,G__106812));
})();
var cr106787_place_5 = null;
if(cljs.core.truth_(cr106787_place_4)){
(cr106787_state[(0)] = cr106787_block_2);

(cr106787_state[(1)] = cr106787_place_5);

return cr106787_state;
} else {
(cr106787_state[(0)] = cr106787_block_1);

return cr106787_state;
}
}catch (e106808){var cr106787_exception = e106808;
(cr106787_state[(0)] = null);

throw cr106787_exception;
}});
var cr106787_block_1 = (function frontend$worker$rtc$core$holding_rtc_lock_$_cr106787_block_1(cr106787_state){
try{var cr106787_place_6 = cljs.core.ex_info;
var cr106787_place_7 = "Must not run multiple rtc-loops, try later";
var cr106787_place_8 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr106787_place_9 = new cljs.core.Keyword("rtc.exception","lock-failed","rtc.exception/lock-failed",-52850201);
var cr106787_place_10 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr106787_place_11 = true;
var cr106787_place_12 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr106787_place_8,cr106787_place_9,cr106787_place_10,cr106787_place_11]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr106787_place_13 = (function (){var G__106815 = cr106787_place_7;
var G__106816 = cr106787_place_12;
var fexpr__106814 = cr106787_place_6;
return (fexpr__106814.cljs$core$IFn$_invoke$arity$2 ? fexpr__106814.cljs$core$IFn$_invoke$arity$2(G__106815,G__106816) : fexpr__106814.call(null,G__106815,G__106816));
})();
var cr106787_place_14 = started_dfv;
var cr106787_place_15 = cr106787_place_13;
var cr106787_place_16 = (function (){var G__106818 = cr106787_place_15;
var fexpr__106817 = cr106787_place_14;
return (fexpr__106817.cljs$core$IFn$_invoke$arity$1 ? fexpr__106817.cljs$core$IFn$_invoke$arity$1(G__106818) : fexpr__106817.call(null,G__106818));
})();
var cr106787_place_17 = cr106787_place_13;
var cr106787_place_18 = (function(){throw cr106787_place_17})();
(cr106787_state[(0)] = null);

return null;
}catch (e106813){var cr106787_exception = e106813;
(cr106787_state[(0)] = null);

throw cr106787_exception;
}});
var cr106787_block_2 = (function frontend$worker$rtc$core$holding_rtc_lock_$_cr106787_block_2(cr106787_state){
try{var cr106787_place_19 = null;
(cr106787_state[(0)] = cr106787_block_3);

(cr106787_state[(1)] = cr106787_place_19);

return cr106787_state;
}catch (e106819){var cr106787_exception = e106819;
(cr106787_state[(0)] = null);

(cr106787_state[(1)] = null);

throw cr106787_exception;
}});
var cr106787_block_3 = (function frontend$worker$rtc$core$holding_rtc_lock_$_cr106787_block_3(cr106787_state){
try{var cr106787_place_5 = (cr106787_state[(1)]);
var cr106787_place_20 = null;
var cr106787_place_21 = false;
(cr106787_state[(0)] = cr106787_block_4);

(cr106787_state[(1)] = null);

(cr106787_state[(2)] = cr106787_place_20);

(cr106787_state[(1)] = cr106787_place_21);

return cr106787_state;
}catch (e106820){var cr106787_exception = e106820;
(cr106787_state[(0)] = null);

(cr106787_state[(1)] = null);

throw cr106787_exception;
}});
var cr106787_block_4 = (function frontend$worker$rtc$core$holding_rtc_lock_$_cr106787_block_4(cr106787_state){
try{var cr106787_place_22 = task;
(cr106787_state[(0)] = cr106787_block_5);

return missionary.core.park(cr106787_place_22);
}catch (e106821){var cr106787_exception = e106821;
(cr106787_state[(0)] = cr106787_block_6);

(cr106787_state[(2)] = cr106787_exception);

return cr106787_state;
}});
var cr106787_block_5 = (function frontend$worker$rtc$core$holding_rtc_lock_$_cr106787_block_5(cr106787_state){
try{var cr106787_place_23 = missionary.core.unpark();
(cr106787_state[(0)] = cr106787_block_7);

(cr106787_state[(2)] = cr106787_place_23);

return cr106787_state;
}catch (e106822){var cr106787_exception = e106822;
(cr106787_state[(0)] = cr106787_block_6);

(cr106787_state[(2)] = cr106787_exception);

return cr106787_state;
}});
var cr106787_block_6 = (function frontend$worker$rtc$core$holding_rtc_lock_$_cr106787_block_6(cr106787_state){
try{var cr106787_place_20 = (cr106787_state[(2)]);
var cr106787_place_24 = cr106787_place_20;
var cr106787_place_25 = (function(){throw cr106787_place_24})();
(cr106787_state[(0)] = null);

(cr106787_state[(1)] = null);

(cr106787_state[(2)] = null);

return null;
}catch (e106823){var cr106787_exception = e106823;
(cr106787_state[(0)] = cr106787_block_7);

(cr106787_state[(1)] = true);

(cr106787_state[(2)] = cr106787_exception);

return cr106787_state;
}});
var cr106787_block_7 = (function frontend$worker$rtc$core$holding_rtc_lock_$_cr106787_block_7(cr106787_state){
try{var cr106787_place_21 = (cr106787_state[(1)]);
var cr106787_place_20 = (cr106787_state[(2)]);
var cr106787_place_26 = cljs.core.reset_BANG_;
var cr106787_place_27 = frontend.worker.rtc.core._STAR_rtc_lock;
var cr106787_place_28 = null;
var cr106787_place_29 = (function (){var G__106826 = cr106787_place_27;
var G__106827 = cr106787_place_28;
var fexpr__106825 = cr106787_place_26;
return (fexpr__106825.cljs$core$IFn$_invoke$arity$2 ? fexpr__106825.cljs$core$IFn$_invoke$arity$2(G__106826,G__106827) : fexpr__106825.call(null,G__106826,G__106827));
})();
var cr106787_place_30 = (cljs.core.truth_(cr106787_place_21)?(function(){throw cr106787_place_20})():cr106787_place_20);
(cr106787_state[(0)] = null);

(cr106787_state[(1)] = null);

(cr106787_state[(2)] = null);

return cr106787_place_30;
}catch (e106824){var cr106787_exception = e106824;
(cr106787_state[(0)] = null);

(cr106787_state[(1)] = null);

(cr106787_state[(2)] = null);

throw cr106787_exception;
}});
return cloroutine.impl.coroutine((function (){var G__106828 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__106828[(0)] = cr106787_block_0);

return G__106828;
})());
})(),missionary.core.sp_run);
});
/**
 * Return a map with [:rtc-state-flow :rtc-loop-task :*rtc-auto-push? :onstarted-task]
 *   TODO: auto refresh token if needed
 */
frontend.worker.rtc.core.create_rtc_loop = (function frontend$worker$rtc$core$create_rtc_loop(var_args){
var args__5732__auto__ = [];
var len__5726__auto___108026 = arguments.length;
var i__5727__auto___108027 = (0);
while(true){
if((i__5727__auto___108027 < len__5726__auto___108026)){
args__5732__auto__.push((arguments[i__5727__auto___108027]));

var G__108028 = (i__5727__auto___108027 + (1));
i__5727__auto___108027 = G__108028;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((6) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((6)),(0),null)):null);
return frontend.worker.rtc.core.create_rtc_loop.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),(arguments[(5)]),argseq__5733__auto__);
});

(frontend.worker.rtc.core.create_rtc_loop.cljs$core$IFn$_invoke$arity$variadic = (function (graph_uuid,schema_version,repo,conn,date_formatter,token,p__106836){
var map__106837 = p__106836;
var map__106837__$1 = cljs.core.__destructure_map(map__106837);
var auto_push_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__106837__$1,new cljs.core.Keyword(null,"auto-push?","auto-push?",674534960),true);
var debug_ws_url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106837__$1,new cljs.core.Keyword(null,"debug-ws-url","debug-ws-url",-1011645872));
var major_schema_version = logseq.db.frontend.schema.major_version(schema_version);
var ws_url = (function (){var or__5002__auto__ = debug_ws_url;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.worker.rtc.ws_util.get_ws_url(token);
}
})();
var _STAR_auto_push_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(auto_push_QMARK_);
var _STAR_remote_profile_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
var _STAR_last_calibrate_t = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var _STAR_online_users = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var _STAR_assets_sync_loop_canceler = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var _STAR_server_schema_version = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var started_dfv = missionary.core.dfv();
var add_log_fn = (function (type,message){
if(cljs.core.map_QMARK_(message)){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(message),"\n","(map? message)"].join('')));
}

return frontend.worker.rtc.log_and_state.rtc_log(type,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(message,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid));
});
var map__106838 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized(ws_url);
var map__106838__$1 = cljs.core.__destructure_map(map__106838);
var _STAR_current_ws = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106838__$1,new cljs.core.Keyword(null,"*current-ws","*current-ws",2093663036));
var get_ws_create_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106838__$1,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002));
var get_ws_create_task__$1 = frontend.worker.rtc.client.ensure_register_graph_updates(get_ws_create_task,graph_uuid,major_schema_version,repo,conn,_STAR_last_calibrate_t,_STAR_online_users,_STAR_server_schema_version,add_log_fn);
var map__106839 = frontend.worker.rtc.asset.create_assets_sync_loop(repo,get_ws_create_task__$1,graph_uuid,major_schema_version,conn,_STAR_auto_push_QMARK_);
var map__106839__$1 = cljs.core.__destructure_map(map__106839);
var assets_sync_loop_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106839__$1,new cljs.core.Keyword(null,"assets-sync-loop-task","assets-sync-loop-task",1231956523));
var mixed_flow = frontend.worker.rtc.core.create_mixed_flow(repo,get_ws_create_task__$1,_STAR_auto_push_QMARK_,_STAR_online_users);
if((!((_STAR_current_ws == null)))){
} else {
throw (new Error("Assert failed: (some? *current-ws)"));
}

return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"rtc-state-flow","rtc-state-flow",553472428),frontend.worker.rtc.core.create_rtc_state_flow(frontend.worker.rtc.core.create_ws_state_flow(_STAR_current_ws)),new cljs.core.Keyword(null,"*rtc-auto-push?","*rtc-auto-push?",-44092416),_STAR_auto_push_QMARK_,new cljs.core.Keyword(null,"*rtc-remote-profile?","*rtc-remote-profile?",751419973),_STAR_remote_profile_QMARK_,new cljs.core.Keyword(null,"*online-users","*online-users",-1145442647),_STAR_online_users,new cljs.core.Keyword(null,"onstarted-task","onstarted-task",750035798),started_dfv,new cljs.core.Keyword(null,"rtc-loop-task","rtc-loop-task",1590035731),frontend.worker.rtc.core.holding_rtc_lock(started_dfv,cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr106840_block_9 = (function frontend$worker$rtc$core$cr106840_block_9(cr106840_state){
try{var cr106840_place_0 = (cr106840_state[(2)]);
var cr106840_place_80 = cr106840_place_0;
var cr106840_place_81 = add_log_fn;
var cr106840_place_82 = new cljs.core.Keyword("rtc.log","cancelled","rtc.log/cancelled",-1356944103);
var cr106840_place_83 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr106840_place_84 = cr106840_place_81(cr106840_place_82,cr106840_place_83);
var cr106840_place_85 = cr106840_place_80;
var cr106840_place_86 = (function(){throw cr106840_place_85})();
(cr106840_state[(0)] = null);

(cr106840_state[(1)] = null);

(cr106840_state[(2)] = null);

return null;
}catch (e107201){var cr106840_exception = e107201;
(cr106840_state[(0)] = cr106840_block_11);

(cr106840_state[(1)] = true);

(cr106840_state[(2)] = cr106840_exception);

return cr106840_state;
}});
var cr106840_block_1 = (function frontend$worker$rtc$core$cr106840_block_1(cr106840_state){
try{var cr106840_place_2 = get_ws_create_task__$1;
(cr106840_state[(0)] = cr106840_block_2);

return missionary.core.park(cr106840_place_2);
}catch (e107202){var cr106840_exception = e107202;
(cr106840_state[(0)] = cr106840_block_4);

(cr106840_state[(2)] = cr106840_exception);

return cr106840_state;
}});
var cr106840_block_3 = (function frontend$worker$rtc$core$cr106840_block_3(cr106840_state){
try{var cr106840_place_70 = missionary.core.unpark();
(cr106840_state[(0)] = cr106840_block_11);

(cr106840_state[(2)] = cr106840_place_70);

return cr106840_state;
}catch (e107203){var cr106840_exception = e107203;
(cr106840_state[(0)] = cr106840_block_4);

(cr106840_state[(2)] = cr106840_exception);

return cr106840_state;
}});
var cr106840_block_12 = (function frontend$worker$rtc$core$cr106840_block_12(cr106840_state){
try{var cr106840_place_94 = null;
(cr106840_state[(0)] = cr106840_block_14);

(cr106840_state[(3)] = cr106840_place_94);

return cr106840_state;
}catch (e107204){var cr106840_exception = e107204;
(cr106840_state[(0)] = null);

(cr106840_state[(3)] = null);

(cr106840_state[(1)] = null);

(cr106840_state[(2)] = null);

throw cr106840_exception;
}});
var cr106840_block_11 = (function frontend$worker$rtc$core$cr106840_block_11(cr106840_state){
try{var cr106840_place_87 = started_dfv;
var cr106840_place_88 = new cljs.core.Keyword(null,"final","final",1157881357);
var cr106840_place_89 = (function (){var G__107207 = cr106840_place_88;
var fexpr__107206 = cr106840_place_87;
return (fexpr__107206.cljs$core$IFn$_invoke$arity$1 ? fexpr__107206.cljs$core$IFn$_invoke$arity$1(G__107207) : fexpr__107206.call(null,G__107207));
})();
var cr106840_place_90 = cljs.core.deref;
var cr106840_place_91 = _STAR_assets_sync_loop_canceler;
var cr106840_place_92 = (function (){var G__107209 = cr106840_place_91;
var fexpr__107208 = cr106840_place_90;
return (fexpr__107208.cljs$core$IFn$_invoke$arity$1 ? fexpr__107208.cljs$core$IFn$_invoke$arity$1(G__107209) : fexpr__107208.call(null,G__107209));
})();
var cr106840_place_93 = null;
if(cljs.core.truth_(cr106840_place_92)){
(cr106840_state[(0)] = cr106840_block_13);

(cr106840_state[(3)] = cr106840_place_93);

return cr106840_state;
} else {
(cr106840_state[(0)] = cr106840_block_12);

(cr106840_state[(3)] = cr106840_place_93);

return cr106840_state;
}
}catch (e107205){var cr106840_exception = e107205;
(cr106840_state[(0)] = null);

(cr106840_state[(1)] = null);

(cr106840_state[(2)] = null);

throw cr106840_exception;
}});
var cr106840_block_4 = (function frontend$worker$rtc$core$cr106840_block_4(cr106840_state){
try{var cr106840_place_0 = (cr106840_state[(2)]);
var cr106840_place_71 = cr106840_place_0;
var cr106840_place_72 = missionary.Cancelled;
var cr106840_place_73 = (cr106840_place_71 instanceof cr106840_place_72);
var cr106840_place_74 = null;
if(cr106840_place_73){
(cr106840_state[(0)] = cr106840_block_9);

return cr106840_state;
} else {
(cr106840_state[(0)] = cr106840_block_5);

(cr106840_state[(3)] = cr106840_place_74);

return cr106840_state;
}
}catch (e107210){var cr106840_exception = e107210;
(cr106840_state[(0)] = cr106840_block_11);

(cr106840_state[(1)] = true);

(cr106840_state[(2)] = cr106840_exception);

return cr106840_state;
}});
var cr106840_block_5 = (function frontend$worker$rtc$core$cr106840_block_5(cr106840_state){
try{var cr106840_place_75 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr106840_place_76 = null;
if(cljs.core.truth_(cr106840_place_75)){
(cr106840_state[(0)] = cr106840_block_7);

(cr106840_state[(3)] = null);

return cr106840_state;
} else {
(cr106840_state[(0)] = cr106840_block_6);

(cr106840_state[(4)] = cr106840_place_76);

return cr106840_state;
}
}catch (e107211){var cr106840_exception = e107211;
(cr106840_state[(0)] = cr106840_block_11);

(cr106840_state[(3)] = null);

(cr106840_state[(1)] = true);

(cr106840_state[(2)] = cr106840_exception);

return cr106840_state;
}});
var cr106840_block_14 = (function frontend$worker$rtc$core$cr106840_block_14(cr106840_state){
try{var cr106840_place_93 = (cr106840_state[(3)]);
var cr106840_place_1 = (cr106840_state[(1)]);
var cr106840_place_0 = (cr106840_state[(2)]);
var cr106840_place_100 = (cljs.core.truth_(cr106840_place_1)?(function(){throw cr106840_place_0})():cr106840_place_0);
(cr106840_state[(0)] = null);

(cr106840_state[(3)] = null);

(cr106840_state[(1)] = null);

(cr106840_state[(2)] = null);

return cr106840_place_100;
}catch (e107212){var cr106840_exception = e107212;
(cr106840_state[(0)] = null);

(cr106840_state[(3)] = null);

(cr106840_state[(1)] = null);

(cr106840_state[(2)] = null);

throw cr106840_exception;
}});
var cr106840_block_7 = (function frontend$worker$rtc$core$cr106840_block_7(cr106840_state){
try{var cr106840_place_0 = (cr106840_state[(2)]);
var cr106840_place_78 = cr106840_place_0;
var cr106840_place_79 = (function(){throw cr106840_place_78})();
(cr106840_state[(0)] = null);

(cr106840_state[(1)] = null);

(cr106840_state[(2)] = null);

return null;
}catch (e107213){var cr106840_exception = e107213;
(cr106840_state[(0)] = cr106840_block_11);

(cr106840_state[(1)] = true);

(cr106840_state[(2)] = cr106840_exception);

return cr106840_state;
}});
var cr106840_block_8 = (function frontend$worker$rtc$core$cr106840_block_8(cr106840_state){
try{var cr106840_place_76 = (cr106840_state[(4)]);
(cr106840_state[(0)] = cr106840_block_10);

(cr106840_state[(4)] = null);

(cr106840_state[(3)] = cr106840_place_76);

return cr106840_state;
}catch (e107214){var cr106840_exception = e107214;
(cr106840_state[(0)] = cr106840_block_11);

(cr106840_state[(4)] = null);

(cr106840_state[(3)] = null);

(cr106840_state[(1)] = true);

(cr106840_state[(2)] = cr106840_exception);

return cr106840_state;
}});
var cr106840_block_6 = (function frontend$worker$rtc$core$cr106840_block_6(cr106840_state){
try{var cr106840_place_77 = null;
(cr106840_state[(0)] = cr106840_block_8);

(cr106840_state[(4)] = cr106840_place_77);

return cr106840_state;
}catch (e107215){var cr106840_exception = e107215;
(cr106840_state[(0)] = cr106840_block_11);

(cr106840_state[(4)] = null);

(cr106840_state[(3)] = null);

(cr106840_state[(1)] = true);

(cr106840_state[(2)] = cr106840_exception);

return cr106840_state;
}});
var cr106840_block_0 = (function frontend$worker$rtc$core$cr106840_block_0(cr106840_state){
try{var cr106840_place_0 = null;
var cr106840_place_1 = false;
(cr106840_state[(0)] = cr106840_block_1);

(cr106840_state[(2)] = cr106840_place_0);

(cr106840_state[(1)] = cr106840_place_1);

return cr106840_state;
}catch (e107216){var cr106840_exception = e107216;
(cr106840_state[(0)] = null);

throw cr106840_exception;
}});
var cr106840_block_13 = (function frontend$worker$rtc$core$cr106840_block_13(cr106840_state){
try{var cr106840_place_95 = cljs.core.deref;
var cr106840_place_96 = _STAR_assets_sync_loop_canceler;
var cr106840_place_97 = (function (){var G__107219 = cr106840_place_96;
var fexpr__107218 = cr106840_place_95;
return (fexpr__107218.cljs$core$IFn$_invoke$arity$1 ? fexpr__107218.cljs$core$IFn$_invoke$arity$1(G__107219) : fexpr__107218.call(null,G__107219));
})();
var cr106840_place_98 = cr106840_place_97;
var cr106840_place_99 = (function (){var fexpr__107220 = cr106840_place_98;
return (fexpr__107220.cljs$core$IFn$_invoke$arity$0 ? fexpr__107220.cljs$core$IFn$_invoke$arity$0() : fexpr__107220.call(null));
})();
(cr106840_state[(0)] = cr106840_block_14);

(cr106840_state[(3)] = cr106840_place_99);

return cr106840_state;
}catch (e107217){var cr106840_exception = e107217;
(cr106840_state[(0)] = null);

(cr106840_state[(3)] = null);

(cr106840_state[(1)] = null);

(cr106840_state[(2)] = null);

throw cr106840_exception;
}});
var cr106840_block_10 = (function frontend$worker$rtc$core$cr106840_block_10(cr106840_state){
try{var cr106840_place_74 = (cr106840_state[(3)]);
(cr106840_state[(0)] = cr106840_block_11);

(cr106840_state[(3)] = null);

(cr106840_state[(2)] = cr106840_place_74);

return cr106840_state;
}catch (e107221){var cr106840_exception = e107221;
(cr106840_state[(0)] = cr106840_block_11);

(cr106840_state[(3)] = null);

(cr106840_state[(1)] = true);

(cr106840_state[(2)] = cr106840_exception);

return cr106840_state;
}});
var cr106840_block_2 = (function frontend$worker$rtc$core$cr106840_block_2(cr106840_state){
try{var cr106840_place_3 = missionary.core.unpark();
var cr106840_place_4 = started_dfv;
var cr106840_place_5 = true;
var cr106840_place_6 = (function (){var G__107224 = cr106840_place_5;
var fexpr__107223 = cr106840_place_4;
return (fexpr__107223.cljs$core$IFn$_invoke$arity$1 ? fexpr__107223.cljs$core$IFn$_invoke$arity$1(G__107224) : fexpr__107223.call(null,G__107224));
})();
var cr106840_place_7 = frontend.worker.rtc.core.update_remote_schema_version_BANG_;
var cr106840_place_8 = conn;
var cr106840_place_9 = cljs.core.deref;
var cr106840_place_10 = _STAR_server_schema_version;
var cr106840_place_11 = (function (){var G__107226 = cr106840_place_10;
var fexpr__107225 = cr106840_place_9;
return (fexpr__107225.cljs$core$IFn$_invoke$arity$1 ? fexpr__107225.cljs$core$IFn$_invoke$arity$1(G__107226) : fexpr__107225.call(null,G__107226));
})();
var cr106840_place_12 = (function (){var G__107228 = cr106840_place_8;
var G__107229 = cr106840_place_11;
var fexpr__107227 = cr106840_place_7;
return (fexpr__107227.cljs$core$IFn$_invoke$arity$2 ? fexpr__107227.cljs$core$IFn$_invoke$arity$2(G__107228,G__107229) : fexpr__107227.call(null,G__107228,G__107229));
})();
var cr106840_place_13 = frontend.worker.rtc.core.add_migration_client_ops_BANG_;
var cr106840_place_14 = repo;
var cr106840_place_15 = cljs.core.deref;
var cr106840_place_16 = conn;
var cr106840_place_17 = (function (){var G__107231 = cr106840_place_16;
var fexpr__107230 = cr106840_place_15;
return (fexpr__107230.cljs$core$IFn$_invoke$arity$1 ? fexpr__107230.cljs$core$IFn$_invoke$arity$1(G__107231) : fexpr__107230.call(null,G__107231));
})();
var cr106840_place_18 = cljs.core.deref;
var cr106840_place_19 = _STAR_server_schema_version;
var cr106840_place_20 = (function (){var G__107233 = cr106840_place_19;
var fexpr__107232 = cr106840_place_18;
return (fexpr__107232.cljs$core$IFn$_invoke$arity$1 ? fexpr__107232.cljs$core$IFn$_invoke$arity$1(G__107233) : fexpr__107232.call(null,G__107233));
})();
var cr106840_place_21 = (function (){var G__107235 = cr106840_place_14;
var G__107236 = cr106840_place_17;
var G__107237 = cr106840_place_20;
var fexpr__107234 = cr106840_place_13;
return (fexpr__107234.cljs$core$IFn$_invoke$arity$3 ? fexpr__107234.cljs$core$IFn$_invoke$arity$3(G__107235,G__107236,G__107237) : fexpr__107234.call(null,G__107235,G__107236,G__107237));
})();
var cr106840_place_22 = cljs.core.reset_BANG_;
var cr106840_place_23 = _STAR_assets_sync_loop_canceler;
var cr106840_place_24 = frontend.common.missionary.run_task;
var cr106840_place_25 = new cljs.core.Keyword(null,"assets-sync-loop-task","assets-sync-loop-task",1231956523);
var cr106840_place_26 = assets_sync_loop_task;
var cr106840_place_27 = (function (){var G__107239 = cr106840_place_25;
var G__107240 = cr106840_place_26;
var fexpr__107238 = cr106840_place_24;
return (fexpr__107238.cljs$core$IFn$_invoke$arity$2 ? fexpr__107238.cljs$core$IFn$_invoke$arity$2(G__107239,G__107240) : fexpr__107238.call(null,G__107239,G__107240));
})();
var cr106840_place_28 = (function (){var G__107242 = cr106840_place_23;
var G__107243 = cr106840_place_27;
var fexpr__107241 = cr106840_place_22;
return (fexpr__107241.cljs$core$IFn$_invoke$arity$2 ? fexpr__107241.cljs$core$IFn$_invoke$arity$2(G__107242,G__107243) : fexpr__107241.call(null,G__107242,G__107243));
})();
var cr106840_place_29 = missionary.core.reduce;
var cr106840_place_30 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr106840_place_31 = null;
var cr106840_place_32 = cljs.core.partial;
var cr106840_place_55 = (function (cr106843_state){
try{var cr106843_place_56 = missionary.core.unpark();
(cr106843_state[(0)] = cr106840_place_42);

(cr106843_state[(1)] = cr106843_place_56);

return cr106843_state;
}catch (e107319){var e106994 = e107319;
var cr106843_exception = e106994;
(cr106843_state[(0)] = null);

(cr106843_state[(1)] = null);

throw cr106843_exception;
}});
var cr106840_place_38 = (function (cr106843_state){
try{var cr106843_place_86 = frontend.worker.rtc.core.new_task__inject_users_info;
var cr106843_place_87 = token;
var cr106843_place_88 = graph_uuid;
var cr106843_place_89 = major_schema_version;
var cr106843_place_90 = (function (){var G__106941 = cr106843_place_87;
var G__106942 = cr106843_place_88;
var G__106943 = cr106843_place_89;
var fexpr__106940 = cr106843_place_86;
var G__107322 = G__106941;
var G__107323 = G__106942;
var G__107324 = G__106943;
var fexpr__107321 = fexpr__106940;
return (fexpr__107321.cljs$core$IFn$_invoke$arity$3 ? fexpr__107321.cljs$core$IFn$_invoke$arity$3(G__107322,G__107323,G__107324) : fexpr__107321.call(null,G__107322,G__107323,G__107324));
})();
(cr106843_state[(0)] = cr106840_place_40);

return missionary.core.park(cr106843_place_90);
}catch (e107320){var e106939 = e107320;
var cr106843_exception = e106939;
(cr106843_state[(0)] = null);

(cr106843_state[(1)] = null);

throw cr106843_exception;
}});
var cr106840_place_41 = (function (cr106843_state){
try{var cr106843_place_2 = (cr106843_state[(2)]);
var cr106843_place_17 = frontend.worker.rtc.remote_update.apply_remote_update;
var cr106843_place_18 = graph_uuid;
var cr106843_place_19 = repo;
var cr106843_place_20 = conn;
var cr106843_place_21 = date_formatter;
var cr106843_place_22 = cr106843_place_2;
var cr106843_place_23 = add_log_fn;
var cr106843_place_24 = (function (){var G__106948 = cr106843_place_18;
var G__106949 = cr106843_place_19;
var G__106950 = cr106843_place_20;
var G__106951 = cr106843_place_21;
var G__106952 = cr106843_place_22;
var G__106953 = cr106843_place_23;
var fexpr__106947 = cr106843_place_17;
var G__107327 = G__106948;
var G__107328 = G__106949;
var G__107329 = G__106950;
var G__107330 = G__106951;
var G__107331 = G__106952;
var G__107332 = G__106953;
var fexpr__107326 = fexpr__106947;
return (fexpr__107326.cljs$core$IFn$_invoke$arity$6 ? fexpr__107326.cljs$core$IFn$_invoke$arity$6(G__107327,G__107328,G__107329,G__107330,G__107331,G__107332) : fexpr__107326.call(null,G__107327,G__107328,G__107329,G__107330,G__107331,G__107332));
})();
(cr106843_state[(0)] = cr106840_place_45);

(cr106843_state[(2)] = null);

(cr106843_state[(3)] = cr106843_place_24);

return cr106843_state;
}catch (e107325){var e106946 = e107325;
var cr106843_exception = e106946;
(cr106843_state[(0)] = cr106840_place_35);

(cr106843_state[(2)] = null);

(cr106843_state[(3)] = cr106843_exception);

return cr106843_state;
}});
var cr106840_place_48 = (function (cr106843_state){
try{var cr106843_place_34 = (cr106843_state[(2)]);
(cr106843_state[(0)] = cr106840_place_45);

(cr106843_state[(2)] = null);

(cr106843_state[(3)] = cr106843_place_34);

return cr106843_state;
}catch (e107333){var e106971 = e107333;
var cr106843_exception = e106971;
(cr106843_state[(0)] = cr106840_place_45);

(cr106843_state[(2)] = null);

(cr106843_state[(4)] = true);

(cr106843_state[(3)] = cr106843_exception);

return cr106843_state;
}});
var cr106840_place_42 = (function (cr106843_state){
try{var cr106843_place_14 = (cr106843_state[(1)]);
(cr106843_state[(0)] = null);

(cr106843_state[(1)] = null);

return cr106843_place_14;
}catch (e107334){var e106954 = e107334;
var cr106843_exception = e106954;
(cr106843_state[(0)] = null);

(cr106843_state[(1)] = null);

throw cr106843_exception;
}});
var cr106840_place_44 = (function (cr106843_state){
try{var cr106843_place_2 = (cr106843_state[(2)]);
var cr106843_place_68 = cljs.core.reset_BANG_;
var cr106843_place_69 = _STAR_online_users;
var cr106843_place_70 = new cljs.core.Keyword(null,"online-users","online-users",-747563810);
var cr106843_place_71 = new cljs.core.Keyword(null,"value","value",305978217);
var cr106843_place_72 = cr106843_place_2;
var cr106843_place_73 = cr106843_place_71.cljs$core$IFn$_invoke$arity$1(cr106843_place_72);
var cr106843_place_74 = cr106843_place_70.cljs$core$IFn$_invoke$arity$1(cr106843_place_73);
var cr106843_place_75 = (function (){var G__106966 = cr106843_place_69;
var G__106967 = cr106843_place_74;
var fexpr__106965 = cr106843_place_68;
var G__107337 = G__106966;
var G__107338 = G__106967;
var fexpr__107336 = fexpr__106965;
return (fexpr__107336.cljs$core$IFn$_invoke$arity$2 ? fexpr__107336.cljs$core$IFn$_invoke$arity$2(G__107337,G__107338) : fexpr__107336.call(null,G__107337,G__107338));
})();
(cr106843_state[(0)] = cr106840_place_42);

(cr106843_state[(2)] = null);

(cr106843_state[(1)] = cr106843_place_75);

return cr106843_state;
}catch (e107335){var e106964 = e107335;
var cr106843_exception = e106964;
(cr106843_state[(0)] = null);

(cr106843_state[(1)] = null);

(cr106843_state[(2)] = null);

throw cr106843_exception;
}});
var cr106840_place_35 = (function (cr106843_state){
try{var cr106843_place_15 = (cr106843_state[(3)]);
var cr106843_place_25 = cr106843_place_15;
var cr106843_place_26 = cljs.core._EQ_;
var cr106843_place_27 = new cljs.core.Keyword("frontend.worker.rtc.remote-update","need-pull-remote-data","frontend.worker.rtc.remote-update/need-pull-remote-data",-1524072067);
var cr106843_place_28 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr106843_place_29 = cljs.core.ex_data;
var cr106843_place_30 = cr106843_place_25;
var cr106843_place_31 = (function (){var G__106925 = cr106843_place_30;
var fexpr__106924 = cr106843_place_29;
var G__107341 = G__106925;
var fexpr__107340 = fexpr__106924;
return (fexpr__107340.cljs$core$IFn$_invoke$arity$1 ? fexpr__107340.cljs$core$IFn$_invoke$arity$1(G__107341) : fexpr__107340.call(null,G__107341));
})();
var cr106843_place_32 = cr106843_place_28.cljs$core$IFn$_invoke$arity$1(cr106843_place_31);
var cr106843_place_33 = (function (){var G__106927 = cr106843_place_27;
var G__106928 = cr106843_place_32;
var fexpr__106926 = cr106843_place_26;
var G__107343 = G__106927;
var G__107344 = G__106928;
var fexpr__107342 = fexpr__106926;
return (fexpr__107342.cljs$core$IFn$_invoke$arity$2 ? fexpr__107342.cljs$core$IFn$_invoke$arity$2(G__107343,G__107344) : fexpr__107342.call(null,G__107343,G__107344));
})();
var cr106843_place_34 = null;
if(cljs.core.truth_(cr106843_place_33)){
(cr106843_state[(0)] = cr106840_place_36);

(cr106843_state[(2)] = cr106843_place_34);

return cr106843_state;
} else {
(cr106843_state[(0)] = cr106840_place_33);

(cr106843_state[(2)] = cr106843_place_34);

return cr106843_state;
}
}catch (e107339){var e106923 = e107339;
var cr106843_exception = e106923;
(cr106843_state[(0)] = cr106840_place_45);

(cr106843_state[(3)] = cr106843_exception);

(cr106843_state[(4)] = true);

return cr106843_state;
}});
var cr106840_place_37 = (function (cr106843_state){
try{var cr106843_place_45 = missionary.core.unpark();
(cr106843_state[(0)] = cr106840_place_48);

(cr106843_state[(2)] = cr106843_place_45);

return cr106843_state;
}catch (e107345){var e106938 = e107345;
var cr106843_exception = e106938;
(cr106843_state[(0)] = cr106840_place_45);

(cr106843_state[(2)] = null);

(cr106843_state[(4)] = true);

(cr106843_state[(3)] = cr106843_exception);

return cr106843_state;
}});
var cr106840_place_45 = (function (cr106843_state){
try{var cr106843_place_15 = (cr106843_state[(3)]);
var cr106843_place_16 = (cr106843_state[(4)]);
var cr106843_place_46 = (cljs.core.truth_(cr106843_place_16)?(function(){throw cr106843_place_15})():cr106843_place_15);
(cr106843_state[(0)] = cr106840_place_42);

(cr106843_state[(3)] = null);

(cr106843_state[(4)] = null);

(cr106843_state[(1)] = cr106843_place_46);

return cr106843_state;
}catch (e107346){var e106968 = e107346;
var cr106843_exception = e106968;
(cr106843_state[(0)] = null);

(cr106843_state[(1)] = null);

(cr106843_state[(3)] = null);

(cr106843_state[(4)] = null);

throw cr106843_exception;
}});
var cr106840_place_52 = (function (cr106843_state){
try{var cr106843_place_9 = (cr106843_state[(1)]);
var cr106843_place_92 = "No matching clause: ";
var cr106843_place_93 = cr106843_place_9;
var cr106843_place_94 = [cr106843_place_92,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr106843_place_93)].join('');
var cr106843_place_95 = (new Error(cr106843_place_94));
var cr106843_place_96 = (function(){throw cr106843_place_95})();
(cr106843_state[(0)] = null);

(cr106843_state[(1)] = null);

return null;
}catch (e107347){var e106981 = e107347;
var cr106843_exception = e106981;
(cr106843_state[(0)] = null);

(cr106843_state[(1)] = null);

throw cr106843_exception;
}});
var cr106840_place_43 = (function (cr106843_state){
try{var cr106843_place_76 = frontend.worker.rtc.client.new_task__pull_remote_data;
var cr106843_place_77 = repo;
var cr106843_place_78 = conn;
var cr106843_place_79 = graph_uuid;
var cr106843_place_80 = major_schema_version;
var cr106843_place_81 = date_formatter;
var cr106843_place_82 = get_ws_create_task__$1;
var cr106843_place_83 = add_log_fn;
var cr106843_place_84 = (function (){var G__106957 = cr106843_place_77;
var G__106958 = cr106843_place_78;
var G__106959 = cr106843_place_79;
var G__106960 = cr106843_place_80;
var G__106961 = cr106843_place_81;
var G__106962 = cr106843_place_82;
var G__106963 = cr106843_place_83;
var fexpr__106956 = cr106843_place_76;
var G__107350 = G__106957;
var G__107351 = G__106958;
var G__107352 = G__106959;
var G__107353 = G__106960;
var G__107354 = G__106961;
var G__107355 = G__106962;
var G__107356 = G__106963;
var fexpr__107349 = fexpr__106956;
return (fexpr__107349.cljs$core$IFn$_invoke$arity$7 ? fexpr__107349.cljs$core$IFn$_invoke$arity$7(G__107350,G__107351,G__107352,G__107353,G__107354,G__107355,G__107356) : fexpr__107349.call(null,G__107350,G__107351,G__107352,G__107353,G__107354,G__107355,G__107356));
})();
(cr106843_state[(0)] = cr106840_place_39);

return missionary.core.park(cr106843_place_84);
}catch (e107348){var e106955 = e107348;
var cr106843_exception = e106955;
(cr106843_state[(0)] = null);

(cr106843_state[(1)] = null);

throw cr106843_exception;
}});
var cr106840_place_33 = (function (cr106843_state){
try{var cr106843_place_35 = null;
(cr106843_state[(0)] = cr106840_place_48);

(cr106843_state[(2)] = cr106843_place_35);

return cr106843_state;
}catch (e107357){var e106921 = e107357;
var cr106843_exception = e106921;
(cr106843_state[(0)] = cr106840_place_45);

(cr106843_state[(2)] = null);

(cr106843_state[(4)] = true);

(cr106843_state[(3)] = cr106843_exception);

return cr106843_state;
}});
var cr106840_place_49 = (function (cr106843_state){
try{var cr106843_place_67 = missionary.core.unpark();
(cr106843_state[(0)] = cr106840_place_42);

(cr106843_state[(1)] = cr106843_place_67);

return cr106843_state;
}catch (e107358){var e106972 = e107358;
var cr106843_exception = e106972;
(cr106843_state[(0)] = null);

(cr106843_state[(1)] = null);

throw cr106843_exception;
}});
var cr106840_place_51 = (function (cr106843_state){
try{var cr106843_place_2 = missionary.core.unpark();
var cr106843_place_3 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr106843_place_4 = cr106843_place_2;
var cr106843_place_5 = cr106843_place_3.cljs$core$IFn$_invoke$arity$1(cr106843_place_4);
var cr106843_place_6 = cr106843_place_5;
var cr106843_place_7 = cljs.core.Keyword;
var cr106843_place_8 = (cr106843_place_6 instanceof cr106843_place_7);
var cr106843_place_9 = null;
if(cr106843_place_8){
(cr106843_state[(0)] = cr106840_place_46);

(cr106843_state[(2)] = cr106843_place_2);

(cr106843_state[(3)] = cr106843_place_5);

(cr106843_state[(1)] = cr106843_place_9);

return cr106843_state;
} else {
(cr106843_state[(0)] = cr106840_place_47);

(cr106843_state[(2)] = cr106843_place_2);

(cr106843_state[(1)] = cr106843_place_9);

return cr106843_state;
}
}catch (e107359){var e106980 = e107359;
var cr106843_exception = e106980;
(cr106843_state[(0)] = null);

throw cr106843_exception;
}});
var cr106840_place_46 = (function (cr106843_state){
try{var cr106843_place_5 = (cr106843_state[(3)]);
var cr106843_place_11 = cr106843_place_5;
var cr106843_place_12 = cr106843_place_11.fqn;
(cr106843_state[(0)] = cr106840_place_53);

(cr106843_state[(3)] = null);

(cr106843_state[(1)] = cr106843_place_12);

return cr106843_state;
}catch (e107360){var e106969 = e107360;
var cr106843_exception = e106969;
(cr106843_state[(0)] = null);

(cr106843_state[(3)] = null);

(cr106843_state[(1)] = null);

(cr106843_state[(2)] = null);

throw cr106843_exception;
}});
var cr106840_place_40 = (function (cr106843_state){
try{var cr106843_place_91 = missionary.core.unpark();
(cr106843_state[(0)] = cr106840_place_42);

(cr106843_state[(1)] = cr106843_place_91);

return cr106843_state;
}catch (e107361){var e106945 = e107361;
var cr106843_exception = e106945;
(cr106843_state[(0)] = null);

(cr106843_state[(1)] = null);

throw cr106843_exception;
}});
var cr106840_place_34 = (function (cr106843_state){
try{var cr106843_place_0 = (1);
var cr106843_place_1 = mixed_flow;
(cr106843_state[(0)] = cr106840_place_51);

return missionary.core.fork(cr106843_place_0,cr106843_place_1);
}catch (e107362){var e106922 = e107362;
var cr106843_exception = e106922;
(cr106843_state[(0)] = null);

throw cr106843_exception;
}});
var cr106840_place_36 = (function (cr106843_state){
try{var cr106843_place_36 = frontend.worker.rtc.client.new_task__pull_remote_data;
var cr106843_place_37 = repo;
var cr106843_place_38 = conn;
var cr106843_place_39 = graph_uuid;
var cr106843_place_40 = major_schema_version;
var cr106843_place_41 = date_formatter;
var cr106843_place_42 = get_ws_create_task__$1;
var cr106843_place_43 = add_log_fn;
var cr106843_place_44 = (function (){var G__106931 = cr106843_place_37;
var G__106932 = cr106843_place_38;
var G__106933 = cr106843_place_39;
var G__106934 = cr106843_place_40;
var G__106935 = cr106843_place_41;
var G__106936 = cr106843_place_42;
var G__106937 = cr106843_place_43;
var fexpr__106930 = cr106843_place_36;
var G__107365 = G__106931;
var G__107366 = G__106932;
var G__107367 = G__106933;
var G__107368 = G__106934;
var G__107369 = G__106935;
var G__107370 = G__106936;
var G__107371 = G__106937;
var fexpr__107364 = fexpr__106930;
return (fexpr__107364.cljs$core$IFn$_invoke$arity$7 ? fexpr__107364.cljs$core$IFn$_invoke$arity$7(G__107365,G__107366,G__107367,G__107368,G__107369,G__107370,G__107371) : fexpr__107364.call(null,G__107365,G__107366,G__107367,G__107368,G__107369,G__107370,G__107371));
})();
(cr106843_state[(0)] = cr106840_place_37);

return missionary.core.park(cr106843_place_44);
}catch (e107363){var e106929 = e107363;
var cr106843_exception = e106929;
(cr106843_state[(0)] = cr106840_place_45);

(cr106843_state[(2)] = null);

(cr106843_state[(3)] = cr106843_exception);

(cr106843_state[(4)] = true);

return cr106843_state;
}});
var cr106840_place_54 = (function (cr106843_state){
try{var cr106843_place_57 = frontend.worker.rtc.client.new_task__push_local_ops;
var cr106843_place_58 = repo;
var cr106843_place_59 = conn;
var cr106843_place_60 = graph_uuid;
var cr106843_place_61 = major_schema_version;
var cr106843_place_62 = date_formatter;
var cr106843_place_63 = get_ws_create_task__$1;
var cr106843_place_64 = _STAR_remote_profile_QMARK_;
var cr106843_place_65 = add_log_fn;
var cr106843_place_66 = (function (){var G__106986 = cr106843_place_58;
var G__106987 = cr106843_place_59;
var G__106988 = cr106843_place_60;
var G__106989 = cr106843_place_61;
var G__106990 = cr106843_place_62;
var G__106991 = cr106843_place_63;
var G__106992 = cr106843_place_64;
var G__106993 = cr106843_place_65;
var fexpr__106985 = cr106843_place_57;
var G__107374 = G__106986;
var G__107375 = G__106987;
var G__107376 = G__106988;
var G__107377 = G__106989;
var G__107378 = G__106990;
var G__107379 = G__106991;
var G__107380 = G__106992;
var G__107381 = G__106993;
var fexpr__107373 = fexpr__106985;
return (fexpr__107373.cljs$core$IFn$_invoke$arity$8 ? fexpr__107373.cljs$core$IFn$_invoke$arity$8(G__107374,G__107375,G__107376,G__107377,G__107378,G__107379,G__107380,G__107381) : fexpr__107373.call(null,G__107374,G__107375,G__107376,G__107377,G__107378,G__107379,G__107380,G__107381));
})();
(cr106843_state[(0)] = cr106840_place_49);

return missionary.core.park(cr106843_place_66);
}catch (e107372){var e106984 = e107372;
var cr106843_exception = e106984;
(cr106843_state[(0)] = null);

(cr106843_state[(1)] = null);

throw cr106843_exception;
}});
var cr106840_place_47 = (function (cr106843_state){
try{var cr106843_place_10 = null;
(cr106843_state[(0)] = cr106840_place_53);

(cr106843_state[(1)] = cr106843_place_10);

return cr106843_state;
}catch (e107382){var e106970 = e107382;
var cr106843_exception = e106970;
(cr106843_state[(0)] = null);

(cr106843_state[(1)] = null);

(cr106843_state[(2)] = null);

throw cr106843_exception;
}});
var cr106840_place_53 = (function (cr106843_state){
try{var cr106843_place_9 = (cr106843_state[(1)]);
var cr106843_place_13 = cr106843_place_9;
var cr106843_place_14 = null;
var G__106983 = cr106843_place_13;
var G__107384 = G__106983;
switch (G__107384) {
case "remote-update":
(cr106843_state[(0)] = cr106840_place_56);

(cr106843_state[(1)] = null);

(cr106843_state[(1)] = cr106843_place_14);

return cr106843_state;

break;
case "remote-asset-update":
(cr106843_state[(0)] = cr106840_place_50);

(cr106843_state[(1)] = null);

(cr106843_state[(1)] = cr106843_place_14);

return cr106843_state;

break;
case "local-update-check":
(cr106843_state[(0)] = cr106840_place_54);

(cr106843_state[(1)] = null);

(cr106843_state[(2)] = null);

(cr106843_state[(1)] = cr106843_place_14);

return cr106843_state;

break;
case "online-users-updated":
(cr106843_state[(0)] = cr106840_place_44);

(cr106843_state[(1)] = null);

(cr106843_state[(1)] = cr106843_place_14);

return cr106843_state;

break;
case "pull-remote-updates":
(cr106843_state[(0)] = cr106840_place_43);

(cr106843_state[(1)] = null);

(cr106843_state[(2)] = null);

(cr106843_state[(1)] = cr106843_place_14);

return cr106843_state;

break;
case "inject-users-info":
(cr106843_state[(0)] = cr106840_place_38);

(cr106843_state[(1)] = null);

(cr106843_state[(2)] = null);

(cr106843_state[(1)] = cr106843_place_14);

return cr106843_state;

break;
default:
(cr106843_state[(0)] = cr106840_place_52);

(cr106843_state[(2)] = null);

return cr106843_state;

}
}catch (e107383){var e106982 = e107383;
var cr106843_exception = e106982;
(cr106843_state[(0)] = null);

(cr106843_state[(1)] = null);

(cr106843_state[(2)] = null);

throw cr106843_exception;
}});
var cr106840_place_56 = (function (cr106843_state){
try{var cr106843_place_15 = null;
var cr106843_place_16 = false;
(cr106843_state[(0)] = cr106840_place_41);

(cr106843_state[(3)] = cr106843_place_15);

(cr106843_state[(4)] = cr106843_place_16);

return cr106843_state;
}catch (e107385){var e106995 = e107385;
var cr106843_exception = e106995;
(cr106843_state[(0)] = null);

(cr106843_state[(1)] = null);

(cr106843_state[(2)] = null);

throw cr106843_exception;
}});
var cr106840_place_39 = (function (cr106843_state){
try{var cr106843_place_85 = missionary.core.unpark();
(cr106843_state[(0)] = cr106840_place_42);

(cr106843_state[(1)] = cr106843_place_85);

return cr106843_state;
}catch (e107386){var e106944 = e107386;
var cr106843_exception = e106944;
(cr106843_state[(0)] = null);

(cr106843_state[(1)] = null);

throw cr106843_exception;
}});
var cr106840_place_50 = (function (cr106843_state){
try{var cr106843_place_2 = (cr106843_state[(2)]);
var cr106843_place_47 = frontend.worker.rtc.asset.new_task__emit_remote_asset_updates_from_push_asset_upload_updates;
var cr106843_place_48 = repo;
var cr106843_place_49 = cljs.core.deref;
var cr106843_place_50 = conn;
var cr106843_place_51 = (function (){var G__106975 = cr106843_place_50;
var fexpr__106974 = cr106843_place_49;
var G__107389 = G__106975;
var fexpr__107388 = fexpr__106974;
return (fexpr__107388.cljs$core$IFn$_invoke$arity$1 ? fexpr__107388.cljs$core$IFn$_invoke$arity$1(G__107389) : fexpr__107388.call(null,G__107389));
})();
var cr106843_place_52 = new cljs.core.Keyword(null,"value","value",305978217);
var cr106843_place_53 = cr106843_place_2;
var cr106843_place_54 = cr106843_place_52.cljs$core$IFn$_invoke$arity$1(cr106843_place_53);
var cr106843_place_55 = (function (){var G__106977 = cr106843_place_48;
var G__106978 = cr106843_place_51;
var G__106979 = cr106843_place_54;
var fexpr__106976 = cr106843_place_47;
var G__107391 = G__106977;
var G__107392 = G__106978;
var G__107393 = G__106979;
var fexpr__107390 = fexpr__106976;
return (fexpr__107390.cljs$core$IFn$_invoke$arity$3 ? fexpr__107390.cljs$core$IFn$_invoke$arity$3(G__107391,G__107392,G__107393) : fexpr__107390.call(null,G__107391,G__107392,G__107393));
})();
(cr106843_state[(0)] = cr106840_place_55);

(cr106843_state[(2)] = null);

return missionary.core.park(cr106843_place_55);
}catch (e107387){var e106973 = e107387;
var cr106843_exception = e106973;
(cr106843_state[(0)] = null);

(cr106843_state[(1)] = null);

(cr106843_state[(2)] = null);

throw cr106843_exception;
}});
var cr106840_place_57 = cloroutine.impl.coroutine;
var cr106840_place_58 = cljs.core.object_array;
var cr106840_place_59 = (5);
var cr106840_place_60 = (function (){var G__107395 = cr106840_place_59;
var fexpr__107394 = cr106840_place_58;
return (fexpr__107394.cljs$core$IFn$_invoke$arity$1 ? fexpr__107394.cljs$core$IFn$_invoke$arity$1(G__107395) : fexpr__107394.call(null,G__107395));
})();
var cr106840_place_61 = cr106840_place_60;
var cr106840_place_62 = (0);
var cr106840_place_63 = cr106840_place_34;
var cr106840_place_64 = (cr106840_place_61[cr106840_place_62] = cr106840_place_63);
var cr106840_place_65 = cr106840_place_60;
var cr106840_place_66 = (function (){var G__107397 = cr106840_place_65;
var fexpr__107396 = cr106840_place_57;
return (fexpr__107396.cljs$core$IFn$_invoke$arity$1 ? fexpr__107396.cljs$core$IFn$_invoke$arity$1(G__107397) : fexpr__107396.call(null,G__107397));
})();
var cr106840_place_67 = missionary.core.ap_run;
var cr106840_place_68 = (function (){var G__107399 = cr106840_place_66;
var G__107400 = cr106840_place_67;
var fexpr__107398 = cr106840_place_32;
return (fexpr__107398.cljs$core$IFn$_invoke$arity$2 ? fexpr__107398.cljs$core$IFn$_invoke$arity$2(G__107399,G__107400) : fexpr__107398.call(null,G__107399,G__107400));
})();
var cr106840_place_69 = (function (){var G__107402 = cr106840_place_30;
var G__107403 = cr106840_place_31;
var G__107404 = cr106840_place_68;
var fexpr__107401 = cr106840_place_29;
return (fexpr__107401.cljs$core$IFn$_invoke$arity$3 ? fexpr__107401.cljs$core$IFn$_invoke$arity$3(G__107402,G__107403,G__107404) : fexpr__107401.call(null,G__107402,G__107403,G__107404));
})();
(cr106840_state[(0)] = cr106840_block_3);

return missionary.core.park(cr106840_place_69);
}catch (e107222){var cr106840_exception = e107222;
(cr106840_state[(0)] = cr106840_block_4);

(cr106840_state[(2)] = cr106840_exception);

return cr106840_state;
}});
return cloroutine.impl.coroutine((function (){var G__107405 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__107405[(0)] = cr106840_block_0);

return G__107405;
})());
})(),missionary.core.sp_run))], null);
}));

(frontend.worker.rtc.core.create_rtc_loop.cljs$lang$maxFixedArity = (6));

/** @this {Function} */
(frontend.worker.rtc.core.create_rtc_loop.cljs$lang$applyTo = (function (seq106829){
var G__106830 = cljs.core.first(seq106829);
var seq106829__$1 = cljs.core.next(seq106829);
var G__106831 = cljs.core.first(seq106829__$1);
var seq106829__$2 = cljs.core.next(seq106829__$1);
var G__106832 = cljs.core.first(seq106829__$2);
var seq106829__$3 = cljs.core.next(seq106829__$2);
var G__106833 = cljs.core.first(seq106829__$3);
var seq106829__$4 = cljs.core.next(seq106829__$3);
var G__106834 = cljs.core.first(seq106829__$4);
var seq106829__$5 = cljs.core.next(seq106829__$4);
var G__106835 = cljs.core.first(seq106829__$5);
var seq106829__$6 = cljs.core.next(seq106829__$5);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__106830,G__106831,G__106832,G__106833,G__106834,G__106835,seq106829__$6);
}));

frontend.worker.rtc.core.empty_rtc_loop_metadata = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"*rtc-auto-push?","*rtc-auto-push?",-44092416),new cljs.core.Keyword(null,"user-uuid","user-uuid",-275954048),new cljs.core.Keyword(null,"canceler","canceler",1232384163),new cljs.core.Keyword(null,"*rtc-remote-profile?","*rtc-remote-profile?",751419973),new cljs.core.Keyword(null,"local-graph-schema-version","local-graph-schema-version",-211621207),new cljs.core.Keyword(null,"*online-users","*online-users",-1145442647),new cljs.core.Keyword(null,"remote-graph-schema-version","remote-graph-schema-version",-1202898069),new cljs.core.Keyword(null,"rtc-state-flow","rtc-state-flow",553472428),new cljs.core.Keyword(null,"*last-stop-exception","*last-stop-exception",1441670509),new cljs.core.Keyword(null,"*rtc-lock","*rtc-lock",-424509809),new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),new cljs.core.Keyword(null,"repo","repo",-1999060679)],[null,null,null,null,null,null,null,null,null,null,null,null]);
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.rtc !== 'undefined') && (typeof frontend.worker.rtc.core !== 'undefined') && (typeof frontend.worker.rtc.core._STAR_rtc_loop_metadata !== 'undefined')){
} else {
frontend.worker.rtc.core._STAR_rtc_loop_metadata = cljs.core.atom.cljs$core$IFn$_invoke$arity$variadic(frontend.worker.rtc.core.empty_rtc_loop_metadata,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"validator","validator",-1966190681),(function (v){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.keys(frontend.worker.rtc.core.empty_rtc_loop_metadata)),cljs.core.set(cljs.core.keys(v)));
})], 0));
}
/**
 * Return exception if validation failed
 */
frontend.worker.rtc.core.validate_rtc_start_conditions = (function frontend$worker$rtc$core$validate_rtc_start_conditions(repo,token){
var temp__5802__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5802__auto__)){
var conn = temp__5802__auto__;
var user_uuid = new cljs.core.Keyword(null,"sub","sub",-2093760025).cljs$core$IFn$_invoke$arity$1(frontend.worker.util.parse_jwt(token));
var graph_uuid = logseq.db.get_graph_rtc_uuid(cljs.core.deref(conn));
var schema_version = logseq.db.get_graph_schema_version(cljs.core.deref(conn));
var remote_schema_version = logseq.db.get_graph_remote_schema_version(cljs.core.deref(conn));
var app_schema_version = logseq.db.frontend.schema.version;
if(cljs.core.not(user_uuid)){
return cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Invalid token",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("rtc.exception","invalid-token","rtc.exception/invalid-token",-92409968)], null));
} else {
if(cljs.core.not(graph_uuid)){
return frontend.worker.rtc.exception.ex_local_not_rtc_graph;
} else {
if(cljs.core.not(schema_version)){
return cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Not found schema-version",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("rtc.exception","not-found-schema-version","rtc.exception/not-found-schema-version",-458822991)], null));
} else {
if(cljs.core.not(remote_schema_version)){
return cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Not found remote-schema-version",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("rtc.exception","not-found-remote-schema-version","rtc.exception/not-found-remote-schema-version",-201859051)], null));
} else {
if(cljs.core.truth_(cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.not_EQ_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.schema.major_version,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [app_schema_version,remote_schema_version,schema_version], null))))){
return cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("major schema version mismatch",new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("rtc.exception","major-schema-version-mismatched","rtc.exception/major-schema-version-mismatched",-1401332259),new cljs.core.Keyword(null,"sub-type","sub-type",-997954412),frontend.worker.rtc.branch_graph.compare_schemas(remote_schema_version,app_schema_version,schema_version),new cljs.core.Keyword(null,"app","app",-560961707),app_schema_version,new cljs.core.Keyword(null,"local","local",-1497766724),schema_version,new cljs.core.Keyword(null,"remote","remote",-1593576576),remote_schema_version], null));
} else {
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"conn","conn",278309663),conn,new cljs.core.Keyword(null,"user-uuid","user-uuid",-275954048),user_uuid,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid,new cljs.core.Keyword(null,"schema-version","schema-version",1117939594),schema_version,new cljs.core.Keyword(null,"remote-schema-version","remote-schema-version",-925454925),remote_schema_version,new cljs.core.Keyword(null,"date-formatter","date-formatter",-223324709),logseq.common.config.get_date_formatter(frontend.worker.state.get_config(repo))], null);

}
}
}
}
}
} else {
return cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Not found db-conn",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("rtc.exception","not-found-db-conn","rtc.exception/not-found-db-conn",-184822776),new cljs.core.Keyword(null,"repo","repo",-1999060679),repo], null));
}
});
frontend.worker.rtc.core.new_task__rtc_start_STAR_ = (function frontend$worker$rtc$core$new_task__rtc_start_STAR_(repo,token){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr107406_block_6 = (function frontend$worker$rtc$core$new_task__rtc_start_STAR__$_cr107406_block_6(cr107406_state){
try{var cr107406_place_89 = (cr107406_state[(12)]);
(cr107406_state[(0)] = cr107406_block_8);

(cr107406_state[(12)] = null);

(cr107406_state[(6)] = cr107406_place_89);

return cr107406_state;
}catch (e107480){var cr107406_exception = e107480;
(cr107406_state[(0)] = null);

(cr107406_state[(12)] = null);

(cr107406_state[(6)] = null);

throw cr107406_exception;
}});
var cr107406_block_3 = (function frontend$worker$rtc$core$new_task__rtc_start_STAR__$_cr107406_block_3(cr107406_state){
try{var cr107406_place_85 = missionary.core.unpark();
var cr107406_place_86 = cr107406_place_85;
var cr107406_place_87 = cljs.core.ExceptionInfo;
var cr107406_place_88 = (cr107406_place_86 instanceof cr107406_place_87);
var cr107406_place_89 = null;
if(cr107406_place_88){
(cr107406_state[(0)] = cr107406_block_5);

(cr107406_state[(2)] = null);

(cr107406_state[(1)] = null);

(cr107406_state[(3)] = null);

(cr107406_state[(5)] = null);

(cr107406_state[(8)] = null);

(cr107406_state[(9)] = null);

(cr107406_state[(4)] = null);

(cr107406_state[(10)] = null);

(cr107406_state[(7)] = null);

(cr107406_state[(11)] = null);

(cr107406_state[(1)] = cr107406_place_85);

(cr107406_state[(12)] = cr107406_place_89);

return cr107406_state;
} else {
(cr107406_state[(0)] = cr107406_block_4);

(cr107406_state[(12)] = cr107406_place_89);

return cr107406_state;
}
}catch (e107481){var cr107406_exception = e107481;
(cr107406_state[(0)] = null);

(cr107406_state[(2)] = null);

(cr107406_state[(1)] = null);

(cr107406_state[(3)] = null);

(cr107406_state[(5)] = null);

(cr107406_state[(8)] = null);

(cr107406_state[(9)] = null);

(cr107406_state[(4)] = null);

(cr107406_state[(6)] = null);

(cr107406_state[(10)] = null);

(cr107406_state[(7)] = null);

(cr107406_state[(11)] = null);

throw cr107406_exception;
}});
var cr107406_block_2 = (function frontend$worker$rtc$core$new_task__rtc_start_STAR__$_cr107406_block_2(cr107406_state){
try{var cr107406_place_35 = (cr107406_state[(1)]);
var cr107406_place_27 = (cr107406_state[(2)]);
var cr107406_place_23 = (cr107406_state[(3)]);
var cr107406_place_15 = (cr107406_state[(5)]);
var cr107406_place_40 = frontend.worker.rtc.core.create_rtc_loop;
var cr107406_place_41 = cr107406_place_23;
var cr107406_place_42 = cr107406_place_27;
var cr107406_place_43 = repo;
var cr107406_place_44 = cr107406_place_15;
var cr107406_place_45 = cr107406_place_35;
var cr107406_place_46 = token;
var cr107406_place_47 = (function (){var G__107484 = cr107406_place_41;
var G__107485 = cr107406_place_42;
var G__107486 = cr107406_place_43;
var G__107487 = cr107406_place_44;
var G__107488 = cr107406_place_45;
var G__107489 = cr107406_place_46;
var fexpr__107483 = cr107406_place_40;
return (fexpr__107483.cljs$core$IFn$_invoke$arity$6 ? fexpr__107483.cljs$core$IFn$_invoke$arity$6(G__107484,G__107485,G__107486,G__107487,G__107488,G__107489) : fexpr__107483.call(null,G__107484,G__107485,G__107486,G__107487,G__107488,G__107489));
})();
var cr107406_place_48 = cljs.core.__destructure_map;
var cr107406_place_49 = cr107406_place_47;
var cr107406_place_50 = (function (){var G__107491 = cr107406_place_49;
var fexpr__107490 = cr107406_place_48;
return (fexpr__107490.cljs$core$IFn$_invoke$arity$1 ? fexpr__107490.cljs$core$IFn$_invoke$arity$1(G__107491) : fexpr__107490.call(null,G__107491));
})();
var cr107406_place_51 = cljs.core.get;
var cr107406_place_52 = cr107406_place_50;
var cr107406_place_53 = new cljs.core.Keyword(null,"rtc-state-flow","rtc-state-flow",553472428);
var cr107406_place_54 = (function (){var G__107493 = cr107406_place_52;
var G__107494 = cr107406_place_53;
var fexpr__107492 = cr107406_place_51;
return (fexpr__107492.cljs$core$IFn$_invoke$arity$2 ? fexpr__107492.cljs$core$IFn$_invoke$arity$2(G__107493,G__107494) : fexpr__107492.call(null,G__107493,G__107494));
})();
var cr107406_place_55 = cljs.core.get;
var cr107406_place_56 = cr107406_place_50;
var cr107406_place_57 = new cljs.core.Keyword(null,"*rtc-auto-push?","*rtc-auto-push?",-44092416);
var cr107406_place_58 = (function (){var G__107496 = cr107406_place_56;
var G__107497 = cr107406_place_57;
var fexpr__107495 = cr107406_place_55;
return (fexpr__107495.cljs$core$IFn$_invoke$arity$2 ? fexpr__107495.cljs$core$IFn$_invoke$arity$2(G__107496,G__107497) : fexpr__107495.call(null,G__107496,G__107497));
})();
var cr107406_place_59 = cljs.core.get;
var cr107406_place_60 = cr107406_place_50;
var cr107406_place_61 = new cljs.core.Keyword(null,"*rtc-remote-profile?","*rtc-remote-profile?",751419973);
var cr107406_place_62 = (function (){var G__107499 = cr107406_place_60;
var G__107500 = cr107406_place_61;
var fexpr__107498 = cr107406_place_59;
return (fexpr__107498.cljs$core$IFn$_invoke$arity$2 ? fexpr__107498.cljs$core$IFn$_invoke$arity$2(G__107499,G__107500) : fexpr__107498.call(null,G__107499,G__107500));
})();
var cr107406_place_63 = cljs.core.get;
var cr107406_place_64 = cr107406_place_50;
var cr107406_place_65 = new cljs.core.Keyword(null,"rtc-loop-task","rtc-loop-task",1590035731);
var cr107406_place_66 = (function (){var G__107502 = cr107406_place_64;
var G__107503 = cr107406_place_65;
var fexpr__107501 = cr107406_place_63;
return (fexpr__107501.cljs$core$IFn$_invoke$arity$2 ? fexpr__107501.cljs$core$IFn$_invoke$arity$2(G__107502,G__107503) : fexpr__107501.call(null,G__107502,G__107503));
})();
var cr107406_place_67 = cljs.core.get;
var cr107406_place_68 = cr107406_place_50;
var cr107406_place_69 = new cljs.core.Keyword(null,"*online-users","*online-users",-1145442647);
var cr107406_place_70 = (function (){var G__107505 = cr107406_place_68;
var G__107506 = cr107406_place_69;
var fexpr__107504 = cr107406_place_67;
return (fexpr__107504.cljs$core$IFn$_invoke$arity$2 ? fexpr__107504.cljs$core$IFn$_invoke$arity$2(G__107505,G__107506) : fexpr__107504.call(null,G__107505,G__107506));
})();
var cr107406_place_71 = cljs.core.get;
var cr107406_place_72 = cr107406_place_50;
var cr107406_place_73 = new cljs.core.Keyword(null,"onstarted-task","onstarted-task",750035798);
var cr107406_place_74 = (function (){var G__107508 = cr107406_place_72;
var G__107509 = cr107406_place_73;
var fexpr__107507 = cr107406_place_71;
return (fexpr__107507.cljs$core$IFn$_invoke$arity$2 ? fexpr__107507.cljs$core$IFn$_invoke$arity$2(G__107508,G__107509) : fexpr__107507.call(null,G__107508,G__107509));
})();
var cr107406_place_75 = cljs.core.atom;
var cr107406_place_76 = null;
var cr107406_place_77 = (function (){var G__107511 = cr107406_place_76;
var fexpr__107510 = cr107406_place_75;
return (fexpr__107510.cljs$core$IFn$_invoke$arity$1 ? fexpr__107510.cljs$core$IFn$_invoke$arity$1(G__107511) : fexpr__107510.call(null,G__107511));
})();
var cr107406_place_78 = frontend.common.missionary.run_task;
var cr107406_place_79 = new cljs.core.Keyword(null,"rtc-loop-task","rtc-loop-task",1590035731);
var cr107406_place_80 = cr107406_place_66;
var cr107406_place_81 = new cljs.core.Keyword(null,"fail","fail",1706214930);
var cr107406_place_82 = (function (e){
cljs.core.reset_BANG_(cr107406_place_77,e);

return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.rtc.core",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"rtc-loop-task","rtc-loop-task",1590035731),e,new cljs.core.Keyword(null,"line","line",212345235),358], null)),null);
});
var cr107406_place_83 = (function (){var G__107513 = cr107406_place_79;
var G__107514 = cr107406_place_80;
var G__107515 = cr107406_place_81;
var G__107516 = cr107406_place_82;
var fexpr__107512 = cr107406_place_78;
return (fexpr__107512.cljs$core$IFn$_invoke$arity$4 ? fexpr__107512.cljs$core$IFn$_invoke$arity$4(G__107513,G__107514,G__107515,G__107516) : fexpr__107512.call(null,G__107513,G__107514,G__107515,G__107516));
})();
var cr107406_place_84 = cr107406_place_74;
(cr107406_state[(0)] = cr107406_block_3);

(cr107406_state[(1)] = null);

(cr107406_state[(5)] = null);

(cr107406_state[(1)] = cr107406_place_83);

(cr107406_state[(5)] = cr107406_place_58);

(cr107406_state[(8)] = cr107406_place_54);

(cr107406_state[(9)] = cr107406_place_70);

(cr107406_state[(10)] = cr107406_place_62);

(cr107406_state[(11)] = cr107406_place_77);

return missionary.core.park(cr107406_place_84);
}catch (e107482){var cr107406_exception = e107482;
(cr107406_state[(0)] = null);

(cr107406_state[(1)] = null);

(cr107406_state[(2)] = null);

(cr107406_state[(3)] = null);

(cr107406_state[(4)] = null);

(cr107406_state[(5)] = null);

(cr107406_state[(6)] = null);

(cr107406_state[(7)] = null);

throw cr107406_exception;
}});
var cr107406_block_8 = (function frontend$worker$rtc$core$new_task__rtc_start_STAR__$_cr107406_block_8(cr107406_state){
try{var cr107406_place_39 = (cr107406_state[(6)]);
(cr107406_state[(0)] = null);

(cr107406_state[(6)] = null);

return cr107406_place_39;
}catch (e107517){var cr107406_exception = e107517;
(cr107406_state[(0)] = null);

(cr107406_state[(6)] = null);

throw cr107406_exception;
}});
var cr107406_block_5 = (function frontend$worker$rtc$core$new_task__rtc_start_STAR__$_cr107406_block_5(cr107406_state){
try{var cr107406_place_85 = (cr107406_state[(1)]);
var cr107406_place_119 = cr107406_place_85;
(cr107406_state[(0)] = cr107406_block_6);

(cr107406_state[(1)] = null);

(cr107406_state[(12)] = cr107406_place_119);

return cr107406_state;
}catch (e107518){var cr107406_exception = e107518;
(cr107406_state[(0)] = null);

(cr107406_state[(1)] = null);

(cr107406_state[(12)] = null);

(cr107406_state[(6)] = null);

throw cr107406_exception;
}});
var cr107406_block_4 = (function frontend$worker$rtc$core$new_task__rtc_start_STAR__$_cr107406_block_4(cr107406_state){
try{var cr107406_place_27 = (cr107406_state[(2)]);
var cr107406_place_83 = (cr107406_state[(1)]);
var cr107406_place_23 = (cr107406_state[(3)]);
var cr107406_place_58 = (cr107406_state[(5)]);
var cr107406_place_54 = (cr107406_state[(8)]);
var cr107406_place_70 = (cr107406_state[(9)]);
var cr107406_place_31 = (cr107406_state[(4)]);
var cr107406_place_62 = (cr107406_state[(10)]);
var cr107406_place_19 = (cr107406_state[(7)]);
var cr107406_place_77 = (cr107406_state[(11)]);
var cr107406_place_90 = cljs.core.reset_BANG_;
var cr107406_place_91 = frontend.worker.rtc.core._STAR_rtc_loop_metadata;
var cr107406_place_92 = new cljs.core.Keyword(null,"*rtc-auto-push?","*rtc-auto-push?",-44092416);
var cr107406_place_93 = cr107406_place_58;
var cr107406_place_94 = new cljs.core.Keyword(null,"user-uuid","user-uuid",-275954048);
var cr107406_place_95 = cr107406_place_19;
var cr107406_place_96 = new cljs.core.Keyword(null,"canceler","canceler",1232384163);
var cr107406_place_97 = cr107406_place_83;
var cr107406_place_98 = new cljs.core.Keyword(null,"*rtc-remote-profile?","*rtc-remote-profile?",751419973);
var cr107406_place_99 = cr107406_place_62;
var cr107406_place_100 = new cljs.core.Keyword(null,"local-graph-schema-version","local-graph-schema-version",-211621207);
var cr107406_place_101 = cr107406_place_27;
var cr107406_place_102 = new cljs.core.Keyword(null,"*online-users","*online-users",-1145442647);
var cr107406_place_103 = cr107406_place_70;
var cr107406_place_104 = new cljs.core.Keyword(null,"remote-graph-schema-version","remote-graph-schema-version",-1202898069);
var cr107406_place_105 = cr107406_place_31;
var cr107406_place_106 = new cljs.core.Keyword(null,"rtc-state-flow","rtc-state-flow",553472428);
var cr107406_place_107 = cr107406_place_54;
var cr107406_place_108 = new cljs.core.Keyword(null,"*last-stop-exception","*last-stop-exception",1441670509);
var cr107406_place_109 = cr107406_place_77;
var cr107406_place_110 = new cljs.core.Keyword(null,"*rtc-lock","*rtc-lock",-424509809);
var cr107406_place_111 = frontend.worker.rtc.core._STAR_rtc_lock;
var cr107406_place_112 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr107406_place_113 = cr107406_place_23;
var cr107406_place_114 = new cljs.core.Keyword(null,"repo","repo",-1999060679);
var cr107406_place_115 = repo;
var cr107406_place_116 = cljs.core.with_meta(cljs.core.PersistentHashMap.fromArrays([cr107406_place_106,cr107406_place_98,cr107406_place_100,cr107406_place_102,cr107406_place_114,cr107406_place_110,cr107406_place_112,cr107406_place_108,cr107406_place_92,cr107406_place_96,cr107406_place_94,cr107406_place_104],[cr107406_place_107,cr107406_place_99,cr107406_place_101,cr107406_place_103,cr107406_place_115,cr107406_place_111,cr107406_place_113,cr107406_place_109,cr107406_place_93,cr107406_place_97,cr107406_place_95,cr107406_place_105]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr107406_place_117 = (function (){var G__107521 = cr107406_place_91;
var G__107522 = cr107406_place_116;
var fexpr__107520 = cr107406_place_90;
return (fexpr__107520.cljs$core$IFn$_invoke$arity$2 ? fexpr__107520.cljs$core$IFn$_invoke$arity$2(G__107521,G__107522) : fexpr__107520.call(null,G__107521,G__107522));
})();
var cr107406_place_118 = null;
(cr107406_state[(0)] = cr107406_block_6);

(cr107406_state[(2)] = null);

(cr107406_state[(1)] = null);

(cr107406_state[(3)] = null);

(cr107406_state[(5)] = null);

(cr107406_state[(8)] = null);

(cr107406_state[(9)] = null);

(cr107406_state[(4)] = null);

(cr107406_state[(10)] = null);

(cr107406_state[(7)] = null);

(cr107406_state[(11)] = null);

(cr107406_state[(12)] = cr107406_place_118);

return cr107406_state;
}catch (e107519){var cr107406_exception = e107519;
(cr107406_state[(0)] = null);

(cr107406_state[(2)] = null);

(cr107406_state[(1)] = null);

(cr107406_state[(3)] = null);

(cr107406_state[(5)] = null);

(cr107406_state[(8)] = null);

(cr107406_state[(12)] = null);

(cr107406_state[(9)] = null);

(cr107406_state[(4)] = null);

(cr107406_state[(6)] = null);

(cr107406_state[(10)] = null);

(cr107406_state[(7)] = null);

(cr107406_state[(11)] = null);

throw cr107406_exception;
}});
var cr107406_block_7 = (function frontend$worker$rtc$core$new_task__rtc_start_STAR__$_cr107406_block_7(cr107406_state){
try{var cr107406_place_11 = (cr107406_state[(1)]);
var cr107406_place_120 = cr107406_place_11;
(cr107406_state[(0)] = cr107406_block_8);

(cr107406_state[(1)] = null);

(cr107406_state[(6)] = cr107406_place_120);

return cr107406_state;
}catch (e107523){var cr107406_exception = e107523;
(cr107406_state[(0)] = null);

(cr107406_state[(1)] = null);

(cr107406_state[(6)] = null);

throw cr107406_exception;
}});
var cr107406_block_1 = (function frontend$worker$rtc$core$new_task__rtc_start_STAR__$_cr107406_block_1(cr107406_state){
try{var cr107406_place_3 = missionary.core.unpark();
var cr107406_place_4 = frontend.worker.rtc.core.validate_rtc_start_conditions;
var cr107406_place_5 = repo;
var cr107406_place_6 = token;
var cr107406_place_7 = (function (){var G__107526 = cr107406_place_5;
var G__107527 = cr107406_place_6;
var fexpr__107525 = cr107406_place_4;
return (fexpr__107525.cljs$core$IFn$_invoke$arity$2 ? fexpr__107525.cljs$core$IFn$_invoke$arity$2(G__107526,G__107527) : fexpr__107525.call(null,G__107526,G__107527));
})();
var cr107406_place_8 = cljs.core.__destructure_map;
var cr107406_place_9 = cr107406_place_7;
var cr107406_place_10 = (function (){var G__107529 = cr107406_place_9;
var fexpr__107528 = cr107406_place_8;
return (fexpr__107528.cljs$core$IFn$_invoke$arity$1 ? fexpr__107528.cljs$core$IFn$_invoke$arity$1(G__107529) : fexpr__107528.call(null,G__107529));
})();
var cr107406_place_11 = cr107406_place_10;
var cr107406_place_12 = cljs.core.get;
var cr107406_place_13 = cr107406_place_10;
var cr107406_place_14 = new cljs.core.Keyword(null,"conn","conn",278309663);
var cr107406_place_15 = (function (){var G__107531 = cr107406_place_13;
var G__107532 = cr107406_place_14;
var fexpr__107530 = cr107406_place_12;
return (fexpr__107530.cljs$core$IFn$_invoke$arity$2 ? fexpr__107530.cljs$core$IFn$_invoke$arity$2(G__107531,G__107532) : fexpr__107530.call(null,G__107531,G__107532));
})();
var cr107406_place_16 = cljs.core.get;
var cr107406_place_17 = cr107406_place_10;
var cr107406_place_18 = new cljs.core.Keyword(null,"user-uuid","user-uuid",-275954048);
var cr107406_place_19 = (function (){var G__107534 = cr107406_place_17;
var G__107535 = cr107406_place_18;
var fexpr__107533 = cr107406_place_16;
return (fexpr__107533.cljs$core$IFn$_invoke$arity$2 ? fexpr__107533.cljs$core$IFn$_invoke$arity$2(G__107534,G__107535) : fexpr__107533.call(null,G__107534,G__107535));
})();
var cr107406_place_20 = cljs.core.get;
var cr107406_place_21 = cr107406_place_10;
var cr107406_place_22 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr107406_place_23 = (function (){var G__107537 = cr107406_place_21;
var G__107538 = cr107406_place_22;
var fexpr__107536 = cr107406_place_20;
return (fexpr__107536.cljs$core$IFn$_invoke$arity$2 ? fexpr__107536.cljs$core$IFn$_invoke$arity$2(G__107537,G__107538) : fexpr__107536.call(null,G__107537,G__107538));
})();
var cr107406_place_24 = cljs.core.get;
var cr107406_place_25 = cr107406_place_10;
var cr107406_place_26 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr107406_place_27 = (function (){var G__107540 = cr107406_place_25;
var G__107541 = cr107406_place_26;
var fexpr__107539 = cr107406_place_24;
return (fexpr__107539.cljs$core$IFn$_invoke$arity$2 ? fexpr__107539.cljs$core$IFn$_invoke$arity$2(G__107540,G__107541) : fexpr__107539.call(null,G__107540,G__107541));
})();
var cr107406_place_28 = cljs.core.get;
var cr107406_place_29 = cr107406_place_10;
var cr107406_place_30 = new cljs.core.Keyword(null,"remote-schema-version","remote-schema-version",-925454925);
var cr107406_place_31 = (function (){var G__107543 = cr107406_place_29;
var G__107544 = cr107406_place_30;
var fexpr__107542 = cr107406_place_28;
return (fexpr__107542.cljs$core$IFn$_invoke$arity$2 ? fexpr__107542.cljs$core$IFn$_invoke$arity$2(G__107543,G__107544) : fexpr__107542.call(null,G__107543,G__107544));
})();
var cr107406_place_32 = cljs.core.get;
var cr107406_place_33 = cr107406_place_10;
var cr107406_place_34 = new cljs.core.Keyword(null,"date-formatter","date-formatter",-223324709);
var cr107406_place_35 = (function (){var G__107546 = cr107406_place_33;
var G__107547 = cr107406_place_34;
var fexpr__107545 = cr107406_place_32;
return (fexpr__107545.cljs$core$IFn$_invoke$arity$2 ? fexpr__107545.cljs$core$IFn$_invoke$arity$2(G__107546,G__107547) : fexpr__107545.call(null,G__107546,G__107547));
})();
var cr107406_place_36 = cr107406_place_11;
var cr107406_place_37 = cljs.core.ExceptionInfo;
var cr107406_place_38 = (cr107406_place_36 instanceof cr107406_place_37);
var cr107406_place_39 = null;
if(cr107406_place_38){
(cr107406_state[(0)] = cr107406_block_7);

(cr107406_state[(1)] = cr107406_place_11);

(cr107406_state[(6)] = cr107406_place_39);

return cr107406_state;
} else {
(cr107406_state[(0)] = cr107406_block_2);

(cr107406_state[(1)] = cr107406_place_35);

(cr107406_state[(2)] = cr107406_place_27);

(cr107406_state[(3)] = cr107406_place_23);

(cr107406_state[(4)] = cr107406_place_31);

(cr107406_state[(5)] = cr107406_place_15);

(cr107406_state[(6)] = cr107406_place_39);

(cr107406_state[(7)] = cr107406_place_19);

return cr107406_state;
}
}catch (e107524){var cr107406_exception = e107524;
(cr107406_state[(0)] = null);

throw cr107406_exception;
}});
var cr107406_block_0 = (function frontend$worker$rtc$core$new_task__rtc_start_STAR__$_cr107406_block_0(cr107406_state){
try{var cr107406_place_0 = frontend.worker.device.new_task__ensure_device_metadata_BANG_;
var cr107406_place_1 = token;
var cr107406_place_2 = (function (){var G__107550 = cr107406_place_1;
var fexpr__107549 = cr107406_place_0;
return (fexpr__107549.cljs$core$IFn$_invoke$arity$1 ? fexpr__107549.cljs$core$IFn$_invoke$arity$1(G__107550) : fexpr__107549.call(null,G__107550));
})();
(cr107406_state[(0)] = cr107406_block_1);

return missionary.core.park(cr107406_place_2);
}catch (e107548){var cr107406_exception = e107548;
(cr107406_state[(0)] = null);

throw cr107406_exception;
}});
return cloroutine.impl.coroutine((function (){var G__107551 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((13));
(G__107551[(0)] = cr107406_block_0);

return G__107551;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.core.new_task__rtc_start = (function frontend$worker$rtc$core$new_task__rtc_start(stop_before_start_QMARK_){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr107552_block_1 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_1(cr107552_state){
try{var cr107552_place_7 = (cr107552_state[(3)]);
var cr107552_place_10 = cr107552_place_7;
(cr107552_state[(0)] = cr107552_block_9);

(cr107552_state[(3)] = null);

(cr107552_state[(4)] = cr107552_place_10);

return cr107552_state;
}catch (e107617){var cr107552_exception = e107617;
(cr107552_state[(0)] = null);

(cr107552_state[(1)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(3)] = null);

(cr107552_state[(4)] = null);

throw cr107552_exception;
}});
var cr107552_block_17 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_17(cr107552_state){
try{var cr107552_place_36 = (cr107552_state[(4)]);
var cr107552_place_40 = cr107552_place_36;
var cr107552_place_41 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr107552_place_42 = cr107552_place_40;
var cr107552_place_43 = cr107552_place_41.cljs$core$IFn$_invoke$arity$1(cr107552_place_42);
var cr107552_place_44 = cr107552_place_43;
var cr107552_place_45 = cljs.core.Keyword;
var cr107552_place_46 = (cr107552_place_44 instanceof cr107552_place_45);
var cr107552_place_47 = null;
if(cr107552_place_46){
(cr107552_state[(0)] = cr107552_block_19);

(cr107552_state[(4)] = null);

(cr107552_state[(5)] = cr107552_place_43);

(cr107552_state[(4)] = cr107552_place_47);

return cr107552_state;
} else {
(cr107552_state[(0)] = cr107552_block_18);

(cr107552_state[(4)] = null);

(cr107552_state[(4)] = cr107552_place_47);

return cr107552_state;
}
}catch (e107618){var cr107552_exception = e107618;
(cr107552_state[(0)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(3)] = null);

(cr107552_state[(1)] = null);

(cr107552_state[(4)] = null);

throw cr107552_exception;
}});
var cr107552_block_4 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_4(cr107552_state){
try{var cr107552_place_3 = (cr107552_state[(2)]);
var cr107552_place_17 = cr107552_place_3;
var cr107552_place_18 = cr107552_place_17;
var cr107552_place_19 = null;
if(cljs.core.truth_(cr107552_place_18)){
(cr107552_state[(0)] = cr107552_block_6);

(cr107552_state[(6)] = cr107552_place_19);

return cr107552_state;
} else {
(cr107552_state[(0)] = cr107552_block_5);

(cr107552_state[(3)] = null);

(cr107552_state[(3)] = cr107552_place_17);

(cr107552_state[(6)] = cr107552_place_19);

return cr107552_state;
}
}catch (e107619){var cr107552_exception = e107619;
(cr107552_state[(0)] = null);

(cr107552_state[(1)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(3)] = null);

(cr107552_state[(5)] = null);

(cr107552_state[(4)] = null);

throw cr107552_exception;
}});
var cr107552_block_3 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_3(cr107552_state){
try{var cr107552_place_13 = (cr107552_state[(3)]);
var cr107552_place_16 = cr107552_place_13;
(cr107552_state[(0)] = cr107552_block_8);

(cr107552_state[(3)] = null);

(cr107552_state[(5)] = cr107552_place_16);

return cr107552_state;
}catch (e107620){var cr107552_exception = e107620;
(cr107552_state[(0)] = null);

(cr107552_state[(1)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(3)] = null);

(cr107552_state[(5)] = null);

(cr107552_state[(4)] = null);

throw cr107552_exception;
}});
var cr107552_block_8 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_8(cr107552_state){
try{var cr107552_place_15 = (cr107552_state[(5)]);
(cr107552_state[(0)] = cr107552_block_9);

(cr107552_state[(5)] = null);

(cr107552_state[(4)] = cr107552_place_15);

return cr107552_state;
}catch (e107621){var cr107552_exception = e107621;
(cr107552_state[(0)] = null);

(cr107552_state[(1)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(5)] = null);

(cr107552_state[(4)] = null);

throw cr107552_exception;
}});
var cr107552_block_14 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_14(cr107552_state){
try{var cr107552_place_1 = (cr107552_state[(1)]);
var cr107552_place_3 = (cr107552_state[(2)]);
var cr107552_place_25 = (cr107552_state[(4)]);
var cr107552_place_29 = frontend.worker.rtc.core.new_task__rtc_start_STAR_;
var cr107552_place_30 = cr107552_place_1;
var cr107552_place_31 = cr107552_place_3;
var cr107552_place_32 = (function (){var G__107624 = cr107552_place_30;
var G__107625 = cr107552_place_31;
var fexpr__107623 = cr107552_place_29;
return (fexpr__107623.cljs$core$IFn$_invoke$arity$2 ? fexpr__107623.cljs$core$IFn$_invoke$arity$2(G__107624,G__107625) : fexpr__107623.call(null,G__107624,G__107625));
})();
(cr107552_state[(0)] = cr107552_block_15);

(cr107552_state[(1)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(4)] = null);

return missionary.core.park(cr107552_place_32);
}catch (e107622){var cr107552_exception = e107622;
(cr107552_state[(0)] = null);

(cr107552_state[(1)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(3)] = null);

(cr107552_state[(4)] = null);

throw cr107552_exception;
}});
var cr107552_block_26 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_26(cr107552_state){
try{var cr107552_place_22 = (cr107552_state[(3)]);
(cr107552_state[(0)] = null);

(cr107552_state[(3)] = null);

return cr107552_place_22;
}catch (e107626){var cr107552_exception = e107626;
(cr107552_state[(0)] = null);

(cr107552_state[(3)] = null);

throw cr107552_exception;
}});
var cr107552_block_20 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_20(cr107552_state){
try{var cr107552_place_47 = (cr107552_state[(4)]);
var cr107552_place_51 = cr107552_place_47;
var cr107552_place_52 = null;
var G__107628 = cr107552_place_51;
switch (G__107628) {
case "rtc.exception/not-rtc-graph":
case "rtc.exception/major-schema-version-mismatched":
case "rtc.exception/lock-failed":
(cr107552_state[(0)] = cr107552_block_21);

(cr107552_state[(4)] = null);

(cr107552_state[(4)] = cr107552_place_52);

return cr107552_state;

break;
case "rtc.exception/not-found-db-conn":
(cr107552_state[(0)] = cr107552_block_22);

(cr107552_state[(4)] = null);

(cr107552_state[(4)] = cr107552_place_52);

return cr107552_state;

break;
default:
(cr107552_state[(0)] = cr107552_block_23);

(cr107552_state[(4)] = null);

(cr107552_state[(4)] = cr107552_place_52);

return cr107552_state;

}
}catch (e107627){var cr107552_exception = e107627;
(cr107552_state[(0)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(3)] = null);

(cr107552_state[(1)] = null);

(cr107552_state[(4)] = null);

throw cr107552_exception;
}});
var cr107552_block_5 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_5(cr107552_state){
try{var cr107552_place_17 = (cr107552_state[(3)]);
var cr107552_place_20 = cr107552_place_17;
(cr107552_state[(0)] = cr107552_block_7);

(cr107552_state[(3)] = null);

(cr107552_state[(6)] = cr107552_place_20);

return cr107552_state;
}catch (e107629){var cr107552_exception = e107629;
(cr107552_state[(0)] = null);

(cr107552_state[(1)] = null);

(cr107552_state[(6)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(5)] = null);

(cr107552_state[(3)] = null);

(cr107552_state[(4)] = null);

throw cr107552_exception;
}});
var cr107552_block_19 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_19(cr107552_state){
try{var cr107552_place_43 = (cr107552_state[(5)]);
var cr107552_place_49 = cr107552_place_43;
var cr107552_place_50 = cr107552_place_49.fqn;
(cr107552_state[(0)] = cr107552_block_20);

(cr107552_state[(5)] = null);

(cr107552_state[(4)] = cr107552_place_50);

return cr107552_state;
}catch (e107630){var cr107552_exception = e107630;
(cr107552_state[(0)] = null);

(cr107552_state[(5)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(3)] = null);

(cr107552_state[(1)] = null);

(cr107552_state[(4)] = null);

throw cr107552_exception;
}});
var cr107552_block_0 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_0(cr107552_state){
try{var cr107552_place_0 = frontend.worker.state.get_current_repo;
var cr107552_place_1 = (function (){var fexpr__107632 = cr107552_place_0;
return (fexpr__107632.cljs$core$IFn$_invoke$arity$0 ? fexpr__107632.cljs$core$IFn$_invoke$arity$0() : fexpr__107632.call(null));
})();
var cr107552_place_2 = frontend.worker.state.get_id_token;
var cr107552_place_3 = (function (){var fexpr__107633 = cr107552_place_2;
return (fexpr__107633.cljs$core$IFn$_invoke$arity$0 ? fexpr__107633.cljs$core$IFn$_invoke$arity$0() : fexpr__107633.call(null));
})();
var cr107552_place_4 = frontend.worker.state.get_datascript_conn;
var cr107552_place_5 = cr107552_place_1;
var cr107552_place_6 = (function (){var G__107635 = cr107552_place_5;
var fexpr__107634 = cr107552_place_4;
return (fexpr__107634.cljs$core$IFn$_invoke$arity$1 ? fexpr__107634.cljs$core$IFn$_invoke$arity$1(G__107635) : fexpr__107634.call(null,G__107635));
})();
var cr107552_place_7 = cr107552_place_1;
var cr107552_place_8 = cr107552_place_7;
var cr107552_place_9 = null;
if(cljs.core.truth_(cr107552_place_8)){
(cr107552_state[(0)] = cr107552_block_2);

(cr107552_state[(1)] = cr107552_place_1);

(cr107552_state[(2)] = cr107552_place_3);

(cr107552_state[(3)] = cr107552_place_6);

(cr107552_state[(4)] = cr107552_place_9);

return cr107552_state;
} else {
(cr107552_state[(0)] = cr107552_block_1);

(cr107552_state[(1)] = cr107552_place_1);

(cr107552_state[(2)] = cr107552_place_3);

(cr107552_state[(3)] = cr107552_place_7);

(cr107552_state[(4)] = cr107552_place_9);

return cr107552_state;
}
}catch (e107631){var cr107552_exception = e107631;
(cr107552_state[(0)] = null);

throw cr107552_exception;
}});
var cr107552_block_22 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_22(cr107552_state){
try{var cr107552_place_33 = (cr107552_state[(2)]);
var cr107552_place_65 = lambdaisland.glogi.log;
var cr107552_place_66 = "frontend.worker.rtc.core";
var cr107552_place_67 = new cljs.core.Keyword(null,"error","error",-978969032);
var cr107552_place_68 = cljs.core.identity;
var cr107552_place_69 = new cljs.core.Keyword(null,"rtc-start-failed","rtc-start-failed",112742546);
var cr107552_place_70 = cr107552_place_33;
var cr107552_place_71 = new cljs.core.Keyword(null,"line","line",212345235);
var cr107552_place_72 = 396;
var cr107552_place_73 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr107552_place_69,cr107552_place_70,cr107552_place_71,cr107552_place_72]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr107552_place_74 = (function (){var G__107638 = cr107552_place_73;
var fexpr__107637 = cr107552_place_68;
return (fexpr__107637.cljs$core$IFn$_invoke$arity$1 ? fexpr__107637.cljs$core$IFn$_invoke$arity$1(G__107638) : fexpr__107637.call(null,G__107638));
})();
var cr107552_place_75 = null;
var cr107552_place_76 = (function (){var G__107640 = cr107552_place_66;
var G__107641 = cr107552_place_67;
var G__107642 = cr107552_place_74;
var G__107643 = cr107552_place_75;
var fexpr__107639 = cr107552_place_65;
return (fexpr__107639.cljs$core$IFn$_invoke$arity$4 ? fexpr__107639.cljs$core$IFn$_invoke$arity$4(G__107640,G__107641,G__107642,G__107643) : fexpr__107639.call(null,G__107640,G__107641,G__107642,G__107643));
})();
(cr107552_state[(0)] = cr107552_block_24);

(cr107552_state[(4)] = cr107552_place_76);

return cr107552_state;
}catch (e107636){var cr107552_exception = e107636;
(cr107552_state[(0)] = null);

(cr107552_state[(4)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(3)] = null);

(cr107552_state[(1)] = null);

throw cr107552_exception;
}});
var cr107552_block_11 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_11(cr107552_state){
try{var cr107552_place_24 = stop_before_start_QMARK_;
var cr107552_place_25 = null;
if(cljs.core.truth_(cr107552_place_24)){
(cr107552_state[(0)] = cr107552_block_13);

(cr107552_state[(4)] = cr107552_place_25);

return cr107552_state;
} else {
(cr107552_state[(0)] = cr107552_block_12);

(cr107552_state[(4)] = cr107552_place_25);

return cr107552_state;
}
}catch (e107644){var cr107552_exception = e107644;
(cr107552_state[(0)] = null);

(cr107552_state[(1)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(3)] = null);

throw cr107552_exception;
}});
var cr107552_block_6 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_6(cr107552_state){
try{var cr107552_place_6 = (cr107552_state[(3)]);
var cr107552_place_21 = cr107552_place_6;
(cr107552_state[(0)] = cr107552_block_7);

(cr107552_state[(3)] = null);

(cr107552_state[(6)] = cr107552_place_21);

return cr107552_state;
}catch (e107645){var cr107552_exception = e107645;
(cr107552_state[(0)] = null);

(cr107552_state[(1)] = null);

(cr107552_state[(6)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(3)] = null);

(cr107552_state[(5)] = null);

(cr107552_state[(4)] = null);

throw cr107552_exception;
}});
var cr107552_block_21 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_21(cr107552_state){
try{var cr107552_place_33 = (cr107552_state[(2)]);
var cr107552_place_53 = lambdaisland.glogi.log;
var cr107552_place_54 = "frontend.worker.rtc.core";
var cr107552_place_55 = new cljs.core.Keyword(null,"info","info",-317069002);
var cr107552_place_56 = cljs.core.identity;
var cr107552_place_57 = new cljs.core.Keyword(null,"rtc-start-failed","rtc-start-failed",112742546);
var cr107552_place_58 = cr107552_place_33;
var cr107552_place_59 = new cljs.core.Keyword(null,"line","line",212345235);
var cr107552_place_60 = 393;
var cr107552_place_61 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr107552_place_57,cr107552_place_58,cr107552_place_59,cr107552_place_60]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr107552_place_62 = (function (){var G__107648 = cr107552_place_61;
var fexpr__107647 = cr107552_place_56;
return (fexpr__107647.cljs$core$IFn$_invoke$arity$1 ? fexpr__107647.cljs$core$IFn$_invoke$arity$1(G__107648) : fexpr__107647.call(null,G__107648));
})();
var cr107552_place_63 = null;
var cr107552_place_64 = (function (){var G__107650 = cr107552_place_54;
var G__107651 = cr107552_place_55;
var G__107652 = cr107552_place_62;
var G__107653 = cr107552_place_63;
var fexpr__107649 = cr107552_place_53;
return (fexpr__107649.cljs$core$IFn$_invoke$arity$4 ? fexpr__107649.cljs$core$IFn$_invoke$arity$4(G__107650,G__107651,G__107652,G__107653) : fexpr__107649.call(null,G__107650,G__107651,G__107652,G__107653));
})();
(cr107552_state[(0)] = cr107552_block_24);

(cr107552_state[(4)] = cr107552_place_64);

return cr107552_state;
}catch (e107646){var cr107552_exception = e107646;
(cr107552_state[(0)] = null);

(cr107552_state[(4)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(3)] = null);

(cr107552_state[(1)] = null);

throw cr107552_exception;
}});
var cr107552_block_15 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_15(cr107552_state){
try{var cr107552_place_33 = missionary.core.unpark();
var cr107552_place_34 = cljs.core.ex_data;
var cr107552_place_35 = cr107552_place_33;
var cr107552_place_36 = (function (){var G__107656 = cr107552_place_35;
var fexpr__107655 = cr107552_place_34;
return (fexpr__107655.cljs$core$IFn$_invoke$arity$1 ? fexpr__107655.cljs$core$IFn$_invoke$arity$1(G__107656) : fexpr__107655.call(null,G__107656));
})();
var cr107552_place_37 = cr107552_place_36;
var cr107552_place_38 = null;
if(cljs.core.truth_(cr107552_place_37)){
(cr107552_state[(0)] = cr107552_block_17);

(cr107552_state[(2)] = cr107552_place_33);

(cr107552_state[(4)] = cr107552_place_36);

(cr107552_state[(1)] = cr107552_place_38);

return cr107552_state;
} else {
(cr107552_state[(0)] = cr107552_block_16);

(cr107552_state[(1)] = cr107552_place_38);

return cr107552_state;
}
}catch (e107654){var cr107552_exception = e107654;
(cr107552_state[(0)] = null);

(cr107552_state[(3)] = null);

throw cr107552_exception;
}});
var cr107552_block_10 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_10(cr107552_state){
try{var cr107552_place_23 = null;
(cr107552_state[(0)] = cr107552_block_26);

(cr107552_state[(3)] = cr107552_place_23);

return cr107552_state;
}catch (e107657){var cr107552_exception = e107657;
(cr107552_state[(0)] = null);

(cr107552_state[(3)] = null);

throw cr107552_exception;
}});
var cr107552_block_24 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_24(cr107552_state){
try{var cr107552_place_52 = (cr107552_state[(4)]);
var cr107552_place_33 = (cr107552_state[(2)]);
var cr107552_place_89 = frontend.worker.rtc.exception.__GT_map;
var cr107552_place_90 = cr107552_place_33;
var cr107552_place_91 = (function (){var G__107660 = cr107552_place_90;
var fexpr__107659 = cr107552_place_89;
return (fexpr__107659.cljs$core$IFn$_invoke$arity$1 ? fexpr__107659.cljs$core$IFn$_invoke$arity$1(G__107660) : fexpr__107659.call(null,G__107660));
})();
(cr107552_state[(0)] = cr107552_block_25);

(cr107552_state[(4)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(1)] = cr107552_place_91);

return cr107552_state;
}catch (e107658){var cr107552_exception = e107658;
(cr107552_state[(0)] = null);

(cr107552_state[(4)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(3)] = null);

(cr107552_state[(1)] = null);

throw cr107552_exception;
}});
var cr107552_block_2 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_2(cr107552_state){
try{var cr107552_place_1 = (cr107552_state[(1)]);
var cr107552_place_11 = logseq.db.sqlite.util.db_based_graph_QMARK_;
var cr107552_place_12 = cr107552_place_1;
var cr107552_place_13 = (function (){var G__107663 = cr107552_place_12;
var fexpr__107662 = cr107552_place_11;
return (fexpr__107662.cljs$core$IFn$_invoke$arity$1 ? fexpr__107662.cljs$core$IFn$_invoke$arity$1(G__107663) : fexpr__107662.call(null,G__107663));
})();
var cr107552_place_14 = cr107552_place_13;
var cr107552_place_15 = null;
if(cljs.core.truth_(cr107552_place_14)){
(cr107552_state[(0)] = cr107552_block_4);

(cr107552_state[(5)] = cr107552_place_15);

return cr107552_state;
} else {
(cr107552_state[(0)] = cr107552_block_3);

(cr107552_state[(3)] = null);

(cr107552_state[(3)] = cr107552_place_13);

(cr107552_state[(5)] = cr107552_place_15);

return cr107552_state;
}
}catch (e107661){var cr107552_exception = e107661;
(cr107552_state[(0)] = null);

(cr107552_state[(1)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(3)] = null);

(cr107552_state[(4)] = null);

throw cr107552_exception;
}});
var cr107552_block_25 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_25(cr107552_state){
try{var cr107552_place_38 = (cr107552_state[(1)]);
(cr107552_state[(0)] = cr107552_block_26);

(cr107552_state[(1)] = null);

(cr107552_state[(3)] = cr107552_place_38);

return cr107552_state;
}catch (e107664){var cr107552_exception = e107664;
(cr107552_state[(0)] = null);

(cr107552_state[(3)] = null);

(cr107552_state[(1)] = null);

throw cr107552_exception;
}});
var cr107552_block_7 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_7(cr107552_state){
try{var cr107552_place_19 = (cr107552_state[(6)]);
(cr107552_state[(0)] = cr107552_block_8);

(cr107552_state[(6)] = null);

(cr107552_state[(5)] = cr107552_place_19);

return cr107552_state;
}catch (e107665){var cr107552_exception = e107665;
(cr107552_state[(0)] = null);

(cr107552_state[(1)] = null);

(cr107552_state[(6)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(5)] = null);

(cr107552_state[(4)] = null);

throw cr107552_exception;
}});
var cr107552_block_9 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_9(cr107552_state){
try{var cr107552_place_9 = (cr107552_state[(4)]);
var cr107552_place_22 = null;
if(cljs.core.truth_(cr107552_place_9)){
(cr107552_state[(0)] = cr107552_block_11);

(cr107552_state[(4)] = null);

(cr107552_state[(3)] = cr107552_place_22);

return cr107552_state;
} else {
(cr107552_state[(0)] = cr107552_block_10);

(cr107552_state[(1)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(4)] = null);

(cr107552_state[(3)] = cr107552_place_22);

return cr107552_state;
}
}catch (e107666){var cr107552_exception = e107666;
(cr107552_state[(0)] = null);

(cr107552_state[(1)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(4)] = null);

throw cr107552_exception;
}});
var cr107552_block_23 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_23(cr107552_state){
try{var cr107552_place_33 = (cr107552_state[(2)]);
var cr107552_place_77 = lambdaisland.glogi.log;
var cr107552_place_78 = "frontend.worker.rtc.core";
var cr107552_place_79 = new cljs.core.Keyword(null,"error","error",-978969032);
var cr107552_place_80 = cljs.core.identity;
var cr107552_place_81 = new cljs.core.Keyword(null,"BUG-unknown-error","BUG-unknown-error",-1808552765);
var cr107552_place_82 = cr107552_place_33;
var cr107552_place_83 = new cljs.core.Keyword(null,"line","line",212345235);
var cr107552_place_84 = 398;
var cr107552_place_85 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr107552_place_83,cr107552_place_84,cr107552_place_81,cr107552_place_82]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr107552_place_86 = (function (){var G__107669 = cr107552_place_85;
var fexpr__107668 = cr107552_place_80;
return (fexpr__107668.cljs$core$IFn$_invoke$arity$1 ? fexpr__107668.cljs$core$IFn$_invoke$arity$1(G__107669) : fexpr__107668.call(null,G__107669));
})();
var cr107552_place_87 = null;
var cr107552_place_88 = (function (){var G__107671 = cr107552_place_78;
var G__107672 = cr107552_place_79;
var G__107673 = cr107552_place_86;
var G__107674 = cr107552_place_87;
var fexpr__107670 = cr107552_place_77;
return (fexpr__107670.cljs$core$IFn$_invoke$arity$4 ? fexpr__107670.cljs$core$IFn$_invoke$arity$4(G__107671,G__107672,G__107673,G__107674) : fexpr__107670.call(null,G__107671,G__107672,G__107673,G__107674));
})();
(cr107552_state[(0)] = cr107552_block_24);

(cr107552_state[(4)] = cr107552_place_88);

return cr107552_state;
}catch (e107667){var cr107552_exception = e107667;
(cr107552_state[(0)] = null);

(cr107552_state[(4)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(3)] = null);

(cr107552_state[(1)] = null);

throw cr107552_exception;
}});
var cr107552_block_16 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_16(cr107552_state){
try{var cr107552_place_39 = null;
(cr107552_state[(0)] = cr107552_block_25);

(cr107552_state[(1)] = cr107552_place_39);

return cr107552_state;
}catch (e107675){var cr107552_exception = e107675;
(cr107552_state[(0)] = null);

(cr107552_state[(3)] = null);

(cr107552_state[(1)] = null);

throw cr107552_exception;
}});
var cr107552_block_12 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_12(cr107552_state){
try{var cr107552_place_26 = null;
(cr107552_state[(0)] = cr107552_block_14);

(cr107552_state[(4)] = cr107552_place_26);

return cr107552_state;
}catch (e107676){var cr107552_exception = e107676;
(cr107552_state[(0)] = null);

(cr107552_state[(1)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(3)] = null);

(cr107552_state[(4)] = null);

throw cr107552_exception;
}});
var cr107552_block_18 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_18(cr107552_state){
try{var cr107552_place_48 = null;
(cr107552_state[(0)] = cr107552_block_20);

(cr107552_state[(4)] = cr107552_place_48);

return cr107552_state;
}catch (e107677){var cr107552_exception = e107677;
(cr107552_state[(0)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(3)] = null);

(cr107552_state[(1)] = null);

(cr107552_state[(4)] = null);

throw cr107552_exception;
}});
var cr107552_block_13 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr107552_block_13(cr107552_state){
try{var cr107552_place_27 = frontend.worker.rtc.core.rtc_stop;
var cr107552_place_28 = (function (){var fexpr__107679 = cr107552_place_27;
return (fexpr__107679.cljs$core$IFn$_invoke$arity$0 ? fexpr__107679.cljs$core$IFn$_invoke$arity$0() : fexpr__107679.call(null));
})();
(cr107552_state[(0)] = cr107552_block_14);

(cr107552_state[(4)] = cr107552_place_28);

return cr107552_state;
}catch (e107678){var cr107552_exception = e107678;
(cr107552_state[(0)] = null);

(cr107552_state[(1)] = null);

(cr107552_state[(2)] = null);

(cr107552_state[(3)] = null);

(cr107552_state[(4)] = null);

throw cr107552_exception;
}});
return cloroutine.impl.coroutine((function (){var G__107680 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((7));
(G__107680[(0)] = cr107552_block_0);

return G__107680;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.core.rtc_stop = (function frontend$worker$rtc$core$rtc_stop(){
var temp__5804__auto__ = new cljs.core.Keyword(null,"canceler","canceler",1232384163).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.worker.rtc.core._STAR_rtc_loop_metadata));
if(cljs.core.truth_(temp__5804__auto__)){
var canceler = temp__5804__auto__;
(canceler.cljs$core$IFn$_invoke$arity$0 ? canceler.cljs$core$IFn$_invoke$arity$0() : canceler.call(null));

return cljs.core.reset_BANG_(frontend.worker.rtc.core._STAR_rtc_loop_metadata,frontend.worker.rtc.core.empty_rtc_loop_metadata);
} else {
return null;
}
});
frontend.worker.rtc.core.rtc_toggle_auto_push = (function frontend$worker$rtc$core$rtc_toggle_auto_push(){
var temp__5804__auto__ = new cljs.core.Keyword(null,"*rtc-auto-push?","*rtc-auto-push?",-44092416).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.worker.rtc.core._STAR_rtc_loop_metadata));
if(cljs.core.truth_(temp__5804__auto__)){
var _STAR_auto_push_QMARK_ = temp__5804__auto__;
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_auto_push_QMARK_,cljs.core.not);
} else {
return null;
}
});
frontend.worker.rtc.core.rtc_toggle_remote_profile = (function frontend$worker$rtc$core$rtc_toggle_remote_profile(){
var temp__5804__auto__ = new cljs.core.Keyword(null,"*rtc-remote-profile?","*rtc-remote-profile?",751419973).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.worker.rtc.core._STAR_rtc_loop_metadata));
if(cljs.core.truth_(temp__5804__auto__)){
var _STAR_rtc_remote_profile_QMARK_ = temp__5804__auto__;
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_rtc_remote_profile_QMARK_,cljs.core.not);
} else {
return null;
}
});
frontend.worker.rtc.core.new_task__get_graphs = (function frontend$worker$rtc$core$new_task__get_graphs(token){
var map__107681 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized(frontend.worker.rtc.ws_util.get_ws_url(token));
var map__107681__$1 = cljs.core.__destructure_map(map__107681);
var get_ws_create_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107681__$1,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002));
return missionary.core.join.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"graphs","graphs",-1584479112),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.worker.rtc.ws_util.send_AMPERSAND_recv(get_ws_create_task,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"action","action",-811238024),"list-graphs"], null))], 0));
});
/**
 * Return a task that return true if succeed
 */
frontend.worker.rtc.core.new_task__delete_graph = (function frontend$worker$rtc$core$new_task__delete_graph(token,graph_uuid,schema_version){
var map__107682 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized(frontend.worker.rtc.ws_util.get_ws_url(token));
var map__107682__$1 = cljs.core.__destructure_map(map__107682);
var get_ws_create_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107682__$1,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002));
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr107683_block_0 = (function frontend$worker$rtc$core$new_task__delete_graph_$_cr107683_block_0(cr107683_state){
try{var cr107683_place_0 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr107683_place_1 = get_ws_create_task;
var cr107683_place_2 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr107683_place_3 = "delete-graph";
var cr107683_place_4 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr107683_place_5 = graph_uuid;
var cr107683_place_6 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr107683_place_7 = schema_version;
var cr107683_place_8 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr107683_place_7);
var cr107683_place_9 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr107683_place_4,cr107683_place_5,cr107683_place_6,cr107683_place_8,cr107683_place_2,cr107683_place_3]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr107683_place_10 = (function (){var G__107709 = cr107683_place_1;
var G__107710 = cr107683_place_9;
var fexpr__107708 = cr107683_place_0;
return (fexpr__107708.cljs$core$IFn$_invoke$arity$2 ? fexpr__107708.cljs$core$IFn$_invoke$arity$2(G__107709,G__107710) : fexpr__107708.call(null,G__107709,G__107710));
})();
(cr107683_state[(0)] = cr107683_block_1);

return missionary.core.park(cr107683_place_10);
}catch (e107707){var cr107683_exception = e107707;
(cr107683_state[(0)] = null);

throw cr107683_exception;
}});
var cr107683_block_1 = (function frontend$worker$rtc$core$new_task__delete_graph_$_cr107683_block_1(cr107683_state){
try{var cr107683_place_11 = missionary.core.unpark();
var cr107683_place_12 = cljs.core.__destructure_map;
var cr107683_place_13 = cr107683_place_11;
var cr107683_place_14 = (function (){var G__107713 = cr107683_place_13;
var fexpr__107712 = cr107683_place_12;
return (fexpr__107712.cljs$core$IFn$_invoke$arity$1 ? fexpr__107712.cljs$core$IFn$_invoke$arity$1(G__107713) : fexpr__107712.call(null,G__107713));
})();
var cr107683_place_15 = cljs.core.get;
var cr107683_place_16 = cr107683_place_14;
var cr107683_place_17 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr107683_place_18 = (function (){var G__107715 = cr107683_place_16;
var G__107716 = cr107683_place_17;
var fexpr__107714 = cr107683_place_15;
return (fexpr__107714.cljs$core$IFn$_invoke$arity$2 ? fexpr__107714.cljs$core$IFn$_invoke$arity$2(G__107715,G__107716) : fexpr__107714.call(null,G__107715,G__107716));
})();
var cr107683_place_19 = cr107683_place_18;
var cr107683_place_20 = null;
if(cljs.core.truth_(cr107683_place_19)){
(cr107683_state[(0)] = cr107683_block_3);

(cr107683_state[(1)] = cr107683_place_18);

(cr107683_state[(2)] = cr107683_place_20);

return cr107683_state;
} else {
(cr107683_state[(0)] = cr107683_block_2);

(cr107683_state[(1)] = cr107683_place_18);

(cr107683_state[(2)] = cr107683_place_20);

return cr107683_state;
}
}catch (e107711){var cr107683_exception = e107711;
(cr107683_state[(0)] = null);

throw cr107683_exception;
}});
var cr107683_block_2 = (function frontend$worker$rtc$core$new_task__delete_graph_$_cr107683_block_2(cr107683_state){
try{var cr107683_place_21 = null;
(cr107683_state[(0)] = cr107683_block_4);

(cr107683_state[(2)] = cr107683_place_21);

return cr107683_state;
}catch (e107717){var cr107683_exception = e107717;
(cr107683_state[(0)] = null);

(cr107683_state[(1)] = null);

(cr107683_state[(2)] = null);

throw cr107683_exception;
}});
var cr107683_block_3 = (function frontend$worker$rtc$core$new_task__delete_graph_$_cr107683_block_3(cr107683_state){
try{var cr107683_place_18 = (cr107683_state[(1)]);
var cr107683_place_22 = lambdaisland.glogi.log;
var cr107683_place_23 = "frontend.worker.rtc.core";
var cr107683_place_24 = new cljs.core.Keyword(null,"info","info",-317069002);
var cr107683_place_25 = cljs.core.identity;
var cr107683_place_26 = new cljs.core.Keyword("frontend.worker.rtc.core","delete-graph-failed","frontend.worker.rtc.core/delete-graph-failed",-608725598);
var cr107683_place_27 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr107683_place_28 = graph_uuid;
var cr107683_place_29 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr107683_place_30 = cr107683_place_18;
var cr107683_place_31 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr107683_place_27,cr107683_place_28,cr107683_place_29,cr107683_place_30]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr107683_place_32 = new cljs.core.Keyword(null,"line","line",212345235);
var cr107683_place_33 = 433;
var cr107683_place_34 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr107683_place_32,cr107683_place_33,cr107683_place_26,cr107683_place_31]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr107683_place_35 = (function (){var G__107720 = cr107683_place_34;
var fexpr__107719 = cr107683_place_25;
return (fexpr__107719.cljs$core$IFn$_invoke$arity$1 ? fexpr__107719.cljs$core$IFn$_invoke$arity$1(G__107720) : fexpr__107719.call(null,G__107720));
})();
var cr107683_place_36 = null;
var cr107683_place_37 = (function (){var G__107722 = cr107683_place_23;
var G__107723 = cr107683_place_24;
var G__107724 = cr107683_place_35;
var G__107725 = cr107683_place_36;
var fexpr__107721 = cr107683_place_22;
return (fexpr__107721.cljs$core$IFn$_invoke$arity$4 ? fexpr__107721.cljs$core$IFn$_invoke$arity$4(G__107722,G__107723,G__107724,G__107725) : fexpr__107721.call(null,G__107722,G__107723,G__107724,G__107725));
})();
(cr107683_state[(0)] = cr107683_block_4);

(cr107683_state[(2)] = cr107683_place_37);

return cr107683_state;
}catch (e107718){var cr107683_exception = e107718;
(cr107683_state[(0)] = null);

(cr107683_state[(1)] = null);

(cr107683_state[(2)] = null);

throw cr107683_exception;
}});
var cr107683_block_4 = (function frontend$worker$rtc$core$new_task__delete_graph_$_cr107683_block_4(cr107683_state){
try{var cr107683_place_18 = (cr107683_state[(1)]);
var cr107683_place_20 = (cr107683_state[(2)]);
var cr107683_place_38 = cljs.core.boolean$;
var cr107683_place_39 = cr107683_place_18;
var cr107683_place_40 = null;
var cr107683_place_41 = (cr107683_place_39 == cr107683_place_40);
var cr107683_place_42 = (function (){var G__107728 = cr107683_place_41;
var fexpr__107727 = cr107683_place_38;
return (fexpr__107727.cljs$core$IFn$_invoke$arity$1 ? fexpr__107727.cljs$core$IFn$_invoke$arity$1(G__107728) : fexpr__107727.call(null,G__107728));
})();
(cr107683_state[(0)] = null);

(cr107683_state[(1)] = null);

(cr107683_state[(2)] = null);

return cr107683_place_42;
}catch (e107726){var cr107683_exception = e107726;
(cr107683_state[(0)] = null);

(cr107683_state[(1)] = null);

(cr107683_state[(2)] = null);

throw cr107683_exception;
}});
return cloroutine.impl.coroutine((function (){var G__107729 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__107729[(0)] = cr107683_block_0);

return G__107729;
})());
})(),missionary.core.sp_run);
});
/**
 * Return a task that return users-info about the graph.
 */
frontend.worker.rtc.core.new_task__get_users_info = (function frontend$worker$rtc$core$new_task__get_users_info(token,graph_uuid){
var map__107730 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized(frontend.worker.rtc.ws_util.get_ws_url(token));
var map__107730__$1 = cljs.core.__destructure_map(map__107730);
var get_ws_create_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107730__$1,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002));
return missionary.core.join.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"users","users",-713552705),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.worker.rtc.ws_util.send_AMPERSAND_recv(get_ws_create_task,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"action","action",-811238024),"get-users-info",new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid], null))], 0));
});
frontend.worker.rtc.core.new_task__inject_users_info = (function frontend$worker$rtc$core$new_task__inject_users_info(token,graph_uuid,major_schema_version){
var map__107731 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized(frontend.worker.rtc.ws_util.get_ws_url(token));
var map__107731__$1 = cljs.core.__destructure_map(map__107731);
var get_ws_create_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107731__$1,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002));
return frontend.worker.rtc.ws_util.send_AMPERSAND_recv(get_ws_create_task,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"action","action",-811238024),"inject-users-info",new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid,new cljs.core.Keyword(null,"schema-version","schema-version",1117939594),cljs.core.str.cljs$core$IFn$_invoke$arity$1(major_schema_version)], null));
});
frontend.worker.rtc.core.new_task__grant_access_to_others = (function frontend$worker$rtc$core$new_task__grant_access_to_others(var_args){
var args__5732__auto__ = [];
var len__5726__auto___108119 = arguments.length;
var i__5727__auto___108120 = (0);
while(true){
if((i__5727__auto___108120 < len__5726__auto___108119)){
args__5732__auto__.push((arguments[i__5727__auto___108120]));

var G__108121 = (i__5727__auto___108120 + (1));
i__5727__auto___108120 = G__108121;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.worker.rtc.core.new_task__grant_access_to_others.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.worker.rtc.core.new_task__grant_access_to_others.cljs$core$IFn$_invoke$arity$variadic = (function (token,graph_uuid,p__107735){
var map__107736 = p__107735;
var map__107736__$1 = cljs.core.__destructure_map(map__107736);
var target_user_uuids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107736__$1,new cljs.core.Keyword(null,"target-user-uuids","target-user-uuids",-739511872));
var target_user_emails = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107736__$1,new cljs.core.Keyword(null,"target-user-emails","target-user-emails",-25552368));
var map__107737 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized(frontend.worker.rtc.ws_util.get_ws_url(token));
var map__107737__$1 = cljs.core.__destructure_map(map__107737);
var get_ws_create_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107737__$1,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002));
return frontend.worker.rtc.ws_util.send_AMPERSAND_recv(get_ws_create_task,(function (){var G__107738 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"action","action",-811238024),"grant-access",new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid], null);
var G__107738__$1 = (cljs.core.truth_(target_user_uuids)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__107738,new cljs.core.Keyword(null,"target-user-uuids","target-user-uuids",-739511872),target_user_uuids):G__107738);
if(cljs.core.truth_(target_user_emails)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__107738__$1,new cljs.core.Keyword(null,"target-user-emails","target-user-emails",-25552368),target_user_emails);
} else {
return G__107738__$1;
}
})());
}));

(frontend.worker.rtc.core.new_task__grant_access_to_others.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.worker.rtc.core.new_task__grant_access_to_others.cljs$lang$applyTo = (function (seq107732){
var G__107733 = cljs.core.first(seq107732);
var seq107732__$1 = cljs.core.next(seq107732);
var G__107734 = cljs.core.first(seq107732__$1);
var seq107732__$2 = cljs.core.next(seq107732__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__107733,G__107734,seq107732__$2);
}));

/**
 * Return a task that return map [:ex-data :ex-message :versions]
 */
frontend.worker.rtc.core.new_task__get_block_content_versions = (function frontend$worker$rtc$core$new_task__get_block_content_versions(token,graph_uuid,block_uuid){
var map__107739 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized(frontend.worker.rtc.ws_util.get_ws_url(token));
var map__107739__$1 = cljs.core.__destructure_map(map__107739);
var get_ws_create_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107739__$1,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002));
return missionary.core.join.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"versions","versions",536521978),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.worker.rtc.ws_util.send_AMPERSAND_recv(get_ws_create_task,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"action","action",-811238024),"query-block-content-versions",new cljs.core.Keyword(null,"block-uuids","block-uuids",-1313492773),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_uuid], null),new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid], null))], 0));
});
frontend.worker.rtc.core.create_get_state_flow_STAR_ = (function (){var rtc_loop_metadata_flow = missionary.core.watch(frontend.worker.rtc.core._STAR_rtc_loop_metadata);
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr107740_block_22 = (function frontend$worker$rtc$core$cr107740_block_22(cr107740_state){
try{var cr107740_place_92 = (cr107740_state[(1)]);
(cr107740_state[(0)] = cr107740_block_23);

(cr107740_state[(1)] = null);

(cr107740_state[(3)] = cr107740_place_92);

return cr107740_state;
}catch (e107828){var cr107740_exception = e107828;
(cr107740_state[(0)] = cr107740_block_23);

(cr107740_state[(1)] = null);

(cr107740_state[(13)] = true);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_3 = (function frontend$worker$rtc$core$cr107740_block_3(cr107740_state){
try{var cr107740_place_51 = (cr107740_state[(15)]);
var cr107740_place_54 = cr107740_place_51;
(cr107740_state[(0)] = cr107740_block_11);

(cr107740_state[(15)] = null);

(cr107740_state[(14)] = cr107740_place_54);

return cr107740_state;
}catch (e107829){var cr107740_exception = e107829;
(cr107740_state[(0)] = cr107740_block_16);

(cr107740_state[(1)] = null);

(cr107740_state[(2)] = null);

(cr107740_state[(14)] = null);

(cr107740_state[(4)] = null);

(cr107740_state[(5)] = null);

(cr107740_state[(15)] = null);

(cr107740_state[(6)] = null);

(cr107740_state[(7)] = null);

(cr107740_state[(8)] = null);

(cr107740_state[(9)] = null);

(cr107740_state[(10)] = null);

(cr107740_state[(11)] = null);

(cr107740_state[(12)] = null);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_6 = (function frontend$worker$rtc$core$cr107740_block_6(cr107740_state){
try{var cr107740_place_16 = (cr107740_state[(12)]);
var cr107740_place_59 = cr107740_place_16;
var cr107740_place_60 = cr107740_place_59;
var cr107740_place_61 = null;
if(cljs.core.truth_(cr107740_place_60)){
(cr107740_state[(0)] = cr107740_block_8);

(cr107740_state[(16)] = cr107740_place_61);

return cr107740_state;
} else {
(cr107740_state[(0)] = cr107740_block_7);

(cr107740_state[(17)] = cr107740_place_59);

(cr107740_state[(16)] = cr107740_place_61);

return cr107740_state;
}
}catch (e107830){var cr107740_exception = e107830;
(cr107740_state[(0)] = cr107740_block_16);

(cr107740_state[(1)] = null);

(cr107740_state[(2)] = null);

(cr107740_state[(14)] = null);

(cr107740_state[(15)] = null);

(cr107740_state[(4)] = null);

(cr107740_state[(5)] = null);

(cr107740_state[(6)] = null);

(cr107740_state[(7)] = null);

(cr107740_state[(8)] = null);

(cr107740_state[(9)] = null);

(cr107740_state[(10)] = null);

(cr107740_state[(11)] = null);

(cr107740_state[(12)] = null);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_23 = (function frontend$worker$rtc$core$cr107740_block_23(cr107740_state){
try{var cr107740_place_49 = (cr107740_state[(3)]);
var cr107740_place_50 = (cr107740_state[(13)]);
var cr107740_place_100 = (cljs.core.truth_(cr107740_place_50)?(function(){throw cr107740_place_49})():cr107740_place_49);
(cr107740_state[(0)] = null);

(cr107740_state[(3)] = null);

(cr107740_state[(13)] = null);

return cr107740_place_100;
}catch (e107831){var cr107740_exception = e107831;
(cr107740_state[(0)] = null);

(cr107740_state[(3)] = null);

(cr107740_state[(13)] = null);

throw cr107740_exception;
}});
var cr107740_block_20 = (function frontend$worker$rtc$core$cr107740_block_20(cr107740_state){
try{var cr107740_place_94 = (cr107740_state[(2)]);
(cr107740_state[(0)] = cr107740_block_22);

(cr107740_state[(2)] = null);

(cr107740_state[(1)] = cr107740_place_94);

return cr107740_state;
}catch (e107832){var cr107740_exception = e107832;
(cr107740_state[(0)] = cr107740_block_23);

(cr107740_state[(1)] = null);

(cr107740_state[(2)] = null);

(cr107740_state[(13)] = true);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_8 = (function frontend$worker$rtc$core$cr107740_block_8(cr107740_state){
try{var cr107740_place_20 = (cr107740_state[(8)]);
var cr107740_place_63 = cr107740_place_20;
(cr107740_state[(0)] = cr107740_block_9);

(cr107740_state[(16)] = cr107740_place_63);

return cr107740_state;
}catch (e107833){var cr107740_exception = e107833;
(cr107740_state[(0)] = cr107740_block_16);

(cr107740_state[(16)] = null);

(cr107740_state[(1)] = null);

(cr107740_state[(2)] = null);

(cr107740_state[(14)] = null);

(cr107740_state[(15)] = null);

(cr107740_state[(4)] = null);

(cr107740_state[(5)] = null);

(cr107740_state[(6)] = null);

(cr107740_state[(7)] = null);

(cr107740_state[(8)] = null);

(cr107740_state[(9)] = null);

(cr107740_state[(10)] = null);

(cr107740_state[(11)] = null);

(cr107740_state[(12)] = null);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_4 = (function frontend$worker$rtc$core$cr107740_block_4(cr107740_state){
try{var cr107740_place_40 = (cr107740_state[(4)]);
var cr107740_place_55 = cr107740_place_40;
var cr107740_place_56 = cr107740_place_55;
var cr107740_place_57 = null;
if(cljs.core.truth_(cr107740_place_56)){
(cr107740_state[(0)] = cr107740_block_6);

(cr107740_state[(15)] = cr107740_place_57);

return cr107740_state;
} else {
(cr107740_state[(0)] = cr107740_block_5);

(cr107740_state[(16)] = cr107740_place_55);

(cr107740_state[(15)] = cr107740_place_57);

return cr107740_state;
}
}catch (e107834){var cr107740_exception = e107834;
(cr107740_state[(0)] = cr107740_block_16);

(cr107740_state[(1)] = null);

(cr107740_state[(2)] = null);

(cr107740_state[(14)] = null);

(cr107740_state[(4)] = null);

(cr107740_state[(5)] = null);

(cr107740_state[(6)] = null);

(cr107740_state[(7)] = null);

(cr107740_state[(8)] = null);

(cr107740_state[(9)] = null);

(cr107740_state[(10)] = null);

(cr107740_state[(11)] = null);

(cr107740_state[(12)] = null);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_0 = (function frontend$worker$rtc$core$cr107740_block_0(cr107740_state){
try{var cr107740_place_0 = rtc_loop_metadata_flow;
(cr107740_state[(0)] = cr107740_block_1);

return missionary.core.switch$(cr107740_place_0);
}catch (e107835){var cr107740_exception = e107835;
(cr107740_state[(0)] = null);

throw cr107740_exception;
}});
var cr107740_block_19 = (function frontend$worker$rtc$core$cr107740_block_19(cr107740_state){
try{var cr107740_place_49 = (cr107740_state[(3)]);
var cr107740_place_96 = cr107740_place_49;
var cr107740_place_97 = (function(){throw cr107740_place_96})();
(cr107740_state[(0)] = null);

(cr107740_state[(3)] = null);

(cr107740_state[(13)] = null);

return null;
}catch (e107836){var cr107740_exception = e107836;
(cr107740_state[(0)] = cr107740_block_23);

(cr107740_state[(13)] = true);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_16 = (function frontend$worker$rtc$core$cr107740_block_16(cr107740_state){
try{var cr107740_place_49 = (cr107740_state[(3)]);
var cr107740_place_89 = cr107740_place_49;
var cr107740_place_90 = missionary.Cancelled;
var cr107740_place_91 = (cr107740_place_89 instanceof cr107740_place_90);
var cr107740_place_92 = null;
if(cr107740_place_91){
(cr107740_state[(0)] = cr107740_block_21);

(cr107740_state[(1)] = cr107740_place_92);

return cr107740_state;
} else {
(cr107740_state[(0)] = cr107740_block_17);

(cr107740_state[(1)] = cr107740_place_92);

return cr107740_state;
}
}catch (e107837){var cr107740_exception = e107837;
(cr107740_state[(0)] = cr107740_block_23);

(cr107740_state[(13)] = true);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_13 = (function frontend$worker$rtc$core$cr107740_block_13(cr107740_state){
try{var cr107740_place_36 = (cr107740_state[(1)]);
var cr107740_place_24 = (cr107740_state[(2)]);
var cr107740_place_40 = (cr107740_state[(4)]);
var cr107740_place_8 = (cr107740_state[(5)]);
var cr107740_place_28 = (cr107740_state[(6)]);
var cr107740_place_12 = (cr107740_state[(7)]);
var cr107740_place_20 = (cr107740_state[(8)]);
var cr107740_place_48 = (cr107740_state[(9)]);
var cr107740_place_44 = (cr107740_state[(10)]);
var cr107740_place_32 = (cr107740_state[(11)]);
var cr107740_place_16 = (cr107740_state[(12)]);
var cr107740_place_66 = missionary.core.latest;
var cr107740_place_67 = (function (rtc_state,rtc_auto_push_QMARK_,rtc_remote_profile_QMARK_,rtc_lock,online_users,pending_local_ops_count,p__107743){
var vec__107744 = p__107743;
var local_tx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107744,(0),null);
var remote_tx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__107744,(1),null);
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"rtc-lock","rtc-lock",1338966560),new cljs.core.Keyword(null,"user-uuid","user-uuid",-275954048),new cljs.core.Keyword(null,"last-stop-exception-ex-data","last-stop-exception-ex-data",800047332),new cljs.core.Keyword(null,"rtc-state","rtc-state",1931374921),new cljs.core.Keyword(null,"local-graph-schema-version","local-graph-schema-version",-211621207),new cljs.core.Keyword(null,"local-tx","local-tx",1729212201),new cljs.core.Keyword(null,"remote-graph-schema-version","remote-graph-schema-version",-1202898069),new cljs.core.Keyword(null,"remote-profile?","remote-profile?",-1314795473),new cljs.core.Keyword(null,"remote-tx","remote-tx",-1423802481),new cljs.core.Keyword(null,"auto-push?","auto-push?",674534960),new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),new cljs.core.Keyword(null,"unpushed-block-update-count","unpushed-block-update-count",-387210371),new cljs.core.Keyword(null,"online-users","online-users",-747563810)],[rtc_lock,cr107740_place_12,(function (){var G__107747 = cr107740_place_44;
var G__107747__$1 = (cljs.core.truth_((G__107747 == null))?null:cljs.core.deref(G__107747));
if(cljs.core.truth_((G__107747__$1 == null))){
return null;
} else {
return cljs.core.ex_data(G__107747__$1);
}
})(),rtc_state,logseq.db.frontend.schema.schema_version__GT_string(cr107740_place_28),local_tx,logseq.db.frontend.schema.schema_version__GT_string(cr107740_place_36),rtc_remote_profile_QMARK_,remote_tx,rtc_auto_push_QMARK_,cr107740_place_48,pending_local_ops_count,online_users]);
});
var cr107740_place_68 = cr107740_place_40;
var cr107740_place_69 = missionary.core.watch;
var cr107740_place_70 = cr107740_place_16;
var cr107740_place_71 = (function (){var G__107840 = cr107740_place_70;
var fexpr__107839 = cr107740_place_69;
return (fexpr__107839.cljs$core$IFn$_invoke$arity$1 ? fexpr__107839.cljs$core$IFn$_invoke$arity$1(G__107840) : fexpr__107839.call(null,G__107840));
})();
var cr107740_place_72 = missionary.core.watch;
var cr107740_place_73 = cr107740_place_24;
var cr107740_place_74 = (function (){var G__107842 = cr107740_place_73;
var fexpr__107841 = cr107740_place_72;
return (fexpr__107841.cljs$core$IFn$_invoke$arity$1 ? fexpr__107841.cljs$core$IFn$_invoke$arity$1(G__107842) : fexpr__107841.call(null,G__107842));
})();
var cr107740_place_75 = missionary.core.watch;
var cr107740_place_76 = cr107740_place_20;
var cr107740_place_77 = (function (){var G__107844 = cr107740_place_76;
var fexpr__107843 = cr107740_place_75;
return (fexpr__107843.cljs$core$IFn$_invoke$arity$1 ? fexpr__107843.cljs$core$IFn$_invoke$arity$1(G__107844) : fexpr__107843.call(null,G__107844));
})();
var cr107740_place_78 = missionary.core.watch;
var cr107740_place_79 = cr107740_place_32;
var cr107740_place_80 = (function (){var G__107846 = cr107740_place_79;
var fexpr__107845 = cr107740_place_78;
return (fexpr__107845.cljs$core$IFn$_invoke$arity$1 ? fexpr__107845.cljs$core$IFn$_invoke$arity$1(G__107846) : fexpr__107845.call(null,G__107846));
})();
var cr107740_place_81 = frontend.worker.rtc.client_op.create_pending_block_ops_count_flow;
var cr107740_place_82 = cr107740_place_8;
var cr107740_place_83 = (function (){var G__107848 = cr107740_place_82;
var fexpr__107847 = cr107740_place_81;
return (fexpr__107847.cljs$core$IFn$_invoke$arity$1 ? fexpr__107847.cljs$core$IFn$_invoke$arity$1(G__107848) : fexpr__107847.call(null,G__107848));
})();
var cr107740_place_84 = frontend.worker.rtc.log_and_state.create_local_AMPERSAND_remote_t_flow;
var cr107740_place_85 = cr107740_place_48;
var cr107740_place_86 = (function (){var G__107850 = cr107740_place_85;
var fexpr__107849 = cr107740_place_84;
return (fexpr__107849.cljs$core$IFn$_invoke$arity$1 ? fexpr__107849.cljs$core$IFn$_invoke$arity$1(G__107850) : fexpr__107849.call(null,G__107850));
})();
var cr107740_place_87 = (function (){var G__107852 = cr107740_place_67;
var G__107853 = cr107740_place_68;
var G__107854 = cr107740_place_71;
var G__107855 = cr107740_place_74;
var G__107856 = cr107740_place_77;
var G__107857 = cr107740_place_80;
var G__107858 = cr107740_place_83;
var G__107859 = cr107740_place_86;
var fexpr__107851 = cr107740_place_66;
return (fexpr__107851.cljs$core$IFn$_invoke$arity$8 ? fexpr__107851.cljs$core$IFn$_invoke$arity$8(G__107852,G__107853,G__107854,G__107855,G__107856,G__107857,G__107858,G__107859) : fexpr__107851.call(null,G__107852,G__107853,G__107854,G__107855,G__107856,G__107857,G__107858,G__107859));
})();
(cr107740_state[(0)] = cr107740_block_14);

(cr107740_state[(1)] = null);

(cr107740_state[(2)] = null);

(cr107740_state[(4)] = null);

(cr107740_state[(5)] = null);

(cr107740_state[(6)] = null);

(cr107740_state[(7)] = null);

(cr107740_state[(8)] = null);

(cr107740_state[(9)] = null);

(cr107740_state[(10)] = null);

(cr107740_state[(11)] = null);

(cr107740_state[(12)] = null);

return missionary.core.switch$(cr107740_place_87);
}catch (e107838){var cr107740_exception = e107838;
(cr107740_state[(0)] = cr107740_block_16);

(cr107740_state[(1)] = null);

(cr107740_state[(2)] = null);

(cr107740_state[(4)] = null);

(cr107740_state[(5)] = null);

(cr107740_state[(14)] = null);

(cr107740_state[(6)] = null);

(cr107740_state[(7)] = null);

(cr107740_state[(8)] = null);

(cr107740_state[(9)] = null);

(cr107740_state[(10)] = null);

(cr107740_state[(11)] = null);

(cr107740_state[(12)] = null);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_9 = (function frontend$worker$rtc$core$cr107740_block_9(cr107740_state){
try{var cr107740_place_61 = (cr107740_state[(16)]);
(cr107740_state[(0)] = cr107740_block_10);

(cr107740_state[(16)] = null);

(cr107740_state[(15)] = cr107740_place_61);

return cr107740_state;
}catch (e107860){var cr107740_exception = e107860;
(cr107740_state[(0)] = cr107740_block_16);

(cr107740_state[(16)] = null);

(cr107740_state[(1)] = null);

(cr107740_state[(2)] = null);

(cr107740_state[(14)] = null);

(cr107740_state[(15)] = null);

(cr107740_state[(4)] = null);

(cr107740_state[(5)] = null);

(cr107740_state[(6)] = null);

(cr107740_state[(7)] = null);

(cr107740_state[(8)] = null);

(cr107740_state[(9)] = null);

(cr107740_state[(10)] = null);

(cr107740_state[(11)] = null);

(cr107740_state[(12)] = null);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_11 = (function frontend$worker$rtc$core$cr107740_block_11(cr107740_state){
try{var cr107740_place_53 = (cr107740_state[(14)]);
var cr107740_place_64 = null;
if(cljs.core.truth_(cr107740_place_53)){
(cr107740_state[(0)] = cr107740_block_13);

(cr107740_state[(14)] = null);

(cr107740_state[(14)] = cr107740_place_64);

return cr107740_state;
} else {
(cr107740_state[(0)] = cr107740_block_12);

(cr107740_state[(1)] = null);

(cr107740_state[(2)] = null);

(cr107740_state[(14)] = null);

(cr107740_state[(4)] = null);

(cr107740_state[(5)] = null);

(cr107740_state[(6)] = null);

(cr107740_state[(7)] = null);

(cr107740_state[(8)] = null);

(cr107740_state[(9)] = null);

(cr107740_state[(10)] = null);

(cr107740_state[(11)] = null);

(cr107740_state[(12)] = null);

(cr107740_state[(14)] = cr107740_place_64);

return cr107740_state;
}
}catch (e107861){var cr107740_exception = e107861;
(cr107740_state[(0)] = cr107740_block_16);

(cr107740_state[(1)] = null);

(cr107740_state[(2)] = null);

(cr107740_state[(14)] = null);

(cr107740_state[(4)] = null);

(cr107740_state[(5)] = null);

(cr107740_state[(6)] = null);

(cr107740_state[(7)] = null);

(cr107740_state[(8)] = null);

(cr107740_state[(9)] = null);

(cr107740_state[(10)] = null);

(cr107740_state[(11)] = null);

(cr107740_state[(12)] = null);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_7 = (function frontend$worker$rtc$core$cr107740_block_7(cr107740_state){
try{var cr107740_place_59 = (cr107740_state[(17)]);
var cr107740_place_62 = cr107740_place_59;
(cr107740_state[(0)] = cr107740_block_9);

(cr107740_state[(17)] = null);

(cr107740_state[(16)] = cr107740_place_62);

return cr107740_state;
}catch (e107862){var cr107740_exception = e107862;
(cr107740_state[(0)] = cr107740_block_16);

(cr107740_state[(16)] = null);

(cr107740_state[(1)] = null);

(cr107740_state[(2)] = null);

(cr107740_state[(14)] = null);

(cr107740_state[(15)] = null);

(cr107740_state[(4)] = null);

(cr107740_state[(5)] = null);

(cr107740_state[(6)] = null);

(cr107740_state[(7)] = null);

(cr107740_state[(8)] = null);

(cr107740_state[(9)] = null);

(cr107740_state[(17)] = null);

(cr107740_state[(10)] = null);

(cr107740_state[(11)] = null);

(cr107740_state[(12)] = null);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_2 = (function frontend$worker$rtc$core$cr107740_block_2(cr107740_state){
try{var cr107740_place_8 = (cr107740_state[(5)]);
var cr107740_place_51 = cr107740_place_8;
var cr107740_place_52 = cr107740_place_51;
var cr107740_place_53 = null;
if(cljs.core.truth_(cr107740_place_52)){
(cr107740_state[(0)] = cr107740_block_4);

(cr107740_state[(14)] = cr107740_place_53);

return cr107740_state;
} else {
(cr107740_state[(0)] = cr107740_block_3);

(cr107740_state[(15)] = cr107740_place_51);

(cr107740_state[(14)] = cr107740_place_53);

return cr107740_state;
}
}catch (e107863){var cr107740_exception = e107863;
(cr107740_state[(0)] = cr107740_block_16);

(cr107740_state[(1)] = null);

(cr107740_state[(2)] = null);

(cr107740_state[(4)] = null);

(cr107740_state[(5)] = null);

(cr107740_state[(6)] = null);

(cr107740_state[(7)] = null);

(cr107740_state[(8)] = null);

(cr107740_state[(9)] = null);

(cr107740_state[(10)] = null);

(cr107740_state[(11)] = null);

(cr107740_state[(12)] = null);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_10 = (function frontend$worker$rtc$core$cr107740_block_10(cr107740_state){
try{var cr107740_place_57 = (cr107740_state[(15)]);
(cr107740_state[(0)] = cr107740_block_11);

(cr107740_state[(15)] = null);

(cr107740_state[(14)] = cr107740_place_57);

return cr107740_state;
}catch (e107864){var cr107740_exception = e107864;
(cr107740_state[(0)] = cr107740_block_16);

(cr107740_state[(1)] = null);

(cr107740_state[(2)] = null);

(cr107740_state[(14)] = null);

(cr107740_state[(15)] = null);

(cr107740_state[(4)] = null);

(cr107740_state[(5)] = null);

(cr107740_state[(6)] = null);

(cr107740_state[(7)] = null);

(cr107740_state[(8)] = null);

(cr107740_state[(9)] = null);

(cr107740_state[(10)] = null);

(cr107740_state[(11)] = null);

(cr107740_state[(12)] = null);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_12 = (function frontend$worker$rtc$core$cr107740_block_12(cr107740_state){
try{var cr107740_place_65 = null;
(cr107740_state[(0)] = cr107740_block_15);

(cr107740_state[(14)] = cr107740_place_65);

return cr107740_state;
}catch (e107865){var cr107740_exception = e107865;
(cr107740_state[(0)] = cr107740_block_16);

(cr107740_state[(14)] = null);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_15 = (function frontend$worker$rtc$core$cr107740_block_15(cr107740_state){
try{var cr107740_place_64 = (cr107740_state[(14)]);
(cr107740_state[(0)] = cr107740_block_23);

(cr107740_state[(14)] = null);

(cr107740_state[(3)] = cr107740_place_64);

return cr107740_state;
}catch (e107866){var cr107740_exception = e107866;
(cr107740_state[(0)] = cr107740_block_16);

(cr107740_state[(14)] = null);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_5 = (function frontend$worker$rtc$core$cr107740_block_5(cr107740_state){
try{var cr107740_place_55 = (cr107740_state[(16)]);
var cr107740_place_58 = cr107740_place_55;
(cr107740_state[(0)] = cr107740_block_10);

(cr107740_state[(16)] = null);

(cr107740_state[(15)] = cr107740_place_58);

return cr107740_state;
}catch (e107867){var cr107740_exception = e107867;
(cr107740_state[(0)] = cr107740_block_16);

(cr107740_state[(1)] = null);

(cr107740_state[(2)] = null);

(cr107740_state[(14)] = null);

(cr107740_state[(15)] = null);

(cr107740_state[(4)] = null);

(cr107740_state[(5)] = null);

(cr107740_state[(6)] = null);

(cr107740_state[(7)] = null);

(cr107740_state[(8)] = null);

(cr107740_state[(9)] = null);

(cr107740_state[(16)] = null);

(cr107740_state[(10)] = null);

(cr107740_state[(11)] = null);

(cr107740_state[(12)] = null);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_17 = (function frontend$worker$rtc$core$cr107740_block_17(cr107740_state){
try{var cr107740_place_93 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr107740_place_94 = null;
if(cljs.core.truth_(cr107740_place_93)){
(cr107740_state[(0)] = cr107740_block_19);

(cr107740_state[(1)] = null);

return cr107740_state;
} else {
(cr107740_state[(0)] = cr107740_block_18);

(cr107740_state[(2)] = cr107740_place_94);

return cr107740_state;
}
}catch (e107868){var cr107740_exception = e107868;
(cr107740_state[(0)] = cr107740_block_23);

(cr107740_state[(1)] = null);

(cr107740_state[(13)] = true);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_14 = (function frontend$worker$rtc$core$cr107740_block_14(cr107740_state){
try{var cr107740_place_88 = missionary.core.unpark();
(cr107740_state[(0)] = cr107740_block_15);

(cr107740_state[(14)] = cr107740_place_88);

return cr107740_state;
}catch (e107869){var cr107740_exception = e107869;
(cr107740_state[(0)] = cr107740_block_16);

(cr107740_state[(14)] = null);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_21 = (function frontend$worker$rtc$core$cr107740_block_21(cr107740_state){
try{var cr107740_place_49 = (cr107740_state[(3)]);
var cr107740_place_98 = cr107740_place_49;
var cr107740_place_99 = null;
(cr107740_state[(0)] = cr107740_block_22);

(cr107740_state[(1)] = cr107740_place_99);

return cr107740_state;
}catch (e107870){var cr107740_exception = e107870;
(cr107740_state[(0)] = cr107740_block_23);

(cr107740_state[(1)] = null);

(cr107740_state[(13)] = true);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
var cr107740_block_1 = (function frontend$worker$rtc$core$cr107740_block_1(cr107740_state){
try{var cr107740_place_1 = missionary.core.unpark();
var cr107740_place_2 = cljs.core.__destructure_map;
var cr107740_place_3 = cr107740_place_1;
var cr107740_place_4 = (function (){var G__107873 = cr107740_place_3;
var fexpr__107872 = cr107740_place_2;
return (fexpr__107872.cljs$core$IFn$_invoke$arity$1 ? fexpr__107872.cljs$core$IFn$_invoke$arity$1(G__107873) : fexpr__107872.call(null,G__107873));
})();
var cr107740_place_5 = cljs.core.get;
var cr107740_place_6 = cr107740_place_4;
var cr107740_place_7 = new cljs.core.Keyword(null,"repo","repo",-1999060679);
var cr107740_place_8 = (function (){var G__107875 = cr107740_place_6;
var G__107876 = cr107740_place_7;
var fexpr__107874 = cr107740_place_5;
return (fexpr__107874.cljs$core$IFn$_invoke$arity$2 ? fexpr__107874.cljs$core$IFn$_invoke$arity$2(G__107875,G__107876) : fexpr__107874.call(null,G__107875,G__107876));
})();
var cr107740_place_9 = cljs.core.get;
var cr107740_place_10 = cr107740_place_4;
var cr107740_place_11 = new cljs.core.Keyword(null,"user-uuid","user-uuid",-275954048);
var cr107740_place_12 = (function (){var G__107878 = cr107740_place_10;
var G__107879 = cr107740_place_11;
var fexpr__107877 = cr107740_place_9;
return (fexpr__107877.cljs$core$IFn$_invoke$arity$2 ? fexpr__107877.cljs$core$IFn$_invoke$arity$2(G__107878,G__107879) : fexpr__107877.call(null,G__107878,G__107879));
})();
var cr107740_place_13 = cljs.core.get;
var cr107740_place_14 = cr107740_place_4;
var cr107740_place_15 = new cljs.core.Keyword(null,"*rtc-auto-push?","*rtc-auto-push?",-44092416);
var cr107740_place_16 = (function (){var G__107881 = cr107740_place_14;
var G__107882 = cr107740_place_15;
var fexpr__107880 = cr107740_place_13;
return (fexpr__107880.cljs$core$IFn$_invoke$arity$2 ? fexpr__107880.cljs$core$IFn$_invoke$arity$2(G__107881,G__107882) : fexpr__107880.call(null,G__107881,G__107882));
})();
var cr107740_place_17 = cljs.core.get;
var cr107740_place_18 = cr107740_place_4;
var cr107740_place_19 = new cljs.core.Keyword(null,"*rtc-lock","*rtc-lock",-424509809);
var cr107740_place_20 = (function (){var G__107884 = cr107740_place_18;
var G__107885 = cr107740_place_19;
var fexpr__107883 = cr107740_place_17;
return (fexpr__107883.cljs$core$IFn$_invoke$arity$2 ? fexpr__107883.cljs$core$IFn$_invoke$arity$2(G__107884,G__107885) : fexpr__107883.call(null,G__107884,G__107885));
})();
var cr107740_place_21 = cljs.core.get;
var cr107740_place_22 = cr107740_place_4;
var cr107740_place_23 = new cljs.core.Keyword(null,"*rtc-remote-profile?","*rtc-remote-profile?",751419973);
var cr107740_place_24 = (function (){var G__107887 = cr107740_place_22;
var G__107888 = cr107740_place_23;
var fexpr__107886 = cr107740_place_21;
return (fexpr__107886.cljs$core$IFn$_invoke$arity$2 ? fexpr__107886.cljs$core$IFn$_invoke$arity$2(G__107887,G__107888) : fexpr__107886.call(null,G__107887,G__107888));
})();
var cr107740_place_25 = cljs.core.get;
var cr107740_place_26 = cr107740_place_4;
var cr107740_place_27 = new cljs.core.Keyword(null,"local-graph-schema-version","local-graph-schema-version",-211621207);
var cr107740_place_28 = (function (){var G__107890 = cr107740_place_26;
var G__107891 = cr107740_place_27;
var fexpr__107889 = cr107740_place_25;
return (fexpr__107889.cljs$core$IFn$_invoke$arity$2 ? fexpr__107889.cljs$core$IFn$_invoke$arity$2(G__107890,G__107891) : fexpr__107889.call(null,G__107890,G__107891));
})();
var cr107740_place_29 = cljs.core.get;
var cr107740_place_30 = cr107740_place_4;
var cr107740_place_31 = new cljs.core.Keyword(null,"*online-users","*online-users",-1145442647);
var cr107740_place_32 = (function (){var G__107893 = cr107740_place_30;
var G__107894 = cr107740_place_31;
var fexpr__107892 = cr107740_place_29;
return (fexpr__107892.cljs$core$IFn$_invoke$arity$2 ? fexpr__107892.cljs$core$IFn$_invoke$arity$2(G__107893,G__107894) : fexpr__107892.call(null,G__107893,G__107894));
})();
var cr107740_place_33 = cljs.core.get;
var cr107740_place_34 = cr107740_place_4;
var cr107740_place_35 = new cljs.core.Keyword(null,"remote-graph-schema-version","remote-graph-schema-version",-1202898069);
var cr107740_place_36 = (function (){var G__107896 = cr107740_place_34;
var G__107897 = cr107740_place_35;
var fexpr__107895 = cr107740_place_33;
return (fexpr__107895.cljs$core$IFn$_invoke$arity$2 ? fexpr__107895.cljs$core$IFn$_invoke$arity$2(G__107896,G__107897) : fexpr__107895.call(null,G__107896,G__107897));
})();
var cr107740_place_37 = cljs.core.get;
var cr107740_place_38 = cr107740_place_4;
var cr107740_place_39 = new cljs.core.Keyword(null,"rtc-state-flow","rtc-state-flow",553472428);
var cr107740_place_40 = (function (){var G__107899 = cr107740_place_38;
var G__107900 = cr107740_place_39;
var fexpr__107898 = cr107740_place_37;
return (fexpr__107898.cljs$core$IFn$_invoke$arity$2 ? fexpr__107898.cljs$core$IFn$_invoke$arity$2(G__107899,G__107900) : fexpr__107898.call(null,G__107899,G__107900));
})();
var cr107740_place_41 = cljs.core.get;
var cr107740_place_42 = cr107740_place_4;
var cr107740_place_43 = new cljs.core.Keyword(null,"*last-stop-exception","*last-stop-exception",1441670509);
var cr107740_place_44 = (function (){var G__107902 = cr107740_place_42;
var G__107903 = cr107740_place_43;
var fexpr__107901 = cr107740_place_41;
return (fexpr__107901.cljs$core$IFn$_invoke$arity$2 ? fexpr__107901.cljs$core$IFn$_invoke$arity$2(G__107902,G__107903) : fexpr__107901.call(null,G__107902,G__107903));
})();
var cr107740_place_45 = cljs.core.get;
var cr107740_place_46 = cr107740_place_4;
var cr107740_place_47 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr107740_place_48 = (function (){var G__107905 = cr107740_place_46;
var G__107906 = cr107740_place_47;
var fexpr__107904 = cr107740_place_45;
return (fexpr__107904.cljs$core$IFn$_invoke$arity$2 ? fexpr__107904.cljs$core$IFn$_invoke$arity$2(G__107905,G__107906) : fexpr__107904.call(null,G__107905,G__107906));
})();
var cr107740_place_49 = null;
var cr107740_place_50 = false;
(cr107740_state[(0)] = cr107740_block_2);

(cr107740_state[(1)] = cr107740_place_36);

(cr107740_state[(2)] = cr107740_place_24);

(cr107740_state[(3)] = cr107740_place_49);

(cr107740_state[(4)] = cr107740_place_40);

(cr107740_state[(5)] = cr107740_place_8);

(cr107740_state[(6)] = cr107740_place_28);

(cr107740_state[(7)] = cr107740_place_12);

(cr107740_state[(8)] = cr107740_place_20);

(cr107740_state[(9)] = cr107740_place_48);

(cr107740_state[(10)] = cr107740_place_44);

(cr107740_state[(11)] = cr107740_place_32);

(cr107740_state[(12)] = cr107740_place_16);

(cr107740_state[(13)] = cr107740_place_50);

return cr107740_state;
}catch (e107871){var cr107740_exception = e107871;
(cr107740_state[(0)] = null);

throw cr107740_exception;
}});
var cr107740_block_18 = (function frontend$worker$rtc$core$cr107740_block_18(cr107740_state){
try{var cr107740_place_95 = null;
(cr107740_state[(0)] = cr107740_block_20);

(cr107740_state[(2)] = cr107740_place_95);

return cr107740_state;
}catch (e107907){var cr107740_exception = e107907;
(cr107740_state[(0)] = cr107740_block_23);

(cr107740_state[(1)] = null);

(cr107740_state[(2)] = null);

(cr107740_state[(13)] = true);

(cr107740_state[(3)] = cr107740_exception);

return cr107740_state;
}});
return cloroutine.impl.coroutine((function (){var G__107908 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((18));
(G__107908[(0)] = cr107740_block_0);

return G__107908;
})());
})(),missionary.core.ap_run);
})();
frontend.worker.rtc.core.create_get_state_flow = frontend.common.missionary.throttle((300),frontend.worker.rtc.core.create_get_state_flow_STAR_);
frontend.worker.rtc.core.new_task__get_debug_state = (function frontend$worker$rtc$core$new_task__get_debug_state(){
return frontend.common.missionary.snapshot_of_flow(frontend.worker.rtc.core.create_get_state_flow);
});
frontend.worker.rtc.core.new_task__upload_graph = (function frontend$worker$rtc$core$new_task__upload_graph(token,repo,remote_graph_name){
var map__107909 = (function (){var temp__5802__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5802__auto__)){
var conn = temp__5802__auto__;
var temp__5802__auto____$1 = logseq.db.get_graph_schema_version(cljs.core.deref(conn));
if(cljs.core.truth_(temp__5802__auto____$1)){
var schema_version = temp__5802__auto____$1;
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"conn","conn",278309663),conn,new cljs.core.Keyword(null,"schema-version","schema-version",1117939594),schema_version], null);
} else {
return cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Not found schema-version",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("rtc.exception","not-found-schema-version","rtc.exception/not-found-schema-version",-458822991)], null));
}
} else {
return cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Not found db-conn",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("rtc.exception","not-found-db-conn","rtc.exception/not-found-db-conn",-184822776),new cljs.core.Keyword(null,"repo","repo",-1999060679),repo], null));
}
})();
var map__107909__$1 = cljs.core.__destructure_map(map__107909);
var r = map__107909__$1;
var conn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107909__$1,new cljs.core.Keyword(null,"conn","conn",278309663));
var schema_version = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107909__$1,new cljs.core.Keyword(null,"schema-version","schema-version",1117939594));
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr107910_block_0 = (function frontend$worker$rtc$core$new_task__upload_graph_$_cr107910_block_0(cr107910_state){
try{var cr107910_place_0 = r;
var cr107910_place_1 = cljs.core.ExceptionInfo;
var cr107910_place_2 = (cr107910_place_0 instanceof cr107910_place_1);
var cr107910_place_3 = null;
if(cr107910_place_2){
(cr107910_state[(0)] = cr107910_block_3);

(cr107910_state[(1)] = cr107910_place_3);

return cr107910_state;
} else {
(cr107910_state[(0)] = cr107910_block_1);

(cr107910_state[(1)] = cr107910_place_3);

return cr107910_state;
}
}catch (e107934){var cr107910_exception = e107934;
(cr107910_state[(0)] = null);

throw cr107910_exception;
}});
var cr107910_block_1 = (function frontend$worker$rtc$core$new_task__upload_graph_$_cr107910_block_1(cr107910_state){
try{var cr107910_place_4 = logseq.db.frontend.schema.major_version;
var cr107910_place_5 = schema_version;
var cr107910_place_6 = (function (){var G__107937 = cr107910_place_5;
var fexpr__107936 = cr107910_place_4;
return (fexpr__107936.cljs$core$IFn$_invoke$arity$1 ? fexpr__107936.cljs$core$IFn$_invoke$arity$1(G__107937) : fexpr__107936.call(null,G__107937));
})();
var cr107910_place_7 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized;
var cr107910_place_8 = frontend.worker.rtc.ws_util.get_ws_url;
var cr107910_place_9 = token;
var cr107910_place_10 = (function (){var G__107939 = cr107910_place_9;
var fexpr__107938 = cr107910_place_8;
return (fexpr__107938.cljs$core$IFn$_invoke$arity$1 ? fexpr__107938.cljs$core$IFn$_invoke$arity$1(G__107939) : fexpr__107938.call(null,G__107939));
})();
var cr107910_place_11 = cr107910_place_7(cr107910_place_10);
var cr107910_place_12 = cljs.core.__destructure_map;
var cr107910_place_13 = cr107910_place_11;
var cr107910_place_14 = (function (){var G__107941 = cr107910_place_13;
var fexpr__107940 = cr107910_place_12;
return (fexpr__107940.cljs$core$IFn$_invoke$arity$1 ? fexpr__107940.cljs$core$IFn$_invoke$arity$1(G__107941) : fexpr__107940.call(null,G__107941));
})();
var cr107910_place_15 = cljs.core.get;
var cr107910_place_16 = cr107910_place_14;
var cr107910_place_17 = new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002);
var cr107910_place_18 = (function (){var G__107943 = cr107910_place_16;
var G__107944 = cr107910_place_17;
var fexpr__107942 = cr107910_place_15;
return (fexpr__107942.cljs$core$IFn$_invoke$arity$2 ? fexpr__107942.cljs$core$IFn$_invoke$arity$2(G__107943,G__107944) : fexpr__107942.call(null,G__107943,G__107944));
})();
var cr107910_place_19 = frontend.worker.rtc.full_upload_download_graph.new_task__upload_graph;
var cr107910_place_20 = cr107910_place_18;
var cr107910_place_21 = repo;
var cr107910_place_22 = conn;
var cr107910_place_23 = remote_graph_name;
var cr107910_place_24 = cr107910_place_6;
var cr107910_place_25 = (function (){var G__107946 = cr107910_place_20;
var G__107947 = cr107910_place_21;
var G__107948 = cr107910_place_22;
var G__107949 = cr107910_place_23;
var G__107950 = cr107910_place_24;
var fexpr__107945 = cr107910_place_19;
return (fexpr__107945.cljs$core$IFn$_invoke$arity$5 ? fexpr__107945.cljs$core$IFn$_invoke$arity$5(G__107946,G__107947,G__107948,G__107949,G__107950) : fexpr__107945.call(null,G__107946,G__107947,G__107948,G__107949,G__107950));
})();
(cr107910_state[(0)] = cr107910_block_2);

return missionary.core.park(cr107910_place_25);
}catch (e107935){var cr107910_exception = e107935;
(cr107910_state[(0)] = null);

(cr107910_state[(1)] = null);

throw cr107910_exception;
}});
var cr107910_block_2 = (function frontend$worker$rtc$core$new_task__upload_graph_$_cr107910_block_2(cr107910_state){
try{var cr107910_place_26 = missionary.core.unpark();
(cr107910_state[(0)] = cr107910_block_4);

(cr107910_state[(1)] = cr107910_place_26);

return cr107910_state;
}catch (e107951){var cr107910_exception = e107951;
(cr107910_state[(0)] = null);

(cr107910_state[(1)] = null);

throw cr107910_exception;
}});
var cr107910_block_3 = (function frontend$worker$rtc$core$new_task__upload_graph_$_cr107910_block_3(cr107910_state){
try{var cr107910_place_27 = frontend.worker.rtc.exception.__GT_map;
var cr107910_place_28 = r;
var cr107910_place_29 = (function (){var G__107954 = cr107910_place_28;
var fexpr__107953 = cr107910_place_27;
return (fexpr__107953.cljs$core$IFn$_invoke$arity$1 ? fexpr__107953.cljs$core$IFn$_invoke$arity$1(G__107954) : fexpr__107953.call(null,G__107954));
})();
(cr107910_state[(0)] = cr107910_block_4);

(cr107910_state[(1)] = cr107910_place_29);

return cr107910_state;
}catch (e107952){var cr107910_exception = e107952;
(cr107910_state[(0)] = null);

(cr107910_state[(1)] = null);

throw cr107910_exception;
}});
var cr107910_block_4 = (function frontend$worker$rtc$core$new_task__upload_graph_$_cr107910_block_4(cr107910_state){
try{var cr107910_place_3 = (cr107910_state[(1)]);
(cr107910_state[(0)] = null);

(cr107910_state[(1)] = null);

return cr107910_place_3;
}catch (e107955){var cr107910_exception = e107955;
(cr107910_state[(0)] = null);

(cr107910_state[(1)] = null);

throw cr107910_exception;
}});
return cloroutine.impl.coroutine((function (){var G__107956 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((2));
(G__107956[(0)] = cr107910_block_0);

return G__107956;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.core.new_task__branch_graph = (function frontend$worker$rtc$core$new_task__branch_graph(token,repo){
var map__107957 = (function (){var temp__5802__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5802__auto__)){
var conn = temp__5802__auto__;
var temp__5802__auto____$1 = logseq.db.get_graph_rtc_uuid(cljs.core.deref(conn));
if(cljs.core.truth_(temp__5802__auto____$1)){
var graph_uuid = temp__5802__auto____$1;
var temp__5802__auto____$2 = logseq.db.get_graph_schema_version(cljs.core.deref(conn));
if(cljs.core.truth_(temp__5802__auto____$2)){
var schema_version = temp__5802__auto____$2;
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"conn","conn",278309663),conn,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid,new cljs.core.Keyword(null,"schema-version","schema-version",1117939594),schema_version], null);
} else {
return cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Not found schema-version",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("rtc.exception","not-found-schema-version","rtc.exception/not-found-schema-version",-458822991)], null));
}
} else {
return frontend.worker.rtc.exception.ex_local_not_rtc_graph;
}
} else {
return cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Not found db-conn",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("rtc.exception","not-found-db-conn","rtc.exception/not-found-db-conn",-184822776),new cljs.core.Keyword(null,"repo","repo",-1999060679),repo], null));
}
})();
var map__107957__$1 = cljs.core.__destructure_map(map__107957);
var r = map__107957__$1;
var conn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107957__$1,new cljs.core.Keyword(null,"conn","conn",278309663));
var graph_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107957__$1,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522));
var schema_version = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__107957__$1,new cljs.core.Keyword(null,"schema-version","schema-version",1117939594));
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr107958_block_0 = (function frontend$worker$rtc$core$new_task__branch_graph_$_cr107958_block_0(cr107958_state){
try{var cr107958_place_0 = r;
var cr107958_place_1 = cljs.core.ExceptionInfo;
var cr107958_place_2 = (cr107958_place_0 instanceof cr107958_place_1);
var cr107958_place_3 = null;
if(cr107958_place_2){
(cr107958_state[(0)] = cr107958_block_3);

(cr107958_state[(1)] = cr107958_place_3);

return cr107958_state;
} else {
(cr107958_state[(0)] = cr107958_block_1);

(cr107958_state[(1)] = cr107958_place_3);

return cr107958_state;
}
}catch (e107982){var cr107958_exception = e107982;
(cr107958_state[(0)] = null);

throw cr107958_exception;
}});
var cr107958_block_1 = (function frontend$worker$rtc$core$new_task__branch_graph_$_cr107958_block_1(cr107958_state){
try{var cr107958_place_4 = logseq.db.frontend.schema.major_version;
var cr107958_place_5 = schema_version;
var cr107958_place_6 = (function (){var G__107985 = cr107958_place_5;
var fexpr__107984 = cr107958_place_4;
return (fexpr__107984.cljs$core$IFn$_invoke$arity$1 ? fexpr__107984.cljs$core$IFn$_invoke$arity$1(G__107985) : fexpr__107984.call(null,G__107985));
})();
var cr107958_place_7 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized;
var cr107958_place_8 = frontend.worker.rtc.ws_util.get_ws_url;
var cr107958_place_9 = token;
var cr107958_place_10 = (function (){var G__107987 = cr107958_place_9;
var fexpr__107986 = cr107958_place_8;
return (fexpr__107986.cljs$core$IFn$_invoke$arity$1 ? fexpr__107986.cljs$core$IFn$_invoke$arity$1(G__107987) : fexpr__107986.call(null,G__107987));
})();
var cr107958_place_11 = cr107958_place_7(cr107958_place_10);
var cr107958_place_12 = cljs.core.__destructure_map;
var cr107958_place_13 = cr107958_place_11;
var cr107958_place_14 = (function (){var G__107989 = cr107958_place_13;
var fexpr__107988 = cr107958_place_12;
return (fexpr__107988.cljs$core$IFn$_invoke$arity$1 ? fexpr__107988.cljs$core$IFn$_invoke$arity$1(G__107989) : fexpr__107988.call(null,G__107989));
})();
var cr107958_place_15 = cljs.core.get;
var cr107958_place_16 = cr107958_place_14;
var cr107958_place_17 = new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002);
var cr107958_place_18 = (function (){var G__107991 = cr107958_place_16;
var G__107992 = cr107958_place_17;
var fexpr__107990 = cr107958_place_15;
return (fexpr__107990.cljs$core$IFn$_invoke$arity$2 ? fexpr__107990.cljs$core$IFn$_invoke$arity$2(G__107991,G__107992) : fexpr__107990.call(null,G__107991,G__107992));
})();
var cr107958_place_19 = frontend.worker.rtc.full_upload_download_graph.new_task__branch_graph;
var cr107958_place_20 = cr107958_place_18;
var cr107958_place_21 = repo;
var cr107958_place_22 = conn;
var cr107958_place_23 = graph_uuid;
var cr107958_place_24 = cr107958_place_6;
var cr107958_place_25 = (function (){var G__107994 = cr107958_place_20;
var G__107995 = cr107958_place_21;
var G__107996 = cr107958_place_22;
var G__107997 = cr107958_place_23;
var G__107998 = cr107958_place_24;
var fexpr__107993 = cr107958_place_19;
return (fexpr__107993.cljs$core$IFn$_invoke$arity$5 ? fexpr__107993.cljs$core$IFn$_invoke$arity$5(G__107994,G__107995,G__107996,G__107997,G__107998) : fexpr__107993.call(null,G__107994,G__107995,G__107996,G__107997,G__107998));
})();
(cr107958_state[(0)] = cr107958_block_2);

return missionary.core.park(cr107958_place_25);
}catch (e107983){var cr107958_exception = e107983;
(cr107958_state[(0)] = null);

(cr107958_state[(1)] = null);

throw cr107958_exception;
}});
var cr107958_block_2 = (function frontend$worker$rtc$core$new_task__branch_graph_$_cr107958_block_2(cr107958_state){
try{var cr107958_place_26 = missionary.core.unpark();
(cr107958_state[(0)] = cr107958_block_4);

(cr107958_state[(1)] = cr107958_place_26);

return cr107958_state;
}catch (e107999){var cr107958_exception = e107999;
(cr107958_state[(0)] = null);

(cr107958_state[(1)] = null);

throw cr107958_exception;
}});
var cr107958_block_3 = (function frontend$worker$rtc$core$new_task__branch_graph_$_cr107958_block_3(cr107958_state){
try{var cr107958_place_27 = frontend.worker.rtc.exception.__GT_map;
var cr107958_place_28 = r;
var cr107958_place_29 = (function (){var G__108002 = cr107958_place_28;
var fexpr__108001 = cr107958_place_27;
return (fexpr__108001.cljs$core$IFn$_invoke$arity$1 ? fexpr__108001.cljs$core$IFn$_invoke$arity$1(G__108002) : fexpr__108001.call(null,G__108002));
})();
(cr107958_state[(0)] = cr107958_block_4);

(cr107958_state[(1)] = cr107958_place_29);

return cr107958_state;
}catch (e108000){var cr107958_exception = e108000;
(cr107958_state[(0)] = null);

(cr107958_state[(1)] = null);

throw cr107958_exception;
}});
var cr107958_block_4 = (function frontend$worker$rtc$core$new_task__branch_graph_$_cr107958_block_4(cr107958_state){
try{var cr107958_place_3 = (cr107958_state[(1)]);
(cr107958_state[(0)] = null);

(cr107958_state[(1)] = null);

return cr107958_place_3;
}catch (e108003){var cr107958_exception = e108003;
(cr107958_state[(0)] = null);

(cr107958_state[(1)] = null);

throw cr107958_exception;
}});
return cloroutine.impl.coroutine((function (){var G__108004 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((2));
(G__108004[(0)] = cr107958_block_0);

return G__108004;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.core.new_task__request_download_graph = (function frontend$worker$rtc$core$new_task__request_download_graph(token,graph_uuid,schema_version){
var map__108005 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized(frontend.worker.rtc.ws_util.get_ws_url(token));
var map__108005__$1 = cljs.core.__destructure_map(map__108005);
var get_ws_create_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108005__$1,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002));
return frontend.worker.rtc.full_upload_download_graph.new_task__request_download_graph(get_ws_create_task,graph_uuid,schema_version);
});
frontend.worker.rtc.core.new_task__wait_download_info_ready = (function frontend$worker$rtc$core$new_task__wait_download_info_ready(token,download_info_uuid,graph_uuid,schema_version,timeout_ms){
var map__108006 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized(frontend.worker.rtc.ws_util.get_ws_url(token));
var map__108006__$1 = cljs.core.__destructure_map(map__108006);
var get_ws_create_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__108006__$1,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002));
return frontend.worker.rtc.full_upload_download_graph.new_task__wait_download_info_ready(get_ws_create_task,download_info_uuid,graph_uuid,schema_version,timeout_ms);
});
frontend.worker.rtc.core.new_task__download_graph_from_s3 = frontend.worker.rtc.full_upload_download_graph.new_task__download_graph_from_s3;
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-start","thread-api/rtc-start",-890838787),(function frontend$worker$rtc$core$thread_api__rtc_start(stop_before_start_QMARK_){
return frontend.worker.rtc.core.new_task__rtc_start(stop_before_start_QMARK_);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-stop","thread-api/rtc-stop",-126094172),(function frontend$worker$rtc$core$thread_api__rtc_stop(){
return frontend.worker.rtc.core.rtc_stop();
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-toggle-auto-push","thread-api/rtc-toggle-auto-push",1679639771),(function frontend$worker$rtc$core$thread_api__rtc_toggle_auto_push(){
return frontend.worker.rtc.core.rtc_toggle_auto_push();
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-toggle-remote-profile","thread-api/rtc-toggle-remote-profile",1006885794),(function frontend$worker$rtc$core$thread_api__rtc_toggle_remote_profile(){
return frontend.worker.rtc.core.rtc_toggle_remote_profile();
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-grant-graph-access","thread-api/rtc-grant-graph-access",1735035900),(function frontend$worker$rtc$core$thread_api__rtc_grant_graph_access(token,graph_uuid,target_user_uuids,target_user_emails){
return frontend.worker.rtc.core.new_task__grant_access_to_others.cljs$core$IFn$_invoke$arity$variadic(token,graph_uuid,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"target-user-uuids","target-user-uuids",-739511872),target_user_uuids,new cljs.core.Keyword(null,"target-user-emails","target-user-emails",-25552368),target_user_emails], 0));
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-get-graphs","thread-api/rtc-get-graphs",-1020791869),(function frontend$worker$rtc$core$thread_api__rtc_get_graphs(token){
return frontend.worker.rtc.core.new_task__get_graphs(token);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-delete-graph","thread-api/rtc-delete-graph",-699151858),(function frontend$worker$rtc$core$thread_api__rtc_delete_graph(token,graph_uuid,schema_version){
return frontend.worker.rtc.core.new_task__delete_graph(token,graph_uuid,schema_version);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-get-users-info","thread-api/rtc-get-users-info",1968240513),(function frontend$worker$rtc$core$thread_api__rtc_get_users_info(token,graph_uuid){
return frontend.worker.rtc.core.new_task__get_users_info(token,graph_uuid);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-get-block-content-versions","thread-api/rtc-get-block-content-versions",1910613531),(function frontend$worker$rtc$core$thread_api__rtc_get_block_content_versions(token,graph_uuid,block_uuid){
return frontend.worker.rtc.core.new_task__get_block_content_versions(token,graph_uuid,block_uuid);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-get-debug-state","thread-api/rtc-get-debug-state",245309807),(function frontend$worker$rtc$core$thread_api__rtc_get_debug_state(){
return frontend.worker.rtc.core.new_task__get_debug_state();
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-async-upload-graph","thread-api/rtc-async-upload-graph",-100015545),(function frontend$worker$rtc$core$thread_api__rtc_async_upload_graph(repo,token,remote_graph_name){
return frontend.worker.rtc.core.new_task__upload_graph(token,repo,remote_graph_name);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-async-branch-graph","thread-api/rtc-async-branch-graph",-476255141),(function frontend$worker$rtc$core$thread_api__rtc_async_branch_graph(repo,token){
return frontend.worker.rtc.core.new_task__branch_graph(token,repo);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-request-download-graph","thread-api/rtc-request-download-graph",1844528552),(function frontend$worker$rtc$core$thread_api__rtc_request_download_graph(token,graph_uuid,schema_version){
return frontend.worker.rtc.core.new_task__request_download_graph(token,graph_uuid,schema_version);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-wait-download-graph-info-ready","thread-api/rtc-wait-download-graph-info-ready",1767428638),(function frontend$worker$rtc$core$thread_api__rtc_wait_download_graph_info_ready(token,download_info_uuid,graph_uuid,schema_version,timeout_ms){
return frontend.worker.rtc.core.new_task__wait_download_info_ready(token,download_info_uuid,graph_uuid,schema_version,timeout_ms);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-download-graph-from-s3","thread-api/rtc-download-graph-from-s3",-50303377),(function frontend$worker$rtc$core$thread_api__rtc_download_graph_from_s3(graph_uuid,graph_name,s3_url){
return (frontend.worker.rtc.core.new_task__download_graph_from_s3.cljs$core$IFn$_invoke$arity$3 ? frontend.worker.rtc.core.new_task__download_graph_from_s3.cljs$core$IFn$_invoke$arity$3(graph_uuid,graph_name,s3_url) : frontend.worker.rtc.core.new_task__download_graph_from_s3.call(null,graph_uuid,graph_name,s3_url));
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-add-migration-client-ops","thread-api/rtc-add-migration-client-ops",-864937499),(function frontend$worker$rtc$core$thread_api__rtc_add_migration_client_ops(repo,server_schema_version){
var temp__5804__auto__ = cljs.core.deref(frontend.worker.state.get_datascript_conn(repo));
if(cljs.core.truth_(temp__5804__auto__)){
var db = temp__5804__auto__;
return frontend.worker.rtc.core.add_migration_client_ops_BANG_(repo,db,server_schema_version);
} else {
return null;
}
})));
if(logseq.common.config.PUBLISHING){
} else {
frontend.common.missionary.run_background_task(new cljs.core.Keyword("frontend.worker.rtc.core","subscribe-state","frontend.worker.rtc.core/subscribe-state",-2001264170),missionary.core.reduce.cljs$core$IFn$_invoke$arity$2((function (_,v){
return frontend.worker.shared_service.broadcast_to_clients_BANG_(new cljs.core.Keyword(null,"rtc-sync-state","rtc-sync-state",-661353236),v);
}),frontend.worker.rtc.core.create_get_state_flow));
}

//# sourceMappingURL=frontend.worker.rtc.core.js.map
