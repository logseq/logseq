goog.provide('frontend.worker.rtc.client');
frontend.worker.rtc.client.new_task__register_graph_updates = (function frontend$worker$rtc$client$new_task__register_graph_updates(get_ws_create_task,graph_uuid,major_schema_version,repo){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr137644_block_0 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr137644_block_0(cr137644_state){
try{var cr137644_place_0 = null;
var cr137644_place_1 = false;
(cr137644_state[(0)] = cr137644_block_1);

(cr137644_state[(1)] = cr137644_place_0);

(cr137644_state[(2)] = cr137644_place_1);

return cr137644_state;
}catch (e137787){var cr137644_exception = e137787;
(cr137644_state[(0)] = null);

throw cr137644_exception;
}});
var cr137644_block_1 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr137644_block_1(cr137644_state){
try{var cr137644_place_2 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr137644_place_3 = get_ws_create_task;
var cr137644_place_4 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr137644_place_5 = "register-graph-updates";
var cr137644_place_6 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr137644_place_7 = graph_uuid;
var cr137644_place_8 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr137644_place_9 = major_schema_version;
var cr137644_place_10 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr137644_place_9);
var cr137644_place_11 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr137644_place_8,cr137644_place_10,cr137644_place_4,cr137644_place_5,cr137644_place_6,cr137644_place_7]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr137644_place_12 = (function (){var G__137790 = cr137644_place_3;
var G__137791 = cr137644_place_11;
var fexpr__137789 = cr137644_place_2;
return (fexpr__137789.cljs$core$IFn$_invoke$arity$2 ? fexpr__137789.cljs$core$IFn$_invoke$arity$2(G__137790,G__137791) : fexpr__137789.call(null,G__137790,G__137791));
})();
(cr137644_state[(0)] = cr137644_block_2);

return missionary.core.park(cr137644_place_12);
}catch (e137788){var cr137644_exception = e137788;
(cr137644_state[(0)] = cr137644_block_6);

(cr137644_state[(1)] = cr137644_exception);

return cr137644_state;
}});
var cr137644_block_7 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr137644_block_7(cr137644_state){
try{var cr137644_place_36 = (cr137644_state[(3)]);
var cr137644_place_46 = cr137644_place_36;
var cr137644_place_47 = (function(){throw cr137644_place_46})();
(cr137644_state[(0)] = null);

(cr137644_state[(1)] = null);

(cr137644_state[(3)] = null);

(cr137644_state[(2)] = null);

return null;
}catch (e137792){var cr137644_exception = e137792;
(cr137644_state[(0)] = cr137644_block_9);

(cr137644_state[(3)] = null);

(cr137644_state[(2)] = true);

(cr137644_state[(1)] = cr137644_exception);

return cr137644_state;
}});
var cr137644_block_9 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr137644_block_9(cr137644_state){
try{var cr137644_place_0 = (cr137644_state[(1)]);
var cr137644_place_1 = (cr137644_state[(2)]);
var cr137644_place_56 = (cljs.core.truth_(cr137644_place_1)?(function(){throw cr137644_place_0})():cr137644_place_0);
(cr137644_state[(0)] = null);

(cr137644_state[(1)] = null);

(cr137644_state[(2)] = null);

return cr137644_place_56;
}catch (e137793){var cr137644_exception = e137793;
(cr137644_state[(0)] = null);

(cr137644_state[(1)] = null);

(cr137644_state[(2)] = null);

throw cr137644_exception;
}});
var cr137644_block_5 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr137644_block_5(cr137644_state){
try{var cr137644_place_29 = (cr137644_state[(3)]);
var cr137644_place_17 = (cr137644_state[(5)]);
var cr137644_place_35 = cr137644_place_17;
(cr137644_state[(0)] = cr137644_block_9);

(cr137644_state[(3)] = null);

(cr137644_state[(5)] = null);

(cr137644_state[(1)] = cr137644_place_35);

return cr137644_state;
}catch (e137794){var cr137644_exception = e137794;
(cr137644_state[(0)] = cr137644_block_6);

(cr137644_state[(3)] = null);

(cr137644_state[(5)] = null);

(cr137644_state[(1)] = cr137644_exception);

return cr137644_state;
}});
var cr137644_block_6 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr137644_block_6(cr137644_state){
try{var cr137644_place_0 = (cr137644_state[(1)]);
var cr137644_place_36 = cr137644_place_0;
var cr137644_place_37 = cljs.core._EQ_;
var cr137644_place_38 = new cljs.core.Keyword("rtc.exception","remote-graph-not-ready","rtc.exception/remote-graph-not-ready",980605069);
var cr137644_place_39 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr137644_place_40 = cljs.core.ex_data;
var cr137644_place_41 = cr137644_place_36;
var cr137644_place_42 = (function (){var G__137797 = cr137644_place_41;
var fexpr__137796 = cr137644_place_40;
return (fexpr__137796.cljs$core$IFn$_invoke$arity$1 ? fexpr__137796.cljs$core$IFn$_invoke$arity$1(G__137797) : fexpr__137796.call(null,G__137797));
})();
var cr137644_place_43 = cr137644_place_39.cljs$core$IFn$_invoke$arity$1(cr137644_place_42);
var cr137644_place_44 = (function (){var G__137799 = cr137644_place_38;
var G__137800 = cr137644_place_43;
var fexpr__137798 = cr137644_place_37;
return (fexpr__137798.cljs$core$IFn$_invoke$arity$2 ? fexpr__137798.cljs$core$IFn$_invoke$arity$2(G__137799,G__137800) : fexpr__137798.call(null,G__137799,G__137800));
})();
var cr137644_place_45 = null;
if(cljs.core.truth_(cr137644_place_44)){
(cr137644_state[(0)] = cr137644_block_8);

(cr137644_state[(3)] = cr137644_place_36);

return cr137644_state;
} else {
(cr137644_state[(0)] = cr137644_block_7);

(cr137644_state[(3)] = cr137644_place_36);

return cr137644_state;
}
}catch (e137795){var cr137644_exception = e137795;
(cr137644_state[(0)] = cr137644_block_9);

(cr137644_state[(1)] = cr137644_exception);

(cr137644_state[(2)] = true);

return cr137644_state;
}});
var cr137644_block_8 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr137644_block_8(cr137644_state){
try{var cr137644_place_36 = (cr137644_state[(3)]);
var cr137644_place_48 = cljs.core.ex_info;
var cr137644_place_49 = "remote graph is still creating";
var cr137644_place_50 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr137644_place_51 = true;
var cr137644_place_52 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr137644_place_50,cr137644_place_51]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr137644_place_53 = cr137644_place_36;
var cr137644_place_54 = (function (){var G__137803 = cr137644_place_49;
var G__137804 = cr137644_place_52;
var G__137805 = cr137644_place_53;
var fexpr__137802 = cr137644_place_48;
return (fexpr__137802.cljs$core$IFn$_invoke$arity$3 ? fexpr__137802.cljs$core$IFn$_invoke$arity$3(G__137803,G__137804,G__137805) : fexpr__137802.call(null,G__137803,G__137804,G__137805));
})();
var cr137644_place_55 = (function(){throw cr137644_place_54})();
(cr137644_state[(0)] = null);

(cr137644_state[(1)] = null);

(cr137644_state[(3)] = null);

(cr137644_state[(2)] = null);

return null;
}catch (e137801){var cr137644_exception = e137801;
(cr137644_state[(0)] = cr137644_block_9);

(cr137644_state[(3)] = null);

(cr137644_state[(1)] = cr137644_exception);

(cr137644_state[(2)] = true);

return cr137644_state;
}});
var cr137644_block_2 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr137644_block_2(cr137644_state){
try{var cr137644_place_13 = missionary.core.unpark();
var cr137644_place_14 = cljs.core.__destructure_map;
var cr137644_place_15 = cr137644_place_13;
var cr137644_place_16 = (function (){var G__137808 = cr137644_place_15;
var fexpr__137807 = cr137644_place_14;
return (fexpr__137807.cljs$core$IFn$_invoke$arity$1 ? fexpr__137807.cljs$core$IFn$_invoke$arity$1(G__137808) : fexpr__137807.call(null,G__137808));
})();
var cr137644_place_17 = cr137644_place_16;
var cr137644_place_18 = cljs.core.get;
var cr137644_place_19 = cr137644_place_16;
var cr137644_place_20 = new cljs.core.Keyword(null,"t","t",-1397832519);
var cr137644_place_21 = (function (){var G__137810 = cr137644_place_19;
var G__137811 = cr137644_place_20;
var fexpr__137809 = cr137644_place_18;
return (fexpr__137809.cljs$core$IFn$_invoke$arity$2 ? fexpr__137809.cljs$core$IFn$_invoke$arity$2(G__137810,G__137811) : fexpr__137809.call(null,G__137810,G__137811));
})();
var cr137644_place_22 = frontend.worker.rtc.log_and_state.update_remote_t;
var cr137644_place_23 = graph_uuid;
var cr137644_place_24 = cr137644_place_21;
var cr137644_place_25 = (function (){var G__137813 = cr137644_place_23;
var G__137814 = cr137644_place_24;
var fexpr__137812 = cr137644_place_22;
return (fexpr__137812.cljs$core$IFn$_invoke$arity$2 ? fexpr__137812.cljs$core$IFn$_invoke$arity$2(G__137813,G__137814) : fexpr__137812.call(null,G__137813,G__137814));
})();
var cr137644_place_26 = frontend.worker.rtc.client_op.get_local_tx;
var cr137644_place_27 = repo;
var cr137644_place_28 = (function (){var G__137816 = cr137644_place_27;
var fexpr__137815 = cr137644_place_26;
return (fexpr__137815.cljs$core$IFn$_invoke$arity$1 ? fexpr__137815.cljs$core$IFn$_invoke$arity$1(G__137816) : fexpr__137815.call(null,G__137816));
})();
var cr137644_place_29 = null;
if(cljs.core.truth_(cr137644_place_28)){
(cr137644_state[(0)] = cr137644_block_4);

(cr137644_state[(3)] = cr137644_place_29);

(cr137644_state[(5)] = cr137644_place_17);

return cr137644_state;
} else {
(cr137644_state[(0)] = cr137644_block_3);

(cr137644_state[(3)] = cr137644_place_29);

(cr137644_state[(4)] = cr137644_place_21);

(cr137644_state[(5)] = cr137644_place_17);

return cr137644_state;
}
}catch (e137806){var cr137644_exception = e137806;
(cr137644_state[(0)] = cr137644_block_6);

(cr137644_state[(1)] = cr137644_exception);

return cr137644_state;
}});
var cr137644_block_3 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr137644_block_3(cr137644_state){
try{var cr137644_place_21 = (cr137644_state[(4)]);
var cr137644_place_30 = frontend.worker.rtc.client_op.update_local_tx;
var cr137644_place_31 = repo;
var cr137644_place_32 = cr137644_place_21;
var cr137644_place_33 = (function (){var G__137819 = cr137644_place_31;
var G__137820 = cr137644_place_32;
var fexpr__137818 = cr137644_place_30;
return (fexpr__137818.cljs$core$IFn$_invoke$arity$2 ? fexpr__137818.cljs$core$IFn$_invoke$arity$2(G__137819,G__137820) : fexpr__137818.call(null,G__137819,G__137820));
})();
(cr137644_state[(0)] = cr137644_block_5);

(cr137644_state[(4)] = null);

(cr137644_state[(3)] = cr137644_place_33);

return cr137644_state;
}catch (e137817){var cr137644_exception = e137817;
(cr137644_state[(0)] = cr137644_block_6);

(cr137644_state[(3)] = null);

(cr137644_state[(4)] = null);

(cr137644_state[(5)] = null);

(cr137644_state[(1)] = cr137644_exception);

return cr137644_state;
}});
var cr137644_block_4 = (function frontend$worker$rtc$client$new_task__register_graph_updates_$_cr137644_block_4(cr137644_state){
try{var cr137644_place_34 = null;
(cr137644_state[(0)] = cr137644_block_5);

(cr137644_state[(3)] = cr137644_place_34);

return cr137644_state;
}catch (e137821){var cr137644_exception = e137821;
(cr137644_state[(0)] = cr137644_block_6);

(cr137644_state[(3)] = null);

(cr137644_state[(5)] = null);

(cr137644_state[(1)] = cr137644_exception);

return cr137644_state;
}});
return cloroutine.impl.coroutine((function (){var G__137822 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((6));
(G__137822[(0)] = cr137644_block_0);

return G__137822;
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
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr137823_block_4 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr137823_block_4(cr137823_state){
try{var cr137823_place_1 = (cr137823_state[(1)]);
var cr137823_place_8 = (cr137823_state[(2)]);
var cr137823_place_16 = cljs.core.not;
var cr137823_place_17 = cljs.core.deref;
var cr137823_place_18 = _STAR_sent;
var cr137823_place_19 = (function (){var G__137996 = cr137823_place_18;
var fexpr__137995 = cr137823_place_17;
return (fexpr__137995.cljs$core$IFn$_invoke$arity$1 ? fexpr__137995.cljs$core$IFn$_invoke$arity$1(G__137996) : fexpr__137995.call(null,G__137996));
})();
var cr137823_place_20 = cr137823_place_19;
var cr137823_place_21 = cr137823_place_1;
var cr137823_place_22 = (function (){var G__137998 = cr137823_place_21;
var fexpr__137997 = cr137823_place_20;
return (fexpr__137997.cljs$core$IFn$_invoke$arity$1 ? fexpr__137997.cljs$core$IFn$_invoke$arity$1(G__137998) : fexpr__137997.call(null,G__137998));
})();
var cr137823_place_23 = (function (){var G__138000 = cr137823_place_22;
var fexpr__137999 = cr137823_place_16;
return (fexpr__137999.cljs$core$IFn$_invoke$arity$1 ? fexpr__137999.cljs$core$IFn$_invoke$arity$1(G__138000) : fexpr__137999.call(null,G__138000));
})();
var cr137823_place_24 = null;
if(cljs.core.truth_(cr137823_place_23)){
(cr137823_state[(0)] = cr137823_block_6);

(cr137823_state[(2)] = null);

(cr137823_state[(2)] = cr137823_place_24);

return cr137823_state;
} else {
(cr137823_state[(0)] = cr137823_block_5);

(cr137823_state[(2)] = null);

(cr137823_state[(2)] = cr137823_place_24);

return cr137823_state;
}
}catch (e137994){var cr137823_exception = e137994;
(cr137823_state[(0)] = null);

(cr137823_state[(1)] = null);

(cr137823_state[(2)] = null);

throw cr137823_exception;
}});
var cr137823_block_10 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr137823_block_10(cr137823_state){
try{var cr137823_place_81 = (cr137823_state[(4)]);
var cr137823_place_85 = new cljs.core.Keyword("rtc.log","higher-remote-schema-version-exists","rtc.log/higher-remote-schema-version-exists",1466780034);
var cr137823_place_86 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr137823_place_87 = frontend.worker.rtc.branch_graph.compare_schemas;
var cr137823_place_88 = cr137823_place_81;
var cr137823_place_89 = logseq.db.frontend.schema.version;
var cr137823_place_90 = major_schema_version;
var cr137823_place_91 = (function (){var G__138003 = cr137823_place_88;
var G__138004 = cr137823_place_89;
var G__138005 = cr137823_place_90;
var fexpr__138002 = cr137823_place_87;
return (fexpr__138002.cljs$core$IFn$_invoke$arity$3 ? fexpr__138002.cljs$core$IFn$_invoke$arity$3(G__138003,G__138004,G__138005) : fexpr__138002.call(null,G__138003,G__138004,G__138005));
})();
var cr137823_place_92 = new cljs.core.Keyword(null,"repo","repo",-1999060679);
var cr137823_place_93 = repo;
var cr137823_place_94 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr137823_place_95 = graph_uuid;
var cr137823_place_96 = new cljs.core.Keyword(null,"remote-schema-version","remote-schema-version",-925454925);
var cr137823_place_97 = cr137823_place_81;
var cr137823_place_98 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr137823_place_94,cr137823_place_95,cr137823_place_92,cr137823_place_93,cr137823_place_96,cr137823_place_97,cr137823_place_86,cr137823_place_91]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr137823_place_99 = add_log_fn;
var cr137823_place_100 = cr137823_place_85;
var cr137823_place_101 = cr137823_place_98;
var cr137823_place_102 = (function (){var G__138007 = cr137823_place_100;
var G__138008 = cr137823_place_101;
var fexpr__138006 = cr137823_place_99;
return (fexpr__138006.cljs$core$IFn$_invoke$arity$2 ? fexpr__138006.cljs$core$IFn$_invoke$arity$2(G__138007,G__138008) : fexpr__138006.call(null,G__138007,G__138008));
})();
(cr137823_state[(0)] = cr137823_block_11);

(cr137823_state[(4)] = null);

(cr137823_state[(3)] = cr137823_place_102);

return cr137823_state;
}catch (e138001){var cr137823_exception = e138001;
(cr137823_state[(0)] = null);

(cr137823_state[(4)] = null);

(cr137823_state[(3)] = null);

(cr137823_state[(2)] = null);

(cr137823_state[(1)] = null);

throw cr137823_exception;
}});
var cr137823_block_2 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr137823_block_2(cr137823_state){
try{var cr137823_place_1 = (cr137823_state[(1)]);
var cr137823_place_9 = cljs.core.swap_BANG_;
var cr137823_place_10 = _STAR_sent;
var cr137823_place_11 = cljs.core.assoc;
var cr137823_place_12 = cr137823_place_1;
var cr137823_place_13 = false;
var cr137823_place_14 = (function (){var G__138011 = cr137823_place_10;
var G__138012 = cr137823_place_11;
var G__138013 = cr137823_place_12;
var G__138014 = cr137823_place_13;
var fexpr__138010 = cr137823_place_9;
return (fexpr__138010.cljs$core$IFn$_invoke$arity$4 ? fexpr__138010.cljs$core$IFn$_invoke$arity$4(G__138011,G__138012,G__138013,G__138014) : fexpr__138010.call(null,G__138011,G__138012,G__138013,G__138014));
})();
(cr137823_state[(0)] = cr137823_block_4);

(cr137823_state[(2)] = cr137823_place_14);

return cr137823_state;
}catch (e138009){var cr137823_exception = e138009;
(cr137823_state[(0)] = null);

(cr137823_state[(1)] = null);

(cr137823_state[(2)] = null);

throw cr137823_exception;
}});
var cr137823_block_14 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr137823_block_14(cr137823_state){
try{var cr137823_place_105 = (cr137823_state[(4)]);
var cr137823_place_129 = missionary.core.unpark();
var cr137823_place_130 = cljs.core.__destructure_map;
var cr137823_place_131 = cr137823_place_129;
var cr137823_place_132 = (function (){var G__138017 = cr137823_place_131;
var fexpr__138016 = cr137823_place_130;
return (fexpr__138016.cljs$core$IFn$_invoke$arity$1 ? fexpr__138016.cljs$core$IFn$_invoke$arity$1(G__138017) : fexpr__138016.call(null,G__138017));
})();
var cr137823_place_133 = cljs.core.get;
var cr137823_place_134 = cr137823_place_132;
var cr137823_place_135 = new cljs.core.Keyword(null,"server-schema-version","server-schema-version",765611123);
var cr137823_place_136 = (function (){var G__138019 = cr137823_place_134;
var G__138020 = cr137823_place_135;
var fexpr__138018 = cr137823_place_133;
return (fexpr__138018.cljs$core$IFn$_invoke$arity$2 ? fexpr__138018.cljs$core$IFn$_invoke$arity$2(G__138019,G__138020) : fexpr__138018.call(null,G__138019,G__138020));
})();
var cr137823_place_137 = cljs.core.get;
var cr137823_place_138 = cr137823_place_132;
var cr137823_place_139 = new cljs.core.Keyword(null,"_server-builtin-db-idents","_server-builtin-db-idents",-1081428540);
var cr137823_place_140 = (function (){var G__138022 = cr137823_place_138;
var G__138023 = cr137823_place_139;
var fexpr__138021 = cr137823_place_137;
return (fexpr__138021.cljs$core$IFn$_invoke$arity$2 ? fexpr__138021.cljs$core$IFn$_invoke$arity$2(G__138022,G__138023) : fexpr__138021.call(null,G__138022,G__138023));
})();
var cr137823_place_141 = cljs.core.reset_BANG_;
var cr137823_place_142 = _STAR_server_schema_version;
var cr137823_place_143 = cr137823_place_136;
var cr137823_place_144 = (function (){var G__138025 = cr137823_place_142;
var G__138026 = cr137823_place_143;
var fexpr__138024 = cr137823_place_141;
return (fexpr__138024.cljs$core$IFn$_invoke$arity$2 ? fexpr__138024.cljs$core$IFn$_invoke$arity$2(G__138025,G__138026) : fexpr__138024.call(null,G__138025,G__138026));
})();
var cr137823_place_145 = cljs.core.reset_BANG_;
var cr137823_place_146 = _STAR_last_calibrate_t;
var cr137823_place_147 = cr137823_place_105;
var cr137823_place_148 = (function (){var G__138028 = cr137823_place_146;
var G__138029 = cr137823_place_147;
var fexpr__138027 = cr137823_place_145;
return (fexpr__138027.cljs$core$IFn$_invoke$arity$2 ? fexpr__138027.cljs$core$IFn$_invoke$arity$2(G__138028,G__138029) : fexpr__138027.call(null,G__138028,G__138029));
})();
(cr137823_state[(0)] = cr137823_block_15);

(cr137823_state[(4)] = null);

(cr137823_state[(3)] = cr137823_place_148);

return cr137823_state;
}catch (e138015){var cr137823_exception = e138015;
(cr137823_state[(0)] = null);

(cr137823_state[(3)] = null);

(cr137823_state[(4)] = null);

(cr137823_state[(2)] = null);

(cr137823_state[(1)] = null);

throw cr137823_exception;
}});
var cr137823_block_12 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr137823_block_12(cr137823_state){
try{var cr137823_place_120 = null;
(cr137823_state[(0)] = cr137823_block_15);

(cr137823_state[(3)] = cr137823_place_120);

return cr137823_state;
}catch (e138030){var cr137823_exception = e138030;
(cr137823_state[(0)] = null);

(cr137823_state[(3)] = null);

(cr137823_state[(2)] = null);

(cr137823_state[(1)] = null);

throw cr137823_exception;
}});
var cr137823_block_1 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr137823_block_1(cr137823_state){
try{var cr137823_place_1 = missionary.core.unpark();
var cr137823_place_2 = cljs.core.contains_QMARK_;
var cr137823_place_3 = cljs.core.deref;
var cr137823_place_4 = _STAR_sent;
var cr137823_place_5 = (function (){var G__138033 = cr137823_place_4;
var fexpr__138032 = cr137823_place_3;
return (fexpr__138032.cljs$core$IFn$_invoke$arity$1 ? fexpr__138032.cljs$core$IFn$_invoke$arity$1(G__138033) : fexpr__138032.call(null,G__138033));
})();
var cr137823_place_6 = cr137823_place_1;
var cr137823_place_7 = (function (){var G__138035 = cr137823_place_5;
var G__138036 = cr137823_place_6;
var fexpr__138034 = cr137823_place_2;
return (fexpr__138034.cljs$core$IFn$_invoke$arity$2 ? fexpr__138034.cljs$core$IFn$_invoke$arity$2(G__138035,G__138036) : fexpr__138034.call(null,G__138035,G__138036));
})();
var cr137823_place_8 = null;
if(cljs.core.truth_(cr137823_place_7)){
(cr137823_state[(0)] = cr137823_block_3);

(cr137823_state[(1)] = cr137823_place_1);

(cr137823_state[(2)] = cr137823_place_8);

return cr137823_state;
} else {
(cr137823_state[(0)] = cr137823_block_2);

(cr137823_state[(1)] = cr137823_place_1);

(cr137823_state[(2)] = cr137823_place_8);

return cr137823_state;
}
}catch (e138031){var cr137823_exception = e138031;
(cr137823_state[(0)] = null);

throw cr137823_exception;
}});
var cr137823_block_0 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr137823_block_0(cr137823_state){
try{var cr137823_place_0 = get_ws_create_task;
(cr137823_state[(0)] = cr137823_block_1);

return missionary.core.park(cr137823_place_0);
}catch (e138037){var cr137823_exception = e138037;
(cr137823_state[(0)] = null);

throw cr137823_exception;
}});
var cr137823_block_7 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr137823_block_7(cr137823_state){
try{var cr137823_place_26 = (cr137823_state[(3)]);
var cr137823_place_28 = missionary.core.unpark();
var cr137823_place_29 = (function (){var G__138040 = cr137823_place_28;
var fexpr__138039 = cr137823_place_26;
return (fexpr__138039.cljs$core$IFn$_invoke$arity$1 ? fexpr__138039.cljs$core$IFn$_invoke$arity$1(G__138040) : fexpr__138039.call(null,G__138040));
})();
var cr137823_place_30 = frontend.common.missionary.run_task;
var cr137823_place_31 = new cljs.core.Keyword(null,"update-online-user-when-register-graph-updates","update-online-user-when-register-graph-updates",1053542827);
var cr137823_place_32 = cljs.core.partial;
var cr137823_place_33 = (function (cr137825_state){
try{var cr137825_place_0 = new cljs.core.Keyword(null,"online-users","online-users",-747563810);
var cr137825_place_1 = missionary.core.timeout;
var cr137825_place_2 = missionary.core.reduce;
var cr137825_place_3 = (function (_,v){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("online-users-updated",new cljs.core.Keyword(null,"req-id","req-id",-471642231).cljs$core$IFn$_invoke$arity$1(v))){
return cljs.core.reduced(v);
} else {
return null;
}
});
var cr137825_place_4 = cr137823_place_29;
var cr137825_place_5 = (function (){var G__137842 = cr137825_place_3;
var G__137843 = cr137825_place_4;
var fexpr__137841 = cr137825_place_2;
var G__138057 = G__137842;
var G__138058 = G__137843;
var fexpr__138056 = fexpr__137841;
return (fexpr__138056.cljs$core$IFn$_invoke$arity$2 ? fexpr__138056.cljs$core$IFn$_invoke$arity$2(G__138057,G__138058) : fexpr__138056.call(null,G__138057,G__138058));
})();
var cr137825_place_6 = (10000);
var cr137825_place_7 = (function (){var G__137845 = cr137825_place_5;
var G__137846 = cr137825_place_6;
var fexpr__137844 = cr137825_place_1;
var G__138060 = G__137845;
var G__138061 = G__137846;
var fexpr__138059 = fexpr__137844;
return (fexpr__138059.cljs$core$IFn$_invoke$arity$2 ? fexpr__138059.cljs$core$IFn$_invoke$arity$2(G__138060,G__138061) : fexpr__138059.call(null,G__138060,G__138061));
})();
(cr137825_state[(0)] = cr137823_place_34);

(cr137825_state[(1)] = cr137825_place_0);

return missionary.core.park(cr137825_place_7);
}catch (e138055){var e137840 = e138055;
var cr137825_exception = e137840;
(cr137825_state[(0)] = null);

throw cr137825_exception;
}});
var cr137823_place_34 = (function (cr137825_state){
try{var cr137825_place_0 = (cr137825_state[(1)]);
var cr137825_place_8 = missionary.core.unpark();
var cr137825_place_9 = cr137825_place_0.cljs$core$IFn$_invoke$arity$1(cr137825_place_8);
var cr137825_place_10 = cr137825_place_9;
var cr137825_place_11 = null;
if(cljs.core.truth_(cr137825_place_10)){
(cr137825_state[(0)] = cr137823_place_36);

(cr137825_state[(1)] = null);

(cr137825_state[(2)] = cr137825_place_9);

(cr137825_state[(1)] = cr137825_place_11);

return cr137825_state;
} else {
(cr137825_state[(0)] = cr137823_place_35);

(cr137825_state[(1)] = null);

(cr137825_state[(1)] = cr137825_place_11);

return cr137825_state;
}
}catch (e138062){var e137847 = e138062;
var cr137825_exception = e137847;
(cr137825_state[(0)] = null);

(cr137825_state[(1)] = null);

throw cr137825_exception;
}});
var cr137823_place_35 = (function (cr137825_state){
try{var cr137825_place_12 = null;
(cr137825_state[(0)] = cr137823_place_37);

(cr137825_state[(1)] = cr137825_place_12);

return cr137825_state;
}catch (e138063){var e137848 = e138063;
var cr137825_exception = e137848;
(cr137825_state[(0)] = null);

(cr137825_state[(1)] = null);

throw cr137825_exception;
}});
var cr137823_place_36 = (function (cr137825_state){
try{var cr137825_place_9 = (cr137825_state[(2)]);
var cr137825_place_13 = cr137825_place_9;
var cr137825_place_14 = cljs.core.reset_BANG_;
var cr137825_place_15 = _STAR_online_users;
var cr137825_place_16 = cr137825_place_13;
var cr137825_place_17 = (function (){var G__137851 = cr137825_place_15;
var G__137852 = cr137825_place_16;
var fexpr__137850 = cr137825_place_14;
var G__138066 = G__137851;
var G__138067 = G__137852;
var fexpr__138065 = fexpr__137850;
return (fexpr__138065.cljs$core$IFn$_invoke$arity$2 ? fexpr__138065.cljs$core$IFn$_invoke$arity$2(G__138066,G__138067) : fexpr__138065.call(null,G__138066,G__138067));
})();
(cr137825_state[(0)] = cr137823_place_37);

(cr137825_state[(2)] = null);

(cr137825_state[(1)] = cr137825_place_17);

return cr137825_state;
}catch (e138064){var e137849 = e138064;
var cr137825_exception = e137849;
(cr137825_state[(0)] = null);

(cr137825_state[(1)] = null);

(cr137825_state[(2)] = null);

throw cr137825_exception;
}});
var cr137823_place_37 = (function (cr137825_state){
try{var cr137825_place_11 = (cr137825_state[(1)]);
(cr137825_state[(0)] = null);

(cr137825_state[(1)] = null);

return cr137825_place_11;
}catch (e138068){var e137853 = e138068;
var cr137825_exception = e137853;
(cr137825_state[(0)] = null);

(cr137825_state[(1)] = null);

throw cr137825_exception;
}});
var cr137823_place_38 = cloroutine.impl.coroutine;
var cr137823_place_39 = cljs.core.object_array;
var cr137823_place_40 = (3);
var cr137823_place_41 = (function (){var G__138070 = cr137823_place_40;
var fexpr__138069 = cr137823_place_39;
return (fexpr__138069.cljs$core$IFn$_invoke$arity$1 ? fexpr__138069.cljs$core$IFn$_invoke$arity$1(G__138070) : fexpr__138069.call(null,G__138070));
})();
var cr137823_place_42 = cr137823_place_41;
var cr137823_place_43 = (0);
var cr137823_place_44 = cr137823_place_33;
var cr137823_place_45 = (cr137823_place_42[cr137823_place_43] = cr137823_place_44);
var cr137823_place_46 = cr137823_place_41;
var cr137823_place_47 = (function (){var G__138072 = cr137823_place_46;
var fexpr__138071 = cr137823_place_38;
return (fexpr__138071.cljs$core$IFn$_invoke$arity$1 ? fexpr__138071.cljs$core$IFn$_invoke$arity$1(G__138072) : fexpr__138071.call(null,G__138072));
})();
var cr137823_place_48 = missionary.core.sp_run;
var cr137823_place_49 = (function (){var G__138074 = cr137823_place_47;
var G__138075 = cr137823_place_48;
var fexpr__138073 = cr137823_place_32;
return (fexpr__138073.cljs$core$IFn$_invoke$arity$2 ? fexpr__138073.cljs$core$IFn$_invoke$arity$2(G__138074,G__138075) : fexpr__138073.call(null,G__138074,G__138075));
})();
var cr137823_place_50 = new cljs.core.Keyword(null,"succ","succ",1386276271);
var cr137823_place_51 = cljs.core.constantly;
var cr137823_place_52 = null;
var cr137823_place_53 = (function (){var G__138077 = cr137823_place_52;
var fexpr__138076 = cr137823_place_51;
return (fexpr__138076.cljs$core$IFn$_invoke$arity$1 ? fexpr__138076.cljs$core$IFn$_invoke$arity$1(G__138077) : fexpr__138076.call(null,G__138077));
})();
var cr137823_place_54 = (function (){var G__138079 = cr137823_place_31;
var G__138080 = cr137823_place_49;
var G__138081 = cr137823_place_50;
var G__138082 = cr137823_place_53;
var fexpr__138078 = cr137823_place_30;
return (fexpr__138078.cljs$core$IFn$_invoke$arity$4 ? fexpr__138078.cljs$core$IFn$_invoke$arity$4(G__138079,G__138080,G__138081,G__138082) : fexpr__138078.call(null,G__138079,G__138080,G__138081,G__138082));
})();
var cr137823_place_55 = frontend.common.missionary.backoff;
var cr137823_place_56 = new cljs.core.Keyword(null,"delay-seq","delay-seq",-1959201166);
var cr137823_place_57 = cljs.core.take;
var cr137823_place_58 = (5);
var cr137823_place_59 = cljs.core.drop;
var cr137823_place_60 = (2);
var cr137823_place_61 = frontend.common.missionary.delays;
var cr137823_place_62 = (function (){var G__138084 = cr137823_place_60;
var G__138085 = cr137823_place_61;
var fexpr__138083 = cr137823_place_59;
return (fexpr__138083.cljs$core$IFn$_invoke$arity$2 ? fexpr__138083.cljs$core$IFn$_invoke$arity$2(G__138084,G__138085) : fexpr__138083.call(null,G__138084,G__138085));
})();
var cr137823_place_63 = (function (){var G__138087 = cr137823_place_58;
var G__138088 = cr137823_place_62;
var fexpr__138086 = cr137823_place_57;
return (fexpr__138086.cljs$core$IFn$_invoke$arity$2 ? fexpr__138086.cljs$core$IFn$_invoke$arity$2(G__138087,G__138088) : fexpr__138086.call(null,G__138087,G__138088));
})();
var cr137823_place_64 = new cljs.core.Keyword(null,"reset-flow","reset-flow",-1725822377);
var cr137823_place_65 = frontend.worker.flows.online_event_flow;
var cr137823_place_66 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr137823_place_64,cr137823_place_65,cr137823_place_56,cr137823_place_63]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr137823_place_67 = frontend.worker.rtc.client.new_task__register_graph_updates;
var cr137823_place_68 = get_ws_create_task;
var cr137823_place_69 = graph_uuid;
var cr137823_place_70 = major_schema_version;
var cr137823_place_71 = repo;
var cr137823_place_72 = (function (){var G__138090 = cr137823_place_68;
var G__138091 = cr137823_place_69;
var G__138092 = cr137823_place_70;
var G__138093 = cr137823_place_71;
var fexpr__138089 = cr137823_place_67;
return (fexpr__138089.cljs$core$IFn$_invoke$arity$4 ? fexpr__138089.cljs$core$IFn$_invoke$arity$4(G__138090,G__138091,G__138092,G__138093) : fexpr__138089.call(null,G__138090,G__138091,G__138092,G__138093));
})();
var cr137823_place_73 = (function (){var G__138095 = cr137823_place_66;
var G__138096 = cr137823_place_72;
var fexpr__138094 = cr137823_place_55;
return (fexpr__138094.cljs$core$IFn$_invoke$arity$2 ? fexpr__138094.cljs$core$IFn$_invoke$arity$2(G__138095,G__138096) : fexpr__138094.call(null,G__138095,G__138096));
})();
(cr137823_state[(0)] = cr137823_block_8);

