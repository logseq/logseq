goog.provide('logseq.db.frontend.validate');
logseq.db.frontend.validate.db_schema_validator = malli.core.validator.cljs$core$IFn$_invoke$arity$1(logseq.db.frontend.malli_schema.DB);
logseq.db.frontend.validate.db_schema_explainer = malli.core.explainer.cljs$core$IFn$_invoke$arity$1(logseq.db.frontend.malli_schema.DB);
logseq.db.frontend.validate.closed_db_schema_validator = malli.core.validator.cljs$core$IFn$_invoke$arity$1(malli.util.closed_schema.cljs$core$IFn$_invoke$arity$1(logseq.db.frontend.malli_schema.DB));
logseq.db.frontend.validate.closed_db_schema_explainer = malli.core.explainer.cljs$core$IFn$_invoke$arity$1(malli.util.closed_schema.cljs$core$IFn$_invoke$arity$1(logseq.db.frontend.malli_schema.DB));
logseq.db.frontend.validate.get_schema_validator = (function logseq$db$frontend$validate$get_schema_validator(closed_schema_QMARK_){
if(cljs.core.truth_(closed_schema_QMARK_)){
return logseq.db.frontend.validate.closed_db_schema_validator;
} else {
return logseq.db.frontend.validate.db_schema_validator;
}
});
logseq.db.frontend.validate.get_schema_explainer = (function logseq$db$frontend$validate$get_schema_explainer(closed_schema_QMARK_){
if(cljs.core.truth_(closed_schema_QMARK_)){
return logseq.db.frontend.validate.closed_db_schema_explainer;
} else {
return logseq.db.frontend.validate.db_schema_explainer;
}
});
/**
 * Validates the datascript tx-report for entities that have changed. Returns
 *   boolean indicating if db is valid
 */
logseq.db.frontend.validate.validate_tx_report_BANG_ = (function logseq$db$frontend$validate$validate_tx_report_BANG_(p__130502,validate_options){
var map__130506 = p__130502;
var map__130506__$1 = cljs.core.__destructure_map(map__130506);
var db_after = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130506__$1,new cljs.core.Keyword(null,"db-after","db-after",-571884666));
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130506__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130506__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
var changed_ids = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.keep.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),tx_data));
var tx_datoms = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__130497_SHARP_){
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db_after,new cljs.core.Keyword(null,"eavt","eavt",-666437073),p1__130497_SHARP_);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([changed_ids], 0));
var ent_maps_STAR_ = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__130509){
var vec__130511 = p__130509;
var db_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130511,(0),null);
var m = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130511,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword("db","id","db/id",-1388397098),db_id);
}),logseq.db.frontend.malli_schema.datoms__GT_entity_maps.cljs$core$IFn$_invoke$arity$variadic(tx_datoms,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"entity-fn","entity-fn",-432404580),(function (p1__130498_SHARP_){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db_after,p1__130498_SHARP_) : datascript.core.entity.call(null,db_after,p1__130498_SHARP_));
})], null)], 0)));
var ent_maps = logseq.db.frontend.malli_schema.update_properties_in_ents(db_after,ent_maps_STAR_);
var validator = logseq.db.frontend.validate.get_schema_validator(new cljs.core.Keyword(null,"closed-schema?","closed-schema?",264902537).cljs$core$IFn$_invoke$arity$1(validate_options));
var _STAR_db_for_validate_fns_STAR__orig_val__130515 = logseq.db.frontend.malli_schema._STAR_db_for_validate_fns_STAR_;
var _STAR_db_for_validate_fns_STAR__temp_val__130516 = db_after;
(logseq.db.frontend.malli_schema._STAR_db_for_validate_fns_STAR_ = _STAR_db_for_validate_fns_STAR__temp_val__130516);

try{var invalid_ent_maps = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__130499_SHARP_){
var G__130517 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__130499_SHARP_,new cljs.core.Keyword("db","id","db/id",-1388397098))], null);
return (validator.cljs$core$IFn$_invoke$arity$1 ? validator.cljs$core$IFn$_invoke$arity$1(G__130517) : validator.call(null,G__130517));
}),ent_maps);
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["changed eids:",changed_ids,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),tx_meta], 0));

