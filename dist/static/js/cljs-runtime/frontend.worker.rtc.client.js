goog.provide('frontend.worker.rtc.client');
frontend.worker.rtc.client.new_task__register_graph_updates = (function frontend$worker$rtc$client$new_task__register_graph_updates(get_ws_create_task,graph_uuid,major_schema_version,repo){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr105538_block_2 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr105538_block_2(cr105538_state){
try{var cr105538_place_13 = missionary.core.unpark();
var cr105538_place_14 = cljs.core.__destructure_map;
var cr105538_place_15 = cr105538_place_13;
var cr105538_place_16 = (function (){var G__105658 = cr105538_place_15;
var fexpr__105657 = cr105538_place_14;
return (fexpr__105657.cljs$core$IFn$_invoke$arity$1 ? fexpr__105657.cljs$core$IFn$_invoke$arity$1(G__105658) : fexpr__105657.call(null,G__105658));
})();
var cr105538_place_17 = cr105538_place_16;
var cr105538_place_18 = cljs.core.get;
var cr105538_place_19 = cr105538_place_16;
var cr105538_place_20 = new cljs.core.Keyword(null,"t","t",-1397832519);
var cr105538_place_21 = (function (){var G__105660 = cr105538_place_19;
var G__105661 = cr105538_place_20;
var fexpr__105659 = cr105538_place_18;
return (fexpr__105659.cljs$core$IFn$_invoke$arity$2 ? fexpr__105659.cljs$core$IFn$_invoke$arity$2(G__105660,G__105661) : fexpr__105659.call(null,G__105660,G__105661));
})();
var cr105538_place_22 = frontend.worker.rtc.log_and_state.update_remote_t;
var cr105538_place_23 = graph_uuid;
var cr105538_place_24 = cr105538_place_21;
var cr105538_place_25 = (function (){var G__105665 = cr105538_place_23;
var G__105666 = cr105538_place_24;
var fexpr__105664 = cr105538_place_22;
return (fexpr__105664.cljs$core$IFn$_invoke$arity$2 ? fexpr__105664.cljs$core$IFn$_invoke$arity$2(G__105665,G__105666) : fexpr__105664.call(null,G__105665,G__105666));
})();
var cr105538_place_26 = frontend.worker.rtc.client_op.get_local_tx;
var cr105538_place_27 = repo;
var cr105538_place_28 = (function (){var G__105671 = cr105538_place_27;
var fexpr__105670 = cr105538_place_26;
return (fexpr__105670.cljs$core$IFn$_invoke$arity$1 ? fexpr__105670.cljs$core$IFn$_invoke$arity$1(G__105671) : fexpr__105670.call(null,G__105671));
})();
var cr105538_place_29 = null;
if(cljs.core.truth_(cr105538_place_28)){
(cr105538_state[(0)] = cr105538_block_4);

(cr105538_state[(3)] = cr105538_place_29);

(cr105538_state[(5)] = cr105538_place_17);

return cr105538_state;
} else {
(cr105538_state[(0)] = cr105538_block_3);

(cr105538_state[(3)] = cr105538_place_29);

(cr105538_state[(4)] = cr105538_place_21);

(cr105538_state[(5)] = cr105538_place_17);

return cr105538_state;
}
}catch (e105656){var cr105538_exception = e105656;
(cr105538_state[(0)] = cr105538_block_6);

(cr105538_state[(2)] = cr105538_exception);

return cr105538_state;
}});
var cr105538_block_9 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr105538_block_9(cr105538_state){
try{var cr105538_place_1 = (cr105538_state[(1)]);
var cr105538_place_0 = (cr105538_state[(2)]);
var cr105538_place_56 = (cljs.core.truth_(cr105538_place_1)?(function(){throw cr105538_place_0})():cr105538_place_0);
(cr105538_state[(0)] = null);

(cr105538_state[(1)] = null);

(cr105538_state[(2)] = null);

return cr105538_place_56;
}catch (e105678){var cr105538_exception = e105678;
(cr105538_state[(0)] = null);

(cr105538_state[(1)] = null);

(cr105538_state[(2)] = null);

throw cr105538_exception;
}});
var cr105538_block_8 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr105538_block_8(cr105538_state){
try{var cr105538_place_36 = (cr105538_state[(3)]);
var cr105538_place_48 = cljs.core.ex_info;
var cr105538_place_49 = "remote graph is still creating";
var cr105538_place_50 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr105538_place_51 = true;
var cr105538_place_52 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr105538_place_50,cr105538_place_51]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr105538_place_53 = cr105538_place_36;
var cr105538_place_54 = (function (){var G__105689 = cr105538_place_49;
var G__105690 = cr105538_place_52;
var G__105691 = cr105538_place_53;
var fexpr__105688 = cr105538_place_48;
return (fexpr__105688.cljs$core$IFn$_invoke$arity$3 ? fexpr__105688.cljs$core$IFn$_invoke$arity$3(G__105689,G__105690,G__105691) : fexpr__105688.call(null,G__105689,G__105690,G__105691));
})();
var cr105538_place_55 = (function(){throw cr105538_place_54})();
(cr105538_state[(0)] = null);

(cr105538_state[(3)] = null);

(cr105538_state[(1)] = null);

(cr105538_state[(2)] = null);

return null;
}catch (e105681){var cr105538_exception = e105681;
(cr105538_state[(0)] = cr105538_block_9);

(cr105538_state[(3)] = null);

(cr105538_state[(1)] = true);

(cr105538_state[(2)] = cr105538_exception);

return cr105538_state;
}});
var cr105538_block_4 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr105538_block_4(cr105538_state){
try{var cr105538_place_34 = null;
(cr105538_state[(0)] = cr105538_block_5);

(cr105538_state[(3)] = cr105538_place_34);

return cr105538_state;
}catch (e105697){var cr105538_exception = e105697;
(cr105538_state[(0)] = cr105538_block_6);

(cr105538_state[(3)] = null);

(cr105538_state[(5)] = null);

(cr105538_state[(2)] = cr105538_exception);

return cr105538_state;
}});
var cr105538_block_3 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr105538_block_3(cr105538_state){
try{var cr105538_place_21 = (cr105538_state[(4)]);
var cr105538_place_30 = frontend.worker.rtc.client_op.update_local_tx;
var cr105538_place_31 = repo;
var cr105538_place_32 = cr105538_place_21;
var cr105538_place_33 = (function (){var G__105703 = cr105538_place_31;
var G__105704 = cr105538_place_32;
var fexpr__105702 = cr105538_place_30;
return (fexpr__105702.cljs$core$IFn$_invoke$arity$2 ? fexpr__105702.cljs$core$IFn$_invoke$arity$2(G__105703,G__105704) : fexpr__105702.call(null,G__105703,G__105704));
})();
(cr105538_state[(0)] = cr105538_block_5);

(cr105538_state[(4)] = null);

(cr105538_state[(3)] = cr105538_place_33);

return cr105538_state;
}catch (e105701){var cr105538_exception = e105701;
(cr105538_state[(0)] = cr105538_block_6);

(cr105538_state[(3)] = null);

(cr105538_state[(4)] = null);

(cr105538_state[(5)] = null);

(cr105538_state[(2)] = cr105538_exception);

return cr105538_state;
}});
var cr105538_block_1 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr105538_block_1(cr105538_state){
try{var cr105538_place_2 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr105538_place_3 = get_ws_create_task;
var cr105538_place_4 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr105538_place_5 = "register-graph-updates";
var cr105538_place_6 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr105538_place_7 = graph_uuid;
var cr105538_place_8 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr105538_place_9 = major_schema_version;
var cr105538_place_10 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr105538_place_9);
var cr105538_place_11 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr105538_place_4,cr105538_place_5,cr105538_place_6,cr105538_place_7,cr105538_place_8,cr105538_place_10]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr105538_place_12 = (function (){var G__105707 = cr105538_place_3;
var G__105708 = cr105538_place_11;
var fexpr__105706 = cr105538_place_2;
return (fexpr__105706.cljs$core$IFn$_invoke$arity$2 ? fexpr__105706.cljs$core$IFn$_invoke$arity$2(G__105707,G__105708) : fexpr__105706.call(null,G__105707,G__105708));
})();
(cr105538_state[(0)] = cr105538_block_2);

return missionary.core.park(cr105538_place_12);
}catch (e105705){var cr105538_exception = e105705;
(cr105538_state[(0)] = cr105538_block_6);

(cr105538_state[(2)] = cr105538_exception);

return cr105538_state;
}});
var cr105538_block_7 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr105538_block_7(cr105538_state){
try{var cr105538_place_36 = (cr105538_state[(3)]);
var cr105538_place_46 = cr105538_place_36;
var cr105538_place_47 = (function(){throw cr105538_place_46})();
(cr105538_state[(0)] = null);

(cr105538_state[(3)] = null);

(cr105538_state[(1)] = null);

(cr105538_state[(2)] = null);

return null;
}catch (e105709){var cr105538_exception = e105709;
(cr105538_state[(0)] = cr105538_block_9);

(cr105538_state[(3)] = null);

(cr105538_state[(1)] = true);

(cr105538_state[(2)] = cr105538_exception);

return cr105538_state;
}});
var cr105538_block_0 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr105538_block_0(cr105538_state){
try{var cr105538_place_0 = null;
var cr105538_place_1 = false;
(cr105538_state[(0)] = cr105538_block_1);

(cr105538_state[(2)] = cr105538_place_0);

(cr105538_state[(1)] = cr105538_place_1);

return cr105538_state;
}catch (e105710){var cr105538_exception = e105710;
(cr105538_state[(0)] = null);

throw cr105538_exception;
}});
var cr105538_block_6 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr105538_block_6(cr105538_state){
try{var cr105538_place_0 = (cr105538_state[(2)]);
var cr105538_place_36 = cr105538_place_0;
var cr105538_place_37 = cljs.core._EQ_;
var cr105538_place_38 = new cljs.core.Keyword("rtc.exception","remote-graph-not-ready","rtc.exception/remote-graph-not-ready",980605069);
var cr105538_place_39 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr105538_place_40 = cljs.core.ex_data;
var cr105538_place_41 = cr105538_place_36;
var cr105538_place_42 = (function (){var G__105713 = cr105538_place_41;
var fexpr__105712 = cr105538_place_40;
return (fexpr__105712.cljs$core$IFn$_invoke$arity$1 ? fexpr__105712.cljs$core$IFn$_invoke$arity$1(G__105713) : fexpr__105712.call(null,G__105713));
})();
var cr105538_place_43 = cr105538_place_39.cljs$core$IFn$_invoke$arity$1(cr105538_place_42);
var cr105538_place_44 = (function (){var G__105715 = cr105538_place_38;
var G__105716 = cr105538_place_43;
var fexpr__105714 = cr105538_place_37;
return (fexpr__105714.cljs$core$IFn$_invoke$arity$2 ? fexpr__105714.cljs$core$IFn$_invoke$arity$2(G__105715,G__105716) : fexpr__105714.call(null,G__105715,G__105716));
})();
var cr105538_place_45 = null;
if(cljs.core.truth_(cr105538_place_44)){
(cr105538_state[(0)] = cr105538_block_8);

(cr105538_state[(3)] = cr105538_place_36);

return cr105538_state;
} else {
(cr105538_state[(0)] = cr105538_block_7);

(cr105538_state[(3)] = cr105538_place_36);

return cr105538_state;
}
}catch (e105711){var cr105538_exception = e105711;
(cr105538_state[(0)] = cr105538_block_9);

(cr105538_state[(1)] = true);

(cr105538_state[(2)] = cr105538_exception);

return cr105538_state;
}});
var cr105538_block_5 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr105538_block_5(cr105538_state){
try{var cr105538_place_29 = (cr105538_state[(3)]);
var cr105538_place_17 = (cr105538_state[(5)]);
var cr105538_place_35 = cr105538_place_17;
(cr105538_state[(0)] = cr105538_block_9);

(cr105538_state[(3)] = null);

(cr105538_state[(5)] = null);

(cr105538_state[(2)] = cr105538_place_35);

return cr105538_state;
}catch (e105717){var cr105538_exception = e105717;
(cr105538_state[(0)] = cr105538_block_6);

(cr105538_state[(3)] = null);

(cr105538_state[(5)] = null);

(cr105538_state[(2)] = cr105538_exception);

return cr105538_state;
}});
return cloroutine.impl.coroutine((function (){var G__105718 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((6));
(G__105718[(0)] = cr105538_block_0);

return G__105718;
})());
})(),missionary.core.sp_run);
});
/**
 * Return a task: get or create a mws(missionary wrapped websocket).
 *   see also `ws/get-mws-create`.
 *   But ensure `register-graph-updates` and `calibrate-graph-skeleton` has been sent
 */
