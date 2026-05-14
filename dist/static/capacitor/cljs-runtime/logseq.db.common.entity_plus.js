goog.provide('logseq.db.common.entity_plus');
/**
 * No such entities with these :db/ident, but `(d/entity <db> <ident>)` has been called somewhere.
 */
logseq.db.common.entity_plus.nil_db_ident_entities = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 22, [new cljs.core.Keyword("block","tx-id","block/tx-id",547556161),null,new cljs.core.Keyword("db","index","db/index",-1531680669),null,new cljs.core.Keyword("block","_refs","block/_refs",830218531),null,new cljs.core.Keyword("block","warning","block/warning",2131709542),null,new cljs.core.Keyword("block","pre-block?","block/pre-block?",-1671958521),null,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),null,new cljs.core.Keyword("db","valueType","db/valueType",1827971944),null,new cljs.core.Keyword("block.temp","fully-loaded?","block.temp/fully-loaded?",-116637365),null,new cljs.core.Keyword("block","scheduled","block/scheduled",584810412),null,new cljs.core.Keyword("block.temp","ast-body","block.temp/ast-body",-464258035),null,new cljs.core.Keyword("block.temp","has-children?","block.temp/has-children?",935519725),null,new cljs.core.Keyword("block","deadline","block/deadline",660945231),null,new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366),null,new cljs.core.Keyword("block","level","block/level",1182509971),null,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659),null,new cljs.core.Keyword("db","ident","db/ident",-737096),null,new cljs.core.Keyword("block","heading-level","block/heading-level",661361785),null,new cljs.core.Keyword("block","type","block/type",1537584409),null,new cljs.core.Keyword("block","name","block/name",1619760316),null,new cljs.core.Keyword("block.temp","ast-title","block.temp/ast-title",-940352067),null,new cljs.core.Keyword("logseq.property","_query","logseq.property/_query",-1160583010),null,new cljs.core.Keyword("block","marker","block/marker",1231576318),null], null), null);
/**
 * These db-ident entities are immutable,
 *   it means `(db/entity :block/title)` always return same result
 */
