goog.provide('logseq.db.common.view');
logseq.db.common.view.valid_type_for_sort_QMARK_ = cljs.core.some_fn.cljs$core$IFn$_invoke$arity$3(cljs.core.number_QMARK_,cljs.core.string_QMARK_,cljs.core.boolean_QMARK_);
logseq.db.common.view.get_property_value_for_search = (function logseq$db$common$view$get_property_value_for_search(block,property){
var v = cljs.core.get.cljs$core$IFn$_invoke$arity$2(block,new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property));
if(cljs.core.truth_(logseq.db.common.view.valid_type_for_sort_QMARK_(v))){
return v;
} else {
var typ = new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property);
var many_QMARK_ = cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("db.cardinality","many","db.cardinality/many",772806234),cljs.core.get.cljs$core$IFn$_invoke$arity$2(property,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659)));
var number_type_QMARK_ = ((cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword(null,"number","number",1570378438),typ)) || (cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword(null,"datetime","datetime",494675702),typ)));
if(many_QMARK_){
var col = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,(cljs.core.truth_((logseq.db.frontend.property.type.all_ref_property_types.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.property.type.all_ref_property_types.cljs$core$IFn$_invoke$arity$1(typ) : logseq.db.frontend.property.type.all_ref_property_types.call(null,typ)))?cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.property_value_content,v):v));
if(number_type_QMARK_){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core._PLUS_,cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.number_QMARK_,col));
} else {
return clojure.string.join.cljs$core$IFn$_invoke$arity$2(", ",col);
}
} else {
var v_SINGLEQUOTE_ = (cljs.core.truth_((logseq.db.frontend.property.type.all_ref_property_types.cljs$core$IFn$_invoke$arity$1 ? logseq.db.frontend.property.type.all_ref_property_types.cljs$core$IFn$_invoke$arity$1(typ) : logseq.db.frontend.property.type.all_ref_property_types.call(null,typ)))?logseq.db.frontend.property.property_value_content(v):v);
if(((number_type_QMARK_) && (typeof v_SINGLEQUOTE_ === 'number'))){
return v_SINGLEQUOTE_;
} else {
return v_SINGLEQUOTE_;

}
}
}
});
logseq.db.common.view.get_value_for_sort = (function logseq$db$common$view$get_value_for_sort(property){
var db_ident = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(property);
}
})();
var closed_values = cljs.core.seq(new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(property));
var closed_value__GT_sort_number = ((closed_values)?cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),closed_values),((cljs.core.every_QMARK_(new cljs.core.Keyword("block","order","block/order",-1429282437),closed_values))?cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","order","block/order",-1429282437),closed_values):cljs.core.range.cljs$core$IFn$_invoke$arity$2((0),cljs.core.count(closed_values))))):null);
var get_property_value_fn = (function (entity){
if(datascript.impl.entity.entity_QMARK_(property)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"date","date",-1463434462),new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property))){
return new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(entity,db_ident));
} else {
return logseq.db.common.view.get_property_value_for_search(entity,property);
}
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(entity,db_ident);
}
});
return (function (entity){
if(closed_values){
var G__68810 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(entity,db_ident));
return (closed_value__GT_sort_number.cljs$core$IFn$_invoke$arity$1 ? closed_value__GT_sort_number.cljs$core$IFn$_invoke$arity$1(G__68810) : closed_value__GT_sort_number.call(null,G__68810));
} else {
var v = get_property_value_fn(entity);
if(cljs.core.truth_(logseq.db.common.view.valid_type_for_sort_QMARK_(v))){
return v;
} else {
return null;
}

}
});
});
logseq.db.common.view.by_one_sorting = (function logseq$db$common$view$by_one_sorting(p__68819){
var map__68820 = p__68819;
var map__68820__$1 = cljs.core.__destructure_map(map__68820);
var asc_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68820__$1,new cljs.core.Keyword(null,"asc?","asc?",891093427));
var get_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68820__$1,new cljs.core.Keyword(null,"get-value","get-value",2108514284));
var cmp = (cljs.core.truth_(asc_QMARK_)?cljs.core.compare:(function (p1__68814_SHARP_,p2__68813_SHARP_){
return cljs.core.compare(p2__68813_SHARP_,p1__68814_SHARP_);
}));
return (function (a,b){
var G__68824 = (get_value.cljs$core$IFn$_invoke$arity$1 ? get_value.cljs$core$IFn$_invoke$arity$1(a) : get_value.call(null,a));
var G__68825 = (get_value.cljs$core$IFn$_invoke$arity$1 ? get_value.cljs$core$IFn$_invoke$arity$1(b) : get_value.call(null,b));
return (cmp.cljs$core$IFn$_invoke$arity$2 ? cmp.cljs$core$IFn$_invoke$arity$2(G__68824,G__68825) : cmp.call(null,G__68824,G__68825));
});
});
/**
 * get all entities sorted by `major-sorting`
 */
