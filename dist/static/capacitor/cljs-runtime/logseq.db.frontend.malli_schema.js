goog.provide('logseq.db.frontend.malli_schema');
logseq.db.frontend.malli_schema.db_attribute_ident = cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"enum","enum",1679018432)], null),logseq.db.frontend.property.db_attribute_properties);
logseq.db.frontend.malli_schema.logseq_property_ident = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"and","and",-971899817),new cljs.core.Keyword(null,"keyword","keyword",811389747),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("error","message","error/message",-502809098),"should be a valid logseq property namespace"], null),logseq.db.frontend.property.logseq_property_QMARK_], null)], null);
logseq.db.frontend.malli_schema.block_order = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"and","and",-971899817),new cljs.core.Keyword(null,"string","string",-1989541586),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("error","message","error/message",-502809098),"should be a valid fractional index"], null),logseq.db.common.order.validate_order_key_QMARK_], null)], null);
logseq.db.frontend.malli_schema.internal_property_ident = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"or","or",235744169),logseq.db.frontend.malli_schema.logseq_property_ident,logseq.db.frontend.malli_schema.db_attribute_ident], null);
/**
 * Determines if keyword/ident is a user property
 */
logseq.db.frontend.malli_schema.user_property_QMARK_ = (function logseq$db$frontend$malli_schema$user_property_QMARK_(kw){
return logseq.db.frontend.property.user_property_namespace_QMARK_(cljs.core.namespace(kw));
});
logseq.db.frontend.malli_schema.user_property_ident = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"and","and",-971899817),new cljs.core.Keyword(null,"qualified-keyword","qualified-keyword",736041675),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("error","message","error/message",-502809098),"should be a valid user property namespace"], null),logseq.db.frontend.malli_schema.user_property_QMARK_], null)], null);
/**
 * Set of all namespaces Logseq uses for :db/ident except for
 *   db-attribute-ident. It's important to grow this list purposefully and have it
 *   start with 'logseq' to allow for users and 3rd party plugins to provide their
 *   own namespaces to core concepts.
 */
logseq.db.frontend.malli_schema.logseq_ident_namespaces = cljs.core.into.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.logseq_property_namespaces,cljs.core.PersistentHashSet.createAsIfByAssoc(["logseq.kv",logseq.db.frontend.class$.logseq_class]));
logseq.db.frontend.malli_schema.logseq_ident = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"and","and",-971899817),new cljs.core.Keyword(null,"keyword","keyword",811389747),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("error","message","error/message",-502809098),"should be a valid :db/ident namespace"], null),(function logseq$db$frontend$malli_schema$logseq_namespace_QMARK_(k){
return cljs.core.contains_QMARK_(logseq.db.frontend.malli_schema.logseq_ident_namespaces,cljs.core.namespace(k));
})], null)], null);
/**
 * Determines if keyword/ident is a logseq or user class
 */
logseq.db.frontend.malli_schema.class_QMARK_ = (function logseq$db$frontend$malli_schema$class_QMARK_(kw){
return clojure.string.includes_QMARK_(cljs.core.namespace(kw),".class");
});
logseq.db.frontend.malli_schema.class_ident = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"and","and",-971899817),new cljs.core.Keyword(null,"qualified-keyword","qualified-keyword",736041675),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("error","message","error/message",-502809098),"should be a valid class namespace"], null),logseq.db.frontend.malli_schema.class_QMARK_], null)], null);
logseq.db.frontend.malli_schema.empty_placeholder_value_QMARK_ = (function logseq$db$frontend$malli_schema$empty_placeholder_value_QMARK_(db,property,property_val){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079),new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(property))){
return ((cljs.core.integer_QMARK_(property_val)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,property_val) : datascript.core.entity.call(null,db,property_val))))));
} else {
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837),property_val);
}
});
/**
 * Determines if given ident is created by Logseq. All Logseq internal idents
 * must start with 'block' or 'logseq' to keep Logseq internals from leaking
 * across namespaces and to allow for users and 3rd party plugins to choose
 * any other namespace
 */
logseq.db.frontend.malli_schema.internal_ident_QMARK_ = (function logseq$db$frontend$malli_schema$internal_ident_QMARK_(ident){
return ((cljs.core.contains_QMARK_(logseq.db.frontend.property.db_attribute_properties,ident)) || (cljs.core.contains_QMARK_(logseq.db.frontend.malli_schema.logseq_ident_namespaces,cljs.core.namespace(ident))));
});
/**
 * Validates the property value in a property tuple. The property value is
 *   expected to be a coll if the property has a :many cardinality. validate-fn is
 *   a fn that is called directly on each value to return a truthy value.
 *   validate-fn varies by property type
 */
