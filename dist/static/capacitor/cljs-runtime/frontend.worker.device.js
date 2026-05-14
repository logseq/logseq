goog.provide('frontend.worker.device');
var module$frontend$idbkv=shadow.js.require("module$frontend$idbkv", {});
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.device !== 'undefined') && (typeof frontend.worker.device.store !== 'undefined')){
} else {
frontend.worker.device.store = (new cljs.core.Delay((function (){
return module$frontend$idbkv.newStore("localforage","keyvaluepairs",(2));
}),null));
}
frontend.worker.device._LT_get_item = (function frontend$worker$device$_LT_get_item(key_SINGLEQUOTE_){
if(cljs.core.truth_((function (){var and__5000__auto__ = key_SINGLEQUOTE_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.deref(frontend.worker.device.store);
} else {
return and__5000__auto__;
}
})())){
return module$frontend$idbkv.get(key_SINGLEQUOTE_,cljs.core.deref(frontend.worker.device.store));
} else {
return null;
}
});
frontend.worker.device._LT_set_item_BANG_ = (function frontend$worker$device$_LT_set_item_BANG_(key_SINGLEQUOTE_,value){
if(cljs.core.truth_((function (){var and__5000__auto__ = key_SINGLEQUOTE_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.deref(frontend.worker.device.store);
} else {
return and__5000__auto__;
}
})())){
return module$frontend$idbkv.set(key_SINGLEQUOTE_,value,cljs.core.deref(frontend.worker.device.store));
} else {
return null;
}
});
frontend.worker.device._LT_remove_item_BANG_ = (function frontend$worker$device$_LT_remove_item_BANG_(key_SINGLEQUOTE_){
return module$frontend$idbkv.del(key_SINGLEQUOTE_,cljs.core.deref(frontend.worker.device.store));
});
frontend.worker.device.item_key_device_id = "device-id";
frontend.worker.device.item_key_device_name = "device-name";
frontend.worker.device.item_key_device_created_at = "device-created-at";
frontend.worker.device.item_key_device_updated_at = "device-updated-at";
frontend.worker.device.item_key_device_public_key_jwk = "device-public-key-jwk";
frontend.worker.device.item_key_device_private_key_jwk = "device-private-key-jwk";
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.device !== 'undefined') && (typeof frontend.worker.device._STAR_device_id !== 'undefined')){
} else {
frontend.worker.device._STAR_device_id = cljs.core.atom.cljs$core$IFn$_invoke$arity$variadic(null,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"validator","validator",-1966190681),cljs.core.uuid_QMARK_], 0));
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.device !== 'undefined') && (typeof frontend.worker.device._STAR_device_name !== 'undefined')){
} else {
frontend.worker.device._STAR_device_name = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.device !== 'undefined') && (typeof frontend.worker.device._STAR_device_public_key !== 'undefined')){
} else {
frontend.worker.device._STAR_device_public_key = cljs.core.atom.cljs$core$IFn$_invoke$arity$variadic(null,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"validator","validator",-1966190681),(function (p1__134126_SHARP_){
return (p1__134126_SHARP_ instanceof CryptoKey);
})], 0));
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.device !== 'undefined') && (typeof frontend.worker.device._STAR_device_private_key !== 'undefined')){
} else {
frontend.worker.device._STAR_device_private_key = cljs.core.atom.cljs$core$IFn$_invoke$arity$variadic(null,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"validator","validator",-1966190681),(function (p1__134131_SHARP_){
return (p1__134131_SHARP_ instanceof CryptoKey);
})], 0));
}
frontend.worker.device.new_task__get_user_devices = (function frontend$worker$device$new_task__get_user_devices(get_ws_create_task){
return missionary.core.join.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"devices","devices",1929380599),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.worker.rtc.ws_util.send_AMPERSAND_recv(get_ws_create_task,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"action","action",-811238024),"get-user-devices"], null))], 0));
});
frontend.worker.device.new_task__add_user_device = (function frontend$worker$device$new_task__add_user_device(get_ws_create_task,device_name){
return missionary.core.join.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"device","device",1817743352),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.worker.rtc.ws_util.send_AMPERSAND_recv(get_ws_create_task,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"action","action",-811238024),"add-user-device",new cljs.core.Keyword(null,"device-name","device-name",905058139),device_name], null))], 0));
});
frontend.worker.device.new_task__remove_user_device_STAR_ = (function frontend$worker$device$new_task__remove_user_device_STAR_(get_ws_create_task,device_uuid){
return frontend.worker.rtc.ws_util.send_AMPERSAND_recv(get_ws_create_task,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"action","action",-811238024),"remove-user-device",new cljs.core.Keyword(null,"device-uuid","device-uuid",1698539284),device_uuid], null));
});
frontend.worker.device.new_task__add_device_public_key = (function frontend$worker$device$new_task__add_device_public_key(get_ws_create_task,device_uuid,key_name,public_key_jwk){
return frontend.worker.rtc.ws_util.send_AMPERSAND_recv(get_ws_create_task,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"action","action",-811238024),"add-device-public-key",new cljs.core.Keyword(null,"device-uuid","device-uuid",1698539284),device_uuid,new cljs.core.Keyword(null,"key-name","key-name",-1128786076),key_name,new cljs.core.Keyword(null,"public-key","public-key",-2106850051),logseq.db.write_transit_str(public_key_jwk)], null));
});
frontend.worker.device.new_task__remove_device_public_key_STAR_ = (function frontend$worker$device$new_task__remove_device_public_key_STAR_(get_ws_create_task,device_uuid,key_name){
return frontend.worker.rtc.ws_util.send_AMPERSAND_recv(get_ws_create_task,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"action","action",-811238024),"remove-device-public-key",new cljs.core.Keyword(null,"device-uuid","device-uuid",1698539284),device_uuid,new cljs.core.Keyword(null,"key-name","key-name",-1128786076),key_name], null));
});
frontend.worker.device.new_task__sync_encrypted_aes_key_STAR_ = (function frontend$worker$device$new_task__sync_encrypted_aes_key_STAR_(get_ws_create_task,device_uuid__GT_encrypted_aes_key,graph_uuid){
return frontend.worker.rtc.ws_util.send_AMPERSAND_recv(get_ws_create_task,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"action","action",-811238024),"sync-encrypted-aes-key",new cljs.core.Keyword(null,"device-uuid->encrypted-aes-key","device-uuid->encrypted-aes-key",947918902),device_uuid__GT_encrypted_aes_key,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid], null));
});
frontend.worker.device.new_get_ws_create_task = (function frontend$worker$device$new_get_ws_create_task(token){
return new cljs.core.Keyword(null,"get-ws-create-task","get-ws-create-task",-1512841002).cljs$core$IFn$_invoke$arity$1(frontend.worker.rtc.ws_util.gen_get_ws_create_map__memoized(frontend.worker.rtc.ws_util.get_ws_url(token)));
});
/**
 * Generate new device items if not exists.
 *   Store in indexeddb.
 *   Import to `*device-id`, `*device-public-key`, `*device-private-key`
 */