logseq.db.common.view.sort_ref_entities_by_single_property = (function logseq$db$common$view$sort_ref_entities_by_single_property(entities,p__68835,get_value_fn){
var map__68836 = p__68835;
var map__68836__$1 = cljs.core.__destructure_map(map__68836);
var _id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68836__$1,new cljs.core.Keyword(null,"_id","_id",-789960287));
var asc_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68836__$1,new cljs.core.Keyword(null,"asc?","asc?",891093427));
var sorting = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"asc?","asc?",891093427),asc_QMARK_,new cljs.core.Keyword(null,"get-value","get-value",2108514284),get_value_fn], null);
var sort_cmp = logseq.db.common.view.by_one_sorting(sorting);
return cljs.core.sort.cljs$core$IFn$_invoke$arity$2(sort_cmp,entities);
});
logseq.db.common.view.sort_by_single_property = (function logseq$db$common$view$sort_by_single_property(db,p__68843,entities,partition_QMARK_){
var map__68844 = p__68843;
var map__68844__$1 = cljs.core.__destructure_map(map__68844);
var sorting = map__68844__$1;
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68844__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var asc_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68844__$1,new cljs.core.Keyword(null,"asc?","asc?",891093427));
var property = (function (){var or__5002__auto__ = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("db","ident","db/ident",-737096),id], null);
}
})();
var get_value_fn = cljs.core.memoize(logseq.db.common.view.get_value_for_sort(property));
var sorted_entities = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword("block.temp","refs-count","block.temp/refs-count",-598132499)))?(function (){var G__68845 = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block.temp","refs-count","block.temp/refs-count",-598132499),entities);
if(cljs.core.not(asc_QMARK_)){
return cljs.core.reverse(G__68845);
} else {
return G__68845;
}
})():((cljs.core.not((logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.db_based_graph_QMARK_.call(null,db))))?cljs.core.sort.cljs$core$IFn$_invoke$arity$2(logseq.common.util.by_sorting(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"get-value","get-value",2108514284),get_value_fn,new cljs.core.Keyword(null,"asc?","asc?",891093427),asc_QMARK_], null)], null)),entities):(function (){var ref_type_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079),new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(property));
if(ref_type_QMARK_){
return logseq.db.common.view.sort_ref_entities_by_single_property(entities,sorting,get_value_fn);
} else {
var datoms = (function (){var G__68850 = cljs.core.vec(logseq.common.util.distinct_by(new cljs.core.Keyword(null,"e","e",1381269198),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),id)));
if(cljs.core.not(asc_QMARK_)){
return cljs.core.rseq(G__68850);
} else {
return G__68850;
}
})();
var row_ids = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),entities));
var id__GT_row = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),entities),entities);
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (d){
if(cljs.core.truth_((function (){var G__68851 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (row_ids.cljs$core$IFn$_invoke$arity$1 ? row_ids.cljs$core$IFn$_invoke$arity$1(G__68851) : row_ids.call(null,G__68851));
})())){
var G__68852 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (id__GT_row.cljs$core$IFn$_invoke$arity$1 ? id__GT_row.cljs$core$IFn$_invoke$arity$1(G__68852) : id__GT_row.call(null,G__68852));
} else {
return null;
}
}),datoms);
}
})()
)));
if(cljs.core.truth_(partition_QMARK_)){
return cljs.core.partition_by.cljs$core$IFn$_invoke$arity$2(get_value_fn,sorted_entities);
} else {
return sorted_entities;
}
});
/**
 * minor-sorting - [{:keys [id asc?]} ...]
 */
logseq.db.common.view.sort_entities_by_minor_sorting = (function logseq$db$common$view$sort_entities_by_minor_sorting(db,partitioned_entities_by_major_sorting,minor_sorting){
var sorting = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__68855){
var map__68856 = p__68855;
var map__68856__$1 = cljs.core.__destructure_map(map__68856);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68856__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var asc_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__68856__$1,new cljs.core.Keyword(null,"asc?","asc?",891093427));
var property = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"asc?","asc?",891093427),asc_QMARK_,new cljs.core.Keyword(null,"get-value","get-value",2108514284),cljs.core.memoize(logseq.db.common.view.get_value_for_sort(property))], null);
}),minor_sorting);
var sort_cmp = logseq.common.util.by_sorting(sorting);
return cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (entities){
return cljs.core.sort.cljs$core$IFn$_invoke$arity$2(sort_cmp,entities);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([partitioned_entities_by_major_sorting], 0));
});
logseq.db.common.view.sort_entities = (function logseq$db$common$view$sort_entities(db,sorting,entities){
var major_sorting = (function (){var or__5002__auto__ = cljs.core.first(sorting);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),new cljs.core.Keyword(null,"asc?","asc?",891093427),false], null);
}
})();
var minor_sorting = cljs.core.seq(cljs.core.rest(sorting));
var major_sorted_entities = logseq.db.common.view.sort_by_single_property(db,major_sorting,entities,cljs.core.not_empty(minor_sorting));
if(minor_sorting){
return logseq.db.common.view.sort_entities_by_minor_sorting(db,major_sorted_entities,minor_sorting);
} else {
return major_sorted_entities;
}
});
logseq.db.common.view.get_property_value_content = (function logseq$db$common$view$get_property_value_content(db,value){
if(cljs.core.truth_(value)){
if(cljs.core.uuid_QMARK_(value)){
return logseq.db.frontend.property.property_value_content((function (){var G__68861 = db;
var G__68862 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),value], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__68861,G__68862) : datascript.core.entity.call(null,G__68861,G__68862));
})());
} else {
if(datascript.impl.entity.entity_QMARK_(value)){
return logseq.db.frontend.property.property_value_content(value);
} else {
if((value instanceof cljs.core.Keyword)){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(value);
} else {
return value;

}
}
}
} else {
return null;
}
});
/**
 * Determines if the property value entity should be treated as an entity. For some property types
 * like :default, we want match on the entity's content as that is what the user sees and interacts with
 */
