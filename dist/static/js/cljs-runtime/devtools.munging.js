goog.provide('devtools.munging');
goog.scope(function(){
  devtools.munging.goog$module$goog$object = goog.module.get('goog.object');
});
devtools.munging.dollar_replacement = "~\uFE69~";
devtools.munging.max_fixed_arity_to_scan = (64);
devtools.munging.get_global_scope = (function devtools$munging$get_global_scope(){
return devtools.context.get_root.call(null);
});
devtools.munging.js_reserved_QMARK_ = (function devtools$munging$js_reserved_QMARK_(x){
var temp__5802__auto__ = (function (){var temp__5802__auto__ = (devtools.munging.get_global_scope.call(null)["cljs"]);
if(cljs.core.truth_(temp__5802__auto__)){
var o32554 = temp__5802__auto__;
var temp__5802__auto____$1 = (o32554["core"]);
if(cljs.core.truth_(temp__5802__auto____$1)){
var o32555 = temp__5802__auto____$1;
return (o32555["js_reserved_QMARK_"]);
} else {
return null;
}
} else {
return null;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var js_reserved_fn = temp__5802__auto__;
return (js_reserved_fn.cljs$core$IFn$_invoke$arity$1 ? js_reserved_fn.cljs$core$IFn$_invoke$arity$1(x) : js_reserved_fn.call(null,x));
} else {
return null;
}
});
devtools.munging.get_fn_source_safely = (function devtools$munging$get_fn_source_safely(f){
try{if(cljs.core.truth_("toString" in f)){
var o__32287__auto__ = f;
return (o__32287__auto__["toString"]).call(o__32287__auto__);
} else {
return "";
}
}catch (e32565){var _ = e32565;
return "";
}});
devtools.munging.get_fn_fixed_arity = (function devtools$munging$get_fn_fixed_arity(f,n){
return (f[["cljs$core$IFn$_invoke$arity$",cljs.core.str.cljs$core$IFn$_invoke$arity$1(n)].join('')]);
});
devtools.munging.get_fn_variadic_arity = (function devtools$munging$get_fn_variadic_arity(f){
return (f["cljs$core$IFn$_invoke$arity$variadic"]);
});
devtools.munging.get_fn_max_fixed_arity = (function devtools$munging$get_fn_max_fixed_arity(f){
return (f["cljs$lang$maxFixedArity"]);
});
devtools.munging.get_type_name = (function devtools$munging$get_type_name(t){
var sb = (new goog.string.StringBuffer());
var writer = (new cljs.core.StringBufferWriter(sb));
try{var o__32287__auto___33090 = t;
(o__32287__auto___33090["cljs$lang$ctorPrWriter"]).call(o__32287__auto___33090,t,writer);
}catch (e32586){var __33092 = e32586;
}
writer.cljs$core$IWriter$_flush$arity$1(null);

return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb);
});
/**
 * Given a character with a single digit converts it into a subscript character.
 *   Zero character maps to unicode 'SUBSCRIPT ZERO' (U+2080).
 */
devtools.munging.char_to_subscript = (function devtools$munging$char_to_subscript(char$){
if(typeof char$ === 'string'){
} else {
throw (new Error("Assert failed: (string? char)"));
}

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(char$),(1))){
} else {
throw (new Error("Assert failed: (= (count char) 1)"));
}

var char_code = (function (){var o__32287__auto__ = (new String(char$));
return (o__32287__auto__["charCodeAt"]).call(o__32287__auto__,(0));
})();
var num_code = (char_code - (48));
var subscript_code = ((8320) + num_code);
var o__32287__auto__ = String;
return (o__32287__auto__["fromCharCode"]).call(o__32287__auto__,subscript_code);
});
/**
 * Given a subscript number converts it into a string representation consisting of unicode subscript characters (digits).
 */
devtools.munging.make_subscript = (function devtools$munging$make_subscript(subscript){
if(typeof subscript === 'number'){
} else {
throw (new Error("Assert failed: (number? subscript)"));
}

return clojure.string.join.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(devtools.munging.char_to_subscript,cljs.core.str.cljs$core$IFn$_invoke$arity$1(subscript)));
});
/**
 * Given a character with a single digit converts it into a superscript character.
 *   Zero character maps to unicode 'SUPERSCRIPT ZERO' (U+2070).
 */
devtools.munging.char_to_superscript = (function devtools$munging$char_to_superscript(char$){
if(typeof char$ === 'string'){
} else {
throw (new Error("Assert failed: (string? char)"));
}

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.count(char$),(1))){
} else {
throw (new Error("Assert failed: (= (count char) 1)"));
}

var char_code = (function (){var o__32287__auto__ = (new String(char$));
return (o__32287__auto__["charCodeAt"]).call(o__32287__auto__,(0));
})();
var num_code = (char_code - (48));
var superscript_code = (function (){var G__32626 = num_code;
switch (G__32626) {
case (1):
return (185);

break;
case (2):
return (178);

break;
case (3):
return (179);

break;
default:
return ((8304) + num_code);

}
})();
var o__32287__auto__ = String;
return (o__32287__auto__["fromCharCode"]).call(o__32287__auto__,superscript_code);
});
/**
 * Given a superscript number converts it into a string representation consisting of unicode superscript characters (digits).
 */
devtools.munging.make_superscript = (function devtools$munging$make_superscript(superscript){
if(typeof superscript === 'number'){
} else {
throw (new Error("Assert failed: (number? superscript)"));
}

return clojure.string.join.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(devtools.munging.char_to_superscript,cljs.core.str.cljs$core$IFn$_invoke$arity$1(superscript)));
});
/**
 * Given a Javascript name answers if the name was likely generated by ClojureScript.
 *   We use a simple heuristic here:
 *  The name must contain at least two separate dollars because we assume two-segment namespaces.
 */
devtools.munging.cljs_fn_name_QMARK_ = (function devtools$munging$cljs_fn_name_QMARK_(munged_name){
if(typeof munged_name === 'string'){
return (!((cljs.core.re_matches(/^[^$]*\$[^$]+\$.*$/,munged_name) == null)));
} else {
return null;
}
});
/**
 * Given a function source code parses out [name args]. Note that both strings are still munged.
 *   Suitable for further processing.
 * 
 *   For example for input below the function will return ["devtools_sample$core$hello" "name, unused_param"]:
 * 
 *   function devtools_sample$core$hello(name, unused_param){
 *  return [cljs.core.str("hello, "),cljs.core.str(name),cljs.core.str("!")].join('');
 *   }
 *   
 */
