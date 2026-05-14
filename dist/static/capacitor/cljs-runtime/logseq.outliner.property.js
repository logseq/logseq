goog.provide('logseq.outliner.property');
logseq.outliner.property.throw_error_if_read_only_property = (function logseq$outliner$property$throw_error_if_read_only_property(property_ident){
if(cljs.core.truth_((logseq.db.frontend.property.read_only_properties.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.property.read_only_properties.cljs$core$IFn$_invoke$arity$1(property_ident) : logseq.db.frontend.property.read_only_properties.call(null,property_ident)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Read-only property value shouldn't be edited",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"property","property",-1114278232),property_ident], null));
} else {
return null;
}
});
logseq.outliner.property.build_property_value_tx_data = (function logseq$outliner$property$build_property_value_tx_data(conn,block,property_id,value){
if((!((value == null)))){
var old_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,property_id);
var property = (function (){var G__64259 = cljs.core.deref(conn);
var G__64260 = property_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64259,G__64260) : datascript.core.entity.call(null,G__64259,G__64260));
})();
var multiple_values_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(property));
var retract_multiple_values_QMARK_ = ((multiple_values_QMARK_) && (cljs.core.sequential_QMARK_(value)));
var multiple_values_empty_QMARK_ = ((cljs.core.sequential_QMARK_(old_value)) && (cljs.core.contains_QMARK_(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),old_value)),new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837))));
var update_block_tx = (function (){var G__64263 = logseq.outliner.core.block_with_updated_at(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block)], null));
var G__64263__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__64263,property_id,value)
;
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword("logseq.property","deadline","logseq.property/deadline",1685901604),null,new cljs.core.Keyword("logseq.property","status","logseq.property/status",-907216853),null,new cljs.core.Keyword("logseq.property","scheduled","logseq.property/scheduled",1644520943),null], null), null),property_id);
if(and__5000__auto__){
var and__5000__auto____$1 = (function (){var or__5002__auto__ = cljs.core.empty_QMARK_(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return (logseq.db.internal_page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.internal_page_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.internal_page_QMARK_.call(null,block));
}
})();
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(cljs.core.get.cljs$core$IFn$_invoke$arity$2((function (){var G__64265 = cljs.core.deref(conn);
var G__64266 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [property_id], null);
var G__64267 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
return (datascript.core.pull.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull.cljs$core$IFn$_invoke$arity$3(G__64265,G__64266,G__64267) : datascript.core.pull.call(null,G__64265,G__64266,G__64267));
})(),property_id));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__64263__$1,new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Task","logseq.class/Task",-1282181457));
} else {
return G__64263__$1;
}
})();
var G__64270 = cljs.core.PersistentVector.EMPTY;
var G__64270__$1 = ((multiple_values_empty_QMARK_)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__64270,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(update_block_tx),property_id,new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837)], null)):G__64270);
var G__64270__$2 = ((retract_multiple_values_QMARK_)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__64270__$1,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(update_block_tx),property_id], null)):G__64270__$1);
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__64270__$2,update_block_tx);

} else {
return null;
}
});
/**
 * Gets a malli schema to validate the property value for the given property type and builds
 * it with additional args like datascript db
 */
logseq.outliner.property.get_property_value_schema = (function logseq$outliner$property$get_property_value_schema(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64917 = arguments.length;
var i__5727__auto___64918 = (0);
while(true){
if((i__5727__auto___64918 < len__5726__auto___64917)){
args__5732__auto__.push((arguments[i__5727__auto___64918]));

var G__64919 = (i__5727__auto___64918 + (1));
i__5727__auto___64918 = G__64919;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return logseq.outliner.property.get_property_value_schema.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(logseq.outliner.property.get_property_value_schema.cljs$core$IFn$_invoke$arity$variadic = (function (db,property_type,property,p__64303){
var map__64304 = p__64303;
var map__64304__$1 = cljs.core.__destructure_map(map__64304);
var new_closed_value_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__64304__$1,new cljs.core.Keyword(null,"new-closed-value?","new-closed-value?",773408852),false);
var property_val_schema = (function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.type.built_in_validation_schemas,property_type);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["No validation for property type ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([property_type], 0))].join(''),cljs.core.PersistentArrayMap.EMPTY);
}
})();
var vec__64305 = ((cljs.core.vector_QMARK_(property_val_schema))?cljs.core.rest(property_val_schema):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.PersistentArrayMap.EMPTY,property_val_schema], null));
var schema_opts = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64305,(0),null);
var schema_fn = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64305,(1),null);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fn","fn",-1175266204),schema_opts,(function logseq$outliner$property$property_value_schema(property_val){
return logseq.db.frontend.malli_schema.validate_property_value.cljs$core$IFn$_invoke$arity$variadic(db,schema_fn,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property,property_val], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"new-closed-value?","new-closed-value?",773408852),new_closed_value_QMARK_], null)], 0));
})], null);
}));

(logseq.outliner.property.get_property_value_schema.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(logseq.outliner.property.get_property_value_schema.cljs$lang$applyTo = (function (seq64292){
var G__64293 = cljs.core.first(seq64292);
var seq64292__$1 = cljs.core.next(seq64292);
var G__64294 = cljs.core.first(seq64292__$1);
var seq64292__$2 = cljs.core.next(seq64292__$1);
var G__64295 = cljs.core.first(seq64292__$2);
var seq64292__$3 = cljs.core.next(seq64292__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__64293,G__64294,G__64295,seq64292__$3);
}));

logseq.outliner.property.fail_parse_double = (function logseq$outliner$property$fail_parse_double(v_str){
var result = cljs.core.parse_double(v_str);
var or__5002__auto__ = result;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Can't convert \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(v_str),"\" to a number"].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),["Can't convert \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(v_str),"\" to a number"].join(''),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"error","error",-978969032)], null)], null));
}
});
logseq.outliner.property.convert_property_input_string = (function logseq$outliner$property$convert_property_input_string(block_type,property,v_str){
var schema_type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
if(((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"number","number",1570378438),schema_type)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"number","number",1570378438),block_type)))))) && (typeof v_str === 'string'))){
return logseq.outliner.property.fail_parse_double(v_str);
} else {
return v_str;
}
});
/**
 * Updates property type and cardinality
 */