(cr137823_state[(3)] = null);

return missionary.core.park(cr137823_place_73);
}catch (e138038){var cr137823_exception = e138038;
(cr137823_state[(0)] = null);

(cr137823_state[(2)] = null);

(cr137823_state[(3)] = null);

(cr137823_state[(1)] = null);

throw cr137823_exception;
}});
var cr137823_block_9 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr137823_block_9(cr137823_state){
try{var cr137823_place_84 = null;
(cr137823_state[(0)] = cr137823_block_11);

(cr137823_state[(3)] = cr137823_place_84);

return cr137823_state;
}catch (e138097){var cr137823_exception = e138097;
(cr137823_state[(0)] = null);

(cr137823_state[(3)] = null);

(cr137823_state[(2)] = null);

(cr137823_state[(1)] = null);

throw cr137823_exception;
}});
var cr137823_block_16 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr137823_block_16(cr137823_state){
try{var cr137823_place_24 = (cr137823_state[(2)]);
var cr137823_place_1 = (cr137823_state[(1)]);
var cr137823_place_155 = cr137823_place_1;
(cr137823_state[(0)] = null);

(cr137823_state[(2)] = null);

(cr137823_state[(1)] = null);

return cr137823_place_155;
}catch (e138098){var cr137823_exception = e138098;
(cr137823_state[(0)] = null);

(cr137823_state[(2)] = null);

(cr137823_state[(1)] = null);

throw cr137823_exception;
}});
var cr137823_block_5 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr137823_block_5(cr137823_state){
try{var cr137823_place_25 = null;
(cr137823_state[(0)] = cr137823_block_16);

(cr137823_state[(2)] = cr137823_place_25);

return cr137823_state;
}catch (e138099){var cr137823_exception = e138099;
(cr137823_state[(0)] = null);

(cr137823_state[(2)] = null);

(cr137823_state[(1)] = null);

throw cr137823_exception;
}});
var cr137823_block_3 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr137823_block_3(cr137823_state){
try{var cr137823_place_15 = null;
(cr137823_state[(0)] = cr137823_block_4);

(cr137823_state[(2)] = cr137823_place_15);

return cr137823_state;
}catch (e138100){var cr137823_exception = e138100;
(cr137823_state[(0)] = null);

(cr137823_state[(1)] = null);

(cr137823_state[(2)] = null);

throw cr137823_exception;
}});
var cr137823_block_15 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr137823_block_15(cr137823_state){
try{var cr137823_place_119 = (cr137823_state[(3)]);
var cr137823_place_1 = (cr137823_state[(1)]);
var cr137823_place_149 = cljs.core.swap_BANG_;
var cr137823_place_150 = _STAR_sent;
var cr137823_place_151 = cljs.core.assoc;
var cr137823_place_152 = cr137823_place_1;
var cr137823_place_153 = true;
var cr137823_place_154 = (function (){var G__138103 = cr137823_place_150;
var G__138104 = cr137823_place_151;
var G__138105 = cr137823_place_152;
var G__138106 = cr137823_place_153;
var fexpr__138102 = cr137823_place_149;
return (fexpr__138102.cljs$core$IFn$_invoke$arity$4 ? fexpr__138102.cljs$core$IFn$_invoke$arity$4(G__138103,G__138104,G__138105,G__138106) : fexpr__138102.call(null,G__138103,G__138104,G__138105,G__138106));
})();
(cr137823_state[(0)] = cr137823_block_16);

(cr137823_state[(3)] = null);

(cr137823_state[(2)] = cr137823_place_154);

return cr137823_state;
}catch (e138101){var cr137823_exception = e138101;
(cr137823_state[(0)] = null);

(cr137823_state[(3)] = null);

(cr137823_state[(2)] = null);

(cr137823_state[(1)] = null);

throw cr137823_exception;
}});
var cr137823_block_13 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr137823_block_13(cr137823_state){
try{var cr137823_place_121 = frontend.worker.rtc.skeleton.new_task__calibrate_graph_skeleton;
var cr137823_place_122 = get_ws_create_task;
var cr137823_place_123 = graph_uuid;
var cr137823_place_124 = major_schema_version;
var cr137823_place_125 = cljs.core.deref;
var cr137823_place_126 = conn;
var cr137823_place_127 = (function (){var G__138109 = cr137823_place_126;
var fexpr__138108 = cr137823_place_125;
return (fexpr__138108.cljs$core$IFn$_invoke$arity$1 ? fexpr__138108.cljs$core$IFn$_invoke$arity$1(G__138109) : fexpr__138108.call(null,G__138109));
})();
var cr137823_place_128 = (function (){var G__138111 = cr137823_place_122;
var G__138112 = cr137823_place_123;
var G__138113 = cr137823_place_124;
var G__138114 = cr137823_place_127;
var fexpr__138110 = cr137823_place_121;
return (fexpr__138110.cljs$core$IFn$_invoke$arity$4 ? fexpr__138110.cljs$core$IFn$_invoke$arity$4(G__138111,G__138112,G__138113,G__138114) : fexpr__138110.call(null,G__138111,G__138112,G__138113,G__138114));
})();
(cr137823_state[(0)] = cr137823_block_14);

return missionary.core.park(cr137823_place_128);
}catch (e138107){var cr137823_exception = e138107;
(cr137823_state[(0)] = null);

(cr137823_state[(3)] = null);

(cr137823_state[(4)] = null);

(cr137823_state[(2)] = null);

(cr137823_state[(1)] = null);

throw cr137823_exception;
}});
var cr137823_block_8 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr137823_block_8(cr137823_state){
try{var cr137823_place_74 = missionary.core.unpark();
var cr137823_place_75 = cljs.core.__destructure_map;
var cr137823_place_76 = cr137823_place_74;
var cr137823_place_77 = (function (){var G__138117 = cr137823_place_76;
var fexpr__138116 = cr137823_place_75;
return (fexpr__138116.cljs$core$IFn$_invoke$arity$1 ? fexpr__138116.cljs$core$IFn$_invoke$arity$1(G__138117) : fexpr__138116.call(null,G__138117));
})();
var cr137823_place_78 = cljs.core.get;
var cr137823_place_79 = cr137823_place_77;
var cr137823_place_80 = new cljs.core.Keyword(null,"max-remote-schema-version","max-remote-schema-version",-1002716880);
var cr137823_place_81 = (function (){var G__138119 = cr137823_place_79;
var G__138120 = cr137823_place_80;
var fexpr__138118 = cr137823_place_78;
return (fexpr__138118.cljs$core$IFn$_invoke$arity$2 ? fexpr__138118.cljs$core$IFn$_invoke$arity$2(G__138119,G__138120) : fexpr__138118.call(null,G__138119,G__138120));
})();
var cr137823_place_82 = cr137823_place_81;
var cr137823_place_83 = null;
if(cljs.core.truth_(cr137823_place_82)){
(cr137823_state[(0)] = cr137823_block_10);

(cr137823_state[(4)] = cr137823_place_81);

(cr137823_state[(3)] = cr137823_place_83);

return cr137823_state;
} else {
(cr137823_state[(0)] = cr137823_block_9);

(cr137823_state[(3)] = cr137823_place_83);

return cr137823_state;
}
}catch (e138115){var cr137823_exception = e138115;
(cr137823_state[(0)] = null);

(cr137823_state[(2)] = null);

(cr137823_state[(1)] = null);

throw cr137823_exception;
}});
var cr137823_block_11 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr137823_block_11(cr137823_state){
try{var cr137823_place_83 = (cr137823_state[(3)]);
var cr137823_place_103 = frontend.worker.rtc.client_op.get_local_tx;
var cr137823_place_104 = repo;
var cr137823_place_105 = (function (){var G__138123 = cr137823_place_104;
var fexpr__138122 = cr137823_place_103;
return (fexpr__138122.cljs$core$IFn$_invoke$arity$1 ? fexpr__138122.cljs$core$IFn$_invoke$arity$1(G__138123) : fexpr__138122.call(null,G__138123));
})();
var cr137823_place_106 = cljs.core.deref;
var cr137823_place_107 = _STAR_last_calibrate_t;
var cr137823_place_108 = (function (){var G__138125 = cr137823_place_107;
var fexpr__138124 = cr137823_place_106;
return (fexpr__138124.cljs$core$IFn$_invoke$arity$1 ? fexpr__138124.cljs$core$IFn$_invoke$arity$1(G__138125) : fexpr__138124.call(null,G__138125));
})();
var cr137823_place_109 = null;
var cr137823_place_110 = (cr137823_place_108 == cr137823_place_109);
var cr137823_place_111 = (500);
var cr137823_place_112 = cr137823_place_105;
var cr137823_place_113 = cljs.core.deref;
var cr137823_place_114 = _STAR_last_calibrate_t;
var cr137823_place_115 = (function (){var G__138127 = cr137823_place_114;
var fexpr__138126 = cr137823_place_113;
return (fexpr__138126.cljs$core$IFn$_invoke$arity$1 ? fexpr__138126.cljs$core$IFn$_invoke$arity$1(G__138127) : fexpr__138126.call(null,G__138127));
})();
var cr137823_place_116 = (cr137823_place_112 - cr137823_place_115);
var cr137823_place_117 = (cr137823_place_111 < cr137823_place_116);
var cr137823_place_118 = ((cr137823_place_110) || (cr137823_place_117));
var cr137823_place_119 = null;
if(cr137823_place_118){
(cr137823_state[(0)] = cr137823_block_13);

(cr137823_state[(3)] = null);

(cr137823_state[(3)] = cr137823_place_119);

(cr137823_state[(4)] = cr137823_place_105);

return cr137823_state;
} else {
(cr137823_state[(0)] = cr137823_block_12);

(cr137823_state[(3)] = null);

(cr137823_state[(3)] = cr137823_place_119);

return cr137823_state;
}
}catch (e138121){var cr137823_exception = e138121;
(cr137823_state[(0)] = null);

(cr137823_state[(3)] = null);

(cr137823_state[(2)] = null);

(cr137823_state[(1)] = null);

throw cr137823_exception;
}});
var cr137823_block_6 = (function frontend$worker$rtc$client$ensure_register_graph_updates_STAR__$_cr137823_block_6(cr137823_state){
try{var cr137823_place_26 = frontend.worker.rtc.ws.recv_flow;
var cr137823_place_27 = get_ws_create_task;
(cr137823_state[(0)] = cr137823_block_7);

(cr137823_state[(3)] = cr137823_place_26);

return missionary.core.park(cr137823_place_27);
}catch (e138128){var cr137823_exception = e138128;
(cr137823_state[(0)] = null);

(cr137823_state[(2)] = null);

(cr137823_state[(1)] = null);

throw cr137823_exception;
}});
return cloroutine.impl.coroutine((function (){var G__138129 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__138129[(0)] = cr137823_block_0);

return G__138129;
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
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__138130 = cljs.core.get_global_hierarchy;
return (fexpr__138130.cljs$core$IFn$_invoke$arity$0 ? fexpr__138130.cljs$core$IFn$_invoke$arity$0() : fexpr__138130.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("frontend.worker.rtc.client","local-block-ops->remote-ops-aux"),(function() { 
var G__138536__delegate = function (tp,_){
return tp;
};
var G__138536 = function (tp,var_args){
var _ = null;
if (arguments.length > 1) {
var G__138537__i = 0, G__138537__a = new Array(arguments.length -  1);
while (G__138537__i < G__138537__a.length) {G__138537__a[G__138537__i] = arguments[G__138537__i + 1]; ++G__138537__i;}
  _ = new cljs.core.IndexedSeq(G__138537__a,0,null);
} 
return G__138536__delegate.call(this,tp,_);};
G__138536.cljs$lang$maxFixedArity = 1;
G__138536.cljs$lang$applyTo = (function (arglist__138538){
var tp = cljs.core.first(arglist__138538);
var _ = cljs.core.rest(arglist__138538);
return G__138536__delegate(tp,_);
});
G__138536.cljs$core$IFn$_invoke$arity$variadic = G__138536__delegate;
return G__138536;
})()
,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
frontend.worker.rtc.client.local_block_ops__GT_remote_ops_aux.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"move-op","move-op",1323817617),(function() { 
var G__138539__delegate = function (_,p__138131){
var map__138132 = p__138131;
var map__138132__$1 = cljs.core.__destructure_map(map__138132);
var parent_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138132__$1,new cljs.core.Keyword(null,"parent-uuid","parent-uuid",-2003485227));
var block_order = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138132__$1,new cljs.core.Keyword(null,"block-order","block-order",493370373));
var block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138132__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638));
var _STAR_remote_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138132__$1,new cljs.core.Keyword(null,"*remote-ops","*remote-ops",234002129));
var _STAR_depend_on_block_uuid_set = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138132__$1,new cljs.core.Keyword(null,"*depend-on-block-uuid-set","*depend-on-block-uuid-set",-431701684));
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
var G__138539 = function (_,var_args){
var p__138131 = null;
if (arguments.length > 1) {
var G__138540__i = 0, G__138540__a = new Array(arguments.length -  1);
while (G__138540__i < G__138540__a.length) {G__138540__a[G__138540__i] = arguments[G__138540__i + 1]; ++G__138540__i;}
  p__138131 = new cljs.core.IndexedSeq(G__138540__a,0,null);
} 
return G__138539__delegate.call(this,_,p__138131);};
G__138539.cljs$lang$maxFixedArity = 1;
G__138539.cljs$lang$applyTo = (function (arglist__138541){
var _ = cljs.core.first(arglist__138541);
var p__138131 = cljs.core.rest(arglist__138541);
return G__138539__delegate(_,p__138131);
});
G__138539.cljs$core$IFn$_invoke$arity$variadic = G__138539__delegate;
return G__138539;
})()
);
frontend.worker.rtc.client.card_many_attr_QMARK_ = (function frontend$worker$rtc$client$card_many_attr_QMARK_(db,attr){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2((datascript.core.schema.cljs$core$IFn$_invoke$arity$1 ? datascript.core.schema.cljs$core$IFn$_invoke$arity$1(db) : datascript.core.schema.call(null,db)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [attr,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659)], null)));
});
/**
 * Remove previous av if later-av has same [a v] or a
 */
