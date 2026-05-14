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
logseq.db.frontend.validate.validate_tx_report_BANG_ = (function logseq$db$frontend$validate$validate_tx_report_BANG_(p__154683,validate_options){
var map__154684 = p__154683;
var map__154684__$1 = cljs.core.__destructure_map(map__154684);
var db_after = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__154684__$1,new cljs.core.Keyword(null,"db-after","db-after",-571884666));
var tx_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__154684__$1,new cljs.core.Keyword(null,"tx-data","tx-data",934159761));
var tx_meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__154684__$1,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194));
var changed_ids = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.keep.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),tx_data));
var tx_datoms = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__154675_SHARP_){
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db_after,new cljs.core.Keyword(null,"eavt","eavt",-666437073),p1__154675_SHARP_);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([changed_ids], 0));
var ent_maps_STAR_ = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__154685){
var vec__154688 = p__154685;
var db_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154688,(0),null);
var m = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154688,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword("db","id","db/id",-1388397098),db_id);
}),logseq.db.frontend.malli_schema.datoms__GT_entity_maps.cljs$core$IFn$_invoke$arity$variadic(tx_datoms,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"entity-fn","entity-fn",-432404580),(function (p1__154676_SHARP_){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db_after,p1__154676_SHARP_) : datascript.core.entity.call(null,db_after,p1__154676_SHARP_));
})], null)], 0)));
var ent_maps = logseq.db.frontend.malli_schema.update_properties_in_ents(db_after,ent_maps_STAR_);
var validator = logseq.db.frontend.validate.get_schema_validator(new cljs.core.Keyword(null,"closed-schema?","closed-schema?",264902537).cljs$core$IFn$_invoke$arity$1(validate_options));
var _STAR_db_for_validate_fns_STAR__orig_val__154691 = logseq.db.frontend.malli_schema._STAR_db_for_validate_fns_STAR_;
var _STAR_db_for_validate_fns_STAR__temp_val__154692 = db_after;
(logseq.db.frontend.malli_schema._STAR_db_for_validate_fns_STAR_ = _STAR_db_for_validate_fns_STAR__temp_val__154692);

try{var invalid_ent_maps = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__154679_SHARP_){
var G__154693 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__154679_SHARP_,new cljs.core.Keyword("db","id","db/id",-1388397098))], null);
return (validator.cljs$core$IFn$_invoke$arity$1 ? validator.cljs$core$IFn$_invoke$arity$1(G__154693) : validator.call(null,G__154693));
}),ent_maps);
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["changed eids:",changed_ids,new cljs.core.Keyword(null,"tx-meta","tx-meta",1159283194),tx_meta], 0));