logseq.db.frontend.malli_schema.validate_property_value = (function logseq$db$frontend$malli_schema$validate_property_value(var_args){
var args__5732__auto__ = [];
var len__5726__auto___61747 = arguments.length;
var i__5727__auto___61748 = (0);
while(true){
if((i__5727__auto___61748 < len__5726__auto___61747)){
args__5732__auto__.push((arguments[i__5727__auto___61748]));

var G__61751 = (i__5727__auto___61748 + (1));
i__5727__auto___61748 = G__61751;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return logseq.db.frontend.malli_schema.validate_property_value.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(logseq.db.frontend.malli_schema.validate_property_value.cljs$core$IFn$_invoke$arity$variadic = (function (db,validate_fn,p__61226,p__61227){
var vec__61228 = p__61226;
var property = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61228,(0),null);
var property_val = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61228,(1),null);
var map__61231 = p__61227;
var map__61231__$1 = cljs.core.__destructure_map(map__61231);
var new_closed_value_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61231__$1,new cljs.core.Keyword(null,"new-closed-value?","new-closed-value?",773408852));
var validate_fn_SINGLEQUOTE_ = (cljs.core.truth_((function (){var G__61232 = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
return (logseq.db.frontend.property.type.property_types_with_db.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.property.type.property_types_with_db.cljs$core$IFn$_invoke$arity$1(G__61232) : logseq.db.frontend.property.type.property_types_with_db.call(null,G__61232));
})())?(function (value){
var G__61233 = db;
var G__61234 = value;
var G__61235 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"new-closed-value?","new-closed-value?",773408852),new_closed_value_QMARK_], null);
return (validate_fn.cljs$core$IFn$_invoke$arity$3 ? validate_fn.cljs$core$IFn$_invoke$arity$3(G__61233,G__61234,G__61235) : validate_fn.call(null,G__61233,G__61234,G__61235));
}):validate_fn);
var validate_fn_SINGLEQUOTE__SINGLEQUOTE_ = (cljs.core.truth_((function (){var and__5000__auto__ = (function (){var G__61236 = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
return (logseq.db.frontend.property.type.closed_value_property_types.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.property.type.closed_value_property_types.cljs$core$IFn$_invoke$arity$1(G__61236) : logseq.db.frontend.property.type.closed_value_property_types.call(null,G__61236));
})();
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not(new_closed_value_QMARK_)) && (cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property))));
} else {
return and__5000__auto__;
}
})())?(function logseq$db$frontend$malli_schema$closed_value_valid_QMARK_(val){
var and__5000__auto__ = (validate_fn_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1 ? validate_fn_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1(val) : validate_fn_SINGLEQUOTE_.call(null,val));
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.contains_QMARK_(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property))),val);
} else {
return and__5000__auto__;
}
}):validate_fn_SINGLEQUOTE_);
if(logseq.db.frontend.property.many_QMARK_(property)){
return ((cljs.core.every_QMARK_(validate_fn_SINGLEQUOTE__SINGLEQUOTE_,property_val)) || (logseq.db.frontend.malli_schema.empty_placeholder_value_QMARK_(db,property,cljs.core.first(property_val))));
} else {
var or__5002__auto__ = (validate_fn_SINGLEQUOTE__SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1 ? validate_fn_SINGLEQUOTE__SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1(property_val) : validate_fn_SINGLEQUOTE__SINGLEQUOTE_.call(null,property_val));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.db.frontend.malli_schema.empty_placeholder_value_QMARK_(db,property,property_val);
}
}
}));

(logseq.db.frontend.malli_schema.validate_property_value.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(logseq.db.frontend.malli_schema.validate_property_value.cljs$lang$applyTo = (function (seq61200){
var G__61201 = cljs.core.first(seq61200);
var seq61200__$1 = cljs.core.next(seq61200);
var G__61202 = cljs.core.first(seq61200__$1);
var seq61200__$2 = cljs.core.next(seq61200__$1);
var G__61203 = cljs.core.first(seq61200__$2);
var seq61200__$3 = cljs.core.next(seq61200__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__61201,G__61202,G__61203,seq61200__$3);
}));

/**
 * Set of properties required by a schema and that are validated directly in a schema instead
 * of validate-property-value
 */
logseq.db.frontend.malli_schema.required_properties = clojure.set.union.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.class$.built_in_classes,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.class","Asset","logseq.class/Asset",-797502970),new cljs.core.Keyword(null,"schema","schema",-1582001791),new cljs.core.Keyword(null,"required-properties","required-properties",1219426728)], null))),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865),null,new cljs.core.Keyword("logseq.property.history","scalar-value","logseq.property.history/scalar-value",239337775),null,new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267),null,new cljs.core.Keyword("logseq.property.history","block","logseq.property.history/block",114255416),null,new cljs.core.Keyword("logseq.property.history","property","logseq.property.history/property",1600409082),null,new cljs.core.Keyword("logseq.property.history","ref-value","logseq.property.history/ref-value",-513136037),null], null), null));
/**
 * Provide the minimal number of property attributes to validate the property
 *   and to reduce noise in error messages. The resulting map should be the same as
 *   what the frontend property since they both call validate-property-value
 */
logseq.db.frontend.malli_schema.property_entity__GT_map = (function logseq$db$frontend$malli_schema$property_entity__GT_map(property){
var closed_values = logseq.db.common.entity_plus.lookup_kv_then_entity.cljs$core$IFn$_invoke$arity$2(property,new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952));
var G__61247 = cljs.core.select_keys(property,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("db","valueType","db/valueType",1827971944),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404)], null));
if(cljs.core.seq(closed_values)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__61247,new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952),closed_values);
} else {
return G__61247;
}
});
/**
 * Prepares properties in entities to be validated by DB schema
 */
