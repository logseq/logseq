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
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (p1__67697_SHARP_,p2__67696_SHARP_){
var vec__67698 = clojure.string.split.cljs$core$IFn$_invoke$arity$2(p2__67696_SHARP_,/=/);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67698,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67698,(1),null);
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(p1__67697_SHARP_,cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(cljs_http_missionary.util.url_decode(k)),cljs_http_missionary.client.acc_param,cljs_http_missionary.util.url_decode(v));
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
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("&",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__67707_SHARP_){
return cljs_http_missionary.client.encode_val(k,p1__67707_SHARP_);
}),vs));
});
cljs_http_missionary.client.encode_param = (function cljs_http_missionary$client$encode_param(p__67709){
var vec__67710 = p__67709;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67710,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67710,(1),null);
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
return cljs.core.zipmap(esc_chars,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__67713_SHARP_){
return ["\\",cljs.core.str.cljs$core$IFn$_invoke$arity$1(p1__67713_SHARP_)].join('');
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
var G__67731 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(request,new cljs.core.Keyword(null,"edn-params","edn-params",894273052)),new cljs.core.Keyword(null,"body","body",-2049205669),cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([params], 0))),new cljs.core.Keyword(null,"headers","headers",-835030129),headers);
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67731) : client.call(null,G__67731));
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
return missionary.core.join.cljs$core$IFn$_invoke$arity$variadic((function (p1__67736_SHARP_){
return cljs_http_missionary.client.decode_body(p1__67736_SHARP_,cljs.reader.read_string,"application/edn",new cljs.core.Keyword(null,"request-method","request-method",1764796830).cljs$core$IFn$_invoke$arity$1(request));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(request) : client.call(null,request))], 0));
});
});
cljs_http_missionary.client.wrap_default_headers = (function cljs_http_missionary$client$wrap_default_headers(var_args){
var args__5732__auto__ = [];
var len__5726__auto___67879 = arguments.length;
var i__5727__auto___67880 = (0);
while(true){
if((i__5727__auto___67880 < len__5726__auto___67879)){
args__5732__auto__.push((arguments[i__5727__auto___67880]));

var G__67881 = (i__5727__auto___67880 + (1));
i__5727__auto___67880 = G__67881;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.wrap_default_headers.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.wrap_default_headers.cljs$core$IFn$_invoke$arity$variadic = (function (client,p__67739){
var vec__67741 = p__67739;
var default_headers = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67741,(0),null);
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
var G__67744 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(request,new cljs.core.Keyword(null,"default-headers","default-headers",-43146094),default_headers__$1);
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67744) : client.call(null,G__67744));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(request) : client.call(null,request));
}
});
}));

(cljs_http_missionary.client.wrap_default_headers.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.wrap_default_headers.cljs$lang$applyTo = (function (seq67737){
var G__67738 = cljs.core.first(seq67737);
var seq67737__$1 = cljs.core.next(seq67737);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67738,seq67737__$1);
}));

cljs_http_missionary.client.wrap_accept = (function cljs_http_missionary$client$wrap_accept(var_args){
var args__5732__auto__ = [];
var len__5726__auto___67882 = arguments.length;
var i__5727__auto___67883 = (0);
while(true){
if((i__5727__auto___67883 < len__5726__auto___67882)){
args__5732__auto__.push((arguments[i__5727__auto___67883]));

var G__67884 = (i__5727__auto___67883 + (1));
i__5727__auto___67883 = G__67884;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.wrap_accept.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.wrap_accept.cljs$core$IFn$_invoke$arity$variadic = (function (client,p__67747){
var vec__67748 = p__67747;
var accept = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67748,(0),null);
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
var G__67751 = cljs.core.assoc_in(request,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"headers","headers",-835030129),"accept"], null),accept__$1);
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67751) : client.call(null,G__67751));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(request) : client.call(null,request));
}
});
}));

(cljs_http_missionary.client.wrap_accept.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.wrap_accept.cljs$lang$applyTo = (function (seq67745){
var G__67746 = cljs.core.first(seq67745);
var seq67745__$1 = cljs.core.next(seq67745);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67746,seq67745__$1);
}));

