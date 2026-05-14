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
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr138565_block_1 = (function frontend$worker$rtc$core$get_remote_updates_$_cr138565_block_1(cr138565_state){
try{var cr138565_place_0 = get_ws_create_task;
(cr138565_state[(0)] = cr138565_block_2);

return missionary.core.park(cr138565_place_0);
}catch (e138599){var cr138565_exception = e138599;
(cr138565_state[(0)] = null);

throw cr138565_exception;
}});
var cr138565_block_2 = (function frontend$worker$rtc$core$get_remote_updates_$_cr138565_block_2(cr138565_state){
try{var cr138565_place_1 = missionary.core.unpark();
var cr138565_place_2 = null;
var cr138565_place_3 = false;
(cr138565_state[(0)] = cr138565_block_3);

(cr138565_state[(2)] = cr138565_place_1);

(cr138565_state[(1)] = cr138565_place_2);

(cr138565_state[(3)] = cr138565_place_3);

return cr138565_state;
}catch (e138601){var cr138565_exception = e138601;
(cr138565_state[(0)] = null);

throw cr138565_exception;
}});
var cr138565_block_3 = (function frontend$worker$rtc$core$get_remote_updates_$_cr138565_block_3(cr138565_state){
try{var cr138565_place_1 = (cr138565_state[(2)]);
var cr138565_place_4 = (1);
var cr138565_place_5 = missionary.core.eduction;
var cr138565_place_6 = cljs.core.filter;
var cr138565_place_7 = (function (data){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, ["push-asset-upload-updates",null,"push-updates",null,"online-users-updated",null], null), null),new cljs.core.Keyword(null,"req-id","req-id",-471642231).cljs$core$IFn$_invoke$arity$1(data));
});
var cr138565_place_8 = (function (){var G__138604 = cr138565_place_7;
var fexpr__138603 = cr138565_place_6;
return (fexpr__138603.cljs$core$IFn$_invoke$arity$1 ? fexpr__138603.cljs$core$IFn$_invoke$arity$1(G__138604) : fexpr__138603.call(null,G__138604));
})();
var cr138565_place_9 = frontend.worker.rtc.ws.recv_flow;
var cr138565_place_10 = cr138565_place_1;
var cr138565_place_11 = (function (){var G__138606 = cr138565_place_10;
var fexpr__138605 = cr138565_place_9;
return (fexpr__138605.cljs$core$IFn$_invoke$arity$1 ? fexpr__138605.cljs$core$IFn$_invoke$arity$1(G__138606) : fexpr__138605.call(null,G__138606));
})();
var cr138565_place_12 = (function (){var G__138608 = cr138565_place_8;
var G__138609 = cr138565_place_11;
var fexpr__138607 = cr138565_place_5;
return (fexpr__138607.cljs$core$IFn$_invoke$arity$2 ? fexpr__138607.cljs$core$IFn$_invoke$arity$2(G__138608,G__138609) : fexpr__138607.call(null,G__138608,G__138609));
})();
(cr138565_state[(0)] = cr138565_block_4);

(cr138565_state[(2)] = null);

return missionary.core.fork(cr138565_place_4,cr138565_place_12);
}catch (e138602){var cr138565_exception = e138602;
(cr138565_state[(0)] = cr138565_block_5);

(cr138565_state[(2)] = null);

(cr138565_state[(1)] = cr138565_exception);

return cr138565_state;
}});
var cr138565_block_12 = (function frontend$worker$rtc$core$get_remote_updates_$_cr138565_block_12(cr138565_state){
try{var cr138565_place_2 = (cr138565_state[(1)]);
var cr138565_place_3 = (cr138565_state[(3)]);
var cr138565_place_25 = (cljs.core.truth_(cr138565_place_3)?(function(){throw cr138565_place_2})():cr138565_place_2);
var cr138565_place_26 = cr138565_place_25;
var cr138565_place_27 = frontend.worker.rtc.core.sentinel;
var cr138565_place_28 = (cr138565_place_26 === cr138565_place_27);
var cr138565_place_29 = null;
if(cr138565_place_28){
(cr138565_state[(0)] = cr138565_block_14);

(cr138565_state[(1)] = null);

(cr138565_state[(3)] = null);

return cr138565_state;
} else {
(cr138565_state[(0)] = cr138565_block_13);

(cr138565_state[(1)] = null);

(cr138565_state[(3)] = null);

(cr138565_state[(2)] = cr138565_place_25);

(cr138565_state[(1)] = cr138565_place_29);

return cr138565_state;
}
}catch (e138610){var cr138565_exception = e138610;
(cr138565_state[(0)] = null);

(cr138565_state[(1)] = null);

(cr138565_state[(3)] = null);

throw cr138565_exception;
}});
var cr138565_block_4 = (function frontend$worker$rtc$core$get_remote_updates_$_cr138565_block_4(cr138565_state){
try{var cr138565_place_13 = missionary.core.unpark();
(cr138565_state[(0)] = cr138565_block_12);

(cr138565_state[(1)] = cr138565_place_13);

return cr138565_state;
}catch (e138611){var cr138565_exception = e138611;
(cr138565_state[(0)] = cr138565_block_5);

(cr138565_state[(1)] = cr138565_exception);

return cr138565_state;
}});
var cr138565_block_7 = (function frontend$worker$rtc$core$get_remote_updates_$_cr138565_block_7(cr138565_state){
try{var cr138565_place_20 = null;
(cr138565_state[(0)] = cr138565_block_9);

(cr138565_state[(4)] = cr138565_place_20);

return cr138565_state;
}catch (e138612){var cr138565_exception = e138612;
(cr138565_state[(0)] = cr138565_block_12);

(cr138565_state[(4)] = null);

(cr138565_state[(2)] = null);

(cr138565_state[(3)] = true);

(cr138565_state[(1)] = cr138565_exception);

return cr138565_state;
}});
var cr138565_block_8 = (function frontend$worker$rtc$core$get_remote_updates_$_cr138565_block_8(cr138565_state){
try{var cr138565_place_2 = (cr138565_state[(1)]);
var cr138565_place_21 = cr138565_place_2;
var cr138565_place_22 = (function(){throw cr138565_place_21})();
(cr138565_state[(0)] = null);

(cr138565_state[(1)] = null);

(cr138565_state[(3)] = null);

return null;
}catch (e138613){var cr138565_exception = e138613;
(cr138565_state[(0)] = cr138565_block_12);

(cr138565_state[(3)] = true);

(cr138565_state[(1)] = cr138565_exception);

return cr138565_state;
}});
var cr138565_block_0 = (function frontend$worker$rtc$core$get_remote_updates_$_cr138565_block_0(cr138565_state){
try{(cr138565_state[(0)] = cr138565_block_1);

return cr138565_state;
}catch (e138614){var cr138565_exception = e138614;
(cr138565_state[(0)] = null);

throw cr138565_exception;
}});
var cr138565_block_9 = (function frontend$worker$rtc$core$get_remote_updates_$_cr138565_block_9(cr138565_state){
try{var cr138565_place_19 = (cr138565_state[(4)]);
(cr138565_state[(0)] = cr138565_block_11);

(cr138565_state[(4)] = null);

(cr138565_state[(2)] = cr138565_place_19);

return cr138565_state;
}catch (e138615){var cr138565_exception = e138615;
(cr138565_state[(0)] = cr138565_block_12);

(cr138565_state[(4)] = null);

(cr138565_state[(2)] = null);

(cr138565_state[(3)] = true);

(cr138565_state[(1)] = cr138565_exception);

return cr138565_state;
}});
var cr138565_block_13 = (function frontend$worker$rtc$core$get_remote_updates_$_cr138565_block_13(cr138565_state){
try{var cr138565_place_25 = (cr138565_state[(2)]);
var cr138565_place_30 = cr138565_place_25;
(cr138565_state[(0)] = cr138565_block_15);

(cr138565_state[(2)] = null);

(cr138565_state[(1)] = cr138565_place_30);

return cr138565_state;
}catch (e138616){var cr138565_exception = e138616;
(cr138565_state[(0)] = null);

(cr138565_state[(1)] = null);

(cr138565_state[(2)] = null);

throw cr138565_exception;
}});
var cr138565_block_6 = (function frontend$worker$rtc$core$get_remote_updates_$_cr138565_block_6(cr138565_state){
try{var cr138565_place_18 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr138565_place_19 = null;
if(cljs.core.truth_(cr138565_place_18)){
(cr138565_state[(0)] = cr138565_block_8);

(cr138565_state[(2)] = null);

return cr138565_state;
} else {
(cr138565_state[(0)] = cr138565_block_7);

(cr138565_state[(4)] = cr138565_place_19);

return cr138565_state;
}
}catch (e138617){var cr138565_exception = e138617;
(cr138565_state[(0)] = cr138565_block_12);

(cr138565_state[(2)] = null);

(cr138565_state[(3)] = true);

(cr138565_state[(1)] = cr138565_exception);

return cr138565_state;
}});
var cr138565_block_10 = (function frontend$worker$rtc$core$get_remote_updates_$_cr138565_block_10(cr138565_state){
try{var cr138565_place_2 = (cr138565_state[(1)]);
var cr138565_place_23 = cr138565_place_2;
var cr138565_place_24 = frontend.worker.rtc.core.sentinel;
(cr138565_state[(0)] = cr138565_block_11);

(cr138565_state[(2)] = cr138565_place_24);

return cr138565_state;
}catch (e138618){var cr138565_exception = e138618;
(cr138565_state[(0)] = cr138565_block_12);

(cr138565_state[(2)] = null);

(cr138565_state[(3)] = true);

(cr138565_state[(1)] = cr138565_exception);

return cr138565_state;
}});
var cr138565_block_11 = (function frontend$worker$rtc$core$get_remote_updates_$_cr138565_block_11(cr138565_state){
try{var cr138565_place_17 = (cr138565_state[(2)]);
(cr138565_state[(0)] = cr138565_block_12);

(cr138565_state[(2)] = null);

(cr138565_state[(1)] = cr138565_place_17);

return cr138565_state;
}catch (e138619){var cr138565_exception = e138619;
(cr138565_state[(0)] = cr138565_block_12);

(cr138565_state[(2)] = null);

(cr138565_state[(3)] = true);

(cr138565_state[(1)] = cr138565_exception);

return cr138565_state;
}});
var cr138565_block_14 = (function frontend$worker$rtc$core$get_remote_updates_$_cr138565_block_14(cr138565_state){
try{(cr138565_state[(0)] = cr138565_block_1);

return cr138565_state;
}catch (e138620){var cr138565_exception = e138620;
(cr138565_state[(0)] = null);

throw cr138565_exception;
}});
var cr138565_block_5 = (function frontend$worker$rtc$core$get_remote_updates_$_cr138565_block_5(cr138565_state){
try{var cr138565_place_2 = (cr138565_state[(1)]);
var cr138565_place_14 = cr138565_place_2;
var cr138565_place_15 = CloseEvent;
var cr138565_place_16 = (cr138565_place_14 instanceof cr138565_place_15);
var cr138565_place_17 = null;
if(cr138565_place_16){
(cr138565_state[(0)] = cr138565_block_10);

(cr138565_state[(2)] = cr138565_place_17);

return cr138565_state;
} else {
(cr138565_state[(0)] = cr138565_block_6);

(cr138565_state[(2)] = cr138565_place_17);

return cr138565_state;
}
}catch (e138621){var cr138565_exception = e138621;
(cr138565_state[(0)] = cr138565_block_12);

(cr138565_state[(3)] = true);

(cr138565_state[(1)] = cr138565_exception);

return cr138565_state;
}});
var cr138565_block_15 = (function frontend$worker$rtc$core$get_remote_updates_$_cr138565_block_15(cr138565_state){
try{var cr138565_place_29 = (cr138565_state[(1)]);
(cr138565_state[(0)] = null);

(cr138565_state[(1)] = null);

return cr138565_place_29;
}catch (e138622){var cr138565_exception = e138622;
(cr138565_state[(0)] = null);

(cr138565_state[(1)] = null);

throw cr138565_exception;
}});
return cloroutine.impl.coroutine((function (){var G__138623 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__138623[(0)] = cr138565_block_0);

return G__138623;
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
 *   reschedule next emit(INTERVAL-MS later) every time RESCHEDULE-FLOW emit a value.
 *   TODO: add immediate-emit-flow arg,
 *      e.g. when mobile-app becomes active, trigger one pull-remote-updates
 */
frontend.worker.rtc.core.create_pull_remote_updates_flow = (function frontend$worker$rtc$core$create_pull_remote_updates_flow(var_args){
var args__5732__auto__ = [];
var len__5726__auto___140118 = arguments.length;
var i__5727__auto___140119 = (0);
while(true){
if((i__5727__auto___140119 < len__5726__auto___140118)){
args__5732__auto__.push((arguments[i__5727__auto___140119]));

var G__140120 = (i__5727__auto___140119 + (1));
i__5727__auto___140119 = G__140120;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.worker.rtc.core.create_pull_remote_updates_flow.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.worker.rtc.core.create_pull_remote_updates_flow.cljs$core$IFn$_invoke$arity$variadic = (function (interval_ms,reschedule_flow,p__138627){
var vec__138628 = p__138627;
var _immediate_emit_flow = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138628,(0),null);
var v = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"pull-remote-updates","pull-remote-updates",-472969758)], null);
var clock_flow = cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr138631_block_0 = (function frontend$worker$rtc$core$cr138631_block_0(cr138631_state){
try{(cr138631_state[(0)] = cr138631_block_1);

return cr138631_state;
}catch (e138649){var cr138631_exception = e138649;
(cr138631_state[(0)] = null);

throw cr138631_exception;
}});
var cr138631_block_1 = (function frontend$worker$rtc$core$cr138631_block_1(cr138631_state){
try{var cr138631_place_0 = (1);
var cr138631_place_1 = missionary.core.seed;
var cr138631_place_2 = cljs.core.range;
var cr138631_place_3 = (2);
var cr138631_place_4 = (function (){var G__138652 = cr138631_place_3;
var fexpr__138651 = cr138631_place_2;
return (fexpr__138651.cljs$core$IFn$_invoke$arity$1 ? fexpr__138651.cljs$core$IFn$_invoke$arity$1(G__138652) : fexpr__138651.call(null,G__138652));
})();
var cr138631_place_5 = (function (){var G__138654 = cr138631_place_4;
var fexpr__138653 = cr138631_place_1;
return (fexpr__138653.cljs$core$IFn$_invoke$arity$1 ? fexpr__138653.cljs$core$IFn$_invoke$arity$1(G__138654) : fexpr__138653.call(null,G__138654));
})();
(cr138631_state[(0)] = cr138631_block_2);

return missionary.core.fork(cr138631_place_0,cr138631_place_5);
}catch (e138650){var cr138631_exception = e138650;
(cr138631_state[(0)] = null);

throw cr138631_exception;
}});
var cr138631_block_2 = (function frontend$worker$rtc$core$cr138631_block_2(cr138631_state){
try{var cr138631_place_6 = missionary.core.unpark();
var cr138631_place_7 = cr138631_place_6;
var cr138631_place_8 = null;
var G__138656 = cr138631_place_7;
switch (G__138656) {
case (0):
(cr138631_state[(0)] = cr138631_block_3);

(cr138631_state[(1)] = cr138631_place_8);

return cr138631_state;

break;
case (1):
(cr138631_state[(0)] = cr138631_block_5);

return cr138631_state;

break;
default:
(cr138631_state[(0)] = cr138631_block_6);

(cr138631_state[(1)] = cr138631_place_6);

return cr138631_state;

}
}catch (e138655){var cr138631_exception = e138655;
(cr138631_state[(0)] = null);

throw cr138631_exception;
}});
var cr138631_block_3 = (function frontend$worker$rtc$core$cr138631_block_3(cr138631_state){
try{var cr138631_place_9 = missionary.core.sleep;
var cr138631_place_10 = interval_ms;
var cr138631_place_11 = v;
var cr138631_place_12 = (function (){var G__138659 = cr138631_place_10;
var G__138660 = cr138631_place_11;
var fexpr__138658 = cr138631_place_9;
return (fexpr__138658.cljs$core$IFn$_invoke$arity$2 ? fexpr__138658.cljs$core$IFn$_invoke$arity$2(G__138659,G__138660) : fexpr__138658.call(null,G__138659,G__138660));
})();
(cr138631_state[(0)] = cr138631_block_4);

return missionary.core.park(cr138631_place_12);
}catch (e138657){var cr138631_exception = e138657;
(cr138631_state[(0)] = null);

(cr138631_state[(1)] = null);

throw cr138631_exception;
}});
var cr138631_block_4 = (function frontend$worker$rtc$core$cr138631_block_4(cr138631_state){
try{var cr138631_place_13 = missionary.core.unpark();
(cr138631_state[(0)] = cr138631_block_7);

(cr138631_state[(1)] = cr138631_place_13);

return cr138631_state;
}catch (e138661){var cr138631_exception = e138661;
(cr138631_state[(0)] = null);

(cr138631_state[(1)] = null);

throw cr138631_exception;
}});
var cr138631_block_5 = (function frontend$worker$rtc$core$cr138631_block_5(cr138631_state){
try{(cr138631_state[(0)] = cr138631_block_1);

return cr138631_state;
}catch (e138662){var cr138631_exception = e138662;
(cr138631_state[(0)] = null);

throw cr138631_exception;
}});
var cr138631_block_6 = (function frontend$worker$rtc$core$cr138631_block_6(cr138631_state){
try{var cr138631_place_6 = (cr138631_state[(1)]);
var cr138631_place_14 = "No matching clause: ";
var cr138631_place_15 = cr138631_place_6;
var cr138631_place_16 = [cr138631_place_14,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr138631_place_15)].join('');
var cr138631_place_17 = (new Error(cr138631_place_16));
var cr138631_place_18 = (function(){throw cr138631_place_17})();
(cr138631_state[(0)] = null);

(cr138631_state[(1)] = null);

return null;
}catch (e138663){var cr138631_exception = e138663;
(cr138631_state[(0)] = null);

(cr138631_state[(1)] = null);

throw cr138631_exception;
}});
var cr138631_block_7 = (function frontend$worker$rtc$core$cr138631_block_7(cr138631_state){
try{var cr138631_place_8 = (cr138631_state[(1)]);
(cr138631_state[(0)] = null);

(cr138631_state[(1)] = null);

return cr138631_place_8;
}catch (e138664){var cr138631_exception = e138664;
(cr138631_state[(0)] = null);

(cr138631_state[(1)] = null);

throw cr138631_exception;
}});
return cloroutine.impl.coroutine((function (){var G__138665 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((2));
(G__138665[(0)] = cr138631_block_0);

return G__138665;
})());
})(),missionary.core.ap_run);
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr138666_block_3 = (function frontend$worker$rtc$core$cr138666_block_3(cr138666_state){
try{var cr138666_place_10 = frontend.common.missionary.continue_flow;
var cr138666_place_11 = reschedule_flow;
var cr138666_place_12 = (function (){var G__138697 = cr138666_place_11;
var fexpr__138696 = cr138666_place_10;
return (fexpr__138696.cljs$core$IFn$_invoke$arity$1 ? fexpr__138696.cljs$core$IFn$_invoke$arity$1(G__138697) : fexpr__138696.call(null,G__138697));
})();
(cr138666_state[(0)] = cr138666_block_4);

return missionary.core.switch$(cr138666_place_12);
}catch (e138695){var cr138666_exception = e138695;
(cr138666_state[(0)] = null);

(cr138666_state[(1)] = null);

throw cr138666_exception;
}});
var cr138666_block_11 = (function frontend$worker$rtc$core$cr138666_block_11(cr138666_state){
try{var cr138666_place_23 = (cr138666_state[(5)]);
(cr138666_state[(0)] = cr138666_block_14);

(cr138666_state[(5)] = null);

(cr138666_state[(4)] = cr138666_place_23);

return cr138666_state;
}catch (e138698){var cr138666_exception = e138698;
(cr138666_state[(0)] = cr138666_block_15);

(cr138666_state[(5)] = null);

(cr138666_state[(4)] = null);

(cr138666_state[(2)] = true);

(cr138666_state[(3)] = cr138666_exception);

return cr138666_state;
}});
var cr138666_block_17 = (function frontend$worker$rtc$core$cr138666_block_17(cr138666_state){
try{var cr138666_place_8 = (cr138666_state[(1)]);
(cr138666_state[(0)] = null);

(cr138666_state[(1)] = null);

return cr138666_place_8;
}catch (e138699){var cr138666_exception = e138699;
(cr138666_state[(0)] = null);

(cr138666_state[(1)] = null);

throw cr138666_exception;
}});
var cr138666_block_16 = (function frontend$worker$rtc$core$cr138666_block_16(cr138666_state){
try{var cr138666_place_6 = (cr138666_state[(1)]);
var cr138666_place_32 = "No matching clause: ";
var cr138666_place_33 = cr138666_place_6;
var cr138666_place_34 = [cr138666_place_32,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr138666_place_33)].join('');
var cr138666_place_35 = (new Error(cr138666_place_34));
var cr138666_place_36 = (function(){throw cr138666_place_35})();
(cr138666_state[(0)] = null);

(cr138666_state[(1)] = null);

return null;
}catch (e138700){var cr138666_exception = e138700;
(cr138666_state[(0)] = null);

(cr138666_state[(1)] = null);

throw cr138666_exception;
}});
var cr138666_block_4 = (function frontend$worker$rtc$core$cr138666_block_4(cr138666_state){
try{var cr138666_place_13 = missionary.core.unpark();
var cr138666_place_14 = null;
var cr138666_place_15 = false;
(cr138666_state[(0)] = cr138666_block_5);

(cr138666_state[(3)] = cr138666_place_14);

(cr138666_state[(2)] = cr138666_place_15);

return cr138666_state;
}catch (e138701){var cr138666_exception = e138701;
(cr138666_state[(0)] = null);

(cr138666_state[(1)] = null);

throw cr138666_exception;
}});
var cr138666_block_5 = (function frontend$worker$rtc$core$cr138666_block_5(cr138666_state){
try{var cr138666_place_16 = clock_flow;
(cr138666_state[(0)] = cr138666_block_6);

return missionary.core.switch$(cr138666_place_16);
}catch (e138702){var cr138666_exception = e138702;
(cr138666_state[(0)] = cr138666_block_7);

(cr138666_state[(3)] = cr138666_exception);

return cr138666_state;
}});
var cr138666_block_6 = (function frontend$worker$rtc$core$cr138666_block_6(cr138666_state){
try{var cr138666_place_17 = missionary.core.unpark();
(cr138666_state[(0)] = cr138666_block_15);

(cr138666_state[(3)] = cr138666_place_17);

return cr138666_state;
}catch (e138703){var cr138666_exception = e138703;
(cr138666_state[(0)] = cr138666_block_7);

(cr138666_state[(3)] = cr138666_exception);

return cr138666_state;
}});
var cr138666_block_1 = (function frontend$worker$rtc$core$cr138666_block_1(cr138666_state){
try{var cr138666_place_6 = missionary.core.unpark();
var cr138666_place_7 = cr138666_place_6;
var cr138666_place_8 = null;
var G__138705 = cr138666_place_7;
switch (G__138705) {
case (0):
(cr138666_state[(0)] = cr138666_block_2);

(cr138666_state[(1)] = cr138666_place_8);

return cr138666_state;

break;
case (1):
(cr138666_state[(0)] = cr138666_block_3);

(cr138666_state[(1)] = cr138666_place_8);

return cr138666_state;

break;
default:
(cr138666_state[(0)] = cr138666_block_16);

(cr138666_state[(1)] = cr138666_place_6);

return cr138666_state;

}
}catch (e138704){var cr138666_exception = e138704;
(cr138666_state[(0)] = null);

throw cr138666_exception;
}});
var cr138666_block_10 = (function frontend$worker$rtc$core$cr138666_block_10(cr138666_state){
try{var cr138666_place_14 = (cr138666_state[(3)]);
var cr138666_place_25 = cr138666_place_14;
var cr138666_place_26 = (function(){throw cr138666_place_25})();
(cr138666_state[(0)] = null);

(cr138666_state[(2)] = null);

(cr138666_state[(3)] = null);

(cr138666_state[(1)] = null);

return null;
}catch (e138706){var cr138666_exception = e138706;
(cr138666_state[(0)] = cr138666_block_15);

(cr138666_state[(2)] = true);

(cr138666_state[(3)] = cr138666_exception);

return cr138666_state;
}});
var cr138666_block_9 = (function frontend$worker$rtc$core$cr138666_block_9(cr138666_state){
try{var cr138666_place_24 = null;
(cr138666_state[(0)] = cr138666_block_11);

(cr138666_state[(5)] = cr138666_place_24);

return cr138666_state;
}catch (e138707){var cr138666_exception = e138707;
(cr138666_state[(0)] = cr138666_block_15);

(cr138666_state[(5)] = null);

(cr138666_state[(4)] = null);

(cr138666_state[(2)] = true);

(cr138666_state[(3)] = cr138666_exception);

return cr138666_state;
}});
var cr138666_block_15 = (function frontend$worker$rtc$core$cr138666_block_15(cr138666_state){
try{var cr138666_place_15 = (cr138666_state[(2)]);
var cr138666_place_14 = (cr138666_state[(3)]);
var cr138666_place_31 = (cljs.core.truth_(cr138666_place_15)?(function(){throw cr138666_place_14})():cr138666_place_14);
(cr138666_state[(0)] = cr138666_block_17);

(cr138666_state[(2)] = null);

(cr138666_state[(3)] = null);

(cr138666_state[(1)] = cr138666_place_31);

return cr138666_state;
}catch (e138708){var cr138666_exception = e138708;
(cr138666_state[(0)] = null);

(cr138666_state[(2)] = null);

(cr138666_state[(3)] = null);

(cr138666_state[(1)] = null);

throw cr138666_exception;
}});
var cr138666_block_7 = (function frontend$worker$rtc$core$cr138666_block_7(cr138666_state){
try{var cr138666_place_14 = (cr138666_state[(3)]);
var cr138666_place_18 = cr138666_place_14;
var cr138666_place_19 = missionary.Cancelled;
var cr138666_place_20 = (cr138666_place_18 instanceof cr138666_place_19);
var cr138666_place_21 = null;
if(cr138666_place_20){
(cr138666_state[(0)] = cr138666_block_12);

(cr138666_state[(4)] = cr138666_place_21);

return cr138666_state;
} else {
(cr138666_state[(0)] = cr138666_block_8);

(cr138666_state[(4)] = cr138666_place_21);

return cr138666_state;
}
}catch (e138709){var cr138666_exception = e138709;
(cr138666_state[(0)] = cr138666_block_15);

(cr138666_state[(2)] = true);

(cr138666_state[(3)] = cr138666_exception);

return cr138666_state;
}});
var cr138666_block_12 = (function frontend$worker$rtc$core$cr138666_block_12(cr138666_state){
try{var cr138666_place_14 = (cr138666_state[(3)]);
var cr138666_place_27 = cr138666_place_14;
var cr138666_place_28 = (1);
var cr138666_place_29 = missionary.core.none;
(cr138666_state[(0)] = cr138666_block_13);

return missionary.core.fork(cr138666_place_28,cr138666_place_29);
}catch (e138710){var cr138666_exception = e138710;
(cr138666_state[(0)] = cr138666_block_15);

(cr138666_state[(4)] = null);

(cr138666_state[(2)] = true);

(cr138666_state[(3)] = cr138666_exception);

return cr138666_state;
}});
var cr138666_block_14 = (function frontend$worker$rtc$core$cr138666_block_14(cr138666_state){
try{var cr138666_place_21 = (cr138666_state[(4)]);
(cr138666_state[(0)] = cr138666_block_15);

(cr138666_state[(4)] = null);

(cr138666_state[(3)] = cr138666_place_21);

return cr138666_state;
}catch (e138711){var cr138666_exception = e138711;
(cr138666_state[(0)] = cr138666_block_15);

(cr138666_state[(4)] = null);

(cr138666_state[(2)] = true);

(cr138666_state[(3)] = cr138666_exception);

return cr138666_state;
}});
var cr138666_block_2 = (function frontend$worker$rtc$core$cr138666_block_2(cr138666_state){
try{var cr138666_place_9 = v;
(cr138666_state[(0)] = cr138666_block_17);

(cr138666_state[(1)] = cr138666_place_9);

return cr138666_state;
}catch (e138712){var cr138666_exception = e138712;
(cr138666_state[(0)] = null);

(cr138666_state[(1)] = null);

throw cr138666_exception;
}});
var cr138666_block_13 = (function frontend$worker$rtc$core$cr138666_block_13(cr138666_state){
try{var cr138666_place_30 = missionary.core.unpark();
(cr138666_state[(0)] = cr138666_block_14);

(cr138666_state[(4)] = cr138666_place_30);

return cr138666_state;
}catch (e138713){var cr138666_exception = e138713;
(cr138666_state[(0)] = cr138666_block_15);

(cr138666_state[(4)] = null);

(cr138666_state[(2)] = true);

(cr138666_state[(3)] = cr138666_exception);

return cr138666_state;
}});
var cr138666_block_0 = (function frontend$worker$rtc$core$cr138666_block_0(cr138666_state){
try{var cr138666_place_0 = (1);
var cr138666_place_1 = missionary.core.seed;
var cr138666_place_2 = cljs.core.range;
var cr138666_place_3 = (2);
var cr138666_place_4 = (function (){var G__138716 = cr138666_place_3;
var fexpr__138715 = cr138666_place_2;
return (fexpr__138715.cljs$core$IFn$_invoke$arity$1 ? fexpr__138715.cljs$core$IFn$_invoke$arity$1(G__138716) : fexpr__138715.call(null,G__138716));
})();
var cr138666_place_5 = (function (){var G__138718 = cr138666_place_4;
var fexpr__138717 = cr138666_place_1;
return (fexpr__138717.cljs$core$IFn$_invoke$arity$1 ? fexpr__138717.cljs$core$IFn$_invoke$arity$1(G__138718) : fexpr__138717.call(null,G__138718));
})();
(cr138666_state[(0)] = cr138666_block_1);

return missionary.core.fork(cr138666_place_0,cr138666_place_5);
}catch (e138714){var cr138666_exception = e138714;
(cr138666_state[(0)] = null);

throw cr138666_exception;
}});
var cr138666_block_8 = (function frontend$worker$rtc$core$cr138666_block_8(cr138666_state){
try{var cr138666_place_22 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr138666_place_23 = null;
if(cljs.core.truth_(cr138666_place_22)){
(cr138666_state[(0)] = cr138666_block_10);

(cr138666_state[(4)] = null);

return cr138666_state;
} else {
(cr138666_state[(0)] = cr138666_block_9);

(cr138666_state[(5)] = cr138666_place_23);

return cr138666_state;
}
}catch (e138719){var cr138666_exception = e138719;
(cr138666_state[(0)] = cr138666_block_15);

(cr138666_state[(4)] = null);

(cr138666_state[(2)] = true);

(cr138666_state[(3)] = cr138666_exception);

return cr138666_state;
}});
return cloroutine.impl.coroutine((function (){var G__138720 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((6));
(G__138720[(0)] = cr138666_block_0);

return G__138720;
})());
})(),missionary.core.ap_run);
}));