logseq.outliner.property.update_datascript_schema = (function logseq$outliner$property$update_datascript_schema(property,schema){
var new_type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(schema);
var cardinality = new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(schema);
var ident = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property);
var cardinality__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cardinality,new cljs.core.Keyword(null,"many","many",1092119164)))?new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234):new cljs.core.Keyword("db.cardinality","one","db.cardinality/one",1428352190));
var old_type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var old_ref_type_QMARK_ = (logseq.db.frontend.property.type.user_ref_property_types.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.property.type.user_ref_property_types.cljs$core$IFn$_invoke$arity$1(old_type) : logseq.db.frontend.property.type.user_ref_property_types.call(null,old_type));
var ref_type_QMARK_ = (logseq.db.frontend.property.type.user_ref_property_types.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.property.type.user_ref_property_types.cljs$core$IFn$_invoke$arity$1(new_type) : logseq.db.frontend.property.type.user_ref_property_types.call(null,new_type));
var G__64326 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__64329 = logseq.outliner.core.block_with_updated_at(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","ident","db/ident",-737096),ident,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),cardinality__$1], null));
if(cljs.core.truth_(ref_type_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__64329,new cljs.core.Keyword("db","valueType","db/valueType",1827971944),new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079));
} else {
return G__64329;
}
})()], null);
if(cljs.core.truth_((function (){var and__5000__auto__ = new_type;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = old_ref_type_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not(ref_type_QMARK_);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__64326,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("db","valueType","db/valueType",1827971944)], null));
} else {
return G__64326;
}
});
logseq.outliner.property.update_property = (function logseq$outliner$property$update_property(conn,db_ident,property,schema,p__64344){
var map__64345 = p__64344;
var map__64345__$1 = cljs.core.__destructure_map(map__64345);
var property_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64345__$1,new cljs.core.Keyword(null,"property-name","property-name",-1399851434));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64345__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
if((((!((property_name == null)))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(property_name,new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property))))){
logseq.outliner.validate.validate_page_title(property_name,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node","node",581201198),property], null));

logseq.outliner.validate.validate_page_title_characters(property_name,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node","node",581201198),property], null));

logseq.outliner.validate.validate_block_title(cljs.core.deref(conn),property_name,property);

logseq.outliner.validate.validate_property_title(property_name);
} else {
}

var changed_property_attrs = (function (){var G__64352 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__64354){
var vec__64359 = p__64354;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64359,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64359,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$2(property,k),v)){
return null;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v], null);
}
}),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(schema,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659))));
if((((!((property_name == null)))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(property_name,new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property))))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__64352,new cljs.core.Keyword("block","title","block/title",710445684),property_name,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","name","block/name",1619760316),logseq.common.util.page_name_sanity_lc(property_name)], 0));
} else {
return G__64352;
}
})();
var property_tx_data = (function (){var G__64369 = cljs.core.PersistentVector.EMPTY;
var G__64369__$1 = ((cljs.core.seq(changed_property_attrs))?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__64369,logseq.outliner.core.block_with_updated_at(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","ident","db/ident",-737096),db_ident], null),changed_property_attrs], 0)))):G__64369);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.seq(schema);
if(and__5000__auto__){
var or__5002__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(schema),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var and__5000__auto____$1 = new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(schema);
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(schema),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.name(new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(property))));
} else {
return and__5000__auto____$1;
}
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return ((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(schema))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079),new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(property))))) || (cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property))));
}
}
} else {
return and__5000__auto__;
}
})())){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(G__64369__$1,logseq.outliner.property.update_datascript_schema(property,schema));
} else {
return G__64369__$1;
}
})();
var tx_data = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(property_tx_data,((cljs.core.seq(properties))?cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__64373){
var vec__64374 = p__64373;
var property_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64374,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__64374,(1),null);
return logseq.outliner.property.build_property_value_tx_data(conn,property,property_id,v);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties], 0)):null));
var many__GT_one_QMARK_ = ((logseq.db.frontend.property.many_QMARK_(property)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"one","one",935007904),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(schema))));
if(((many__GT_one_QMARK_) && (cljs.core.seq(datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),db_ident))))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Disallowed many to one conversion",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),"This property can't change from multiple values to one value because it has existing data.",new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"warning","warning",-1685650671)], null)], null));
} else {
}

if(cljs.core.seq(tx_data)){
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_data,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"update-property","update-property",348681633),new cljs.core.Keyword(null,"property-id","property-id",404996975),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property)], null));
} else {
}

return property;
});
logseq.outliner.property.validate_property_value_aux = (function logseq$outliner$property$validate_property_value_aux(schema,value,p__64394){
var map__64395 = p__64394;
var map__64395__$1 = cljs.core.__destructure_map(map__64395);
var many_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64395__$1,new cljs.core.Keyword(null,"many?","many?",-605360673));
var value_SINGLEQUOTE_ = (cljs.core.truth_((function (){var and__5000__auto__ = many_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.sequential_QMARK_(value)));
} else {
return and__5000__auto__;
}
})())?cljs.core.PersistentHashSet.createAsIfByAssoc([value]):value);
return malli.error.humanize.cljs$core$IFn$_invoke$arity$1(malli.util.explain_data.cljs$core$IFn$_invoke$arity$2(schema,value_SINGLEQUOTE_));
});
logseq.outliner.property.validate_property_value = (function logseq$outliner$property$validate_property_value(db,property,value){
var property_type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var many_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(property));
var schema = logseq.outliner.property.get_property_value_schema(db,property_type,property);
return logseq.outliner.property.validate_property_value_aux(schema,value,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"many?","many?",-605360673),many_QMARK_], null));
});
logseq.outliner.property.__GT_eid = (function logseq$outliner$property$__GT_eid(id){
if(cljs.core.uuid_QMARK_(id)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
} else {
return id;
}
});
/**
 * Adds the raw property pair (value not modified) to the given block if the property value is valid
 */
logseq.outliner.property.raw_set_block_property_BANG_ = (function logseq$outliner$property$raw_set_block_property_BANG_(conn,block,property,property_type,new_value){
logseq.outliner.property.throw_error_if_read_only_property(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));

var k_name = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(property);
var property_id = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property);
var schema = logseq.outliner.property.get_property_value_schema(cljs.core.deref(conn),property_type,property);
var temp__5802__auto__ = (function (){var and__5000__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new_value,new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837));
if(and__5000__auto__){
return logseq.outliner.property.validate_property_value_aux(schema,new_value,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"many?","many?",-605360673),logseq.db.frontend.property.many_QMARK_(property)], null));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var msg = temp__5802__auto__;
var msg_SINGLEQUOTE_ = ["\"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(k_name),"\""," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(((cljs.core.coll_QMARK_(msg))?cljs.core.first(msg):msg))].join('');
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Schema validation failed",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),msg_SINGLEQUOTE_,new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"warning","warning",-1685650671)], null)], null));
} else {
var tx_data = logseq.outliner.property.build_property_value_tx_data(conn,block,property_id,new_value);
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_data,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
}
});
/**
 * Creates a property value block for the given property and value. Adds it to
 *   block if given block.
 */
