goog.provide('frontend.worker.rtc.ws_util');
frontend.worker.rtc.ws_util.handle_remote_ex = (function frontend$worker$rtc$ws_util$handle_remote_ex(resp){
var temp__5802__auto__ = (function (){var G__133726 = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ex-data","ex-data",-309040259).cljs$core$IFn$_invoke$arity$1(resp));
var fexpr__133725 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"graph-not-exist","graph-not-exist",-1126829753),frontend.worker.rtc.exception.ex_remote_graph_not_exist,new cljs.core.Keyword(null,"graph-not-ready","graph-not-ready",1357090672),frontend.worker.rtc.exception.ex_remote_graph_not_ready,new cljs.core.Keyword(null,"bad-request-body","bad-request-body",-1595215694),frontend.worker.rtc.exception.ex_bad_request_body,new cljs.core.Keyword(null,"not-allowed","not-allowed",-397728307),frontend.worker.rtc.exception.ex_not_allowed], null);
return (fexpr__133725.cljs$core$IFn$_invoke$arity$1 ? fexpr__133725.cljs$core$IFn$_invoke$arity$1(G__133726) : fexpr__133725.call(null,G__133726));
})();
if(cljs.core.truth_(temp__5802__auto__)){
var e = temp__5802__auto__;
throw e;
} else {
return resp;
}
});
/**
 * Return a task that return s3-key
 */
