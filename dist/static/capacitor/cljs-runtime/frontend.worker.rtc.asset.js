goog.provide('frontend.worker.rtc.asset');
/**
 * Return a flow that emits value if need to push local-updates
 */
frontend.worker.rtc.asset.create_local_updates_check_flow = (function frontend$worker$rtc$asset$create_local_updates_check_flow(repo,_STAR_auto_push_QMARK_,interval_ms){
var auto_push_flow = missionary.core.watch(_STAR_auto_push_QMARK_);
var clock_flow = frontend.common.missionary.clock.cljs$core$IFn$_invoke$arity$2(interval_ms,new cljs.core.Keyword(null,"clock","clock",-894301127));
var merge_flow = missionary.core.latest.cljs$core$IFn$_invoke$arity$variadic(cljs.core.vector,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([auto_push_flow,clock_flow], 0));
return missionary.core.eduction.cljs$core$IFn$_invoke$arity$variadic(cljs.core.filter.cljs$core$IFn$_invoke$arity$1(cljs.core.first),cljs.core.map.cljs$core$IFn$_invoke$arity$1(cljs.core.second),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.filter.cljs$core$IFn$_invoke$arity$1((function (v){
if((frontend.worker.rtc.client_op.get_unpushed_asset_ops_count(repo) > (0))){
return v;
} else {
return null;
}
})),merge_flow], 0));
});
frontend.worker.rtc.asset.remote_asset_updates_schema = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sequential","sequential",-1082983960),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"closed","closed",-919675359),true], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"enum","enum",1679018432),new cljs.core.Keyword(null,"update-asset","update-asset",501550582),new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("malli.core","default","malli.core/default",-1706204176),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map-of","map-of",1189682355),new cljs.core.Keyword(null,"keyword","keyword",811389747),new cljs.core.Keyword(null,"any","any",1705907423)], null)], null)], null)], null);
frontend.worker.rtc.asset._STAR_remote_asset_updates = cljs.core.atom.cljs$core$IFn$_invoke$arity$variadic(null,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"validator","validator",-1966190681),malli.core.validator.cljs$core$IFn$_invoke$arity$1(frontend.worker.rtc.asset.remote_asset_updates_schema)], 0));
frontend.worker.rtc.asset.remote_asset_updates_flow = missionary.core.buffer((10),missionary.core.watch(frontend.worker.rtc.asset._STAR_remote_asset_updates));
/**
 * Return nil if this asset not exist
 */
frontend.worker.rtc.asset.new_task__get_asset_file_metadata = (function frontend$worker$rtc$asset$new_task__get_asset_file_metadata(repo,block_uuid,asset_type){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr134049_block_0 = (function frontend$worker$rtc$asset$new_task__get_asset_file_metadata_$_cr134049_block_0(cr134049_state){
try{var cr134049_place_0 = frontend.common.missionary._LT__BANG_;
var cr134049_place_1 = frontend.worker.state._LT_invoke_main_thread;
var cr134049_place_2 = new cljs.core.Keyword("thread-api","get-asset-file-metadata","thread-api/get-asset-file-metadata",1768768708);
var cr134049_place_3 = repo;
var cr134049_place_4 = block_uuid;
var cr134049_place_5 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr134049_place_4);
var cr134049_place_6 = asset_type;
var cr134049_place_7 = (function (){var G__134099 = cr134049_place_2;
var G__134100 = cr134049_place_3;
var G__134101 = cr134049_place_5;
var G__134102 = cr134049_place_6;
var fexpr__134098 = cr134049_place_1;
return (fexpr__134098.cljs$core$IFn$_invoke$arity$4 ? fexpr__134098.cljs$core$IFn$_invoke$arity$4(G__134099,G__134100,G__134101,G__134102) : fexpr__134098.call(null,G__134099,G__134100,G__134101,G__134102));
})();
var cr134049_place_8 = (function (){var G__134105 = cr134049_place_7;
var fexpr__134104 = cr134049_place_0;
return (fexpr__134104.cljs$core$IFn$_invoke$arity$1 ? fexpr__134104.cljs$core$IFn$_invoke$arity$1(G__134105) : fexpr__134104.call(null,G__134105));
})();
(cr134049_state[(0)] = cr134049_block_1);

return missionary.core.park(cr134049_place_8);
}catch (e134096){var cr134049_exception = e134096;
(cr134049_state[(0)] = null);

throw cr134049_exception;
}});
var cr134049_block_1 = (function frontend$worker$rtc$asset$new_task__get_asset_file_metadata_$_cr134049_block_1(cr134049_state){
try{var cr134049_place_9 = missionary.core.unpark();
(cr134049_state[(0)] = null);

return cr134049_place_9;
}catch (e134107){var cr134049_exception = e134107;
(cr134049_state[(0)] = null);

throw cr134049_exception;
}});
return cloroutine.impl.coroutine((function (){var G__134108 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__134108[(0)] = cr134049_block_0);

return G__134108;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.asset.remote_block_ops_EQ__GT_remote_asset_ops = (function frontend$worker$rtc$asset$remote_block_ops_EQ__GT_remote_asset_ops(db_before,remove_ops){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (remove_op){
var block_uuid = new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(remove_op);
var temp__5804__auto__ = (function (){var G__134115 = db_before;
var G__134116 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__134115,G__134116) : datascript.core.entity.call(null,G__134115,G__134116));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var ent = temp__5804__auto__;
var temp__5804__auto____$1 = new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098).cljs$core$IFn$_invoke$arity$1(ent);
if(cljs.core.truth_(temp__5804__auto____$1)){
var asset_type = temp__5804__auto____$1;
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid,new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098),asset_type], null);
} else {
return null;
}
} else {
return null;
}
}),remove_ops);
});
frontend.worker.rtc.asset.emit_remote_asset_updates_from_block_ops = (function frontend$worker$rtc$asset$emit_remote_asset_updates_from_block_ops(db_before,remove_ops){
var temp__5804__auto__ = cljs.core.not_empty(frontend.worker.rtc.asset.remote_block_ops_EQ__GT_remote_asset_ops(db_before,remove_ops));
if(cljs.core.truth_(temp__5804__auto__)){
var asset_update_ops = temp__5804__auto__;
return cljs.core.reset_BANG_(frontend.worker.rtc.asset._STAR_remote_asset_updates,asset_update_ops);
} else {
return null;
}
});
frontend.worker.rtc.asset.new_task__emit_remote_asset_updates_from_push_asset_upload_updates = (function frontend$worker$rtc$asset$new_task__emit_remote_asset_updates_from_push_asset_upload_updates(repo,db,push_asset_upload_updates_message){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr134121_block_0 = (function frontend$worker$rtc$asset$new_task__emit_remote_asset_updates_from_push_asset_upload_updates_$_cr134121_block_0(cr134121_state){
try{var cr134121_place_0 = push_asset_upload_updates_message;
var cr134121_place_1 = cljs.core.__destructure_map;
var cr134121_place_2 = cr134121_place_0;
var cr134121_place_3 = (function (){var G__134944 = cr134121_place_2;
var fexpr__134943 = cr134121_place_1;
return (fexpr__134943.cljs$core$IFn$_invoke$arity$1 ? fexpr__134943.cljs$core$IFn$_invoke$arity$1(G__134944) : fexpr__134943.call(null,G__134944));
})();
var cr134121_place_4 = cljs.core.get;
var cr134121_place_5 = cr134121_place_3;
var cr134121_place_6 = new cljs.core.Keyword(null,"uploaded-assets","uploaded-assets",1193992244);
var cr134121_place_7 = (function (){var G__134952 = cr134121_place_5;
var G__134953 = cr134121_place_6;
var fexpr__134951 = cr134121_place_4;
return (fexpr__134951.cljs$core$IFn$_invoke$arity$2 ? fexpr__134951.cljs$core$IFn$_invoke$arity$2(G__134952,G__134953) : fexpr__134951.call(null,G__134952,G__134953));
})();
var cr134121_place_8 = cljs.core.not_empty;
var cr134121_place_9 = cljs.core.remove;
var cr134121_place_10 = cljs.core.nil_QMARK_;
var cr134121_place_11 = cljs.core.apply;
var cr134121_place_12 = missionary.core.join;
var cr134121_place_13 = cljs.core.vector;
var cr134121_place_14 = cljs.core.map;
var cr134121_place_15 = (function (p__134127){
var vec__134128 = p__134127;
var asset_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134128,(0),null);
var remote_metadata = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134128,(1),null);
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr134132_block_5 = (function (cr134132_state){
try{var cr134132_place_24 = (cr134132_state[(5)]);
(cr134132_state[(0)] = cr134132_block_6);

(cr134132_state[(5)] = null);

(cr134132_state[(2)] = cr134132_place_24);

return cr134132_state;
}catch (e135074){var e134322 = e135074;
var cr134132_exception = e134322;
(cr134132_state[(0)] = null);

(cr134132_state[(2)] = null);

(cr134132_state[(3)] = null);

(cr134132_state[(5)] = null);

throw cr134132_exception;
}});
var cr134132_block_11 = (function (cr134132_state){
try{var cr134132_place_34 = (cr134132_state[(4)]);
(cr134132_state[(0)] = cr134132_block_13);

(cr134132_state[(4)] = null);

(cr134132_state[(1)] = cr134132_place_34);

return cr134132_state;
}catch (e135076){var e134330 = e135076;
var cr134132_exception = e134330;
(cr134132_state[(0)] = null);

(cr134132_state[(4)] = null);

(cr134132_state[(1)] = null);

throw cr134132_exception;
}});
var cr134132_block_0 = (function (cr134132_state){
try{var cr134132_place_0 = db;
var cr134132_place_1 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552);
var cr134132_place_2 = asset_uuid;
var cr134132_place_3 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr134132_place_1,cr134132_place_2], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr134132_place_4 = datascript.core.entity;
var cr134132_place_5 = cr134132_place_0;
var cr134132_place_6 = cr134132_place_3;
var cr134132_place_7 = (function (){var G__134338 = cr134132_place_5;
var G__134339 = cr134132_place_6;
var fexpr__134337 = cr134132_place_4;
var G__135080 = G__134338;
var G__135081 = G__134339;
var fexpr__135079 = fexpr__134337;
return (fexpr__135079.cljs$core$IFn$_invoke$arity$2 ? fexpr__135079.cljs$core$IFn$_invoke$arity$2(G__135080,G__135081) : fexpr__135079.call(null,G__135080,G__135081));
})();
var cr134132_place_8 = new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098);
var cr134132_place_9 = cr134132_place_7;
var cr134132_place_10 = cr134132_place_8.cljs$core$IFn$_invoke$arity$1(cr134132_place_9);
var cr134132_place_11 = new cljs.core.Keyword("logseq.property.asset","checksum","logseq.property.asset/checksum",-1011416979);
var cr134132_place_12 = cr134132_place_7;
var cr134132_place_13 = cr134132_place_11.cljs$core$IFn$_invoke$arity$1(cr134132_place_12);
var cr134132_place_14 = cljs.core.get;
var cr134132_place_15 = remote_metadata;
var cr134132_place_16 = "checksum";
var cr134132_place_17 = (function (){var G__134341 = cr134132_place_15;
var G__134342 = cr134132_place_16;
var fexpr__134340 = cr134132_place_14;
var G__135086 = G__134341;
var G__135087 = G__134342;
var fexpr__135085 = fexpr__134340;
return (fexpr__135085.cljs$core$IFn$_invoke$arity$2 ? fexpr__135085.cljs$core$IFn$_invoke$arity$2(G__135086,G__135087) : fexpr__135085.call(null,G__135086,G__135087));
})();
var cr134132_place_18 = cr134132_place_13;
var cr134132_place_19 = cr134132_place_18;
var cr134132_place_20 = null;
if(cljs.core.truth_(cr134132_place_19)){
(cr134132_state[(0)] = cr134132_block_2);

(cr134132_state[(1)] = cr134132_place_13);

(cr134132_state[(2)] = cr134132_place_20);

(cr134132_state[(3)] = cr134132_place_10);

(cr134132_state[(4)] = cr134132_place_17);

return cr134132_state;
} else {
(cr134132_state[(0)] = cr134132_block_1);

(cr134132_state[(1)] = cr134132_place_18);

(cr134132_state[(2)] = cr134132_place_20);

(cr134132_state[(3)] = cr134132_place_10);

return cr134132_state;
}
}catch (e135078){var e134335 = e135078;
var cr134132_exception = e134335;
(cr134132_state[(0)] = null);

throw cr134132_exception;
}});
var cr134132_block_14 = (function (cr134132_state){
try{var cr134132_place_46 = null;
(cr134132_state[(0)] = cr134132_block_16);

(cr134132_state[(1)] = cr134132_place_46);

return cr134132_state;
}catch (e135090){var e134346 = e135090;
var cr134132_exception = e134346;
(cr134132_state[(0)] = null);

(cr134132_state[(1)] = null);

throw cr134132_exception;
}});
var cr134132_block_1 = (function (cr134132_state){
try{var cr134132_place_18 = (cr134132_state[(1)]);
var cr134132_place_21 = cr134132_place_18;
(cr134132_state[(0)] = cr134132_block_6);

(cr134132_state[(1)] = null);

(cr134132_state[(2)] = cr134132_place_21);

return cr134132_state;
}catch (e135091){var e134352 = e135091;
var cr134132_exception = e134352;
(cr134132_state[(0)] = null);

(cr134132_state[(1)] = null);

(cr134132_state[(2)] = null);

(cr134132_state[(3)] = null);

throw cr134132_exception;
}});
var cr134132_block_9 = (function (cr134132_state){
try{var cr134132_place_10 = (cr134132_state[(3)]);
var cr134132_place_36 = frontend.worker.rtc.asset.new_task__get_asset_file_metadata;
var cr134132_place_37 = repo;
var cr134132_place_38 = asset_uuid;
var cr134132_place_39 = cr134132_place_10;
var cr134132_place_40 = (function (){var G__134360 = cr134132_place_37;
var G__134361 = cr134132_place_38;
var G__134362 = cr134132_place_39;
var fexpr__134359 = cr134132_place_36;
var G__135095 = G__134360;
var G__135096 = G__134361;
var G__135097 = G__134362;
var fexpr__135094 = fexpr__134359;
return (fexpr__135094.cljs$core$IFn$_invoke$arity$3 ? fexpr__135094.cljs$core$IFn$_invoke$arity$3(G__135095,G__135096,G__135097) : fexpr__135094.call(null,G__135095,G__135096,G__135097));
})();
(cr134132_state[(0)] = cr134132_block_10);

(cr134132_state[(3)] = null);

return missionary.core.park(cr134132_place_40);
}catch (e135093){var e134355 = e135093;
var cr134132_exception = e134355;
(cr134132_state[(0)] = null);

(cr134132_state[(3)] = null);

(cr134132_state[(4)] = null);

(cr134132_state[(1)] = null);

throw cr134132_exception;
}});
var cr134132_block_2 = (function (cr134132_state){
try{var cr134132_place_17 = (cr134132_state[(4)]);
var cr134132_place_22 = cr134132_place_17;
var cr134132_place_23 = cr134132_place_22;
var cr134132_place_24 = null;
if(cljs.core.truth_(cr134132_place_23)){
(cr134132_state[(0)] = cr134132_block_4);

(cr134132_state[(5)] = cr134132_place_24);

return cr134132_state;
} else {
(cr134132_state[(0)] = cr134132_block_3);

(cr134132_state[(1)] = null);

(cr134132_state[(4)] = null);

(cr134132_state[(1)] = cr134132_place_22);

(cr134132_state[(5)] = cr134132_place_24);

return cr134132_state;
}
}catch (e135100){var e134366 = e135100;
var cr134132_exception = e134366;
(cr134132_state[(0)] = null);

(cr134132_state[(1)] = null);

(cr134132_state[(2)] = null);

(cr134132_state[(3)] = null);

(cr134132_state[(4)] = null);

throw cr134132_exception;
}});
var cr134132_block_13 = (function (cr134132_state){
try{var cr134132_place_31 = (cr134132_state[(1)]);
var cr134132_place_45 = null;
if(cljs.core.truth_(cr134132_place_31)){
(cr134132_state[(0)] = cr134132_block_15);

(cr134132_state[(1)] = null);

(cr134132_state[(1)] = cr134132_place_45);

return cr134132_state;
} else {
(cr134132_state[(0)] = cr134132_block_14);

(cr134132_state[(1)] = null);

(cr134132_state[(1)] = cr134132_place_45);

return cr134132_state;
}
}catch (e135102){var e134378 = e135102;
var cr134132_exception = e134378;
(cr134132_state[(0)] = null);

(cr134132_state[(1)] = null);

throw cr134132_exception;
}});
var cr134132_block_3 = (function (cr134132_state){
try{var cr134132_place_22 = (cr134132_state[(1)]);
var cr134132_place_25 = cr134132_place_22;
(cr134132_state[(0)] = cr134132_block_5);

(cr134132_state[(1)] = null);

(cr134132_state[(5)] = cr134132_place_25);

return cr134132_state;
}catch (e135104){var e134386 = e135104;
var cr134132_exception = e134386;
(cr134132_state[(0)] = null);

(cr134132_state[(1)] = null);

(cr134132_state[(2)] = null);

(cr134132_state[(3)] = null);

(cr134132_state[(5)] = null);

throw cr134132_exception;
}});
var cr134132_block_15 = (function (cr134132_state){
try{var cr134132_place_47 = new cljs.core.Keyword(null,"op","op",-1882987955);
var cr134132_place_48 = new cljs.core.Keyword(null,"update-asset","update-asset",501550582);
var cr134132_place_49 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552);
var cr134132_place_50 = asset_uuid;
var cr134132_place_51 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr134132_place_47,cr134132_place_48,cr134132_place_49,cr134132_place_50]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
(cr134132_state[(0)] = cr134132_block_16);

(cr134132_state[(1)] = cr134132_place_51);

return cr134132_state;
}catch (e135112){var e134392 = e135112;
var cr134132_exception = e134392;
(cr134132_state[(0)] = null);

(cr134132_state[(1)] = null);

throw cr134132_exception;
}});
var cr134132_block_16 = (function (cr134132_state){
try{var cr134132_place_45 = (cr134132_state[(1)]);
(cr134132_state[(0)] = null);

(cr134132_state[(1)] = null);

return cr134132_place_45;
}catch (e135120){var e134402 = e135120;
var cr134132_exception = e134402;
(cr134132_state[(0)] = null);

(cr134132_state[(1)] = null);

throw cr134132_exception;
}});
var cr134132_block_4 = (function (cr134132_state){
try{var cr134132_place_13 = (cr134132_state[(1)]);
var cr134132_place_17 = (cr134132_state[(4)]);
var cr134132_place_26 = cljs.core.not_EQ_;
var cr134132_place_27 = cr134132_place_13;
var cr134132_place_28 = cr134132_place_17;
var cr134132_place_29 = (function (){var G__134415 = cr134132_place_27;
var G__134416 = cr134132_place_28;
var fexpr__134414 = cr134132_place_26;
var G__135130 = G__134415;
var G__135131 = G__134416;
var fexpr__135129 = fexpr__134414;
return (fexpr__135129.cljs$core$IFn$_invoke$arity$2 ? fexpr__135129.cljs$core$IFn$_invoke$arity$2(G__135130,G__135131) : fexpr__135129.call(null,G__135130,G__135131));
})();
(cr134132_state[(0)] = cr134132_block_5);

(cr134132_state[(1)] = null);

(cr134132_state[(4)] = null);

(cr134132_state[(5)] = cr134132_place_29);

return cr134132_state;
}catch (e135125){var e134404 = e135125;
var cr134132_exception = e134404;
(cr134132_state[(0)] = null);

(cr134132_state[(1)] = null);

(cr134132_state[(2)] = null);

(cr134132_state[(3)] = null);

(cr134132_state[(5)] = null);

(cr134132_state[(4)] = null);

throw cr134132_exception;
}});
var cr134132_block_12 = (function (cr134132_state){
try{var cr134132_place_20 = (cr134132_state[(2)]);
var cr134132_place_44 = cr134132_place_20;
(cr134132_state[(0)] = cr134132_block_13);

(cr134132_state[(2)] = null);

(cr134132_state[(1)] = cr134132_place_44);

return cr134132_state;
}catch (e135135){var e134427 = e135135;
var cr134132_exception = e134427;
(cr134132_state[(0)] = null);

(cr134132_state[(2)] = null);

(cr134132_state[(1)] = null);

throw cr134132_exception;
}});
var cr134132_block_6 = (function (cr134132_state){
try{var cr134132_place_20 = (cr134132_state[(2)]);
var cr134132_place_30 = cr134132_place_20;
var cr134132_place_31 = null;
if(cljs.core.truth_(cr134132_place_30)){
(cr134132_state[(0)] = cr134132_block_12);

(cr134132_state[(3)] = null);

(cr134132_state[(1)] = cr134132_place_31);

return cr134132_state;
} else {
(cr134132_state[(0)] = cr134132_block_7);

(cr134132_state[(2)] = null);

(cr134132_state[(1)] = cr134132_place_31);

return cr134132_state;
}
}catch (e135144){var e134436 = e135144;
var cr134132_exception = e134436;
(cr134132_state[(0)] = null);

(cr134132_state[(2)] = null);

(cr134132_state[(3)] = null);

throw cr134132_exception;
}});
var cr134132_block_10 = (function (cr134132_state){
try{var cr134132_place_41 = missionary.core.unpark();
var cr134132_place_42 = null;
var cr134132_place_43 = (cr134132_place_41 == cr134132_place_42);
(cr134132_state[(0)] = cr134132_block_11);

(cr134132_state[(4)] = cr134132_place_43);

return cr134132_state;
}catch (e135162){var e134443 = e135162;
var cr134132_exception = e134443;
(cr134132_state[(0)] = null);

(cr134132_state[(4)] = null);

(cr134132_state[(1)] = null);

throw cr134132_exception;
}});
var cr134132_block_7 = (function (cr134132_state){
try{var cr134132_place_10 = (cr134132_state[(3)]);
var cr134132_place_32 = cr134132_place_10;
var cr134132_place_33 = cr134132_place_32;
var cr134132_place_34 = null;
if(cljs.core.truth_(cr134132_place_33)){
(cr134132_state[(0)] = cr134132_block_9);

(cr134132_state[(4)] = cr134132_place_34);

return cr134132_state;
} else {
(cr134132_state[(0)] = cr134132_block_8);

(cr134132_state[(3)] = null);

(cr134132_state[(2)] = cr134132_place_32);

(cr134132_state[(4)] = cr134132_place_34);

return cr134132_state;
}
}catch (e135165){var e134451 = e135165;
var cr134132_exception = e134451;
(cr134132_state[(0)] = null);

(cr134132_state[(3)] = null);

(cr134132_state[(1)] = null);

throw cr134132_exception;
}});
var cr134132_block_8 = (function (cr134132_state){
try{var cr134132_place_32 = (cr134132_state[(2)]);
var cr134132_place_35 = cr134132_place_32;
(cr134132_state[(0)] = cr134132_block_11);

(cr134132_state[(2)] = null);

(cr134132_state[(4)] = cr134132_place_35);

return cr134132_state;
}catch (e135171){var e134456 = e135171;
var cr134132_exception = e134456;
(cr134132_state[(0)] = null);

(cr134132_state[(2)] = null);

(cr134132_state[(4)] = null);

(cr134132_state[(1)] = null);

throw cr134132_exception;
}});
return cloroutine.impl.coroutine((function (){var G__134461 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((6));
(G__134461[(0)] = cr134132_block_0);

return G__134461;
})());
})(),missionary.core.sp_run);
});
var cr134121_place_16 = cr134121_place_7;
var cr134121_place_17 = (function (){var G__135177 = cr134121_place_15;
var G__135178 = cr134121_place_16;
var fexpr__135176 = cr134121_place_14;
return (fexpr__135176.cljs$core$IFn$_invoke$arity$2 ? fexpr__135176.cljs$core$IFn$_invoke$arity$2(G__135177,G__135178) : fexpr__135176.call(null,G__135177,G__135178));
})();
var cr134121_place_18 = (function (){var G__135183 = cr134121_place_12;
var G__135184 = cr134121_place_13;
var G__135185 = cr134121_place_17;
var fexpr__135182 = cr134121_place_11;
return (fexpr__135182.cljs$core$IFn$_invoke$arity$3 ? fexpr__135182.cljs$core$IFn$_invoke$arity$3(G__135183,G__135184,G__135185) : fexpr__135182.call(null,G__135183,G__135184,G__135185));
})();
(cr134121_state[(0)] = cr134121_block_1);

