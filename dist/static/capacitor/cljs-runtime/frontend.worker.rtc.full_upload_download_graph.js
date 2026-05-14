goog.provide('frontend.worker.rtc.full_upload_download_graph');
/**
 * Blocks stored in remote have some differences in format from the client's.
 *   Use this schema's coercer to decode.
 */
frontend.worker.rtc.full_upload_download_graph.normalized_remote_block_schema = new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"string","string",-1989541586),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("decode","custom","decode/custom",618185910),cljs.core.str], null)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"uuid","uuid",-2145095719),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("decode","custom","decode/custom",618185910),logseq.db.read_transit_str], null)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","order","block/order",-1429282437),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),logseq.db.frontend.malli_schema.block_order], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","valueType","db/valueType",1827971944),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"keyword","keyword",811389747)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","index","db/index",-1531680669),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"boolean","boolean",-1919418404)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("malli.core","default","malli.core/default",-1706204176),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map-of","map-of",1189682355),new cljs.core.Keyword(null,"keyword","keyword",811389747),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"any","any",1705907423),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("decode","custom","decode/custom",618185910),(function (x){
if(((cljs.core.coll_QMARK_(x)) && (cljs.core.every_QMARK_(new cljs.core.Keyword("db","id","db/id",-1388397098),x)))){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.str,new cljs.core.Keyword("db","id","db/id",-1388397098)),x);
} else {
if(cljs.core.truth_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(x))){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(x));
} else {
if(typeof x === 'string'){
return logseq.db.read_transit_str(x);
} else {
if(((cljs.core.coll_QMARK_(x)) && (cljs.core.every_QMARK_(cljs.core.string_QMARK_,x)))){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.db.read_transit_str,x);
} else {
return x;

}
}
}
}
})], null)], null)], null)], null)], null);
frontend.worker.rtc.full_upload_download_graph.normalized_remote_blocks_coercer = malli.core.coercer.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sequential","sequential",-1082983960),frontend.worker.rtc.full_upload_download_graph.normalized_remote_block_schema], null),malli.transform.transformer.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"custom","custom",340151948)], null),malli.transform.string_transformer], 0)));
frontend.worker.rtc.full_upload_download_graph.schema__GT_ref_type_attrs = (function frontend$worker$rtc$full_upload_download_graph$schema__GT_ref_type_attrs(db_schema){
return cljs.core.set(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__134192){
var vec__134193 = p__134192;
var attr_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134193,(0),null);
var attr_body_map = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134193,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079),new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(attr_body_map))){
return attr_name;
} else {
return null;
}
}),db_schema));
});
frontend.worker.rtc.full_upload_download_graph.schema__GT_card_many_attrs = (function frontend$worker$rtc$full_upload_download_graph$schema__GT_card_many_attrs(db_schema){
return cljs.core.set(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__134199){
var vec__134200 = p__134199;
var attr_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134200,(0),null);
var attr_body_map = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134200,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(attr_body_map))){
return attr_name;
} else {
return null;
}
}),db_schema));
});
frontend.worker.rtc.full_upload_download_graph.export_as_blocks = (function frontend$worker$rtc$full_upload_download_graph$export_as_blocks(var_args){
var args__5732__auto__ = [];
var len__5726__auto___136639 = arguments.length;
var i__5727__auto___136640 = (0);
while(true){
if((i__5727__auto___136640 < len__5726__auto___136639)){
args__5732__auto__.push((arguments[i__5727__auto___136640]));

var G__136641 = (i__5727__auto___136640 + (1));
i__5727__auto___136640 = G__136641;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.worker.rtc.full_upload_download_graph.export_as_blocks.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.worker.rtc.full_upload_download_graph.export_as_blocks.cljs$core$IFn$_invoke$arity$variadic = (function (db,p__134211){
var map__134212 = p__134211;
var map__134212__$1 = cljs.core.__destructure_map(map__134212);
var ignore_attr_set = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134212__$1,new cljs.core.Keyword(null,"ignore-attr-set","ignore-attr-set",1237742981));
var ignore_entity_set = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__134212__$1,new cljs.core.Keyword(null,"ignore-entity-set","ignore-entity-set",205528184));
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073));
var db_schema = (datascript.core.schema.cljs$core$IFn$_invoke$arity$1 ? datascript.core.schema.cljs$core$IFn$_invoke$arity$1(db) : datascript.core.schema.call(null,db));
var card_many_attrs = frontend.worker.rtc.full_upload_download_graph.schema__GT_card_many_attrs(db_schema);
var ref_type_attrs = frontend.worker.rtc.full_upload_download_graph.schema__GT_ref_type_attrs(db_schema);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
var G__134221 = block;
var G__134221__$1 = (cljs.core.truth_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(block))?cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__134221,new cljs.core.Keyword("db","ident","db/ident",-737096),logseq.db.read_transit_str):G__134221);
if(cljs.core.truth_(new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(block))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__134221__$1,new cljs.core.Keyword("block","order","block/order",-1429282437),logseq.db.read_transit_str);
} else {
return G__134221__$1;
}
}),cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (datoms__$1){
if(cljs.core.seq(datoms__$1)){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (r,datom){
if(((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","parent","block/parent",-918309064),null], null), null),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom))) && ((!(cljs.core.pos_int_QMARK_(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom))))))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("invalid block data",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"datom","datom",-371556090),datom], null));
} else {
}

var a = new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(datom);
if(cljs.core.contains_QMARK_(ignore_attr_set,a)){
return r;
} else {
if(((cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("db","ident","db/ident",-737096),a)) && (cljs.core.contains_QMARK_(ignore_entity_set,new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom))))){
return cljs.core.reduced(null);
} else {
var card_many_QMARK_ = cljs.core.contains_QMARK_(card_many_attrs,a);
var ref_QMARK_ = cljs.core.contains_QMARK_(ref_type_attrs,a);
var G__134236 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [ref_QMARK_,card_many_QMARK_], null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,true], null),G__134236)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(r,a,cljs.core.conj,cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom)));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,false], null),G__134236)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r,a,cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom)));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,true], null),G__134236)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(r,a,cljs.core.conj,logseq.db.write_transit_str(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom)));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,false], null),G__134236)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r,a,logseq.db.write_transit_str(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom)));
} else {
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__134236)].join('')));

}
}
}
}

}
}
}),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(cljs.core.first(datoms__$1)))], null),datoms__$1);
} else {
return null;
}
}),cljs.core.partition_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),datoms)));
}));

(frontend.worker.rtc.full_upload_download_graph.export_as_blocks.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.worker.rtc.full_upload_download_graph.export_as_blocks.cljs$lang$applyTo = (function (seq134203){
var G__134204 = cljs.core.first(seq134203);
var seq134203__$1 = cljs.core.next(seq134203);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__134204,seq134203__$1);
}));

frontend.worker.rtc.full_upload_download_graph.remove_rtc_data_in_conn_BANG_ = (function frontend$worker$rtc$full_upload_download_graph$remove_rtc_data_in_conn_BANG_(repo){
frontend.worker.rtc.client_op.reset_client_op_conn(repo);

var temp__5804__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
var G__134245 = conn;
var G__134246 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("logseq.kv","graph-uuid","logseq.kv/graph-uuid",339522676)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("logseq.kv","graph-local-tx","logseq.kv/graph-local-tx",-337271478)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("logseq.kv","remote-schema-version","logseq.kv/remote-schema-version",988970829)], null)], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(G__134245,G__134246) : datascript.core.transact_BANG_.call(null,G__134245,G__134246));
} else {
return null;
}
});
frontend.worker.rtc.full_upload_download_graph.new_task__upload_graph = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph(get_ws_create_task,repo,conn,remote_graph_name,major_schema_version){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr134252_block_3 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr134252_block_3(cr134252_state){
try{var cr134252_place_82 = missionary.core.unpark();
var cr134252_place_83 = logseq.db.write_transit_str;
var cr134252_place_84 = frontend.common.missionary._LT__BANG_;
var cr134252_place_85 = frontend.worker.crypt._LT_export_key;
var cr134252_place_86 = cr134252_place_82;
var cr134252_place_87 = (function (){var G__134832 = cr134252_place_86;
var fexpr__134831 = cr134252_place_85;
return (fexpr__134831.cljs$core$IFn$_invoke$arity$1 ? fexpr__134831.cljs$core$IFn$_invoke$arity$1(G__134832) : fexpr__134831.call(null,G__134832));
})();
var cr134252_place_88 = (function (){var G__134838 = cr134252_place_87;
var fexpr__134837 = cr134252_place_84;
return (fexpr__134837.cljs$core$IFn$_invoke$arity$1 ? fexpr__134837.cljs$core$IFn$_invoke$arity$1(G__134838) : fexpr__134837.call(null,G__134838));
})();
(cr134252_state[(0)] = cr134252_block_4);

(cr134252_state[(2)] = cr134252_place_83);

return missionary.core.park(cr134252_place_88);
}catch (e134827){var cr134252_exception = e134827;
(cr134252_state[(0)] = null);

(cr134252_state[(1)] = null);

throw cr134252_exception;
}});
var cr134252_block_10 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr134252_block_10(cr134252_state){
try{var cr134252_place_166 = null;
(cr134252_state[(0)] = cr134252_block_11);

(cr134252_state[(2)] = cr134252_place_166);

return cr134252_state;
}catch (e134841){var cr134252_exception = e134841;
(cr134252_state[(0)] = null);

(cr134252_state[(1)] = null);

(cr134252_state[(2)] = null);

(cr134252_state[(3)] = null);

throw cr134252_exception;
}});
var cr134252_block_7 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr134252_block_7(cr134252_state){
try{var cr134252_place_90 = (cr134252_state[(1)]);
var cr134252_place_107 = (cr134252_state[(2)]);
var cr134252_place_117 = cr134252_place_107;
var cr134252_place_118 = logseq.db.get_graph_schema_version;
var cr134252_place_119 = cljs.core.deref;
var cr134252_place_120 = conn;
var cr134252_place_121 = (function (){var G__134852 = cr134252_place_120;
var fexpr__134851 = cr134252_place_119;
return (fexpr__134851.cljs$core$IFn$_invoke$arity$1 ? fexpr__134851.cljs$core$IFn$_invoke$arity$1(G__134852) : fexpr__134851.call(null,G__134852));
})();
var cr134252_place_122 = (function (){var G__134854 = cr134252_place_121;
var fexpr__134853 = cr134252_place_118;
return (fexpr__134853.cljs$core$IFn$_invoke$arity$1 ? fexpr__134853.cljs$core$IFn$_invoke$arity$1(G__134854) : fexpr__134853.call(null,G__134854));
})();
var cr134252_place_123 = logseq.db.transact_BANG_;
var cr134252_place_124 = conn;
var cr134252_place_125 = logseq.db.kv;
var cr134252_place_126 = new cljs.core.Keyword("logseq.kv","graph-uuid","logseq.kv/graph-uuid",339522676);
var cr134252_place_127 = cr134252_place_117;
var cr134252_place_128 = (function (){var G__134856 = cr134252_place_126;
var G__134857 = cr134252_place_127;
var fexpr__134855 = cr134252_place_125;
return (fexpr__134855.cljs$core$IFn$_invoke$arity$2 ? fexpr__134855.cljs$core$IFn$_invoke$arity$2(G__134856,G__134857) : fexpr__134855.call(null,G__134856,G__134857));
})();
var cr134252_place_129 = logseq.db.kv;
var cr134252_place_130 = new cljs.core.Keyword("logseq.kv","graph-local-tx","logseq.kv/graph-local-tx",-337271478);
var cr134252_place_131 = "0";
var cr134252_place_132 = (function (){var G__134864 = cr134252_place_130;
var G__134865 = cr134252_place_131;
var fexpr__134863 = cr134252_place_129;
return (fexpr__134863.cljs$core$IFn$_invoke$arity$2 ? fexpr__134863.cljs$core$IFn$_invoke$arity$2(G__134864,G__134865) : fexpr__134863.call(null,G__134864,G__134865));
})();
var cr134252_place_133 = logseq.db.kv;
var cr134252_place_134 = new cljs.core.Keyword("logseq.kv","remote-schema-version","logseq.kv/remote-schema-version",988970829);
var cr134252_place_135 = cr134252_place_122;
var cr134252_place_136 = (function (){var G__134871 = cr134252_place_134;
var G__134872 = cr134252_place_135;
var fexpr__134870 = cr134252_place_133;
return (fexpr__134870.cljs$core$IFn$_invoke$arity$2 ? fexpr__134870.cljs$core$IFn$_invoke$arity$2(G__134871,G__134872) : fexpr__134870.call(null,G__134871,G__134872));
})();
var cr134252_place_137 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr134252_place_128,cr134252_place_132,cr134252_place_136], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr134252_place_138 = (function (){var G__134874 = cr134252_place_124;
var G__134875 = cr134252_place_137;
var fexpr__134873 = cr134252_place_123;
return (fexpr__134873.cljs$core$IFn$_invoke$arity$2 ? fexpr__134873.cljs$core$IFn$_invoke$arity$2(G__134874,G__134875) : fexpr__134873.call(null,G__134874,G__134875));
})();
var cr134252_place_139 = frontend.worker.rtc.client_op.update_graph_uuid;
var cr134252_place_140 = repo;
var cr134252_place_141 = cr134252_place_117;
var cr134252_place_142 = (function (){var G__134882 = cr134252_place_140;
var G__134883 = cr134252_place_141;
var fexpr__134881 = cr134252_place_139;
return (fexpr__134881.cljs$core$IFn$_invoke$arity$2 ? fexpr__134881.cljs$core$IFn$_invoke$arity$2(G__134882,G__134883) : fexpr__134881.call(null,G__134882,G__134883));
})();
var cr134252_place_143 = frontend.worker.rtc.client_op.remove_local_tx;
var cr134252_place_144 = repo;
var cr134252_place_145 = (function (){var G__134887 = cr134252_place_144;
var fexpr__134886 = cr134252_place_143;
return (fexpr__134886.cljs$core$IFn$_invoke$arity$1 ? fexpr__134886.cljs$core$IFn$_invoke$arity$1(G__134887) : fexpr__134886.call(null,G__134887));
})();
var cr134252_place_146 = frontend.worker.rtc.client_op.add_all_exists_asset_as_ops;
var cr134252_place_147 = repo;
var cr134252_place_148 = (function (){var G__134889 = cr134252_place_147;
var fexpr__134888 = cr134252_place_146;
return (fexpr__134888.cljs$core$IFn$_invoke$arity$1 ? fexpr__134888.cljs$core$IFn$_invoke$arity$1(G__134889) : fexpr__134888.call(null,G__134889));
})();
var cr134252_place_149 = frontend.worker.crypt.store_graph_keys_jwk;
var cr134252_place_150 = repo;
var cr134252_place_151 = cr134252_place_90;
var cr134252_place_152 = (function (){var G__134895 = cr134252_place_150;
var G__134896 = cr134252_place_151;
var fexpr__134894 = cr134252_place_149;
return (fexpr__134894.cljs$core$IFn$_invoke$arity$2 ? fexpr__134894.cljs$core$IFn$_invoke$arity$2(G__134895,G__134896) : fexpr__134894.call(null,G__134895,G__134896));
})();
var cr134252_place_153 = frontend.worker.rtc.const$.RTC_E2E_TEST;
var cr134252_place_154 = null;
if(cr134252_place_153){
(cr134252_state[(0)] = cr134252_block_10);

(cr134252_state[(1)] = null);

(cr134252_state[(2)] = null);

(cr134252_state[(1)] = cr134252_place_117);

(cr134252_state[(2)] = cr134252_place_154);

return cr134252_state;
} else {
(cr134252_state[(0)] = cr134252_block_8);

(cr134252_state[(1)] = null);

(cr134252_state[(2)] = null);

(cr134252_state[(1)] = cr134252_place_117);

(cr134252_state[(2)] = cr134252_place_154);

return cr134252_state;
}
}catch (e134845){var cr134252_exception = e134845;
(cr134252_state[(0)] = null);

(cr134252_state[(1)] = null);

(cr134252_state[(2)] = null);

(cr134252_state[(3)] = null);

throw cr134252_exception;
}});
var cr134252_block_0 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr134252_block_0(cr134252_state){
try{var cr134252_place_0 = frontend.worker.rtc.log_and_state.rtc_log;
var cr134252_place_1 = new cljs.core.Keyword("rtc.log","upload","rtc.log/upload",-1832742059);
var cr134252_place_2 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr134252_place_3 = new cljs.core.Keyword(null,"fetching-presigned-put-url","fetching-presigned-put-url",1134336471);
var cr134252_place_4 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr134252_place_5 = "fetching presigned put-url";
var cr134252_place_6 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr134252_place_4,cr134252_place_5,cr134252_place_2,cr134252_place_3]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr134252_place_7 = (function (){var G__134909 = cr134252_place_1;
var G__134910 = cr134252_place_6;
var fexpr__134908 = cr134252_place_0;
return (fexpr__134908.cljs$core$IFn$_invoke$arity$2 ? fexpr__134908.cljs$core$IFn$_invoke$arity$2(G__134909,G__134910) : fexpr__134908.call(null,G__134909,G__134910));
})();
var cr134252_place_8 = missionary.core.join;
var cr134252_place_9 = cljs.core.vector;
var cr134252_place_10 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr134252_place_11 = get_ws_create_task;
var cr134252_place_12 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr134252_place_13 = "presign-put-temp-s3-obj";
var cr134252_place_14 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr134252_place_12,cr134252_place_13]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr134252_place_15 = (function (){var G__134913 = cr134252_place_11;
var G__134914 = cr134252_place_14;
var fexpr__134912 = cr134252_place_10;
return (fexpr__134912.cljs$core$IFn$_invoke$arity$2 ? fexpr__134912.cljs$core$IFn$_invoke$arity$2(G__134913,G__134914) : fexpr__134912.call(null,G__134913,G__134914));
})();
var cr134252_place_16 = cljs.core.partial;
var cr134252_place_17 = (function (cr134259_state){
try{var cr134259_place_0 = frontend.worker.rtc.full_upload_download_graph.export_as_blocks;
var cr134259_place_1 = cljs.core.deref;
var cr134259_place_2 = conn;
var cr134259_place_3 = (function (){var G__134287 = cr134259_place_2;
var fexpr__134286 = cr134259_place_1;
var G__134941 = G__134287;
var fexpr__134940 = fexpr__134286;
return (fexpr__134940.cljs$core$IFn$_invoke$arity$1 ? fexpr__134940.cljs$core$IFn$_invoke$arity$1(G__134941) : fexpr__134940.call(null,G__134941));
})();
var cr134259_place_4 = new cljs.core.Keyword(null,"ignore-attr-set","ignore-attr-set",1237742981);
var cr134259_place_5 = frontend.worker.rtc.const$.ignore_attrs_when_init_upload;
var cr134259_place_6 = new cljs.core.Keyword(null,"ignore-entity-set","ignore-entity-set",205528184);
var cr134259_place_7 = frontend.worker.rtc.const$.ignore_entities_when_init_upload;
var cr134259_place_8 = (function (){var G__134294 = cr134259_place_3;
var G__134295 = cr134259_place_4;
var G__134296 = cr134259_place_5;
var G__134297 = cr134259_place_6;
var G__134298 = cr134259_place_7;
var fexpr__134292 = cr134259_place_0;
var G__134946 = G__134294;
var G__134947 = G__134295;
var G__134948 = G__134296;
var G__134949 = G__134297;
var G__134950 = G__134298;
var fexpr__134945 = fexpr__134292;
return (fexpr__134945.cljs$core$IFn$_invoke$arity$5 ? fexpr__134945.cljs$core$IFn$_invoke$arity$5(G__134946,G__134947,G__134948,G__134949,G__134950) : fexpr__134945.call(null,G__134946,G__134947,G__134948,G__134949,G__134950));
})();
var cr134259_place_9 = logseq.db.write_transit_str;
var cr134259_place_10 = cr134259_place_8;
var cr134259_place_11 = cr134259_place_9(cr134259_place_10);
(cr134259_state[(0)] = null);

return cr134259_place_11;
}catch (e134939){var e134285 = e134939;
var cr134259_exception = e134285;
(cr134259_state[(0)] = null);

throw cr134259_exception;
}});
var cr134252_place_18 = cloroutine.impl.coroutine;
var cr134252_place_19 = cljs.core.object_array;
var cr134252_place_20 = (1);
var cr134252_place_21 = (function (){var G__134955 = cr134252_place_20;
var fexpr__134954 = cr134252_place_19;
return (fexpr__134954.cljs$core$IFn$_invoke$arity$1 ? fexpr__134954.cljs$core$IFn$_invoke$arity$1(G__134955) : fexpr__134954.call(null,G__134955));
})();
var cr134252_place_22 = cr134252_place_21;
var cr134252_place_23 = (0);
var cr134252_place_24 = cr134252_place_17;
var cr134252_place_25 = (cr134252_place_22[cr134252_place_23] = cr134252_place_24);
var cr134252_place_26 = cr134252_place_21;
var cr134252_place_27 = (function (){var G__134957 = cr134252_place_26;
var fexpr__134956 = cr134252_place_18;
return (fexpr__134956.cljs$core$IFn$_invoke$arity$1 ? fexpr__134956.cljs$core$IFn$_invoke$arity$1(G__134957) : fexpr__134956.call(null,G__134957));
})();
var cr134252_place_28 = missionary.core.sp_run;
var cr134252_place_29 = (function (){var G__134960 = cr134252_place_27;
var G__134961 = cr134252_place_28;
var fexpr__134959 = cr134252_place_16;
return (fexpr__134959.cljs$core$IFn$_invoke$arity$2 ? fexpr__134959.cljs$core$IFn$_invoke$arity$2(G__134960,G__134961) : fexpr__134959.call(null,G__134960,G__134961));
})();
var cr134252_place_30 = (function (){var G__134963 = cr134252_place_9;
var G__134964 = cr134252_place_15;
var G__134965 = cr134252_place_29;
var fexpr__134962 = cr134252_place_8;
return (fexpr__134962.cljs$core$IFn$_invoke$arity$3 ? fexpr__134962.cljs$core$IFn$_invoke$arity$3(G__134963,G__134964,G__134965) : fexpr__134962.call(null,G__134963,G__134964,G__134965));
})();
(cr134252_state[(0)] = cr134252_block_1);

