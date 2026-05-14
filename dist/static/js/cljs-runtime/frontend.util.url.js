goog.provide('frontend.util.url');
frontend.util.url.LSP_SCHEME = "logseq";
frontend.util.url.encode = encodeURI;
frontend.util.url.encode_param = encodeURIComponent;
frontend.util.url.get_local_repo_identifier = (function frontend$util$url$get_local_repo_identifier(repo){
var repo_name = frontend.db.conn.get_repo_name(repo);
return frontend.db.conn.get_short_repo_name(repo_name);
});
/**
 * Get Logseq protocol URL, w/o param (v0.1).
 * host: set to `nil` for local graph
 * protocol?: if true, returns URL with protocol prefix
 */
frontend.util.url.get_repo_id_url = (function frontend$util$url$get_repo_id_url(var_args){
var G__64994 = arguments.length;
switch (G__64994) {
case 3:
return frontend.util.url.get_repo_id_url.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return frontend.util.url.get_repo_id_url.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.url.get_repo_id_url.cljs$core$IFn$_invoke$arity$3 = (function (host,action,repo_identifier){
return frontend.util.url.get_repo_id_url.cljs$core$IFn$_invoke$arity$4(host,action,repo_identifier,true);
}));

(frontend.util.url.get_repo_id_url.cljs$core$IFn$_invoke$arity$4 = (function (host,action,repo_identifier,protocol_QMARK_){
return [(cljs.core.truth_(protocol_QMARK_)?[frontend.util.url.LSP_SCHEME,"://"].join(''):null),(cljs.core.truth_(host)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(host),"/"].join(''):null),cljs.core.str.cljs$core$IFn$_invoke$arity$1(action),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1((frontend.util.url.encode.cljs$core$IFn$_invoke$arity$1 ? frontend.util.url.encode.cljs$core$IFn$_invoke$arity$1(repo_identifier) : frontend.util.url.encode.call(null,repo_identifier)))].join('');
}));

(frontend.util.url.get_repo_id_url.cljs$lang$maxFixedArity = 4);

/**
 * The URL represents an graph, for example:
 * logseq://graph/abc
 * Ensure repo is valid before hand.
 * host: set to `nil` for local graph
 * protocol?: if true, returns URL with protocol prefix
 */
frontend.util.url.get_logseq_graph_url = (function frontend$util$url$get_logseq_graph_url(var_args){
var G__65001 = arguments.length;
switch (G__65001) {
case 2:
return frontend.util.url.get_logseq_graph_url.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.util.url.get_logseq_graph_url.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.url.get_logseq_graph_url.cljs$core$IFn$_invoke$arity$2 = (function (host,repo){
return frontend.util.url.get_logseq_graph_url.cljs$core$IFn$_invoke$arity$3(host,repo,true);
}));

(frontend.util.url.get_logseq_graph_url.cljs$core$IFn$_invoke$arity$3 = (function (host,repo,protocol_QMARK_){
var repo_identifier = (cljs.core.truth_(host)?repo:frontend.util.url.get_local_repo_identifier(repo));
return frontend.util.url.get_repo_id_url.cljs$core$IFn$_invoke$arity$4(host,"graph",repo_identifier,protocol_QMARK_);
}));

(frontend.util.url.get_logseq_graph_url.cljs$lang$maxFixedArity = 3);

/**
 * The URL represents an entity in graph with uuid, for example:
 * logseq://graph/abc?block-id=<uuid>
 * Ensure repo and uuid are valid before hand.
 * host: set to `nil` for local graph
 * protocol?: if true, returns URL with protocol prefix
 */
frontend.util.url.get_logseq_graph_uuid_url = (function frontend$util$url$get_logseq_graph_uuid_url(var_args){
var G__65003 = arguments.length;
switch (G__65003) {
case 3:
return frontend.util.url.get_logseq_graph_uuid_url.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return frontend.util.url.get_logseq_graph_uuid_url.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.url.get_logseq_graph_uuid_url.cljs$core$IFn$_invoke$arity$3 = (function (host,repo,uuid){
return frontend.util.url.get_logseq_graph_uuid_url.cljs$core$IFn$_invoke$arity$4(host,repo,uuid,true);
}));

(frontend.util.url.get_logseq_graph_uuid_url.cljs$core$IFn$_invoke$arity$4 = (function (host,repo,uuid,protocol_QMARK_){
return [frontend.util.url.get_logseq_graph_url.cljs$core$IFn$_invoke$arity$3(host,repo,protocol_QMARK_),"?block-id=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(uuid)].join('');
}));

(frontend.util.url.get_logseq_graph_uuid_url.cljs$lang$maxFixedArity = 4);

/**
 * The URL represents an page in graph with pagename, for example:
 * logseq://graph/abc?page=<page-name>
 * Ensure repo and page-name are valid before hand.
 * host: set to `nil` for local graph
 * protocol?: if true, returns URL with protocol prefix
 */
frontend.util.url.get_logseq_graph_page_url = (function frontend$util$url$get_logseq_graph_page_url(var_args){
var G__65005 = arguments.length;
switch (G__65005) {
case 3:
return frontend.util.url.get_logseq_graph_page_url.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return frontend.util.url.get_logseq_graph_page_url.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.util.url.get_logseq_graph_page_url.cljs$core$IFn$_invoke$arity$3 = (function (host,repo,page_name){
return frontend.util.url.get_logseq_graph_page_url.cljs$core$IFn$_invoke$arity$4(host,repo,page_name,true);
}));

(frontend.util.url.get_logseq_graph_page_url.cljs$core$IFn$_invoke$arity$4 = (function (host,repo,page_name,protocol_QMARK_){
return [frontend.util.url.get_logseq_graph_url.cljs$core$IFn$_invoke$arity$3(host,repo,protocol_QMARK_),"?page=",cljs.core.str.cljs$core$IFn$_invoke$arity$1((frontend.util.url.encode_param.cljs$core$IFn$_invoke$arity$1 ? frontend.util.url.encode_param.cljs$core$IFn$_invoke$arity$1(page_name) : frontend.util.url.encode_param.call(null,page_name)))].join('');
}));

(frontend.util.url.get_logseq_graph_page_url.cljs$lang$maxFixedArity = 4);


//# sourceMappingURL=frontend.util.url.js.map
