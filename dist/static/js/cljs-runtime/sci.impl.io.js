goog.provide('sci.impl.io');
/**
 * create a dynamic var with clojure.core :ns meta
 */
sci.impl.io.core_dynamic_var = (function sci$impl$io$core_dynamic_var(var_args){
var G__85747 = arguments.length;
switch (G__85747) {
case 1:
return sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$1 = (function (name){
return sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$2(name,null);
}));

(sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$2 = (function (name,init_val){
return sci.impl.vars.dynamic_var.cljs$core$IFn$_invoke$arity$3(name,init_val,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ns","ns",441598760),sci.impl.vars.clojure_core_ns], null));
}));

(sci.impl.io.core_dynamic_var.cljs$lang$maxFixedArity = 2);

sci.impl.io.in$ = (function (){var _STAR_unrestricted_STAR__orig_val__85751 = sci.impl.unrestrict._STAR_unrestricted_STAR_;
var _STAR_unrestricted_STAR__temp_val__85752 = true;
(sci.impl.unrestrict._STAR_unrestricted_STAR_ = _STAR_unrestricted_STAR__temp_val__85752);

try{var G__85753 = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$1(new cljs.core.Symbol(null,"*in*","*in*",1130010229,null));
sci.impl.vars.unbind(G__85753);

return G__85753;
}finally {(sci.impl.unrestrict._STAR_unrestricted_STAR_ = _STAR_unrestricted_STAR__orig_val__85751);
}})();
sci.impl.io.out = (function (){var _STAR_unrestricted_STAR__orig_val__85754 = sci.impl.unrestrict._STAR_unrestricted_STAR_;
var _STAR_unrestricted_STAR__temp_val__85755 = true;
(sci.impl.unrestrict._STAR_unrestricted_STAR_ = _STAR_unrestricted_STAR__temp_val__85755);

try{var G__85756 = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$1(new cljs.core.Symbol(null,"*out*","*out*",1277591796,null));
sci.impl.vars.unbind(G__85756);

return G__85756;
}finally {(sci.impl.unrestrict._STAR_unrestricted_STAR_ = _STAR_unrestricted_STAR__orig_val__85754);
}})();
sci.impl.io.err = (function (){var _STAR_unrestricted_STAR__orig_val__85757 = sci.impl.unrestrict._STAR_unrestricted_STAR_;
var _STAR_unrestricted_STAR__temp_val__85758 = true;
(sci.impl.unrestrict._STAR_unrestricted_STAR_ = _STAR_unrestricted_STAR__temp_val__85758);

try{var G__85759 = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$1(new cljs.core.Symbol(null,"*err*","*err*",2070937226,null));
sci.impl.vars.unbind(G__85759);

return G__85759;
}finally {(sci.impl.unrestrict._STAR_unrestricted_STAR_ = _STAR_unrestricted_STAR__orig_val__85757);
}})();
sci.impl.io.print_fn = (function (){var _STAR_unrestricted_STAR__orig_val__85760 = sci.impl.unrestrict._STAR_unrestricted_STAR_;
var _STAR_unrestricted_STAR__temp_val__85761 = true;
(sci.impl.unrestrict._STAR_unrestricted_STAR_ = _STAR_unrestricted_STAR__temp_val__85761);

try{var G__85762 = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$1(new cljs.core.Symbol(null,"*print-fn*","*print-fn*",138509853,null));
sci.impl.vars.unbind(G__85762);

return G__85762;
}finally {(sci.impl.unrestrict._STAR_unrestricted_STAR_ = _STAR_unrestricted_STAR__orig_val__85760);
}})();
sci.impl.io.print_meta = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"*print-meta*","*print-meta*",-919406644,null),false);
sci.impl.io.print_length = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$1(new cljs.core.Symbol(null,"*print-length*","*print-length*",-687693654,null));
sci.impl.io.print_level = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$1(new cljs.core.Symbol(null,"*print-level*","*print-level*",-634488505,null));
sci.impl.io.print_namespace_maps = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"*print-namespace-maps*","*print-namespace-maps*",-1759108415,null),true);
sci.impl.io.flush_on_newline = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"*flush-on-newline*","*flush-on-newline*",-737526501,null),cljs.core._STAR_flush_on_newline_STAR_);
sci.impl.io.print_readably = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"*print-readably*","*print-readably*",-761361221,null),cljs.core._STAR_print_readably_STAR_);
sci.impl.io.print_newline = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"*print-newline*","*print-newline*",1478078956,null),cljs.core._STAR_print_newline_STAR_);
sci.impl.io.string_print = (function sci$impl$io$string_print(x){
var _STAR_print_fn_STAR__orig_val__85763 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_fn_STAR__temp_val__85764 = cljs.core.deref(sci.impl.io.print_fn);
(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__85764);

try{return cljs.core.string_print(x);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__85763);
}});
sci.impl.io.pr = (function sci$impl$io$pr(var_args){
var args__5732__auto__ = [];
var len__5726__auto___86035 = arguments.length;
var i__5727__auto___86038 = (0);
while(true){
if((i__5727__auto___86038 < len__5726__auto___86035)){
args__5732__auto__.push((arguments[i__5727__auto___86038]));

var G__86039 = (i__5727__auto___86038 + (1));
i__5727__auto___86038 = G__86039;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return sci.impl.io.pr.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(sci.impl.io.pr.cljs$core$IFn$_invoke$arity$variadic = (function (objs){
var _STAR_print_fn_STAR__orig_val__85773 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_length_STAR__orig_val__85774 = cljs.core._STAR_print_length_STAR_;
var _STAR_print_level_STAR__orig_val__85775 = cljs.core._STAR_print_level_STAR_;
var _STAR_print_meta_STAR__orig_val__85776 = cljs.core._STAR_print_meta_STAR_;
var _STAR_print_namespace_maps_STAR__orig_val__85777 = cljs.core._STAR_print_namespace_maps_STAR_;
var _STAR_print_readably_STAR__orig_val__85778 = cljs.core._STAR_print_readably_STAR_;
var _STAR_print_newline_STAR__orig_val__85779 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__temp_val__85780 = cljs.core.deref(sci.impl.io.print_fn);
var _STAR_print_length_STAR__temp_val__85781 = cljs.core.deref(sci.impl.io.print_length);
var _STAR_print_level_STAR__temp_val__85782 = cljs.core.deref(sci.impl.io.print_level);
var _STAR_print_meta_STAR__temp_val__85783 = cljs.core.deref(sci.impl.io.print_meta);
var _STAR_print_namespace_maps_STAR__temp_val__85784 = cljs.core.deref(sci.impl.io.print_namespace_maps);
var _STAR_print_readably_STAR__temp_val__85785 = cljs.core.deref(sci.impl.io.print_readably);
var _STAR_print_newline_STAR__temp_val__85786 = cljs.core.deref(sci.impl.io.print_newline);
(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__85780);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__temp_val__85781);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__temp_val__85782);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__temp_val__85783);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__temp_val__85784);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__temp_val__85785);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__85786);

try{return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.pr,objs);
}finally {(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__85779);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__orig_val__85778);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__orig_val__85777);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__orig_val__85776);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__orig_val__85775);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__orig_val__85774);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__85773);
}}));

