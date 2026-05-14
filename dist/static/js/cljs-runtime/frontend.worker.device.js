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
frontend.worker.device._STAR_device_public_key = cljs.core.atom.cljs$core$IFn$_invoke$arity$variadic(null,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"validator","validator",-1966190681),(function (p1__101898_SHARP_){
return (p1__101898_SHARP_ instanceof CryptoKey);
})], 0));
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.device !== 'undefined') && (typeof frontend.worker.device._STAR_device_private_key !== 'undefined')){
} else {
frontend.worker.device._STAR_device_private_key = cljs.core.atom.cljs$core$IFn$_invoke$arity$variadic(null,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"validator","validator",-1966190681),(function (p1__101901_SHARP_){
return (p1__101901_SHARP_ instanceof CryptoKey);
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
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr101981_block_5 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_5(cr101981_state){
try{var cr101981_place_16 = (cr101981_state[(4)]);
var cr101981_place_11 = (cr101981_state[(5)]);
var cr101981_place_20 = new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252);
var cr101981_place_21 = true;
var cr101981_place_22 = (function (){var G__102440 = cr101981_place_16;
var G__102441 = cr101981_place_20;
var G__102442 = cr101981_place_21;
var fexpr__102439 = cr101981_place_11;
return (fexpr__102439.cljs$core$IFn$_invoke$arity$3 ? fexpr__102439.cljs$core$IFn$_invoke$arity$3(G__102440,G__102441,G__102442) : fexpr__102439.call(null,G__102440,G__102441,G__102442));
})();
var cr101981_place_23 = clojure.string.join;
var cr101981_place_24 = "-";
var cr101981_place_25 = new cljs.core.Keyword(null,"platform","platform",-1086422114);
var cr101981_place_26 = cr101981_place_22;
var cr101981_place_27 = cr101981_place_25.cljs$core$IFn$_invoke$arity$1(cr101981_place_26);
var cr101981_place_28 = new cljs.core.Keyword(null,"mobile","mobile",1403078170);
var cr101981_place_29 = cr101981_place_22;
var cr101981_place_30 = cr101981_place_28.cljs$core$IFn$_invoke$arity$1(cr101981_place_29);
var cr101981_place_31 = null;
if(cljs.core.truth_(cr101981_place_30)){
(cr101981_state[(0)] = cr101981_block_7);

(cr101981_state[(4)] = null);

(cr101981_state[(5)] = null);

(cr101981_state[(3)] = cr101981_place_23);

(cr101981_state[(4)] = cr101981_place_27);

(cr101981_state[(5)] = cr101981_place_22);

(cr101981_state[(6)] = cr101981_place_24);

(cr101981_state[(7)] = cr101981_place_31);

return cr101981_state;
} else {
(cr101981_state[(0)] = cr101981_block_6);

(cr101981_state[(4)] = null);

(cr101981_state[(5)] = null);

(cr101981_state[(3)] = cr101981_place_23);

(cr101981_state[(4)] = cr101981_place_27);

(cr101981_state[(5)] = cr101981_place_22);

(cr101981_state[(6)] = cr101981_place_24);

(cr101981_state[(7)] = cr101981_place_31);

return cr101981_state;
}
}catch (e102437){var cr101981_exception = e102437;
(cr101981_state[(0)] = null);

(cr101981_state[(2)] = null);

(cr101981_state[(4)] = null);

(cr101981_state[(1)] = null);

(cr101981_state[(5)] = null);

throw cr101981_exception;
}});
var cr101981_block_3 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_3(cr101981_state){
try{var cr101981_place_12 = (cr101981_state[(3)]);
var cr101981_place_17 = cr101981_place_12;
var cr101981_place_18 = cr101981_place_17.toJSON();
(cr101981_state[(0)] = cr101981_block_5);

(cr101981_state[(3)] = null);

(cr101981_state[(4)] = cr101981_place_18);

return cr101981_state;
}catch (e102447){var cr101981_exception = e102447;
(cr101981_state[(0)] = null);

(cr101981_state[(2)] = null);

(cr101981_state[(3)] = null);

(cr101981_state[(4)] = null);

(cr101981_state[(1)] = null);

(cr101981_state[(5)] = null);

throw cr101981_exception;
}});
var cr101981_block_11 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_11(cr101981_state){
try{var cr101981_place_86 = (cr101981_state[(7)]);
var cr101981_place_92 = missionary.core.unpark();
var cr101981_place_93 = frontend.common.missionary._LT__BANG_;
var cr101981_place_94 = frontend.worker.crypt._LT_export_key;
var cr101981_place_95 = cr101981_place_86;
var cr101981_place_96 = (function (){var G__102455 = cr101981_place_95;
var fexpr__102454 = cr101981_place_94;
return (fexpr__102454.cljs$core$IFn$_invoke$arity$1 ? fexpr__102454.cljs$core$IFn$_invoke$arity$1(G__102455) : fexpr__102454.call(null,G__102455));
})();
var cr101981_place_97 = (function (){var G__102458 = cr101981_place_96;
var fexpr__102457 = cr101981_place_93;
return (fexpr__102457.cljs$core$IFn$_invoke$arity$1 ? fexpr__102457.cljs$core$IFn$_invoke$arity$1(G__102458) : fexpr__102457.call(null,G__102458));
})();
(cr101981_state[(0)] = cr101981_block_12);

(cr101981_state[(7)] = null);

(cr101981_state[(7)] = cr101981_place_92);

return missionary.core.park(cr101981_place_97);
}catch (e102453){var cr101981_exception = e102453;
(cr101981_state[(0)] = null);

(cr101981_state[(7)] = null);

(cr101981_state[(3)] = null);

(cr101981_state[(2)] = null);

(cr101981_state[(4)] = null);

(cr101981_state[(5)] = null);

(cr101981_state[(1)] = null);

(cr101981_state[(6)] = null);

throw cr101981_exception;
}});
var cr101981_block_0 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_0(cr101981_state){
try{var cr101981_place_0 = frontend.common.missionary._LT__BANG_;
var cr101981_place_1 = frontend.worker.device._LT_get_item;
var cr101981_place_2 = frontend.worker.device.item_key_device_id;
var cr101981_place_3 = (function (){var G__102463 = cr101981_place_2;
var fexpr__102462 = cr101981_place_1;
return (fexpr__102462.cljs$core$IFn$_invoke$arity$1 ? fexpr__102462.cljs$core$IFn$_invoke$arity$1(G__102463) : fexpr__102462.call(null,G__102463));
})();
var cr101981_place_4 = (function (){var G__102465 = cr101981_place_3;
var fexpr__102464 = cr101981_place_0;
return (fexpr__102464.cljs$core$IFn$_invoke$arity$1 ? fexpr__102464.cljs$core$IFn$_invoke$arity$1(G__102465) : fexpr__102464.call(null,G__102465));
})();
(cr101981_state[(0)] = cr101981_block_1);

return missionary.core.park(cr101981_place_4);
}catch (e102460){var cr101981_exception = e102460;
(cr101981_state[(0)] = null);

throw cr101981_exception;
}});
var cr101981_block_18 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_18(cr101981_state){
try{var cr101981_place_10 = (cr101981_state[(2)]);
var cr101981_place_92 = (cr101981_state[(7)]);
var cr101981_place_58 = (cr101981_state[(6)]);
var cr101981_place_141 = missionary.core.unpark();
var cr101981_place_142 = frontend.worker.device.new_task__add_device_public_key;
var cr101981_place_143 = cr101981_place_10;
var cr101981_place_144 = cr101981_place_58;
var cr101981_place_145 = "default-public-key";
var cr101981_place_146 = cr101981_place_92;
var cr101981_place_147 = (function (){var G__102470 = cr101981_place_143;
var G__102471 = cr101981_place_144;
var G__102472 = cr101981_place_145;
var G__102473 = cr101981_place_146;
var fexpr__102469 = cr101981_place_142;
return (fexpr__102469.cljs$core$IFn$_invoke$arity$4 ? fexpr__102469.cljs$core$IFn$_invoke$arity$4(G__102470,G__102471,G__102472,G__102473) : fexpr__102469.call(null,G__102470,G__102471,G__102472,G__102473));
})();
(cr101981_state[(0)] = cr101981_block_19);

(cr101981_state[(2)] = null);

(cr101981_state[(7)] = null);

(cr101981_state[(6)] = null);

return missionary.core.park(cr101981_place_147);
}catch (e102467){var cr101981_exception = e102467;
(cr101981_state[(0)] = null);

(cr101981_state[(2)] = null);

(cr101981_state[(1)] = null);

(cr101981_state[(7)] = null);

(cr101981_state[(6)] = null);

throw cr101981_exception;
}});
var cr101981_block_19 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_19(cr101981_state){
try{var cr101981_place_148 = missionary.core.unpark();
(cr101981_state[(0)] = cr101981_block_21);

(cr101981_state[(1)] = cr101981_place_148);

return cr101981_state;
}catch (e102480){var cr101981_exception = e102480;
(cr101981_state[(0)] = null);

(cr101981_state[(1)] = null);

throw cr101981_exception;
}});
var cr101981_block_21 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_21(cr101981_state){
try{var cr101981_place_7 = (cr101981_state[(1)]);
var cr101981_place_150 = frontend.common.missionary._LT__BANG_;
var cr101981_place_151 = promesa.protocols._mcat;
var cr101981_place_152 = promesa.protocols._promise;
var cr101981_place_153 = null;
var cr101981_place_154 = (function (){var G__102490 = cr101981_place_153;
var fexpr__102489 = cr101981_place_152;
return (fexpr__102489.cljs$core$IFn$_invoke$arity$1 ? fexpr__102489.cljs$core$IFn$_invoke$arity$1(G__102490) : fexpr__102489.call(null,G__102490));
})();
var cr101981_place_155 = (function (___41626__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.device._LT_get_item(frontend.worker.device.item_key_device_id)),(function (device_uuid_str){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.device._LT_get_item(frontend.worker.device.item_key_device_name)),(function (device_name){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.device._LT_get_item(frontend.worker.device.item_key_device_public_key_jwk)),(function (device_public_key_jwk){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.crypt._LT_import_public_key(device_public_key_jwk)),(function (device_public_key){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.device._LT_get_item(frontend.worker.device.item_key_device_private_key_jwk)),(function (device_private_key_jwk){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.crypt._LT_import_private_key(device_private_key_jwk)),(function (device_private_key){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(frontend.worker.device._STAR_device_id,cljs.core.uuid(device_uuid_str))),(function (___41594__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(frontend.worker.device._STAR_device_name,device_name)),(function (___41594__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(frontend.worker.device._STAR_device_public_key,device_public_key)),(function (___41594__auto____$2){
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
var cr101981_place_156 = (function (){var G__102523 = cr101981_place_154;
var G__102524 = cr101981_place_155;
var fexpr__102522 = cr101981_place_151;
return (fexpr__102522.cljs$core$IFn$_invoke$arity$2 ? fexpr__102522.cljs$core$IFn$_invoke$arity$2(G__102523,G__102524) : fexpr__102522.call(null,G__102523,G__102524));
})();
var cr101981_place_157 = (function (){var G__102526 = cr101981_place_156;
var fexpr__102525 = cr101981_place_150;
return (fexpr__102525.cljs$core$IFn$_invoke$arity$1 ? fexpr__102525.cljs$core$IFn$_invoke$arity$1(G__102526) : fexpr__102525.call(null,G__102526));
})();
(cr101981_state[(0)] = cr101981_block_22);

(cr101981_state[(1)] = null);

return missionary.core.park(cr101981_place_157);
}catch (e102486){var cr101981_exception = e102486;
(cr101981_state[(0)] = null);

(cr101981_state[(1)] = null);

throw cr101981_exception;
}});
var cr101981_block_15 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_15(cr101981_state){
try{var cr101981_place_70 = (cr101981_state[(4)]);
var cr101981_place_120 = missionary.core.unpark();
var cr101981_place_121 = frontend.common.missionary._LT__BANG_;
var cr101981_place_122 = frontend.worker.device._LT_set_item_BANG_;
var cr101981_place_123 = frontend.worker.device.item_key_device_updated_at;
var cr101981_place_124 = cr101981_place_70;
var cr101981_place_125 = (function (){var G__102537 = cr101981_place_123;
var G__102538 = cr101981_place_124;
var fexpr__102536 = cr101981_place_122;
return (fexpr__102536.cljs$core$IFn$_invoke$arity$2 ? fexpr__102536.cljs$core$IFn$_invoke$arity$2(G__102537,G__102538) : fexpr__102536.call(null,G__102537,G__102538));
})();
var cr101981_place_126 = (function (){var G__102542 = cr101981_place_125;
var fexpr__102541 = cr101981_place_121;
return (fexpr__102541.cljs$core$IFn$_invoke$arity$1 ? fexpr__102541.cljs$core$IFn$_invoke$arity$1(G__102542) : fexpr__102541.call(null,G__102542));
})();
(cr101981_state[(0)] = cr101981_block_16);

(cr101981_state[(4)] = null);

return missionary.core.park(cr101981_place_126);
}catch (e102530){var cr101981_exception = e102530;
(cr101981_state[(0)] = null);

(cr101981_state[(2)] = null);

(cr101981_state[(4)] = null);

(cr101981_state[(8)] = null);

(cr101981_state[(1)] = null);

(cr101981_state[(7)] = null);

(cr101981_state[(6)] = null);

throw cr101981_exception;
}});
var cr101981_block_20 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_20(cr101981_state){
try{var cr101981_place_149 = null;
(cr101981_state[(0)] = cr101981_block_21);

(cr101981_state[(1)] = cr101981_place_149);

return cr101981_state;
}catch (e102549){var cr101981_exception = e102549;
(cr101981_state[(0)] = null);

(cr101981_state[(1)] = null);

throw cr101981_exception;
}});
var cr101981_block_8 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_8(cr101981_state){
try{var cr101981_place_23 = (cr101981_state[(3)]);
var cr101981_place_27 = (cr101981_state[(4)]);
var cr101981_place_10 = (cr101981_state[(2)]);
var cr101981_place_22 = (cr101981_state[(5)]);
var cr101981_place_24 = (cr101981_state[(6)]);
var cr101981_place_31 = (cr101981_state[(7)]);
var cr101981_place_34 = new cljs.core.Keyword(null,"brand","brand",557863343);
var cr101981_place_35 = cljs.core.first;
var cr101981_place_36 = new cljs.core.Keyword(null,"brands","brands",1977379295);
var cr101981_place_37 = cr101981_place_22;
var cr101981_place_38 = cr101981_place_36.cljs$core$IFn$_invoke$arity$1(cr101981_place_37);
var cr101981_place_39 = (function (){var G__102568 = cr101981_place_38;
var fexpr__102567 = cr101981_place_35;
return (fexpr__102567.cljs$core$IFn$_invoke$arity$1 ? fexpr__102567.cljs$core$IFn$_invoke$arity$1(G__102568) : fexpr__102567.call(null,G__102568));
})();
var cr101981_place_40 = cr101981_place_34.cljs$core$IFn$_invoke$arity$1(cr101981_place_39);
var cr101981_place_41 = cljs_time.coerce.to_epoch;
var cr101981_place_42 = cljs_time.core.now;
var cr101981_place_43 = (function (){var fexpr__102571 = cr101981_place_42;
return (fexpr__102571.cljs$core$IFn$_invoke$arity$0 ? fexpr__102571.cljs$core$IFn$_invoke$arity$0() : fexpr__102571.call(null));
})();
var cr101981_place_44 = (function (){var G__102573 = cr101981_place_43;
var fexpr__102572 = cr101981_place_41;
return (fexpr__102572.cljs$core$IFn$_invoke$arity$1 ? fexpr__102572.cljs$core$IFn$_invoke$arity$1(G__102573) : fexpr__102572.call(null,G__102573));
})();
var cr101981_place_45 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr101981_place_27,cr101981_place_31,cr101981_place_40,cr101981_place_44], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr101981_place_46 = (function (){var G__102576 = cr101981_place_24;
var G__102577 = cr101981_place_45;
var fexpr__102575 = cr101981_place_23;
return (fexpr__102575.cljs$core$IFn$_invoke$arity$2 ? fexpr__102575.cljs$core$IFn$_invoke$arity$2(G__102576,G__102577) : fexpr__102575.call(null,G__102576,G__102577));
})();
var cr101981_place_47 = frontend.worker.device.new_task__add_user_device;
var cr101981_place_48 = cr101981_place_10;
var cr101981_place_49 = cr101981_place_46;
var cr101981_place_50 = (function (){var G__102580 = cr101981_place_48;
var G__102581 = cr101981_place_49;
var fexpr__102579 = cr101981_place_47;
return (fexpr__102579.cljs$core$IFn$_invoke$arity$2 ? fexpr__102579.cljs$core$IFn$_invoke$arity$2(G__102580,G__102581) : fexpr__102579.call(null,G__102580,G__102581));
})();
(cr101981_state[(0)] = cr101981_block_9);

(cr101981_state[(3)] = null);

(cr101981_state[(4)] = null);

(cr101981_state[(5)] = null);

(cr101981_state[(6)] = null);

(cr101981_state[(7)] = null);

return missionary.core.park(cr101981_place_50);
}catch (e102551){var cr101981_exception = e102551;
(cr101981_state[(0)] = null);

(cr101981_state[(3)] = null);

(cr101981_state[(4)] = null);

(cr101981_state[(2)] = null);

(cr101981_state[(5)] = null);

(cr101981_state[(1)] = null);

(cr101981_state[(6)] = null);

(cr101981_state[(7)] = null);

throw cr101981_exception;
}});
var cr101981_block_13 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_13(cr101981_state){
try{var cr101981_place_62 = (cr101981_state[(5)]);
var cr101981_place_106 = missionary.core.unpark();
var cr101981_place_107 = frontend.common.missionary._LT__BANG_;
var cr101981_place_108 = frontend.worker.device._LT_set_item_BANG_;
var cr101981_place_109 = frontend.worker.device.item_key_device_name;
var cr101981_place_110 = cr101981_place_62;
var cr101981_place_111 = (function (){var G__102593 = cr101981_place_109;
var G__102594 = cr101981_place_110;
var fexpr__102592 = cr101981_place_108;
return (fexpr__102592.cljs$core$IFn$_invoke$arity$2 ? fexpr__102592.cljs$core$IFn$_invoke$arity$2(G__102593,G__102594) : fexpr__102592.call(null,G__102593,G__102594));
})();
var cr101981_place_112 = (function (){var G__102596 = cr101981_place_111;
var fexpr__102595 = cr101981_place_107;
return (fexpr__102595.cljs$core$IFn$_invoke$arity$1 ? fexpr__102595.cljs$core$IFn$_invoke$arity$1(G__102596) : fexpr__102595.call(null,G__102596));
})();
(cr101981_state[(0)] = cr101981_block_14);

(cr101981_state[(5)] = null);

return missionary.core.park(cr101981_place_112);
}catch (e102587){var cr101981_exception = e102587;
(cr101981_state[(0)] = null);

(cr101981_state[(3)] = null);

(cr101981_state[(2)] = null);

(cr101981_state[(4)] = null);

(cr101981_state[(8)] = null);

(cr101981_state[(5)] = null);

(cr101981_state[(1)] = null);

(cr101981_state[(7)] = null);

(cr101981_state[(6)] = null);

throw cr101981_exception;
}});
var cr101981_block_4 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_4(cr101981_state){
try{var cr101981_place_19 = null;
(cr101981_state[(0)] = cr101981_block_5);

(cr101981_state[(4)] = cr101981_place_19);

return cr101981_state;
}catch (e102599){var cr101981_exception = e102599;
(cr101981_state[(0)] = null);

(cr101981_state[(2)] = null);

(cr101981_state[(4)] = null);

(cr101981_state[(1)] = null);

(cr101981_state[(5)] = null);

throw cr101981_exception;
}});
var cr101981_block_14 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_14(cr101981_state){
try{var cr101981_place_66 = (cr101981_state[(3)]);
var cr101981_place_113 = missionary.core.unpark();
var cr101981_place_114 = frontend.common.missionary._LT__BANG_;
var cr101981_place_115 = frontend.worker.device._LT_set_item_BANG_;
var cr101981_place_116 = frontend.worker.device.item_key_device_created_at;
var cr101981_place_117 = cr101981_place_66;
var cr101981_place_118 = (function (){var G__102616 = cr101981_place_116;
var G__102617 = cr101981_place_117;
var fexpr__102615 = cr101981_place_115;
return (fexpr__102615.cljs$core$IFn$_invoke$arity$2 ? fexpr__102615.cljs$core$IFn$_invoke$arity$2(G__102616,G__102617) : fexpr__102615.call(null,G__102616,G__102617));
})();
var cr101981_place_119 = (function (){var G__102619 = cr101981_place_118;
var fexpr__102618 = cr101981_place_114;
return (fexpr__102618.cljs$core$IFn$_invoke$arity$1 ? fexpr__102618.cljs$core$IFn$_invoke$arity$1(G__102619) : fexpr__102618.call(null,G__102619));
})();
(cr101981_state[(0)] = cr101981_block_15);

(cr101981_state[(3)] = null);

return missionary.core.park(cr101981_place_119);
}catch (e102606){var cr101981_exception = e102606;
(cr101981_state[(0)] = null);

(cr101981_state[(3)] = null);

(cr101981_state[(2)] = null);

(cr101981_state[(4)] = null);

(cr101981_state[(8)] = null);

(cr101981_state[(1)] = null);

(cr101981_state[(7)] = null);

(cr101981_state[(6)] = null);

throw cr101981_exception;
}});
var cr101981_block_2 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_2(cr101981_state){
try{var cr101981_place_8 = frontend.worker.device.new_get_ws_create_task;
var cr101981_place_9 = token;
var cr101981_place_10 = (function (){var G__102626 = cr101981_place_9;
var fexpr__102625 = cr101981_place_8;
return (fexpr__102625.cljs$core$IFn$_invoke$arity$1 ? fexpr__102625.cljs$core$IFn$_invoke$arity$1(G__102626) : fexpr__102625.call(null,G__102626));
})();
var cr101981_place_11 = cljs.core.js__GT_clj;
var cr101981_place_12 = navigator.userAgentData;
var cr101981_place_13 = cr101981_place_12;
var cr101981_place_14 = null;
var cr101981_place_15 = (cr101981_place_13 == cr101981_place_14);
var cr101981_place_16 = null;
if(cr101981_place_15){
(cr101981_state[(0)] = cr101981_block_4);

(cr101981_state[(2)] = cr101981_place_10);

(cr101981_state[(4)] = cr101981_place_16);

(cr101981_state[(5)] = cr101981_place_11);

return cr101981_state;
} else {
(cr101981_state[(0)] = cr101981_block_3);

(cr101981_state[(2)] = cr101981_place_10);

(cr101981_state[(3)] = cr101981_place_12);

(cr101981_state[(4)] = cr101981_place_16);

(cr101981_state[(5)] = cr101981_place_11);

return cr101981_state;
}
}catch (e102623){var cr101981_exception = e102623;
(cr101981_state[(0)] = null);

(cr101981_state[(1)] = null);

throw cr101981_exception;
}});
var cr101981_block_9 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_9(cr101981_state){
try{var cr101981_place_51 = missionary.core.unpark();
var cr101981_place_52 = cljs.core.__destructure_map;
var cr101981_place_53 = cr101981_place_51;
var cr101981_place_54 = (function (){var G__102650 = cr101981_place_53;
var fexpr__102649 = cr101981_place_52;
return (fexpr__102649.cljs$core$IFn$_invoke$arity$1 ? fexpr__102649.cljs$core$IFn$_invoke$arity$1(G__102650) : fexpr__102649.call(null,G__102650));
})();
var cr101981_place_55 = cljs.core.get;
var cr101981_place_56 = cr101981_place_54;
var cr101981_place_57 = new cljs.core.Keyword(null,"device-id","device-id",1535359525);
var cr101981_place_58 = (function (){var G__102658 = cr101981_place_56;
var G__102659 = cr101981_place_57;
var fexpr__102657 = cr101981_place_55;
return (fexpr__102657.cljs$core$IFn$_invoke$arity$2 ? fexpr__102657.cljs$core$IFn$_invoke$arity$2(G__102658,G__102659) : fexpr__102657.call(null,G__102658,G__102659));
})();
var cr101981_place_59 = cljs.core.get;
var cr101981_place_60 = cr101981_place_54;
var cr101981_place_61 = new cljs.core.Keyword(null,"device-name","device-name",905058139);
var cr101981_place_62 = (function (){var G__102662 = cr101981_place_60;
var G__102663 = cr101981_place_61;
var fexpr__102661 = cr101981_place_59;
return (fexpr__102661.cljs$core$IFn$_invoke$arity$2 ? fexpr__102661.cljs$core$IFn$_invoke$arity$2(G__102662,G__102663) : fexpr__102661.call(null,G__102662,G__102663));
})();
var cr101981_place_63 = cljs.core.get;
var cr101981_place_64 = cr101981_place_54;
var cr101981_place_65 = new cljs.core.Keyword(null,"created-at","created-at",-89248644);
var cr101981_place_66 = (function (){var G__102667 = cr101981_place_64;
var G__102668 = cr101981_place_65;
var fexpr__102666 = cr101981_place_63;
return (fexpr__102666.cljs$core$IFn$_invoke$arity$2 ? fexpr__102666.cljs$core$IFn$_invoke$arity$2(G__102667,G__102668) : fexpr__102666.call(null,G__102667,G__102668));
})();
var cr101981_place_67 = cljs.core.get;
var cr101981_place_68 = cr101981_place_54;
var cr101981_place_69 = new cljs.core.Keyword(null,"updated-at","updated-at",-1592622336);
var cr101981_place_70 = (function (){var G__102670 = cr101981_place_68;
var G__102671 = cr101981_place_69;
var fexpr__102669 = cr101981_place_67;
return (fexpr__102669.cljs$core$IFn$_invoke$arity$2 ? fexpr__102669.cljs$core$IFn$_invoke$arity$2(G__102670,G__102671) : fexpr__102669.call(null,G__102670,G__102671));
})();
var cr101981_place_71 = frontend.common.missionary._LT__BANG_;
var cr101981_place_72 = frontend.worker.crypt._LT_gen_key_pair;
var cr101981_place_73 = (function (){var fexpr__102675 = cr101981_place_72;
return (fexpr__102675.cljs$core$IFn$_invoke$arity$0 ? fexpr__102675.cljs$core$IFn$_invoke$arity$0() : fexpr__102675.call(null));
})();
var cr101981_place_74 = (function (){var G__102677 = cr101981_place_73;
var fexpr__102676 = cr101981_place_71;
return (fexpr__102676.cljs$core$IFn$_invoke$arity$1 ? fexpr__102676.cljs$core$IFn$_invoke$arity$1(G__102677) : fexpr__102676.call(null,G__102677));
})();
(cr101981_state[(0)] = cr101981_block_10);

(cr101981_state[(3)] = cr101981_place_66);

(cr101981_state[(4)] = cr101981_place_70);

(cr101981_state[(5)] = cr101981_place_62);

(cr101981_state[(6)] = cr101981_place_58);

return missionary.core.park(cr101981_place_74);
}catch (e102641){var cr101981_exception = e102641;
(cr101981_state[(0)] = null);

(cr101981_state[(2)] = null);

(cr101981_state[(1)] = null);

throw cr101981_exception;
}});
var cr101981_block_7 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_7(cr101981_state){
try{var cr101981_place_33 = "mobile";
(cr101981_state[(0)] = cr101981_block_8);

(cr101981_state[(7)] = cr101981_place_33);

return cr101981_state;
}catch (e102681){var cr101981_exception = e102681;
(cr101981_state[(0)] = null);

(cr101981_state[(3)] = null);

(cr101981_state[(4)] = null);

(cr101981_state[(2)] = null);

(cr101981_state[(5)] = null);

(cr101981_state[(1)] = null);

(cr101981_state[(6)] = null);

(cr101981_state[(7)] = null);

throw cr101981_exception;
}});
var cr101981_block_10 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_10(cr101981_state){
try{var cr101981_place_75 = missionary.core.unpark();
var cr101981_place_76 = cljs.core.__destructure_map;
var cr101981_place_77 = cr101981_place_75;
var cr101981_place_78 = (function (){var G__102691 = cr101981_place_77;
var fexpr__102690 = cr101981_place_76;
return (fexpr__102690.cljs$core$IFn$_invoke$arity$1 ? fexpr__102690.cljs$core$IFn$_invoke$arity$1(G__102691) : fexpr__102690.call(null,G__102691));
})();
var cr101981_place_79 = cljs.core.get;
var cr101981_place_80 = cr101981_place_78;
var cr101981_place_81 = new cljs.core.Keyword(null,"publicKey","publicKey",1004767313);
var cr101981_place_82 = (function (){var G__102697 = cr101981_place_80;
var G__102698 = cr101981_place_81;
var fexpr__102696 = cr101981_place_79;
return (fexpr__102696.cljs$core$IFn$_invoke$arity$2 ? fexpr__102696.cljs$core$IFn$_invoke$arity$2(G__102697,G__102698) : fexpr__102696.call(null,G__102697,G__102698));
})();
var cr101981_place_83 = cljs.core.get;
var cr101981_place_84 = cr101981_place_78;
var cr101981_place_85 = new cljs.core.Keyword(null,"privateKey","privateKey",1845961641);
var cr101981_place_86 = (function (){var G__102700 = cr101981_place_84;
var G__102701 = cr101981_place_85;
var fexpr__102699 = cr101981_place_83;
return (fexpr__102699.cljs$core$IFn$_invoke$arity$2 ? fexpr__102699.cljs$core$IFn$_invoke$arity$2(G__102700,G__102701) : fexpr__102699.call(null,G__102700,G__102701));
})();
var cr101981_place_87 = frontend.common.missionary._LT__BANG_;
var cr101981_place_88 = frontend.worker.crypt._LT_export_key;
var cr101981_place_89 = cr101981_place_82;
var cr101981_place_90 = (function (){var G__102704 = cr101981_place_89;
var fexpr__102703 = cr101981_place_88;
return (fexpr__102703.cljs$core$IFn$_invoke$arity$1 ? fexpr__102703.cljs$core$IFn$_invoke$arity$1(G__102704) : fexpr__102703.call(null,G__102704));
})();
var cr101981_place_91 = (function (){var G__102706 = cr101981_place_90;
var fexpr__102705 = cr101981_place_87;
return (fexpr__102705.cljs$core$IFn$_invoke$arity$1 ? fexpr__102705.cljs$core$IFn$_invoke$arity$1(G__102706) : fexpr__102705.call(null,G__102706));
})();
(cr101981_state[(0)] = cr101981_block_11);

(cr101981_state[(7)] = cr101981_place_86);

return missionary.core.park(cr101981_place_91);
}catch (e102683){var cr101981_exception = e102683;
(cr101981_state[(0)] = null);

(cr101981_state[(3)] = null);

(cr101981_state[(2)] = null);

(cr101981_state[(4)] = null);

(cr101981_state[(5)] = null);

(cr101981_state[(1)] = null);

(cr101981_state[(6)] = null);

throw cr101981_exception;
}});
var cr101981_block_16 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_16(cr101981_state){
try{var cr101981_place_92 = (cr101981_state[(7)]);
var cr101981_place_127 = missionary.core.unpark();
var cr101981_place_128 = frontend.common.missionary._LT__BANG_;
var cr101981_place_129 = frontend.worker.device._LT_set_item_BANG_;
var cr101981_place_130 = frontend.worker.device.item_key_device_public_key_jwk;
var cr101981_place_131 = cr101981_place_92;
var cr101981_place_132 = (function (){var G__102717 = cr101981_place_130;
var G__102718 = cr101981_place_131;
var fexpr__102716 = cr101981_place_129;
return (fexpr__102716.cljs$core$IFn$_invoke$arity$2 ? fexpr__102716.cljs$core$IFn$_invoke$arity$2(G__102717,G__102718) : fexpr__102716.call(null,G__102717,G__102718));
})();
var cr101981_place_133 = (function (){var G__102720 = cr101981_place_132;
var fexpr__102719 = cr101981_place_128;
return (fexpr__102719.cljs$core$IFn$_invoke$arity$1 ? fexpr__102719.cljs$core$IFn$_invoke$arity$1(G__102720) : fexpr__102719.call(null,G__102720));
})();
(cr101981_state[(0)] = cr101981_block_17);

return missionary.core.park(cr101981_place_133);
}catch (e102711){var cr101981_exception = e102711;
(cr101981_state[(0)] = null);

(cr101981_state[(2)] = null);

(cr101981_state[(8)] = null);

(cr101981_state[(1)] = null);

(cr101981_state[(7)] = null);

(cr101981_state[(6)] = null);

throw cr101981_exception;
}});
var cr101981_block_1 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_1(cr101981_state){
try{var cr101981_place_5 = missionary.core.unpark();
var cr101981_place_6 = cr101981_place_5;
var cr101981_place_7 = null;
if(cljs.core.truth_(cr101981_place_6)){
(cr101981_state[(0)] = cr101981_block_20);

(cr101981_state[(1)] = cr101981_place_7);

return cr101981_state;
} else {
(cr101981_state[(0)] = cr101981_block_2);

(cr101981_state[(1)] = cr101981_place_7);

return cr101981_state;
}
}catch (e102722){var cr101981_exception = e102722;
(cr101981_state[(0)] = null);

throw cr101981_exception;
}});
var cr101981_block_17 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_17(cr101981_state){
try{var cr101981_place_98 = (cr101981_state[(8)]);
var cr101981_place_134 = missionary.core.unpark();
var cr101981_place_135 = frontend.common.missionary._LT__BANG_;
var cr101981_place_136 = frontend.worker.device._LT_set_item_BANG_;
var cr101981_place_137 = frontend.worker.device.item_key_device_private_key_jwk;
var cr101981_place_138 = cr101981_place_98;
var cr101981_place_139 = (function (){var G__102730 = cr101981_place_137;
var G__102731 = cr101981_place_138;
var fexpr__102729 = cr101981_place_136;
return (fexpr__102729.cljs$core$IFn$_invoke$arity$2 ? fexpr__102729.cljs$core$IFn$_invoke$arity$2(G__102730,G__102731) : fexpr__102729.call(null,G__102730,G__102731));
})();
var cr101981_place_140 = (function (){var G__102733 = cr101981_place_139;
var fexpr__102732 = cr101981_place_135;
return (fexpr__102732.cljs$core$IFn$_invoke$arity$1 ? fexpr__102732.cljs$core$IFn$_invoke$arity$1(G__102733) : fexpr__102732.call(null,G__102733));
})();
(cr101981_state[(0)] = cr101981_block_18);

(cr101981_state[(8)] = null);

return missionary.core.park(cr101981_place_140);
}catch (e102724){var cr101981_exception = e102724;
(cr101981_state[(0)] = null);

(cr101981_state[(2)] = null);

(cr101981_state[(8)] = null);

(cr101981_state[(1)] = null);

(cr101981_state[(7)] = null);

(cr101981_state[(6)] = null);

throw cr101981_exception;
}});
var cr101981_block_6 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_6(cr101981_state){
try{var cr101981_place_32 = null;
(cr101981_state[(0)] = cr101981_block_8);

(cr101981_state[(7)] = cr101981_place_32);

return cr101981_state;
}catch (e102735){var cr101981_exception = e102735;
(cr101981_state[(0)] = null);

(cr101981_state[(3)] = null);

(cr101981_state[(4)] = null);

(cr101981_state[(2)] = null);

(cr101981_state[(5)] = null);

(cr101981_state[(1)] = null);

(cr101981_state[(6)] = null);

(cr101981_state[(7)] = null);

throw cr101981_exception;
}});
var cr101981_block_12 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_12(cr101981_state){
try{var cr101981_place_58 = (cr101981_state[(6)]);
var cr101981_place_98 = missionary.core.unpark();
var cr101981_place_99 = frontend.common.missionary._LT__BANG_;
var cr101981_place_100 = frontend.worker.device._LT_set_item_BANG_;
var cr101981_place_101 = frontend.worker.device.item_key_device_id;
var cr101981_place_102 = cr101981_place_58;
var cr101981_place_103 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr101981_place_102);
var cr101981_place_104 = (function (){var G__102751 = cr101981_place_101;
var G__102752 = cr101981_place_103;
var fexpr__102750 = cr101981_place_100;
return (fexpr__102750.cljs$core$IFn$_invoke$arity$2 ? fexpr__102750.cljs$core$IFn$_invoke$arity$2(G__102751,G__102752) : fexpr__102750.call(null,G__102751,G__102752));
})();
var cr101981_place_105 = (function (){var G__102757 = cr101981_place_104;
var fexpr__102756 = cr101981_place_99;
return (fexpr__102756.cljs$core$IFn$_invoke$arity$1 ? fexpr__102756.cljs$core$IFn$_invoke$arity$1(G__102757) : fexpr__102756.call(null,G__102757));
})();
(cr101981_state[(0)] = cr101981_block_13);

(cr101981_state[(8)] = cr101981_place_98);

return missionary.core.park(cr101981_place_105);
}catch (e102742){var cr101981_exception = e102742;
(cr101981_state[(0)] = null);

(cr101981_state[(3)] = null);

(cr101981_state[(2)] = null);

(cr101981_state[(4)] = null);

(cr101981_state[(5)] = null);

(cr101981_state[(1)] = null);

(cr101981_state[(7)] = null);

(cr101981_state[(6)] = null);

throw cr101981_exception;
}});
var cr101981_block_22 = (function frontend$worker$device$new_task__ensure_device_metadata_BANG__$_cr101981_block_22(cr101981_state){
try{var cr101981_place_158 = missionary.core.unpark();
(cr101981_state[(0)] = null);

return cr101981_place_158;
}catch (e102760){var cr101981_exception = e102760;
(cr101981_state[(0)] = null);

throw cr101981_exception;
}});
return cloroutine.impl.coroutine((function (){var G__102764 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((9));
(G__102764[(0)] = cr101981_block_0);

return G__102764;
})());
})(),missionary.core.sp_run);
});
/**
 * Return device list.
 *   Also sync local device metadata to remote if not exists in remote side
 */