return missionary.core.park(cr134252_place_30);
}catch (e134904){var cr134252_exception = e134904;
(cr134252_state[(0)] = null);

throw cr134252_exception;
}});
var cr134252_block_4 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr134252_block_4(cr134252_state){
try{var cr134252_place_47 = (cr134252_state[(1)]);
var cr134252_place_83 = (cr134252_state[(2)]);
var cr134252_place_89 = missionary.core.unpark();
var cr134252_place_90 = cr134252_place_83(cr134252_place_89);
var cr134252_place_91 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr134252_place_92 = get_ws_create_task;
var cr134252_place_93 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr134252_place_94 = "upload-graph";
var cr134252_place_95 = new cljs.core.Keyword(null,"s3-key","s3-key",696218166);
var cr134252_place_96 = cr134252_place_47;
var cr134252_place_97 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr134252_place_98 = major_schema_version;
var cr134252_place_99 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr134252_place_98);
var cr134252_place_100 = new cljs.core.Keyword(null,"graph-name","graph-name",416773857);
var cr134252_place_101 = remote_graph_name;
var cr134252_place_102 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr134252_place_95,cr134252_place_96,cr134252_place_97,cr134252_place_99,cr134252_place_100,cr134252_place_101,cr134252_place_93,cr134252_place_94]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr134252_place_103 = (function (){var G__134971 = cr134252_place_92;
var G__134972 = cr134252_place_102;
var fexpr__134970 = cr134252_place_91;
return (fexpr__134970.cljs$core$IFn$_invoke$arity$2 ? fexpr__134970.cljs$core$IFn$_invoke$arity$2(G__134971,G__134972) : fexpr__134970.call(null,G__134971,G__134972));
})();
(cr134252_state[(0)] = cr134252_block_5);

(cr134252_state[(1)] = null);

(cr134252_state[(2)] = null);

(cr134252_state[(1)] = cr134252_place_90);

return missionary.core.park(cr134252_place_103);
}catch (e134966){var cr134252_exception = e134966;
(cr134252_state[(0)] = null);

(cr134252_state[(1)] = null);

(cr134252_state[(2)] = null);

throw cr134252_exception;
}});
var cr134252_block_6 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr134252_block_6(cr134252_state){
try{var cr134252_place_104 = (cr134252_state[(1)]);
var cr134252_place_110 = cljs.core.ex_info;
var cr134252_place_111 = "upload-graph failed";
var cr134252_place_112 = new cljs.core.Keyword(null,"upload-resp","upload-resp",-2088142426);
var cr134252_place_113 = cr134252_place_104;
var cr134252_place_114 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr134252_place_112,cr134252_place_113]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr134252_place_115 = (function (){var G__134976 = cr134252_place_111;
var G__134977 = cr134252_place_114;
var fexpr__134975 = cr134252_place_110;
return (fexpr__134975.cljs$core$IFn$_invoke$arity$2 ? fexpr__134975.cljs$core$IFn$_invoke$arity$2(G__134976,G__134977) : fexpr__134975.call(null,G__134976,G__134977));
})();
var cr134252_place_116 = (function(){throw cr134252_place_115})();
(cr134252_state[(0)] = null);

(cr134252_state[(1)] = null);

return null;
}catch (e134974){var cr134252_exception = e134974;
(cr134252_state[(0)] = null);

(cr134252_state[(1)] = null);

throw cr134252_exception;
}});
var cr134252_block_12 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr134252_block_12(cr134252_state){
try{var cr134252_place_109 = (cr134252_state[(3)]);
(cr134252_state[(0)] = null);

(cr134252_state[(3)] = null);

return cr134252_place_109;
}catch (e134979){var cr134252_exception = e134979;
(cr134252_state[(0)] = null);

(cr134252_state[(3)] = null);

throw cr134252_exception;
}});
var cr134252_block_2 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr134252_block_2(cr134252_state){
try{var cr134252_place_69 = missionary.core.unpark();
var cr134252_place_70 = frontend.worker.rtc.log_and_state.rtc_log;
var cr134252_place_71 = new cljs.core.Keyword("rtc.log","upload","rtc.log/upload",-1832742059);
var cr134252_place_72 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr134252_place_73 = new cljs.core.Keyword(null,"request-upload-graph","request-upload-graph",-887276217);
var cr134252_place_74 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr134252_place_75 = "requesting upload-graph";
var cr134252_place_76 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr134252_place_72,cr134252_place_73,cr134252_place_74,cr134252_place_75]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr134252_place_77 = (function (){var G__134985 = cr134252_place_71;
var G__134986 = cr134252_place_76;
var fexpr__134984 = cr134252_place_70;
return (fexpr__134984.cljs$core$IFn$_invoke$arity$2 ? fexpr__134984.cljs$core$IFn$_invoke$arity$2(G__134985,G__134986) : fexpr__134984.call(null,G__134985,G__134986));
})();
var cr134252_place_78 = frontend.common.missionary._LT__BANG_;
var cr134252_place_79 = frontend.worker.crypt._LT_gen_aes_key;
var cr134252_place_80 = (function (){var fexpr__134987 = cr134252_place_79;
return (fexpr__134987.cljs$core$IFn$_invoke$arity$0 ? fexpr__134987.cljs$core$IFn$_invoke$arity$0() : fexpr__134987.call(null));
})();
var cr134252_place_81 = (function (){var G__134989 = cr134252_place_80;
var fexpr__134988 = cr134252_place_78;
return (fexpr__134988.cljs$core$IFn$_invoke$arity$1 ? fexpr__134988.cljs$core$IFn$_invoke$arity$1(G__134989) : fexpr__134988.call(null,G__134989));
})();
(cr134252_state[(0)] = cr134252_block_3);

return missionary.core.park(cr134252_place_81);
}catch (e134980){var cr134252_exception = e134980;
(cr134252_state[(0)] = null);

(cr134252_state[(1)] = null);

throw cr134252_exception;
}});
var cr134252_block_5 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr134252_block_5(cr134252_state){
try{var cr134252_place_104 = missionary.core.unpark();
var cr134252_place_105 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr134252_place_106 = cr134252_place_104;
var cr134252_place_107 = cr134252_place_105.cljs$core$IFn$_invoke$arity$1(cr134252_place_106);
var cr134252_place_108 = cr134252_place_107;
var cr134252_place_109 = null;
if(cljs.core.truth_(cr134252_place_108)){
(cr134252_state[(0)] = cr134252_block_7);

(cr134252_state[(2)] = cr134252_place_107);

(cr134252_state[(3)] = cr134252_place_109);

return cr134252_state;
} else {
(cr134252_state[(0)] = cr134252_block_6);

(cr134252_state[(1)] = null);

(cr134252_state[(1)] = cr134252_place_104);

return cr134252_state;
}
}catch (e134996){var cr134252_exception = e134996;
(cr134252_state[(0)] = null);

(cr134252_state[(1)] = null);

throw cr134252_exception;
}});
var cr134252_block_9 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr134252_block_9(cr134252_state){
try{var cr134252_place_165 = missionary.core.unpark();
(cr134252_state[(0)] = cr134252_block_11);

(cr134252_state[(2)] = cr134252_place_165);

return cr134252_state;
}catch (e135000){var cr134252_exception = e135000;
(cr134252_state[(0)] = null);

(cr134252_state[(1)] = null);

(cr134252_state[(2)] = null);

(cr134252_state[(3)] = null);

throw cr134252_exception;
}});
var cr134252_block_11 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr134252_block_11(cr134252_state){
try{var cr134252_place_117 = (cr134252_state[(1)]);
var cr134252_place_154 = (cr134252_state[(2)]);
var cr134252_place_167 = frontend.worker.rtc.log_and_state.rtc_log;
var cr134252_place_168 = new cljs.core.Keyword("rtc.log","upload","rtc.log/upload",-1832742059);
var cr134252_place_169 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr134252_place_170 = new cljs.core.Keyword(null,"upload-completed","upload-completed",-769495446);
var cr134252_place_171 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr134252_place_172 = "upload-graph completed";
var cr134252_place_173 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr134252_place_171,cr134252_place_172,cr134252_place_169,cr134252_place_170]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr134252_place_174 = (function (){var G__135010 = cr134252_place_168;
var G__135011 = cr134252_place_173;
var fexpr__135009 = cr134252_place_167;
return (fexpr__135009.cljs$core$IFn$_invoke$arity$2 ? fexpr__135009.cljs$core$IFn$_invoke$arity$2(G__135010,G__135011) : fexpr__135009.call(null,G__135010,G__135011));
})();
var cr134252_place_175 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr134252_place_176 = cr134252_place_117;
var cr134252_place_177 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr134252_place_175,cr134252_place_176]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
(cr134252_state[(0)] = cr134252_block_12);

(cr134252_state[(1)] = null);

(cr134252_state[(2)] = null);

(cr134252_state[(3)] = cr134252_place_177);

