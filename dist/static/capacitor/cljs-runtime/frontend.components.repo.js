goog.provide('frontend.components.repo');
goog.scope(function(){
  frontend.components.repo.goog$module$goog$object = goog.module.get('goog.object');
});
frontend.components.repo.normalized_graph_label = rum.core.lazy_build(rum.core.build_defc,(function (p__90117,on_click){
var map__90118 = p__90117;
var map__90118__$1 = cljs.core.__destructure_map(map__90118);
var graph = map__90118__$1;
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90118__$1,new cljs.core.Keyword(null,"url","url",276297046));
var remote_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90118__$1,new cljs.core.Keyword(null,"remote?","remote?",-517415110));
var GraphName = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90118__$1,new cljs.core.Keyword(null,"GraphName","GraphName",-960661337));
var GraphUUID = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90118__$1,new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531));
if(cljs.core.truth_(graph)){
var attrs90113 = ((((frontend.config.local_file_based_graph_QMARK_(url)) || (frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(url))))?(function (){var local_dir = frontend.config.get_local_dir(url);
var graph_name = frontend.util.text.get_graph_name_from_path(url);
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center","a.flex.items-center",46069439),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),local_dir,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (on_click.cljs$core$IFn$_invoke$arity$1 ? on_click.cljs$core$IFn$_invoke$arity$1(graph) : on_click.call(null,graph));
})], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),graph_name,(cljs.core.truth_(GraphName)?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.px-1","strong.px-1",1812175159),"(",GraphName,")"], null):null)], null),(cljs.core.truth_(remote_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.pr-1.flex.items-center","strong.pr-1.flex.items-center",1744293922),frontend.ui.icon("cloud")], null):null)], null);
})():new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center","a.flex.items-center",46069439),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),GraphUUID,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (on_click.cljs$core$IFn$_invoke$arity$1 ? on_click.cljs$core$IFn$_invoke$arity$1(graph) : on_click.call(null,graph));
})], null),(function (){var G__90122 = (function (){var or__5002__auto__ = url;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return GraphName;
}
})();
return (frontend.db.get_repo_path.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_repo_path.cljs$core$IFn$_invoke$arity$1(G__90122) : frontend.db.get_repo_path.call(null,G__90122));
})(),(cljs.core.truth_(remote_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong.pl-1.flex.items-center","strong.pl-1.flex.items-center",-1246633632),frontend.ui.icon("cloud")], null):null)], null));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs90113))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","items-center"], null)], null),attrs90113], 0))):{'className':"flex items-center"}),((cljs.core.map_QMARK_(attrs90113))?null:[daiquiri.interpreter.interpret(attrs90113)]));
} else {
return null;
}
}),null,"frontend.components.repo/normalized-graph-label");
frontend.components.repo.sort_repos_with_metadata_local = (function frontend$components$repo$sort_repos_with_metadata_local(repos){
var temp__5802__auto__ = (function (){var and__5000__auto__ = cljs.core.seq(repos);
if(and__5000__auto__){
return frontend.handler.graph.get_metadata_local();
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var m = temp__5802__auto__;
return cljs.core.sort.cljs$core$IFn$_invoke$arity$2((function (r1,r2){
return cljs.core.compare((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"last-seen-at","last-seen-at",1929467667).cljs$core$IFn$_invoke$arity$1(r2);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"created-at","created-at",-89248644).cljs$core$IFn$_invoke$arity$1(r2);
}
})(),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"last-seen-at","last-seen-at",1929467667).cljs$core$IFn$_invoke$arity$1(r1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"created-at","created-at",-89248644).cljs$core$IFn$_invoke$arity$1(r1);
}
})());
}),cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (r){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([r,cljs.core.get.cljs$core$IFn$_invoke$arity$2(m,new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(r))], 0));
}),repos));
} else {
return repos;
}
});
frontend.components.repo.safe_locale_date = (function frontend$components$repo$safe_locale_date(dst){
if(typeof dst === 'number'){
try{return (new Date(dst)).toLocaleString();
}catch (e90140){if((e90140 instanceof Error)){
var _e = e90140;
return null;
} else {
throw e90140;

}
}} else {
return null;
}
});
/**
 * Graph list in `All graphs` page
 */