cljs_http_missionary.client.wrap_content_type = (function cljs_http_missionary$client$wrap_content_type(var_args){
var args__5732__auto__ = [];
var len__5726__auto___67885 = arguments.length;
var i__5727__auto___67886 = (0);
while(true){
if((i__5727__auto___67886 < len__5726__auto___67885)){
args__5732__auto__.push((arguments[i__5727__auto___67886]));

var G__67887 = (i__5727__auto___67886 + (1));
i__5727__auto___67886 = G__67887;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.wrap_content_type.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.wrap_content_type.cljs$core$IFn$_invoke$arity$variadic = (function (client,p__67754){
var vec__67755 = p__67754;
var content_type = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67755,(0),null);
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
var G__67758 = cljs.core.assoc_in(request,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"headers","headers",-835030129),"content-type"], null),content_type__$1);
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67758) : client.call(null,G__67758));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(request) : client.call(null,request));
}
});
}));

(cljs_http_missionary.client.wrap_content_type.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.wrap_content_type.cljs$lang$applyTo = (function (seq67752){
var G__67753 = cljs.core.first(seq67752);
var seq67752__$1 = cljs.core.next(seq67752);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67753,seq67752__$1);
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
var map__67760 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs_http_missionary.client.default_transit_opts,new cljs.core.Keyword(null,"transit-opts","transit-opts",1104386010).cljs$core$IFn$_invoke$arity$1(request)], 0));
var map__67760__$1 = cljs.core.__destructure_map(map__67760);
var encoding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67760__$1,new cljs.core.Keyword(null,"encoding","encoding",1728578272));
var encoding_opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67760__$1,new cljs.core.Keyword(null,"encoding-opts","encoding-opts",-1805664631));
var headers = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, ["content-type","application/transit+json"], null),new cljs.core.Keyword(null,"headers","headers",-835030129).cljs$core$IFn$_invoke$arity$1(request)], 0));
var G__67761 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(request,new cljs.core.Keyword(null,"transit-params","transit-params",357261095)),new cljs.core.Keyword(null,"body","body",-2049205669),cljs_http_missionary.util.transit_encode(params,encoding,encoding_opts)),new cljs.core.Keyword(null,"headers","headers",-835030129),headers);
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67761) : client.call(null,G__67761));
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
var map__67764 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs_http_missionary.client.default_transit_opts,new cljs.core.Keyword(null,"transit-opts","transit-opts",1104386010).cljs$core$IFn$_invoke$arity$1(request)], 0));
var map__67764__$1 = cljs.core.__destructure_map(map__67764);
var decoding = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67764__$1,new cljs.core.Keyword(null,"decoding","decoding",-568180903));
var decoding_opts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67764__$1,new cljs.core.Keyword(null,"decoding-opts","decoding-opts",1050289140));
var transit_decode = (function (p1__67762_SHARP_){
return cljs_http_missionary.util.transit_decode(p1__67762_SHARP_,decoding,decoding_opts);
});
return missionary.core.join.cljs$core$IFn$_invoke$arity$variadic((function (p1__67763_SHARP_){
return cljs_http_missionary.client.decode_body(p1__67763_SHARP_,transit_decode,"application/transit+json",new cljs.core.Keyword(null,"request-method","request-method",1764796830).cljs$core$IFn$_invoke$arity$1(request));
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
var G__67765 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(request,new cljs.core.Keyword(null,"json-params","json-params",-1112693596)),new cljs.core.Keyword(null,"body","body",-2049205669),cljs_http_missionary.util.json_encode(params)),new cljs.core.Keyword(null,"headers","headers",-835030129),headers);
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67765) : client.call(null,G__67765));
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
return missionary.core.join.cljs$core$IFn$_invoke$arity$variadic((function (p1__67766_SHARP_){
return cljs_http_missionary.client.decode_body(p1__67766_SHARP_,cljs_http_missionary.util.json_decode,"application/json",new cljs.core.Keyword(null,"request-method","request-method",1764796830).cljs$core$IFn$_invoke$arity$1(request));
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(request) : client.call(null,request))], 0));
});
});
cljs_http_missionary.client.wrap_query_params = (function cljs_http_missionary$client$wrap_query_params(client){
return (function (p__67767){
var map__67768 = p__67767;
var map__67768__$1 = cljs.core.__destructure_map(map__67768);
var req = map__67768__$1;
var query_params = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67768__$1,new cljs.core.Keyword(null,"query-params","query-params",900640534));
if(cljs.core.truth_(query_params)){
var G__67769 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(req,new cljs.core.Keyword(null,"query-params","query-params",900640534)),new cljs.core.Keyword(null,"query-string","query-string",-1018845061),cljs_http_missionary.client.generate_query_string(query_params));
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67769) : client.call(null,G__67769));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(req) : client.call(null,req));
}
});
});
cljs_http_missionary.client.wrap_form_params = (function cljs_http_missionary$client$wrap_form_params(client){
return (function (p__67770){
var map__67771 = p__67770;
var map__67771__$1 = cljs.core.__destructure_map(map__67771);
var request = map__67771__$1;
var form_params = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67771__$1,new cljs.core.Keyword(null,"form-params","form-params",1884296467));
var request_method = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67771__$1,new cljs.core.Keyword(null,"request-method","request-method",1764796830));
var headers = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67771__$1,new cljs.core.Keyword(null,"headers","headers",-835030129));
if(cljs.core.truth_((function (){var and__5000__auto__ = form_params;
if(cljs.core.truth_(and__5000__auto__)){
var fexpr__67772 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"patch","patch",380775109),null,new cljs.core.Keyword(null,"delete","delete",-1768633620),null,new cljs.core.Keyword(null,"post","post",269697687),null,new cljs.core.Keyword(null,"put","put",1299772570),null], null), null);
return (fexpr__67772.cljs$core$IFn$_invoke$arity$1 ? fexpr__67772.cljs$core$IFn$_invoke$arity$1(request_method) : fexpr__67772.call(null,request_method));
} else {
return and__5000__auto__;
}
})())){
var headers__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, ["content-type","application/x-www-form-urlencoded"], null),headers], 0));
var G__67773 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(request,new cljs.core.Keyword(null,"form-params","form-params",1884296467)),new cljs.core.Keyword(null,"body","body",-2049205669),cljs_http_missionary.client.generate_query_string(form_params)),new cljs.core.Keyword(null,"headers","headers",-835030129),headers__$1);
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67773) : client.call(null,G__67773));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(request) : client.call(null,request));
}
});
});
cljs_http_missionary.client.generate_form_data = (function cljs_http_missionary$client$generate_form_data(params){
var form_data = (new FormData());
var seq__67774_67900 = cljs.core.seq(params);
var chunk__67775_67901 = null;
var count__67776_67902 = (0);
var i__67777_67903 = (0);
while(true){
if((i__67777_67903 < count__67776_67902)){
var vec__67784_67904 = chunk__67775_67901.cljs$core$IIndexed$_nth$arity$2(null,i__67777_67903);
var k_67905 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67784_67904,(0),null);
var v_67906 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67784_67904,(1),null);
if(cljs.core.coll_QMARK_(v_67906)){
form_data.append(cljs.core.name(k_67905),cljs.core.first(v_67906),cljs.core.second(v_67906));
} else {
form_data.append(cljs.core.name(k_67905),v_67906);
}


var G__67909 = seq__67774_67900;
var G__67910 = chunk__67775_67901;
var G__67911 = count__67776_67902;
var G__67912 = (i__67777_67903 + (1));
seq__67774_67900 = G__67909;
chunk__67775_67901 = G__67910;
count__67776_67902 = G__67911;
i__67777_67903 = G__67912;
continue;
} else {
var temp__5804__auto___67913 = cljs.core.seq(seq__67774_67900);
if(temp__5804__auto___67913){
var seq__67774_67914__$1 = temp__5804__auto___67913;
if(cljs.core.chunked_seq_QMARK_(seq__67774_67914__$1)){
var c__5525__auto___67915 = cljs.core.chunk_first(seq__67774_67914__$1);
var G__67916 = cljs.core.chunk_rest(seq__67774_67914__$1);
var G__67917 = c__5525__auto___67915;
var G__67918 = cljs.core.count(c__5525__auto___67915);
var G__67919 = (0);
seq__67774_67900 = G__67916;
chunk__67775_67901 = G__67917;
count__67776_67902 = G__67918;
i__67777_67903 = G__67919;
continue;
} else {
var vec__67787_67920 = cljs.core.first(seq__67774_67914__$1);
var k_67921 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67787_67920,(0),null);
var v_67922 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67787_67920,(1),null);
if(cljs.core.coll_QMARK_(v_67922)){
form_data.append(cljs.core.name(k_67921),cljs.core.first(v_67922),cljs.core.second(v_67922));
} else {
form_data.append(cljs.core.name(k_67921),v_67922);
}


var G__67924 = cljs.core.next(seq__67774_67914__$1);
var G__67925 = null;
var G__67926 = (0);
var G__67927 = (0);
seq__67774_67900 = G__67924;
chunk__67775_67901 = G__67925;
count__67776_67902 = G__67926;
i__67777_67903 = G__67927;
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
return (function (p__67790){
var map__67791 = p__67790;
var map__67791__$1 = cljs.core.__destructure_map(map__67791);
var request = map__67791__$1;
var multipart_params = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67791__$1,new cljs.core.Keyword(null,"multipart-params","multipart-params",-1033508707));
var request_method = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67791__$1,new cljs.core.Keyword(null,"request-method","request-method",1764796830));
if(cljs.core.truth_((function (){var and__5000__auto__ = multipart_params;
if(cljs.core.truth_(and__5000__auto__)){
var fexpr__67792 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"patch","patch",380775109),null,new cljs.core.Keyword(null,"delete","delete",-1768633620),null,new cljs.core.Keyword(null,"post","post",269697687),null,new cljs.core.Keyword(null,"put","put",1299772570),null], null), null);
return (fexpr__67792.cljs$core$IFn$_invoke$arity$1 ? fexpr__67792.cljs$core$IFn$_invoke$arity$1(request_method) : fexpr__67792.call(null,request_method));
} else {
return and__5000__auto__;
}
})())){
var G__67793 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(request,new cljs.core.Keyword(null,"multipart-params","multipart-params",-1033508707)),new cljs.core.Keyword(null,"body","body",-2049205669),cljs_http_missionary.client.generate_form_data(multipart_params));
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67793) : client.call(null,G__67793));
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
var G__67794 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(req,new cljs.core.Keyword(null,"method","method",55703592)),new cljs.core.Keyword(null,"request-method","request-method",1764796830),m);
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67794) : client.call(null,G__67794));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(req) : client.call(null,req));
}
});
});
cljs_http_missionary.client.wrap_server_name = (function cljs_http_missionary$client$wrap_server_name(client,server_name){
return (function (p1__67795_SHARP_){
var G__67796 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__67795_SHARP_,new cljs.core.Keyword(null,"server-name","server-name",-1012104295),server_name);
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67796) : client.call(null,G__67796));
});
});
cljs_http_missionary.client.wrap_url = (function cljs_http_missionary$client$wrap_url(client){
return (function (p__67798){
var map__67799 = p__67798;
var map__67799__$1 = cljs.core.__destructure_map(map__67799);
var req = map__67799__$1;
var query_params = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__67799__$1,new cljs.core.Keyword(null,"query-params","query-params",900640534));
var temp__5802__auto__ = cljs_http_missionary.client.parse_url(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(req));
if(cljs.core.truth_(temp__5802__auto__)){
var spec = temp__5802__auto__;
var G__67800 = cljs.core.update_in.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,spec], 0)),new cljs.core.Keyword(null,"url","url",276297046)),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"query-params","query-params",900640534)], null),(function (p1__67797_SHARP_){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([p1__67797_SHARP_,query_params], 0));
}));
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67800) : client.call(null,G__67800));
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
var len__5726__auto___67929 = arguments.length;
var i__5727__auto___67930 = (0);
while(true){
if((i__5727__auto___67930 < len__5726__auto___67929)){
args__5732__auto__.push((arguments[i__5727__auto___67930]));

var G__67931 = (i__5727__auto___67930 + (1));
i__5727__auto___67930 = G__67931;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.wrap_basic_auth.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.wrap_basic_auth.cljs$core$IFn$_invoke$arity$variadic = (function (client,p__67803){
var vec__67804 = p__67803;
var credentials = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67804,(0),null);
return (function (req){
var credentials__$1 = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"basic-auth","basic-auth",-673163332).cljs$core$IFn$_invoke$arity$1(req);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return credentials;
}
})();
if((!(cljs.core.empty_QMARK_(credentials__$1)))){
var G__67807 = cljs.core.assoc_in(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(req,new cljs.core.Keyword(null,"basic-auth","basic-auth",-673163332)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"headers","headers",-835030129),"authorization"], null),cljs_http_missionary.util.basic_auth(credentials__$1));
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67807) : client.call(null,G__67807));
} else {
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(req) : client.call(null,req));
}
});
}));

