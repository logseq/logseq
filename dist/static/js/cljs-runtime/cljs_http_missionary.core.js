goog.provide('cljs_http_missionary.core');
cljs_http_missionary.core.aborted_QMARK_ = (function cljs_http_missionary$core$aborted_QMARK_(xhr){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(xhr.getLastErrorCode(),goog.net.ErrorCode.ABORT);
});
/**
 * Takes an XhrIo object and applies the default-headers to it.
 */
cljs_http_missionary.core.apply_default_headers_BANG_ = (function cljs_http_missionary$core$apply_default_headers_BANG_(xhr,headers){
var formatted_h = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs_http_missionary.util.camelize,cljs.core.keys(headers)),cljs.core.vals(headers));
return cljs.core.dorun.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__67640){
var vec__67641 = p__67640;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67641,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67641,(1),null);
return xhr.headers.set(k,v);
}),formatted_h));
});
/**
 * Takes an XhrIo object and sets response-type if not nil.
 */
cljs_http_missionary.core.apply_response_type_BANG_ = (function cljs_http_missionary$core$apply_response_type_BANG_(xhr,response_type){
return xhr.setResponseType((function (){var G__67644 = response_type;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"array-buffer","array-buffer",519008380),G__67644)){
return goog.net.XhrIo.ResponseType.ARRAY_BUFFER;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"blob","blob",1636965233),G__67644)){
return goog.net.XhrIo.ResponseType.BLOB;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"document","document",-1329188687),G__67644)){
return goog.net.XhrIo.ResponseType.DOCUMENT;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"text","text",-1790561697),G__67644)){
return goog.net.XhrIo.ResponseType.TEXT;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),G__67644)){
return goog.net.XhrIo.ResponseType.DEFAULT;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(null,G__67644)){
return goog.net.XhrIo.ResponseType.DEFAULT;
} else {
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__67644)].join('')));

}
}
}
}
}
}
})());
});
/**
 * Builds an XhrIo object from the request parameters.
 */
cljs_http_missionary.core.build_xhr = (function cljs_http_missionary$core$build_xhr(p__67645){
var map__67646 = p__67645;
var map__67646__$1 = cljs.core.__destructure_map(map__67646);
var request = map__67646__$1;
var with_credentials_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67646__$1,new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222));
var default_headers = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67646__$1,new cljs.core.Keyword(null,"default-headers","default-headers",-43146094));
var response_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67646__$1,new cljs.core.Keyword(null,"response-type","response-type",-1493770458));
var timeout = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"timeout","timeout",-318625318).cljs$core$IFn$_invoke$arity$1(request);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
var send_credentials = (((with_credentials_QMARK_ == null))?true:with_credentials_QMARK_);
var G__67647 = (new goog.net.XhrIo());
cljs_http_missionary.core.apply_default_headers_BANG_(G__67647,default_headers);

cljs_http_missionary.core.apply_response_type_BANG_(G__67647,response_type);

G__67647.setTimeoutInterval(timeout);

G__67647.setWithCredentials(send_credentials);

return G__67647;
});
cljs_http_missionary.core.error_kw = cljs.core.PersistentHashMap.fromArrays([(0),(7),(1),(4),(6),(3),(2),(9),(5),(8)],[new cljs.core.Keyword(null,"no-error","no-error",1984610064),new cljs.core.Keyword(null,"abort","abort",521193198),new cljs.core.Keyword(null,"access-denied","access-denied",959449406),new cljs.core.Keyword(null,"custom-error","custom-error",-1565161123),new cljs.core.Keyword(null,"http-error","http-error",-1040049553),new cljs.core.Keyword(null,"ff-silent-error","ff-silent-error",189390514),new cljs.core.Keyword(null,"file-not-found","file-not-found",-65398940),new cljs.core.Keyword(null,"offline","offline",-107631935),new cljs.core.Keyword(null,"exception","exception",-335277064),new cljs.core.Keyword(null,"timeout","timeout",-318625318)]);
cljs_http_missionary.core.sentinel = ({});
/**
 * Execute the HTTP request corresponding to the given Ring request
 *   map and return a missionary task.
 *   If *progress-flow atom provided in request, reset it by a progress-flow
 */
