goog.provide('cljs_http.core');
cljs_http.core.pending_requests = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
/**
 * Attempt to close the given channel and abort the pending HTTP request
 *   with which it is associated.
 */
cljs_http.core.abort_BANG_ = (function cljs_http$core$abort_BANG_(channel){
var temp__5804__auto__ = (function (){var fexpr__101906 = cljs.core.deref(cljs_http.core.pending_requests);
return (fexpr__101906.cljs$core$IFn$_invoke$arity$1 ? fexpr__101906.cljs$core$IFn$_invoke$arity$1(channel) : fexpr__101906.call(null,channel));
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
return cljs.core.dorun.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__101911){
var vec__101912 = p__101911;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101912,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__101912,(1),null);
return xhr.headers.set(k,v);
}),formatted_h));
});
/**
 * Takes an XhrIo object and sets response-type if not nil.
 */
cljs_http.core.apply_response_type_BANG_ = (function cljs_http$core$apply_response_type_BANG_(xhr,response_type){
return xhr.setResponseType((function (){var G__101917 = response_type;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"array-buffer","array-buffer",519008380),G__101917)){
return goog.net.XhrIo.ResponseType.ARRAY_BUFFER;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"blob","blob",1636965233),G__101917)){
return goog.net.XhrIo.ResponseType.BLOB;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"document","document",-1329188687),G__101917)){
return goog.net.XhrIo.ResponseType.DOCUMENT;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"text","text",-1790561697),G__101917)){
return goog.net.XhrIo.ResponseType.TEXT;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"default","default",-1987822328),G__101917)){
return goog.net.XhrIo.ResponseType.DEFAULT;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(null,G__101917)){
return goog.net.XhrIo.ResponseType.DEFAULT;
} else {
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__101917)].join('')));

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
cljs_http.core.build_xhr = (function cljs_http$core$build_xhr(p__101920){
var map__101921 = p__101920;
var map__101921__$1 = cljs.core.__destructure_map(map__101921);
var request = map__101921__$1;
var with_credentials_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101921__$1,new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222));
var default_headers = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101921__$1,new cljs.core.Keyword(null,"default-headers","default-headers",-43146094));
var response_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101921__$1,new cljs.core.Keyword(null,"response-type","response-type",-1493770458));
var timeout = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"timeout","timeout",-318625318).cljs$core$IFn$_invoke$arity$1(request);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
var send_credentials = (((with_credentials_QMARK_ == null))?true:with_credentials_QMARK_);
var G__101922 = (new goog.net.XhrIo());
cljs_http.core.apply_default_headers_BANG_(G__101922,default_headers);

cljs_http.core.apply_response_type_BANG_(G__101922,response_type);

G__101922.setTimeoutInterval(timeout);

G__101922.setWithCredentials(send_credentials);

return G__101922;
});
cljs_http.core.error_kw = cljs.core.PersistentHashMap.fromArrays([(0),(7),(1),(4),(6),(3),(2),(9),(5),(8)],[new cljs.core.Keyword(null,"no-error","no-error",1984610064),new cljs.core.Keyword(null,"abort","abort",521193198),new cljs.core.Keyword(null,"access-denied","access-denied",959449406),new cljs.core.Keyword(null,"custom-error","custom-error",-1565161123),new cljs.core.Keyword(null,"http-error","http-error",-1040049553),new cljs.core.Keyword(null,"ff-silent-error","ff-silent-error",189390514),new cljs.core.Keyword(null,"file-not-found","file-not-found",-65398940),new cljs.core.Keyword(null,"offline","offline",-107631935),new cljs.core.Keyword(null,"exception","exception",-335277064),new cljs.core.Keyword(null,"timeout","timeout",-318625318)]);
/**
 * Execute the HTTP request corresponding to the given Ring request
 *   map and return a core.async channel.
 */