(cljs_http_missionary.client.wrap_basic_auth.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.wrap_basic_auth.cljs$lang$applyTo = (function (seq67801){
var G__67802 = cljs.core.first(seq67801);
var seq67801__$1 = cljs.core.next(seq67801);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67802,seq67801__$1);
}));

/**
 * Middleware converting the :oauth-token option into an Authorization header.
 */
cljs_http_missionary.client.wrap_oauth = (function cljs_http_missionary$client$wrap_oauth(client){
return (function (req){
var temp__5802__auto__ = new cljs.core.Keyword(null,"oauth-token","oauth-token",311415191).cljs$core$IFn$_invoke$arity$1(req);
if(cljs.core.truth_(temp__5802__auto__)){
var oauth_token = temp__5802__auto__;
var G__67808 = cljs.core.assoc_in(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(req,new cljs.core.Keyword(null,"oauth-token","oauth-token",311415191)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"headers","headers",-835030129),"authorization"], null),["Bearer ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(oauth_token)].join(''));
return (client.cljs$core$IFn$_invoke$arity$1 ? client.cljs$core$IFn$_invoke$arity$1(G__67808) : client.call(null,G__67808));
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
var len__5726__auto___67934 = arguments.length;
var i__5727__auto___67935 = (0);
while(true){
if((i__5727__auto___67935 < len__5726__auto___67934)){
args__5732__auto__.push((arguments[i__5727__auto___67935]));

var G__67936 = (i__5727__auto___67935 + (1));
i__5727__auto___67935 = G__67936;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.delete$.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.delete$.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__67811){
var vec__67812 = p__67811;
var req = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67812,(0),null);
return cljs_http_missionary.client.request(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"delete","delete",-1768633620),new cljs.core.Keyword(null,"url","url",276297046),url], null)], 0)));
}));

