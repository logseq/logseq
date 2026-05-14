goog.provide('logseq.common.path');
logseq.common.path.safe_decode_uri_component = (function logseq$common$path$safe_decode_uri_component(uri){
try{return decodeURIComponent(uri).normalize("NFC");
}catch (e62877){var _ = e62877;
console.error("decode-uri-component-failed",uri);

return uri;
}});
logseq.common.path.is_file_url_QMARK_ = (function logseq$common$path$is_file_url_QMARK_(s){
return ((typeof s === 'string') && (((clojure.string.starts_with_QMARK_(s,"memory://")) || (((clojure.string.starts_with_QMARK_(s,"assets://")) || (clojure.string.starts_with_QMARK_(s,"file://")))))));
});
/**
 * File name of a path or URL.
 * Returns nil when it's a directory that ends with '/'.
 */
logseq.common.path.filename = (function logseq$common$path$filename(path){
var fname = ((clojure.string.ends_with_QMARK_(path,"/"))?null:cljs.core.last(clojure.string.split.cljs$core$IFn$_invoke$arity$2(path,/\//)));
if(((cljs.core.seq(fname)) && (logseq.common.path.is_file_url_QMARK_(path)))){
return logseq.common.path.safe_decode_uri_component(fname);
} else {
return fname;
}
});
/**
 * Split file name into stem and extension, for both path and URL
 */
logseq.common.path.split_ext = (function logseq$common$path$split_ext(path){
var fname = logseq.common.path.filename(path);
var pos = clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$2(fname,".");
if((!((((pos == null)) || ((pos === (0))))))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(fname,(0),pos),clojure.string.lower_case(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(fname,(pos + (1))))], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [fname,""], null);
}
});
/**
 * File name without extension
 */
logseq.common.path.file_stem = (function logseq$common$path$file_stem(path){
return cljs.core.first(logseq.common.path.split_ext(path));
});
/**
 * File extension, lowercased
 */
logseq.common.path.file_ext = (function logseq$common$path$file_ext(path){
return cljs.core.second(logseq.common.path.split_ext(path));
});
/**
 * Safe filename on all platforms
 */
logseq.common.path.safe_filename_QMARK_ = (function logseq$common$path$safe_filename_QMARK_(fname){
return (((!(clojure.string.blank_QMARK_(fname)))) && ((((cljs.core.count(fname) < (255))) && (cljs.core.not((function (){var or__5002__auto__ = cljs.core.re_find(/[\\/?<>\\:*|\"]/,fname);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.core.re_find(/^\.+$/,fname);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = cljs.core.re_find(/[\. ]$/,fname);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = cljs.core.re_find(/^(COM[0-9]|CON|LPT[0-9]|NUL|PRN|AUX|com[0-9]|con|lpt[0-9]|nul|prn|aux)\..+/i,fname);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
return cljs.core.re_find(/[\u0000-\u001f\u0080-\u009f]/,fname);
}
}
}
}
})())))));
});
/**
 * Joins the given path segments into a single path, handling relative paths,
 *   '..' and '.' normalization.
 */
logseq.common.path.path_join_internal = (function logseq$common$path$path_join_internal(var_args){
var args__5732__auto__ = [];
var len__5726__auto___63022 = arguments.length;
var i__5727__auto___63023 = (0);
while(true){
if((i__5727__auto___63023 < len__5726__auto___63022)){
args__5732__auto__.push((arguments[i__5727__auto___63023]));

var G__63026 = (i__5727__auto___63023 + (1));
i__5727__auto___63023 = G__63026;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return logseq.common.path.path_join_internal.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(logseq.common.path.path_join_internal.cljs$core$IFn$_invoke$arity$variadic = (function (segments){
var segments__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(clojure.string.blank_QMARK_,segments);
var segments__$2 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__62902_SHARP_){
return clojure.string.replace(p1__62902_SHARP_,/[\/\\]+/,"/");
}),segments__$1);
var split_fn = (function (s){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(s,"/")){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [""], null);
} else {
return clojure.string.split.cljs$core$IFn$_invoke$arity$2(s,/\//);
}
});
var join_fn = (function (segs){
var G__62916 = segs;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,G__62916)){
return ".";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [""], null),G__62916)){
return "/";
} else {
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("/",segs);

}
}
});
return join_fn(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,segment){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("",segment)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [segment], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("..",segment)){
var G__62920 = cljs.core.last(acc);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("..",G__62920)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(acc,segment);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("",G__62920)){
return acc;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(null,G__62920)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [".."], null);
} else {
return cljs.core.pop(acc);

}
}
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(".",segment)){
return acc;
} else {
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(acc,segment);

}
}
}
}),cljs.core.PersistentVector.EMPTY,cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(split_fn,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.seq,segments__$2)], 0))));
}));

