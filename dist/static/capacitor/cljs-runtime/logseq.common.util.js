goog.provide('logseq.common.util');
logseq.common.util.safe_decode_uri_component = (function logseq$common$util$safe_decode_uri_component(uri){
try{return decodeURIComponent(uri);
}catch (e51839){var _ = e51839;
logseq.common.log.error.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"decode-uri-component-failed","decode-uri-component-failed",-1939148471),uri], 0));

return uri;
}});
/**
 * Normalize file path (for reading paths from FS, not required by writing)
 * Keep capitalization sensitivity
 */
logseq.common.util.path_normalize = (function logseq$common$util$path_normalize(s){
return s.normalize("NFC");
});
/**
 * remove pairs of key-value that has nil value from a (possibly nested) map or
 *   coll of maps.
 */
logseq.common.util.remove_nils = (function logseq$common$util$remove_nils(nm){
return clojure.walk.postwalk((function (el){
if(cljs.core.map_QMARK_(el)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$1(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.second)),el);
} else {
return el;
}
}),nm);
});
/**
 * remove pairs of key-value that has nil value from a map (nested not supported).
 */
logseq.common.util.remove_nils_non_nested = (function logseq$common$util$remove_nils_non_nested(nm){
return cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$1(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.second)),nm);
});
/**
 * remove pairs of key-value that has nil value from a coll of maps.
 */
