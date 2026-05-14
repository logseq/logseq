goog.provide('frontend.worker.rtc.skeleton');
frontend.worker.rtc.skeleton.get_builtin_db_idents = (function frontend$worker$rtc$skeleton$get_builtin_db_idents(db){
var G__101838 = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?i","?i",1333985104,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Symbol(null,"?i","?i",1333985104,null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160)], null)], null);
var G__101839 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__101838,G__101839) : datascript.core.q.call(null,G__101838,G__101839));
});
frontend.worker.rtc.skeleton.new_task__calibrate_graph_skeleton = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton(get_ws_create_task,graph_uuid,major_schema_version,db){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr101844_block_8 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_8(cr101844_state){
try{var cr101844_place_93 = (cr101844_state[(8)]);
var cr101844_place_98 = cr101844_place_93;
(cr101844_state[(0)] = cr101844_block_10);

(cr101844_state[(8)] = null);

(cr101844_state[(6)] = cr101844_place_98);

return cr101844_state;
}catch (e102207){var cr101844_exception = e102207;
(cr101844_state[(0)] = null);

(cr101844_state[(6)] = null);

(cr101844_state[(7)] = null);

(cr101844_state[(8)] = null);

(cr101844_state[(5)] = null);

(cr101844_state[(9)] = null);

(cr101844_state[(3)] = null);

(cr101844_state[(1)] = null);

(cr101844_state[(2)] = null);

throw cr101844_exception;
}});
var cr101844_block_6 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_6(cr101844_state){
try{var cr101844_place_89 = null;
(cr101844_state[(0)] = cr101844_block_14);

(cr101844_state[(3)] = cr101844_place_89);

return cr101844_state;
}catch (e102216){var cr101844_exception = e102216;
(cr101844_state[(0)] = null);

(cr101844_state[(3)] = null);

(cr101844_state[(1)] = null);

(cr101844_state[(2)] = null);

throw cr101844_exception;
}});
var cr101844_block_9 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_9(cr101844_state){
try{var cr101844_place_70 = (cr101844_state[(4)]);
var cr101844_place_93 = (cr101844_state[(8)]);
var cr101844_place_99 = cljs.core.conj;
var cr101844_place_100 = cr101844_place_93;
var cr101844_place_101 = new cljs.core.Keyword(null,"p","p",151049309);
var cr101844_place_102 = new cljs.core.Keyword(null,"client-only-db-idents","client-only-db-idents",257889577);
var cr101844_place_103 = cr101844_place_70;
var cr101844_place_104 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr101844_place_102),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr101844_place_103)].join('');
var cr101844_place_105 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr101844_place_101,cr101844_place_104], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr101844_place_106 = (function (){var G__102232 = cr101844_place_100;
var G__102233 = cr101844_place_105;
var fexpr__102231 = cr101844_place_99;
return (fexpr__102231.cljs$core$IFn$_invoke$arity$2 ? fexpr__102231.cljs$core$IFn$_invoke$arity$2(G__102232,G__102233) : fexpr__102231.call(null,G__102232,G__102233));
})();
(cr101844_state[(0)] = cr101844_block_10);

(cr101844_state[(4)] = null);

(cr101844_state[(8)] = null);

(cr101844_state[(6)] = cr101844_place_106);