(logseq.common.path.path_join_internal.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(logseq.common.path.path_join_internal.cljs$lang$applyTo = (function (seq62903){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq62903));
}));

/**
 * Joins the given URI path segments into a single path, handling relative paths,
 *   '..' and '.' normalization.
 */
logseq.common.path.uri_path_join_internal = (function logseq$common$path$uri_path_join_internal(var_args){
var args__5732__auto__ = [];
var len__5726__auto___63032 = arguments.length;
var i__5727__auto___63033 = (0);
while(true){
if((i__5727__auto___63033 < len__5726__auto___63032)){
args__5732__auto__.push((arguments[i__5727__auto___63033]));

var G__63034 = (i__5727__auto___63033 + (1));
i__5727__auto___63033 = G__63034;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return logseq.common.path.uri_path_join_internal.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(logseq.common.path.uri_path_join_internal.cljs$core$IFn$_invoke$arity$variadic = (function (segments){
var segments__$1 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,segments);
var segments__$2 = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__62936_SHARP_){
return clojure.string.replace(p1__62936_SHARP_,/[\/\\]+/,"/");
}),segments__$1);
var split_fn = (function (s){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(s,"/")){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [""], null);
} else {
return clojure.string.split.cljs$core$IFn$_invoke$arity$2(s,/\//);
}
});
var join_fn = (function (segs){
var G__62947 = segs;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,G__62947)){
return ".";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [""], null),G__62947)){
return "/";
} else {
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("/",segs);

}
}
});
return join_fn(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,segment){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("",segment)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [segment], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("..",segment)){
var G__62949 = cljs.core.last(acc);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("..",G__62949)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(acc,segment);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("",G__62949)){
return acc;
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(null,G__62949)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [".."], null);
} else {
return cljs.core.pop(acc);

}
}
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(".",segment)){
return acc;
} else {
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(acc,segment);

}
}
}
}),cljs.core.PersistentVector.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__62937_SHARP_){
return encodeURIComponent(p1__62937_SHARP_);
}),cljs.core.mapcat.cljs$core$IFn$_invoke$arity$variadic(split_fn,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.seq,segments__$2)], 0)))));
}));

(logseq.common.path.uri_path_join_internal.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(logseq.common.path.uri_path_join_internal.cljs$lang$applyTo = (function (seq62938){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq62938));
}));

/**
 * Segments are not URL-encoded
 */