(cljs_http_missionary.client.delete$.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.delete$.cljs$lang$applyTo = (function (seq67809){
var G__67810 = cljs.core.first(seq67809);
var seq67809__$1 = cljs.core.next(seq67809);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67810,seq67809__$1);
}));

/**
 * Like #'request, but sets the :method and :url as appropriate.
 */
cljs_http_missionary.client.get = (function cljs_http_missionary$client$get(var_args){
var args__5732__auto__ = [];
var len__5726__auto___67939 = arguments.length;
var i__5727__auto___67940 = (0);
while(true){
if((i__5727__auto___67940 < len__5726__auto___67939)){
args__5732__auto__.push((arguments[i__5727__auto___67940]));

var G__67941 = (i__5727__auto___67940 + (1));
i__5727__auto___67940 = G__67941;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.get.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.get.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__67817){
var vec__67818 = p__67817;
var req = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67818,(0),null);
return cljs_http_missionary.client.request(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"get","get",1683182755),new cljs.core.Keyword(null,"url","url",276297046),url], null)], 0)));
}));

(cljs_http_missionary.client.get.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.get.cljs$lang$applyTo = (function (seq67815){
var G__67816 = cljs.core.first(seq67815);
var seq67815__$1 = cljs.core.next(seq67815);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67816,seq67815__$1);
}));

