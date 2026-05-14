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
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_86661){
var state_val_86662 = (state_86661[(1)]);
if((state_val_86662 === (7))){
var inst_86588 = (state_86661[(7)]);
var state_86661__$1 = state_86661;
var statearr_86663_87295 = state_86661__$1;
(statearr_86663_87295[(2)] = inst_86588);

(statearr_86663_87295[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (20))){
var inst_86624 = (state_86661[(8)]);
var state_86661__$1 = state_86661;
var statearr_86664_87296 = state_86661__$1;
(statearr_86664_87296[(2)] = inst_86624);

(statearr_86664_87296[(1)] = (22));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (27))){
var state_86661__$1 = state_86661;
var statearr_86665_87297 = state_86661__$1;
(statearr_86665_87297[(1)] = (29));



return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (1))){
var inst_86583 = frontend.fs.sync._LT_create_graph(frontend.fs.sync.remoteapi,name);
var state_86661__$1 = state_86661;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_86661__$1,(2),inst_86583);
} else {
if((state_val_86662 === (24))){
var inst_86599 = (state_86661[(9)]);
var inst_86632 = [(404),null,(400),null];
var inst_86633 = (new cljs.core.PersistentArrayMap(null,2,inst_86632,null));
var inst_86634 = (new cljs.core.PersistentHashSet(null,inst_86633,null));
var inst_86635 = cljs.core.ex_data(inst_86599);
var inst_86636 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_86637 = [new cljs.core.Keyword(null,"err","err",-2089457205),new cljs.core.Keyword(null,"status","status",-1997798413)];
var inst_86638 = (new cljs.core.PersistentVector(null,2,(5),inst_86636,inst_86637,null));
var inst_86639 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(inst_86635,inst_86638);
var inst_86640 = cljs.core.contains_QMARK_(inst_86634,inst_86639);
var state_86661__$1 = state_86661;
if(inst_86640){
var statearr_86667_87298 = state_86661__$1;
(statearr_86667_87298[(1)] = (26));

} else {
var statearr_86668_87299 = state_86661__$1;
(statearr_86668_87299[(1)] = (27));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (4))){
var inst_86585 = (state_86661[(10)]);
var state_86661__$1 = state_86661;
var statearr_86669_87302 = state_86661__$1;
(statearr_86669_87302[(2)] = inst_86585);

(statearr_86669_87302[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (15))){
var inst_86609 = (state_86661[(2)]);
var state_86661__$1 = state_86661;
if(cljs.core.truth_(inst_86609)){
var statearr_86670_87303 = state_86661__$1;
(statearr_86670_87303[(1)] = (16));

} else {
var statearr_86671_87304 = state_86661__$1;
(statearr_86671_87304[(1)] = (17));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (21))){
var inst_86599 = (state_86661[(9)]);
var inst_86627 = frontend.fs.sync.graph_count_exceed_limit_QMARK_(inst_86599);
var state_86661__$1 = state_86661;
var statearr_86672_87305 = state_86661__$1;
(statearr_86672_87305[(2)] = inst_86627);

(statearr_86672_87305[(1)] = (22));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (31))){
var inst_86651 = (state_86661[(2)]);
var state_86661__$1 = state_86661;
var statearr_86673_87306 = state_86661__$1;
(statearr_86673_87306[(2)] = inst_86651);

(statearr_86673_87306[(1)] = (28));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (13))){
var inst_86599 = (state_86661[(9)]);
var inst_86606 = typeof inst_86599 === 'string';
var state_86661__$1 = state_86661;
var statearr_86674_87307 = state_86661__$1;
(statearr_86674_87307[(2)] = inst_86606);

(statearr_86674_87307[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (22))){
var inst_86629 = (state_86661[(2)]);
var state_86661__$1 = state_86661;
if(cljs.core.truth_(inst_86629)){
var statearr_86675_87308 = state_86661__$1;
(statearr_86675_87308[(1)] = (23));

} else {
var statearr_86676_87309 = state_86661__$1;
(statearr_86676_87309[(1)] = (24));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (29))){
var inst_86599 = (state_86661[(9)]);
var inst_86646 = cljs.core.ex_message(inst_86599);
var inst_86647 = ["Create graph failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(inst_86646)].join('');
var inst_86648 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$6(inst_86647,new cljs.core.Keyword(null,"warning","warning",-1685650671),true,null,(4000),null);
var state_86661__$1 = state_86661;
var statearr_86677_87310 = state_86661__$1;
(statearr_86677_87310[(2)] = inst_86648);

(statearr_86677_87310[(1)] = (31));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (6))){
var inst_86588 = (state_86661[(7)]);
var inst_86599 = (state_86661[(2)]);
var inst_86600 = (inst_86588 instanceof cljs.core.ExceptionInfo);
var state_86661__$1 = (function (){var statearr_86678 = state_86661;
(statearr_86678[(9)] = inst_86599);

return statearr_86678;
})();
if(cljs.core.truth_(inst_86600)){
var statearr_86679_87311 = state_86661__$1;
(statearr_86679_87311[(1)] = (10));

} else {
var statearr_86680_87312 = state_86661__$1;
(statearr_86680_87312[(1)] = (11));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (28))){
var inst_86653 = (state_86661[(2)]);
var state_86661__$1 = state_86661;
var statearr_86681_87313 = state_86661__$1;
(statearr_86681_87313[(2)] = inst_86653);

(statearr_86681_87313[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (25))){
var inst_86655 = (state_86661[(2)]);
var state_86661__$1 = state_86661;
var statearr_86684_87314 = state_86661__$1;
(statearr_86684_87314[(2)] = inst_86655);

(statearr_86684_87314[(1)] = (18));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (17))){
var inst_86599 = (state_86661[(9)]);
var inst_86624 = (state_86661[(8)]);
var inst_86620 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_86621 = [new cljs.core.Keyword("ui","loading?","ui/loading?",1905710757),new cljs.core.Keyword("graph","create-remote?","graph/create-remote?",-1583424902)];
var inst_86622 = (new cljs.core.PersistentVector(null,2,(5),inst_86620,inst_86621,null));
var inst_86623 = frontend.state.set_state_BANG_(inst_86622,false);
var inst_86624__$1 = frontend.fs.sync.storage_exceed_limit_QMARK_(inst_86599);
var state_86661__$1 = (function (){var statearr_86686 = state_86661;
(statearr_86686[(11)] = inst_86623);

(statearr_86686[(8)] = inst_86624__$1);

return statearr_86686;
})();
if(cljs.core.truth_(inst_86624__$1)){
var statearr_86687_87315 = state_86661__$1;
(statearr_86687_87315[(1)] = (20));

} else {
var statearr_86689_87316 = state_86661__$1;
(statearr_86689_87316[(1)] = (21));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (3))){
var inst_86585 = (state_86661[(10)]);
var inst_86588 = (state_86661[(2)]);
var inst_86589 = (inst_86585 instanceof cljs.core.ExceptionInfo);
var state_86661__$1 = (function (){var statearr_86690 = state_86661;
(statearr_86690[(7)] = inst_86588);

return statearr_86690;
})();
if(cljs.core.truth_(inst_86589)){
var statearr_86692_87317 = state_86661__$1;
(statearr_86692_87317[(1)] = (4));

} else {
var statearr_86694_87318 = state_86661__$1;
(statearr_86694_87318[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (12))){
var inst_86659 = (state_86661[(2)]);
var state_86661__$1 = state_86661;
return cljs.core.async.impl.ioc_helpers.return_chan(state_86661__$1,inst_86659);
} else {
if((state_val_86662 === (2))){
var inst_86585 = (state_86661[(2)]);
var inst_86586 = frontend.handler.user._LT_user_uuid();
var state_86661__$1 = (function (){var statearr_86696 = state_86661;
(statearr_86696[(10)] = inst_86585);

return statearr_86696;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_86661__$1,(3),inst_86586);
} else {
if((state_val_86662 === (23))){
var state_86661__$1 = state_86661;
var statearr_86697_87319 = state_86661__$1;
(statearr_86697_87319[(2)] = null);

(statearr_86697_87319[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (19))){
var inst_86614 = (state_86661[(12)]);
var inst_86617 = (state_86661[(2)]);
var inst_86618 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.handler.file_sync.refresh_file_sync_component,cljs.core.not);
var state_86661__$1 = (function (){var statearr_86699 = state_86661;
(statearr_86699[(13)] = inst_86617);

(statearr_86699[(14)] = inst_86618);

return statearr_86699;
})();
var statearr_86700_87324 = state_86661__$1;
(statearr_86700_87324[(2)] = inst_86614);

(statearr_86700_87324[(1)] = (18));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (11))){
var inst_86599 = (state_86661[(9)]);
var inst_86604 = (state_86661[(15)]);
var inst_86603 = (inst_86599 instanceof cljs.core.ExceptionInfo);
var inst_86604__$1 = cljs.core.not(inst_86603);
var state_86661__$1 = (function (){var statearr_86703 = state_86661;
(statearr_86703[(15)] = inst_86604__$1);

return statearr_86703;
})();
if(inst_86604__$1){
var statearr_86704_87325 = state_86661__$1;
(statearr_86704_87325[(1)] = (13));

} else {
var statearr_86705_87326 = state_86661__$1;
(statearr_86705_87326[(1)] = (14));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (9))){
var inst_86597 = (state_86661[(2)]);
var state_86661__$1 = state_86661;
var statearr_86708_87327 = state_86661__$1;
(statearr_86708_87327[(2)] = inst_86597);

(statearr_86708_87327[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (5))){
var inst_86588 = (state_86661[(7)]);
var inst_86592 = (inst_86588 instanceof cljs.core.ExceptionInfo);
var state_86661__$1 = state_86661;
if(cljs.core.truth_(inst_86592)){
var statearr_86711_87328 = state_86661__$1;
(statearr_86711_87328[(1)] = (7));

} else {
var statearr_86712_87329 = state_86661__$1;
(statearr_86712_87329[(1)] = (8));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (14))){
var inst_86604 = (state_86661[(15)]);
var state_86661__$1 = state_86661;
var statearr_86714_87330 = state_86661__$1;
(statearr_86714_87330[(2)] = inst_86604);

(statearr_86714_87330[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (26))){
var inst_86642 = ["Create graph failed: already existed graph: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(name)].join('');
var inst_86643 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$6(inst_86642,new cljs.core.Keyword(null,"warning","warning",-1685650671),true,null,(4000),null);
var state_86661__$1 = state_86661;
var statearr_86718_87331 = state_86661__$1;
(statearr_86718_87331[(2)] = inst_86643);

(statearr_86718_87331[(1)] = (28));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (16))){
var inst_86599 = (state_86661[(9)]);
var inst_86588 = (state_86661[(7)]);
var inst_86614 = (state_86661[(12)]);
var inst_86611 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_86612 = frontend.state.get_current_repo();
var inst_86613 = [(0),inst_86599,inst_86588,inst_86612];
var inst_86614__$1 = (new cljs.core.PersistentVector(null,4,(5),inst_86611,inst_86613,null));
var inst_86615 = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(frontend.fs.sync._LT_update_graphs_txid_BANG_,inst_86614__$1);
var state_86661__$1 = (function (){var statearr_86721 = state_86661;
(statearr_86721[(12)] = inst_86614__$1);

return statearr_86721;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_86661__$1,(19),inst_86615);
} else {
if((state_val_86662 === (30))){
var state_86661__$1 = state_86661;
var statearr_86726_87334 = state_86661__$1;
(statearr_86726_87334[(2)] = null);

(statearr_86726_87334[(1)] = (31));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (10))){
var state_86661__$1 = state_86661;
var statearr_86728_87335 = state_86661__$1;
(statearr_86728_87335[(2)] = null);

(statearr_86728_87335[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (18))){
var inst_86657 = (state_86661[(2)]);
var state_86661__$1 = state_86661;
var statearr_86729_87336 = state_86661__$1;
(statearr_86729_87336[(2)] = inst_86657);

(statearr_86729_87336[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86662 === (8))){
var inst_86585 = (state_86661[(10)]);
var inst_86595 = new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531).cljs$core$IFn$_invoke$arity$1(inst_86585);
var state_86661__$1 = state_86661;
var statearr_86730_87338 = state_86661__$1;
(statearr_86730_87338[(2)] = inst_86595);

(statearr_86730_87338[(1)] = (9));


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
var frontend$handler$file_sync$create_graph_$_state_machine__32051__auto__ = null;
var frontend$handler$file_sync$create_graph_$_state_machine__32051__auto____0 = (function (){
var statearr_86732 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_86732[(0)] = frontend$handler$file_sync$create_graph_$_state_machine__32051__auto__);

(statearr_86732[(1)] = (1));

return statearr_86732;
});
var frontend$handler$file_sync$create_graph_$_state_machine__32051__auto____1 = (function (state_86661){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_86661);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e86734){var ex__32054__auto__ = e86734;
var statearr_86736_87342 = state_86661;
(statearr_86736_87342[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_86661[(4)]))){
var statearr_86738_87343 = state_86661;
(statearr_86738_87343[(1)] = cljs.core.first((state_86661[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__87344 = state_86661;
state_86661 = G__87344;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$file_sync$create_graph_$_state_machine__32051__auto__ = function(state_86661){
switch(arguments.length){
case 0:
return frontend$handler$file_sync$create_graph_$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$file_sync$create_graph_$_state_machine__32051__auto____1.call(this,state_86661);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_sync$create_graph_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_sync$create_graph_$_state_machine__32051__auto____0;
frontend$handler$file_sync$create_graph_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_sync$create_graph_$_state_machine__32051__auto____1;
return frontend$handler$file_sync$create_graph_$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_86742 = f__32125__auto__();
(statearr_86742[(6)] = c__32124__auto__);

return statearr_86742;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
});
frontend.handler.file_sync._LT_delete_graph = (function frontend$handler$file_sync$_LT_delete_graph(graph_uuid){
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_86788){
var state_val_86789 = (state_86788[(1)]);
if((state_val_86789 === (7))){
var inst_86774 = ["Delete graph failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(graph_uuid)].join('');
var inst_86775 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(inst_86774,new cljs.core.Keyword(null,"warning","warning",-1685650671));
var state_86788__$1 = state_86788;
var statearr_86796_87352 = state_86788__$1;
(statearr_86796_87352[(2)] = inst_86775);

(statearr_86796_87352[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86789 === (1))){
var inst_86749 = (state_86788[(7)]);
var inst_86748 = frontend.handler.file_sync.get_current_graph_uuid();
var inst_86749__$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(graph_uuid,inst_86748);
var state_86788__$1 = (function (){var statearr_86800 = state_86788;
(statearr_86800[(7)] = inst_86749__$1);

return statearr_86800;
})();
if(inst_86749__$1){
var statearr_86801_87353 = state_86788__$1;
(statearr_86801_87353[(1)] = (2));

} else {
var statearr_86803_87354 = state_86788__$1;
(statearr_86803_87354[(1)] = (3));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86789 === (4))){
var inst_86766 = (state_86788[(2)]);
var inst_86767 = frontend.fs.sync._LT_delete_graph(frontend.fs.sync.remoteapi,graph_uuid);
var state_86788__$1 = (function (){var statearr_86806 = state_86788;
(statearr_86806[(8)] = inst_86766);

return statearr_86806;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_86788__$1,(6),inst_86767);
} else {
if((state_val_86789 === (6))){
var inst_86769 = (state_86788[(2)]);
var inst_86770 = (inst_86769 instanceof cljs.core.ExceptionInfo);
var state_86788__$1 = state_86788;
if(cljs.core.truth_(inst_86770)){
var statearr_86808_87358 = state_86788__$1;
(statearr_86808_87358[(1)] = (7));

} else {
var statearr_86810_87359 = state_86788__$1;
(statearr_86810_87359[(1)] = (8));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86789 === (3))){
var state_86788__$1 = state_86788;
var statearr_86811_87363 = state_86788__$1;
(statearr_86811_87363[(2)] = null);

(statearr_86811_87363[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86789 === (12))){
var inst_86782 = (state_86788[(2)]);
var inst_86783 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("Graph deleted",new cljs.core.Keyword(null,"success","success",1890645906));
var state_86788__$1 = (function (){var statearr_86814 = state_86788;
(statearr_86814[(9)] = inst_86782);

return statearr_86814;
})();
var statearr_86815_87364 = state_86788__$1;
(statearr_86815_87364[(2)] = inst_86783);

(statearr_86815_87364[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86789 === (2))){
var inst_86754 = frontend.fs.sync._LT_sync_stop();
var state_86788__$1 = state_86788;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_86788__$1,(5),inst_86754);
} else {
if((state_val_86789 === (11))){
var state_86788__$1 = state_86788;
var statearr_86819_87365 = state_86788__$1;
(statearr_86819_87365[(2)] = null);

(statearr_86819_87365[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86789 === (9))){
var inst_86785 = (state_86788[(2)]);
var state_86788__$1 = state_86788;
return cljs.core.async.impl.ioc_helpers.return_chan(state_86788__$1,inst_86785);
} else {
if((state_val_86789 === (5))){
var inst_86762 = (state_86788[(2)]);
var state_86788__$1 = state_86788;
var statearr_86821_87367 = state_86788__$1;
(statearr_86821_87367[(2)] = inst_86762);

(statearr_86821_87367[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86789 === (10))){
var inst_86778 = frontend.fs.sync.clear_graphs_txid_BANG_(graph_uuid);
var inst_86779 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.handler.file_sync.refresh_file_sync_component,cljs.core.not);
var state_86788__$1 = (function (){var statearr_86827 = state_86788;
(statearr_86827[(10)] = inst_86778);

return statearr_86827;
})();
var statearr_86828_87370 = state_86788__$1;
(statearr_86828_87370[(2)] = inst_86779);

(statearr_86828_87370[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86789 === (8))){
var inst_86749 = (state_86788[(7)]);
var state_86788__$1 = state_86788;
if(cljs.core.truth_(inst_86749)){
var statearr_86831_87374 = state_86788__$1;
(statearr_86831_87374[(1)] = (10));

} else {
var statearr_86832_87375 = state_86788__$1;
(statearr_86832_87375[(1)] = (11));

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
var frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32051__auto__ = null;
var frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32051__auto____0 = (function (){
var statearr_86833 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_86833[(0)] = frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32051__auto__);

(statearr_86833[(1)] = (1));

return statearr_86833;
});
var frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32051__auto____1 = (function (state_86788){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_86788);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e86835){var ex__32054__auto__ = e86835;
var statearr_86836_87377 = state_86788;
(statearr_86836_87377[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_86788[(4)]))){
var statearr_86838_87378 = state_86788;
(statearr_86838_87378[(1)] = cljs.core.first((state_86788[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__87379 = state_86788;
state_86788 = G__87379;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32051__auto__ = function(state_86788){
switch(arguments.length){
case 0:
return frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32051__auto____1.call(this,state_86788);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32051__auto____0;
frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32051__auto____1;
return frontend$handler$file_sync$_LT_delete_graph_$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_86844 = f__32125__auto__();
(statearr_86844[(6)] = c__32124__auto__);

return statearr_86844;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
});
frontend.handler.file_sync._LT_list_graphs = (function frontend$handler$file_sync$_LT_list_graphs(){
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_86860){
var state_val_86861 = (state_86860[(1)]);
if((state_val_86861 === (1))){
var inst_86848 = frontend.fs.sync._LT_list_remote_graphs(frontend.fs.sync.remoteapi);
var state_86860__$1 = state_86860;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_86860__$1,(2),inst_86848);
} else {
if((state_val_86861 === (2))){
var inst_86851 = (state_86860[(7)]);
var inst_86851__$1 = (state_86860[(2)]);
var inst_86852 = (inst_86851__$1 instanceof cljs.core.ExceptionInfo);
var state_86860__$1 = (function (){var statearr_86871 = state_86860;
(statearr_86871[(7)] = inst_86851__$1);

return statearr_86871;
})();
if(cljs.core.truth_(inst_86852)){
var statearr_86872_87381 = state_86860__$1;
(statearr_86872_87381[(1)] = (3));

} else {
var statearr_86874_87382 = state_86860__$1;
(statearr_86874_87382[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86861 === (3))){
var inst_86851 = (state_86860[(7)]);
var state_86860__$1 = state_86860;
var statearr_86875_87383 = state_86860__$1;
(statearr_86875_87383[(2)] = inst_86851);

(statearr_86875_87383[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86861 === (4))){
var inst_86851 = (state_86860[(7)]);
var inst_86855 = new cljs.core.Keyword(null,"Graphs","Graphs",296240865).cljs$core$IFn$_invoke$arity$1(inst_86851);
var state_86860__$1 = state_86860;
var statearr_86876_87384 = state_86860__$1;
(statearr_86876_87384[(2)] = inst_86855);

(statearr_86876_87384[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86861 === (5))){
var inst_86857 = (state_86860[(2)]);
var state_86860__$1 = state_86860;
return cljs.core.async.impl.ioc_helpers.return_chan(state_86860__$1,inst_86857);
} else {
return null;
}
}
}
}
}
});
return (function() {
var frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32051__auto__ = null;
var frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32051__auto____0 = (function (){
var statearr_86882 = [null,null,null,null,null,null,null,null];
(statearr_86882[(0)] = frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32051__auto__);

(statearr_86882[(1)] = (1));

return statearr_86882;
});
var frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32051__auto____1 = (function (state_86860){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_86860);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e86884){var ex__32054__auto__ = e86884;
var statearr_86887_87393 = state_86860;
(statearr_86887_87393[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_86860[(4)]))){
var statearr_86888_87394 = state_86860;
(statearr_86888_87394[(1)] = cljs.core.first((state_86860[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__87395 = state_86860;
state_86860 = G__87395;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32051__auto__ = function(state_86860){
switch(arguments.length){
case 0:
return frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32051__auto____1.call(this,state_86860);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32051__auto____0;
frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32051__auto____1;
return frontend$handler$file_sync$_LT_list_graphs_$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_86893 = f__32125__auto__();
(statearr_86893[(6)] = c__32124__auto__);

return statearr_86893;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
});
frontend.handler.file_sync.load_session_graphs = (function frontend$handler$file_sync$load_session_graphs(){
if(cljs.core.truth_(frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"loading","loading",-737050189)], null)))){
return null;
} else {
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_86922){
var state_val_86923 = (state_86922[(1)]);
if((state_val_86923 === (1))){
var state_86922__$1 = state_86922;
if(frontend.util.web_platform_QMARK_){
var statearr_86928_87396 = state_86922__$1;
(statearr_86928_87396[(1)] = (2));

} else {
var statearr_86930_87397 = state_86922__$1;
(statearr_86930_87397[(1)] = (3));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86923 === (2))){
var state_86922__$1 = state_86922;
var statearr_86933_87398 = state_86922__$1;
(statearr_86933_87398[(2)] = null);

(statearr_86933_87398[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86923 === (3))){
var inst_86901 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_86902 = [new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.Keyword(null,"loading","loading",-737050189)];
var inst_86903 = (new cljs.core.PersistentVector(null,2,(5),inst_86901,inst_86902,null));
var inst_86905 = frontend.state.set_state_BANG_(inst_86903,true);
var inst_86906 = frontend.handler.file_sync._LT_list_graphs();
var state_86922__$1 = (function (){var statearr_86938 = state_86922;
(statearr_86938[(7)] = inst_86905);

return statearr_86938;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_86922__$1,(5),inst_86906);
} else {
if((state_val_86923 === (4))){
var inst_86920 = (state_86922[(2)]);
var state_86922__$1 = state_86922;
return cljs.core.async.impl.ioc_helpers.return_chan(state_86922__$1,inst_86920);
} else {
if((state_val_86923 === (5))){
var inst_86908 = (state_86922[(8)]);
var inst_86908__$1 = (state_86922[(2)]);
var inst_86910 = (inst_86908__$1 instanceof cljs.core.ExceptionInfo);
var state_86922__$1 = (function (){var statearr_86941 = state_86922;
(statearr_86941[(8)] = inst_86908__$1);

return statearr_86941;
})();
if(cljs.core.truth_(inst_86910)){
var statearr_86943_87399 = state_86922__$1;
(statearr_86943_87399[(1)] = (6));

} else {
var statearr_86945_87400 = state_86922__$1;
(statearr_86945_87400[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86923 === (6))){
var state_86922__$1 = state_86922;
var statearr_86946_87401 = state_86922__$1;
(statearr_86946_87401[(2)] = null);

(statearr_86946_87401[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86923 === (7))){
var inst_86908 = (state_86922[(8)]);
var inst_86913 = [new cljs.core.Keyword(null,"loading","loading",-737050189),new cljs.core.Keyword(null,"graphs","graphs",-1584479112)];
var inst_86914 = [false,inst_86908];
var inst_86915 = cljs.core.PersistentHashMap.fromArrays(inst_86913,inst_86914);
var inst_86916 = frontend.state.set_state_BANG_(new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),inst_86915);
var state_86922__$1 = state_86922;
var statearr_86949_87402 = state_86922__$1;
(statearr_86949_87402[(2)] = inst_86916);

(statearr_86949_87402[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86923 === (8))){
var inst_86918 = (state_86922[(2)]);
var state_86922__$1 = state_86922;
var statearr_86952_87403 = state_86922__$1;
(statearr_86952_87403[(2)] = inst_86918);

(statearr_86952_87403[(1)] = (4));


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
var frontend$handler$file_sync$load_session_graphs_$_state_machine__32051__auto__ = null;
var frontend$handler$file_sync$load_session_graphs_$_state_machine__32051__auto____0 = (function (){
var statearr_86954 = [null,null,null,null,null,null,null,null,null];
(statearr_86954[(0)] = frontend$handler$file_sync$load_session_graphs_$_state_machine__32051__auto__);

(statearr_86954[(1)] = (1));

return statearr_86954;
});
var frontend$handler$file_sync$load_session_graphs_$_state_machine__32051__auto____1 = (function (state_86922){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_86922);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e86957){var ex__32054__auto__ = e86957;
var statearr_86958_87407 = state_86922;
(statearr_86958_87407[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_86922[(4)]))){
var statearr_86960_87409 = state_86922;
(statearr_86960_87409[(1)] = cljs.core.first((state_86922[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__87410 = state_86922;
state_86922 = G__87410;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$file_sync$load_session_graphs_$_state_machine__32051__auto__ = function(state_86922){
switch(arguments.length){
case 0:
return frontend$handler$file_sync$load_session_graphs_$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$file_sync$load_session_graphs_$_state_machine__32051__auto____1.call(this,state_86922);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_sync$load_session_graphs_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_sync$load_session_graphs_$_state_machine__32051__auto____0;
frontend$handler$file_sync$load_session_graphs_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_sync$load_session_graphs_$_state_machine__32051__auto____1;
return frontend$handler$file_sync$load_session_graphs_$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_86964 = f__32125__auto__();
(statearr_86964[(6)] = c__32124__auto__);

return statearr_86964;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
}
});
frontend.handler.file_sync.reset_session_graphs = (function frontend$handler$file_sync$reset_session_graphs(){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("file-sync","remote-graphs","file-sync/remote-graphs",795261543),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"loading","loading",-737050189),false,new cljs.core.Keyword(null,"graphs","graphs",-1584479112),null], null));
});
frontend.handler.file_sync.init_graph = (function frontend$handler$file_sync$init_graph(graph_uuid){
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_86998){
var state_val_86999 = (state_86998[(1)]);
if((state_val_86999 === (1))){
var inst_86970 = frontend.state.get_current_repo();
var inst_86971 = frontend.handler.user._LT_user_uuid();
var state_86998__$1 = (function (){var statearr_87005 = state_86998;
(statearr_87005[(7)] = inst_86970);

return statearr_87005;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_86998__$1,(2),inst_86971);
} else {
if((state_val_86999 === (2))){
var inst_86973 = (state_86998[(8)]);
var inst_86973__$1 = (state_86998[(2)]);
var inst_86974 = (inst_86973__$1 instanceof cljs.core.ExceptionInfo);
var state_86998__$1 = (function (){var statearr_87007 = state_86998;
(statearr_87007[(8)] = inst_86973__$1);

return statearr_87007;
})();
if(cljs.core.truth_(inst_86974)){
var statearr_87008_87414 = state_86998__$1;
(statearr_87008_87414[(1)] = (3));

} else {
var statearr_87009_87415 = state_86998__$1;
(statearr_87009_87415[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86999 === (3))){
var inst_86973 = (state_86998[(8)]);
var inst_86976 = cljs.core.ex_message(inst_86973);
var inst_86977 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(inst_86976,new cljs.core.Keyword(null,"error","error",-978969032));
var state_86998__$1 = state_86998;
var statearr_87013_87418 = state_86998__$1;
(statearr_87013_87418[(2)] = inst_86977);

(statearr_87013_87418[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_86999 === (4))){
var inst_86973 = (state_86998[(8)]);
var inst_86970 = (state_86998[(7)]);
var inst_86980 = frontend.state.set_state_BANG_(new cljs.core.Keyword("sync-graph","init?","sync-graph/init?",608792103),true);
var inst_86982 = frontend.fs.sync._LT_update_graphs_txid_BANG_((0),graph_uuid,inst_86973,inst_86970);
var state_86998__$1 = (function (){var statearr_87016 = state_86998;
(statearr_87016[(9)] = inst_86980);

return statearr_87016;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_86998__$1,(6),inst_86982);
} else {
if((state_val_86999 === (5))){
var inst_86995 = (state_86998[(2)]);
var state_86998__$1 = state_86998;
return cljs.core.async.impl.ioc_helpers.return_chan(state_86998__$1,inst_86995);
} else {
if((state_val_86999 === (6))){
var inst_86970 = (state_86998[(7)]);
var inst_86984 = (state_86998[(2)]);
var inst_86985 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.handler.file_sync.refresh_file_sync_component,cljs.core.not);
var inst_86986 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_86988 = [new cljs.core.Keyword(null,"persist?","persist?",-1772568760)];
var inst_86989 = [false];
var inst_86990 = cljs.core.PersistentHashMap.fromArrays(inst_86988,inst_86989);
var inst_86991 = [new cljs.core.Keyword("graph","switch","graph/switch",178853840),inst_86970,inst_86990];
var inst_86992 = (new cljs.core.PersistentVector(null,3,(5),inst_86986,inst_86991,null));
var inst_86993 = frontend.state.pub_event_BANG_(inst_86992);
var state_86998__$1 = (function (){var statearr_87022 = state_86998;
(statearr_87022[(10)] = inst_86984);

(statearr_87022[(11)] = inst_86985);

return statearr_87022;
})();
var statearr_87023_87419 = state_86998__$1;
(statearr_87023_87419[(2)] = inst_86993);

(statearr_87023_87419[(1)] = (5));


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
var frontend$handler$file_sync$init_graph_$_state_machine__32051__auto__ = null;
var frontend$handler$file_sync$init_graph_$_state_machine__32051__auto____0 = (function (){
var statearr_87025 = [null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_87025[(0)] = frontend$handler$file_sync$init_graph_$_state_machine__32051__auto__);

(statearr_87025[(1)] = (1));

return statearr_87025;
});
var frontend$handler$file_sync$init_graph_$_state_machine__32051__auto____1 = (function (state_86998){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_86998);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e87028){var ex__32054__auto__ = e87028;
var statearr_87030_87420 = state_86998;
(statearr_87030_87420[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_86998[(4)]))){
var statearr_87032_87421 = state_86998;
(statearr_87032_87421[(1)] = cljs.core.first((state_86998[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__87423 = state_86998;
state_86998 = G__87423;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$file_sync$init_graph_$_state_machine__32051__auto__ = function(state_86998){
switch(arguments.length){
case 0:
return frontend$handler$file_sync$init_graph_$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$file_sync$init_graph_$_state_machine__32051__auto____1.call(this,state_86998);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_sync$init_graph_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_sync$init_graph_$_state_machine__32051__auto____0;
frontend$handler$file_sync$init_graph_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_sync$init_graph_$_state_machine__32051__auto____1;
return frontend$handler$file_sync$init_graph_$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_87036 = f__32125__auto__();
(statearr_87036[(6)] = c__32124__auto__);

return statearr_87036;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
});
frontend.handler.file_sync.download_version_file = (function frontend$handler$file_sync$download_version_file(var_args){
var G__87038 = arguments.length;
switch (G__87038) {
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
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_87076){
var state_val_87077 = (state_87076[(1)]);
if((state_val_87077 === (7))){
var inst_87039 = (state_87076[(7)]);
var inst_87055 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_87056 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_87057 = [new cljs.core.Keyword(null,"div","div",1057191632),"Downloaded version file at: "];
var inst_87058 = (new cljs.core.PersistentVector(null,2,(5),inst_87056,inst_87057,null));
var inst_87059 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_87060 = [new cljs.core.Keyword(null,"div","div",1057191632),inst_87039];
var inst_87061 = (new cljs.core.PersistentVector(null,2,(5),inst_87059,inst_87060,null));
var inst_87062 = [new cljs.core.Keyword(null,"div","div",1057191632),inst_87058,inst_87061];
var inst_87063 = (new cljs.core.PersistentVector(null,3,(5),inst_87055,inst_87062,null));
var inst_87064 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3(inst_87063,new cljs.core.Keyword(null,"success","success",1890645906),false);
var state_87076__$1 = state_87076;
var statearr_87078_87430 = state_87076__$1;
(statearr_87078_87430[(2)] = inst_87064);

(statearr_87078_87430[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87077 === (1))){
var inst_87039 = (state_87076[(7)]);
var inst_87039__$1 = module$node_modules$path$path.join(file_uuid,version_uuid);
var inst_87040 = frontend.state.get_current_repo();
var inst_87041 = frontend.config.get_repo_dir(inst_87040);
var inst_87042 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_87043 = [inst_87039__$1];
var inst_87044 = (new cljs.core.PersistentVector(null,1,(5),inst_87042,inst_87043,null));
var inst_87045 = frontend.fs.sync._LT_download_version_files(frontend.fs.sync.rsapi,graph_uuid,inst_87041,inst_87044);
var state_87076__$1 = (function (){var statearr_87079 = state_87076;
(statearr_87079[(7)] = inst_87039__$1);

return statearr_87079;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_87076__$1,(2),inst_87045);
} else {
if((state_val_87077 === (4))){
var state_87076__$1 = state_87076;
if(cljs.core.truth_(silent_download_QMARK_)){
var statearr_87080_87431 = state_87076__$1;
(statearr_87080_87431[(1)] = (6));

} else {
var statearr_87081_87432 = state_87076__$1;
(statearr_87081_87432[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87077 === (6))){
var state_87076__$1 = state_87076;
var statearr_87082_87434 = state_87076__$1;
(statearr_87082_87434[(2)] = null);

(statearr_87082_87434[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87077 === (3))){
var inst_87047 = (state_87076[(8)]);
var inst_87050 = cljs.core.ex_cause(inst_87047);
var inst_87051 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2(inst_87050,new cljs.core.Keyword(null,"error","error",-978969032));
var state_87076__$1 = state_87076;
var statearr_87083_87437 = state_87076__$1;
(statearr_87083_87437[(2)] = inst_87051);

(statearr_87083_87437[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87077 === (2))){
var inst_87047 = (state_87076[(8)]);
var inst_87047__$1 = (state_87076[(2)]);
var inst_87048 = (inst_87047__$1 instanceof cljs.core.ExceptionInfo);
var state_87076__$1 = (function (){var statearr_87084 = state_87076;
(statearr_87084[(8)] = inst_87047__$1);

return statearr_87084;
})();
if(cljs.core.truth_(inst_87048)){
var statearr_87085_87438 = state_87076__$1;
(statearr_87085_87438[(1)] = (3));

} else {
var statearr_87086_87439 = state_87076__$1;
(statearr_87086_87439[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87077 === (11))){
var inst_87074 = (state_87076[(2)]);
var state_87076__$1 = state_87076;
return cljs.core.async.impl.ioc_helpers.return_chan(state_87076__$1,inst_87074);
} else {
if((state_val_87077 === (9))){
var state_87076__$1 = state_87076;
var statearr_87087_87440 = state_87076__$1;
(statearr_87087_87440[(2)] = null);

(statearr_87087_87440[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87077 === (5))){
var inst_87047 = (state_87076[(8)]);
var inst_87068 = (state_87076[(2)]);
var inst_87069 = (inst_87047 instanceof cljs.core.ExceptionInfo);
var state_87076__$1 = (function (){var statearr_87088 = state_87076;
(statearr_87088[(9)] = inst_87068);

return statearr_87088;
})();
if(cljs.core.truth_(inst_87069)){
var statearr_87089_87442 = state_87076__$1;
(statearr_87089_87442[(1)] = (9));

} else {
var statearr_87090_87444 = state_87076__$1;
(statearr_87090_87444[(1)] = (10));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87077 === (10))){
var inst_87039 = (state_87076[(7)]);
var inst_87072 = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic("logseq",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["version-files",inst_87039], 0));
var state_87076__$1 = state_87076;
var statearr_87091_87445 = state_87076__$1;
(statearr_87091_87445[(2)] = inst_87072);

(statearr_87091_87445[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87077 === (8))){
var inst_87066 = (state_87076[(2)]);
var state_87076__$1 = state_87076;
var statearr_87092_87446 = state_87076__$1;
(statearr_87092_87446[(2)] = inst_87066);

(statearr_87092_87446[(1)] = (5));


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
var frontend$handler$file_sync$state_machine__32051__auto__ = null;
var frontend$handler$file_sync$state_machine__32051__auto____0 = (function (){
var statearr_87093 = [null,null,null,null,null,null,null,null,null,null];
(statearr_87093[(0)] = frontend$handler$file_sync$state_machine__32051__auto__);

(statearr_87093[(1)] = (1));

return statearr_87093;
});
var frontend$handler$file_sync$state_machine__32051__auto____1 = (function (state_87076){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_87076);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e87094){var ex__32054__auto__ = e87094;
var statearr_87095_87454 = state_87076;
(statearr_87095_87454[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_87076[(4)]))){
var statearr_87096_87455 = state_87076;
(statearr_87096_87455[(1)] = cljs.core.first((state_87076[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__87456 = state_87076;
state_87076 = G__87456;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$file_sync$state_machine__32051__auto__ = function(state_87076){
switch(arguments.length){
case 0:
return frontend$handler$file_sync$state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$file_sync$state_machine__32051__auto____1.call(this,state_87076);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_sync$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_sync$state_machine__32051__auto____0;
frontend$handler$file_sync$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_sync$state_machine__32051__auto____1;
return frontend$handler$file_sync$state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_87097 = f__32125__auto__();
(statearr_87097[(6)] = c__32124__auto__);

return statearr_87097;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
}));

(frontend.handler.file_sync.download_version_file.cljs$lang$maxFixedArity = 4);

frontend.handler.file_sync._LT_list_file_local_versions = (function frontend$handler$file_sync$_LT_list_file_local_versions(page){
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_87129){
var state_val_87130 = (state_87129[(1)]);
if((state_val_87130 === (7))){
var inst_87111 = (state_87129[(7)]);
var inst_87115 = cljs.core.seq(inst_87111);
var state_87129__$1 = state_87129;
if(inst_87115){
var statearr_87131_87458 = state_87129__$1;
(statearr_87131_87458[(1)] = (9));

} else {
var statearr_87132_87459 = state_87129__$1;
(statearr_87132_87459[(1)] = (10));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87130 === (1))){
var inst_87100 = (state_87129[(8)]);
var inst_87099 = new cljs.core.Keyword("block","file","block/file",183171933).cljs$core$IFn$_invoke$arity$1(page);
var inst_87100__$1 = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(inst_87099);
var state_87129__$1 = (function (){var statearr_87133 = state_87129;
(statearr_87133[(8)] = inst_87100__$1);

return statearr_87133;
})();
if(cljs.core.truth_(inst_87100__$1)){
var statearr_87134_87460 = state_87129__$1;
(statearr_87134_87460[(1)] = (2));

} else {
var statearr_87135_87461 = state_87129__$1;
(statearr_87135_87461[(1)] = (3));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87130 === (4))){
var inst_87127 = (state_87129[(2)]);
var state_87129__$1 = state_87129;
return cljs.core.async.impl.ioc_helpers.return_chan(state_87129__$1,inst_87127);
} else {
if((state_val_87130 === (6))){
var state_87129__$1 = state_87129;
var statearr_87136_87462 = state_87129__$1;
(statearr_87136_87462[(2)] = null);

(statearr_87136_87462[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87130 === (3))){
var state_87129__$1 = state_87129;
var statearr_87137_87464 = state_87129__$1;
(statearr_87137_87464[(2)] = null);

(statearr_87137_87464[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87130 === (2))){
var inst_87100 = (state_87129[(8)]);
var inst_87103 = (state_87129[(9)]);
var inst_87104 = (state_87129[(10)]);
var inst_87105 = (state_87129[(11)]);
var inst_87107 = (state_87129[(12)]);
var inst_87102 = frontend.state.get_current_repo();
var inst_87103__$1 = frontend.config.get_repo_dir(inst_87102);
var inst_87104__$1 = clojure.string.replace_first(inst_87100,inst_87103__$1,"");
var inst_87105__$1 = logseq.common.path.file_stem(inst_87104__$1);
var inst_87106 = logseq.common.path.dirname(inst_87104__$1);
var inst_87107__$1 = logseq.common.path.path_join.cljs$core$IFn$_invoke$arity$variadic(inst_87103__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["logseq/version-files/local",inst_87106,inst_87105__$1], 0));
var inst_87108 = frontend.fs.readdir.cljs$core$IFn$_invoke$arity$variadic(inst_87107__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"path-only?","path-only?",-825545027),true], 0));
var inst_87109 = cljs.core.async.interop.p__GT_c(inst_87108);
var state_87129__$1 = (function (){var statearr_87138 = state_87129;
(statearr_87138[(9)] = inst_87103__$1);

(statearr_87138[(10)] = inst_87104__$1);

(statearr_87138[(11)] = inst_87105__$1);

(statearr_87138[(12)] = inst_87107__$1);

return statearr_87138;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_87129__$1,(5),inst_87109);
} else {
if((state_val_87130 === (11))){
var inst_87122 = (state_87129[(2)]);
var state_87129__$1 = state_87129;
var statearr_87139_87466 = state_87129__$1;
(statearr_87139_87466[(2)] = inst_87122);

(statearr_87139_87466[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87130 === (9))){
var inst_87100 = (state_87129[(8)]);
var inst_87103 = (state_87129[(9)]);
var inst_87104 = (state_87129[(10)]);
var inst_87105 = (state_87129[(11)]);
var inst_87107 = (state_87129[(12)]);
var inst_87111 = (state_87129[(7)]);
var inst_87117 = (function (){var temp__5804__auto__ = inst_87100;
var path = inst_87100;
var base_path = inst_87103;
var rel_path = inst_87104;
var file_stem = inst_87105;
var version_files_dir = inst_87107;
var version_file_paths = inst_87111;
return (function (path__$1){
try{var create_time = (function (p1__87098_SHARP_){
return cljs_time.format.parse.cljs$core$IFn$_invoke$arity$2(cljs_time.format.formatter.cljs$core$IFn$_invoke$arity$1("yyyy-MM-dd'T'HH_mm_ss.SSSZZ"),p1__87098_SHARP_);
})(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(module$node_modules$path$path.parse(path__$1),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0))));
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"create-time","create-time",875410581),create_time,new cljs.core.Keyword(null,"path","path",-188191168),path__$1,new cljs.core.Keyword(null,"relative-path","relative-path",1848635172),logseq.common.path.relative_path(base_path,path__$1)], null);
}catch (e87140){var e = e87140;
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.handler.file-sync",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword("page-history","parse-format-error","page-history/parse-format-error",276798971),e,new cljs.core.Keyword(null,"line","line",212345235),167], null)),null);

return null;
}});
})();
var inst_87118 = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(inst_87117,inst_87111);
var inst_87119 = cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,inst_87118);
var state_87129__$1 = state_87129;
var statearr_87141_87467 = state_87129__$1;
(statearr_87141_87467[(2)] = inst_87119);

(statearr_87141_87467[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87130 === (5))){
var inst_87111 = (state_87129[(7)]);
var inst_87111__$1 = (state_87129[(2)]);
var inst_87112 = (inst_87111__$1 instanceof cljs.core.ExceptionInfo);
var state_87129__$1 = (function (){var statearr_87142 = state_87129;
(statearr_87142[(7)] = inst_87111__$1);

return statearr_87142;
})();
if(cljs.core.truth_(inst_87112)){
var statearr_87143_87468 = state_87129__$1;
(statearr_87143_87468[(1)] = (6));

} else {
var statearr_87144_87469 = state_87129__$1;
(statearr_87144_87469[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87130 === (10))){
var state_87129__$1 = state_87129;
var statearr_87145_87470 = state_87129__$1;
(statearr_87145_87470[(2)] = null);

(statearr_87145_87470[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87130 === (8))){
var inst_87124 = (state_87129[(2)]);
var state_87129__$1 = state_87129;
var statearr_87146_87471 = state_87129__$1;
(statearr_87146_87471[(2)] = inst_87124);

(statearr_87146_87471[(1)] = (4));


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
var frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32051__auto__ = null;
var frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32051__auto____0 = (function (){
var statearr_87147 = [null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_87147[(0)] = frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32051__auto__);

(statearr_87147[(1)] = (1));

return statearr_87147;
});
var frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32051__auto____1 = (function (state_87129){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_87129);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e87148){var ex__32054__auto__ = e87148;
var statearr_87149_87472 = state_87129;
(statearr_87149_87472[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_87129[(4)]))){
var statearr_87150_87473 = state_87129;
(statearr_87150_87473[(1)] = cljs.core.first((state_87129[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__87474 = state_87129;
state_87129 = G__87474;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32051__auto__ = function(state_87129){
switch(arguments.length){
case 0:
return frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32051__auto____1.call(this,state_87129);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32051__auto____0;
frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32051__auto____1;
return frontend$handler$file_sync$_LT_list_file_local_versions_$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_87151 = f__32125__auto__();
(statearr_87151[(6)] = c__32124__auto__);

return statearr_87151;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
});
frontend.handler.file_sync._LT_fetch_page_file_versions = (function frontend$handler$file_sync$_LT_fetch_page_file_versions(graph_uuid,page){
cljs.core.PersistentVector.EMPTY;

var file_id = new cljs.core.Keyword("db","id","db/id",-1388397098).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword("block","file","block/file",183171933).cljs$core$IFn$_invoke$arity$1(page));
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_87170){
var state_val_87171 = (state_87170[(1)]);
if((state_val_87171 === (1))){
var inst_87154 = (state_87170[(7)]);
var inst_87153 = (frontend.db.entity.cljs$core$IFn$_invoke$arity$1 ? frontend.db.entity.cljs$core$IFn$_invoke$arity$1(file_id) : frontend.db.entity.call(null,file_id));
var inst_87154__$1 = new cljs.core.Keyword("file","path","file/path",-191335748).cljs$core$IFn$_invoke$arity$1(inst_87153);
var state_87170__$1 = (function (){var statearr_87172 = state_87170;
(statearr_87172[(7)] = inst_87154__$1);

return statearr_87172;
})();
if(cljs.core.truth_(inst_87154__$1)){
var statearr_87173_87475 = state_87170__$1;
(statearr_87173_87475[(1)] = (2));

} else {
var statearr_87174_87476 = state_87170__$1;
(statearr_87174_87476[(1)] = (3));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87171 === (2))){
var inst_87154 = (state_87170[(7)]);
var inst_87156 = frontend.fs.sync._LT_get_remote_file_versions(frontend.fs.sync.remoteapi,graph_uuid,inst_87154);
var state_87170__$1 = state_87170;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_87170__$1,(5),inst_87156);
} else {
if((state_val_87171 === (3))){
var state_87170__$1 = state_87170;
var statearr_87175_87477 = state_87170__$1;
(statearr_87175_87477[(2)] = null);

(statearr_87175_87477[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87171 === (4))){
var inst_87168 = (state_87170[(2)]);
var state_87170__$1 = state_87170;
return cljs.core.async.impl.ioc_helpers.return_chan(state_87170__$1,inst_87168);
} else {
if((state_val_87171 === (5))){
var inst_87158 = (state_87170[(2)]);
var inst_87159 = new cljs.core.Keyword(null,"VersionList","VersionList",-1189454538).cljs$core$IFn$_invoke$arity$1(inst_87158);
var inst_87160 = frontend.handler.file_sync._LT_list_file_local_versions(page);
var state_87170__$1 = (function (){var statearr_87176 = state_87170;
(statearr_87176[(8)] = inst_87159);

return statearr_87176;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_87170__$1,(6),inst_87160);
} else {
if((state_val_87171 === (6))){
var inst_87154 = (state_87170[(7)]);
var inst_87159 = (state_87170[(8)]);
var inst_87162 = (state_87170[(2)]);
var inst_87163 = (function (){var temp__5804__auto__ = inst_87154;
var path = inst_87154;
var version_list = inst_87159;
var local_version_list = inst_87162;
return (function (p1__87152_SHARP_){
var or__5002__auto__ = new cljs.core.Keyword(null,"CreateTime","CreateTime",462769722).cljs$core$IFn$_invoke$arity$1(p1__87152_SHARP_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"create-time","create-time",875410581).cljs$core$IFn$_invoke$arity$1(p1__87152_SHARP_);
}
});
})();
var inst_87164 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(inst_87159,inst_87162);
var inst_87165 = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$3(inst_87163,cljs.core._GT_,inst_87164);
var state_87170__$1 = state_87170;
var statearr_87177_87479 = state_87170__$1;
(statearr_87177_87479[(2)] = inst_87165);

(statearr_87177_87479[(1)] = (4));


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
var frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32051__auto__ = null;
var frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32051__auto____0 = (function (){
var statearr_87178 = [null,null,null,null,null,null,null,null,null];
(statearr_87178[(0)] = frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32051__auto__);

(statearr_87178[(1)] = (1));

return statearr_87178;
});
var frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32051__auto____1 = (function (state_87170){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_87170);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e87179){var ex__32054__auto__ = e87179;
var statearr_87180_87480 = state_87170;
(statearr_87180_87480[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_87170[(4)]))){
var statearr_87181_87481 = state_87170;
(statearr_87181_87481[(1)] = cljs.core.first((state_87170[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__87483 = state_87170;
state_87170 = G__87483;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32051__auto__ = function(state_87170){
switch(arguments.length){
case 0:
return frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32051__auto____1.call(this,state_87170);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32051__auto____0;
frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32051__auto____1;
return frontend$handler$file_sync$_LT_fetch_page_file_versions_$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_87182 = f__32125__auto__();
(statearr_87182[(6)] = c__32124__auto__);

return statearr_87182;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
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
var seq__87183_87484 = cljs.core.seq(topics);
var chunk__87184_87485 = null;
var count__87185_87486 = (0);
var i__87186_87487 = (0);
while(true){
if((i__87186_87487 < count__87185_87486)){
var topic_87488 = chunk__87184_87485.cljs$core$IIndexed$_nth$arity$2(null,i__87186_87487);
cljs.core.async.sub.cljs$core$IFn$_invoke$arity$3(p,topic_87488,c);


var G__87489 = seq__87183_87484;
var G__87490 = chunk__87184_87485;
var G__87491 = count__87185_87486;
var G__87492 = (i__87186_87487 + (1));
seq__87183_87484 = G__87489;
chunk__87184_87485 = G__87490;
count__87185_87486 = G__87491;
i__87186_87487 = G__87492;
continue;
} else {
var temp__5804__auto___87493 = cljs.core.seq(seq__87183_87484);
if(temp__5804__auto___87493){
var seq__87183_87494__$1 = temp__5804__auto___87493;
if(cljs.core.chunked_seq_QMARK_(seq__87183_87494__$1)){
var c__5525__auto___87495 = cljs.core.chunk_first(seq__87183_87494__$1);
var G__87496 = cljs.core.chunk_rest(seq__87183_87494__$1);
var G__87497 = c__5525__auto___87495;
var G__87498 = cljs.core.count(c__5525__auto___87495);
var G__87499 = (0);
seq__87183_87484 = G__87496;
chunk__87184_87485 = G__87497;
count__87185_87486 = G__87498;
i__87186_87487 = G__87499;
continue;
} else {
var topic_87500 = cljs.core.first(seq__87183_87494__$1);
cljs.core.async.sub.cljs$core$IFn$_invoke$arity$3(p,topic_87500,c);


var G__87501 = cljs.core.next(seq__87183_87494__$1);
var G__87502 = null;
var G__87503 = (0);
var G__87504 = (0);
seq__87183_87484 = G__87501;
chunk__87184_87485 = G__87502;
count__87185_87486 = G__87503;
i__87186_87487 = G__87504;
continue;
}
} else {
}
}
break;
}

var c__32124__auto___87505 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_87244){
var state_val_87245 = (state_87244[(1)]);
if((state_val_87245 === (7))){
var inst_87194 = (state_87244[(7)]);
var inst_87193 = (state_87244[(8)]);
var inst_87192 = (state_87244[(9)]);
var inst_87196 = frontend.state.clear_file_sync_progress_BANG_(inst_87194);
var inst_87197 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_87198 = [new cljs.core.Keyword("file-sync","graph-state","file-sync/graph-state",-1768817840),inst_87194,new cljs.core.Keyword("file-sync","last-synced-at","file-sync/last-synced-at",1623190259)];
var inst_87199 = (new cljs.core.PersistentVector(null,3,(5),inst_87197,inst_87198,null));
var inst_87200 = new cljs.core.Keyword(null,"epoch","epoch",1435633666).cljs$core$IFn$_invoke$arity$1(inst_87193);
var inst_87201 = frontend.state.set_state_BANG_(inst_87199,inst_87200);
var inst_87202 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_87192,new cljs.core.Keyword(null,"finished-local->remote","finished-local->remote",2118586037));
var state_87244__$1 = (function (){var statearr_87246 = state_87244;
(statearr_87246[(10)] = inst_87196);

(statearr_87246[(11)] = inst_87201);

return statearr_87246;
})();
if(inst_87202){
var statearr_87247_87506 = state_87244__$1;
(statearr_87247_87506[(1)] = (10));

} else {
var statearr_87248_87507 = state_87244__$1;
(statearr_87248_87507[(1)] = (11));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (20))){
var inst_87231 = (state_87244[(2)]);
var state_87244__$1 = state_87244;
if(cljs.core.truth_(inst_87231)){
var statearr_87249_87508 = state_87244__$1;
(statearr_87249_87508[(1)] = (21));

} else {
var statearr_87250_87509 = state_87244__$1;
(statearr_87250_87509[(1)] = (22));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (1))){
var state_87244__$1 = state_87244;
var statearr_87251_87510 = state_87244__$1;
(statearr_87251_87510[(2)] = null);

(statearr_87251_87510[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (4))){
var inst_87192 = (state_87244[(9)]);
var inst_87190 = (state_87244[(2)]);
var inst_87191 = cljs.core.__destructure_map(inst_87190);
var inst_87192__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_87191,new cljs.core.Keyword(null,"event","event",301435442));
var inst_87193 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_87191,new cljs.core.Keyword(null,"data","data",-232669377));
var state_87244__$1 = (function (){var statearr_87252 = state_87244;
(statearr_87252[(9)] = inst_87192__$1);

(statearr_87252[(8)] = inst_87193);

return statearr_87252;
})();
var G__87253_87511 = inst_87192__$1;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"list","list",-1889078086,null),G__87253_87511)){
var statearr_87254_87512 = state_87244__$1;
(statearr_87254_87512[(1)] = (6));

} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"finished-local->remote","finished-local->remote",2118586037),G__87253_87511)){
var statearr_87255_87513 = state_87244__$1;
(statearr_87255_87513[(1)] = (6));

} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"finished-remote->local","finished-remote->local",1594006010),G__87253_87511)){
var statearr_87256_87514 = state_87244__$1;
(statearr_87256_87514[(1)] = (6));

} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"start","start",-355208981),G__87253_87511)){
var statearr_87257_87515 = state_87244__$1;
(statearr_87257_87515[(1)] = (13));

} else {
var statearr_87258_87516 = state_87244__$1;
(statearr_87258_87516[(1)] = (17));



}
}
}
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (15))){
var state_87244__$1 = state_87244;
var statearr_87259_87517 = state_87244__$1;
(statearr_87259_87517[(2)] = null);

(statearr_87259_87517[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (21))){
var inst_87233 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_87234 = [new cljs.core.Keyword("file-sync","maybe-onboarding-show","file-sync/maybe-onboarding-show",1562674517),new cljs.core.Keyword(null,"sync-history","sync-history",1914466991)];
var inst_87235 = (new cljs.core.PersistentVector(null,2,(5),inst_87233,inst_87234,null));
var inst_87236 = frontend.state.pub_event_BANG_(inst_87235);
var state_87244__$1 = state_87244;
var statearr_87260_87518 = state_87244__$1;
(statearr_87260_87518[(2)] = inst_87236);

(statearr_87260_87518[(1)] = (23));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (13))){
var inst_87212 = (state_87244[(12)]);
var inst_87212__$1 = frontend.state.get_current_file_sync_graph_uuid();
var state_87244__$1 = (function (){var statearr_87261 = state_87244;
(statearr_87261[(12)] = inst_87212__$1);

return statearr_87261;
})();
if(cljs.core.truth_(inst_87212__$1)){
var statearr_87262_87519 = state_87244__$1;
(statearr_87262_87519[(1)] = (14));

} else {
var statearr_87263_87520 = state_87244__$1;
(statearr_87263_87520[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (22))){
var state_87244__$1 = state_87244;
var statearr_87264_87521 = state_87244__$1;
(statearr_87264_87521[(2)] = null);

(statearr_87264_87521[(1)] = (23));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (6))){
var inst_87194 = (state_87244[(7)]);
var inst_87194__$1 = frontend.state.get_current_file_sync_graph_uuid();
var state_87244__$1 = (function (){var statearr_87265 = state_87244;
(statearr_87265[(7)] = inst_87194__$1);

return statearr_87265;
})();
if(cljs.core.truth_(inst_87194__$1)){
var statearr_87266_87522 = state_87244__$1;
(statearr_87266_87522[(1)] = (7));

} else {
var statearr_87267_87523 = state_87244__$1;
(statearr_87267_87523[(1)] = (8));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (17))){
var state_87244__$1 = state_87244;
var statearr_87268_87524 = state_87244__$1;
(statearr_87268_87524[(2)] = null);

(statearr_87268_87524[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (3))){
var inst_87242 = (state_87244[(2)]);
var state_87244__$1 = state_87244;
return cljs.core.async.impl.ioc_helpers.return_chan(state_87244__$1,inst_87242);
} else {
if((state_val_87245 === (12))){
var inst_87207 = (state_87244[(2)]);
var state_87244__$1 = state_87244;
var statearr_87269_87525 = state_87244__$1;
(statearr_87269_87525[(2)] = inst_87207);

(statearr_87269_87525[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (2))){
var state_87244__$1 = state_87244;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_87244__$1,(4),c);
} else {
if((state_val_87245 === (23))){
var inst_87239 = (state_87244[(2)]);
var state_87244__$1 = (function (){var statearr_87270 = state_87244;
(statearr_87270[(13)] = inst_87239);

return statearr_87270;
})();
var statearr_87271_87526 = state_87244__$1;
(statearr_87271_87526[(2)] = null);

(statearr_87271_87526[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (19))){
var inst_87225 = (state_87244[(14)]);
var state_87244__$1 = state_87244;
var statearr_87272_87527 = state_87244__$1;
(statearr_87272_87527[(2)] = inst_87225);

(statearr_87272_87527[(1)] = (20));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (11))){
var state_87244__$1 = state_87244;
var statearr_87273_87528 = state_87244__$1;
(statearr_87273_87528[(2)] = null);

(statearr_87273_87528[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (9))){
var inst_87210 = (state_87244[(2)]);
var state_87244__$1 = state_87244;
var statearr_87274_87529 = state_87244__$1;
(statearr_87274_87529[(2)] = inst_87210);

(statearr_87274_87529[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (5))){
var inst_87193 = (state_87244[(8)]);
var inst_87225 = (state_87244[(14)]);
var inst_87224 = (state_87244[(2)]);
var inst_87225__$1 = new cljs.core.Keyword(null,"file-change-events","file-change-events",1473966069).cljs$core$IFn$_invoke$arity$1(inst_87193);
var state_87244__$1 = (function (){var statearr_87275 = state_87244;
(statearr_87275[(15)] = inst_87224);

(statearr_87275[(14)] = inst_87225__$1);

return statearr_87275;
})();
if(cljs.core.truth_(inst_87225__$1)){
var statearr_87276_87530 = state_87244__$1;
(statearr_87276_87530[(1)] = (18));

} else {
var statearr_87277_87531 = state_87244__$1;
(statearr_87277_87531[(1)] = (19));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (14))){
var inst_87212 = (state_87244[(12)]);
var inst_87193 = (state_87244[(8)]);
var inst_87214 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_87215 = [new cljs.core.Keyword("file-sync","graph-state","file-sync/graph-state",-1768817840),inst_87212,new cljs.core.Keyword("file-sync","start-time","file-sync/start-time",-882469306)];
var inst_87216 = (new cljs.core.PersistentVector(null,3,(5),inst_87214,inst_87215,null));
var inst_87217 = frontend.state.set_state_BANG_(inst_87216,inst_87193);
var state_87244__$1 = state_87244;
var statearr_87278_87532 = state_87244__$1;
(statearr_87278_87532[(2)] = inst_87217);

(statearr_87278_87532[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (16))){
var inst_87220 = (state_87244[(2)]);
var state_87244__$1 = state_87244;
var statearr_87279_87533 = state_87244__$1;
(statearr_87279_87533[(2)] = inst_87220);

(statearr_87279_87533[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (10))){
var inst_87204 = cljs.core.async.offer_BANG_(frontend.fs.sync.finished_local__GT_remote_chan,true);
var state_87244__$1 = state_87244;
var statearr_87280_87534 = state_87244__$1;
(statearr_87280_87534[(2)] = inst_87204);

(statearr_87280_87534[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (18))){
var inst_87227 = frontend.state.get_current_route();
var inst_87228 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"page","page",849072397),inst_87227);
var state_87244__$1 = state_87244;
var statearr_87281_87535 = state_87244__$1;
(statearr_87281_87535[(2)] = inst_87228);

(statearr_87281_87535[(1)] = (20));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_87245 === (8))){
var state_87244__$1 = state_87244;
var statearr_87282_87536 = state_87244__$1;
(statearr_87282_87536[(2)] = null);

(statearr_87282_87536[(1)] = (9));


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
var frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32051__auto__ = null;
var frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32051__auto____0 = (function (){
var statearr_87283 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_87283[(0)] = frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32051__auto__);

(statearr_87283[(1)] = (1));

return statearr_87283;
});
var frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32051__auto____1 = (function (state_87244){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_87244);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e87284){var ex__32054__auto__ = e87284;
var statearr_87285_87537 = state_87244;
(statearr_87285_87537[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_87244[(4)]))){
var statearr_87286_87538 = state_87244;
(statearr_87286_87538[(1)] = cljs.core.first((state_87244[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__87539 = state_87244;
state_87244 = G__87539;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32051__auto__ = function(state_87244){
switch(arguments.length){
case 0:
return frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32051__auto____1.call(this,state_87244);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32051__auto____0;
frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32051__auto____1;
return frontend$handler$file_sync$setup_file_sync_event_listeners_$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_87287 = f__32125__auto__();
(statearr_87287[(6)] = c__32124__auto___87505);

return statearr_87287;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));


return (function (){
var seq__87288 = cljs.core.seq(topics);
var chunk__87289 = null;
var count__87290 = (0);
var i__87291 = (0);
while(true){
if((i__87291 < count__87290)){
var topic = chunk__87289.cljs$core$IIndexed$_nth$arity$2(null,i__87291);
cljs.core.async.unsub(p,topic,c);


var G__87540 = seq__87288;
var G__87541 = chunk__87289;
var G__87542 = count__87290;
var G__87543 = (i__87291 + (1));
seq__87288 = G__87540;
chunk__87289 = G__87541;
count__87290 = G__87542;
i__87291 = G__87543;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__87288);
if(temp__5804__auto__){
var seq__87288__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__87288__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__87288__$1);
var G__87544 = cljs.core.chunk_rest(seq__87288__$1);
var G__87545 = c__5525__auto__;
var G__87546 = cljs.core.count(c__5525__auto__);
var G__87547 = (0);
seq__87288 = G__87544;
chunk__87289 = G__87545;
count__87290 = G__87546;
i__87291 = G__87547;
continue;
} else {
var topic = cljs.core.first(seq__87288__$1);
cljs.core.async.unsub(p,topic,c);


var G__87548 = cljs.core.next(seq__87288__$1);
var G__87549 = null;
var G__87550 = (0);
var G__87551 = (0);
seq__87288 = G__87548;
chunk__87289 = G__87549;
count__87290 = G__87550;
i__87291 = G__87551;
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
}),remote__GT_local_files)):cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(cljs.core._PLUS_,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__87292_SHARP_){
return new cljs.core.Keyword(null,"size","size",1098693007).cljs$core$IFn$_invoke$arity$1(p1__87292_SHARP_.stat);
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