logseq.common.path.url_join = (function logseq$common$path$url_join(var_args){
var args__5732__auto__ = [];
var len__5726__auto___63036 = arguments.length;
var i__5727__auto___63037 = (0);
while(true){
if((i__5727__auto___63037 < len__5726__auto___63036)){
args__5732__auto__.push((arguments[i__5727__auto___63037]));

var G__63038 = (i__5727__auto___63037 + (1));
i__5727__auto___63037 = G__63038;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return logseq.common.path.url_join.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(logseq.common.path.url_join.cljs$core$IFn$_invoke$arity$variadic = (function (base_url,segments){
var url = (new URL(logseq.common.path.safe_decode_uri_component(base_url)));
var scheme = url.protocol;
var path = url.pathname;
var domain = (function (){var or__5002__auto__ = cljs.core.not_empty(url.host);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(clojure.string.starts_with_QMARK_(path,"/")){
return "";
} else {
return "/";
}
}
})();
var encoded_new_path = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.common.path.uri_path_join_internal,path,segments);
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(scheme),"//",cljs.core.str.cljs$core$IFn$_invoke$arity$1(domain),cljs.core.str.cljs$core$IFn$_invoke$arity$1(encoded_new_path)].join('');
}));

(logseq.common.path.url_join.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(logseq.common.path.url_join.cljs$lang$applyTo = (function (seq62957){
var G__62958 = cljs.core.first(seq62957);
var seq62957__$1 = cljs.core.next(seq62957);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__62958,seq62957__$1);
}));

/**
 * Join path segments, or URL base and path segments
 */
logseq.common.path.path_join = (function logseq$common$path$path_join(var_args){
var args__5732__auto__ = [];
var len__5726__auto___63041 = arguments.length;
var i__5727__auto___63042 = (0);
while(true){
if((i__5727__auto___63042 < len__5726__auto___63041)){
args__5732__auto__.push((arguments[i__5727__auto___63042]));

var G__63043 = (i__5727__auto___63042 + (1));
i__5727__auto___63042 = G__63043;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic = (function (base,segments){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(base,"")){
console.error("BUG: should not join with empty dir",segments);
} else {

}

if(logseq.common.path.is_file_url_QMARK_(base)){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.common.path.url_join,base,segments);
} else {
var rejoined_path = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(logseq.common.path.path_join_internal,base,segments);
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not_empty(base);
if(cljs.core.truth_(and__5000__auto__)){
return clojure.string.starts_with_QMARK_(base,"//");
} else {
return and__5000__auto__;
}
})())){
return ["/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(rejoined_path)].join('');
} else {
return rejoined_path;
}
}
}));

(logseq.common.path.path_join.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(logseq.common.path.path_join.cljs$lang$applyTo = (function (seq62965){
var G__62966 = cljs.core.first(seq62965);
var seq62965__$1 = cljs.core.next(seq62965);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__62966,seq62965__$1);
}));

/**
 * Prepend protocol to path. Handle UNC path. aka. path-to-url
 * 
 * protocol is one of file: http: https: assets:
 */
logseq.common.path.prepend_protocol = (function logseq$common$path$prepend_protocol(protocol,path){
if(clojure.string.starts_with_QMARK_(path,protocol)){
console.error("BUG: should not prepend protocol to path with protocol",protocol,path);

return path;
} else {
if(clojure.string.starts_with_QMARK_(path,"//")){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(protocol),cljs.core.str.cljs$core$IFn$_invoke$arity$1(path)].join('');
} else {
return logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic([cljs.core.str.cljs$core$IFn$_invoke$arity$1(protocol),"//"].join(''),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path], 0));

}
}
});
/**
 * Normalize path using path-join, break into segment and re-join
 */
logseq.common.path.path_normalize_internal = (function logseq$common$path$path_normalize_internal(path){
return logseq.common.path.path_join(path);
});
logseq.common.path.url_normalize = (function logseq$common$path$url_normalize(origin_url){
var url = (new URL(logseq.common.path.safe_decode_uri_component(origin_url)));
var scheme = url.protocol;
var domain = (function (){var or__5002__auto__ = cljs.core.not_empty(url.host);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "/";
}
})();
var path = url.pathname;
var encoded_new_path = logseq.common.path.uri_path_join_internal.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path], 0));
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(scheme),"//",cljs.core.str.cljs$core$IFn$_invoke$arity$1(domain),encoded_new_path].join('');
});
/**
 * Normalize path or URL
 */
logseq.common.path.path_normalize = (function logseq$common$path$path_normalize(path){
return ((logseq.common.path.is_file_url_QMARK_(path))?logseq.common.path.url_normalize(path):logseq.common.path.path_normalize_internal(path)).normalize("NFC");
});
/**
 * Extract path part of a URL, decoded.
 * 
 * The reverse operation is (path-join protocol:// path)
 */
