goog.provide('capacitor.events');
if((typeof capacitor !== 'undefined') && (typeof capacitor.events !== 'undefined') && (typeof capacitor.events.handle !== 'undefined')){
} else {
capacitor.events.handle = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__99330 = cljs.core.get_global_hierarchy;
return (fexpr__99330.cljs$core$IFn$_invoke$arity$0 ? fexpr__99330.cljs$core$IFn$_invoke$arity$0() : fexpr__99330.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("capacitor.events","handle"),cljs.core.first,new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
capacitor.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword("db","sync-changes","db/sync-changes",584814072),(function (p__99348){
var vec__99351 = p__99348;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99351,(0),null);
var data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99351,(1),null);
var retract_datoms = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (d){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("block","uuid","block/uuid",-1991494552),new cljs.core.Keyword(null,"a","a",-2123407586).cljs$core$IFn$_invoke$arity$1(d))) && (new cljs.core.Keyword(null,"added","added",2057651688).cljs$core$IFn$_invoke$arity$1(d) === false));
}),new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(data));
var retracted_tx_data = cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (d){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("db","retractEntity","db/retractEntity",-1452737935),new cljs.core.Keyword(null,"e","e",1381269198).cljs$core$IFn$_invoke$arity$1(d)], null);
}),retract_datoms);
var tx_data = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"tx-data","tx-data",934159761).cljs$core$IFn$_invoke$arity$1(data),retracted_tx_data);
frontend.modules.outliner.pipeline.invoke_hooks(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(data,new cljs.core.Keyword(null,"tx-data","tx-data",934159761),tx_data));