frontend.components.repo.repos_inner = rum.core.lazy_build(rum.core.build_defc,(function (repos){
return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$repo$iter__90152(s__90153){
return (new cljs.core.LazySeq(null,(function (){
var s__90153__$1 = s__90153;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__90153__$1);
if(temp__5804__auto__){
var s__90153__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__90153__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__90153__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__90155 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__90154 = (0);
while(true){
if((i__90154 < size__5479__auto__)){
var map__90160 = cljs.core._nth(c__5478__auto__,i__90154);
var map__90160__$1 = cljs.core.__destructure_map(map__90160);
var repo = map__90160__$1;
var root = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90160__$1,new cljs.core.Keyword(null,"root","root",-448657453));
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90160__$1,new cljs.core.Keyword(null,"url","url",276297046));
var remote_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90160__$1,new cljs.core.Keyword(null,"remote?","remote?",-517415110));
var GraphUUID = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90160__$1,new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531));
var GraphSchemaVersion = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90160__$1,new cljs.core.Keyword(null,"GraphSchemaVersion","GraphSchemaVersion",1094848752));
var GraphName = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90160__$1,new cljs.core.Keyword(null,"GraphName","GraphName",-960661337));
var created_at = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90160__$1,new cljs.core.Keyword(null,"created-at","created-at",-89248644));
var last_seen_at = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90160__$1,new cljs.core.Keyword(null,"last-seen-at","last-seen-at",1929467667));
var only_cloud_QMARK_ = (function (){var and__5000__auto__ = remote_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (root == null);
} else {
return and__5000__auto__;
}
})();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(url);
cljs.core.chunk_append(b__90155,daiquiri.core.create_element("div",{'key':(function (){var or__5002__auto__ = url;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return GraphUUID;
}
})(),'data-testid':url,'className':"flex justify-between mb-4 items-center group"},[daiquiri.core.create_element("div",null,[daiquiri.core.create_element("span",{'className':"flex items-center gap-1"},[frontend.components.repo.normalized_graph_label(repo,((function (i__90154,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (){
if(cljs.core.truth_(frontend.state.sub(new cljs.core.Keyword("rtc","downloading-graph-uuid","rtc/downloading-graph-uuid",460109193)))){
return null;
} else {
if(cljs.core.truth_(root)){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","switch","graph/switch",178853840),url], null));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
return remote_QMARK_;
} else {
return and__5000__auto__;
}
})())){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("rtc","download-remote-graph","rtc/download-remote-graph",508601916),GraphName,GraphUUID,GraphSchemaVersion], null));
} else {
if(cljs.core.truth_(frontend.util.capacitor_new_QMARK_())){
return null;
} else {
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","pull-down-remote-graph","graph/pull-down-remote-graph",-1238246835),repo], null));
}

}
}
}
});})(i__90154,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
)]),daiquiri.interpreter.interpret((function (){var temp__5804__auto____$1 = (function (){var G__90184 = (function (){var or__5002__auto__ = last_seen_at;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return created_at;
}
})();
if((G__90184 == null)){
return null;
} else {
return frontend.components.repo.safe_locale_date(G__90184);
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var time = temp__5804__auto____$1;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.text-gray-400.opacity-50","small.text-gray-400.opacity-50",-596788651),["Last opened at: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(time)].join('')], null);
} else {
return null;
}
})())]),daiquiri.core.create_element("div",{'className':"controls"},[(function (){var attrs90187 = (cljs.core.truth_(frontend.util.electron_QMARK_())?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.text-xs.items-center.text-gray-08.hover:underline.hidden.group-hover:flex","a.text-xs.items-center.text-gray-08.hover:underline.hidden.group-hover:flex",-411328347),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__90154,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (){
return frontend.util.open_url(["file://",cljs.core.str.cljs$core$IFn$_invoke$arity$1(root)].join(''));
});})(i__90154,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
], null),logseq.shui.ui.tabler_icon("folder-pin"),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.pl-1","span.pl-1",-1236384439),root], null)], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90187))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center"], null)], null),attrs90187], 0))):{'className':"flex flex-row items-center"}),((cljs.core.map_QMARK_(attrs90187))?[(function (){var db_graph_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(url);
var manager_QMARK_ = ((db_graph_QMARK_) && (frontend.handler.user.manager_QMARK_(url)));
var title = (cljs.core.truth_(only_cloud_QMARK_)?"Deletes this remote graph. Note this can't be recovered.":((db_based_QMARK_)?"Unsafe delete this DB-based graph. Note this can't be recovered.":"Removes Logseq's access to the local file path of your graph. It won't remove your local files."
));
if(cljs.core.truth_((function (){var and__5000__auto__ = db_graph_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = only_cloud_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return (!(manager_QMARK_));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return null;
} else {
return daiquiri.core.create_element("a",{'title':title,'onClick':((function (i__90154,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (){
var has_prompt_QMARK_ = true;
var prompt_str = (cljs.core.truth_(only_cloud_QMARK_)?["Are you sure to permanently delete the graph \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(GraphName),"\" from our server?"].join(''):((db_based_QMARK_)?["Are you sure to permanently delete the graph \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(url),"\" from Logseq?"].join(''):["Are you sure to unlink the graph \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(url),"\" from local folder?"].join('')
));
var unlink_or_remote_fn_BANG_ = ((function (i__90154,has_prompt_QMARK_,prompt_str,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (){
frontend.handler.repo.remove_repo_BANG_(repo);

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","unlinked","graph/unlinked",-2077575387),repo,frontend.state.get_current_repo()], null));
});})(i__90154,has_prompt_QMARK_,prompt_str,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
;
var action_confirm_fn_BANG_ = (cljs.core.truth_(only_cloud_QMARK_)?((function (i__90154,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (){
if(((manager_QMARK_) || ((!(db_graph_QMARK_))))){
var _LT_delete_graph = ((db_graph_QMARK_)?frontend.handler.db_based.rtc._LT_rtc_delete_graph_BANG_:((function (i__90154,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (graph_uuid,_graph_schema_version){
return frontend.common.async_util.c__GT_p(frontend.handler.file_sync._LT_delete_graph(graph_uuid));
});})(i__90154,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
);
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"loading","loading",-737050189)], null),true);

return promesa.protocols._mcat(promesa.protocols._promise(null),((function (i__90154,_LT_delete_graph,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((_LT_delete_graph.cljs$core$IFn$_invoke$arity$2 ? _LT_delete_graph.cljs$core$IFn$_invoke$arity$2(GraphUUID,GraphSchemaVersion) : _LT_delete_graph.call(null,GraphUUID,GraphSchemaVersion))),((function (i__90154,_LT_delete_graph,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.delete_repo_BANG_(repo)),((function (i__90154,_LT_delete_graph,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (___40947__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.delete_remote_graph_BANG_(repo)),((function (i__90154,_LT_delete_graph,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (___40947__auto____$2){
return promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"loading","loading",-737050189)], null),false));
});})(i__90154,_LT_delete_graph,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
);
});})(i__90154,_LT_delete_graph,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
);
});})(i__90154,_LT_delete_graph,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
);
});})(i__90154,_LT_delete_graph,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
);
} else {
return null;
}
});})(i__90154,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
:unlink_or_remote_fn_BANG_);
var confirm_fn_BANG_ = ((function (i__90154,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,action_confirm_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2((function (){var G__90203 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.font-medium.-my-4","p.font-medium.-my-4",-390241889),prompt_str,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.mt-1.flex.font-normal.opacity-70","span.mt-1.flex.font-normal.opacity-70",247973735),(cljs.core.truth_((function (){var or__5002__auto__ = db_based_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
return only_cloud_QMARK_;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.text-red-rx-11","small.text-red-rx-11",-1302607564),"\u26A0\uFE0F Notice that we can't recover this graph after being deleted. Make sure you have backups before deleting it."], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.opacity-70","small.opacity-70",-476663833),"\u26A0\uFE0F It won't remove your local files!"], null))], null)], null);
return (logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$1(G__90203) : logseq.shui.ui.dialog_confirm_BANG_.call(null,G__90203));
})(),((function (i__90154,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,action_confirm_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (){
return action_confirm_fn_BANG_();
});})(i__90154,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,action_confirm_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
);
});})(i__90154,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,action_confirm_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
;
if(has_prompt_QMARK_){
return confirm_fn_BANG_();
} else {
return unlink_or_remote_fn_BANG_();
}
});})(i__90154,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
,'className':"text-gray-400 ml-4 font-medium text-sm whitespace-nowrap"},[(cljs.core.truth_(only_cloud_QMARK_)?"Remove (server)":"Unlink (local)")]);
}
})()]:[daiquiri.interpreter.interpret(attrs90187),(function (){var db_graph_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(url);
var manager_QMARK_ = ((db_graph_QMARK_) && (frontend.handler.user.manager_QMARK_(url)));
var title = (cljs.core.truth_(only_cloud_QMARK_)?"Deletes this remote graph. Note this can't be recovered.":((db_based_QMARK_)?"Unsafe delete this DB-based graph. Note this can't be recovered.":"Removes Logseq's access to the local file path of your graph. It won't remove your local files."
));
if(cljs.core.truth_((function (){var and__5000__auto__ = db_graph_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = only_cloud_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return (!(manager_QMARK_));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return null;
} else {
return daiquiri.core.create_element("a",{'title':title,'onClick':((function (i__90154,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (){
var has_prompt_QMARK_ = true;
var prompt_str = (cljs.core.truth_(only_cloud_QMARK_)?["Are you sure to permanently delete the graph \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(GraphName),"\" from our server?"].join(''):((db_based_QMARK_)?["Are you sure to permanently delete the graph \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(url),"\" from Logseq?"].join(''):["Are you sure to unlink the graph \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(url),"\" from local folder?"].join('')
));
var unlink_or_remote_fn_BANG_ = ((function (i__90154,has_prompt_QMARK_,prompt_str,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (){
frontend.handler.repo.remove_repo_BANG_(repo);

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","unlinked","graph/unlinked",-2077575387),repo,frontend.state.get_current_repo()], null));
});})(i__90154,has_prompt_QMARK_,prompt_str,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
;
var action_confirm_fn_BANG_ = (cljs.core.truth_(only_cloud_QMARK_)?((function (i__90154,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (){
if(((manager_QMARK_) || ((!(db_graph_QMARK_))))){
var _LT_delete_graph = ((db_graph_QMARK_)?frontend.handler.db_based.rtc._LT_rtc_delete_graph_BANG_:((function (i__90154,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (graph_uuid,_graph_schema_version){
return frontend.common.async_util.c__GT_p(frontend.handler.file_sync._LT_delete_graph(graph_uuid));
});})(i__90154,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
);
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"loading","loading",-737050189)], null),true);

return promesa.protocols._mcat(promesa.protocols._promise(null),((function (i__90154,_LT_delete_graph,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((_LT_delete_graph.cljs$core$IFn$_invoke$arity$2 ? _LT_delete_graph.cljs$core$IFn$_invoke$arity$2(GraphUUID,GraphSchemaVersion) : _LT_delete_graph.call(null,GraphUUID,GraphSchemaVersion))),((function (i__90154,_LT_delete_graph,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.delete_repo_BANG_(repo)),((function (i__90154,_LT_delete_graph,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (___40947__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.delete_remote_graph_BANG_(repo)),((function (i__90154,_LT_delete_graph,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (___40947__auto____$2){
return promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"loading","loading",-737050189)], null),false));
});})(i__90154,_LT_delete_graph,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
);
});})(i__90154,_LT_delete_graph,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
);
});})(i__90154,_LT_delete_graph,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
);
});})(i__90154,_LT_delete_graph,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
);
} else {
return null;
}
});})(i__90154,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
:unlink_or_remote_fn_BANG_);
var confirm_fn_BANG_ = ((function (i__90154,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,action_confirm_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2((function (){var G__90217 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.font-medium.-my-4","p.font-medium.-my-4",-390241889),prompt_str,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.mt-1.flex.font-normal.opacity-70","span.mt-1.flex.font-normal.opacity-70",247973735),(cljs.core.truth_((function (){var or__5002__auto__ = db_based_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
return only_cloud_QMARK_;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.text-red-rx-11","small.text-red-rx-11",-1302607564),"\u26A0\uFE0F Notice that we can't recover this graph after being deleted. Make sure you have backups before deleting it."], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.opacity-70","small.opacity-70",-476663833),"\u26A0\uFE0F It won't remove your local files!"], null))], null)], null);
return (logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$1(G__90217) : logseq.shui.ui.dialog_confirm_BANG_.call(null,G__90217));
})(),((function (i__90154,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,action_confirm_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__){
return (function (){
return action_confirm_fn_BANG_();
});})(i__90154,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,action_confirm_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
);
});})(i__90154,has_prompt_QMARK_,prompt_str,unlink_or_remote_fn_BANG_,action_confirm_fn_BANG_,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
;
if(has_prompt_QMARK_){
return confirm_fn_BANG_();
} else {
return unlink_or_remote_fn_BANG_();
}
});})(i__90154,db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90160,map__90160__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,c__5478__auto__,size__5479__auto__,b__90155,s__90153__$2,temp__5804__auto__))
,'className':"text-gray-400 ml-4 font-medium text-sm whitespace-nowrap"},[(cljs.core.truth_(only_cloud_QMARK_)?"Remove (server)":"Unlink (local)")]);
}
})()]));
})()])]));