return cr101844_state;
}catch (e102222){var cr101844_exception = e102222;
(cr101844_state[(0)] = null);

(cr101844_state[(6)] = null);

(cr101844_state[(4)] = null);

(cr101844_state[(7)] = null);

(cr101844_state[(8)] = null);

(cr101844_state[(5)] = null);

(cr101844_state[(9)] = null);

(cr101844_state[(3)] = null);

(cr101844_state[(1)] = null);

(cr101844_state[(2)] = null);

throw cr101844_exception;
}});
var cr101844_block_15 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_15(cr101844_state){
try{var cr101844_place_14 = (cr101844_state[(1)]);
var cr101844_place_124 = cr101844_place_14;
var cr101844_place_125 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr101844_place_126 = cr101844_place_124;
var cr101844_place_127 = cr101844_place_125.cljs$core$IFn$_invoke$arity$1(cr101844_place_126);
var cr101844_place_128 = cr101844_place_127;
var cr101844_place_129 = cljs.core.Keyword;
var cr101844_place_130 = (cr101844_place_128 instanceof cr101844_place_129);
var cr101844_place_131 = null;
if(cr101844_place_130){
(cr101844_state[(0)] = cr101844_block_17);

(cr101844_state[(1)] = null);

(cr101844_state[(2)] = cr101844_place_124);

(cr101844_state[(3)] = cr101844_place_127);

(cr101844_state[(1)] = cr101844_place_131);

return cr101844_state;
} else {
(cr101844_state[(0)] = cr101844_block_16);

(cr101844_state[(1)] = null);

(cr101844_state[(2)] = cr101844_place_124);

(cr101844_state[(1)] = cr101844_place_131);

return cr101844_state;
}
}catch (e102236){var cr101844_exception = e102236;
(cr101844_state[(0)] = null);

(cr101844_state[(1)] = null);

throw cr101844_exception;
}});
var cr101844_block_4 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_4(cr101844_state){
try{var cr101844_place_61 = null;
(cr101844_state[(0)] = cr101844_block_5);

(cr101844_state[(3)] = cr101844_place_61);

return cr101844_state;
}catch (e102239){var cr101844_exception = e102239;
(cr101844_state[(0)] = null);

(cr101844_state[(3)] = null);

(cr101844_state[(4)] = null);

(cr101844_state[(5)] = null);

(cr101844_state[(1)] = null);

(cr101844_state[(2)] = null);

throw cr101844_exception;
}});
var cr101844_block_2 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_2(cr101844_state){
try{var cr101844_place_11 = (cr101844_state[(2)]);
var cr101844_place_17 = cr101844_place_11;
var cr101844_place_18 = cljs.core.__destructure_map;
var cr101844_place_19 = cr101844_place_17;
var cr101844_place_20 = (function (){var G__102259 = cr101844_place_19;
var fexpr__102258 = cr101844_place_18;
return (fexpr__102258.cljs$core$IFn$_invoke$arity$1 ? fexpr__102258.cljs$core$IFn$_invoke$arity$1(G__102259) : fexpr__102258.call(null,G__102259));
})();
var cr101844_place_21 = cljs.core.get;
var cr101844_place_22 = cr101844_place_20;
var cr101844_place_23 = new cljs.core.Keyword(null,"server-schema-version","server-schema-version",765611123);
var cr101844_place_24 = (function (){var G__102265 = cr101844_place_22;
var G__102266 = cr101844_place_23;
var fexpr__102264 = cr101844_place_21;
return (fexpr__102264.cljs$core$IFn$_invoke$arity$2 ? fexpr__102264.cljs$core$IFn$_invoke$arity$2(G__102265,G__102266) : fexpr__102264.call(null,G__102265,G__102266));
})();
var cr101844_place_25 = cljs.core.get;
var cr101844_place_26 = cr101844_place_20;
var cr101844_place_27 = new cljs.core.Keyword(null,"server-builtin-db-idents","server-builtin-db-idents",-224246711);
var cr101844_place_28 = (function (){var G__102274 = cr101844_place_26;
var G__102275 = cr101844_place_27;
var fexpr__102273 = cr101844_place_25;
return (fexpr__102273.cljs$core$IFn$_invoke$arity$2 ? fexpr__102273.cljs$core$IFn$_invoke$arity$2(G__102274,G__102275) : fexpr__102273.call(null,G__102274,G__102275));
})();
var cr101844_place_29 = cljs.core.set;
var cr101844_place_30 = frontend.worker.rtc.skeleton.get_builtin_db_idents;
var cr101844_place_31 = db;
var cr101844_place_32 = (function (){var G__102277 = cr101844_place_31;
var fexpr__102276 = cr101844_place_30;
return (fexpr__102276.cljs$core$IFn$_invoke$arity$1 ? fexpr__102276.cljs$core$IFn$_invoke$arity$1(G__102277) : fexpr__102276.call(null,G__102277));
})();
var cr101844_place_33 = (function (){var G__102279 = cr101844_place_32;
var fexpr__102278 = cr101844_place_29;
return (fexpr__102278.cljs$core$IFn$_invoke$arity$1 ? fexpr__102278.cljs$core$IFn$_invoke$arity$1(G__102279) : fexpr__102278.call(null,G__102279));
})();
var cr101844_place_34 = logseq.db.get_graph_schema_version;
var cr101844_place_35 = db;
var cr101844_place_36 = (function (){var G__102288 = cr101844_place_35;
var fexpr__102287 = cr101844_place_34;
return (fexpr__102287.cljs$core$IFn$_invoke$arity$1 ? fexpr__102287.cljs$core$IFn$_invoke$arity$1(G__102288) : fexpr__102287.call(null,G__102288));
})();
var cr101844_place_37 = logseq.db.frontend.schema.compare_schema_version;
var cr101844_place_38 = cr101844_place_36;
var cr101844_place_39 = cr101844_place_24;
var cr101844_place_40 = (function (){var G__102297 = cr101844_place_38;
var G__102298 = cr101844_place_39;
var fexpr__102296 = cr101844_place_37;
return (fexpr__102296.cljs$core$IFn$_invoke$arity$2 ? fexpr__102296.cljs$core$IFn$_invoke$arity$2(G__102297,G__102298) : fexpr__102296.call(null,G__102297,G__102298));
})();
var cr101844_place_41 = (0);
var cr101844_place_42 = (cr101844_place_40 === cr101844_place_41);
var cr101844_place_43 = null;
if(cr101844_place_42){
(cr101844_state[(0)] = cr101844_block_4);

(cr101844_state[(3)] = cr101844_place_43);

(cr101844_state[(4)] = cr101844_place_33);

(cr101844_state[(5)] = cr101844_place_28);

return cr101844_state;
} else {
(cr101844_state[(0)] = cr101844_block_3);

(cr101844_state[(3)] = cr101844_place_43);

(cr101844_state[(4)] = cr101844_place_33);

(cr101844_state[(5)] = cr101844_place_28);

(cr101844_state[(6)] = cr101844_place_36);

(cr101844_state[(7)] = cr101844_place_24);

return cr101844_state;
}
}catch (e102244){var cr101844_exception = e102244;
(cr101844_state[(0)] = null);

(cr101844_state[(1)] = null);

(cr101844_state[(2)] = null);

throw cr101844_exception;
}});
var cr101844_block_12 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_12(cr101844_state){
try{var cr101844_place_97 = (cr101844_state[(6)]);
var cr101844_place_75 = (cr101844_state[(5)]);
var cr101844_place_112 = cljs.core.conj;
var cr101844_place_113 = cr101844_place_97;
var cr101844_place_114 = new cljs.core.Keyword(null,"p","p",151049309);
var cr101844_place_115 = new cljs.core.Keyword(null,"server-only-db-idents","server-only-db-idents",1822593065);
var cr101844_place_116 = cr101844_place_75;
var cr101844_place_117 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr101844_place_115),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr101844_place_116)].join('');
var cr101844_place_118 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr101844_place_114,cr101844_place_117], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr101844_place_119 = (function (){var G__102318 = cr101844_place_113;
var G__102319 = cr101844_place_118;
var fexpr__102317 = cr101844_place_112;
return (fexpr__102317.cljs$core$IFn$_invoke$arity$2 ? fexpr__102317.cljs$core$IFn$_invoke$arity$2(G__102318,G__102319) : fexpr__102317.call(null,G__102318,G__102319));
})();
(cr101844_state[(0)] = cr101844_block_13);

