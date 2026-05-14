goog.provide('frontend.worker.rtc.skeleton');
frontend.worker.rtc.skeleton.get_builtin_db_idents = (function frontend$worker$rtc$skeleton$get_builtin_db_idents(db){
var G__134028 = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?i","?i",1333985104,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Symbol(null,"?i","?i",1333985104,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160)], null)], null);
var G__134029 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__134028,G__134029) : datascript.core.q.call(null,G__134028,G__134029));
});
frontend.worker.rtc.skeleton.new_task__calibrate_graph_skeleton = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton(get_ws_create_task,graph_uuid,major_schema_version,db){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr134031_block_0 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_0(cr134031_state){
try{var cr134031_place_0 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr134031_place_1 = get_ws_create_task;
var cr134031_place_2 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr134031_place_3 = "get-graph-skeleton";
var cr134031_place_4 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr134031_place_5 = graph_uuid;
var cr134031_place_6 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr134031_place_7 = major_schema_version;
var cr134031_place_8 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr134031_place_7);
var cr134031_place_9 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr134031_place_2,cr134031_place_3,cr134031_place_4,cr134031_place_5,cr134031_place_6,cr134031_place_8]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr134031_place_10 = (function (){var G__134289 = cr134031_place_1;
var G__134290 = cr134031_place_9;
var fexpr__134288 = cr134031_place_0;
return (fexpr__134288.cljs$core$IFn$_invoke$arity$2 ? fexpr__134288.cljs$core$IFn$_invoke$arity$2(G__134289,G__134290) : fexpr__134288.call(null,G__134289,G__134290));
})();
(cr134031_state[(0)] = cr134031_block_1);

return missionary.core.park(cr134031_place_10);
}catch (e134267){var cr134031_exception = e134267;
(cr134031_state[(0)] = null);

throw cr134031_exception;
}});
var cr134031_block_19 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_19(cr134031_state){
try{var cr134031_place_137 = cljs.core.ex_info;
var cr134031_place_138 = "retry calibrate-graph-skeleton";
var cr134031_place_139 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr134031_place_140 = true;
var cr134031_place_141 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr134031_place_139,cr134031_place_140]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr134031_place_142 = (function (){var G__134324 = cr134031_place_138;
var G__134325 = cr134031_place_141;
var fexpr__134323 = cr134031_place_137;
return (fexpr__134323.cljs$core$IFn$_invoke$arity$2 ? fexpr__134323.cljs$core$IFn$_invoke$arity$2(G__134324,G__134325) : fexpr__134323.call(null,G__134324,G__134325));
})();
var cr134031_place_143 = (function(){throw cr134031_place_142})();
(cr134031_state[(0)] = null);

return null;
}catch (e134310){var cr134031_exception = e134310;
(cr134031_state[(0)] = null);

throw cr134031_exception;
}});
var cr134031_block_10 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_10(cr134031_state){
try{var cr134031_place_75 = (cr134031_state[(5)]);
var cr134031_place_97 = (cr134031_state[(8)]);
var cr134031_place_107 = cljs.core.seq;
var cr134031_place_108 = cr134031_place_75;
var cr134031_place_109 = (function (){var G__134345 = cr134031_place_108;
var fexpr__134344 = cr134031_place_107;
return (fexpr__134344.cljs$core$IFn$_invoke$arity$1 ? fexpr__134344.cljs$core$IFn$_invoke$arity$1(G__134345) : fexpr__134344.call(null,G__134345));
})();
var cr134031_place_110 = null;
if(cljs.core.truth_(cr134031_place_109)){
(cr134031_state[(0)] = cr134031_block_12);

(cr134031_state[(4)] = cr134031_place_110);

return cr134031_state;
} else {
(cr134031_state[(0)] = cr134031_block_11);

(cr134031_state[(5)] = null);

(cr134031_state[(4)] = cr134031_place_110);

return cr134031_state;
}
}catch (e134336){var cr134031_exception = e134336;
(cr134031_state[(0)] = null);

(cr134031_state[(5)] = null);

(cr134031_state[(6)] = null);

(cr134031_state[(1)] = null);

(cr134031_state[(8)] = null);

(cr134031_state[(2)] = null);

(cr134031_state[(3)] = null);

(cr134031_state[(9)] = null);

throw cr134031_exception;
}});
var cr134031_block_21 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_21(cr134031_state){
try{var cr134031_place_16 = (cr134031_state[(1)]);
(cr134031_state[(0)] = null);

(cr134031_state[(1)] = null);

return cr134031_place_16;
}catch (e134354){var cr134031_exception = e134354;
(cr134031_state[(0)] = null);

(cr134031_state[(1)] = null);

throw cr134031_exception;
}});
var cr134031_block_5 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_5(cr134031_state){
try{var cr134031_place_33 = (cr134031_state[(3)]);
var cr134031_place_43 = (cr134031_state[(5)]);
var cr134031_place_28 = (cr134031_state[(6)]);
var cr134031_place_62 = clojure.data.diff;
var cr134031_place_63 = cr134031_place_33;
var cr134031_place_64 = cr134031_place_28;
var cr134031_place_65 = (function (){var G__134390 = cr134031_place_63;
var G__134391 = cr134031_place_64;
var fexpr__134389 = cr134031_place_62;
return (fexpr__134389.cljs$core$IFn$_invoke$arity$2 ? fexpr__134389.cljs$core$IFn$_invoke$arity$2(G__134390,G__134391) : fexpr__134389.call(null,G__134390,G__134391));
})();
var cr134031_place_66 = cljs.core.nth;
var cr134031_place_67 = cr134031_place_65;
var cr134031_place_68 = (0);
var cr134031_place_69 = null;
var cr134031_place_70 = (function (){var G__134397 = cr134031_place_67;
var G__134398 = cr134031_place_68;
var G__134399 = cr134031_place_69;
var fexpr__134396 = cr134031_place_66;
return (fexpr__134396.cljs$core$IFn$_invoke$arity$3 ? fexpr__134396.cljs$core$IFn$_invoke$arity$3(G__134397,G__134398,G__134399) : fexpr__134396.call(null,G__134397,G__134398,G__134399));
})();
var cr134031_place_71 = cljs.core.nth;
var cr134031_place_72 = cr134031_place_65;
var cr134031_place_73 = (1);
var cr134031_place_74 = null;
var cr134031_place_75 = (function (){var G__134408 = cr134031_place_72;
var G__134409 = cr134031_place_73;
var G__134410 = cr134031_place_74;
var fexpr__134407 = cr134031_place_71;
return (fexpr__134407.cljs$core$IFn$_invoke$arity$3 ? fexpr__134407.cljs$core$IFn$_invoke$arity$3(G__134408,G__134409,G__134410) : fexpr__134407.call(null,G__134408,G__134409,G__134410));
})();
var cr134031_place_76 = cljs.core.nth;
var cr134031_place_77 = cr134031_place_65;
var cr134031_place_78 = (2);
var cr134031_place_79 = null;
var cr134031_place_80 = (function (){var G__134421 = cr134031_place_77;
var G__134422 = cr134031_place_78;
var G__134423 = cr134031_place_79;
var fexpr__134420 = cr134031_place_76;
return (fexpr__134420.cljs$core$IFn$_invoke$arity$3 ? fexpr__134420.cljs$core$IFn$_invoke$arity$3(G__134421,G__134422,G__134423) : fexpr__134420.call(null,G__134421,G__134422,G__134423));
})();
var cr134031_place_81 = cljs.core.seq;
var cr134031_place_82 = cr134031_place_70;
var cr134031_place_83 = (function (){var G__134435 = cr134031_place_82;
var fexpr__134433 = cr134031_place_81;
return (fexpr__134433.cljs$core$IFn$_invoke$arity$1 ? fexpr__134433.cljs$core$IFn$_invoke$arity$1(G__134435) : fexpr__134433.call(null,G__134435));
})();
var cr134031_place_84 = cljs.core.seq;
var cr134031_place_85 = cr134031_place_75;
var cr134031_place_86 = (function (){var G__134438 = cr134031_place_85;
var fexpr__134437 = cr134031_place_84;
return (fexpr__134437.cljs$core$IFn$_invoke$arity$1 ? fexpr__134437.cljs$core$IFn$_invoke$arity$1(G__134438) : fexpr__134437.call(null,G__134438));
})();
var cr134031_place_87 = ((cr134031_place_83) || (cr134031_place_86));
var cr134031_place_88 = null;
if(cr134031_place_87){
(cr134031_state[(0)] = cr134031_block_7);

(cr134031_state[(3)] = null);

(cr134031_state[(5)] = null);

(cr134031_state[(6)] = null);

(cr134031_state[(4)] = cr134031_place_70);

(cr134031_state[(5)] = cr134031_place_75);

(cr134031_state[(3)] = cr134031_place_88);

return cr134031_state;
} else {
(cr134031_state[(0)] = cr134031_block_6);

(cr134031_state[(3)] = null);

(cr134031_state[(5)] = null);

(cr134031_state[(6)] = null);

(cr134031_state[(3)] = cr134031_place_88);

return cr134031_state;
}
}catch (e134367){var cr134031_exception = e134367;
(cr134031_state[(0)] = null);

(cr134031_state[(3)] = null);

(cr134031_state[(5)] = null);

(cr134031_state[(1)] = null);

(cr134031_state[(6)] = null);

(cr134031_state[(2)] = null);

throw cr134031_exception;
}});
var cr134031_block_17 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_17(cr134031_state){
try{var cr134031_place_127 = (cr134031_state[(3)]);
var cr134031_place_133 = cr134031_place_127;
var cr134031_place_134 = cr134031_place_133.fqn;
(cr134031_state[(0)] = cr134031_block_18);

(cr134031_state[(3)] = null);

(cr134031_state[(1)] = cr134031_place_134);

return cr134031_state;
}catch (e134458){var cr134031_exception = e134458;
(cr134031_state[(0)] = null);

(cr134031_state[(3)] = null);

(cr134031_state[(1)] = null);

(cr134031_state[(2)] = null);

throw cr134031_exception;
}});
var cr134031_block_16 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_16(cr134031_state){
try{var cr134031_place_132 = null;
(cr134031_state[(0)] = cr134031_block_18);

(cr134031_state[(1)] = cr134031_place_132);

return cr134031_state;
}catch (e134476){var cr134031_exception = e134476;
(cr134031_state[(0)] = null);

(cr134031_state[(1)] = null);

(cr134031_state[(2)] = null);

throw cr134031_exception;
}});
var cr134031_block_11 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_11(cr134031_state){
try{var cr134031_place_97 = (cr134031_state[(8)]);
var cr134031_place_111 = cr134031_place_97;
(cr134031_state[(0)] = cr134031_block_13);

(cr134031_state[(8)] = null);

(cr134031_state[(4)] = cr134031_place_111);

return cr134031_state;
}catch (e134482){var cr134031_exception = e134482;
(cr134031_state[(0)] = null);

(cr134031_state[(6)] = null);

(cr134031_state[(1)] = null);

(cr134031_state[(8)] = null);

(cr134031_state[(2)] = null);

(cr134031_state[(3)] = null);

(cr134031_state[(4)] = null);

(cr134031_state[(9)] = null);

throw cr134031_exception;
}});
var cr134031_block_4 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_4(cr134031_state){
try{var cr134031_place_61 = null;
(cr134031_state[(0)] = cr134031_block_5);

(cr134031_state[(5)] = cr134031_place_61);

return cr134031_state;
}catch (e134515){var cr134031_exception = e134515;
(cr134031_state[(0)] = null);

(cr134031_state[(3)] = null);

(cr134031_state[(5)] = null);

(cr134031_state[(1)] = null);

(cr134031_state[(6)] = null);

(cr134031_state[(2)] = null);

throw cr134031_exception;
}});
var cr134031_block_13 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_13(cr134031_state){
try{var cr134031_place_91 = (cr134031_state[(6)]);
var cr134031_place_110 = (cr134031_state[(4)]);
var cr134031_place_90 = (cr134031_state[(9)]);
var cr134031_place_120 = new cljs.core.Keyword(null,"error","error",-978969032);
var cr134031_place_121 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr134031_place_110,cr134031_place_120], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr134031_place_122 = (function (){var G__134535 = cr134031_place_91;
var G__134536 = cr134031_place_121;
var fexpr__134534 = cr134031_place_90;
return (fexpr__134534.cljs$core$IFn$_invoke$arity$2 ? fexpr__134534.cljs$core$IFn$_invoke$arity$2(G__134535,G__134536) : fexpr__134534.call(null,G__134535,G__134536));
})();
(cr134031_state[(0)] = cr134031_block_14);

(cr134031_state[(6)] = null);

(cr134031_state[(4)] = null);

(cr134031_state[(9)] = null);

(cr134031_state[(3)] = cr134031_place_122);

return cr134031_state;
}catch (e134526){var cr134031_exception = e134526;
(cr134031_state[(0)] = null);

(cr134031_state[(6)] = null);

(cr134031_state[(1)] = null);

(cr134031_state[(2)] = null);

(cr134031_state[(3)] = null);

(cr134031_state[(4)] = null);

(cr134031_state[(9)] = null);

throw cr134031_exception;
}});
var cr134031_block_3 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_3(cr134031_state){
try{var cr134031_place_36 = (cr134031_state[(4)]);
var cr134031_place_24 = (cr134031_state[(7)]);
var cr134031_place_44 = frontend.worker.shared_service.broadcast_to_clients_BANG_;
var cr134031_place_45 = new cljs.core.Keyword(null,"notification","notification",-222338233);
var cr134031_place_46 = new cljs.core.Keyword(null,"div","div",1057191632);
var cr134031_place_47 = new cljs.core.Keyword(null,"p","p",151049309);
var cr134031_place_48 = new cljs.core.Keyword(null,"client-schema-version","client-schema-version",-315922744);
var cr134031_place_49 = cr134031_place_36;
var cr134031_place_50 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr134031_place_48),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr134031_place_49)].join('');
var cr134031_place_51 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr134031_place_47,cr134031_place_50], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr134031_place_52 = new cljs.core.Keyword(null,"p","p",151049309);
var cr134031_place_53 = new cljs.core.Keyword(null,"server-schema-version","server-schema-version",765611123);
var cr134031_place_54 = cr134031_place_24;
var cr134031_place_55 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr134031_place_53),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr134031_place_54)].join('');
var cr134031_place_56 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr134031_place_52,cr134031_place_55], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr134031_place_57 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr134031_place_46,cr134031_place_51,cr134031_place_56], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr134031_place_58 = new cljs.core.Keyword(null,"error","error",-978969032);
var cr134031_place_59 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr134031_place_57,cr134031_place_58], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr134031_place_60 = (function (){var G__134570 = cr134031_place_45;
var G__134571 = cr134031_place_59;
var fexpr__134569 = cr134031_place_44;
return (fexpr__134569.cljs$core$IFn$_invoke$arity$2 ? fexpr__134569.cljs$core$IFn$_invoke$arity$2(G__134570,G__134571) : fexpr__134569.call(null,G__134570,G__134571));
})();
(cr134031_state[(0)] = cr134031_block_5);