var G__90393 = (i__90154 + (1));
i__90154 = G__90393;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__90155),frontend$components$repo$iter__90152(cljs.core.chunk_rest(s__90153__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__90155),null);
}
} else {
var map__90220 = cljs.core.first(s__90153__$2);
var map__90220__$1 = cljs.core.__destructure_map(map__90220);
var repo = map__90220__$1;
var root = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90220__$1,new cljs.core.Keyword(null,"root","root",-448657453));
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90220__$1,new cljs.core.Keyword(null,"url","url",276297046));
var remote_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90220__$1,new cljs.core.Keyword(null,"remote?","remote?",-517415110));
var GraphUUID = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90220__$1,new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531));
var GraphSchemaVersion = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90220__$1,new cljs.core.Keyword(null,"GraphSchemaVersion","GraphSchemaVersion",1094848752));
var GraphName = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90220__$1,new cljs.core.Keyword(null,"GraphName","GraphName",-960661337));
var created_at = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90220__$1,new cljs.core.Keyword(null,"created-at","created-at",-89248644));
var last_seen_at = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90220__$1,new cljs.core.Keyword(null,"last-seen-at","last-seen-at",1929467667));
var only_cloud_QMARK_ = (function (){var and__5000__auto__ = remote_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (root == null);
} else {
return and__5000__auto__;
}
})();
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(url);
return cljs.core.cons(daiquiri.core.create_element("div",{'key':(function (){var or__5002__auto__ = url;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return GraphUUID;
}
})(),'data-testid':url,'className':"flex justify-between mb-4 items-center group"},[daiquiri.core.create_element("div",null,[daiquiri.core.create_element("span",{'className':"flex items-center gap-1"},[frontend.components.repo.normalized_graph_label(repo,((function (only_cloud_QMARK_,db_based_QMARK_,map__90220,map__90220__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,s__90153__$2,temp__5804__auto__){
return (function (){
if(cljs.core.truth_(frontend.state.sub(new cljs.core.Keyword("rtc","downloading-graph-uuid","rtc/downloading-graph-uuid",460109193)))){
return null;
} else {
if(cljs.core.truth_(root)){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","switch","graph/switch",178853840),url], null));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = db_based_QMARK_;
if(and__5000__auto__){
return remote_QMARK_;
} else {
return and__5000__auto__;
}
})())){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("rtc","download-remote-graph","rtc/download-remote-graph",508601916),GraphName,GraphUUID,GraphSchemaVersion], null));
} else {
if(cljs.core.truth_(frontend.util.capacitor_new_QMARK_())){
return null;
} else {
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","pull-down-remote-graph","graph/pull-down-remote-graph",-1238246835),repo], null));
}

}
}
}
});})(only_cloud_QMARK_,db_based_QMARK_,map__90220,map__90220__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,s__90153__$2,temp__5804__auto__))
)]),daiquiri.interpreter.interpret((function (){var temp__5804__auto____$1 = (function (){var G__90224 = (function (){var or__5002__auto__ = last_seen_at;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return created_at;
}
})();
if((G__90224 == null)){
return null;
} else {
return frontend.components.repo.safe_locale_date(G__90224);
}
})();
if(cljs.core.truth_(temp__5804__auto____$1)){
var time = temp__5804__auto____$1;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.text-gray-400.opacity-50","small.text-gray-400.opacity-50",-596788651),["Last opened at: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(time)].join('')], null);
} else {
return null;
}
})())]),daiquiri.core.create_element("div",{'className':"controls"},[(function (){var attrs90187 = (cljs.core.truth_(frontend.util.electron_QMARK_())?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.text-xs.items-center.text-gray-08.hover:underline.hidden.group-hover:flex","a.text-xs.items-center.text-gray-08.hover:underline.hidden.group-hover:flex",-411328347),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (only_cloud_QMARK_,db_based_QMARK_,map__90220,map__90220__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,s__90153__$2,temp__5804__auto__){
return (function (){
return frontend.util.open_url(["file://",cljs.core.str.cljs$core$IFn$_invoke$arity$1(root)].join(''));
});})(only_cloud_QMARK_,db_based_QMARK_,map__90220,map__90220__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,s__90153__$2,temp__5804__auto__))
], null),logseq.shui.ui.tabler_icon("folder-pin"),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.pl-1","span.pl-1",-1236384439),root], null)], null):null);
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90187))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center"], null)], null),attrs90187], 0))):{'className':"flex flex-row items-center"}),((cljs.core.map_QMARK_(attrs90187))?[(function (){var db_graph_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(url);
var manager_QMARK_ = ((db_graph_QMARK_) && (frontend.handler.user.manager_QMARK_(url)));
var title = (cljs.core.truth_(only_cloud_QMARK_)?"Deletes this remote graph. Note this can't be recovered.":((db_based_QMARK_)?"Unsafe delete this DB-based graph. Note this can't be recovered.":"Removes Logseq's access to the local file path of your graph. It won't remove your local files."
));
if(cljs.core.truth_((function (){var and__5000__auto__ = db_graph_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = only_cloud_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return (!(manager_QMARK_));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return null;
} else {
return daiquiri.core.create_element("a",{'title':title,'onClick':((function (db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90220,map__90220__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,s__90153__$2,temp__5804__auto__){
return (function (){
var has_prompt_QMARK_ = true;
var prompt_str = (cljs.core.truth_(only_cloud_QMARK_)?["Are you sure to permanently delete the graph \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(GraphName),"\" from our server?"].join(''):((db_based_QMARK_)?["Are you sure to permanently delete the graph \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(url),"\" from Logseq?"].join(''):["Are you sure to unlink the graph \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(url),"\" from local folder?"].join('')
));
var unlink_or_remote_fn_BANG_ = (function (){
frontend.handler.repo.remove_repo_BANG_(repo);

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","unlinked","graph/unlinked",-2077575387),repo,frontend.state.get_current_repo()], null));
});
var action_confirm_fn_BANG_ = (cljs.core.truth_(only_cloud_QMARK_)?(function (){
if(((manager_QMARK_) || ((!(db_graph_QMARK_))))){
var _LT_delete_graph = ((db_graph_QMARK_)?frontend.handler.db_based.rtc._LT_rtc_delete_graph_BANG_:(function (graph_uuid,_graph_schema_version){
return frontend.common.async_util.c__GT_p(frontend.handler.file_sync._LT_delete_graph(graph_uuid));
}));
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"loading","loading",-737050189)], null),true);

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((_LT_delete_graph.cljs$core$IFn$_invoke$arity$2 ? _LT_delete_graph.cljs$core$IFn$_invoke$arity$2(GraphUUID,GraphSchemaVersion) : _LT_delete_graph.call(null,GraphUUID,GraphSchemaVersion))),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.delete_repo_BANG_(repo)),(function (___40947__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.delete_remote_graph_BANG_(repo)),(function (___40947__auto____$2){
return promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"loading","loading",-737050189)], null),false));
}));
}));
}));
}));
} else {
return null;
}
}):unlink_or_remote_fn_BANG_);
var confirm_fn_BANG_ = (function (){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2((function (){var G__90227 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.font-medium.-my-4","p.font-medium.-my-4",-390241889),prompt_str,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.mt-1.flex.font-normal.opacity-70","span.mt-1.flex.font-normal.opacity-70",247973735),(cljs.core.truth_((function (){var or__5002__auto__ = db_based_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
return only_cloud_QMARK_;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.text-red-rx-11","small.text-red-rx-11",-1302607564),"\u26A0\uFE0F Notice that we can't recover this graph after being deleted. Make sure you have backups before deleting it."], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.opacity-70","small.opacity-70",-476663833),"\u26A0\uFE0F It won't remove your local files!"], null))], null)], null);
return (logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$1(G__90227) : logseq.shui.ui.dialog_confirm_BANG_.call(null,G__90227));
})(),(function (){
return action_confirm_fn_BANG_();
}));
});
if(has_prompt_QMARK_){
return confirm_fn_BANG_();
} else {
return unlink_or_remote_fn_BANG_();
}
});})(db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90220,map__90220__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,s__90153__$2,temp__5804__auto__))
,'className':"text-gray-400 ml-4 font-medium text-sm whitespace-nowrap"},[(cljs.core.truth_(only_cloud_QMARK_)?"Remove (server)":"Unlink (local)")]);
}
})()]:[daiquiri.interpreter.interpret(attrs90187),(function (){var db_graph_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(url);
var manager_QMARK_ = ((db_graph_QMARK_) && (frontend.handler.user.manager_QMARK_(url)));
var title = (cljs.core.truth_(only_cloud_QMARK_)?"Deletes this remote graph. Note this can't be recovered.":((db_based_QMARK_)?"Unsafe delete this DB-based graph. Note this can't be recovered.":"Removes Logseq's access to the local file path of your graph. It won't remove your local files."
));
if(cljs.core.truth_((function (){var and__5000__auto__ = db_graph_QMARK_;
if(and__5000__auto__){
var and__5000__auto____$1 = only_cloud_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return (!(manager_QMARK_));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return null;
} else {
return daiquiri.core.create_element("a",{'title':title,'onClick':((function (db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90220,map__90220__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,s__90153__$2,temp__5804__auto__){
return (function (){
var has_prompt_QMARK_ = true;
var prompt_str = (cljs.core.truth_(only_cloud_QMARK_)?["Are you sure to permanently delete the graph \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(GraphName),"\" from our server?"].join(''):((db_based_QMARK_)?["Are you sure to permanently delete the graph \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(url),"\" from Logseq?"].join(''):["Are you sure to unlink the graph \"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(url),"\" from local folder?"].join('')
));
var unlink_or_remote_fn_BANG_ = (function (){
frontend.handler.repo.remove_repo_BANG_(repo);

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","unlinked","graph/unlinked",-2077575387),repo,frontend.state.get_current_repo()], null));
});
var action_confirm_fn_BANG_ = (cljs.core.truth_(only_cloud_QMARK_)?(function (){
if(((manager_QMARK_) || ((!(db_graph_QMARK_))))){
var _LT_delete_graph = ((db_graph_QMARK_)?frontend.handler.db_based.rtc._LT_rtc_delete_graph_BANG_:(function (graph_uuid,_graph_schema_version){
return frontend.common.async_util.c__GT_p(frontend.handler.file_sync._LT_delete_graph(graph_uuid));
}));
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"loading","loading",-737050189)], null),true);

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((_LT_delete_graph.cljs$core$IFn$_invoke$arity$2 ? _LT_delete_graph.cljs$core$IFn$_invoke$arity$2(GraphUUID,GraphSchemaVersion) : _LT_delete_graph.call(null,GraphUUID,GraphSchemaVersion))),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.delete_repo_BANG_(repo)),(function (___40947__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.delete_remote_graph_BANG_(repo)),(function (___40947__auto____$2){
return promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"loading","loading",-737050189)], null),false));
}));
}));
}));
}));
} else {
return null;
}
}):unlink_or_remote_fn_BANG_);
var confirm_fn_BANG_ = (function (){
return promesa.core.then.cljs$core$IFn$_invoke$arity$2((function (){var G__90234 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.font-medium.-my-4","p.font-medium.-my-4",-390241889),prompt_str,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.mt-1.flex.font-normal.opacity-70","span.mt-1.flex.font-normal.opacity-70",247973735),(cljs.core.truth_((function (){var or__5002__auto__ = db_based_QMARK_;
if(or__5002__auto__){
return or__5002__auto__;
} else {
return only_cloud_QMARK_;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.text-red-rx-11","small.text-red-rx-11",-1302607564),"\u26A0\uFE0F Notice that we can't recover this graph after being deleted. Make sure you have backups before deleting it."], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.opacity-70","small.opacity-70",-476663833),"\u26A0\uFE0F It won't remove your local files!"], null))], null)], null);
return (logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.dialog_confirm_BANG_.cljs$core$IFn$_invoke$arity$1(G__90234) : logseq.shui.ui.dialog_confirm_BANG_.call(null,G__90234));
})(),(function (){
return action_confirm_fn_BANG_();
}));
});
if(has_prompt_QMARK_){
return confirm_fn_BANG_();
} else {
return unlink_or_remote_fn_BANG_();
}
});})(db_graph_QMARK_,manager_QMARK_,title,attrs90187,only_cloud_QMARK_,db_based_QMARK_,map__90220,map__90220__$1,repo,root,url,remote_QMARK_,GraphUUID,GraphSchemaVersion,GraphName,created_at,last_seen_at,s__90153__$2,temp__5804__auto__))
,'className':"text-gray-400 ml-4 font-medium text-sm whitespace-nowrap"},[(cljs.core.truth_(only_cloud_QMARK_)?"Remove (server)":"Unlink (local)")]);
}
})()]));
})()])]),frontend$components$repo$iter__90152(cljs.core.rest(s__90153__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(frontend.components.repo.sort_repos_with_metadata_local(repos));
})());
}),null,"frontend.components.repo/repos-inner");
frontend.components.repo.repos_cp = rum.core.lazy_build(rum.core.build_defc,(function (){
var login_QMARK_ = cljs.core.boolean$(frontend.state.sub(new cljs.core.Keyword("auth","id-token","auth/id-token",-332149946)));
var repos = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"me","me",-139006693),new cljs.core.Keyword(null,"repos","repos",647483789)], null));
var repos__$1 = (frontend.util.distinct_by.cljs$core$IFn$_invoke$arity$2 ? frontend.util.distinct_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"url","url",276297046),repos) : frontend.util.distinct_by.call(null,new cljs.core.Keyword(null,"url","url",276297046),repos));
var remotes = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(frontend.state.sub(new cljs.core.Keyword("rtc","graphs","rtc/graphs",-1584628267)),frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"graphs","graphs",-1584479112)], null)));
var remotes_loading_QMARK_ = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"loading","loading",-737050189)], null));
var repos__$2 = ((((login_QMARK_) && (cljs.core.seq(remotes))))?frontend.handler.repo.combine_local__AMPERSAND__remote_graphs(repos__$1,remotes):repos__$1);
var repos__$3 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__90239_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(p1__90239_SHARP_),frontend.config.demo_repo);
}),repos__$2);
var map__90248 = cljs.core.group_by(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.boolean$,new cljs.core.Keyword(null,"remote?","remote?",-517415110)),repos__$3);
var map__90248__$1 = cljs.core.__destructure_map(map__90248);
var remote_graphs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90248__$1,true);
var local_graphs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90248__$1,false);
var attrs90246 = (cljs.core.truth_(frontend.util.capacitor_new_QMARK_())?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1.title","h1.title",-2139952071),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("graph","all-graphs","graph/all-graphs",-193046305)], 0))], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90246))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),"graphs"], null),attrs90246], 0))):{'id':"graphs"}),((cljs.core.map_QMARK_(attrs90246))?[daiquiri.core.create_element("div",{'className':"pl-1 content mt-3"},[daiquiri.core.create_element("div",null,[(function (){var attrs90252 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("graph","local-graphs","graph/local-graphs",-729146600)], 0));
return daiquiri.core.create_element("h2",((cljs.core.map_QMARK_(attrs90252))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-lg","font-medium","my-4"], null)], null),attrs90252], 0))):{'className':"text-lg font-medium my-4"}),((cljs.core.map_QMARK_(attrs90252))?null:[daiquiri.interpreter.interpret(attrs90252)]));
})(),((cljs.core.seq(local_graphs))?frontend.components.repo.repos_inner(local_graphs):null),(cljs.core.truth_(frontend.util.capacitor_new_QMARK_())?null:(function (){var attrs90256 = ((frontend.util.web_platform_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mr-8","div.mr-8",674865009),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Create a new graph",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","new-db-graph","graph/new-db-graph",-1877792394)], null));
})], 0))], null):(cljs.core.truth_((function (){var or__5002__auto__ = frontend.handler.file_based.native_fs.supported_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.mobile.util.native_platform_QMARK_();
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mr-8","div.mr-8",674865009),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"open-a-directory","open-a-directory",981257354)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","setup-a-repo","graph/setup-a-repo",992514529)], null));
})], 0))], null):null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90256))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","my-4"], null)], null),attrs90256], 0))):{'className':"flex flex-row my-4"}),((cljs.core.map_QMARK_(attrs90256))?null:[daiquiri.interpreter.interpret(attrs90256)]));
})())]),(cljs.core.truth_((function (){var and__5000__auto__ = (function (){var or__5002__auto__ = frontend.handler.file_sync.enable_sync_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = frontend.state.enable_rtc_QMARK_();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return frontend.handler.user.team_member_QMARK_();
}
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return login_QMARK_;
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("div",null,[daiquiri.core.create_element("hr",null,null),daiquiri.core.create_element("div",{'className':"flex align-items justify-between"},[(function (){var attrs90270 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("graph","remote-graphs","graph/remote-graphs",-1737922715)], 0));
return daiquiri.core.create_element("h2",((cljs.core.map_QMARK_(attrs90270))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-lg","font-medium","my-4"], null)], null),attrs90270], 0))):{'className':"text-lg font-medium my-4"}),((cljs.core.map_QMARK_(attrs90270))?null:[daiquiri.interpreter.interpret(attrs90270)]));
})(),(function (){var attrs90272 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center","span.flex.items-center",-463750193),"Refresh",(cljs.core.truth_(remotes_loading_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.pl-2","small.pl-2",-778303966),frontend.ui.loading.cljs$core$IFn$_invoke$arity$1(null)], null):null)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"background","background",-863952629),"gray",new cljs.core.Keyword(null,"disabled","disabled",-1529784218),remotes_loading_QMARK_,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(cljs.core.truth_(frontend.util.capacitor_new_QMARK_())){
} else {
frontend.handler.file_sync.load_session_graphs();
}

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.rtc._LT_get_remote_graphs()),(function (___40947__auto__){
return promesa.protocols._promise(frontend.handler.repo.refresh_repos_BANG_());
}));
}));
})], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90272))?daiquiri.interpreter.element_attributes(attrs90272):null),((cljs.core.map_QMARK_(attrs90272))?null:[daiquiri.interpreter.interpret(attrs90272)]));
})()]),frontend.components.repo.repos_inner(remote_graphs)]):null)])]:[daiquiri.interpreter.interpret(attrs90246),daiquiri.core.create_element("div",{'className':"pl-1 content mt-3"},[daiquiri.core.create_element("div",null,[(function (){var attrs90278 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("graph","local-graphs","graph/local-graphs",-729146600)], 0));
return daiquiri.core.create_element("h2",((cljs.core.map_QMARK_(attrs90278))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-lg","font-medium","my-4"], null)], null),attrs90278], 0))):{'className':"text-lg font-medium my-4"}),((cljs.core.map_QMARK_(attrs90278))?null:[daiquiri.interpreter.interpret(attrs90278)]));
})(),((cljs.core.seq(local_graphs))?frontend.components.repo.repos_inner(local_graphs):null),(cljs.core.truth_(frontend.util.capacitor_new_QMARK_())?null:(function (){var attrs90279 = ((frontend.util.web_platform_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mr-8","div.mr-8",674865009),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic("Create a new graph",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","new-db-graph","graph/new-db-graph",-1877792394)], null));
})], 0))], null):(cljs.core.truth_((function (){var or__5002__auto__ = frontend.handler.file_based.native_fs.supported_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.mobile.util.native_platform_QMARK_();
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mr-8","div.mr-8",674865009),frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"open-a-directory","open-a-directory",981257354)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","setup-a-repo","graph/setup-a-repo",992514529)], null));
})], 0))], null):null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90279))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","my-4"], null)], null),attrs90279], 0))):{'className':"flex flex-row my-4"}),((cljs.core.map_QMARK_(attrs90279))?null:[daiquiri.interpreter.interpret(attrs90279)]));
})())]),(cljs.core.truth_((function (){var and__5000__auto__ = (function (){var or__5002__auto__ = frontend.handler.file_sync.enable_sync_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = frontend.state.enable_rtc_QMARK_();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return frontend.handler.user.team_member_QMARK_();
}
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return login_QMARK_;
} else {
return and__5000__auto__;
}
})())?daiquiri.core.create_element("div",null,[daiquiri.core.create_element("hr",null,null),daiquiri.core.create_element("div",{'className':"flex align-items justify-between"},[(function (){var attrs90284 = frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("graph","remote-graphs","graph/remote-graphs",-1737922715)], 0));
return daiquiri.core.create_element("h2",((cljs.core.map_QMARK_(attrs90284))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["text-lg","font-medium","my-4"], null)], null),attrs90284], 0))):{'className':"text-lg font-medium my-4"}),((cljs.core.map_QMARK_(attrs90284))?null:[daiquiri.interpreter.interpret(attrs90284)]));
})(),(function (){var attrs90285 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center","span.flex.items-center",-463750193),"Refresh",(cljs.core.truth_(remotes_loading_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"small.pl-2","small.pl-2",-778303966),frontend.ui.loading.cljs$core$IFn$_invoke$arity$1(null)], null):null)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"background","background",-863952629),"gray",new cljs.core.Keyword(null,"disabled","disabled",-1529784218),remotes_loading_QMARK_,new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(cljs.core.truth_(frontend.util.capacitor_new_QMARK_())){
} else {
frontend.handler.file_sync.load_session_graphs();
}

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.rtc._LT_get_remote_graphs()),(function (___40947__auto__){
return promesa.protocols._promise(frontend.handler.repo.refresh_repos_BANG_());
}));
}));
})], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90285))?daiquiri.interpreter.element_attributes(attrs90285):null),((cljs.core.map_QMARK_(attrs90285))?null:[daiquiri.interpreter.interpret(attrs90285)]));
})()]),frontend.components.repo.repos_inner(remote_graphs)]):null)])]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.repo/repos-cp");
frontend.components.repo.repos_dropdown_links = (function frontend$components$repo$repos_dropdown_links(var_args){
var args__5732__auto__ = [];
var len__5726__auto___90394 = arguments.length;
var i__5727__auto___90395 = (0);
while(true){
if((i__5727__auto___90395 < len__5726__auto___90394)){
args__5732__auto__.push((arguments[i__5727__auto___90395]));

var G__90396 = (i__5727__auto___90395 + (1));
i__5727__auto___90395 = G__90396;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return frontend.components.repo.repos_dropdown_links.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(frontend.components.repo.repos_dropdown_links.cljs$core$IFn$_invoke$arity$variadic = (function (repos,current_repo,downloading_graph_id,p__90291){
var map__90292 = p__90291;
var map__90292__$1 = cljs.core.__destructure_map(map__90292);
var opts = map__90292__$1;
var switch_repos = (((!((current_repo == null))))?cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (repo){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_repo,new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(repo));
}),repos):repos);
var repo_links = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (p__90295){
var map__90296 = p__90295;
var map__90296__$1 = cljs.core.__destructure_map(map__90296);
var graph = map__90296__$1;
var url = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90296__$1,new cljs.core.Keyword(null,"url","url",276297046));
var remote_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90296__$1,new cljs.core.Keyword(null,"remote?","remote?",-517415110));
var rtc_graph_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90296__$1,new cljs.core.Keyword(null,"rtc-graph?","rtc-graph?",-203036448));
var GraphName = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90296__$1,new cljs.core.Keyword(null,"GraphName","GraphName",-960661337));
var GraphSchemaVersion = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90296__$1,new cljs.core.Keyword(null,"GraphSchemaVersion","GraphSchemaVersion",1094848752));
var GraphUUID = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90296__$1,new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531));
var local_QMARK_ = frontend.config.local_file_based_graph_QMARK_(url);
var db_only_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(url);
var repo_url = ((local_QMARK_)?(frontend.db.get_repo_name.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_repo_name.cljs$core$IFn$_invoke$arity$1(url) : frontend.db.get_repo_name.call(null,url)):((db_only_QMARK_)?url:GraphName
));
var short_repo_name = ((((local_QMARK_) || (db_only_QMARK_)))?frontend.util.text.get_graph_name_from_path(repo_url):GraphName);
var downloading_QMARK_ = (function (){var and__5000__auto__ = downloading_graph_id;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(GraphUUID,downloading_graph_id);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(short_repo_name)){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.title-wrap","span.flex.items-center.title-wrap",-366003245),short_repo_name,(cljs.core.truth_(remote_QMARK_)?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.pl-1.flex.items-center","span.pl-1.flex.items-center",-1526306913),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"title","title",636505583),["<",cljs.core.str.cljs$core$IFn$_invoke$arity$1(GraphName),"> #",cljs.core.str.cljs$core$IFn$_invoke$arity$1(GraphUUID)].join('')], null),frontend.ui.icon("cloud",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)),(cljs.core.truth_(downloading_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.opacity.text-sm.pl-1","span.opacity.text-sm.pl-1",1925395303),"downloading"], null):null)], null):null)], null),new cljs.core.Keyword(null,"hover-detail","hover-detail",-1668874248),repo_url,new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
if(cljs.core.truth_(downloading_QMARK_)){
return null;
} else {
var temp__5804__auto___90397 = new cljs.core.Keyword(null,"on-click","on-click",1632826543).cljs$core$IFn$_invoke$arity$1(opts);
if(cljs.core.truth_(temp__5804__auto___90397)){
var on_click_90398 = temp__5804__auto___90397;
(on_click_90398.cljs$core$IFn$_invoke$arity$1 ? on_click_90398.cljs$core$IFn$_invoke$arity$1(e) : on_click_90398.call(null,e));
} else {
}

if(cljs.core.truth_((function (){var and__5000__auto__ = frontend.components.repo.goog$module$goog$object.get(e,"shiftKey");
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((function (){var and__5000__auto____$1 = rtc_graph_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return remote_QMARK_;
} else {
return and__5000__auto____$1;
}
})());
} else {
return and__5000__auto__;
}
})())){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","open-new-window","graph/open-new-window",-397266781),url], null));
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"root","root",-448657453).cljs$core$IFn$_invoke$arity$1(graph);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.not(rtc_graph_QMARK_);
}
})())){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","switch","graph/switch",178853840),url], null));
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = rtc_graph_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return remote_QMARK_;
} else {
return and__5000__auto__;
}
})())){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("rtc","download-remote-graph","rtc/download-remote-graph",508601916),GraphName,GraphUUID,GraphSchemaVersion], null));
} else {
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","pull-down-remote-graph","graph/pull-down-remote-graph",-1238246835),graph], null));

}
}
}
}
})], null)], null);
} else {
return null;
}
}),switch_repos);
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,repo_links);
}));