devtools.munging.parse_fn_source = (function devtools$munging$parse_fn_source(fn_source){
var temp__5802__auto__ = cljs.core.second(cljs.core.re_find(/function\s(.*?)\{/,fn_source));
if(cljs.core.truth_(temp__5802__auto__)){
var meat = temp__5802__auto__;
var temp__5802__auto____$1 = cljs.core.re_find(/(.*?)\((.*)\)/,meat);
if(cljs.core.truth_(temp__5802__auto____$1)){
var match = temp__5802__auto____$1;
return cljs.core.rest(match);
} else {
return null;
}
} else {
return null;
}
});
devtools.munging.trivial_fn_source_QMARK_ = (function devtools$munging$trivial_fn_source_QMARK_(fn_source){
if(typeof fn_source === 'string'){
} else {
throw (new Error("Assert failed: (string? fn-source)"));
}

return (((!((cljs.core.re_matches(/function\s*\(\s*\)\s*\{\s*\}\s*/,fn_source) == null)))) || ((((!((cljs.core.re_matches(/function.*\(\)\s*\{\s*\[native code\]\s*\}\s*/,fn_source) == null)))) || ((!((cljs.core.re_matches(/function anonymous\(\s*\)\s*\{\s*\}/,fn_source) == null)))))));
});
/**
 * Given a Javascript function object returns true if the function looks like a ClojureScript function.
 * 
 *   Uses various heuristics:
 *  1. must be fn? (is javascript function or satisfies Fn and IFn protocols)
 *  2. and name must be cljs-fn-name? (name can come from f.name or parsed out of function source)
 *  3. or if anonymous function, must be non-trivial
 */
devtools.munging.cljs_fn_QMARK_ = (function devtools$munging$cljs_fn_QMARK_(f){
if(cljs.core.truth_((function (){try{return cljs.core.fn_QMARK_(f);
}catch (e32723){var _e__32318__auto__ = e32723;
return false;
}})())){
var name = (f[cljs.core.name]);
if((!(cljs.core.empty_QMARK_(name)))){
return devtools.munging.cljs_fn_name_QMARK_(name);
} else {
var fn_source = devtools.munging.get_fn_source_safely(f);
var vec__32724 = devtools.munging.parse_fn_source(fn_source);
var name__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32724,(0),null);
if((!(cljs.core.empty_QMARK_(name__$1)))){
return devtools.munging.cljs_fn_name_QMARK_(name__$1);
} else {
return (!(devtools.munging.trivial_fn_source_QMARK_(fn_source)));
}
}
} else {
return null;
}
});
/**
 * Standard cljs.core/demunge is too aggressive in replacing dollars.
 *   This wrapper function works around it by leaving dollars intact.
 */
devtools.munging.dollar_preserving_demunge = (function devtools$munging$dollar_preserving_demunge(munged_name){
return clojure.string.replace(cljs.core.demunge(clojure.string.replace(munged_name,"$",devtools.munging.dollar_replacement)),devtools.munging.dollar_replacement,"$");
});
devtools.munging.revert_reserved = (function devtools$munging$revert_reserved(s){
var or__5002__auto__ = (function (){var temp__5802__auto__ = cljs.core.re_matches(/(.*)\$/,s);
if(cljs.core.truth_(temp__5802__auto__)){
var m = temp__5802__auto__;
if(cljs.core.truth_(devtools.munging.js_reserved_QMARK_(cljs.core.second(m)))){
return cljs.core.second(m);
} else {
return null;
}
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return s;
}
});
devtools.munging.reserved_aware_demunge = (function devtools$munging$reserved_aware_demunge(munged_name){
return devtools.munging.revert_reserved(devtools.munging.dollar_preserving_demunge(munged_name));
});
devtools.munging.proper_demunge = (function devtools$munging$proper_demunge(munged_name){
return devtools.munging.reserved_aware_demunge(munged_name);
});
devtools.munging.proper_arg_demunge = (function devtools$munging$proper_arg_demunge(munged_arg_name){
return clojure.string.replace(devtools.munging.proper_demunge(munged_arg_name),/^-(.*)$/,"_$1");
});
devtools.munging.proper_ns_demunge = (function devtools$munging$proper_ns_demunge(munged_ns_name){
return clojure.string.replace(devtools.munging.proper_demunge(munged_ns_name),"$",".");
});
devtools.munging.ns_exists_QMARK_ = (function devtools$munging$ns_exists_QMARK_(ns_module_name){
if(typeof ns_module_name === 'string'){
} else {
throw (new Error("Assert failed: (string? ns-module-name)"));
}

var temp__5806__auto__ = devtools.munging.goog$module$goog$object.getValueByKeys(devtools.munging.get_global_scope.call(null),ns_module_name.split("."));
if((temp__5806__auto__ == null)){
return null;
} else {
var ns_obj = temp__5806__auto__;
return cljs.core.object_QMARK_(ns_obj);
}
});
/**
 * Given a name broken into namespace parts returns [detected-ns remaining-parts],
 *   where detected-ns is a string representing longest detected existing namespace and
 *   remaining-parts is a vector of remaining input parts not included in the detected-ns concatenation.
 * 
 *   For given input ["cljs" "core" "first"] returns ["cljs.core" ["first"]] (assuming cljs.core exists)
 */
devtools.munging.detect_namespace_prefix = (function devtools$munging$detect_namespace_prefix(var_args){
var args__5732__auto__ = [];
var len__5726__auto___33154 = arguments.length;
var i__5727__auto___33156 = (0);
while(true){
if((i__5727__auto___33156 < len__5726__auto___33154)){
args__5732__auto__.push((arguments[i__5727__auto___33156]));

var G__33157 = (i__5727__auto___33156 + (1));
i__5727__auto___33156 = G__33157;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return devtools.munging.detect_namespace_prefix.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(devtools.munging.detect_namespace_prefix.cljs$core$IFn$_invoke$arity$variadic = (function (tokens,p__32775){
var vec__32776 = p__32775;
var ns_detector = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32776,(0),null);
var effective_detector = (function (){var or__5002__auto__ = ns_detector;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return devtools.munging.ns_exists_QMARK_;
}
})();
var name_tokens = cljs.core.PersistentVector.EMPTY;
var remaining_tokens = tokens;
while(true){
if(cljs.core.empty_QMARK_(remaining_tokens)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["",name_tokens], null);
} else {
var ns_name = clojure.string.join.cljs$core$IFn$_invoke$arity$2(".",remaining_tokens);
if(cljs.core.truth_((effective_detector.cljs$core$IFn$_invoke$arity$1 ? effective_detector.cljs$core$IFn$_invoke$arity$1(ns_name) : effective_detector.call(null,ns_name)))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [ns_name,name_tokens], null);
} else {
var G__33160 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.last(remaining_tokens)], null),name_tokens);
var G__33161 = cljs.core.butlast(remaining_tokens);
name_tokens = G__33160;
remaining_tokens = G__33161;
continue;
}
}
break;
}
}));

