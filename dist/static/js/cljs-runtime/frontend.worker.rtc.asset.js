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
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr101878_block_0 = (function frontend$worker$rtc$asset$new_task__get_asset_file_metadata_$_cr101878_block_0(cr101878_state){
try{var cr101878_place_0 = frontend.common.missionary._LT__BANG_;
var cr101878_place_1 = frontend.worker.state._LT_invoke_main_thread;
var cr101878_place_2 = new cljs.core.Keyword("thread-api","get-asset-file-metadata","thread-api/get-asset-file-metadata",1768768708);
var cr101878_place_3 = repo;
var cr101878_place_4 = block_uuid;
var cr101878_place_5 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr101878_place_4);
var cr101878_place_6 = asset_type;
var cr101878_place_7 = (function (){var G__101893 = cr101878_place_2;
var G__101894 = cr101878_place_3;
var G__101895 = cr101878_place_5;
var G__101896 = cr101878_place_6;
var fexpr__101892 = cr101878_place_1;
return (fexpr__101892.cljs$core$IFn$_invoke$arity$4 ? fexpr__101892.cljs$core$IFn$_invoke$arity$4(G__101893,G__101894,G__101895,G__101896) : fexpr__101892.call(null,G__101893,G__101894,G__101895,G__101896));
})();
var cr101878_place_8 = (function (){var G__101900 = cr101878_place_7;
var fexpr__101899 = cr101878_place_0;
return (fexpr__101899.cljs$core$IFn$_invoke$arity$1 ? fexpr__101899.cljs$core$IFn$_invoke$arity$1(G__101900) : fexpr__101899.call(null,G__101900));
})();
(cr101878_state[(0)] = cr101878_block_1);

return missionary.core.park(cr101878_place_8);
}catch (e101889){var cr101878_exception = e101889;
(cr101878_state[(0)] = null);

throw cr101878_exception;
}});
var cr101878_block_1 = (function frontend$worker$rtc$asset$new_task__get_asset_file_metadata_$_cr101878_block_1(cr101878_state){
try{var cr101878_place_9 = missionary.core.unpark();
(cr101878_state[(0)] = null);

return cr101878_place_9;
}catch (e101902){var cr101878_exception = e101902;
(cr101878_state[(0)] = null);

throw cr101878_exception;
}});
return cloroutine.impl.coroutine((function (){var G__101903 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__101903[(0)] = cr101878_block_0);

return G__101903;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.asset.remote_block_ops_EQ__GT_remote_asset_ops = (function frontend$worker$rtc$asset$remote_block_ops_EQ__GT_remote_asset_ops(db_before,remove_ops){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (remove_op){
var block_uuid = new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638).cljs$core$IFn$_invoke$arity$1(remove_op);
var temp__5804__auto__ = (function (){var G__101916 = db_before;
var G__101917 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__101916,G__101917) : datascript.core.entity.call(null,G__101916,G__101917));
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
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr101932_block_0 = (function frontend$worker$rtc$asset$new_task__emit_remote_asset_updates_from_push_asset_upload_updates_$_cr101932_block_0(cr101932_state){
try{var cr101932_place_0 = push_asset_upload_updates_message;
var cr101932_place_1 = cljs.core.__destructure_map;
var cr101932_place_2 = cr101932_place_0;
var cr101932_place_3 = (function (){var G__102738 = cr101932_place_2;
var fexpr__102737 = cr101932_place_1;
return (fexpr__102737.cljs$core$IFn$_invoke$arity$1 ? fexpr__102737.cljs$core$IFn$_invoke$arity$1(G__102738) : fexpr__102737.call(null,G__102738));
})();
var cr101932_place_4 = cljs.core.get;
var cr101932_place_5 = cr101932_place_3;
var cr101932_place_6 = new cljs.core.Keyword(null,"uploaded-assets","uploaded-assets",1193992244);
var cr101932_place_7 = (function (){var G__102740 = cr101932_place_5;
var G__102741 = cr101932_place_6;
var fexpr__102739 = cr101932_place_4;
return (fexpr__102739.cljs$core$IFn$_invoke$arity$2 ? fexpr__102739.cljs$core$IFn$_invoke$arity$2(G__102740,G__102741) : fexpr__102739.call(null,G__102740,G__102741));
})();
var cr101932_place_8 = cljs.core.not_empty;
var cr101932_place_9 = cljs.core.remove;
var cr101932_place_10 = cljs.core.nil_QMARK_;
var cr101932_place_11 = cljs.core.apply;
var cr101932_place_12 = missionary.core.join;
var cr101932_place_13 = cljs.core.vector;
var cr101932_place_14 = cljs.core.map;
var cr101932_place_15 = (function (p__101943){
var vec__101948 = p__101943;
var asset_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101948,(0),null);
var remote_metadata = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101948,(1),null);
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr101953_block_12 = (function (cr101953_state){
try{var cr101953_place_20 = (cr101953_state[(2)]);
var cr101953_place_44 = cr101953_place_20;
(cr101953_state[(0)] = cr101953_block_13);

(cr101953_state[(2)] = null);

(cr101953_state[(1)] = cr101953_place_44);

return cr101953_state;
}catch (e102865){var e102197 = e102865;
var cr101953_exception = e102197;
(cr101953_state[(0)] = null);

(cr101953_state[(2)] = null);

(cr101953_state[(1)] = null);

throw cr101953_exception;
}});
var cr101953_block_16 = (function (cr101953_state){
try{var cr101953_place_45 = (cr101953_state[(1)]);
(cr101953_state[(0)] = null);

(cr101953_state[(1)] = null);

return cr101953_place_45;
}catch (e102876){var e102205 = e102876;
var cr101953_exception = e102205;
(cr101953_state[(0)] = null);

(cr101953_state[(1)] = null);

throw cr101953_exception;
}});
var cr101953_block_6 = (function (cr101953_state){
try{var cr101953_place_20 = (cr101953_state[(2)]);
var cr101953_place_30 = cr101953_place_20;
var cr101953_place_31 = null;
if(cljs.core.truth_(cr101953_place_30)){
(cr101953_state[(0)] = cr101953_block_12);

(cr101953_state[(3)] = null);

(cr101953_state[(1)] = cr101953_place_31);

return cr101953_state;
} else {
(cr101953_state[(0)] = cr101953_block_7);

(cr101953_state[(2)] = null);

(cr101953_state[(1)] = cr101953_place_31);

return cr101953_state;
}
}catch (e102880){var e102206 = e102880;
var cr101953_exception = e102206;
(cr101953_state[(0)] = null);

(cr101953_state[(2)] = null);

(cr101953_state[(3)] = null);

throw cr101953_exception;
}});
var cr101953_block_15 = (function (cr101953_state){
try{var cr101953_place_47 = new cljs.core.Keyword(null,"op","op",-1882987955);
var cr101953_place_48 = new cljs.core.Keyword(null,"update-asset","update-asset",501550582);
var cr101953_place_49 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552);
var cr101953_place_50 = asset_uuid;
var cr101953_place_51 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr101953_place_47,cr101953_place_48,cr101953_place_49,cr101953_place_50]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
(cr101953_state[(0)] = cr101953_block_16);

(cr101953_state[(1)] = cr101953_place_51);

return cr101953_state;
}catch (e102888){var e102214 = e102888;
var cr101953_exception = e102214;
(cr101953_state[(0)] = null);

(cr101953_state[(1)] = null);

throw cr101953_exception;
}});
var cr101953_block_4 = (function (cr101953_state){
try{var cr101953_place_17 = (cr101953_state[(1)]);
var cr101953_place_13 = (cr101953_state[(4)]);
var cr101953_place_26 = cljs.core.not_EQ_;
var cr101953_place_27 = cr101953_place_13;
var cr101953_place_28 = cr101953_place_17;
var cr101953_place_29 = (function (){var G__102229 = cr101953_place_27;
var G__102230 = cr101953_place_28;
var fexpr__102227 = cr101953_place_26;
var G__102898 = G__102229;
var G__102899 = G__102230;
var fexpr__102897 = fexpr__102227;
return (fexpr__102897.cljs$core$IFn$_invoke$arity$2 ? fexpr__102897.cljs$core$IFn$_invoke$arity$2(G__102898,G__102899) : fexpr__102897.call(null,G__102898,G__102899));
})();
(cr101953_state[(0)] = cr101953_block_5);

(cr101953_state[(1)] = null);

(cr101953_state[(4)] = null);

(cr101953_state[(5)] = cr101953_place_29);

return cr101953_state;
}catch (e102892){var e102220 = e102892;
var cr101953_exception = e102220;
(cr101953_state[(0)] = null);

(cr101953_state[(1)] = null);

(cr101953_state[(2)] = null);

(cr101953_state[(5)] = null);

(cr101953_state[(3)] = null);

(cr101953_state[(4)] = null);

throw cr101953_exception;
}});
var cr101953_block_10 = (function (cr101953_state){
try{var cr101953_place_41 = missionary.core.unpark();
var cr101953_place_42 = null;
var cr101953_place_43 = (cr101953_place_41 == cr101953_place_42);
(cr101953_state[(0)] = cr101953_block_11);

(cr101953_state[(4)] = cr101953_place_43);

return cr101953_state;
}catch (e102904){var e102234 = e102904;
var cr101953_exception = e102234;
(cr101953_state[(0)] = null);

(cr101953_state[(1)] = null);

(cr101953_state[(4)] = null);

throw cr101953_exception;
}});
var cr101953_block_7 = (function (cr101953_state){
try{var cr101953_place_10 = (cr101953_state[(3)]);
var cr101953_place_32 = cr101953_place_10;
var cr101953_place_33 = cr101953_place_32;
var cr101953_place_34 = null;
if(cljs.core.truth_(cr101953_place_33)){
(cr101953_state[(0)] = cr101953_block_9);

(cr101953_state[(4)] = cr101953_place_34);

return cr101953_state;
} else {
(cr101953_state[(0)] = cr101953_block_8);

(cr101953_state[(3)] = null);

(cr101953_state[(2)] = cr101953_place_32);

(cr101953_state[(4)] = cr101953_place_34);

return cr101953_state;
}
}catch (e102912){var e102237 = e102912;
var cr101953_exception = e102237;
(cr101953_state[(0)] = null);

(cr101953_state[(1)] = null);

(cr101953_state[(3)] = null);

throw cr101953_exception;
}});
var cr101953_block_13 = (function (cr101953_state){
try{var cr101953_place_31 = (cr101953_state[(1)]);
var cr101953_place_45 = null;
if(cljs.core.truth_(cr101953_place_31)){
(cr101953_state[(0)] = cr101953_block_15);

(cr101953_state[(1)] = null);

(cr101953_state[(1)] = cr101953_place_45);

return cr101953_state;
} else {
(cr101953_state[(0)] = cr101953_block_14);

(cr101953_state[(1)] = null);

(cr101953_state[(1)] = cr101953_place_45);

return cr101953_state;
}
}catch (e102916){var e102240 = e102916;
var cr101953_exception = e102240;
(cr101953_state[(0)] = null);

(cr101953_state[(1)] = null);

throw cr101953_exception;
}});
var cr101953_block_3 = (function (cr101953_state){
try{var cr101953_place_22 = (cr101953_state[(1)]);
var cr101953_place_25 = cr101953_place_22;
(cr101953_state[(0)] = cr101953_block_5);

(cr101953_state[(1)] = null);

(cr101953_state[(5)] = cr101953_place_25);

return cr101953_state;
}catch (e102919){var e102247 = e102919;
var cr101953_exception = e102247;
(cr101953_state[(0)] = null);

(cr101953_state[(2)] = null);

(cr101953_state[(5)] = null);

(cr101953_state[(3)] = null);

(cr101953_state[(1)] = null);

throw cr101953_exception;
}});
var cr101953_block_5 = (function (cr101953_state){
try{var cr101953_place_24 = (cr101953_state[(5)]);
(cr101953_state[(0)] = cr101953_block_6);

(cr101953_state[(5)] = null);

(cr101953_state[(2)] = cr101953_place_24);

return cr101953_state;
}catch (e102929){var e102271 = e102929;
var cr101953_exception = e102271;
(cr101953_state[(0)] = null);

(cr101953_state[(2)] = null);

(cr101953_state[(5)] = null);

(cr101953_state[(3)] = null);

throw cr101953_exception;
}});
var cr101953_block_1 = (function (cr101953_state){
try{var cr101953_place_18 = (cr101953_state[(1)]);
var cr101953_place_21 = cr101953_place_18;
(cr101953_state[(0)] = cr101953_block_6);

(cr101953_state[(1)] = null);

(cr101953_state[(2)] = cr101953_place_21);

return cr101953_state;
}catch (e102934){var e102293 = e102934;
var cr101953_exception = e102293;
(cr101953_state[(0)] = null);

(cr101953_state[(1)] = null);

(cr101953_state[(2)] = null);

(cr101953_state[(3)] = null);

throw cr101953_exception;
}});
var cr101953_block_8 = (function (cr101953_state){
try{var cr101953_place_32 = (cr101953_state[(2)]);
var cr101953_place_35 = cr101953_place_32;
(cr101953_state[(0)] = cr101953_block_11);

(cr101953_state[(2)] = null);

(cr101953_state[(4)] = cr101953_place_35);

return cr101953_state;
}catch (e102938){var e102304 = e102938;
var cr101953_exception = e102304;
(cr101953_state[(0)] = null);

(cr101953_state[(2)] = null);

(cr101953_state[(1)] = null);

(cr101953_state[(4)] = null);

throw cr101953_exception;
}});
var cr101953_block_9 = (function (cr101953_state){
try{var cr101953_place_10 = (cr101953_state[(3)]);
var cr101953_place_36 = frontend.worker.rtc.asset.new_task__get_asset_file_metadata;
var cr101953_place_37 = repo;
var cr101953_place_38 = asset_uuid;
var cr101953_place_39 = cr101953_place_10;
var cr101953_place_40 = (function (){var G__102311 = cr101953_place_37;
var G__102312 = cr101953_place_38;
var G__102313 = cr101953_place_39;
var fexpr__102310 = cr101953_place_36;
var G__102944 = G__102311;
var G__102945 = G__102312;
var G__102946 = G__102313;
var fexpr__102943 = fexpr__102310;
return (fexpr__102943.cljs$core$IFn$_invoke$arity$3 ? fexpr__102943.cljs$core$IFn$_invoke$arity$3(G__102944,G__102945,G__102946) : fexpr__102943.call(null,G__102944,G__102945,G__102946));
})();
(cr101953_state[(0)] = cr101953_block_10);

(cr101953_state[(3)] = null);

return missionary.core.park(cr101953_place_40);
}catch (e102942){var e102307 = e102942;
var cr101953_exception = e102307;
(cr101953_state[(0)] = null);

(cr101953_state[(1)] = null);

(cr101953_state[(3)] = null);

(cr101953_state[(4)] = null);

throw cr101953_exception;
}});
var cr101953_block_11 = (function (cr101953_state){
try{var cr101953_place_34 = (cr101953_state[(4)]);
(cr101953_state[(0)] = cr101953_block_13);

(cr101953_state[(4)] = null);

(cr101953_state[(1)] = cr101953_place_34);

return cr101953_state;
}catch (e102949){var e102322 = e102949;
var cr101953_exception = e102322;
(cr101953_state[(0)] = null);

(cr101953_state[(1)] = null);

(cr101953_state[(4)] = null);

throw cr101953_exception;
}});
var cr101953_block_14 = (function (cr101953_state){
try{var cr101953_place_46 = null;
(cr101953_state[(0)] = cr101953_block_16);

(cr101953_state[(1)] = cr101953_place_46);

return cr101953_state;
}catch (e102956){var e102325 = e102956;
var cr101953_exception = e102325;
(cr101953_state[(0)] = null);

(cr101953_state[(1)] = null);

throw cr101953_exception;
}});
var cr101953_block_0 = (function (cr101953_state){
try{var cr101953_place_0 = db;
var cr101953_place_1 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552);
var cr101953_place_2 = asset_uuid;
var cr101953_place_3 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr101953_place_1,cr101953_place_2], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr101953_place_4 = datascript.core.entity;
var cr101953_place_5 = cr101953_place_0;
var cr101953_place_6 = cr101953_place_3;
var cr101953_place_7 = (function (){var G__102336 = cr101953_place_5;
var G__102337 = cr101953_place_6;
var fexpr__102335 = cr101953_place_4;
var G__102963 = G__102336;
var G__102964 = G__102337;
var fexpr__102962 = fexpr__102335;
return (fexpr__102962.cljs$core$IFn$_invoke$arity$2 ? fexpr__102962.cljs$core$IFn$_invoke$arity$2(G__102963,G__102964) : fexpr__102962.call(null,G__102963,G__102964));
})();
var cr101953_place_8 = new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098);
var cr101953_place_9 = cr101953_place_7;
var cr101953_place_10 = cr101953_place_8.cljs$core$IFn$_invoke$arity$1(cr101953_place_9);
var cr101953_place_11 = new cljs.core.Keyword("logseq.property.asset","checksum","logseq.property.asset/checksum",-1011416979);
var cr101953_place_12 = cr101953_place_7;
var cr101953_place_13 = cr101953_place_11.cljs$core$IFn$_invoke$arity$1(cr101953_place_12);
var cr101953_place_14 = cljs.core.get;
var cr101953_place_15 = remote_metadata;
var cr101953_place_16 = "checksum";
var cr101953_place_17 = (function (){var G__102340 = cr101953_place_15;
var G__102341 = cr101953_place_16;
var fexpr__102339 = cr101953_place_14;
var G__102970 = G__102340;
var G__102971 = G__102341;
var fexpr__102969 = fexpr__102339;
return (fexpr__102969.cljs$core$IFn$_invoke$arity$2 ? fexpr__102969.cljs$core$IFn$_invoke$arity$2(G__102970,G__102971) : fexpr__102969.call(null,G__102970,G__102971));
})();
var cr101953_place_18 = cr101953_place_13;
var cr101953_place_19 = cr101953_place_18;
var cr101953_place_20 = null;
if(cljs.core.truth_(cr101953_place_19)){
(cr101953_state[(0)] = cr101953_block_2);

(cr101953_state[(1)] = cr101953_place_17);

(cr101953_state[(2)] = cr101953_place_20);

(cr101953_state[(3)] = cr101953_place_10);

(cr101953_state[(4)] = cr101953_place_13);

return cr101953_state;
} else {
(cr101953_state[(0)] = cr101953_block_1);

(cr101953_state[(1)] = cr101953_place_18);

(cr101953_state[(2)] = cr101953_place_20);

(cr101953_state[(3)] = cr101953_place_10);

return cr101953_state;
}
}catch (e102960){var e102330 = e102960;
var cr101953_exception = e102330;
(cr101953_state[(0)] = null);

throw cr101953_exception;
}});
var cr101953_block_2 = (function (cr101953_state){
try{var cr101953_place_17 = (cr101953_state[(1)]);
var cr101953_place_22 = cr101953_place_17;
var cr101953_place_23 = cr101953_place_22;
var cr101953_place_24 = null;
if(cljs.core.truth_(cr101953_place_23)){
(cr101953_state[(0)] = cr101953_block_4);

(cr101953_state[(5)] = cr101953_place_24);

return cr101953_state;
} else {
(cr101953_state[(0)] = cr101953_block_3);

(cr101953_state[(1)] = null);

(cr101953_state[(4)] = null);

(cr101953_state[(1)] = cr101953_place_22);

(cr101953_state[(5)] = cr101953_place_24);

return cr101953_state;
}
}catch (e102974){var e102352 = e102974;
var cr101953_exception = e102352;
(cr101953_state[(0)] = null);

(cr101953_state[(1)] = null);

(cr101953_state[(2)] = null);

(cr101953_state[(3)] = null);

(cr101953_state[(4)] = null);

throw cr101953_exception;
}});
return cloroutine.impl.coroutine((function (){var G__102363 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((6));
(G__102363[(0)] = cr101953_block_0);

return G__102363;
})());
})(),missionary.core.sp_run);
});
var cr101932_place_16 = cr101932_place_7;
var cr101932_place_17 = (function (){var G__102983 = cr101932_place_15;
var G__102984 = cr101932_place_16;
var fexpr__102982 = cr101932_place_14;
return (fexpr__102982.cljs$core$IFn$_invoke$arity$2 ? fexpr__102982.cljs$core$IFn$_invoke$arity$2(G__102983,G__102984) : fexpr__102982.call(null,G__102983,G__102984));
})();
var cr101932_place_18 = (function (){var G__102990 = cr101932_place_12;
var G__102991 = cr101932_place_13;
var G__102992 = cr101932_place_17;
var fexpr__102989 = cr101932_place_11;
return (fexpr__102989.cljs$core$IFn$_invoke$arity$3 ? fexpr__102989.cljs$core$IFn$_invoke$arity$3(G__102990,G__102991,G__102992) : fexpr__102989.call(null,G__102990,G__102991,G__102992));
})();
(cr101932_state[(0)] = cr101932_block_1);