logseq.common.util.fast_remove_nils = (function logseq$common$util$fast_remove_nils(nm){
return cljs.core.keep.cljs$core$IFn$_invoke$arity$2((function (m){
if(cljs.core.map_QMARK_(m)){
return logseq.common.util.remove_nils_non_nested(m);
} else {
return m;
}
}),nm);
});
logseq.common.util.split_first = (function logseq$common$util$split_first(pattern,s){
var temp__5804__auto__ = clojure.string.index_of.cljs$core$IFn$_invoke$arity$2(s,pattern);
if(cljs.core.truth_(temp__5804__auto__)){
var first_index = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,(0),first_index),cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,(first_index + cljs.core.count(pattern)),cljs.core.count(s))], null);
} else {
return null;
}
});
logseq.common.util.split_last = (function logseq$common$util$split_last(pattern,s){
var temp__5804__auto__ = clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$2(s,pattern);
if(cljs.core.truth_(temp__5804__auto__)){
var last_index = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,(0),last_index),cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,(last_index + cljs.core.count(pattern)),cljs.core.count(s))], null);
} else {
return null;
}
});
logseq.common.util.tag_valid_QMARK_ = (function logseq$common$util$tag_valid_QMARK_(tag_name){
if(typeof tag_name === 'string'){
return cljs.core.not(cljs.core.re_find(/[#\t\r\n]+/,tag_name));
} else {
return null;
}
});
/**
 * Whether `s` is a tag.
 */
logseq.common.util.tag_QMARK_ = (function logseq$common$util$tag_QMARK_(s){
return ((typeof s === 'string') && (((clojure.string.starts_with_QMARK_(s,"#")) && ((((!(clojure.string.includes_QMARK_(s," ")))) || (((clojure.string.starts_with_QMARK_(s,"#[[")) || (clojure.string.ends_with_QMARK_(s,"]]")))))))));
});
logseq.common.util.safe_subs = (function logseq$common$util$safe_subs(var_args){
var G__51888 = arguments.length;
switch (G__51888) {
case 2:
return logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$2 = (function (s,start){
var c = cljs.core.count(s);
return logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3(s,start,c);
}));

(logseq.common.util.safe_subs.cljs$core$IFn$_invoke$arity$3 = (function (s,start,end){
var c = cljs.core.count(s);
return cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,(function (){var x__5090__auto__ = c;
var y__5091__auto__ = start;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})(),(function (){var x__5090__auto__ = c;
var y__5091__auto__ = end;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})());
}));

(logseq.common.util.safe_subs.cljs$lang$maxFixedArity = 3);

logseq.common.util.unquote_string = (function logseq$common$util$unquote_string(v){
return clojure.string.trim(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(v,(1),(cljs.core.count(v) - (1))));
});
logseq.common.util.wrapped_by = (function logseq$common$util$wrapped_by(v,start,end){
return ((typeof v === 'string') && ((((cljs.core.count(v) >= (2))) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(start,cljs.core.first(v))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(end,cljs.core.last(v))))))));
});
logseq.common.util.wrapped_by_quotes_QMARK_ = (function logseq$common$util$wrapped_by_quotes_QMARK_(v){
return logseq.common.util.wrapped_by(v,"\"","\"");
});
logseq.common.util.wrapped_by_parens_QMARK_ = (function logseq$common$util$wrapped_by_parens_QMARK_(v){
return logseq.common.util.wrapped_by(v,"(",")");
});
/**
 * Test if it is a `protocol://`-style URL.
 * 
 * NOTE: Can not handle mailto: links, use this with caution.
 */
logseq.common.util.url_QMARK_ = (function logseq$common$util$url_QMARK_(s){
var and__5000__auto__ = typeof s === 'string';
if(and__5000__auto__){
try{return (!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [null,null,"null",null], null), null),(new URL(s)).origin)));
}catch (e51899){var _e = e51899;
return false;
}} else {
return and__5000__auto__;
}
});
logseq.common.util.json__GT_clj = (function logseq$common$util$json__GT_clj(json_string){
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(JSON.parse(json_string),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
});
/**
 * Copy of frontend.util/zero-pad. Too basic to couple to main app
 */
logseq.common.util.zero_pad = (function logseq$common$util$zero_pad(n){
if((n < (10))){
return ["0",cljs.core.str.cljs$core$IFn$_invoke$arity$1(n)].join('');
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(n);
}
});
logseq.common.util.remove_boundary_slashes = (function logseq$common$util$remove_boundary_slashes(s){
if(typeof s === 'string'){
var s__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("/",cljs.core.first(s)))?cljs.core.subs.cljs$core$IFn$_invoke$arity$2(s,(1)):s);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("/",cljs.core.last(s__$1))){
return cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s__$1,(0),(((s__$1).length) - (1)));
} else {
return s__$1;
}
} else {
return null;
}
});
logseq.common.util.split_namespace_pages = (function logseq$common$util$split_namespace_pages(title){
var parts = clojure.string.split.cljs$core$IFn$_invoke$arity$2(title,"/");
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.trim,(function (){var others = cljs.core.rest(parts);
var result = new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.first(parts)], null);
while(true){
if(cljs.core.seq(others)){
var prev = cljs.core.last(result);
var G__52222 = cljs.core.rest(others);
var G__52223 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(result,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(prev),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(others))].join(''));
others = G__52222;
result = G__52223;
continue;
} else {
return result;
}
break;
}
})());
});
logseq.common.util.url_encoded_pattern = /%[0-9a-f]{2}/i;
/**
 * Sanitize the page-name. Unify different diacritics and other visual differences.
 * Two objectives:
 * 1. To be the same as in the filesystem;
 * 2. To be easier to search
 */
logseq.common.util.page_name_sanity = (function logseq$common$util$page_name_sanity(page_name){
var G__51933 = page_name;
var G__51933__$1 = (((G__51933 == null))?null:logseq.common.util.remove_boundary_slashes(G__51933));
if((G__51933__$1 == null)){
return null;
} else {
return logseq.common.util.path_normalize(G__51933__$1);
}
});
/**
 * Sanitize the query string for a page name (mandate for :block/name)
 */
logseq.common.util.page_name_sanity_lc = (function logseq$common$util$page_name_sanity_lc(s){
return logseq.common.util.page_name_sanity(clojure.string.lower_case(s));
});
logseq.common.util.safe_page_name_sanity_lc = (function logseq$common$util$safe_page_name_sanity_lc(s){
if(typeof s === 'string'){
return logseq.common.util.page_name_sanity_lc(s);
} else {
return s;
}
});
logseq.common.util.capitalize_all = (function logseq$common$util$capitalize_all(s){
var G__51960 = clojure.string.split.cljs$core$IFn$_invoke$arity$2(s,/ /);
var G__51960__$1 = (((G__51960 == null))?null:cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.capitalize,G__51960));
if((G__51960__$1 == null)){
return null;
} else {
return clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",G__51960__$1);
}
});
/**
 * Copy from medley
 */