logseq.db.common.entity_plus.immutable_db_ident_entities = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 18, [new cljs.core.Keyword("logseq.property.asset","type","logseq.property.asset/type",-1142083098),null,new cljs.core.Keyword("block","link","block/link",-1872399993),null,new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),null,new cljs.core.Keyword("block","refs","block/refs",-1214495349),null,new cljs.core.Keyword("block","closed-value-property","block/closed-value-property",1157792813),null,new cljs.core.Keyword("logseq.property.asset","checksum","logseq.property.asset/checksum",-1011416979),null,new cljs.core.Keyword("logseq.property.node","display-type","logseq.property.node/display-type",442446189),null,new cljs.core.Keyword("block","created-at","block/created-at",1440015),null,new cljs.core.Keyword("block","collapsed?","block/collapsed?",2140210991),null,new cljs.core.Keyword("block","tags","block/tags",1814948340),null,new cljs.core.Keyword("block","title","block/title",710445684),null,new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267),null,new cljs.core.Keyword("logseq.property","icon","logseq.property/icon",589123285),null,new cljs.core.Keyword("block","path-refs","block/path-refs",-2109181352),null,new cljs.core.Keyword("block","parent","block/parent",-918309064),null,new cljs.core.Keyword("block","order","block/order",-1429282437),null,new cljs.core.Keyword("block","page","block/page",822314108),null,new cljs.core.Keyword("logseq.kv","db-type","logseq.kv/db-type",1106888767),null], null), null);
if(cljs.core.empty_QMARK_(cljs.core.last(clojure.data.diff(logseq.db.common.entity_plus.immutable_db_ident_entities,logseq.db.common.entity_plus.nil_db_ident_entities)))){
} else {
throw (new Error("Assert failed: (empty? (last (data/diff immutable-db-ident-entities nil-db-ident-entities)))"));
}
logseq.db.common.entity_plus.lookup_entity = cljs.core.deref(new cljs.core.Var(function(){return datascript.impl.entity.lookup_entity;},new cljs.core.Symbol("datascript.impl.entity","lookup-entity","datascript.impl.entity/lookup-entity",243995956,null),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"private","private",-558947994),new cljs.core.Keyword(null,"ns","ns",441598760),new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"file","file",-1269645878),new cljs.core.Keyword(null,"end-column","end-column",1425389514),new cljs.core.Keyword(null,"top-fn","top-fn",-2056129173),new cljs.core.Keyword(null,"column","column",2078222095),new cljs.core.Keyword(null,"line","line",212345235),new cljs.core.Keyword(null,"end-line","end-line",1837326455),new cljs.core.Keyword(null,"arglists","arglists",1661989754),new cljs.core.Keyword(null,"doc","doc",1913296891),new cljs.core.Keyword(null,"test","test",577538877)],[true,new cljs.core.Symbol(null,"datascript.impl.entity","datascript.impl.entity",1561405407,null),new cljs.core.Symbol(null,"lookup-entity","lookup-entity",-936060612,null),"datascript/impl/entity.cljc",21,new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"variadic?","variadic?",584179762),false,new cljs.core.Keyword(null,"fixed-arity","fixed-arity",1586445869),3,new cljs.core.Keyword(null,"max-fixed-arity","max-fixed-arity",-690205543),3,new cljs.core.Keyword(null,"method-params","method-params",-980792179),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"this","this",1028897902,null),new cljs.core.Symbol(null,"attr","attr",1036399174,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.with_meta(new cljs.core.Symbol(null,"this","this",1028897902,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"Entity","Entity",1953938502,null)], null)),new cljs.core.Symbol(null,"attr","attr",1036399174,null),new cljs.core.Symbol(null,"not-found","not-found",1011451547,null)], null)], null),new cljs.core.Keyword(null,"arglists","arglists",1661989754),cljs.core.list(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"this","this",1028897902,null),new cljs.core.Symbol(null,"attr","attr",1036399174,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.with_meta(new cljs.core.Symbol(null,"this","this",1028897902,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"Entity","Entity",1953938502,null)], null)),new cljs.core.Symbol(null,"attr","attr",1036399174,null),new cljs.core.Symbol(null,"not-found","not-found",1011451547,null)], null)),new cljs.core.Keyword(null,"arglists-meta","arglists-meta",1944829838),cljs.core.list(null,null)], null),1,165,165,cljs.core.list(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"this","this",1028897902,null),new cljs.core.Symbol(null,"attr","attr",1036399174,null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.with_meta(new cljs.core.Symbol(null,"this","this",1028897902,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"Entity","Entity",1953938502,null)], null)),new cljs.core.Symbol(null,"attr","attr",1036399174,null),new cljs.core.Symbol(null,"not-found","not-found",1011451547,null)], null)),null,(cljs.core.truth_(datascript.impl.entity.lookup_entity)?datascript.impl.entity.lookup_entity.cljs$lang$test:null)])));
logseq.db.common.entity_plus._STAR_seen_immutable_entities = cljs.core.volatile_BANG_(cljs.core.PersistentArrayMap.EMPTY);
logseq.db.common.entity_plus.reset_immutable_entities_cache_BANG_ = (function logseq$db$common$entity_plus$reset_immutable_entities_cache_BANG_(){
return cljs.core.vreset_BANG_(logseq.db.common.entity_plus._STAR_seen_immutable_entities,cljs.core.PersistentArrayMap.EMPTY);
});
logseq.db.common.entity_plus._STAR_reset_cache_background_task_running_QMARK_ = (new cljs.core.Delay((function (){
var temp__5804__auto__ = (((typeof frontend !== 'undefined') && (typeof frontend.common !== 'undefined') && (typeof frontend.common.missionary !== 'undefined') && (typeof frontend.common.missionary.background_task_running_QMARK_ !== 'undefined'))?(new cljs.core.Var((function (){
return frontend.common.missionary.background_task_running_QMARK_;
}),cljs.core.with_meta(new cljs.core.Symbol("frontend.common.missionary","background-task-running?","frontend.common.missionary/background-task-running?",-671689728,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("cljs.analyzer","no-resolve","cljs.analyzer/no-resolve",-1872351017),true], null)),null)):null);
if(cljs.core.truth_(temp__5804__auto__)){
var f = temp__5804__auto__;
return (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("logseq.db.common.entity-plus","reset-immutable-entities-cache!","logseq.db.common.entity-plus/reset-immutable-entities-cache!",876655830)) : f.call(null,new cljs.core.Keyword("logseq.db.common.entity-plus","reset-immutable-entities-cache!","logseq.db.common.entity-plus/reset-immutable-entities-cache!",876655830)));
} else {
return null;
}
}),null));
logseq.db.common.entity_plus.entity_memoized = (function logseq$db$common$entity_plus$entity_memoized(db,eid){
if(cljs.core.qualified_keyword_QMARK_(eid)){
if(cljs.core.contains_QMARK_(logseq.db.common.entity_plus.nil_db_ident_entities,eid)){
return null;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.deref(logseq.db.common.entity_plus._STAR_reset_cache_background_task_running_QMARK_);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.contains_QMARK_(logseq.db.common.entity_plus.immutable_db_ident_entities,eid);
} else {
return and__5000__auto__;
}
})())){
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(logseq.db.common.entity_plus._STAR_seen_immutable_entities),eid);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var r = (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,eid) : datascript.core.entity.call(null,db,eid));
if(cljs.core.truth_(r)){
logseq.db.common.entity_plus._STAR_seen_immutable_entities.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(logseq.db.common.entity_plus._STAR_seen_immutable_entities.cljs$core$IDeref$_deref$arity$1(null),eid,r));
} else {
}