logseq.common.path.url_to_path = (function logseq$common$path$url_to_path(original_url){
if(logseq.common.path.is_file_url_QMARK_(original_url)){
var url = (function (){try{return (new URL(clojure.string.replace(logseq.common.path.safe_decode_uri_component(original_url),"assets://","file://")));
}catch (e62999){var e = e62999;
console.error("invalid URL:",["original-url: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(original_url)," url: ",clojure.string.replace(logseq.common.path.safe_decode_uri_component(original_url),"assets://","file://")].join(''));

throw e;
}})();
var path = url.pathname;
var host = url.host;
var path__$1 = ((clojure.string.starts_with_QMARK_(path,"///"))?cljs.core.subs.cljs$core$IFn$_invoke$arity$2(path,(2)):path);
var path__$2 = (cljs.core.truth_(cljs.core.re_find(/^\/[a-zA-Z]:/i,path__$1))?cljs.core.subs.cljs$core$IFn$_invoke$arity$2(path__$1,(1)):path__$1);
if(clojure.string.blank_QMARK_(host)){
return path__$2;
} else {
return ["//",cljs.core.str.cljs$core$IFn$_invoke$arity$1(host),cljs.core.str.cljs$core$IFn$_invoke$arity$1(path__$2)].join('');
}
} else {
return original_url;
}
});
/**
 * Trim dir prefix from path
 */
logseq.common.path.trim_dir_prefix = (function logseq$common$path$trim_dir_prefix(base_path,sub_path){
var base_path__$1 = logseq.common.path.path_normalize(base_path);
var sub_path__$1 = logseq.common.path.path_normalize(sub_path);
var is_url_QMARK_ = logseq.common.path.is_file_url_QMARK_(base_path__$1);
if(clojure.string.starts_with_QMARK_(sub_path__$1,base_path__$1)){
if(is_url_QMARK_){
return logseq.common.path.safe_decode_uri_component(clojure.string.replace(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(sub_path__$1,cljs.core.count(base_path__$1)),/^\/+/,""));
} else {
return clojure.string.replace(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(sub_path__$1,cljs.core.count(base_path__$1)),/^\/+/,"");
}
} else {
console.error("unhandled trim-base",base_path__$1,sub_path__$1);

return null;
}
});
/**
 * Get relative path from base path.
 * Works for both path and URL.
 */
logseq.common.path.relative_path = (function logseq$common$path$relative_path(base_path,sub_path){
var base_path__$1 = logseq.common.path.path_normalize(base_path);
var sub_path__$1 = logseq.common.path.path_normalize(sub_path);
var is_url_QMARK_ = logseq.common.path.is_file_url_QMARK_(base_path__$1);
if(clojure.string.starts_with_QMARK_(sub_path__$1,base_path__$1)){
if(is_url_QMARK_){
return logseq.common.path.safe_decode_uri_component(clojure.string.replace(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(sub_path__$1,cljs.core.count(base_path__$1)),/^\/+/,""));
} else {
return clojure.string.replace(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(sub_path__$1,cljs.core.count(base_path__$1)),/^\/+/,"");
}
} else {
var base_segs = clojure.string.split.cljs$core$IFn$_invoke$arity$3(base_path__$1,/\//,(-1));
var path_segs = clojure.string.split.cljs$core$IFn$_invoke$arity$3(sub_path__$1,/\//,(-1));
var common_segs = cljs.core.take_while.cljs$core$IFn$_invoke$arity$2((function (p1__63000_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(p1__63000_SHARP_),cljs.core.second(p1__63000_SHARP_));
}),cljs.core.map.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,base_segs,path_segs));
var base_segs__$1 = cljs.core.drop.cljs$core$IFn$_invoke$arity$2(cljs.core.count(common_segs),base_segs);
var remain_segs = cljs.core.drop.cljs$core$IFn$_invoke$arity$2(cljs.core.count(common_segs),path_segs);
var base_prefix = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((function (){var x__5087__auto__ = (0);
var y__5088__auto__ = (cljs.core.count(base_segs__$1) - (1));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})(),"../"));
console.error((new Error("buggy relative-path")),base_path__$1,sub_path__$1);

if(is_url_QMARK_){
return logseq.common.path.safe_decode_uri_component([cljs.core.str.cljs$core$IFn$_invoke$arity$1(base_prefix),clojure.string.join.cljs$core$IFn$_invoke$arity$2("/",remain_segs)].join(''));
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(base_prefix),clojure.string.join.cljs$core$IFn$_invoke$arity$2("/",remain_segs)].join('');
}
}
});
/**
 * Parent, containing directory
 */
