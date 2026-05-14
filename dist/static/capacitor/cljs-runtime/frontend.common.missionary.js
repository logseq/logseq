goog.provide('frontend.common.missionary');
(missionary.Cancelled.prototype.cljs$core$IPrintWithWriter$ = cljs.core.PROTOCOL_SENTINEL);

(missionary.Cancelled.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (o,w,_opts){
var o__$1 = this;
return cljs.core.write_all.cljs$core$IFn$_invoke$arity$variadic(w,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["#missionary.Cancelled \"",o__$1.message,"\""], 0));
}));
/**
 * ensure f is a continuous flow
 */
frontend.common.missionary.continue_flow = (function frontend$common$missionary$continue_flow(var_args){
var G__63413 = arguments.length;
switch (G__63413) {
case 1:
return frontend.common.missionary.continue_flow.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.common.missionary.continue_flow.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.common.missionary.continue_flow.cljs$core$IFn$_invoke$arity$1 = (function (f){
return frontend.common.missionary.continue_flow.cljs$core$IFn$_invoke$arity$2(null,f);
}));

(frontend.common.missionary.continue_flow.cljs$core$IFn$_invoke$arity$2 = (function (init_value,f){
return missionary.core.latest.cljs$core$IFn$_invoke$arity$variadic(cljs.core.identity,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([missionary.core.reductions.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,init_value,f)], 0));
}));

(frontend.common.missionary.continue_flow.cljs$lang$maxFixedArity = 2);

/**
 * Return a flow which is mixed by `flows`
 */
frontend.common.missionary.mix = (function frontend$common$missionary$mix(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64483 = arguments.length;
var i__5727__auto___64484 = (0);
while(true){
if((i__5727__auto___64484 < len__5726__auto___64483)){
args__5732__auto__.push((arguments[i__5727__auto___64484]));

var G__64485 = (i__5727__auto___64484 + (1));
i__5727__auto___64484 = G__64485;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.common.missionary.mix.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.common.missionary.mix.cljs$core$IFn$_invoke$arity$variadic = (function (flows){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr63422_block_0 = (function frontend$common$missionary$cr63422_block_0(cr63422_state){
try{var cr63422_place_0 = (1);
var cr63422_place_1 = cljs.core.count;
var cr63422_place_2 = flows;
var cr63422_place_3 = (function (){var G__63520 = cr63422_place_2;
var fexpr__63519 = cr63422_place_1;
return (fexpr__63519.cljs$core$IFn$_invoke$arity$1 ? fexpr__63519.cljs$core$IFn$_invoke$arity$1(G__63520) : fexpr__63519.call(null,G__63520));
})();
var cr63422_place_4 = missionary.core.seed;
var cr63422_place_5 = flows;
var cr63422_place_6 = (function (){var G__63522 = cr63422_place_5;
var fexpr__63521 = cr63422_place_4;
return (fexpr__63521.cljs$core$IFn$_invoke$arity$1 ? fexpr__63521.cljs$core$IFn$_invoke$arity$1(G__63522) : fexpr__63521.call(null,G__63522));
})();
(cr63422_state[(0)] = cr63422_block_1);

(cr63422_state[(1)] = cr63422_place_0);

return missionary.core.fork(cr63422_place_3,cr63422_place_6);
}catch (e63517){var cr63422_exception = e63517;
(cr63422_state[(0)] = null);

throw cr63422_exception;
}});
var cr63422_block_1 = (function frontend$common$missionary$cr63422_block_1(cr63422_state){
try{var cr63422_place_0 = (cr63422_state[(1)]);
var cr63422_place_7 = missionary.core.unpark();
(cr63422_state[(0)] = cr63422_block_2);

(cr63422_state[(1)] = null);

return missionary.core.fork(cr63422_place_0,cr63422_place_7);
}catch (e63523){var cr63422_exception = e63523;
(cr63422_state[(0)] = null);

(cr63422_state[(1)] = null);

throw cr63422_exception;
}});
var cr63422_block_2 = (function frontend$common$missionary$cr63422_block_2(cr63422_state){
try{var cr63422_place_8 = missionary.core.unpark();
(cr63422_state[(0)] = null);

return cr63422_place_8;
}catch (e63524){var cr63422_exception = e63524;
(cr63422_state[(0)] = null);

throw cr63422_exception;
}});
return cloroutine.impl.coroutine((function (){var G__63525 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((2));
(G__63525[(0)] = cr63422_block_0);

return G__63525;
})());
})(),missionary.core.ap_run);
}));

(frontend.common.missionary.mix.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.common.missionary.mix.cljs$lang$applyTo = (function (seq63416){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq63416));
}));

frontend.common.missionary.never_flow = cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr63526_block_0 = (function frontend$common$missionary$cr63526_block_0(cr63526_state){
try{var cr63526_place_0 = missionary.core.never;
(cr63526_state[(0)] = cr63526_block_1);

return missionary.core.park(cr63526_place_0);
}catch (e63533){var cr63526_exception = e63533;
(cr63526_state[(0)] = null);

throw cr63526_exception;
}});
var cr63526_block_1 = (function frontend$common$missionary$cr63526_block_1(cr63526_state){
try{var cr63526_place_1 = missionary.core.unpark();
(cr63526_state[(0)] = null);

return cr63526_place_1;
}catch (e63536){var cr63526_exception = e63536;
(cr63526_state[(0)] = null);

throw cr63526_exception;
}});
return cloroutine.impl.coroutine((function (){var G__63538 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__63538[(0)] = cr63526_block_0);

return G__63538;
})());
})(),missionary.core.ap_run);
frontend.common.missionary.delays = cljs.core.reductions.cljs$core$IFn$_invoke$arity$3(cljs.core._STAR_,(1000),cljs.core.repeat.cljs$core$IFn$_invoke$arity$1((2)));
frontend.common.missionary.retry_sentinel = ({});
/**
 * Retry task when it throw exception `(get ex-data :missionary/retry)`
 *   :delay-seq - retry delay-msecs
 *   :reset-flow - retry immediately when getting value from flow and reset delays to init state
 */
