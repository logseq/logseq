goog.provide('cljs_http_missionary.client');
cljs_http_missionary.client.if_pos = (function cljs_http_missionary$client$if_pos(v){
if(cljs.core.truth_((function (){var and__5000__auto__ = v;
if(cljs.core.truth_(and__5000__auto__)){
return (v > (0));
} else {
return and__5000__auto__;
}
})())){
return v;
} else {
return null;
}
});
cljs_http_missionary.client.acc_param = (function cljs_http_missionary$client$acc_param(o,v){
if(cljs.core.coll_QMARK_(o)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(o,v);
} else {
if((!((o == null)))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [o,v], null);
} else {
return v;

}
}
});
/**
 * Parse `s` as query params and return a hash map.
 */
cljs_http_missionary.client.parse_query_params = (function cljs_http_missionary$client$parse_query_params(s){
if(clojure.string.blank_QMARK_(s)){
return null;
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p1__67809_SHARP_,p2__67808_SHARP_){
var vec__67823 = clojure.string.split.cljs$core$IFn$_invoke$arity$2(p2__67808_SHARP_,/=/);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67823,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67823,(1),null);
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(p1__67809_SHARP_,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs_http_missionary.util.url_decode(k)),cljs_http_missionary.client.acc_param,cljs_http_missionary.util.url_decode(v));
}),cljs.core.PersistentArrayMap.EMPTY,clojure.string.split.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(s),/&/));
}
});
/**
 * Parse `url` into a hash map.
 */
cljs_http_missionary.client.parse_url = (function cljs_http_missionary$client$parse_url(url){
if(clojure.string.blank_QMARK_(url)){
return null;
} else {
var uri = goog.Uri.parse(url);
var query_data = uri.getQueryData();
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"scheme","scheme",90199613),cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(uri.getScheme()),new cljs.core.Keyword(null,"server-name","server-name",-1012104295),uri.getDomain(),new cljs.core.Keyword(null,"server-port","server-port",663745648),cljs_http_missionary.client.if_pos(uri.getPort()),new cljs.core.Keyword(null,"uri","uri",-774711847),uri.getPath(),new cljs.core.Keyword(null,"query-string","query-string",-1018845061),(cljs.core.truth_(query_data.isEmpty())?null:cljs.core.str.cljs$core$IFn$_invoke$arity$1(query_data)),new cljs.core.Keyword(null,"query-params","query-params",900640534),(cljs.core.truth_(query_data.isEmpty())?null:cljs_http_missionary.client.parse_query_params(cljs.core.str.cljs$core$IFn$_invoke$arity$1(query_data)))], null);
}
});
cljs_http_missionary.client.unexceptional_status_QMARK_ = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 13, [(205),null,(206),null,(300),null,(204),null,(307),null,(303),null,(301),null,(201),null,(302),null,(202),null,(200),null,(203),null,(207),null], null), null);
cljs_http_missionary.client.encode_val = (function cljs_http_missionary$client$encode_val(k,v){
return [cljs_http_missionary.util.url_encode(cljs.core.name(k)),"=",cljs_http_missionary.util.url_encode(cljs.core.str.cljs$core$IFn$_invoke$arity$1(v))].join('');
});
cljs_http_missionary.client.encode_vals = (function cljs_http_missionary$client$encode_vals(k,vs){
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("&",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__67833_SHARP_){
return cljs_http_missionary.client.encode_val(k,p1__67833_SHARP_);
}),vs));
});
cljs_http_missionary.client.encode_param = (function cljs_http_missionary$client$encode_param(p__67843){
var vec__67844 = p__67843;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67844,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67844,(1),null);
if(cljs.core.coll_QMARK_(v)){
return cljs_http_missionary.client.encode_vals(k,v);
} else {
return cljs_http_missionary.client.encode_val(k,v);
}
});
cljs_http_missionary.client.generate_query_string = (function cljs_http_missionary$client$generate_query_string(params){
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("&",cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs_http_missionary.client.encode_param,params));
});
cljs_http_missionary.client.regex_char_esc_smap = (function (){var esc_chars = "()*&^%$#!+";
return cljs.core.zipmap(esc_chars,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__67847_SHARP_){
return ["\\",cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__67847_SHARP_)].join('');
}),esc_chars));
})();
/**
 * Escape special characters -- for content-type.
 */
cljs_http_missionary.client.escape_special = (function cljs_http_missionary$client$escape_special(string){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.replace.cljs$core$IFn$_invoke$arity$2(cljs_http_missionary.client.regex_char_esc_smap,string));
});
/**
 * Decocde the :body of `response` with `decode-fn` if the content type matches.
 */