frontend.worker.device.new_task__list_devices = (function frontend$worker$device$new_task__list_devices(token){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr102774_block_19 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_19(cr102774_state){
try{var cr102774_place_72 = missionary.core.unpark();
(cr102774_state[(0)] = cr102774_block_20);

(cr102774_state[(1)] = cr102774_place_72);

return cr102774_state;
}catch (e103035){var cr102774_exception = e103035;
(cr102774_state[(0)] = null);

(cr102774_state[(2)] = null);

(cr102774_state[(1)] = null);

throw cr102774_exception;
}});
var cr102774_block_14 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_14(cr102774_state){
try{var cr102774_place_44 = missionary.core.unpark();
var cr102774_place_45 = frontend.common.missionary._LT__BANG_;
var cr102774_place_46 = frontend.worker.device._LT_remove_item_BANG_;
var cr102774_place_47 = frontend.worker.device.item_key_device_created_at;
var cr102774_place_48 = (function (){var G__103047 = cr102774_place_47;
var fexpr__103046 = cr102774_place_46;
return (fexpr__103046.cljs$core$IFn$_invoke$arity$1 ? fexpr__103046.cljs$core$IFn$_invoke$arity$1(G__103047) : fexpr__103046.call(null,G__103047));
})();
var cr102774_place_49 = (function (){var G__103049 = cr102774_place_48;
var fexpr__103048 = cr102774_place_45;
return (fexpr__103048.cljs$core$IFn$_invoke$arity$1 ? fexpr__103048.cljs$core$IFn$_invoke$arity$1(G__103049) : fexpr__103048.call(null,G__103049));
})();
(cr102774_state[(0)] = cr102774_block_15);

return missionary.core.park(cr102774_place_49);
}catch (e103044){var cr102774_exception = e103044;
(cr102774_state[(0)] = null);

(cr102774_state[(2)] = null);

(cr102774_state[(1)] = null);

throw cr102774_exception;
}});
var cr102774_block_11 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_11(cr102774_state){
try{var cr102774_place_32 = null;
(cr102774_state[(0)] = cr102774_block_20);

(cr102774_state[(1)] = cr102774_place_32);

return cr102774_state;
}catch (e103058){var cr102774_exception = e103058;
(cr102774_state[(0)] = null);

(cr102774_state[(2)] = null);

(cr102774_state[(1)] = null);

throw cr102774_exception;
}});
var cr102774_block_2 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_2(cr102774_state){
try{var cr102774_place_9 = (cr102774_state[(3)]);
var cr102774_place_12 = cr102774_place_9;
(cr102774_state[(0)] = cr102774_block_10);

(cr102774_state[(3)] = null);

(cr102774_state[(1)] = cr102774_place_12);

return cr102774_state;
}catch (e103061){var cr102774_exception = e103061;
(cr102774_state[(0)] = null);

(cr102774_state[(1)] = null);

(cr102774_state[(2)] = null);

(cr102774_state[(3)] = null);

throw cr102774_exception;
}});
var cr102774_block_8 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_8(cr102774_state){
try{var cr102774_place_23 = (cr102774_state[(5)]);
(cr102774_state[(0)] = cr102774_block_9);

(cr102774_state[(5)] = null);

(cr102774_state[(4)] = cr102774_place_23);

return cr102774_state;
}catch (e103066){var cr102774_exception = e103066;
(cr102774_state[(0)] = null);

(cr102774_state[(4)] = null);

(cr102774_state[(1)] = null);

(cr102774_state[(5)] = null);

(cr102774_state[(2)] = null);

throw cr102774_exception;
}});
var cr102774_block_15 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_15(cr102774_state){
try{var cr102774_place_50 = missionary.core.unpark();
var cr102774_place_51 = frontend.common.missionary._LT__BANG_;
var cr102774_place_52 = frontend.worker.device._LT_remove_item_BANG_;
var cr102774_place_53 = frontend.worker.device.item_key_device_updated_at;
var cr102774_place_54 = (function (){var G__103079 = cr102774_place_53;
var fexpr__103078 = cr102774_place_52;
return (fexpr__103078.cljs$core$IFn$_invoke$arity$1 ? fexpr__103078.cljs$core$IFn$_invoke$arity$1(G__103079) : fexpr__103078.call(null,G__103079));
})();
var cr102774_place_55 = (function (){var G__103083 = cr102774_place_54;
var fexpr__103082 = cr102774_place_51;
return (fexpr__103082.cljs$core$IFn$_invoke$arity$1 ? fexpr__103082.cljs$core$IFn$_invoke$arity$1(G__103083) : fexpr__103082.call(null,G__103083));
})();
(cr102774_state[(0)] = cr102774_block_16);

return missionary.core.park(cr102774_place_55);
}catch (e103074){var cr102774_exception = e103074;
(cr102774_state[(0)] = null);

(cr102774_state[(2)] = null);

(cr102774_state[(1)] = null);

throw cr102774_exception;
}});
var cr102774_block_6 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_6(cr102774_state){
try{var cr102774_place_21 = (cr102774_state[(3)]);
var cr102774_place_24 = cr102774_place_21;
(cr102774_state[(0)] = cr102774_block_8);

(cr102774_state[(3)] = null);

(cr102774_state[(5)] = cr102774_place_24);

return cr102774_state;
}catch (e103092){var cr102774_exception = e103092;
(cr102774_state[(0)] = null);

(cr102774_state[(3)] = null);

(cr102774_state[(4)] = null);

(cr102774_state[(1)] = null);

(cr102774_state[(5)] = null);

(cr102774_state[(2)] = null);

throw cr102774_exception;
}});
var cr102774_block_4 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_4(cr102774_state){
try{var cr102774_place_15 = (cr102774_state[(3)]);
var cr102774_place_18 = cr102774_place_15;
(cr102774_state[(0)] = cr102774_block_9);

(cr102774_state[(3)] = null);

(cr102774_state[(4)] = cr102774_place_18);

return cr102774_state;
}catch (e103094){var cr102774_exception = e103094;
(cr102774_state[(0)] = null);

(cr102774_state[(3)] = null);

(cr102774_state[(4)] = null);

(cr102774_state[(1)] = null);

(cr102774_state[(2)] = null);

throw cr102774_exception;
}});
var cr102774_block_16 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_16(cr102774_state){
try{var cr102774_place_56 = missionary.core.unpark();
var cr102774_place_57 = frontend.common.missionary._LT__BANG_;
var cr102774_place_58 = frontend.worker.device._LT_remove_item_BANG_;
var cr102774_place_59 = frontend.worker.device.item_key_device_public_key_jwk;
var cr102774_place_60 = (function (){var G__103105 = cr102774_place_59;
var fexpr__103104 = cr102774_place_58;
return (fexpr__103104.cljs$core$IFn$_invoke$arity$1 ? fexpr__103104.cljs$core$IFn$_invoke$arity$1(G__103105) : fexpr__103104.call(null,G__103105));
})();
var cr102774_place_61 = (function (){var G__103107 = cr102774_place_60;
var fexpr__103106 = cr102774_place_57;
return (fexpr__103106.cljs$core$IFn$_invoke$arity$1 ? fexpr__103106.cljs$core$IFn$_invoke$arity$1(G__103107) : fexpr__103106.call(null,G__103107));
})();
(cr102774_state[(0)] = cr102774_block_17);

return missionary.core.park(cr102774_place_61);
}catch (e103096){var cr102774_exception = e103096;
(cr102774_state[(0)] = null);

(cr102774_state[(2)] = null);

(cr102774_state[(1)] = null);

throw cr102774_exception;
}});
var cr102774_block_5 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_5(cr102774_state){
try{var cr102774_place_19 = cljs.core.deref;
var cr102774_place_20 = frontend.worker.device._STAR_device_public_key;
var cr102774_place_21 = (function (){var G__103127 = cr102774_place_20;
var fexpr__103126 = cr102774_place_19;
return (fexpr__103126.cljs$core$IFn$_invoke$arity$1 ? fexpr__103126.cljs$core$IFn$_invoke$arity$1(G__103127) : fexpr__103126.call(null,G__103127));
})();
var cr102774_place_22 = cr102774_place_21;
var cr102774_place_23 = null;
if(cljs.core.truth_(cr102774_place_22)){
(cr102774_state[(0)] = cr102774_block_7);

(cr102774_state[(5)] = cr102774_place_23);

return cr102774_state;
} else {
(cr102774_state[(0)] = cr102774_block_6);

(cr102774_state[(3)] = cr102774_place_21);

(cr102774_state[(5)] = cr102774_place_23);

return cr102774_state;
}
}catch (e103114){var cr102774_exception = e103114;
(cr102774_state[(0)] = null);

(cr102774_state[(4)] = null);

(cr102774_state[(1)] = null);

(cr102774_state[(2)] = null);

throw cr102774_exception;
}});
var cr102774_block_7 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_7(cr102774_state){
try{var cr102774_place_6 = (cr102774_state[(2)]);
var cr102774_place_25 = cljs.core.not;
var cr102774_place_26 = cljs.core.some;
var cr102774_place_27 = (function (device){
var map__102787 = device;
var map__102787__$1 = cljs.core.__destructure_map(map__102787);
var device_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102787__$1,new cljs.core.Keyword(null,"device-id","device-id",1535359525));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(device_id,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.worker.device._STAR_device_id)))){
return true;
} else {
return null;
}
});
var cr102774_place_28 = cr102774_place_6;
var cr102774_place_29 = (function (){var G__103156 = cr102774_place_27;
var G__103157 = cr102774_place_28;
var fexpr__103155 = cr102774_place_26;
return (fexpr__103155.cljs$core$IFn$_invoke$arity$2 ? fexpr__103155.cljs$core$IFn$_invoke$arity$2(G__103156,G__103157) : fexpr__103155.call(null,G__103156,G__103157));
})();
var cr102774_place_30 = (function (){var G__103160 = cr102774_place_29;
var fexpr__103159 = cr102774_place_25;
return (fexpr__103159.cljs$core$IFn$_invoke$arity$1 ? fexpr__103159.cljs$core$IFn$_invoke$arity$1(G__103160) : fexpr__103159.call(null,G__103160));
})();
(cr102774_state[(0)] = cr102774_block_8);