logseq.common.util.distinct_by = (function logseq$common$util$distinct_by(f,coll){
var step = (function logseq$common$util$distinct_by_$_step(xs,seen){
return (new cljs.core.LazySeq(null,(function (){
return (function (p__51966,seen__$1){
while(true){
var vec__51967 = p__51966;
var x = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__51967,(0),null);
var xs__$1 = vec__51967;
var temp__5804__auto__ = cljs.core.seq(xs__$1);
if(temp__5804__auto__){
var s = temp__5804__auto__;
var fx = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(x) : f.call(null,x));
if(cljs.core.contains_QMARK_(seen__$1,fx)){
var G__52252 = cljs.core.rest(s);
var G__52253 = seen__$1;
p__51966 = G__52252;
seen__$1 = G__52253;
continue;
} else {
return cljs.core.cons(x,logseq$common$util$distinct_by_$_step(cljs.core.rest(s),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(seen__$1,fx)));
}
} else {
return null;
}
break;
}
})(xs,seen);
}),null,null));
});
return step(cljs.core.seq(coll),cljs.core.PersistentHashSet.EMPTY);
});
logseq.common.util.distinct_by_last_wins = (function logseq$common$util$distinct_by_last_wins(f,col){
if(cljs.core.sequential_QMARK_(col)){
} else {
throw (new Error("Assert failed: (sequential? col)"));
}

return cljs.core.reverse(logseq.common.util.distinct_by(f,cljs.core.reverse(col)));
});
logseq.common.util.normalize_format = (function logseq$common$util$normalize_format(format){
var G__51984 = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(format);
var G__51984__$1 = (((G__51984 instanceof cljs.core.Keyword))?G__51984.fqn:null);
switch (G__51984__$1) {
case "md":
return new cljs.core.Keyword(null,"markdown","markdown",1227225089);

break;
default:
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(format);

}
});
logseq.common.util.path__GT_file_ext = (function logseq$common$util$path__GT_file_ext(path_or_file_name){
var last_part = cljs.core.last(clojure.string.split.cljs$core$IFn$_invoke$arity$2(path_or_file_name,/\//));
return cljs.core.second(cljs.core.re_find(/(?:\.)(\w+)[^.]*$/,last_part));
});
/**
 * File path to format keyword, :org, :markdown, etc.
 */
logseq.common.util.get_format = (function logseq$common$util$get_format(file){
if(cljs.core.truth_(file)){
return logseq.common.util.normalize_format(cljs.core.keyword.cljs$core$IFn$_invoke$arity$1((function (){var G__51989 = logseq.common.util.path__GT_file_ext(file);
if((G__51989 == null)){
return null;
} else {
return clojure.string.lower_case(G__51989);
}
})()));
} else {
return null;
}
});
/**
 * Copy of frontend.util/get-file-ext. Too basic to couple to main app
 */
logseq.common.util.get_file_ext = (function logseq$common$util$get_file_ext(file){
var and__5000__auto__ = typeof file === 'string';
if(and__5000__auto__){
var and__5000__auto____$1 = clojure.string.includes_QMARK_(file,".");
if(and__5000__auto____$1){
var G__51993 = logseq.common.util.path__GT_file_ext(file);
if((G__51993 == null)){
return null;
} else {
return clojure.string.lower_case(G__51993);
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
});
/**
 * Determine if string is a valid edn keyword
 */
logseq.common.util.valid_edn_keyword_QMARK_ = (function logseq$common$util$valid_edn_keyword_QMARK_(s){
try{return cljs.core.boolean$((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(":",cljs.core.first(s));
if(and__5000__auto__){
return clojure.edn.read_string.cljs$core$IFn$_invoke$arity$1(["{",cljs.core.str.cljs$core$IFn$_invoke$arity$1(s)," nil}"].join(''));
} else {
return and__5000__auto__;
}
})());
}catch (e51999){var _ = e51999;
return false;
}});
/**
 * Reads an edn string and returns nil if it fails to parse
 */
logseq.common.util.safe_read_string = (function logseq$common$util$safe_read_string(var_args){
var G__52009 = arguments.length;
switch (G__52009) {
case 1:
return logseq.common.util.safe_read_string.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return logseq.common.util.safe_read_string.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.common.util.safe_read_string.cljs$core$IFn$_invoke$arity$1 = (function (content){
return logseq.common.util.safe_read_string.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,content);
}));

(logseq.common.util.safe_read_string.cljs$core$IFn$_invoke$arity$2 = (function (p__52011,content){
var map__52013 = p__52011;
var map__52013__$1 = cljs.core.__destructure_map(map__52013);
var opts = map__52013__$1;
var log_error_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__52013__$1,new cljs.core.Keyword(null,"log-error?","log-error?",969837063),true);
try{return cljs.reader.read_string.cljs$core$IFn$_invoke$arity$2(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(opts,new cljs.core.Keyword(null,"log-error?","log-error?",969837063)),content);
}catch (e52014){var e = e52014;
if(cljs.core.truth_(log_error_QMARK_)){
logseq.common.log.error.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("parse","read-string-failed","parse/read-string-failed",-1539006048),e], 0));
} else {
}

return null;
}}));

(logseq.common.util.safe_read_string.cljs$lang$maxFixedArity = 2);

/**
 * Reads an edn map string and returns {} if it fails to parse
 */
logseq.common.util.safe_read_map_string = (function logseq$common$util$safe_read_map_string(var_args){
var G__52020 = arguments.length;
switch (G__52020) {
case 1:
return logseq.common.util.safe_read_map_string.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return logseq.common.util.safe_read_map_string.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.common.util.safe_read_map_string.cljs$core$IFn$_invoke$arity$1 = (function (content){
return logseq.common.util.safe_read_map_string.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,content);
}));

(logseq.common.util.safe_read_map_string.cljs$core$IFn$_invoke$arity$2 = (function (opts,content){
try{return cljs.reader.read_string.cljs$core$IFn$_invoke$arity$2(opts,content);
}catch (e52028){var e = e52028;
logseq.common.log.error.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("parse","read-string-failed","parse/read-string-failed",-1539006048),e], 0));

return cljs.core.PersistentArrayMap.EMPTY;
}}));

