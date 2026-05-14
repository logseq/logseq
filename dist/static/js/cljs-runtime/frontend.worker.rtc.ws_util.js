goog.provide('frontend.worker.rtc.ws_util');
frontend.worker.rtc.ws_util.handle_remote_ex = (function frontend$worker$rtc$ws_util$handle_remote_ex(resp){
var temp__5802__auto__ = (function (){var G__140028 = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"ex-data","ex-data",-309040259).cljs$core$IFn$_invoke$arity$1(resp));
var fexpr__140027 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"graph-not-exist","graph-not-exist",-1126829753),frontend.worker.rtc.exception.ex_remote_graph_not_exist,new cljs.core.Keyword(null,"graph-not-ready","graph-not-ready",1357090672),frontend.worker.rtc.exception.ex_remote_graph_not_ready,new cljs.core.Keyword(null,"bad-request-body","bad-request-body",-1595215694),frontend.worker.rtc.exception.ex_bad_request_body,new cljs.core.Keyword(null,"not-allowed","not-allowed",-397728307),frontend.worker.rtc.exception.ex_not_allowed], null);
return (fexpr__140027.cljs$core$IFn$_invoke$arity$1 ? fexpr__140027.cljs$core$IFn$_invoke$arity$1(G__140028) : fexpr__140027.call(null,G__140028));
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