frontend.worker.rtc.client.remove_redundant_av = (function frontend$worker$rtc$client$remove_redundant_av(db,av_coll){
var G__138136 = av_coll;
var vec__138137 = G__138136;
var seq__138138 = cljs.core.seq(vec__138137);
var first__138139 = cljs.core.first(seq__138138);
var seq__138138__$1 = cljs.core.next(seq__138138);
var av = first__138139;
var others = seq__138138__$1;
var r = cljs.core.PersistentArrayMap.EMPTY;
var G__138136__$1 = G__138136;
var r__$1 = r;
while(true){
var vec__138146 = G__138136__$1;
var seq__138147 = cljs.core.seq(vec__138146);
var first__138148 = cljs.core.first(seq__138147);
var seq__138147__$1 = cljs.core.next(seq__138147);
var av__$1 = first__138148;
var others__$1 = seq__138147__$1;
var r__$2 = r__$1;
if(cljs.core.not(av__$1)){
return cljs.core.vals(r__$2);
} else {
var vec__138149 = av__$1;
var a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138149,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138149,(1),null);
var _t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138149,(2),null);
var _add_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138149,(3),null);
var av_key = ((frontend.worker.rtc.client.card_many_attr_QMARK_(db,a))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [a,v], null):a);
var temp__5802__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(r__$2,av_key);
if(cljs.core.truth_(temp__5802__auto__)){
var old_av = temp__5802__auto__;
var G__138542 = others__$1;
var G__138543 = (((cljs.core.nth.cljs$core$IFn$_invoke$arity$2(old_av,(2)) < cljs.core.nth.cljs$core$IFn$_invoke$arity$2(av__$1,(2))))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r__$2,av_key,av__$1):(((cljs.core.nth.cljs$core$IFn$_invoke$arity$2(old_av,(2)) > cljs.core.nth.cljs$core$IFn$_invoke$arity$2(av__$1,(2))))?r__$2:((cljs.core.nth.cljs$core$IFn$_invoke$arity$2(av__$1,(3)) === true)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r__$2,av_key,av__$1):r__$2
)));
G__138136__$1 = G__138542;
r__$1 = G__138543;
continue;
} else {
var G__138544 = others__$1;
var G__138545 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r__$2,av_key,av__$1);
G__138136__$1 = G__138544;
r__$1 = G__138545;
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
var vec__138152 = av;
var _a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138152,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138152,(1),null);
var _t = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138152,(2),null);
var add_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138152,(3),null);
var and__5000__auto__ = add_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.uuid_QMARK_(v)) && (((function (){var G__138155 = db;
var G__138156 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),v], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__138155,G__138156) : datascript.core.entity.call(null,G__138155,G__138156));
})() == null)));
} else {
return and__5000__auto__;
}
}),av_coll);
});
frontend.worker.rtc.client.group_by_schema_attrs = (function frontend$worker$rtc$client$group_by_schema_attrs(av_coll){
var map__138157 = cljs.core.group_by((function (av){
return cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("db","index","db/index",-1531680669),null,new cljs.core.Keyword("db","valueType","db/valueType",1827971944),null,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),null], null), null),cljs.core.first(av));
}),av_coll);
var map__138157__$1 = cljs.core.__destructure_map(map__138157);
var schema_av_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138157__$1,true);
var other_av_coll = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138157__$1,false);
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
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update-schema","update-schema",-691503438),(function (){var G__138158 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid,new cljs.core.Keyword("db","ident","db/ident",-737096),db_ident,new cljs.core.Keyword("db","valueType","db/valueType",1827971944),(function (){var or__5002__auto__ = new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(ent);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("db.type","string","db.type/string",1432572808);
}
})()], null);
var G__138158__$1 = (cljs.core.truth_(new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(ent))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__138158,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(ent)):G__138158);
if(cljs.core.truth_(new cljs.core.Keyword("db","index","db/index",-1531680669).cljs$core$IFn$_invoke$arity$1(ent))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__138158__$1,new cljs.core.Keyword("db","index","db/index",-1531680669),new cljs.core.Keyword("db","index","db/index",-1531680669).cljs$core$IFn$_invoke$arity$1(ent));
} else {
return G__138158__$1;
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
var G__138546__delegate = function (_,p__138159){
var map__138160 = p__138159;
var map__138160__$1 = cljs.core.__destructure_map(map__138160);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138160__$1,new cljs.core.Keyword(null,"db","db",993250759));
var block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138160__$1,new cljs.core.Keyword(null,"block","block",664686210));
var update_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138160__$1,new cljs.core.Keyword(null,"update-op","update-op",447969937));
var block_order = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138160__$1,new cljs.core.Keyword(null,"block-order","block-order",493370373));
var parent_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138160__$1,new cljs.core.Keyword(null,"parent-uuid","parent-uuid",-2003485227));
var _STAR_remote_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138160__$1,new cljs.core.Keyword(null,"*remote-ops","*remote-ops",234002129));
var _STAR_depend_on_block_uuid_set = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138160__$1,new cljs.core.Keyword(null,"*depend-on-block-uuid-set","*depend-on-block-uuid-set",-431701684));
var block_uuid = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
var pos = frontend.worker.rtc.client.__GT_pos(parent_uuid,block_order);
var av_coll = frontend.worker.rtc.client.remove_non_exist_ref_av(db,frontend.worker.rtc.client.remove_redundant_av(db,new cljs.core.Keyword(null,"av-coll","av-coll",1589194401).cljs$core$IFn$_invoke$arity$1(cljs.core.last(update_op))));
var vec__138161 = frontend.worker.rtc.client.group_by_schema_attrs(av_coll);
var schema_av_coll = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138161,(0),null);
var other_av_coll = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138161,(1),null);
var update_schema_op = frontend.worker.rtc.client.schema_av_coll__GT_update_schema_op(db,block_uuid,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(block),schema_av_coll);
var depend_on_block_uuids = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__138164){
var vec__138165 = p__138164;
var _a = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138165,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138165,(1),null);
if(cljs.core.uuid_QMARK_(v)){
return v;
} else {
return null;
}
}),other_av_coll);
var card_one_attrs = cljs.core.seq(frontend.worker.rtc.client.av_coll__GT_card_one_attrs((datascript.core.schema.cljs$core$IFn$_invoke$arity$1 ? datascript.core.schema.cljs$core$IFn$_invoke$arity$1(db) : datascript.core.schema.call(null,db)),other_av_coll));
if(cljs.core.seq(other_av_coll)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_remote_ops,cljs.core.conj,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update","update",1045576396),(function (){var G__138168 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid,new cljs.core.Keyword(null,"pos","pos",-864607220),pos,new cljs.core.Keyword(null,"av-coll","av-coll",1589194401),other_av_coll], null);
var G__138168__$1 = (cljs.core.truth_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(block))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__138168,new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(block)):G__138168);
if(card_one_attrs){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__138168__$1,new cljs.core.Keyword(null,"card-one-attrs","card-one-attrs",-1282542626),card_one_attrs);
} else {
return G__138168__$1;
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
var G__138546 = function (_,var_args){
var p__138159 = null;
if (arguments.length > 1) {
var G__138547__i = 0, G__138547__a = new Array(arguments.length -  1);
while (G__138547__i < G__138547__a.length) {G__138547__a[G__138547__i] = arguments[G__138547__i + 1]; ++G__138547__i;}
  p__138159 = new cljs.core.IndexedSeq(G__138547__a,0,null);
} 
return G__138546__delegate.call(this,_,p__138159);};
G__138546.cljs$lang$maxFixedArity = 1;
G__138546.cljs$lang$applyTo = (function (arglist__138548){
var _ = cljs.core.first(arglist__138548);
var p__138159 = cljs.core.rest(arglist__138548);
return G__138546__delegate(_,p__138159);
});
G__138546.cljs$core$IFn$_invoke$arity$variadic = G__138546__delegate;
return G__138546;
})()
);
frontend.worker.rtc.client.local_block_ops__GT_remote_ops_aux.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"update-page-op","update-page-op",1640000564),(function() { 
var G__138549__delegate = function (_,p__138169){
var map__138170 = p__138169;
var map__138170__$1 = cljs.core.__destructure_map(map__138170);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138170__$1,new cljs.core.Keyword(null,"db","db",993250759));
var block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138170__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638));
var _STAR_remote_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138170__$1,new cljs.core.Keyword(null,"*remote-ops","*remote-ops",234002129));
var temp__5804__auto__ = (function (){var G__138171 = db;
var G__138172 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__138171,G__138172) : datascript.core.entity.call(null,G__138171,G__138172));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var map__138173 = temp__5804__auto__;
var map__138173__$1 = cljs.core.__destructure_map(map__138173);
var page_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138173__$1,new cljs.core.Keyword("block","name","block/name",1619760316));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138173__$1,new cljs.core.Keyword("block","title","block/title",710445684));
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
var G__138549 = function (_,var_args){
var p__138169 = null;
if (arguments.length > 1) {
var G__138550__i = 0, G__138550__a = new Array(arguments.length -  1);
while (G__138550__i < G__138550__a.length) {G__138550__a[G__138550__i] = arguments[G__138550__i + 1]; ++G__138550__i;}
  p__138169 = new cljs.core.IndexedSeq(G__138550__a,0,null);
} 
return G__138549__delegate.call(this,_,p__138169);};
G__138549.cljs$lang$maxFixedArity = 1;
G__138549.cljs$lang$applyTo = (function (arglist__138551){
var _ = cljs.core.first(arglist__138551);
var p__138169 = cljs.core.rest(arglist__138551);
return G__138549__delegate(_,p__138169);
});
G__138549.cljs$core$IFn$_invoke$arity$variadic = G__138549__delegate;
return G__138549;
})()
);
frontend.worker.rtc.client.local_block_ops__GT_remote_ops_aux.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"remove-op","remove-op",1576450797),(function() { 
var G__138552__delegate = function (_,p__138174){
var map__138175 = p__138174;
var map__138175__$1 = cljs.core.__destructure_map(map__138175);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138175__$1,new cljs.core.Keyword(null,"db","db",993250759));
var remove_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138175__$1,new cljs.core.Keyword(null,"remove-op","remove-op",1576450797));
var _STAR_remote_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138175__$1,new cljs.core.Keyword(null,"*remote-ops","*remote-ops",234002129));
var temp__5804__auto__ = new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(cljs.core.last(remove_op));
if(cljs.core.truth_(temp__5804__auto__)){
var block_uuid = temp__5804__auto__;
if(((function (){var G__138176 = db;
var G__138177 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__138176,G__138177) : datascript.core.entity.call(null,G__138176,G__138177));
})() == null)){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_remote_ops,cljs.core.conj,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"remove","remove",-131428414),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-uuids","block-uuids",-1313492773),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_uuid], null)], null)], null));
} else {
return null;
}
} else {
return null;
}
};
var G__138552 = function (_,var_args){
var p__138174 = null;
if (arguments.length > 1) {
var G__138553__i = 0, G__138553__a = new Array(arguments.length -  1);
while (G__138553__i < G__138553__a.length) {G__138553__a[G__138553__i] = arguments[G__138553__i + 1]; ++G__138553__i;}
  p__138174 = new cljs.core.IndexedSeq(G__138553__a,0,null);
} 
return G__138552__delegate.call(this,_,p__138174);};
G__138552.cljs$lang$maxFixedArity = 1;
G__138552.cljs$lang$applyTo = (function (arglist__138554){
var _ = cljs.core.first(arglist__138554);
var p__138174 = cljs.core.rest(arglist__138554);
return G__138552__delegate(_,p__138174);
});
G__138552.cljs$core$IFn$_invoke$arity$variadic = G__138552__delegate;
return G__138552;
})()
);
frontend.worker.rtc.client.local_block_ops__GT_remote_ops_aux.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"remove-page-op","remove-page-op",-70089318),(function() { 
var G__138555__delegate = function (_,p__138178){
var map__138179 = p__138178;
var map__138179__$1 = cljs.core.__destructure_map(map__138179);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138179__$1,new cljs.core.Keyword(null,"db","db",993250759));
var remove_page_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138179__$1,new cljs.core.Keyword(null,"remove-page-op","remove-page-op",-70089318));
var _STAR_remote_ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138179__$1,new cljs.core.Keyword(null,"*remote-ops","*remote-ops",234002129));
var temp__5804__auto__ = new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(cljs.core.last(remove_page_op));
if(cljs.core.truth_(temp__5804__auto__)){
var block_uuid = temp__5804__auto__;
if(((function (){var G__138180 = db;
var G__138181 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__138180,G__138181) : datascript.core.entity.call(null,G__138180,G__138181));
})() == null)){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_remote_ops,cljs.core.conj,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"remove-page","remove-page",-1679345876),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid], null)], null));
} else {
return null;
}
} else {
return null;
}
};
var G__138555 = function (_,var_args){
var p__138178 = null;
if (arguments.length > 1) {
var G__138556__i = 0, G__138556__a = new Array(arguments.length -  1);
while (G__138556__i < G__138556__a.length) {G__138556__a[G__138556__i] = arguments[G__138556__i + 1]; ++G__138556__i;}
  p__138178 = new cljs.core.IndexedSeq(G__138556__a,0,null);
} 
return G__138555__delegate.call(this,_,p__138178);};
G__138555.cljs$lang$maxFixedArity = 1;
G__138555.cljs$lang$applyTo = (function (arglist__138557){
var _ = cljs.core.first(arglist__138557);
var p__138178 = cljs.core.rest(arglist__138557);
return G__138555__delegate(_,p__138178);
});
G__138555.cljs$core$IFn$_invoke$arity$variadic = G__138555__delegate;
return G__138555;
})()
);
frontend.worker.rtc.client.local_block_ops__GT_remote_ops = (function frontend$worker$rtc$client$local_block_ops__GT_remote_ops(db,block_ops){
var _STAR_depend_on_block_uuid_set = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
var _STAR_remote_ops = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
var map__138182 = block_ops;
var map__138182__$1 = cljs.core.__destructure_map(map__138182);
var move_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138182__$1,new cljs.core.Keyword(null,"move","move",-2110884309));
var remove_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138182__$1,new cljs.core.Keyword(null,"remove","remove",-131428414));
var update_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138182__$1,new cljs.core.Keyword(null,"update","update",1045576396));
var update_page_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138182__$1,new cljs.core.Keyword(null,"update-page","update-page",-503479891));
var remove_page_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138182__$1,new cljs.core.Keyword(null,"remove-page","remove-page",-1679345876));
var temp__5804__auto___138558 = cljs.core.some(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),cljs.core.last),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [move_op,update_op,update_page_op], null));
if(cljs.core.truth_(temp__5804__auto___138558)){
var block_uuid_138559 = temp__5804__auto___138558;
var temp__5804__auto___138560__$1 = (function (){var G__138183 = db;
var G__138184 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid_138559], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__138183,G__138184) : datascript.core.entity.call(null,G__138183,G__138184));
})();
if(cljs.core.truth_(temp__5804__auto___138560__$1)){
var block_138561 = temp__5804__auto___138560__$1;
var parent_uuid_138562 = (function (){var G__138185 = block_138561;
var G__138185__$1 = (((G__138185 == null))?null:new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(G__138185));
if((G__138185__$1 == null)){
return null;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(G__138185__$1);
}
})();
if(cljs.core.truth_(parent_uuid_138562)){
if(cljs.core.truth_(move_op)){
frontend.worker.rtc.client.local_block_ops__GT_remote_ops_aux.cljs$core$IFn$_invoke$arity$11(new cljs.core.Keyword(null,"move-op","move-op",1323817617),new cljs.core.Keyword(null,"parent-uuid","parent-uuid",-2003485227),parent_uuid_138562,new cljs.core.Keyword(null,"block-order","block-order",493370373),new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(block_138561),new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid_138559,new cljs.core.Keyword(null,"*remote-ops","*remote-ops",234002129),_STAR_remote_ops,new cljs.core.Keyword(null,"*depend-on-block-uuid-set","*depend-on-block-uuid-set",-431701684),_STAR_depend_on_block_uuid_set);
} else {
}
} else {
}

if(cljs.core.truth_(update_op)){
frontend.worker.rtc.client.local_block_ops__GT_remote_ops_aux.cljs$core$IFn$_invoke$arity$15(new cljs.core.Keyword(null,"update-op","update-op",447969937),new cljs.core.Keyword(null,"db","db",993250759),db,new cljs.core.Keyword(null,"block","block",664686210),block_138561,new cljs.core.Keyword(null,"update-op","update-op",447969937),update_op,new cljs.core.Keyword(null,"parent-uuid","parent-uuid",-2003485227),parent_uuid_138562,new cljs.core.Keyword(null,"block-order","block-order",493370373),new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(block_138561),new cljs.core.Keyword(null,"*remote-ops","*remote-ops",234002129),_STAR_remote_ops,new cljs.core.Keyword(null,"*depend-on-block-uuid-set","*depend-on-block-uuid-set",-431701684),_STAR_depend_on_block_uuid_set);
} else {
}

if(cljs.core.truth_(update_page_op)){
frontend.worker.rtc.client.local_block_ops__GT_remote_ops_aux.cljs$core$IFn$_invoke$arity$7(new cljs.core.Keyword(null,"update-page-op","update-page-op",1640000564),new cljs.core.Keyword(null,"db","db",993250759),db,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),block_uuid_138559,new cljs.core.Keyword(null,"*remote-ops","*remote-ops",234002129),_STAR_remote_ops);
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
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__138186 = cljs.core.get_global_hierarchy;
return (fexpr__138186.cljs$core$IFn$_invoke$arity$0 ? fexpr__138186.cljs$core$IFn$_invoke$arity$0() : fexpr__138186.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("frontend.worker.rtc.client","local-db-ident-kv-ops->remote-ops-aux"),(function() { 
var G__138567__delegate = function (op_type,_){
return op_type;
};
var G__138567 = function (op_type,var_args){
var _ = null;
if (arguments.length > 1) {
var G__138568__i = 0, G__138568__a = new Array(arguments.length -  1);
while (G__138568__i < G__138568__a.length) {G__138568__a[G__138568__i] = arguments[G__138568__i + 1]; ++G__138568__i;}
  _ = new cljs.core.IndexedSeq(G__138568__a,0,null);
} 
return G__138567__delegate.call(this,op_type,_);};
G__138567.cljs$lang$maxFixedArity = 1;
G__138567.cljs$lang$applyTo = (function (arglist__138569){
var op_type = cljs.core.first(arglist__138569);
var _ = cljs.core.rest(arglist__138569);
return G__138567__delegate(op_type,_);
});
G__138567.cljs$core$IFn$_invoke$arity$variadic = G__138567__delegate;
return G__138567;
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
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__138187){
var vec__138188 = p__138187;
var op_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138188,(0),null);
var op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138188,(1),null);
return frontend.worker.rtc.client.local_db_ident_kv_ops__GT_remote_ops_aux.cljs$core$IFn$_invoke$arity$2(op_type,op);
}),db_ident_kv_ops_map);
});
frontend.worker.rtc.client.gen_db_ident_kv_remote_ops = (function frontend$worker$rtc$client$gen_db_ident_kv_remote_ops(db_ident_kv_ops_map_coll){
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(frontend.worker.rtc.client.local_db_ident_kv_ops__GT_remote_ops,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([db_ident_kv_ops_map_coll], 0));
});
frontend.worker.rtc.client.merge_remove_remove_ops = (function frontend$worker$rtc$client$merge_remove_remove_ops(remote_remove_ops){
var temp__5804__auto__ = cljs.core.seq(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__138191){
var vec__138192 = p__138191;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138192,(0),null);
var map__138195 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138192,(1),null);
var map__138195__$1 = cljs.core.__destructure_map(map__138195);
var block_uuids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__138195__$1,new cljs.core.Keyword(null,"block-uuids","block-uuids",-1313492773));
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
var block_uuid__GT_dep_uuid = cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (p__138196){
var vec__138197 = p__138196;
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138197,(0),null);
var remote_ops = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138197,(1),null);
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
var G__138570 = r;
var G__138571 = rest_uuids;
var G__138572 = next_uuid;
r = G__138570;
rest_uuids = G__138571;
uuid = G__138572;
continue;
} else {
var rest_uuids_STAR_ = cljs.core.disj.cljs$core$IFn$_invoke$arity$2(rest_uuids,uuid);
var G__138573 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(r,uuid);
var G__138574 = rest_uuids_STAR_;
var G__138575 = cljs.core.first(rest_uuids_STAR_);
r = G__138573;
rest_uuids = G__138574;
uuid = G__138575;
continue;
}
}
break;
}
})();
var sorted_move_ops = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (block_uuid){
var G__138200 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(block_uuid__GT_remote_ops,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_uuid,new cljs.core.Keyword(null,"move","move",-2110884309)], null));
if((G__138200 == null)){
return null;
} else {
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"move","move",-2110884309),G__138200],null));
}
}),sorted_uuids);
var update_schema_ops = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__138201){
var vec__138202 = p__138201;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138202,(0),null);
var remote_ops = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138202,(1),null);
var G__138205 = new cljs.core.Keyword(null,"update-schema","update-schema",-691503438).cljs$core$IFn$_invoke$arity$1(remote_ops);
if((G__138205 == null)){
return null;
} else {
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"update-schema","update-schema",-691503438),G__138205],null));
}
}),block_uuid__GT_remote_ops);
var remove_ops = frontend.worker.rtc.client.merge_remove_remove_ops(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__138206){
var vec__138207 = p__138206;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138207,(0),null);
var remote_ops = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138207,(1),null);
var G__138210 = new cljs.core.Keyword(null,"remove","remove",-131428414).cljs$core$IFn$_invoke$arity$1(remote_ops);
if((G__138210 == null)){
return null;
} else {
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"remove","remove",-131428414),G__138210],null));
}
}),block_uuid__GT_remote_ops));
var update_ops = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__138211){
var vec__138212 = p__138211;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138212,(0),null);
var remote_ops = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138212,(1),null);
var G__138215 = new cljs.core.Keyword(null,"update","update",1045576396).cljs$core$IFn$_invoke$arity$1(remote_ops);
if((G__138215 == null)){
return null;
} else {
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"update","update",1045576396),G__138215],null));
}
}),block_uuid__GT_remote_ops);
var update_page_ops = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__138216){
var vec__138217 = p__138216;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138217,(0),null);
var remote_ops = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138217,(1),null);
var G__138220 = new cljs.core.Keyword(null,"update-page","update-page",-503479891).cljs$core$IFn$_invoke$arity$1(remote_ops);
if((G__138220 == null)){
return null;
} else {
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"update-page","update-page",-503479891),G__138220],null));
}
}),block_uuid__GT_remote_ops);
var remove_page_ops = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__138221){
var vec__138222 = p__138221;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138222,(0),null);
var remote_ops = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138222,(1),null);
var G__138225 = new cljs.core.Keyword(null,"remove-page","remove-page",-1679345876).cljs$core$IFn$_invoke$arity$1(remote_ops);
if((G__138225 == null)){
return null;
} else {
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"remove-page","remove-page",-1679345876),G__138225],null));
}
}),block_uuid__GT_remote_ops);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(update_schema_ops,update_page_ops,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([remove_ops,sorted_move_ops,update_ops,remove_page_ops], 0));
});
frontend.worker.rtc.client.rollback = (function frontend$worker$rtc$client$rollback(repo,block_ops_map_coll,db_ident_kv_ops_map_coll){
var block_ops = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (m){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__138226){
var vec__138227 = p__138226;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138227,(0),null);
var op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138227,(1),null);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),k)){
return null;
} else {
return op;
}
}),m);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block_ops_map_coll], 0));
var db_ident_kv_ops = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (m){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__138230){
var vec__138231 = p__138230;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138231,(0),null);
var op = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__138231,(1),null);
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
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr138234_block_25 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_25(cr138234_state){
try{var cr138234_place_2 = (cr138234_state[(3)]);
var cr138234_place_5 = (cr138234_state[(5)]);
var cr138234_place_141 = frontend.worker.rtc.client.rollback;
var cr138234_place_142 = repo;
var cr138234_place_143 = cr138234_place_2;
var cr138234_place_144 = cr138234_place_5;
var cr138234_place_145 = (function (){var G__138341 = cr138234_place_142;
var G__138342 = cr138234_place_143;
var G__138343 = cr138234_place_144;
var fexpr__138340 = cr138234_place_141;
return (fexpr__138340.cljs$core$IFn$_invoke$arity$3 ? fexpr__138340.cljs$core$IFn$_invoke$arity$3(G__138341,G__138342,G__138343) : fexpr__138340.call(null,G__138341,G__138342,G__138343));
})();
var cr138234_place_146 = frontend.worker.rtc.exception.ex_remote_graph_lock_missing;
var cr138234_place_147 = (function(){throw cr138234_place_146})();
(cr138234_state[(0)] = null);

(cr138234_state[(3)] = null);

(cr138234_state[(5)] = null);

return null;
}catch (e138339){var cr138234_exception = e138339;
(cr138234_state[(0)] = null);

(cr138234_state[(3)] = null);

(cr138234_state[(5)] = null);

throw cr138234_exception;
}});
var cr138234_block_4 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_4(cr138234_state){
try{var cr138234_place_31 = null;
(cr138234_state[(0)] = cr138234_block_30);

(cr138234_state[(1)] = cr138234_place_31);

return cr138234_state;
}catch (e138344){var cr138234_exception = e138344;
(cr138234_state[(0)] = null);

(cr138234_state[(1)] = null);

throw cr138234_exception;
}});
var cr138234_block_20 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_20(cr138234_state){
try{var cr138234_place_80 = (cr138234_state[(2)]);
var cr138234_place_119 = cr138234_place_80;
var cr138234_place_120 = add_log_fn;
var cr138234_place_121 = new cljs.core.Keyword("rtc.log","push-local-update","rtc.log/push-local-update",-860881879);
var cr138234_place_122 = cr138234_place_119;
var cr138234_place_123 = (function (){var G__138347 = cr138234_place_121;
var G__138348 = cr138234_place_122;
var fexpr__138346 = cr138234_place_120;
return (fexpr__138346.cljs$core$IFn$_invoke$arity$2 ? fexpr__138346.cljs$core$IFn$_invoke$arity$2(G__138347,G__138348) : fexpr__138346.call(null,G__138347,G__138348));
})();
var cr138234_place_124 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr138234_place_125 = cr138234_place_119;
var cr138234_place_126 = cr138234_place_124.cljs$core$IFn$_invoke$arity$1(cr138234_place_125);
var cr138234_place_127 = cr138234_place_126;
var cr138234_place_128 = cljs.core.Keyword;
var cr138234_place_129 = (cr138234_place_127 instanceof cr138234_place_128);
var cr138234_place_130 = null;
if(cr138234_place_129){
(cr138234_state[(0)] = cr138234_block_22);

(cr138234_state[(2)] = null);

(cr138234_state[(2)] = cr138234_place_119);

(cr138234_state[(7)] = cr138234_place_126);

(cr138234_state[(6)] = cr138234_place_130);

return cr138234_state;
} else {
(cr138234_state[(0)] = cr138234_block_21);

(cr138234_state[(2)] = null);

(cr138234_state[(2)] = cr138234_place_119);

(cr138234_state[(6)] = cr138234_place_130);

return cr138234_state;
}
}catch (e138345){var cr138234_exception = e138345;
(cr138234_state[(0)] = null);

(cr138234_state[(3)] = null);

(cr138234_state[(5)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(1)] = null);

(cr138234_state[(4)] = null);

throw cr138234_exception;
}});
var cr138234_block_5 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_5(cr138234_state){
try{var cr138234_place_28 = (cr138234_state[(2)]);
var cr138234_place_32 = cr138234_place_28;
var cr138234_place_33 = frontend.worker.rtc.client_op.get_local_tx;
var cr138234_place_34 = repo;
var cr138234_place_35 = (function (){var G__138351 = cr138234_place_34;
var fexpr__138350 = cr138234_place_33;
return (fexpr__138350.cljs$core$IFn$_invoke$arity$1 ? fexpr__138350.cljs$core$IFn$_invoke$arity$1(G__138351) : fexpr__138350.call(null,G__138351));
})();
var cr138234_place_36 = null;
var cr138234_place_37 = false;
(cr138234_state[(0)] = cr138234_block_6);

(cr138234_state[(2)] = null);

(cr138234_state[(7)] = cr138234_place_32);

(cr138234_state[(4)] = cr138234_place_35);

(cr138234_state[(6)] = cr138234_place_36);

(cr138234_state[(2)] = cr138234_place_37);

return cr138234_state;
}catch (e138349){var cr138234_exception = e138349;
(cr138234_state[(0)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(3)] = null);

(cr138234_state[(5)] = null);

(cr138234_state[(1)] = null);

throw cr138234_exception;
}});
var cr138234_block_27 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_27(cr138234_state){
try{var cr138234_place_119 = (cr138234_state[(2)]);
var cr138234_place_2 = (cr138234_state[(3)]);
var cr138234_place_5 = (cr138234_state[(5)]);
var cr138234_place_153 = frontend.worker.rtc.client.rollback;
var cr138234_place_154 = repo;
var cr138234_place_155 = cr138234_place_2;
var cr138234_place_156 = cr138234_place_5;
var cr138234_place_157 = (function (){var G__138354 = cr138234_place_154;
var G__138355 = cr138234_place_155;
var G__138356 = cr138234_place_156;
var fexpr__138353 = cr138234_place_153;
return (fexpr__138353.cljs$core$IFn$_invoke$arity$3 ? fexpr__138353.cljs$core$IFn$_invoke$arity$3(G__138354,G__138355,G__138356) : fexpr__138353.call(null,G__138354,G__138355,G__138356));
})();
var cr138234_place_158 = cljs.core.ex_info;
var cr138234_place_159 = "Unavailable1";
var cr138234_place_160 = new cljs.core.Keyword(null,"remote-ex","remote-ex",231483810);
var cr138234_place_161 = cr138234_place_119;
var cr138234_place_162 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr138234_place_160,cr138234_place_161]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr138234_place_163 = (function (){var G__138358 = cr138234_place_159;
var G__138359 = cr138234_place_162;
var fexpr__138357 = cr138234_place_158;
return (fexpr__138357.cljs$core$IFn$_invoke$arity$2 ? fexpr__138357.cljs$core$IFn$_invoke$arity$2(G__138358,G__138359) : fexpr__138357.call(null,G__138358,G__138359));
})();
var cr138234_place_164 = (function(){throw cr138234_place_163})();
(cr138234_state[(0)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(3)] = null);

(cr138234_state[(5)] = null);

return null;
}catch (e138352){var cr138234_exception = e138352;
(cr138234_state[(0)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(3)] = null);

(cr138234_state[(5)] = null);

throw cr138234_exception;
}});
var cr138234_block_13 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_13(cr138234_state){
try{var cr138234_place_68 = missionary.core.unpark();
(cr138234_state[(0)] = cr138234_block_15);

(cr138234_state[(6)] = cr138234_place_68);

return cr138234_state;
}catch (e138360){var cr138234_exception = e138360;
(cr138234_state[(0)] = cr138234_block_14);

(cr138234_state[(6)] = cr138234_exception);

return cr138234_state;
}});
var cr138234_block_26 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_26(cr138234_state){
try{var cr138234_place_2 = (cr138234_state[(3)]);
var cr138234_place_5 = (cr138234_state[(5)]);
var cr138234_place_148 = frontend.worker.rtc.client.rollback;
var cr138234_place_149 = repo;
var cr138234_place_150 = cr138234_place_2;
var cr138234_place_151 = cr138234_place_5;
var cr138234_place_152 = (function (){var G__138363 = cr138234_place_149;
var G__138364 = cr138234_place_150;
var G__138365 = cr138234_place_151;
var fexpr__138362 = cr138234_place_148;
return (fexpr__138362.cljs$core$IFn$_invoke$arity$3 ? fexpr__138362.cljs$core$IFn$_invoke$arity$3(G__138363,G__138364,G__138365) : fexpr__138362.call(null,G__138363,G__138364,G__138365));
})();
(cr138234_state[(0)] = cr138234_block_28);

(cr138234_state[(3)] = null);

(cr138234_state[(5)] = null);

(cr138234_state[(2)] = cr138234_place_152);

return cr138234_state;
}catch (e138361){var cr138234_exception = e138361;
(cr138234_state[(0)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(3)] = null);

(cr138234_state[(5)] = null);

(cr138234_state[(1)] = null);

(cr138234_state[(4)] = null);

throw cr138234_exception;
}});
var cr138234_block_9 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_9(cr138234_state){
try{var cr138234_place_44 = (cr138234_state[(4)]);
var cr138234_place_41 = (cr138234_state[(7)]);
var cr138234_place_48 = (cr138234_state[(8)]);
var cr138234_place_46 = (cr138234_state[(10)]);
var cr138234_place_40 = (cr138234_state[(11)]);
var cr138234_place_42 = (cr138234_state[(12)]);
var cr138234_place_49 = (cr138234_state[(13)]);
var cr138234_place_52 = (cr138234_state[(15)]);
var cr138234_place_43 = (cr138234_state[(16)]);
var cr138234_place_47 = (cr138234_state[(17)]);
var cr138234_place_55 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr138234_place_44,cr138234_place_46,cr138234_place_47,cr138234_place_48,cr138234_place_42,cr138234_place_43,cr138234_place_49,cr138234_place_52,cr138234_place_40,cr138234_place_41]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr138234_place_56 = cljs.core.deref;
var cr138234_place_57 = _STAR_remote_profile_QMARK_;
var cr138234_place_58 = (function (){var G__138368 = cr138234_place_57;
var fexpr__138367 = cr138234_place_56;
return (fexpr__138367.cljs$core$IFn$_invoke$arity$1 ? fexpr__138367.cljs$core$IFn$_invoke$arity$1(G__138368) : fexpr__138367.call(null,G__138368));
})();
var cr138234_place_59 = cr138234_place_58 === true;
var cr138234_place_60 = null;
if(cr138234_place_59){
(cr138234_state[(0)] = cr138234_block_11);

(cr138234_state[(4)] = null);

(cr138234_state[(7)] = null);

(cr138234_state[(8)] = null);

(cr138234_state[(10)] = null);

(cr138234_state[(11)] = null);

(cr138234_state[(12)] = null);

(cr138234_state[(13)] = null);

(cr138234_state[(15)] = null);

(cr138234_state[(16)] = null);

(cr138234_state[(17)] = null);

(cr138234_state[(7)] = cr138234_place_55);

(cr138234_state[(4)] = cr138234_place_60);

return cr138234_state;
} else {
(cr138234_state[(0)] = cr138234_block_10);

(cr138234_state[(4)] = null);

(cr138234_state[(7)] = null);

(cr138234_state[(8)] = null);

(cr138234_state[(10)] = null);

(cr138234_state[(11)] = null);

(cr138234_state[(12)] = null);

(cr138234_state[(13)] = null);

(cr138234_state[(15)] = null);

(cr138234_state[(16)] = null);

(cr138234_state[(17)] = null);

(cr138234_state[(7)] = cr138234_place_55);

(cr138234_state[(4)] = cr138234_place_60);

return cr138234_state;
}
}catch (e138366){var cr138234_exception = e138366;
(cr138234_state[(0)] = cr138234_block_14);

(cr138234_state[(4)] = null);

(cr138234_state[(7)] = null);

(cr138234_state[(8)] = null);

(cr138234_state[(9)] = null);

(cr138234_state[(10)] = null);

(cr138234_state[(11)] = null);

(cr138234_state[(12)] = null);

(cr138234_state[(13)] = null);

(cr138234_state[(14)] = null);

(cr138234_state[(15)] = null);

(cr138234_state[(16)] = null);

(cr138234_state[(17)] = null);

(cr138234_state[(6)] = cr138234_exception);

return cr138234_state;
}});
var cr138234_block_23 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_23(cr138234_state){
try{var cr138234_place_130 = (cr138234_state[(6)]);
var cr138234_place_134 = cr138234_place_130;
var cr138234_place_135 = null;
var G__138370 = cr138234_place_134;
switch (G__138370) {
case "graph-lock-failed":
(cr138234_state[(0)] = cr138234_block_24);

(cr138234_state[(2)] = null);

(cr138234_state[(6)] = null);

(cr138234_state[(2)] = cr138234_place_135);

return cr138234_state;

break;
case "graph-lock-missing":
(cr138234_state[(0)] = cr138234_block_25);

(cr138234_state[(2)] = null);

(cr138234_state[(6)] = null);

(cr138234_state[(1)] = null);

(cr138234_state[(4)] = null);

return cr138234_state;

break;
case "rtc.exception/get-s3-object-failed":
(cr138234_state[(0)] = cr138234_block_26);

(cr138234_state[(2)] = null);

(cr138234_state[(6)] = null);

(cr138234_state[(2)] = cr138234_place_135);

return cr138234_state;

break;
default:
(cr138234_state[(0)] = cr138234_block_27);

(cr138234_state[(6)] = null);

(cr138234_state[(1)] = null);

(cr138234_state[(4)] = null);

return cr138234_state;

}
}catch (e138369){var cr138234_exception = e138369;
(cr138234_state[(0)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(3)] = null);

(cr138234_state[(5)] = null);

(cr138234_state[(6)] = null);

(cr138234_state[(1)] = null);

(cr138234_state[(4)] = null);

throw cr138234_exception;
}});
var cr138234_block_15 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_15(cr138234_state){
try{var cr138234_place_37 = (cr138234_state[(2)]);
var cr138234_place_36 = (cr138234_state[(6)]);
var cr138234_place_77 = (cljs.core.truth_(cr138234_place_37)?(function(){throw cr138234_place_36})():cr138234_place_36);
var cr138234_place_78 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr138234_place_79 = cr138234_place_77;
var cr138234_place_80 = cr138234_place_78.cljs$core$IFn$_invoke$arity$1(cr138234_place_79);
var cr138234_place_81 = cr138234_place_80;
var cr138234_place_82 = null;
if(cljs.core.truth_(cr138234_place_81)){
(cr138234_state[(0)] = cr138234_block_20);

(cr138234_state[(2)] = null);

(cr138234_state[(6)] = null);

(cr138234_state[(2)] = cr138234_place_80);

(cr138234_state[(4)] = cr138234_place_82);

return cr138234_state;
} else {
(cr138234_state[(0)] = cr138234_block_16);

(cr138234_state[(2)] = null);

(cr138234_state[(6)] = null);

(cr138234_state[(3)] = null);

(cr138234_state[(5)] = null);

(cr138234_state[(2)] = cr138234_place_77);

(cr138234_state[(4)] = cr138234_place_82);

return cr138234_state;
}
}catch (e138371){var cr138234_exception = e138371;
(cr138234_state[(0)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(6)] = null);

(cr138234_state[(3)] = null);

(cr138234_state[(5)] = null);

(cr138234_state[(1)] = null);

throw cr138234_exception;
}});
var cr138234_block_0 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_0(cr138234_state){
try{var cr138234_place_0 = frontend.worker.rtc.client_op.get_AMPERSAND_remove_all_block_ops;
var cr138234_place_1 = repo;
var cr138234_place_2 = (function (){var G__138374 = cr138234_place_1;
var fexpr__138373 = cr138234_place_0;
return (fexpr__138373.cljs$core$IFn$_invoke$arity$1 ? fexpr__138373.cljs$core$IFn$_invoke$arity$1(G__138374) : fexpr__138373.call(null,G__138374));
})();
var cr138234_place_3 = frontend.worker.rtc.client_op.get_AMPERSAND_remove_all_db_ident_kv_ops;
var cr138234_place_4 = repo;
var cr138234_place_5 = (function (){var G__138376 = cr138234_place_4;
var fexpr__138375 = cr138234_place_3;
return (fexpr__138375.cljs$core$IFn$_invoke$arity$1 ? fexpr__138375.cljs$core$IFn$_invoke$arity$1(G__138376) : fexpr__138375.call(null,G__138376));
})();
var cr138234_place_6 = cljs.core.not_empty;
var cr138234_place_7 = frontend.worker.rtc.client.gen_block_uuid__GT_remote_ops;
var cr138234_place_8 = cljs.core.deref;
var cr138234_place_9 = conn;
var cr138234_place_10 = (function (){var G__138378 = cr138234_place_9;
var fexpr__138377 = cr138234_place_8;
return (fexpr__138377.cljs$core$IFn$_invoke$arity$1 ? fexpr__138377.cljs$core$IFn$_invoke$arity$1(G__138378) : fexpr__138377.call(null,G__138378));
})();
var cr138234_place_11 = cr138234_place_2;
var cr138234_place_12 = (function (){var G__138380 = cr138234_place_10;
var G__138381 = cr138234_place_11;
var fexpr__138379 = cr138234_place_7;
return (fexpr__138379.cljs$core$IFn$_invoke$arity$2 ? fexpr__138379.cljs$core$IFn$_invoke$arity$2(G__138380,G__138381) : fexpr__138379.call(null,G__138380,G__138381));
})();
var cr138234_place_13 = (function (){var G__138383 = cr138234_place_12;
var fexpr__138382 = cr138234_place_6;
return (fexpr__138382.cljs$core$IFn$_invoke$arity$1 ? fexpr__138382.cljs$core$IFn$_invoke$arity$1(G__138383) : fexpr__138382.call(null,G__138383));
})();
var cr138234_place_14 = frontend.worker.rtc.client.gen_db_ident_kv_remote_ops;
var cr138234_place_15 = cr138234_place_5;
var cr138234_place_16 = (function (){var G__138385 = cr138234_place_15;
var fexpr__138384 = cr138234_place_14;
return (fexpr__138384.cljs$core$IFn$_invoke$arity$1 ? fexpr__138384.cljs$core$IFn$_invoke$arity$1(G__138385) : fexpr__138384.call(null,G__138385));
})();
var cr138234_place_17 = cljs.core.concat;
var cr138234_place_18 = cr138234_place_13;
var cr138234_place_19 = null;
if(cljs.core.truth_(cr138234_place_18)){
(cr138234_state[(0)] = cr138234_block_2);

(cr138234_state[(1)] = cr138234_place_17);

(cr138234_state[(2)] = cr138234_place_16);

(cr138234_state[(3)] = cr138234_place_2);

(cr138234_state[(4)] = cr138234_place_19);

(cr138234_state[(6)] = cr138234_place_13);

(cr138234_state[(5)] = cr138234_place_5);

return cr138234_state;
} else {
(cr138234_state[(0)] = cr138234_block_1);

(cr138234_state[(1)] = cr138234_place_17);

(cr138234_state[(2)] = cr138234_place_16);

(cr138234_state[(3)] = cr138234_place_2);

(cr138234_state[(4)] = cr138234_place_19);

(cr138234_state[(5)] = cr138234_place_5);

return cr138234_state;
}
}catch (e138372){var cr138234_exception = e138372;
(cr138234_state[(0)] = null);

throw cr138234_exception;
}});
var cr138234_block_6 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_6(cr138234_state){
try{var cr138234_place_35 = (cr138234_state[(4)]);
var cr138234_place_32 = (cr138234_state[(7)]);
var cr138234_place_38 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr138234_place_39 = get_ws_create_task;
var cr138234_place_40 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr138234_place_41 = "apply-ops";
var cr138234_place_42 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr138234_place_43 = graph_uuid;
var cr138234_place_44 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr138234_place_45 = major_schema_version;
var cr138234_place_46 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr138234_place_45);
var cr138234_place_47 = new cljs.core.Keyword(null,"ops","ops",1237330063);
var cr138234_place_48 = cr138234_place_32;
var cr138234_place_49 = new cljs.core.Keyword(null,"t-before","t-before",-507640180);
var cr138234_place_50 = cr138234_place_35;
var cr138234_place_51 = cr138234_place_50;
var cr138234_place_52 = null;
if(cljs.core.truth_(cr138234_place_51)){
(cr138234_state[(0)] = cr138234_block_8);

(cr138234_state[(4)] = null);

(cr138234_state[(7)] = null);

(cr138234_state[(4)] = cr138234_place_44);

(cr138234_state[(18)] = cr138234_place_50);

(cr138234_state[(7)] = cr138234_place_41);

(cr138234_state[(8)] = cr138234_place_48);

(cr138234_state[(9)] = cr138234_place_39);

(cr138234_state[(10)] = cr138234_place_46);

(cr138234_state[(11)] = cr138234_place_40);

(cr138234_state[(12)] = cr138234_place_42);

(cr138234_state[(13)] = cr138234_place_49);

(cr138234_state[(14)] = cr138234_place_38);

(cr138234_state[(15)] = cr138234_place_52);

(cr138234_state[(16)] = cr138234_place_43);

(cr138234_state[(17)] = cr138234_place_47);

return cr138234_state;
} else {
(cr138234_state[(0)] = cr138234_block_7);

(cr138234_state[(4)] = null);

(cr138234_state[(7)] = null);

(cr138234_state[(4)] = cr138234_place_44);

(cr138234_state[(7)] = cr138234_place_41);

(cr138234_state[(8)] = cr138234_place_48);

(cr138234_state[(9)] = cr138234_place_39);

(cr138234_state[(10)] = cr138234_place_46);

(cr138234_state[(11)] = cr138234_place_40);

(cr138234_state[(12)] = cr138234_place_42);

(cr138234_state[(13)] = cr138234_place_49);

(cr138234_state[(14)] = cr138234_place_38);

(cr138234_state[(15)] = cr138234_place_52);

(cr138234_state[(16)] = cr138234_place_43);

(cr138234_state[(17)] = cr138234_place_47);

return cr138234_state;
}
}catch (e138386){var cr138234_exception = e138386;
(cr138234_state[(0)] = cr138234_block_14);

(cr138234_state[(4)] = null);

(cr138234_state[(7)] = null);

(cr138234_state[(6)] = cr138234_exception);

return cr138234_state;
}});
var cr138234_block_7 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_7(cr138234_state){
try{var cr138234_place_53 = (1);
(cr138234_state[(0)] = cr138234_block_9);

(cr138234_state[(15)] = cr138234_place_53);

return cr138234_state;
}catch (e138387){var cr138234_exception = e138387;
(cr138234_state[(0)] = cr138234_block_14);

(cr138234_state[(4)] = null);

(cr138234_state[(7)] = null);

(cr138234_state[(8)] = null);

(cr138234_state[(9)] = null);

(cr138234_state[(10)] = null);

(cr138234_state[(11)] = null);

(cr138234_state[(12)] = null);

(cr138234_state[(13)] = null);

(cr138234_state[(14)] = null);

(cr138234_state[(15)] = null);

(cr138234_state[(16)] = null);

(cr138234_state[(17)] = null);

(cr138234_state[(6)] = cr138234_exception);

return cr138234_state;
}});
var cr138234_block_29 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_29(cr138234_state){
try{var cr138234_place_82 = (cr138234_state[(4)]);
(cr138234_state[(0)] = cr138234_block_30);

(cr138234_state[(4)] = null);

(cr138234_state[(1)] = cr138234_place_82);

return cr138234_state;
}catch (e138388){var cr138234_exception = e138388;
(cr138234_state[(0)] = null);

(cr138234_state[(1)] = null);

(cr138234_state[(4)] = null);

throw cr138234_exception;
}});
var cr138234_block_12 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_12(cr138234_state){
try{var cr138234_place_60 = (cr138234_state[(4)]);
var cr138234_place_39 = (cr138234_state[(9)]);
var cr138234_place_38 = (cr138234_state[(14)]);
var cr138234_place_67 = (function (){var G__138391 = cr138234_place_39;
var G__138392 = cr138234_place_60;
var fexpr__138390 = cr138234_place_38;
return (fexpr__138390.cljs$core$IFn$_invoke$arity$2 ? fexpr__138390.cljs$core$IFn$_invoke$arity$2(G__138391,G__138392) : fexpr__138390.call(null,G__138391,G__138392));
})();
(cr138234_state[(0)] = cr138234_block_13);

(cr138234_state[(4)] = null);

(cr138234_state[(9)] = null);

(cr138234_state[(14)] = null);

return missionary.core.park(cr138234_place_67);
}catch (e138389){var cr138234_exception = e138389;
(cr138234_state[(0)] = cr138234_block_14);

(cr138234_state[(4)] = null);

(cr138234_state[(9)] = null);

(cr138234_state[(14)] = null);

(cr138234_state[(6)] = cr138234_exception);

return cr138234_state;
}});
var cr138234_block_17 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_17(cr138234_state){
try{var cr138234_place_77 = (cr138234_state[(2)]);
var cr138234_place_89 = "Assert failed: ";
var cr138234_place_90 = cr138234_place_77;
var cr138234_place_91 = "\n";
var cr138234_place_92 = "(pos? (:t r))";
var cr138234_place_93 = [cr138234_place_89,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr138234_place_90),cr138234_place_91,cr138234_place_92].join('');
var cr138234_place_94 = (new Error(cr138234_place_93));
var cr138234_place_95 = (function(){throw cr138234_place_94})();
(cr138234_state[(0)] = null);

(cr138234_state[(2)] = null);

return null;
}catch (e138393){var cr138234_exception = e138393;
(cr138234_state[(0)] = null);

(cr138234_state[(2)] = null);

throw cr138234_exception;
}});
var cr138234_block_18 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_18(cr138234_state){
try{var cr138234_place_96 = null;
(cr138234_state[(0)] = cr138234_block_19);

(cr138234_state[(3)] = cr138234_place_96);

return cr138234_state;
}catch (e138394){var cr138234_exception = e138394;
(cr138234_state[(0)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(1)] = null);

(cr138234_state[(4)] = null);

(cr138234_state[(3)] = null);

throw cr138234_exception;
}});
var cr138234_block_2 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_2(cr138234_state){
try{var cr138234_place_13 = (cr138234_state[(6)]);
var cr138234_place_21 = frontend.worker.rtc.client.sort_remote_ops;
var cr138234_place_22 = cr138234_place_13;
var cr138234_place_23 = (function (){var G__138397 = cr138234_place_22;
var fexpr__138396 = cr138234_place_21;
return (fexpr__138396.cljs$core$IFn$_invoke$arity$1 ? fexpr__138396.cljs$core$IFn$_invoke$arity$1(G__138397) : fexpr__138396.call(null,G__138397));
})();
(cr138234_state[(0)] = cr138234_block_3);

(cr138234_state[(6)] = null);

(cr138234_state[(4)] = cr138234_place_23);

return cr138234_state;
}catch (e138395){var cr138234_exception = e138395;
(cr138234_state[(0)] = null);

(cr138234_state[(1)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(3)] = null);

(cr138234_state[(4)] = null);

(cr138234_state[(6)] = null);

(cr138234_state[(5)] = null);

throw cr138234_exception;
}});
var cr138234_block_8 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_8(cr138234_state){
try{var cr138234_place_50 = (cr138234_state[(18)]);
var cr138234_place_54 = cr138234_place_50;
(cr138234_state[(0)] = cr138234_block_9);

(cr138234_state[(18)] = null);

(cr138234_state[(15)] = cr138234_place_54);

return cr138234_state;
}catch (e138398){var cr138234_exception = e138398;
(cr138234_state[(0)] = cr138234_block_14);

(cr138234_state[(4)] = null);

(cr138234_state[(18)] = null);

(cr138234_state[(7)] = null);

(cr138234_state[(8)] = null);

(cr138234_state[(9)] = null);

(cr138234_state[(10)] = null);

(cr138234_state[(11)] = null);

(cr138234_state[(12)] = null);

(cr138234_state[(13)] = null);

(cr138234_state[(14)] = null);

(cr138234_state[(15)] = null);

(cr138234_state[(16)] = null);

(cr138234_state[(17)] = null);

(cr138234_state[(6)] = cr138234_exception);

return cr138234_state;
}});
var cr138234_block_19 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_19(cr138234_state){
try{var cr138234_place_77 = (cr138234_state[(2)]);
var cr138234_place_88 = (cr138234_state[(3)]);
var cr138234_place_97 = frontend.worker.rtc.remote_update.apply_remote_update;
var cr138234_place_98 = graph_uuid;
var cr138234_place_99 = repo;
var cr138234_place_100 = conn;
var cr138234_place_101 = date_formatter;
var cr138234_place_102 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr138234_place_103 = new cljs.core.Keyword(null,"remote-update","remote-update",-34961368);
var cr138234_place_104 = new cljs.core.Keyword(null,"value","value",305978217);
var cr138234_place_105 = cr138234_place_77;
var cr138234_place_106 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr138234_place_104,cr138234_place_105,cr138234_place_102,cr138234_place_103]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr138234_place_107 = add_log_fn;
var cr138234_place_108 = (function (){var G__138401 = cr138234_place_98;
var G__138402 = cr138234_place_99;
var G__138403 = cr138234_place_100;
var G__138404 = cr138234_place_101;
var G__138405 = cr138234_place_106;
var G__138406 = cr138234_place_107;
var fexpr__138400 = cr138234_place_97;
return (fexpr__138400.cljs$core$IFn$_invoke$arity$6 ? fexpr__138400.cljs$core$IFn$_invoke$arity$6(G__138401,G__138402,G__138403,G__138404,G__138405,G__138406) : fexpr__138400.call(null,G__138401,G__138402,G__138403,G__138404,G__138405,G__138406));
})();
var cr138234_place_109 = new cljs.core.Keyword("rtc.log","push-local-update","rtc.log/push-local-update",-860881879);
var cr138234_place_110 = new cljs.core.Keyword(null,"remote-t","remote-t",-1375604239);
var cr138234_place_111 = new cljs.core.Keyword(null,"t","t",-1397832519);
var cr138234_place_112 = cr138234_place_77;
var cr138234_place_113 = cr138234_place_111.cljs$core$IFn$_invoke$arity$1(cr138234_place_112);
var cr138234_place_114 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr138234_place_110,cr138234_place_113]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr138234_place_115 = add_log_fn;
var cr138234_place_116 = cr138234_place_109;
var cr138234_place_117 = cr138234_place_114;
var cr138234_place_118 = (function (){var G__138408 = cr138234_place_116;
var G__138409 = cr138234_place_117;
var fexpr__138407 = cr138234_place_115;
return (fexpr__138407.cljs$core$IFn$_invoke$arity$2 ? fexpr__138407.cljs$core$IFn$_invoke$arity$2(G__138408,G__138409) : fexpr__138407.call(null,G__138408,G__138409));
})();
(cr138234_state[(0)] = cr138234_block_29);