if(cljs.core.seq(invalid_ent_maps)){
var explainer = logseq.db.frontend.validate.get_schema_explainer(new cljs.core.Keyword(null,"closed-schema?","closed-schema?",264902537).cljs$core$IFn$_invoke$arity$1(validate_options));
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Invalid datascript entities detected amongst changed entity ids:",changed_ids], 0));

var seq__130518_130661 = cljs.core.seq(invalid_ent_maps);
var chunk__130519_130662 = null;
var count__130520_130663 = (0);
var i__130521_130664 = (0);
while(true){
if((i__130521_130664 < count__130520_130663)){
var m_130665 = chunk__130519_130662.cljs$core$IIndexed$_nth$arity$2(null,i__130521_130664);
var m_SINGLEQUOTE__130667 = cljs.core.update.cljs$core$IFn$_invoke$arity$3(m_130665,new cljs.core.Keyword("block","properties","block/properties",708347145),((function (seq__130518_130661,chunk__130519_130662,count__130520_130663,i__130521_130664,m_130665,explainer,invalid_ent_maps,_STAR_db_for_validate_fns_STAR__orig_val__130515,_STAR_db_for_validate_fns_STAR__temp_val__130516,changed_ids,tx_datoms,ent_maps_STAR_,ent_maps,validator,map__130506,map__130506__$1,db_after,tx_data,tx_meta){
return (function (properties){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (seq__130518_130661,chunk__130519_130662,count__130520_130663,i__130521_130664,m_130665,explainer,invalid_ent_maps,_STAR_db_for_validate_fns_STAR__orig_val__130515,_STAR_db_for_validate_fns_STAR__temp_val__130516,changed_ids,tx_datoms,ent_maps_STAR_,ent_maps,validator,map__130506,map__130506__$1,db_after,tx_data,tx_meta){
return (function (p__130555){
var vec__130556 = p__130555;
var p = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130556,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130556,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p),v], null);
});})(seq__130518_130661,chunk__130519_130662,count__130520_130663,i__130521_130664,m_130665,explainer,invalid_ent_maps,_STAR_db_for_validate_fns_STAR__orig_val__130515,_STAR_db_for_validate_fns_STAR__temp_val__130516,changed_ids,tx_datoms,ent_maps_STAR_,ent_maps,validator,map__130506,map__130506__$1,db_after,tx_data,tx_meta))
,properties);
});})(seq__130518_130661,chunk__130519_130662,count__130520_130663,i__130521_130664,m_130665,explainer,invalid_ent_maps,_STAR_db_for_validate_fns_STAR__orig_val__130515,_STAR_db_for_validate_fns_STAR__temp_val__130516,changed_ids,tx_datoms,ent_maps_STAR_,ent_maps,validator,map__130506,map__130506__$1,db_after,tx_data,tx_meta))
);
var data_130668 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"entity-map","entity-map",238028540),m_SINGLEQUOTE__130667,new cljs.core.Keyword(null,"errors","errors",-908790718),malli.error.humanize.cljs$core$IFn$_invoke$arity$1((function (){var G__130563 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(m_130665,new cljs.core.Keyword("db","id","db/id",-1388397098))], null);
return (explainer.cljs$core$IFn$_invoke$arity$1 ? explainer.cljs$core$IFn$_invoke$arity$1(G__130563) : explainer.call(null,G__130563));
})())], null);
try{cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(data_130668);
}catch (e130564){var _e_130683 = e130564;
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([data_130668], 0));
}