(cr101844_state[(6)] = null);

(cr101844_state[(5)] = null);

(cr101844_state[(4)] = cr101844_place_119);

return cr101844_state;
}catch (e102305){var cr101844_exception = e102305;
(cr101844_state[(0)] = null);

(cr101844_state[(6)] = null);

(cr101844_state[(7)] = null);

(cr101844_state[(4)] = null);

(cr101844_state[(5)] = null);

(cr101844_state[(9)] = null);

(cr101844_state[(3)] = null);

(cr101844_state[(1)] = null);

(cr101844_state[(2)] = null);

throw cr101844_exception;
}});
var cr101844_block_11 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_11(cr101844_state){
try{var cr101844_place_97 = (cr101844_state[(6)]);
var cr101844_place_111 = cr101844_place_97;
(cr101844_state[(0)] = cr101844_block_13);

(cr101844_state[(6)] = null);

(cr101844_state[(4)] = cr101844_place_111);

return cr101844_state;
}catch (e102323){var cr101844_exception = e102323;
(cr101844_state[(0)] = null);

(cr101844_state[(6)] = null);

(cr101844_state[(7)] = null);

(cr101844_state[(4)] = null);

(cr101844_state[(9)] = null);

(cr101844_state[(3)] = null);

(cr101844_state[(1)] = null);

(cr101844_state[(2)] = null);

throw cr101844_exception;
}});
var cr101844_block_13 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_13(cr101844_state){
try{var cr101844_place_90 = (cr101844_state[(7)]);
var cr101844_place_110 = (cr101844_state[(4)]);
var cr101844_place_91 = (cr101844_state[(9)]);
var cr101844_place_120 = new cljs.core.Keyword(null,"error","error",-978969032);
var cr101844_place_121 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr101844_place_110,cr101844_place_120], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr101844_place_122 = (function (){var G__102332 = cr101844_place_91;
var G__102333 = cr101844_place_121;
var fexpr__102331 = cr101844_place_90;
return (fexpr__102331.cljs$core$IFn$_invoke$arity$2 ? fexpr__102331.cljs$core$IFn$_invoke$arity$2(G__102332,G__102333) : fexpr__102331.call(null,G__102332,G__102333));
})();
(cr101844_state[(0)] = cr101844_block_14);

(cr101844_state[(7)] = null);

(cr101844_state[(4)] = null);

(cr101844_state[(9)] = null);

(cr101844_state[(3)] = cr101844_place_122);

return cr101844_state;
}catch (e102329){var cr101844_exception = e102329;
(cr101844_state[(0)] = null);

(cr101844_state[(7)] = null);

(cr101844_state[(4)] = null);

(cr101844_state[(9)] = null);

(cr101844_state[(3)] = null);

(cr101844_state[(1)] = null);

(cr101844_state[(2)] = null);

throw cr101844_exception;
}});
var cr101844_block_10 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_10(cr101844_state){
try{var cr101844_place_97 = (cr101844_state[(6)]);
var cr101844_place_75 = (cr101844_state[(5)]);
var cr101844_place_107 = cljs.core.seq;
var cr101844_place_108 = cr101844_place_75;
var cr101844_place_109 = (function (){var G__102348 = cr101844_place_108;
var fexpr__102347 = cr101844_place_107;
return (fexpr__102347.cljs$core$IFn$_invoke$arity$1 ? fexpr__102347.cljs$core$IFn$_invoke$arity$1(G__102348) : fexpr__102347.call(null,G__102348));
})();
var cr101844_place_110 = null;
if(cljs.core.truth_(cr101844_place_109)){
(cr101844_state[(0)] = cr101844_block_12);

(cr101844_state[(4)] = cr101844_place_110);

return cr101844_state;
} else {
(cr101844_state[(0)] = cr101844_block_11);

(cr101844_state[(5)] = null);

(cr101844_state[(4)] = cr101844_place_110);

return cr101844_state;
}
}catch (e102338){var cr101844_exception = e102338;
(cr101844_state[(0)] = null);

(cr101844_state[(6)] = null);

(cr101844_state[(7)] = null);

(cr101844_state[(5)] = null);

(cr101844_state[(9)] = null);

(cr101844_state[(3)] = null);

(cr101844_state[(1)] = null);

(cr101844_state[(2)] = null);

throw cr101844_exception;
}});
var cr101844_block_5 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_5(cr101844_state){
try{var cr101844_place_43 = (cr101844_state[(3)]);
var cr101844_place_33 = (cr101844_state[(4)]);
var cr101844_place_28 = (cr101844_state[(5)]);
var cr101844_place_62 = clojure.data.diff;
var cr101844_place_63 = cr101844_place_33;
var cr101844_place_64 = cr101844_place_28;
var cr101844_place_65 = (function (){var G__102366 = cr101844_place_63;
var G__102367 = cr101844_place_64;
var fexpr__102365 = cr101844_place_62;
return (fexpr__102365.cljs$core$IFn$_invoke$arity$2 ? fexpr__102365.cljs$core$IFn$_invoke$arity$2(G__102366,G__102367) : fexpr__102365.call(null,G__102366,G__102367));
})();
var cr101844_place_66 = cljs.core.nth;
var cr101844_place_67 = cr101844_place_65;
var cr101844_place_68 = (0);
var cr101844_place_69 = null;
var cr101844_place_70 = (function (){var G__102370 = cr101844_place_67;
var G__102371 = cr101844_place_68;
var G__102372 = cr101844_place_69;
var fexpr__102369 = cr101844_place_66;
return (fexpr__102369.cljs$core$IFn$_invoke$arity$3 ? fexpr__102369.cljs$core$IFn$_invoke$arity$3(G__102370,G__102371,G__102372) : fexpr__102369.call(null,G__102370,G__102371,G__102372));
})();
var cr101844_place_71 = cljs.core.nth;
var cr101844_place_72 = cr101844_place_65;
var cr101844_place_73 = (1);
var cr101844_place_74 = null;
var cr101844_place_75 = (function (){var G__102379 = cr101844_place_72;
var G__102380 = cr101844_place_73;
var G__102381 = cr101844_place_74;
var fexpr__102378 = cr101844_place_71;
return (fexpr__102378.cljs$core$IFn$_invoke$arity$3 ? fexpr__102378.cljs$core$IFn$_invoke$arity$3(G__102379,G__102380,G__102381) : fexpr__102378.call(null,G__102379,G__102380,G__102381));
})();
var cr101844_place_76 = cljs.core.nth;
var cr101844_place_77 = cr101844_place_65;
var cr101844_place_78 = (2);
var cr101844_place_79 = null;
var cr101844_place_80 = (function (){var G__102390 = cr101844_place_77;
var G__102391 = cr101844_place_78;
var G__102392 = cr101844_place_79;
var fexpr__102389 = cr101844_place_76;
return (fexpr__102389.cljs$core$IFn$_invoke$arity$3 ? fexpr__102389.cljs$core$IFn$_invoke$arity$3(G__102390,G__102391,G__102392) : fexpr__102389.call(null,G__102390,G__102391,G__102392));
})();
var cr101844_place_81 = cljs.core.seq;
var cr101844_place_82 = cr101844_place_70;
var cr101844_place_83 = (function (){var G__102395 = cr101844_place_82;
var fexpr__102394 = cr101844_place_81;
return (fexpr__102394.cljs$core$IFn$_invoke$arity$1 ? fexpr__102394.cljs$core$IFn$_invoke$arity$1(G__102395) : fexpr__102394.call(null,G__102395));
})();
var cr101844_place_84 = cljs.core.seq;
var cr101844_place_85 = cr101844_place_75;
var cr101844_place_86 = (function (){var G__102400 = cr101844_place_85;
var fexpr__102399 = cr101844_place_84;
return (fexpr__102399.cljs$core$IFn$_invoke$arity$1 ? fexpr__102399.cljs$core$IFn$_invoke$arity$1(G__102400) : fexpr__102399.call(null,G__102400));
})();
var cr101844_place_87 = ((cr101844_place_83) || (cr101844_place_86));
var cr101844_place_88 = null;
if(cr101844_place_87){
(cr101844_state[(0)] = cr101844_block_7);

(cr101844_state[(3)] = null);

(cr101844_state[(4)] = null);

(cr101844_state[(5)] = null);

(cr101844_state[(4)] = cr101844_place_70);

(cr101844_state[(5)] = cr101844_place_75);

(cr101844_state[(3)] = cr101844_place_88);

return cr101844_state;
} else {
(cr101844_state[(0)] = cr101844_block_6);

(cr101844_state[(3)] = null);

(cr101844_state[(4)] = null);

(cr101844_state[(5)] = null);

(cr101844_state[(3)] = cr101844_place_88);

return cr101844_state;
}
}catch (e102356){var cr101844_exception = e102356;
(cr101844_state[(0)] = null);

(cr101844_state[(3)] = null);

(cr101844_state[(4)] = null);

(cr101844_state[(5)] = null);

(cr101844_state[(1)] = null);

(cr101844_state[(2)] = null);

throw cr101844_exception;
}});
var cr101844_block_0 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_0(cr101844_state){
try{var cr101844_place_0 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr101844_place_1 = get_ws_create_task;
var cr101844_place_2 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr101844_place_3 = "get-graph-skeleton";
var cr101844_place_4 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr101844_place_5 = graph_uuid;
var cr101844_place_6 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr101844_place_7 = major_schema_version;
var cr101844_place_8 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr101844_place_7);
var cr101844_place_9 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr101844_place_2,cr101844_place_3,cr101844_place_4,cr101844_place_5,cr101844_place_6,cr101844_place_8]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr101844_place_10 = (function (){var G__102406 = cr101844_place_1;
var G__102407 = cr101844_place_9;
var fexpr__102405 = cr101844_place_0;
return (fexpr__102405.cljs$core$IFn$_invoke$arity$2 ? fexpr__102405.cljs$core$IFn$_invoke$arity$2(G__102406,G__102407) : fexpr__102405.call(null,G__102406,G__102407));
})();
(cr101844_state[(0)] = cr101844_block_1);