return cr134252_state;
}catch (e135003){var cr134252_exception = e135003;
(cr134252_state[(0)] = null);

(cr134252_state[(1)] = null);

(cr134252_state[(2)] = null);

(cr134252_state[(3)] = null);

throw cr134252_exception;
}});
var cr134252_block_1 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr134252_block_1(cr134252_state){
try{var cr134252_place_31 = missionary.core.unpark();
var cr134252_place_32 = cljs.core.nth;
var cr134252_place_33 = cr134252_place_31;
var cr134252_place_34 = (0);
var cr134252_place_35 = null;
var cr134252_place_36 = (function (){var G__135018 = cr134252_place_33;
var G__135019 = cr134252_place_34;
var G__135020 = cr134252_place_35;
var fexpr__135017 = cr134252_place_32;
return (fexpr__135017.cljs$core$IFn$_invoke$arity$3 ? fexpr__135017.cljs$core$IFn$_invoke$arity$3(G__135018,G__135019,G__135020) : fexpr__135017.call(null,G__135018,G__135019,G__135020));
})();
var cr134252_place_37 = cljs.core.__destructure_map;
var cr134252_place_38 = cr134252_place_36;
var cr134252_place_39 = (function (){var G__135023 = cr134252_place_38;
var fexpr__135022 = cr134252_place_37;
return (fexpr__135022.cljs$core$IFn$_invoke$arity$1 ? fexpr__135022.cljs$core$IFn$_invoke$arity$1(G__135023) : fexpr__135022.call(null,G__135023));
})();
var cr134252_place_40 = cljs.core.get;
var cr134252_place_41 = cr134252_place_39;
var cr134252_place_42 = new cljs.core.Keyword(null,"url","url",276297046);
var cr134252_place_43 = (function (){var G__135028 = cr134252_place_41;
var G__135029 = cr134252_place_42;
var fexpr__135026 = cr134252_place_40;
return (fexpr__135026.cljs$core$IFn$_invoke$arity$2 ? fexpr__135026.cljs$core$IFn$_invoke$arity$2(G__135028,G__135029) : fexpr__135026.call(null,G__135028,G__135029));
})();
var cr134252_place_44 = cljs.core.get;
var cr134252_place_45 = cr134252_place_39;
var cr134252_place_46 = new cljs.core.Keyword(null,"key","key",-1516042587);
var cr134252_place_47 = (function (){var G__135031 = cr134252_place_45;
var G__135032 = cr134252_place_46;
var fexpr__135030 = cr134252_place_44;
return (fexpr__135030.cljs$core$IFn$_invoke$arity$2 ? fexpr__135030.cljs$core$IFn$_invoke$arity$2(G__135031,G__135032) : fexpr__135030.call(null,G__135031,G__135032));
})();
var cr134252_place_48 = cljs.core.nth;
var cr134252_place_49 = cr134252_place_31;
var cr134252_place_50 = (1);
var cr134252_place_51 = null;
var cr134252_place_52 = (function (){var G__135037 = cr134252_place_49;
var G__135038 = cr134252_place_50;
var G__135039 = cr134252_place_51;
var fexpr__135036 = cr134252_place_48;
return (fexpr__135036.cljs$core$IFn$_invoke$arity$3 ? fexpr__135036.cljs$core$IFn$_invoke$arity$3(G__135037,G__135038,G__135039) : fexpr__135036.call(null,G__135037,G__135038,G__135039));
})();
var cr134252_place_53 = frontend.worker.rtc.log_and_state.rtc_log;
var cr134252_place_54 = new cljs.core.Keyword("rtc.log","upload","rtc.log/upload",-1832742059);
var cr134252_place_55 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr134252_place_56 = new cljs.core.Keyword(null,"upload-data","upload-data",690295555);
var cr134252_place_57 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr134252_place_58 = "uploading data";
var cr134252_place_59 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr134252_place_57,cr134252_place_58,cr134252_place_55,cr134252_place_56]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr134252_place_60 = (function (){var G__135045 = cr134252_place_54;
var G__135046 = cr134252_place_59;
var fexpr__135044 = cr134252_place_53;
return (fexpr__135044.cljs$core$IFn$_invoke$arity$2 ? fexpr__135044.cljs$core$IFn$_invoke$arity$2(G__135045,G__135046) : fexpr__135044.call(null,G__135045,G__135046));
})();
var cr134252_place_61 = cljs_http_missionary.client.put;
var cr134252_place_62 = cr134252_place_43;
var cr134252_place_63 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr134252_place_64 = cr134252_place_52;
var cr134252_place_65 = new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222);
var cr134252_place_66 = false;
var cr134252_place_67 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr134252_place_63,cr134252_place_64,cr134252_place_65,cr134252_place_66]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr134252_place_68 = (function (){var G__135049 = cr134252_place_62;
var G__135050 = cr134252_place_67;
var fexpr__135048 = cr134252_place_61;
return (fexpr__135048.cljs$core$IFn$_invoke$arity$2 ? fexpr__135048.cljs$core$IFn$_invoke$arity$2(G__135049,G__135050) : fexpr__135048.call(null,G__135049,G__135050));
})();
(cr134252_state[(0)] = cr134252_block_2);

(cr134252_state[(1)] = cr134252_place_47);

return missionary.core.park(cr134252_place_68);
}catch (e135013){var cr134252_exception = e135013;
(cr134252_state[(0)] = null);

throw cr134252_exception;
}});
var cr134252_block_8 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr134252_block_8(cr134252_state){
try{var cr134252_place_117 = (cr134252_state[(1)]);
var cr134252_place_155 = frontend.common.missionary._LT__BANG_;
var cr134252_place_156 = frontend.worker.db_metadata._LT_store;
var cr134252_place_157 = repo;
var cr134252_place_158 = cljs.core.pr_str;
var cr134252_place_159 = new cljs.core.Keyword("kv","value","kv/value",305981670);
var cr134252_place_160 = cr134252_place_117;
var cr134252_place_161 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr134252_place_159,cr134252_place_160]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr134252_place_162 = (function (){var G__135059 = cr134252_place_161;
var fexpr__135058 = cr134252_place_158;
return (fexpr__135058.cljs$core$IFn$_invoke$arity$1 ? fexpr__135058.cljs$core$IFn$_invoke$arity$1(G__135059) : fexpr__135058.call(null,G__135059));
})();
var cr134252_place_163 = (function (){var G__135061 = cr134252_place_157;
var G__135062 = cr134252_place_162;
var fexpr__135060 = cr134252_place_156;
return (fexpr__135060.cljs$core$IFn$_invoke$arity$2 ? fexpr__135060.cljs$core$IFn$_invoke$arity$2(G__135061,G__135062) : fexpr__135060.call(null,G__135061,G__135062));
})();
var cr134252_place_164 = (function (){var G__135064 = cr134252_place_163;
var fexpr__135063 = cr134252_place_155;
return (fexpr__135063.cljs$core$IFn$_invoke$arity$1 ? fexpr__135063.cljs$core$IFn$_invoke$arity$1(G__135064) : fexpr__135063.call(null,G__135064));
})();
(cr134252_state[(0)] = cr134252_block_9);

return missionary.core.park(cr134252_place_164);
}catch (e135052){var cr134252_exception = e135052;
(cr134252_state[(0)] = null);

(cr134252_state[(1)] = null);

(cr134252_state[(2)] = null);

(cr134252_state[(3)] = null);

throw cr134252_exception;
}});
return cloroutine.impl.coroutine((function (){var G__135066 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__135066[(0)] = cr134252_block_0);

return G__135066;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.full_upload_download_graph.page_of_block = cljs.core.memoize((function (id__GT_block_map,block){
var temp__5804__auto__ = new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var parent_id = temp__5804__auto__;
var temp__5804__auto____$1 = (id__GT_block_map.cljs$core$IFn$_invoke$arity$1 ? id__GT_block_map.cljs$core$IFn$_invoke$arity$1(parent_id) : id__GT_block_map.call(null,parent_id));
if(cljs.core.truth_(temp__5804__auto____$1)){
var parent = temp__5804__auto____$1;
if(cljs.core.truth_(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(parent))){
return parent;
} else {
return (frontend.worker.rtc.full_upload_download_graph.page_of_block.cljs$core$IFn$_invoke$arity$2 ? frontend.worker.rtc.full_upload_download_graph.page_of_block.cljs$core$IFn$_invoke$arity$2(id__GT_block_map,parent) : frontend.worker.rtc.full_upload_download_graph.page_of_block.call(null,id__GT_block_map,parent));
}
} else {
return null;
}
} else {
return null;
}
}));
frontend.worker.rtc.full_upload_download_graph.fill_block_fields = (function frontend$worker$rtc$full_upload_download_graph$fill_block_fields(blocks){
var groups = cljs.core.group_by((function (p1__135070_SHARP_){
return cljs.core.boolean$(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(p1__135070_SHARP_));
}),blocks);
var other_blocks = cljs.core.set(cljs.core.get.cljs$core$IFn$_invoke$arity$2(groups,false));
var id__GT_block = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),cljs.core.identity),blocks));
var block_id__GT_page_id = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(frontend.worker.rtc.full_upload_download_graph.page_of_block(id__GT_block,b))], null);
}),other_blocks));
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (b){
var temp__5802__auto__ = (function (){var G__135075 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b);
return (block_id__GT_page_id.cljs$core$IFn$_invoke$arity$1 ? block_id__GT_page_id.cljs$core$IFn$_invoke$arity$1(G__135075) : block_id__GT_page_id.call(null,G__135075));
})();
if(cljs.core.truth_(temp__5802__auto__)){
var page_id = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword("block","page","block/page",822314108),page_id);
} else {
return b;
}
}),blocks);
});
frontend.worker.rtc.full_upload_download_graph.blocks__GT_card_one_attrs = (function frontend$worker$rtc$full_upload_download_graph$blocks__GT_card_one_attrs(blocks){
return cljs.core.set(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (block){
var temp__5804__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var db_ident = temp__5804__auto__;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","one","db.cardinality/one",1428352190),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(block))){
return db_ident;
} else {
return null;
}
} else {
return null;
}
}),blocks));
});
frontend.worker.rtc.full_upload_download_graph.convert_card_one_value_from_value_coll = (function frontend$worker$rtc$full_upload_download_graph$convert_card_one_value_from_value_coll(card_one_attrs,block){
var card_one_attrs_in_block = clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.keys(block)),card_one_attrs);
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block,cljs.core.update_vals(cljs.core.select_keys(block,card_one_attrs_in_block),(function (v){
if(((cljs.core.sequential_QMARK_(v)) || (cljs.core.set_QMARK_(v)))){
return cljs.core.first(v);
} else {
return v;
}
}))], 0));
});
frontend.worker.rtc.full_upload_download_graph.transact_remote_schema_version_BANG_ = (function frontend$worker$rtc$full_upload_download_graph$transact_remote_schema_version_BANG_(repo){
var temp__5804__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
var db = cljs.core.deref(conn);
var temp__5804__auto____$1 = new cljs.core.Keyword("kv","value","kv/value",305981670).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.kv","schema-version","logseq.kv/schema-version",-1467606676)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.kv","schema-version","logseq.kv/schema-version",-1467606676))));
if(cljs.core.truth_(temp__5804__auto____$1)){
var schema_version = temp__5804__auto____$1;
var G__135098 = conn;
var G__135099 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(logseq.db.kv.cljs$core$IFn$_invoke$arity$2 ? logseq.db.kv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.kv","remote-schema-version","logseq.kv/remote-schema-version",988970829),schema_version) : logseq.db.kv.call(null,new cljs.core.Keyword("logseq.kv","remote-schema-version","logseq.kv/remote-schema-version",988970829),schema_version))], null);
var G__135101 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"rtc-download-graph?","rtc-download-graph?",-1013530237),true,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__135098,G__135099,G__135101) : datascript.core.transact_BANG_.call(null,G__135098,G__135099,G__135101));
} else {
return null;
}
} else {
return null;
}
});
frontend.worker.rtc.full_upload_download_graph.transact_block_refs_BANG_ = (function frontend$worker$rtc$full_upload_download_graph$transact_block_refs_BANG_(repo){
var temp__5804__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
var db = cljs.core.deref(conn);
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var refs_tx = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (d){
var block = (function (){var G__135108 = cljs.core.deref(conn);
var G__135109 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__135108,G__135109) : datascript.core.entity.call(null,G__135108,G__135109));
})();
var refs = logseq.outliner.pipeline.db_rebuild_block_refs(cljs.core.deref(conn),block);
if(cljs.core.seq(refs)){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","refs","block/refs",-1214495349),refs], null);
} else {
return null;
}
}),datoms);
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,refs_tx,(function (){var G__135117 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"rtc-download-rebuild-block-refs","rtc-download-rebuild-block-refs",-672781964)], null);
if(frontend.worker.rtc.const$.RTC_E2E_TEST){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__135117,new cljs.core.Keyword("frontend.worker.pipeline","skip-store-conn","frontend.worker.pipeline/skip-store-conn",-1426692178),true);
} else {
return G__135117;
}
})());
} else {
return null;
}
});
frontend.worker.rtc.full_upload_download_graph.block__GT_schema_map = (function frontend$worker$rtc$full_upload_download_graph$block__GT_schema_map(block){
var temp__5804__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(temp__5804__auto__)){
var db_ident = temp__5804__auto__;
var value_type = new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(block);
var cardinality = new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(block);
var db_index = new cljs.core.Keyword("db","index","db/index",-1531680669).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_((function (){var or__5002__auto__ = value_type;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cardinality;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return db_index;
}
}
})())){
var G__135132 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","ident","db/ident",-737096),db_ident], null);
var G__135132__$1 = (cljs.core.truth_(value_type)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__135132,new cljs.core.Keyword("db","valueType","db/valueType",1827971944),value_type):G__135132);
var G__135132__$2 = (cljs.core.truth_(cardinality)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__135132__$1,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),cardinality):G__135132__$1);
if(cljs.core.truth_(db_index)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__135132__$2,new cljs.core.Keyword("db","index","db/index",-1531680669),db_index);
} else {
return G__135132__$2;
}
} else {
return null;
}
} else {
return null;
}
});
frontend.worker.rtc.full_upload_download_graph.blocks__GT_schema_blocks_PLUS_normal_blocks = (function frontend$worker$rtc$full_upload_download_graph$blocks__GT_schema_blocks_PLUS_normal_blocks(blocks){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p__135136,block){
var vec__135137 = p__135136;
var schema_blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135137,(0),null);
var normal_blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135137,(1),null);
var temp__5802__auto__ = frontend.worker.rtc.full_upload_download_graph.block__GT_schema_map(block);
if(cljs.core.truth_(temp__5802__auto__)){
var schema_block = temp__5802__auto__;
var strip_schema_attrs_block = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(block,new cljs.core.Keyword("db","valueType","db/valueType",1827971944),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),new cljs.core.Keyword("db","index","db/index",-1531680669)], 0));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.conj.cljs$core$IFn$_invoke$arity$2(schema_blocks,schema_block),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(normal_blocks,strip_schema_attrs_block)], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [schema_blocks,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(normal_blocks,block)], null);
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.PersistentVector.EMPTY,cljs.core.PersistentVector.EMPTY], null),blocks);
});
/**
 * it's complex to setup db-worker related stuff, when I only want to test rtc related logic
 */