var G__130684 = seq__130518_130661;
var G__130685 = chunk__130519_130662;
var G__130686 = count__130520_130663;
var G__130687 = (i__130521_130664 + (1));
seq__130518_130661 = G__130684;
chunk__130519_130662 = G__130685;
count__130520_130663 = G__130686;
i__130521_130664 = G__130687;
continue;
} else {
var temp__5804__auto___130689 = cljs.core.seq(seq__130518_130661);
if(temp__5804__auto___130689){
var seq__130518_130692__$1 = temp__5804__auto___130689;
if(cljs.core.chunked_seq_QMARK_(seq__130518_130692__$1)){
var c__5525__auto___130693 = cljs.core.chunk_first(seq__130518_130692__$1);
var G__130694 = cljs.core.chunk_rest(seq__130518_130692__$1);
var G__130695 = c__5525__auto___130693;
var G__130696 = cljs.core.count(c__5525__auto___130693);
var G__130697 = (0);
seq__130518_130661 = G__130694;
chunk__130519_130662 = G__130695;
count__130520_130663 = G__130696;
i__130521_130664 = G__130697;
continue;
} else {
var m_130698 = cljs.core.first(seq__130518_130692__$1);
var m_SINGLEQUOTE__130699 = cljs.core.update.cljs$core$IFn$_invoke$arity$3(m_130698,new cljs.core.Keyword("block","properties","block/properties",708347145),((function (seq__130518_130661,chunk__130519_130662,count__130520_130663,i__130521_130664,m_130698,seq__130518_130692__$1,temp__5804__auto___130689,explainer,invalid_ent_maps,_STAR_db_for_validate_fns_STAR__orig_val__130515,_STAR_db_for_validate_fns_STAR__temp_val__130516,changed_ids,tx_datoms,ent_maps_STAR_,ent_maps,validator,map__130506,map__130506__$1,db_after,tx_data,tx_meta){
return (function (properties){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (seq__130518_130661,chunk__130519_130662,count__130520_130663,i__130521_130664,m_130698,seq__130518_130692__$1,temp__5804__auto___130689,explainer,invalid_ent_maps,_STAR_db_for_validate_fns_STAR__orig_val__130515,_STAR_db_for_validate_fns_STAR__temp_val__130516,changed_ids,tx_datoms,ent_maps_STAR_,ent_maps,validator,map__130506,map__130506__$1,db_after,tx_data,tx_meta){
return (function (p__130571){
var vec__130572 = p__130571;
var p = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130572,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130572,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p),v], null);
});})(seq__130518_130661,chunk__130519_130662,count__130520_130663,i__130521_130664,m_130698,seq__130518_130692__$1,temp__5804__auto___130689,explainer,invalid_ent_maps,_STAR_db_for_validate_fns_STAR__orig_val__130515,_STAR_db_for_validate_fns_STAR__temp_val__130516,changed_ids,tx_datoms,ent_maps_STAR_,ent_maps,validator,map__130506,map__130506__$1,db_after,tx_data,tx_meta))
,properties);
});})(seq__130518_130661,chunk__130519_130662,count__130520_130663,i__130521_130664,m_130698,seq__130518_130692__$1,temp__5804__auto___130689,explainer,invalid_ent_maps,_STAR_db_for_validate_fns_STAR__orig_val__130515,_STAR_db_for_validate_fns_STAR__temp_val__130516,changed_ids,tx_datoms,ent_maps_STAR_,ent_maps,validator,map__130506,map__130506__$1,db_after,tx_data,tx_meta))
);
var data_130700 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"entity-map","entity-map",238028540),m_SINGLEQUOTE__130699,new cljs.core.Keyword(null,"errors","errors",-908790718),malli.error.humanize.cljs$core$IFn$_invoke$arity$1((function (){var G__130575 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(m_130698,new cljs.core.Keyword("db","id","db/id",-1388397098))], null);
return (explainer.cljs$core$IFn$_invoke$arity$1 ? explainer.cljs$core$IFn$_invoke$arity$1(G__130575) : explainer.call(null,G__130575));
})())], null);
try{cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(data_130700);
}catch (e130576){var _e_130709 = e130576;
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([data_130700], 0));
}

var G__130710 = cljs.core.next(seq__130518_130692__$1);
var G__130711 = null;
var G__130712 = (0);
var G__130713 = (0);
seq__130518_130661 = G__130710;
chunk__130519_130662 = G__130711;
count__130520_130663 = G__130712;
i__130521_130664 = G__130713;
continue;
}
} else {
}
}
break;
}

return false;
} else {
return true;
}
}finally {(logseq.db.frontend.malli_schema._STAR_db_for_validate_fns_STAR_ = _STAR_db_for_validate_fns_STAR__orig_val__130515);
}});
/**
 * Groups malli errors by entities. db is used for providing more debugging info
 */
logseq.db.frontend.validate.group_errors_by_entity = (function logseq$db$frontend$validate$group_errors_by_entity(db,ent_maps,errors){
if(cljs.core.vector_QMARK_(ent_maps)){
} else {
throw (new Error(["Assert failed: ","Must be a vec for grouping to work","\n","(vector? ent-maps)"].join('')));
}

return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__130588){
var vec__130589 = p__130588;
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130589,(0),null);
var errors_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130589,(1),null);
var ent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(ent_maps,idx);
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"entity","entity",-450970276),(function (){var G__130592 = ent;
if(cljs.core.truth_(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(ent))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__130592,new cljs.core.Keyword("block","page","block/page",822314108),(function (id){
return cljs.core.select_keys((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id)),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","created-at","block/created-at",1440015)], null));
}));
} else {
return G__130592;
}
})(),new cljs.core.Keyword(null,"dispatch-key","dispatch-key",733619510),logseq.db.frontend.malli_schema.entity_dispatch_key(db,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(ent,new cljs.core.Keyword("db","id","db/id",-1388397098))),new cljs.core.Keyword(null,"errors","errors",-908790718),errors_SINGLEQUOTE_,new cljs.core.Keyword(null,"errors-by-type","errors-by-type",-1354313037),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__130597){
var vec__130598 = p__130597;
var type_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130598,(0),null);
var type_errors = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130598,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [type_SINGLEQUOTE_,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"in-value-distinct","in-value-distinct",1648763303),cljs.core.vec(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__130579_SHARP_){
return cljs.core.select_keys(p1__130579_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Keyword(null,"value","value",305978217)], null));
}),type_errors))),new cljs.core.Keyword(null,"schema-distinct","schema-distinct",-304530559),cljs.core.vec(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(malli.core.form,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"schema","schema",-1582001791),type_errors))))], null)], null);
}),cljs.core.group_by(new cljs.core.Keyword(null,"type","type",1174270348),errors_SINGLEQUOTE_)))], null);
}),cljs.core.group_by((function (p1__130578_SHARP_){
return cljs.core.first(new cljs.core.Keyword(null,"in","in",-1531184865).cljs$core$IFn$_invoke$arity$1(p1__130578_SHARP_));
}),errors));
});
/**
 * Validates all the entities of the given db using :eavt datoms. Returns a map
 *   with info about db being validated. If there are errors, they are placed on
 *   :errors and grouped by entity
 */