return r;
}
} else {
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,eid) : datascript.core.entity.call(null,db,eid));
}
}
} else {
return (datascript.core.entity.cljs$core$IFn$_invoke$arity$2 ? datascript.core.entity.cljs$core$IFn$_invoke$arity$2(db,eid) : datascript.core.entity.call(null,db,eid));
}
});
/**
 * Whether the current graph is db-only
 */
logseq.db.common.entity_plus.db_based_graph_QMARK_ = (function logseq$db$common$entity_plus$db_based_graph_QMARK_(db){
if(cljs.core.truth_(db)){
return ("db" === new cljs.core.Keyword("kv","value","kv/value",305981670).cljs$core$IFn$_invoke$arity$1(logseq.db.common.entity_plus.entity_memoized(db,new cljs.core.Keyword("logseq.kv","db-type","logseq.kv/db-type",1106888767))));
} else {
return null;
}
});
logseq.db.common.entity_plus.get_journal_title = (function logseq$db$common$entity_plus$get_journal_title(db,e){
return logseq.common.util.date_time.int__GT_journal_title(new cljs.core.Keyword("block","journal-day","block/journal-day",-145748366).cljs$core$IFn$_invoke$arity$1(e),new cljs.core.Keyword("logseq.property.journal","title-format","logseq.property.journal/title-format",-1536497954).cljs$core$IFn$_invoke$arity$1(logseq.db.common.entity_plus.entity_memoized(db,new cljs.core.Keyword("logseq.class","Journal","logseq.class/Journal",1979741081))));
});
logseq.db.common.entity_plus.get_block_title = (function logseq$db$common$entity_plus$get_block_title(e,k,default_value){
var db = e.db;
var db_based_QMARK_ = logseq.db.common.entity_plus.db_based_graph_QMARK_(db);
if(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return logseq.db.frontend.entity_util.journal_QMARK_(e);
} else {
return and__5000__auto__;
}
})())){
return logseq.db.common.entity_plus.get_journal_title(db,e);
} else {
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(e.kv,k);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core.truth_(db_based_QMARK_)){
var result = (logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3 ? logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3(e,k,default_value) : logseq.db.common.entity_plus.lookup_entity.call(null,e,k,default_value));
var refs = new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(e);
var result_SINGLEQUOTE_ = (cljs.core.truth_((function (){var and__5000__auto__ = typeof result === 'string';
if(and__5000__auto__){
return refs;
} else {
return and__5000__auto__;
}
})())?logseq.db.frontend.content.id_ref__GT_title_ref(result,refs):result);
var or__5002__auto____$1 = result_SINGLEQUOTE_;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return default_value;
}
} else {
return (logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3 ? logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3(e,k,default_value) : logseq.db.common.entity_plus.lookup_entity.call(null,e,k,default_value));
}
}
}
});
logseq.db.common.entity_plus.lookup_kv_with_default_value = (function logseq$db$common$entity_plus$lookup_kv_with_default_value(db,e,k,default_value){
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(e.kv,k);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var result = (logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3 ? logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3(e,k,default_value) : logseq.db.common.entity_plus.lookup_entity.call(null,e,k,default_value));
if((!((result == null)))){
return result;
} else {
if(cljs.core.qualified_keyword_QMARK_(k)){
var temp__5804__auto__ = logseq.db.common.entity_plus.entity_memoized(db,k);
if(cljs.core.truth_(temp__5804__auto__)){
var property = temp__5804__auto__;
var property_type = (logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3 ? logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3(property,new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),null) : logseq.db.common.entity_plus.lookup_entity.call(null,property,new cljs.core.Keyword("logseq.property","type","logseq.property/type",83842404),null));
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword(null,"checkbox","checkbox",1612615655),property_type)){
return (logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3 ? logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3(property,new cljs.core.Keyword("logseq.property","scalar-default-value","logseq.property/scalar-default-value",1595723014),null) : logseq.db.common.entity_plus.lookup_entity.call(null,property,new cljs.core.Keyword("logseq.property","scalar-default-value","logseq.property/scalar-default-value",1595723014),null));
} else {
return (logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3 ? logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3(property,new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662),null) : logseq.db.common.entity_plus.lookup_entity.call(null,property,new cljs.core.Keyword("logseq.property","default-value","logseq.property/default-value",-892079662),null));
}
} else {
return null;
}
} else {
return null;
}
}
}
});
logseq.db.common.entity_plus.get_property_keys = (function logseq$db$common$entity_plus$get_property_keys(e){
var db = e.db;
if(cljs.core.truth_(logseq.db.common.entity_plus.db_based_graph_QMARK_(db))){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2(logseq.db.frontend.property.property_QMARK_,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"a","a",-2123407586),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"eavt","eavt",-666437073),e.eid))));
} else {
return cljs.core.keys((logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3 ? logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3(e,new cljs.core.Keyword("block","properties","block/properties",708347145),null) : logseq.db.common.entity_plus.lookup_entity.call(null,e,new cljs.core.Keyword("block","properties","block/properties",708347145),null)));
}
});
logseq.db.common.entity_plus.get_properties = (function logseq$db$common$entity_plus$get_properties(e){
var db = e.db;
if(cljs.core.truth_(logseq.db.common.entity_plus.db_based_graph_QMARK_(db))){
var G__59601 = e;
var G__59602 = new cljs.core.Keyword("block","properties","block/properties",708347145);
var G__59603 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p__59604){
var vec__59605 = p__59604;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__59605,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__59605,(1),null);
return logseq.db.frontend.property.property_QMARK_(k);
}),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,e)));
return (logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3 ? logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3(G__59601,G__59602,G__59603) : logseq.db.common.entity_plus.lookup_entity.call(null,G__59601,G__59602,G__59603));
} else {
return (logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3 ? logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3(e,new cljs.core.Keyword("block","properties","block/properties",708347145),null) : logseq.db.common.entity_plus.lookup_entity.call(null,e,new cljs.core.Keyword("block","properties","block/properties",708347145),null));
}
});
logseq.db.common.entity_plus.lookup_kv_then_entity = (function logseq$db$common$entity_plus$lookup_kv_then_entity(var_args){
var G__59614 = arguments.length;
switch (G__59614) {
case 2:
return logseq.db.common.entity_plus.lookup_kv_then_entity.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return logseq.db.common.entity_plus.lookup_kv_then_entity.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.db.common.entity_plus.lookup_kv_then_entity.cljs$core$IFn$_invoke$arity$2 = (function (e,k){
return logseq.db.common.entity_plus.lookup_kv_then_entity.cljs$core$IFn$_invoke$arity$3(e,k,null);
}));

(logseq.db.common.entity_plus.lookup_kv_then_entity.cljs$core$IFn$_invoke$arity$3 = (function (e,k,default_value){
try{if(cljs.core.truth_(k)){
var db = e.db;
var G__59626 = k;
var G__59626__$1 = (((G__59626 instanceof cljs.core.Keyword))?G__59626.fqn:null);
switch (G__59626__$1) {
case "block/raw-title":
if(cljs.core.truth_((function (){var and__5000__auto__ = logseq.db.common.entity_plus.db_based_graph_QMARK_(db);
if(cljs.core.truth_(and__5000__auto__)){
return logseq.db.frontend.entity_util.journal_QMARK_(e);
} else {
return and__5000__auto__;
}
})())){
return logseq.db.common.entity_plus.get_journal_title(db,e);
} else {
return (logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3 ? logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3(e,new cljs.core.Keyword("block","title","block/title",710445684),default_value) : logseq.db.common.entity_plus.lookup_entity.call(null,e,new cljs.core.Keyword("block","title","block/title",710445684),default_value));
}

break;
case "block/properties":
return logseq.db.common.entity_plus.get_properties(e);

break;
case "block.temp/property-keys":
return logseq.db.common.entity_plus.get_property_keys(e);

break;
case "block/title":
var or__5002__auto__ = new cljs.core.Keyword("block.temp","cached-title","block.temp/cached-title",1568935493).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(e.cache));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var title = logseq.db.common.entity_plus.get_block_title(e,k,default_value);
cljs.core.vreset_BANG_(e.cache,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(e.cache),new cljs.core.Keyword("block.temp","cached-title","block.temp/cached-title",1568935493),title));

return title;
}

break;
case "block/_parent":
return cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (e__$1){
var or__5002__auto__ = new cljs.core.Keyword("logseq.property","created-from-property","logseq.property/created-from-property",-861892267).cljs$core$IFn$_invoke$arity$1(e__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","closed-value-property","block/closed-value-property",1157792813).cljs$core$IFn$_invoke$arity$1(e__$1);
}
}),(logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3 ? logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3(e,k,default_value) : logseq.db.common.entity_plus.lookup_entity.call(null,e,k,default_value))));

break;
case "block/_raw-parent":
return (logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3 ? logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3(e,new cljs.core.Keyword("block","_parent","block/_parent",-639389670),default_value) : logseq.db.common.entity_plus.lookup_entity.call(null,e,new cljs.core.Keyword("block","_parent","block/_parent",-639389670),default_value));

break;
case "property/closed-values":
var G__59632 = (logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3 ? logseq.db.common.entity_plus.lookup_entity.cljs$core$IFn$_invoke$arity$3(e,new cljs.core.Keyword("block","_closed-value-property","block/_closed-value-property",-1361451442),default_value) : logseq.db.common.entity_plus.lookup_entity.call(null,e,new cljs.core.Keyword("block","_closed-value-property","block/_closed-value-property",-1361451442),default_value));
if((G__59632 == null)){
return null;
} else {
return cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","order","block/order",-1429282437),G__59632);
}

break;
default:
return logseq.db.common.entity_plus.lookup_kv_with_default_value(db,e,k,default_value);

}
} else {
return null;
}
}catch (e59616){var e__$1 = e59616;
return console.error(e__$1);
}}));