(devtools.munging.detect_namespace_prefix.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(devtools.munging.detect_namespace_prefix.cljs$lang$applyTo = (function (seq32767){
var G__32768 = cljs.core.first(seq32767);
var seq32767__$1 = cljs.core.next(seq32767);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__32768,seq32767__$1);
}));

devtools.munging.normalize_arity = (function devtools$munging$normalize_arity(arity_tokens){
if((!(cljs.core.empty_QMARK_(arity_tokens)))){
var arity = cljs.core.first(arity_tokens);
var G__32787 = arity;
switch (G__32787) {
case "variadic":
return arity;

break;
default:
return parseInt(arity,(10));

}
} else {
return null;
}
});
devtools.munging.strip_arity = (function devtools$munging$strip_arity(tokens){
var vec__32800 = cljs.core.split_with((function (p1__32795_SHARP_){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(p1__32795_SHARP_,"arity");
}),tokens);
var prefix_tokens = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32800,(0),null);
var arity_tokens = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32800,(1),null);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [prefix_tokens,devtools.munging.normalize_arity(cljs.core.rest(arity_tokens))], null);
});
devtools.munging.parse_protocol = (function devtools$munging$parse_protocol(tokens,detector){
var remaining_tokens = tokens;
var name_tokens = cljs.core.PersistentVector.EMPTY;
while(true){
if(cljs.core.empty_QMARK_(remaining_tokens)){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [name_tokens], null);
} else {
var vec__32818 = devtools.munging.detect_namespace_prefix.cljs$core$IFn$_invoke$arity$variadic(remaining_tokens,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([detector], 0));
var protocol_ns = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32818,(0),null);
var name_and_method_tokens = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32818,(1),null);
if(cljs.core.empty_QMARK_(protocol_ns)){
var G__33170 = cljs.core.rest(remaining_tokens);
var G__33171 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(name_tokens,cljs.core.first(remaining_tokens));
remaining_tokens = G__33170;
name_tokens = G__33171;
continue;
} else {
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [name_tokens,protocol_ns,cljs.core.first(name_and_method_tokens),cljs.core.rest(name_and_method_tokens)], null);
}
}
break;
}
});
/**
 * Given a munged-name from Javascript lands attempts to break it into:
 *   [fn-ns fn-name protocol-ns protocol-name protocol-method arity].
 * 
 *   Protocol and arity elements are optional. Function elements are always present or "".
 * 
 *   examples for input:
 *  cljs$core$rest => ['cljs.core', 'rest']
 *  cljs.core.reduce$cljs$core$IFn$_invoke$arity$3 => ['cljs.core' 'reduce' 'cljs.core' 'IFn' '_invoke' 3]
 */
devtools.munging.break_munged_name = (function devtools$munging$break_munged_name(var_args){
var G__32840 = arguments.length;
switch (G__32840) {
case 1:
return devtools.munging.break_munged_name.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return devtools.munging.break_munged_name.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(devtools.munging.break_munged_name.cljs$core$IFn$_invoke$arity$1 = (function (munged_name){
return devtools.munging.break_munged_name.cljs$core$IFn$_invoke$arity$2(munged_name,null);
}));

(devtools.munging.break_munged_name.cljs$core$IFn$_invoke$arity$2 = (function (munged_name,ns_detector){
if(cljs.core.empty_QMARK_(munged_name)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["",""], null);
} else {
var effective_detector = (function (){var or__5002__auto__ = ns_detector;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return devtools.munging.ns_exists_QMARK_;
}
})();
var tokens = cljs.core.vec(munged_name.split(/[$.]/));
var vec__32857 = devtools.munging.strip_arity(tokens);
var tokens__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32857,(0),null);
var arity = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32857,(1),null);
var vec__32860 = devtools.munging.detect_namespace_prefix.cljs$core$IFn$_invoke$arity$variadic(tokens__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([effective_detector], 0));
var fn_ns = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32860,(0),null);
var tokens__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32860,(1),null);
var vec__32863 = devtools.munging.parse_protocol(tokens__$2,effective_detector);
var fn_name_tokens = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32863,(0),null);
var protocol_ns = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32863,(1),null);
var protocol_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32863,(2),null);
var protocol_method_tokens = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32863,(3),null);
var fn_name = clojure.string.join.cljs$core$IFn$_invoke$arity$2("$",fn_name_tokens);
var protocol_method = (cljs.core.truth_(protocol_method_tokens)?clojure.string.join.cljs$core$IFn$_invoke$arity$2("$",protocol_method_tokens):null);
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [fn_ns,fn_name,protocol_ns,protocol_name,protocol_method,arity], null);
}
}));

(devtools.munging.break_munged_name.cljs$lang$maxFixedArity = 2);

/**
 * Given a munged-name from Javascript lands attempts to break it into a namespace part and remaining short name.
 *   Then applies appropriate demunging on them and returns ClojureScript versions of the names.
 */
devtools.munging.break_and_demunge_name = (function devtools$munging$break_and_demunge_name(var_args){
var G__32877 = arguments.length;
switch (G__32877) {
case 1:
return devtools.munging.break_and_demunge_name.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return devtools.munging.break_and_demunge_name.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(devtools.munging.break_and_demunge_name.cljs$core$IFn$_invoke$arity$1 = (function (munged_name){
return devtools.munging.break_and_demunge_name.cljs$core$IFn$_invoke$arity$2(munged_name,null);
}));

(devtools.munging.break_and_demunge_name.cljs$core$IFn$_invoke$arity$2 = (function (munged_name,ns_detector){
var result = devtools.munging.break_munged_name.cljs$core$IFn$_invoke$arity$2(munged_name,ns_detector);
var vec__32881 = result;
var munged_ns = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32881,(0),null);
var munged_name__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32881,(1),null);
var munged_protocol_ns = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32881,(2),null);
var munged_protocol_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32881,(3),null);
var munged_protocol_method = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32881,(4),null);
var arity = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32881,(5),null);
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [devtools.munging.proper_ns_demunge(munged_ns),devtools.munging.proper_demunge(munged_name__$1),(cljs.core.truth_(munged_protocol_ns)?devtools.munging.proper_ns_demunge(munged_protocol_ns):null),(cljs.core.truth_(munged_protocol_name)?devtools.munging.proper_demunge(munged_protocol_name):null),(cljs.core.truth_(munged_protocol_method)?devtools.munging.proper_demunge(munged_protocol_method):null),arity], null);
}));

