goog.provide('sci.impl.io');
/**
 * create a dynamic var with clojure.core :ns meta
 */
sci.impl.io.core_dynamic_var = (function sci$impl$io$core_dynamic_var(var_args){
var G__79409 = arguments.length;
switch (G__79409) {
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

sci.impl.io.in$ = (function (){var _STAR_unrestricted_STAR__orig_val__79415 = sci.impl.unrestrict._STAR_unrestricted_STAR_;
var _STAR_unrestricted_STAR__temp_val__79416 = true;
(sci.impl.unrestrict._STAR_unrestricted_STAR_ = _STAR_unrestricted_STAR__temp_val__79416);

try{var G__79418 = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$1(new cljs.core.Symbol(null,"*in*","*in*",1130010229,null));
sci.impl.vars.unbind(G__79418);

return G__79418;
}finally {(sci.impl.unrestrict._STAR_unrestricted_STAR_ = _STAR_unrestricted_STAR__orig_val__79415);
}})();
sci.impl.io.out = (function (){var _STAR_unrestricted_STAR__orig_val__79419 = sci.impl.unrestrict._STAR_unrestricted_STAR_;
var _STAR_unrestricted_STAR__temp_val__79420 = true;
(sci.impl.unrestrict._STAR_unrestricted_STAR_ = _STAR_unrestricted_STAR__temp_val__79420);

try{var G__79421 = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$1(new cljs.core.Symbol(null,"*out*","*out*",1277591796,null));
sci.impl.vars.unbind(G__79421);

return G__79421;
}finally {(sci.impl.unrestrict._STAR_unrestricted_STAR_ = _STAR_unrestricted_STAR__orig_val__79419);
}})();
sci.impl.io.err = (function (){var _STAR_unrestricted_STAR__orig_val__79422 = sci.impl.unrestrict._STAR_unrestricted_STAR_;
var _STAR_unrestricted_STAR__temp_val__79423 = true;
(sci.impl.unrestrict._STAR_unrestricted_STAR_ = _STAR_unrestricted_STAR__temp_val__79423);

try{var G__79424 = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$1(new cljs.core.Symbol(null,"*err*","*err*",2070937226,null));
sci.impl.vars.unbind(G__79424);

return G__79424;
}finally {(sci.impl.unrestrict._STAR_unrestricted_STAR_ = _STAR_unrestricted_STAR__orig_val__79422);
}})();
sci.impl.io.print_fn = (function (){var _STAR_unrestricted_STAR__orig_val__79427 = sci.impl.unrestrict._STAR_unrestricted_STAR_;
var _STAR_unrestricted_STAR__temp_val__79428 = true;
(sci.impl.unrestrict._STAR_unrestricted_STAR_ = _STAR_unrestricted_STAR__temp_val__79428);

try{var G__79429 = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$1(new cljs.core.Symbol(null,"*print-fn*","*print-fn*",138509853,null));
sci.impl.vars.unbind(G__79429);

return G__79429;
}finally {(sci.impl.unrestrict._STAR_unrestricted_STAR_ = _STAR_unrestricted_STAR__orig_val__79427);
}})();
sci.impl.io.print_meta = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"*print-meta*","*print-meta*",-919406644,null),false);
sci.impl.io.print_length = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$1(new cljs.core.Symbol(null,"*print-length*","*print-length*",-687693654,null));
sci.impl.io.print_level = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$1(new cljs.core.Symbol(null,"*print-level*","*print-level*",-634488505,null));
sci.impl.io.print_namespace_maps = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"*print-namespace-maps*","*print-namespace-maps*",-1759108415,null),true);
sci.impl.io.flush_on_newline = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"*flush-on-newline*","*flush-on-newline*",-737526501,null),cljs.core._STAR_flush_on_newline_STAR_);
sci.impl.io.print_readably = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"*print-readably*","*print-readably*",-761361221,null),cljs.core._STAR_print_readably_STAR_);
sci.impl.io.print_newline = sci.impl.io.core_dynamic_var.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"*print-newline*","*print-newline*",1478078956,null),cljs.core._STAR_print_newline_STAR_);
sci.impl.io.string_print = (function sci$impl$io$string_print(x){
var _STAR_print_fn_STAR__orig_val__79461 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_fn_STAR__temp_val__79462 = cljs.core.deref(sci.impl.io.print_fn);
(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__79462);

try{return cljs.core.string_print(x);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__79461);
}});
sci.impl.io.pr = (function sci$impl$io$pr(var_args){
var args__5732__auto__ = [];
var len__5726__auto___79740 = arguments.length;
var i__5727__auto___79741 = (0);
while(true){
if((i__5727__auto___79741 < len__5726__auto___79740)){
args__5732__auto__.push((arguments[i__5727__auto___79741]));

var G__79742 = (i__5727__auto___79741 + (1));
i__5727__auto___79741 = G__79742;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return sci.impl.io.pr.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(sci.impl.io.pr.cljs$core$IFn$_invoke$arity$variadic = (function (objs){
var _STAR_print_fn_STAR__orig_val__79502 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_length_STAR__orig_val__79503 = cljs.core._STAR_print_length_STAR_;
var _STAR_print_level_STAR__orig_val__79504 = cljs.core._STAR_print_level_STAR_;
var _STAR_print_meta_STAR__orig_val__79505 = cljs.core._STAR_print_meta_STAR_;
var _STAR_print_namespace_maps_STAR__orig_val__79506 = cljs.core._STAR_print_namespace_maps_STAR_;
var _STAR_print_readably_STAR__orig_val__79507 = cljs.core._STAR_print_readably_STAR_;
var _STAR_print_newline_STAR__orig_val__79508 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__temp_val__79509 = cljs.core.deref(sci.impl.io.print_fn);
var _STAR_print_length_STAR__temp_val__79510 = cljs.core.deref(sci.impl.io.print_length);
var _STAR_print_level_STAR__temp_val__79511 = cljs.core.deref(sci.impl.io.print_level);
var _STAR_print_meta_STAR__temp_val__79512 = cljs.core.deref(sci.impl.io.print_meta);
var _STAR_print_namespace_maps_STAR__temp_val__79513 = cljs.core.deref(sci.impl.io.print_namespace_maps);
var _STAR_print_readably_STAR__temp_val__79514 = cljs.core.deref(sci.impl.io.print_readably);
var _STAR_print_newline_STAR__temp_val__79515 = cljs.core.deref(sci.impl.io.print_newline);
(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__79509);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__temp_val__79510);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__temp_val__79511);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__temp_val__79512);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__temp_val__79513);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__temp_val__79514);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__79515);

try{return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.pr,objs);
}finally {(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__79508);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__orig_val__79507);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__orig_val__79506);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__orig_val__79505);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__orig_val__79504);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__orig_val__79503);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__79502);
}}));