frontend.worker.rtc.client.ensure_register_graph_updates_STAR_ = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR_(get_ws_create_task,graph_uuid,major_schema_version,repo,conn,_STAR_last_calibrate_t,_STAR_online_users,_STAR_server_schema_version,add_log_fn){
if((!((graph_uuid == null)))){
} else {
throw (new Error("Assert failed: (some? graph-uuid)"));
}

var _STAR_sent = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr105719_block_7 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr105719_block_7(cr105719_state){
try{var cr105719_place_26 = (cr105719_state[(3)]);
var cr105719_place_28 = missionary.core.unpark();
var cr105719_place_29 = (function (){var G__105892 = cr105719_place_28;
var fexpr__105891 = cr105719_place_26;
return (fexpr__105891.cljs$core$IFn$_invoke$arity$1 ? fexpr__105891.cljs$core$IFn$_invoke$arity$1(G__105892) : fexpr__105891.call(null,G__105892));
})();
var cr105719_place_30 = frontend.common.missionary.run_task;
var cr105719_place_31 = new cljs.core.Keyword(null,"update-online-user-when-register-graph-updates","update-online-user-when-register-graph-updates",1053542827);
var cr105719_place_32 = cljs.core.partial;
var cr105719_place_33 = (function (cr105721_state){
try{var cr105721_place_0 = new cljs.core.Keyword(null,"online-users","online-users",-747563810);
var cr105721_place_1 = missionary.core.timeout;
var cr105721_place_2 = missionary.core.reduce;
var cr105721_place_3 = (function (_,v){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("online-users-updated",new cljs.core.Keyword(null,"req-id","req-id",-471642231).cljs$core$IFn$_invoke$arity$1(v))){
return cljs.core.reduced(v);
} else {
return null;
}
});
var cr105721_place_4 = cr105719_place_29;
var cr105721_place_5 = (function (){var G__105738 = cr105721_place_3;
var G__105739 = cr105721_place_4;
var fexpr__105737 = cr105721_place_2;
var G__105909 = G__105738;
var G__105910 = G__105739;
var fexpr__105908 = fexpr__105737;
return (fexpr__105908.cljs$core$IFn$_invoke$arity$2 ? fexpr__105908.cljs$core$IFn$_invoke$arity$2(G__105909,G__105910) : fexpr__105908.call(null,G__105909,G__105910));
})();
var cr105721_place_6 = (10000);
var cr105721_place_7 = (function (){var G__105741 = cr105721_place_5;
var G__105742 = cr105721_place_6;
var fexpr__105740 = cr105721_place_1;
var G__105912 = G__105741;
var G__105913 = G__105742;
var fexpr__105911 = fexpr__105740;
return (fexpr__105911.cljs$core$IFn$_invoke$arity$2 ? fexpr__105911.cljs$core$IFn$_invoke$arity$2(G__105912,G__105913) : fexpr__105911.call(null,G__105912,G__105913));
})();
(cr105721_state[(0)] = cr105719_place_34);

(cr105721_state[(1)] = cr105721_place_0);

return missionary.core.park(cr105721_place_7);
}catch (e105907){var e105736 = e105907;
var cr105721_exception = e105736;
(cr105721_state[(0)] = null);

throw cr105721_exception;
}});
var cr105719_place_34 = (function (cr105721_state){
try{var cr105721_place_0 = (cr105721_state[(1)]);
var cr105721_place_8 = missionary.core.unpark();
var cr105721_place_9 = cr105721_place_0.cljs$core$IFn$_invoke$arity$1(cr105721_place_8);
var cr105721_place_10 = cr105721_place_9;
var cr105721_place_11 = null;
if(cljs.core.truth_(cr105721_place_10)){
(cr105721_state[(0)] = cr105719_place_36);

(cr105721_state[(1)] = null);

(cr105721_state[(2)] = cr105721_place_9);

(cr105721_state[(1)] = cr105721_place_11);

return cr105721_state;
} else {
(cr105721_state[(0)] = cr105719_place_35);

(cr105721_state[(1)] = null);

(cr105721_state[(1)] = cr105721_place_11);

return cr105721_state;
}
}catch (e105914){var e105743 = e105914;
var cr105721_exception = e105743;
(cr105721_state[(0)] = null);

(cr105721_state[(1)] = null);

throw cr105721_exception;
}});
var cr105719_place_35 = (function (cr105721_state){
try{var cr105721_place_12 = null;
(cr105721_state[(0)] = cr105719_place_37);

(cr105721_state[(1)] = cr105721_place_12);

return cr105721_state;
}catch (e105915){var e105744 = e105915;
var cr105721_exception = e105744;
(cr105721_state[(0)] = null);

(cr105721_state[(1)] = null);

throw cr105721_exception;
}});
var cr105719_place_36 = (function (cr105721_state){
try{var cr105721_place_9 = (cr105721_state[(2)]);
var cr105721_place_13 = cr105721_place_9;
var cr105721_place_14 = cljs.core.reset_BANG_;
var cr105721_place_15 = _STAR_online_users;
var cr105721_place_16 = cr105721_place_13;
var cr105721_place_17 = (function (){var G__105747 = cr105721_place_15;
var G__105748 = cr105721_place_16;
var fexpr__105746 = cr105721_place_14;
var G__105918 = G__105747;
var G__105919 = G__105748;
var fexpr__105917 = fexpr__105746;
return (fexpr__105917.cljs$core$IFn$_invoke$arity$2 ? fexpr__105917.cljs$core$IFn$_invoke$arity$2(G__105918,G__105919) : fexpr__105917.call(null,G__105918,G__105919));
})();
(cr105721_state[(0)] = cr105719_place_37);

(cr105721_state[(2)] = null);

(cr105721_state[(1)] = cr105721_place_17);

return cr105721_state;
}catch (e105916){var e105745 = e105916;
var cr105721_exception = e105745;
(cr105721_state[(0)] = null);

(cr105721_state[(2)] = null);

(cr105721_state[(1)] = null);

throw cr105721_exception;
}});
var cr105719_place_37 = (function (cr105721_state){
try{var cr105721_place_11 = (cr105721_state[(1)]);
(cr105721_state[(0)] = null);

(cr105721_state[(1)] = null);

return cr105721_place_11;
}catch (e105920){var e105749 = e105920;
var cr105721_exception = e105749;
(cr105721_state[(0)] = null);

(cr105721_state[(1)] = null);

throw cr105721_exception;
}});
var cr105719_place_38 = cloroutine.impl.coroutine;
var cr105719_place_39 = cljs.core.object_array;
var cr105719_place_40 = (3);
var cr105719_place_41 = (function (){var G__105922 = cr105719_place_40;
var fexpr__105921 = cr105719_place_39;
return (fexpr__105921.cljs$core$IFn$_invoke$arity$1 ? fexpr__105921.cljs$core$IFn$_invoke$arity$1(G__105922) : fexpr__105921.call(null,G__105922));
})();
var cr105719_place_42 = cr105719_place_41;
var cr105719_place_43 = (0);
var cr105719_place_44 = cr105719_place_33;
var cr105719_place_45 = (cr105719_place_42[cr105719_place_43] = cr105719_place_44);
var cr105719_place_46 = cr105719_place_41;
var cr105719_place_47 = (function (){var G__105924 = cr105719_place_46;
var fexpr__105923 = cr105719_place_38;
return (fexpr__105923.cljs$core$IFn$_invoke$arity$1 ? fexpr__105923.cljs$core$IFn$_invoke$arity$1(G__105924) : fexpr__105923.call(null,G__105924));
})();
var cr105719_place_48 = missionary.core.sp_run;
var cr105719_place_49 = (function (){var G__105926 = cr105719_place_47;
var G__105927 = cr105719_place_48;
var fexpr__105925 = cr105719_place_32;
return (fexpr__105925.cljs$core$IFn$_invoke$arity$2 ? fexpr__105925.cljs$core$IFn$_invoke$arity$2(G__105926,G__105927) : fexpr__105925.call(null,G__105926,G__105927));
})();
var cr105719_place_50 = new cljs.core.Keyword(null,"succ","succ",1386276271);
var cr105719_place_51 = cljs.core.constantly;
var cr105719_place_52 = null;
var cr105719_place_53 = (function (){var G__105929 = cr105719_place_52;
var fexpr__105928 = cr105719_place_51;
return (fexpr__105928.cljs$core$IFn$_invoke$arity$1 ? fexpr__105928.cljs$core$IFn$_invoke$arity$1(G__105929) : fexpr__105928.call(null,G__105929));
})();
var cr105719_place_54 = (function (){var G__105931 = cr105719_place_31;
var G__105932 = cr105719_place_49;
var G__105933 = cr105719_place_50;
var G__105934 = cr105719_place_53;
var fexpr__105930 = cr105719_place_30;
return (fexpr__105930.cljs$core$IFn$_invoke$arity$4 ? fexpr__105930.cljs$core$IFn$_invoke$arity$4(G__105931,G__105932,G__105933,G__105934) : fexpr__105930.call(null,G__105931,G__105932,G__105933,G__105934));
})();
var cr105719_place_55 = frontend.common.missionary.backoff;
var cr105719_place_56 = new cljs.core.Keyword(null,"delay-seq","delay-seq",-1959201166);
var cr105719_place_57 = cljs.core.take;
var cr105719_place_58 = (5);
var cr105719_place_59 = cljs.core.drop;
var cr105719_place_60 = (2);
var cr105719_place_61 = frontend.common.missionary.delays;
var cr105719_place_62 = (function (){var G__105936 = cr105719_place_60;
var G__105937 = cr105719_place_61;
var fexpr__105935 = cr105719_place_59;
return (fexpr__105935.cljs$core$IFn$_invoke$arity$2 ? fexpr__105935.cljs$core$IFn$_invoke$arity$2(G__105936,G__105937) : fexpr__105935.call(null,G__105936,G__105937));
})();
var cr105719_place_63 = (function (){var G__105939 = cr105719_place_58;
var G__105940 = cr105719_place_62;
var fexpr__105938 = cr105719_place_57;
return (fexpr__105938.cljs$core$IFn$_invoke$arity$2 ? fexpr__105938.cljs$core$IFn$_invoke$arity$2(G__105939,G__105940) : fexpr__105938.call(null,G__105939,G__105940));
})();
var cr105719_place_64 = new cljs.core.Keyword(null,"reset-flow","reset-flow",-1725822377);
var cr105719_place_65 = frontend.worker.flows.online_event_flow;
var cr105719_place_66 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr105719_place_56,cr105719_place_63,cr105719_place_64,cr105719_place_65]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr105719_place_67 = frontend.worker.rtc.client.new_task__register_graph_updates;
var cr105719_place_68 = get_ws_create_task;
var cr105719_place_69 = graph_uuid;
var cr105719_place_70 = major_schema_version;
var cr105719_place_71 = repo;
var cr105719_place_72 = (function (){var G__105942 = cr105719_place_68;
var G__105943 = cr105719_place_69;
var G__105944 = cr105719_place_70;
var G__105945 = cr105719_place_71;
var fexpr__105941 = cr105719_place_67;
return (fexpr__105941.cljs$core$IFn$_invoke$arity$4 ? fexpr__105941.cljs$core$IFn$_invoke$arity$4(G__105942,G__105943,G__105944,G__105945) : fexpr__105941.call(null,G__105942,G__105943,G__105944,G__105945));
})();
var cr105719_place_73 = (function (){var G__105947 = cr105719_place_66;
var G__105948 = cr105719_place_72;
var fexpr__105946 = cr105719_place_55;
return (fexpr__105946.cljs$core$IFn$_invoke$arity$2 ? fexpr__105946.cljs$core$IFn$_invoke$arity$2(G__105947,G__105948) : fexpr__105946.call(null,G__105947,G__105948));
})();
(cr105719_state[(0)] = cr105719_block_8);

(cr105719_state[(3)] = null);

return missionary.core.park(cr105719_place_73);
}catch (e105890){var cr105719_exception = e105890;
(cr105719_state[(0)] = null);

(cr105719_state[(1)] = null);

(cr105719_state[(3)] = null);

(cr105719_state[(2)] = null);

throw cr105719_exception;
}});
var cr105719_block_13 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr105719_block_13(cr105719_state){
try{var cr105719_place_121 = frontend.worker.rtc.skeleton.new_task__calibrate_graph_skeleton;
var cr105719_place_122 = get_ws_create_task;
var cr105719_place_123 = graph_uuid;
var cr105719_place_124 = major_schema_version;
var cr105719_place_125 = cljs.core.deref;
var cr105719_place_126 = conn;
var cr105719_place_127 = (function (){var G__105951 = cr105719_place_126;
var fexpr__105950 = cr105719_place_125;
return (fexpr__105950.cljs$core$IFn$_invoke$arity$1 ? fexpr__105950.cljs$core$IFn$_invoke$arity$1(G__105951) : fexpr__105950.call(null,G__105951));
})();
var cr105719_place_128 = (function (){var G__105953 = cr105719_place_122;
var G__105954 = cr105719_place_123;
var G__105955 = cr105719_place_124;
var G__105956 = cr105719_place_127;
var fexpr__105952 = cr105719_place_121;
return (fexpr__105952.cljs$core$IFn$_invoke$arity$4 ? fexpr__105952.cljs$core$IFn$_invoke$arity$4(G__105953,G__105954,G__105955,G__105956) : fexpr__105952.call(null,G__105953,G__105954,G__105955,G__105956));
})();
(cr105719_state[(0)] = cr105719_block_14);

return missionary.core.park(cr105719_place_128);
}catch (e105949){var cr105719_exception = e105949;
(cr105719_state[(0)] = null);

(cr105719_state[(1)] = null);

(cr105719_state[(3)] = null);

(cr105719_state[(4)] = null);

(cr105719_state[(2)] = null);

throw cr105719_exception;
}});
var cr105719_block_10 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr105719_block_10(cr105719_state){
try{var cr105719_place_81 = (cr105719_state[(4)]);
var cr105719_place_85 = new cljs.core.Keyword("rtc.log","higher-remote-schema-version-exists","rtc.log/higher-remote-schema-version-exists",1466780034);
var cr105719_place_86 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr105719_place_87 = frontend.worker.rtc.branch_graph.compare_schemas;
var cr105719_place_88 = cr105719_place_81;
var cr105719_place_89 = logseq.db.frontend.schema.version;
var cr105719_place_90 = major_schema_version;
var cr105719_place_91 = (function (){var G__105959 = cr105719_place_88;
var G__105960 = cr105719_place_89;
var G__105961 = cr105719_place_90;
var fexpr__105958 = cr105719_place_87;
return (fexpr__105958.cljs$core$IFn$_invoke$arity$3 ? fexpr__105958.cljs$core$IFn$_invoke$arity$3(G__105959,G__105960,G__105961) : fexpr__105958.call(null,G__105959,G__105960,G__105961));
})();
var cr105719_place_92 = new cljs.core.Keyword(null,"repo","repo",-1999060679);
var cr105719_place_93 = repo;
var cr105719_place_94 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr105719_place_95 = graph_uuid;
var cr105719_place_96 = new cljs.core.Keyword(null,"remote-schema-version","remote-schema-version",-925454925);
var cr105719_place_97 = cr105719_place_81;
var cr105719_place_98 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr105719_place_96,cr105719_place_97,cr105719_place_92,cr105719_place_93,cr105719_place_94,cr105719_place_95,cr105719_place_86,cr105719_place_91]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr105719_place_99 = add_log_fn;
var cr105719_place_100 = cr105719_place_85;
var cr105719_place_101 = cr105719_place_98;
var cr105719_place_102 = (function (){var G__105963 = cr105719_place_100;
var G__105964 = cr105719_place_101;
var fexpr__105962 = cr105719_place_99;
return (fexpr__105962.cljs$core$IFn$_invoke$arity$2 ? fexpr__105962.cljs$core$IFn$_invoke$arity$2(G__105963,G__105964) : fexpr__105962.call(null,G__105963,G__105964));
})();
(cr105719_state[(0)] = cr105719_block_11);

(cr105719_state[(4)] = null);

(cr105719_state[(3)] = cr105719_place_102);

return cr105719_state;
}catch (e105957){var cr105719_exception = e105957;
(cr105719_state[(0)] = null);

(cr105719_state[(1)] = null);

(cr105719_state[(2)] = null);

(cr105719_state[(3)] = null);

(cr105719_state[(4)] = null);

throw cr105719_exception;
}});
var cr105719_block_2 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr105719_block_2(cr105719_state){
try{var cr105719_place_1 = (cr105719_state[(1)]);
var cr105719_place_9 = cljs.core.swap_BANG_;
var cr105719_place_10 = _STAR_sent;
var cr105719_place_11 = cljs.core.assoc;
var cr105719_place_12 = cr105719_place_1;
var cr105719_place_13 = false;
var cr105719_place_14 = (function (){var G__105967 = cr105719_place_10;
var G__105968 = cr105719_place_11;
var G__105969 = cr105719_place_12;
var G__105970 = cr105719_place_13;
var fexpr__105966 = cr105719_place_9;
return (fexpr__105966.cljs$core$IFn$_invoke$arity$4 ? fexpr__105966.cljs$core$IFn$_invoke$arity$4(G__105967,G__105968,G__105969,G__105970) : fexpr__105966.call(null,G__105967,G__105968,G__105969,G__105970));
})();
(cr105719_state[(0)] = cr105719_block_4);

(cr105719_state[(2)] = cr105719_place_14);

return cr105719_state;
}catch (e105965){var cr105719_exception = e105965;
(cr105719_state[(0)] = null);

(cr105719_state[(1)] = null);

(cr105719_state[(2)] = null);

throw cr105719_exception;
}});
var cr105719_block_1 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr105719_block_1(cr105719_state){
try{var cr105719_place_1 = missionary.core.unpark();
var cr105719_place_2 = cljs.core.contains_QMARK_;
var cr105719_place_3 = cljs.core.deref;
var cr105719_place_4 = _STAR_sent;
var cr105719_place_5 = (function (){var G__105973 = cr105719_place_4;
var fexpr__105972 = cr105719_place_3;
return (fexpr__105972.cljs$core$IFn$_invoke$arity$1 ? fexpr__105972.cljs$core$IFn$_invoke$arity$1(G__105973) : fexpr__105972.call(null,G__105973));
})();
var cr105719_place_6 = cr105719_place_1;
var cr105719_place_7 = (function (){var G__105975 = cr105719_place_5;
var G__105976 = cr105719_place_6;
var fexpr__105974 = cr105719_place_2;
return (fexpr__105974.cljs$core$IFn$_invoke$arity$2 ? fexpr__105974.cljs$core$IFn$_invoke$arity$2(G__105975,G__105976) : fexpr__105974.call(null,G__105975,G__105976));
})();
var cr105719_place_8 = null;
if(cljs.core.truth_(cr105719_place_7)){
(cr105719_state[(0)] = cr105719_block_3);

(cr105719_state[(1)] = cr105719_place_1);

(cr105719_state[(2)] = cr105719_place_8);

return cr105719_state;
} else {
(cr105719_state[(0)] = cr105719_block_2);

(cr105719_state[(1)] = cr105719_place_1);

(cr105719_state[(2)] = cr105719_place_8);

return cr105719_state;
}
}catch (e105971){var cr105719_exception = e105971;
(cr105719_state[(0)] = null);

throw cr105719_exception;
}});
var cr105719_block_0 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr105719_block_0(cr105719_state){
try{var cr105719_place_0 = get_ws_create_task;
(cr105719_state[(0)] = cr105719_block_1);

return missionary.core.park(cr105719_place_0);
}catch (e105977){var cr105719_exception = e105977;
(cr105719_state[(0)] = null);

throw cr105719_exception;
}});
var cr105719_block_5 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr105719_block_5(cr105719_state){
try{var cr105719_place_25 = null;
(cr105719_state[(0)] = cr105719_block_16);

(cr105719_state[(2)] = cr105719_place_25);

return cr105719_state;
}catch (e105978){var cr105719_exception = e105978;
(cr105719_state[(0)] = null);

(cr105719_state[(1)] = null);

(cr105719_state[(2)] = null);

throw cr105719_exception;
}});
var cr105719_block_6 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr105719_block_6(cr105719_state){
try{var cr105719_place_26 = frontend.worker.rtc.ws.recv_flow;
var cr105719_place_27 = get_ws_create_task;
(cr105719_state[(0)] = cr105719_block_7);

(cr105719_state[(3)] = cr105719_place_26);

return missionary.core.park(cr105719_place_27);
}catch (e105979){var cr105719_exception = e105979;
(cr105719_state[(0)] = null);

(cr105719_state[(1)] = null);

(cr105719_state[(2)] = null);

throw cr105719_exception;
}});
var cr105719_block_4 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr105719_block_4(cr105719_state){
try{var cr105719_place_1 = (cr105719_state[(1)]);
var cr105719_place_8 = (cr105719_state[(2)]);
var cr105719_place_16 = cljs.core.not;
var cr105719_place_17 = cljs.core.deref;
var cr105719_place_18 = _STAR_sent;
var cr105719_place_19 = (function (){var G__105982 = cr105719_place_18;
var fexpr__105981 = cr105719_place_17;
return (fexpr__105981.cljs$core$IFn$_invoke$arity$1 ? fexpr__105981.cljs$core$IFn$_invoke$arity$1(G__105982) : fexpr__105981.call(null,G__105982));
})();
var cr105719_place_20 = cr105719_place_19;
var cr105719_place_21 = cr105719_place_1;
var cr105719_place_22 = (function (){var G__105984 = cr105719_place_21;
var fexpr__105983 = cr105719_place_20;
return (fexpr__105983.cljs$core$IFn$_invoke$arity$1 ? fexpr__105983.cljs$core$IFn$_invoke$arity$1(G__105984) : fexpr__105983.call(null,G__105984));
})();
var cr105719_place_23 = (function (){var G__105986 = cr105719_place_22;
var fexpr__105985 = cr105719_place_16;
return (fexpr__105985.cljs$core$IFn$_invoke$arity$1 ? fexpr__105985.cljs$core$IFn$_invoke$arity$1(G__105986) : fexpr__105985.call(null,G__105986));
})();
var cr105719_place_24 = null;
if(cljs.core.truth_(cr105719_place_23)){
(cr105719_state[(0)] = cr105719_block_6);

(cr105719_state[(2)] = null);

(cr105719_state[(2)] = cr105719_place_24);

return cr105719_state;
} else {
(cr105719_state[(0)] = cr105719_block_5);

(cr105719_state[(2)] = null);

(cr105719_state[(2)] = cr105719_place_24);

return cr105719_state;
}
}catch (e105980){var cr105719_exception = e105980;
(cr105719_state[(0)] = null);

(cr105719_state[(1)] = null);

(cr105719_state[(2)] = null);

throw cr105719_exception;
}});
var cr105719_block_11 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr105719_block_11(cr105719_state){
try{var cr105719_place_83 = (cr105719_state[(3)]);
var cr105719_place_103 = frontend.worker.rtc.client_op.get_local_tx;
var cr105719_place_104 = repo;
var cr105719_place_105 = (function (){var G__105989 = cr105719_place_104;
var fexpr__105988 = cr105719_place_103;
return (fexpr__105988.cljs$core$IFn$_invoke$arity$1 ? fexpr__105988.cljs$core$IFn$_invoke$arity$1(G__105989) : fexpr__105988.call(null,G__105989));
})();
var cr105719_place_106 = cljs.core.deref;
var cr105719_place_107 = _STAR_last_calibrate_t;
var cr105719_place_108 = (function (){var G__105991 = cr105719_place_107;
var fexpr__105990 = cr105719_place_106;
return (fexpr__105990.cljs$core$IFn$_invoke$arity$1 ? fexpr__105990.cljs$core$IFn$_invoke$arity$1(G__105991) : fexpr__105990.call(null,G__105991));
})();
var cr105719_place_109 = null;
var cr105719_place_110 = (cr105719_place_108 == cr105719_place_109);
var cr105719_place_111 = (500);
var cr105719_place_112 = cr105719_place_105;
var cr105719_place_113 = cljs.core.deref;
var cr105719_place_114 = _STAR_last_calibrate_t;
var cr105719_place_115 = (function (){var G__105993 = cr105719_place_114;
var fexpr__105992 = cr105719_place_113;
return (fexpr__105992.cljs$core$IFn$_invoke$arity$1 ? fexpr__105992.cljs$core$IFn$_invoke$arity$1(G__105993) : fexpr__105992.call(null,G__105993));
})();
var cr105719_place_116 = (cr105719_place_112 - cr105719_place_115);
var cr105719_place_117 = (cr105719_place_111 < cr105719_place_116);
var cr105719_place_118 = ((cr105719_place_110) || (cr105719_place_117));
var cr105719_place_119 = null;
if(cr105719_place_118){
(cr105719_state[(0)] = cr105719_block_13);

(cr105719_state[(3)] = null);

(cr105719_state[(3)] = cr105719_place_119);

(cr105719_state[(4)] = cr105719_place_105);

return cr105719_state;
} else {
(cr105719_state[(0)] = cr105719_block_12);

(cr105719_state[(3)] = null);

(cr105719_state[(3)] = cr105719_place_119);

return cr105719_state;
}
}catch (e105987){var cr105719_exception = e105987;
(cr105719_state[(0)] = null);

(cr105719_state[(1)] = null);

(cr105719_state[(2)] = null);

(cr105719_state[(3)] = null);

throw cr105719_exception;
}});
var cr105719_block_14 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr105719_block_14(cr105719_state){
try{var cr105719_place_105 = (cr105719_state[(4)]);
var cr105719_place_129 = missionary.core.unpark();
var cr105719_place_130 = cljs.core.__destructure_map;
var cr105719_place_131 = cr105719_place_129;
var cr105719_place_132 = (function (){var G__105996 = cr105719_place_131;
var fexpr__105995 = cr105719_place_130;
return (fexpr__105995.cljs$core$IFn$_invoke$arity$1 ? fexpr__105995.cljs$core$IFn$_invoke$arity$1(G__105996) : fexpr__105995.call(null,G__105996));
})();
var cr105719_place_133 = cljs.core.get;
var cr105719_place_134 = cr105719_place_132;
var cr105719_place_135 = new cljs.core.Keyword(null,"server-schema-version","server-schema-version",765611123);
var cr105719_place_136 = (function (){var G__105998 = cr105719_place_134;
var G__105999 = cr105719_place_135;
var fexpr__105997 = cr105719_place_133;
return (fexpr__105997.cljs$core$IFn$_invoke$arity$2 ? fexpr__105997.cljs$core$IFn$_invoke$arity$2(G__105998,G__105999) : fexpr__105997.call(null,G__105998,G__105999));
})();
var cr105719_place_137 = cljs.core.get;
var cr105719_place_138 = cr105719_place_132;
var cr105719_place_139 = new cljs.core.Keyword(null,"_server-builtin-db-idents","_server-builtin-db-idents",-1081428540);
var cr105719_place_140 = (function (){var G__106001 = cr105719_place_138;
var G__106002 = cr105719_place_139;
var fexpr__106000 = cr105719_place_137;
return (fexpr__106000.cljs$core$IFn$_invoke$arity$2 ? fexpr__106000.cljs$core$IFn$_invoke$arity$2(G__106001,G__106002) : fexpr__106000.call(null,G__106001,G__106002));
})();
var cr105719_place_141 = cljs.core.reset_BANG_;
var cr105719_place_142 = _STAR_server_schema_version;
var cr105719_place_143 = cr105719_place_136;
var cr105719_place_144 = (function (){var G__106004 = cr105719_place_142;
var G__106005 = cr105719_place_143;
var fexpr__106003 = cr105719_place_141;
return (fexpr__106003.cljs$core$IFn$_invoke$arity$2 ? fexpr__106003.cljs$core$IFn$_invoke$arity$2(G__106004,G__106005) : fexpr__106003.call(null,G__106004,G__106005));
})();
var cr105719_place_145 = cljs.core.reset_BANG_;
var cr105719_place_146 = _STAR_last_calibrate_t;
var cr105719_place_147 = cr105719_place_105;
var cr105719_place_148 = (function (){var G__106007 = cr105719_place_146;
var G__106008 = cr105719_place_147;
var fexpr__106006 = cr105719_place_145;
return (fexpr__106006.cljs$core$IFn$_invoke$arity$2 ? fexpr__106006.cljs$core$IFn$_invoke$arity$2(G__106007,G__106008) : fexpr__106006.call(null,G__106007,G__106008));
})();
(cr105719_state[(0)] = cr105719_block_15);

(cr105719_state[(4)] = null);

(cr105719_state[(3)] = cr105719_place_148);

return cr105719_state;
}catch (e105994){var cr105719_exception = e105994;
(cr105719_state[(0)] = null);

(cr105719_state[(1)] = null);

(cr105719_state[(3)] = null);

(cr105719_state[(4)] = null);

(cr105719_state[(2)] = null);

throw cr105719_exception;
}});
var cr105719_block_9 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr105719_block_9(cr105719_state){
try{var cr105719_place_84 = null;
(cr105719_state[(0)] = cr105719_block_11);

(cr105719_state[(3)] = cr105719_place_84);

return cr105719_state;
}catch (e106009){var cr105719_exception = e106009;
(cr105719_state[(0)] = null);

(cr105719_state[(1)] = null);

(cr105719_state[(2)] = null);

(cr105719_state[(3)] = null);

throw cr105719_exception;
}});
var cr105719_block_16 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr105719_block_16(cr105719_state){
try{var cr105719_place_1 = (cr105719_state[(1)]);
var cr105719_place_24 = (cr105719_state[(2)]);
var cr105719_place_155 = cr105719_place_1;
(cr105719_state[(0)] = null);

(cr105719_state[(1)] = null);

(cr105719_state[(2)] = null);

return cr105719_place_155;
}catch (e106010){var cr105719_exception = e106010;
(cr105719_state[(0)] = null);

(cr105719_state[(1)] = null);

(cr105719_state[(2)] = null);

throw cr105719_exception;
}});
var cr105719_block_8 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr105719_block_8(cr105719_state){
try{var cr105719_place_74 = missionary.core.unpark();
var cr105719_place_75 = cljs.core.__destructure_map;
var cr105719_place_76 = cr105719_place_74;
var cr105719_place_77 = (function (){var G__106013 = cr105719_place_76;
var fexpr__106012 = cr105719_place_75;
return (fexpr__106012.cljs$core$IFn$_invoke$arity$1 ? fexpr__106012.cljs$core$IFn$_invoke$arity$1(G__106013) : fexpr__106012.call(null,G__106013));
})();
var cr105719_place_78 = cljs.core.get;
var cr105719_place_79 = cr105719_place_77;
var cr105719_place_80 = new cljs.core.Keyword(null,"max-remote-schema-version","max-remote-schema-version",-1002716880);
var cr105719_place_81 = (function (){var G__106015 = cr105719_place_79;
var G__106016 = cr105719_place_80;
var fexpr__106014 = cr105719_place_78;
return (fexpr__106014.cljs$core$IFn$_invoke$arity$2 ? fexpr__106014.cljs$core$IFn$_invoke$arity$2(G__106015,G__106016) : fexpr__106014.call(null,G__106015,G__106016));
})();
var cr105719_place_82 = cr105719_place_81;
var cr105719_place_83 = null;
if(cljs.core.truth_(cr105719_place_82)){
(cr105719_state[(0)] = cr105719_block_10);

(cr105719_state[(3)] = cr105719_place_83);

(cr105719_state[(4)] = cr105719_place_81);

return cr105719_state;
} else {
(cr105719_state[(0)] = cr105719_block_9);

(cr105719_state[(3)] = cr105719_place_83);

return cr105719_state;
}
}catch (e106011){var cr105719_exception = e106011;
(cr105719_state[(0)] = null);

(cr105719_state[(1)] = null);

(cr105719_state[(2)] = null);

throw cr105719_exception;
}});
var cr105719_block_3 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr105719_block_3(cr105719_state){
try{var cr105719_place_15 = null;
(cr105719_state[(0)] = cr105719_block_4);

(cr105719_state[(2)] = cr105719_place_15);

return cr105719_state;
}catch (e106017){var cr105719_exception = e106017;
(cr105719_state[(0)] = null);

(cr105719_state[(1)] = null);

(cr105719_state[(2)] = null);

throw cr105719_exception;
}});
var cr105719_block_12 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr105719_block_12(cr105719_state){
try{var cr105719_place_120 = null;
(cr105719_state[(0)] = cr105719_block_15);

(cr105719_state[(3)] = cr105719_place_120);

return cr105719_state;
}catch (e106018){var cr105719_exception = e106018;
(cr105719_state[(0)] = null);

(cr105719_state[(1)] = null);

(cr105719_state[(3)] = null);

(cr105719_state[(2)] = null);

throw cr105719_exception;
}});
var cr105719_block_15 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr105719_block_15(cr105719_state){
try{var cr105719_place_1 = (cr105719_state[(1)]);
var cr105719_place_119 = (cr105719_state[(3)]);
var cr105719_place_149 = cljs.core.swap_BANG_;
var cr105719_place_150 = _STAR_sent;
var cr105719_place_151 = cljs.core.assoc;
var cr105719_place_152 = cr105719_place_1;
var cr105719_place_153 = true;
var cr105719_place_154 = (function (){var G__106021 = cr105719_place_150;
var G__106022 = cr105719_place_151;
var G__106023 = cr105719_place_152;
var G__106024 = cr105719_place_153;
var fexpr__106020 = cr105719_place_149;
return (fexpr__106020.cljs$core$IFn$_invoke$arity$4 ? fexpr__106020.cljs$core$IFn$_invoke$arity$4(G__106021,G__106022,G__106023,G__106024) : fexpr__106020.call(null,G__106021,G__106022,G__106023,G__106024));
})();
(cr105719_state[(0)] = cr105719_block_16);

(cr105719_state[(3)] = null);

(cr105719_state[(2)] = cr105719_place_154);

return cr105719_state;
}catch (e106019){var cr105719_exception = e106019;
(cr105719_state[(0)] = null);

(cr105719_state[(1)] = null);

(cr105719_state[(3)] = null);

(cr105719_state[(2)] = null);

throw cr105719_exception;
}});
return cloroutine.impl.coroutine((function (){var G__106025 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__106025[(0)] = cr105719_block_0);

return G__106025;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.client.ensure_register_graph_updates = cljs.core.memoize(frontend.worker.rtc.client.ensure_register_graph_updates_STAR_);
frontend.worker.rtc.client.__GT_pos = (function frontend$worker$rtc$client$__GT_pos(parent_uuid,order){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [parent_uuid,order], null);
});
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.rtc !== 'undefined') && (typeof frontend.worker.rtc.client !== 'undefined') && (typeof frontend.worker.rtc.client.local_block_ops__GT_remote_ops_aux !== 'undefined')){
} else {
frontend.worker.rtc.client.local_block_ops__GT_remote_ops_aux = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__106026 = cljs.core.get_global_hierarchy;
return (fexpr__106026.cljs$core$IFn$_invoke$arity$0 ? fexpr__106026.cljs$core$IFn$_invoke$arity$0() : fexpr__106026.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("frontend.worker.rtc.client","local-block-ops->remote-ops-aux"),(function() { 
var G__106432__delegate = function (tp,_){
return tp;
};
var G__106432 = function (tp,var_args){
var _ = null;
if (arguments.length > 1) {
var G__106433__i = 0, G__106433__a = new Array(arguments.length -  1);
while (G__106433__i < G__106433__a.length) {G__106433__a[G__106433__i] = arguments[G__106433__i + 1]; ++G__106433__i;}
  _ = new cljs.core.IndexedSeq(G__106433__a,0,null);
} 
return G__106432__delegate.call(this,tp,_);};
G__106432.cljs$lang$maxFixedArity = 1;
G__106432.cljs$lang$applyTo = (function (arglist__106434){
var tp = cljs.core.first(arglist__106434);
var _ = cljs.core.rest(arglist__106434);
return G__106432__delegate(tp,_);
});
G__106432.cljs$core$IFn$_invoke$arity$variadic = G__106432__delegate;
return G__106432;
})()
,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
frontend.worker.rtc.client.local_block_ops__GT_remote_ops_aux.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"move-op","move-op",1323817617),(function() { 
var G__106435__delegate = function (_,p__106027){
var map__106028 = p__106027;
var map__106028__$1 = cljs.core.__destructure_map(map__106028);
var parent_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106028__$1,new cljs.core.Keyword(null,"parent-uuid","parent-uuid",-2003485227));
var block_order = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106028__$1,new cljs.core.Keyword(null,"block-order","block-order",493370373));
var block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106028__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638));
var _STAR_remote_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106028__$1,new cljs.core.Keyword(null,"*remote-ops","*remote-ops",234002129));
var _STAR_depend_on_block_uuid_set = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106028__$1,new cljs.core.Keyword(null,"*depend-on-block-uuid-set","*depend-on-block-uuid-set",-431701684));
if(cljs.core.truth_(parent_uuid)){
var pos = frontend.worker.rtc.client.__GT_pos(parent_uuid,block_order);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_remote_ops,cljs.core.conj,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"move","move",-2110884309),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid,new cljs.core.Keyword(null,"pos","pos",-864607220),pos], null)], null));