logseq.db.frontend.malli_schema.update_properties_in_ents = (function logseq$db$frontend$malli_schema$update_properties_in_ents(db,ents){
var exceptions_to_block_properties = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.into.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.malli_schema.required_properties,logseq.db.frontend.property.schema_properties),new cljs.core.Keyword("block","tags","block/tags",1814948340));
var page_class_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329))));
var all_page_class_ids = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__61256_SHARP_){
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__61256_SHARP_) : datascript.core.entity.call(null,db,p1__61256_SHARP_)));
}),logseq.db.frontend.class$.page_classes));
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (ent){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (m,p__61267){
var vec__61268 = p__61267;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61268,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61268,(1),null);
var temp__5802__auto__ = (function (){var and__5000__auto__ = logseq.db.frontend.property.property_QMARK_(k);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = (!(cljs.core.contains_QMARK_(exceptions_to_block_properties,k)));
if(and__5000__auto____$1){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,k) : datascript.core.entity.call(null,db,k));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var property = temp__5802__auto__;
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(m,new cljs.core.Keyword("block","properties","block/properties",708347145),cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.conj,cljs.core.PersistentVector.EMPTY),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.db.frontend.malli_schema.property_entity__GT_map(property),v], null));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","tags","block/tags",1814948340),k)){
var property = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("block","tags","block/tags",1814948340)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("block","tags","block/tags",1814948340)));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,k,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.db.frontend.malli_schema.property_entity__GT_map(property),v,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.select_keys(ent,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160)], null)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"page-class-id","page-class-id",-236742387),page_class_id,new cljs.core.Keyword(null,"all-page-class-ids","all-page-class-ids",560087562),all_page_class_ids], null)], 0))], null));
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,k,v);
}
}
}),cljs.core.PersistentArrayMap.EMPTY,ent);
}),ents);
});
/**
 * Returns entity maps for given :eavt datoms indexed by db/id. Optional keys:
 * * :entity-fn - Optional fn that given an entity id, returns entity. Defaults
 *   to just doing a lookup based on existing entity-maps to be as performant as possible
 */
logseq.db.frontend.malli_schema.datoms__GT_entity_maps = (function logseq$db$frontend$malli_schema$datoms__GT_entity_maps(var_args){
var args__5732__auto__ = [];
var len__5726__auto___61814 = arguments.length;
var i__5727__auto___61815 = (0);
while(true){
if((i__5727__auto___61815 < len__5726__auto___61814)){
args__5732__auto__.push((arguments[i__5727__auto___61815]));

var G__61816 = (i__5727__auto___61815 + (1));
i__5727__auto___61815 = G__61816;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return logseq.db.frontend.malli_schema.datoms__GT_entity_maps.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(logseq.db.frontend.malli_schema.datoms__GT_entity_maps.cljs$core$IFn$_invoke$arity$variadic = (function (datoms,p__61282){
var map__61283 = p__61282;
var map__61283__$1 = cljs.core.__destructure_map(map__61283);
var entity_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61283__$1,new cljs.core.Keyword(null,"entity-fn","entity-fn",-432404580));
var ent_maps = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,p__61284){
var map__61285 = p__61284;
var map__61285__$1 = cljs.core.__destructure_map(map__61285);
var a = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61285__$1,new cljs.core.Keyword(null,"a","a",-2123407586));
var e = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61285__$1,new cljs.core.Keyword(null,"e","e",1381269198));
var v = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61285__$1,new cljs.core.Keyword(null,"v","v",21465059));
if(cljs.core.contains_QMARK_(logseq.db.frontend.schema.card_many_attributes,a)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$6(acc,e,cljs.core.update,a,cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.conj,cljs.core.PersistentHashSet.EMPTY),v);
} else {
var temp__5802__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(acc,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [e,a], null));
if(cljs.core.truth_(temp__5802__auto__)){
var existing_val = temp__5802__auto__;
if(cljs.core.set_QMARK_(existing_val)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$5(acc,e,cljs.core.assoc,a,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(existing_val,v));
} else {
return cljs.core.update.cljs$core$IFn$_invoke$arity$5(acc,e,cljs.core.assoc,a,cljs.core.PersistentHashSet.createAsIfByAssoc([v,existing_val]));
}
} else {
return cljs.core.update.cljs$core$IFn$_invoke$arity$5(acc,e,cljs.core.assoc,a,v);
}
}
}),cljs.core.PersistentArrayMap.EMPTY,datoms);
var entity_fn_SINGLEQUOTE_ = (function (){var or__5002__auto__ = entity_fn;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var db_ident_maps = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),cljs.core.identity),cljs.core.vals(ent_maps))),null);
return (function (p1__61278_SHARP_){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(db_ident_maps,p1__61278_SHARP_);
});
}
})();
return cljs.core.update_vals(ent_maps,(function (m){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__61287){
var vec__61288 = p__61287;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61288,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61288,(1),null);
var temp__5802__auto__ = (function (){var and__5000__auto__ = logseq.db.frontend.property.property_QMARK_(k);
if(cljs.core.truth_(and__5000__auto__)){
return (entity_fn_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1 ? entity_fn_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1(k) : entity_fn_SINGLEQUOTE_.call(null,k));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var property = temp__5802__auto__;
if(((logseq.db.frontend.property.many_QMARK_(property)) && ((!(cljs.core.set_QMARK_(v)))))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,cljs.core.PersistentHashSet.createAsIfByAssoc([v])], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v], null);
}
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v], null);
}
}),m));
}));
}));

