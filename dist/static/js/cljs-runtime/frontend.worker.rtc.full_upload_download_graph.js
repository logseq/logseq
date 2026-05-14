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
return cljs.core.set(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__102529){
var vec__102531 = p__102529;
var attr_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102531,(0),null);
var attr_body_map = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102531,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079),new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(attr_body_map))){
return attr_name;
} else {
return null;
}
}),db_schema));
});
frontend.worker.rtc.full_upload_download_graph.schema__GT_card_many_attrs = (function frontend$worker$rtc$full_upload_download_graph$schema__GT_card_many_attrs(db_schema){
return cljs.core.set(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__102544){
var vec__102545 = p__102544;
var attr_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102545,(0),null);
var attr_body_map = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102545,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(attr_body_map))){
return attr_name;
} else {
return null;
}
}),db_schema));
});
frontend.worker.rtc.full_upload_download_graph.export_as_blocks = (function frontend$worker$rtc$full_upload_download_graph$export_as_blocks(var_args){
var args__5732__auto__ = [];
var len__5726__auto___104643 = arguments.length;
var i__5727__auto___104644 = (0);
while(true){
if((i__5727__auto___104644 < len__5726__auto___104643)){
args__5732__auto__.push((arguments[i__5727__auto___104644]));

var G__104645 = (i__5727__auto___104644 + (1));
i__5727__auto___104644 = G__104645;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.worker.rtc.full_upload_download_graph.export_as_blocks.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.worker.rtc.full_upload_download_graph.export_as_blocks.cljs$core$IFn$_invoke$arity$variadic = (function (db,p__102558){
var map__102559 = p__102558;
var map__102559__$1 = cljs.core.__destructure_map(map__102559);
var ignore_attr_set = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102559__$1,new cljs.core.Keyword(null,"ignore-attr-set","ignore-attr-set",1237742981));
var ignore_entity_set = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102559__$1,new cljs.core.Keyword(null,"ignore-entity-set","ignore-entity-set",205528184));
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073));
var db_schema = (datascript.core.schema.cljs$core$IFn$_invoke$arity$1 ? datascript.core.schema.cljs$core$IFn$_invoke$arity$1(db) : datascript.core.schema.call(null,db));
var card_many_attrs = frontend.worker.rtc.full_upload_download_graph.schema__GT_card_many_attrs(db_schema);
var ref_type_attrs = frontend.worker.rtc.full_upload_download_graph.schema__GT_ref_type_attrs(db_schema);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (block){
var G__102560 = block;
var G__102560__$1 = (cljs.core.truth_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(block))?cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__102560,new cljs.core.Keyword("db","ident","db/ident",-737096),logseq.db.read_transit_str):G__102560);
if(cljs.core.truth_(new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(block))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__102560__$1,new cljs.core.Keyword("block","order","block/order",-1429282437),logseq.db.read_transit_str);
} else {
return G__102560__$1;
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
var G__102565 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [ref_QMARK_,card_many_QMARK_], null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,true], null),G__102565)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(r,a,cljs.core.conj,cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom)));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,false], null),G__102565)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r,a,cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom)));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,true], null),G__102565)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(r,a,cljs.core.conj,logseq.db.write_transit_str(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom)));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [false,false], null),G__102565)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(r,a,logseq.db.write_transit_str(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom)));
} else {
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__102565)].join('')));

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
(frontend.worker.rtc.full_upload_download_graph.export_as_blocks.cljs$lang$applyTo = (function (seq102552){
var G__102553 = cljs.core.first(seq102552);
var seq102552__$1 = cljs.core.next(seq102552);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__102553,seq102552__$1);
}));

frontend.worker.rtc.full_upload_download_graph.remove_rtc_data_in_conn_BANG_ = (function frontend$worker$rtc$full_upload_download_graph$remove_rtc_data_in_conn_BANG_(repo){
frontend.worker.rtc.client_op.reset_client_op_conn(repo);

var temp__5804__auto__ = frontend.worker.state.get_datascript_conn(repo);
if(cljs.core.truth_(temp__5804__auto__)){
var conn = temp__5804__auto__;
var G__102589 = conn;
var G__102590 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("logseq.kv","graph-uuid","logseq.kv/graph-uuid",339522676)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("logseq.kv","graph-local-tx","logseq.kv/graph-local-tx",-337271478)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword("logseq.kv","remote-schema-version","logseq.kv/remote-schema-version",988970829)], null)], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(G__102589,G__102590) : datascript.core.transact_BANG_.call(null,G__102589,G__102590));
} else {
return null;
}
});
frontend.worker.rtc.full_upload_download_graph.new_task__upload_graph = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph(get_ws_create_task,repo,conn,remote_graph_name,major_schema_version){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr102604_block_0 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr102604_block_0(cr102604_state){
try{var cr102604_place_0 = frontend.worker.rtc.log_and_state.rtc_log;
var cr102604_place_1 = new cljs.core.Keyword("rtc.log","upload","rtc.log/upload",-1832742059);
var cr102604_place_2 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr102604_place_3 = new cljs.core.Keyword(null,"fetching-presigned-put-url","fetching-presigned-put-url",1134336471);
var cr102604_place_4 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr102604_place_5 = "fetching presigned put-url";
var cr102604_place_6 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr102604_place_4,cr102604_place_5,cr102604_place_2,cr102604_place_3]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr102604_place_7 = (function (){var G__103037 = cr102604_place_1;
var G__103038 = cr102604_place_6;
var fexpr__103036 = cr102604_place_0;
return (fexpr__103036.cljs$core$IFn$_invoke$arity$2 ? fexpr__103036.cljs$core$IFn$_invoke$arity$2(G__103037,G__103038) : fexpr__103036.call(null,G__103037,G__103038));
})();
var cr102604_place_8 = missionary.core.join;
var cr102604_place_9 = cljs.core.vector;
var cr102604_place_10 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr102604_place_11 = get_ws_create_task;
var cr102604_place_12 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr102604_place_13 = "presign-put-temp-s3-obj";
var cr102604_place_14 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr102604_place_12,cr102604_place_13]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr102604_place_15 = (function (){var G__103042 = cr102604_place_11;
var G__103043 = cr102604_place_14;
var fexpr__103041 = cr102604_place_10;
return (fexpr__103041.cljs$core$IFn$_invoke$arity$2 ? fexpr__103041.cljs$core$IFn$_invoke$arity$2(G__103042,G__103043) : fexpr__103041.call(null,G__103042,G__103043));
})();
var cr102604_place_16 = cljs.core.partial;
var cr102604_place_17 = (function (cr102612_state){
try{var cr102612_place_0 = frontend.worker.rtc.full_upload_download_graph.export_as_blocks;
var cr102612_place_1 = cljs.core.deref;
var cr102612_place_2 = conn;
var cr102612_place_3 = (function (){var G__102648 = cr102612_place_2;
var fexpr__102647 = cr102612_place_1;
var G__103065 = G__102648;
var fexpr__103064 = fexpr__102647;
return (fexpr__103064.cljs$core$IFn$_invoke$arity$1 ? fexpr__103064.cljs$core$IFn$_invoke$arity$1(G__103065) : fexpr__103064.call(null,G__103065));
})();
var cr102612_place_4 = new cljs.core.Keyword(null,"ignore-attr-set","ignore-attr-set",1237742981);
var cr102612_place_5 = frontend.worker.rtc.const$.ignore_attrs_when_init_upload;
var cr102612_place_6 = new cljs.core.Keyword(null,"ignore-entity-set","ignore-entity-set",205528184);
var cr102612_place_7 = frontend.worker.rtc.const$.ignore_entities_when_init_upload;
var cr102612_place_8 = (function (){var G__102652 = cr102612_place_3;
var G__102653 = cr102612_place_4;
var G__102654 = cr102612_place_5;
var G__102655 = cr102612_place_6;
var G__102656 = cr102612_place_7;
var fexpr__102651 = cr102612_place_0;
var G__103068 = G__102652;
var G__103069 = G__102653;
var G__103070 = G__102654;
var G__103071 = G__102655;
var G__103072 = G__102656;
var fexpr__103067 = fexpr__102651;
return (fexpr__103067.cljs$core$IFn$_invoke$arity$5 ? fexpr__103067.cljs$core$IFn$_invoke$arity$5(G__103068,G__103069,G__103070,G__103071,G__103072) : fexpr__103067.call(null,G__103068,G__103069,G__103070,G__103071,G__103072));
})();
var cr102612_place_9 = logseq.db.write_transit_str;
var cr102612_place_10 = cr102612_place_8;
var cr102612_place_11 = cr102612_place_9(cr102612_place_10);
(cr102612_state[(0)] = null);

return cr102612_place_11;
}catch (e103062){var e102640 = e103062;
var cr102612_exception = e102640;
(cr102612_state[(0)] = null);

throw cr102612_exception;
}});
var cr102604_place_18 = cloroutine.impl.coroutine;
var cr102604_place_19 = cljs.core.object_array;
var cr102604_place_20 = (1);
var cr102604_place_21 = (function (){var G__103077 = cr102604_place_20;
var fexpr__103076 = cr102604_place_19;
return (fexpr__103076.cljs$core$IFn$_invoke$arity$1 ? fexpr__103076.cljs$core$IFn$_invoke$arity$1(G__103077) : fexpr__103076.call(null,G__103077));
})();
var cr102604_place_22 = cr102604_place_21;
var cr102604_place_23 = (0);
var cr102604_place_24 = cr102604_place_17;
var cr102604_place_25 = (cr102604_place_22[cr102604_place_23] = cr102604_place_24);
var cr102604_place_26 = cr102604_place_21;
var cr102604_place_27 = (function (){var G__103081 = cr102604_place_26;
var fexpr__103080 = cr102604_place_18;
return (fexpr__103080.cljs$core$IFn$_invoke$arity$1 ? fexpr__103080.cljs$core$IFn$_invoke$arity$1(G__103081) : fexpr__103080.call(null,G__103081));
})();
var cr102604_place_28 = missionary.core.sp_run;
var cr102604_place_29 = (function (){var G__103086 = cr102604_place_27;
var G__103087 = cr102604_place_28;
var fexpr__103085 = cr102604_place_16;
return (fexpr__103085.cljs$core$IFn$_invoke$arity$2 ? fexpr__103085.cljs$core$IFn$_invoke$arity$2(G__103086,G__103087) : fexpr__103085.call(null,G__103086,G__103087));
})();
var cr102604_place_30 = (function (){var G__103089 = cr102604_place_9;
var G__103090 = cr102604_place_15;
var G__103091 = cr102604_place_29;
var fexpr__103088 = cr102604_place_8;
return (fexpr__103088.cljs$core$IFn$_invoke$arity$3 ? fexpr__103088.cljs$core$IFn$_invoke$arity$3(G__103089,G__103090,G__103091) : fexpr__103088.call(null,G__103089,G__103090,G__103091));
})();
(cr102604_state[(0)] = cr102604_block_1);

return missionary.core.park(cr102604_place_30);
}catch (e103031){var cr102604_exception = e103031;
(cr102604_state[(0)] = null);

throw cr102604_exception;
}});
var cr102604_block_4 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr102604_block_4(cr102604_state){
try{var cr102604_place_83 = (cr102604_state[(2)]);
var cr102604_place_47 = (cr102604_state[(1)]);
var cr102604_place_89 = missionary.core.unpark();
var cr102604_place_90 = cr102604_place_83(cr102604_place_89);
var cr102604_place_91 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr102604_place_92 = get_ws_create_task;
var cr102604_place_93 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr102604_place_94 = "upload-graph";
var cr102604_place_95 = new cljs.core.Keyword(null,"s3-key","s3-key",696218166);
var cr102604_place_96 = cr102604_place_47;
var cr102604_place_97 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr102604_place_98 = major_schema_version;
var cr102604_place_99 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr102604_place_98);
var cr102604_place_100 = new cljs.core.Keyword(null,"graph-name","graph-name",416773857);
var cr102604_place_101 = remote_graph_name;
var cr102604_place_102 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr102604_place_100,cr102604_place_101,cr102604_place_95,cr102604_place_96,cr102604_place_97,cr102604_place_99,cr102604_place_93,cr102604_place_94]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr102604_place_103 = (function (){var G__103102 = cr102604_place_92;
var G__103103 = cr102604_place_102;
var fexpr__103101 = cr102604_place_91;
return (fexpr__103101.cljs$core$IFn$_invoke$arity$2 ? fexpr__103101.cljs$core$IFn$_invoke$arity$2(G__103102,G__103103) : fexpr__103101.call(null,G__103102,G__103103));
})();
(cr102604_state[(0)] = cr102604_block_5);

(cr102604_state[(2)] = null);

(cr102604_state[(1)] = null);

(cr102604_state[(1)] = cr102604_place_90);