(cr138234_state[(2)] = null);

(cr138234_state[(3)] = null);

(cr138234_state[(4)] = cr138234_place_118);

return cr138234_state;
}catch (e138399){var cr138234_exception = e138399;
(cr138234_state[(0)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(1)] = null);

(cr138234_state[(4)] = null);

(cr138234_state[(3)] = null);

throw cr138234_exception;
}});
var cr138234_block_24 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_24(cr138234_state){
try{var cr138234_place_2 = (cr138234_state[(3)]);
var cr138234_place_5 = (cr138234_state[(5)]);
var cr138234_place_136 = frontend.worker.rtc.client.rollback;
var cr138234_place_137 = repo;
var cr138234_place_138 = cr138234_place_2;
var cr138234_place_139 = cr138234_place_5;
var cr138234_place_140 = (function (){var G__138412 = cr138234_place_137;
var G__138413 = cr138234_place_138;
var G__138414 = cr138234_place_139;
var fexpr__138411 = cr138234_place_136;
return (fexpr__138411.cljs$core$IFn$_invoke$arity$3 ? fexpr__138411.cljs$core$IFn$_invoke$arity$3(G__138412,G__138413,G__138414) : fexpr__138411.call(null,G__138412,G__138413,G__138414));
})();
(cr138234_state[(0)] = cr138234_block_28);

(cr138234_state[(3)] = null);

(cr138234_state[(5)] = null);

(cr138234_state[(2)] = cr138234_place_140);

return cr138234_state;
}catch (e138410){var cr138234_exception = e138410;
(cr138234_state[(0)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(3)] = null);

(cr138234_state[(5)] = null);

(cr138234_state[(1)] = null);

(cr138234_state[(4)] = null);

throw cr138234_exception;
}});
var cr138234_block_14 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_14(cr138234_state){
try{var cr138234_place_36 = (cr138234_state[(6)]);
var cr138234_place_2 = (cr138234_state[(3)]);
var cr138234_place_5 = (cr138234_state[(5)]);
var cr138234_place_69 = cr138234_place_36;
var cr138234_place_70 = frontend.worker.rtc.client.rollback;
var cr138234_place_71 = repo;
var cr138234_place_72 = cr138234_place_2;
var cr138234_place_73 = cr138234_place_5;
var cr138234_place_74 = (function (){var G__138417 = cr138234_place_71;
var G__138418 = cr138234_place_72;
var G__138419 = cr138234_place_73;
var fexpr__138416 = cr138234_place_70;
return (fexpr__138416.cljs$core$IFn$_invoke$arity$3 ? fexpr__138416.cljs$core$IFn$_invoke$arity$3(G__138417,G__138418,G__138419) : fexpr__138416.call(null,G__138417,G__138418,G__138419));
})();
var cr138234_place_75 = cr138234_place_69;
var cr138234_place_76 = (function(){throw cr138234_place_75})();
(cr138234_state[(0)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(6)] = null);

(cr138234_state[(3)] = null);

(cr138234_state[(5)] = null);

(cr138234_state[(1)] = null);

return null;
}catch (e138415){var cr138234_exception = e138415;
(cr138234_state[(0)] = cr138234_block_15);

(cr138234_state[(2)] = true);

(cr138234_state[(6)] = cr138234_exception);

return cr138234_state;
}});
var cr138234_block_11 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_11(cr138234_state){
try{var cr138234_place_55 = (cr138234_state[(7)]);
var cr138234_place_62 = cljs.core.assoc;
var cr138234_place_63 = cr138234_place_55;
var cr138234_place_64 = new cljs.core.Keyword(null,"profile","profile",-545963874);
var cr138234_place_65 = true;
var cr138234_place_66 = (function (){var G__138422 = cr138234_place_63;
var G__138423 = cr138234_place_64;
var G__138424 = cr138234_place_65;
var fexpr__138421 = cr138234_place_62;
return (fexpr__138421.cljs$core$IFn$_invoke$arity$3 ? fexpr__138421.cljs$core$IFn$_invoke$arity$3(G__138422,G__138423,G__138424) : fexpr__138421.call(null,G__138422,G__138423,G__138424));
})();
(cr138234_state[(0)] = cr138234_block_12);

(cr138234_state[(7)] = null);

(cr138234_state[(4)] = cr138234_place_66);

return cr138234_state;
}catch (e138420){var cr138234_exception = e138420;
(cr138234_state[(0)] = cr138234_block_14);

(cr138234_state[(4)] = null);

(cr138234_state[(9)] = null);

(cr138234_state[(7)] = null);

(cr138234_state[(14)] = null);

(cr138234_state[(6)] = cr138234_exception);

return cr138234_state;
}});
var cr138234_block_22 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_22(cr138234_state){
try{var cr138234_place_126 = (cr138234_state[(7)]);
var cr138234_place_132 = cr138234_place_126;
var cr138234_place_133 = cr138234_place_132.fqn;
(cr138234_state[(0)] = cr138234_block_23);

(cr138234_state[(7)] = null);

(cr138234_state[(6)] = cr138234_place_133);

return cr138234_state;
}catch (e138425){var cr138234_exception = e138425;
(cr138234_state[(0)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(7)] = null);

(cr138234_state[(3)] = null);

(cr138234_state[(5)] = null);

(cr138234_state[(6)] = null);

(cr138234_state[(1)] = null);

(cr138234_state[(4)] = null);

throw cr138234_exception;
}});
var cr138234_block_1 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_1(cr138234_state){
try{var cr138234_place_20 = null;
(cr138234_state[(0)] = cr138234_block_3);

(cr138234_state[(4)] = cr138234_place_20);

return cr138234_state;
}catch (e138426){var cr138234_exception = e138426;
(cr138234_state[(0)] = null);

(cr138234_state[(1)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(3)] = null);

(cr138234_state[(4)] = null);

(cr138234_state[(5)] = null);

throw cr138234_exception;
}});
var cr138234_block_28 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_28(cr138234_state){
try{var cr138234_place_135 = (cr138234_state[(2)]);
(cr138234_state[(0)] = cr138234_block_29);

(cr138234_state[(2)] = null);

(cr138234_state[(4)] = cr138234_place_135);

return cr138234_state;
}catch (e138427){var cr138234_exception = e138427;
(cr138234_state[(0)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(1)] = null);

(cr138234_state[(4)] = null);

throw cr138234_exception;
}});
var cr138234_block_10 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_10(cr138234_state){
try{var cr138234_place_55 = (cr138234_state[(7)]);
var cr138234_place_61 = cr138234_place_55;
(cr138234_state[(0)] = cr138234_block_12);

(cr138234_state[(7)] = null);

(cr138234_state[(4)] = cr138234_place_61);

return cr138234_state;
}catch (e138428){var cr138234_exception = e138428;
(cr138234_state[(0)] = cr138234_block_14);

(cr138234_state[(4)] = null);

(cr138234_state[(9)] = null);

(cr138234_state[(7)] = null);

(cr138234_state[(14)] = null);

(cr138234_state[(6)] = cr138234_exception);

return cr138234_state;
}});
var cr138234_block_21 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_21(cr138234_state){
try{var cr138234_place_131 = null;
(cr138234_state[(0)] = cr138234_block_23);

(cr138234_state[(6)] = cr138234_place_131);

return cr138234_state;
}catch (e138429){var cr138234_exception = e138429;
(cr138234_state[(0)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(3)] = null);

(cr138234_state[(5)] = null);

(cr138234_state[(6)] = null);

(cr138234_state[(1)] = null);

(cr138234_state[(4)] = null);

throw cr138234_exception;
}});
var cr138234_block_3 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_3(cr138234_state){
try{var cr138234_place_17 = (cr138234_state[(1)]);
var cr138234_place_16 = (cr138234_state[(2)]);
var cr138234_place_19 = (cr138234_state[(4)]);
var cr138234_place_24 = cr138234_place_16;
var cr138234_place_25 = (function (){var G__138432 = cr138234_place_19;
var G__138433 = cr138234_place_24;
var fexpr__138431 = cr138234_place_17;
return (fexpr__138431.cljs$core$IFn$_invoke$arity$2 ? fexpr__138431.cljs$core$IFn$_invoke$arity$2(G__138432,G__138433) : fexpr__138431.call(null,G__138432,G__138433));
})();
var cr138234_place_26 = frontend.worker.rtc.malli_schema.to_ws_ops_decoder;
var cr138234_place_27 = cr138234_place_25;
var cr138234_place_28 = (function (){var G__138435 = cr138234_place_27;
var fexpr__138434 = cr138234_place_26;
return (fexpr__138434.cljs$core$IFn$_invoke$arity$1 ? fexpr__138434.cljs$core$IFn$_invoke$arity$1(G__138435) : fexpr__138434.call(null,G__138435));
})();
var cr138234_place_29 = cr138234_place_28;
var cr138234_place_30 = null;
if(cljs.core.truth_(cr138234_place_29)){
(cr138234_state[(0)] = cr138234_block_5);

(cr138234_state[(1)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(4)] = null);

(cr138234_state[(2)] = cr138234_place_28);

(cr138234_state[(1)] = cr138234_place_30);

return cr138234_state;
} else {
(cr138234_state[(0)] = cr138234_block_4);

(cr138234_state[(1)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(3)] = null);

(cr138234_state[(4)] = null);

(cr138234_state[(5)] = null);

(cr138234_state[(1)] = cr138234_place_30);

return cr138234_state;
}
}catch (e138430){var cr138234_exception = e138430;
(cr138234_state[(0)] = null);

(cr138234_state[(1)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(3)] = null);

(cr138234_state[(4)] = null);

(cr138234_state[(5)] = null);

throw cr138234_exception;
}});
var cr138234_block_16 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_16(cr138234_state){
try{var cr138234_place_77 = (cr138234_state[(2)]);
var cr138234_place_83 = new cljs.core.Keyword(null,"t","t",-1397832519);
var cr138234_place_84 = cr138234_place_77;
var cr138234_place_85 = cr138234_place_83.cljs$core$IFn$_invoke$arity$1(cr138234_place_84);
var cr138234_place_86 = (0);
var cr138234_place_87 = (cr138234_place_85 > cr138234_place_86);
var cr138234_place_88 = null;
if(cr138234_place_87){
(cr138234_state[(0)] = cr138234_block_18);

(cr138234_state[(3)] = cr138234_place_88);

return cr138234_state;
} else {
(cr138234_state[(0)] = cr138234_block_17);

(cr138234_state[(1)] = null);

(cr138234_state[(4)] = null);

return cr138234_state;
}
}catch (e138436){var cr138234_exception = e138436;
(cr138234_state[(0)] = null);

(cr138234_state[(2)] = null);

(cr138234_state[(1)] = null);

(cr138234_state[(4)] = null);

throw cr138234_exception;
}});
var cr138234_block_30 = (function frontend$worker$rtc$client$new_task__push_local_ops_$_cr138234_block_30(cr138234_state){
try{var cr138234_place_30 = (cr138234_state[(1)]);
(cr138234_state[(0)] = null);

(cr138234_state[(1)] = null);

return cr138234_place_30;
}catch (e138437){var cr138234_exception = e138437;
(cr138234_state[(0)] = null);

(cr138234_state[(1)] = null);

throw cr138234_exception;
}});
return cloroutine.impl.coroutine((function (){var G__138438 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((19));
(G__138438[(0)] = cr138234_block_0);

return G__138438;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.client.new_task__pull_remote_data = (function frontend$worker$rtc$client$new_task__pull_remote_data(repo,conn,graph_uuid,major_schema_version,date_formatter,get_ws_create_task,add_log_fn){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr138439_block_18 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr138439_block_18(cr138439_state){
try{var cr138439_place_27 = (cr138439_state[(2)]);
(cr138439_state[(0)] = null);

(cr138439_state[(2)] = null);

return cr138439_place_27;
}catch (e138490){var cr138439_exception = e138490;
(cr138439_state[(0)] = null);

(cr138439_state[(2)] = null);

throw cr138439_exception;
}});
var cr138439_block_1 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr138439_block_1(cr138439_state){
try{var cr138439_place_18 = (1);
(cr138439_state[(0)] = cr138439_block_3);

(cr138439_state[(2)] = cr138439_place_18);

return cr138439_state;
}catch (e138491){var cr138439_exception = e138491;
(cr138439_state[(0)] = null);

(cr138439_state[(1)] = null);

(cr138439_state[(2)] = null);

(cr138439_state[(3)] = null);

(cr138439_state[(4)] = null);

(cr138439_state[(5)] = null);

(cr138439_state[(6)] = null);

(cr138439_state[(7)] = null);

(cr138439_state[(8)] = null);

(cr138439_state[(9)] = null);

(cr138439_state[(10)] = null);

(cr138439_state[(11)] = null);

(cr138439_state[(12)] = null);

(cr138439_state[(13)] = null);

throw cr138439_exception;
}});
var cr138439_block_9 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr138439_block_9(cr138439_state){
try{var cr138439_place_25 = (cr138439_state[(1)]);
var cr138439_place_68 = cr138439_place_25;
var cr138439_place_69 = new cljs.core.Keyword("rtc.log","push-local-update","rtc.log/push-local-update",-860881879);
var cr138439_place_70 = cljs.core.assoc;
var cr138439_place_71 = cr138439_place_68;
var cr138439_place_72 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr138439_place_73 = new cljs.core.Keyword(null,"pull-remote-data","pull-remote-data",57037214);
var cr138439_place_74 = (function (){var G__138494 = cr138439_place_71;
var G__138495 = cr138439_place_72;
var G__138496 = cr138439_place_73;
var fexpr__138493 = cr138439_place_70;
return (fexpr__138493.cljs$core$IFn$_invoke$arity$3 ? fexpr__138493.cljs$core$IFn$_invoke$arity$3(G__138494,G__138495,G__138496) : fexpr__138493.call(null,G__138494,G__138495,G__138496));
})();
var cr138439_place_75 = add_log_fn;
var cr138439_place_76 = cr138439_place_69;
var cr138439_place_77 = cr138439_place_74;
var cr138439_place_78 = (function (){var G__138498 = cr138439_place_76;
var G__138499 = cr138439_place_77;
var fexpr__138497 = cr138439_place_75;
return (fexpr__138497.cljs$core$IFn$_invoke$arity$2 ? fexpr__138497.cljs$core$IFn$_invoke$arity$2(G__138498,G__138499) : fexpr__138497.call(null,G__138498,G__138499));
})();
var cr138439_place_79 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr138439_place_80 = cr138439_place_68;
var cr138439_place_81 = cr138439_place_79.cljs$core$IFn$_invoke$arity$1(cr138439_place_80);
var cr138439_place_82 = cr138439_place_81;
var cr138439_place_83 = cljs.core.Keyword;
var cr138439_place_84 = (cr138439_place_82 instanceof cr138439_place_83);
var cr138439_place_85 = null;
if(cr138439_place_84){
(cr138439_state[(0)] = cr138439_block_11);

(cr138439_state[(1)] = null);

(cr138439_state[(1)] = cr138439_place_85);

(cr138439_state[(4)] = cr138439_place_81);

(cr138439_state[(3)] = cr138439_place_68);

return cr138439_state;
} else {
(cr138439_state[(0)] = cr138439_block_10);

(cr138439_state[(1)] = null);

(cr138439_state[(1)] = cr138439_place_85);

(cr138439_state[(3)] = cr138439_place_68);

return cr138439_state;
}
}catch (e138492){var cr138439_exception = e138492;
(cr138439_state[(0)] = null);

(cr138439_state[(1)] = null);

(cr138439_state[(2)] = null);

throw cr138439_exception;
}});
var cr138439_block_3 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr138439_block_3(cr138439_state){
try{var cr138439_place_9 = (cr138439_state[(1)]);
var cr138439_place_17 = (cr138439_state[(2)]);
var cr138439_place_12 = (cr138439_state[(3)]);
var cr138439_place_14 = (cr138439_state[(4)]);
var cr138439_place_4 = (cr138439_state[(6)]);
var cr138439_place_5 = (cr138439_state[(7)]);
var cr138439_place_11 = (cr138439_state[(8)]);
var cr138439_place_6 = (cr138439_state[(9)]);
var cr138439_place_13 = (cr138439_state[(10)]);
var cr138439_place_3 = (cr138439_state[(11)]);
var cr138439_place_7 = (cr138439_state[(12)]);
var cr138439_place_8 = (cr138439_state[(13)]);
var cr138439_place_20 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr138439_place_7,cr138439_place_8,cr138439_place_5,cr138439_place_6,cr138439_place_12,cr138439_place_13,cr138439_place_14,cr138439_place_17,cr138439_place_9,cr138439_place_11]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr138439_place_21 = (function (){var G__138502 = cr138439_place_4;
var G__138503 = cr138439_place_20;
var fexpr__138501 = cr138439_place_3;
return (fexpr__138501.cljs$core$IFn$_invoke$arity$2 ? fexpr__138501.cljs$core$IFn$_invoke$arity$2(G__138502,G__138503) : fexpr__138501.call(null,G__138502,G__138503));
})();
(cr138439_state[(0)] = cr138439_block_4);

(cr138439_state[(1)] = null);

(cr138439_state[(2)] = null);

(cr138439_state[(3)] = null);

(cr138439_state[(4)] = null);

(cr138439_state[(6)] = null);

(cr138439_state[(7)] = null);

(cr138439_state[(8)] = null);

(cr138439_state[(9)] = null);

(cr138439_state[(10)] = null);

(cr138439_state[(11)] = null);

(cr138439_state[(12)] = null);

(cr138439_state[(13)] = null);

return missionary.core.park(cr138439_place_21);
}catch (e138500){var cr138439_exception = e138500;
(cr138439_state[(0)] = null);

(cr138439_state[(1)] = null);

(cr138439_state[(2)] = null);

(cr138439_state[(3)] = null);

(cr138439_state[(4)] = null);

(cr138439_state[(5)] = null);

(cr138439_state[(6)] = null);

(cr138439_state[(7)] = null);

(cr138439_state[(8)] = null);

(cr138439_state[(9)] = null);

(cr138439_state[(10)] = null);

(cr138439_state[(11)] = null);

(cr138439_state[(12)] = null);

(cr138439_state[(13)] = null);

throw cr138439_exception;
}});
var cr138439_block_16 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr138439_block_16(cr138439_state){
try{var cr138439_place_68 = (cr138439_state[(3)]);
var cr138439_place_95 = cljs.core.ex_info;
var cr138439_place_96 = "Unavailable3";
var cr138439_place_97 = new cljs.core.Keyword(null,"remote-ex","remote-ex",231483810);
var cr138439_place_98 = cr138439_place_68;
var cr138439_place_99 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr138439_place_97,cr138439_place_98]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr138439_place_100 = (function (){var G__138506 = cr138439_place_96;
var G__138507 = cr138439_place_99;
var fexpr__138505 = cr138439_place_95;
return (fexpr__138505.cljs$core$IFn$_invoke$arity$2 ? fexpr__138505.cljs$core$IFn$_invoke$arity$2(G__138506,G__138507) : fexpr__138505.call(null,G__138506,G__138507));
})();
var cr138439_place_101 = (function(){throw cr138439_place_100})();
(cr138439_state[(0)] = null);

(cr138439_state[(3)] = null);

return null;
}catch (e138504){var cr138439_exception = e138504;
(cr138439_state[(0)] = null);

(cr138439_state[(3)] = null);

throw cr138439_exception;
}});
var cr138439_block_14 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr138439_block_14(cr138439_state){
try{var cr138439_place_92 = frontend.worker.rtc.exception.ex_remote_graph_lock_missing;
var cr138439_place_93 = (function(){throw cr138439_place_92})();
(cr138439_state[(0)] = null);

return null;
}catch (e138508){var cr138439_exception = e138508;
(cr138439_state[(0)] = null);

throw cr138439_exception;
}});
var cr138439_block_0 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr138439_block_0(cr138439_state){
try{var cr138439_place_0 = frontend.worker.rtc.client_op.get_local_tx;
var cr138439_place_1 = repo;
var cr138439_place_2 = (function (){var G__138511 = cr138439_place_1;
var fexpr__138510 = cr138439_place_0;
return (fexpr__138510.cljs$core$IFn$_invoke$arity$1 ? fexpr__138510.cljs$core$IFn$_invoke$arity$1(G__138511) : fexpr__138510.call(null,G__138511));
})();
var cr138439_place_3 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr138439_place_4 = get_ws_create_task;
var cr138439_place_5 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr138439_place_6 = "apply-ops";
var cr138439_place_7 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr138439_place_8 = graph_uuid;
var cr138439_place_9 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr138439_place_10 = major_schema_version;
var cr138439_place_11 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr138439_place_10);
var cr138439_place_12 = new cljs.core.Keyword(null,"ops","ops",1237330063);
var cr138439_place_13 = cljs.core.with_meta(cljs.core.PersistentVector.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr138439_place_14 = new cljs.core.Keyword(null,"t-before","t-before",-507640180);
var cr138439_place_15 = cr138439_place_2;
var cr138439_place_16 = cr138439_place_15;
var cr138439_place_17 = null;
if(cljs.core.truth_(cr138439_place_16)){
(cr138439_state[(0)] = cr138439_block_2);

(cr138439_state[(1)] = cr138439_place_9);

(cr138439_state[(2)] = cr138439_place_17);

(cr138439_state[(14)] = cr138439_place_15);

(cr138439_state[(3)] = cr138439_place_12);

(cr138439_state[(4)] = cr138439_place_14);

(cr138439_state[(5)] = cr138439_place_2);

(cr138439_state[(6)] = cr138439_place_4);

(cr138439_state[(7)] = cr138439_place_5);

(cr138439_state[(8)] = cr138439_place_11);

(cr138439_state[(9)] = cr138439_place_6);

(cr138439_state[(10)] = cr138439_place_13);

(cr138439_state[(11)] = cr138439_place_3);

(cr138439_state[(12)] = cr138439_place_7);

(cr138439_state[(13)] = cr138439_place_8);

return cr138439_state;
} else {
(cr138439_state[(0)] = cr138439_block_1);

(cr138439_state[(1)] = cr138439_place_9);

(cr138439_state[(2)] = cr138439_place_17);

(cr138439_state[(3)] = cr138439_place_12);

(cr138439_state[(4)] = cr138439_place_14);

(cr138439_state[(5)] = cr138439_place_2);

(cr138439_state[(6)] = cr138439_place_4);

(cr138439_state[(7)] = cr138439_place_5);

(cr138439_state[(8)] = cr138439_place_11);

(cr138439_state[(9)] = cr138439_place_6);

(cr138439_state[(10)] = cr138439_place_13);

(cr138439_state[(11)] = cr138439_place_3);

(cr138439_state[(12)] = cr138439_place_7);

(cr138439_state[(13)] = cr138439_place_8);

return cr138439_state;
}
}catch (e138509){var cr138439_exception = e138509;
(cr138439_state[(0)] = null);

throw cr138439_exception;
}});
var cr138439_block_4 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr138439_block_4(cr138439_state){
try{var cr138439_place_22 = missionary.core.unpark();
var cr138439_place_23 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr138439_place_24 = cr138439_place_22;
var cr138439_place_25 = cr138439_place_23.cljs$core$IFn$_invoke$arity$1(cr138439_place_24);
var cr138439_place_26 = cr138439_place_25;
var cr138439_place_27 = null;
if(cljs.core.truth_(cr138439_place_26)){
(cr138439_state[(0)] = cr138439_block_9);

(cr138439_state[(5)] = null);

(cr138439_state[(1)] = cr138439_place_25);

(cr138439_state[(2)] = cr138439_place_27);

return cr138439_state;
} else {
(cr138439_state[(0)] = cr138439_block_5);

(cr138439_state[(1)] = cr138439_place_22);

(cr138439_state[(2)] = cr138439_place_27);

return cr138439_state;
}
}catch (e138512){var cr138439_exception = e138512;
(cr138439_state[(0)] = null);

(cr138439_state[(5)] = null);

throw cr138439_exception;
}});
var cr138439_block_12 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr138439_block_12(cr138439_state){
try{var cr138439_place_85 = (cr138439_state[(1)]);
var cr138439_place_89 = cr138439_place_85;
var cr138439_place_90 = null;
var G__138514 = cr138439_place_89;
switch (G__138514) {
case "graph-lock-failed":
(cr138439_state[(0)] = cr138439_block_13);

(cr138439_state[(1)] = null);

(cr138439_state[(3)] = null);

(cr138439_state[(1)] = cr138439_place_90);

return cr138439_state;

break;
case "graph-lock-missing":
(cr138439_state[(0)] = cr138439_block_14);

(cr138439_state[(1)] = null);

(cr138439_state[(3)] = null);

(cr138439_state[(2)] = null);

return cr138439_state;

break;
case "rtc.exception/get-s3-object-failed":
(cr138439_state[(0)] = cr138439_block_15);

(cr138439_state[(1)] = null);

(cr138439_state[(3)] = null);

(cr138439_state[(1)] = cr138439_place_90);

return cr138439_state;

break;
default:
(cr138439_state[(0)] = cr138439_block_16);

(cr138439_state[(1)] = null);

(cr138439_state[(2)] = null);

return cr138439_state;

}
}catch (e138513){var cr138439_exception = e138513;
(cr138439_state[(0)] = null);

(cr138439_state[(1)] = null);

(cr138439_state[(3)] = null);

(cr138439_state[(2)] = null);

throw cr138439_exception;
}});
var cr138439_block_5 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr138439_block_5(cr138439_state){
try{var cr138439_place_22 = (cr138439_state[(1)]);
var cr138439_place_28 = new cljs.core.Keyword(null,"t","t",-1397832519);
var cr138439_place_29 = cr138439_place_22;
var cr138439_place_30 = cr138439_place_28.cljs$core$IFn$_invoke$arity$1(cr138439_place_29);
var cr138439_place_31 = (0);
var cr138439_place_32 = (cr138439_place_30 > cr138439_place_31);
var cr138439_place_33 = null;
if(cr138439_place_32){
(cr138439_state[(0)] = cr138439_block_7);

(cr138439_state[(3)] = cr138439_place_33);

return cr138439_state;
} else {
(cr138439_state[(0)] = cr138439_block_6);

(cr138439_state[(5)] = null);

(cr138439_state[(2)] = null);

return cr138439_state;
}
}catch (e138515){var cr138439_exception = e138515;
(cr138439_state[(0)] = null);

(cr138439_state[(1)] = null);

(cr138439_state[(5)] = null);

(cr138439_state[(2)] = null);

throw cr138439_exception;
}});
var cr138439_block_17 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr138439_block_17(cr138439_state){
try{var cr138439_place_90 = (cr138439_state[(1)]);
(cr138439_state[(0)] = cr138439_block_18);

(cr138439_state[(1)] = null);

(cr138439_state[(2)] = cr138439_place_90);

return cr138439_state;
}catch (e138516){var cr138439_exception = e138516;
(cr138439_state[(0)] = null);

(cr138439_state[(1)] = null);

(cr138439_state[(2)] = null);

throw cr138439_exception;
}});
var cr138439_block_2 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr138439_block_2(cr138439_state){
try{var cr138439_place_15 = (cr138439_state[(14)]);
var cr138439_place_19 = cr138439_place_15;
(cr138439_state[(0)] = cr138439_block_3);

(cr138439_state[(14)] = null);

(cr138439_state[(2)] = cr138439_place_19);

return cr138439_state;
}catch (e138517){var cr138439_exception = e138517;
(cr138439_state[(0)] = null);

(cr138439_state[(1)] = null);

(cr138439_state[(2)] = null);

(cr138439_state[(14)] = null);

(cr138439_state[(3)] = null);

(cr138439_state[(4)] = null);

(cr138439_state[(5)] = null);

(cr138439_state[(6)] = null);

(cr138439_state[(7)] = null);

(cr138439_state[(8)] = null);

(cr138439_state[(9)] = null);

(cr138439_state[(10)] = null);

(cr138439_state[(11)] = null);

(cr138439_state[(12)] = null);

(cr138439_state[(13)] = null);

throw cr138439_exception;
}});
var cr138439_block_15 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr138439_block_15(cr138439_state){
try{var cr138439_place_94 = null;
(cr138439_state[(0)] = cr138439_block_17);

(cr138439_state[(1)] = cr138439_place_94);

return cr138439_state;
}catch (e138518){var cr138439_exception = e138518;
(cr138439_state[(0)] = null);

(cr138439_state[(1)] = null);

(cr138439_state[(2)] = null);

throw cr138439_exception;
}});
var cr138439_block_10 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr138439_block_10(cr138439_state){
try{var cr138439_place_86 = null;
(cr138439_state[(0)] = cr138439_block_12);

(cr138439_state[(1)] = cr138439_place_86);

return cr138439_state;
}catch (e138519){var cr138439_exception = e138519;
(cr138439_state[(0)] = null);

(cr138439_state[(1)] = null);

(cr138439_state[(3)] = null);

(cr138439_state[(2)] = null);

throw cr138439_exception;
}});
var cr138439_block_11 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr138439_block_11(cr138439_state){
try{var cr138439_place_81 = (cr138439_state[(4)]);
var cr138439_place_87 = cr138439_place_81;
var cr138439_place_88 = cr138439_place_87.fqn;
(cr138439_state[(0)] = cr138439_block_12);

(cr138439_state[(4)] = null);

(cr138439_state[(1)] = cr138439_place_88);

return cr138439_state;
}catch (e138520){var cr138439_exception = e138520;
(cr138439_state[(0)] = null);

(cr138439_state[(1)] = null);

(cr138439_state[(4)] = null);

(cr138439_state[(3)] = null);

(cr138439_state[(2)] = null);

throw cr138439_exception;
}});
var cr138439_block_13 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr138439_block_13(cr138439_state){
try{var cr138439_place_91 = null;
(cr138439_state[(0)] = cr138439_block_17);

(cr138439_state[(1)] = cr138439_place_91);

return cr138439_state;
}catch (e138521){var cr138439_exception = e138521;
(cr138439_state[(0)] = null);

(cr138439_state[(1)] = null);

(cr138439_state[(2)] = null);

throw cr138439_exception;
}});
var cr138439_block_7 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr138439_block_7(cr138439_state){
try{var cr138439_place_41 = null;
(cr138439_state[(0)] = cr138439_block_8);

(cr138439_state[(3)] = cr138439_place_41);

return cr138439_state;
}catch (e138522){var cr138439_exception = e138522;
(cr138439_state[(0)] = null);

(cr138439_state[(1)] = null);

(cr138439_state[(3)] = null);

(cr138439_state[(5)] = null);

(cr138439_state[(2)] = null);

throw cr138439_exception;
}});
var cr138439_block_8 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr138439_block_8(cr138439_state){
try{var cr138439_place_22 = (cr138439_state[(1)]);
var cr138439_place_33 = (cr138439_state[(3)]);
var cr138439_place_2 = (cr138439_state[(5)]);
var cr138439_place_42 = frontend.worker.rtc.remote_update.apply_remote_update;
var cr138439_place_43 = graph_uuid;
var cr138439_place_44 = repo;
var cr138439_place_45 = conn;
var cr138439_place_46 = date_formatter;
var cr138439_place_47 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr138439_place_48 = new cljs.core.Keyword(null,"remote-update","remote-update",-34961368);
var cr138439_place_49 = new cljs.core.Keyword(null,"value","value",305978217);
var cr138439_place_50 = cr138439_place_22;
var cr138439_place_51 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr138439_place_47,cr138439_place_48,cr138439_place_49,cr138439_place_50]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr138439_place_52 = add_log_fn;
var cr138439_place_53 = (function (){var G__138525 = cr138439_place_43;
var G__138526 = cr138439_place_44;
var G__138527 = cr138439_place_45;
var G__138528 = cr138439_place_46;
var G__138529 = cr138439_place_51;
var G__138530 = cr138439_place_52;
var fexpr__138524 = cr138439_place_42;
return (fexpr__138524.cljs$core$IFn$_invoke$arity$6 ? fexpr__138524.cljs$core$IFn$_invoke$arity$6(G__138525,G__138526,G__138527,G__138528,G__138529,G__138530) : fexpr__138524.call(null,G__138525,G__138526,G__138527,G__138528,G__138529,G__138530));
})();
var cr138439_place_54 = new cljs.core.Keyword("rtc.log","push-local-update","rtc.log/push-local-update",-860881879);
var cr138439_place_55 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr138439_place_56 = new cljs.core.Keyword(null,"pull-remote-data","pull-remote-data",57037214);
var cr138439_place_57 = new cljs.core.Keyword(null,"remote-t","remote-t",-1375604239);
var cr138439_place_58 = new cljs.core.Keyword(null,"t","t",-1397832519);
var cr138439_place_59 = cr138439_place_22;
var cr138439_place_60 = cr138439_place_58.cljs$core$IFn$_invoke$arity$1(cr138439_place_59);
var cr138439_place_61 = new cljs.core.Keyword(null,"local-t","local-t",-2128577077);
var cr138439_place_62 = cr138439_place_2;
var cr138439_place_63 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr138439_place_57,cr138439_place_60,cr138439_place_61,cr138439_place_62,cr138439_place_55,cr138439_place_56]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr138439_place_64 = add_log_fn;
var cr138439_place_65 = cr138439_place_54;
var cr138439_place_66 = cr138439_place_63;
var cr138439_place_67 = (function (){var G__138532 = cr138439_place_65;
var G__138533 = cr138439_place_66;
var fexpr__138531 = cr138439_place_64;
return (fexpr__138531.cljs$core$IFn$_invoke$arity$2 ? fexpr__138531.cljs$core$IFn$_invoke$arity$2(G__138532,G__138533) : fexpr__138531.call(null,G__138532,G__138533));
})();
(cr138439_state[(0)] = cr138439_block_18);

