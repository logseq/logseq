goog.provide('logseq.db.frontend.property.type');
/**
 * Valid property types only for use by internal built-in-properties
 */
logseq.db.frontend.property.type.internal_built_in_property_types = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 10, [new cljs.core.Keyword(null,"raw-number","raw-number",280226247),null,new cljs.core.Keyword(null,"property","property",-1114278232),null,new cljs.core.Keyword(null,"coll","coll",1647737163),null,new cljs.core.Keyword(null,"page","page",849072397),null,new cljs.core.Keyword(null,"string","string",-1989541586),null,new cljs.core.Keyword(null,"keyword","keyword",811389747),null,new cljs.core.Keyword(null,"class","class",-2030961996),null,new cljs.core.Keyword(null,"entity","entity",-450970276),null,new cljs.core.Keyword(null,"map","map",1371690461),null,new cljs.core.Keyword(null,"any","any",1705907423),null], null), null);
/**
 * Valid property types for users in order they appear in the UI
 */
logseq.db.frontend.property.type.user_built_in_property_types = new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword(null,"number","number",1570378438),new cljs.core.Keyword(null,"date","date",-1463434462),new cljs.core.Keyword(null,"datetime","datetime",494675702),new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),new cljs.core.Keyword(null,"url","url",276297046),new cljs.core.Keyword(null,"node","node",581201198)], null);
/**
 * Valid property :type for closed values
 */
logseq.db.frontend.property.type.closed_value_property_types = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"number","number",1570378438),null,new cljs.core.Keyword(null,"default","default",-1987822328),null,new cljs.core.Keyword(null,"url","url",276297046),null], null), null);
/**
 * Valid property types that can change cardinality
 */
logseq.db.frontend.property.type.cardinality_property_types = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"date","date",-1463434462),null,new cljs.core.Keyword(null,"number","number",1570378438),null,new cljs.core.Keyword(null,"default","default",-1987822328),null,new cljs.core.Keyword(null,"node","node",581201198),null,new cljs.core.Keyword(null,"url","url",276297046),null], null), null);
/**
 * Valid ref property :type for default value support
 */
logseq.db.frontend.property.type.default_value_ref_property_types = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"number","number",1570378438),null,new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),null,new cljs.core.Keyword(null,"default","default",-1987822328),null], null), null);
/**
 * Valid ref property :types that support text
 */
logseq.db.frontend.property.type.text_ref_property_types = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"default","default",-1987822328),null,new cljs.core.Keyword(null,"url","url",276297046),null,new cljs.core.Keyword(null,"entity","entity",-450970276),null], null), null);
if(clojure.set.subset_QMARK_(logseq.db.frontend.property.type.cardinality_property_types,cljs.core.set(logseq.db.frontend.property.type.user_built_in_property_types))){
} else {
throw (new Error(["Assert failed: ","All closed value types are valid property types","\n","(set/subset? cardinality-property-types (set user-built-in-property-types))"].join('')));
}
if(clojure.set.subset_QMARK_(logseq.db.frontend.property.type.closed_value_property_types,cljs.core.set(logseq.db.frontend.property.type.user_built_in_property_types))){
} else {
throw (new Error(["Assert failed: ","All closed value types are valid property types","\n","(set/subset? closed-value-property-types (set user-built-in-property-types))"].join('')));
}
/**
 * Property value ref types where the refed entity stores its value in
 *   :logseq.property/value e.g. :number is stored as a number. new value-ref-property-types
 *   should default to this as it allows for more querying power
 */
logseq.db.frontend.property.type.original_value_ref_property_types = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"number","number",1570378438),null], null), null);
/**
 * Property value ref types where the refed entities either store their value in
 *   :logseq.property/value or :block/title (for :default)
 */
logseq.db.frontend.property.type.value_ref_property_types = cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default","default",-1987822328),null,new cljs.core.Keyword(null,"url","url",276297046),null], null), null),logseq.db.frontend.property.type.original_value_ref_property_types);
/**
 * User ref types. Property values that users see are stored in either
 *   :logseq.property/value or :block/title. :block/title is for all the page related types
 */