if(cljs.core.truth_(parent_uuid)){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_depend_on_block_uuid_set,cljs.core.conj,parent_uuid);
} else {
return null;
}
} else {
return null;
}
};
var G__106435 = function (_,var_args){
var p__106027 = null;
if (arguments.length > 1) {
var G__106436__i = 0, G__106436__a = new Array(arguments.length -  1);
while (G__106436__i < G__106436__a.length) {G__106436__a[G__106436__i] = arguments[G__106436__i + 1]; ++G__106436__i;}
  p__106027 = new cljs.core.IndexedSeq(G__106436__a,0,null);
} 
return G__106435__delegate.call(this,_,p__106027);};
G__106435.cljs$lang$maxFixedArity = 1;
G__106435.cljs$lang$applyTo = (function (arglist__106437){
var _ = cljs.core.first(arglist__106437);
var p__106027 = cljs.core.rest(arglist__106437);
return G__106435__delegate(_,p__106027);
});
G__106435.cljs$core$IFn$_invoke$arity$variadic = G__106435__delegate;
return G__106435;
})()
);
frontend.worker.rtc.client.card_many_attr_QMARK_ = (function frontend$worker$rtc$client$card_many_attr_QMARK_(db,attr){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2((datascript.core.schema.cljs$core$IFn$_invoke$arity$1 ? datascript.core.schema.cljs$core$IFn$_invoke$arity$1(db) : datascript.core.schema.call(null,db)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [attr,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659)], null)));
});
/**
 * Remove previous av if later-av has same [a v] or a
 */
frontend.worker.rtc.client.remove_redundant_av = (function frontend$worker$rtc$client$remove_redundant_av(db,av_coll){
var G__106032 = av_coll;
var vec__106033 = G__106032;
var seq__106034 = cljs.core.seq(vec__106033);
var first__106035 = cljs.core.first(seq__106034);
var seq__106034__$1 = cljs.core.next(seq__106034);
var av = first__106035;
var others = seq__106034__$1;
var r = cljs.core.PersistentArrayMap.EMPTY;
var G__106032__$1 = G__106032;
var r__$1 = r;
while(true){
var vec__106042 = G__106032__$1;
var seq__106043 = cljs.core.seq(vec__106042);
var first__106044 = cljs.core.first(seq__106043);
var seq__106043__$1 = cljs.core.next(seq__106043);
var av__$1 = first__106044;
var others__$1 = seq__106043__$1;
var r__$2 = r__$1;
if(cljs.core.not(av__$1)){
return cljs.core.vals(r__$2);
} else {
var vec__106045 = av__$1;
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106045,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106045,(1),null);
var _t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106045,(2),null);
var _add_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106045,(3),null);
var av_key = ((frontend.worker.rtc.client.card_many_attr_QMARK_(db,a))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [a,v], null):a);
var temp__5802__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(r__$2,av_key);
if(cljs.core.truth_(temp__5802__auto__)){
var old_av = temp__5802__auto__;
var G__106438 = others__$1;
var G__106439 = (((cljs.core.nth.cljs$core$IFn$_invoke$arity$2(old_av,(2)) < cljs.core.nth.cljs$core$IFn$_invoke$arity$2(av__$1,(2))))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r__$2,av_key,av__$1):(((cljs.core.nth.cljs$core$IFn$_invoke$arity$2(old_av,(2)) > cljs.core.nth.cljs$core$IFn$_invoke$arity$2(av__$1,(2))))?r__$2:((cljs.core.nth.cljs$core$IFn$_invoke$arity$2(av__$1,(3)) === true)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r__$2,av_key,av__$1):r__$2
)));
G__106032__$1 = G__106438;
r__$1 = G__106439;
continue;
} else {
var G__106440 = others__$1;
var G__106441 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r__$2,av_key,av__$1);
G__106032__$1 = G__106440;
r__$1 = G__106441;
continue;
}
}
break;
}
});
/**
 * Remove av if its v is ref(block-uuid) and not exist
 */
