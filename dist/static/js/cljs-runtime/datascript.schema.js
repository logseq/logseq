goog.provide('datascript.schema');
datascript.schema.schema_keys = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 12, [new cljs.core.Keyword("db","index","db/index",-1531680669),null,new cljs.core.Keyword("db","unique","db/unique",329396388),null,new cljs.core.Keyword("db","valueType","db/valueType",1827971944),null,new cljs.core.Keyword("db","tupleType","db/tupleType",448013354),null,new cljs.core.Keyword("db","tupleTypes","db/tupleTypes",1512507626),null,new cljs.core.Keyword("db","noHistory","db/noHistory",-1975127444),null,new cljs.core.Keyword("db","isComponent","db/isComponent",423352398),null,new cljs.core.Keyword("db.install","_attribute","db.install/_attribute",1853441294),null,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),null,new cljs.core.Keyword("db","doc","db/doc",1913350069),null,new cljs.core.Keyword("db","ident","db/ident",-737096),null,new cljs.core.Keyword("db","tupleAttrs","db/tupleAttrs",250080092),null], null), null);
if((typeof datascript !== 'undefined') && (typeof datascript.schema !== 'undefined') && (typeof datascript.schema.schema_attr_QMARK_ !== 'undefined')){
} else {
datascript.schema.schema_attr_QMARK_ = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 11, [new cljs.core.Keyword("db","index","db/index",-1531680669),null,new cljs.core.Keyword("db","unique","db/unique",329396388),null,new cljs.core.Keyword("db","valueType","db/valueType",1827971944),null,new cljs.core.Keyword("db","tupleType","db/tupleType",448013354),null,new cljs.core.Keyword("db","tupleTypes","db/tupleTypes",1512507626),null,new cljs.core.Keyword("db","isComponent","db/isComponent",423352398),null,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),null,new cljs.core.Keyword("db","doc","db/doc",1913350069),null,new cljs.core.Keyword("db","id","db/id",-1388397098),null,new cljs.core.Keyword("db","ident","db/ident",-737096),null,new cljs.core.Keyword("db","tupleAttrs","db/tupleAttrs",250080092),null], null), null);
}
datascript.schema.schema_QMARK_ = (function datascript$schema$schema_QMARK_(m){
var and__5000__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(m);
} else {
return and__5000__auto__;
}
});
datascript.schema.is_system_keyword_QMARK_ = (function datascript$schema$is_system_keyword_QMARK_(value){
var and__5000__auto__ = (((value instanceof cljs.core.Keyword)) || (typeof value === 'string'));
if(and__5000__auto__){
var temp__5802__auto__ = cljs.core.namespace(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(value));
if(cljs.core.truth_(temp__5802__auto__)){
var ns = temp__5802__auto__;
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("db",cljs.core.first(clojure.string.split.cljs$core$IFn$_invoke$arity$2(ns,/\./)));
} else {
return false;
}
} else {
return and__5000__auto__;
}
});
datascript.schema.schema_entity_QMARK_ = (function datascript$schema$schema_entity_QMARK_(entity){
return cljs.core.some((function (p1__44642_SHARP_){
return cljs.core.contains_QMARK_(entity,p1__44642_SHARP_);
}),datascript.schema.schema_keys);
});
datascript.schema.type_QMARK_ = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword("db.type","number","db.type/number",-508502688),null,new cljs.core.Keyword("db.type","instant","db.type/instant",-1024769248),null,new cljs.core.Keyword("db.type","tuple","db.type/tuple",938234914),null,new cljs.core.Keyword("db.type","uuid","db.type/uuid",1543195203),null,new cljs.core.Keyword("db.type","string","db.type/string",1432572808),null,new cljs.core.Keyword("db.type","keyword","db.type/keyword",205926793),null,new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079),null], null), null);

//# sourceMappingURL=datascript.schema.js.map