return missionary.core.park(cr101844_place_10);
}catch (e102403){var cr101844_exception = e102403;
(cr101844_state[(0)] = null);

throw cr101844_exception;
}});
var cr101844_block_18 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_18(cr101844_state){
try{var cr101844_place_131 = (cr101844_state[(1)]);
var cr101844_place_135 = cr101844_place_131;
var cr101844_place_136 = null;
var G__102475 = cr101844_place_135;
switch (G__102475) {
case "graph-lock-failed":
(cr101844_state[(0)] = cr101844_block_19);

(cr101844_state[(1)] = null);

(cr101844_state[(2)] = null);

return cr101844_state;

break;
default:
(cr101844_state[(0)] = cr101844_block_20);

(cr101844_state[(1)] = null);

return cr101844_state;

}
}catch (e102466){var cr101844_exception = e102466;
(cr101844_state[(0)] = null);

(cr101844_state[(1)] = null);

(cr101844_state[(2)] = null);

throw cr101844_exception;
}});
var cr101844_block_20 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_20(cr101844_state){
try{var cr101844_place_124 = (cr101844_state[(2)]);
var cr101844_place_144 = lambdaisland.glogi.log;
var cr101844_place_145 = "frontend.worker.rtc.skeleton";
var cr101844_place_146 = new cljs.core.Keyword(null,"info","info",-317069002);
var cr101844_place_147 = cljs.core.identity;
var cr101844_place_148 = new cljs.core.Keyword(null,"remote-ex","remote-ex",231483810);
var cr101844_place_149 = cr101844_place_124;
var cr101844_place_150 = new cljs.core.Keyword(null,"line","line",212345235);
var cr101844_place_151 = 34;
var cr101844_place_152 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr101844_place_148,cr101844_place_149,cr101844_place_150,cr101844_place_151]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr101844_place_153 = (function (){var G__102501 = cr101844_place_152;
var fexpr__102500 = cr101844_place_147;
return (fexpr__102500.cljs$core$IFn$_invoke$arity$1 ? fexpr__102500.cljs$core$IFn$_invoke$arity$1(G__102501) : fexpr__102500.call(null,G__102501));
})();
var cr101844_place_154 = null;
var cr101844_place_155 = (function (){var G__102504 = cr101844_place_145;
var G__102505 = cr101844_place_146;
var G__102506 = cr101844_place_153;
var G__102507 = cr101844_place_154;
var fexpr__102503 = cr101844_place_144;
return (fexpr__102503.cljs$core$IFn$_invoke$arity$4 ? fexpr__102503.cljs$core$IFn$_invoke$arity$4(G__102504,G__102505,G__102506,G__102507) : fexpr__102503.call(null,G__102504,G__102505,G__102506,G__102507));
})();
var cr101844_place_156 = cljs.core.ex_info;
var cr101844_place_157 = "Unavailable2";
var cr101844_place_158 = new cljs.core.Keyword(null,"remote-ex","remote-ex",231483810);
var cr101844_place_159 = cr101844_place_124;
var cr101844_place_160 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr101844_place_158,cr101844_place_159]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr101844_place_161 = (function (){var G__102517 = cr101844_place_157;
var G__102518 = cr101844_place_160;
var fexpr__102516 = cr101844_place_156;
return (fexpr__102516.cljs$core$IFn$_invoke$arity$2 ? fexpr__102516.cljs$core$IFn$_invoke$arity$2(G__102517,G__102518) : fexpr__102516.call(null,G__102517,G__102518));
})();
var cr101844_place_162 = (function(){throw cr101844_place_161})();
(cr101844_state[(0)] = null);