frontend.worker.rtc.client.remove_non_exist_ref_av = (function frontend$worker$rtc$client$remove_non_exist_ref_av(db,av_coll){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (av){
var vec__106048 = av;
var _a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106048,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106048,(1),null);
var _t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106048,(2),null);
var add_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106048,(3),null);
var and__5000__auto__ = add_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.uuid_QMARK_(v)) && (((function (){var G__106051 = db;
var G__106052 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),v], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__106051,G__106052) : datascript.core.entity.call(null,G__106051,G__106052));
})() == null)));
} else {
return and__5000__auto__;
}
}),av_coll);
});
frontend.worker.rtc.client.group_by_schema_attrs = (function frontend$worker$rtc$client$group_by_schema_attrs(av_coll){
var map__106053 = cljs.core.group_by((function (av){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("db","index","db/index",-1531680669),null,new cljs.core.Keyword("db","valueType","db/valueType",1827971944),null,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),null], null), null),cljs.core.first(av));
}),av_coll);
var map__106053__$1 = cljs.core.__destructure_map(map__106053);
var schema_av_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106053__$1,true);
var other_av_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106053__$1,false);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [schema_av_coll,other_av_coll], null);
});
frontend.worker.rtc.client.schema_av_coll__GT_update_schema_op = (function frontend$worker$rtc$client$schema_av_coll__GT_update_schema_op(db,block_uuid,db_ident,schema_av_coll){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.seq(schema_av_coll);
if(and__5000__auto__){
return db_ident;
} else {
return and__5000__auto__;
}
})())){
var temp__5804__auto__ = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,db_ident) : datascript.core.entity.call(null,db,db_ident));
if(cljs.core.truth_(temp__5804__auto__)){
var ent = temp__5804__auto__;
if(cljs.core.truth_((logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.property_QMARK_.cljs$core$IFn$_invoke$arity$1(ent) : logseq.db.property_QMARK_.call(null,ent)))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update-schema","update-schema",-691503438),(function (){var G__106054 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid,new cljs.core.Keyword("db","ident","db/ident",-737096),db_ident,new cljs.core.Keyword("db","valueType","db/valueType",1827971944),(function (){var or__5002__auto__ = new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(ent);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("db.type","string","db.type/string",1432572808);
}
})()], null);
var G__106054__$1 = (cljs.core.truth_(new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(ent))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106054,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(ent)):G__106054);
if(cljs.core.truth_(new cljs.core.Keyword("db","index","db/index",-1531680669).cljs$core$IFn$_invoke$arity$1(ent))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106054__$1,new cljs.core.Keyword("db","index","db/index",-1531680669),new cljs.core.Keyword("db","index","db/index",-1531680669).cljs$core$IFn$_invoke$arity$1(ent));
} else {
return G__106054__$1;
}
})()], null);
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});
frontend.worker.rtc.client.av_coll__GT_card_one_attrs = (function frontend$worker$rtc$client$av_coll__GT_card_one_attrs(db_schema,av_coll){
var a_coll = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,av_coll));
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (a){
var temp__5804__auto__ = cljs.core.namespace(a);
if(cljs.core.truth_(temp__5804__auto__)){
var ns = temp__5804__auto__;
return ((((clojure.string.starts_with_QMARK_(ns,"logseq.property")) || (clojure.string.ends_with_QMARK_(ns,".property")))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","one","db.cardinality/one",1428352190),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1((db_schema.cljs$core$IFn$_invoke$arity$1 ? db_schema.cljs$core$IFn$_invoke$arity$1(a) : db_schema.call(null,a))))));
} else {
return null;
}
}),a_coll);
});
frontend.worker.rtc.client.local_block_ops__GT_remote_ops_aux.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"update-op","update-op",447969937),(function() { 
var G__106442__delegate = function (_,p__106055){
var map__106056 = p__106055;
var map__106056__$1 = cljs.core.__destructure_map(map__106056);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106056__$1,new cljs.core.Keyword(null,"db","db",993250759));
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106056__$1,new cljs.core.Keyword(null,"block","block",664686210));
var update_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106056__$1,new cljs.core.Keyword(null,"update-op","update-op",447969937));
var block_order = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106056__$1,new cljs.core.Keyword(null,"block-order","block-order",493370373));
var parent_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106056__$1,new cljs.core.Keyword(null,"parent-uuid","parent-uuid",-2003485227));
var _STAR_remote_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106056__$1,new cljs.core.Keyword(null,"*remote-ops","*remote-ops",234002129));
var _STAR_depend_on_block_uuid_set = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106056__$1,new cljs.core.Keyword(null,"*depend-on-block-uuid-set","*depend-on-block-uuid-set",-431701684));
var block_uuid = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
var pos = frontend.worker.rtc.client.__GT_pos(parent_uuid,block_order);
var av_coll = frontend.worker.rtc.client.remove_non_exist_ref_av(db,frontend.worker.rtc.client.remove_redundant_av(db,new cljs.core.Keyword(null,"av-coll","av-coll",1589194401).cljs$core$IFn$_invoke$arity$1(cljs.core.last(update_op))));
var vec__106057 = frontend.worker.rtc.client.group_by_schema_attrs(av_coll);
var schema_av_coll = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106057,(0),null);
var other_av_coll = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106057,(1),null);
var update_schema_op = frontend.worker.rtc.client.schema_av_coll__GT_update_schema_op(db,block_uuid,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(block),schema_av_coll);
var depend_on_block_uuids = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__106060){
var vec__106061 = p__106060;
var _a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106061,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106061,(1),null);
if(cljs.core.uuid_QMARK_(v)){
return v;
} else {
return null;
}
}),other_av_coll);
var card_one_attrs = cljs.core.seq(frontend.worker.rtc.client.av_coll__GT_card_one_attrs((datascript.core.schema.cljs$core$IFn$_invoke$arity$1 ? datascript.core.schema.cljs$core$IFn$_invoke$arity$1(db) : datascript.core.schema.call(null,db)),other_av_coll));
if(cljs.core.seq(other_av_coll)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_remote_ops,cljs.core.conj,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update","update",1045576396),(function (){var G__106064 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid,new cljs.core.Keyword(null,"pos","pos",-864607220),pos,new cljs.core.Keyword(null,"av-coll","av-coll",1589194401),other_av_coll], null);
var G__106064__$1 = (cljs.core.truth_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(block))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106064,new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(block)):G__106064);
if(card_one_attrs){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__106064__$1,new cljs.core.Keyword(null,"card-one-attrs","card-one-attrs",-1282542626),card_one_attrs);
} else {
return G__106064__$1;
}
})()], null));
} else {
}

if(cljs.core.truth_(update_schema_op)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_remote_ops,cljs.core.conj,update_schema_op);
} else {
}

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_depend_on_block_uuid_set,cljs.core.partial.cljs$core$IFn$_invoke$arity$2(cljs.core.apply,cljs.core.conj),depend_on_block_uuids);
};
var G__106442 = function (_,var_args){
var p__106055 = null;
if (arguments.length > 1) {
var G__106443__i = 0, G__106443__a = new Array(arguments.length -  1);
while (G__106443__i < G__106443__a.length) {G__106443__a[G__106443__i] = arguments[G__106443__i + 1]; ++G__106443__i;}
  p__106055 = new cljs.core.IndexedSeq(G__106443__a,0,null);
} 
return G__106442__delegate.call(this,_,p__106055);};
G__106442.cljs$lang$maxFixedArity = 1;
G__106442.cljs$lang$applyTo = (function (arglist__106444){
var _ = cljs.core.first(arglist__106444);
var p__106055 = cljs.core.rest(arglist__106444);
return G__106442__delegate(_,p__106055);
});
G__106442.cljs$core$IFn$_invoke$arity$variadic = G__106442__delegate;
return G__106442;
})()
);
frontend.worker.rtc.client.local_block_ops__GT_remote_ops_aux.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"update-page-op","update-page-op",1640000564),(function() { 
var G__106445__delegate = function (_,p__106065){
var map__106066 = p__106065;
var map__106066__$1 = cljs.core.__destructure_map(map__106066);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106066__$1,new cljs.core.Keyword(null,"db","db",993250759));
var block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106066__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638));
var _STAR_remote_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106066__$1,new cljs.core.Keyword(null,"*remote-ops","*remote-ops",234002129));
var temp__5804__auto__ = (function (){var G__106067 = db;
var G__106068 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__106067,G__106068) : datascript.core.entity.call(null,G__106067,G__106068));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var map__106069 = temp__5804__auto__;
var map__106069__$1 = cljs.core.__destructure_map(map__106069);
var page_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106069__$1,new cljs.core.Keyword("block","name","block/name",1619760316));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106069__$1,new cljs.core.Keyword("block","title","block/title",710445684));
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_remote_ops,cljs.core.conj,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update-page","update-page",-503479891),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid,new cljs.core.Keyword(null,"page-name","page-name",974981762),page_name,new cljs.core.Keyword("block","title","block/title",710445684),(function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return page_name;
}
})()], null)], null));
} else {
return null;
}
};
var G__106445 = function (_,var_args){
var p__106065 = null;
if (arguments.length > 1) {
var G__106446__i = 0, G__106446__a = new Array(arguments.length -  1);
while (G__106446__i < G__106446__a.length) {G__106446__a[G__106446__i] = arguments[G__106446__i + 1]; ++G__106446__i;}
  p__106065 = new cljs.core.IndexedSeq(G__106446__a,0,null);
} 
return G__106445__delegate.call(this,_,p__106065);};
G__106445.cljs$lang$maxFixedArity = 1;
G__106445.cljs$lang$applyTo = (function (arglist__106447){
var _ = cljs.core.first(arglist__106447);
var p__106065 = cljs.core.rest(arglist__106447);
return G__106445__delegate(_,p__106065);
});
G__106445.cljs$core$IFn$_invoke$arity$variadic = G__106445__delegate;
return G__106445;
})()
);
frontend.worker.rtc.client.local_block_ops__GT_remote_ops_aux.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"remove-op","remove-op",1576450797),(function() { 
var G__106448__delegate = function (_,p__106070){
var map__106071 = p__106070;
var map__106071__$1 = cljs.core.__destructure_map(map__106071);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106071__$1,new cljs.core.Keyword(null,"db","db",993250759));
var remove_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106071__$1,new cljs.core.Keyword(null,"remove-op","remove-op",1576450797));
var _STAR_remote_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106071__$1,new cljs.core.Keyword(null,"*remote-ops","*remote-ops",234002129));
var temp__5804__auto__ = new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(cljs.core.last(remove_op));
if(cljs.core.truth_(temp__5804__auto__)){
var block_uuid = temp__5804__auto__;
if(((function (){var G__106072 = db;
var G__106073 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__106072,G__106073) : datascript.core.entity.call(null,G__106072,G__106073));
})() == null)){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_remote_ops,cljs.core.conj,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"remove","remove",-131428414),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-uuids","block-uuids",-1313492773),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_uuid], null)], null)], null));
} else {
return null;
}
} else {
return null;
}
};
var G__106448 = function (_,var_args){
var p__106070 = null;
if (arguments.length > 1) {
var G__106449__i = 0, G__106449__a = new Array(arguments.length -  1);
while (G__106449__i < G__106449__a.length) {G__106449__a[G__106449__i] = arguments[G__106449__i + 1]; ++G__106449__i;}
  p__106070 = new cljs.core.IndexedSeq(G__106449__a,0,null);
} 
return G__106448__delegate.call(this,_,p__106070);};
G__106448.cljs$lang$maxFixedArity = 1;
G__106448.cljs$lang$applyTo = (function (arglist__106450){
var _ = cljs.core.first(arglist__106450);
var p__106070 = cljs.core.rest(arglist__106450);
return G__106448__delegate(_,p__106070);
});
G__106448.cljs$core$IFn$_invoke$arity$variadic = G__106448__delegate;
return G__106448;
})()
);
frontend.worker.rtc.client.local_block_ops__GT_remote_ops_aux.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"remove-page-op","remove-page-op",-70089318),(function() { 
var G__106451__delegate = function (_,p__106074){
var map__106075 = p__106074;
var map__106075__$1 = cljs.core.__destructure_map(map__106075);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106075__$1,new cljs.core.Keyword(null,"db","db",993250759));
var remove_page_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106075__$1,new cljs.core.Keyword(null,"remove-page-op","remove-page-op",-70089318));
var _STAR_remote_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106075__$1,new cljs.core.Keyword(null,"*remote-ops","*remote-ops",234002129));
var temp__5804__auto__ = new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(cljs.core.last(remove_page_op));
if(cljs.core.truth_(temp__5804__auto__)){
var block_uuid = temp__5804__auto__;
if(((function (){var G__106076 = db;
var G__106077 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__106076,G__106077) : datascript.core.entity.call(null,G__106076,G__106077));
})() == null)){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_remote_ops,cljs.core.conj,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"remove-page","remove-page",-1679345876),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid], null)], null));
} else {
return null;
}
} else {
return null;
}
};
var G__106451 = function (_,var_args){
var p__106074 = null;
if (arguments.length > 1) {
var G__106452__i = 0, G__106452__a = new Array(arguments.length -  1);
while (G__106452__i < G__106452__a.length) {G__106452__a[G__106452__i] = arguments[G__106452__i + 1]; ++G__106452__i;}
  p__106074 = new cljs.core.IndexedSeq(G__106452__a,0,null);
} 
return G__106451__delegate.call(this,_,p__106074);};
G__106451.cljs$lang$maxFixedArity = 1;
G__106451.cljs$lang$applyTo = (function (arglist__106453){
var _ = cljs.core.first(arglist__106453);
var p__106074 = cljs.core.rest(arglist__106453);
return G__106451__delegate(_,p__106074);
});
G__106451.cljs$core$IFn$_invoke$arity$variadic = G__106451__delegate;
return G__106451;
})()
);
frontend.worker.rtc.client.local_block_ops__GT_remote_ops = (function frontend$worker$rtc$client$local_block_ops__GT_remote_ops(db,block_ops){
var _STAR_depend_on_block_uuid_set = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
var _STAR_remote_ops = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
var map__106078 = block_ops;
var map__106078__$1 = cljs.core.__destructure_map(map__106078);
var move_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106078__$1,new cljs.core.Keyword(null,"move","move",-2110884309));
var remove_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106078__$1,new cljs.core.Keyword(null,"remove","remove",-131428414));
var update_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106078__$1,new cljs.core.Keyword(null,"update","update",1045576396));
var update_page_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106078__$1,new cljs.core.Keyword(null,"update-page","update-page",-503479891));
var remove_page_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106078__$1,new cljs.core.Keyword(null,"remove-page","remove-page",-1679345876));
var temp__5804__auto___106454 = cljs.core.some(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),cljs.core.last),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [move_op,update_op,update_page_op], null));
if(cljs.core.truth_(temp__5804__auto___106454)){
var block_uuid_106455 = temp__5804__auto___106454;
var temp__5804__auto___106456__$1 = (function (){var G__106079 = db;
var G__106080 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_106455], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__106079,G__106080) : datascript.core.entity.call(null,G__106079,G__106080));
})();
if(cljs.core.truth_(temp__5804__auto___106456__$1)){
var block_106457 = temp__5804__auto___106456__$1;
var parent_uuid_106458 = (function (){var G__106081 = block_106457;
var G__106081__$1 = (((G__106081 == null))?null:new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(G__106081));
if((G__106081__$1 == null)){
return null;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(G__106081__$1);
}
})();
if(cljs.core.truth_(parent_uuid_106458)){
if(cljs.core.truth_(move_op)){
frontend.worker.rtc.client.local_block_ops__GT_remote_ops_aux.cljs$core$IFn$_invoke$arity$11(new cljs.core.Keyword(null,"move-op","move-op",1323817617),new cljs.core.Keyword(null,"parent-uuid","parent-uuid",-2003485227),parent_uuid_106458,new cljs.core.Keyword(null,"block-order","block-order",493370373),new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(block_106457),new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid_106455,new cljs.core.Keyword(null,"*remote-ops","*remote-ops",234002129),_STAR_remote_ops,new cljs.core.Keyword(null,"*depend-on-block-uuid-set","*depend-on-block-uuid-set",-431701684),_STAR_depend_on_block_uuid_set);
} else {
}
} else {
}

if(cljs.core.truth_(update_op)){
frontend.worker.rtc.client.local_block_ops__GT_remote_ops_aux.cljs$core$IFn$_invoke$arity$15(new cljs.core.Keyword(null,"update-op","update-op",447969937),new cljs.core.Keyword(null,"db","db",993250759),db,new cljs.core.Keyword(null,"block","block",664686210),block_106457,new cljs.core.Keyword(null,"update-op","update-op",447969937),update_op,new cljs.core.Keyword(null,"parent-uuid","parent-uuid",-2003485227),parent_uuid_106458,new cljs.core.Keyword(null,"block-order","block-order",493370373),new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(block_106457),new cljs.core.Keyword(null,"*remote-ops","*remote-ops",234002129),_STAR_remote_ops,new cljs.core.Keyword(null,"*depend-on-block-uuid-set","*depend-on-block-uuid-set",-431701684),_STAR_depend_on_block_uuid_set);
} else {
}

if(cljs.core.truth_(update_page_op)){
frontend.worker.rtc.client.local_block_ops__GT_remote_ops_aux.cljs$core$IFn$_invoke$arity$7(new cljs.core.Keyword(null,"update-page-op","update-page-op",1640000564),new cljs.core.Keyword(null,"db","db",993250759),db,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid_106455,new cljs.core.Keyword(null,"*remote-ops","*remote-ops",234002129),_STAR_remote_ops);
} else {
}
} else {
}
} else {
}

if(cljs.core.truth_(remove_op)){
frontend.worker.rtc.client.local_block_ops__GT_remote_ops_aux.cljs$core$IFn$_invoke$arity$7(new cljs.core.Keyword(null,"remove-op","remove-op",1576450797),new cljs.core.Keyword(null,"db","db",993250759),db,new cljs.core.Keyword(null,"remove-op","remove-op",1576450797),remove_op,new cljs.core.Keyword(null,"*remote-ops","*remote-ops",234002129),_STAR_remote_ops);
} else {
}