cljs_http.core.xhr = (function cljs_http$core$xhr(p__101924){
var map__101925 = p__101924;
var map__101925__$1 = cljs.core.__destructure_map(map__101925);
var request = map__101925__$1;
var request_method = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101925__$1,new cljs.core.Keyword(null,"request-method","request-method",1764796830));
var headers = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101925__$1,new cljs.core.Keyword(null,"headers","headers",-835030129));
var body = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101925__$1,new cljs.core.Keyword(null,"body","body",-2049205669));
var cancel = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101925__$1,new cljs.core.Keyword(null,"cancel","cancel",-1964088360));
var progress = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101925__$1,new cljs.core.Keyword(null,"progress","progress",244323547));
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
var response = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"status","status",-1997798413),target.getStatus(),new cljs.core.Keyword(null,"success","success",1890645906),target.isSuccess(),new cljs.core.Keyword(null,"body","body",-2049205669),target.getResponse(),new cljs.core.Keyword(null,"headers","headers",-835030129),cljs_http.util.parse_headers(target.getAllResponseHeaders()),new cljs.core.Keyword(null,"trace-redirects","trace-redirects",-1149427907),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [request_url,target.getLastUri()], null),new cljs.core.Keyword(null,"error-code","error-code",180497232),(function (){var G__101929 = target.getLastErrorCode();
return (cljs_http.core.error_kw.cljs$core$IFn$_invoke$arity$1 ? cljs_http.core.error_kw.cljs$core$IFn$_invoke$arity$1(G__101929) : cljs_http.core.error_kw.call(null,G__101929));
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
var listener_101991 = (function (direction,evt){
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(progress,cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"direction","direction",-633359395),direction,new cljs.core.Keyword(null,"loaded","loaded",-1246482293),evt.loaded], null),(cljs.core.truth_(evt.lengthComputable)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"total","total",1916810418),evt.total], null):null)], 0)));
});
var G__101932_101992 = xhr;
G__101932_101992.setProgressEventsEnabled(true);

G__101932_101992.listen(goog.net.EventType.UPLOAD_PROGRESS,cljs.core.partial.cljs$core$IFn$_invoke$arity$2(listener_101991,new cljs.core.Keyword(null,"upload","upload",-255769218)));

G__101932_101992.listen(goog.net.EventType.DOWNLOAD_PROGRESS,cljs.core.partial.cljs$core$IFn$_invoke$arity$2(listener_101991,new cljs.core.Keyword(null,"download","download",-300081668)));

} else {
}

xhr.send(request_url,method,body,headers__$1);