cljs_http_missionary.client.decode_body = (function cljs_http_missionary$client$decode_body(response,decode_fn,content_type,request_method){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"head","head",-771383919),request_method);
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2((204),new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(response));
if(and__5000__auto____$1){
return cljs.core.re_find(cljs.core.re_pattern(["(?i)",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs_http_missionary.client.escape_special(content_type))].join('')),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"headers","headers",-835030129).cljs$core$IFn$_invoke$arity$1(response),"content-type","")));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(response,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"body","body",-2049205669)], null),decode_fn);
} else {
return response;
}
});
/**
 * Encode :edn-params in the `request` :body and set the appropriate
 *   Content Type header.
 */
cljs_http_missionary.client.wrap_edn_params = (function cljs_http_missionary$client$wrap_edn_params(client){
return (function (request){
var temp__5802__auto__ = new cljs.core.Keyword(null,"edn-params","edn-params",894273052).cljs$core$IFn$_invoke$arity$1(request);
if(cljs.core.truth_(temp__5802__auto__)){
var params = temp__5802__auto__;
var headers = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, ["content-type","application/edn"], null),new cljs.core.Keyword(null,"headers","headers",-835030129).cljs$core$IFn$_invoke$arity$1(request)], 0));
var G__67858 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(request,new cljs.core.Keyword(null,"edn-params","edn-params",894273052)),new cljs.core.Keyword(null,"body","body",-2049205669),cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([params], 0))),new cljs.core.Keyword(null,"headers","headers",-835030129),headers);
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67858) : client.call(null,G__67858));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(request) : client.call(null,request));
}
});
});
/**
 * Decode application/edn responses.
 */
cljs_http_missionary.client.wrap_edn_response = (function cljs_http_missionary$client$wrap_edn_response(client){
return (function (request){
return missionary.core.join.cljs$core$IFn$_invoke$arity$variadic((function (p1__67859_SHARP_){
return cljs_http_missionary.client.decode_body(p1__67859_SHARP_,cljs.reader.read_string,"application/edn",new cljs.core.Keyword(null,"request-method","request-method",1764796830).cljs$core$IFn$_invoke$arity$1(request));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(request) : client.call(null,request))], 0));
});
});
cljs_http_missionary.client.wrap_default_headers = (function cljs_http_missionary$client$wrap_default_headers(var_args){
var args__5732__auto__ = [];
var len__5726__auto___68045 = arguments.length;
var i__5727__auto___68046 = (0);
while(true){
if((i__5727__auto___68046 < len__5726__auto___68045)){
args__5732__auto__.push((arguments[i__5727__auto___68046]));

var G__68047 = (i__5727__auto___68046 + (1));
i__5727__auto___68046 = G__68047;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.wrap_default_headers.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.wrap_default_headers.cljs$core$IFn$_invoke$arity$variadic = (function (client,p__67865){
var vec__67866 = p__67865;
var default_headers = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67866,(0),null);
return (function (request){
var temp__5802__auto__ = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"default-headers","default-headers",-43146094).cljs$core$IFn$_invoke$arity$1(request);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return default_headers;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var default_headers__$1 = temp__5802__auto__;
var G__67871 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(request,new cljs.core.Keyword(null,"default-headers","default-headers",-43146094),default_headers__$1);
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67871) : client.call(null,G__67871));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(request) : client.call(null,request));
}
});
}));

(cljs_http_missionary.client.wrap_default_headers.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.wrap_default_headers.cljs$lang$applyTo = (function (seq67860){
var G__67861 = cljs.core.first(seq67860);
var seq67860__$1 = cljs.core.next(seq67860);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67861,seq67860__$1);
}));

cljs_http_missionary.client.wrap_accept = (function cljs_http_missionary$client$wrap_accept(var_args){
var args__5732__auto__ = [];
var len__5726__auto___68048 = arguments.length;
var i__5727__auto___68049 = (0);
while(true){
if((i__5727__auto___68049 < len__5726__auto___68048)){
args__5732__auto__.push((arguments[i__5727__auto___68049]));

var G__68050 = (i__5727__auto___68049 + (1));
i__5727__auto___68049 = G__68050;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.wrap_accept.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.wrap_accept.cljs$core$IFn$_invoke$arity$variadic = (function (client,p__67881){
var vec__67882 = p__67881;
var accept = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67882,(0),null);
return (function (request){
var temp__5802__auto__ = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"accept","accept",1874130431).cljs$core$IFn$_invoke$arity$1(request);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return accept;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var accept__$1 = temp__5802__auto__;
var G__67889 = cljs.core.assoc_in(request,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"headers","headers",-835030129),"accept"], null),accept__$1);
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67889) : client.call(null,G__67889));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(request) : client.call(null,request));
}
});
}));

(cljs_http_missionary.client.wrap_accept.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.wrap_accept.cljs$lang$applyTo = (function (seq67877){
var G__67878 = cljs.core.first(seq67877);
var seq67877__$1 = cljs.core.next(seq67877);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67878,seq67877__$1);
}));