(cr102774_state[(5)] = cr102774_place_30);

return cr102774_state;
}catch (e103146){var cr102774_exception = e103146;
(cr102774_state[(0)] = null);

(cr102774_state[(4)] = null);

(cr102774_state[(1)] = null);

(cr102774_state[(5)] = null);

(cr102774_state[(2)] = null);

throw cr102774_exception;
}});
var cr102774_block_13 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_13(cr102774_state){
try{var cr102774_place_38 = missionary.core.unpark();
var cr102774_place_39 = frontend.common.missionary._LT__BANG_;
var cr102774_place_40 = frontend.worker.device._LT_remove_item_BANG_;
var cr102774_place_41 = frontend.worker.device.item_key_device_name;
var cr102774_place_42 = (function (){var G__103167 = cr102774_place_41;
var fexpr__103166 = cr102774_place_40;
return (fexpr__103166.cljs$core$IFn$_invoke$arity$1 ? fexpr__103166.cljs$core$IFn$_invoke$arity$1(G__103167) : fexpr__103166.call(null,G__103167));
})();
var cr102774_place_43 = (function (){var G__103171 = cr102774_place_42;
var fexpr__103170 = cr102774_place_39;
return (fexpr__103170.cljs$core$IFn$_invoke$arity$1 ? fexpr__103170.cljs$core$IFn$_invoke$arity$1(G__103171) : fexpr__103170.call(null,G__103171));
})();
(cr102774_state[(0)] = cr102774_block_14);

return missionary.core.park(cr102774_place_43);
}catch (e103163){var cr102774_exception = e103163;
(cr102774_state[(0)] = null);

(cr102774_state[(2)] = null);

(cr102774_state[(1)] = null);

throw cr102774_exception;
}});
var cr102774_block_9 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_9(cr102774_state){
try{var cr102774_place_17 = (cr102774_state[(4)]);
(cr102774_state[(0)] = cr102774_block_10);

(cr102774_state[(4)] = null);

(cr102774_state[(1)] = cr102774_place_17);

return cr102774_state;
}catch (e103177){var cr102774_exception = e103177;
(cr102774_state[(0)] = null);

(cr102774_state[(4)] = null);

(cr102774_state[(1)] = null);

(cr102774_state[(2)] = null);

throw cr102774_exception;
}});
var cr102774_block_17 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_17(cr102774_state){
try{var cr102774_place_62 = missionary.core.unpark();
var cr102774_place_63 = frontend.common.missionary._LT__BANG_;
var cr102774_place_64 = frontend.worker.device._LT_remove_item_BANG_;
var cr102774_place_65 = frontend.worker.device.item_key_device_private_key_jwk;
var cr102774_place_66 = (function (){var G__103194 = cr102774_place_65;
var fexpr__103192 = cr102774_place_64;
return (fexpr__103192.cljs$core$IFn$_invoke$arity$1 ? fexpr__103192.cljs$core$IFn$_invoke$arity$1(G__103194) : fexpr__103192.call(null,G__103194));
})();
var cr102774_place_67 = (function (){var G__103196 = cr102774_place_66;
var fexpr__103195 = cr102774_place_63;
return (fexpr__103195.cljs$core$IFn$_invoke$arity$1 ? fexpr__103195.cljs$core$IFn$_invoke$arity$1(G__103196) : fexpr__103195.call(null,G__103196));
})();
(cr102774_state[(0)] = cr102774_block_18);

return missionary.core.park(cr102774_place_67);
}catch (e103185){var cr102774_exception = e103185;
(cr102774_state[(0)] = null);

(cr102774_state[(2)] = null);

(cr102774_state[(1)] = null);

throw cr102774_exception;
}});
var cr102774_block_10 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_10(cr102774_state){
try{var cr102774_place_11 = (cr102774_state[(1)]);
var cr102774_place_31 = null;
if(cljs.core.truth_(cr102774_place_11)){
(cr102774_state[(0)] = cr102774_block_12);

(cr102774_state[(1)] = null);

(cr102774_state[(1)] = cr102774_place_31);

return cr102774_state;
} else {
(cr102774_state[(0)] = cr102774_block_11);

(cr102774_state[(1)] = null);

(cr102774_state[(1)] = cr102774_place_31);

return cr102774_state;
}
}catch (e103204){var cr102774_exception = e103204;
(cr102774_state[(0)] = null);

(cr102774_state[(1)] = null);

(cr102774_state[(2)] = null);

throw cr102774_exception;
}});
var cr102774_block_20 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_20(cr102774_state){
try{var cr102774_place_6 = (cr102774_state[(2)]);
var cr102774_place_31 = (cr102774_state[(1)]);
var cr102774_place_73 = cr102774_place_6;
(cr102774_state[(0)] = null);

(cr102774_state[(2)] = null);

(cr102774_state[(1)] = null);

return cr102774_place_73;
}catch (e103213){var cr102774_exception = e103213;
(cr102774_state[(0)] = null);

(cr102774_state[(2)] = null);

(cr102774_state[(1)] = null);

throw cr102774_exception;
}});
var cr102774_block_3 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_3(cr102774_state){
try{var cr102774_place_13 = cljs.core.deref;
var cr102774_place_14 = frontend.worker.device._STAR_device_name;
var cr102774_place_15 = (function (){var G__103225 = cr102774_place_14;
var fexpr__103224 = cr102774_place_13;
return (fexpr__103224.cljs$core$IFn$_invoke$arity$1 ? fexpr__103224.cljs$core$IFn$_invoke$arity$1(G__103225) : fexpr__103224.call(null,G__103225));
})();
var cr102774_place_16 = cr102774_place_15;
var cr102774_place_17 = null;
if(cljs.core.truth_(cr102774_place_16)){
(cr102774_state[(0)] = cr102774_block_5);

(cr102774_state[(4)] = cr102774_place_17);

return cr102774_state;
} else {
(cr102774_state[(0)] = cr102774_block_4);

(cr102774_state[(3)] = cr102774_place_15);

(cr102774_state[(4)] = cr102774_place_17);

return cr102774_state;
}
}catch (e103216){var cr102774_exception = e103216;
(cr102774_state[(0)] = null);

(cr102774_state[(1)] = null);

(cr102774_state[(2)] = null);

throw cr102774_exception;
}});
var cr102774_block_0 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_0(cr102774_state){
try{var cr102774_place_0 = frontend.worker.device.new_get_ws_create_task;
var cr102774_place_1 = token;
var cr102774_place_2 = (function (){var G__103240 = cr102774_place_1;
var fexpr__103239 = cr102774_place_0;
return (fexpr__103239.cljs$core$IFn$_invoke$arity$1 ? fexpr__103239.cljs$core$IFn$_invoke$arity$1(G__103240) : fexpr__103239.call(null,G__103240));
})();
var cr102774_place_3 = frontend.worker.device.new_task__get_user_devices;
var cr102774_place_4 = cr102774_place_2;
var cr102774_place_5 = (function (){var G__103242 = cr102774_place_4;
var fexpr__103241 = cr102774_place_3;
return (fexpr__103241.cljs$core$IFn$_invoke$arity$1 ? fexpr__103241.cljs$core$IFn$_invoke$arity$1(G__103242) : fexpr__103241.call(null,G__103242));
})();
(cr102774_state[(0)] = cr102774_block_1);

return missionary.core.park(cr102774_place_5);
}catch (e103236){var cr102774_exception = e103236;
(cr102774_state[(0)] = null);

throw cr102774_exception;
}});
var cr102774_block_12 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_12(cr102774_state){
try{var cr102774_place_33 = frontend.common.missionary._LT__BANG_;
var cr102774_place_34 = frontend.worker.device._LT_remove_item_BANG_;
var cr102774_place_35 = frontend.worker.device.item_key_device_id;
var cr102774_place_36 = (function (){var G__103248 = cr102774_place_35;
var fexpr__103247 = cr102774_place_34;
return (fexpr__103247.cljs$core$IFn$_invoke$arity$1 ? fexpr__103247.cljs$core$IFn$_invoke$arity$1(G__103248) : fexpr__103247.call(null,G__103248));
})();
var cr102774_place_37 = (function (){var G__103250 = cr102774_place_36;
var fexpr__103249 = cr102774_place_33;
return (fexpr__103249.cljs$core$IFn$_invoke$arity$1 ? fexpr__103249.cljs$core$IFn$_invoke$arity$1(G__103250) : fexpr__103249.call(null,G__103250));
})();
(cr102774_state[(0)] = cr102774_block_13);

return missionary.core.park(cr102774_place_37);
}catch (e103245){var cr102774_exception = e103245;
(cr102774_state[(0)] = null);

(cr102774_state[(2)] = null);

(cr102774_state[(1)] = null);

throw cr102774_exception;
}});
var cr102774_block_18 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_18(cr102774_state){
try{var cr102774_place_68 = missionary.core.unpark();
var cr102774_place_69 = frontend.worker.device.new_task__ensure_device_metadata_BANG_;
var cr102774_place_70 = token;
var cr102774_place_71 = (function (){var G__103261 = cr102774_place_70;
var fexpr__103260 = cr102774_place_69;
return (fexpr__103260.cljs$core$IFn$_invoke$arity$1 ? fexpr__103260.cljs$core$IFn$_invoke$arity$1(G__103261) : fexpr__103260.call(null,G__103261));
})();
(cr102774_state[(0)] = cr102774_block_19);

return missionary.core.park(cr102774_place_71);
}catch (e103258){var cr102774_exception = e103258;
(cr102774_state[(0)] = null);

(cr102774_state[(2)] = null);

(cr102774_state[(1)] = null);

throw cr102774_exception;
}});
var cr102774_block_1 = (function frontend$worker$device$new_task__list_devices_$_cr102774_block_1(cr102774_state){
try{var cr102774_place_6 = missionary.core.unpark();
var cr102774_place_7 = cljs.core.deref;
var cr102774_place_8 = frontend.worker.device._STAR_device_id;
var cr102774_place_9 = (function (){var G__103267 = cr102774_place_8;
var fexpr__103266 = cr102774_place_7;
return (fexpr__103266.cljs$core$IFn$_invoke$arity$1 ? fexpr__103266.cljs$core$IFn$_invoke$arity$1(G__103267) : fexpr__103266.call(null,G__103267));
})();
var cr102774_place_10 = cr102774_place_9;
var cr102774_place_11 = null;
if(cljs.core.truth_(cr102774_place_10)){
(cr102774_state[(0)] = cr102774_block_3);

(cr102774_state[(2)] = cr102774_place_6);

(cr102774_state[(1)] = cr102774_place_11);

return cr102774_state;
} else {
(cr102774_state[(0)] = cr102774_block_2);

(cr102774_state[(2)] = cr102774_place_6);

(cr102774_state[(3)] = cr102774_place_9);

(cr102774_state[(1)] = cr102774_place_11);

return cr102774_state;
}
}catch (e103263){var cr102774_exception = e103263;
(cr102774_state[(0)] = null);

throw cr102774_exception;
}});
return cloroutine.impl.coroutine((function (){var G__103274 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((6));
(G__103274[(0)] = cr102774_block_0);

return G__103274;
})());
})(),missionary.core.sp_run);
});
frontend.worker.device.new_task__remove_device_public_key = (function frontend$worker$device$new_task__remove_device_public_key(token,device_uuid,key_name){
if((!((key_name == null)))){
} else {
throw (new Error("Assert failed: (some? key-name)"));
}

return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr103288_block_0 = (function frontend$worker$device$new_task__remove_device_public_key_$_cr103288_block_0(cr103288_state){
try{var cr103288_place_0 = device_uuid;
var cr103288_place_1 = device_uuid;
var cr103288_place_2 = typeof cr103288_place_1 === 'string';
var cr103288_place_3 = null;
if(cr103288_place_2){
(cr103288_state[(0)] = cr103288_block_2);

(cr103288_state[(2)] = cr103288_place_0);

(cr103288_state[(1)] = cr103288_place_3);

return cr103288_state;
} else {
(cr103288_state[(0)] = cr103288_block_1);

(cr103288_state[(2)] = cr103288_place_0);

(cr103288_state[(1)] = cr103288_place_3);

return cr103288_state;
}
}catch (e103357){var cr103288_exception = e103357;
(cr103288_state[(0)] = null);

throw cr103288_exception;
}});
var cr103288_block_1 = (function frontend$worker$device$new_task__remove_device_public_key_$_cr103288_block_1(cr103288_state){
try{var cr103288_place_0 = (cr103288_state[(2)]);
var cr103288_place_4 = cr103288_place_0;
(cr103288_state[(0)] = cr103288_block_3);

(cr103288_state[(2)] = null);

(cr103288_state[(1)] = cr103288_place_4);

return cr103288_state;
}catch (e103359){var cr103288_exception = e103359;
(cr103288_state[(0)] = null);

(cr103288_state[(1)] = null);

(cr103288_state[(2)] = null);

throw cr103288_exception;
}});
var cr103288_block_2 = (function frontend$worker$device$new_task__remove_device_public_key_$_cr103288_block_2(cr103288_state){
try{var cr103288_place_0 = (cr103288_state[(2)]);
var cr103288_place_5 = cljs.core.parse_uuid;
var cr103288_place_6 = cr103288_place_0;
var cr103288_place_7 = (function (){var G__103363 = cr103288_place_6;
var fexpr__103362 = cr103288_place_5;
return (fexpr__103362.cljs$core$IFn$_invoke$arity$1 ? fexpr__103362.cljs$core$IFn$_invoke$arity$1(G__103363) : fexpr__103362.call(null,G__103363));
})();
(cr103288_state[(0)] = cr103288_block_3);

(cr103288_state[(2)] = null);

(cr103288_state[(1)] = cr103288_place_7);

return cr103288_state;
}catch (e103361){var cr103288_exception = e103361;
(cr103288_state[(0)] = null);

(cr103288_state[(1)] = null);

(cr103288_state[(2)] = null);

throw cr103288_exception;
}});
var cr103288_block_3 = (function frontend$worker$device$new_task__remove_device_public_key_$_cr103288_block_3(cr103288_state){
try{var cr103288_place_3 = (cr103288_state[(1)]);
var cr103288_place_8 = cr103288_place_3;
var cr103288_place_9 = null;
if(cljs.core.truth_(cr103288_place_8)){
(cr103288_state[(0)] = cr103288_block_5);

(cr103288_state[(2)] = cr103288_place_9);

return cr103288_state;
} else {
(cr103288_state[(0)] = cr103288_block_4);

(cr103288_state[(1)] = null);

(cr103288_state[(2)] = cr103288_place_9);

return cr103288_state;
}
}catch (e103367){var cr103288_exception = e103367;
(cr103288_state[(0)] = null);

(cr103288_state[(1)] = null);

throw cr103288_exception;
}});
var cr103288_block_4 = (function frontend$worker$device$new_task__remove_device_public_key_$_cr103288_block_4(cr103288_state){
try{var cr103288_place_10 = null;
(cr103288_state[(0)] = cr103288_block_7);

(cr103288_state[(2)] = cr103288_place_10);

return cr103288_state;
}catch (e103372){var cr103288_exception = e103372;
(cr103288_state[(0)] = null);

(cr103288_state[(2)] = null);

throw cr103288_exception;
}});
var cr103288_block_5 = (function frontend$worker$device$new_task__remove_device_public_key_$_cr103288_block_5(cr103288_state){
try{var cr103288_place_3 = (cr103288_state[(1)]);
var cr103288_place_11 = cr103288_place_3;
var cr103288_place_12 = frontend.worker.device.new_get_ws_create_task;
var cr103288_place_13 = token;
var cr103288_place_14 = (function (){var G__103379 = cr103288_place_13;
var fexpr__103378 = cr103288_place_12;
return (fexpr__103378.cljs$core$IFn$_invoke$arity$1 ? fexpr__103378.cljs$core$IFn$_invoke$arity$1(G__103379) : fexpr__103378.call(null,G__103379));
})();
var cr103288_place_15 = frontend.worker.device.new_task__remove_device_public_key_STAR_;
var cr103288_place_16 = cr103288_place_14;
var cr103288_place_17 = cr103288_place_11;
var cr103288_place_18 = key_name;
var cr103288_place_19 = (function (){var G__103381 = cr103288_place_16;
var G__103382 = cr103288_place_17;
var G__103383 = cr103288_place_18;
var fexpr__103380 = cr103288_place_15;
return (fexpr__103380.cljs$core$IFn$_invoke$arity$3 ? fexpr__103380.cljs$core$IFn$_invoke$arity$3(G__103381,G__103382,G__103383) : fexpr__103380.call(null,G__103381,G__103382,G__103383));
})();
(cr103288_state[(0)] = cr103288_block_6);

(cr103288_state[(1)] = null);

return missionary.core.park(cr103288_place_19);
}catch (e103374){var cr103288_exception = e103374;
(cr103288_state[(0)] = null);

(cr103288_state[(1)] = null);

(cr103288_state[(2)] = null);

throw cr103288_exception;
}});
var cr103288_block_6 = (function frontend$worker$device$new_task__remove_device_public_key_$_cr103288_block_6(cr103288_state){
try{var cr103288_place_20 = missionary.core.unpark();
(cr103288_state[(0)] = cr103288_block_7);

(cr103288_state[(2)] = cr103288_place_20);

return cr103288_state;
}catch (e103387){var cr103288_exception = e103387;
(cr103288_state[(0)] = null);

(cr103288_state[(2)] = null);

throw cr103288_exception;
}});
var cr103288_block_7 = (function frontend$worker$device$new_task__remove_device_public_key_$_cr103288_block_7(cr103288_state){
try{var cr103288_place_9 = (cr103288_state[(2)]);
(cr103288_state[(0)] = null);

(cr103288_state[(2)] = null);

return cr103288_place_9;
}catch (e103390){var cr103288_exception = e103390;
(cr103288_state[(0)] = null);

(cr103288_state[(2)] = null);

throw cr103288_exception;
}});
return cloroutine.impl.coroutine((function (){var G__103392 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__103392[(0)] = cr103288_block_0);

return G__103392;
})());
})(),missionary.core.sp_run);
});
frontend.worker.device.new_task__remove_device = (function frontend$worker$device$new_task__remove_device(token,device_uuid){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr103404_block_0 = (function frontend$worker$device$new_task__remove_device_$_cr103404_block_0(cr103404_state){
try{var cr103404_place_0 = device_uuid;
var cr103404_place_1 = device_uuid;
var cr103404_place_2 = typeof cr103404_place_1 === 'string';
var cr103404_place_3 = null;
if(cr103404_place_2){
(cr103404_state[(0)] = cr103404_block_2);

(cr103404_state[(2)] = cr103404_place_0);

(cr103404_state[(1)] = cr103404_place_3);

return cr103404_state;
} else {
(cr103404_state[(0)] = cr103404_block_1);

(cr103404_state[(2)] = cr103404_place_0);

(cr103404_state[(1)] = cr103404_place_3);

return cr103404_state;
}
}catch (e103465){var cr103404_exception = e103465;
(cr103404_state[(0)] = null);

throw cr103404_exception;
}});
var cr103404_block_1 = (function frontend$worker$device$new_task__remove_device_$_cr103404_block_1(cr103404_state){
try{var cr103404_place_0 = (cr103404_state[(2)]);
var cr103404_place_4 = cr103404_place_0;
(cr103404_state[(0)] = cr103404_block_3);

(cr103404_state[(2)] = null);

(cr103404_state[(1)] = cr103404_place_4);

return cr103404_state;
}catch (e103466){var cr103404_exception = e103466;
(cr103404_state[(0)] = null);

(cr103404_state[(1)] = null);

(cr103404_state[(2)] = null);

throw cr103404_exception;
}});
var cr103404_block_2 = (function frontend$worker$device$new_task__remove_device_$_cr103404_block_2(cr103404_state){
try{var cr103404_place_0 = (cr103404_state[(2)]);
var cr103404_place_5 = cljs.core.parse_uuid;
var cr103404_place_6 = cr103404_place_0;
var cr103404_place_7 = (function (){var G__103470 = cr103404_place_6;
var fexpr__103469 = cr103404_place_5;
return (fexpr__103469.cljs$core$IFn$_invoke$arity$1 ? fexpr__103469.cljs$core$IFn$_invoke$arity$1(G__103470) : fexpr__103469.call(null,G__103470));
})();
(cr103404_state[(0)] = cr103404_block_3);

(cr103404_state[(2)] = null);

(cr103404_state[(1)] = cr103404_place_7);

return cr103404_state;
}catch (e103467){var cr103404_exception = e103467;
(cr103404_state[(0)] = null);

(cr103404_state[(1)] = null);

(cr103404_state[(2)] = null);

throw cr103404_exception;
}});
var cr103404_block_3 = (function frontend$worker$device$new_task__remove_device_$_cr103404_block_3(cr103404_state){
try{var cr103404_place_3 = (cr103404_state[(1)]);
var cr103404_place_8 = cr103404_place_3;
var cr103404_place_9 = null;
if(cljs.core.truth_(cr103404_place_8)){
(cr103404_state[(0)] = cr103404_block_5);

(cr103404_state[(2)] = cr103404_place_9);

return cr103404_state;
} else {
(cr103404_state[(0)] = cr103404_block_4);

(cr103404_state[(1)] = null);

(cr103404_state[(2)] = cr103404_place_9);

return cr103404_state;
}
}catch (e103475){var cr103404_exception = e103475;
(cr103404_state[(0)] = null);

(cr103404_state[(1)] = null);

throw cr103404_exception;
}});
var cr103404_block_4 = (function frontend$worker$device$new_task__remove_device_$_cr103404_block_4(cr103404_state){
try{var cr103404_place_10 = null;
(cr103404_state[(0)] = cr103404_block_7);

(cr103404_state[(2)] = cr103404_place_10);

return cr103404_state;
}catch (e103485){var cr103404_exception = e103485;
(cr103404_state[(0)] = null);

(cr103404_state[(2)] = null);

throw cr103404_exception;
}});
var cr103404_block_5 = (function frontend$worker$device$new_task__remove_device_$_cr103404_block_5(cr103404_state){
try{var cr103404_place_3 = (cr103404_state[(1)]);
var cr103404_place_11 = cr103404_place_3;
var cr103404_place_12 = frontend.worker.device.new_get_ws_create_task;
var cr103404_place_13 = token;
var cr103404_place_14 = (function (){var G__103497 = cr103404_place_13;
var fexpr__103496 = cr103404_place_12;
return (fexpr__103496.cljs$core$IFn$_invoke$arity$1 ? fexpr__103496.cljs$core$IFn$_invoke$arity$1(G__103497) : fexpr__103496.call(null,G__103497));
})();
var cr103404_place_15 = frontend.worker.device.new_task__remove_user_device_STAR_;
var cr103404_place_16 = cr103404_place_14;
var cr103404_place_17 = cr103404_place_11;
var cr103404_place_18 = (function (){var G__103500 = cr103404_place_16;
var G__103501 = cr103404_place_17;
var fexpr__103498 = cr103404_place_15;
return (fexpr__103498.cljs$core$IFn$_invoke$arity$2 ? fexpr__103498.cljs$core$IFn$_invoke$arity$2(G__103500,G__103501) : fexpr__103498.call(null,G__103500,G__103501));
})();
(cr103404_state[(0)] = cr103404_block_6);

(cr103404_state[(1)] = null);

return missionary.core.park(cr103404_place_18);
}catch (e103493){var cr103404_exception = e103493;
(cr103404_state[(0)] = null);

(cr103404_state[(1)] = null);

(cr103404_state[(2)] = null);

throw cr103404_exception;
}});
var cr103404_block_6 = (function frontend$worker$device$new_task__remove_device_$_cr103404_block_6(cr103404_state){
try{var cr103404_place_19 = missionary.core.unpark();
(cr103404_state[(0)] = cr103404_block_7);

(cr103404_state[(2)] = cr103404_place_19);

return cr103404_state;
}catch (e103502){var cr103404_exception = e103502;
(cr103404_state[(0)] = null);

(cr103404_state[(2)] = null);

throw cr103404_exception;
}});
var cr103404_block_7 = (function frontend$worker$device$new_task__remove_device_$_cr103404_block_7(cr103404_state){
try{var cr103404_place_9 = (cr103404_state[(2)]);
(cr103404_state[(0)] = null);

(cr103404_state[(2)] = null);

return cr103404_place_9;
}catch (e103504){var cr103404_exception = e103504;
(cr103404_state[(0)] = null);

(cr103404_state[(2)] = null);

throw cr103404_exception;
}});
return cloroutine.impl.coroutine((function (){var G__103505 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__103505[(0)] = cr103404_block_0);

return G__103505;
})());
})(),missionary.core.sp_run);
});
frontend.worker.device.new_task__sync_current_graph_encrypted_aes_key = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key(token,device_uuids){
var repo = frontend.worker.state.get_current_repo();
if(((cljs.core.seq(device_uuids)) && (cljs.core.every_QMARK_(cljs.core.uuid_QMARK_,device_uuids)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(device_uuids),"\n","(and (seq device-uuids) (every? uuid? device-uuids))"].join('')));
}