(devtools.munging.break_and_demunge_name.cljs$lang$maxFixedArity = 2);

/**
 * Given function source code tries to retrieve [ns name & args] on best effort basis, where
 *   ns is demunged namespace part of the function name (or "" if namespace cannot be detected)
 *   name is demunged short name (or "" if function is anonymous or name cannot be retrieved)
 *   args is optional number of demunged argument names.
 * 
 *   Please note that this function always returns a vector with something. In worst cases ["" ""].
 *   
 */
devtools.munging.parse_fn_source_info = (function devtools$munging$parse_fn_source_info(fn_source){
var temp__5802__auto__ = devtools.munging.parse_fn_source(fn_source);
if(cljs.core.truth_(temp__5802__auto__)){
var vec__32889 = temp__5802__auto__;
var munged_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32889,(0),null);
var args = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32889,(1),null);
var vec__32892 = devtools.munging.break_and_demunge_name.cljs$core$IFn$_invoke$arity$1(munged_name);
var ns = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32892,(0),null);
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32892,(1),null);
var demunged_args = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(devtools.munging.proper_arg_demunge,clojure.string.trim),clojure.string.split.cljs$core$IFn$_invoke$arity$2(args,/,/));
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [ns,name], null),demunged_args);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["",""], null);
}
});
/**
 * Given Javascript function object tries to retrieve [ns name & args] as in parse-fn-source-info (on best effort basis).
 */
devtools.munging.parse_fn_info = (function devtools$munging$parse_fn_info(f){
var fn_source = devtools.munging.get_fn_source_safely(f);
return devtools.munging.parse_fn_source_info(fn_source);
});
/**
 * Given a Javascript function object tries to retrieve [ns name & args] as in parse-fn-info (on best effort basis).
 * 
 *   The difference from parse-fn-info is that this function prefers to read args from arities if available.
 *   It recurse arbitrary deep following IFn protocol leads.
 * 
 *   If we hit multi-arity situation in leaf, we don't attempt to list arguments and return ::multi-arity placeholder instead.
 * 
 *   The reason for reading arities is that it gives more accurate parameter names in some cases.
 *   We observed that variadic functions don't always contain original parameter names, but individual IFn arity functions do.
 */
devtools.munging.parse_fn_info_deep = (function devtools$munging$parse_fn_info_deep(f){
var fn_info = devtools.munging.parse_fn_info(f);
var arities = (devtools.munging.collect_fn_arities.cljs$core$IFn$_invoke$arity$1 ? devtools.munging.collect_fn_arities.cljs$core$IFn$_invoke$arity$1(f) : devtools.munging.collect_fn_arities.call(null,f));
if((!((arities == null)))){
if((cljs.core.count(arities) > (1))){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.take.cljs$core$IFn$_invoke$arity$2((2),fn_info),new cljs.core.Keyword("devtools.munging","multi-arity","devtools.munging/multi-arity",-2011705837));
} else {
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.take.cljs$core$IFn$_invoke$arity$2((2),fn_info),cljs.core.drop.cljs$core$IFn$_invoke$arity$2((2),(function (){var G__32903 = cljs.core.second(cljs.core.first(arities));
return (devtools.munging.parse_fn_info_deep.cljs$core$IFn$_invoke$arity$1 ? devtools.munging.parse_fn_info_deep.cljs$core$IFn$_invoke$arity$1(G__32903) : devtools.munging.parse_fn_info_deep.call(null,G__32903));
})()));
}
} else {
return fn_info;
}
});
/**
 * Given a demunged ClojureScript parameter name. Tries to detect human readable part and returns the index where it ends.
 *   Returns nil if no prefix can be detected.
 * 
 *   The idea is to convert macro-generated parameters and other generated names to more friendly names.
 *   We observed that param names generated by gensym have prefix followed by big numbers.
 *   Other generated names contain two dashes after prefix (originally probably using underscores).
 */
devtools.munging.find_index_of_human_prefix = (function devtools$munging$find_index_of_human_prefix(name){
var sep_start = name.indexOf("--");
var num_prefix = cljs.core.count(cljs.core.second(cljs.core.re_find(/(.*?)\d{2,}/,name)));
var finds = cljs.core.filter.cljs$core$IFn$_invoke$arity$2(cljs.core.pos_QMARK_,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [sep_start,num_prefix], null));
if((!(cljs.core.empty_QMARK_(finds)))){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.min,finds);
} else {
return null;
}
});
/**
 * Given a name and intermediate state. Convert name to a human readable version by keeping human readable prefix with
 *   optional subscript postfix and store it in ::result. Subscript number is picked based on state. State keeps track of
 *   previously assigned subscripts. Returns a new state.
 */
devtools.munging.humanize_name = (function devtools$munging$humanize_name(state,name){
var index = devtools.munging.find_index_of_human_prefix(name);
var prefix = (((index > (0)))?name.substring((0),index):name);
var temp__5802__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,prefix);
if(cljs.core.truth_(temp__5802__auto__)){
var subscript = temp__5802__auto__;
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$4(state,new cljs.core.Keyword("devtools.munging","result","devtools.munging/result",1642759166),cljs.core.conj,[cljs.core.str.cljs$core$IFn$_invoke$arity$1(prefix),devtools.munging.make_subscript(subscript)].join('')),prefix,cljs.core.inc);
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$4(state,new cljs.core.Keyword("devtools.munging","result","devtools.munging/result",1642759166),cljs.core.conj,prefix),prefix,(2));
}
});
/**
 * Given a list of names, returns a list of human-readable versions of those names.
 *   It detects human-readable prefix using a simple heuristics. When names repeat it assigns simple subscripts starting with 2.
 *   Subscripts are assigned left-to-right.
 * 
 *   Given ["p--a" "p--b" "x" "p--c"] returns ["p" "p₂" "x" "p₃"]
 */