(sci.impl.io.pr.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(sci.impl.io.pr.cljs$lang$applyTo = (function (seq79478){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq79478));
}));

sci.impl.io.flush = (function sci$impl$io$flush(){
return null;
});
sci.impl.io.newline = (function sci$impl$io$newline(){
var _STAR_print_fn_STAR__orig_val__79525 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_fn_STAR__temp_val__79526 = cljs.core.deref(sci.impl.io.print_fn);
(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__79526);

try{return cljs.core.newline.cljs$core$IFn$_invoke$arity$0();
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__79525);
}});
/**
 * pr to a string, returning it
 */
sci.impl.io.pr_str = (function sci$impl$io$pr_str(var_args){
var args__5732__auto__ = [];
var len__5726__auto___79753 = arguments.length;
var i__5727__auto___79754 = (0);
while(true){
if((i__5727__auto___79754 < len__5726__auto___79753)){
args__5732__auto__.push((arguments[i__5727__auto___79754]));

var G__79755 = (i__5727__auto___79754 + (1));
i__5727__auto___79754 = G__79755;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return sci.impl.io.pr_str.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(sci.impl.io.pr_str.cljs$core$IFn$_invoke$arity$variadic = (function (objs){
var _STAR_print_length_STAR__orig_val__79531 = cljs.core._STAR_print_length_STAR_;
var _STAR_print_level_STAR__orig_val__79532 = cljs.core._STAR_print_level_STAR_;
var _STAR_print_meta_STAR__orig_val__79533 = cljs.core._STAR_print_meta_STAR_;
var _STAR_print_namespace_maps_STAR__orig_val__79534 = cljs.core._STAR_print_namespace_maps_STAR_;
var _STAR_print_readably_STAR__orig_val__79535 = cljs.core._STAR_print_readably_STAR_;
var _STAR_print_newline_STAR__orig_val__79536 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_length_STAR__temp_val__79537 = cljs.core.deref(sci.impl.io.print_length);
var _STAR_print_level_STAR__temp_val__79538 = cljs.core.deref(sci.impl.io.print_level);
var _STAR_print_meta_STAR__temp_val__79539 = cljs.core.deref(sci.impl.io.print_meta);
var _STAR_print_namespace_maps_STAR__temp_val__79540 = cljs.core.deref(sci.impl.io.print_namespace_maps);
var _STAR_print_readably_STAR__temp_val__79541 = cljs.core.deref(sci.impl.io.print_readably);
var _STAR_print_newline_STAR__temp_val__79542 = cljs.core.deref(sci.impl.io.print_newline);
(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__temp_val__79537);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__temp_val__79538);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__temp_val__79539);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__temp_val__79540);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__temp_val__79541);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__79542);

try{return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.pr_str,objs);
}finally {(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__79536);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__orig_val__79535);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__orig_val__79534);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__orig_val__79533);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__orig_val__79532);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__orig_val__79531);
}}));

