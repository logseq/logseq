goog.provide('logseq.db.sqlite.export$');
logseq.db.sqlite.export$.__GT_build_tags = (function logseq$db$sqlite$export$__GT_build_tags(block_tags){
return cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329),null,new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081),null], null), null),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),block_tags)));
});
/**
 * Get an entity's original title
 */
logseq.db.sqlite.export$.block_title = (function logseq$db$sqlite$export$block_title(ent){
var or__5002__auto__ = new cljs.core.Keyword("block","raw-title","block/raw-title",1833669090).cljs$core$IFn$_invoke$arity$1(ent);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(ent);
}
});
/**
 * Given a page or journal entity, shallow copies it e.g. no properties or tags info included.
 * Pages that are shallow copied are at the edges of export and help keep the export size reasonable and
 * avoid exporting unexpected info
 */
logseq.db.sqlite.export$.shallow_copy_page = (function logseq$db$sqlite$export$shallow_copy_page(page_entity){
if(cljs.core.truth_(logseq.db.frontend.entity_util.journal_QMARK_(page_entity))){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("build","journal","build/journal",1781180096),new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366).cljs$core$IFn$_invoke$arity$1(page_entity)], null);
} else {
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","title","block/title",710445684),logseq.db.sqlite.export$.block_title(page_entity)], null);
}
});
logseq.db.sqlite.export$.build_pvalue_entity_for_build_page = (function logseq$db$sqlite$export$build_pvalue_entity_for_build_page(pvalue){
if(cljs.core.truth_(logseq.db.frontend.entity_util.internal_page_QMARK_(pvalue))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("build","page","build/page",822051483),(function (){var G__154838 = logseq.db.sqlite.export$.shallow_copy_page(pvalue);
if(cljs.core.seq(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(pvalue))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__154838,new cljs.core.Keyword("build","tags","build/tags",1814686611),logseq.db.sqlite.export$.__GT_build_tags(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(pvalue)));
} else {
return G__154838;
}
})()], null);
} else {
if(cljs.core.truth_(logseq.db.frontend.entity_util.journal_QMARK_(pvalue))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("build","page","build/page",822051483),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("build","journal","build/journal",1781180096),new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366).cljs$core$IFn$_invoke$arity$1(pvalue)], null)], null);
} else {
return null;
}
}
});
logseq.db.sqlite.export$.build_pvalue_entity_default = (function logseq$db$sqlite$export$build_pvalue_entity_default(db,ent_properties,pvalue,p__154856){
var map__154859 = p__154856;
var map__154859__$1 = cljs.core.__destructure_map(map__154859);
var options = map__154859__$1;
var include_uuid_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__154859__$1,new cljs.core.Keyword(null,"include-uuid-fn","include-uuid-fn",-291819511),cljs.core.constantly(false));
if(((cljs.core.seq(ent_properties)) || (cljs.core.seq(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(pvalue))))){
var G__154860 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("build","property-value","build/property-value",1425188701),new cljs.core.Keyword(null,"block","block",664686210),new cljs.core.Keyword("block","title","block/title",710445684),(function (){var or__5002__auto__ = logseq.db.sqlite.export$.block_title(pvalue);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865).cljs$core$IFn$_invoke$arity$1(pvalue);
}
})()], null);
var G__154860__$1 = ((cljs.core.seq(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(pvalue)))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__154860,new cljs.core.Keyword("build","tags","build/tags",1814686611),logseq.db.sqlite.export$.__GT_build_tags(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(pvalue))):G__154860);
var G__154860__$2 = ((cljs.core.seq(ent_properties))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__154860__$1,new cljs.core.Keyword("build","properties","build/properties",708607786),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__154868){
var vec__154869 = p__154868;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154869,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154869,(1),null);
var prop_type = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,k) : datascript.core.entity.call(null,db,k)));
if(cljs.core.contains_QMARK_(logseq.db.frontend.property.type.all_ref_property_types,prop_type)){
return null;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v], null);
}
}),ent_properties))):G__154860__$1);
var G__154860__$3 = (cljs.core.truth_((function (){var G__154873 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(pvalue);
return (include_uuid_fn.cljs$core$IFn$_invoke$arity$1 ? include_uuid_fn.cljs$core$IFn$_invoke$arity$1(G__154873) : include_uuid_fn.call(null,G__154873));
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__154860__$2,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(pvalue),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("build","keep-uuid?","build/keep-uuid?",705498954),true], 0)):G__154860__$2);
if(cljs.core.truth_(new cljs.core.Keyword(null,"include-timestamps?","include-timestamps?",158216918).cljs$core$IFn$_invoke$arity$1(options))){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__154860__$3,cljs.core.select_keys(pvalue,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], null))], 0));
} else {
return G__154860__$3;
}
} else {
var or__5002__auto__ = logseq.db.sqlite.export$.block_title(pvalue);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865).cljs$core$IFn$_invoke$arity$1(pvalue);
}
}
});
/**
 * Originally copied from db-test/readable-properties. Modified so that property values are
 * valid sqlite.build EDN
 */
logseq.db.sqlite.export$.buildable_properties = (function logseq$db$sqlite$export$buildable_properties(db,ent_properties,properties_config,options){
var build_pvalue_entity = (function logseq$db$sqlite$export$buildable_properties_$_build_pvalue_entity(db_SINGLEQUOTE_,property_ent,pvalue,properties_config_SINGLEQUOTE_,p__154953){
var map__154954 = p__154953;
var map__154954__$1 = cljs.core.__destructure_map(map__154954);
var options_SINGLEQUOTE_ = map__154954__$1;
var property_value_uuids_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__154954__$1,new cljs.core.Keyword(null,"property-value-uuids?","property-value-uuids?",-339905445));
var temp__5802__auto__ = (function (){var and__5000__auto__ = cljs.core.not(property_value_uuids_QMARK_);
if(and__5000__auto__){
return logseq.db.sqlite.export$.build_pvalue_entity_for_build_page(pvalue);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var build_page = temp__5802__auto__;
return build_page;
} else {
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"date","date",-1463434462),null,new cljs.core.Keyword(null,"node","node",581201198),null], null), null),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property_ent))){
if(cljs.core.truth_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(pvalue))){
return new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(pvalue);
} else {
return cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(pvalue)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.db.sqlite.export","existing-property-value?","logseq.db.sqlite.export/existing-property-value?",-2009560134),true], null));
}
} else {
var or__5002__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(pvalue);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var ent_properties_STAR_ = medley.core.filter_keys(logseq.db.frontend.property.internal_property_QMARK_,cljs.core.apply.cljs$core$IFn$_invoke$arity$5(cljs.core.dissoc,logseq.db.frontend.property.properties(pvalue),new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865),new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267),logseq.db.frontend.property.public_db_attribute_properties));
var ent_properties__$1 = ((((cljs.core.not(new cljs.core.Keyword("block","closed-value-property","block/closed-value-property",1157792813).cljs$core$IFn$_invoke$arity$1(pvalue))) && (cljs.core.seq(ent_properties_STAR_))))?(logseq.db.sqlite.export$.buildable_properties.cljs$core$IFn$_invoke$arity$4 ? logseq.db.sqlite.export$.buildable_properties.cljs$core$IFn$_invoke$arity$4(db_SINGLEQUOTE_,ent_properties_STAR_,properties_config_SINGLEQUOTE_,options_SINGLEQUOTE_) : logseq.db.sqlite.export$.buildable_properties.call(null,db_SINGLEQUOTE_,ent_properties_STAR_,properties_config_SINGLEQUOTE_,options_SINGLEQUOTE_)):null);
return logseq.db.sqlite.export$.build_pvalue_entity_default(db,ent_properties__$1,pvalue,options_SINGLEQUOTE_);
}
}
}
});
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__154971){
var vec__154973 = p__154971;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154973,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154973,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,(cljs.core.truth_((function (){var and__5000__auto__ = (!(logseq.db.frontend.property.logseq_property_QMARK_(k)));
if(and__5000__auto__){
var or__5002__auto__ = new cljs.core.Keyword("block","closed-value-property","block/closed-value-property",1157792813).cljs$core$IFn$_invoke$arity$1(v);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto____$1 = cljs.core.set_QMARK_(v);
if(and__5000__auto____$1){
return new cljs.core.Keyword("block","closed-value-property","block/closed-value-property",1157792813).cljs$core$IFn$_invoke$arity$1(cljs.core.first(v));
} else {
return and__5000__auto____$1;
}
}
} else {
return and__5000__auto__;
}
})())?(function (){var find_closed_uuid = (function (val){
var or__5002__auto__ = cljs.core.some((function (p1__154880_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(p1__154880_SHARP_),logseq.db.frontend.property.property_value_content(val))){
return new cljs.core.Keyword(null,"uuid","uuid",-2145095719).cljs$core$IFn$_invoke$arity$1(p1__154880_SHARP_);
} else {
return null;
}
}),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(properties_config,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,new cljs.core.Keyword("build","closed-values","build/closed-values",190285321)], null)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["No closed value found for content: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.frontend.property.property_value_content(val)], 0))].join(''),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),properties_config], null));
}
});
if(cljs.core.set_QMARK_(v)){
return cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__154888_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),find_closed_uuid(p1__154888_SHARP_)],null));
}),v));
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),find_closed_uuid(v)], null);
}
})():((datascript.impl.entity.entity_QMARK_(v))?build_pvalue_entity(db,(datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,k) : datascript.core.entity.call(null,db,k)),v,properties_config,options):((((cljs.core.set_QMARK_(v)) && (cljs.core.every_QMARK_(datascript.impl.entity.entity_QMARK_,v))))?(function (){var property_ent = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,k) : datascript.core.entity.call(null,db,k));
return cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__154890_SHARP_){
return build_pvalue_entity(db,property_ent,p1__154890_SHARP_,properties_config,options);
}),v));
})():v
)))], null);
}),ent_properties));
});
/**
 * The caller of this fn is responsible for building :build/:property-classes unless shallow-copy?
 */
logseq.db.sqlite.export$.build_export_properties = (function logseq$db$sqlite$export$build_export_properties(db,user_property_idents,p__155001){
var map__155002 = p__155001;
var map__155002__$1 = cljs.core.__destructure_map(map__155002);
var options = map__155002__$1;
var include_properties_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155002__$1,new cljs.core.Keyword(null,"include-properties?","include-properties?",1631601018));
var include_timestamps_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155002__$1,new cljs.core.Keyword(null,"include-timestamps?","include-timestamps?",158216918));
var include_uuid_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155002__$1,new cljs.core.Keyword(null,"include-uuid?","include-uuid?",-167629975));
var shallow_copy_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155002__$1,new cljs.core.Keyword(null,"shallow-copy?","shallow-copy?",-99881020));
var include_alias_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155002__$1,new cljs.core.Keyword(null,"include-alias?","include-alias?",746737871));
var properties_config_by_ent = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (ident){
var property = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,ident) : datascript.core.entity.call(null,db,ident));
var closed_values = logseq.db.common.entity_plus.lookup_kv_then_entity.cljs$core$IFn$_invoke$arity$2(property,new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [property,(function (){var G__155008 = cljs.core.select_keys(property,cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.disj.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.schema_properties,new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991)], null)));
var G__155008__$1 = (cljs.core.truth_(include_uuid_QMARK_)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__155008,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(property),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("build","keep-uuid?","build/keep-uuid?",705498954),true], 0)):G__155008);
var G__155008__$2 = (cljs.core.truth_(include_timestamps_QMARK_)?cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__155008__$1,cljs.core.select_keys(property,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], null))], 0)):G__155008__$1);
var G__155008__$3 = (cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(shallow_copy_QMARK_);
if(and__5000__auto__){
var and__5000__auto____$1 = include_alias_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return new cljs.core.Keyword("block","alias","block/alias",-2112644699).cljs$core$IFn$_invoke$arity$1(property);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155008__$2,new cljs.core.Keyword("block","alias","block/alias",-2112644699),cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__154994_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__154994_SHARP_)],null));
}),new cljs.core.Keyword("block","alias","block/alias",-2112644699).cljs$core$IFn$_invoke$arity$1(property)))):G__155008__$2);
var G__155008__$4 = (cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(shallow_copy_QMARK_);
if(and__5000__auto__){
return new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486).cljs$core$IFn$_invoke$arity$1(property);
} else {
return and__5000__auto__;
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155008__$3,new cljs.core.Keyword("build","property-classes","build/property-classes",1099271032),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486).cljs$core$IFn$_invoke$arity$1(property))):G__155008__$3);
if(cljs.core.seq(closed_values)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155008__$4,new cljs.core.Keyword("build","closed-values","build/closed-values",190285321),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__154995_SHARP_){
var G__155019 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),logseq.db.frontend.property.property_value_content(p1__154995_SHARP_),new cljs.core.Keyword(null,"uuid","uuid",-2145095719),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__154995_SHARP_)], null);
if(cljs.core.truth_(new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285).cljs$core$IFn$_invoke$arity$1(p1__154995_SHARP_))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155019,new cljs.core.Keyword(null,"icon","icon",1679606541),new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285).cljs$core$IFn$_invoke$arity$1(p1__154995_SHARP_));
} else {
return G__155019;
}
}),closed_values));
} else {
return G__155008__$4;
}
})()], null);
}),user_property_idents));
var properties_config = cljs.core.update_keys(properties_config_by_ent,new cljs.core.Keyword("db","ident","db/ident",-737096));
if(cljs.core.truth_(include_properties_QMARK_)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__155037){
var vec__155039 = p__155037;
var ent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__155039,(0),null);
var build_property = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__155039,(1),null);
var ent_properties = cljs.core.apply.cljs$core$IFn$_invoke$arity$5(cljs.core.dissoc,logseq.db.frontend.property.properties(ent),new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050),cljs.core.into.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.schema_properties,logseq.db.frontend.property.public_db_attribute_properties));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(ent),(function (){var G__155046 = build_property;
if(cljs.core.seq(ent_properties)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155046,new cljs.core.Keyword("build","properties","build/properties",708607786),logseq.db.sqlite.export$.buildable_properties(db,ent_properties,properties_config,options));
} else {
return G__155046;
}
})()], null);
}),properties_config_by_ent));
} else {
return properties_config;
}
});
/**
 * The caller of this fn is responsible for building any classes or properties from this fn
 * unless shallow-copy?
 */