(cr101844_state[(2)] = null);

return null;
}catch (e102488){var cr101844_exception = e102488;
(cr101844_state[(0)] = null);

(cr101844_state[(2)] = null);

throw cr101844_exception;
}});
var cr101844_block_21 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_21(cr101844_state){
try{var cr101844_place_16 = (cr101844_state[(1)]);
(cr101844_state[(0)] = null);

(cr101844_state[(1)] = null);

return cr101844_place_16;
}catch (e102527){var cr101844_exception = e102527;
(cr101844_state[(0)] = null);

(cr101844_state[(1)] = null);

throw cr101844_exception;
}});
var cr101844_block_1 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_1(cr101844_state){
try{var cr101844_place_11 = missionary.core.unpark();
var cr101844_place_12 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr101844_place_13 = cr101844_place_11;
var cr101844_place_14 = cr101844_place_12.cljs$core$IFn$_invoke$arity$1(cr101844_place_13);
var cr101844_place_15 = cr101844_place_14;
var cr101844_place_16 = null;
if(cljs.core.truth_(cr101844_place_15)){
(cr101844_state[(0)] = cr101844_block_15);

(cr101844_state[(1)] = cr101844_place_14);

return cr101844_state;
} else {
(cr101844_state[(0)] = cr101844_block_2);

(cr101844_state[(2)] = cr101844_place_11);

(cr101844_state[(1)] = cr101844_place_16);

return cr101844_state;
}
}catch (e102534){var cr101844_exception = e102534;
(cr101844_state[(0)] = null);

throw cr101844_exception;
}});
var cr101844_block_3 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_3(cr101844_state){
try{var cr101844_place_36 = (cr101844_state[(6)]);
var cr101844_place_24 = (cr101844_state[(7)]);
var cr101844_place_44 = frontend.worker.shared_service.broadcast_to_clients_BANG_;
var cr101844_place_45 = new cljs.core.Keyword(null,"notification","notification",-222338233);
var cr101844_place_46 = new cljs.core.Keyword(null,"div","div",1057191632);
var cr101844_place_47 = new cljs.core.Keyword(null,"p","p",151049309);
var cr101844_place_48 = new cljs.core.Keyword(null,"client-schema-version","client-schema-version",-315922744);
var cr101844_place_49 = cr101844_place_36;
var cr101844_place_50 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr101844_place_48),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr101844_place_49)].join('');
var cr101844_place_51 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr101844_place_47,cr101844_place_50], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr101844_place_52 = new cljs.core.Keyword(null,"p","p",151049309);
var cr101844_place_53 = new cljs.core.Keyword(null,"server-schema-version","server-schema-version",765611123);
var cr101844_place_54 = cr101844_place_24;
var cr101844_place_55 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr101844_place_53),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr101844_place_54)].join('');
var cr101844_place_56 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr101844_place_52,cr101844_place_55], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr101844_place_57 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr101844_place_46,cr101844_place_51,cr101844_place_56], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr101844_place_58 = new cljs.core.Keyword(null,"error","error",-978969032);
var cr101844_place_59 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr101844_place_57,cr101844_place_58], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr101844_place_60 = (function (){var G__102562 = cr101844_place_45;
var G__102563 = cr101844_place_59;
var fexpr__102561 = cr101844_place_44;
return (fexpr__102561.cljs$core$IFn$_invoke$arity$2 ? fexpr__102561.cljs$core$IFn$_invoke$arity$2(G__102562,G__102563) : fexpr__102561.call(null,G__102562,G__102563));
})();
(cr101844_state[(0)] = cr101844_block_5);