logseq.common.path.parent = (function logseq$common$path$parent(path){
if(clojure.string.includes_QMARK_(path,"/")){
return logseq.common.path.path_normalize([cljs.core.str.cljs$core$IFn$_invoke$arity$1(path),"/.."].join(''));
} else {
return null;
}
});
/**
 * Assume current-path is a file
 */
logseq.common.path.resolve_relative_path = (function logseq$common$path$resolve_relative_path(current_path,rel_path){
var temp__5802__auto__ = logseq.common.path.parent(current_path);
if(cljs.core.truth_(temp__5802__auto__)){
var base_dir = temp__5802__auto__;
return logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(base_dir,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([rel_path], 0));
} else {
return rel_path;
}
});
/**
 * Assume current-path is a file, and target-path is a file or directory.
 * Return relative path from current-path to target-path.
 * Works for both path and URL. Also works for relative path.
 * The opposite operation is `resolve-relative-path`
 */
logseq.common.path.get_relative_path = (function logseq$common$path$get_relative_path(current_path,target_path){
var base_path = logseq.common.path.parent(current_path);
var sub_path = logseq.common.path.path_normalize(target_path);
var is_url_QMARK_ = logseq.common.path.is_file_url_QMARK_(base_path);
var base_segs = (cljs.core.truth_(base_path)?clojure.string.split.cljs$core$IFn$_invoke$arity$3(base_path,/\//,(-1)):cljs.core.PersistentVector.EMPTY);
var path_segs = clojure.string.split.cljs$core$IFn$_invoke$arity$3(sub_path,/\//,(-1));
var common_segs = cljs.core.take_while.cljs$core$IFn$_invoke$arity$2((function (p1__63009_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(p1__63009_SHARP_),cljs.core.second(p1__63009_SHARP_));
}),cljs.core.map.cljs$core$IFn$_invoke$arity$3(cljs.core.vector,base_segs,path_segs));
var base_segs__$1 = cljs.core.drop.cljs$core$IFn$_invoke$arity$2(cljs.core.count(common_segs),base_segs);
var remain_segs = cljs.core.drop.cljs$core$IFn$_invoke$arity$2(cljs.core.count(common_segs),path_segs);
var base_prefix = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,cljs.core.repeat.cljs$core$IFn$_invoke$arity$2((function (){var x__5087__auto__ = (0);
var y__5088__auto__ = cljs.core.count(base_segs__$1);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})(),"../"));
if(is_url_QMARK_){
return logseq.common.path.safe_decode_uri_component([cljs.core.str.cljs$core$IFn$_invoke$arity$1(base_prefix),clojure.string.join.cljs$core$IFn$_invoke$arity$2("/",remain_segs)].join(''));
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(base_prefix),clojure.string.join.cljs$core$IFn$_invoke$arity$2("/",remain_segs)].join('');
}
});
logseq.common.path.basename = (function logseq$common$path$basename(path){
var path__$1 = clojure.string.replace(path,/\/+$/,"");
return logseq.common.path.filename(path__$1);
});
logseq.common.path.dirname = (function logseq$common$path$dirname(path){
return logseq.common.path.parent(path);
});
/**
 * Whether path `p` is absolute.
 */
logseq.common.path.absolute_QMARK_ = (function logseq$common$path$absolute_QMARK_(p){
var p__$1 = logseq.common.path.path_normalize(p);
return cljs.core.boolean$((function (){var or__5002__auto__ = logseq.common.path.is_file_url_QMARK_(p__$1);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = clojure.string.starts_with_QMARK_(p__$1,"/");
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
return cljs.core.re_find(/^[a-zA-Z]:[\/\\]/,p__$1);
}
}
})());
});
/**
 * Whether path `p` is a protocol URL.
 * 
 * This is a loose check, it only checks if there is a valid protocol prefix.
 */
logseq.common.path.protocol_url_QMARK_ = (function logseq$common$path$protocol_url_QMARK_(p){
return cljs.core.boolean$((function (){var and__5000__auto__ = cljs.core.re_find(/^[a-zA-Z0-9_+\-\.]{2,}:/,p);
if(cljs.core.truth_(and__5000__auto__)){
return (!(clojure.string.includes_QMARK_(p," ")));
} else {
return and__5000__auto__;
}
})());
});

//# sourceMappingURL=logseq.common.path.js.map