cljs_http_missionary.client.wrap_content_type = (function cljs_http_missionary$client$wrap_content_type(var_args){
var args__5732__auto__ = [];
var len__5726__auto___68051 = arguments.length;
var i__5727__auto___68052 = (0);
while(true){
if((i__5727__auto___68052 < len__5726__auto___68051)){
args__5732__auto__.push((arguments[i__5727__auto___68052]));

var G__68053 = (i__5727__auto___68052 + (1));
i__5727__auto___68052 = G__68053;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.wrap_content_type.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.wrap_content_type.cljs$core$IFn$_invoke$arity$variadic = (function (client,p__67894){
var vec__67895 = p__67894;
var content_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67895,(0),null);
return (function (request){
var temp__5802__auto__ = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"content-type","content-type",-508222634).cljs$core$IFn$_invoke$arity$1(request);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return content_type;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var content_type__$1 = temp__5802__auto__;
var G__67901 = cljs.core.assoc_in(request,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"headers","headers",-835030129),"content-type"], null),content_type__$1);
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67901) : client.call(null,G__67901));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(request) : client.call(null,request));
}
});
}));

(cljs_http_missionary.client.wrap_content_type.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.wrap_content_type.cljs$lang$applyTo = (function (seq67892){
var G__67893 = cljs.core.first(seq67892);
var seq67892__$1 = cljs.core.next(seq67892);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67893,seq67892__$1);
}));

cljs_http_missionary.client.default_transit_opts = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"encoding","encoding",1728578272),new cljs.core.Keyword(null,"json","json",1279968570),new cljs.core.Keyword(null,"encoding-opts","encoding-opts",-1805664631),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"decoding","decoding",-568180903),new cljs.core.Keyword(null,"json","json",1279968570),new cljs.core.Keyword(null,"decoding-opts","decoding-opts",1050289140),cljs.core.PersistentArrayMap.EMPTY], null);
/**
 * Encode :transit-params in the `request` :body and set the appropriate
 *   Content Type header.
 * 
 *   A :transit-opts map can be optionally provided with the following keys:
 * 
 *   :encoding                #{:json, :json-verbose}
 *   :decoding                #{:json, :json-verbose}
 *   :encoding/decoding-opts  appropriate map of options to be passed to
 *                         transit writer/reader, respectively.
 */
cljs_http_missionary.client.wrap_transit_params = (function cljs_http_missionary$client$wrap_transit_params(client){
return (function (request){
var temp__5802__auto__ = new cljs.core.Keyword(null,"transit-params","transit-params",357261095).cljs$core$IFn$_invoke$arity$1(request);
if(cljs.core.truth_(temp__5802__auto__)){
var params = temp__5802__auto__;
var map__67904 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs_http_missionary.client.default_transit_opts,new cljs.core.Keyword(null,"transit-opts","transit-opts",1104386010).cljs$core$IFn$_invoke$arity$1(request)], 0));
var map__67904__$1 = cljs.core.__destructure_map(map__67904);
var encoding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67904__$1,new cljs.core.Keyword(null,"encoding","encoding",1728578272));
var encoding_opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67904__$1,new cljs.core.Keyword(null,"encoding-opts","encoding-opts",-1805664631));
var headers = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, ["content-type","application/transit+json"], null),new cljs.core.Keyword(null,"headers","headers",-835030129).cljs$core$IFn$_invoke$arity$1(request)], 0));
var G__67905 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(request,new cljs.core.Keyword(null,"transit-params","transit-params",357261095)),new cljs.core.Keyword(null,"body","body",-2049205669),cljs_http_missionary.util.transit_encode(params,encoding,encoding_opts)),new cljs.core.Keyword(null,"headers","headers",-835030129),headers);
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67905) : client.call(null,G__67905));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(request) : client.call(null,request));
}
});
});
/**
 * Decode application/transit+json responses.
 */
cljs_http_missionary.client.wrap_transit_response = (function cljs_http_missionary$client$wrap_transit_response(client){
return (function (request){
var map__67908 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs_http_missionary.client.default_transit_opts,new cljs.core.Keyword(null,"transit-opts","transit-opts",1104386010).cljs$core$IFn$_invoke$arity$1(request)], 0));
var map__67908__$1 = cljs.core.__destructure_map(map__67908);
var decoding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67908__$1,new cljs.core.Keyword(null,"decoding","decoding",-568180903));
var decoding_opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67908__$1,new cljs.core.Keyword(null,"decoding-opts","decoding-opts",1050289140));
var transit_decode = (function (p1__67906_SHARP_){
return cljs_http_missionary.util.transit_decode(p1__67906_SHARP_,decoding,decoding_opts);
});
return missionary.core.join.cljs$core$IFn$_invoke$arity$variadic((function (p1__67907_SHARP_){
return cljs_http_missionary.client.decode_body(p1__67907_SHARP_,transit_decode,"application/transit+json",new cljs.core.Keyword(null,"request-method","request-method",1764796830).cljs$core$IFn$_invoke$arity$1(request));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(request) : client.call(null,request))], 0));
});
});
/**
 * Encode :json-params in the `request` :body and set the appropriate
 *   Content Type header.
 */