(logseq.db.common.entity_plus.lookup_kv_then_entity.cljs$lang$maxFixedArity = 3);

logseq.db.common.entity_plus.cache_with_kv = (function logseq$db$common$entity_plus$cache_with_kv(this$){
var v = cljs.core.deref(this$.cache);
var v_SINGLEQUOTE_ = (cljs.core.truth_(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(v))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(v,new cljs.core.Keyword("block","title","block/title",710445684),logseq.db.frontend.content.id_ref__GT_title_ref(new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(v),new cljs.core.Keyword("block","refs","block/refs",-1214495349).cljs$core$IFn$_invoke$arity$1(this$))):v);
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.seq(v_SINGLEQUOTE_),cljs.core.seq(this$.kv));
});
(datascript.impl.entity.Entity.prototype.cljs$core$IEncodeJS$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.impl.entity.Entity.prototype.cljs$core$IEncodeJS$_clj__GT_js$arity$1 = (function (_this){
var _this__$1 = this;
return null;
}));

(datascript.impl.entity.Entity.prototype.cljs$core$IAssociative$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.impl.entity.Entity.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this$,k,v){
var this$__$1 = this;
if((k instanceof cljs.core.Keyword)){
} else {
throw (new Error(["Assert failed: ","attribute must be keyword","\n","(keyword? k)"].join('')));
}

(this$__$1.kv = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(this$__$1.kv,k,v));

return this$__$1;
}));