/**
 * Like #'request, but sets the :method and :url as appropriate.
 */
cljs_http_missionary.client.head = (function cljs_http_missionary$client$head(var_args){
var args__5732__auto__ = [];
var len__5726__auto___67945 = arguments.length;
var i__5727__auto___67946 = (0);
while(true){
if((i__5727__auto___67946 < len__5726__auto___67945)){
args__5732__auto__.push((arguments[i__5727__auto___67946]));

var G__67947 = (i__5727__auto___67946 + (1));
i__5727__auto___67946 = G__67947;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.head.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.head.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__67825){
var vec__67826 = p__67825;
var req = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67826,(0),null);
return cljs_http_missionary.client.request(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"head","head",-771383919),new cljs.core.Keyword(null,"url","url",276297046),url], null)], 0)));
}));

(cljs_http_missionary.client.head.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.head.cljs$lang$applyTo = (function (seq67823){
var G__67824 = cljs.core.first(seq67823);
var seq67823__$1 = cljs.core.next(seq67823);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67824,seq67823__$1);
}));

/**
 * Like #'request, but sets the :method and :url as appropriate.
 */
cljs_http_missionary.client.jsonp = (function cljs_http_missionary$client$jsonp(var_args){
var args__5732__auto__ = [];
var len__5726__auto___67949 = arguments.length;
var i__5727__auto___67950 = (0);
while(true){
if((i__5727__auto___67950 < len__5726__auto___67949)){
args__5732__auto__.push((arguments[i__5727__auto___67950]));

var G__67951 = (i__5727__auto___67950 + (1));
i__5727__auto___67950 = G__67951;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.jsonp.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.jsonp.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__67831){
var vec__67832 = p__67831;
var req = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67832,(0),null);
return cljs_http_missionary.client.request(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"jsonp","jsonp",226119588),new cljs.core.Keyword(null,"url","url",276297046),url], null)], 0)));
}));

