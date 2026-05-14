goog.provide('logseq.db.frontend.schema');
logseq.db.frontend.schema.schema_version_QMARK_ = cljs.core.every_pred.cljs$core$IFn$_invoke$arity$2(cljs.core.map_QMARK_,new cljs.core.Keyword(null,"major","major",-27376078));
logseq.db.frontend.schema.major_schema_version_string_schema = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"and","and",-971899817),new cljs.core.Keyword(null,"string","string",-1989541586),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("error","message","error/message",-502809098),"should be a major schema-version"], null),(function (s){
return (!((cljs.core.parse_long(s) == null)));
})], null)], null);
/**
 * Return schema-version({:major <num> :minor <num>}).
 *   supported input: 10, "10.1", [10 1]
 */
logseq.db.frontend.schema.parse_schema_version = (function logseq$db$frontend$schema$parse_schema_version(string_or_compatible_number){
if(cljs.core.truth_(logseq.db.frontend.schema.schema_version_QMARK_(string_or_compatible_number))){
return string_or_compatible_number;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.sequential_QMARK_(string_or_compatible_number);
if(and__5000__auto__){
return cljs.core.first(string_or_compatible_number);
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"major","major",-27376078),cljs.core.first(string_or_compatible_number),new cljs.core.Keyword(null,"minor","minor",-608536071),cljs.core.second(string_or_compatible_number)], null);
} else {
if(cljs.core.int_QMARK_(string_or_compatible_number)){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"major","major",-27376078),string_or_compatible_number,new cljs.core.Keyword(null,"minor","minor",-608536071),null], null);
} else {
if(typeof string_or_compatible_number === 'string'){
var vec__62686 = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.parse_long,clojure.string.split.cljs$core$IFn$_invoke$arity$2(string_or_compatible_number,/\./));
var major = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62686,(0),null);
var minor = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62686,(1),null);
if((!((major == null)))){
} else {
throw (new Error("Assert failed: (some? major)"));
}

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"major","major",-27376078),major,new cljs.core.Keyword(null,"minor","minor",-608536071),minor], null);
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Bad schema version: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(string_or_compatible_number)].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data","data",-232669377),string_or_compatible_number], null));

}
}
}
}
});
logseq.db.frontend.schema.compare_schema_version = (function logseq$db$frontend$schema$compare_schema_version(x,y){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.compare,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"major","major",-27376078),new cljs.core.Keyword(null,"minor","minor",-608536071)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.db.frontend.schema.parse_schema_version(x),logseq.db.frontend.schema.parse_schema_version(y)], null)));
});
logseq.db.frontend.schema.version = logseq.db.frontend.schema.parse_schema_version("64.9");
/**
 * Return a number.
 *   Compatible with current schema-version number.
 *   schema-version-old: 10, a number
 *   schema-version-new: "12.34", string, <major-num>.<minor-num>
 */
logseq.db.frontend.schema.major_version = (function logseq$db$frontend$schema$major_version(schema_version){
if(cljs.core.truth_(logseq.db.frontend.schema.schema_version_QMARK_(schema_version))){
return new cljs.core.Keyword(null,"major","major",-27376078).cljs$core$IFn$_invoke$arity$1(schema_version);
} else {
return new cljs.core.Keyword(null,"major","major",-27376078).cljs$core$IFn$_invoke$arity$1(logseq.db.frontend.schema.parse_schema_version(schema_version));
}
});
logseq.db.frontend.schema.schema_version__GT_string = (function logseq$db$frontend$schema$schema_version__GT_string(schema_version){
if(typeof schema_version === 'string'){
return schema_version;
} else {
if(cljs.core.int_QMARK_(schema_version)){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(schema_version);
} else {
if(cljs.core.truth_(logseq.db.frontend.schema.schema_version_QMARK_(schema_version))){
var temp__5802__auto__ = new cljs.core.Keyword(null,"minor","minor",-608536071).cljs$core$IFn$_invoke$arity$1(schema_version);
if(cljs.core.truth_(temp__5802__auto__)){
var minor = temp__5802__auto__;
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"major","major",-27376078).cljs$core$IFn$_invoke$arity$1(schema_version)),".",cljs.core.str.cljs$core$IFn$_invoke$arity$1(minor)].join('');
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"major","major",-27376078).cljs$core$IFn$_invoke$arity$1(schema_version));
}
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Not a schema-version",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data","data",-232669377),schema_version], null));

}
}
}
});
/**
 * Schema for DB graphs. :block/tags are classes in this schema
 */
logseq.db.frontend.schema.schema = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,logseq.db.file_based.schema.schema,logseq.db.file_based.schema.file_only_attributes),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","index","db/index",-1531680669),true], null),new cljs.core.Keyword("block","closed-value-property","block/closed-value-property",1157792813),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","valueType","db/valueType",1827971944),new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234)], null)], null)], 0));
/**
 * Retract attributes for DB graphs
 */
logseq.db.frontend.schema.retract_attributes = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","warning","block/warning",2131709542),null,new cljs.core.Keyword("block","refs","block/refs",-1214495349),null], null), null);
logseq.db.frontend.schema.ref_type_attributes = cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentHashSet.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (p__62694){
var vec__62695 = p__62694;
var attr_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62695,(0),null);
var attr_body_map = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62695,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079),new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(attr_body_map))){
return attr_name;
} else {
return null;
}
})),logseq.db.frontend.schema.schema);
logseq.db.frontend.schema.card_many_attributes = cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentHashSet.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$1((function (p__62699){
var vec__62700 = p__62699;
var attr_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62700,(0),null);
var attr_body_map = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62700,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(attr_body_map))){
return attr_name;
} else {
return null;
}
})),logseq.db.frontend.schema.schema);
logseq.db.frontend.schema.card_many_ref_type_attributes = clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.schema.card_many_attributes,logseq.db.frontend.schema.ref_type_attributes);
logseq.db.frontend.schema.card_one_ref_type_attributes = clojure.set.difference.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.schema.ref_type_attributes,logseq.db.frontend.schema.card_many_attributes);
logseq.db.frontend.schema.db_non_ref_attributes = cljs.core.set(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__62707){
var vec__62708 = p__62707;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62708,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__62708,(1),null);
if(cljs.core.not(new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(v))){
return k;
} else {
return null;
}
}),logseq.db.frontend.schema.schema));

//# sourceMappingURL=logseq.db.frontend.schema.js.map