(cr134121_state[(1)] = cr134121_place_8);

(cr134121_state[(2)] = cr134121_place_10);

(cr134121_state[(3)] = cr134121_place_9);

return missionary.core.park(cr134121_place_18);
}catch (e134938){var cr134121_exception = e134938;
(cr134121_state[(0)] = null);

throw cr134121_exception;
}});
var cr134121_block_1 = (function frontend$worker$rtc$asset$new_task__emit_remote_asset_updates_from_push_asset_upload_updates_$_cr134121_block_1(cr134121_state){
try{var cr134121_place_8 = (cr134121_state[(1)]);
var cr134121_place_10 = (cr134121_state[(2)]);
var cr134121_place_9 = (cr134121_state[(3)]);
var cr134121_place_19 = missionary.core.unpark();
var cr134121_place_20 = (function (){var G__135193 = cr134121_place_10;
var G__135194 = cr134121_place_19;
var fexpr__135192 = cr134121_place_9;
return (fexpr__135192.cljs$core$IFn$_invoke$arity$2 ? fexpr__135192.cljs$core$IFn$_invoke$arity$2(G__135193,G__135194) : fexpr__135192.call(null,G__135193,G__135194));
})();
var cr134121_place_21 = (function (){var G__135196 = cr134121_place_20;
var fexpr__135195 = cr134121_place_8;
return (fexpr__135195.cljs$core$IFn$_invoke$arity$1 ? fexpr__135195.cljs$core$IFn$_invoke$arity$1(G__135196) : fexpr__135195.call(null,G__135196));
})();
var cr134121_place_22 = cr134121_place_21;
var cr134121_place_23 = null;
if(cljs.core.truth_(cr134121_place_22)){
(cr134121_state[(0)] = cr134121_block_3);

(cr134121_state[(1)] = null);

(cr134121_state[(2)] = null);

(cr134121_state[(3)] = null);

(cr134121_state[(2)] = cr134121_place_21);

(cr134121_state[(1)] = cr134121_place_23);

return cr134121_state;
} else {
(cr134121_state[(0)] = cr134121_block_2);

(cr134121_state[(1)] = null);

(cr134121_state[(2)] = null);

(cr134121_state[(3)] = null);

(cr134121_state[(1)] = cr134121_place_23);

return cr134121_state;
}
}catch (e135188){var cr134121_exception = e135188;
(cr134121_state[(0)] = null);

(cr134121_state[(1)] = null);

(cr134121_state[(2)] = null);

(cr134121_state[(3)] = null);

throw cr134121_exception;
}});
var cr134121_block_2 = (function frontend$worker$rtc$asset$new_task__emit_remote_asset_updates_from_push_asset_upload_updates_$_cr134121_block_2(cr134121_state){
try{var cr134121_place_24 = null;
(cr134121_state[(0)] = cr134121_block_4);

(cr134121_state[(1)] = cr134121_place_24);

return cr134121_state;
}catch (e135205){var cr134121_exception = e135205;
(cr134121_state[(0)] = null);

(cr134121_state[(1)] = null);

throw cr134121_exception;
}});
var cr134121_block_3 = (function frontend$worker$rtc$asset$new_task__emit_remote_asset_updates_from_push_asset_upload_updates_$_cr134121_block_3(cr134121_state){
try{var cr134121_place_21 = (cr134121_state[(2)]);
var cr134121_place_25 = cr134121_place_21;
var cr134121_place_26 = cljs.core.reset_BANG_;
var cr134121_place_27 = frontend.worker.rtc.asset._STAR_remote_asset_updates;
var cr134121_place_28 = cr134121_place_25;
var cr134121_place_29 = (function (){var G__135215 = cr134121_place_27;
var G__135216 = cr134121_place_28;
var fexpr__135214 = cr134121_place_26;
return (fexpr__135214.cljs$core$IFn$_invoke$arity$2 ? fexpr__135214.cljs$core$IFn$_invoke$arity$2(G__135215,G__135216) : fexpr__135214.call(null,G__135215,G__135216));
})();
(cr134121_state[(0)] = cr134121_block_4);

(cr134121_state[(2)] = null);

(cr134121_state[(1)] = cr134121_place_29);

return cr134121_state;
}catch (e135208){var cr134121_exception = e135208;
(cr134121_state[(0)] = null);

(cr134121_state[(1)] = null);

(cr134121_state[(2)] = null);

throw cr134121_exception;
}});
var cr134121_block_4 = (function frontend$worker$rtc$asset$new_task__emit_remote_asset_updates_from_push_asset_upload_updates_$_cr134121_block_4(cr134121_state){
try{var cr134121_place_23 = (cr134121_state[(1)]);
(cr134121_state[(0)] = null);

(cr134121_state[(1)] = null);

return cr134121_place_23;
}catch (e135225){var cr134121_exception = e135225;
(cr134121_state[(0)] = null);

(cr134121_state[(1)] = null);

throw cr134121_exception;
}});
return cloroutine.impl.coroutine((function (){var G__135246 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__135246[(0)] = cr134121_block_0);

return G__135246;
})());
})(),missionary.core.sp_run);
});
/**
 * Return a flow that emits different events:
 *   - `:local-update-check`: event to notify check if there're some new local-updates on assets
 *   - `:remote-updates`: remote asset updates 
 */
frontend.worker.rtc.asset.create_mixed_flow = (function frontend$worker$rtc$asset$create_mixed_flow(repo,_STAR_auto_push_QMARK_){
var remote_update_flow = missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (v){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"remote-updates","remote-updates",872541100),new cljs.core.Keyword(null,"value","value",305978217),v], null);
})),frontend.worker.rtc.asset.remote_asset_updates_flow);
var local_update_check_flow = missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (v){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"local-update-check","local-update-check",1658079099),new cljs.core.Keyword(null,"value","value",305978217),v], null);
})),frontend.worker.rtc.asset.create_local_updates_check_flow(repo,_STAR_auto_push_QMARK_,(2500)));
return frontend.common.missionary.mix.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([remote_update_flow,local_update_check_flow], 0));
});
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.rtc !== 'undefined') && (typeof frontend.worker.rtc.asset !== 'undefined') && (typeof frontend.worker.rtc.asset._STAR_assets_sync_lock !== 'undefined')){
} else {
frontend.worker.rtc.asset._STAR_assets_sync_lock = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
/**
 * Use this to prevent multiple assets-sync loops at same time.
 */
frontend.worker.rtc.asset.holding_assets_sync_lock = (function frontend$worker$rtc$asset$holding_assets_sync_lock(started_dfv,task){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr135301_block_0 = (function frontend$worker$rtc$asset$holding_assets_sync_lock_$_cr135301_block_0(cr135301_state){
try{var cr135301_place_0 = cljs.core.compare_and_set_BANG_;
var cr135301_place_1 = frontend.worker.rtc.asset._STAR_assets_sync_lock;
var cr135301_place_2 = null;
var cr135301_place_3 = true;
var cr135301_place_4 = (function (){var G__135411 = cr135301_place_1;
var G__135412 = cr135301_place_2;
var G__135413 = cr135301_place_3;
var fexpr__135410 = cr135301_place_0;
return (fexpr__135410.cljs$core$IFn$_invoke$arity$3 ? fexpr__135410.cljs$core$IFn$_invoke$arity$3(G__135411,G__135412,G__135413) : fexpr__135410.call(null,G__135411,G__135412,G__135413));
})();
var cr135301_place_5 = null;
if(cljs.core.truth_(cr135301_place_4)){
(cr135301_state[(0)] = cr135301_block_2);

(cr135301_state[(1)] = cr135301_place_5);

return cr135301_state;
} else {
(cr135301_state[(0)] = cr135301_block_1);

return cr135301_state;
}
}catch (e135407){var cr135301_exception = e135407;
(cr135301_state[(0)] = null);

throw cr135301_exception;
}});
var cr135301_block_1 = (function frontend$worker$rtc$asset$holding_assets_sync_lock_$_cr135301_block_1(cr135301_state){
try{var cr135301_place_6 = cljs.core.ex_info;
var cr135301_place_7 = "Must not run multiple assets-sync loops";
var cr135301_place_8 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr135301_place_9 = new cljs.core.Keyword("assets-sync.exception","lock-failed","assets-sync.exception/lock-failed",1023170379);
var cr135301_place_10 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr135301_place_11 = true;
var cr135301_place_12 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135301_place_8,cr135301_place_9,cr135301_place_10,cr135301_place_11]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135301_place_13 = (function (){var G__135425 = cr135301_place_7;
var G__135426 = cr135301_place_12;
var fexpr__135424 = cr135301_place_6;
return (fexpr__135424.cljs$core$IFn$_invoke$arity$2 ? fexpr__135424.cljs$core$IFn$_invoke$arity$2(G__135425,G__135426) : fexpr__135424.call(null,G__135425,G__135426));
})();
var cr135301_place_14 = started_dfv;
var cr135301_place_15 = cr135301_place_13;
var cr135301_place_16 = (function (){var G__135435 = cr135301_place_15;
var fexpr__135434 = cr135301_place_14;
return (fexpr__135434.cljs$core$IFn$_invoke$arity$1 ? fexpr__135434.cljs$core$IFn$_invoke$arity$1(G__135435) : fexpr__135434.call(null,G__135435));
})();
var cr135301_place_17 = cr135301_place_13;
var cr135301_place_18 = (function(){throw cr135301_place_17})();
(cr135301_state[(0)] = null);

return null;
}catch (e135419){var cr135301_exception = e135419;
(cr135301_state[(0)] = null);

throw cr135301_exception;
}});
var cr135301_block_2 = (function frontend$worker$rtc$asset$holding_assets_sync_lock_$_cr135301_block_2(cr135301_state){
try{var cr135301_place_19 = null;
(cr135301_state[(0)] = cr135301_block_3);

(cr135301_state[(1)] = cr135301_place_19);

return cr135301_state;
}catch (e135438){var cr135301_exception = e135438;
(cr135301_state[(0)] = null);

(cr135301_state[(1)] = null);

throw cr135301_exception;
}});
var cr135301_block_3 = (function frontend$worker$rtc$asset$holding_assets_sync_lock_$_cr135301_block_3(cr135301_state){
try{var cr135301_place_5 = (cr135301_state[(1)]);
var cr135301_place_20 = null;
var cr135301_place_21 = false;
(cr135301_state[(0)] = cr135301_block_4);

(cr135301_state[(1)] = null);

(cr135301_state[(2)] = cr135301_place_20);

(cr135301_state[(1)] = cr135301_place_21);

return cr135301_state;
}catch (e135447){var cr135301_exception = e135447;
(cr135301_state[(0)] = null);

(cr135301_state[(1)] = null);

throw cr135301_exception;
}});
var cr135301_block_4 = (function frontend$worker$rtc$asset$holding_assets_sync_lock_$_cr135301_block_4(cr135301_state){
try{var cr135301_place_22 = task;
(cr135301_state[(0)] = cr135301_block_5);

return missionary.core.park(cr135301_place_22);
}catch (e135455){var cr135301_exception = e135455;
(cr135301_state[(0)] = cr135301_block_6);

(cr135301_state[(2)] = cr135301_exception);

return cr135301_state;
}});
var cr135301_block_5 = (function frontend$worker$rtc$asset$holding_assets_sync_lock_$_cr135301_block_5(cr135301_state){
try{var cr135301_place_23 = missionary.core.unpark();
(cr135301_state[(0)] = cr135301_block_7);

(cr135301_state[(2)] = cr135301_place_23);

return cr135301_state;
}catch (e135457){var cr135301_exception = e135457;
(cr135301_state[(0)] = cr135301_block_6);

(cr135301_state[(2)] = cr135301_exception);

return cr135301_state;
}});
var cr135301_block_6 = (function frontend$worker$rtc$asset$holding_assets_sync_lock_$_cr135301_block_6(cr135301_state){
try{var cr135301_place_20 = (cr135301_state[(2)]);
var cr135301_place_24 = cr135301_place_20;
var cr135301_place_25 = (function(){throw cr135301_place_24})();
(cr135301_state[(0)] = null);

(cr135301_state[(1)] = null);

(cr135301_state[(2)] = null);

return null;
}catch (e135462){var cr135301_exception = e135462;
(cr135301_state[(0)] = cr135301_block_7);

(cr135301_state[(1)] = true);

(cr135301_state[(2)] = cr135301_exception);

return cr135301_state;
}});
var cr135301_block_7 = (function frontend$worker$rtc$asset$holding_assets_sync_lock_$_cr135301_block_7(cr135301_state){
try{var cr135301_place_21 = (cr135301_state[(1)]);
var cr135301_place_20 = (cr135301_state[(2)]);
var cr135301_place_26 = cljs.core.reset_BANG_;
var cr135301_place_27 = frontend.worker.rtc.asset._STAR_assets_sync_lock;
var cr135301_place_28 = null;
var cr135301_place_29 = (function (){var G__135473 = cr135301_place_27;
var G__135474 = cr135301_place_28;
var fexpr__135472 = cr135301_place_26;
return (fexpr__135472.cljs$core$IFn$_invoke$arity$2 ? fexpr__135472.cljs$core$IFn$_invoke$arity$2(G__135473,G__135474) : fexpr__135472.call(null,G__135473,G__135474));
})();
var cr135301_place_30 = (cljs.core.truth_(cr135301_place_21)?(function(){throw cr135301_place_20})():cr135301_place_20);
(cr135301_state[(0)] = null);

(cr135301_state[(1)] = null);

(cr135301_state[(2)] = null);

return cr135301_place_30;
}catch (e135470){var cr135301_exception = e135470;
(cr135301_state[(0)] = null);

(cr135301_state[(1)] = null);

(cr135301_state[(2)] = null);

throw cr135301_exception;
}});
return cloroutine.impl.coroutine((function (){var G__135476 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__135476[(0)] = cr135301_block_0);

return G__135476;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.asset.clean_asset_ops_BANG_ = (function frontend$worker$rtc$asset$clean_asset_ops_BANG_(repo,all_asset_uuids,handled_asset_uuids){
var seq__135487 = cljs.core.seq(clojure.set.difference.cljs$core$IFn$_invoke$arity$2(cljs.core.set(all_asset_uuids),cljs.core.set(handled_asset_uuids)));
var chunk__135488 = null;
var count__135489 = (0);
var i__135490 = (0);
while(true){
if((i__135490 < count__135489)){
var asset_uuid = chunk__135488.cljs$core$IIndexed$_nth$arity$2(null,i__135490);
frontend.worker.rtc.client_op.remove_asset_op(repo,asset_uuid);


var G__137279 = seq__135487;
var G__137280 = chunk__135488;
var G__137281 = count__135489;
var G__137282 = (i__135490 + (1));
seq__135487 = G__137279;
chunk__135488 = G__137280;
count__135489 = G__137281;
i__135490 = G__137282;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__135487);
if(temp__5804__auto__){
var seq__135487__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__135487__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__135487__$1);
var G__137283 = cljs.core.chunk_rest(seq__135487__$1);
var G__137284 = c__5525__auto__;
var G__137285 = cljs.core.count(c__5525__auto__);
var G__137286 = (0);
seq__135487 = G__137283;
chunk__135488 = G__137284;
count__135489 = G__137285;
i__135490 = G__137286;
continue;
} else {
var asset_uuid = cljs.core.first(seq__135487__$1);
frontend.worker.rtc.client_op.remove_asset_op(repo,asset_uuid);


var G__137287 = cljs.core.next(seq__135487__$1);
var G__137288 = null;
var G__137289 = (0);
var G__137290 = (0);
seq__135487 = G__137287;
chunk__135488 = G__137288;
count__135489 = G__137289;
i__135490 = G__137290;
continue;
}
} else {
return null;
}
}
break;
}
});
/**
 * Concurrently download assets with limited max concurrent count
 */
frontend.worker.rtc.asset.new_task__concurrent_download_assets = (function frontend$worker$rtc$asset$new_task__concurrent_download_assets(repo,asset_uuid__GT_url,asset_uuid__GT_asset_type){
return missionary.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.constantly(null),frontend.common.missionary.concurrent_exec_flow((5),missionary.core.seed(asset_uuid__GT_url),(function (p__135515){
var vec__135516 = p__135515;
var asset_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135516,(0),null);
var url = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135516,(1),null);
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr135520_block_0 = (function frontend$worker$rtc$asset$new_task__concurrent_download_assets_$_cr135520_block_0(cr135520_state){
try{var cr135520_place_0 = frontend.common.missionary._LT__BANG_;
var cr135520_place_1 = frontend.worker.state._LT_invoke_main_thread;
var cr135520_place_2 = new cljs.core.Keyword("thread-api","rtc-download-asset","thread-api/rtc-download-asset",-555458777);
var cr135520_place_3 = repo;
var cr135520_place_4 = asset_uuid;
var cr135520_place_5 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr135520_place_4);
var cr135520_place_6 = cljs.core.get;
var cr135520_place_7 = asset_uuid__GT_asset_type;
var cr135520_place_8 = asset_uuid;
var cr135520_place_9 = (function (){var G__135630 = cr135520_place_7;
var G__135631 = cr135520_place_8;
var fexpr__135629 = cr135520_place_6;
return (fexpr__135629.cljs$core$IFn$_invoke$arity$2 ? fexpr__135629.cljs$core$IFn$_invoke$arity$2(G__135630,G__135631) : fexpr__135629.call(null,G__135630,G__135631));
})();
var cr135520_place_10 = url;
var cr135520_place_11 = (function (){var G__135634 = cr135520_place_2;
var G__135635 = cr135520_place_3;
var G__135636 = cr135520_place_5;
var G__135637 = cr135520_place_9;
var G__135638 = cr135520_place_10;
var fexpr__135633 = cr135520_place_1;
return (fexpr__135633.cljs$core$IFn$_invoke$arity$5 ? fexpr__135633.cljs$core$IFn$_invoke$arity$5(G__135634,G__135635,G__135636,G__135637,G__135638) : fexpr__135633.call(null,G__135634,G__135635,G__135636,G__135637,G__135638));
})();
var cr135520_place_12 = (function (){var G__135641 = cr135520_place_11;
var fexpr__135640 = cr135520_place_0;
return (fexpr__135640.cljs$core$IFn$_invoke$arity$1 ? fexpr__135640.cljs$core$IFn$_invoke$arity$1(G__135641) : fexpr__135640.call(null,G__135641));
})();
(cr135520_state[(0)] = cr135520_block_1);

return missionary.core.park(cr135520_place_12);
}catch (e135623){var cr135520_exception = e135623;
(cr135520_state[(0)] = null);

throw cr135520_exception;
}});
var cr135520_block_1 = (function frontend$worker$rtc$asset$new_task__concurrent_download_assets_$_cr135520_block_1(cr135520_state){
try{var cr135520_place_13 = missionary.core.unpark();
var cr135520_place_14 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr135520_place_15 = cr135520_place_13;
var cr135520_place_16 = cr135520_place_14.cljs$core$IFn$_invoke$arity$1(cr135520_place_15);
var cr135520_place_17 = cr135520_place_16;
var cr135520_place_18 = null;
if(cljs.core.truth_(cr135520_place_17)){
(cr135520_state[(0)] = cr135520_block_3);

(cr135520_state[(2)] = cr135520_place_13);

(cr135520_state[(3)] = cr135520_place_16);

(cr135520_state[(1)] = cr135520_place_18);

return cr135520_state;
} else {
(cr135520_state[(0)] = cr135520_block_2);

(cr135520_state[(1)] = cr135520_place_18);

return cr135520_state;
}
}catch (e135645){var cr135520_exception = e135645;
(cr135520_state[(0)] = null);

throw cr135520_exception;
}});
var cr135520_block_2 = (function frontend$worker$rtc$asset$new_task__concurrent_download_assets_$_cr135520_block_2(cr135520_state){
try{var cr135520_place_19 = null;
(cr135520_state[(0)] = cr135520_block_7);

(cr135520_state[(1)] = cr135520_place_19);

return cr135520_state;
}catch (e135651){var cr135520_exception = e135651;
(cr135520_state[(0)] = null);

(cr135520_state[(1)] = null);

throw cr135520_exception;
}});
var cr135520_block_3 = (function frontend$worker$rtc$asset$new_task__concurrent_download_assets_$_cr135520_block_3(cr135520_state){
try{var cr135520_place_16 = (cr135520_state[(3)]);
var cr135520_place_20 = cr135520_place_16;
var cr135520_place_21 = cljs.core.not_EQ_;
var cr135520_place_22 = (404);
var cr135520_place_23 = new cljs.core.Keyword(null,"status","status",-1997798413);
var cr135520_place_24 = new cljs.core.Keyword(null,"data","data",-232669377);
var cr135520_place_25 = cr135520_place_20;
var cr135520_place_26 = cr135520_place_24.cljs$core$IFn$_invoke$arity$1(cr135520_place_25);
var cr135520_place_27 = cr135520_place_23.cljs$core$IFn$_invoke$arity$1(cr135520_place_26);
var cr135520_place_28 = (function (){var G__135658 = cr135520_place_22;
var G__135659 = cr135520_place_27;
var fexpr__135657 = cr135520_place_21;
return (fexpr__135657.cljs$core$IFn$_invoke$arity$2 ? fexpr__135657.cljs$core$IFn$_invoke$arity$2(G__135658,G__135659) : fexpr__135657.call(null,G__135658,G__135659));
})();
var cr135520_place_29 = null;
if(cljs.core.truth_(cr135520_place_28)){
(cr135520_state[(0)] = cr135520_block_5);

(cr135520_state[(3)] = null);

(cr135520_state[(1)] = null);

return cr135520_state;
} else {
(cr135520_state[(0)] = cr135520_block_4);

(cr135520_state[(2)] = null);

(cr135520_state[(3)] = null);

(cr135520_state[(2)] = cr135520_place_29);

return cr135520_state;
}
}catch (e135653){var cr135520_exception = e135653;
(cr135520_state[(0)] = null);

(cr135520_state[(2)] = null);

(cr135520_state[(3)] = null);

(cr135520_state[(1)] = null);

throw cr135520_exception;
}});
var cr135520_block_4 = (function frontend$worker$rtc$asset$new_task__concurrent_download_assets_$_cr135520_block_4(cr135520_state){
try{var cr135520_place_30 = null;
(cr135520_state[(0)] = cr135520_block_6);

(cr135520_state[(2)] = cr135520_place_30);

return cr135520_state;
}catch (e135662){var cr135520_exception = e135662;
(cr135520_state[(0)] = null);

(cr135520_state[(2)] = null);

(cr135520_state[(1)] = null);

throw cr135520_exception;
}});
var cr135520_block_5 = (function frontend$worker$rtc$asset$new_task__concurrent_download_assets_$_cr135520_block_5(cr135520_state){
try{var cr135520_place_13 = (cr135520_state[(2)]);
var cr135520_place_31 = cljs.core.ex_info;
var cr135520_place_32 = "download asset failed";
var cr135520_place_33 = cr135520_place_13;
var cr135520_place_34 = (function (){var G__135671 = cr135520_place_32;
var G__135672 = cr135520_place_33;
var fexpr__135670 = cr135520_place_31;
return (fexpr__135670.cljs$core$IFn$_invoke$arity$2 ? fexpr__135670.cljs$core$IFn$_invoke$arity$2(G__135671,G__135672) : fexpr__135670.call(null,G__135671,G__135672));
})();
var cr135520_place_35 = (function(){throw cr135520_place_34})();
(cr135520_state[(0)] = null);

(cr135520_state[(2)] = null);

return null;
}catch (e135665){var cr135520_exception = e135665;
(cr135520_state[(0)] = null);

(cr135520_state[(2)] = null);

throw cr135520_exception;
}});
var cr135520_block_6 = (function frontend$worker$rtc$asset$new_task__concurrent_download_assets_$_cr135520_block_6(cr135520_state){
try{var cr135520_place_29 = (cr135520_state[(2)]);
(cr135520_state[(0)] = cr135520_block_7);

(cr135520_state[(2)] = null);

(cr135520_state[(1)] = cr135520_place_29);

return cr135520_state;
}catch (e135676){var cr135520_exception = e135676;
(cr135520_state[(0)] = null);

(cr135520_state[(2)] = null);

(cr135520_state[(1)] = null);

throw cr135520_exception;
}});
var cr135520_block_7 = (function frontend$worker$rtc$asset$new_task__concurrent_download_assets_$_cr135520_block_7(cr135520_state){
try{var cr135520_place_18 = (cr135520_state[(1)]);
(cr135520_state[(0)] = null);

(cr135520_state[(1)] = null);

return cr135520_place_18;
}catch (e135681){var cr135520_exception = e135681;
(cr135520_state[(0)] = null);

(cr135520_state[(1)] = null);

throw cr135520_exception;
}});
return cloroutine.impl.coroutine((function (){var G__135683 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__135683[(0)] = cr135520_block_0);

return G__135683;
})());
})(),missionary.core.sp_run);
})));
});
/**
 * Concurrently upload assets with limited max concurrent count
 */