logseq.db.sqlite.export$.build_export_class = (function logseq$db$sqlite$export$build_export_class(class_ent,p__155056){
var map__155057 = p__155056;
var map__155057__$1 = cljs.core.__destructure_map(map__155057);
var include_uuid_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155057__$1,new cljs.core.Keyword(null,"include-uuid?","include-uuid?",-167629975));
var shallow_copy_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155057__$1,new cljs.core.Keyword(null,"shallow-copy?","shallow-copy?",-99881020));
var include_timestamps_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155057__$1,new cljs.core.Keyword(null,"include-timestamps?","include-timestamps?",158216918));
var include_alias_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155057__$1,new cljs.core.Keyword(null,"include-alias?","include-alias?",746737871));
var G__155059 = cljs.core.select_keys(class_ent,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991)], null));
var G__155059__$1 = (cljs.core.truth_(include_uuid_QMARK_)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__155059,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(class_ent),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("build","keep-uuid?","build/keep-uuid?",705498954),true], 0)):G__155059);
var G__155059__$2 = (cljs.core.truth_(include_timestamps_QMARK_)?cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__155059__$1,cljs.core.select_keys(class_ent,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], null))], 0)):G__155059__$1);
var G__155059__$3 = (cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050).cljs$core$IFn$_invoke$arity$1(class_ent);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(shallow_copy_QMARK_);
} else {
return and__5000__auto__;
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155059__$2,new cljs.core.Keyword("build","class-properties","build/class-properties",1278125544),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050).cljs$core$IFn$_invoke$arity$1(class_ent))):G__155059__$2);
var G__155059__$4 = (cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(shallow_copy_QMARK_);
if(and__5000__auto__){
var and__5000__auto____$1 = include_alias_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return new cljs.core.Keyword("block","alias","block/alias",-2112644699).cljs$core$IFn$_invoke$arity$1(class_ent);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155059__$3,new cljs.core.Keyword("block","alias","block/alias",-2112644699),cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__155047_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__155047_SHARP_)],null));
}),new cljs.core.Keyword("block","alias","block/alias",-2112644699).cljs$core$IFn$_invoke$arity$1(class_ent)))):G__155059__$3);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(shallow_copy_QMARK_);
if(and__5000__auto__){
var and__5000__auto____$1 = new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509).cljs$core$IFn$_invoke$arity$1(class_ent);
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.class","Root","logseq.class/Root",273783827),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509).cljs$core$IFn$_invoke$arity$1(class_ent)));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155059__$4,new cljs.core.Keyword("build","class-parent","build/class-parent",1092120922),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509).cljs$core$IFn$_invoke$arity$1(class_ent)));
} else {
return G__155059__$4;
}
});
logseq.db.sqlite.export$.build_node_classes = (function logseq$db$sqlite$export$build_node_classes(db,build_block,block_tags,properties){
var pvalue_classes = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.class$.logseq_class_QMARK_,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (val_or_vals){
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__155074_SHARP_){
if(logseq.db.sqlite.build.page_prop_value_QMARK_(p1__155074_SHARP_)){
return new cljs.core.Keyword("build","tags","build/tags",1814686611).cljs$core$IFn$_invoke$arity$1(cljs.core.second(p1__155074_SHARP_));
} else {
return null;
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([((cljs.core.set_QMARK_(val_or_vals))?val_or_vals:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [val_or_vals], null))], 0));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.vals(new cljs.core.Keyword("build","properties","build/properties",708607786).cljs$core$IFn$_invoke$arity$1(build_block))], 0)));
var property_classes = cljs.core.set(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.class$.logseq_class_QMARK_,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("build","property-classes","build/property-classes",1099271032),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.vals(properties)], 0))));
var new_class_ents = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__155075_SHARP_){
return logseq.db.frontend.class$.logseq_class_QMARK_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__155075_SHARP_));
}),block_tags);
var shallow_classes = clojure.set.difference.cljs$core$IFn$_invoke$arity$2(cljs.core.into.cljs$core$IFn$_invoke$arity$2(property_classes,pvalue_classes),cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),new_class_ents)));
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([((cljs.core.seq(shallow_classes))?cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__155078_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__155078_SHARP_),logseq.db.sqlite.export$.build_export_class(p1__155078_SHARP_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"shallow-copy?","shallow-copy?",-99881020),true], null))],null));
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__155077_SHARP_){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__155077_SHARP_) : datascript.core.entity.call(null,db,p1__155077_SHARP_));
}),shallow_classes))):null),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__155079_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__155079_SHARP_),logseq.db.sqlite.export$.build_export_class(p1__155079_SHARP_,cljs.core.PersistentArrayMap.EMPTY)],null));
}),new_class_ents))], 0));
});
logseq.db.sqlite.export$.build_node_properties = (function logseq$db$sqlite$export$build_node_properties(db,entity,ent_properties,p__155096){
var map__155097 = p__155096;
var map__155097__$1 = cljs.core.__destructure_map(map__155097);
var options = map__155097__$1;
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155097__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var new_user_property_ids = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__155088_SHARP_){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties,p1__155088_SHARP_);
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.logseq_property_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(entity)], 0))),cljs.core.keys(ent_properties))));
return logseq.db.sqlite.export$.build_export_properties(db,new_user_property_ids,options);
});
/**
 * Given a block/page entity and optional existing properties, build an export map of its
 * tags and properties
 */
logseq.db.sqlite.export$.build_node_export = (function logseq$db$sqlite$export$build_node_export(db,entity,p__155104){
var map__155105 = p__155104;
var map__155105__$1 = cljs.core.__destructure_map(map__155105);
var options = map__155105__$1;
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155105__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var include_uuid_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__155105__$1,new cljs.core.Keyword(null,"include-uuid-fn","include-uuid-fn",-291819511),cljs.core.constantly(false));
var shallow_copy_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155105__$1,new cljs.core.Keyword(null,"shallow-copy?","shallow-copy?",-99881020));
var include_timestamps_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155105__$1,new cljs.core.Keyword(null,"include-timestamps?","include-timestamps?",158216918));
var exclude_ontology_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155105__$1,new cljs.core.Keyword(null,"exclude-ontology?","exclude-ontology?",-439731608));
var ent_properties = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,logseq.db.frontend.property.properties(entity),logseq.db.frontend.property.public_db_attribute_properties);
var build_tags = ((cljs.core.seq(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(entity)))?logseq.db.sqlite.export$.__GT_build_tags(new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(entity)):null);
var new_properties = (cljs.core.truth_((function (){var or__5002__auto__ = shallow_copy_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return exclude_ontology_QMARK_;
}
})())?null:logseq.db.sqlite.export$.build_node_properties(db,entity,ent_properties,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(options,new cljs.core.Keyword(null,"shallow-copy?","shallow-copy?",-99881020),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"include-uuid-fn","include-uuid-fn",-291819511)], 0))));
var build_node = (function (){var G__155113 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","title","block/title",710445684),logseq.db.sqlite.export$.block_title(entity)], null);
var G__155113__$1 = (((!((new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(entity) == null))))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155113,new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991).cljs$core$IFn$_invoke$arity$1(entity)):G__155113);
var G__155113__$2 = (cljs.core.truth_(new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(entity))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155113__$1,new cljs.core.Keyword("block","link","block/link",-1872399993),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(entity))], null)):G__155113__$1);
var G__155113__$3 = (cljs.core.truth_((function (){var G__155120 = new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(entity);
return (include_uuid_fn.cljs$core$IFn$_invoke$arity$1 ? include_uuid_fn.cljs$core$IFn$_invoke$arity$1(G__155120) : include_uuid_fn.call(null,G__155120));
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(G__155113__$2,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(entity),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("build","keep-uuid?","build/keep-uuid?",705498954),true], 0)):G__155113__$2);
var G__155113__$4 = (cljs.core.truth_(include_timestamps_QMARK_)?cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__155113__$3,cljs.core.select_keys(entity,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","created-at","block/created-at",1440015),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551)], null))], 0)):G__155113__$3);
var G__155113__$5 = ((((cljs.core.not(shallow_copy_QMARK_)) && (cljs.core.seq(build_tags))))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155113__$4,new cljs.core.Keyword("build","tags","build/tags",1814686611),build_tags):G__155113__$4);
if(((cljs.core.not(shallow_copy_QMARK_)) && (cljs.core.seq(ent_properties)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155113__$5,new cljs.core.Keyword("build","properties","build/properties",708607786),logseq.db.sqlite.export$.buildable_properties(db,ent_properties,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([properties,new_properties], 0)),options));
} else {
return G__155113__$5;
}
})();
var new_classes = (cljs.core.truth_((function (){var or__5002__auto__ = shallow_copy_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return exclude_ontology_QMARK_;
}
})())?null:logseq.db.sqlite.export$.build_node_classes(db,build_node,new cljs.core.Keyword("block","tags","block/tags",1814948340).cljs$core$IFn$_invoke$arity$1(entity),new_properties));
var G__155130 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node","node",581201198),build_node], null);
var G__155130__$1 = ((cljs.core.seq(new_classes))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155130,new cljs.core.Keyword(null,"classes","classes",2037804510),new_classes):G__155130);
if(cljs.core.seq(new_properties)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155130__$1,new cljs.core.Keyword(null,"properties","properties",685819552),new_properties);
} else {
return G__155130__$1;
}
});
/**
 * Extracts block reference uuids from a block's property values
 */
logseq.db.sqlite.export$.get_pvalue_uuids = (function logseq$db$sqlite$export$get_pvalue_uuids(build_block){
return cljs.core.set(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (val_or_vals){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__155135_SHARP_){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.vector_QMARK_(p1__155135_SHARP_);
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(p1__155135_SHARP_));
if(and__5000__auto____$1){
return new cljs.core.Keyword("logseq.db.sqlite.export","existing-property-value?","logseq.db.sqlite.export/existing-property-value?",-2009560134).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(p1__155135_SHARP_));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return cljs.core.second(p1__155135_SHARP_);
} else {
return null;
}
}),((cljs.core.set_QMARK_(val_or_vals))?val_or_vals:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [val_or_vals], null)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.vals(new cljs.core.Keyword("build","properties","build/properties",708607786).cljs$core$IFn$_invoke$arity$1(build_block))], 0)));
});
/**
 * Merge export maps for partial graph exports. *Do not* use for a full graph
 *   export because it makes assumptions about page identity
 */