frontend.worker.device.new_task__ensure_device_metadata_BANG_ = (function frontend$worker$device$new_task__ensure_device_metadata_BANG_(token){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr134171_block_16 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_16(cr134171_state){
try{var cr134171_place_92 = (cr134171_state[(7)]);
var cr134171_place_127 = missionary.core.unpark();
var cr134171_place_128 = frontend.common.missionary._LT__BANG_;
var cr134171_place_129 = frontend.worker.device._LT_set_item_BANG_;
var cr134171_place_130 = frontend.worker.device.item_key_device_public_key_jwk;
var cr134171_place_131 = cr134171_place_92;
var cr134171_place_132 = (function (){var G__134682 = cr134171_place_130;
var G__134683 = cr134171_place_131;
var fexpr__134681 = cr134171_place_129;
return (fexpr__134681.cljs$core$IFn$_invoke$arity$2 ? fexpr__134681.cljs$core$IFn$_invoke$arity$2(G__134682,G__134683) : fexpr__134681.call(null,G__134682,G__134683));
})();
var cr134171_place_133 = (function (){var G__134691 = cr134171_place_132;
var fexpr__134690 = cr134171_place_128;
return (fexpr__134690.cljs$core$IFn$_invoke$arity$1 ? fexpr__134690.cljs$core$IFn$_invoke$arity$1(G__134691) : fexpr__134690.call(null,G__134691));
})();
(cr134171_state[(0)] = cr134171_block_17);

return missionary.core.park(cr134171_place_133);
}catch (e134670){var cr134171_exception = e134670;
(cr134171_state[(0)] = null);

(cr134171_state[(2)] = null);

(cr134171_state[(1)] = null);

(cr134171_state[(4)] = null);

(cr134171_state[(7)] = null);

(cr134171_state[(8)] = null);

throw cr134171_exception;
}});
var cr134171_block_9 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_9(cr134171_state){
try{var cr134171_place_51 = missionary.core.unpark();
var cr134171_place_52 = cljs.core.__destructure_map;
var cr134171_place_53 = cr134171_place_51;
var cr134171_place_54 = (function (){var G__134701 = cr134171_place_53;
var fexpr__134700 = cr134171_place_52;
return (fexpr__134700.cljs$core$IFn$_invoke$arity$1 ? fexpr__134700.cljs$core$IFn$_invoke$arity$1(G__134701) : fexpr__134700.call(null,G__134701));
})();
var cr134171_place_55 = cljs.core.get;
var cr134171_place_56 = cr134171_place_54;
var cr134171_place_57 = new cljs.core.Keyword(null,"device-id","device-id",1535359525);
var cr134171_place_58 = (function (){var G__134704 = cr134171_place_56;
var G__134705 = cr134171_place_57;
var fexpr__134703 = cr134171_place_55;
return (fexpr__134703.cljs$core$IFn$_invoke$arity$2 ? fexpr__134703.cljs$core$IFn$_invoke$arity$2(G__134704,G__134705) : fexpr__134703.call(null,G__134704,G__134705));
})();
var cr134171_place_59 = cljs.core.get;
var cr134171_place_60 = cr134171_place_54;
var cr134171_place_61 = new cljs.core.Keyword(null,"device-name","device-name",905058139);
var cr134171_place_62 = (function (){var G__134707 = cr134171_place_60;
var G__134708 = cr134171_place_61;
var fexpr__134706 = cr134171_place_59;
return (fexpr__134706.cljs$core$IFn$_invoke$arity$2 ? fexpr__134706.cljs$core$IFn$_invoke$arity$2(G__134707,G__134708) : fexpr__134706.call(null,G__134707,G__134708));
})();
var cr134171_place_63 = cljs.core.get;
var cr134171_place_64 = cr134171_place_54;
var cr134171_place_65 = new cljs.core.Keyword(null,"created-at","created-at",-89248644);
var cr134171_place_66 = (function (){var G__134713 = cr134171_place_64;
var G__134714 = cr134171_place_65;
var fexpr__134712 = cr134171_place_63;
return (fexpr__134712.cljs$core$IFn$_invoke$arity$2 ? fexpr__134712.cljs$core$IFn$_invoke$arity$2(G__134713,G__134714) : fexpr__134712.call(null,G__134713,G__134714));
})();
var cr134171_place_67 = cljs.core.get;
var cr134171_place_68 = cr134171_place_54;
var cr134171_place_69 = new cljs.core.Keyword(null,"updated-at","updated-at",-1592622336);
var cr134171_place_70 = (function (){var G__134716 = cr134171_place_68;
var G__134717 = cr134171_place_69;
var fexpr__134715 = cr134171_place_67;
return (fexpr__134715.cljs$core$IFn$_invoke$arity$2 ? fexpr__134715.cljs$core$IFn$_invoke$arity$2(G__134716,G__134717) : fexpr__134715.call(null,G__134716,G__134717));
})();
var cr134171_place_71 = frontend.common.missionary._LT__BANG_;
var cr134171_place_72 = frontend.worker.crypt._LT_gen_key_pair;
var cr134171_place_73 = (function (){var fexpr__134718 = cr134171_place_72;
return (fexpr__134718.cljs$core$IFn$_invoke$arity$0 ? fexpr__134718.cljs$core$IFn$_invoke$arity$0() : fexpr__134718.call(null));
})();
var cr134171_place_74 = (function (){var G__134721 = cr134171_place_73;
var fexpr__134720 = cr134171_place_71;
return (fexpr__134720.cljs$core$IFn$_invoke$arity$1 ? fexpr__134720.cljs$core$IFn$_invoke$arity$1(G__134721) : fexpr__134720.call(null,G__134721));
})();
(cr134171_state[(0)] = cr134171_block_10);

(cr134171_state[(2)] = cr134171_place_58);

(cr134171_state[(3)] = cr134171_place_62);

(cr134171_state[(5)] = cr134171_place_66);

(cr134171_state[(6)] = cr134171_place_70);

return missionary.core.park(cr134171_place_74);
}catch (e134693){var cr134171_exception = e134693;
(cr134171_state[(0)] = null);

(cr134171_state[(1)] = null);

(cr134171_state[(4)] = null);

throw cr134171_exception;
}});
var cr134171_block_5 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_5(cr134171_state){
try{var cr134171_place_11 = (cr134171_state[(3)]);
var cr134171_place_16 = (cr134171_state[(5)]);
var cr134171_place_20 = new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252);
var cr134171_place_21 = true;
var cr134171_place_22 = (function (){var G__134727 = cr134171_place_16;
var G__134728 = cr134171_place_20;
var G__134729 = cr134171_place_21;
var fexpr__134726 = cr134171_place_11;
return (fexpr__134726.cljs$core$IFn$_invoke$arity$3 ? fexpr__134726.cljs$core$IFn$_invoke$arity$3(G__134727,G__134728,G__134729) : fexpr__134726.call(null,G__134727,G__134728,G__134729));
})();
var cr134171_place_23 = clojure.string.join;
var cr134171_place_24 = "-";
var cr134171_place_25 = new cljs.core.Keyword(null,"platform","platform",-1086422114);
var cr134171_place_26 = cr134171_place_22;
var cr134171_place_27 = cr134171_place_25.cljs$core$IFn$_invoke$arity$1(cr134171_place_26);
var cr134171_place_28 = new cljs.core.Keyword(null,"mobile","mobile",1403078170);
var cr134171_place_29 = cr134171_place_22;
var cr134171_place_30 = cr134171_place_28.cljs$core$IFn$_invoke$arity$1(cr134171_place_29);
var cr134171_place_31 = null;
if(cljs.core.truth_(cr134171_place_30)){
(cr134171_state[(0)] = cr134171_block_7);

(cr134171_state[(3)] = null);

(cr134171_state[(5)] = null);

(cr134171_state[(2)] = cr134171_place_23);

(cr134171_state[(3)] = cr134171_place_22);

(cr134171_state[(5)] = cr134171_place_24);

(cr134171_state[(6)] = cr134171_place_27);

(cr134171_state[(7)] = cr134171_place_31);

return cr134171_state;
} else {
(cr134171_state[(0)] = cr134171_block_6);

(cr134171_state[(3)] = null);

(cr134171_state[(5)] = null);

(cr134171_state[(2)] = cr134171_place_23);

(cr134171_state[(3)] = cr134171_place_22);

(cr134171_state[(5)] = cr134171_place_24);

(cr134171_state[(6)] = cr134171_place_27);

(cr134171_state[(7)] = cr134171_place_31);

return cr134171_state;
}
}catch (e134723){var cr134171_exception = e134723;
(cr134171_state[(0)] = null);

(cr134171_state[(1)] = null);

(cr134171_state[(3)] = null);

(cr134171_state[(4)] = null);

(cr134171_state[(5)] = null);

throw cr134171_exception;
}});
var cr134171_block_18 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_18(cr134171_state){
try{var cr134171_place_58 = (cr134171_state[(2)]);
var cr134171_place_10 = (cr134171_state[(4)]);
var cr134171_place_92 = (cr134171_state[(7)]);
var cr134171_place_141 = missionary.core.unpark();
var cr134171_place_142 = frontend.worker.device.new_task__add_device_public_key;
var cr134171_place_143 = cr134171_place_10;
var cr134171_place_144 = cr134171_place_58;
var cr134171_place_145 = "default-public-key";
var cr134171_place_146 = cr134171_place_92;
var cr134171_place_147 = (function (){var G__134748 = cr134171_place_143;
var G__134749 = cr134171_place_144;
var G__134750 = cr134171_place_145;
var G__134751 = cr134171_place_146;
var fexpr__134747 = cr134171_place_142;
return (fexpr__134747.cljs$core$IFn$_invoke$arity$4 ? fexpr__134747.cljs$core$IFn$_invoke$arity$4(G__134748,G__134749,G__134750,G__134751) : fexpr__134747.call(null,G__134748,G__134749,G__134750,G__134751));
})();
(cr134171_state[(0)] = cr134171_block_19);

(cr134171_state[(2)] = null);

(cr134171_state[(4)] = null);

(cr134171_state[(7)] = null);

return missionary.core.park(cr134171_place_147);
}catch (e134744){var cr134171_exception = e134744;
(cr134171_state[(0)] = null);

(cr134171_state[(2)] = null);

(cr134171_state[(1)] = null);

(cr134171_state[(4)] = null);

(cr134171_state[(7)] = null);

throw cr134171_exception;
}});
var cr134171_block_13 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_13(cr134171_state){
try{var cr134171_place_62 = (cr134171_state[(3)]);
var cr134171_place_106 = missionary.core.unpark();
var cr134171_place_107 = frontend.common.missionary._LT__BANG_;
var cr134171_place_108 = frontend.worker.device._LT_set_item_BANG_;
var cr134171_place_109 = frontend.worker.device.item_key_device_name;
var cr134171_place_110 = cr134171_place_62;
var cr134171_place_111 = (function (){var G__134763 = cr134171_place_109;
var G__134764 = cr134171_place_110;
var fexpr__134762 = cr134171_place_108;
return (fexpr__134762.cljs$core$IFn$_invoke$arity$2 ? fexpr__134762.cljs$core$IFn$_invoke$arity$2(G__134763,G__134764) : fexpr__134762.call(null,G__134763,G__134764));
})();
var cr134171_place_112 = (function (){var G__134772 = cr134171_place_111;
var fexpr__134771 = cr134171_place_107;
return (fexpr__134771.cljs$core$IFn$_invoke$arity$1 ? fexpr__134771.cljs$core$IFn$_invoke$arity$1(G__134772) : fexpr__134771.call(null,G__134772));
})();
(cr134171_state[(0)] = cr134171_block_14);

(cr134171_state[(3)] = null);

return missionary.core.park(cr134171_place_112);
}catch (e134754){var cr134171_exception = e134754;
(cr134171_state[(0)] = null);

(cr134171_state[(2)] = null);

(cr134171_state[(1)] = null);

(cr134171_state[(3)] = null);

(cr134171_state[(4)] = null);

(cr134171_state[(5)] = null);

(cr134171_state[(7)] = null);

(cr134171_state[(6)] = null);

(cr134171_state[(8)] = null);

throw cr134171_exception;
}});
var cr134171_block_10 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_10(cr134171_state){
try{var cr134171_place_75 = missionary.core.unpark();
var cr134171_place_76 = cljs.core.__destructure_map;
var cr134171_place_77 = cr134171_place_75;
var cr134171_place_78 = (function (){var G__134786 = cr134171_place_77;
var fexpr__134785 = cr134171_place_76;
return (fexpr__134785.cljs$core$IFn$_invoke$arity$1 ? fexpr__134785.cljs$core$IFn$_invoke$arity$1(G__134786) : fexpr__134785.call(null,G__134786));
})();
var cr134171_place_79 = cljs.core.get;
var cr134171_place_80 = cr134171_place_78;
var cr134171_place_81 = new cljs.core.Keyword(null,"publicKey","publicKey",1004767313);
var cr134171_place_82 = (function (){var G__134792 = cr134171_place_80;
var G__134793 = cr134171_place_81;
var fexpr__134791 = cr134171_place_79;
return (fexpr__134791.cljs$core$IFn$_invoke$arity$2 ? fexpr__134791.cljs$core$IFn$_invoke$arity$2(G__134792,G__134793) : fexpr__134791.call(null,G__134792,G__134793));
})();
var cr134171_place_83 = cljs.core.get;
var cr134171_place_84 = cr134171_place_78;
var cr134171_place_85 = new cljs.core.Keyword(null,"privateKey","privateKey",1845961641);
var cr134171_place_86 = (function (){var G__134795 = cr134171_place_84;
var G__134796 = cr134171_place_85;
var fexpr__134794 = cr134171_place_83;
return (fexpr__134794.cljs$core$IFn$_invoke$arity$2 ? fexpr__134794.cljs$core$IFn$_invoke$arity$2(G__134795,G__134796) : fexpr__134794.call(null,G__134795,G__134796));
})();
var cr134171_place_87 = frontend.common.missionary._LT__BANG_;
var cr134171_place_88 = frontend.worker.crypt._LT_export_key;
var cr134171_place_89 = cr134171_place_82;
var cr134171_place_90 = (function (){var G__134802 = cr134171_place_89;
var fexpr__134801 = cr134171_place_88;
return (fexpr__134801.cljs$core$IFn$_invoke$arity$1 ? fexpr__134801.cljs$core$IFn$_invoke$arity$1(G__134802) : fexpr__134801.call(null,G__134802));
})();
var cr134171_place_91 = (function (){var G__134805 = cr134171_place_90;
var fexpr__134803 = cr134171_place_87;
return (fexpr__134803.cljs$core$IFn$_invoke$arity$1 ? fexpr__134803.cljs$core$IFn$_invoke$arity$1(G__134805) : fexpr__134803.call(null,G__134805));
})();
(cr134171_state[(0)] = cr134171_block_11);

(cr134171_state[(7)] = cr134171_place_86);

return missionary.core.park(cr134171_place_91);
}catch (e134780){var cr134171_exception = e134780;
(cr134171_state[(0)] = null);

(cr134171_state[(2)] = null);

(cr134171_state[(1)] = null);

(cr134171_state[(3)] = null);

(cr134171_state[(4)] = null);

(cr134171_state[(5)] = null);

(cr134171_state[(6)] = null);

throw cr134171_exception;
}});
var cr134171_block_11 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_11(cr134171_state){
try{var cr134171_place_86 = (cr134171_state[(7)]);
var cr134171_place_92 = missionary.core.unpark();
var cr134171_place_93 = frontend.common.missionary._LT__BANG_;
var cr134171_place_94 = frontend.worker.crypt._LT_export_key;
var cr134171_place_95 = cr134171_place_86;
var cr134171_place_96 = (function (){var G__134812 = cr134171_place_95;
var fexpr__134811 = cr134171_place_94;
return (fexpr__134811.cljs$core$IFn$_invoke$arity$1 ? fexpr__134811.cljs$core$IFn$_invoke$arity$1(G__134812) : fexpr__134811.call(null,G__134812));
})();
var cr134171_place_97 = (function (){var G__134816 = cr134171_place_96;
var fexpr__134815 = cr134171_place_93;
return (fexpr__134815.cljs$core$IFn$_invoke$arity$1 ? fexpr__134815.cljs$core$IFn$_invoke$arity$1(G__134816) : fexpr__134815.call(null,G__134816));
})();
(cr134171_state[(0)] = cr134171_block_12);

(cr134171_state[(7)] = null);

(cr134171_state[(7)] = cr134171_place_92);

return missionary.core.park(cr134171_place_97);
}catch (e134808){var cr134171_exception = e134808;
(cr134171_state[(0)] = null);

(cr134171_state[(2)] = null);

(cr134171_state[(1)] = null);

(cr134171_state[(3)] = null);

(cr134171_state[(4)] = null);

(cr134171_state[(5)] = null);

(cr134171_state[(7)] = null);

(cr134171_state[(6)] = null);

throw cr134171_exception;
}});
var cr134171_block_22 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_22(cr134171_state){
try{var cr134171_place_158 = missionary.core.unpark();
(cr134171_state[(0)] = null);

return cr134171_place_158;
}catch (e134823){var cr134171_exception = e134823;
(cr134171_state[(0)] = null);

throw cr134171_exception;
}});
var cr134171_block_17 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_17(cr134171_state){
try{var cr134171_place_98 = (cr134171_state[(8)]);
var cr134171_place_134 = missionary.core.unpark();
var cr134171_place_135 = frontend.common.missionary._LT__BANG_;
var cr134171_place_136 = frontend.worker.device._LT_set_item_BANG_;
var cr134171_place_137 = frontend.worker.device.item_key_device_private_key_jwk;
var cr134171_place_138 = cr134171_place_98;
var cr134171_place_139 = (function (){var G__134834 = cr134171_place_137;
var G__134835 = cr134171_place_138;
var fexpr__134833 = cr134171_place_136;
return (fexpr__134833.cljs$core$IFn$_invoke$arity$2 ? fexpr__134833.cljs$core$IFn$_invoke$arity$2(G__134834,G__134835) : fexpr__134833.call(null,G__134834,G__134835));
})();
var cr134171_place_140 = (function (){var G__134840 = cr134171_place_139;
var fexpr__134839 = cr134171_place_135;
return (fexpr__134839.cljs$core$IFn$_invoke$arity$1 ? fexpr__134839.cljs$core$IFn$_invoke$arity$1(G__134840) : fexpr__134839.call(null,G__134840));
})();
(cr134171_state[(0)] = cr134171_block_18);

(cr134171_state[(8)] = null);

return missionary.core.park(cr134171_place_140);
}catch (e134828){var cr134171_exception = e134828;
(cr134171_state[(0)] = null);

(cr134171_state[(2)] = null);

(cr134171_state[(1)] = null);

(cr134171_state[(4)] = null);

(cr134171_state[(7)] = null);

(cr134171_state[(8)] = null);

throw cr134171_exception;
}});
var cr134171_block_4 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_4(cr134171_state){
try{var cr134171_place_19 = null;
(cr134171_state[(0)] = cr134171_block_5);

(cr134171_state[(5)] = cr134171_place_19);

return cr134171_state;
}catch (e134842){var cr134171_exception = e134842;
(cr134171_state[(0)] = null);

(cr134171_state[(1)] = null);

(cr134171_state[(3)] = null);

(cr134171_state[(4)] = null);

(cr134171_state[(5)] = null);

throw cr134171_exception;
}});
var cr134171_block_1 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_1(cr134171_state){
try{var cr134171_place_5 = missionary.core.unpark();
var cr134171_place_6 = cr134171_place_5;
var cr134171_place_7 = null;
if(cljs.core.truth_(cr134171_place_6)){
(cr134171_state[(0)] = cr134171_block_20);

(cr134171_state[(1)] = cr134171_place_7);

return cr134171_state;
} else {
(cr134171_state[(0)] = cr134171_block_2);

(cr134171_state[(1)] = cr134171_place_7);

return cr134171_state;
}
}catch (e134846){var cr134171_exception = e134846;
(cr134171_state[(0)] = null);

throw cr134171_exception;
}});
var cr134171_block_3 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_3(cr134171_state){
try{var cr134171_place_12 = (cr134171_state[(2)]);
var cr134171_place_17 = cr134171_place_12;
var cr134171_place_18 = cr134171_place_17.toJSON();
(cr134171_state[(0)] = cr134171_block_5);

(cr134171_state[(2)] = null);

(cr134171_state[(5)] = cr134171_place_18);

return cr134171_state;
}catch (e134848){var cr134171_exception = e134848;
(cr134171_state[(0)] = null);

(cr134171_state[(2)] = null);

(cr134171_state[(1)] = null);

(cr134171_state[(3)] = null);

(cr134171_state[(4)] = null);

(cr134171_state[(5)] = null);

throw cr134171_exception;
}});
var cr134171_block_12 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_12(cr134171_state){
try{var cr134171_place_58 = (cr134171_state[(2)]);
var cr134171_place_98 = missionary.core.unpark();
var cr134171_place_99 = frontend.common.missionary._LT__BANG_;
var cr134171_place_100 = frontend.worker.device._LT_set_item_BANG_;
var cr134171_place_101 = frontend.worker.device.item_key_device_id;
var cr134171_place_102 = cr134171_place_58;
var cr134171_place_103 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr134171_place_102);
var cr134171_place_104 = (function (){var G__134878 = cr134171_place_101;
var G__134879 = cr134171_place_103;
var fexpr__134877 = cr134171_place_100;
return (fexpr__134877.cljs$core$IFn$_invoke$arity$2 ? fexpr__134877.cljs$core$IFn$_invoke$arity$2(G__134878,G__134879) : fexpr__134877.call(null,G__134878,G__134879));
})();
var cr134171_place_105 = (function (){var G__134885 = cr134171_place_104;
var fexpr__134884 = cr134171_place_99;
return (fexpr__134884.cljs$core$IFn$_invoke$arity$1 ? fexpr__134884.cljs$core$IFn$_invoke$arity$1(G__134885) : fexpr__134884.call(null,G__134885));
})();
(cr134171_state[(0)] = cr134171_block_13);

(cr134171_state[(8)] = cr134171_place_98);

return missionary.core.park(cr134171_place_105);
}catch (e134858){var cr134171_exception = e134858;
(cr134171_state[(0)] = null);

(cr134171_state[(2)] = null);

(cr134171_state[(1)] = null);

(cr134171_state[(3)] = null);

(cr134171_state[(4)] = null);

(cr134171_state[(5)] = null);

(cr134171_state[(7)] = null);

(cr134171_state[(6)] = null);

throw cr134171_exception;
}});
var cr134171_block_0 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_0(cr134171_state){
try{var cr134171_place_0 = frontend.common.missionary._LT__BANG_;
var cr134171_place_1 = frontend.worker.device._LT_get_item;
var cr134171_place_2 = frontend.worker.device.item_key_device_id;
var cr134171_place_3 = (function (){var G__134900 = cr134171_place_2;
var fexpr__134899 = cr134171_place_1;
return (fexpr__134899.cljs$core$IFn$_invoke$arity$1 ? fexpr__134899.cljs$core$IFn$_invoke$arity$1(G__134900) : fexpr__134899.call(null,G__134900));
})();
var cr134171_place_4 = (function (){var G__134902 = cr134171_place_3;
var fexpr__134901 = cr134171_place_0;
return (fexpr__134901.cljs$core$IFn$_invoke$arity$1 ? fexpr__134901.cljs$core$IFn$_invoke$arity$1(G__134902) : fexpr__134901.call(null,G__134902));
})();
(cr134171_state[(0)] = cr134171_block_1);

return missionary.core.park(cr134171_place_4);
}catch (e134893){var cr134171_exception = e134893;
(cr134171_state[(0)] = null);

throw cr134171_exception;
}});
var cr134171_block_2 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_2(cr134171_state){
try{var cr134171_place_8 = frontend.worker.device.new_get_ws_create_task;
var cr134171_place_9 = token;
var cr134171_place_10 = (function (){var G__134907 = cr134171_place_9;
var fexpr__134906 = cr134171_place_8;
return (fexpr__134906.cljs$core$IFn$_invoke$arity$1 ? fexpr__134906.cljs$core$IFn$_invoke$arity$1(G__134907) : fexpr__134906.call(null,G__134907));
})();
var cr134171_place_11 = cljs.core.js__GT_clj;
var cr134171_place_12 = navigator.userAgentData;
var cr134171_place_13 = cr134171_place_12;
var cr134171_place_14 = null;
var cr134171_place_15 = (cr134171_place_13 == cr134171_place_14);
var cr134171_place_16 = null;
if(cr134171_place_15){
(cr134171_state[(0)] = cr134171_block_4);

(cr134171_state[(3)] = cr134171_place_11);

(cr134171_state[(4)] = cr134171_place_10);

(cr134171_state[(5)] = cr134171_place_16);

return cr134171_state;
} else {
(cr134171_state[(0)] = cr134171_block_3);

(cr134171_state[(2)] = cr134171_place_12);

(cr134171_state[(3)] = cr134171_place_11);

(cr134171_state[(4)] = cr134171_place_10);

(cr134171_state[(5)] = cr134171_place_16);

return cr134171_state;
}
}catch (e134903){var cr134171_exception = e134903;
(cr134171_state[(0)] = null);

(cr134171_state[(1)] = null);

throw cr134171_exception;
}});
var cr134171_block_15 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_15(cr134171_state){
try{var cr134171_place_70 = (cr134171_state[(6)]);
var cr134171_place_120 = missionary.core.unpark();
var cr134171_place_121 = frontend.common.missionary._LT__BANG_;
var cr134171_place_122 = frontend.worker.device._LT_set_item_BANG_;
var cr134171_place_123 = frontend.worker.device.item_key_device_updated_at;
var cr134171_place_124 = cr134171_place_70;
var cr134171_place_125 = (function (){var G__134934 = cr134171_place_123;
var G__134935 = cr134171_place_124;
var fexpr__134931 = cr134171_place_122;
return (fexpr__134931.cljs$core$IFn$_invoke$arity$2 ? fexpr__134931.cljs$core$IFn$_invoke$arity$2(G__134934,G__134935) : fexpr__134931.call(null,G__134934,G__134935));
})();
var cr134171_place_126 = (function (){var G__134937 = cr134171_place_125;
var fexpr__134936 = cr134171_place_121;
return (fexpr__134936.cljs$core$IFn$_invoke$arity$1 ? fexpr__134936.cljs$core$IFn$_invoke$arity$1(G__134937) : fexpr__134936.call(null,G__134937));
})();
(cr134171_state[(0)] = cr134171_block_16);

(cr134171_state[(6)] = null);

return missionary.core.park(cr134171_place_126);
}catch (e134919){var cr134171_exception = e134919;
(cr134171_state[(0)] = null);

(cr134171_state[(2)] = null);

(cr134171_state[(1)] = null);

(cr134171_state[(4)] = null);

(cr134171_state[(7)] = null);

(cr134171_state[(6)] = null);

(cr134171_state[(8)] = null);

throw cr134171_exception;
}});
var cr134171_block_6 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_6(cr134171_state){
try{var cr134171_place_32 = null;
(cr134171_state[(0)] = cr134171_block_8);

(cr134171_state[(7)] = cr134171_place_32);

return cr134171_state;
}catch (e134942){var cr134171_exception = e134942;
(cr134171_state[(0)] = null);

(cr134171_state[(2)] = null);

(cr134171_state[(1)] = null);

(cr134171_state[(3)] = null);

(cr134171_state[(5)] = null);

(cr134171_state[(6)] = null);

(cr134171_state[(4)] = null);

(cr134171_state[(7)] = null);

throw cr134171_exception;
}});
var cr134171_block_21 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_21(cr134171_state){
try{var cr134171_place_7 = (cr134171_state[(1)]);
var cr134171_place_150 = frontend.common.missionary._LT__BANG_;
var cr134171_place_151 = promesa.protocols._mcat;
var cr134171_place_152 = promesa.protocols._promise;
var cr134171_place_153 = null;
var cr134171_place_154 = (function (){var G__134969 = cr134171_place_153;
var fexpr__134968 = cr134171_place_152;
return (fexpr__134968.cljs$core$IFn$_invoke$arity$1 ? fexpr__134968.cljs$core$IFn$_invoke$arity$1(G__134969) : fexpr__134968.call(null,G__134969));
})();
var cr134171_place_155 = (function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.device._LT_get_item(frontend.worker.device.item_key_device_id)),(function (device_uuid_str){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.device._LT_get_item(frontend.worker.device.item_key_device_name)),(function (device_name){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.device._LT_get_item(frontend.worker.device.item_key_device_public_key_jwk)),(function (device_public_key_jwk){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.crypt._LT_import_public_key(device_public_key_jwk)),(function (device_public_key){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.device._LT_get_item(frontend.worker.device.item_key_device_private_key_jwk)),(function (device_private_key_jwk){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.crypt._LT_import_private_key(device_private_key_jwk)),(function (device_private_key){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(frontend.worker.device._STAR_device_id,cljs.core.uuid(device_uuid_str))),(function (___48186__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(frontend.worker.device._STAR_device_name,device_name)),(function (___48186__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(frontend.worker.device._STAR_device_public_key,device_public_key)),(function (___48186__auto____$2){
return promesa.protocols._promise(cljs.core.reset_BANG_(frontend.worker.device._STAR_device_private_key,device_private_key));
}));
}));
}));
}));
}));
}));
}));
}));
}));
});
var cr134171_place_156 = (function (){var G__134991 = cr134171_place_154;
var G__134992 = cr134171_place_155;
var fexpr__134990 = cr134171_place_151;
return (fexpr__134990.cljs$core$IFn$_invoke$arity$2 ? fexpr__134990.cljs$core$IFn$_invoke$arity$2(G__134991,G__134992) : fexpr__134990.call(null,G__134991,G__134992));
})();
var cr134171_place_157 = (function (){var G__134998 = cr134171_place_156;
var fexpr__134997 = cr134171_place_150;
return (fexpr__134997.cljs$core$IFn$_invoke$arity$1 ? fexpr__134997.cljs$core$IFn$_invoke$arity$1(G__134998) : fexpr__134997.call(null,G__134998));
})();
(cr134171_state[(0)] = cr134171_block_22);

