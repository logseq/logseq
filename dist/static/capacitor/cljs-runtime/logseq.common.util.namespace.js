goog.provide('logseq.common.util.namespace');
if((typeof logseq !== 'undefined') && (typeof logseq.common !== 'undefined') && (typeof logseq.common.util !== 'undefined') && (typeof logseq.common.util.namespace !== 'undefined') && (typeof logseq.common.util.namespace.parent_char !== 'undefined')){
} else {
logseq.common.util.namespace.parent_char = "/";
}
if((typeof logseq !== 'undefined') && (typeof logseq.common !== 'undefined') && (typeof logseq.common.util !== 'undefined') && (typeof logseq.common.util.namespace !== 'undefined') && (typeof logseq.common.util.namespace.parent_re !== 'undefined')){
} else {
logseq.common.util.namespace.parent_re = /\//;
}
if((typeof logseq !== 'undefined') && (typeof logseq.common !== 'undefined') && (typeof logseq.common.util !== 'undefined') && (typeof logseq.common.util.namespace !== 'undefined') && (typeof logseq.common.util.namespace.namespace_char !== 'undefined')){
} else {
logseq.common.util.namespace.namespace_char = "/";
}
/**
 * Used by DB and file graphs
 */
logseq.common.util.namespace.namespace_page_QMARK_ = (function logseq$common$util$namespace$namespace_page_QMARK_(page_name){
return ((typeof page_name === 'string') && (((clojure.string.includes_QMARK_(page_name,logseq.common.util.namespace.namespace_char)) && (((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(clojure.string.trim(page_name),logseq.common.util.namespace.namespace_char)) && ((((!(clojure.string.starts_with_QMARK_(page_name,"../")))) && ((((!(clojure.string.starts_with_QMARK_(page_name,"./")))) && (cljs.core.not(logseq.common.util.url_QMARK_(page_name))))))))))));
});
/**
 * Get last part of a namespace page
 */
logseq.common.util.namespace.get_last_part = (function logseq$common$util$namespace$get_last_part(page_name){
if(logseq.common.util.namespace.namespace_page_QMARK_(page_name)){
return cljs.core.last(clojure.string.split.cljs$core$IFn$_invoke$arity$2(page_name,logseq.common.util.namespace.parent_char));
} else {
return page_name;
}
});

//# sourceMappingURL=logseq.common.util.namespace.js.map