logseq.db.sqlite.export$.merge_export_maps = (function logseq$db$sqlite$export$merge_export_maps(var_args){
var args__5732__auto__ = [];
var len__5726__auto___155524 = arguments.length;
var i__5727__auto___155525 = (0);
while(true){
if((i__5727__auto___155525 < len__5726__auto___155524)){
args__5732__auto__.push((arguments[i__5727__auto___155525]));

var G__155526 = (i__5727__auto___155525 + (1));
i__5727__auto___155525 = G__155526;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return logseq.db.sqlite.export$.merge_export_maps.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(logseq.db.sqlite.export$.merge_export_maps.cljs$core$IFn$_invoke$arity$variadic = (function (export_maps){
var pages_and_blocks = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__155140_SHARP_){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.merge_with,(function (e1,e2){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.map_QMARK_(e1);
if(and__5000__auto__){
return cljs.core.map.cljs$core$IFn$_invoke$arity$1(e2);
} else {
return and__5000__auto__;
}
})())){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([e1,e2], 0));
} else {
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(e1,e2);
}
}),cljs.core.second(p1__155140_SHARP_));
}),cljs.core.group_by((function (p1__155139_SHARP_){
return cljs.core.select_keys(new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$1(p1__155139_SHARP_),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("build","journal","build/journal",1781180096)], null));
}),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([export_maps], 0))));
var properties = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.merge_with,cljs.core.merge,cljs.core.keep.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"properties","properties",685819552),export_maps));
var classes = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.merge_with,cljs.core.merge,cljs.core.keep.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"classes","classes",2037804510),export_maps));
var G__155148 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185),pages_and_blocks], null);
var G__155148__$1 = ((cljs.core.seq(properties))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155148,new cljs.core.Keyword(null,"properties","properties",685819552),properties):G__155148);
if(cljs.core.seq(classes)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155148__$1,new cljs.core.Keyword(null,"classes","classes",2037804510),classes);
} else {
return G__155148__$1;
}
}));

(logseq.db.sqlite.export$.merge_export_maps.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(logseq.db.sqlite.export$.merge_export_maps.cljs$lang$applyTo = (function (seq155142){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq155142));
}));

/**
 * Builds an export of properties and classes from a mixed group of nodes that may both
 */
logseq.db.sqlite.export$.build_mixed_properties_and_classes_export = (function logseq$db$sqlite$export$build_mixed_properties_and_classes_export(db,ents,export_opts){
var properties = (function (){var temp__5804__auto__ = cljs.core.seq(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),cljs.core.filter.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.entity_util.property_QMARK_,ents)));
if(temp__5804__auto__){
var prop_ids = temp__5804__auto__;
return logseq.db.sqlite.export$.build_export_properties(db,prop_ids,export_opts);
} else {
return null;
}
})();
var classes = (function (){var temp__5804__auto__ = cljs.core.seq(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.entity_util.class_QMARK_,ents));
if(temp__5804__auto__){
var class_ents = temp__5804__auto__;
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__155149_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__155149_SHARP_),logseq.db.sqlite.export$.build_export_class(p1__155149_SHARP_,export_opts)],null));
}),class_ents));
} else {
return null;
}
})();
var G__155159 = cljs.core.PersistentArrayMap.EMPTY;
var G__155159__$1 = (cljs.core.truth_(properties)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155159,new cljs.core.Keyword(null,"properties","properties",685819552),properties):G__155159);
if(cljs.core.truth_(classes)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155159__$1,new cljs.core.Keyword(null,"classes","classes",2037804510),classes);
} else {
return G__155159__$1;
}
});
/**
 * Builds an export config (and additional info) for refs in the given blocks. Refs are detected
 * if they are a :block/link or if a `[[UUID]]` ref in the content. All the exported
 * entities found in block refs include their uuid in order to preserve the relationship to the blocks
 */
logseq.db.sqlite.export$.build_content_ref_export = (function logseq$db$sqlite$export$build_content_ref_export(db,blocks_STAR_){
var blocks = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865),blocks_STAR_);
var block_links = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__155165_SHARP_){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(p1__155165_SHARP_));
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","link","block/link",-1872399993),blocks));
var content_ref_uuids = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.content.get_matched_ids,logseq.db.sqlite.export$.block_title),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([blocks], 0))),block_links);
var content_ref_ents = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__155166_SHARP_){
var G__155176 = db;
var G__155177 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__155166_SHARP_], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__155176,G__155177) : datascript.core.entity.call(null,G__155176,G__155177));
}),content_ref_uuids);
var content_ref_pages = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__155167_SHARP_){
var or__5002__auto__ = logseq.db.frontend.entity_util.internal_page_QMARK_(p1__155167_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.db.frontend.entity_util.journal_QMARK_(p1__155167_SHARP_);
}
}),content_ref_ents);
var map__155175 = logseq.db.sqlite.export$.build_mixed_properties_and_classes_export(db,content_ref_ents,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"include-uuid?","include-uuid?",-167629975),true,new cljs.core.Keyword(null,"shallow-copy?","shallow-copy?",-99881020),true], null));
var map__155175__$1 = cljs.core.__destructure_map(map__155175);
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155175__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var classes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155175__$1,new cljs.core.Keyword(null,"classes","classes",2037804510));
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"content-ref-uuids","content-ref-uuids",1465823717),content_ref_uuids,new cljs.core.Keyword(null,"content-ref-ents","content-ref-ents",853626936),content_ref_ents,new cljs.core.Keyword(null,"properties","properties",685819552),cljs.core.update_vals(properties,(function (p1__155168_SHARP_){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p1__155168_SHARP_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("build","keep-uuid?","build/keep-uuid?",705498954),true], null)], 0));
})),new cljs.core.Keyword(null,"classes","classes",2037804510),cljs.core.update_vals(classes,(function (p1__155170_SHARP_){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p1__155170_SHARP_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("build","keep-uuid?","build/keep-uuid?",705498954),true], null)], 0));
})),new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__155171_SHARP_){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"page","page",849072397)],[cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.sqlite.export$.shallow_copy_page(p1__155171_SHARP_),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__155171_SHARP_),new cljs.core.Keyword("build","keep-uuid?","build/keep-uuid?",705498954),true], null)], 0))]);
}),content_ref_pages)], null);
});
logseq.db.sqlite.export$.build_class_parents_export = (function logseq$db$sqlite$export$build_class_parents_export(db,classes_config){
var class_parent_ents = logseq.db.frontend.db.get_classes_parents(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__155187_SHARP_){
var G__155196 = db;
var G__155197 = cljs.core.key(p1__155187_SHARP_);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__155196,G__155197) : datascript.core.entity.call(null,G__155196,G__155197));
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__155186_SHARP_){
return new cljs.core.Keyword("build","class-parent","build/class-parent",1092120922).cljs$core$IFn$_invoke$arity$1(cljs.core.val(p1__155186_SHARP_));
}),classes_config)));
var classes = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__155189_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__155189_SHARP_),logseq.db.sqlite.export$.build_export_class(p1__155189_SHARP_,cljs.core.PersistentArrayMap.EMPTY)],null));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__155188_SHARP_){
return logseq.db.frontend.class$.logseq_class_QMARK_(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__155188_SHARP_));
}),class_parent_ents)));
var class_parent_properties = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.logseq_property_QMARK_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","ident","db/ident",-737096),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([class_parent_ents], 0))));
var properties = logseq.db.sqlite.export$.build_export_properties(db,class_parent_properties,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"shallow-copy?","shallow-copy?",-99881020),true], null));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"classes","classes",2037804510),classes,new cljs.core.Keyword(null,"properties","properties",685819552),properties], null);
});
/**
 * Given a vec of block entities, returns the blocks in a sqlite.build EDN format
 * and all properties and classes used in these blocks
 */
logseq.db.sqlite.export$.build_blocks_export = (function logseq$db$sqlite$export$build_blocks_export(db,blocks,p__155215){
var map__155216 = p__155215;
var map__155216__$1 = cljs.core.__destructure_map(map__155216);
var opts = map__155216__$1;
var include_children_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__155216__$1,new cljs.core.Keyword(null,"include-children?","include-children?",1544050422),true);
var _STAR_properties = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(opts,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"graph-ontology","graph-ontology",-1663150820),new cljs.core.Keyword(null,"properties","properties",685819552)], null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})());
var _STAR_classes = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(opts,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"graph-ontology","graph-ontology",-1663150820),new cljs.core.Keyword(null,"classes","classes",2037804510)], null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})());
var _STAR_pvalue_uuids = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
var id_map = cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$1(cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),cljs.core.identity)),blocks);
var children = (cljs.core.truth_(include_children_QMARK_)?cljs.core.group_by((function (p1__155207_SHARP_){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(p1__155207_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Keyword("db","id","db/id",-1388397098)], null));
}),blocks):cljs.core.PersistentArrayMap.EMPTY);
var build_block = (function logseq$db$sqlite$export$build_blocks_export_$_build_block(block_STAR_){
var child_nodes = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(logseq$db$sqlite$export$build_blocks_export_$_build_block,cljs.core.get.cljs$core$IFn$_invoke$arity$3(children,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(block_STAR_),cljs.core.PersistentVector.EMPTY));
var map__155221 = logseq.db.sqlite.export$.build_node_export(db,block_STAR_,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(opts,new cljs.core.Keyword(null,"graph-ontology","graph-ontology",-1663150820)),new cljs.core.Keyword(null,"properties","properties",685819552),cljs.core.deref(_STAR_properties)));
var map__155221__$1 = cljs.core.__destructure_map(map__155221);
var node = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155221__$1,new cljs.core.Keyword(null,"node","node",581201198));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155221__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var classes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155221__$1,new cljs.core.Keyword(null,"classes","classes",2037804510));
var new_pvalue_uuids = logseq.db.sqlite.export$.get_pvalue_uuids(node);
if(cljs.core.seq(properties)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_properties,cljs.core.merge,properties);
} else {
}

if(cljs.core.seq(classes)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_classes,cljs.core.merge,classes);
} else {
}

if(cljs.core.seq(new_pvalue_uuids)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(_STAR_pvalue_uuids,cljs.core.into,new_pvalue_uuids);
} else {
}

var G__155224 = node;
if(cljs.core.seq(child_nodes)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155224,new cljs.core.Keyword("build","children","build/children",-1040452432),child_nodes);
} else {
return G__155224;
}
});
var roots = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__155209_SHARP_){
return cljs.core.contains_QMARK_(id_map,cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(p1__155209_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Keyword("db","id","db/id",-1388397098)], null)));
}),blocks);
var exported_blocks = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(build_block,roots);
var G__155227 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"blocks","blocks",-610462153),exported_blocks,new cljs.core.Keyword(null,"pvalue-uuids","pvalue-uuids",-471206294),cljs.core.deref(_STAR_pvalue_uuids)], null);
var G__155227__$1 = ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_properties),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(opts,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"graph-ontology","graph-ontology",-1663150820),new cljs.core.Keyword(null,"properties","properties",685819552)], null))))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155227,new cljs.core.Keyword(null,"properties","properties",685819552),cljs.core.deref(_STAR_properties)):G__155227);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_classes),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(opts,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"graph-ontology","graph-ontology",-1663150820),new cljs.core.Keyword(null,"classes","classes",2037804510)], null)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155227__$1,new cljs.core.Keyword(null,"classes","classes",2037804510),cljs.core.deref(_STAR_classes));
} else {
return G__155227__$1;
}
});
logseq.db.sqlite.export$.build_uuid_block_export = (function logseq$db$sqlite$export$build_uuid_block_export(db,pvalue_uuids,content_ref_ents,p__155239){
var map__155240 = p__155239;
var map__155240__$1 = cljs.core.__destructure_map(map__155240);
var page_entity = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155240__$1,new cljs.core.Keyword(null,"page-entity","page-entity",1168837897));
var content_ref_blocks = cljs.core.set(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.entity_util.page_QMARK_,content_ref_ents));
var uuid_block_ents_to_export = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__155232_SHARP_){
var G__155242 = db;
var G__155243 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__155232_SHARP_], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__155242,G__155243) : datascript.core.entity.call(null,G__155242,G__155243));
}),pvalue_uuids),content_ref_blocks);
var uuid_block_pages = ((cljs.core.seq(uuid_block_ents_to_export))?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__155247){
var vec__155248 = p__155247;
var parent_page_ent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__155248,(0),null);
var blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__155248,(1),null);
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.sqlite.export$.build_blocks_export(db,cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","order","block/order",-1429282437),blocks),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"include-uuid-fn","include-uuid-fn",-291819511),cljs.core.constantly(true),new cljs.core.Keyword(null,"shallow-copy?","shallow-copy?",-99881020),true], null)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page","page",849072397),logseq.db.sqlite.export$.shallow_copy_page(parent_page_ent)], null)], 0));
}),(function (m){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(m,page_entity);
})(cljs.core.group_by(new cljs.core.Keyword("block","page","block/page",822314108),uuid_block_ents_to_export))):null);
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"properties","properties",685819552),cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.merge,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"properties","properties",685819552),uuid_block_pages)),new cljs.core.Keyword(null,"classes","classes",2037804510),cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.merge,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"classes","classes",2037804510),uuid_block_pages)),new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__155234_SHARP_){
return cljs.core.select_keys(p1__155234_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword(null,"blocks","blocks",-610462153)], null));
}),uuid_block_pages)], null);
});
/**
 * Provide a reliable sort order since this tends to be large. Helps with diffing
 * and readability
 */