if(cljs.core.truth_(cancel)){
var c__36895__auto___101994 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_101943){
var state_val_101944 = (state_101943[(1)]);
if((state_val_101944 === (1))){
var state_101943__$1 = state_101943;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_101943__$1,(2),cancel);
} else {
if((state_val_101944 === (2))){
var inst_101934 = (state_101943[(2)]);
var inst_101935 = xhr.isComplete();
var inst_101936 = cljs.core.not(inst_101935);
var state_101943__$1 = (function (){var statearr_101947 = state_101943;
(statearr_101947[(7)] = inst_101934);

return statearr_101947;
})();
if(inst_101936){
var statearr_101949_101996 = state_101943__$1;
(statearr_101949_101996[(1)] = (3));

} else {
var statearr_101950_101997 = state_101943__$1;
(statearr_101950_101997[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_101944 === (3))){
var inst_101938 = xhr.abort();
var state_101943__$1 = state_101943;
var statearr_101951_101998 = state_101943__$1;
(statearr_101951_101998[(2)] = inst_101938);

(statearr_101951_101998[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_101944 === (4))){
var state_101943__$1 = state_101943;
var statearr_101952_101999 = state_101943__$1;
(statearr_101952_101999[(2)] = null);

(statearr_101952_101999[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_101944 === (5))){
var inst_101941 = (state_101943[(2)]);
var state_101943__$1 = state_101943;
return cljs.core.async.impl.ioc_helpers.return_chan(state_101943__$1,inst_101941);
} else {
return null;
}
}
}
}
}
});
return (function() {
var cljs_http$core$xhr_$_state_machine__36595__auto__ = null;
var cljs_http$core$xhr_$_state_machine__36595__auto____0 = (function (){
var statearr_101953 = [null,null,null,null,null,null,null,null];
(statearr_101953[(0)] = cljs_http$core$xhr_$_state_machine__36595__auto__);

(statearr_101953[(1)] = (1));

return statearr_101953;
});
var cljs_http$core$xhr_$_state_machine__36595__auto____1 = (function (state_101943){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_101943);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e101954){var ex__36598__auto__ = e101954;
var statearr_101955_102000 = state_101943;
(statearr_101955_102000[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_101943[(4)]))){
var statearr_101956_102002 = state_101943;
(statearr_101956_102002[(1)] = cljs.core.first((state_101943[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__102003 = state_101943;
state_101943 = G__102003;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs_http$core$xhr_$_state_machine__36595__auto__ = function(state_101943){
switch(arguments.length){
case 0:
return cljs_http$core$xhr_$_state_machine__36595__auto____0.call(this);
case 1:
return cljs_http$core$xhr_$_state_machine__36595__auto____1.call(this,state_101943);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs_http$core$xhr_$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs_http$core$xhr_$_state_machine__36595__auto____0;
cljs_http$core$xhr_$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs_http$core$xhr_$_state_machine__36595__auto____1;
return cljs_http$core$xhr_$_state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_101957 = f__36897__auto__();
(statearr_101957[(6)] = c__36895__auto___101994);

return statearr_101957;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));

} else {
}

return channel;
});
/**
 * Execute the JSONP request corresponding to the given Ring request
 *   map and return a core.async channel.
 */
cljs_http.core.jsonp = (function cljs_http$core$jsonp(p__101958){
var map__101959 = p__101958;
var map__101959__$1 = cljs.core.__destructure_map(map__101959);
var request = map__101959__$1;
var timeout = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101959__$1,new cljs.core.Keyword(null,"timeout","timeout",-318625318));
var callback_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101959__$1,new cljs.core.Keyword(null,"callback-name","callback-name",336964714));
var cancel = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101959__$1,new cljs.core.Keyword(null,"cancel","cancel",-1964088360));
var keywordize_keys_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__101959__$1,new cljs.core.Keyword(null,"keywordize-keys?","keywordize-keys?",-254545987),true);
var channel = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$0();
var jsonp = (new goog.net.Jsonp(cljs_http.util.build_url(request),callback_name));
jsonp.setRequestTimeout(timeout);

var req_102005 = jsonp.send(null,(function cljs_http$core$jsonp_$_success_callback(data){
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
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(cljs_http.core.pending_requests,cljs.core.assoc,channel,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"jsonp","jsonp",226119588),jsonp,new cljs.core.Keyword(null,"request","request",1772954723),req_102005], null));

if(cljs.core.truth_(cancel)){
var c__36895__auto___102010 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_101964){
var state_val_101965 = (state_101964[(1)]);
if((state_val_101965 === (1))){
var state_101964__$1 = state_101964;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_101964__$1,(2),cancel);
} else {
if((state_val_101965 === (2))){
var inst_101961 = (state_101964[(2)]);
var inst_101962 = jsonp.cancel(req_102005);
var state_101964__$1 = (function (){var statearr_101966 = state_101964;
(statearr_101966[(7)] = inst_101961);

return statearr_101966;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_101964__$1,inst_101962);
} else {
return null;
}
}
});
return (function() {
var cljs_http$core$jsonp_$_state_machine__36595__auto__ = null;
var cljs_http$core$jsonp_$_state_machine__36595__auto____0 = (function (){
var statearr_101967 = [null,null,null,null,null,null,null,null];
(statearr_101967[(0)] = cljs_http$core$jsonp_$_state_machine__36595__auto__);

(statearr_101967[(1)] = (1));

return statearr_101967;
});
var cljs_http$core$jsonp_$_state_machine__36595__auto____1 = (function (state_101964){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_101964);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e101968){var ex__36598__auto__ = e101968;
var statearr_101969_102012 = state_101964;
(statearr_101969_102012[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_101964[(4)]))){
var statearr_101970_102013 = state_101964;
(statearr_101970_102013[(1)] = cljs.core.first((state_101964[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__102014 = state_101964;
state_101964 = G__102014;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
cljs_http$core$jsonp_$_state_machine__36595__auto__ = function(state_101964){
switch(arguments.length){
case 0:
return cljs_http$core$jsonp_$_state_machine__36595__auto____0.call(this);
case 1:
return cljs_http$core$jsonp_$_state_machine__36595__auto____1.call(this,state_101964);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs_http$core$jsonp_$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = cljs_http$core$jsonp_$_state_machine__36595__auto____0;
cljs_http$core$jsonp_$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = cljs_http$core$jsonp_$_state_machine__36595__auto____1;
return cljs_http$core$jsonp_$_state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_101971 = f__36897__auto__();
(statearr_101971[(6)] = c__36895__auto___102010);

return statearr_101971;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));

} else {
}

return channel;
});
/**
 * Execute the HTTP request corresponding to the given Ring request
 *   map and return a core.async channel.
 */
cljs_http.core.request = (function cljs_http$core$request(p__101972){
var map__101973 = p__101972;
var map__101973__$1 = cljs.core.__destructure_map(map__101973);
var request = map__101973__$1;
var request_method = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__101973__$1,new cljs.core.Keyword(null,"request-method","request-method",1764796830));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(request_method,new cljs.core.Keyword(null,"jsonp","jsonp",226119588))){
return cljs_http.core.jsonp(request);
} else {
return cljs_http.core.xhr(request);
}
});

//# sourceMappingURL=cljs_http.core.js.map