return null;
}));
capacitor.events.handle.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"default","default",-1987822328),(function (p__99377){
var vec__99378 = p__99377;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__99378,(0),null);
return cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["[skip handle] ",k], 0));
}));
capacitor.events.run_BANG_ = (function capacitor$events$run_BANG_(){
var chan = frontend.state.get_events_chan();
var c__36895__auto___99500 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36896__auto__ = (function (){var switch__36739__auto__ = (function (state_99414){
var state_val_99415 = (state_99414[(1)]);
if((state_val_99415 === (1))){
var state_99414__$1 = state_99414;
var statearr_99418_99501 = state_99414__$1;
(statearr_99418_99501[(2)] = null);

(statearr_99418_99501[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_99415 === (2))){
var state_99414__$1 = state_99414;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_99414__$1,(4),chan);
} else {
if((state_val_99415 === (3))){
var inst_99412 = (state_99414[(2)]);
var state_99414__$1 = state_99414;
return cljs.core.async.impl.ioc_helpers.return_chan(state_99414__$1,inst_99412);
} else {
if((state_val_99415 === (4))){
var inst_99390 = (state_99414[(7)]);
var inst_99390__$1 = (state_99414[(2)]);
var inst_99391 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_99390__$1,(0),null);
var inst_99392 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_99390__$1,(1),null);
var state_99414__$1 = (function (){var statearr_99419 = state_99414;
(statearr_99419[(7)] = inst_99390__$1);

(statearr_99419[(8)] = inst_99391);

(statearr_99419[(9)] = inst_99392);

return statearr_99419;
})();
var statearr_99422_99502 = state_99414__$1;
(statearr_99422_99502[(2)] = null);

(statearr_99422_99502[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_99415 === (5))){
var inst_99391 = (state_99414[(8)]);
var _ = (function (){var statearr_99423 = state_99414;
(statearr_99423[(4)] = cljs.core.cons((8),(state_99414[(4)])));

return statearr_99423;
})();
var inst_99401 = capacitor.events.handle.cljs$core$IFn$_invoke$arity$1(inst_99391);
var inst_99402 = promesa.core.resolved(inst_99401);
var ___$1 = (function (){var statearr_99425 = state_99414;
(statearr_99425[(4)] = cljs.core.rest((state_99414[(4)])));

return statearr_99425;
})();
var state_99414__$1 = state_99414;
var statearr_99427_99503 = state_99414__$1;
(statearr_99427_99503[(2)] = inst_99402);

(statearr_99427_99503[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_99415 === (6))){
var inst_99390 = (state_99414[(7)]);
var inst_99391 = (state_99414[(8)]);
var inst_99392 = (state_99414[(9)]);
var inst_99405 = (state_99414[(2)]);
var inst_99406 = (function (){var vec__99386 = inst_99390;
var payload = inst_99391;
var d = inst_99392;
return (function (result){
return promesa.core.resolve_BANG_.cljs$core$IFn$_invoke$arity$2(d,result);
});
})();
var inst_99407 = promesa.core.then.cljs$core$IFn$_invoke$arity$2(inst_99405,inst_99406);
var inst_99408 = (function (){var vec__99386 = inst_99390;
var payload = inst_99391;
var d = inst_99392;
return (function (error){
var type = new cljs.core.Keyword("handle-system-events","failed","handle-system-events/failed",-2079184624);
frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"capture-error","capture-error",583122432),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error","error",-978969032),error,new cljs.core.Keyword(null,"payload","payload",-383036092),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),type,new cljs.core.Keyword(null,"payload","payload",-383036092),payload], null)], null)], null));

return promesa.core.reject_BANG_(d,error);
});
})();
var inst_99409 = promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(inst_99407,inst_99408);
var state_99414__$1 = (function (){var statearr_99448 = state_99414;
(statearr_99448[(10)] = inst_99409);

return statearr_99448;
})();
var statearr_99449_99511 = state_99414__$1;
(statearr_99449_99511[(2)] = null);

(statearr_99449_99511[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_99415 === (7))){
var inst_99393 = (state_99414[(2)]);
var inst_99394 = promesa.core.rejected(inst_99393);
var state_99414__$1 = state_99414;
var statearr_99452_99514 = state_99414__$1;
(statearr_99452_99514[(2)] = inst_99394);

(statearr_99452_99514[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_99415 === (8))){
var _ = (function (){var statearr_99461 = state_99414;
(statearr_99461[(4)] = cljs.core.rest((state_99414[(4)])));

return statearr_99461;
})();
var state_99414__$1 = state_99414;
var ex99429 = (state_99414__$1[(2)]);
var statearr_99471_99520 = state_99414__$1;
(statearr_99471_99520[(5)] = ex99429);


var statearr_99472_99521 = state_99414__$1;
(statearr_99472_99521[(1)] = (7));

(statearr_99472_99521[(5)] = null);



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
var capacitor$events$run_BANG__$_state_machine__36740__auto__ = null;
var capacitor$events$run_BANG__$_state_machine__36740__auto____0 = (function (){
var statearr_99479 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_99479[(0)] = capacitor$events$run_BANG__$_state_machine__36740__auto__);

(statearr_99479[(1)] = (1));

return statearr_99479;
});
var capacitor$events$run_BANG__$_state_machine__36740__auto____1 = (function (state_99414){
while(true){
var ret_value__36741__auto__ = (function (){try{while(true){
var result__36742__auto__ = switch__36739__auto__(state_99414);
if(cljs.core.keyword_identical_QMARK_(result__36742__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36742__auto__;
}
break;
}
}catch (e99480){var ex__36743__auto__ = e99480;
var statearr_99482_99522 = state_99414;
(statearr_99482_99522[(2)] = ex__36743__auto__);


if(cljs.core.seq((state_99414[(4)]))){
var statearr_99483_99523 = state_99414;
(statearr_99483_99523[(1)] = cljs.core.first((state_99414[(4)])));

} else {
throw ex__36743__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36741__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__99524 = state_99414;
state_99414 = G__99524;
continue;
} else {
return ret_value__36741__auto__;
}
break;
}
});
capacitor$events$run_BANG__$_state_machine__36740__auto__ = function(state_99414){
switch(arguments.length){
case 0:
return capacitor$events$run_BANG__$_state_machine__36740__auto____0.call(this);
case 1:
return capacitor$events$run_BANG__$_state_machine__36740__auto____1.call(this,state_99414);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
capacitor$events$run_BANG__$_state_machine__36740__auto__.cljs$core$IFn$_invoke$arity$0 = capacitor$events$run_BANG__$_state_machine__36740__auto____0;
capacitor$events$run_BANG__$_state_machine__36740__auto__.cljs$core$IFn$_invoke$arity$1 = capacitor$events$run_BANG__$_state_machine__36740__auto____1;
return capacitor$events$run_BANG__$_state_machine__36740__auto__;
})()
})();
var state__36897__auto__ = (function (){var statearr_99489 = f__36896__auto__();
(statearr_99489[(6)] = c__36895__auto___99500);

return statearr_99489;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36897__auto__);
}));


return chan;
});

//# sourceMappingURL=capacitor.events.js.map
