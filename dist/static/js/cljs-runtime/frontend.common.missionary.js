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
var G__56336 = arguments.length;
switch (G__56336) {
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
var len__5726__auto___58131 = arguments.length;
var i__5727__auto___58132 = (0);
while(true){
if((i__5727__auto___58132 < len__5726__auto___58131)){
args__5732__auto__.push((arguments[i__5727__auto___58132]));

var G__58136 = (i__5727__auto___58132 + (1));
i__5727__auto___58132 = G__58136;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return frontend.common.missionary.mix.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(frontend.common.missionary.mix.cljs$core$IFn$_invoke$arity$variadic = (function (flows){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr56351_block_0 = (function frontend$common$missionary$cr56351_block_0(cr56351_state){
try{var cr56351_place_0 = (1);
var cr56351_place_1 = cljs.core.count;
var cr56351_place_2 = flows;
var cr56351_place_3 = (function (){var G__56450 = cr56351_place_2;
var fexpr__56449 = cr56351_place_1;
return (fexpr__56449.cljs$core$IFn$_invoke$arity$1 ? fexpr__56449.cljs$core$IFn$_invoke$arity$1(G__56450) : fexpr__56449.call(null,G__56450));
})();
var cr56351_place_4 = missionary.core.seed;
var cr56351_place_5 = flows;
var cr56351_place_6 = (function (){var G__56455 = cr56351_place_5;
var fexpr__56454 = cr56351_place_4;
return (fexpr__56454.cljs$core$IFn$_invoke$arity$1 ? fexpr__56454.cljs$core$IFn$_invoke$arity$1(G__56455) : fexpr__56454.call(null,G__56455));
})();
(cr56351_state[(0)] = cr56351_block_1);

(cr56351_state[(1)] = cr56351_place_0);

return missionary.core.fork(cr56351_place_3,cr56351_place_6);
}catch (e56448){var cr56351_exception = e56448;
(cr56351_state[(0)] = null);

throw cr56351_exception;
}});
var cr56351_block_1 = (function frontend$common$missionary$cr56351_block_1(cr56351_state){
try{var cr56351_place_0 = (cr56351_state[(1)]);
var cr56351_place_7 = missionary.core.unpark();
(cr56351_state[(0)] = cr56351_block_2);

(cr56351_state[(1)] = null);

return missionary.core.fork(cr56351_place_0,cr56351_place_7);
}catch (e56463){var cr56351_exception = e56463;
(cr56351_state[(0)] = null);

(cr56351_state[(1)] = null);

throw cr56351_exception;
}});
var cr56351_block_2 = (function frontend$common$missionary$cr56351_block_2(cr56351_state){
try{var cr56351_place_8 = missionary.core.unpark();
(cr56351_state[(0)] = null);

return cr56351_place_8;
}catch (e56468){var cr56351_exception = e56468;
(cr56351_state[(0)] = null);

throw cr56351_exception;
}});
return cloroutine.impl.coroutine((function (){var G__56470 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((2));
(G__56470[(0)] = cr56351_block_0);

return G__56470;
})());
})(),missionary.core.ap_run);
}));

(frontend.common.missionary.mix.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(frontend.common.missionary.mix.cljs$lang$applyTo = (function (seq56345){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq56345));
}));

frontend.common.missionary.never_flow = cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr56473_block_0 = (function frontend$common$missionary$cr56473_block_0(cr56473_state){
try{var cr56473_place_0 = missionary.core.never;
(cr56473_state[(0)] = cr56473_block_1);

return missionary.core.park(cr56473_place_0);
}catch (e56482){var cr56473_exception = e56482;
(cr56473_state[(0)] = null);

throw cr56473_exception;
}});
var cr56473_block_1 = (function frontend$common$missionary$cr56473_block_1(cr56473_state){
try{var cr56473_place_1 = missionary.core.unpark();
(cr56473_state[(0)] = null);

return cr56473_place_1;
}catch (e56483){var cr56473_exception = e56483;
(cr56473_state[(0)] = null);

throw cr56473_exception;
}});
return cloroutine.impl.coroutine((function (){var G__56485 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__56485[(0)] = cr56473_block_0);

return G__56485;
})());
})(),missionary.core.ap_run);
frontend.common.missionary.delays = cljs.core.reductions.cljs$core$IFn$_invoke$arity$3(cljs.core._STAR_,(1000),cljs.core.repeat.cljs$core$IFn$_invoke$arity$1((2)));
frontend.common.missionary.retry_sentinel = ({});
/**
 * Retry task when it throw exception `(get ex-data :missionary/retry)`
 *   :delay-seq - retry delay-msecs
 *   :reset-flow - retry immediately when getting value from flow and reset delays to init state
 */