return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr140029_block_4 = (function frontend$worker$rtc$ws_util$put_apply_ops_message_on_s3_if_too_huge_$_cr140029_block_4(cr140029_state){
try{var cr140029_place_57 = missionary.core.unpark();
var cr140029_place_58 = cljs.core.__destructure_map;
var cr140029_place_59 = cr140029_place_57;
var cr140029_place_60 = (function (){var G__140140 = cr140029_place_59;
var fexpr__140139 = cr140029_place_58;
return (fexpr__140139.cljs$core$IFn$_invoke$arity$1 ? fexpr__140139.cljs$core$IFn$_invoke$arity$1(G__140140) : fexpr__140139.call(null,G__140140));
})();
var cr140029_place_61 = cr140029_place_60;
var cr140029_place_62 = cljs.core.get;
var cr140029_place_63 = cr140029_place_60;
var cr140029_place_64 = new cljs.core.Keyword(null,"status","status",-1997798413);
var cr140029_place_65 = (function (){var G__140142 = cr140029_place_63;
var G__140143 = cr140029_place_64;
var fexpr__140141 = cr140029_place_62;
return (fexpr__140141.cljs$core$IFn$_invoke$arity$2 ? fexpr__140141.cljs$core$IFn$_invoke$arity$2(G__140142,G__140143) : fexpr__140141.call(null,G__140142,G__140143));
})();
var cr140029_place_66 = cljs_http_missionary.client.unexceptional_status_QMARK_;
var cr140029_place_67 = cr140029_place_65;
var cr140029_place_68 = (function (){var G__140145 = cr140029_place_67;
var fexpr__140144 = cr140029_place_66;
return (fexpr__140144.cljs$core$IFn$_invoke$arity$1 ? fexpr__140144.cljs$core$IFn$_invoke$arity$1(G__140145) : fexpr__140144.call(null,G__140145));
})();
var cr140029_place_69 = null;
if(cljs.core.truth_(cr140029_place_68)){
(cr140029_state[(0)] = cr140029_block_6);

(cr140029_state[(3)] = cr140029_place_69);

return cr140029_state;
} else {
(cr140029_state[(0)] = cr140029_block_5);

(cr140029_state[(2)] = null);

(cr140029_state[(1)] = null);

(cr140029_state[(1)] = cr140029_place_61);

return cr140029_state;
}
}catch (e140138){var cr140029_exception = e140138;
(cr140029_state[(0)] = null);

(cr140029_state[(2)] = null);

(cr140029_state[(1)] = null);

throw cr140029_exception;
}});
var cr140029_block_5 = (function frontend$worker$rtc$ws_util$put_apply_ops_message_on_s3_if_too_huge_$_cr140029_block_5(cr140029_state){
try{var cr140029_place_61 = (cr140029_state[(1)]);
var cr140029_place_70 = cljs.core.ex_info;
var cr140029_place_71 = "failed to upload apply-ops message";
var cr140029_place_72 = new cljs.core.Keyword(null,"resp","resp",1418702376);
var cr140029_place_73 = cr140029_place_61;
var cr140029_place_74 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr140029_place_72,cr140029_place_73]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr140029_place_75 = (function (){var G__140148 = cr140029_place_71;
var G__140149 = cr140029_place_74;
var fexpr__140147 = cr140029_place_70;
return (fexpr__140147.cljs$core$IFn$_invoke$arity$2 ? fexpr__140147.cljs$core$IFn$_invoke$arity$2(G__140148,G__140149) : fexpr__140147.call(null,G__140148,G__140149));
})();
var cr140029_place_76 = (function(){throw cr140029_place_75})();
(cr140029_state[(0)] = null);

(cr140029_state[(1)] = null);

return null;
}catch (e140146){var cr140029_exception = e140146;
(cr140029_state[(0)] = null);

(cr140029_state[(1)] = null);

throw cr140029_exception;
}});
var cr140029_block_8 = (function frontend$worker$rtc$ws_util$put_apply_ops_message_on_s3_if_too_huge_$_cr140029_block_8(cr140029_state){
try{var cr140029_place_29 = (cr140029_state[(1)]);
(cr140029_state[(0)] = null);

(cr140029_state[(1)] = null);

return cr140029_place_29;
}catch (e140150){var cr140029_exception = e140150;
(cr140029_state[(0)] = null);

(cr140029_state[(1)] = null);

throw cr140029_exception;
}});
var cr140029_block_3 = (function frontend$worker$rtc$ws_util$put_apply_ops_message_on_s3_if_too_huge_$_cr140029_block_3(cr140029_state){
try{var cr140029_place_21 = (cr140029_state[(2)]);
var cr140029_place_37 = missionary.core.unpark();
var cr140029_place_38 = cljs.core.__destructure_map;
var cr140029_place_39 = cr140029_place_37;
var cr140029_place_40 = (function (){var G__140155 = cr140029_place_39;
var fexpr__140154 = cr140029_place_38;
return (fexpr__140154.cljs$core$IFn$_invoke$arity$1 ? fexpr__140154.cljs$core$IFn$_invoke$arity$1(G__140155) : fexpr__140154.call(null,G__140155));
})();
var cr140029_place_41 = cljs.core.get;
var cr140029_place_42 = cr140029_place_40;
var cr140029_place_43 = new cljs.core.Keyword(null,"url","url",276297046);
var cr140029_place_44 = (function (){var G__140157 = cr140029_place_42;
var G__140158 = cr140029_place_43;
var fexpr__140156 = cr140029_place_41;
return (fexpr__140156.cljs$core$IFn$_invoke$arity$2 ? fexpr__140156.cljs$core$IFn$_invoke$arity$2(G__140157,G__140158) : fexpr__140156.call(null,G__140157,G__140158));
})();
var cr140029_place_45 = cljs.core.get;
var cr140029_place_46 = cr140029_place_40;
var cr140029_place_47 = new cljs.core.Keyword(null,"key","key",-1516042587);
var cr140029_place_48 = (function (){var G__140160 = cr140029_place_46;
var G__140161 = cr140029_place_47;
var fexpr__140159 = cr140029_place_45;
return (fexpr__140159.cljs$core$IFn$_invoke$arity$2 ? fexpr__140159.cljs$core$IFn$_invoke$arity$2(G__140160,G__140161) : fexpr__140159.call(null,G__140160,G__140161));
})();
var cr140029_place_49 = cljs_http_missionary.client.put;
var cr140029_place_50 = cr140029_place_44;
var cr140029_place_51 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr140029_place_52 = cr140029_place_21;
var cr140029_place_53 = new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222);
var cr140029_place_54 = false;
var cr140029_place_55 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr140029_place_53,cr140029_place_54,cr140029_place_51,cr140029_place_52]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr140029_place_56 = (function (){var G__140163 = cr140029_place_50;
var G__140164 = cr140029_place_55;
var fexpr__140162 = cr140029_place_49;
return (fexpr__140162.cljs$core$IFn$_invoke$arity$2 ? fexpr__140162.cljs$core$IFn$_invoke$arity$2(G__140163,G__140164) : fexpr__140162.call(null,G__140163,G__140164));
})();
(cr140029_state[(0)] = cr140029_block_4);

(cr140029_state[(2)] = null);

(cr140029_state[(2)] = cr140029_place_48);

return missionary.core.park(cr140029_place_56);
}catch (e140152){var cr140029_exception = e140152;
(cr140029_state[(0)] = null);

(cr140029_state[(2)] = null);

(cr140029_state[(1)] = null);

throw cr140029_exception;
}});
var cr140029_block_7 = (function frontend$worker$rtc$ws_util$put_apply_ops_message_on_s3_if_too_huge_$_cr140029_block_7(cr140029_state){
try{var cr140029_place_69 = (cr140029_state[(3)]);
var cr140029_place_48 = (cr140029_state[(2)]);
var cr140029_place_78 = cr140029_place_48;
(cr140029_state[(0)] = cr140029_block_8);

(cr140029_state[(3)] = null);

(cr140029_state[(2)] = null);

(cr140029_state[(1)] = cr140029_place_78);

return cr140029_state;
}catch (e140165){var cr140029_exception = e140165;
(cr140029_state[(0)] = null);

(cr140029_state[(3)] = null);

(cr140029_state[(2)] = null);

(cr140029_state[(1)] = null);

throw cr140029_exception;
}});
var cr140029_block_1 = (function frontend$worker$rtc$ws_util$put_apply_ops_message_on_s3_if_too_huge_$_cr140029_block_1(cr140029_state){
try{var cr140029_place_30 = null;
(cr140029_state[(0)] = cr140029_block_8);

(cr140029_state[(1)] = cr140029_place_30);

return cr140029_state;
}catch (e140166){var cr140029_exception = e140166;
(cr140029_state[(0)] = null);

(cr140029_state[(1)] = null);

throw cr140029_exception;
}});
var cr140029_block_6 = (function frontend$worker$rtc$ws_util$put_apply_ops_message_on_s3_if_too_huge_$_cr140029_block_6(cr140029_state){
try{var cr140029_place_77 = null;
(cr140029_state[(0)] = cr140029_block_7);

(cr140029_state[(3)] = cr140029_place_77);

return cr140029_state;
}catch (e140167){var cr140029_exception = e140167;
(cr140029_state[(0)] = null);

(cr140029_state[(3)] = null);

(cr140029_state[(2)] = null);

(cr140029_state[(1)] = null);

throw cr140029_exception;
}});
var cr140029_block_2 = (function frontend$worker$rtc$ws_util$put_apply_ops_message_on_s3_if_too_huge_$_cr140029_block_2(cr140029_state){
try{var cr140029_place_31 = frontend.worker.rtc.ws.send_AMPERSAND_recv;
var cr140029_place_32 = ws;
var cr140029_place_33 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr140029_place_34 = "presign-put-temp-s3-obj";
var cr140029_place_35 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr140029_place_33,cr140029_place_34]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr140029_place_36 = (function (){var G__140170 = cr140029_place_32;
var G__140171 = cr140029_place_35;
var fexpr__140169 = cr140029_place_31;
return (fexpr__140169.cljs$core$IFn$_invoke$arity$2 ? fexpr__140169.cljs$core$IFn$_invoke$arity$2(G__140170,G__140171) : fexpr__140169.call(null,G__140170,G__140171));
})();
(cr140029_state[(0)] = cr140029_block_3);

return missionary.core.park(cr140029_place_36);
}catch (e140168){var cr140029_exception = e140168;
(cr140029_state[(0)] = null);

(cr140029_state[(2)] = null);

(cr140029_state[(1)] = null);

throw cr140029_exception;
}});
var cr140029_block_0 = (function frontend$worker$rtc$ws_util$put_apply_ops_message_on_s3_if_too_huge_$_cr140029_block_0(cr140029_state){
try{var cr140029_place_0 = cljs.core.assoc;
var cr140029_place_1 = message;
var cr140029_place_2 = new cljs.core.Keyword(null,"req-id","req-id",-471642231);
var cr140029_place_3 = "temp-id";
var cr140029_place_4 = (function (){var G__140177 = cr140029_place_1;
var G__140178 = cr140029_place_2;
var G__140179 = cr140029_place_3;
var fexpr__140176 = cr140029_place_0;
return (fexpr__140176.cljs$core$IFn$_invoke$arity$3 ? fexpr__140176.cljs$core$IFn$_invoke$arity$3(G__140177,G__140178,G__140179) : fexpr__140176.call(null,G__140177,G__140178,G__140179));
})();
var cr140029_place_5 = frontend.worker.rtc.malli_schema.data_to_ws_coercer;
var cr140029_place_6 = cr140029_place_4;
var cr140029_place_7 = (function (){var G__140181 = cr140029_place_6;
var fexpr__140180 = cr140029_place_5;
return (fexpr__140180.cljs$core$IFn$_invoke$arity$1 ? fexpr__140180.cljs$core$IFn$_invoke$arity$1(G__140181) : fexpr__140180.call(null,G__140181));
})();
var cr140029_place_8 = JSON.stringify;
var cr140029_place_9 = cljs.core.clj__GT_js;
var cr140029_place_10 = cljs.core.select_keys;
var cr140029_place_11 = frontend.worker.rtc.malli_schema.data_to_ws_encoder;
var cr140029_place_12 = cr140029_place_7;
var cr140029_place_13 = (function (){var G__140183 = cr140029_place_12;
var fexpr__140182 = cr140029_place_11;
return (fexpr__140182.cljs$core$IFn$_invoke$arity$1 ? fexpr__140182.cljs$core$IFn$_invoke$arity$1(G__140183) : fexpr__140182.call(null,G__140183));
})();
var cr140029_place_14 = "graph-uuid";
var cr140029_place_15 = "ops";
var cr140029_place_16 = "t-before";
var cr140029_place_17 = "schema-version";
var cr140029_place_18 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr140029_place_14,cr140029_place_15,cr140029_place_16,cr140029_place_17], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr140029_place_19 = (function (){var G__140185 = cr140029_place_13;
var G__140186 = cr140029_place_18;
var fexpr__140184 = cr140029_place_10;
return (fexpr__140184.cljs$core$IFn$_invoke$arity$2 ? fexpr__140184.cljs$core$IFn$_invoke$arity$2(G__140185,G__140186) : fexpr__140184.call(null,G__140185,G__140186));
})();
var cr140029_place_20 = (function (){var G__140188 = cr140029_place_19;
var fexpr__140187 = cr140029_place_9;
return (fexpr__140187.cljs$core$IFn$_invoke$arity$1 ? fexpr__140187.cljs$core$IFn$_invoke$arity$1(G__140188) : fexpr__140187.call(null,G__140188));
})();
var cr140029_place_21 = (function (){var G__140190 = cr140029_place_20;
var fexpr__140189 = cr140029_place_8;
return (fexpr__140189.cljs$core$IFn$_invoke$arity$1 ? fexpr__140189.cljs$core$IFn$_invoke$arity$1(G__140190) : fexpr__140189.call(null,G__140190));
})();
var cr140029_place_22 = logseq.graph_parser.utf8.encode;
var cr140029_place_23 = cr140029_place_21;
var cr140029_place_24 = (function (){var G__140192 = cr140029_place_23;
var fexpr__140191 = cr140029_place_22;
return (fexpr__140191.cljs$core$IFn$_invoke$arity$1 ? fexpr__140191.cljs$core$IFn$_invoke$arity$1(G__140192) : fexpr__140191.call(null,G__140192));
})();
var cr140029_place_25 = cr140029_place_24.length;
var cr140029_place_26 = (100000);
var cr140029_place_27 = cr140029_place_25;
var cr140029_place_28 = (cr140029_place_26 < cr140029_place_27);
var cr140029_place_29 = null;
if(cr140029_place_28){
(cr140029_state[(0)] = cr140029_block_2);

(cr140029_state[(2)] = cr140029_place_21);

(cr140029_state[(1)] = cr140029_place_29);

return cr140029_state;
} else {
(cr140029_state[(0)] = cr140029_block_1);

(cr140029_state[(1)] = cr140029_place_29);

return cr140029_state;
}
}catch (e140175){var cr140029_exception = e140175;
(cr140029_state[(0)] = null);

throw cr140029_exception;
}});
return cloroutine.impl.coroutine((function (){var G__140193 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__140193[(0)] = cr140029_block_0);

return G__140193;
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
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr140198_block_12 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr140198_block_12(cr140198_state){
try{var cr140198_place_47 = (cr140198_state[(1)]);
var cr140198_place_53 = missionary.core.unpark();
var cr140198_place_54 = (function (){var G__140270 = cr140198_place_53;
var fexpr__140269 = cr140198_place_47;
return (fexpr__140269.cljs$core$IFn$_invoke$arity$1 ? fexpr__140269.cljs$core$IFn$_invoke$arity$1(G__140270) : fexpr__140269.call(null,G__140270));
})();
(cr140198_state[(0)] = null);

(cr140198_state[(1)] = null);

return cr140198_place_54;
}catch (e140268){var cr140198_exception = e140268;
(cr140198_state[(0)] = null);

(cr140198_state[(1)] = null);

throw cr140198_exception;
}});
var cr140198_block_10 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr140198_block_10(cr140198_state){
try{var cr140198_place_27 = (cr140198_state[(3)]);
var cr140198_place_37 = cljs.core.dissoc;
var cr140198_place_38 = cljs.core.assoc;
var cr140198_place_39 = message;
var cr140198_place_40 = new cljs.core.Keyword(null,"s3-key","s3-key",696218166);
var cr140198_place_41 = cr140198_place_27;
var cr140198_place_42 = (function (){var G__140275 = cr140198_place_39;
var G__140276 = cr140198_place_40;
var G__140277 = cr140198_place_41;
var fexpr__140274 = cr140198_place_38;
return (fexpr__140274.cljs$core$IFn$_invoke$arity$3 ? fexpr__140274.cljs$core$IFn$_invoke$arity$3(G__140275,G__140276,G__140277) : fexpr__140274.call(null,G__140275,G__140276,G__140277));
})();
var cr140198_place_43 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr140198_place_44 = new cljs.core.Keyword(null,"ops","ops",1237330063);
var cr140198_place_45 = new cljs.core.Keyword(null,"t-before","t-before",-507640180);
var cr140198_place_46 = (function (){var G__140279 = cr140198_place_42;
var G__140280 = cr140198_place_43;
var G__140281 = cr140198_place_44;
var G__140282 = cr140198_place_45;
var fexpr__140278 = cr140198_place_37;
return (fexpr__140278.cljs$core$IFn$_invoke$arity$4 ? fexpr__140278.cljs$core$IFn$_invoke$arity$4(G__140279,G__140280,G__140281,G__140282) : fexpr__140278.call(null,G__140279,G__140280,G__140281,G__140282));
})();
(cr140198_state[(0)] = cr140198_block_11);

(cr140198_state[(3)] = null);

(cr140198_state[(4)] = cr140198_place_46);

return cr140198_state;
}catch (e140271){var cr140198_exception = e140271;
(cr140198_state[(0)] = null);

(cr140198_state[(3)] = null);

(cr140198_state[(1)] = null);

(cr140198_state[(4)] = null);

(cr140198_state[(2)] = null);

throw cr140198_exception;
}});
var cr140198_block_3 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr140198_block_3(cr140198_state){
try{var cr140198_place_18 = new cljs.core.Keyword(null,"timeout-ms","timeout-ms",754221406);
var cr140198_place_19 = (20000);
var cr140198_place_20 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr140198_place_18,cr140198_place_19]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
(cr140198_state[(0)] = cr140198_block_4);

(cr140198_state[(2)] = cr140198_place_20);

return cr140198_state;
}catch (e140283){var cr140198_exception = e140283;
(cr140198_state[(0)] = null);

(cr140198_state[(1)] = null);

(cr140198_state[(2)] = null);

throw cr140198_exception;
}});
var cr140198_block_5 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr140198_block_5(cr140198_state){
try{var cr140198_place_28 = null;
(cr140198_state[(0)] = cr140198_block_8);

(cr140198_state[(3)] = cr140198_place_28);

return cr140198_state;
}catch (e140284){var cr140198_exception = e140284;
(cr140198_state[(0)] = null);

(cr140198_state[(3)] = null);

(cr140198_state[(1)] = null);

(cr140198_state[(2)] = null);

throw cr140198_exception;
}});
var cr140198_block_8 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr140198_block_8(cr140198_state){
try{var cr140198_place_27 = (cr140198_state[(3)]);
var cr140198_place_34 = cr140198_place_27;
var cr140198_place_35 = null;
if(cljs.core.truth_(cr140198_place_34)){
(cr140198_state[(0)] = cr140198_block_10);

(cr140198_state[(4)] = cr140198_place_35);

return cr140198_state;
} else {
(cr140198_state[(0)] = cr140198_block_9);

(cr140198_state[(3)] = null);

(cr140198_state[(4)] = cr140198_place_35);

return cr140198_state;
}
}catch (e140285){var cr140198_exception = e140285;
(cr140198_state[(0)] = null);

(cr140198_state[(3)] = null);

(cr140198_state[(1)] = null);

(cr140198_state[(2)] = null);

throw cr140198_exception;
}});
var cr140198_block_7 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr140198_block_7(cr140198_state){
try{var cr140198_place_33 = missionary.core.unpark();
(cr140198_state[(0)] = cr140198_block_8);

(cr140198_state[(3)] = cr140198_place_33);

return cr140198_state;
}catch (e140286){var cr140198_exception = e140286;
(cr140198_state[(0)] = null);

(cr140198_state[(3)] = null);

(cr140198_state[(1)] = null);

(cr140198_state[(2)] = null);

throw cr140198_exception;
}});
var cr140198_block_9 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr140198_block_9(cr140198_state){
try{var cr140198_place_36 = message;
(cr140198_state[(0)] = cr140198_block_11);

(cr140198_state[(4)] = cr140198_place_36);

return cr140198_state;
}catch (e140287){var cr140198_exception = e140287;
(cr140198_state[(0)] = null);

(cr140198_state[(1)] = null);

(cr140198_state[(4)] = null);

(cr140198_state[(2)] = null);

throw cr140198_exception;
}});
var cr140198_block_1 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr140198_block_1(cr140198_state){
try{var cr140198_place_1 = missionary.core.unpark();
var cr140198_place_2 = cljs.core._EQ_;
var cr140198_place_3 = "apply-ops";
var cr140198_place_4 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr140198_place_5 = message;
var cr140198_place_6 = cr140198_place_4.cljs$core$IFn$_invoke$arity$1(cr140198_place_5);
var cr140198_place_7 = (function (){var G__140290 = cr140198_place_3;
var G__140291 = cr140198_place_6;
var fexpr__140289 = cr140198_place_2;
return (fexpr__140289.cljs$core$IFn$_invoke$arity$2 ? fexpr__140289.cljs$core$IFn$_invoke$arity$2(G__140290,G__140291) : fexpr__140289.call(null,G__140290,G__140291));
})();
var cr140198_place_8 = (400);
var cr140198_place_9 = cljs.core.count;
var cr140198_place_10 = new cljs.core.Keyword(null,"ops","ops",1237330063);
var cr140198_place_11 = message;
var cr140198_place_12 = cr140198_place_10.cljs$core$IFn$_invoke$arity$1(cr140198_place_11);
var cr140198_place_13 = (function (){var G__140293 = cr140198_place_12;
var fexpr__140292 = cr140198_place_9;
return (fexpr__140292.cljs$core$IFn$_invoke$arity$1 ? fexpr__140292.cljs$core$IFn$_invoke$arity$1(G__140293) : fexpr__140292.call(null,G__140293));
})();
var cr140198_place_14 = (cr140198_place_8 < cr140198_place_13);
var cr140198_place_15 = ((cr140198_place_7) && (cr140198_place_14));
var cr140198_place_16 = null;
if(cr140198_place_15){
(cr140198_state[(0)] = cr140198_block_3);

(cr140198_state[(1)] = cr140198_place_1);

(cr140198_state[(2)] = cr140198_place_16);

return cr140198_state;
} else {
(cr140198_state[(0)] = cr140198_block_2);

(cr140198_state[(1)] = cr140198_place_1);

(cr140198_state[(2)] = cr140198_place_16);

return cr140198_state;
}
}catch (e140288){var cr140198_exception = e140288;
(cr140198_state[(0)] = null);

throw cr140198_exception;
}});
var cr140198_block_6 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr140198_block_6(cr140198_state){
try{var cr140198_place_1 = (cr140198_state[(1)]);
var cr140198_place_29 = frontend.worker.rtc.ws_util.put_apply_ops_message_on_s3_if_too_huge;
var cr140198_place_30 = cr140198_place_1;
var cr140198_place_31 = message;
var cr140198_place_32 = (function (){var G__140296 = cr140198_place_30;
var G__140297 = cr140198_place_31;
var fexpr__140295 = cr140198_place_29;
return (fexpr__140295.cljs$core$IFn$_invoke$arity$2 ? fexpr__140295.cljs$core$IFn$_invoke$arity$2(G__140296,G__140297) : fexpr__140295.call(null,G__140296,G__140297));
})();
(cr140198_state[(0)] = cr140198_block_7);

return missionary.core.park(cr140198_place_32);
}catch (e140294){var cr140198_exception = e140294;
(cr140198_state[(0)] = null);

(cr140198_state[(3)] = null);

(cr140198_state[(1)] = null);

(cr140198_state[(2)] = null);

throw cr140198_exception;
}});
var cr140198_block_2 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr140198_block_2(cr140198_state){
try{var cr140198_place_17 = null;
(cr140198_state[(0)] = cr140198_block_4);

(cr140198_state[(2)] = cr140198_place_17);

return cr140198_state;
}catch (e140298){var cr140198_exception = e140298;
(cr140198_state[(0)] = null);

(cr140198_state[(1)] = null);

(cr140198_state[(2)] = null);

throw cr140198_exception;
}});
var cr140198_block_0 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr140198_block_0(cr140198_state){
try{var cr140198_place_0 = get_ws_create_task;
(cr140198_state[(0)] = cr140198_block_1);

return missionary.core.park(cr140198_place_0);
}catch (e140299){var cr140198_exception = e140299;
(cr140198_state[(0)] = null);

throw cr140198_exception;
}});
var cr140198_block_11 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr140198_block_11(cr140198_state){
try{var cr140198_place_1 = (cr140198_state[(1)]);
var cr140198_place_35 = (cr140198_state[(4)]);
var cr140198_place_16 = (cr140198_state[(2)]);
var cr140198_place_47 = frontend.worker.rtc.ws_util.handle_remote_ex;
var cr140198_place_48 = frontend.worker.rtc.ws.send_AMPERSAND_recv;
var cr140198_place_49 = cr140198_place_1;
var cr140198_place_50 = cr140198_place_35;
var cr140198_place_51 = cr140198_place_16;
var cr140198_place_52 = (function (){var G__140302 = cr140198_place_49;
var G__140303 = cr140198_place_50;
var G__140304 = cr140198_place_51;
var fexpr__140301 = cr140198_place_48;
return (fexpr__140301.cljs$core$IFn$_invoke$arity$3 ? fexpr__140301.cljs$core$IFn$_invoke$arity$3(G__140302,G__140303,G__140304) : fexpr__140301.call(null,G__140302,G__140303,G__140304));
})();
(cr140198_state[(0)] = cr140198_block_12);

(cr140198_state[(1)] = null);

(cr140198_state[(4)] = null);

(cr140198_state[(2)] = null);

(cr140198_state[(1)] = cr140198_place_47);

return missionary.core.park(cr140198_place_52);
}catch (e140300){var cr140198_exception = e140300;
(cr140198_state[(0)] = null);

(cr140198_state[(1)] = null);

(cr140198_state[(4)] = null);

(cr140198_state[(2)] = null);

throw cr140198_exception;
}});
var cr140198_block_4 = (function frontend$worker$rtc$ws_util$send_AMPERSAND_recv_$_cr140198_block_4(cr140198_state){
try{var cr140198_place_16 = (cr140198_state[(2)]);
var cr140198_place_21 = cljs.core._EQ_;
var cr140198_place_22 = "apply-ops";
var cr140198_place_23 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr140198_place_24 = message;
var cr140198_place_25 = cr140198_place_23.cljs$core$IFn$_invoke$arity$1(cr140198_place_24);
var cr140198_place_26 = (function (){var G__140307 = cr140198_place_22;
var G__140308 = cr140198_place_25;
var fexpr__140306 = cr140198_place_21;
return (fexpr__140306.cljs$core$IFn$_invoke$arity$2 ? fexpr__140306.cljs$core$IFn$_invoke$arity$2(G__140307,G__140308) : fexpr__140306.call(null,G__140307,G__140308));
})();
var cr140198_place_27 = null;
if(cljs.core.truth_(cr140198_place_26)){
(cr140198_state[(0)] = cr140198_block_6);

(cr140198_state[(3)] = cr140198_place_27);

return cr140198_state;
} else {
(cr140198_state[(0)] = cr140198_block_5);

(cr140198_state[(3)] = cr140198_place_27);

return cr140198_state;
}
}catch (e140305){var cr140198_exception = e140305;
(cr140198_state[(0)] = null);

(cr140198_state[(1)] = null);

(cr140198_state[(2)] = null);

throw cr140198_exception;
}});
return cloroutine.impl.coroutine((function (){var G__140309 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__140309[(0)] = cr140198_block_0);

return G__140309;
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
var len__5726__auto___140400 = arguments.length;
var i__5727__auto___140401 = (0);
while(true){
if((i__5727__auto___140401 < len__5726__auto___140400)){
args__5732__auto__.push((arguments[i__5727__auto___140401]));

var G__140402 = (i__5727__auto___140401 + (1));
i__5727__auto___140401 = G__140402;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.worker.rtc.ws_util.gen_get_ws_create_map.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.worker.rtc.ws_util.gen_get_ws_create_map.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__140317){
var map__140318 = p__140317;
var map__140318__$1 = cljs.core.__destructure_map(map__140318);
var retry_count = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__140318__$1,new cljs.core.Keyword(null,"retry-count","retry-count",1936122875),(10));
var open_ws_timeout = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__140318__$1,new cljs.core.Keyword(null,"open-ws-timeout","open-ws-timeout",-1198721376),(10000));
var _STAR_current_ws = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var ws_create_task = frontend.worker.rtc.ws.mws_create.cljs$core$IFn$_invoke$arity$variadic(url,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"retry-count","retry-count",1936122875),retry_count,new cljs.core.Keyword(null,"open-ws-timeout","open-ws-timeout",-1198721376),open_ws_timeout], null)], 0));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"*current-ws","*current-ws",2093663036),_STAR_current_ws,new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002),cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr140319_block_0 = (function frontend$worker$rtc$ws_util$cr140319_block_0(cr140319_state){
try{var cr140319_place_0 = cljs.core.deref;
var cr140319_place_1 = _STAR_current_ws;
var cr140319_place_2 = (function (){var G__140345 = cr140319_place_1;
var fexpr__140344 = cr140319_place_0;
return (fexpr__140344.cljs$core$IFn$_invoke$arity$1 ? fexpr__140344.cljs$core$IFn$_invoke$arity$1(G__140345) : fexpr__140344.call(null,G__140345));
})();
var cr140319_place_3 = cr140319_place_2;
var cr140319_place_4 = cr140319_place_3;
var cr140319_place_5 = null;
if(cljs.core.truth_(cr140319_place_4)){
(cr140319_state[(0)] = cr140319_block_2);

(cr140319_state[(3)] = cr140319_place_2);

(cr140319_state[(2)] = cr140319_place_5);

return cr140319_state;
} else {
(cr140319_state[(0)] = cr140319_block_1);

(cr140319_state[(3)] = cr140319_place_2);

(cr140319_state[(1)] = cr140319_place_3);

(cr140319_state[(2)] = cr140319_place_5);

return cr140319_state;
}
}catch (e140343){var cr140319_exception = e140343;
(cr140319_state[(0)] = null);

throw cr140319_exception;
}});
var cr140319_block_1 = (function frontend$worker$rtc$ws_util$cr140319_block_1(cr140319_state){
try{var cr140319_place_3 = (cr140319_state[(1)]);
var cr140319_place_6 = cr140319_place_3;
(cr140319_state[(0)] = cr140319_block_3);

(cr140319_state[(1)] = null);

(cr140319_state[(2)] = cr140319_place_6);

return cr140319_state;
}catch (e140347){var cr140319_exception = e140347;
(cr140319_state[(0)] = null);

(cr140319_state[(1)] = null);

(cr140319_state[(2)] = null);

(cr140319_state[(3)] = null);

throw cr140319_exception;
}});
var cr140319_block_2 = (function frontend$worker$rtc$ws_util$cr140319_block_2(cr140319_state){
try{var cr140319_place_2 = (cr140319_state[(3)]);
var cr140319_place_7 = cljs.core.not;
var cr140319_place_8 = frontend.worker.rtc.ws.closed_QMARK_;
var cr140319_place_9 = cr140319_place_2;
var cr140319_place_10 = (function (){var G__140351 = cr140319_place_9;
var fexpr__140350 = cr140319_place_8;
return (fexpr__140350.cljs$core$IFn$_invoke$arity$1 ? fexpr__140350.cljs$core$IFn$_invoke$arity$1(G__140351) : fexpr__140350.call(null,G__140351));
})();
var cr140319_place_11 = (function (){var G__140354 = cr140319_place_10;
var fexpr__140353 = cr140319_place_7;
return (fexpr__140353.cljs$core$IFn$_invoke$arity$1 ? fexpr__140353.cljs$core$IFn$_invoke$arity$1(G__140354) : fexpr__140353.call(null,G__140354));
})();
(cr140319_state[(0)] = cr140319_block_3);

(cr140319_state[(2)] = cr140319_place_11);

return cr140319_state;
}catch (e140348){var cr140319_exception = e140348;
(cr140319_state[(0)] = null);

(cr140319_state[(2)] = null);

(cr140319_state[(3)] = null);

throw cr140319_exception;
}});
var cr140319_block_3 = (function frontend$worker$rtc$ws_util$cr140319_block_3(cr140319_state){
try{var cr140319_place_5 = (cr140319_state[(2)]);
var cr140319_place_12 = null;
if(cljs.core.truth_(cr140319_place_5)){
(cr140319_state[(0)] = cr140319_block_6);

(cr140319_state[(2)] = null);

(cr140319_state[(1)] = cr140319_place_12);

return cr140319_state;
} else {
(cr140319_state[(0)] = cr140319_block_4);

(cr140319_state[(2)] = null);

(cr140319_state[(3)] = null);

(cr140319_state[(1)] = cr140319_place_12);

return cr140319_state;
}
}catch (e140359){var cr140319_exception = e140359;
(cr140319_state[(0)] = null);

(cr140319_state[(2)] = null);

(cr140319_state[(3)] = null);

throw cr140319_exception;
}});
var cr140319_block_4 = (function frontend$worker$rtc$ws_util$cr140319_block_4(cr140319_state){
try{var cr140319_place_13 = ws_create_task;
(cr140319_state[(0)] = cr140319_block_5);

return missionary.core.park(cr140319_place_13);
}catch (e140360){var cr140319_exception = e140360;
(cr140319_state[(0)] = null);

(cr140319_state[(1)] = null);

throw cr140319_exception;
}});
var cr140319_block_5 = (function frontend$worker$rtc$ws_util$cr140319_block_5(cr140319_state){
try{var cr140319_place_14 = missionary.core.unpark();
var cr140319_place_15 = cljs.core.reset_BANG_;
var cr140319_place_16 = _STAR_current_ws;
var cr140319_place_17 = cr140319_place_14;
var cr140319_place_18 = (function (){var G__140363 = cr140319_place_16;
var G__140364 = cr140319_place_17;
var fexpr__140362 = cr140319_place_15;
return (fexpr__140362.cljs$core$IFn$_invoke$arity$2 ? fexpr__140362.cljs$core$IFn$_invoke$arity$2(G__140363,G__140364) : fexpr__140362.call(null,G__140363,G__140364));
})();
var cr140319_place_19 = cr140319_place_14;
(cr140319_state[(0)] = cr140319_block_7);

(cr140319_state[(1)] = cr140319_place_19);

return cr140319_state;
}catch (e140361){var cr140319_exception = e140361;
(cr140319_state[(0)] = null);

(cr140319_state[(1)] = null);

throw cr140319_exception;
}});
var cr140319_block_6 = (function frontend$worker$rtc$ws_util$cr140319_block_6(cr140319_state){
try{var cr140319_place_2 = (cr140319_state[(3)]);
var cr140319_place_20 = cr140319_place_2;
(cr140319_state[(0)] = cr140319_block_7);

(cr140319_state[(3)] = null);

(cr140319_state[(1)] = cr140319_place_20);

return cr140319_state;
}catch (e140365){var cr140319_exception = e140365;
(cr140319_state[(0)] = null);

(cr140319_state[(3)] = null);

(cr140319_state[(1)] = null);

throw cr140319_exception;
}});
var cr140319_block_7 = (function frontend$worker$rtc$ws_util$cr140319_block_7(cr140319_state){
try{var cr140319_place_12 = (cr140319_state[(1)]);
(cr140319_state[(0)] = null);

(cr140319_state[(1)] = null);

return cr140319_place_12;
}catch (e140366){var cr140319_exception = e140366;
(cr140319_state[(0)] = null);

(cr140319_state[(1)] = null);

throw cr140319_exception;
}});
return cloroutine.impl.coroutine((function (){var G__140367 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__140367[(0)] = cr140319_block_0);

return G__140367;
})());
})(),missionary.core.sp_run)], null);
}));

(frontend.worker.rtc.ws_util.gen_get_ws_create_map.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.worker.rtc.ws_util.gen_get_ws_create_map.cljs$lang$applyTo = (function (seq140311){
var G__140312 = cljs.core.first(seq140311);
var seq140311__$1 = cljs.core.next(seq140311);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__140312,seq140311__$1);
}));

/**
 * Return a memoized task to reuse the same websocket.
 */
frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized = cljs.core.memoize(frontend.worker.rtc.ws_util.gen_get_ws_create_map);

//# sourceMappingURL=frontend.worker.rtc.ws_util.js.map
