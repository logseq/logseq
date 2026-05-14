goog.provide('frontend.db.restore');
/**
 * Restore db from SQLite
 */
frontend.db.restore.restore_graph_BANG_ = (function frontend$db$restore$restore_graph_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___105065 = arguments.length;
var i__5727__auto___105066 = (0);
while(true){
if((i__5727__auto___105066 < len__5726__auto___105065)){
args__5732__auto__.push((arguments[i__5727__auto___105066]));

var G__105067 = (i__5727__auto___105066 + (1));
i__5727__auto___105066 = G__105067;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.db.restore.restore_graph_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.db.restore.restore_graph_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (repo,p__105057){
var map__105058 = p__105057;
var map__105058__$1 = cljs.core.__destructure_map(map__105058);
var opts = map__105058__$1;
frontend.state.set_state_BANG_(new cljs.core.Keyword("graph","loading?","graph/loading?",1937181019),true);

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs_time.core.now()),(function (start_time){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db._LT_fetch_init_data.cljs$core$IFn$_invoke$arity$2(repo,opts)),(function (p__105059){
var map__105060 = p__105059;
var map__105060__$1 = cljs.core.__destructure_map(map__105060);
var schema = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105060__$1,new cljs.core.Keyword(null,"schema","schema",-1582001791));
var initial_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105060__$1,new cljs.core.Keyword(null,"initial-data","initial-data",-1315709804));
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_current_repo_BANG_(repo)),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise((((schema == null))?(function(){throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("No valid schema found when reloading db",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo], null))})():null)),(function (___$1){
return promesa.protocols._mcat(promesa.protocols._promise((function (){try{return (datascript.core.conn_from_datoms.cljs$core$IFn$_invoke$arity$2 ? datascript.core.conn_from_datoms.cljs$core$IFn$_invoke$arity$2(initial_data,schema) : datascript.core.conn_from_datoms.call(null,initial_data,schema));
}catch (e105062){var e = e105062;
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"restore-initial-data-failed","restore-initial-data-failed",1187592914),logseq.db.write_transit_str(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"schema","schema",-1582001791),schema,new cljs.core.Keyword(null,"initial-data","initial-data",-1315709804),initial_data], null))], 0));

console.error(e);

throw e;
}})()),(function (conn){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.undo_redo.listen_db_changes_BANG_(repo,conn)),(function (___$2){
return promesa.protocols._mcat(promesa.protocols._promise((frontend.db.conn.get_repo_path.cljs$core$IFn$_invoke$arity$1 ? frontend.db.conn.get_repo_path.cljs$core$IFn$_invoke$arity$1(repo) : frontend.db.conn.get_repo_path.call(null,repo))),(function (db_name){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(frontend.db.conn.conns,cljs.core.assoc,db_name,conn)),(function (___$3){
return promesa.protocols._mcat(promesa.protocols._promise(cljs_time.core.now()),(function (end_time){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("frontend.db.restore","restore-graph!","frontend.db.restore/restore-graph!",1952543649),"loads",cljs.core.count(initial_data),"datoms in",cljs_time.core.in_millis(cljs_time.core.interval(start_time,end_time)),"ms"], 0))),(function (___41611__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","restored","graph/restored",1296384092),repo], null))),(function (___41611__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("graph","loading?","graph/loading?",1937181019),false)),(function (___41611__auto____$2){
return promesa.protocols._promise(frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","re-render-root","ui/re-render-root",-1358783476)], null)));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));
}));

(frontend.db.restore.restore_graph_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.db.restore.restore_graph_BANG_.cljs$lang$applyTo = (function (seq105050){
var G__105051 = cljs.core.first(seq105050);
var seq105050__$1 = cljs.core.next(seq105050);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__105051,seq105050__$1);
}));


//# sourceMappingURL=frontend.db.restore.js.map