logseq.outliner.property.create_property_text_block_BANG_ = (function logseq$outliner$property$create_property_text_block_BANG_(conn,block_id,property_id,value,p__64482){
var map__64490 = p__64482;
var map__64490__$1 = cljs.core.__destructure_map(map__64490);
var new_block_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64490__$1,new cljs.core.Keyword(null,"new-block-id","new-block-id",2138942695));
var property = (function (){var G__64500 = cljs.core.deref(conn);
var G__64501 = property_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64500,G__64501) : datascript.core.entity.call(null,G__64500,G__64501));
})();
var block = (cljs.core.truth_(block_id)?(function (){var G__64503 = cljs.core.deref(conn);
var G__64504 = block_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64503,G__64504) : datascript.core.entity.call(null,G__64503,G__64504));
})():null);
var _ = (((!((property == null))))?null:(function(){throw (new Error(["Assert failed: ",["Property ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(property_id)," doesn't exist yet"].join(''),"\n","(some? property)"].join('')))})());
var value_SINGLEQUOTE_ = logseq.outliner.property.convert_property_input_string(new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(block),property,value);
var new_value_block = (function (){var G__64524 = logseq.db.frontend.property.build.build_property_value_block((function (){var or__5002__auto__ = block;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return property;
}
})(),property,value_SINGLEQUOTE_);
if(cljs.core.truth_(new_block_id)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__64524,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new_block_id);
} else {
return G__64524;
}
})();
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new_value_block], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"insert-blocks","insert-blocks",-1269782013)], null));

var property_id__$1 = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property);
if(cljs.core.truth_((function (){var and__5000__auto__ = property_id__$1;
if(cljs.core.truth_(and__5000__auto__)){
return block;
} else {
return and__5000__auto__;
}
})())){
var temp__5804__auto___64972 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__64535 = cljs.core.deref(conn);
var G__64536 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new_value_block)], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64535,G__64536) : datascript.core.entity.call(null,G__64535,G__64536));
})());
if(cljs.core.truth_(temp__5804__auto___64972)){
var block_id_64975__$1 = temp__5804__auto___64972;
logseq.outliner.property.raw_set_block_property_BANG_(conn,block,property,new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property),block_id_64975__$1);
} else {
}
} else {
}

return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new_value_block);
});
logseq.outliner.property.get_property_value_eid = (function logseq$outliner$property$get_property_value_eid(db,property_id,raw_value){
return cljs.core.first((function (){var G__64551 = new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?v","?v",-464183118,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"?property-id","?property-id",1609045570,null),new cljs.core.Symbol(null,"?raw-value","?raw-value",-1541028400,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"?property-id","?property-id",1609045570,null),new cljs.core.Symbol(null,"?v","?v",-464183118,null)], null),cljs.core.list(new cljs.core.Symbol(null,"or","or",1876275696,null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?v","?v",-464183118,null),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Symbol(null,"?raw-value","?raw-value",-1541028400,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?v","?v",-464183118,null),new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865),new cljs.core.Symbol(null,"?raw-value","?raw-value",-1541028400,null)], null))], null);
var G__64552 = db;
var G__64553 = property_id;
var G__64554 = raw_value;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$4 ? datascript.core.q.cljs$core$IFn$_invoke$arity$4(G__64551,G__64552,G__64553,G__64554) : datascript.core.q.call(null,G__64551,G__64552,G__64553,G__64554));
})());
});
/**
 * Find or create a property value. Only to be used with properties that have ref types
 */
logseq.outliner.property.find_or_create_property_value = (function logseq$outliner$property$find_or_create_property_value(conn,property_id,v){
var property = (function (){var G__64577 = cljs.core.deref(conn);
var G__64578 = property_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64577,G__64578) : datascript.core.entity.call(null,G__64577,G__64578));
})();
var closed_values_QMARK_ = cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property));
var default_or_url_QMARK_ = cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default","default",-1987822328),null,new cljs.core.Keyword(null,"url","url",276297046),null], null), null),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property));
if(closed_values_QMARK_){
return logseq.outliner.property.get_property_value_eid(cljs.core.deref(conn),property_id,v);
} else {
if(((default_or_url_QMARK_) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(property_id,new cljs.core.Keyword("logseq.property","order-list-type","logseq.property/order-list-type",607817111))))){
var v_uuid = logseq.outliner.property.create_property_text_block_BANG_(conn,null,property_id,v,cljs.core.PersistentArrayMap.EMPTY);
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__64603 = cljs.core.deref(conn);
var G__64604 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),v_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64603,G__64604) : datascript.core.entity.call(null,G__64603,G__64604));
})());
} else {
var or__5002__auto__ = logseq.outliner.property.get_property_value_eid(cljs.core.deref(conn),property_id,v);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var v_uuid = logseq.outliner.property.create_property_text_block_BANG_(conn,null,property_id,v,cljs.core.PersistentArrayMap.EMPTY);
return new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((function (){var G__64606 = cljs.core.deref(conn);
var G__64607 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),v_uuid], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64606,G__64607) : datascript.core.entity.call(null,G__64606,G__64607));
})());
}

}
}
});
/**
 * Converts a ref property's value whether it's an integer or a string. Creates
 * a property ref value for a string value if necessary
 */