(logseq.db.frontend.malli_schema.datoms__GT_entity_maps.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(logseq.db.frontend.malli_schema.datoms__GT_entity_maps.cljs$lang$applyTo = (function (seq61280){
var G__61281 = cljs.core.first(seq61280);
var seq61280__$1 = cljs.core.next(seq61280);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__61281,seq61280__$1);
}));

/**
 * Returns a vec of entity maps given :eavt datoms
 */
logseq.db.frontend.malli_schema.datoms__GT_entities = (function logseq$db$frontend$malli_schema$datoms__GT_entities(datoms){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__61298){
var vec__61299 = p__61298;
var db_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61299,(0),null);
var m = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61299,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword("db","id","db/id",-1388397098),db_id);
}),logseq.db.frontend.malli_schema.datoms__GT_entity_maps(datoms));
});
if(cljs.core.every_QMARK_((function (p1__61302_SHARP_){
return cljs.core.re_find(/^(block|logseq\.)/,cljs.core.namespace(p1__61302_SHARP_));
}),logseq.db.frontend.property.db_attribute_properties)){
} else {
throw (new Error(["Assert failed: ","All db-attribute idents start with an internal namespace","\n","(every? (fn* [p1__61302#] (re-find #\"^(block|logseq\\.)\" (namespace p1__61302#))) db-property/db-attribute-properties)"].join('')));
}
if(cljs.core.every_QMARK_((function (p1__61305_SHARP_){
return cljs.core.re_find(/^logseq\./,p1__61305_SHARP_);
}),logseq.db.frontend.malli_schema.logseq_ident_namespaces)){
} else {
throw (new Error(["Assert failed: ","All logseq idents start with an internal namespace","\n","(every? (fn* [p1__61305#] (re-find #\"^logseq\\.\" p1__61305#)) logseq-ident-namespaces)"].join('')));
}
/**
 * Used by validate-fns which need db as input
 */
logseq.db.frontend.malli_schema._STAR_db_for_validate_fns_STAR_ = null;
/**
 * A tuple of a property map and a property value
 */
logseq.db.frontend.malli_schema.property_tuple = cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"multi","multi",-190293005),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),(function (p1__61308_SHARP_){
return new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(cljs.core.first(p1__61308_SHARP_));
})], null)], null),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__61316){
var vec__61320 = p__61316;
var prop_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61320,(0),null);
var value_schema = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61320,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [prop_type,(function (){var schema_fn = ((cljs.core.vector_QMARK_(value_schema))?cljs.core.last(value_schema):value_schema);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),(function (tuple){
return logseq.db.frontend.malli_schema.validate_property_value(logseq.db.frontend.malli_schema._STAR_db_for_validate_fns_STAR_,schema_fn,tuple);
})], null);
})()], null);
}),logseq.db.frontend.property.type.built_in_validation_schemas));
/**
 * Validates a block's properties as property pairs. Properties are
 *   a vector of tuples instead of a map in order to validate each
 *   property with its property value that is valid for its type
 */
logseq.db.frontend.malli_schema.block_properties = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sequential","sequential",-1082983960),logseq.db.frontend.malli_schema.property_tuple], null);
logseq.db.frontend.malli_schema.block_tags = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"and","and",-971899817),logseq.db.frontend.malli_schema.property_tuple,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("error","message","error/message",-502809098),"should only have one tag for a built-in entity"], null),(function (p__61336){
var vec__61338 = p__61336;
var _k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61338,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61338,(1),null);
var opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61338,(2),null);
if(cljs.core.truth_(new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160).cljs$core$IFn$_invoke$arity$1(opts))){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(v));
} else {
return true;
}
})], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("error","message","error/message",-502809098),"should not have other built-in page tags when tagged with #Page"], null),(function (p__61341){
var vec__61343 = p__61341;
var _k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61343,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61343,(1),null);
var map__61346 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__61343,(2),null);
var map__61346__$1 = cljs.core.__destructure_map(map__61346);
var page_class_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61346__$1,new cljs.core.Keyword(null,"page-class-id","page-class-id",-236742387));
var all_page_class_ids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__61346__$1,new cljs.core.Keyword(null,"all-page-class-ids","all-page-class-ids",560087562));
if(cljs.core.contains_QMARK_(v,page_class_id)){
return cljs.core.empty_QMARK_(clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(cljs.core.disj.cljs$core$IFn$_invoke$arity$2(v,page_class_id),all_page_class_ids));
} else {
return true;
}
})], null)], null);
/**
 * Common attributes for page and normal blocks
 */
