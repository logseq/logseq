goog.provide('frontend.db.transact');
if((typeof frontend !== 'undefined') && (typeof frontend.db !== 'undefined') && (typeof frontend.db.transact !== 'undefined') && (typeof frontend.db.transact._STAR_request_id !== 'undefined')){
} else {
frontend.db.transact._STAR_request_id = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0));
}
if((typeof frontend !== 'undefined') && (typeof frontend.db !== 'undefined') && (typeof frontend.db.transact !== 'undefined') && (typeof frontend.db.transact.requests !== 'undefined')){
} else {
frontend.db.transact.requests = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1000));
}
if((typeof frontend !== 'undefined') && (typeof frontend.db !== 'undefined') && (typeof frontend.db.transact !== 'undefined') && (typeof frontend.db.transact._STAR_unfinished_request_ids !== 'undefined')){
} else {
frontend.db.transact._STAR_unfinished_request_ids = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
}
/**
 * Whether any DB transaction request has been finished
 */
frontend.db.transact.request_finished_QMARK_ = (function frontend$db$transact$request_finished_QMARK_(){
return cljs.core.empty_QMARK_(cljs.core.deref(frontend.db.transact._STAR_unfinished_request_ids));
});
frontend.db.transact.get_next_request_id = (function frontend$db$transact$get_next_request_id(){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(frontend.db.transact._STAR_request_id,cljs.core.inc);
});
frontend.db.transact.add_request_BANG_ = (function frontend$db$transact$add_request_BANG_(request_id,request_f){
var resp = promesa.core.deferred();
var new_request = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),request_id,new cljs.core.Keyword(null,"request","request",1772954723),request_f,new cljs.core.Keyword(null,"response","response",-1068424192),resp], null);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.db.transact._STAR_unfinished_request_ids,cljs.core.conj,request_id);