(cr134031_state[(4)] = null);

(cr134031_state[(7)] = null);

(cr134031_state[(5)] = cr134031_place_60);

return cr134031_state;
}catch (e134548){var cr134031_exception = e134548;
(cr134031_state[(0)] = null);

(cr134031_state[(3)] = null);

(cr134031_state[(4)] = null);

(cr134031_state[(5)] = null);

(cr134031_state[(1)] = null);

(cr134031_state[(6)] = null);

(cr134031_state[(2)] = null);

(cr134031_state[(7)] = null);

throw cr134031_exception;
}});
var cr134031_block_2 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_2(cr134031_state){
try{var cr134031_place_11 = (cr134031_state[(2)]);
var cr134031_place_17 = cr134031_place_11;
var cr134031_place_18 = cljs.core.__destructure_map;
var cr134031_place_19 = cr134031_place_17;
var cr134031_place_20 = (function (){var G__134589 = cr134031_place_19;
var fexpr__134588 = cr134031_place_18;
return (fexpr__134588.cljs$core$IFn$_invoke$arity$1 ? fexpr__134588.cljs$core$IFn$_invoke$arity$1(G__134589) : fexpr__134588.call(null,G__134589));
})();
var cr134031_place_21 = cljs.core.get;
var cr134031_place_22 = cr134031_place_20;
var cr134031_place_23 = new cljs.core.Keyword(null,"server-schema-version","server-schema-version",765611123);
var cr134031_place_24 = (function (){var G__134597 = cr134031_place_22;
var G__134598 = cr134031_place_23;
var fexpr__134596 = cr134031_place_21;
return (fexpr__134596.cljs$core$IFn$_invoke$arity$2 ? fexpr__134596.cljs$core$IFn$_invoke$arity$2(G__134597,G__134598) : fexpr__134596.call(null,G__134597,G__134598));
})();
var cr134031_place_25 = cljs.core.get;
var cr134031_place_26 = cr134031_place_20;
var cr134031_place_27 = new cljs.core.Keyword(null,"server-builtin-db-idents","server-builtin-db-idents",-224246711);
var cr134031_place_28 = (function (){var G__134603 = cr134031_place_26;
var G__134604 = cr134031_place_27;
var fexpr__134602 = cr134031_place_25;
return (fexpr__134602.cljs$core$IFn$_invoke$arity$2 ? fexpr__134602.cljs$core$IFn$_invoke$arity$2(G__134603,G__134604) : fexpr__134602.call(null,G__134603,G__134604));
})();
var cr134031_place_29 = cljs.core.set;
var cr134031_place_30 = frontend.worker.rtc.skeleton.get_builtin_db_idents;
var cr134031_place_31 = db;
var cr134031_place_32 = (function (){var G__134608 = cr134031_place_31;
var fexpr__134607 = cr134031_place_30;
return (fexpr__134607.cljs$core$IFn$_invoke$arity$1 ? fexpr__134607.cljs$core$IFn$_invoke$arity$1(G__134608) : fexpr__134607.call(null,G__134608));
})();
var cr134031_place_33 = (function (){var G__134610 = cr134031_place_32;
var fexpr__134609 = cr134031_place_29;
return (fexpr__134609.cljs$core$IFn$_invoke$arity$1 ? fexpr__134609.cljs$core$IFn$_invoke$arity$1(G__134610) : fexpr__134609.call(null,G__134610));
})();
var cr134031_place_34 = logseq.db.get_graph_schema_version;
var cr134031_place_35 = db;
var cr134031_place_36 = (function (){var G__134613 = cr134031_place_35;
var fexpr__134612 = cr134031_place_34;
return (fexpr__134612.cljs$core$IFn$_invoke$arity$1 ? fexpr__134612.cljs$core$IFn$_invoke$arity$1(G__134613) : fexpr__134612.call(null,G__134613));
})();
var cr134031_place_37 = logseq.db.frontend.schema.compare_schema_version;
var cr134031_place_38 = cr134031_place_36;
var cr134031_place_39 = cr134031_place_24;
var cr134031_place_40 = (function (){var G__134618 = cr134031_place_38;
var G__134619 = cr134031_place_39;
var fexpr__134617 = cr134031_place_37;
return (fexpr__134617.cljs$core$IFn$_invoke$arity$2 ? fexpr__134617.cljs$core$IFn$_invoke$arity$2(G__134618,G__134619) : fexpr__134617.call(null,G__134618,G__134619));
})();
var cr134031_place_41 = (0);
var cr134031_place_42 = (cr134031_place_40 === cr134031_place_41);
var cr134031_place_43 = null;
if(cr134031_place_42){
(cr134031_state[(0)] = cr134031_block_4);

(cr134031_state[(3)] = cr134031_place_33);

(cr134031_state[(5)] = cr134031_place_43);

(cr134031_state[(6)] = cr134031_place_28);

return cr134031_state;
} else {
(cr134031_state[(0)] = cr134031_block_3);

(cr134031_state[(3)] = cr134031_place_33);

(cr134031_state[(4)] = cr134031_place_36);

(cr134031_state[(5)] = cr134031_place_43);

(cr134031_state[(6)] = cr134031_place_28);

(cr134031_state[(7)] = cr134031_place_24);

return cr134031_state;
}
}catch (e134581){var cr134031_exception = e134581;
(cr134031_state[(0)] = null);

(cr134031_state[(1)] = null);

(cr134031_state[(2)] = null);

throw cr134031_exception;
}});
var cr134031_block_9 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_9(cr134031_state){
try{var cr134031_place_70 = (cr134031_state[(4)]);
var cr134031_place_93 = (cr134031_state[(7)]);
var cr134031_place_99 = cljs.core.conj;
var cr134031_place_100 = cr134031_place_93;
var cr134031_place_101 = new cljs.core.Keyword(null,"p","p",151049309);
var cr134031_place_102 = new cljs.core.Keyword(null,"client-only-db-idents","client-only-db-idents",257889577);
var cr134031_place_103 = cr134031_place_70;
var cr134031_place_104 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr134031_place_102),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr134031_place_103)].join('');
var cr134031_place_105 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr134031_place_101,cr134031_place_104], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr134031_place_106 = (function (){var G__134640 = cr134031_place_100;
var G__134641 = cr134031_place_105;
var fexpr__134639 = cr134031_place_99;
return (fexpr__134639.cljs$core$IFn$_invoke$arity$2 ? fexpr__134639.cljs$core$IFn$_invoke$arity$2(G__134640,G__134641) : fexpr__134639.call(null,G__134640,G__134641));
})();
(cr134031_state[(0)] = cr134031_block_10);