(sci.impl.io.pr.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(sci.impl.io.pr.cljs$lang$applyTo = (function (seq85768){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq85768));
}));

sci.impl.io.flush = (function sci$impl$io$flush(){
return null;
});
sci.impl.io.newline = (function sci$impl$io$newline(){
var _STAR_print_fn_STAR__orig_val__85808 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_fn_STAR__temp_val__85809 = cljs.core.deref(sci.impl.io.print_fn);
(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__85809);

try{return cljs.core.newline.cljs$core$IFn$_invoke$arity$0();
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__85808);
}});
/**
 * pr to a string, returning it
 */
sci.impl.io.pr_str = (function sci$impl$io$pr_str(var_args){
var args__5732__auto__ = [];
var len__5726__auto___86042 = arguments.length;
var i__5727__auto___86043 = (0);
while(true){
if((i__5727__auto___86043 < len__5726__auto___86042)){
args__5732__auto__.push((arguments[i__5727__auto___86043]));

var G__86044 = (i__5727__auto___86043 + (1));
i__5727__auto___86043 = G__86044;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return sci.impl.io.pr_str.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(sci.impl.io.pr_str.cljs$core$IFn$_invoke$arity$variadic = (function (objs){
var _STAR_print_length_STAR__orig_val__85867 = cljs.core._STAR_print_length_STAR_;
var _STAR_print_level_STAR__orig_val__85868 = cljs.core._STAR_print_level_STAR_;
var _STAR_print_meta_STAR__orig_val__85869 = cljs.core._STAR_print_meta_STAR_;
var _STAR_print_namespace_maps_STAR__orig_val__85870 = cljs.core._STAR_print_namespace_maps_STAR_;
var _STAR_print_readably_STAR__orig_val__85871 = cljs.core._STAR_print_readably_STAR_;
var _STAR_print_newline_STAR__orig_val__85872 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_length_STAR__temp_val__85873 = cljs.core.deref(sci.impl.io.print_length);
var _STAR_print_level_STAR__temp_val__85874 = cljs.core.deref(sci.impl.io.print_level);
var _STAR_print_meta_STAR__temp_val__85875 = cljs.core.deref(sci.impl.io.print_meta);
var _STAR_print_namespace_maps_STAR__temp_val__85876 = cljs.core.deref(sci.impl.io.print_namespace_maps);
var _STAR_print_readably_STAR__temp_val__85877 = cljs.core.deref(sci.impl.io.print_readably);
var _STAR_print_newline_STAR__temp_val__85878 = cljs.core.deref(sci.impl.io.print_newline);
(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__temp_val__85873);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__temp_val__85874);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__temp_val__85875);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__temp_val__85876);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__temp_val__85877);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__85878);

try{return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.pr_str,objs);
}finally {(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__85872);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__orig_val__85871);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__orig_val__85870);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__orig_val__85869);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__orig_val__85868);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__orig_val__85867);
}}));

