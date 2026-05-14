goog.provide('cljs_http.core');
cljs_http.core.pending_requests = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
/**
 * Attempt to close the given channel and abort the pending HTTP request
 *   with which it is associated.
 */
cljs_http.core.abort_BANG_ = (function cljs_http$core$abort_BANG_(channel){
var temp__5804__auto__ = (function (){var fexpr__102166 = cljs.core.deref(cljs_http.core.pending_requests);
return (fexpr__102166.cljs$core$IFn$_invoke$arity$1 ? fexpr__102166.cljs$core$IFn$_invoke$arity$1(channel) : fexpr__102166.call(null,channel));
})();
if(cljs.core.truth_(temp__5804__auto__)){
var req = temp__5804__auto__;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(cljs_http.core.pending_requests,cljs.core.dissoc,channel);

cljs.core.async.close_BANG_(channel);

if(cljs.core.truth_(req.hasOwnProperty("abort"))){
return req.abort();
} else {
return new cljs.core.Keyword(null,"jsonp","jsonp",226119588).cljs$core$IFn$_invoke$arity$1(req).cancel(new cljs.core.Keyword(null,"request","request",1772954723).cljs$core$IFn$_invoke$arity$1(req));
}
} else {
return null;
}
});
cljs_http.core.aborted_QMARK_ = (function cljs_http$core$aborted_QMARK_(xhr){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(xhr.getLastErrorCode(),goog.net.ErrorCode.ABORT);
});
/**
 * Takes an XhrIo object and applies the default-headers to it.
 */
cljs_http.core.apply_default_headers_BANG_ = (function cljs_http$core$apply_default_headers_BANG_(xhr,headers){
var formatted_h = cljs.core.zipmap(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs_http.util.camelize,cljs.core.keys(headers)),cljs.core.vals(headers));
return cljs.core.dorun.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__102167){
var vec__102168 = p__102167;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102168,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__102168,(1),null);
return xhr.headers.set(k,v);
}),formatted_h));
});
/**
 * Takes an XhrIo object and sets response-type if not nil.
 */
cljs_http.core.apply_response_type_BANG_ = (function cljs_http$core$apply_response_type_BANG_(xhr,response_type){
return xhr.setResponseType((function (){var G__102171 = response_type;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"array-buffer","array-buffer",519008380),G__102171)){
return goog.net.XhrIo.ResponseType.ARRAY_BUFFER;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"blob","blob",1636965233),G__102171)){
return goog.net.XhrIo.ResponseType.BLOB;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"document","document",-1329188687),G__102171)){
return goog.net.XhrIo.ResponseType.DOCUMENT;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"text","text",-1790561697),G__102171)){
return goog.net.XhrIo.ResponseType.TEXT;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),G__102171)){
return goog.net.XhrIo.ResponseType.DEFAULT;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(null,G__102171)){
return goog.net.XhrIo.ResponseType.DEFAULT;
} else {
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__102171)].join('')));

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
cljs_http.core.build_xhr = (function cljs_http$core$build_xhr(p__102172){
var map__102173 = p__102172;
var map__102173__$1 = cljs.core.__destructure_map(map__102173);
var request = map__102173__$1;
var with_credentials_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102173__$1,new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222));
var default_headers = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102173__$1,new cljs.core.Keyword(null,"default-headers","default-headers",-43146094));
var response_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102173__$1,new cljs.core.Keyword(null,"response-type","response-type",-1493770458));
var timeout = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"timeout","timeout",-318625318).cljs$core$IFn$_invoke$arity$1(request);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
var send_credentials = (((with_credentials_QMARK_ == null))?true:with_credentials_QMARK_);
var G__102174 = (new goog.net.XhrIo());
cljs_http.core.apply_default_headers_BANG_(G__102174,default_headers);

cljs_http.core.apply_response_type_BANG_(G__102174,response_type);

G__102174.setTimeoutInterval(timeout);

G__102174.setWithCredentials(send_credentials);