(frontend.components.repo.repos_dropdown_links.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(frontend.components.repo.repos_dropdown_links.cljs$lang$applyTo = (function (seq90286){
var G__90287 = cljs.core.first(seq90286);
var seq90286__$1 = cljs.core.next(seq90286);
var G__90288 = cljs.core.first(seq90286__$1);
var seq90286__$2 = cljs.core.next(seq90286__$1);
var G__90289 = cljs.core.first(seq90286__$2);
var seq90286__$3 = cljs.core.next(seq90286__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__90287,G__90288,G__90289,seq90286__$3);
}));

frontend.components.repo.repos_footer = (function frontend$components$repo$repos_footer(multiple_windows_QMARK_,db_based_QMARK_){
return new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.cp__repos-quick-actions","div.cp__repos-quick-actions",1707798218),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.popup_hide_BANG_.call(null));
})], null),((((cljs.core.not(db_based_QMARK_)) && (cljs.core.not(frontend.config.demo_graph_QMARK_.cljs$core$IFn$_invoke$arity$0()))))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),(function (){var G__90305 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"sync-from-local-files-detail","sync-from-local-files-detail",-231071564)], 0)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","ask-for-re-fresh","graph/ask-for-re-fresh",-32382338)], null));
})], null);
var G__90306 = logseq.shui.ui.tabler_icon("file-report");
var G__90307 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"sync-from-local-files","sync-from-local-files",1514882504)], 0))], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__90305,G__90306,G__90307) : logseq.shui.ui.button.call(null,G__90305,G__90306,G__90307));
})(),(function (){var G__90308 = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"title","title",636505583),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"re-index-detail","re-index-detail",555553184)], 0)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","ask-for-re-index","graph/ask-for-re-index",2038098533),multiple_windows_QMARK_,null], null));
})], null);
var G__90309 = logseq.shui.ui.tabler_icon("folder-bolt");
var G__90310 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"re-index","re-index",-1408098109)], 0))], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__90308,G__90309,G__90310) : logseq.shui.ui.button.call(null,G__90308,G__90309,G__90310));
})()], null):null),(cljs.core.truth_(frontend.util.electron_QMARK_())?(function (){var G__90312 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(cljs.core.truth_((function (){var or__5002__auto__ = frontend.handler.file_based.native_fs.supported_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.mobile.util.native_platform_QMARK_();
}
})())){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","setup-a-repo","graph/setup-a-repo",992514529)], null));
} else {
return frontend.handler.route.redirect_to_all_graphs();
}
})], null);
var G__90313 = logseq.shui.ui.tabler_icon("folder-plus");
var G__90314 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"new-graph","new-graph",1985980678)], 0))], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__90312,G__90313,G__90314) : logseq.shui.ui.button.call(null,G__90312,G__90313,G__90314));
})():null),((frontend.config.publishing_QMARK_)?null:(function (){var G__90315 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("graph","new-db-graph","graph/new-db-graph",-1877792394)], null));
})], null);
var G__90316 = logseq.shui.ui.tabler_icon("database-plus");
var G__90317 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),(cljs.core.truth_(frontend.util.electron_QMARK_)?"Create db graph":"Create new graph")], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__90315,G__90316,G__90317) : logseq.shui.ui.button.call(null,G__90315,G__90316,G__90317));
})()),((frontend.config.publishing_QMARK_)?null:(function (){var G__90318 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.route.redirect_BANG_(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"to","to",192099007),new cljs.core.Keyword(null,"import","import",-1399500709)], null));
})], null);
var G__90319 = logseq.shui.ui.tabler_icon("database-import");
var G__90320 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"import-notes","import-notes",-1596837870)], 0))], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__90318,G__90319,G__90320) : logseq.shui.ui.button.call(null,G__90318,G__90319,G__90320));
})()),((frontend.config.publishing_QMARK_)?null:(function (){var G__90321 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return frontend.handler.route.redirect_to_all_graphs();
})], null);
var G__90322 = logseq.shui.ui.tabler_icon("layout-2");
var G__90323 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"all-graphs","all-graphs",-291694455)], 0))], null);
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$3(G__90321,G__90322,G__90323) : logseq.shui.ui.button.call(null,G__90321,G__90322,G__90323));
})())], null);
});
frontend.components.repo.repos_dropdown_content = rum.core.lazy_build(rum.core.build_defcs,(function() { 
var G__90399__delegate = function (_state,p__90325){
var map__90326 = p__90325;
var map__90326__$1 = cljs.core.__destructure_map(map__90326);
var opts = map__90326__$1;
var contentid = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90326__$1,new cljs.core.Keyword(null,"contentid","contentid",-911323860));
var multiple_windows_QMARK_ = false;
var current_repo = frontend.state.sub(new cljs.core.Keyword("git","current-repo","git/current-repo",107438825));
var login_QMARK_ = cljs.core.boolean$(frontend.state.sub(new cljs.core.Keyword("auth","id-token","auth/id-token",-332149946)));
var repos = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"me","me",-139006693),new cljs.core.Keyword(null,"repos","repos",647483789)], null));
var remotes = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"graphs","graphs",-1584479112)], null));
var rtc_graphs = frontend.state.sub(new cljs.core.Keyword("rtc","graphs","rtc/graphs",-1584628267));
var downloading_graph_id = frontend.state.sub(new cljs.core.Keyword("rtc","downloading-graph-uuid","rtc/downloading-graph-uuid",460109193));
var remotes_loading_QMARK_ = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"loading","loading",-737050189)], null));
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(current_repo);
var repos__$1 = frontend.components.repo.sort_repos_with_metadata_local(repos);
var repos__$2 = cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(((((((cljs.core.seq(remotes)) || (cljs.core.seq(rtc_graphs)))) && (login_QMARK_)))?frontend.handler.repo.combine_local__AMPERSAND__remote_graphs(repos__$1,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(remotes,rtc_graphs)):repos__$1));
var items_fn = (function (){
return frontend.components.repo.repos_dropdown_links.cljs$core$IFn$_invoke$arity$variadic(repos__$2,current_repo,downloading_graph_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opts], 0));
});
var header_fn = (function (){
if((cljs.core.count(repos__$2) > (1))){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium.text-sm.opacity-50.px-1.py-1.flex.flex-row.justify-between.items-center","div.font-medium.text-sm.opacity-50.px-1.py-1.flex.flex-row.justify-between.items-center",-451744443),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h4.pb-1","h4.pb-1",89664618),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("left-side-bar","switch","left-side-bar/switch",1182960689)], 0))], null),(cljs.core.truth_((function (){var and__5000__auto__ = frontend.handler.file_sync.enable_sync_QMARK_();
if(cljs.core.truth_(and__5000__auto__)){
return login_QMARK_;
} else {
return and__5000__auto__;
}
})())?(cljs.core.truth_(remotes_loading_QMARK_)?frontend.ui.loading.cljs$core$IFn$_invoke$arity$1(""):(function (){var G__90327 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"variant","variant",-424354234),new cljs.core.Keyword(null,"ghost","ghost",-1531157576),new cljs.core.Keyword(null,"size","size",1098693007),new cljs.core.Keyword(null,"sm","sm",-1402575065),new cljs.core.Keyword(null,"title","title",636505583),"Refresh remote graphs",new cljs.core.Keyword(null,"class","class",-2030961996),"!h-6 !px-1 relative right-[-4px]",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
frontend.handler.file_sync.load_session_graphs();

return frontend.handler.db_based.rtc._LT_get_remote_graphs();
})], null);
var G__90328 = frontend.ui.icon("refresh",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(15)], null));
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__90327,G__90328) : logseq.shui.ui.button.call(null,G__90327,G__90328));
})()):null)], null);
} else {
return null;
}
});
var _remote_QMARK_ = (function (){var and__5000__auto__ = current_repo;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"remote?","remote?",-517415110).cljs$core$IFn$_invoke$arity$1(cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__90324_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_repo,new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(p1__90324_SHARP_));
}),repos__$2)));
} else {
return and__5000__auto__;
}
})();
var _repo_name = (cljs.core.truth_(current_repo)?(frontend.db.get_repo_name.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_repo_name.cljs$core$IFn$_invoke$arity$1(current_repo) : frontend.db.get_repo_name.call(null,current_repo)):null);
return daiquiri.core.create_element("div",{'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(((cljs.core.count(repos__$2) <= (1)))?"no-repos":null)], null))},[daiquiri.interpreter.interpret(header_fn()),daiquiri.core.create_element("div",{'className':"cp__repos-list-wrap"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$repo$iter__90331(s__90332){
return (new cljs.core.LazySeq(null,(function (){
var s__90332__$1 = s__90332;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__90332__$1);
if(temp__5804__auto__){
var s__90332__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__90332__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__90332__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__90334 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__90333 = (0);
while(true){
if((i__90333 < size__5479__auto__)){
var map__90336 = cljs.core._nth(c__5478__auto__,i__90333);
var map__90336__$1 = cljs.core.__destructure_map(map__90336);
var hr = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90336__$1,new cljs.core.Keyword(null,"hr","hr",1377740067));
var item = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90336__$1,new cljs.core.Keyword(null,"item","item",249373802));
var hover_detail = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90336__$1,new cljs.core.Keyword(null,"hover-detail","hover-detail",-1668874248));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90336__$1,new cljs.core.Keyword(null,"title","title",636505583));
var options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90336__$1,new cljs.core.Keyword(null,"options","options",99638489));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90336__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
cljs.core.chunk_append(b__90334,(function (){var on_click_SINGLEQUOTE_ = new cljs.core.Keyword(null,"on-click","on-click",1632826543).cljs$core$IFn$_invoke$arity$1(options);
var href_SINGLEQUOTE_ = new cljs.core.Keyword(null,"href","href",-793805698).cljs$core$IFn$_invoke$arity$1(options);
if(cljs.core.truth_(hr)){
return daiquiri.interpreter.interpret((logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null)));
} else {
return daiquiri.interpreter.interpret((function (){var G__90342 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(options,new cljs.core.Keyword(null,"title","title",636505583),hover_detail,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__90333,on_click_SINGLEQUOTE_,href_SINGLEQUOTE_,map__90336,map__90336__$1,hr,item,hover_detail,title,options,icon,c__5478__auto__,size__5479__auto__,b__90334,s__90332__$2,temp__5804__auto__,multiple_windows_QMARK_,current_repo,login_QMARK_,repos,remotes,rtc_graphs,downloading_graph_id,remotes_loading_QMARK_,db_based_QMARK_,repos__$1,repos__$2,items_fn,header_fn,_remote_QMARK_,_repo_name,map__90326,map__90326__$1,opts,contentid){
return (function (e){
if(cljs.core.truth_(on_click_SINGLEQUOTE_)){
if((on_click_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1 ? on_click_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1(e) : on_click_SINGLEQUOTE_.call(null,e)) === false){
return null;
} else {
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(contentid) : logseq.shui.ui.popup_hide_BANG_.call(null,contentid));
}
} else {
return null;
}
});})(i__90333,on_click_SINGLEQUOTE_,href_SINGLEQUOTE_,map__90336,map__90336__$1,hr,item,hover_detail,title,options,icon,c__5478__auto__,size__5479__auto__,b__90334,s__90332__$2,temp__5804__auto__,multiple_windows_QMARK_,current_repo,login_QMARK_,repos,remotes,rtc_graphs,downloading_graph_id,remotes_loading_QMARK_,db_based_QMARK_,repos__$1,repos__$2,items_fn,header_fn,_remote_QMARK_,_repo_name,map__90326,map__90326__$1,opts,contentid))
], 0));
var G__90343 = (function (){var or__5002__auto__ = item;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core.truth_(href_SINGLEQUOTE_)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center.w-full","a.flex.items-center.w-full",578384940),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"href","href",-793805698),href_SINGLEQUOTE_,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__90333,or__5002__auto__,G__90342,on_click_SINGLEQUOTE_,href_SINGLEQUOTE_,map__90336,map__90336__$1,hr,item,hover_detail,title,options,icon,c__5478__auto__,size__5479__auto__,b__90334,s__90332__$2,temp__5804__auto__,multiple_windows_QMARK_,current_repo,login_QMARK_,repos,remotes,rtc_graphs,downloading_graph_id,remotes_loading_QMARK_,db_based_QMARK_,repos__$1,repos__$2,items_fn,header_fn,_remote_QMARK_,_repo_name,map__90326,map__90326__$1,opts,contentid){
return (function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(contentid) : logseq.shui.ui.popup_hide_BANG_.call(null,contentid));
});})(i__90333,or__5002__auto__,G__90342,on_click_SINGLEQUOTE_,href_SINGLEQUOTE_,map__90336,map__90336__$1,hr,item,hover_detail,title,options,icon,c__5478__auto__,size__5479__auto__,b__90334,s__90332__$2,temp__5804__auto__,multiple_windows_QMARK_,current_repo,login_QMARK_,repos,remotes,rtc_graphs,downloading_graph_id,remotes_loading_QMARK_,db_based_QMARK_,repos__$1,repos__$2,items_fn,header_fn,_remote_QMARK_,_repo_name,map__90326,map__90326__$1,opts,contentid))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),"inherit"], null)], null),title], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1.w-full","span.flex.items-center.gap-1.w-full",1802139938),icon,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),title], null)], null);
}
}
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90342,G__90343) : logseq.shui.ui.dropdown_menu_item.call(null,G__90342,G__90343));
})());
}
})());

