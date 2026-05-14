goog.provide('frontend.external.roam_export');
frontend.external.roam_export.todo_marker_regex = /^(NOW|LATER|TODO|DOING|WAITING|WAIT|CANCELED|CANCELLED|STARTED|IN-PROGRESS)/;
frontend.external.roam_export.done_marker_regex = /^DONE/;
frontend.external.roam_export.nano_char_range = "_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
frontend.external.roam_export.nano_id_char = (function frontend$external$roam_export$nano_id_char(){
return cljs.core.rand_nth(frontend.external.roam_export.nano_char_range);
});
frontend.external.roam_export.nano_id = (function frontend$external$roam_export$nano_id(){
return clojure.string.join.cljs$core$IFn$_invoke$arity$1(cljs.core.repeatedly.cljs$core$IFn$_invoke$arity$2((9),frontend.external.roam_export.nano_id_char));
});
frontend.external.roam_export._LT_uuid__GT_uid_map = (function frontend$external$roam_export$_LT_uuid__GT_uid_map(){
var repo = frontend.state.get_current_repo();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((function (){var G__65115 = repo;
var G__65116 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"transact-db?","transact-db?",1279612399),false], null);
var G__65117 = new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"find","find",496279456),cljs.core.list(new cljs.core.Symbol(null,"pull","pull",779986722,null),new cljs.core.Symbol(null,"?r","?r",-516400708,null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("block","uuid","block/uuid",-1991494552)], null)),new cljs.core.Keyword(null,"in","in",-1531184865),new cljs.core.Symbol(null,"$","$",-1580747756,null),new cljs.core.Keyword(null,"where","where",-2044795965),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"?b","?b",1575118075,null),new cljs.core.Keyword("block","refs","block/refs",-1214495349),new cljs.core.Symbol(null,"?r","?r",-516400708,null)], null)], null);
return (frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3 ? frontend.db.async._LT_q.cljs$core$IFn$_invoke$arity$3(G__65115,G__65116,G__65117) : frontend.db.async._LT_q.call(null,G__65115,G__65116,G__65117));
})()),(function (result){
return promesa.protocols._promise(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (uuid){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [uuid,frontend.external.roam_export.nano_id()], null);
}),cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),cljs.core.first),result)))));
}));
}));
});
frontend.external.roam_export.update_content = (function frontend$external$roam_export$update_content(content,uuid__GT_uid_map){
if(cljs.core.truth_(content)){
var uuids = cljs.core.keys(uuid__GT_uid_map);
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,uuid){
if(clojure.string.includes_QMARK_(acc,cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid))){
return clojure.string.replace(acc,cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid),cljs.core.get.cljs$core$IFn$_invoke$arity$2(uuid__GT_uid_map,uuid));
} else {
return acc;
}
}),content,uuids);
} else {
return null;
}
});
frontend.external.roam_export.update_uid = (function frontend$external$roam_export$update_uid(p__65126,uuid__GT_uid_map){
var map__65127 = p__65126;
var map__65127__$1 = cljs.core.__destructure_map(map__65127);
var b = map__65127__$1;
var uuid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65127__$1,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65127__$1,new cljs.core.Keyword("block","title","block/title",710445684));
var G__65128 = b;
var G__65128__$1 = ((cljs.core.contains_QMARK_(uuid__GT_uid_map,uuid))?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__65128,new cljs.core.Keyword("block","uid","block/uid",-1623585167),cljs.core.get.cljs$core$IFn$_invoke$arity$2(uuid__GT_uid_map,uuid)):G__65128);
if(cljs.core.truth_(cljs.core.some((function (id){
return clojure.string.includes_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(title),cljs.core.str.cljs$core$IFn$_invoke$arity$1(id));
}),cljs.core.keys(uuid__GT_uid_map)))){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__65128__$1,new cljs.core.Keyword("block","title","block/title",710445684),(function (p1__65125_SHARP_){
return frontend.external.roam_export.update_content(p1__65125_SHARP_,uuid__GT_uid_map);
}));
} else {
return G__65128__$1;
}
});
frontend.external.roam_export.update_todo = (function frontend$external$roam_export$update_todo(p__65129){
var map__65130 = p__65129;
var map__65130__$1 = cljs.core.__destructure_map(map__65130);
var block = map__65130__$1;
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__65130__$1,new cljs.core.Keyword("block","title","block/title",710445684));
if(cljs.core.truth_(title)){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","title","block/title",710445684),(function (c){
return clojure.string.trim(clojure.string.replace(clojure.string.replace(clojure.string.replace(c,frontend.external.roam_export.todo_marker_regex,"{{[[TODO]]}}"),frontend.external.roam_export.done_marker_regex,"{{[[DONE]]}}"),"{{embed ","{{embed: "));
}));
} else {
return block;
}
});
frontend.external.roam_export.traverse = (function frontend$external$roam_export$traverse(keyseq,vec_tree){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.external.roam_export._LT_uuid__GT_uid_map()),(function (uuid__GT_uid_map){
return promesa.protocols._promise(clojure.walk.postwalk((function (x){
if(((cljs.core.map_QMARK_(x)) && (cljs.core.contains_QMARK_(x,new cljs.core.Keyword("block","uuid","block/uuid",-1991494552))))){
return cljs.core.select_keys(clojure.set.rename_keys(frontend.external.roam_export.update_todo(frontend.external.roam_export.update_uid(x,uuid__GT_uid_map)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("block","title","block/title",710445684),new cljs.core.Keyword("page","title","page/title",628894782)], null)),keyseq);
} else {
return x;

}
}),vec_tree));
}));
}));
});

//# sourceMappingURL=frontend.external.roam_export.js.map