return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr103514_block_8 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr103514_block_8(cr103514_state){
try{var cr103514_place_6 = (cr103514_state[(3)]);
var cr103514_place_26 = (cr103514_state[(6)]);
var cr103514_place_49 = missionary.core.unpark();
var cr103514_place_50 = frontend.worker.device.new_task__sync_encrypted_aes_key_STAR_;
var cr103514_place_51 = cr103514_place_26;
var cr103514_place_52 = cr103514_place_49;
var cr103514_place_53 = cr103514_place_6;
var cr103514_place_54 = (function (){var G__103870 = cr103514_place_51;
var G__103871 = cr103514_place_52;
var G__103872 = cr103514_place_53;
var fexpr__103869 = cr103514_place_50;
return (fexpr__103869.cljs$core$IFn$_invoke$arity$3 ? fexpr__103869.cljs$core$IFn$_invoke$arity$3(G__103870,G__103871,G__103872) : fexpr__103869.call(null,G__103870,G__103871,G__103872));
})();
(cr103514_state[(0)] = cr103514_block_9);

(cr103514_state[(3)] = null);

(cr103514_state[(6)] = null);

return missionary.core.park(cr103514_place_54);
}catch (e103865){var cr103514_exception = e103865;
(cr103514_state[(0)] = null);

(cr103514_state[(5)] = null);

(cr103514_state[(1)] = null);

(cr103514_state[(3)] = null);

(cr103514_state[(6)] = null);

(cr103514_state[(2)] = null);

throw cr103514_exception;
}});
var cr103514_block_12 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr103514_block_12(cr103514_state){
try{var cr103514_place_4 = (cr103514_state[(1)]);
(cr103514_state[(0)] = null);

(cr103514_state[(1)] = null);

return cr103514_place_4;
}catch (e103876){var cr103514_exception = e103876;
(cr103514_state[(0)] = null);

(cr103514_state[(1)] = null);

throw cr103514_exception;
}});
var cr103514_block_9 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr103514_block_9(cr103514_state){
try{var cr103514_place_55 = missionary.core.unpark();
(cr103514_state[(0)] = cr103514_block_10);

(cr103514_state[(5)] = cr103514_place_55);

return cr103514_state;
}catch (e103878){var cr103514_exception = e103878;
(cr103514_state[(0)] = null);

(cr103514_state[(5)] = null);

(cr103514_state[(1)] = null);

(cr103514_state[(2)] = null);

throw cr103514_exception;
}});
var cr103514_block_7 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr103514_block_7(cr103514_state){
try{var cr103514_place_20 = (cr103514_state[(4)]);
var cr103514_place_36 = (cr103514_state[(7)]);
var cr103514_place_40 = cr103514_place_36;
var cr103514_place_41 = cljs.core.apply;
var cr103514_place_42 = missionary.core.join;
var cr103514_place_43 = (function() { 
var G__104454__delegate = function (x){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,x);
};
var G__104454 = function (var_args){
var x = null;
if (arguments.length > 0) {
var G__104455__i = 0, G__104455__a = new Array(arguments.length -  0);
while (G__104455__i < G__104455__a.length) {G__104455__a[G__104455__i] = arguments[G__104455__i + 0]; ++G__104455__i;}
  x = new cljs.core.IndexedSeq(G__104455__a,0,null);
} 
return G__104454__delegate.call(this,x);};
G__104454.cljs$lang$maxFixedArity = 0;
G__104454.cljs$lang$applyTo = (function (arglist__104459){
var x = cljs.core.seq(arglist__104459);
return G__104454__delegate(x);
});
G__104454.cljs$core$IFn$_invoke$arity$variadic = G__104454__delegate;
return G__104454;
})()
;
var cr103514_place_44 = cljs.core.map;
var cr103514_place_45 = (function (device){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr103542_block_0 = (function (cr103542_state){
try{var cr103542_place_0 = frontend.common.missionary._LT__BANG_;
var cr103542_place_1 = frontend.worker.crypt._LT_import_public_key;
var cr103542_place_2 = cljs.core.clj__GT_js;
var cr103542_place_3 = logseq.db.read_transit_str;
var cr103542_place_4 = cljs.core.get_in;
var cr103542_place_5 = device;
var cr103542_place_6 = new cljs.core.Keyword(null,"keys","keys",1068423698);
var cr103542_place_7 = new cljs.core.Keyword(null,"default-public-key","default-public-key",-840305321);
var cr103542_place_8 = new cljs.core.Keyword(null,"public-key","public-key",-2106850051);
var cr103542_place_9 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr103542_place_6,cr103542_place_7,cr103542_place_8], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr103542_place_10 = (function (){var G__103618 = cr103542_place_5;
var G__103619 = cr103542_place_9;
var fexpr__103617 = cr103542_place_4;
var G__103908 = G__103618;
var G__103909 = G__103619;
var fexpr__103907 = fexpr__103617;
return (fexpr__103907.cljs$core$IFn$_invoke$arity$2 ? fexpr__103907.cljs$core$IFn$_invoke$arity$2(G__103908,G__103909) : fexpr__103907.call(null,G__103908,G__103909));
})();
var cr103542_place_11 = cr103542_place_3(cr103542_place_10);
var cr103542_place_12 = (function (){var G__103623 = cr103542_place_11;
var fexpr__103622 = cr103542_place_2;
var G__103912 = G__103623;
var fexpr__103911 = fexpr__103622;
return (fexpr__103911.cljs$core$IFn$_invoke$arity$1 ? fexpr__103911.cljs$core$IFn$_invoke$arity$1(G__103912) : fexpr__103911.call(null,G__103912));
})();
var cr103542_place_13 = (function (){var G__103625 = cr103542_place_12;
var fexpr__103624 = cr103542_place_1;
var G__103914 = G__103625;
var fexpr__103913 = fexpr__103624;
return (fexpr__103913.cljs$core$IFn$_invoke$arity$1 ? fexpr__103913.cljs$core$IFn$_invoke$arity$1(G__103914) : fexpr__103913.call(null,G__103914));
})();
var cr103542_place_14 = (function (){var G__103629 = cr103542_place_13;
var fexpr__103628 = cr103542_place_0;
var G__103917 = G__103629;
var fexpr__103916 = fexpr__103628;
return (fexpr__103916.cljs$core$IFn$_invoke$arity$1 ? fexpr__103916.cljs$core$IFn$_invoke$arity$1(G__103917) : fexpr__103916.call(null,G__103917));
})();
(cr103542_state[(0)] = cr103542_block_1);

return missionary.core.park(cr103542_place_14);
}catch (e103906){var e103615 = e103906;
var cr103542_exception = e103615;
(cr103542_state[(0)] = null);

throw cr103542_exception;
}});
var cr103542_block_1 = (function (cr103542_state){
try{var cr103542_place_15 = missionary.core.unpark();
var cr103542_place_16 = cljs.core.uuid;
var cr103542_place_17 = new cljs.core.Keyword(null,"device-id","device-id",1535359525);
var cr103542_place_18 = device;
var cr103542_place_19 = cr103542_place_17.cljs$core$IFn$_invoke$arity$1(cr103542_place_18);
var cr103542_place_20 = (function (){var G__103638 = cr103542_place_19;
var fexpr__103637 = cr103542_place_16;
var G__103921 = G__103638;
var fexpr__103920 = fexpr__103637;
return (fexpr__103920.cljs$core$IFn$_invoke$arity$1 ? fexpr__103920.cljs$core$IFn$_invoke$arity$1(G__103921) : fexpr__103920.call(null,G__103921));
})();
var cr103542_place_21 = goog.crypt.base64.encodeByteArray;
var cr103542_place_22 = frontend.common.missionary._LT__BANG_;
var cr103542_place_23 = frontend.worker.crypt._LT_rsa_encrypt;
var cr103542_place_24 = cr103514_place_20;
var cr103542_place_25 = cr103542_place_15;
var cr103542_place_26 = (function (){var G__103646 = cr103542_place_24;
var G__103647 = cr103542_place_25;
var fexpr__103645 = cr103542_place_23;
var G__103929 = G__103646;
var G__103930 = G__103647;
var fexpr__103928 = fexpr__103645;
return (fexpr__103928.cljs$core$IFn$_invoke$arity$2 ? fexpr__103928.cljs$core$IFn$_invoke$arity$2(G__103929,G__103930) : fexpr__103928.call(null,G__103929,G__103930));
})();
var cr103542_place_27 = (function (){var G__103651 = cr103542_place_26;
var fexpr__103650 = cr103542_place_22;
var G__103934 = G__103651;
var fexpr__103933 = fexpr__103650;
return (fexpr__103933.cljs$core$IFn$_invoke$arity$1 ? fexpr__103933.cljs$core$IFn$_invoke$arity$1(G__103934) : fexpr__103933.call(null,G__103934));
})();
(cr103542_state[(0)] = cr103542_block_2);

(cr103542_state[(1)] = cr103542_place_20);

(cr103542_state[(2)] = cr103542_place_21);

return missionary.core.park(cr103542_place_27);
}catch (e103919){var e103634 = e103919;
var cr103542_exception = e103634;
(cr103542_state[(0)] = null);

throw cr103542_exception;
}});
var cr103542_block_2 = (function (cr103542_state){
try{var cr103542_place_20 = (cr103542_state[(1)]);
var cr103542_place_21 = (cr103542_state[(2)]);
var cr103542_place_28 = missionary.core.unpark();
var cr103542_place_29 = (new Uint8Array(cr103542_place_28));
var cr103542_place_30 = (function (){var G__103660 = cr103542_place_29;
var fexpr__103659 = cr103542_place_21;
var G__103939 = G__103660;
var fexpr__103938 = fexpr__103659;
return (fexpr__103938.cljs$core$IFn$_invoke$arity$1 ? fexpr__103938.cljs$core$IFn$_invoke$arity$1(G__103939) : fexpr__103938.call(null,G__103939));
})();
var cr103542_place_31 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr103542_place_20,cr103542_place_30], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
(cr103542_state[(0)] = null);

(cr103542_state[(1)] = null);

(cr103542_state[(2)] = null);

return cr103542_place_31;
}catch (e103937){var e103658 = e103937;
var cr103542_exception = e103658;
(cr103542_state[(0)] = null);

(cr103542_state[(1)] = null);

(cr103542_state[(2)] = null);

throw cr103542_exception;
}});
return cloroutine.impl.coroutine((function (){var G__103667 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__103667[(0)] = cr103542_block_0);

return G__103667;
})());
})(),missionary.core.sp_run);
});
var cr103514_place_46 = cr103514_place_40;
var cr103514_place_47 = (function (){var G__103947 = cr103514_place_45;
var G__103948 = cr103514_place_46;
var fexpr__103946 = cr103514_place_44;
return (fexpr__103946.cljs$core$IFn$_invoke$arity$2 ? fexpr__103946.cljs$core$IFn$_invoke$arity$2(G__103947,G__103948) : fexpr__103946.call(null,G__103947,G__103948));
})();
var cr103514_place_48 = (function (){var G__103953 = cr103514_place_42;
var G__103954 = cr103514_place_43;
var G__103955 = cr103514_place_47;
var fexpr__103952 = cr103514_place_41;
return (fexpr__103952.cljs$core$IFn$_invoke$arity$3 ? fexpr__103952.cljs$core$IFn$_invoke$arity$3(G__103953,G__103954,G__103955) : fexpr__103952.call(null,G__103953,G__103954,G__103955));
})();
(cr103514_state[(0)] = cr103514_block_8);