logseq.db.common.view.match_property_value_as_entity_QMARK_ = (function logseq$db$common$view$match_property_value_as_entity_QMARK_(property_value_entity,property_entity){
var or__5002__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(property_value_entity);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (!(cljs.core.contains_QMARK_(logseq.db.frontend.property.type.closed_value_property_types,new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404).cljs$core$IFn$_invoke$arity$1(property_entity))));
}
});
logseq.db.common.view.row_matched_QMARK_ = (function logseq$db$common$view$row_matched_QMARK_(db,row,filters,input){
var or_QMARK_ = new cljs.core.Keyword(null,"or?","or?",-1226532173).cljs$core$IFn$_invoke$arity$1(filters);
var check_f = (cljs.core.truth_(or_QMARK_)?cljs.core.some:cljs.core.every_QMARK_);
var and__5000__auto__ = ((clojure.string.blank_QMARK_(input))?true:clojure.string.includes_QMARK_(clojure.string.lower_case(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(row)),clojure.string.lower_case(input)));
if(and__5000__auto__){
var G__68897 = (function (p__68905){
var vec__68911 = p__68905;
var property_ident = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68911,(0),null);
var operator = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68911,(1),null);
var match = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68911,(2),null);
if((match == null)){
return true;
} else {
var value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(row,property_ident);
var value_SINGLEQUOTE_ = ((cljs.core.set_QMARK_(value))?value:(((value == null))?cljs.core.PersistentHashSet.EMPTY:cljs.core.PersistentHashSet.createAsIfByAssoc([value])
));
var entity_QMARK_ = datascript.impl.entity.entity_QMARK_(cljs.core.first(value_SINGLEQUOTE_));
var result = (function (){var G__68920 = operator;
var G__68920__$1 = (((G__68920 instanceof cljs.core.Keyword))?G__68920.fqn:null);
switch (G__68920__$1) {
case "is":
if(cljs.core.boolean_QMARK_(match)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.boolean$(logseq.db.common.view.get_property_value_content(db,cljs.core.get.cljs$core$IFn$_invoke$arity$2(row,property_ident))),match);
} else {
if(cljs.core.empty_QMARK_(match)){
return true;
} else {
if(((cljs.core.empty_QMARK_(match)) && (cljs.core.empty_QMARK_(value_SINGLEQUOTE_)))){
return true;
} else {
if(entity_QMARK_){
var property = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,property_ident) : datascript.core.entity.call(null,db,property_ident));
if(cljs.core.truth_(logseq.db.common.view.match_property_value_as_entity_QMARK_(cljs.core.first(value_SINGLEQUOTE_),property))){
return cljs.core.boolean$(cljs.core.seq(clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),value_SINGLEQUOTE_)),match)));
} else {
return cljs.core.boolean$(cljs.core.seq(clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.property_value_content,value_SINGLEQUOTE_)),cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.property_value_content,(function (p1__68873_SHARP_){
var G__68940 = db;
var G__68941 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__68873_SHARP_], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__68940,G__68941) : datascript.core.entity.call(null,G__68940,G__68941));
})),match)))));
}
} else {
return cljs.core.boolean$(cljs.core.seq(clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(cljs.core.set(value_SINGLEQUOTE_),match)));
}

}
}
}

break;
case "is-not":
if(cljs.core.boolean_QMARK_(match)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.boolean$(logseq.db.common.view.get_property_value_content(db,cljs.core.get.cljs$core$IFn$_invoke$arity$2(row,property_ident))),match);
} else {
if(((cljs.core.empty_QMARK_(match)) && (cljs.core.seq(value_SINGLEQUOTE_)))){
return true;
} else {
if(((cljs.core.seq(match)) && (cljs.core.empty_QMARK_(value_SINGLEQUOTE_)))){
return true;
} else {
if(entity_QMARK_){
var property = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,property_ident) : datascript.core.entity.call(null,db,property_ident));
if(cljs.core.truth_(logseq.db.common.view.match_property_value_as_entity_QMARK_(cljs.core.first(value_SINGLEQUOTE_),property))){
return cljs.core.boolean$(cljs.core.empty_QMARK_(clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),value_SINGLEQUOTE_)),match)));
} else {
return cljs.core.boolean$(cljs.core.empty_QMARK_(clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.property_value_content,value_SINGLEQUOTE_)),cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.property_value_content,(function (p1__68874_SHARP_){
var G__68952 = db;
var G__68954 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),p1__68874_SHARP_], null);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__68952,G__68954) : datascript.core.entity.call(null,G__68952,G__68954));
})),match)))));
}
} else {
return cljs.core.boolean$(cljs.core.empty_QMARK_(clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(cljs.core.set(value_SINGLEQUOTE_),match)));
}

}
}
}

break;
case "text-contains":
return cljs.core.some((function (v){
var temp__5802__auto__ = logseq.db.common.view.get_property_value_content(db,v);
if(cljs.core.truth_(temp__5802__auto__)){
var property_value = temp__5802__auto__;
return clojure.string.includes_QMARK_(clojure.string.lower_case(property_value),clojure.string.lower_case(match));
} else {
return false;
}
}),value_SINGLEQUOTE_);

break;
case "text-not-contains":
return cljs.core.not_any_QMARK_((function (p1__68875_SHARP_){
return clojure.string.includes_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(logseq.db.common.view.get_property_value_content(db,p1__68875_SHARP_)),match);
}),value_SINGLEQUOTE_);

break;
case "number-gt":
if(cljs.core.truth_(match)){
return cljs.core.some((function (p1__68876_SHARP_){
return (logseq.db.common.view.get_property_value_content(db,p1__68876_SHARP_) > match);
}),value_SINGLEQUOTE_);
} else {
return true;
}

break;
case "number-gte":
if(cljs.core.truth_(match)){
return cljs.core.some((function (p1__68877_SHARP_){
return (logseq.db.common.view.get_property_value_content(db,p1__68877_SHARP_) >= match);
}),value_SINGLEQUOTE_);
} else {
return true;
}

break;
case "number-lt":
if(cljs.core.truth_(match)){
return cljs.core.some((function (p1__68878_SHARP_){
return (logseq.db.common.view.get_property_value_content(db,p1__68878_SHARP_) < match);
}),value_SINGLEQUOTE_);
} else {
return true;
}

break;
case "number-lte":
if(cljs.core.truth_(match)){
return cljs.core.some((function (p1__68879_SHARP_){
return (logseq.db.common.view.get_property_value_content(db,p1__68879_SHARP_) <= match);
}),value_SINGLEQUOTE_);
} else {
return true;
}