cljs_http_missionary.client.wrap_json_params = (function cljs_http_missionary$client$wrap_json_params(client){
return (function (request){
var temp__5802__auto__ = new cljs.core.Keyword(null,"json-params","json-params",-1112693596).cljs$core$IFn$_invoke$arity$1(request);
if(cljs.core.truth_(temp__5802__auto__)){
var params = temp__5802__auto__;
var headers = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, ["content-type","application/json"], null),new cljs.core.Keyword(null,"headers","headers",-835030129).cljs$core$IFn$_invoke$arity$1(request)], 0));
var G__67909 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(request,new cljs.core.Keyword(null,"json-params","json-params",-1112693596)),new cljs.core.Keyword(null,"body","body",-2049205669),cljs_http_missionary.util.json_encode(params)),new cljs.core.Keyword(null,"headers","headers",-835030129),headers);
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67909) : client.call(null,G__67909));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(request) : client.call(null,request));
}
});
});
/**
 * Decode application/json responses.
 */
cljs_http_missionary.client.wrap_json_response = (function cljs_http_missionary$client$wrap_json_response(client){
return (function (request){
return missionary.core.join.cljs$core$IFn$_invoke$arity$variadic((function (p1__67910_SHARP_){
return cljs_http_missionary.client.decode_body(p1__67910_SHARP_,cljs_http_missionary.util.json_decode,"application/json",new cljs.core.Keyword(null,"request-method","request-method",1764796830).cljs$core$IFn$_invoke$arity$1(request));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(request) : client.call(null,request))], 0));
});
});
cljs_http_missionary.client.wrap_query_params = (function cljs_http_missionary$client$wrap_query_params(client){
return (function (p__67911){
var map__67912 = p__67911;
var map__67912__$1 = cljs.core.__destructure_map(map__67912);
var req = map__67912__$1;
var query_params = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67912__$1,new cljs.core.Keyword(null,"query-params","query-params",900640534));
if(cljs.core.truth_(query_params)){
var G__67913 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(req,new cljs.core.Keyword(null,"query-params","query-params",900640534)),new cljs.core.Keyword(null,"query-string","query-string",-1018845061),cljs_http_missionary.client.generate_query_string(query_params));
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67913) : client.call(null,G__67913));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(req) : client.call(null,req));
}
});
});
cljs_http_missionary.client.wrap_form_params = (function cljs_http_missionary$client$wrap_form_params(client){
return (function (p__67915){
var map__67916 = p__67915;
var map__67916__$1 = cljs.core.__destructure_map(map__67916);
var request = map__67916__$1;
var form_params = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67916__$1,new cljs.core.Keyword(null,"form-params","form-params",1884296467));
var request_method = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67916__$1,new cljs.core.Keyword(null,"request-method","request-method",1764796830));
var headers = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67916__$1,new cljs.core.Keyword(null,"headers","headers",-835030129));
if(cljs.core.truth_((function (){var and__5000__auto__ = form_params;
if(cljs.core.truth_(and__5000__auto__)){
var fexpr__67917 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"patch","patch",380775109),null,new cljs.core.Keyword(null,"delete","delete",-1768633620),null,new cljs.core.Keyword(null,"post","post",269697687),null,new cljs.core.Keyword(null,"put","put",1299772570),null], null), null);
return (fexpr__67917.cljs$core$IFn$_invoke$arity$1 ? fexpr__67917.cljs$core$IFn$_invoke$arity$1(request_method) : fexpr__67917.call(null,request_method));
} else {
return and__5000__auto__;
}
})())){
var headers__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, ["content-type","application/x-www-form-urlencoded"], null),headers], 0));
var G__67918 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(request,new cljs.core.Keyword(null,"form-params","form-params",1884296467)),new cljs.core.Keyword(null,"body","body",-2049205669),cljs_http_missionary.client.generate_query_string(form_params)),new cljs.core.Keyword(null,"headers","headers",-835030129),headers__$1);
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67918) : client.call(null,G__67918));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(request) : client.call(null,request));
}
});
});
cljs_http_missionary.client.generate_form_data = (function cljs_http_missionary$client$generate_form_data(params){
var form_data = (new FormData());
var seq__67920_68054 = cljs.core.seq(params);
var chunk__67921_68055 = null;
var count__67922_68056 = (0);
var i__67923_68057 = (0);
while(true){
if((i__67923_68057 < count__67922_68056)){
var vec__67931_68058 = chunk__67921_68055.cljs$core$IIndexed$_nth$arity$2(null,i__67923_68057);
var k_68059 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67931_68058,(0),null);
var v_68060 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67931_68058,(1),null);
if(cljs.core.coll_QMARK_(v_68060)){
form_data.append(cljs.core.name(k_68059),cljs.core.first(v_68060),cljs.core.second(v_68060));
} else {
form_data.append(cljs.core.name(k_68059),v_68060);
}


var G__68061 = seq__67920_68054;
var G__68062 = chunk__67921_68055;
var G__68063 = count__67922_68056;
var G__68064 = (i__67923_68057 + (1));
seq__67920_68054 = G__68061;
chunk__67921_68055 = G__68062;
count__67922_68056 = G__68063;
i__67923_68057 = G__68064;
continue;
} else {
var temp__5804__auto___68065 = cljs.core.seq(seq__67920_68054);
if(temp__5804__auto___68065){
var seq__67920_68066__$1 = temp__5804__auto___68065;
if(cljs.core.chunked_seq_QMARK_(seq__67920_68066__$1)){
var c__5525__auto___68067 = cljs.core.chunk_first(seq__67920_68066__$1);
var G__68068 = cljs.core.chunk_rest(seq__67920_68066__$1);
var G__68069 = c__5525__auto___68067;
var G__68070 = cljs.core.count(c__5525__auto___68067);
var G__68071 = (0);
seq__67920_68054 = G__68068;
chunk__67921_68055 = G__68069;
count__67922_68056 = G__68070;
i__67923_68057 = G__68071;
continue;
} else {
var vec__67934_68072 = cljs.core.first(seq__67920_68066__$1);
var k_68073 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67934_68072,(0),null);
var v_68074 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67934_68072,(1),null);
if(cljs.core.coll_QMARK_(v_68074)){
form_data.append(cljs.core.name(k_68073),cljs.core.first(v_68074),cljs.core.second(v_68074));
} else {
form_data.append(cljs.core.name(k_68073),v_68074);
}


var G__68075 = cljs.core.next(seq__67920_68066__$1);
var G__68076 = null;
var G__68077 = (0);
var G__68078 = (0);
seq__67920_68054 = G__68075;
chunk__67921_68055 = G__68076;
count__67922_68056 = G__68077;
i__67923_68057 = G__68078;
continue;
}
} else {
}
}
break;
}