(cr138439_state[(1)] = null);

(cr138439_state[(3)] = null);

(cr138439_state[(5)] = null);

(cr138439_state[(2)] = cr138439_place_67);

return cr138439_state;
}catch (e138523){var cr138439_exception = e138523;
(cr138439_state[(0)] = null);

(cr138439_state[(1)] = null);

(cr138439_state[(3)] = null);

(cr138439_state[(5)] = null);

(cr138439_state[(2)] = null);

throw cr138439_exception;
}});
var cr138439_block_6 = (function frontend$worker$rtc$client$new_task__pull_remote_data_$_cr138439_block_6(cr138439_state){
try{var cr138439_place_22 = (cr138439_state[(1)]);
var cr138439_place_34 = "Assert failed: ";
var cr138439_place_35 = cr138439_place_22;
var cr138439_place_36 = "\n";
var cr138439_place_37 = "(pos? (:t r))";
var cr138439_place_38 = [cr138439_place_34,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr138439_place_35),cr138439_place_36,cr138439_place_37].join('');
var cr138439_place_39 = (new Error(cr138439_place_38));
var cr138439_place_40 = (function(){throw cr138439_place_39})();
(cr138439_state[(0)] = null);

(cr138439_state[(1)] = null);

return null;
}catch (e138534){var cr138439_exception = e138534;
(cr138439_state[(0)] = null);

(cr138439_state[(1)] = null);

throw cr138439_exception;
}});
return cloroutine.impl.coroutine((function (){var G__138535 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((15));
(G__138535[(0)] = cr138439_block_0);

return G__138535;
})());
})(),missionary.core.sp_run);
});

//# sourceMappingURL=frontend.worker.rtc.client.js.map