logseq.db.frontend.property.type.user_ref_property_types = cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"date","date",-1463434462),null,new cljs.core.Keyword(null,"node","node",581201198),null], null), null),logseq.db.frontend.property.type.value_ref_property_types);
if(clojure.set.subset_QMARK_(logseq.db.frontend.property.type.user_ref_property_types,cljs.core.set(logseq.db.frontend.property.type.user_built_in_property_types))){
} else {
throw (new Error(["Assert failed: ","All ref types are valid property types","\n","(set/subset? user-ref-property-types (set user-built-in-property-types))"].join('')));
}
/**
 * All ref types - user and internal
 */
logseq.db.frontend.property.type.all_ref_property_types = cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"property","property",-1114278232),null,new cljs.core.Keyword(null,"page","page",849072397),null,new cljs.core.Keyword(null,"class","class",-2030961996),null,new cljs.core.Keyword(null,"entity","entity",-450970276),null], null), null),logseq.db.frontend.property.type.user_ref_property_types);
if(clojure.set.subset_QMARK_(logseq.db.frontend.property.type.all_ref_property_types,clojure.set.union.cljs$core$IFn$_invoke$arity$2(cljs.core.set(logseq.db.frontend.property.type.user_built_in_property_types),logseq.db.frontend.property.type.internal_built_in_property_types))){
} else {
throw (new Error(["Assert failed: ","All ref types are valid property types","\n","(set/subset? all-ref-property-types (set/union (set user-built-in-property-types) internal-built-in-property-types))"].join('')));
}
/**
 * Test if it is a `protocol://`-style URL.
 * Originally from common-util/url? but does not need to be the same
 */
logseq.db.frontend.property.type.url_QMARK_ = (function logseq$db$frontend$property$type$url_QMARK_(s){
var and__5000__auto__ = typeof s === 'string';
if(and__5000__auto__){
try{return (!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [null,null,"null",null], null), null),(new URL(s)).origin)));
}catch (e62150){var _e = e62150;
return false;
}} else {
return and__5000__auto__;
}
});
logseq.db.frontend.property.type.macro_url_QMARK_ = (function logseq$db$frontend$property$type$macro_url_QMARK_(s){
return logseq.common.util.macro.macro_QMARK_(s);
});
/**
 * Empty string, url or macro url
 */