(frontend.worker.rtc.core.create_pull_remote_updates_flow.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.worker.rtc.core.create_pull_remote_updates_flow.cljs$lang$applyTo = (function (seq138624){
var G__138625 = cljs.core.first(seq138624);
var seq138624__$1 = cljs.core.next(seq138624);
var G__138626 = cljs.core.first(seq138624__$1);
var seq138624__$2 = cljs.core.next(seq138624__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__138625,G__138626,seq138624__$2);
}));

/**
 * Return a flow: emit event if need to notify the server to inject users-info to graph.
 */
frontend.worker.rtc.core.create_inject_users_info_flow = (function frontend$worker$rtc$core$create_inject_users_info_flow(repo,online_users_updated_flow){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr138721_block_16 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_16(cr138721_state){
try{var cr138721_place_67 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr138721_place_68 = new cljs.core.Keyword(null,"pull-remote-updates","pull-remote-updates",-472969758);
var cr138721_place_69 = new cljs.core.Keyword(null,"from","from",1815293044);
var cr138721_place_70 = new cljs.core.Keyword(null,"x","x",2099068185);
var cr138721_place_71 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr138721_place_69,cr138721_place_70,cr138721_place_67,cr138721_place_68]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
(cr138721_state[(0)] = cr138721_block_18);

(cr138721_state[(4)] = cr138721_place_71);

return cr138721_state;
}catch (e138788){var cr138721_exception = e138788;
(cr138721_state[(0)] = null);

(cr138721_state[(2)] = null);

(cr138721_state[(4)] = null);

(cr138721_state[(3)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_12 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_12(cr138721_state){
try{var cr138721_place_54 = missionary.core.unpark();
(cr138721_state[(0)] = cr138721_block_19);

(cr138721_state[(3)] = cr138721_place_54);

return cr138721_state;
}catch (e138789){var cr138721_exception = e138789;
(cr138721_state[(0)] = null);

(cr138721_state[(2)] = null);

(cr138721_state[(3)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_7 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_7(cr138721_state){
try{var cr138721_place_8 = (cr138721_state[(3)]);
var cr138721_place_13 = (cr138721_state[(4)]);
var cr138721_place_19 = cr138721_place_13;
var cr138721_place_20 = cljs.core.into;
var cr138721_place_21 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr138721_place_22 = cljs.core.map;
var cr138721_place_23 = cljs.core.juxt;
var cr138721_place_24 = new cljs.core.Keyword("user","uuid","user/uuid",2146253734);
var cr138721_place_25 = cljs.core.identity;
var cr138721_place_26 = (function (){var G__138792 = cr138721_place_24;
var G__138793 = cr138721_place_25;
var fexpr__138791 = cr138721_place_23;
return (fexpr__138791.cljs$core$IFn$_invoke$arity$2 ? fexpr__138791.cljs$core$IFn$_invoke$arity$2(G__138792,G__138793) : fexpr__138791.call(null,G__138792,G__138793));
})();
var cr138721_place_27 = cr138721_place_19;
var cr138721_place_28 = (function (){var G__138795 = cr138721_place_26;
var G__138796 = cr138721_place_27;
var fexpr__138794 = cr138721_place_22;
return (fexpr__138794.cljs$core$IFn$_invoke$arity$2 ? fexpr__138794.cljs$core$IFn$_invoke$arity$2(G__138795,G__138796) : fexpr__138794.call(null,G__138795,G__138796));
})();
var cr138721_place_29 = (function (){var G__138798 = cr138721_place_21;
var G__138799 = cr138721_place_28;
var fexpr__138797 = cr138721_place_20;
return (fexpr__138797.cljs$core$IFn$_invoke$arity$2 ? fexpr__138797.cljs$core$IFn$_invoke$arity$2(G__138798,G__138799) : fexpr__138797.call(null,G__138798,G__138799));
})();
var cr138721_place_30 = cljs.core.keep;
var cr138721_place_31 = (function (user_uuid){
var G__138722 = cljs.core.deref(cr138721_place_8);
var G__138723 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),user_uuid], null);
var G__138800 = G__138722;
var G__138801 = G__138723;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__138800,G__138801) : datascript.core.entity.call(null,G__138800,G__138801));
});
var cr138721_place_32 = cljs.core.keys;
var cr138721_place_33 = cr138721_place_29;
var cr138721_place_34 = (function (){var G__138803 = cr138721_place_33;
var fexpr__138802 = cr138721_place_32;
return (fexpr__138802.cljs$core$IFn$_invoke$arity$1 ? fexpr__138802.cljs$core$IFn$_invoke$arity$1(G__138803) : fexpr__138802.call(null,G__138803));
})();
var cr138721_place_35 = (function (){var G__138805 = cr138721_place_31;
var G__138806 = cr138721_place_34;
var fexpr__138804 = cr138721_place_30;
return (fexpr__138804.cljs$core$IFn$_invoke$arity$2 ? fexpr__138804.cljs$core$IFn$_invoke$arity$2(G__138805,G__138806) : fexpr__138804.call(null,G__138805,G__138806));
})();
var cr138721_place_36 = cljs.core.not_EQ_;
var cr138721_place_37 = cljs.core.count;
var cr138721_place_38 = cr138721_place_35;
var cr138721_place_39 = (function (){var G__138808 = cr138721_place_38;
var fexpr__138807 = cr138721_place_37;
return (fexpr__138807.cljs$core$IFn$_invoke$arity$1 ? fexpr__138807.cljs$core$IFn$_invoke$arity$1(G__138808) : fexpr__138807.call(null,G__138808));
})();
var cr138721_place_40 = cljs.core.count;
var cr138721_place_41 = cr138721_place_29;
var cr138721_place_42 = (function (){var G__138810 = cr138721_place_41;
var fexpr__138809 = cr138721_place_40;
return (fexpr__138809.cljs$core$IFn$_invoke$arity$1 ? fexpr__138809.cljs$core$IFn$_invoke$arity$1(G__138810) : fexpr__138809.call(null,G__138810));
})();
var cr138721_place_43 = (function (){var G__138812 = cr138721_place_39;
var G__138813 = cr138721_place_42;
var fexpr__138811 = cr138721_place_36;
return (fexpr__138811.cljs$core$IFn$_invoke$arity$2 ? fexpr__138811.cljs$core$IFn$_invoke$arity$2(G__138812,G__138813) : fexpr__138811.call(null,G__138812,G__138813));
})();
var cr138721_place_44 = cr138721_place_43;
var cr138721_place_45 = null;
if(cr138721_place_44){
(cr138721_state[(0)] = cr138721_block_9);

(cr138721_state[(3)] = null);

(cr138721_state[(4)] = null);

(cr138721_state[(3)] = cr138721_place_43);

(cr138721_state[(4)] = cr138721_place_45);

return cr138721_state;
} else {
(cr138721_state[(0)] = cr138721_block_8);

(cr138721_state[(3)] = null);

(cr138721_state[(4)] = null);

(cr138721_state[(3)] = cr138721_place_29);

(cr138721_state[(4)] = cr138721_place_45);

(cr138721_state[(5)] = cr138721_place_35);

return cr138721_state;
}
}catch (e138790){var cr138721_exception = e138790;
(cr138721_state[(0)] = null);

(cr138721_state[(2)] = null);

(cr138721_state[(3)] = null);

(cr138721_state[(4)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_20 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_20(cr138721_state){
try{var cr138721_place_15 = (cr138721_state[(2)]);
(cr138721_state[(0)] = cr138721_block_21);

(cr138721_state[(2)] = null);

(cr138721_state[(1)] = cr138721_place_15);

return cr138721_state;
}catch (e138814){var cr138721_exception = e138814;
(cr138721_state[(0)] = null);

(cr138721_state[(2)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_6 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_6(cr138721_state){
try{var cr138721_place_18 = missionary.core.unpark();
(cr138721_state[(0)] = cr138721_block_20);

(cr138721_state[(2)] = cr138721_place_18);

return cr138721_state;
}catch (e138815){var cr138721_exception = e138815;
(cr138721_state[(0)] = null);

(cr138721_state[(2)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_14 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_14(cr138721_state){
try{var cr138721_place_61 = missionary.core.unpark();
var cr138721_place_62 = cr138721_place_61;
var cr138721_place_63 = null;
var G__138817 = cr138721_place_62;
switch (G__138817) {
case (0):
(cr138721_state[(0)] = cr138721_block_15);

(cr138721_state[(4)] = cr138721_place_63);

return cr138721_state;

break;
case (1):
(cr138721_state[(0)] = cr138721_block_16);

(cr138721_state[(4)] = cr138721_place_63);

return cr138721_state;

break;
default:
(cr138721_state[(0)] = cr138721_block_17);

(cr138721_state[(2)] = null);

(cr138721_state[(3)] = null);

(cr138721_state[(1)] = null);

(cr138721_state[(1)] = cr138721_place_61);

return cr138721_state;

}
}catch (e138816){var cr138721_exception = e138816;
(cr138721_state[(0)] = null);

(cr138721_state[(2)] = null);

(cr138721_state[(3)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_17 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_17(cr138721_state){
try{var cr138721_place_61 = (cr138721_state[(1)]);
var cr138721_place_72 = "No matching clause: ";
var cr138721_place_73 = cr138721_place_61;
var cr138721_place_74 = [cr138721_place_72,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr138721_place_73)].join('');
var cr138721_place_75 = (new Error(cr138721_place_74));
var cr138721_place_76 = (function(){throw cr138721_place_75})();
(cr138721_state[(0)] = null);

(cr138721_state[(1)] = null);

return null;
}catch (e138818){var cr138721_exception = e138818;
(cr138721_state[(0)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_0 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_0(cr138721_state){
try{var cr138721_place_0 = frontend.worker.state.get_datascript_conn;
var cr138721_place_1 = repo;
var cr138721_place_2 = (function (){var G__138821 = cr138721_place_1;
var fexpr__138820 = cr138721_place_0;
return (fexpr__138820.cljs$core$IFn$_invoke$arity$1 ? fexpr__138820.cljs$core$IFn$_invoke$arity$1(G__138821) : fexpr__138820.call(null,G__138821));
})();
var cr138721_place_3 = cr138721_place_2;
var cr138721_place_4 = null;
if(cljs.core.truth_(cr138721_place_3)){
(cr138721_state[(0)] = cr138721_block_3);

(cr138721_state[(2)] = cr138721_place_2);

(cr138721_state[(1)] = cr138721_place_4);

return cr138721_state;
} else {
(cr138721_state[(0)] = cr138721_block_1);

(cr138721_state[(1)] = cr138721_place_4);

return cr138721_state;
}
}catch (e138819){var cr138721_exception = e138819;
(cr138721_state[(0)] = null);

throw cr138721_exception;
}});
var cr138721_block_18 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_18(cr138721_state){
try{var cr138721_place_63 = (cr138721_state[(4)]);
(cr138721_state[(0)] = cr138721_block_19);

(cr138721_state[(4)] = null);

(cr138721_state[(3)] = cr138721_place_63);

return cr138721_state;
}catch (e138822){var cr138721_exception = e138822;
(cr138721_state[(0)] = null);

(cr138721_state[(2)] = null);

(cr138721_state[(4)] = null);

(cr138721_state[(3)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_8 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_8(cr138721_state){
try{var cr138721_place_29 = (cr138721_state[(3)]);
var cr138721_place_35 = (cr138721_state[(5)]);
var cr138721_place_46 = cljs.core.some;
var cr138721_place_47 = (function (user_block){
var user = (function (){var G__138727 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(user_block);
var G__138825 = G__138727;
var fexpr__138824 = cr138721_place_29;
return (fexpr__138824.cljs$core$IFn$_invoke$arity$1 ? fexpr__138824.cljs$core$IFn$_invoke$arity$1(G__138825) : fexpr__138824.call(null,G__138825));
})();
var vec__138724 = clojure.data.diff(cljs.core.select_keys(user_block,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.user","name","logseq.property.user/name",-1360026016),new cljs.core.Keyword("logseq.property.user","email","logseq.property.user/email",-1655206063),new cljs.core.Keyword("logseq.property.user","avatar","logseq.property.user/avatar",-416548858)], null)),cljs.core.update_keys(cljs.core.select_keys(user,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("user","name","user/name",1848814598),new cljs.core.Keyword("user","email","user/email",1419686391),new cljs.core.Keyword("user","avatar","user/avatar",-1612128612)], null)),(function (k){
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$2("logseq.property.user",cljs.core.name(k));
})));
var diff_r1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138724,(0),null);
var diff_r2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138724,(1),null);
return ((cljs.core.not((diff_r1 == null))) || (cljs.core.not((diff_r2 == null))));
});
var cr138721_place_48 = cr138721_place_35;
var cr138721_place_49 = (function (){var G__138827 = cr138721_place_47;
var G__138828 = cr138721_place_48;
var fexpr__138826 = cr138721_place_46;
return (fexpr__138826.cljs$core$IFn$_invoke$arity$2 ? fexpr__138826.cljs$core$IFn$_invoke$arity$2(G__138827,G__138828) : fexpr__138826.call(null,G__138827,G__138828));
})();
(cr138721_state[(0)] = cr138721_block_10);

(cr138721_state[(3)] = null);

(cr138721_state[(5)] = null);

(cr138721_state[(4)] = cr138721_place_49);

return cr138721_state;
}catch (e138823){var cr138721_exception = e138823;
(cr138721_state[(0)] = null);

(cr138721_state[(2)] = null);

(cr138721_state[(3)] = null);

(cr138721_state[(4)] = null);

(cr138721_state[(5)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_21 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_21(cr138721_state){
try{var cr138721_place_4 = (cr138721_state[(1)]);
(cr138721_state[(0)] = null);

(cr138721_state[(1)] = null);

return cr138721_place_4;
}catch (e138829){var cr138721_exception = e138829;
(cr138721_state[(0)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_5 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_5(cr138721_state){
try{var cr138721_place_16 = (1);
var cr138721_place_17 = missionary.core.none;
(cr138721_state[(0)] = cr138721_block_6);

return missionary.core.fork(cr138721_place_16,cr138721_place_17);
}catch (e138830){var cr138721_exception = e138830;
(cr138721_state[(0)] = null);

(cr138721_state[(2)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_9 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_9(cr138721_state){
try{var cr138721_place_43 = (cr138721_state[(3)]);
var cr138721_place_50 = cr138721_place_43;
(cr138721_state[(0)] = cr138721_block_10);

(cr138721_state[(3)] = null);

(cr138721_state[(4)] = cr138721_place_50);

return cr138721_state;
}catch (e138831){var cr138721_exception = e138831;
(cr138721_state[(0)] = null);

(cr138721_state[(3)] = null);

(cr138721_state[(2)] = null);

(cr138721_state[(4)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_4 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_4(cr138721_state){
try{var cr138721_place_9 = (cr138721_state[(2)]);
var cr138721_place_12 = missionary.core.unpark();
var cr138721_place_13 = (function (){var G__138834 = cr138721_place_12;
var fexpr__138833 = cr138721_place_9;
return (fexpr__138833.cljs$core$IFn$_invoke$arity$1 ? fexpr__138833.cljs$core$IFn$_invoke$arity$1(G__138834) : fexpr__138833.call(null,G__138834));
})();
var cr138721_place_14 = cr138721_place_13;
var cr138721_place_15 = null;
if(cr138721_place_14){
(cr138721_state[(0)] = cr138721_block_7);

(cr138721_state[(2)] = null);

(cr138721_state[(4)] = cr138721_place_13);

(cr138721_state[(2)] = cr138721_place_15);

return cr138721_state;
} else {
(cr138721_state[(0)] = cr138721_block_5);

(cr138721_state[(2)] = null);

(cr138721_state[(3)] = null);

(cr138721_state[(2)] = cr138721_place_15);

return cr138721_state;
}
}catch (e138832){var cr138721_exception = e138832;
(cr138721_state[(0)] = null);

(cr138721_state[(2)] = null);

(cr138721_state[(3)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_13 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_13(cr138721_state){
try{var cr138721_place_55 = (1);
var cr138721_place_56 = missionary.core.seed;
var cr138721_place_57 = cljs.core.range;
var cr138721_place_58 = (2);
var cr138721_place_59 = (function (){var G__138837 = cr138721_place_58;
var fexpr__138836 = cr138721_place_57;
return (fexpr__138836.cljs$core$IFn$_invoke$arity$1 ? fexpr__138836.cljs$core$IFn$_invoke$arity$1(G__138837) : fexpr__138836.call(null,G__138837));
})();
var cr138721_place_60 = (function (){var G__138839 = cr138721_place_59;
var fexpr__138838 = cr138721_place_56;
return (fexpr__138838.cljs$core$IFn$_invoke$arity$1 ? fexpr__138838.cljs$core$IFn$_invoke$arity$1(G__138839) : fexpr__138838.call(null,G__138839));
})();
(cr138721_state[(0)] = cr138721_block_14);

return missionary.core.fork(cr138721_place_55,cr138721_place_60);
}catch (e138835){var cr138721_exception = e138835;
(cr138721_state[(0)] = null);

(cr138721_state[(2)] = null);

(cr138721_state[(3)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_10 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_10(cr138721_state){
try{var cr138721_place_45 = (cr138721_state[(4)]);
var cr138721_place_51 = null;
if(cljs.core.truth_(cr138721_place_45)){
(cr138721_state[(0)] = cr138721_block_13);

(cr138721_state[(4)] = null);

(cr138721_state[(3)] = cr138721_place_51);

return cr138721_state;
} else {
(cr138721_state[(0)] = cr138721_block_11);

(cr138721_state[(4)] = null);

(cr138721_state[(3)] = cr138721_place_51);

return cr138721_state;
}
}catch (e138840){var cr138721_exception = e138840;
(cr138721_state[(0)] = null);

(cr138721_state[(2)] = null);

(cr138721_state[(4)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_3 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_3(cr138721_state){
try{var cr138721_place_2 = (cr138721_state[(2)]);
var cr138721_place_8 = cr138721_place_2;
var cr138721_place_9 = cljs.core.seq;
var cr138721_place_10 = (1);
var cr138721_place_11 = online_users_updated_flow;
(cr138721_state[(0)] = cr138721_block_4);

(cr138721_state[(2)] = null);

(cr138721_state[(3)] = cr138721_place_8);

(cr138721_state[(2)] = cr138721_place_9);

return missionary.core.fork(cr138721_place_10,cr138721_place_11);
}catch (e138841){var cr138721_exception = e138841;
(cr138721_state[(0)] = null);

(cr138721_state[(2)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_11 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_11(cr138721_state){
try{var cr138721_place_52 = (1);
var cr138721_place_53 = missionary.core.none;
(cr138721_state[(0)] = cr138721_block_12);

return missionary.core.fork(cr138721_place_52,cr138721_place_53);
}catch (e138842){var cr138721_exception = e138842;
(cr138721_state[(0)] = null);

(cr138721_state[(2)] = null);

(cr138721_state[(3)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_1 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_1(cr138721_state){
try{var cr138721_place_5 = (1);
var cr138721_place_6 = missionary.core.none;
(cr138721_state[(0)] = cr138721_block_2);

return missionary.core.fork(cr138721_place_5,cr138721_place_6);
}catch (e138843){var cr138721_exception = e138843;
(cr138721_state[(0)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_15 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_15(cr138721_state){
try{var cr138721_place_64 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr138721_place_65 = new cljs.core.Keyword(null,"inject-users-info","inject-users-info",-1403385625);
var cr138721_place_66 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr138721_place_64,cr138721_place_65]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
(cr138721_state[(0)] = cr138721_block_18);

(cr138721_state[(4)] = cr138721_place_66);

return cr138721_state;
}catch (e138844){var cr138721_exception = e138844;
(cr138721_state[(0)] = null);

(cr138721_state[(2)] = null);

(cr138721_state[(4)] = null);

(cr138721_state[(3)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_19 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_19(cr138721_state){
try{var cr138721_place_51 = (cr138721_state[(3)]);
(cr138721_state[(0)] = cr138721_block_20);

(cr138721_state[(3)] = null);

(cr138721_state[(2)] = cr138721_place_51);

return cr138721_state;
}catch (e138845){var cr138721_exception = e138845;
(cr138721_state[(0)] = null);

(cr138721_state[(2)] = null);

(cr138721_state[(3)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
var cr138721_block_2 = (function frontend$worker$rtc$core$create_inject_users_info_flow_$_cr138721_block_2(cr138721_state){
try{var cr138721_place_7 = missionary.core.unpark();
(cr138721_state[(0)] = cr138721_block_21);

(cr138721_state[(1)] = cr138721_place_7);

return cr138721_state;
}catch (e138846){var cr138721_exception = e138846;
(cr138721_state[(0)] = null);

(cr138721_state[(1)] = null);

throw cr138721_exception;
}});
return cloroutine.impl.coroutine((function (){var G__138847 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((6));
(G__138847[(0)] = cr138721_block_0);

return G__138847;
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
var G__138848 = new cljs.core.Keyword(null,"req-id","req-id",-471642231).cljs$core$IFn$_invoke$arity$1(data);
switch (G__138848) {
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
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__138848)].join('')));

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
return missionary.core.relieve.cljs$core$IFn$_invoke$arity$1(cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr138849_block_5 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr138849_block_5(cr138849_state){
try{var cr138849_place_3 = (cr138849_state[(1)]);
var cr138849_place_11 = frontend.worker.rtc.ws.create_mws_state_flow;
var cr138849_place_12 = cr138849_place_3;
var cr138849_place_13 = (function (){var G__138874 = cr138849_place_12;
var fexpr__138873 = cr138849_place_11;
return (fexpr__138873.cljs$core$IFn$_invoke$arity$1 ? fexpr__138873.cljs$core$IFn$_invoke$arity$1(G__138874) : fexpr__138873.call(null,G__138874));
})();
(cr138849_state[(0)] = cr138849_block_6);

(cr138849_state[(1)] = null);

return missionary.core.switch$(cr138849_place_13);
}catch (e138872){var cr138849_exception = e138872;
(cr138849_state[(0)] = cr138849_block_8);

(cr138849_state[(1)] = null);

(cr138849_state[(4)] = null);

(cr138849_state[(2)] = cr138849_exception);

return cr138849_state;
}});
var cr138849_block_15 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr138849_block_15(cr138849_state){
try{var cr138849_place_18 = (cr138849_state[(1)]);
(cr138849_state[(0)] = cr138849_block_16);

(cr138849_state[(1)] = null);

(cr138849_state[(2)] = cr138849_place_18);

return cr138849_state;
}catch (e138875){var cr138849_exception = e138875;
(cr138849_state[(0)] = cr138849_block_16);

(cr138849_state[(1)] = null);

(cr138849_state[(3)] = true);

(cr138849_state[(2)] = cr138849_exception);

return cr138849_state;
}});
var cr138849_block_16 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr138849_block_16(cr138849_state){
try{var cr138849_place_4 = (cr138849_state[(2)]);
var cr138849_place_5 = (cr138849_state[(3)]);
var cr138849_place_28 = (cljs.core.truth_(cr138849_place_5)?(function(){throw cr138849_place_4})():cr138849_place_4);
(cr138849_state[(0)] = null);

(cr138849_state[(2)] = null);

(cr138849_state[(3)] = null);

return cr138849_place_28;
}catch (e138876){var cr138849_exception = e138876;
(cr138849_state[(0)] = null);

(cr138849_state[(2)] = null);

(cr138849_state[(3)] = null);

throw cr138849_exception;
}});
var cr138849_block_2 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr138849_block_2(cr138849_state){
try{var cr138849_place_3 = (cr138849_state[(1)]);
var cr138849_place_6 = cr138849_place_3;
var cr138849_place_7 = null;
if(cljs.core.truth_(cr138849_place_6)){
(cr138849_state[(0)] = cr138849_block_5);

(cr138849_state[(4)] = cr138849_place_7);

return cr138849_state;
} else {
(cr138849_state[(0)] = cr138849_block_3);

(cr138849_state[(1)] = null);

(cr138849_state[(4)] = cr138849_place_7);

return cr138849_state;
}
}catch (e138877){var cr138849_exception = e138877;
(cr138849_state[(0)] = cr138849_block_8);

(cr138849_state[(1)] = null);

(cr138849_state[(2)] = cr138849_exception);

return cr138849_state;
}});
var cr138849_block_0 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr138849_block_0(cr138849_state){
try{var cr138849_place_0 = missionary.core.watch;
var cr138849_place_1 = _STAR_current_ws;
var cr138849_place_2 = (function (){var G__138880 = cr138849_place_1;
var fexpr__138879 = cr138849_place_0;
return (fexpr__138879.cljs$core$IFn$_invoke$arity$1 ? fexpr__138879.cljs$core$IFn$_invoke$arity$1(G__138880) : fexpr__138879.call(null,G__138880));
})();
(cr138849_state[(0)] = cr138849_block_1);

return missionary.core.switch$(cr138849_place_2);
}catch (e138878){var cr138849_exception = e138878;
(cr138849_state[(0)] = null);

throw cr138849_exception;
}});
var cr138849_block_14 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr138849_block_14(cr138849_state){
try{var cr138849_place_27 = missionary.core.unpark();
(cr138849_state[(0)] = cr138849_block_15);

(cr138849_state[(1)] = cr138849_place_27);

return cr138849_state;
}catch (e138881){var cr138849_exception = e138881;
(cr138849_state[(0)] = cr138849_block_16);

(cr138849_state[(1)] = null);

(cr138849_state[(3)] = true);

(cr138849_state[(2)] = cr138849_exception);

return cr138849_state;
}});
var cr138849_block_1 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr138849_block_1(cr138849_state){
try{var cr138849_place_3 = missionary.core.unpark();
var cr138849_place_4 = null;
var cr138849_place_5 = false;
(cr138849_state[(0)] = cr138849_block_2);

(cr138849_state[(1)] = cr138849_place_3);

(cr138849_state[(2)] = cr138849_place_4);

(cr138849_state[(3)] = cr138849_place_5);

return cr138849_state;
}catch (e138882){var cr138849_exception = e138882;
(cr138849_state[(0)] = null);

throw cr138849_exception;
}});
var cr138849_block_11 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr138849_block_11(cr138849_state){
try{var cr138849_place_4 = (cr138849_state[(2)]);
var cr138849_place_22 = cr138849_place_4;
var cr138849_place_23 = (function(){throw cr138849_place_22})();
(cr138849_state[(0)] = null);

(cr138849_state[(2)] = null);

(cr138849_state[(3)] = null);

return null;
}catch (e138883){var cr138849_exception = e138883;
(cr138849_state[(0)] = cr138849_block_16);

(cr138849_state[(3)] = true);

(cr138849_state[(2)] = cr138849_exception);

return cr138849_state;
}});
var cr138849_block_12 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr138849_block_12(cr138849_state){
try{var cr138849_place_20 = (cr138849_state[(4)]);
(cr138849_state[(0)] = cr138849_block_15);

(cr138849_state[(4)] = null);

(cr138849_state[(1)] = cr138849_place_20);

return cr138849_state;
}catch (e138884){var cr138849_exception = e138884;
(cr138849_state[(0)] = cr138849_block_16);

(cr138849_state[(1)] = null);

(cr138849_state[(4)] = null);

(cr138849_state[(3)] = true);

(cr138849_state[(2)] = cr138849_exception);

return cr138849_state;
}});
var cr138849_block_9 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr138849_block_9(cr138849_state){
try{var cr138849_place_19 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr138849_place_20 = null;
if(cljs.core.truth_(cr138849_place_19)){
(cr138849_state[(0)] = cr138849_block_11);

(cr138849_state[(1)] = null);

return cr138849_state;
} else {
(cr138849_state[(0)] = cr138849_block_10);

(cr138849_state[(4)] = cr138849_place_20);

return cr138849_state;
}
}catch (e138885){var cr138849_exception = e138885;
(cr138849_state[(0)] = cr138849_block_16);

(cr138849_state[(1)] = null);

(cr138849_state[(3)] = true);

(cr138849_state[(2)] = cr138849_exception);

return cr138849_state;
}});
var cr138849_block_8 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr138849_block_8(cr138849_state){
try{var cr138849_place_4 = (cr138849_state[(2)]);
var cr138849_place_15 = cr138849_place_4;
var cr138849_place_16 = missionary.Cancelled;
var cr138849_place_17 = (cr138849_place_15 instanceof cr138849_place_16);
var cr138849_place_18 = null;
if(cr138849_place_17){
(cr138849_state[(0)] = cr138849_block_13);

(cr138849_state[(1)] = cr138849_place_18);

return cr138849_state;
} else {
(cr138849_state[(0)] = cr138849_block_9);

(cr138849_state[(1)] = cr138849_place_18);

return cr138849_state;
}
}catch (e138886){var cr138849_exception = e138886;
(cr138849_state[(0)] = cr138849_block_16);

(cr138849_state[(3)] = true);

(cr138849_state[(2)] = cr138849_exception);

return cr138849_state;
}});
var cr138849_block_6 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr138849_block_6(cr138849_state){
try{var cr138849_place_14 = missionary.core.unpark();
(cr138849_state[(0)] = cr138849_block_7);

(cr138849_state[(4)] = cr138849_place_14);

return cr138849_state;
}catch (e138887){var cr138849_exception = e138887;
(cr138849_state[(0)] = cr138849_block_8);

(cr138849_state[(4)] = null);

(cr138849_state[(2)] = cr138849_exception);

return cr138849_state;
}});
var cr138849_block_10 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr138849_block_10(cr138849_state){
try{var cr138849_place_21 = null;
(cr138849_state[(0)] = cr138849_block_12);

(cr138849_state[(4)] = cr138849_place_21);

return cr138849_state;
}catch (e138888){var cr138849_exception = e138888;
(cr138849_state[(0)] = cr138849_block_16);

(cr138849_state[(1)] = null);

(cr138849_state[(4)] = null);

(cr138849_state[(3)] = true);

(cr138849_state[(2)] = cr138849_exception);

return cr138849_state;
}});
var cr138849_block_7 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr138849_block_7(cr138849_state){
try{var cr138849_place_7 = (cr138849_state[(4)]);
(cr138849_state[(0)] = cr138849_block_16);

(cr138849_state[(4)] = null);

(cr138849_state[(2)] = cr138849_place_7);

return cr138849_state;
}catch (e138889){var cr138849_exception = e138889;
(cr138849_state[(0)] = cr138849_block_8);

(cr138849_state[(4)] = null);

(cr138849_state[(2)] = cr138849_exception);

return cr138849_state;
}});
var cr138849_block_3 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr138849_block_3(cr138849_state){
try{var cr138849_place_8 = (1);
var cr138849_place_9 = missionary.core.none;
(cr138849_state[(0)] = cr138849_block_4);

return missionary.core.fork(cr138849_place_8,cr138849_place_9);
}catch (e138890){var cr138849_exception = e138890;
(cr138849_state[(0)] = cr138849_block_8);

(cr138849_state[(4)] = null);

(cr138849_state[(2)] = cr138849_exception);

return cr138849_state;
}});
var cr138849_block_4 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr138849_block_4(cr138849_state){
try{var cr138849_place_10 = missionary.core.unpark();
(cr138849_state[(0)] = cr138849_block_7);

(cr138849_state[(4)] = cr138849_place_10);

return cr138849_state;
}catch (e138891){var cr138849_exception = e138891;
(cr138849_state[(0)] = cr138849_block_8);

(cr138849_state[(4)] = null);

(cr138849_state[(2)] = cr138849_exception);

return cr138849_state;
}});
var cr138849_block_13 = (function frontend$worker$rtc$core$create_ws_state_flow_$_cr138849_block_13(cr138849_state){
try{var cr138849_place_4 = (cr138849_state[(2)]);
var cr138849_place_24 = cr138849_place_4;
var cr138849_place_25 = (1);
var cr138849_place_26 = missionary.core.none;
(cr138849_state[(0)] = cr138849_block_14);

return missionary.core.fork(cr138849_place_25,cr138849_place_26);
}catch (e138892){var cr138849_exception = e138892;
(cr138849_state[(0)] = cr138849_block_16);

(cr138849_state[(1)] = null);

(cr138849_state[(3)] = true);

(cr138849_state[(2)] = cr138849_exception);

return cr138849_state;
}});
return cloroutine.impl.coroutine((function (){var G__138893 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__138893[(0)] = cr138849_block_0);

return G__138893;
})());
})(),missionary.core.ap_run));
});
frontend.worker.rtc.core.create_rtc_state_flow = (function frontend$worker$rtc$core$create_rtc_state_flow(ws_state_flow){
return missionary.core.latest.cljs$core$IFn$_invoke$arity$variadic((function (ws_state){
var _PERCENT_ = (function (){var G__138894 = cljs.core.PersistentArrayMap.EMPTY;
if(cljs.core.truth_(ws_state)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__138894,new cljs.core.Keyword(null,"ws-state","ws-state",2128833478),ws_state);
} else {
return G__138894;
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
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.rtc.core",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"add-migration-client-ops","add-migration-client-ops",-2078939828),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"server-schema-version","server-schema-version",765611123),server_schema_version,new cljs.core.Keyword(null,"client-schema-version","client-schema-version",-315922744),client_schema_version], null),new cljs.core.Keyword(null,"line","line",212345235),172], null)),null);
} else {
return null;
}
} else {
return null;
}
});
frontend.worker.rtc.core.update_remote_schema_version_BANG_ = (function frontend$worker$rtc$core$update_remote_schema_version_BANG_(conn,server_schema_version){
if(cljs.core.truth_(server_schema_version)){
var G__138895 = conn;
var G__138896 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(logseq.db.kv.cljs$core$IFn$_invoke$arity$2 ? logseq.db.kv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.kv","remote-schema-version","logseq.kv/remote-schema-version",988970829),server_schema_version) : logseq.db.kv.call(null,new cljs.core.Keyword("logseq.kv","remote-schema-version","logseq.kv/remote-schema-version",988970829),server_schema_version))], null);
var G__138897 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__138895,G__138896,G__138897) : datascript.core.transact_BANG_.call(null,G__138895,G__138896,G__138897));
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
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr138898_block_0 = (function frontend$worker$rtc$core$holding_rtc_lock_$_cr138898_block_0(cr138898_state){
try{var cr138898_place_0 = cljs.core.compare_and_set_BANG_;
var cr138898_place_1 = frontend.worker.rtc.core._STAR_rtc_lock;
var cr138898_place_2 = null;
var cr138898_place_3 = true;
var cr138898_place_4 = (function (){var G__138921 = cr138898_place_1;
var G__138922 = cr138898_place_2;
var G__138923 = cr138898_place_3;
var fexpr__138920 = cr138898_place_0;
return (fexpr__138920.cljs$core$IFn$_invoke$arity$3 ? fexpr__138920.cljs$core$IFn$_invoke$arity$3(G__138921,G__138922,G__138923) : fexpr__138920.call(null,G__138921,G__138922,G__138923));
})();
var cr138898_place_5 = null;
if(cljs.core.truth_(cr138898_place_4)){
(cr138898_state[(0)] = cr138898_block_2);

(cr138898_state[(1)] = cr138898_place_5);

return cr138898_state;
} else {
(cr138898_state[(0)] = cr138898_block_1);

return cr138898_state;
}
}catch (e138919){var cr138898_exception = e138919;
(cr138898_state[(0)] = null);

throw cr138898_exception;
}});
var cr138898_block_1 = (function frontend$worker$rtc$core$holding_rtc_lock_$_cr138898_block_1(cr138898_state){
try{var cr138898_place_6 = cljs.core.ex_info;
var cr138898_place_7 = "Must not run multiple rtc-loops, try later";
var cr138898_place_8 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr138898_place_9 = new cljs.core.Keyword("rtc.exception","lock-failed","rtc.exception/lock-failed",-52850201);
var cr138898_place_10 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr138898_place_11 = true;
var cr138898_place_12 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr138898_place_10,cr138898_place_11,cr138898_place_8,cr138898_place_9]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr138898_place_13 = (function (){var G__138926 = cr138898_place_7;
var G__138927 = cr138898_place_12;
var fexpr__138925 = cr138898_place_6;
return (fexpr__138925.cljs$core$IFn$_invoke$arity$2 ? fexpr__138925.cljs$core$IFn$_invoke$arity$2(G__138926,G__138927) : fexpr__138925.call(null,G__138926,G__138927));
})();
var cr138898_place_14 = started_dfv;
var cr138898_place_15 = cr138898_place_13;
var cr138898_place_16 = (function (){var G__138929 = cr138898_place_15;
var fexpr__138928 = cr138898_place_14;
return (fexpr__138928.cljs$core$IFn$_invoke$arity$1 ? fexpr__138928.cljs$core$IFn$_invoke$arity$1(G__138929) : fexpr__138928.call(null,G__138929));
})();
var cr138898_place_17 = cr138898_place_13;
var cr138898_place_18 = (function(){throw cr138898_place_17})();
(cr138898_state[(0)] = null);

return null;
}catch (e138924){var cr138898_exception = e138924;
(cr138898_state[(0)] = null);

throw cr138898_exception;
}});
var cr138898_block_2 = (function frontend$worker$rtc$core$holding_rtc_lock_$_cr138898_block_2(cr138898_state){
try{var cr138898_place_19 = null;
(cr138898_state[(0)] = cr138898_block_3);

(cr138898_state[(1)] = cr138898_place_19);

return cr138898_state;
}catch (e138930){var cr138898_exception = e138930;
(cr138898_state[(0)] = null);

(cr138898_state[(1)] = null);

throw cr138898_exception;
}});
var cr138898_block_3 = (function frontend$worker$rtc$core$holding_rtc_lock_$_cr138898_block_3(cr138898_state){
try{var cr138898_place_5 = (cr138898_state[(1)]);
var cr138898_place_20 = null;
var cr138898_place_21 = false;
(cr138898_state[(0)] = cr138898_block_4);

(cr138898_state[(1)] = null);

(cr138898_state[(1)] = cr138898_place_20);

(cr138898_state[(2)] = cr138898_place_21);

return cr138898_state;
}catch (e138931){var cr138898_exception = e138931;
(cr138898_state[(0)] = null);

(cr138898_state[(1)] = null);

throw cr138898_exception;
}});
var cr138898_block_4 = (function frontend$worker$rtc$core$holding_rtc_lock_$_cr138898_block_4(cr138898_state){
try{var cr138898_place_22 = task;
(cr138898_state[(0)] = cr138898_block_5);

return missionary.core.park(cr138898_place_22);
}catch (e138932){var cr138898_exception = e138932;
(cr138898_state[(0)] = cr138898_block_6);

(cr138898_state[(1)] = cr138898_exception);

return cr138898_state;
}});
var cr138898_block_5 = (function frontend$worker$rtc$core$holding_rtc_lock_$_cr138898_block_5(cr138898_state){
try{var cr138898_place_23 = missionary.core.unpark();
(cr138898_state[(0)] = cr138898_block_7);

(cr138898_state[(1)] = cr138898_place_23);

return cr138898_state;
}catch (e138933){var cr138898_exception = e138933;
(cr138898_state[(0)] = cr138898_block_6);

(cr138898_state[(1)] = cr138898_exception);

return cr138898_state;
}});
var cr138898_block_6 = (function frontend$worker$rtc$core$holding_rtc_lock_$_cr138898_block_6(cr138898_state){
try{var cr138898_place_20 = (cr138898_state[(1)]);
var cr138898_place_24 = cr138898_place_20;
var cr138898_place_25 = (function(){throw cr138898_place_24})();
(cr138898_state[(0)] = null);

(cr138898_state[(1)] = null);

(cr138898_state[(2)] = null);

return null;
}catch (e138934){var cr138898_exception = e138934;
(cr138898_state[(0)] = cr138898_block_7);

(cr138898_state[(2)] = true);

(cr138898_state[(1)] = cr138898_exception);

return cr138898_state;
}});
var cr138898_block_7 = (function frontend$worker$rtc$core$holding_rtc_lock_$_cr138898_block_7(cr138898_state){
try{var cr138898_place_20 = (cr138898_state[(1)]);
var cr138898_place_21 = (cr138898_state[(2)]);
var cr138898_place_26 = cljs.core.reset_BANG_;
var cr138898_place_27 = frontend.worker.rtc.core._STAR_rtc_lock;
var cr138898_place_28 = null;
var cr138898_place_29 = (function (){var G__138937 = cr138898_place_27;
var G__138938 = cr138898_place_28;
var fexpr__138936 = cr138898_place_26;
return (fexpr__138936.cljs$core$IFn$_invoke$arity$2 ? fexpr__138936.cljs$core$IFn$_invoke$arity$2(G__138937,G__138938) : fexpr__138936.call(null,G__138937,G__138938));
})();
var cr138898_place_30 = (cljs.core.truth_(cr138898_place_21)?(function(){throw cr138898_place_20})():cr138898_place_20);
(cr138898_state[(0)] = null);

(cr138898_state[(1)] = null);

(cr138898_state[(2)] = null);

return cr138898_place_30;
}catch (e138935){var cr138898_exception = e138935;
(cr138898_state[(0)] = null);

(cr138898_state[(1)] = null);

(cr138898_state[(2)] = null);

throw cr138898_exception;
}});
return cloroutine.impl.coroutine((function (){var G__138939 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__138939[(0)] = cr138898_block_0);

return G__138939;
})());
})(),missionary.core.sp_run);
});
/**
 * Return a map with [:rtc-state-flow :rtc-loop-task :*rtc-auto-push? :onstarted-task]
 *   TODO: auto refresh token if needed
 */
frontend.worker.rtc.core.create_rtc_loop = (function frontend$worker$rtc$core$create_rtc_loop(var_args){
var args__5732__auto__ = [];
var len__5726__auto___140125 = arguments.length;
var i__5727__auto___140126 = (0);
while(true){
if((i__5727__auto___140126 < len__5726__auto___140125)){
args__5732__auto__.push((arguments[i__5727__auto___140126]));

var G__140127 = (i__5727__auto___140126 + (1));
i__5727__auto___140126 = G__140127;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((6) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((6)),(0),null)):null);
return frontend.worker.rtc.core.create_rtc_loop.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),(arguments[(5)]),argseq__5733__auto__);
});

(frontend.worker.rtc.core.create_rtc_loop.cljs$core$IFn$_invoke$arity$variadic = (function (graph_uuid,schema_version,repo,conn,date_formatter,token,p__138947){
var map__138948 = p__138947;
var map__138948__$1 = cljs.core.__destructure_map(map__138948);
var auto_push_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__138948__$1,new cljs.core.Keyword(null,"auto-push?","auto-push?",674534960),true);
var debug_ws_url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138948__$1,new cljs.core.Keyword(null,"debug-ws-url","debug-ws-url",-1011645872));
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
var map__138949 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized(ws_url);
var map__138949__$1 = cljs.core.__destructure_map(map__138949);
var _STAR_current_ws = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138949__$1,new cljs.core.Keyword(null,"*current-ws","*current-ws",2093663036));
var get_ws_create_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138949__$1,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002));
var get_ws_create_task__$1 = frontend.worker.rtc.client.ensure_register_graph_updates(get_ws_create_task,graph_uuid,major_schema_version,repo,conn,_STAR_last_calibrate_t,_STAR_online_users,_STAR_server_schema_version,add_log_fn);
var map__138950 = frontend.worker.rtc.asset.create_assets_sync_loop(repo,get_ws_create_task__$1,graph_uuid,major_schema_version,conn,_STAR_auto_push_QMARK_);
var map__138950__$1 = cljs.core.__destructure_map(map__138950);
var assets_sync_loop_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138950__$1,new cljs.core.Keyword(null,"assets-sync-loop-task","assets-sync-loop-task",1231956523));
var mixed_flow = frontend.worker.rtc.core.create_mixed_flow(repo,get_ws_create_task__$1,_STAR_auto_push_QMARK_,_STAR_online_users);
if((!((_STAR_current_ws == null)))){
} else {
throw (new Error("Assert failed: (some? *current-ws)"));
}

return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"rtc-state-flow","rtc-state-flow",553472428),frontend.worker.rtc.core.create_rtc_state_flow(frontend.worker.rtc.core.create_ws_state_flow(_STAR_current_ws)),new cljs.core.Keyword(null,"*rtc-auto-push?","*rtc-auto-push?",-44092416),_STAR_auto_push_QMARK_,new cljs.core.Keyword(null,"*rtc-remote-profile?","*rtc-remote-profile?",751419973),_STAR_remote_profile_QMARK_,new cljs.core.Keyword(null,"*online-users","*online-users",-1145442647),_STAR_online_users,new cljs.core.Keyword(null,"onstarted-task","onstarted-task",750035798),started_dfv,new cljs.core.Keyword(null,"rtc-loop-task","rtc-loop-task",1590035731),frontend.worker.rtc.core.holding_rtc_lock(started_dfv,cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr138951_block_14 = (function frontend$worker$rtc$core$cr138951_block_14(cr138951_state){
try{var cr138951_place_1 = (cr138951_state[(1)]);
var cr138951_place_93 = (cr138951_state[(3)]);
var cr138951_place_0 = (cr138951_state[(2)]);
var cr138951_place_100 = (cljs.core.truth_(cr138951_place_1)?(function(){throw cr138951_place_0})():cr138951_place_0);
(cr138951_state[(0)] = null);

(cr138951_state[(1)] = null);

(cr138951_state[(3)] = null);

(cr138951_state[(2)] = null);

return cr138951_place_100;
}catch (e139312){var cr138951_exception = e139312;
(cr138951_state[(0)] = null);

(cr138951_state[(1)] = null);

(cr138951_state[(3)] = null);

(cr138951_state[(2)] = null);

throw cr138951_exception;
}});
var cr138951_block_12 = (function frontend$worker$rtc$core$cr138951_block_12(cr138951_state){
try{var cr138951_place_94 = null;
(cr138951_state[(0)] = cr138951_block_14);

(cr138951_state[(3)] = cr138951_place_94);

return cr138951_state;
}catch (e139313){var cr138951_exception = e139313;
(cr138951_state[(0)] = null);

(cr138951_state[(1)] = null);

(cr138951_state[(3)] = null);

(cr138951_state[(2)] = null);

throw cr138951_exception;
}});
var cr138951_block_8 = (function frontend$worker$rtc$core$cr138951_block_8(cr138951_state){
try{var cr138951_place_76 = (cr138951_state[(4)]);
(cr138951_state[(0)] = cr138951_block_10);

(cr138951_state[(4)] = null);

(cr138951_state[(3)] = cr138951_place_76);

return cr138951_state;
}catch (e139314){var cr138951_exception = e139314;
(cr138951_state[(0)] = cr138951_block_11);

(cr138951_state[(4)] = null);

(cr138951_state[(3)] = null);

(cr138951_state[(1)] = true);

(cr138951_state[(2)] = cr138951_exception);

return cr138951_state;
}});
var cr138951_block_5 = (function frontend$worker$rtc$core$cr138951_block_5(cr138951_state){
try{var cr138951_place_75 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr138951_place_76 = null;
if(cljs.core.truth_(cr138951_place_75)){
(cr138951_state[(0)] = cr138951_block_7);

(cr138951_state[(3)] = null);

return cr138951_state;
} else {
(cr138951_state[(0)] = cr138951_block_6);

(cr138951_state[(4)] = cr138951_place_76);

return cr138951_state;
}
}catch (e139315){var cr138951_exception = e139315;
(cr138951_state[(0)] = cr138951_block_11);

(cr138951_state[(3)] = null);

(cr138951_state[(1)] = true);

(cr138951_state[(2)] = cr138951_exception);

return cr138951_state;
}});
var cr138951_block_13 = (function frontend$worker$rtc$core$cr138951_block_13(cr138951_state){
try{var cr138951_place_95 = cljs.core.deref;
var cr138951_place_96 = _STAR_assets_sync_loop_canceler;
var cr138951_place_97 = (function (){var G__139318 = cr138951_place_96;
var fexpr__139317 = cr138951_place_95;
return (fexpr__139317.cljs$core$IFn$_invoke$arity$1 ? fexpr__139317.cljs$core$IFn$_invoke$arity$1(G__139318) : fexpr__139317.call(null,G__139318));
})();
var cr138951_place_98 = cr138951_place_97;
var cr138951_place_99 = (function (){var fexpr__139319 = cr138951_place_98;
return (fexpr__139319.cljs$core$IFn$_invoke$arity$0 ? fexpr__139319.cljs$core$IFn$_invoke$arity$0() : fexpr__139319.call(null));
})();
(cr138951_state[(0)] = cr138951_block_14);

(cr138951_state[(3)] = cr138951_place_99);

return cr138951_state;
}catch (e139316){var cr138951_exception = e139316;
(cr138951_state[(0)] = null);

(cr138951_state[(1)] = null);

(cr138951_state[(3)] = null);

(cr138951_state[(2)] = null);

throw cr138951_exception;
}});
var cr138951_block_9 = (function frontend$worker$rtc$core$cr138951_block_9(cr138951_state){
try{var cr138951_place_0 = (cr138951_state[(2)]);
var cr138951_place_80 = cr138951_place_0;
var cr138951_place_81 = add_log_fn;
var cr138951_place_82 = new cljs.core.Keyword("rtc.log","cancelled","rtc.log/cancelled",-1356944103);
var cr138951_place_83 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr138951_place_84 = cr138951_place_81(cr138951_place_82,cr138951_place_83);
var cr138951_place_85 = cr138951_place_80;
var cr138951_place_86 = (function(){throw cr138951_place_85})();
(cr138951_state[(0)] = null);

(cr138951_state[(1)] = null);

(cr138951_state[(2)] = null);

return null;
}catch (e139320){var cr138951_exception = e139320;
(cr138951_state[(0)] = cr138951_block_11);

(cr138951_state[(1)] = true);

(cr138951_state[(2)] = cr138951_exception);

return cr138951_state;
}});
var cr138951_block_2 = (function frontend$worker$rtc$core$cr138951_block_2(cr138951_state){
try{var cr138951_place_3 = missionary.core.unpark();
var cr138951_place_4 = started_dfv;
var cr138951_place_5 = true;
var cr138951_place_6 = (function (){var G__139323 = cr138951_place_5;
var fexpr__139322 = cr138951_place_4;
return (fexpr__139322.cljs$core$IFn$_invoke$arity$1 ? fexpr__139322.cljs$core$IFn$_invoke$arity$1(G__139323) : fexpr__139322.call(null,G__139323));
})();
var cr138951_place_7 = frontend.worker.rtc.core.update_remote_schema_version_BANG_;
var cr138951_place_8 = conn;
var cr138951_place_9 = cljs.core.deref;
var cr138951_place_10 = _STAR_server_schema_version;
var cr138951_place_11 = (function (){var G__139325 = cr138951_place_10;
var fexpr__139324 = cr138951_place_9;
return (fexpr__139324.cljs$core$IFn$_invoke$arity$1 ? fexpr__139324.cljs$core$IFn$_invoke$arity$1(G__139325) : fexpr__139324.call(null,G__139325));
})();
var cr138951_place_12 = (function (){var G__139327 = cr138951_place_8;
var G__139328 = cr138951_place_11;
var fexpr__139326 = cr138951_place_7;
return (fexpr__139326.cljs$core$IFn$_invoke$arity$2 ? fexpr__139326.cljs$core$IFn$_invoke$arity$2(G__139327,G__139328) : fexpr__139326.call(null,G__139327,G__139328));
})();
var cr138951_place_13 = frontend.worker.rtc.core.add_migration_client_ops_BANG_;
var cr138951_place_14 = repo;
var cr138951_place_15 = cljs.core.deref;
var cr138951_place_16 = conn;
var cr138951_place_17 = (function (){var G__139330 = cr138951_place_16;
var fexpr__139329 = cr138951_place_15;
return (fexpr__139329.cljs$core$IFn$_invoke$arity$1 ? fexpr__139329.cljs$core$IFn$_invoke$arity$1(G__139330) : fexpr__139329.call(null,G__139330));
})();
var cr138951_place_18 = cljs.core.deref;
var cr138951_place_19 = _STAR_server_schema_version;
var cr138951_place_20 = (function (){var G__139332 = cr138951_place_19;
var fexpr__139331 = cr138951_place_18;
return (fexpr__139331.cljs$core$IFn$_invoke$arity$1 ? fexpr__139331.cljs$core$IFn$_invoke$arity$1(G__139332) : fexpr__139331.call(null,G__139332));
})();
var cr138951_place_21 = (function (){var G__139334 = cr138951_place_14;
var G__139335 = cr138951_place_17;
var G__139336 = cr138951_place_20;
var fexpr__139333 = cr138951_place_13;
return (fexpr__139333.cljs$core$IFn$_invoke$arity$3 ? fexpr__139333.cljs$core$IFn$_invoke$arity$3(G__139334,G__139335,G__139336) : fexpr__139333.call(null,G__139334,G__139335,G__139336));
})();
var cr138951_place_22 = cljs.core.reset_BANG_;
var cr138951_place_23 = _STAR_assets_sync_loop_canceler;
var cr138951_place_24 = frontend.common.missionary.run_task;
var cr138951_place_25 = new cljs.core.Keyword(null,"assets-sync-loop-task","assets-sync-loop-task",1231956523);
var cr138951_place_26 = assets_sync_loop_task;
var cr138951_place_27 = (function (){var G__139338 = cr138951_place_25;
var G__139339 = cr138951_place_26;
var fexpr__139337 = cr138951_place_24;
return (fexpr__139337.cljs$core$IFn$_invoke$arity$2 ? fexpr__139337.cljs$core$IFn$_invoke$arity$2(G__139338,G__139339) : fexpr__139337.call(null,G__139338,G__139339));
})();
var cr138951_place_28 = (function (){var G__139341 = cr138951_place_23;
var G__139342 = cr138951_place_27;
var fexpr__139340 = cr138951_place_22;
return (fexpr__139340.cljs$core$IFn$_invoke$arity$2 ? fexpr__139340.cljs$core$IFn$_invoke$arity$2(G__139341,G__139342) : fexpr__139340.call(null,G__139341,G__139342));
})();
var cr138951_place_29 = missionary.core.reduce;
var cr138951_place_30 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr138951_place_31 = null;
var cr138951_place_32 = cljs.core.partial;
var cr138951_place_36 = (function (cr138954_state){
try{var cr138954_place_9 = (cr138954_state[(2)]);
var cr138954_place_13 = cr138954_place_9;
var cr138954_place_14 = null;
var G__139036 = cr138954_place_13;
var G__139419 = G__139036;
switch (G__139419) {
case "remote-update":
(cr138954_state[(0)] = cr138951_place_42);

(cr138954_state[(2)] = null);

(cr138954_state[(2)] = cr138954_place_14);

return cr138954_state;

break;
case "remote-asset-update":
(cr138954_state[(0)] = cr138951_place_38);

(cr138954_state[(2)] = null);

(cr138954_state[(2)] = cr138954_place_14);

return cr138954_state;

break;
case "local-update-check":
(cr138954_state[(0)] = cr138951_place_44);

(cr138954_state[(1)] = null);

(cr138954_state[(2)] = null);

(cr138954_state[(2)] = cr138954_place_14);

return cr138954_state;

break;
case "online-users-updated":
(cr138954_state[(0)] = cr138951_place_53);

(cr138954_state[(2)] = null);

(cr138954_state[(2)] = cr138954_place_14);

return cr138954_state;

break;
case "pull-remote-updates":
(cr138954_state[(0)] = cr138951_place_45);

(cr138954_state[(1)] = null);

(cr138954_state[(2)] = null);

(cr138954_state[(2)] = cr138954_place_14);

return cr138954_state;

break;
case "inject-users-info":
(cr138954_state[(0)] = cr138951_place_39);

(cr138954_state[(1)] = null);

(cr138954_state[(2)] = null);

(cr138954_state[(2)] = cr138954_place_14);

return cr138954_state;

break;
default:
(cr138954_state[(0)] = cr138951_place_48);

(cr138954_state[(1)] = null);

return cr138954_state;

}
}catch (e139418){var e139035 = e139418;
var cr138954_exception = e139035;
(cr138954_state[(0)] = null);

(cr138954_state[(1)] = null);

(cr138954_state[(2)] = null);

throw cr138954_exception;
}});
var cr138951_place_39 = (function (cr138954_state){
try{var cr138954_place_86 = frontend.worker.rtc.core.new_task__inject_users_info;
var cr138954_place_87 = token;
var cr138954_place_88 = graph_uuid;
var cr138954_place_89 = major_schema_version;
var cr138954_place_90 = (function (){var G__139047 = cr138954_place_87;
var G__139048 = cr138954_place_88;
var G__139049 = cr138954_place_89;
var fexpr__139046 = cr138954_place_86;
var G__139422 = G__139047;
var G__139423 = G__139048;
var G__139424 = G__139049;
var fexpr__139421 = fexpr__139046;
return (fexpr__139421.cljs$core$IFn$_invoke$arity$3 ? fexpr__139421.cljs$core$IFn$_invoke$arity$3(G__139422,G__139423,G__139424) : fexpr__139421.call(null,G__139422,G__139423,G__139424));
})();
(cr138954_state[(0)] = cr138951_place_40);

return missionary.core.park(cr138954_place_90);
}catch (e139420){var e139045 = e139420;
var cr138954_exception = e139045;
(cr138954_state[(0)] = null);

(cr138954_state[(2)] = null);

throw cr138954_exception;
}});
var cr138951_place_46 = (function (cr138954_state){
try{var cr138954_place_35 = null;
(cr138954_state[(0)] = cr138951_place_54);

(cr138954_state[(1)] = cr138954_place_35);

return cr138954_state;
}catch (e139425){var e139073 = e139425;
var cr138954_exception = e139073;
(cr138954_state[(0)] = cr138951_place_41);

(cr138954_state[(1)] = null);

(cr138954_state[(3)] = true);

(cr138954_state[(4)] = cr138954_exception);

return cr138954_state;
}});
var cr138951_place_42 = (function (cr138954_state){
try{var cr138954_place_15 = null;
var cr138954_place_16 = false;
(cr138954_state[(0)] = cr138951_place_47);

(cr138954_state[(4)] = cr138954_place_15);

(cr138954_state[(3)] = cr138954_place_16);

return cr138954_state;
}catch (e139426){var e139052 = e139426;
var cr138954_exception = e139052;
(cr138954_state[(0)] = null);

(cr138954_state[(1)] = null);

(cr138954_state[(2)] = null);

throw cr138954_exception;
}});
var cr138951_place_37 = (function (cr138954_state){
try{var cr138954_place_5 = (cr138954_state[(3)]);
var cr138954_place_11 = cr138954_place_5;
var cr138954_place_12 = cr138954_place_11.fqn;
(cr138954_state[(0)] = cr138951_place_36);

(cr138954_state[(3)] = null);

(cr138954_state[(2)] = cr138954_place_12);

return cr138954_state;
}catch (e139427){var e139037 = e139427;
var cr138954_exception = e139037;
(cr138954_state[(0)] = null);

(cr138954_state[(1)] = null);

(cr138954_state[(2)] = null);

(cr138954_state[(3)] = null);

throw cr138954_exception;
}});
var cr138951_place_43 = (function (cr138954_state){
try{var cr138954_place_67 = missionary.core.unpark();
(cr138954_state[(0)] = cr138951_place_33);

(cr138954_state[(2)] = cr138954_place_67);

return cr138954_state;
}catch (e139428){var e139053 = e139428;
var cr138954_exception = e139053;
(cr138954_state[(0)] = null);

(cr138954_state[(2)] = null);

throw cr138954_exception;
}});
var cr138951_place_38 = (function (cr138954_state){
try{var cr138954_place_2 = (cr138954_state[(1)]);
var cr138954_place_47 = frontend.worker.rtc.asset.new_task__emit_remote_asset_updates_from_push_asset_upload_updates;
var cr138954_place_48 = repo;
var cr138954_place_49 = cljs.core.deref;
var cr138954_place_50 = conn;
var cr138954_place_51 = (function (){var G__139040 = cr138954_place_50;
var fexpr__139039 = cr138954_place_49;
var G__139431 = G__139040;
var fexpr__139430 = fexpr__139039;
return (fexpr__139430.cljs$core$IFn$_invoke$arity$1 ? fexpr__139430.cljs$core$IFn$_invoke$arity$1(G__139431) : fexpr__139430.call(null,G__139431));
})();
var cr138954_place_52 = new cljs.core.Keyword(null,"value","value",305978217);
var cr138954_place_53 = cr138954_place_2;
var cr138954_place_54 = cr138954_place_52.cljs$core$IFn$_invoke$arity$1(cr138954_place_53);
var cr138954_place_55 = (function (){var G__139042 = cr138954_place_48;
var G__139043 = cr138954_place_51;
var G__139044 = cr138954_place_54;
var fexpr__139041 = cr138954_place_47;
var G__139433 = G__139042;
var G__139434 = G__139043;
var G__139435 = G__139044;
var fexpr__139432 = fexpr__139041;
return (fexpr__139432.cljs$core$IFn$_invoke$arity$3 ? fexpr__139432.cljs$core$IFn$_invoke$arity$3(G__139433,G__139434,G__139435) : fexpr__139432.call(null,G__139433,G__139434,G__139435));
})();
(cr138954_state[(0)] = cr138951_place_56);

(cr138954_state[(1)] = null);

return missionary.core.park(cr138954_place_55);
}catch (e139429){var e139038 = e139429;
var cr138954_exception = e139038;
(cr138954_state[(0)] = null);

(cr138954_state[(1)] = null);

(cr138954_state[(2)] = null);

throw cr138954_exception;
}});
var cr138951_place_56 = (function (cr138954_state){
try{var cr138954_place_56 = missionary.core.unpark();
(cr138954_state[(0)] = cr138951_place_33);

(cr138954_state[(2)] = cr138954_place_56);

return cr138954_state;
}catch (e139436){var e139106 = e139436;
var cr138954_exception = e139106;
(cr138954_state[(0)] = null);

(cr138954_state[(2)] = null);

throw cr138954_exception;
}});
var cr138951_place_34 = (function (cr138954_state){
try{var cr138954_place_2 = missionary.core.unpark();
var cr138954_place_3 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr138954_place_4 = cr138954_place_2;
var cr138954_place_5 = cr138954_place_3.cljs$core$IFn$_invoke$arity$1(cr138954_place_4);
var cr138954_place_6 = cr138954_place_5;
var cr138954_place_7 = cljs.core.Keyword;
var cr138954_place_8 = (cr138954_place_6 instanceof cr138954_place_7);
var cr138954_place_9 = null;
if(cr138954_place_8){
(cr138954_state[(0)] = cr138951_place_37);

(cr138954_state[(1)] = cr138954_place_2);

(cr138954_state[(3)] = cr138954_place_5);

(cr138954_state[(2)] = cr138954_place_9);

return cr138954_state;
} else {
(cr138954_state[(0)] = cr138951_place_50);

(cr138954_state[(1)] = cr138954_place_2);

(cr138954_state[(2)] = cr138954_place_9);

return cr138954_state;
}
}catch (e139437){var e139033 = e139437;
var cr138954_exception = e139033;
(cr138954_state[(0)] = null);

throw cr138954_exception;
}});
var cr138951_place_55 = (function (cr138954_state){
try{var cr138954_place_45 = missionary.core.unpark();
(cr138954_state[(0)] = cr138951_place_54);

(cr138954_state[(1)] = cr138954_place_45);

return cr138954_state;
}catch (e139438){var e139105 = e139438;
var cr138954_exception = e139105;
(cr138954_state[(0)] = cr138951_place_41);

(cr138954_state[(1)] = null);

(cr138954_state[(3)] = true);

(cr138954_state[(4)] = cr138954_exception);

return cr138954_state;
}});
var cr138951_place_48 = (function (cr138954_state){
try{var cr138954_place_9 = (cr138954_state[(2)]);
var cr138954_place_92 = "No matching clause: ";
var cr138954_place_93 = cr138954_place_9;
var cr138954_place_94 = [cr138954_place_92,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr138954_place_93)].join('');
var cr138954_place_95 = (new Error(cr138954_place_94));
var cr138954_place_96 = (function(){throw cr138954_place_95})();
(cr138954_state[(0)] = null);

(cr138954_state[(2)] = null);

return null;
}catch (e139439){var e139082 = e139439;
var cr138954_exception = e139082;
(cr138954_state[(0)] = null);

(cr138954_state[(2)] = null);

throw cr138954_exception;
}});
var cr138951_place_44 = (function (cr138954_state){
try{var cr138954_place_57 = frontend.worker.rtc.client.new_task__push_local_ops;
var cr138954_place_58 = repo;
var cr138954_place_59 = conn;
var cr138954_place_60 = graph_uuid;
var cr138954_place_61 = major_schema_version;
var cr138954_place_62 = date_formatter;
var cr138954_place_63 = get_ws_create_task__$1;
var cr138954_place_64 = _STAR_remote_profile_QMARK_;
var cr138954_place_65 = add_log_fn;
var cr138954_place_66 = (function (){var G__139056 = cr138954_place_58;
var G__139057 = cr138954_place_59;
var G__139058 = cr138954_place_60;
var G__139059 = cr138954_place_61;
var G__139060 = cr138954_place_62;
var G__139061 = cr138954_place_63;
var G__139062 = cr138954_place_64;
var G__139063 = cr138954_place_65;
var fexpr__139055 = cr138954_place_57;
var G__139442 = G__139056;
var G__139443 = G__139057;
var G__139444 = G__139058;
var G__139445 = G__139059;
var G__139446 = G__139060;
var G__139447 = G__139061;
var G__139448 = G__139062;
var G__139449 = G__139063;
var fexpr__139441 = fexpr__139055;
return (fexpr__139441.cljs$core$IFn$_invoke$arity$8 ? fexpr__139441.cljs$core$IFn$_invoke$arity$8(G__139442,G__139443,G__139444,G__139445,G__139446,G__139447,G__139448,G__139449) : fexpr__139441.call(null,G__139442,G__139443,G__139444,G__139445,G__139446,G__139447,G__139448,G__139449));
})();
(cr138954_state[(0)] = cr138951_place_43);

return missionary.core.park(cr138954_place_66);
}catch (e139440){var e139054 = e139440;
var cr138954_exception = e139054;
(cr138954_state[(0)] = null);

(cr138954_state[(2)] = null);

throw cr138954_exception;
}});
var cr138951_place_45 = (function (cr138954_state){
try{var cr138954_place_76 = frontend.worker.rtc.client.new_task__pull_remote_data;
var cr138954_place_77 = repo;
var cr138954_place_78 = conn;
var cr138954_place_79 = graph_uuid;
var cr138954_place_80 = major_schema_version;
var cr138954_place_81 = date_formatter;
var cr138954_place_82 = get_ws_create_task__$1;
var cr138954_place_83 = add_log_fn;
var cr138954_place_84 = (function (){var G__139066 = cr138954_place_77;
var G__139067 = cr138954_place_78;
var G__139068 = cr138954_place_79;
var G__139069 = cr138954_place_80;
var G__139070 = cr138954_place_81;
var G__139071 = cr138954_place_82;
var G__139072 = cr138954_place_83;
var fexpr__139065 = cr138954_place_76;
var G__139452 = G__139066;
var G__139453 = G__139067;
var G__139454 = G__139068;
var G__139455 = G__139069;
var G__139456 = G__139070;
var G__139457 = G__139071;
var G__139458 = G__139072;
var fexpr__139451 = fexpr__139065;
return (fexpr__139451.cljs$core$IFn$_invoke$arity$7 ? fexpr__139451.cljs$core$IFn$_invoke$arity$7(G__139452,G__139453,G__139454,G__139455,G__139456,G__139457,G__139458) : fexpr__139451.call(null,G__139452,G__139453,G__139454,G__139455,G__139456,G__139457,G__139458));
})();
(cr138954_state[(0)] = cr138951_place_35);

return missionary.core.park(cr138954_place_84);
}catch (e139450){var e139064 = e139450;
var cr138954_exception = e139064;
(cr138954_state[(0)] = null);

(cr138954_state[(2)] = null);

throw cr138954_exception;
}});
var cr138951_place_54 = (function (cr138954_state){
try{var cr138954_place_34 = (cr138954_state[(1)]);
(cr138954_state[(0)] = cr138951_place_41);

(cr138954_state[(1)] = null);

(cr138954_state[(4)] = cr138954_place_34);

return cr138954_state;
}catch (e139459){var e139104 = e139459;
var cr138954_exception = e139104;
(cr138954_state[(0)] = cr138951_place_41);

(cr138954_state[(1)] = null);

(cr138954_state[(3)] = true);

(cr138954_state[(4)] = cr138954_exception);

return cr138954_state;
}});
var cr138951_place_40 = (function (cr138954_state){
try{var cr138954_place_91 = missionary.core.unpark();
(cr138954_state[(0)] = cr138951_place_33);

(cr138954_state[(2)] = cr138954_place_91);

return cr138954_state;
}catch (e139460){var e139050 = e139460;
var cr138954_exception = e139050;
(cr138954_state[(0)] = null);

(cr138954_state[(2)] = null);

throw cr138954_exception;
}});
var cr138951_place_51 = (function (cr138954_state){
try{var cr138954_place_15 = (cr138954_state[(4)]);
var cr138954_place_25 = cr138954_place_15;
var cr138954_place_26 = cljs.core._EQ_;
var cr138954_place_27 = new cljs.core.Keyword("frontend.worker.rtc.remote-update","need-pull-remote-data","frontend.worker.rtc.remote-update/need-pull-remote-data",-1524072067);
var cr138954_place_28 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr138954_place_29 = cljs.core.ex_data;
var cr138954_place_30 = cr138954_place_25;
var cr138954_place_31 = (function (){var G__139095 = cr138954_place_30;
var fexpr__139094 = cr138954_place_29;
var G__139463 = G__139095;
var fexpr__139462 = fexpr__139094;
return (fexpr__139462.cljs$core$IFn$_invoke$arity$1 ? fexpr__139462.cljs$core$IFn$_invoke$arity$1(G__139463) : fexpr__139462.call(null,G__139463));
})();
var cr138954_place_32 = cr138954_place_28.cljs$core$IFn$_invoke$arity$1(cr138954_place_31);
var cr138954_place_33 = (function (){var G__139097 = cr138954_place_27;
var G__139098 = cr138954_place_32;
var fexpr__139096 = cr138954_place_26;
var G__139465 = G__139097;
var G__139466 = G__139098;
var fexpr__139464 = fexpr__139096;
return (fexpr__139464.cljs$core$IFn$_invoke$arity$2 ? fexpr__139464.cljs$core$IFn$_invoke$arity$2(G__139465,G__139466) : fexpr__139464.call(null,G__139465,G__139466));
})();
var cr138954_place_34 = null;
if(cljs.core.truth_(cr138954_place_33)){
(cr138954_state[(0)] = cr138951_place_49);

(cr138954_state[(1)] = cr138954_place_34);

return cr138954_state;
} else {
(cr138954_state[(0)] = cr138951_place_46);

(cr138954_state[(1)] = cr138954_place_34);

return cr138954_state;
}
}catch (e139461){var e139093 = e139461;
var cr138954_exception = e139093;
(cr138954_state[(0)] = cr138951_place_41);

(cr138954_state[(3)] = true);

(cr138954_state[(4)] = cr138954_exception);

return cr138954_state;
}});
var cr138951_place_50 = (function (cr138954_state){
try{var cr138954_place_10 = null;
(cr138954_state[(0)] = cr138951_place_36);

(cr138954_state[(2)] = cr138954_place_10);

return cr138954_state;
}catch (e139467){var e139092 = e139467;
var cr138954_exception = e139092;
(cr138954_state[(0)] = null);

(cr138954_state[(1)] = null);

(cr138954_state[(2)] = null);

throw cr138954_exception;
}});
var cr138951_place_41 = (function (cr138954_state){
try{var cr138954_place_16 = (cr138954_state[(3)]);
var cr138954_place_15 = (cr138954_state[(4)]);
var cr138954_place_46 = (cljs.core.truth_(cr138954_place_16)?(function(){throw cr138954_place_15})():cr138954_place_15);
(cr138954_state[(0)] = cr138951_place_33);

(cr138954_state[(3)] = null);

(cr138954_state[(4)] = null);

(cr138954_state[(2)] = cr138954_place_46);

return cr138954_state;
}catch (e139468){var e139051 = e139468;
var cr138954_exception = e139051;
(cr138954_state[(0)] = null);

(cr138954_state[(3)] = null);

(cr138954_state[(4)] = null);

(cr138954_state[(2)] = null);

throw cr138954_exception;
}});
var cr138951_place_53 = (function (cr138954_state){
try{var cr138954_place_2 = (cr138954_state[(1)]);
var cr138954_place_68 = cljs.core.reset_BANG_;
var cr138954_place_69 = _STAR_online_users;
var cr138954_place_70 = new cljs.core.Keyword(null,"online-users","online-users",-747563810);
var cr138954_place_71 = new cljs.core.Keyword(null,"value","value",305978217);
var cr138954_place_72 = cr138954_place_2;
var cr138954_place_73 = cr138954_place_71.cljs$core$IFn$_invoke$arity$1(cr138954_place_72);
var cr138954_place_74 = cr138954_place_70.cljs$core$IFn$_invoke$arity$1(cr138954_place_73);
var cr138954_place_75 = (function (){var G__139102 = cr138954_place_69;
var G__139103 = cr138954_place_74;
var fexpr__139101 = cr138954_place_68;
var G__139471 = G__139102;
var G__139472 = G__139103;
var fexpr__139470 = fexpr__139101;
return (fexpr__139470.cljs$core$IFn$_invoke$arity$2 ? fexpr__139470.cljs$core$IFn$_invoke$arity$2(G__139471,G__139472) : fexpr__139470.call(null,G__139471,G__139472));
})();
(cr138954_state[(0)] = cr138951_place_33);

(cr138954_state[(1)] = null);

(cr138954_state[(2)] = cr138954_place_75);

return cr138954_state;
}catch (e139469){var e139100 = e139469;
var cr138954_exception = e139100;
(cr138954_state[(0)] = null);

(cr138954_state[(1)] = null);

(cr138954_state[(2)] = null);

throw cr138954_exception;
}});
var cr138951_place_52 = (function (cr138954_state){
try{var cr138954_place_0 = (1);
var cr138954_place_1 = mixed_flow;
(cr138954_state[(0)] = cr138951_place_34);

return missionary.core.fork(cr138954_place_0,cr138954_place_1);
}catch (e139473){var e139099 = e139473;
var cr138954_exception = e139099;
(cr138954_state[(0)] = null);

throw cr138954_exception;
}});
var cr138951_place_49 = (function (cr138954_state){
try{var cr138954_place_36 = frontend.worker.rtc.client.new_task__pull_remote_data;
var cr138954_place_37 = repo;
var cr138954_place_38 = conn;
var cr138954_place_39 = graph_uuid;
var cr138954_place_40 = major_schema_version;
var cr138954_place_41 = date_formatter;
var cr138954_place_42 = get_ws_create_task__$1;
var cr138954_place_43 = add_log_fn;
var cr138954_place_44 = (function (){var G__139085 = cr138954_place_37;
var G__139086 = cr138954_place_38;
var G__139087 = cr138954_place_39;
var G__139088 = cr138954_place_40;
var G__139089 = cr138954_place_41;
var G__139090 = cr138954_place_42;
var G__139091 = cr138954_place_43;
var fexpr__139084 = cr138954_place_36;
var G__139476 = G__139085;
var G__139477 = G__139086;
var G__139478 = G__139087;
var G__139479 = G__139088;
var G__139480 = G__139089;
var G__139481 = G__139090;
var G__139482 = G__139091;
var fexpr__139475 = fexpr__139084;
return (fexpr__139475.cljs$core$IFn$_invoke$arity$7 ? fexpr__139475.cljs$core$IFn$_invoke$arity$7(G__139476,G__139477,G__139478,G__139479,G__139480,G__139481,G__139482) : fexpr__139475.call(null,G__139476,G__139477,G__139478,G__139479,G__139480,G__139481,G__139482));
})();
(cr138954_state[(0)] = cr138951_place_55);

return missionary.core.park(cr138954_place_44);
}catch (e139474){var e139083 = e139474;
var cr138954_exception = e139083;
(cr138954_state[(0)] = cr138951_place_41);

(cr138954_state[(1)] = null);

(cr138954_state[(3)] = true);

(cr138954_state[(4)] = cr138954_exception);

return cr138954_state;
}});
var cr138951_place_35 = (function (cr138954_state){
try{var cr138954_place_85 = missionary.core.unpark();
(cr138954_state[(0)] = cr138951_place_33);

(cr138954_state[(2)] = cr138954_place_85);

return cr138954_state;
}catch (e139483){var e139034 = e139483;
var cr138954_exception = e139034;
(cr138954_state[(0)] = null);

(cr138954_state[(2)] = null);

throw cr138954_exception;
}});
var cr138951_place_33 = (function (cr138954_state){
try{var cr138954_place_14 = (cr138954_state[(2)]);
(cr138954_state[(0)] = null);

(cr138954_state[(2)] = null);

return cr138954_place_14;
}catch (e139484){var e139032 = e139484;
var cr138954_exception = e139032;
(cr138954_state[(0)] = null);

(cr138954_state[(2)] = null);

throw cr138954_exception;
}});
var cr138951_place_47 = (function (cr138954_state){
try{var cr138954_place_2 = (cr138954_state[(1)]);
var cr138954_place_17 = frontend.worker.rtc.remote_update.apply_remote_update;
var cr138954_place_18 = graph_uuid;
var cr138954_place_19 = repo;
var cr138954_place_20 = conn;
var cr138954_place_21 = date_formatter;
var cr138954_place_22 = cr138954_place_2;
var cr138954_place_23 = add_log_fn;
var cr138954_place_24 = (function (){var G__139076 = cr138954_place_18;
var G__139077 = cr138954_place_19;
var G__139078 = cr138954_place_20;
var G__139079 = cr138954_place_21;
var G__139080 = cr138954_place_22;
var G__139081 = cr138954_place_23;
var fexpr__139075 = cr138954_place_17;
var G__139487 = G__139076;
var G__139488 = G__139077;
var G__139489 = G__139078;
var G__139490 = G__139079;
var G__139491 = G__139080;
var G__139492 = G__139081;
var fexpr__139486 = fexpr__139075;
return (fexpr__139486.cljs$core$IFn$_invoke$arity$6 ? fexpr__139486.cljs$core$IFn$_invoke$arity$6(G__139487,G__139488,G__139489,G__139490,G__139491,G__139492) : fexpr__139486.call(null,G__139487,G__139488,G__139489,G__139490,G__139491,G__139492));
})();
(cr138954_state[(0)] = cr138951_place_41);

(cr138954_state[(1)] = null);

(cr138954_state[(4)] = cr138954_place_24);

return cr138954_state;
}catch (e139485){var e139074 = e139485;
var cr138954_exception = e139074;
(cr138954_state[(0)] = cr138951_place_51);

(cr138954_state[(1)] = null);

(cr138954_state[(4)] = cr138954_exception);

return cr138954_state;
}});
var cr138951_place_57 = cloroutine.impl.coroutine;
var cr138951_place_58 = cljs.core.object_array;
var cr138951_place_59 = (5);
var cr138951_place_60 = (function (){var G__139494 = cr138951_place_59;
var fexpr__139493 = cr138951_place_58;
return (fexpr__139493.cljs$core$IFn$_invoke$arity$1 ? fexpr__139493.cljs$core$IFn$_invoke$arity$1(G__139494) : fexpr__139493.call(null,G__139494));
})();
var cr138951_place_61 = cr138951_place_60;
var cr138951_place_62 = (0);
var cr138951_place_63 = cr138951_place_52;
var cr138951_place_64 = (cr138951_place_61[cr138951_place_62] = cr138951_place_63);
var cr138951_place_65 = cr138951_place_60;
var cr138951_place_66 = (function (){var G__139496 = cr138951_place_65;
var fexpr__139495 = cr138951_place_57;
return (fexpr__139495.cljs$core$IFn$_invoke$arity$1 ? fexpr__139495.cljs$core$IFn$_invoke$arity$1(G__139496) : fexpr__139495.call(null,G__139496));
})();
var cr138951_place_67 = missionary.core.ap_run;
var cr138951_place_68 = (function (){var G__139498 = cr138951_place_66;
var G__139499 = cr138951_place_67;
var fexpr__139497 = cr138951_place_32;
return (fexpr__139497.cljs$core$IFn$_invoke$arity$2 ? fexpr__139497.cljs$core$IFn$_invoke$arity$2(G__139498,G__139499) : fexpr__139497.call(null,G__139498,G__139499));
})();
var cr138951_place_69 = (function (){var G__139501 = cr138951_place_30;
var G__139502 = cr138951_place_31;
var G__139503 = cr138951_place_68;
var fexpr__139500 = cr138951_place_29;
return (fexpr__139500.cljs$core$IFn$_invoke$arity$3 ? fexpr__139500.cljs$core$IFn$_invoke$arity$3(G__139501,G__139502,G__139503) : fexpr__139500.call(null,G__139501,G__139502,G__139503));
})();
(cr138951_state[(0)] = cr138951_block_3);

return missionary.core.park(cr138951_place_69);
}catch (e139321){var cr138951_exception = e139321;
(cr138951_state[(0)] = cr138951_block_4);

(cr138951_state[(2)] = cr138951_exception);

return cr138951_state;
}});
var cr138951_block_4 = (function frontend$worker$rtc$core$cr138951_block_4(cr138951_state){
try{var cr138951_place_0 = (cr138951_state[(2)]);
var cr138951_place_71 = cr138951_place_0;
var cr138951_place_72 = missionary.Cancelled;
var cr138951_place_73 = (cr138951_place_71 instanceof cr138951_place_72);
var cr138951_place_74 = null;
if(cr138951_place_73){
(cr138951_state[(0)] = cr138951_block_9);

return cr138951_state;
} else {
(cr138951_state[(0)] = cr138951_block_5);

(cr138951_state[(3)] = cr138951_place_74);

return cr138951_state;
}
}catch (e139504){var cr138951_exception = e139504;
(cr138951_state[(0)] = cr138951_block_11);

(cr138951_state[(1)] = true);

(cr138951_state[(2)] = cr138951_exception);

return cr138951_state;
}});
var cr138951_block_11 = (function frontend$worker$rtc$core$cr138951_block_11(cr138951_state){
try{var cr138951_place_87 = started_dfv;
var cr138951_place_88 = new cljs.core.Keyword(null,"final","final",1157881357);
var cr138951_place_89 = (function (){var G__139507 = cr138951_place_88;
var fexpr__139506 = cr138951_place_87;
return (fexpr__139506.cljs$core$IFn$_invoke$arity$1 ? fexpr__139506.cljs$core$IFn$_invoke$arity$1(G__139507) : fexpr__139506.call(null,G__139507));
})();
var cr138951_place_90 = cljs.core.deref;
var cr138951_place_91 = _STAR_assets_sync_loop_canceler;
var cr138951_place_92 = (function (){var G__139509 = cr138951_place_91;
var fexpr__139508 = cr138951_place_90;
return (fexpr__139508.cljs$core$IFn$_invoke$arity$1 ? fexpr__139508.cljs$core$IFn$_invoke$arity$1(G__139509) : fexpr__139508.call(null,G__139509));
})();
var cr138951_place_93 = null;
if(cljs.core.truth_(cr138951_place_92)){
(cr138951_state[(0)] = cr138951_block_13);

(cr138951_state[(3)] = cr138951_place_93);

return cr138951_state;
} else {
(cr138951_state[(0)] = cr138951_block_12);

(cr138951_state[(3)] = cr138951_place_93);

return cr138951_state;
}
}catch (e139505){var cr138951_exception = e139505;
(cr138951_state[(0)] = null);

(cr138951_state[(1)] = null);

(cr138951_state[(2)] = null);

throw cr138951_exception;
}});
var cr138951_block_6 = (function frontend$worker$rtc$core$cr138951_block_6(cr138951_state){
try{var cr138951_place_77 = null;
(cr138951_state[(0)] = cr138951_block_8);

(cr138951_state[(4)] = cr138951_place_77);

return cr138951_state;
}catch (e139510){var cr138951_exception = e139510;
(cr138951_state[(0)] = cr138951_block_11);

(cr138951_state[(4)] = null);

(cr138951_state[(3)] = null);

(cr138951_state[(1)] = true);

(cr138951_state[(2)] = cr138951_exception);

return cr138951_state;
}});
var cr138951_block_10 = (function frontend$worker$rtc$core$cr138951_block_10(cr138951_state){
try{var cr138951_place_74 = (cr138951_state[(3)]);
(cr138951_state[(0)] = cr138951_block_11);

(cr138951_state[(3)] = null);

(cr138951_state[(2)] = cr138951_place_74);

return cr138951_state;
}catch (e139511){var cr138951_exception = e139511;
(cr138951_state[(0)] = cr138951_block_11);

(cr138951_state[(3)] = null);

(cr138951_state[(1)] = true);

(cr138951_state[(2)] = cr138951_exception);

return cr138951_state;
}});
var cr138951_block_7 = (function frontend$worker$rtc$core$cr138951_block_7(cr138951_state){
try{var cr138951_place_0 = (cr138951_state[(2)]);
var cr138951_place_78 = cr138951_place_0;
var cr138951_place_79 = (function(){throw cr138951_place_78})();
(cr138951_state[(0)] = null);

(cr138951_state[(1)] = null);

(cr138951_state[(2)] = null);

return null;
}catch (e139512){var cr138951_exception = e139512;
(cr138951_state[(0)] = cr138951_block_11);

(cr138951_state[(1)] = true);

(cr138951_state[(2)] = cr138951_exception);

return cr138951_state;
}});
var cr138951_block_0 = (function frontend$worker$rtc$core$cr138951_block_0(cr138951_state){
try{var cr138951_place_0 = null;
var cr138951_place_1 = false;
(cr138951_state[(0)] = cr138951_block_1);

(cr138951_state[(2)] = cr138951_place_0);

(cr138951_state[(1)] = cr138951_place_1);

return cr138951_state;
}catch (e139513){var cr138951_exception = e139513;
(cr138951_state[(0)] = null);

throw cr138951_exception;
}});
var cr138951_block_3 = (function frontend$worker$rtc$core$cr138951_block_3(cr138951_state){
try{var cr138951_place_70 = missionary.core.unpark();
(cr138951_state[(0)] = cr138951_block_11);

(cr138951_state[(2)] = cr138951_place_70);

return cr138951_state;
}catch (e139514){var cr138951_exception = e139514;
(cr138951_state[(0)] = cr138951_block_4);

(cr138951_state[(2)] = cr138951_exception);

return cr138951_state;
}});
var cr138951_block_1 = (function frontend$worker$rtc$core$cr138951_block_1(cr138951_state){
try{var cr138951_place_2 = get_ws_create_task__$1;
(cr138951_state[(0)] = cr138951_block_2);

return missionary.core.park(cr138951_place_2);
}catch (e139515){var cr138951_exception = e139515;
(cr138951_state[(0)] = cr138951_block_4);

(cr138951_state[(2)] = cr138951_exception);

return cr138951_state;
}});
return cloroutine.impl.coroutine((function (){var G__139516 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__139516[(0)] = cr138951_block_0);

return G__139516;
})());
})(),missionary.core.sp_run))], null);
}));

(frontend.worker.rtc.core.create_rtc_loop.cljs$lang$maxFixedArity = (6));

/** @this {Function} */
(frontend.worker.rtc.core.create_rtc_loop.cljs$lang$applyTo = (function (seq138940){
var G__138941 = cljs.core.first(seq138940);
var seq138940__$1 = cljs.core.next(seq138940);
var G__138942 = cljs.core.first(seq138940__$1);
var seq138940__$2 = cljs.core.next(seq138940__$1);
var G__138943 = cljs.core.first(seq138940__$2);
var seq138940__$3 = cljs.core.next(seq138940__$2);
var G__138944 = cljs.core.first(seq138940__$3);
var seq138940__$4 = cljs.core.next(seq138940__$3);
var G__138945 = cljs.core.first(seq138940__$4);
var seq138940__$5 = cljs.core.next(seq138940__$4);
var G__138946 = cljs.core.first(seq138940__$5);
var seq138940__$6 = cljs.core.next(seq138940__$5);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__138941,G__138942,G__138943,G__138944,G__138945,G__138946,seq138940__$6);
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
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr139517_block_8 = (function frontend$worker$rtc$core$new_task__rtc_start_STAR__$_cr139517_block_8(cr139517_state){
try{var cr139517_place_39 = (cr139517_state[(2)]);
(cr139517_state[(0)] = null);

(cr139517_state[(2)] = null);

return cr139517_place_39;
}catch (e139591){var cr139517_exception = e139591;
(cr139517_state[(0)] = null);

(cr139517_state[(2)] = null);

throw cr139517_exception;
}});
var cr139517_block_4 = (function frontend$worker$rtc$core$new_task__rtc_start_STAR__$_cr139517_block_4(cr139517_state){
try{var cr139517_place_62 = (cr139517_state[(1)]);
var cr139517_place_23 = (cr139517_state[(3)]);
var cr139517_place_54 = (cr139517_state[(4)]);
var cr139517_place_77 = (cr139517_state[(8)]);
var cr139517_place_70 = (cr139517_state[(9)]);
var cr139517_place_58 = (cr139517_state[(10)]);
var cr139517_place_19 = (cr139517_state[(5)]);
var cr139517_place_83 = (cr139517_state[(11)]);
var cr139517_place_27 = (cr139517_state[(6)]);
var cr139517_place_31 = (cr139517_state[(7)]);
var cr139517_place_90 = cljs.core.reset_BANG_;
var cr139517_place_91 = frontend.worker.rtc.core._STAR_rtc_loop_metadata;
var cr139517_place_92 = new cljs.core.Keyword(null,"*rtc-auto-push?","*rtc-auto-push?",-44092416);
var cr139517_place_93 = cr139517_place_58;
var cr139517_place_94 = new cljs.core.Keyword(null,"user-uuid","user-uuid",-275954048);
var cr139517_place_95 = cr139517_place_19;
var cr139517_place_96 = new cljs.core.Keyword(null,"canceler","canceler",1232384163);
var cr139517_place_97 = cr139517_place_83;
var cr139517_place_98 = new cljs.core.Keyword(null,"*rtc-remote-profile?","*rtc-remote-profile?",751419973);
var cr139517_place_99 = cr139517_place_62;
var cr139517_place_100 = new cljs.core.Keyword(null,"local-graph-schema-version","local-graph-schema-version",-211621207);
var cr139517_place_101 = cr139517_place_27;
var cr139517_place_102 = new cljs.core.Keyword(null,"*online-users","*online-users",-1145442647);
var cr139517_place_103 = cr139517_place_70;
var cr139517_place_104 = new cljs.core.Keyword(null,"remote-graph-schema-version","remote-graph-schema-version",-1202898069);
var cr139517_place_105 = cr139517_place_31;
var cr139517_place_106 = new cljs.core.Keyword(null,"rtc-state-flow","rtc-state-flow",553472428);
var cr139517_place_107 = cr139517_place_54;
var cr139517_place_108 = new cljs.core.Keyword(null,"*last-stop-exception","*last-stop-exception",1441670509);
var cr139517_place_109 = cr139517_place_77;
var cr139517_place_110 = new cljs.core.Keyword(null,"*rtc-lock","*rtc-lock",-424509809);
var cr139517_place_111 = frontend.worker.rtc.core._STAR_rtc_lock;
var cr139517_place_112 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr139517_place_113 = cr139517_place_23;
var cr139517_place_114 = new cljs.core.Keyword(null,"repo","repo",-1999060679);
var cr139517_place_115 = repo;
var cr139517_place_116 = cljs.core.with_meta(cljs.core.PersistentHashMap.fromArrays([cr139517_place_110,cr139517_place_104,cr139517_place_96,cr139517_place_112,cr139517_place_92,cr139517_place_106,cr139517_place_102,cr139517_place_98,cr139517_place_108,cr139517_place_100,cr139517_place_94,cr139517_place_114],[cr139517_place_111,cr139517_place_105,cr139517_place_97,cr139517_place_113,cr139517_place_93,cr139517_place_107,cr139517_place_103,cr139517_place_99,cr139517_place_109,cr139517_place_101,cr139517_place_95,cr139517_place_115]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr139517_place_117 = (function (){var G__139594 = cr139517_place_91;
var G__139595 = cr139517_place_116;
var fexpr__139593 = cr139517_place_90;
return (fexpr__139593.cljs$core$IFn$_invoke$arity$2 ? fexpr__139593.cljs$core$IFn$_invoke$arity$2(G__139594,G__139595) : fexpr__139593.call(null,G__139594,G__139595));
})();
var cr139517_place_118 = null;
(cr139517_state[(0)] = cr139517_block_6);

(cr139517_state[(1)] = null);

(cr139517_state[(3)] = null);

(cr139517_state[(4)] = null);

(cr139517_state[(8)] = null);

(cr139517_state[(9)] = null);

(cr139517_state[(10)] = null);

(cr139517_state[(5)] = null);

(cr139517_state[(11)] = null);

(cr139517_state[(6)] = null);

(cr139517_state[(7)] = null);

(cr139517_state[(12)] = cr139517_place_118);

return cr139517_state;
}catch (e139592){var cr139517_exception = e139592;
(cr139517_state[(0)] = null);

(cr139517_state[(12)] = null);

(cr139517_state[(1)] = null);

(cr139517_state[(2)] = null);

(cr139517_state[(3)] = null);

(cr139517_state[(4)] = null);

(cr139517_state[(8)] = null);

(cr139517_state[(9)] = null);

(cr139517_state[(10)] = null);

(cr139517_state[(5)] = null);

(cr139517_state[(11)] = null);

(cr139517_state[(6)] = null);

(cr139517_state[(7)] = null);

throw cr139517_exception;
}});
var cr139517_block_1 = (function frontend$worker$rtc$core$new_task__rtc_start_STAR__$_cr139517_block_1(cr139517_state){
try{var cr139517_place_3 = missionary.core.unpark();
var cr139517_place_4 = frontend.worker.rtc.core.validate_rtc_start_conditions;
var cr139517_place_5 = repo;
var cr139517_place_6 = token;
var cr139517_place_7 = (function (){var G__139598 = cr139517_place_5;
var G__139599 = cr139517_place_6;
var fexpr__139597 = cr139517_place_4;
return (fexpr__139597.cljs$core$IFn$_invoke$arity$2 ? fexpr__139597.cljs$core$IFn$_invoke$arity$2(G__139598,G__139599) : fexpr__139597.call(null,G__139598,G__139599));
})();
var cr139517_place_8 = cljs.core.__destructure_map;
var cr139517_place_9 = cr139517_place_7;
var cr139517_place_10 = (function (){var G__139601 = cr139517_place_9;
var fexpr__139600 = cr139517_place_8;
return (fexpr__139600.cljs$core$IFn$_invoke$arity$1 ? fexpr__139600.cljs$core$IFn$_invoke$arity$1(G__139601) : fexpr__139600.call(null,G__139601));
})();
var cr139517_place_11 = cr139517_place_10;
var cr139517_place_12 = cljs.core.get;
var cr139517_place_13 = cr139517_place_10;
var cr139517_place_14 = new cljs.core.Keyword(null,"conn","conn",278309663);
var cr139517_place_15 = (function (){var G__139603 = cr139517_place_13;
var G__139604 = cr139517_place_14;
var fexpr__139602 = cr139517_place_12;
return (fexpr__139602.cljs$core$IFn$_invoke$arity$2 ? fexpr__139602.cljs$core$IFn$_invoke$arity$2(G__139603,G__139604) : fexpr__139602.call(null,G__139603,G__139604));
})();
var cr139517_place_16 = cljs.core.get;
var cr139517_place_17 = cr139517_place_10;
var cr139517_place_18 = new cljs.core.Keyword(null,"user-uuid","user-uuid",-275954048);
var cr139517_place_19 = (function (){var G__139606 = cr139517_place_17;
var G__139607 = cr139517_place_18;
var fexpr__139605 = cr139517_place_16;
return (fexpr__139605.cljs$core$IFn$_invoke$arity$2 ? fexpr__139605.cljs$core$IFn$_invoke$arity$2(G__139606,G__139607) : fexpr__139605.call(null,G__139606,G__139607));
})();
var cr139517_place_20 = cljs.core.get;
var cr139517_place_21 = cr139517_place_10;
var cr139517_place_22 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr139517_place_23 = (function (){var G__139609 = cr139517_place_21;
var G__139610 = cr139517_place_22;
var fexpr__139608 = cr139517_place_20;
return (fexpr__139608.cljs$core$IFn$_invoke$arity$2 ? fexpr__139608.cljs$core$IFn$_invoke$arity$2(G__139609,G__139610) : fexpr__139608.call(null,G__139609,G__139610));
})();
var cr139517_place_24 = cljs.core.get;
var cr139517_place_25 = cr139517_place_10;
var cr139517_place_26 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr139517_place_27 = (function (){var G__139612 = cr139517_place_25;
var G__139613 = cr139517_place_26;
var fexpr__139611 = cr139517_place_24;
return (fexpr__139611.cljs$core$IFn$_invoke$arity$2 ? fexpr__139611.cljs$core$IFn$_invoke$arity$2(G__139612,G__139613) : fexpr__139611.call(null,G__139612,G__139613));
})();
var cr139517_place_28 = cljs.core.get;
var cr139517_place_29 = cr139517_place_10;
var cr139517_place_30 = new cljs.core.Keyword(null,"remote-schema-version","remote-schema-version",-925454925);
var cr139517_place_31 = (function (){var G__139615 = cr139517_place_29;
var G__139616 = cr139517_place_30;
var fexpr__139614 = cr139517_place_28;
return (fexpr__139614.cljs$core$IFn$_invoke$arity$2 ? fexpr__139614.cljs$core$IFn$_invoke$arity$2(G__139615,G__139616) : fexpr__139614.call(null,G__139615,G__139616));
})();
var cr139517_place_32 = cljs.core.get;
var cr139517_place_33 = cr139517_place_10;
var cr139517_place_34 = new cljs.core.Keyword(null,"date-formatter","date-formatter",-223324709);
var cr139517_place_35 = (function (){var G__139618 = cr139517_place_33;
var G__139619 = cr139517_place_34;
var fexpr__139617 = cr139517_place_32;
return (fexpr__139617.cljs$core$IFn$_invoke$arity$2 ? fexpr__139617.cljs$core$IFn$_invoke$arity$2(G__139618,G__139619) : fexpr__139617.call(null,G__139618,G__139619));
})();
var cr139517_place_36 = cr139517_place_11;
var cr139517_place_37 = cljs.core.ExceptionInfo;
var cr139517_place_38 = (cr139517_place_36 instanceof cr139517_place_37);
var cr139517_place_39 = null;
if(cr139517_place_38){
(cr139517_state[(0)] = cr139517_block_7);

(cr139517_state[(1)] = cr139517_place_11);

(cr139517_state[(2)] = cr139517_place_39);

return cr139517_state;
} else {
(cr139517_state[(0)] = cr139517_block_2);

(cr139517_state[(1)] = cr139517_place_15);

(cr139517_state[(2)] = cr139517_place_39);

(cr139517_state[(3)] = cr139517_place_23);

(cr139517_state[(4)] = cr139517_place_35);

(cr139517_state[(5)] = cr139517_place_19);

(cr139517_state[(6)] = cr139517_place_27);

(cr139517_state[(7)] = cr139517_place_31);

return cr139517_state;
}
}catch (e139596){var cr139517_exception = e139596;
(cr139517_state[(0)] = null);

throw cr139517_exception;
}});
var cr139517_block_6 = (function frontend$worker$rtc$core$new_task__rtc_start_STAR__$_cr139517_block_6(cr139517_state){
try{var cr139517_place_89 = (cr139517_state[(12)]);
(cr139517_state[(0)] = cr139517_block_8);

(cr139517_state[(12)] = null);

(cr139517_state[(2)] = cr139517_place_89);

return cr139517_state;
}catch (e139620){var cr139517_exception = e139620;
(cr139517_state[(0)] = null);

(cr139517_state[(12)] = null);

(cr139517_state[(2)] = null);

throw cr139517_exception;
}});
var cr139517_block_5 = (function frontend$worker$rtc$core$new_task__rtc_start_STAR__$_cr139517_block_5(cr139517_state){
try{var cr139517_place_85 = (cr139517_state[(1)]);
var cr139517_place_119 = cr139517_place_85;
(cr139517_state[(0)] = cr139517_block_6);

(cr139517_state[(1)] = null);

(cr139517_state[(12)] = cr139517_place_119);

return cr139517_state;
}catch (e139621){var cr139517_exception = e139621;
(cr139517_state[(0)] = null);

(cr139517_state[(12)] = null);

(cr139517_state[(2)] = null);

(cr139517_state[(1)] = null);

throw cr139517_exception;
}});
var cr139517_block_0 = (function frontend$worker$rtc$core$new_task__rtc_start_STAR__$_cr139517_block_0(cr139517_state){
try{var cr139517_place_0 = frontend.worker.device.new_task__ensure_device_metadata_BANG_;
var cr139517_place_1 = token;
var cr139517_place_2 = (function (){var G__139624 = cr139517_place_1;
var fexpr__139623 = cr139517_place_0;
return (fexpr__139623.cljs$core$IFn$_invoke$arity$1 ? fexpr__139623.cljs$core$IFn$_invoke$arity$1(G__139624) : fexpr__139623.call(null,G__139624));
})();
(cr139517_state[(0)] = cr139517_block_1);

return missionary.core.park(cr139517_place_2);
}catch (e139622){var cr139517_exception = e139622;
(cr139517_state[(0)] = null);

throw cr139517_exception;
}});
var cr139517_block_2 = (function frontend$worker$rtc$core$new_task__rtc_start_STAR__$_cr139517_block_2(cr139517_state){
try{var cr139517_place_15 = (cr139517_state[(1)]);
var cr139517_place_23 = (cr139517_state[(3)]);
var cr139517_place_35 = (cr139517_state[(4)]);
var cr139517_place_27 = (cr139517_state[(6)]);
var cr139517_place_40 = frontend.worker.rtc.core.create_rtc_loop;
var cr139517_place_41 = cr139517_place_23;
var cr139517_place_42 = cr139517_place_27;
var cr139517_place_43 = repo;
var cr139517_place_44 = cr139517_place_15;
var cr139517_place_45 = cr139517_place_35;
var cr139517_place_46 = token;
var cr139517_place_47 = (function (){var G__139627 = cr139517_place_41;
var G__139628 = cr139517_place_42;
var G__139629 = cr139517_place_43;
var G__139630 = cr139517_place_44;
var G__139631 = cr139517_place_45;
var G__139632 = cr139517_place_46;
var fexpr__139626 = cr139517_place_40;
return (fexpr__139626.cljs$core$IFn$_invoke$arity$6 ? fexpr__139626.cljs$core$IFn$_invoke$arity$6(G__139627,G__139628,G__139629,G__139630,G__139631,G__139632) : fexpr__139626.call(null,G__139627,G__139628,G__139629,G__139630,G__139631,G__139632));
})();
var cr139517_place_48 = cljs.core.__destructure_map;
var cr139517_place_49 = cr139517_place_47;
var cr139517_place_50 = (function (){var G__139634 = cr139517_place_49;
var fexpr__139633 = cr139517_place_48;
return (fexpr__139633.cljs$core$IFn$_invoke$arity$1 ? fexpr__139633.cljs$core$IFn$_invoke$arity$1(G__139634) : fexpr__139633.call(null,G__139634));
})();
var cr139517_place_51 = cljs.core.get;
var cr139517_place_52 = cr139517_place_50;
var cr139517_place_53 = new cljs.core.Keyword(null,"rtc-state-flow","rtc-state-flow",553472428);
var cr139517_place_54 = (function (){var G__139636 = cr139517_place_52;
var G__139637 = cr139517_place_53;
var fexpr__139635 = cr139517_place_51;
return (fexpr__139635.cljs$core$IFn$_invoke$arity$2 ? fexpr__139635.cljs$core$IFn$_invoke$arity$2(G__139636,G__139637) : fexpr__139635.call(null,G__139636,G__139637));
})();
var cr139517_place_55 = cljs.core.get;
var cr139517_place_56 = cr139517_place_50;
var cr139517_place_57 = new cljs.core.Keyword(null,"*rtc-auto-push?","*rtc-auto-push?",-44092416);
var cr139517_place_58 = (function (){var G__139639 = cr139517_place_56;
var G__139640 = cr139517_place_57;
var fexpr__139638 = cr139517_place_55;
return (fexpr__139638.cljs$core$IFn$_invoke$arity$2 ? fexpr__139638.cljs$core$IFn$_invoke$arity$2(G__139639,G__139640) : fexpr__139638.call(null,G__139639,G__139640));
})();
var cr139517_place_59 = cljs.core.get;
var cr139517_place_60 = cr139517_place_50;
var cr139517_place_61 = new cljs.core.Keyword(null,"*rtc-remote-profile?","*rtc-remote-profile?",751419973);
var cr139517_place_62 = (function (){var G__139642 = cr139517_place_60;
var G__139643 = cr139517_place_61;
var fexpr__139641 = cr139517_place_59;
return (fexpr__139641.cljs$core$IFn$_invoke$arity$2 ? fexpr__139641.cljs$core$IFn$_invoke$arity$2(G__139642,G__139643) : fexpr__139641.call(null,G__139642,G__139643));
})();
var cr139517_place_63 = cljs.core.get;
var cr139517_place_64 = cr139517_place_50;
var cr139517_place_65 = new cljs.core.Keyword(null,"rtc-loop-task","rtc-loop-task",1590035731);
var cr139517_place_66 = (function (){var G__139645 = cr139517_place_64;
var G__139646 = cr139517_place_65;
var fexpr__139644 = cr139517_place_63;
return (fexpr__139644.cljs$core$IFn$_invoke$arity$2 ? fexpr__139644.cljs$core$IFn$_invoke$arity$2(G__139645,G__139646) : fexpr__139644.call(null,G__139645,G__139646));
})();
var cr139517_place_67 = cljs.core.get;
var cr139517_place_68 = cr139517_place_50;
var cr139517_place_69 = new cljs.core.Keyword(null,"*online-users","*online-users",-1145442647);
var cr139517_place_70 = (function (){var G__139648 = cr139517_place_68;
var G__139649 = cr139517_place_69;
var fexpr__139647 = cr139517_place_67;
return (fexpr__139647.cljs$core$IFn$_invoke$arity$2 ? fexpr__139647.cljs$core$IFn$_invoke$arity$2(G__139648,G__139649) : fexpr__139647.call(null,G__139648,G__139649));
})();
var cr139517_place_71 = cljs.core.get;
var cr139517_place_72 = cr139517_place_50;
var cr139517_place_73 = new cljs.core.Keyword(null,"onstarted-task","onstarted-task",750035798);
var cr139517_place_74 = (function (){var G__139651 = cr139517_place_72;
var G__139652 = cr139517_place_73;
var fexpr__139650 = cr139517_place_71;
return (fexpr__139650.cljs$core$IFn$_invoke$arity$2 ? fexpr__139650.cljs$core$IFn$_invoke$arity$2(G__139651,G__139652) : fexpr__139650.call(null,G__139651,G__139652));
})();
var cr139517_place_75 = cljs.core.atom;
var cr139517_place_76 = null;
var cr139517_place_77 = (function (){var G__139654 = cr139517_place_76;
var fexpr__139653 = cr139517_place_75;
return (fexpr__139653.cljs$core$IFn$_invoke$arity$1 ? fexpr__139653.cljs$core$IFn$_invoke$arity$1(G__139654) : fexpr__139653.call(null,G__139654));
})();
var cr139517_place_78 = frontend.common.missionary.run_task;
var cr139517_place_79 = new cljs.core.Keyword(null,"rtc-loop-task","rtc-loop-task",1590035731);
var cr139517_place_80 = cr139517_place_66;
var cr139517_place_81 = new cljs.core.Keyword(null,"fail","fail",1706214930);
var cr139517_place_82 = (function (e){
cljs.core.reset_BANG_(cr139517_place_77,e);

return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.rtc.core",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"rtc-loop-task","rtc-loop-task",1590035731),e,new cljs.core.Keyword(null,"line","line",212345235),360], null)),null);
});
var cr139517_place_83 = (function (){var G__139656 = cr139517_place_79;
var G__139657 = cr139517_place_80;
var G__139658 = cr139517_place_81;
var G__139659 = cr139517_place_82;
var fexpr__139655 = cr139517_place_78;
return (fexpr__139655.cljs$core$IFn$_invoke$arity$4 ? fexpr__139655.cljs$core$IFn$_invoke$arity$4(G__139656,G__139657,G__139658,G__139659) : fexpr__139655.call(null,G__139656,G__139657,G__139658,G__139659));
})();
var cr139517_place_84 = cr139517_place_74;
(cr139517_state[(0)] = cr139517_block_3);

(cr139517_state[(1)] = null);

(cr139517_state[(4)] = null);

(cr139517_state[(1)] = cr139517_place_62);

(cr139517_state[(4)] = cr139517_place_54);

(cr139517_state[(8)] = cr139517_place_77);

(cr139517_state[(9)] = cr139517_place_70);

(cr139517_state[(10)] = cr139517_place_58);

(cr139517_state[(11)] = cr139517_place_83);

return missionary.core.park(cr139517_place_84);
}catch (e139625){var cr139517_exception = e139625;
(cr139517_state[(0)] = null);

(cr139517_state[(1)] = null);

(cr139517_state[(2)] = null);

(cr139517_state[(3)] = null);

(cr139517_state[(4)] = null);

(cr139517_state[(5)] = null);

(cr139517_state[(6)] = null);

(cr139517_state[(7)] = null);

throw cr139517_exception;
}});
var cr139517_block_7 = (function frontend$worker$rtc$core$new_task__rtc_start_STAR__$_cr139517_block_7(cr139517_state){
try{var cr139517_place_11 = (cr139517_state[(1)]);
var cr139517_place_120 = cr139517_place_11;
(cr139517_state[(0)] = cr139517_block_8);

(cr139517_state[(1)] = null);

(cr139517_state[(2)] = cr139517_place_120);

return cr139517_state;
}catch (e139660){var cr139517_exception = e139660;
(cr139517_state[(0)] = null);

(cr139517_state[(1)] = null);

(cr139517_state[(2)] = null);

throw cr139517_exception;
}});
var cr139517_block_3 = (function frontend$worker$rtc$core$new_task__rtc_start_STAR__$_cr139517_block_3(cr139517_state){
try{var cr139517_place_85 = missionary.core.unpark();
var cr139517_place_86 = cr139517_place_85;
var cr139517_place_87 = cljs.core.ExceptionInfo;
var cr139517_place_88 = (cr139517_place_86 instanceof cr139517_place_87);
var cr139517_place_89 = null;
if(cr139517_place_88){
(cr139517_state[(0)] = cr139517_block_5);

(cr139517_state[(1)] = null);

(cr139517_state[(3)] = null);

(cr139517_state[(4)] = null);

(cr139517_state[(8)] = null);

(cr139517_state[(9)] = null);

(cr139517_state[(10)] = null);

(cr139517_state[(5)] = null);

(cr139517_state[(11)] = null);

(cr139517_state[(6)] = null);

(cr139517_state[(7)] = null);

(cr139517_state[(1)] = cr139517_place_85);

(cr139517_state[(12)] = cr139517_place_89);

return cr139517_state;
} else {
(cr139517_state[(0)] = cr139517_block_4);

(cr139517_state[(12)] = cr139517_place_89);

return cr139517_state;
}
}catch (e139661){var cr139517_exception = e139661;
(cr139517_state[(0)] = null);

(cr139517_state[(1)] = null);

(cr139517_state[(2)] = null);

(cr139517_state[(3)] = null);

(cr139517_state[(4)] = null);

(cr139517_state[(8)] = null);

(cr139517_state[(9)] = null);

(cr139517_state[(10)] = null);

(cr139517_state[(5)] = null);

(cr139517_state[(11)] = null);

(cr139517_state[(6)] = null);

(cr139517_state[(7)] = null);

throw cr139517_exception;
}});
return cloroutine.impl.coroutine((function (){var G__139662 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((13));
(G__139662[(0)] = cr139517_block_0);

return G__139662;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.core.new_task__rtc_start = (function frontend$worker$rtc$core$new_task__rtc_start(stop_before_start_QMARK_){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr139663_block_5 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_5(cr139663_state){
try{var cr139663_place_17 = (cr139663_state[(3)]);
var cr139663_place_20 = cr139663_place_17;
(cr139663_state[(0)] = cr139663_block_7);

(cr139663_state[(3)] = null);

(cr139663_state[(6)] = cr139663_place_20);

return cr139663_state;
}catch (e139728){var cr139663_exception = e139728;
(cr139663_state[(0)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(6)] = null);

(cr139663_state[(3)] = null);

(cr139663_state[(4)] = null);

(cr139663_state[(5)] = null);

throw cr139663_exception;
}});
var cr139663_block_10 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_10(cr139663_state){
try{var cr139663_place_23 = null;
(cr139663_state[(0)] = cr139663_block_26);

(cr139663_state[(1)] = cr139663_place_23);

return cr139663_state;
}catch (e139729){var cr139663_exception = e139729;
(cr139663_state[(0)] = null);

(cr139663_state[(1)] = null);

throw cr139663_exception;
}});
var cr139663_block_9 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_9(cr139663_state){
try{var cr139663_place_9 = (cr139663_state[(1)]);
var cr139663_place_22 = null;
if(cljs.core.truth_(cr139663_place_9)){
(cr139663_state[(0)] = cr139663_block_11);

(cr139663_state[(1)] = null);

(cr139663_state[(1)] = cr139663_place_22);

return cr139663_state;
} else {
(cr139663_state[(0)] = cr139663_block_10);

(cr139663_state[(1)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(4)] = null);

(cr139663_state[(1)] = cr139663_place_22);

return cr139663_state;
}
}catch (e139730){var cr139663_exception = e139730;
(cr139663_state[(0)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(4)] = null);

throw cr139663_exception;
}});
var cr139663_block_17 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_17(cr139663_state){
try{var cr139663_place_36 = (cr139663_state[(3)]);
var cr139663_place_40 = cr139663_place_36;
var cr139663_place_41 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr139663_place_42 = cr139663_place_40;
var cr139663_place_43 = cr139663_place_41.cljs$core$IFn$_invoke$arity$1(cr139663_place_42);
var cr139663_place_44 = cr139663_place_43;
var cr139663_place_45 = cljs.core.Keyword;
var cr139663_place_46 = (cr139663_place_44 instanceof cr139663_place_45);
var cr139663_place_47 = null;
if(cr139663_place_46){
(cr139663_state[(0)] = cr139663_block_19);

(cr139663_state[(3)] = null);

(cr139663_state[(5)] = cr139663_place_43);

(cr139663_state[(3)] = cr139663_place_47);

return cr139663_state;
} else {
(cr139663_state[(0)] = cr139663_block_18);

(cr139663_state[(3)] = null);

(cr139663_state[(3)] = cr139663_place_47);

return cr139663_state;
}
}catch (e139731){var cr139663_exception = e139731;
(cr139663_state[(0)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(3)] = null);

(cr139663_state[(4)] = null);

throw cr139663_exception;
}});
var cr139663_block_7 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_7(cr139663_state){
try{var cr139663_place_19 = (cr139663_state[(6)]);
(cr139663_state[(0)] = cr139663_block_8);

(cr139663_state[(6)] = null);

(cr139663_state[(5)] = cr139663_place_19);

return cr139663_state;
}catch (e139732){var cr139663_exception = e139732;
(cr139663_state[(0)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(6)] = null);

(cr139663_state[(4)] = null);

(cr139663_state[(5)] = null);

throw cr139663_exception;
}});
var cr139663_block_6 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_6(cr139663_state){
try{var cr139663_place_6 = (cr139663_state[(3)]);
var cr139663_place_21 = cr139663_place_6;
(cr139663_state[(0)] = cr139663_block_7);

(cr139663_state[(3)] = null);

(cr139663_state[(6)] = cr139663_place_21);

return cr139663_state;
}catch (e139733){var cr139663_exception = e139733;
(cr139663_state[(0)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(6)] = null);

(cr139663_state[(3)] = null);

(cr139663_state[(4)] = null);

(cr139663_state[(5)] = null);

throw cr139663_exception;
}});
var cr139663_block_13 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_13(cr139663_state){
try{var cr139663_place_27 = frontend.worker.rtc.core.rtc_stop;
var cr139663_place_28 = (function (){var fexpr__139735 = cr139663_place_27;
return (fexpr__139735.cljs$core$IFn$_invoke$arity$0 ? fexpr__139735.cljs$core$IFn$_invoke$arity$0() : fexpr__139735.call(null));
})();
(cr139663_state[(0)] = cr139663_block_14);

(cr139663_state[(3)] = cr139663_place_28);

return cr139663_state;
}catch (e139734){var cr139663_exception = e139734;
(cr139663_state[(0)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(3)] = null);

(cr139663_state[(4)] = null);

throw cr139663_exception;
}});
var cr139663_block_12 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_12(cr139663_state){
try{var cr139663_place_26 = null;
(cr139663_state[(0)] = cr139663_block_14);

(cr139663_state[(3)] = cr139663_place_26);

return cr139663_state;
}catch (e139736){var cr139663_exception = e139736;
(cr139663_state[(0)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(3)] = null);

(cr139663_state[(4)] = null);

throw cr139663_exception;
}});
var cr139663_block_11 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_11(cr139663_state){
try{var cr139663_place_24 = stop_before_start_QMARK_;
var cr139663_place_25 = null;
if(cljs.core.truth_(cr139663_place_24)){
(cr139663_state[(0)] = cr139663_block_13);

(cr139663_state[(3)] = cr139663_place_25);

return cr139663_state;
} else {
(cr139663_state[(0)] = cr139663_block_12);

(cr139663_state[(3)] = cr139663_place_25);

return cr139663_state;
}
}catch (e139737){var cr139663_exception = e139737;
(cr139663_state[(0)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(4)] = null);

throw cr139663_exception;
}});
var cr139663_block_19 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_19(cr139663_state){
try{var cr139663_place_43 = (cr139663_state[(5)]);
var cr139663_place_49 = cr139663_place_43;
var cr139663_place_50 = cr139663_place_49.fqn;
(cr139663_state[(0)] = cr139663_block_20);

(cr139663_state[(5)] = null);

(cr139663_state[(3)] = cr139663_place_50);

return cr139663_state;
}catch (e139738){var cr139663_exception = e139738;
(cr139663_state[(0)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(5)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(3)] = null);

(cr139663_state[(4)] = null);

throw cr139663_exception;
}});
var cr139663_block_25 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_25(cr139663_state){
try{var cr139663_place_38 = (cr139663_state[(2)]);
(cr139663_state[(0)] = cr139663_block_26);

(cr139663_state[(2)] = null);

(cr139663_state[(1)] = cr139663_place_38);

return cr139663_state;
}catch (e139739){var cr139663_exception = e139739;
(cr139663_state[(0)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(1)] = null);

throw cr139663_exception;
}});
var cr139663_block_15 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_15(cr139663_state){
try{var cr139663_place_33 = missionary.core.unpark();
var cr139663_place_34 = cljs.core.ex_data;
var cr139663_place_35 = cr139663_place_33;
var cr139663_place_36 = (function (){var G__139742 = cr139663_place_35;
var fexpr__139741 = cr139663_place_34;
return (fexpr__139741.cljs$core$IFn$_invoke$arity$1 ? fexpr__139741.cljs$core$IFn$_invoke$arity$1(G__139742) : fexpr__139741.call(null,G__139742));
})();
var cr139663_place_37 = cr139663_place_36;
var cr139663_place_38 = null;
if(cljs.core.truth_(cr139663_place_37)){
(cr139663_state[(0)] = cr139663_block_17);

(cr139663_state[(4)] = cr139663_place_33);

(cr139663_state[(3)] = cr139663_place_36);

(cr139663_state[(2)] = cr139663_place_38);

return cr139663_state;
} else {
(cr139663_state[(0)] = cr139663_block_16);

(cr139663_state[(2)] = cr139663_place_38);

return cr139663_state;
}
}catch (e139740){var cr139663_exception = e139740;
(cr139663_state[(0)] = null);

(cr139663_state[(1)] = null);

throw cr139663_exception;
}});
var cr139663_block_16 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_16(cr139663_state){
try{var cr139663_place_39 = null;
(cr139663_state[(0)] = cr139663_block_25);

(cr139663_state[(2)] = cr139663_place_39);

return cr139663_state;
}catch (e139743){var cr139663_exception = e139743;
(cr139663_state[(0)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(1)] = null);

throw cr139663_exception;
}});
var cr139663_block_22 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_22(cr139663_state){
try{var cr139663_place_33 = (cr139663_state[(4)]);
var cr139663_place_65 = lambdaisland.glogi.log;
var cr139663_place_66 = "frontend.worker.rtc.core";
var cr139663_place_67 = new cljs.core.Keyword(null,"error","error",-978969032);
var cr139663_place_68 = cljs.core.identity;
var cr139663_place_69 = new cljs.core.Keyword(null,"rtc-start-failed","rtc-start-failed",112742546);
var cr139663_place_70 = cr139663_place_33;
var cr139663_place_71 = new cljs.core.Keyword(null,"line","line",212345235);
var cr139663_place_72 = 398;
var cr139663_place_73 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr139663_place_71,cr139663_place_72,cr139663_place_69,cr139663_place_70]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr139663_place_74 = (function (){var G__139746 = cr139663_place_73;
var fexpr__139745 = cr139663_place_68;
return (fexpr__139745.cljs$core$IFn$_invoke$arity$1 ? fexpr__139745.cljs$core$IFn$_invoke$arity$1(G__139746) : fexpr__139745.call(null,G__139746));
})();
var cr139663_place_75 = null;
var cr139663_place_76 = (function (){var G__139748 = cr139663_place_66;
var G__139749 = cr139663_place_67;
var G__139750 = cr139663_place_74;
var G__139751 = cr139663_place_75;
var fexpr__139747 = cr139663_place_65;
return (fexpr__139747.cljs$core$IFn$_invoke$arity$4 ? fexpr__139747.cljs$core$IFn$_invoke$arity$4(G__139748,G__139749,G__139750,G__139751) : fexpr__139747.call(null,G__139748,G__139749,G__139750,G__139751));
})();
(cr139663_state[(0)] = cr139663_block_24);

(cr139663_state[(3)] = cr139663_place_76);

return cr139663_state;
}catch (e139744){var cr139663_exception = e139744;
(cr139663_state[(0)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(3)] = null);

(cr139663_state[(4)] = null);

throw cr139663_exception;
}});
var cr139663_block_26 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_26(cr139663_state){
try{var cr139663_place_22 = (cr139663_state[(1)]);
(cr139663_state[(0)] = null);

(cr139663_state[(1)] = null);

return cr139663_place_22;
}catch (e139752){var cr139663_exception = e139752;
(cr139663_state[(0)] = null);

(cr139663_state[(1)] = null);

throw cr139663_exception;
}});
var cr139663_block_20 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_20(cr139663_state){
try{var cr139663_place_47 = (cr139663_state[(3)]);
var cr139663_place_51 = cr139663_place_47;
var cr139663_place_52 = null;
var G__139754 = cr139663_place_51;
switch (G__139754) {
case "rtc.exception/not-rtc-graph":
case "rtc.exception/major-schema-version-mismatched":
case "rtc.exception/lock-failed":
(cr139663_state[(0)] = cr139663_block_21);

(cr139663_state[(3)] = null);

(cr139663_state[(3)] = cr139663_place_52);

return cr139663_state;

break;
case "rtc.exception/not-found-db-conn":
(cr139663_state[(0)] = cr139663_block_22);

(cr139663_state[(3)] = null);

(cr139663_state[(3)] = cr139663_place_52);

return cr139663_state;

break;
default:
(cr139663_state[(0)] = cr139663_block_23);

(cr139663_state[(3)] = null);

(cr139663_state[(3)] = cr139663_place_52);

return cr139663_state;

}
}catch (e139753){var cr139663_exception = e139753;
(cr139663_state[(0)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(3)] = null);

(cr139663_state[(4)] = null);

throw cr139663_exception;
}});
var cr139663_block_14 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_14(cr139663_state){
try{var cr139663_place_3 = (cr139663_state[(2)]);
var cr139663_place_25 = (cr139663_state[(3)]);
var cr139663_place_1 = (cr139663_state[(4)]);
var cr139663_place_29 = frontend.worker.rtc.core.new_task__rtc_start_STAR_;
var cr139663_place_30 = cr139663_place_1;
var cr139663_place_31 = cr139663_place_3;
var cr139663_place_32 = (function (){var G__139757 = cr139663_place_30;
var G__139758 = cr139663_place_31;
var fexpr__139756 = cr139663_place_29;
return (fexpr__139756.cljs$core$IFn$_invoke$arity$2 ? fexpr__139756.cljs$core$IFn$_invoke$arity$2(G__139757,G__139758) : fexpr__139756.call(null,G__139757,G__139758));
})();
(cr139663_state[(0)] = cr139663_block_15);

(cr139663_state[(2)] = null);

(cr139663_state[(3)] = null);

(cr139663_state[(4)] = null);

return missionary.core.park(cr139663_place_32);
}catch (e139755){var cr139663_exception = e139755;
(cr139663_state[(0)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(3)] = null);

(cr139663_state[(4)] = null);

throw cr139663_exception;
}});
var cr139663_block_3 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_3(cr139663_state){
try{var cr139663_place_13 = (cr139663_state[(3)]);
var cr139663_place_16 = cr139663_place_13;
(cr139663_state[(0)] = cr139663_block_8);

(cr139663_state[(3)] = null);

(cr139663_state[(5)] = cr139663_place_16);

return cr139663_state;
}catch (e139759){var cr139663_exception = e139759;
(cr139663_state[(0)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(3)] = null);

(cr139663_state[(4)] = null);

(cr139663_state[(5)] = null);

throw cr139663_exception;
}});
var cr139663_block_4 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_4(cr139663_state){
try{var cr139663_place_3 = (cr139663_state[(2)]);
var cr139663_place_17 = cr139663_place_3;
var cr139663_place_18 = cr139663_place_17;
var cr139663_place_19 = null;
if(cljs.core.truth_(cr139663_place_18)){
(cr139663_state[(0)] = cr139663_block_6);

(cr139663_state[(6)] = cr139663_place_19);

return cr139663_state;
} else {
(cr139663_state[(0)] = cr139663_block_5);

(cr139663_state[(3)] = null);

(cr139663_state[(3)] = cr139663_place_17);

(cr139663_state[(6)] = cr139663_place_19);

return cr139663_state;
}
}catch (e139760){var cr139663_exception = e139760;
(cr139663_state[(0)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(3)] = null);

(cr139663_state[(4)] = null);

(cr139663_state[(5)] = null);

throw cr139663_exception;
}});
var cr139663_block_23 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_23(cr139663_state){
try{var cr139663_place_33 = (cr139663_state[(4)]);
var cr139663_place_77 = lambdaisland.glogi.log;
var cr139663_place_78 = "frontend.worker.rtc.core";
var cr139663_place_79 = new cljs.core.Keyword(null,"error","error",-978969032);
var cr139663_place_80 = cljs.core.identity;
var cr139663_place_81 = new cljs.core.Keyword(null,"BUG-unknown-error","BUG-unknown-error",-1808552765);
var cr139663_place_82 = cr139663_place_33;
var cr139663_place_83 = new cljs.core.Keyword(null,"line","line",212345235);
var cr139663_place_84 = 400;
var cr139663_place_85 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr139663_place_81,cr139663_place_82,cr139663_place_83,cr139663_place_84]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr139663_place_86 = (function (){var G__139763 = cr139663_place_85;
var fexpr__139762 = cr139663_place_80;
return (fexpr__139762.cljs$core$IFn$_invoke$arity$1 ? fexpr__139762.cljs$core$IFn$_invoke$arity$1(G__139763) : fexpr__139762.call(null,G__139763));
})();
var cr139663_place_87 = null;
var cr139663_place_88 = (function (){var G__139765 = cr139663_place_78;
var G__139766 = cr139663_place_79;
var G__139767 = cr139663_place_86;
var G__139768 = cr139663_place_87;
var fexpr__139764 = cr139663_place_77;
return (fexpr__139764.cljs$core$IFn$_invoke$arity$4 ? fexpr__139764.cljs$core$IFn$_invoke$arity$4(G__139765,G__139766,G__139767,G__139768) : fexpr__139764.call(null,G__139765,G__139766,G__139767,G__139768));
})();
(cr139663_state[(0)] = cr139663_block_24);

(cr139663_state[(3)] = cr139663_place_88);

return cr139663_state;
}catch (e139761){var cr139663_exception = e139761;
(cr139663_state[(0)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(3)] = null);

(cr139663_state[(4)] = null);

throw cr139663_exception;
}});
var cr139663_block_8 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_8(cr139663_state){
try{var cr139663_place_15 = (cr139663_state[(5)]);
(cr139663_state[(0)] = cr139663_block_9);

(cr139663_state[(5)] = null);

(cr139663_state[(1)] = cr139663_place_15);

return cr139663_state;
}catch (e139769){var cr139663_exception = e139769;
(cr139663_state[(0)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(4)] = null);

(cr139663_state[(5)] = null);

throw cr139663_exception;
}});
var cr139663_block_21 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_21(cr139663_state){
try{var cr139663_place_33 = (cr139663_state[(4)]);
var cr139663_place_53 = lambdaisland.glogi.log;
var cr139663_place_54 = "frontend.worker.rtc.core";
var cr139663_place_55 = new cljs.core.Keyword(null,"info","info",-317069002);
var cr139663_place_56 = cljs.core.identity;
var cr139663_place_57 = new cljs.core.Keyword(null,"rtc-start-failed","rtc-start-failed",112742546);
var cr139663_place_58 = cr139663_place_33;
var cr139663_place_59 = new cljs.core.Keyword(null,"line","line",212345235);
var cr139663_place_60 = 395;
var cr139663_place_61 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr139663_place_57,cr139663_place_58,cr139663_place_59,cr139663_place_60]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr139663_place_62 = (function (){var G__139772 = cr139663_place_61;
var fexpr__139771 = cr139663_place_56;
return (fexpr__139771.cljs$core$IFn$_invoke$arity$1 ? fexpr__139771.cljs$core$IFn$_invoke$arity$1(G__139772) : fexpr__139771.call(null,G__139772));
})();
var cr139663_place_63 = null;
var cr139663_place_64 = (function (){var G__139774 = cr139663_place_54;
var G__139775 = cr139663_place_55;
var G__139776 = cr139663_place_62;
var G__139777 = cr139663_place_63;
var fexpr__139773 = cr139663_place_53;
return (fexpr__139773.cljs$core$IFn$_invoke$arity$4 ? fexpr__139773.cljs$core$IFn$_invoke$arity$4(G__139774,G__139775,G__139776,G__139777) : fexpr__139773.call(null,G__139774,G__139775,G__139776,G__139777));
})();
(cr139663_state[(0)] = cr139663_block_24);

(cr139663_state[(3)] = cr139663_place_64);

return cr139663_state;
}catch (e139770){var cr139663_exception = e139770;
(cr139663_state[(0)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(3)] = null);

(cr139663_state[(4)] = null);

throw cr139663_exception;
}});
var cr139663_block_0 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_0(cr139663_state){
try{var cr139663_place_0 = frontend.worker.state.get_current_repo;
var cr139663_place_1 = (function (){var fexpr__139779 = cr139663_place_0;
return (fexpr__139779.cljs$core$IFn$_invoke$arity$0 ? fexpr__139779.cljs$core$IFn$_invoke$arity$0() : fexpr__139779.call(null));
})();
var cr139663_place_2 = frontend.worker.state.get_id_token;
var cr139663_place_3 = (function (){var fexpr__139780 = cr139663_place_2;
return (fexpr__139780.cljs$core$IFn$_invoke$arity$0 ? fexpr__139780.cljs$core$IFn$_invoke$arity$0() : fexpr__139780.call(null));
})();
var cr139663_place_4 = frontend.worker.state.get_datascript_conn;
var cr139663_place_5 = cr139663_place_1;
var cr139663_place_6 = (function (){var G__139782 = cr139663_place_5;
var fexpr__139781 = cr139663_place_4;
return (fexpr__139781.cljs$core$IFn$_invoke$arity$1 ? fexpr__139781.cljs$core$IFn$_invoke$arity$1(G__139782) : fexpr__139781.call(null,G__139782));
})();
var cr139663_place_7 = cr139663_place_1;
var cr139663_place_8 = cr139663_place_7;
var cr139663_place_9 = null;
if(cljs.core.truth_(cr139663_place_8)){
(cr139663_state[(0)] = cr139663_block_2);

(cr139663_state[(1)] = cr139663_place_9);

(cr139663_state[(2)] = cr139663_place_3);

(cr139663_state[(3)] = cr139663_place_6);

(cr139663_state[(4)] = cr139663_place_1);

return cr139663_state;
} else {
(cr139663_state[(0)] = cr139663_block_1);

(cr139663_state[(1)] = cr139663_place_9);

(cr139663_state[(2)] = cr139663_place_3);

(cr139663_state[(3)] = cr139663_place_7);

(cr139663_state[(4)] = cr139663_place_1);

return cr139663_state;
}
}catch (e139778){var cr139663_exception = e139778;
(cr139663_state[(0)] = null);

throw cr139663_exception;
}});
var cr139663_block_2 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_2(cr139663_state){
try{var cr139663_place_1 = (cr139663_state[(4)]);
var cr139663_place_11 = logseq.db.sqlite.util.db_based_graph_QMARK_;
var cr139663_place_12 = cr139663_place_1;
var cr139663_place_13 = (function (){var G__139785 = cr139663_place_12;
var fexpr__139784 = cr139663_place_11;
return (fexpr__139784.cljs$core$IFn$_invoke$arity$1 ? fexpr__139784.cljs$core$IFn$_invoke$arity$1(G__139785) : fexpr__139784.call(null,G__139785));
})();
var cr139663_place_14 = cr139663_place_13;
var cr139663_place_15 = null;
if(cljs.core.truth_(cr139663_place_14)){
(cr139663_state[(0)] = cr139663_block_4);

(cr139663_state[(5)] = cr139663_place_15);

return cr139663_state;
} else {
(cr139663_state[(0)] = cr139663_block_3);

(cr139663_state[(3)] = null);

(cr139663_state[(3)] = cr139663_place_13);

(cr139663_state[(5)] = cr139663_place_15);

return cr139663_state;
}
}catch (e139783){var cr139663_exception = e139783;
(cr139663_state[(0)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(3)] = null);

(cr139663_state[(4)] = null);

throw cr139663_exception;
}});
var cr139663_block_24 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_24(cr139663_state){
try{var cr139663_place_52 = (cr139663_state[(3)]);
var cr139663_place_33 = (cr139663_state[(4)]);
var cr139663_place_89 = frontend.worker.rtc.exception.__GT_map;
var cr139663_place_90 = cr139663_place_33;
var cr139663_place_91 = (function (){var G__139788 = cr139663_place_90;
var fexpr__139787 = cr139663_place_89;
return (fexpr__139787.cljs$core$IFn$_invoke$arity$1 ? fexpr__139787.cljs$core$IFn$_invoke$arity$1(G__139788) : fexpr__139787.call(null,G__139788));
})();
(cr139663_state[(0)] = cr139663_block_25);

(cr139663_state[(3)] = null);

(cr139663_state[(4)] = null);

(cr139663_state[(2)] = cr139663_place_91);

return cr139663_state;
}catch (e139786){var cr139663_exception = e139786;
(cr139663_state[(0)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(3)] = null);

(cr139663_state[(4)] = null);

throw cr139663_exception;
}});
var cr139663_block_1 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_1(cr139663_state){
try{var cr139663_place_7 = (cr139663_state[(3)]);
var cr139663_place_10 = cr139663_place_7;
(cr139663_state[(0)] = cr139663_block_9);

(cr139663_state[(3)] = null);

(cr139663_state[(1)] = cr139663_place_10);

return cr139663_state;
}catch (e139789){var cr139663_exception = e139789;
(cr139663_state[(0)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(3)] = null);

(cr139663_state[(4)] = null);

throw cr139663_exception;
}});
var cr139663_block_18 = (function frontend$worker$rtc$core$new_task__rtc_start_$_cr139663_block_18(cr139663_state){
try{var cr139663_place_48 = null;
(cr139663_state[(0)] = cr139663_block_20);

(cr139663_state[(3)] = cr139663_place_48);

return cr139663_state;
}catch (e139790){var cr139663_exception = e139790;
(cr139663_state[(0)] = null);

(cr139663_state[(2)] = null);

(cr139663_state[(1)] = null);

(cr139663_state[(3)] = null);

(cr139663_state[(4)] = null);

throw cr139663_exception;
}});
return cloroutine.impl.coroutine((function (){var G__139791 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((7));
(G__139791[(0)] = cr139663_block_0);

return G__139791;
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
var map__139792 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized(frontend.worker.rtc.ws_util.get_ws_url(token));
var map__139792__$1 = cljs.core.__destructure_map(map__139792);
var get_ws_create_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__139792__$1,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002));
return missionary.core.join.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"graphs","graphs",-1584479112),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.worker.rtc.ws_util.send_AMPERSAND_recv(get_ws_create_task,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"action","action",-811238024),"list-graphs"], null))], 0));
});
/**
 * Return a task that return true if succeed
 */
frontend.worker.rtc.core.new_task__delete_graph = (function frontend$worker$rtc$core$new_task__delete_graph(token,graph_uuid,schema_version){
var map__139793 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized(frontend.worker.rtc.ws_util.get_ws_url(token));
var map__139793__$1 = cljs.core.__destructure_map(map__139793);
var get_ws_create_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__139793__$1,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002));
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr139794_block_0 = (function frontend$worker$rtc$core$new_task__delete_graph_$_cr139794_block_0(cr139794_state){
try{var cr139794_place_0 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr139794_place_1 = get_ws_create_task;
var cr139794_place_2 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr139794_place_3 = "delete-graph";
var cr139794_place_4 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr139794_place_5 = graph_uuid;
var cr139794_place_6 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr139794_place_7 = schema_version;
var cr139794_place_8 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr139794_place_7);
var cr139794_place_9 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr139794_place_2,cr139794_place_3,cr139794_place_6,cr139794_place_8,cr139794_place_4,cr139794_place_5]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr139794_place_10 = (function (){var G__139820 = cr139794_place_1;
var G__139821 = cr139794_place_9;
var fexpr__139819 = cr139794_place_0;
return (fexpr__139819.cljs$core$IFn$_invoke$arity$2 ? fexpr__139819.cljs$core$IFn$_invoke$arity$2(G__139820,G__139821) : fexpr__139819.call(null,G__139820,G__139821));
})();
(cr139794_state[(0)] = cr139794_block_1);

return missionary.core.park(cr139794_place_10);
}catch (e139818){var cr139794_exception = e139818;
(cr139794_state[(0)] = null);

throw cr139794_exception;
}});
var cr139794_block_1 = (function frontend$worker$rtc$core$new_task__delete_graph_$_cr139794_block_1(cr139794_state){
try{var cr139794_place_11 = missionary.core.unpark();
var cr139794_place_12 = cljs.core.__destructure_map;
var cr139794_place_13 = cr139794_place_11;
var cr139794_place_14 = (function (){var G__139824 = cr139794_place_13;
var fexpr__139823 = cr139794_place_12;
return (fexpr__139823.cljs$core$IFn$_invoke$arity$1 ? fexpr__139823.cljs$core$IFn$_invoke$arity$1(G__139824) : fexpr__139823.call(null,G__139824));
})();
var cr139794_place_15 = cljs.core.get;
var cr139794_place_16 = cr139794_place_14;
var cr139794_place_17 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr139794_place_18 = (function (){var G__139826 = cr139794_place_16;
var G__139827 = cr139794_place_17;
var fexpr__139825 = cr139794_place_15;
return (fexpr__139825.cljs$core$IFn$_invoke$arity$2 ? fexpr__139825.cljs$core$IFn$_invoke$arity$2(G__139826,G__139827) : fexpr__139825.call(null,G__139826,G__139827));
})();
var cr139794_place_19 = cr139794_place_18;
var cr139794_place_20 = null;
if(cljs.core.truth_(cr139794_place_19)){
(cr139794_state[(0)] = cr139794_block_3);

(cr139794_state[(1)] = cr139794_place_18);

(cr139794_state[(2)] = cr139794_place_20);

return cr139794_state;
} else {
(cr139794_state[(0)] = cr139794_block_2);

(cr139794_state[(1)] = cr139794_place_18);

(cr139794_state[(2)] = cr139794_place_20);

return cr139794_state;
}
}catch (e139822){var cr139794_exception = e139822;
(cr139794_state[(0)] = null);

throw cr139794_exception;
}});
var cr139794_block_2 = (function frontend$worker$rtc$core$new_task__delete_graph_$_cr139794_block_2(cr139794_state){
try{var cr139794_place_21 = null;
(cr139794_state[(0)] = cr139794_block_4);

(cr139794_state[(2)] = cr139794_place_21);

return cr139794_state;
}catch (e139828){var cr139794_exception = e139828;
(cr139794_state[(0)] = null);

(cr139794_state[(1)] = null);

(cr139794_state[(2)] = null);

throw cr139794_exception;
}});
var cr139794_block_3 = (function frontend$worker$rtc$core$new_task__delete_graph_$_cr139794_block_3(cr139794_state){
try{var cr139794_place_18 = (cr139794_state[(1)]);
var cr139794_place_22 = lambdaisland.glogi.log;
var cr139794_place_23 = "frontend.worker.rtc.core";
var cr139794_place_24 = new cljs.core.Keyword(null,"info","info",-317069002);
var cr139794_place_25 = cljs.core.identity;
var cr139794_place_26 = new cljs.core.Keyword("frontend.worker.rtc.core","delete-graph-failed","frontend.worker.rtc.core/delete-graph-failed",-608725598);
var cr139794_place_27 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr139794_place_28 = graph_uuid;
var cr139794_place_29 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr139794_place_30 = cr139794_place_18;
var cr139794_place_31 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr139794_place_27,cr139794_place_28,cr139794_place_29,cr139794_place_30]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr139794_place_32 = new cljs.core.Keyword(null,"line","line",212345235);
var cr139794_place_33 = 435;
var cr139794_place_34 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr139794_place_26,cr139794_place_31,cr139794_place_32,cr139794_place_33]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr139794_place_35 = (function (){var G__139831 = cr139794_place_34;
var fexpr__139830 = cr139794_place_25;
return (fexpr__139830.cljs$core$IFn$_invoke$arity$1 ? fexpr__139830.cljs$core$IFn$_invoke$arity$1(G__139831) : fexpr__139830.call(null,G__139831));
})();
var cr139794_place_36 = null;
var cr139794_place_37 = (function (){var G__139833 = cr139794_place_23;
var G__139834 = cr139794_place_24;
var G__139835 = cr139794_place_35;
var G__139836 = cr139794_place_36;
var fexpr__139832 = cr139794_place_22;
return (fexpr__139832.cljs$core$IFn$_invoke$arity$4 ? fexpr__139832.cljs$core$IFn$_invoke$arity$4(G__139833,G__139834,G__139835,G__139836) : fexpr__139832.call(null,G__139833,G__139834,G__139835,G__139836));
})();
(cr139794_state[(0)] = cr139794_block_4);

(cr139794_state[(2)] = cr139794_place_37);

return cr139794_state;
}catch (e139829){var cr139794_exception = e139829;
(cr139794_state[(0)] = null);

(cr139794_state[(1)] = null);

(cr139794_state[(2)] = null);

throw cr139794_exception;
}});
var cr139794_block_4 = (function frontend$worker$rtc$core$new_task__delete_graph_$_cr139794_block_4(cr139794_state){
try{var cr139794_place_18 = (cr139794_state[(1)]);
var cr139794_place_20 = (cr139794_state[(2)]);
var cr139794_place_38 = cljs.core.boolean$;
var cr139794_place_39 = cr139794_place_18;
var cr139794_place_40 = null;
var cr139794_place_41 = (cr139794_place_39 == cr139794_place_40);
var cr139794_place_42 = (function (){var G__139839 = cr139794_place_41;
var fexpr__139838 = cr139794_place_38;
return (fexpr__139838.cljs$core$IFn$_invoke$arity$1 ? fexpr__139838.cljs$core$IFn$_invoke$arity$1(G__139839) : fexpr__139838.call(null,G__139839));
})();
(cr139794_state[(0)] = null);

(cr139794_state[(1)] = null);

(cr139794_state[(2)] = null);

return cr139794_place_42;
}catch (e139837){var cr139794_exception = e139837;
(cr139794_state[(0)] = null);

(cr139794_state[(1)] = null);

(cr139794_state[(2)] = null);

throw cr139794_exception;
}});
return cloroutine.impl.coroutine((function (){var G__139840 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__139840[(0)] = cr139794_block_0);

return G__139840;
})());
})(),missionary.core.sp_run);
});
/**
 * Return a task that return users-info about the graph.
 */
