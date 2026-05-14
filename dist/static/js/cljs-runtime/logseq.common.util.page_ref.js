goog.provide('logseq.common.util.page_ref');
var module$node_modules$path$path=shadow.js.require("module$node_modules$path$path", {});
/**
 * Opening characters for page-ref
 */
logseq.common.util.page_ref.left_brackets = "[[";
/**
 * Closing characters for page-ref
 */
logseq.common.util.page_ref.right_brackets = "]]";
/**
 * Opening and closing characters for page-ref
 */
logseq.common.util.page_ref.left_and_right_brackets = [logseq.common.util.page_ref.left_brackets,logseq.common.util.page_ref.right_brackets].join('');
/**
 * Inner capture and doesn't match nested brackets
 */
logseq.common.util.page_ref.page_ref_re = /\[\[(.*?)\]\]/;
/**
 * Matches most inner nested brackets
 */
logseq.common.util.page_ref.page_ref_without_nested_re = /\[\[([^\[\]]+)\]\]/;
/**
 * Inner capture that matches anything between brackets
 */
logseq.common.util.page_ref.page_ref_any_re = /\[\[(.*)\]\]/;
logseq.common.util.page_ref.org_page_ref_re = /\[\[(file:.*)\]\[.+?\]\]/;
logseq.common.util.page_ref.markdown_page_ref_re = /\[(.*)\]\(file:.*\)/;
/**
 * Returns the basename of a file path. e.g. /a/b/c.md -> c.md
 */
logseq.common.util.page_ref.get_file_basename = (function logseq$common$util$page_ref$get_file_basename(path){
if(clojure.string.blank_QMARK_(path)){
return null;
} else {
return module$node_modules$path$path.parse(clojure.string.replace(path,"+","/")).base;
}
});
/**
 * Returns the rootname of a file path. e.g. /a/b/c.md -> c
 */
logseq.common.util.page_ref.get_file_rootname = (function logseq$common$util$page_ref$get_file_rootname(path){
if(clojure.string.blank_QMARK_(path)){
return null;
} else {
return module$node_modules$path$path.parse(clojure.string.replace(path,"+","/")).name;
}
});
/**
 * Determines if string is page-ref. Avoid using with format-specific page-refs e.g. org
 */
logseq.common.util.page_ref.page_ref_QMARK_ = (function logseq$common$util$page_ref$page_ref_QMARK_(s){
return ((clojure.string.starts_with_QMARK_(s,logseq.common.util.page_ref.left_brackets)) && (clojure.string.ends_with_QMARK_(s,logseq.common.util.page_ref.right_brackets)));
});
/**
 * Create a page ref given a page name
 */
logseq.common.util.page_ref.__GT_page_ref = (function logseq$common$util$page_ref$__GT_page_ref(page_name){
return [logseq.common.util.page_ref.left_brackets,cljs.core.str.cljs$core$IFn$_invoke$arity$1(page_name),logseq.common.util.page_ref.right_brackets].join('');
});
/**
 * Extracts page names from format-specific page-refs e.g. org/md specific and
 *   logseq page-refs. Only call in contexts where format-specific page-refs are
 *   used. For logseq page-refs use page-ref/get-page-name
 */
logseq.common.util.page_ref.get_page_name = (function logseq$common$util$page_ref$get_page_name(s){
var and__5000__auto__ = typeof s === 'string';
if(and__5000__auto__){
var or__5002__auto__ = (function (){var temp__5804__auto__ = cljs.core.re_matches(logseq.common.util.page_ref.markdown_page_ref_re,s);
if(cljs.core.truth_(temp__5804__auto__)){
var vec__58016 = temp__5804__auto__;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__58016,(0),null);
var label = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__58016,(1),null);
var _path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__58016,(2),null);
return clojure.string.trim(label);
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (function (){var temp__5804__auto__ = cljs.core.re_matches(logseq.common.util.page_ref.org_page_ref_re,s);
if(cljs.core.truth_(temp__5804__auto__)){
var vec__58025 = temp__5804__auto__;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__58025,(0),null);
var path = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__58025,(1),null);
var _label = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__58025,(2),null);
var G__58029 = logseq.common.util.page_ref.get_file_rootname(path);
if((G__58029 == null)){
return null;
} else {
return clojure.string.replace(G__58029,".","/");
}
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return cljs.core.second(cljs.core.re_matches(logseq.common.util.page_ref.page_ref_any_re,s));
}
}
} else {
return and__5000__auto__;
}
});
/**
 * Extracts page-name from page-ref and fall back to arg. Useful for when user
 *   input may (not) be a page-ref
 */
logseq.common.util.page_ref.get_page_name_BANG_ = (function logseq$common$util$page_ref$get_page_name_BANG_(s){
var or__5002__auto__ = logseq.common.util.page_ref.get_page_name(s);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return s;
}
});
logseq.common.util.page_ref.page_ref_un_brackets_BANG_ = (function logseq$common$util$page_ref$page_ref_un_brackets_BANG_(s){
var or__5002__auto__ = logseq.common.util.page_ref.get_page_name(s);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return s;
}
});

//# sourceMappingURL=logseq.common.util.page_ref.js.map
