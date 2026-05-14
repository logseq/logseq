goog.provide('frontend.mobile.deeplink');
frontend.mobile.deeplink._STAR_link_to_another_graph = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
frontend.mobile.deeplink.deeplink = (function frontend$mobile$deeplink$deeplink(url){
var parsed_url = goog.Uri.parse(url);
var hostname = parsed_url.getDomain();
var pathname = parsed_url.getPath();
var search_params = parsed_url.getQueryData();
var current_repo_url = frontend.state.get_current_repo();
var get_graph_name_fn = (function (p1__88976_SHARP_){
return clojure.string.lower_case(cljs.core.last(clojure.string.split.cljs$core$IFn$_invoke$arity$2(frontend.util.text.get_graph_name_from_path(p1__88976_SHARP_),"/")));
});
var current_graph_name = get_graph_name_fn(current_repo_url);
var repos = cljs.core.map.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"url","url",276297046),cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__88979_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(p1__88979_SHARP_),frontend.config.demo_repo);
}),frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"me","me",-139006693),new cljs.core.Keyword(null,"repos","repos",647483789)], null))));
var repo_names = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__88980_SHARP_){
return get_graph_name_fn(p1__88980_SHARP_);
}),repos);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(hostname,"graph")){
var graph_name = (function (){var G__88991 = pathname;
var G__88991__$1 = (((G__88991 == null))?null:clojure.string.replace(G__88991,"/",""));
if((G__88991__$1 == null)){
return null;
} else {
return clojure.string.lower_case(G__88991__$1);
}
})();
var vec__88988 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__88981_SHARP_){
return search_params.get(p1__88981_SHARP_);
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["page","block-id"], null));
var page_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88988,(0),null);
var block_uuid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__88988,(1),null);
if(clojure.string.blank_QMARK_(graph_name)){
return null;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(graph_name,current_graph_name)){
} else {
var graph_idx_88995 = repo_names.indexOf(graph_name);
var graph_url_88996 = ((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(graph_idx_88995,(-1)))?cljs.core.nth.cljs$core$IFn$_invoke$arity$2(repos,graph_idx_88995):null);
if(cljs.core.truth_(graph_url_88996)){
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","switch","graph/switch",178853840),graph_url_88996], null));

cljs.core.reset_BANG_(frontend.mobile.deeplink._STAR_link_to_another_graph,true);
} else {
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(["Open graph failed. Graph `",graph_name,"` doesn't exist."].join(''),new cljs.core.Keyword(null,"error","error",-978969032),false);
}
}

if(cljs.core.truth_((function (){var or__5002__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(graph_name,current_graph_name);
if(or__5002__auto__){
return or__5002__auto__;
} else {
return cljs.core.deref(frontend.mobile.deeplink._STAR_link_to_another_graph);
}
})())){
return setTimeout((function (){
if(cljs.core.truth_(page_name)){
var db_page_name_88997 = frontend.db.model.get_redirect_page_name.cljs$core$IFn$_invoke$arity$1(page_name);
frontend.handler.editor.insert_first_page_block_if_not_exists_BANG_(db_page_name_88997);
} else {
if(cljs.core.truth_(block_uuid)){
promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.db.async._LT_get_block.cljs$core$IFn$_invoke$arity$variadic(frontend.state.get_current_repo(),block_uuid,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"children?","children?",-1199594108),false], null)], 0))),(function (block){
return promesa.protocols._promise((cljs.core.truth_(block)?frontend.handler.route.redirect_to_page_BANG_.cljs$core$IFn$_invoke$arity$1(block_uuid):frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(["Open link failed. Block-id `",cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_uuid),"` doesn't exist in the graph.",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"result","result",1415092211)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(block)].join(''),new cljs.core.Keyword(null,"error","error",-978969032),false)));
}));
}));
} else {

}
}

return cljs.core.reset_BANG_(frontend.mobile.deeplink._STAR_link_to_another_graph,false);
}),(cljs.core.truth_(cljs.core.deref(frontend.mobile.deeplink._STAR_link_to_another_graph))?(1000):(0)));
} else {
return null;
}
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(hostname,"shared")){
var result = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (key){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(key),search_params.get(key)], null);
}),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["title","url","type","payload"], null)));
if(cljs.core.truth_(new cljs.core.Keyword(null,"payload","payload",-383036092).cljs$core$IFn$_invoke$arity$1(result))){
var raw = logseq.common.util.safe_decode_uri_component(new cljs.core.Keyword(null,"payload","payload",-383036092).cljs$core$IFn$_invoke$arity$1(result));
var payload = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(JSON.parse(raw),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
return frontend.mobile.intent.handle_payload(payload);
} else {
return frontend.mobile.intent.handle_result(result);
}
} else {
return null;

}
}
});

//# sourceMappingURL=frontend.mobile.deeplink.js.map
