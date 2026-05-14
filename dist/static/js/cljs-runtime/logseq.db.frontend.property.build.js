goog.provide('logseq.db.frontend.property.build');
logseq.db.frontend.property.build.closed_value_new_block = (function logseq$db$frontend$property$build$closed_value_new_block(block_id,block_type,value,property){
var property_id = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property);
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id,new cljs.core.Keyword("block","page","block/page",822314108),property_id,new cljs.core.Keyword("block","closed-value-property","block/closed-value-property",1157792813),property_id,new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(property_id,new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),block_id], null):property_id),new cljs.core.Keyword("block","parent","block/parent",-918309064),property_id], null),(cljs.core.truth_(logseq.db.frontend.property.type.property_value_content_QMARK_(block_type,property))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865),value], null):new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","title","block/title",710445684),value], null))], 0));
});
/**
 * Builds a closed value block to be transacted
 */
logseq.db.frontend.property.build.build_closed_value_block = (function logseq$db$frontend$property$build$build_closed_value_block(block_uuid,block_type,block_value,property,p__143399){
var map__143400 = p__143399;
var map__143400__$1 = cljs.core.__destructure_map(map__143400);
var db_ident = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143400__$1,new cljs.core.Keyword(null,"db-ident","db-ident",-992686073));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143400__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
if(cljs.core.truth_(block_uuid)){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.uuid_QMARK_(block_uuid)),"\n","block-uuid"].join('')));
}

var G__143401 = logseq.db.frontend.property.build.closed_value_new_block(block_uuid,block_type,block_value,property);
var G__143401__$1 = (cljs.core.truth_((function (){var and__5000__auto__ = db_ident;
if(cljs.core.truth_(and__5000__auto__)){
return (db_ident instanceof cljs.core.Keyword);
} else {
return and__5000__auto__;
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__143401,new cljs.core.Keyword("db","ident","db/ident",-737096),db_ident):G__143401);
var G__143401__$2 = (cljs.core.truth_(icon)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__143401__$1,new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285),icon):G__143401__$1);
return (logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1 ? logseq.db.sqlite.util.block_with_timestamps.cljs$core$IFn$_invoke$arity$1(G__143401__$2) : logseq.db.sqlite.util.block_with_timestamps.call(null,G__143401__$2));

});
logseq.db.frontend.property.build.closed_values__GT_blocks = (function logseq$db$frontend$property$build$closed_values__GT_blocks(property){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__143402){
var map__143403 = p__143402;
var map__143403__$1 = cljs.core.__destructure_map(map__143403);
var uuid_SINGLEQUOTE_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143403__$1,new cljs.core.Keyword(null,"uuid","uuid",-2145095719));
var db_ident = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143403__$1,new cljs.core.Keyword(null,"db-ident","db-ident",-992686073));
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143403__$1,new cljs.core.Keyword(null,"value","value",305978217));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143403__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var schema = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143403__$1,new cljs.core.Keyword(null,"schema","schema",-1582001791));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143403__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var G__143404 = logseq.db.frontend.property.build.build_closed_value_block(uuid_SINGLEQUOTE_,new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(schema),value,property,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db-ident","db-ident",-992686073),db_ident,new cljs.core.Keyword(null,"icon","icon",1679606541),icon], null));
var G__143404__$1 = ((cljs.core.seq(properties))?cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__143404,properties], 0)):G__143404);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__143404__$1,new cljs.core.Keyword("block","order","block/order",-1429282437),logseq.db.common.order.gen_key.cljs$core$IFn$_invoke$arity$0());

}),new cljs.core.Keyword(null,"closed-values","closed-values",364658811).cljs$core$IFn$_invoke$arity$1(property));
});
/**
 * Builds all the tx needed for property with closed values including
 * the hidden page and closed value blocks as needed
 */