(logseq.common.util.safe_read_map_string.cljs$lang$maxFixedArity = 2);

logseq.common.util.safe_re_find = (function logseq$common$util$safe_re_find(pattern,s){
if(typeof s === 'string'){
} else {
console.trace();
}

if(typeof s === 'string'){
return cljs.core.re_find(pattern,s);
} else {
return null;
}
});
logseq.common.util.uuid_pattern = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
if((typeof logseq !== 'undefined') && (typeof logseq.common !== 'undefined') && (typeof logseq.common.util !== 'undefined') && (typeof logseq.common.util.exactly_uuid_pattern !== 'undefined')){
} else {
logseq.common.util.exactly_uuid_pattern = cljs.core.re_pattern(["(?i)^",logseq.common.util.uuid_pattern,"$"].join(''));
}
logseq.common.util.uuid_string_QMARK_ = (function logseq$common$util$uuid_string_QMARK_(s){
return cljs.core.boolean$(logseq.common.util.safe_re_find(logseq.common.util.exactly_uuid_pattern,s));
});
logseq.common.util.format = (function logseq$common$util$format(var_args){
var args__5732__auto__ = [];
var len__5726__auto___52321 = arguments.length;
var i__5727__auto___52322 = (0);
while(true){
if((i__5727__auto___52322 < len__5726__auto___52321)){
args__5732__auto__.push((arguments[i__5727__auto___52322]));

var G__52332 = (i__5727__auto___52322 + (1));
i__5727__auto___52322 = G__52332;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return logseq.common.util.format.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(logseq.common.util.format.cljs$core$IFn$_invoke$arity$variadic = (function (fmt,args){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(goog.string.format,fmt,args);
}));

(logseq.common.util.format.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(logseq.common.util.format.cljs$lang$applyTo = (function (seq52041){
var G__52042 = cljs.core.first(seq52041);
var seq52041__$1 = cljs.core.next(seq52041);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__52042,seq52041__$1);
}));

logseq.common.util.remove_first = (function logseq$common$util$remove_first(pred,coll){
return (function logseq$common$util$remove_first_$_inner(coll__$1){
return (new cljs.core.LazySeq(null,(function (){
var temp__5804__auto__ = cljs.core.seq(coll__$1);
if(temp__5804__auto__){
var vec__52057 = temp__5804__auto__;
var seq__52058 = cljs.core.seq(vec__52057);
var first__52059 = cljs.core.first(seq__52058);
var seq__52058__$1 = cljs.core.next(seq__52058);
var x = first__52059;
var xs = seq__52058__$1;
if(cljs.core.truth_((pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(x) : pred.call(null,x)))){
return xs;
} else {
return cljs.core.cons(x,logseq$common$util$remove_first_$_inner(xs));
}
} else {
return null;
}
}),null,null));
})(coll);
});
logseq.common.util.concat_without_nil = (function logseq$common$util$concat_without_nil(var_args){
var args__5732__auto__ = [];
var len__5726__auto___52350 = arguments.length;
var i__5727__auto___52351 = (0);
while(true){
if((i__5727__auto___52351 < len__5726__auto___52350)){
args__5732__auto__.push((arguments[i__5727__auto___52351]));

var G__52353 = (i__5727__auto___52351 + (1));
i__5727__auto___52351 = G__52353;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return logseq.common.util.concat_without_nil.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(logseq.common.util.concat_without_nil.cljs$core$IFn$_invoke$arity$variadic = (function (cols){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,cols));
}));

(logseq.common.util.concat_without_nil.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(logseq.common.util.concat_without_nil.cljs$lang$applyTo = (function (seq52078){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq52078));
}));

/**
 * Current time in milliseconds
 */
logseq.common.util.time_ms = (function logseq$common$util$time_ms(){
return cljs_time.coerce.to_long(cljs_time.core.now());
});
logseq.common.util.get_page_title = (function logseq$common$util$get_page_title(page){
var or__5002__auto__ = new cljs.core.Keyword("block","title","block/title",710445684).cljs$core$IFn$_invoke$arity$1(page);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("block","name","block/name",1619760316).cljs$core$IFn$_invoke$arity$1(page);
}
});
/**
 * Replace all `strings/join` used to construct paths with this function to reduce lint output.
 *   https://github.com/logseq/logseq/pull/8679
 */
logseq.common.util.string_join_path = (function logseq$common$util$string_join_path(parts){
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("/",parts);
});
logseq.common.util.escape_chars = "\\[]{}().+*?|$^";
/**
 * Escapes characters in string `old-value
 */
logseq.common.util.escape_regex_chars = (function logseq$common$util$escape_regex_chars(old_value){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (acc,escape_char){
return clojure.string.replace(acc,escape_char,["\\",cljs.core.str.cljs$core$IFn$_invoke$arity$1(escape_char)].join(''));
}),old_value,logseq.common.util.escape_chars);
});
logseq.common.util.replace_ignore_case = (function logseq$common$util$replace_ignore_case(s,old_value,new_value){
return clojure.string.replace(s,cljs.core.re_pattern(["(?i)",cljs.core.str.cljs$core$IFn$_invoke$arity$1(logseq.common.util.escape_regex_chars(old_value))].join('')),new_value);
});
logseq.common.util.replace_first_ignore_case = (function logseq$common$util$replace_first_ignore_case(s,old_value,new_value){
return clojure.string.replace_first(s,cljs.core.re_pattern(["(?i)",cljs.core.str.cljs$core$IFn$_invoke$arity$1(logseq.common.util.escape_regex_chars(old_value))].join('')),new_value);
});
/**
 * Sort the elements in the collection based on dependencies.
 * coll:  [{:id 1 :depend-on 2} {:id 2 :depend-on 3} {:id 3}]
 * get-elem-id-fn: :id
 * get-elem-dep-id-fn :depend-on
 * return: [{:id 3} {:id 2 :depend-on 3} {:id 1 :depend-on 2}]
 */
logseq.common.util.sort_coll_by_dependency = (function logseq$common$util$sort_coll_by_dependency(get_elem_id_fn,get_elem_dep_id_fn,coll){
var id__GT_elem = cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$1(cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(get_elem_id_fn,cljs.core.identity)),coll);
var id__GT_dep_id = cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,cljs.core.keep.cljs$core$IFn$_invoke$arity$1(cljs.core.juxt.cljs$core$IFn$_invoke$arity$2(get_elem_id_fn,get_elem_dep_id_fn)),coll);
var all_ids = cljs.core.set(cljs.core.keys(id__GT_dep_id));
var seen_ids = cljs.core.volatile_BANG_(cljs.core.PersistentHashSet.EMPTY);
var sorted_ids = (function (){var r = cljs.core.PersistentVector.EMPTY;
var rest_ids = all_ids;
var id = cljs.core.first(rest_ids);
while(true){
if(cljs.core.not(id)){
return r;
} else {
var temp__5802__auto__ = (id__GT_dep_id.cljs$core$IFn$_invoke$arity$1 ? id__GT_dep_id.cljs$core$IFn$_invoke$arity$1(id) : id__GT_dep_id.call(null,id));
if(cljs.core.truth_(temp__5802__auto__)){
var dep_id = temp__5802__auto__;
var next_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(rest_ids,dep_id);
if(cljs.core.truth_((function (){var and__5000__auto__ = next_id;
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.contains_QMARK_(cljs.core.deref(seen_ids),next_id)));
} else {
return and__5000__auto__;
}
})())){
seen_ids.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(seen_ids.cljs$core$IDeref$_deref$arity$1(null),next_id));

var G__52404 = r;
var G__52405 = rest_ids;
var G__52406 = next_id;
r = G__52404;
rest_ids = G__52405;
id = G__52406;
continue;
} else {
var rest_ids_STAR_ = cljs.core.disj.cljs$core$IFn$_invoke$arity$2(rest_ids,id);
cljs.core.vreset_BANG_(seen_ids,cljs.core.PersistentHashSet.EMPTY);

var G__52407 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(r,id);
var G__52408 = rest_ids_STAR_;
var G__52409 = cljs.core.first(rest_ids_STAR_);
r = G__52407;
rest_ids = G__52408;
id = G__52409;
continue;
}
} else {
var rest_ids_STAR_ = cljs.core.disj.cljs$core$IFn$_invoke$arity$2(rest_ids,id);
cljs.core.vreset_BANG_(seen_ids,cljs.core.PersistentHashSet.EMPTY);

var G__52410 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(r,id);
var G__52411 = rest_ids_STAR_;
var G__52412 = cljs.core.first(rest_ids_STAR_);
r = G__52410;
rest_ids = G__52411;
id = G__52412;
continue;
}
}
break;
}
})();
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(id__GT_elem,sorted_ids);
});
if((typeof logseq !== 'undefined') && (typeof logseq.common !== 'undefined') && (typeof logseq.common.util !== 'undefined') && (typeof logseq.common.util.markdown_heading_pattern !== 'undefined')){
} else {
logseq.common.util.markdown_heading_pattern = /^#+\s+/;
}
logseq.common.util.clear_markdown_heading = (function logseq$common$util$clear_markdown_heading(content){
if(typeof content === 'string'){
} else {
throw (new Error("Assert failed: (string? content)"));
}

return clojure.string.replace_first(content,logseq.common.util.markdown_heading_pattern,"");
});
/**
 * Adds updated-at timestamp and created-at if it doesn't exist
 */