(sci.impl.io.pr_str.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(sci.impl.io.pr_str.cljs$lang$applyTo = (function (seq85822){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq85822));
}));

sci.impl.io.prn = (function sci$impl$io$prn(var_args){
var args__5732__auto__ = [];
var len__5726__auto___86049 = arguments.length;
var i__5727__auto___86050 = (0);
while(true){
if((i__5727__auto___86050 < len__5726__auto___86049)){
args__5732__auto__.push((arguments[i__5727__auto___86050]));

var G__86051 = (i__5727__auto___86050 + (1));
i__5727__auto___86050 = G__86051;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return sci.impl.io.prn.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(sci.impl.io.prn.cljs$core$IFn$_invoke$arity$variadic = (function (objs){
var _STAR_print_fn_STAR__orig_val__85913 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_length_STAR__orig_val__85914 = cljs.core._STAR_print_length_STAR_;
var _STAR_print_level_STAR__orig_val__85915 = cljs.core._STAR_print_level_STAR_;
var _STAR_print_meta_STAR__orig_val__85916 = cljs.core._STAR_print_meta_STAR_;
var _STAR_print_namespace_maps_STAR__orig_val__85917 = cljs.core._STAR_print_namespace_maps_STAR_;
var _STAR_print_readably_STAR__orig_val__85918 = cljs.core._STAR_print_readably_STAR_;
var _STAR_print_newline_STAR__orig_val__85919 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__temp_val__85920 = cljs.core.deref(sci.impl.io.print_fn);
var _STAR_print_length_STAR__temp_val__85921 = cljs.core.deref(sci.impl.io.print_length);
var _STAR_print_level_STAR__temp_val__85922 = cljs.core.deref(sci.impl.io.print_level);
var _STAR_print_meta_STAR__temp_val__85923 = cljs.core.deref(sci.impl.io.print_meta);
var _STAR_print_namespace_maps_STAR__temp_val__85924 = cljs.core.deref(sci.impl.io.print_namespace_maps);
var _STAR_print_readably_STAR__temp_val__85925 = cljs.core.deref(sci.impl.io.print_readably);
var _STAR_print_newline_STAR__temp_val__85926 = cljs.core.deref(sci.impl.io.print_newline);
(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__85920);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__temp_val__85921);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__temp_val__85922);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__temp_val__85923);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__temp_val__85924);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__temp_val__85925);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__85926);

try{return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.prn,objs);
}finally {(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__85919);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__orig_val__85918);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__orig_val__85917);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__orig_val__85916);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__orig_val__85915);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__orig_val__85914);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__85913);
}}));