logseq.outliner.property.convert_ref_property_value = (function logseq$outliner$property$convert_ref_property_value(conn,property_id,v,property_type){
var number_property_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_type,new cljs.core.Keyword(null,"number","number",1570378438));
if(((cljs.core.integer_QMARK_(v)) && ((((!(number_property_QMARK_))) || (((number_property_QMARK_) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_id,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1((function (){var G__64622 = cljs.core.deref(conn);
var G__64623 = v;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64622,G__64623) : datascript.core.entity.call(null,G__64622,G__64623));
})())))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1((function (){var G__64625 = cljs.core.deref(conn);
var G__64626 = v;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64625,G__64626) : datascript.core.entity.call(null,G__64625,G__64626));
})()))))))))))){
return v;
} else {
var temp__5804__auto__ = ((((number_property_QMARK_) && (typeof v === 'string')))?cljs.core.parse_double(v):v);
if(cljs.core.truth_(temp__5804__auto__)){
var v_SINGLEQUOTE_ = temp__5804__auto__;
return logseq.outliner.property.find_or_create_property_value(conn,property_id,v_SINGLEQUOTE_);
} else {
return null;
}
}
});
logseq.outliner.property.throw_error_if_self_value = (function logseq$outliner$property$throw_error_if_self_value(block,value,ref_QMARK_){
if(cljs.core.truth_((function (){var and__5000__auto__ = ref_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(value,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block));
} else {
return and__5000__auto__;
}
})())){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Can't set this block itself as own property value",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),"Can't set this block itself as own property value",new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"error","error",-978969032)], null)], null));
} else {
return null;
}
});
logseq.outliner.property.batch_remove_property_BANG_ = (function logseq$outliner$property$batch_remove_property_BANG_(conn,block_ids,property_id){
logseq.outliner.property.throw_error_if_read_only_property(property_id);

var block_eids = cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.outliner.property.__GT_eid,block_ids);
var blocks = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (id){
var G__64647 = cljs.core.deref(conn);
var G__64648 = id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64647,G__64648) : datascript.core.entity.call(null,G__64647,G__64648));
}),block_eids);
var block_id_set = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),blocks));
if(cljs.core.seq(blocks)){
var temp__5804__auto__ = (function (){var G__64657 = cljs.core.deref(conn);
var G__64658 = property_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64657,G__64658) : datascript.core.entity.call(null,G__64657,G__64658));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var property = temp__5804__auto__;
var txs = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (block){
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,property_id);
var entities = ((datascript.impl.entity.entity_QMARK_(value))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [value], null):((((cljs.core.sequential_QMARK_(value)) && (cljs.core.every_QMARK_(datascript.impl.entity.entity_QMARK_,value))))?value:null
));
var deleting_entities = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (value__$1){
var and__5000__auto__ = new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(value__$1);
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not((function (){var or__5002__auto__ = logseq.db.frontend.entity_util.page_QMARK_(value__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (logseq.db.closed_value_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.closed_value_QMARK_.cljs$core$IFn$_invoke$arity$1(value__$1) : logseq.db.closed_value_QMARK_.call(null,value__$1));
}
})())) && (cljs.core.empty_QMARK_(clojure.set.difference.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(cljs.core.deref(conn),new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(value__$1)))),block_id_set))));
} else {
return and__5000__auto__;
}
}),entities);
var retract_blocks_tx = ((cljs.core.seq(deleting_entities))?new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(logseq.outliner.core.delete_blocks(cljs.core.deref(conn),deleting_entities)):null);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property)], null)], null),retract_blocks_tx);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([blocks], 0));
if(cljs.core.seq(txs)){
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,txs,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});
/**
 * Sets properties for multiple blocks. Automatically handles property value refs.
 * Does no validation of property values.
 */
logseq.outliner.property.batch_set_property_BANG_ = (function logseq$outliner$property$batch_set_property_BANG_(var_args){
var G__64723 = arguments.length;
switch (G__64723) {
case 4:
return logseq.outliner.property.batch_set_property_BANG_.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return logseq.outliner.property.batch_set_property_BANG_.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.outliner.property.batch_set_property_BANG_.cljs$core$IFn$_invoke$arity$4 = (function (conn,block_ids,property_id,v){
return logseq.outliner.property.batch_set_property_BANG_.cljs$core$IFn$_invoke$arity$5(conn,block_ids,property_id,v,cljs.core.PersistentArrayMap.EMPTY);
}));

(logseq.outliner.property.batch_set_property_BANG_.cljs$core$IFn$_invoke$arity$5 = (function (conn,block_ids,property_id,v,options){
if(cljs.core.truth_(property_id)){
} else {
throw (new Error(["Assert failed: ","property-id is nil","\n","property-id"].join('')));
}

logseq.outliner.property.throw_error_if_read_only_property(property_id);

if((v == null)){
return logseq.outliner.property.batch_remove_property_BANG_(conn,block_ids,property_id);
} else {
var block_eids = cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.outliner.property.__GT_eid,block_ids);
var _ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_id,new cljs.core.Keyword("block","tags","block/tags",1814948340)))?logseq.outliner.validate.validate_tags_property(cljs.core.deref(conn),block_eids,v):null);
var property = (function (){var G__64724 = cljs.core.deref(conn);
var G__64725 = property_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64724,G__64725) : datascript.core.entity.call(null,G__64724,G__64725));
})();
var ___$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509)))?logseq.outliner.validate.validate_parent_property(((typeof v === 'number')?(function (){var G__64726 = cljs.core.deref(conn);
var G__64727 = v;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64726,G__64727) : datascript.core.entity.call(null,G__64726,G__64727));
})():v),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__64706_SHARP_){
var G__64730 = cljs.core.deref(conn);
var G__64731 = p1__64706_SHARP_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64730,G__64731) : datascript.core.entity.call(null,G__64730,G__64731));
}),block_eids)):null);
var ___$2 = (((!((property == null))))?null:(function(){throw (new Error(["Assert failed: ",["Property ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(property_id)," doesn't exist yet"].join(''),"\n","(some? property)"].join('')))})());
var property_type = cljs.core.get.cljs$core$IFn$_invoke$arity$3(property,new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),new cljs.core.Keyword(null,"default","default",-1987822328));
var ___$3 = (((!((v == null))))?null:(function(){throw (new Error(["Assert failed: ","Can't set a nil property value must be not nil","\n","(some? v)"].join('')))})());
var ref_QMARK_ = cljs.core.contains_QMARK_(logseq.db.frontend.property.type.all_ref_property_types,property_type);
var default_url_not_closed_QMARK_ = ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"default","default",-1987822328),null,new cljs.core.Keyword(null,"url","url",276297046),null], null), null),property_type)) && (cljs.core.not(cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property)))));
var entity_id_QMARK_ = (function (){var and__5000__auto__ = new cljs.core.Keyword(null,"entity-id?","entity-id?",450489382).cljs$core$IFn$_invoke$arity$1(options);
if(cljs.core.truth_(and__5000__auto__)){
return typeof v === 'number';
} else {
return and__5000__auto__;
}
})();
var v_SINGLEQUOTE_ = ((((ref_QMARK_) && (cljs.core.not(entity_id_QMARK_))))?logseq.outliner.property.convert_ref_property_value(conn,property_id,v,property_type):v);
var txs = cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (eid){
var temp__5802__auto__ = (function (){var G__64734 = cljs.core.deref(conn);
var G__64735 = eid;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64734,G__64735) : datascript.core.entity.call(null,G__64734,G__64735));
})();
if(cljs.core.truth_(temp__5802__auto__)){
var block = temp__5802__auto__;
var v_SINGLEQUOTE___$1 = ((default_url_not_closed_QMARK_)?(function (){var v__$1 = ((typeof v === 'number')?new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1((function (){var G__64738 = cljs.core.deref(conn);
var G__64739 = v;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64738,G__64739) : datascript.core.entity.call(null,G__64738,G__64739));
})()):v);
return logseq.outliner.property.convert_ref_property_value(conn,property_id,v__$1,property_type);
})():v_SINGLEQUOTE_);
logseq.outliner.property.throw_error_if_self_value(block,v_SINGLEQUOTE___$1,ref_QMARK_);