return missionary.core.park(cr102604_place_103);
}catch (e103093){var cr102604_exception = e103093;
(cr102604_state[(0)] = null);

(cr102604_state[(2)] = null);

(cr102604_state[(1)] = null);

throw cr102604_exception;
}});
var cr102604_block_10 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr102604_block_10(cr102604_state){
try{var cr102604_place_166 = null;
(cr102604_state[(0)] = cr102604_block_11);

(cr102604_state[(1)] = cr102604_place_166);

return cr102604_state;
}catch (e103110){var cr102604_exception = e103110;
(cr102604_state[(0)] = null);

(cr102604_state[(1)] = null);

(cr102604_state[(3)] = null);

(cr102604_state[(2)] = null);

throw cr102604_exception;
}});
var cr102604_block_2 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr102604_block_2(cr102604_state){
try{var cr102604_place_69 = missionary.core.unpark();
var cr102604_place_70 = frontend.worker.rtc.log_and_state.rtc_log;
var cr102604_place_71 = new cljs.core.Keyword("rtc.log","upload","rtc.log/upload",-1832742059);
var cr102604_place_72 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr102604_place_73 = new cljs.core.Keyword(null,"request-upload-graph","request-upload-graph",-887276217);
var cr102604_place_74 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr102604_place_75 = "requesting upload-graph";
var cr102604_place_76 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr102604_place_74,cr102604_place_75,cr102604_place_72,cr102604_place_73]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr102604_place_77 = (function (){var G__103149 = cr102604_place_71;
var G__103150 = cr102604_place_76;
var fexpr__103148 = cr102604_place_70;
return (fexpr__103148.cljs$core$IFn$_invoke$arity$2 ? fexpr__103148.cljs$core$IFn$_invoke$arity$2(G__103149,G__103150) : fexpr__103148.call(null,G__103149,G__103150));
})();
var cr102604_place_78 = frontend.common.missionary._LT__BANG_;
var cr102604_place_79 = frontend.worker.crypt._LT_gen_aes_key;
var cr102604_place_80 = (function (){var fexpr__103151 = cr102604_place_79;
return (fexpr__103151.cljs$core$IFn$_invoke$arity$0 ? fexpr__103151.cljs$core$IFn$_invoke$arity$0() : fexpr__103151.call(null));
})();
var cr102604_place_81 = (function (){var G__103153 = cr102604_place_80;
var fexpr__103152 = cr102604_place_78;
return (fexpr__103152.cljs$core$IFn$_invoke$arity$1 ? fexpr__103152.cljs$core$IFn$_invoke$arity$1(G__103153) : fexpr__103152.call(null,G__103153));
})();
(cr102604_state[(0)] = cr102604_block_3);

return missionary.core.park(cr102604_place_81);
}catch (e103133){var cr102604_exception = e103133;
(cr102604_state[(0)] = null);

(cr102604_state[(1)] = null);

throw cr102604_exception;
}});
var cr102604_block_7 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr102604_block_7(cr102604_state){
try{var cr102604_place_107 = (cr102604_state[(2)]);
var cr102604_place_90 = (cr102604_state[(1)]);
var cr102604_place_117 = cr102604_place_107;
var cr102604_place_118 = logseq.db.get_graph_schema_version;
var cr102604_place_119 = cljs.core.deref;
var cr102604_place_120 = conn;
var cr102604_place_121 = (function (){var G__103169 = cr102604_place_120;
var fexpr__103168 = cr102604_place_119;
return (fexpr__103168.cljs$core$IFn$_invoke$arity$1 ? fexpr__103168.cljs$core$IFn$_invoke$arity$1(G__103169) : fexpr__103168.call(null,G__103169));
})();
var cr102604_place_122 = (function (){var G__103173 = cr102604_place_121;
var fexpr__103172 = cr102604_place_118;
return (fexpr__103172.cljs$core$IFn$_invoke$arity$1 ? fexpr__103172.cljs$core$IFn$_invoke$arity$1(G__103173) : fexpr__103172.call(null,G__103173));
})();
var cr102604_place_123 = logseq.db.transact_BANG_;
var cr102604_place_124 = conn;
var cr102604_place_125 = logseq.db.kv;
var cr102604_place_126 = new cljs.core.Keyword("logseq.kv","graph-uuid","logseq.kv/graph-uuid",339522676);
var cr102604_place_127 = cr102604_place_117;
var cr102604_place_128 = (function (){var G__103175 = cr102604_place_126;
var G__103176 = cr102604_place_127;
var fexpr__103174 = cr102604_place_125;
return (fexpr__103174.cljs$core$IFn$_invoke$arity$2 ? fexpr__103174.cljs$core$IFn$_invoke$arity$2(G__103175,G__103176) : fexpr__103174.call(null,G__103175,G__103176));
})();
var cr102604_place_129 = logseq.db.kv;
var cr102604_place_130 = new cljs.core.Keyword("logseq.kv","graph-local-tx","logseq.kv/graph-local-tx",-337271478);
var cr102604_place_131 = "0";
var cr102604_place_132 = (function (){var G__103180 = cr102604_place_130;
var G__103181 = cr102604_place_131;
var fexpr__103179 = cr102604_place_129;
return (fexpr__103179.cljs$core$IFn$_invoke$arity$2 ? fexpr__103179.cljs$core$IFn$_invoke$arity$2(G__103180,G__103181) : fexpr__103179.call(null,G__103180,G__103181));
})();
var cr102604_place_133 = logseq.db.kv;
var cr102604_place_134 = new cljs.core.Keyword("logseq.kv","remote-schema-version","logseq.kv/remote-schema-version",988970829);
var cr102604_place_135 = cr102604_place_122;
var cr102604_place_136 = (function (){var G__103183 = cr102604_place_134;
var G__103184 = cr102604_place_135;
var fexpr__103182 = cr102604_place_133;
return (fexpr__103182.cljs$core$IFn$_invoke$arity$2 ? fexpr__103182.cljs$core$IFn$_invoke$arity$2(G__103183,G__103184) : fexpr__103182.call(null,G__103183,G__103184));
})();
var cr102604_place_137 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr102604_place_128,cr102604_place_132,cr102604_place_136], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr102604_place_138 = (function (){var G__103187 = cr102604_place_124;
var G__103188 = cr102604_place_137;
var fexpr__103186 = cr102604_place_123;
return (fexpr__103186.cljs$core$IFn$_invoke$arity$2 ? fexpr__103186.cljs$core$IFn$_invoke$arity$2(G__103187,G__103188) : fexpr__103186.call(null,G__103187,G__103188));
})();
var cr102604_place_139 = frontend.worker.rtc.client_op.update_graph_uuid;
var cr102604_place_140 = repo;
var cr102604_place_141 = cr102604_place_117;
var cr102604_place_142 = (function (){var G__103191 = cr102604_place_140;
var G__103193 = cr102604_place_141;
var fexpr__103190 = cr102604_place_139;
return (fexpr__103190.cljs$core$IFn$_invoke$arity$2 ? fexpr__103190.cljs$core$IFn$_invoke$arity$2(G__103191,G__103193) : fexpr__103190.call(null,G__103191,G__103193));
})();
var cr102604_place_143 = frontend.worker.rtc.client_op.remove_local_tx;
var cr102604_place_144 = repo;
var cr102604_place_145 = (function (){var G__103201 = cr102604_place_144;
var fexpr__103200 = cr102604_place_143;
return (fexpr__103200.cljs$core$IFn$_invoke$arity$1 ? fexpr__103200.cljs$core$IFn$_invoke$arity$1(G__103201) : fexpr__103200.call(null,G__103201));
})();
var cr102604_place_146 = frontend.worker.rtc.client_op.add_all_exists_asset_as_ops;
var cr102604_place_147 = repo;
var cr102604_place_148 = (function (){var G__103203 = cr102604_place_147;
var fexpr__103202 = cr102604_place_146;
return (fexpr__103202.cljs$core$IFn$_invoke$arity$1 ? fexpr__103202.cljs$core$IFn$_invoke$arity$1(G__103203) : fexpr__103202.call(null,G__103203));
})();
var cr102604_place_149 = frontend.worker.crypt.store_graph_keys_jwk;
var cr102604_place_150 = repo;
var cr102604_place_151 = cr102604_place_90;
var cr102604_place_152 = (function (){var G__103206 = cr102604_place_150;
var G__103207 = cr102604_place_151;
var fexpr__103205 = cr102604_place_149;
return (fexpr__103205.cljs$core$IFn$_invoke$arity$2 ? fexpr__103205.cljs$core$IFn$_invoke$arity$2(G__103206,G__103207) : fexpr__103205.call(null,G__103206,G__103207));
})();
var cr102604_place_153 = frontend.worker.rtc.const$.RTC_E2E_TEST;
var cr102604_place_154 = null;
if(cr102604_place_153){
(cr102604_state[(0)] = cr102604_block_10);

(cr102604_state[(2)] = null);

(cr102604_state[(1)] = null);

(cr102604_state[(1)] = cr102604_place_154);

(cr102604_state[(2)] = cr102604_place_117);

return cr102604_state;
} else {
(cr102604_state[(0)] = cr102604_block_8);

(cr102604_state[(2)] = null);

(cr102604_state[(1)] = null);

(cr102604_state[(1)] = cr102604_place_154);

(cr102604_state[(2)] = cr102604_place_117);

return cr102604_state;
}
}catch (e103158){var cr102604_exception = e103158;
(cr102604_state[(0)] = null);

(cr102604_state[(2)] = null);

(cr102604_state[(3)] = null);

(cr102604_state[(1)] = null);

throw cr102604_exception;
}});
var cr102604_block_8 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr102604_block_8(cr102604_state){
try{var cr102604_place_117 = (cr102604_state[(2)]);
var cr102604_place_155 = frontend.common.missionary._LT__BANG_;
var cr102604_place_156 = frontend.worker.db_metadata._LT_store;
var cr102604_place_157 = repo;
var cr102604_place_158 = cljs.core.pr_str;
var cr102604_place_159 = new cljs.core.Keyword("kv","value","kv/value",305981670);
var cr102604_place_160 = cr102604_place_117;
var cr102604_place_161 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr102604_place_159,cr102604_place_160]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr102604_place_162 = (function (){var G__103223 = cr102604_place_161;
var fexpr__103222 = cr102604_place_158;
return (fexpr__103222.cljs$core$IFn$_invoke$arity$1 ? fexpr__103222.cljs$core$IFn$_invoke$arity$1(G__103223) : fexpr__103222.call(null,G__103223));
})();
var cr102604_place_163 = (function (){var G__103230 = cr102604_place_157;
var G__103231 = cr102604_place_162;
var fexpr__103229 = cr102604_place_156;
return (fexpr__103229.cljs$core$IFn$_invoke$arity$2 ? fexpr__103229.cljs$core$IFn$_invoke$arity$2(G__103230,G__103231) : fexpr__103229.call(null,G__103230,G__103231));
})();
var cr102604_place_164 = (function (){var G__103235 = cr102604_place_163;
var fexpr__103234 = cr102604_place_155;
return (fexpr__103234.cljs$core$IFn$_invoke$arity$1 ? fexpr__103234.cljs$core$IFn$_invoke$arity$1(G__103235) : fexpr__103234.call(null,G__103235));
})();
(cr102604_state[(0)] = cr102604_block_9);

return missionary.core.park(cr102604_place_164);
}catch (e103214){var cr102604_exception = e103214;
(cr102604_state[(0)] = null);

(cr102604_state[(1)] = null);

(cr102604_state[(3)] = null);

(cr102604_state[(2)] = null);

throw cr102604_exception;
}});
var cr102604_block_9 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr102604_block_9(cr102604_state){
try{var cr102604_place_165 = missionary.core.unpark();
(cr102604_state[(0)] = cr102604_block_11);

(cr102604_state[(1)] = cr102604_place_165);

return cr102604_state;
}catch (e103238){var cr102604_exception = e103238;
(cr102604_state[(0)] = null);

(cr102604_state[(1)] = null);

(cr102604_state[(3)] = null);

(cr102604_state[(2)] = null);

throw cr102604_exception;
}});
var cr102604_block_11 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr102604_block_11(cr102604_state){
try{var cr102604_place_154 = (cr102604_state[(1)]);
var cr102604_place_117 = (cr102604_state[(2)]);
var cr102604_place_167 = frontend.worker.rtc.log_and_state.rtc_log;
var cr102604_place_168 = new cljs.core.Keyword("rtc.log","upload","rtc.log/upload",-1832742059);
var cr102604_place_169 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr102604_place_170 = new cljs.core.Keyword(null,"upload-completed","upload-completed",-769495446);
var cr102604_place_171 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr102604_place_172 = "upload-graph completed";
var cr102604_place_173 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr102604_place_171,cr102604_place_172,cr102604_place_169,cr102604_place_170]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr102604_place_174 = (function (){var G__103252 = cr102604_place_168;
var G__103253 = cr102604_place_173;
var fexpr__103251 = cr102604_place_167;
return (fexpr__103251.cljs$core$IFn$_invoke$arity$2 ? fexpr__103251.cljs$core$IFn$_invoke$arity$2(G__103252,G__103253) : fexpr__103251.call(null,G__103252,G__103253));
})();
var cr102604_place_175 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr102604_place_176 = cr102604_place_117;
var cr102604_place_177 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr102604_place_175,cr102604_place_176]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
(cr102604_state[(0)] = cr102604_block_12);

(cr102604_state[(1)] = null);

(cr102604_state[(2)] = null);

(cr102604_state[(3)] = cr102604_place_177);