(sci.impl.io.prn.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(sci.impl.io.prn.cljs$lang$applyTo = (function (seq85905){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq85905));
}));

/**
 * prn to a string, returning it
 */
sci.impl.io.prn_str = (function sci$impl$io$prn_str(var_args){
var args__5732__auto__ = [];
var len__5726__auto___86054 = arguments.length;
var i__5727__auto___86055 = (0);
while(true){
if((i__5727__auto___86055 < len__5726__auto___86054)){
args__5732__auto__.push((arguments[i__5727__auto___86055]));

var G__86056 = (i__5727__auto___86055 + (1));
i__5727__auto___86055 = G__86056;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return sci.impl.io.prn_str.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(sci.impl.io.prn_str.cljs$core$IFn$_invoke$arity$variadic = (function (objs){
var _STAR_print_length_STAR__orig_val__85936 = cljs.core._STAR_print_length_STAR_;
var _STAR_print_level_STAR__orig_val__85937 = cljs.core._STAR_print_level_STAR_;
var _STAR_print_meta_STAR__orig_val__85938 = cljs.core._STAR_print_meta_STAR_;
var _STAR_print_namespace_maps_STAR__orig_val__85939 = cljs.core._STAR_print_namespace_maps_STAR_;
var _STAR_print_readably_STAR__orig_val__85940 = cljs.core._STAR_print_readably_STAR_;
var _STAR_print_newline_STAR__orig_val__85941 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_length_STAR__temp_val__85942 = cljs.core.deref(sci.impl.io.print_length);
var _STAR_print_level_STAR__temp_val__85943 = cljs.core.deref(sci.impl.io.print_level);
var _STAR_print_meta_STAR__temp_val__85944 = cljs.core.deref(sci.impl.io.print_meta);
var _STAR_print_namespace_maps_STAR__temp_val__85945 = cljs.core.deref(sci.impl.io.print_namespace_maps);
var _STAR_print_readably_STAR__temp_val__85946 = cljs.core.deref(sci.impl.io.print_readably);
var _STAR_print_newline_STAR__temp_val__85947 = cljs.core.deref(sci.impl.io.print_newline);
(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__temp_val__85942);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__temp_val__85943);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__temp_val__85944);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__temp_val__85945);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__temp_val__85946);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__85947);

try{return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.prn_str,objs);
}finally {(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__85941);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__orig_val__85940);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__orig_val__85939);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__orig_val__85938);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__orig_val__85937);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__orig_val__85936);
}}));

(sci.impl.io.prn_str.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(sci.impl.io.prn_str.cljs$lang$applyTo = (function (seq85930){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq85930));
}));

sci.impl.io.print = (function sci$impl$io$print(var_args){
var args__5732__auto__ = [];
var len__5726__auto___86059 = arguments.length;
var i__5727__auto___86060 = (0);
while(true){
if((i__5727__auto___86060 < len__5726__auto___86059)){
args__5732__auto__.push((arguments[i__5727__auto___86060]));

var G__86061 = (i__5727__auto___86060 + (1));
i__5727__auto___86060 = G__86061;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return sci.impl.io.print.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(sci.impl.io.print.cljs$core$IFn$_invoke$arity$variadic = (function (objs){
var _STAR_print_fn_STAR__orig_val__85950 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_length_STAR__orig_val__85951 = cljs.core._STAR_print_length_STAR_;
var _STAR_print_level_STAR__orig_val__85952 = cljs.core._STAR_print_level_STAR_;
var _STAR_print_namespace_maps_STAR__orig_val__85953 = cljs.core._STAR_print_namespace_maps_STAR_;
var _STAR_print_readably_STAR__orig_val__85954 = cljs.core._STAR_print_readably_STAR_;
var _STAR_print_newline_STAR__orig_val__85955 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__temp_val__85956 = cljs.core.deref(sci.impl.io.print_fn);
var _STAR_print_length_STAR__temp_val__85957 = cljs.core.deref(sci.impl.io.print_length);
var _STAR_print_level_STAR__temp_val__85958 = cljs.core.deref(sci.impl.io.print_level);
var _STAR_print_namespace_maps_STAR__temp_val__85959 = cljs.core.deref(sci.impl.io.print_namespace_maps);
var _STAR_print_readably_STAR__temp_val__85960 = null;
var _STAR_print_newline_STAR__temp_val__85961 = cljs.core.deref(sci.impl.io.print_newline);
(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__85956);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__temp_val__85957);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__temp_val__85958);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__temp_val__85959);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__temp_val__85960);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__85961);

try{return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.print,objs);
}finally {(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__85955);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__orig_val__85954);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__orig_val__85953);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__orig_val__85952);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__orig_val__85951);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__85950);
}}));

