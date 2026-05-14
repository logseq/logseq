goog.provide('frontend.worker.db.fix');
frontend.worker.db.fix.check_and_fix_schema_BANG_ = (function frontend$worker$db$fix$check_and_fix_schema_BANG_(repo,conn){
var schema = logseq.db.get_schema(repo);
var db_schema = new cljs.core.Keyword(null,"schema","schema",-1582001791).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(conn));
var diffs = cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (p__130487){
var vec__130488 = p__130487;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130488,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130488,(1),null);
var schema_v = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$2(db_schema,k),new cljs.core.Keyword("db","ident","db/ident",-737096));
var schema_v_SINGLEQUOTE_ = (function (){var G__130495 = schema_v;
var G__130495__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659).cljs$core$IFn$_invoke$arity$1(schema_v),new cljs.core.Keyword("db.cardinality","one","db.cardinality/one",1428352190)))?cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__130495,new cljs.core.Keyword("db","cardinality","db/cardinality",-104975659)):G__130495);
if(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword("db","index","db/index",-1531680669).cljs$core$IFn$_invoke$arity$1(schema_v);
if(cljs.core.truth_(and__5000__auto__)){
return (new cljs.core.Keyword("db","index","db/index",-1531680669).cljs$core$IFn$_invoke$arity$1(v) == null);
} else {
return and__5000__auto__;
}
})())){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__130495__$1,new cljs.core.Keyword("db","index","db/index",-1531680669));
} else {
return G__130495__$1;
}
})();
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v,schema_v_SINGLEQUOTE_)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,new cljs.core.Keyword("db","ident","db/ident",-737096))))){
return null;
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(v,new cljs.core.Keyword("db","ident","db/ident",-737096),k);
}
}),schema);
if(cljs.core.seq(diffs)){
return (datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2 ? datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn,diffs) : datascript.core.transact_BANG_.call(null,conn,diffs));
} else {
return null;
}
});

//# sourceMappingURL=frontend.worker.db.fix.js.map