(cr134171_state[(1)] = null);

return missionary.core.park(cr134171_place_157);
}catch (e134958){var cr134171_exception = e134958;
(cr134171_state[(0)] = null);

(cr134171_state[(1)] = null);

throw cr134171_exception;
}});
var cr134171_block_8 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_8(cr134171_state){
try{var cr134171_place_23 = (cr134171_state[(2)]);
var cr134171_place_22 = (cr134171_state[(3)]);
var cr134171_place_24 = (cr134171_state[(5)]);
var cr134171_place_27 = (cr134171_state[(6)]);
var cr134171_place_10 = (cr134171_state[(4)]);
var cr134171_place_31 = (cr134171_state[(7)]);
var cr134171_place_34 = new cljs.core.Keyword(null,"brand","brand",557863343);
var cr134171_place_35 = cljs.core.first;
var cr134171_place_36 = new cljs.core.Keyword(null,"brands","brands",1977379295);
var cr134171_place_37 = cr134171_place_22;
var cr134171_place_38 = cr134171_place_36.cljs$core$IFn$_invoke$arity$1(cr134171_place_37);
var cr134171_place_39 = (function (){var G__135015 = cr134171_place_38;
var fexpr__135014 = cr134171_place_35;
return (fexpr__135014.cljs$core$IFn$_invoke$arity$1 ? fexpr__135014.cljs$core$IFn$_invoke$arity$1(G__135015) : fexpr__135014.call(null,G__135015));
})();
var cr134171_place_40 = cr134171_place_34.cljs$core$IFn$_invoke$arity$1(cr134171_place_39);
var cr134171_place_41 = cljs_time.coerce.to_epoch;
var cr134171_place_42 = cljs_time.core.now;
var cr134171_place_43 = (function (){var fexpr__135021 = cr134171_place_42;
return (fexpr__135021.cljs$core$IFn$_invoke$arity$0 ? fexpr__135021.cljs$core$IFn$_invoke$arity$0() : fexpr__135021.call(null));
})();
var cr134171_place_44 = (function (){var G__135025 = cr134171_place_43;
var fexpr__135024 = cr134171_place_41;
return (fexpr__135024.cljs$core$IFn$_invoke$arity$1 ? fexpr__135024.cljs$core$IFn$_invoke$arity$1(G__135025) : fexpr__135024.call(null,G__135025));
})();
var cr134171_place_45 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr134171_place_27,cr134171_place_31,cr134171_place_40,cr134171_place_44], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr134171_place_46 = (function (){var G__135034 = cr134171_place_24;
var G__135035 = cr134171_place_45;
var fexpr__135033 = cr134171_place_23;
return (fexpr__135033.cljs$core$IFn$_invoke$arity$2 ? fexpr__135033.cljs$core$IFn$_invoke$arity$2(G__135034,G__135035) : fexpr__135033.call(null,G__135034,G__135035));
})();
var cr134171_place_47 = frontend.worker.device.new_task__add_user_device;
var cr134171_place_48 = cr134171_place_10;
var cr134171_place_49 = cr134171_place_46;
var cr134171_place_50 = (function (){var G__135042 = cr134171_place_48;
var G__135043 = cr134171_place_49;
var fexpr__135041 = cr134171_place_47;
return (fexpr__135041.cljs$core$IFn$_invoke$arity$2 ? fexpr__135041.cljs$core$IFn$_invoke$arity$2(G__135042,G__135043) : fexpr__135041.call(null,G__135042,G__135043));
})();
(cr134171_state[(0)] = cr134171_block_9);

(cr134171_state[(2)] = null);

(cr134171_state[(3)] = null);

(cr134171_state[(5)] = null);

(cr134171_state[(6)] = null);

(cr134171_state[(7)] = null);

return missionary.core.park(cr134171_place_50);
}catch (e135002){var cr134171_exception = e135002;
(cr134171_state[(0)] = null);

(cr134171_state[(2)] = null);

(cr134171_state[(1)] = null);

(cr134171_state[(3)] = null);

(cr134171_state[(5)] = null);

(cr134171_state[(6)] = null);

(cr134171_state[(4)] = null);

(cr134171_state[(7)] = null);

throw cr134171_exception;
}});
var cr134171_block_19 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_19(cr134171_state){
try{var cr134171_place_148 = missionary.core.unpark();
(cr134171_state[(0)] = cr134171_block_21);

(cr134171_state[(1)] = cr134171_place_148);

return cr134171_state;
}catch (e135056){var cr134171_exception = e135056;
(cr134171_state[(0)] = null);

(cr134171_state[(1)] = null);

throw cr134171_exception;
}});
var cr134171_block_7 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_7(cr134171_state){
try{var cr134171_place_33 = "mobile";
(cr134171_state[(0)] = cr134171_block_8);

(cr134171_state[(7)] = cr134171_place_33);

return cr134171_state;
}catch (e135067){var cr134171_exception = e135067;
(cr134171_state[(0)] = null);

(cr134171_state[(2)] = null);

(cr134171_state[(1)] = null);

(cr134171_state[(3)] = null);

(cr134171_state[(5)] = null);

(cr134171_state[(6)] = null);

(cr134171_state[(4)] = null);

(cr134171_state[(7)] = null);

throw cr134171_exception;
}});
var cr134171_block_20 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_20(cr134171_state){
try{var cr134171_place_149 = null;
(cr134171_state[(0)] = cr134171_block_21);

(cr134171_state[(1)] = cr134171_place_149);

return cr134171_state;
}catch (e135071){var cr134171_exception = e135071;
(cr134171_state[(0)] = null);

(cr134171_state[(1)] = null);

throw cr134171_exception;
}});
var cr134171_block_14 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr134171_block_14(cr134171_state){
try{var cr134171_place_66 = (cr134171_state[(5)]);
var cr134171_place_113 = missionary.core.unpark();
var cr134171_place_114 = frontend.common.missionary._LT__BANG_;
var cr134171_place_115 = frontend.worker.device._LT_set_item_BANG_;
var cr134171_place_116 = frontend.worker.device.item_key_device_created_at;
var cr134171_place_117 = cr134171_place_66;
var cr134171_place_118 = (function (){var G__135083 = cr134171_place_116;
var G__135084 = cr134171_place_117;
var fexpr__135082 = cr134171_place_115;
return (fexpr__135082.cljs$core$IFn$_invoke$arity$2 ? fexpr__135082.cljs$core$IFn$_invoke$arity$2(G__135083,G__135084) : fexpr__135082.call(null,G__135083,G__135084));
})();
var cr134171_place_119 = (function (){var G__135089 = cr134171_place_118;
var fexpr__135088 = cr134171_place_114;
return (fexpr__135088.cljs$core$IFn$_invoke$arity$1 ? fexpr__135088.cljs$core$IFn$_invoke$arity$1(G__135089) : fexpr__135088.call(null,G__135089));
})();
(cr134171_state[(0)] = cr134171_block_15);

(cr134171_state[(5)] = null);

return missionary.core.park(cr134171_place_119);
}catch (e135077){var cr134171_exception = e135077;
(cr134171_state[(0)] = null);

(cr134171_state[(2)] = null);

(cr134171_state[(1)] = null);

(cr134171_state[(4)] = null);

(cr134171_state[(5)] = null);

(cr134171_state[(7)] = null);

(cr134171_state[(6)] = null);

(cr134171_state[(8)] = null);

throw cr134171_exception;
}});
return cloroutine.impl.coroutine((function (){var G__135092 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((9));
(G__135092[(0)] = cr134171_block_0);

return G__135092;
})());
})(),missionary.core.sp_run);
});
/**
 * Return device list.
 *   Also sync local device metadata to remote if not exists in remote side
 */
