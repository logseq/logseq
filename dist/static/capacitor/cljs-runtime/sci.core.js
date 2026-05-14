goog.provide('sci.core');
/**
 * Returns a new sci var.
 */
sci.core.new_var = (function sci$core$new_var(var_args){
var G__93082 = arguments.length;
switch (G__93082) {
case 1:
return sci.core.new_var.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return sci.core.new_var.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return sci.core.new_var.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(sci.core.new_var.cljs$core$IFn$_invoke$arity$1 = (function (name){
var G__93087 = sci.core.new_var.cljs$core$IFn$_invoke$arity$3(name,null,null);
sci.impl.vars.unbind(G__93087);

return G__93087;
}));

(sci.core.new_var.cljs$core$IFn$_invoke$arity$2 = (function (name,init_val){
return sci.core.new_var.cljs$core$IFn$_invoke$arity$3(name,init_val,cljs.core.meta(name));
}));

(sci.core.new_var.cljs$core$IFn$_invoke$arity$3 = (function (name,init_val,meta){
return (new sci.impl.vars.SciVar(init_val,name,meta,false));
}));

(sci.core.new_var.cljs$lang$maxFixedArity = 3);

/**
 * Same as new-var but adds :dynamic true to meta.
 */
sci.core.new_dynamic_var = (function sci$core$new_dynamic_var(var_args){
var G__93099 = arguments.length;
switch (G__93099) {
case 1:
return sci.core.new_dynamic_var.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return sci.core.new_dynamic_var.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return sci.core.new_dynamic_var.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(sci.core.new_dynamic_var.cljs$core$IFn$_invoke$arity$1 = (function (name){
var G__93101 = sci.core.new_dynamic_var.cljs$core$IFn$_invoke$arity$3(name,null,null);
sci.impl.vars.unbind(G__93101);

return G__93101;
}));

(sci.core.new_dynamic_var.cljs$core$IFn$_invoke$arity$2 = (function (name,init_val){
return sci.core.new_dynamic_var.cljs$core$IFn$_invoke$arity$3(name,init_val,cljs.core.meta(name));
}));

(sci.core.new_dynamic_var.cljs$core$IFn$_invoke$arity$3 = (function (name,init_val,meta){
return (new sci.impl.vars.SciVar(init_val,name,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(meta,new cljs.core.Keyword(null,"dynamic","dynamic",704819571),true),false));
}));

(sci.core.new_dynamic_var.cljs$lang$maxFixedArity = 3);

/**
 * Establish thread local binding of dynamic var
 */
sci.core.set_BANG_ = (function sci$core$set_BANG_(dynamic_var,v){
return sci.impl.types.setVal(dynamic_var,v);
});
/**
 * Same as new-var but adds :macro true to meta as well
 *   as :sci/macro true to meta of the fn itself.
 */
sci.core.new_macro_var = (function sci$core$new_macro_var(var_args){
var G__93114 = arguments.length;
switch (G__93114) {
case 2:
return sci.core.new_macro_var.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return sci.core.new_macro_var.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(sci.core.new_macro_var.cljs$core$IFn$_invoke$arity$2 = (function (name,init_val){
return sci.core.new_macro_var.cljs$core$IFn$_invoke$arity$3(name,init_val,cljs.core.meta(name));
}));

(sci.core.new_macro_var.cljs$core$IFn$_invoke$arity$3 = (function (name,init_val,meta){
return (new sci.impl.vars.SciVar(cljs.core.vary_meta.cljs$core$IFn$_invoke$arity$4(init_val,cljs.core.assoc,new cljs.core.Keyword("sci","macro","sci/macro",-868536151),true),name,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(meta,new cljs.core.Keyword(null,"macro","macro",-867863404),true),false));
}));

(sci.core.new_macro_var.cljs$lang$maxFixedArity = 3);

/**
 * Sci var that represents sci's `clojure.core/*in*`
 */
sci.core.in$ = sci.impl.io.in$;
/**
 * Sci var that represents sci's `clojure.core/*out*`
 */
sci.core.out = sci.impl.io.out;
/**
 * Sci var that represents sci's `clojure.core/*err*`
 */
sci.core.err = sci.impl.io.err;
/**
 * Sci var that represents sci's `clojure.core/*ns*`
 */
sci.core.ns = sci.impl.vars.current_ns;
/**
 * Sci var that represents sci's `clojure.core/*file*`
 */
sci.core.file = sci.impl.vars.current_file;
/**
 * Sci var that represents sci's `clojure.core/*print-length*`
 */
sci.core.print_length = sci.impl.io.print_length;
/**
 * Sci var that represents sci's `clojure.core/*print-level*`
 */
sci.core.print_level = sci.impl.io.print_level;
/**
 * Sci var that represents sci's `clojure.core/*print-meta*`
 */
sci.core.print_meta = sci.impl.io.print_meta;
/**
 * Sci var that represents sci's `clojure.core/*print-readably*`
 */
sci.core.print_readably = sci.impl.io.print_readably;
/**
 * Sci var that represents sci's `cljs.core/*print-fn*`
 */
sci.core.print_fn = sci.impl.io.print_fn;
/**
 * Sci var that represents sci's `cljs.core/*print-newline*`
 */
sci.core.print_newline = sci.impl.io.print_newline;
/**
 * SCI var that represents SCI's clojure.core/*assert*
 */
sci.core.assert = sci.impl.namespaces.assert_var;
sci.core._STAR_1 = sci.impl.namespaces._STAR_1;
sci.core._STAR_2 = sci.impl.namespaces._STAR_2;
sci.core._STAR_3 = sci.impl.namespaces._STAR_3;
sci.core._STAR_e = sci.impl.namespaces._STAR_e;
/**
 * Atomically alters the root binding of sci var v by applying f to its
 *   current value plus any args.
 */
sci.core.alter_var_root = (function sci$core$alter_var_root(var_args){
var args__5732__auto__ = [];
var len__5726__auto___93289 = arguments.length;
var i__5727__auto___93290 = (0);
while(true){
if((i__5727__auto___93290 < len__5726__auto___93289)){
args__5732__auto__.push((arguments[i__5727__auto___93290]));

var G__93291 = (i__5727__auto___93290 + (1));
i__5727__auto___93290 = G__93291;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return sci.core.alter_var_root.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(sci.core.alter_var_root.cljs$core$IFn$_invoke$arity$variadic = (function (v,f,args){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(sci.impl.vars.alter_var_root,v,f,args);
}));

(sci.core.alter_var_root.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(sci.core.alter_var_root.cljs$lang$applyTo = (function (seq93153){
var G__93154 = cljs.core.first(seq93153);
var seq93153__$1 = cljs.core.next(seq93153);
var G__93155 = cljs.core.first(seq93153__$1);
var seq93153__$2 = cljs.core.next(seq93153__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__93154,G__93155,seq93153__$2);
}));

/**
 * Finds or creates a sci var named by the symbol name in the namespace
 *   ns (which can be a symbol or a sci namespace), setting its root
 *   binding to val if supplied. The namespace must exist in the ctx. The
 *   sci var will adopt any metadata from the name symbol.  Returns the
 *   sci var.
 */
sci.core.intern = (function sci$core$intern(var_args){
var G__93171 = arguments.length;
switch (G__93171) {
case 3:
return sci.core.intern.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return sci.core.intern.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(sci.core.intern.cljs$core$IFn$_invoke$arity$3 = (function (ctx,sci_ns,name){
return sci.impl.namespaces.sci_intern.cljs$core$IFn$_invoke$arity$3(ctx,sci_ns,name);
}));

(sci.core.intern.cljs$core$IFn$_invoke$arity$4 = (function (ctx,sci_ns,name,val){
return sci.impl.namespaces.sci_intern.cljs$core$IFn$_invoke$arity$4(ctx,sci_ns,name,val);
}));

(sci.core.intern.cljs$lang$maxFixedArity = 4);

/**
 * Evaluates string `s` as one or multiple Clojure expressions using the Small Clojure Interpreter.
 * 
 *   The map `opts` may contain the following:
 * 
 *   - `:namespaces`: a map of symbols to namespaces, where a namespace
 *   is a map with symbols to values, e.g.: `{'foo.bar {'x 1}}`. These
 *   namespaces can be used with `require`.
 * 
 *   - `:bindings`: `:bindings x` is the same as `:namespaces {'user x}`.
 * 
 *   - `:allow`: a seqable of allowed symbols. All symbols, even those
 *   brought in via `:bindings` or `:namespaces` have to be explicitly
 *   enumerated.
 * 
 *   - `:deny`: a seqable of disallowed symbols, e.g.: `[loop quote
 *   recur]`.
 * 
 *   - `:features`: when provided a non-empty set of keywords, sci will process reader conditionals using these features (e.g. #{:bb}).
 * 
 *   - `:env`: an atom with a map in which state from the
 *   evaluation (defined namespaced and vars) will be persisted for
 *   re-use over multiple calls.
 */
sci.core.eval_string = (function sci$core$eval_string(var_args){
var G__93183 = arguments.length;
switch (G__93183) {
case 1:
return sci.core.eval_string.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return sci.core.eval_string.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(sci.core.eval_string.cljs$core$IFn$_invoke$arity$1 = (function (s){
return sci.core.eval_string.cljs$core$IFn$_invoke$arity$2(s,null);
}));

(sci.core.eval_string.cljs$core$IFn$_invoke$arity$2 = (function (s,opts){
return sci.impl.interpreter.eval_string.cljs$core$IFn$_invoke$arity$2(s,opts);
}));

(sci.core.eval_string.cljs$lang$maxFixedArity = 2);

/**
 * Creates an initial sci context from given options `opts`. The context
 *   can be used with `eval-string*`. See `eval-string` for available
 *   options. The internal organization of the context is implementation
 *   detail and may change in the future.
 */
sci.core.init = (function sci$core$init(opts){
return sci.impl.opts.init(opts);
});
/**
 * Updates a context with opts merged in and returns it.
 */
sci.core.merge_opts = (function sci$core$merge_opts(ctx,opts){
return sci.impl.opts.merge_opts(ctx,opts);
});
/**
 * Forks a context (as produced with `init`) into a new context. Any new
 *   vars created in the new context won't be visible in the original
 *   context.
 */
sci.core.fork = (function sci$core$fork(ctx){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(ctx,new cljs.core.Keyword(null,"env","env",-1815813235),(function (env){
return cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(env));
}));
});
/**
 * Evaluates string `s` in the context of `ctx` (as produced with
 *   `init`).
 */
sci.core.eval_string_STAR_ = (function sci$core$eval_string_STAR_(ctx,s){
return sci.impl.interpreter.eval_string_STAR_(ctx,s);
});
/**
 * Creates namespace object. Can be used in var metadata.
 */
sci.core.create_ns = (function sci$core$create_ns(var_args){
var G__93209 = arguments.length;
switch (G__93209) {
case 1:
return sci.core.create_ns.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return sci.core.create_ns.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(sci.core.create_ns.cljs$core$IFn$_invoke$arity$1 = (function (sym){
return sci.core.create_ns.cljs$core$IFn$_invoke$arity$2(sym,null);
}));

(sci.core.create_ns.cljs$core$IFn$_invoke$arity$2 = (function (sym,meta){
return sci.impl.vars.__GT_SciNamespace(sym,meta);
}));

(sci.core.create_ns.cljs$lang$maxFixedArity = 2);

/**
 * Parses string `s` in the context of `ctx` (as produced with
 *   `init`).
 */
sci.core.parse_string = (function sci$core$parse_string(ctx,s){
return sci.impl.parser.parse_string(ctx,s);
});
/**
 * Coerces x into indexing pushback-reader to be used with
 *   parse-next. Accepts: string or java.io.Reader.
 */
sci.core.reader = (function sci$core$reader(x){
return sci.impl.parser.reader(x);
});
sci.core.get_line_number = (function sci$core$get_line_number(reader){
return sci.impl.parser.get_line_number(reader);
});
sci.core.get_column_number = (function sci$core$get_column_number(reader){
return sci.impl.parser.get_column_number(reader);
});
/**
 * Parses next form from reader
 */
sci.core.parse_next = (function sci$core$parse_next(var_args){
var G__93228 = arguments.length;
switch (G__93228) {
case 2:
return sci.core.parse_next.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return sci.core.parse_next.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(sci.core.parse_next.cljs$core$IFn$_invoke$arity$2 = (function (ctx,reader){
return sci.core.parse_next.cljs$core$IFn$_invoke$arity$3(ctx,reader,cljs.core.PersistentArrayMap.EMPTY);
}));

(sci.core.parse_next.cljs$core$IFn$_invoke$arity$3 = (function (ctx,reader,opts){
var v = sci.impl.parser.parse_next.cljs$core$IFn$_invoke$arity$3(ctx,reader,opts);
if(cljs.core.keyword_identical_QMARK_(new cljs.core.Keyword("sci.impl.parser.edamame","eof","sci.impl.parser.edamame/eof",-917261517),v)){
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(opts,new cljs.core.Keyword(null,"eof","eof",-489063237));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword("sci.core","eof","sci.core/eof",-808584945);
}
} else {
return v;
}
}));

(sci.core.parse_next.cljs$lang$maxFixedArity = 3);

/**
 * Evaluates form (as produced by `parse-string` or `parse-next`) in the
 *   context of `ctx` (as produced with `init`). To allow namespace
 *   switches, establish root binding of `sci/ns` with `sci/binding` or
 *   `sci/with-bindings.`
 */
sci.core.eval_form = (function sci$core$eval_form(ctx,form){
var ctx__$1 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ctx,new cljs.core.Keyword(null,"id","id",-1388402092),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(ctx);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.gensym.cljs$core$IFn$_invoke$arity$0();
}
})());
return sci.impl.interpreter.eval_form(ctx__$1,form);
});
/**
 * Returns list of stacktrace element maps from exception, if available.
 */
sci.core.stacktrace = (function sci$core$stacktrace(ex){
var G__93240 = ex;
var G__93240__$1 = (((G__93240 == null))?null:cljs.core.ex_data(G__93240));
var G__93240__$2 = (((G__93240__$1 == null))?null:new cljs.core.Keyword("sci.impl","callstack","sci.impl/callstack",-1621010557).cljs$core$IFn$_invoke$arity$1(G__93240__$1));
if((G__93240__$2 == null)){
return null;
} else {
return sci.impl.callstack.stacktrace(G__93240__$2);
}
});
/**
 * Returns a list of formatted stack trace elements as strings from stacktrace.
 */
sci.core.format_stacktrace = (function sci$core$format_stacktrace(stacktrace){
return sci.impl.callstack.format_stacktrace(stacktrace);
});
/**
 * Returns name of SCI ns as symbol.
 */
sci.core.ns_name = (function sci$core$ns_name(sci_ns){
return sci.impl.namespaces.sci_ns_name(sci_ns);
});
sci.core._copy_ns = (function sci$core$_copy_ns(ns_publics_map,sci_ns){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ns_map,p__93253){
var vec__93254 = p__93253;
var var_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93254,(0),null);
var var$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93254,(1),null);
var m = new cljs.core.Keyword(null,"meta","meta",1499536964).cljs$core$IFn$_invoke$arity$1(var$);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ns_map,var_name,sci.core.new_var.cljs$core$IFn$_invoke$arity$3(cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(var_name),new cljs.core.Keyword(null,"val","val",128701612).cljs$core$IFn$_invoke$arity$1(var$),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m,new cljs.core.Keyword(null,"ns","ns",441598760),sci_ns)));
}),cljs.core.PersistentArrayMap.EMPTY,ns_publics_map);
});
sci.core.process_publics = (function sci$core$process_publics(publics,p__93258){
var map__93260 = p__93258;
var map__93260__$1 = cljs.core.__destructure_map(map__93260);
var exclude = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93260__$1,new cljs.core.Keyword(null,"exclude","exclude",-1230250334));
var publics__$1 = (cljs.core.truth_(exclude)?cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.dissoc,publics,exclude):publics);
return publics__$1;
});
sci.core.exclude_when_meta = (function sci$core$exclude_when_meta(publics_map,meta_fn,key_fn,val_fn,skip_keys){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ns_map,p__93261){
var vec__93266 = p__93261;
var var_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93266,(0),null);
var var$ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__93266,(1),null);
var m = (meta_fn.cljs$core$IFn$_invoke$arity$1 ? meta_fn.cljs$core$IFn$_invoke$arity$1(var$) : meta_fn.call(null,var$));
if(cljs.core.truth_(cljs.core.some(m,skip_keys))){
return ns_map;
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ns_map,(key_fn.cljs$core$IFn$_invoke$arity$1 ? key_fn.cljs$core$IFn$_invoke$arity$1(var_name) : key_fn.call(null,var_name)),(val_fn.cljs$core$IFn$_invoke$arity$2 ? val_fn.cljs$core$IFn$_invoke$arity$2(var$,m) : val_fn.call(null,var$,m)));
}
}),cljs.core.PersistentArrayMap.EMPTY,publics_map);
});
sci.core.meta_fn = (function sci$core$meta_fn(opts){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"all","all",892129742),opts)){
return cljs.core.identity;
} else {
if(cljs.core.truth_(opts)){
return (function (p1__93271_SHARP_){
return cljs.core.select_keys(p1__93271_SHARP_,opts);
});
} else {
return (function (p1__93272_SHARP_){
return cljs.core.select_keys(p1__93272_SHARP_,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"arglists","arglists",1661989754),new cljs.core.Keyword(null,"no-doc","no-doc",1559921891),new cljs.core.Keyword(null,"macro","macro",-867863404),new cljs.core.Keyword(null,"doc","doc",1913296891)], null));
});

}
}
});

//# sourceMappingURL=sci.core.js.map