logseq.db.frontend.malli_schema.page_or_block_attrs = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),logseq.db.frontend.malli_schema.block_properties], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),logseq.db.frontend.malli_schema.block_tags], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","refs","block/refs",-1214495349),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"set","set",304602554),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","tx-id","block/tx-id",547556161),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"boolean","boolean",-1919418404)], null)], null);
/**
 * Common attributes for pages
 */
logseq.db.frontend.malli_schema.page_attrs = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword(null,"string","string",-1989541586)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword(null,"string","string",-1989541586)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"set","set",304602554),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null)], null);
/**
 * Common attributes for properties
 */
logseq.db.frontend.malli_schema.property_attrs = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","index","db/index",-1531680669),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"boolean","boolean",-1919418404)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","valueType","db/valueType",1827971944),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"enum","enum",1679018432),new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"enum","enum",1679018432),new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),new cljs.core.Keyword("db.cardinality","one","db.cardinality/one",1428352190)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","order","block/order",-1429282437),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),logseq.db.frontend.malli_schema.block_order], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"set","set",304602554),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null)], null);
logseq.db.frontend.malli_schema.normal_page = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null),logseq.db.frontend.malli_schema.page_attrs,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.frontend.malli_schema.page_or_block_attrs], 0)));
logseq.db.frontend.malli_schema.class_page = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096),logseq.db.frontend.malli_schema.class_ident], null)], null),logseq.db.frontend.malli_schema.page_attrs,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.frontend.malli_schema.page_or_block_attrs], 0)));
/**
 * Property :schema attributes common to all properties
 */
logseq.db.frontend.malli_schema.property_common_schema_attrs = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","hide?","logseq.property/hide?",68365746),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"boolean","boolean",-1919418404)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","public?","logseq.property/public?",1843085149),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"boolean","boolean",-1919418404)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","ui-position","logseq.property/ui-position",1869200864),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"enum","enum",1679018432),new cljs.core.Keyword(null,"properties","properties",685819552),new cljs.core.Keyword(null,"block-left","block-left",-1266158554),new cljs.core.Keyword(null,"block-right","block-right",-1578897705),new cljs.core.Keyword(null,"block-below","block-below",1808846787)], null)], null)], null);
logseq.db.frontend.malli_schema.internal_property = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096),logseq.db.frontend.malli_schema.internal_property_ident], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,new cljs.core.Keyword(null,"enum","enum",1679018432),cljs.core.into.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.type.internal_built_in_property_types,logseq.db.frontend.property.type.user_built_in_property_types))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","view-context","logseq.property/view-context",-1547395828),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"enum","enum",1679018432),new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.Keyword(null,"property","property",-1114278232),new cljs.core.Keyword(null,"never","never",50472977)], null)], null)], null),logseq.db.frontend.malli_schema.property_common_schema_attrs,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.frontend.malli_schema.property_attrs,logseq.db.frontend.malli_schema.page_attrs,logseq.db.frontend.malli_schema.page_or_block_attrs], 0)));
logseq.db.frontend.malli_schema.user_property = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"or","or",235744169),logseq.db.frontend.malli_schema.user_property_ident,logseq.db.frontend.malli_schema.class_ident], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,new cljs.core.Keyword(null,"enum","enum",1679018432),logseq.db.frontend.property.type.user_built_in_property_types)], null)], null),logseq.db.frontend.malli_schema.property_common_schema_attrs,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.frontend.malli_schema.property_attrs,logseq.db.frontend.malli_schema.page_attrs,logseq.db.frontend.malli_schema.page_or_block_attrs], 0)));
logseq.db.frontend.malli_schema.property_page = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"multi","multi",-190293005),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),(function (m){
var or__5002__auto__ = (function (){var G__61386 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(m);
if((G__61386 == null)){
return null;
} else {
return logseq.db.frontend.property.logseq_property_QMARK_(G__61386);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.contains_QMARK_(logseq.db.frontend.property.db_attribute_properties,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(m));
}
})], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [true,logseq.db.frontend.malli_schema.internal_property], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("malli.core","default","malli.core/default",-1706204176),logseq.db.frontend.malli_schema.user_property], null)], null);
logseq.db.frontend.malli_schema.hidden_page = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","order","block/order",-1429282437),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),logseq.db.frontend.malli_schema.block_order], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","hide?","logseq.property/hide?",68365746),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"enum","enum",1679018432),true], null)], null)], null),logseq.db.frontend.malli_schema.page_attrs,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.frontend.malli_schema.page_or_block_attrs], 0)));
/**
 * Common attributes for normal blocks
 */