frontend.worker.device.new_task__list_devices = (function frontend$worker$device$new_task__list_devices(token){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr135103_block_19 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_19(cr135103_state){
try{var cr135103_place_72 = missionary.core.unpark();
(cr135103_state[(0)] = cr135103_block_20);

(cr135103_state[(2)] = cr135103_place_72);

return cr135103_state;
}catch (e135448){var cr135103_exception = e135448;
(cr135103_state[(0)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(2)] = null);

throw cr135103_exception;
}});
var cr135103_block_7 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_7(cr135103_state){
try{var cr135103_place_6 = (cr135103_state[(1)]);
var cr135103_place_25 = cljs.core.not;
var cr135103_place_26 = cljs.core.some;
var cr135103_place_27 = (function (device){
var map__135128 = device;
var map__135128__$1 = cljs.core.__destructure_map(map__135128);
var device_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135128__$1,new cljs.core.Keyword(null,"device-id","device-id",1535359525));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(device_id,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.worker.device._STAR_device_id)))){
return true;
} else {
return null;
}
});
var cr135103_place_28 = cr135103_place_6;
var cr135103_place_29 = (function (){var G__135460 = cr135103_place_27;
var G__135461 = cr135103_place_28;
var fexpr__135459 = cr135103_place_26;
return (fexpr__135459.cljs$core$IFn$_invoke$arity$2 ? fexpr__135459.cljs$core$IFn$_invoke$arity$2(G__135460,G__135461) : fexpr__135459.call(null,G__135460,G__135461));
})();
var cr135103_place_30 = (function (){var G__135465 = cr135103_place_29;
var fexpr__135464 = cr135103_place_25;
return (fexpr__135464.cljs$core$IFn$_invoke$arity$1 ? fexpr__135464.cljs$core$IFn$_invoke$arity$1(G__135465) : fexpr__135464.call(null,G__135465));
})();
(cr135103_state[(0)] = cr135103_block_8);

(cr135103_state[(2)] = cr135103_place_30);