logseq.common.util.block_with_timestamps = (function logseq$common$util$block_with_timestamps(block){
var updated_at = logseq.common.util.time_ms();
var block__$1 = (function (){var G__52126 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(block,new cljs.core.Keyword("block","updated-at","block/updated-at",-1516550551),updated_at);
if((new cljs.core.Keyword("block","created-at","block/created-at",1440015).cljs$core$IFn$_invoke$arity$1(block) == null)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__52126,new cljs.core.Keyword("block","created-at","block/created-at",1440015),updated_at);
} else {
return G__52126;
}
})();
return block__$1;
});
logseq.common.util.get_timestamp = (function logseq$common$util$get_timestamp(value){
var now = cljs_time.core.now();
var f = cljs_time.core.minus;
if(typeof value === 'string'){
var G__52148 = value;
switch (G__52148) {
case "1 day ago":
return cljs_time.coerce.to_long((function (){var G__52149 = now;
var G__52151 = cljs_time.core.days.cljs$core$IFn$_invoke$arity$1((1));
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__52149,G__52151) : f.call(null,G__52149,G__52151));
})());

break;
case "3 days ago":
return cljs_time.coerce.to_long((function (){var G__52152 = now;
var G__52153 = cljs_time.core.days.cljs$core$IFn$_invoke$arity$1((3));
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__52152,G__52153) : f.call(null,G__52152,G__52153));
})());