cljs_http_missionary.core.xhr = (function cljs_http_missionary$core$xhr(p__67651){
var map__67652 = p__67651;
var map__67652__$1 = cljs.core.__destructure_map(map__67652);
var request = map__67652__$1;
var request_method = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67652__$1,new cljs.core.Keyword(null,"request-method","request-method",1764796830));
var headers = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67652__$1,new cljs.core.Keyword(null,"headers","headers",-835030129));
var body = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67652__$1,new cljs.core.Keyword(null,"body","body",-2049205669));
var _STAR_progress_flow = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67652__$1,new cljs.core.Keyword(null,"*progress-flow","*progress-flow",2049066069));
var request_url = cljs_http_missionary.util.build_url(request);
var method = cljs.core.name((function (){var or__5002__auto__ = request_method;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"get","get",1683182755);
}
})());
var headers__$1 = cljs_http_missionary.util.build_headers(headers);
var xhr = cljs_http_missionary.core.build_xhr(request);
var _STAR_finished_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
var get_response_task = missionary.core.reduce.cljs$core$IFn$_invoke$arity$3((function (_,v){
if((cljs_http_missionary.core.sentinel === v)){
return null;
} else {
return cljs.core.reduced(v);
}
}),cljs_http_missionary.core.sentinel,missionary.core.relieve.cljs$core$IFn$_invoke$arity$1(missionary.core.observe((function cljs_http_missionary$core$xhr_$_ctor(emit_BANG_){
xhr.listen(goog.net.EventType.COMPLETE,(function (evt){
var target = evt.target;
var response = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"status","status",-1997798413),target.getStatus(),new cljs.core.Keyword(null,"success","success",1890645906),target.isSuccess(),new cljs.core.Keyword(null,"body","body",-2049205669),target.getResponse(),new cljs.core.Keyword(null,"headers","headers",-835030129),cljs_http_missionary.util.parse_headers(target.getAllResponseHeaders()),new cljs.core.Keyword(null,"trace-redirects","trace-redirects",-1149427907),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [request_url,target.getLastUri()], null),new cljs.core.Keyword(null,"error-code","error-code",180497232),(function (){var G__67653 = target.getLastErrorCode();
return (cljs_http_missionary.core.error_kw.cljs$core$IFn$_invoke$arity$1 ? cljs_http_missionary.core.error_kw.cljs$core$IFn$_invoke$arity$1(G__67653) : cljs_http_missionary.core.error_kw.call(null,G__67653));
})(),new cljs.core.Keyword(null,"error-text","error-text",2021893718),target.getLastError()], null);
if(cljs_http_missionary.core.aborted_QMARK_(xhr)){
return null;
} else {
return (emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(response) : emit_BANG_.call(null,response));
}
}));

xhr.send(request_url,method,body,headers__$1);

return (function cljs_http_missionary$core$xhr_$_ctor_$_dtor(){
if(cljs.core.truth_(xhr.isComplete())){
} else {
xhr.abort();
}

return cljs.core.reset_BANG_(_STAR_finished_QMARK_,true);
});
}))));
if(cljs.core.truth_(_STAR_progress_flow)){
cljs.core.reset_BANG_(_STAR_progress_flow,missionary.core.stream(missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.take_while.cljs$core$IFn$_invoke$arity$1((function (p1__67650_SHARP_){
return (!((cljs_http_missionary.core.sentinel === p1__67650_SHARP_)));
})),missionary.core.relieve.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,missionary.core.observe((function cljs_http_missionary$core$xhr_$_ctor(emit_BANG_){
var listener_67660 = (function (direction,evt){
var e = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"direction","direction",-633359395),direction,new cljs.core.Keyword(null,"loaded","loaded",-1246482293),evt.loaded], null),(cljs.core.truth_(evt.lengthComputable)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"total","total",1916810418),evt.total], null):null)], 0));
return (emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(e) : emit_BANG_.call(null,e));
});
cljs.core.add_watch(_STAR_finished_QMARK_,new cljs.core.Keyword(null,"end-flow","end-flow",371712136),(function (_k,_r,_o,n){
if(n === true){
return (emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(cljs_http_missionary.core.sentinel) : emit_BANG_.call(null,cljs_http_missionary.core.sentinel));
} else {
return null;
}
}));