return form_data;
});
cljs_http_missionary.client.wrap_multipart_params = (function cljs_http_missionary$client$wrap_multipart_params(client){
return (function (p__67938){
var map__67939 = p__67938;
var map__67939__$1 = cljs.core.__destructure_map(map__67939);
var request = map__67939__$1;
var multipart_params = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67939__$1,new cljs.core.Keyword(null,"multipart-params","multipart-params",-1033508707));
var request_method = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67939__$1,new cljs.core.Keyword(null,"request-method","request-method",1764796830));
if(cljs.core.truth_((function (){var and__5000__auto__ = multipart_params;
if(cljs.core.truth_(and__5000__auto__)){
var fexpr__67940 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"patch","patch",380775109),null,new cljs.core.Keyword(null,"delete","delete",-1768633620),null,new cljs.core.Keyword(null,"post","post",269697687),null,new cljs.core.Keyword(null,"put","put",1299772570),null], null), null);
return (fexpr__67940.cljs$core$IFn$_invoke$arity$1 ? fexpr__67940.cljs$core$IFn$_invoke$arity$1(request_method) : fexpr__67940.call(null,request_method));
} else {
return and__5000__auto__;
}
})())){
var G__67941 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(request,new cljs.core.Keyword(null,"multipart-params","multipart-params",-1033508707)),new cljs.core.Keyword(null,"body","body",-2049205669),cljs_http_missionary.client.generate_form_data(multipart_params));
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67941) : client.call(null,G__67941));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(request) : client.call(null,request));
}
});
});
cljs_http_missionary.client.wrap_method = (function cljs_http_missionary$client$wrap_method(client){
return (function (req){
var temp__5802__auto__ = new cljs.core.Keyword(null,"method","method",55703592).cljs$core$IFn$_invoke$arity$1(req);
if(cljs.core.truth_(temp__5802__auto__)){
var m = temp__5802__auto__;
var G__67942 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(req,new cljs.core.Keyword(null,"method","method",55703592)),new cljs.core.Keyword(null,"request-method","request-method",1764796830),m);
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67942) : client.call(null,G__67942));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(req) : client.call(null,req));
}
});
});
cljs_http_missionary.client.wrap_server_name = (function cljs_http_missionary$client$wrap_server_name(client,server_name){
return (function (p1__67943_SHARP_){
var G__67944 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__67943_SHARP_,new cljs.core.Keyword(null,"server-name","server-name",-1012104295),server_name);
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67944) : client.call(null,G__67944));
});
});
cljs_http_missionary.client.wrap_url = (function cljs_http_missionary$client$wrap_url(client){
return (function (p__67946){
var map__67947 = p__67946;
var map__67947__$1 = cljs.core.__destructure_map(map__67947);
var req = map__67947__$1;
var query_params = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67947__$1,new cljs.core.Keyword(null,"query-params","query-params",900640534));
var temp__5802__auto__ = cljs_http_missionary.client.parse_url(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(req));
if(cljs.core.truth_(temp__5802__auto__)){
var spec = temp__5802__auto__;
var G__67949 = cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,spec], 0)),new cljs.core.Keyword(null,"url","url",276297046)),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"query-params","query-params",900640534)], null),(function (p1__67945_SHARP_){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p1__67945_SHARP_,query_params], 0));
}));
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67949) : client.call(null,G__67949));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(req) : client.call(null,req));
}
});
});
/**
 * Middleware converting the :basic-auth option or `credentials` into
 *   an Authorization header.
 */