frontend.worker.rtc.full_upload_download_graph.create_graph_for_rtc_test = (function frontend$worker$rtc$full_upload_download_graph$create_graph_for_rtc_test(repo,init_tx_data,other_tx_data){
var conn = (datascript.core.create_conn.cljs$core$IFn$_invoke$arity$1 ? datascript.core.create_conn.cljs$core$IFn$_invoke$arity$1(logseq.db.frontend.schema.schema) : datascript.core.create_conn.call(null,logseq.db.frontend.schema.schema));
var db_initial_data = logseq.db.sqlite.create_graph.build_db_initial_data("");
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.worker.state._STAR_datascript_conns,cljs.core.assoc,repo,conn);

var G__135153_136735 = conn;
var G__135154_136736 = db_initial_data;
var G__135155_136737 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"initial-db?","initial-db?",-930665302),true,new cljs.core.Keyword("frontend.worker.pipeline","skip-store-conn","frontend.worker.pipeline/skip-store-conn",-1426692178),frontend.worker.rtc.const$.RTC_E2E_TEST], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__135153_136735,G__135154_136736,G__135155_136737) : datascript.core.transact_BANG_.call(null,G__135153_136735,G__135154_136736,G__135155_136737));

frontend.worker.db_listener.listen_db_changes_BANG_(repo,conn);

var G__135156_136740 = conn;
var G__135157_136741 = init_tx_data;
var G__135158_136742 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"rtc-download-graph?","rtc-download-graph?",-1013530237),true,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword("frontend.worker.pipeline","skip-validate-db?","frontend.worker.pipeline/skip-validate-db?",-107248246),true,new cljs.core.Keyword("frontend.worker.pipeline","skip-store-conn","frontend.worker.pipeline/skip-store-conn",-1426692178),frontend.worker.rtc.const$.RTC_E2E_TEST,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__135156_136740,G__135157_136741,G__135158_136742) : datascript.core.transact_BANG_.call(null,G__135156_136740,G__135157_136741,G__135158_136742));

var G__135159_136743 = conn;
var G__135160_136744 = other_tx_data;
var G__135161_136745 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"rtc-download-graph?","rtc-download-graph?",-1013530237),true,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword("frontend.worker.pipeline","skip-store-conn","frontend.worker.pipeline/skip-store-conn",-1426692178),frontend.worker.rtc.const$.RTC_E2E_TEST,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__135159_136743,G__135160_136744,G__135161_136745) : datascript.core.transact_BANG_.call(null,G__135159_136743,G__135160_136744,G__135161_136745));

frontend.worker.rtc.full_upload_download_graph.transact_remote_schema_version_BANG_(repo);

return frontend.worker.rtc.full_upload_download_graph.transact_block_refs_BANG_(repo);
});
frontend.worker.rtc.full_upload_download_graph.blocks_resolve_temp_id = (function frontend$worker$rtc$full_upload_download_graph$blocks_resolve_temp_id(schema_blocks,blocks){
var uuids = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),blocks);
var idents = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),blocks);
var ids = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),blocks);
var id__GT_uuid = cljs.core.zipmap(ids,uuids);
var id__GT_ident = cljs.core.zipmap(ids,idents);
var id_tx_data = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
var uuid_SINGLEQUOTE_ = (id__GT_uuid.cljs$core$IFn$_invoke$arity$1 ? id__GT_uuid.cljs$core$IFn$_invoke$arity$1(id) : id__GT_uuid.call(null,id));
var ident = (id__GT_ident.cljs$core$IFn$_invoke$arity$1 ? id__GT_ident.cljs$core$IFn$_invoke$arity$1(id) : id__GT_ident.call(null,id));
var G__135168 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),uuid_SINGLEQUOTE_], null);
if(cljs.core.truth_(ident)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__135168,new cljs.core.Keyword("db","ident","db/ident",-737096),ident);
} else {
return G__135168;
}
}),ids);
var id_ref_exists_QMARK_ = (function (v){
var and__5000__auto__ = typeof v === 'string';
if(and__5000__auto__){
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(id__GT_ident,v);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(id__GT_uuid,v);
}
} else {
return and__5000__auto__;
}
});
var ref_k_set = cljs.core.set(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (b){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079),new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(b))){
return new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(b);
} else {
return null;
}
}),schema_blocks));
var ref_k_QMARK_ = (function (k){
return cljs.core.contains_QMARK_(ref_k_set,k);
});
var blocks_tx_data = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__135172){
var vec__135173 = p__135172;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135173,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135173,(1),null);
var v__$1 = ((ref_k_QMARK_(k))?(cljs.core.truth_(id_ref_exists_QMARK_(v))?(function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(id__GT_ident,v);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.get.cljs$core$IFn$_invoke$arity$2(id__GT_uuid,v)], null);
}
})():((((cljs.core.sequential_QMARK_(v)) && (cljs.core.every_QMARK_(id_ref_exists_QMARK_,v))))?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(id__GT_ident,id);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.get.cljs$core$IFn$_invoke$arity$2(id__GT_uuid,id)], null);
}
}),v):v
)):v);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v__$1], null);
}),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword("db","id","db/id",-1388397098))));
}),blocks);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(id_tx_data,blocks_tx_data);
});
frontend.worker.rtc.full_upload_download_graph.remote_all_blocks_EQ__GT_client_blocks = (function frontend$worker$rtc$full_upload_download_graph$remote_all_blocks_EQ__GT_client_blocks(all_blocks,ignore_attr_set,ignore_entity_set){
var map__135186 = all_blocks;
var map__135186__$1 = cljs.core.__destructure_map(map__135186);
var _ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135186__$1,new cljs.core.Keyword(null,"_","_",1453416199));
var _t = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135186__$1,new cljs.core.Keyword(null,"_t","_t",-182793705));
var blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135186__$1,new cljs.core.Keyword(null,"blocks","blocks",-610462153));
var card_one_attrs = frontend.worker.rtc.full_upload_download_graph.blocks__GT_card_one_attrs(blocks);
var blocks1 = (cljs.core.truth_(goog.DEBUG)?(function (){var k__67652__auto__ = new cljs.core.Keyword(null,"convert-card-one-value-from-value-coll","convert-card-one-value-from-value-coll",394740882);
console.time(k__67652__auto__);

var res__67653__auto__ = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(frontend.worker.rtc.full_upload_download_graph.convert_card_one_value_from_value_coll,card_one_attrs),blocks);
console.timeEnd(k__67652__auto__);

return res__67653__auto__;
})():cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(frontend.worker.rtc.full_upload_download_graph.convert_card_one_value_from_value_coll,card_one_attrs),blocks));
var blocks2 = (cljs.core.truth_(goog.DEBUG)?(function (){var k__67652__auto__ = new cljs.core.Keyword(null,"normalize-remote-blocks","normalize-remote-blocks",1366081985);
console.time(k__67652__auto__);

var res__67653__auto__ = (frontend.worker.rtc.full_upload_download_graph.normalized_remote_blocks_coercer.cljs$core$IFn$_invoke$arity$1 ? frontend.worker.rtc.full_upload_download_graph.normalized_remote_blocks_coercer.cljs$core$IFn$_invoke$arity$1(blocks1) : frontend.worker.rtc.full_upload_download_graph.normalized_remote_blocks_coercer.call(null,blocks1));
console.timeEnd(k__67652__auto__);

return res__67653__auto__;
})():(frontend.worker.rtc.full_upload_download_graph.normalized_remote_blocks_coercer.cljs$core$IFn$_invoke$arity$1 ? frontend.worker.rtc.full_upload_download_graph.normalized_remote_blocks_coercer.cljs$core$IFn$_invoke$arity$1(blocks1) : frontend.worker.rtc.full_upload_download_graph.normalized_remote_blocks_coercer.call(null,blocks1)));
var blocks__$1 = cljs.core.sequence.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$3(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (p1__135181_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__135181_SHARP_,new cljs.core.Keyword("client","schema","client/schema",-238707506));
})),cljs.core.remove.cljs$core$IFn$_invoke$arity$1((function (block){
return cljs.core.contains_QMARK_(ignore_entity_set,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(block));
})),cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (block){
return cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$1(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(cljs.core.contains_QMARK_,ignore_attr_set),cljs.core.first)),block);
}))),blocks2);
var blocks__$2 = frontend.worker.rtc.full_upload_download_graph.fill_block_fields(blocks__$1);
return blocks__$2;
});
/**
 * Return
 *   {:remote-t ...
 * :init-tx-data ...
 * :tx-data ...}
 *   init-tx-data - schema data and other init-data, need to be transacted first
 *   tx-data - all other data
 */
frontend.worker.rtc.full_upload_download_graph.remote_all_blocks__GT_tx_data_PLUS_t = (function frontend$worker$rtc$full_upload_download_graph$remote_all_blocks__GT_tx_data_PLUS_t(remote_all_blocks,graph_uuid){
var t = new cljs.core.Keyword(null,"t","t",-1397832519).cljs$core$IFn$_invoke$arity$1(remote_all_blocks);
var blocks = frontend.worker.rtc.full_upload_download_graph.remote_all_blocks_EQ__GT_client_blocks(remote_all_blocks,frontend.worker.rtc.const$.ignore_attrs_when_init_download,frontend.worker.rtc.const$.ignore_entities_when_init_download);
var vec__135202 = frontend.worker.rtc.full_upload_download_graph.blocks__GT_schema_blocks_PLUS_normal_blocks(blocks);
var schema_blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135202,(0),null);
var normal_blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__135202,(1),null);
var tx_data = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(frontend.worker.rtc.full_upload_download_graph.blocks_resolve_temp_id(schema_blocks,normal_blocks),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(logseq.db.kv.cljs$core$IFn$_invoke$arity$2 ? logseq.db.kv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.kv","graph-uuid","logseq.kv/graph-uuid",339522676),graph_uuid) : logseq.db.kv.call(null,new cljs.core.Keyword("logseq.kv","graph-uuid","logseq.kv/graph-uuid",339522676),graph_uuid))], null));
var init_tx_data = cljs.core.cons((logseq.db.kv.cljs$core$IFn$_invoke$arity$2 ? logseq.db.kv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.kv","db-type","logseq.kv/db-type",1106888767),"db") : logseq.db.kv.call(null,new cljs.core.Keyword("logseq.kv","db-type","logseq.kv/db-type",1106888767),"db")),schema_blocks);
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"remote-t","remote-t",-1375604239),t,new cljs.core.Keyword(null,"init-tx-data","init-tx-data",984393770),init_tx_data,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),tx_data], null);
});
frontend.worker.rtc.full_upload_download_graph.new_task__transact_remote_all_blocks_BANG_ = (function frontend$worker$rtc$full_upload_download_graph$new_task__transact_remote_all_blocks_BANG_(all_blocks,repo,graph_uuid){
var map__135210 = frontend.worker.rtc.full_upload_download_graph.remote_all_blocks__GT_tx_data_PLUS_t(all_blocks,graph_uuid);
var map__135210__$1 = cljs.core.__destructure_map(map__135210);
var remote_t = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135210__$1,new cljs.core.Keyword(null,"remote-t","remote-t",-1375604239));
var init_tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135210__$1,new cljs.core.Keyword(null,"init-tx-data","init-tx-data",984393770));
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__135210__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr135211_block_0 = (function frontend$worker$rtc$full_upload_download_graph$new_task__transact_remote_all_blocks_BANG__$_cr135211_block_0(cr135211_state){
try{var cr135211_place_0 = frontend.worker.rtc.client_op.update_local_tx;
var cr135211_place_1 = repo;
var cr135211_place_2 = remote_t;
var cr135211_place_3 = (function (){var G__135388 = cr135211_place_1;
var G__135389 = cr135211_place_2;
var fexpr__135387 = cr135211_place_0;
return (fexpr__135387.cljs$core$IFn$_invoke$arity$2 ? fexpr__135387.cljs$core$IFn$_invoke$arity$2(G__135388,G__135389) : fexpr__135387.call(null,G__135388,G__135389));
})();
var cr135211_place_4 = frontend.worker.rtc.log_and_state.update_local_t;
var cr135211_place_5 = graph_uuid;
var cr135211_place_6 = remote_t;
var cr135211_place_7 = (function (){var G__135392 = cr135211_place_5;
var G__135393 = cr135211_place_6;
var fexpr__135391 = cr135211_place_4;
return (fexpr__135391.cljs$core$IFn$_invoke$arity$2 ? fexpr__135391.cljs$core$IFn$_invoke$arity$2(G__135392,G__135393) : fexpr__135391.call(null,G__135392,G__135393));
})();
var cr135211_place_8 = frontend.worker.rtc.log_and_state.update_remote_t;
var cr135211_place_9 = graph_uuid;
var cr135211_place_10 = remote_t;
var cr135211_place_11 = (function (){var G__135395 = cr135211_place_9;
var G__135396 = cr135211_place_10;
var fexpr__135394 = cr135211_place_8;
return (fexpr__135394.cljs$core$IFn$_invoke$arity$2 ? fexpr__135394.cljs$core$IFn$_invoke$arity$2(G__135395,G__135396) : fexpr__135394.call(null,G__135395,G__135396));
})();
var cr135211_place_12 = frontend.worker.rtc.const$.RTC_E2E_TEST;
var cr135211_place_13 = null;
if(cr135211_place_12){
(cr135211_state[(0)] = cr135211_block_3);

(cr135211_state[(1)] = cr135211_place_13);

return cr135211_state;
} else {
(cr135211_state[(0)] = cr135211_block_1);

(cr135211_state[(1)] = cr135211_place_13);

return cr135211_state;
}
}catch (e135385){var cr135211_exception = e135385;
(cr135211_state[(0)] = null);

throw cr135211_exception;
}});
var cr135211_block_1 = (function frontend$worker$rtc$full_upload_download_graph$new_task__transact_remote_all_blocks_BANG__$_cr135211_block_1(cr135211_state){
try{var cr135211_place_14 = frontend.common.missionary._LT__BANG_;
var cr135211_place_15 = promesa.protocols._mcat;
var cr135211_place_16 = promesa.protocols._promise;
var cr135211_place_17 = null;
var cr135211_place_18 = (function (){var G__135409 = cr135211_place_17;
var fexpr__135408 = cr135211_place_16;
return (fexpr__135408.cljs$core$IFn$_invoke$arity$1 ? fexpr__135408.cljs$core$IFn$_invoke$arity$1(G__135409) : fexpr__135408.call(null,G__135409));
})();
var cr135211_place_19 = (function (___48196__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__135221 = repo;
var G__135222 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"close-other-db?","close-other-db?",-1978674579),false], null);
var fexpr__135220 = (function (){var fexpr__135223 = cljs.core.deref(frontend.common.thread_api._STAR_thread_apis);
var fexpr__135415 = fexpr__135223;
return (fexpr__135415.cljs$core$IFn$_invoke$arity$1 ? fexpr__135415.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("thread-api","create-or-open-db","thread-api/create-or-open-db",1100871183)) : fexpr__135415.call(null,new cljs.core.Keyword("thread-api","create-or-open-db","thread-api/create-or-open-db",1100871183)));
})();
var G__135417 = G__135221;
var G__135418 = G__135222;
var fexpr__135416 = fexpr__135220;
return (fexpr__135416.cljs$core$IFn$_invoke$arity$2 ? fexpr__135416.cljs$core$IFn$_invoke$arity$2(G__135417,G__135418) : fexpr__135416.call(null,G__135417,G__135418));
})()),(function (___48186__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var fexpr__135229 = (function (){var fexpr__135234 = cljs.core.deref(frontend.common.thread_api._STAR_thread_apis);
var fexpr__135420 = fexpr__135234;
return (fexpr__135420.cljs$core$IFn$_invoke$arity$1 ? fexpr__135420.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("thread-api","export-db","thread-api/export-db",1376034690)) : fexpr__135420.call(null,new cljs.core.Keyword("thread-api","export-db","thread-api/export-db",1376034690)));
})();
var G__135423 = repo;
var fexpr__135422 = fexpr__135229;
return (fexpr__135422.cljs$core$IFn$_invoke$arity$1 ? fexpr__135422.cljs$core$IFn$_invoke$arity$1(G__135423) : fexpr__135422.call(null,G__135423));
})()),(function (___48186__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__135242 = repo;
var G__135243 = init_tx_data;
var G__135244 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"rtc-download-graph?","rtc-download-graph?",-1013530237),true,new cljs.core.Keyword("frontend.worker.pipeline","skip-validate-db?","frontend.worker.pipeline/skip-validate-db?",-107248246),true,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false], null);
var G__135245 = frontend.worker.state.get_context();
var fexpr__135241 = (function (){var fexpr__135250 = cljs.core.deref(frontend.common.thread_api._STAR_thread_apis);
var fexpr__135427 = fexpr__135250;
return (fexpr__135427.cljs$core$IFn$_invoke$arity$1 ? fexpr__135427.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("thread-api","transact","thread-api/transact",917721609)) : fexpr__135427.call(null,new cljs.core.Keyword("thread-api","transact","thread-api/transact",917721609)));
})();
var G__135430 = G__135242;
var G__135431 = G__135243;
var G__135432 = G__135244;
var G__135433 = G__135245;
var fexpr__135429 = fexpr__135241;
return (fexpr__135429.cljs$core$IFn$_invoke$arity$4 ? fexpr__135429.cljs$core$IFn$_invoke$arity$4(G__135430,G__135431,G__135432,G__135433) : fexpr__135429.call(null,G__135430,G__135431,G__135432,G__135433));
})()),(function (___48186__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__135256 = repo;
var G__135257 = tx_data;
var G__135258 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"rtc-download-graph?","rtc-download-graph?",-1013530237),true,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false], null);
var G__135259 = frontend.worker.state.get_context();
var fexpr__135255 = (function (){var fexpr__135266 = cljs.core.deref(frontend.common.thread_api._STAR_thread_apis);
var fexpr__135439 = fexpr__135266;
return (fexpr__135439.cljs$core$IFn$_invoke$arity$1 ? fexpr__135439.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("thread-api","transact","thread-api/transact",917721609)) : fexpr__135439.call(null,new cljs.core.Keyword("thread-api","transact","thread-api/transact",917721609)));
})();
var G__135443 = G__135256;
var G__135444 = G__135257;
var G__135445 = G__135258;
var G__135446 = G__135259;
var fexpr__135442 = fexpr__135255;
return (fexpr__135442.cljs$core$IFn$_invoke$arity$4 ? fexpr__135442.cljs$core$IFn$_invoke$arity$4(G__135443,G__135444,G__135445,G__135446) : fexpr__135442.call(null,G__135443,G__135444,G__135445,G__135446));
})()),(function (___48186__auto____$3){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.rtc.full_upload_download_graph.transact_remote_schema_version_BANG_(repo)),(function (___48186__auto____$4){
return promesa.protocols._promise(frontend.worker.rtc.full_upload_download_graph.transact_block_refs_BANG_(repo));
}));
}));
}));
}));
}));
});
var cr135211_place_20 = (function (){var G__135450 = cr135211_place_18;
var G__135451 = cr135211_place_19;
var fexpr__135449 = cr135211_place_15;
return (fexpr__135449.cljs$core$IFn$_invoke$arity$2 ? fexpr__135449.cljs$core$IFn$_invoke$arity$2(G__135450,G__135451) : fexpr__135449.call(null,G__135450,G__135451));
})();
var cr135211_place_21 = (function (){var G__135453 = cr135211_place_20;
var fexpr__135452 = cr135211_place_14;
return (fexpr__135452.cljs$core$IFn$_invoke$arity$1 ? fexpr__135452.cljs$core$IFn$_invoke$arity$1(G__135453) : fexpr__135452.call(null,G__135453));
})();
(cr135211_state[(0)] = cr135211_block_2);

