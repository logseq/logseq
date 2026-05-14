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

var c__36895__auto___73313 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_73204){
var state_val_73205 = (state_73204[(1)]);
if((state_val_73205 === (1))){
var state_73204__$1 = state_73204;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_73204__$1,(2),frontend.db.transact.requests,new_request);
} else {
if((state_val_73205 === (2))){
var inst_73201 = (state_73204[(2)]);
var state_73204__$1 = state_73204;
return cljs.core.async.impl.ioc_helpers.return_chan(state_73204__$1,inst_73201);
} else {
return null;
}
}
});
return (function() {
var frontend$db$transact$add_request_BANG__$_state_machine__36595__auto__ = null;
var frontend$db$transact$add_request_BANG__$_state_machine__36595__auto____0 = (function (){
var statearr_73207 = [null,null,null,null,null,null,null];
(statearr_73207[(0)] = frontend$db$transact$add_request_BANG__$_state_machine__36595__auto__);

(statearr_73207[(1)] = (1));

return statearr_73207;
});
var frontend$db$transact$add_request_BANG__$_state_machine__36595__auto____1 = (function (state_73204){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_73204);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e73209){var ex__36598__auto__ = e73209;
var statearr_73210_73315 = state_73204;
(statearr_73210_73315[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_73204[(4)]))){
var statearr_73211_73316 = state_73204;
(statearr_73211_73316[(1)] = cljs.core.first((state_73204[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__73317 = state_73204;
state_73204 = G__73317;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
frontend$db$transact$add_request_BANG__$_state_machine__36595__auto__ = function(state_73204){
switch(arguments.length){
case 0:
return frontend$db$transact$add_request_BANG__$_state_machine__36595__auto____0.call(this);
case 1:
return frontend$db$transact$add_request_BANG__$_state_machine__36595__auto____1.call(this,state_73204);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$db$transact$add_request_BANG__$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$db$transact$add_request_BANG__$_state_machine__36595__auto____0;
frontend$db$transact$add_request_BANG__$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$db$transact$add_request_BANG__$_state_machine__36595__auto____1;
return frontend$db$transact$add_request_BANG__$_state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_73214 = f__36897__auto__();
(statearr_73214[(6)] = c__36895__auto___73313);

return statearr_73214;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));


return resp;
});
frontend.db.transact.remove_request_BANG_ = (function frontend$db$transact$remove_request_BANG_(request_id){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.db.transact._STAR_unfinished_request_ids,cljs.core.disj,request_id);
});
frontend.db.transact.listen_for_requests = (function frontend$db$transact$listen_for_requests(){
var c__36895__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__36897__auto__ = (function (){var switch__36594__auto__ = (function (state_73266){
var state_val_73267 = (state_73266[(1)]);
if((state_val_73267 === (7))){
var inst_73259 = (state_73266[(2)]);
var state_73266__$1 = state_73266;
var statearr_73268_73329 = state_73266__$1;
(statearr_73268_73329[(2)] = inst_73259);

(statearr_73268_73329[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73267 === (1))){
var state_73266__$1 = state_73266;
var statearr_73269_73330 = state_73266__$1;
(statearr_73269_73330[(2)] = null);

(statearr_73269_73330[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73267 === (4))){
var inst_73218 = (state_73266[(7)]);
var inst_73218__$1 = (state_73266[(2)]);
var state_73266__$1 = (function (){var statearr_73273 = state_73266;
(statearr_73273[(7)] = inst_73218__$1);

return statearr_73273;
})();
if(cljs.core.truth_(inst_73218__$1)){
var statearr_73274_73331 = state_73266__$1;
(statearr_73274_73331[(1)] = (5));

} else {
var statearr_73275_73332 = state_73266__$1;
(statearr_73275_73332[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73267 === (15))){
var inst_73222 = (state_73266[(8)]);
var inst_73251 = (state_73266[(2)]);
var inst_73252 = frontend.db.transact.remove_request_BANG_(inst_73222);
var _ = (function (){var statearr_73276 = state_73266;
(statearr_73276[(4)] = cljs.core.rest((state_73266[(4)])));

return statearr_73276;
})();
var state_73266__$1 = (function (){var statearr_73277 = state_73266;
(statearr_73277[(9)] = inst_73251);

return statearr_73277;
})();
var statearr_73278_73334 = state_73266__$1;
(statearr_73278_73334[(2)] = inst_73252);

(statearr_73278_73334[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73267 === (13))){
var inst_73241 = (state_73266[(10)]);
var inst_73224 = (state_73266[(11)]);
var inst_73244 = new cljs.core.Keyword(null,"ex-message","ex-message",1526142375).cljs$core$IFn$_invoke$arity$1(inst_73241);
var inst_73245 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259).cljs$core$IFn$_invoke$arity$1(inst_73241);
var inst_73246 = console.error(inst_73244,inst_73245);
var inst_73247 = promesa.core.reject_BANG_(inst_73224,inst_73241);
var state_73266__$1 = (function (){var statearr_73279 = state_73266;
(statearr_73279[(12)] = inst_73246);

return statearr_73279;
})();
var statearr_73280_73336 = state_73266__$1;
(statearr_73280_73336[(2)] = inst_73247);

(statearr_73280_73336[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73267 === (6))){
var state_73266__$1 = state_73266;
var statearr_73281_73337 = state_73266__$1;
(statearr_73281_73337[(2)] = null);

(statearr_73281_73337[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73267 === (3))){
var inst_73261 = (state_73266[(2)]);
var state_73266__$1 = state_73266;
return cljs.core.async.impl.ioc_helpers.return_chan(state_73266__$1,inst_73261);
} else {
if((state_val_73267 === (12))){
var inst_73241 = (state_73266[(10)]);
var inst_73240 = (state_73266[(2)]);
var inst_73241__$1 = frontend.common.async_util.throw_err(inst_73240);
var inst_73242 = new cljs.core.Keyword(null,"ex-data","ex-data",-309040259).cljs$core$IFn$_invoke$arity$1(inst_73241__$1);
var state_73266__$1 = (function (){var statearr_73285 = state_73266;
(statearr_73285[(10)] = inst_73241__$1);

return statearr_73285;
})();
if(cljs.core.truth_(inst_73242)){
var statearr_73286_73339 = state_73266__$1;
(statearr_73286_73339[(1)] = (13));

} else {
var statearr_73287_73340 = state_73266__$1;
(statearr_73287_73340[(1)] = (14));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73267 === (2))){
var state_73266__$1 = state_73266;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_73266__$1,(4),frontend.db.transact.requests);
} else {
if((state_val_73267 === (11))){
var _ = (function (){var statearr_73291 = state_73266;
(statearr_73291[(4)] = cljs.core.rest((state_73266[(4)])));

return statearr_73291;
})();
var state_73266__$1 = state_73266;
var ex73282 = (state_73266__$1[(2)]);
var statearr_73292_73341 = state_73266__$1;
(statearr_73292_73341[(5)] = ex73282);


var statearr_73293_73343 = state_73266__$1;
(statearr_73293_73343[(1)] = (10));

(statearr_73293_73343[(5)] = null);



return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73267 === (9))){
var inst_73255 = (state_73266[(2)]);
var state_73266__$1 = (function (){var statearr_73294 = state_73266;
(statearr_73294[(13)] = inst_73255);

return statearr_73294;
})();
var statearr_73295_73344 = state_73266__$1;
(statearr_73295_73344[(2)] = null);

(statearr_73295_73344[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73267 === (5))){
var inst_73218 = (state_73266[(7)]);
var inst_73221 = cljs.core.__destructure_map(inst_73218);
var inst_73222 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_73221,new cljs.core.Keyword(null,"id","id",-1388402092));
var inst_73223 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_73221,new cljs.core.Keyword(null,"request","request",1772954723));
var inst_73224 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_73221,new cljs.core.Keyword(null,"response","response",-1068424192));
var state_73266__$1 = (function (){var statearr_73296 = state_73266;
(statearr_73296[(8)] = inst_73222);

(statearr_73296[(14)] = inst_73223);

(statearr_73296[(11)] = inst_73224);

return statearr_73296;
})();
var statearr_73298_73346 = state_73266__$1;
(statearr_73298_73346[(2)] = null);

(statearr_73298_73346[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73267 === (14))){
var inst_73224 = (state_73266[(11)]);
var inst_73241 = (state_73266[(10)]);
var inst_73249 = promesa.core.resolve_BANG_.cljs$core$IFn$_invoke$arity$2(inst_73224,inst_73241);
var state_73266__$1 = state_73266;
var statearr_73300_73347 = state_73266__$1;
(statearr_73300_73347[(2)] = inst_73249);

(statearr_73300_73347[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73267 === (10))){
var inst_73224 = (state_73266[(11)]);
var inst_73222 = (state_73266[(8)]);
var inst_73229 = (state_73266[(2)]);
var inst_73230 = promesa.core.reject_BANG_(inst_73224,inst_73229);
var inst_73231 = frontend.db.transact.remove_request_BANG_(inst_73222);
var state_73266__$1 = (function (){var statearr_73301 = state_73266;
(statearr_73301[(15)] = inst_73230);

return statearr_73301;
})();
var statearr_73302_73348 = state_73266__$1;
(statearr_73302_73348[(2)] = inst_73231);

(statearr_73302_73348[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_73267 === (8))){
var inst_73223 = (state_73266[(14)]);
var _ = (function (){var statearr_73303 = state_73266;
(statearr_73303[(4)] = cljs.core.cons((11),(state_73266[(4)])));

return statearr_73303;
})();
var inst_73237 = (inst_73223.cljs$core$IFn$_invoke$arity$0 ? inst_73223.cljs$core$IFn$_invoke$arity$0() : inst_73223.call(null));
var inst_73238 = cljs.core.async.interop.p__GT_c(inst_73237);
var state_73266__$1 = state_73266;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_73266__$1,(12),inst_73238);
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
var frontend$db$transact$listen_for_requests_$_state_machine__36595__auto__ = null;
var frontend$db$transact$listen_for_requests_$_state_machine__36595__auto____0 = (function (){
var statearr_73304 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_73304[(0)] = frontend$db$transact$listen_for_requests_$_state_machine__36595__auto__);

(statearr_73304[(1)] = (1));

return statearr_73304;
});
var frontend$db$transact$listen_for_requests_$_state_machine__36595__auto____1 = (function (state_73266){
while(true){
var ret_value__36596__auto__ = (function (){try{while(true){
var result__36597__auto__ = switch__36594__auto__(state_73266);
if(cljs.core.keyword_identical_QMARK_(result__36597__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__36597__auto__;
}
break;
}
}catch (e73305){var ex__36598__auto__ = e73305;
var statearr_73306_73351 = state_73266;
(statearr_73306_73351[(2)] = ex__36598__auto__);


if(cljs.core.seq((state_73266[(4)]))){
var statearr_73310_73352 = state_73266;
(statearr_73310_73352[(1)] = cljs.core.first((state_73266[(4)])));

} else {
throw ex__36598__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__36596__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__73353 = state_73266;
state_73266 = G__73353;
continue;
} else {
return ret_value__36596__auto__;
}
break;
}
});
frontend$db$transact$listen_for_requests_$_state_machine__36595__auto__ = function(state_73266){
switch(arguments.length){
case 0:
return frontend$db$transact$listen_for_requests_$_state_machine__36595__auto____0.call(this);
case 1:
return frontend$db$transact$listen_for_requests_$_state_machine__36595__auto____1.call(this,state_73266);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$db$transact$listen_for_requests_$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$db$transact$listen_for_requests_$_state_machine__36595__auto____0;
frontend$db$transact$listen_for_requests_$_state_machine__36595__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$db$transact$listen_for_requests_$_state_machine__36595__auto____1;
return frontend$db$transact$listen_for_requests_$_state_machine__36595__auto__;
})()
})();
var state__36898__auto__ = (function (){var statearr_73311 = f__36897__auto__();
(statearr_73311[(6)] = c__36895__auto__);

return statearr_73311;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__36898__auto__);
}));

return c__36895__auto__;
});
frontend.db.transact.transact = (function frontend$db$transact$transact(worker_transact,repo,tx_data,tx_meta){
var request_id = frontend.db.transact.get_next_request_id();
var tx_meta_SINGLEQUOTE_ = cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(tx_meta,new cljs.core.Keyword(null,"request-id","request-id",-985684093),request_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"local-tx?","local-tx?",-891534872),true], 0));
return frontend.db.transact.add_request_BANG_(request_id,(function frontend$db$transact$transact_$_async_request(){
return (worker_transact.cljs$core$IFn$_invoke$arity$3 ? worker_transact.cljs$core$IFn$_invoke$arity$3(repo,tx_data,tx_meta_SINGLEQUOTE_) : worker_transact.call(null,repo,tx_data,tx_meta_SINGLEQUOTE_));
}));
});

//# sourceMappingURL=frontend.db.transact.js.map