frontend.worker.rtc.ws_util.put_apply_ops_message_on_s3_if_too_huge = (function frontend$worker$rtc$ws_util$put_apply_ops_message_on_s3_if_too_huge(ws,message){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("apply-ops",new cljs.core.Keyword(null,"action","action",-811238024).cljs$core$IFn$_invoke$arity$1(message))){
} else {
throw (new Error("Assert failed: (= \"apply-ops\" (:action message))"));
}

return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr133727_block_6 = (function frontend$worker$rtc$ws_util$put_apply_ops_message_on_s3_if_too_huge_$_cr133727_block_6(cr133727_state){
try{var cr133727_place_77 = null;
(cr133727_state[(0)] = cr133727_block_7);

(cr133727_state[(3)] = cr133727_place_77);

return cr133727_state;
}catch (e133799){var cr133727_exception = e133799;
(cr133727_state[(0)] = null);

(cr133727_state[(2)] = null);

(cr133727_state[(1)] = null);

(cr133727_state[(3)] = null);

throw cr133727_exception;
}});
var cr133727_block_0 = (function frontend$worker$rtc$ws_util$put_apply_ops_message_on_s3_if_too_huge_$_cr133727_block_0(cr133727_state){
try{var cr133727_place_0 = cljs.core.assoc;
var cr133727_place_1 = message;
var cr133727_place_2 = new cljs.core.Keyword(null,"req-id","req-id",-471642231);
var cr133727_place_3 = "temp-id";
var cr133727_place_4 = (function (){var G__133802 = cr133727_place_1;
var G__133803 = cr133727_place_2;
var G__133804 = cr133727_place_3;
var fexpr__133801 = cr133727_place_0;
return (fexpr__133801.cljs$core$IFn$_invoke$arity$3 ? fexpr__133801.cljs$core$IFn$_invoke$arity$3(G__133802,G__133803,G__133804) : fexpr__133801.call(null,G__133802,G__133803,G__133804));
})();
var cr133727_place_5 = frontend.worker.rtc.malli_schema.data_to_ws_coercer;
var cr133727_place_6 = cr133727_place_4;
var cr133727_place_7 = (function (){var G__133808 = cr133727_place_6;
var fexpr__133807 = cr133727_place_5;
return (fexpr__133807.cljs$core$IFn$_invoke$arity$1 ? fexpr__133807.cljs$core$IFn$_invoke$arity$1(G__133808) : fexpr__133807.call(null,G__133808));
})();
var cr133727_place_8 = JSON.stringify;
var cr133727_place_9 = cljs.core.clj__GT_js;
var cr133727_place_10 = cljs.core.select_keys;
var cr133727_place_11 = frontend.worker.rtc.malli_schema.data_to_ws_encoder;
var cr133727_place_12 = cr133727_place_7;
var cr133727_place_13 = (function (){var G__133811 = cr133727_place_12;
var fexpr__133810 = cr133727_place_11;
return (fexpr__133810.cljs$core$IFn$_invoke$arity$1 ? fexpr__133810.cljs$core$IFn$_invoke$arity$1(G__133811) : fexpr__133810.call(null,G__133811));
})();
var cr133727_place_14 = "graph-uuid";
var cr133727_place_15 = "ops";
var cr133727_place_16 = "t-before";
var cr133727_place_17 = "schema-version";
var cr133727_place_18 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr133727_place_14,cr133727_place_15,cr133727_place_16,cr133727_place_17], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr133727_place_19 = (function (){var G__133813 = cr133727_place_13;
var G__133814 = cr133727_place_18;
var fexpr__133812 = cr133727_place_10;
return (fexpr__133812.cljs$core$IFn$_invoke$arity$2 ? fexpr__133812.cljs$core$IFn$_invoke$arity$2(G__133813,G__133814) : fexpr__133812.call(null,G__133813,G__133814));
})();
var cr133727_place_20 = (function (){var G__133816 = cr133727_place_19;
var fexpr__133815 = cr133727_place_9;
return (fexpr__133815.cljs$core$IFn$_invoke$arity$1 ? fexpr__133815.cljs$core$IFn$_invoke$arity$1(G__133816) : fexpr__133815.call(null,G__133816));
})();
var cr133727_place_21 = (function (){var G__133818 = cr133727_place_20;
var fexpr__133817 = cr133727_place_8;
return (fexpr__133817.cljs$core$IFn$_invoke$arity$1 ? fexpr__133817.cljs$core$IFn$_invoke$arity$1(G__133818) : fexpr__133817.call(null,G__133818));
})();
var cr133727_place_22 = logseq.graph_parser.utf8.encode;
var cr133727_place_23 = cr133727_place_21;
var cr133727_place_24 = (function (){var G__133820 = cr133727_place_23;
var fexpr__133819 = cr133727_place_22;
return (fexpr__133819.cljs$core$IFn$_invoke$arity$1 ? fexpr__133819.cljs$core$IFn$_invoke$arity$1(G__133820) : fexpr__133819.call(null,G__133820));
})();
var cr133727_place_25 = cr133727_place_24.length;
var cr133727_place_26 = (100000);
var cr133727_place_27 = cr133727_place_25;
var cr133727_place_28 = (cr133727_place_26 < cr133727_place_27);
var cr133727_place_29 = null;
if(cr133727_place_28){
(cr133727_state[(0)] = cr133727_block_2);

(cr133727_state[(1)] = cr133727_place_29);

(cr133727_state[(2)] = cr133727_place_21);

return cr133727_state;
} else {
(cr133727_state[(0)] = cr133727_block_1);

(cr133727_state[(1)] = cr133727_place_29);

return cr133727_state;
}
}catch (e133800){var cr133727_exception = e133800;
(cr133727_state[(0)] = null);

throw cr133727_exception;
}});
var cr133727_block_3 = (function frontend$worker$rtc$ws_util$put_apply_ops_message_on_s3_if_too_huge_$_cr133727_block_3(cr133727_state){
try{var cr133727_place_21 = (cr133727_state[(2)]);
var cr133727_place_37 = missionary.core.unpark();
var cr133727_place_38 = cljs.core.__destructure_map;
var cr133727_place_39 = cr133727_place_37;
var cr133727_place_40 = (function (){var G__133823 = cr133727_place_39;
var fexpr__133822 = cr133727_place_38;
return (fexpr__133822.cljs$core$IFn$_invoke$arity$1 ? fexpr__133822.cljs$core$IFn$_invoke$arity$1(G__133823) : fexpr__133822.call(null,G__133823));
})();
var cr133727_place_41 = cljs.core.get;
var cr133727_place_42 = cr133727_place_40;
var cr133727_place_43 = new cljs.core.Keyword(null,"url","url",276297046);
var cr133727_place_44 = (function (){var G__133825 = cr133727_place_42;
var G__133826 = cr133727_place_43;
var fexpr__133824 = cr133727_place_41;
return (fexpr__133824.cljs$core$IFn$_invoke$arity$2 ? fexpr__133824.cljs$core$IFn$_invoke$arity$2(G__133825,G__133826) : fexpr__133824.call(null,G__133825,G__133826));
})();
var cr133727_place_45 = cljs.core.get;
var cr133727_place_46 = cr133727_place_40;
var cr133727_place_47 = new cljs.core.Keyword(null,"key","key",-1516042587);
var cr133727_place_48 = (function (){var G__133828 = cr133727_place_46;
var G__133829 = cr133727_place_47;
var fexpr__133827 = cr133727_place_45;
return (fexpr__133827.cljs$core$IFn$_invoke$arity$2 ? fexpr__133827.cljs$core$IFn$_invoke$arity$2(G__133828,G__133829) : fexpr__133827.call(null,G__133828,G__133829));
})();
var cr133727_place_49 = cljs_http_missionary.client.put;
var cr133727_place_50 = cr133727_place_44;
var cr133727_place_51 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr133727_place_52 = cr133727_place_21;
var cr133727_place_53 = new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222);
var cr133727_place_54 = false;
var cr133727_place_55 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr133727_place_53,cr133727_place_54,cr133727_place_51,cr133727_place_52]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr133727_place_56 = (function (){var G__133831 = cr133727_place_50;
var G__133832 = cr133727_place_55;
var fexpr__133830 = cr133727_place_49;
return (fexpr__133830.cljs$core$IFn$_invoke$arity$2 ? fexpr__133830.cljs$core$IFn$_invoke$arity$2(G__133831,G__133832) : fexpr__133830.call(null,G__133831,G__133832));
})();
(cr133727_state[(0)] = cr133727_block_4);

(cr133727_state[(2)] = null);

(cr133727_state[(2)] = cr133727_place_48);

return missionary.core.park(cr133727_place_56);
}catch (e133821){var cr133727_exception = e133821;
(cr133727_state[(0)] = null);

(cr133727_state[(1)] = null);

(cr133727_state[(2)] = null);

throw cr133727_exception;
}});
var cr133727_block_5 = (function frontend$worker$rtc$ws_util$put_apply_ops_message_on_s3_if_too_huge_$_cr133727_block_5(cr133727_state){
try{var cr133727_place_61 = (cr133727_state[(1)]);
var cr133727_place_70 = cljs.core.ex_info;
var cr133727_place_71 = "failed to upload apply-ops message";
var cr133727_place_72 = new cljs.core.Keyword(null,"resp","resp",1418702376);
var cr133727_place_73 = cr133727_place_61;
var cr133727_place_74 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr133727_place_72,cr133727_place_73]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr133727_place_75 = (function (){var G__133835 = cr133727_place_71;
var G__133836 = cr133727_place_74;
var fexpr__133834 = cr133727_place_70;
return (fexpr__133834.cljs$core$IFn$_invoke$arity$2 ? fexpr__133834.cljs$core$IFn$_invoke$arity$2(G__133835,G__133836) : fexpr__133834.call(null,G__133835,G__133836));
})();
var cr133727_place_76 = (function(){throw cr133727_place_75})();
(cr133727_state[(0)] = null);

(cr133727_state[(1)] = null);

return null;
}catch (e133833){var cr133727_exception = e133833;
(cr133727_state[(0)] = null);

(cr133727_state[(1)] = null);

throw cr133727_exception;
}});
var cr133727_block_2 = (function frontend$worker$rtc$ws_util$put_apply_ops_message_on_s3_if_too_huge_$_cr133727_block_2(cr133727_state){
try{var cr133727_place_31 = frontend.worker.rtc.ws.send_AMPERSAND_recv;
var cr133727_place_32 = ws;
var cr133727_place_33 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr133727_place_34 = "presign-put-temp-s3-obj";
var cr133727_place_35 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr133727_place_33,cr133727_place_34]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr133727_place_36 = (function (){var G__133839 = cr133727_place_32;
var G__133840 = cr133727_place_35;
var fexpr__133838 = cr133727_place_31;
return (fexpr__133838.cljs$core$IFn$_invoke$arity$2 ? fexpr__133838.cljs$core$IFn$_invoke$arity$2(G__133839,G__133840) : fexpr__133838.call(null,G__133839,G__133840));
})();
(cr133727_state[(0)] = cr133727_block_3);

return missionary.core.park(cr133727_place_36);
}catch (e133837){var cr133727_exception = e133837;
(cr133727_state[(0)] = null);

(cr133727_state[(1)] = null);

(cr133727_state[(2)] = null);

throw cr133727_exception;
}});
var cr133727_block_4 = (function frontend$worker$rtc$ws_util$put_apply_ops_message_on_s3_if_too_huge_$_cr133727_block_4(cr133727_state){
try{var cr133727_place_57 = missionary.core.unpark();
var cr133727_place_58 = cljs.core.__destructure_map;
var cr133727_place_59 = cr133727_place_57;
var cr133727_place_60 = (function (){var G__133843 = cr133727_place_59;
var fexpr__133842 = cr133727_place_58;
return (fexpr__133842.cljs$core$IFn$_invoke$arity$1 ? fexpr__133842.cljs$core$IFn$_invoke$arity$1(G__133843) : fexpr__133842.call(null,G__133843));
})();
var cr133727_place_61 = cr133727_place_60;
var cr133727_place_62 = cljs.core.get;
var cr133727_place_63 = cr133727_place_60;
var cr133727_place_64 = new cljs.core.Keyword(null,"status","status",-1997798413);
var cr133727_place_65 = (function (){var G__133845 = cr133727_place_63;
var G__133846 = cr133727_place_64;
var fexpr__133844 = cr133727_place_62;
return (fexpr__133844.cljs$core$IFn$_invoke$arity$2 ? fexpr__133844.cljs$core$IFn$_invoke$arity$2(G__133845,G__133846) : fexpr__133844.call(null,G__133845,G__133846));
})();
var cr133727_place_66 = cljs_http_missionary.client.unexceptional_status_QMARK_;
var cr133727_place_67 = cr133727_place_65;
var cr133727_place_68 = (function (){var G__133848 = cr133727_place_67;
var fexpr__133847 = cr133727_place_66;
return (fexpr__133847.cljs$core$IFn$_invoke$arity$1 ? fexpr__133847.cljs$core$IFn$_invoke$arity$1(G__133848) : fexpr__133847.call(null,G__133848));
})();
var cr133727_place_69 = null;
if(cljs.core.truth_(cr133727_place_68)){
(cr133727_state[(0)] = cr133727_block_6);

(cr133727_state[(3)] = cr133727_place_69);

return cr133727_state;
} else {
(cr133727_state[(0)] = cr133727_block_5);

(cr133727_state[(2)] = null);

(cr133727_state[(1)] = null);

(cr133727_state[(1)] = cr133727_place_61);

return cr133727_state;
}
}catch (e133841){var cr133727_exception = e133841;
(cr133727_state[(0)] = null);

(cr133727_state[(2)] = null);

(cr133727_state[(1)] = null);

throw cr133727_exception;
}});
var cr133727_block_7 = (function frontend$worker$rtc$ws_util$put_apply_ops_message_on_s3_if_too_huge_$_cr133727_block_7(cr133727_state){
try{var cr133727_place_48 = (cr133727_state[(2)]);
var cr133727_place_69 = (cr133727_state[(3)]);
var cr133727_place_78 = cr133727_place_48;
(cr133727_state[(0)] = cr133727_block_8);

(cr133727_state[(2)] = null);

(cr133727_state[(3)] = null);

(cr133727_state[(1)] = cr133727_place_78);

return cr133727_state;
}catch (e133849){var cr133727_exception = e133849;
(cr133727_state[(0)] = null);

(cr133727_state[(2)] = null);

(cr133727_state[(1)] = null);

(cr133727_state[(3)] = null);

throw cr133727_exception;
}});
var cr133727_block_1 = (function frontend$worker$rtc$ws_util$put_apply_ops_message_on_s3_if_too_huge_$_cr133727_block_1(cr133727_state){
try{var cr133727_place_30 = null;
(cr133727_state[(0)] = cr133727_block_8);

(cr133727_state[(1)] = cr133727_place_30);

return cr133727_state;
}catch (e133850){var cr133727_exception = e133850;
(cr133727_state[(0)] = null);

(cr133727_state[(1)] = null);

throw cr133727_exception;
}});
var cr133727_block_8 = (function frontend$worker$rtc$ws_util$put_apply_ops_message_on_s3_if_too_huge_$_cr133727_block_8(cr133727_state){
try{var cr133727_place_29 = (cr133727_state[(1)]);
(cr133727_state[(0)] = null);

(cr133727_state[(1)] = null);

return cr133727_place_29;
}catch (e133851){var cr133727_exception = e133851;
(cr133727_state[(0)] = null);

(cr133727_state[(1)] = null);

throw cr133727_exception;
}});
return cloroutine.impl.coroutine((function (){var G__133852 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__133852[(0)] = cr133727_block_0);

return G__133852;
})());
})(),missionary.core.sp_run);
});
/**
 * Return a task: throw exception if recv ex-data response.
 *   For huge apply-ops request(>100KB),
 *   - upload its request message to s3 first,
 *  then add `s3-key` key to request message map
 *   For huge apply-ops request(> 400 ops)
 *   - adjust its timeout to 20s
 */