return missionary.core.park(cr135211_place_21);
}catch (e135405){var cr135211_exception = e135405;
(cr135211_state[(0)] = null);

(cr135211_state[(1)] = null);

throw cr135211_exception;
}});
var cr135211_block_2 = (function frontend$worker$rtc$full_upload_download_graph$new_task__transact_remote_all_blocks_BANG__$_cr135211_block_2(cr135211_state){
try{var cr135211_place_22 = missionary.core.unpark();
(cr135211_state[(0)] = cr135211_block_4);

(cr135211_state[(1)] = cr135211_place_22);

return cr135211_state;
}catch (e135456){var cr135211_exception = e135456;
(cr135211_state[(0)] = null);

(cr135211_state[(1)] = null);

throw cr135211_exception;
}});
var cr135211_block_3 = (function frontend$worker$rtc$full_upload_download_graph$new_task__transact_remote_all_blocks_BANG__$_cr135211_block_3(cr135211_state){
try{var cr135211_place_23 = frontend.worker.rtc.full_upload_download_graph.create_graph_for_rtc_test;
var cr135211_place_24 = repo;
var cr135211_place_25 = init_tx_data;
var cr135211_place_26 = tx_data;
var cr135211_place_27 = (function (){var G__135478 = cr135211_place_24;
var G__135479 = cr135211_place_25;
var G__135480 = cr135211_place_26;
var fexpr__135477 = cr135211_place_23;
return (fexpr__135477.cljs$core$IFn$_invoke$arity$3 ? fexpr__135477.cljs$core$IFn$_invoke$arity$3(G__135478,G__135479,G__135480) : fexpr__135477.call(null,G__135478,G__135479,G__135480));
})();
(cr135211_state[(0)] = cr135211_block_4);

(cr135211_state[(1)] = cr135211_place_27);

return cr135211_state;
}catch (e135471){var cr135211_exception = e135471;
(cr135211_state[(0)] = null);

(cr135211_state[(1)] = null);

throw cr135211_exception;
}});
var cr135211_block_4 = (function frontend$worker$rtc$full_upload_download_graph$new_task__transact_remote_all_blocks_BANG__$_cr135211_block_4(cr135211_state){
try{var cr135211_place_13 = (cr135211_state[(1)]);
var cr135211_place_28 = frontend.worker.shared_service.broadcast_to_clients_BANG_;
var cr135211_place_29 = new cljs.core.Keyword(null,"add-repo","add-repo",1885345931);
var cr135211_place_30 = new cljs.core.Keyword(null,"repo","repo",-1999060679);
var cr135211_place_31 = repo;
var cr135211_place_32 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135211_place_30,cr135211_place_31]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135211_place_33 = (function (){var G__135500 = cr135211_place_29;
var G__135501 = cr135211_place_32;
var fexpr__135498 = cr135211_place_28;
return (fexpr__135498.cljs$core$IFn$_invoke$arity$2 ? fexpr__135498.cljs$core$IFn$_invoke$arity$2(G__135500,G__135501) : fexpr__135498.call(null,G__135500,G__135501));
})();
(cr135211_state[(0)] = null);

(cr135211_state[(1)] = null);

return cr135211_place_33;
}catch (e135485){var cr135211_exception = e135485;
(cr135211_state[(0)] = null);

(cr135211_state[(1)] = null);

throw cr135211_exception;
}});
return cloroutine.impl.coroutine((function (){var G__135502 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((2));
(G__135502[(0)] = cr135211_block_0);

return G__135502;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.full_upload_download_graph.new_task__request_download_graph = (function frontend$worker$rtc$full_upload_download_graph$new_task__request_download_graph(get_ws_create_task,graph_uuid,schema_version){
frontend.worker.rtc.log_and_state.rtc_log(new cljs.core.Keyword("rtc.log","download","rtc.log/download",-2144210573),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"sub-type","sub-type",-997954412),new cljs.core.Keyword(null,"request-download-graph","request-download-graph",548122945),new cljs.core.Keyword(null,"message","message",-406056002),"requesting download graph",new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid,new cljs.core.Keyword(null,"schema-version","schema-version",1117939594),schema_version], null));

return missionary.core.join.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"download-info-uuid","download-info-uuid",-511621154),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.worker.rtc.ws_util.send_AMPERSAND_recv(get_ws_create_task,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"action","action",-811238024),"download-graph",new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid,new cljs.core.Keyword(null,"schema-version","schema-version",1117939594),cljs.core.str.cljs$core$IFn$_invoke$arity$1(schema_version)], null))], 0));
});
frontend.worker.rtc.full_upload_download_graph.new_task__wait_download_info_ready = (function frontend$worker$rtc$full_upload_download_graph$new_task__wait_download_info_ready(get_ws_create_task,download_info_uuid,graph_uuid,schema_version,timeout_ms){
return missionary.core.timeout.cljs$core$IFn$_invoke$arity$3(cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr135514_block_0 = (function frontend$worker$rtc$full_upload_download_graph$new_task__wait_download_info_ready_$_cr135514_block_0(cr135514_state){
try{var cr135514_place_0 = frontend.worker.rtc.log_and_state.rtc_log;
var cr135514_place_1 = new cljs.core.Keyword("rtc.log","download","rtc.log/download",-2144210573);
var cr135514_place_2 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr135514_place_3 = new cljs.core.Keyword(null,"wait-remote-graph-data-ready","wait-remote-graph-data-ready",168925556);
var cr135514_place_4 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr135514_place_5 = "waiting for the remote to prepare the data";
var cr135514_place_6 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr135514_place_7 = graph_uuid;
var cr135514_place_8 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135514_place_2,cr135514_place_3,cr135514_place_4,cr135514_place_5,cr135514_place_6,cr135514_place_7]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135514_place_9 = (function (){var G__135643 = cr135514_place_1;
var G__135644 = cr135514_place_8;
var fexpr__135642 = cr135514_place_0;
return (fexpr__135642.cljs$core$IFn$_invoke$arity$2 ? fexpr__135642.cljs$core$IFn$_invoke$arity$2(G__135643,G__135644) : fexpr__135642.call(null,G__135643,G__135644));
})();
(cr135514_state[(0)] = cr135514_block_1);

return cr135514_state;
}catch (e135639){var cr135514_exception = e135639;
(cr135514_state[(0)] = null);

throw cr135514_exception;
}});
var cr135514_block_1 = (function frontend$worker$rtc$full_upload_download_graph$new_task__wait_download_info_ready_$_cr135514_block_1(cr135514_state){
try{var cr135514_place_10 = missionary.core.sleep;
var cr135514_place_11 = (3000);
var cr135514_place_12 = (function (){var G__135650 = cr135514_place_11;
var fexpr__135649 = cr135514_place_10;
return (fexpr__135649.cljs$core$IFn$_invoke$arity$1 ? fexpr__135649.cljs$core$IFn$_invoke$arity$1(G__135650) : fexpr__135649.call(null,G__135650));
})();
(cr135514_state[(0)] = cr135514_block_2);

return missionary.core.park(cr135514_place_12);
}catch (e135647){var cr135514_exception = e135647;
(cr135514_state[(0)] = null);

throw cr135514_exception;
}});
var cr135514_block_2 = (function frontend$worker$rtc$full_upload_download_graph$new_task__wait_download_info_ready_$_cr135514_block_2(cr135514_state){
try{var cr135514_place_13 = missionary.core.unpark();
var cr135514_place_14 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr135514_place_15 = get_ws_create_task;
var cr135514_place_16 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr135514_place_17 = "download-info-list";
var cr135514_place_18 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr135514_place_19 = graph_uuid;
var cr135514_place_20 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr135514_place_21 = schema_version;
var cr135514_place_22 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr135514_place_21);
var cr135514_place_23 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135514_place_16,cr135514_place_17,cr135514_place_20,cr135514_place_22,cr135514_place_18,cr135514_place_19]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135514_place_24 = (function (){var G__135655 = cr135514_place_15;
var G__135656 = cr135514_place_23;
var fexpr__135654 = cr135514_place_14;
return (fexpr__135654.cljs$core$IFn$_invoke$arity$2 ? fexpr__135654.cljs$core$IFn$_invoke$arity$2(G__135655,G__135656) : fexpr__135654.call(null,G__135655,G__135656));
})();
(cr135514_state[(0)] = cr135514_block_3);

return missionary.core.park(cr135514_place_24);
}catch (e135652){var cr135514_exception = e135652;
(cr135514_state[(0)] = null);

throw cr135514_exception;
}});
var cr135514_block_3 = (function frontend$worker$rtc$full_upload_download_graph$new_task__wait_download_info_ready_$_cr135514_block_3(cr135514_state){
try{var cr135514_place_25 = missionary.core.unpark();
var cr135514_place_26 = cljs.core.__destructure_map;
var cr135514_place_27 = cr135514_place_25;
var cr135514_place_28 = (function (){var G__135664 = cr135514_place_27;
var fexpr__135663 = cr135514_place_26;
return (fexpr__135663.cljs$core$IFn$_invoke$arity$1 ? fexpr__135663.cljs$core$IFn$_invoke$arity$1(G__135664) : fexpr__135663.call(null,G__135664));
})();
var cr135514_place_29 = cljs.core.get;
var cr135514_place_30 = cr135514_place_28;
var cr135514_place_31 = new cljs.core.Keyword(null,"download-info-list","download-info-list",527425110);
var cr135514_place_32 = (function (){var G__135667 = cr135514_place_30;
var G__135668 = cr135514_place_31;
var fexpr__135666 = cr135514_place_29;
return (fexpr__135666.cljs$core$IFn$_invoke$arity$2 ? fexpr__135666.cljs$core$IFn$_invoke$arity$2(G__135667,G__135668) : fexpr__135666.call(null,G__135667,G__135668));
})();
var cr135514_place_33 = cljs.core.some;
var cr135514_place_34 = (function (download_info){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(download_info_uuid,new cljs.core.Keyword(null,"download-info-uuid","download-info-uuid",-511621154).cljs$core$IFn$_invoke$arity$1(download_info));
if(and__5000__auto__){
return new cljs.core.Keyword(null,"download-info-s3-url","download-info-s3-url",937853327).cljs$core$IFn$_invoke$arity$1(download_info);
} else {
return and__5000__auto__;
}
})())){
return download_info;
} else {
return null;
}
});
var cr135514_place_35 = cr135514_place_32;
var cr135514_place_36 = (function (){var G__135674 = cr135514_place_34;
var G__135675 = cr135514_place_35;
var fexpr__135673 = cr135514_place_33;
return (fexpr__135673.cljs$core$IFn$_invoke$arity$2 ? fexpr__135673.cljs$core$IFn$_invoke$arity$2(G__135674,G__135675) : fexpr__135673.call(null,G__135674,G__135675));
})();
var cr135514_place_37 = cr135514_place_36;
var cr135514_place_38 = null;
if(cljs.core.truth_(cr135514_place_37)){
(cr135514_state[(0)] = cr135514_block_5);

(cr135514_state[(1)] = cr135514_place_36);

(cr135514_state[(2)] = cr135514_place_38);

return cr135514_state;
} else {
(cr135514_state[(0)] = cr135514_block_4);

return cr135514_state;
}
}catch (e135660){var cr135514_exception = e135660;
(cr135514_state[(0)] = null);

throw cr135514_exception;
}});
var cr135514_block_4 = (function frontend$worker$rtc$full_upload_download_graph$new_task__wait_download_info_ready_$_cr135514_block_4(cr135514_state){
try{(cr135514_state[(0)] = cr135514_block_1);

return cr135514_state;
}catch (e135678){var cr135514_exception = e135678;
(cr135514_state[(0)] = null);

throw cr135514_exception;
}});
var cr135514_block_5 = (function frontend$worker$rtc$full_upload_download_graph$new_task__wait_download_info_ready_$_cr135514_block_5(cr135514_state){
try{var cr135514_place_36 = (cr135514_state[(1)]);
var cr135514_place_39 = cr135514_place_36;
var cr135514_place_40 = cr135514_place_39;
(cr135514_state[(0)] = cr135514_block_6);

(cr135514_state[(1)] = null);

(cr135514_state[(2)] = cr135514_place_40);

return cr135514_state;
}catch (e135682){var cr135514_exception = e135682;
(cr135514_state[(0)] = null);

(cr135514_state[(1)] = null);

(cr135514_state[(2)] = null);

throw cr135514_exception;
}});
var cr135514_block_6 = (function frontend$worker$rtc$full_upload_download_graph$new_task__wait_download_info_ready_$_cr135514_block_6(cr135514_state){
try{var cr135514_place_38 = (cr135514_state[(2)]);
(cr135514_state[(0)] = null);

(cr135514_state[(2)] = null);

return cr135514_place_38;
}catch (e135685){var cr135514_exception = e135685;
(cr135514_state[(0)] = null);

(cr135514_state[(2)] = null);

throw cr135514_exception;
}});
return cloroutine.impl.coroutine((function (){var G__135687 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__135687[(0)] = cr135514_block_0);

return G__135687;
})());
})(),missionary.core.sp_run),timeout_ms,new cljs.core.Keyword(null,"timeout","timeout",-318625318));
});
frontend.worker.rtc.full_upload_download_graph.new_task__download_graph_from_s3 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3(graph_uuid,graph_name,s3_url){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr135703_block_1 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr135703_block_1(cr135703_state){
try{var cr135703_place_16 = missionary.core.unpark();
var cr135703_place_17 = cljs.core.__destructure_map;
var cr135703_place_18 = cr135703_place_16;
var cr135703_place_19 = (function (){var G__135876 = cr135703_place_18;
var fexpr__135875 = cr135703_place_17;
return (fexpr__135875.cljs$core$IFn$_invoke$arity$1 ? fexpr__135875.cljs$core$IFn$_invoke$arity$1(G__135876) : fexpr__135875.call(null,G__135876));
})();
var cr135703_place_20 = cr135703_place_19;
var cr135703_place_21 = cljs.core.get;
var cr135703_place_22 = cr135703_place_19;
var cr135703_place_23 = new cljs.core.Keyword(null,"status","status",-1997798413);
var cr135703_place_24 = (function (){var G__135879 = cr135703_place_22;
var G__135880 = cr135703_place_23;
var fexpr__135878 = cr135703_place_21;
return (fexpr__135878.cljs$core$IFn$_invoke$arity$2 ? fexpr__135878.cljs$core$IFn$_invoke$arity$2(G__135879,G__135880) : fexpr__135878.call(null,G__135879,G__135880));
})();
var cr135703_place_25 = cljs.core.get;
var cr135703_place_26 = cr135703_place_19;
var cr135703_place_27 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr135703_place_28 = (function (){var G__135882 = cr135703_place_26;
var G__135883 = cr135703_place_27;
var fexpr__135881 = cr135703_place_25;
return (fexpr__135881.cljs$core$IFn$_invoke$arity$2 ? fexpr__135881.cljs$core$IFn$_invoke$arity$2(G__135882,G__135883) : fexpr__135881.call(null,G__135882,G__135883));
})();
var cr135703_place_29 = logseq.db.sqlite.util.db_version_prefix;
var cr135703_place_30 = graph_name;
var cr135703_place_31 = [cr135703_place_29,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr135703_place_30)].join('');
var cr135703_place_32 = cljs.core.not_EQ_;
var cr135703_place_33 = (200);
var cr135703_place_34 = cr135703_place_24;
var cr135703_place_35 = (function (){var G__135886 = cr135703_place_33;
var G__135887 = cr135703_place_34;
var fexpr__135885 = cr135703_place_32;
return (fexpr__135885.cljs$core$IFn$_invoke$arity$2 ? fexpr__135885.cljs$core$IFn$_invoke$arity$2(G__135886,G__135887) : fexpr__135885.call(null,G__135886,G__135887));
})();
var cr135703_place_36 = null;
if(cljs.core.truth_(cr135703_place_35)){
(cr135703_state[(0)] = cr135703_block_8);

(cr135703_state[(1)] = cr135703_place_20);

return cr135703_state;
} else {
(cr135703_state[(0)] = cr135703_block_2);

(cr135703_state[(1)] = cr135703_place_28);

(cr135703_state[(2)] = cr135703_place_31);

(cr135703_state[(3)] = cr135703_place_36);

return cr135703_state;
}
}catch (e135872){var cr135703_exception = e135872;
(cr135703_state[(0)] = null);

throw cr135703_exception;
}});
var cr135703_block_2 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr135703_block_2(cr135703_state){
try{var cr135703_place_28 = (cr135703_state[(1)]);
var cr135703_place_31 = (cr135703_state[(2)]);
var cr135703_place_37 = frontend.worker.rtc.log_and_state.rtc_log;
var cr135703_place_38 = new cljs.core.Keyword("rtc.log","download","rtc.log/download",-2144210573);
var cr135703_place_39 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr135703_place_40 = new cljs.core.Keyword(null,"transact-graph-data-to-db","transact-graph-data-to-db",-742781730);
var cr135703_place_41 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr135703_place_42 = "transacting graph data to local db";
var cr135703_place_43 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr135703_place_44 = graph_uuid;
var cr135703_place_45 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135703_place_43,cr135703_place_44,cr135703_place_41,cr135703_place_42,cr135703_place_39,cr135703_place_40]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135703_place_46 = (function (){var G__135897 = cr135703_place_38;
var G__135898 = cr135703_place_45;
var fexpr__135896 = cr135703_place_37;
return (fexpr__135896.cljs$core$IFn$_invoke$arity$2 ? fexpr__135896.cljs$core$IFn$_invoke$arity$2(G__135897,G__135898) : fexpr__135896.call(null,G__135897,G__135898));
})();
var cr135703_place_47 = logseq.db.read_transit_str;
var cr135703_place_48 = cr135703_place_28;
var cr135703_place_49 = cr135703_place_47(cr135703_place_48);
var cr135703_place_50 = frontend.worker.state.set_rtc_downloading_graph_BANG_;
var cr135703_place_51 = true;
var cr135703_place_52 = (function (){var G__135901 = cr135703_place_51;
var fexpr__135900 = cr135703_place_50;
return (fexpr__135900.cljs$core$IFn$_invoke$arity$1 ? fexpr__135900.cljs$core$IFn$_invoke$arity$1(G__135901) : fexpr__135900.call(null,G__135901));
})();
var cr135703_place_53 = frontend.worker.rtc.full_upload_download_graph.new_task__transact_remote_all_blocks_BANG_;
var cr135703_place_54 = cr135703_place_49;
var cr135703_place_55 = cr135703_place_31;
var cr135703_place_56 = graph_uuid;
var cr135703_place_57 = (function (){var G__135905 = cr135703_place_54;
var G__135906 = cr135703_place_55;
var G__135907 = cr135703_place_56;
var fexpr__135904 = cr135703_place_53;
return (fexpr__135904.cljs$core$IFn$_invoke$arity$3 ? fexpr__135904.cljs$core$IFn$_invoke$arity$3(G__135905,G__135906,G__135907) : fexpr__135904.call(null,G__135905,G__135906,G__135907));
})();
(cr135703_state[(0)] = cr135703_block_3);

(cr135703_state[(1)] = null);

return missionary.core.park(cr135703_place_57);
}catch (e135890){var cr135703_exception = e135890;
(cr135703_state[(0)] = null);

(cr135703_state[(1)] = null);

(cr135703_state[(2)] = null);

(cr135703_state[(3)] = null);

throw cr135703_exception;
}});
var cr135703_block_9 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr135703_block_9(cr135703_state){
try{var cr135703_place_36 = (cr135703_state[(3)]);
(cr135703_state[(0)] = null);

(cr135703_state[(3)] = null);

return cr135703_place_36;
}catch (e135910){var cr135703_exception = e135910;
(cr135703_state[(0)] = null);

(cr135703_state[(3)] = null);

throw cr135703_exception;
}});
var cr135703_block_5 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr135703_block_5(cr135703_state){
try{var cr135703_place_75 = missionary.core.unpark();
(cr135703_state[(0)] = cr135703_block_7);

(cr135703_state[(1)] = cr135703_place_75);

return cr135703_state;
}catch (e135911){var cr135703_exception = e135911;
(cr135703_state[(0)] = null);

(cr135703_state[(1)] = null);

(cr135703_state[(3)] = null);

throw cr135703_exception;
}});
var cr135703_block_6 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr135703_block_6(cr135703_state){
try{var cr135703_place_76 = null;
(cr135703_state[(0)] = cr135703_block_7);

(cr135703_state[(1)] = cr135703_place_76);

return cr135703_state;
}catch (e135913){var cr135703_exception = e135913;
(cr135703_state[(0)] = null);

(cr135703_state[(1)] = null);

(cr135703_state[(3)] = null);

throw cr135703_exception;
}});
var cr135703_block_4 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr135703_block_4(cr135703_state){
try{var cr135703_place_31 = (cr135703_state[(2)]);
var cr135703_place_65 = frontend.common.missionary._LT__BANG_;
var cr135703_place_66 = frontend.worker.db_metadata._LT_store;
var cr135703_place_67 = cr135703_place_31;
var cr135703_place_68 = cljs.core.pr_str;
var cr135703_place_69 = new cljs.core.Keyword("kv","value","kv/value",305981670);
var cr135703_place_70 = graph_uuid;
var cr135703_place_71 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135703_place_69,cr135703_place_70]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135703_place_72 = (function (){var G__135927 = cr135703_place_71;
var fexpr__135926 = cr135703_place_68;
return (fexpr__135926.cljs$core$IFn$_invoke$arity$1 ? fexpr__135926.cljs$core$IFn$_invoke$arity$1(G__135927) : fexpr__135926.call(null,G__135927));
})();
var cr135703_place_73 = (function (){var G__135930 = cr135703_place_67;
var G__135931 = cr135703_place_72;
var fexpr__135929 = cr135703_place_66;
return (fexpr__135929.cljs$core$IFn$_invoke$arity$2 ? fexpr__135929.cljs$core$IFn$_invoke$arity$2(G__135930,G__135931) : fexpr__135929.call(null,G__135930,G__135931));
})();
var cr135703_place_74 = (function (){var G__135937 = cr135703_place_73;
var fexpr__135936 = cr135703_place_65;
return (fexpr__135936.cljs$core$IFn$_invoke$arity$1 ? fexpr__135936.cljs$core$IFn$_invoke$arity$1(G__135937) : fexpr__135936.call(null,G__135937));
})();
(cr135703_state[(0)] = cr135703_block_5);

(cr135703_state[(2)] = null);

return missionary.core.park(cr135703_place_74);
}catch (e135920){var cr135703_exception = e135920;
(cr135703_state[(0)] = null);

(cr135703_state[(2)] = null);

(cr135703_state[(1)] = null);

(cr135703_state[(3)] = null);

throw cr135703_exception;
}});
var cr135703_block_3 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr135703_block_3(cr135703_state){
try{var cr135703_place_31 = (cr135703_state[(2)]);
var cr135703_place_58 = missionary.core.unpark();
var cr135703_place_59 = frontend.worker.rtc.client_op.update_graph_uuid;
var cr135703_place_60 = cr135703_place_31;
var cr135703_place_61 = graph_uuid;
var cr135703_place_62 = (function (){var G__135940 = cr135703_place_60;
var G__135941 = cr135703_place_61;
var fexpr__135939 = cr135703_place_59;
return (fexpr__135939.cljs$core$IFn$_invoke$arity$2 ? fexpr__135939.cljs$core$IFn$_invoke$arity$2(G__135940,G__135941) : fexpr__135939.call(null,G__135940,G__135941));
})();
var cr135703_place_63 = frontend.worker.rtc.const$.RTC_E2E_TEST;
var cr135703_place_64 = null;
if(cr135703_place_63){
(cr135703_state[(0)] = cr135703_block_6);

(cr135703_state[(2)] = null);

(cr135703_state[(1)] = cr135703_place_64);

return cr135703_state;
} else {
(cr135703_state[(0)] = cr135703_block_4);

(cr135703_state[(1)] = cr135703_place_64);

return cr135703_state;
}
}catch (e135938){var cr135703_exception = e135938;
(cr135703_state[(0)] = null);

(cr135703_state[(2)] = null);

(cr135703_state[(3)] = null);

throw cr135703_exception;
}});
var cr135703_block_8 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr135703_block_8(cr135703_state){
try{var cr135703_place_20 = (cr135703_state[(1)]);
var cr135703_place_91 = cljs.core.ex_info;
var cr135703_place_92 = "download-graph from s3 failed";
var cr135703_place_93 = new cljs.core.Keyword(null,"resp","resp",1418702376);
var cr135703_place_94 = cr135703_place_20;
var cr135703_place_95 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135703_place_93,cr135703_place_94]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135703_place_96 = (function (){var G__135945 = cr135703_place_92;
var G__135946 = cr135703_place_95;
var fexpr__135944 = cr135703_place_91;
return (fexpr__135944.cljs$core$IFn$_invoke$arity$2 ? fexpr__135944.cljs$core$IFn$_invoke$arity$2(G__135945,G__135946) : fexpr__135944.call(null,G__135945,G__135946));
})();
var cr135703_place_97 = (function(){throw cr135703_place_96})();
(cr135703_state[(0)] = null);

(cr135703_state[(1)] = null);

return null;
}catch (e135943){var cr135703_exception = e135943;
(cr135703_state[(0)] = null);

(cr135703_state[(1)] = null);

throw cr135703_exception;
}});
var cr135703_block_0 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr135703_block_0(cr135703_state){
try{var cr135703_place_0 = frontend.worker.rtc.log_and_state.rtc_log;
var cr135703_place_1 = new cljs.core.Keyword("rtc.log","download","rtc.log/download",-2144210573);
var cr135703_place_2 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr135703_place_3 = new cljs.core.Keyword(null,"downloading-graph-data","downloading-graph-data",-1020420307);
var cr135703_place_4 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr135703_place_5 = "downloading graph data";
var cr135703_place_6 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr135703_place_7 = graph_uuid;
var cr135703_place_8 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135703_place_6,cr135703_place_7,cr135703_place_4,cr135703_place_5,cr135703_place_2,cr135703_place_3]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135703_place_9 = (function (){var G__135949 = cr135703_place_1;
var G__135950 = cr135703_place_8;
var fexpr__135948 = cr135703_place_0;
return (fexpr__135948.cljs$core$IFn$_invoke$arity$2 ? fexpr__135948.cljs$core$IFn$_invoke$arity$2(G__135949,G__135950) : fexpr__135948.call(null,G__135949,G__135950));
})();
var cr135703_place_10 = cljs_http_missionary.client.get;
var cr135703_place_11 = s3_url;
var cr135703_place_12 = new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222);
var cr135703_place_13 = false;
var cr135703_place_14 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135703_place_12,cr135703_place_13]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135703_place_15 = (function (){var G__135953 = cr135703_place_11;
var G__135954 = cr135703_place_14;
var fexpr__135952 = cr135703_place_10;
return (fexpr__135952.cljs$core$IFn$_invoke$arity$2 ? fexpr__135952.cljs$core$IFn$_invoke$arity$2(G__135953,G__135954) : fexpr__135952.call(null,G__135953,G__135954));
})();
(cr135703_state[(0)] = cr135703_block_1);