logseq.db.frontend.property.build.build_closed_values = (function logseq$db$frontend$property$build$build_closed_values(db_ident,prop_name,property,p__143405){
var map__143406 = p__143405;
var map__143406__$1 = cljs.core.__destructure_map(map__143406);
var property_attributes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143406__$1,new cljs.core.Keyword(null,"property-attributes","property-attributes",-1673390672));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143406__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var property_schema = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1(property);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.db.frontend.property.get_property_schema(property);
}
})();
var property_tx = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.sqlite.util.build_new_property.cljs$core$IFn$_invoke$arity$3(db_ident,property_schema,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),prop_name,new cljs.core.Keyword(null,"ref-type?","ref-type?",622803158),true,new cljs.core.Keyword(null,"properties","properties",685819552),properties], null)),property_attributes], 0));
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [property_tx], null),logseq.db.frontend.property.build.closed_values__GT_blocks(property));
});
/**
 * Builds a property value entity given a block map/entity, a property entity or
 *   ident and its property value. Takes the following options:
 * * :block-uuid - :block/uuid for property value entity
 * * :properties - Additional properties and attributes to add to entity
 */
logseq.db.frontend.property.build.build_property_value_block = (function logseq$db$frontend$property$build$build_property_value_block(var_args){
var args__5732__auto__ = [];
var len__5726__auto___143441 = arguments.length;
var i__5727__auto___143444 = (0);
while(true){
if((i__5727__auto___143444 < len__5726__auto___143441)){
args__5732__auto__.push((arguments[i__5727__auto___143444]));

var G__143446 = (i__5727__auto___143444 + (1));
i__5727__auto___143444 = G__143446;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return logseq.db.frontend.property.build.build_property_value_block.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(logseq.db.frontend.property.build.build_property_value_block.cljs$core$IFn$_invoke$arity$variadic = (function (block,property,value,p__143413){
var map__143414 = p__143413;
var map__143414__$1 = cljs.core.__destructure_map(map__143414);
var block_uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143414__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143414__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var block_id = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(block);
}
})();
var G__143415 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),(function (){var or__5002__auto__ = block_uuid;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$0();
}
})(),new cljs.core.Keyword("block","page","block/page",822314108),(cljs.core.truth_(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block))?new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block)):block_id),new cljs.core.Keyword("block","parent","block/parent",-918309064),block_id,new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property),new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662)))?block_id:(function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(property);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property)], null);
}
})()),new cljs.core.Keyword("block","order","block/order",-1429282437),logseq.db.common.order.gen_key.cljs$core$IFn$_invoke$arity$0()], null),(cljs.core.truth_(logseq.db.frontend.property.type.property_value_content_QMARK_(new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property),property))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865),value], null):new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","title","block/title",710445684),value], null))], 0));
var G__143415__$1 = logseq.common.util.block_with_timestamps(G__143415)
;
if(cljs.core.truth_(properties)){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__143415__$1,properties], 0));
} else {
return G__143415__$1;
}
}));

(logseq.db.frontend.property.build.build_property_value_block.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(logseq.db.frontend.property.build.build_property_value_block.cljs$lang$applyTo = (function (seq143408){
var G__143409 = cljs.core.first(seq143408);
var seq143408__$1 = cljs.core.next(seq143408);
var G__143410 = cljs.core.first(seq143408__$1);
var seq143408__$2 = cljs.core.next(seq143408__$1);
var G__143411 = cljs.core.first(seq143408__$2);
var seq143408__$3 = cljs.core.next(seq143408__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__143409,G__143410,G__143411,seq143408__$3);
}));

/**
 * Builds a map of property names to their property value blocks to be
 *   transacted, given a block and a properties map with raw property values. The
 *   properties map can have keys that are db-idents or they can be maps. If a map,
 *   it should have :original-property-id and :db/ident keys.  See
 *   ->property-value-tx-m for such an example
 * 
 *   :pure? - ensure this fn is a pure function
 */
logseq.db.frontend.property.build.build_property_values_tx_m = (function logseq$db$frontend$property$build$build_property_values_tx_m(var_args){
var args__5732__auto__ = [];
var len__5726__auto___143458 = arguments.length;
var i__5727__auto___143459 = (0);
while(true){
if((i__5727__auto___143459 < len__5726__auto___143458)){
args__5732__auto__.push((arguments[i__5727__auto___143459]));

var G__143463 = (i__5727__auto___143459 + (1));
i__5727__auto___143459 = G__143463;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return logseq.db.frontend.property.build.build_property_values_tx_m.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(logseq.db.frontend.property.build.build_property_values_tx_m.cljs$core$IFn$_invoke$arity$variadic = (function (block,properties,p__143420){
var map__143421 = p__143420;
var map__143421__$1 = cljs.core.__destructure_map(map__143421);
var pure_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143421__$1,new cljs.core.Keyword(null,"pure?","pure?",350862691));
var block_SINGLEQUOTE_ = (cljs.core.truth_(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block))?block:cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block)], null)));
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__143422){
var vec__143423 = p__143422;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__143423,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__143423,(1),null);
var map__143426 = ((cljs.core.map_QMARK_(k))?k:new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","ident","db/ident",-737096),k], null));
var map__143426__$1 = cljs.core.__destructure_map(map__143426);
var property_map = map__143426__$1;
var property_value_properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__143426__$1,new cljs.core.Keyword(null,"property-value-properties","property-value-properties",339042228));
var gen_uuid_value_prefix = (cljs.core.truth_(pure_QMARK_)?(function (){var or__5002__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(block);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(block);
}
})():null);
if(cljs.core.truth_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property_map))){
} else {
throw (new Error(["Assert failed: ","Key in map must have a :db/ident","\n","(:db/ident property-map)"].join('')));
}