logseq.db.sqlite.export$.sort_pages_and_blocks = (function logseq$db$sqlite$export$sort_pages_and_blocks(pages_and_blocks){
return cljs.core.vec(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2((function (p1__155255_SHARP_){
var or__5002__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(p1__155255_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("block","title","block/title",710445684)], null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var G__155259 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(p1__155255_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("build","journal","build/journal",1781180096)], null));
if((G__155259 == null)){
return null;
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__155259);
}
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(p1__155255_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null)));
}
}
}),pages_and_blocks));
});
/**
 * Given final export maps, merges them, adds any missing class parents and merges those in.
 * If :pages-and-blocks exist, sorts them in order to have reliable sort order
 */
logseq.db.sqlite.export$.finalize_export_maps = (function logseq$db$sqlite$export$finalize_export_maps(var_args){
var args__5732__auto__ = [];
var len__5726__auto___155531 = arguments.length;
var i__5727__auto___155532 = (0);
while(true){
if((i__5727__auto___155532 < len__5726__auto___155531)){
args__5732__auto__.push((arguments[i__5727__auto___155532]));

var G__155533 = (i__5727__auto___155532 + (1));
i__5727__auto___155532 = G__155533;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return logseq.db.sqlite.export$.finalize_export_maps.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(logseq.db.sqlite.export$.finalize_export_maps.cljs$core$IFn$_invoke$arity$variadic = (function (db,export_maps){
var final_export_STAR_ = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(logseq.db.sqlite.export$.merge_export_maps,export_maps);
var class_parents_export = (function (){var G__155266 = new cljs.core.Keyword(null,"classes","classes",2037804510).cljs$core$IFn$_invoke$arity$1(final_export_STAR_);
if((G__155266 == null)){
return null;
} else {
return logseq.db.sqlite.export$.build_class_parents_export(db,G__155266);
}
})();
var merged_map = logseq.db.sqlite.export$.merge_export_maps.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([final_export_STAR_,class_parents_export], 0));
var G__155267 = merged_map;
if(cljs.core.truth_(new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185).cljs$core$IFn$_invoke$arity$1(merged_map))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__155267,new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185),logseq.db.sqlite.export$.sort_pages_and_blocks);
} else {
return G__155267;
}
}));

(logseq.db.sqlite.export$.finalize_export_maps.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(logseq.db.sqlite.export$.finalize_export_maps.cljs$lang$applyTo = (function (seq155264){
var G__155265 = cljs.core.first(seq155264);
var seq155264__$1 = cljs.core.next(seq155264);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__155265,seq155264__$1);
}));

/**
 * Exports block for given block eid
 */
logseq.db.sqlite.export$.build_block_export = (function logseq$db$sqlite$export$build_block_export(db,eid){
var block_entity = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,eid) : datascript.core.entity.call(null,db,eid));
var property_value_ents = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(datascript.impl.entity.entity_QMARK_,cljs.core.vals(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.properties(block_entity),new cljs.core.Keyword("block","tags","block/tags",1814948340))));
var map__155273 = logseq.db.sqlite.export$.build_content_ref_export(db,cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [block_entity], null),property_value_ents));
var map__155273__$1 = cljs.core.__destructure_map(map__155273);
var content_ref_export = map__155273__$1;
var content_ref_uuids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155273__$1,new cljs.core.Keyword(null,"content-ref-uuids","content-ref-uuids",1465823717));
var content_ref_ents = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155273__$1,new cljs.core.Keyword(null,"content-ref-ents","content-ref-ents",853626936));
var node_export = logseq.db.sqlite.export$.build_node_export(db,block_entity,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"include-uuid-fn","include-uuid-fn",-291819511),content_ref_uuids], null));
var pvalue_uuids = logseq.db.sqlite.export$.get_pvalue_uuids(new cljs.core.Keyword(null,"node","node",581201198).cljs$core$IFn$_invoke$arity$1(node_export));
var uuid_block_export = logseq.db.sqlite.export$.build_uuid_block_export(db,pvalue_uuids,content_ref_ents,cljs.core.PersistentArrayMap.EMPTY);
var block_export = logseq.db.sqlite.export$.finalize_export_maps.cljs$core$IFn$_invoke$arity$variadic(db,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([node_export,uuid_block_export,content_ref_export], 0));
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("logseq.db.sqlite.export","block","logseq.db.sqlite.export/block",469582025),new cljs.core.Keyword(null,"node","node",581201198).cljs$core$IFn$_invoke$arity$1(node_export)], null),block_export], 0));
});
logseq.db.sqlite.export$.build_page_blocks_export = (function logseq$db$sqlite$export$build_page_blocks_export(db,page_entity,p__155286){
var map__155290 = p__155286;
var map__155290__$1 = cljs.core.__destructure_map(map__155290);
var options = map__155290__$1;
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155290__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var classes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155290__$1,new cljs.core.Keyword(null,"classes","classes",2037804510));
var blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155290__$1,new cljs.core.Keyword(null,"blocks","blocks",-610462153));
var ontology_page_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155290__$1,new cljs.core.Keyword(null,"ontology-page?","ontology-page?",-908026596));
var include_alias_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155290__$1,new cljs.core.Keyword(null,"include-alias?","include-alias?",746737871));
var options_SINGLEQUOTE_ = (function (){var G__155291 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(options,new cljs.core.Keyword(null,"classes","classes",2037804510),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"blocks","blocks",-610462153),new cljs.core.Keyword(null,"graph-ontology","graph-ontology",-1663150820)], 0));
if(cljs.core.truth_(new cljs.core.Keyword(null,"exclude-ontology?","exclude-ontology?",-439731608).cljs$core$IFn$_invoke$arity$1(options))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155291,new cljs.core.Keyword(null,"properties","properties",685819552),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(options,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"graph-ontology","graph-ontology",-1663150820),new cljs.core.Keyword(null,"properties","properties",685819552)], null)));
} else {
return G__155291;
}
})();
var page_ent_export = (cljs.core.truth_(ontology_page_QMARK_)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node","node",581201198),cljs.core.select_keys(page_entity,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null))], null):logseq.db.sqlite.export$.build_node_export(db,page_entity,options_SINGLEQUOTE_));
var page_pvalue_uuids = logseq.db.sqlite.export$.get_pvalue_uuids(new cljs.core.Keyword(null,"node","node",581201198).cljs$core$IFn$_invoke$arity$1(page_ent_export));
var page = (cljs.core.truth_(ontology_page_QMARK_)?new cljs.core.Keyword(null,"node","node",581201198).cljs$core$IFn$_invoke$arity$1(page_ent_export):cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"node","node",581201198).cljs$core$IFn$_invoke$arity$1(page_ent_export),new cljs.core.Keyword("block","title","block/title",710445684)),logseq.db.sqlite.export$.shallow_copy_page(page_entity),(cljs.core.truth_((function (){var and__5000__auto__ = include_alias_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword("block","alias","block/alias",-2112644699).cljs$core$IFn$_invoke$arity$1(page_entity);
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","alias","block/alias",-2112644699),cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__155281_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__155281_SHARP_)],null));
}),new cljs.core.Keyword("block","alias","block/alias",-2112644699).cljs$core$IFn$_invoke$arity$1(page_entity)))], null):null)], 0)));
var page_blocks_export = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"page","page",849072397),page,new cljs.core.Keyword(null,"blocks","blocks",-610462153),blocks], null)], null),new cljs.core.Keyword(null,"properties","properties",685819552),properties,new cljs.core.Keyword(null,"classes","classes",2037804510),classes], null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(logseq.db.sqlite.export$.merge_export_maps.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([page_blocks_export,page_ent_export], 0)),new cljs.core.Keyword(null,"pvalue-uuids","pvalue-uuids",-471206294),page_pvalue_uuids);
});
logseq.db.sqlite.export$.get_page_blocks = (function logseq$db$sqlite$export$get_page_blocks(db,eid){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__155297_SHARP_){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__155297_SHARP_) : datascript.core.entity.call(null,db,p1__155297_SHARP_));
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","page","block/page",822314108),eid)));
});
logseq.db.sqlite.export$.build_page_export_STAR_ = (function logseq$db$sqlite$export$build_page_export_STAR_(db,eid,page_blocks_STAR_,options){
var page_entity = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,eid) : datascript.core.entity.call(null,db,eid));
var page_blocks = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267),cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","order","block/order",-1429282437),page_blocks_STAR_));
var map__155298 = logseq.db.sqlite.export$.build_blocks_export(db,page_blocks,options);
var map__155298__$1 = cljs.core.__destructure_map(map__155298);
var blocks_export = map__155298__$1;
var pvalue_uuids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155298__$1,new cljs.core.Keyword(null,"pvalue-uuids","pvalue-uuids",-471206294));
var page_blocks_export = logseq.db.sqlite.export$.build_page_blocks_export(db,page_entity,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([blocks_export,options], 0)));
var page_block_uuids = clojure.set.union.cljs$core$IFn$_invoke$arity$2(pvalue_uuids,new cljs.core.Keyword(null,"pvalue-uuids","pvalue-uuids",-471206294).cljs$core$IFn$_invoke$arity$1(page_blocks_export));
var page_export = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(page_blocks_export,new cljs.core.Keyword(null,"pvalue-uuids","pvalue-uuids",-471206294),page_block_uuids);
return page_export;
});
/**
 * Exports page for given page eid
 */
logseq.db.sqlite.export$.build_page_export = (function logseq$db$sqlite$export$build_page_export(db,eid){
var page_blocks_STAR_ = logseq.db.sqlite.export$.get_page_blocks(db,eid);
var map__155299 = logseq.db.sqlite.export$.build_content_ref_export(db,page_blocks_STAR_);
var map__155299__$1 = cljs.core.__destructure_map(map__155299);
var content_ref_export = map__155299__$1;
var content_ref_ents = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155299__$1,new cljs.core.Keyword(null,"content-ref-ents","content-ref-ents",853626936));
var map__155300 = logseq.db.sqlite.export$.build_page_export_STAR_(db,eid,page_blocks_STAR_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"include-uuid-fn","include-uuid-fn",-291819511),new cljs.core.Keyword(null,"content-ref-uuids","content-ref-uuids",1465823717).cljs$core$IFn$_invoke$arity$1(content_ref_export)], null));
var map__155300__$1 = cljs.core.__destructure_map(map__155300);
var page_export_STAR_ = map__155300__$1;
var pvalue_uuids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155300__$1,new cljs.core.Keyword(null,"pvalue-uuids","pvalue-uuids",-471206294));
var page_entity = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,eid) : datascript.core.entity.call(null,db,eid));
var uuid_block_export = logseq.db.sqlite.export$.build_uuid_block_export(db,pvalue_uuids,content_ref_ents,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page-entity","page-entity",1168837897),page_entity], null));
var page_export = logseq.db.sqlite.export$.finalize_export_maps.cljs$core$IFn$_invoke$arity$variadic(db,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([page_export_STAR_,uuid_block_export,content_ref_export], 0));
return page_export;
});
/**
 * Export a mix of pages and blocks
 */