break;
case "1 week ago":
return cljs_time.coerce.to_long((function (){var G__52154 = now;
var G__52155 = cljs_time.core.weeks.cljs$core$IFn$_invoke$arity$1((1));
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__52154,G__52155) : f.call(null,G__52154,G__52155));
})());

break;
case "1 month ago":
return cljs_time.coerce.to_long((function (){var G__52158 = now;
var G__52159 = cljs_time.core.months.cljs$core$IFn$_invoke$arity$1((1));
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__52158,G__52159) : f.call(null,G__52158,G__52159));
})());

break;
case "3 months ago":
return cljs_time.coerce.to_long((function (){var G__52160 = now;
var G__52161 = cljs_time.core.months.cljs$core$IFn$_invoke$arity$1((3));
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__52160,G__52161) : f.call(null,G__52160,G__52161));
})());

break;
case "1 year ago":
return cljs_time.coerce.to_long((function (){var G__52162 = now;
var G__52163 = cljs_time.core.years.cljs$core$IFn$_invoke$arity$1((1));
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__52162,G__52163) : f.call(null,G__52162,G__52163));
})());

break;
default:
return null;

}
} else {
return cljs_time.coerce.to_long(cljs_time.coerce.to_date(value));
}
});
logseq.common.util.keyword__GT_string = (function logseq$common$util$keyword__GT_string(x){
if((x instanceof cljs.core.Keyword)){
var temp__5802__auto__ = cljs.core.namespace(x);
if(cljs.core.truth_(temp__5802__auto__)){
var nn = temp__5802__auto__;
return [nn,"/",cljs.core.name(x)].join('');
} else {
return cljs.core.name(x);
}
} else {
return x;
}
});
logseq.common.util.by_sorting = (function logseq$common$util$by_sorting(sorting){
var get_value_PLUS_cmp = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__52180){
var map__52181 = p__52180;
var map__52181__$1 = cljs.core.__destructure_map(map__52181);
var get_value = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__52181__$1,new cljs.core.Keyword(null,"get-value","get-value",2108514284));
var asc_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__52181__$1,new cljs.core.Keyword(null,"asc?","asc?",891093427));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [get_value,(cljs.core.truth_(asc_QMARK_)?cljs.core.compare:(function (p1__52168_SHARP_,p2__52167_SHARP_){
return cljs.core.compare(p2__52167_SHARP_,p1__52168_SHARP_);
}))], null);
}),sorting);
return (function (a,b){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (order,p__52182){
var vec__52183 = p__52182;
var get_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__52183,(0),null);
var cmp = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__52183,(1),null);
if((order === (0))){
var G__52186 = (get_value.cljs$core$IFn$_invoke$arity$1 ? get_value.cljs$core$IFn$_invoke$arity$1(a) : get_value.call(null,a));
var G__52187 = (get_value.cljs$core$IFn$_invoke$arity$1 ? get_value.cljs$core$IFn$_invoke$arity$1(b) : get_value.call(null,b));
return (cmp.cljs$core$IFn$_invoke$arity$2 ? cmp.cljs$core$IFn$_invoke$arity$2(G__52186,G__52187) : cmp.call(null,G__52186,G__52187));
} else {
return cljs.core.reduced(order);
}
}),(0),get_value_PLUS_cmp);
});
});

//# sourceMappingURL=logseq.common.util.js.map