if(cljs.core.seq(invalid_ent_maps)){
var explainer = logseq.db.frontend.validate.get_schema_explainer(new cljs.core.Keyword(null,"closed-schema?","closed-schema?",264902537).cljs$core$IFn$_invoke$arity$1(validate_options));
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Invalid datascript entities detected amongst changed entity ids:",changed_ids], 0));

var seq__154694_154766 = cljs.core.seq(invalid_ent_maps);
var chunk__154695_154767 = null;
var count__154696_154768 = (0);
var i__154697_154769 = (0);
while(true){
if((i__154697_154769 < count__154696_154768)){
var m_154770 = chunk__154695_154767.cljs$core$IIndexed$_nth$arity$2(null,i__154697_154769);
var m_SINGLEQUOTE__154771 = cljs.core.update.cljs$core$IFn$_invoke$arity$3(m_154770,new cljs.core.Keyword("block","properties","block/properties",708347145),((function (seq__154694_154766,chunk__154695_154767,count__154696_154768,i__154697_154769,m_154770,explainer,invalid_ent_maps,_STAR_db_for_validate_fns_STAR__orig_val__154691,_STAR_db_for_validate_fns_STAR__temp_val__154692,changed_ids,tx_datoms,ent_maps_STAR_,ent_maps,validator,map__154684,map__154684__$1,db_after,tx_data,tx_meta){
return (function (properties){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (seq__154694_154766,chunk__154695_154767,count__154696_154768,i__154697_154769,m_154770,explainer,invalid_ent_maps,_STAR_db_for_validate_fns_STAR__orig_val__154691,_STAR_db_for_validate_fns_STAR__temp_val__154692,changed_ids,tx_datoms,ent_maps_STAR_,ent_maps,validator,map__154684,map__154684__$1,db_after,tx_data,tx_meta){
return (function (p__154726){
var vec__154727 = p__154726;
var p = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154727,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154727,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p),v], null);
});})(seq__154694_154766,chunk__154695_154767,count__154696_154768,i__154697_154769,m_154770,explainer,invalid_ent_maps,_STAR_db_for_validate_fns_STAR__orig_val__154691,_STAR_db_for_validate_fns_STAR__temp_val__154692,changed_ids,tx_datoms,ent_maps_STAR_,ent_maps,validator,map__154684,map__154684__$1,db_after,tx_data,tx_meta))
,properties);
});})(seq__154694_154766,chunk__154695_154767,count__154696_154768,i__154697_154769,m_154770,explainer,invalid_ent_maps,_STAR_db_for_validate_fns_STAR__orig_val__154691,_STAR_db_for_validate_fns_STAR__temp_val__154692,changed_ids,tx_datoms,ent_maps_STAR_,ent_maps,validator,map__154684,map__154684__$1,db_after,tx_data,tx_meta))
);
var data_154772 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"entity-map","entity-map",238028540),m_SINGLEQUOTE__154771,new cljs.core.Keyword(null,"errors","errors",-908790718),malli.error.humanize.cljs$core$IFn$_invoke$arity$1((function (){var G__154730 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(m_154770,new cljs.core.Keyword("db","id","db/id",-1388397098))], null);
return (explainer.cljs$core$IFn$_invoke$arity$1 ? explainer.cljs$core$IFn$_invoke$arity$1(G__154730) : explainer.call(null,G__154730));
})())], null);
try{cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(data_154772);
}catch (e154731){var _e_154775 = e154731;
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([data_154772], 0));
}

var G__154776 = seq__154694_154766;
var G__154777 = chunk__154695_154767;
var G__154778 = count__154696_154768;
var G__154779 = (i__154697_154769 + (1));
seq__154694_154766 = G__154776;
chunk__154695_154767 = G__154777;
count__154696_154768 = G__154778;
i__154697_154769 = G__154779;
continue;
} else {
var temp__5804__auto___154780 = cljs.core.seq(seq__154694_154766);
if(temp__5804__auto___154780){
var seq__154694_154781__$1 = temp__5804__auto___154780;
if(cljs.core.chunked_seq_QMARK_(seq__154694_154781__$1)){
var c__5525__auto___154784 = cljs.core.chunk_first(seq__154694_154781__$1);
var G__154786 = cljs.core.chunk_rest(seq__154694_154781__$1);
var G__154787 = c__5525__auto___154784;
var G__154788 = cljs.core.count(c__5525__auto___154784);
var G__154789 = (0);
seq__154694_154766 = G__154786;
chunk__154695_154767 = G__154787;
count__154696_154768 = G__154788;
i__154697_154769 = G__154789;
continue;
} else {
var m_154790 = cljs.core.first(seq__154694_154781__$1);
var m_SINGLEQUOTE__154791 = cljs.core.update.cljs$core$IFn$_invoke$arity$3(m_154790,new cljs.core.Keyword("block","properties","block/properties",708347145),((function (seq__154694_154766,chunk__154695_154767,count__154696_154768,i__154697_154769,m_154790,seq__154694_154781__$1,temp__5804__auto___154780,explainer,invalid_ent_maps,_STAR_db_for_validate_fns_STAR__orig_val__154691,_STAR_db_for_validate_fns_STAR__temp_val__154692,changed_ids,tx_datoms,ent_maps_STAR_,ent_maps,validator,map__154684,map__154684__$1,db_after,tx_data,tx_meta){
return (function (properties){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (seq__154694_154766,chunk__154695_154767,count__154696_154768,i__154697_154769,m_154790,seq__154694_154781__$1,temp__5804__auto___154780,explainer,invalid_ent_maps,_STAR_db_for_validate_fns_STAR__orig_val__154691,_STAR_db_for_validate_fns_STAR__temp_val__154692,changed_ids,tx_datoms,ent_maps_STAR_,ent_maps,validator,map__154684,map__154684__$1,db_after,tx_data,tx_meta){
return (function (p__154736){
var vec__154737 = p__154736;
var p = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154737,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154737,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(p),v], null);
});})(seq__154694_154766,chunk__154695_154767,count__154696_154768,i__154697_154769,m_154790,seq__154694_154781__$1,temp__5804__auto___154780,explainer,invalid_ent_maps,_STAR_db_for_validate_fns_STAR__orig_val__154691,_STAR_db_for_validate_fns_STAR__temp_val__154692,changed_ids,tx_datoms,ent_maps_STAR_,ent_maps,validator,map__154684,map__154684__$1,db_after,tx_data,tx_meta))
,properties);
});})(seq__154694_154766,chunk__154695_154767,count__154696_154768,i__154697_154769,m_154790,seq__154694_154781__$1,temp__5804__auto___154780,explainer,invalid_ent_maps,_STAR_db_for_validate_fns_STAR__orig_val__154691,_STAR_db_for_validate_fns_STAR__temp_val__154692,changed_ids,tx_datoms,ent_maps_STAR_,ent_maps,validator,map__154684,map__154684__$1,db_after,tx_data,tx_meta))
);
var data_154792 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"entity-map","entity-map",238028540),m_SINGLEQUOTE__154791,new cljs.core.Keyword(null,"errors","errors",-908790718),malli.error.humanize.cljs$core$IFn$_invoke$arity$1((function (){var G__154740 = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(m_154790,new cljs.core.Keyword("db","id","db/id",-1388397098))], null);
return (explainer.cljs$core$IFn$_invoke$arity$1 ? explainer.cljs$core$IFn$_invoke$arity$1(G__154740) : explainer.call(null,G__154740));
})())], null);
try{cljs.pprint.pprint.cljs$core$IFn$_invoke$arity$1(data_154792);
}catch (e154741){var _e_154793 = e154741;
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([data_154792], 0));
}