return cr102604_state;
}catch (e103244){var cr102604_exception = e103244;
(cr102604_state[(0)] = null);

(cr102604_state[(1)] = null);

(cr102604_state[(3)] = null);

(cr102604_state[(2)] = null);

throw cr102604_exception;
}});
var cr102604_block_5 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr102604_block_5(cr102604_state){
try{var cr102604_place_104 = missionary.core.unpark();
var cr102604_place_105 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr102604_place_106 = cr102604_place_104;
var cr102604_place_107 = cr102604_place_105.cljs$core$IFn$_invoke$arity$1(cr102604_place_106);
var cr102604_place_108 = cr102604_place_107;
var cr102604_place_109 = null;
if(cljs.core.truth_(cr102604_place_108)){
(cr102604_state[(0)] = cr102604_block_7);

(cr102604_state[(2)] = cr102604_place_107);

(cr102604_state[(3)] = cr102604_place_109);

return cr102604_state;
} else {
(cr102604_state[(0)] = cr102604_block_6);

(cr102604_state[(1)] = null);

(cr102604_state[(1)] = cr102604_place_104);

return cr102604_state;
}
}catch (e103259){var cr102604_exception = e103259;
(cr102604_state[(0)] = null);

(cr102604_state[(1)] = null);

throw cr102604_exception;
}});
var cr102604_block_3 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr102604_block_3(cr102604_state){
try{var cr102604_place_82 = missionary.core.unpark();
var cr102604_place_83 = logseq.db.write_transit_str;
var cr102604_place_84 = frontend.common.missionary._LT__BANG_;
var cr102604_place_85 = frontend.worker.crypt._LT_export_key;
var cr102604_place_86 = cr102604_place_82;
var cr102604_place_87 = (function (){var G__103273 = cr102604_place_86;
var fexpr__103272 = cr102604_place_85;
return (fexpr__103272.cljs$core$IFn$_invoke$arity$1 ? fexpr__103272.cljs$core$IFn$_invoke$arity$1(G__103273) : fexpr__103272.call(null,G__103273));
})();
var cr102604_place_88 = (function (){var G__103276 = cr102604_place_87;
var fexpr__103275 = cr102604_place_84;
return (fexpr__103275.cljs$core$IFn$_invoke$arity$1 ? fexpr__103275.cljs$core$IFn$_invoke$arity$1(G__103276) : fexpr__103275.call(null,G__103276));
})();
(cr102604_state[(0)] = cr102604_block_4);

(cr102604_state[(2)] = cr102604_place_83);

return missionary.core.park(cr102604_place_88);
}catch (e103268){var cr102604_exception = e103268;
(cr102604_state[(0)] = null);

(cr102604_state[(1)] = null);

throw cr102604_exception;
}});
var cr102604_block_6 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr102604_block_6(cr102604_state){
try{var cr102604_place_104 = (cr102604_state[(1)]);
var cr102604_place_110 = cljs.core.ex_info;
var cr102604_place_111 = "upload-graph failed";
var cr102604_place_112 = new cljs.core.Keyword(null,"upload-resp","upload-resp",-2088142426);
var cr102604_place_113 = cr102604_place_104;
var cr102604_place_114 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr102604_place_112,cr102604_place_113]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr102604_place_115 = (function (){var G__103281 = cr102604_place_111;
var G__103282 = cr102604_place_114;
var fexpr__103280 = cr102604_place_110;
return (fexpr__103280.cljs$core$IFn$_invoke$arity$2 ? fexpr__103280.cljs$core$IFn$_invoke$arity$2(G__103281,G__103282) : fexpr__103280.call(null,G__103281,G__103282));
})();
var cr102604_place_116 = (function(){throw cr102604_place_115})();
(cr102604_state[(0)] = null);

(cr102604_state[(1)] = null);

return null;
}catch (e103279){var cr102604_exception = e103279;
(cr102604_state[(0)] = null);

(cr102604_state[(1)] = null);

throw cr102604_exception;
}});
var cr102604_block_1 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr102604_block_1(cr102604_state){
try{var cr102604_place_31 = missionary.core.unpark();
var cr102604_place_32 = cljs.core.nth;
var cr102604_place_33 = cr102604_place_31;
var cr102604_place_34 = (0);
var cr102604_place_35 = null;
var cr102604_place_36 = (function (){var G__103293 = cr102604_place_33;
var G__103294 = cr102604_place_34;
var G__103295 = cr102604_place_35;
var fexpr__103292 = cr102604_place_32;
return (fexpr__103292.cljs$core$IFn$_invoke$arity$3 ? fexpr__103292.cljs$core$IFn$_invoke$arity$3(G__103293,G__103294,G__103295) : fexpr__103292.call(null,G__103293,G__103294,G__103295));
})();
var cr102604_place_37 = cljs.core.__destructure_map;
var cr102604_place_38 = cr102604_place_36;
var cr102604_place_39 = (function (){var G__103297 = cr102604_place_38;
var fexpr__103296 = cr102604_place_37;
return (fexpr__103296.cljs$core$IFn$_invoke$arity$1 ? fexpr__103296.cljs$core$IFn$_invoke$arity$1(G__103297) : fexpr__103296.call(null,G__103297));
})();
var cr102604_place_40 = cljs.core.get;
var cr102604_place_41 = cr102604_place_39;
var cr102604_place_42 = new cljs.core.Keyword(null,"url","url",276297046);
var cr102604_place_43 = (function (){var G__103299 = cr102604_place_41;
var G__103300 = cr102604_place_42;
var fexpr__103298 = cr102604_place_40;
return (fexpr__103298.cljs$core$IFn$_invoke$arity$2 ? fexpr__103298.cljs$core$IFn$_invoke$arity$2(G__103299,G__103300) : fexpr__103298.call(null,G__103299,G__103300));
})();
var cr102604_place_44 = cljs.core.get;
var cr102604_place_45 = cr102604_place_39;
var cr102604_place_46 = new cljs.core.Keyword(null,"key","key",-1516042587);
var cr102604_place_47 = (function (){var G__103302 = cr102604_place_45;
var G__103303 = cr102604_place_46;
var fexpr__103301 = cr102604_place_44;
return (fexpr__103301.cljs$core$IFn$_invoke$arity$2 ? fexpr__103301.cljs$core$IFn$_invoke$arity$2(G__103302,G__103303) : fexpr__103301.call(null,G__103302,G__103303));
})();
var cr102604_place_48 = cljs.core.nth;
var cr102604_place_49 = cr102604_place_31;
var cr102604_place_50 = (1);
var cr102604_place_51 = null;
var cr102604_place_52 = (function (){var G__103305 = cr102604_place_49;
var G__103306 = cr102604_place_50;
var G__103307 = cr102604_place_51;
var fexpr__103304 = cr102604_place_48;
return (fexpr__103304.cljs$core$IFn$_invoke$arity$3 ? fexpr__103304.cljs$core$IFn$_invoke$arity$3(G__103305,G__103306,G__103307) : fexpr__103304.call(null,G__103305,G__103306,G__103307));
})();
var cr102604_place_53 = frontend.worker.rtc.log_and_state.rtc_log;
var cr102604_place_54 = new cljs.core.Keyword("rtc.log","upload","rtc.log/upload",-1832742059);
var cr102604_place_55 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr102604_place_56 = new cljs.core.Keyword(null,"upload-data","upload-data",690295555);
var cr102604_place_57 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr102604_place_58 = "uploading data";
var cr102604_place_59 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr102604_place_57,cr102604_place_58,cr102604_place_55,cr102604_place_56]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr102604_place_60 = (function (){var G__103310 = cr102604_place_54;
var G__103311 = cr102604_place_59;
var fexpr__103309 = cr102604_place_53;
return (fexpr__103309.cljs$core$IFn$_invoke$arity$2 ? fexpr__103309.cljs$core$IFn$_invoke$arity$2(G__103310,G__103311) : fexpr__103309.call(null,G__103310,G__103311));
})();
var cr102604_place_61 = cljs_http_missionary.client.put;
var cr102604_place_62 = cr102604_place_43;
var cr102604_place_63 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr102604_place_64 = cr102604_place_52;
var cr102604_place_65 = new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222);
var cr102604_place_66 = false;
var cr102604_place_67 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr102604_place_65,cr102604_place_66,cr102604_place_63,cr102604_place_64]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr102604_place_68 = (function (){var G__103313 = cr102604_place_62;
var G__103314 = cr102604_place_67;
var fexpr__103312 = cr102604_place_61;
return (fexpr__103312.cljs$core$IFn$_invoke$arity$2 ? fexpr__103312.cljs$core$IFn$_invoke$arity$2(G__103313,G__103314) : fexpr__103312.call(null,G__103313,G__103314));
})();
(cr102604_state[(0)] = cr102604_block_2);

(cr102604_state[(1)] = cr102604_place_47);

return missionary.core.park(cr102604_place_68);
}catch (e103291){var cr102604_exception = e103291;
(cr102604_state[(0)] = null);

throw cr102604_exception;
}});
var cr102604_block_12 = (function frontend$worker$rtc$full_upload_download_graph$new_task__upload_graph_$_cr102604_block_12(cr102604_state){
try{var cr102604_place_109 = (cr102604_state[(3)]);
(cr102604_state[(0)] = null);

(cr102604_state[(3)] = null);

return cr102604_place_109;
}catch (e103316){var cr102604_exception = e103316;
(cr102604_state[(0)] = null);

(cr102604_state[(3)] = null);

throw cr102604_exception;
}});
return cloroutine.impl.coroutine((function (){var G__103317 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__103317[(0)] = cr102604_block_0);

return G__103317;
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
var groups = cljs.core.group_by((function (p1__103332_SHARP_){
return cljs.core.boolean$(new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(p1__103332_SHARP_));
}),blocks);
var other_blocks = cljs.core.set(cljs.core.get.cljs$core$IFn$_invoke$arity$2(groups,false));
var id__GT_block = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),cljs.core.identity),blocks));
var block_id__GT_page_id = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(frontend.worker.rtc.full_upload_download_graph.page_of_block(id__GT_block,b))], null);
}),other_blocks));
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (b){
var temp__5802__auto__ = (function (){var G__103342 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b);
return (block_id__GT_page_id.cljs$core$IFn$_invoke$arity$1 ? block_id__GT_page_id.cljs$core$IFn$_invoke$arity$1(G__103342) : block_id__GT_page_id.call(null,G__103342));
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
var G__103369 = conn;
var G__103370 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(logseq.db.kv.cljs$core$IFn$_invoke$arity$2 ? logseq.db.kv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.kv","remote-schema-version","logseq.kv/remote-schema-version",988970829),schema_version) : logseq.db.kv.call(null,new cljs.core.Keyword("logseq.kv","remote-schema-version","logseq.kv/remote-schema-version",988970829),schema_version))], null);
var G__103371 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"rtc-download-graph?","rtc-download-graph?",-1013530237),true,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false], null);
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__103369,G__103370,G__103371) : datascript.core.transact_BANG_.call(null,G__103369,G__103370,G__103371));
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
var block = (function (){var G__103385 = cljs.core.deref(conn);
var G__103386 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__103385,G__103386) : datascript.core.entity.call(null,G__103385,G__103386));
})();
var refs = logseq.outliner.pipeline.db_rebuild_block_refs(cljs.core.deref(conn),block);
if(cljs.core.seq(refs)){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("block","refs","block/refs",-1214495349),refs], null);
} else {
return null;
}
}),datoms);
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,refs_tx,(function (){var G__103389 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"rtc-download-rebuild-block-refs","rtc-download-rebuild-block-refs",-672781964)], null);
if(frontend.worker.rtc.const$.RTC_E2E_TEST){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__103389,new cljs.core.Keyword("frontend.worker.pipeline","skip-store-conn","frontend.worker.pipeline/skip-store-conn",-1426692178),true);
} else {
return G__103389;
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
var G__103406 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","ident","db/ident",-737096),db_ident], null);
var G__103406__$1 = (cljs.core.truth_(value_type)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__103406,new cljs.core.Keyword("db","valueType","db/valueType",1827971944),value_type):G__103406);
var G__103406__$2 = (cljs.core.truth_(cardinality)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__103406__$1,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),cardinality):G__103406__$1);
if(cljs.core.truth_(db_index)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__103406__$2,new cljs.core.Keyword("db","index","db/index",-1531680669),db_index);
} else {
return G__103406__$2;
}
} else {
return null;
}
} else {
return null;
}
});
frontend.worker.rtc.full_upload_download_graph.blocks__GT_schema_blocks_PLUS_normal_blocks = (function frontend$worker$rtc$full_upload_download_graph$blocks__GT_schema_blocks_PLUS_normal_blocks(blocks){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p__103409,block){
var vec__103411 = p__103409;
var schema_blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103411,(0),null);
var normal_blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103411,(1),null);
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

var G__103424_104772 = conn;
var G__103425_104773 = db_initial_data;
var G__103426_104774 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"initial-db?","initial-db?",-930665302),true,new cljs.core.Keyword("frontend.worker.pipeline","skip-store-conn","frontend.worker.pipeline/skip-store-conn",-1426692178),frontend.worker.rtc.const$.RTC_E2E_TEST], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__103424_104772,G__103425_104773,G__103426_104774) : datascript.core.transact_BANG_.call(null,G__103424_104772,G__103425_104773,G__103426_104774));

frontend.worker.db_listener.listen_db_changes_BANG_(repo,conn);

var G__103428_104777 = conn;
var G__103429_104778 = init_tx_data;
var G__103430_104779 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"rtc-download-graph?","rtc-download-graph?",-1013530237),true,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword("frontend.worker.pipeline","skip-validate-db?","frontend.worker.pipeline/skip-validate-db?",-107248246),true,new cljs.core.Keyword("frontend.worker.pipeline","skip-store-conn","frontend.worker.pipeline/skip-store-conn",-1426692178),frontend.worker.rtc.const$.RTC_E2E_TEST,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__103428_104777,G__103429_104778,G__103430_104779) : datascript.core.transact_BANG_.call(null,G__103428_104777,G__103429_104778,G__103430_104779));