(sci.impl.io.pr_str.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(sci.impl.io.pr_str.cljs$lang$applyTo = (function (seq79529){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq79529));
}));

sci.impl.io.prn = (function sci$impl$io$prn(var_args){
var args__5732__auto__ = [];
var len__5726__auto___79765 = arguments.length;
var i__5727__auto___79766 = (0);
while(true){
if((i__5727__auto___79766 < len__5726__auto___79765)){
args__5732__auto__.push((arguments[i__5727__auto___79766]));

var G__79767 = (i__5727__auto___79766 + (1));
i__5727__auto___79766 = G__79767;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return sci.impl.io.prn.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(sci.impl.io.prn.cljs$core$IFn$_invoke$arity$variadic = (function (objs){
var _STAR_print_fn_STAR__orig_val__79547 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_length_STAR__orig_val__79548 = cljs.core._STAR_print_length_STAR_;
var _STAR_print_level_STAR__orig_val__79549 = cljs.core._STAR_print_level_STAR_;
var _STAR_print_meta_STAR__orig_val__79550 = cljs.core._STAR_print_meta_STAR_;
var _STAR_print_namespace_maps_STAR__orig_val__79551 = cljs.core._STAR_print_namespace_maps_STAR_;
var _STAR_print_readably_STAR__orig_val__79552 = cljs.core._STAR_print_readably_STAR_;
var _STAR_print_newline_STAR__orig_val__79553 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__temp_val__79554 = cljs.core.deref(sci.impl.io.print_fn);
var _STAR_print_length_STAR__temp_val__79555 = cljs.core.deref(sci.impl.io.print_length);
var _STAR_print_level_STAR__temp_val__79556 = cljs.core.deref(sci.impl.io.print_level);
var _STAR_print_meta_STAR__temp_val__79557 = cljs.core.deref(sci.impl.io.print_meta);
var _STAR_print_namespace_maps_STAR__temp_val__79558 = cljs.core.deref(sci.impl.io.print_namespace_maps);
var _STAR_print_readably_STAR__temp_val__79559 = cljs.core.deref(sci.impl.io.print_readably);
var _STAR_print_newline_STAR__temp_val__79560 = cljs.core.deref(sci.impl.io.print_newline);
(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__79554);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__temp_val__79555);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__temp_val__79556);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__temp_val__79557);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__temp_val__79558);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__temp_val__79559);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__79560);

try{return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.prn,objs);
}finally {(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__79553);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__orig_val__79552);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__orig_val__79551);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__orig_val__79550);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__orig_val__79549);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__orig_val__79548);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__79547);
}}));

(sci.impl.io.prn.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(sci.impl.io.prn.cljs$lang$applyTo = (function (seq79546){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq79546));
}));

/**
 * prn to a string, returning it
 */
