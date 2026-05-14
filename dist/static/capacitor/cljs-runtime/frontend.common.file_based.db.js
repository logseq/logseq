goog.provide('frontend.common.file_based.db');
/**
 * Accepts both sanitized and unsanitized namespaces
 */
frontend.common.file_based.db.get_namespace_pages = (function frontend$common$file_based$db$get_namespace_pages(db,namespace_SINGLEQUOTE_){
if(typeof namespace_SINGLEQUOTE_ === 'string'){
} else {
throw (new Error("Assert failed: (string? namespace')"));
}

var namespace_SINGLEQUOTE__SINGLEQUOTE_ = logseq.common.util.page_name_sanity_lc(namespace_SINGLEQUOTE_);
var pull_attrs = new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","original-name","block/original-name",-1620099234),new cljs.core.Keyword("block","namespace","block/namespace",-282500695),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","file","block/file",183171933),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("file","path","file/path",-191335748)], null)], null)], null);
var G__62589 = new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.List(null,new cljs.core.Symbol(null,"pull","pull",779986722,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?c","?c",870679775,null),(new cljs.core.List(null,pull_attrs,null,(1),null)),(2),null)),(3),null)),new cljs.core.Symbol(null,"...","...",-1926939749,null)], null),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Symbol(null,"%","%",-950237169,null),new cljs.core.Symbol(null,"?namespace","?namespace",567450183,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?p","?p",-10896580,null),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Symbol(null,"?namespace","?namespace",567450183,null)], null),(new cljs.core.List(null,new cljs.core.Symbol(null,"namespace","namespace",1263021155,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?p","?p",-10896580,null),(new cljs.core.List(null,new cljs.core.Symbol(null,"?c","?c",870679775,null),null,(1),null)),(2),null)),(3),null))], null);
var G__62590 = db;
var G__62591 = new cljs.core.Keyword(null,"namespace","namespace",-377510372).cljs$core$IFn$_invoke$arity$1(logseq.db.file_based.rules.rules);
var G__62592 = namespace_SINGLEQUOTE__SINGLEQUOTE_;
return (datascript.core.q.cljs$core$IFn$_invoke$arity$4 ? datascript.core.q.cljs$core$IFn$_invoke$arity$4(G__62589,G__62590,G__62591,G__62592) : datascript.core.q.call(null,G__62589,G__62590,G__62591,G__62592));
});
frontend.common.file_based.db.get_pages_by_name_partition = (function frontend$common$file_based$db$get_pages_by_name_partition(db,partition_SINGLEQUOTE_){
if(clojure.string.blank_QMARK_(partition_SINGLEQUOTE_)){
return null;
} else {
var partition_SINGLEQUOTE__SINGLEQUOTE_ = logseq.common.util.page_name_sanity_lc(clojure.string.trim(partition_SINGLEQUOTE_));
var ids = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"e","e",1381269198),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (datom){
var page = new cljs.core.Keyword(null,"v","v",21465059).cljs$core$IFn$_invoke$arity$1(datom);
return clojure.string.includes_QMARK_(page,partition_SINGLEQUOTE__SINGLEQUOTE_);
}),datascript.core.datoms.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"aevt","aevt",-585148059),new cljs.core.Keyword("block","name","block/name",1619760316))));
if(cljs.core.seq(ids)){
var G__62608 = db;
var G__62609 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","id","db/id",-1388397098),new cljs.core.Keyword("block","name","block/name",1619760316),new cljs.core.Keyword("block","title","block/title",710445684)], null);
var G__62610 = ids;
return (datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3 ? datascript.core.pull_many.cljs$core$IFn$_invoke$arity$3(G__62608,G__62609,G__62610) : datascript.core.pull_many.call(null,G__62608,G__62609,G__62610));
} else {
return null;
}
}
});

//# sourceMappingURL=frontend.common.file_based.db.js.map