(cr134031_state[(4)] = null);

(cr134031_state[(7)] = null);

(cr134031_state[(8)] = cr134031_place_106);

return cr134031_state;
}catch (e134630){var cr134031_exception = e134630;
(cr134031_state[(0)] = null);

(cr134031_state[(4)] = null);

(cr134031_state[(5)] = null);

(cr134031_state[(6)] = null);

(cr134031_state[(7)] = null);

(cr134031_state[(1)] = null);

(cr134031_state[(8)] = null);

(cr134031_state[(2)] = null);

(cr134031_state[(3)] = null);

(cr134031_state[(9)] = null);

throw cr134031_exception;
}});
var cr134031_block_1 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_1(cr134031_state){
try{var cr134031_place_11 = missionary.core.unpark();
var cr134031_place_12 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr134031_place_13 = cr134031_place_11;
var cr134031_place_14 = cr134031_place_12.cljs$core$IFn$_invoke$arity$1(cr134031_place_13);
var cr134031_place_15 = cr134031_place_14;
var cr134031_place_16 = null;
if(cljs.core.truth_(cr134031_place_15)){
(cr134031_state[(0)] = cr134031_block_15);

(cr134031_state[(1)] = cr134031_place_14);

return cr134031_state;
} else {
(cr134031_state[(0)] = cr134031_block_2);

(cr134031_state[(2)] = cr134031_place_11);

(cr134031_state[(1)] = cr134031_place_16);

return cr134031_state;
}
}catch (e134648){var cr134031_exception = e134648;
(cr134031_state[(0)] = null);

throw cr134031_exception;
}});
var cr134031_block_20 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_20(cr134031_state){
try{var cr134031_place_124 = (cr134031_state[(2)]);
var cr134031_place_144 = lambdaisland.glogi.log;
var cr134031_place_145 = "frontend.worker.rtc.skeleton";
var cr134031_place_146 = new cljs.core.Keyword(null,"info","info",-317069002);
var cr134031_place_147 = cljs.core.identity;
var cr134031_place_148 = new cljs.core.Keyword(null,"remote-ex","remote-ex",231483810);
var cr134031_place_149 = cr134031_place_124;
var cr134031_place_150 = new cljs.core.Keyword(null,"line","line",212345235);
var cr134031_place_151 = 34;
var cr134031_place_152 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr134031_place_148,cr134031_place_149,cr134031_place_150,cr134031_place_151]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr134031_place_153 = (function (){var G__134674 = cr134031_place_152;
var fexpr__134673 = cr134031_place_147;
return (fexpr__134673.cljs$core$IFn$_invoke$arity$1 ? fexpr__134673.cljs$core$IFn$_invoke$arity$1(G__134674) : fexpr__134673.call(null,G__134674));
})();
var cr134031_place_154 = null;
var cr134031_place_155 = (function (){var G__134685 = cr134031_place_145;
var G__134686 = cr134031_place_146;
var G__134687 = cr134031_place_153;
var G__134688 = cr134031_place_154;
var fexpr__134684 = cr134031_place_144;
return (fexpr__134684.cljs$core$IFn$_invoke$arity$4 ? fexpr__134684.cljs$core$IFn$_invoke$arity$4(G__134685,G__134686,G__134687,G__134688) : fexpr__134684.call(null,G__134685,G__134686,G__134687,G__134688));
})();
var cr134031_place_156 = cljs.core.ex_info;
var cr134031_place_157 = "Unavailable2";
var cr134031_place_158 = new cljs.core.Keyword(null,"remote-ex","remote-ex",231483810);
var cr134031_place_159 = cr134031_place_124;
var cr134031_place_160 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr134031_place_158,cr134031_place_159]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr134031_place_161 = (function (){var G__134698 = cr134031_place_157;
var G__134699 = cr134031_place_160;
var fexpr__134697 = cr134031_place_156;
return (fexpr__134697.cljs$core$IFn$_invoke$arity$2 ? fexpr__134697.cljs$core$IFn$_invoke$arity$2(G__134698,G__134699) : fexpr__134697.call(null,G__134698,G__134699));
})();
var cr134031_place_162 = (function(){throw cr134031_place_161})();
(cr134031_state[(0)] = null);