frontend.worker.rtc.asset.new_task__concurrent_upload_assets = (function frontend$worker$rtc$asset$new_task__concurrent_upload_assets(repo,conn,asset_uuid__GT_url,asset_uuid__GT_asset_type_PLUS_checksum){
return missionary.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.constantly(null),frontend.common.missionary.concurrent_exec_flow((3),missionary.core.seed(asset_uuid__GT_url),(function (p__135689){
var vec__135690 = p__135689;
var asset_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135690,(0),null);
var url = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135690,(1),null);
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr135693_block_0 = (function frontend$worker$rtc$asset$new_task__concurrent_upload_assets_$_cr135693_block_0(cr135693_state){
try{var cr135693_place_0 = cljs.core.get;
var cr135693_place_1 = asset_uuid__GT_asset_type_PLUS_checksum;
var cr135693_place_2 = asset_uuid;
var cr135693_place_3 = (function (){var G__135791 = cr135693_place_1;
var G__135792 = cr135693_place_2;
var fexpr__135790 = cr135693_place_0;
return (fexpr__135790.cljs$core$IFn$_invoke$arity$2 ? fexpr__135790.cljs$core$IFn$_invoke$arity$2(G__135791,G__135792) : fexpr__135790.call(null,G__135791,G__135792));
})();
var cr135693_place_4 = cljs.core.nth;
var cr135693_place_5 = cr135693_place_3;
var cr135693_place_6 = (0);
var cr135693_place_7 = null;
var cr135693_place_8 = (function (){var G__135795 = cr135693_place_5;
var G__135796 = cr135693_place_6;
var G__135797 = cr135693_place_7;
var fexpr__135794 = cr135693_place_4;
return (fexpr__135794.cljs$core$IFn$_invoke$arity$3 ? fexpr__135794.cljs$core$IFn$_invoke$arity$3(G__135795,G__135796,G__135797) : fexpr__135794.call(null,G__135795,G__135796,G__135797));
})();
var cr135693_place_9 = cljs.core.nth;
var cr135693_place_10 = cr135693_place_3;
var cr135693_place_11 = (1);
var cr135693_place_12 = null;
var cr135693_place_13 = (function (){var G__135799 = cr135693_place_10;
var G__135800 = cr135693_place_11;
var G__135801 = cr135693_place_12;
var fexpr__135798 = cr135693_place_9;
return (fexpr__135798.cljs$core$IFn$_invoke$arity$3 ? fexpr__135798.cljs$core$IFn$_invoke$arity$3(G__135799,G__135800,G__135801) : fexpr__135798.call(null,G__135799,G__135800,G__135801));
})();
var cr135693_place_14 = frontend.common.missionary._LT__BANG_;
var cr135693_place_15 = frontend.worker.state._LT_invoke_main_thread;
var cr135693_place_16 = new cljs.core.Keyword("thread-api","rtc-upload-asset","thread-api/rtc-upload-asset",-1194088361);
var cr135693_place_17 = repo;
var cr135693_place_18 = asset_uuid;
var cr135693_place_19 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr135693_place_18);
var cr135693_place_20 = cr135693_place_8;
var cr135693_place_21 = cr135693_place_13;
var cr135693_place_22 = url;
var cr135693_place_23 = (function (){var G__135805 = cr135693_place_16;
var G__135806 = cr135693_place_17;
var G__135807 = cr135693_place_19;
var G__135808 = cr135693_place_20;
var G__135809 = cr135693_place_21;
var G__135810 = cr135693_place_22;
var fexpr__135804 = cr135693_place_15;
return (fexpr__135804.cljs$core$IFn$_invoke$arity$6 ? fexpr__135804.cljs$core$IFn$_invoke$arity$6(G__135805,G__135806,G__135807,G__135808,G__135809,G__135810) : fexpr__135804.call(null,G__135805,G__135806,G__135807,G__135808,G__135809,G__135810));
})();
var cr135693_place_24 = (function (){var G__135812 = cr135693_place_23;
var fexpr__135811 = cr135693_place_14;
return (fexpr__135811.cljs$core$IFn$_invoke$arity$1 ? fexpr__135811.cljs$core$IFn$_invoke$arity$1(G__135812) : fexpr__135811.call(null,G__135812));
})();
(cr135693_state[(0)] = cr135693_block_1);

(cr135693_state[(1)] = cr135693_place_8);

(cr135693_state[(2)] = cr135693_place_13);

return missionary.core.park(cr135693_place_24);
}catch (e135787){var cr135693_exception = e135787;
(cr135693_state[(0)] = null);

throw cr135693_exception;
}});
var cr135693_block_1 = (function frontend$worker$rtc$asset$new_task__concurrent_upload_assets_$_cr135693_block_1(cr135693_state){
try{var cr135693_place_25 = missionary.core.unpark();
var cr135693_place_26 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr135693_place_27 = cr135693_place_25;
var cr135693_place_28 = cr135693_place_26.cljs$core$IFn$_invoke$arity$1(cr135693_place_27);
var cr135693_place_29 = null;
if(cljs.core.truth_(cr135693_place_28)){
(cr135693_state[(0)] = cr135693_block_3);

(cr135693_state[(1)] = null);

(cr135693_state[(2)] = null);

(cr135693_state[(1)] = cr135693_place_25);

return cr135693_state;
} else {
(cr135693_state[(0)] = cr135693_block_2);

(cr135693_state[(3)] = cr135693_place_29);

return cr135693_state;
}
}catch (e135819){var cr135693_exception = e135819;
(cr135693_state[(0)] = null);

(cr135693_state[(1)] = null);

(cr135693_state[(2)] = null);

throw cr135693_exception;
}});
var cr135693_block_2 = (function frontend$worker$rtc$asset$new_task__concurrent_upload_assets_$_cr135693_block_2(cr135693_state){
try{var cr135693_place_30 = null;
(cr135693_state[(0)] = cr135693_block_4);

(cr135693_state[(3)] = cr135693_place_30);

return cr135693_state;
}catch (e135826){var cr135693_exception = e135826;
(cr135693_state[(0)] = null);

(cr135693_state[(1)] = null);

(cr135693_state[(3)] = null);

(cr135693_state[(2)] = null);

throw cr135693_exception;
}});
var cr135693_block_3 = (function frontend$worker$rtc$asset$new_task__concurrent_upload_assets_$_cr135693_block_3(cr135693_state){
try{var cr135693_place_25 = (cr135693_state[(1)]);
var cr135693_place_31 = cljs.core.ex_info;
var cr135693_place_32 = "upload asset failed";
var cr135693_place_33 = cr135693_place_25;
var cr135693_place_34 = (function (){var G__135833 = cr135693_place_32;
var G__135834 = cr135693_place_33;
var fexpr__135832 = cr135693_place_31;
return (fexpr__135832.cljs$core$IFn$_invoke$arity$2 ? fexpr__135832.cljs$core$IFn$_invoke$arity$2(G__135833,G__135834) : fexpr__135832.call(null,G__135833,G__135834));
})();
var cr135693_place_35 = (function(){throw cr135693_place_34})();
(cr135693_state[(0)] = null);

(cr135693_state[(1)] = null);

return null;
}catch (e135830){var cr135693_exception = e135830;
(cr135693_state[(0)] = null);

(cr135693_state[(1)] = null);

throw cr135693_exception;
}});
var cr135693_block_4 = (function frontend$worker$rtc$asset$new_task__concurrent_upload_assets_$_cr135693_block_4(cr135693_state){
try{var cr135693_place_8 = (cr135693_state[(1)]);
var cr135693_place_29 = (cr135693_state[(3)]);
var cr135693_place_13 = (cr135693_state[(2)]);
var cr135693_place_36 = conn;
var cr135693_place_37 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552);
var cr135693_place_38 = asset_uuid;
var cr135693_place_39 = new cljs.core.Keyword("logseq.property.asset","remote-metadata","logseq.property.asset/remote-metadata",-990750469);
var cr135693_place_40 = new cljs.core.Keyword(null,"checksum","checksum",549736371);
var cr135693_place_41 = cr135693_place_13;
var cr135693_place_42 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr135693_place_43 = cr135693_place_8;
var cr135693_place_44 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135693_place_42,cr135693_place_43,cr135693_place_40,cr135693_place_41]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135693_place_45 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135693_place_39,cr135693_place_44,cr135693_place_37,cr135693_place_38]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135693_place_46 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr135693_place_45], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr135693_place_47 = new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534);
var cr135693_place_48 = false;
var cr135693_place_49 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135693_place_47,cr135693_place_48]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135693_place_50 = datascript.core.transact_BANG_;
var cr135693_place_51 = cr135693_place_36;
var cr135693_place_52 = cr135693_place_46;
var cr135693_place_53 = cr135693_place_49;
var cr135693_place_54 = (function (){var G__135853 = cr135693_place_51;
var G__135854 = cr135693_place_52;
var G__135855 = cr135693_place_53;
var fexpr__135852 = cr135693_place_50;
return (fexpr__135852.cljs$core$IFn$_invoke$arity$3 ? fexpr__135852.cljs$core$IFn$_invoke$arity$3(G__135853,G__135854,G__135855) : fexpr__135852.call(null,G__135853,G__135854,G__135855));
})();
var cr135693_place_55 = frontend.worker.rtc.client_op.remove_asset_op;
var cr135693_place_56 = repo;
var cr135693_place_57 = asset_uuid;
var cr135693_place_58 = (function (){var G__135861 = cr135693_place_56;
var G__135862 = cr135693_place_57;
var fexpr__135860 = cr135693_place_55;
return (fexpr__135860.cljs$core$IFn$_invoke$arity$2 ? fexpr__135860.cljs$core$IFn$_invoke$arity$2(G__135861,G__135862) : fexpr__135860.call(null,G__135861,G__135862));
})();
(cr135693_state[(0)] = null);

(cr135693_state[(1)] = null);

(cr135693_state[(3)] = null);

(cr135693_state[(2)] = null);

return cr135693_place_58;
}catch (e135837){var cr135693_exception = e135837;
(cr135693_state[(0)] = null);

(cr135693_state[(1)] = null);

(cr135693_state[(3)] = null);

(cr135693_state[(2)] = null);

throw cr135693_exception;
}});
return cloroutine.impl.coroutine((function (){var G__135864 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__135864[(0)] = cr135693_block_0);

return G__135864;
})());
})(),missionary.core.sp_run);
})));
});
frontend.worker.rtc.asset.new_task__push_local_asset_updates = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates(repo,get_ws_create_task,conn,graph_uuid,major_schema_version,add_log_fn){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr135888_block_4 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_4(cr135888_state){
try{var cr135888_place_23 = (cr135888_state[(4)]);
var cr135888_place_29 = new cljs.core.Keyword(null,"asset-uuid->url","asset-uuid->url",354369294);
var cr135888_place_30 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr135888_place_31 = get_ws_create_task;
var cr135888_place_32 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr135888_place_33 = "get-assets-upload-urls";
var cr135888_place_34 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr135888_place_35 = graph_uuid;
var cr135888_place_36 = new cljs.core.Keyword(null,"asset-uuid->metadata","asset-uuid->metadata",-444389036);
var cr135888_place_37 = cljs.core.into;
var cr135888_place_38 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135888_place_39 = cljs.core.map;
var cr135888_place_40 = (function (p__135912){
var vec__135914 = p__135912;
var asset_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135914,(0),null);
var vec__135917 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135914,(1),null);
var asset_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135917,(0),null);
var checksum = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135917,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [asset_uuid,new cljs.core.PersistentArrayMap(null, 2, ["type",asset_type,"checksum",checksum], null)], null);
});
var cr135888_place_41 = (function (){var G__136436 = cr135888_place_40;
var fexpr__136435 = cr135888_place_39;
return (fexpr__136435.cljs$core$IFn$_invoke$arity$1 ? fexpr__136435.cljs$core$IFn$_invoke$arity$1(G__136436) : fexpr__136435.call(null,G__136436));
})();
var cr135888_place_42 = cr135888_place_23;
var cr135888_place_43 = (function (){var G__136440 = cr135888_place_38;
var G__136441 = cr135888_place_41;
var G__136442 = cr135888_place_42;
var fexpr__136439 = cr135888_place_37;
return (fexpr__136439.cljs$core$IFn$_invoke$arity$3 ? fexpr__136439.cljs$core$IFn$_invoke$arity$3(G__136440,G__136441,G__136442) : fexpr__136439.call(null,G__136440,G__136441,G__136442));
})();
var cr135888_place_44 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135888_place_32,cr135888_place_33,cr135888_place_36,cr135888_place_43,cr135888_place_34,cr135888_place_35]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135888_place_45 = (function (){var G__136445 = cr135888_place_31;
var G__136446 = cr135888_place_44;
var fexpr__136444 = cr135888_place_30;
return (fexpr__136444.cljs$core$IFn$_invoke$arity$2 ? fexpr__136444.cljs$core$IFn$_invoke$arity$2(G__136445,G__136446) : fexpr__136444.call(null,G__136445,G__136446));
})();
(cr135888_state[(0)] = cr135888_block_5);