var G__103432_104782 = conn;
var G__103433_104783 = other_tx_data;
var G__103435_104784 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"rtc-download-graph?","rtc-download-graph?",-1013530237),true,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword("frontend.worker.pipeline","skip-store-conn","frontend.worker.pipeline/skip-store-conn",-1426692178),frontend.worker.rtc.const$.RTC_E2E_TEST,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false], null);
(datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$3(G__103432_104782,G__103433_104783,G__103435_104784) : datascript.core.transact_BANG_.call(null,G__103432_104782,G__103433_104783,G__103435_104784));

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
var G__103442 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),uuid_SINGLEQUOTE_], null);
if(cljs.core.truth_(ident)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__103442,new cljs.core.Keyword("db","ident","db/ident",-737096),ident);
} else {
return G__103442;
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
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__103461){
var vec__103462 = p__103461;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103462,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103462,(1),null);
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
var map__103480 = all_blocks;
var map__103480__$1 = cljs.core.__destructure_map(map__103480);
var _ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103480__$1,new cljs.core.Keyword(null,"_","_",1453416199));
var _t = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103480__$1,new cljs.core.Keyword(null,"_t","_t",-182793705));
var blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103480__$1,new cljs.core.Keyword(null,"blocks","blocks",-610462153));
var card_one_attrs = frontend.worker.rtc.full_upload_download_graph.blocks__GT_card_one_attrs(blocks);
var blocks1 = (cljs.core.truth_(goog.DEBUG)?(function (){var k__44919__auto__ = new cljs.core.Keyword(null,"convert-card-one-value-from-value-coll","convert-card-one-value-from-value-coll",394740882);
console.time(k__44919__auto__);

var res__44920__auto__ = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(frontend.worker.rtc.full_upload_download_graph.convert_card_one_value_from_value_coll,card_one_attrs),blocks);
console.timeEnd(k__44919__auto__);

return res__44920__auto__;
})():cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(frontend.worker.rtc.full_upload_download_graph.convert_card_one_value_from_value_coll,card_one_attrs),blocks));
var blocks2 = (cljs.core.truth_(goog.DEBUG)?(function (){var k__44919__auto__ = new cljs.core.Keyword(null,"normalize-remote-blocks","normalize-remote-blocks",1366081985);
console.time(k__44919__auto__);

var res__44920__auto__ = (frontend.worker.rtc.full_upload_download_graph.normalized_remote_blocks_coercer.cljs$core$IFn$_invoke$arity$1 ? frontend.worker.rtc.full_upload_download_graph.normalized_remote_blocks_coercer.cljs$core$IFn$_invoke$arity$1(blocks1) : frontend.worker.rtc.full_upload_download_graph.normalized_remote_blocks_coercer.call(null,blocks1));
console.timeEnd(k__44919__auto__);

return res__44920__auto__;
})():(frontend.worker.rtc.full_upload_download_graph.normalized_remote_blocks_coercer.cljs$core$IFn$_invoke$arity$1 ? frontend.worker.rtc.full_upload_download_graph.normalized_remote_blocks_coercer.cljs$core$IFn$_invoke$arity$1(blocks1) : frontend.worker.rtc.full_upload_download_graph.normalized_remote_blocks_coercer.call(null,blocks1)));
var blocks__$1 = cljs.core.sequence.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$3(cljs.core.map.cljs$core$IFn$_invoke$arity$1((function (p1__103471_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__103471_SHARP_,new cljs.core.Keyword("client","schema","client/schema",-238707506));
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
var vec__103511 = frontend.worker.rtc.full_upload_download_graph.blocks__GT_schema_blocks_PLUS_normal_blocks(blocks);
var schema_blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103511,(0),null);
var normal_blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__103511,(1),null);
var tx_data = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(frontend.worker.rtc.full_upload_download_graph.blocks_resolve_temp_id(schema_blocks,normal_blocks),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(logseq.db.kv.cljs$core$IFn$_invoke$arity$2 ? logseq.db.kv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.kv","graph-uuid","logseq.kv/graph-uuid",339522676),graph_uuid) : logseq.db.kv.call(null,new cljs.core.Keyword("logseq.kv","graph-uuid","logseq.kv/graph-uuid",339522676),graph_uuid))], null));
var init_tx_data = cljs.core.cons((logseq.db.kv.cljs$core$IFn$_invoke$arity$2 ? logseq.db.kv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.kv","db-type","logseq.kv/db-type",1106888767),"db") : logseq.db.kv.call(null,new cljs.core.Keyword("logseq.kv","db-type","logseq.kv/db-type",1106888767),"db")),schema_blocks);
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"remote-t","remote-t",-1375604239),t,new cljs.core.Keyword(null,"init-tx-data","init-tx-data",984393770),init_tx_data,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),tx_data], null);
});
frontend.worker.rtc.full_upload_download_graph.new_task__transact_remote_all_blocks_BANG_ = (function frontend$worker$rtc$full_upload_download_graph$new_task__transact_remote_all_blocks_BANG_(all_blocks,repo,graph_uuid){
var map__103523 = frontend.worker.rtc.full_upload_download_graph.remote_all_blocks__GT_tx_data_PLUS_t(all_blocks,graph_uuid);
var map__103523__$1 = cljs.core.__destructure_map(map__103523);
var remote_t = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103523__$1,new cljs.core.Keyword(null,"remote-t","remote-t",-1375604239));
var init_tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103523__$1,new cljs.core.Keyword(null,"init-tx-data","init-tx-data",984393770));
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__103523__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr103525_block_0 = (function frontend$worker$rtc$full_upload_download_graph$new_task__transact_remote_all_blocks_BANG__$_cr103525_block_0(cr103525_state){
try{var cr103525_place_0 = frontend.worker.rtc.client_op.update_local_tx;
var cr103525_place_1 = repo;
var cr103525_place_2 = remote_t;
var cr103525_place_3 = (function (){var G__103694 = cr103525_place_1;
var G__103695 = cr103525_place_2;
var fexpr__103693 = cr103525_place_0;
return (fexpr__103693.cljs$core$IFn$_invoke$arity$2 ? fexpr__103693.cljs$core$IFn$_invoke$arity$2(G__103694,G__103695) : fexpr__103693.call(null,G__103694,G__103695));
})();
var cr103525_place_4 = frontend.worker.rtc.log_and_state.update_local_t;
var cr103525_place_5 = graph_uuid;
var cr103525_place_6 = remote_t;
var cr103525_place_7 = (function (){var G__103697 = cr103525_place_5;
var G__103698 = cr103525_place_6;
var fexpr__103696 = cr103525_place_4;
return (fexpr__103696.cljs$core$IFn$_invoke$arity$2 ? fexpr__103696.cljs$core$IFn$_invoke$arity$2(G__103697,G__103698) : fexpr__103696.call(null,G__103697,G__103698));
})();
var cr103525_place_8 = frontend.worker.rtc.log_and_state.update_remote_t;
var cr103525_place_9 = graph_uuid;
var cr103525_place_10 = remote_t;
var cr103525_place_11 = (function (){var G__103700 = cr103525_place_9;
var G__103701 = cr103525_place_10;
var fexpr__103699 = cr103525_place_8;
return (fexpr__103699.cljs$core$IFn$_invoke$arity$2 ? fexpr__103699.cljs$core$IFn$_invoke$arity$2(G__103700,G__103701) : fexpr__103699.call(null,G__103700,G__103701));
})();
var cr103525_place_12 = frontend.worker.rtc.const$.RTC_E2E_TEST;
var cr103525_place_13 = null;
if(cr103525_place_12){
(cr103525_state[(0)] = cr103525_block_3);

(cr103525_state[(1)] = cr103525_place_13);

return cr103525_state;
} else {
(cr103525_state[(0)] = cr103525_block_1);

(cr103525_state[(1)] = cr103525_place_13);

return cr103525_state;
}
}catch (e103692){var cr103525_exception = e103692;
(cr103525_state[(0)] = null);

throw cr103525_exception;
}});
var cr103525_block_1 = (function frontend$worker$rtc$full_upload_download_graph$new_task__transact_remote_all_blocks_BANG__$_cr103525_block_1(cr103525_state){
try{var cr103525_place_14 = frontend.common.missionary._LT__BANG_;
var cr103525_place_15 = promesa.protocols._mcat;
var cr103525_place_16 = promesa.protocols._promise;
var cr103525_place_17 = null;
var cr103525_place_18 = (function (){var G__103704 = cr103525_place_17;
var fexpr__103703 = cr103525_place_16;
return (fexpr__103703.cljs$core$IFn$_invoke$arity$1 ? fexpr__103703.cljs$core$IFn$_invoke$arity$1(G__103704) : fexpr__103703.call(null,G__103704));
})();
var cr103525_place_19 = (function (___41604__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__103535 = repo;
var G__103536 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"close-other-db?","close-other-db?",-1978674579),false], null);
var fexpr__103534 = (function (){var fexpr__103537 = cljs.core.deref(frontend.common.thread_api._STAR_thread_apis);
var fexpr__103705 = fexpr__103537;
return (fexpr__103705.cljs$core$IFn$_invoke$arity$1 ? fexpr__103705.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("thread-api","create-or-open-db","thread-api/create-or-open-db",1100871183)) : fexpr__103705.call(null,new cljs.core.Keyword("thread-api","create-or-open-db","thread-api/create-or-open-db",1100871183)));
})();
var G__103708 = G__103535;
var G__103709 = G__103536;
var fexpr__103707 = fexpr__103534;
return (fexpr__103707.cljs$core$IFn$_invoke$arity$2 ? fexpr__103707.cljs$core$IFn$_invoke$arity$2(G__103708,G__103709) : fexpr__103707.call(null,G__103708,G__103709));
})()),(function (___41594__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var fexpr__103551 = (function (){var fexpr__103552 = cljs.core.deref(frontend.common.thread_api._STAR_thread_apis);
var fexpr__103710 = fexpr__103552;
return (fexpr__103710.cljs$core$IFn$_invoke$arity$1 ? fexpr__103710.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("thread-api","export-db","thread-api/export-db",1376034690)) : fexpr__103710.call(null,new cljs.core.Keyword("thread-api","export-db","thread-api/export-db",1376034690)));
})();
var G__103712 = repo;
var fexpr__103711 = fexpr__103551;
return (fexpr__103711.cljs$core$IFn$_invoke$arity$1 ? fexpr__103711.cljs$core$IFn$_invoke$arity$1(G__103712) : fexpr__103711.call(null,G__103712));
})()),(function (___41594__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__103557 = repo;
var G__103558 = init_tx_data;
var G__103559 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"rtc-download-graph?","rtc-download-graph?",-1013530237),true,new cljs.core.Keyword("frontend.worker.pipeline","skip-validate-db?","frontend.worker.pipeline/skip-validate-db?",-107248246),true,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false], null);
var G__103560 = frontend.worker.state.get_context();
var fexpr__103556 = (function (){var fexpr__103562 = cljs.core.deref(frontend.common.thread_api._STAR_thread_apis);
var fexpr__103717 = fexpr__103562;
return (fexpr__103717.cljs$core$IFn$_invoke$arity$1 ? fexpr__103717.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("thread-api","transact","thread-api/transact",917721609)) : fexpr__103717.call(null,new cljs.core.Keyword("thread-api","transact","thread-api/transact",917721609)));
})();
var G__103719 = G__103557;
var G__103720 = G__103558;
var G__103721 = G__103559;
var G__103722 = G__103560;
var fexpr__103718 = fexpr__103556;
return (fexpr__103718.cljs$core$IFn$_invoke$arity$4 ? fexpr__103718.cljs$core$IFn$_invoke$arity$4(G__103719,G__103720,G__103721,G__103722) : fexpr__103718.call(null,G__103719,G__103720,G__103721,G__103722));
})()),(function (___41594__auto____$2){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__103565 = repo;
var G__103566 = tx_data;
var G__103567 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"rtc-download-graph?","rtc-download-graph?",-1013530237),true,new cljs.core.Keyword(null,"gen-undo-ops?","gen-undo-ops?",324292975),false,new cljs.core.Keyword(null,"persist-op?","persist-op?",-531287534),false], null);
var G__103568 = frontend.worker.state.get_context();
var fexpr__103564 = (function (){var fexpr__103570 = cljs.core.deref(frontend.common.thread_api._STAR_thread_apis);
var fexpr__103724 = fexpr__103570;
return (fexpr__103724.cljs$core$IFn$_invoke$arity$1 ? fexpr__103724.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("thread-api","transact","thread-api/transact",917721609)) : fexpr__103724.call(null,new cljs.core.Keyword("thread-api","transact","thread-api/transact",917721609)));
})();
var G__103726 = G__103565;
var G__103727 = G__103566;
var G__103728 = G__103567;
var G__103729 = G__103568;
var fexpr__103725 = fexpr__103564;
return (fexpr__103725.cljs$core$IFn$_invoke$arity$4 ? fexpr__103725.cljs$core$IFn$_invoke$arity$4(G__103726,G__103727,G__103728,G__103729) : fexpr__103725.call(null,G__103726,G__103727,G__103728,G__103729));
})()),(function (___41594__auto____$3){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.rtc.full_upload_download_graph.transact_remote_schema_version_BANG_(repo)),(function (___41594__auto____$4){
return promesa.protocols._promise(frontend.worker.rtc.full_upload_download_graph.transact_block_refs_BANG_(repo));
}));
}));
}));
}));
}));
});
var cr103525_place_20 = (function (){var G__103732 = cr103525_place_18;
var G__103733 = cr103525_place_19;
var fexpr__103731 = cr103525_place_15;
return (fexpr__103731.cljs$core$IFn$_invoke$arity$2 ? fexpr__103731.cljs$core$IFn$_invoke$arity$2(G__103732,G__103733) : fexpr__103731.call(null,G__103732,G__103733));
})();
var cr103525_place_21 = (function (){var G__103735 = cr103525_place_20;
var fexpr__103734 = cr103525_place_14;
return (fexpr__103734.cljs$core$IFn$_invoke$arity$1 ? fexpr__103734.cljs$core$IFn$_invoke$arity$1(G__103735) : fexpr__103734.call(null,G__103735));
})();
(cr103525_state[(0)] = cr103525_block_2);