return missionary.core.park(cr135703_place_15);
}catch (e135947){var cr135703_exception = e135947;
(cr135703_state[(0)] = null);

throw cr135703_exception;
}});
var cr135703_block_7 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr135703_block_7(cr135703_state){
try{var cr135703_place_64 = (cr135703_state[(1)]);
var cr135703_place_77 = frontend.worker.state.set_rtc_downloading_graph_BANG_;
var cr135703_place_78 = false;
var cr135703_place_79 = (function (){var G__135964 = cr135703_place_78;
var fexpr__135963 = cr135703_place_77;
return (fexpr__135963.cljs$core$IFn$_invoke$arity$1 ? fexpr__135963.cljs$core$IFn$_invoke$arity$1(G__135964) : fexpr__135963.call(null,G__135964));
})();
var cr135703_place_80 = frontend.worker.rtc.log_and_state.rtc_log;
var cr135703_place_81 = new cljs.core.Keyword("rtc.log","download","rtc.log/download",-2144210573);
var cr135703_place_82 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr135703_place_83 = new cljs.core.Keyword(null,"download-completed","download-completed",-1038223761);
var cr135703_place_84 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr135703_place_85 = "download completed";
var cr135703_place_86 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr135703_place_87 = graph_uuid;
var cr135703_place_88 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135703_place_86,cr135703_place_87,cr135703_place_84,cr135703_place_85,cr135703_place_82,cr135703_place_83]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135703_place_89 = (function (){var G__135968 = cr135703_place_81;
var G__135969 = cr135703_place_88;
var fexpr__135967 = cr135703_place_80;
return (fexpr__135967.cljs$core$IFn$_invoke$arity$2 ? fexpr__135967.cljs$core$IFn$_invoke$arity$2(G__135968,G__135969) : fexpr__135967.call(null,G__135968,G__135969));
})();
var cr135703_place_90 = null;
(cr135703_state[(0)] = cr135703_block_9);

(cr135703_state[(1)] = null);

(cr135703_state[(3)] = cr135703_place_90);

return cr135703_state;
}catch (e135958){var cr135703_exception = e135958;
(cr135703_state[(0)] = null);

(cr135703_state[(1)] = null);

(cr135703_state[(3)] = null);

throw cr135703_exception;
}});
return cloroutine.impl.coroutine((function (){var G__135971 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__135971[(0)] = cr135703_block_0);

return G__135971;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.full_upload_download_graph.new_task__branch_graph = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph(get_ws_create_task,repo,conn,graph_uuid,major_schema_version){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr135980_block_6 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr135980_block_6(cr135980_state){
try{var cr135980_place_107 = (cr135980_state[(1)]);
var cr135980_place_113 = cljs.core.ex_info;
var cr135980_place_114 = "branch-graph failed";
var cr135980_place_115 = new cljs.core.Keyword(null,"upload-resp","upload-resp",-2088142426);
var cr135980_place_116 = cr135980_place_107;
var cr135980_place_117 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135980_place_115,cr135980_place_116]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135980_place_118 = (function (){var G__136324 = cr135980_place_114;
var G__136325 = cr135980_place_117;
var fexpr__136323 = cr135980_place_113;
return (fexpr__136323.cljs$core$IFn$_invoke$arity$2 ? fexpr__136323.cljs$core$IFn$_invoke$arity$2(G__136324,G__136325) : fexpr__136323.call(null,G__136324,G__136325));
})();
var cr135980_place_119 = (function(){throw cr135980_place_118})();
(cr135980_state[(0)] = null);

(cr135980_state[(1)] = null);

return null;
}catch (e136320){var cr135980_exception = e136320;
(cr135980_state[(0)] = null);

(cr135980_state[(1)] = null);

throw cr135980_exception;
}});
var cr135980_block_0 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr135980_block_0(cr135980_state){
try{var cr135980_place_0 = frontend.worker.rtc.log_and_state.rtc_log;
var cr135980_place_1 = new cljs.core.Keyword("rtc.log","branch-graph","rtc.log/branch-graph",763502753);
var cr135980_place_2 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr135980_place_3 = new cljs.core.Keyword(null,"fetching-presigned-put-url","fetching-presigned-put-url",1134336471);
var cr135980_place_4 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr135980_place_5 = "fetching presigned put-url";
var cr135980_place_6 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135980_place_4,cr135980_place_5,cr135980_place_2,cr135980_place_3]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135980_place_7 = (function (){var G__136337 = cr135980_place_1;
var G__136338 = cr135980_place_6;
var fexpr__136336 = cr135980_place_0;
return (fexpr__136336.cljs$core$IFn$_invoke$arity$2 ? fexpr__136336.cljs$core$IFn$_invoke$arity$2(G__136337,G__136338) : fexpr__136336.call(null,G__136337,G__136338));
})();
var cr135980_place_8 = frontend.worker.rtc.full_upload_download_graph.remove_rtc_data_in_conn_BANG_;
var cr135980_place_9 = repo;
var cr135980_place_10 = (function (){var G__136341 = cr135980_place_9;
var fexpr__136340 = cr135980_place_8;
return (fexpr__136340.cljs$core$IFn$_invoke$arity$1 ? fexpr__136340.cljs$core$IFn$_invoke$arity$1(G__136341) : fexpr__136340.call(null,G__136341));
})();
var cr135980_place_11 = missionary.core.join;
var cr135980_place_12 = cljs.core.vector;
var cr135980_place_13 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr135980_place_14 = get_ws_create_task;
var cr135980_place_15 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr135980_place_16 = "presign-put-temp-s3-obj";
var cr135980_place_17 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135980_place_15,cr135980_place_16]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135980_place_18 = (function (){var G__136343 = cr135980_place_14;
var G__136344 = cr135980_place_17;
var fexpr__136342 = cr135980_place_13;
return (fexpr__136342.cljs$core$IFn$_invoke$arity$2 ? fexpr__136342.cljs$core$IFn$_invoke$arity$2(G__136343,G__136344) : fexpr__136342.call(null,G__136343,G__136344));
})();
var cr135980_place_19 = cljs.core.partial;
var cr135980_place_20 = (function (cr135987_state){
try{var cr135987_place_0 = frontend.worker.rtc.full_upload_download_graph.export_as_blocks;
var cr135987_place_1 = cljs.core.deref;
var cr135987_place_2 = conn;
var cr135987_place_3 = (function (){var G__136017 = cr135987_place_2;
var fexpr__136015 = cr135987_place_1;
var G__136367 = G__136017;
var fexpr__136366 = fexpr__136015;
return (fexpr__136366.cljs$core$IFn$_invoke$arity$1 ? fexpr__136366.cljs$core$IFn$_invoke$arity$1(G__136367) : fexpr__136366.call(null,G__136367));
})();
var cr135987_place_4 = new cljs.core.Keyword(null,"ignore-attr-set","ignore-attr-set",1237742981);
var cr135987_place_5 = frontend.worker.rtc.const$.ignore_attrs_when_init_upload;
var cr135987_place_6 = new cljs.core.Keyword(null,"ignore-entity-set","ignore-entity-set",205528184);
var cr135987_place_7 = frontend.worker.rtc.const$.ignore_entities_when_init_upload;
var cr135987_place_8 = (function (){var G__136019 = cr135987_place_3;
var G__136020 = cr135987_place_4;
var G__136021 = cr135987_place_5;
var G__136022 = cr135987_place_6;
var G__136023 = cr135987_place_7;
var fexpr__136018 = cr135987_place_0;
var G__136369 = G__136019;
var G__136370 = G__136020;
var G__136371 = G__136021;
var G__136372 = G__136022;
var G__136373 = G__136023;
var fexpr__136368 = fexpr__136018;
return (fexpr__136368.cljs$core$IFn$_invoke$arity$5 ? fexpr__136368.cljs$core$IFn$_invoke$arity$5(G__136369,G__136370,G__136371,G__136372,G__136373) : fexpr__136368.call(null,G__136369,G__136370,G__136371,G__136372,G__136373));
})();
var cr135987_place_9 = logseq.db.write_transit_str;
var cr135987_place_10 = cr135987_place_8;
var cr135987_place_11 = cr135987_place_9(cr135987_place_10);
(cr135987_state[(0)] = null);

return cr135987_place_11;
}catch (e136364){var e136010 = e136364;
var cr135987_exception = e136010;
(cr135987_state[(0)] = null);

throw cr135987_exception;
}});
var cr135980_place_21 = cloroutine.impl.coroutine;
var cr135980_place_22 = cljs.core.object_array;
var cr135980_place_23 = (1);
var cr135980_place_24 = (function (){var G__136377 = cr135980_place_23;
var fexpr__136376 = cr135980_place_22;
return (fexpr__136376.cljs$core$IFn$_invoke$arity$1 ? fexpr__136376.cljs$core$IFn$_invoke$arity$1(G__136377) : fexpr__136376.call(null,G__136377));
})();
var cr135980_place_25 = cr135980_place_24;
var cr135980_place_26 = (0);
var cr135980_place_27 = cr135980_place_20;
var cr135980_place_28 = (cr135980_place_25[cr135980_place_26] = cr135980_place_27);
var cr135980_place_29 = cr135980_place_24;
var cr135980_place_30 = (function (){var G__136380 = cr135980_place_29;
var fexpr__136379 = cr135980_place_21;
return (fexpr__136379.cljs$core$IFn$_invoke$arity$1 ? fexpr__136379.cljs$core$IFn$_invoke$arity$1(G__136380) : fexpr__136379.call(null,G__136380));
})();
var cr135980_place_31 = missionary.core.sp_run;
var cr135980_place_32 = (function (){var G__136382 = cr135980_place_30;
var G__136383 = cr135980_place_31;
var fexpr__136381 = cr135980_place_19;
return (fexpr__136381.cljs$core$IFn$_invoke$arity$2 ? fexpr__136381.cljs$core$IFn$_invoke$arity$2(G__136382,G__136383) : fexpr__136381.call(null,G__136382,G__136383));
})();
var cr135980_place_33 = (function (){var G__136386 = cr135980_place_12;
var G__136387 = cr135980_place_18;
var G__136388 = cr135980_place_32;
var fexpr__136385 = cr135980_place_11;
return (fexpr__136385.cljs$core$IFn$_invoke$arity$3 ? fexpr__136385.cljs$core$IFn$_invoke$arity$3(G__136386,G__136387,G__136388) : fexpr__136385.call(null,G__136386,G__136387,G__136388));
})();
(cr135980_state[(0)] = cr135980_block_1);

return missionary.core.park(cr135980_place_33);
}catch (e136331){var cr135980_exception = e136331;
(cr135980_state[(0)] = null);

throw cr135980_exception;
}});
var cr135980_block_9 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr135980_block_9(cr135980_state){
try{var cr135980_place_112 = (cr135980_state[(2)]);
(cr135980_state[(0)] = null);

(cr135980_state[(2)] = null);

return cr135980_place_112;
}catch (e136395){var cr135980_exception = e136395;
(cr135980_state[(0)] = null);

(cr135980_state[(2)] = null);

throw cr135980_exception;
}});
var cr135980_block_4 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr135980_block_4(cr135980_state){
try{var cr135980_place_50 = (cr135980_state[(1)]);
var cr135980_place_86 = (cr135980_state[(2)]);
var cr135980_place_92 = missionary.core.unpark();
var cr135980_place_93 = cr135980_place_86(cr135980_place_92);
var cr135980_place_94 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr135980_place_95 = get_ws_create_task;
var cr135980_place_96 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr135980_place_97 = "branch-graph";
var cr135980_place_98 = new cljs.core.Keyword(null,"s3-key","s3-key",696218166);
var cr135980_place_99 = cr135980_place_50;
var cr135980_place_100 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr135980_place_101 = major_schema_version;
var cr135980_place_102 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr135980_place_101);
var cr135980_place_103 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr135980_place_104 = graph_uuid;
var cr135980_place_105 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135980_place_98,cr135980_place_99,cr135980_place_96,cr135980_place_97,cr135980_place_100,cr135980_place_102,cr135980_place_103,cr135980_place_104]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135980_place_106 = (function (){var G__136406 = cr135980_place_95;
var G__136407 = cr135980_place_105;
var fexpr__136405 = cr135980_place_94;
return (fexpr__136405.cljs$core$IFn$_invoke$arity$2 ? fexpr__136405.cljs$core$IFn$_invoke$arity$2(G__136406,G__136407) : fexpr__136405.call(null,G__136406,G__136407));
})();
(cr135980_state[(0)] = cr135980_block_5);