return G__102174;
});
cljs_http.core.error_kw = cljs.core.PersistentHashMap.fromArrays([(0),(7),(1),(4),(6),(3),(2),(9),(5),(8)],[new cljs.core.Keyword(null,"no-error","no-error",1984610064),new cljs.core.Keyword(null,"abort","abort",521193198),new cljs.core.Keyword(null,"access-denied","access-denied",959449406),new cljs.core.Keyword(null,"custom-error","custom-error",-1565161123),new cljs.core.Keyword(null,"http-error","http-error",-1040049553),new cljs.core.Keyword(null,"ff-silent-error","ff-silent-error",189390514),new cljs.core.Keyword(null,"file-not-found","file-not-found",-65398940),new cljs.core.Keyword(null,"offline","offline",-107631935),new cljs.core.Keyword(null,"exception","exception",-335277064),new cljs.core.Keyword(null,"timeout","timeout",-318625318)]);
/**
 * Execute the HTTP request corresponding to the given Ring request
 *   map and return a core.async channel.
 */
cljs_http.core.xhr = (function cljs_http$core$xhr(p__102175){
var map__102176 = p__102175;
var map__102176__$1 = cljs.core.__destructure_map(map__102176);
var request = map__102176__$1;
var request_method = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102176__$1,new cljs.core.Keyword(null,"request-method","request-method",1764796830));
var headers = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102176__$1,new cljs.core.Keyword(null,"headers","headers",-835030129));
var body = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102176__$1,new cljs.core.Keyword(null,"body","body",-2049205669));
var cancel = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102176__$1,new cljs.core.Keyword(null,"cancel","cancel",-1964088360));
var progress = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102176__$1,new cljs.core.Keyword(null,"progress","progress",244323547));
var channel = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$0();
var request_url = cljs_http.util.build_url(request);
var method = cljs.core.name((function (){var or__5002__auto__ = request_method;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"get","get",1683182755);
}
})());
var headers__$1 = cljs_http.util.build_headers(headers);
var xhr = cljs_http.core.build_xhr(request);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(cljs_http.core.pending_requests,cljs.core.assoc,channel,xhr);

xhr.listen(goog.net.EventType.COMPLETE,(function (evt){
var target = evt.target;
var response = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"status","status",-1997798413),target.getStatus(),new cljs.core.Keyword(null,"success","success",1890645906),target.isSuccess(),new cljs.core.Keyword(null,"body","body",-2049205669),target.getResponse(),new cljs.core.Keyword(null,"headers","headers",-835030129),cljs_http.util.parse_headers(target.getAllResponseHeaders()),new cljs.core.Keyword(null,"trace-redirects","trace-redirects",-1149427907),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [request_url,target.getLastUri()], null),new cljs.core.Keyword(null,"error-code","error-code",180497232),(function (){var G__102177 = target.getLastErrorCode();
return (cljs_http.core.error_kw.cljs$core$IFn$_invoke$arity$1 ? cljs_http.core.error_kw.cljs$core$IFn$_invoke$arity$1(G__102177) : cljs_http.core.error_kw.call(null,G__102177));
})(),new cljs.core.Keyword(null,"error-text","error-text",2021893718),target.getLastError()], null);
if((!(cljs_http.core.aborted_QMARK_(xhr)))){
cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(channel,response);
} else {
}

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(cljs_http.core.pending_requests,cljs.core.dissoc,channel);

if(cljs.core.truth_(cancel)){
cljs.core.async.close_BANG_(cancel);
} else {
}

return cljs.core.async.close_BANG_(channel);
}));

if(cljs.core.truth_(progress)){
var listener_102230 = (function (direction,evt){
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(progress,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"direction","direction",-633359395),direction,new cljs.core.Keyword(null,"loaded","loaded",-1246482293),evt.loaded], null),(cljs.core.truth_(evt.lengthComputable)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"total","total",1916810418),evt.total], null):null)], 0)));
});
var G__102180_102231 = xhr;
G__102180_102231.setProgressEventsEnabled(true);

G__102180_102231.listen(goog.net.EventType.UPLOAD_PROGRESS,cljs.core.partial.cljs$core$IFn$_invoke$arity$2(listener_102230,new cljs.core.Keyword(null,"upload","upload",-255769218)));