logseq.db.sqlite.export$.build_nodes_export = (function logseq$db$sqlite$export$build_nodes_export(db,nodes,opts){
var node_pages = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.entity_util.page_QMARK_,nodes);
var pages_export = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.sqlite.export$.build_mixed_properties_and_classes_export(db,node_pages,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"shallow-copy?","shallow-copy?",-99881020),true], null)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__155305_SHARP_){
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"page","page",849072397)],[logseq.db.sqlite.export$.shallow_copy_page(p1__155305_SHARP_)]);
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__155306_SHARP_){
var or__5002__auto__ = logseq.db.frontend.entity_util.internal_page_QMARK_(p1__155306_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.db.frontend.entity_util.journal_QMARK_(p1__155306_SHARP_);
}
}),node_pages))], null)], 0));
var node_blocks = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.entity_util.page_QMARK_,nodes);
var pages_to_blocks = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__155314){
var vec__155317 = p__155314;
var parent_page_ent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__155317,(0),null);
var blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__155317,(1),null);
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.sqlite.export$.build_blocks_export(db,cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","order","block/order",-1429282437),blocks),opts),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"page","page",849072397),logseq.db.sqlite.export$.shallow_copy_page(parent_page_ent)], null)], 0));
}),cljs.core.group_by(new cljs.core.Keyword("block","page","block/page",822314108),node_blocks));
var pages_to_blocks_export = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"properties","properties",685819552),cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.merge,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"properties","properties",685819552),pages_to_blocks)),new cljs.core.Keyword(null,"classes","classes",2037804510),cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.merge,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"classes","classes",2037804510),pages_to_blocks)),new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__155307_SHARP_){
return cljs.core.select_keys(p1__155307_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword(null,"blocks","blocks",-610462153)], null));
}),pages_to_blocks)], null);
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([logseq.db.sqlite.export$.merge_export_maps.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pages_export,pages_to_blocks_export], 0)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pvalue-uuids","pvalue-uuids",-471206294),cljs.core.apply.cljs$core$IFn$_invoke$arity$2(clojure.set.union,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"pvalue-uuids","pvalue-uuids",-471206294),pages_to_blocks))], null)], 0));
});
/**
 * Exports given nodes from a view. Nodes are a random mix of blocks and pages
 */
logseq.db.sqlite.export$.build_view_nodes_export = (function logseq$db$sqlite$export$build_view_nodes_export(db,eids){
var nodes = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__155321_SHARP_){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__155321_SHARP_) : datascript.core.entity.call(null,db,p1__155321_SHARP_));
}),eids);
var property_value_ents = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__155322_SHARP_){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2(datascript.impl.entity.entity_QMARK_,cljs.core.vals(cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,logseq.db.frontend.property.properties(p1__155322_SHARP_),logseq.db.frontend.property.public_db_attribute_properties)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([nodes], 0));
var map__155323 = logseq.db.sqlite.export$.build_content_ref_export(db,cljs.core.into.cljs$core$IFn$_invoke$arity$2(nodes,property_value_ents));
var map__155323__$1 = cljs.core.__destructure_map(map__155323);
var content_ref_export = map__155323__$1;
var content_ref_uuids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155323__$1,new cljs.core.Keyword(null,"content-ref-uuids","content-ref-uuids",1465823717));
var content_ref_ents = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155323__$1,new cljs.core.Keyword(null,"content-ref-ents","content-ref-ents",853626936));
var map__155324 = logseq.db.sqlite.export$.build_nodes_export(db,nodes,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"include-uuid-fn","include-uuid-fn",-291819511),content_ref_uuids,new cljs.core.Keyword(null,"include-children?","include-children?",1544050422),false], null));
var map__155324__$1 = cljs.core.__destructure_map(map__155324);
var nodes_export = map__155324__$1;
var pvalue_uuids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155324__$1,new cljs.core.Keyword(null,"pvalue-uuids","pvalue-uuids",-471206294));
var uuid_block_export = logseq.db.sqlite.export$.build_uuid_block_export(db,pvalue_uuids,content_ref_ents,cljs.core.PersistentArrayMap.EMPTY);
var view_nodes_export = logseq.db.sqlite.export$.finalize_export_maps.cljs$core$IFn$_invoke$arity$variadic(db,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([nodes_export,uuid_block_export,content_ref_export], 0));
return view_nodes_export;
});
/**
 * Exports given nodes selected by a user. Nodes can be a mix of blocks and pages
 */
logseq.db.sqlite.export$.build_selected_nodes_export = (function logseq$db$sqlite$export$build_selected_nodes_export(db,eids){
var top_level_nodes = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__155325_SHARP_){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__155325_SHARP_) : datascript.core.entity.call(null,db,p1__155325_SHARP_));
}),eids);
var children_nodes = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__155326_SHARP_){
return cljs.core.rest(logseq.db.get_block_and_children(db,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(p1__155326_SHARP_)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.entity_util.page_QMARK_,top_level_nodes)], 0)));
var nodes = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(top_level_nodes,children_nodes);
var property_value_ents = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__155327_SHARP_){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2(datascript.impl.entity.entity_QMARK_,cljs.core.vals(cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,logseq.db.frontend.property.properties(p1__155327_SHARP_),logseq.db.frontend.property.public_db_attribute_properties)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([nodes], 0));
var map__155331 = logseq.db.sqlite.export$.build_content_ref_export(db,cljs.core.into.cljs$core$IFn$_invoke$arity$2(nodes,property_value_ents));
var map__155331__$1 = cljs.core.__destructure_map(map__155331);
var content_ref_export = map__155331__$1;
var content_ref_uuids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155331__$1,new cljs.core.Keyword(null,"content-ref-uuids","content-ref-uuids",1465823717));
var content_ref_ents = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155331__$1,new cljs.core.Keyword(null,"content-ref-ents","content-ref-ents",853626936));
var map__155332 = logseq.db.sqlite.export$.build_nodes_export(db,nodes,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"include-uuid-fn","include-uuid-fn",-291819511),content_ref_uuids,new cljs.core.Keyword(null,"include-children?","include-children?",1544050422),true], null));
var map__155332__$1 = cljs.core.__destructure_map(map__155332);
var nodes_export = map__155332__$1;
var pvalue_uuids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155332__$1,new cljs.core.Keyword(null,"pvalue-uuids","pvalue-uuids",-471206294));
var uuid_block_export = logseq.db.sqlite.export$.build_uuid_block_export(db,pvalue_uuids,content_ref_ents,cljs.core.PersistentArrayMap.EMPTY);
var view_nodes_export = logseq.db.sqlite.export$.finalize_export_maps.cljs$core$IFn$_invoke$arity$variadic(db,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([nodes_export,uuid_block_export,content_ref_export], 0));
return view_nodes_export;
});
/**
 * Exports a graph's tags and properties
 */
logseq.db.sqlite.export$.build_graph_ontology_export = (function logseq$db$sqlite$export$build_graph_ontology_export(db,p__155337){
var map__155338 = p__155337;
var map__155338__$1 = cljs.core.__destructure_map(map__155338);
var options = map__155338__$1;
var exclude_namespaces = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155338__$1,new cljs.core.Keyword(null,"exclude-namespaces","exclude-namespaces",-1345442365));
var exclude_regex = ((cljs.core.seq(exclude_namespaces))?cljs.core.re_pattern(["^(",clojure.string.join.cljs$core$IFn$_invoke$arity$2("|",cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.name,exclude_namespaces)),")(\\.|$)"].join('')):null);
var user_property_idents = (function (){var G__155343 = new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?db-ident","?db-ident",1440943734,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Symbol(null,"?db-ident","?db-ident",1440943734,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048)], null),cljs.core.list(new cljs.core.Symbol(null,"not","not",1044554643,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160)], null))], null);
var G__155344 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__155343,G__155344) : datascript.core.q.call(null,G__155343,G__155344));
})();
var user_property_idents_SINGLEQUOTE_ = ((cljs.core.seq(exclude_namespaces))?cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__155333_SHARP_){
return cljs.core.re_find(exclude_regex,cljs.core.namespace(p1__155333_SHARP_));
}),user_property_idents):user_property_idents);
var properties = logseq.db.sqlite.export$.build_export_properties(db,user_property_idents_SINGLEQUOTE_,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([options,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"include-properties?","include-properties?",1631601018),true], null)], 0)));
var class_ents = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__155335_SHARP_){
var and__5000__auto__ = cljs.core.seq(exclude_namespaces);
if(and__5000__auto__){
return cljs.core.re_find(exclude_regex,cljs.core.namespace(new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__155335_SHARP_)));
} else {
return and__5000__auto__;
}
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__155334_SHARP_){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__155334_SHARP_) : datascript.core.entity.call(null,db,p1__155334_SHARP_));
}),(function (){var G__155346 = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?class","?class",919269736,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?class","?class",919269736,null),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083)], null),cljs.core.list(new cljs.core.Symbol(null,"not","not",1044554643,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?class","?class",919269736,null),new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160)], null))], null);
var G__155347 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__155346,G__155347) : datascript.core.q.call(null,G__155346,G__155347));
})()));
var classes = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (ent){
var ent_properties = cljs.core.apply.cljs$core$IFn$_invoke$arity$4(cljs.core.dissoc,logseq.db.frontend.property.properties(ent),new cljs.core.Keyword("logseq.property","parent","logseq.property/parent",177984509),logseq.db.frontend.property.public_db_attribute_properties);
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(ent),(function (){var G__155349 = logseq.db.sqlite.export$.build_export_class(ent,options);
if(cljs.core.seq(ent_properties)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155349,new cljs.core.Keyword("build","properties","build/properties",708607786),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(logseq.db.sqlite.export$.buildable_properties(db,ent_properties,properties,options),new cljs.core.Keyword("logseq.property","classes","logseq.property/classes",913750486),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("logseq.property.class","properties","logseq.property.class/properties",-2123712050)], 0)));
} else {
return G__155349;
}
})()],null));
}),class_ents));
var G__155352 = cljs.core.PersistentArrayMap.EMPTY;
var G__155352__$1 = ((cljs.core.seq(properties))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155352,new cljs.core.Keyword(null,"properties","properties",685819552),properties):G__155352);
if(cljs.core.seq(classes)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155352__$1,new cljs.core.Keyword(null,"classes","classes",2037804510),classes);
} else {
return G__155352__$1;
}
});
logseq.db.sqlite.export$.get_graph_content_ref_uuids = (function logseq$db$sqlite$export$get_graph_content_ref_uuids(db,p__155357){
var map__155358 = p__155357;
var map__155358__$1 = cljs.core.__destructure_map(map__155358);
var exclude_built_in_pages_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155358__$1,new cljs.core.Keyword(null,"exclude-built-in-pages?","exclude-built-in-pages?",-932040737));
var block_titles = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"v","v",21465059),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","title","block/title",710445684)));
var block_links = (cljs.core.truth_(exclude_built_in_pages_QMARK_)?cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__155353_SHARP_){
if(cljs.core.truth_(new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1((function (){var G__155359 = db;
var G__155360 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(p1__155353_SHARP_);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__155359,G__155360) : datascript.core.entity.call(null,G__155359,G__155360));
})())))){
return null;
} else {
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((function (){var G__155361 = db;
var G__155362 = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(p1__155353_SHARP_);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__155361,G__155362) : datascript.core.entity.call(null,G__155361,G__155362));
})());
}
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","link","block/link",-1872399993))):cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__155354_SHARP_){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1((function (){var G__155363 = db;
var G__155364 = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(p1__155354_SHARP_);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__155363,G__155364) : datascript.core.entity.call(null,G__155363,G__155364));
})());
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","link","block/link",-1872399993))));
var content_ref_uuids = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(logseq.db.frontend.content.get_matched_ids,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.string_QMARK_,block_titles)], 0)),block_links);
return cljs.core.set(content_ref_uuids);
});
/**
 * Handles pages, journals and their blocks
 */
