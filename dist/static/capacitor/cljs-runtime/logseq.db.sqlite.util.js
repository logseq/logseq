goog.provide('logseq.db.sqlite.util');
if((typeof logseq !== 'undefined') && (typeof logseq.db !== 'undefined') && (typeof logseq.db.sqlite !== 'undefined') && (typeof logseq.db.sqlite.util !== 'undefined') && (typeof logseq.db.sqlite.util.db_version_prefix !== 'undefined')){
} else {
logseq.db.sqlite.util.db_version_prefix = "logseq_db_";
}
logseq.db.sqlite.util.write_handlers = cljs_bean.transit.writer_handlers();
logseq.db.sqlite.util.read_handlers = cljs.core.PersistentArrayMap.EMPTY;
logseq.db.sqlite.util.transit_w = cognitect.transit.writer.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"json","json",1279968570),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handlers","handlers",79528781),logseq.db.sqlite.util.write_handlers], null));
logseq.db.sqlite.util.transit_r = cognitect.transit.reader.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"json","json",1279968570),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handlers","handlers",79528781),logseq.db.sqlite.util.read_handlers], null));
logseq.db.sqlite.util.transit_write = (function logseq$db$sqlite$util$transit_write(data){
return cognitect.transit.write(logseq.db.sqlite.util.transit_w,data);
});
logseq.db.sqlite.util.transit_read = (function logseq$db$sqlite$util$transit_read(s){
return cognitect.transit.read(logseq.db.sqlite.util.transit_r,s);
});
logseq.db.sqlite.util.write_transit_str = (function (){var write_handlers_STAR_ = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.sqlite.util.write_handlers,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(datascript.transit.write_handlers,datascript.impl.entity.Entity,cognitect.transit.write_handler.cljs$core$IFn$_invoke$arity$2(cljs.core.constantly("datascript/Entity"),(function (entity){
if((!((new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity) == null)))){
} else {
throw (new Error("Assert failed: (some? (:db/id entity))"));
}

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(entity.kv,new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(entity));
})))], 0));
var writer = cognitect.transit.writer.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"json","json",1279968570),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handlers","handlers",79528781),write_handlers_STAR_], null));
return (function logseq$db$sqlite$util$write_transit_str_STAR_(o){
try{return cognitect.transit.write(writer,o);
}catch (e59794){var e = e59794;
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("logseq.db.sqlite.util","write-transit-str","logseq.db.sqlite.util/write-transit-str",121066877),o], 0));

console.trace();

throw e;
}});
})();
logseq.db.sqlite.util.read_transit_str = (function (){var read_handlers_STAR_ = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.sqlite.util.read_handlers,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(datascript.transit.read_handlers,"datascript/Entity",cljs.core.identity)], 0));
var reader = cognitect.transit.reader.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"json","json",1279968570),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handlers","handlers",79528781),read_handlers_STAR_], null));
return (function logseq$db$sqlite$util$read_transit_str_STAR_(s){
return cognitect.transit.read(reader,s);
});
})();
logseq.db.sqlite.util.db_based_graph_QMARK_ = (function logseq$db$sqlite$util$db_based_graph_QMARK_(graph_name){
if(cljs.core.truth_(graph_name)){
return clojure.string.starts_with_QMARK_(graph_name,logseq.db.sqlite.util.db_version_prefix);
} else {
return null;
}
});
logseq.db.sqlite.util.block_with_timestamps = logseq.common.util.block_with_timestamps;
/**
 * Build a standard new property so that it is is consistent across contexts. Takes
 * an optional map with following keys:
 * * :title - Case sensitive property name. Defaults to deriving this from db-ident
 * * :block-uuid - :block/uuid for property
 */