(sci.impl.io.print.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(sci.impl.io.print.cljs$lang$applyTo = (function (seq85949){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq85949));
}));

/**
 * print to a string, returning it
 */
sci.impl.io.print_str = (function sci$impl$io$print_str(var_args){
var args__5732__auto__ = [];
var len__5726__auto___86064 = arguments.length;
var i__5727__auto___86065 = (0);
while(true){
if((i__5727__auto___86065 < len__5726__auto___86064)){
args__5732__auto__.push((arguments[i__5727__auto___86065]));

var G__86066 = (i__5727__auto___86065 + (1));
i__5727__auto___86065 = G__86066;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return sci.impl.io.print_str.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(sci.impl.io.print_str.cljs$core$IFn$_invoke$arity$variadic = (function (objs){
var _STAR_print_length_STAR__orig_val__85974 = cljs.core._STAR_print_length_STAR_;
var _STAR_print_level_STAR__orig_val__85975 = cljs.core._STAR_print_level_STAR_;
var _STAR_print_meta_STAR__orig_val__85976 = cljs.core._STAR_print_meta_STAR_;
var _STAR_print_namespace_maps_STAR__orig_val__85977 = cljs.core._STAR_print_namespace_maps_STAR_;
var _STAR_print_readably_STAR__orig_val__85978 = cljs.core._STAR_print_readably_STAR_;
var _STAR_print_newline_STAR__orig_val__85979 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_length_STAR__temp_val__85980 = cljs.core.deref(sci.impl.io.print_length);
var _STAR_print_level_STAR__temp_val__85981 = cljs.core.deref(sci.impl.io.print_level);
var _STAR_print_meta_STAR__temp_val__85982 = cljs.core.deref(sci.impl.io.print_meta);
var _STAR_print_namespace_maps_STAR__temp_val__85983 = cljs.core.deref(sci.impl.io.print_namespace_maps);
var _STAR_print_readably_STAR__temp_val__85984 = cljs.core.deref(sci.impl.io.print_readably);
var _STAR_print_newline_STAR__temp_val__85985 = cljs.core.deref(sci.impl.io.print_newline);
(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__temp_val__85980);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__temp_val__85981);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__temp_val__85982);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__temp_val__85983);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__temp_val__85984);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__85985);

try{return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.print_str,objs);
}finally {(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__85979);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__orig_val__85978);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__orig_val__85977);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__orig_val__85976);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__orig_val__85975);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__orig_val__85974);
}}));

(sci.impl.io.print_str.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(sci.impl.io.print_str.cljs$lang$applyTo = (function (seq85968){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq85968));
}));

