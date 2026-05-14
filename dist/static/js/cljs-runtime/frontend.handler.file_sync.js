goog.provide('frontend.handler.file_sync');
var module$node_modules$path$path=shadow.js.require("module$node_modules$path$path", {});
frontend.handler.file_sync._STAR_beta_unavailable_QMARK_ = cljs.core.volatile_BANG_(false);
frontend.handler.file_sync.refresh_file_sync_component = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
frontend.handler.file_sync.get_current_graph_uuid = (function frontend$handler$file_sync$get_current_graph_uuid(){
return frontend.state.get_current_file_sync_graph_uuid();
});
frontend.handler.file_sync.enable_sync_QMARK_ = (function frontend$handler$file_sync$enable_sync_QMARK_(){
var or__5002__auto__ = frontend.state.enable_sync_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.config.dev_QMARK_;
}
});
frontend.handler.file_sync.current_graph_sync_on_QMARK_ = (function frontend$handler$file_sync$current_graph_sync_on_QMARK_(){
var temp__5804__auto__ = frontend.state.sub_file_sync_state(frontend.state.get_current_file_sync_graph_uuid());
if(cljs.core.truth_(temp__5804__auto__)){
var sync_state = temp__5804__auto__;
return (!(frontend.fs.sync.sync_state__stopped_QMARK_(sync_state)));
} else {
return null;
}
});
frontend.handler.file_sync.synced_file_graph_QMARK_ = (function frontend$handler$file_sync$synced_file_graph_QMARK_(graph){
return cljs.core.some((function (item){
var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(graph,new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(item));
if(and__5000__auto__){
return new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531).cljs$core$IFn$_invoke$arity$1(item);
} else {
return and__5000__auto__;
}
}),frontend.state.get_repos());
});
frontend.handler.file_sync.create_graph = (function frontend$handler$file_sync$create_graph(name){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_117474){
var state_val_117475 = (state_117474[(1)]);
if((state_val_117475 === (7))){
var inst_117390 = (state_117474[(7)]);
var state_117474__$1 = state_117474;
var statearr_117477_118599 = state_117474__$1;
(statearr_117477_118599[(2)] = inst_117390);

(statearr_117477_118599[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (20))){
var inst_117429 = (state_117474[(8)]);
var state_117474__$1 = state_117474;
var statearr_117479_118604 = state_117474__$1;
(statearr_117479_118604[(2)] = inst_117429);

(statearr_117479_118604[(1)] = (22));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (27))){
var state_117474__$1 = state_117474;
var statearr_117480_118605 = state_117474__$1;
(statearr_117480_118605[(1)] = (29));



return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (1))){
var inst_117385 = frontend.fs.sync._LT_create_graph(frontend.fs.sync.remoteapi,name);
var state_117474__$1 = state_117474;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_117474__$1,(2),inst_117385);
} else {
if((state_val_117475 === (24))){
var inst_117401 = (state_117474[(9)]);
var inst_117445 = [(404),null,(400),null];
var inst_117446 = (new cljs.core.PersistentArrayMap(null,2,inst_117445,null));
var inst_117447 = (new cljs.core.PersistentHashSet(null,inst_117446,null));
var inst_117448 = cljs.core.ex_data(inst_117401);
var inst_117449 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_117450 = [new cljs.core.Keyword(null,"err","err",-2089457205),new cljs.core.Keyword(null,"status","status",-1997798413)];
var inst_117451 = (new cljs.core.PersistentVector(null,2,(5),inst_117449,inst_117450,null));
var inst_117452 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(inst_117448,inst_117451);
var inst_117453 = cljs.core.contains_QMARK_(inst_117447,inst_117452);
var state_117474__$1 = state_117474;
if(inst_117453){
var statearr_117482_118613 = state_117474__$1;
(statearr_117482_118613[(1)] = (26));

} else {
var statearr_117483_118614 = state_117474__$1;
(statearr_117483_118614[(1)] = (27));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (4))){
var inst_117387 = (state_117474[(10)]);
var state_117474__$1 = state_117474;
var statearr_117488_118615 = state_117474__$1;
(statearr_117488_118615[(2)] = inst_117387);

(statearr_117488_118615[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (15))){
var inst_117411 = (state_117474[(2)]);
var state_117474__$1 = state_117474;
if(cljs.core.truth_(inst_117411)){
var statearr_117493_118618 = state_117474__$1;
(statearr_117493_118618[(1)] = (16));

} else {
var statearr_117494_118619 = state_117474__$1;
(statearr_117494_118619[(1)] = (17));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (21))){
var inst_117401 = (state_117474[(9)]);
var inst_117432 = frontend.fs.sync.graph_count_exceed_limit_QMARK_(inst_117401);
var state_117474__$1 = state_117474;
var statearr_117495_118620 = state_117474__$1;
(statearr_117495_118620[(2)] = inst_117432);

(statearr_117495_118620[(1)] = (22));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (31))){
var inst_117464 = (state_117474[(2)]);
var state_117474__$1 = state_117474;
var statearr_117496_118621 = state_117474__$1;
(statearr_117496_118621[(2)] = inst_117464);

(statearr_117496_118621[(1)] = (28));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (13))){
var inst_117401 = (state_117474[(9)]);
var inst_117408 = typeof inst_117401 === 'string';
var state_117474__$1 = state_117474;
var statearr_117498_118626 = state_117474__$1;
(statearr_117498_118626[(2)] = inst_117408);

(statearr_117498_118626[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (22))){
var inst_117434 = (state_117474[(2)]);
var state_117474__$1 = state_117474;
if(cljs.core.truth_(inst_117434)){
var statearr_117499_118628 = state_117474__$1;
(statearr_117499_118628[(1)] = (23));

} else {
var statearr_117500_118629 = state_117474__$1;
(statearr_117500_118629[(1)] = (24));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (29))){
var inst_117401 = (state_117474[(9)]);
var inst_117459 = cljs.core.ex_message(inst_117401);
var inst_117460 = ["Create graph failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(inst_117459)].join('');
var inst_117461 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$6(inst_117460,new cljs.core.Keyword(null,"warning","warning",-1685650671),true,null,(4000),null);
var state_117474__$1 = state_117474;
var statearr_117501_118630 = state_117474__$1;
(statearr_117501_118630[(2)] = inst_117461);

(statearr_117501_118630[(1)] = (31));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (6))){
var inst_117390 = (state_117474[(7)]);
var inst_117401 = (state_117474[(2)]);
var inst_117402 = (inst_117390 instanceof cljs.core.ExceptionInfo);
var state_117474__$1 = (function (){var statearr_117504 = state_117474;
(statearr_117504[(9)] = inst_117401);

return statearr_117504;
})();
if(cljs.core.truth_(inst_117402)){
var statearr_117505_118632 = state_117474__$1;
(statearr_117505_118632[(1)] = (10));

} else {
var statearr_117506_118634 = state_117474__$1;
(statearr_117506_118634[(1)] = (11));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (28))){
var inst_117466 = (state_117474[(2)]);
var state_117474__$1 = state_117474;
var statearr_117507_118635 = state_117474__$1;
(statearr_117507_118635[(2)] = inst_117466);

(statearr_117507_118635[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (25))){
var inst_117468 = (state_117474[(2)]);
var state_117474__$1 = state_117474;
var statearr_117511_118636 = state_117474__$1;
(statearr_117511_118636[(2)] = inst_117468);

(statearr_117511_118636[(1)] = (18));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (17))){
var inst_117401 = (state_117474[(9)]);
var inst_117429 = (state_117474[(8)]);
var inst_117424 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_117425 = [new cljs.core.Keyword("ui","loading?","ui/loading?",1905710757),new cljs.core.Keyword("graph","create-remote?","graph/create-remote?",-1583424902)];
var inst_117426 = (new cljs.core.PersistentVector(null,2,(5),inst_117424,inst_117425,null));
var inst_117427 = frontend.state.set_state_BANG_(inst_117426,false);
var inst_117429__$1 = frontend.fs.sync.storage_exceed_limit_QMARK_(inst_117401);
var state_117474__$1 = (function (){var statearr_117517 = state_117474;
(statearr_117517[(11)] = inst_117427);

(statearr_117517[(8)] = inst_117429__$1);

return statearr_117517;
})();
if(cljs.core.truth_(inst_117429__$1)){
var statearr_117521_118637 = state_117474__$1;
(statearr_117521_118637[(1)] = (20));

} else {
var statearr_117522_118639 = state_117474__$1;
(statearr_117522_118639[(1)] = (21));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (3))){
var inst_117387 = (state_117474[(10)]);
var inst_117390 = (state_117474[(2)]);
var inst_117391 = (inst_117387 instanceof cljs.core.ExceptionInfo);
var state_117474__$1 = (function (){var statearr_117523 = state_117474;
(statearr_117523[(7)] = inst_117390);

return statearr_117523;
})();
if(cljs.core.truth_(inst_117391)){
var statearr_117524_118641 = state_117474__$1;
(statearr_117524_118641[(1)] = (4));

} else {
var statearr_117525_118642 = state_117474__$1;
(statearr_117525_118642[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (12))){
var inst_117472 = (state_117474[(2)]);
var state_117474__$1 = state_117474;
return cljs.core.async.impl.ioc_helpers.return_chan(state_117474__$1,inst_117472);
} else {
if((state_val_117475 === (2))){
var inst_117387 = (state_117474[(2)]);
var inst_117388 = frontend.handler.user._LT_user_uuid();
var state_117474__$1 = (function (){var statearr_117527 = state_117474;
(statearr_117527[(10)] = inst_117387);

return statearr_117527;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_117474__$1,(3),inst_117388);
} else {
if((state_val_117475 === (23))){
var state_117474__$1 = state_117474;
var statearr_117528_118644 = state_117474__$1;
(statearr_117528_118644[(2)] = null);

(statearr_117528_118644[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (19))){
var inst_117417 = (state_117474[(12)]);
var inst_117421 = (state_117474[(2)]);
var inst_117422 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.handler.file_sync.refresh_file_sync_component,cljs.core.not);
var state_117474__$1 = (function (){var statearr_117529 = state_117474;
(statearr_117529[(13)] = inst_117421);

(statearr_117529[(14)] = inst_117422);

return statearr_117529;
})();
var statearr_117531_118645 = state_117474__$1;
(statearr_117531_118645[(2)] = inst_117417);

(statearr_117531_118645[(1)] = (18));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (11))){
var inst_117401 = (state_117474[(9)]);
var inst_117406 = (state_117474[(15)]);
var inst_117405 = (inst_117401 instanceof cljs.core.ExceptionInfo);
var inst_117406__$1 = cljs.core.not(inst_117405);
var state_117474__$1 = (function (){var statearr_117532 = state_117474;
(statearr_117532[(15)] = inst_117406__$1);

return statearr_117532;
})();
if(inst_117406__$1){
var statearr_117533_118651 = state_117474__$1;
(statearr_117533_118651[(1)] = (13));

} else {
var statearr_117534_118652 = state_117474__$1;
(statearr_117534_118652[(1)] = (14));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (9))){
var inst_117399 = (state_117474[(2)]);
var state_117474__$1 = state_117474;
var statearr_117536_118653 = state_117474__$1;
(statearr_117536_118653[(2)] = inst_117399);

(statearr_117536_118653[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (5))){
var inst_117390 = (state_117474[(7)]);
var inst_117394 = (inst_117390 instanceof cljs.core.ExceptionInfo);
var state_117474__$1 = state_117474;
if(cljs.core.truth_(inst_117394)){
var statearr_117539_118657 = state_117474__$1;
(statearr_117539_118657[(1)] = (7));

} else {
var statearr_117540_118658 = state_117474__$1;
(statearr_117540_118658[(1)] = (8));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (14))){
var inst_117406 = (state_117474[(15)]);
var state_117474__$1 = state_117474;
var statearr_117541_118659 = state_117474__$1;
(statearr_117541_118659[(2)] = inst_117406);

(statearr_117541_118659[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (26))){
var inst_117455 = ["Create graph failed: already existed graph: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)].join('');
var inst_117456 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$6(inst_117455,new cljs.core.Keyword(null,"warning","warning",-1685650671),true,null,(4000),null);
var state_117474__$1 = state_117474;
var statearr_117542_118660 = state_117474__$1;
(statearr_117542_118660[(2)] = inst_117456);

(statearr_117542_118660[(1)] = (28));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (16))){
var inst_117401 = (state_117474[(9)]);
var inst_117390 = (state_117474[(7)]);
var inst_117417 = (state_117474[(12)]);
var inst_117413 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_117415 = frontend.state.get_current_repo();
var inst_117416 = [(0),inst_117401,inst_117390,inst_117415];
var inst_117417__$1 = (new cljs.core.PersistentVector(null,4,(5),inst_117413,inst_117416,null));
var inst_117419 = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(frontend.fs.sync._LT_update_graphs_txid_BANG_,inst_117417__$1);
var state_117474__$1 = (function (){var statearr_117543 = state_117474;
(statearr_117543[(12)] = inst_117417__$1);

return statearr_117543;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_117474__$1,(19),inst_117419);
} else {
if((state_val_117475 === (30))){
var state_117474__$1 = state_117474;
var statearr_117550_118662 = state_117474__$1;
(statearr_117550_118662[(2)] = null);

(statearr_117550_118662[(1)] = (31));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (10))){
var state_117474__$1 = state_117474;
var statearr_117551_118663 = state_117474__$1;
(statearr_117551_118663[(2)] = null);

(statearr_117551_118663[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (18))){
var inst_117470 = (state_117474[(2)]);
var state_117474__$1 = state_117474;
var statearr_117558_118664 = state_117474__$1;
(statearr_117558_118664[(2)] = inst_117470);

(statearr_117558_118664[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117475 === (8))){
var inst_117387 = (state_117474[(10)]);
var inst_117397 = new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531).cljs$core$IFn$_invoke$arity$1(inst_117387);
var state_117474__$1 = state_117474;
var statearr_117559_118665 = state_117474__$1;
(statearr_117559_118665[(2)] = inst_117397);

(statearr_117559_118665[(1)] = (9));


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
});
return (function() {
var frontend$handler$file_sync$create_graph_$_state_machine__32004__auto__ = null;
var frontend$handler$file_sync$create_graph_$_state_machine__32004__auto____0 = (function (){
var statearr_117562 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_117562[(0)] = frontend$handler$file_sync$create_graph_$_state_machine__32004__auto__);

(statearr_117562[(1)] = (1));

return statearr_117562;
});
var frontend$handler$file_sync$create_graph_$_state_machine__32004__auto____1 = (function (state_117474){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_117474);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e117563){var ex__32007__auto__ = e117563;
var statearr_117564_118671 = state_117474;
(statearr_117564_118671[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_117474[(4)]))){
var statearr_117566_118672 = state_117474;
(statearr_117566_118672[(1)] = cljs.core.first((state_117474[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__118673 = state_117474;
state_117474 = G__118673;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$file_sync$create_graph_$_state_machine__32004__auto__ = function(state_117474){
switch(arguments.length){
case 0:
return frontend$handler$file_sync$create_graph_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$file_sync$create_graph_$_state_machine__32004__auto____1.call(this,state_117474);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_sync$create_graph_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_sync$create_graph_$_state_machine__32004__auto____0;
frontend$handler$file_sync$create_graph_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_sync$create_graph_$_state_machine__32004__auto____1;
return frontend$handler$file_sync$create_graph_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_117570 = f__32196__auto__();
(statearr_117570[(6)] = c__32195__auto__);

return statearr_117570;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
frontend.handler.file_sync._LT_delete_graph = (function frontend$handler$file_sync$_LT_delete_graph(graph_uuid){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_117607){
var state_val_117608 = (state_117607[(1)]);
if((state_val_117608 === (7))){
var inst_117590 = ["Delete graph failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(graph_uuid)].join('');
var inst_117591 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(inst_117590,new cljs.core.Keyword(null,"warning","warning",-1685650671));
var state_117607__$1 = state_117607;
var statearr_117609_118677 = state_117607__$1;
(statearr_117609_118677[(2)] = inst_117591);

(statearr_117609_118677[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117608 === (1))){
var inst_117576 = (state_117607[(7)]);
var inst_117575 = frontend.handler.file_sync.get_current_graph_uuid();
var inst_117576__$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(graph_uuid,inst_117575);
var state_117607__$1 = (function (){var statearr_117610 = state_117607;
(statearr_117610[(7)] = inst_117576__$1);

return statearr_117610;
})();
if(inst_117576__$1){
var statearr_117611_118679 = state_117607__$1;
(statearr_117611_118679[(1)] = (2));

} else {
var statearr_117612_118680 = state_117607__$1;
(statearr_117612_118680[(1)] = (3));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117608 === (4))){
var inst_117584 = (state_117607[(2)]);
var inst_117585 = frontend.fs.sync._LT_delete_graph(frontend.fs.sync.remoteapi,graph_uuid);
var state_117607__$1 = (function (){var statearr_117616 = state_117607;
(statearr_117616[(8)] = inst_117584);

return statearr_117616;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_117607__$1,(6),inst_117585);
} else {
if((state_val_117608 === (6))){
var inst_117587 = (state_117607[(2)]);
var inst_117588 = (inst_117587 instanceof cljs.core.ExceptionInfo);
var state_117607__$1 = state_117607;
if(cljs.core.truth_(inst_117588)){
var statearr_117618_118686 = state_117607__$1;
(statearr_117618_118686[(1)] = (7));

} else {
var statearr_117619_118687 = state_117607__$1;
(statearr_117619_118687[(1)] = (8));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117608 === (3))){
var state_117607__$1 = state_117607;
var statearr_117620_118691 = state_117607__$1;
(statearr_117620_118691[(2)] = null);

(statearr_117620_118691[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117608 === (12))){
var inst_117601 = (state_117607[(2)]);
var inst_117603 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Graph deleted",new cljs.core.Keyword(null,"success","success",1890645906));
var state_117607__$1 = (function (){var statearr_117621 = state_117607;
(statearr_117621[(9)] = inst_117601);

return statearr_117621;
})();
var statearr_117622_118692 = state_117607__$1;
(statearr_117622_118692[(2)] = inst_117603);

(statearr_117622_118692[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117608 === (2))){
var inst_117579 = frontend.fs.sync._LT_sync_stop();
var state_117607__$1 = state_117607;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_117607__$1,(5),inst_117579);
} else {
if((state_val_117608 === (11))){
var state_117607__$1 = state_117607;
var statearr_117626_118694 = state_117607__$1;
(statearr_117626_118694[(2)] = null);

(statearr_117626_118694[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117608 === (9))){
var inst_117605 = (state_117607[(2)]);
var state_117607__$1 = state_117607;
return cljs.core.async.impl.ioc_helpers.return_chan(state_117607__$1,inst_117605);
} else {
if((state_val_117608 === (5))){
var inst_117581 = (state_117607[(2)]);
var state_117607__$1 = state_117607;
var statearr_117632_118696 = state_117607__$1;
(statearr_117632_118696[(2)] = inst_117581);

(statearr_117632_118696[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117608 === (10))){
var inst_117597 = frontend.fs.sync.clear_graphs_txid_BANG_(graph_uuid);
var inst_117598 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.handler.file_sync.refresh_file_sync_component,cljs.core.not);
var state_117607__$1 = (function (){var statearr_117638 = state_117607;
(statearr_117638[(10)] = inst_117597);

return statearr_117638;
})();
var statearr_117639_118697 = state_117607__$1;
(statearr_117639_118697[(2)] = inst_117598);

(statearr_117639_118697[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117608 === (8))){
var inst_117576 = (state_117607[(7)]);
var state_117607__$1 = state_117607;
if(cljs.core.truth_(inst_117576)){
var statearr_117644_118699 = state_117607__$1;
(statearr_117644_118699[(1)] = (10));

} else {
var statearr_117646_118700 = state_117607__$1;
(statearr_117646_118700[(1)] = (11));

}

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
});
return (function() {
var frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32004__auto__ = null;
var frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32004__auto____0 = (function (){
var statearr_117652 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_117652[(0)] = frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32004__auto__);

(statearr_117652[(1)] = (1));

return statearr_117652;
});
var frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32004__auto____1 = (function (state_117607){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_117607);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e117656){var ex__32007__auto__ = e117656;
var statearr_117657_118701 = state_117607;
(statearr_117657_118701[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_117607[(4)]))){
var statearr_117659_118702 = state_117607;
(statearr_117659_118702[(1)] = cljs.core.first((state_117607[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__118705 = state_117607;
state_117607 = G__118705;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32004__auto__ = function(state_117607){
switch(arguments.length){
case 0:
return frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32004__auto____1.call(this,state_117607);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32004__auto____0;
frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32004__auto____1;
return frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_117660 = f__32196__auto__();
(statearr_117660[(6)] = c__32195__auto__);

return statearr_117660;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
frontend.handler.file_sync._LT_list_graphs = (function frontend$handler$file_sync$_LT_list_graphs(){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_117671){
var state_val_117672 = (state_117671[(1)]);
if((state_val_117672 === (1))){
var inst_117661 = frontend.fs.sync._LT_list_remote_graphs(frontend.fs.sync.remoteapi);
var state_117671__$1 = state_117671;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_117671__$1,(2),inst_117661);
} else {
if((state_val_117672 === (2))){
var inst_117663 = (state_117671[(7)]);
var inst_117663__$1 = (state_117671[(2)]);
var inst_117664 = (inst_117663__$1 instanceof cljs.core.ExceptionInfo);
var state_117671__$1 = (function (){var statearr_117676 = state_117671;
(statearr_117676[(7)] = inst_117663__$1);

return statearr_117676;
})();
if(cljs.core.truth_(inst_117664)){
var statearr_117677_118713 = state_117671__$1;
(statearr_117677_118713[(1)] = (3));

} else {
var statearr_117678_118714 = state_117671__$1;
(statearr_117678_118714[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117672 === (3))){
var inst_117663 = (state_117671[(7)]);
var state_117671__$1 = state_117671;
var statearr_117679_118715 = state_117671__$1;
(statearr_117679_118715[(2)] = inst_117663);

(statearr_117679_118715[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117672 === (4))){
var inst_117663 = (state_117671[(7)]);
var inst_117667 = new cljs.core.Keyword(null,"Graphs","Graphs",296240865).cljs$core$IFn$_invoke$arity$1(inst_117663);
var state_117671__$1 = state_117671;
var statearr_117680_118716 = state_117671__$1;
(statearr_117680_118716[(2)] = inst_117667);

(statearr_117680_118716[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117672 === (5))){
var inst_117669 = (state_117671[(2)]);
var state_117671__$1 = state_117671;
return cljs.core.async.impl.ioc_helpers.return_chan(state_117671__$1,inst_117669);
} else {
return null;
}
}
}
}
}
});
return (function() {
var frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32004__auto__ = null;
var frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32004__auto____0 = (function (){
var statearr_117683 = [null,null,null,null,null,null,null,null];
(statearr_117683[(0)] = frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32004__auto__);

(statearr_117683[(1)] = (1));

return statearr_117683;
});
var frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32004__auto____1 = (function (state_117671){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_117671);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e117684){var ex__32007__auto__ = e117684;
var statearr_117685_118719 = state_117671;
(statearr_117685_118719[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_117671[(4)]))){
var statearr_117686_118720 = state_117671;
(statearr_117686_118720[(1)] = cljs.core.first((state_117671[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__118721 = state_117671;
state_117671 = G__118721;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32004__auto__ = function(state_117671){
switch(arguments.length){
case 0:
return frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32004__auto____1.call(this,state_117671);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32004__auto____0;
frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32004__auto____1;
return frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_117688 = f__32196__auto__();
(statearr_117688[(6)] = c__32195__auto__);

return statearr_117688;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
frontend.handler.file_sync.load_session_graphs = (function frontend$handler$file_sync$load_session_graphs(){
if(cljs.core.truth_(frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"loading","loading",-737050189)], null)))){
return null;
} else {
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_117720){
var state_val_117721 = (state_117720[(1)]);
if((state_val_117721 === (1))){
var state_117720__$1 = state_117720;
if(frontend.util.web_platform_QMARK_){
var statearr_117729_118724 = state_117720__$1;
(statearr_117729_118724[(1)] = (2));

} else {
var statearr_117731_118725 = state_117720__$1;
(statearr_117731_118725[(1)] = (3));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117721 === (2))){
var state_117720__$1 = state_117720;
var statearr_117733_118726 = state_117720__$1;
(statearr_117733_118726[(2)] = null);

(statearr_117733_118726[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117721 === (3))){
var inst_117694 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_117696 = [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"loading","loading",-737050189)];
var inst_117697 = (new cljs.core.PersistentVector(null,2,(5),inst_117694,inst_117696,null));
var inst_117698 = frontend.state.set_state_BANG_(inst_117697,true);
var inst_117700 = frontend.handler.file_sync._LT_list_graphs();
var state_117720__$1 = (function (){var statearr_117738 = state_117720;
(statearr_117738[(7)] = inst_117698);

return statearr_117738;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_117720__$1,(5),inst_117700);
} else {
if((state_val_117721 === (4))){
var inst_117717 = (state_117720[(2)]);
var state_117720__$1 = state_117720;
return cljs.core.async.impl.ioc_helpers.return_chan(state_117720__$1,inst_117717);
} else {
if((state_val_117721 === (5))){
var inst_117702 = (state_117720[(8)]);
var inst_117702__$1 = (state_117720[(2)]);
var inst_117703 = (inst_117702__$1 instanceof cljs.core.ExceptionInfo);
var state_117720__$1 = (function (){var statearr_117768 = state_117720;
(statearr_117768[(8)] = inst_117702__$1);

return statearr_117768;
})();
if(cljs.core.truth_(inst_117703)){
var statearr_117773_118733 = state_117720__$1;
(statearr_117773_118733[(1)] = (6));

} else {
var statearr_117774_118734 = state_117720__$1;
(statearr_117774_118734[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117721 === (6))){
var state_117720__$1 = state_117720;
var statearr_117777_118735 = state_117720__$1;
(statearr_117777_118735[(2)] = null);

(statearr_117777_118735[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117721 === (7))){
var inst_117702 = (state_117720[(8)]);
var inst_117707 = [new cljs.core.Keyword(null,"loading","loading",-737050189),new cljs.core.Keyword(null,"graphs","graphs",-1584479112)];
var inst_117708 = [false,inst_117702];
var inst_117709 = cljs.core.PersistentHashMap.fromArrays(inst_117707,inst_117708);
var inst_117710 = frontend.state.set_state_BANG_(new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),inst_117709);
var state_117720__$1 = state_117720;
var statearr_117785_118738 = state_117720__$1;
(statearr_117785_118738[(2)] = inst_117710);

(statearr_117785_118738[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117721 === (8))){
var inst_117715 = (state_117720[(2)]);
var state_117720__$1 = state_117720;
var statearr_117788_118745 = state_117720__$1;
(statearr_117788_118745[(2)] = inst_117715);

(statearr_117788_118745[(1)] = (4));


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
});
return (function() {
var frontend$handler$file_sync$load_session_graphs_$_state_machine__32004__auto__ = null;
var frontend$handler$file_sync$load_session_graphs_$_state_machine__32004__auto____0 = (function (){
var statearr_117794 = [null,null,null,null,null,null,null,null,null];
(statearr_117794[(0)] = frontend$handler$file_sync$load_session_graphs_$_state_machine__32004__auto__);

(statearr_117794[(1)] = (1));

return statearr_117794;
});
var frontend$handler$file_sync$load_session_graphs_$_state_machine__32004__auto____1 = (function (state_117720){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_117720);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e117797){var ex__32007__auto__ = e117797;
var statearr_117798_118747 = state_117720;
(statearr_117798_118747[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_117720[(4)]))){
var statearr_117800_118748 = state_117720;
(statearr_117800_118748[(1)] = cljs.core.first((state_117720[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__118749 = state_117720;
state_117720 = G__118749;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$file_sync$load_session_graphs_$_state_machine__32004__auto__ = function(state_117720){
switch(arguments.length){
case 0:
return frontend$handler$file_sync$load_session_graphs_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$file_sync$load_session_graphs_$_state_machine__32004__auto____1.call(this,state_117720);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_sync$load_session_graphs_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_sync$load_session_graphs_$_state_machine__32004__auto____0;
frontend$handler$file_sync$load_session_graphs_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_sync$load_session_graphs_$_state_machine__32004__auto____1;
return frontend$handler$file_sync$load_session_graphs_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_117805 = f__32196__auto__();
(statearr_117805[(6)] = c__32195__auto__);

return statearr_117805;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
}
});
frontend.handler.file_sync.reset_session_graphs = (function frontend$handler$file_sync$reset_session_graphs(){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"loading","loading",-737050189),false,new cljs.core.Keyword(null,"graphs","graphs",-1584479112),null], null));
});
frontend.handler.file_sync.init_graph = (function frontend$handler$file_sync$init_graph(graph_uuid){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_117848){
var state_val_117849 = (state_117848[(1)]);
if((state_val_117849 === (1))){
var inst_117821 = frontend.state.get_current_repo();
var inst_117823 = frontend.handler.user._LT_user_uuid();
var state_117848__$1 = (function (){var statearr_117860 = state_117848;
(statearr_117860[(7)] = inst_117821);

return statearr_117860;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_117848__$1,(2),inst_117823);
} else {
if((state_val_117849 === (2))){
var inst_117826 = (state_117848[(8)]);
var inst_117826__$1 = (state_117848[(2)]);
var inst_117827 = (inst_117826__$1 instanceof cljs.core.ExceptionInfo);
var state_117848__$1 = (function (){var statearr_117875 = state_117848;
(statearr_117875[(8)] = inst_117826__$1);

return statearr_117875;
})();
if(cljs.core.truth_(inst_117827)){
var statearr_117877_118753 = state_117848__$1;
(statearr_117877_118753[(1)] = (3));

} else {
var statearr_117878_118755 = state_117848__$1;
(statearr_117878_118755[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117849 === (3))){
var inst_117826 = (state_117848[(8)]);
var inst_117829 = cljs.core.ex_message(inst_117826);
var inst_117830 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(inst_117829,new cljs.core.Keyword(null,"error","error",-978969032));
var state_117848__$1 = state_117848;
var statearr_117893_118762 = state_117848__$1;
(statearr_117893_118762[(2)] = inst_117830);

(statearr_117893_118762[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_117849 === (4))){
var inst_117826 = (state_117848[(8)]);
var inst_117821 = (state_117848[(7)]);
var inst_117832 = frontend.state.set_state_BANG_(new cljs.core.Keyword("sync-graph","init?","sync-graph/init?",608792103),true);
var inst_117833 = frontend.fs.sync._LT_update_graphs_txid_BANG_((0),graph_uuid,inst_117826,inst_117821);
var state_117848__$1 = (function (){var statearr_117917 = state_117848;
(statearr_117917[(9)] = inst_117832);

return statearr_117917;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_117848__$1,(6),inst_117833);
} else {
if((state_val_117849 === (5))){
var inst_117845 = (state_117848[(2)]);
var state_117848__$1 = state_117848;
return cljs.core.async.impl.ioc_helpers.return_chan(state_117848__$1,inst_117845);
} else {
if((state_val_117849 === (6))){
var inst_117821 = (state_117848[(7)]);
var inst_117835 = (state_117848[(2)]);
var inst_117836 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.handler.file_sync.refresh_file_sync_component,cljs.core.not);
var inst_117837 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_117838 = [new cljs.core.Keyword(null,"persist?","persist?",-1772568760)];
var inst_117839 = [false];
var inst_117840 = cljs.core.PersistentHashMap.fromArrays(inst_117838,inst_117839);
var inst_117841 = [new cljs.core.Keyword("graph","switch","graph/switch",178853840),inst_117821,inst_117840];
var inst_117842 = (new cljs.core.PersistentVector(null,3,(5),inst_117837,inst_117841,null));
var inst_117843 = frontend.state.pub_event_BANG_(inst_117842);
var state_117848__$1 = (function (){var statearr_117925 = state_117848;
(statearr_117925[(10)] = inst_117835);

(statearr_117925[(11)] = inst_117836);

return statearr_117925;
})();
var statearr_117926_118772 = state_117848__$1;
(statearr_117926_118772[(2)] = inst_117843);

(statearr_117926_118772[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
});
return (function() {
var frontend$handler$file_sync$init_graph_$_state_machine__32004__auto__ = null;
var frontend$handler$file_sync$init_graph_$_state_machine__32004__auto____0 = (function (){
var statearr_117929 = [null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_117929[(0)] = frontend$handler$file_sync$init_graph_$_state_machine__32004__auto__);

(statearr_117929[(1)] = (1));

return statearr_117929;
});
var frontend$handler$file_sync$init_graph_$_state_machine__32004__auto____1 = (function (state_117848){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_117848);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e117931){var ex__32007__auto__ = e117931;
var statearr_117932_118775 = state_117848;
(statearr_117932_118775[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_117848[(4)]))){
var statearr_117934_118776 = state_117848;
(statearr_117934_118776[(1)] = cljs.core.first((state_117848[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__118779 = state_117848;
state_117848 = G__118779;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$file_sync$init_graph_$_state_machine__32004__auto__ = function(state_117848){
switch(arguments.length){
case 0:
return frontend$handler$file_sync$init_graph_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$file_sync$init_graph_$_state_machine__32004__auto____1.call(this,state_117848);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_sync$init_graph_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_sync$init_graph_$_state_machine__32004__auto____0;
frontend$handler$file_sync$init_graph_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_sync$init_graph_$_state_machine__32004__auto____1;
return frontend$handler$file_sync$init_graph_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_117940 = f__32196__auto__();
(statearr_117940[(6)] = c__32195__auto__);

return statearr_117940;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
frontend.handler.file_sync.download_version_file = (function frontend$handler$file_sync$download_version_file(var_args){
var G__117947 = arguments.length;
switch (G__117947) {
case 3:
return frontend.handler.file_sync.download_version_file.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return frontend.handler.file_sync.download_version_file.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.file_sync.download_version_file.cljs$core$IFn$_invoke$arity$3 = (function (graph_uuid,file_uuid,version_uuid){
return frontend.handler.file_sync.download_version_file.cljs$core$IFn$_invoke$arity$4(graph_uuid,file_uuid,version_uuid,false);
}));

(frontend.handler.file_sync.download_version_file.cljs$core$IFn$_invoke$arity$4 = (function (graph_uuid,file_uuid,version_uuid,silent_download_QMARK_){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_118002){
var state_val_118003 = (state_118002[(1)]);
if((state_val_118003 === (7))){
var inst_117956 = (state_118002[(7)]);
var inst_117977 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_117978 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_117979 = [new cljs.core.Keyword(null,"div","div",1057191632),"Downloaded version file at: "];
var inst_117980 = (new cljs.core.PersistentVector(null,2,(5),inst_117978,inst_117979,null));
var inst_117982 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_117983 = [new cljs.core.Keyword(null,"div","div",1057191632),inst_117956];
var inst_117984 = (new cljs.core.PersistentVector(null,2,(5),inst_117982,inst_117983,null));
var inst_117985 = [new cljs.core.Keyword(null,"div","div",1057191632),inst_117980,inst_117984];
var inst_117986 = (new cljs.core.PersistentVector(null,3,(5),inst_117977,inst_117985,null));
var inst_117987 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(inst_117986,new cljs.core.Keyword(null,"success","success",1890645906),false);
var state_118002__$1 = state_118002;
var statearr_118015_118785 = state_118002__$1;
(statearr_118015_118785[(2)] = inst_117987);

(statearr_118015_118785[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118003 === (1))){
var inst_117956 = (state_118002[(7)]);
var inst_117956__$1 = module$node_modules$path$path.join(file_uuid,version_uuid);
var inst_117957 = frontend.state.get_current_repo();
var inst_117958 = frontend.config.get_repo_dir(inst_117957);
var inst_117959 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_117960 = [inst_117956__$1];
var inst_117961 = (new cljs.core.PersistentVector(null,1,(5),inst_117959,inst_117960,null));
var inst_117962 = frontend.fs.sync._LT_download_version_files(frontend.fs.sync.rsapi,graph_uuid,inst_117958,inst_117961);
var state_118002__$1 = (function (){var statearr_118017 = state_118002;
(statearr_118017[(7)] = inst_117956__$1);

return statearr_118017;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_118002__$1,(2),inst_117962);
} else {
if((state_val_118003 === (4))){
var state_118002__$1 = state_118002;
if(cljs.core.truth_(silent_download_QMARK_)){
var statearr_118018_118788 = state_118002__$1;
(statearr_118018_118788[(1)] = (6));

} else {
var statearr_118021_118789 = state_118002__$1;
(statearr_118021_118789[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118003 === (6))){
var state_118002__$1 = state_118002;
var statearr_118022_118790 = state_118002__$1;
(statearr_118022_118790[(2)] = null);

(statearr_118022_118790[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118003 === (3))){
var inst_117964 = (state_118002[(8)]);
var inst_117968 = cljs.core.ex_cause(inst_117964);
var inst_117969 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(inst_117968,new cljs.core.Keyword(null,"error","error",-978969032));
var state_118002__$1 = state_118002;
var statearr_118024_118792 = state_118002__$1;
(statearr_118024_118792[(2)] = inst_117969);

(statearr_118024_118792[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118003 === (2))){
var inst_117964 = (state_118002[(8)]);
var inst_117964__$1 = (state_118002[(2)]);
var inst_117965 = (inst_117964__$1 instanceof cljs.core.ExceptionInfo);
var state_118002__$1 = (function (){var statearr_118025 = state_118002;
(statearr_118025[(8)] = inst_117964__$1);

return statearr_118025;
})();
if(cljs.core.truth_(inst_117965)){
var statearr_118027_118797 = state_118002__$1;
(statearr_118027_118797[(1)] = (3));

} else {
var statearr_118028_118798 = state_118002__$1;
(statearr_118028_118798[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118003 === (11))){
var inst_117999 = (state_118002[(2)]);
var state_118002__$1 = state_118002;
return cljs.core.async.impl.ioc_helpers.return_chan(state_118002__$1,inst_117999);
} else {
if((state_val_118003 === (9))){
var state_118002__$1 = state_118002;
var statearr_118030_118801 = state_118002__$1;
(statearr_118030_118801[(2)] = null);

(statearr_118030_118801[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118003 === (5))){
var inst_117964 = (state_118002[(8)]);
var inst_117991 = (state_118002[(2)]);
var inst_117992 = (inst_117964 instanceof cljs.core.ExceptionInfo);
var state_118002__$1 = (function (){var statearr_118031 = state_118002;
(statearr_118031[(9)] = inst_117991);

return statearr_118031;
})();
if(cljs.core.truth_(inst_117992)){
var statearr_118032_118802 = state_118002__$1;
(statearr_118032_118802[(1)] = (9));

} else {
var statearr_118033_118803 = state_118002__$1;
(statearr_118033_118803[(1)] = (10));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118003 === (10))){
var inst_117956 = (state_118002[(7)]);
var inst_117997 = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic("logseq",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["version-files",inst_117956], 0));
var state_118002__$1 = state_118002;
var statearr_118036_118804 = state_118002__$1;
(statearr_118036_118804[(2)] = inst_117997);

(statearr_118036_118804[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118003 === (8))){
var inst_117989 = (state_118002[(2)]);
var state_118002__$1 = state_118002;
var statearr_118038_118805 = state_118002__$1;
(statearr_118038_118805[(2)] = inst_117989);

(statearr_118038_118805[(1)] = (5));


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
});
return (function() {
var frontend$handler$file_sync$state_machine__32004__auto__ = null;
var frontend$handler$file_sync$state_machine__32004__auto____0 = (function (){
var statearr_118039 = [null,null,null,null,null,null,null,null,null,null];
(statearr_118039[(0)] = frontend$handler$file_sync$state_machine__32004__auto__);

(statearr_118039[(1)] = (1));

return statearr_118039;
});
var frontend$handler$file_sync$state_machine__32004__auto____1 = (function (state_118002){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_118002);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e118041){var ex__32007__auto__ = e118041;
var statearr_118042_118808 = state_118002;
(statearr_118042_118808[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_118002[(4)]))){
var statearr_118044_118809 = state_118002;
(statearr_118044_118809[(1)] = cljs.core.first((state_118002[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__118810 = state_118002;
state_118002 = G__118810;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$file_sync$state_machine__32004__auto__ = function(state_118002){
switch(arguments.length){
case 0:
return frontend$handler$file_sync$state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$file_sync$state_machine__32004__auto____1.call(this,state_118002);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_sync$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_sync$state_machine__32004__auto____0;
frontend$handler$file_sync$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_sync$state_machine__32004__auto____1;
return frontend$handler$file_sync$state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_118047 = f__32196__auto__();
(statearr_118047[(6)] = c__32195__auto__);

return statearr_118047;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
}));

(frontend.handler.file_sync.download_version_file.cljs$lang$maxFixedArity = 4);

frontend.handler.file_sync._LT_list_file_local_versions = (function frontend$handler$file_sync$_LT_list_file_local_versions(page){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_118126){
var state_val_118129 = (state_118126[(1)]);
if((state_val_118129 === (7))){
var inst_118066 = (state_118126[(7)]);
var inst_118070 = cljs.core.seq(inst_118066);
var state_118126__$1 = state_118126;
if(inst_118070){
var statearr_118143_118814 = state_118126__$1;
(statearr_118143_118814[(1)] = (9));

} else {
var statearr_118145_118815 = state_118126__$1;
(statearr_118145_118815[(1)] = (10));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118129 === (1))){
var inst_118052 = (state_118126[(8)]);
var inst_118051 = new cljs.core.Keyword("block","file","block/file",183171933).cljs$core$IFn$_invoke$arity$1(page);
var inst_118052__$1 = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(inst_118051);
var state_118126__$1 = (function (){var statearr_118154 = state_118126;
(statearr_118154[(8)] = inst_118052__$1);

return statearr_118154;
})();
if(cljs.core.truth_(inst_118052__$1)){
var statearr_118157_118817 = state_118126__$1;
(statearr_118157_118817[(1)] = (2));

} else {
var statearr_118159_118818 = state_118126__$1;
(statearr_118159_118818[(1)] = (3));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118129 === (4))){
var inst_118123 = (state_118126[(2)]);
var state_118126__$1 = state_118126;
return cljs.core.async.impl.ioc_helpers.return_chan(state_118126__$1,inst_118123);
} else {
if((state_val_118129 === (6))){
var state_118126__$1 = state_118126;
var statearr_118171_118820 = state_118126__$1;
(statearr_118171_118820[(2)] = null);

(statearr_118171_118820[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118129 === (3))){
var state_118126__$1 = state_118126;
var statearr_118175_118821 = state_118126__$1;
(statearr_118175_118821[(2)] = null);

(statearr_118175_118821[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118129 === (2))){
var inst_118052 = (state_118126[(8)]);
var inst_118057 = (state_118126[(9)]);
var inst_118058 = (state_118126[(10)]);
var inst_118059 = (state_118126[(11)]);
var inst_118062 = (state_118126[(12)]);
var inst_118056 = frontend.state.get_current_repo();
var inst_118057__$1 = frontend.config.get_repo_dir(inst_118056);
var inst_118058__$1 = clojure.string.replace_first(inst_118052,inst_118057__$1,"");
var inst_118059__$1 = logseq.common.path.file_stem(inst_118058__$1);
var inst_118061 = logseq.common.path.dirname(inst_118058__$1);
var inst_118062__$1 = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(inst_118057__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["logseq/version-files/local",inst_118061,inst_118059__$1], 0));
var inst_118063 = frontend.fs.readdir.cljs$core$IFn$_invoke$arity$variadic(inst_118062__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"path-only?","path-only?",-825545027),true], 0));
var inst_118064 = cljs.core.async.interop.p__GT_c(inst_118063);
var state_118126__$1 = (function (){var statearr_118187 = state_118126;
(statearr_118187[(9)] = inst_118057__$1);

(statearr_118187[(10)] = inst_118058__$1);

(statearr_118187[(11)] = inst_118059__$1);

(statearr_118187[(12)] = inst_118062__$1);

return statearr_118187;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_118126__$1,(5),inst_118064);
} else {
if((state_val_118129 === (11))){
var inst_118113 = (state_118126[(2)]);
var state_118126__$1 = state_118126;
var statearr_118198_118828 = state_118126__$1;
(statearr_118198_118828[(2)] = inst_118113);

(statearr_118198_118828[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118129 === (9))){
var inst_118052 = (state_118126[(8)]);
var inst_118057 = (state_118126[(9)]);
var inst_118058 = (state_118126[(10)]);
var inst_118059 = (state_118126[(11)]);
var inst_118062 = (state_118126[(12)]);
var inst_118066 = (state_118126[(7)]);
var inst_118073 = (function (){var temp__5804__auto__ = inst_118052;
var path = inst_118052;
var base_path = inst_118057;
var rel_path = inst_118058;
var file_stem = inst_118059;
var version_files_dir = inst_118062;
var version_file_paths = inst_118066;
return (function (path__$1){
try{var create_time = (function (p1__118049_SHARP_){
return cljs_time.format.parse.cljs$core$IFn$_invoke$arity$2(cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1("yyyy-MM-dd'T'HH_mm_ss.SSSZZ"),p1__118049_SHARP_);
})(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(module$node_modules$path$path.parse(path__$1),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0))));
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"create-time","create-time",875410581),create_time,new cljs.core.Keyword(null,"path","path",-188191168),path__$1,new cljs.core.Keyword(null,"relative-path","relative-path",1848635172),logseq.common.path.relative_path(base_path,path__$1)], null);
}catch (e118209){var e = e118209;
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.file-sync",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("page-history","parse-format-error","page-history/parse-format-error",276798971),e,new cljs.core.Keyword(null,"line","line",212345235),167], null)),null);

return null;
}});
})();
var inst_118074 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(inst_118073,inst_118066);
var inst_118075 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,inst_118074);
var state_118126__$1 = state_118126;
var statearr_118219_118834 = state_118126__$1;
(statearr_118219_118834[(2)] = inst_118075);

(statearr_118219_118834[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118129 === (5))){
var inst_118066 = (state_118126[(7)]);
var inst_118066__$1 = (state_118126[(2)]);
var inst_118067 = (inst_118066__$1 instanceof cljs.core.ExceptionInfo);
var state_118126__$1 = (function (){var statearr_118220 = state_118126;
(statearr_118220[(7)] = inst_118066__$1);

return statearr_118220;
})();
if(cljs.core.truth_(inst_118067)){
var statearr_118221_118837 = state_118126__$1;
(statearr_118221_118837[(1)] = (6));

} else {
var statearr_118222_118838 = state_118126__$1;
(statearr_118222_118838[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118129 === (10))){
var state_118126__$1 = state_118126;
var statearr_118224_118840 = state_118126__$1;
(statearr_118224_118840[(2)] = null);

(statearr_118224_118840[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118129 === (8))){
var inst_118120 = (state_118126[(2)]);
var state_118126__$1 = state_118126;
var statearr_118227_118841 = state_118126__$1;
(statearr_118227_118841[(2)] = inst_118120);

(statearr_118227_118841[(1)] = (4));


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
});
return (function() {
var frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32004__auto__ = null;
var frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32004__auto____0 = (function (){
var statearr_118229 = [null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_118229[(0)] = frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32004__auto__);

(statearr_118229[(1)] = (1));

return statearr_118229;
});
var frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32004__auto____1 = (function (state_118126){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_118126);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e118232){var ex__32007__auto__ = e118232;
var statearr_118235_118843 = state_118126;
(statearr_118235_118843[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_118126[(4)]))){
var statearr_118237_118844 = state_118126;
(statearr_118237_118844[(1)] = cljs.core.first((state_118126[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__118845 = state_118126;
state_118126 = G__118845;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32004__auto__ = function(state_118126){
switch(arguments.length){
case 0:
return frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32004__auto____1.call(this,state_118126);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32004__auto____0;
frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32004__auto____1;
return frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_118242 = f__32196__auto__();
(statearr_118242[(6)] = c__32195__auto__);

return statearr_118242;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
frontend.handler.file_sync._LT_fetch_page_file_versions = (function frontend$handler$file_sync$_LT_fetch_page_file_versions(graph_uuid,page){
cljs.core.PersistentVector.EMPTY;

var file_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","file","block/file",183171933).cljs$core$IFn$_invoke$arity$1(page));
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_118270){
var state_val_118271 = (state_118270[(1)]);
if((state_val_118271 === (1))){
var inst_118251 = (state_118270[(7)]);
var inst_118250 = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(file_id) : frontend.db.entity.call(null,file_id));
var inst_118251__$1 = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(inst_118250);
var state_118270__$1 = (function (){var statearr_118274 = state_118270;
(statearr_118274[(7)] = inst_118251__$1);

return statearr_118274;
})();
if(cljs.core.truth_(inst_118251__$1)){
var statearr_118276_118846 = state_118270__$1;
(statearr_118276_118846[(1)] = (2));

} else {
var statearr_118277_118847 = state_118270__$1;
(statearr_118277_118847[(1)] = (3));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118271 === (2))){
var inst_118251 = (state_118270[(7)]);
var inst_118254 = frontend.fs.sync._LT_get_remote_file_versions(frontend.fs.sync.remoteapi,graph_uuid,inst_118251);
var state_118270__$1 = state_118270;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_118270__$1,(5),inst_118254);
} else {
if((state_val_118271 === (3))){
var state_118270__$1 = state_118270;
var statearr_118279_118856 = state_118270__$1;
(statearr_118279_118856[(2)] = null);

(statearr_118279_118856[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118271 === (4))){
var inst_118268 = (state_118270[(2)]);
var state_118270__$1 = state_118270;
return cljs.core.async.impl.ioc_helpers.return_chan(state_118270__$1,inst_118268);
} else {
if((state_val_118271 === (5))){
var inst_118258 = (state_118270[(2)]);
var inst_118259 = new cljs.core.Keyword(null,"VersionList","VersionList",-1189454538).cljs$core$IFn$_invoke$arity$1(inst_118258);
var inst_118260 = frontend.handler.file_sync._LT_list_file_local_versions(page);
var state_118270__$1 = (function (){var statearr_118283 = state_118270;
(statearr_118283[(8)] = inst_118259);

return statearr_118283;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_118270__$1,(6),inst_118260);
} else {
if((state_val_118271 === (6))){
var inst_118251 = (state_118270[(7)]);
var inst_118259 = (state_118270[(8)]);
var inst_118262 = (state_118270[(2)]);
var inst_118263 = (function (){var temp__5804__auto__ = inst_118251;
var path = inst_118251;
var version_list = inst_118259;
var local_version_list = inst_118262;
return (function (p1__118246_SHARP_){
var or__5002__auto__ = new cljs.core.Keyword(null,"CreateTime","CreateTime",462769722).cljs$core$IFn$_invoke$arity$1(p1__118246_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"create-time","create-time",875410581).cljs$core$IFn$_invoke$arity$1(p1__118246_SHARP_);
}
});
})();
var inst_118264 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(inst_118259,inst_118262);
var inst_118265 = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3(inst_118263,cljs.core._GT_,inst_118264);
var state_118270__$1 = state_118270;
var statearr_118286_118865 = state_118270__$1;
(statearr_118286_118865[(2)] = inst_118265);

(statearr_118286_118865[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
});
return (function() {
var frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32004__auto__ = null;
var frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32004__auto____0 = (function (){
var statearr_118287 = [null,null,null,null,null,null,null,null,null];
(statearr_118287[(0)] = frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32004__auto__);

(statearr_118287[(1)] = (1));

return statearr_118287;
});
var frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32004__auto____1 = (function (state_118270){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_118270);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e118288){var ex__32007__auto__ = e118288;
var statearr_118289_118868 = state_118270;
(statearr_118289_118868[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_118270[(4)]))){
var statearr_118290_118869 = state_118270;
(statearr_118290_118869[(1)] = cljs.core.first((state_118270[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__118870 = state_118270;
state_118270 = G__118870;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32004__auto__ = function(state_118270){
switch(arguments.length){
case 0:
return frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32004__auto____1.call(this,state_118270);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32004__auto____0;
frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32004__auto____1;
return frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_118294 = f__32196__auto__();
(statearr_118294[(6)] = c__32195__auto__);

return statearr_118294;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
frontend.handler.file_sync.init_remote_graph = (function frontend$handler$file_sync$init_remote_graph(local_graph_dir,graph){
if(cljs.core.truth_((function (){var and__5000__auto__ = local_graph_dir;
if(cljs.core.truth_(and__5000__auto__)){
return graph;
} else {
return and__5000__auto__;
}
})())){
frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(["Start syncing the remote graph ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"GraphName","GraphName",-960661337).cljs$core$IFn$_invoke$arity$1(graph))," to ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(frontend.config.get_string_repo_dir(local_graph_dir))].join(''),new cljs.core.Keyword(null,"success","success",1890645906));

frontend.handler.file_sync.init_graph(new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531).cljs$core$IFn$_invoke$arity$1(graph));

return frontend.state.close_modal_BANG_();
} else {
return null;
}
});
frontend.handler.file_sync.setup_file_sync_event_listeners = (function frontend$handler$file_sync$setup_file_sync_event_listeners(){
var c = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
var p = frontend.pubsub.sync_events_pub;
var topics = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"finished-local->remote","finished-local->remote",2118586037),new cljs.core.Keyword(null,"finished-remote->local","finished-remote->local",1594006010),new cljs.core.Keyword(null,"start","start",-355208981)], null);
var seq__118304_118874 = cljs.core.seq(topics);
var chunk__118305_118875 = null;
var count__118306_118876 = (0);
var i__118307_118877 = (0);
while(true){
if((i__118307_118877 < count__118306_118876)){
var topic_118878 = chunk__118305_118875.cljs$core$IIndexed$_nth$arity$2(null,i__118307_118877);
cljs.core.async.sub.cljs$core$IFn$_invoke$arity$3(p,topic_118878,c);


var G__118879 = seq__118304_118874;
var G__118880 = chunk__118305_118875;
var G__118881 = count__118306_118876;
var G__118882 = (i__118307_118877 + (1));
seq__118304_118874 = G__118879;
chunk__118305_118875 = G__118880;
count__118306_118876 = G__118881;
i__118307_118877 = G__118882;
continue;
} else {
var temp__5804__auto___118883 = cljs.core.seq(seq__118304_118874);
if(temp__5804__auto___118883){
var seq__118304_118885__$1 = temp__5804__auto___118883;
if(cljs.core.chunked_seq_QMARK_(seq__118304_118885__$1)){
var c__5525__auto___118886 = cljs.core.chunk_first(seq__118304_118885__$1);
var G__118887 = cljs.core.chunk_rest(seq__118304_118885__$1);
var G__118888 = c__5525__auto___118886;
var G__118889 = cljs.core.count(c__5525__auto___118886);
var G__118890 = (0);
seq__118304_118874 = G__118887;
chunk__118305_118875 = G__118888;
count__118306_118876 = G__118889;
i__118307_118877 = G__118890;
continue;
} else {
var topic_118891 = cljs.core.first(seq__118304_118885__$1);
cljs.core.async.sub.cljs$core$IFn$_invoke$arity$3(p,topic_118891,c);


var G__118892 = cljs.core.next(seq__118304_118885__$1);
var G__118893 = null;
var G__118894 = (0);
var G__118895 = (0);
seq__118304_118874 = G__118892;
chunk__118305_118875 = G__118893;
count__118306_118876 = G__118894;
i__118307_118877 = G__118895;
continue;
}
} else {
}
}
break;
}

var c__32195__auto___118896 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_118372){
var state_val_118373 = (state_118372[(1)]);
if((state_val_118373 === (7))){
var inst_118318 = (state_118372[(7)]);
var inst_118317 = (state_118372[(8)]);
var inst_118316 = (state_118372[(9)]);
var inst_118320 = frontend.state.clear_file_sync_progress_BANG_(inst_118318);
var inst_118321 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_118322 = [new cljs.core.Keyword("file-sync","graph-state","file-sync/graph-state",-1768817840),inst_118318,new cljs.core.Keyword("file-sync","last-synced-at","file-sync/last-synced-at",1623190259)];
var inst_118323 = (new cljs.core.PersistentVector(null,3,(5),inst_118321,inst_118322,null));
var inst_118324 = new cljs.core.Keyword(null,"epoch","epoch",1435633666).cljs$core$IFn$_invoke$arity$1(inst_118317);
var inst_118325 = frontend.state.set_state_BANG_(inst_118323,inst_118324);
var inst_118326 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_118316,new cljs.core.Keyword(null,"finished-local->remote","finished-local->remote",2118586037));
var state_118372__$1 = (function (){var statearr_118379 = state_118372;
(statearr_118379[(10)] = inst_118320);

(statearr_118379[(11)] = inst_118325);

return statearr_118379;
})();
if(inst_118326){
var statearr_118380_118899 = state_118372__$1;
(statearr_118380_118899[(1)] = (10));

} else {
var statearr_118382_118900 = state_118372__$1;
(statearr_118382_118900[(1)] = (11));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (20))){
var inst_118358 = (state_118372[(2)]);
var state_118372__$1 = state_118372;
if(cljs.core.truth_(inst_118358)){
var statearr_118384_118905 = state_118372__$1;
(statearr_118384_118905[(1)] = (21));

} else {
var statearr_118385_118906 = state_118372__$1;
(statearr_118385_118906[(1)] = (22));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (1))){
var state_118372__$1 = state_118372;
var statearr_118388_118911 = state_118372__$1;
(statearr_118388_118911[(2)] = null);

(statearr_118388_118911[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (4))){
var inst_118316 = (state_118372[(9)]);
var inst_118312 = (state_118372[(2)]);
var inst_118313 = cljs.core.__destructure_map(inst_118312);
var inst_118316__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_118313,new cljs.core.Keyword(null,"event","event",301435442));
var inst_118317 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_118313,new cljs.core.Keyword(null,"data","data",-232669377));
var state_118372__$1 = (function (){var statearr_118397 = state_118372;
(statearr_118397[(9)] = inst_118316__$1);

(statearr_118397[(8)] = inst_118317);

return statearr_118397;
})();
var G__118400_118914 = inst_118316__$1;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"list","list",-1889078086,null),G__118400_118914)){
var statearr_118404_118915 = state_118372__$1;
(statearr_118404_118915[(1)] = (6));

} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"finished-local->remote","finished-local->remote",2118586037),G__118400_118914)){
var statearr_118406_118918 = state_118372__$1;
(statearr_118406_118918[(1)] = (6));

} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"finished-remote->local","finished-remote->local",1594006010),G__118400_118914)){
var statearr_118407_118919 = state_118372__$1;
(statearr_118407_118919[(1)] = (6));

} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"start","start",-355208981),G__118400_118914)){
var statearr_118408_118921 = state_118372__$1;
(statearr_118408_118921[(1)] = (13));

} else {
var statearr_118409_118924 = state_118372__$1;
(statearr_118409_118924[(1)] = (17));



}
}
}
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (15))){
var state_118372__$1 = state_118372;
var statearr_118410_118925 = state_118372__$1;
(statearr_118410_118925[(2)] = null);

(statearr_118410_118925[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (21))){
var inst_118360 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_118361 = [new cljs.core.Keyword("file-sync","maybe-onboarding-show","file-sync/maybe-onboarding-show",1562674517),new cljs.core.Keyword(null,"sync-history","sync-history",1914466991)];
var inst_118362 = (new cljs.core.PersistentVector(null,2,(5),inst_118360,inst_118361,null));
var inst_118363 = frontend.state.pub_event_BANG_(inst_118362);
var state_118372__$1 = state_118372;
var statearr_118412_118926 = state_118372__$1;
(statearr_118412_118926[(2)] = inst_118363);

(statearr_118412_118926[(1)] = (23));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (13))){
var inst_118336 = (state_118372[(12)]);
var inst_118336__$1 = frontend.state.get_current_file_sync_graph_uuid();
var state_118372__$1 = (function (){var statearr_118413 = state_118372;
(statearr_118413[(12)] = inst_118336__$1);

return statearr_118413;
})();
if(cljs.core.truth_(inst_118336__$1)){
var statearr_118414_118928 = state_118372__$1;
(statearr_118414_118928[(1)] = (14));

} else {
var statearr_118415_118929 = state_118372__$1;
(statearr_118415_118929[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (22))){
var state_118372__$1 = state_118372;
var statearr_118418_118930 = state_118372__$1;
(statearr_118418_118930[(2)] = null);

(statearr_118418_118930[(1)] = (23));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (6))){
var inst_118318 = (state_118372[(7)]);
var inst_118318__$1 = frontend.state.get_current_file_sync_graph_uuid();
var state_118372__$1 = (function (){var statearr_118425 = state_118372;
(statearr_118425[(7)] = inst_118318__$1);

return statearr_118425;
})();
if(cljs.core.truth_(inst_118318__$1)){
var statearr_118426_118933 = state_118372__$1;
(statearr_118426_118933[(1)] = (7));

} else {
var statearr_118429_118934 = state_118372__$1;
(statearr_118429_118934[(1)] = (8));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (17))){
var state_118372__$1 = state_118372;
var statearr_118432_118937 = state_118372__$1;
(statearr_118432_118937[(2)] = null);

(statearr_118432_118937[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (3))){
var inst_118369 = (state_118372[(2)]);
var state_118372__$1 = state_118372;
return cljs.core.async.impl.ioc_helpers.return_chan(state_118372__$1,inst_118369);
} else {
if((state_val_118373 === (12))){
var inst_118331 = (state_118372[(2)]);
var state_118372__$1 = state_118372;
var statearr_118436_118940 = state_118372__$1;
(statearr_118436_118940[(2)] = inst_118331);

(statearr_118436_118940[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (2))){
var state_118372__$1 = state_118372;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_118372__$1,(4),c);
} else {
if((state_val_118373 === (23))){
var inst_118366 = (state_118372[(2)]);
var state_118372__$1 = (function (){var statearr_118437 = state_118372;
(statearr_118437[(13)] = inst_118366);

return statearr_118437;
})();
var statearr_118438_118942 = state_118372__$1;
(statearr_118438_118942[(2)] = null);

(statearr_118438_118942[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (19))){
var inst_118351 = (state_118372[(14)]);
var state_118372__$1 = state_118372;
var statearr_118441_118943 = state_118372__$1;
(statearr_118441_118943[(2)] = inst_118351);

(statearr_118441_118943[(1)] = (20));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (11))){
var state_118372__$1 = state_118372;
var statearr_118444_118946 = state_118372__$1;
(statearr_118444_118946[(2)] = null);

(statearr_118444_118946[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (9))){
var inst_118334 = (state_118372[(2)]);
var state_118372__$1 = state_118372;
var statearr_118447_118948 = state_118372__$1;
(statearr_118447_118948[(2)] = inst_118334);

(statearr_118447_118948[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (5))){
var inst_118317 = (state_118372[(8)]);
var inst_118351 = (state_118372[(14)]);
var inst_118350 = (state_118372[(2)]);
var inst_118351__$1 = new cljs.core.Keyword(null,"file-change-events","file-change-events",1473966069).cljs$core$IFn$_invoke$arity$1(inst_118317);
var state_118372__$1 = (function (){var statearr_118448 = state_118372;
(statearr_118448[(15)] = inst_118350);

(statearr_118448[(14)] = inst_118351__$1);

return statearr_118448;
})();
if(cljs.core.truth_(inst_118351__$1)){
var statearr_118449_118950 = state_118372__$1;
(statearr_118449_118950[(1)] = (18));

} else {
var statearr_118453_118951 = state_118372__$1;
(statearr_118453_118951[(1)] = (19));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (14))){
var inst_118336 = (state_118372[(12)]);
var inst_118317 = (state_118372[(8)]);
var inst_118340 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_118341 = [new cljs.core.Keyword("file-sync","graph-state","file-sync/graph-state",-1768817840),inst_118336,new cljs.core.Keyword("file-sync","start-time","file-sync/start-time",-882469306)];
var inst_118342 = (new cljs.core.PersistentVector(null,3,(5),inst_118340,inst_118341,null));
var inst_118343 = frontend.state.set_state_BANG_(inst_118342,inst_118317);
var state_118372__$1 = state_118372;
var statearr_118459_118957 = state_118372__$1;
(statearr_118459_118957[(2)] = inst_118343);

(statearr_118459_118957[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (16))){
var inst_118346 = (state_118372[(2)]);
var state_118372__$1 = state_118372;
var statearr_118466_118959 = state_118372__$1;
(statearr_118466_118959[(2)] = inst_118346);

(statearr_118466_118959[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (10))){
var inst_118328 = cljs.core.async.offer_BANG_(frontend.fs.sync.finished_local__GT_remote_chan,true);
var state_118372__$1 = state_118372;
var statearr_118473_118961 = state_118372__$1;
(statearr_118473_118961[(2)] = inst_118328);

(statearr_118473_118961[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (18))){
var inst_118354 = frontend.state.get_current_route();
var inst_118355 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page","page",849072397),inst_118354);
var state_118372__$1 = state_118372;
var statearr_118477_118964 = state_118372__$1;
(statearr_118477_118964[(2)] = inst_118355);

(statearr_118477_118964[(1)] = (20));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_118373 === (8))){
var state_118372__$1 = state_118372;
var statearr_118480_118966 = state_118372__$1;
(statearr_118480_118966[(2)] = null);

(statearr_118480_118966[(1)] = (9));


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
});
return (function() {
var frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32004__auto__ = null;
var frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32004__auto____0 = (function (){
var statearr_118485 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_118485[(0)] = frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32004__auto__);

(statearr_118485[(1)] = (1));

return statearr_118485;
});
var frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32004__auto____1 = (function (state_118372){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_118372);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e118493){var ex__32007__auto__ = e118493;
var statearr_118494_118969 = state_118372;
(statearr_118494_118969[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_118372[(4)]))){
var statearr_118497_118971 = state_118372;
(statearr_118497_118971[(1)] = cljs.core.first((state_118372[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__118974 = state_118372;
state_118372 = G__118974;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32004__auto__ = function(state_118372){
switch(arguments.length){
case 0:
return frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32004__auto____1.call(this,state_118372);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32004__auto____0;
frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32004__auto____1;
return frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_118501 = f__32196__auto__();
(statearr_118501[(6)] = c__32195__auto___118896);

return statearr_118501;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));


return (function (){
var seq__118503 = cljs.core.seq(topics);
var chunk__118504 = null;
var count__118505 = (0);
var i__118506 = (0);
while(true){
if((i__118506 < count__118505)){
var topic = chunk__118504.cljs$core$IIndexed$_nth$arity$2(null,i__118506);
cljs.core.async.unsub(p,topic,c);


var G__118978 = seq__118503;
var G__118979 = chunk__118504;
var G__118980 = count__118505;
var G__118981 = (i__118506 + (1));
seq__118503 = G__118978;
chunk__118504 = G__118979;
count__118505 = G__118980;
i__118506 = G__118981;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__118503);
if(temp__5804__auto__){
var seq__118503__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__118503__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__118503__$1);
var G__118982 = cljs.core.chunk_rest(seq__118503__$1);
var G__118983 = c__5525__auto__;
var G__118984 = cljs.core.count(c__5525__auto__);
var G__118985 = (0);
seq__118503 = G__118982;
chunk__118504 = G__118983;
count__118505 = G__118984;
i__118506 = G__118985;
continue;
} else {
var topic = cljs.core.first(seq__118503__$1);
cljs.core.async.unsub(p,topic,c);


var G__118987 = cljs.core.next(seq__118503__$1);
var G__118988 = null;
var G__118989 = (0);
var G__118990 = (0);
seq__118503 = G__118987;
chunk__118504 = G__118988;
count__118505 = G__118989;
i__118506 = G__118990;
continue;
}
} else {
return null;
}
}
break;
}
});
});
frontend.handler.file_sync.reset_user_state_BANG_ = (function frontend$handler$file_sync$reset_user_state_BANG_(){
cljs.core.vreset_BANG_(frontend.handler.file_sync._STAR_beta_unavailable_QMARK_,false);

return frontend.state.set_state_BANG_(new cljs.core.Keyword("file-sync","onboarding-state","file-sync/onboarding-state",-864081833),null);
});
/**
 * This assumes that the network speed is stable which could be wrong sometimes.
 */
frontend.handler.file_sync.calculate_time_left = (function frontend$handler$file_sync$calculate_time_left(sync_state,progressing){
var temp__5804__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.state.state),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","graph-state","file-sync/graph-state",-1768817840),frontend.state.get_current_file_sync_graph_uuid(),new cljs.core.Keyword("file-sync","start-time","file-sync/start-time",-882469306),new cljs.core.Keyword(null,"epoch","epoch",1435633666)], null));
if(cljs.core.truth_(temp__5804__auto__)){
var start_time = temp__5804__auto__;
var now = cljs_time.coerce.to_epoch(cljs_time.core.now());
var diff_seconds = (now - start_time);
var finished = cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core._PLUS_,cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.comp.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"progress","progress",244323547),cljs.core.second),progressing));
var local__GT_remote_files = new cljs.core.Keyword(null,"full-local->remote-files","full-local->remote-files",224642435).cljs$core$IFn$_invoke$arity$1(sync_state);
var remote__GT_local_files = new cljs.core.Keyword(null,"full-remote->local-files","full-remote->local-files",1421172401).cljs$core$IFn$_invoke$arity$1(sync_state);
var total = ((cljs.core.seq(remote__GT_local_files))?cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core._PLUS_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (m){
var or__5002__auto__ = new cljs.core.Keyword(null,"size","size",1098693007).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
}),remote__GT_local_files)):cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core._PLUS_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__118518_SHARP_){
return new cljs.core.Keyword(null,"size","size",1098693007).cljs$core$IFn$_invoke$arity$1(p1__118518_SHARP_.stat);
}),local__GT_remote_files)));
var mins = ((((total / finished) * diff_seconds) / (60)) | (0));
if((((total === (0))) || ((finished === (0))))){
return "waiting";
} else {
if((mins === (0))){
return "soon";
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mins,(1))){
return "1 min left";
} else {
if((mins > (30))){
return "calculating...";
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(mins)," mins left"].join('');

}
}
}
}
} else {
return null;
}
});
frontend.handler.file_sync.set_sync_enabled_BANG_ = (function frontend$handler$file_sync$set_sync_enabled_BANG_(value){
frontend.storage.set(new cljs.core.Keyword(null,"logseq-sync-enabled","logseq-sync-enabled",-1886165044),value);

return frontend.state.set_state_BANG_(new cljs.core.Keyword("feature","enable-sync?","feature/enable-sync?",-817494751),value);
});
frontend.handler.file_sync.set_sync_diff_merge_enabled_BANG_ = (function frontend$handler$file_sync$set_sync_diff_merge_enabled_BANG_(value){
frontend.storage.set(new cljs.core.Keyword(null,"logseq-sync-diff-merge-enabled","logseq-sync-diff-merge-enabled",-846633784),value);

return frontend.state.set_state_BANG_(new cljs.core.Keyword("feature","enable-sync-diff-merge?","feature/enable-sync-diff-merge?",-2042896608),value);
});

//# sourceMappingURL=frontend.handler.file_sync.js.map