break;
case "between":
if(cljs.core.seq(match)){
return cljs.core.some((function (value_entity){
var vec__68961 = match;
var start = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68961,(0),null);
var end = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68961,(1),null);
var value__$1 = logseq.db.common.view.get_property_value_content(db,value_entity);
var conditions = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(cljs.core.truth_(start)?(start <= value__$1):true),(cljs.core.truth_(end)?(value__$1 <= end):true)], null);
if(cljs.core.seq(match)){
return cljs.core.every_QMARK_(cljs.core.true_QMARK_,conditions);
} else {
return true;
}
}),value_SINGLEQUOTE_);
} else {
return true;
}

break;
case "date-before":
if(cljs.core.truth_(match)){
return cljs.core.some((function (p1__68880_SHARP_){
return (new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366).cljs$core$IFn$_invoke$arity$1(p1__68880_SHARP_) < new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366).cljs$core$IFn$_invoke$arity$1(match));
}),value_SINGLEQUOTE_);
} else {
return true;
}

break;
case "date-after":
if(cljs.core.truth_(match)){
return cljs.core.some((function (p1__68881_SHARP_){
return (new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366).cljs$core$IFn$_invoke$arity$1(p1__68881_SHARP_) > new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366).cljs$core$IFn$_invoke$arity$1(match));
}),value_SINGLEQUOTE_);
} else {
return true;
}

break;
case "before":
var search_value = logseq.common.util.get_timestamp(match);
if(cljs.core.truth_(search_value)){
return (cljs.core.get.cljs$core$IFn$_invoke$arity$2(row,property_ident) <= search_value);
} else {
return true;
}

break;
case "after":
var search_value = logseq.common.util.get_timestamp(match);
if(cljs.core.truth_(search_value)){
return (cljs.core.get.cljs$core$IFn$_invoke$arity$2(row,property_ident) >= search_value);
} else {
return true;
}