return cr135103_state;
}catch (e135454){var cr135103_exception = e135454;
(cr135103_state[(0)] = null);

(cr135103_state[(2)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(4)] = null);

(cr135103_state[(3)] = null);

throw cr135103_exception;
}});
var cr135103_block_6 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_6(cr135103_state){
try{var cr135103_place_21 = (cr135103_state[(5)]);
var cr135103_place_24 = cr135103_place_21;
(cr135103_state[(0)] = cr135103_block_8);

(cr135103_state[(5)] = null);

(cr135103_state[(2)] = cr135103_place_24);

return cr135103_state;
}catch (e135469){var cr135103_exception = e135469;
(cr135103_state[(0)] = null);

(cr135103_state[(2)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(5)] = null);

(cr135103_state[(4)] = null);

(cr135103_state[(3)] = null);

throw cr135103_exception;
}});
var cr135103_block_13 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_13(cr135103_state){
try{var cr135103_place_38 = missionary.core.unpark();
var cr135103_place_39 = frontend.common.missionary._LT__BANG_;
var cr135103_place_40 = frontend.worker.device._LT_remove_item_BANG_;
var cr135103_place_41 = frontend.worker.device.item_key_device_name;
var cr135103_place_42 = (function (){var G__135482 = cr135103_place_41;
var fexpr__135481 = cr135103_place_40;
return (fexpr__135481.cljs$core$IFn$_invoke$arity$1 ? fexpr__135481.cljs$core$IFn$_invoke$arity$1(G__135482) : fexpr__135481.call(null,G__135482));
})();
var cr135103_place_43 = (function (){var G__135484 = cr135103_place_42;
var fexpr__135483 = cr135103_place_39;
return (fexpr__135483.cljs$core$IFn$_invoke$arity$1 ? fexpr__135483.cljs$core$IFn$_invoke$arity$1(G__135484) : fexpr__135483.call(null,G__135484));
})();
(cr135103_state[(0)] = cr135103_block_14);

return missionary.core.park(cr135103_place_43);
}catch (e135475){var cr135103_exception = e135475;
(cr135103_state[(0)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(2)] = null);

throw cr135103_exception;
}});
var cr135103_block_12 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_12(cr135103_state){
try{var cr135103_place_33 = frontend.common.missionary._LT__BANG_;
var cr135103_place_34 = frontend.worker.device._LT_remove_item_BANG_;
var cr135103_place_35 = frontend.worker.device.item_key_device_id;
var cr135103_place_36 = (function (){var G__135492 = cr135103_place_35;
var fexpr__135491 = cr135103_place_34;
return (fexpr__135491.cljs$core$IFn$_invoke$arity$1 ? fexpr__135491.cljs$core$IFn$_invoke$arity$1(G__135492) : fexpr__135491.call(null,G__135492));
})();
var cr135103_place_37 = (function (){var G__135499 = cr135103_place_36;
var fexpr__135497 = cr135103_place_33;
return (fexpr__135497.cljs$core$IFn$_invoke$arity$1 ? fexpr__135497.cljs$core$IFn$_invoke$arity$1(G__135499) : fexpr__135497.call(null,G__135499));
})();
(cr135103_state[(0)] = cr135103_block_13);

return missionary.core.park(cr135103_place_37);
}catch (e135486){var cr135103_exception = e135486;
(cr135103_state[(0)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(2)] = null);

throw cr135103_exception;
}});
var cr135103_block_2 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_2(cr135103_state){
try{var cr135103_place_9 = (cr135103_state[(2)]);
var cr135103_place_12 = cr135103_place_9;
(cr135103_state[(0)] = cr135103_block_10);

(cr135103_state[(2)] = null);

(cr135103_state[(3)] = cr135103_place_12);

return cr135103_state;
}catch (e135503){var cr135103_exception = e135503;
(cr135103_state[(0)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(2)] = null);

(cr135103_state[(3)] = null);

throw cr135103_exception;
}});
var cr135103_block_0 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_0(cr135103_state){
try{var cr135103_place_0 = frontend.worker.device.new_get_ws_create_task;
var cr135103_place_1 = token;
var cr135103_place_2 = (function (){var G__135506 = cr135103_place_1;
var fexpr__135505 = cr135103_place_0;
return (fexpr__135505.cljs$core$IFn$_invoke$arity$1 ? fexpr__135505.cljs$core$IFn$_invoke$arity$1(G__135506) : fexpr__135505.call(null,G__135506));
})();
var cr135103_place_3 = frontend.worker.device.new_task__get_user_devices;
var cr135103_place_4 = cr135103_place_2;
var cr135103_place_5 = (function (){var G__135508 = cr135103_place_4;
var fexpr__135507 = cr135103_place_3;
return (fexpr__135507.cljs$core$IFn$_invoke$arity$1 ? fexpr__135507.cljs$core$IFn$_invoke$arity$1(G__135508) : fexpr__135507.call(null,G__135508));
})();
(cr135103_state[(0)] = cr135103_block_1);

return missionary.core.park(cr135103_place_5);
}catch (e135504){var cr135103_exception = e135504;
(cr135103_state[(0)] = null);

throw cr135103_exception;
}});
var cr135103_block_18 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_18(cr135103_state){
try{var cr135103_place_68 = missionary.core.unpark();
var cr135103_place_69 = frontend.worker.device.new_task__ensure_device_metadata_BANG_;
var cr135103_place_70 = token;
var cr135103_place_71 = (function (){var G__135512 = cr135103_place_70;
var fexpr__135511 = cr135103_place_69;
return (fexpr__135511.cljs$core$IFn$_invoke$arity$1 ? fexpr__135511.cljs$core$IFn$_invoke$arity$1(G__135512) : fexpr__135511.call(null,G__135512));
})();
(cr135103_state[(0)] = cr135103_block_19);

return missionary.core.park(cr135103_place_71);
}catch (e135510){var cr135103_exception = e135510;
(cr135103_state[(0)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(2)] = null);

throw cr135103_exception;
}});
var cr135103_block_8 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_8(cr135103_state){
try{var cr135103_place_23 = (cr135103_state[(2)]);
(cr135103_state[(0)] = cr135103_block_9);

(cr135103_state[(2)] = null);

(cr135103_state[(4)] = cr135103_place_23);

return cr135103_state;
}catch (e135513){var cr135103_exception = e135513;
(cr135103_state[(0)] = null);

(cr135103_state[(2)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(4)] = null);

(cr135103_state[(3)] = null);

throw cr135103_exception;
}});
var cr135103_block_20 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_20(cr135103_state){
try{var cr135103_place_6 = (cr135103_state[(1)]);
var cr135103_place_31 = (cr135103_state[(2)]);
var cr135103_place_73 = cr135103_place_6;
(cr135103_state[(0)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(2)] = null);

return cr135103_place_73;
}catch (e135521){var cr135103_exception = e135521;
(cr135103_state[(0)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(2)] = null);

throw cr135103_exception;
}});
var cr135103_block_5 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_5(cr135103_state){
try{var cr135103_place_19 = cljs.core.deref;
var cr135103_place_20 = frontend.worker.device._STAR_device_public_key;
var cr135103_place_21 = (function (){var G__135524 = cr135103_place_20;
var fexpr__135523 = cr135103_place_19;
return (fexpr__135523.cljs$core$IFn$_invoke$arity$1 ? fexpr__135523.cljs$core$IFn$_invoke$arity$1(G__135524) : fexpr__135523.call(null,G__135524));
})();
var cr135103_place_22 = cr135103_place_21;
var cr135103_place_23 = null;
if(cljs.core.truth_(cr135103_place_22)){
(cr135103_state[(0)] = cr135103_block_7);

(cr135103_state[(2)] = cr135103_place_23);

return cr135103_state;
} else {
(cr135103_state[(0)] = cr135103_block_6);

(cr135103_state[(5)] = cr135103_place_21);

(cr135103_state[(2)] = cr135103_place_23);

return cr135103_state;
}
}catch (e135522){var cr135103_exception = e135522;
(cr135103_state[(0)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(4)] = null);

(cr135103_state[(3)] = null);

throw cr135103_exception;
}});
var cr135103_block_10 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_10(cr135103_state){
try{var cr135103_place_11 = (cr135103_state[(3)]);
var cr135103_place_31 = null;
if(cljs.core.truth_(cr135103_place_11)){
(cr135103_state[(0)] = cr135103_block_12);

(cr135103_state[(3)] = null);

(cr135103_state[(2)] = cr135103_place_31);

return cr135103_state;
} else {
(cr135103_state[(0)] = cr135103_block_11);

(cr135103_state[(3)] = null);

(cr135103_state[(2)] = cr135103_place_31);

return cr135103_state;
}
}catch (e135525){var cr135103_exception = e135525;
(cr135103_state[(0)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(3)] = null);

throw cr135103_exception;
}});
var cr135103_block_1 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_1(cr135103_state){
try{var cr135103_place_6 = missionary.core.unpark();
var cr135103_place_7 = cljs.core.deref;
var cr135103_place_8 = frontend.worker.device._STAR_device_id;
var cr135103_place_9 = (function (){var G__135541 = cr135103_place_8;
var fexpr__135540 = cr135103_place_7;
return (fexpr__135540.cljs$core$IFn$_invoke$arity$1 ? fexpr__135540.cljs$core$IFn$_invoke$arity$1(G__135541) : fexpr__135540.call(null,G__135541));
})();
var cr135103_place_10 = cr135103_place_9;
var cr135103_place_11 = null;
if(cljs.core.truth_(cr135103_place_10)){
(cr135103_state[(0)] = cr135103_block_3);

(cr135103_state[(1)] = cr135103_place_6);

(cr135103_state[(3)] = cr135103_place_11);

return cr135103_state;
} else {
(cr135103_state[(0)] = cr135103_block_2);

(cr135103_state[(1)] = cr135103_place_6);

(cr135103_state[(2)] = cr135103_place_9);

(cr135103_state[(3)] = cr135103_place_11);

return cr135103_state;
}
}catch (e135535){var cr135103_exception = e135535;
(cr135103_state[(0)] = null);

throw cr135103_exception;
}});
var cr135103_block_14 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_14(cr135103_state){
try{var cr135103_place_44 = missionary.core.unpark();
var cr135103_place_45 = frontend.common.missionary._LT__BANG_;
var cr135103_place_46 = frontend.worker.device._LT_remove_item_BANG_;
var cr135103_place_47 = frontend.worker.device.item_key_device_created_at;
var cr135103_place_48 = (function (){var G__135560 = cr135103_place_47;
var fexpr__135559 = cr135103_place_46;
return (fexpr__135559.cljs$core$IFn$_invoke$arity$1 ? fexpr__135559.cljs$core$IFn$_invoke$arity$1(G__135560) : fexpr__135559.call(null,G__135560));
})();
var cr135103_place_49 = (function (){var G__135562 = cr135103_place_48;
var fexpr__135561 = cr135103_place_45;
return (fexpr__135561.cljs$core$IFn$_invoke$arity$1 ? fexpr__135561.cljs$core$IFn$_invoke$arity$1(G__135562) : fexpr__135561.call(null,G__135562));
})();
(cr135103_state[(0)] = cr135103_block_15);

return missionary.core.park(cr135103_place_49);
}catch (e135554){var cr135103_exception = e135554;
(cr135103_state[(0)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(2)] = null);

throw cr135103_exception;
}});
var cr135103_block_15 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_15(cr135103_state){
try{var cr135103_place_50 = missionary.core.unpark();
var cr135103_place_51 = frontend.common.missionary._LT__BANG_;
var cr135103_place_52 = frontend.worker.device._LT_remove_item_BANG_;
var cr135103_place_53 = frontend.worker.device.item_key_device_updated_at;
var cr135103_place_54 = (function (){var G__135581 = cr135103_place_53;
var fexpr__135580 = cr135103_place_52;
return (fexpr__135580.cljs$core$IFn$_invoke$arity$1 ? fexpr__135580.cljs$core$IFn$_invoke$arity$1(G__135581) : fexpr__135580.call(null,G__135581));
})();
var cr135103_place_55 = (function (){var G__135585 = cr135103_place_54;
var fexpr__135584 = cr135103_place_51;
return (fexpr__135584.cljs$core$IFn$_invoke$arity$1 ? fexpr__135584.cljs$core$IFn$_invoke$arity$1(G__135585) : fexpr__135584.call(null,G__135585));
})();
(cr135103_state[(0)] = cr135103_block_16);

return missionary.core.park(cr135103_place_55);
}catch (e135564){var cr135103_exception = e135564;
(cr135103_state[(0)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(2)] = null);

throw cr135103_exception;
}});
var cr135103_block_3 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_3(cr135103_state){
try{var cr135103_place_13 = cljs.core.deref;
var cr135103_place_14 = frontend.worker.device._STAR_device_name;
var cr135103_place_15 = (function (){var G__135592 = cr135103_place_14;
var fexpr__135591 = cr135103_place_13;
return (fexpr__135591.cljs$core$IFn$_invoke$arity$1 ? fexpr__135591.cljs$core$IFn$_invoke$arity$1(G__135592) : fexpr__135591.call(null,G__135592));
})();
var cr135103_place_16 = cr135103_place_15;
var cr135103_place_17 = null;
if(cljs.core.truth_(cr135103_place_16)){
(cr135103_state[(0)] = cr135103_block_5);

(cr135103_state[(4)] = cr135103_place_17);

return cr135103_state;
} else {
(cr135103_state[(0)] = cr135103_block_4);

(cr135103_state[(2)] = cr135103_place_15);

(cr135103_state[(4)] = cr135103_place_17);

return cr135103_state;
}
}catch (e135587){var cr135103_exception = e135587;
(cr135103_state[(0)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(3)] = null);

throw cr135103_exception;
}});
var cr135103_block_17 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_17(cr135103_state){
try{var cr135103_place_62 = missionary.core.unpark();
var cr135103_place_63 = frontend.common.missionary._LT__BANG_;
var cr135103_place_64 = frontend.worker.device._LT_remove_item_BANG_;
var cr135103_place_65 = frontend.worker.device.item_key_device_private_key_jwk;
var cr135103_place_66 = (function (){var G__135602 = cr135103_place_65;
var fexpr__135601 = cr135103_place_64;
return (fexpr__135601.cljs$core$IFn$_invoke$arity$1 ? fexpr__135601.cljs$core$IFn$_invoke$arity$1(G__135602) : fexpr__135601.call(null,G__135602));
})();
var cr135103_place_67 = (function (){var G__135604 = cr135103_place_66;
var fexpr__135603 = cr135103_place_63;
return (fexpr__135603.cljs$core$IFn$_invoke$arity$1 ? fexpr__135603.cljs$core$IFn$_invoke$arity$1(G__135604) : fexpr__135603.call(null,G__135604));
})();
(cr135103_state[(0)] = cr135103_block_18);

return missionary.core.park(cr135103_place_67);
}catch (e135597){var cr135103_exception = e135597;
(cr135103_state[(0)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(2)] = null);

throw cr135103_exception;
}});
var cr135103_block_4 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_4(cr135103_state){
try{var cr135103_place_15 = (cr135103_state[(2)]);
var cr135103_place_18 = cr135103_place_15;
(cr135103_state[(0)] = cr135103_block_9);

(cr135103_state[(2)] = null);

(cr135103_state[(4)] = cr135103_place_18);

return cr135103_state;
}catch (e135609){var cr135103_exception = e135609;
(cr135103_state[(0)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(2)] = null);

(cr135103_state[(4)] = null);

(cr135103_state[(3)] = null);

throw cr135103_exception;
}});
var cr135103_block_9 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_9(cr135103_state){
try{var cr135103_place_17 = (cr135103_state[(4)]);
(cr135103_state[(0)] = cr135103_block_10);

(cr135103_state[(4)] = null);

(cr135103_state[(3)] = cr135103_place_17);

return cr135103_state;
}catch (e135616){var cr135103_exception = e135616;
(cr135103_state[(0)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(4)] = null);

(cr135103_state[(3)] = null);

throw cr135103_exception;
}});
var cr135103_block_11 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_11(cr135103_state){
try{var cr135103_place_32 = null;
(cr135103_state[(0)] = cr135103_block_20);

(cr135103_state[(2)] = cr135103_place_32);

return cr135103_state;
}catch (e135619){var cr135103_exception = e135619;
(cr135103_state[(0)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(2)] = null);

throw cr135103_exception;
}});
var cr135103_block_16 = (function frontend$worker$device$new_task__list_devices_$_cr135103_block_16(cr135103_state){
try{var cr135103_place_56 = missionary.core.unpark();
var cr135103_place_57 = frontend.common.missionary._LT__BANG_;
var cr135103_place_58 = frontend.worker.device._LT_remove_item_BANG_;
var cr135103_place_59 = frontend.worker.device.item_key_device_public_key_jwk;
var cr135103_place_60 = (function (){var G__135625 = cr135103_place_59;
var fexpr__135624 = cr135103_place_58;
return (fexpr__135624.cljs$core$IFn$_invoke$arity$1 ? fexpr__135624.cljs$core$IFn$_invoke$arity$1(G__135625) : fexpr__135624.call(null,G__135625));
})();
var cr135103_place_61 = (function (){var G__135628 = cr135103_place_60;
var fexpr__135627 = cr135103_place_57;
return (fexpr__135627.cljs$core$IFn$_invoke$arity$1 ? fexpr__135627.cljs$core$IFn$_invoke$arity$1(G__135628) : fexpr__135627.call(null,G__135628));
})();
(cr135103_state[(0)] = cr135103_block_17);

return missionary.core.park(cr135103_place_61);
}catch (e135622){var cr135103_exception = e135622;
(cr135103_state[(0)] = null);

(cr135103_state[(1)] = null);

(cr135103_state[(2)] = null);

throw cr135103_exception;
}});
return cloroutine.impl.coroutine((function (){var G__135632 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((6));
(G__135632[(0)] = cr135103_block_0);

return G__135632;
})());
})(),missionary.core.sp_run);
});
frontend.worker.device.new_task__remove_device_public_key = (function frontend$worker$device$new_task__remove_device_public_key(token,device_uuid,key_name){
if((!((key_name == null)))){
} else {
throw (new Error("Assert failed: (some? key-name)"));
}

return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr135646_block_0 = (function frontend$worker$device$new_task__remove_device_public_key_$_cr135646_block_0(cr135646_state){
try{var cr135646_place_0 = device_uuid;
var cr135646_place_1 = device_uuid;
var cr135646_place_2 = typeof cr135646_place_1 === 'string';
var cr135646_place_3 = null;
if(cr135646_place_2){
(cr135646_state[(0)] = cr135646_block_2);

(cr135646_state[(1)] = cr135646_place_0);

(cr135646_state[(2)] = cr135646_place_3);

return cr135646_state;
} else {
(cr135646_state[(0)] = cr135646_block_1);

(cr135646_state[(1)] = cr135646_place_0);

(cr135646_state[(2)] = cr135646_place_3);

return cr135646_state;
}
}catch (e135710){var cr135646_exception = e135710;
(cr135646_state[(0)] = null);

throw cr135646_exception;
}});
var cr135646_block_1 = (function frontend$worker$device$new_task__remove_device_public_key_$_cr135646_block_1(cr135646_state){
try{var cr135646_place_0 = (cr135646_state[(1)]);
var cr135646_place_4 = cr135646_place_0;
(cr135646_state[(0)] = cr135646_block_3);

(cr135646_state[(1)] = null);

(cr135646_state[(2)] = cr135646_place_4);

return cr135646_state;
}catch (e135712){var cr135646_exception = e135712;
(cr135646_state[(0)] = null);

(cr135646_state[(1)] = null);

(cr135646_state[(2)] = null);

throw cr135646_exception;
}});
var cr135646_block_2 = (function frontend$worker$device$new_task__remove_device_public_key_$_cr135646_block_2(cr135646_state){
try{var cr135646_place_0 = (cr135646_state[(1)]);
var cr135646_place_5 = cljs.core.parse_uuid;
var cr135646_place_6 = cr135646_place_0;
var cr135646_place_7 = (function (){var G__135722 = cr135646_place_6;
var fexpr__135721 = cr135646_place_5;
return (fexpr__135721.cljs$core$IFn$_invoke$arity$1 ? fexpr__135721.cljs$core$IFn$_invoke$arity$1(G__135722) : fexpr__135721.call(null,G__135722));
})();
(cr135646_state[(0)] = cr135646_block_3);

(cr135646_state[(1)] = null);

(cr135646_state[(2)] = cr135646_place_7);

return cr135646_state;
}catch (e135716){var cr135646_exception = e135716;
(cr135646_state[(0)] = null);

(cr135646_state[(1)] = null);

(cr135646_state[(2)] = null);

throw cr135646_exception;
}});
var cr135646_block_3 = (function frontend$worker$device$new_task__remove_device_public_key_$_cr135646_block_3(cr135646_state){
try{var cr135646_place_3 = (cr135646_state[(2)]);
var cr135646_place_8 = cr135646_place_3;
var cr135646_place_9 = null;
if(cljs.core.truth_(cr135646_place_8)){
(cr135646_state[(0)] = cr135646_block_5);

(cr135646_state[(1)] = cr135646_place_9);

return cr135646_state;
} else {
(cr135646_state[(0)] = cr135646_block_4);

(cr135646_state[(2)] = null);

(cr135646_state[(1)] = cr135646_place_9);

return cr135646_state;
}
}catch (e135727){var cr135646_exception = e135727;
(cr135646_state[(0)] = null);

(cr135646_state[(2)] = null);

throw cr135646_exception;
}});
var cr135646_block_4 = (function frontend$worker$device$new_task__remove_device_public_key_$_cr135646_block_4(cr135646_state){
try{var cr135646_place_10 = null;
(cr135646_state[(0)] = cr135646_block_7);

(cr135646_state[(1)] = cr135646_place_10);

return cr135646_state;
}catch (e135738){var cr135646_exception = e135738;
(cr135646_state[(0)] = null);

(cr135646_state[(1)] = null);

throw cr135646_exception;
}});
var cr135646_block_5 = (function frontend$worker$device$new_task__remove_device_public_key_$_cr135646_block_5(cr135646_state){
try{var cr135646_place_3 = (cr135646_state[(2)]);
var cr135646_place_11 = cr135646_place_3;
var cr135646_place_12 = frontend.worker.device.new_get_ws_create_task;
var cr135646_place_13 = token;
var cr135646_place_14 = (function (){var G__135747 = cr135646_place_13;
var fexpr__135746 = cr135646_place_12;
return (fexpr__135746.cljs$core$IFn$_invoke$arity$1 ? fexpr__135746.cljs$core$IFn$_invoke$arity$1(G__135747) : fexpr__135746.call(null,G__135747));
})();
var cr135646_place_15 = frontend.worker.device.new_task__remove_device_public_key_STAR_;
var cr135646_place_16 = cr135646_place_14;
var cr135646_place_17 = cr135646_place_11;
var cr135646_place_18 = key_name;
var cr135646_place_19 = (function (){var G__135753 = cr135646_place_16;
var G__135754 = cr135646_place_17;
var G__135755 = cr135646_place_18;
var fexpr__135752 = cr135646_place_15;
return (fexpr__135752.cljs$core$IFn$_invoke$arity$3 ? fexpr__135752.cljs$core$IFn$_invoke$arity$3(G__135753,G__135754,G__135755) : fexpr__135752.call(null,G__135753,G__135754,G__135755));
})();
(cr135646_state[(0)] = cr135646_block_6);

(cr135646_state[(2)] = null);

return missionary.core.park(cr135646_place_19);
}catch (e135740){var cr135646_exception = e135740;
(cr135646_state[(0)] = null);

(cr135646_state[(1)] = null);

(cr135646_state[(2)] = null);

throw cr135646_exception;
}});
var cr135646_block_6 = (function frontend$worker$device$new_task__remove_device_public_key_$_cr135646_block_6(cr135646_state){
try{var cr135646_place_20 = missionary.core.unpark();
(cr135646_state[(0)] = cr135646_block_7);

(cr135646_state[(1)] = cr135646_place_20);

return cr135646_state;
}catch (e135759){var cr135646_exception = e135759;
(cr135646_state[(0)] = null);

(cr135646_state[(1)] = null);

throw cr135646_exception;
}});
var cr135646_block_7 = (function frontend$worker$device$new_task__remove_device_public_key_$_cr135646_block_7(cr135646_state){
try{var cr135646_place_9 = (cr135646_state[(1)]);
(cr135646_state[(0)] = null);

(cr135646_state[(1)] = null);

return cr135646_place_9;
}catch (e135764){var cr135646_exception = e135764;
(cr135646_state[(0)] = null);

(cr135646_state[(1)] = null);

throw cr135646_exception;
}});
return cloroutine.impl.coroutine((function (){var G__135767 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__135767[(0)] = cr135646_block_0);

return G__135767;
})());
})(),missionary.core.sp_run);
});
frontend.worker.device.new_task__remove_device = (function frontend$worker$device$new_task__remove_device(token,device_uuid){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr135771_block_0 = (function frontend$worker$device$new_task__remove_device_$_cr135771_block_0(cr135771_state){
try{var cr135771_place_0 = device_uuid;
var cr135771_place_1 = device_uuid;
var cr135771_place_2 = typeof cr135771_place_1 === 'string';
var cr135771_place_3 = null;
if(cr135771_place_2){
(cr135771_state[(0)] = cr135771_block_2);

(cr135771_state[(1)] = cr135771_place_0);

(cr135771_state[(2)] = cr135771_place_3);

return cr135771_state;
} else {
(cr135771_state[(0)] = cr135771_block_1);

(cr135771_state[(1)] = cr135771_place_0);

(cr135771_state[(2)] = cr135771_place_3);

return cr135771_state;
}
}catch (e135859){var cr135771_exception = e135859;
(cr135771_state[(0)] = null);

throw cr135771_exception;
}});
var cr135771_block_1 = (function frontend$worker$device$new_task__remove_device_$_cr135771_block_1(cr135771_state){
try{var cr135771_place_0 = (cr135771_state[(1)]);
var cr135771_place_4 = cr135771_place_0;
(cr135771_state[(0)] = cr135771_block_3);

(cr135771_state[(1)] = null);

(cr135771_state[(2)] = cr135771_place_4);

return cr135771_state;
}catch (e135867){var cr135771_exception = e135867;
(cr135771_state[(0)] = null);

(cr135771_state[(1)] = null);

(cr135771_state[(2)] = null);

throw cr135771_exception;
}});
var cr135771_block_2 = (function frontend$worker$device$new_task__remove_device_$_cr135771_block_2(cr135771_state){
try{var cr135771_place_0 = (cr135771_state[(1)]);
var cr135771_place_5 = cljs.core.parse_uuid;
var cr135771_place_6 = cr135771_place_0;
var cr135771_place_7 = (function (){var G__135874 = cr135771_place_6;
var fexpr__135873 = cr135771_place_5;
return (fexpr__135873.cljs$core$IFn$_invoke$arity$1 ? fexpr__135873.cljs$core$IFn$_invoke$arity$1(G__135874) : fexpr__135873.call(null,G__135874));
})();
(cr135771_state[(0)] = cr135771_block_3);

(cr135771_state[(1)] = null);

(cr135771_state[(2)] = cr135771_place_7);

return cr135771_state;
}catch (e135871){var cr135771_exception = e135871;
(cr135771_state[(0)] = null);

(cr135771_state[(1)] = null);

(cr135771_state[(2)] = null);

throw cr135771_exception;
}});
var cr135771_block_3 = (function frontend$worker$device$new_task__remove_device_$_cr135771_block_3(cr135771_state){
try{var cr135771_place_3 = (cr135771_state[(2)]);
var cr135771_place_8 = cr135771_place_3;
var cr135771_place_9 = null;
if(cljs.core.truth_(cr135771_place_8)){
(cr135771_state[(0)] = cr135771_block_5);

(cr135771_state[(1)] = cr135771_place_9);

return cr135771_state;
} else {
(cr135771_state[(0)] = cr135771_block_4);

(cr135771_state[(2)] = null);

(cr135771_state[(1)] = cr135771_place_9);

return cr135771_state;
}
}catch (e135877){var cr135771_exception = e135877;
(cr135771_state[(0)] = null);

(cr135771_state[(2)] = null);

throw cr135771_exception;
}});
var cr135771_block_4 = (function frontend$worker$device$new_task__remove_device_$_cr135771_block_4(cr135771_state){
try{var cr135771_place_10 = null;
(cr135771_state[(0)] = cr135771_block_7);

(cr135771_state[(1)] = cr135771_place_10);

return cr135771_state;
}catch (e135884){var cr135771_exception = e135884;
(cr135771_state[(0)] = null);

(cr135771_state[(1)] = null);

throw cr135771_exception;
}});
var cr135771_block_5 = (function frontend$worker$device$new_task__remove_device_$_cr135771_block_5(cr135771_state){
try{var cr135771_place_3 = (cr135771_state[(2)]);
var cr135771_place_11 = cr135771_place_3;
var cr135771_place_12 = frontend.worker.device.new_get_ws_create_task;
var cr135771_place_13 = token;
var cr135771_place_14 = (function (){var G__135892 = cr135771_place_13;
var fexpr__135891 = cr135771_place_12;
return (fexpr__135891.cljs$core$IFn$_invoke$arity$1 ? fexpr__135891.cljs$core$IFn$_invoke$arity$1(G__135892) : fexpr__135891.call(null,G__135892));
})();
var cr135771_place_15 = frontend.worker.device.new_task__remove_user_device_STAR_;
var cr135771_place_16 = cr135771_place_14;
var cr135771_place_17 = cr135771_place_11;
var cr135771_place_18 = (function (){var G__135894 = cr135771_place_16;
var G__135895 = cr135771_place_17;
var fexpr__135893 = cr135771_place_15;
return (fexpr__135893.cljs$core$IFn$_invoke$arity$2 ? fexpr__135893.cljs$core$IFn$_invoke$arity$2(G__135894,G__135895) : fexpr__135893.call(null,G__135894,G__135895));
})();
(cr135771_state[(0)] = cr135771_block_6);

(cr135771_state[(2)] = null);

return missionary.core.park(cr135771_place_18);
}catch (e135889){var cr135771_exception = e135889;
(cr135771_state[(0)] = null);

(cr135771_state[(1)] = null);

(cr135771_state[(2)] = null);

throw cr135771_exception;
}});
var cr135771_block_6 = (function frontend$worker$device$new_task__remove_device_$_cr135771_block_6(cr135771_state){
try{var cr135771_place_19 = missionary.core.unpark();
(cr135771_state[(0)] = cr135771_block_7);

(cr135771_state[(1)] = cr135771_place_19);

return cr135771_state;
}catch (e135899){var cr135771_exception = e135899;
(cr135771_state[(0)] = null);

(cr135771_state[(1)] = null);

throw cr135771_exception;
}});
var cr135771_block_7 = (function frontend$worker$device$new_task__remove_device_$_cr135771_block_7(cr135771_state){
try{var cr135771_place_9 = (cr135771_state[(1)]);
(cr135771_state[(0)] = null);

(cr135771_state[(1)] = null);

return cr135771_place_9;
}catch (e135908){var cr135771_exception = e135908;
(cr135771_state[(0)] = null);

(cr135771_state[(1)] = null);

throw cr135771_exception;
}});
return cloroutine.impl.coroutine((function (){var G__135909 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__135909[(0)] = cr135771_block_0);

return G__135909;
})());
})(),missionary.core.sp_run);
});
frontend.worker.device.new_task__sync_current_graph_encrypted_aes_key = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key(token,device_uuids){
var repo = frontend.worker.state.get_current_repo();
if(((cljs.core.seq(device_uuids)) && (cljs.core.every_QMARK_(cljs.core.uuid_QMARK_,device_uuids)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(device_uuids),"\n","(and (seq device-uuids) (every? uuid? device-uuids))"].join('')));
}