(cr134031_state[(2)] = null);

return null;
}catch (e134656){var cr134031_exception = e134656;
(cr134031_state[(0)] = null);

(cr134031_state[(2)] = null);

throw cr134031_exception;
}});
var cr134031_block_12 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_12(cr134031_state){
try{var cr134031_place_75 = (cr134031_state[(5)]);
var cr134031_place_97 = (cr134031_state[(8)]);
var cr134031_place_112 = cljs.core.conj;
var cr134031_place_113 = cr134031_place_97;
var cr134031_place_114 = new cljs.core.Keyword(null,"p","p",151049309);
var cr134031_place_115 = new cljs.core.Keyword(null,"server-only-db-idents","server-only-db-idents",1822593065);
var cr134031_place_116 = cr134031_place_75;
var cr134031_place_117 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr134031_place_115),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr134031_place_116)].join('');
var cr134031_place_118 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr134031_place_114,cr134031_place_117], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr134031_place_119 = (function (){var G__134731 = cr134031_place_113;
var G__134732 = cr134031_place_118;
var fexpr__134730 = cr134031_place_112;
return (fexpr__134730.cljs$core$IFn$_invoke$arity$2 ? fexpr__134730.cljs$core$IFn$_invoke$arity$2(G__134731,G__134732) : fexpr__134730.call(null,G__134731,G__134732));
})();
(cr134031_state[(0)] = cr134031_block_13);