frontend.common.missionary.backoff = (function frontend$common$missionary$backoff(p__56490,task){
var map__56491 = p__56490;
var map__56491__$1 = cljs.core.__destructure_map(map__56491);
var delay_seq = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__56491__$1,new cljs.core.Keyword(null,"delay-seq","delay-seq",-1959201166),cljs.core.take.cljs$core$IFn$_invoke$arity$2((4),frontend.common.missionary.delays));
var reset_flow = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__56491__$1,new cljs.core.Keyword(null,"reset-flow","reset-flow",-1725822377),frontend.common.missionary.never_flow);
var reset_flow_STAR_ = frontend.common.missionary.mix.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([reset_flow,frontend.common.missionary.never_flow], 0));
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr56506_block_10 = (function frontend$common$missionary$backoff_$_cr56506_block_10(cr56506_state){
try{var cr56506_place_45 = (cr56506_state[(8)]);
var cr56506_place_50 = cr56506_place_45;
var cr56506_place_51 = null;
if(cljs.core.truth_(cr56506_place_50)){
(cr56506_state[(0)] = cr56506_block_12);

(cr56506_state[(8)] = null);

(cr56506_state[(6)] = cr56506_place_51);

return cr56506_state;
} else {
(cr56506_state[(0)] = cr56506_block_11);

(cr56506_state[(6)] = cr56506_place_51);

return cr56506_state;
}
}catch (e57279){var cr56506_exception = e57279;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(7)] = null);

(cr56506_state[(8)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_7 = (function frontend$common$missionary$backoff_$_cr56506_block_7(cr56506_state){
try{var cr56506_place_37 = (cr56506_state[(6)]);
var cr56506_place_42 = cr56506_place_37;
var cr56506_place_43 = null;
var cr56506_place_44 = (cr56506_place_42 == cr56506_place_43);
var cr56506_place_45 = null;
if(cr56506_place_44){
(cr56506_state[(0)] = cr56506_block_9);

(cr56506_state[(6)] = null);

(cr56506_state[(8)] = cr56506_place_45);

return cr56506_state;
} else {
(cr56506_state[(0)] = cr56506_block_8);

(cr56506_state[(8)] = cr56506_place_45);

return cr56506_state;
}
}catch (e57284){var cr56506_exception = e57284;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(6)] = null);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(7)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_34 = (function frontend$common$missionary$backoff_$_cr56506_block_34(cr56506_state){
try{var cr56506_place_137 = (cr56506_state[(1)]);
(cr56506_state[(0)] = null);

(cr56506_state[(1)] = null);

return cr56506_place_137;
}catch (e57288){var cr56506_exception = e57288;
(cr56506_state[(0)] = null);

(cr56506_state[(1)] = null);

throw cr56506_exception;
}});
var cr56506_block_25 = (function frontend$common$missionary$backoff_$_cr56506_block_25(cr56506_state){
try{var cr56506_place_29 = (cr56506_state[(2)]);
var cr56506_place_28 = (cr56506_state[(4)]);
var cr56506_place_119 = (cljs.core.truth_(cr56506_place_29)?(function(){throw cr56506_place_28})():cr56506_place_28);
var cr56506_place_120 = cljs.core.vector_QMARK_;
var cr56506_place_121 = cr56506_place_119;
var cr56506_place_122 = (function (){var G__57303 = cr56506_place_121;
var fexpr__57302 = cr56506_place_120;
return (fexpr__57302.cljs$core$IFn$_invoke$arity$1 ? fexpr__57302.cljs$core$IFn$_invoke$arity$1(G__57303) : fexpr__57302.call(null,G__57303));
})();
var cr56506_place_123 = cr56506_place_122;
var cr56506_place_124 = null;
if(cr56506_place_123){
(cr56506_state[(0)] = cr56506_block_27);

(cr56506_state[(2)] = null);

(cr56506_state[(4)] = null);

(cr56506_state[(2)] = cr56506_place_119);

(cr56506_state[(4)] = cr56506_place_124);

return cr56506_state;
} else {
(cr56506_state[(0)] = cr56506_block_26);

(cr56506_state[(2)] = null);

(cr56506_state[(4)] = null);

(cr56506_state[(2)] = cr56506_place_119);

(cr56506_state[(3)] = cr56506_place_122);

(cr56506_state[(4)] = cr56506_place_124);

return cr56506_state;
}
}catch (e57293){var cr56506_exception = e57293;
(cr56506_state[(0)] = null);

(cr56506_state[(2)] = null);

(cr56506_state[(1)] = null);

(cr56506_state[(4)] = null);

throw cr56506_exception;
}});
var cr56506_block_24 = (function frontend$common$missionary$backoff_$_cr56506_block_24(cr56506_state){
try{var cr56506_place_56 = (cr56506_state[(6)]);
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(6)] = null);

(cr56506_state[(4)] = cr56506_place_56);

return cr56506_state;
}catch (e57313){var cr56506_exception = e57313;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(6)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_3 = (function frontend$common$missionary$backoff_$_cr56506_block_3(cr56506_state){
try{var cr56506_place_31 = missionary.core.unpark();
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(4)] = cr56506_place_31);

return cr56506_state;
}catch (e57331){var cr56506_exception = e57331;
(cr56506_state[(0)] = cr56506_block_4);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_0 = (function frontend$common$missionary$backoff_$_cr56506_block_0(cr56506_state){
try{var cr56506_place_0 = cljs.core.seq;
var cr56506_place_1 = delay_seq;
var cr56506_place_2 = (function (){var G__57354 = cr56506_place_1;
var fexpr__57353 = cr56506_place_0;
return (fexpr__57353.cljs$core$IFn$_invoke$arity$1 ? fexpr__57353.cljs$core$IFn$_invoke$arity$1(G__57354) : fexpr__57353.call(null,G__57354));
})();
var cr56506_place_3 = cr56506_place_2;
var cr56506_place_4 = cljs.core.seq;
var cr56506_place_5 = cr56506_place_3;
var cr56506_place_6 = (function (){var G__57359 = cr56506_place_5;
var fexpr__57358 = cr56506_place_4;
return (fexpr__57358.cljs$core$IFn$_invoke$arity$1 ? fexpr__57358.cljs$core$IFn$_invoke$arity$1(G__57359) : fexpr__57358.call(null,G__57359));
})();
var cr56506_place_7 = cljs.core.first;
var cr56506_place_8 = cr56506_place_6;
var cr56506_place_9 = (function (){var G__57365 = cr56506_place_8;
var fexpr__57364 = cr56506_place_7;
return (fexpr__57364.cljs$core$IFn$_invoke$arity$1 ? fexpr__57364.cljs$core$IFn$_invoke$arity$1(G__57365) : fexpr__57364.call(null,G__57365));
})();
var cr56506_place_10 = cljs.core.next;
var cr56506_place_11 = cr56506_place_6;
var cr56506_place_12 = (function (){var G__57370 = cr56506_place_11;
var fexpr__57369 = cr56506_place_10;
return (fexpr__57369.cljs$core$IFn$_invoke$arity$1 ? fexpr__57369.cljs$core$IFn$_invoke$arity$1(G__57370) : fexpr__57369.call(null,G__57370));
})();
var cr56506_place_13 = cr56506_place_9;
var cr56506_place_14 = cr56506_place_12;
var cr56506_place_15 = cr56506_place_2;
(cr56506_state[(0)] = cr56506_block_1);

(cr56506_state[(1)] = cr56506_place_15);

return cr56506_state;
}catch (e57347){var cr56506_exception = e57347;
(cr56506_state[(0)] = null);

throw cr56506_exception;
}});
var cr56506_block_13 = (function frontend$common$missionary$backoff_$_cr56506_block_13(cr56506_state){
try{var cr56506_place_51 = (cr56506_state[(6)]);
var cr56506_place_56 = null;
if(cljs.core.truth_(cr56506_place_51)){
(cr56506_state[(0)] = cr56506_block_15);

(cr56506_state[(6)] = null);

(cr56506_state[(6)] = cr56506_place_56);

return cr56506_state;
} else {
(cr56506_state[(0)] = cr56506_block_14);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(6)] = null);

return cr56506_state;
}
}catch (e57384){var cr56506_exception = e57384;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(7)] = null);

(cr56506_state[(6)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_19 = (function frontend$common$missionary$backoff_$_cr56506_block_19(cr56506_state){
try{var cr56506_place_85 = (cr56506_state[(8)]);
var cr56506_place_89 = cr56506_place_85;
var cr56506_place_90 = null;
var G__57404 = cr56506_place_89;
switch (G__57404) {
case "delay":
(cr56506_state[(0)] = cr56506_block_20);

(cr56506_state[(8)] = null);

(cr56506_state[(8)] = cr56506_place_90);

return cr56506_state;

break;
case "reset":
(cr56506_state[(0)] = cr56506_block_21);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(8)] = null);

(cr56506_state[(8)] = cr56506_place_90);

return cr56506_state;

break;
default:
(cr56506_state[(0)] = cr56506_block_22);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(7)] = null);

(cr56506_state[(6)] = null);

return cr56506_state;

}
}catch (e57402){var cr56506_exception = e57402;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(7)] = null);

(cr56506_state[(6)] = null);

(cr56506_state[(8)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_17 = (function frontend$common$missionary$backoff_$_cr56506_block_17(cr56506_state){
try{var cr56506_place_86 = null;
(cr56506_state[(0)] = cr56506_block_19);

(cr56506_state[(8)] = cr56506_place_86);

return cr56506_state;
}catch (e57409){var cr56506_exception = e57409;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(7)] = null);

(cr56506_state[(6)] = null);

(cr56506_state[(8)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_11 = (function frontend$common$missionary$backoff_$_cr56506_block_11(cr56506_state){
try{var cr56506_place_45 = (cr56506_state[(8)]);
var cr56506_place_52 = cr56506_place_45;
(cr56506_state[(0)] = cr56506_block_13);

(cr56506_state[(8)] = null);

(cr56506_state[(6)] = cr56506_place_52);

return cr56506_state;
}catch (e57415){var cr56506_exception = e57415;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(7)] = null);

(cr56506_state[(6)] = null);

(cr56506_state[(8)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_31 = (function frontend$common$missionary$backoff_$_cr56506_block_31(cr56506_state){
try{var cr56506_place_124 = (cr56506_state[(4)]);
var cr56506_place_137 = null;
if(cljs.core.truth_(cr56506_place_124)){
(cr56506_state[(0)] = cr56506_block_33);

(cr56506_state[(4)] = null);

return cr56506_state;
} else {
(cr56506_state[(0)] = cr56506_block_32);

(cr56506_state[(1)] = null);

(cr56506_state[(4)] = null);

(cr56506_state[(1)] = cr56506_place_137);

return cr56506_state;
}
}catch (e57418){var cr56506_exception = e57418;
(cr56506_state[(0)] = null);

(cr56506_state[(2)] = null);

(cr56506_state[(1)] = null);

(cr56506_state[(4)] = null);

throw cr56506_exception;
}});
var cr56506_block_18 = (function frontend$common$missionary$backoff_$_cr56506_block_18(cr56506_state){
try{var cr56506_place_81 = (cr56506_state[(9)]);
var cr56506_place_87 = cr56506_place_81;
var cr56506_place_88 = cr56506_place_87.fqn;
(cr56506_state[(0)] = cr56506_block_19);

(cr56506_state[(9)] = null);

(cr56506_state[(8)] = cr56506_place_88);

return cr56506_state;
}catch (e57420){var cr56506_exception = e57420;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(3)] = null);

(cr56506_state[(9)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(7)] = null);

(cr56506_state[(6)] = null);

(cr56506_state[(8)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_1 = (function frontend$common$missionary$backoff_$_cr56506_block_1(cr56506_state){
try{var cr56506_place_15 = (cr56506_state[(1)]);
var cr56506_place_16 = cr56506_place_15;
var cr56506_place_17 = cljs.core.seq;
var cr56506_place_18 = cr56506_place_16;
var cr56506_place_19 = (function (){var G__57423 = cr56506_place_18;
var fexpr__57422 = cr56506_place_17;
return (fexpr__57422.cljs$core$IFn$_invoke$arity$1 ? fexpr__57422.cljs$core$IFn$_invoke$arity$1(G__57423) : fexpr__57422.call(null,G__57423));
})();
var cr56506_place_20 = cljs.core.first;
var cr56506_place_21 = cr56506_place_19;
var cr56506_place_22 = (function (){var G__57425 = cr56506_place_21;
var fexpr__57424 = cr56506_place_20;
return (fexpr__57424.cljs$core$IFn$_invoke$arity$1 ? fexpr__57424.cljs$core$IFn$_invoke$arity$1(G__57425) : fexpr__57424.call(null,G__57425));
})();
var cr56506_place_23 = cljs.core.next;
var cr56506_place_24 = cr56506_place_19;
var cr56506_place_25 = (function (){var G__57427 = cr56506_place_24;
var fexpr__57426 = cr56506_place_23;
return (fexpr__57426.cljs$core$IFn$_invoke$arity$1 ? fexpr__57426.cljs$core$IFn$_invoke$arity$1(G__57427) : fexpr__57426.call(null,G__57427));
})();
var cr56506_place_26 = cr56506_place_22;
var cr56506_place_27 = cr56506_place_25;
var cr56506_place_28 = null;
var cr56506_place_29 = false;
(cr56506_state[(0)] = cr56506_block_2);

(cr56506_state[(2)] = cr56506_place_29);

(cr56506_state[(3)] = cr56506_place_26);

(cr56506_state[(4)] = cr56506_place_28);

(cr56506_state[(5)] = cr56506_place_27);

return cr56506_state;
}catch (e57421){var cr56506_exception = e57421;
(cr56506_state[(0)] = null);

(cr56506_state[(1)] = null);

throw cr56506_exception;
}});
var cr56506_block_27 = (function frontend$common$missionary$backoff_$_cr56506_block_27(cr56506_state){
try{var cr56506_place_119 = (cr56506_state[(2)]);
var cr56506_place_126 = cljs.core.first;
var cr56506_place_127 = cr56506_place_119;
var cr56506_place_128 = (function (){var G__57434 = cr56506_place_127;
var fexpr__57433 = cr56506_place_126;
return (fexpr__57433.cljs$core$IFn$_invoke$arity$1 ? fexpr__57433.cljs$core$IFn$_invoke$arity$1(G__57434) : fexpr__57433.call(null,G__57434));
})();
var cr56506_place_129 = cr56506_place_128;
var cr56506_place_130 = null;
if(cljs.core.truth_(cr56506_place_129)){
(cr56506_state[(0)] = cr56506_block_29);

(cr56506_state[(3)] = cr56506_place_130);

return cr56506_state;
} else {
(cr56506_state[(0)] = cr56506_block_28);

(cr56506_state[(5)] = cr56506_place_128);

(cr56506_state[(3)] = cr56506_place_130);

return cr56506_state;
}
}catch (e57429){var cr56506_exception = e57429;
(cr56506_state[(0)] = null);

(cr56506_state[(2)] = null);

(cr56506_state[(1)] = null);

(cr56506_state[(4)] = null);

throw cr56506_exception;
}});
var cr56506_block_32 = (function frontend$common$missionary$backoff_$_cr56506_block_32(cr56506_state){
try{var cr56506_place_119 = (cr56506_state[(2)]);
var cr56506_place_138 = cr56506_place_119;
(cr56506_state[(0)] = cr56506_block_34);

(cr56506_state[(2)] = null);

(cr56506_state[(1)] = cr56506_place_138);

return cr56506_state;
}catch (e57435){var cr56506_exception = e57435;
(cr56506_state[(0)] = null);

(cr56506_state[(2)] = null);

(cr56506_state[(1)] = null);

throw cr56506_exception;
}});
var cr56506_block_26 = (function frontend$common$missionary$backoff_$_cr56506_block_26(cr56506_state){
try{var cr56506_place_122 = (cr56506_state[(3)]);
var cr56506_place_125 = cr56506_place_122;
(cr56506_state[(0)] = cr56506_block_31);

(cr56506_state[(3)] = null);

(cr56506_state[(4)] = cr56506_place_125);

return cr56506_state;
}catch (e57437){var cr56506_exception = e57437;
(cr56506_state[(0)] = null);

(cr56506_state[(2)] = null);

(cr56506_state[(1)] = null);

(cr56506_state[(3)] = null);

(cr56506_state[(4)] = null);

throw cr56506_exception;
}});
var cr56506_block_15 = (function frontend$common$missionary$backoff_$_cr56506_block_15(cr56506_state){
try{var cr56506_place_26 = (cr56506_state[(3)]);
var cr56506_place_59 = missionary.core.race;
var cr56506_place_60 = missionary.core.sleep;
var cr56506_place_61 = cr56506_place_26;
var cr56506_place_62 = new cljs.core.Keyword(null,"delay","delay",-574225219);
var cr56506_place_63 = (function (){var G__57447 = cr56506_place_61;
var G__57448 = cr56506_place_62;
var fexpr__57446 = cr56506_place_60;
return (fexpr__57446.cljs$core$IFn$_invoke$arity$2 ? fexpr__57446.cljs$core$IFn$_invoke$arity$2(G__57447,G__57448) : fexpr__57446.call(null,G__57447,G__57448));
})();
var cr56506_place_64 = missionary.core.reduce;
var cr56506_place_65 = (function (_,r){
if(cljs.core.truth_(r)){
return cljs.core.reduced(new cljs.core.Keyword(null,"reset","reset",-800929946));
} else {
return null;
}
});
var cr56506_place_66 = null;
var cr56506_place_67 = missionary.core.eduction;
var cr56506_place_68 = cljs.core.drop;
var cr56506_place_69 = (1);
var cr56506_place_70 = (function (){var G__57450 = cr56506_place_69;
var fexpr__57449 = cr56506_place_68;
return (fexpr__57449.cljs$core$IFn$_invoke$arity$1 ? fexpr__57449.cljs$core$IFn$_invoke$arity$1(G__57450) : fexpr__57449.call(null,G__57450));
})();
var cr56506_place_71 = cljs.core.take;
var cr56506_place_72 = (1);
var cr56506_place_73 = (function (){var G__57452 = cr56506_place_72;
var fexpr__57451 = cr56506_place_71;
return (fexpr__57451.cljs$core$IFn$_invoke$arity$1 ? fexpr__57451.cljs$core$IFn$_invoke$arity$1(G__57452) : fexpr__57451.call(null,G__57452));
})();
var cr56506_place_74 = frontend.common.missionary.continue_flow;
var cr56506_place_75 = reset_flow_STAR_;
var cr56506_place_76 = (function (){var G__57457 = cr56506_place_75;
var fexpr__57456 = cr56506_place_74;
return (fexpr__57456.cljs$core$IFn$_invoke$arity$1 ? fexpr__57456.cljs$core$IFn$_invoke$arity$1(G__57457) : fexpr__57456.call(null,G__57457));
})();
var cr56506_place_77 = (function (){var G__57463 = cr56506_place_70;
var G__57464 = cr56506_place_73;
var G__57465 = cr56506_place_76;
var fexpr__57462 = cr56506_place_67;
return (fexpr__57462.cljs$core$IFn$_invoke$arity$3 ? fexpr__57462.cljs$core$IFn$_invoke$arity$3(G__57463,G__57464,G__57465) : fexpr__57462.call(null,G__57463,G__57464,G__57465));
})();
var cr56506_place_78 = (function (){var G__57467 = cr56506_place_65;
var G__57468 = cr56506_place_66;
var G__57469 = cr56506_place_77;
var fexpr__57466 = cr56506_place_64;
return (fexpr__57466.cljs$core$IFn$_invoke$arity$3 ? fexpr__57466.cljs$core$IFn$_invoke$arity$3(G__57467,G__57468,G__57469) : fexpr__57466.call(null,G__57467,G__57468,G__57469));
})();
var cr56506_place_79 = (function (){var G__57471 = cr56506_place_63;
var G__57472 = cr56506_place_78;
var fexpr__57470 = cr56506_place_59;
return (fexpr__57470.cljs$core$IFn$_invoke$arity$2 ? fexpr__57470.cljs$core$IFn$_invoke$arity$2(G__57471,G__57472) : fexpr__57470.call(null,G__57471,G__57472));
})();
(cr56506_state[(0)] = cr56506_block_16);

return missionary.core.park(cr56506_place_79);
}catch (e57442){var cr56506_exception = e57442;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(7)] = null);

(cr56506_state[(6)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_28 = (function frontend$common$missionary$backoff_$_cr56506_block_28(cr56506_state){
try{var cr56506_place_128 = (cr56506_state[(5)]);
var cr56506_place_131 = cr56506_place_128;
(cr56506_state[(0)] = cr56506_block_30);

(cr56506_state[(5)] = null);

(cr56506_state[(3)] = cr56506_place_131);

return cr56506_state;
}catch (e57473){var cr56506_exception = e57473;
(cr56506_state[(0)] = null);

(cr56506_state[(2)] = null);

(cr56506_state[(3)] = null);

(cr56506_state[(1)] = null);

(cr56506_state[(4)] = null);

(cr56506_state[(5)] = null);

throw cr56506_exception;
}});
var cr56506_block_8 = (function frontend$common$missionary$backoff_$_cr56506_block_8(cr56506_state){
try{var cr56506_place_37 = (cr56506_state[(6)]);
var cr56506_place_46 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr56506_place_47 = cr56506_place_37;
var cr56506_place_48 = cr56506_place_46.cljs$core$IFn$_invoke$arity$1(cr56506_place_47);
(cr56506_state[(0)] = cr56506_block_10);

(cr56506_state[(6)] = null);

(cr56506_state[(8)] = cr56506_place_48);

return cr56506_state;
}catch (e57477){var cr56506_exception = e57477;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(6)] = null);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(7)] = null);

(cr56506_state[(8)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_22 = (function frontend$common$missionary$backoff_$_cr56506_block_22(cr56506_state){
try{var cr56506_place_85 = (cr56506_state[(8)]);
var cr56506_place_111 = "No matching clause: ";
var cr56506_place_112 = cr56506_place_85;
var cr56506_place_113 = [cr56506_place_111,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr56506_place_112)].join('');
var cr56506_place_114 = (new Error(cr56506_place_113));
var cr56506_place_115 = (function(){throw cr56506_place_114})();
(cr56506_state[(0)] = null);

(cr56506_state[(2)] = null);

(cr56506_state[(1)] = null);

(cr56506_state[(4)] = null);

(cr56506_state[(8)] = null);

return null;
}catch (e57478){var cr56506_exception = e57478;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(8)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_9 = (function frontend$common$missionary$backoff_$_cr56506_block_9(cr56506_state){
try{var cr56506_place_49 = null;
(cr56506_state[(0)] = cr56506_block_10);

(cr56506_state[(8)] = cr56506_place_49);

return cr56506_state;
}catch (e57484){var cr56506_exception = e57484;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(7)] = null);

(cr56506_state[(8)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_33 = (function frontend$common$missionary$backoff_$_cr56506_block_33(cr56506_state){
try{var cr56506_place_119 = (cr56506_state[(2)]);
var cr56506_place_139 = cljs.core.second;
var cr56506_place_140 = cr56506_place_119;
var cr56506_place_141 = (function (){var G__57487 = cr56506_place_140;
var fexpr__57486 = cr56506_place_139;
return (fexpr__57486.cljs$core$IFn$_invoke$arity$1 ? fexpr__57486.cljs$core$IFn$_invoke$arity$1(G__57487) : fexpr__57486.call(null,G__57487));
})();
(cr56506_state[(0)] = cr56506_block_1);

(cr56506_state[(2)] = null);

(cr56506_state[(1)] = cr56506_place_141);

return cr56506_state;
}catch (e57485){var cr56506_exception = e57485;
(cr56506_state[(0)] = null);

(cr56506_state[(2)] = null);

(cr56506_state[(1)] = null);

throw cr56506_exception;
}});
var cr56506_block_5 = (function frontend$common$missionary$backoff_$_cr56506_block_5(cr56506_state){
try{var cr56506_place_33 = (cr56506_state[(8)]);
var cr56506_place_38 = cljs.core.ex_data;
var cr56506_place_39 = cr56506_place_33;
var cr56506_place_40 = (function (){var G__57490 = cr56506_place_39;
var fexpr__57489 = cr56506_place_38;
return (fexpr__57489.cljs$core$IFn$_invoke$arity$1 ? fexpr__57489.cljs$core$IFn$_invoke$arity$1(G__57490) : fexpr__57489.call(null,G__57490));
})();
(cr56506_state[(0)] = cr56506_block_7);

(cr56506_state[(8)] = null);

(cr56506_state[(6)] = cr56506_place_40);

return cr56506_state;
}catch (e57488){var cr56506_exception = e57488;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(6)] = null);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(7)] = null);

(cr56506_state[(8)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_2 = (function frontend$common$missionary$backoff_$_cr56506_block_2(cr56506_state){
try{var cr56506_place_30 = task;
(cr56506_state[(0)] = cr56506_block_3);

return missionary.core.park(cr56506_place_30);
}catch (e57491){var cr56506_exception = e57491;
(cr56506_state[(0)] = cr56506_block_4);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_29 = (function frontend$common$missionary$backoff_$_cr56506_block_29(cr56506_state){
try{var cr56506_place_119 = (cr56506_state[(2)]);
var cr56506_place_132 = frontend.common.missionary.retry_sentinel;
var cr56506_place_133 = cljs.core.first;
var cr56506_place_134 = cr56506_place_119;
var cr56506_place_135 = (function (){var G__57494 = cr56506_place_134;
var fexpr__57493 = cr56506_place_133;
return (fexpr__57493.cljs$core$IFn$_invoke$arity$1 ? fexpr__57493.cljs$core$IFn$_invoke$arity$1(G__57494) : fexpr__57493.call(null,G__57494));
})();
var cr56506_place_136 = (cr56506_place_132 === cr56506_place_135);
(cr56506_state[(0)] = cr56506_block_30);

(cr56506_state[(3)] = cr56506_place_136);

return cr56506_state;
}catch (e57492){var cr56506_exception = e57492;
(cr56506_state[(0)] = null);

(cr56506_state[(2)] = null);

(cr56506_state[(3)] = null);

(cr56506_state[(1)] = null);

(cr56506_state[(4)] = null);

throw cr56506_exception;
}});
var cr56506_block_12 = (function frontend$common$missionary$backoff_$_cr56506_block_12(cr56506_state){
try{var cr56506_place_26 = (cr56506_state[(3)]);
var cr56506_place_53 = cljs.core.pos_int_QMARK_;
var cr56506_place_54 = cr56506_place_26;
var cr56506_place_55 = (function (){var G__57497 = cr56506_place_54;
var fexpr__57496 = cr56506_place_53;
return (fexpr__57496.cljs$core$IFn$_invoke$arity$1 ? fexpr__57496.cljs$core$IFn$_invoke$arity$1(G__57497) : fexpr__57496.call(null,G__57497));
})();
(cr56506_state[(0)] = cr56506_block_13);

(cr56506_state[(6)] = cr56506_place_55);

return cr56506_state;
}catch (e57495){var cr56506_exception = e57495;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(7)] = null);

(cr56506_state[(6)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_4 = (function frontend$common$missionary$backoff_$_cr56506_block_4(cr56506_state){
try{var cr56506_place_28 = (cr56506_state[(4)]);
var cr56506_place_32 = cr56506_place_28;
var cr56506_place_33 = cr56506_place_32;
var cr56506_place_34 = cr56506_place_33;
var cr56506_place_35 = null;
var cr56506_place_36 = (cr56506_place_34 == cr56506_place_35);
var cr56506_place_37 = null;
if(cr56506_place_36){
(cr56506_state[(0)] = cr56506_block_6);

(cr56506_state[(7)] = cr56506_place_32);

(cr56506_state[(6)] = cr56506_place_37);

return cr56506_state;
} else {
(cr56506_state[(0)] = cr56506_block_5);

(cr56506_state[(7)] = cr56506_place_32);

(cr56506_state[(8)] = cr56506_place_33);

(cr56506_state[(6)] = cr56506_place_37);

return cr56506_state;
}
}catch (e57498){var cr56506_exception = e57498;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_14 = (function frontend$common$missionary$backoff_$_cr56506_block_14(cr56506_state){
try{var cr56506_place_32 = (cr56506_state[(7)]);
var cr56506_place_57 = cr56506_place_32;
var cr56506_place_58 = (function(){throw cr56506_place_57})();
(cr56506_state[(0)] = null);

(cr56506_state[(2)] = null);

(cr56506_state[(1)] = null);

(cr56506_state[(4)] = null);

(cr56506_state[(7)] = null);

return null;
}catch (e57499){var cr56506_exception = e57499;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(7)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_16 = (function frontend$common$missionary$backoff_$_cr56506_block_16(cr56506_state){
try{var cr56506_place_80 = missionary.core.unpark();
var cr56506_place_81 = cr56506_place_80;
var cr56506_place_82 = cr56506_place_81;
var cr56506_place_83 = cljs.core.Keyword;
var cr56506_place_84 = (cr56506_place_82 instanceof cr56506_place_83);
var cr56506_place_85 = null;
if(cr56506_place_84){
(cr56506_state[(0)] = cr56506_block_18);

(cr56506_state[(9)] = cr56506_place_81);

(cr56506_state[(8)] = cr56506_place_85);

return cr56506_state;
} else {
(cr56506_state[(0)] = cr56506_block_17);

(cr56506_state[(8)] = cr56506_place_85);

return cr56506_state;
}
}catch (e57507){var cr56506_exception = e57507;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(7)] = null);

(cr56506_state[(6)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_30 = (function frontend$common$missionary$backoff_$_cr56506_block_30(cr56506_state){
try{var cr56506_place_130 = (cr56506_state[(3)]);
(cr56506_state[(0)] = cr56506_block_31);

(cr56506_state[(3)] = null);

(cr56506_state[(4)] = cr56506_place_130);

return cr56506_state;
}catch (e57509){var cr56506_exception = e57509;
(cr56506_state[(0)] = null);

(cr56506_state[(2)] = null);

(cr56506_state[(3)] = null);

(cr56506_state[(1)] = null);

(cr56506_state[(4)] = null);

throw cr56506_exception;
}});
var cr56506_block_23 = (function frontend$common$missionary$backoff_$_cr56506_block_23(cr56506_state){
try{var cr56506_place_90 = (cr56506_state[(8)]);
var cr56506_place_116 = frontend.common.missionary.retry_sentinel;
var cr56506_place_117 = cr56506_place_90;
var cr56506_place_118 = cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cr56506_place_116,cr56506_place_117], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IVector], null));
(cr56506_state[(0)] = cr56506_block_24);

(cr56506_state[(8)] = null);

(cr56506_state[(6)] = cr56506_place_118);

return cr56506_state;
}catch (e57510){var cr56506_exception = e57510;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(8)] = null);

(cr56506_state[(6)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_21 = (function frontend$common$missionary$backoff_$_cr56506_block_21(cr56506_state){
try{var cr56506_place_32 = (cr56506_state[(7)]);
var cr56506_place_102 = cljs.core.println;
var cr56506_place_103 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr56506_place_104 = "retry now (";
var cr56506_place_105 = cljs.core.ex_message;
var cr56506_place_106 = cr56506_place_32;
var cr56506_place_107 = (function (){var G__57518 = cr56506_place_106;
var fexpr__57517 = cr56506_place_105;
return (fexpr__57517.cljs$core$IFn$_invoke$arity$1 ? fexpr__57517.cljs$core$IFn$_invoke$arity$1(G__57518) : fexpr__57517.call(null,G__57518));
})();
var cr56506_place_108 = ")";
var cr56506_place_109 = (function (){var G__57520 = cr56506_place_103;
var G__57521 = cr56506_place_104;
var G__57522 = cr56506_place_107;
var G__57523 = cr56506_place_108;
var fexpr__57519 = cr56506_place_102;
return (fexpr__57519.cljs$core$IFn$_invoke$arity$4 ? fexpr__57519.cljs$core$IFn$_invoke$arity$4(G__57520,G__57521,G__57522,G__57523) : fexpr__57519.call(null,G__57520,G__57521,G__57522,G__57523));
})();
var cr56506_place_110 = delay_seq;
(cr56506_state[(0)] = cr56506_block_23);

(cr56506_state[(7)] = null);

(cr56506_state[(8)] = cr56506_place_110);

return cr56506_state;
}catch (e57512){var cr56506_exception = e57512;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(8)] = null);

(cr56506_state[(7)] = null);

(cr56506_state[(6)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_20 = (function frontend$common$missionary$backoff_$_cr56506_block_20(cr56506_state){
try{var cr56506_place_26 = (cr56506_state[(3)]);
var cr56506_place_27 = (cr56506_state[(5)]);
var cr56506_place_32 = (cr56506_state[(7)]);
var cr56506_place_91 = cljs.core.println;
var cr56506_place_92 = new cljs.core.Keyword("missionary","retry","missionary/retry",-638721348);
var cr56506_place_93 = "after";
var cr56506_place_94 = cr56506_place_26;
var cr56506_place_95 = "ms (";
var cr56506_place_96 = cljs.core.ex_message;
var cr56506_place_97 = cr56506_place_32;
var cr56506_place_98 = (function (){var G__57526 = cr56506_place_97;
var fexpr__57525 = cr56506_place_96;
return (fexpr__57525.cljs$core$IFn$_invoke$arity$1 ? fexpr__57525.cljs$core$IFn$_invoke$arity$1(G__57526) : fexpr__57525.call(null,G__57526));
})();
var cr56506_place_99 = ")";
var cr56506_place_100 = (function (){var G__57528 = cr56506_place_92;
var G__57529 = cr56506_place_93;
var G__57530 = cr56506_place_94;
var G__57531 = cr56506_place_95;
var G__57532 = cr56506_place_98;
var G__57533 = cr56506_place_99;
var fexpr__57527 = cr56506_place_91;
return (fexpr__57527.cljs$core$IFn$_invoke$arity$6 ? fexpr__57527.cljs$core$IFn$_invoke$arity$6(G__57528,G__57529,G__57530,G__57531,G__57532,G__57533) : fexpr__57527.call(null,G__57528,G__57529,G__57530,G__57531,G__57532,G__57533));
})();
var cr56506_place_101 = cr56506_place_27;
(cr56506_state[(0)] = cr56506_block_23);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(7)] = null);

(cr56506_state[(8)] = cr56506_place_101);

return cr56506_state;
}catch (e57524){var cr56506_exception = e57524;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(8)] = null);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(7)] = null);

(cr56506_state[(6)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
var cr56506_block_6 = (function frontend$common$missionary$backoff_$_cr56506_block_6(cr56506_state){
try{var cr56506_place_41 = null;
(cr56506_state[(0)] = cr56506_block_7);

(cr56506_state[(6)] = cr56506_place_41);

return cr56506_state;
}catch (e57534){var cr56506_exception = e57534;
(cr56506_state[(0)] = cr56506_block_25);

(cr56506_state[(6)] = null);

(cr56506_state[(3)] = null);

(cr56506_state[(5)] = null);

(cr56506_state[(7)] = null);

(cr56506_state[(2)] = true);

(cr56506_state[(4)] = cr56506_exception);

return cr56506_state;
}});
return cloroutine.impl.coroutine((function (){var G__57535 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((10));
(G__57535[(0)] = cr56506_block_0);

return G__57535;
})());
})(),missionary.core.sp_run);
});
/**
 * Return a flow that emits `value` every `interval-ms`.
 */
frontend.common.missionary.clock = (function frontend$common$missionary$clock(var_args){
var G__57537 = arguments.length;
switch (G__57537) {
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
return frontend.common.missionary.continue_flow.cljs$core$IFn$_invoke$arity$2(value,cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr57543_block_0 = (function frontend$common$missionary$cr57543_block_0(cr57543_state){
try{(cr57543_state[(0)] = cr57543_block_1);

return cr57543_state;
}catch (e57596){var cr57543_exception = e57596;
(cr57543_state[(0)] = null);

throw cr57543_exception;
}});
var cr57543_block_1 = (function frontend$common$missionary$cr57543_block_1(cr57543_state){
try{var cr57543_place_0 = (1);
var cr57543_place_1 = missionary.core.seed;
var cr57543_place_2 = cljs.core.range;
var cr57543_place_3 = (2);
var cr57543_place_4 = (function (){var G__57607 = cr57543_place_3;
var fexpr__57606 = cr57543_place_2;
return (fexpr__57606.cljs$core$IFn$_invoke$arity$1 ? fexpr__57606.cljs$core$IFn$_invoke$arity$1(G__57607) : fexpr__57606.call(null,G__57607));
})();
var cr57543_place_5 = (function (){var G__57610 = cr57543_place_4;
var fexpr__57609 = cr57543_place_1;
return (fexpr__57609.cljs$core$IFn$_invoke$arity$1 ? fexpr__57609.cljs$core$IFn$_invoke$arity$1(G__57610) : fexpr__57609.call(null,G__57610));
})();
(cr57543_state[(0)] = cr57543_block_2);

return missionary.core.fork(cr57543_place_0,cr57543_place_5);
}catch (e57601){var cr57543_exception = e57601;
(cr57543_state[(0)] = null);

throw cr57543_exception;
}});
var cr57543_block_2 = (function frontend$common$missionary$cr57543_block_2(cr57543_state){
try{var cr57543_place_6 = missionary.core.unpark();
var cr57543_place_7 = cr57543_place_6;
var cr57543_place_8 = null;
var G__57614 = cr57543_place_7;
switch (G__57614) {
case (0):
(cr57543_state[(0)] = cr57543_block_3);

(cr57543_state[(1)] = cr57543_place_8);

return cr57543_state;

break;
case (1):
(cr57543_state[(0)] = cr57543_block_5);

return cr57543_state;

break;
default:
(cr57543_state[(0)] = cr57543_block_6);

(cr57543_state[(1)] = cr57543_place_6);

return cr57543_state;

}
}catch (e57611){var cr57543_exception = e57611;
(cr57543_state[(0)] = null);

throw cr57543_exception;
}});
var cr57543_block_3 = (function frontend$common$missionary$cr57543_block_3(cr57543_state){
try{var cr57543_place_9 = missionary.core.sleep;
var cr57543_place_10 = interval_ms;
var cr57543_place_11 = value;
var cr57543_place_12 = (function (){var G__57620 = cr57543_place_10;
var G__57621 = cr57543_place_11;
var fexpr__57619 = cr57543_place_9;
return (fexpr__57619.cljs$core$IFn$_invoke$arity$2 ? fexpr__57619.cljs$core$IFn$_invoke$arity$2(G__57620,G__57621) : fexpr__57619.call(null,G__57620,G__57621));
})();
(cr57543_state[(0)] = cr57543_block_4);

return missionary.core.park(cr57543_place_12);
}catch (e57618){var cr57543_exception = e57618;
(cr57543_state[(0)] = null);

(cr57543_state[(1)] = null);

throw cr57543_exception;
}});
var cr57543_block_4 = (function frontend$common$missionary$cr57543_block_4(cr57543_state){
try{var cr57543_place_13 = missionary.core.unpark();
(cr57543_state[(0)] = cr57543_block_7);

(cr57543_state[(1)] = cr57543_place_13);

return cr57543_state;
}catch (e57626){var cr57543_exception = e57626;
(cr57543_state[(0)] = null);

(cr57543_state[(1)] = null);

throw cr57543_exception;
}});
var cr57543_block_5 = (function frontend$common$missionary$cr57543_block_5(cr57543_state){
try{(cr57543_state[(0)] = cr57543_block_1);

return cr57543_state;
}catch (e57627){var cr57543_exception = e57627;
(cr57543_state[(0)] = null);

throw cr57543_exception;
}});
var cr57543_block_6 = (function frontend$common$missionary$cr57543_block_6(cr57543_state){
try{var cr57543_place_6 = (cr57543_state[(1)]);
var cr57543_place_14 = "No matching clause: ";
var cr57543_place_15 = cr57543_place_6;
var cr57543_place_16 = [cr57543_place_14,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr57543_place_15)].join('');
var cr57543_place_17 = (new Error(cr57543_place_16));
var cr57543_place_18 = (function(){throw cr57543_place_17})();
(cr57543_state[(0)] = null);

(cr57543_state[(1)] = null);

return null;
}catch (e57629){var cr57543_exception = e57629;
(cr57543_state[(0)] = null);

(cr57543_state[(1)] = null);

throw cr57543_exception;
}});
var cr57543_block_7 = (function frontend$common$missionary$cr57543_block_7(cr57543_state){
try{var cr57543_place_8 = (cr57543_state[(1)]);
(cr57543_state[(0)] = null);

(cr57543_state[(1)] = null);

return cr57543_place_8;
}catch (e57633){var cr57543_exception = e57633;
(cr57543_state[(0)] = null);

(cr57543_state[(1)] = null);

throw cr57543_exception;
}});
return cloroutine.impl.coroutine((function (){var G__57634 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((2));
(G__57634[(0)] = cr57543_block_0);

return G__57634;
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

return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr57642_block_0 = (function frontend$common$missionary$concurrent_exec_flow_$_cr57642_block_0(cr57642_state){
try{var cr57642_place_0 = par;
var cr57642_place_1 = flow;
(cr57642_state[(0)] = cr57642_block_1);

return missionary.core.fork(cr57642_place_0,cr57642_place_1);
}catch (e57657){var cr57642_exception = e57657;
(cr57642_state[(0)] = null);

throw cr57642_exception;
}});
var cr57642_block_1 = (function frontend$common$missionary$concurrent_exec_flow_$_cr57642_block_1(cr57642_state){
try{var cr57642_place_2 = missionary.core.unpark();
var cr57642_place_3 = f;
var cr57642_place_4 = cr57642_place_2;
var cr57642_place_5 = (function (){var G__57667 = cr57642_place_4;
var fexpr__57666 = cr57642_place_3;
return (fexpr__57666.cljs$core$IFn$_invoke$arity$1 ? fexpr__57666.cljs$core$IFn$_invoke$arity$1(G__57667) : fexpr__57666.call(null,G__57667));
})();
(cr57642_state[(0)] = cr57642_block_2);

return missionary.core.park(cr57642_place_5);
}catch (e57661){var cr57642_exception = e57661;
(cr57642_state[(0)] = null);

throw cr57642_exception;
}});
var cr57642_block_2 = (function frontend$common$missionary$concurrent_exec_flow_$_cr57642_block_2(cr57642_state){
try{var cr57642_place_6 = missionary.core.unpark();
(cr57642_state[(0)] = null);

return cr57642_place_6;
}catch (e57668){var cr57642_exception = e57668;
(cr57642_state[(0)] = null);

throw cr57642_exception;
}});
return cloroutine.impl.coroutine((function (){var G__57669 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__57669[(0)] = cr57642_block_0);

return G__57669;
})());
})(),missionary.core.ap_run);
});
frontend.common.missionary.debounce = (function frontend$common$missionary$debounce(duration_ms,flow){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr57670_block_11 = (function frontend$common$missionary$debounce_$_cr57670_block_11(cr57670_state){
try{var cr57670_place_12 = (cr57670_state[(2)]);
(cr57670_state[(0)] = cr57670_block_12);

(cr57670_state[(2)] = null);

(cr57670_state[(3)] = cr57670_place_12);

return cr57670_state;
}catch (e57789){var cr57670_exception = e57789;
(cr57670_state[(0)] = cr57670_block_12);

(cr57670_state[(2)] = null);

(cr57670_state[(1)] = true);

(cr57670_state[(3)] = cr57670_exception);

return cr57670_state;
}});
var cr57670_block_2 = (function frontend$common$missionary$debounce_$_cr57670_block_2(cr57670_state){
try{var cr57670_place_1 = (cr57670_state[(2)]);
var cr57670_place_4 = missionary.core.sleep;
var cr57670_place_5 = duration_ms;
var cr57670_place_6 = cr57670_place_1;
var cr57670_place_7 = (function (){var G__57797 = cr57670_place_5;
var G__57798 = cr57670_place_6;
var fexpr__57796 = cr57670_place_4;
return (fexpr__57796.cljs$core$IFn$_invoke$arity$2 ? fexpr__57796.cljs$core$IFn$_invoke$arity$2(G__57797,G__57798) : fexpr__57796.call(null,G__57797,G__57798));
})();
(cr57670_state[(0)] = cr57670_block_3);

(cr57670_state[(2)] = null);

return missionary.core.park(cr57670_place_7);
}catch (e57793){var cr57670_exception = e57793;
(cr57670_state[(0)] = cr57670_block_4);

(cr57670_state[(2)] = null);

(cr57670_state[(3)] = cr57670_exception);

return cr57670_state;
}});
var cr57670_block_10 = (function frontend$common$missionary$debounce_$_cr57670_block_10(cr57670_state){
try{var cr57670_place_21 = missionary.core.unpark();
(cr57670_state[(0)] = cr57670_block_11);

(cr57670_state[(2)] = cr57670_place_21);

return cr57670_state;
}catch (e57803){var cr57670_exception = e57803;
(cr57670_state[(0)] = cr57670_block_12);

(cr57670_state[(2)] = null);

(cr57670_state[(1)] = true);

(cr57670_state[(3)] = cr57670_exception);

return cr57670_state;
}});
var cr57670_block_9 = (function frontend$common$missionary$debounce_$_cr57670_block_9(cr57670_state){
try{var cr57670_place_2 = (cr57670_state[(3)]);
var cr57670_place_18 = cr57670_place_2;
var cr57670_place_19 = (1);
var cr57670_place_20 = missionary.core.none;
(cr57670_state[(0)] = cr57670_block_10);

return missionary.core.fork(cr57670_place_19,cr57670_place_20);
}catch (e57811){var cr57670_exception = e57811;
(cr57670_state[(0)] = cr57670_block_12);

(cr57670_state[(2)] = null);

(cr57670_state[(1)] = true);

(cr57670_state[(3)] = cr57670_exception);

return cr57670_state;
}});
var cr57670_block_0 = (function frontend$common$missionary$debounce_$_cr57670_block_0(cr57670_state){
try{var cr57670_place_0 = flow;
(cr57670_state[(0)] = cr57670_block_1);

return missionary.core.switch$(cr57670_place_0);
}catch (e57818){var cr57670_exception = e57818;
(cr57670_state[(0)] = null);

throw cr57670_exception;
}});
var cr57670_block_4 = (function frontend$common$missionary$debounce_$_cr57670_block_4(cr57670_state){
try{var cr57670_place_2 = (cr57670_state[(3)]);
var cr57670_place_9 = cr57670_place_2;
var cr57670_place_10 = missionary.Cancelled;
var cr57670_place_11 = (cr57670_place_9 instanceof cr57670_place_10);
var cr57670_place_12 = null;
if(cr57670_place_11){
(cr57670_state[(0)] = cr57670_block_9);

(cr57670_state[(2)] = cr57670_place_12);

return cr57670_state;
} else {
(cr57670_state[(0)] = cr57670_block_5);

(cr57670_state[(2)] = cr57670_place_12);

return cr57670_state;
}
}catch (e57820){var cr57670_exception = e57820;
(cr57670_state[(0)] = cr57670_block_12);

(cr57670_state[(1)] = true);

(cr57670_state[(3)] = cr57670_exception);

return cr57670_state;
}});
var cr57670_block_6 = (function frontend$common$missionary$debounce_$_cr57670_block_6(cr57670_state){
try{var cr57670_place_15 = null;
(cr57670_state[(0)] = cr57670_block_8);

(cr57670_state[(4)] = cr57670_place_15);

return cr57670_state;
}catch (e57825){var cr57670_exception = e57825;
(cr57670_state[(0)] = cr57670_block_12);

(cr57670_state[(4)] = null);

(cr57670_state[(2)] = null);

(cr57670_state[(1)] = true);

(cr57670_state[(3)] = cr57670_exception);

return cr57670_state;
}});
var cr57670_block_12 = (function frontend$common$missionary$debounce_$_cr57670_block_12(cr57670_state){
try{var cr57670_place_3 = (cr57670_state[(1)]);
var cr57670_place_2 = (cr57670_state[(3)]);
var cr57670_place_22 = (cljs.core.truth_(cr57670_place_3)?(function(){throw cr57670_place_2})():cr57670_place_2);
(cr57670_state[(0)] = null);

(cr57670_state[(1)] = null);

(cr57670_state[(3)] = null);

return cr57670_place_22;
}catch (e57834){var cr57670_exception = e57834;
(cr57670_state[(0)] = null);

(cr57670_state[(1)] = null);

(cr57670_state[(3)] = null);

throw cr57670_exception;
}});
var cr57670_block_5 = (function frontend$common$missionary$debounce_$_cr57670_block_5(cr57670_state){
try{var cr57670_place_13 = new cljs.core.Keyword(null,"else","else",-1508377146);
var cr57670_place_14 = null;
if(cljs.core.truth_(cr57670_place_13)){
(cr57670_state[(0)] = cr57670_block_7);

(cr57670_state[(2)] = null);

return cr57670_state;
} else {
(cr57670_state[(0)] = cr57670_block_6);

(cr57670_state[(4)] = cr57670_place_14);

return cr57670_state;
}
}catch (e57836){var cr57670_exception = e57836;
(cr57670_state[(0)] = cr57670_block_12);

(cr57670_state[(2)] = null);

(cr57670_state[(1)] = true);

(cr57670_state[(3)] = cr57670_exception);

return cr57670_state;
}});
var cr57670_block_7 = (function frontend$common$missionary$debounce_$_cr57670_block_7(cr57670_state){
try{var cr57670_place_2 = (cr57670_state[(3)]);
var cr57670_place_16 = cr57670_place_2;
var cr57670_place_17 = (function(){throw cr57670_place_16})();
(cr57670_state[(0)] = null);

(cr57670_state[(1)] = null);

(cr57670_state[(3)] = null);

return null;
}catch (e57842){var cr57670_exception = e57842;
(cr57670_state[(0)] = cr57670_block_12);

(cr57670_state[(1)] = true);

(cr57670_state[(3)] = cr57670_exception);

return cr57670_state;
}});
var cr57670_block_1 = (function frontend$common$missionary$debounce_$_cr57670_block_1(cr57670_state){
try{var cr57670_place_1 = missionary.core.unpark();
var cr57670_place_2 = null;
var cr57670_place_3 = false;
(cr57670_state[(0)] = cr57670_block_2);

(cr57670_state[(2)] = cr57670_place_1);

(cr57670_state[(3)] = cr57670_place_2);

(cr57670_state[(1)] = cr57670_place_3);

return cr57670_state;
}catch (e57844){var cr57670_exception = e57844;
(cr57670_state[(0)] = null);

throw cr57670_exception;
}});
var cr57670_block_3 = (function frontend$common$missionary$debounce_$_cr57670_block_3(cr57670_state){
try{var cr57670_place_8 = missionary.core.unpark();
(cr57670_state[(0)] = cr57670_block_12);

(cr57670_state[(3)] = cr57670_place_8);

return cr57670_state;
}catch (e57846){var cr57670_exception = e57846;
(cr57670_state[(0)] = cr57670_block_4);

(cr57670_state[(3)] = cr57670_exception);

return cr57670_state;
}});
var cr57670_block_8 = (function frontend$common$missionary$debounce_$_cr57670_block_8(cr57670_state){
try{var cr57670_place_14 = (cr57670_state[(4)]);
(cr57670_state[(0)] = cr57670_block_11);

(cr57670_state[(4)] = null);

(cr57670_state[(2)] = cr57670_place_14);

return cr57670_state;
}catch (e57847){var cr57670_exception = e57847;
(cr57670_state[(0)] = cr57670_block_12);

(cr57670_state[(4)] = null);

(cr57670_state[(2)] = null);

(cr57670_state[(1)] = true);

(cr57670_state[(3)] = cr57670_exception);

return cr57670_state;
}});
return cloroutine.impl.coroutine((function (){var G__57849 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__57849[(0)] = cr57670_block_0);

return G__57849;
})());
})(),missionary.core.ap_run);
});
frontend.common.missionary.throttle = (function frontend$common$missionary$throttle(dur_ms,_GT_in){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr57854_block_2 = (function frontend$common$missionary$throttle_$_cr57854_block_2(cr57854_state){
try{var cr57854_place_12 = missionary.core.unpark();
var cr57854_place_13 = cr57854_place_12;
var cr57854_place_14 = null;
var G__57932 = cr57854_place_13;
switch (G__57932) {
case (0):
(cr57854_state[(0)] = cr57854_block_3);

(cr57854_state[(2)] = cr57854_place_14);

return cr57854_state;

break;
case (1):
(cr57854_state[(0)] = cr57854_block_4);

(cr57854_state[(1)] = null);

(cr57854_state[(2)] = cr57854_place_14);

return cr57854_state;

break;
default:
(cr57854_state[(0)] = cr57854_block_7);

(cr57854_state[(1)] = null);

(cr57854_state[(1)] = cr57854_place_12);

return cr57854_state;

}
}catch (e57931){var cr57854_exception = e57931;
(cr57854_state[(0)] = null);

(cr57854_state[(1)] = null);

throw cr57854_exception;
}});
var cr57854_block_6 = (function frontend$common$missionary$throttle_$_cr57854_block_6(cr57854_state){
try{var cr57854_place_22 = missionary.core.unpark();
(cr57854_state[(0)] = cr57854_block_8);

(cr57854_state[(2)] = cr57854_place_22);

return cr57854_state;
}catch (e57936){var cr57854_exception = e57936;
(cr57854_state[(0)] = null);

(cr57854_state[(2)] = null);

throw cr57854_exception;
}});
var cr57854_block_8 = (function frontend$common$missionary$throttle_$_cr57854_block_8(cr57854_state){
try{var cr57854_place_14 = (cr57854_state[(2)]);
(cr57854_state[(0)] = null);

(cr57854_state[(2)] = null);

return cr57854_place_14;
}catch (e57940){var cr57854_exception = e57940;
(cr57854_state[(0)] = null);

(cr57854_state[(2)] = null);

throw cr57854_exception;
}});
var cr57854_block_0 = (function frontend$common$missionary$throttle_$_cr57854_block_0(cr57854_state){
try{var cr57854_place_0 = (1);
var cr57854_place_1 = missionary.core.relieve;
var cr57854_place_2 = cljs.core.with_meta(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr57854_place_3 = _GT_in;
var cr57854_place_4 = (function (){var G__57948 = cr57854_place_2;
var G__57949 = cr57854_place_3;
var fexpr__57947 = cr57854_place_1;
return (fexpr__57947.cljs$core$IFn$_invoke$arity$2 ? fexpr__57947.cljs$core$IFn$_invoke$arity$2(G__57948,G__57949) : fexpr__57947.call(null,G__57948,G__57949));
})();
(cr57854_state[(0)] = cr57854_block_1);

return missionary.core.fork(cr57854_place_0,cr57854_place_4);
}catch (e57944){var cr57854_exception = e57944;
(cr57854_state[(0)] = null);

throw cr57854_exception;
}});
var cr57854_block_4 = (function frontend$common$missionary$throttle_$_cr57854_block_4(cr57854_state){
try{var cr57854_place_16 = missionary.core.sleep;
var cr57854_place_17 = dur_ms;
var cr57854_place_18 = (function (){var G__57958 = cr57854_place_17;
var fexpr__57957 = cr57854_place_16;
return (fexpr__57957.cljs$core$IFn$_invoke$arity$1 ? fexpr__57957.cljs$core$IFn$_invoke$arity$1(G__57958) : fexpr__57957.call(null,G__57958));
})();
(cr57854_state[(0)] = cr57854_block_5);

return missionary.core.park(cr57854_place_18);
}catch (e57955){var cr57854_exception = e57955;
(cr57854_state[(0)] = null);

(cr57854_state[(2)] = null);

throw cr57854_exception;
}});
var cr57854_block_3 = (function frontend$common$missionary$throttle_$_cr57854_block_3(cr57854_state){
try{var cr57854_place_5 = (cr57854_state[(1)]);
var cr57854_place_15 = cr57854_place_5;
(cr57854_state[(0)] = cr57854_block_8);

(cr57854_state[(1)] = null);

(cr57854_state[(2)] = cr57854_place_15);

return cr57854_state;
}catch (e57959){var cr57854_exception = e57959;
(cr57854_state[(0)] = null);

(cr57854_state[(2)] = null);

(cr57854_state[(1)] = null);

throw cr57854_exception;
}});
var cr57854_block_7 = (function frontend$common$missionary$throttle_$_cr57854_block_7(cr57854_state){
try{var cr57854_place_12 = (cr57854_state[(1)]);
var cr57854_place_23 = "No matching clause: ";
var cr57854_place_24 = cr57854_place_12;
var cr57854_place_25 = [cr57854_place_23,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr57854_place_24)].join('');
var cr57854_place_26 = (new Error(cr57854_place_25));
var cr57854_place_27 = (function(){throw cr57854_place_26})();
(cr57854_state[(0)] = null);

(cr57854_state[(1)] = null);

return null;
}catch (e57961){var cr57854_exception = e57961;
(cr57854_state[(0)] = null);

(cr57854_state[(1)] = null);

throw cr57854_exception;
}});
var cr57854_block_1 = (function frontend$common$missionary$throttle_$_cr57854_block_1(cr57854_state){
try{var cr57854_place_5 = missionary.core.unpark();
var cr57854_place_6 = (1);
var cr57854_place_7 = missionary.core.seed;
var cr57854_place_8 = cljs.core.range;
var cr57854_place_9 = (2);
var cr57854_place_10 = (function (){var G__57970 = cr57854_place_9;
var fexpr__57969 = cr57854_place_8;
return (fexpr__57969.cljs$core$IFn$_invoke$arity$1 ? fexpr__57969.cljs$core$IFn$_invoke$arity$1(G__57970) : fexpr__57969.call(null,G__57970));
})();
var cr57854_place_11 = (function (){var G__57973 = cr57854_place_10;
var fexpr__57972 = cr57854_place_7;
return (fexpr__57972.cljs$core$IFn$_invoke$arity$1 ? fexpr__57972.cljs$core$IFn$_invoke$arity$1(G__57973) : fexpr__57972.call(null,G__57973));
})();
(cr57854_state[(0)] = cr57854_block_2);

(cr57854_state[(1)] = cr57854_place_5);

return missionary.core.fork(cr57854_place_6,cr57854_place_11);
}catch (e57964){var cr57854_exception = e57964;
(cr57854_state[(0)] = null);

throw cr57854_exception;
}});
var cr57854_block_5 = (function frontend$common$missionary$throttle_$_cr57854_block_5(cr57854_state){
try{var cr57854_place_19 = missionary.core.unpark();
var cr57854_place_20 = (1);
var cr57854_place_21 = missionary.core.none;
(cr57854_state[(0)] = cr57854_block_6);

return missionary.core.fork(cr57854_place_20,cr57854_place_21);
}catch (e57974){var cr57854_exception = e57974;
(cr57854_state[(0)] = null);

(cr57854_state[(2)] = null);

throw cr57854_exception;
}});
return cloroutine.impl.coroutine((function (){var G__57975 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((3));
(G__57975[(0)] = cr57854_block_0);

return G__57975;
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
var len__5726__auto___58396 = arguments.length;
var i__5727__auto___58397 = (0);
while(true){
if((i__5727__auto___58397 < len__5726__auto___58396)){
args__5732__auto__.push((arguments[i__5727__auto___58397]));

var G__58398 = (i__5727__auto___58397 + (1));
i__5727__auto___58397 = G__58398;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.common.missionary.run_task.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.common.missionary.run_task.cljs$core$IFn$_invoke$arity$variadic = (function (key_SINGLEQUOTE_,task,p__57995){
var map__57998 = p__57995;
var map__57998__$1 = cljs.core.__destructure_map(map__57998);
var succ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__57998__$1,new cljs.core.Keyword(null,"succ","succ",1386276271));
var fail = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__57998__$1,new cljs.core.Keyword(null,"fail","fail",1706214930));
var cancel = (function (){var G__58000 = (function (){var or__5002__auto__ = succ;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (function (p1__57978_SHARP_){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.common.missionary",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),key_SINGLEQUOTE_,new cljs.core.Keyword(null,"succ","succ",1386276271),p1__57978_SHARP_,new cljs.core.Keyword(null,"line","line",212345235),125], null)),null);
});
}
})();
var G__58001 = (function (){var or__5002__auto__ = fail;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.common.missionary.fail_case_default_handler;
}
})();
return (task.cljs$core$IFn$_invoke$arity$2 ? task.cljs$core$IFn$_invoke$arity$2(G__58000,G__58001) : task.call(null,G__58000,G__58001));
})();
return (function (){
return (cancel.cljs$core$IFn$_invoke$arity$0 ? cancel.cljs$core$IFn$_invoke$arity$0() : cancel.call(null));
});
}));

(frontend.common.missionary.run_task.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.common.missionary.run_task.cljs$lang$applyTo = (function (seq57980){
var G__57981 = cljs.core.first(seq57980);
var seq57980__$1 = cljs.core.next(seq57980);
var G__57983 = cljs.core.first(seq57980__$1);
var seq57980__$2 = cljs.core.next(seq57980__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__57981,G__57983,seq57980__$2);
}));

/**
 * Return the canceler
 */
frontend.common.missionary.run_task_STAR_ = (function frontend$common$missionary$run_task_STAR_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___58408 = arguments.length;
var i__5727__auto___58409 = (0);
while(true){
if((i__5727__auto___58409 < len__5726__auto___58408)){
args__5732__auto__.push((arguments[i__5727__auto___58409]));

var G__58410 = (i__5727__auto___58409 + (1));
i__5727__auto___58409 = G__58410;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return frontend.common.missionary.run_task_STAR_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(frontend.common.missionary.run_task_STAR_.cljs$core$IFn$_invoke$arity$variadic = (function (task,p__58015){
var map__58019 = p__58015;
var map__58019__$1 = cljs.core.__destructure_map(map__58019);
var succ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58019__$1,new cljs.core.Keyword(null,"succ","succ",1386276271));
var fail = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58019__$1,new cljs.core.Keyword(null,"fail","fail",1706214930));
var cancel = (function (){var G__58020 = (function (){var or__5002__auto__ = succ;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.constantly(null);
}
})();
var G__58021 = (function (){var or__5002__auto__ = fail;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.common.missionary.fail_case_default_handler;
}
})();
return (task.cljs$core$IFn$_invoke$arity$2 ? task.cljs$core$IFn$_invoke$arity$2(G__58020,G__58021) : task.call(null,G__58020,G__58021));
})();
return (function (){
return (cancel.cljs$core$IFn$_invoke$arity$0 ? cancel.cljs$core$IFn$_invoke$arity$0() : cancel.call(null));
});
}));

(frontend.common.missionary.run_task_STAR_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(frontend.common.missionary.run_task_STAR_.cljs$lang$applyTo = (function (seq58008){
var G__58010 = cljs.core.first(seq58008);
var seq58008__$1 = cljs.core.next(seq58008);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__58010,seq58008__$1);
}));

/**
 * Return the canceler
 */
frontend.common.missionary.run_task_throw = (function frontend$common$missionary$run_task_throw(var_args){
var args__5732__auto__ = [];
var len__5726__auto___58411 = arguments.length;
var i__5727__auto___58412 = (0);
while(true){
if((i__5727__auto___58412 < len__5726__auto___58411)){
args__5732__auto__.push((arguments[i__5727__auto___58412]));

var G__58413 = (i__5727__auto___58412 + (1));
i__5727__auto___58412 = G__58413;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.common.missionary.run_task_throw.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.common.missionary.run_task_throw.cljs$core$IFn$_invoke$arity$variadic = (function (key_SINGLEQUOTE_,task,p__58040){
var map__58041 = p__58040;
var map__58041__$1 = cljs.core.__destructure_map(map__58041);
var succ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__58041__$1,new cljs.core.Keyword(null,"succ","succ",1386276271));
var cancel = (function (){var G__58043 = (function (){var or__5002__auto__ = succ;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (function (p1__58031_SHARP_){
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.common.missionary",new cljs.core.Keyword(null,"info","info",-317069002),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),key_SINGLEQUOTE_,new cljs.core.Keyword(null,"succ","succ",1386276271),p1__58031_SHARP_,new cljs.core.Keyword(null,"line","line",212345235),137], null)),null);
});
}
})();
var G__58044 = (function (p1__58032_SHARP_){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("task stopped",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),key_SINGLEQUOTE_,new cljs.core.Keyword(null,"e","e",1381269198),p1__58032_SHARP_], null));
});
return (task.cljs$core$IFn$_invoke$arity$2 ? task.cljs$core$IFn$_invoke$arity$2(G__58043,G__58044) : task.call(null,G__58043,G__58044));
})();
return (function (){
return (cancel.cljs$core$IFn$_invoke$arity$0 ? cancel.cljs$core$IFn$_invoke$arity$0() : cancel.call(null));
});
}));

(frontend.common.missionary.run_task_throw.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.common.missionary.run_task_throw.cljs$lang$applyTo = (function (seq58033){
var G__58034 = cljs.core.first(seq58033);
var seq58033__$1 = cljs.core.next(seq58033);
var G__58035 = cljs.core.first(seq58033__$1);
var seq58033__$2 = cljs.core.next(seq58033__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__58034,G__58035,seq58033__$2);
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
var temp__5804__auto___58414 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.common.missionary._STAR_background_task_cancelers),key_SINGLEQUOTE_);
if(cljs.core.truth_(temp__5804__auto___58414)){
var canceler_58415 = temp__5804__auto___58414;
(canceler_58415.cljs$core$IFn$_invoke$arity$0 ? canceler_58415.cljs$core$IFn$_invoke$arity$0() : canceler_58415.call(null));

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
var G__58064 = missionary.core.dfv();
cljs.core.async.take_BANG_.cljs$core$IFn$_invoke$arity$2(chan_or_promise_or_task,G__58064);

return G__58064;
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
chan_or_promise_or_task.then((function (p1__58060_SHARP_){
var G__58074 = (function (){
return p1__58060_SHARP_;
});
return (v.cljs$core$IFn$_invoke$arity$1 ? v.cljs$core$IFn$_invoke$arity$1(G__58074) : v.call(null,G__58074));
}),(function (p1__58061_SHARP_){
var G__58076 = (function (){
throw p1__58061_SHARP_;
});
return (v.cljs$core$IFn$_invoke$arity$1 ? v.cljs$core$IFn$_invoke$arity$1(G__58076) : v.call(null,G__58076));
}));

return missionary.core.absolve(v);
} else {
if(cljs.core.fn_QMARK_(chan_or_promise_or_task)){
return chan_or_promise_or_task;
} else {
if((chan_or_promise_or_task == null)){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr58079_block_0 = (function frontend$common$missionary$_LT__BANG__$_cr58079_block_0(cr58079_state){
try{var cr58079_place_0 = null;
(cr58079_state[(0)] = null);

return cr58079_place_0;
}catch (e58082){var cr58079_exception = e58082;
(cr58079_state[(0)] = null);

throw cr58079_exception;
}});
return cloroutine.impl.coroutine((function (){var G__58087 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((1));
(G__58087[(0)] = cr58079_block_0);

return G__58087;
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
