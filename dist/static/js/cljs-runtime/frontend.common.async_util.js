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
var c__36895__auto___62698 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_62432){
var state_val_62433 = (state_62432[(1)]);
if((state_val_62433 === (1))){
var state_62432__$1 = state_62432;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_62432__$1,(2),chan);
} else {
if((state_val_62433 === (2))){
var inst_62423 = (state_62432[(7)]);
var inst_62423__$1 = (state_62432[(2)]);
var inst_62424 = (inst_62423__$1 instanceof cljs.core.ExceptionInfo);
var state_62432__$1 = (function (){var statearr_62434 = state_62432;
(statearr_62434[(7)] = inst_62423__$1);

return statearr_62434;
})();
if(cljs.core.truth_(inst_62424)){
var statearr_62435_62703 = state_62432__$1;
(statearr_62435_62703[(1)] = (3));

} else {
var statearr_62436_62704 = state_62432__$1;
(statearr_62436_62704[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62433 === (3))){
var inst_62423 = (state_62432[(7)]);
var inst_62426 = promesa.core.reject_BANG_(d,inst_62423);
var state_62432__$1 = state_62432;
var statearr_62437_62705 = state_62432__$1;
(statearr_62437_62705[(2)] = inst_62426);

(statearr_62437_62705[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62433 === (4))){
var inst_62423 = (state_62432[(7)]);
var inst_62428 = promesa.core.resolve_BANG_.cljs$core$IFn$_invoke$arity$2(d,inst_62423);
var state_62432__$1 = state_62432;
var statearr_62438_62706 = state_62432__$1;
(statearr_62438_62706[(2)] = inst_62428);

(statearr_62438_62706[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62433 === (5))){
var inst_62430 = (state_62432[(2)]);
var state_62432__$1 = state_62432;
return cljs.core.async.impl.ioc_helpers.return_chan(state_62432__$1,inst_62430);
} else {
return null;
}
}
}
}
}
});
return (function() {
var frontend$common$async_util$c__GT_p_$_state_machine__36595__auto__ = null;
var frontend$common$async_util$c__GT_p_$_state_machine__36595__auto____0 = (function (){
var statearr_62439 = [null,null,null,null,null,null,null,null];
(statearr_62439[(0)] = frontend$common$async_util$c__GT_p_$_state_machine__36595__auto__);

(statearr_62439[(1)] = (1));

return statearr_62439;
});
var frontend$common$async_util$c__GT_p_$_state_machine__36595__auto____1 = (function (state_62432){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_62432);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e62440){var ex__36598__auto__ = e62440;
var statearr_62441_62711 = state_62432;
(statearr_62441_62711[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_62432[(4)]))){
var statearr_62442_62713 = state_62432;
(statearr_62442_62713[(1)] = cljs.core.first((state_62432[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__62714 = state_62432;
state_62432 = G__62714;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
frontend$common$async_util$c__GT_p_$_state_machine__36595__auto__ = function(state_62432){
switch(arguments.length){
case 0:
return frontend$common$async_util$c__GT_p_$_state_machine__36595__auto____0.call(this);
case 1:
return frontend$common$async_util$c__GT_p_$_state_machine__36595__auto____1.call(this,state_62432);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$common$async_util$c__GT_p_$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$common$async_util$c__GT_p_$_state_machine__36595__auto____0;
frontend$common$async_util$c__GT_p_$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$common$async_util$c__GT_p_$_state_machine__36595__auto____1;
return frontend$common$async_util$c__GT_p_$_state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_62443 = f__36897__auto__();
(statearr_62443[(6)] = c__36895__auto___62698);

return statearr_62443;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
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
var len__5726__auto___62715 = arguments.length;
var i__5727__auto___62716 = (0);
while(true){
if((i__5727__auto___62716 < len__5726__auto___62715)){
args__5732__auto__.push((arguments[i__5727__auto___62716]));

var G__62717 = (i__5727__auto___62716 + (1));
i__5727__auto___62716 = G__62717;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return frontend.common.async_util._LT_ratelimit.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(frontend.common.async_util._LT_ratelimit.cljs$core$IFn$_invoke$arity$variadic = (function (in_ch,max_duration,p__62451){
var map__62452 = p__62451;
var map__62452__$1 = cljs.core.__destructure_map(map__62452);
var filter_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62452__$1,new cljs.core.Keyword(null,"filter-fn","filter-fn",1689475675));
var flush_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62452__$1,new cljs.core.Keyword(null,"flush-fn","flush-fn",668974810));
var stop_ch = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62452__$1,new cljs.core.Keyword(null,"stop-ch","stop-ch",-219113969));
var distinct_key_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62452__$1,new cljs.core.Keyword(null,"distinct-key-fn","distinct-key-fn",-2013025402));
var chan_buffer = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62452__$1,new cljs.core.Keyword(null,"chan-buffer","chan-buffer",-1749050088));
var flush_now_ch = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62452__$1,new cljs.core.Keyword(null,"flush-now-ch","flush-now-ch",639258780));
var refresh_timeout_ch = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__62452__$1,new cljs.core.Keyword(null,"refresh-timeout-ch","refresh-timeout-ch",951279589));
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
var c__36895__auto___62718 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_62602){
var state_val_62603 = (state_62602[(1)]);
if((state_val_62603 === (7))){
var inst_62530 = (state_62602[(2)]);
var inst_62531 = cljs.core.__destructure_map(inst_62530);
var inst_62532 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_62531,new cljs.core.Keyword(null,"refresh-timeout","refresh-timeout",937608570));
var inst_62533 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_62531,new cljs.core.Keyword(null,"timeout","timeout",-318625318));
var inst_62534 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_62531,new cljs.core.Keyword(null,"e","e",1381269198));
var inst_62535 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_62531,new cljs.core.Keyword(null,"stop","stop",-2140911342));
var inst_62536 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_62531,new cljs.core.Keyword(null,"flush-now","flush-now",1114212242));
var state_62602__$1 = (function (){var statearr_62604 = state_62602;
(statearr_62604[(7)] = inst_62533);

(statearr_62604[(8)] = inst_62534);

(statearr_62604[(9)] = inst_62535);

(statearr_62604[(10)] = inst_62536);

return statearr_62604;
})();
if(cljs.core.truth_(inst_62532)){
var statearr_62605_62719 = state_62602__$1;
(statearr_62605_62719[(1)] = (23));

} else {
var statearr_62606_62720 = state_62602__$1;
(statearr_62606_62720[(1)] = (24));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (20))){
var inst_62478 = (state_62602[(11)]);
var state_62602__$1 = state_62602;
var statearr_62607_62721 = state_62602__$1;
(statearr_62607_62721[(2)] = inst_62478);

(statearr_62607_62721[(1)] = (22));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (27))){
var inst_62533 = (state_62602[(7)]);
var state_62602__$1 = state_62602;
var statearr_62608_62722 = state_62602__$1;
(statearr_62608_62722[(2)] = inst_62533);

(statearr_62608_62722[(1)] = (28));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (1))){
var inst_62453 = cljs.core.async.timeout(max_duration);
var inst_62454 = cljs.core.PersistentVector.EMPTY;
var inst_62455 = inst_62453;
var inst_62456 = inst_62454;
var state_62602__$1 = (function (){var statearr_62609 = state_62602;
(statearr_62609[(12)] = inst_62455);

(statearr_62609[(13)] = inst_62456);

return statearr_62609;
})();
var statearr_62610_62723 = state_62602__$1;
(statearr_62610_62723[(2)] = null);

(statearr_62610_62723[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (24))){
var inst_62536 = (state_62602[(10)]);
var state_62602__$1 = state_62602;
if(cljs.core.truth_(inst_62536)){
var statearr_62611_62725 = state_62602__$1;
(statearr_62611_62725[(1)] = (26));

} else {
var statearr_62612_62726 = state_62602__$1;
(statearr_62612_62726[(1)] = (27));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (39))){
var inst_62456 = (state_62602[(13)]);
var inst_62534 = (state_62602[(8)]);
var inst_62566 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(inst_62456,inst_62534);
var state_62602__$1 = (function (){var statearr_62613 = state_62602;
(statearr_62613[(14)] = inst_62566);

return statearr_62613;
})();
if(cljs.core.truth_(distinct_key_fn)){
var statearr_62614_62728 = state_62602__$1;
(statearr_62614_62728[(1)] = (42));

} else {
var statearr_62615_62729 = state_62602__$1;
(statearr_62615_62729[(1)] = (43));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (46))){
var inst_62571 = (state_62602[(15)]);
var state_62602__$1 = state_62602;
var statearr_62616_62730 = state_62602__$1;
(statearr_62616_62730[(2)] = inst_62571);

(statearr_62616_62730[(1)] = (47));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (4))){
var inst_62477 = (state_62602[(16)]);
var inst_62479 = (state_62602[(17)]);
var inst_62469 = (state_62602[(18)]);
var inst_62477__$1 = (state_62602[(2)]);
var inst_62478 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_62477__$1,(0),null);
var inst_62479__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_62477__$1,(1),null);
var inst_62480 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_62479__$1,inst_62469);
var state_62602__$1 = (function (){var statearr_62617 = state_62602;
(statearr_62617[(16)] = inst_62477__$1);

(statearr_62617[(11)] = inst_62478);

(statearr_62617[(17)] = inst_62479__$1);

return statearr_62617;
})();
if(inst_62480){
var statearr_62618_62731 = state_62602__$1;
(statearr_62618_62731[(1)] = (5));

} else {
var statearr_62619_62732 = state_62602__$1;
(statearr_62619_62732[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (15))){
var inst_62479 = (state_62602[(17)]);
var inst_62472 = (state_62602[(19)]);
var inst_62510 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_62479,inst_62472);
var state_62602__$1 = state_62602;
if(inst_62510){
var statearr_62620_62733 = state_62602__$1;
(statearr_62620_62733[(1)] = (17));

} else {
var statearr_62621_62734 = state_62602__$1;
(statearr_62621_62734[(1)] = (18));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (48))){
var inst_62535 = (state_62602[(9)]);
var state_62602__$1 = state_62602;
var statearr_62622_62736 = state_62602__$1;
(statearr_62622_62736[(2)] = inst_62535);

(statearr_62622_62736[(1)] = (50));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (50))){
var inst_62587 = (state_62602[(2)]);
var state_62602__$1 = state_62602;
if(cljs.core.truth_(inst_62587)){
var statearr_62623_62738 = state_62602__$1;
(statearr_62623_62738[(1)] = (51));

} else {
var statearr_62624_62739 = state_62602__$1;
(statearr_62624_62739[(1)] = (52));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (21))){
var state_62602__$1 = state_62602;
var statearr_62625_62740 = state_62602__$1;
(statearr_62625_62740[(2)] = null);

(statearr_62625_62740[(1)] = (22));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (31))){
var inst_62596 = (state_62602[(2)]);
var state_62602__$1 = state_62602;
var statearr_62628_62741 = state_62602__$1;
(statearr_62628_62741[(2)] = inst_62596);

(statearr_62628_62741[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (32))){
var inst_62534 = (state_62602[(8)]);
var inst_62556 = (state_62602[(20)]);
var inst_62556__$1 = (filter_fn.cljs$core$IFn$_invoke$arity$1 ? filter_fn.cljs$core$IFn$_invoke$arity$1(inst_62534) : filter_fn.call(null,inst_62534));
var inst_62557 = (inst_62556__$1 instanceof cljs.core.async.impl.channels.ManyToManyChannel);
var state_62602__$1 = (function (){var statearr_62629 = state_62602;
(statearr_62629[(20)] = inst_62556__$1);

return statearr_62629;
})();
if(cljs.core.truth_(inst_62557)){
var statearr_62630_62742 = state_62602__$1;
(statearr_62630_62742[(1)] = (35));

} else {
var statearr_62631_62743 = state_62602__$1;
(statearr_62631_62743[(1)] = (36));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (40))){
var inst_62455 = (state_62602[(12)]);
var inst_62456 = (state_62602[(13)]);
var tmp62626 = inst_62456;
var tmp62627 = inst_62455;
var inst_62455__$1 = tmp62627;
var inst_62456__$1 = tmp62626;
var state_62602__$1 = (function (){var statearr_62632 = state_62602;
(statearr_62632[(12)] = inst_62455__$1);

(statearr_62632[(13)] = inst_62456__$1);

return statearr_62632;
})();
var statearr_62633_62744 = state_62602__$1;
(statearr_62633_62744[(2)] = null);

(statearr_62633_62744[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (33))){
var inst_62535 = (state_62602[(9)]);
var state_62602__$1 = state_62602;
if(cljs.core.truth_(inst_62535)){
var statearr_62634_62747 = state_62602__$1;
(statearr_62634_62747[(1)] = (48));

} else {
var statearr_62635_62748 = state_62602__$1;
(statearr_62635_62748[(1)] = (49));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (13))){
var inst_62526 = (state_62602[(2)]);
var state_62602__$1 = state_62602;
var statearr_62636_62749 = state_62602__$1;
(statearr_62636_62749[(2)] = inst_62526);

(statearr_62636_62749[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (22))){
var inst_62520 = (state_62602[(2)]);
var state_62602__$1 = state_62602;
var statearr_62637_62750 = state_62602__$1;
(statearr_62637_62750[(2)] = inst_62520);

(statearr_62637_62750[(1)] = (19));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (36))){
var inst_62556 = (state_62602[(20)]);
var state_62602__$1 = state_62602;
var statearr_62638_62753 = state_62602__$1;
(statearr_62638_62753[(2)] = inst_62556);

(statearr_62638_62753[(1)] = (37));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (41))){
var inst_62581 = (state_62602[(2)]);
var state_62602__$1 = state_62602;
var statearr_62639_62754 = state_62602__$1;
(statearr_62639_62754[(2)] = inst_62581);

(statearr_62639_62754[(1)] = (34));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (43))){
var inst_62566 = (state_62602[(14)]);
var state_62602__$1 = state_62602;
var statearr_62640_62755 = state_62602__$1;
(statearr_62640_62755[(2)] = inst_62566);

(statearr_62640_62755[(1)] = (44));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (29))){
var inst_62456 = (state_62602[(13)]);
var inst_62546 = cljs.core.async.onto_chan_BANG_.cljs$core$IFn$_invoke$arity$3(ch,inst_62456,false);
var inst_62547 = (flush_fn.cljs$core$IFn$_invoke$arity$1 ? flush_fn.cljs$core$IFn$_invoke$arity$1(inst_62456) : flush_fn.call(null,inst_62456));
var inst_62548 = frontend.common.async_util.drain_chan(flush_now_ch_STAR_);
var inst_62549 = cljs.core.async.timeout(max_duration);
var inst_62550 = cljs.core.PersistentVector.EMPTY;
var inst_62455 = inst_62549;
var inst_62456__$1 = inst_62550;
var state_62602__$1 = (function (){var statearr_62641 = state_62602;
(statearr_62641[(21)] = inst_62546);

(statearr_62641[(22)] = inst_62547);

(statearr_62641[(23)] = inst_62548);

(statearr_62641[(12)] = inst_62455);

(statearr_62641[(13)] = inst_62456__$1);

return statearr_62641;
})();
var statearr_62642_62756 = state_62602__$1;
(statearr_62642_62756[(2)] = null);

(statearr_62642_62756[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (44))){
var inst_62571 = (state_62602[(2)]);
var state_62602__$1 = (function (){var statearr_62643 = state_62602;
(statearr_62643[(15)] = inst_62571);

return statearr_62643;
})();
var statearr_62644_62757 = state_62602__$1;
(statearr_62644_62757[(1)] = (45));



return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (6))){
var inst_62479 = (state_62602[(17)]);
var inst_62455 = (state_62602[(12)]);
var inst_62486 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_62479,inst_62455);
var state_62602__$1 = state_62602;
if(inst_62486){
var statearr_62646_62758 = state_62602__$1;
(statearr_62646_62758[(1)] = (8));

} else {
var statearr_62647_62759 = state_62602__$1;
(statearr_62647_62759[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (28))){
var inst_62544 = (state_62602[(2)]);
var state_62602__$1 = state_62602;
if(cljs.core.truth_(inst_62544)){
var statearr_62648_62761 = state_62602__$1;
(statearr_62648_62761[(1)] = (29));

} else {
var statearr_62649_62762 = state_62602__$1;
(statearr_62649_62762[(1)] = (30));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (51))){
var inst_62589 = cljs.core.async.close_BANG_(ch);
var state_62602__$1 = state_62602;
var statearr_62650_62764 = state_62602__$1;
(statearr_62650_62764[(2)] = inst_62589);

(statearr_62650_62764[(1)] = (53));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (25))){
var inst_62598 = (state_62602[(2)]);
var state_62602__$1 = state_62602;
var statearr_62651_62765 = state_62602__$1;
(statearr_62651_62765[(2)] = inst_62598);

(statearr_62651_62765[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (34))){
var inst_62594 = (state_62602[(2)]);
var state_62602__$1 = state_62602;
var statearr_62652_62766 = state_62602__$1;
(statearr_62652_62766[(2)] = inst_62594);

(statearr_62652_62766[(1)] = (31));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (17))){
var inst_62512 = [new cljs.core.Keyword(null,"flush-now","flush-now",1114212242)];
var inst_62513 = [true];
var inst_62514 = cljs.core.PersistentHashMap.fromArrays(inst_62512,inst_62513);
var state_62602__$1 = state_62602;
var statearr_62653_62767 = state_62602__$1;
(statearr_62653_62767[(2)] = inst_62514);

(statearr_62653_62767[(1)] = (19));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (3))){
var inst_62600 = (state_62602[(2)]);
var state_62602__$1 = state_62602;
return cljs.core.async.impl.ioc_helpers.return_chan(state_62602__$1,inst_62600);
} else {
if((state_val_62603 === (12))){
var inst_62479 = (state_62602[(17)]);
var inst_62471 = (state_62602[(24)]);
var inst_62504 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_62479,inst_62471);
var state_62602__$1 = state_62602;
if(inst_62504){
var statearr_62655_62768 = state_62602__$1;
(statearr_62655_62768[(1)] = (14));

} else {
var statearr_62656_62769 = state_62602__$1;
(statearr_62656_62769[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (2))){
var inst_62469 = (state_62602[(18)]);
var inst_62455 = (state_62602[(12)]);
var inst_62470 = (state_62602[(25)]);
var inst_62471 = (state_62602[(24)]);
var inst_62472 = (state_62602[(19)]);
var inst_62469__$1 = refresh_timeout_ch_STAR_;
var inst_62470__$1 = in_ch;
var inst_62471__$1 = stop_ch_STAR_;
var inst_62472__$1 = flush_now_ch_STAR_;
var inst_62473 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_62474 = [inst_62469__$1,inst_62455,inst_62470__$1,inst_62471__$1,inst_62472__$1];
var inst_62475 = (new cljs.core.PersistentVector(null,5,(5),inst_62473,inst_62474,null));
var state_62602__$1 = (function (){var statearr_62658 = state_62602;
(statearr_62658[(18)] = inst_62469__$1);

(statearr_62658[(25)] = inst_62470__$1);

(statearr_62658[(24)] = inst_62471__$1);

(statearr_62658[(19)] = inst_62472__$1);

return statearr_62658;
})();
return cljs.core.async.ioc_alts_BANG_(state_62602__$1,(4),inst_62475);
} else {
if((state_val_62603 === (23))){
var inst_62456 = (state_62602[(13)]);
var inst_62538 = cljs.core.async.timeout(max_duration);
var tmp62654 = inst_62456;
var inst_62455 = inst_62538;
var inst_62456__$1 = tmp62654;
var state_62602__$1 = (function (){var statearr_62659 = state_62602;
(statearr_62659[(12)] = inst_62455);

(statearr_62659[(13)] = inst_62456__$1);

return statearr_62659;
})();
var statearr_62660_62771 = state_62602__$1;
(statearr_62660_62771[(2)] = null);

(statearr_62660_62771[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (47))){
var inst_62455 = (state_62602[(12)]);
var inst_62576 = (state_62602[(2)]);
var tmp62657 = inst_62455;
var inst_62455__$1 = tmp62657;
var inst_62456 = inst_62576;
var state_62602__$1 = (function (){var statearr_62661 = state_62602;
(statearr_62661[(12)] = inst_62455__$1);

(statearr_62661[(13)] = inst_62456);

return statearr_62661;
})();
var statearr_62662_62772 = state_62602__$1;
(statearr_62662_62772[(2)] = null);

(statearr_62662_62772[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (35))){
var inst_62556 = (state_62602[(20)]);
var state_62602__$1 = state_62602;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_62602__$1,(38),inst_62556);
} else {
if((state_val_62603 === (19))){
var inst_62522 = (state_62602[(2)]);
var state_62602__$1 = state_62602;
var statearr_62663_62773 = state_62602__$1;
(statearr_62663_62773[(2)] = inst_62522);

(statearr_62663_62773[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (11))){
var inst_62477 = (state_62602[(16)]);
var inst_62499 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_62477,(0),null);
var inst_62500 = [new cljs.core.Keyword(null,"e","e",1381269198)];
var inst_62501 = [inst_62499];
var inst_62502 = cljs.core.PersistentHashMap.fromArrays(inst_62500,inst_62501);
var state_62602__$1 = state_62602;
var statearr_62664_62774 = state_62602__$1;
(statearr_62664_62774[(2)] = inst_62502);

(statearr_62664_62774[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (9))){
var inst_62479 = (state_62602[(17)]);
var inst_62470 = (state_62602[(25)]);
var inst_62493 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_62479,inst_62470);
var state_62602__$1 = state_62602;
if(inst_62493){
var statearr_62665_62775 = state_62602__$1;
(statearr_62665_62775[(1)] = (11));

} else {
var statearr_62666_62779 = state_62602__$1;
(statearr_62666_62779[(1)] = (12));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (5))){
var inst_62482 = [new cljs.core.Keyword(null,"refresh-timeout","refresh-timeout",937608570)];
var inst_62483 = [true];
var inst_62484 = cljs.core.PersistentHashMap.fromArrays(inst_62482,inst_62483);
var state_62602__$1 = state_62602;
var statearr_62667_62780 = state_62602__$1;
(statearr_62667_62780[(2)] = inst_62484);

(statearr_62667_62780[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (14))){
var inst_62506 = [new cljs.core.Keyword(null,"stop","stop",-2140911342)];
var inst_62507 = [true];
var inst_62508 = cljs.core.PersistentHashMap.fromArrays(inst_62506,inst_62507);
var state_62602__$1 = state_62602;
var statearr_62668_62782 = state_62602__$1;
(statearr_62668_62782[(2)] = inst_62508);

(statearr_62668_62782[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (45))){
var inst_62571 = (state_62602[(15)]);
var inst_62573 = cljs.core.vec(inst_62571);
var state_62602__$1 = state_62602;
var statearr_62669_62786 = state_62602__$1;
(statearr_62669_62786[(2)] = inst_62573);

(statearr_62669_62786[(1)] = (47));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (53))){
var inst_62592 = (state_62602[(2)]);
var state_62602__$1 = state_62602;
var statearr_62670_62787 = state_62602__$1;
(statearr_62670_62787[(2)] = inst_62592);

(statearr_62670_62787[(1)] = (34));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (26))){
var inst_62536 = (state_62602[(10)]);
var state_62602__$1 = state_62602;
var statearr_62671_62788 = state_62602__$1;
(statearr_62671_62788[(2)] = inst_62536);

(statearr_62671_62788[(1)] = (28));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (16))){
var inst_62524 = (state_62602[(2)]);
var state_62602__$1 = state_62602;
var statearr_62672_62789 = state_62602__$1;
(statearr_62672_62789[(2)] = inst_62524);

(statearr_62672_62789[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (38))){
var inst_62560 = (state_62602[(2)]);
var state_62602__$1 = state_62602;
var statearr_62673_62790 = state_62602__$1;
(statearr_62673_62790[(2)] = inst_62560);

(statearr_62673_62790[(1)] = (37));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (30))){
var inst_62534 = (state_62602[(8)]);
var inst_62553 = (inst_62534 == null);
var inst_62554 = cljs.core.not(inst_62553);
var state_62602__$1 = state_62602;
if(inst_62554){
var statearr_62674_62791 = state_62602__$1;
(statearr_62674_62791[(1)] = (32));

} else {
var statearr_62676_62792 = state_62602__$1;
(statearr_62676_62792[(1)] = (33));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (10))){
var inst_62528 = (state_62602[(2)]);
var state_62602__$1 = state_62602;
var statearr_62677_62794 = state_62602__$1;
(statearr_62677_62794[(2)] = inst_62528);

(statearr_62677_62794[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (18))){
var inst_62479 = (state_62602[(17)]);
var inst_62516 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_62479,new cljs.core.Keyword(null,"default","default",-1987822328));
var state_62602__$1 = state_62602;
if(inst_62516){
var statearr_62678_62796 = state_62602__$1;
(statearr_62678_62796[(1)] = (20));

} else {
var statearr_62679_62797 = state_62602__$1;
(statearr_62679_62797[(1)] = (21));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (52))){
var state_62602__$1 = state_62602;
var statearr_62680_62798 = state_62602__$1;
(statearr_62680_62798[(2)] = null);

(statearr_62680_62798[(1)] = (53));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (42))){
var inst_62566 = (state_62602[(14)]);
var inst_62568 = logseq.common.util.distinct_by(distinct_key_fn,inst_62566);
var state_62602__$1 = state_62602;
var statearr_62681_62799 = state_62602__$1;
(statearr_62681_62799[(2)] = inst_62568);

(statearr_62681_62799[(1)] = (44));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (37))){
var inst_62563 = (state_62602[(2)]);
var state_62602__$1 = state_62602;
if(cljs.core.truth_(inst_62563)){
var statearr_62682_62800 = state_62602__$1;
(statearr_62682_62800[(1)] = (39));

} else {
var statearr_62683_62801 = state_62602__$1;
(statearr_62683_62801[(1)] = (40));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (8))){
var inst_62489 = [new cljs.core.Keyword(null,"timeout","timeout",-318625318)];
var inst_62490 = [true];
var inst_62491 = cljs.core.PersistentHashMap.fromArrays(inst_62489,inst_62490);
var state_62602__$1 = state_62602;
var statearr_62684_62802 = state_62602__$1;
(statearr_62684_62802[(2)] = inst_62491);

(statearr_62684_62802[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_62603 === (49))){
var inst_62534 = (state_62602[(8)]);
var inst_62585 = (inst_62534 == null);
var state_62602__$1 = state_62602;
var statearr_62685_62804 = state_62602__$1;
(statearr_62685_62804[(2)] = inst_62585);

(statearr_62685_62804[(1)] = (50));


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
var frontend$common$async_util$state_machine__36595__auto__ = null;
var frontend$common$async_util$state_machine__36595__auto____0 = (function (){
var statearr_62689 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_62689[(0)] = frontend$common$async_util$state_machine__36595__auto__);

(statearr_62689[(1)] = (1));

return statearr_62689;
});
var frontend$common$async_util$state_machine__36595__auto____1 = (function (state_62602){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_62602);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e62690){var ex__36598__auto__ = e62690;
var statearr_62691_62806 = state_62602;
(statearr_62691_62806[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_62602[(4)]))){
var statearr_62692_62807 = state_62602;
(statearr_62692_62807[(1)] = cljs.core.first((state_62602[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__62809 = state_62602;
state_62602 = G__62809;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
frontend$common$async_util$state_machine__36595__auto__ = function(state_62602){
switch(arguments.length){
case 0:
return frontend$common$async_util$state_machine__36595__auto____0.call(this);
case 1:
return frontend$common$async_util$state_machine__36595__auto____1.call(this,state_62602);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$common$async_util$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$common$async_util$state_machine__36595__auto____0;
frontend$common$async_util$state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$common$async_util$state_machine__36595__auto____1;
return frontend$common$async_util$state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_62693 = f__36897__auto__();
(statearr_62693[(6)] = c__36895__auto___62718);

return statearr_62693;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));


return ch;
}));

(frontend.common.async_util._LT_ratelimit.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(frontend.common.async_util._LT_ratelimit.cljs$lang$applyTo = (function (seq62448){
var G__62449 = cljs.core.first(seq62448);
var seq62448__$1 = cljs.core.next(seq62448);
var G__62450 = cljs.core.first(seq62448__$1);
var seq62448__$2 = cljs.core.next(seq62448__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__62449,G__62450,seq62448__$2);
}));


//# sourceMappingURL=frontend.common.async_util.js.map
