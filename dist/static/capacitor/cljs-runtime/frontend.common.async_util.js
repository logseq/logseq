goog.provide('frontend.common.async_util');
frontend.common.async_util.throw_err = (function frontend$common$async_util$throw_err(v){
if((v instanceof cljs.core.ExceptionInfo)){
throw v;
} else {
return v;
}
});
/**
 * Converts a Core.async channel to a Promise
 */
frontend.common.async_util.c__GT_p = (function frontend$common$async_util$c__GT_p(chan){
var d = promesa.core.deferred();
if(cljs.core.truth_(chan)){
var c__37594__auto___56870 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_56470){
var state_val_56471 = (state_56470[(1)]);
if((state_val_56471 === (1))){
var state_56470__$1 = state_56470;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_56470__$1,(2),chan);
} else {
if((state_val_56471 === (2))){
var inst_56461 = (state_56470[(7)]);
var inst_56461__$1 = (state_56470[(2)]);
var inst_56462 = (inst_56461__$1 instanceof cljs.core.ExceptionInfo);
var state_56470__$1 = (function (){var statearr_56481 = state_56470;
(statearr_56481[(7)] = inst_56461__$1);

return statearr_56481;
})();
if(cljs.core.truth_(inst_56462)){
var statearr_56482_56872 = state_56470__$1;
(statearr_56482_56872[(1)] = (3));

} else {
var statearr_56485_56873 = state_56470__$1;
(statearr_56485_56873[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56471 === (3))){
var inst_56461 = (state_56470[(7)]);
var inst_56464 = promesa.core.reject_BANG_(d,inst_56461);
var state_56470__$1 = state_56470;
var statearr_56491_56874 = state_56470__$1;
(statearr_56491_56874[(2)] = inst_56464);

(statearr_56491_56874[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56471 === (4))){
var inst_56461 = (state_56470[(7)]);
var inst_56466 = promesa.core.resolve_BANG_.cljs$core$IFn$_invoke$arity$2(d,inst_56461);
var state_56470__$1 = state_56470;
var statearr_56494_56875 = state_56470__$1;
(statearr_56494_56875[(2)] = inst_56466);

(statearr_56494_56875[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56471 === (5))){
var inst_56468 = (state_56470[(2)]);
var state_56470__$1 = state_56470;
return cljs.core.async.impl.ioc_helpers.return_chan(state_56470__$1,inst_56468);
} else {
return null;
}
}
}
}
}
});
return (function() {
var frontend$common$async_util$c__GT_p_$_state_machine__37085__auto__ = null;
var frontend$common$async_util$c__GT_p_$_state_machine__37085__auto____0 = (function (){
var statearr_56498 = [null,null,null,null,null,null,null,null];
(statearr_56498[(0)] = frontend$common$async_util$c__GT_p_$_state_machine__37085__auto__);

(statearr_56498[(1)] = (1));

return statearr_56498;
});
var frontend$common$async_util$c__GT_p_$_state_machine__37085__auto____1 = (function (state_56470){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_56470);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e56499){var ex__37088__auto__ = e56499;
var statearr_56500_56879 = state_56470;
(statearr_56500_56879[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_56470[(4)]))){
var statearr_56501_56881 = state_56470;
(statearr_56501_56881[(1)] = cljs.core.first((state_56470[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__56882 = state_56470;
state_56470 = G__56882;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
frontend$common$async_util$c__GT_p_$_state_machine__37085__auto__ = function(state_56470){
switch(arguments.length){
case 0:
return frontend$common$async_util$c__GT_p_$_state_machine__37085__auto____0.call(this);
case 1:
return frontend$common$async_util$c__GT_p_$_state_machine__37085__auto____1.call(this,state_56470);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$common$async_util$c__GT_p_$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$common$async_util$c__GT_p_$_state_machine__37085__auto____0;
frontend$common$async_util$c__GT_p_$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$common$async_util$c__GT_p_$_state_machine__37085__auto____1;
return frontend$common$async_util$c__GT_p_$_state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_56506 = f__37595__auto__();
(statearr_56506[(6)] = c__37594__auto___56870);

return statearr_56506;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
}));

} else {
promesa.core.resolve_BANG_.cljs$core$IFn$_invoke$arity$2(d,null);
}

return d;
});
/**
 * drop all stuffs in CH, and return all of them
 */
frontend.common.async_util.drain_chan = (function frontend$common$async_util$drain_chan(ch){
return cljs.core.take_while.cljs$core$IFn$_invoke$arity$2(cljs.core.identity,cljs.core.repeatedly.cljs$core$IFn$_invoke$arity$1((function (){
return cljs.core.async.poll_BANG_(ch);
})));
});
/**
 * return a channel CH,
 *   ratelimit flush items in in-ch every max-duration(ms),
 *   opts:
 *   - :filter-fn filter item before putting items into returned CH, (filter-fn item)
 *             will poll it when its return value is channel,
 *   - :flush-fn exec flush-fn when time to flush, (flush-fn item-coll)
 *   - :stop-ch stop go-loop when stop-ch closed
 *   - :distinct-key-fn distinct coll when put into CH
 *   - :chan-buffer buffer of return CH, default use (async/chan 1000)
 *   - :flush-now-ch flush the content in the queue immediately
 *   - :refresh-timeout-ch refresh (timeout max-duration)
 */
frontend.common.async_util._LT_ratelimit = (function frontend$common$async_util$_LT_ratelimit(var_args){
var args__5732__auto__ = [];
var len__5726__auto___56887 = arguments.length;
var i__5727__auto___56888 = (0);
while(true){
if((i__5727__auto___56888 < len__5726__auto___56887)){
args__5732__auto__.push((arguments[i__5727__auto___56888]));

var G__56889 = (i__5727__auto___56888 + (1));
i__5727__auto___56888 = G__56889;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.common.async_util._LT_ratelimit.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.common.async_util._LT_ratelimit.cljs$core$IFn$_invoke$arity$variadic = (function (in_ch,max_duration,p__56527){
var map__56528 = p__56527;
var map__56528__$1 = cljs.core.__destructure_map(map__56528);
var filter_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56528__$1,new cljs.core.Keyword(null,"filter-fn","filter-fn",1689475675));
var flush_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56528__$1,new cljs.core.Keyword(null,"flush-fn","flush-fn",668974810));
var stop_ch = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56528__$1,new cljs.core.Keyword(null,"stop-ch","stop-ch",-219113969));
var distinct_key_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56528__$1,new cljs.core.Keyword(null,"distinct-key-fn","distinct-key-fn",-2013025402));
var chan_buffer = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56528__$1,new cljs.core.Keyword(null,"chan-buffer","chan-buffer",-1749050088));
var flush_now_ch = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56528__$1,new cljs.core.Keyword(null,"flush-now-ch","flush-now-ch",639258780));
var refresh_timeout_ch = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__56528__$1,new cljs.core.Keyword(null,"refresh-timeout-ch","refresh-timeout-ch",951279589));
var ch = (cljs.core.truth_(chan_buffer)?cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(chan_buffer):cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1000)));
var stop_ch_STAR_ = (function (){var or__5002__auto__ = stop_ch;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$0();
}
})();
var flush_now_ch_STAR_ = (function (){var or__5002__auto__ = flush_now_ch;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$0();
}
})();
var refresh_timeout_ch_STAR_ = (function (){var or__5002__auto__ = refresh_timeout_ch;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$0();
}
})();
var c__37594__auto___56897 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_56703){
var state_val_56704 = (state_56703[(1)]);
if((state_val_56704 === (7))){
var inst_56627 = (state_56703[(2)]);
var inst_56628 = cljs.core.__destructure_map(inst_56627);
var inst_56629 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_56628,new cljs.core.Keyword(null,"refresh-timeout","refresh-timeout",937608570));
var inst_56630 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_56628,new cljs.core.Keyword(null,"timeout","timeout",-318625318));
var inst_56631 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_56628,new cljs.core.Keyword(null,"e","e",1381269198));
var inst_56632 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_56628,new cljs.core.Keyword(null,"stop","stop",-2140911342));
var inst_56633 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_56628,new cljs.core.Keyword(null,"flush-now","flush-now",1114212242));
var state_56703__$1 = (function (){var statearr_56705 = state_56703;
(statearr_56705[(7)] = inst_56630);

(statearr_56705[(8)] = inst_56631);

(statearr_56705[(9)] = inst_56632);

(statearr_56705[(10)] = inst_56633);

return statearr_56705;
})();
if(cljs.core.truth_(inst_56629)){
var statearr_56706_56898 = state_56703__$1;
(statearr_56706_56898[(1)] = (23));

} else {
var statearr_56707_56899 = state_56703__$1;
(statearr_56707_56899[(1)] = (24));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (20))){
var inst_56569 = (state_56703[(11)]);
var state_56703__$1 = state_56703;
var statearr_56708_56900 = state_56703__$1;
(statearr_56708_56900[(2)] = inst_56569);

(statearr_56708_56900[(1)] = (22));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (27))){
var inst_56630 = (state_56703[(7)]);
var state_56703__$1 = state_56703;
var statearr_56709_56902 = state_56703__$1;
(statearr_56709_56902[(2)] = inst_56630);

(statearr_56709_56902[(1)] = (28));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (1))){
var inst_56535 = cljs.core.async.timeout(max_duration);
var inst_56536 = cljs.core.PersistentVector.EMPTY;
var inst_56537 = inst_56535;
var inst_56538 = inst_56536;
var state_56703__$1 = (function (){var statearr_56710 = state_56703;
(statearr_56710[(12)] = inst_56537);

(statearr_56710[(13)] = inst_56538);

return statearr_56710;
})();
var statearr_56711_56903 = state_56703__$1;
(statearr_56711_56903[(2)] = null);

(statearr_56711_56903[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (24))){
var inst_56633 = (state_56703[(10)]);
var state_56703__$1 = state_56703;
if(cljs.core.truth_(inst_56633)){
var statearr_56712_56904 = state_56703__$1;
(statearr_56712_56904[(1)] = (26));

} else {
var statearr_56713_56905 = state_56703__$1;
(statearr_56713_56905[(1)] = (27));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (39))){
var inst_56538 = (state_56703[(13)]);
var inst_56631 = (state_56703[(8)]);
var inst_56664 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(inst_56538,inst_56631);
var state_56703__$1 = (function (){var statearr_56714 = state_56703;
(statearr_56714[(14)] = inst_56664);

return statearr_56714;
})();
if(cljs.core.truth_(distinct_key_fn)){
var statearr_56715_56908 = state_56703__$1;
(statearr_56715_56908[(1)] = (42));

} else {
var statearr_56716_56910 = state_56703__$1;
(statearr_56716_56910[(1)] = (43));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (46))){
var inst_56672 = (state_56703[(15)]);
var state_56703__$1 = state_56703;
var statearr_56717_56913 = state_56703__$1;
(statearr_56717_56913[(2)] = inst_56672);

(statearr_56717_56913[(1)] = (47));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (4))){
var inst_56565 = (state_56703[(16)]);
var inst_56572 = (state_56703[(17)]);
var inst_56556 = (state_56703[(18)]);
var inst_56565__$1 = (state_56703[(2)]);
var inst_56569 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_56565__$1,(0),null);
var inst_56572__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_56565__$1,(1),null);
var inst_56574 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_56572__$1,inst_56556);
var state_56703__$1 = (function (){var statearr_56718 = state_56703;
(statearr_56718[(16)] = inst_56565__$1);

(statearr_56718[(11)] = inst_56569);

(statearr_56718[(17)] = inst_56572__$1);

return statearr_56718;
})();
if(inst_56574){
var statearr_56719_56917 = state_56703__$1;
(statearr_56719_56917[(1)] = (5));

} else {
var statearr_56720_56919 = state_56703__$1;
(statearr_56720_56919[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (15))){
var inst_56572 = (state_56703[(17)]);
var inst_56559 = (state_56703[(19)]);
var inst_56607 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_56572,inst_56559);
var state_56703__$1 = state_56703;
if(inst_56607){
var statearr_56721_56922 = state_56703__$1;
(statearr_56721_56922[(1)] = (17));

} else {
var statearr_56723_56924 = state_56703__$1;
(statearr_56723_56924[(1)] = (18));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (48))){
var inst_56632 = (state_56703[(9)]);
var state_56703__$1 = state_56703;
var statearr_56724_56928 = state_56703__$1;
(statearr_56724_56928[(2)] = inst_56632);

(statearr_56724_56928[(1)] = (50));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (50))){
var inst_56688 = (state_56703[(2)]);
var state_56703__$1 = state_56703;
if(cljs.core.truth_(inst_56688)){
var statearr_56725_56929 = state_56703__$1;
(statearr_56725_56929[(1)] = (51));

} else {
var statearr_56726_56932 = state_56703__$1;
(statearr_56726_56932[(1)] = (52));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (21))){
var state_56703__$1 = state_56703;
var statearr_56727_56933 = state_56703__$1;
(statearr_56727_56933[(2)] = null);

(statearr_56727_56933[(1)] = (22));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (31))){
var inst_56697 = (state_56703[(2)]);
var state_56703__$1 = state_56703;
var statearr_56733_56935 = state_56703__$1;
(statearr_56733_56935[(2)] = inst_56697);

(statearr_56733_56935[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (32))){
var inst_56631 = (state_56703[(8)]);
var inst_56653 = (state_56703[(20)]);
var inst_56653__$1 = (filter_fn.cljs$core$IFn$_invoke$arity$1 ? filter_fn.cljs$core$IFn$_invoke$arity$1(inst_56631) : filter_fn.call(null,inst_56631));
var inst_56654 = (inst_56653__$1 instanceof cljs.core.async.impl.channels.ManyToManyChannel);
var state_56703__$1 = (function (){var statearr_56734 = state_56703;
(statearr_56734[(20)] = inst_56653__$1);

return statearr_56734;
})();
if(cljs.core.truth_(inst_56654)){
var statearr_56735_56939 = state_56703__$1;
(statearr_56735_56939[(1)] = (35));

} else {
var statearr_56736_56940 = state_56703__$1;
(statearr_56736_56940[(1)] = (36));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (40))){
var inst_56537 = (state_56703[(12)]);
var inst_56538 = (state_56703[(13)]);
var tmp56731 = inst_56538;
var tmp56732 = inst_56537;
var inst_56537__$1 = tmp56732;
var inst_56538__$1 = tmp56731;
var state_56703__$1 = (function (){var statearr_56742 = state_56703;
(statearr_56742[(12)] = inst_56537__$1);

(statearr_56742[(13)] = inst_56538__$1);

return statearr_56742;
})();
var statearr_56743_56942 = state_56703__$1;
(statearr_56743_56942[(2)] = null);

(statearr_56743_56942[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (33))){
var inst_56632 = (state_56703[(9)]);
var state_56703__$1 = state_56703;
if(cljs.core.truth_(inst_56632)){
var statearr_56744_56944 = state_56703__$1;
(statearr_56744_56944[(1)] = (48));

} else {
var statearr_56745_56945 = state_56703__$1;
(statearr_56745_56945[(1)] = (49));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (13))){
var inst_56623 = (state_56703[(2)]);
var state_56703__$1 = state_56703;
var statearr_56746_56946 = state_56703__$1;
(statearr_56746_56946[(2)] = inst_56623);

(statearr_56746_56946[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (22))){
var inst_56617 = (state_56703[(2)]);
var state_56703__$1 = state_56703;
var statearr_56747_56947 = state_56703__$1;
(statearr_56747_56947[(2)] = inst_56617);

(statearr_56747_56947[(1)] = (19));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (36))){
var inst_56653 = (state_56703[(20)]);
var state_56703__$1 = state_56703;
var statearr_56749_56948 = state_56703__$1;
(statearr_56749_56948[(2)] = inst_56653);

(statearr_56749_56948[(1)] = (37));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (41))){
var inst_56682 = (state_56703[(2)]);
var state_56703__$1 = state_56703;
var statearr_56752_56949 = state_56703__$1;
(statearr_56752_56949[(2)] = inst_56682);

(statearr_56752_56949[(1)] = (34));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (43))){
var inst_56664 = (state_56703[(14)]);
var state_56703__$1 = state_56703;
var statearr_56753_56950 = state_56703__$1;
(statearr_56753_56950[(2)] = inst_56664);

(statearr_56753_56950[(1)] = (44));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (29))){
var inst_56538 = (state_56703[(13)]);
var inst_56643 = cljs.core.async.onto_chan_BANG_.cljs$core$IFn$_invoke$arity$3(ch,inst_56538,false);
var inst_56644 = (flush_fn.cljs$core$IFn$_invoke$arity$1 ? flush_fn.cljs$core$IFn$_invoke$arity$1(inst_56538) : flush_fn.call(null,inst_56538));
var inst_56645 = frontend.common.async_util.drain_chan(flush_now_ch_STAR_);
var inst_56646 = cljs.core.async.timeout(max_duration);
var inst_56647 = cljs.core.PersistentVector.EMPTY;
var inst_56537 = inst_56646;
var inst_56538__$1 = inst_56647;
var state_56703__$1 = (function (){var statearr_56754 = state_56703;
(statearr_56754[(21)] = inst_56643);

(statearr_56754[(22)] = inst_56644);

(statearr_56754[(23)] = inst_56645);

(statearr_56754[(12)] = inst_56537);

(statearr_56754[(13)] = inst_56538__$1);

return statearr_56754;
})();
var statearr_56755_56953 = state_56703__$1;
(statearr_56755_56953[(2)] = null);

(statearr_56755_56953[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (44))){
var inst_56672 = (state_56703[(2)]);
var state_56703__$1 = (function (){var statearr_56758 = state_56703;
(statearr_56758[(15)] = inst_56672);

return statearr_56758;
})();
var statearr_56759_56954 = state_56703__$1;
(statearr_56759_56954[(1)] = (45));



return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (6))){
var inst_56572 = (state_56703[(17)]);
var inst_56537 = (state_56703[(12)]);
var inst_56584 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_56572,inst_56537);
var state_56703__$1 = state_56703;
if(inst_56584){
var statearr_56761_56955 = state_56703__$1;
(statearr_56761_56955[(1)] = (8));

} else {
var statearr_56762_56957 = state_56703__$1;
(statearr_56762_56957[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (28))){
var inst_56641 = (state_56703[(2)]);
var state_56703__$1 = state_56703;
if(cljs.core.truth_(inst_56641)){
var statearr_56763_56958 = state_56703__$1;
(statearr_56763_56958[(1)] = (29));

} else {
var statearr_56764_56959 = state_56703__$1;
(statearr_56764_56959[(1)] = (30));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (51))){
var inst_56690 = cljs.core.async.close_BANG_(ch);
var state_56703__$1 = state_56703;
var statearr_56765_56960 = state_56703__$1;
(statearr_56765_56960[(2)] = inst_56690);

(statearr_56765_56960[(1)] = (53));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (25))){
var inst_56699 = (state_56703[(2)]);
var state_56703__$1 = state_56703;
var statearr_56773_56961 = state_56703__$1;
(statearr_56773_56961[(2)] = inst_56699);

(statearr_56773_56961[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (34))){
var inst_56695 = (state_56703[(2)]);
var state_56703__$1 = state_56703;
var statearr_56778_56962 = state_56703__$1;
(statearr_56778_56962[(2)] = inst_56695);

(statearr_56778_56962[(1)] = (31));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (17))){
var inst_56609 = [new cljs.core.Keyword(null,"flush-now","flush-now",1114212242)];
var inst_56610 = [true];
var inst_56611 = cljs.core.PersistentHashMap.fromArrays(inst_56609,inst_56610);
var state_56703__$1 = state_56703;
var statearr_56779_56966 = state_56703__$1;
(statearr_56779_56966[(2)] = inst_56611);

(statearr_56779_56966[(1)] = (19));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (3))){
var inst_56701 = (state_56703[(2)]);
var state_56703__$1 = state_56703;
return cljs.core.async.impl.ioc_helpers.return_chan(state_56703__$1,inst_56701);
} else {
if((state_val_56704 === (12))){
var inst_56572 = (state_56703[(17)]);
var inst_56558 = (state_56703[(24)]);
var inst_56601 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_56572,inst_56558);
var state_56703__$1 = state_56703;
if(inst_56601){
var statearr_56783_56967 = state_56703__$1;
(statearr_56783_56967[(1)] = (14));

} else {
var statearr_56784_56968 = state_56703__$1;
(statearr_56784_56968[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (2))){
var inst_56556 = (state_56703[(18)]);
var inst_56537 = (state_56703[(12)]);
var inst_56557 = (state_56703[(25)]);
var inst_56558 = (state_56703[(24)]);
var inst_56559 = (state_56703[(19)]);
var inst_56556__$1 = refresh_timeout_ch_STAR_;
var inst_56557__$1 = in_ch;
var inst_56558__$1 = stop_ch_STAR_;
var inst_56559__$1 = flush_now_ch_STAR_;
var inst_56560 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_56562 = [inst_56556__$1,inst_56537,inst_56557__$1,inst_56558__$1,inst_56559__$1];
var inst_56563 = (new cljs.core.PersistentVector(null,5,(5),inst_56560,inst_56562,null));
var state_56703__$1 = (function (){var statearr_56786 = state_56703;
(statearr_56786[(18)] = inst_56556__$1);

(statearr_56786[(25)] = inst_56557__$1);

(statearr_56786[(24)] = inst_56558__$1);

(statearr_56786[(19)] = inst_56559__$1);

return statearr_56786;
})();
return cljs.core.async.ioc_alts_BANG_(state_56703__$1,(4),inst_56563);
} else {
if((state_val_56704 === (23))){
var inst_56538 = (state_56703[(13)]);
var inst_56635 = cljs.core.async.timeout(max_duration);
var tmp56781 = inst_56538;
var inst_56537 = inst_56635;
var inst_56538__$1 = tmp56781;
var state_56703__$1 = (function (){var statearr_56789 = state_56703;
(statearr_56789[(12)] = inst_56537);

(statearr_56789[(13)] = inst_56538__$1);

return statearr_56789;
})();
var statearr_56790_56972 = state_56703__$1;
(statearr_56790_56972[(2)] = null);

(statearr_56790_56972[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (47))){
var inst_56537 = (state_56703[(12)]);
var inst_56677 = (state_56703[(2)]);
var tmp56785 = inst_56537;
var inst_56537__$1 = tmp56785;
var inst_56538 = inst_56677;
var state_56703__$1 = (function (){var statearr_56791 = state_56703;
(statearr_56791[(12)] = inst_56537__$1);

(statearr_56791[(13)] = inst_56538);

return statearr_56791;
})();
var statearr_56792_56975 = state_56703__$1;
(statearr_56792_56975[(2)] = null);

(statearr_56792_56975[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (35))){
var inst_56653 = (state_56703[(20)]);
var state_56703__$1 = state_56703;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_56703__$1,(38),inst_56653);
} else {
if((state_val_56704 === (19))){
var inst_56619 = (state_56703[(2)]);
var state_56703__$1 = state_56703;
var statearr_56793_56977 = state_56703__$1;
(statearr_56793_56977[(2)] = inst_56619);

(statearr_56793_56977[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (11))){
var inst_56565 = (state_56703[(16)]);
var inst_56595 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_56565,(0),null);
var inst_56596 = [new cljs.core.Keyword(null,"e","e",1381269198)];
var inst_56597 = [inst_56595];
var inst_56598 = cljs.core.PersistentHashMap.fromArrays(inst_56596,inst_56597);
var state_56703__$1 = state_56703;
var statearr_56795_56979 = state_56703__$1;
(statearr_56795_56979[(2)] = inst_56598);

(statearr_56795_56979[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (9))){
var inst_56572 = (state_56703[(17)]);
var inst_56557 = (state_56703[(25)]);
var inst_56590 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_56572,inst_56557);
var state_56703__$1 = state_56703;
if(inst_56590){
var statearr_56796_56981 = state_56703__$1;
(statearr_56796_56981[(1)] = (11));

} else {
var statearr_56797_56982 = state_56703__$1;
(statearr_56797_56982[(1)] = (12));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (5))){
var inst_56578 = [new cljs.core.Keyword(null,"refresh-timeout","refresh-timeout",937608570)];
var inst_56580 = [true];
var inst_56581 = cljs.core.PersistentHashMap.fromArrays(inst_56578,inst_56580);
var state_56703__$1 = state_56703;
var statearr_56798_56983 = state_56703__$1;
(statearr_56798_56983[(2)] = inst_56581);

(statearr_56798_56983[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (14))){
var inst_56603 = [new cljs.core.Keyword(null,"stop","stop",-2140911342)];
var inst_56604 = [true];
var inst_56605 = cljs.core.PersistentHashMap.fromArrays(inst_56603,inst_56604);
var state_56703__$1 = state_56703;
var statearr_56799_56984 = state_56703__$1;
(statearr_56799_56984[(2)] = inst_56605);

(statearr_56799_56984[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (45))){
var inst_56672 = (state_56703[(15)]);
var inst_56674 = cljs.core.vec(inst_56672);
var state_56703__$1 = state_56703;
var statearr_56800_56986 = state_56703__$1;
(statearr_56800_56986[(2)] = inst_56674);

(statearr_56800_56986[(1)] = (47));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (53))){
var inst_56693 = (state_56703[(2)]);
var state_56703__$1 = state_56703;
var statearr_56801_56988 = state_56703__$1;
(statearr_56801_56988[(2)] = inst_56693);

(statearr_56801_56988[(1)] = (34));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (26))){
var inst_56633 = (state_56703[(10)]);
var state_56703__$1 = state_56703;
var statearr_56802_56990 = state_56703__$1;
(statearr_56802_56990[(2)] = inst_56633);

(statearr_56802_56990[(1)] = (28));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (16))){
var inst_56621 = (state_56703[(2)]);
var state_56703__$1 = state_56703;
var statearr_56808_56991 = state_56703__$1;
(statearr_56808_56991[(2)] = inst_56621);

(statearr_56808_56991[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (38))){
var inst_56657 = (state_56703[(2)]);
var state_56703__$1 = state_56703;
var statearr_56809_56993 = state_56703__$1;
(statearr_56809_56993[(2)] = inst_56657);

(statearr_56809_56993[(1)] = (37));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (30))){
var inst_56631 = (state_56703[(8)]);
var inst_56650 = (inst_56631 == null);
var inst_56651 = cljs.core.not(inst_56650);
var state_56703__$1 = state_56703;
if(inst_56651){
var statearr_56810_56994 = state_56703__$1;
(statearr_56810_56994[(1)] = (32));

} else {
var statearr_56811_56995 = state_56703__$1;
(statearr_56811_56995[(1)] = (33));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (10))){
var inst_56625 = (state_56703[(2)]);
var state_56703__$1 = state_56703;
var statearr_56815_56996 = state_56703__$1;
(statearr_56815_56996[(2)] = inst_56625);

(statearr_56815_56996[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (18))){
var inst_56572 = (state_56703[(17)]);
var inst_56613 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_56572,new cljs.core.Keyword(null,"default","default",-1987822328));
var state_56703__$1 = state_56703;
if(inst_56613){
var statearr_56816_56997 = state_56703__$1;
(statearr_56816_56997[(1)] = (20));

} else {
var statearr_56818_56998 = state_56703__$1;
(statearr_56818_56998[(1)] = (21));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (52))){
var state_56703__$1 = state_56703;
var statearr_56823_56999 = state_56703__$1;
(statearr_56823_56999[(2)] = null);

(statearr_56823_56999[(1)] = (53));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (42))){
var inst_56664 = (state_56703[(14)]);
var inst_56669 = logseq.common.util.distinct_by(distinct_key_fn,inst_56664);
var state_56703__$1 = state_56703;
var statearr_56825_57002 = state_56703__$1;
(statearr_56825_57002[(2)] = inst_56669);

(statearr_56825_57002[(1)] = (44));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (37))){
var inst_56660 = (state_56703[(2)]);
var state_56703__$1 = state_56703;
if(cljs.core.truth_(inst_56660)){
var statearr_56826_57008 = state_56703__$1;
(statearr_56826_57008[(1)] = (39));

} else {
var statearr_56827_57010 = state_56703__$1;
(statearr_56827_57010[(1)] = (40));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (8))){
var inst_56586 = [new cljs.core.Keyword(null,"timeout","timeout",-318625318)];
var inst_56587 = [true];
var inst_56588 = cljs.core.PersistentHashMap.fromArrays(inst_56586,inst_56587);
var state_56703__$1 = state_56703;
var statearr_56828_57014 = state_56703__$1;
(statearr_56828_57014[(2)] = inst_56588);

(statearr_56828_57014[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_56704 === (49))){
var inst_56631 = (state_56703[(8)]);
var inst_56686 = (inst_56631 == null);
var state_56703__$1 = state_56703;
var statearr_56833_57023 = state_56703__$1;
(statearr_56833_57023[(2)] = inst_56686);

(statearr_56833_57023[(1)] = (50));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var frontend$common$async_util$state_machine__37085__auto__ = null;
var frontend$common$async_util$state_machine__37085__auto____0 = (function (){
var statearr_56842 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_56842[(0)] = frontend$common$async_util$state_machine__37085__auto__);

(statearr_56842[(1)] = (1));

return statearr_56842;
});
var frontend$common$async_util$state_machine__37085__auto____1 = (function (state_56703){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_56703);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e56843){var ex__37088__auto__ = e56843;
var statearr_56844_57032 = state_56703;
(statearr_56844_57032[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_56703[(4)]))){
var statearr_56845_57033 = state_56703;
(statearr_56845_57033[(1)] = cljs.core.first((state_56703[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__57035 = state_56703;
state_56703 = G__57035;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
frontend$common$async_util$state_machine__37085__auto__ = function(state_56703){
switch(arguments.length){
case 0:
return frontend$common$async_util$state_machine__37085__auto____0.call(this);
case 1:
return frontend$common$async_util$state_machine__37085__auto____1.call(this,state_56703);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$common$async_util$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$common$async_util$state_machine__37085__auto____0;
frontend$common$async_util$state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$common$async_util$state_machine__37085__auto____1;
return frontend$common$async_util$state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_56849 = f__37595__auto__();
(statearr_56849[(6)] = c__37594__auto___56897);

return statearr_56849;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
}));


return ch;
}));

(frontend.common.async_util._LT_ratelimit.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.common.async_util._LT_ratelimit.cljs$lang$applyTo = (function (seq56520){
var G__56521 = cljs.core.first(seq56520);
var seq56520__$1 = cljs.core.next(seq56520);
var G__56522 = cljs.core.first(seq56520__$1);
var seq56520__$2 = cljs.core.next(seq56520__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__56521,G__56522,seq56520__$2);
}));


//# sourceMappingURL=frontend.common.async_util.js.map
