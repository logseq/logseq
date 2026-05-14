goog.provide('rewrite_clj.node.extras');
/**
 * Check whether the given node represents whitespace or comment.
 */
rewrite_clj.node.extras.whitespace_or_comment_QMARK_ = (function rewrite_clj$node$extras$whitespace_or_comment_QMARK_(node){
return ((rewrite_clj.node.whitespace.whitespace_QMARK_(node)) || (rewrite_clj.node.comment.comment_QMARK_(node)));
});

//# sourceMappingURL=rewrite_clj.node.extras.js.map