logseq.db.frontend.validate.validate_db_BANG_ = (function logseq$db$frontend$validate$validate_db_BANG_(db){
var datoms = datascript.core.datoms.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073));
var ent_maps_STAR_ = logseq.db.frontend.malli_schema.datoms__GT_entities(datoms);
var ent_maps = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__130606_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(p1__130606_SHARP_,new cljs.core.Keyword("block.temp","fully-loaded?","block.temp/fully-loaded?",-116637365),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block.temp","has-children?","block.temp/has-children?",935519725)], 0));
}),logseq.db.frontend.malli_schema.update_properties_in_ents(db,ent_maps_STAR_));
var errors = (function (){var _STAR_db_for_validate_fns_STAR__orig_val__130617 = logseq.db.frontend.malli_schema._STAR_db_for_validate_fns_STAR_;
var _STAR_db_for_validate_fns_STAR__temp_val__130618 = db;
(logseq.db.frontend.malli_schema._STAR_db_for_validate_fns_STAR_ = _STAR_db_for_validate_fns_STAR__temp_val__130618);

try{return new cljs.core.Keyword(null,"errors","errors",-908790718).cljs$core$IFn$_invoke$arity$1((function (){var G__130619 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (e){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(e,new cljs.core.Keyword("db","id","db/id",-1388397098));
}),ent_maps);
return (logseq.db.frontend.validate.closed_db_schema_explainer.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.validate.closed_db_schema_explainer.cljs$core$IFn$_invoke$arity$1(G__130619) : logseq.db.frontend.validate.closed_db_schema_explainer.call(null,G__130619));
})());
}finally {(logseq.db.frontend.malli_schema._STAR_db_for_validate_fns_STAR_ = _STAR_db_for_validate_fns_STAR__orig_val__130617);
}})();
var G__130625 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"datom-count","datom-count",515794351),cljs.core.count(datoms),new cljs.core.Keyword(null,"entities","entities",1940967403),ent_maps_STAR_], null);
if((!((errors == null)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__130625,new cljs.core.Keyword(null,"errors","errors",-908790718),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__130608_SHARP_){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__130608_SHARP_,new cljs.core.Keyword(null,"errors-by-type","errors-by-type",-1354313037)),new cljs.core.Keyword(null,"errors","errors",-908790718),(function (errs){
return malli.error.humanize.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"errors","errors",-908790718),errs], null));
}));
}),logseq.db.frontend.validate.group_errors_by_entity(db,ent_maps,errors)));
} else {
return G__130625;
}
});
/**
 * Calculates graph-wide counts given a graph's db and its entities from :eavt datoms
 */
logseq.db.frontend.validate.graph_counts = (function logseq$db$frontend$validate$graph_counts(db,entities){
var classes_count = cljs.core.count(datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083)));
var properties_count = cljs.core.count(datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048)));
return new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"entities","entities",1940967403),cljs.core.count(entities),new cljs.core.Keyword(null,"pages","pages",-285406513),cljs.core.count(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316),entities)),new cljs.core.Keyword(null,"blocks","blocks",-610462153),cljs.core.count(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","parent","block/parent",-918309064),entities)),new cljs.core.Keyword(null,"classes","classes",2037804510),classes_count,new cljs.core.Keyword(null,"properties","properties",685819552),properties_count,new cljs.core.Keyword(null,"objects","objects",2099713734),((cljs.core.count(datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340))) - classes_count) - properties_count),new cljs.core.Keyword(null,"property-pairs","property-pairs",1375546878),cljs.core.count(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__130629_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.properties(p1__130629_SHARP_),new cljs.core.Keyword("block","tags","block/tags",1814948340));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([entities], 0)))], null);
});

//# sourceMappingURL=logseq.db.frontend.validate.js.map