logseq.db.frontend.malli_schema.block_attrs = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword(null,"string","string",-1989541586)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","order","block/order",-1429282437),logseq.db.frontend.malli_schema.block_order], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"set","set",304602554),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","link","block/link",-1872399993),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null);
/**
 * A (shape) block for whiteboard
 */
logseq.db.frontend.malli_schema.whiteboard_block = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword(null,"string","string",-1989541586)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","page","block/page",822314108),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"set","set",304602554),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.frontend.malli_schema.page_or_block_attrs], 0)));
/**
 * A common property value for user properties
 */
logseq.db.frontend.malli_schema.property_value_block = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"or","or",235744169),new cljs.core.Keyword(null,"string","string",-1989541586),new cljs.core.Keyword(null,"double","double",884886883),new cljs.core.Keyword(null,"boolean","boolean",-1919418404)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__61403_SHARP_){
var G__61408 = cljs.core.first(p1__61403_SHARP_);
var fexpr__61407 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","title","block/title",710445684),null,new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267),null], null), null);
return (fexpr__61407.cljs$core$IFn$_invoke$arity$1 ? fexpr__61407.cljs$core$IFn$_invoke$arity$1(G__61408) : fexpr__61407.call(null,G__61408));
}),logseq.db.frontend.malli_schema.block_attrs),logseq.db.frontend.malli_schema.page_or_block_attrs], 0)));
logseq.db.frontend.malli_schema.property_history_block_STAR_ = new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.history","block","logseq.property.history/block",114255416),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.history","property","logseq.property.history/property",1600409082),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.history","ref-value","logseq.property.history/ref-value",-513136037),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.history","scalar-value","logseq.property.history/scalar-value",239337775),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"any","any",1705907423)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","tx-id","block/tx-id",547556161),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null);
/**
 * A closed value for a property with closed/allowed values
 */
logseq.db.frontend.malli_schema.property_history_block = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"and","and",-971899817),logseq.db.frontend.malli_schema.property_history_block_STAR_,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("error","message","error/message",-502809098),":logseq.property.history/ref-value or :logseq.property.history/scalar-value required",new cljs.core.Keyword("error","path","error/path",-419192760),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.history","ref-value","logseq.property.history/ref-value",-513136037)], null)], null),(function (m){
var or__5002__auto__ = new cljs.core.Keyword("logseq.property.history","ref-value","logseq.property.history/ref-value",-513136037).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (!((new cljs.core.Keyword("logseq.property.history","scalar-value","logseq.property.history/scalar-value",239337775).cljs$core$IFn$_invoke$arity$1(m) == null)));
}
})], null)], null);
logseq.db.frontend.malli_schema.closed_value_block_STAR_ = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461)], null),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),logseq.db.frontend.malli_schema.logseq_property_ident], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"string","string",-1989541586)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"or","or",235744169),new cljs.core.Keyword(null,"string","string",-1989541586),new cljs.core.Keyword(null,"double","double",884886883)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","closed-value-property","block/closed-value-property",1157792813),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"set","set",304602554),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__61420_SHARP_){
var G__61444 = cljs.core.first(p1__61420_SHARP_);
var fexpr__61443 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","title","block/title",710445684),null,new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267),null], null), null);
return (fexpr__61443.cljs$core$IFn$_invoke$arity$1 ? fexpr__61443.cljs$core$IFn$_invoke$arity$1(G__61444) : fexpr__61443.call(null,G__61444));
}),logseq.db.frontend.malli_schema.block_attrs),logseq.db.frontend.malli_schema.page_or_block_attrs], 0)));
/**
 * A closed value for a property with closed/allowed values
 */
logseq.db.frontend.malli_schema.closed_value_block = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"and","and",-971899817),logseq.db.frontend.malli_schema.closed_value_block_STAR_,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("error","message","error/message",-502809098),":block/title or :logseq.property/value required",new cljs.core.Keyword("error","path","error/path",-419192760),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865)], null)], null),(function (m){
var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865).cljs$core$IFn$_invoke$arity$1(m);
}
})], null)], null);
/**
 * A block with content and no special type or tag behavior
 */
logseq.db.frontend.malli_schema.normal_block = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461)], null),logseq.db.frontend.malli_schema.block_attrs,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.frontend.malli_schema.page_or_block_attrs], 0)));
/**
 * A block has content and a page
 */
logseq.db.frontend.malli_schema.block = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"or","or",235744169),logseq.db.frontend.malli_schema.normal_block,logseq.db.frontend.malli_schema.whiteboard_block], null);
/**
 * A block tagged with #Asset
 */