break;
default:
return true;

}
})();
return result;
}
});
var G__68898 = new cljs.core.Keyword(null,"filters","filters",974726919).cljs$core$IFn$_invoke$arity$1(filters);
return (check_f.cljs$core$IFn$_invoke$arity$2 ? check_f.cljs$core$IFn$_invoke$arity$2(G__68897,G__68898) : check_f.call(null,G__68897,G__68898));
} else {
return and__5000__auto__;
}
});
logseq.db.common.view.filter_blocks = (function logseq$db$common$view$filter_blocks(filters,ref_blocks){
var exclude_ids = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword(null,"excluded","excluded",-715952088).cljs$core$IFn$_invoke$arity$1(filters)));
var include_ids = cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword(null,"included","included",-1002787476).cljs$core$IFn$_invoke$arity$1(filters)));
var get_ids = (function (block){
return cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352).cljs$core$IFn$_invoke$arity$1(block)));
});
var G__68978 = ref_blocks;
var G__68978__$1 = ((cljs.core.seq(exclude_ids))?cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (block){
var ids = get_ids(block);
return cljs.core.seq(clojure.set.intersection.cljs$core$IFn$_invoke$arity$2(exclude_ids,ids));
}),G__68978):G__68978);
if(cljs.core.seq(include_ids)){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (block){
var ids = get_ids(block);
return clojure.set.subset_QMARK_(include_ids,ids);
}),G__68978__$1);
} else {
return G__68978__$1;
}
});
logseq.db.common.view.get_filters = (function logseq$db$common$view$get_filters(db,page){
var db_based_QMARK_ = logseq.db.common.entity_plus.db_based_graph_QMARK_(db);
if(cljs.core.truth_(db_based_QMARK_)){
var included_pages = new cljs.core.Keyword("logseq.property.linked-references","includes","logseq.property.linked-references/includes",1680577703).cljs$core$IFn$_invoke$arity$1(page);
var excluded_pages = new cljs.core.Keyword("logseq.property.linked-references","excludes","logseq.property.linked-references/excludes",242675889).cljs$core$IFn$_invoke$arity$1(page);
if(((cljs.core.seq(included_pages)) || (cljs.core.seq(excluded_pages)))){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"included","included",-1002787476),included_pages,new cljs.core.Keyword(null,"excluded","excluded",-715952088),excluded_pages], null);
} else {
return null;
}
} else {
var k = new cljs.core.Keyword(null,"filters","filters",974726919);
var properties = new cljs.core.Keyword("block","properties","block/properties",708347145).cljs$core$IFn$_invoke$arity$1(page);
var properties_str = (function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(properties,k);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "{}";
}
})();
try{var result = cljs.reader.read_string.cljs$core$IFn$_invoke$arity$1(properties_str);
if(cljs.core.seq(result)){
var excluded_pages = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__68984_SHARP_){
return logseq.db.get_page(db,p1__68984_SHARP_);
}),cljs.core.keep.cljs$core$IFn$_invoke$arity$2(cljs.core.first,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__68983_SHARP_){
return cljs.core.second(p1__68983_SHARP_) === false;
}),result)));
var included_pages = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__68986_SHARP_){
return logseq.db.get_page(db,p1__68986_SHARP_);
}),cljs.core.keep.cljs$core$IFn$_invoke$arity$2(cljs.core.first,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__68985_SHARP_){
return cljs.core.second(p1__68985_SHARP_) === true;
}),result)));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"included","included",-1002787476),included_pages,new cljs.core.Keyword(null,"excluded","excluded",-715952088),excluded_pages], null);
} else {
return null;
}
}catch (e68987){var e = e68987;
return logseq.common.log.error.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("syntax","filters","syntax/filters",1060305692),e], 0));
}}
});
logseq.db.common.view.get_linked_references = (function logseq$db$common$view$get_linked_references(db,id){
var entity = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id));
var ids = cljs.core.set(cljs.core.cons(id,(logseq.db.get_block_alias.cljs$core$IFn$_invoke$arity$2 ? logseq.db.get_block_alias.cljs$core$IFn$_invoke$arity$2(db,id) : logseq.db.get_block_alias.call(null,db,id))));
var refs = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (id__$1){
return new cljs.core.Keyword("block","_refs","block/_refs",830218531).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id__$1) : datascript.core.entity.call(null,db,id__$1)));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([ids], 0));
var page_filters = logseq.db.common.view.get_filters(db,entity);
var full_ref_blocks = logseq.common.util.distinct_by(new cljs.core.Keyword("db","id","db/id",-1388397098),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (block){
return logseq.db.common.initial_data.hidden_ref_QMARK_(db,block,id);
}),refs));
var ref_blocks = (function (){var G__68998 = full_ref_blocks;
if(cljs.core.seq(page_filters)){
return logseq.db.common.view.filter_blocks(page_filters,G__68998);
} else {
return G__68998;
}
})();
var ref_pages_count = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3(cljs.core.second,(function (p1__68991_SHARP_,p2__68992_SHARP_){
return (p1__68991_SHARP_ > p2__68992_SHARP_);
}),cljs.core.frequencies(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (block){
return cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.cons(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","page","block/page",822314108).cljs$core$IFn$_invoke$arity$1(block)),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
if(cljs.core.truth_((function (){var and__5000__auto__ = (logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.page_QMARK_.cljs$core$IFn$_invoke$arity$1(b) : logseq.db.page_QMARK_.call(null,b));
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b),id)) && ((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","tags","block/tags",1814948340),null], null), null),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(b))))));
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(b);
} else {
return null;
}
}),new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352).cljs$core$IFn$_invoke$arity$1(block))));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([full_ref_blocks], 0)))));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ref-pages-count","ref-pages-count",-74477634),ref_pages_count,new cljs.core.Keyword(null,"ref-blocks","ref-blocks",-348598444),ref_blocks], null);
});
logseq.db.common.view.get_unlinked_references = (function logseq$db$common$view$get_unlinked_references(db,id){
var entity = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id));
var title = clojure.string.lower_case(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(entity));
if(clojure.string.blank_QMARK_(title)){
return null;
} else {
var ids = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (d){
if(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(id,new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d))) && (clojure.string.includes_QMARK_(clojure.string.lower_case(new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d)),title)))){
return new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
} else {
return null;
}
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","title","block/title",710445684)));
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (eid){
var e = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,eid) : datascript.core.entity.call(null,db,eid));
if(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core.some((function (p1__69004_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(id,p1__69004_SHARP_);
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(e)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword("block","link","block/link",-1872399993).cljs$core$IFn$_invoke$arity$1(e);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return (logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1 ? logseq.db.built_in_QMARK_.cljs$core$IFn$_invoke$arity$1(e) : logseq.db.built_in_QMARK_.call(null,e));
}
}
})())){
return null;
} else {
return e;
}
}),ids);
}
});
logseq.db.common.view.get_exclude_page_ids = (function logseq$db$common$view$get_exclude_page_ids(db){
return cljs.core.set(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic(datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("logseq.property","hide?","logseq.property/hide?",68365746),true),datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("logseq.property","built-in?","logseq.property/built-in?",-1125958160),true),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.class","Property","logseq.class/Property",1038767048)))))], 0))));
});
logseq.db.common.view.get_entities_for_all_pages = (function logseq$db$common$view$get_entities_for_all_pages(db,sorting,property_ident,p__69012){
var map__69013 = p__69012;
var map__69013__$1 = cljs.core.__destructure_map(map__69013);
var db_based_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69013__$1,new cljs.core.Keyword(null,"db-based?","db-based?",-1746581232));
var refs_count_QMARK_ = (function (){var and__5000__auto__ = cljs.core.coll_QMARK_(sorting);
if(and__5000__auto__){
return cljs.core.some((function (m){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(m),new cljs.core.Keyword("block.temp","refs-count","block.temp/refs-count",-598132499));
}),sorting);
} else {
return and__5000__auto__;
}
})();
var exclude_ids = (cljs.core.truth_(db_based_QMARK_)?logseq.db.common.view.get_exclude_page_ids(db):null);
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (d){
var e = (function (){var G__69016 = db;
var G__69017 = new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d);
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(G__69016,G__69017) : datascript.core.entity.call(null,G__69016,G__69017));
})();
if(cljs.core.truth_((cljs.core.truth_(db_based_QMARK_)?(function (){var G__69018 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e);
return (exclude_ids.cljs$core$IFn$_invoke$arity$1 ? exclude_ids.cljs$core$IFn$_invoke$arity$1(G__69018) : exclude_ids.call(null,G__69018));
})():(function (){var or__5002__auto__ = logseq.db.hidden_or_internal_tag_QMARK_(e);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = logseq.db.frontend.entity_util.property_QMARK_(e);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return logseq.db.frontend.entity_util.built_in_QMARK_(e);
}
}
})()))){
return null;
} else {
var G__69026 = e;
if(cljs.core.truth_(refs_count_QMARK_)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__69026,new cljs.core.Keyword("block.temp","refs-count","block.temp/refs-count",-598132499),(function (){var G__69027 = db;
var G__69028 = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e);
return (logseq.db.get_block_refs_count.cljs$core$IFn$_invoke$arity$2 ? logseq.db.get_block_refs_count.cljs$core$IFn$_invoke$arity$2(G__69027,G__69028) : logseq.db.get_block_refs_count.call(null,G__69027,G__69028));
})());
} else {
return G__69026;
}
}
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),property_ident));
});
logseq.db.common.view.get_entities = (function logseq$db$common$view$get_entities(db,view,feat_type,property_ident,view_for_id_STAR_,sorting){
var view_for = new cljs.core.Keyword("logseq.property","view-for","logseq.property/view-for",-36274319).cljs$core$IFn$_invoke$arity$1(view);
var view_for_id = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view_for);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return view_for_id_STAR_;
}
})();
var non_hidden_e = (function (id){
var e = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,id) : datascript.core.entity.call(null,db,id));
if(logseq.db.frontend.entity_util.hidden_QMARK_(e)){
return null;
} else {
return e;
}
});
var db_based_QMARK_ = logseq.db.common.entity_plus.db_based_graph_QMARK_(db);
var G__69033 = feat_type;
var G__69033__$1 = (((G__69033 instanceof cljs.core.Keyword))?G__69033.fqn:null);
switch (G__69033__$1) {
case "all-pages":
return logseq.db.common.view.get_entities_for_all_pages(db,sorting,property_ident,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db-based?","db-based?",-1746581232),db_based_QMARK_], null));

break;
case "class-objects":
var class_id = view_for_id;
var class_children = logseq.db.frontend.class$.get_structured_children(db,class_id);
var class_ids = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(class_children,class_id));
var datoms = cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (id){
return datascript.core.datoms.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword(null,"avet","avet",1383857032),new cljs.core.Keyword("block","tags","block/tags",1814948340),id);
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([class_ids], 0));
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (d){
return non_hidden_e(new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d));
}),datoms);