(cr135980_state[(1)] = null);

(cr135980_state[(2)] = null);

(cr135980_state[(1)] = cr135980_place_93);

return missionary.core.park(cr135980_place_106);
}catch (e136398){var cr135980_exception = e136398;
(cr135980_state[(0)] = null);

(cr135980_state[(1)] = null);

(cr135980_state[(2)] = null);

throw cr135980_exception;
}});
var cr135980_block_2 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr135980_block_2(cr135980_state){
try{var cr135980_place_72 = missionary.core.unpark();
var cr135980_place_73 = frontend.worker.rtc.log_and_state.rtc_log;
var cr135980_place_74 = new cljs.core.Keyword("rtc.log","branch-graph","rtc.log/branch-graph",763502753);
var cr135980_place_75 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr135980_place_76 = new cljs.core.Keyword(null,"request-branch-graph","request-branch-graph",-168752112);
var cr135980_place_77 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr135980_place_78 = "requesting branch-graph";
var cr135980_place_79 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135980_place_75,cr135980_place_76,cr135980_place_77,cr135980_place_78]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135980_place_80 = (function (){var G__136416 = cr135980_place_74;
var G__136417 = cr135980_place_79;
var fexpr__136415 = cr135980_place_73;
return (fexpr__136415.cljs$core$IFn$_invoke$arity$2 ? fexpr__136415.cljs$core$IFn$_invoke$arity$2(G__136416,G__136417) : fexpr__136415.call(null,G__136416,G__136417));
})();
var cr135980_place_81 = frontend.common.missionary._LT__BANG_;
var cr135980_place_82 = frontend.worker.crypt._LT_gen_aes_key;
var cr135980_place_83 = (function (){var fexpr__136419 = cr135980_place_82;
return (fexpr__136419.cljs$core$IFn$_invoke$arity$0 ? fexpr__136419.cljs$core$IFn$_invoke$arity$0() : fexpr__136419.call(null));
})();
var cr135980_place_84 = (function (){var G__136423 = cr135980_place_83;
var fexpr__136422 = cr135980_place_81;
return (fexpr__136422.cljs$core$IFn$_invoke$arity$1 ? fexpr__136422.cljs$core$IFn$_invoke$arity$1(G__136423) : fexpr__136422.call(null,G__136423));
})();
(cr135980_state[(0)] = cr135980_block_3);

return missionary.core.park(cr135980_place_84);
}catch (e136413){var cr135980_exception = e136413;
(cr135980_state[(0)] = null);

(cr135980_state[(1)] = null);

throw cr135980_exception;
}});
var cr135980_block_5 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr135980_block_5(cr135980_state){
try{var cr135980_place_107 = missionary.core.unpark();
var cr135980_place_108 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr135980_place_109 = cr135980_place_107;
var cr135980_place_110 = cr135980_place_108.cljs$core$IFn$_invoke$arity$1(cr135980_place_109);
var cr135980_place_111 = cr135980_place_110;
var cr135980_place_112 = null;
if(cljs.core.truth_(cr135980_place_111)){
(cr135980_state[(0)] = cr135980_block_7);

(cr135980_state[(3)] = cr135980_place_110);

(cr135980_state[(2)] = cr135980_place_112);

return cr135980_state;
} else {
(cr135980_state[(0)] = cr135980_block_6);

(cr135980_state[(1)] = null);

(cr135980_state[(1)] = cr135980_place_107);

return cr135980_state;
}
}catch (e136424){var cr135980_exception = e136424;
(cr135980_state[(0)] = null);

(cr135980_state[(1)] = null);

throw cr135980_exception;
}});
var cr135980_block_7 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr135980_block_7(cr135980_state){
try{var cr135980_place_110 = (cr135980_state[(3)]);
var cr135980_place_93 = (cr135980_state[(1)]);
var cr135980_place_120 = cr135980_place_110;
var cr135980_place_121 = logseq.db.get_graph_schema_version;
var cr135980_place_122 = cljs.core.deref;
var cr135980_place_123 = conn;
var cr135980_place_124 = (function (){var G__136448 = cr135980_place_123;
var fexpr__136447 = cr135980_place_122;
return (fexpr__136447.cljs$core$IFn$_invoke$arity$1 ? fexpr__136447.cljs$core$IFn$_invoke$arity$1(G__136448) : fexpr__136447.call(null,G__136448));
})();
var cr135980_place_125 = (function (){var G__136452 = cr135980_place_124;
var fexpr__136451 = cr135980_place_121;
return (fexpr__136451.cljs$core$IFn$_invoke$arity$1 ? fexpr__136451.cljs$core$IFn$_invoke$arity$1(G__136452) : fexpr__136451.call(null,G__136452));
})();
var cr135980_place_126 = logseq.db.transact_BANG_;
var cr135980_place_127 = conn;
var cr135980_place_128 = logseq.db.kv;
var cr135980_place_129 = new cljs.core.Keyword("logseq.kv","graph-uuid","logseq.kv/graph-uuid",339522676);
var cr135980_place_130 = cr135980_place_120;
var cr135980_place_131 = (function (){var G__136458 = cr135980_place_129;
var G__136459 = cr135980_place_130;
var fexpr__136457 = cr135980_place_128;
return (fexpr__136457.cljs$core$IFn$_invoke$arity$2 ? fexpr__136457.cljs$core$IFn$_invoke$arity$2(G__136458,G__136459) : fexpr__136457.call(null,G__136458,G__136459));
})();
var cr135980_place_132 = logseq.db.kv;
var cr135980_place_133 = new cljs.core.Keyword("logseq.kv","graph-local-tx","logseq.kv/graph-local-tx",-337271478);
var cr135980_place_134 = "0";
var cr135980_place_135 = (function (){var G__136464 = cr135980_place_133;
var G__136465 = cr135980_place_134;
var fexpr__136463 = cr135980_place_132;
return (fexpr__136463.cljs$core$IFn$_invoke$arity$2 ? fexpr__136463.cljs$core$IFn$_invoke$arity$2(G__136464,G__136465) : fexpr__136463.call(null,G__136464,G__136465));
})();
var cr135980_place_136 = logseq.db.kv;
var cr135980_place_137 = new cljs.core.Keyword("logseq.kv","remote-schema-version","logseq.kv/remote-schema-version",988970829);
var cr135980_place_138 = cr135980_place_125;
var cr135980_place_139 = (function (){var G__136467 = cr135980_place_137;
var G__136468 = cr135980_place_138;
var fexpr__136466 = cr135980_place_136;
return (fexpr__136466.cljs$core$IFn$_invoke$arity$2 ? fexpr__136466.cljs$core$IFn$_invoke$arity$2(G__136467,G__136468) : fexpr__136466.call(null,G__136467,G__136468));
})();
var cr135980_place_140 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr135980_place_131,cr135980_place_135,cr135980_place_139], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr135980_place_141 = (function (){var G__136473 = cr135980_place_127;
var G__136474 = cr135980_place_140;
var fexpr__136472 = cr135980_place_126;
return (fexpr__136472.cljs$core$IFn$_invoke$arity$2 ? fexpr__136472.cljs$core$IFn$_invoke$arity$2(G__136473,G__136474) : fexpr__136472.call(null,G__136473,G__136474));
})();
var cr135980_place_142 = frontend.worker.rtc.client_op.update_graph_uuid;
var cr135980_place_143 = repo;
var cr135980_place_144 = cr135980_place_120;
var cr135980_place_145 = (function (){var G__136478 = cr135980_place_143;
var G__136479 = cr135980_place_144;
var fexpr__136477 = cr135980_place_142;
return (fexpr__136477.cljs$core$IFn$_invoke$arity$2 ? fexpr__136477.cljs$core$IFn$_invoke$arity$2(G__136478,G__136479) : fexpr__136477.call(null,G__136478,G__136479));
})();
var cr135980_place_146 = frontend.worker.rtc.client_op.remove_local_tx;
var cr135980_place_147 = repo;
var cr135980_place_148 = (function (){var G__136483 = cr135980_place_147;
var fexpr__136482 = cr135980_place_146;
return (fexpr__136482.cljs$core$IFn$_invoke$arity$1 ? fexpr__136482.cljs$core$IFn$_invoke$arity$1(G__136483) : fexpr__136482.call(null,G__136483));
})();
var cr135980_place_149 = frontend.worker.rtc.client_op.add_all_exists_asset_as_ops;
var cr135980_place_150 = repo;
var cr135980_place_151 = (function (){var G__136485 = cr135980_place_150;
var fexpr__136484 = cr135980_place_149;
return (fexpr__136484.cljs$core$IFn$_invoke$arity$1 ? fexpr__136484.cljs$core$IFn$_invoke$arity$1(G__136485) : fexpr__136484.call(null,G__136485));
})();
var cr135980_place_152 = frontend.worker.crypt.store_graph_keys_jwk;
var cr135980_place_153 = repo;
var cr135980_place_154 = cr135980_place_93;
var cr135980_place_155 = (function (){var G__136491 = cr135980_place_153;
var G__136492 = cr135980_place_154;
var fexpr__136490 = cr135980_place_152;
return (fexpr__136490.cljs$core$IFn$_invoke$arity$2 ? fexpr__136490.cljs$core$IFn$_invoke$arity$2(G__136491,G__136492) : fexpr__136490.call(null,G__136491,G__136492));
})();
var cr135980_place_156 = frontend.common.missionary._LT__BANG_;
var cr135980_place_157 = frontend.worker.db_metadata._LT_store;
var cr135980_place_158 = repo;
var cr135980_place_159 = cljs.core.pr_str;
var cr135980_place_160 = new cljs.core.Keyword("kv","value","kv/value",305981670);
var cr135980_place_161 = cr135980_place_120;
var cr135980_place_162 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135980_place_160,cr135980_place_161]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135980_place_163 = (function (){var G__136498 = cr135980_place_162;
var fexpr__136497 = cr135980_place_159;
return (fexpr__136497.cljs$core$IFn$_invoke$arity$1 ? fexpr__136497.cljs$core$IFn$_invoke$arity$1(G__136498) : fexpr__136497.call(null,G__136498));
})();
var cr135980_place_164 = (function (){var G__136504 = cr135980_place_158;
var G__136505 = cr135980_place_163;
var fexpr__136503 = cr135980_place_157;
return (fexpr__136503.cljs$core$IFn$_invoke$arity$2 ? fexpr__136503.cljs$core$IFn$_invoke$arity$2(G__136504,G__136505) : fexpr__136503.call(null,G__136504,G__136505));
})();
var cr135980_place_165 = (function (){var G__136507 = cr135980_place_164;
var fexpr__136506 = cr135980_place_156;
return (fexpr__136506.cljs$core$IFn$_invoke$arity$1 ? fexpr__136506.cljs$core$IFn$_invoke$arity$1(G__136507) : fexpr__136506.call(null,G__136507));
})();
(cr135980_state[(0)] = cr135980_block_8);