G__102180_102231.listen(goog.net.EventType.DOWNLOAD_PROGRESS,cljs.core.partial.cljs$core$IFn$_invoke$arity$2(listener_102230,new cljs.core.Keyword(null,"download","download",-300081668)));

} else {
}

xhr.send(request_url,method,body,headers__$1);

if(cljs.core.truth_(cancel)){
var c__37594__auto___102232 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_102193){
var state_val_102194 = (state_102193[(1)]);
if((state_val_102194 === (1))){
var state_102193__$1 = state_102193;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_102193__$1,(2),cancel);
} else {
if((state_val_102194 === (2))){
var inst_102184 = (state_102193[(2)]);
var inst_102185 = xhr.isComplete();
var inst_102186 = cljs.core.not(inst_102185);
var state_102193__$1 = (function (){var statearr_102195 = state_102193;
(statearr_102195[(7)] = inst_102184);

return statearr_102195;
})();
if(inst_102186){
var statearr_102196_102235 = state_102193__$1;
(statearr_102196_102235[(1)] = (3));

} else {
var statearr_102197_102236 = state_102193__$1;
(statearr_102197_102236[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_102194 === (3))){
var inst_102188 = xhr.abort();
var state_102193__$1 = state_102193;
var statearr_102198_102237 = state_102193__$1;
(statearr_102198_102237[(2)] = inst_102188);

(statearr_102198_102237[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_102194 === (4))){
var state_102193__$1 = state_102193;
var statearr_102199_102238 = state_102193__$1;
(statearr_102199_102238[(2)] = null);

(statearr_102199_102238[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_102194 === (5))){
var inst_102191 = (state_102193[(2)]);
var state_102193__$1 = state_102193;
return cljs.core.async.impl.ioc_helpers.return_chan(state_102193__$1,inst_102191);
} else {
return null;
}
}
}
}
}
});
return (function() {
var cljs_http$core$xhr_$_state_machine__37085__auto__ = null;
var cljs_http$core$xhr_$_state_machine__37085__auto____0 = (function (){
var statearr_102200 = [null,null,null,null,null,null,null,null];
(statearr_102200[(0)] = cljs_http$core$xhr_$_state_machine__37085__auto__);

(statearr_102200[(1)] = (1));

return statearr_102200;
});
var cljs_http$core$xhr_$_state_machine__37085__auto____1 = (function (state_102193){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_102193);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e102201){var ex__37088__auto__ = e102201;
var statearr_102202_102239 = state_102193;
(statearr_102202_102239[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_102193[(4)]))){
var statearr_102203_102240 = state_102193;
(statearr_102203_102240[(1)] = cljs.core.first((state_102193[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__102241 = state_102193;
state_102193 = G__102241;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs_http$core$xhr_$_state_machine__37085__auto__ = function(state_102193){
switch(arguments.length){
case 0:
return cljs_http$core$xhr_$_state_machine__37085__auto____0.call(this);
case 1:
return cljs_http$core$xhr_$_state_machine__37085__auto____1.call(this,state_102193);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs_http$core$xhr_$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs_http$core$xhr_$_state_machine__37085__auto____0;
cljs_http$core$xhr_$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs_http$core$xhr_$_state_machine__37085__auto____1;
return cljs_http$core$xhr_$_state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_102204 = f__37595__auto__();
(statearr_102204[(6)] = c__37594__auto___102232);

return statearr_102204;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
}));

} else {
}

return channel;
});
/**
 * Execute the JSONP request corresponding to the given Ring request
 *   map and return a core.async channel.
 */
cljs_http.core.jsonp = (function cljs_http$core$jsonp(p__102205){
var map__102206 = p__102205;
var map__102206__$1 = cljs.core.__destructure_map(map__102206);
var request = map__102206__$1;
var timeout = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102206__$1,new cljs.core.Keyword(null,"timeout","timeout",-318625318));
var callback_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102206__$1,new cljs.core.Keyword(null,"callback-name","callback-name",336964714));
var cancel = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102206__$1,new cljs.core.Keyword(null,"cancel","cancel",-1964088360));
var keywordize_keys_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__102206__$1,new cljs.core.Keyword(null,"keywordize-keys?","keywordize-keys?",-254545987),true);
var channel = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$0();
var jsonp = (new goog.net.Jsonp(cljs_http.util.build_url(request),callback_name));
jsonp.setRequestTimeout(timeout);

var req_102242 = jsonp.send(null,(function cljs_http$core$jsonp_$_success_callback(data){
var response = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"status","status",-1997798413),(200),new cljs.core.Keyword(null,"success","success",1890645906),true,new cljs.core.Keyword(null,"body","body",-2049205669),cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(data,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),keywordize_keys_QMARK_], 0))], null);
cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(channel,response);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(cljs_http.core.pending_requests,cljs.core.dissoc,channel);