frontend.worker.rtc.core.new_task__get_users_info = (function frontend$worker$rtc$core$new_task__get_users_info(token,graph_uuid){
var map__139841 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized(frontend.worker.rtc.ws_util.get_ws_url(token));
var map__139841__$1 = cljs.core.__destructure_map(map__139841);
var get_ws_create_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__139841__$1,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002));
return missionary.core.join.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"users","users",-713552705),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.worker.rtc.ws_util.send_AMPERSAND_recv(get_ws_create_task,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"action","action",-811238024),"get-users-info",new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid], null))], 0));
});
frontend.worker.rtc.core.new_task__inject_users_info = (function frontend$worker$rtc$core$new_task__inject_users_info(token,graph_uuid,major_schema_version){
var map__139842 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized(frontend.worker.rtc.ws_util.get_ws_url(token));
var map__139842__$1 = cljs.core.__destructure_map(map__139842);
var get_ws_create_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__139842__$1,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002));
return frontend.worker.rtc.ws_util.send_AMPERSAND_recv(get_ws_create_task,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"action","action",-811238024),"inject-users-info",new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid,new cljs.core.Keyword(null,"schema-version","schema-version",1117939594),cljs.core.str.cljs$core$IFn$_invoke$arity$1(major_schema_version)], null));
});
frontend.worker.rtc.core.new_task__grant_access_to_others = (function frontend$worker$rtc$core$new_task__grant_access_to_others(var_args){
var args__5732__auto__ = [];
var len__5726__auto___140233 = arguments.length;
var i__5727__auto___140234 = (0);
while(true){
if((i__5727__auto___140234 < len__5726__auto___140233)){
args__5732__auto__.push((arguments[i__5727__auto___140234]));

var G__140235 = (i__5727__auto___140234 + (1));
i__5727__auto___140234 = G__140235;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.worker.rtc.core.new_task__grant_access_to_others.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.worker.rtc.core.new_task__grant_access_to_others.cljs$core$IFn$_invoke$arity$variadic = (function (token,graph_uuid,p__139846){
var map__139847 = p__139846;
var map__139847__$1 = cljs.core.__destructure_map(map__139847);
var target_user_uuids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__139847__$1,new cljs.core.Keyword(null,"target-user-uuids","target-user-uuids",-739511872));
var target_user_emails = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__139847__$1,new cljs.core.Keyword(null,"target-user-emails","target-user-emails",-25552368));
var map__139848 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized(frontend.worker.rtc.ws_util.get_ws_url(token));
var map__139848__$1 = cljs.core.__destructure_map(map__139848);
var get_ws_create_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__139848__$1,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002));
return frontend.worker.rtc.ws_util.send_AMPERSAND_recv(get_ws_create_task,(function (){var G__139849 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"action","action",-811238024),"grant-access",new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid], null);
var G__139849__$1 = (cljs.core.truth_(target_user_uuids)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__139849,new cljs.core.Keyword(null,"target-user-uuids","target-user-uuids",-739511872),target_user_uuids):G__139849);
if(cljs.core.truth_(target_user_emails)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__139849__$1,new cljs.core.Keyword(null,"target-user-emails","target-user-emails",-25552368),target_user_emails);
} else {
return G__139849__$1;
}
})());
}));