frontend.worker.rtc.ws_util.send_AMPERSAND_recv = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv(get_ws_create_task,message){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr133853_block_4 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr133853_block_4(cr133853_state){
try{var cr133853_place_16 = (cr133853_state[(2)]);
var cr133853_place_21 = cljs.core._EQ_;
var cr133853_place_22 = "apply-ops";
var cr133853_place_23 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr133853_place_24 = message;
var cr133853_place_25 = cr133853_place_23.cljs$core$IFn$_invoke$arity$1(cr133853_place_24);
var cr133853_place_26 = (function (){var G__133895 = cr133853_place_22;
var G__133896 = cr133853_place_25;
var fexpr__133894 = cr133853_place_21;
return (fexpr__133894.cljs$core$IFn$_invoke$arity$2 ? fexpr__133894.cljs$core$IFn$_invoke$arity$2(G__133895,G__133896) : fexpr__133894.call(null,G__133895,G__133896));
})();
var cr133853_place_27 = null;
if(cljs.core.truth_(cr133853_place_26)){
(cr133853_state[(0)] = cr133853_block_6);

(cr133853_state[(3)] = cr133853_place_27);

return cr133853_state;
} else {
(cr133853_state[(0)] = cr133853_block_5);

(cr133853_state[(3)] = cr133853_place_27);

return cr133853_state;
}
}catch (e133893){var cr133853_exception = e133893;
(cr133853_state[(0)] = null);

(cr133853_state[(1)] = null);

(cr133853_state[(2)] = null);

throw cr133853_exception;
}});
var cr133853_block_7 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr133853_block_7(cr133853_state){
try{var cr133853_place_33 = missionary.core.unpark();
(cr133853_state[(0)] = cr133853_block_8);

(cr133853_state[(3)] = cr133853_place_33);

return cr133853_state;
}catch (e133897){var cr133853_exception = e133897;
(cr133853_state[(0)] = null);

(cr133853_state[(1)] = null);

(cr133853_state[(3)] = null);

(cr133853_state[(2)] = null);

throw cr133853_exception;
}});
var cr133853_block_6 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr133853_block_6(cr133853_state){
try{var cr133853_place_1 = (cr133853_state[(1)]);
var cr133853_place_29 = frontend.worker.rtc.ws_util.put_apply_ops_message_on_s3_if_too_huge;
var cr133853_place_30 = cr133853_place_1;
var cr133853_place_31 = message;
var cr133853_place_32 = (function (){var G__133900 = cr133853_place_30;
var G__133901 = cr133853_place_31;
var fexpr__133899 = cr133853_place_29;
return (fexpr__133899.cljs$core$IFn$_invoke$arity$2 ? fexpr__133899.cljs$core$IFn$_invoke$arity$2(G__133900,G__133901) : fexpr__133899.call(null,G__133900,G__133901));
})();
(cr133853_state[(0)] = cr133853_block_7);

return missionary.core.park(cr133853_place_32);
}catch (e133898){var cr133853_exception = e133898;
(cr133853_state[(0)] = null);

(cr133853_state[(1)] = null);

(cr133853_state[(3)] = null);

(cr133853_state[(2)] = null);

throw cr133853_exception;
}});
var cr133853_block_8 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr133853_block_8(cr133853_state){
try{var cr133853_place_27 = (cr133853_state[(3)]);
var cr133853_place_34 = cr133853_place_27;
var cr133853_place_35 = null;
if(cljs.core.truth_(cr133853_place_34)){
(cr133853_state[(0)] = cr133853_block_10);

(cr133853_state[(4)] = cr133853_place_35);

return cr133853_state;
} else {
(cr133853_state[(0)] = cr133853_block_9);

(cr133853_state[(3)] = null);

(cr133853_state[(4)] = cr133853_place_35);

return cr133853_state;
}
}catch (e133902){var cr133853_exception = e133902;
(cr133853_state[(0)] = null);

(cr133853_state[(1)] = null);

(cr133853_state[(3)] = null);

(cr133853_state[(2)] = null);

throw cr133853_exception;
}});
var cr133853_block_10 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr133853_block_10(cr133853_state){
try{var cr133853_place_27 = (cr133853_state[(3)]);
var cr133853_place_37 = cljs.core.dissoc;
var cr133853_place_38 = cljs.core.assoc;
var cr133853_place_39 = message;
var cr133853_place_40 = new cljs.core.Keyword(null,"s3-key","s3-key",696218166);
var cr133853_place_41 = cr133853_place_27;
var cr133853_place_42 = (function (){var G__133905 = cr133853_place_39;
var G__133906 = cr133853_place_40;
var G__133907 = cr133853_place_41;
var fexpr__133904 = cr133853_place_38;
return (fexpr__133904.cljs$core$IFn$_invoke$arity$3 ? fexpr__133904.cljs$core$IFn$_invoke$arity$3(G__133905,G__133906,G__133907) : fexpr__133904.call(null,G__133905,G__133906,G__133907));
})();
var cr133853_place_43 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr133853_place_44 = new cljs.core.Keyword(null,"ops","ops",1237330063);
var cr133853_place_45 = new cljs.core.Keyword(null,"t-before","t-before",-507640180);
var cr133853_place_46 = (function (){var G__133909 = cr133853_place_42;
var G__133910 = cr133853_place_43;
var G__133911 = cr133853_place_44;
var G__133912 = cr133853_place_45;
var fexpr__133908 = cr133853_place_37;
return (fexpr__133908.cljs$core$IFn$_invoke$arity$4 ? fexpr__133908.cljs$core$IFn$_invoke$arity$4(G__133909,G__133910,G__133911,G__133912) : fexpr__133908.call(null,G__133909,G__133910,G__133911,G__133912));
})();
(cr133853_state[(0)] = cr133853_block_11);

(cr133853_state[(3)] = null);

(cr133853_state[(4)] = cr133853_place_46);

return cr133853_state;
}catch (e133903){var cr133853_exception = e133903;
(cr133853_state[(0)] = null);

(cr133853_state[(1)] = null);

(cr133853_state[(3)] = null);

(cr133853_state[(4)] = null);

(cr133853_state[(2)] = null);

throw cr133853_exception;
}});
var cr133853_block_5 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr133853_block_5(cr133853_state){
try{var cr133853_place_28 = null;
(cr133853_state[(0)] = cr133853_block_8);

(cr133853_state[(3)] = cr133853_place_28);

return cr133853_state;
}catch (e133913){var cr133853_exception = e133913;
(cr133853_state[(0)] = null);

(cr133853_state[(1)] = null);

(cr133853_state[(3)] = null);

(cr133853_state[(2)] = null);

throw cr133853_exception;
}});
var cr133853_block_2 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr133853_block_2(cr133853_state){
try{var cr133853_place_17 = null;
(cr133853_state[(0)] = cr133853_block_4);

(cr133853_state[(2)] = cr133853_place_17);

return cr133853_state;
}catch (e133914){var cr133853_exception = e133914;
(cr133853_state[(0)] = null);

(cr133853_state[(1)] = null);

(cr133853_state[(2)] = null);

throw cr133853_exception;
}});
var cr133853_block_0 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr133853_block_0(cr133853_state){
try{var cr133853_place_0 = get_ws_create_task;
(cr133853_state[(0)] = cr133853_block_1);

return missionary.core.park(cr133853_place_0);
}catch (e133915){var cr133853_exception = e133915;
(cr133853_state[(0)] = null);

throw cr133853_exception;
}});
var cr133853_block_9 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr133853_block_9(cr133853_state){
try{var cr133853_place_36 = message;
(cr133853_state[(0)] = cr133853_block_11);

(cr133853_state[(4)] = cr133853_place_36);

return cr133853_state;
}catch (e133916){var cr133853_exception = e133916;
(cr133853_state[(0)] = null);

(cr133853_state[(1)] = null);

(cr133853_state[(4)] = null);

(cr133853_state[(2)] = null);

throw cr133853_exception;
}});
var cr133853_block_1 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr133853_block_1(cr133853_state){
try{var cr133853_place_1 = missionary.core.unpark();
var cr133853_place_2 = cljs.core._EQ_;
var cr133853_place_3 = "apply-ops";
var cr133853_place_4 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr133853_place_5 = message;
var cr133853_place_6 = cr133853_place_4.cljs$core$IFn$_invoke$arity$1(cr133853_place_5);
var cr133853_place_7 = (function (){var G__133919 = cr133853_place_3;
var G__133920 = cr133853_place_6;
var fexpr__133918 = cr133853_place_2;
return (fexpr__133918.cljs$core$IFn$_invoke$arity$2 ? fexpr__133918.cljs$core$IFn$_invoke$arity$2(G__133919,G__133920) : fexpr__133918.call(null,G__133919,G__133920));
})();
var cr133853_place_8 = (400);
var cr133853_place_9 = cljs.core.count;
var cr133853_place_10 = new cljs.core.Keyword(null,"ops","ops",1237330063);
var cr133853_place_11 = message;
var cr133853_place_12 = cr133853_place_10.cljs$core$IFn$_invoke$arity$1(cr133853_place_11);
var cr133853_place_13 = (function (){var G__133922 = cr133853_place_12;
var fexpr__133921 = cr133853_place_9;
return (fexpr__133921.cljs$core$IFn$_invoke$arity$1 ? fexpr__133921.cljs$core$IFn$_invoke$arity$1(G__133922) : fexpr__133921.call(null,G__133922));
})();
var cr133853_place_14 = (cr133853_place_8 < cr133853_place_13);
var cr133853_place_15 = ((cr133853_place_7) && (cr133853_place_14));
var cr133853_place_16 = null;
if(cr133853_place_15){
(cr133853_state[(0)] = cr133853_block_3);

(cr133853_state[(1)] = cr133853_place_1);

(cr133853_state[(2)] = cr133853_place_16);

return cr133853_state;
} else {
(cr133853_state[(0)] = cr133853_block_2);

(cr133853_state[(1)] = cr133853_place_1);

(cr133853_state[(2)] = cr133853_place_16);

return cr133853_state;
}
}catch (e133917){var cr133853_exception = e133917;
(cr133853_state[(0)] = null);

throw cr133853_exception;
}});
var cr133853_block_3 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr133853_block_3(cr133853_state){
try{var cr133853_place_18 = new cljs.core.Keyword(null,"timeout-ms","timeout-ms",754221406);
var cr133853_place_19 = (20000);
var cr133853_place_20 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr133853_place_18,cr133853_place_19]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
(cr133853_state[(0)] = cr133853_block_4);

(cr133853_state[(2)] = cr133853_place_20);

return cr133853_state;
}catch (e133923){var cr133853_exception = e133923;
(cr133853_state[(0)] = null);

(cr133853_state[(1)] = null);

(cr133853_state[(2)] = null);

throw cr133853_exception;
}});
var cr133853_block_12 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr133853_block_12(cr133853_state){
try{var cr133853_place_47 = (cr133853_state[(1)]);
var cr133853_place_53 = missionary.core.unpark();
var cr133853_place_54 = (function (){var G__133926 = cr133853_place_53;
var fexpr__133925 = cr133853_place_47;
return (fexpr__133925.cljs$core$IFn$_invoke$arity$1 ? fexpr__133925.cljs$core$IFn$_invoke$arity$1(G__133926) : fexpr__133925.call(null,G__133926));
})();
(cr133853_state[(0)] = null);

(cr133853_state[(1)] = null);

return cr133853_place_54;
}catch (e133924){var cr133853_exception = e133924;
(cr133853_state[(0)] = null);

(cr133853_state[(1)] = null);

throw cr133853_exception;
}});
var cr133853_block_11 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr133853_block_11(cr133853_state){
try{var cr133853_place_1 = (cr133853_state[(1)]);
var cr133853_place_35 = (cr133853_state[(4)]);
var cr133853_place_16 = (cr133853_state[(2)]);
var cr133853_place_47 = frontend.worker.rtc.ws_util.handle_remote_ex;
var cr133853_place_48 = frontend.worker.rtc.ws.send_AMPERSAND_recv;
var cr133853_place_49 = cr133853_place_1;
var cr133853_place_50 = cr133853_place_35;
var cr133853_place_51 = cr133853_place_16;
var cr133853_place_52 = (function (){var G__133929 = cr133853_place_49;
var G__133930 = cr133853_place_50;
var G__133931 = cr133853_place_51;
var fexpr__133928 = cr133853_place_48;
return (fexpr__133928.cljs$core$IFn$_invoke$arity$3 ? fexpr__133928.cljs$core$IFn$_invoke$arity$3(G__133929,G__133930,G__133931) : fexpr__133928.call(null,G__133929,G__133930,G__133931));
})();
(cr133853_state[(0)] = cr133853_block_12);

(cr133853_state[(1)] = null);

(cr133853_state[(4)] = null);

(cr133853_state[(2)] = null);

(cr133853_state[(1)] = cr133853_place_47);

return missionary.core.park(cr133853_place_52);
}catch (e133927){var cr133853_exception = e133927;
(cr133853_state[(0)] = null);

(cr133853_state[(1)] = null);

(cr133853_state[(4)] = null);

(cr133853_state[(2)] = null);

throw cr133853_exception;
}});
return cloroutine.impl.coroutine((function (){var G__133932 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__133932[(0)] = cr133853_block_0);

return G__133932;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.ws_util.get_ws_url = (function frontend$worker$rtc$ws_util$get_ws_url(token){
if((!((token == null)))){
} else {
throw (new Error("Assert failed: (some? token)"));
}

return goog.string.format(cljs.core.deref(frontend.worker.state._STAR_rtc_ws_url),token);
});
/**
 * Return a map with atom *current-ws and a task
 *   that get current ws, create one if needed(closed or not created yet)
 */
frontend.worker.rtc.ws_util.gen_get_ws_create_map = (function frontend$worker$rtc$ws_util$gen_get_ws_create_map(var_args){
var args__5732__auto__ = [];
var len__5726__auto___134025 = arguments.length;
var i__5727__auto___134026 = (0);
while(true){
if((i__5727__auto___134026 < len__5726__auto___134025)){
args__5732__auto__.push((arguments[i__5727__auto___134026]));

var G__134027 = (i__5727__auto___134026 + (1));
i__5727__auto___134026 = G__134027;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.worker.rtc.ws_util.gen_get_ws_create_map.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.worker.rtc.ws_util.gen_get_ws_create_map.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__133935){
var map__133936 = p__133935;
var map__133936__$1 = cljs.core.__destructure_map(map__133936);
var retry_count = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__133936__$1,new cljs.core.Keyword(null,"retry-count","retry-count",1936122875),(10));
var open_ws_timeout = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__133936__$1,new cljs.core.Keyword(null,"open-ws-timeout","open-ws-timeout",-1198721376),(10000));
var _STAR_current_ws = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var ws_create_task = frontend.worker.rtc.ws.mws_create.cljs$core$IFn$_invoke$arity$variadic(url,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"retry-count","retry-count",1936122875),retry_count,new cljs.core.Keyword(null,"open-ws-timeout","open-ws-timeout",-1198721376),open_ws_timeout], null)], 0));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"*current-ws","*current-ws",2093663036),_STAR_current_ws,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002),cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr133937_block_0 = (function frontend$worker$rtc$ws_util$cr133937_block_0(cr133937_state){
try{var cr133937_place_0 = cljs.core.deref;
var cr133937_place_1 = _STAR_current_ws;
var cr133937_place_2 = (function (){var G__133957 = cr133937_place_1;
var fexpr__133956 = cr133937_place_0;
return (fexpr__133956.cljs$core$IFn$_invoke$arity$1 ? fexpr__133956.cljs$core$IFn$_invoke$arity$1(G__133957) : fexpr__133956.call(null,G__133957));
})();
var cr133937_place_3 = cr133937_place_2;
var cr133937_place_4 = cr133937_place_3;
var cr133937_place_5 = null;
if(cljs.core.truth_(cr133937_place_4)){
(cr133937_state[(0)] = cr133937_block_2);

(cr133937_state[(2)] = cr133937_place_2);

(cr133937_state[(1)] = cr133937_place_5);

return cr133937_state;
} else {
(cr133937_state[(0)] = cr133937_block_1);

(cr133937_state[(2)] = cr133937_place_2);

(cr133937_state[(3)] = cr133937_place_3);

(cr133937_state[(1)] = cr133937_place_5);

return cr133937_state;
}
}catch (e133955){var cr133937_exception = e133955;
(cr133937_state[(0)] = null);

throw cr133937_exception;
}});
var cr133937_block_1 = (function frontend$worker$rtc$ws_util$cr133937_block_1(cr133937_state){
try{var cr133937_place_3 = (cr133937_state[(3)]);
var cr133937_place_6 = cr133937_place_3;
(cr133937_state[(0)] = cr133937_block_3);

(cr133937_state[(3)] = null);

(cr133937_state[(1)] = cr133937_place_6);

return cr133937_state;
}catch (e133958){var cr133937_exception = e133958;
(cr133937_state[(0)] = null);

(cr133937_state[(1)] = null);

(cr133937_state[(2)] = null);

(cr133937_state[(3)] = null);

throw cr133937_exception;
}});
var cr133937_block_2 = (function frontend$worker$rtc$ws_util$cr133937_block_2(cr133937_state){
try{var cr133937_place_2 = (cr133937_state[(2)]);
var cr133937_place_7 = cljs.core.not;
var cr133937_place_8 = frontend.worker.rtc.ws.closed_QMARK_;
var cr133937_place_9 = cr133937_place_2;
var cr133937_place_10 = (function (){var G__133961 = cr133937_place_9;
var fexpr__133960 = cr133937_place_8;
return (fexpr__133960.cljs$core$IFn$_invoke$arity$1 ? fexpr__133960.cljs$core$IFn$_invoke$arity$1(G__133961) : fexpr__133960.call(null,G__133961));
})();
var cr133937_place_11 = (function (){var G__133963 = cr133937_place_10;
var fexpr__133962 = cr133937_place_7;
return (fexpr__133962.cljs$core$IFn$_invoke$arity$1 ? fexpr__133962.cljs$core$IFn$_invoke$arity$1(G__133963) : fexpr__133962.call(null,G__133963));
})();
(cr133937_state[(0)] = cr133937_block_3);

(cr133937_state[(1)] = cr133937_place_11);

return cr133937_state;
}catch (e133959){var cr133937_exception = e133959;
(cr133937_state[(0)] = null);

(cr133937_state[(1)] = null);

(cr133937_state[(2)] = null);

throw cr133937_exception;
}});
var cr133937_block_3 = (function frontend$worker$rtc$ws_util$cr133937_block_3(cr133937_state){
try{var cr133937_place_5 = (cr133937_state[(1)]);
var cr133937_place_12 = null;
if(cljs.core.truth_(cr133937_place_5)){
(cr133937_state[(0)] = cr133937_block_6);

(cr133937_state[(1)] = null);

(cr133937_state[(1)] = cr133937_place_12);

return cr133937_state;
} else {
(cr133937_state[(0)] = cr133937_block_4);

(cr133937_state[(1)] = null);

(cr133937_state[(2)] = null);

(cr133937_state[(1)] = cr133937_place_12);

return cr133937_state;
}
}catch (e133964){var cr133937_exception = e133964;
(cr133937_state[(0)] = null);

(cr133937_state[(1)] = null);

(cr133937_state[(2)] = null);

throw cr133937_exception;
}});
var cr133937_block_4 = (function frontend$worker$rtc$ws_util$cr133937_block_4(cr133937_state){
try{var cr133937_place_13 = ws_create_task;
(cr133937_state[(0)] = cr133937_block_5);

return missionary.core.park(cr133937_place_13);
}catch (e133969){var cr133937_exception = e133969;
(cr133937_state[(0)] = null);

(cr133937_state[(1)] = null);

throw cr133937_exception;
}});
var cr133937_block_5 = (function frontend$worker$rtc$ws_util$cr133937_block_5(cr133937_state){
try{var cr133937_place_14 = missionary.core.unpark();
var cr133937_place_15 = cljs.core.reset_BANG_;
var cr133937_place_16 = _STAR_current_ws;
var cr133937_place_17 = cr133937_place_14;
var cr133937_place_18 = (function (){var G__133980 = cr133937_place_16;
var G__133981 = cr133937_place_17;
var fexpr__133979 = cr133937_place_15;
return (fexpr__133979.cljs$core$IFn$_invoke$arity$2 ? fexpr__133979.cljs$core$IFn$_invoke$arity$2(G__133980,G__133981) : fexpr__133979.call(null,G__133980,G__133981));
})();
var cr133937_place_19 = cr133937_place_14;
(cr133937_state[(0)] = cr133937_block_7);

(cr133937_state[(1)] = cr133937_place_19);

return cr133937_state;
}catch (e133974){var cr133937_exception = e133974;
(cr133937_state[(0)] = null);

(cr133937_state[(1)] = null);

throw cr133937_exception;
}});
var cr133937_block_6 = (function frontend$worker$rtc$ws_util$cr133937_block_6(cr133937_state){
try{var cr133937_place_2 = (cr133937_state[(2)]);
var cr133937_place_20 = cr133937_place_2;
(cr133937_state[(0)] = cr133937_block_7);

(cr133937_state[(2)] = null);

(cr133937_state[(1)] = cr133937_place_20);

return cr133937_state;
}catch (e133983){var cr133937_exception = e133983;
(cr133937_state[(0)] = null);

(cr133937_state[(2)] = null);

(cr133937_state[(1)] = null);

throw cr133937_exception;
}});
var cr133937_block_7 = (function frontend$worker$rtc$ws_util$cr133937_block_7(cr133937_state){
try{var cr133937_place_12 = (cr133937_state[(1)]);
(cr133937_state[(0)] = null);

(cr133937_state[(1)] = null);

return cr133937_place_12;
}catch (e133984){var cr133937_exception = e133984;
(cr133937_state[(0)] = null);

(cr133937_state[(1)] = null);

throw cr133937_exception;
}});
return cloroutine.impl.coroutine((function (){var G__133985 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__133985[(0)] = cr133937_block_0);

return G__133985;
})());
})(),missionary.core.sp_run)], null);
}));

(frontend.worker.rtc.ws_util.gen_get_ws_create_map.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.worker.rtc.ws_util.gen_get_ws_create_map.cljs$lang$applyTo = (function (seq133933){
var G__133934 = cljs.core.first(seq133933);
var seq133933__$1 = cljs.core.next(seq133933);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__133934,seq133933__$1);
}));

/**
 * Return a memoized task to reuse the same websocket.
 */
frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized = cljs.core.memoize(frontend.worker.rtc.ws_util.gen_get_ws_create_map);

//# sourceMappingURL=frontend.worker.rtc.ws_util.js.map