if(cljs.core.truth_(pure_QMARK_)){
if((!((gen_uuid_value_prefix == null)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(block),"\n","(some? gen-uuid-value-prefix)"].join('')));
}
} else {
}

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"original-property-id","original-property-id",-123524497).cljs$core$IFn$_invoke$arity$1(property_map);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property_map);
}
})(),((cljs.core.set_QMARK_(v))?cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__143416_SHARP_){
return logseq.db.frontend.property.build.build_property_value_block.cljs$core$IFn$_invoke$arity$variadic(block_SINGLEQUOTE_,property_map,p1__143416_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var G__143427 = cljs.core.PersistentArrayMap.EMPTY;
var G__143427__$1 = (cljs.core.truth_(property_value_properties)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__143427,new cljs.core.Keyword(null,"properties","properties",685819552),property_value_properties):G__143427);
if(cljs.core.truth_(pure_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__143427__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"builtin-block-uuid","builtin-block-uuid",-652923992),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(gen_uuid_value_prefix),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__143416_SHARP_)].join('')));
} else {
return G__143427__$1;
}
})()], 0));
}),v)):logseq.db.frontend.property.build.build_property_value_block.cljs$core$IFn$_invoke$arity$variadic(block_SINGLEQUOTE_,property_map,v,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var G__143428 = cljs.core.PersistentArrayMap.EMPTY;
var G__143428__$1 = (cljs.core.truth_(property_value_properties)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__143428,new cljs.core.Keyword(null,"properties","properties",685819552),property_value_properties):G__143428);
if(cljs.core.truth_(pure_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__143428__$1,new cljs.core.Keyword(null,"block-uuid","block-uuid",-1558039638),logseq.common.uuid.gen_uuid.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"builtin-block-uuid","builtin-block-uuid",-652923992),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(gen_uuid_value_prefix),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(v)].join('')));
} else {
return G__143428__$1;
}
})()], 0)))], null);
}),properties));
}));

(logseq.db.frontend.property.build.build_property_values_tx_m.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(logseq.db.frontend.property.build.build_property_values_tx_m.cljs$lang$applyTo = (function (seq143417){
var G__143418 = cljs.core.first(seq143417);
var seq143417__$1 = cljs.core.next(seq143417);
var G__143419 = cljs.core.first(seq143417__$1);
var seq143417__$2 = cljs.core.next(seq143417__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__143418,G__143419,seq143417__$2);
}));

/**
 * Given a properties map with property values to be transacted e.g. from
 *   build-property-values-tx-m, build a properties map to be transacted with the block
 */
logseq.db.frontend.property.build.build_properties_with_ref_values = (function logseq$db$frontend$property$build$build_properties_with_ref_values(prop_vals_tx_m){
return cljs.core.update_vals(prop_vals_tx_m,(function (v){
if(cljs.core.set_QMARK_(v)){
return cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__143429_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__143429_SHARP_)],null));
}),v));
} else {
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(v)],null));
}
}));
});

//# sourceMappingURL=logseq.db.frontend.property.build.js.map