logseq.db.sqlite.export$.build_graph_pages_export = (function logseq$db$sqlite$export$build_graph_pages_export(db,graph_ontology,options_STAR_){
var options = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([options_STAR_,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"graph-ontology","graph-ontology",-1663150820),graph_ontology], null),((cljs.core.empty_QMARK_(new cljs.core.Keyword(null,"exclude-namespaces","exclude-namespaces",-1345442365).cljs$core$IFn$_invoke$arity$1(options_STAR_)))?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"exclude-ontology?","exclude-ontology?",-439731608),true], null):null)], 0));
var page_ids = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Page","logseq.class/Page",1484340329))),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081))));
var ontology_ids = clojure.set.union.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083)))),cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048)))));
var page_exports = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (eid){
var page_blocks = logseq.db.sqlite.export$.get_page_blocks(db,eid);
return logseq.db.sqlite.export$.build_page_export_STAR_(db,eid,page_blocks,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([options,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"include-uuid-fn","include-uuid-fn",-291819511),cljs.core.constantly(true)], null)], 0)));
}),page_ids);
var ontology_page_exports = cljs.core.vec(cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (eid){
var temp__5804__auto__ = cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267),logseq.db.sqlite.export$.get_page_blocks(db,eid)));
if(temp__5804__auto__){
var page_blocks = temp__5804__auto__;
return logseq.db.sqlite.export$.build_page_export_STAR_(db,eid,page_blocks,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([options,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"include-uuid-fn","include-uuid-fn",-291819511),cljs.core.constantly(true),new cljs.core.Keyword(null,"ontology-page?","ontology-page?",-908026596),true], null)], 0)));
} else {
return null;
}
}),ontology_ids));
var page_exports_SINGLEQUOTE_ = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (page_export){
var and__5000__auto__ = new cljs.core.Keyword(null,"exclude-built-in-pages?","exclude-built-in-pages?",-932040737).cljs$core$IFn$_invoke$arity$1(options);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(page_export,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185),(0),new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("build","properties","build/properties",708607786),new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160)], null));
} else {
return and__5000__auto__;
}
}),cljs.core.concat.cljs$core$IFn$_invoke$arity$2(page_exports,ontology_page_exports));
var alias_uuids = cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p__155383){
var map__155385 = p__155383;
var map__155385__$1 = cljs.core.__destructure_map(map__155385);
var pages_and_blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155385__$1,new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185));
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__155367_SHARP_){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(p1__155367_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("block","alias","block/alias",-2112644699)], null)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pages_and_blocks], 0));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([page_exports_SINGLEQUOTE_], 0)),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__155368_SHARP_){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,new cljs.core.Keyword("block","alias","block/alias",-2112644699).cljs$core$IFn$_invoke$arity$1(p1__155368_SHARP_));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.vals(new cljs.core.Keyword(null,"classes","classes",2037804510).cljs$core$IFn$_invoke$arity$1(graph_ontology))], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__155369_SHARP_){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,new cljs.core.Keyword("block","alias","block/alias",-2112644699).cljs$core$IFn$_invoke$arity$1(p1__155369_SHARP_));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.vals(new cljs.core.Keyword(null,"properties","properties",685819552).cljs$core$IFn$_invoke$arity$1(graph_ontology))], 0))], 0));
var uuids_to_keep = clojure.set.union.cljs$core$IFn$_invoke$arity$variadic(cljs.core.set(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"pvalue-uuids","pvalue-uuids",-471206294),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([page_exports_SINGLEQUOTE_], 0))),cljs.core.set(alias_uuids),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__155370_SHARP_){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(p1__155370_SHARP_,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185),(0),new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null));
}),ontology_page_exports))], 0));
var pages_export = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185),cljs.core.vec(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([page_exports_SINGLEQUOTE_], 0))),new cljs.core.Keyword(null,"pvalue-uuids","pvalue-uuids",-471206294),uuids_to_keep], null);
return pages_export;
});
logseq.db.sqlite.export$.build_graph_files = (function logseq$db$sqlite$export$build_graph_files(db,p__155388){
var map__155389 = p__155388;
var map__155389__$1 = cljs.core.__destructure_map(map__155389);
var include_timestamps_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155389__$1,new cljs.core.Keyword(null,"include-timestamps?","include-timestamps?",158216918));
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__155387_SHARP_){
if(cljs.core.truth_(include_timestamps_QMARK_)){
return cljs.core.select_keys(p1__155387_SHARP_,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","path","file/path",-191335748),new cljs.core.Keyword("file","content","file/content",12680964),new cljs.core.Keyword("file","created-at","file/created-at",-92397056),new cljs.core.Keyword("file","last-modified-at","file/last-modified-at",473527310)], null));
} else {
return cljs.core.select_keys(p1__155387_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","path","file/path",-191335748),new cljs.core.Keyword("file","content","file/content",12680964)], null));
}
}),(function (){var G__155390 = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file","path","file/path",-191335748),new cljs.core.Keyword("file","content","file/content",12680964),new cljs.core.Keyword("file","created-at","file/created-at",-92397056),new cljs.core.Keyword("file","last-modified-at","file/last-modified-at",473527310)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("file","path","file/path",-191335748)], null)], null);
var G__155391 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__155390,G__155391) : datascript.core.q.call(null,G__155390,G__155391));
})());
});
logseq.db.sqlite.export$.build_kv_values = (function logseq$db$sqlite$export$build_kv_values(db){
return cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__155392_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.kv","schema-version","logseq.kv/schema-version",-1467606676),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__155392_SHARP_));
}),(function (){var G__155394 = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("kv","value","kv/value",305981670)], null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("kv","value","kv/value",305981670)], null)], null);
var G__155395 = db;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$2 ? datascript.core.q.cljs$core$IFn$_invoke$arity$2(G__155394,G__155395) : datascript.core.q.call(null,G__155394,G__155395));
})()));
});
logseq.db.sqlite.export$.remove_uuids_if_not_ref = (function logseq$db$sqlite$export$remove_uuids_if_not_ref(export_map,all_ref_uuids){
var remove_uuid_if_not_ref = (function (m){
if(cljs.core.contains_QMARK_(all_ref_uuids,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(m))){
return m;
} else {
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(m,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("build","keep-uuid?","build/keep-uuid?",705498954)], 0));
}
});
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$4(cljs.core.update.cljs$core$IFn$_invoke$arity$4(export_map,new cljs.core.Keyword(null,"classes","classes",2037804510),cljs.core.update_vals,remove_uuid_if_not_ref),new cljs.core.Keyword(null,"properties","properties",685819552),cljs.core.update_vals,remove_uuid_if_not_ref),new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185),(function (pages_and_blocks){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__155398){
var map__155399 = p__155398;
var map__155399__$1 = cljs.core.__destructure_map(map__155399);
var page = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155399__$1,new cljs.core.Keyword(null,"page","page",849072397));
var blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155399__$1,new cljs.core.Keyword(null,"blocks","blocks",-610462153));
var page_map = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"page","page",849072397),remove_uuid_if_not_ref(page),new cljs.core.Keyword(null,"blocks","blocks",-610462153),logseq.db.sqlite.build.update_each_block(blocks,remove_uuid_if_not_ref)], null);
var page_map_SINGLEQUOTE_ = clojure.walk.postwalk((function (f){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.map_QMARK_(f);
if(and__5000__auto__){
return new cljs.core.Keyword("build","property-value","build/property-value",1425188701).cljs$core$IFn$_invoke$arity$1(f);
} else {
return and__5000__auto__;
}
})())){
return remove_uuid_if_not_ref(f);
} else {
return f;
}
}),page_map);
return page_map_SINGLEQUOTE_;
}),pages_and_blocks);
}));
});
/**
 * Adds :properties to export for given namespace parents. Current use case is for :exclude-namespaces
 * so no need to add :classes yet
 */
logseq.db.sqlite.export$.add_ontology_for_include_namespaces = (function logseq$db$sqlite$export$add_ontology_for_include_namespaces(db,p__155405){
var map__155406 = p__155405;
var map__155406__$1 = cljs.core.__destructure_map(map__155406);
var graph_export = map__155406__$1;
var auto_include_namespaces = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155406__$1,new cljs.core.Keyword("logseq.db.sqlite.export","auto-include-namespaces","logseq.db.sqlite.export/auto-include-namespaces",394890806));
var include_regex = cljs.core.re_pattern(["^(",clojure.string.join.cljs$core$IFn$_invoke$arity$2("|",cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.name,auto_include_namespaces)),")(\\.|$)"].join(''));
var used_properties = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__155401_SHARP_){
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[p1__155401_SHARP_,cljs.core.select_keys((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__155401_SHARP_) : datascript.core.entity.call(null,db,p1__155401_SHARP_)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659)], null))],null));
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__155400_SHARP_){
return cljs.core.re_find(include_regex,cljs.core.namespace(p1__155400_SHARP_));
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.internal_property_QMARK_,cljs.core.keys(logseq.db.sqlite.build.get_used_properties_from_options(graph_export))))));
return cljs.core.select_keys(logseq.db.sqlite.export$.merge_export_maps.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.select_keys(graph_export,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"properties","properties",685819552)], null)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"properties","properties",685819552),used_properties], null)], 0)),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"properties","properties",685819552)], null));
});
/**
 * Exports whole graph. Has the following options:
 * * :include-timestamps? - When set, timestamps are included on all blocks
 * * :exclude-namespaces - A set of parent namespaces to exclude from properties and classes.
 *   This is useful for graphs seeded with an ontology e.g. schema.org as it eliminates noisy and needless
 *   export+import
 * * :exclude-built-in-pages? - When set, built-in pages are excluded from export
 * * :exclude-files? - When set, files are excluded from export
 */