sci.impl.io.prn_str = (function sci$impl$io$prn_str(var_args){
var args__5732__auto__ = [];
var len__5726__auto___79773 = arguments.length;
var i__5727__auto___79774 = (0);
while(true){
if((i__5727__auto___79774 < len__5726__auto___79773)){
args__5732__auto__.push((arguments[i__5727__auto___79774]));

var G__79777 = (i__5727__auto___79774 + (1));
i__5727__auto___79774 = G__79777;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return sci.impl.io.prn_str.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(sci.impl.io.prn_str.cljs$core$IFn$_invoke$arity$variadic = (function (objs){
var _STAR_print_length_STAR__orig_val__79562 = cljs.core._STAR_print_length_STAR_;
var _STAR_print_level_STAR__orig_val__79563 = cljs.core._STAR_print_level_STAR_;
var _STAR_print_meta_STAR__orig_val__79564 = cljs.core._STAR_print_meta_STAR_;
var _STAR_print_namespace_maps_STAR__orig_val__79565 = cljs.core._STAR_print_namespace_maps_STAR_;
var _STAR_print_readably_STAR__orig_val__79566 = cljs.core._STAR_print_readably_STAR_;
var _STAR_print_newline_STAR__orig_val__79567 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_length_STAR__temp_val__79568 = cljs.core.deref(sci.impl.io.print_length);
var _STAR_print_level_STAR__temp_val__79569 = cljs.core.deref(sci.impl.io.print_level);
var _STAR_print_meta_STAR__temp_val__79570 = cljs.core.deref(sci.impl.io.print_meta);
var _STAR_print_namespace_maps_STAR__temp_val__79571 = cljs.core.deref(sci.impl.io.print_namespace_maps);
var _STAR_print_readably_STAR__temp_val__79572 = cljs.core.deref(sci.impl.io.print_readably);
var _STAR_print_newline_STAR__temp_val__79573 = cljs.core.deref(sci.impl.io.print_newline);
(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__temp_val__79568);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__temp_val__79569);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__temp_val__79570);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__temp_val__79571);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__temp_val__79572);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__79573);

try{return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.prn_str,objs);
}finally {(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__79567);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__orig_val__79566);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__orig_val__79565);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__orig_val__79564);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__orig_val__79563);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__orig_val__79562);
}}));

(sci.impl.io.prn_str.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(sci.impl.io.prn_str.cljs$lang$applyTo = (function (seq79561){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq79561));
}));

sci.impl.io.print = (function sci$impl$io$print(var_args){
var args__5732__auto__ = [];
var len__5726__auto___79778 = arguments.length;
var i__5727__auto___79779 = (0);
while(true){
if((i__5727__auto___79779 < len__5726__auto___79778)){
args__5732__auto__.push((arguments[i__5727__auto___79779]));

var G__79780 = (i__5727__auto___79779 + (1));
i__5727__auto___79779 = G__79780;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return sci.impl.io.print.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(sci.impl.io.print.cljs$core$IFn$_invoke$arity$variadic = (function (objs){
var _STAR_print_fn_STAR__orig_val__79596 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_length_STAR__orig_val__79597 = cljs.core._STAR_print_length_STAR_;
var _STAR_print_level_STAR__orig_val__79598 = cljs.core._STAR_print_level_STAR_;
var _STAR_print_namespace_maps_STAR__orig_val__79599 = cljs.core._STAR_print_namespace_maps_STAR_;
var _STAR_print_readably_STAR__orig_val__79600 = cljs.core._STAR_print_readably_STAR_;
var _STAR_print_newline_STAR__orig_val__79601 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__temp_val__79602 = cljs.core.deref(sci.impl.io.print_fn);
var _STAR_print_length_STAR__temp_val__79603 = cljs.core.deref(sci.impl.io.print_length);
var _STAR_print_level_STAR__temp_val__79604 = cljs.core.deref(sci.impl.io.print_level);
var _STAR_print_namespace_maps_STAR__temp_val__79605 = cljs.core.deref(sci.impl.io.print_namespace_maps);
var _STAR_print_readably_STAR__temp_val__79606 = null;
var _STAR_print_newline_STAR__temp_val__79607 = cljs.core.deref(sci.impl.io.print_newline);
(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__79602);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__temp_val__79603);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__temp_val__79604);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__temp_val__79605);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__temp_val__79606);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__79607);

try{return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.print,objs);
}finally {(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__79601);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__orig_val__79600);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__orig_val__79599);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__orig_val__79598);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__orig_val__79597);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__79596);
}}));