devtools.munging.humanize_names = (function devtools$munging$humanize_names(names){
return cljs.core.with_meta(new cljs.core.Keyword("devtools.munging","result","devtools.munging/result",1642759166).cljs$core$IFn$_invoke$arity$1(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(devtools.munging.humanize_name,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("devtools.munging","result","devtools.munging/result",1642759166),cljs.core.PersistentVector.EMPTY], null),names)),cljs.core.meta(names));
});
devtools.munging.collect_fn_fixed_arities = (function devtools$munging$collect_fn_fixed_arities(f,max_arity){
var arity = (0);
var collection = cljs.core.PersistentArrayMap.EMPTY;
while(true){
if((arity > max_arity)){
return collection;
} else {
var G__33180 = (arity + (1));
var G__33181 = (function (){var temp__5802__auto__ = devtools.munging.get_fn_fixed_arity(f,arity);
if(cljs.core.truth_(temp__5802__auto__)){
var arity_fn = temp__5802__auto__;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(collection,arity,arity_fn);
} else {
return collection;
}
})();
arity = G__33180;
collection = G__33181;
continue;
}
break;
}
});
devtools.munging.collect_fn_variadic_arities = (function devtools$munging$collect_fn_variadic_arities(f){
var temp__5802__auto__ = devtools.munging.get_fn_variadic_arity(f);
if(cljs.core.truth_(temp__5802__auto__)){
var variadic_arity = temp__5802__auto__;
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("devtools.munging","variadic","devtools.munging/variadic",1596047908),variadic_arity], null);
} else {
return null;
}
});
devtools.munging.review_arity = (function devtools$munging$review_arity(p__32923){
var vec__32924 = p__32923;
var arity = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32924,(0),null);
var arity_fn = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32924,(1),null);
var sub_arities = (devtools.munging.collect_fn_arities.cljs$core$IFn$_invoke$arity$1 ? devtools.munging.collect_fn_arities.cljs$core$IFn$_invoke$arity$1(arity_fn) : devtools.munging.collect_fn_arities.call(null,arity_fn));
if(cljs.core.truth_(new cljs.core.Keyword("devtools.munging","variadic","devtools.munging/variadic",1596047908).cljs$core$IFn$_invoke$arity$1(sub_arities))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("devtools.munging","variadic","devtools.munging/variadic",1596047908),arity_fn], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [arity,arity_fn], null);
}
});
/**
 * Some arities can be marked as fixed arity but in fact point to a variadic-arity function. We want to detect this case
 *   and turn such improperly categorized arities to ::variadic.
 */
devtools.munging.review_arities = (function devtools$munging$review_arities(arities){
if(cljs.core.truth_(new cljs.core.Keyword("devtools.munging","variadic","devtools.munging/variadic",1596047908).cljs$core$IFn$_invoke$arity$1(arities))){
return arities;
} else {
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2(devtools.munging.review_arity,arities));
}
});
/**
 * Given a Javascript function object, tries to inspect known arity properties generated by ClojureScript compiler and
 *   collects all available arity functions into a map. Arities are keyed by arity count and variadic arity gets ::variadic key.
 */
devtools.munging.collect_fn_arities = (function devtools$munging$collect_fn_arities(f){
var max_fixed_arity = devtools.munging.get_fn_max_fixed_arity(f);
var fixed_arities = devtools.munging.collect_fn_fixed_arities(f,(function (){var or__5002__auto__ = max_fixed_arity;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return devtools.munging.max_fixed_arity_to_scan;
}
})());
var variadic_arities = devtools.munging.collect_fn_variadic_arities(f);
var arities = devtools.munging.review_arities(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([fixed_arities,variadic_arities], 0)));
if((!(cljs.core.empty_QMARK_(arities)))){
return arities;
} else {
return null;
}
});
/**
 * ::variadic goes last, other keywords compare by name.
 */
devtools.munging.arity_keywords_comparator = (function devtools$munging$arity_keywords_comparator(x,y){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("devtools.munging","variadic","devtools.munging/variadic",1596047908),x)){
return (1);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("devtools.munging","variadic","devtools.munging/variadic",1596047908),y)){
return (-1);
} else {
return cljs.core.compare(cljs.core.name(x),cljs.core.name(y));

}
}
});
/**
 * numbers go first (ordered), then keywords (ordered by name), and then ::variadic sticks last
 */
devtools.munging.arities_key_comparator = (function devtools$munging$arities_key_comparator(x,y){
var kx_QMARK_ = (x instanceof cljs.core.Keyword);
var ky_QMARK_ = (y instanceof cljs.core.Keyword);
if(((kx_QMARK_) && (ky_QMARK_))){
return devtools.munging.arity_keywords_comparator(x,y);
} else {
if(kx_QMARK_){
return (1);
} else {
if(ky_QMARK_){
return (-1);
} else {
return cljs.core.compare(x,y);

}
}
}
});
devtools.munging.arities_to_args_lists_STAR_ = (function devtools$munging$arities_to_args_lists_STAR_(arities){
var sorted_keys = cljs.core.sort.cljs$core$IFn$_invoke$arity$2(devtools.munging.arities_key_comparator,cljs.core.keys(arities));
var sorted_fns = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__32950_SHARP_){
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(arities,p1__32950_SHARP_);
}),sorted_keys);
var sorted_infos = cljs.core.map.cljs$core$IFn$_invoke$arity$2(devtools.munging.parse_fn_info_deep,sorted_fns);
var sorted_args_lists = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__32951_SHARP_){
return cljs.core.drop.cljs$core$IFn$_invoke$arity$2((2),p1__32951_SHARP_);
}),sorted_infos);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.last(sorted_keys),new cljs.core.Keyword("devtools.munging","variadic","devtools.munging/variadic",1596047908))){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.butlast(sorted_args_lists),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$4(cljs.core.last(sorted_args_lists),cljs.core.assoc,new cljs.core.Keyword("devtools.munging","variadic","devtools.munging/variadic",1596047908),true)], null));
} else {
return sorted_args_lists;
}
});
/**
 * Given a map of arity functions. Tries to parse individual functions and prepare an arguments list for each arity.
 *   Returned list of arguments list is sorted by arity count, variadic arity goes last if available.
 * 
 *   The function also optionally humanizes argument names in each arguments list if requested.
 */