break;
case "property-objects":
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (id){
return non_hidden_e(id);
}),(function (){var G__69034 = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"%","%",-950237169,null),new cljs.core.Symbol(null,"?prop","?prop",1880869414,null),new cljs.core.Keyword(null,"where","where",-2044795965),cljs.core.list(new cljs.core.Symbol(null,"has-property-or-object-property?","has-property-or-object-property?",866044234,null),new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Symbol(null,"?prop","?prop",1880869414,null))], null);
var G__69035 = db;
var G__69036 = logseq.db.frontend.rules.extract_rules.cljs$core$IFn$_invoke$arity$variadic(logseq.db.frontend.rules.db_query_dsl_rules,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"has-property-or-object-property","has-property-or-object-property",-540034341)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"deps","deps",1883360319),logseq.db.frontend.rules.rules_dependencies], null)], 0));
var G__69037 = property_ident;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$4 ? datascript.core.q.cljs$core$IFn$_invoke$arity$4(G__69034,G__69035,G__69036,G__69037) : datascript.core.q.call(null,G__69034,G__69035,G__69036,G__69037));
})());

break;
case "linked-references":
return logseq.db.common.view.get_linked_references(db,view_for_id);

break;
case "unlinked-references":
return logseq.db.common.view.get_unlinked_references(db,view_for_id);

break;
case "query-result":
return null;

break;
default:
return null;

}
});
logseq.db.common.view.get_view_entities = (function logseq$db$common$view$get_view_entities(var_args){
var args__5732__auto__ = [];
var len__5726__auto___69216 = arguments.length;
var i__5727__auto___69217 = (0);
while(true){
if((i__5727__auto___69217 < len__5726__auto___69216)){
args__5732__auto__.push((arguments[i__5727__auto___69217]));

var G__69218 = (i__5727__auto___69217 + (1));
i__5727__auto___69217 = G__69218;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return logseq.db.common.view.get_view_entities.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(logseq.db.common.view.get_view_entities.cljs$core$IFn$_invoke$arity$variadic = (function (db,view_id,p__69048){
var map__69049 = p__69048;
var map__69049__$1 = cljs.core.__destructure_map(map__69049);
var view_for_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69049__$1,new cljs.core.Keyword(null,"view-for-id","view-for-id",-450280889));
var view_feature_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69049__$1,new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610));
var sorting = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69049__$1,new cljs.core.Keyword(null,"sorting","sorting",622249690));
var view = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,view_id) : datascript.core.entity.call(null,db,view_id));
var feat_type = (function (){var or__5002__auto__ = view_feature_type;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property.view","feature-type","logseq.property.view/feature-type",-939141871).cljs$core$IFn$_invoke$arity$1(view);
}
})();
var sorting__$1 = (function (){var or__5002__auto__ = sorting;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property.table","sorting","logseq.property.table/sorting",208102594).cljs$core$IFn$_invoke$arity$1(view);
}
})();
var index_attr = (function (){var G__69050 = feat_type;
var G__69050__$1 = (((G__69050 instanceof cljs.core.Keyword))?G__69050.fqn:null);
switch (G__69050__$1) {
case "all-pages":
return new cljs.core.Keyword("block","name","block/name",1619760316);

break;
case "class-objects":
return new cljs.core.Keyword("block","tags","block/tags",1814948340);

break;
case "property-objects":
var view_for = new cljs.core.Keyword("logseq.property","view-for","logseq.property/view-for",-36274319).cljs$core$IFn$_invoke$arity$1(view);
return new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(view_for);

break;
default:
return null;

}
})();
return logseq.db.common.view.get_entities(db,view,feat_type,index_attr,view_for_id,sorting__$1);
}));