(cr101932_state[(1)] = cr101932_place_9);

(cr101932_state[(2)] = cr101932_place_8);

(cr101932_state[(3)] = cr101932_place_10);

return missionary.core.park(cr101932_place_18);
}catch (e102734){var cr101932_exception = e102734;
(cr101932_state[(0)] = null);

throw cr101932_exception;
}});
var cr101932_block_1 = (function frontend$worker$rtc$asset$new_task__emit_remote_asset_updates_from_push_asset_upload_updates_$_cr101932_block_1(cr101932_state){
try{var cr101932_place_9 = (cr101932_state[(1)]);
var cr101932_place_8 = (cr101932_state[(2)]);
var cr101932_place_10 = (cr101932_state[(3)]);
var cr101932_place_19 = missionary.core.unpark();
var cr101932_place_20 = (function (){var G__103010 = cr101932_place_10;
var G__103011 = cr101932_place_19;
var fexpr__103009 = cr101932_place_9;
return (fexpr__103009.cljs$core$IFn$_invoke$arity$2 ? fexpr__103009.cljs$core$IFn$_invoke$arity$2(G__103010,G__103011) : fexpr__103009.call(null,G__103010,G__103011));
})();
var cr101932_place_21 = (function (){var G__103018 = cr101932_place_20;
var fexpr__103017 = cr101932_place_8;
return (fexpr__103017.cljs$core$IFn$_invoke$arity$1 ? fexpr__103017.cljs$core$IFn$_invoke$arity$1(G__103018) : fexpr__103017.call(null,G__103018));
})();
var cr101932_place_22 = cr101932_place_21;
var cr101932_place_23 = null;
if(cljs.core.truth_(cr101932_place_22)){
(cr101932_state[(0)] = cr101932_block_3);

(cr101932_state[(1)] = null);

(cr101932_state[(2)] = null);

(cr101932_state[(3)] = null);

(cr101932_state[(2)] = cr101932_place_21);

(cr101932_state[(1)] = cr101932_place_23);

return cr101932_state;
} else {
(cr101932_state[(0)] = cr101932_block_2);

(cr101932_state[(1)] = null);

(cr101932_state[(2)] = null);

(cr101932_state[(3)] = null);

(cr101932_state[(1)] = cr101932_place_23);

return cr101932_state;
}
}catch (e103002){var cr101932_exception = e103002;
(cr101932_state[(0)] = null);

(cr101932_state[(1)] = null);

(cr101932_state[(2)] = null);

(cr101932_state[(3)] = null);

throw cr101932_exception;
}});
var cr101932_block_2 = (function frontend$worker$rtc$asset$new_task__emit_remote_asset_updates_from_push_asset_upload_updates_$_cr101932_block_2(cr101932_state){
try{var cr101932_place_24 = null;
(cr101932_state[(0)] = cr101932_block_4);

(cr101932_state[(1)] = cr101932_place_24);

return cr101932_state;
}catch (e103025){var cr101932_exception = e103025;
(cr101932_state[(0)] = null);

(cr101932_state[(1)] = null);

throw cr101932_exception;
}});
var cr101932_block_3 = (function frontend$worker$rtc$asset$new_task__emit_remote_asset_updates_from_push_asset_upload_updates_$_cr101932_block_3(cr101932_state){
try{var cr101932_place_21 = (cr101932_state[(2)]);
var cr101932_place_25 = cr101932_place_21;
var cr101932_place_26 = cljs.core.reset_BANG_;
var cr101932_place_27 = frontend.worker.rtc.asset._STAR_remote_asset_updates;
var cr101932_place_28 = cr101932_place_25;
var cr101932_place_29 = (function (){var G__103033 = cr101932_place_27;
var G__103034 = cr101932_place_28;
var fexpr__103032 = cr101932_place_26;
return (fexpr__103032.cljs$core$IFn$_invoke$arity$2 ? fexpr__103032.cljs$core$IFn$_invoke$arity$2(G__103033,G__103034) : fexpr__103032.call(null,G__103033,G__103034));
})();
(cr101932_state[(0)] = cr101932_block_4);

(cr101932_state[(2)] = null);

(cr101932_state[(1)] = cr101932_place_29);

return cr101932_state;
}catch (e103028){var cr101932_exception = e103028;
(cr101932_state[(0)] = null);

(cr101932_state[(1)] = null);

(cr101932_state[(2)] = null);

throw cr101932_exception;
}});
var cr101932_block_4 = (function frontend$worker$rtc$asset$new_task__emit_remote_asset_updates_from_push_asset_upload_updates_$_cr101932_block_4(cr101932_state){
try{var cr101932_place_23 = (cr101932_state[(1)]);
(cr101932_state[(0)] = null);

(cr101932_state[(1)] = null);

return cr101932_place_23;
}catch (e103039){var cr101932_exception = e103039;
(cr101932_state[(0)] = null);

(cr101932_state[(1)] = null);

throw cr101932_exception;
}});
return cloroutine.impl.coroutine((function (){var G__103040 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__103040[(0)] = cr101932_block_0);

return G__103040;
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
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr103075_block_0 = (function frontend$worker$rtc$asset$holding_assets_sync_lock_$_cr103075_block_0(cr103075_state){
try{var cr103075_place_0 = cljs.core.compare_and_set_BANG_;
var cr103075_place_1 = frontend.worker.rtc.asset._STAR_assets_sync_lock;
var cr103075_place_2 = null;
var cr103075_place_3 = true;
var cr103075_place_4 = (function (){var G__103210 = cr103075_place_1;
var G__103211 = cr103075_place_2;
var G__103212 = cr103075_place_3;
var fexpr__103209 = cr103075_place_0;
return (fexpr__103209.cljs$core$IFn$_invoke$arity$3 ? fexpr__103209.cljs$core$IFn$_invoke$arity$3(G__103210,G__103211,G__103212) : fexpr__103209.call(null,G__103210,G__103211,G__103212));
})();
var cr103075_place_5 = null;
if(cljs.core.truth_(cr103075_place_4)){
(cr103075_state[(0)] = cr103075_block_2);

(cr103075_state[(1)] = cr103075_place_5);

return cr103075_state;
} else {
(cr103075_state[(0)] = cr103075_block_1);

return cr103075_state;
}
}catch (e103208){var cr103075_exception = e103208;
(cr103075_state[(0)] = null);

throw cr103075_exception;
}});
var cr103075_block_1 = (function frontend$worker$rtc$asset$holding_assets_sync_lock_$_cr103075_block_1(cr103075_state){
try{var cr103075_place_6 = cljs.core.ex_info;
var cr103075_place_7 = "Must not run multiple assets-sync loops";
var cr103075_place_8 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr103075_place_9 = new cljs.core.Keyword("assets-sync.exception","lock-failed","assets-sync.exception/lock-failed",1023170379);
var cr103075_place_10 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr103075_place_11 = true;
var cr103075_place_12 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr103075_place_8,cr103075_place_9,cr103075_place_10,cr103075_place_11]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr103075_place_13 = (function (){var G__103227 = cr103075_place_7;
var G__103228 = cr103075_place_12;
var fexpr__103226 = cr103075_place_6;
return (fexpr__103226.cljs$core$IFn$_invoke$arity$2 ? fexpr__103226.cljs$core$IFn$_invoke$arity$2(G__103227,G__103228) : fexpr__103226.call(null,G__103227,G__103228));
})();
var cr103075_place_14 = started_dfv;
var cr103075_place_15 = cr103075_place_13;
var cr103075_place_16 = (function (){var G__103233 = cr103075_place_15;
var fexpr__103232 = cr103075_place_14;
return (fexpr__103232.cljs$core$IFn$_invoke$arity$1 ? fexpr__103232.cljs$core$IFn$_invoke$arity$1(G__103233) : fexpr__103232.call(null,G__103233));
})();
var cr103075_place_17 = cr103075_place_13;
var cr103075_place_18 = (function(){throw cr103075_place_17})();
(cr103075_state[(0)] = null);

return null;
}catch (e103215){var cr103075_exception = e103215;
(cr103075_state[(0)] = null);

throw cr103075_exception;
}});
var cr103075_block_2 = (function frontend$worker$rtc$asset$holding_assets_sync_lock_$_cr103075_block_2(cr103075_state){
try{var cr103075_place_19 = null;
(cr103075_state[(0)] = cr103075_block_3);

(cr103075_state[(1)] = cr103075_place_19);

return cr103075_state;
}catch (e103237){var cr103075_exception = e103237;
(cr103075_state[(0)] = null);

(cr103075_state[(1)] = null);

throw cr103075_exception;
}});
var cr103075_block_3 = (function frontend$worker$rtc$asset$holding_assets_sync_lock_$_cr103075_block_3(cr103075_state){
try{var cr103075_place_5 = (cr103075_state[(1)]);
var cr103075_place_20 = null;
var cr103075_place_21 = false;
(cr103075_state[(0)] = cr103075_block_4);

(cr103075_state[(1)] = null);

(cr103075_state[(2)] = cr103075_place_20);

(cr103075_state[(1)] = cr103075_place_21);

return cr103075_state;
}catch (e103243){var cr103075_exception = e103243;
(cr103075_state[(0)] = null);

(cr103075_state[(1)] = null);

throw cr103075_exception;
}});
var cr103075_block_4 = (function frontend$worker$rtc$asset$holding_assets_sync_lock_$_cr103075_block_4(cr103075_state){
try{var cr103075_place_22 = task;
(cr103075_state[(0)] = cr103075_block_5);

return missionary.core.park(cr103075_place_22);
}catch (e103246){var cr103075_exception = e103246;
(cr103075_state[(0)] = cr103075_block_6);

(cr103075_state[(2)] = cr103075_exception);

return cr103075_state;
}});
var cr103075_block_5 = (function frontend$worker$rtc$asset$holding_assets_sync_lock_$_cr103075_block_5(cr103075_state){
try{var cr103075_place_23 = missionary.core.unpark();
(cr103075_state[(0)] = cr103075_block_7);

(cr103075_state[(2)] = cr103075_place_23);

return cr103075_state;
}catch (e103257){var cr103075_exception = e103257;
(cr103075_state[(0)] = cr103075_block_6);

(cr103075_state[(2)] = cr103075_exception);

return cr103075_state;
}});
var cr103075_block_6 = (function frontend$worker$rtc$asset$holding_assets_sync_lock_$_cr103075_block_6(cr103075_state){
try{var cr103075_place_20 = (cr103075_state[(2)]);
var cr103075_place_24 = cr103075_place_20;
var cr103075_place_25 = (function(){throw cr103075_place_24})();
(cr103075_state[(0)] = null);

(cr103075_state[(1)] = null);

(cr103075_state[(2)] = null);

return null;
}catch (e103262){var cr103075_exception = e103262;
(cr103075_state[(0)] = cr103075_block_7);

(cr103075_state[(1)] = true);

(cr103075_state[(2)] = cr103075_exception);

return cr103075_state;
}});
var cr103075_block_7 = (function frontend$worker$rtc$asset$holding_assets_sync_lock_$_cr103075_block_7(cr103075_state){
try{var cr103075_place_21 = (cr103075_state[(1)]);
var cr103075_place_20 = (cr103075_state[(2)]);
var cr103075_place_26 = cljs.core.reset_BANG_;
var cr103075_place_27 = frontend.worker.rtc.asset._STAR_assets_sync_lock;
var cr103075_place_28 = null;
var cr103075_place_29 = (function (){var G__103270 = cr103075_place_27;
var G__103271 = cr103075_place_28;
var fexpr__103269 = cr103075_place_26;
return (fexpr__103269.cljs$core$IFn$_invoke$arity$2 ? fexpr__103269.cljs$core$IFn$_invoke$arity$2(G__103270,G__103271) : fexpr__103269.call(null,G__103270,G__103271));
})();
var cr103075_place_30 = (cljs.core.truth_(cr103075_place_21)?(function(){throw cr103075_place_20})():cr103075_place_20);
(cr103075_state[(0)] = null);

(cr103075_state[(1)] = null);

(cr103075_state[(2)] = null);

return cr103075_place_30;
}catch (e103264){var cr103075_exception = e103264;
(cr103075_state[(0)] = null);

(cr103075_state[(1)] = null);

(cr103075_state[(2)] = null);

throw cr103075_exception;
}});
return cloroutine.impl.coroutine((function (){var G__103277 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__103277[(0)] = cr103075_block_0);

return G__103277;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.asset.clean_asset_ops_BANG_ = (function frontend$worker$rtc$asset$clean_asset_ops_BANG_(repo,all_asset_uuids,handled_asset_uuids){
var seq__103283 = cljs.core.seq(clojure.set.difference.cljs$core$IFn$_invoke$arity$2(cljs.core.set(all_asset_uuids),cljs.core.set(handled_asset_uuids)));
var chunk__103284 = null;
var count__103285 = (0);
var i__103286 = (0);
while(true){
if((i__103286 < count__103285)){
var asset_uuid = chunk__103284.cljs$core$IIndexed$_nth$arity$2(null,i__103286);
frontend.worker.rtc.client_op.remove_asset_op(repo,asset_uuid);


var G__105175 = seq__103283;
var G__105176 = chunk__103284;
var G__105177 = count__103285;
var G__105178 = (i__103286 + (1));
seq__103283 = G__105175;
chunk__103284 = G__105176;
count__103285 = G__105177;
i__103286 = G__105178;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__103283);
if(temp__5804__auto__){
var seq__103283__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__103283__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__103283__$1);
var G__105179 = cljs.core.chunk_rest(seq__103283__$1);
var G__105180 = c__5525__auto__;
var G__105181 = cljs.core.count(c__5525__auto__);
var G__105182 = (0);
seq__103283 = G__105179;
chunk__103284 = G__105180;
count__103285 = G__105181;
i__103286 = G__105182;
continue;
} else {
var asset_uuid = cljs.core.first(seq__103283__$1);
frontend.worker.rtc.client_op.remove_asset_op(repo,asset_uuid);


var G__105183 = cljs.core.next(seq__103283__$1);
var G__105184 = null;
var G__105185 = (0);
var G__105186 = (0);
seq__103283 = G__105183;
chunk__103284 = G__105184;
count__103285 = G__105185;
i__103286 = G__105186;
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
return missionary.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.constantly(null),frontend.common.missionary.concurrent_exec_flow((5),missionary.core.seed(asset_uuid__GT_url),(function (p__103322){
var vec__103323 = p__103322;
var asset_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103323,(0),null);
var url = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103323,(1),null);
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr103328_block_0 = (function frontend$worker$rtc$asset$new_task__concurrent_download_assets_$_cr103328_block_0(cr103328_state){
try{var cr103328_place_0 = frontend.common.missionary._LT__BANG_;
var cr103328_place_1 = frontend.worker.state._LT_invoke_main_thread;
var cr103328_place_2 = new cljs.core.Keyword("thread-api","rtc-download-asset","thread-api/rtc-download-asset",-555458777);
var cr103328_place_3 = repo;
var cr103328_place_4 = asset_uuid;
var cr103328_place_5 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr103328_place_4);
var cr103328_place_6 = cljs.core.get;
var cr103328_place_7 = asset_uuid__GT_asset_type;
var cr103328_place_8 = asset_uuid;
var cr103328_place_9 = (function (){var G__103394 = cr103328_place_7;
var G__103395 = cr103328_place_8;
var fexpr__103393 = cr103328_place_6;
return (fexpr__103393.cljs$core$IFn$_invoke$arity$2 ? fexpr__103393.cljs$core$IFn$_invoke$arity$2(G__103394,G__103395) : fexpr__103393.call(null,G__103394,G__103395));
})();
var cr103328_place_10 = url;
var cr103328_place_11 = (function (){var G__103397 = cr103328_place_2;
var G__103398 = cr103328_place_3;
var G__103399 = cr103328_place_5;
var G__103400 = cr103328_place_9;
var G__103401 = cr103328_place_10;
var fexpr__103396 = cr103328_place_1;
return (fexpr__103396.cljs$core$IFn$_invoke$arity$5 ? fexpr__103396.cljs$core$IFn$_invoke$arity$5(G__103397,G__103398,G__103399,G__103400,G__103401) : fexpr__103396.call(null,G__103397,G__103398,G__103399,G__103400,G__103401));
})();
var cr103328_place_12 = (function (){var G__103403 = cr103328_place_11;
var fexpr__103402 = cr103328_place_0;
return (fexpr__103402.cljs$core$IFn$_invoke$arity$1 ? fexpr__103402.cljs$core$IFn$_invoke$arity$1(G__103403) : fexpr__103402.call(null,G__103403));
})();
(cr103328_state[(0)] = cr103328_block_1);

return missionary.core.park(cr103328_place_12);
}catch (e103391){var cr103328_exception = e103391;
(cr103328_state[(0)] = null);

throw cr103328_exception;
}});
var cr103328_block_1 = (function frontend$worker$rtc$asset$new_task__concurrent_download_assets_$_cr103328_block_1(cr103328_state){
try{var cr103328_place_13 = missionary.core.unpark();
var cr103328_place_14 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr103328_place_15 = cr103328_place_13;
var cr103328_place_16 = cr103328_place_14.cljs$core$IFn$_invoke$arity$1(cr103328_place_15);
var cr103328_place_17 = cr103328_place_16;
var cr103328_place_18 = null;
if(cljs.core.truth_(cr103328_place_17)){
(cr103328_state[(0)] = cr103328_block_3);

(cr103328_state[(2)] = cr103328_place_13);

(cr103328_state[(3)] = cr103328_place_16);

(cr103328_state[(1)] = cr103328_place_18);

return cr103328_state;
} else {
(cr103328_state[(0)] = cr103328_block_2);

(cr103328_state[(1)] = cr103328_place_18);

return cr103328_state;
}
}catch (e103407){var cr103328_exception = e103407;
(cr103328_state[(0)] = null);

throw cr103328_exception;
}});
var cr103328_block_2 = (function frontend$worker$rtc$asset$new_task__concurrent_download_assets_$_cr103328_block_2(cr103328_state){
try{var cr103328_place_19 = null;
(cr103328_state[(0)] = cr103328_block_7);

(cr103328_state[(1)] = cr103328_place_19);

return cr103328_state;
}catch (e103408){var cr103328_exception = e103408;
(cr103328_state[(0)] = null);

(cr103328_state[(1)] = null);

throw cr103328_exception;
}});
var cr103328_block_3 = (function frontend$worker$rtc$asset$new_task__concurrent_download_assets_$_cr103328_block_3(cr103328_state){
try{var cr103328_place_16 = (cr103328_state[(3)]);
var cr103328_place_20 = cr103328_place_16;
var cr103328_place_21 = cljs.core.not_EQ_;
var cr103328_place_22 = (404);
var cr103328_place_23 = new cljs.core.Keyword(null,"status","status",-1997798413);
var cr103328_place_24 = new cljs.core.Keyword(null,"data","data",-232669377);
var cr103328_place_25 = cr103328_place_20;
var cr103328_place_26 = cr103328_place_24.cljs$core$IFn$_invoke$arity$1(cr103328_place_25);
var cr103328_place_27 = cr103328_place_23.cljs$core$IFn$_invoke$arity$1(cr103328_place_26);
var cr103328_place_28 = (function (){var G__103415 = cr103328_place_22;
var G__103416 = cr103328_place_27;
var fexpr__103414 = cr103328_place_21;
return (fexpr__103414.cljs$core$IFn$_invoke$arity$2 ? fexpr__103414.cljs$core$IFn$_invoke$arity$2(G__103415,G__103416) : fexpr__103414.call(null,G__103415,G__103416));
})();
var cr103328_place_29 = null;
if(cljs.core.truth_(cr103328_place_28)){
(cr103328_state[(0)] = cr103328_block_5);

(cr103328_state[(3)] = null);

(cr103328_state[(1)] = null);

return cr103328_state;
} else {
(cr103328_state[(0)] = cr103328_block_4);

(cr103328_state[(2)] = null);

(cr103328_state[(3)] = null);

(cr103328_state[(2)] = cr103328_place_29);

return cr103328_state;
}
}catch (e103410){var cr103328_exception = e103410;
(cr103328_state[(0)] = null);

(cr103328_state[(2)] = null);

(cr103328_state[(3)] = null);

(cr103328_state[(1)] = null);

throw cr103328_exception;
}});
var cr103328_block_4 = (function frontend$worker$rtc$asset$new_task__concurrent_download_assets_$_cr103328_block_4(cr103328_state){
try{var cr103328_place_30 = null;
(cr103328_state[(0)] = cr103328_block_6);

(cr103328_state[(2)] = cr103328_place_30);

return cr103328_state;
}catch (e103418){var cr103328_exception = e103418;
(cr103328_state[(0)] = null);

(cr103328_state[(2)] = null);

(cr103328_state[(1)] = null);

throw cr103328_exception;
}});
var cr103328_block_5 = (function frontend$worker$rtc$asset$new_task__concurrent_download_assets_$_cr103328_block_5(cr103328_state){
try{var cr103328_place_13 = (cr103328_state[(2)]);
var cr103328_place_31 = cljs.core.ex_info;
var cr103328_place_32 = "download asset failed";
var cr103328_place_33 = cr103328_place_13;
var cr103328_place_34 = (function (){var G__103422 = cr103328_place_32;
var G__103423 = cr103328_place_33;
var fexpr__103421 = cr103328_place_31;
return (fexpr__103421.cljs$core$IFn$_invoke$arity$2 ? fexpr__103421.cljs$core$IFn$_invoke$arity$2(G__103422,G__103423) : fexpr__103421.call(null,G__103422,G__103423));
})();
var cr103328_place_35 = (function(){throw cr103328_place_34})();
(cr103328_state[(0)] = null);

(cr103328_state[(2)] = null);

return null;
}catch (e103420){var cr103328_exception = e103420;
(cr103328_state[(0)] = null);

(cr103328_state[(2)] = null);

throw cr103328_exception;
}});
var cr103328_block_6 = (function frontend$worker$rtc$asset$new_task__concurrent_download_assets_$_cr103328_block_6(cr103328_state){
try{var cr103328_place_29 = (cr103328_state[(2)]);
(cr103328_state[(0)] = cr103328_block_7);

(cr103328_state[(2)] = null);

(cr103328_state[(1)] = cr103328_place_29);

return cr103328_state;
}catch (e103431){var cr103328_exception = e103431;
(cr103328_state[(0)] = null);

(cr103328_state[(2)] = null);

(cr103328_state[(1)] = null);

throw cr103328_exception;
}});
var cr103328_block_7 = (function frontend$worker$rtc$asset$new_task__concurrent_download_assets_$_cr103328_block_7(cr103328_state){
try{var cr103328_place_18 = (cr103328_state[(1)]);
(cr103328_state[(0)] = null);

(cr103328_state[(1)] = null);

return cr103328_place_18;
}catch (e103437){var cr103328_exception = e103437;
(cr103328_state[(0)] = null);

(cr103328_state[(1)] = null);

throw cr103328_exception;
}});
return cloroutine.impl.coroutine((function (){var G__103439 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__103439[(0)] = cr103328_block_0);

return G__103439;
})());
})(),missionary.core.sp_run);
})));
});
/**
 * Concurrently upload assets with limited max concurrent count
 */