frontend.common.missionary.backoff = (function frontend$common$missionary$backoff(p__63541,task){
var map__63542 = p__63541;
var map__63542__$1 = cljs.core.__destructure_map(map__63542);
var delay_seq = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__63542__$1,new cljs.core.Keyword(null,"delay-seq","delay-seq",-1959201166),cljs.core.take.cljs$core$IFn$_invoke$arity$2((4),frontend.common.missionary.delays));
var reset_flow = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__63542__$1,new cljs.core.Keyword(null,"reset-flow","reset-flow",-1725822377),frontend.common.missionary.never_flow);
var reset_flow_STAR_ = frontend.common.missionary.mix.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([reset_flow,frontend.common.missionary.never_flow], 0));
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr63543_block_3 = (function frontend$common$missionary$backoff_$_cr63543_block_3(cr63543_state){
try{var cr63543_place_31 = missionary.core.unpark();
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(3)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(4)] = cr63543_place_31);

return cr63543_state;
}catch (e63804){var cr63543_exception = e63804;
(cr63543_state[(0)] = cr63543_block_4);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_0 = (function frontend$common$missionary$backoff_$_cr63543_block_0(cr63543_state){
try{var cr63543_place_0 = cljs.core.seq;
var cr63543_place_1 = delay_seq;
var cr63543_place_2 = (function (){var G__63810 = cr63543_place_1;
var fexpr__63809 = cr63543_place_0;
return (fexpr__63809.cljs$core$IFn$_invoke$arity$1 ? fexpr__63809.cljs$core$IFn$_invoke$arity$1(G__63810) : fexpr__63809.call(null,G__63810));
})();
var cr63543_place_3 = cr63543_place_2;
var cr63543_place_4 = cljs.core.seq;
var cr63543_place_5 = cr63543_place_3;
var cr63543_place_6 = (function (){var G__63812 = cr63543_place_5;
var fexpr__63811 = cr63543_place_4;
return (fexpr__63811.cljs$core$IFn$_invoke$arity$1 ? fexpr__63811.cljs$core$IFn$_invoke$arity$1(G__63812) : fexpr__63811.call(null,G__63812));
})();
var cr63543_place_7 = cljs.core.first;
var cr63543_place_8 = cr63543_place_6;
var cr63543_place_9 = (function (){var G__63815 = cr63543_place_8;
var fexpr__63814 = cr63543_place_7;
return (fexpr__63814.cljs$core$IFn$_invoke$arity$1 ? fexpr__63814.cljs$core$IFn$_invoke$arity$1(G__63815) : fexpr__63814.call(null,G__63815));
})();
var cr63543_place_10 = cljs.core.next;
var cr63543_place_11 = cr63543_place_6;
var cr63543_place_12 = (function (){var G__63819 = cr63543_place_11;
var fexpr__63818 = cr63543_place_10;
return (fexpr__63818.cljs$core$IFn$_invoke$arity$1 ? fexpr__63818.cljs$core$IFn$_invoke$arity$1(G__63819) : fexpr__63818.call(null,G__63819));
})();
var cr63543_place_13 = cr63543_place_9;
var cr63543_place_14 = cr63543_place_12;
var cr63543_place_15 = cr63543_place_2;
(cr63543_state[(0)] = cr63543_block_1);

(cr63543_state[(1)] = cr63543_place_15);

return cr63543_state;
}catch (e63807){var cr63543_exception = e63807;
(cr63543_state[(0)] = null);

throw cr63543_exception;
}});
var cr63543_block_12 = (function frontend$common$missionary$backoff_$_cr63543_block_12(cr63543_state){
try{var cr63543_place_26 = (cr63543_state[(5)]);
var cr63543_place_53 = cljs.core.pos_int_QMARK_;
var cr63543_place_54 = cr63543_place_26;
var cr63543_place_55 = (function (){var G__63822 = cr63543_place_54;
var fexpr__63821 = cr63543_place_53;
return (fexpr__63821.cljs$core$IFn$_invoke$arity$1 ? fexpr__63821.cljs$core$IFn$_invoke$arity$1(G__63822) : fexpr__63821.call(null,G__63822));
})();
(cr63543_state[(0)] = cr63543_block_13);

(cr63543_state[(7)] = cr63543_place_55);

return cr63543_state;
}catch (e63820){var cr63543_exception = e63820;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(7)] = null);

(cr63543_state[(3)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(8)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_31 = (function frontend$common$missionary$backoff_$_cr63543_block_31(cr63543_state){
try{var cr63543_place_124 = (cr63543_state[(3)]);
var cr63543_place_137 = null;
if(cljs.core.truth_(cr63543_place_124)){
(cr63543_state[(0)] = cr63543_block_33);

(cr63543_state[(3)] = null);

return cr63543_state;
} else {
(cr63543_state[(0)] = cr63543_block_32);

(cr63543_state[(3)] = null);

(cr63543_state[(1)] = null);

(cr63543_state[(1)] = cr63543_place_137);

return cr63543_state;
}
}catch (e63825){var cr63543_exception = e63825;
(cr63543_state[(0)] = null);

(cr63543_state[(2)] = null);

(cr63543_state[(3)] = null);

(cr63543_state[(1)] = null);

throw cr63543_exception;
}});
var cr63543_block_29 = (function frontend$common$missionary$backoff_$_cr63543_block_29(cr63543_state){
try{var cr63543_place_119 = (cr63543_state[(2)]);
var cr63543_place_132 = frontend.common.missionary.retry_sentinel;
var cr63543_place_133 = cljs.core.first;
var cr63543_place_134 = cr63543_place_119;
var cr63543_place_135 = (function (){var G__63831 = cr63543_place_134;
var fexpr__63830 = cr63543_place_133;
return (fexpr__63830.cljs$core$IFn$_invoke$arity$1 ? fexpr__63830.cljs$core$IFn$_invoke$arity$1(G__63831) : fexpr__63830.call(null,G__63831));
})();
var cr63543_place_136 = (cr63543_place_132 === cr63543_place_135);
(cr63543_state[(0)] = cr63543_block_30);

(cr63543_state[(5)] = cr63543_place_136);

return cr63543_state;
}catch (e63828){var cr63543_exception = e63828;
(cr63543_state[(0)] = null);

(cr63543_state[(2)] = null);

(cr63543_state[(3)] = null);

(cr63543_state[(1)] = null);

(cr63543_state[(5)] = null);

throw cr63543_exception;
}});
var cr63543_block_8 = (function frontend$common$missionary$backoff_$_cr63543_block_8(cr63543_state){
try{var cr63543_place_37 = (cr63543_state[(7)]);
var cr63543_place_46 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr63543_place_47 = cr63543_place_37;
var cr63543_place_48 = cr63543_place_46.cljs$core$IFn$_invoke$arity$1(cr63543_place_47);
(cr63543_state[(0)] = cr63543_block_10);

(cr63543_state[(7)] = null);

(cr63543_state[(6)] = cr63543_place_48);

return cr63543_state;
}catch (e63834){var cr63543_exception = e63834;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(7)] = null);

(cr63543_state[(3)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(6)] = null);

(cr63543_state[(8)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_27 = (function frontend$common$missionary$backoff_$_cr63543_block_27(cr63543_state){
try{var cr63543_place_119 = (cr63543_state[(2)]);
var cr63543_place_126 = cljs.core.first;
var cr63543_place_127 = cr63543_place_119;
var cr63543_place_128 = (function (){var G__63844 = cr63543_place_127;
var fexpr__63843 = cr63543_place_126;
return (fexpr__63843.cljs$core$IFn$_invoke$arity$1 ? fexpr__63843.cljs$core$IFn$_invoke$arity$1(G__63844) : fexpr__63843.call(null,G__63844));
})();
var cr63543_place_129 = cr63543_place_128;
var cr63543_place_130 = null;
if(cljs.core.truth_(cr63543_place_129)){
(cr63543_state[(0)] = cr63543_block_29);

(cr63543_state[(5)] = cr63543_place_130);

return cr63543_state;
} else {
(cr63543_state[(0)] = cr63543_block_28);

(cr63543_state[(4)] = cr63543_place_128);

(cr63543_state[(5)] = cr63543_place_130);

return cr63543_state;
}
}catch (e63842){var cr63543_exception = e63842;
(cr63543_state[(0)] = null);

(cr63543_state[(2)] = null);

(cr63543_state[(3)] = null);

(cr63543_state[(1)] = null);

throw cr63543_exception;
}});
var cr63543_block_2 = (function frontend$common$missionary$backoff_$_cr63543_block_2(cr63543_state){
try{var cr63543_place_30 = task;
(cr63543_state[(0)] = cr63543_block_3);

return missionary.core.park(cr63543_place_30);
}catch (e63845){var cr63543_exception = e63845;
(cr63543_state[(0)] = cr63543_block_4);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_21 = (function frontend$common$missionary$backoff_$_cr63543_block_21(cr63543_state){
try{var cr63543_place_32 = (cr63543_state[(8)]);
var cr63543_place_102 = cljs.core.println;
var cr63543_place_103 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr63543_place_104 = "retry now (";
var cr63543_place_105 = cljs.core.ex_message;
var cr63543_place_106 = cr63543_place_32;
var cr63543_place_107 = (function (){var G__63852 = cr63543_place_106;
var fexpr__63851 = cr63543_place_105;
return (fexpr__63851.cljs$core$IFn$_invoke$arity$1 ? fexpr__63851.cljs$core$IFn$_invoke$arity$1(G__63852) : fexpr__63851.call(null,G__63852));
})();
var cr63543_place_108 = ")";
var cr63543_place_109 = (function (){var G__63854 = cr63543_place_103;
var G__63855 = cr63543_place_104;
var G__63856 = cr63543_place_107;
var G__63857 = cr63543_place_108;
var fexpr__63853 = cr63543_place_102;
return (fexpr__63853.cljs$core$IFn$_invoke$arity$4 ? fexpr__63853.cljs$core$IFn$_invoke$arity$4(G__63854,G__63855,G__63856,G__63857) : fexpr__63853.call(null,G__63854,G__63855,G__63856,G__63857));
})();
var cr63543_place_110 = delay_seq;
(cr63543_state[(0)] = cr63543_block_23);

(cr63543_state[(8)] = null);

(cr63543_state[(7)] = cr63543_place_110);

return cr63543_state;
}catch (e63847){var cr63543_exception = e63847;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(7)] = null);

(cr63543_state[(6)] = null);

(cr63543_state[(8)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_23 = (function frontend$common$missionary$backoff_$_cr63543_block_23(cr63543_state){
try{var cr63543_place_90 = (cr63543_state[(7)]);
var cr63543_place_116 = frontend.common.missionary.retry_sentinel;
var cr63543_place_117 = cr63543_place_90;
var cr63543_place_118 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr63543_place_116,cr63543_place_117], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
(cr63543_state[(0)] = cr63543_block_24);

(cr63543_state[(7)] = null);

(cr63543_state[(6)] = cr63543_place_118);

return cr63543_state;
}catch (e63859){var cr63543_exception = e63859;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(7)] = null);

(cr63543_state[(6)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_13 = (function frontend$common$missionary$backoff_$_cr63543_block_13(cr63543_state){
try{var cr63543_place_51 = (cr63543_state[(7)]);
var cr63543_place_56 = null;
if(cljs.core.truth_(cr63543_place_51)){
(cr63543_state[(0)] = cr63543_block_15);

(cr63543_state[(7)] = null);

(cr63543_state[(6)] = cr63543_place_56);

return cr63543_state;
} else {
(cr63543_state[(0)] = cr63543_block_14);

(cr63543_state[(7)] = null);

(cr63543_state[(3)] = null);

(cr63543_state[(5)] = null);

return cr63543_state;
}
}catch (e63862){var cr63543_exception = e63862;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(7)] = null);

(cr63543_state[(3)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(8)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_25 = (function frontend$common$missionary$backoff_$_cr63543_block_25(cr63543_state){
try{var cr63543_place_29 = (cr63543_state[(2)]);
var cr63543_place_28 = (cr63543_state[(4)]);
var cr63543_place_119 = (cljs.core.truth_(cr63543_place_29)?(function(){throw cr63543_place_28})():cr63543_place_28);
var cr63543_place_120 = cljs.core.vector_QMARK_;
var cr63543_place_121 = cr63543_place_119;
var cr63543_place_122 = (function (){var G__63866 = cr63543_place_121;
var fexpr__63865 = cr63543_place_120;
return (fexpr__63865.cljs$core$IFn$_invoke$arity$1 ? fexpr__63865.cljs$core$IFn$_invoke$arity$1(G__63866) : fexpr__63865.call(null,G__63866));
})();
var cr63543_place_123 = cr63543_place_122;
var cr63543_place_124 = null;
if(cr63543_place_123){
(cr63543_state[(0)] = cr63543_block_27);

(cr63543_state[(2)] = null);

(cr63543_state[(4)] = null);

(cr63543_state[(2)] = cr63543_place_119);

(cr63543_state[(3)] = cr63543_place_124);

return cr63543_state;
} else {
(cr63543_state[(0)] = cr63543_block_26);

(cr63543_state[(2)] = null);

(cr63543_state[(4)] = null);

(cr63543_state[(2)] = cr63543_place_119);

(cr63543_state[(4)] = cr63543_place_122);

(cr63543_state[(3)] = cr63543_place_124);

return cr63543_state;
}
}catch (e63864){var cr63543_exception = e63864;
(cr63543_state[(0)] = null);

(cr63543_state[(2)] = null);

(cr63543_state[(1)] = null);

(cr63543_state[(4)] = null);

throw cr63543_exception;
}});
var cr63543_block_34 = (function frontend$common$missionary$backoff_$_cr63543_block_34(cr63543_state){
try{var cr63543_place_137 = (cr63543_state[(1)]);
(cr63543_state[(0)] = null);

(cr63543_state[(1)] = null);

return cr63543_place_137;
}catch (e63867){var cr63543_exception = e63867;
(cr63543_state[(0)] = null);

(cr63543_state[(1)] = null);

throw cr63543_exception;
}});
var cr63543_block_19 = (function frontend$common$missionary$backoff_$_cr63543_block_19(cr63543_state){
try{var cr63543_place_85 = (cr63543_state[(7)]);
var cr63543_place_89 = cr63543_place_85;
var cr63543_place_90 = null;
var G__63879 = cr63543_place_89;
switch (G__63879) {
case "delay":
(cr63543_state[(0)] = cr63543_block_20);

(cr63543_state[(7)] = null);

(cr63543_state[(7)] = cr63543_place_90);

return cr63543_state;

break;
case "reset":
(cr63543_state[(0)] = cr63543_block_21);

(cr63543_state[(3)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(7)] = null);

(cr63543_state[(7)] = cr63543_place_90);

return cr63543_state;

break;
default:
(cr63543_state[(0)] = cr63543_block_22);

(cr63543_state[(3)] = null);

(cr63543_state[(6)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(8)] = null);

return cr63543_state;

}
}catch (e63870){var cr63543_exception = e63870;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(3)] = null);

(cr63543_state[(6)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(7)] = null);

(cr63543_state[(8)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_17 = (function frontend$common$missionary$backoff_$_cr63543_block_17(cr63543_state){
try{var cr63543_place_86 = null;
(cr63543_state[(0)] = cr63543_block_19);

(cr63543_state[(7)] = cr63543_place_86);

return cr63543_state;
}catch (e63885){var cr63543_exception = e63885;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(3)] = null);

(cr63543_state[(6)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(7)] = null);

(cr63543_state[(8)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_30 = (function frontend$common$missionary$backoff_$_cr63543_block_30(cr63543_state){
try{var cr63543_place_130 = (cr63543_state[(5)]);
(cr63543_state[(0)] = cr63543_block_31);

(cr63543_state[(5)] = null);

(cr63543_state[(3)] = cr63543_place_130);

return cr63543_state;
}catch (e63887){var cr63543_exception = e63887;
(cr63543_state[(0)] = null);

(cr63543_state[(2)] = null);

(cr63543_state[(3)] = null);

(cr63543_state[(1)] = null);

(cr63543_state[(5)] = null);

throw cr63543_exception;
}});
var cr63543_block_26 = (function frontend$common$missionary$backoff_$_cr63543_block_26(cr63543_state){
try{var cr63543_place_122 = (cr63543_state[(4)]);
var cr63543_place_125 = cr63543_place_122;
(cr63543_state[(0)] = cr63543_block_31);

(cr63543_state[(4)] = null);

(cr63543_state[(3)] = cr63543_place_125);

return cr63543_state;
}catch (e63888){var cr63543_exception = e63888;
(cr63543_state[(0)] = null);

(cr63543_state[(2)] = null);

(cr63543_state[(3)] = null);

(cr63543_state[(1)] = null);

(cr63543_state[(4)] = null);

throw cr63543_exception;
}});
var cr63543_block_5 = (function frontend$common$missionary$backoff_$_cr63543_block_5(cr63543_state){
try{var cr63543_place_33 = (cr63543_state[(6)]);
var cr63543_place_38 = cljs.core.ex_data;
var cr63543_place_39 = cr63543_place_33;
var cr63543_place_40 = (function (){var G__63899 = cr63543_place_39;
var fexpr__63898 = cr63543_place_38;
return (fexpr__63898.cljs$core$IFn$_invoke$arity$1 ? fexpr__63898.cljs$core$IFn$_invoke$arity$1(G__63899) : fexpr__63898.call(null,G__63899));
})();
(cr63543_state[(0)] = cr63543_block_7);

(cr63543_state[(6)] = null);

(cr63543_state[(7)] = cr63543_place_40);

return cr63543_state;
}catch (e63893){var cr63543_exception = e63893;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(6)] = null);

(cr63543_state[(7)] = null);

(cr63543_state[(3)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(8)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_33 = (function frontend$common$missionary$backoff_$_cr63543_block_33(cr63543_state){
try{var cr63543_place_119 = (cr63543_state[(2)]);
var cr63543_place_139 = cljs.core.second;
var cr63543_place_140 = cr63543_place_119;
var cr63543_place_141 = (function (){var G__63904 = cr63543_place_140;
var fexpr__63903 = cr63543_place_139;
return (fexpr__63903.cljs$core$IFn$_invoke$arity$1 ? fexpr__63903.cljs$core$IFn$_invoke$arity$1(G__63904) : fexpr__63903.call(null,G__63904));
})();
(cr63543_state[(0)] = cr63543_block_1);

(cr63543_state[(2)] = null);

(cr63543_state[(1)] = cr63543_place_141);

return cr63543_state;
}catch (e63900){var cr63543_exception = e63900;
(cr63543_state[(0)] = null);

(cr63543_state[(2)] = null);

(cr63543_state[(1)] = null);

throw cr63543_exception;
}});
var cr63543_block_10 = (function frontend$common$missionary$backoff_$_cr63543_block_10(cr63543_state){
try{var cr63543_place_45 = (cr63543_state[(6)]);
var cr63543_place_50 = cr63543_place_45;
var cr63543_place_51 = null;
if(cljs.core.truth_(cr63543_place_50)){
(cr63543_state[(0)] = cr63543_block_12);

(cr63543_state[(6)] = null);

(cr63543_state[(7)] = cr63543_place_51);

return cr63543_state;
} else {
(cr63543_state[(0)] = cr63543_block_11);

(cr63543_state[(7)] = cr63543_place_51);

return cr63543_state;
}
}catch (e63909){var cr63543_exception = e63909;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(3)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(6)] = null);

(cr63543_state[(8)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_22 = (function frontend$common$missionary$backoff_$_cr63543_block_22(cr63543_state){
try{var cr63543_place_85 = (cr63543_state[(7)]);
var cr63543_place_111 = "No matching clause: ";
var cr63543_place_112 = cr63543_place_85;
var cr63543_place_113 = [cr63543_place_111,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr63543_place_112)].join('');
var cr63543_place_114 = (new Error(cr63543_place_113));
var cr63543_place_115 = (function(){throw cr63543_place_114})();
(cr63543_state[(0)] = null);

(cr63543_state[(2)] = null);

(cr63543_state[(1)] = null);

(cr63543_state[(4)] = null);

(cr63543_state[(7)] = null);

return null;
}catch (e63914){var cr63543_exception = e63914;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(7)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_18 = (function frontend$common$missionary$backoff_$_cr63543_block_18(cr63543_state){
try{var cr63543_place_81 = (cr63543_state[(9)]);
var cr63543_place_87 = cr63543_place_81;
var cr63543_place_88 = cr63543_place_87.fqn;
(cr63543_state[(0)] = cr63543_block_19);

(cr63543_state[(9)] = null);

(cr63543_state[(7)] = cr63543_place_88);

return cr63543_state;
}catch (e63915){var cr63543_exception = e63915;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(9)] = null);

(cr63543_state[(3)] = null);

(cr63543_state[(6)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(7)] = null);

(cr63543_state[(8)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_28 = (function frontend$common$missionary$backoff_$_cr63543_block_28(cr63543_state){
try{var cr63543_place_128 = (cr63543_state[(4)]);
var cr63543_place_131 = cr63543_place_128;
(cr63543_state[(0)] = cr63543_block_30);

(cr63543_state[(4)] = null);

(cr63543_state[(5)] = cr63543_place_131);

return cr63543_state;
}catch (e63930){var cr63543_exception = e63930;
(cr63543_state[(0)] = null);

(cr63543_state[(2)] = null);

(cr63543_state[(4)] = null);

(cr63543_state[(3)] = null);

(cr63543_state[(1)] = null);

(cr63543_state[(5)] = null);

throw cr63543_exception;
}});
var cr63543_block_4 = (function frontend$common$missionary$backoff_$_cr63543_block_4(cr63543_state){
try{var cr63543_place_28 = (cr63543_state[(4)]);
var cr63543_place_32 = cr63543_place_28;
var cr63543_place_33 = cr63543_place_32;
var cr63543_place_34 = cr63543_place_33;
var cr63543_place_35 = null;
var cr63543_place_36 = (cr63543_place_34 == cr63543_place_35);
var cr63543_place_37 = null;
if(cr63543_place_36){
(cr63543_state[(0)] = cr63543_block_6);

(cr63543_state[(8)] = cr63543_place_32);

(cr63543_state[(7)] = cr63543_place_37);

return cr63543_state;
} else {
(cr63543_state[(0)] = cr63543_block_5);

(cr63543_state[(8)] = cr63543_place_32);

(cr63543_state[(6)] = cr63543_place_33);

(cr63543_state[(7)] = cr63543_place_37);

return cr63543_state;
}
}catch (e63932){var cr63543_exception = e63932;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(3)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_7 = (function frontend$common$missionary$backoff_$_cr63543_block_7(cr63543_state){
try{var cr63543_place_37 = (cr63543_state[(7)]);
var cr63543_place_42 = cr63543_place_37;
var cr63543_place_43 = null;
var cr63543_place_44 = (cr63543_place_42 == cr63543_place_43);
var cr63543_place_45 = null;
if(cr63543_place_44){
(cr63543_state[(0)] = cr63543_block_9);

(cr63543_state[(7)] = null);

(cr63543_state[(6)] = cr63543_place_45);

return cr63543_state;
} else {
(cr63543_state[(0)] = cr63543_block_8);

(cr63543_state[(6)] = cr63543_place_45);

return cr63543_state;
}
}catch (e63938){var cr63543_exception = e63938;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(7)] = null);

(cr63543_state[(3)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(8)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_6 = (function frontend$common$missionary$backoff_$_cr63543_block_6(cr63543_state){
try{var cr63543_place_41 = null;
(cr63543_state[(0)] = cr63543_block_7);

(cr63543_state[(7)] = cr63543_place_41);

return cr63543_state;
}catch (e63946){var cr63543_exception = e63946;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(7)] = null);

(cr63543_state[(3)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(8)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_14 = (function frontend$common$missionary$backoff_$_cr63543_block_14(cr63543_state){
try{var cr63543_place_32 = (cr63543_state[(8)]);
var cr63543_place_57 = cr63543_place_32;
var cr63543_place_58 = (function(){throw cr63543_place_57})();
(cr63543_state[(0)] = null);

(cr63543_state[(2)] = null);

(cr63543_state[(1)] = null);

(cr63543_state[(4)] = null);

(cr63543_state[(8)] = null);

return null;
}catch (e63947){var cr63543_exception = e63947;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(8)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_1 = (function frontend$common$missionary$backoff_$_cr63543_block_1(cr63543_state){
try{var cr63543_place_15 = (cr63543_state[(1)]);
var cr63543_place_16 = cr63543_place_15;
var cr63543_place_17 = cljs.core.seq;
var cr63543_place_18 = cr63543_place_16;
var cr63543_place_19 = (function (){var G__63950 = cr63543_place_18;
var fexpr__63949 = cr63543_place_17;
return (fexpr__63949.cljs$core$IFn$_invoke$arity$1 ? fexpr__63949.cljs$core$IFn$_invoke$arity$1(G__63950) : fexpr__63949.call(null,G__63950));
})();
var cr63543_place_20 = cljs.core.first;
var cr63543_place_21 = cr63543_place_19;
var cr63543_place_22 = (function (){var G__63952 = cr63543_place_21;
var fexpr__63951 = cr63543_place_20;
return (fexpr__63951.cljs$core$IFn$_invoke$arity$1 ? fexpr__63951.cljs$core$IFn$_invoke$arity$1(G__63952) : fexpr__63951.call(null,G__63952));
})();
var cr63543_place_23 = cljs.core.next;
var cr63543_place_24 = cr63543_place_19;
var cr63543_place_25 = (function (){var G__63954 = cr63543_place_24;
var fexpr__63953 = cr63543_place_23;
return (fexpr__63953.cljs$core$IFn$_invoke$arity$1 ? fexpr__63953.cljs$core$IFn$_invoke$arity$1(G__63954) : fexpr__63953.call(null,G__63954));
})();
var cr63543_place_26 = cr63543_place_22;
var cr63543_place_27 = cr63543_place_25;
var cr63543_place_28 = null;
var cr63543_place_29 = false;
(cr63543_state[(0)] = cr63543_block_2);

(cr63543_state[(2)] = cr63543_place_29);

(cr63543_state[(3)] = cr63543_place_27);

(cr63543_state[(4)] = cr63543_place_28);

(cr63543_state[(5)] = cr63543_place_26);

return cr63543_state;
}catch (e63948){var cr63543_exception = e63948;
(cr63543_state[(0)] = null);

(cr63543_state[(1)] = null);

throw cr63543_exception;
}});
var cr63543_block_24 = (function frontend$common$missionary$backoff_$_cr63543_block_24(cr63543_state){
try{var cr63543_place_56 = (cr63543_state[(6)]);
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(6)] = null);

(cr63543_state[(4)] = cr63543_place_56);

return cr63543_state;
}catch (e63955){var cr63543_exception = e63955;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(6)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_9 = (function frontend$common$missionary$backoff_$_cr63543_block_9(cr63543_state){
try{var cr63543_place_49 = null;
(cr63543_state[(0)] = cr63543_block_10);

(cr63543_state[(6)] = cr63543_place_49);

return cr63543_state;
}catch (e63956){var cr63543_exception = e63956;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(3)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(6)] = null);

(cr63543_state[(8)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_32 = (function frontend$common$missionary$backoff_$_cr63543_block_32(cr63543_state){
try{var cr63543_place_119 = (cr63543_state[(2)]);
var cr63543_place_138 = cr63543_place_119;
(cr63543_state[(0)] = cr63543_block_34);

(cr63543_state[(2)] = null);

(cr63543_state[(1)] = cr63543_place_138);

return cr63543_state;
}catch (e63957){var cr63543_exception = e63957;
(cr63543_state[(0)] = null);

(cr63543_state[(1)] = null);

(cr63543_state[(2)] = null);

throw cr63543_exception;
}});
var cr63543_block_15 = (function frontend$common$missionary$backoff_$_cr63543_block_15(cr63543_state){
try{var cr63543_place_26 = (cr63543_state[(5)]);
var cr63543_place_59 = missionary.core.race;
var cr63543_place_60 = missionary.core.sleep;
var cr63543_place_61 = cr63543_place_26;
var cr63543_place_62 = new cljs.core.Keyword(null,"delay","delay",-574225219);
var cr63543_place_63 = (function (){var G__63960 = cr63543_place_61;
var G__63961 = cr63543_place_62;
var fexpr__63959 = cr63543_place_60;
return (fexpr__63959.cljs$core$IFn$_invoke$arity$2 ? fexpr__63959.cljs$core$IFn$_invoke$arity$2(G__63960,G__63961) : fexpr__63959.call(null,G__63960,G__63961));
})();
var cr63543_place_64 = missionary.core.reduce;
var cr63543_place_65 = (function (_,r){
if(cljs.core.truth_(r)){
return cljs.core.reduced(new cljs.core.Keyword(null,"reset","reset",-800929946));
} else {
return null;
}
});
var cr63543_place_66 = null;
var cr63543_place_67 = missionary.core.eduction;
var cr63543_place_68 = cljs.core.drop;
var cr63543_place_69 = (1);
var cr63543_place_70 = (function (){var G__63963 = cr63543_place_69;
var fexpr__63962 = cr63543_place_68;
return (fexpr__63962.cljs$core$IFn$_invoke$arity$1 ? fexpr__63962.cljs$core$IFn$_invoke$arity$1(G__63963) : fexpr__63962.call(null,G__63963));
})();
var cr63543_place_71 = cljs.core.take;
var cr63543_place_72 = (1);
var cr63543_place_73 = (function (){var G__63965 = cr63543_place_72;
var fexpr__63964 = cr63543_place_71;
return (fexpr__63964.cljs$core$IFn$_invoke$arity$1 ? fexpr__63964.cljs$core$IFn$_invoke$arity$1(G__63965) : fexpr__63964.call(null,G__63965));
})();
var cr63543_place_74 = frontend.common.missionary.continue_flow;
var cr63543_place_75 = reset_flow_STAR_;
var cr63543_place_76 = (function (){var G__63967 = cr63543_place_75;
var fexpr__63966 = cr63543_place_74;
return (fexpr__63966.cljs$core$IFn$_invoke$arity$1 ? fexpr__63966.cljs$core$IFn$_invoke$arity$1(G__63967) : fexpr__63966.call(null,G__63967));
})();
var cr63543_place_77 = (function (){var G__63969 = cr63543_place_70;
var G__63970 = cr63543_place_73;
var G__63971 = cr63543_place_76;
var fexpr__63968 = cr63543_place_67;
return (fexpr__63968.cljs$core$IFn$_invoke$arity$3 ? fexpr__63968.cljs$core$IFn$_invoke$arity$3(G__63969,G__63970,G__63971) : fexpr__63968.call(null,G__63969,G__63970,G__63971));
})();
var cr63543_place_78 = (function (){var G__63973 = cr63543_place_65;
var G__63974 = cr63543_place_66;
var G__63975 = cr63543_place_77;
var fexpr__63972 = cr63543_place_64;
return (fexpr__63972.cljs$core$IFn$_invoke$arity$3 ? fexpr__63972.cljs$core$IFn$_invoke$arity$3(G__63973,G__63974,G__63975) : fexpr__63972.call(null,G__63973,G__63974,G__63975));
})();
var cr63543_place_79 = (function (){var G__63977 = cr63543_place_63;
var G__63978 = cr63543_place_78;
var fexpr__63976 = cr63543_place_59;
return (fexpr__63976.cljs$core$IFn$_invoke$arity$2 ? fexpr__63976.cljs$core$IFn$_invoke$arity$2(G__63977,G__63978) : fexpr__63976.call(null,G__63977,G__63978));
})();
(cr63543_state[(0)] = cr63543_block_16);

return missionary.core.park(cr63543_place_79);
}catch (e63958){var cr63543_exception = e63958;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(3)] = null);

(cr63543_state[(6)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(8)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_11 = (function frontend$common$missionary$backoff_$_cr63543_block_11(cr63543_state){
try{var cr63543_place_45 = (cr63543_state[(6)]);
var cr63543_place_52 = cr63543_place_45;
(cr63543_state[(0)] = cr63543_block_13);

(cr63543_state[(6)] = null);

(cr63543_state[(7)] = cr63543_place_52);

return cr63543_state;
}catch (e63979){var cr63543_exception = e63979;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(7)] = null);

(cr63543_state[(3)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(6)] = null);

(cr63543_state[(8)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_20 = (function frontend$common$missionary$backoff_$_cr63543_block_20(cr63543_state){
try{var cr63543_place_27 = (cr63543_state[(3)]);
var cr63543_place_26 = (cr63543_state[(5)]);
var cr63543_place_32 = (cr63543_state[(8)]);
var cr63543_place_91 = cljs.core.println;
var cr63543_place_92 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr63543_place_93 = "after";
var cr63543_place_94 = cr63543_place_26;
var cr63543_place_95 = "ms (";
var cr63543_place_96 = cljs.core.ex_message;
var cr63543_place_97 = cr63543_place_32;
var cr63543_place_98 = (function (){var G__63982 = cr63543_place_97;
var fexpr__63981 = cr63543_place_96;
return (fexpr__63981.cljs$core$IFn$_invoke$arity$1 ? fexpr__63981.cljs$core$IFn$_invoke$arity$1(G__63982) : fexpr__63981.call(null,G__63982));
})();
var cr63543_place_99 = ")";
var cr63543_place_100 = (function (){var G__63984 = cr63543_place_92;
var G__63985 = cr63543_place_93;
var G__63986 = cr63543_place_94;
var G__63987 = cr63543_place_95;
var G__63988 = cr63543_place_98;
var G__63989 = cr63543_place_99;
var fexpr__63983 = cr63543_place_91;
return (fexpr__63983.cljs$core$IFn$_invoke$arity$6 ? fexpr__63983.cljs$core$IFn$_invoke$arity$6(G__63984,G__63985,G__63986,G__63987,G__63988,G__63989) : fexpr__63983.call(null,G__63984,G__63985,G__63986,G__63987,G__63988,G__63989));
})();
var cr63543_place_101 = cr63543_place_27;
(cr63543_state[(0)] = cr63543_block_23);

(cr63543_state[(3)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(8)] = null);

(cr63543_state[(7)] = cr63543_place_101);

return cr63543_state;
}catch (e63980){var cr63543_exception = e63980;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(7)] = null);

(cr63543_state[(3)] = null);

(cr63543_state[(6)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(8)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
var cr63543_block_16 = (function frontend$common$missionary$backoff_$_cr63543_block_16(cr63543_state){
try{var cr63543_place_80 = missionary.core.unpark();
var cr63543_place_81 = cr63543_place_80;
var cr63543_place_82 = cr63543_place_81;
var cr63543_place_83 = cljs.core.Keyword;
var cr63543_place_84 = (cr63543_place_82 instanceof cr63543_place_83);
var cr63543_place_85 = null;
if(cr63543_place_84){
(cr63543_state[(0)] = cr63543_block_18);

(cr63543_state[(9)] = cr63543_place_81);

(cr63543_state[(7)] = cr63543_place_85);

return cr63543_state;
} else {
(cr63543_state[(0)] = cr63543_block_17);

(cr63543_state[(7)] = cr63543_place_85);

return cr63543_state;
}
}catch (e63990){var cr63543_exception = e63990;
(cr63543_state[(0)] = cr63543_block_25);

(cr63543_state[(3)] = null);

(cr63543_state[(6)] = null);

(cr63543_state[(5)] = null);

(cr63543_state[(8)] = null);

(cr63543_state[(2)] = true);

(cr63543_state[(4)] = cr63543_exception);

return cr63543_state;
}});
return cloroutine.impl.coroutine((function (){var G__63991 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((10));
(G__63991[(0)] = cr63543_block_0);

return G__63991;
})());
})(),missionary.core.sp_run);
});
/**
 * Return a flow that emits `value` every `interval-ms`.
 */
frontend.common.missionary.clock = (function frontend$common$missionary$clock(var_args){
var G__63993 = arguments.length;
switch (G__63993) {
case 1:
return frontend.common.missionary.clock.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.common.missionary.clock.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.common.missionary.clock.cljs$core$IFn$_invoke$arity$1 = (function (interval_ms){
return frontend.common.missionary.clock.cljs$core$IFn$_invoke$arity$2(interval_ms,null);
}));

(frontend.common.missionary.clock.cljs$core$IFn$_invoke$arity$2 = (function (interval_ms,value){
return frontend.common.missionary.continue_flow.cljs$core$IFn$_invoke$arity$2(value,cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr63994_block_0 = (function frontend$common$missionary$cr63994_block_0(cr63994_state){
try{(cr63994_state[(0)] = cr63994_block_1);

return cr63994_state;
}catch (e64042){var cr63994_exception = e64042;
(cr63994_state[(0)] = null);

throw cr63994_exception;
}});
var cr63994_block_1 = (function frontend$common$missionary$cr63994_block_1(cr63994_state){
try{var cr63994_place_0 = (1);
var cr63994_place_1 = missionary.core.seed;
var cr63994_place_2 = cljs.core.range;
var cr63994_place_3 = (2);
var cr63994_place_4 = (function (){var G__64048 = cr63994_place_3;
var fexpr__64047 = cr63994_place_2;
return (fexpr__64047.cljs$core$IFn$_invoke$arity$1 ? fexpr__64047.cljs$core$IFn$_invoke$arity$1(G__64048) : fexpr__64047.call(null,G__64048));
})();
var cr63994_place_5 = (function (){var G__64052 = cr63994_place_4;
var fexpr__64051 = cr63994_place_1;
return (fexpr__64051.cljs$core$IFn$_invoke$arity$1 ? fexpr__64051.cljs$core$IFn$_invoke$arity$1(G__64052) : fexpr__64051.call(null,G__64052));
})();
(cr63994_state[(0)] = cr63994_block_2);

return missionary.core.fork(cr63994_place_0,cr63994_place_5);
}catch (e64043){var cr63994_exception = e64043;
(cr63994_state[(0)] = null);

throw cr63994_exception;
}});
var cr63994_block_2 = (function frontend$common$missionary$cr63994_block_2(cr63994_state){
try{var cr63994_place_6 = missionary.core.unpark();
var cr63994_place_7 = cr63994_place_6;
var cr63994_place_8 = null;
var G__64129 = cr63994_place_7;
switch (G__64129) {
case (0):
(cr63994_state[(0)] = cr63994_block_3);

(cr63994_state[(1)] = cr63994_place_8);

return cr63994_state;

break;
case (1):
(cr63994_state[(0)] = cr63994_block_5);

return cr63994_state;

break;
default:
(cr63994_state[(0)] = cr63994_block_6);

(cr63994_state[(1)] = cr63994_place_6);

return cr63994_state;

}
}catch (e64103){var cr63994_exception = e64103;
(cr63994_state[(0)] = null);

throw cr63994_exception;
}});
var cr63994_block_3 = (function frontend$common$missionary$cr63994_block_3(cr63994_state){
try{var cr63994_place_9 = missionary.core.sleep;
var cr63994_place_10 = interval_ms;
var cr63994_place_11 = value;
var cr63994_place_12 = (function (){var G__64134 = cr63994_place_10;
var G__64135 = cr63994_place_11;
var fexpr__64133 = cr63994_place_9;
return (fexpr__64133.cljs$core$IFn$_invoke$arity$2 ? fexpr__64133.cljs$core$IFn$_invoke$arity$2(G__64134,G__64135) : fexpr__64133.call(null,G__64134,G__64135));
})();
(cr63994_state[(0)] = cr63994_block_4);

return missionary.core.park(cr63994_place_12);
}catch (e64132){var cr63994_exception = e64132;
(cr63994_state[(0)] = null);

(cr63994_state[(1)] = null);

throw cr63994_exception;
}});
var cr63994_block_4 = (function frontend$common$missionary$cr63994_block_4(cr63994_state){
try{var cr63994_place_13 = missionary.core.unpark();
(cr63994_state[(0)] = cr63994_block_7);

(cr63994_state[(1)] = cr63994_place_13);

return cr63994_state;
}catch (e64137){var cr63994_exception = e64137;
(cr63994_state[(0)] = null);

(cr63994_state[(1)] = null);

throw cr63994_exception;
}});
var cr63994_block_5 = (function frontend$common$missionary$cr63994_block_5(cr63994_state){
try{(cr63994_state[(0)] = cr63994_block_1);

return cr63994_state;
}catch (e64138){var cr63994_exception = e64138;
(cr63994_state[(0)] = null);

throw cr63994_exception;
}});
var cr63994_block_6 = (function frontend$common$missionary$cr63994_block_6(cr63994_state){
try{var cr63994_place_6 = (cr63994_state[(1)]);
var cr63994_place_14 = "No matching clause: ";
var cr63994_place_15 = cr63994_place_6;
var cr63994_place_16 = [cr63994_place_14,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr63994_place_15)].join('');
var cr63994_place_17 = (new Error(cr63994_place_16));
var cr63994_place_18 = (function(){throw cr63994_place_17})();
(cr63994_state[(0)] = null);

(cr63994_state[(1)] = null);

return null;
}catch (e64139){var cr63994_exception = e64139;
(cr63994_state[(0)] = null);

(cr63994_state[(1)] = null);

throw cr63994_exception;
}});
var cr63994_block_7 = (function frontend$common$missionary$cr63994_block_7(cr63994_state){
try{var cr63994_place_8 = (cr63994_state[(1)]);
(cr63994_state[(0)] = null);

(cr63994_state[(1)] = null);

return cr63994_place_8;
}catch (e64140){var cr63994_exception = e64140;
(cr63994_state[(0)] = null);

(cr63994_state[(1)] = null);

throw cr63994_exception;
}});
return cloroutine.impl.coroutine((function (){var G__64141 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((2));
(G__64141[(0)] = cr63994_block_0);

return G__64141;
})());
})(),missionary.core.ap_run));
}));

(frontend.common.missionary.clock.cljs$lang$maxFixedArity = 2);

/**
 * Return a flow.
 *   Concurrent exec `f` on `flow` with max concurrent count `par`.
 *   - `(f v)` return a task.
 *   - `v` is value from `flow`
 */
frontend.common.missionary.concurrent_exec_flow = (function frontend$common$missionary$concurrent_exec_flow(par,flow,f){
if(cljs.core.pos_int_QMARK_(par)){
} else {
throw (new Error("Assert failed: (pos-int? par)"));
}

return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr64147_block_0 = (function frontend$common$missionary$concurrent_exec_flow_$_cr64147_block_0(cr64147_state){
try{var cr64147_place_0 = par;
var cr64147_place_1 = flow;
(cr64147_state[(0)] = cr64147_block_1);

return missionary.core.fork(cr64147_place_0,cr64147_place_1);
}catch (e64155){var cr64147_exception = e64155;
(cr64147_state[(0)] = null);

throw cr64147_exception;
}});
var cr64147_block_1 = (function frontend$common$missionary$concurrent_exec_flow_$_cr64147_block_1(cr64147_state){
try{var cr64147_place_2 = missionary.core.unpark();
var cr64147_place_3 = f;
var cr64147_place_4 = cr64147_place_2;
var cr64147_place_5 = (function (){var G__64158 = cr64147_place_4;
var fexpr__64157 = cr64147_place_3;
return (fexpr__64157.cljs$core$IFn$_invoke$arity$1 ? fexpr__64157.cljs$core$IFn$_invoke$arity$1(G__64158) : fexpr__64157.call(null,G__64158));
})();
(cr64147_state[(0)] = cr64147_block_2);

return missionary.core.park(cr64147_place_5);
}catch (e64156){var cr64147_exception = e64156;
(cr64147_state[(0)] = null);

throw cr64147_exception;
}});
var cr64147_block_2 = (function frontend$common$missionary$concurrent_exec_flow_$_cr64147_block_2(cr64147_state){
try{var cr64147_place_6 = missionary.core.unpark();
(cr64147_state[(0)] = null);

return cr64147_place_6;
}catch (e64159){var cr64147_exception = e64159;
(cr64147_state[(0)] = null);

throw cr64147_exception;
}});
return cloroutine.impl.coroutine((function (){var G__64160 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__64160[(0)] = cr64147_block_0);

return G__64160;
})());
})(),missionary.core.ap_run);
});
frontend.common.missionary.debounce = (function frontend$common$missionary$debounce(duration_ms,flow){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr64161_block_5 = (function frontend$common$missionary$debounce_$_cr64161_block_5(cr64161_state){
try{var cr64161_place_13 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr64161_place_14 = null;
if(cljs.core.truth_(cr64161_place_13)){
(cr64161_state[(0)] = cr64161_block_7);

(cr64161_state[(3)] = null);

return cr64161_state;
} else {
(cr64161_state[(0)] = cr64161_block_6);

(cr64161_state[(4)] = cr64161_place_14);

return cr64161_state;
}
}catch (e64179){var cr64161_exception = e64179;
(cr64161_state[(0)] = cr64161_block_12);

(cr64161_state[(3)] = null);

(cr64161_state[(1)] = true);

(cr64161_state[(2)] = cr64161_exception);

return cr64161_state;
}});
var cr64161_block_10 = (function frontend$common$missionary$debounce_$_cr64161_block_10(cr64161_state){
try{var cr64161_place_21 = missionary.core.unpark();
(cr64161_state[(0)] = cr64161_block_11);

(cr64161_state[(3)] = cr64161_place_21);

return cr64161_state;
}catch (e64180){var cr64161_exception = e64180;
(cr64161_state[(0)] = cr64161_block_12);

(cr64161_state[(3)] = null);

(cr64161_state[(1)] = true);

(cr64161_state[(2)] = cr64161_exception);

return cr64161_state;
}});
var cr64161_block_4 = (function frontend$common$missionary$debounce_$_cr64161_block_4(cr64161_state){
try{var cr64161_place_2 = (cr64161_state[(2)]);
var cr64161_place_9 = cr64161_place_2;
var cr64161_place_10 = missionary.Cancelled;
var cr64161_place_11 = (cr64161_place_9 instanceof cr64161_place_10);
var cr64161_place_12 = null;
if(cr64161_place_11){
(cr64161_state[(0)] = cr64161_block_9);

(cr64161_state[(3)] = cr64161_place_12);

return cr64161_state;
} else {
(cr64161_state[(0)] = cr64161_block_5);

(cr64161_state[(3)] = cr64161_place_12);

return cr64161_state;
}
}catch (e64181){var cr64161_exception = e64181;
(cr64161_state[(0)] = cr64161_block_12);

(cr64161_state[(1)] = true);

(cr64161_state[(2)] = cr64161_exception);

return cr64161_state;
}});
var cr64161_block_9 = (function frontend$common$missionary$debounce_$_cr64161_block_9(cr64161_state){
try{var cr64161_place_2 = (cr64161_state[(2)]);
var cr64161_place_18 = cr64161_place_2;
var cr64161_place_19 = (1);
var cr64161_place_20 = missionary.core.none;
(cr64161_state[(0)] = cr64161_block_10);

return missionary.core.fork(cr64161_place_19,cr64161_place_20);
}catch (e64182){var cr64161_exception = e64182;
(cr64161_state[(0)] = cr64161_block_12);

(cr64161_state[(3)] = null);

(cr64161_state[(1)] = true);

(cr64161_state[(2)] = cr64161_exception);

return cr64161_state;
}});
var cr64161_block_12 = (function frontend$common$missionary$debounce_$_cr64161_block_12(cr64161_state){
try{var cr64161_place_3 = (cr64161_state[(1)]);
var cr64161_place_2 = (cr64161_state[(2)]);
var cr64161_place_22 = (cljs.core.truth_(cr64161_place_3)?(function(){throw cr64161_place_2})():cr64161_place_2);
(cr64161_state[(0)] = null);

(cr64161_state[(1)] = null);

(cr64161_state[(2)] = null);

return cr64161_place_22;
}catch (e64186){var cr64161_exception = e64186;
(cr64161_state[(0)] = null);

(cr64161_state[(1)] = null);

(cr64161_state[(2)] = null);

throw cr64161_exception;
}});
var cr64161_block_11 = (function frontend$common$missionary$debounce_$_cr64161_block_11(cr64161_state){
try{var cr64161_place_12 = (cr64161_state[(3)]);
(cr64161_state[(0)] = cr64161_block_12);

(cr64161_state[(3)] = null);

(cr64161_state[(2)] = cr64161_place_12);

return cr64161_state;
}catch (e64187){var cr64161_exception = e64187;
(cr64161_state[(0)] = cr64161_block_12);

(cr64161_state[(3)] = null);

(cr64161_state[(1)] = true);

(cr64161_state[(2)] = cr64161_exception);

return cr64161_state;
}});
var cr64161_block_0 = (function frontend$common$missionary$debounce_$_cr64161_block_0(cr64161_state){
try{var cr64161_place_0 = flow;
(cr64161_state[(0)] = cr64161_block_1);

return missionary.core.switch$(cr64161_place_0);
}catch (e64188){var cr64161_exception = e64188;
(cr64161_state[(0)] = null);

throw cr64161_exception;
}});
var cr64161_block_6 = (function frontend$common$missionary$debounce_$_cr64161_block_6(cr64161_state){
try{var cr64161_place_15 = null;
(cr64161_state[(0)] = cr64161_block_8);

(cr64161_state[(4)] = cr64161_place_15);

return cr64161_state;
}catch (e64189){var cr64161_exception = e64189;
(cr64161_state[(0)] = cr64161_block_12);

(cr64161_state[(3)] = null);

(cr64161_state[(4)] = null);

(cr64161_state[(1)] = true);

(cr64161_state[(2)] = cr64161_exception);

return cr64161_state;
}});
var cr64161_block_2 = (function frontend$common$missionary$debounce_$_cr64161_block_2(cr64161_state){
try{var cr64161_place_1 = (cr64161_state[(3)]);
var cr64161_place_4 = missionary.core.sleep;
var cr64161_place_5 = duration_ms;
var cr64161_place_6 = cr64161_place_1;
var cr64161_place_7 = (function (){var G__64192 = cr64161_place_5;
var G__64193 = cr64161_place_6;
var fexpr__64191 = cr64161_place_4;
return (fexpr__64191.cljs$core$IFn$_invoke$arity$2 ? fexpr__64191.cljs$core$IFn$_invoke$arity$2(G__64192,G__64193) : fexpr__64191.call(null,G__64192,G__64193));
})();
(cr64161_state[(0)] = cr64161_block_3);

(cr64161_state[(3)] = null);

return missionary.core.park(cr64161_place_7);
}catch (e64190){var cr64161_exception = e64190;
(cr64161_state[(0)] = cr64161_block_4);

(cr64161_state[(3)] = null);

(cr64161_state[(2)] = cr64161_exception);

return cr64161_state;
}});
var cr64161_block_7 = (function frontend$common$missionary$debounce_$_cr64161_block_7(cr64161_state){
try{var cr64161_place_2 = (cr64161_state[(2)]);
var cr64161_place_16 = cr64161_place_2;
var cr64161_place_17 = (function(){throw cr64161_place_16})();
(cr64161_state[(0)] = null);

(cr64161_state[(1)] = null);

(cr64161_state[(2)] = null);

return null;
}catch (e64194){var cr64161_exception = e64194;
(cr64161_state[(0)] = cr64161_block_12);

(cr64161_state[(1)] = true);

(cr64161_state[(2)] = cr64161_exception);

return cr64161_state;
}});
var cr64161_block_8 = (function frontend$common$missionary$debounce_$_cr64161_block_8(cr64161_state){
try{var cr64161_place_14 = (cr64161_state[(4)]);
(cr64161_state[(0)] = cr64161_block_11);

(cr64161_state[(4)] = null);

(cr64161_state[(3)] = cr64161_place_14);

return cr64161_state;
}catch (e64195){var cr64161_exception = e64195;
(cr64161_state[(0)] = cr64161_block_12);

(cr64161_state[(3)] = null);

(cr64161_state[(4)] = null);

(cr64161_state[(1)] = true);

(cr64161_state[(2)] = cr64161_exception);

return cr64161_state;
}});
var cr64161_block_1 = (function frontend$common$missionary$debounce_$_cr64161_block_1(cr64161_state){
try{var cr64161_place_1 = missionary.core.unpark();
var cr64161_place_2 = null;
var cr64161_place_3 = false;
(cr64161_state[(0)] = cr64161_block_2);

(cr64161_state[(3)] = cr64161_place_1);

(cr64161_state[(2)] = cr64161_place_2);

(cr64161_state[(1)] = cr64161_place_3);

return cr64161_state;
}catch (e64196){var cr64161_exception = e64196;
(cr64161_state[(0)] = null);

throw cr64161_exception;
}});
var cr64161_block_3 = (function frontend$common$missionary$debounce_$_cr64161_block_3(cr64161_state){
try{var cr64161_place_8 = missionary.core.unpark();
(cr64161_state[(0)] = cr64161_block_12);

(cr64161_state[(2)] = cr64161_place_8);

return cr64161_state;
}catch (e64197){var cr64161_exception = e64197;
(cr64161_state[(0)] = cr64161_block_4);

(cr64161_state[(2)] = cr64161_exception);

return cr64161_state;
}});
return cloroutine.impl.coroutine((function (){var G__64198 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__64198[(0)] = cr64161_block_0);

return G__64198;
})());
})(),missionary.core.ap_run);
});
frontend.common.missionary.throttle = (function frontend$common$missionary$throttle(dur_ms,_GT_in){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr64199_block_3 = (function frontend$common$missionary$throttle_$_cr64199_block_3(cr64199_state){
try{var cr64199_place_5 = (cr64199_state[(1)]);
var cr64199_place_15 = cr64199_place_5;
(cr64199_state[(0)] = cr64199_block_8);

(cr64199_state[(1)] = null);

(cr64199_state[(2)] = cr64199_place_15);

return cr64199_state;
}catch (e64223){var cr64199_exception = e64223;
(cr64199_state[(0)] = null);

(cr64199_state[(2)] = null);

(cr64199_state[(1)] = null);

throw cr64199_exception;
}});
var cr64199_block_1 = (function frontend$common$missionary$throttle_$_cr64199_block_1(cr64199_state){
try{var cr64199_place_5 = missionary.core.unpark();
var cr64199_place_6 = (1);
var cr64199_place_7 = missionary.core.seed;
var cr64199_place_8 = cljs.core.range;
var cr64199_place_9 = (2);
var cr64199_place_10 = (function (){var G__64227 = cr64199_place_9;
var fexpr__64226 = cr64199_place_8;
return (fexpr__64226.cljs$core$IFn$_invoke$arity$1 ? fexpr__64226.cljs$core$IFn$_invoke$arity$1(G__64227) : fexpr__64226.call(null,G__64227));
})();
var cr64199_place_11 = (function (){var G__64229 = cr64199_place_10;
var fexpr__64228 = cr64199_place_7;
return (fexpr__64228.cljs$core$IFn$_invoke$arity$1 ? fexpr__64228.cljs$core$IFn$_invoke$arity$1(G__64229) : fexpr__64228.call(null,G__64229));
})();
(cr64199_state[(0)] = cr64199_block_2);

(cr64199_state[(1)] = cr64199_place_5);

return missionary.core.fork(cr64199_place_6,cr64199_place_11);
}catch (e64225){var cr64199_exception = e64225;
(cr64199_state[(0)] = null);

throw cr64199_exception;
}});
var cr64199_block_7 = (function frontend$common$missionary$throttle_$_cr64199_block_7(cr64199_state){
try{var cr64199_place_12 = (cr64199_state[(1)]);
var cr64199_place_23 = "No matching clause: ";
var cr64199_place_24 = cr64199_place_12;
var cr64199_place_25 = [cr64199_place_23,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr64199_place_24)].join('');
var cr64199_place_26 = (new Error(cr64199_place_25));
var cr64199_place_27 = (function(){throw cr64199_place_26})();
(cr64199_state[(0)] = null);

(cr64199_state[(1)] = null);

return null;
}catch (e64230){var cr64199_exception = e64230;
(cr64199_state[(0)] = null);

(cr64199_state[(1)] = null);

throw cr64199_exception;
}});
var cr64199_block_5 = (function frontend$common$missionary$throttle_$_cr64199_block_5(cr64199_state){
try{var cr64199_place_19 = missionary.core.unpark();
var cr64199_place_20 = (1);
var cr64199_place_21 = missionary.core.none;
(cr64199_state[(0)] = cr64199_block_6);

return missionary.core.fork(cr64199_place_20,cr64199_place_21);
}catch (e64235){var cr64199_exception = e64235;
(cr64199_state[(0)] = null);

(cr64199_state[(2)] = null);

throw cr64199_exception;
}});
var cr64199_block_8 = (function frontend$common$missionary$throttle_$_cr64199_block_8(cr64199_state){
try{var cr64199_place_14 = (cr64199_state[(2)]);
(cr64199_state[(0)] = null);

(cr64199_state[(2)] = null);

return cr64199_place_14;
}catch (e64241){var cr64199_exception = e64241;
(cr64199_state[(0)] = null);

(cr64199_state[(2)] = null);

throw cr64199_exception;
}});
var cr64199_block_0 = (function frontend$common$missionary$throttle_$_cr64199_block_0(cr64199_state){
try{var cr64199_place_0 = (1);
var cr64199_place_1 = missionary.core.relieve;
var cr64199_place_2 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr64199_place_3 = _GT_in;
var cr64199_place_4 = (function (){var G__64245 = cr64199_place_2;
var G__64246 = cr64199_place_3;
var fexpr__64244 = cr64199_place_1;
return (fexpr__64244.cljs$core$IFn$_invoke$arity$2 ? fexpr__64244.cljs$core$IFn$_invoke$arity$2(G__64245,G__64246) : fexpr__64244.call(null,G__64245,G__64246));
})();
(cr64199_state[(0)] = cr64199_block_1);

return missionary.core.fork(cr64199_place_0,cr64199_place_4);
}catch (e64243){var cr64199_exception = e64243;
(cr64199_state[(0)] = null);

throw cr64199_exception;
}});
var cr64199_block_2 = (function frontend$common$missionary$throttle_$_cr64199_block_2(cr64199_state){
try{var cr64199_place_12 = missionary.core.unpark();
var cr64199_place_13 = cr64199_place_12;
var cr64199_place_14 = null;
var G__64248 = cr64199_place_13;
switch (G__64248) {
case (0):
(cr64199_state[(0)] = cr64199_block_3);

(cr64199_state[(2)] = cr64199_place_14);

return cr64199_state;

break;
case (1):
(cr64199_state[(0)] = cr64199_block_4);

(cr64199_state[(1)] = null);

(cr64199_state[(2)] = cr64199_place_14);

return cr64199_state;

break;
default:
(cr64199_state[(0)] = cr64199_block_7);

(cr64199_state[(1)] = null);

(cr64199_state[(1)] = cr64199_place_12);

return cr64199_state;

}
}catch (e64247){var cr64199_exception = e64247;
(cr64199_state[(0)] = null);

(cr64199_state[(1)] = null);

throw cr64199_exception;
}});
var cr64199_block_4 = (function frontend$common$missionary$throttle_$_cr64199_block_4(cr64199_state){
try{var cr64199_place_16 = missionary.core.sleep;
var cr64199_place_17 = dur_ms;
var cr64199_place_18 = (function (){var G__64252 = cr64199_place_17;
var fexpr__64251 = cr64199_place_16;
return (fexpr__64251.cljs$core$IFn$_invoke$arity$1 ? fexpr__64251.cljs$core$IFn$_invoke$arity$1(G__64252) : fexpr__64251.call(null,G__64252));
})();
(cr64199_state[(0)] = cr64199_block_5);

return missionary.core.park(cr64199_place_18);
}catch (e64249){var cr64199_exception = e64249;
(cr64199_state[(0)] = null);

(cr64199_state[(2)] = null);

throw cr64199_exception;
}});
var cr64199_block_6 = (function frontend$common$missionary$throttle_$_cr64199_block_6(cr64199_state){
try{var cr64199_place_22 = missionary.core.unpark();
(cr64199_state[(0)] = cr64199_block_8);

(cr64199_state[(2)] = cr64199_place_22);

return cr64199_state;
}catch (e64258){var cr64199_exception = e64258;
(cr64199_state[(0)] = null);

(cr64199_state[(2)] = null);

throw cr64199_exception;
}});
return cloroutine.impl.coroutine((function (){var G__64262 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__64262[(0)] = cr64199_block_0);

return G__64262;
})());
})(),missionary.core.ap_run);
});
/**
 * Return a task. take first value from f.
 *   can be understood as `deref` in missionary
 */
frontend.common.missionary.snapshot_of_flow = (function frontend$common$missionary$snapshot_of_flow(f){
return missionary.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,null,missionary.core.eduction.cljs$core$IFn$_invoke$arity$2(cljs.core.take.cljs$core$IFn$_invoke$arity$1((1)),f));
});
frontend.common.missionary.fail_case_default_handler = (function frontend$common$missionary$fail_case_default_handler(e){
if((e instanceof missionary.Cancelled)){
return null;
} else {
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.common.missionary",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"run-task*-failed","run-task*-failed",-735653097),e,new cljs.core.Keyword(null,"line","line",212345235),120], null)),null);
}
});
/**
 * Return the canceler
 */
frontend.common.missionary.run_task = (function frontend$common$missionary$run_task(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64785 = arguments.length;
var i__5727__auto___64786 = (0);
while(true){
if((i__5727__auto___64786 < len__5726__auto___64785)){
args__5732__auto__.push((arguments[i__5727__auto___64786]));

var G__64787 = (i__5727__auto___64786 + (1));
i__5727__auto___64786 = G__64787;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.common.missionary.run_task.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.common.missionary.run_task.cljs$core$IFn$_invoke$arity$variadic = (function (key_SINGLEQUOTE_,task,p__64296){
var map__64297 = p__64296;
var map__64297__$1 = cljs.core.__destructure_map(map__64297);
var succ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64297__$1,new cljs.core.Keyword(null,"succ","succ",1386276271));
var fail = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64297__$1,new cljs.core.Keyword(null,"fail","fail",1706214930));
var cancel = (function (){var G__64299 = (function (){var or__5002__auto__ = succ;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (function (p1__64271_SHARP_){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.common.missionary",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),key_SINGLEQUOTE_,new cljs.core.Keyword(null,"succ","succ",1386276271),p1__64271_SHARP_,new cljs.core.Keyword(null,"line","line",212345235),125], null)),null);
});
}
})();
var G__64300 = (function (){var or__5002__auto__ = fail;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.common.missionary.fail_case_default_handler;
}
})();
return (task.cljs$core$IFn$_invoke$arity$2 ? task.cljs$core$IFn$_invoke$arity$2(G__64299,G__64300) : task.call(null,G__64299,G__64300));
})();
return (function (){
return (cancel.cljs$core$IFn$_invoke$arity$0 ? cancel.cljs$core$IFn$_invoke$arity$0() : cancel.call(null));
});
}));

(frontend.common.missionary.run_task.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.common.missionary.run_task.cljs$lang$applyTo = (function (seq64275){
var G__64276 = cljs.core.first(seq64275);
var seq64275__$1 = cljs.core.next(seq64275);
var G__64277 = cljs.core.first(seq64275__$1);
var seq64275__$2 = cljs.core.next(seq64275__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__64276,G__64277,seq64275__$2);
}));

/**
 * Return the canceler
 */
frontend.common.missionary.run_task_STAR_ = (function frontend$common$missionary$run_task_STAR_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64794 = arguments.length;
var i__5727__auto___64795 = (0);
while(true){
if((i__5727__auto___64795 < len__5726__auto___64794)){
args__5732__auto__.push((arguments[i__5727__auto___64795]));

var G__64796 = (i__5727__auto___64795 + (1));
i__5727__auto___64795 = G__64796;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.common.missionary.run_task_STAR_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.common.missionary.run_task_STAR_.cljs$core$IFn$_invoke$arity$variadic = (function (task,p__64315){
var map__64316 = p__64315;
var map__64316__$1 = cljs.core.__destructure_map(map__64316);
var succ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64316__$1,new cljs.core.Keyword(null,"succ","succ",1386276271));
var fail = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64316__$1,new cljs.core.Keyword(null,"fail","fail",1706214930));
var cancel = (function (){var G__64332 = (function (){var or__5002__auto__ = succ;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.constantly(null);
}
})();
var G__64333 = (function (){var or__5002__auto__ = fail;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.common.missionary.fail_case_default_handler;
}
})();
return (task.cljs$core$IFn$_invoke$arity$2 ? task.cljs$core$IFn$_invoke$arity$2(G__64332,G__64333) : task.call(null,G__64332,G__64333));
})();
return (function (){
return (cancel.cljs$core$IFn$_invoke$arity$0 ? cancel.cljs$core$IFn$_invoke$arity$0() : cancel.call(null));
});
}));

(frontend.common.missionary.run_task_STAR_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.common.missionary.run_task_STAR_.cljs$lang$applyTo = (function (seq64308){
var G__64309 = cljs.core.first(seq64308);
var seq64308__$1 = cljs.core.next(seq64308);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__64309,seq64308__$1);
}));

/**
 * Return the canceler
 */
frontend.common.missionary.run_task_throw = (function frontend$common$missionary$run_task_throw(var_args){
var args__5732__auto__ = [];
var len__5726__auto___64809 = arguments.length;
var i__5727__auto___64811 = (0);
while(true){
if((i__5727__auto___64811 < len__5726__auto___64809)){
args__5732__auto__.push((arguments[i__5727__auto___64811]));

var G__64812 = (i__5727__auto___64811 + (1));
i__5727__auto___64811 = G__64812;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.common.missionary.run_task_throw.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.common.missionary.run_task_throw.cljs$core$IFn$_invoke$arity$variadic = (function (key_SINGLEQUOTE_,task,p__64379){
var map__64380 = p__64379;
var map__64380__$1 = cljs.core.__destructure_map(map__64380);
var succ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__64380__$1,new cljs.core.Keyword(null,"succ","succ",1386276271));
var cancel = (function (){var G__64387 = (function (){var or__5002__auto__ = succ;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (function (p1__64350_SHARP_){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.common.missionary",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),key_SINGLEQUOTE_,new cljs.core.Keyword(null,"succ","succ",1386276271),p1__64350_SHARP_,new cljs.core.Keyword(null,"line","line",212345235),137], null)),null);
});
}
})();
var G__64388 = (function (p1__64351_SHARP_){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("task stopped",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),key_SINGLEQUOTE_,new cljs.core.Keyword(null,"e","e",1381269198),p1__64351_SHARP_], null));
});
return (task.cljs$core$IFn$_invoke$arity$2 ? task.cljs$core$IFn$_invoke$arity$2(G__64387,G__64388) : task.call(null,G__64387,G__64388));
})();
return (function (){
return (cancel.cljs$core$IFn$_invoke$arity$0 ? cancel.cljs$core$IFn$_invoke$arity$0() : cancel.call(null));
});
}));

(frontend.common.missionary.run_task_throw.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.common.missionary.run_task_throw.cljs$lang$applyTo = (function (seq64365){
var G__64366 = cljs.core.first(seq64365);
var seq64365__$1 = cljs.core.next(seq64365);
var G__64367 = cljs.core.first(seq64365__$1);
var seq64365__$2 = cljs.core.next(seq64365__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__64366,G__64367,seq64365__$2);
}));

if((typeof frontend !== 'undefined') && (typeof frontend.common !== 'undefined') && (typeof frontend.common.missionary !== 'undefined') && (typeof frontend.common.missionary._STAR_background_task_cancelers !== 'undefined')){
} else {
frontend.common.missionary._STAR_background_task_cancelers = cljs.core.volatile_BANG_(cljs.core.PersistentArrayMap.EMPTY);
}
/**
 * Run task.
 *   Cancel last same key background-task if exists(to avoid: reload cljs then run multiple same tasks)
 */
frontend.common.missionary.run_background_task = (function frontend$common$missionary$run_background_task(key_SINGLEQUOTE_,task){
var temp__5804__auto___64818 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.common.missionary._STAR_background_task_cancelers),key_SINGLEQUOTE_);
if(cljs.core.truth_(temp__5804__auto___64818)){
var canceler_64820 = temp__5804__auto___64818;
(canceler_64820.cljs$core$IFn$_invoke$arity$0 ? canceler_64820.cljs$core$IFn$_invoke$arity$0() : canceler_64820.call(null));

frontend.common.missionary._STAR_background_task_cancelers.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.missionary._STAR_background_task_cancelers.cljs$core$IDeref$_deref$arity$1(null),key_SINGLEQUOTE_,null));
} else {
}

cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"run-background-task","run-background-task",-36306267),key_SINGLEQUOTE_], 0));

var canceler = frontend.common.missionary.run_task(key_SINGLEQUOTE_,task);
frontend.common.missionary._STAR_background_task_cancelers.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.common.missionary._STAR_background_task_cancelers.cljs$core$IDeref$_deref$arity$1(null),key_SINGLEQUOTE_,canceler));

return null;
});
frontend.common.missionary.background_task_running_QMARK_ = (function frontend$common$missionary$background_task_running_QMARK_(key_SINGLEQUOTE_){
return cljs.core.contains_QMARK_(cljs.core.deref(frontend.common.missionary._STAR_background_task_cancelers),key_SINGLEQUOTE_);
});
/**
 * Return a task.
 *   if arg is a channel, takes from given channel, completing with value when take is accepted, or nil if port was closed.
 *   if arg is a promise, completing with the result of given promise.
 *   if arg is a missionary task, just return it
 */
frontend.common.missionary._LT__BANG_ = (function frontend$common$missionary$_LT__BANG_(chan_or_promise_or_task){
if((chan_or_promise_or_task instanceof cljs.core.async.impl.channels.ManyToManyChannel)){
var G__64414 = missionary.core.dfv();
cljs.core.async.take_BANG_.cljs$core$IFn$_invoke$arity$2(chan_or_promise_or_task,G__64414);

return G__64414;
} else {
if((function (){var or__5002__auto__ = (chan_or_promise_or_task instanceof Promise);
if(or__5002__auto__){
return or__5002__auto__;
} else {
if((!((chan_or_promise_or_task == null)))){
if(((false) || ((cljs.core.PROTOCOL_SENTINEL === chan_or_promise_or_task.promesa$protocols$IPromise$)))){
return true;
} else {
if((!chan_or_promise_or_task.cljs$lang$protocol_mask$partition$)){
return cljs.core.native_satisfies_QMARK_(promesa.protocols.IPromise,chan_or_promise_or_task);
} else {
return false;
}
}
} else {
return cljs.core.native_satisfies_QMARK_(promesa.protocols.IPromise,chan_or_promise_or_task);
}
}
})()){
var v = missionary.core.dfv();
chan_or_promise_or_task.then((function (p1__64409_SHARP_){
var G__64421 = (function (){
return p1__64409_SHARP_;
});
return (v.cljs$core$IFn$_invoke$arity$1 ? v.cljs$core$IFn$_invoke$arity$1(G__64421) : v.call(null,G__64421));
}),(function (p1__64410_SHARP_){
var G__64422 = (function (){
throw p1__64410_SHARP_;
});
return (v.cljs$core$IFn$_invoke$arity$1 ? v.cljs$core$IFn$_invoke$arity$1(G__64422) : v.call(null,G__64422));
}));

return missionary.core.absolve(v);
} else {
if(cljs.core.fn_QMARK_(chan_or_promise_or_task)){
return chan_or_promise_or_task;
} else {
if((chan_or_promise_or_task == null)){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr64428_block_0 = (function frontend$common$missionary$_LT__BANG__$_cr64428_block_0(cr64428_state){
try{var cr64428_place_0 = null;
(cr64428_state[(0)] = null);

return cr64428_place_0;
}catch (e64442){var cr64428_exception = e64442;
(cr64428_state[(0)] = null);

throw cr64428_exception;
}});
return cloroutine.impl.coroutine((function (){var G__64450 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__64450[(0)] = cr64428_block_0);

return G__64450;
})());
})(),missionary.core.sp_run);
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Unsupported arg",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),cljs.core.type(chan_or_promise_or_task)], null));

}
}
}
}
});

//# sourceMappingURL=frontend.common.missionary.js.map