(logseq.db.common.view.get_view_entities.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(logseq.db.common.view.get_view_entities.cljs$lang$applyTo = (function (seq69041){
var G__69042 = cljs.core.first(seq69041);
var seq69041__$1 = cljs.core.next(seq69041);
var G__69043 = cljs.core.first(seq69041__$1);
var seq69041__$2 = cljs.core.next(seq69041__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__69042,G__69043,seq69041__$2);
}));

logseq.db.common.view.get_view_property_values = (function logseq$db$common$view$get_view_property_values(db,property_ident,p__69059){
var map__69060 = p__69059;
var map__69060__$1 = cljs.core.__destructure_map(map__69060);
var view_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69060__$1,new cljs.core.Keyword(null,"view-id","view-id",1118263032));
var query_entity_ids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69060__$1,new cljs.core.Keyword(null,"query-entity-ids","query-entity-ids",2135324416));
var empty_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1((datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837)) : datascript.core.entity.call(null,db,new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837))));
var entities_result = logseq.db.common.view.get_view_entities(db,view_id);
var entities = (cljs.core.truth_(query_entity_ids)?cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__69055_SHARP_){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__69055_SHARP_) : datascript.core.entity.call(null,db,p1__69055_SHARP_));
}),query_entity_ids):((cljs.core.map_QMARK_(entities_result))?new cljs.core.Keyword(null,"ref-blocks","ref-blocks",-348598444).cljs$core$IFn$_invoke$arity$1(entities_result):entities_result
));
return logseq.common.util.distinct_by(new cljs.core.Keyword(null,"label","label",1718410804),cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (e){
var temp__5804__auto__ = logseq.db.common.view.get_property_value_content(db,e);
if(cljs.core.truth_(temp__5804__auto__)){
var label = temp__5804__auto__;
if(((clojure.string.blank_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(label))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(empty_id,new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(e))))){
return null;
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),cljs.core.str.cljs$core$IFn$_invoke$arity$1(label),new cljs.core.Keyword(null,"value","value",305978217),((datascript.impl.entity.entity_QMARK_(e))?cljs.core.select_keys(e,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null)):e)], null);
}
} else {
return null;
}
}),cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic((function (entity){
var v = cljs.core.get.cljs$core$IFn$_invoke$arity$2(entity,property_ident);
if(cljs.core.set_QMARK_(v)){
return v;
} else {
return cljs.core.PersistentHashSet.createAsIfByAssoc([v]);
}
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([entities], 0)))));
});
logseq.db.common.view.get_property_values = (function logseq$db$common$view$get_property_values(db,property_ident,p__69067){
var map__69068 = p__69067;
var map__69068__$1 = cljs.core.__destructure_map(map__69068);
var option = map__69068__$1;
var view_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69068__$1,new cljs.core.Keyword(null,"view-id","view-id",1118263032));
var _query_entity_ids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69068__$1,new cljs.core.Keyword(null,"_query-entity-ids","_query-entity-ids",-993937794));
var property = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,property_ident) : datascript.core.entity.call(null,db,property_ident));
var default_value = new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662).cljs$core$IFn$_invoke$arity$1(property);
var ref_type_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079),new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(property));
var values = (cljs.core.truth_(view_id)?logseq.db.common.view.get_view_property_values(db,property_ident,option):cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (v){
var e = ((ref_type_QMARK_)?(datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,v) : datascript.core.entity.call(null,db,v)):null);
var vec__69072 = ((ref_type_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [logseq.db.frontend.property.property_value_content(e),cljs.core.select_keys(e,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null))], null):(((!(typeof v === 'string')))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [v,v], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.str.cljs$core$IFn$_invoke$arity$1(v),v], null)
));
var label = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69072,(0),null);
var value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69072,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),label,new cljs.core.Keyword(null,"value","value",305978217),value], null);
}),cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (d){
return new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(d);
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"avet","avet",1383857032),property_ident)))));
return logseq.common.util.distinct_by(new cljs.core.Keyword(null,"label","label",1718410804),(cljs.core.truth_(default_value)?cljs.core.cons(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),logseq.db.common.view.get_property_value_content(db,default_value),new cljs.core.Keyword(null,"value","value",305978217),cljs.core.select_keys(default_value,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null))], null),values):values));
});
logseq.db.common.view.get_view_data = (function logseq$db$common$view$get_view_data(db,view_id,p__69083){
var map__69084 = p__69083;
var map__69084__$1 = cljs.core.__destructure_map(map__69084);
var opts = map__69084__$1;
var journals_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69084__$1,new cljs.core.Keyword(null,"journals?","journals?",1584679180));
var _view_for_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69084__$1,new cljs.core.Keyword(null,"_view-for-id","_view-for-id",291737978));
var view_feature_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69084__$1,new cljs.core.Keyword(null,"view-feature-type","view-feature-type",-945869610));
var group_by_property_ident = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69084__$1,new cljs.core.Keyword(null,"group-by-property-ident","group-by-property-ident",1221613316));
var input = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69084__$1,new cljs.core.Keyword(null,"input","input",556931961));
var query_entity_ids = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69084__$1,new cljs.core.Keyword(null,"query-entity-ids","query-entity-ids",2135324416));
var filters = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69084__$1,new cljs.core.Keyword(null,"filters","filters",974726919));
var sorting = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__69084__$1,new cljs.core.Keyword(null,"sorting","sorting",622249690));
if(cljs.core.truth_(journals_QMARK_)){
var ids = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),(logseq.db.get_latest_journals.cljs$core$IFn$_invoke$arity$1 ? logseq.db.get_latest_journals.cljs$core$IFn$_invoke$arity$1(db) : logseq.db.get_latest_journals.call(null,db)));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"count","count",2139924085),cljs.core.count(ids),new cljs.core.Keyword(null,"data","data",-232669377),ids], null);
} else {
var view = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,view_id) : datascript.core.entity.call(null,db,view_id));
var group_by_property = new cljs.core.Keyword("logseq.property.view","group-by-property","logseq.property.view/group-by-property",809216236).cljs$core$IFn$_invoke$arity$1(view);
var list_view_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.property.view","type.list","logseq.property.view/type.list",-1164828502),new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.property.view","type","logseq.property.view/type",218237607).cljs$core$IFn$_invoke$arity$1(view)));
var group_by_property_ident__$1 = (function (){var or__5002__auto__ = new cljs.core.Keyword("db","ident","db/ident",-737096).cljs$core$IFn$_invoke$arity$1(group_by_property);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return group_by_property_ident;
}
})();
var group_by_closed_values_QMARK_ = (!((new cljs.core.Keyword("property","closed-values","property/closed-values",1261280952).cljs$core$IFn$_invoke$arity$1(group_by_property) == null)));
var ref_property_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","valueType","db/valueType",1827971944).cljs$core$IFn$_invoke$arity$1(group_by_property),new cljs.core.Keyword("db.type","ref","db.type/ref",-1728373079));
var filters__$1 = (function (){var or__5002__auto__ = new cljs.core.Keyword("logseq.property.table","filters","logseq.property.table/filters",-1702393633).cljs$core$IFn$_invoke$arity$1(view);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return filters;
}
})();
var feat_type = (function (){var or__5002__auto__ = view_feature_type;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("logseq.property.view","feature-type","logseq.property.view/feature-type",-939141871).cljs$core$IFn$_invoke$arity$1(view);
}
})();
var query_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(feat_type,new cljs.core.Keyword(null,"query-result","query-result",-833644142));
var entities_result = ((query_QMARK_)?cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p1__69076_SHARP_){
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,p1__69076_SHARP_) : datascript.core.entity.call(null,db,p1__69076_SHARP_));
}),query_entity_ids):logseq.db.common.view.get_view_entities.cljs$core$IFn$_invoke$arity$variadic(db,view_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0)));
var entities = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(feat_type,new cljs.core.Keyword(null,"linked-references","linked-references",-2117592379)))?new cljs.core.Keyword(null,"ref-blocks","ref-blocks",-348598444).cljs$core$IFn$_invoke$arity$1(entities_result):entities_result);
var sorting__$1 = (function (){var sorting_STAR_ = new cljs.core.Keyword("logseq.property.table","sorting","logseq.property.table/sorting",208102594).cljs$core$IFn$_invoke$arity$1(view);
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(sorting_STAR_,new cljs.core.Keyword("logseq.property","empty-placeholder","logseq.property/empty-placeholder",-1595021837))) || (cljs.core.empty_QMARK_(sorting_STAR_)))){
var or__5002__auto__ = sorting;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),new cljs.core.Keyword(null,"asc?","asc?",891093427),false], null)], null);
}
} else {
return sorting_STAR_;
}
})();
var filtered_entities = ((((cljs.core.seq(filters__$1)) || ((!(clojure.string.blank_QMARK_(input))))))?cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (row){
return logseq.db.common.view.row_matched_QMARK_(db,row,filters__$1,input);
}),entities):entities);
var group_by_page_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(group_by_property_ident__$1,new cljs.core.Keyword("block","page","block/page",822314108));
var readable_property_value_or_ent = (function logseq$db$common$view$get_view_data_$_readable_property_value_or_ent(ent){
var pvalue = cljs.core.get.cljs$core$IFn$_invoke$arity$2(ent,group_by_property_ident__$1);
if(datascript.impl.entity.entity_QMARK_(pvalue)){
if(cljs.core.truth_(logseq.db.common.view.match_property_value_as_entity_QMARK_(pvalue,group_by_property))){
return pvalue;
} else {
return logseq.db.frontend.property.property_value_content(pvalue);
}
} else {
return pvalue;
}
});
var result = (cljs.core.truth_(group_by_property_ident__$1)?cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3((function (p__69101){
var vec__69102 = p__69101;
var by_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69102,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69102,(1),null);
if(group_by_page_QMARK_){
return new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551).cljs$core$IFn$_invoke$arity$1(by_value);
} else {
if(group_by_closed_values_QMARK_){
return new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(by_value);
} else {
if(ref_property_QMARK_){
return logseq.db.frontend.property.property_value_content(by_value);
} else {
return by_value;

}
}
}
}),((group_by_page_QMARK_)?(function (p1__69078_SHARP_,p2__69077_SHARP_){
return cljs.core.compare(p2__69077_SHARP_,p1__69078_SHARP_);
}):cljs.core.compare),cljs.core.seq(cljs.core.group_by(readable_property_value_or_ent,filtered_entities))):logseq.db.common.view.sort_entities(db,sorting__$1,filtered_entities));
var data_SINGLEQUOTE_ = (cljs.core.truth_(group_by_property_ident__$1)?cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__69106){
var vec__69107 = p__69106;
var by_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69107,(0),null);
var entities__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69107,(1),null);
var by_value_SINGLEQUOTE_ = ((datascript.impl.entity.entity_QMARK_(by_value))?cljs.core.select_keys(by_value,new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","ident","db/ident",-737096),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("logseq.property","value","logseq.property/value",1396524865),new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285),new cljs.core.Keyword("block","tags","block/tags",1814948340)], null)):by_value);
var pages_QMARK_ = cljs.core.not(cljs.core.some(new cljs.core.Keyword("block","page","block/page",822314108),entities__$1));
var group = ((((list_view_QMARK_) && ((!(pages_QMARK_)))))?(function (){var parent_groups = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2((function (p__69110){
var vec__69111 = p__69110;
var parent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69111,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69111,(1),null);
return new cljs.core.Keyword("block","order","block/order",-1429282437).cljs$core$IFn$_invoke$arity$1(parent);
}),cljs.core.group_by(new cljs.core.Keyword("block","parent","block/parent",-918309064),entities__$1));
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__69114){
var vec__69115 = p__69114;
var _parent = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69115,(0),null);
var blocks = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__69115,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(cljs.core.first(blocks)),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (b){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(b),new cljs.core.Keyword("block","parent","block/parent",-918309064),new cljs.core.Keyword("block","uuid","block/uuid",-1991494552).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","parent","block/parent",-918309064).cljs$core$IFn$_invoke$arity$1(b))], null);
}),logseq.db.sort_by_order(blocks))], null);
}),parent_groups);
})():cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),logseq.db.common.view.sort_entities(db,sorting__$1,entities__$1)));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [by_value_SINGLEQUOTE_,group], null);
}),result):cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","id","db/id",-1388397098),result));
var G__69119 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"count","count",2139924085),cljs.core.count(filtered_entities),new cljs.core.Keyword(null,"data","data",-232669377),cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(data_SINGLEQUOTE_)], null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(feat_type,new cljs.core.Keyword(null,"linked-references","linked-references",-2117592379))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__69119,new cljs.core.Keyword(null,"ref-pages-count","ref-pages-count",-74477634),new cljs.core.Keyword(null,"ref-pages-count","ref-pages-count",-74477634).cljs$core$IFn$_invoke$arity$1(entities_result));
} else {
return G__69119;
}

}
});

//# sourceMappingURL=logseq.db.common.view.js.map