return missionary.core.park(cr103525_place_21);
}catch (e103702){var cr103525_exception = e103702;
(cr103525_state[(0)] = null);

(cr103525_state[(1)] = null);

throw cr103525_exception;
}});
var cr103525_block_2 = (function frontend$worker$rtc$full_upload_download_graph$new_task__transact_remote_all_blocks_BANG__$_cr103525_block_2(cr103525_state){
try{var cr103525_place_22 = missionary.core.unpark();
(cr103525_state[(0)] = cr103525_block_4);

(cr103525_state[(1)] = cr103525_place_22);

return cr103525_state;
}catch (e103737){var cr103525_exception = e103737;
(cr103525_state[(0)] = null);

(cr103525_state[(1)] = null);

throw cr103525_exception;
}});
var cr103525_block_3 = (function frontend$worker$rtc$full_upload_download_graph$new_task__transact_remote_all_blocks_BANG__$_cr103525_block_3(cr103525_state){
try{var cr103525_place_23 = frontend.worker.rtc.full_upload_download_graph.create_graph_for_rtc_test;
var cr103525_place_24 = repo;
var cr103525_place_25 = init_tx_data;
var cr103525_place_26 = tx_data;
var cr103525_place_27 = (function (){var G__103741 = cr103525_place_24;
var G__103742 = cr103525_place_25;
var G__103743 = cr103525_place_26;
var fexpr__103740 = cr103525_place_23;
return (fexpr__103740.cljs$core$IFn$_invoke$arity$3 ? fexpr__103740.cljs$core$IFn$_invoke$arity$3(G__103741,G__103742,G__103743) : fexpr__103740.call(null,G__103741,G__103742,G__103743));
})();
(cr103525_state[(0)] = cr103525_block_4);

(cr103525_state[(1)] = cr103525_place_27);

return cr103525_state;
}catch (e103738){var cr103525_exception = e103738;
(cr103525_state[(0)] = null);

(cr103525_state[(1)] = null);

throw cr103525_exception;
}});
var cr103525_block_4 = (function frontend$worker$rtc$full_upload_download_graph$new_task__transact_remote_all_blocks_BANG__$_cr103525_block_4(cr103525_state){
try{var cr103525_place_13 = (cr103525_state[(1)]);
var cr103525_place_28 = frontend.worker.shared_service.broadcast_to_clients_BANG_;
var cr103525_place_29 = new cljs.core.Keyword(null,"add-repo","add-repo",1885345931);
var cr103525_place_30 = new cljs.core.Keyword(null,"repo","repo",-1999060679);
var cr103525_place_31 = repo;
var cr103525_place_32 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr103525_place_30,cr103525_place_31]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr103525_place_33 = (function (){var G__103755 = cr103525_place_29;
var G__103756 = cr103525_place_32;
var fexpr__103754 = cr103525_place_28;
return (fexpr__103754.cljs$core$IFn$_invoke$arity$2 ? fexpr__103754.cljs$core$IFn$_invoke$arity$2(G__103755,G__103756) : fexpr__103754.call(null,G__103755,G__103756));
})();
(cr103525_state[(0)] = null);

(cr103525_state[(1)] = null);

return cr103525_place_33;
}catch (e103747){var cr103525_exception = e103747;
(cr103525_state[(0)] = null);

(cr103525_state[(1)] = null);

throw cr103525_exception;
}});
return cloroutine.impl.coroutine((function (){var G__103758 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((2));
(G__103758[(0)] = cr103525_block_0);

return G__103758;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.full_upload_download_graph.new_task__request_download_graph = (function frontend$worker$rtc$full_upload_download_graph$new_task__request_download_graph(get_ws_create_task,graph_uuid,schema_version){
frontend.worker.rtc.log_and_state.rtc_log(new cljs.core.Keyword("rtc.log","download","rtc.log/download",-2144210573),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"sub-type","sub-type",-997954412),new cljs.core.Keyword(null,"request-download-graph","request-download-graph",548122945),new cljs.core.Keyword(null,"message","message",-406056002),"requesting download graph",new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid,new cljs.core.Keyword(null,"schema-version","schema-version",1117939594),schema_version], null));

return missionary.core.join.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"download-info-uuid","download-info-uuid",-511621154),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.worker.rtc.ws_util.send_AMPERSAND_recv(get_ws_create_task,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"action","action",-811238024),"download-graph",new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522),graph_uuid,new cljs.core.Keyword(null,"schema-version","schema-version",1117939594),cljs.core.str.cljs$core$IFn$_invoke$arity$1(schema_version)], null))], 0));
});
frontend.worker.rtc.full_upload_download_graph.new_task__wait_download_info_ready = (function frontend$worker$rtc$full_upload_download_graph$new_task__wait_download_info_ready(get_ws_create_task,download_info_uuid,graph_uuid,schema_version,timeout_ms){
return missionary.core.timeout.cljs$core$IFn$_invoke$arity$3(cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr103770_block_0 = (function frontend$worker$rtc$full_upload_download_graph$new_task__wait_download_info_ready_$_cr103770_block_0(cr103770_state){
try{var cr103770_place_0 = frontend.worker.rtc.log_and_state.rtc_log;
var cr103770_place_1 = new cljs.core.Keyword("rtc.log","download","rtc.log/download",-2144210573);
var cr103770_place_2 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr103770_place_3 = new cljs.core.Keyword(null,"wait-remote-graph-data-ready","wait-remote-graph-data-ready",168925556);
var cr103770_place_4 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr103770_place_5 = "waiting for the remote to prepare the data";
var cr103770_place_6 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr103770_place_7 = graph_uuid;
var cr103770_place_8 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr103770_place_4,cr103770_place_5,cr103770_place_6,cr103770_place_7,cr103770_place_2,cr103770_place_3]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr103770_place_9 = (function (){var G__103843 = cr103770_place_1;
var G__103844 = cr103770_place_8;
var fexpr__103842 = cr103770_place_0;
return (fexpr__103842.cljs$core$IFn$_invoke$arity$2 ? fexpr__103842.cljs$core$IFn$_invoke$arity$2(G__103843,G__103844) : fexpr__103842.call(null,G__103843,G__103844));
})();
(cr103770_state[(0)] = cr103770_block_1);

return cr103770_state;
}catch (e103836){var cr103770_exception = e103836;
(cr103770_state[(0)] = null);

throw cr103770_exception;
}});
var cr103770_block_1 = (function frontend$worker$rtc$full_upload_download_graph$new_task__wait_download_info_ready_$_cr103770_block_1(cr103770_state){
try{var cr103770_place_10 = missionary.core.sleep;
var cr103770_place_11 = (3000);
var cr103770_place_12 = (function (){var G__103851 = cr103770_place_11;
var fexpr__103850 = cr103770_place_10;
return (fexpr__103850.cljs$core$IFn$_invoke$arity$1 ? fexpr__103850.cljs$core$IFn$_invoke$arity$1(G__103851) : fexpr__103850.call(null,G__103851));
})();
(cr103770_state[(0)] = cr103770_block_2);

return missionary.core.park(cr103770_place_12);
}catch (e103849){var cr103770_exception = e103849;
(cr103770_state[(0)] = null);

throw cr103770_exception;
}});
var cr103770_block_2 = (function frontend$worker$rtc$full_upload_download_graph$new_task__wait_download_info_ready_$_cr103770_block_2(cr103770_state){
try{var cr103770_place_13 = missionary.core.unpark();
var cr103770_place_14 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr103770_place_15 = get_ws_create_task;
var cr103770_place_16 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr103770_place_17 = "download-info-list";
var cr103770_place_18 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr103770_place_19 = graph_uuid;
var cr103770_place_20 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr103770_place_21 = schema_version;
var cr103770_place_22 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr103770_place_21);
var cr103770_place_23 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr103770_place_20,cr103770_place_22,cr103770_place_16,cr103770_place_17,cr103770_place_18,cr103770_place_19]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr103770_place_24 = (function (){var G__103855 = cr103770_place_15;
var G__103856 = cr103770_place_23;
var fexpr__103854 = cr103770_place_14;
return (fexpr__103854.cljs$core$IFn$_invoke$arity$2 ? fexpr__103854.cljs$core$IFn$_invoke$arity$2(G__103855,G__103856) : fexpr__103854.call(null,G__103855,G__103856));
})();
(cr103770_state[(0)] = cr103770_block_3);

return missionary.core.park(cr103770_place_24);
}catch (e103853){var cr103770_exception = e103853;
(cr103770_state[(0)] = null);

throw cr103770_exception;
}});
var cr103770_block_3 = (function frontend$worker$rtc$full_upload_download_graph$new_task__wait_download_info_ready_$_cr103770_block_3(cr103770_state){
try{var cr103770_place_25 = missionary.core.unpark();
var cr103770_place_26 = cljs.core.__destructure_map;
var cr103770_place_27 = cr103770_place_25;
var cr103770_place_28 = (function (){var G__103864 = cr103770_place_27;
var fexpr__103863 = cr103770_place_26;
return (fexpr__103863.cljs$core$IFn$_invoke$arity$1 ? fexpr__103863.cljs$core$IFn$_invoke$arity$1(G__103864) : fexpr__103863.call(null,G__103864));
})();
var cr103770_place_29 = cljs.core.get;
var cr103770_place_30 = cr103770_place_28;
var cr103770_place_31 = new cljs.core.Keyword(null,"download-info-list","download-info-list",527425110);
var cr103770_place_32 = (function (){var G__103867 = cr103770_place_30;
var G__103868 = cr103770_place_31;
var fexpr__103866 = cr103770_place_29;
return (fexpr__103866.cljs$core$IFn$_invoke$arity$2 ? fexpr__103866.cljs$core$IFn$_invoke$arity$2(G__103867,G__103868) : fexpr__103866.call(null,G__103867,G__103868));
})();
var cr103770_place_33 = cljs.core.some;
var cr103770_place_34 = (function (download_info){
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
var cr103770_place_35 = cr103770_place_32;
var cr103770_place_36 = (function (){var G__103874 = cr103770_place_34;
var G__103875 = cr103770_place_35;
var fexpr__103873 = cr103770_place_33;
return (fexpr__103873.cljs$core$IFn$_invoke$arity$2 ? fexpr__103873.cljs$core$IFn$_invoke$arity$2(G__103874,G__103875) : fexpr__103873.call(null,G__103874,G__103875));
})();
var cr103770_place_37 = cr103770_place_36;
var cr103770_place_38 = null;
if(cljs.core.truth_(cr103770_place_37)){
(cr103770_state[(0)] = cr103770_block_5);

(cr103770_state[(1)] = cr103770_place_36);

(cr103770_state[(2)] = cr103770_place_38);

return cr103770_state;
} else {
(cr103770_state[(0)] = cr103770_block_4);

return cr103770_state;
}
}catch (e103862){var cr103770_exception = e103862;
(cr103770_state[(0)] = null);

throw cr103770_exception;
}});
var cr103770_block_4 = (function frontend$worker$rtc$full_upload_download_graph$new_task__wait_download_info_ready_$_cr103770_block_4(cr103770_state){
try{(cr103770_state[(0)] = cr103770_block_1);

return cr103770_state;
}catch (e103877){var cr103770_exception = e103877;
(cr103770_state[(0)] = null);

throw cr103770_exception;
}});
var cr103770_block_5 = (function frontend$worker$rtc$full_upload_download_graph$new_task__wait_download_info_ready_$_cr103770_block_5(cr103770_state){
try{var cr103770_place_36 = (cr103770_state[(1)]);
var cr103770_place_39 = cr103770_place_36;
var cr103770_place_40 = cr103770_place_39;
(cr103770_state[(0)] = cr103770_block_6);

(cr103770_state[(1)] = null);

(cr103770_state[(2)] = cr103770_place_40);

return cr103770_state;
}catch (e103879){var cr103770_exception = e103879;
(cr103770_state[(0)] = null);

(cr103770_state[(1)] = null);

(cr103770_state[(2)] = null);

throw cr103770_exception;
}});
var cr103770_block_6 = (function frontend$worker$rtc$full_upload_download_graph$new_task__wait_download_info_ready_$_cr103770_block_6(cr103770_state){
try{var cr103770_place_38 = (cr103770_state[(2)]);
(cr103770_state[(0)] = null);

(cr103770_state[(2)] = null);

return cr103770_place_38;
}catch (e103881){var cr103770_exception = e103881;
(cr103770_state[(0)] = null);

(cr103770_state[(2)] = null);

throw cr103770_exception;
}});
return cloroutine.impl.coroutine((function (){var G__103882 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__103882[(0)] = cr103770_block_0);

return G__103882;
})());
})(),missionary.core.sp_run),timeout_ms,new cljs.core.Keyword(null,"timeout","timeout",-318625318));
});
frontend.worker.rtc.full_upload_download_graph.new_task__download_graph_from_s3 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3(graph_uuid,graph_name,s3_url){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr103891_block_9 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr103891_block_9(cr103891_state){
try{var cr103891_place_36 = (cr103891_state[(2)]);
(cr103891_state[(0)] = null);

(cr103891_state[(2)] = null);

return cr103891_place_36;
}catch (e104063){var cr103891_exception = e104063;
(cr103891_state[(0)] = null);

(cr103891_state[(2)] = null);

throw cr103891_exception;
}});
var cr103891_block_4 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr103891_block_4(cr103891_state){
try{var cr103891_place_31 = (cr103891_state[(1)]);
var cr103891_place_65 = frontend.common.missionary._LT__BANG_;
var cr103891_place_66 = frontend.worker.db_metadata._LT_store;
var cr103891_place_67 = cr103891_place_31;
var cr103891_place_68 = cljs.core.pr_str;
var cr103891_place_69 = new cljs.core.Keyword("kv","value","kv/value",305981670);
var cr103891_place_70 = graph_uuid;
var cr103891_place_71 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr103891_place_69,cr103891_place_70]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr103891_place_72 = (function (){var G__104069 = cr103891_place_71;
var fexpr__104068 = cr103891_place_68;
return (fexpr__104068.cljs$core$IFn$_invoke$arity$1 ? fexpr__104068.cljs$core$IFn$_invoke$arity$1(G__104069) : fexpr__104068.call(null,G__104069));
})();
var cr103891_place_73 = (function (){var G__104071 = cr103891_place_67;
var G__104072 = cr103891_place_72;
var fexpr__104070 = cr103891_place_66;
return (fexpr__104070.cljs$core$IFn$_invoke$arity$2 ? fexpr__104070.cljs$core$IFn$_invoke$arity$2(G__104071,G__104072) : fexpr__104070.call(null,G__104071,G__104072));
})();
var cr103891_place_74 = (function (){var G__104075 = cr103891_place_73;
var fexpr__104074 = cr103891_place_65;
return (fexpr__104074.cljs$core$IFn$_invoke$arity$1 ? fexpr__104074.cljs$core$IFn$_invoke$arity$1(G__104075) : fexpr__104074.call(null,G__104075));
})();
(cr103891_state[(0)] = cr103891_block_5);

(cr103891_state[(1)] = null);

return missionary.core.park(cr103891_place_74);
}catch (e104065){var cr103891_exception = e104065;
(cr103891_state[(0)] = null);

(cr103891_state[(1)] = null);

(cr103891_state[(2)] = null);

(cr103891_state[(3)] = null);

throw cr103891_exception;
}});
var cr103891_block_3 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr103891_block_3(cr103891_state){
try{var cr103891_place_31 = (cr103891_state[(1)]);
var cr103891_place_58 = missionary.core.unpark();
var cr103891_place_59 = frontend.worker.rtc.client_op.update_graph_uuid;
var cr103891_place_60 = cr103891_place_31;
var cr103891_place_61 = graph_uuid;
var cr103891_place_62 = (function (){var G__104078 = cr103891_place_60;
var G__104079 = cr103891_place_61;
var fexpr__104077 = cr103891_place_59;
return (fexpr__104077.cljs$core$IFn$_invoke$arity$2 ? fexpr__104077.cljs$core$IFn$_invoke$arity$2(G__104078,G__104079) : fexpr__104077.call(null,G__104078,G__104079));
})();
var cr103891_place_63 = frontend.worker.rtc.const$.RTC_E2E_TEST;
var cr103891_place_64 = null;
if(cr103891_place_63){
(cr103891_state[(0)] = cr103891_block_6);

(cr103891_state[(1)] = null);

(cr103891_state[(3)] = cr103891_place_64);

return cr103891_state;
} else {
(cr103891_state[(0)] = cr103891_block_4);

(cr103891_state[(3)] = cr103891_place_64);

return cr103891_state;
}
}catch (e104076){var cr103891_exception = e104076;
(cr103891_state[(0)] = null);

(cr103891_state[(1)] = null);

(cr103891_state[(2)] = null);

throw cr103891_exception;
}});
var cr103891_block_2 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr103891_block_2(cr103891_state){
try{var cr103891_place_31 = (cr103891_state[(1)]);
var cr103891_place_28 = (cr103891_state[(3)]);
var cr103891_place_37 = frontend.worker.rtc.log_and_state.rtc_log;
var cr103891_place_38 = new cljs.core.Keyword("rtc.log","download","rtc.log/download",-2144210573);
var cr103891_place_39 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr103891_place_40 = new cljs.core.Keyword(null,"transact-graph-data-to-db","transact-graph-data-to-db",-742781730);
var cr103891_place_41 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr103891_place_42 = "transacting graph data to local db";
var cr103891_place_43 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr103891_place_44 = graph_uuid;
var cr103891_place_45 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr103891_place_43,cr103891_place_44,cr103891_place_41,cr103891_place_42,cr103891_place_39,cr103891_place_40]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr103891_place_46 = (function (){var G__104091 = cr103891_place_38;
var G__104092 = cr103891_place_45;
var fexpr__104090 = cr103891_place_37;
return (fexpr__104090.cljs$core$IFn$_invoke$arity$2 ? fexpr__104090.cljs$core$IFn$_invoke$arity$2(G__104091,G__104092) : fexpr__104090.call(null,G__104091,G__104092));
})();
var cr103891_place_47 = logseq.db.read_transit_str;
var cr103891_place_48 = cr103891_place_28;
var cr103891_place_49 = cr103891_place_47(cr103891_place_48);
var cr103891_place_50 = frontend.worker.state.set_rtc_downloading_graph_BANG_;
var cr103891_place_51 = true;
var cr103891_place_52 = (function (){var G__104095 = cr103891_place_51;
var fexpr__104094 = cr103891_place_50;
return (fexpr__104094.cljs$core$IFn$_invoke$arity$1 ? fexpr__104094.cljs$core$IFn$_invoke$arity$1(G__104095) : fexpr__104094.call(null,G__104095));
})();
var cr103891_place_53 = frontend.worker.rtc.full_upload_download_graph.new_task__transact_remote_all_blocks_BANG_;
var cr103891_place_54 = cr103891_place_49;
var cr103891_place_55 = cr103891_place_31;
var cr103891_place_56 = graph_uuid;
var cr103891_place_57 = (function (){var G__104099 = cr103891_place_54;
var G__104100 = cr103891_place_55;
var G__104101 = cr103891_place_56;
var fexpr__104098 = cr103891_place_53;
return (fexpr__104098.cljs$core$IFn$_invoke$arity$3 ? fexpr__104098.cljs$core$IFn$_invoke$arity$3(G__104099,G__104100,G__104101) : fexpr__104098.call(null,G__104099,G__104100,G__104101));
})();
(cr103891_state[(0)] = cr103891_block_3);

(cr103891_state[(3)] = null);

return missionary.core.park(cr103891_place_57);
}catch (e104086){var cr103891_exception = e104086;
(cr103891_state[(0)] = null);

(cr103891_state[(1)] = null);

(cr103891_state[(2)] = null);

(cr103891_state[(3)] = null);

throw cr103891_exception;
}});
var cr103891_block_1 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr103891_block_1(cr103891_state){
try{var cr103891_place_16 = missionary.core.unpark();
var cr103891_place_17 = cljs.core.__destructure_map;
var cr103891_place_18 = cr103891_place_16;
var cr103891_place_19 = (function (){var G__104105 = cr103891_place_18;
var fexpr__104104 = cr103891_place_17;
return (fexpr__104104.cljs$core$IFn$_invoke$arity$1 ? fexpr__104104.cljs$core$IFn$_invoke$arity$1(G__104105) : fexpr__104104.call(null,G__104105));
})();
var cr103891_place_20 = cr103891_place_19;
var cr103891_place_21 = cljs.core.get;
var cr103891_place_22 = cr103891_place_19;
var cr103891_place_23 = new cljs.core.Keyword(null,"status","status",-1997798413);
var cr103891_place_24 = (function (){var G__104107 = cr103891_place_22;
var G__104108 = cr103891_place_23;
var fexpr__104106 = cr103891_place_21;
return (fexpr__104106.cljs$core$IFn$_invoke$arity$2 ? fexpr__104106.cljs$core$IFn$_invoke$arity$2(G__104107,G__104108) : fexpr__104106.call(null,G__104107,G__104108));
})();
var cr103891_place_25 = cljs.core.get;
var cr103891_place_26 = cr103891_place_19;
var cr103891_place_27 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr103891_place_28 = (function (){var G__104110 = cr103891_place_26;
var G__104111 = cr103891_place_27;
var fexpr__104109 = cr103891_place_25;
return (fexpr__104109.cljs$core$IFn$_invoke$arity$2 ? fexpr__104109.cljs$core$IFn$_invoke$arity$2(G__104110,G__104111) : fexpr__104109.call(null,G__104110,G__104111));
})();
var cr103891_place_29 = logseq.db.sqlite.util.db_version_prefix;
var cr103891_place_30 = graph_name;
var cr103891_place_31 = [cr103891_place_29,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr103891_place_30)].join('');
var cr103891_place_32 = cljs.core.not_EQ_;
var cr103891_place_33 = (200);
var cr103891_place_34 = cr103891_place_24;
var cr103891_place_35 = (function (){var G__104116 = cr103891_place_33;
var G__104117 = cr103891_place_34;
var fexpr__104115 = cr103891_place_32;
return (fexpr__104115.cljs$core$IFn$_invoke$arity$2 ? fexpr__104115.cljs$core$IFn$_invoke$arity$2(G__104116,G__104117) : fexpr__104115.call(null,G__104116,G__104117));
})();
var cr103891_place_36 = null;
if(cljs.core.truth_(cr103891_place_35)){
(cr103891_state[(0)] = cr103891_block_8);

(cr103891_state[(1)] = cr103891_place_20);

return cr103891_state;
} else {
(cr103891_state[(0)] = cr103891_block_2);

(cr103891_state[(1)] = cr103891_place_31);

(cr103891_state[(2)] = cr103891_place_36);

(cr103891_state[(3)] = cr103891_place_28);

return cr103891_state;
}
}catch (e104102){var cr103891_exception = e104102;
(cr103891_state[(0)] = null);

throw cr103891_exception;
}});
var cr103891_block_0 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr103891_block_0(cr103891_state){
try{var cr103891_place_0 = frontend.worker.rtc.log_and_state.rtc_log;
var cr103891_place_1 = new cljs.core.Keyword("rtc.log","download","rtc.log/download",-2144210573);
var cr103891_place_2 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr103891_place_3 = new cljs.core.Keyword(null,"downloading-graph-data","downloading-graph-data",-1020420307);
var cr103891_place_4 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr103891_place_5 = "downloading graph data";
var cr103891_place_6 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr103891_place_7 = graph_uuid;
var cr103891_place_8 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr103891_place_6,cr103891_place_7,cr103891_place_2,cr103891_place_3,cr103891_place_4,cr103891_place_5]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr103891_place_9 = (function (){var G__104124 = cr103891_place_1;
var G__104125 = cr103891_place_8;
var fexpr__104123 = cr103891_place_0;
return (fexpr__104123.cljs$core$IFn$_invoke$arity$2 ? fexpr__104123.cljs$core$IFn$_invoke$arity$2(G__104124,G__104125) : fexpr__104123.call(null,G__104124,G__104125));
})();
var cr103891_place_10 = cljs_http_missionary.client.get;
var cr103891_place_11 = s3_url;
var cr103891_place_12 = new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222);
var cr103891_place_13 = false;
var cr103891_place_14 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr103891_place_12,cr103891_place_13]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr103891_place_15 = (function (){var G__104132 = cr103891_place_11;
var G__104133 = cr103891_place_14;
var fexpr__104131 = cr103891_place_10;
return (fexpr__104131.cljs$core$IFn$_invoke$arity$2 ? fexpr__104131.cljs$core$IFn$_invoke$arity$2(G__104132,G__104133) : fexpr__104131.call(null,G__104132,G__104133));
})();
(cr103891_state[(0)] = cr103891_block_1);

