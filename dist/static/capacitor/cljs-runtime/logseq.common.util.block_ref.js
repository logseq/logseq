goog.provide('logseq.common.util.block_ref');
/**
 * Opening characters for block-ref
 */
logseq.common.util.block_ref.left_parens = "((";
/**
 * Closing characters for block-ref
 */
logseq.common.util.block_ref.right_parens = "))";
/**
 * Opening and closing characters for block-ref
 */
logseq.common.util.block_ref.left_and_right_parens = [logseq.common.util.block_ref.left_parens,logseq.common.util.block_ref.right_parens].join('');
logseq.common.util.block_ref.block_ref_re = /\(\(([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})\)\)/;
logseq.common.util.block_ref.get_all_block_ref_ids = (function logseq$common$util$block_ref$get_all_block_ref_ids(content){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.second,cljs.core.re_seq(logseq.common.util.block_ref.block_ref_re,content));
});
/**
 * Extracts block id from block-ref using regex
 */
logseq.common.util.block_ref.get_block_ref_id = (function logseq$common$util$block_ref$get_block_ref_id(s){
return cljs.core.second(cljs.core.re_matches(logseq.common.util.block_ref.block_ref_re,s));
});
/**
 * Extracts block id from block-ref by stripping parens e.g. ((123)) -> 123.
 *   This is a less strict version of get-block-ref-id
 */
logseq.common.util.block_ref.get_string_block_ref_id = (function logseq$common$util$block_ref$get_string_block_ref_id(s){
return cljs.core.subs.cljs$core$IFn$_invoke$arity$3(s,(2),(cljs.core.count(s) - (2)));
});
/**
 * Determines if string is block ref using regex
 */
logseq.common.util.block_ref.block_ref_QMARK_ = (function logseq$common$util$block_ref$block_ref_QMARK_(s){
return cljs.core.boolean$(logseq.common.util.block_ref.get_block_ref_id(s));
});
/**
 * Determines if string is block ref by checking parens. This is less strict version
 * of block-ref?
 */
logseq.common.util.block_ref.string_block_ref_QMARK_ = (function logseq$common$util$block_ref$string_block_ref_QMARK_(s){
return ((clojure.string.starts_with_QMARK_(s,logseq.common.util.block_ref.left_parens)) && (clojure.string.ends_with_QMARK_(s,logseq.common.util.block_ref.right_parens)));
});
/**
 * Creates block ref string given id
 */
logseq.common.util.block_ref.__GT_block_ref = (function logseq$common$util$block_ref$__GT_block_ref(block_id){
return [logseq.common.util.block_ref.left_parens,cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id),logseq.common.util.block_ref.right_parens].join('');
});

//# sourceMappingURL=logseq.common.util.block_ref.js.map