sci.impl.io.println = (function sci$impl$io$println(var_args){
var args__5732__auto__ = [];
var len__5726__auto___86068 = arguments.length;
var i__5727__auto___86069 = (0);
while(true){
if((i__5727__auto___86069 < len__5726__auto___86068)){
args__5732__auto__.push((arguments[i__5727__auto___86069]));

var G__86070 = (i__5727__auto___86069 + (1));
i__5727__auto___86069 = G__86070;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return sci.impl.io.println.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(sci.impl.io.println.cljs$core$IFn$_invoke$arity$variadic = (function (objs){
var _STAR_print_fn_STAR__orig_val__86002 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_length_STAR__orig_val__86003 = cljs.core._STAR_print_length_STAR_;
var _STAR_print_level_STAR__orig_val__86004 = cljs.core._STAR_print_level_STAR_;
var _STAR_print_meta_STAR__orig_val__86005 = cljs.core._STAR_print_meta_STAR_;
var _STAR_print_namespace_maps_STAR__orig_val__86006 = cljs.core._STAR_print_namespace_maps_STAR_;
var _STAR_print_readably_STAR__orig_val__86007 = cljs.core._STAR_print_readably_STAR_;
var _STAR_print_newline_STAR__orig_val__86008 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__temp_val__86009 = cljs.core.deref(sci.impl.io.print_fn);
var _STAR_print_length_STAR__temp_val__86010 = cljs.core.deref(sci.impl.io.print_length);
var _STAR_print_level_STAR__temp_val__86011 = cljs.core.deref(sci.impl.io.print_level);
var _STAR_print_meta_STAR__temp_val__86012 = cljs.core.deref(sci.impl.io.print_meta);
var _STAR_print_namespace_maps_STAR__temp_val__86013 = cljs.core.deref(sci.impl.io.print_namespace_maps);
var _STAR_print_readably_STAR__temp_val__86014 = cljs.core.deref(sci.impl.io.print_readably);
var _STAR_print_newline_STAR__temp_val__86015 = cljs.core.deref(sci.impl.io.print_newline);
(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__86009);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__temp_val__86010);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__temp_val__86011);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__temp_val__86012);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__temp_val__86013);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__temp_val__86014);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__86015);

try{return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.println,objs);
}finally {(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__86008);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__orig_val__86007);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__orig_val__86006);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__orig_val__86005);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__orig_val__86004);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__orig_val__86003);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__86002);
}}));

(sci.impl.io.println.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(sci.impl.io.println.cljs$lang$applyTo = (function (seq86001){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq86001));
}));

sci.impl.io.with_out_str = (function sci$impl$io$with_out_str(var_args){
var args__5732__auto__ = [];
var len__5726__auto___86073 = arguments.length;
var i__5727__auto___86074 = (0);
while(true){
if((i__5727__auto___86074 < len__5726__auto___86073)){
args__5732__auto__.push((arguments[i__5727__auto___86074]));

var G__86075 = (i__5727__auto___86074 + (1));
i__5727__auto___86074 = G__86075;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return sci.impl.io.with_out_str.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(sci.impl.io.with_out_str.cljs$core$IFn$_invoke$arity$variadic = (function (_,___$1,body){
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","let","cljs.core/let",-308701135,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"s__86020__auto__","s__86020__auto__",721062387,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"new","new",-444906321,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"goog.string.StringBuffer","goog.string.StringBuffer",-1220229842,null),null,(1),null))))),null,(1),null)))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","binding","cljs.core/binding",2050379843,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","*print-newline*","cljs.core/*print-newline*",6231625,null),null,(1),null)),(new cljs.core.List(null,true,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Symbol("cljs.core","*print-fn*","cljs.core/*print-fn*",1342365176,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","fn","cljs.core/fn",-1065745098,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$1((new cljs.core.List(null,new cljs.core.Symbol(null,"x__86021__auto__","x__86021__auto__",-714928548,null),null,(1),null)))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,".",".",1975675962,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"s__86020__auto__","s__86020__auto__",721062387,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,sci.impl.utils.allowed_append,null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"x__86021__auto__","x__86021__auto__",-714928548,null),null,(1),null))], 0)))),null,(1),null))], 0)))),null,(1),null))], 0))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([body,(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","str","cljs.core/str",-1971828991,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"s__86020__auto__","s__86020__auto__",721062387,null),null,(1),null))))),null,(1),null))], 0)))),null,(1),null))], 0))));
}));

(sci.impl.io.with_out_str.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(sci.impl.io.with_out_str.cljs$lang$applyTo = (function (seq86022){
var G__86023 = cljs.core.first(seq86022);
var seq86022__$1 = cljs.core.next(seq86022);
var G__86024 = cljs.core.first(seq86022__$1);
var seq86022__$2 = cljs.core.next(seq86022__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__86023,G__86024,seq86022__$2);
}));


//# sourceMappingURL=sci.impl.io.js.map
