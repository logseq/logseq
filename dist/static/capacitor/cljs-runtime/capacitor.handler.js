goog.provide('capacitor.handler');
capacitor.handler._LT_load_view_data = (function capacitor$handler$_LT_load_view_data(view,opts){
return frontend.state._LT_invoke_db_worker.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("thread-api","get-view-data","thread-api/get-view-data",1976013429),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([frontend.state.get_current_repo(),new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(view),opts], 0));
});
capacitor.handler.local_db = (function capacitor$handler$local_db(){
return frontend.db.conn.get_db.cljs$core$IFn$_invoke$arity$0();
});
capacitor.handler.local_all_pages = (function capacitor$handler$local_all_pages(){
var G__99349 = capacitor.handler.local_db();
var G__99349__$1 = (((G__99349 == null))?null:logseq.db.get_all_pages(G__99349));
var G__99349__$2 = (((G__99349__$1 == null))?null:cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","created-at","block/created-at",1440015),G__99349__$1));
if((G__99349__$2 == null)){
return null;
} else {
return cljs.core.reverse(G__99349__$2);
}
});
capacitor.handler.local_page = (function capacitor$handler$local_page(name){
return logseq.db.get_page(capacitor.handler.local_db(),name);
});
capacitor.handler.sub_journals = (function capacitor$handler$sub_journals(){
return frontend.util.react(frontend.db.react.q(frontend.state.get_current_repo(),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("frontend.worker.react","journals","frontend.worker.react/journals",2109493976)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"query-fn","query-fn",-646736760),(function (){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___51227__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(capacitor.handler._LT_load_view_data(null,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"journals?","journals?",1584679180),true], null))),(function (p__99381){
var map__99382 = p__99381;
var map__99382__$1 = cljs.core.__destructure_map(map__99382);
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__99382__$1,new cljs.core.Keyword(null,"data","data",-232669377));
return promesa.protocols._promise(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,data));
}));
}));
})], null),null));
});
capacitor.handler._LT_create_page_BANG_ = (function capacitor$handler$_LT_create_page_BANG_(page_name){
var G__99383 = page_name;
var G__99384 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"redirect?","redirect?",-1229259098),false], null);
return (frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2 ? frontend.handler.page._LT_create_BANG_.cljs$core$IFn$_invoke$arity$2(G__99383,G__99384) : frontend.handler.page._LT_create_BANG_.call(null,G__99383,G__99384));
});

//# sourceMappingURL=capacitor.handler.js.map