var G__154795 = cljs.core.next(seq__154694_154781__$1);
var G__154796 = null;
var G__154797 = (0);
var G__154798 = (0);
seq__154694_154766 = G__154795;
chunk__154695_154767 = G__154796;
count__154696_154768 = G__154797;
i__154697_154769 = G__154798;
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
}finally {(logseq.db.frontend.malli_schema._STAR_db_for_validate_fns_STAR_ = _STAR_db_for_validate_fns_STAR__orig_val__154691);
}});
/**
 * Groups malli errors by entities. db is used for providing more debugging info
 */
logseq.db.frontend.validate.group_errors_by_entity = (function logseq$db$frontend$validate$group_errors_by_entity(db,ent_maps,errors){
if(cljs.core.vector_QMARK_(ent_maps)){
} else {
throw (new Error(["Assert failed: ","Must be a vec for grouping to work","\n","(vector? ent-maps)"].join('')));
}

return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__154744){
var vec__154745 = p__154744;
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154745,(0),null);
var errors_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154745,(1),null);
var ent = cljs.core.get.cljs$core$IFn$_invoke$arity$2(ent_maps,idx);
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"entity","entity",-450970276),(function (){var G__154750 = ent;
if(cljs.core.truth_(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(ent))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__154750,new cljs.core.Keyword("block","page","block/page",822314108),(function (id){
return cljs.core.select_keys((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id)),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","created-at","block/created-at",1440015)], null));
}));
} else {
return G__154750;
}
})(),new cljs.core.Keyword(null,"dispatch-key","dispatch-key",733619510),logseq.db.frontend.malli_schema.entity_dispatch_key(db,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(ent,new cljs.core.Keyword("db","id","db/id",-1388397098))),new cljs.core.Keyword(null,"errors","errors",-908790718),errors_SINGLEQUOTE_,new cljs.core.Keyword(null,"errors-by-type","errors-by-type",-1354313037),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__154751){
var vec__154752 = p__154751;
var type_SINGLEQUOTE_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154752,(0),null);
var type_errors = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__154752,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [type_SINGLEQUOTE_,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"in-value-distinct","in-value-distinct",1648763303),cljs.core.vec(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__154743_SHARP_){
return cljs.core.select_keys(p1__154743_SHARP_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Keyword(null,"value","value",305978217)], null));
}),type_errors))),new cljs.core.Keyword(null,"schema-distinct","schema-distinct",-304530559),cljs.core.vec(cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(malli.core.form,cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"schema","schema",-1582001791),type_errors))))], null)], null);
}),cljs.core.group_by(new cljs.core.Keyword(null,"type","type",1174270348),errors_SINGLEQUOTE_)))], null);
}),cljs.core.group_by((function (p1__154742_SHARP_){
return cljs.core.first(new cljs.core.Keyword(null,"in","in",-1531184865).cljs$core$IFn$_invoke$arity$1(p1__154742_SHARP_));
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
var ent_maps = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p1__154755_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(p1__154755_SHARP_,new cljs.core.Keyword("block.temp","fully-loaded?","block.temp/fully-loaded?",-116637365),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("block.temp","has-children?","block.temp/has-children?",935519725)], 0));
}),logseq.db.frontend.malli_schema.update_properties_in_ents(db,ent_maps_STAR_));
var errors = (function (){var _STAR_db_for_validate_fns_STAR__orig_val__154757 = logseq.db.frontend.malli_schema._STAR_db_for_validate_fns_STAR_;
var _STAR_db_for_validate_fns_STAR__temp_val__154758 = db;
(logseq.db.frontend.malli_schema._STAR_db_for_validate_fns_STAR_ = _STAR_db_for_validate_fns_STAR__temp_val__154758);

try{return new cljs.core.Keyword(null,"errors","errors",-908790718).cljs$core$IFn$_invoke$arity$1((function (){var G__154759 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (e){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(e,new cljs.core.Keyword("db","id","db/id",-1388397098));
}),ent_maps);
return (logseq.db.frontend.validate.closed_db_schema_explainer.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.validate.closed_db_schema_explainer.cljs$core$IFn$_invoke$arity$1(G__154759) : logseq.db.frontend.validate.closed_db_schema_explainer.call(null,G__154759));
})());
}finally {(logseq.db.frontend.malli_schema._STAR_db_for_validate_fns_STAR_ = _STAR_db_for_validate_fns_STAR__orig_val__154757);
}})();
var G__154760 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"datom-count","datom-count",515794351),cljs.core.count(datoms),new cljs.core.Keyword(null,"entities","entities",1940967403),ent_maps_STAR_], null);
if((!((errors == null)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__154760,new cljs.core.Keyword(null,"errors","errors",-908790718),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__154756_SHARP_){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__154756_SHARP_,new cljs.core.Keyword(null,"errors-by-type","errors-by-type",-1354313037)),new cljs.core.Keyword(null,"errors","errors",-908790718),(function (errs){
return malli.error.humanize.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"errors","errors",-908790718),errs], null));
}));
}),logseq.db.frontend.validate.group_errors_by_entity(db,ent_maps,errors)));
} else {
return G__154760;
}
});
/**
 * Calculates graph-wide counts given a graph's db and its entities from :eavt datoms
 */
logseq.db.frontend.validate.graph_counts = (function logseq$db$frontend$validate$graph_counts(db,entities){
var classes_count = cljs.core.count(datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Tag","logseq.class/Tag",-538902083)));
var properties_count = cljs.core.count(datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048)));
return new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"entities","entities",1940967403),cljs.core.count(entities),new cljs.core.Keyword(null,"pages","pages",-285406513),cljs.core.count(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","name","block/name",1619760316),entities)),new cljs.core.Keyword(null,"blocks","blocks",-610462153),cljs.core.count(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","parent","block/parent",-918309064),entities)),new cljs.core.Keyword(null,"classes","classes",2037804510),classes_count,new cljs.core.Keyword(null,"properties","properties",685819552),properties_count,new cljs.core.Keyword(null,"objects","objects",2099713734),((cljs.core.count(datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340))) - classes_count) - properties_count),new cljs.core.Keyword(null,"property-pairs","property-pairs",1375546878),cljs.core.count(cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (p1__154761_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.properties(p1__154761_SHARP_),new cljs.core.Keyword("block","tags","block/tags",1814948340));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([entities], 0)))], null);
});

//# sourceMappingURL=logseq.db.frontend.validate.js.map
