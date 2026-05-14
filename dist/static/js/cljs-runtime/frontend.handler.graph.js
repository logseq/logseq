goog.provide('frontend.handler.graph');
/**
 * Get all nodes that are n hops from nodes (a collection of node ids)
 */
frontend.handler.graph.n_hops = (function frontend$handler$graph$n_hops(p__105149,nodes,level){
var map__105151 = p__105149;
var map__105151__$1 = cljs.core.__destructure_map(map__105151);
var graph = map__105151__$1;
var links = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__105151__$1,new cljs.core.Keyword(null,"links","links",-654507394));
var search_nodes = (function (forward_QMARK_){
var links__$1 = cljs.core.group_by((cljs.core.truth_(forward_QMARK_)?new cljs.core.Keyword(null,"source","source",-433931539):new cljs.core.Keyword(null,"target","target",253001721)),links);
var nodes__$1 = nodes;
var level__$1 = level;
while(true){
if((level__$1 === (0))){
return nodes__$1;
} else {
var G__105191 = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.concat,nodes__$1,cljs.core.map.cljs$core$IFn$_invoke$arity$2(((function (nodes__$1,level__$1,links__$1,map__105151,map__105151__$1,graph,links){
return (function (id){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((cljs.core.truth_(forward_QMARK_)?new cljs.core.Keyword(null,"target","target",253001721):new cljs.core.Keyword(null,"source","source",-433931539)),cljs.core.get.cljs$core$IFn$_invoke$arity$2(links__$1,id));
});})(nodes__$1,level__$1,links__$1,map__105151,map__105151__$1,graph,links))
,nodes__$1)));
var G__105192 = (level__$1 - (1));
nodes__$1 = G__105191;
level__$1 = G__105192;
continue;
}
break;
}
});
var nodes__$1 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(search_nodes(true),search_nodes(false));
var nodes__$2 = cljs.core.set(nodes__$1);
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(graph,new cljs.core.Keyword(null,"nodes","nodes",-2099585805),(function (full_nodes){
return cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (node){
return cljs.core.contains_QMARK_(nodes__$2,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(node));
}),full_nodes);
}));
});
frontend.handler.graph.settle_metadata_to_local_BANG_ = (function frontend$handler$graph$settle_metadata_to_local_BANG_(m){
var temp__5804__auto__ = frontend.state.get_current_repo();
if(cljs.core.truth_(temp__5804__auto__)){
var repo = temp__5804__auto__;
try{var k = new cljs.core.Keyword(null,"ls-graphs-metadata","ls-graphs-metadata",-1508025687);
var ret = (function (){var or__5002__auto__ = frontend.storage.get(k);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})();
var ret__$1 = cljs.core.update.cljs$core$IFn$_invoke$arity$5(ret,repo,cljs.core.merge,m,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"_v","_v",-1396693276),Date.now()], null));
return frontend.storage.set(k,ret__$1);
}catch (e105175){if((e105175 instanceof Error)){
var e = e105175;
return console.warn(e);
} else {
throw e105175;

}
}} else {
return null;
}
});
frontend.handler.graph.get_metadata_local = (function frontend$handler$graph$get_metadata_local(){
var k = new cljs.core.Keyword(null,"ls-graphs-metadata","ls-graphs-metadata",-1508025687);
return frontend.storage.get(k);
});

//# sourceMappingURL=frontend.handler.graph.js.map