var G__67654_67661 = xhr;
G__67654_67661.setProgressEventsEnabled(true);

G__67654_67661.listen(goog.net.EventType.UPLOAD_PROGRESS,cljs.core.partial.cljs$core$IFn$_invoke$arity$2(listener_67660,new cljs.core.Keyword(null,"upload","upload",-255769218)));

G__67654_67661.listen(goog.net.EventType.DOWNLOAD_PROGRESS,cljs.core.partial.cljs$core$IFn$_invoke$arity$2(listener_67660,new cljs.core.Keyword(null,"download","download",-300081668)));


return (function (){
return null;
});
}))))));
} else {
}

return get_response_task;
});
/**
 * Execute the JSONP request corresponding to the given Ring request
 *   map and return a missionary task.
 */
cljs_http_missionary.core.jsonp = (function cljs_http_missionary$core$jsonp(p__67656){
var map__67657 = p__67656;
var map__67657__$1 = cljs.core.__destructure_map(map__67657);
var request = map__67657__$1;
var timeout = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67657__$1,new cljs.core.Keyword(null,"timeout","timeout",-318625318));
var callback_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67657__$1,new cljs.core.Keyword(null,"callback-name","callback-name",336964714));
var keywordize_keys_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__67657__$1,new cljs.core.Keyword(null,"keywordize-keys?","keywordize-keys?",-254545987),true);
var jsonp = (new goog.net.Jsonp(cljs_http_missionary.util.build_url(request),callback_name));
jsonp.setRequestTimeout(timeout);

return missionary.core.reduce.cljs$core$IFn$_invoke$arity$3((function (_,v){
if((cljs_http_missionary.core.sentinel === v)){
return null;
} else {
return cljs.core.reduced(v);
}
}),cljs_http_missionary.core.sentinel,missionary.core.relieve.cljs$core$IFn$_invoke$arity$1(missionary.core.observe((function cljs_http_missionary$core$jsonp_$_ctor(emit_BANG_){
jsonp.send(null,(function cljs_http_missionary$core$jsonp_$_ctor_$_success_callback(data){
var response = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"status","status",-1997798413),(200),new cljs.core.Keyword(null,"success","success",1890645906),true,new cljs.core.Keyword(null,"body","body",-2049205669),cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(data,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),keywordize_keys_QMARK_], 0))], null);
return (emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(response) : emit_BANG_.call(null,response));
}),(function cljs_http_missionary$core$jsonp_$_ctor_$_error_callback(){
return (emit_BANG_.cljs$core$IFn$_invoke$arity$1 ? emit_BANG_.cljs$core$IFn$_invoke$arity$1(null) : emit_BANG_.call(null,null));
}));

return (function (){
return null;
});
}))));
});
/**
 * Execute the HTTP request corresponding to the given Ring request
 *   map and return a missionary task.
 */
cljs_http_missionary.core.request = (function cljs_http_missionary$core$request(p__67658){
var map__67659 = p__67658;
var map__67659__$1 = cljs.core.__destructure_map(map__67659);
var request = map__67659__$1;
var request_method = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67659__$1,new cljs.core.Keyword(null,"request-method","request-method",1764796830));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(request_method,new cljs.core.Keyword(null,"jsonp","jsonp",226119588))){
return cljs_http_missionary.core.jsonp(request);
} else {
return cljs_http_missionary.core.xhr(request);
}
});

//# sourceMappingURL=cljs_http_missionary.core.js.map