return logseq.outliner.property.build_property_value_tx_data(conn,block,property_id,v_SINGLEQUOTE___$1);
} else {
return console.error("Skipping setting a block's property because the block id could not be found:",eid);
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([block_eids], 0)));
if(cljs.core.seq(txs)){
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,txs,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
return null;
}
}
}));

(logseq.outliner.property.batch_set_property_BANG_.cljs$lang$maxFixedArity = 5);

logseq.outliner.property.remove_block_property_BANG_ = (function logseq$outliner$property$remove_block_property_BANG_(conn,eid,property_id){
logseq.outliner.property.throw_error_if_read_only_property(property_id);

var eid__$1 = logseq.outliner.property.__GT_eid(eid);
var block = (function (){var G__64745 = cljs.core.deref(conn);
var G__64746 = eid__$1;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64745,G__64746) : datascript.core.entity.call(null,G__64745,G__64746));
})();
var property = (function (){var G__64747 = cljs.core.deref(conn);
var G__64748 = property_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64747,G__64748) : datascript.core.entity.call(null,G__64747,G__64748));
})();
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,property_id)))){
return null;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662).cljs$core$IFn$_invoke$arity$1(property),cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,property_id))){
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.PersistentArrayMap.createAsIfByAssoc([new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),property_id,new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837)])], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = (logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(block) : logseq.db.class_QMARK_.call(null,block));
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_id,new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509));
} else {
return and__5000__auto__;
}
})())){
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),new cljs.core.Keyword("logseq.class","Root","logseq.class/Root",273783827)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
if(cljs.core.contains_QMARK_(logseq.db.frontend.property.db_attribute_properties,property_id)){
if(cljs.core.truth_(block)){
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),property_id], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
return null;
}
} else {
return logseq.outliner.property.batch_remove_property_BANG_(conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [eid__$1], null),property_id);

}
}
}
}
});
/**
 * Updates a block property's value for an existing property-id and block.  If
 *   property is a ref type, automatically handles a raw property value i.e. you
 *   can pass "value" instead of the property value entity. Also handle db
 *   attributes as properties
 */
logseq.outliner.property.set_block_property_BANG_ = (function logseq$outliner$property$set_block_property_BANG_(conn,block_eid,property_id,v){
logseq.outliner.property.throw_error_if_read_only_property(property_id);

if((v == null)){
return logseq.outliner.property.remove_block_property_BANG_(conn,block_eid,property_id);
} else {
var block_eid__$1 = logseq.outliner.property.__GT_eid(block_eid);
var _ = ((cljs.core.qualified_keyword_QMARK_(property_id))?null:(function(){throw (new Error(["Assert failed: ","property-id should be a keyword","\n","(qualified-keyword? property-id)"].join('')))})());
var block = (function (){var G__64758 = cljs.core.deref(conn);
var G__64759 = block_eid__$1;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64758,G__64759) : datascript.core.entity.call(null,G__64758,G__64759));
})();
var db_attribute_QMARK_ = (!(((logseq.db.frontend.schema.schema.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.schema.schema.cljs$core$IFn$_invoke$arity$1(property_id) : logseq.db.frontend.schema.schema.call(null,property_id)) == null)));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_id,new cljs.core.Keyword("block","tags","block/tags",1814948340))){
logseq.outliner.validate.validate_tags_property(cljs.core.deref(conn),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_eid__$1], null),v);
} else {
}

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_id,new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509))){
logseq.outliner.validate.validate_parent_property(v,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block], null));
} else {
}

if(db_attribute_QMARK_){
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_id,new cljs.core.Keyword("block","alias","block/alias",-2112644699))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block))))){
return null;
} else {
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.PersistentArrayMap.createAsIfByAssoc([new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),property_id,v])], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
}
} else {
var property = (function (){var G__64761 = cljs.core.deref(conn);
var G__64762 = property_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64761,G__64762) : datascript.core.entity.call(null,G__64761,G__64762));
})();
var ___$1 = (((!((property == null))))?null:(function(){throw (new Error(["Assert failed: ",["Property ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(property_id)," doesn't exist yet"].join(''),"\n","(some? property)"].join('')))})());
var property_type = cljs.core.get.cljs$core$IFn$_invoke$arity$3(property,new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),new cljs.core.Keyword(null,"default","default",-1987822328));
var ref_QMARK_ = (logseq.db.frontend.property.type.all_ref_property_types.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.property.type.all_ref_property_types.cljs$core$IFn$_invoke$arity$1(property_type) : logseq.db.frontend.property.type.all_ref_property_types.call(null,property_type));
var new_value = (cljs.core.truth_(ref_QMARK_)?logseq.outliner.property.convert_ref_property_value(conn,property_id,v,property_type):v);
var existing_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,property_id);
logseq.outliner.property.throw_error_if_self_value(block,new_value,ref_QMARK_);

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(existing_value,new_value)){
return null;
} else {
return logseq.outliner.property.raw_set_block_property_BANG_(conn,block,property,property_type,new_value);
}

}
}
});
/**
 * Updates property if property-id is given. Otherwise creates a property
 * with the given property-id or :property-name option. When a property is created
 * it is ensured to have a unique :db/ident
 */