(cljs_http_missionary.client.jsonp.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.jsonp.cljs$lang$applyTo = (function (seq67829){
var G__67830 = cljs.core.first(seq67829);
var seq67829__$1 = cljs.core.next(seq67829);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67830,seq67829__$1);
}));

/**
 * Like #'request, but sets the :method and :url as appropriate.
 */
cljs_http_missionary.client.move = (function cljs_http_missionary$client$move(var_args){
var args__5732__auto__ = [];
var len__5726__auto___67954 = arguments.length;
var i__5727__auto___67955 = (0);
while(true){
if((i__5727__auto___67955 < len__5726__auto___67954)){
args__5732__auto__.push((arguments[i__5727__auto___67955]));

var G__67956 = (i__5727__auto___67955 + (1));
i__5727__auto___67955 = G__67956;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.move.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.move.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__67837){
var vec__67838 = p__67837;
var req = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67838,(0),null);
return cljs_http_missionary.client.request(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"move","move",-2110884309),new cljs.core.Keyword(null,"url","url",276297046),url], null)], 0)));
}));

(cljs_http_missionary.client.move.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.move.cljs$lang$applyTo = (function (seq67835){
var G__67836 = cljs.core.first(seq67835);
var seq67835__$1 = cljs.core.next(seq67835);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67836,seq67835__$1);
}));

/**
 * Like #'request, but sets the :method and :url as appropriate.
 */