(cr135888_state[(6)] = cr135888_place_29);

return missionary.core.park(cr135888_place_45);
}catch (e136426){var cr135888_exception = e136426;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(5)] = null);

throw cr135888_exception;
}});
var cr135888_block_1 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_1(cr135888_state){
try{var cr135888_place_7 = null;
(cr135888_state[(0)] = cr135888_block_24);

(cr135888_state[(1)] = cr135888_place_7);

return cr135888_state;
}catch (e136453){var cr135888_exception = e136453;
(cr135888_state[(0)] = null);

(cr135888_state[(1)] = null);

throw cr135888_exception;
}});
var cr135888_block_15 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_15(cr135888_state){
try{var cr135888_place_99 = (cr135888_state[(8)]);
var cr135888_place_108 = cljs.core.seq;
var cr135888_place_109 = cr135888_place_99;
var cr135888_place_110 = (function (){var G__136471 = cr135888_place_109;
var fexpr__136470 = cr135888_place_108;
return (fexpr__136470.cljs$core$IFn$_invoke$arity$1 ? fexpr__136470.cljs$core$IFn$_invoke$arity$1(G__136471) : fexpr__136470.call(null,G__136471));
})();
var cr135888_place_111 = cr135888_place_110;
var cr135888_place_112 = null;
if(cr135888_place_111){
(cr135888_state[(0)] = cr135888_block_17);

(cr135888_state[(10)] = null);

(cr135888_state[(10)] = cr135888_place_110);

return cr135888_state;
} else {
(cr135888_state[(0)] = cr135888_block_16);

(cr135888_state[(6)] = null);

(cr135888_state[(7)] = null);

(cr135888_state[(8)] = null);

(cr135888_state[(9)] = null);

(cr135888_state[(6)] = cr135888_place_112);

return cr135888_state;
}
}catch (e136462){var cr135888_exception = e136462;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(6)] = null);

(cr135888_state[(7)] = null);

(cr135888_state[(8)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(5)] = null);

(cr135888_state[(9)] = null);

(cr135888_state[(10)] = null);

throw cr135888_exception;
}});
var cr135888_block_24 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_24(cr135888_state){
try{var cr135888_place_6 = (cr135888_state[(1)]);
(cr135888_state[(0)] = null);

(cr135888_state[(1)] = null);

return cr135888_place_6;
}catch (e136481){var cr135888_exception = e136481;
(cr135888_state[(0)] = null);

(cr135888_state[(1)] = null);

throw cr135888_exception;
}});
var cr135888_block_17 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_17(cr135888_state){
try{var cr135888_place_110 = (cr135888_state[(10)]);
var cr135888_place_114 = cr135888_place_110;
var cr135888_place_115 = cljs.core.chunked_seq_QMARK_;
var cr135888_place_116 = cr135888_place_114;
var cr135888_place_117 = (function (){var G__136500 = cr135888_place_116;
var fexpr__136499 = cr135888_place_115;
return (fexpr__136499.cljs$core$IFn$_invoke$arity$1 ? fexpr__136499.cljs$core$IFn$_invoke$arity$1(G__136500) : fexpr__136499.call(null,G__136500));
})();
var cr135888_place_118 = null;
if(cljs.core.truth_(cr135888_place_117)){
(cr135888_state[(0)] = cr135888_block_19);

(cr135888_state[(10)] = null);

(cr135888_state[(10)] = cr135888_place_114);

return cr135888_state;
} else {
(cr135888_state[(0)] = cr135888_block_18);

(cr135888_state[(10)] = null);

(cr135888_state[(10)] = cr135888_place_114);

return cr135888_state;
}
}catch (e136489){var cr135888_exception = e136489;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(10)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(6)] = null);

(cr135888_state[(7)] = null);

(cr135888_state[(8)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(5)] = null);

(cr135888_state[(9)] = null);

throw cr135888_exception;
}});
var cr135888_block_16 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_16(cr135888_state){
try{var cr135888_place_113 = null;
(cr135888_state[(0)] = cr135888_block_20);

(cr135888_state[(6)] = cr135888_place_113);

return cr135888_state;
}catch (e136509){var cr135888_exception = e136509;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(6)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(5)] = null);

(cr135888_state[(10)] = null);

throw cr135888_exception;
}});
var cr135888_block_22 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_22(cr135888_state){
try{var cr135888_place_107 = (cr135888_state[(10)]);
(cr135888_state[(0)] = cr135888_block_23);

(cr135888_state[(10)] = null);

(cr135888_state[(4)] = cr135888_place_107);

return cr135888_state;
}catch (e136516){var cr135888_exception = e136516;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(5)] = null);

(cr135888_state[(10)] = null);

throw cr135888_exception;
}});
var cr135888_block_2 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_2(cr135888_state){
try{var cr135888_place_4 = (cr135888_state[(2)]);
var cr135888_place_8 = cr135888_place_4;
var cr135888_place_9 = cljs.core.keep;
var cr135888_place_10 = (function (asset_op){
if(cljs.core.contains_QMARK_(asset_op,new cljs.core.Keyword(null,"update-asset","update-asset",501550582))){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(asset_op);
} else {
return null;
}
});
var cr135888_place_11 = cr135888_place_8;
var cr135888_place_12 = (function (){var G__136536 = cr135888_place_10;
var G__136537 = cr135888_place_11;
var fexpr__136535 = cr135888_place_9;
return (fexpr__136535.cljs$core$IFn$_invoke$arity$2 ? fexpr__136535.cljs$core$IFn$_invoke$arity$2(G__136536,G__136537) : fexpr__136535.call(null,G__136536,G__136537));
})();
var cr135888_place_13 = cljs.core.keep;
var cr135888_place_14 = (function (asset_op){
if(cljs.core.contains_QMARK_(asset_op,new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854))){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(asset_op);
} else {
return null;
}
});
var cr135888_place_15 = cr135888_place_8;
var cr135888_place_16 = (function (){var G__136546 = cr135888_place_14;
var G__136547 = cr135888_place_15;
var fexpr__136545 = cr135888_place_13;
return (fexpr__136545.cljs$core$IFn$_invoke$arity$2 ? fexpr__136545.cljs$core$IFn$_invoke$arity$2(G__136546,G__136547) : fexpr__136545.call(null,G__136546,G__136547));
})();
var cr135888_place_17 = cljs.core.into;
var cr135888_place_18 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135888_place_19 = cljs.core.keep;
var cr135888_place_20 = (function (asset_uuid){
var ent = (function (){var G__135902 = cljs.core.deref(conn);
var G__135903 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),asset_uuid], null);
var G__136555 = G__135902;
var G__136556 = G__135903;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__136555,G__136556) : datascript.core.entity.call(null,G__136555,G__136556));
})();
var temp__5804__auto__ = new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098).cljs$core$IFn$_invoke$arity$1(ent);
if(cljs.core.truth_(temp__5804__auto__)){
var tp = temp__5804__auto__;
var temp__5804__auto____$1 = new cljs.core.Keyword("logseq.property.asset","checksum","logseq.property.asset/checksum",-1011416979).cljs$core$IFn$_invoke$arity$1(ent);
if(cljs.core.truth_(temp__5804__auto____$1)){
var checksum = temp__5804__auto____$1;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [asset_uuid,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [tp,checksum], null)], null);
} else {
return null;
}
} else {
return null;
}
});
var cr135888_place_21 = (function (){var G__136562 = cr135888_place_20;
var fexpr__136561 = cr135888_place_19;
return (fexpr__136561.cljs$core$IFn$_invoke$arity$1 ? fexpr__136561.cljs$core$IFn$_invoke$arity$1(G__136562) : fexpr__136561.call(null,G__136562));
})();
var cr135888_place_22 = cr135888_place_12;
var cr135888_place_23 = (function (){var G__136564 = cr135888_place_18;
var G__136565 = cr135888_place_21;
var G__136566 = cr135888_place_22;
var fexpr__136563 = cr135888_place_17;
return (fexpr__136563.cljs$core$IFn$_invoke$arity$3 ? fexpr__136563.cljs$core$IFn$_invoke$arity$3(G__136564,G__136565,G__136566) : fexpr__136563.call(null,G__136564,G__136565,G__136566));
})();
var cr135888_place_24 = cljs.core.seq;
var cr135888_place_25 = cr135888_place_23;
var cr135888_place_26 = (function (){var G__136571 = cr135888_place_25;
var fexpr__136570 = cr135888_place_24;
return (fexpr__136570.cljs$core$IFn$_invoke$arity$1 ? fexpr__136570.cljs$core$IFn$_invoke$arity$1(G__136571) : fexpr__136570.call(null,G__136571));
})();
var cr135888_place_27 = null;
if(cljs.core.truth_(cr135888_place_26)){
(cr135888_state[(0)] = cr135888_block_4);

(cr135888_state[(2)] = null);

(cr135888_state[(2)] = cr135888_place_27);

(cr135888_state[(3)] = cr135888_place_8);

(cr135888_state[(4)] = cr135888_place_23);

(cr135888_state[(5)] = cr135888_place_16);

return cr135888_state;
} else {
(cr135888_state[(0)] = cr135888_block_3);

(cr135888_state[(2)] = null);

(cr135888_state[(2)] = cr135888_place_27);

(cr135888_state[(3)] = cr135888_place_8);

(cr135888_state[(4)] = cr135888_place_23);

(cr135888_state[(5)] = cr135888_place_16);

return cr135888_state;
}
}catch (e136524){var cr135888_exception = e136524;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(1)] = null);

throw cr135888_exception;
}});
var cr135888_block_19 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_19(cr135888_state){
try{var cr135888_place_114 = (cr135888_state[(10)]);
var cr135888_place_133 = cljs.core.chunk_first;
var cr135888_place_134 = cr135888_place_114;
var cr135888_place_135 = (function (){var G__136588 = cr135888_place_134;
var fexpr__136587 = cr135888_place_133;
return (fexpr__136587.cljs$core$IFn$_invoke$arity$1 ? fexpr__136587.cljs$core$IFn$_invoke$arity$1(G__136588) : fexpr__136587.call(null,G__136588));
})();
var cr135888_place_136 = cljs.core.chunk_rest;
var cr135888_place_137 = cr135888_place_114;
var cr135888_place_138 = (function (){var G__136592 = cr135888_place_137;
var fexpr__136591 = cr135888_place_136;
return (fexpr__136591.cljs$core$IFn$_invoke$arity$1 ? fexpr__136591.cljs$core$IFn$_invoke$arity$1(G__136592) : fexpr__136591.call(null,G__136592));
})();
var cr135888_place_139 = cr135888_place_135;
var cr135888_place_140 = cljs.core.count;
var cr135888_place_141 = cr135888_place_135;
var cr135888_place_142 = (function (){var G__136597 = cr135888_place_141;
var fexpr__136596 = cr135888_place_140;
return (fexpr__136596.cljs$core$IFn$_invoke$arity$1 ? fexpr__136596.cljs$core$IFn$_invoke$arity$1(G__136597) : fexpr__136596.call(null,G__136597));
})();
var cr135888_place_143 = (0);
(cr135888_state[(0)] = cr135888_block_14);

(cr135888_state[(10)] = null);

(cr135888_state[(6)] = cr135888_place_139);

(cr135888_state[(7)] = cr135888_place_143);

(cr135888_state[(8)] = cr135888_place_138);

(cr135888_state[(9)] = cr135888_place_142);

return cr135888_state;
}catch (e136584){var cr135888_exception = e136584;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(10)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(6)] = null);

(cr135888_state[(7)] = null);

(cr135888_state[(8)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(5)] = null);

(cr135888_state[(9)] = null);

throw cr135888_exception;
}});
var cr135888_block_7 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_7(cr135888_state){
try{var cr135888_place_52 = null;
(cr135888_state[(0)] = cr135888_block_9);

(cr135888_state[(6)] = cr135888_place_52);

return cr135888_state;
}catch (e136600){var cr135888_exception = e136600;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(6)] = null);

(cr135888_state[(5)] = null);

throw cr135888_exception;
}});
var cr135888_block_5 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_5(cr135888_state){
try{var cr135888_place_29 = (cr135888_state[(6)]);
var cr135888_place_46 = missionary.core.unpark();
var cr135888_place_47 = cr135888_place_29.cljs$core$IFn$_invoke$arity$1(cr135888_place_46);
(cr135888_state[(0)] = cr135888_block_6);

(cr135888_state[(6)] = null);

(cr135888_state[(2)] = cr135888_place_47);

return cr135888_state;
}catch (e136601){var cr135888_exception = e136601;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(5)] = null);

(cr135888_state[(6)] = null);

throw cr135888_exception;
}});
var cr135888_block_0 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_0(cr135888_state){
try{var cr135888_place_0 = cljs.core.not_empty;
var cr135888_place_1 = frontend.worker.rtc.client_op.get_all_asset_ops;
var cr135888_place_2 = repo;
var cr135888_place_3 = (function (){var G__136604 = cr135888_place_2;
var fexpr__136603 = cr135888_place_1;
return (fexpr__136603.cljs$core$IFn$_invoke$arity$1 ? fexpr__136603.cljs$core$IFn$_invoke$arity$1(G__136604) : fexpr__136603.call(null,G__136604));
})();
var cr135888_place_4 = (function (){var G__136606 = cr135888_place_3;
var fexpr__136605 = cr135888_place_0;
return (fexpr__136605.cljs$core$IFn$_invoke$arity$1 ? fexpr__136605.cljs$core$IFn$_invoke$arity$1(G__136606) : fexpr__136605.call(null,G__136606));
})();
var cr135888_place_5 = cr135888_place_4;
var cr135888_place_6 = null;
if(cljs.core.truth_(cr135888_place_5)){
(cr135888_state[(0)] = cr135888_block_2);

(cr135888_state[(2)] = cr135888_place_4);

(cr135888_state[(1)] = cr135888_place_6);

return cr135888_state;
} else {
(cr135888_state[(0)] = cr135888_block_1);

(cr135888_state[(1)] = cr135888_place_6);

return cr135888_state;
}
}catch (e136602){var cr135888_exception = e136602;
(cr135888_state[(0)] = null);

throw cr135888_exception;
}});
var cr135888_block_9 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_9(cr135888_state){
try{var cr135888_place_27 = (cr135888_state[(2)]);
var cr135888_place_23 = (cr135888_state[(4)]);
var cr135888_place_51 = (cr135888_state[(6)]);
var cr135888_place_63 = frontend.worker.rtc.asset.new_task__concurrent_upload_assets;
var cr135888_place_64 = repo;
var cr135888_place_65 = conn;
var cr135888_place_66 = cr135888_place_27;
var cr135888_place_67 = cr135888_place_23;
var cr135888_place_68 = (function (){var G__136609 = cr135888_place_64;
var G__136610 = cr135888_place_65;
var G__136611 = cr135888_place_66;
var G__136612 = cr135888_place_67;
var fexpr__136608 = cr135888_place_63;
return (fexpr__136608.cljs$core$IFn$_invoke$arity$4 ? fexpr__136608.cljs$core$IFn$_invoke$arity$4(G__136609,G__136610,G__136611,G__136612) : fexpr__136608.call(null,G__136609,G__136610,G__136611,G__136612));
})();
(cr135888_state[(0)] = cr135888_block_10);

(cr135888_state[(4)] = null);

(cr135888_state[(6)] = null);

return missionary.core.park(cr135888_place_68);
}catch (e136607){var cr135888_exception = e136607;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(6)] = null);

(cr135888_state[(5)] = null);

throw cr135888_exception;
}});
var cr135888_block_23 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_23(cr135888_state){
try{var cr135888_place_27 = (cr135888_state[(2)]);
var cr135888_place_8 = (cr135888_state[(3)]);
var cr135888_place_73 = (cr135888_state[(4)]);
var cr135888_place_16 = (cr135888_state[(5)]);
var cr135888_place_159 = frontend.worker.rtc.asset.clean_asset_ops_BANG_;
var cr135888_place_160 = repo;
var cr135888_place_161 = cljs.core.map;
var cr135888_place_162 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552);
var cr135888_place_163 = cr135888_place_8;
var cr135888_place_164 = (function (){var G__136615 = cr135888_place_162;
var G__136616 = cr135888_place_163;
var fexpr__136614 = cr135888_place_161;
return (fexpr__136614.cljs$core$IFn$_invoke$arity$2 ? fexpr__136614.cljs$core$IFn$_invoke$arity$2(G__136615,G__136616) : fexpr__136614.call(null,G__136615,G__136616));
})();
var cr135888_place_165 = cljs.core.concat;
var cr135888_place_166 = cljs.core.keys;
var cr135888_place_167 = cr135888_place_27;
var cr135888_place_168 = (function (){var G__136618 = cr135888_place_167;
var fexpr__136617 = cr135888_place_166;
return (fexpr__136617.cljs$core$IFn$_invoke$arity$1 ? fexpr__136617.cljs$core$IFn$_invoke$arity$1(G__136618) : fexpr__136617.call(null,G__136618));
})();
var cr135888_place_169 = cr135888_place_16;
var cr135888_place_170 = (function (){var G__136620 = cr135888_place_168;
var G__136621 = cr135888_place_169;
var fexpr__136619 = cr135888_place_165;
return (fexpr__136619.cljs$core$IFn$_invoke$arity$2 ? fexpr__136619.cljs$core$IFn$_invoke$arity$2(G__136620,G__136621) : fexpr__136619.call(null,G__136620,G__136621));
})();
var cr135888_place_171 = (function (){var G__136623 = cr135888_place_160;
var G__136624 = cr135888_place_164;
var G__136625 = cr135888_place_170;
var fexpr__136622 = cr135888_place_159;
return (fexpr__136622.cljs$core$IFn$_invoke$arity$3 ? fexpr__136622.cljs$core$IFn$_invoke$arity$3(G__136623,G__136624,G__136625) : fexpr__136622.call(null,G__136623,G__136624,G__136625));
})();
(cr135888_state[(0)] = cr135888_block_24);

(cr135888_state[(2)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(5)] = null);

(cr135888_state[(1)] = cr135888_place_171);

return cr135888_state;
}catch (e136613){var cr135888_exception = e136613;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(5)] = null);

throw cr135888_exception;
}});
var cr135888_block_6 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_6(cr135888_state){
try{var cr135888_place_27 = (cr135888_state[(2)]);
var cr135888_place_48 = cljs.core.seq;
var cr135888_place_49 = cr135888_place_27;
var cr135888_place_50 = (function (){var G__136628 = cr135888_place_49;
var fexpr__136627 = cr135888_place_48;
return (fexpr__136627.cljs$core$IFn$_invoke$arity$1 ? fexpr__136627.cljs$core$IFn$_invoke$arity$1(G__136628) : fexpr__136627.call(null,G__136628));
})();
var cr135888_place_51 = null;
if(cljs.core.truth_(cr135888_place_50)){
(cr135888_state[(0)] = cr135888_block_8);

(cr135888_state[(6)] = cr135888_place_51);

return cr135888_state;
} else {
(cr135888_state[(0)] = cr135888_block_7);

(cr135888_state[(6)] = cr135888_place_51);

return cr135888_state;
}
}catch (e136626){var cr135888_exception = e136626;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(5)] = null);

throw cr135888_exception;
}});
var cr135888_block_3 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_3(cr135888_state){
try{var cr135888_place_28 = null;
(cr135888_state[(0)] = cr135888_block_6);

(cr135888_state[(2)] = cr135888_place_28);

return cr135888_state;
}catch (e136629){var cr135888_exception = e136629;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(5)] = null);

throw cr135888_exception;
}});
var cr135888_block_18 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_18(cr135888_state){
try{var cr135888_place_114 = (cr135888_state[(10)]);
var cr135888_place_119 = cljs.core.first;
var cr135888_place_120 = cr135888_place_114;
var cr135888_place_121 = (function (){var G__136632 = cr135888_place_120;
var fexpr__136631 = cr135888_place_119;
return (fexpr__136631.cljs$core$IFn$_invoke$arity$1 ? fexpr__136631.cljs$core$IFn$_invoke$arity$1(G__136632) : fexpr__136631.call(null,G__136632));
})();
var cr135888_place_122 = frontend.worker.rtc.client_op.remove_asset_op;
var cr135888_place_123 = repo;
var cr135888_place_124 = cr135888_place_121;
var cr135888_place_125 = (function (){var G__136634 = cr135888_place_123;
var G__136635 = cr135888_place_124;
var fexpr__136633 = cr135888_place_122;
return (fexpr__136633.cljs$core$IFn$_invoke$arity$2 ? fexpr__136633.cljs$core$IFn$_invoke$arity$2(G__136634,G__136635) : fexpr__136633.call(null,G__136634,G__136635));
})();
var cr135888_place_126 = null;
var cr135888_place_127 = cljs.core.next;
var cr135888_place_128 = cr135888_place_114;
var cr135888_place_129 = (function (){var G__136637 = cr135888_place_128;
var fexpr__136636 = cr135888_place_127;
return (fexpr__136636.cljs$core$IFn$_invoke$arity$1 ? fexpr__136636.cljs$core$IFn$_invoke$arity$1(G__136637) : fexpr__136636.call(null,G__136637));
})();
var cr135888_place_130 = null;
var cr135888_place_131 = (0);
var cr135888_place_132 = (0);
(cr135888_state[(0)] = cr135888_block_14);

(cr135888_state[(10)] = null);

(cr135888_state[(6)] = cr135888_place_130);

(cr135888_state[(7)] = cr135888_place_132);

(cr135888_state[(8)] = cr135888_place_129);

(cr135888_state[(9)] = cr135888_place_131);

return cr135888_state;
}catch (e136630){var cr135888_exception = e136630;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(10)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(6)] = null);