logseq.db.frontend.property.type.url_entity_QMARK_ = (function logseq$db$frontend$property$type$url_entity_QMARK_(db,val,p__62161){
var map__62162 = p__62161;
var map__62162__$1 = cljs.core.__destructure_map(map__62162);
var new_closed_value_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62162__$1,new cljs.core.Keyword(null,"new-closed-value?","new-closed-value?",773408852));
if(cljs.core.truth_(new_closed_value_QMARK_)){
var or__5002__auto__ = logseq.db.frontend.property.type.url_QMARK_(val);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.db.frontend.property.type.macro_url_QMARK_(val);
}
} else {
var temp__5804__auto__ = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,val) : datascript.core.entity.call(null,db,val));
if(cljs.core.truth_(temp__5804__auto__)){
var ent = temp__5804__auto__;
var title = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ent);
var or__5002__auto__ = clojure.string.blank_QMARK_(title);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = logseq.db.frontend.property.type.url_QMARK_(title);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return logseq.db.frontend.property.type.macro_url_QMARK_(title);
}
}
} else {
return null;
}
}
});
logseq.db.frontend.property.type.entity_QMARK_ = (function logseq$db$frontend$property$type$entity_QMARK_(db,id){
return (!(((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id)) == null)));
});
logseq.db.frontend.property.type.class_entity_QMARK_ = (function logseq$db$frontend$property$type$class_entity_QMARK_(db,id){
return logseq.db.frontend.entity_util.class_QMARK_((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id)));
});
logseq.db.frontend.property.type.property_entity_QMARK_ = (function logseq$db$frontend$property$type$property_entity_QMARK_(db,id){
return logseq.db.frontend.entity_util.property_QMARK_((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id)));
});
logseq.db.frontend.property.type.page_entity_QMARK_ = (function logseq$db$frontend$property$type$page_entity_QMARK_(db,id){
return logseq.db.frontend.entity_util.page_QMARK_((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id)));
});
logseq.db.frontend.property.type.number_entity_QMARK_ = (function logseq$db$frontend$property$type$number_entity_QMARK_(db,id_or_value,p__62177){
var map__62179 = p__62177;
var map__62179__$1 = cljs.core.__destructure_map(map__62179);
var new_closed_value_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62179__$1,new cljs.core.Keyword(null,"new-closed-value?","new-closed-value?",773408852));
if(cljs.core.truth_(new_closed_value_QMARK_)){
return typeof id_or_value === 'number';
} else {
var temp__5804__auto__ = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id_or_value) : datascript.core.entity.call(null,db,id_or_value));
if(cljs.core.truth_(temp__5804__auto__)){
var entity = temp__5804__auto__;
return typeof new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865).cljs$core$IFn$_invoke$arity$1(entity) === 'number';
} else {
return null;
}
}
});
logseq.db.frontend.property.type.text_entity_QMARK_ = (function logseq$db$frontend$property$type$text_entity_QMARK_(db,s,p__62185){
var map__62186 = p__62185;
var map__62186__$1 = cljs.core.__destructure_map(map__62186);
var new_closed_value_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62186__$1,new cljs.core.Keyword(null,"new-closed-value?","new-closed-value?",773408852));
if(cljs.core.truth_(new_closed_value_QMARK_)){
return typeof s === 'string';
} else {
var temp__5804__auto__ = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,s) : datascript.core.entity.call(null,db,s));
if(cljs.core.truth_(temp__5804__auto__)){
var ent = temp__5804__auto__;
return typeof new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ent) === 'string';
} else {
return null;
}
}
});
logseq.db.frontend.property.type.node_entity_QMARK_ = (function logseq$db$frontend$property$type$node_entity_QMARK_(db,val){
var temp__5804__auto__ = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,val) : datascript.core.entity.call(null,db,val));
if(cljs.core.truth_(temp__5804__auto__)){
var ent = temp__5804__auto__;
return (!((new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ent) == null)));
} else {
return null;
}
});
logseq.db.frontend.property.type.date_QMARK_ = (function logseq$db$frontend$property$type$date_QMARK_(db,val){
var temp__5804__auto__ = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,val) : datascript.core.entity.call(null,db,val));
if(cljs.core.truth_(temp__5804__auto__)){
var ent = temp__5804__auto__;
var and__5000__auto__ = (!((new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ent) == null)));
if(and__5000__auto__){
return logseq.db.frontend.entity_util.journal_QMARK_(ent);
} else {
return and__5000__auto__;
}
} else {
return null;
}
});
/**
 * Map of types to malli validation schemas that validate a property value for that type
 */