frontend.worker.rtc.asset.new_task__concurrent_upload_assets = (function frontend$worker$rtc$asset$new_task__concurrent_upload_assets(repo,conn,asset_uuid__GT_url,asset_uuid__GT_asset_type_PLUS_checksum){
return missionary.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.constantly(null),frontend.common.missionary.concurrent_exec_flow((3),missionary.core.seed(asset_uuid__GT_url),(function (p__103448){
var vec__103449 = p__103448;
var asset_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103449,(0),null);
var url = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103449,(1),null);
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr103452_block_0 = (function frontend$worker$rtc$asset$new_task__concurrent_upload_assets_$_cr103452_block_0(cr103452_state){
try{var cr103452_place_0 = cljs.core.get;
var cr103452_place_1 = asset_uuid__GT_asset_type_PLUS_checksum;
var cr103452_place_2 = asset_uuid;
var cr103452_place_3 = (function (){var G__103527 = cr103452_place_1;
var G__103528 = cr103452_place_2;
var fexpr__103526 = cr103452_place_0;
return (fexpr__103526.cljs$core$IFn$_invoke$arity$2 ? fexpr__103526.cljs$core$IFn$_invoke$arity$2(G__103527,G__103528) : fexpr__103526.call(null,G__103527,G__103528));
})();
var cr103452_place_4 = cljs.core.nth;
var cr103452_place_5 = cr103452_place_3;
var cr103452_place_6 = (0);
var cr103452_place_7 = null;
var cr103452_place_8 = (function (){var G__103531 = cr103452_place_5;
var G__103532 = cr103452_place_6;
var G__103533 = cr103452_place_7;
var fexpr__103530 = cr103452_place_4;
return (fexpr__103530.cljs$core$IFn$_invoke$arity$3 ? fexpr__103530.cljs$core$IFn$_invoke$arity$3(G__103531,G__103532,G__103533) : fexpr__103530.call(null,G__103531,G__103532,G__103533));
})();
var cr103452_place_9 = cljs.core.nth;
var cr103452_place_10 = cr103452_place_3;
var cr103452_place_11 = (1);
var cr103452_place_12 = null;
var cr103452_place_13 = (function (){var G__103539 = cr103452_place_10;
var G__103540 = cr103452_place_11;
var G__103541 = cr103452_place_12;
var fexpr__103538 = cr103452_place_9;
return (fexpr__103538.cljs$core$IFn$_invoke$arity$3 ? fexpr__103538.cljs$core$IFn$_invoke$arity$3(G__103539,G__103540,G__103541) : fexpr__103538.call(null,G__103539,G__103540,G__103541));
})();
var cr103452_place_14 = frontend.common.missionary._LT__BANG_;
var cr103452_place_15 = frontend.worker.state._LT_invoke_main_thread;
var cr103452_place_16 = new cljs.core.Keyword("thread-api","rtc-upload-asset","thread-api/rtc-upload-asset",-1194088361);
var cr103452_place_17 = repo;
var cr103452_place_18 = asset_uuid;
var cr103452_place_19 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr103452_place_18);
var cr103452_place_20 = cr103452_place_8;
var cr103452_place_21 = cr103452_place_13;
var cr103452_place_22 = url;
var cr103452_place_23 = (function (){var G__103545 = cr103452_place_16;
var G__103546 = cr103452_place_17;
var G__103547 = cr103452_place_19;
var G__103548 = cr103452_place_20;
var G__103549 = cr103452_place_21;
var G__103550 = cr103452_place_22;
var fexpr__103544 = cr103452_place_15;
return (fexpr__103544.cljs$core$IFn$_invoke$arity$6 ? fexpr__103544.cljs$core$IFn$_invoke$arity$6(G__103545,G__103546,G__103547,G__103548,G__103549,G__103550) : fexpr__103544.call(null,G__103545,G__103546,G__103547,G__103548,G__103549,G__103550));
})();
var cr103452_place_24 = (function (){var G__103554 = cr103452_place_23;
var fexpr__103553 = cr103452_place_14;
return (fexpr__103553.cljs$core$IFn$_invoke$arity$1 ? fexpr__103553.cljs$core$IFn$_invoke$arity$1(G__103554) : fexpr__103553.call(null,G__103554));
})();
(cr103452_state[(0)] = cr103452_block_1);

(cr103452_state[(1)] = cr103452_place_13);

(cr103452_state[(2)] = cr103452_place_8);

return missionary.core.park(cr103452_place_24);
}catch (e103524){var cr103452_exception = e103524;
(cr103452_state[(0)] = null);

throw cr103452_exception;
}});
var cr103452_block_1 = (function frontend$worker$rtc$asset$new_task__concurrent_upload_assets_$_cr103452_block_1(cr103452_state){
try{var cr103452_place_25 = missionary.core.unpark();
var cr103452_place_26 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259);
var cr103452_place_27 = cr103452_place_25;
var cr103452_place_28 = cr103452_place_26.cljs$core$IFn$_invoke$arity$1(cr103452_place_27);
var cr103452_place_29 = null;
if(cljs.core.truth_(cr103452_place_28)){
(cr103452_state[(0)] = cr103452_block_3);

(cr103452_state[(1)] = null);

(cr103452_state[(2)] = null);

(cr103452_state[(1)] = cr103452_place_25);

return cr103452_state;
} else {
(cr103452_state[(0)] = cr103452_block_2);

(cr103452_state[(3)] = cr103452_place_29);

return cr103452_state;
}
}catch (e103561){var cr103452_exception = e103561;
(cr103452_state[(0)] = null);

(cr103452_state[(1)] = null);

(cr103452_state[(2)] = null);

throw cr103452_exception;
}});
var cr103452_block_2 = (function frontend$worker$rtc$asset$new_task__concurrent_upload_assets_$_cr103452_block_2(cr103452_state){
try{var cr103452_place_30 = null;
(cr103452_state[(0)] = cr103452_block_4);

(cr103452_state[(3)] = cr103452_place_30);

return cr103452_state;
}catch (e103571){var cr103452_exception = e103571;
(cr103452_state[(0)] = null);

(cr103452_state[(1)] = null);

(cr103452_state[(3)] = null);

(cr103452_state[(2)] = null);

throw cr103452_exception;
}});
var cr103452_block_3 = (function frontend$worker$rtc$asset$new_task__concurrent_upload_assets_$_cr103452_block_3(cr103452_state){
try{var cr103452_place_25 = (cr103452_state[(1)]);
var cr103452_place_31 = cljs.core.ex_info;
var cr103452_place_32 = "upload asset failed";
var cr103452_place_33 = cr103452_place_25;
var cr103452_place_34 = (function (){var G__103581 = cr103452_place_32;
var G__103582 = cr103452_place_33;
var fexpr__103580 = cr103452_place_31;
return (fexpr__103580.cljs$core$IFn$_invoke$arity$2 ? fexpr__103580.cljs$core$IFn$_invoke$arity$2(G__103581,G__103582) : fexpr__103580.call(null,G__103581,G__103582));
})();
var cr103452_place_35 = (function(){throw cr103452_place_34})();
(cr103452_state[(0)] = null);

(cr103452_state[(1)] = null);

return null;
}catch (e103575){var cr103452_exception = e103575;
(cr103452_state[(0)] = null);

(cr103452_state[(1)] = null);

throw cr103452_exception;
}});
var cr103452_block_4 = (function frontend$worker$rtc$asset$new_task__concurrent_upload_assets_$_cr103452_block_4(cr103452_state){
try{var cr103452_place_13 = (cr103452_state[(1)]);
var cr103452_place_29 = (cr103452_state[(3)]);
var cr103452_place_8 = (cr103452_state[(2)]);
var cr103452_place_36 = conn;
var cr103452_place_37 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552);
var cr103452_place_38 = asset_uuid;
var cr103452_place_39 = new cljs.core.Keyword("logseq.property.asset","remote-metadata","logseq.property.asset/remote-metadata",-990750469);
var cr103452_place_40 = new cljs.core.Keyword(null,"checksum","checksum",549736371);
var cr103452_place_41 = cr103452_place_13;
var cr103452_place_42 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr103452_place_43 = cr103452_place_8;
var cr103452_place_44 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr103452_place_40,cr103452_place_41,cr103452_place_42,cr103452_place_43]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr103452_place_45 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr103452_place_37,cr103452_place_38,cr103452_place_39,cr103452_place_44]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr103452_place_46 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr103452_place_45], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr103452_place_47 = new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534);
var cr103452_place_48 = false;
var cr103452_place_49 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr103452_place_47,cr103452_place_48]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr103452_place_50 = datascript.core.transact_BANG_;
var cr103452_place_51 = cr103452_place_36;
var cr103452_place_52 = cr103452_place_46;
var cr103452_place_53 = cr103452_place_49;
var cr103452_place_54 = (function (){var G__103595 = cr103452_place_51;
var G__103596 = cr103452_place_52;
var G__103597 = cr103452_place_53;
var fexpr__103594 = cr103452_place_50;
return (fexpr__103594.cljs$core$IFn$_invoke$arity$3 ? fexpr__103594.cljs$core$IFn$_invoke$arity$3(G__103595,G__103596,G__103597) : fexpr__103594.call(null,G__103595,G__103596,G__103597));
})();
var cr103452_place_55 = frontend.worker.rtc.client_op.remove_asset_op;
var cr103452_place_56 = repo;
var cr103452_place_57 = asset_uuid;
var cr103452_place_58 = (function (){var G__103600 = cr103452_place_56;
var G__103601 = cr103452_place_57;
var fexpr__103599 = cr103452_place_55;
return (fexpr__103599.cljs$core$IFn$_invoke$arity$2 ? fexpr__103599.cljs$core$IFn$_invoke$arity$2(G__103600,G__103601) : fexpr__103599.call(null,G__103600,G__103601));
})();
(cr103452_state[(0)] = null);

(cr103452_state[(1)] = null);

(cr103452_state[(3)] = null);

(cr103452_state[(2)] = null);