(datascript.impl.entity.Entity.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (e,k){
var e__$1 = this;
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("logseq.db.common.entity-plus","nf","logseq.db.common.entity-plus/nf",512087449),logseq.db.common.entity_plus.lookup_kv_then_entity.cljs$core$IFn$_invoke$arity$3(e__$1,k,new cljs.core.Keyword("logseq.db.common.entity-plus","nf","logseq.db.common.entity-plus/nf",512087449)));
}));

(datascript.impl.entity.Entity.prototype.cljs$core$IMap$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.impl.entity.Entity.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this$,k){
var this$__$1 = this;
if((k instanceof cljs.core.Keyword)){
} else {
throw (new Error(["Assert failed: ",["attribute must be keyword: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(k)].join(''),"\n","(keyword? k)"].join('')));
}

(this$__$1.kv = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(this$__$1.kv,k));

return this$__$1;
}));

(datascript.impl.entity.Entity.prototype.cljs$core$ISeqable$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.impl.entity.Entity.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this$){
var this$__$1 = this;
datascript.impl.entity.touch(this$__$1);

return logseq.db.common.entity_plus.cache_with_kv(this$__$1);
}));

(datascript.impl.entity.Entity.prototype.cljs$core$IPrintWithWriter$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.impl.entity.Entity.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this$,writer,opts){
var this$__$1 = this;
var m = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,logseq.db.common.entity_plus.cache_with_kv(this$__$1)),new cljs.core.Keyword("db","id","db/id",-1388397098),this$__$1.eid);
return cljs.core._pr_writer(m,writer,opts);
}));

(datascript.impl.entity.Entity.prototype.cljs$core$ICollection$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.impl.entity.Entity.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this$,entry){
var this$__$1 = this;
if(cljs.core.vector_QMARK_(entry)){
var vec__59642 = entry;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__59642,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__59642,(1),null);
return this$__$1.cljs$core$IAssociative$_assoc$arity$3(null,k,v);
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (this$__$2,p__59645){
var vec__59646 = p__59645;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__59646,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__59646,(1),null);
return cljs.core._assoc(this$__$2,k,v);
}),this$__$1,entry);
}
}));

(datascript.impl.entity.Entity.prototype.cljs$core$ILookup$ = cljs.core.PROTOCOL_SENTINEL);

(datascript.impl.entity.Entity.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this$,attr){
var this$__$1 = this;
return logseq.db.common.entity_plus.lookup_kv_then_entity.cljs$core$IFn$_invoke$arity$2(this$__$1,attr);
}));

(datascript.impl.entity.Entity.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this$,attr,not_found){
var this$__$1 = this;
return logseq.db.common.entity_plus.lookup_kv_then_entity.cljs$core$IFn$_invoke$arity$3(this$__$1,attr,not_found);
}));

//# sourceMappingURL=logseq.db.common.entity_plus.js.map