return missionary.core.park(cr103891_place_15);
}catch (e104121){var cr103891_exception = e104121;
(cr103891_state[(0)] = null);

throw cr103891_exception;
}});
var cr103891_block_8 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr103891_block_8(cr103891_state){
try{var cr103891_place_20 = (cr103891_state[(1)]);
var cr103891_place_91 = cljs.core.ex_info;
var cr103891_place_92 = "download-graph from s3 failed";
var cr103891_place_93 = new cljs.core.Keyword(null,"resp","resp",1418702376);
var cr103891_place_94 = cr103891_place_20;
var cr103891_place_95 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr103891_place_93,cr103891_place_94]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr103891_place_96 = (function (){var G__104137 = cr103891_place_92;
var G__104138 = cr103891_place_95;
var fexpr__104136 = cr103891_place_91;
return (fexpr__104136.cljs$core$IFn$_invoke$arity$2 ? fexpr__104136.cljs$core$IFn$_invoke$arity$2(G__104137,G__104138) : fexpr__104136.call(null,G__104137,G__104138));
})();
var cr103891_place_97 = (function(){throw cr103891_place_96})();
(cr103891_state[(0)] = null);

(cr103891_state[(1)] = null);

return null;
}catch (e104134){var cr103891_exception = e104134;
(cr103891_state[(0)] = null);

(cr103891_state[(1)] = null);

throw cr103891_exception;
}});
var cr103891_block_5 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr103891_block_5(cr103891_state){
try{var cr103891_place_75 = missionary.core.unpark();
(cr103891_state[(0)] = cr103891_block_7);

(cr103891_state[(3)] = cr103891_place_75);

return cr103891_state;
}catch (e104141){var cr103891_exception = e104141;
(cr103891_state[(0)] = null);

(cr103891_state[(2)] = null);

(cr103891_state[(3)] = null);

throw cr103891_exception;
}});
var cr103891_block_7 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr103891_block_7(cr103891_state){
try{var cr103891_place_64 = (cr103891_state[(3)]);
var cr103891_place_77 = frontend.worker.state.set_rtc_downloading_graph_BANG_;
var cr103891_place_78 = false;
var cr103891_place_79 = (function (){var G__104149 = cr103891_place_78;
var fexpr__104148 = cr103891_place_77;
return (fexpr__104148.cljs$core$IFn$_invoke$arity$1 ? fexpr__104148.cljs$core$IFn$_invoke$arity$1(G__104149) : fexpr__104148.call(null,G__104149));
})();
var cr103891_place_80 = frontend.worker.rtc.log_and_state.rtc_log;
var cr103891_place_81 = new cljs.core.Keyword("rtc.log","download","rtc.log/download",-2144210573);
var cr103891_place_82 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr103891_place_83 = new cljs.core.Keyword(null,"download-completed","download-completed",-1038223761);
var cr103891_place_84 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr103891_place_85 = "download completed";
var cr103891_place_86 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr103891_place_87 = graph_uuid;
var cr103891_place_88 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr103891_place_84,cr103891_place_85,cr103891_place_82,cr103891_place_83,cr103891_place_86,cr103891_place_87]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr103891_place_89 = (function (){var G__104151 = cr103891_place_81;
var G__104152 = cr103891_place_88;
var fexpr__104150 = cr103891_place_80;
return (fexpr__104150.cljs$core$IFn$_invoke$arity$2 ? fexpr__104150.cljs$core$IFn$_invoke$arity$2(G__104151,G__104152) : fexpr__104150.call(null,G__104151,G__104152));
})();
var cr103891_place_90 = null;
(cr103891_state[(0)] = cr103891_block_9);

(cr103891_state[(3)] = null);

(cr103891_state[(2)] = cr103891_place_90);

return cr103891_state;
}catch (e104146){var cr103891_exception = e104146;
(cr103891_state[(0)] = null);

(cr103891_state[(2)] = null);

(cr103891_state[(3)] = null);

throw cr103891_exception;
}});
var cr103891_block_6 = (function frontend$worker$rtc$full_upload_download_graph$new_task__download_graph_from_s3_$_cr103891_block_6(cr103891_state){
try{var cr103891_place_76 = null;
(cr103891_state[(0)] = cr103891_block_7);

(cr103891_state[(3)] = cr103891_place_76);

return cr103891_state;
}catch (e104158){var cr103891_exception = e104158;
(cr103891_state[(0)] = null);

(cr103891_state[(2)] = null);

(cr103891_state[(3)] = null);

throw cr103891_exception;
}});
return cloroutine.impl.coroutine((function (){var G__104161 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__104161[(0)] = cr103891_block_0);

return G__104161;
})());
})(),missionary.core.sp_run);
});
frontend.worker.rtc.full_upload_download_graph.new_task__branch_graph = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph(get_ws_create_task,repo,conn,graph_uuid,major_schema_version){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr104166_block_2 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr104166_block_2(cr104166_state){
try{var cr104166_place_72 = missionary.core.unpark();
var cr104166_place_73 = frontend.worker.rtc.log_and_state.rtc_log;
var cr104166_place_74 = new cljs.core.Keyword("rtc.log","branch-graph","rtc.log/branch-graph",763502753);
var cr104166_place_75 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr104166_place_76 = new cljs.core.Keyword(null,"request-branch-graph","request-branch-graph",-168752112);
var cr104166_place_77 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr104166_place_78 = "requesting branch-graph";
var cr104166_place_79 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr104166_place_77,cr104166_place_78,cr104166_place_75,cr104166_place_76]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr104166_place_80 = (function (){var G__104438 = cr104166_place_74;
var G__104439 = cr104166_place_79;
var fexpr__104437 = cr104166_place_73;
return (fexpr__104437.cljs$core$IFn$_invoke$arity$2 ? fexpr__104437.cljs$core$IFn$_invoke$arity$2(G__104438,G__104439) : fexpr__104437.call(null,G__104438,G__104439));
})();
var cr104166_place_81 = frontend.common.missionary._LT__BANG_;
var cr104166_place_82 = frontend.worker.crypt._LT_gen_aes_key;
var cr104166_place_83 = (function (){var fexpr__104440 = cr104166_place_82;
return (fexpr__104440.cljs$core$IFn$_invoke$arity$0 ? fexpr__104440.cljs$core$IFn$_invoke$arity$0() : fexpr__104440.call(null));
})();
var cr104166_place_84 = (function (){var G__104442 = cr104166_place_83;
var fexpr__104441 = cr104166_place_81;
return (fexpr__104441.cljs$core$IFn$_invoke$arity$1 ? fexpr__104441.cljs$core$IFn$_invoke$arity$1(G__104442) : fexpr__104441.call(null,G__104442));
})();
(cr104166_state[(0)] = cr104166_block_3);

return missionary.core.park(cr104166_place_84);
}catch (e104432){var cr104166_exception = e104432;
(cr104166_state[(0)] = null);

(cr104166_state[(1)] = null);

throw cr104166_exception;
}});
var cr104166_block_4 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr104166_block_4(cr104166_state){
try{var cr104166_place_86 = (cr104166_state[(2)]);
var cr104166_place_50 = (cr104166_state[(1)]);
var cr104166_place_92 = missionary.core.unpark();
var cr104166_place_93 = cr104166_place_86(cr104166_place_92);
var cr104166_place_94 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr104166_place_95 = get_ws_create_task;
var cr104166_place_96 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr104166_place_97 = "branch-graph";
var cr104166_place_98 = new cljs.core.Keyword(null,"s3-key","s3-key",696218166);
var cr104166_place_99 = cr104166_place_50;
var cr104166_place_100 = new cljs.core.Keyword(null,"schema-version","schema-version",1117939594);
var cr104166_place_101 = major_schema_version;
var cr104166_place_102 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr104166_place_101);
var cr104166_place_103 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr104166_place_104 = graph_uuid;
var cr104166_place_105 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr104166_place_103,cr104166_place_104,cr104166_place_96,cr104166_place_97,cr104166_place_98,cr104166_place_99,cr104166_place_100,cr104166_place_102]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr104166_place_106 = (function (){var G__104449 = cr104166_place_95;
var G__104450 = cr104166_place_105;
var fexpr__104448 = cr104166_place_94;
return (fexpr__104448.cljs$core$IFn$_invoke$arity$2 ? fexpr__104448.cljs$core$IFn$_invoke$arity$2(G__104449,G__104450) : fexpr__104448.call(null,G__104449,G__104450));
})();
(cr104166_state[(0)] = cr104166_block_5);