logseq.db.frontend.malli_schema.asset_block = cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098),new cljs.core.Keyword(null,"string","string",-1989541586)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.asset","checksum","logseq.property.asset/checksum",-1011416979),new cljs.core.Keyword(null,"string","string",-1989541586)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property.asset","size","logseq.property.asset/size",-116786219),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.frontend.malli_schema.block_attrs,logseq.db.frontend.malli_schema.page_or_block_attrs], 0)));
logseq.db.frontend.malli_schema.file_block = new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","tx-id","block/tx-id",547556161),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","content","file/content",12680964),new cljs.core.Keyword(null,"string","string",-1989541586)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","path","file/path",-191335748),new cljs.core.Keyword(null,"string","string",-1989541586)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","size","file/size",1053598731),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","created-at","file/created-at",-92397056),cljs.core.inst_QMARK_], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","last-modified-at","file/last-modified-at",473527310),cljs.core.inst_QMARK_], null)], null);
/**
 * A key value map with :db/ident and :kv/value
 */
logseq.db.frontend.malli_schema.db_ident_key_val = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096),logseq.db.frontend.malli_schema.logseq_ident], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("kv","value","kv/value",305981670),new cljs.core.Keyword(null,"any","any",1705907423)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","tx-id","block/tx-id",547556161),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null);
logseq.db.frontend.malli_schema.property_value_placeholder = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"=","=",1152933628),new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword(null,"uuid","uuid",-2145095719)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","tx-id","block/tx-id",547556161),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","properties","block/properties",708347145),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"optional","optional",2053951509),true], null),logseq.db.frontend.malli_schema.block_properties], null)], null);
logseq.db.frontend.malli_schema.entity_dispatch_key = (function logseq$db$frontend$malli_schema$entity_dispatch_key(db,ent){
var d = (cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(ent))?(function (){var G__61529 = db;
var G__61530 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(ent)], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__61529,G__61530) : datascript.core.entity.call(null,G__61529,G__61530));
})():ent);
var dispatch_key = (cljs.core.truth_(logseq.db.frontend.entity_util.property_QMARK_(d))?new cljs.core.Keyword(null,"property","property",-1114278232):(cljs.core.truth_(logseq.db.frontend.entity_util.class_QMARK_(d))?new cljs.core.Keyword(null,"class","class",-2030961996):((logseq.db.frontend.entity_util.hidden_QMARK_(d))?new cljs.core.Keyword(null,"hidden","hidden",-312506092):(cljs.core.truth_(logseq.db.frontend.entity_util.whiteboard_QMARK_(d))?new cljs.core.Keyword(null,"normal-page","normal-page",-1855183012):(cljs.core.truth_(logseq.db.frontend.entity_util.page_QMARK_(d))?new cljs.core.Keyword(null,"normal-page","normal-page",-1855183012):((logseq.db.frontend.entity_util.asset_QMARK_(d))?new cljs.core.Keyword(null,"asset-block","asset-block",1420117445):(cljs.core.truth_(new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(d))?new cljs.core.Keyword(null,"file-block","file-block",1752172941):(cljs.core.truth_(new cljs.core.Keyword("logseq.property.history","block","logseq.property.history/block",114255416).cljs$core$IFn$_invoke$arity$1(d))?new cljs.core.Keyword(null,"property-history-block","property-history-block",-1318937759):(cljs.core.truth_(new cljs.core.Keyword("block","closed-value-property","block/closed-value-property",1157792813).cljs$core$IFn$_invoke$arity$1(d))?new cljs.core.Keyword(null,"closed-value-block","closed-value-block",-1764886478):(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(d);
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865).cljs$core$IFn$_invoke$arity$1(d);
} else {
return and__5000__auto__;
}
})())?new cljs.core.Keyword(null,"property-value-block","property-value-block",-1386820629):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(d),new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837)))?new cljs.core.Keyword(null,"property-value-placeholder","property-value-placeholder",1872295809):(cljs.core.truth_(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(d))?new cljs.core.Keyword(null,"block","block",664686210):(cljs.core.truth_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(d))?new cljs.core.Keyword(null,"db-ident-key-value","db-ident-key-value",1197972959):null)))))))))))));
return dispatch_key;
});
logseq.db.frontend.malli_schema.Data = cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"multi","multi",-190293005),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),(function (d){
return logseq.db.frontend.malli_schema.entity_dispatch_key(logseq.db.frontend.malli_schema._STAR_db_for_validate_fns_STAR_,d);
})], null)], null),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"property-history-block","property-history-block",-1318937759),new cljs.core.Keyword(null,"property-value-placeholder","property-value-placeholder",1872295809),new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword(null,"asset-block","asset-block",1420117445),new cljs.core.Keyword(null,"property","property",-1114278232),new cljs.core.Keyword(null,"property-value-block","property-value-block",-1386820629),new cljs.core.Keyword(null,"file-block","file-block",1752172941),new cljs.core.Keyword(null,"closed-value-block","closed-value-block",-1764886478),new cljs.core.Keyword(null,"hidden","hidden",-312506092),new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.Keyword(null,"normal-page","normal-page",-1855183012),new cljs.core.Keyword(null,"db-ident-key-value","db-ident-key-value",1197972959)],[logseq.db.frontend.malli_schema.property_history_block,logseq.db.frontend.malli_schema.property_value_placeholder,logseq.db.frontend.malli_schema.block,logseq.db.frontend.malli_schema.asset_block,logseq.db.frontend.malli_schema.property_page,logseq.db.frontend.malli_schema.property_value_block,logseq.db.frontend.malli_schema.file_block,logseq.db.frontend.malli_schema.closed_value_block,logseq.db.frontend.malli_schema.hidden_page,logseq.db.frontend.malli_schema.class_page,logseq.db.frontend.malli_schema.normal_page,logseq.db.frontend.malli_schema.db_ident_key_val]));
/**
 * Malli schema for entities from db-schema/schema. In order to
 *   thoroughly validate properties, the entities and this schema should be
 *   prepared with update-properties-in-ents and update-properties-in-schema
 *   respectively
 */