(cr135980_state[(3)] = null);

(cr135980_state[(1)] = null);

return missionary.core.park(cr135980_place_165);
}catch (e136432){var cr135980_exception = e136432;
(cr135980_state[(0)] = null);

(cr135980_state[(2)] = null);

(cr135980_state[(3)] = null);

(cr135980_state[(1)] = null);

throw cr135980_exception;
}});
var cr135980_block_1 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr135980_block_1(cr135980_state){
try{var cr135980_place_34 = missionary.core.unpark();
var cr135980_place_35 = cljs.core.nth;
var cr135980_place_36 = cr135980_place_34;
var cr135980_place_37 = (0);
var cr135980_place_38 = null;
var cr135980_place_39 = (function (){var G__136520 = cr135980_place_36;
var G__136521 = cr135980_place_37;
var G__136522 = cr135980_place_38;
var fexpr__136519 = cr135980_place_35;
return (fexpr__136519.cljs$core$IFn$_invoke$arity$3 ? fexpr__136519.cljs$core$IFn$_invoke$arity$3(G__136520,G__136521,G__136522) : fexpr__136519.call(null,G__136520,G__136521,G__136522));
})();
var cr135980_place_40 = cljs.core.__destructure_map;
var cr135980_place_41 = cr135980_place_39;
var cr135980_place_42 = (function (){var G__136526 = cr135980_place_41;
var fexpr__136525 = cr135980_place_40;
return (fexpr__136525.cljs$core$IFn$_invoke$arity$1 ? fexpr__136525.cljs$core$IFn$_invoke$arity$1(G__136526) : fexpr__136525.call(null,G__136526));
})();
var cr135980_place_43 = cljs.core.get;
var cr135980_place_44 = cr135980_place_42;
var cr135980_place_45 = new cljs.core.Keyword(null,"url","url",276297046);
var cr135980_place_46 = (function (){var G__136528 = cr135980_place_44;
var G__136529 = cr135980_place_45;
var fexpr__136527 = cr135980_place_43;
return (fexpr__136527.cljs$core$IFn$_invoke$arity$2 ? fexpr__136527.cljs$core$IFn$_invoke$arity$2(G__136528,G__136529) : fexpr__136527.call(null,G__136528,G__136529));
})();
var cr135980_place_47 = cljs.core.get;
var cr135980_place_48 = cr135980_place_42;
var cr135980_place_49 = new cljs.core.Keyword(null,"key","key",-1516042587);
var cr135980_place_50 = (function (){var G__136533 = cr135980_place_48;
var G__136534 = cr135980_place_49;
var fexpr__136532 = cr135980_place_47;
return (fexpr__136532.cljs$core$IFn$_invoke$arity$2 ? fexpr__136532.cljs$core$IFn$_invoke$arity$2(G__136533,G__136534) : fexpr__136532.call(null,G__136533,G__136534));
})();
var cr135980_place_51 = cljs.core.nth;
var cr135980_place_52 = cr135980_place_34;
var cr135980_place_53 = (1);
var cr135980_place_54 = null;
var cr135980_place_55 = (function (){var G__136539 = cr135980_place_52;
var G__136540 = cr135980_place_53;
var G__136541 = cr135980_place_54;
var fexpr__136538 = cr135980_place_51;
return (fexpr__136538.cljs$core$IFn$_invoke$arity$3 ? fexpr__136538.cljs$core$IFn$_invoke$arity$3(G__136539,G__136540,G__136541) : fexpr__136538.call(null,G__136539,G__136540,G__136541));
})();
var cr135980_place_56 = frontend.worker.rtc.log_and_state.rtc_log;
var cr135980_place_57 = new cljs.core.Keyword("rtc.log","branch-graph","rtc.log/branch-graph",763502753);
var cr135980_place_58 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr135980_place_59 = new cljs.core.Keyword(null,"upload-data","upload-data",690295555);
var cr135980_place_60 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr135980_place_61 = "uploading data";
var cr135980_place_62 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135980_place_60,cr135980_place_61,cr135980_place_58,cr135980_place_59]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135980_place_63 = (function (){var G__136553 = cr135980_place_57;
var G__136554 = cr135980_place_62;
var fexpr__136552 = cr135980_place_56;
return (fexpr__136552.cljs$core$IFn$_invoke$arity$2 ? fexpr__136552.cljs$core$IFn$_invoke$arity$2(G__136553,G__136554) : fexpr__136552.call(null,G__136553,G__136554));
})();
var cr135980_place_64 = cljs_http_missionary.client.put;
var cr135980_place_65 = cr135980_place_46;
var cr135980_place_66 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr135980_place_67 = cr135980_place_55;
var cr135980_place_68 = new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222);
var cr135980_place_69 = false;
var cr135980_place_70 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135980_place_66,cr135980_place_67,cr135980_place_68,cr135980_place_69]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135980_place_71 = (function (){var G__136559 = cr135980_place_65;
var G__136560 = cr135980_place_70;
var fexpr__136558 = cr135980_place_64;
return (fexpr__136558.cljs$core$IFn$_invoke$arity$2 ? fexpr__136558.cljs$core$IFn$_invoke$arity$2(G__136559,G__136560) : fexpr__136558.call(null,G__136559,G__136560));
})();
(cr135980_state[(0)] = cr135980_block_2);

(cr135980_state[(1)] = cr135980_place_50);

return missionary.core.park(cr135980_place_71);
}catch (e136512){var cr135980_exception = e136512;
(cr135980_state[(0)] = null);

throw cr135980_exception;
}});
var cr135980_block_8 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr135980_block_8(cr135980_state){
try{var cr135980_place_166 = missionary.core.unpark();
var cr135980_place_167 = frontend.worker.rtc.log_and_state.rtc_log;
var cr135980_place_168 = new cljs.core.Keyword("rtc.log","branch-graph","rtc.log/branch-graph",763502753);
var cr135980_place_169 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr135980_place_170 = new cljs.core.Keyword(null,"completed","completed",-486056503);
var cr135980_place_171 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr135980_place_172 = "branch-graph completed";
var cr135980_place_173 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr135980_place_171,cr135980_place_172,cr135980_place_169,cr135980_place_170]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr135980_place_174 = (function (){var G__136578 = cr135980_place_168;
var G__136579 = cr135980_place_173;
var fexpr__136577 = cr135980_place_167;
return (fexpr__136577.cljs$core$IFn$_invoke$arity$2 ? fexpr__136577.cljs$core$IFn$_invoke$arity$2(G__136578,G__136579) : fexpr__136577.call(null,G__136578,G__136579));
})();
var cr135980_place_175 = null;
(cr135980_state[(0)] = cr135980_block_9);

(cr135980_state[(2)] = cr135980_place_175);

return cr135980_state;
}catch (e136569){var cr135980_exception = e136569;
(cr135980_state[(0)] = null);

(cr135980_state[(2)] = null);

throw cr135980_exception;
}});
var cr135980_block_3 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr135980_block_3(cr135980_state){
try{var cr135980_place_85 = missionary.core.unpark();
var cr135980_place_86 = logseq.db.write_transit_str;
var cr135980_place_87 = frontend.common.missionary._LT__BANG_;
var cr135980_place_88 = frontend.worker.crypt._LT_export_key;
var cr135980_place_89 = cr135980_place_85;
var cr135980_place_90 = (function (){var G__136590 = cr135980_place_89;
var fexpr__136589 = cr135980_place_88;
return (fexpr__136589.cljs$core$IFn$_invoke$arity$1 ? fexpr__136589.cljs$core$IFn$_invoke$arity$1(G__136590) : fexpr__136589.call(null,G__136590));
})();
var cr135980_place_91 = (function (){var G__136594 = cr135980_place_90;
var fexpr__136593 = cr135980_place_87;
return (fexpr__136593.cljs$core$IFn$_invoke$arity$1 ? fexpr__136593.cljs$core$IFn$_invoke$arity$1(G__136594) : fexpr__136593.call(null,G__136594));
})();
(cr135980_state[(0)] = cr135980_block_4);

(cr135980_state[(2)] = cr135980_place_86);

return missionary.core.park(cr135980_place_91);
}catch (e136585){var cr135980_exception = e136585;
(cr135980_state[(0)] = null);

(cr135980_state[(1)] = null);

throw cr135980_exception;
}});
return cloroutine.impl.coroutine((function (){var G__136598 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__136598[(0)] = cr135980_block_0);

return G__136598;
})());
})(),missionary.core.sp_run);
});

//# sourceMappingURL=frontend.worker.rtc.full_upload_download_graph.js.map