(cr135888_state[(7)] = null);

(cr135888_state[(8)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(5)] = null);

(cr135888_state[(9)] = null);

throw cr135888_exception;
}});
var cr135888_block_21 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_21(cr135888_state){
try{var cr135888_place_100 = (cr135888_state[(6)]);
var cr135888_place_102 = (cr135888_state[(7)]);
var cr135888_place_99 = (cr135888_state[(8)]);
var cr135888_place_101 = (cr135888_state[(9)]);
var cr135888_place_144 = cljs.core._nth;
var cr135888_place_145 = cr135888_place_100;
var cr135888_place_146 = cr135888_place_102;
var cr135888_place_147 = (function (){var G__136643 = cr135888_place_145;
var G__136644 = cr135888_place_146;
var fexpr__136642 = cr135888_place_144;
return (fexpr__136642.cljs$core$IFn$_invoke$arity$2 ? fexpr__136642.cljs$core$IFn$_invoke$arity$2(G__136643,G__136644) : fexpr__136642.call(null,G__136643,G__136644));
})();
var cr135888_place_148 = frontend.worker.rtc.client_op.remove_asset_op;
var cr135888_place_149 = repo;
var cr135888_place_150 = cr135888_place_147;
var cr135888_place_151 = (function (){var G__136646 = cr135888_place_149;
var G__136647 = cr135888_place_150;
var fexpr__136645 = cr135888_place_148;
return (fexpr__136645.cljs$core$IFn$_invoke$arity$2 ? fexpr__136645.cljs$core$IFn$_invoke$arity$2(G__136646,G__136647) : fexpr__136645.call(null,G__136646,G__136647));
})();
var cr135888_place_152 = null;
var cr135888_place_153 = cr135888_place_99;
var cr135888_place_154 = cr135888_place_100;
var cr135888_place_155 = cr135888_place_101;
var cr135888_place_156 = cr135888_place_102;
var cr135888_place_157 = (1);
var cr135888_place_158 = (cr135888_place_156 + cr135888_place_157);
(cr135888_state[(0)] = cr135888_block_14);

(cr135888_state[(6)] = cr135888_place_154);

(cr135888_state[(7)] = cr135888_place_158);

(cr135888_state[(8)] = cr135888_place_153);

(cr135888_state[(9)] = cr135888_place_155);

return cr135888_state;
}catch (e136638){var cr135888_exception = e136638;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(6)] = null);

(cr135888_state[(7)] = null);

(cr135888_state[(8)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(5)] = null);

(cr135888_state[(9)] = null);

throw cr135888_exception;
}});
var cr135888_block_20 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_20(cr135888_state){
try{var cr135888_place_112 = (cr135888_state[(6)]);
(cr135888_state[(0)] = cr135888_block_22);

(cr135888_state[(6)] = null);

(cr135888_state[(10)] = cr135888_place_112);

return cr135888_state;
}catch (e136648){var cr135888_exception = e136648;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(6)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(5)] = null);

(cr135888_state[(10)] = null);

throw cr135888_exception;
}});
var cr135888_block_8 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_8(cr135888_state){
try{var cr135888_place_27 = (cr135888_state[(2)]);
var cr135888_place_53 = new cljs.core.Keyword("rtc.asset.log","upload-assets","rtc.asset.log/upload-assets",1562167732);
var cr135888_place_54 = new cljs.core.Keyword(null,"asset-uuids","asset-uuids",-783416816);
var cr135888_place_55 = cljs.core.keys;
var cr135888_place_56 = cr135888_place_27;
var cr135888_place_57 = (function (){var G__136651 = cr135888_place_56;
var fexpr__136650 = cr135888_place_55;
return (fexpr__136650.cljs$core$IFn$_invoke$arity$1 ? fexpr__136650.cljs$core$IFn$_invoke$arity$1(G__136651) : fexpr__136650.call(null,G__136651));
})();
var cr135888_place_58 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135888_place_54,cr135888_place_57]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135888_place_59 = add_log_fn;
var cr135888_place_60 = cr135888_place_53;
var cr135888_place_61 = cr135888_place_58;
var cr135888_place_62 = (function (){var G__136653 = cr135888_place_60;
var G__136654 = cr135888_place_61;
var fexpr__136652 = cr135888_place_59;
return (fexpr__136652.cljs$core$IFn$_invoke$arity$2 ? fexpr__136652.cljs$core$IFn$_invoke$arity$2(G__136653,G__136654) : fexpr__136652.call(null,G__136653,G__136654));
})();
(cr135888_state[(0)] = cr135888_block_9);

(cr135888_state[(6)] = cr135888_place_62);

return cr135888_state;
}catch (e136649){var cr135888_exception = e136649;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(6)] = null);

(cr135888_state[(5)] = null);

throw cr135888_exception;
}});
var cr135888_block_14 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_14(cr135888_state){
try{var cr135888_place_102 = (cr135888_state[(7)]);
var cr135888_place_101 = (cr135888_state[(9)]);
var cr135888_place_103 = cr135888_place_102;
var cr135888_place_104 = cr135888_place_101;
var cr135888_place_105 = (cr135888_place_103 < cr135888_place_104);
var cr135888_place_106 = cr135888_place_105;
var cr135888_place_107 = null;
if(cr135888_place_106){
(cr135888_state[(0)] = cr135888_block_21);

return cr135888_state;
} else {
(cr135888_state[(0)] = cr135888_block_15);

(cr135888_state[(10)] = cr135888_place_107);

return cr135888_state;
}
}catch (e136655){var cr135888_exception = e136655;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(6)] = null);

(cr135888_state[(7)] = null);

(cr135888_state[(8)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(5)] = null);

(cr135888_state[(9)] = null);

throw cr135888_exception;
}});
var cr135888_block_11 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_11(cr135888_state){
try{var cr135888_place_74 = null;
(cr135888_state[(0)] = cr135888_block_23);

(cr135888_state[(4)] = cr135888_place_74);

return cr135888_state;
}catch (e136656){var cr135888_exception = e136656;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(5)] = null);

throw cr135888_exception;
}});
var cr135888_block_10 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_10(cr135888_state){
try{var cr135888_place_16 = (cr135888_state[(5)]);
var cr135888_place_69 = missionary.core.unpark();
var cr135888_place_70 = cljs.core.seq;
var cr135888_place_71 = cr135888_place_16;
var cr135888_place_72 = (function (){var G__136659 = cr135888_place_71;
var fexpr__136658 = cr135888_place_70;
return (fexpr__136658.cljs$core$IFn$_invoke$arity$1 ? fexpr__136658.cljs$core$IFn$_invoke$arity$1(G__136659) : fexpr__136658.call(null,G__136659));
})();
var cr135888_place_73 = null;
if(cljs.core.truth_(cr135888_place_72)){
(cr135888_state[(0)] = cr135888_block_12);

(cr135888_state[(4)] = cr135888_place_73);

return cr135888_state;
} else {
(cr135888_state[(0)] = cr135888_block_11);

(cr135888_state[(4)] = cr135888_place_73);

return cr135888_state;
}
}catch (e136657){var cr135888_exception = e136657;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(5)] = null);

throw cr135888_exception;
}});
var cr135888_block_12 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_12(cr135888_state){
try{var cr135888_place_16 = (cr135888_state[(5)]);
var cr135888_place_75 = new cljs.core.Keyword("rtc.asset.log","remove-assets","rtc.asset.log/remove-assets",1813160439);
var cr135888_place_76 = new cljs.core.Keyword(null,"asset-uuids","asset-uuids",-783416816);
var cr135888_place_77 = cr135888_place_16;
var cr135888_place_78 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135888_place_76,cr135888_place_77]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135888_place_79 = add_log_fn;
var cr135888_place_80 = cr135888_place_75;
var cr135888_place_81 = cr135888_place_78;
var cr135888_place_82 = (function (){var G__136662 = cr135888_place_80;
var G__136663 = cr135888_place_81;
var fexpr__136661 = cr135888_place_79;
return (fexpr__136661.cljs$core$IFn$_invoke$arity$2 ? fexpr__136661.cljs$core$IFn$_invoke$arity$2(G__136662,G__136663) : fexpr__136661.call(null,G__136662,G__136663));
})();
var cr135888_place_83 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr135888_place_84 = get_ws_create_task;
var cr135888_place_85 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr135888_place_86 = "delete-assets";
var cr135888_place_87 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr135888_place_88 = graph_uuid;
var cr135888_place_89 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr135888_place_90 = major_schema_version;
var cr135888_place_91 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr135888_place_90);
var cr135888_place_92 = new cljs.core.Keyword(null,"asset-uuids","asset-uuids",-783416816);
var cr135888_place_93 = cr135888_place_16;
var cr135888_place_94 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135888_place_87,cr135888_place_88,cr135888_place_92,cr135888_place_93,cr135888_place_85,cr135888_place_86,cr135888_place_89,cr135888_place_91]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135888_place_95 = (function (){var G__136665 = cr135888_place_84;
var G__136666 = cr135888_place_94;
var fexpr__136664 = cr135888_place_83;
return (fexpr__136664.cljs$core$IFn$_invoke$arity$2 ? fexpr__136664.cljs$core$IFn$_invoke$arity$2(G__136665,G__136666) : fexpr__136664.call(null,G__136665,G__136666));
})();
(cr135888_state[(0)] = cr135888_block_13);

return missionary.core.park(cr135888_place_95);
}catch (e136660){var cr135888_exception = e136660;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(5)] = null);