(cr101844_state[(6)] = null);

(cr101844_state[(7)] = null);

(cr101844_state[(3)] = cr101844_place_60);

return cr101844_state;
}catch (e102543){var cr101844_exception = e102543;
(cr101844_state[(0)] = null);

(cr101844_state[(3)] = null);

(cr101844_state[(4)] = null);

(cr101844_state[(5)] = null);

(cr101844_state[(6)] = null);

(cr101844_state[(1)] = null);

(cr101844_state[(7)] = null);

(cr101844_state[(2)] = null);

throw cr101844_exception;
}});
var cr101844_block_7 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_7(cr101844_state){
try{var cr101844_place_70 = (cr101844_state[(4)]);
var cr101844_place_90 = frontend.worker.shared_service.broadcast_to_clients_BANG_;
var cr101844_place_91 = new cljs.core.Keyword(null,"notification","notification",-222338233);
var cr101844_place_92 = new cljs.core.Keyword(null,"div","div",1057191632);
var cr101844_place_93 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr101844_place_92], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr101844_place_94 = cljs.core.seq;
var cr101844_place_95 = cr101844_place_70;
var cr101844_place_96 = (function (){var G__102570 = cr101844_place_95;
var fexpr__102569 = cr101844_place_94;
return (fexpr__102569.cljs$core$IFn$_invoke$arity$1 ? fexpr__102569.cljs$core$IFn$_invoke$arity$1(G__102570) : fexpr__102569.call(null,G__102570));
})();
var cr101844_place_97 = null;
if(cljs.core.truth_(cr101844_place_96)){
(cr101844_state[(0)] = cr101844_block_9);

(cr101844_state[(7)] = cr101844_place_90);

(cr101844_state[(9)] = cr101844_place_91);

(cr101844_state[(8)] = cr101844_place_93);

(cr101844_state[(6)] = cr101844_place_97);

return cr101844_state;
} else {
(cr101844_state[(0)] = cr101844_block_8);

(cr101844_state[(4)] = null);

(cr101844_state[(7)] = cr101844_place_90);

(cr101844_state[(9)] = cr101844_place_91);

(cr101844_state[(8)] = cr101844_place_93);

(cr101844_state[(6)] = cr101844_place_97);

return cr101844_state;
}
}catch (e102564){var cr101844_exception = e102564;
(cr101844_state[(0)] = null);

(cr101844_state[(4)] = null);

(cr101844_state[(5)] = null);

(cr101844_state[(3)] = null);

(cr101844_state[(1)] = null);

(cr101844_state[(2)] = null);

throw cr101844_exception;
}});
var cr101844_block_16 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_16(cr101844_state){
try{var cr101844_place_132 = null;
(cr101844_state[(0)] = cr101844_block_18);

(cr101844_state[(1)] = cr101844_place_132);

return cr101844_state;
}catch (e102578){var cr101844_exception = e102578;
(cr101844_state[(0)] = null);

(cr101844_state[(1)] = null);

(cr101844_state[(2)] = null);

throw cr101844_exception;
}});
var cr101844_block_14 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_14(cr101844_state){
try{var cr101844_place_88 = (cr101844_state[(3)]);
var cr101844_place_11 = (cr101844_state[(2)]);
var cr101844_place_123 = cr101844_place_11;
(cr101844_state[(0)] = cr101844_block_21);

(cr101844_state[(3)] = null);

(cr101844_state[(2)] = null);

(cr101844_state[(1)] = cr101844_place_123);

return cr101844_state;
}catch (e102585){var cr101844_exception = e102585;
(cr101844_state[(0)] = null);

(cr101844_state[(3)] = null);

(cr101844_state[(1)] = null);

(cr101844_state[(2)] = null);

throw cr101844_exception;
}});
var cr101844_block_19 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_19(cr101844_state){
try{var cr101844_place_137 = cljs.core.ex_info;
var cr101844_place_138 = "retry calibrate-graph-skeleton";
var cr101844_place_139 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr101844_place_140 = true;
var cr101844_place_141 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr101844_place_139,cr101844_place_140]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr101844_place_142 = (function (){var G__102600 = cr101844_place_138;
var G__102601 = cr101844_place_141;
var fexpr__102598 = cr101844_place_137;
return (fexpr__102598.cljs$core$IFn$_invoke$arity$2 ? fexpr__102598.cljs$core$IFn$_invoke$arity$2(G__102600,G__102601) : fexpr__102598.call(null,G__102600,G__102601));
})();
var cr101844_place_143 = (function(){throw cr101844_place_142})();
(cr101844_state[(0)] = null);

return null;
}catch (e102591){var cr101844_exception = e102591;
(cr101844_state[(0)] = null);

throw cr101844_exception;
}});
var cr101844_block_17 = (function frontend$worker$rtc$skeleton$new_task__calibrate_graph_skeleton_$_cr101844_block_17(cr101844_state){
try{var cr101844_place_127 = (cr101844_state[(3)]);
var cr101844_place_133 = cr101844_place_127;
var cr101844_place_134 = cr101844_place_133.fqn;
(cr101844_state[(0)] = cr101844_block_18);

(cr101844_state[(3)] = null);

(cr101844_state[(1)] = cr101844_place_134);

return cr101844_state;
}catch (e102603){var cr101844_exception = e102603;
(cr101844_state[(0)] = null);

(cr101844_state[(1)] = null);

(cr101844_state[(2)] = null);

(cr101844_state[(3)] = null);

throw cr101844_exception;
}});
return cloroutine.impl.coroutine((function (){var G__102613 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((10));
(G__102613[(0)] = cr101844_block_0);

return G__102613;
})());
})(),missionary.core.sp_run);
});

//# sourceMappingURL=frontend.worker.rtc.skeleton.js.map