return cr103452_place_58;
}catch (e103585){var cr103452_exception = e103585;
(cr103452_state[(0)] = null);

(cr103452_state[(1)] = null);

(cr103452_state[(3)] = null);

(cr103452_state[(2)] = null);

throw cr103452_exception;
}});
return cloroutine.impl.coroutine((function (){var G__103606 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__103606[(0)] = cr103452_block_0);

return G__103606;
})());
})(),missionary.core.sp_run);
})));
});
frontend.worker.rtc.asset.new_task__push_local_asset_updates = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates(repo,get_ws_create_task,conn,graph_uuid,major_schema_version,add_log_fn){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr103627_block_3 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_3(cr103627_state){
try{var cr103627_place_28 = null;
(cr103627_state[(0)] = cr103627_block_6);

(cr103627_state[(2)] = cr103627_place_28);

return cr103627_state;
}catch (e104209){var cr103627_exception = e104209;
(cr103627_state[(0)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

(cr103627_state[(5)] = null);

throw cr103627_exception;
}});
var cr103627_block_16 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_16(cr103627_state){
try{var cr103627_place_113 = null;
(cr103627_state[(0)] = cr103627_block_20);

(cr103627_state[(6)] = cr103627_place_113);

return cr103627_state;
}catch (e104210){var cr103627_exception = e104210;
(cr103627_state[(0)] = null);

(cr103627_state[(10)] = null);

(cr103627_state[(5)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

(cr103627_state[(6)] = null);

throw cr103627_exception;
}});
var cr103627_block_2 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_2(cr103627_state){
try{var cr103627_place_4 = (cr103627_state[(2)]);
var cr103627_place_8 = cr103627_place_4;
var cr103627_place_9 = cljs.core.keep;
var cr103627_place_10 = (function (asset_op){
if(cljs.core.contains_QMARK_(asset_op,new cljs.core.Keyword(null,"update-asset","update-asset",501550582))){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(asset_op);
} else {
return null;
}
});
var cr103627_place_11 = cr103627_place_8;
var cr103627_place_12 = (function (){var G__104213 = cr103627_place_10;
var G__104214 = cr103627_place_11;
var fexpr__104212 = cr103627_place_9;
return (fexpr__104212.cljs$core$IFn$_invoke$arity$2 ? fexpr__104212.cljs$core$IFn$_invoke$arity$2(G__104213,G__104214) : fexpr__104212.call(null,G__104213,G__104214));
})();
var cr103627_place_13 = cljs.core.keep;
var cr103627_place_14 = (function (asset_op){
if(cljs.core.contains_QMARK_(asset_op,new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854))){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(asset_op);
} else {
return null;
}
});
var cr103627_place_15 = cr103627_place_8;
var cr103627_place_16 = (function (){var G__104216 = cr103627_place_14;
var G__104217 = cr103627_place_15;
var fexpr__104215 = cr103627_place_13;
return (fexpr__104215.cljs$core$IFn$_invoke$arity$2 ? fexpr__104215.cljs$core$IFn$_invoke$arity$2(G__104216,G__104217) : fexpr__104215.call(null,G__104216,G__104217));
})();
var cr103627_place_17 = cljs.core.into;
var cr103627_place_18 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr103627_place_19 = cljs.core.keep;
var cr103627_place_20 = (function (asset_uuid){
var ent = (function (){var G__103648 = cljs.core.deref(conn);
var G__103649 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),asset_uuid], null);
var G__104218 = G__103648;
var G__104219 = G__103649;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__104218,G__104219) : datascript.core.entity.call(null,G__104218,G__104219));
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
var cr103627_place_21 = (function (){var G__104221 = cr103627_place_20;
var fexpr__104220 = cr103627_place_19;
return (fexpr__104220.cljs$core$IFn$_invoke$arity$1 ? fexpr__104220.cljs$core$IFn$_invoke$arity$1(G__104221) : fexpr__104220.call(null,G__104221));
})();
var cr103627_place_22 = cr103627_place_12;
var cr103627_place_23 = (function (){var G__104223 = cr103627_place_18;
var G__104224 = cr103627_place_21;
var G__104225 = cr103627_place_22;
var fexpr__104222 = cr103627_place_17;
return (fexpr__104222.cljs$core$IFn$_invoke$arity$3 ? fexpr__104222.cljs$core$IFn$_invoke$arity$3(G__104223,G__104224,G__104225) : fexpr__104222.call(null,G__104223,G__104224,G__104225));
})();
var cr103627_place_24 = cljs.core.seq;
var cr103627_place_25 = cr103627_place_23;
var cr103627_place_26 = (function (){var G__104227 = cr103627_place_25;
var fexpr__104226 = cr103627_place_24;
return (fexpr__104226.cljs$core$IFn$_invoke$arity$1 ? fexpr__104226.cljs$core$IFn$_invoke$arity$1(G__104227) : fexpr__104226.call(null,G__104227));
})();
var cr103627_place_27 = null;
if(cljs.core.truth_(cr103627_place_26)){
(cr103627_state[(0)] = cr103627_block_4);

(cr103627_state[(2)] = null);

(cr103627_state[(2)] = cr103627_place_27);

(cr103627_state[(3)] = cr103627_place_16);

(cr103627_state[(4)] = cr103627_place_8);

(cr103627_state[(5)] = cr103627_place_23);

return cr103627_state;
} else {
(cr103627_state[(0)] = cr103627_block_3);

(cr103627_state[(2)] = null);

(cr103627_state[(2)] = cr103627_place_27);

(cr103627_state[(3)] = cr103627_place_16);

(cr103627_state[(4)] = cr103627_place_8);

(cr103627_state[(5)] = cr103627_place_23);

return cr103627_state;
}
}catch (e104211){var cr103627_exception = e104211;
(cr103627_state[(0)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(1)] = null);

throw cr103627_exception;
}});
var cr103627_block_11 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_11(cr103627_state){
try{var cr103627_place_74 = null;
(cr103627_state[(0)] = cr103627_block_23);

(cr103627_state[(5)] = cr103627_place_74);

return cr103627_state;
}catch (e104228){var cr103627_exception = e104228;
(cr103627_state[(0)] = null);

(cr103627_state[(5)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

throw cr103627_exception;
}});
var cr103627_block_14 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_14(cr103627_state){
try{var cr103627_place_101 = (cr103627_state[(7)]);
var cr103627_place_102 = (cr103627_state[(9)]);
var cr103627_place_103 = cr103627_place_102;
var cr103627_place_104 = cr103627_place_101;
var cr103627_place_105 = (cr103627_place_103 < cr103627_place_104);
var cr103627_place_106 = cr103627_place_105;
var cr103627_place_107 = null;
if(cr103627_place_106){
(cr103627_state[(0)] = cr103627_block_21);

return cr103627_state;
} else {
(cr103627_state[(0)] = cr103627_block_15);

(cr103627_state[(10)] = cr103627_place_107);

return cr103627_state;
}
}catch (e104229){var cr103627_exception = e104229;
(cr103627_state[(0)] = null);

(cr103627_state[(5)] = null);

(cr103627_state[(6)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

(cr103627_state[(7)] = null);

(cr103627_state[(8)] = null);

(cr103627_state[(9)] = null);

throw cr103627_exception;
}});
var cr103627_block_23 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_23(cr103627_state){
try{var cr103627_place_73 = (cr103627_state[(5)]);
var cr103627_place_27 = (cr103627_state[(2)]);
var cr103627_place_16 = (cr103627_state[(3)]);
var cr103627_place_8 = (cr103627_state[(4)]);
var cr103627_place_159 = frontend.worker.rtc.asset.clean_asset_ops_BANG_;
var cr103627_place_160 = repo;
var cr103627_place_161 = cljs.core.map;
var cr103627_place_162 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552);
var cr103627_place_163 = cr103627_place_8;
var cr103627_place_164 = (function (){var G__104233 = cr103627_place_162;
var G__104234 = cr103627_place_163;
var fexpr__104232 = cr103627_place_161;
return (fexpr__104232.cljs$core$IFn$_invoke$arity$2 ? fexpr__104232.cljs$core$IFn$_invoke$arity$2(G__104233,G__104234) : fexpr__104232.call(null,G__104233,G__104234));
})();
var cr103627_place_165 = cljs.core.concat;
var cr103627_place_166 = cljs.core.keys;
var cr103627_place_167 = cr103627_place_27;
var cr103627_place_168 = (function (){var G__104236 = cr103627_place_167;
var fexpr__104235 = cr103627_place_166;
return (fexpr__104235.cljs$core$IFn$_invoke$arity$1 ? fexpr__104235.cljs$core$IFn$_invoke$arity$1(G__104236) : fexpr__104235.call(null,G__104236));
})();
var cr103627_place_169 = cr103627_place_16;
var cr103627_place_170 = (function (){var G__104238 = cr103627_place_168;
var G__104239 = cr103627_place_169;
var fexpr__104237 = cr103627_place_165;
return (fexpr__104237.cljs$core$IFn$_invoke$arity$2 ? fexpr__104237.cljs$core$IFn$_invoke$arity$2(G__104238,G__104239) : fexpr__104237.call(null,G__104238,G__104239));
})();
var cr103627_place_171 = (function (){var G__104244 = cr103627_place_160;
var G__104245 = cr103627_place_164;
var G__104246 = cr103627_place_170;
var fexpr__104243 = cr103627_place_159;
return (fexpr__104243.cljs$core$IFn$_invoke$arity$3 ? fexpr__104243.cljs$core$IFn$_invoke$arity$3(G__104244,G__104245,G__104246) : fexpr__104243.call(null,G__104244,G__104245,G__104246));
})();
(cr103627_state[(0)] = cr103627_block_24);

(cr103627_state[(5)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(4)] = null);

(cr103627_state[(1)] = cr103627_place_171);

return cr103627_state;
}catch (e104230){var cr103627_exception = e104230;
(cr103627_state[(0)] = null);

(cr103627_state[(5)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

throw cr103627_exception;
}});
var cr103627_block_17 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_17(cr103627_state){
try{var cr103627_place_110 = (cr103627_state[(10)]);
var cr103627_place_114 = cr103627_place_110;
var cr103627_place_115 = cljs.core.chunked_seq_QMARK_;
var cr103627_place_116 = cr103627_place_114;
var cr103627_place_117 = (function (){var G__104253 = cr103627_place_116;
var fexpr__104252 = cr103627_place_115;
return (fexpr__104252.cljs$core$IFn$_invoke$arity$1 ? fexpr__104252.cljs$core$IFn$_invoke$arity$1(G__104253) : fexpr__104252.call(null,G__104253));
})();
var cr103627_place_118 = null;
if(cljs.core.truth_(cr103627_place_117)){
(cr103627_state[(0)] = cr103627_block_19);

(cr103627_state[(10)] = null);

(cr103627_state[(10)] = cr103627_place_114);

return cr103627_state;
} else {
(cr103627_state[(0)] = cr103627_block_18);

(cr103627_state[(10)] = null);

(cr103627_state[(10)] = cr103627_place_114);

return cr103627_state;
}
}catch (e104250){var cr103627_exception = e104250;
(cr103627_state[(0)] = null);

(cr103627_state[(5)] = null);

(cr103627_state[(6)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

(cr103627_state[(7)] = null);

(cr103627_state[(10)] = null);

(cr103627_state[(8)] = null);

(cr103627_state[(9)] = null);

throw cr103627_exception;
}});
var cr103627_block_8 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_8(cr103627_state){
try{var cr103627_place_27 = (cr103627_state[(2)]);
var cr103627_place_53 = new cljs.core.Keyword("rtc.asset.log","upload-assets","rtc.asset.log/upload-assets",1562167732);
var cr103627_place_54 = new cljs.core.Keyword(null,"asset-uuids","asset-uuids",-783416816);
var cr103627_place_55 = cljs.core.keys;
var cr103627_place_56 = cr103627_place_27;
var cr103627_place_57 = (function (){var G__104260 = cr103627_place_56;
var fexpr__104259 = cr103627_place_55;
return (fexpr__104259.cljs$core$IFn$_invoke$arity$1 ? fexpr__104259.cljs$core$IFn$_invoke$arity$1(G__104260) : fexpr__104259.call(null,G__104260));
})();
var cr103627_place_58 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr103627_place_54,cr103627_place_57]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr103627_place_59 = add_log_fn;
var cr103627_place_60 = cr103627_place_53;
var cr103627_place_61 = cr103627_place_58;
var cr103627_place_62 = (function (){var G__104262 = cr103627_place_60;
var G__104263 = cr103627_place_61;
var fexpr__104261 = cr103627_place_59;
return (fexpr__104261.cljs$core$IFn$_invoke$arity$2 ? fexpr__104261.cljs$core$IFn$_invoke$arity$2(G__104262,G__104263) : fexpr__104261.call(null,G__104262,G__104263));
})();
(cr103627_state[(0)] = cr103627_block_9);

(cr103627_state[(6)] = cr103627_place_62);

return cr103627_state;
}catch (e104257){var cr103627_exception = e104257;
(cr103627_state[(0)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

(cr103627_state[(5)] = null);

(cr103627_state[(6)] = null);

throw cr103627_exception;
}});
var cr103627_block_24 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_24(cr103627_state){
try{var cr103627_place_6 = (cr103627_state[(1)]);
(cr103627_state[(0)] = null);

(cr103627_state[(1)] = null);

return cr103627_place_6;
}catch (e104269){var cr103627_exception = e104269;
(cr103627_state[(0)] = null);

(cr103627_state[(1)] = null);

throw cr103627_exception;
}});
var cr103627_block_1 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_1(cr103627_state){
try{var cr103627_place_7 = null;
(cr103627_state[(0)] = cr103627_block_24);

(cr103627_state[(1)] = cr103627_place_7);

return cr103627_state;
}catch (e104273){var cr103627_exception = e104273;
(cr103627_state[(0)] = null);

(cr103627_state[(1)] = null);

throw cr103627_exception;
}});
var cr103627_block_13 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_13(cr103627_state){
try{var cr103627_place_16 = (cr103627_state[(3)]);
var cr103627_place_96 = missionary.core.unpark();
var cr103627_place_97 = cljs.core.seq;
var cr103627_place_98 = cr103627_place_16;
var cr103627_place_99 = (function (){var G__104285 = cr103627_place_98;
var fexpr__104284 = cr103627_place_97;
return (fexpr__104284.cljs$core$IFn$_invoke$arity$1 ? fexpr__104284.cljs$core$IFn$_invoke$arity$1(G__104285) : fexpr__104284.call(null,G__104285));
})();
var cr103627_place_100 = null;
var cr103627_place_101 = (0);
var cr103627_place_102 = (0);
(cr103627_state[(0)] = cr103627_block_14);

(cr103627_state[(8)] = cr103627_place_99);

(cr103627_state[(6)] = cr103627_place_100);

(cr103627_state[(7)] = cr103627_place_101);

(cr103627_state[(9)] = cr103627_place_102);

return cr103627_state;
}catch (e104277){var cr103627_exception = e104277;
(cr103627_state[(0)] = null);

(cr103627_state[(5)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

throw cr103627_exception;
}});
var cr103627_block_4 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_4(cr103627_state){
try{var cr103627_place_23 = (cr103627_state[(5)]);
var cr103627_place_29 = new cljs.core.Keyword(null,"asset-uuid->url","asset-uuid->url",354369294);
var cr103627_place_30 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr103627_place_31 = get_ws_create_task;
var cr103627_place_32 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr103627_place_33 = "get-assets-upload-urls";
var cr103627_place_34 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr103627_place_35 = graph_uuid;
var cr103627_place_36 = new cljs.core.Keyword(null,"asset-uuid->metadata","asset-uuid->metadata",-444389036);
var cr103627_place_37 = cljs.core.into;
var cr103627_place_38 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr103627_place_39 = cljs.core.map;
var cr103627_place_40 = (function (p__103666){
var vec__103668 = p__103666;
var asset_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103668,(0),null);
var vec__103671 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103668,(1),null);
var asset_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103671,(0),null);
var checksum = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103671,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [asset_uuid,new cljs.core.PersistentArrayMap(null, 2, ["type",asset_type,"checksum",checksum], null)], null);
});
var cr103627_place_41 = (function (){var G__104301 = cr103627_place_40;
var fexpr__104300 = cr103627_place_39;
return (fexpr__104300.cljs$core$IFn$_invoke$arity$1 ? fexpr__104300.cljs$core$IFn$_invoke$arity$1(G__104301) : fexpr__104300.call(null,G__104301));
})();
var cr103627_place_42 = cr103627_place_23;
var cr103627_place_43 = (function (){var G__104306 = cr103627_place_38;
var G__104307 = cr103627_place_41;
var G__104308 = cr103627_place_42;
var fexpr__104305 = cr103627_place_37;
return (fexpr__104305.cljs$core$IFn$_invoke$arity$3 ? fexpr__104305.cljs$core$IFn$_invoke$arity$3(G__104306,G__104307,G__104308) : fexpr__104305.call(null,G__104306,G__104307,G__104308));
})();
var cr103627_place_44 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr103627_place_34,cr103627_place_35,cr103627_place_32,cr103627_place_33,cr103627_place_36,cr103627_place_43]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr103627_place_45 = (function (){var G__104314 = cr103627_place_31;
var G__104315 = cr103627_place_44;
var fexpr__104313 = cr103627_place_30;
return (fexpr__104313.cljs$core$IFn$_invoke$arity$2 ? fexpr__104313.cljs$core$IFn$_invoke$arity$2(G__104314,G__104315) : fexpr__104313.call(null,G__104314,G__104315));
})();
(cr103627_state[(0)] = cr103627_block_5);

(cr103627_state[(6)] = cr103627_place_29);