(sci.impl.io.print.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(sci.impl.io.print.cljs$lang$applyTo = (function (seq79589){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq79589));
}));

/**
 * print to a string, returning it
 */
sci.impl.io.print_str = (function sci$impl$io$print_str(var_args){
var args__5732__auto__ = [];
var len__5726__auto___79785 = arguments.length;
var i__5727__auto___79786 = (0);
while(true){
if((i__5727__auto___79786 < len__5726__auto___79785)){
args__5732__auto__.push((arguments[i__5727__auto___79786]));

var G__79787 = (i__5727__auto___79786 + (1));
i__5727__auto___79786 = G__79787;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return sci.impl.io.print_str.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(sci.impl.io.print_str.cljs$core$IFn$_invoke$arity$variadic = (function (objs){
var _STAR_print_length_STAR__orig_val__79622 = cljs.core._STAR_print_length_STAR_;
var _STAR_print_level_STAR__orig_val__79623 = cljs.core._STAR_print_level_STAR_;
var _STAR_print_meta_STAR__orig_val__79624 = cljs.core._STAR_print_meta_STAR_;
var _STAR_print_namespace_maps_STAR__orig_val__79625 = cljs.core._STAR_print_namespace_maps_STAR_;
var _STAR_print_readably_STAR__orig_val__79626 = cljs.core._STAR_print_readably_STAR_;
var _STAR_print_newline_STAR__orig_val__79627 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_length_STAR__temp_val__79628 = cljs.core.deref(sci.impl.io.print_length);
var _STAR_print_level_STAR__temp_val__79629 = cljs.core.deref(sci.impl.io.print_level);
var _STAR_print_meta_STAR__temp_val__79630 = cljs.core.deref(sci.impl.io.print_meta);
var _STAR_print_namespace_maps_STAR__temp_val__79631 = cljs.core.deref(sci.impl.io.print_namespace_maps);
var _STAR_print_readably_STAR__temp_val__79632 = cljs.core.deref(sci.impl.io.print_readably);
var _STAR_print_newline_STAR__temp_val__79633 = cljs.core.deref(sci.impl.io.print_newline);
(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__temp_val__79628);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__temp_val__79629);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__temp_val__79630);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__temp_val__79631);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__temp_val__79632);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__79633);

try{return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.print_str,objs);
}finally {(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__79627);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__orig_val__79626);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__orig_val__79625);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__orig_val__79624);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__orig_val__79623);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__orig_val__79622);
}}));

(sci.impl.io.print_str.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(sci.impl.io.print_str.cljs$lang$applyTo = (function (seq79616){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq79616));
}));

sci.impl.io.println = (function sci$impl$io$println(var_args){
var args__5732__auto__ = [];
var len__5726__auto___79789 = arguments.length;
var i__5727__auto___79790 = (0);
while(true){
if((i__5727__auto___79790 < len__5726__auto___79789)){
args__5732__auto__.push((arguments[i__5727__auto___79790]));

var G__79791 = (i__5727__auto___79790 + (1));
i__5727__auto___79790 = G__79791;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return sci.impl.io.println.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(sci.impl.io.println.cljs$core$IFn$_invoke$arity$variadic = (function (objs){
var _STAR_print_fn_STAR__orig_val__79651 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_length_STAR__orig_val__79652 = cljs.core._STAR_print_length_STAR_;
var _STAR_print_level_STAR__orig_val__79653 = cljs.core._STAR_print_level_STAR_;
var _STAR_print_meta_STAR__orig_val__79654 = cljs.core._STAR_print_meta_STAR_;
var _STAR_print_namespace_maps_STAR__orig_val__79655 = cljs.core._STAR_print_namespace_maps_STAR_;
var _STAR_print_readably_STAR__orig_val__79656 = cljs.core._STAR_print_readably_STAR_;
var _STAR_print_newline_STAR__orig_val__79657 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__temp_val__79658 = cljs.core.deref(sci.impl.io.print_fn);
var _STAR_print_length_STAR__temp_val__79659 = cljs.core.deref(sci.impl.io.print_length);
var _STAR_print_level_STAR__temp_val__79660 = cljs.core.deref(sci.impl.io.print_level);
var _STAR_print_meta_STAR__temp_val__79661 = cljs.core.deref(sci.impl.io.print_meta);
var _STAR_print_namespace_maps_STAR__temp_val__79662 = cljs.core.deref(sci.impl.io.print_namespace_maps);
var _STAR_print_readably_STAR__temp_val__79663 = cljs.core.deref(sci.impl.io.print_readably);
var _STAR_print_newline_STAR__temp_val__79664 = cljs.core.deref(sci.impl.io.print_newline);
(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__79658);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__temp_val__79659);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__temp_val__79660);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__temp_val__79661);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__temp_val__79662);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__temp_val__79663);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__79664);

try{return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.println,objs);
}finally {(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__79657);

(cljs.core._STAR_print_readably_STAR_ = _STAR_print_readably_STAR__orig_val__79656);

(cljs.core._STAR_print_namespace_maps_STAR_ = _STAR_print_namespace_maps_STAR__orig_val__79655);

(cljs.core._STAR_print_meta_STAR_ = _STAR_print_meta_STAR__orig_val__79654);

(cljs.core._STAR_print_level_STAR_ = _STAR_print_level_STAR__orig_val__79653);

(cljs.core._STAR_print_length_STAR_ = _STAR_print_length_STAR__orig_val__79652);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__79651);
}}));