cljs_http_missionary.client.options = (function cljs_http_missionary$client$options(var_args){
var args__5732__auto__ = [];
var len__5726__auto___67958 = arguments.length;
var i__5727__auto___67959 = (0);
while(true){
if((i__5727__auto___67959 < len__5726__auto___67958)){
args__5732__auto__.push((arguments[i__5727__auto___67959]));

var G__67960 = (i__5727__auto___67959 + (1));
i__5727__auto___67959 = G__67960;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.options.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.options.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__67847){
var vec__67848 = p__67847;
var req = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67848,(0),null);
return cljs_http_missionary.client.request(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"options","options",99638489),new cljs.core.Keyword(null,"url","url",276297046),url], null)], 0)));
}));

(cljs_http_missionary.client.options.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.options.cljs$lang$applyTo = (function (seq67843){
var G__67844 = cljs.core.first(seq67843);
var seq67843__$1 = cljs.core.next(seq67843);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67844,seq67843__$1);
}));

/**
 * Like #'request, but sets the :method and :url as appropriate.
 */
cljs_http_missionary.client.patch = (function cljs_http_missionary$client$patch(var_args){
var args__5732__auto__ = [];
var len__5726__auto___67965 = arguments.length;
var i__5727__auto___67969 = (0);
while(true){
if((i__5727__auto___67969 < len__5726__auto___67965)){
args__5732__auto__.push((arguments[i__5727__auto___67969]));

var G__67971 = (i__5727__auto___67969 + (1));
i__5727__auto___67969 = G__67971;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.patch.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.patch.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__67855){
var vec__67856 = p__67855;
var req = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67856,(0),null);
return cljs_http_missionary.client.request(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"patch","patch",380775109),new cljs.core.Keyword(null,"url","url",276297046),url], null)], 0)));
}));

(cljs_http_missionary.client.patch.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.patch.cljs$lang$applyTo = (function (seq67852){
var G__67853 = cljs.core.first(seq67852);
var seq67852__$1 = cljs.core.next(seq67852);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67853,seq67852__$1);
}));

/**
 * Like #'request, but sets the :method and :url as appropriate.
 */
cljs_http_missionary.client.post = (function cljs_http_missionary$client$post(var_args){
var args__5732__auto__ = [];
var len__5726__auto___67972 = arguments.length;
var i__5727__auto___67973 = (0);
while(true){
if((i__5727__auto___67973 < len__5726__auto___67972)){
args__5732__auto__.push((arguments[i__5727__auto___67973]));

var G__67974 = (i__5727__auto___67973 + (1));
i__5727__auto___67973 = G__67974;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.post.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.post.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__67861){
var vec__67862 = p__67861;
var req = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67862,(0),null);
return cljs_http_missionary.client.request(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"post","post",269697687),new cljs.core.Keyword(null,"url","url",276297046),url], null)], 0)));
}));

(cljs_http_missionary.client.post.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.post.cljs$lang$applyTo = (function (seq67859){
var G__67860 = cljs.core.first(seq67859);
var seq67859__$1 = cljs.core.next(seq67859);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67860,seq67859__$1);
}));

/**
 * Like #'request, but sets the :method and :url as appropriate.
 */
cljs_http_missionary.client.put = (function cljs_http_missionary$client$put(var_args){
var args__5732__auto__ = [];
var len__5726__auto___67976 = arguments.length;
var i__5727__auto___67977 = (0);
while(true){
if((i__5727__auto___67977 < len__5726__auto___67976)){
args__5732__auto__.push((arguments[i__5727__auto___67977]));

var G__67978 = (i__5727__auto___67977 + (1));
i__5727__auto___67977 = G__67978;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs_http_missionary.client.put.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs_http_missionary.client.put.cljs$core$IFn$_invoke$arity$variadic = (function (url,p__67867){
var vec__67868 = p__67867;
var req = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__67868,(0),null);
return cljs_http_missionary.client.request(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([req,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"put","put",1299772570),new cljs.core.Keyword(null,"url","url",276297046),url], null)], 0)));
}));

(cljs_http_missionary.client.put.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs_http_missionary.client.put.cljs$lang$applyTo = (function (seq67865){
var G__67866 = cljs.core.first(seq67865);
var seq67865__$1 = cljs.core.next(seq67865);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__67866,seq67865__$1);
}));


//# sourceMappingURL=cljs_http_missionary.client.js.map