if(cljs.core.truth_(remove_page_op)){
frontend.worker.rtc.client.local_block_ops__GT_remote_ops_aux.cljs$core$IFn$_invoke$arity$7(new cljs.core.Keyword(null,"remove-page-op","remove-page-op",-70089318),new cljs.core.Keyword(null,"db","db",993250759),db,new cljs.core.Keyword(null,"remove-page-op","remove-page-op",-70089318),remove_page_op,new cljs.core.Keyword(null,"*remote-ops","*remote-ops",234002129),_STAR_remote_ops);
} else {
}

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"remote-ops","remote-ops",1178110828),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.deref(_STAR_remote_ops)),new cljs.core.Keyword(null,"depend-on-block-uuids","depend-on-block-uuids",407575644),cljs.core.deref(_STAR_depend_on_block_uuid_set)], null);
});
frontend.worker.rtc.client.gen_block_uuid__GT_remote_ops = (function frontend$worker$rtc$client$gen_block_uuid__GT_remote_ops(db,block_ops_map_coll){
return cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (block_ops_map){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block_ops_map),new cljs.core.Keyword(null,"remote-ops","remote-ops",1178110828).cljs$core$IFn$_invoke$arity$1(frontend.worker.rtc.client.local_block_ops__GT_remote_ops(db,block_ops_map))], null);
})),block_ops_map_coll);
});
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.rtc !== 'undefined') && (typeof frontend.worker.rtc.client !== 'undefined') && (typeof frontend.worker.rtc.client.local_db_ident_kv_ops__GT_remote_ops_aux !== 'undefined')){
} else {
frontend.worker.rtc.client.local_db_ident_kv_ops__GT_remote_ops_aux = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__106082 = cljs.core.get_global_hierarchy;
return (fexpr__106082.cljs$core$IFn$_invoke$arity$0 ? fexpr__106082.cljs$core$IFn$_invoke$arity$0() : fexpr__106082.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("frontend.worker.rtc.client","local-db-ident-kv-ops->remote-ops-aux"),(function() { 
var G__106459__delegate = function (op_type,_){
return op_type;
};
var G__106459 = function (op_type,var_args){
var _ = null;
if (arguments.length > 1) {
var G__106460__i = 0, G__106460__a = new Array(arguments.length -  1);
while (G__106460__i < G__106460__a.length) {G__106460__a[G__106460__i] = arguments[G__106460__i + 1]; ++G__106460__i;}
  _ = new cljs.core.IndexedSeq(G__106460__a,0,null);
} 
return G__106459__delegate.call(this,op_type,_);};
G__106459.cljs$lang$maxFixedArity = 1;
G__106459.cljs$lang$applyTo = (function (arglist__106461){
var op_type = cljs.core.first(arglist__106461);
var _ = cljs.core.rest(arglist__106461);
return G__106459__delegate(op_type,_);
});
G__106459.cljs$core$IFn$_invoke$arity$variadic = G__106459__delegate;
return G__106459;
})()
,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
frontend.worker.rtc.client.local_db_ident_kv_ops__GT_remote_ops_aux.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"update-kv-value","update-kv-value",-1091588796),(function (_,op){
var op_value = cljs.core.last(op);
var db_ident = new cljs.core.Keyword(null,"db-ident","db-ident",-992686073).cljs$core$IFn$_invoke$arity$1(op_value);
var value = new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(op_value);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update-kv-value","update-kv-value",-1091588796),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db-ident","db-ident",-992686073),db_ident,new cljs.core.Keyword(null,"value","value",305978217),logseq.db.write_transit_str(value)], null)], null);
}));
frontend.worker.rtc.client.local_db_ident_kv_ops__GT_remote_ops_aux.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"db-ident","db-ident",-992686073),(function (_,_op){
return null;
}));
frontend.worker.rtc.client.local_db_ident_kv_ops__GT_remote_ops = (function frontend$worker$rtc$client$local_db_ident_kv_ops__GT_remote_ops(db_ident_kv_ops_map){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__106083){
var vec__106084 = p__106083;
var op_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106084,(0),null);
var op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106084,(1),null);
return frontend.worker.rtc.client.local_db_ident_kv_ops__GT_remote_ops_aux.cljs$core$IFn$_invoke$arity$2(op_type,op);
}),db_ident_kv_ops_map);
});
frontend.worker.rtc.client.gen_db_ident_kv_remote_ops = (function frontend$worker$rtc$client$gen_db_ident_kv_remote_ops(db_ident_kv_ops_map_coll){
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(frontend.worker.rtc.client.local_db_ident_kv_ops__GT_remote_ops,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([db_ident_kv_ops_map_coll], 0));
});
frontend.worker.rtc.client.merge_remove_remove_ops = (function frontend$worker$rtc$client$merge_remove_remove_ops(remote_remove_ops){
var temp__5804__auto__ = cljs.core.seq(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__106087){
var vec__106088 = p__106087;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106088,(0),null);
var map__106091 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106088,(1),null);
var map__106091__$1 = cljs.core.__destructure_map(map__106091);
var block_uuids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__106091__$1,new cljs.core.Keyword(null,"block-uuids","block-uuids",-1313492773));
return block_uuids;
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([remote_remove_ops], 0))));
if(temp__5804__auto__){
var block_uuids = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"remove","remove",-131428414),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-uuids","block-uuids",-1313492773),block_uuids], null)], null)], null);
} else {
return null;
}
});
frontend.worker.rtc.client.sort_remote_ops = (function frontend$worker$rtc$client$sort_remote_ops(block_uuid__GT_remote_ops){
var block_uuid__GT_dep_uuid = cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (p__106092){
var vec__106093 = p__106092;
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106093,(0),null);
var remote_ops = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106093,(1),null);
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(remote_ops,new cljs.core.Keyword(null,"move","move",-2110884309));
if(cljs.core.truth_(temp__5804__auto__)){
var move_op = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_uuid,new cljs.core.Keyword(null,"target-uuid","target-uuid",-603957653).cljs$core$IFn$_invoke$arity$1(move_op)], null);
} else {
return null;
}
})),block_uuid__GT_remote_ops);
var all_move_uuids = cljs.core.set(cljs.core.keys(block_uuid__GT_dep_uuid));
var sorted_uuids = (function (){var r = cljs.core.PersistentVector.EMPTY;
var rest_uuids = all_move_uuids;
var uuid = cljs.core.first(rest_uuids);
while(true){
if(cljs.core.not(uuid)){
return r;
} else {
var dep_uuid = (block_uuid__GT_dep_uuid.cljs$core$IFn$_invoke$arity$1 ? block_uuid__GT_dep_uuid.cljs$core$IFn$_invoke$arity$1(uuid) : block_uuid__GT_dep_uuid.call(null,uuid));
var temp__5802__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(rest_uuids,dep_uuid);
if(cljs.core.truth_(temp__5802__auto__)){
var next_uuid = temp__5802__auto__;
var G__106462 = r;
var G__106463 = rest_uuids;
var G__106464 = next_uuid;
r = G__106462;
rest_uuids = G__106463;
uuid = G__106464;
continue;
} else {
var rest_uuids_STAR_ = cljs.core.disj.cljs$core$IFn$_invoke$arity$2(rest_uuids,uuid);
var G__106465 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(r,uuid);
var G__106466 = rest_uuids_STAR_;
var G__106467 = cljs.core.first(rest_uuids_STAR_);
r = G__106465;
rest_uuids = G__106466;
uuid = G__106467;
continue;
}
}
break;
}
})();
var sorted_move_ops = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (block_uuid){
var G__106096 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(block_uuid__GT_remote_ops,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_uuid,new cljs.core.Keyword(null,"move","move",-2110884309)], null));
if((G__106096 == null)){
return null;
} else {
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"move","move",-2110884309),G__106096],null));
}
}),sorted_uuids);
var update_schema_ops = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__106097){
var vec__106098 = p__106097;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106098,(0),null);
var remote_ops = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106098,(1),null);
var G__106101 = new cljs.core.Keyword(null,"update-schema","update-schema",-691503438).cljs$core$IFn$_invoke$arity$1(remote_ops);
if((G__106101 == null)){
return null;
} else {
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"update-schema","update-schema",-691503438),G__106101],null));
}
}),block_uuid__GT_remote_ops);
var remove_ops = frontend.worker.rtc.client.merge_remove_remove_ops(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__106102){
var vec__106103 = p__106102;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106103,(0),null);
var remote_ops = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106103,(1),null);
var G__106106 = new cljs.core.Keyword(null,"remove","remove",-131428414).cljs$core$IFn$_invoke$arity$1(remote_ops);
if((G__106106 == null)){
return null;
} else {
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"remove","remove",-131428414),G__106106],null));
}
}),block_uuid__GT_remote_ops));
var update_ops = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__106107){
var vec__106108 = p__106107;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106108,(0),null);
var remote_ops = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106108,(1),null);
var G__106111 = new cljs.core.Keyword(null,"update","update",1045576396).cljs$core$IFn$_invoke$arity$1(remote_ops);
if((G__106111 == null)){
return null;
} else {
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"update","update",1045576396),G__106111],null));
}
}),block_uuid__GT_remote_ops);
var update_page_ops = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__106112){
var vec__106113 = p__106112;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106113,(0),null);
var remote_ops = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106113,(1),null);
var G__106116 = new cljs.core.Keyword(null,"update-page","update-page",-503479891).cljs$core$IFn$_invoke$arity$1(remote_ops);
if((G__106116 == null)){
return null;
} else {
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"update-page","update-page",-503479891),G__106116],null));
}
}),block_uuid__GT_remote_ops);
var remove_page_ops = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__106117){
var vec__106118 = p__106117;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106118,(0),null);
var remote_ops = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106118,(1),null);
var G__106121 = new cljs.core.Keyword(null,"remove-page","remove-page",-1679345876).cljs$core$IFn$_invoke$arity$1(remote_ops);
if((G__106121 == null)){
return null;
} else {
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"remove-page","remove-page",-1679345876),G__106121],null));
}
}),block_uuid__GT_remote_ops);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(update_schema_ops,update_page_ops,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([remove_ops,sorted_move_ops,update_ops,remove_page_ops], 0));
});
frontend.worker.rtc.client.rollback = (function frontend$worker$rtc$client$rollback(repo,block_ops_map_coll,db_ident_kv_ops_map_coll){
var block_ops = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (m){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__106122){
var vec__106123 = p__106122;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106123,(0),null);
var op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106123,(1),null);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),k)){
return null;
} else {
return op;
}
}),m);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block_ops_map_coll], 0));
var db_ident_kv_ops = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (m){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__106126){
var vec__106127 = p__106126;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106127,(0),null);
var op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__106127,(1),null);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword(null,"db-ident","db-ident",-992686073),k)){
return null;
} else {
return op;
}
}),m);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([db_ident_kv_ops_map_coll], 0));
frontend.worker.rtc.client_op.add_ops_BANG_(repo,block_ops);

frontend.worker.rtc.client_op.add_ops_BANG_(repo,db_ident_kv_ops);

return null;
});
/**
 * Return a task: push local updates
 */