var G__90400 = (i__90333 + (1));
i__90333 = G__90400;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__90334),frontend$components$repo$iter__90331(cljs.core.chunk_rest(s__90332__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__90334),null);
}
} else {
var map__90347 = cljs.core.first(s__90332__$2);
var map__90347__$1 = cljs.core.__destructure_map(map__90347);
var hr = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90347__$1,new cljs.core.Keyword(null,"hr","hr",1377740067));
var item = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90347__$1,new cljs.core.Keyword(null,"item","item",249373802));
var hover_detail = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90347__$1,new cljs.core.Keyword(null,"hover-detail","hover-detail",-1668874248));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90347__$1,new cljs.core.Keyword(null,"title","title",636505583));
var options = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90347__$1,new cljs.core.Keyword(null,"options","options",99638489));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90347__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
return cljs.core.cons((function (){var on_click_SINGLEQUOTE_ = new cljs.core.Keyword(null,"on-click","on-click",1632826543).cljs$core$IFn$_invoke$arity$1(options);
var href_SINGLEQUOTE_ = new cljs.core.Keyword(null,"href","href",-793805698).cljs$core$IFn$_invoke$arity$1(options);
if(cljs.core.truth_(hr)){
return daiquiri.interpreter.interpret((logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dropdown_menu_separator.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dropdown_menu_separator.call(null)));
} else {
return daiquiri.interpreter.interpret((function (){var G__90351 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(options,new cljs.core.Keyword(null,"title","title",636505583),hover_detail,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (on_click_SINGLEQUOTE_,href_SINGLEQUOTE_,map__90347,map__90347__$1,hr,item,hover_detail,title,options,icon,s__90332__$2,temp__5804__auto__,multiple_windows_QMARK_,current_repo,login_QMARK_,repos,remotes,rtc_graphs,downloading_graph_id,remotes_loading_QMARK_,db_based_QMARK_,repos__$1,repos__$2,items_fn,header_fn,_remote_QMARK_,_repo_name,map__90326,map__90326__$1,opts,contentid){
return (function (e){
if(cljs.core.truth_(on_click_SINGLEQUOTE_)){
if((on_click_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1 ? on_click_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$1(e) : on_click_SINGLEQUOTE_.call(null,e)) === false){
return null;
} else {
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(contentid) : logseq.shui.ui.popup_hide_BANG_.call(null,contentid));
}
} else {
return null;
}
});})(on_click_SINGLEQUOTE_,href_SINGLEQUOTE_,map__90347,map__90347__$1,hr,item,hover_detail,title,options,icon,s__90332__$2,temp__5804__auto__,multiple_windows_QMARK_,current_repo,login_QMARK_,repos,remotes,rtc_graphs,downloading_graph_id,remotes_loading_QMARK_,db_based_QMARK_,repos__$1,repos__$2,items_fn,header_fn,_remote_QMARK_,_repo_name,map__90326,map__90326__$1,opts,contentid))
], 0));
var G__90352 = (function (){var or__5002__auto__ = item;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core.truth_(href_SINGLEQUOTE_)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"a.flex.items-center.w-full","a.flex.items-center.w-full",578384940),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"href","href",-793805698),href_SINGLEQUOTE_,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (or__5002__auto__,G__90351,on_click_SINGLEQUOTE_,href_SINGLEQUOTE_,map__90347,map__90347__$1,hr,item,hover_detail,title,options,icon,s__90332__$2,temp__5804__auto__,multiple_windows_QMARK_,current_repo,login_QMARK_,repos,remotes,rtc_graphs,downloading_graph_id,remotes_loading_QMARK_,db_based_QMARK_,repos__$1,repos__$2,items_fn,header_fn,_remote_QMARK_,_repo_name,map__90326,map__90326__$1,opts,contentid){
return (function (){
return (logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.popup_hide_BANG_.cljs$core$IFn$_invoke$arity$1(contentid) : logseq.shui.ui.popup_hide_BANG_.call(null,contentid));
});})(or__5002__auto__,G__90351,on_click_SINGLEQUOTE_,href_SINGLEQUOTE_,map__90347,map__90347__$1,hr,item,hover_detail,title,options,icon,s__90332__$2,temp__5804__auto__,multiple_windows_QMARK_,current_repo,login_QMARK_,repos,remotes,rtc_graphs,downloading_graph_id,remotes_loading_QMARK_,db_based_QMARK_,repos__$1,repos__$2,items_fn,header_fn,_remote_QMARK_,_repo_name,map__90326,map__90326__$1,opts,contentid))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),"inherit"], null)], null),title], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.items-center.gap-1.w-full","span.flex.items-center.gap-1.w-full",1802139938),icon,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),title], null)], null);
}
}
})();
return (logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.dropdown_menu_item.cljs$core$IFn$_invoke$arity$2(G__90351,G__90352) : logseq.shui.ui.dropdown_menu_item.call(null,G__90351,G__90352));
})());
}
})(),frontend$components$repo$iter__90331(cljs.core.rest(s__90332__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(items_fn());
})())]),daiquiri.interpreter.interpret(frontend.components.repo.repos_footer(multiple_windows_QMARK_,db_based_QMARK_))]);
};
var G__90399 = function (_state,var_args){
var p__90325 = null;
if (arguments.length > 1) {
var G__90401__i = 0, G__90401__a = new Array(arguments.length -  1);
while (G__90401__i < G__90401__a.length) {G__90401__a[G__90401__i] = arguments[G__90401__i + 1]; ++G__90401__i;}
  p__90325 = new cljs.core.IndexedSeq(G__90401__a,0,null);
} 
return G__90399__delegate.call(this,_state,p__90325);};
G__90399.cljs$lang$maxFixedArity = 1;
G__90399.cljs$lang$applyTo = (function (arglist__90402){
var _state = cljs.core.first(arglist__90402);
var p__90325 = cljs.core.rest(arglist__90402);
return G__90399__delegate(_state,p__90325);
});
G__90399.cljs$core$IFn$_invoke$arity$variadic = G__90399__delegate;
return G__90399;
})()
,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.repo/repos-dropdown-content");
frontend.components.repo.graphs_selector = rum.core.lazy_build(rum.core.build_defcs,(function (_state){
var current_repo = frontend.state.get_current_repo();
var user_repos = frontend.state.get_repos();
var current_repo_SINGLEQUOTE_ = (function (){var G__90354 = user_repos;
if((G__90354 == null)){
return null;
} else {
return medley.core.find_first.cljs$core$IFn$_invoke$arity$2((function (p1__90353_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_repo,new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(p1__90353_SHARP_));
}),G__90354);
}
})();
var repo_name = (cljs.core.truth_(current_repo)?(frontend.db.get_repo_name.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_repo_name.cljs$core$IFn$_invoke$arity$1(current_repo) : frontend.db.get_repo_name.call(null,current_repo)):null);
var db_based_QMARK_ = frontend.config.db_based_graph_QMARK_.cljs$core$IFn$_invoke$arity$1(current_repo);
var remote_QMARK_ = new cljs.core.Keyword(null,"remote?","remote?",-517415110).cljs$core$IFn$_invoke$arity$1(current_repo_SINGLEQUOTE_);
var short_repo_name = (cljs.core.truth_(current_repo)?(frontend.db.get_short_repo_name.cljs$core$IFn$_invoke$arity$1 ? frontend.db.get_short_repo_name.cljs$core$IFn$_invoke$arity$1(repo_name) : frontend.db.get_short_repo_name.call(null,repo_name)):"Select a Graph");
return daiquiri.core.create_element("div",{'className':"cp__graphs-selector flex items-center justify-between"},[daiquiri.core.create_element("a",{'title':current_repo,'onClick':(function (e){
var G__90355 = e.target.closest("a");
var G__90356 = (function (p__90358){
var map__90359 = p__90358;
var map__90359__$1 = cljs.core.__destructure_map(map__90359);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__90359__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
return frontend.components.repo.repos_dropdown_content(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"contentid","contentid",-911323860),id], null));
});
var G__90357 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"as-dropdown?","as-dropdown?",-37553558),true,new cljs.core.Keyword(null,"content-props","content-props",687449284),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"repos-list"], null),new cljs.core.Keyword(null,"align","align",1964212802),new cljs.core.Keyword(null,"start","start",-355208981)], null);
return (logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3 ? logseq.shui.ui.popup_show_BANG_.cljs$core$IFn$_invoke$arity$3(G__90355,G__90356,G__90357) : logseq.shui.ui.popup_show_BANG_.call(null,G__90355,G__90356,G__90357));
}),'className':"item flex items-center gap-1 select-none"},[(function (){var attrs90360 = logseq.shui.ui.tabler_icon((cljs.core.truth_(remote_QMARK_)?"cloud":((db_based_QMARK_)?"topology-star":"folder")),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(16)], null));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs90360))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["thumb"], null)], null),attrs90360], 0))):{'className':"thumb"}),((cljs.core.map_QMARK_(attrs90360))?null:[daiquiri.interpreter.interpret(attrs90360)]));
})(),(function (){var attrs90361 = short_repo_name;
return daiquiri.core.create_element("strong",((cljs.core.map_QMARK_(attrs90361))?daiquiri.interpreter.element_attributes(attrs90361):null),((cljs.core.map_QMARK_(attrs90361))?null:[daiquiri.interpreter.interpret(attrs90361)]));
})(),daiquiri.interpreter.interpret(logseq.shui.ui.tabler_icon("selector",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(18)], null)))])]);
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.components.repo/graphs-selector");
frontend.components.repo.invalid_graph_name_warning = (function frontend$components$repo$invalid_graph_name_warning(){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"Graph name can't contain following reserved characters:"], null),new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul","ul",-1349521403),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),"< (less than)"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),"> (greater than)"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),": (colon)"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),"\" (double quote)"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),"/ (forward slash)"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),"\\ (backslash)"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),"| (vertical bar or pipe)"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),"? (question mark)"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),"* (asterisk)"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),"# (hash)"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),"+ (plus)"], null)], null)], null),new cljs.core.Keyword(null,"warning","warning",-1685650671),false);
});
/**
 * Returns boolean indicating if DB graph name is invalid. Must be kept in sync with invalid-graph-name-warning
 */