logseq.db.sqlite.util.build_new_property = (function logseq$db$sqlite$util$build_new_property(var_args){
var G__59805 = arguments.length;
switch (G__59805) {
case 2:
return logseq.db.sqlite.util.build_new_property.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return logseq.db.sqlite.util.build_new_property.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.db.sqlite.util.build_new_property.cljs$core$IFn$_invoke$arity$2 = (function (db_ident,prop_schema){
return logseq.db.sqlite.util.build_new_property.cljs$core$IFn$_invoke$arity$3(db_ident,prop_schema,cljs.core.PersistentArrayMap.EMPTY);
}));

(logseq.db.sqlite.util.build_new_property.cljs$core$IFn$_invoke$arity$3 = (function (db_ident,prop_schema,p__59810){
var map__59811 = p__59810;
var map__59811__$1 = cljs.core.__destructure_map(map__59811);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__59811__$1,new cljs.core.Keyword(null,"title","title",636505583));
var block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__59811__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638));
var ref_type_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__59811__$1,new cljs.core.Keyword(null,"ref-type?","ref-type?",622803158));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__59811__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
if((db_ident instanceof cljs.core.Keyword)){
} else {
throw (new Error("Assert failed: (keyword? db-ident)"));
}

var db_ident_SINGLEQUOTE_ = ((cljs.core.qualified_keyword_QMARK_(db_ident))?db_ident:logseq.db.frontend.property.create_user_property_ident_from_name.cljs$core$IFn$_invoke$arity$1(cljs.core.name(db_ident)));
var prop_name = (function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.name(db_ident_SINGLEQUOTE_);
}
})();
var prop_type = cljs.core.get.cljs$core$IFn$_invoke$arity$3(prop_schema,new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),new cljs.core.Keyword(null,"default","default",-1987822328));
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(prop_schema,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659)),(function (){var G__59817 = (function (){var G__59818 = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword("db","index","db/index",-1531680669),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("block","order","block/order",-1429282437),new cljs.core.Keyword("block","name","block/name",1619760316)],[true,prop_type,(function (){var or__5002__auto__ = block_uuid;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"db-ident-block-uuid","db-ident-block-uuid",-2020167291),db_ident_SINGLEQUOTE_);
}
})(),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048),null], null), null),cljs.core.name(prop_name),(cljs.core.truth_((function (){var G__59822 = new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(prop_schema);
var fexpr__59821 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),null,new cljs.core.Keyword(null,"many","many",1092119164),null], null), null);
return (fexpr__59821.cljs$core$IFn$_invoke$arity$1 ? fexpr__59821.cljs$core$IFn$_invoke$arity$1(G__59822) : fexpr__59821.call(null,G__59822));
})())?new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234):new cljs.core.Keyword("db.cardinality","one","db.cardinality/one",1428352190)),db_ident_SINGLEQUOTE_,logseq.db.common.order.gen_key.cljs$core$IFn$_invoke$arity$0(),logseq.common.util.page_name_sanity_lc(cljs.core.name(prop_name))]);
var G__59818__$1 = (cljs.core.truth_((function (){var or__5002__auto__ = ref_type_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.contains_QMARK_(logseq.db.frontend.property.type.all_ref_property_types,prop_type);
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__59818,new cljs.core.Keyword("db","valueType","db/valueType",1827971944),new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079)):G__59818);
if(cljs.core.seq(properties)){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__59818__$1,properties], 0));
} else {
return G__59818__$1;
}
})();
return (logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1 ? logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1(G__59817) : logseq.db.sqlite.util.block_with_timestamps.call(null,G__59817));
})()], 0));
}));

(logseq.db.sqlite.util.build_new_property.cljs$lang$maxFixedArity = 3);

/**
 * Build a standard new class so that it is consistent across contexts
 */
logseq.db.sqlite.util.build_new_class = (function logseq$db$sqlite$util$build_new_class(block){
if(cljs.core.qualified_keyword_QMARK_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(block))){
} else {
throw (new Error("Assert failed: (qualified-keyword? (:db/ident block))"));
}

var G__59832 = (function (){var G__59835 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","tags","block/tags",1814948340),cljs.core.set(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083)))], null)], 0));
if(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("logseq.class","Root","logseq.class/Root",273783827))) && ((new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509).cljs$core$IFn$_invoke$arity$1(block) == null)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__59835,new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),new cljs.core.Keyword("logseq.class","Root","logseq.class/Root",273783827));
} else {
return G__59835;
}
})();
return (logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1 ? logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1(G__59832) : logseq.db.sqlite.util.block_with_timestamps.call(null,G__59832));
});
/**
 * Builds a basic page to be transacted. A minimal version of gp-block/page-name->map
 */
logseq.db.sqlite.util.build_new_page = (function logseq$db$sqlite$util$build_new_page(page_name){
var G__59843 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword("block","name","block/name",1619760316),logseq.common.util.page_name_sanity_lc(page_name),new cljs.core.Keyword("block","title","block/title",710445684),page_name,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"builtin-block-uuid","builtin-block-uuid",-652923992),page_name),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329),null], null), null)], null);
return (logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1 ? logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1(G__59843) : logseq.db.sqlite.util.block_with_timestamps.call(null,G__59843));
});
/**
 * Creates a key-value pair tx with the key and value respectively stored under
 *   :db/ident and :kv/value. The key must be under the namespace :logseq.kv
 */
logseq.db.sqlite.util.kv = (function logseq$db$sqlite$util$kv(k,value){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("logseq.kv",cljs.core.namespace(k))){
} else {
throw (new Error("Assert failed: (= \"logseq.kv\" (namespace k))"));
}

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),k,new cljs.core.Keyword("kv","value","kv/value",305981670),value], null);
});
/**
 * Creates tx for an import given an import-type
 */
logseq.db.sqlite.util.import_tx = (function logseq$db$sqlite$util$import_tx(import_type){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.db.sqlite.util.kv(new cljs.core.Keyword("logseq.kv","import-type","logseq.kv/import-type",-1734132414),import_type),logseq.db.sqlite.util.kv(new cljs.core.Keyword("logseq.kv","imported-at","logseq.kv/imported-at",1693773096),logseq.common.util.time_ms())], null),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (db_ident){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),db_ident], null);
}),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.kv","graph-uuid","logseq.kv/graph-uuid",339522676),new cljs.core.Keyword("logseq.kv","graph-local-tx","logseq.kv/graph-local-tx",-337271478),new cljs.core.Keyword("logseq.kv","remote-schema-version","logseq.kv/remote-schema-version",988970829)], null)));
});

//# sourceMappingURL=logseq.db.sqlite.util.js.map