logseq.outliner.property.upsert_property_BANG_ = (function logseq$outliner$property$upsert_property_BANG_(conn,property_id,schema,p__64768){
var map__64769 = p__64768;
var map__64769__$1 = cljs.core.__destructure_map(map__64769);
var opts = map__64769__$1;
var property_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64769__$1,new cljs.core.Keyword(null,"property-name","property-name",-1399851434));
var db = cljs.core.deref(conn);
var db_ident = (function (){var or__5002__auto__ = property_id;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
try{return logseq.db.frontend.property.create_user_property_ident_from_name.cljs$core$IFn$_invoke$arity$1(property_name);
}catch (e64772){var e = e64772;
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(e),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),"Property failed to create. Please try a different property name.",new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"error","error",-978969032)], null)], null));
}}
})();
if(cljs.core.qualified_keyword_QMARK_(db_ident)){
} else {
throw (new Error("Assert failed: (qualified-keyword? db-ident)"));
}

var temp__5802__auto__ = (function (){var and__5000__auto__ = cljs.core.qualified_keyword_QMARK_(property_id);
if(and__5000__auto__){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,db_ident) : datascript.core.entity.call(null,db,db_ident));
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var property = temp__5802__auto__;
return logseq.outliner.property.update_property(conn,db_ident,property,schema,opts);
} else {
var k_name = (function (){var or__5002__auto__ = (function (){var and__5000__auto__ = property_name;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.name(property_name);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.name(property_id);
}
})();
var db_ident_SINGLEQUOTE_ = logseq.db.frontend.db_ident.ensure_unique_db_ident(cljs.core.deref(conn),db_ident);
if((!((k_name == null)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["property-id: ",property_id,", property-name: ",property_name], 0)),"\n","(some? k-name)"].join('')));
}

logseq.outliner.validate.validate_page_title(k_name,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node","node",581201198),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","ident","db/ident",-737096),db_ident_SINGLEQUOTE_], null)], null));

logseq.outliner.validate.validate_page_title_characters(k_name,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node","node",581201198),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","ident","db/ident",-737096),db_ident_SINGLEQUOTE_], null)], null));

logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.db.sqlite.util.build_new_property.cljs$core$IFn$_invoke$arity$3(db_ident_SINGLEQUOTE_,schema,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),k_name], null))], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"new-property","new-property",1615300738)], null));

var G__64790 = cljs.core.deref(conn);
var G__64791 = db_ident_SINGLEQUOTE_;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64790,G__64791) : datascript.core.entity.call(null,G__64790,G__64791));
}
});
/**
 * Delete value if a property has multiple values
 */
logseq.outliner.property.delete_property_value_BANG_ = (function logseq$outliner$property$delete_property_value_BANG_(conn,block_eid,property_id,property_value){
var temp__5804__auto__ = (function (){var G__64798 = cljs.core.deref(conn);
var G__64799 = property_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64798,G__64799) : datascript.core.entity.call(null,G__64798,G__64799));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var property = temp__5804__auto__;
var block = (function (){var G__64803 = cljs.core.deref(conn);
var G__64804 = block_eid;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64803,G__64804) : datascript.core.entity.call(null,G__64803,G__64804));
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = block;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(property_id,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(block))) && (logseq.db.frontend.property.many_QMARK_(property)));
} else {
return and__5000__auto__;
}
})())){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_id,new cljs.core.Keyword("block","tags","block/tags",1814948340))){
logseq.outliner.validate.validate_tags_property_deletion(cljs.core.deref(conn),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_eid], null),property_value);
} else {
}

var current_val = cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,property_id);
var fv = cljs.core.first(current_val);
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(current_val))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_value,fv)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_value,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(fv))))))){
return logseq.outliner.property.remove_block_property_BANG_(conn,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),property_id);
} else {
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),property_id,property_value], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
}
} else {
return null;
}
} else {
return null;
}
});
logseq.outliner.property.get_classes_parents = (function logseq$outliner$property$get_classes_parents(tags){
return (logseq.db.get_classes_parents.cljs$core$IFn$_invoke$arity$1 ? logseq.db.get_classes_parents.cljs$core$IFn$_invoke$arity$1(tags) : logseq.db.get_classes_parents.call(null,tags));
});
logseq.outliner.property.get_class_properties = (function logseq$outliner$property$get_class_properties(class$){
var class_parents = logseq.outliner.property.get_classes_parents(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [class$], null));
return logseq.db.sort_by_order(logseq.common.util.distinct_by(new cljs.core.Keyword("db","id","db/id",-1388397098),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (class$__$1){
return new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050).cljs$core$IFn$_invoke$arity$1(class$__$1);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [class$], null),class_parents)], 0))));
});
logseq.outliner.property.get_block_classes = (function logseq$outliner$property$get_block_classes(db,eid){
var block = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,eid) : datascript.core.entity.call(null,db,eid));
var classes = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(logseq.db.class_QMARK_,cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block)));
var class_parents = logseq.outliner.property.get_classes_parents(classes);
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (class$){
return cljs.core.seq(new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050).cljs$core$IFn$_invoke$arity$1(class$));
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(classes,class_parents));
});
logseq.outliner.property.get_block_classes_properties = (function logseq$outliner$property$get_block_classes_properties(db,eid){
var block = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,eid) : datascript.core.entity.call(null,db,eid));
var classes = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(logseq.db.class_QMARK_,cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(block)));
var class_parents = logseq.outliner.property.get_classes_parents(classes);
var all_classes = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (class$){
return cljs.core.seq(new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050).cljs$core$IFn$_invoke$arity$1(class$));
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(classes,class_parents));
var all_properties = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (class$){
return new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050).cljs$core$IFn$_invoke$arity$1(class$);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([all_classes], 0)));
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"classes","classes",2037804510),classes,new cljs.core.Keyword(null,"all-classes","all-classes",-2040626813),all_classes,new cljs.core.Keyword(null,"classes-properties","classes-properties",1920679577),all_properties], null);
});
/**
 * Get block's full properties including its own and classes' properties
 */