(cr104166_state[(2)] = null);

(cr104166_state[(1)] = null);

(cr104166_state[(1)] = cr104166_place_93);

return missionary.core.park(cr104166_place_106);
}catch (e104444){var cr104166_exception = e104444;
(cr104166_state[(0)] = null);

(cr104166_state[(2)] = null);

(cr104166_state[(1)] = null);

throw cr104166_exception;
}});
var cr104166_block_0 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr104166_block_0(cr104166_state){
try{var cr104166_place_0 = frontend.worker.rtc.log_and_state.rtc_log;
var cr104166_place_1 = new cljs.core.Keyword("rtc.log","branch-graph","rtc.log/branch-graph",763502753);
var cr104166_place_2 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr104166_place_3 = new cljs.core.Keyword(null,"fetching-presigned-put-url","fetching-presigned-put-url",1134336471);
var cr104166_place_4 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr104166_place_5 = "fetching presigned put-url";
var cr104166_place_6 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr104166_place_2,cr104166_place_3,cr104166_place_4,cr104166_place_5]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr104166_place_7 = (function (){var G__104457 = cr104166_place_1;
var G__104458 = cr104166_place_6;
var fexpr__104456 = cr104166_place_0;
return (fexpr__104456.cljs$core$IFn$_invoke$arity$2 ? fexpr__104456.cljs$core$IFn$_invoke$arity$2(G__104457,G__104458) : fexpr__104456.call(null,G__104457,G__104458));
})();
var cr104166_place_8 = frontend.worker.rtc.full_upload_download_graph.remove_rtc_data_in_conn_BANG_;
var cr104166_place_9 = repo;
var cr104166_place_10 = (function (){var G__104461 = cr104166_place_9;
var fexpr__104460 = cr104166_place_8;
return (fexpr__104460.cljs$core$IFn$_invoke$arity$1 ? fexpr__104460.cljs$core$IFn$_invoke$arity$1(G__104461) : fexpr__104460.call(null,G__104461));
})();
var cr104166_place_11 = missionary.core.join;
var cr104166_place_12 = cljs.core.vector;
var cr104166_place_13 = frontend.worker.rtc.ws_util.send_AMPERSAND_recv;
var cr104166_place_14 = get_ws_create_task;
var cr104166_place_15 = new cljs.core.Keyword(null,"action","action",-811238024);
var cr104166_place_16 = "presign-put-temp-s3-obj";
var cr104166_place_17 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr104166_place_15,cr104166_place_16]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr104166_place_18 = (function (){var G__104463 = cr104166_place_14;
var G__104464 = cr104166_place_17;
var fexpr__104462 = cr104166_place_13;
return (fexpr__104462.cljs$core$IFn$_invoke$arity$2 ? fexpr__104462.cljs$core$IFn$_invoke$arity$2(G__104463,G__104464) : fexpr__104462.call(null,G__104463,G__104464));
})();
var cr104166_place_19 = cljs.core.partial;
var cr104166_place_20 = (function (cr104174_state){
try{var cr104174_place_0 = frontend.worker.rtc.full_upload_download_graph.export_as_blocks;
var cr104174_place_1 = cljs.core.deref;
var cr104174_place_2 = conn;
var cr104174_place_3 = (function (){var G__104196 = cr104174_place_2;
var fexpr__104195 = cr104174_place_1;
var G__104477 = G__104196;
var fexpr__104476 = fexpr__104195;
return (fexpr__104476.cljs$core$IFn$_invoke$arity$1 ? fexpr__104476.cljs$core$IFn$_invoke$arity$1(G__104477) : fexpr__104476.call(null,G__104477));
})();
var cr104174_place_4 = new cljs.core.Keyword(null,"ignore-attr-set","ignore-attr-set",1237742981);
var cr104174_place_5 = frontend.worker.rtc.const$.ignore_attrs_when_init_upload;
var cr104174_place_6 = new cljs.core.Keyword(null,"ignore-entity-set","ignore-entity-set",205528184);
var cr104174_place_7 = frontend.worker.rtc.const$.ignore_entities_when_init_upload;
var cr104174_place_8 = (function (){var G__104198 = cr104174_place_3;
var G__104199 = cr104174_place_4;
var G__104200 = cr104174_place_5;
var G__104201 = cr104174_place_6;
var G__104202 = cr104174_place_7;
var fexpr__104197 = cr104174_place_0;
var G__104479 = G__104198;
var G__104480 = G__104199;
var G__104481 = G__104200;
var G__104482 = G__104201;
var G__104483 = G__104202;
var fexpr__104478 = fexpr__104197;
return (fexpr__104478.cljs$core$IFn$_invoke$arity$5 ? fexpr__104478.cljs$core$IFn$_invoke$arity$5(G__104479,G__104480,G__104481,G__104482,G__104483) : fexpr__104478.call(null,G__104479,G__104480,G__104481,G__104482,G__104483));
})();
var cr104174_place_9 = logseq.db.write_transit_str;
var cr104174_place_10 = cr104174_place_8;
var cr104174_place_11 = cr104174_place_9(cr104174_place_10);
(cr104174_state[(0)] = null);

return cr104174_place_11;
}catch (e104475){var e104192 = e104475;
var cr104174_exception = e104192;
(cr104174_state[(0)] = null);

throw cr104174_exception;
}});
var cr104166_place_21 = cloroutine.impl.coroutine;
var cr104166_place_22 = cljs.core.object_array;
var cr104166_place_23 = (1);
var cr104166_place_24 = (function (){var G__104487 = cr104166_place_23;
var fexpr__104486 = cr104166_place_22;
return (fexpr__104486.cljs$core$IFn$_invoke$arity$1 ? fexpr__104486.cljs$core$IFn$_invoke$arity$1(G__104487) : fexpr__104486.call(null,G__104487));
})();
var cr104166_place_25 = cr104166_place_24;
var cr104166_place_26 = (0);
var cr104166_place_27 = cr104166_place_20;
var cr104166_place_28 = (cr104166_place_25[cr104166_place_26] = cr104166_place_27);
var cr104166_place_29 = cr104166_place_24;
var cr104166_place_30 = (function (){var G__104489 = cr104166_place_29;
var fexpr__104488 = cr104166_place_21;
return (fexpr__104488.cljs$core$IFn$_invoke$arity$1 ? fexpr__104488.cljs$core$IFn$_invoke$arity$1(G__104489) : fexpr__104488.call(null,G__104489));
})();
var cr104166_place_31 = missionary.core.sp_run;
var cr104166_place_32 = (function (){var G__104495 = cr104166_place_30;
var G__104496 = cr104166_place_31;
var fexpr__104494 = cr104166_place_19;
return (fexpr__104494.cljs$core$IFn$_invoke$arity$2 ? fexpr__104494.cljs$core$IFn$_invoke$arity$2(G__104495,G__104496) : fexpr__104494.call(null,G__104495,G__104496));
})();
var cr104166_place_33 = (function (){var G__104498 = cr104166_place_12;
var G__104499 = cr104166_place_18;
var G__104500 = cr104166_place_32;
var fexpr__104497 = cr104166_place_11;
return (fexpr__104497.cljs$core$IFn$_invoke$arity$3 ? fexpr__104497.cljs$core$IFn$_invoke$arity$3(G__104498,G__104499,G__104500) : fexpr__104497.call(null,G__104498,G__104499,G__104500));
})();
(cr104166_state[(0)] = cr104166_block_1);