logseq.db.frontend.malli_schema.DB = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sequential","sequential",-1082983960),logseq.db.frontend.malli_schema.Data], null);
var malli_many_ref_attrs_61992 = cljs.core.set(cljs.core.into.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.public_db_attribute_properties,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__61595_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.last(p1__61595_SHARP_),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"set","set",304602554),new cljs.core.Keyword(null,"int","int",-1741416922)], null));
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(logseq.db.frontend.malli_schema.property_attrs,logseq.db.frontend.malli_schema.page_attrs,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.frontend.malli_schema.block_attrs,logseq.db.frontend.malli_schema.page_or_block_attrs,cljs.core.rest(logseq.db.frontend.malli_schema.closed_value_block_STAR_)], 0))))));
var temp__5804__auto___61996 = cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(malli_many_ref_attrs_61992,logseq.db.frontend.schema.card_many_ref_type_attributes));
if(temp__5804__auto___61996){
var undeclared_ref_attrs_61997 = temp__5804__auto___61996;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["The malli DB schema is missing the following cardinality-many ref attributes from datascript's schema: ",clojure.string.join.cljs$core$IFn$_invoke$arity$2(", ",undeclared_ref_attrs_61997)].join(''),cljs.core.PersistentArrayMap.EMPTY);
} else {
}
var malli_one_ref_attrs_61999 = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__61625_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.last(p1__61625_SHARP_),new cljs.core.Keyword(null,"int","int",-1741416922));
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(logseq.db.frontend.malli_schema.property_attrs,logseq.db.frontend.malli_schema.page_attrs,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.frontend.malli_schema.block_attrs,logseq.db.frontend.malli_schema.page_or_block_attrs,cljs.core.rest(logseq.db.frontend.malli_schema.normal_page)], 0)))));
var temp__5804__auto___62013 = cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(malli_one_ref_attrs_61999,logseq.db.frontend.schema.card_one_ref_type_attributes));
if(temp__5804__auto___62013){
var undeclared_ref_attrs_62014 = temp__5804__auto___62013;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["The malli DB schema is missing the following cardinality-one ref attributes from datascript's schema: ",clojure.string.join.cljs$core$IFn$_invoke$arity$2(", ",undeclared_ref_attrs_62014)].join(''),cljs.core.PersistentArrayMap.EMPTY);
} else {
}
var malli_non_ref_attrs_62015 = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__61652_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.last(p1__61652_SHARP_),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"set","set",304602554),new cljs.core.Keyword(null,"int","int",-1741416922)], null));
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.rest(logseq.db.frontend.malli_schema.file_block),cljs.core.rest(logseq.db.frontend.malli_schema.property_value_block),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.rest(logseq.db.frontend.malli_schema.db_ident_key_val),cljs.core.rest(logseq.db.frontend.malli_schema.internal_property),cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(logseq.db.frontend.malli_schema.property_attrs,logseq.db.frontend.malli_schema.page_attrs,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.frontend.malli_schema.block_attrs,logseq.db.frontend.malli_schema.page_or_block_attrs,cljs.core.rest(logseq.db.frontend.malli_schema.normal_page)], 0))], 0)))));
var temp__5804__auto___62018 = cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(malli_non_ref_attrs_62015,logseq.db.frontend.schema.db_non_ref_attributes));
if(temp__5804__auto___62018){
var undeclared_attrs_62022 = temp__5804__auto___62018;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["The malli DB schema is missing the following non ref attributes from datascript's schema: ",clojure.string.join.cljs$core$IFn$_invoke$arity$2(", ",undeclared_attrs_62022)].join(''),cljs.core.PersistentArrayMap.EMPTY);
} else {
}

//# sourceMappingURL=logseq.db.frontend.malli_schema.js.map