logseq.outliner.property.get_block_full_properties = (function logseq$outliner$property$get_block_full_properties(db,eid){
var block = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,eid) : datascript.core.entity.call(null,db,eid));
return logseq.common.util.distinct_by(new cljs.core.Keyword("db","id","db/id",-1388397098),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (ident){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,ident) : datascript.core.entity.call(null,db,ident));
}),cljs.core.keys(new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(block))),new cljs.core.Keyword(null,"classes-properties","classes-properties",1920679577).cljs$core$IFn$_invoke$arity$1(logseq.outliner.property.get_block_classes_properties(db,eid))));
});
logseq.outliner.property.property_with_position_QMARK_ = (function logseq$outliner$property$property_with_position_QMARK_(db,property_id,block,position){
var temp__5804__auto__ = logseq.db.common.entity_plus.entity_memoized(db,property_id);
if(cljs.core.truth_(temp__5804__auto__)){
var property = temp__5804__auto__;
var property_position = new cljs.core.Keyword("logseq.property","ui-position","logseq.property/ui-position",1869200864).cljs$core$IFn$_invoke$arity$1(property);
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_position,position)) && (((cljs.core.not((function (){var and__5000__auto____$1 = new cljs.core.Keyword("logseq.property","hide-empty-value","logseq.property/hide-empty-value",2062325899).cljs$core$IFn$_invoke$arity$1(property);
if(cljs.core.truth_(and__5000__auto____$1)){
return (cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,property_id) == null);
} else {
return and__5000__auto____$1;
}
})())) && (((cljs.core.not(new cljs.core.Keyword("logseq.property","hide?","logseq.property/hide?",68365746).cljs$core$IFn$_invoke$arity$1(property))) && ((!(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_position,new cljs.core.Keyword(null,"block-below","block-below",1808846787))) && ((cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,property_id) == null)))))))))));
} else {
return null;
}
});
logseq.outliner.property.property_with_other_position_QMARK_ = (function logseq$outliner$property$property_with_other_position_QMARK_(property){
return (!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [null,null,new cljs.core.Keyword(null,"properties","properties",685819552),null], null), null),new cljs.core.Keyword("logseq.property","ui-position","logseq.property/ui-position",1869200864).cljs$core$IFn$_invoke$arity$1(property))));
});
logseq.outliner.property.get_block_positioned_properties = (function logseq$outliner$property$get_block_positioned_properties(db,eid,position){
var block = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,eid) : datascript.core.entity.call(null,db,eid));
var own_properties = new cljs.core.Keyword("block.temp","property-keys","block.temp/property-keys",2093695024).cljs$core$IFn$_invoke$arity$1(block);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),logseq.db.sort_by_order(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__64849_SHARP_){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__64849_SHARP_) : datascript.core.entity.call(null,db,p1__64849_SHARP_));
}),cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (id){
return logseq.outliner.property.property_with_position_QMARK_(db,id,block,position);
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(own_properties,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword(null,"classes-properties","classes-properties",1920679577).cljs$core$IFn$_invoke$arity$1(logseq.outliner.property.get_block_classes_properties(db,eid)))))))));
});
logseq.outliner.property.build_closed_value_tx = (function logseq$outliner$property$build_closed_value_tx(db,property,resolved_value,p__64855){
var map__64856 = p__64855;
var map__64856__$1 = cljs.core.__destructure_map(map__64856);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64856__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64856__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var block = (cljs.core.truth_(id)?(function (){var G__64857 = db;
var G__64858 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64857,G__64858) : datascript.core.entity.call(null,G__64857,G__64858));
})():null);
var block_id = (function (){var or__5002__auto__ = id;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.db.new_block_id();
}
})();
var icon__$1 = ((((typeof icon === 'string') && (clojure.string.blank_QMARK_(icon))))?null:icon);
var tx_data = (cljs.core.truth_(block)?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__64859 = logseq.outliner.core.block_with_updated_at(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id,new cljs.core.Keyword("block","closed-value-property","block/closed-value-property",1157792813),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property)], null),(cljs.core.truth_(logseq.db.frontend.property.type.property_value_content_QMARK_(new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(block),property))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865),resolved_value], null):new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","title","block/title",710445684),resolved_value], null))], 0)));
if(cljs.core.truth_(icon__$1)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__64859,new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285),icon__$1);
} else {
return G__64859;
}
})()], null):(function (){var max_order = new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(cljs.core.last(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property)));
var new_block = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(logseq.db.frontend.property.build.build_closed_value_block(block_id,null,resolved_value,property,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"icon","icon",1679606541),icon__$1], null)),new cljs.core.Keyword("block","order","block/order",-1429282437),logseq.db.common.order.gen_key(max_order,null));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new_block,logseq.outliner.core.block_with_updated_at(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property)], null))], null);
})());
var tx_data_SINGLEQUOTE_ = (cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(and__5000__auto__)){
return (icon__$1 == null);
} else {
return and__5000__auto__;
}
})())?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(tx_data,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285)], null)):tx_data);
return tx_data_SINGLEQUOTE_;
});
/**
 * id should be a block UUID or nil
 */
logseq.outliner.property.upsert_closed_value_BANG_ = (function logseq$outliner$property$upsert_closed_value_BANG_(conn,property_id,p__64860){
var map__64861 = p__64860;
var map__64861__$1 = cljs.core.__destructure_map(map__64861);
var opts = map__64861__$1;
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64861__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64861__$1,new cljs.core.Keyword(null,"value","value",305978217));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64861__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
if((((id == null)) || (cljs.core.uuid_QMARK_(id)))){
} else {
throw (new Error("Assert failed: (or (nil? id) (uuid? id))"));
}

var db = cljs.core.deref(conn);
var property = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,property_id) : datascript.core.entity.call(null,db,property_id));
var property_type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
if(cljs.core.contains_QMARK_(logseq.db.frontend.property.type.closed_value_property_types,property_type)){
var value_SINGLEQUOTE_ = ((typeof value === 'string')?clojure.string.trim(value):value);
var resolved_value = logseq.outliner.property.convert_property_input_string(null,property,value_SINGLEQUOTE_);
var validate_message = logseq.outliner.property.validate_property_value_aux(logseq.outliner.property.get_property_value_schema.cljs$core$IFn$_invoke$arity$variadic(cljs.core.deref(conn),property_type,property,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"new-closed-value?","new-closed-value?",773408852),true], null)], 0)),resolved_value,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"many?","many?",-605360673),logseq.db.frontend.property.many_QMARK_(property)], null));
if(cljs.core.truth_(cljs.core.some((function (b){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(resolved_value),cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = logseq.db.frontend.property.closed_value_content(b);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b);
}
})()))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(b))));
}),logseq.db.common.entity_plus.lookup_kv_then_entity.cljs$core$IFn$_invoke$arity$2(property,new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952))))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Closed value choice already exists",new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"value-exists","value-exists",935571771),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),"Choice already exists",new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"warning","warning",-1685650671)], null)], null));
} else {
if(cljs.core.truth_(validate_message)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Invalid property value",new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"value-invalid","value-invalid",-1327576860),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),validate_message,new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"warning","warning",-1685650671)], null)], null));
} else {
if((resolved_value == null)){
return null;
} else {
var tx_data = logseq.outliner.property.build_closed_value_tx(cljs.core.deref(conn),property,resolved_value,opts);
logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,tx_data,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));

if(cljs.core.seq(description)){
var temp__5802__auto__ = (function (){var and__5000__auto__ = id;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("logseq.property","description","logseq.property/description",-336236200).cljs$core$IFn$_invoke$arity$1((function (){var G__64862 = db;
var G__64863 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),id], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64862,G__64863) : datascript.core.entity.call(null,G__64862,G__64863));
})());
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var desc_ent = temp__5802__auto__;
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.outliner.core.block_with_updated_at(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(desc_ent),new cljs.core.Keyword("block","title","block/title",710445684),description], null))], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
return logseq.outliner.property.set_block_property_BANG_(conn,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),(function (){var or__5002__auto__ = id;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.first(tx_data));
}
})()], null),new cljs.core.Keyword("logseq.property","description","logseq.property/description",-336236200),description);
}
} else {
return null;
}

}
}
}
} else {
return null;
}
});
/**
 * Adds existing values as closed values and returns their new block uuids
 */