(sci.impl.io.println.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(sci.impl.io.println.cljs$lang$applyTo = (function (seq79642){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq79642));
}));

sci.impl.io.with_out_str = (function sci$impl$io$with_out_str(var_args){
var args__5732__auto__ = [];
var len__5726__auto___79802 = arguments.length;
var i__5727__auto___79803 = (0);
while(true){
if((i__5727__auto___79803 < len__5726__auto___79802)){
args__5732__auto__.push((arguments[i__5727__auto___79803]));

var G__79804 = (i__5727__auto___79803 + (1));
i__5727__auto___79803 = G__79804;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return sci.impl.io.with_out_str.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(sci.impl.io.with_out_str.cljs$core$IFn$_invoke$arity$variadic = (function (_,___$1,body){
return cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","let","cljs.core/let",-308701135,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"s__79668__auto__","s__79668__auto__",-1445063347,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol(null,"new","new",-444906321,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"goog.string.StringBuffer","goog.string.StringBuffer",-1220229842,null),null,(1),null))))),null,(1),null)))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","binding","cljs.core/binding",2050379843,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","*print-newline*","cljs.core/*print-newline*",6231625,null),null,(1),null)),(new cljs.core.List(null,true,null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,new cljs.core.Symbol("cljs.core","*print-fn*","cljs.core/*print-fn*",1342365176,null),null,(1),null)),(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","fn","cljs.core/fn",-1065745098,null),null,(1),null)),(new cljs.core.List(null,cljs.core.vec(cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$1((new cljs.core.List(null,new cljs.core.Symbol(null,"x__79669__auto__","x__79669__auto__",716820745,null),null,(1),null)))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$variadic((new cljs.core.List(null,new cljs.core.Symbol(null,".",".",1975675962,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"s__79668__auto__","s__79668__auto__",-1445063347,null),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(new cljs.core.List(null,sci.impl.utils.allowed_append,null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"x__79669__auto__","x__79669__auto__",716820745,null),null,(1),null))], 0)))),null,(1),null))], 0)))),null,(1),null))], 0))))),null,(1),null)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([body,(new cljs.core.List(null,cljs.core.sequence.cljs$core$IFn$_invoke$arity$1(cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2((new cljs.core.List(null,new cljs.core.Symbol("cljs.core","str","cljs.core/str",-1971828991,null),null,(1),null)),(new cljs.core.List(null,new cljs.core.Symbol(null,"s__79668__auto__","s__79668__auto__",-1445063347,null),null,(1),null))))),null,(1),null))], 0)))),null,(1),null))], 0))));
}));

(sci.impl.io.with_out_str.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(sci.impl.io.with_out_str.cljs$lang$applyTo = (function (seq79670){
var G__79671 = cljs.core.first(seq79670);
var seq79670__$1 = cljs.core.next(seq79670);
var G__79672 = cljs.core.first(seq79670__$1);
var seq79670__$2 = cljs.core.next(seq79670__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__79671,G__79672,seq79670__$2);
}));


//# sourceMappingURL=sci.impl.io.js.map