frontend.components.repo.invalid_graph_name_QMARK_ = (function frontend$components$repo$invalid_graph_name_QMARK_(graph_name){
var or__5002__auto__ = (frontend.util.fs.include_reserved_chars_QMARK_.cljs$core$IFn$_invoke$arity$1 ? frontend.util.fs.include_reserved_chars_QMARK_.cljs$core$IFn$_invoke$arity$1(graph_name) : frontend.util.fs.include_reserved_chars_QMARK_.call(null,graph_name));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ((clojure.string.includes_QMARK_(graph_name,"+")) || (clojure.string.includes_QMARK_(graph_name,"/")));
}
});
frontend.components.repo.new_db_graph = rum.core.lazy_build(rum.core.build_defcs,(function (state){
var _STAR_creating_db_QMARK_ = new cljs.core.Keyword("frontend.components.repo","creating-db?","frontend.components.repo/creating-db?",1624177631).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_graph_name = new cljs.core.Keyword("frontend.components.repo","graph-name","frontend.components.repo/graph-name",1264287251).cljs$core$IFn$_invoke$arity$1(state);
var _STAR_cloud_QMARK_ = new cljs.core.Keyword("frontend.components.repo","cloud?","frontend.components.repo/cloud?",184219525).cljs$core$IFn$_invoke$arity$1(state);
var input_ref = cljs.core.deref(new cljs.core.Keyword("frontend.components.repo","input-ref","frontend.components.repo/input-ref",1439219928).cljs$core$IFn$_invoke$arity$1(state));
var new_db_f = (function (){
if(cljs.core.truth_((function (){var or__5002__auto__ = clojure.string.blank_QMARK_(cljs.core.deref(_STAR_graph_name));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return cljs.core.deref(_STAR_creating_db_QMARK_);
}
})())){
return null;
} else {
if(cljs.core.truth_(frontend.components.repo.invalid_graph_name_QMARK_(cljs.core.deref(_STAR_graph_name)))){
return frontend.components.repo.invalid_graph_name_warning();
} else {
cljs.core.reset_BANG_(_STAR_creating_db_QMARK_,true);

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.repo.new_db_BANG_.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(_STAR_graph_name))),(function (repo){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(cljs.core.deref(_STAR_cloud_QMARK_))?promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40957__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("rtc","uploading?","rtc/uploading?",316154315),true)),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.handler.db_based.rtc._LT_rtc_create_graph_BANG_(repo)),(function (___40947__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.state.set_state_BANG_(new cljs.core.Keyword("rtc","uploading?","rtc/uploading?",316154315),false)),(function (___40947__auto____$2){
return promesa.protocols._promise(frontend.handler.db_based.rtc_flows.trigger_rtc_start(repo));
}));
}));
}));
})),(function (error){
cljs.core.reset_BANG_(_STAR_creating_db_QMARK_,false);

frontend.state.set_state_BANG_(new cljs.core.Keyword("rtc","uploading?","rtc/uploading?",316154315),false);

return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.components.repo",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"create-db-failed","create-db-failed",396243016),error,new cljs.core.Keyword(null,"line","line",212345235),447], null)),null);
})):null)),(function (___40947__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(_STAR_creating_db_QMARK_,false)),(function (___40947__auto____$1){
return promesa.protocols._promise((logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.ui.dialog_close_BANG_.cljs$core$IFn$_invoke$arity$0() : logseq.shui.ui.dialog_close_BANG_.call(null)));
}));
}));
}));
}));
}
}
});
var submit_BANG_ = (function (e,click_QMARK_){
var temp__5804__auto__ = (function (){var and__5000__auto__ = (function (){var or__5002__auto__ = click_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.components.repo.goog$module$goog$object.get(e,"key"),"Enter");
}
})();
if(cljs.core.truth_(and__5000__auto__)){
return frontend.util.trim_safe(rum.core.deref(input_ref).value);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var value = temp__5804__auto__;
cljs.core.reset_BANG_(_STAR_graph_name,value);

return new_db_f();
} else {
return null;
}
});
var attrs90366 = (function (){var G__90381 = new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"default-value","default-value",232220170),cljs.core.deref(_STAR_graph_name),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.deref(_STAR_creating_db_QMARK_),new cljs.core.Keyword(null,"ref","ref",1289896967),input_ref,new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"your graph name",new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),submit_BANG_], null);
return (logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.input.cljs$core$IFn$_invoke$arity$1(G__90381) : logseq.shui.ui.input.call(null,G__90381));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90366))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["new-graph","flex","flex-col","gap-4","p-1","pt-2"], null)], null),attrs90366], 0))):{'className':"new-graph flex flex-col gap-4 p-1 pt-2"}),((cljs.core.map_QMARK_(attrs90366))?[((frontend.handler.user.team_member_QMARK_())?(function (){var attrs90369 = (function (){var G__90382 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),"rtc-sync",new cljs.core.Keyword(null,"value","value",305978217),cljs.core.deref(_STAR_cloud_QMARK_),new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),(function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_cloud_QMARK_,cljs.core.not);
})], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__90382) : logseq.shui.ui.checkbox.call(null,G__90382));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90369))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-1"], null)], null),attrs90369], 0))):{'className':"flex flex-row items-center gap-1"}),((cljs.core.map_QMARK_(attrs90369))?[daiquiri.core.create_element("label",{'className':"opacity-70 text-sm",'htmlFor':"rtc-sync"},["Use Logseq Sync?"])]:[daiquiri.interpreter.interpret(attrs90369),daiquiri.core.create_element("label",{'className':"opacity-70 text-sm",'htmlFor':"rtc-sync"},["Use Logseq Sync?"])]));
})():null),daiquiri.interpreter.interpret((function (){var G__90385 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__90363_SHARP_){
return submit_BANG_(p1__90363_SHARP_,true);
}),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),submit_BANG_], null);
var G__90386 = (cljs.core.truth_(cljs.core.deref(_STAR_creating_db_QMARK_))?frontend.ui.loading.cljs$core$IFn$_invoke$arity$1("Creating graph"):"Submit");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__90385,G__90386) : logseq.shui.ui.button.call(null,G__90385,G__90386));
})())]:[daiquiri.interpreter.interpret(attrs90366),((frontend.handler.user.team_member_QMARK_())?(function (){var attrs90376 = (function (){var G__90387 = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),"rtc-sync",new cljs.core.Keyword(null,"value","value",305978217),cljs.core.deref(_STAR_cloud_QMARK_),new cljs.core.Keyword(null,"on-checked-change","on-checked-change",-482086819),(function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_cloud_QMARK_,cljs.core.not);
})], null);
return (logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1 ? logseq.shui.ui.checkbox.cljs$core$IFn$_invoke$arity$1(G__90387) : logseq.shui.ui.checkbox.call(null,G__90387));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs90376))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","flex-row","items-center","gap-1"], null)], null),attrs90376], 0))):{'className':"flex flex-row items-center gap-1"}),((cljs.core.map_QMARK_(attrs90376))?[daiquiri.core.create_element("label",{'className':"opacity-70 text-sm",'htmlFor':"rtc-sync"},["Use Logseq Sync?"])]:[daiquiri.interpreter.interpret(attrs90376),daiquiri.core.create_element("label",{'className':"opacity-70 text-sm",'htmlFor':"rtc-sync"},["Use Logseq Sync?"])]));
})():null),daiquiri.interpreter.interpret((function (){var G__90390 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (p1__90363_SHARP_){
return submit_BANG_(p1__90363_SHARP_,true);
}),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),submit_BANG_], null);
var G__90391 = (cljs.core.truth_(cljs.core.deref(_STAR_creating_db_QMARK_))?frontend.ui.loading.cljs$core$IFn$_invoke$arity$1("Creating graph"):"Submit");
return (logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2 ? logseq.shui.ui.button.cljs$core$IFn$_invoke$arity$2(G__90390,G__90391) : logseq.shui.ui.button.call(null,G__90390,G__90391));
})())]));
}),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.components.repo","graph-name","frontend.components.repo/graph-name",1264287251)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.repo","cloud?","frontend.components.repo/cloud?",184219525)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.repo","creating-db?","frontend.components.repo/creating-db?",1624177631)),rum.core.local.cljs$core$IFn$_invoke$arity$2(rum.core.create_ref(),new cljs.core.Keyword("frontend.components.repo","input-ref","frontend.components.repo/input-ref",1439219928)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"did-mount","did-mount",918232960),(function (s){
var temp__5804__auto___90403 = (function (){var G__90392 = cljs.core.deref(new cljs.core.Keyword("frontend.components.repo","input-ref","frontend.components.repo/input-ref",1439219928).cljs$core$IFn$_invoke$arity$1(s));
if((G__90392 == null)){
return null;
} else {
return rum.core.deref(G__90392);
}
})();
if(cljs.core.truth_(temp__5804__auto___90403)){
var input_90404 = temp__5804__auto___90403;
setTimeout((function (){
return input_90404.focus();
}),(32));
} else {
}

return s;
})], null)], null),"frontend.components.repo/new-db-graph");

//# sourceMappingURL=frontend.components.repo.js.map