frontend.worker.rtc.client.new_task__push_local_ops = (function frontend$worker$rtc$client$new_task__push_local_ops(repo,conn,graph_uuid,major_schema_version,date_formatter,get_ws_create_task,_STAR_remote_profile_QMARK_,add_log_fn){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr106130_block_20 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_20(cr106130_state){
try{var cr106130_place_80 = (cr106130_state[(5)]);
var cr106130_place_119 = cr106130_place_80;
var cr106130_place_120 = add_log_fn;
var cr106130_place_121 = new cljs.core.Keyword("rtc.log","push-local-update","rtc.log/push-local-update",-860881879);
var cr106130_place_122 = cr106130_place_119;
var cr106130_place_123 = (function (){var G__106237 = cr106130_place_121;
var G__106238 = cr106130_place_122;
var fexpr__106236 = cr106130_place_120;
return (fexpr__106236.cljs$core$IFn$_invoke$arity$2 ? fexpr__106236.cljs$core$IFn$_invoke$arity$2(G__106237,G__106238) : fexpr__106236.call(null,G__106237,G__106238));
})();
var cr106130_place_124 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr106130_place_125 = cr106130_place_119;
var cr106130_place_126 = cr106130_place_124.cljs$core$IFn$_invoke$arity$1(cr106130_place_125);
var cr106130_place_127 = cr106130_place_126;
var cr106130_place_128 = cljs.core.Keyword;
var cr106130_place_129 = (cr106130_place_127 instanceof cr106130_place_128);
var cr106130_place_130 = null;
if(cr106130_place_129){
(cr106130_state[(0)] = cr106130_block_22);

(cr106130_state[(5)] = null);

(cr106130_state[(5)] = cr106130_place_119);

(cr106130_state[(7)] = cr106130_place_126);

(cr106130_state[(6)] = cr106130_place_130);

return cr106130_state;
} else {
(cr106130_state[(0)] = cr106130_block_21);

(cr106130_state[(5)] = null);

(cr106130_state[(5)] = cr106130_place_119);

(cr106130_state[(6)] = cr106130_place_130);

return cr106130_state;
}
}catch (e106235){var cr106130_exception = e106235;
(cr106130_state[(0)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(3)] = null);

(cr106130_state[(5)] = null);

(cr106130_state[(1)] = null);

throw cr106130_exception;
}});
var cr106130_block_18 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_18(cr106130_state){
try{var cr106130_place_96 = null;
(cr106130_state[(0)] = cr106130_block_19);

(cr106130_state[(3)] = cr106130_place_96);

return cr106130_state;
}catch (e106239){var cr106130_exception = e106239;
(cr106130_state[(0)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(3)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(1)] = null);

throw cr106130_exception;
}});
var cr106130_block_2 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_2(cr106130_state){
try{var cr106130_place_13 = (cr106130_state[(6)]);
var cr106130_place_21 = frontend.worker.rtc.client.sort_remote_ops;
var cr106130_place_22 = cr106130_place_13;
var cr106130_place_23 = (function (){var G__106242 = cr106130_place_22;
var fexpr__106241 = cr106130_place_21;
return (fexpr__106241.cljs$core$IFn$_invoke$arity$1 ? fexpr__106241.cljs$core$IFn$_invoke$arity$1(G__106242) : fexpr__106241.call(null,G__106242));
})();
(cr106130_state[(0)] = cr106130_block_3);

(cr106130_state[(6)] = null);

(cr106130_state[(1)] = cr106130_place_23);

return cr106130_state;
}catch (e106240){var cr106130_exception = e106240;
(cr106130_state[(0)] = null);

(cr106130_state[(1)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(6)] = null);

(cr106130_state[(3)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(5)] = null);

throw cr106130_exception;
}});
var cr106130_block_4 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_4(cr106130_state){
try{var cr106130_place_31 = null;
(cr106130_state[(0)] = cr106130_block_30);

(cr106130_state[(1)] = cr106130_place_31);

return cr106130_state;
}catch (e106243){var cr106130_exception = e106243;
(cr106130_state[(0)] = null);

(cr106130_state[(1)] = null);

throw cr106130_exception;
}});
var cr106130_block_21 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_21(cr106130_state){
try{var cr106130_place_131 = null;
(cr106130_state[(0)] = cr106130_block_23);

(cr106130_state[(6)] = cr106130_place_131);

return cr106130_state;
}catch (e106244){var cr106130_exception = e106244;
(cr106130_state[(0)] = null);

(cr106130_state[(5)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(6)] = null);

(cr106130_state[(3)] = null);

(cr106130_state[(1)] = null);

throw cr106130_exception;
}});
var cr106130_block_6 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_6(cr106130_state){
try{var cr106130_place_35 = (cr106130_state[(6)]);
var cr106130_place_32 = (cr106130_state[(7)]);
var cr106130_place_38 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr106130_place_39 = get_ws_create_task;
var cr106130_place_40 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr106130_place_41 = "apply-ops";
var cr106130_place_42 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr106130_place_43 = graph_uuid;
var cr106130_place_44 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr106130_place_45 = major_schema_version;
var cr106130_place_46 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr106130_place_45);
var cr106130_place_47 = new cljs.core.Keyword(null,"ops","ops",1237330063);
var cr106130_place_48 = cr106130_place_32;
var cr106130_place_49 = new cljs.core.Keyword(null,"t-before","t-before",-507640180);
var cr106130_place_50 = cr106130_place_35;
var cr106130_place_51 = cr106130_place_50;
var cr106130_place_52 = null;
if(cljs.core.truth_(cr106130_place_51)){
(cr106130_state[(0)] = cr106130_block_8);

(cr106130_state[(6)] = null);

(cr106130_state[(7)] = null);

(cr106130_state[(6)] = cr106130_place_52);

(cr106130_state[(7)] = cr106130_place_44);

(cr106130_state[(8)] = cr106130_place_40);

(cr106130_state[(9)] = cr106130_place_41);

(cr106130_state[(18)] = cr106130_place_50);

(cr106130_state[(10)] = cr106130_place_43);

(cr106130_state[(11)] = cr106130_place_46);

(cr106130_state[(12)] = cr106130_place_47);

(cr106130_state[(13)] = cr106130_place_42);

(cr106130_state[(14)] = cr106130_place_38);

(cr106130_state[(15)] = cr106130_place_48);

(cr106130_state[(16)] = cr106130_place_39);

(cr106130_state[(17)] = cr106130_place_49);

return cr106130_state;
} else {
(cr106130_state[(0)] = cr106130_block_7);

(cr106130_state[(6)] = null);

(cr106130_state[(7)] = null);

(cr106130_state[(6)] = cr106130_place_52);

(cr106130_state[(7)] = cr106130_place_44);

(cr106130_state[(8)] = cr106130_place_40);

(cr106130_state[(9)] = cr106130_place_41);

(cr106130_state[(10)] = cr106130_place_43);

(cr106130_state[(11)] = cr106130_place_46);

(cr106130_state[(12)] = cr106130_place_47);

(cr106130_state[(13)] = cr106130_place_42);

(cr106130_state[(14)] = cr106130_place_38);

(cr106130_state[(15)] = cr106130_place_48);

(cr106130_state[(16)] = cr106130_place_39);

(cr106130_state[(17)] = cr106130_place_49);

return cr106130_state;
}
}catch (e106245){var cr106130_exception = e106245;
(cr106130_state[(0)] = cr106130_block_14);

(cr106130_state[(6)] = null);

(cr106130_state[(7)] = null);

(cr106130_state[(4)] = cr106130_exception);

return cr106130_state;
}});
var cr106130_block_11 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_11(cr106130_state){
try{var cr106130_place_55 = (cr106130_state[(7)]);
var cr106130_place_62 = cljs.core.assoc;
var cr106130_place_63 = cr106130_place_55;
var cr106130_place_64 = new cljs.core.Keyword(null,"profile","profile",-545963874);
var cr106130_place_65 = true;
var cr106130_place_66 = (function (){var G__106248 = cr106130_place_63;
var G__106249 = cr106130_place_64;
var G__106250 = cr106130_place_65;
var fexpr__106247 = cr106130_place_62;
return (fexpr__106247.cljs$core$IFn$_invoke$arity$3 ? fexpr__106247.cljs$core$IFn$_invoke$arity$3(G__106248,G__106249,G__106250) : fexpr__106247.call(null,G__106248,G__106249,G__106250));
})();
(cr106130_state[(0)] = cr106130_block_12);

(cr106130_state[(7)] = null);

(cr106130_state[(6)] = cr106130_place_66);

return cr106130_state;
}catch (e106246){var cr106130_exception = e106246;
(cr106130_state[(0)] = cr106130_block_14);

(cr106130_state[(6)] = null);

(cr106130_state[(14)] = null);

(cr106130_state[(7)] = null);

(cr106130_state[(16)] = null);

(cr106130_state[(4)] = cr106130_exception);

return cr106130_state;
}});
var cr106130_block_25 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_25(cr106130_state){
try{var cr106130_place_2 = (cr106130_state[(2)]);
var cr106130_place_5 = (cr106130_state[(3)]);
var cr106130_place_141 = frontend.worker.rtc.client.rollback;
var cr106130_place_142 = repo;
var cr106130_place_143 = cr106130_place_2;
var cr106130_place_144 = cr106130_place_5;
var cr106130_place_145 = (function (){var G__106253 = cr106130_place_142;
var G__106254 = cr106130_place_143;
var G__106255 = cr106130_place_144;
var fexpr__106252 = cr106130_place_141;
return (fexpr__106252.cljs$core$IFn$_invoke$arity$3 ? fexpr__106252.cljs$core$IFn$_invoke$arity$3(G__106253,G__106254,G__106255) : fexpr__106252.call(null,G__106253,G__106254,G__106255));
})();
var cr106130_place_146 = frontend.worker.rtc.exception.ex_remote_graph_lock_missing;
var cr106130_place_147 = (function(){throw cr106130_place_146})();
(cr106130_state[(0)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(3)] = null);

return null;
}catch (e106251){var cr106130_exception = e106251;
(cr106130_state[(0)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(3)] = null);

throw cr106130_exception;
}});
var cr106130_block_15 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_15(cr106130_state){
try{var cr106130_place_36 = (cr106130_state[(4)]);
var cr106130_place_37 = (cr106130_state[(5)]);
var cr106130_place_77 = (cljs.core.truth_(cr106130_place_37)?(function(){throw cr106130_place_36})():cr106130_place_36);
var cr106130_place_78 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr106130_place_79 = cr106130_place_77;
var cr106130_place_80 = cr106130_place_78.cljs$core$IFn$_invoke$arity$1(cr106130_place_79);
var cr106130_place_81 = cr106130_place_80;
var cr106130_place_82 = null;
if(cljs.core.truth_(cr106130_place_81)){
(cr106130_state[(0)] = cr106130_block_20);

(cr106130_state[(4)] = null);

(cr106130_state[(5)] = null);

(cr106130_state[(5)] = cr106130_place_80);

(cr106130_state[(4)] = cr106130_place_82);

return cr106130_state;
} else {
(cr106130_state[(0)] = cr106130_block_16);

(cr106130_state[(4)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(5)] = null);

(cr106130_state[(3)] = null);

(cr106130_state[(2)] = cr106130_place_77);

(cr106130_state[(4)] = cr106130_place_82);

return cr106130_state;
}
}catch (e106256){var cr106130_exception = e106256;
(cr106130_state[(0)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(5)] = null);

(cr106130_state[(3)] = null);

(cr106130_state[(1)] = null);

throw cr106130_exception;
}});
var cr106130_block_24 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_24(cr106130_state){
try{var cr106130_place_2 = (cr106130_state[(2)]);
var cr106130_place_5 = (cr106130_state[(3)]);
var cr106130_place_136 = frontend.worker.rtc.client.rollback;
var cr106130_place_137 = repo;
var cr106130_place_138 = cr106130_place_2;
var cr106130_place_139 = cr106130_place_5;
var cr106130_place_140 = (function (){var G__106259 = cr106130_place_137;
var G__106260 = cr106130_place_138;
var G__106261 = cr106130_place_139;
var fexpr__106258 = cr106130_place_136;
return (fexpr__106258.cljs$core$IFn$_invoke$arity$3 ? fexpr__106258.cljs$core$IFn$_invoke$arity$3(G__106259,G__106260,G__106261) : fexpr__106258.call(null,G__106259,G__106260,G__106261));
})();
(cr106130_state[(0)] = cr106130_block_28);

(cr106130_state[(2)] = null);

(cr106130_state[(3)] = null);

(cr106130_state[(5)] = cr106130_place_140);

return cr106130_state;
}catch (e106257){var cr106130_exception = e106257;
(cr106130_state[(0)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(5)] = null);

(cr106130_state[(3)] = null);

(cr106130_state[(1)] = null);

throw cr106130_exception;
}});
var cr106130_block_8 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_8(cr106130_state){
try{var cr106130_place_50 = (cr106130_state[(18)]);
var cr106130_place_54 = cr106130_place_50;
(cr106130_state[(0)] = cr106130_block_9);

(cr106130_state[(18)] = null);

(cr106130_state[(6)] = cr106130_place_54);

return cr106130_state;
}catch (e106262){var cr106130_exception = e106262;
(cr106130_state[(0)] = cr106130_block_14);

(cr106130_state[(6)] = null);

(cr106130_state[(7)] = null);

(cr106130_state[(8)] = null);

(cr106130_state[(9)] = null);

(cr106130_state[(18)] = null);

(cr106130_state[(10)] = null);

(cr106130_state[(11)] = null);

(cr106130_state[(12)] = null);

(cr106130_state[(13)] = null);

(cr106130_state[(14)] = null);

(cr106130_state[(15)] = null);

(cr106130_state[(16)] = null);

(cr106130_state[(17)] = null);

(cr106130_state[(4)] = cr106130_exception);

return cr106130_state;
}});
var cr106130_block_28 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_28(cr106130_state){
try{var cr106130_place_135 = (cr106130_state[(5)]);
(cr106130_state[(0)] = cr106130_block_29);

(cr106130_state[(5)] = null);

(cr106130_state[(4)] = cr106130_place_135);

return cr106130_state;
}catch (e106263){var cr106130_exception = e106263;
(cr106130_state[(0)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(5)] = null);

(cr106130_state[(1)] = null);

throw cr106130_exception;
}});
var cr106130_block_16 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_16(cr106130_state){
try{var cr106130_place_77 = (cr106130_state[(2)]);
var cr106130_place_83 = new cljs.core.Keyword(null,"t","t",-1397832519);
var cr106130_place_84 = cr106130_place_77;
var cr106130_place_85 = cr106130_place_83.cljs$core$IFn$_invoke$arity$1(cr106130_place_84);
var cr106130_place_86 = (0);
var cr106130_place_87 = (cr106130_place_85 > cr106130_place_86);
var cr106130_place_88 = null;
if(cr106130_place_87){
(cr106130_state[(0)] = cr106130_block_18);

(cr106130_state[(3)] = cr106130_place_88);

return cr106130_state;
} else {
(cr106130_state[(0)] = cr106130_block_17);

(cr106130_state[(4)] = null);

(cr106130_state[(1)] = null);

return cr106130_state;
}
}catch (e106264){var cr106130_exception = e106264;
(cr106130_state[(0)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(1)] = null);

throw cr106130_exception;
}});
var cr106130_block_23 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_23(cr106130_state){
try{var cr106130_place_130 = (cr106130_state[(6)]);
var cr106130_place_134 = cr106130_place_130;
var cr106130_place_135 = null;
var G__106266 = cr106130_place_134;
switch (G__106266) {
case "graph-lock-failed":
(cr106130_state[(0)] = cr106130_block_24);

(cr106130_state[(5)] = null);

(cr106130_state[(6)] = null);

(cr106130_state[(5)] = cr106130_place_135);

return cr106130_state;

break;
case "graph-lock-missing":
(cr106130_state[(0)] = cr106130_block_25);

(cr106130_state[(5)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(6)] = null);

(cr106130_state[(1)] = null);

return cr106130_state;

break;
case "rtc.exception/get-s3-object-failed":
(cr106130_state[(0)] = cr106130_block_26);

(cr106130_state[(5)] = null);

(cr106130_state[(6)] = null);

(cr106130_state[(5)] = cr106130_place_135);

return cr106130_state;

break;
default:
(cr106130_state[(0)] = cr106130_block_27);

(cr106130_state[(4)] = null);

(cr106130_state[(6)] = null);

(cr106130_state[(1)] = null);

return cr106130_state;

}
}catch (e106265){var cr106130_exception = e106265;
(cr106130_state[(0)] = null);

(cr106130_state[(5)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(6)] = null);

(cr106130_state[(3)] = null);

(cr106130_state[(1)] = null);

throw cr106130_exception;
}});
var cr106130_block_13 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_13(cr106130_state){
try{var cr106130_place_68 = missionary.core.unpark();
(cr106130_state[(0)] = cr106130_block_15);

(cr106130_state[(4)] = cr106130_place_68);

return cr106130_state;
}catch (e106267){var cr106130_exception = e106267;
(cr106130_state[(0)] = cr106130_block_14);

(cr106130_state[(4)] = cr106130_exception);

return cr106130_state;
}});
var cr106130_block_0 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_0(cr106130_state){
try{var cr106130_place_0 = frontend.worker.rtc.client_op.get_AMPERSAND_remove_all_block_ops;
var cr106130_place_1 = repo;
var cr106130_place_2 = (function (){var G__106270 = cr106130_place_1;
var fexpr__106269 = cr106130_place_0;
return (fexpr__106269.cljs$core$IFn$_invoke$arity$1 ? fexpr__106269.cljs$core$IFn$_invoke$arity$1(G__106270) : fexpr__106269.call(null,G__106270));
})();
var cr106130_place_3 = frontend.worker.rtc.client_op.get_AMPERSAND_remove_all_db_ident_kv_ops;
var cr106130_place_4 = repo;
var cr106130_place_5 = (function (){var G__106272 = cr106130_place_4;
var fexpr__106271 = cr106130_place_3;
return (fexpr__106271.cljs$core$IFn$_invoke$arity$1 ? fexpr__106271.cljs$core$IFn$_invoke$arity$1(G__106272) : fexpr__106271.call(null,G__106272));
})();
var cr106130_place_6 = cljs.core.not_empty;
var cr106130_place_7 = frontend.worker.rtc.client.gen_block_uuid__GT_remote_ops;
var cr106130_place_8 = cljs.core.deref;
var cr106130_place_9 = conn;
var cr106130_place_10 = (function (){var G__106274 = cr106130_place_9;
var fexpr__106273 = cr106130_place_8;
return (fexpr__106273.cljs$core$IFn$_invoke$arity$1 ? fexpr__106273.cljs$core$IFn$_invoke$arity$1(G__106274) : fexpr__106273.call(null,G__106274));
})();
var cr106130_place_11 = cr106130_place_2;
var cr106130_place_12 = (function (){var G__106276 = cr106130_place_10;
var G__106277 = cr106130_place_11;
var fexpr__106275 = cr106130_place_7;
return (fexpr__106275.cljs$core$IFn$_invoke$arity$2 ? fexpr__106275.cljs$core$IFn$_invoke$arity$2(G__106276,G__106277) : fexpr__106275.call(null,G__106276,G__106277));
})();
var cr106130_place_13 = (function (){var G__106279 = cr106130_place_12;
var fexpr__106278 = cr106130_place_6;
return (fexpr__106278.cljs$core$IFn$_invoke$arity$1 ? fexpr__106278.cljs$core$IFn$_invoke$arity$1(G__106279) : fexpr__106278.call(null,G__106279));
})();
var cr106130_place_14 = frontend.worker.rtc.client.gen_db_ident_kv_remote_ops;
var cr106130_place_15 = cr106130_place_5;
var cr106130_place_16 = (function (){var G__106281 = cr106130_place_15;
var fexpr__106280 = cr106130_place_14;
return (fexpr__106280.cljs$core$IFn$_invoke$arity$1 ? fexpr__106280.cljs$core$IFn$_invoke$arity$1(G__106281) : fexpr__106280.call(null,G__106281));
})();
var cr106130_place_17 = cljs.core.concat;
var cr106130_place_18 = cr106130_place_13;
var cr106130_place_19 = null;
if(cljs.core.truth_(cr106130_place_18)){
(cr106130_state[(0)] = cr106130_block_2);

(cr106130_state[(1)] = cr106130_place_19);

(cr106130_state[(2)] = cr106130_place_2);

(cr106130_state[(6)] = cr106130_place_13);

(cr106130_state[(3)] = cr106130_place_5);

(cr106130_state[(4)] = cr106130_place_17);

(cr106130_state[(5)] = cr106130_place_16);

return cr106130_state;
} else {
(cr106130_state[(0)] = cr106130_block_1);

(cr106130_state[(1)] = cr106130_place_19);

(cr106130_state[(2)] = cr106130_place_2);

(cr106130_state[(3)] = cr106130_place_5);

(cr106130_state[(4)] = cr106130_place_17);

(cr106130_state[(5)] = cr106130_place_16);

return cr106130_state;
}
}catch (e106268){var cr106130_exception = e106268;
(cr106130_state[(0)] = null);

throw cr106130_exception;
}});
var cr106130_block_26 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_26(cr106130_state){
try{var cr106130_place_2 = (cr106130_state[(2)]);
var cr106130_place_5 = (cr106130_state[(3)]);
var cr106130_place_148 = frontend.worker.rtc.client.rollback;
var cr106130_place_149 = repo;
var cr106130_place_150 = cr106130_place_2;
var cr106130_place_151 = cr106130_place_5;
var cr106130_place_152 = (function (){var G__106284 = cr106130_place_149;
var G__106285 = cr106130_place_150;
var G__106286 = cr106130_place_151;
var fexpr__106283 = cr106130_place_148;
return (fexpr__106283.cljs$core$IFn$_invoke$arity$3 ? fexpr__106283.cljs$core$IFn$_invoke$arity$3(G__106284,G__106285,G__106286) : fexpr__106283.call(null,G__106284,G__106285,G__106286));
})();
(cr106130_state[(0)] = cr106130_block_28);

(cr106130_state[(2)] = null);

(cr106130_state[(3)] = null);

(cr106130_state[(5)] = cr106130_place_152);

return cr106130_state;
}catch (e106282){var cr106130_exception = e106282;
(cr106130_state[(0)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(5)] = null);

(cr106130_state[(3)] = null);

(cr106130_state[(1)] = null);

throw cr106130_exception;
}});
var cr106130_block_7 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_7(cr106130_state){
try{var cr106130_place_53 = (1);
(cr106130_state[(0)] = cr106130_block_9);

(cr106130_state[(6)] = cr106130_place_53);

return cr106130_state;
}catch (e106287){var cr106130_exception = e106287;
(cr106130_state[(0)] = cr106130_block_14);

(cr106130_state[(6)] = null);

(cr106130_state[(7)] = null);

(cr106130_state[(8)] = null);

(cr106130_state[(9)] = null);

(cr106130_state[(10)] = null);

(cr106130_state[(11)] = null);

(cr106130_state[(12)] = null);

(cr106130_state[(13)] = null);

(cr106130_state[(14)] = null);

(cr106130_state[(15)] = null);

(cr106130_state[(16)] = null);

(cr106130_state[(17)] = null);

(cr106130_state[(4)] = cr106130_exception);

return cr106130_state;
}});
var cr106130_block_12 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_12(cr106130_state){
try{var cr106130_place_60 = (cr106130_state[(6)]);
var cr106130_place_38 = (cr106130_state[(14)]);
var cr106130_place_39 = (cr106130_state[(16)]);
var cr106130_place_67 = (function (){var G__106290 = cr106130_place_39;
var G__106291 = cr106130_place_60;
var fexpr__106289 = cr106130_place_38;
return (fexpr__106289.cljs$core$IFn$_invoke$arity$2 ? fexpr__106289.cljs$core$IFn$_invoke$arity$2(G__106290,G__106291) : fexpr__106289.call(null,G__106290,G__106291));
})();
(cr106130_state[(0)] = cr106130_block_13);

(cr106130_state[(6)] = null);

(cr106130_state[(14)] = null);

(cr106130_state[(16)] = null);

return missionary.core.park(cr106130_place_67);
}catch (e106288){var cr106130_exception = e106288;
(cr106130_state[(0)] = cr106130_block_14);

(cr106130_state[(6)] = null);

(cr106130_state[(14)] = null);

(cr106130_state[(16)] = null);

(cr106130_state[(4)] = cr106130_exception);

return cr106130_state;
}});
var cr106130_block_27 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_27(cr106130_state){
try{var cr106130_place_119 = (cr106130_state[(5)]);
var cr106130_place_2 = (cr106130_state[(2)]);
var cr106130_place_5 = (cr106130_state[(3)]);
var cr106130_place_153 = frontend.worker.rtc.client.rollback;
var cr106130_place_154 = repo;
var cr106130_place_155 = cr106130_place_2;
var cr106130_place_156 = cr106130_place_5;
var cr106130_place_157 = (function (){var G__106294 = cr106130_place_154;
var G__106295 = cr106130_place_155;
var G__106296 = cr106130_place_156;
var fexpr__106293 = cr106130_place_153;
return (fexpr__106293.cljs$core$IFn$_invoke$arity$3 ? fexpr__106293.cljs$core$IFn$_invoke$arity$3(G__106294,G__106295,G__106296) : fexpr__106293.call(null,G__106294,G__106295,G__106296));
})();
var cr106130_place_158 = cljs.core.ex_info;
var cr106130_place_159 = "Unavailable1";
var cr106130_place_160 = new cljs.core.Keyword(null,"remote-ex","remote-ex",231483810);
var cr106130_place_161 = cr106130_place_119;
var cr106130_place_162 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr106130_place_160,cr106130_place_161]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr106130_place_163 = (function (){var G__106298 = cr106130_place_159;
var G__106299 = cr106130_place_162;
var fexpr__106297 = cr106130_place_158;
return (fexpr__106297.cljs$core$IFn$_invoke$arity$2 ? fexpr__106297.cljs$core$IFn$_invoke$arity$2(G__106298,G__106299) : fexpr__106297.call(null,G__106298,G__106299));
})();
var cr106130_place_164 = (function(){throw cr106130_place_163})();
(cr106130_state[(0)] = null);

(cr106130_state[(5)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(3)] = null);

return null;
}catch (e106292){var cr106130_exception = e106292;
(cr106130_state[(0)] = null);

(cr106130_state[(5)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(3)] = null);

throw cr106130_exception;
}});
var cr106130_block_19 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_19(cr106130_state){
try{var cr106130_place_88 = (cr106130_state[(3)]);
var cr106130_place_77 = (cr106130_state[(2)]);
var cr106130_place_97 = frontend.worker.rtc.remote_update.apply_remote_update;
var cr106130_place_98 = graph_uuid;
var cr106130_place_99 = repo;
var cr106130_place_100 = conn;
var cr106130_place_101 = date_formatter;
var cr106130_place_102 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr106130_place_103 = new cljs.core.Keyword(null,"remote-update","remote-update",-34961368);
var cr106130_place_104 = new cljs.core.Keyword(null,"value","value",305978217);
var cr106130_place_105 = cr106130_place_77;
var cr106130_place_106 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr106130_place_102,cr106130_place_103,cr106130_place_104,cr106130_place_105]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr106130_place_107 = add_log_fn;
var cr106130_place_108 = (function (){var G__106302 = cr106130_place_98;
var G__106303 = cr106130_place_99;
var G__106304 = cr106130_place_100;
var G__106305 = cr106130_place_101;
var G__106306 = cr106130_place_106;
var G__106307 = cr106130_place_107;
var fexpr__106301 = cr106130_place_97;
return (fexpr__106301.cljs$core$IFn$_invoke$arity$6 ? fexpr__106301.cljs$core$IFn$_invoke$arity$6(G__106302,G__106303,G__106304,G__106305,G__106306,G__106307) : fexpr__106301.call(null,G__106302,G__106303,G__106304,G__106305,G__106306,G__106307));
})();
var cr106130_place_109 = new cljs.core.Keyword("rtc.log","push-local-update","rtc.log/push-local-update",-860881879);
var cr106130_place_110 = new cljs.core.Keyword(null,"remote-t","remote-t",-1375604239);
var cr106130_place_111 = new cljs.core.Keyword(null,"t","t",-1397832519);
var cr106130_place_112 = cr106130_place_77;
var cr106130_place_113 = cr106130_place_111.cljs$core$IFn$_invoke$arity$1(cr106130_place_112);
var cr106130_place_114 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr106130_place_110,cr106130_place_113]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr106130_place_115 = add_log_fn;
var cr106130_place_116 = cr106130_place_109;
var cr106130_place_117 = cr106130_place_114;
var cr106130_place_118 = (function (){var G__106309 = cr106130_place_116;
var G__106310 = cr106130_place_117;
var fexpr__106308 = cr106130_place_115;
return (fexpr__106308.cljs$core$IFn$_invoke$arity$2 ? fexpr__106308.cljs$core$IFn$_invoke$arity$2(G__106309,G__106310) : fexpr__106308.call(null,G__106309,G__106310));
})();
(cr106130_state[(0)] = cr106130_block_29);