cljs_http_missionary.client.wrap_basic_auth = (function cljs_http_missionary$client$wrap_basic_auth(var_args){
var args__5732__auto__ = [];
var len__5726__auto___68079 = arguments.length;
var i__5727__auto___68080 = (0);
while(true){
if((i__5727__auto___68080 < len__5726__auto___68079)){
args__5732__auto__.push((arguments[i__5727__auto___68080]));

var G__68081 = (i__5727__auto___68080 + (1));
i__5727__auto___68080 = G__68081;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.wrap_basic_auth.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.wrap_basic_auth.cljs$core$IFn$_invoke$arity$variadic = (function (client,p__67955){
var vec__67956 = p__67955;
var credentials = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67956,(0),null);
return (function (req){
var credentials__$1 = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"basic-auth","basic-auth",-673163332).cljs$core$IFn$_invoke$arity$1(req);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return credentials;
}
})();
if((!(cljs.core.empty_QMARK_(credentials__$1)))){
var G__67959 = cljs.core.assoc_in(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(req,new cljs.core.Keyword(null,"basic-auth","basic-auth",-673163332)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"headers","headers",-835030129),"authorization"], null),cljs_http_missionary.util.basic_auth(credentials__$1));
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67959) : client.call(null,G__67959));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(req) : client.call(null,req));
}
});
}));

(cljs_http_missionary.client.wrap_basic_auth.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.wrap_basic_auth.cljs$lang$applyTo = (function (seq67951){
var G__67953 = cljs.core.first(seq67951);
var seq67951__$1 = cljs.core.next(seq67951);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67953,seq67951__$1);
}));

/**
 * Middleware converting the :oauth-token option into an Authorization header.
 */
cljs_http_missionary.client.wrap_oauth = (function cljs_http_missionary$client$wrap_oauth(client){
return (function (req){
var temp__5802__auto__ = new cljs.core.Keyword(null,"oauth-token","oauth-token",311415191).cljs$core$IFn$_invoke$arity$1(req);
if(cljs.core.truth_(temp__5802__auto__)){
var oauth_token = temp__5802__auto__;
var G__67960 = cljs.core.assoc_in(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(req,new cljs.core.Keyword(null,"oauth-token","oauth-token",311415191)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"headers","headers",-835030129),"authorization"], null),["Bearer ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(oauth_token)].join(''));
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67960) : client.call(null,G__67960));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(req) : client.call(null,req));
}
});
});
/**
 * Returns a batteries-included HTTP request function coresponding to the given
 * core client. See client/request
 */
cljs_http_missionary.client.wrap_request = (function cljs_http_missionary$client$wrap_request(request){
return cljs_http_missionary.client.wrap_default_headers(cljs_http_missionary.client.wrap_url(cljs_http_missionary.client.wrap_method(cljs_http_missionary.client.wrap_oauth(cljs_http_missionary.client.wrap_basic_auth(cljs_http_missionary.client.wrap_query_params(cljs_http_missionary.client.wrap_content_type(cljs_http_missionary.client.wrap_json_response(cljs_http_missionary.client.wrap_json_params(cljs_http_missionary.client.wrap_transit_response(cljs_http_missionary.client.wrap_transit_params(cljs_http_missionary.client.wrap_edn_response(cljs_http_missionary.client.wrap_edn_params(cljs_http_missionary.client.wrap_multipart_params(cljs_http_missionary.client.wrap_form_params(cljs_http_missionary.client.wrap_accept(request))))))))))))))));
});
/**
 * Executes the HTTP request corresponding to the given map and returns the
 * response map corresponding to the resulting HTTP response.
 * 
 * In addition to the standard Ring request keys, the following keys are also
 * recognized:
 * * :url
 * * :method
 * * :query-params
 */
cljs_http_missionary.client.request = cljs_http_missionary.client.wrap_request(cljs_http_missionary.core.request);
/**
 * Like #'request, but sets the :method and :url as appropriate.
 */