return missionary.core.park(cr104166_place_33);
}catch (e104452){var cr104166_exception = e104452;
(cr104166_state[(0)] = null);

throw cr104166_exception;
}});
var cr104166_block_6 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr104166_block_6(cr104166_state){
try{var cr104166_place_107 = (cr104166_state[(1)]);
var cr104166_place_113 = cljs.core.ex_info;
var cr104166_place_114 = "branch-graph failed";
var cr104166_place_115 = new cljs.core.Keyword(null,"upload-resp","upload-resp",-2088142426);
var cr104166_place_116 = cr104166_place_107;
var cr104166_place_117 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr104166_place_115,cr104166_place_116]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr104166_place_118 = (function (){var G__104506 = cr104166_place_114;
var G__104507 = cr104166_place_117;
var fexpr__104505 = cr104166_place_113;
return (fexpr__104505.cljs$core$IFn$_invoke$arity$2 ? fexpr__104505.cljs$core$IFn$_invoke$arity$2(G__104506,G__104507) : fexpr__104505.call(null,G__104506,G__104507));
})();
var cr104166_place_119 = (function(){throw cr104166_place_118})();
(cr104166_state[(0)] = null);

(cr104166_state[(1)] = null);

return null;
}catch (e104504){var cr104166_exception = e104504;
(cr104166_state[(0)] = null);

(cr104166_state[(1)] = null);

throw cr104166_exception;
}});
var cr104166_block_5 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr104166_block_5(cr104166_state){
try{var cr104166_place_107 = missionary.core.unpark();
var cr104166_place_108 = new cljs.core.Keyword(null,"graph-uuid","graph-uuid",1180757522);
var cr104166_place_109 = cr104166_place_107;
var cr104166_place_110 = cr104166_place_108.cljs$core$IFn$_invoke$arity$1(cr104166_place_109);
var cr104166_place_111 = cr104166_place_110;
var cr104166_place_112 = null;
if(cljs.core.truth_(cr104166_place_111)){
(cr104166_state[(0)] = cr104166_block_7);

(cr104166_state[(3)] = cr104166_place_110);

(cr104166_state[(2)] = cr104166_place_112);

return cr104166_state;
} else {
(cr104166_state[(0)] = cr104166_block_6);

(cr104166_state[(1)] = null);

(cr104166_state[(1)] = cr104166_place_107);

return cr104166_state;
}
}catch (e104511){var cr104166_exception = e104511;
(cr104166_state[(0)] = null);

(cr104166_state[(1)] = null);

throw cr104166_exception;
}});
var cr104166_block_7 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr104166_block_7(cr104166_state){
try{var cr104166_place_110 = (cr104166_state[(3)]);
var cr104166_place_93 = (cr104166_state[(1)]);
var cr104166_place_120 = cr104166_place_110;
var cr104166_place_121 = logseq.db.get_graph_schema_version;
var cr104166_place_122 = cljs.core.deref;
var cr104166_place_123 = conn;
var cr104166_place_124 = (function (){var G__104522 = cr104166_place_123;
var fexpr__104521 = cr104166_place_122;
return (fexpr__104521.cljs$core$IFn$_invoke$arity$1 ? fexpr__104521.cljs$core$IFn$_invoke$arity$1(G__104522) : fexpr__104521.call(null,G__104522));
})();
var cr104166_place_125 = (function (){var G__104524 = cr104166_place_124;
var fexpr__104523 = cr104166_place_121;
return (fexpr__104523.cljs$core$IFn$_invoke$arity$1 ? fexpr__104523.cljs$core$IFn$_invoke$arity$1(G__104524) : fexpr__104523.call(null,G__104524));
})();
var cr104166_place_126 = logseq.db.transact_BANG_;
var cr104166_place_127 = conn;
var cr104166_place_128 = logseq.db.kv;
var cr104166_place_129 = new cljs.core.Keyword("logseq.kv","graph-uuid","logseq.kv/graph-uuid",339522676);
var cr104166_place_130 = cr104166_place_120;
var cr104166_place_131 = (function (){var G__104526 = cr104166_place_129;
var G__104527 = cr104166_place_130;
var fexpr__104525 = cr104166_place_128;
return (fexpr__104525.cljs$core$IFn$_invoke$arity$2 ? fexpr__104525.cljs$core$IFn$_invoke$arity$2(G__104526,G__104527) : fexpr__104525.call(null,G__104526,G__104527));
})();
var cr104166_place_132 = logseq.db.kv;
var cr104166_place_133 = new cljs.core.Keyword("logseq.kv","graph-local-tx","logseq.kv/graph-local-tx",-337271478);
var cr104166_place_134 = "0";
var cr104166_place_135 = (function (){var G__104529 = cr104166_place_133;
var G__104530 = cr104166_place_134;
var fexpr__104528 = cr104166_place_132;
return (fexpr__104528.cljs$core$IFn$_invoke$arity$2 ? fexpr__104528.cljs$core$IFn$_invoke$arity$2(G__104529,G__104530) : fexpr__104528.call(null,G__104529,G__104530));
})();
var cr104166_place_136 = logseq.db.kv;
var cr104166_place_137 = new cljs.core.Keyword("logseq.kv","remote-schema-version","logseq.kv/remote-schema-version",988970829);
var cr104166_place_138 = cr104166_place_125;
var cr104166_place_139 = (function (){var G__104532 = cr104166_place_137;
var G__104533 = cr104166_place_138;
var fexpr__104531 = cr104166_place_136;
return (fexpr__104531.cljs$core$IFn$_invoke$arity$2 ? fexpr__104531.cljs$core$IFn$_invoke$arity$2(G__104532,G__104533) : fexpr__104531.call(null,G__104532,G__104533));
})();
var cr104166_place_140 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr104166_place_131,cr104166_place_135,cr104166_place_139], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
var cr104166_place_141 = (function (){var G__104535 = cr104166_place_127;
var G__104536 = cr104166_place_140;
var fexpr__104534 = cr104166_place_126;
return (fexpr__104534.cljs$core$IFn$_invoke$arity$2 ? fexpr__104534.cljs$core$IFn$_invoke$arity$2(G__104535,G__104536) : fexpr__104534.call(null,G__104535,G__104536));
})();
var cr104166_place_142 = frontend.worker.rtc.client_op.update_graph_uuid;
var cr104166_place_143 = repo;
var cr104166_place_144 = cr104166_place_120;
var cr104166_place_145 = (function (){var G__104538 = cr104166_place_143;
var G__104539 = cr104166_place_144;
var fexpr__104537 = cr104166_place_142;
return (fexpr__104537.cljs$core$IFn$_invoke$arity$2 ? fexpr__104537.cljs$core$IFn$_invoke$arity$2(G__104538,G__104539) : fexpr__104537.call(null,G__104538,G__104539));
})();
var cr104166_place_146 = frontend.worker.rtc.client_op.remove_local_tx;
var cr104166_place_147 = repo;
var cr104166_place_148 = (function (){var G__104541 = cr104166_place_147;
var fexpr__104540 = cr104166_place_146;
return (fexpr__104540.cljs$core$IFn$_invoke$arity$1 ? fexpr__104540.cljs$core$IFn$_invoke$arity$1(G__104541) : fexpr__104540.call(null,G__104541));
})();
var cr104166_place_149 = frontend.worker.rtc.client_op.add_all_exists_asset_as_ops;
var cr104166_place_150 = repo;
var cr104166_place_151 = (function (){var G__104543 = cr104166_place_150;
var fexpr__104542 = cr104166_place_149;
return (fexpr__104542.cljs$core$IFn$_invoke$arity$1 ? fexpr__104542.cljs$core$IFn$_invoke$arity$1(G__104543) : fexpr__104542.call(null,G__104543));
})();
var cr104166_place_152 = frontend.worker.crypt.store_graph_keys_jwk;
var cr104166_place_153 = repo;
var cr104166_place_154 = cr104166_place_93;
var cr104166_place_155 = (function (){var G__104545 = cr104166_place_153;
var G__104546 = cr104166_place_154;
var fexpr__104544 = cr104166_place_152;
return (fexpr__104544.cljs$core$IFn$_invoke$arity$2 ? fexpr__104544.cljs$core$IFn$_invoke$arity$2(G__104545,G__104546) : fexpr__104544.call(null,G__104545,G__104546));
})();
var cr104166_place_156 = frontend.common.missionary._LT__BANG_;
var cr104166_place_157 = frontend.worker.db_metadata._LT_store;
var cr104166_place_158 = repo;
var cr104166_place_159 = cljs.core.pr_str;
var cr104166_place_160 = new cljs.core.Keyword("kv","value","kv/value",305981670);
var cr104166_place_161 = cr104166_place_120;
var cr104166_place_162 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr104166_place_160,cr104166_place_161]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr104166_place_163 = (function (){var G__104548 = cr104166_place_162;
var fexpr__104547 = cr104166_place_159;
return (fexpr__104547.cljs$core$IFn$_invoke$arity$1 ? fexpr__104547.cljs$core$IFn$_invoke$arity$1(G__104548) : fexpr__104547.call(null,G__104548));
})();
var cr104166_place_164 = (function (){var G__104550 = cr104166_place_158;
var G__104551 = cr104166_place_163;
var fexpr__104549 = cr104166_place_157;
return (fexpr__104549.cljs$core$IFn$_invoke$arity$2 ? fexpr__104549.cljs$core$IFn$_invoke$arity$2(G__104550,G__104551) : fexpr__104549.call(null,G__104550,G__104551));
})();
var cr104166_place_165 = (function (){var G__104553 = cr104166_place_164;
var fexpr__104552 = cr104166_place_156;
return (fexpr__104552.cljs$core$IFn$_invoke$arity$1 ? fexpr__104552.cljs$core$IFn$_invoke$arity$1(G__104553) : fexpr__104552.call(null,G__104553));
})();
(cr104166_state[(0)] = cr104166_block_8);

(cr104166_state[(3)] = null);

(cr104166_state[(1)] = null);

return missionary.core.park(cr104166_place_165);
}catch (e104515){var cr104166_exception = e104515;
(cr104166_state[(0)] = null);

(cr104166_state[(2)] = null);

(cr104166_state[(3)] = null);

(cr104166_state[(1)] = null);

throw cr104166_exception;
}});
var cr104166_block_1 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr104166_block_1(cr104166_state){
try{var cr104166_place_34 = missionary.core.unpark();
var cr104166_place_35 = cljs.core.nth;
var cr104166_place_36 = cr104166_place_34;
var cr104166_place_37 = (0);
var cr104166_place_38 = null;
var cr104166_place_39 = (function (){var G__104556 = cr104166_place_36;
var G__104557 = cr104166_place_37;
var G__104558 = cr104166_place_38;
var fexpr__104555 = cr104166_place_35;
return (fexpr__104555.cljs$core$IFn$_invoke$arity$3 ? fexpr__104555.cljs$core$IFn$_invoke$arity$3(G__104556,G__104557,G__104558) : fexpr__104555.call(null,G__104556,G__104557,G__104558));
})();
var cr104166_place_40 = cljs.core.__destructure_map;
var cr104166_place_41 = cr104166_place_39;
var cr104166_place_42 = (function (){var G__104560 = cr104166_place_41;
var fexpr__104559 = cr104166_place_40;
return (fexpr__104559.cljs$core$IFn$_invoke$arity$1 ? fexpr__104559.cljs$core$IFn$_invoke$arity$1(G__104560) : fexpr__104559.call(null,G__104560));
})();
var cr104166_place_43 = cljs.core.get;
var cr104166_place_44 = cr104166_place_42;
var cr104166_place_45 = new cljs.core.Keyword(null,"url","url",276297046);
var cr104166_place_46 = (function (){var G__104562 = cr104166_place_44;
var G__104563 = cr104166_place_45;
var fexpr__104561 = cr104166_place_43;
return (fexpr__104561.cljs$core$IFn$_invoke$arity$2 ? fexpr__104561.cljs$core$IFn$_invoke$arity$2(G__104562,G__104563) : fexpr__104561.call(null,G__104562,G__104563));
})();
var cr104166_place_47 = cljs.core.get;
var cr104166_place_48 = cr104166_place_42;
var cr104166_place_49 = new cljs.core.Keyword(null,"key","key",-1516042587);
var cr104166_place_50 = (function (){var G__104565 = cr104166_place_48;
var G__104566 = cr104166_place_49;
var fexpr__104564 = cr104166_place_47;
return (fexpr__104564.cljs$core$IFn$_invoke$arity$2 ? fexpr__104564.cljs$core$IFn$_invoke$arity$2(G__104565,G__104566) : fexpr__104564.call(null,G__104565,G__104566));
})();
var cr104166_place_51 = cljs.core.nth;
var cr104166_place_52 = cr104166_place_34;
var cr104166_place_53 = (1);
var cr104166_place_54 = null;
var cr104166_place_55 = (function (){var G__104568 = cr104166_place_52;
var G__104569 = cr104166_place_53;
var G__104570 = cr104166_place_54;
var fexpr__104567 = cr104166_place_51;
return (fexpr__104567.cljs$core$IFn$_invoke$arity$3 ? fexpr__104567.cljs$core$IFn$_invoke$arity$3(G__104568,G__104569,G__104570) : fexpr__104567.call(null,G__104568,G__104569,G__104570));
})();
var cr104166_place_56 = frontend.worker.rtc.log_and_state.rtc_log;
var cr104166_place_57 = new cljs.core.Keyword("rtc.log","branch-graph","rtc.log/branch-graph",763502753);
var cr104166_place_58 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr104166_place_59 = new cljs.core.Keyword(null,"upload-data","upload-data",690295555);
var cr104166_place_60 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr104166_place_61 = "uploading data";
var cr104166_place_62 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr104166_place_60,cr104166_place_61,cr104166_place_58,cr104166_place_59]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr104166_place_63 = (function (){var G__104572 = cr104166_place_57;
var G__104573 = cr104166_place_62;
var fexpr__104571 = cr104166_place_56;
return (fexpr__104571.cljs$core$IFn$_invoke$arity$2 ? fexpr__104571.cljs$core$IFn$_invoke$arity$2(G__104572,G__104573) : fexpr__104571.call(null,G__104572,G__104573));
})();
var cr104166_place_64 = cljs_http_missionary.client.put;
var cr104166_place_65 = cr104166_place_46;
var cr104166_place_66 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr104166_place_67 = cr104166_place_55;
var cr104166_place_68 = new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222);
var cr104166_place_69 = false;
var cr104166_place_70 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr104166_place_66,cr104166_place_67,cr104166_place_68,cr104166_place_69]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr104166_place_71 = (function (){var G__104575 = cr104166_place_65;
var G__104576 = cr104166_place_70;
var fexpr__104574 = cr104166_place_64;
return (fexpr__104574.cljs$core$IFn$_invoke$arity$2 ? fexpr__104574.cljs$core$IFn$_invoke$arity$2(G__104575,G__104576) : fexpr__104574.call(null,G__104575,G__104576));
})();
(cr104166_state[(0)] = cr104166_block_2);

(cr104166_state[(1)] = cr104166_place_50);

return missionary.core.park(cr104166_place_71);
}catch (e104554){var cr104166_exception = e104554;
(cr104166_state[(0)] = null);

throw cr104166_exception;
}});
var cr104166_block_9 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr104166_block_9(cr104166_state){
try{var cr104166_place_112 = (cr104166_state[(2)]);
(cr104166_state[(0)] = null);

(cr104166_state[(2)] = null);

return cr104166_place_112;
}catch (e104577){var cr104166_exception = e104577;
(cr104166_state[(0)] = null);

(cr104166_state[(2)] = null);

throw cr104166_exception;
}});
var cr104166_block_8 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr104166_block_8(cr104166_state){
try{var cr104166_place_166 = missionary.core.unpark();
var cr104166_place_167 = frontend.worker.rtc.log_and_state.rtc_log;
var cr104166_place_168 = new cljs.core.Keyword("rtc.log","branch-graph","rtc.log/branch-graph",763502753);
var cr104166_place_169 = new cljs.core.Keyword(null,"sub-type","sub-type",-997954412);
var cr104166_place_170 = new cljs.core.Keyword(null,"completed","completed",-486056503);
var cr104166_place_171 = new cljs.core.Keyword(null,"message","message",-406056002);
var cr104166_place_172 = "branch-graph completed";
var cr104166_place_173 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr104166_place_169,cr104166_place_170,cr104166_place_171,cr104166_place_172]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr104166_place_174 = (function (){var G__104581 = cr104166_place_168;
var G__104582 = cr104166_place_173;
var fexpr__104580 = cr104166_place_167;
return (fexpr__104580.cljs$core$IFn$_invoke$arity$2 ? fexpr__104580.cljs$core$IFn$_invoke$arity$2(G__104581,G__104582) : fexpr__104580.call(null,G__104581,G__104582));
})();
var cr104166_place_175 = null;
(cr104166_state[(0)] = cr104166_block_9);

(cr104166_state[(2)] = cr104166_place_175);

return cr104166_state;
}catch (e104578){var cr104166_exception = e104578;
(cr104166_state[(0)] = null);

(cr104166_state[(2)] = null);

throw cr104166_exception;
}});
var cr104166_block_3 = (function frontend$worker$rtc$full_upload_download_graph$new_task__branch_graph_$_cr104166_block_3(cr104166_state){
try{var cr104166_place_85 = missionary.core.unpark();
var cr104166_place_86 = logseq.db.write_transit_str;
var cr104166_place_87 = frontend.common.missionary._LT__BANG_;
var cr104166_place_88 = frontend.worker.crypt._LT_export_key;
var cr104166_place_89 = cr104166_place_85;
var cr104166_place_90 = (function (){var G__104586 = cr104166_place_89;
var fexpr__104585 = cr104166_place_88;
return (fexpr__104585.cljs$core$IFn$_invoke$arity$1 ? fexpr__104585.cljs$core$IFn$_invoke$arity$1(G__104586) : fexpr__104585.call(null,G__104586));
})();
var cr104166_place_91 = (function (){var G__104588 = cr104166_place_90;
var fexpr__104587 = cr104166_place_87;
return (fexpr__104587.cljs$core$IFn$_invoke$arity$1 ? fexpr__104587.cljs$core$IFn$_invoke$arity$1(G__104588) : fexpr__104587.call(null,G__104588));
})();
(cr104166_state[(0)] = cr104166_block_4);

(cr104166_state[(2)] = cr104166_place_86);

return missionary.core.park(cr104166_place_91);
}catch (e104584){var cr104166_exception = e104584;
(cr104166_state[(0)] = null);

(cr104166_state[(1)] = null);

throw cr104166_exception;
}});
return cloroutine.impl.coroutine((function (){var G__104591 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__104591[(0)] = cr104166_block_0);

return G__104591;
})());
})(),missionary.core.sp_run);
});

//# sourceMappingURL=frontend.worker.rtc.full_upload_download_graph.js.map