logseq.db.sqlite.export$.build_graph_export = (function logseq$db$sqlite$export$build_graph_export(db,p__155409){
var map__155410 = p__155409;
var map__155410__$1 = cljs.core.__destructure_map(map__155410);
var options_STAR_ = map__155410__$1;
var exclude_files_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155410__$1,new cljs.core.Keyword(null,"exclude-files?","exclude-files?",-1565120899));
var options = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([options_STAR_,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"property-value-uuids?","property-value-uuids?",-339905445),true,new cljs.core.Keyword(null,"include-alias?","include-alias?",746737871),true], null)], 0));
var content_ref_uuids = logseq.db.sqlite.export$.get_graph_content_ref_uuids(db,options);
var ontology_options = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([options,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"include-uuid?","include-uuid?",-167629975),true], null)], 0));
var ontology_export = logseq.db.sqlite.export$.build_graph_ontology_export(db,ontology_options);
var ontology_pvalue_uuids = cljs.core.set(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(logseq.db.sqlite.export$.get_pvalue_uuids,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.vals(new cljs.core.Keyword(null,"properties","properties",685819552).cljs$core$IFn$_invoke$arity$1(ontology_export))], 0)),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(logseq.db.sqlite.export$.get_pvalue_uuids,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.vals(new cljs.core.Keyword(null,"classes","classes",2037804510).cljs$core$IFn$_invoke$arity$1(ontology_export))], 0))));
var pages_export = logseq.db.sqlite.export$.build_graph_pages_export(db,ontology_export,options);
var graph_export_STAR_ = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([ontology_export,pages_export], 0)),new cljs.core.Keyword(null,"pvalue-uuids","pvalue-uuids",-471206294));
var graph_export = ((cljs.core.seq(new cljs.core.Keyword(null,"exclude-namespaces","exclude-namespaces",-1345442365).cljs$core$IFn$_invoke$arity$1(options)))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(graph_export_STAR_,new cljs.core.Keyword("logseq.db.sqlite.export","auto-include-namespaces","logseq.db.sqlite.export/auto-include-namespaces",394890806),new cljs.core.Keyword(null,"exclude-namespaces","exclude-namespaces",-1345442365).cljs$core$IFn$_invoke$arity$1(options)):graph_export_STAR_);
var all_ref_uuids = clojure.set.union.cljs$core$IFn$_invoke$arity$variadic(content_ref_uuids,ontology_pvalue_uuids,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"pvalue-uuids","pvalue-uuids",-471206294).cljs$core$IFn$_invoke$arity$1(pages_export)], 0));
var files = (cljs.core.truth_(exclude_files_QMARK_)?null:logseq.db.sqlite.export$.build_graph_files(db,options));
var kv_values = logseq.db.sqlite.export$.build_kv_values(db);
var graph_export_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$3(logseq.db.sqlite.export$.remove_uuids_if_not_ref(graph_export,all_ref_uuids),new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185),logseq.db.sqlite.export$.sort_pages_and_blocks),new cljs.core.Keyword("logseq.db.sqlite.export","schema-version","logseq.db.sqlite.export/schema-version",641955265),logseq.db.frontend.schema.version);
var G__155411 = graph_export_SINGLEQUOTE_;
var G__155411__$1 = ((cljs.core.not(exclude_files_QMARK_))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155411,new cljs.core.Keyword("logseq.db.sqlite.export","graph-files","logseq.db.sqlite.export/graph-files",-1710476749),files):G__155411);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155411__$1,new cljs.core.Keyword("logseq.db.sqlite.export","kv-values","logseq.db.sqlite.export/kv-values",-658674363),kv_values);

});
logseq.db.sqlite.export$.find_undefined_classes_and_properties = (function logseq$db$sqlite$export$find_undefined_classes_and_properties(p__155416){
var map__155417 = p__155416;
var map__155417__$1 = cljs.core.__destructure_map(map__155417);
var classes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155417__$1,new cljs.core.Keyword(null,"classes","classes",2037804510));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155417__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var pages_and_blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155417__$1,new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185));
var referenced_classes = cljs.core.set(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.class$.logseq_class_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("build","property-classes","build/property-classes",1099271032),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.vals(properties)], 0)),cljs.core.keep.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("class","parent","class/parent",-917401011),cljs.core.vals(classes)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword(null,"page","page",849072397)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pages_and_blocks], 0)),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__155412_SHARP_){
return logseq.db.sqlite.build.extract_from_blocks(new cljs.core.Keyword(null,"blocks","blocks",-610462153).cljs$core$IFn$_invoke$arity$1(p1__155412_SHARP_),new cljs.core.Keyword("build","tags","build/tags",1814686611));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pages_and_blocks], 0))], 0))));
var undefined_classes = clojure.set.difference.cljs$core$IFn$_invoke$arity$2(referenced_classes,cljs.core.set(cljs.core.keys(classes)));
var referenced_properties = cljs.core.set(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.internal_property_QMARK_,cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("build","class-properties","build/class-properties",1278125544),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.vals(classes)], 0)),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.comp.cljs$core$IFn$_invoke$arity$3(cljs.core.keys,new cljs.core.Keyword("build","properties","build/properties",708607786),new cljs.core.Keyword(null,"page","page",849072397)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pages_and_blocks], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__155413_SHARP_){
return logseq.db.sqlite.build.extract_from_blocks(new cljs.core.Keyword(null,"blocks","blocks",-610462153).cljs$core$IFn$_invoke$arity$1(p1__155413_SHARP_),cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.keys,new cljs.core.Keyword("build","properties","build/properties",708607786)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pages_and_blocks], 0))], 0))));
var undefined_properties = clojure.set.difference.cljs$core$IFn$_invoke$arity$2(referenced_properties,cljs.core.set(cljs.core.keys(properties)));
var undefined = (function (){var G__155418 = cljs.core.PersistentArrayMap.EMPTY;
var G__155418__$1 = ((cljs.core.seq(undefined_classes))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155418,new cljs.core.Keyword(null,"classes","classes",2037804510),undefined_classes):G__155418);
if(cljs.core.seq(undefined_properties)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155418__$1,new cljs.core.Keyword(null,"properties","properties",685819552),undefined_properties);
} else {
return G__155418__$1;
}
})();
return undefined;
});
logseq.db.sqlite.export$.find_undefined_uuids = (function logseq$db$sqlite$export$find_undefined_uuids(p__155425){
var map__155426 = p__155425;
var map__155426__$1 = cljs.core.__destructure_map(map__155426);
var classes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155426__$1,new cljs.core.Keyword(null,"classes","classes",2037804510));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155426__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var pages_and_blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155426__$1,new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185));
var pvalue_known_uuids = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
var _ = clojure.walk.postwalk((function (f){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.map_QMARK_(f);
if(and__5000__auto__){
var and__5000__auto____$1 = new cljs.core.Keyword("build","property-value","build/property-value",1425188701).cljs$core$IFn$_invoke$arity$1(f);
if(cljs.core.truth_(and__5000__auto____$1)){
return new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(f);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(pvalue_known_uuids,cljs.core.conj,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(f));
} else {
return f;
}
}),pages_and_blocks);
var known_uuids = cljs.core.set(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.keep.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.vals(classes)),cljs.core.keep.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.vals(properties)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__155419_SHARP_){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(p1__155419_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"page","page",849072397),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null));
}),pages_and_blocks),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__155420_SHARP_){
return logseq.db.sqlite.build.extract_from_blocks(new cljs.core.Keyword(null,"blocks","blocks",-610462153).cljs$core$IFn$_invoke$arity$1(p1__155420_SHARP_),(function (m){
var G__155428 = m;
var G__155428__$1 = (((G__155428 == null))?null:new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(G__155428));
if((G__155428__$1 == null)){
return null;
} else {
return (new cljs.core.PersistentVector(null,1,(5),cljs.core.PersistentVector.EMPTY_NODE,[G__155428__$1],null));
}
}));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pages_and_blocks], 0)),cljs.core.deref(pvalue_known_uuids)], 0)));
var ref_uuids = cljs.core.set(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__155421_SHARP_){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,new cljs.core.Keyword("block","alias","block/alias",-2112644699).cljs$core$IFn$_invoke$arity$1(p1__155421_SHARP_));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.vals(classes)], 0)),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__155422_SHARP_){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,new cljs.core.Keyword("block","alias","block/alias",-2112644699).cljs$core$IFn$_invoke$arity$1(p1__155422_SHARP_));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.vals(properties)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__155423_SHARP_){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,new cljs.core.Keyword("block","alias","block/alias",-2112644699).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$1(p1__155423_SHARP_)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pages_and_blocks], 0)),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(logseq.db.sqlite.export$.get_pvalue_uuids,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.vals(classes)], 0)),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(logseq.db.sqlite.export$.get_pvalue_uuids,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.vals(properties)], 0)),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(logseq.db.sqlite.export$.get_pvalue_uuids,new cljs.core.Keyword(null,"page","page",849072397)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pages_and_blocks], 0)),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__155424_SHARP_){
return logseq.db.sqlite.build.extract_from_blocks(new cljs.core.Keyword(null,"blocks","blocks",-610462153).cljs$core$IFn$_invoke$arity$1(p1__155424_SHARP_),logseq.db.sqlite.export$.get_pvalue_uuids);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([pages_and_blocks], 0))], 0)));
return clojure.set.difference.cljs$core$IFn$_invoke$arity$2(ref_uuids,known_uuids);
});
/**
 * Removes keys from this ns for maps passed sqlite.build fns as they don't need to validate or use them
 */
logseq.db.sqlite.export$.remove_namespaced_keys = (function logseq$db$sqlite$export$remove_namespaced_keys(m){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__155430){
var vec__155431 = p__155430;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__155431,(0),null);
var _v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__155431,(1),null);
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("logseq.db.sqlite.export",cljs.core.namespace(k));
}),m));
});
/**
 * Fixes invalids keywords whose name start with a number e.g. :user.property/2ndsomething
 */
logseq.db.sqlite.export$.patch_invalid_keywords = (function logseq$db$sqlite$export$patch_invalid_keywords(m){
var initial_version = new cljs.core.Keyword("kv","value","kv/value",305981670).cljs$core$IFn$_invoke$arity$1(cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__155434_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.kv","graph-initial-schema-version","logseq.kv/graph-initial-schema-version",91284097),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p1__155434_SHARP_));
}),new cljs.core.Keyword("logseq.db.sqlite.export","kv-values","logseq.db.sqlite.export/kv-values",-658674363).cljs$core$IFn$_invoke$arity$1(m))));
if(cljs.core.truth_((function (){var G__155436 = initial_version;
var G__155436__$1 = (((G__155436 == null))?null:logseq.db.frontend.schema.compare_schema_version(G__155436,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"major","major",-27376078),(64),new cljs.core.Keyword(null,"minor","minor",-608536071),(8)], null)));
if((G__155436__$1 == null)){
return null;
} else {
return (G__155436__$1 > (0));
}
})())){
return m;
} else {
return clojure.walk.postwalk((function (e){
if(cljs.core.truth_((function (){var and__5000__auto__ = (e instanceof cljs.core.Keyword);
if(and__5000__auto__){
var G__155441 = cljs.core.namespace(e);
if((G__155441 == null)){
return null;
} else {
return clojure.string.starts_with_QMARK_(G__155441,"user.");
}
} else {
return and__5000__auto__;
}
})())){
var sanitized_kw = cljs.core.keyword.cljs$core$IFn$_invoke$arity$2(cljs.core.namespace(e),cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__155435_SHARP_){
return cljs.core.re_find(/[0-9a-zA-Z*+!_'?<>=-]{1}/,p1__155435_SHARP_);
}),clojure.string.replace_first(cljs.core.name(e),/^(\d)/,"NUM-$1"))));
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(sanitized_kw,e)){
return sanitized_kw;
} else {
return e;
}
} else {
return e;
}
}),m);
}
});
/**
 * Checks that export map is usable by sqlite.build including checking that
 * all referenced properties and classes are defined. Checks related to properties and
 * classes are disabled when :exclude-namespaces is set because those checks can't be done
 */
logseq.db.sqlite.export$.ensure_export_is_valid = (function logseq$db$sqlite$export$ensure_export_is_valid(export_map_STAR_,p__155443){
var map__155444 = p__155443;
var map__155444__$1 = cljs.core.__destructure_map(map__155444);
var graph_options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155444__$1,new cljs.core.Keyword(null,"graph-options","graph-options",1082521635));
var export_map = logseq.db.sqlite.export$.remove_namespaced_keys(export_map_STAR_);
if(cljs.core.seq(new cljs.core.Keyword(null,"exclude-namespaces","exclude-namespaces",-1345442365).cljs$core$IFn$_invoke$arity$1(graph_options))){
} else {
logseq.db.sqlite.build.validate_options(export_map);
}

var undefined_uuids = logseq.db.sqlite.export$.find_undefined_uuids(export_map);
var undefined = (function (){var G__155449 = cljs.core.PersistentArrayMap.EMPTY;
var G__155449__$1 = ((cljs.core.empty_QMARK_(new cljs.core.Keyword(null,"exclude-namespaces","exclude-namespaces",-1345442365).cljs$core$IFn$_invoke$arity$1(graph_options)))?cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__155449,logseq.db.sqlite.export$.find_undefined_classes_and_properties(export_map)], 0)):G__155449);
if(cljs.core.seq(undefined_uuids)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155449__$1,new cljs.core.Keyword(null,"uuids","uuids",1487183590),undefined_uuids);
} else {
return G__155449__$1;
}
})();
if(cljs.core.seq(undefined)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["The following classes, uuids and properties are not defined: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([undefined], 0))].join(''),undefined);
} else {
return null;
}
});
/**
 * Handles exporting db by given export-type
 */
logseq.db.sqlite.export$.build_export = (function logseq$db$sqlite$export$build_export(db,p__155450){
var map__155451 = p__155450;
var map__155451__$1 = cljs.core.__destructure_map(map__155451);
var options = map__155451__$1;
var export_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155451__$1,new cljs.core.Keyword(null,"export-type","export-type",-2087639167));
var export_map_STAR_ = (function (){var G__155452 = export_type;
var G__155452__$1 = (((G__155452 instanceof cljs.core.Keyword))?G__155452.fqn:null);
switch (G__155452__$1) {
case "block":
return logseq.db.sqlite.export$.build_block_export(db,new cljs.core.Keyword(null,"block-id","block-id",-70582834).cljs$core$IFn$_invoke$arity$1(options));

break;
case "page":
return logseq.db.sqlite.export$.build_page_export(db,new cljs.core.Keyword(null,"page-id","page-id",-872941168).cljs$core$IFn$_invoke$arity$1(options));

break;
case "view-nodes":
return logseq.db.sqlite.export$.build_view_nodes_export(db,new cljs.core.Keyword(null,"node-ids","node-ids",2015830052).cljs$core$IFn$_invoke$arity$1(options));

break;
case "selected-nodes":
return logseq.db.sqlite.export$.build_selected_nodes_export(db,new cljs.core.Keyword(null,"node-ids","node-ids",2015830052).cljs$core$IFn$_invoke$arity$1(options));

break;
case "graph-ontology":
return logseq.db.sqlite.export$.build_graph_ontology_export(db,cljs.core.PersistentArrayMap.EMPTY);

break;
case "graph":
return logseq.db.sqlite.export$.build_graph_export(db,new cljs.core.Keyword(null,"graph-options","graph-options",1082521635).cljs$core$IFn$_invoke$arity$1(options));

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__155452__$1)].join('')));

}
})();
var export_map = logseq.db.sqlite.export$.patch_invalid_keywords(export_map_STAR_);
if(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(options,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"graph-options","graph-options",1082521635),new cljs.core.Keyword(null,"catch-validation-errors?","catch-validation-errors?",-557303845)], null)))){
try{logseq.db.sqlite.export$.ensure_export_is_valid(export_map,options);
}catch (e155453){if((e155453 instanceof cljs.core.ExceptionInfo)){
var e_155556 = e155453;
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Caught error:",e_155556], 0));
} else {
throw e155453;

}
}} else {
logseq.db.sqlite.export$.ensure_export_is_valid(export_map,options);
}