cljs_http_missionary.client.delete$ = (function cljs_http_missionary$client$delete(var_args){
var args__5732__auto__ = [];
var len__5726__auto___68082 = arguments.length;
var i__5727__auto___68083 = (0);
while(true){
if((i__5727__auto___68083 < len__5726__auto___68082)){
args__5732__auto__.push((arguments[i__5727__auto___68083]));

var G__68084 = (i__5727__auto___68083 + (1));
i__5727__auto___68083 = G__68084;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.delete$.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.delete$.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__67967){
var vec__67969 = p__67967;
var req = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67969,(0),null);
return cljs_http_missionary.client.request(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"delete","delete",-1768633620),new cljs.core.Keyword(null,"url","url",276297046),url], null)], 0)));
}));

(cljs_http_missionary.client.delete$.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.delete$.cljs$lang$applyTo = (function (seq67964){
var G__67965 = cljs.core.first(seq67964);
var seq67964__$1 = cljs.core.next(seq67964);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67965,seq67964__$1);
}));

/**
 * Like #'request, but sets the :method and :url as appropriate.
 */
cljs_http_missionary.client.get = (function cljs_http_missionary$client$get(var_args){
var args__5732__auto__ = [];
var len__5726__auto___68085 = arguments.length;
var i__5727__auto___68086 = (0);
while(true){
if((i__5727__auto___68086 < len__5726__auto___68085)){
args__5732__auto__.push((arguments[i__5727__auto___68086]));

var G__68087 = (i__5727__auto___68086 + (1));
i__5727__auto___68086 = G__68087;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.get.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.get.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__67975){
var vec__67977 = p__67975;
var req = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67977,(0),null);
return cljs_http_missionary.client.request(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"get","get",1683182755),new cljs.core.Keyword(null,"url","url",276297046),url], null)], 0)));
}));

(cljs_http_missionary.client.get.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.get.cljs$lang$applyTo = (function (seq67972){
var G__67973 = cljs.core.first(seq67972);
var seq67972__$1 = cljs.core.next(seq67972);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67973,seq67972__$1);
}));

/**
 * Like #'request, but sets the :method and :url as appropriate.
 */
cljs_http_missionary.client.head = (function cljs_http_missionary$client$head(var_args){
var args__5732__auto__ = [];
var len__5726__auto___68088 = arguments.length;
var i__5727__auto___68089 = (0);
while(true){
if((i__5727__auto___68089 < len__5726__auto___68088)){
args__5732__auto__.push((arguments[i__5727__auto___68089]));

var G__68090 = (i__5727__auto___68089 + (1));
i__5727__auto___68089 = G__68090;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.head.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.head.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__67985){
var vec__67989 = p__67985;
var req = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67989,(0),null);
return cljs_http_missionary.client.request(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"head","head",-771383919),new cljs.core.Keyword(null,"url","url",276297046),url], null)], 0)));
}));

(cljs_http_missionary.client.head.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.head.cljs$lang$applyTo = (function (seq67980){
var G__67982 = cljs.core.first(seq67980);
var seq67980__$1 = cljs.core.next(seq67980);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67982,seq67980__$1);
}));

/**
 * Like #'request, but sets the :method and :url as appropriate.
 */
cljs_http_missionary.client.jsonp = (function cljs_http_missionary$client$jsonp(var_args){
var args__5732__auto__ = [];
var len__5726__auto___68091 = arguments.length;
var i__5727__auto___68092 = (0);
while(true){
if((i__5727__auto___68092 < len__5726__auto___68091)){
args__5732__auto__.push((arguments[i__5727__auto___68092]));

var G__68093 = (i__5727__auto___68092 + (1));
i__5727__auto___68092 = G__68093;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.jsonp.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.jsonp.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__68011){
var vec__68012 = p__68011;
var req = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68012,(0),null);
return cljs_http_missionary.client.request(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"jsonp","jsonp",226119588),new cljs.core.Keyword(null,"url","url",276297046),url], null)], 0)));
}));

(cljs_http_missionary.client.jsonp.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.jsonp.cljs$lang$applyTo = (function (seq68006){
var G__68007 = cljs.core.first(seq68006);
var seq68006__$1 = cljs.core.next(seq68006);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__68007,seq68006__$1);
}));

/**
 * Like #'request, but sets the :method and :url as appropriate.
 */
cljs_http_missionary.client.move = (function cljs_http_missionary$client$move(var_args){
var args__5732__auto__ = [];
var len__5726__auto___68094 = arguments.length;
var i__5727__auto___68095 = (0);
while(true){
if((i__5727__auto___68095 < len__5726__auto___68094)){
args__5732__auto__.push((arguments[i__5727__auto___68095]));

var G__68096 = (i__5727__auto___68095 + (1));
i__5727__auto___68095 = G__68096;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.move.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.move.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__68017){
var vec__68018 = p__68017;
var req = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68018,(0),null);
return cljs_http_missionary.client.request(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"move","move",-2110884309),new cljs.core.Keyword(null,"url","url",276297046),url], null)], 0)));
}));

