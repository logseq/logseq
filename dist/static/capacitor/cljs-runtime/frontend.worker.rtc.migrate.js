goog.provide('frontend.worker.rtc.migrate');
frontend.worker.rtc.migrate.server_client_schema_version__GT_migrations = (function frontend$worker$rtc$migrate$server_client_schema_version__GT_migrations(server_schema_version,client_schema_version){
if((logseq.db.frontend.schema.compare_schema_version(server_schema_version,client_schema_version) < (0))){
var sorted_schema_version__GT_updates = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(cljs.core.first,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__134224){
var vec__134226 = p__134224;
var schema_version = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134226,(0),null);
var updates = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134226,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"major","major",-27376078),new cljs.core.Keyword(null,"minor","minor",-608536071))(logseq.db.frontend.schema.parse_schema_version(schema_version)),updates], null);
}),frontend.worker.db.migrate.schema_version__GT_updates));
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,cljs.core.take_while.cljs$core$IFn$_invoke$arity$2((function (p__134231){
var vec__134232 = p__134231;
var schema_version = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134232,(0),null);
var _updates = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134232,(1),null);
return (!((logseq.db.frontend.schema.compare_schema_version(client_schema_version,schema_version) < (0))));
}),cljs.core.drop_while.cljs$core$IFn$_invoke$arity$2((function (p__134237){
var vec__134238 = p__134237;
var schema_version = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134238,(0),null);
var _updates = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__134238,(1),null);
return (!((logseq.db.frontend.schema.compare_schema_version(server_schema_version,schema_version) < (0))));
}),sorted_schema_version__GT_updates)));
} else {
return null;
}
});
/**
 * convert :classes, :properties from frontend.worker.db.migrate/schema-version->updates into client-ops
 */
frontend.worker.rtc.migrate.migration_updates__GT_client_ops = (function frontend$worker$rtc$migrate$migration_updates__GT_client_ops(db,client_schema_version,migrate_updates){
var property_ks = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"properties","properties",685819552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([migrate_updates], 0));
var class_ks = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"classes","classes",2037804510),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([migrate_updates], 0));
var d_entity_fn = cljs.core.partial.cljs$core$IFn$_invoke$arity$2(datascript.core.entity,db);
var new_property_entities = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(d_entity_fn,property_ks);
var new_class_entities = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(d_entity_fn,class_ks);
var client_ops = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(frontend.worker.rtc.gen_client_op.generate_rtc_ops_from_property_entities(new_property_entities),frontend.worker.rtc.gen_client_op.generate_rtc_ops_from_class_entities(new_class_entities)));
var max_t = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.max,(0),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,client_ops));
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(client_ops,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"update-kv-value","update-kv-value",-1091588796),max_t,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db-ident","db-ident",-992686073),new cljs.core.Keyword("logseq.kv","schema-version","logseq.kv/schema-version",-1467606676),new cljs.core.Keyword(null,"value","value",305978217),client_schema_version], null)], null));
});
frontend.worker.rtc.migrate.add_migration_client_ops_BANG_ = (function frontend$worker$rtc$migrate$add_migration_client_ops_BANG_(repo,db,server_schema_version,client_schema_version){
if(cljs.core.truth_((function (){var and__5000__auto__ = server_schema_version;
if(cljs.core.truth_(and__5000__auto__)){
return client_schema_version;
} else {
return and__5000__auto__;
}
})())){
} else {
throw (new Error("Assert failed: (and server-schema-version client-schema-version)"));
}

var temp__5804__auto__ = cljs.core.not_empty((function (){var G__134248 = frontend.worker.rtc.migrate.server_client_schema_version__GT_migrations(server_schema_version,client_schema_version);
if((G__134248 == null)){
return null;
} else {
return frontend.worker.rtc.migrate.migration_updates__GT_client_ops(db,client_schema_version,G__134248);
}
})());
if(cljs.core.truth_(temp__5804__auto__)){
var ops = temp__5804__auto__;
frontend.worker.rtc.client_op.add_ops_BANG_(repo,ops);

return ops;
} else {
return null;
}
});

//# sourceMappingURL=frontend.worker.rtc.migrate.js.map