logseq.outliner.property.add_existing_values_to_closed_values_BANG_ = (function logseq$outliner$property$add_existing_values_to_closed_values_BANG_(conn,property_id,values){
var temp__5804__auto__ = (function (){var G__64865 = cljs.core.deref(conn);
var G__64866 = property_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64865,G__64866) : datascript.core.entity.call(null,G__64865,G__64866));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var property = temp__5804__auto__;
if(cljs.core.seq(values)){
var values_SINGLEQUOTE_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,values);
if(cljs.core.every_QMARK_(cljs.core.uuid_QMARK_,values_SINGLEQUOTE_)){
} else {
throw (new Error(["Assert failed: ","existing values should all be UUIDs","\n","(every? uuid? values')"].join('')));
}

var values__$1 = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__64864_SHARP_){
var G__64869 = cljs.core.deref(conn);
var G__64870 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__64864_SHARP_], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64869,G__64870) : datascript.core.entity.call(null,G__64869,G__64870));
}),values_SINGLEQUOTE_);
if(cljs.core.seq(values__$1)){
var value_property_tx = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (id){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),id,new cljs.core.Keyword("block","closed-value-property","block/closed-value-property",1157792813),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property)], null);
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),values__$1));
var property_tx = logseq.outliner.core.block_with_updated_at(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property)], null));
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,cljs.core.cons(property_tx,value_property_tx),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-blocks","save-blocks",-1316654032)], null));
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});
/**
 * Returns true when deleted or if not deleted displays warning and returns false
 */
logseq.outliner.property.delete_closed_value_BANG_ = (function logseq$outliner$property$delete_closed_value_BANG_(conn,property_id,value_block_id){
var temp__5804__auto__ = (function (){var G__64874 = cljs.core.deref(conn);
var G__64875 = value_block_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64874,G__64875) : datascript.core.entity.call(null,G__64874,G__64875));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var value_block = temp__5804__auto__;
if(cljs.core.truth_((logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(value_block) : logseq.db.built_in_QMARK_.call(null,value_block)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("The choice can't be deleted",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"notification","notification",-222338233),new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"message","message",-406056002),"The choice can't be deleted because it's built-in.",new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"warning","warning",-1685650671)], null)], null));
} else {
var data = new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(logseq.outliner.core.delete_blocks(cljs.core.deref(conn),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [value_block], null)));
var tx_data = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(data,logseq.outliner.core.block_with_updated_at(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","id","db/id",-1388397098),property_id], null)));
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,tx_data);
}
} else {
return null;
}
});
logseq.outliner.property.class_add_property_BANG_ = (function logseq$outliner$property$class_add_property_BANG_(conn,class_id,property_id){
var temp__5804__auto__ = (function (){var G__64885 = cljs.core.deref(conn);
var G__64886 = class_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64885,G__64886) : datascript.core.entity.call(null,G__64885,G__64886));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var class$ = temp__5804__auto__;
if(cljs.core.truth_((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(class$) : logseq.db.class_QMARK_.call(null,class$)))){
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","add","db/add",235286841),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(class$),new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050),property_id], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Can't add a property to a block that isn't a class",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class-id","class-id",-251527949),class_id,new cljs.core.Keyword(null,"property-id","property-id",404996975),property_id], null));
}
} else {
return null;
}
});
logseq.outliner.property.class_remove_property_BANG_ = (function logseq$outliner$property$class_remove_property_BANG_(conn,class_id,property_id){
var temp__5804__auto__ = (function (){var G__64888 = cljs.core.deref(conn);
var G__64889 = class_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64888,G__64889) : datascript.core.entity.call(null,G__64888,G__64889));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var class$ = temp__5804__auto__;
if(cljs.core.truth_((logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.class_QMARK_.cljs$core$IFn$_invoke$arity$1(class$) : logseq.db.class_QMARK_.call(null,class$)))){
var temp__5804__auto____$1 = (function (){var G__64890 = cljs.core.deref(conn);
var G__64891 = property_id;
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__64890,G__64891) : datascript.core.entity.call(null,G__64890,G__64891));
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var property = temp__5804__auto____$1;
if(cljs.core.truth_((logseq.db.built_in_class_property_QMARK_.cljs$core$IFn$_invoke$arity$2 ? logseq.db.built_in_class_property_QMARK_.cljs$core$IFn$_invoke$arity$2(class$,property) : logseq.db.built_in_class_property_QMARK_.call(null,class$,property)))){
return null;
} else {
return logseq.db.transact_BANG_.cljs$core$IFn$_invoke$arity$3(conn,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retract","db/retract",-1549825231),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(class$),new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050),property_id], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"outliner-op","outliner-op",1716232450),new cljs.core.Keyword(null,"save-block","save-block",591532560)], null));
}
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});

//# sourceMappingURL=logseq.outliner.property.js.map