return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr135923_block_6 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr135923_block_6(cr135923_state){
try{var cr135923_place_39 = null;
(cr135923_state[(0)] = cr135923_block_10);

(cr135923_state[(5)] = cr135923_place_39);

return cr135923_state;
}catch (e136309){var cr135923_exception = e136309;
(cr135923_state[(0)] = null);

(cr135923_state[(5)] = null);

(cr135923_state[(2)] = null);

(cr135923_state[(1)] = null);

throw cr135923_exception;
}});
var cr135923_block_9 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr135923_block_9(cr135923_state){
try{var cr135923_place_55 = missionary.core.unpark();
(cr135923_state[(0)] = cr135923_block_10);

(cr135923_state[(5)] = cr135923_place_55);

return cr135923_state;
}catch (e136319){var cr135923_exception = e136319;
(cr135923_state[(0)] = null);

(cr135923_state[(5)] = null);

(cr135923_state[(2)] = null);

(cr135923_state[(1)] = null);

throw cr135923_exception;
}});
var cr135923_block_2 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr135923_block_2(cr135923_state){
try{var cr135923_place_2 = (cr135923_state[(2)]);
var cr135923_place_6 = cr135923_place_2;
var cr135923_place_7 = frontend.worker.crypt.get_graph_keys_jwk;
var cr135923_place_8 = repo;
var cr135923_place_9 = (function (){var G__136327 = cr135923_place_8;
var fexpr__136326 = cr135923_place_7;
return (fexpr__136326.cljs$core$IFn$_invoke$arity$1 ? fexpr__136326.cljs$core$IFn$_invoke$arity$1(G__136327) : fexpr__136326.call(null,G__136327));
})();
var cr135923_place_10 = cr135923_place_9;
var cr135923_place_11 = null;
if(cljs.core.truth_(cr135923_place_10)){
(cr135923_state[(0)] = cr135923_block_4);

(cr135923_state[(2)] = null);

(cr135923_state[(3)] = cr135923_place_6);

(cr135923_state[(4)] = cr135923_place_9);

(cr135923_state[(2)] = cr135923_place_11);

return cr135923_state;
} else {
(cr135923_state[(0)] = cr135923_block_3);

(cr135923_state[(2)] = null);

(cr135923_state[(2)] = cr135923_place_11);

return cr135923_state;
}
}catch (e136322){var cr135923_exception = e136322;
(cr135923_state[(0)] = null);

(cr135923_state[(2)] = null);

(cr135923_state[(1)] = null);

throw cr135923_exception;
}});
var cr135923_block_3 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr135923_block_3(cr135923_state){
try{var cr135923_place_12 = null;
(cr135923_state[(0)] = cr135923_block_11);

(cr135923_state[(2)] = cr135923_place_12);

return cr135923_state;
}catch (e136335){var cr135923_exception = e136335;
(cr135923_state[(0)] = null);

(cr135923_state[(2)] = null);

(cr135923_state[(1)] = null);

throw cr135923_exception;
}});
var cr135923_block_10 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr135923_block_10(cr135923_state){
try{var cr135923_place_38 = (cr135923_state[(5)]);
(cr135923_state[(0)] = cr135923_block_11);

(cr135923_state[(5)] = null);

(cr135923_state[(2)] = cr135923_place_38);

return cr135923_state;
}catch (e136345){var cr135923_exception = e136345;
(cr135923_state[(0)] = null);

(cr135923_state[(5)] = null);

(cr135923_state[(2)] = null);

(cr135923_state[(1)] = null);

throw cr135923_exception;
}});
var cr135923_block_0 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr135923_block_0(cr135923_state){
try{var cr135923_place_0 = frontend.worker.rtc.client_op.get_graph_uuid;
var cr135923_place_1 = repo;
var cr135923_place_2 = (function (){var G__136363 = cr135923_place_1;
var fexpr__136362 = cr135923_place_0;
return (fexpr__136362.cljs$core$IFn$_invoke$arity$1 ? fexpr__136362.cljs$core$IFn$_invoke$arity$1(G__136363) : fexpr__136362.call(null,G__136363));
})();
var cr135923_place_3 = cr135923_place_2;
var cr135923_place_4 = null;
if(cljs.core.truth_(cr135923_place_3)){
(cr135923_state[(0)] = cr135923_block_2);

(cr135923_state[(2)] = cr135923_place_2);

(cr135923_state[(1)] = cr135923_place_4);

return cr135923_state;
} else {
(cr135923_state[(0)] = cr135923_block_1);

(cr135923_state[(1)] = cr135923_place_4);

return cr135923_state;
}
}catch (e136358){var cr135923_exception = e136358;
(cr135923_state[(0)] = null);

throw cr135923_exception;
}});
var cr135923_block_11 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr135923_block_11(cr135923_state){
try{var cr135923_place_11 = (cr135923_state[(2)]);
(cr135923_state[(0)] = cr135923_block_12);

(cr135923_state[(2)] = null);

(cr135923_state[(1)] = cr135923_place_11);

return cr135923_state;
}catch (e136374){var cr135923_exception = e136374;
(cr135923_state[(0)] = null);

(cr135923_state[(2)] = null);

(cr135923_state[(1)] = null);

throw cr135923_exception;
}});
var cr135923_block_8 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr135923_block_8(cr135923_state){
try{var cr135923_place_6 = (cr135923_state[(3)]);
var cr135923_place_26 = (cr135923_state[(4)]);
var cr135923_place_49 = missionary.core.unpark();
var cr135923_place_50 = frontend.worker.device.new_task__sync_encrypted_aes_key_STAR_;
var cr135923_place_51 = cr135923_place_26;
var cr135923_place_52 = cr135923_place_49;
var cr135923_place_53 = cr135923_place_6;
var cr135923_place_54 = (function (){var G__136390 = cr135923_place_51;
var G__136391 = cr135923_place_52;
var G__136392 = cr135923_place_53;
var fexpr__136389 = cr135923_place_50;
return (fexpr__136389.cljs$core$IFn$_invoke$arity$3 ? fexpr__136389.cljs$core$IFn$_invoke$arity$3(G__136390,G__136391,G__136392) : fexpr__136389.call(null,G__136390,G__136391,G__136392));
})();
(cr135923_state[(0)] = cr135923_block_9);

(cr135923_state[(3)] = null);

(cr135923_state[(4)] = null);

return missionary.core.park(cr135923_place_54);
}catch (e136378){var cr135923_exception = e136378;
(cr135923_state[(0)] = null);

(cr135923_state[(3)] = null);

(cr135923_state[(5)] = null);

(cr135923_state[(4)] = null);

(cr135923_state[(2)] = null);

(cr135923_state[(1)] = null);

throw cr135923_exception;
}});
var cr135923_block_5 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr135923_block_5(cr135923_state){
try{var cr135923_place_23 = (cr135923_state[(5)]);
var cr135923_place_30 = missionary.core.unpark();
var cr135923_place_31 = cljs.core.not_empty;
var cr135923_place_32 = cljs.core.filter;
var cr135923_place_33 = (function (device){
return ((cljs.core.contains_QMARK_(cr135923_place_23,cljs.core.uuid(new cljs.core.Keyword(null,"device-id","device-id",1535359525).cljs$core$IFn$_invoke$arity$1(device)))) && (cljs.core.not((cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(device,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"keys","keys",1068423698),new cljs.core.Keyword(null,"default-public-key","default-public-key",-840305321)], null)) == null))));
});
var cr135923_place_34 = cr135923_place_30;
var cr135923_place_35 = (function (){var G__136403 = cr135923_place_33;
var G__136404 = cr135923_place_34;
var fexpr__136402 = cr135923_place_32;
return (fexpr__136402.cljs$core$IFn$_invoke$arity$2 ? fexpr__136402.cljs$core$IFn$_invoke$arity$2(G__136403,G__136404) : fexpr__136402.call(null,G__136403,G__136404));
})();
var cr135923_place_36 = (function (){var G__136409 = cr135923_place_35;
var fexpr__136408 = cr135923_place_31;
return (fexpr__136408.cljs$core$IFn$_invoke$arity$1 ? fexpr__136408.cljs$core$IFn$_invoke$arity$1(G__136409) : fexpr__136408.call(null,G__136409));
})();
var cr135923_place_37 = cr135923_place_36;
var cr135923_place_38 = null;
if(cljs.core.truth_(cr135923_place_37)){
(cr135923_state[(0)] = cr135923_block_7);

(cr135923_state[(5)] = null);

(cr135923_state[(5)] = cr135923_place_38);

(cr135923_state[(7)] = cr135923_place_36);

return cr135923_state;
} else {
(cr135923_state[(0)] = cr135923_block_6);

(cr135923_state[(3)] = null);

(cr135923_state[(4)] = null);

(cr135923_state[(5)] = null);

(cr135923_state[(6)] = null);

(cr135923_state[(5)] = cr135923_place_38);

return cr135923_state;
}
}catch (e136396){var cr135923_exception = e136396;
(cr135923_state[(0)] = null);

(cr135923_state[(3)] = null);

(cr135923_state[(4)] = null);

(cr135923_state[(5)] = null);

(cr135923_state[(6)] = null);

(cr135923_state[(2)] = null);

(cr135923_state[(1)] = null);

throw cr135923_exception;
}});
var cr135923_block_7 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr135923_block_7(cr135923_state){
try{var cr135923_place_36 = (cr135923_state[(7)]);
var cr135923_place_20 = (cr135923_state[(6)]);
var cr135923_place_40 = cr135923_place_36;
var cr135923_place_41 = cljs.core.apply;
var cr135923_place_42 = missionary.core.join;
var cr135923_place_43 = (function() { 
var G__136814__delegate = function (x){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,x);
};
var G__136814 = function (var_args){
var x = null;
if (arguments.length > 0) {
var G__136815__i = 0, G__136815__a = new Array(arguments.length -  0);
while (G__136815__i < G__136815__a.length) {G__136815__a[G__136815__i] = arguments[G__136815__i + 0]; ++G__136815__i;}
  x = new cljs.core.IndexedSeq(G__136815__a,0,null);
} 
return G__136814__delegate.call(this,x);};
G__136814.cljs$lang$maxFixedArity = 0;
G__136814.cljs$lang$applyTo = (function (arglist__136816){
var x = cljs.core.seq(arglist__136816);
return G__136814__delegate(x);
});
G__136814.cljs$core$IFn$_invoke$arity$variadic = G__136814__delegate;
return G__136814;
})()
;
var cr135923_place_44 = cljs.core.map;
var cr135923_place_45 = (function (device){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr135942_block_0 = (function (cr135942_state){
try{var cr135942_place_0 = frontend.common.missionary._LT__BANG_;
var cr135942_place_1 = frontend.worker.crypt._LT_import_public_key;
var cr135942_place_2 = cljs.core.clj__GT_js;
var cr135942_place_3 = logseq.db.read_transit_str;
var cr135942_place_4 = cljs.core.get_in;
var cr135942_place_5 = device;
var cr135942_place_6 = new cljs.core.Keyword(null,"keys","keys",1068423698);
var cr135942_place_7 = new cljs.core.Keyword(null,"default-public-key","default-public-key",-840305321);
var cr135942_place_8 = new cljs.core.Keyword(null,"public-key","public-key",-2106850051);
var cr135942_place_9 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr135942_place_6,cr135942_place_7,cr135942_place_8], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr135942_place_10 = (function (){var G__135990 = cr135942_place_5;
var G__135991 = cr135942_place_9;
var fexpr__135989 = cr135942_place_4;
var G__136487 = G__135990;
var G__136488 = G__135991;
var fexpr__136486 = fexpr__135989;
return (fexpr__136486.cljs$core$IFn$_invoke$arity$2 ? fexpr__136486.cljs$core$IFn$_invoke$arity$2(G__136487,G__136488) : fexpr__136486.call(null,G__136487,G__136488));
})();
var cr135942_place_11 = cr135942_place_3(cr135942_place_10);
var cr135942_place_12 = (function (){var G__135994 = cr135942_place_11;
var fexpr__135993 = cr135942_place_2;
var G__136494 = G__135994;
var fexpr__136493 = fexpr__135993;
return (fexpr__136493.cljs$core$IFn$_invoke$arity$1 ? fexpr__136493.cljs$core$IFn$_invoke$arity$1(G__136494) : fexpr__136493.call(null,G__136494));
})();
var cr135942_place_13 = (function (){var G__135996 = cr135942_place_12;
var fexpr__135995 = cr135942_place_1;
var G__136496 = G__135996;
var fexpr__136495 = fexpr__135995;
return (fexpr__136495.cljs$core$IFn$_invoke$arity$1 ? fexpr__136495.cljs$core$IFn$_invoke$arity$1(G__136496) : fexpr__136495.call(null,G__136496));
})();
var cr135942_place_14 = (function (){var G__135998 = cr135942_place_13;
var fexpr__135997 = cr135942_place_0;
var G__136502 = G__135998;
var fexpr__136501 = fexpr__135997;
return (fexpr__136501.cljs$core$IFn$_invoke$arity$1 ? fexpr__136501.cljs$core$IFn$_invoke$arity$1(G__136502) : fexpr__136501.call(null,G__136502));
})();
(cr135942_state[(0)] = cr135942_block_1);

return missionary.core.park(cr135942_place_14);
}catch (e136480){var e135988 = e136480;
var cr135942_exception = e135988;
(cr135942_state[(0)] = null);

throw cr135942_exception;
}});
var cr135942_block_1 = (function (cr135942_state){
try{var cr135942_place_15 = missionary.core.unpark();
var cr135942_place_16 = cljs.core.uuid;
var cr135942_place_17 = new cljs.core.Keyword(null,"device-id","device-id",1535359525);
var cr135942_place_18 = device;
var cr135942_place_19 = cr135942_place_17.cljs$core$IFn$_invoke$arity$1(cr135942_place_18);
var cr135942_place_20 = (function (){var G__136009 = cr135942_place_19;
var fexpr__136008 = cr135942_place_16;
var G__136511 = G__136009;
var fexpr__136510 = fexpr__136008;
return (fexpr__136510.cljs$core$IFn$_invoke$arity$1 ? fexpr__136510.cljs$core$IFn$_invoke$arity$1(G__136511) : fexpr__136510.call(null,G__136511));
})();
var cr135942_place_21 = goog.crypt.base64.encodeByteArray;
var cr135942_place_22 = frontend.common.missionary._LT__BANG_;
var cr135942_place_23 = frontend.worker.crypt._LT_rsa_encrypt;
var cr135942_place_24 = cr135923_place_20;
var cr135942_place_25 = cr135942_place_15;
var cr135942_place_26 = (function (){var G__136012 = cr135942_place_24;
var G__136013 = cr135942_place_25;
var fexpr__136011 = cr135942_place_23;
var G__136514 = G__136012;
var G__136515 = G__136013;
var fexpr__136513 = fexpr__136011;
return (fexpr__136513.cljs$core$IFn$_invoke$arity$2 ? fexpr__136513.cljs$core$IFn$_invoke$arity$2(G__136514,G__136515) : fexpr__136513.call(null,G__136514,G__136515));
})();
var cr135942_place_27 = (function (){var G__136016 = cr135942_place_26;
var fexpr__136014 = cr135942_place_22;
var G__136518 = G__136016;
var fexpr__136517 = fexpr__136014;
return (fexpr__136517.cljs$core$IFn$_invoke$arity$1 ? fexpr__136517.cljs$core$IFn$_invoke$arity$1(G__136518) : fexpr__136517.call(null,G__136518));
})();
(cr135942_state[(0)] = cr135942_block_2);

(cr135942_state[(1)] = cr135942_place_20);

(cr135942_state[(2)] = cr135942_place_21);

return missionary.core.park(cr135942_place_27);
}catch (e136508){var e136007 = e136508;
var cr135942_exception = e136007;
(cr135942_state[(0)] = null);

throw cr135942_exception;
}});
var cr135942_block_2 = (function (cr135942_state){
try{var cr135942_place_20 = (cr135942_state[(1)]);
var cr135942_place_21 = (cr135942_state[(2)]);
var cr135942_place_28 = missionary.core.unpark();
var cr135942_place_29 = (new Uint8Array(cr135942_place_28));
var cr135942_place_30 = (function (){var G__136027 = cr135942_place_29;
var fexpr__136026 = cr135942_place_21;
var G__136531 = G__136027;
var fexpr__136530 = fexpr__136026;
return (fexpr__136530.cljs$core$IFn$_invoke$arity$1 ? fexpr__136530.cljs$core$IFn$_invoke$arity$1(G__136531) : fexpr__136530.call(null,G__136531));
})();
var cr135942_place_31 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr135942_place_20,cr135942_place_30], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
(cr135942_state[(0)] = null);

(cr135942_state[(1)] = null);

(cr135942_state[(2)] = null);

return cr135942_place_31;
}catch (e136523){var e136024 = e136523;
var cr135942_exception = e136024;
(cr135942_state[(0)] = null);

(cr135942_state[(1)] = null);

(cr135942_state[(2)] = null);

throw cr135942_exception;
}});
return cloroutine.impl.coroutine((function (){var G__136028 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__136028[(0)] = cr135942_block_0);

return G__136028;
})());
})(),missionary.core.sp_run);
});
var cr135923_place_46 = cr135923_place_40;
var cr135923_place_47 = (function (){var G__136543 = cr135923_place_45;
var G__136544 = cr135923_place_46;
var fexpr__136542 = cr135923_place_44;
return (fexpr__136542.cljs$core$IFn$_invoke$arity$2 ? fexpr__136542.cljs$core$IFn$_invoke$arity$2(G__136543,G__136544) : fexpr__136542.call(null,G__136543,G__136544));
})();
var cr135923_place_48 = (function (){var G__136549 = cr135923_place_42;
var G__136550 = cr135923_place_43;
var G__136551 = cr135923_place_47;
var fexpr__136548 = cr135923_place_41;
return (fexpr__136548.cljs$core$IFn$_invoke$arity$3 ? fexpr__136548.cljs$core$IFn$_invoke$arity$3(G__136549,G__136550,G__136551) : fexpr__136548.call(null,G__136549,G__136550,G__136551));
})();
(cr135923_state[(0)] = cr135923_block_8);