return missionary.core.park(cr103627_place_45);
}catch (e104289){var cr103627_exception = e104289;
(cr103627_state[(0)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

(cr103627_state[(5)] = null);

throw cr103627_exception;
}});
var cr103627_block_10 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_10(cr103627_state){
try{var cr103627_place_16 = (cr103627_state[(3)]);
var cr103627_place_69 = missionary.core.unpark();
var cr103627_place_70 = cljs.core.seq;
var cr103627_place_71 = cr103627_place_16;
var cr103627_place_72 = (function (){var G__104322 = cr103627_place_71;
var fexpr__104321 = cr103627_place_70;
return (fexpr__104321.cljs$core$IFn$_invoke$arity$1 ? fexpr__104321.cljs$core$IFn$_invoke$arity$1(G__104322) : fexpr__104321.call(null,G__104322));
})();
var cr103627_place_73 = null;
if(cljs.core.truth_(cr103627_place_72)){
(cr103627_state[(0)] = cr103627_block_12);

(cr103627_state[(5)] = cr103627_place_73);

return cr103627_state;
} else {
(cr103627_state[(0)] = cr103627_block_11);

(cr103627_state[(5)] = cr103627_place_73);

return cr103627_state;
}
}catch (e104317){var cr103627_exception = e104317;
(cr103627_state[(0)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

throw cr103627_exception;
}});
var cr103627_block_21 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_21(cr103627_state){
try{var cr103627_place_100 = (cr103627_state[(6)]);
var cr103627_place_101 = (cr103627_state[(7)]);
var cr103627_place_99 = (cr103627_state[(8)]);
var cr103627_place_102 = (cr103627_state[(9)]);
var cr103627_place_144 = cljs.core._nth;
var cr103627_place_145 = cr103627_place_100;
var cr103627_place_146 = cr103627_place_102;
var cr103627_place_147 = (function (){var G__104327 = cr103627_place_145;
var G__104328 = cr103627_place_146;
var fexpr__104326 = cr103627_place_144;
return (fexpr__104326.cljs$core$IFn$_invoke$arity$2 ? fexpr__104326.cljs$core$IFn$_invoke$arity$2(G__104327,G__104328) : fexpr__104326.call(null,G__104327,G__104328));
})();
var cr103627_place_148 = frontend.worker.rtc.client_op.remove_asset_op;
var cr103627_place_149 = repo;
var cr103627_place_150 = cr103627_place_147;
var cr103627_place_151 = (function (){var G__104330 = cr103627_place_149;
var G__104331 = cr103627_place_150;
var fexpr__104329 = cr103627_place_148;
return (fexpr__104329.cljs$core$IFn$_invoke$arity$2 ? fexpr__104329.cljs$core$IFn$_invoke$arity$2(G__104330,G__104331) : fexpr__104329.call(null,G__104330,G__104331));
})();
var cr103627_place_152 = null;
var cr103627_place_153 = cr103627_place_99;
var cr103627_place_154 = cr103627_place_100;
var cr103627_place_155 = cr103627_place_101;
var cr103627_place_156 = cr103627_place_102;
var cr103627_place_157 = (1);
var cr103627_place_158 = (cr103627_place_156 + cr103627_place_157);
(cr103627_state[(0)] = cr103627_block_14);

(cr103627_state[(6)] = cr103627_place_154);

(cr103627_state[(7)] = cr103627_place_155);

(cr103627_state[(8)] = cr103627_place_153);

(cr103627_state[(9)] = cr103627_place_158);

return cr103627_state;
}catch (e104324){var cr103627_exception = e104324;
(cr103627_state[(0)] = null);

(cr103627_state[(5)] = null);

(cr103627_state[(6)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

(cr103627_state[(7)] = null);

(cr103627_state[(8)] = null);

(cr103627_state[(9)] = null);

throw cr103627_exception;
}});
var cr103627_block_9 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_9(cr103627_state){
try{var cr103627_place_27 = (cr103627_state[(2)]);
var cr103627_place_23 = (cr103627_state[(5)]);
var cr103627_place_51 = (cr103627_state[(6)]);
var cr103627_place_63 = frontend.worker.rtc.asset.new_task__concurrent_upload_assets;
var cr103627_place_64 = repo;
var cr103627_place_65 = conn;
var cr103627_place_66 = cr103627_place_27;
var cr103627_place_67 = cr103627_place_23;
var cr103627_place_68 = (function (){var G__104344 = cr103627_place_64;
var G__104345 = cr103627_place_65;
var G__104346 = cr103627_place_66;
var G__104347 = cr103627_place_67;
var fexpr__104343 = cr103627_place_63;
return (fexpr__104343.cljs$core$IFn$_invoke$arity$4 ? fexpr__104343.cljs$core$IFn$_invoke$arity$4(G__104344,G__104345,G__104346,G__104347) : fexpr__104343.call(null,G__104344,G__104345,G__104346,G__104347));
})();
(cr103627_state[(0)] = cr103627_block_10);

(cr103627_state[(5)] = null);

(cr103627_state[(6)] = null);

return missionary.core.park(cr103627_place_68);
}catch (e104334){var cr103627_exception = e104334;
(cr103627_state[(0)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

(cr103627_state[(5)] = null);

(cr103627_state[(6)] = null);

throw cr103627_exception;
}});
var cr103627_block_19 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_19(cr103627_state){
try{var cr103627_place_114 = (cr103627_state[(10)]);
var cr103627_place_133 = cljs.core.chunk_first;
var cr103627_place_134 = cr103627_place_114;
var cr103627_place_135 = (function (){var G__104363 = cr103627_place_134;
var fexpr__104362 = cr103627_place_133;
return (fexpr__104362.cljs$core$IFn$_invoke$arity$1 ? fexpr__104362.cljs$core$IFn$_invoke$arity$1(G__104363) : fexpr__104362.call(null,G__104363));
})();
var cr103627_place_136 = cljs.core.chunk_rest;
var cr103627_place_137 = cr103627_place_114;
var cr103627_place_138 = (function (){var G__104368 = cr103627_place_137;
var fexpr__104367 = cr103627_place_136;
return (fexpr__104367.cljs$core$IFn$_invoke$arity$1 ? fexpr__104367.cljs$core$IFn$_invoke$arity$1(G__104368) : fexpr__104367.call(null,G__104368));
})();
var cr103627_place_139 = cr103627_place_135;
var cr103627_place_140 = cljs.core.count;
var cr103627_place_141 = cr103627_place_135;
var cr103627_place_142 = (function (){var G__104370 = cr103627_place_141;
var fexpr__104369 = cr103627_place_140;
return (fexpr__104369.cljs$core$IFn$_invoke$arity$1 ? fexpr__104369.cljs$core$IFn$_invoke$arity$1(G__104370) : fexpr__104369.call(null,G__104370));
})();
var cr103627_place_143 = (0);
(cr103627_state[(0)] = cr103627_block_14);

(cr103627_state[(10)] = null);

(cr103627_state[(6)] = cr103627_place_139);

(cr103627_state[(7)] = cr103627_place_142);

(cr103627_state[(8)] = cr103627_place_138);

(cr103627_state[(9)] = cr103627_place_143);

return cr103627_state;
}catch (e104354){var cr103627_exception = e104354;
(cr103627_state[(0)] = null);

(cr103627_state[(5)] = null);

(cr103627_state[(6)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(10)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

(cr103627_state[(7)] = null);

(cr103627_state[(8)] = null);

(cr103627_state[(9)] = null);

throw cr103627_exception;
}});
var cr103627_block_18 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_18(cr103627_state){
try{var cr103627_place_114 = (cr103627_state[(10)]);
var cr103627_place_119 = cljs.core.first;
var cr103627_place_120 = cr103627_place_114;
var cr103627_place_121 = (function (){var G__104381 = cr103627_place_120;
var fexpr__104380 = cr103627_place_119;
return (fexpr__104380.cljs$core$IFn$_invoke$arity$1 ? fexpr__104380.cljs$core$IFn$_invoke$arity$1(G__104381) : fexpr__104380.call(null,G__104381));
})();
var cr103627_place_122 = frontend.worker.rtc.client_op.remove_asset_op;
var cr103627_place_123 = repo;
var cr103627_place_124 = cr103627_place_121;
var cr103627_place_125 = (function (){var G__104383 = cr103627_place_123;
var G__104384 = cr103627_place_124;
var fexpr__104382 = cr103627_place_122;
return (fexpr__104382.cljs$core$IFn$_invoke$arity$2 ? fexpr__104382.cljs$core$IFn$_invoke$arity$2(G__104383,G__104384) : fexpr__104382.call(null,G__104383,G__104384));
})();
var cr103627_place_126 = null;
var cr103627_place_127 = cljs.core.next;
var cr103627_place_128 = cr103627_place_114;
var cr103627_place_129 = (function (){var G__104386 = cr103627_place_128;
var fexpr__104385 = cr103627_place_127;
return (fexpr__104385.cljs$core$IFn$_invoke$arity$1 ? fexpr__104385.cljs$core$IFn$_invoke$arity$1(G__104386) : fexpr__104385.call(null,G__104386));
})();
var cr103627_place_130 = null;
var cr103627_place_131 = (0);
var cr103627_place_132 = (0);
(cr103627_state[(0)] = cr103627_block_14);

(cr103627_state[(10)] = null);

(cr103627_state[(6)] = cr103627_place_130);

(cr103627_state[(7)] = cr103627_place_131);

(cr103627_state[(8)] = cr103627_place_129);

(cr103627_state[(9)] = cr103627_place_132);

return cr103627_state;
}catch (e104378){var cr103627_exception = e104378;
(cr103627_state[(0)] = null);

(cr103627_state[(5)] = null);

(cr103627_state[(6)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(10)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

(cr103627_state[(7)] = null);

(cr103627_state[(8)] = null);

(cr103627_state[(9)] = null);

throw cr103627_exception;
}});
var cr103627_block_15 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_15(cr103627_state){
try{var cr103627_place_99 = (cr103627_state[(8)]);
var cr103627_place_108 = cljs.core.seq;
var cr103627_place_109 = cr103627_place_99;
var cr103627_place_110 = (function (){var G__104405 = cr103627_place_109;
var fexpr__104404 = cr103627_place_108;
return (fexpr__104404.cljs$core$IFn$_invoke$arity$1 ? fexpr__104404.cljs$core$IFn$_invoke$arity$1(G__104405) : fexpr__104404.call(null,G__104405));
})();
var cr103627_place_111 = cr103627_place_110;
var cr103627_place_112 = null;
if(cr103627_place_111){
(cr103627_state[(0)] = cr103627_block_17);

(cr103627_state[(10)] = null);

(cr103627_state[(10)] = cr103627_place_110);

return cr103627_state;
} else {
(cr103627_state[(0)] = cr103627_block_16);

(cr103627_state[(6)] = null);

(cr103627_state[(7)] = null);

(cr103627_state[(8)] = null);

(cr103627_state[(9)] = null);

(cr103627_state[(6)] = cr103627_place_112);

return cr103627_state;
}
}catch (e104396){var cr103627_exception = e104396;
(cr103627_state[(0)] = null);

(cr103627_state[(10)] = null);

(cr103627_state[(5)] = null);

(cr103627_state[(6)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

(cr103627_state[(7)] = null);

(cr103627_state[(8)] = null);

(cr103627_state[(9)] = null);

throw cr103627_exception;
}});
var cr103627_block_12 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_12(cr103627_state){
try{var cr103627_place_16 = (cr103627_state[(3)]);
var cr103627_place_75 = new cljs.core.Keyword("rtc.asset.log","remove-assets","rtc.asset.log/remove-assets",1813160439);
var cr103627_place_76 = new cljs.core.Keyword(null,"asset-uuids","asset-uuids",-783416816);
var cr103627_place_77 = cr103627_place_16;
var cr103627_place_78 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr103627_place_76,cr103627_place_77]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr103627_place_79 = add_log_fn;
var cr103627_place_80 = cr103627_place_75;
var cr103627_place_81 = cr103627_place_78;
var cr103627_place_82 = (function (){var G__104415 = cr103627_place_80;
var G__104416 = cr103627_place_81;
var fexpr__104414 = cr103627_place_79;
return (fexpr__104414.cljs$core$IFn$_invoke$arity$2 ? fexpr__104414.cljs$core$IFn$_invoke$arity$2(G__104415,G__104416) : fexpr__104414.call(null,G__104415,G__104416));
})();
var cr103627_place_83 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr103627_place_84 = get_ws_create_task;
var cr103627_place_85 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr103627_place_86 = "delete-assets";
var cr103627_place_87 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr103627_place_88 = graph_uuid;
var cr103627_place_89 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr103627_place_90 = major_schema_version;
var cr103627_place_91 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr103627_place_90);
var cr103627_place_92 = new cljs.core.Keyword(null,"asset-uuids","asset-uuids",-783416816);
var cr103627_place_93 = cr103627_place_16;
var cr103627_place_94 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr103627_place_89,cr103627_place_91,cr103627_place_85,cr103627_place_86,cr103627_place_92,cr103627_place_93,cr103627_place_87,cr103627_place_88]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr103627_place_95 = (function (){var G__104419 = cr103627_place_84;
var G__104420 = cr103627_place_94;
var fexpr__104418 = cr103627_place_83;
return (fexpr__104418.cljs$core$IFn$_invoke$arity$2 ? fexpr__104418.cljs$core$IFn$_invoke$arity$2(G__104419,G__104420) : fexpr__104418.call(null,G__104419,G__104420));
})();
(cr103627_state[(0)] = cr103627_block_13);

return missionary.core.park(cr103627_place_95);
}catch (e104409){var cr103627_exception = e104409;
(cr103627_state[(0)] = null);

(cr103627_state[(5)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

throw cr103627_exception;
}});
var cr103627_block_5 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_5(cr103627_state){
try{var cr103627_place_29 = (cr103627_state[(6)]);
var cr103627_place_46 = missionary.core.unpark();
var cr103627_place_47 = cr103627_place_29.cljs$core$IFn$_invoke$arity$1(cr103627_place_46);
(cr103627_state[(0)] = cr103627_block_6);

(cr103627_state[(6)] = null);

(cr103627_state[(2)] = cr103627_place_47);

return cr103627_state;
}catch (e104424){var cr103627_exception = e104424;
(cr103627_state[(0)] = null);

(cr103627_state[(6)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

(cr103627_state[(5)] = null);

throw cr103627_exception;
}});
var cr103627_block_7 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_7(cr103627_state){
try{var cr103627_place_52 = null;
(cr103627_state[(0)] = cr103627_block_9);

(cr103627_state[(6)] = cr103627_place_52);

return cr103627_state;
}catch (e104426){var cr103627_exception = e104426;
(cr103627_state[(0)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

(cr103627_state[(5)] = null);

(cr103627_state[(6)] = null);

throw cr103627_exception;
}});
var cr103627_block_0 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_0(cr103627_state){
try{var cr103627_place_0 = cljs.core.not_empty;
var cr103627_place_1 = frontend.worker.rtc.client_op.get_all_asset_ops;
var cr103627_place_2 = repo;
var cr103627_place_3 = (function (){var G__104434 = cr103627_place_2;
var fexpr__104433 = cr103627_place_1;
return (fexpr__104433.cljs$core$IFn$_invoke$arity$1 ? fexpr__104433.cljs$core$IFn$_invoke$arity$1(G__104434) : fexpr__104433.call(null,G__104434));
})();
var cr103627_place_4 = (function (){var G__104436 = cr103627_place_3;
var fexpr__104435 = cr103627_place_0;
return (fexpr__104435.cljs$core$IFn$_invoke$arity$1 ? fexpr__104435.cljs$core$IFn$_invoke$arity$1(G__104436) : fexpr__104435.call(null,G__104436));
})();
var cr103627_place_5 = cr103627_place_4;
var cr103627_place_6 = null;
if(cljs.core.truth_(cr103627_place_5)){
(cr103627_state[(0)] = cr103627_block_2);

(cr103627_state[(2)] = cr103627_place_4);

(cr103627_state[(1)] = cr103627_place_6);

return cr103627_state;
} else {
(cr103627_state[(0)] = cr103627_block_1);

(cr103627_state[(1)] = cr103627_place_6);

return cr103627_state;
}
}catch (e104431){var cr103627_exception = e104431;
(cr103627_state[(0)] = null);

throw cr103627_exception;
}});
var cr103627_block_6 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_6(cr103627_state){
try{var cr103627_place_27 = (cr103627_state[(2)]);
var cr103627_place_48 = cljs.core.seq;
var cr103627_place_49 = cr103627_place_27;
var cr103627_place_50 = (function (){var G__104446 = cr103627_place_49;
var fexpr__104445 = cr103627_place_48;
return (fexpr__104445.cljs$core$IFn$_invoke$arity$1 ? fexpr__104445.cljs$core$IFn$_invoke$arity$1(G__104446) : fexpr__104445.call(null,G__104446));
})();
var cr103627_place_51 = null;
if(cljs.core.truth_(cr103627_place_50)){
(cr103627_state[(0)] = cr103627_block_8);

(cr103627_state[(6)] = cr103627_place_51);

return cr103627_state;
} else {
(cr103627_state[(0)] = cr103627_block_7);

(cr103627_state[(6)] = cr103627_place_51);

return cr103627_state;
}
}catch (e104443){var cr103627_exception = e104443;
(cr103627_state[(0)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

(cr103627_state[(5)] = null);

throw cr103627_exception;
}});
var cr103627_block_22 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_22(cr103627_state){
try{var cr103627_place_107 = (cr103627_state[(10)]);
(cr103627_state[(0)] = cr103627_block_23);

(cr103627_state[(10)] = null);

(cr103627_state[(5)] = cr103627_place_107);

return cr103627_state;
}catch (e104447){var cr103627_exception = e104447;
(cr103627_state[(0)] = null);

(cr103627_state[(10)] = null);

(cr103627_state[(5)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

throw cr103627_exception;
}});
var cr103627_block_20 = (function frontend$worker$rtc$asset$new_task__push_local_asset_updates_$_cr103627_block_20(cr103627_state){
try{var cr103627_place_112 = (cr103627_state[(6)]);
(cr103627_state[(0)] = cr103627_block_22);

(cr103627_state[(6)] = null);

(cr103627_state[(10)] = cr103627_place_112);

return cr103627_state;
}catch (e104451){var cr103627_exception = e104451;
(cr103627_state[(0)] = null);

(cr103627_state[(10)] = null);

(cr103627_state[(5)] = null);

(cr103627_state[(2)] = null);

(cr103627_state[(3)] = null);

(cr103627_state[(1)] = null);

(cr103627_state[(4)] = null);

(cr103627_state[(6)] = null);

throw cr103627_exception;
}});
return cloroutine.impl.coroutine((function (){var G__104453 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((11));
(G__104453[(0)] = cr103627_block_0);

return G__104453;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.asset.new_task__pull_remote_asset_updates = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates(repo,get_ws_create_task,conn,graph_uuid,add_log_fn,asset_update_ops){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr104474_block_22 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_22(cr104474_state){
try{var cr104474_place_3 = (cr104474_state[(1)]);
(cr104474_state[(0)] = null);

(cr104474_state[(1)] = null);

return cr104474_place_3;
}catch (e104700){var cr104474_exception = e104700;
(cr104474_state[(0)] = null);

(cr104474_state[(1)] = null);

throw cr104474_exception;
}});
var cr104474_block_11 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_11(cr104474_state){
try{var cr104474_place_60 = (cr104474_state[(8)]);
var cr104474_place_65 = cljs.core.first;
var cr104474_place_66 = cr104474_place_60;
var cr104474_place_67 = (function (){var G__104703 = cr104474_place_66;
var fexpr__104702 = cr104474_place_65;
return (fexpr__104702.cljs$core$IFn$_invoke$arity$1 ? fexpr__104702.cljs$core$IFn$_invoke$arity$1(G__104703) : fexpr__104702.call(null,G__104703));
})();
var cr104474_place_68 = cljs.core.nth;
var cr104474_place_69 = cr104474_place_67;
var cr104474_place_70 = (0);
var cr104474_place_71 = null;
var cr104474_place_72 = (function (){var G__104705 = cr104474_place_69;
var G__104706 = cr104474_place_70;
var G__104707 = cr104474_place_71;
var fexpr__104704 = cr104474_place_68;
return (fexpr__104704.cljs$core$IFn$_invoke$arity$3 ? fexpr__104704.cljs$core$IFn$_invoke$arity$3(G__104705,G__104706,G__104707) : fexpr__104704.call(null,G__104705,G__104706,G__104707));
})();
var cr104474_place_73 = cljs.core.nth;
var cr104474_place_74 = cr104474_place_67;
var cr104474_place_75 = (1);
var cr104474_place_76 = null;
var cr104474_place_77 = (function (){var G__104709 = cr104474_place_74;
var G__104710 = cr104474_place_75;
var G__104711 = cr104474_place_76;
var fexpr__104708 = cr104474_place_73;
return (fexpr__104708.cljs$core$IFn$_invoke$arity$3 ? fexpr__104708.cljs$core$IFn$_invoke$arity$3(G__104709,G__104710,G__104711) : fexpr__104708.call(null,G__104709,G__104710,G__104711));
})();
var cr104474_place_78 = frontend.common.missionary._LT__BANG_;
var cr104474_place_79 = frontend.worker.state._LT_invoke_main_thread;
var cr104474_place_80 = new cljs.core.Keyword("thread-api","unlink-asset","thread-api/unlink-asset",289779656);
var cr104474_place_81 = repo;
var cr104474_place_82 = cr104474_place_72;
var cr104474_place_83 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr104474_place_82);
var cr104474_place_84 = cr104474_place_77;
var cr104474_place_85 = (function (){var G__104713 = cr104474_place_80;
var G__104714 = cr104474_place_81;
var G__104715 = cr104474_place_83;
var G__104716 = cr104474_place_84;
var fexpr__104712 = cr104474_place_79;
return (fexpr__104712.cljs$core$IFn$_invoke$arity$4 ? fexpr__104712.cljs$core$IFn$_invoke$arity$4(G__104713,G__104714,G__104715,G__104716) : fexpr__104712.call(null,G__104713,G__104714,G__104715,G__104716));
})();
var cr104474_place_86 = (function (){var G__104718 = cr104474_place_85;
var fexpr__104717 = cr104474_place_78;
return (fexpr__104717.cljs$core$IFn$_invoke$arity$1 ? fexpr__104717.cljs$core$IFn$_invoke$arity$1(G__104718) : fexpr__104717.call(null,G__104718));
})();
(cr104474_state[(0)] = cr104474_block_12);

return missionary.core.park(cr104474_place_86);
}catch (e104701){var cr104474_exception = e104701;
(cr104474_state[(0)] = null);

(cr104474_state[(2)] = null);

(cr104474_state[(3)] = null);

(cr104474_state[(4)] = null);

(cr104474_state[(5)] = null);

(cr104474_state[(6)] = null);

(cr104474_state[(8)] = null);

(cr104474_state[(7)] = null);

(cr104474_state[(1)] = null);

throw cr104474_exception;
}});
var cr104474_block_3 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_3(cr104474_state){
try{var cr104474_place_27 = null;
(cr104474_state[(0)] = cr104474_block_6);

(cr104474_state[(3)] = cr104474_place_27);

return cr104474_state;
}catch (e104719){var cr104474_exception = e104719;
(cr104474_state[(0)] = null);

(cr104474_state[(2)] = null);

(cr104474_state[(3)] = null);

(cr104474_state[(1)] = null);

(cr104474_state[(4)] = null);

throw cr104474_exception;
}});
var cr104474_block_10 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_10(cr104474_state){
try{var cr104474_place_56 = (cr104474_state[(8)]);
var cr104474_place_60 = cr104474_place_56;
var cr104474_place_61 = cljs.core.chunked_seq_QMARK_;
var cr104474_place_62 = cr104474_place_60;
var cr104474_place_63 = (function (){var G__104722 = cr104474_place_62;
var fexpr__104721 = cr104474_place_61;
return (fexpr__104721.cljs$core$IFn$_invoke$arity$1 ? fexpr__104721.cljs$core$IFn$_invoke$arity$1(G__104722) : fexpr__104721.call(null,G__104722));
})();
var cr104474_place_64 = null;
if(cljs.core.truth_(cr104474_place_63)){
(cr104474_state[(0)] = cr104474_block_13);

(cr104474_state[(8)] = null);

(cr104474_state[(8)] = cr104474_place_60);

return cr104474_state;
} else {
(cr104474_state[(0)] = cr104474_block_11);

(cr104474_state[(8)] = null);

(cr104474_state[(8)] = cr104474_place_60);

return cr104474_state;
}
}catch (e104720){var cr104474_exception = e104720;
(cr104474_state[(0)] = null);

(cr104474_state[(2)] = null);

(cr104474_state[(3)] = null);

(cr104474_state[(4)] = null);

(cr104474_state[(5)] = null);

(cr104474_state[(6)] = null);

(cr104474_state[(7)] = null);

(cr104474_state[(1)] = null);

(cr104474_state[(8)] = null);

throw cr104474_exception;
}});
var cr104474_block_20 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_20(cr104474_state){
try{var cr104474_place_22 = (cr104474_state[(2)]);
var cr104474_place_26 = (cr104474_state[(3)]);
var cr104474_place_140 = (cr104474_state[(4)]);
var cr104474_place_152 = frontend.worker.rtc.asset.new_task__concurrent_download_assets;
var cr104474_place_153 = repo;
var cr104474_place_154 = cr104474_place_26;
var cr104474_place_155 = cr104474_place_22;
var cr104474_place_156 = (function (){var G__104725 = cr104474_place_153;
var G__104726 = cr104474_place_154;
var G__104727 = cr104474_place_155;
var fexpr__104724 = cr104474_place_152;
return (fexpr__104724.cljs$core$IFn$_invoke$arity$3 ? fexpr__104724.cljs$core$IFn$_invoke$arity$3(G__104725,G__104726,G__104727) : fexpr__104724.call(null,G__104725,G__104726,G__104727));
})();
(cr104474_state[(0)] = cr104474_block_21);

(cr104474_state[(2)] = null);

(cr104474_state[(3)] = null);

(cr104474_state[(4)] = null);

return missionary.core.park(cr104474_place_156);
}catch (e104723){var cr104474_exception = e104723;
(cr104474_state[(0)] = null);

(cr104474_state[(2)] = null);

(cr104474_state[(3)] = null);

(cr104474_state[(4)] = null);

(cr104474_state[(1)] = null);

throw cr104474_exception;
}});
var cr104474_block_0 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_0(cr104474_state){
try{var cr104474_place_0 = cljs.core.seq;
var cr104474_place_1 = asset_update_ops;
var cr104474_place_2 = (function (){var G__104730 = cr104474_place_1;
var fexpr__104729 = cr104474_place_0;
return (fexpr__104729.cljs$core$IFn$_invoke$arity$1 ? fexpr__104729.cljs$core$IFn$_invoke$arity$1(G__104730) : fexpr__104729.call(null,G__104730));
})();
var cr104474_place_3 = null;
if(cljs.core.truth_(cr104474_place_2)){
(cr104474_state[(0)] = cr104474_block_2);

(cr104474_state[(1)] = cr104474_place_3);

return cr104474_state;
} else {
(cr104474_state[(0)] = cr104474_block_1);

(cr104474_state[(1)] = cr104474_place_3);

return cr104474_state;
}
}catch (e104728){var cr104474_exception = e104728;
(cr104474_state[(0)] = null);

throw cr104474_exception;
}});
var cr104474_block_14 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_14(cr104474_state){
try{var cr104474_place_58 = (cr104474_state[(4)]);
(cr104474_state[(0)] = cr104474_block_17);

(cr104474_state[(4)] = null);

(cr104474_state[(8)] = cr104474_place_58);

return cr104474_state;
}catch (e104731){var cr104474_exception = e104731;
(cr104474_state[(0)] = null);

(cr104474_state[(2)] = null);

(cr104474_state[(3)] = null);

(cr104474_state[(8)] = null);

(cr104474_state[(4)] = null);

(cr104474_state[(1)] = null);

throw cr104474_exception;
}});
var cr104474_block_8 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_8(cr104474_state){
try{var cr104474_place_45 = (cr104474_state[(7)]);
var cr104474_place_54 = cljs.core.seq;
var cr104474_place_55 = cr104474_place_45;
var cr104474_place_56 = (function (){var G__104734 = cr104474_place_55;
var fexpr__104733 = cr104474_place_54;
return (fexpr__104733.cljs$core$IFn$_invoke$arity$1 ? fexpr__104733.cljs$core$IFn$_invoke$arity$1(G__104734) : fexpr__104733.call(null,G__104734));
})();
var cr104474_place_57 = cr104474_place_56;
var cr104474_place_58 = null;
if(cr104474_place_57){
(cr104474_state[(0)] = cr104474_block_10);

(cr104474_state[(8)] = null);

(cr104474_state[(8)] = cr104474_place_56);

return cr104474_state;
} else {
(cr104474_state[(0)] = cr104474_block_9);

(cr104474_state[(4)] = null);

(cr104474_state[(5)] = null);

(cr104474_state[(6)] = null);

(cr104474_state[(7)] = null);

(cr104474_state[(4)] = cr104474_place_58);

return cr104474_state;
}
}catch (e104732){var cr104474_exception = e104732;
(cr104474_state[(0)] = null);

(cr104474_state[(2)] = null);

(cr104474_state[(3)] = null);

(cr104474_state[(4)] = null);

(cr104474_state[(5)] = null);

(cr104474_state[(8)] = null);

(cr104474_state[(6)] = null);

(cr104474_state[(7)] = null);

(cr104474_state[(1)] = null);

throw cr104474_exception;
}});
var cr104474_block_15 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_15(cr104474_state){
try{var cr104474_place_48 = (cr104474_state[(4)]);
var cr104474_place_46 = (cr104474_state[(5)]);
var cr104474_place_106 = cljs.core._nth;
var cr104474_place_107 = cr104474_place_46;
var cr104474_place_108 = cr104474_place_48;
var cr104474_place_109 = (function (){var G__104737 = cr104474_place_107;
var G__104738 = cr104474_place_108;
var fexpr__104736 = cr104474_place_106;
return (fexpr__104736.cljs$core$IFn$_invoke$arity$2 ? fexpr__104736.cljs$core$IFn$_invoke$arity$2(G__104737,G__104738) : fexpr__104736.call(null,G__104737,G__104738));
})();
var cr104474_place_110 = cljs.core.nth;
var cr104474_place_111 = cr104474_place_109;
var cr104474_place_112 = (0);
var cr104474_place_113 = null;
var cr104474_place_114 = (function (){var G__104740 = cr104474_place_111;
var G__104741 = cr104474_place_112;
var G__104742 = cr104474_place_113;
var fexpr__104739 = cr104474_place_110;
return (fexpr__104739.cljs$core$IFn$_invoke$arity$3 ? fexpr__104739.cljs$core$IFn$_invoke$arity$3(G__104740,G__104741,G__104742) : fexpr__104739.call(null,G__104740,G__104741,G__104742));
})();
var cr104474_place_115 = cljs.core.nth;
var cr104474_place_116 = cr104474_place_109;
var cr104474_place_117 = (1);
var cr104474_place_118 = null;
var cr104474_place_119 = (function (){var G__104744 = cr104474_place_116;
var G__104745 = cr104474_place_117;
var G__104746 = cr104474_place_118;
var fexpr__104743 = cr104474_place_115;
return (fexpr__104743.cljs$core$IFn$_invoke$arity$3 ? fexpr__104743.cljs$core$IFn$_invoke$arity$3(G__104744,G__104745,G__104746) : fexpr__104743.call(null,G__104744,G__104745,G__104746));
})();
var cr104474_place_120 = frontend.common.missionary._LT__BANG_;
var cr104474_place_121 = frontend.worker.state._LT_invoke_main_thread;
var cr104474_place_122 = new cljs.core.Keyword("thread-api","unlink-asset","thread-api/unlink-asset",289779656);
var cr104474_place_123 = repo;
var cr104474_place_124 = cr104474_place_114;
var cr104474_place_125 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr104474_place_124);
var cr104474_place_126 = cr104474_place_119;
var cr104474_place_127 = (function (){var G__104748 = cr104474_place_122;
var G__104749 = cr104474_place_123;
var G__104750 = cr104474_place_125;
var G__104751 = cr104474_place_126;
var fexpr__104747 = cr104474_place_121;
return (fexpr__104747.cljs$core$IFn$_invoke$arity$4 ? fexpr__104747.cljs$core$IFn$_invoke$arity$4(G__104748,G__104749,G__104750,G__104751) : fexpr__104747.call(null,G__104748,G__104749,G__104750,G__104751));
})();
var cr104474_place_128 = (function (){var G__104753 = cr104474_place_127;
var fexpr__104752 = cr104474_place_120;
return (fexpr__104752.cljs$core$IFn$_invoke$arity$1 ? fexpr__104752.cljs$core$IFn$_invoke$arity$1(G__104753) : fexpr__104752.call(null,G__104753));
})();
(cr104474_state[(0)] = cr104474_block_16);

return missionary.core.park(cr104474_place_128);
}catch (e104735){var cr104474_exception = e104735;
(cr104474_state[(0)] = null);

(cr104474_state[(2)] = null);

(cr104474_state[(3)] = null);

(cr104474_state[(4)] = null);

(cr104474_state[(5)] = null);

(cr104474_state[(6)] = null);

(cr104474_state[(7)] = null);

(cr104474_state[(1)] = null);

throw cr104474_exception;
}});
var cr104474_block_13 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_13(cr104474_state){
try{var cr104474_place_60 = (cr104474_state[(8)]);
var cr104474_place_95 = cljs.core.chunk_first;
var cr104474_place_96 = cr104474_place_60;
var cr104474_place_97 = (function (){var G__104756 = cr104474_place_96;
var fexpr__104755 = cr104474_place_95;
return (fexpr__104755.cljs$core$IFn$_invoke$arity$1 ? fexpr__104755.cljs$core$IFn$_invoke$arity$1(G__104756) : fexpr__104755.call(null,G__104756));
})();
var cr104474_place_98 = cljs.core.chunk_rest;
var cr104474_place_99 = cr104474_place_60;
var cr104474_place_100 = (function (){var G__104758 = cr104474_place_99;
var fexpr__104757 = cr104474_place_98;
return (fexpr__104757.cljs$core$IFn$_invoke$arity$1 ? fexpr__104757.cljs$core$IFn$_invoke$arity$1(G__104758) : fexpr__104757.call(null,G__104758));
})();
var cr104474_place_101 = cr104474_place_97;
var cr104474_place_102 = cljs.core.count;
var cr104474_place_103 = cr104474_place_97;
var cr104474_place_104 = (function (){var G__104760 = cr104474_place_103;
var fexpr__104759 = cr104474_place_102;
return (fexpr__104759.cljs$core$IFn$_invoke$arity$1 ? fexpr__104759.cljs$core$IFn$_invoke$arity$1(G__104760) : fexpr__104759.call(null,G__104760));
})();
var cr104474_place_105 = (0);
(cr104474_state[(0)] = cr104474_block_7);

(cr104474_state[(8)] = null);

(cr104474_state[(4)] = cr104474_place_105);

(cr104474_state[(5)] = cr104474_place_101);

(cr104474_state[(6)] = cr104474_place_104);

(cr104474_state[(7)] = cr104474_place_100);

return cr104474_state;
}catch (e104754){var cr104474_exception = e104754;
(cr104474_state[(0)] = null);

(cr104474_state[(2)] = null);

(cr104474_state[(3)] = null);

(cr104474_state[(4)] = null);

(cr104474_state[(5)] = null);

(cr104474_state[(6)] = null);

(cr104474_state[(8)] = null);

(cr104474_state[(7)] = null);

(cr104474_state[(1)] = null);

throw cr104474_exception;
}});
var cr104474_block_1 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_1(cr104474_state){
try{var cr104474_place_4 = null;
(cr104474_state[(0)] = cr104474_block_22);

(cr104474_state[(1)] = cr104474_place_4);

return cr104474_state;
}catch (e104761){var cr104474_exception = e104761;
(cr104474_state[(0)] = null);

(cr104474_state[(1)] = null);

throw cr104474_exception;
}});
var cr104474_block_2 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_2(cr104474_state){
try{var cr104474_place_5 = cljs.core.keep;
var cr104474_place_6 = (function (op){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"update-asset","update-asset",501550582),new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(op))){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(op);
} else {
return null;
}
});
var cr104474_place_7 = asset_update_ops;
var cr104474_place_8 = (function (){var G__104764 = cr104474_place_6;
var G__104765 = cr104474_place_7;
var fexpr__104763 = cr104474_place_5;
return (fexpr__104763.cljs$core$IFn$_invoke$arity$2 ? fexpr__104763.cljs$core$IFn$_invoke$arity$2(G__104764,G__104765) : fexpr__104763.call(null,G__104764,G__104765));
})();
var cr104474_place_9 = cljs.core.into;
var cr104474_place_10 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr104474_place_11 = cljs.core.keep;
var cr104474_place_12 = (function (op){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"remove-asset","remove-asset",-1739744854),new cljs.core.Keyword(null,"op","op",-1882987955).cljs$core$IFn$_invoke$arity$1(op))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(op),new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098).cljs$core$IFn$_invoke$arity$1(op)], null);
} else {
return null;
}
});
var cr104474_place_13 = (function (){var G__104767 = cr104474_place_12;
var fexpr__104766 = cr104474_place_11;
return (fexpr__104766.cljs$core$IFn$_invoke$arity$1 ? fexpr__104766.cljs$core$IFn$_invoke$arity$1(G__104767) : fexpr__104766.call(null,G__104767));
})();
var cr104474_place_14 = asset_update_ops;
var cr104474_place_15 = (function (){var G__104769 = cr104474_place_10;
var G__104770 = cr104474_place_13;
var G__104771 = cr104474_place_14;
var fexpr__104768 = cr104474_place_9;
return (fexpr__104768.cljs$core$IFn$_invoke$arity$3 ? fexpr__104768.cljs$core$IFn$_invoke$arity$3(G__104769,G__104770,G__104771) : fexpr__104768.call(null,G__104769,G__104770,G__104771));
})();
var cr104474_place_16 = cljs.core.into;
var cr104474_place_17 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr104474_place_18 = cljs.core.keep;
var cr104474_place_19 = (function (asset_uuid){
var temp__5804__auto__ = new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098).cljs$core$IFn$_invoke$arity$1((function (){var G__104484 = cljs.core.deref(conn);
var G__104485 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),asset_uuid], null);
var G__104775 = G__104484;
var G__104776 = G__104485;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__104775,G__104776) : datascript.core.entity.call(null,G__104775,G__104776));
})());
if(cljs.core.truth_(temp__5804__auto__)){
var tp = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [asset_uuid,tp], null);
} else {
return null;
}
});
var cr104474_place_20 = (function (){var G__104781 = cr104474_place_19;
var fexpr__104780 = cr104474_place_18;
return (fexpr__104780.cljs$core$IFn$_invoke$arity$1 ? fexpr__104780.cljs$core$IFn$_invoke$arity$1(G__104781) : fexpr__104780.call(null,G__104781));
})();
var cr104474_place_21 = cr104474_place_8;
var cr104474_place_22 = (function (){var G__104786 = cr104474_place_17;
var G__104787 = cr104474_place_20;
var G__104788 = cr104474_place_21;
var fexpr__104785 = cr104474_place_16;
return (fexpr__104785.cljs$core$IFn$_invoke$arity$3 ? fexpr__104785.cljs$core$IFn$_invoke$arity$3(G__104786,G__104787,G__104788) : fexpr__104785.call(null,G__104786,G__104787,G__104788));
})();
var cr104474_place_23 = cljs.core.seq;
var cr104474_place_24 = cr104474_place_22;
var cr104474_place_25 = (function (){var G__104790 = cr104474_place_24;
var fexpr__104789 = cr104474_place_23;
return (fexpr__104789.cljs$core$IFn$_invoke$arity$1 ? fexpr__104789.cljs$core$IFn$_invoke$arity$1(G__104790) : fexpr__104789.call(null,G__104790));
})();
var cr104474_place_26 = null;
if(cljs.core.truth_(cr104474_place_25)){
(cr104474_state[(0)] = cr104474_block_4);

(cr104474_state[(2)] = cr104474_place_22);

(cr104474_state[(3)] = cr104474_place_26);

(cr104474_state[(4)] = cr104474_place_15);

return cr104474_state;
} else {
(cr104474_state[(0)] = cr104474_block_3);

(cr104474_state[(2)] = cr104474_place_22);

(cr104474_state[(3)] = cr104474_place_26);

(cr104474_state[(4)] = cr104474_place_15);

return cr104474_state;
}
}catch (e104762){var cr104474_exception = e104762;
(cr104474_state[(0)] = null);

(cr104474_state[(1)] = null);

throw cr104474_exception;
}});
var cr104474_block_12 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_12(cr104474_state){
try{var cr104474_place_60 = (cr104474_state[(8)]);
var cr104474_place_87 = missionary.core.unpark();
var cr104474_place_88 = null;
var cr104474_place_89 = cljs.core.next;
var cr104474_place_90 = cr104474_place_60;
var cr104474_place_91 = (function (){var G__104793 = cr104474_place_90;
var fexpr__104792 = cr104474_place_89;
return (fexpr__104792.cljs$core$IFn$_invoke$arity$1 ? fexpr__104792.cljs$core$IFn$_invoke$arity$1(G__104793) : fexpr__104792.call(null,G__104793));
})();
var cr104474_place_92 = null;
var cr104474_place_93 = (0);
var cr104474_place_94 = (0);
(cr104474_state[(0)] = cr104474_block_7);

(cr104474_state[(8)] = null);

(cr104474_state[(4)] = cr104474_place_94);

(cr104474_state[(5)] = cr104474_place_92);

(cr104474_state[(6)] = cr104474_place_93);

(cr104474_state[(7)] = cr104474_place_91);

return cr104474_state;
}catch (e104791){var cr104474_exception = e104791;
(cr104474_state[(0)] = null);

(cr104474_state[(2)] = null);

(cr104474_state[(3)] = null);

(cr104474_state[(4)] = null);

(cr104474_state[(5)] = null);

(cr104474_state[(6)] = null);

(cr104474_state[(8)] = null);

(cr104474_state[(7)] = null);

(cr104474_state[(1)] = null);

throw cr104474_exception;
}});
var cr104474_block_18 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_18(cr104474_state){
try{var cr104474_place_141 = null;
(cr104474_state[(0)] = cr104474_block_20);

(cr104474_state[(4)] = cr104474_place_141);

return cr104474_state;
}catch (e104794){var cr104474_exception = e104794;
(cr104474_state[(0)] = null);

(cr104474_state[(2)] = null);

(cr104474_state[(3)] = null);

(cr104474_state[(4)] = null);

(cr104474_state[(1)] = null);

throw cr104474_exception;
}});
var cr104474_block_21 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_21(cr104474_state){
try{var cr104474_place_157 = missionary.core.unpark();
(cr104474_state[(0)] = cr104474_block_22);

(cr104474_state[(1)] = cr104474_place_157);

return cr104474_state;
}catch (e104795){var cr104474_exception = e104795;
(cr104474_state[(0)] = null);

(cr104474_state[(1)] = null);

throw cr104474_exception;
}});
var cr104474_block_6 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_6(cr104474_state){
try{var cr104474_place_26 = (cr104474_state[(3)]);
var cr104474_place_15 = (cr104474_state[(4)]);
var cr104474_place_43 = cljs.core.seq;
var cr104474_place_44 = cr104474_place_15;
var cr104474_place_45 = (function (){var G__104798 = cr104474_place_44;
var fexpr__104797 = cr104474_place_43;
return (fexpr__104797.cljs$core$IFn$_invoke$arity$1 ? fexpr__104797.cljs$core$IFn$_invoke$arity$1(G__104798) : fexpr__104797.call(null,G__104798));
})();
var cr104474_place_46 = null;
var cr104474_place_47 = (0);
var cr104474_place_48 = (0);
(cr104474_state[(0)] = cr104474_block_7);

(cr104474_state[(4)] = null);

(cr104474_state[(7)] = cr104474_place_45);

(cr104474_state[(5)] = cr104474_place_46);

(cr104474_state[(6)] = cr104474_place_47);

(cr104474_state[(4)] = cr104474_place_48);

return cr104474_state;
}catch (e104796){var cr104474_exception = e104796;
(cr104474_state[(0)] = null);

(cr104474_state[(2)] = null);

(cr104474_state[(3)] = null);

(cr104474_state[(1)] = null);

(cr104474_state[(4)] = null);

throw cr104474_exception;
}});
var cr104474_block_5 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_5(cr104474_state){
try{var cr104474_place_28 = (cr104474_state[(5)]);
var cr104474_place_41 = missionary.core.unpark();
var cr104474_place_42 = cr104474_place_28.cljs$core$IFn$_invoke$arity$1(cr104474_place_41);
(cr104474_state[(0)] = cr104474_block_6);

(cr104474_state[(5)] = null);

(cr104474_state[(3)] = cr104474_place_42);

return cr104474_state;
}catch (e104799){var cr104474_exception = e104799;
(cr104474_state[(0)] = null);

(cr104474_state[(2)] = null);

(cr104474_state[(3)] = null);

(cr104474_state[(5)] = null);

(cr104474_state[(1)] = null);

(cr104474_state[(4)] = null);

throw cr104474_exception;
}});
var cr104474_block_16 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_16(cr104474_state){
try{var cr104474_place_48 = (cr104474_state[(4)]);
var cr104474_place_46 = (cr104474_state[(5)]);
var cr104474_place_47 = (cr104474_state[(6)]);
var cr104474_place_45 = (cr104474_state[(7)]);
var cr104474_place_129 = missionary.core.unpark();
var cr104474_place_130 = null;
var cr104474_place_131 = cr104474_place_45;
var cr104474_place_132 = cr104474_place_46;
var cr104474_place_133 = cr104474_place_47;
var cr104474_place_134 = cr104474_place_48;
var cr104474_place_135 = (1);
var cr104474_place_136 = (cr104474_place_134 + cr104474_place_135);
(cr104474_state[(0)] = cr104474_block_7);

(cr104474_state[(4)] = cr104474_place_136);

(cr104474_state[(5)] = cr104474_place_132);

(cr104474_state[(6)] = cr104474_place_133);

(cr104474_state[(7)] = cr104474_place_131);

return cr104474_state;
}catch (e104800){var cr104474_exception = e104800;
(cr104474_state[(0)] = null);

(cr104474_state[(2)] = null);

(cr104474_state[(3)] = null);

(cr104474_state[(4)] = null);

(cr104474_state[(5)] = null);

(cr104474_state[(6)] = null);

(cr104474_state[(7)] = null);

(cr104474_state[(1)] = null);

throw cr104474_exception;
}});
var cr104474_block_19 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_19(cr104474_state){
try{var cr104474_place_26 = (cr104474_state[(3)]);
var cr104474_place_142 = new cljs.core.Keyword("rtc.asset.log","download-assets","rtc.asset.log/download-assets",-1980226986);
var cr104474_place_143 = new cljs.core.Keyword(null,"asset-uuids","asset-uuids",-783416816);
var cr104474_place_144 = cljs.core.keys;
var cr104474_place_145 = cr104474_place_26;
var cr104474_place_146 = (function (){var G__104803 = cr104474_place_145;
var fexpr__104802 = cr104474_place_144;
return (fexpr__104802.cljs$core$IFn$_invoke$arity$1 ? fexpr__104802.cljs$core$IFn$_invoke$arity$1(G__104803) : fexpr__104802.call(null,G__104803));
})();
var cr104474_place_147 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr104474_place_143,cr104474_place_146]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr104474_place_148 = add_log_fn;
var cr104474_place_149 = cr104474_place_142;
var cr104474_place_150 = cr104474_place_147;
var cr104474_place_151 = (function (){var G__104805 = cr104474_place_149;
var G__104806 = cr104474_place_150;
var fexpr__104804 = cr104474_place_148;
return (fexpr__104804.cljs$core$IFn$_invoke$arity$2 ? fexpr__104804.cljs$core$IFn$_invoke$arity$2(G__104805,G__104806) : fexpr__104804.call(null,G__104805,G__104806));
})();
(cr104474_state[(0)] = cr104474_block_20);

(cr104474_state[(4)] = cr104474_place_151);

return cr104474_state;
}catch (e104801){var cr104474_exception = e104801;
(cr104474_state[(0)] = null);

(cr104474_state[(2)] = null);

(cr104474_state[(3)] = null);

(cr104474_state[(4)] = null);

(cr104474_state[(1)] = null);

throw cr104474_exception;
}});
var cr104474_block_7 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_7(cr104474_state){
try{var cr104474_place_48 = (cr104474_state[(4)]);
var cr104474_place_47 = (cr104474_state[(6)]);
var cr104474_place_49 = cr104474_place_48;
var cr104474_place_50 = cr104474_place_47;
var cr104474_place_51 = (cr104474_place_49 < cr104474_place_50);
var cr104474_place_52 = cr104474_place_51;
var cr104474_place_53 = null;
if(cr104474_place_52){
(cr104474_state[(0)] = cr104474_block_15);

return cr104474_state;
} else {
(cr104474_state[(0)] = cr104474_block_8);

(cr104474_state[(8)] = cr104474_place_53);

return cr104474_state;
}
}catch (e104807){var cr104474_exception = e104807;
(cr104474_state[(0)] = null);

(cr104474_state[(2)] = null);

(cr104474_state[(3)] = null);

(cr104474_state[(4)] = null);

(cr104474_state[(5)] = null);

(cr104474_state[(6)] = null);

(cr104474_state[(7)] = null);

(cr104474_state[(1)] = null);

throw cr104474_exception;
}});
var cr104474_block_9 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_9(cr104474_state){
try{var cr104474_place_59 = null;
(cr104474_state[(0)] = cr104474_block_14);

(cr104474_state[(4)] = cr104474_place_59);

return cr104474_state;
}catch (e104808){var cr104474_exception = e104808;
(cr104474_state[(0)] = null);

(cr104474_state[(2)] = null);

(cr104474_state[(3)] = null);

(cr104474_state[(8)] = null);

(cr104474_state[(4)] = null);

(cr104474_state[(1)] = null);

throw cr104474_exception;
}});
var cr104474_block_4 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_4(cr104474_state){
try{var cr104474_place_22 = (cr104474_state[(2)]);
var cr104474_place_28 = new cljs.core.Keyword(null,"asset-uuid->url","asset-uuid->url",354369294);
var cr104474_place_29 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr104474_place_30 = get_ws_create_task;
var cr104474_place_31 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr104474_place_32 = "get-assets-download-urls";
var cr104474_place_33 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr104474_place_34 = graph_uuid;
var cr104474_place_35 = new cljs.core.Keyword(null,"asset-uuids","asset-uuids",-783416816);
var cr104474_place_36 = cljs.core.keys;
var cr104474_place_37 = cr104474_place_22;
var cr104474_place_38 = (function (){var G__104811 = cr104474_place_37;
var fexpr__104810 = cr104474_place_36;
return (fexpr__104810.cljs$core$IFn$_invoke$arity$1 ? fexpr__104810.cljs$core$IFn$_invoke$arity$1(G__104811) : fexpr__104810.call(null,G__104811));
})();
var cr104474_place_39 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr104474_place_31,cr104474_place_32,cr104474_place_35,cr104474_place_38,cr104474_place_33,cr104474_place_34]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr104474_place_40 = (function (){var G__104813 = cr104474_place_30;
var G__104814 = cr104474_place_39;
var fexpr__104812 = cr104474_place_29;
return (fexpr__104812.cljs$core$IFn$_invoke$arity$2 ? fexpr__104812.cljs$core$IFn$_invoke$arity$2(G__104813,G__104814) : fexpr__104812.call(null,G__104813,G__104814));
})();
(cr104474_state[(0)] = cr104474_block_5);

(cr104474_state[(5)] = cr104474_place_28);

return missionary.core.park(cr104474_place_40);
}catch (e104809){var cr104474_exception = e104809;
(cr104474_state[(0)] = null);

(cr104474_state[(2)] = null);

(cr104474_state[(3)] = null);

(cr104474_state[(1)] = null);

(cr104474_state[(4)] = null);

throw cr104474_exception;
}});
var cr104474_block_17 = (function frontend$worker$rtc$asset$new_task__pull_remote_asset_updates_$_cr104474_block_17(cr104474_state){
try{var cr104474_place_26 = (cr104474_state[(3)]);
var cr104474_place_53 = (cr104474_state[(8)]);
var cr104474_place_137 = cljs.core.seq;
var cr104474_place_138 = cr104474_place_26;
var cr104474_place_139 = (function (){var G__104817 = cr104474_place_138;
var fexpr__104816 = cr104474_place_137;
return (fexpr__104816.cljs$core$IFn$_invoke$arity$1 ? fexpr__104816.cljs$core$IFn$_invoke$arity$1(G__104817) : fexpr__104816.call(null,G__104817));
})();
var cr104474_place_140 = null;
if(cljs.core.truth_(cr104474_place_139)){
(cr104474_state[(0)] = cr104474_block_19);

(cr104474_state[(8)] = null);

(cr104474_state[(4)] = cr104474_place_140);

return cr104474_state;
} else {
(cr104474_state[(0)] = cr104474_block_18);

(cr104474_state[(8)] = null);

(cr104474_state[(4)] = cr104474_place_140);

return cr104474_state;
}
}catch (e104815){var cr104474_exception = e104815;
(cr104474_state[(0)] = null);

(cr104474_state[(2)] = null);

(cr104474_state[(3)] = null);

(cr104474_state[(8)] = null);

(cr104474_state[(1)] = null);

throw cr104474_exception;
}});
return cloroutine.impl.coroutine((function (){var G__104818 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((9));
(G__104818[(0)] = cr104474_block_0);

return G__104818;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.asset.get_all_asset_blocks = (function frontend$worker$rtc$asset$get_all_asset_blocks(db){
var G__104819 = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098),new cljs.core.Keyword("logseq.property.asset","checksum","logseq.property.asset/checksum",-1011416979)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098)], null)], null);
var G__104820 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__104819,G__104820) : datascript.core.q.call(null,G__104819,G__104820));
});
frontend.worker.rtc.asset.new_task__initial_download_missing_assets = (function frontend$worker$rtc$asset$new_task__initial_download_missing_assets(repo,get_ws_create_task,graph_uuid,conn,add_log_fn){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr104821_block_0 = (function frontend$worker$rtc$asset$new_task__initial_download_missing_assets_$_cr104821_block_0(cr104821_state){
try{var cr104821_place_0 = frontend.common.missionary._LT__BANG_;
var cr104821_place_1 = frontend.worker.state._LT_invoke_main_thread;
var cr104821_place_2 = new cljs.core.Keyword("thread-api","get-all-asset-file-paths","thread-api/get-all-asset-file-paths",-1018236719);
var cr104821_place_3 = repo;
var cr104821_place_4 = (function (){var G__104874 = cr104821_place_2;
var G__104875 = cr104821_place_3;
var fexpr__104873 = cr104821_place_1;
return (fexpr__104873.cljs$core$IFn$_invoke$arity$2 ? fexpr__104873.cljs$core$IFn$_invoke$arity$2(G__104874,G__104875) : fexpr__104873.call(null,G__104874,G__104875));
})();
var cr104821_place_5 = (function (){var G__104877 = cr104821_place_4;
var fexpr__104876 = cr104821_place_0;
return (fexpr__104876.cljs$core$IFn$_invoke$arity$1 ? fexpr__104876.cljs$core$IFn$_invoke$arity$1(G__104877) : fexpr__104876.call(null,G__104877));
})();
(cr104821_state[(0)] = cr104821_block_1);

return missionary.core.park(cr104821_place_5);
}catch (e104872){var cr104821_exception = e104872;
(cr104821_state[(0)] = null);

throw cr104821_exception;
}});
var cr104821_block_1 = (function frontend$worker$rtc$asset$new_task__initial_download_missing_assets_$_cr104821_block_1(cr104821_state){
try{var cr104821_place_6 = missionary.core.unpark();
var cr104821_place_7 = cljs.core.set;
var cr104821_place_8 = cljs.core.map;
var cr104821_place_9 = cljs.core.comp;
var cr104821_place_10 = cljs.core.parse_uuid;
var cr104821_place_11 = logseq.common.path.file_stem;
var cr104821_place_12 = (function (){var G__104880 = cr104821_place_10;
var G__104881 = cr104821_place_11;
var fexpr__104879 = cr104821_place_9;
return (fexpr__104879.cljs$core$IFn$_invoke$arity$2 ? fexpr__104879.cljs$core$IFn$_invoke$arity$2(G__104880,G__104881) : fexpr__104879.call(null,G__104880,G__104881));
})();
var cr104821_place_13 = cr104821_place_6;
var cr104821_place_14 = (function (){var G__104883 = cr104821_place_12;
var G__104884 = cr104821_place_13;
var fexpr__104882 = cr104821_place_8;
return (fexpr__104882.cljs$core$IFn$_invoke$arity$2 ? fexpr__104882.cljs$core$IFn$_invoke$arity$2(G__104883,G__104884) : fexpr__104882.call(null,G__104883,G__104884));
})();
var cr104821_place_15 = (function (){var G__104886 = cr104821_place_14;
var fexpr__104885 = cr104821_place_7;
return (fexpr__104885.cljs$core$IFn$_invoke$arity$1 ? fexpr__104885.cljs$core$IFn$_invoke$arity$1(G__104886) : fexpr__104885.call(null,G__104886));
})();
var cr104821_place_16 = cljs.core.set;
var cr104821_place_17 = cljs.core.map;
var cr104821_place_18 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552);
var cr104821_place_19 = frontend.worker.rtc.asset.get_all_asset_blocks;
var cr104821_place_20 = cljs.core.deref;
var cr104821_place_21 = conn;
var cr104821_place_22 = (function (){var G__104888 = cr104821_place_21;
var fexpr__104887 = cr104821_place_20;
return (fexpr__104887.cljs$core$IFn$_invoke$arity$1 ? fexpr__104887.cljs$core$IFn$_invoke$arity$1(G__104888) : fexpr__104887.call(null,G__104888));
})();
var cr104821_place_23 = (function (){var G__104890 = cr104821_place_22;
var fexpr__104889 = cr104821_place_19;
return (fexpr__104889.cljs$core$IFn$_invoke$arity$1 ? fexpr__104889.cljs$core$IFn$_invoke$arity$1(G__104890) : fexpr__104889.call(null,G__104890));
})();
var cr104821_place_24 = (function (){var G__104892 = cr104821_place_18;
var G__104893 = cr104821_place_23;
var fexpr__104891 = cr104821_place_17;
return (fexpr__104891.cljs$core$IFn$_invoke$arity$2 ? fexpr__104891.cljs$core$IFn$_invoke$arity$2(G__104892,G__104893) : fexpr__104891.call(null,G__104892,G__104893));
})();
var cr104821_place_25 = (function (){var G__104895 = cr104821_place_24;
var fexpr__104894 = cr104821_place_16;
return (fexpr__104894.cljs$core$IFn$_invoke$arity$1 ? fexpr__104894.cljs$core$IFn$_invoke$arity$1(G__104895) : fexpr__104894.call(null,G__104895));
})();
var cr104821_place_26 = cljs.core.not_empty;
var cr104821_place_27 = cljs.core.map;
var cr104821_place_28 = (function (asset_uuid){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),asset_uuid,new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"update-asset","update-asset",501550582)], null);
});
var cr104821_place_29 = clojure.set.difference;
var cr104821_place_30 = cr104821_place_25;
var cr104821_place_31 = cr104821_place_15;
var cr104821_place_32 = (function (){var G__104897 = cr104821_place_30;
var G__104898 = cr104821_place_31;
var fexpr__104896 = cr104821_place_29;
return (fexpr__104896.cljs$core$IFn$_invoke$arity$2 ? fexpr__104896.cljs$core$IFn$_invoke$arity$2(G__104897,G__104898) : fexpr__104896.call(null,G__104897,G__104898));
})();
var cr104821_place_33 = (function (){var G__104900 = cr104821_place_28;
var G__104901 = cr104821_place_32;
var fexpr__104899 = cr104821_place_27;
return (fexpr__104899.cljs$core$IFn$_invoke$arity$2 ? fexpr__104899.cljs$core$IFn$_invoke$arity$2(G__104900,G__104901) : fexpr__104899.call(null,G__104900,G__104901));
})();
var cr104821_place_34 = (function (){var G__104903 = cr104821_place_33;
var fexpr__104902 = cr104821_place_26;
return (fexpr__104902.cljs$core$IFn$_invoke$arity$1 ? fexpr__104902.cljs$core$IFn$_invoke$arity$1(G__104903) : fexpr__104902.call(null,G__104903));
})();
var cr104821_place_35 = cr104821_place_34;
var cr104821_place_36 = null;
if(cljs.core.truth_(cr104821_place_35)){
(cr104821_state[(0)] = cr104821_block_3);

(cr104821_state[(1)] = cr104821_place_36);

(cr104821_state[(2)] = cr104821_place_34);

return cr104821_state;
} else {
(cr104821_state[(0)] = cr104821_block_2);

(cr104821_state[(1)] = cr104821_place_36);

return cr104821_state;
}
}catch (e104878){var cr104821_exception = e104878;
(cr104821_state[(0)] = null);

throw cr104821_exception;
}});
var cr104821_block_2 = (function frontend$worker$rtc$asset$new_task__initial_download_missing_assets_$_cr104821_block_2(cr104821_state){
try{var cr104821_place_37 = null;
(cr104821_state[(0)] = cr104821_block_5);

(cr104821_state[(1)] = cr104821_place_37);

return cr104821_state;
}catch (e104904){var cr104821_exception = e104904;
(cr104821_state[(0)] = null);

(cr104821_state[(1)] = null);

throw cr104821_exception;
}});
var cr104821_block_3 = (function frontend$worker$rtc$asset$new_task__initial_download_missing_assets_$_cr104821_block_3(cr104821_state){
try{var cr104821_place_34 = (cr104821_state[(2)]);
var cr104821_place_38 = cr104821_place_34;
var cr104821_place_39 = new cljs.core.Keyword("rtc.asset.log","initial-download-missing-assets","rtc.asset.log/initial-download-missing-assets",506527421);
var cr104821_place_40 = new cljs.core.Keyword(null,"count","count",2139924085);
var cr104821_place_41 = cljs.core.count;
var cr104821_place_42 = cr104821_place_38;
var cr104821_place_43 = (function (){var G__104907 = cr104821_place_42;
var fexpr__104906 = cr104821_place_41;
return (fexpr__104906.cljs$core$IFn$_invoke$arity$1 ? fexpr__104906.cljs$core$IFn$_invoke$arity$1(G__104907) : fexpr__104906.call(null,G__104907));
})();
var cr104821_place_44 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr104821_place_40,cr104821_place_43]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr104821_place_45 = add_log_fn;
var cr104821_place_46 = cr104821_place_39;
var cr104821_place_47 = cr104821_place_44;
var cr104821_place_48 = (function (){var G__104909 = cr104821_place_46;
var G__104910 = cr104821_place_47;
var fexpr__104908 = cr104821_place_45;
return (fexpr__104908.cljs$core$IFn$_invoke$arity$2 ? fexpr__104908.cljs$core$IFn$_invoke$arity$2(G__104909,G__104910) : fexpr__104908.call(null,G__104909,G__104910));
})();
var cr104821_place_49 = frontend.worker.rtc.asset.new_task__pull_remote_asset_updates;
var cr104821_place_50 = repo;
var cr104821_place_51 = get_ws_create_task;
var cr104821_place_52 = conn;
var cr104821_place_53 = graph_uuid;
var cr104821_place_54 = add_log_fn;
var cr104821_place_55 = cr104821_place_38;
var cr104821_place_56 = (function (){var G__104912 = cr104821_place_50;
var G__104913 = cr104821_place_51;
var G__104914 = cr104821_place_52;
var G__104915 = cr104821_place_53;
var G__104916 = cr104821_place_54;
var G__104917 = cr104821_place_55;
var fexpr__104911 = cr104821_place_49;
return (fexpr__104911.cljs$core$IFn$_invoke$arity$6 ? fexpr__104911.cljs$core$IFn$_invoke$arity$6(G__104912,G__104913,G__104914,G__104915,G__104916,G__104917) : fexpr__104911.call(null,G__104912,G__104913,G__104914,G__104915,G__104916,G__104917));
})();
(cr104821_state[(0)] = cr104821_block_4);

(cr104821_state[(2)] = null);

return missionary.core.park(cr104821_place_56);
}catch (e104905){var cr104821_exception = e104905;
(cr104821_state[(0)] = null);

(cr104821_state[(1)] = null);

(cr104821_state[(2)] = null);

throw cr104821_exception;
}});
var cr104821_block_4 = (function frontend$worker$rtc$asset$new_task__initial_download_missing_assets_$_cr104821_block_4(cr104821_state){
try{var cr104821_place_57 = missionary.core.unpark();
(cr104821_state[(0)] = cr104821_block_5);

(cr104821_state[(1)] = cr104821_place_57);

return cr104821_state;
}catch (e104918){var cr104821_exception = e104918;
(cr104821_state[(0)] = null);

(cr104821_state[(1)] = null);

throw cr104821_exception;
}});
var cr104821_block_5 = (function frontend$worker$rtc$asset$new_task__initial_download_missing_assets_$_cr104821_block_5(cr104821_state){
try{var cr104821_place_36 = (cr104821_state[(1)]);
(cr104821_state[(0)] = null);

(cr104821_state[(1)] = null);

return cr104821_place_36;
}catch (e104919){var cr104821_exception = e104919;
(cr104821_state[(0)] = null);

(cr104821_state[(1)] = null);

throw cr104821_exception;
}});
return cloroutine.impl.coroutine((function (){var G__104920 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__104920[(0)] = cr104821_block_0);

return G__104920;
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
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"onstarted-task","onstarted-task",750035798),started_dfv,new cljs.core.Keyword(null,"assets-sync-loop-task","assets-sync-loop-task",1231956523),frontend.worker.rtc.asset.holding_assets_sync_lock(started_dfv,cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr104921_block_6 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr104921_block_6(cr104921_state){
try{var cr104921_place_51 = null;
(cr104921_state[(0)] = cr104921_block_8);

(cr104921_state[(4)] = cr104921_place_51);

return cr104921_state;
}catch (e105081){var cr104921_exception = e105081;
(cr104921_state[(0)] = cr104921_block_11);

(cr104921_state[(3)] = null);

(cr104921_state[(4)] = null);

(cr104921_state[(1)] = true);

(cr104921_state[(2)] = cr104921_exception);

return cr104921_state;
}});
var cr104921_block_8 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr104921_block_8(cr104921_state){
try{var cr104921_place_50 = (cr104921_state[(4)]);
(cr104921_state[(0)] = cr104921_block_10);

(cr104921_state[(4)] = null);

(cr104921_state[(3)] = cr104921_place_50);

return cr104921_state;
}catch (e105082){var cr104921_exception = e105082;
(cr104921_state[(0)] = cr104921_block_11);

(cr104921_state[(3)] = null);

(cr104921_state[(4)] = null);

(cr104921_state[(1)] = true);

(cr104921_state[(2)] = cr104921_exception);

return cr104921_state;
}});
var cr104921_block_4 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr104921_block_4(cr104921_state){
try{var cr104921_place_0 = (cr104921_state[(2)]);
var cr104921_place_45 = cr104921_place_0;
var cr104921_place_46 = missionary.Cancelled;
var cr104921_place_47 = (cr104921_place_45 instanceof cr104921_place_46);
var cr104921_place_48 = null;
if(cr104921_place_47){
(cr104921_state[(0)] = cr104921_block_9);

return cr104921_state;
} else {
(cr104921_state[(0)] = cr104921_block_5);

(cr104921_state[(3)] = cr104921_place_48);

return cr104921_state;
}
}catch (e105083){var cr104921_exception = e105083;
(cr104921_state[(0)] = cr104921_block_11);

(cr104921_state[(1)] = true);

(cr104921_state[(2)] = cr104921_exception);

return cr104921_state;
}});
var cr104921_block_1 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr104921_block_1(cr104921_state){
try{var cr104921_place_2 = started_dfv;
var cr104921_place_3 = true;
var cr104921_place_4 = (function (){var G__105086 = cr104921_place_3;
var fexpr__105085 = cr104921_place_2;
return (fexpr__105085.cljs$core$IFn$_invoke$arity$1 ? fexpr__105085.cljs$core$IFn$_invoke$arity$1(G__105086) : fexpr__105085.call(null,G__105086));
})();
var cr104921_place_5 = frontend.worker.rtc.asset.new_task__initial_download_missing_assets;
var cr104921_place_6 = repo;
var cr104921_place_7 = get_ws_create_task;
var cr104921_place_8 = graph_uuid;
var cr104921_place_9 = conn;
var cr104921_place_10 = add_log_fn;
var cr104921_place_11 = (function (){var G__105088 = cr104921_place_6;
var G__105089 = cr104921_place_7;
var G__105090 = cr104921_place_8;
var G__105091 = cr104921_place_9;
var G__105092 = cr104921_place_10;
var fexpr__105087 = cr104921_place_5;
return (fexpr__105087.cljs$core$IFn$_invoke$arity$5 ? fexpr__105087.cljs$core$IFn$_invoke$arity$5(G__105088,G__105089,G__105090,G__105091,G__105092) : fexpr__105087.call(null,G__105088,G__105089,G__105090,G__105091,G__105092));
})();
(cr104921_state[(0)] = cr104921_block_2);

return missionary.core.park(cr104921_place_11);
}catch (e105084){var cr104921_exception = e105084;
(cr104921_state[(0)] = cr104921_block_4);

(cr104921_state[(2)] = cr104921_exception);

return cr104921_state;
}});
var cr104921_block_0 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr104921_block_0(cr104921_state){
try{var cr104921_place_0 = null;
var cr104921_place_1 = false;
(cr104921_state[(0)] = cr104921_block_1);

(cr104921_state[(2)] = cr104921_place_0);

(cr104921_state[(1)] = cr104921_place_1);

return cr104921_state;
}catch (e105093){var cr104921_exception = e105093;
(cr104921_state[(0)] = null);

throw cr104921_exception;
}});
var cr104921_block_10 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr104921_block_10(cr104921_state){
try{var cr104921_place_48 = (cr104921_state[(3)]);
(cr104921_state[(0)] = cr104921_block_11);

(cr104921_state[(3)] = null);

(cr104921_state[(2)] = cr104921_place_48);

return cr104921_state;
}catch (e105094){var cr104921_exception = e105094;
(cr104921_state[(0)] = cr104921_block_11);

(cr104921_state[(3)] = null);

(cr104921_state[(1)] = true);

(cr104921_state[(2)] = cr104921_exception);

return cr104921_state;
}});
var cr104921_block_7 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr104921_block_7(cr104921_state){
try{var cr104921_place_0 = (cr104921_state[(2)]);
var cr104921_place_52 = cr104921_place_0;
var cr104921_place_53 = (function(){throw cr104921_place_52})();
(cr104921_state[(0)] = null);

(cr104921_state[(1)] = null);

(cr104921_state[(2)] = null);

return null;
}catch (e105095){var cr104921_exception = e105095;
(cr104921_state[(0)] = cr104921_block_11);

(cr104921_state[(1)] = true);

(cr104921_state[(2)] = cr104921_exception);

return cr104921_state;
}});
var cr104921_block_11 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr104921_block_11(cr104921_state){
try{var cr104921_place_1 = (cr104921_state[(1)]);
var cr104921_place_0 = (cr104921_state[(2)]);
var cr104921_place_61 = (cljs.core.truth_(cr104921_place_1)?(function(){throw cr104921_place_0})():cr104921_place_0);
(cr104921_state[(0)] = null);

(cr104921_state[(1)] = null);

(cr104921_state[(2)] = null);

return cr104921_place_61;
}catch (e105096){var cr104921_exception = e105096;
(cr104921_state[(0)] = null);

(cr104921_state[(1)] = null);

(cr104921_state[(2)] = null);

throw cr104921_exception;
}});
var cr104921_block_3 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr104921_block_3(cr104921_state){
try{var cr104921_place_44 = missionary.core.unpark();
(cr104921_state[(0)] = cr104921_block_11);

(cr104921_state[(2)] = cr104921_place_44);

return cr104921_state;
}catch (e105097){var cr104921_exception = e105097;
(cr104921_state[(0)] = cr104921_block_4);

(cr104921_state[(2)] = cr104921_exception);

return cr104921_state;
}});
var cr104921_block_9 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr104921_block_9(cr104921_state){
try{var cr104921_place_0 = (cr104921_state[(2)]);
var cr104921_place_54 = cr104921_place_0;
var cr104921_place_55 = add_log_fn;
var cr104921_place_56 = new cljs.core.Keyword("rtc.asset.log","cancelled","rtc.asset.log/cancelled",-1880021289);
var cr104921_place_57 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr104921_place_58 = cr104921_place_55(cr104921_place_56,cr104921_place_57);
var cr104921_place_59 = cr104921_place_54;
var cr104921_place_60 = (function(){throw cr104921_place_59})();
(cr104921_state[(0)] = null);

(cr104921_state[(1)] = null);

(cr104921_state[(2)] = null);

return null;
}catch (e105098){var cr104921_exception = e105098;
(cr104921_state[(0)] = cr104921_block_11);

(cr104921_state[(1)] = true);

(cr104921_state[(2)] = cr104921_exception);

return cr104921_state;
}});
var cr104921_block_5 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr104921_block_5(cr104921_state){
try{var cr104921_place_49 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr104921_place_50 = null;
if(cljs.core.truth_(cr104921_place_49)){
(cr104921_state[(0)] = cr104921_block_7);

(cr104921_state[(3)] = null);

return cr104921_state;
} else {
(cr104921_state[(0)] = cr104921_block_6);

(cr104921_state[(4)] = cr104921_place_50);

return cr104921_state;
}
}catch (e105099){var cr104921_exception = e105099;
(cr104921_state[(0)] = cr104921_block_11);

(cr104921_state[(3)] = null);

(cr104921_state[(1)] = true);

(cr104921_state[(2)] = cr104921_exception);

return cr104921_state;
}});
var cr104921_block_2 = (function frontend$worker$rtc$asset$create_assets_sync_loop_$_cr104921_block_2(cr104921_state){
try{var cr104921_place_12 = missionary.core.unpark();
var cr104921_place_13 = missionary.core.reduce;
var cr104921_place_14 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr104921_place_15 = null;
var cr104921_place_16 = cljs.core.partial;
var cr104921_place_22 = (function (cr104923_state){
try{var cr104923_place_32 = missionary.core.unpark();
(cr104923_state[(0)] = cr104921_place_23);

(cr104923_state[(1)] = cr104923_place_32);

return cr104923_state;
}catch (e105132){var e104961 = e105132;
var cr104923_exception = e104961;
(cr104923_state[(0)] = null);

(cr104923_state[(2)] = null);

(cr104923_state[(1)] = null);

throw cr104923_exception;
}});
var cr104921_place_27 = (function (cr104923_state){
try{var cr104923_place_2 = missionary.core.unpark();
var cr104923_place_3 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr104923_place_4 = cr104923_place_2;
var cr104923_place_5 = cr104923_place_3.cljs$core$IFn$_invoke$arity$1(cr104923_place_4);
var cr104923_place_6 = cr104923_place_5;
var cr104923_place_7 = cljs.core.Keyword;
var cr104923_place_8 = (cr104923_place_6 instanceof cr104923_place_7);
var cr104923_place_9 = null;
if(cr104923_place_8){
(cr104923_state[(0)] = cr104921_place_21);

(cr104923_state[(1)] = cr104923_place_2);

(cr104923_state[(3)] = cr104923_place_5);

(cr104923_state[(2)] = cr104923_place_9);

return cr104923_state;
} else {
(cr104923_state[(0)] = cr104921_place_20);

(cr104923_state[(1)] = cr104923_place_2);

(cr104923_state[(2)] = cr104923_place_9);

return cr104923_state;
}
}catch (e105133){var e104976 = e105133;
var cr104923_exception = e104976;
(cr104923_state[(0)] = null);

throw cr104923_exception;
}});
var cr104921_place_21 = (function (cr104923_state){
try{var cr104923_place_5 = (cr104923_state[(3)]);
var cr104923_place_11 = cr104923_place_5;
var cr104923_place_12 = cr104923_place_11.fqn;
(cr104923_state[(0)] = cr104921_place_24);

(cr104923_state[(3)] = null);

(cr104923_state[(2)] = cr104923_place_12);

return cr104923_state;
}catch (e105134){var e104960 = e105134;
var cr104923_exception = e104960;
(cr104923_state[(0)] = null);

(cr104923_state[(1)] = null);

(cr104923_state[(3)] = null);

(cr104923_state[(2)] = null);

throw cr104923_exception;
}});
var cr104921_place_28 = (function (cr104923_state){
try{var cr104923_place_14 = (cr104923_state[(2)]);
(cr104923_state[(0)] = null);

(cr104923_state[(2)] = null);

return cr104923_place_14;
}catch (e105135){var e104977 = e105135;
var cr104923_exception = e104977;
(cr104923_state[(0)] = null);

(cr104923_state[(2)] = null);

throw cr104923_exception;
}});
var cr104921_place_25 = (function (cr104923_state){
try{var cr104923_place_19 = (cr104923_state[(3)]);
var cr104923_place_23 = cr104923_place_19;
var cr104923_place_24 = frontend.worker.rtc.asset.new_task__pull_remote_asset_updates;
var cr104923_place_25 = repo;
var cr104923_place_26 = get_ws_create_task;
var cr104923_place_27 = conn;
var cr104923_place_28 = graph_uuid;
var cr104923_place_29 = add_log_fn;
var cr104923_place_30 = cr104923_place_23;
var cr104923_place_31 = (function (){var G__104967 = cr104923_place_25;
var G__104968 = cr104923_place_26;
var G__104969 = cr104923_place_27;
var G__104970 = cr104923_place_28;
var G__104971 = cr104923_place_29;
var G__104972 = cr104923_place_30;
var fexpr__104966 = cr104923_place_24;
var G__105138 = G__104967;
var G__105139 = G__104968;
var G__105140 = G__104969;
var G__105141 = G__104970;
var G__105142 = G__104971;
var G__105143 = G__104972;
var fexpr__105137 = fexpr__104966;
return (fexpr__105137.cljs$core$IFn$_invoke$arity$6 ? fexpr__105137.cljs$core$IFn$_invoke$arity$6(G__105138,G__105139,G__105140,G__105141,G__105142,G__105143) : fexpr__105137.call(null,G__105138,G__105139,G__105140,G__105141,G__105142,G__105143));
})();
(cr104923_state[(0)] = cr104921_place_22);

(cr104923_state[(3)] = null);

return missionary.core.park(cr104923_place_31);
}catch (e105136){var e104965 = e105136;
var cr104923_exception = e104965;
(cr104923_state[(0)] = null);

(cr104923_state[(3)] = null);

(cr104923_state[(2)] = null);

(cr104923_state[(1)] = null);

throw cr104923_exception;
}});
var cr104921_place_23 = (function (cr104923_state){
try{var cr104923_place_21 = (cr104923_state[(1)]);
(cr104923_state[(0)] = cr104921_place_28);

(cr104923_state[(1)] = null);

(cr104923_state[(2)] = cr104923_place_21);

return cr104923_state;
}catch (e105144){var e104962 = e105144;
var cr104923_exception = e104962;
(cr104923_state[(0)] = null);

(cr104923_state[(2)] = null);

(cr104923_state[(1)] = null);

throw cr104923_exception;
}});
var cr104921_place_18 = (function (cr104923_state){
try{var cr104923_place_22 = null;
(cr104923_state[(0)] = cr104921_place_23);

(cr104923_state[(1)] = cr104923_place_22);

return cr104923_state;
}catch (e105145){var e104957 = e105145;
var cr104923_exception = e104957;
(cr104923_state[(0)] = null);

(cr104923_state[(2)] = null);

(cr104923_state[(1)] = null);

throw cr104923_exception;
}});
var cr104921_place_17 = (function (cr104923_state){
try{var cr104923_place_9 = (cr104923_state[(2)]);
var cr104923_place_42 = "No matching clause: ";
var cr104923_place_43 = cr104923_place_9;
var cr104923_place_44 = [cr104923_place_42,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr104923_place_43)].join('');
var cr104923_place_45 = (new Error(cr104923_place_44));
var cr104923_place_46 = (function(){throw cr104923_place_45})();
(cr104923_state[(0)] = null);

(cr104923_state[(2)] = null);

return null;
}catch (e105146){var e104956 = e105146;
var cr104923_exception = e104956;
(cr104923_state[(0)] = null);

(cr104923_state[(2)] = null);

throw cr104923_exception;
}});
var cr104921_place_30 = (function (cr104923_state){
try{var cr104923_place_33 = frontend.worker.rtc.asset.new_task__push_local_asset_updates;
var cr104923_place_34 = repo;
var cr104923_place_35 = get_ws_create_task;
var cr104923_place_36 = conn;
var cr104923_place_37 = graph_uuid;
var cr104923_place_38 = major_schema_version;
var cr104923_place_39 = add_log_fn;
var cr104923_place_40 = (function (){var G__104981 = cr104923_place_34;
var G__104982 = cr104923_place_35;
var G__104983 = cr104923_place_36;
var G__104984 = cr104923_place_37;
var G__104985 = cr104923_place_38;
var G__104986 = cr104923_place_39;
var fexpr__104980 = cr104923_place_33;
var G__105149 = G__104981;
var G__105150 = G__104982;
var G__105151 = G__104983;
var G__105152 = G__104984;
var G__105153 = G__104985;
var G__105154 = G__104986;
var fexpr__105148 = fexpr__104980;
return (fexpr__105148.cljs$core$IFn$_invoke$arity$6 ? fexpr__105148.cljs$core$IFn$_invoke$arity$6(G__105149,G__105150,G__105151,G__105152,G__105153,G__105154) : fexpr__105148.call(null,G__105149,G__105150,G__105151,G__105152,G__105153,G__105154));
})();
(cr104923_state[(0)] = cr104921_place_19);

return missionary.core.park(cr104923_place_40);
}catch (e105147){var e104979 = e105147;
var cr104923_exception = e104979;
(cr104923_state[(0)] = null);

(cr104923_state[(2)] = null);

throw cr104923_exception;
}});
var cr104921_place_19 = (function (cr104923_state){
try{var cr104923_place_41 = missionary.core.unpark();
(cr104923_state[(0)] = cr104921_place_28);

(cr104923_state[(2)] = cr104923_place_41);

return cr104923_state;
}catch (e105155){var e104958 = e105155;
var cr104923_exception = e104958;
(cr104923_state[(0)] = null);

(cr104923_state[(2)] = null);

throw cr104923_exception;
}});
var cr104921_place_26 = (function (cr104923_state){
try{var cr104923_place_2 = (cr104923_state[(1)]);
var cr104923_place_15 = cljs.core.not_empty;
var cr104923_place_16 = new cljs.core.Keyword(null,"value","value",305978217);
var cr104923_place_17 = cr104923_place_2;
var cr104923_place_18 = cr104923_place_16.cljs$core$IFn$_invoke$arity$1(cr104923_place_17);
var cr104923_place_19 = (function (){var G__104975 = cr104923_place_18;
var fexpr__104974 = cr104923_place_15;
var G__105158 = G__104975;
var fexpr__105157 = fexpr__104974;
return (fexpr__105157.cljs$core$IFn$_invoke$arity$1 ? fexpr__105157.cljs$core$IFn$_invoke$arity$1(G__105158) : fexpr__105157.call(null,G__105158));
})();
var cr104923_place_20 = cr104923_place_19;
var cr104923_place_21 = null;
if(cljs.core.truth_(cr104923_place_20)){
(cr104923_state[(0)] = cr104921_place_25);

(cr104923_state[(1)] = null);

(cr104923_state[(3)] = cr104923_place_19);

(cr104923_state[(1)] = cr104923_place_21);

return cr104923_state;
} else {
(cr104923_state[(0)] = cr104921_place_18);

(cr104923_state[(1)] = null);

(cr104923_state[(1)] = cr104923_place_21);

return cr104923_state;
}
}catch (e105156){var e104973 = e105156;
var cr104923_exception = e104973;
(cr104923_state[(0)] = null);

(cr104923_state[(1)] = null);

(cr104923_state[(2)] = null);

throw cr104923_exception;
}});
var cr104921_place_29 = (function (cr104923_state){
try{var cr104923_place_0 = (1);
var cr104923_place_1 = mixed_flow;
(cr104923_state[(0)] = cr104921_place_27);

return missionary.core.fork(cr104923_place_0,cr104923_place_1);
}catch (e105159){var e104978 = e105159;
var cr104923_exception = e104978;
(cr104923_state[(0)] = null);

throw cr104923_exception;
}});
var cr104921_place_24 = (function (cr104923_state){
try{var cr104923_place_9 = (cr104923_state[(2)]);
var cr104923_place_13 = cr104923_place_9;
var cr104923_place_14 = null;
var G__104964 = cr104923_place_13;
var G__105161 = G__104964;
switch (G__105161) {
case "remote-updates":
(cr104923_state[(0)] = cr104921_place_26);

(cr104923_state[(2)] = null);

(cr104923_state[(2)] = cr104923_place_14);

return cr104923_state;

break;
case "local-update-check":
(cr104923_state[(0)] = cr104921_place_30);

(cr104923_state[(1)] = null);

(cr104923_state[(2)] = null);

(cr104923_state[(2)] = cr104923_place_14);

return cr104923_state;

break;
default:
(cr104923_state[(0)] = cr104921_place_17);

(cr104923_state[(1)] = null);

return cr104923_state;

}
}catch (e105160){var e104963 = e105160;
var cr104923_exception = e104963;
(cr104923_state[(0)] = null);

(cr104923_state[(1)] = null);

(cr104923_state[(2)] = null);

throw cr104923_exception;
}});
var cr104921_place_20 = (function (cr104923_state){
try{var cr104923_place_10 = null;
(cr104923_state[(0)] = cr104921_place_24);

(cr104923_state[(2)] = cr104923_place_10);

return cr104923_state;
}catch (e105162){var e104959 = e105162;
var cr104923_exception = e104959;
(cr104923_state[(0)] = null);

(cr104923_state[(1)] = null);

(cr104923_state[(2)] = null);

throw cr104923_exception;
}});
var cr104921_place_31 = cloroutine.impl.coroutine;
var cr104921_place_32 = cljs.core.object_array;
var cr104921_place_33 = (4);
var cr104921_place_34 = (function (){var G__105164 = cr104921_place_33;
var fexpr__105163 = cr104921_place_32;
return (fexpr__105163.cljs$core$IFn$_invoke$arity$1 ? fexpr__105163.cljs$core$IFn$_invoke$arity$1(G__105164) : fexpr__105163.call(null,G__105164));
})();
var cr104921_place_35 = cr104921_place_34;
var cr104921_place_36 = (0);
var cr104921_place_37 = cr104921_place_29;
var cr104921_place_38 = (cr104921_place_35[cr104921_place_36] = cr104921_place_37);
var cr104921_place_39 = cr104921_place_34;
var cr104921_place_40 = (function (){var G__105166 = cr104921_place_39;
var fexpr__105165 = cr104921_place_31;
return (fexpr__105165.cljs$core$IFn$_invoke$arity$1 ? fexpr__105165.cljs$core$IFn$_invoke$arity$1(G__105166) : fexpr__105165.call(null,G__105166));
})();
var cr104921_place_41 = missionary.core.ap_run;
var cr104921_place_42 = (function (){var G__105168 = cr104921_place_40;
var G__105169 = cr104921_place_41;
var fexpr__105167 = cr104921_place_16;
return (fexpr__105167.cljs$core$IFn$_invoke$arity$2 ? fexpr__105167.cljs$core$IFn$_invoke$arity$2(G__105168,G__105169) : fexpr__105167.call(null,G__105168,G__105169));
})();
var cr104921_place_43 = (function (){var G__105171 = cr104921_place_14;
var G__105172 = cr104921_place_15;
var G__105173 = cr104921_place_42;
var fexpr__105170 = cr104921_place_13;
return (fexpr__105170.cljs$core$IFn$_invoke$arity$3 ? fexpr__105170.cljs$core$IFn$_invoke$arity$3(G__105171,G__105172,G__105173) : fexpr__105170.call(null,G__105171,G__105172,G__105173));
})();
(cr104921_state[(0)] = cr104921_block_3);

return missionary.core.park(cr104921_place_43);
}catch (e105100){var cr104921_exception = e105100;
(cr104921_state[(0)] = cr104921_block_4);

(cr104921_state[(2)] = cr104921_exception);

return cr104921_state;
}});
return cloroutine.impl.coroutine((function (){var G__105174 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__105174[(0)] = cr104921_block_0);

return G__105174;
})());
})(),missionary.core.sp_run))], null);
});

//# sourceMappingURL=frontend.worker.rtc.asset.js.map
