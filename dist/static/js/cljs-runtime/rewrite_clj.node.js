goog.provide('rewrite_clj.node');
/**
 * Coerce `form` to node.
 */
rewrite_clj.node.coerce = (function rewrite_clj$node$coerce(form){
return rewrite_clj.node.protocols.coerce(form);
});
/**
 * Returns child nodes for `node`.
 */
rewrite_clj.node.children = (function rewrite_clj$node$children(node){
return rewrite_clj.node.protocols.children(node);
});
/**
 * Returns children for `node` converted to Clojure forms.
 * 
 *   Optional `opts` can specify:
 *   - `:auto-resolve` specify a function to customize namespaced element auto-resolve behavior, see [docs on namespaced elements](/doc/01-user-guide.adoc#namespaced-elements)
 */
rewrite_clj.node.child_sexprs = (function rewrite_clj$node$child_sexprs(var_args){
var G__66074 = arguments.length;
switch (G__66074) {
case 1:
return rewrite_clj.node.child_sexprs.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rewrite_clj.node.child_sexprs.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.node.child_sexprs.cljs$core$IFn$_invoke$arity$1 = (function (node){
return rewrite_clj.node.protocols.child_sexprs.cljs$core$IFn$_invoke$arity$1(node);
}));

(rewrite_clj.node.child_sexprs.cljs$core$IFn$_invoke$arity$2 = (function (node,opts){
return rewrite_clj.node.protocols.child_sexprs.cljs$core$IFn$_invoke$arity$2(node,opts);
}));

(rewrite_clj.node.child_sexprs.cljs$lang$maxFixedArity = 2);

/**
 * Returns true if `node` can have children.
 */
rewrite_clj.node.inner_QMARK_ = (function rewrite_clj$node$inner_QMARK_(node){
return rewrite_clj.node.protocols.inner_QMARK_(node);
});
/**
 * Returns number of characters before children for `node`.
 */
rewrite_clj.node.leader_length = (function rewrite_clj$node$leader_length(node){
return rewrite_clj.node.protocols.leader_length(node);
});
/**
 * Return number of characters for the string version of `node`.
 */
rewrite_clj.node.length = (function rewrite_clj$node$length(node){
return rewrite_clj.node.protocols.length(node);
});
/**
 * Returns true if `x` is a rewrite-clj created node.
 */
rewrite_clj.node.node_QMARK_ = (function rewrite_clj$node$node_QMARK_(x){
return rewrite_clj.node.protocols.node_QMARK_(x);
});
/**
 * Return true if `node` cannot be converted to an s-expression element.
 */
rewrite_clj.node.printable_only_QMARK_ = (function rewrite_clj$node$printable_only_QMARK_(node){
return rewrite_clj.node.protocols.printable_only_QMARK_(node);
});
/**
 * Returns `node` replacing current children with `children`.
 */
rewrite_clj.node.replace_children = (function rewrite_clj$node$replace_children(node,children){
return rewrite_clj.node.protocols.replace_children(node,children);
});
/**
 * Return `node` converted to form.
 * 
 *   Optional `opts` can specify:
 *   - `:auto-resolve` specify a function to customize namespaced element auto-resolve behavior, see [docs on namespaced elements](/doc/01-user-guide.adoc#namespaced-elements)
 * 
 *   See docs for [sexpr nuances](/doc/01-user-guide.adoc#sexpr-nuances).
 */
rewrite_clj.node.sexpr = (function rewrite_clj$node$sexpr(var_args){
var G__66091 = arguments.length;
switch (G__66091) {
case 1:
return rewrite_clj.node.sexpr.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rewrite_clj.node.sexpr.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.node.sexpr.cljs$core$IFn$_invoke$arity$1 = (function (node){
return rewrite_clj.node.protocols.sexpr.cljs$core$IFn$_invoke$arity$1(node);
}));

(rewrite_clj.node.sexpr.cljs$core$IFn$_invoke$arity$2 = (function (node,opts){
return rewrite_clj.node.protocols.sexpr.cljs$core$IFn$_invoke$arity$2(node,opts);
}));

(rewrite_clj.node.sexpr.cljs$lang$maxFixedArity = 2);

/**
 * Return true if [[sexpr]] is supported for `node`'s element type.
 * 
 * See [related docs in user guide](/doc/01-user-guide.adoc#not-all-clojure-is-sexpr-able)
 */
rewrite_clj.node.sexpr_able_QMARK_ = (function rewrite_clj$node$sexpr_able_QMARK_(node){
return rewrite_clj.node.protocols.sexpr_able_QMARK_(node);
});
/**
 * Return forms for `nodes`. Nodes that do not represent s-expression are skipped.
 * 
 *   Optional `opts` can specify:
 *   - `:auto-resolve` specify a function to customize namespaced element auto-resolve behavior, see [docs on namespaced elements](/doc/01-user-guide.adoc#namespaced-elements)
 * 
 *   See docs for [sexpr nuances](/doc/01-user-guide.adoc#sexpr-nuances).
 */
rewrite_clj.node.sexprs = (function rewrite_clj$node$sexprs(var_args){
var G__66097 = arguments.length;
switch (G__66097) {
case 1:
return rewrite_clj.node.sexprs.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rewrite_clj.node.sexprs.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.node.sexprs.cljs$core$IFn$_invoke$arity$1 = (function (nodes){
return rewrite_clj.node.protocols.sexprs.cljs$core$IFn$_invoke$arity$1(nodes);
}));

(rewrite_clj.node.sexprs.cljs$core$IFn$_invoke$arity$2 = (function (nodes,opts){
return rewrite_clj.node.protocols.sexprs.cljs$core$IFn$_invoke$arity$2(nodes,opts);
}));

(rewrite_clj.node.sexprs.cljs$lang$maxFixedArity = 2);

/**
 * Applies `map-qualifier` context to `node`
 */
rewrite_clj.node.map_context_apply = (function rewrite_clj$node$map_context_apply(node,map_qualifier){
return rewrite_clj.node.protocols.map_context_apply(node,map_qualifier);
});
/**
 * Removes map-qualifier context for `node`
 */
rewrite_clj.node.map_context_clear = (function rewrite_clj$node$map_context_clear(node){
return rewrite_clj.node.protocols.map_context_clear(node);
});
/**
 * Return the string version of `node`.
 */
rewrite_clj.node.string = (function rewrite_clj$node$string(node){
return rewrite_clj.node.protocols.string(node);
});
/**
 * Returns keyword representing type of `node`.
 */
rewrite_clj.node.tag = (function rewrite_clj$node$tag(node){
return rewrite_clj.node.protocols.tag(node);
});
/**
 * DEPRECATED: Get first child as a pair of tag/sexpr (if inner node),
 * or just the node's own sexpr. (use explicit analysis of `children`
 * `child-sexprs` instead) 
 */
rewrite_clj.node.value = (function rewrite_clj$node$value(node){
return rewrite_clj.node.protocols.value(node);
});
/**
 * Create node representing a comment with text `s`.
 * 
 * You may optionally specify a `prefix` of `";"` or `"#!"`, defaults is `";"`.
 * 
 * Argument `s`:
 * - must not include the `prefix`
 * - usually includes the trailing newline character, otherwise subsequent nodes will be on the comment line
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/comment-node "; my comment\n")
 *     n/string)
 * ;; => ";; my comment\n"
 * 
 * (-> (n/comment-node "#!" "/usr/bin/env bb\n")
 *     n/string)
 * ;; => "#!/usr/bin/env bb\n"
 * ```
 */
rewrite_clj.node.comment_node = (function rewrite_clj$node$comment_node(var_args){
var G__66103 = arguments.length;
switch (G__66103) {
case 1:
return rewrite_clj.node.comment_node.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rewrite_clj.node.comment_node.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.node.comment_node.cljs$core$IFn$_invoke$arity$1 = (function (s){
return rewrite_clj.node.comment.comment_node.cljs$core$IFn$_invoke$arity$1(s);
}));

(rewrite_clj.node.comment_node.cljs$core$IFn$_invoke$arity$2 = (function (prefix,s){
return rewrite_clj.node.comment.comment_node.cljs$core$IFn$_invoke$arity$2(prefix,s);
}));

(rewrite_clj.node.comment_node.cljs$lang$maxFixedArity = 2);

/**
 * Returns true if `node` is a comment.
 */
rewrite_clj.node.comment_QMARK_ = (function rewrite_clj$node$comment_QMARK_(node){
return rewrite_clj.node.comment.comment_QMARK_(node);
});
/**
 * Check whether the given node represents whitespace or comment.
 */
rewrite_clj.node.whitespace_or_comment_QMARK_ = (function rewrite_clj$node$whitespace_or_comment_QMARK_(node){
return rewrite_clj.node.extras.whitespace_or_comment_QMARK_(node);
});
/**
 * Create node representing an anonymous function with `children`.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/fn-node [(n/token-node '+)
 *                 (n/spaces 1)
 *                 (n/token-node 1)
 *                 (n/spaces 1)
 *                 (n/token-node '%1)])
 *     n/string)
 * ;; => "#(+ 1 %1)"
 * ```
 */
rewrite_clj.node.fn_node = (function rewrite_clj$node$fn_node(children){
return rewrite_clj.node.fn.fn_node(children);
});
/**
 * Create top-level node wrapping multiple `children`.
 * The forms node is equivalent to an implicit `do` at the top-level.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/forms-node [(n/token-node 1)
 *                    (n/spaces 1)
 *                    (n/token-node 2)])
 *     n/string)
 * ;; => "1 2"
 * ```
 * 
 */
rewrite_clj.node.forms_node = (function rewrite_clj$node$forms_node(children){
return rewrite_clj.node.forms.forms_node(children);
});
/**
 * Create node representing an integer `value` in `base`.
 * 
 *   `base` defaults to 10.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/integer-node 42)
 *     n/string)
 * ;; => "42"
 * 
 * (-> (n/integer-node 31 2)
 *     n/string)
 * ;; => "2r11111"
 * ```
 * 
 * Note: the parser does not currently parse to integer-nodes, but they fully supported for output.
 */
rewrite_clj.node.integer_node = (function rewrite_clj$node$integer_node(var_args){
var G__66111 = arguments.length;
switch (G__66111) {
case 1:
return rewrite_clj.node.integer_node.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rewrite_clj.node.integer_node.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.node.integer_node.cljs$core$IFn$_invoke$arity$1 = (function (value){
return rewrite_clj.node.integer.integer_node.cljs$core$IFn$_invoke$arity$1(value);
}));

(rewrite_clj.node.integer_node.cljs$core$IFn$_invoke$arity$2 = (function (value,base){
return rewrite_clj.node.integer.integer_node.cljs$core$IFn$_invoke$arity$2(value,base);
}));

(rewrite_clj.node.integer_node.cljs$lang$maxFixedArity = 2);

/**
 * Create a node representing a keyword `k`.
 * 
 * Optionally include `auto-resolved?`, which defaults to `false`.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * ;; unqualified keyword
 * (-> (n/keyword-node :kw)
 *     n/string)
 * ;; => ":kw"
 * 
 * ;; qualified keyword
 * (-> (n/keyword-node :my-prefix/kw)
 *     n/string)
 * ;; => ":my-prefix/kw"
 * 
 * ;; keyword auto-resolved to current ns
 * (-> (n/keyword-node :kw true)
 *     n/string)
 * ;; => "::kw"
 * 
 * ;; keyword auto-resolved to a namespace with given alias
 * (-> (n/keyword-node :ns-alias/kw true)
 *     n/string)
 * ;; => "::ns-alias/kw"
 * ```
 */
rewrite_clj.node.keyword_node = (function rewrite_clj$node$keyword_node(var_args){
var G__66114 = arguments.length;
switch (G__66114) {
case 2:
return rewrite_clj.node.keyword_node.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 1:
return rewrite_clj.node.keyword_node.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.node.keyword_node.cljs$core$IFn$_invoke$arity$2 = (function (k,auto_resolved_QMARK_){
return rewrite_clj.node.keyword.keyword_node.cljs$core$IFn$_invoke$arity$2(k,auto_resolved_QMARK_);
}));

(rewrite_clj.node.keyword_node.cljs$core$IFn$_invoke$arity$1 = (function (k){
return rewrite_clj.node.keyword.keyword_node.cljs$core$IFn$_invoke$arity$1(k);
}));

(rewrite_clj.node.keyword_node.cljs$lang$maxFixedArity = 2);

/**
 * Returns true if `n` is a node representing a keyword.
 */
rewrite_clj.node.keyword_node_QMARK_ = (function rewrite_clj$node$keyword_node_QMARK_(n){
return rewrite_clj.node.keyword.keyword_node_QMARK_(n);
});
/**
 * Create a node representing a form with metadata.
 * 
 * When creating manually, you can specify `metadata` and `data` and spacing between the 2 elems will be included:
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/meta-node (n/keyword-node :foo)
 *                  (n/vector-node [(n/token-node 1)]))
 *     n/string)
 * ;; => "^:foo [1]"
 * 
 * (-> (n/meta-node (n/map-node [:foo (n/spaces 1) 42])
 *                  (n/vector-node [(n/token-node 1)]))
 *     n/string)
 * ;; => "^{:foo 42} [1]"
 * ```
 * When specifying a sequence of `children`, spacing is explicit:
 * 
 * ```Clojure
 * (-> (n/meta-node [(n/keyword-node :foo)
 *                   (n/spaces 1)
 *                   (n/vector-node [(n/token-node 1)])])
 *     n/string)
 * ;; => "^:foo [1]"
 * ```
 * See also: [[raw-meta-node]]
 */
rewrite_clj.node.meta_node = (function rewrite_clj$node$meta_node(var_args){
var G__66119 = arguments.length;
switch (G__66119) {
case 1:
return rewrite_clj.node.meta_node.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rewrite_clj.node.meta_node.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.node.meta_node.cljs$core$IFn$_invoke$arity$1 = (function (children){
return rewrite_clj.node.meta.meta_node.cljs$core$IFn$_invoke$arity$1(children);
}));

(rewrite_clj.node.meta_node.cljs$core$IFn$_invoke$arity$2 = (function (metadata,data){
return rewrite_clj.node.meta.meta_node.cljs$core$IFn$_invoke$arity$2(metadata,data);
}));

(rewrite_clj.node.meta_node.cljs$lang$maxFixedArity = 2);

/**
 * Create a node representing a form with metadata that renders to the reader syntax.
 * 
 * When creating manually, you can specify `metadata` and `data` and spacing between the 2 elems will be included:
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/raw-meta-node (n/keyword-node :foo)
 *                      (n/vector-node [(n/token-node 2)]))
 *      n/string)
 * ;; => "#^:foo [2]"
 * 
 * (-> (n/raw-meta-node (n/map-node [:foo (n/spaces 1) 42])
 *                      (n/vector-node [(n/token-node 2)]))
 *     n/string)
 * ;; => "#^{:foo 42} [2]"
 * ```
 * When specifying a sequence of `children`, spacing is explicit:
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/raw-meta-node [(n/keyword-node :foo)
 *                       (n/spaces 1)
 *                       (n/vector-node [(n/token-node 2)])])
 *     n/string)
 * ;; => "#^:foo [2]"
 * ```
 * See also: [[meta-node]]
 */
rewrite_clj.node.raw_meta_node = (function rewrite_clj$node$raw_meta_node(var_args){
var G__66121 = arguments.length;
switch (G__66121) {
case 1:
return rewrite_clj.node.raw_meta_node.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rewrite_clj.node.raw_meta_node.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.node.raw_meta_node.cljs$core$IFn$_invoke$arity$1 = (function (children){
return rewrite_clj.node.meta.raw_meta_node.cljs$core$IFn$_invoke$arity$1(children);
}));

(rewrite_clj.node.raw_meta_node.cljs$core$IFn$_invoke$arity$2 = (function (metadata,data){
return rewrite_clj.node.meta.raw_meta_node.cljs$core$IFn$_invoke$arity$2(metadata,data);
}));

(rewrite_clj.node.raw_meta_node.cljs$lang$maxFixedArity = 2);

/**
 * Create a map qualifier node.
 * The map qualifier node is a child node of [[namespaced-map-node]].
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * ;; qualified
 * (-> (n/map-qualifier-node false "my-prefix")
 *     n/string)
 * ;; => ":my-prefix"
 * 
 * ;; auto-resolved to current ns
 * (-> (n/map-qualifier-node true nil)
 *     n/string)
 * ;; => "::"
 * 
 * ;; auto-resolve to namespace with alias
 * (-> (n/map-qualifier-node true "my-ns-alias")
 *     n/string)
 * ;; => "::my-ns-alias"
 * ```
 */
rewrite_clj.node.map_qualifier_node = (function rewrite_clj$node$map_qualifier_node(auto_resolved_QMARK_,prefix){
return rewrite_clj.node.namespaced_map.map_qualifier_node(auto_resolved_QMARK_,prefix);
});
/**
 * Create a namespaced map node with `children`.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/namespaced-map-node [(n/map-qualifier-node true "my-ns-alias")
 *                             (n/spaces 1)
 *                             (n/map-node [(n/keyword-node :a)
 *                                          (n/spaces 1)
 *                                          (n/token-node 1)])])
 *     n/string)
 * ;; => "#::my-ns-alias {:a 1}"
 * ```
 * 
 * Map qualifier context is automatically applied to map keys for sexpr support.
 * 
 * See also [[map-qualifier-node]] and [[map-node]].
 */
rewrite_clj.node.namespaced_map_node = (function rewrite_clj$node$namespaced_map_node(children){
return rewrite_clj.node.namespaced_map.namespaced_map_node(children);
});
/**
 * Create node representing a regex with `pattern-string`.
 * Use same escape rules for `pattern-string` as you would for `(re-pattern "pattern-string")`
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/regex-node "my\\.lil.*regex")
 *     n/string)
 * ;; => "#\"my\\.lil.*regex\""
 * ```
 */
rewrite_clj.node.regex_node = (function rewrite_clj$node$regex_node(pattern_string){
return rewrite_clj.node.regex.regex_node(pattern_string);
});
/**
 * Create node representing the dereferencing of a form
 * where `children` is either a sequence of nodes or a single node.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/deref-node (n/token-node 'my-var))
 *     n/string)
 * ;; => "@my-var"
 * 
 * ;; specifying a sequence allows for whitespace between @ and form
 * (-> (n/deref-node [(n/spaces 2)
 *                    (n/token-node 'my-var)])
 *     n/string)
 * ;; => "@  my-var"
 * ```
 */
rewrite_clj.node.deref_node = (function rewrite_clj$node$deref_node(children){
return rewrite_clj.node.reader_macro.deref_node(children);
});
/**
 * Create node representing an inline evaluation
 * where `children` is either a sequence of nodes or a single node.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/eval-node (n/list-node [(n/token-node 'inc)
 *                                (n/spaces 1)
 *                                (n/token-node 1)]))
 *     n/string)
 * ;; => "#=(inc 1)"
 * 
 * ;; specifying a sequence allows for whitespace between the
 * ;; prefix and the form
 * (-> (n/eval-node [(n/spaces 3)
 *                   (n/list-node [(n/token-node 'inc)
 *                                 (n/spaces 1)
 *                                 (n/token-node 1)])])
 *     n/string)
 * ;; => "#=   (inc 1)"
 * ```
 */
rewrite_clj.node.eval_node = (function rewrite_clj$node$eval_node(children){
return rewrite_clj.node.reader_macro.eval_node(children);
});
/**
 * Create node representing a reader macro with `macro-node` and `form-node` or `children`.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * ;; here we call with macro-node and form-node
 * (-> (n/reader-macro-node (n/token-node 'my-macro)
 *                          (n/token-node 42))
 *     n/string)
 * ;; => "#my-macro 42"
 * 
 * ;; calling with a sequence of children gives us control over whitespace
 * (-> (n/reader-macro-node [(n/token-node 'my-macro)
 *                           (n/spaces 4)
 *                           (n/token-node 42)])
 *     n/string)
 * ;; => "#my-macro    42"
 * ```
 */
rewrite_clj.node.reader_macro_node = (function rewrite_clj$node$reader_macro_node(var_args){
var G__66131 = arguments.length;
switch (G__66131) {
case 1:
return rewrite_clj.node.reader_macro_node.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rewrite_clj.node.reader_macro_node.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.node.reader_macro_node.cljs$core$IFn$_invoke$arity$1 = (function (children){
return rewrite_clj.node.reader_macro.reader_macro_node.cljs$core$IFn$_invoke$arity$1(children);
}));

(rewrite_clj.node.reader_macro_node.cljs$core$IFn$_invoke$arity$2 = (function (macro_node,form_node){
return rewrite_clj.node.reader_macro.reader_macro_node.cljs$core$IFn$_invoke$arity$2(macro_node,form_node);
}));

(rewrite_clj.node.reader_macro_node.cljs$lang$maxFixedArity = 2);

/**
 * Create node representing a var where `children` is either a
 * sequence of nodes or a single node.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/var-node (n/token-node 'my-var))
 *     n/string)
 * ;; => "#'my-var"
 * 
 * ;; specifying a sequence allows for whitespace between the
 * ;; prefix and the var
 * (-> (n/var-node [(n/spaces 2)
 *                  (n/token-node 'my-var)])
 *     n/string)
 * ;; => "#'  my-var"
 * ```
 */
rewrite_clj.node.var_node = (function rewrite_clj$node$var_node(children){
return rewrite_clj.node.reader_macro.var_node(children);
});
/**
 * Create a node representing a list with `children`.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/list-node [(n/token-node 1)
 *                   (n/spaces 1)
 *                   (n/token-node 2)
 *                   (n/spaces 1)
 *                   (n/token-node 3)])
 *     n/string)
 * ;; => "(1 2 3)"
 * ```
 */
rewrite_clj.node.list_node = (function rewrite_clj$node$list_node(children){
return rewrite_clj.node.seq.list_node(children);
});
/**
 * Create a node representing a map with `children`.
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/map-node [(n/keyword-node :a)
 *                  (n/spaces 1)
 *                  (n/token-node 1)
 *                  (n/spaces 1)
 *                  (n/keyword-node :b)
 *                  (n/spaces 1)
 *                  (n/token-node 2)])
 *     (n/string))
 * ;; => "{:a 1 :b 2}"
 * ```
 * 
 * Note that rewrite-clj allows the, technically illegal, unbalanced map:
 * ```Clojure
 * (-> (n/map-node [(n/keyword-node :a)])
 *     (n/string))
 * ;; => "{:a}"
 * ```
 * See [docs on unbalanced maps](/doc/01-user-guide.adoc#unbalanced-maps).
 * 
 * Rewrite-clj also allows the, also technically illegal, map with duplicate keys:
 * ```Clojure
 * (-> (n/map-node [(n/keyword-node :a)
 *                  (n/spaces 1)
 *                  (n/token-node 1)
 *                  (n/spaces 1)
 *                  (n/keyword-node :a)
 *                  (n/spaces 1)
 *                  (n/token-node 2)])
 *     (n/string))
 * ;; => "{:a 1 :a 2}"
 * ```
 * See [docs on maps with duplicate keys](/doc/01-user-guide.adoc#maps-with-duplicate-keys).
 */
rewrite_clj.node.map_node = (function rewrite_clj$node$map_node(children){
return rewrite_clj.node.seq.map_node(children);
});
/**
 * Create a node representing a set with `children`.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/set-node [(n/token-node 1)
 *                  (n/spaces 1)
 *                  (n/token-node 2)
 *                  (n/spaces 1)
 *                  (n/token-node 3)])
 *     n/string)
 * ;; => "#{1 2 3}"
 * ```
 * 
 * Note that rewrite-clj allows the, technically illegal, set with duplicate values:
 * ```Clojure
 * (-> (n/set-node [(n/token-node 1)
 *                  (n/spaces 1)
 *                  (n/token-node 1)])
 *     (n/string))
 * ;; => "#{1 1}"
 * ```
 * 
 * See [docs on sets with duplicate values](/doc/01-user-guide.adoc#sets-with-duplicate-values).
 */
rewrite_clj.node.set_node = (function rewrite_clj$node$set_node(children){
return rewrite_clj.node.seq.set_node(children);
});
/**
 * Create a node representing a vector with `children`.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/vector-node [(n/token-node 1)
 *                     (n/spaces 1)
 *                     (n/token-node 2)
 *                     (n/spaces 1)
 *                     (n/token-node 3)])
 *     n/string)
 * ;; => "[1 2 3]"
 * ```
 */
rewrite_clj.node.vector_node = (function rewrite_clj$node$vector_node(children){
return rewrite_clj.node.seq.vector_node(children);
});
/**
 * Create node representing a string value where `lines` can be a sequence of strings or a single string.
 * 
 *   When `lines` is a sequence, the resulting node `tag` will be `:multi-line`, otherwise `:token`.
 * 
 *   `:multi-line` refers to a single string in your source that appears over multiple lines, for example:
 * 
 *   ```Clojure
 *   (def s "foo
 *          bar
 *            baz")
 *   ```
 * 
 *   It does not apply to a string that appears on a single line that includes escaped newlines, for example:
 * 
 *   ```Clojure
 *   (def s "foo\nbar\n\baz")
 *   ```
 * 
 *   Naive examples (see example on escaping below):
 * 
 *   ```Clojure
 *   (require '[rewrite-clj.node :as n])
 * 
 *   (-> (n/string-node "hello")
 *    n/string)
 *   ;; => "\"hello\""
 * 
 *   (-> (n/string-node ["line1" "" "line3"])
 *     n/string)
 *   ;; => "\"line1\n\nline3\""
 *   ```
 * 
 *   This function was originally written to serve the rewrite-clj parser.
 *   Escaping and wrapping expectations are non-obvious.
 *   - characters within strings are assumed to be escaped
 *   - but the string should not wrapped with `\"`
 * 
 *   Here's an example of conforming to these expectations for a string that has escape sequences.
 *   (Best to view this on cljdoc, docstring string escaping is confusing).
 * 
 *   ```Clojure
 *   (require '[clojure.string :as string])
 * 
 *   (defn pr-str-unwrapped [s]
 *  (apply str (-> s pr-str next butlast)))
 * 
 *   (-> "hey \" man"
 *    pr-str-unwrapped
 *    n/string-node
 *    n/string)
 *   ;; => "\"hey \\\" man\""
 *   ```
 * 
 *   To construct strings appearing on a single line, consider [[token-node]].
 *   It will handle escaping for you.
 */
rewrite_clj.node.string_node = (function rewrite_clj$node$string_node(lines){
return rewrite_clj.node.stringz.string_node(lines);
});
/**
 * Create node representing a single quoted form where `children`
 * is either a sequence of nodes or a single node.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/quote-node (n/token-node 'sym))
 *     (n/string))
 * ;; => "'sym"
 * 
 * ;; specifying a sequence allows for whitespace between the
 * ;; quote and the quoted
 * (-> (n/quote-node [(n/spaces 10)
 *                    (n/token-node 'sym1) ])
 *     n/string)
 * ;; => "'          sym1"
 * ```
 */
rewrite_clj.node.quote_node = (function rewrite_clj$node$quote_node(children){
return rewrite_clj.node.quote.quote_node(children);
});
/**
 * Create node representing a single syntax-quoted form where `children`
 * is either a sequence of nodes or a single node.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/syntax-quote-node (n/token-node 'map))
 *     n/string)
 * ;; => "`map"
 * 
 * ;; specifying a sequence allows for whitespace between the
 * ;; syntax quote and the syntax quoted
 * (-> (n/syntax-quote-node [(n/spaces 3)
 *                           (n/token-node 'map)])
 *     n/string)
 * ;; => "`   map"
 * ```
 */
rewrite_clj.node.syntax_quote_node = (function rewrite_clj$node$syntax_quote_node(children){
return rewrite_clj.node.quote.syntax_quote_node(children);
});
/**
 * Create node representing a single unquoted form where `children`
 * is either a sequence of nodes or a single node.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/unquote-node (n/token-node 'my-var))
 *     n/string)
 * ;; => "~my-var"
 * 
 * ;; specifying a sequence allows for whitespace between the
 * ;; unquote and the uquoted
 * (-> (n/unquote-node [(n/spaces 4)
 *                      (n/token-node 'my-var)])
 *     n/string)
 * ;; => "~    my-var"
 * ```
 */
rewrite_clj.node.unquote_node = (function rewrite_clj$node$unquote_node(children){
return rewrite_clj.node.quote.unquote_node(children);
});
/**
 * Create node representing a single unquote-spliced form where `children`
 * is either a sequence of nodes or a single node.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/unquote-splicing-node (n/token-node 'my-var))
 *     n/string)
 * ;; => "~@my-var"
 * 
 * ;; specifying a sequence allows for whitespace between the
 * ;; splicing unquote and the splicing unquoted
 * (-> (n/unquote-splicing-node [(n/spaces 2)
 *                               (n/token-node 'my-var)])
 *     n/string)
 * ;; => "~@  my-var"
 * ```
 */
rewrite_clj.node.unquote_splicing_node = (function rewrite_clj$node$unquote_splicing_node(children){
return rewrite_clj.node.quote.unquote_splicing_node(children);
});
/**
 * Create node for an unspecified token of `value`.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/token-node 'sym) n/string)
 * ;; => "sym"
 * 
 * (-> (n/token-node 42) n/string)
 * ;; => "42"
 * 
 * (-> (n/token-node "astring") n/string)
 * ;; => "\"astring\""
 * ```
 * 
 * To construct strings appearing over multiple lines, see [[string-node]].
 */
rewrite_clj.node.token_node = (function rewrite_clj$node$token_node(var_args){
var G__66137 = arguments.length;
switch (G__66137) {
case 1:
return rewrite_clj.node.token_node.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return rewrite_clj.node.token_node.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(rewrite_clj.node.token_node.cljs$core$IFn$_invoke$arity$1 = (function (value){
return rewrite_clj.node.token.token_node.cljs$core$IFn$_invoke$arity$1(value);
}));

(rewrite_clj.node.token_node.cljs$core$IFn$_invoke$arity$2 = (function (value,string_value){
return rewrite_clj.node.token.token_node.cljs$core$IFn$_invoke$arity$2(value,string_value);
}));

(rewrite_clj.node.token_node.cljs$lang$maxFixedArity = 2);

/**
 * Returns true if `n` is a node representing a symbol.
 */
rewrite_clj.node.symbol_node_QMARK_ = (function rewrite_clj$node$symbol_node_QMARK_(n){
return rewrite_clj.node.token.symbol_node_QMARK_(n);
});
/**
 * Create node representing an unevaled form with `children`.
 * 
 * ```Clojure
 * (require '[rewrite-clj.node :as n])
 * 
 * (-> (n/uneval-node [(n/spaces 1)
 *                     (n/token-node 42)])
 *     n/string)
 * ;; => "#_ 42"
 * ```
 */
rewrite_clj.node.uneval_node = (function rewrite_clj$node$uneval_node(children){
return rewrite_clj.node.uneval.uneval_node(children);
});
/**
 * Interleave `nodes` with `", "` nodes.
 */
rewrite_clj.node.comma_separated = (function rewrite_clj$node$comma_separated(nodes){
return rewrite_clj.node.whitespace.comma_separated(nodes);
});
/**
 * Interleave `nodes` with newline nodes.
 */
rewrite_clj.node.line_separated = (function rewrite_clj$node$line_separated(nodes){
return rewrite_clj.node.whitespace.line_separated(nodes);
});
/**
 * Returns true if `node` represents one or more linebreaks.
 */
rewrite_clj.node.linebreak_QMARK_ = (function rewrite_clj$node$linebreak_QMARK_(node){
return rewrite_clj.node.whitespace.linebreak_QMARK_(node);
});
/**
 * Create node representing `n` newline characters.
 */
rewrite_clj.node.newlines = (function rewrite_clj$node$newlines(n){
return rewrite_clj.node.whitespace.newlines(n);
});
/**
 * Create newline node of string `s`, where `s` is one or more linebreak characters.
 */
rewrite_clj.node.newline_node = (function rewrite_clj$node$newline_node(s){
return rewrite_clj.node.whitespace.newline_node(s);
});
/**
 * Create node representing `n` spaces.
 */
rewrite_clj.node.spaces = (function rewrite_clj$node$spaces(n){
return rewrite_clj.node.whitespace.spaces(n);
});
/**
 * Create whitespace node of string `s`, where `s` is one or more space characters.
 */
rewrite_clj.node.whitespace_node = (function rewrite_clj$node$whitespace_node(s){
return rewrite_clj.node.whitespace.whitespace_node(s);
});
/**
 * Returns true if `node` represents Clojure whitespace.
 */
rewrite_clj.node.whitespace_QMARK_ = (function rewrite_clj$node$whitespace_QMARK_(node){
return rewrite_clj.node.whitespace.whitespace_QMARK_(node);
});
/**
 * Create comma node of string `s`, where `s` is one or more comma characters.
 */
rewrite_clj.node.comma_node = (function rewrite_clj$node$comma_node(s){
return rewrite_clj.node.whitespace.comma_node(s);
});
/**
 * Returns true if `node` represents one or more commas.
 */
rewrite_clj.node.comma_QMARK_ = (function rewrite_clj$node$comma_QMARK_(node){
return rewrite_clj.node.whitespace.comma_QMARK_(node);
});
/**
 * Convert string `s` of whitespace to whitespace/newline nodes.
 */
rewrite_clj.node.whitespace_nodes = (function rewrite_clj$node$whitespace_nodes(s){
return rewrite_clj.node.whitespace.whitespace_nodes(s);
});

//# sourceMappingURL=rewrite_clj.node.js.map