(frontend.worker.rtc.core.new_task__grant_access_to_others.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.worker.rtc.core.new_task__grant_access_to_others.cljs$lang$applyTo = (function (seq139843){
var G__139844 = cljs.core.first(seq139843);
var seq139843__$1 = cljs.core.next(seq139843);
var G__139845 = cljs.core.first(seq139843__$1);
var seq139843__$2 = cljs.core.next(seq139843__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__139844,G__139845,seq139843__$2);
}));

/**
 * Return a task that return map [:ex-data :ex-message :versions]
 */
frontend.worker.rtc.core.new_task__get_block_content_versions = (function frontend$worker$rtc$core$new_task__get_block_content_versions(token,graph_uuid,block_uuid){
var map__139850 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized(frontend.worker.rtc.ws_util.get_ws_url(token));
var map__139850__$1 = cljs.core.__destructure_map(map__139850);
var get_ws_create_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__139850__$1,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002));
return missionary.core.join.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"versions","versions",536521978),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.worker.rtc.ws_util.send_AMPERSAND_recv(get_ws_create_task,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"action","action",-811238024),"query-block-content-versions",new cljs.core.Keyword(null,"block-uuids","block-uuids",-1313492773),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_uuid], null),new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid], null))], 0));
});
frontend.worker.rtc.core.create_get_state_flow_STAR_ = (function (){var rtc_loop_metadata_flow = missionary.core.watch(frontend.worker.rtc.core._STAR_rtc_loop_metadata);
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr139851_block_20 = (function frontend$worker$rtc$core$cr139851_block_20(cr139851_state){
try{var cr139851_place_94 = (cr139851_state[(2)]);
(cr139851_state[(0)] = cr139851_block_22);

(cr139851_state[(2)] = null);

(cr139851_state[(1)] = cr139851_place_94);

return cr139851_state;
}catch (e139939){var cr139851_exception = e139939;
(cr139851_state[(0)] = cr139851_block_23);

(cr139851_state[(1)] = null);

(cr139851_state[(2)] = null);

(cr139851_state[(7)] = true);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_15 = (function frontend$worker$rtc$core$cr139851_block_15(cr139851_state){
try{var cr139851_place_64 = (cr139851_state[(14)]);
(cr139851_state[(0)] = cr139851_block_23);

(cr139851_state[(14)] = null);

(cr139851_state[(6)] = cr139851_place_64);

return cr139851_state;
}catch (e139940){var cr139851_exception = e139940;
(cr139851_state[(0)] = cr139851_block_16);

(cr139851_state[(14)] = null);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_11 = (function frontend$worker$rtc$core$cr139851_block_11(cr139851_state){
try{var cr139851_place_53 = (cr139851_state[(14)]);
var cr139851_place_64 = null;
if(cljs.core.truth_(cr139851_place_53)){
(cr139851_state[(0)] = cr139851_block_13);

(cr139851_state[(14)] = null);

(cr139851_state[(14)] = cr139851_place_64);

return cr139851_state;
} else {
(cr139851_state[(0)] = cr139851_block_12);

(cr139851_state[(1)] = null);

(cr139851_state[(2)] = null);

(cr139851_state[(3)] = null);

(cr139851_state[(4)] = null);

(cr139851_state[(5)] = null);

(cr139851_state[(8)] = null);

(cr139851_state[(9)] = null);

(cr139851_state[(10)] = null);

(cr139851_state[(11)] = null);

(cr139851_state[(14)] = null);

(cr139851_state[(12)] = null);

(cr139851_state[(13)] = null);

(cr139851_state[(14)] = cr139851_place_64);

return cr139851_state;
}
}catch (e139941){var cr139851_exception = e139941;
(cr139851_state[(0)] = cr139851_block_16);

(cr139851_state[(1)] = null);

(cr139851_state[(2)] = null);

(cr139851_state[(3)] = null);

(cr139851_state[(4)] = null);

(cr139851_state[(5)] = null);

(cr139851_state[(8)] = null);

(cr139851_state[(9)] = null);

(cr139851_state[(10)] = null);

(cr139851_state[(11)] = null);

(cr139851_state[(14)] = null);

(cr139851_state[(12)] = null);

(cr139851_state[(13)] = null);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_0 = (function frontend$worker$rtc$core$cr139851_block_0(cr139851_state){
try{var cr139851_place_0 = rtc_loop_metadata_flow;
(cr139851_state[(0)] = cr139851_block_1);

return missionary.core.switch$(cr139851_place_0);
}catch (e139942){var cr139851_exception = e139942;
(cr139851_state[(0)] = null);

throw cr139851_exception;
}});
var cr139851_block_6 = (function frontend$worker$rtc$core$cr139851_block_6(cr139851_state){
try{var cr139851_place_16 = (cr139851_state[(3)]);
var cr139851_place_59 = cr139851_place_16;
var cr139851_place_60 = cr139851_place_59;
var cr139851_place_61 = null;
if(cljs.core.truth_(cr139851_place_60)){
(cr139851_state[(0)] = cr139851_block_8);

(cr139851_state[(17)] = cr139851_place_61);

return cr139851_state;
} else {
(cr139851_state[(0)] = cr139851_block_7);

(cr139851_state[(15)] = cr139851_place_59);

(cr139851_state[(17)] = cr139851_place_61);

return cr139851_state;
}
}catch (e139943){var cr139851_exception = e139943;
(cr139851_state[(0)] = cr139851_block_16);

(cr139851_state[(1)] = null);

(cr139851_state[(2)] = null);

(cr139851_state[(3)] = null);

(cr139851_state[(4)] = null);

(cr139851_state[(5)] = null);

(cr139851_state[(8)] = null);

(cr139851_state[(16)] = null);

(cr139851_state[(9)] = null);

(cr139851_state[(10)] = null);

(cr139851_state[(11)] = null);

(cr139851_state[(14)] = null);

(cr139851_state[(12)] = null);

(cr139851_state[(13)] = null);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_16 = (function frontend$worker$rtc$core$cr139851_block_16(cr139851_state){
try{var cr139851_place_49 = (cr139851_state[(6)]);
var cr139851_place_89 = cr139851_place_49;
var cr139851_place_90 = missionary.Cancelled;
var cr139851_place_91 = (cr139851_place_89 instanceof cr139851_place_90);
var cr139851_place_92 = null;
if(cr139851_place_91){
(cr139851_state[(0)] = cr139851_block_21);

(cr139851_state[(1)] = cr139851_place_92);

return cr139851_state;
} else {
(cr139851_state[(0)] = cr139851_block_17);

(cr139851_state[(1)] = cr139851_place_92);

return cr139851_state;
}
}catch (e139944){var cr139851_exception = e139944;
(cr139851_state[(0)] = cr139851_block_23);

(cr139851_state[(7)] = true);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_13 = (function frontend$worker$rtc$core$cr139851_block_13(cr139851_state){
try{var cr139851_place_32 = (cr139851_state[(1)]);
var cr139851_place_36 = (cr139851_state[(2)]);
var cr139851_place_16 = (cr139851_state[(3)]);
var cr139851_place_44 = (cr139851_state[(4)]);
var cr139851_place_28 = (cr139851_state[(5)]);
var cr139851_place_48 = (cr139851_state[(8)]);
var cr139851_place_24 = (cr139851_state[(9)]);
var cr139851_place_12 = (cr139851_state[(10)]);
var cr139851_place_20 = (cr139851_state[(11)]);
var cr139851_place_40 = (cr139851_state[(12)]);
var cr139851_place_8 = (cr139851_state[(13)]);
var cr139851_place_66 = missionary.core.latest;
var cr139851_place_67 = (function (rtc_state,rtc_auto_push_QMARK_,rtc_remote_profile_QMARK_,rtc_lock,online_users,pending_local_ops_count,p__139854){
var vec__139855 = p__139854;
var local_tx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__139855,(0),null);
var remote_tx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__139855,(1),null);
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"rtc-lock","rtc-lock",1338966560),new cljs.core.Keyword(null,"user-uuid","user-uuid",-275954048),new cljs.core.Keyword(null,"last-stop-exception-ex-data","last-stop-exception-ex-data",800047332),new cljs.core.Keyword(null,"rtc-state","rtc-state",1931374921),new cljs.core.Keyword(null,"local-graph-schema-version","local-graph-schema-version",-211621207),new cljs.core.Keyword(null,"local-tx","local-tx",1729212201),new cljs.core.Keyword(null,"remote-graph-schema-version","remote-graph-schema-version",-1202898069),new cljs.core.Keyword(null,"remote-profile?","remote-profile?",-1314795473),new cljs.core.Keyword(null,"remote-tx","remote-tx",-1423802481),new cljs.core.Keyword(null,"auto-push?","auto-push?",674534960),new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),new cljs.core.Keyword(null,"unpushed-block-update-count","unpushed-block-update-count",-387210371),new cljs.core.Keyword(null,"online-users","online-users",-747563810)],[rtc_lock,cr139851_place_12,(function (){var G__139858 = cr139851_place_44;
var G__139858__$1 = (cljs.core.truth_((G__139858 == null))?null:cljs.core.deref(G__139858));
if(cljs.core.truth_((G__139858__$1 == null))){
return null;
} else {
return cljs.core.ex_data(G__139858__$1);
}
})(),rtc_state,logseq.db.frontend.schema.schema_version__GT_string(cr139851_place_28),local_tx,logseq.db.frontend.schema.schema_version__GT_string(cr139851_place_36),rtc_remote_profile_QMARK_,remote_tx,rtc_auto_push_QMARK_,cr139851_place_48,pending_local_ops_count,online_users]);
});
var cr139851_place_68 = cr139851_place_40;
var cr139851_place_69 = missionary.core.watch;
var cr139851_place_70 = cr139851_place_16;
var cr139851_place_71 = (function (){var G__139947 = cr139851_place_70;
var fexpr__139946 = cr139851_place_69;
return (fexpr__139946.cljs$core$IFn$_invoke$arity$1 ? fexpr__139946.cljs$core$IFn$_invoke$arity$1(G__139947) : fexpr__139946.call(null,G__139947));
})();
var cr139851_place_72 = missionary.core.watch;
var cr139851_place_73 = cr139851_place_24;
var cr139851_place_74 = (function (){var G__139949 = cr139851_place_73;
var fexpr__139948 = cr139851_place_72;
return (fexpr__139948.cljs$core$IFn$_invoke$arity$1 ? fexpr__139948.cljs$core$IFn$_invoke$arity$1(G__139949) : fexpr__139948.call(null,G__139949));
})();
var cr139851_place_75 = missionary.core.watch;
var cr139851_place_76 = cr139851_place_20;
var cr139851_place_77 = (function (){var G__139951 = cr139851_place_76;
var fexpr__139950 = cr139851_place_75;
return (fexpr__139950.cljs$core$IFn$_invoke$arity$1 ? fexpr__139950.cljs$core$IFn$_invoke$arity$1(G__139951) : fexpr__139950.call(null,G__139951));
})();
var cr139851_place_78 = missionary.core.watch;
var cr139851_place_79 = cr139851_place_32;
var cr139851_place_80 = (function (){var G__139953 = cr139851_place_79;
var fexpr__139952 = cr139851_place_78;
return (fexpr__139952.cljs$core$IFn$_invoke$arity$1 ? fexpr__139952.cljs$core$IFn$_invoke$arity$1(G__139953) : fexpr__139952.call(null,G__139953));
})();
var cr139851_place_81 = frontend.worker.rtc.client_op.create_pending_block_ops_count_flow;
var cr139851_place_82 = cr139851_place_8;
var cr139851_place_83 = (function (){var G__139955 = cr139851_place_82;
var fexpr__139954 = cr139851_place_81;
return (fexpr__139954.cljs$core$IFn$_invoke$arity$1 ? fexpr__139954.cljs$core$IFn$_invoke$arity$1(G__139955) : fexpr__139954.call(null,G__139955));
})();
var cr139851_place_84 = frontend.worker.rtc.log_and_state.create_local_AMPERSAND_remote_t_flow;
var cr139851_place_85 = cr139851_place_48;
var cr139851_place_86 = (function (){var G__139957 = cr139851_place_85;
var fexpr__139956 = cr139851_place_84;
return (fexpr__139956.cljs$core$IFn$_invoke$arity$1 ? fexpr__139956.cljs$core$IFn$_invoke$arity$1(G__139957) : fexpr__139956.call(null,G__139957));
})();
var cr139851_place_87 = (function (){var G__139959 = cr139851_place_67;
var G__139960 = cr139851_place_68;
var G__139961 = cr139851_place_71;
var G__139962 = cr139851_place_74;
var G__139963 = cr139851_place_77;
var G__139964 = cr139851_place_80;
var G__139965 = cr139851_place_83;
var G__139966 = cr139851_place_86;
var fexpr__139958 = cr139851_place_66;
return (fexpr__139958.cljs$core$IFn$_invoke$arity$8 ? fexpr__139958.cljs$core$IFn$_invoke$arity$8(G__139959,G__139960,G__139961,G__139962,G__139963,G__139964,G__139965,G__139966) : fexpr__139958.call(null,G__139959,G__139960,G__139961,G__139962,G__139963,G__139964,G__139965,G__139966));
})();
(cr139851_state[(0)] = cr139851_block_14);

(cr139851_state[(1)] = null);

(cr139851_state[(2)] = null);

(cr139851_state[(3)] = null);

(cr139851_state[(4)] = null);

(cr139851_state[(5)] = null);

(cr139851_state[(8)] = null);

(cr139851_state[(9)] = null);

(cr139851_state[(10)] = null);

(cr139851_state[(11)] = null);

(cr139851_state[(12)] = null);

(cr139851_state[(13)] = null);

return missionary.core.switch$(cr139851_place_87);
}catch (e139945){var cr139851_exception = e139945;
(cr139851_state[(0)] = cr139851_block_16);

(cr139851_state[(1)] = null);

(cr139851_state[(2)] = null);

(cr139851_state[(3)] = null);

(cr139851_state[(4)] = null);

(cr139851_state[(5)] = null);

(cr139851_state[(14)] = null);

(cr139851_state[(8)] = null);

(cr139851_state[(9)] = null);

(cr139851_state[(10)] = null);

(cr139851_state[(11)] = null);

(cr139851_state[(12)] = null);

(cr139851_state[(13)] = null);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_21 = (function frontend$worker$rtc$core$cr139851_block_21(cr139851_state){
try{var cr139851_place_49 = (cr139851_state[(6)]);
var cr139851_place_98 = cr139851_place_49;
var cr139851_place_99 = null;
(cr139851_state[(0)] = cr139851_block_22);

(cr139851_state[(1)] = cr139851_place_99);

return cr139851_state;
}catch (e139967){var cr139851_exception = e139967;
(cr139851_state[(0)] = cr139851_block_23);

(cr139851_state[(1)] = null);

(cr139851_state[(7)] = true);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_8 = (function frontend$worker$rtc$core$cr139851_block_8(cr139851_state){
try{var cr139851_place_20 = (cr139851_state[(11)]);
var cr139851_place_63 = cr139851_place_20;
(cr139851_state[(0)] = cr139851_block_9);

(cr139851_state[(17)] = cr139851_place_63);

return cr139851_state;
}catch (e139968){var cr139851_exception = e139968;
(cr139851_state[(0)] = cr139851_block_16);

(cr139851_state[(1)] = null);

(cr139851_state[(2)] = null);

(cr139851_state[(3)] = null);

(cr139851_state[(4)] = null);

(cr139851_state[(5)] = null);

(cr139851_state[(8)] = null);

(cr139851_state[(16)] = null);

(cr139851_state[(9)] = null);

(cr139851_state[(10)] = null);

(cr139851_state[(11)] = null);

(cr139851_state[(14)] = null);

(cr139851_state[(17)] = null);

(cr139851_state[(12)] = null);

(cr139851_state[(13)] = null);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_10 = (function frontend$worker$rtc$core$cr139851_block_10(cr139851_state){
try{var cr139851_place_57 = (cr139851_state[(16)]);
(cr139851_state[(0)] = cr139851_block_11);

(cr139851_state[(16)] = null);

(cr139851_state[(14)] = cr139851_place_57);

return cr139851_state;
}catch (e139969){var cr139851_exception = e139969;
(cr139851_state[(0)] = cr139851_block_16);

(cr139851_state[(1)] = null);

(cr139851_state[(2)] = null);

(cr139851_state[(3)] = null);

(cr139851_state[(4)] = null);

(cr139851_state[(5)] = null);

(cr139851_state[(8)] = null);

(cr139851_state[(16)] = null);

(cr139851_state[(9)] = null);

(cr139851_state[(10)] = null);

(cr139851_state[(11)] = null);

(cr139851_state[(14)] = null);

(cr139851_state[(12)] = null);

(cr139851_state[(13)] = null);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_5 = (function frontend$worker$rtc$core$cr139851_block_5(cr139851_state){
try{var cr139851_place_55 = (cr139851_state[(15)]);
var cr139851_place_58 = cr139851_place_55;
(cr139851_state[(0)] = cr139851_block_10);

(cr139851_state[(15)] = null);

(cr139851_state[(16)] = cr139851_place_58);

return cr139851_state;
}catch (e139970){var cr139851_exception = e139970;
(cr139851_state[(0)] = cr139851_block_16);

(cr139851_state[(1)] = null);

(cr139851_state[(15)] = null);

(cr139851_state[(2)] = null);

(cr139851_state[(3)] = null);

(cr139851_state[(4)] = null);

(cr139851_state[(5)] = null);

(cr139851_state[(8)] = null);

(cr139851_state[(16)] = null);

(cr139851_state[(9)] = null);

(cr139851_state[(10)] = null);

(cr139851_state[(11)] = null);

(cr139851_state[(14)] = null);

(cr139851_state[(12)] = null);

(cr139851_state[(13)] = null);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_19 = (function frontend$worker$rtc$core$cr139851_block_19(cr139851_state){
try{var cr139851_place_49 = (cr139851_state[(6)]);
var cr139851_place_96 = cr139851_place_49;
var cr139851_place_97 = (function(){throw cr139851_place_96})();
(cr139851_state[(0)] = null);

(cr139851_state[(6)] = null);

(cr139851_state[(7)] = null);

return null;
}catch (e139971){var cr139851_exception = e139971;
(cr139851_state[(0)] = cr139851_block_23);

(cr139851_state[(7)] = true);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_23 = (function frontend$worker$rtc$core$cr139851_block_23(cr139851_state){
try{var cr139851_place_49 = (cr139851_state[(6)]);
var cr139851_place_50 = (cr139851_state[(7)]);
var cr139851_place_100 = (cljs.core.truth_(cr139851_place_50)?(function(){throw cr139851_place_49})():cr139851_place_49);
(cr139851_state[(0)] = null);

(cr139851_state[(6)] = null);

(cr139851_state[(7)] = null);

return cr139851_place_100;
}catch (e139972){var cr139851_exception = e139972;
(cr139851_state[(0)] = null);

(cr139851_state[(6)] = null);

(cr139851_state[(7)] = null);

throw cr139851_exception;
}});
var cr139851_block_22 = (function frontend$worker$rtc$core$cr139851_block_22(cr139851_state){
try{var cr139851_place_92 = (cr139851_state[(1)]);
(cr139851_state[(0)] = cr139851_block_23);

(cr139851_state[(1)] = null);

(cr139851_state[(6)] = cr139851_place_92);

return cr139851_state;
}catch (e139973){var cr139851_exception = e139973;
(cr139851_state[(0)] = cr139851_block_23);

(cr139851_state[(1)] = null);

(cr139851_state[(7)] = true);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_14 = (function frontend$worker$rtc$core$cr139851_block_14(cr139851_state){
try{var cr139851_place_88 = missionary.core.unpark();
(cr139851_state[(0)] = cr139851_block_15);

(cr139851_state[(14)] = cr139851_place_88);

return cr139851_state;
}catch (e139974){var cr139851_exception = e139974;
(cr139851_state[(0)] = cr139851_block_16);

(cr139851_state[(14)] = null);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_4 = (function frontend$worker$rtc$core$cr139851_block_4(cr139851_state){
try{var cr139851_place_40 = (cr139851_state[(12)]);
var cr139851_place_55 = cr139851_place_40;
var cr139851_place_56 = cr139851_place_55;
var cr139851_place_57 = null;
if(cljs.core.truth_(cr139851_place_56)){
(cr139851_state[(0)] = cr139851_block_6);

(cr139851_state[(16)] = cr139851_place_57);

return cr139851_state;
} else {
(cr139851_state[(0)] = cr139851_block_5);

(cr139851_state[(15)] = cr139851_place_55);

(cr139851_state[(16)] = cr139851_place_57);

return cr139851_state;
}
}catch (e139975){var cr139851_exception = e139975;
(cr139851_state[(0)] = cr139851_block_16);

(cr139851_state[(1)] = null);

(cr139851_state[(2)] = null);

(cr139851_state[(3)] = null);

(cr139851_state[(4)] = null);

(cr139851_state[(5)] = null);

(cr139851_state[(8)] = null);

(cr139851_state[(9)] = null);

(cr139851_state[(10)] = null);

(cr139851_state[(11)] = null);

(cr139851_state[(14)] = null);

(cr139851_state[(12)] = null);

(cr139851_state[(13)] = null);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_12 = (function frontend$worker$rtc$core$cr139851_block_12(cr139851_state){
try{var cr139851_place_65 = null;
(cr139851_state[(0)] = cr139851_block_15);

(cr139851_state[(14)] = cr139851_place_65);

return cr139851_state;
}catch (e139976){var cr139851_exception = e139976;
(cr139851_state[(0)] = cr139851_block_16);

(cr139851_state[(14)] = null);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_3 = (function frontend$worker$rtc$core$cr139851_block_3(cr139851_state){
try{var cr139851_place_51 = (cr139851_state[(15)]);
var cr139851_place_54 = cr139851_place_51;
(cr139851_state[(0)] = cr139851_block_11);

(cr139851_state[(15)] = null);

(cr139851_state[(14)] = cr139851_place_54);

return cr139851_state;
}catch (e139977){var cr139851_exception = e139977;
(cr139851_state[(0)] = cr139851_block_16);

(cr139851_state[(1)] = null);

(cr139851_state[(2)] = null);

(cr139851_state[(3)] = null);

(cr139851_state[(4)] = null);

(cr139851_state[(5)] = null);

(cr139851_state[(8)] = null);

(cr139851_state[(9)] = null);

(cr139851_state[(10)] = null);

(cr139851_state[(11)] = null);

(cr139851_state[(14)] = null);

(cr139851_state[(15)] = null);

(cr139851_state[(12)] = null);

(cr139851_state[(13)] = null);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_18 = (function frontend$worker$rtc$core$cr139851_block_18(cr139851_state){
try{var cr139851_place_95 = null;
(cr139851_state[(0)] = cr139851_block_20);

(cr139851_state[(2)] = cr139851_place_95);

return cr139851_state;
}catch (e139978){var cr139851_exception = e139978;
(cr139851_state[(0)] = cr139851_block_23);

(cr139851_state[(1)] = null);

(cr139851_state[(2)] = null);

(cr139851_state[(7)] = true);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_17 = (function frontend$worker$rtc$core$cr139851_block_17(cr139851_state){
try{var cr139851_place_93 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr139851_place_94 = null;
if(cljs.core.truth_(cr139851_place_93)){
(cr139851_state[(0)] = cr139851_block_19);

(cr139851_state[(1)] = null);

return cr139851_state;
} else {
(cr139851_state[(0)] = cr139851_block_18);

(cr139851_state[(2)] = cr139851_place_94);

return cr139851_state;
}
}catch (e139979){var cr139851_exception = e139979;
(cr139851_state[(0)] = cr139851_block_23);

(cr139851_state[(1)] = null);

(cr139851_state[(7)] = true);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_2 = (function frontend$worker$rtc$core$cr139851_block_2(cr139851_state){
try{var cr139851_place_8 = (cr139851_state[(13)]);
var cr139851_place_51 = cr139851_place_8;
var cr139851_place_52 = cr139851_place_51;
var cr139851_place_53 = null;
if(cljs.core.truth_(cr139851_place_52)){
(cr139851_state[(0)] = cr139851_block_4);

(cr139851_state[(14)] = cr139851_place_53);

return cr139851_state;
} else {
(cr139851_state[(0)] = cr139851_block_3);

(cr139851_state[(15)] = cr139851_place_51);

(cr139851_state[(14)] = cr139851_place_53);

return cr139851_state;
}
}catch (e139980){var cr139851_exception = e139980;
(cr139851_state[(0)] = cr139851_block_16);

(cr139851_state[(1)] = null);

(cr139851_state[(2)] = null);

(cr139851_state[(3)] = null);

(cr139851_state[(4)] = null);

(cr139851_state[(5)] = null);

(cr139851_state[(8)] = null);

(cr139851_state[(9)] = null);

(cr139851_state[(10)] = null);

(cr139851_state[(11)] = null);

(cr139851_state[(12)] = null);

(cr139851_state[(13)] = null);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_1 = (function frontend$worker$rtc$core$cr139851_block_1(cr139851_state){
try{var cr139851_place_1 = missionary.core.unpark();
var cr139851_place_2 = cljs.core.__destructure_map;
var cr139851_place_3 = cr139851_place_1;
var cr139851_place_4 = (function (){var G__139983 = cr139851_place_3;
var fexpr__139982 = cr139851_place_2;
return (fexpr__139982.cljs$core$IFn$_invoke$arity$1 ? fexpr__139982.cljs$core$IFn$_invoke$arity$1(G__139983) : fexpr__139982.call(null,G__139983));
})();
var cr139851_place_5 = cljs.core.get;
var cr139851_place_6 = cr139851_place_4;
var cr139851_place_7 = new cljs.core.Keyword(null,"repo","repo",-1999060679);
var cr139851_place_8 = (function (){var G__139985 = cr139851_place_6;
var G__139986 = cr139851_place_7;
var fexpr__139984 = cr139851_place_5;
return (fexpr__139984.cljs$core$IFn$_invoke$arity$2 ? fexpr__139984.cljs$core$IFn$_invoke$arity$2(G__139985,G__139986) : fexpr__139984.call(null,G__139985,G__139986));
})();
var cr139851_place_9 = cljs.core.get;
var cr139851_place_10 = cr139851_place_4;
var cr139851_place_11 = new cljs.core.Keyword(null,"user-uuid","user-uuid",-275954048);
var cr139851_place_12 = (function (){var G__139988 = cr139851_place_10;
var G__139989 = cr139851_place_11;
var fexpr__139987 = cr139851_place_9;
return (fexpr__139987.cljs$core$IFn$_invoke$arity$2 ? fexpr__139987.cljs$core$IFn$_invoke$arity$2(G__139988,G__139989) : fexpr__139987.call(null,G__139988,G__139989));
})();
var cr139851_place_13 = cljs.core.get;
var cr139851_place_14 = cr139851_place_4;
var cr139851_place_15 = new cljs.core.Keyword(null,"*rtc-auto-push?","*rtc-auto-push?",-44092416);
var cr139851_place_16 = (function (){var G__139991 = cr139851_place_14;
var G__139992 = cr139851_place_15;
var fexpr__139990 = cr139851_place_13;
return (fexpr__139990.cljs$core$IFn$_invoke$arity$2 ? fexpr__139990.cljs$core$IFn$_invoke$arity$2(G__139991,G__139992) : fexpr__139990.call(null,G__139991,G__139992));
})();
var cr139851_place_17 = cljs.core.get;
var cr139851_place_18 = cr139851_place_4;
var cr139851_place_19 = new cljs.core.Keyword(null,"*rtc-lock","*rtc-lock",-424509809);
var cr139851_place_20 = (function (){var G__139994 = cr139851_place_18;
var G__139995 = cr139851_place_19;
var fexpr__139993 = cr139851_place_17;
return (fexpr__139993.cljs$core$IFn$_invoke$arity$2 ? fexpr__139993.cljs$core$IFn$_invoke$arity$2(G__139994,G__139995) : fexpr__139993.call(null,G__139994,G__139995));
})();
var cr139851_place_21 = cljs.core.get;
var cr139851_place_22 = cr139851_place_4;
var cr139851_place_23 = new cljs.core.Keyword(null,"*rtc-remote-profile?","*rtc-remote-profile?",751419973);
var cr139851_place_24 = (function (){var G__139997 = cr139851_place_22;
var G__139998 = cr139851_place_23;
var fexpr__139996 = cr139851_place_21;
return (fexpr__139996.cljs$core$IFn$_invoke$arity$2 ? fexpr__139996.cljs$core$IFn$_invoke$arity$2(G__139997,G__139998) : fexpr__139996.call(null,G__139997,G__139998));
})();
var cr139851_place_25 = cljs.core.get;
var cr139851_place_26 = cr139851_place_4;
var cr139851_place_27 = new cljs.core.Keyword(null,"local-graph-schema-version","local-graph-schema-version",-211621207);
var cr139851_place_28 = (function (){var G__140000 = cr139851_place_26;
var G__140001 = cr139851_place_27;
var fexpr__139999 = cr139851_place_25;
return (fexpr__139999.cljs$core$IFn$_invoke$arity$2 ? fexpr__139999.cljs$core$IFn$_invoke$arity$2(G__140000,G__140001) : fexpr__139999.call(null,G__140000,G__140001));
})();
var cr139851_place_29 = cljs.core.get;
var cr139851_place_30 = cr139851_place_4;
var cr139851_place_31 = new cljs.core.Keyword(null,"*online-users","*online-users",-1145442647);
var cr139851_place_32 = (function (){var G__140003 = cr139851_place_30;
var G__140004 = cr139851_place_31;
var fexpr__140002 = cr139851_place_29;
return (fexpr__140002.cljs$core$IFn$_invoke$arity$2 ? fexpr__140002.cljs$core$IFn$_invoke$arity$2(G__140003,G__140004) : fexpr__140002.call(null,G__140003,G__140004));
})();
var cr139851_place_33 = cljs.core.get;
var cr139851_place_34 = cr139851_place_4;
var cr139851_place_35 = new cljs.core.Keyword(null,"remote-graph-schema-version","remote-graph-schema-version",-1202898069);
var cr139851_place_36 = (function (){var G__140006 = cr139851_place_34;
var G__140007 = cr139851_place_35;
var fexpr__140005 = cr139851_place_33;
return (fexpr__140005.cljs$core$IFn$_invoke$arity$2 ? fexpr__140005.cljs$core$IFn$_invoke$arity$2(G__140006,G__140007) : fexpr__140005.call(null,G__140006,G__140007));
})();
var cr139851_place_37 = cljs.core.get;
var cr139851_place_38 = cr139851_place_4;
var cr139851_place_39 = new cljs.core.Keyword(null,"rtc-state-flow","rtc-state-flow",553472428);
var cr139851_place_40 = (function (){var G__140009 = cr139851_place_38;
var G__140010 = cr139851_place_39;
var fexpr__140008 = cr139851_place_37;
return (fexpr__140008.cljs$core$IFn$_invoke$arity$2 ? fexpr__140008.cljs$core$IFn$_invoke$arity$2(G__140009,G__140010) : fexpr__140008.call(null,G__140009,G__140010));
})();
var cr139851_place_41 = cljs.core.get;
var cr139851_place_42 = cr139851_place_4;
var cr139851_place_43 = new cljs.core.Keyword(null,"*last-stop-exception","*last-stop-exception",1441670509);
var cr139851_place_44 = (function (){var G__140012 = cr139851_place_42;
var G__140013 = cr139851_place_43;
var fexpr__140011 = cr139851_place_41;
return (fexpr__140011.cljs$core$IFn$_invoke$arity$2 ? fexpr__140011.cljs$core$IFn$_invoke$arity$2(G__140012,G__140013) : fexpr__140011.call(null,G__140012,G__140013));
})();
var cr139851_place_45 = cljs.core.get;
var cr139851_place_46 = cr139851_place_4;
var cr139851_place_47 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr139851_place_48 = (function (){var G__140015 = cr139851_place_46;
var G__140016 = cr139851_place_47;
var fexpr__140014 = cr139851_place_45;
return (fexpr__140014.cljs$core$IFn$_invoke$arity$2 ? fexpr__140014.cljs$core$IFn$_invoke$arity$2(G__140015,G__140016) : fexpr__140014.call(null,G__140015,G__140016));
})();
var cr139851_place_49 = null;
var cr139851_place_50 = false;
(cr139851_state[(0)] = cr139851_block_2);

(cr139851_state[(1)] = cr139851_place_32);

(cr139851_state[(2)] = cr139851_place_36);

(cr139851_state[(3)] = cr139851_place_16);

(cr139851_state[(4)] = cr139851_place_44);

(cr139851_state[(5)] = cr139851_place_28);

(cr139851_state[(6)] = cr139851_place_49);

(cr139851_state[(7)] = cr139851_place_50);

(cr139851_state[(8)] = cr139851_place_48);

(cr139851_state[(9)] = cr139851_place_24);

(cr139851_state[(10)] = cr139851_place_12);

(cr139851_state[(11)] = cr139851_place_20);

(cr139851_state[(12)] = cr139851_place_40);

(cr139851_state[(13)] = cr139851_place_8);

return cr139851_state;
}catch (e139981){var cr139851_exception = e139981;
(cr139851_state[(0)] = null);

throw cr139851_exception;
}});
var cr139851_block_7 = (function frontend$worker$rtc$core$cr139851_block_7(cr139851_state){
try{var cr139851_place_59 = (cr139851_state[(15)]);
var cr139851_place_62 = cr139851_place_59;
(cr139851_state[(0)] = cr139851_block_9);

(cr139851_state[(15)] = null);

(cr139851_state[(17)] = cr139851_place_62);

return cr139851_state;
}catch (e140017){var cr139851_exception = e140017;
(cr139851_state[(0)] = cr139851_block_16);

(cr139851_state[(1)] = null);

(cr139851_state[(2)] = null);

(cr139851_state[(3)] = null);

(cr139851_state[(4)] = null);

(cr139851_state[(5)] = null);

(cr139851_state[(8)] = null);

(cr139851_state[(16)] = null);

(cr139851_state[(9)] = null);

(cr139851_state[(10)] = null);

(cr139851_state[(11)] = null);

(cr139851_state[(15)] = null);

(cr139851_state[(14)] = null);

(cr139851_state[(17)] = null);

(cr139851_state[(12)] = null);

(cr139851_state[(13)] = null);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
var cr139851_block_9 = (function frontend$worker$rtc$core$cr139851_block_9(cr139851_state){
try{var cr139851_place_61 = (cr139851_state[(17)]);
(cr139851_state[(0)] = cr139851_block_10);

(cr139851_state[(17)] = null);

(cr139851_state[(16)] = cr139851_place_61);

return cr139851_state;
}catch (e140018){var cr139851_exception = e140018;
(cr139851_state[(0)] = cr139851_block_16);

(cr139851_state[(1)] = null);

(cr139851_state[(2)] = null);

(cr139851_state[(3)] = null);

(cr139851_state[(4)] = null);

(cr139851_state[(5)] = null);

(cr139851_state[(8)] = null);

(cr139851_state[(16)] = null);

(cr139851_state[(9)] = null);

(cr139851_state[(10)] = null);

(cr139851_state[(11)] = null);

(cr139851_state[(14)] = null);

(cr139851_state[(17)] = null);

(cr139851_state[(12)] = null);

(cr139851_state[(13)] = null);

(cr139851_state[(6)] = cr139851_exception);

return cr139851_state;
}});
return cloroutine.impl.coroutine((function (){var G__140019 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((18));
(G__140019[(0)] = cr139851_block_0);

return G__140019;
})());
})(),missionary.core.ap_run);
})();
frontend.worker.rtc.core.create_get_state_flow = frontend.common.missionary.throttle((300),frontend.worker.rtc.core.create_get_state_flow_STAR_);
frontend.worker.rtc.core.new_task__get_debug_state = (function frontend$worker$rtc$core$new_task__get_debug_state(){
return frontend.common.missionary.snapshot_of_flow(frontend.worker.rtc.core.create_get_state_flow);
});
frontend.worker.rtc.core.new_task__upload_graph = (function frontend$worker$rtc$core$new_task__upload_graph(token,repo,remote_graph_name){
var map__140020 = (function (){var temp__5802__auto__ = frontend.worker.state.get_datascript_conn(repo);
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
var map__140020__$1 = cljs.core.__destructure_map(map__140020);
var r = map__140020__$1;
var conn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140020__$1,new cljs.core.Keyword(null,"conn","conn",278309663));
var schema_version = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140020__$1,new cljs.core.Keyword(null,"schema-version","schema-version",1117939594));
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr140021_block_0 = (function frontend$worker$rtc$core$new_task__upload_graph_$_cr140021_block_0(cr140021_state){
try{var cr140021_place_0 = r;
var cr140021_place_1 = cljs.core.ExceptionInfo;
var cr140021_place_2 = (cr140021_place_0 instanceof cr140021_place_1);
var cr140021_place_3 = null;
if(cr140021_place_2){
(cr140021_state[(0)] = cr140021_block_3);

(cr140021_state[(1)] = cr140021_place_3);

return cr140021_state;
} else {
(cr140021_state[(0)] = cr140021_block_1);

(cr140021_state[(1)] = cr140021_place_3);

return cr140021_state;
}
}catch (e140045){var cr140021_exception = e140045;
(cr140021_state[(0)] = null);

throw cr140021_exception;
}});
var cr140021_block_1 = (function frontend$worker$rtc$core$new_task__upload_graph_$_cr140021_block_1(cr140021_state){
try{var cr140021_place_4 = logseq.db.frontend.schema.major_version;
var cr140021_place_5 = schema_version;
var cr140021_place_6 = (function (){var G__140048 = cr140021_place_5;
var fexpr__140047 = cr140021_place_4;
return (fexpr__140047.cljs$core$IFn$_invoke$arity$1 ? fexpr__140047.cljs$core$IFn$_invoke$arity$1(G__140048) : fexpr__140047.call(null,G__140048));
})();
var cr140021_place_7 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized;
var cr140021_place_8 = frontend.worker.rtc.ws_util.get_ws_url;
var cr140021_place_9 = token;
var cr140021_place_10 = (function (){var G__140050 = cr140021_place_9;
var fexpr__140049 = cr140021_place_8;
return (fexpr__140049.cljs$core$IFn$_invoke$arity$1 ? fexpr__140049.cljs$core$IFn$_invoke$arity$1(G__140050) : fexpr__140049.call(null,G__140050));
})();
var cr140021_place_11 = cr140021_place_7(cr140021_place_10);
var cr140021_place_12 = cljs.core.__destructure_map;
var cr140021_place_13 = cr140021_place_11;
var cr140021_place_14 = (function (){var G__140052 = cr140021_place_13;
var fexpr__140051 = cr140021_place_12;
return (fexpr__140051.cljs$core$IFn$_invoke$arity$1 ? fexpr__140051.cljs$core$IFn$_invoke$arity$1(G__140052) : fexpr__140051.call(null,G__140052));
})();
var cr140021_place_15 = cljs.core.get;
var cr140021_place_16 = cr140021_place_14;
var cr140021_place_17 = new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002);
var cr140021_place_18 = (function (){var G__140054 = cr140021_place_16;
var G__140055 = cr140021_place_17;
var fexpr__140053 = cr140021_place_15;
return (fexpr__140053.cljs$core$IFn$_invoke$arity$2 ? fexpr__140053.cljs$core$IFn$_invoke$arity$2(G__140054,G__140055) : fexpr__140053.call(null,G__140054,G__140055));
})();
var cr140021_place_19 = frontend.worker.rtc.full_upload_download_graph.new_task__upload_graph;
var cr140021_place_20 = cr140021_place_18;
var cr140021_place_21 = repo;
var cr140021_place_22 = conn;
var cr140021_place_23 = remote_graph_name;
var cr140021_place_24 = cr140021_place_6;
var cr140021_place_25 = (function (){var G__140057 = cr140021_place_20;
var G__140058 = cr140021_place_21;
var G__140059 = cr140021_place_22;
var G__140060 = cr140021_place_23;
var G__140061 = cr140021_place_24;
var fexpr__140056 = cr140021_place_19;
return (fexpr__140056.cljs$core$IFn$_invoke$arity$5 ? fexpr__140056.cljs$core$IFn$_invoke$arity$5(G__140057,G__140058,G__140059,G__140060,G__140061) : fexpr__140056.call(null,G__140057,G__140058,G__140059,G__140060,G__140061));
})();
(cr140021_state[(0)] = cr140021_block_2);

return missionary.core.park(cr140021_place_25);
}catch (e140046){var cr140021_exception = e140046;
(cr140021_state[(0)] = null);

(cr140021_state[(1)] = null);

throw cr140021_exception;
}});
var cr140021_block_2 = (function frontend$worker$rtc$core$new_task__upload_graph_$_cr140021_block_2(cr140021_state){
try{var cr140021_place_26 = missionary.core.unpark();
(cr140021_state[(0)] = cr140021_block_4);

(cr140021_state[(1)] = cr140021_place_26);

return cr140021_state;
}catch (e140062){var cr140021_exception = e140062;
(cr140021_state[(0)] = null);

(cr140021_state[(1)] = null);

throw cr140021_exception;
}});
var cr140021_block_3 = (function frontend$worker$rtc$core$new_task__upload_graph_$_cr140021_block_3(cr140021_state){
try{var cr140021_place_27 = frontend.worker.rtc.exception.__GT_map;
var cr140021_place_28 = r;
var cr140021_place_29 = (function (){var G__140065 = cr140021_place_28;
var fexpr__140064 = cr140021_place_27;
return (fexpr__140064.cljs$core$IFn$_invoke$arity$1 ? fexpr__140064.cljs$core$IFn$_invoke$arity$1(G__140065) : fexpr__140064.call(null,G__140065));
})();
(cr140021_state[(0)] = cr140021_block_4);

(cr140021_state[(1)] = cr140021_place_29);

return cr140021_state;
}catch (e140063){var cr140021_exception = e140063;
(cr140021_state[(0)] = null);

(cr140021_state[(1)] = null);

throw cr140021_exception;
}});
var cr140021_block_4 = (function frontend$worker$rtc$core$new_task__upload_graph_$_cr140021_block_4(cr140021_state){
try{var cr140021_place_3 = (cr140021_state[(1)]);
(cr140021_state[(0)] = null);

(cr140021_state[(1)] = null);

return cr140021_place_3;
}catch (e140066){var cr140021_exception = e140066;
(cr140021_state[(0)] = null);

(cr140021_state[(1)] = null);

throw cr140021_exception;
}});
return cloroutine.impl.coroutine((function (){var G__140067 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((2));
(G__140067[(0)] = cr140021_block_0);

return G__140067;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.core.new_task__branch_graph = (function frontend$worker$rtc$core$new_task__branch_graph(token,repo){
var map__140068 = (function (){var temp__5802__auto__ = frontend.worker.state.get_datascript_conn(repo);
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
var map__140068__$1 = cljs.core.__destructure_map(map__140068);
var r = map__140068__$1;
var conn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140068__$1,new cljs.core.Keyword(null,"conn","conn",278309663));
var graph_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140068__$1,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522));
var schema_version = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140068__$1,new cljs.core.Keyword(null,"schema-version","schema-version",1117939594));
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr140069_block_0 = (function frontend$worker$rtc$core$new_task__branch_graph_$_cr140069_block_0(cr140069_state){
try{var cr140069_place_0 = r;
var cr140069_place_1 = cljs.core.ExceptionInfo;
var cr140069_place_2 = (cr140069_place_0 instanceof cr140069_place_1);
var cr140069_place_3 = null;
if(cr140069_place_2){
(cr140069_state[(0)] = cr140069_block_3);

(cr140069_state[(1)] = cr140069_place_3);

return cr140069_state;
} else {
(cr140069_state[(0)] = cr140069_block_1);

(cr140069_state[(1)] = cr140069_place_3);

return cr140069_state;
}
}catch (e140093){var cr140069_exception = e140093;
(cr140069_state[(0)] = null);

throw cr140069_exception;
}});
var cr140069_block_1 = (function frontend$worker$rtc$core$new_task__branch_graph_$_cr140069_block_1(cr140069_state){
try{var cr140069_place_4 = logseq.db.frontend.schema.major_version;
var cr140069_place_5 = schema_version;
var cr140069_place_6 = (function (){var G__140096 = cr140069_place_5;
var fexpr__140095 = cr140069_place_4;
return (fexpr__140095.cljs$core$IFn$_invoke$arity$1 ? fexpr__140095.cljs$core$IFn$_invoke$arity$1(G__140096) : fexpr__140095.call(null,G__140096));
})();
var cr140069_place_7 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized;
var cr140069_place_8 = frontend.worker.rtc.ws_util.get_ws_url;
var cr140069_place_9 = token;
var cr140069_place_10 = (function (){var G__140098 = cr140069_place_9;
var fexpr__140097 = cr140069_place_8;
return (fexpr__140097.cljs$core$IFn$_invoke$arity$1 ? fexpr__140097.cljs$core$IFn$_invoke$arity$1(G__140098) : fexpr__140097.call(null,G__140098));
})();
var cr140069_place_11 = cr140069_place_7(cr140069_place_10);
var cr140069_place_12 = cljs.core.__destructure_map;
var cr140069_place_13 = cr140069_place_11;
var cr140069_place_14 = (function (){var G__140100 = cr140069_place_13;
var fexpr__140099 = cr140069_place_12;
return (fexpr__140099.cljs$core$IFn$_invoke$arity$1 ? fexpr__140099.cljs$core$IFn$_invoke$arity$1(G__140100) : fexpr__140099.call(null,G__140100));
})();
var cr140069_place_15 = cljs.core.get;
var cr140069_place_16 = cr140069_place_14;
var cr140069_place_17 = new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002);
var cr140069_place_18 = (function (){var G__140102 = cr140069_place_16;
var G__140103 = cr140069_place_17;
var fexpr__140101 = cr140069_place_15;
return (fexpr__140101.cljs$core$IFn$_invoke$arity$2 ? fexpr__140101.cljs$core$IFn$_invoke$arity$2(G__140102,G__140103) : fexpr__140101.call(null,G__140102,G__140103));
})();
var cr140069_place_19 = frontend.worker.rtc.full_upload_download_graph.new_task__branch_graph;
var cr140069_place_20 = cr140069_place_18;
var cr140069_place_21 = repo;
var cr140069_place_22 = conn;
var cr140069_place_23 = graph_uuid;
var cr140069_place_24 = cr140069_place_6;
var cr140069_place_25 = (function (){var G__140105 = cr140069_place_20;
var G__140106 = cr140069_place_21;
var G__140107 = cr140069_place_22;
var G__140108 = cr140069_place_23;
var G__140109 = cr140069_place_24;
var fexpr__140104 = cr140069_place_19;
return (fexpr__140104.cljs$core$IFn$_invoke$arity$5 ? fexpr__140104.cljs$core$IFn$_invoke$arity$5(G__140105,G__140106,G__140107,G__140108,G__140109) : fexpr__140104.call(null,G__140105,G__140106,G__140107,G__140108,G__140109));
})();
(cr140069_state[(0)] = cr140069_block_2);

return missionary.core.park(cr140069_place_25);
}catch (e140094){var cr140069_exception = e140094;
(cr140069_state[(0)] = null);

(cr140069_state[(1)] = null);

throw cr140069_exception;
}});
var cr140069_block_2 = (function frontend$worker$rtc$core$new_task__branch_graph_$_cr140069_block_2(cr140069_state){
try{var cr140069_place_26 = missionary.core.unpark();
(cr140069_state[(0)] = cr140069_block_4);

(cr140069_state[(1)] = cr140069_place_26);

return cr140069_state;
}catch (e140110){var cr140069_exception = e140110;
(cr140069_state[(0)] = null);

(cr140069_state[(1)] = null);

throw cr140069_exception;
}});
var cr140069_block_3 = (function frontend$worker$rtc$core$new_task__branch_graph_$_cr140069_block_3(cr140069_state){
try{var cr140069_place_27 = frontend.worker.rtc.exception.__GT_map;
var cr140069_place_28 = r;
var cr140069_place_29 = (function (){var G__140113 = cr140069_place_28;
var fexpr__140112 = cr140069_place_27;
return (fexpr__140112.cljs$core$IFn$_invoke$arity$1 ? fexpr__140112.cljs$core$IFn$_invoke$arity$1(G__140113) : fexpr__140112.call(null,G__140113));
})();
(cr140069_state[(0)] = cr140069_block_4);

(cr140069_state[(1)] = cr140069_place_29);

return cr140069_state;
}catch (e140111){var cr140069_exception = e140111;
(cr140069_state[(0)] = null);

(cr140069_state[(1)] = null);

throw cr140069_exception;
}});
var cr140069_block_4 = (function frontend$worker$rtc$core$new_task__branch_graph_$_cr140069_block_4(cr140069_state){
try{var cr140069_place_3 = (cr140069_state[(1)]);
(cr140069_state[(0)] = null);

(cr140069_state[(1)] = null);

return cr140069_place_3;
}catch (e140114){var cr140069_exception = e140114;
(cr140069_state[(0)] = null);

(cr140069_state[(1)] = null);

throw cr140069_exception;
}});
return cloroutine.impl.coroutine((function (){var G__140115 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((2));
(G__140115[(0)] = cr140069_block_0);

return G__140115;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.core.new_task__request_download_graph = (function frontend$worker$rtc$core$new_task__request_download_graph(token,graph_uuid,schema_version){
var map__140116 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized(frontend.worker.rtc.ws_util.get_ws_url(token));
var map__140116__$1 = cljs.core.__destructure_map(map__140116);
var get_ws_create_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140116__$1,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002));
return frontend.worker.rtc.full_upload_download_graph.new_task__request_download_graph(get_ws_create_task,graph_uuid,schema_version);
});
frontend.worker.rtc.core.new_task__wait_download_info_ready = (function frontend$worker$rtc$core$new_task__wait_download_info_ready(token,download_info_uuid,graph_uuid,schema_version,timeout_ms){
var map__140117 = frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized(frontend.worker.rtc.ws_util.get_ws_url(token));
var map__140117__$1 = cljs.core.__destructure_map(map__140117);
var get_ws_create_task = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__140117__$1,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002));
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