(cr135923_state[(7)] = null);

(cr135923_state[(6)] = null);

return missionary.core.park(cr135923_place_48);
}catch (e136418){var cr135923_exception = e136418;
(cr135923_state[(0)] = null);

(cr135923_state[(3)] = null);

(cr135923_state[(5)] = null);

(cr135923_state[(7)] = null);

(cr135923_state[(4)] = null);

(cr135923_state[(6)] = null);

(cr135923_state[(2)] = null);

(cr135923_state[(1)] = null);

throw cr135923_exception;
}});
var cr135923_block_4 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr135923_block_4(cr135923_state){
try{var cr135923_place_9 = (cr135923_state[(4)]);
var cr135923_place_13 = cr135923_place_9;
var cr135923_place_14 = cljs.core.__destructure_map;
var cr135923_place_15 = cr135923_place_13;
var cr135923_place_16 = (function (){var G__136568 = cr135923_place_15;
var fexpr__136567 = cr135923_place_14;
return (fexpr__136567.cljs$core$IFn$_invoke$arity$1 ? fexpr__136567.cljs$core$IFn$_invoke$arity$1(G__136568) : fexpr__136567.call(null,G__136568));
})();
var cr135923_place_17 = cljs.core.get;
var cr135923_place_18 = cr135923_place_16;
var cr135923_place_19 = new cljs.core.Keyword(null,"aes-key-jwk","aes-key-jwk",967413902);
var cr135923_place_20 = (function (){var G__136573 = cr135923_place_18;
var G__136574 = cr135923_place_19;
var fexpr__136572 = cr135923_place_17;
return (fexpr__136572.cljs$core$IFn$_invoke$arity$2 ? fexpr__136572.cljs$core$IFn$_invoke$arity$2(G__136573,G__136574) : fexpr__136572.call(null,G__136573,G__136574));
})();
var cr135923_place_21 = cljs.core.set;
var cr135923_place_22 = device_uuids;
var cr135923_place_23 = (function (){var G__136576 = cr135923_place_22;
var fexpr__136575 = cr135923_place_21;
return (fexpr__136575.cljs$core$IFn$_invoke$arity$1 ? fexpr__136575.cljs$core$IFn$_invoke$arity$1(G__136576) : fexpr__136575.call(null,G__136576));
})();
var cr135923_place_24 = frontend.worker.device.new_get_ws_create_task;
var cr135923_place_25 = token;
var cr135923_place_26 = (function (){var G__136581 = cr135923_place_25;
var fexpr__136580 = cr135923_place_24;
return (fexpr__136580.cljs$core$IFn$_invoke$arity$1 ? fexpr__136580.cljs$core$IFn$_invoke$arity$1(G__136581) : fexpr__136580.call(null,G__136581));
})();
var cr135923_place_27 = frontend.worker.device.new_task__get_user_devices;
var cr135923_place_28 = cr135923_place_26;
var cr135923_place_29 = (function (){var G__136583 = cr135923_place_28;
var fexpr__136582 = cr135923_place_27;
return (fexpr__136582.cljs$core$IFn$_invoke$arity$1 ? fexpr__136582.cljs$core$IFn$_invoke$arity$1(G__136583) : fexpr__136582.call(null,G__136583));
})();
(cr135923_state[(0)] = cr135923_block_5);

(cr135923_state[(4)] = null);

(cr135923_state[(4)] = cr135923_place_26);

(cr135923_state[(5)] = cr135923_place_23);

(cr135923_state[(6)] = cr135923_place_20);

return missionary.core.park(cr135923_place_29);
}catch (e136557){var cr135923_exception = e136557;
(cr135923_state[(0)] = null);

(cr135923_state[(3)] = null);

(cr135923_state[(2)] = null);

(cr135923_state[(4)] = null);

(cr135923_state[(1)] = null);

throw cr135923_exception;
}});
var cr135923_block_1 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr135923_block_1(cr135923_state){
try{var cr135923_place_5 = null;
(cr135923_state[(0)] = cr135923_block_12);

(cr135923_state[(1)] = cr135923_place_5);

return cr135923_state;
}catch (e136586){var cr135923_exception = e136586;
(cr135923_state[(0)] = null);

(cr135923_state[(1)] = null);

throw cr135923_exception;
}});
var cr135923_block_12 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr135923_block_12(cr135923_state){
try{var cr135923_place_4 = (cr135923_state[(1)]);
(cr135923_state[(0)] = null);

(cr135923_state[(1)] = null);

return cr135923_place_4;
}catch (e136595){var cr135923_exception = e136595;
(cr135923_state[(0)] = null);

(cr135923_state[(1)] = null);

throw cr135923_exception;
}});
return cloroutine.impl.coroutine((function (){var G__136599 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((8));
(G__136599[(0)] = cr135923_block_0);

return G__136599;
})());
})(),missionary.core.sp_run);
});
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","rtc-sync-current-graph-encrypted-aes-key","thread-api/rtc-sync-current-graph-encrypted-aes-key",1875134159),(function frontend$worker$device$thread_api__rtc_sync_current_graph_encrypted_aes_key(token,device_uuids){
return frontend.worker.device.new_task__sync_current_graph_encrypted_aes_key(token,device_uuids);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","list-devices","thread-api/list-devices",1647864307),(function frontend$worker$device$thread_api__list_devices(token){
return frontend.worker.device.new_task__list_devices(token);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","remove-device-public-key","thread-api/remove-device-public-key",1918950121),(function frontend$worker$device$thread_api__remove_device_public_key(token,device_uuid,key_name){
return frontend.worker.device.new_task__remove_device_public_key(token,device_uuid,key_name);
})));
frontend.common.thread_api._STAR_thread_apis.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.thread_api._STAR_thread_apis.cljs$core$IDeref$_deref$arity$1(null),new cljs.core.Keyword("thread-api","remove-device","thread-api/remove-device",1978032005),(function frontend$worker$device$thread_api__remove_device(token,device_uuid){
return frontend.worker.device.new_task__remove_device(token,device_uuid);
})));

//# sourceMappingURL=frontend.worker.device.js.map