throw cr135888_exception;
}});
var cr135888_block_13 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr135888_block_13(cr135888_state){
try{var cr135888_place_16 = (cr135888_state[(5)]);
var cr135888_place_96 = missionary.core.unpark();
var cr135888_place_97 = cljs.core.seq;
var cr135888_place_98 = cr135888_place_16;
var cr135888_place_99 = (function (){var G__136669 = cr135888_place_98;
var fexpr__136668 = cr135888_place_97;
return (fexpr__136668.cljs$core$IFn$_invoke$arity$1 ? fexpr__136668.cljs$core$IFn$_invoke$arity$1(G__136669) : fexpr__136668.call(null,G__136669));
})();
var cr135888_place_100 = null;
var cr135888_place_101 = (0);
var cr135888_place_102 = (0);
(cr135888_state[(0)] = cr135888_block_14);

(cr135888_state[(8)] = cr135888_place_99);

(cr135888_state[(6)] = cr135888_place_100);

(cr135888_state[(9)] = cr135888_place_101);

(cr135888_state[(7)] = cr135888_place_102);

return cr135888_state;
}catch (e136667){var cr135888_exception = e136667;
(cr135888_state[(0)] = null);

(cr135888_state[(2)] = null);

(cr135888_state[(3)] = null);

(cr135888_state[(1)] = null);

(cr135888_state[(4)] = null);

(cr135888_state[(5)] = null);

throw cr135888_exception;
}});
return cloroutine.impl.coroutine((function (){var G__136670 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((11));
(G__136670[(0)] = cr135888_block_0);

return G__136670;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.asset.new_task__pull_remote_asset_updates = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates(repo,get_ws_create_task,conn,graph_uuid,add_log_fn,asset_update_ops){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr136671_block_10 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_10(cr136671_state){
try{var cr136671_place_56 = (cr136671_state[(8)]);
var cr136671_place_60 = cr136671_place_56;
var cr136671_place_61 = cljs.core.chunked_seq_QMARK_;
var cr136671_place_62 = cr136671_place_60;
var cr136671_place_63 = (function (){var G__136812 = cr136671_place_62;
var fexpr__136811 = cr136671_place_61;
return (fexpr__136811.cljs$core$IFn$_invoke$arity$1 ? fexpr__136811.cljs$core$IFn$_invoke$arity$1(G__136812) : fexpr__136811.call(null,G__136812));
})();
var cr136671_place_64 = null;
if(cljs.core.truth_(cr136671_place_63)){
(cr136671_state[(0)] = cr136671_block_13);

(cr136671_state[(8)] = null);

(cr136671_state[(8)] = cr136671_place_60);

return cr136671_state;
} else {
(cr136671_state[(0)] = cr136671_block_11);

(cr136671_state[(8)] = null);

(cr136671_state[(8)] = cr136671_place_60);

return cr136671_state;
}
}catch (e136810){var cr136671_exception = e136810;
(cr136671_state[(0)] = null);

(cr136671_state[(2)] = null);

(cr136671_state[(5)] = null);

(cr136671_state[(6)] = null);

(cr136671_state[(8)] = null);

(cr136671_state[(3)] = null);

(cr136671_state[(4)] = null);

(cr136671_state[(1)] = null);

(cr136671_state[(7)] = null);

throw cr136671_exception;
}});
var cr136671_block_13 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_13(cr136671_state){
try{var cr136671_place_60 = (cr136671_state[(8)]);
var cr136671_place_95 = cljs.core.chunk_first;
var cr136671_place_96 = cr136671_place_60;
var cr136671_place_97 = (function (){var G__136818 = cr136671_place_96;
var fexpr__136817 = cr136671_place_95;
return (fexpr__136817.cljs$core$IFn$_invoke$arity$1 ? fexpr__136817.cljs$core$IFn$_invoke$arity$1(G__136818) : fexpr__136817.call(null,G__136818));
})();
var cr136671_place_98 = cljs.core.chunk_rest;
var cr136671_place_99 = cr136671_place_60;
var cr136671_place_100 = (function (){var G__136820 = cr136671_place_99;
var fexpr__136819 = cr136671_place_98;
return (fexpr__136819.cljs$core$IFn$_invoke$arity$1 ? fexpr__136819.cljs$core$IFn$_invoke$arity$1(G__136820) : fexpr__136819.call(null,G__136820));
})();
var cr136671_place_101 = cr136671_place_97;
var cr136671_place_102 = cljs.core.count;
var cr136671_place_103 = cr136671_place_97;
var cr136671_place_104 = (function (){var G__136822 = cr136671_place_103;
var fexpr__136821 = cr136671_place_102;
return (fexpr__136821.cljs$core$IFn$_invoke$arity$1 ? fexpr__136821.cljs$core$IFn$_invoke$arity$1(G__136822) : fexpr__136821.call(null,G__136822));
})();
var cr136671_place_105 = (0);
(cr136671_state[(0)] = cr136671_block_7);

(cr136671_state[(8)] = null);

(cr136671_state[(2)] = cr136671_place_104);

(cr136671_state[(5)] = cr136671_place_100);

(cr136671_state[(6)] = cr136671_place_105);

(cr136671_state[(7)] = cr136671_place_101);

return cr136671_state;
}catch (e136813){var cr136671_exception = e136813;
(cr136671_state[(0)] = null);

(cr136671_state[(8)] = null);

(cr136671_state[(2)] = null);

(cr136671_state[(5)] = null);

(cr136671_state[(6)] = null);

(cr136671_state[(3)] = null);

(cr136671_state[(4)] = null);

(cr136671_state[(1)] = null);

(cr136671_state[(7)] = null);

throw cr136671_exception;
}});
var cr136671_block_18 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_18(cr136671_state){
try{var cr136671_place_141 = null;
(cr136671_state[(0)] = cr136671_block_20);

(cr136671_state[(2)] = cr136671_place_141);

return cr136671_state;
}catch (e136823){var cr136671_exception = e136823;
(cr136671_state[(0)] = null);

(cr136671_state[(3)] = null);

(cr136671_state[(4)] = null);

(cr136671_state[(1)] = null);

(cr136671_state[(2)] = null);

throw cr136671_exception;
}});
var cr136671_block_17 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_17(cr136671_state){
try{var cr136671_place_53 = (cr136671_state[(8)]);
var cr136671_place_26 = (cr136671_state[(3)]);
var cr136671_place_137 = cljs.core.seq;
var cr136671_place_138 = cr136671_place_26;
var cr136671_place_139 = (function (){var G__136826 = cr136671_place_138;
var fexpr__136825 = cr136671_place_137;
return (fexpr__136825.cljs$core$IFn$_invoke$arity$1 ? fexpr__136825.cljs$core$IFn$_invoke$arity$1(G__136826) : fexpr__136825.call(null,G__136826));
})();
var cr136671_place_140 = null;
if(cljs.core.truth_(cr136671_place_139)){
(cr136671_state[(0)] = cr136671_block_19);

(cr136671_state[(8)] = null);

(cr136671_state[(2)] = cr136671_place_140);

return cr136671_state;
} else {
(cr136671_state[(0)] = cr136671_block_18);

(cr136671_state[(8)] = null);

(cr136671_state[(2)] = cr136671_place_140);

return cr136671_state;
}
}catch (e136824){var cr136671_exception = e136824;
(cr136671_state[(0)] = null);

(cr136671_state[(8)] = null);

(cr136671_state[(3)] = null);

(cr136671_state[(4)] = null);

(cr136671_state[(1)] = null);

throw cr136671_exception;
}});
var cr136671_block_22 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_22(cr136671_state){
try{var cr136671_place_3 = (cr136671_state[(1)]);
(cr136671_state[(0)] = null);

(cr136671_state[(1)] = null);

return cr136671_place_3;
}catch (e136827){var cr136671_exception = e136827;
(cr136671_state[(0)] = null);

(cr136671_state[(1)] = null);

throw cr136671_exception;
}});
var cr136671_block_6 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_6(cr136671_state){
try{var cr136671_place_15 = (cr136671_state[(2)]);
var cr136671_place_26 = (cr136671_state[(3)]);
var cr136671_place_43 = cljs.core.seq;
var cr136671_place_44 = cr136671_place_15;
var cr136671_place_45 = (function (){var G__136830 = cr136671_place_44;
var fexpr__136829 = cr136671_place_43;
return (fexpr__136829.cljs$core$IFn$_invoke$arity$1 ? fexpr__136829.cljs$core$IFn$_invoke$arity$1(G__136830) : fexpr__136829.call(null,G__136830));
})();
var cr136671_place_46 = null;
var cr136671_place_47 = (0);
var cr136671_place_48 = (0);
(cr136671_state[(0)] = cr136671_block_7);

(cr136671_state[(2)] = null);

(cr136671_state[(5)] = cr136671_place_45);

(cr136671_state[(7)] = cr136671_place_46);

(cr136671_state[(2)] = cr136671_place_47);

(cr136671_state[(6)] = cr136671_place_48);

return cr136671_state;
}catch (e136828){var cr136671_exception = e136828;
(cr136671_state[(0)] = null);

(cr136671_state[(2)] = null);

(cr136671_state[(3)] = null);

(cr136671_state[(4)] = null);

(cr136671_state[(1)] = null);

throw cr136671_exception;
}});
var cr136671_block_11 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_11(cr136671_state){
try{var cr136671_place_60 = (cr136671_state[(8)]);
var cr136671_place_65 = cljs.core.first;
var cr136671_place_66 = cr136671_place_60;
var cr136671_place_67 = (function (){var G__136833 = cr136671_place_66;
var fexpr__136832 = cr136671_place_65;
return (fexpr__136832.cljs$core$IFn$_invoke$arity$1 ? fexpr__136832.cljs$core$IFn$_invoke$arity$1(G__136833) : fexpr__136832.call(null,G__136833));
})();
var cr136671_place_68 = cljs.core.nth;
var cr136671_place_69 = cr136671_place_67;
var cr136671_place_70 = (0);
var cr136671_place_71 = null;
var cr136671_place_72 = (function (){var G__136835 = cr136671_place_69;
var G__136836 = cr136671_place_70;
var G__136837 = cr136671_place_71;
var fexpr__136834 = cr136671_place_68;
return (fexpr__136834.cljs$core$IFn$_invoke$arity$3 ? fexpr__136834.cljs$core$IFn$_invoke$arity$3(G__136835,G__136836,G__136837) : fexpr__136834.call(null,G__136835,G__136836,G__136837));
})();
var cr136671_place_73 = cljs.core.nth;
var cr136671_place_74 = cr136671_place_67;
var cr136671_place_75 = (1);
var cr136671_place_76 = null;
var cr136671_place_77 = (function (){var G__136839 = cr136671_place_74;
var G__136840 = cr136671_place_75;
var G__136841 = cr136671_place_76;
var fexpr__136838 = cr136671_place_73;
return (fexpr__136838.cljs$core$IFn$_invoke$arity$3 ? fexpr__136838.cljs$core$IFn$_invoke$arity$3(G__136839,G__136840,G__136841) : fexpr__136838.call(null,G__136839,G__136840,G__136841));
})();
var cr136671_place_78 = frontend.common.missionary._LT__BANG_;
var cr136671_place_79 = frontend.worker.state._LT_invoke_main_thread;
var cr136671_place_80 = new cljs.core.Keyword("thread-api","unlink-asset","thread-api/unlink-asset",289779656);
var cr136671_place_81 = repo;
var cr136671_place_82 = cr136671_place_72;
var cr136671_place_83 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr136671_place_82);
var cr136671_place_84 = cr136671_place_77;
var cr136671_place_85 = (function (){var G__136843 = cr136671_place_80;
var G__136844 = cr136671_place_81;
var G__136845 = cr136671_place_83;
var G__136846 = cr136671_place_84;
var fexpr__136842 = cr136671_place_79;
return (fexpr__136842.cljs$core$IFn$_invoke$arity$4 ? fexpr__136842.cljs$core$IFn$_invoke$arity$4(G__136843,G__136844,G__136845,G__136846) : fexpr__136842.call(null,G__136843,G__136844,G__136845,G__136846));
})();
var cr136671_place_86 = (function (){var G__136848 = cr136671_place_85;
var fexpr__136847 = cr136671_place_78;
return (fexpr__136847.cljs$core$IFn$_invoke$arity$1 ? fexpr__136847.cljs$core$IFn$_invoke$arity$1(G__136848) : fexpr__136847.call(null,G__136848));
})();
(cr136671_state[(0)] = cr136671_block_12);

return missionary.core.park(cr136671_place_86);
}catch (e136831){var cr136671_exception = e136831;
(cr136671_state[(0)] = null);

(cr136671_state[(8)] = null);

(cr136671_state[(2)] = null);

(cr136671_state[(5)] = null);

(cr136671_state[(6)] = null);

(cr136671_state[(3)] = null);

(cr136671_state[(4)] = null);

(cr136671_state[(1)] = null);

(cr136671_state[(7)] = null);

throw cr136671_exception;
}});
var cr136671_block_16 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_16(cr136671_state){
try{var cr136671_place_47 = (cr136671_state[(2)]);
var cr136671_place_45 = (cr136671_state[(5)]);
var cr136671_place_48 = (cr136671_state[(6)]);
var cr136671_place_46 = (cr136671_state[(7)]);
var cr136671_place_129 = missionary.core.unpark();
var cr136671_place_130 = null;
var cr136671_place_131 = cr136671_place_45;
var cr136671_place_132 = cr136671_place_46;
var cr136671_place_133 = cr136671_place_47;
var cr136671_place_134 = cr136671_place_48;
var cr136671_place_135 = (1);
var cr136671_place_136 = (cr136671_place_134 + cr136671_place_135);
(cr136671_state[(0)] = cr136671_block_7);

(cr136671_state[(2)] = cr136671_place_133);

(cr136671_state[(5)] = cr136671_place_131);

(cr136671_state[(6)] = cr136671_place_136);

(cr136671_state[(7)] = cr136671_place_132);

return cr136671_state;
}catch (e136849){var cr136671_exception = e136849;
(cr136671_state[(0)] = null);

(cr136671_state[(2)] = null);

(cr136671_state[(5)] = null);

(cr136671_state[(6)] = null);

(cr136671_state[(3)] = null);

(cr136671_state[(4)] = null);

(cr136671_state[(1)] = null);

(cr136671_state[(7)] = null);

throw cr136671_exception;
}});
var cr136671_block_20 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_20(cr136671_state){
try{var cr136671_place_26 = (cr136671_state[(3)]);
var cr136671_place_22 = (cr136671_state[(4)]);
var cr136671_place_140 = (cr136671_state[(2)]);
var cr136671_place_152 = frontend.worker.rtc.asset.new_task__concurrent_download_assets;
var cr136671_place_153 = repo;
var cr136671_place_154 = cr136671_place_26;
var cr136671_place_155 = cr136671_place_22;
var cr136671_place_156 = (function (){var G__136852 = cr136671_place_153;
var G__136853 = cr136671_place_154;
var G__136854 = cr136671_place_155;
var fexpr__136851 = cr136671_place_152;
return (fexpr__136851.cljs$core$IFn$_invoke$arity$3 ? fexpr__136851.cljs$core$IFn$_invoke$arity$3(G__136852,G__136853,G__136854) : fexpr__136851.call(null,G__136852,G__136853,G__136854));
})();
(cr136671_state[(0)] = cr136671_block_21);

(cr136671_state[(3)] = null);

(cr136671_state[(4)] = null);

(cr136671_state[(2)] = null);

return missionary.core.park(cr136671_place_156);
}catch (e136850){var cr136671_exception = e136850;
(cr136671_state[(0)] = null);

(cr136671_state[(3)] = null);

(cr136671_state[(4)] = null);

(cr136671_state[(1)] = null);

(cr136671_state[(2)] = null);

throw cr136671_exception;
}});
var cr136671_block_0 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_0(cr136671_state){
try{var cr136671_place_0 = cljs.core.seq;
var cr136671_place_1 = asset_update_ops;
var cr136671_place_2 = (function (){var G__136857 = cr136671_place_1;
var fexpr__136856 = cr136671_place_0;
return (fexpr__136856.cljs$core$IFn$_invoke$arity$1 ? fexpr__136856.cljs$core$IFn$_invoke$arity$1(G__136857) : fexpr__136856.call(null,G__136857));
})();
var cr136671_place_3 = null;
if(cljs.core.truth_(cr136671_place_2)){
(cr136671_state[(0)] = cr136671_block_2);

(cr136671_state[(1)] = cr136671_place_3);

return cr136671_state;
} else {
(cr136671_state[(0)] = cr136671_block_1);

(cr136671_state[(1)] = cr136671_place_3);

return cr136671_state;
}
}catch (e136855){var cr136671_exception = e136855;
(cr136671_state[(0)] = null);

throw cr136671_exception;
}});
var cr136671_block_5 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_5(cr136671_state){
try{var cr136671_place_28 = (cr136671_state[(5)]);
var cr136671_place_41 = missionary.core.unpark();
var cr136671_place_42 = cr136671_place_28.cljs$core$IFn$_invoke$arity$1(cr136671_place_41);
(cr136671_state[(0)] = cr136671_block_6);

(cr136671_state[(5)] = null);

(cr136671_state[(3)] = cr136671_place_42);

return cr136671_state;
}catch (e136858){var cr136671_exception = e136858;
(cr136671_state[(0)] = null);

(cr136671_state[(2)] = null);

(cr136671_state[(5)] = null);

(cr136671_state[(3)] = null);

(cr136671_state[(4)] = null);

(cr136671_state[(1)] = null);

throw cr136671_exception;
}});
var cr136671_block_1 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_1(cr136671_state){
try{var cr136671_place_4 = null;
(cr136671_state[(0)] = cr136671_block_22);

(cr136671_state[(1)] = cr136671_place_4);

return cr136671_state;
}catch (e136859){var cr136671_exception = e136859;
(cr136671_state[(0)] = null);

(cr136671_state[(1)] = null);

throw cr136671_exception;
}});
var cr136671_block_14 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_14(cr136671_state){
try{var cr136671_place_58 = (cr136671_state[(2)]);
(cr136671_state[(0)] = cr136671_block_17);

(cr136671_state[(2)] = null);

(cr136671_state[(8)] = cr136671_place_58);

return cr136671_state;
}catch (e136860){var cr136671_exception = e136860;
(cr136671_state[(0)] = null);

(cr136671_state[(2)] = null);

(cr136671_state[(8)] = null);

(cr136671_state[(3)] = null);

(cr136671_state[(4)] = null);

(cr136671_state[(1)] = null);

throw cr136671_exception;
}});
var cr136671_block_21 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_21(cr136671_state){
try{var cr136671_place_157 = missionary.core.unpark();
(cr136671_state[(0)] = cr136671_block_22);

(cr136671_state[(1)] = cr136671_place_157);

return cr136671_state;
}catch (e136861){var cr136671_exception = e136861;
(cr136671_state[(0)] = null);

(cr136671_state[(1)] = null);

throw cr136671_exception;
}});
var cr136671_block_4 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_4(cr136671_state){
try{var cr136671_place_22 = (cr136671_state[(4)]);
var cr136671_place_28 = new cljs.core.Keyword(null,"asset-uuid->url","asset-uuid->url",354369294);
var cr136671_place_29 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr136671_place_30 = get_ws_create_task;
var cr136671_place_31 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr136671_place_32 = "get-assets-download-urls";
var cr136671_place_33 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr136671_place_34 = graph_uuid;
var cr136671_place_35 = new cljs.core.Keyword(null,"asset-uuids","asset-uuids",-783416816);
var cr136671_place_36 = cljs.core.keys;
var cr136671_place_37 = cr136671_place_22;
var cr136671_place_38 = (function (){var G__136864 = cr136671_place_37;
var fexpr__136863 = cr136671_place_36;
return (fexpr__136863.cljs$core$IFn$_invoke$arity$1 ? fexpr__136863.cljs$core$IFn$_invoke$arity$1(G__136864) : fexpr__136863.call(null,G__136864));
})();
var cr136671_place_39 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr136671_place_33,cr136671_place_34,cr136671_place_35,cr136671_place_38,cr136671_place_31,cr136671_place_32]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr136671_place_40 = (function (){var G__136866 = cr136671_place_30;
var G__136867 = cr136671_place_39;
var fexpr__136865 = cr136671_place_29;
return (fexpr__136865.cljs$core$IFn$_invoke$arity$2 ? fexpr__136865.cljs$core$IFn$_invoke$arity$2(G__136866,G__136867) : fexpr__136865.call(null,G__136866,G__136867));
})();
(cr136671_state[(0)] = cr136671_block_5);

(cr136671_state[(5)] = cr136671_place_28);

return missionary.core.park(cr136671_place_40);
}catch (e136862){var cr136671_exception = e136862;
(cr136671_state[(0)] = null);

(cr136671_state[(2)] = null);

(cr136671_state[(3)] = null);

(cr136671_state[(4)] = null);

(cr136671_state[(1)] = null);

throw cr136671_exception;
}});
var cr136671_block_9 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_9(cr136671_state){
try{var cr136671_place_59 = null;
(cr136671_state[(0)] = cr136671_block_14);

(cr136671_state[(2)] = cr136671_place_59);

return cr136671_state;
}catch (e136868){var cr136671_exception = e136868;
(cr136671_state[(0)] = null);

(cr136671_state[(2)] = null);

(cr136671_state[(8)] = null);

(cr136671_state[(3)] = null);

(cr136671_state[(4)] = null);

(cr136671_state[(1)] = null);

throw cr136671_exception;
}});
var cr136671_block_19 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_19(cr136671_state){
try{var cr136671_place_26 = (cr136671_state[(3)]);
var cr136671_place_142 = new cljs.core.Keyword("rtc.asset.log","download-assets","rtc.asset.log/download-assets",-1980226986);
var cr136671_place_143 = new cljs.core.Keyword(null,"asset-uuids","asset-uuids",-783416816);
var cr136671_place_144 = cljs.core.keys;
var cr136671_place_145 = cr136671_place_26;
var cr136671_place_146 = (function (){var G__136871 = cr136671_place_145;
var fexpr__136870 = cr136671_place_144;
return (fexpr__136870.cljs$core$IFn$_invoke$arity$1 ? fexpr__136870.cljs$core$IFn$_invoke$arity$1(G__136871) : fexpr__136870.call(null,G__136871));
})();
var cr136671_place_147 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr136671_place_143,cr136671_place_146]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr136671_place_148 = add_log_fn;
var cr136671_place_149 = cr136671_place_142;
var cr136671_place_150 = cr136671_place_147;
var cr136671_place_151 = (function (){var G__136873 = cr136671_place_149;
var G__136874 = cr136671_place_150;
var fexpr__136872 = cr136671_place_148;
return (fexpr__136872.cljs$core$IFn$_invoke$arity$2 ? fexpr__136872.cljs$core$IFn$_invoke$arity$2(G__136873,G__136874) : fexpr__136872.call(null,G__136873,G__136874));
})();
(cr136671_state[(0)] = cr136671_block_20);

(cr136671_state[(2)] = cr136671_place_151);

return cr136671_state;
}catch (e136869){var cr136671_exception = e136869;
(cr136671_state[(0)] = null);

(cr136671_state[(3)] = null);

(cr136671_state[(4)] = null);

(cr136671_state[(1)] = null);

(cr136671_state[(2)] = null);

throw cr136671_exception;
}});
var cr136671_block_2 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_2(cr136671_state){
try{var cr136671_place_5 = cljs.core.keep;
var cr136671_place_6 = (function (op){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"update-asset","update-asset",501550582),new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(op))){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(op);
} else {
return null;
}
});
var cr136671_place_7 = asset_update_ops;
var cr136671_place_8 = (function (){var G__136877 = cr136671_place_6;
var G__136878 = cr136671_place_7;
var fexpr__136876 = cr136671_place_5;
return (fexpr__136876.cljs$core$IFn$_invoke$arity$2 ? fexpr__136876.cljs$core$IFn$_invoke$arity$2(G__136877,G__136878) : fexpr__136876.call(null,G__136877,G__136878));
})();
var cr136671_place_9 = cljs.core.into;
var cr136671_place_10 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr136671_place_11 = cljs.core.keep;
var cr136671_place_12 = (function (op){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854),new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(op))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(op),new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098).cljs$core$IFn$_invoke$arity$1(op)], null);
} else {
return null;
}
});
var cr136671_place_13 = (function (){var G__136880 = cr136671_place_12;
var fexpr__136879 = cr136671_place_11;
return (fexpr__136879.cljs$core$IFn$_invoke$arity$1 ? fexpr__136879.cljs$core$IFn$_invoke$arity$1(G__136880) : fexpr__136879.call(null,G__136880));
})();
var cr136671_place_14 = asset_update_ops;
var cr136671_place_15 = (function (){var G__136882 = cr136671_place_10;
var G__136883 = cr136671_place_13;
var G__136884 = cr136671_place_14;
var fexpr__136881 = cr136671_place_9;
return (fexpr__136881.cljs$core$IFn$_invoke$arity$3 ? fexpr__136881.cljs$core$IFn$_invoke$arity$3(G__136882,G__136883,G__136884) : fexpr__136881.call(null,G__136882,G__136883,G__136884));
})();
var cr136671_place_16 = cljs.core.into;
var cr136671_place_17 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr136671_place_18 = cljs.core.keep;
var cr136671_place_19 = (function (asset_uuid){
var temp__5804__auto__ = new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098).cljs$core$IFn$_invoke$arity$1((function (){var G__136672 = cljs.core.deref(conn);
var G__136673 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),asset_uuid], null);
var G__136885 = G__136672;
var G__136886 = G__136673;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__136885,G__136886) : datascript.core.entity.call(null,G__136885,G__136886));
})());
if(cljs.core.truth_(temp__5804__auto__)){
var tp = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [asset_uuid,tp], null);
} else {
return null;
}
});
var cr136671_place_20 = (function (){var G__136888 = cr136671_place_19;
var fexpr__136887 = cr136671_place_18;
return (fexpr__136887.cljs$core$IFn$_invoke$arity$1 ? fexpr__136887.cljs$core$IFn$_invoke$arity$1(G__136888) : fexpr__136887.call(null,G__136888));
})();
var cr136671_place_21 = cr136671_place_8;
var cr136671_place_22 = (function (){var G__136890 = cr136671_place_17;
var G__136891 = cr136671_place_20;
var G__136892 = cr136671_place_21;
var fexpr__136889 = cr136671_place_16;
return (fexpr__136889.cljs$core$IFn$_invoke$arity$3 ? fexpr__136889.cljs$core$IFn$_invoke$arity$3(G__136890,G__136891,G__136892) : fexpr__136889.call(null,G__136890,G__136891,G__136892));
})();
var cr136671_place_23 = cljs.core.seq;
var cr136671_place_24 = cr136671_place_22;
var cr136671_place_25 = (function (){var G__136894 = cr136671_place_24;
var fexpr__136893 = cr136671_place_23;
return (fexpr__136893.cljs$core$IFn$_invoke$arity$1 ? fexpr__136893.cljs$core$IFn$_invoke$arity$1(G__136894) : fexpr__136893.call(null,G__136894));
})();
var cr136671_place_26 = null;
if(cljs.core.truth_(cr136671_place_25)){
(cr136671_state[(0)] = cr136671_block_4);

(cr136671_state[(2)] = cr136671_place_15);

(cr136671_state[(3)] = cr136671_place_26);

(cr136671_state[(4)] = cr136671_place_22);

return cr136671_state;
} else {
(cr136671_state[(0)] = cr136671_block_3);

(cr136671_state[(2)] = cr136671_place_15);

(cr136671_state[(3)] = cr136671_place_26);

(cr136671_state[(4)] = cr136671_place_22);

return cr136671_state;
}
}catch (e136875){var cr136671_exception = e136875;
(cr136671_state[(0)] = null);

(cr136671_state[(1)] = null);

throw cr136671_exception;
}});
var cr136671_block_15 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_15(cr136671_state){
try{var cr136671_place_48 = (cr136671_state[(6)]);
var cr136671_place_46 = (cr136671_state[(7)]);
var cr136671_place_106 = cljs.core._nth;
var cr136671_place_107 = cr136671_place_46;
var cr136671_place_108 = cr136671_place_48;
var cr136671_place_109 = (function (){var G__136897 = cr136671_place_107;
var G__136898 = cr136671_place_108;
var fexpr__136896 = cr136671_place_106;
return (fexpr__136896.cljs$core$IFn$_invoke$arity$2 ? fexpr__136896.cljs$core$IFn$_invoke$arity$2(G__136897,G__136898) : fexpr__136896.call(null,G__136897,G__136898));
})();
var cr136671_place_110 = cljs.core.nth;
var cr136671_place_111 = cr136671_place_109;
var cr136671_place_112 = (0);
var cr136671_place_113 = null;
var cr136671_place_114 = (function (){var G__136900 = cr136671_place_111;
var G__136901 = cr136671_place_112;
var G__136902 = cr136671_place_113;
var fexpr__136899 = cr136671_place_110;
return (fexpr__136899.cljs$core$IFn$_invoke$arity$3 ? fexpr__136899.cljs$core$IFn$_invoke$arity$3(G__136900,G__136901,G__136902) : fexpr__136899.call(null,G__136900,G__136901,G__136902));
})();
var cr136671_place_115 = cljs.core.nth;
var cr136671_place_116 = cr136671_place_109;
var cr136671_place_117 = (1);
var cr136671_place_118 = null;
var cr136671_place_119 = (function (){var G__136904 = cr136671_place_116;
var G__136905 = cr136671_place_117;
var G__136906 = cr136671_place_118;
var fexpr__136903 = cr136671_place_115;
return (fexpr__136903.cljs$core$IFn$_invoke$arity$3 ? fexpr__136903.cljs$core$IFn$_invoke$arity$3(G__136904,G__136905,G__136906) : fexpr__136903.call(null,G__136904,G__136905,G__136906));
})();
var cr136671_place_120 = frontend.common.missionary._LT__BANG_;
var cr136671_place_121 = frontend.worker.state._LT_invoke_main_thread;
var cr136671_place_122 = new cljs.core.Keyword("thread-api","unlink-asset","thread-api/unlink-asset",289779656);
var cr136671_place_123 = repo;
var cr136671_place_124 = cr136671_place_114;
var cr136671_place_125 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr136671_place_124);
var cr136671_place_126 = cr136671_place_119;
var cr136671_place_127 = (function (){var G__136908 = cr136671_place_122;
var G__136909 = cr136671_place_123;
var G__136910 = cr136671_place_125;
var G__136911 = cr136671_place_126;
var fexpr__136907 = cr136671_place_121;
return (fexpr__136907.cljs$core$IFn$_invoke$arity$4 ? fexpr__136907.cljs$core$IFn$_invoke$arity$4(G__136908,G__136909,G__136910,G__136911) : fexpr__136907.call(null,G__136908,G__136909,G__136910,G__136911));
})();
var cr136671_place_128 = (function (){var G__136913 = cr136671_place_127;
var fexpr__136912 = cr136671_place_120;
return (fexpr__136912.cljs$core$IFn$_invoke$arity$1 ? fexpr__136912.cljs$core$IFn$_invoke$arity$1(G__136913) : fexpr__136912.call(null,G__136913));
})();
(cr136671_state[(0)] = cr136671_block_16);

return missionary.core.park(cr136671_place_128);
}catch (e136895){var cr136671_exception = e136895;
(cr136671_state[(0)] = null);

(cr136671_state[(2)] = null);

(cr136671_state[(5)] = null);

(cr136671_state[(6)] = null);

(cr136671_state[(3)] = null);

(cr136671_state[(4)] = null);

(cr136671_state[(1)] = null);

(cr136671_state[(7)] = null);

throw cr136671_exception;
}});
var cr136671_block_7 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_7(cr136671_state){
try{var cr136671_place_47 = (cr136671_state[(2)]);
var cr136671_place_48 = (cr136671_state[(6)]);
var cr136671_place_49 = cr136671_place_48;
var cr136671_place_50 = cr136671_place_47;
var cr136671_place_51 = (cr136671_place_49 < cr136671_place_50);
var cr136671_place_52 = cr136671_place_51;
var cr136671_place_53 = null;
if(cr136671_place_52){
(cr136671_state[(0)] = cr136671_block_15);

return cr136671_state;
} else {
(cr136671_state[(0)] = cr136671_block_8);

(cr136671_state[(8)] = cr136671_place_53);

return cr136671_state;
}
}catch (e136914){var cr136671_exception = e136914;
(cr136671_state[(0)] = null);

(cr136671_state[(2)] = null);

(cr136671_state[(5)] = null);

(cr136671_state[(6)] = null);

(cr136671_state[(3)] = null);

(cr136671_state[(4)] = null);

(cr136671_state[(1)] = null);

(cr136671_state[(7)] = null);

throw cr136671_exception;
}});
var cr136671_block_12 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_12(cr136671_state){
try{var cr136671_place_60 = (cr136671_state[(8)]);
var cr136671_place_87 = missionary.core.unpark();
var cr136671_place_88 = null;
var cr136671_place_89 = cljs.core.next;
var cr136671_place_90 = cr136671_place_60;
var cr136671_place_91 = (function (){var G__136917 = cr136671_place_90;
var fexpr__136916 = cr136671_place_89;
return (fexpr__136916.cljs$core$IFn$_invoke$arity$1 ? fexpr__136916.cljs$core$IFn$_invoke$arity$1(G__136917) : fexpr__136916.call(null,G__136917));
})();
var cr136671_place_92 = null;
var cr136671_place_93 = (0);
var cr136671_place_94 = (0);
(cr136671_state[(0)] = cr136671_block_7);

(cr136671_state[(8)] = null);

(cr136671_state[(2)] = cr136671_place_93);

(cr136671_state[(5)] = cr136671_place_91);

(cr136671_state[(6)] = cr136671_place_94);

(cr136671_state[(7)] = cr136671_place_92);

return cr136671_state;
}catch (e136915){var cr136671_exception = e136915;
(cr136671_state[(0)] = null);

(cr136671_state[(8)] = null);

(cr136671_state[(2)] = null);

(cr136671_state[(5)] = null);

(cr136671_state[(6)] = null);

(cr136671_state[(3)] = null);

(cr136671_state[(4)] = null);

(cr136671_state[(1)] = null);

(cr136671_state[(7)] = null);

throw cr136671_exception;
}});
var cr136671_block_3 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_3(cr136671_state){
try{var cr136671_place_27 = null;
(cr136671_state[(0)] = cr136671_block_6);

(cr136671_state[(3)] = cr136671_place_27);

return cr136671_state;
}catch (e136918){var cr136671_exception = e136918;
(cr136671_state[(0)] = null);

(cr136671_state[(2)] = null);

(cr136671_state[(3)] = null);

(cr136671_state[(4)] = null);

(cr136671_state[(1)] = null);

throw cr136671_exception;
}});
var cr136671_block_8 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr136671_block_8(cr136671_state){
try{var cr136671_place_45 = (cr136671_state[(5)]);
var cr136671_place_54 = cljs.core.seq;
var cr136671_place_55 = cr136671_place_45;
var cr136671_place_56 = (function (){var G__136921 = cr136671_place_55;
var fexpr__136920 = cr136671_place_54;
return (fexpr__136920.cljs$core$IFn$_invoke$arity$1 ? fexpr__136920.cljs$core$IFn$_invoke$arity$1(G__136921) : fexpr__136920.call(null,G__136921));
})();
var cr136671_place_57 = cr136671_place_56;
var cr136671_place_58 = null;
if(cr136671_place_57){
(cr136671_state[(0)] = cr136671_block_10);

(cr136671_state[(8)] = null);

(cr136671_state[(8)] = cr136671_place_56);

return cr136671_state;
} else {
(cr136671_state[(0)] = cr136671_block_9);

(cr136671_state[(2)] = null);

(cr136671_state[(5)] = null);

(cr136671_state[(6)] = null);

(cr136671_state[(7)] = null);

(cr136671_state[(2)] = cr136671_place_58);

return cr136671_state;
}
}catch (e136919){var cr136671_exception = e136919;
(cr136671_state[(0)] = null);

(cr136671_state[(2)] = null);

(cr136671_state[(5)] = null);

(cr136671_state[(6)] = null);

(cr136671_state[(8)] = null);

(cr136671_state[(3)] = null);

(cr136671_state[(4)] = null);

(cr136671_state[(1)] = null);

(cr136671_state[(7)] = null);

throw cr136671_exception;
}});
return cloroutine.impl.coroutine((function (){var G__136922 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((9));
(G__136922[(0)] = cr136671_block_0);

return G__136922;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.asset.get_all_asset_blocks = (function frontend$worker$rtc$asset$get_all_asset_blocks(db){
var G__136923 = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098),new cljs.core.Keyword("logseq.property.asset","checksum","logseq.property.asset/checksum",-1011416979)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098)], null)], null);
var G__136924 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__136923,G__136924) : datascript.core.q.call(null,G__136923,G__136924));
});
frontend.worker.rtc.asset.new_task__initial_download_missing_assets = (function frontend$worker$rtc$asset$new_task__initial_download_missing_assets(repo,get_ws_create_task,graph_uuid,conn,add_log_fn){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr136925_block_0 = (function frontend$worker$rtc$asset$new_task__initial_download_missing_assets_$_cr136925_block_0(cr136925_state){
try{var cr136925_place_0 = frontend.common.missionary._LT__BANG_;
var cr136925_place_1 = frontend.worker.state._LT_invoke_main_thread;
var cr136925_place_2 = new cljs.core.Keyword("thread-api","get-all-asset-file-paths","thread-api/get-all-asset-file-paths",-1018236719);
var cr136925_place_3 = repo;
var cr136925_place_4 = (function (){var G__136978 = cr136925_place_2;
var G__136979 = cr136925_place_3;
var fexpr__136977 = cr136925_place_1;
return (fexpr__136977.cljs$core$IFn$_invoke$arity$2 ? fexpr__136977.cljs$core$IFn$_invoke$arity$2(G__136978,G__136979) : fexpr__136977.call(null,G__136978,G__136979));
})();
var cr136925_place_5 = (function (){var G__136981 = cr136925_place_4;
var fexpr__136980 = cr136925_place_0;
return (fexpr__136980.cljs$core$IFn$_invoke$arity$1 ? fexpr__136980.cljs$core$IFn$_invoke$arity$1(G__136981) : fexpr__136980.call(null,G__136981));
})();
(cr136925_state[(0)] = cr136925_block_1);

return missionary.core.park(cr136925_place_5);
}catch (e136976){var cr136925_exception = e136976;
(cr136925_state[(0)] = null);

throw cr136925_exception;
}});
var cr136925_block_1 = (function frontend$worker$rtc$asset$new_task__initial_download_missing_assets_$_cr136925_block_1(cr136925_state){
try{var cr136925_place_6 = missionary.core.unpark();
var cr136925_place_7 = cljs.core.set;
var cr136925_place_8 = cljs.core.map;
var cr136925_place_9 = cljs.core.comp;
var cr136925_place_10 = cljs.core.parse_uuid;
var cr136925_place_11 = logseq.common.path.file_stem;
var cr136925_place_12 = (function (){var G__136984 = cr136925_place_10;
var G__136985 = cr136925_place_11;
var fexpr__136983 = cr136925_place_9;
return (fexpr__136983.cljs$core$IFn$_invoke$arity$2 ? fexpr__136983.cljs$core$IFn$_invoke$arity$2(G__136984,G__136985) : fexpr__136983.call(null,G__136984,G__136985));
})();
var cr136925_place_13 = cr136925_place_6;
var cr136925_place_14 = (function (){var G__136987 = cr136925_place_12;
var G__136988 = cr136925_place_13;
var fexpr__136986 = cr136925_place_8;
return (fexpr__136986.cljs$core$IFn$_invoke$arity$2 ? fexpr__136986.cljs$core$IFn$_invoke$arity$2(G__136987,G__136988) : fexpr__136986.call(null,G__136987,G__136988));
})();
var cr136925_place_15 = (function (){var G__136990 = cr136925_place_14;
var fexpr__136989 = cr136925_place_7;
return (fexpr__136989.cljs$core$IFn$_invoke$arity$1 ? fexpr__136989.cljs$core$IFn$_invoke$arity$1(G__136990) : fexpr__136989.call(null,G__136990));
})();
var cr136925_place_16 = cljs.core.set;
var cr136925_place_17 = cljs.core.map;
var cr136925_place_18 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552);
var cr136925_place_19 = frontend.worker.rtc.asset.get_all_asset_blocks;
var cr136925_place_20 = cljs.core.deref;
var cr136925_place_21 = conn;
var cr136925_place_22 = (function (){var G__136992 = cr136925_place_21;
var fexpr__136991 = cr136925_place_20;
return (fexpr__136991.cljs$core$IFn$_invoke$arity$1 ? fexpr__136991.cljs$core$IFn$_invoke$arity$1(G__136992) : fexpr__136991.call(null,G__136992));
})();
var cr136925_place_23 = (function (){var G__136994 = cr136925_place_22;
var fexpr__136993 = cr136925_place_19;
return (fexpr__136993.cljs$core$IFn$_invoke$arity$1 ? fexpr__136993.cljs$core$IFn$_invoke$arity$1(G__136994) : fexpr__136993.call(null,G__136994));
})();
var cr136925_place_24 = (function (){var G__136996 = cr136925_place_18;
var G__136997 = cr136925_place_23;
var fexpr__136995 = cr136925_place_17;
return (fexpr__136995.cljs$core$IFn$_invoke$arity$2 ? fexpr__136995.cljs$core$IFn$_invoke$arity$2(G__136996,G__136997) : fexpr__136995.call(null,G__136996,G__136997));
})();
var cr136925_place_25 = (function (){var G__136999 = cr136925_place_24;
var fexpr__136998 = cr136925_place_16;
return (fexpr__136998.cljs$core$IFn$_invoke$arity$1 ? fexpr__136998.cljs$core$IFn$_invoke$arity$1(G__136999) : fexpr__136998.call(null,G__136999));
})();
var cr136925_place_26 = cljs.core.not_empty;
var cr136925_place_27 = cljs.core.map;
var cr136925_place_28 = (function (asset_uuid){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),asset_uuid,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"update-asset","update-asset",501550582)], null);
});
var cr136925_place_29 = clojure.set.difference;
var cr136925_place_30 = cr136925_place_25;
var cr136925_place_31 = cr136925_place_15;
var cr136925_place_32 = (function (){var G__137001 = cr136925_place_30;
var G__137002 = cr136925_place_31;
var fexpr__137000 = cr136925_place_29;
return (fexpr__137000.cljs$core$IFn$_invoke$arity$2 ? fexpr__137000.cljs$core$IFn$_invoke$arity$2(G__137001,G__137002) : fexpr__137000.call(null,G__137001,G__137002));
})();
var cr136925_place_33 = (function (){var G__137004 = cr136925_place_28;
var G__137005 = cr136925_place_32;
var fexpr__137003 = cr136925_place_27;
return (fexpr__137003.cljs$core$IFn$_invoke$arity$2 ? fexpr__137003.cljs$core$IFn$_invoke$arity$2(G__137004,G__137005) : fexpr__137003.call(null,G__137004,G__137005));
})();
var cr136925_place_34 = (function (){var G__137007 = cr136925_place_33;
var fexpr__137006 = cr136925_place_26;
return (fexpr__137006.cljs$core$IFn$_invoke$arity$1 ? fexpr__137006.cljs$core$IFn$_invoke$arity$1(G__137007) : fexpr__137006.call(null,G__137007));
})();
var cr136925_place_35 = cr136925_place_34;
var cr136925_place_36 = null;
if(cljs.core.truth_(cr136925_place_35)){
(cr136925_state[(0)] = cr136925_block_3);

(cr136925_state[(2)] = cr136925_place_34);

(cr136925_state[(1)] = cr136925_place_36);

return cr136925_state;
} else {
(cr136925_state[(0)] = cr136925_block_2);

(cr136925_state[(1)] = cr136925_place_36);

return cr136925_state;
}
}catch (e136982){var cr136925_exception = e136982;
(cr136925_state[(0)] = null);

throw cr136925_exception;
}});
var cr136925_block_2 = (function frontend$worker$rtc$asset$new_task__initial_download_missing_assets_$_cr136925_block_2(cr136925_state){
try{var cr136925_place_37 = null;
(cr136925_state[(0)] = cr136925_block_5);

(cr136925_state[(1)] = cr136925_place_37);

return cr136925_state;
}catch (e137008){var cr136925_exception = e137008;
(cr136925_state[(0)] = null);

(cr136925_state[(1)] = null);

throw cr136925_exception;
}});
var cr136925_block_3 = (function frontend$worker$rtc$asset$new_task__initial_download_missing_assets_$_cr136925_block_3(cr136925_state){
try{var cr136925_place_34 = (cr136925_state[(2)]);
var cr136925_place_38 = cr136925_place_34;
var cr136925_place_39 = new cljs.core.Keyword("rtc.asset.log","initial-download-missing-assets","rtc.asset.log/initial-download-missing-assets",506527421);
var cr136925_place_40 = new cljs.core.Keyword(null,"count","count",2139924085);
var cr136925_place_41 = cljs.core.count;
var cr136925_place_42 = cr136925_place_38;
var cr136925_place_43 = (function (){var G__137011 = cr136925_place_42;
var fexpr__137010 = cr136925_place_41;
return (fexpr__137010.cljs$core$IFn$_invoke$arity$1 ? fexpr__137010.cljs$core$IFn$_invoke$arity$1(G__137011) : fexpr__137010.call(null,G__137011));
})();
var cr136925_place_44 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr136925_place_40,cr136925_place_43]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr136925_place_45 = add_log_fn;
var cr136925_place_46 = cr136925_place_39;
var cr136925_place_47 = cr136925_place_44;
var cr136925_place_48 = (function (){var G__137013 = cr136925_place_46;
var G__137014 = cr136925_place_47;
var fexpr__137012 = cr136925_place_45;
return (fexpr__137012.cljs$core$IFn$_invoke$arity$2 ? fexpr__137012.cljs$core$IFn$_invoke$arity$2(G__137013,G__137014) : fexpr__137012.call(null,G__137013,G__137014));
})();
var cr136925_place_49 = frontend.worker.rtc.asset.new_task__pull_remote_asset_updates;
var cr136925_place_50 = repo;
var cr136925_place_51 = get_ws_create_task;
var cr136925_place_52 = conn;
var cr136925_place_53 = graph_uuid;
var cr136925_place_54 = add_log_fn;
var cr136925_place_55 = cr136925_place_38;
var cr136925_place_56 = (function (){var G__137016 = cr136925_place_50;
var G__137017 = cr136925_place_51;
var G__137018 = cr136925_place_52;
var G__137019 = cr136925_place_53;
var G__137020 = cr136925_place_54;
var G__137021 = cr136925_place_55;
var fexpr__137015 = cr136925_place_49;
return (fexpr__137015.cljs$core$IFn$_invoke$arity$6 ? fexpr__137015.cljs$core$IFn$_invoke$arity$6(G__137016,G__137017,G__137018,G__137019,G__137020,G__137021) : fexpr__137015.call(null,G__137016,G__137017,G__137018,G__137019,G__137020,G__137021));
})();
(cr136925_state[(0)] = cr136925_block_4);

(cr136925_state[(2)] = null);

return missionary.core.park(cr136925_place_56);
}catch (e137009){var cr136925_exception = e137009;
(cr136925_state[(0)] = null);

(cr136925_state[(2)] = null);

(cr136925_state[(1)] = null);

throw cr136925_exception;
}});
var cr136925_block_4 = (function frontend$worker$rtc$asset$new_task__initial_download_missing_assets_$_cr136925_block_4(cr136925_state){
try{var cr136925_place_57 = missionary.core.unpark();
(cr136925_state[(0)] = cr136925_block_5);

(cr136925_state[(1)] = cr136925_place_57);

return cr136925_state;
}catch (e137022){var cr136925_exception = e137022;
(cr136925_state[(0)] = null);

(cr136925_state[(1)] = null);

throw cr136925_exception;
}});
var cr136925_block_5 = (function frontend$worker$rtc$asset$new_task__initial_download_missing_assets_$_cr136925_block_5(cr136925_state){
try{var cr136925_place_36 = (cr136925_state[(1)]);
(cr136925_state[(0)] = null);

(cr136925_state[(1)] = null);

return cr136925_place_36;
}catch (e137023){var cr136925_exception = e137023;
(cr136925_state[(0)] = null);

(cr136925_state[(1)] = null);

throw cr136925_exception;
}});
return cloroutine.impl.coroutine((function (){var G__137024 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__137024[(0)] = cr136925_block_0);

return G__137024;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.asset.create_assets_sync_loop = (function frontend$worker$rtc$asset$create_assets_sync_loop(repo,get_ws_create_task,graph_uuid,major_schema_version,conn,_STAR_auto_push_QMARK_){
var started_dfv = missionary.core.dfv();
var add_log_fn = (function (type,message){
if(cljs.core.map_QMARK_(message)){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(message),"\n","(map? message)"].join('')));
}

return frontend.worker.rtc.log_and_state.rtc_log(type,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(message,new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid));
});
var mixed_flow = frontend.worker.rtc.asset.create_mixed_flow(repo,_STAR_auto_push_QMARK_);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"onstarted-task","onstarted-task",750035798),started_dfv,new cljs.core.Keyword(null,"assets-sync-loop-task","assets-sync-loop-task",1231956523),frontend.worker.rtc.asset.holding_assets_sync_lock(started_dfv,cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr137025_block_5 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr137025_block_5(cr137025_state){
try{var cr137025_place_49 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr137025_place_50 = null;
if(cljs.core.truth_(cr137025_place_49)){
(cr137025_state[(0)] = cr137025_block_7);

(cr137025_state[(3)] = null);

return cr137025_state;
} else {
(cr137025_state[(0)] = cr137025_block_6);

(cr137025_state[(4)] = cr137025_place_50);

return cr137025_state;
}
}catch (e137185){var cr137025_exception = e137185;
(cr137025_state[(0)] = cr137025_block_11);

(cr137025_state[(3)] = null);

(cr137025_state[(1)] = true);

(cr137025_state[(2)] = cr137025_exception);

return cr137025_state;
}});
var cr137025_block_1 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr137025_block_1(cr137025_state){
try{var cr137025_place_2 = started_dfv;
var cr137025_place_3 = true;
var cr137025_place_4 = (function (){var G__137188 = cr137025_place_3;
var fexpr__137187 = cr137025_place_2;
return (fexpr__137187.cljs$core$IFn$_invoke$arity$1 ? fexpr__137187.cljs$core$IFn$_invoke$arity$1(G__137188) : fexpr__137187.call(null,G__137188));
})();
var cr137025_place_5 = frontend.worker.rtc.asset.new_task__initial_download_missing_assets;
var cr137025_place_6 = repo;
var cr137025_place_7 = get_ws_create_task;
var cr137025_place_8 = graph_uuid;
var cr137025_place_9 = conn;
var cr137025_place_10 = add_log_fn;
var cr137025_place_11 = (function (){var G__137190 = cr137025_place_6;
var G__137191 = cr137025_place_7;
var G__137192 = cr137025_place_8;
var G__137193 = cr137025_place_9;
var G__137194 = cr137025_place_10;
var fexpr__137189 = cr137025_place_5;
return (fexpr__137189.cljs$core$IFn$_invoke$arity$5 ? fexpr__137189.cljs$core$IFn$_invoke$arity$5(G__137190,G__137191,G__137192,G__137193,G__137194) : fexpr__137189.call(null,G__137190,G__137191,G__137192,G__137193,G__137194));
})();
(cr137025_state[(0)] = cr137025_block_2);

return missionary.core.park(cr137025_place_11);
}catch (e137186){var cr137025_exception = e137186;
(cr137025_state[(0)] = cr137025_block_4);

(cr137025_state[(2)] = cr137025_exception);

return cr137025_state;
}});
var cr137025_block_11 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr137025_block_11(cr137025_state){
try{var cr137025_place_1 = (cr137025_state[(1)]);
var cr137025_place_0 = (cr137025_state[(2)]);
var cr137025_place_61 = (cljs.core.truth_(cr137025_place_1)?(function(){throw cr137025_place_0})():cr137025_place_0);
(cr137025_state[(0)] = null);

(cr137025_state[(1)] = null);

(cr137025_state[(2)] = null);

return cr137025_place_61;
}catch (e137195){var cr137025_exception = e137195;
(cr137025_state[(0)] = null);

(cr137025_state[(1)] = null);

(cr137025_state[(2)] = null);

throw cr137025_exception;
}});
var cr137025_block_7 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr137025_block_7(cr137025_state){
try{var cr137025_place_0 = (cr137025_state[(2)]);
var cr137025_place_52 = cr137025_place_0;
var cr137025_place_53 = (function(){throw cr137025_place_52})();
(cr137025_state[(0)] = null);

(cr137025_state[(1)] = null);

(cr137025_state[(2)] = null);

return null;
}catch (e137196){var cr137025_exception = e137196;
(cr137025_state[(0)] = cr137025_block_11);

(cr137025_state[(1)] = true);

(cr137025_state[(2)] = cr137025_exception);

return cr137025_state;
}});
var cr137025_block_9 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr137025_block_9(cr137025_state){
try{var cr137025_place_0 = (cr137025_state[(2)]);
var cr137025_place_54 = cr137025_place_0;
var cr137025_place_55 = add_log_fn;
var cr137025_place_56 = new cljs.core.Keyword("rtc.asset.log","cancelled","rtc.asset.log/cancelled",-1880021289);
var cr137025_place_57 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr137025_place_58 = cr137025_place_55(cr137025_place_56,cr137025_place_57);
var cr137025_place_59 = cr137025_place_54;
var cr137025_place_60 = (function(){throw cr137025_place_59})();
(cr137025_state[(0)] = null);

(cr137025_state[(1)] = null);

(cr137025_state[(2)] = null);

return null;
}catch (e137197){var cr137025_exception = e137197;
(cr137025_state[(0)] = cr137025_block_11);

(cr137025_state[(1)] = true);

(cr137025_state[(2)] = cr137025_exception);

return cr137025_state;
}});
var cr137025_block_10 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr137025_block_10(cr137025_state){
try{var cr137025_place_48 = (cr137025_state[(3)]);
(cr137025_state[(0)] = cr137025_block_11);

(cr137025_state[(3)] = null);

(cr137025_state[(2)] = cr137025_place_48);

return cr137025_state;
}catch (e137198){var cr137025_exception = e137198;
(cr137025_state[(0)] = cr137025_block_11);

(cr137025_state[(3)] = null);

(cr137025_state[(1)] = true);

(cr137025_state[(2)] = cr137025_exception);

return cr137025_state;
}});
var cr137025_block_8 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr137025_block_8(cr137025_state){
try{var cr137025_place_50 = (cr137025_state[(4)]);
(cr137025_state[(0)] = cr137025_block_10);

(cr137025_state[(4)] = null);

(cr137025_state[(3)] = cr137025_place_50);

return cr137025_state;
}catch (e137199){var cr137025_exception = e137199;
(cr137025_state[(0)] = cr137025_block_11);

(cr137025_state[(4)] = null);

(cr137025_state[(3)] = null);

(cr137025_state[(1)] = true);

(cr137025_state[(2)] = cr137025_exception);

return cr137025_state;
}});
var cr137025_block_0 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr137025_block_0(cr137025_state){
try{var cr137025_place_0 = null;
var cr137025_place_1 = false;
(cr137025_state[(0)] = cr137025_block_1);

(cr137025_state[(2)] = cr137025_place_0);

(cr137025_state[(1)] = cr137025_place_1);

return cr137025_state;
}catch (e137200){var cr137025_exception = e137200;
(cr137025_state[(0)] = null);

throw cr137025_exception;
}});
var cr137025_block_6 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr137025_block_6(cr137025_state){
try{var cr137025_place_51 = null;
(cr137025_state[(0)] = cr137025_block_8);

(cr137025_state[(4)] = cr137025_place_51);

return cr137025_state;
}catch (e137201){var cr137025_exception = e137201;
(cr137025_state[(0)] = cr137025_block_11);

(cr137025_state[(4)] = null);

(cr137025_state[(3)] = null);

(cr137025_state[(1)] = true);

(cr137025_state[(2)] = cr137025_exception);

return cr137025_state;
}});
var cr137025_block_4 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr137025_block_4(cr137025_state){
try{var cr137025_place_0 = (cr137025_state[(2)]);
var cr137025_place_45 = cr137025_place_0;
var cr137025_place_46 = missionary.Cancelled;
var cr137025_place_47 = (cr137025_place_45 instanceof cr137025_place_46);
var cr137025_place_48 = null;
if(cr137025_place_47){
(cr137025_state[(0)] = cr137025_block_9);

return cr137025_state;
} else {
(cr137025_state[(0)] = cr137025_block_5);

(cr137025_state[(3)] = cr137025_place_48);

return cr137025_state;
}
}catch (e137202){var cr137025_exception = e137202;
(cr137025_state[(0)] = cr137025_block_11);

(cr137025_state[(1)] = true);

(cr137025_state[(2)] = cr137025_exception);

return cr137025_state;
}});
var cr137025_block_2 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr137025_block_2(cr137025_state){
try{var cr137025_place_12 = missionary.core.unpark();
var cr137025_place_13 = missionary.core.reduce;
var cr137025_place_14 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr137025_place_15 = null;
var cr137025_place_16 = cljs.core.partial;
var cr137025_place_25 = (function (cr137027_state){
try{var cr137027_place_19 = (cr137027_state[(3)]);
var cr137027_place_23 = cr137027_place_19;
var cr137027_place_24 = frontend.worker.rtc.asset.new_task__pull_remote_asset_updates;
var cr137027_place_25 = repo;
var cr137027_place_26 = get_ws_create_task;
var cr137027_place_27 = conn;
var cr137027_place_28 = graph_uuid;
var cr137027_place_29 = add_log_fn;
var cr137027_place_30 = cr137027_place_23;
var cr137027_place_31 = (function (){var G__137073 = cr137027_place_25;
var G__137074 = cr137027_place_26;
var G__137075 = cr137027_place_27;
var G__137076 = cr137027_place_28;
var G__137077 = cr137027_place_29;
var G__137078 = cr137027_place_30;
var fexpr__137072 = cr137027_place_24;
var G__137237 = G__137073;
var G__137238 = G__137074;
var G__137239 = G__137075;
var G__137240 = G__137076;
var G__137241 = G__137077;
var G__137242 = G__137078;
var fexpr__137236 = fexpr__137072;
return (fexpr__137236.cljs$core$IFn$_invoke$arity$6 ? fexpr__137236.cljs$core$IFn$_invoke$arity$6(G__137237,G__137238,G__137239,G__137240,G__137241,G__137242) : fexpr__137236.call(null,G__137237,G__137238,G__137239,G__137240,G__137241,G__137242));
})();
(cr137027_state[(0)] = cr137025_place_20);

(cr137027_state[(3)] = null);

return missionary.core.park(cr137027_place_31);
}catch (e137235){var e137071 = e137235;
var cr137027_exception = e137071;
(cr137027_state[(0)] = null);

(cr137027_state[(1)] = null);

(cr137027_state[(2)] = null);

(cr137027_state[(3)] = null);

throw cr137027_exception;
}});
var cr137025_place_21 = (function (cr137027_state){
try{var cr137027_place_2 = (cr137027_state[(1)]);
var cr137027_place_15 = cljs.core.not_empty;
var cr137027_place_16 = new cljs.core.Keyword(null,"value","value",305978217);
var cr137027_place_17 = cr137027_place_2;
var cr137027_place_18 = cr137027_place_16.cljs$core$IFn$_invoke$arity$1(cr137027_place_17);
var cr137027_place_19 = (function (){var G__137066 = cr137027_place_18;
var fexpr__137065 = cr137027_place_15;
var G__137245 = G__137066;
var fexpr__137244 = fexpr__137065;
return (fexpr__137244.cljs$core$IFn$_invoke$arity$1 ? fexpr__137244.cljs$core$IFn$_invoke$arity$1(G__137245) : fexpr__137244.call(null,G__137245));
})();
var cr137027_place_20 = cr137027_place_19;
var cr137027_place_21 = null;
if(cljs.core.truth_(cr137027_place_20)){
(cr137027_state[(0)] = cr137025_place_25);

(cr137027_state[(1)] = null);

(cr137027_state[(3)] = cr137027_place_19);

(cr137027_state[(1)] = cr137027_place_21);

return cr137027_state;
} else {
(cr137027_state[(0)] = cr137025_place_19);

(cr137027_state[(1)] = null);

(cr137027_state[(1)] = cr137027_place_21);

return cr137027_state;
}
}catch (e137243){var e137064 = e137243;
var cr137027_exception = e137064;
(cr137027_state[(0)] = null);

(cr137027_state[(1)] = null);

(cr137027_state[(2)] = null);

throw cr137027_exception;
}});
var cr137025_place_20 = (function (cr137027_state){
try{var cr137027_place_32 = missionary.core.unpark();
(cr137027_state[(0)] = cr137025_place_24);

(cr137027_state[(1)] = cr137027_place_32);

return cr137027_state;
}catch (e137246){var e137063 = e137246;
var cr137027_exception = e137063;
(cr137027_state[(0)] = null);

(cr137027_state[(1)] = null);

(cr137027_state[(2)] = null);

throw cr137027_exception;
}});
var cr137025_place_29 = (function (cr137027_state){
try{var cr137027_place_33 = frontend.worker.rtc.asset.new_task__push_local_asset_updates;
var cr137027_place_34 = repo;
var cr137027_place_35 = get_ws_create_task;
var cr137027_place_36 = conn;
var cr137027_place_37 = graph_uuid;
var cr137027_place_38 = major_schema_version;
var cr137027_place_39 = add_log_fn;
var cr137027_place_40 = (function (){var G__137084 = cr137027_place_34;
var G__137085 = cr137027_place_35;
var G__137086 = cr137027_place_36;
var G__137087 = cr137027_place_37;
var G__137088 = cr137027_place_38;
var G__137089 = cr137027_place_39;
var fexpr__137083 = cr137027_place_33;
var G__137249 = G__137084;
var G__137250 = G__137085;
var G__137251 = G__137086;
var G__137252 = G__137087;
var G__137253 = G__137088;
var G__137254 = G__137089;
var fexpr__137248 = fexpr__137083;
return (fexpr__137248.cljs$core$IFn$_invoke$arity$6 ? fexpr__137248.cljs$core$IFn$_invoke$arity$6(G__137249,G__137250,G__137251,G__137252,G__137253,G__137254) : fexpr__137248.call(null,G__137249,G__137250,G__137251,G__137252,G__137253,G__137254));
})();
(cr137027_state[(0)] = cr137025_place_28);

return missionary.core.park(cr137027_place_40);
}catch (e137247){var e137082 = e137247;
var cr137027_exception = e137082;
(cr137027_state[(0)] = null);

(cr137027_state[(2)] = null);

throw cr137027_exception;
}});
var cr137025_place_17 = (function (cr137027_state){
try{var cr137027_place_10 = null;
(cr137027_state[(0)] = cr137025_place_22);

(cr137027_state[(2)] = cr137027_place_10);

return cr137027_state;
}catch (e137255){var e137060 = e137255;
var cr137027_exception = e137060;
(cr137027_state[(0)] = null);

(cr137027_state[(1)] = null);

(cr137027_state[(2)] = null);

throw cr137027_exception;
}});
var cr137025_place_30 = (function (cr137027_state){
try{var cr137027_place_9 = (cr137027_state[(2)]);
var cr137027_place_42 = "No matching clause: ";
var cr137027_place_43 = cr137027_place_9;
var cr137027_place_44 = [cr137027_place_42,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr137027_place_43)].join('');
var cr137027_place_45 = (new Error(cr137027_place_44));
var cr137027_place_46 = (function(){throw cr137027_place_45})();
(cr137027_state[(0)] = null);

(cr137027_state[(2)] = null);

return null;
}catch (e137256){var e137090 = e137256;
var cr137027_exception = e137090;
(cr137027_state[(0)] = null);

(cr137027_state[(2)] = null);

throw cr137027_exception;
}});
var cr137025_place_22 = (function (cr137027_state){
try{var cr137027_place_9 = (cr137027_state[(2)]);
var cr137027_place_13 = cr137027_place_9;
var cr137027_place_14 = null;
var G__137068 = cr137027_place_13;
var G__137258 = G__137068;
switch (G__137258) {
case "remote-updates":
(cr137027_state[(0)] = cr137025_place_21);

(cr137027_state[(2)] = null);

(cr137027_state[(2)] = cr137027_place_14);

return cr137027_state;

break;
case "local-update-check":
(cr137027_state[(0)] = cr137025_place_29);

(cr137027_state[(1)] = null);

(cr137027_state[(2)] = null);

(cr137027_state[(2)] = cr137027_place_14);

return cr137027_state;

break;
default:
(cr137027_state[(0)] = cr137025_place_30);

(cr137027_state[(1)] = null);

return cr137027_state;

}
}catch (e137257){var e137067 = e137257;
var cr137027_exception = e137067;
(cr137027_state[(0)] = null);

(cr137027_state[(1)] = null);

(cr137027_state[(2)] = null);

throw cr137027_exception;
}});
var cr137025_place_28 = (function (cr137027_state){
try{var cr137027_place_41 = missionary.core.unpark();
(cr137027_state[(0)] = cr137025_place_18);

(cr137027_state[(2)] = cr137027_place_41);

return cr137027_state;
}catch (e137259){var e137081 = e137259;
var cr137027_exception = e137081;
(cr137027_state[(0)] = null);

(cr137027_state[(2)] = null);

throw cr137027_exception;
}});
var cr137025_place_27 = (function (cr137027_state){
try{var cr137027_place_5 = (cr137027_state[(3)]);
var cr137027_place_11 = cr137027_place_5;
var cr137027_place_12 = cr137027_place_11.fqn;
(cr137027_state[(0)] = cr137025_place_22);

(cr137027_state[(3)] = null);

(cr137027_state[(2)] = cr137027_place_12);

return cr137027_state;
}catch (e137260){var e137080 = e137260;
var cr137027_exception = e137080;
(cr137027_state[(0)] = null);

(cr137027_state[(1)] = null);

(cr137027_state[(2)] = null);

(cr137027_state[(3)] = null);

throw cr137027_exception;
}});
var cr137025_place_19 = (function (cr137027_state){
try{var cr137027_place_22 = null;
(cr137027_state[(0)] = cr137025_place_24);

(cr137027_state[(1)] = cr137027_place_22);

return cr137027_state;
}catch (e137261){var e137062 = e137261;
var cr137027_exception = e137062;
(cr137027_state[(0)] = null);

(cr137027_state[(1)] = null);

(cr137027_state[(2)] = null);

throw cr137027_exception;
}});
var cr137025_place_26 = (function (cr137027_state){
try{var cr137027_place_0 = (1);
var cr137027_place_1 = mixed_flow;
(cr137027_state[(0)] = cr137025_place_23);

return missionary.core.fork(cr137027_place_0,cr137027_place_1);
}catch (e137262){var e137079 = e137262;
var cr137027_exception = e137079;
(cr137027_state[(0)] = null);

throw cr137027_exception;
}});
var cr137025_place_18 = (function (cr137027_state){
try{var cr137027_place_14 = (cr137027_state[(2)]);
(cr137027_state[(0)] = null);

(cr137027_state[(2)] = null);

return cr137027_place_14;
}catch (e137263){var e137061 = e137263;
var cr137027_exception = e137061;
(cr137027_state[(0)] = null);

(cr137027_state[(2)] = null);

throw cr137027_exception;
}});
var cr137025_place_24 = (function (cr137027_state){
try{var cr137027_place_21 = (cr137027_state[(1)]);
(cr137027_state[(0)] = cr137025_place_18);

(cr137027_state[(1)] = null);

(cr137027_state[(2)] = cr137027_place_21);

return cr137027_state;
}catch (e137264){var e137070 = e137264;
var cr137027_exception = e137070;
(cr137027_state[(0)] = null);

(cr137027_state[(1)] = null);

(cr137027_state[(2)] = null);

throw cr137027_exception;
}});
var cr137025_place_23 = (function (cr137027_state){
try{var cr137027_place_2 = missionary.core.unpark();
var cr137027_place_3 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr137027_place_4 = cr137027_place_2;
var cr137027_place_5 = cr137027_place_3.cljs$core$IFn$_invoke$arity$1(cr137027_place_4);
var cr137027_place_6 = cr137027_place_5;
var cr137027_place_7 = cljs.core.Keyword;
var cr137027_place_8 = (cr137027_place_6 instanceof cr137027_place_7);
var cr137027_place_9 = null;
if(cr137027_place_8){
(cr137027_state[(0)] = cr137025_place_27);

(cr137027_state[(1)] = cr137027_place_2);

(cr137027_state[(3)] = cr137027_place_5);

(cr137027_state[(2)] = cr137027_place_9);

return cr137027_state;
} else {
(cr137027_state[(0)] = cr137025_place_17);

(cr137027_state[(1)] = cr137027_place_2);

(cr137027_state[(2)] = cr137027_place_9);

return cr137027_state;
}
}catch (e137265){var e137069 = e137265;
var cr137027_exception = e137069;
(cr137027_state[(0)] = null);

throw cr137027_exception;
}});
var cr137025_place_31 = cloroutine.impl.coroutine;
var cr137025_place_32 = cljs.core.object_array;
var cr137025_place_33 = (4);
var cr137025_place_34 = (function (){var G__137267 = cr137025_place_33;
var fexpr__137266 = cr137025_place_32;
return (fexpr__137266.cljs$core$IFn$_invoke$arity$1 ? fexpr__137266.cljs$core$IFn$_invoke$arity$1(G__137267) : fexpr__137266.call(null,G__137267));
})();
var cr137025_place_35 = cr137025_place_34;
var cr137025_place_36 = (0);
var cr137025_place_37 = cr137025_place_26;
var cr137025_place_38 = (cr137025_place_35[cr137025_place_36] = cr137025_place_37);
var cr137025_place_39 = cr137025_place_34;
var cr137025_place_40 = (function (){var G__137269 = cr137025_place_39;
var fexpr__137268 = cr137025_place_31;
return (fexpr__137268.cljs$core$IFn$_invoke$arity$1 ? fexpr__137268.cljs$core$IFn$_invoke$arity$1(G__137269) : fexpr__137268.call(null,G__137269));
})();
var cr137025_place_41 = missionary.core.ap_run;
var cr137025_place_42 = (function (){var G__137271 = cr137025_place_40;
var G__137272 = cr137025_place_41;
var fexpr__137270 = cr137025_place_16;
return (fexpr__137270.cljs$core$IFn$_invoke$arity$2 ? fexpr__137270.cljs$core$IFn$_invoke$arity$2(G__137271,G__137272) : fexpr__137270.call(null,G__137271,G__137272));
})();
var cr137025_place_43 = (function (){var G__137274 = cr137025_place_14;
var G__137275 = cr137025_place_15;
var G__137276 = cr137025_place_42;
var fexpr__137273 = cr137025_place_13;
return (fexpr__137273.cljs$core$IFn$_invoke$arity$3 ? fexpr__137273.cljs$core$IFn$_invoke$arity$3(G__137274,G__137275,G__137276) : fexpr__137273.call(null,G__137274,G__137275,G__137276));
})();
(cr137025_state[(0)] = cr137025_block_3);

return missionary.core.park(cr137025_place_43);
}catch (e137203){var cr137025_exception = e137203;
(cr137025_state[(0)] = cr137025_block_4);

(cr137025_state[(2)] = cr137025_exception);

return cr137025_state;
}});
var cr137025_block_3 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr137025_block_3(cr137025_state){
try{var cr137025_place_44 = missionary.core.unpark();
(cr137025_state[(0)] = cr137025_block_11);

(cr137025_state[(2)] = cr137025_place_44);

return cr137025_state;
}catch (e137277){var cr137025_exception = e137277;
(cr137025_state[(0)] = cr137025_block_4);

(cr137025_state[(2)] = cr137025_exception);

return cr137025_state;
}});
return cloroutine.impl.coroutine((function (){var G__137278 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__137278[(0)] = cr137025_block_0);

return G__137278;
})());
})(),missionary.core.sp_run))], null);
});

//# sourceMappingURL=frontend.worker.rtc.asset.js.map