return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(export_map,new cljs.core.Keyword("logseq.db.sqlite.export","export-type","logseq.db.sqlite.export/export-type",796276698),export_type);
});
logseq.db.sqlite.export$.add_uuid_to_page_if_exists = (function logseq$db$sqlite$export$add_uuid_to_page_if_exists(db,import_to_existing_page_uuids,p__155454,m){
var map__155455 = p__155454;
var map__155455__$1 = cljs.core.__destructure_map(map__155455);
var existing_pages_keep_properties_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155455__$1,new cljs.core.Keyword(null,"existing-pages-keep-properties?","existing-pages-keep-properties?",1888231509));
var temp__5802__auto__ = (cljs.core.truth_(new cljs.core.Keyword("build","journal","build/journal",1781180096).cljs$core$IFn$_invoke$arity$1(m))?(function (){var G__155456 = new cljs.core.Keyword("build","journal","build/journal",1781180096).cljs$core$IFn$_invoke$arity$1(m);
var G__155456__$1 = (((G__155456 == null))?null:datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366),G__155456));
var G__155456__$2 = (((G__155456__$1 == null))?null:cljs.core.first(G__155456__$1));
var G__155456__$3 = (((G__155456__$2 == null))?null:new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(G__155456__$2));
if((G__155456__$3 == null)){
return null;
} else {
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,G__155456__$3) : datascript.core.entity.call(null,db,G__155456__$3));
}
})():(function (){var G__155465 = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(m);
if((G__155465 == null)){
return null;
} else {
return logseq.db.get_case_page(db,G__155465);
}
})());
if(cljs.core.truth_(temp__5802__auto__)){
var ent = temp__5802__auto__;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(import_to_existing_page_uuids,cljs.core.assoc,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(m),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(ent));

var G__155466 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(ent));
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("build","properties","build/properties",708607786).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(and__5000__auto__)){
return existing_pages_keep_properties_QMARK_;
} else {
return and__5000__auto__;
}
})())){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__155466,new cljs.core.Keyword("build","properties","build/properties",708607786),(function (props){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__155467){
var vec__155468 = p__155467;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__155468,(0),null);
var _v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__155468,(1),null);
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(ent,k);
}),props));
}));
} else {
return G__155466;
}
} else {
return m;
}
});
/**
 * Updates existing properties by ident. Also check imported and existing properties have
 * the same cardinality and type to avoid failure after import
 */
logseq.db.sqlite.export$.update_existing_properties = (function logseq$db$sqlite$export$update_existing_properties(db,property_conflicts,properties){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__155471){
var vec__155472 = p__155471;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__155472,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__155472,(1),null);
var temp__5802__auto__ = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,k) : datascript.core.entity.call(null,db,k));
if(cljs.core.truth_(temp__5802__auto__)){
var ent = temp__5802__auto__;
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.select_keys(ent,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659)], null)),cljs.core.select_keys(v,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659)], null)))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(property_conflicts,cljs.core.conj,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"property-id","property-id",404996975),k,new cljs.core.Keyword(null,"actual","actual",107306363),cljs.core.select_keys(v,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659)], null)),new cljs.core.Keyword(null,"expected","expected",1583670997),cljs.core.select_keys(ent,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659)], null))], null));
} else {
}

return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(v,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(ent))], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v], null);
}
}),properties));
});
/**
 * Checks export map for existing entities and adds :block/uuid to them if they exist in graph to import.
 * Also checks for property conflicts between existing properties and properties to be imported
 */
logseq.db.sqlite.export$.check_for_existing_entities = (function logseq$db$sqlite$export$check_for_existing_entities(db,p__155479,property_conflicts){
var map__155480 = p__155479;
var map__155480__$1 = cljs.core.__destructure_map(map__155480);
var export_map = map__155480__$1;
var pages_and_blocks = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155480__$1,new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185));
var classes = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155480__$1,new cljs.core.Keyword(null,"classes","classes",2037804510));
var properties = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155480__$1,new cljs.core.Keyword(null,"properties","properties",685819552));
var export_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155480__$1,new cljs.core.Keyword("logseq.db.sqlite.export","export-type","logseq.db.sqlite.export/export-type",796276698));
var import_options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155480__$1,new cljs.core.Keyword("logseq.db.sqlite.export","import-options","logseq.db.sqlite.export/import-options",-685976386));
var import_to_existing_page_uuids = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var export_map__$1 = (function (){var G__155481 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"build-existing-tx?","build-existing-tx?",-2032344658),true,new cljs.core.Keyword(null,"extract-content-refs?","extract-content-refs?",-1224729418),false], null);
var G__155481__$1 = ((cljs.core.seq(pages_and_blocks))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155481,new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185),cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (m){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"page","page",849072397),cljs.core.partial.cljs$core$IFn$_invoke$arity$4(logseq.db.sqlite.export$.add_uuid_to_page_if_exists,db,import_to_existing_page_uuids,import_options));
}),pages_and_blocks)):G__155481);
var G__155481__$2 = ((cljs.core.seq(classes))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155481__$1,new cljs.core.Keyword(null,"classes","classes",2037804510),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__155486){
var vec__155487 = p__155486;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__155487,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__155487,(1),null);
var temp__5802__auto__ = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,k) : datascript.core.entity.call(null,db,k));
if(cljs.core.truth_(temp__5802__auto__)){
var ent = temp__5802__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(v,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(ent))], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [k,v], null);
}
}),classes))):G__155481__$1);
var G__155481__$3 = ((cljs.core.seq(properties))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155481__$2,new cljs.core.Keyword(null,"properties","properties",685819552),logseq.db.sqlite.export$.update_existing_properties(db,property_conflicts,properties)):G__155481__$2);
var G__155481__$4 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"graph","graph",1558099509),export_type))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__155481__$3,new cljs.core.Keyword(null,"translate-property-values?","translate-property-values?",-1950851544),false):G__155481__$3);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"graph","graph",1558099509),export_type)){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([G__155481__$4,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(export_map,new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"classes","classes",2037804510),new cljs.core.Keyword(null,"properties","properties",685819552)], 0))], 0));
} else {
return G__155481__$4;
}
})();
var export_map_SINGLEQUOTE_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"graph","graph",1558099509),export_type))?export_map__$1:clojure.walk.postwalk((function (f){
if(((cljs.core.vector_QMARK_(f)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("build","page","build/page",822051483),cljs.core.first(f))))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("build","page","build/page",822051483),logseq.db.sqlite.export$.add_uuid_to_page_if_exists(db,import_to_existing_page_uuids,import_options,cljs.core.second(f))], null);
} else {
return f;
}
}),export_map__$1));
var export_map_SINGLEQUOTE__SINGLEQUOTE_ = clojure.walk.postwalk((function (f){
var temp__5802__auto__ = (function (){var and__5000__auto__ = cljs.core.vector_QMARK_(f);
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first(f));
if(and__5000__auto____$1){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(import_to_existing_page_uuids),cljs.core.second(f));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var new_uuid = temp__5802__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new_uuid], null);
} else {
return f;
}
}),export_map_SINGLEQUOTE_);
return export_map_SINGLEQUOTE__SINGLEQUOTE_;
});
/**
 * Builds options for sqlite-build to import into current-block
 */
logseq.db.sqlite.export$.build_block_import_options = (function logseq$db$sqlite$export$build_block_import_options(current_block,export_map){
var block = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("logseq.db.sqlite.export","block","logseq.db.sqlite.export/block",469582025).cljs$core$IFn$_invoke$arity$1(export_map),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(current_block),new cljs.core.Keyword("block","page","block/page",822314108),cljs.core.select_keys(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(current_block),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null))], null)], 0));
var pages_and_blocks = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"page","page",849072397),cljs.core.select_keys(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null)),new cljs.core.Keyword(null,"blocks","blocks",-610462153),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword("block","page","block/page",822314108))], null)], null)], null);
return logseq.db.sqlite.export$.merge_export_maps.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([export_map,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"pages-and-blocks","pages-and-blocks",-214876185),pages_and_blocks], null)], 0));
});
/**
 * Given an entity's export map, build the import tx to create it. In addition to standard sqlite.build keys,
 * an export map can have the following namespaced keys:
 * * ::export-type - Keyword indicating export type
 * * ::block - Block map for a :block export
 * * ::graph-files - Vec of files for a :graph export
 * * ::kv-values - Vec of :kv/value maps for a :graph export
 * * ::auto-include-namespaces - A set of parent namespaces to include from properties and classes
 *   for a :graph export. See :exclude-namespaces in build-graph-export for a similar option
 * * ::import-options - A map of options that alters importing behavior. Has the following keys:
 *   * :existing-pages-keep-properties? - Boolean which disables upsert of :build/properties on
 * 
 * This fn then returns a map of txs to transact with the following keys:
 * * :init-tx - Txs that must be transacted first, usually because they define new properties
 * * :block-props-tx - Txs to transact after :init-tx, usually because they use newly defined properties
 * * :misc-tx - Txs to transact unrelated to other txs
 */
logseq.db.sqlite.export$.build_import = (function logseq$db$sqlite$export$build_import(export_map_STAR_,db,p__155494){
var map__155495 = p__155494;
var map__155495__$1 = cljs.core.__destructure_map(map__155495);
var current_block = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__155495__$1,new cljs.core.Keyword(null,"current-block","current-block",1027687970));
var export_map = (cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("logseq.db.sqlite.export","block","logseq.db.sqlite.export/block",469582025).cljs$core$IFn$_invoke$arity$1(export_map_STAR_);
if(cljs.core.truth_(and__5000__auto__)){
return current_block;
} else {
return and__5000__auto__;
}
})())?logseq.db.sqlite.export$.build_block_import_options(current_block,export_map_STAR_):export_map_STAR_);
var export_map_SINGLEQUOTE_ = ((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"graph","graph",1558099509),new cljs.core.Keyword("logseq.db.sqlite.export","export-type","logseq.db.sqlite.export/export-type",796276698).cljs$core$IFn$_invoke$arity$1(export_map_STAR_))) && (cljs.core.seq(new cljs.core.Keyword("logseq.db.sqlite.export","auto-include-namespaces","logseq.db.sqlite.export/auto-include-namespaces",394890806).cljs$core$IFn$_invoke$arity$1(export_map_STAR_)))))?cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(export_map,new cljs.core.Keyword(null,"properties","properties",685819552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("logseq.db.sqlite.export","auto-include-namespaces","logseq.db.sqlite.export/auto-include-namespaces",394890806)], 0)),logseq.db.sqlite.export$.add_ontology_for_include_namespaces(db,export_map)], 0)):export_map);
var property_conflicts = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
var export_map_SINGLEQUOTE__SINGLEQUOTE_ = logseq.db.sqlite.export$.check_for_existing_entities(db,export_map_SINGLEQUOTE_,property_conflicts);
if(cljs.core.seq(cljs.core.deref(property_conflicts))){
console.error(new cljs.core.Keyword(null,"property-conflicts","property-conflicts",810341766),cljs.core.deref(property_conflicts));

return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),["The following imported properties conflict with the current graph: ",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"property-id","property-id",404996975),cljs.core.deref(property_conflicts))], 0))].join('')], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"graph","graph",1558099509),new cljs.core.Keyword("logseq.db.sqlite.export","export-type","logseq.db.sqlite.export/export-type",796276698).cljs$core$IFn$_invoke$arity$1(export_map_SINGLEQUOTE__SINGLEQUOTE_))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(logseq.db.sqlite.build.build_blocks_tx(logseq.db.sqlite.export$.remove_namespaced_keys(export_map_SINGLEQUOTE__SINGLEQUOTE_)),new cljs.core.Keyword(null,"misc-tx","misc-tx",-622781628),cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.db.sqlite.export","graph-files","logseq.db.sqlite.export/graph-files",-1710476749).cljs$core$IFn$_invoke$arity$1(export_map_SINGLEQUOTE__SINGLEQUOTE_),new cljs.core.Keyword("logseq.db.sqlite.export","kv-values","logseq.db.sqlite.export/kv-values",-658674363).cljs$core$IFn$_invoke$arity$1(export_map_SINGLEQUOTE__SINGLEQUOTE_))));
} else {
return logseq.db.sqlite.build.build_blocks_tx(logseq.db.sqlite.export$.remove_namespaced_keys(export_map_SINGLEQUOTE__SINGLEQUOTE_));
}
}
});

//# sourceMappingURL=logseq.db.sqlite.export.js.map