devtools.munging.arities_to_args_lists = (function devtools$munging$arities_to_args_lists(var_args){
var args__5732__auto__ = [];
var len__5726__auto___33186 = arguments.length;
var i__5727__auto___33187 = (0);
while(true){
if((i__5727__auto___33187 < len__5726__auto___33186)){
args__5732__auto__.push((arguments[i__5727__auto___33187]));

var G__33188 = (i__5727__auto___33187 + (1));
i__5727__auto___33187 = G__33188;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return devtools.munging.arities_to_args_lists.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(devtools.munging.arities_to_args_lists.cljs$core$IFn$_invoke$arity$variadic = (function (arities,p__32967){
var vec__32969 = p__32967;
var humanize_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32969,(0),null);
var args_lists = devtools.munging.arities_to_args_lists_STAR_(arities);
if(cljs.core.truth_(humanize_QMARK_)){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(devtools.munging.humanize_names,args_lists);
} else {
return args_lists;
}
}));

(devtools.munging.arities_to_args_lists.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(devtools.munging.arities_to_args_lists.cljs$lang$applyTo = (function (seq32964){
var G__32965 = cljs.core.first(seq32964);
var seq32964__$1 = cljs.core.next(seq32964);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__32965,seq32964__$1);
}));

/**
 * Converts a list of arguments lists into a list of strings suitable for UI presentation.
 */
devtools.munging.args_lists_to_strings = (function devtools$munging$args_lists_to_strings(args_lists,spacer_symbol,multi_arity_symbol,rest_symbol){
var string_mapper = (function (arg){
var G__32977 = arg;
var G__32977__$1 = (((G__32977 instanceof cljs.core.Keyword))?G__32977.fqn:null);
switch (G__32977__$1) {
case "devtools.munging/multi-arity":
return multi_arity_symbol;

break;
default:
return arg;

}
});
var printer = (function (args_list){
var variadic_QMARK_ = new cljs.core.Keyword("devtools.munging","variadic","devtools.munging/variadic",1596047908).cljs$core$IFn$_invoke$arity$1(cljs.core.meta(args_list));
var args_strings = cljs.core.map.cljs$core$IFn$_invoke$arity$2(string_mapper,args_list);
return [clojure.string.join.cljs$core$IFn$_invoke$arity$2(spacer_symbol,cljs.core.butlast(args_strings)),cljs.core.str.cljs$core$IFn$_invoke$arity$1((cljs.core.truth_(variadic_QMARK_)?rest_symbol:spacer_symbol)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.last(args_strings))].join('');
});
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.trim,cljs.core.map.cljs$core$IFn$_invoke$arity$2(printer,args_lists));
});
devtools.munging.extract_arities = (function devtools$munging$extract_arities(f,humanize_QMARK_,spacer_symbol,multi_arity_symbol,rest_symbol){
return devtools.munging.args_lists_to_strings(devtools.munging.arities_to_args_lists.cljs$core$IFn$_invoke$arity$variadic((function (){var or__5002__auto__ = devtools.munging.collect_fn_arities(f);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"naked","naked",373474222),f], null);
}
})(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([humanize_QMARK_], 0)),spacer_symbol,multi_arity_symbol,rest_symbol);
});
devtools.munging.common_protocol_QMARK_ = (function devtools$munging$common_protocol_QMARK_(protocol_ns,protocol_name){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(protocol_ns,"cljs.core")) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(protocol_name,"IFn")));
});
devtools.munging.present_fn_part = (function devtools$munging$present_fn_part(fn_ns,fn_name,include_ns_QMARK_){
return [(cljs.core.truth_((function (){var and__5000__auto__ = include_ns_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (!(cljs.core.empty_QMARK_(fn_ns)));
} else {
return and__5000__auto__;
}
})())?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_ns),"/"].join(''):null),cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_name)].join('');
});
devtools.munging.present_protocol_part = (function devtools$munging$present_protocol_part(protocol_ns,protocol_name,protocol_method,include_protocol_ns_QMARK_){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1((cljs.core.truth_(include_protocol_ns_QMARK_)?protocol_ns:null)),(((!(cljs.core.empty_QMARK_(protocol_name))))?[(cljs.core.truth_(include_protocol_ns_QMARK_)?".":null),cljs.core.str.cljs$core$IFn$_invoke$arity$1(protocol_name)].join(''):null),(((!(cljs.core.empty_QMARK_(protocol_method))))?[(cljs.core.truth_((function (){var or__5002__auto__ = include_protocol_ns_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (!(cljs.core.empty_QMARK_(protocol_name)));
}
})())?":":null),cljs.core.str.cljs$core$IFn$_invoke$arity$1(protocol_method)].join(''):null)].join('');
});
/**
 * Given javascript function name tries to present it as plain string for display in UI on best effort basis.
 */
devtools.munging.present_function_name = (function devtools$munging$present_function_name(munged_name,options){
var map__32995 = options;
var map__32995__$1 = cljs.core.__destructure_map(map__32995);
var include_ns_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__32995__$1,new cljs.core.Keyword(null,"include-ns?","include-ns?",-341372810));
var include_protocol_ns_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__32995__$1,new cljs.core.Keyword(null,"include-protocol-ns?","include-protocol-ns?",989250951));
var silence_common_protocols_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__32995__$1,new cljs.core.Keyword(null,"silence-common-protocols?","silence-common-protocols?",2012431893));
var ns_detector = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__32995__$1,new cljs.core.Keyword(null,"ns-detector","ns-detector",-2041592760));
var vec__32996 = devtools.munging.break_and_demunge_name.cljs$core$IFn$_invoke$arity$2(munged_name,ns_detector);
var fn_ns = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32996,(0),null);
var fn_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32996,(1),null);
var protocol_ns = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32996,(2),null);
var protocol_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32996,(3),null);
var protocol_method = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32996,(4),null);
var arity = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__32996,(5),null);
var arity_str = (((!((arity == null))))?((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(arity,"variadic"))?"\u207F":devtools.munging.make_superscript(arity)):null);
if(cljs.core.empty_QMARK_(fn_name)){
return munged_name;
} else {
var fn_part = devtools.munging.present_fn_part(fn_ns,fn_name,include_ns_QMARK_);
var protocol_part = (cljs.core.truth_((function (){var and__5000__auto__ = protocol_ns;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not((function (){var and__5000__auto____$1 = silence_common_protocols_QMARK_;
if(cljs.core.truth_(and__5000__auto____$1)){
return devtools.munging.common_protocol_QMARK_(protocol_ns,protocol_name);
} else {
return and__5000__auto____$1;
}
})());
} else {
return and__5000__auto__;
}
})())?devtools.munging.present_protocol_part(protocol_ns,protocol_name,protocol_method,include_protocol_ns_QMARK_):null);
return [(function (){var or__5002__auto__ = protocol_part;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return fn_part;
}
})(),arity_str,(cljs.core.truth_(protocol_part)?[" (",fn_part,")"].join(''):null)].join('');
}
});
devtools.munging.get_basis = (function devtools$munging$get_basis(f){
var o__32287__auto__ = f;
return (o__32287__auto__["getBasis"]).call(o__32287__auto__);
});
/**
 * Given a Javascript constructor function tries to retrieve [ns name basis]. Returns nil if not a cljs type.
 */