(cljs_http_missionary.client.move.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.move.cljs$lang$applyTo = (function (seq68015){
var G__68016 = cljs.core.first(seq68015);
var seq68015__$1 = cljs.core.next(seq68015);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__68016,seq68015__$1);
}));

/**
 * Like #'request, but sets the :method and :url as appropriate.
 */
cljs_http_missionary.client.options = (function cljs_http_missionary$client$options(var_args){
var args__5732__auto__ = [];
var len__5726__auto___68097 = arguments.length;
var i__5727__auto___68098 = (0);
while(true){
if((i__5727__auto___68098 < len__5726__auto___68097)){
args__5732__auto__.push((arguments[i__5727__auto___68098]));

var G__68099 = (i__5727__auto___68098 + (1));
i__5727__auto___68098 = G__68099;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.options.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.options.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__68023){
var vec__68024 = p__68023;
var req = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68024,(0),null);
return cljs_http_missionary.client.request(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.Keyword(null,"url","url",276297046),url], null)], 0)));
}));

(cljs_http_missionary.client.options.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.options.cljs$lang$applyTo = (function (seq68021){
var G__68022 = cljs.core.first(seq68021);
var seq68021__$1 = cljs.core.next(seq68021);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__68022,seq68021__$1);
}));

/**
 * Like #'request, but sets the :method and :url as appropriate.
 */
cljs_http_missionary.client.patch = (function cljs_http_missionary$client$patch(var_args){
var args__5732__auto__ = [];
var len__5726__auto___68100 = arguments.length;
var i__5727__auto___68101 = (0);
while(true){
if((i__5727__auto___68101 < len__5726__auto___68100)){
args__5732__auto__.push((arguments[i__5727__auto___68101]));

var G__68102 = (i__5727__auto___68101 + (1));
i__5727__auto___68101 = G__68102;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.patch.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.patch.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__68029){
var vec__68030 = p__68029;
var req = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68030,(0),null);
return cljs_http_missionary.client.request(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"patch","patch",380775109),new cljs.core.Keyword(null,"url","url",276297046),url], null)], 0)));
}));

(cljs_http_missionary.client.patch.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.patch.cljs$lang$applyTo = (function (seq68027){
var G__68028 = cljs.core.first(seq68027);
var seq68027__$1 = cljs.core.next(seq68027);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__68028,seq68027__$1);
}));

/**
 * Like #'request, but sets the :method and :url as appropriate.
 */
cljs_http_missionary.client.post = (function cljs_http_missionary$client$post(var_args){
var args__5732__auto__ = [];
var len__5726__auto___68103 = arguments.length;
var i__5727__auto___68104 = (0);
while(true){
if((i__5727__auto___68104 < len__5726__auto___68103)){
args__5732__auto__.push((arguments[i__5727__auto___68104]));

var G__68105 = (i__5727__auto___68104 + (1));
i__5727__auto___68104 = G__68105;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.post.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.post.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__68035){
var vec__68036 = p__68035;
var req = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68036,(0),null);
return cljs_http_missionary.client.request(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"post","post",269697687),new cljs.core.Keyword(null,"url","url",276297046),url], null)], 0)));
}));

(cljs_http_missionary.client.post.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.post.cljs$lang$applyTo = (function (seq68033){
var G__68034 = cljs.core.first(seq68033);
var seq68033__$1 = cljs.core.next(seq68033);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__68034,seq68033__$1);
}));

/**
 * Like #'request, but sets the :method and :url as appropriate.
 */
cljs_http_missionary.client.put = (function cljs_http_missionary$client$put(var_args){
var args__5732__auto__ = [];
var len__5726__auto___68106 = arguments.length;
var i__5727__auto___68107 = (0);
while(true){
if((i__5727__auto___68107 < len__5726__auto___68106)){
args__5732__auto__.push((arguments[i__5727__auto___68107]));

var G__68108 = (i__5727__auto___68107 + (1));
i__5727__auto___68107 = G__68108;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.put.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.put.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__68041){
var vec__68042 = p__68041;
var req = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__68042,(0),null);
return cljs_http_missionary.client.request(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"put","put",1299772570),new cljs.core.Keyword(null,"url","url",276297046),url], null)], 0)));
}));

(cljs_http_missionary.client.put.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.put.cljs$lang$applyTo = (function (seq68039){
var G__68040 = cljs.core.first(seq68039);
var seq68039__$1 = cljs.core.next(seq68039);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__68040,seq68039__$1);
}));


//# sourceMappingURL=cljs_http_missionary.client.js.map