(cr106130_state[(3)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(4)] = cr106130_place_118);

return cr106130_state;
}catch (e106300){var cr106130_exception = e106300;
(cr106130_state[(0)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(3)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(1)] = null);

throw cr106130_exception;
}});
var cr106130_block_9 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_9(cr106130_state){
try{var cr106130_place_52 = (cr106130_state[(6)]);
var cr106130_place_44 = (cr106130_state[(7)]);
var cr106130_place_40 = (cr106130_state[(8)]);
var cr106130_place_41 = (cr106130_state[(9)]);
var cr106130_place_43 = (cr106130_state[(10)]);
var cr106130_place_46 = (cr106130_state[(11)]);
var cr106130_place_47 = (cr106130_state[(12)]);
var cr106130_place_42 = (cr106130_state[(13)]);
var cr106130_place_48 = (cr106130_state[(15)]);
var cr106130_place_49 = (cr106130_state[(17)]);
var cr106130_place_55 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr106130_place_47,cr106130_place_48,cr106130_place_49,cr106130_place_52,cr106130_place_44,cr106130_place_46,cr106130_place_42,cr106130_place_43,cr106130_place_40,cr106130_place_41]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr106130_place_56 = cljs.core.deref;
var cr106130_place_57 = _STAR_remote_profile_QMARK_;
var cr106130_place_58 = (function (){var G__106313 = cr106130_place_57;
var fexpr__106312 = cr106130_place_56;
return (fexpr__106312.cljs$core$IFn$_invoke$arity$1 ? fexpr__106312.cljs$core$IFn$_invoke$arity$1(G__106313) : fexpr__106312.call(null,G__106313));
})();
var cr106130_place_59 = cr106130_place_58 === true;
var cr106130_place_60 = null;
if(cr106130_place_59){
(cr106130_state[(0)] = cr106130_block_11);

(cr106130_state[(6)] = null);

(cr106130_state[(7)] = null);

(cr106130_state[(8)] = null);

(cr106130_state[(9)] = null);

(cr106130_state[(10)] = null);

(cr106130_state[(11)] = null);

(cr106130_state[(12)] = null);

(cr106130_state[(13)] = null);

(cr106130_state[(15)] = null);

(cr106130_state[(17)] = null);

(cr106130_state[(7)] = cr106130_place_55);

(cr106130_state[(6)] = cr106130_place_60);

return cr106130_state;
} else {
(cr106130_state[(0)] = cr106130_block_10);

(cr106130_state[(6)] = null);

(cr106130_state[(7)] = null);

(cr106130_state[(8)] = null);

(cr106130_state[(9)] = null);

(cr106130_state[(10)] = null);

(cr106130_state[(11)] = null);

(cr106130_state[(12)] = null);

(cr106130_state[(13)] = null);

(cr106130_state[(15)] = null);

(cr106130_state[(17)] = null);

(cr106130_state[(7)] = cr106130_place_55);

(cr106130_state[(6)] = cr106130_place_60);

return cr106130_state;
}
}catch (e106311){var cr106130_exception = e106311;
(cr106130_state[(0)] = cr106130_block_14);

(cr106130_state[(6)] = null);

(cr106130_state[(7)] = null);

(cr106130_state[(8)] = null);

(cr106130_state[(9)] = null);

(cr106130_state[(10)] = null);

(cr106130_state[(11)] = null);

(cr106130_state[(12)] = null);

(cr106130_state[(13)] = null);

(cr106130_state[(14)] = null);

(cr106130_state[(15)] = null);

(cr106130_state[(16)] = null);

(cr106130_state[(17)] = null);

(cr106130_state[(4)] = cr106130_exception);

return cr106130_state;
}});
var cr106130_block_29 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_29(cr106130_state){
try{var cr106130_place_82 = (cr106130_state[(4)]);
(cr106130_state[(0)] = cr106130_block_30);

(cr106130_state[(4)] = null);

(cr106130_state[(1)] = cr106130_place_82);

return cr106130_state;
}catch (e106314){var cr106130_exception = e106314;
(cr106130_state[(0)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(1)] = null);

throw cr106130_exception;
}});
var cr106130_block_10 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_10(cr106130_state){
try{var cr106130_place_55 = (cr106130_state[(7)]);
var cr106130_place_61 = cr106130_place_55;
(cr106130_state[(0)] = cr106130_block_12);

(cr106130_state[(7)] = null);

(cr106130_state[(6)] = cr106130_place_61);

return cr106130_state;
}catch (e106315){var cr106130_exception = e106315;
(cr106130_state[(0)] = cr106130_block_14);

(cr106130_state[(6)] = null);

(cr106130_state[(14)] = null);

(cr106130_state[(7)] = null);

(cr106130_state[(16)] = null);

(cr106130_state[(4)] = cr106130_exception);

return cr106130_state;
}});
var cr106130_block_5 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_5(cr106130_state){
try{var cr106130_place_28 = (cr106130_state[(4)]);
var cr106130_place_32 = cr106130_place_28;
var cr106130_place_33 = frontend.worker.rtc.client_op.get_local_tx;
var cr106130_place_34 = repo;
var cr106130_place_35 = (function (){var G__106318 = cr106130_place_34;
var fexpr__106317 = cr106130_place_33;
return (fexpr__106317.cljs$core$IFn$_invoke$arity$1 ? fexpr__106317.cljs$core$IFn$_invoke$arity$1(G__106318) : fexpr__106317.call(null,G__106318));
})();
var cr106130_place_36 = null;
var cr106130_place_37 = false;
(cr106130_state[(0)] = cr106130_block_6);

(cr106130_state[(4)] = null);

(cr106130_state[(7)] = cr106130_place_32);

(cr106130_state[(6)] = cr106130_place_35);

(cr106130_state[(4)] = cr106130_place_36);

(cr106130_state[(5)] = cr106130_place_37);

return cr106130_state;
}catch (e106316){var cr106130_exception = e106316;
(cr106130_state[(0)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(3)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(1)] = null);

throw cr106130_exception;
}});
var cr106130_block_3 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_3(cr106130_state){
try{var cr106130_place_19 = (cr106130_state[(1)]);
var cr106130_place_17 = (cr106130_state[(4)]);
var cr106130_place_16 = (cr106130_state[(5)]);
var cr106130_place_24 = cr106130_place_16;
var cr106130_place_25 = (function (){var G__106321 = cr106130_place_19;
var G__106322 = cr106130_place_24;
var fexpr__106320 = cr106130_place_17;
return (fexpr__106320.cljs$core$IFn$_invoke$arity$2 ? fexpr__106320.cljs$core$IFn$_invoke$arity$2(G__106321,G__106322) : fexpr__106320.call(null,G__106321,G__106322));
})();
var cr106130_place_26 = frontend.worker.rtc.malli_schema.to_ws_ops_decoder;
var cr106130_place_27 = cr106130_place_25;
var cr106130_place_28 = (function (){var G__106324 = cr106130_place_27;
var fexpr__106323 = cr106130_place_26;
return (fexpr__106323.cljs$core$IFn$_invoke$arity$1 ? fexpr__106323.cljs$core$IFn$_invoke$arity$1(G__106324) : fexpr__106323.call(null,G__106324));
})();
var cr106130_place_29 = cr106130_place_28;
var cr106130_place_30 = null;
if(cljs.core.truth_(cr106130_place_29)){
(cr106130_state[(0)] = cr106130_block_5);

(cr106130_state[(1)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(5)] = null);

(cr106130_state[(4)] = cr106130_place_28);

(cr106130_state[(1)] = cr106130_place_30);

return cr106130_state;
} else {
(cr106130_state[(0)] = cr106130_block_4);

(cr106130_state[(1)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(3)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(5)] = null);

(cr106130_state[(1)] = cr106130_place_30);

return cr106130_state;
}
}catch (e106319){var cr106130_exception = e106319;
(cr106130_state[(0)] = null);

(cr106130_state[(1)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(3)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(5)] = null);

throw cr106130_exception;
}});
var cr106130_block_30 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_30(cr106130_state){
try{var cr106130_place_30 = (cr106130_state[(1)]);
(cr106130_state[(0)] = null);

(cr106130_state[(1)] = null);

return cr106130_place_30;
}catch (e106325){var cr106130_exception = e106325;
(cr106130_state[(0)] = null);

(cr106130_state[(1)] = null);

throw cr106130_exception;
}});
var cr106130_block_17 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_17(cr106130_state){
try{var cr106130_place_77 = (cr106130_state[(2)]);
var cr106130_place_89 = "Assert failed: ";
var cr106130_place_90 = cr106130_place_77;
var cr106130_place_91 = "\n";
var cr106130_place_92 = "(pos? (:t r))";
var cr106130_place_93 = [cr106130_place_89,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr106130_place_90),cr106130_place_91,cr106130_place_92].join('');
var cr106130_place_94 = (new Error(cr106130_place_93));
var cr106130_place_95 = (function(){throw cr106130_place_94})();
(cr106130_state[(0)] = null);

(cr106130_state[(2)] = null);

return null;
}catch (e106326){var cr106130_exception = e106326;
(cr106130_state[(0)] = null);

(cr106130_state[(2)] = null);

throw cr106130_exception;
}});
var cr106130_block_22 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_22(cr106130_state){
try{var cr106130_place_126 = (cr106130_state[(7)]);
var cr106130_place_132 = cr106130_place_126;
var cr106130_place_133 = cr106130_place_132.fqn;
(cr106130_state[(0)] = cr106130_block_23);

(cr106130_state[(7)] = null);

(cr106130_state[(6)] = cr106130_place_133);

return cr106130_state;
}catch (e106327){var cr106130_exception = e106327;
(cr106130_state[(0)] = null);

(cr106130_state[(5)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(7)] = null);

(cr106130_state[(6)] = null);

(cr106130_state[(3)] = null);

(cr106130_state[(1)] = null);

throw cr106130_exception;
}});
var cr106130_block_1 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_1(cr106130_state){
try{var cr106130_place_20 = null;
(cr106130_state[(0)] = cr106130_block_3);

(cr106130_state[(1)] = cr106130_place_20);

return cr106130_state;
}catch (e106328){var cr106130_exception = e106328;
(cr106130_state[(0)] = null);

(cr106130_state[(1)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(3)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(5)] = null);

throw cr106130_exception;
}});
var cr106130_block_14 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr106130_block_14(cr106130_state){
try{var cr106130_place_36 = (cr106130_state[(4)]);
var cr106130_place_2 = (cr106130_state[(2)]);
var cr106130_place_5 = (cr106130_state[(3)]);
var cr106130_place_69 = cr106130_place_36;
var cr106130_place_70 = frontend.worker.rtc.client.rollback;
var cr106130_place_71 = repo;
var cr106130_place_72 = cr106130_place_2;
var cr106130_place_73 = cr106130_place_5;
var cr106130_place_74 = (function (){var G__106331 = cr106130_place_71;
var G__106332 = cr106130_place_72;
var G__106333 = cr106130_place_73;
var fexpr__106330 = cr106130_place_70;
return (fexpr__106330.cljs$core$IFn$_invoke$arity$3 ? fexpr__106330.cljs$core$IFn$_invoke$arity$3(G__106331,G__106332,G__106333) : fexpr__106330.call(null,G__106331,G__106332,G__106333));
})();
var cr106130_place_75 = cr106130_place_69;
var cr106130_place_76 = (function(){throw cr106130_place_75})();
(cr106130_state[(0)] = null);

(cr106130_state[(4)] = null);

(cr106130_state[(2)] = null);

(cr106130_state[(5)] = null);

(cr106130_state[(3)] = null);

(cr106130_state[(1)] = null);

return null;
}catch (e106329){var cr106130_exception = e106329;
(cr106130_state[(0)] = cr106130_block_15);

(cr106130_state[(4)] = cr106130_exception);

(cr106130_state[(5)] = true);

return cr106130_state;
}});
return cloroutine.impl.coroutine((function (){var G__106334 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((19));
(G__106334[(0)] = cr106130_block_0);

return G__106334;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.client.new_task__pull_remote_data = (function frontend$worker$rtc$client$new_task__pull_remote_data(repo,conn,graph_uuid,major_schema_version,date_formatter,get_ws_create_task,add_log_fn){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr106335_block_6 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr106335_block_6(cr106335_state){
try{var cr106335_place_22 = (cr106335_state[(2)]);
var cr106335_place_34 = "Assert failed: ";
var cr106335_place_35 = cr106335_place_22;
var cr106335_place_36 = "\n";
var cr106335_place_37 = "(pos? (:t r))";
var cr106335_place_38 = [cr106335_place_34,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr106335_place_35),cr106335_place_36,cr106335_place_37].join('');
var cr106335_place_39 = (new Error(cr106335_place_38));
var cr106335_place_40 = (function(){throw cr106335_place_39})();
(cr106335_state[(0)] = null);

(cr106335_state[(2)] = null);

return null;
}catch (e106386){var cr106335_exception = e106386;
(cr106335_state[(0)] = null);

(cr106335_state[(2)] = null);

throw cr106335_exception;
}});
var cr106335_block_14 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr106335_block_14(cr106335_state){
try{var cr106335_place_92 = frontend.worker.rtc.exception.ex_remote_graph_lock_missing;
var cr106335_place_93 = (function(){throw cr106335_place_92})();
(cr106335_state[(0)] = null);

return null;
}catch (e106387){var cr106335_exception = e106387;
(cr106335_state[(0)] = null);

throw cr106335_exception;
}});
var cr106335_block_10 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr106335_block_10(cr106335_state){
try{var cr106335_place_86 = null;
(cr106335_state[(0)] = cr106335_block_12);

(cr106335_state[(2)] = cr106335_place_86);

return cr106335_state;
}catch (e106388){var cr106335_exception = e106388;
(cr106335_state[(0)] = null);

(cr106335_state[(2)] = null);

(cr106335_state[(1)] = null);

(cr106335_state[(3)] = null);

throw cr106335_exception;
}});
var cr106335_block_15 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr106335_block_15(cr106335_state){
try{var cr106335_place_94 = null;
(cr106335_state[(0)] = cr106335_block_17);

(cr106335_state[(2)] = cr106335_place_94);

return cr106335_state;
}catch (e106389){var cr106335_exception = e106389;
(cr106335_state[(0)] = null);

(cr106335_state[(2)] = null);

(cr106335_state[(1)] = null);

throw cr106335_exception;
}});
var cr106335_block_17 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr106335_block_17(cr106335_state){
try{var cr106335_place_90 = (cr106335_state[(2)]);
(cr106335_state[(0)] = cr106335_block_18);

(cr106335_state[(2)] = null);

(cr106335_state[(1)] = cr106335_place_90);

return cr106335_state;
}catch (e106390){var cr106335_exception = e106390;
(cr106335_state[(0)] = null);

(cr106335_state[(2)] = null);

(cr106335_state[(1)] = null);

throw cr106335_exception;
}});
var cr106335_block_3 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr106335_block_3(cr106335_state){
try{var cr106335_place_11 = (cr106335_state[(1)]);
var cr106335_place_4 = (cr106335_state[(2)]);
var cr106335_place_6 = (cr106335_state[(4)]);
var cr106335_place_9 = (cr106335_state[(5)]);
var cr106335_place_8 = (cr106335_state[(6)]);
var cr106335_place_7 = (cr106335_state[(7)]);
var cr106335_place_13 = (cr106335_state[(8)]);
var cr106335_place_12 = (cr106335_state[(9)]);
var cr106335_place_3 = (cr106335_state[(10)]);
var cr106335_place_17 = (cr106335_state[(11)]);
var cr106335_place_14 = (cr106335_state[(12)]);
var cr106335_place_5 = (cr106335_state[(13)]);
var cr106335_place_20 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr106335_place_7,cr106335_place_8,cr106335_place_12,cr106335_place_13,cr106335_place_5,cr106335_place_6,cr106335_place_9,cr106335_place_11,cr106335_place_14,cr106335_place_17]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr106335_place_21 = (function (){var G__106393 = cr106335_place_4;
var G__106394 = cr106335_place_20;
var fexpr__106392 = cr106335_place_3;
return (fexpr__106392.cljs$core$IFn$_invoke$arity$2 ? fexpr__106392.cljs$core$IFn$_invoke$arity$2(G__106393,G__106394) : fexpr__106392.call(null,G__106393,G__106394));
})();
(cr106335_state[(0)] = cr106335_block_4);

(cr106335_state[(1)] = null);

(cr106335_state[(2)] = null);

(cr106335_state[(4)] = null);

(cr106335_state[(5)] = null);

(cr106335_state[(6)] = null);

(cr106335_state[(7)] = null);

(cr106335_state[(8)] = null);

(cr106335_state[(9)] = null);

(cr106335_state[(10)] = null);

(cr106335_state[(11)] = null);

(cr106335_state[(12)] = null);

(cr106335_state[(13)] = null);

return missionary.core.park(cr106335_place_21);
}catch (e106391){var cr106335_exception = e106391;
(cr106335_state[(0)] = null);

(cr106335_state[(1)] = null);

(cr106335_state[(2)] = null);

(cr106335_state[(3)] = null);

(cr106335_state[(4)] = null);

(cr106335_state[(5)] = null);

(cr106335_state[(6)] = null);

(cr106335_state[(7)] = null);

(cr106335_state[(8)] = null);

(cr106335_state[(9)] = null);

(cr106335_state[(10)] = null);

(cr106335_state[(11)] = null);

(cr106335_state[(12)] = null);

(cr106335_state[(13)] = null);

throw cr106335_exception;
}});
var cr106335_block_12 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr106335_block_12(cr106335_state){
try{var cr106335_place_85 = (cr106335_state[(2)]);
var cr106335_place_89 = cr106335_place_85;
var cr106335_place_90 = null;
var G__106396 = cr106335_place_89;
switch (G__106396) {
case "graph-lock-failed":
(cr106335_state[(0)] = cr106335_block_13);

(cr106335_state[(2)] = null);

(cr106335_state[(3)] = null);

(cr106335_state[(2)] = cr106335_place_90);

return cr106335_state;

break;
case "graph-lock-missing":
(cr106335_state[(0)] = cr106335_block_14);

(cr106335_state[(2)] = null);

(cr106335_state[(1)] = null);

(cr106335_state[(3)] = null);

return cr106335_state;

break;
case "rtc.exception/get-s3-object-failed":
(cr106335_state[(0)] = cr106335_block_15);

(cr106335_state[(2)] = null);

(cr106335_state[(3)] = null);

(cr106335_state[(2)] = cr106335_place_90);

return cr106335_state;

break;
default:
(cr106335_state[(0)] = cr106335_block_16);

(cr106335_state[(2)] = null);

(cr106335_state[(1)] = null);

return cr106335_state;

}
}catch (e106395){var cr106335_exception = e106395;
(cr106335_state[(0)] = null);

(cr106335_state[(2)] = null);

(cr106335_state[(1)] = null);

(cr106335_state[(3)] = null);

throw cr106335_exception;
}});
var cr106335_block_11 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr106335_block_11(cr106335_state){
try{var cr106335_place_81 = (cr106335_state[(4)]);
var cr106335_place_87 = cr106335_place_81;
var cr106335_place_88 = cr106335_place_87.fqn;
(cr106335_state[(0)] = cr106335_block_12);

(cr106335_state[(4)] = null);

(cr106335_state[(2)] = cr106335_place_88);

return cr106335_state;
}catch (e106397){var cr106335_exception = e106397;
(cr106335_state[(0)] = null);

(cr106335_state[(2)] = null);

(cr106335_state[(1)] = null);

(cr106335_state[(4)] = null);

(cr106335_state[(3)] = null);

throw cr106335_exception;
}});
var cr106335_block_7 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr106335_block_7(cr106335_state){
try{var cr106335_place_41 = null;
(cr106335_state[(0)] = cr106335_block_8);

(cr106335_state[(4)] = cr106335_place_41);

return cr106335_state;
}catch (e106398){var cr106335_exception = e106398;
(cr106335_state[(0)] = null);

(cr106335_state[(3)] = null);

(cr106335_state[(1)] = null);

(cr106335_state[(2)] = null);

(cr106335_state[(4)] = null);

throw cr106335_exception;
}});
var cr106335_block_13 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr106335_block_13(cr106335_state){
try{var cr106335_place_91 = null;
(cr106335_state[(0)] = cr106335_block_17);

(cr106335_state[(2)] = cr106335_place_91);

return cr106335_state;
}catch (e106399){var cr106335_exception = e106399;
(cr106335_state[(0)] = null);

(cr106335_state[(2)] = null);

(cr106335_state[(1)] = null);

throw cr106335_exception;
}});
var cr106335_block_2 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr106335_block_2(cr106335_state){
try{var cr106335_place_15 = (cr106335_state[(14)]);
var cr106335_place_19 = cr106335_place_15;
(cr106335_state[(0)] = cr106335_block_3);

(cr106335_state[(14)] = null);

(cr106335_state[(11)] = cr106335_place_19);

return cr106335_state;
}catch (e106400){var cr106335_exception = e106400;
(cr106335_state[(0)] = null);

(cr106335_state[(1)] = null);

(cr106335_state[(2)] = null);

(cr106335_state[(3)] = null);

(cr106335_state[(4)] = null);

(cr106335_state[(5)] = null);

(cr106335_state[(6)] = null);

(cr106335_state[(7)] = null);

(cr106335_state[(8)] = null);

(cr106335_state[(9)] = null);

(cr106335_state[(14)] = null);

(cr106335_state[(10)] = null);

(cr106335_state[(11)] = null);

(cr106335_state[(12)] = null);

(cr106335_state[(13)] = null);

throw cr106335_exception;
}});
var cr106335_block_5 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr106335_block_5(cr106335_state){
try{var cr106335_place_22 = (cr106335_state[(2)]);
var cr106335_place_28 = new cljs.core.Keyword(null,"t","t",-1397832519);
var cr106335_place_29 = cr106335_place_22;
var cr106335_place_30 = cr106335_place_28.cljs$core$IFn$_invoke$arity$1(cr106335_place_29);
var cr106335_place_31 = (0);
var cr106335_place_32 = (cr106335_place_30 > cr106335_place_31);
var cr106335_place_33 = null;
if(cr106335_place_32){
(cr106335_state[(0)] = cr106335_block_7);

(cr106335_state[(4)] = cr106335_place_33);

return cr106335_state;
} else {
(cr106335_state[(0)] = cr106335_block_6);

(cr106335_state[(3)] = null);

(cr106335_state[(1)] = null);

return cr106335_state;
}
}catch (e106401){var cr106335_exception = e106401;
(cr106335_state[(0)] = null);

(cr106335_state[(3)] = null);

(cr106335_state[(1)] = null);

(cr106335_state[(2)] = null);

throw cr106335_exception;
}});
var cr106335_block_8 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr106335_block_8(cr106335_state){
try{var cr106335_place_2 = (cr106335_state[(3)]);
var cr106335_place_22 = (cr106335_state[(2)]);
var cr106335_place_33 = (cr106335_state[(4)]);
var cr106335_place_42 = frontend.worker.rtc.remote_update.apply_remote_update;
var cr106335_place_43 = graph_uuid;
var cr106335_place_44 = repo;
var cr106335_place_45 = conn;
var cr106335_place_46 = date_formatter;
var cr106335_place_47 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr106335_place_48 = new cljs.core.Keyword(null,"remote-update","remote-update",-34961368);
var cr106335_place_49 = new cljs.core.Keyword(null,"value","value",305978217);
var cr106335_place_50 = cr106335_place_22;
var cr106335_place_51 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr106335_place_47,cr106335_place_48,cr106335_place_49,cr106335_place_50]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr106335_place_52 = add_log_fn;
var cr106335_place_53 = (function (){var G__106404 = cr106335_place_43;
var G__106405 = cr106335_place_44;
var G__106406 = cr106335_place_45;
var G__106407 = cr106335_place_46;
var G__106408 = cr106335_place_51;
var G__106409 = cr106335_place_52;
var fexpr__106403 = cr106335_place_42;
return (fexpr__106403.cljs$core$IFn$_invoke$arity$6 ? fexpr__106403.cljs$core$IFn$_invoke$arity$6(G__106404,G__106405,G__106406,G__106407,G__106408,G__106409) : fexpr__106403.call(null,G__106404,G__106405,G__106406,G__106407,G__106408,G__106409));
})();
var cr106335_place_54 = new cljs.core.Keyword("rtc.log","push-local-update","rtc.log/push-local-update",-860881879);
var cr106335_place_55 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr106335_place_56 = new cljs.core.Keyword(null,"pull-remote-data","pull-remote-data",57037214);
var cr106335_place_57 = new cljs.core.Keyword(null,"remote-t","remote-t",-1375604239);
var cr106335_place_58 = new cljs.core.Keyword(null,"t","t",-1397832519);
var cr106335_place_59 = cr106335_place_22;
var cr106335_place_60 = cr106335_place_58.cljs$core$IFn$_invoke$arity$1(cr106335_place_59);
var cr106335_place_61 = new cljs.core.Keyword(null,"local-t","local-t",-2128577077);
var cr106335_place_62 = cr106335_place_2;
var cr106335_place_63 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr106335_place_57,cr106335_place_60,cr106335_place_55,cr106335_place_56,cr106335_place_61,cr106335_place_62]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr106335_place_64 = add_log_fn;
var cr106335_place_65 = cr106335_place_54;
var cr106335_place_66 = cr106335_place_63;
var cr106335_place_67 = (function (){var G__106411 = cr106335_place_65;
var G__106412 = cr106335_place_66;
var fexpr__106410 = cr106335_place_64;
return (fexpr__106410.cljs$core$IFn$_invoke$arity$2 ? fexpr__106410.cljs$core$IFn$_invoke$arity$2(G__106411,G__106412) : fexpr__106410.call(null,G__106411,G__106412));
})();
(cr106335_state[(0)] = cr106335_block_18);