(cr134031_state[(5)] = null);

(cr134031_state[(8)] = null);

(cr134031_state[(4)] = cr134031_place_119);

return cr134031_state;
}catch (e134711){var cr134031_exception = e134711;
(cr134031_state[(0)] = null);

(cr134031_state[(5)] = null);

(cr134031_state[(6)] = null);

(cr134031_state[(1)] = null);

(cr134031_state[(8)] = null);

(cr134031_state[(2)] = null);

(cr134031_state[(3)] = null);

(cr134031_state[(4)] = null);

(cr134031_state[(9)] = null);

throw cr134031_exception;
}});
var cr134031_block_7 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_7(cr134031_state){
try{var cr134031_place_70 = (cr134031_state[(4)]);
var cr134031_place_90 = frontend.worker.shared_service.broadcast_to_clients_BANG_;
var cr134031_place_91 = new cljs.core.Keyword(null,"notification","notification",-222338233);
var cr134031_place_92 = new cljs.core.Keyword(null,"div","div",1057191632);
var cr134031_place_93 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr134031_place_92], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr134031_place_94 = cljs.core.seq;
var cr134031_place_95 = cr134031_place_70;
var cr134031_place_96 = (function (){var G__134761 = cr134031_place_95;
var fexpr__134760 = cr134031_place_94;
return (fexpr__134760.cljs$core$IFn$_invoke$arity$1 ? fexpr__134760.cljs$core$IFn$_invoke$arity$1(G__134761) : fexpr__134760.call(null,G__134761));
})();
var cr134031_place_97 = null;
if(cljs.core.truth_(cr134031_place_96)){
(cr134031_state[(0)] = cr134031_block_9);

(cr134031_state[(9)] = cr134031_place_90);

(cr134031_state[(6)] = cr134031_place_91);

(cr134031_state[(7)] = cr134031_place_93);

(cr134031_state[(8)] = cr134031_place_97);

return cr134031_state;
} else {
(cr134031_state[(0)] = cr134031_block_8);

(cr134031_state[(4)] = null);

(cr134031_state[(9)] = cr134031_place_90);

(cr134031_state[(6)] = cr134031_place_91);

(cr134031_state[(7)] = cr134031_place_93);

(cr134031_state[(8)] = cr134031_place_97);

return cr134031_state;
}
}catch (e134745){var cr134031_exception = e134745;
(cr134031_state[(0)] = null);

(cr134031_state[(4)] = null);

(cr134031_state[(5)] = null);

(cr134031_state[(1)] = null);

(cr134031_state[(2)] = null);

(cr134031_state[(3)] = null);

throw cr134031_exception;
}});
var cr134031_block_18 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_18(cr134031_state){
try{var cr134031_place_131 = (cr134031_state[(1)]);
var cr134031_place_135 = cr134031_place_131;
var cr134031_place_136 = null;
var G__134809 = cr134031_place_135;
switch (G__134809) {
case "graph-lock-failed":
(cr134031_state[(0)] = cr134031_block_19);

(cr134031_state[(1)] = null);

(cr134031_state[(2)] = null);

return cr134031_state;

break;
default:
(cr134031_state[(0)] = cr134031_block_20);

(cr134031_state[(1)] = null);

return cr134031_state;

}
}catch (e134804){var cr134031_exception = e134804;
(cr134031_state[(0)] = null);

(cr134031_state[(1)] = null);

(cr134031_state[(2)] = null);

throw cr134031_exception;
}});
var cr134031_block_15 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_15(cr134031_state){
try{var cr134031_place_14 = (cr134031_state[(1)]);
var cr134031_place_124 = cr134031_place_14;
var cr134031_place_125 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr134031_place_126 = cr134031_place_124;
var cr134031_place_127 = cr134031_place_125.cljs$core$IFn$_invoke$arity$1(cr134031_place_126);
var cr134031_place_128 = cr134031_place_127;
var cr134031_place_129 = cljs.core.Keyword;
var cr134031_place_130 = (cr134031_place_128 instanceof cr134031_place_129);
var cr134031_place_131 = null;
if(cr134031_place_130){
(cr134031_state[(0)] = cr134031_block_17);

(cr134031_state[(1)] = null);

(cr134031_state[(2)] = cr134031_place_124);

(cr134031_state[(3)] = cr134031_place_127);

(cr134031_state[(1)] = cr134031_place_131);

return cr134031_state;
} else {
(cr134031_state[(0)] = cr134031_block_16);

(cr134031_state[(1)] = null);

(cr134031_state[(2)] = cr134031_place_124);

(cr134031_state[(1)] = cr134031_place_131);

return cr134031_state;
}
}catch (e134829){var cr134031_exception = e134829;
(cr134031_state[(0)] = null);

(cr134031_state[(1)] = null);

throw cr134031_exception;
}});
var cr134031_block_6 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_6(cr134031_state){
try{var cr134031_place_89 = null;
(cr134031_state[(0)] = cr134031_block_14);

(cr134031_state[(3)] = cr134031_place_89);

return cr134031_state;
}catch (e134847){var cr134031_exception = e134847;
(cr134031_state[(0)] = null);

(cr134031_state[(1)] = null);

(cr134031_state[(2)] = null);

(cr134031_state[(3)] = null);

throw cr134031_exception;
}});
var cr134031_block_8 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_8(cr134031_state){
try{var cr134031_place_93 = (cr134031_state[(7)]);
var cr134031_place_98 = cr134031_place_93;
(cr134031_state[(0)] = cr134031_block_10);

(cr134031_state[(7)] = null);

(cr134031_state[(8)] = cr134031_place_98);

return cr134031_state;
}catch (e134850){var cr134031_exception = e134850;
(cr134031_state[(0)] = null);

(cr134031_state[(5)] = null);

(cr134031_state[(6)] = null);

(cr134031_state[(7)] = null);

(cr134031_state[(1)] = null);

(cr134031_state[(8)] = null);

(cr134031_state[(2)] = null);

(cr134031_state[(3)] = null);

(cr134031_state[(9)] = null);

throw cr134031_exception;
}});
var cr134031_block_14 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr134031_block_14(cr134031_state){
try{var cr134031_place_11 = (cr134031_state[(2)]);
var cr134031_place_88 = (cr134031_state[(3)]);
var cr134031_place_123 = cr134031_place_11;
(cr134031_state[(0)] = cr134031_block_21);

(cr134031_state[(2)] = null);

(cr134031_state[(3)] = null);

(cr134031_state[(1)] = cr134031_place_123);

return cr134031_state;
}catch (e134862){var cr134031_exception = e134862;
(cr134031_state[(0)] = null);

(cr134031_state[(1)] = null);

(cr134031_state[(2)] = null);

(cr134031_state[(3)] = null);

throw cr134031_exception;
}});
return cloroutine.impl.coroutine((function (){var G__134876 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((10));
(G__134876[(0)] = cr134031_block_0);

return G__134876;
})());
})(),missionary.core.sp_run);
});

//# sourceMappingURL=frontend.worker.rtc.skeleton.js.map
