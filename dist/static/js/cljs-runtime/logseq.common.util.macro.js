goog.provide('logseq.common.util.macro');
/**
 * Opening characters for macro
 */
logseq.common.util.macro.left_braces = "{{";
/**
 * Closing characters for macro
 */
logseq.common.util.macro.right_braces = "}}";
logseq.common.util.macro.query_macro = [logseq.common.util.macro.left_braces,"query"].join('');
logseq.common.util.macro.macro_QMARK_ = (function logseq$common$util$macro$macro_QMARK_(_STAR_s){
var temp__5804__auto__ = (function (){var and__5000__auto__ = typeof _STAR_s === 'string';
if(and__5000__auto__){
return clojure.string.trim(_STAR_s);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var s = temp__5804__auto__;
return ((clojure.string.starts_with_QMARK_(s,logseq.common.util.macro.left_braces)) && (clojure.string.ends_with_QMARK_(s,logseq.common.util.macro.right_braces)));
} else {
return null;
}
});
logseq.common.util.macro.query_macro_QMARK_ = (function logseq$common$util$macro$query_macro_QMARK_(s){
return ((typeof s === 'string') && (((clojure.string.includes_QMARK_(s,[logseq.common.util.macro.query_macro," "].join(''))) && ((!(clojure.string.includes_QMARK_(s,["`",logseq.common.util.macro.query_macro].join(''))))))));
});
logseq.common.util.macro.macro_subs = (function logseq$common$util$macro$macro_subs(macro_content,arguments$){
var s = macro_content;
var args = arguments$;
var n = (1);
while(true){
if(cljs.core.seq(args)){
var G__58766 = clojure.string.replace(s,["$",cljs.core.str.cljs$core$IFn$_invoke$arity$1(n)].join(''),cljs.core.first(args));
var G__58767 = cljs.core.rest(args);
var G__58768 = (n + (1));
s = G__58766;
args = G__58767;
n = G__58768;
continue;
} else {
return s;
}
break;
}
});
/**
 * Checks a string for a macro and expands it if there's a macro entry for it.
 * This is a slimmer version of macro-else-cp
 */
logseq.common.util.macro.macro_expand_value = (function logseq$common$util$macro$macro_expand_value(value,macros){
var temp__5802__auto__ = ((typeof value === 'string') && (cljs.core.seq(cljs.core.re_matches(/\{\{(\S+)\s+(.*)\}\}/,value))));
if(temp__5802__auto__){
var vec__58752 = temp__5802__auto__;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__58752,(0),null);
var macro = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__58752,(1),null);
var args = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__58752,(2),null);
var temp__5802__auto____$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(macros,macro);
if(cljs.core.truth_(temp__5802__auto____$1)){
var content = temp__5802__auto____$1;
return logseq.common.util.macro.macro_subs(content,clojure.string.split.cljs$core$IFn$_invoke$arity$2(args,/\s+/));
} else {
return value;
}
} else {
return value;
}
});
logseq.common.util.macro.expand_value_if_macro = (function logseq$common$util$macro$expand_value_if_macro(s,macros){
if(cljs.core.truth_(logseq.common.util.macro.macro_QMARK_(s))){
return logseq.common.util.macro.macro_expand_value(s,macros);
} else {
return s;
}
});

//# sourceMappingURL=logseq.common.util.macro.js.map
