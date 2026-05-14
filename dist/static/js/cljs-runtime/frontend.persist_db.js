goog.provide('frontend.persist_db');
if((typeof frontend !== 'undefined') && (typeof frontend.persist_db !== 'undefined') && (typeof frontend.persist_db.opfs_db !== 'undefined')){
} else {
frontend.persist_db.opfs_db = frontend.persist_db.browser.__GT_InBrowser();
}
/**
 * Get the actual implementation of PersistentDB
 */
frontend.persist_db.get_impl = (function frontend$persist_db$get_impl(){
return frontend.persist_db.opfs_db;
});
frontend.persist_db._LT_list_db = (function frontend$persist_db$_LT_list_db(){
return frontend.persist_db.get_impl().frontend$persist_db$protocol$PersistentDB$_LT_list_db$arity$1(null);
});
frontend.persist_db._LT_unsafe_delete = (function frontend$persist_db$_LT_unsafe_delete(repo){
if(cljs.core.truth_(repo)){
return frontend.persist_db.get_impl().frontend$persist_db$protocol$PersistentDB$_LT_unsafe_delete$arity$2(null,repo);
} else {
return null;
}
});
frontend.persist_db._LT_export_db = (function frontend$persist_db$_LT_export_db(repo,opts){
if(cljs.core.truth_(repo)){
return frontend.persist_db.get_impl().frontend$persist_db$protocol$PersistentDB$_LT_export_db$arity$3(null,repo,opts);
} else {
return null;
}
});
frontend.persist_db._LT_import_db = (function frontend$persist_db$_LT_import_db(repo,data){
if(cljs.core.truth_(repo)){
return frontend.persist_db.get_impl().frontend$persist_db$protocol$PersistentDB$_LT_import_db$arity$3(null,repo,data);
} else {
return null;
}
});
frontend.persist_db._LT_fetch_init_data = (function frontend$persist_db$_LT_fetch_init_data(var_args){
var G__102450 = arguments.length;
switch (G__102450) {
case 1:
return frontend.persist_db._LT_fetch_init_data.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.persist_db._LT_fetch_init_data.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.persist_db._LT_fetch_init_data.cljs$core$IFn$_invoke$arity$1 = (function (repo){
return frontend.persist_db._LT_fetch_init_data.cljs$core$IFn$_invoke$arity$2(repo,cljs.core.PersistentArrayMap.EMPTY);
}));

(frontend.persist_db._LT_fetch_init_data.cljs$core$IFn$_invoke$arity$2 = (function (repo,opts){
if(cljs.core.truth_(repo)){
return frontend.persist_db.get_impl().frontend$persist_db$protocol$PersistentDB$_LT_fetch_initial_data$arity$3(null,repo,opts);
} else {
return null;
}
}));

(frontend.persist_db._LT_fetch_init_data.cljs$lang$maxFixedArity = 2);

frontend.persist_db._LT_new = (function frontend$persist_db$_LT_new(repo,opts){
if((cljs.core.count(repo) <= (128))){
} else {
throw (new Error("Assert failed: (<= (count repo) 128)"));
}

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41643__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db.get_impl().frontend$persist_db$protocol$PersistentDB$_LT_new$arity$3(null,repo,opts)),(function (_){
return promesa.protocols._promise(frontend.persist_db._LT_export_db(repo,cljs.core.PersistentArrayMap.EMPTY));
}));
}));
});
frontend.persist_db.export_current_graph_BANG_ = (function frontend$persist_db$export_current_graph_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___102487 = arguments.length;
var i__5727__auto___102488 = (0);
while(true){
if((i__5727__auto___102488 < len__5726__auto___102487)){
args__5732__auto__.push((arguments[i__5727__auto___102488]));

var G__102489 = (i__5727__auto___102488 + (1));
i__5727__auto___102488 = G__102489;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.persist_db.export_current_graph_BANG_.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.persist_db.export_current_graph_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (p__102460){
var map__102461 = p__102460;
var map__102461__$1 = cljs.core.__destructure_map(map__102461);
var succ_notification_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102461__$1,new cljs.core.Keyword(null,"succ-notification?","succ-notification?",-1467312225));
var force_save_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102461__$1,new cljs.core.Keyword(null,"force-save?","force-save?",-1690725991));
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
if(cljs.core.truth_((function (){var or__5002__auto__ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(repo);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return force_save_QMARK_;
}
})())){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"save-db-to-disk","save-db-to-disk",-1395283400),repo], 0));

return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___41621__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.persist_db._LT_export_db(repo,cljs.core.PersistentArrayMap.EMPTY)),(function (___41611__auto__){
return promesa.protocols._promise((cljs.core.truth_(succ_notification_QMARK_)?frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"content","content",15833224),"The current db has been saved successfully to the disk.",new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"success","success",1890645906)], null)], null)):null));
}));
})),(function (error){
console.error(error);

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("notification","show","notification/show",1864741804),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"content","content",15833224),cljs.core.str.cljs$core$IFn$_invoke$arity$1(error.getMessage()),new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"clear?","clear?",1363344639),false], null)], null));
}));
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
}));

(frontend.persist_db.export_current_graph_BANG_.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.persist_db.export_current_graph_BANG_.cljs$lang$applyTo = (function (seq102451){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq102451));
}));

frontend.persist_db.run_export_periodically_BANG_ = (function frontend$persist_db$run_export_periodically_BANG_(){
return setInterval(frontend.persist_db.export_current_graph_BANG_,(((3) * (60)) * (1000)));
});

//# sourceMappingURL=frontend.persist_db.js.map