(cr106335_state[(3)] = null);

(cr106335_state[(2)] = null);

(cr106335_state[(4)] = null);

(cr106335_state[(1)] = cr106335_place_67);

return cr106335_state;
}catch (e106402){var cr106335_exception = e106402;
(cr106335_state[(0)] = null);

(cr106335_state[(3)] = null);

(cr106335_state[(1)] = null);

(cr106335_state[(2)] = null);

(cr106335_state[(4)] = null);

throw cr106335_exception;
}});
var cr106335_block_4 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr106335_block_4(cr106335_state){
try{var cr106335_place_22 = missionary.core.unpark();
var cr106335_place_23 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr106335_place_24 = cr106335_place_22;
var cr106335_place_25 = cr106335_place_23.cljs$core$IFn$_invoke$arity$1(cr106335_place_24);
var cr106335_place_26 = cr106335_place_25;
var cr106335_place_27 = null;
if(cljs.core.truth_(cr106335_place_26)){
(cr106335_state[(0)] = cr106335_block_9);

(cr106335_state[(3)] = null);

(cr106335_state[(2)] = cr106335_place_25);

(cr106335_state[(1)] = cr106335_place_27);

return cr106335_state;
} else {
(cr106335_state[(0)] = cr106335_block_5);

(cr106335_state[(2)] = cr106335_place_22);

(cr106335_state[(1)] = cr106335_place_27);

return cr106335_state;
}
}catch (e106413){var cr106335_exception = e106413;
(cr106335_state[(0)] = null);

(cr106335_state[(3)] = null);

throw cr106335_exception;
}});
var cr106335_block_0 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr106335_block_0(cr106335_state){
try{var cr106335_place_0 = frontend.worker.rtc.client_op.get_local_tx;
var cr106335_place_1 = repo;
var cr106335_place_2 = (function (){var G__106416 = cr106335_place_1;
var fexpr__106415 = cr106335_place_0;
return (fexpr__106415.cljs$core$IFn$_invoke$arity$1 ? fexpr__106415.cljs$core$IFn$_invoke$arity$1(G__106416) : fexpr__106415.call(null,G__106416));
})();
var cr106335_place_3 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr106335_place_4 = get_ws_create_task;
var cr106335_place_5 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr106335_place_6 = "apply-ops";
var cr106335_place_7 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr106335_place_8 = graph_uuid;
var cr106335_place_9 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr106335_place_10 = major_schema_version;
var cr106335_place_11 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr106335_place_10);
var cr106335_place_12 = new cljs.core.Keyword(null,"ops","ops",1237330063);
var cr106335_place_13 = cljs.core.with_meta(cljs.core.PersistentVector.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr106335_place_14 = new cljs.core.Keyword(null,"t-before","t-before",-507640180);
var cr106335_place_15 = cr106335_place_2;
var cr106335_place_16 = cr106335_place_15;
var cr106335_place_17 = null;
if(cljs.core.truth_(cr106335_place_16)){
(cr106335_state[(0)] = cr106335_block_2);

(cr106335_state[(1)] = cr106335_place_11);

(cr106335_state[(2)] = cr106335_place_4);

(cr106335_state[(3)] = cr106335_place_2);

(cr106335_state[(4)] = cr106335_place_6);

(cr106335_state[(5)] = cr106335_place_9);

(cr106335_state[(6)] = cr106335_place_8);

(cr106335_state[(7)] = cr106335_place_7);

(cr106335_state[(8)] = cr106335_place_13);

(cr106335_state[(9)] = cr106335_place_12);

(cr106335_state[(14)] = cr106335_place_15);

(cr106335_state[(10)] = cr106335_place_3);

(cr106335_state[(11)] = cr106335_place_17);

(cr106335_state[(12)] = cr106335_place_14);

(cr106335_state[(13)] = cr106335_place_5);

return cr106335_state;
} else {
(cr106335_state[(0)] = cr106335_block_1);

(cr106335_state[(1)] = cr106335_place_11);

(cr106335_state[(2)] = cr106335_place_4);

(cr106335_state[(3)] = cr106335_place_2);

(cr106335_state[(4)] = cr106335_place_6);

(cr106335_state[(5)] = cr106335_place_9);

(cr106335_state[(6)] = cr106335_place_8);

(cr106335_state[(7)] = cr106335_place_7);

(cr106335_state[(8)] = cr106335_place_13);

(cr106335_state[(9)] = cr106335_place_12);

(cr106335_state[(10)] = cr106335_place_3);

(cr106335_state[(11)] = cr106335_place_17);

(cr106335_state[(12)] = cr106335_place_14);

(cr106335_state[(13)] = cr106335_place_5);

return cr106335_state;
}
}catch (e106414){var cr106335_exception = e106414;
(cr106335_state[(0)] = null);

throw cr106335_exception;
}});
var cr106335_block_16 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr106335_block_16(cr106335_state){
try{var cr106335_place_68 = (cr106335_state[(3)]);
var cr106335_place_95 = cljs.core.ex_info;
var cr106335_place_96 = "Unavailable3";
var cr106335_place_97 = new cljs.core.Keyword(null,"remote-ex","remote-ex",231483810);
var cr106335_place_98 = cr106335_place_68;
var cr106335_place_99 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr106335_place_97,cr106335_place_98]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr106335_place_100 = (function (){var G__106419 = cr106335_place_96;
var G__106420 = cr106335_place_99;
var fexpr__106418 = cr106335_place_95;
return (fexpr__106418.cljs$core$IFn$_invoke$arity$2 ? fexpr__106418.cljs$core$IFn$_invoke$arity$2(G__106419,G__106420) : fexpr__106418.call(null,G__106419,G__106420));
})();
var cr106335_place_101 = (function(){throw cr106335_place_100})();
(cr106335_state[(0)] = null);

(cr106335_state[(3)] = null);

return null;
}catch (e106417){var cr106335_exception = e106417;
(cr106335_state[(0)] = null);

(cr106335_state[(3)] = null);

throw cr106335_exception;
}});
var cr106335_block_9 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr106335_block_9(cr106335_state){
try{var cr106335_place_25 = (cr106335_state[(2)]);
var cr106335_place_68 = cr106335_place_25;
var cr106335_place_69 = new cljs.core.Keyword("rtc.log","push-local-update","rtc.log/push-local-update",-860881879);
var cr106335_place_70 = cljs.core.assoc;
var cr106335_place_71 = cr106335_place_68;
var cr106335_place_72 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr106335_place_73 = new cljs.core.Keyword(null,"pull-remote-data","pull-remote-data",57037214);
var cr106335_place_74 = (function (){var G__106423 = cr106335_place_71;
var G__106424 = cr106335_place_72;
var G__106425 = cr106335_place_73;
var fexpr__106422 = cr106335_place_70;
return (fexpr__106422.cljs$core$IFn$_invoke$arity$3 ? fexpr__106422.cljs$core$IFn$_invoke$arity$3(G__106423,G__106424,G__106425) : fexpr__106422.call(null,G__106423,G__106424,G__106425));
})();
var cr106335_place_75 = add_log_fn;
var cr106335_place_76 = cr106335_place_69;
var cr106335_place_77 = cr106335_place_74;
var cr106335_place_78 = (function (){var G__106427 = cr106335_place_76;
var G__106428 = cr106335_place_77;
var fexpr__106426 = cr106335_place_75;
return (fexpr__106426.cljs$core$IFn$_invoke$arity$2 ? fexpr__106426.cljs$core$IFn$_invoke$arity$2(G__106427,G__106428) : fexpr__106426.call(null,G__106427,G__106428));
})();
var cr106335_place_79 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr106335_place_80 = cr106335_place_68;
var cr106335_place_81 = cr106335_place_79.cljs$core$IFn$_invoke$arity$1(cr106335_place_80);
var cr106335_place_82 = cr106335_place_81;
var cr106335_place_83 = cljs.core.Keyword;
var cr106335_place_84 = (cr106335_place_82 instanceof cr106335_place_83);
var cr106335_place_85 = null;
if(cr106335_place_84){
(cr106335_state[(0)] = cr106335_block_11);

(cr106335_state[(2)] = null);

(cr106335_state[(2)] = cr106335_place_85);

(cr106335_state[(4)] = cr106335_place_81);

(cr106335_state[(3)] = cr106335_place_68);

return cr106335_state;
} else {
(cr106335_state[(0)] = cr106335_block_10);

(cr106335_state[(2)] = null);

(cr106335_state[(2)] = cr106335_place_85);

(cr106335_state[(3)] = cr106335_place_68);

return cr106335_state;
}
}catch (e106421){var cr106335_exception = e106421;
(cr106335_state[(0)] = null);

(cr106335_state[(2)] = null);

(cr106335_state[(1)] = null);

throw cr106335_exception;
}});
var cr106335_block_1 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr106335_block_1(cr106335_state){
try{var cr106335_place_18 = (1);
(cr106335_state[(0)] = cr106335_block_3);

(cr106335_state[(11)] = cr106335_place_18);

return cr106335_state;
}catch (e106429){var cr106335_exception = e106429;
(cr106335_state[(0)] = null);

(cr106335_state[(1)] = null);

(cr106335_state[(2)] = null);

(cr106335_state[(3)] = null);

(cr106335_state[(4)] = null);

(cr106335_state[(5)] = null);

(cr106335_state[(6)] = null);

(cr106335_state[(7)] = null);

(cr106335_state[(8)] = null);

(cr106335_state[(9)] = null);

(cr106335_state[(10)] = null);

(cr106335_state[(11)] = null);

(cr106335_state[(12)] = null);

(cr106335_state[(13)] = null);

throw cr106335_exception;
}});
var cr106335_block_18 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr106335_block_18(cr106335_state){
try{var cr106335_place_27 = (cr106335_state[(1)]);
(cr106335_state[(0)] = null);

(cr106335_state[(1)] = null);

return cr106335_place_27;
}catch (e106430){var cr106335_exception = e106430;
(cr106335_state[(0)] = null);

(cr106335_state[(1)] = null);

throw cr106335_exception;
}});
return cloroutine.impl.coroutine((function (){var G__106431 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((15));
(G__106431[(0)] = cr106335_block_0);

return G__106431;
})());
})(),missionary.core.sp_run);
});

//# sourceMappingURL=frontend.worker.rtc.client.js.map