logseq.db.frontend.property.type.built_in_validation_schemas = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"date","date",-1463434462),new cljs.core.Keyword(null,"number","number",1570378438),new cljs.core.Keyword(null,"raw-number","raw-number",280226247),new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword(null,"property","property",-1114278232),new cljs.core.Keyword(null,"coll","coll",1647737163),new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword(null,"string","string",-1989541586),new cljs.core.Keyword(null,"node","node",581201198),new cljs.core.Keyword(null,"keyword","keyword",811389747),new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.Keyword(null,"url","url",276297046),new cljs.core.Keyword(null,"datetime","datetime",494675702),new cljs.core.Keyword(null,"entity","entity",-450970276),new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.Keyword(null,"any","any",1705907423)],[new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("error","message","error/message",-502809098),"should be a journal date"], null),logseq.db.frontend.property.type.date_QMARK_], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("error","message","error/message",-502809098),"should be a number"], null),logseq.db.frontend.property.type.number_entity_QMARK_], null),cljs.core.number_QMARK_,cljs.core.boolean_QMARK_,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("error","message","error/message",-502809098),"should be a text block"], null),logseq.db.frontend.property.type.text_entity_QMARK_], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("error","message","error/message",-502809098),"should be a Property"], null),logseq.db.frontend.property.type.property_entity_QMARK_], null),cljs.core.coll_QMARK_,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("error","message","error/message",-502809098),"should be a Page"], null),logseq.db.frontend.property.type.page_entity_QMARK_], null),cljs.core.string_QMARK_,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("error","message","error/message",-502809098),"should be a page/block with tags"], null),logseq.db.frontend.property.type.node_entity_QMARK_], null),cljs.core.keyword_QMARK_,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("error","message","error/message",-502809098),"should be a Class"], null),logseq.db.frontend.property.type.class_entity_QMARK_], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("error","message","error/message",-502809098),"should be a URL"], null),logseq.db.frontend.property.type.url_entity_QMARK_], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("error","message","error/message",-502809098),"should be a datetime"], null),cljs.core.number_QMARK_], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("error","message","error/message",-502809098),"should be an Entity"], null),logseq.db.frontend.property.type.entity_QMARK_], null),cljs.core.map_QMARK_,cljs.core.some_QMARK_]);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.keys(logseq.db.frontend.property.type.built_in_validation_schemas)),cljs.core.into.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.type.internal_built_in_property_types,logseq.db.frontend.property.type.user_built_in_property_types))){
} else {
throw (new Error(["Assert failed: ","Built-in property types must be equal","\n","(= (set (keys built-in-validation-schemas)) (into internal-built-in-property-types user-built-in-property-types))"].join('')));
}
/**
 * Property types whose validation fn requires a datascript db
 */
logseq.db.frontend.property.type.property_types_with_db = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 9, [new cljs.core.Keyword(null,"date","date",-1463434462),null,new cljs.core.Keyword(null,"number","number",1570378438),null,new cljs.core.Keyword(null,"default","default",-1987822328),null,new cljs.core.Keyword(null,"property","property",-1114278232),null,new cljs.core.Keyword(null,"page","page",849072397),null,new cljs.core.Keyword(null,"node","node",581201198),null,new cljs.core.Keyword(null,"class","class",-2030961996),null,new cljs.core.Keyword(null,"url","url",276297046),null,new cljs.core.Keyword(null,"entity","entity",-450970276),null], null), null);
/**
 * Infers a user defined built-in :type from property value(s)
 */
logseq.db.frontend.property.type.infer_property_type_from_value = (function logseq$db$frontend$property$type$infer_property_type_from_value(val){
if(typeof val === 'number'){
return new cljs.core.Keyword(null,"number","number",1570378438);
} else {
if(cljs.core.truth_(logseq.db.frontend.property.type.url_QMARK_(val))){
return new cljs.core.Keyword(null,"url","url",276297046);
} else {
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [true,null,false,null], null), null),val)){
return new cljs.core.Keyword(null,"checkbox","checkbox",1612615655);
} else {
return new cljs.core.Keyword(null,"default","default",-1987822328);

}
}
}
});
/**
 * Whether property value should be stored in :logseq.property/value
 */
logseq.db.frontend.property.type.property_value_content_QMARK_ = (function logseq$db$frontend$property$type$property_value_content_QMARK_(block_type,property){
var or__5002__auto__ = (function (){var G__62213 = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
return (logseq.db.frontend.property.type.original_value_ref_property_types.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.property.type.original_value_ref_property_types.cljs$core$IFn$_invoke$arity$1(G__62213) : logseq.db.frontend.property.type.original_value_ref_property_types.call(null,G__62213));
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662));
if(and__5000__auto__){
return (logseq.db.frontend.property.type.original_value_ref_property_types.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.property.type.original_value_ref_property_types.cljs$core$IFn$_invoke$arity$1(block_type) : logseq.db.frontend.property.type.original_value_ref_property_types.call(null,block_type));
} else {
return and__5000__auto__;
}
}
});

//# sourceMappingURL=logseq.db.frontend.property.type.js.map