(cr103514_state[(4)] = null);

(cr103514_state[(7)] = null);

return missionary.core.park(cr103514_place_48);
}catch (e103880){var cr103514_exception = e103880;
(cr103514_state[(0)] = null);

(cr103514_state[(5)] = null);

(cr103514_state[(1)] = null);

(cr103514_state[(3)] = null);

(cr103514_state[(4)] = null);

(cr103514_state[(6)] = null);

(cr103514_state[(2)] = null);

(cr103514_state[(7)] = null);

throw cr103514_exception;
}});
var cr103514_block_1 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr103514_block_1(cr103514_state){
try{var cr103514_place_5 = null;
(cr103514_state[(0)] = cr103514_block_12);

(cr103514_state[(1)] = cr103514_place_5);

return cr103514_state;
}catch (e103959){var cr103514_exception = e103959;
(cr103514_state[(0)] = null);

(cr103514_state[(1)] = null);

throw cr103514_exception;
}});
var cr103514_block_2 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr103514_block_2(cr103514_state){
try{var cr103514_place_2 = (cr103514_state[(2)]);
var cr103514_place_6 = cr103514_place_2;
var cr103514_place_7 = frontend.worker.crypt.get_graph_keys_jwk;
var cr103514_place_8 = repo;
var cr103514_place_9 = (function (){var G__103973 = cr103514_place_8;
var fexpr__103972 = cr103514_place_7;
return (fexpr__103972.cljs$core$IFn$_invoke$arity$1 ? fexpr__103972.cljs$core$IFn$_invoke$arity$1(G__103973) : fexpr__103972.call(null,G__103973));
})();
var cr103514_place_10 = cr103514_place_9;
var cr103514_place_11 = null;
if(cljs.core.truth_(cr103514_place_10)){
(cr103514_state[(0)] = cr103514_block_4);

(cr103514_state[(2)] = null);

(cr103514_state[(3)] = cr103514_place_6);

(cr103514_state[(4)] = cr103514_place_9);

(cr103514_state[(2)] = cr103514_place_11);

return cr103514_state;
} else {
(cr103514_state[(0)] = cr103514_block_3);

(cr103514_state[(2)] = null);

(cr103514_state[(2)] = cr103514_place_11);

return cr103514_state;
}
}catch (e103962){var cr103514_exception = e103962;
(cr103514_state[(0)] = null);

(cr103514_state[(1)] = null);

(cr103514_state[(2)] = null);

throw cr103514_exception;
}});
var cr103514_block_11 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr103514_block_11(cr103514_state){
try{var cr103514_place_11 = (cr103514_state[(2)]);
(cr103514_state[(0)] = cr103514_block_12);

(cr103514_state[(2)] = null);

(cr103514_state[(1)] = cr103514_place_11);

return cr103514_state;
}catch (e103980){var cr103514_exception = e103980;
(cr103514_state[(0)] = null);

(cr103514_state[(1)] = null);

(cr103514_state[(2)] = null);

throw cr103514_exception;
}});
var cr103514_block_10 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr103514_block_10(cr103514_state){
try{var cr103514_place_38 = (cr103514_state[(5)]);
(cr103514_state[(0)] = cr103514_block_11);

(cr103514_state[(5)] = null);

(cr103514_state[(2)] = cr103514_place_38);

return cr103514_state;
}catch (e103983){var cr103514_exception = e103983;
(cr103514_state[(0)] = null);

(cr103514_state[(5)] = null);

(cr103514_state[(1)] = null);

(cr103514_state[(2)] = null);

throw cr103514_exception;
}});
var cr103514_block_3 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr103514_block_3(cr103514_state){
try{var cr103514_place_12 = null;
(cr103514_state[(0)] = cr103514_block_11);

(cr103514_state[(2)] = cr103514_place_12);

return cr103514_state;
}catch (e103987){var cr103514_exception = e103987;
(cr103514_state[(0)] = null);

(cr103514_state[(1)] = null);

(cr103514_state[(2)] = null);

throw cr103514_exception;
}});
var cr103514_block_0 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr103514_block_0(cr103514_state){
try{var cr103514_place_0 = frontend.worker.rtc.client_op.get_graph_uuid;
var cr103514_place_1 = repo;
var cr103514_place_2 = (function (){var G__103996 = cr103514_place_1;
var fexpr__103995 = cr103514_place_0;
return (fexpr__103995.cljs$core$IFn$_invoke$arity$1 ? fexpr__103995.cljs$core$IFn$_invoke$arity$1(G__103996) : fexpr__103995.call(null,G__103996));
})();
var cr103514_place_3 = cr103514_place_2;
var cr103514_place_4 = null;
if(cljs.core.truth_(cr103514_place_3)){
(cr103514_state[(0)] = cr103514_block_2);

(cr103514_state[(2)] = cr103514_place_2);

(cr103514_state[(1)] = cr103514_place_4);

return cr103514_state;
} else {
(cr103514_state[(0)] = cr103514_block_1);

(cr103514_state[(1)] = cr103514_place_4);

return cr103514_state;
}
}catch (e103994){var cr103514_exception = e103994;
(cr103514_state[(0)] = null);

throw cr103514_exception;
}});
var cr103514_block_6 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr103514_block_6(cr103514_state){
try{var cr103514_place_39 = null;
(cr103514_state[(0)] = cr103514_block_10);

(cr103514_state[(5)] = cr103514_place_39);

return cr103514_state;
}catch (e104001){var cr103514_exception = e104001;
(cr103514_state[(0)] = null);

(cr103514_state[(5)] = null);

(cr103514_state[(1)] = null);

(cr103514_state[(2)] = null);

throw cr103514_exception;
}});
var cr103514_block_4 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr103514_block_4(cr103514_state){
try{var cr103514_place_9 = (cr103514_state[(4)]);
var cr103514_place_13 = cr103514_place_9;
var cr103514_place_14 = cljs.core.__destructure_map;
var cr103514_place_15 = cr103514_place_13;
var cr103514_place_16 = (function (){var G__104023 = cr103514_place_15;
var fexpr__104022 = cr103514_place_14;
return (fexpr__104022.cljs$core$IFn$_invoke$arity$1 ? fexpr__104022.cljs$core$IFn$_invoke$arity$1(G__104023) : fexpr__104022.call(null,G__104023));
})();
var cr103514_place_17 = cljs.core.get;
var cr103514_place_18 = cr103514_place_16;
var cr103514_place_19 = new cljs.core.Keyword(null,"aes-key-jwk","aes-key-jwk",967413902);
var cr103514_place_20 = (function (){var G__104025 = cr103514_place_18;
var G__104026 = cr103514_place_19;
var fexpr__104024 = cr103514_place_17;
return (fexpr__104024.cljs$core$IFn$_invoke$arity$2 ? fexpr__104024.cljs$core$IFn$_invoke$arity$2(G__104025,G__104026) : fexpr__104024.call(null,G__104025,G__104026));
})();
var cr103514_place_21 = cljs.core.set;
var cr103514_place_22 = device_uuids;
var cr103514_place_23 = (function (){var G__104030 = cr103514_place_22;
var fexpr__104029 = cr103514_place_21;
return (fexpr__104029.cljs$core$IFn$_invoke$arity$1 ? fexpr__104029.cljs$core$IFn$_invoke$arity$1(G__104030) : fexpr__104029.call(null,G__104030));
})();
var cr103514_place_24 = frontend.worker.device.new_get_ws_create_task;
var cr103514_place_25 = token;
var cr103514_place_26 = (function (){var G__104032 = cr103514_place_25;
var fexpr__104031 = cr103514_place_24;
return (fexpr__104031.cljs$core$IFn$_invoke$arity$1 ? fexpr__104031.cljs$core$IFn$_invoke$arity$1(G__104032) : fexpr__104031.call(null,G__104032));
})();
var cr103514_place_27 = frontend.worker.device.new_task__get_user_devices;
var cr103514_place_28 = cr103514_place_26;
var cr103514_place_29 = (function (){var G__104038 = cr103514_place_28;
var fexpr__104036 = cr103514_place_27;
return (fexpr__104036.cljs$core$IFn$_invoke$arity$1 ? fexpr__104036.cljs$core$IFn$_invoke$arity$1(G__104038) : fexpr__104036.call(null,G__104038));
})();
(cr103514_state[(0)] = cr103514_block_5);

(cr103514_state[(4)] = null);

(cr103514_state[(4)] = cr103514_place_20);

(cr103514_state[(5)] = cr103514_place_23);

(cr103514_state[(6)] = cr103514_place_26);

return missionary.core.park(cr103514_place_29);
}catch (e104008){var cr103514_exception = e104008;
(cr103514_state[(0)] = null);

(cr103514_state[(1)] = null);

(cr103514_state[(3)] = null);

(cr103514_state[(4)] = null);

(cr103514_state[(2)] = null);

throw cr103514_exception;
}});
var cr103514_block_5 = (function frontend$worker$device$new_task__sync_current_graph_encrypted_aes_key_$_cr103514_block_5(cr103514_state){
try{var cr103514_place_23 = (cr103514_state[(5)]);
var cr103514_place_30 = missionary.core.unpark();
var cr103514_place_31 = cljs.core.not_empty;
var cr103514_place_32 = cljs.core.filter;
var cr103514_place_33 = (function (device){
return ((cljs.core.contains_QMARK_(cr103514_place_23,cljs.core.uuid(new cljs.core.Keyword(null,"device-id","device-id",1535359525).cljs$core$IFn$_invoke$arity$1(device)))) && (cljs.core.not((cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(device,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"keys","keys",1068423698),new cljs.core.Keyword(null,"default-public-key","default-public-key",-840305321)], null)) == null))));
});
var cr103514_place_34 = cr103514_place_30;
var cr103514_place_35 = (function (){var G__104052 = cr103514_place_33;
var G__104053 = cr103514_place_34;
var fexpr__104051 = cr103514_place_32;
return (fexpr__104051.cljs$core$IFn$_invoke$arity$2 ? fexpr__104051.cljs$core$IFn$_invoke$arity$2(G__104052,G__104053) : fexpr__104051.call(null,G__104052,G__104053));
})();
var cr103514_place_36 = (function (){var G__104058 = cr103514_place_35;
var fexpr__104057 = cr103514_place_31;
return (fexpr__104057.cljs$core$IFn$_invoke$arity$1 ? fexpr__104057.cljs$core$IFn$_invoke$arity$1(G__104058) : fexpr__104057.call(null,G__104058));
})();
var cr103514_place_37 = cr103514_place_36;
var cr103514_place_38 = null;
if(cljs.core.truth_(cr103514_place_37)){
(cr103514_state[(0)] = cr103514_block_7);

(cr103514_state[(5)] = null);

(cr103514_state[(5)] = cr103514_place_38);

(cr103514_state[(7)] = cr103514_place_36);

return cr103514_state;
} else {
(cr103514_state[(0)] = cr103514_block_6);

(cr103514_state[(3)] = null);

(cr103514_state[(4)] = null);

(cr103514_state[(5)] = null);

(cr103514_state[(6)] = null);

(cr103514_state[(5)] = cr103514_place_38);

return cr103514_state;
}
}catch (e104041){var cr103514_exception = e104041;
(cr103514_state[(0)] = null);

(cr103514_state[(1)] = null);

(cr103514_state[(3)] = null);

(cr103514_state[(4)] = null);

(cr103514_state[(5)] = null);

(cr103514_state[(6)] = null);

(cr103514_state[(2)] = null);

throw cr103514_exception;
}});
return cloroutine.impl.coroutine((function (){var G__104061 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((8));
(G__104061[(0)] = cr103514_block_0);

return G__104061;
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