if(cljs.core.truth_(cancel)){
cljs.core.async.close_BANG_(cancel);
} else {
}

return cljs.core.async.close_BANG_(channel);
}),(function cljs_http$core$jsonp_$_error_callback(){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(cljs_http.core.pending_requests,cljs.core.dissoc,channel);

if(cljs.core.truth_(cancel)){
cljs.core.async.close_BANG_(cancel);
} else {
}

return cljs.core.async.close_BANG_(channel);
}));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(cljs_http.core.pending_requests,cljs.core.assoc,channel,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"jsonp","jsonp",226119588),jsonp,new cljs.core.Keyword(null,"request","request",1772954723),req_102242], null));

if(cljs.core.truth_(cancel)){
var c__37594__auto___102251 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_102211){
var state_val_102212 = (state_102211[(1)]);
if((state_val_102212 === (1))){
var state_102211__$1 = state_102211;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_102211__$1,(2),cancel);
} else {
if((state_val_102212 === (2))){
var inst_102208 = (state_102211[(2)]);
var inst_102209 = jsonp.cancel(req_102242);
var state_102211__$1 = (function (){var statearr_102214 = state_102211;
(statearr_102214[(7)] = inst_102208);

return statearr_102214;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_102211__$1,inst_102209);
} else {
return null;
}
}
});
return (function() {
var cljs_http$core$jsonp_$_state_machine__37085__auto__ = null;
var cljs_http$core$jsonp_$_state_machine__37085__auto____0 = (function (){
var statearr_102216 = [null,null,null,null,null,null,null,null];
(statearr_102216[(0)] = cljs_http$core$jsonp_$_state_machine__37085__auto__);

(statearr_102216[(1)] = (1));

return statearr_102216;
});
var cljs_http$core$jsonp_$_state_machine__37085__auto____1 = (function (state_102211){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_102211);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e102218){var ex__37088__auto__ = e102218;
var statearr_102219_102252 = state_102211;
(statearr_102219_102252[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_102211[(4)]))){
var statearr_102220_102254 = state_102211;
(statearr_102220_102254[(1)] = cljs.core.first((state_102211[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__102256 = state_102211;
state_102211 = G__102256;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
cljs_http$core$jsonp_$_state_machine__37085__auto__ = function(state_102211){
switch(arguments.length){
case 0:
return cljs_http$core$jsonp_$_state_machine__37085__auto____0.call(this);
case 1:
return cljs_http$core$jsonp_$_state_machine__37085__auto____1.call(this,state_102211);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs_http$core$jsonp_$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = cljs_http$core$jsonp_$_state_machine__37085__auto____0;
cljs_http$core$jsonp_$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = cljs_http$core$jsonp_$_state_machine__37085__auto____1;
return cljs_http$core$jsonp_$_state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_102222 = f__37595__auto__();
(statearr_102222[(6)] = c__37594__auto___102251);

return statearr_102222;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
}));

} else {
}

return channel;
});
/**
 * Execute the HTTP request corresponding to the given Ring request
 *   map and return a core.async channel.
 */
cljs_http.core.request = (function cljs_http$core$request(p__102225){
var map__102226 = p__102225;
var map__102226__$1 = cljs.core.__destructure_map(map__102226);
var request = map__102226__$1;
var request_method = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__102226__$1,new cljs.core.Keyword(null,"request-method","request-method",1764796830));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(request_method,new cljs.core.Keyword(null,"jsonp","jsonp",226119588))){
return cljs_http.core.jsonp(request);
} else {
return cljs_http.core.xhr(request);
}
});

//# sourceMappingURL=cljs_http.core.js.map