devtools.munging.parse_constructor_info = (function devtools$munging$parse_constructor_info(f){
if(cljs.core.truth_((function (){var and__5000__auto__ = goog.isObject(f);
if(cljs.core.truth_(and__5000__auto__)){
return f.cljs$lang$type;
} else {
return and__5000__auto__;
}
})())){
var type_name = devtools.munging.get_type_name(f);
var parts = type_name.split(/\//);
var basis = (function (){try{return devtools.munging.get_basis(f);
}catch (e33006){var _e__32318__auto__ = e33006;
return cljs.core.PersistentVector.EMPTY;
}})();
if((cljs.core.count(parts) <= (2))){
} else {
throw (new Error("Assert failed: (<= (count parts) 2)"));
}

while(true){
if((cljs.core.count(parts) < (2))){
parts.unshift(null);

continue;
} else {
}
break;
}

return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.vec(parts),basis);
} else {
return null;
}
});
devtools.munging.protocol_path = (function devtools$munging$protocol_path(protocol_selector){
return clojure.string.split.cljs$core$IFn$_invoke$arity$2(protocol_selector,/\./);
});
devtools.munging.get_protocol_object = (function devtools$munging$get_protocol_object(protocol_selector){
var obj = devtools.munging.get_global_scope.call(null);
var path = devtools.munging.protocol_path(protocol_selector);
while(true){
if(cljs.core.empty_QMARK_(path)){
return obj;
} else {
if(cljs.core.truth_(goog.isObject(obj))){
var G__33216 = (obj[cljs.core.first(path)]);
var G__33217 = cljs.core.rest(path);
obj = G__33216;
path = G__33217;
continue;
} else {
return null;
}
}
break;
}
});
devtools.munging.protocol_exists_QMARK_ = (function devtools$munging$protocol_exists_QMARK_(protocol_selector){
return (!((devtools.munging.get_protocol_object(protocol_selector) == null)));
});
devtools.munging.get_protocol_selector = (function devtools$munging$get_protocol_selector(key){
var temp__5802__auto__ = cljs.core.re_matches(/(.*)\$$/,key);
if(cljs.core.truth_(temp__5802__auto__)){
var m = temp__5802__auto__;
if((!(clojure.string.includes_QMARK_(key,"cljs$lang$protocol_mask$partition")))){
var protocol_selector = clojure.string.replace(cljs.core.second(m),"$",".");
if(devtools.munging.protocol_exists_QMARK_(protocol_selector)){
return protocol_selector;
} else {
return null;
}
} else {
return null;
}
} else {
return null;
}
});
devtools.munging.demunge_protocol_selector = (function devtools$munging$demunge_protocol_selector(protocol_selector){
var parts = cljs.core.map.cljs$core$IFn$_invoke$arity$2(devtools.munging.proper_demunge,devtools.munging.protocol_path(protocol_selector));
var _ = (((cljs.core.count(parts) >= (2)))?null:(function(){throw (new Error(["Assert failed: ",["expected protocol selector to contain at least one dot: '",cljs.core.str.cljs$core$IFn$_invoke$arity$1(protocol_selector),"'"].join(''),"\n","(>= (count parts) 2)"].join('')))})());
var ns = clojure.string.join.cljs$core$IFn$_invoke$arity$2(".",cljs.core.butlast(parts));
var name = cljs.core.last(parts);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [ns,name,protocol_selector], null);
});
devtools.munging.fast_path_protocols_lookup_table = (new cljs.core.Delay((function (){
return new cljs.core.PersistentArrayMap(null, 2, [(0),cljs.core.PersistentHashMap.fromArrays([(8192),(4096),(524288),(128),(1048576),(1),(32768),(4),(268435456),(512),(33554432),(32),(256),(1024),(134217728),(16777216),(64),(262144),(2),(4194304),(131072),(67108864),(8388608),(16),(2097152),(1073741824),(2147483648),(2048),(8),(65536),(16384)],[new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IStack","cljs.core.IStack"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","ISet","cljs.core.ISet"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IReduce","cljs.core.IReduce"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","INext","cljs.core.INext"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IKVReduce","cljs.core.IKVReduce"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IFn","cljs.core.IFn"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IDeref","cljs.core.IDeref"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IEmptyableCollection","cljs.core.IEmptyableCollection"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","ISorted","cljs.core.ISorted"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IAssociative","cljs.core.IAssociative"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IList","cljs.core.IList"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","ASeq","cljs.core.ASeq"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","ILookup","cljs.core.ILookup"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IMap","cljs.core.IMap"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IReversible","cljs.core.IReversible"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","ISequential","cljs.core.ISequential"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","ISeq","cljs.core.ISeq"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IWithMeta","cljs.core.IWithMeta"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","ICounted","cljs.core.ICounted"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IHash","cljs.core.IHash"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IMeta","cljs.core.IMeta"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IRecord","cljs.core.IRecord"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","ISeqable","cljs.core.ISeqable"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IIndexed","cljs.core.IIndexed"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IEquiv","cljs.core.IEquiv"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IWriter","cljs.core.IWriter"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IPrintWithWriter","cljs.core.IPrintWithWriter"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IMapEntry","cljs.core.IMapEntry"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","ICollection","cljs.core.ICollection"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IDerefWithTimeout","cljs.core.IDerefWithTimeout"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IVector","cljs.core.IVector"], null)]),(1),cljs.core.PersistentHashMap.fromArrays([(8192),(4096),(128),(1),(32768),(4),(512),(32),(256),(1024),(64),(262144),(2),(131072),(16),(2048),(8),(65536),(16384)],[new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","ICloneable","cljs.core.ICloneable"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","INamed","cljs.core.INamed"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","ITransientSet","cljs.core.ITransientSet"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IPending","cljs.core.IPending"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IReset","cljs.core.IReset"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IEditableCollection","cljs.core.IEditableCollection"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IChunkedSeq","cljs.core.IChunkedSeq"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","ITransientMap","cljs.core.ITransientMap"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IMultiFn","cljs.core.IMultiFn"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IChunkedNext","cljs.core.IChunkedNext"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","ITransientVector","cljs.core.ITransientVector"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IDrop","cljs.core.IDrop"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IWatchable","cljs.core.IWatchable"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IIterable","cljs.core.IIterable"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","ITransientAssociative","cljs.core.ITransientAssociative"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IComparable","cljs.core.IComparable"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","ITransientCollection","cljs.core.ITransientCollection"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","ISwap","cljs.core.ISwap"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["cljs.core","IAtom","cljs.core.IAtom"], null)])], null);
}),null));
devtools.munging.key_for_protocol_partition = (function devtools$munging$key_for_protocol_partition(partition){
return ["cljs$lang$protocol_mask$partition",cljs.core.str.cljs$core$IFn$_invoke$arity$1(partition),"$"].join('');
});
devtools.munging.scan_fast_path_protocols_partition = (function devtools$munging$scan_fast_path_protocols_partition(obj,partition){
if(typeof partition === 'number'){
} else {
throw (new Error("Assert failed: (number? partition)"));
}

var partition_key = devtools.munging.key_for_protocol_partition(partition);
var partition_bits = (function (){var or__5002__auto__ = (obj[partition_key]);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
if((partition_bits > (0))){
var lookup_table = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(devtools.munging.fast_path_protocols_lookup_table),partition);
var _ = ((cljs.core.map_QMARK_(lookup_table))?null:(function(){throw (new Error(["Assert failed: ",["fast-path-protocols-lookup-table does not contain lookup table for partition ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(partition)].join(''),"\n","(map? lookup-table)"].join('')))})());
var _STAR_ = (function (accum,p__33023){
var vec__33024 = p__33023;
var bit = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33024,(0),null);
var protocol = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33024,(1),null);
if(((partition_bits & bit) === (0))){
return accum;
} else {
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(accum,protocol);
}
});
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(_STAR_,cljs.core.PersistentVector.EMPTY,lookup_table);
} else {
return null;
}
});
devtools.munging.scan_fast_path_protocols = (function devtools$munging$scan_fast_path_protocols(obj){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.concat,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(devtools.munging.scan_fast_path_protocols_partition,obj),cljs.core.range.cljs$core$IFn$_invoke$arity$1((2))));
});
devtools.munging.scan_slow_path_protocols = (function devtools$munging$scan_slow_path_protocols(obj){
var keys = devtools.munging.goog$module$goog$object.getKeys(obj);
var selectors = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(devtools.munging.get_protocol_selector,keys);
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(devtools.munging.demunge_protocol_selector,selectors);
});
devtools.munging.make_protocol_descriptor = (function devtools$munging$make_protocol_descriptor(ns,name,selector,fast_QMARK_){
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"ns","ns",441598760),ns,new cljs.core.Keyword(null,"name","name",1843675177),name,new cljs.core.Keyword(null,"selector","selector",762528866),selector,new cljs.core.Keyword(null,"fast?","fast?",-1813307150),fast_QMARK_], null);
});
devtools.munging.convert_to_protocol_descriptor = (function devtools$munging$convert_to_protocol_descriptor(fast_QMARK_,p__33050){
var vec__33051 = p__33050;
var ns = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33051,(0),null);
var name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33051,(1),null);
var selector = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33051,(2),null);
return devtools.munging.make_protocol_descriptor(ns,name,selector,fast_QMARK_);
});
devtools.munging.protocol_descriptors_comparator = (function devtools$munging$protocol_descriptors_comparator(a,b){
return cljs.core.compare(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(a),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(b));
});
devtools.munging.scan_protocols = (function devtools$munging$scan_protocols(obj){
var fast_path_protocols = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(devtools.munging.convert_to_protocol_descriptor,true),devtools.munging.scan_fast_path_protocols(obj));
var slow_path_protocols = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(devtools.munging.convert_to_protocol_descriptor,false),devtools.munging.scan_slow_path_protocols(obj));
var all_protocols = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(fast_path_protocols,slow_path_protocols);
return cljs.core.sort.cljs$core$IFn$_invoke$arity$2(devtools.munging.protocol_descriptors_comparator,all_protocols);
});
devtools.munging.collect_protocol_methods = (function devtools$munging$collect_protocol_methods(obj,protocol_selector){
var key_prefix = clojure.string.replace(protocol_selector,/\./,"\\$");
var pattern = cljs.core.re_pattern(["^",key_prefix,"\\$(.*)\\$arity\\$(\\d+)$"].join(''));
var all_keys = devtools.munging.goog$module$goog$object.getKeys(obj);
var matches = cljs.core.keep.cljs$core$IFn$_invoke$arity$2(cljs.core.partial.cljs$core$IFn$_invoke$arity$2(cljs.core.re_matches,pattern),all_keys);
var methods$ = cljs.core.group_by(cljs.core.second,matches);
var match_to_arity = (function (match){
var arity = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(match,(2));
return parseInt(arity,(10));
});
var match_arity_comparator = (function (a,b){
return cljs.core.compare(match_to_arity(a),match_to_arity(b));
});
var post_process = (function (p__33071){
var vec__33073 = p__33071;
var munged_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33073,(0),null);
var matches__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__33073,(1),null);
var name = devtools.munging.proper_demunge(munged_name);
var sorted_matches = cljs.core.sort.cljs$core$IFn$_invoke$arity$2(match_arity_comparator,matches__$1);
var sorted_fns = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__33063_SHARP_){
return (obj[cljs.core.first(p1__33063_SHARP_)]);
}),sorted_matches);
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [name,sorted_fns], null);
});
var by_name_comparator = (function (a,b){
return cljs.core.compare(cljs.core.first(a),cljs.core.first(b));
});
return cljs.core.sort.cljs$core$IFn$_invoke$arity$2(by_name_comparator,cljs.core.map.cljs$core$IFn$_invoke$arity$2(post_process,methods$));
});

//# sourceMappingURL=devtools.munging.js.map