var c__37594__auto___73133 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_73019){
var state_val_73020 = (state_73019[(1)]);
if((state_val_73020 === (1))){
var state_73019__$1 = state_73019;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_73019__$1,(2),frontend.db.transact.requests,new_request);
} else {
if((state_val_73020 === (2))){
var inst_73017 = (state_73019[(2)]);
var state_73019__$1 = state_73019;
return cljs.core.async.impl.ioc_helpers.return_chan(state_73019__$1,inst_73017);
} else {
return null;
}
}
});
return (function() {
var frontend$db$transact$add_request_BANG__$_state_machine__37085__auto__ = null;
var frontend$db$transact$add_request_BANG__$_state_machine__37085__auto____0 = (function (){
var statearr_73021 = [null,null,null,null,null,null,null];
(statearr_73021[(0)] = frontend$db$transact$add_request_BANG__$_state_machine__37085__auto__);

(statearr_73021[(1)] = (1));

return statearr_73021;
});
var frontend$db$transact$add_request_BANG__$_state_machine__37085__auto____1 = (function (state_73019){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_73019);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e73023){var ex__37088__auto__ = e73023;
var statearr_73025_73136 = state_73019;
(statearr_73025_73136[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_73019[(4)]))){
var statearr_73026_73137 = state_73019;
(statearr_73026_73137[(1)] = cljs.core.first((state_73019[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__73138 = state_73019;
state_73019 = G__73138;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
frontend$db$transact$add_request_BANG__$_state_machine__37085__auto__ = function(state_73019){
switch(arguments.length){
case 0:
return frontend$db$transact$add_request_BANG__$_state_machine__37085__auto____0.call(this);
case 1:
return frontend$db$transact$add_request_BANG__$_state_machine__37085__auto____1.call(this,state_73019);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$db$transact$add_request_BANG__$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$db$transact$add_request_BANG__$_state_machine__37085__auto____0;
frontend$db$transact$add_request_BANG__$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$db$transact$add_request_BANG__$_state_machine__37085__auto____1;
return frontend$db$transact$add_request_BANG__$_state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_73027 = f__37595__auto__();
(statearr_73027[(6)] = c__37594__auto___73133);

return statearr_73027;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
}));


return resp;
});
frontend.db.transact.remove_request_BANG_ = (function frontend$db$transact$remove_request_BANG_(request_id){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.db.transact._STAR_unfinished_request_ids,cljs.core.disj,request_id);
});
frontend.db.transact.listen_for_requests = (function frontend$db$transact$listen_for_requests(){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["[debug] setup listen for worker request!"], 0));

var c__37594__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__37595__auto__ = (function (){var switch__37084__auto__ = (function (state_73073){
var state_val_73074 = (state_73073[(1)]);
if((state_val_73074 === (7))){
var inst_73069 = (state_73073[(2)]);
var state_73073__$1 = state_73073;
var statearr_73075_73139 = state_73073__$1;
(statearr_73075_73139[(2)] = inst_73069);

(statearr_73075_73139[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73074 === (1))){
var state_73073__$1 = state_73073;
var statearr_73076_73141 = state_73073__$1;
(statearr_73076_73141[(2)] = null);

(statearr_73076_73141[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73074 === (4))){
var inst_73031 = (state_73073[(7)]);
var inst_73031__$1 = (state_73073[(2)]);
var state_73073__$1 = (function (){var statearr_73077 = state_73073;
(statearr_73077[(7)] = inst_73031__$1);

return statearr_73077;
})();
if(cljs.core.truth_(inst_73031__$1)){
var statearr_73078_73142 = state_73073__$1;
(statearr_73078_73142[(1)] = (5));

} else {
var statearr_73079_73143 = state_73073__$1;
(statearr_73079_73143[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73074 === (15))){
var inst_73035 = (state_73073[(8)]);
var inst_73061 = (state_73073[(2)]);
var inst_73062 = frontend.db.transact.remove_request_BANG_(inst_73035);
var _ = (function (){var statearr_73080 = state_73073;
(statearr_73080[(4)] = cljs.core.rest((state_73073[(4)])));

return statearr_73080;
})();
var state_73073__$1 = (function (){var statearr_73081 = state_73073;
(statearr_73081[(9)] = inst_73061);

return statearr_73081;
})();
var statearr_73086_73144 = state_73073__$1;
(statearr_73086_73144[(2)] = inst_73062);

(statearr_73086_73144[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73074 === (13))){
var inst_73051 = (state_73073[(10)]);
var inst_73037 = (state_73073[(11)]);
var inst_73054 = new cljs.core.Keyword(null,"ex-message","ex-message",1526142375).cljs$core$IFn$_invoke$arity$1(inst_73051);
var inst_73055 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259).cljs$core$IFn$_invoke$arity$1(inst_73051);
var inst_73056 = console.error(inst_73054,inst_73055);
var inst_73057 = promesa.core.reject_BANG_(inst_73037,inst_73051);
var state_73073__$1 = (function (){var statearr_73090 = state_73073;
(statearr_73090[(12)] = inst_73056);

return statearr_73090;
})();
var statearr_73091_73145 = state_73073__$1;
(statearr_73091_73145[(2)] = inst_73057);

(statearr_73091_73145[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73074 === (6))){
var state_73073__$1 = state_73073;
var statearr_73095_73146 = state_73073__$1;
(statearr_73095_73146[(2)] = null);

(statearr_73095_73146[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73074 === (3))){
var inst_73071 = (state_73073[(2)]);
var state_73073__$1 = state_73073;
return cljs.core.async.impl.ioc_helpers.return_chan(state_73073__$1,inst_73071);
} else {
if((state_val_73074 === (12))){
var inst_73051 = (state_73073[(10)]);
var inst_73050 = (state_73073[(2)]);
var inst_73051__$1 = frontend.common.async_util.throw_err(inst_73050);
var inst_73052 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259).cljs$core$IFn$_invoke$arity$1(inst_73051__$1);
var state_73073__$1 = (function (){var statearr_73101 = state_73073;
(statearr_73101[(10)] = inst_73051__$1);

return statearr_73101;
})();
if(cljs.core.truth_(inst_73052)){
var statearr_73102_73147 = state_73073__$1;
(statearr_73102_73147[(1)] = (13));

} else {
var statearr_73103_73148 = state_73073__$1;
(statearr_73103_73148[(1)] = (14));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73074 === (2))){
var state_73073__$1 = state_73073;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_73073__$1,(4),frontend.db.transact.requests);
} else {
if((state_val_73074 === (11))){
var _ = (function (){var statearr_73107 = state_73073;
(statearr_73107[(4)] = cljs.core.rest((state_73073[(4)])));

return statearr_73107;
})();
var state_73073__$1 = state_73073;
var ex73100 = (state_73073__$1[(2)]);
var statearr_73111_73150 = state_73073__$1;
(statearr_73111_73150[(5)] = ex73100);


var statearr_73112_73151 = state_73073__$1;
(statearr_73112_73151[(1)] = (10));

(statearr_73112_73151[(5)] = null);



return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73074 === (9))){
var inst_73065 = (state_73073[(2)]);
var state_73073__$1 = (function (){var statearr_73113 = state_73073;
(statearr_73113[(13)] = inst_73065);

return statearr_73113;
})();
var statearr_73114_73153 = state_73073__$1;
(statearr_73114_73153[(2)] = null);

(statearr_73114_73153[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73074 === (5))){
var inst_73031 = (state_73073[(7)]);
var inst_73034 = cljs.core.__destructure_map(inst_73031);
var inst_73035 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_73034,new cljs.core.Keyword(null,"id","id",-1388402092));
var inst_73036 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_73034,new cljs.core.Keyword(null,"request","request",1772954723));
var inst_73037 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_73034,new cljs.core.Keyword(null,"response","response",-1068424192));
var state_73073__$1 = (function (){var statearr_73115 = state_73073;
(statearr_73115[(8)] = inst_73035);

(statearr_73115[(14)] = inst_73036);

(statearr_73115[(11)] = inst_73037);

return statearr_73115;
})();
var statearr_73116_73154 = state_73073__$1;
(statearr_73116_73154[(2)] = null);

(statearr_73116_73154[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73074 === (14))){
var inst_73037 = (state_73073[(11)]);
var inst_73051 = (state_73073[(10)]);
var inst_73059 = promesa.core.resolve_BANG_.cljs$core$IFn$_invoke$arity$2(inst_73037,inst_73051);
var state_73073__$1 = state_73073;
var statearr_73117_73155 = state_73073__$1;
(statearr_73117_73155[(2)] = inst_73059);

(statearr_73117_73155[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73074 === (10))){
var inst_73037 = (state_73073[(11)]);
var inst_73035 = (state_73073[(8)]);
var inst_73039 = (state_73073[(2)]);
var inst_73040 = promesa.core.reject_BANG_(inst_73037,inst_73039);
var inst_73041 = frontend.db.transact.remove_request_BANG_(inst_73035);
var state_73073__$1 = (function (){var statearr_73118 = state_73073;
(statearr_73118[(15)] = inst_73040);

return statearr_73118;
})();
var statearr_73119_73156 = state_73073__$1;
(statearr_73119_73156[(2)] = inst_73041);

(statearr_73119_73156[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73074 === (8))){
var inst_73036 = (state_73073[(14)]);
var _ = (function (){var statearr_73120 = state_73073;
(statearr_73120[(4)] = cljs.core.cons((11),(state_73073[(4)])));

return statearr_73120;
})();
var inst_73047 = (inst_73036.cljs$core$IFn$_invoke$arity$0 ? inst_73036.cljs$core$IFn$_invoke$arity$0() : inst_73036.call(null));
var inst_73048 = cljs.core.async.interop.p__GT_c(inst_73047);
var state_73073__$1 = state_73073;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_73073__$1,(12),inst_73048);
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
});
return (function() {
var frontend$db$transact$listen_for_requests_$_state_machine__37085__auto__ = null;
var frontend$db$transact$listen_for_requests_$_state_machine__37085__auto____0 = (function (){
var statearr_73121 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_73121[(0)] = frontend$db$transact$listen_for_requests_$_state_machine__37085__auto__);

(statearr_73121[(1)] = (1));

return statearr_73121;
});
var frontend$db$transact$listen_for_requests_$_state_machine__37085__auto____1 = (function (state_73073){
while(true){
var ret_value__37086__auto__ = (function (){try{while(true){
var result__37087__auto__ = switch__37084__auto__(state_73073);
if(cljs.core.keyword_identical_QMARK_(result__37087__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__37087__auto__;
}
break;
}
}catch (e73122){var ex__37088__auto__ = e73122;
var statearr_73123_73158 = state_73073;
(statearr_73123_73158[(2)] = ex__37088__auto__);


if(cljs.core.seq((state_73073[(4)]))){
var statearr_73124_73159 = state_73073;
(statearr_73124_73159[(1)] = cljs.core.first((state_73073[(4)])));

} else {
throw ex__37088__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__37086__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__73160 = state_73073;
state_73073 = G__73160;
continue;
} else {
return ret_value__37086__auto__;
}
break;
}
});
frontend$db$transact$listen_for_requests_$_state_machine__37085__auto__ = function(state_73073){
switch(arguments.length){
case 0:
return frontend$db$transact$listen_for_requests_$_state_machine__37085__auto____0.call(this);
case 1:
return frontend$db$transact$listen_for_requests_$_state_machine__37085__auto____1.call(this,state_73073);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$db$transact$listen_for_requests_$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$db$transact$listen_for_requests_$_state_machine__37085__auto____0;
frontend$db$transact$listen_for_requests_$_state_machine__37085__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$db$transact$listen_for_requests_$_state_machine__37085__auto____1;
return frontend$db$transact$listen_for_requests_$_state_machine__37085__auto__;
})()
})();
var state__37596__auto__ = (function (){var statearr_73125 = f__37595__auto__();
(statearr_73125[(6)] = c__37594__auto__);

return statearr_73125;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__37596__auto__);
}));

return c__37594__auto__;
});
frontend.db.transact.transact = (function frontend$db$transact$transact(worker_transact,repo,tx_data,tx_meta){
var request_id = frontend.db.transact.get_next_request_id();
var tx_meta_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(tx_meta,new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"local-tx?","local-tx?",-891534872),true], 0));
return frontend.db.transact.add_request_BANG_(request_id,(function frontend$db$transact$transact_$_async_request(){
return (worker_transact.cljs$core$IFn$_invoke$arity$3 ? worker_transact.cljs$core$IFn$_invoke$arity$3(repo,tx_data,tx_meta_SINGLEQUOTE_) : worker_transact.call(null,repo,tx_data,tx_meta_SINGLEQUOTE_));
}));
});

//# sourceMappingURL=frontend.db.transact.js.map
