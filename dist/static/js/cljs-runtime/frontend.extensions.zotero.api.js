goog.provide('frontend.extensions.zotero.api');
frontend.extensions.zotero.api.config = (function frontend$extensions$zotero$api$config(){
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"api-version","api-version",108847181),(3),new cljs.core.Keyword(null,"base","base",185279322),"https://api.zotero.org",new cljs.core.Keyword(null,"timeout","timeout",-318625318),(150000),new cljs.core.Keyword(null,"api-key","api-key",1037904031),frontend.extensions.zotero.setting.api_key(),new cljs.core.Keyword(null,"type","type",1174270348),frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"type","type",1174270348)),new cljs.core.Keyword(null,"type-id","type-id",2030062700),frontend.extensions.zotero.setting.setting(new cljs.core.Keyword(null,"type-id","type-id",2030062700))], null);
});
/**
 * Creates a channel which will change put a new value to the output channel
 * after timeout has passed. Each value change resets the timeout. If value
 * changes more frequently only the latest value is put out.
 * When input channel closes, the output channel is closed.
 */
frontend.extensions.zotero.api.debounce = (function frontend$extensions$zotero$api$debounce(in$,ms){
var out = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$0();
var c__32195__auto___120178 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_119520){
var state_val_119524 = (state_119520[(1)]);
if((state_val_119524 === (7))){
var inst_119441 = (state_119520[(2)]);
var state_119520__$1 = state_119520;
var statearr_119540_120186 = state_119520__$1;
(statearr_119540_120186[(2)] = inst_119441);

(statearr_119540_120186[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119524 === (20))){
var state_119520__$1 = state_119520;
var statearr_119542_120192 = state_119520__$1;
(statearr_119542_120192[(2)] = null);

(statearr_119542_120192[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119524 === (1))){
var inst_119436 = null;
var state_119520__$1 = (function (){var statearr_119551 = state_119520;
(statearr_119551[(7)] = inst_119436);

return statearr_119551;
})();
var statearr_119554_120193 = state_119520__$1;
(statearr_119554_120193[(2)] = null);

(statearr_119554_120193[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119524 === (4))){
var state_119520__$1 = state_119520;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_119520__$1,(7),in$);
} else {
if((state_val_119524 === (15))){
var inst_119475 = (state_119520[(8)]);
var inst_119444 = (state_119520[(9)]);
var inst_119498 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_119475,(0),null);
var state_119520__$1 = (function (){var statearr_119565 = state_119520;
(statearr_119565[(10)] = inst_119498);

return statearr_119565;
})();
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_119520__$1,(18),out,inst_119444);
} else {
if((state_val_119524 === (21))){
var inst_119508 = (state_119520[(2)]);
var state_119520__$1 = state_119520;
var statearr_119568_120195 = state_119520__$1;
(statearr_119568_120195[(2)] = inst_119508);

(statearr_119568_120195[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119524 === (13))){
var inst_119488 = cljs.core.async.close_BANG_(out);
var state_119520__$1 = state_119520;
var statearr_119572_120196 = state_119520__$1;
(statearr_119572_120196[(2)] = inst_119488);

(statearr_119572_120196[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119524 === (6))){
var inst_119456 = (state_119520[(11)]);
var inst_119446 = (state_119520[(12)]);
var inst_119444 = (state_119520[(2)]);
var inst_119446__$1 = cljs.core.async.timeout(ms);
var inst_119456__$1 = in$;
var inst_119471 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_119472 = [inst_119456__$1,inst_119446__$1];
var inst_119473 = (new cljs.core.PersistentVector(null,2,(5),inst_119471,inst_119472,null));
var state_119520__$1 = (function (){var statearr_119583 = state_119520;
(statearr_119583[(9)] = inst_119444);

(statearr_119583[(12)] = inst_119446__$1);

(statearr_119583[(11)] = inst_119456__$1);

return statearr_119583;
})();
return cljs.core.async.ioc_alts_BANG_(state_119520__$1,(8),inst_119473);
} else {
if((state_val_119524 === (17))){
var inst_119510 = (state_119520[(2)]);
var state_119520__$1 = state_119520;
var statearr_119591_120202 = state_119520__$1;
(statearr_119591_120202[(2)] = inst_119510);

(statearr_119591_120202[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119524 === (3))){
var inst_119514 = (state_119520[(2)]);
var state_119520__$1 = state_119520;
return cljs.core.async.impl.ioc_helpers.return_chan(state_119520__$1,inst_119514);
} else {
if((state_val_119524 === (12))){
var inst_119484 = (state_119520[(13)]);
var inst_119436 = inst_119484;
var state_119520__$1 = (function (){var statearr_119593 = state_119520;
(statearr_119593[(7)] = inst_119436);

return statearr_119593;
})();
var statearr_119597_120203 = state_119520__$1;
(statearr_119597_120203[(2)] = null);

(statearr_119597_120203[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119524 === (2))){
var inst_119436 = (state_119520[(7)]);
var inst_119438 = (inst_119436 == null);
var state_119520__$1 = state_119520;
if(cljs.core.truth_(inst_119438)){
var statearr_119609_120208 = state_119520__$1;
(statearr_119609_120208[(1)] = (4));

} else {
var statearr_119611_120209 = state_119520__$1;
(statearr_119611_120209[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119524 === (19))){
var inst_119476 = (state_119520[(14)]);
var state_119520__$1 = state_119520;
var statearr_119614_120211 = state_119520__$1;
(statearr_119614_120211[(2)] = inst_119476);

(statearr_119614_120211[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119524 === (11))){
var inst_119512 = (state_119520[(2)]);
var state_119520__$1 = state_119520;
var statearr_119618_120213 = state_119520__$1;
(statearr_119618_120213[(2)] = inst_119512);

(statearr_119618_120213[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119524 === (9))){
var inst_119475 = (state_119520[(8)]);
var inst_119484 = (state_119520[(13)]);
var inst_119484__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_119475,(0),null);
var state_119520__$1 = (function (){var statearr_119623 = state_119520;
(statearr_119623[(13)] = inst_119484__$1);

return statearr_119623;
})();
if(cljs.core.truth_(inst_119484__$1)){
var statearr_119624_120214 = state_119520__$1;
(statearr_119624_120214[(1)] = (12));

} else {
var statearr_119626_120216 = state_119520__$1;
(statearr_119626_120216[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119524 === (5))){
var inst_119436 = (state_119520[(7)]);
var state_119520__$1 = state_119520;
var statearr_119631_120218 = state_119520__$1;
(statearr_119631_120218[(2)] = inst_119436);

(statearr_119631_120218[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119524 === (14))){
var inst_119490 = (state_119520[(2)]);
var state_119520__$1 = state_119520;
var statearr_119637_120219 = state_119520__$1;
(statearr_119637_120219[(2)] = inst_119490);

(statearr_119637_120219[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119524 === (16))){
var inst_119477 = (state_119520[(15)]);
var inst_119504 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_119477,new cljs.core.Keyword(null,"default","default",-1987822328));
var state_119520__$1 = state_119520;
if(inst_119504){
var statearr_119643_120223 = state_119520__$1;
(statearr_119643_120223[(1)] = (19));

} else {
var statearr_119644_120224 = state_119520__$1;
(statearr_119644_120224[(1)] = (20));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119524 === (10))){
var inst_119477 = (state_119520[(15)]);
var inst_119446 = (state_119520[(12)]);
var inst_119492 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_119477,inst_119446);
var state_119520__$1 = state_119520;
if(inst_119492){
var statearr_119648_120225 = state_119520__$1;
(statearr_119648_120225[(1)] = (15));

} else {
var statearr_119649_120226 = state_119520__$1;
(statearr_119649_120226[(1)] = (16));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119524 === (18))){
var inst_119500 = (state_119520[(2)]);
var inst_119436 = null;
var state_119520__$1 = (function (){var statearr_119652 = state_119520;
(statearr_119652[(16)] = inst_119500);

(statearr_119652[(7)] = inst_119436);

return statearr_119652;
})();
var statearr_119655_120229 = state_119520__$1;
(statearr_119655_120229[(2)] = null);

(statearr_119655_120229[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119524 === (8))){
var inst_119475 = (state_119520[(8)]);
var inst_119477 = (state_119520[(15)]);
var inst_119456 = (state_119520[(11)]);
var inst_119475__$1 = (state_119520[(2)]);
var inst_119476 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_119475__$1,(0),null);
var inst_119477__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_119475__$1,(1),null);
var inst_119478 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_119477__$1,inst_119456);
var state_119520__$1 = (function (){var statearr_119659 = state_119520;
(statearr_119659[(8)] = inst_119475__$1);

(statearr_119659[(14)] = inst_119476);

(statearr_119659[(15)] = inst_119477__$1);

return statearr_119659;
})();
if(inst_119478){
var statearr_119665_120231 = state_119520__$1;
(statearr_119665_120231[(1)] = (9));

} else {
var statearr_119667_120232 = state_119520__$1;
(statearr_119667_120232[(1)] = (10));

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
var frontend$extensions$zotero$api$debounce_$_state_machine__32004__auto__ = null;
var frontend$extensions$zotero$api$debounce_$_state_machine__32004__auto____0 = (function (){
var statearr_119668 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_119668[(0)] = frontend$extensions$zotero$api$debounce_$_state_machine__32004__auto__);

(statearr_119668[(1)] = (1));

return statearr_119668;
});
var frontend$extensions$zotero$api$debounce_$_state_machine__32004__auto____1 = (function (state_119520){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_119520);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e119670){var ex__32007__auto__ = e119670;
var statearr_119672_120236 = state_119520;
(statearr_119672_120236[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_119520[(4)]))){
var statearr_119674_120237 = state_119520;
(statearr_119674_120237[(1)] = cljs.core.first((state_119520[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__120240 = state_119520;
state_119520 = G__120240;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$extensions$zotero$api$debounce_$_state_machine__32004__auto__ = function(state_119520){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$api$debounce_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$extensions$zotero$api$debounce_$_state_machine__32004__auto____1.call(this,state_119520);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$api$debounce_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$api$debounce_$_state_machine__32004__auto____0;
frontend$extensions$zotero$api$debounce_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$api$debounce_$_state_machine__32004__auto____1;
return frontend$extensions$zotero$api$debounce_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_119676 = f__32196__auto__();
(statearr_119676[(6)] = c__32195__auto___120178);

return statearr_119676;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));


return out;
});
frontend.extensions.zotero.api.parse_start = (function frontend$extensions$zotero$api$parse_start(headers,next_or_prev){
var include_text = (function (){var G__119679 = next_or_prev;
var G__119679__$1 = (((G__119679 instanceof cljs.core.Keyword))?G__119679.fqn:null);
switch (G__119679__$1) {
case "next":
return "rel=\"next\"";

break;
case "prev":
return "rel=\"prev\"";

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__119679__$1)].join('')));

}
})();
var links = clojure.string.split.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"link","link",-1769163468).cljs$core$IFn$_invoke$arity$1(camel_snake_kebab.extras.transform_keys(camel_snake_kebab.core.__GT_kebab_case_keyword,headers)),",");
var next_link = cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (l){
return clojure.string.includes_QMARK_(l,include_text);
}),links));
if(cljs.core.truth_(next_link)){
var start = clojure.string.index_of.cljs$core$IFn$_invoke$arity$2(next_link,"<");
var end = clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$2(next_link,">;");
var next_url = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(next_link,(start + (1)),end);
var or__5002__auto__ = new cljs.core.Keyword(null,"start","start",-355208981).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"query-params","query-params",900640534).cljs$core$IFn$_invoke$arity$1(cljs_http.client.parse_url(next_url)));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "0";
}
} else {
return null;
}
});
frontend.extensions.zotero.api.get_results_count = (function frontend$extensions$zotero$api$get_results_count(headers){
return frontend.util.safe_parse_int(new cljs.core.Keyword(null,"total-results","total-results",-1147068713).cljs$core$IFn$_invoke$arity$1(camel_snake_kebab.extras.transform_keys(camel_snake_kebab.core.__GT_kebab_case_keyword,headers)));
});
frontend.extensions.zotero.api.get_STAR_ = (function frontend$extensions$zotero$api$get_STAR_(var_args){
var G__119696 = arguments.length;
switch (G__119696) {
case 2:
return frontend.extensions.zotero.api.get_STAR_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.extensions.zotero.api.get_STAR_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.extensions.zotero.api.get_STAR_.cljs$core$IFn$_invoke$arity$2 = (function (config_SINGLEQUOTE_,api){
return frontend.extensions.zotero.api.get_STAR_.cljs$core$IFn$_invoke$arity$3(config_SINGLEQUOTE_,api,null);
}));

(frontend.extensions.zotero.api.get_STAR_.cljs$core$IFn$_invoke$arity$3 = (function (config_SINGLEQUOTE_,api,query_params){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_119784){
var state_val_119785 = (state_119784[(1)]);
if((state_val_119785 === (7))){
var inst_119739 = (state_119784[(7)]);
var state_119784__$1 = state_119784;
var statearr_119794_120251 = state_119784__$1;
(statearr_119794_120251[(2)] = inst_119739);

(statearr_119794_120251[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119785 === (1))){
var inst_119708 = config_SINGLEQUOTE_;
var inst_119709 = cljs.core.__destructure_map(inst_119708);
var inst_119710 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_119709,new cljs.core.Keyword(null,"api-version","api-version",108847181));
var inst_119711 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_119709,new cljs.core.Keyword(null,"base","base",185279322));
var inst_119713 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_119709,new cljs.core.Keyword(null,"type","type",1174270348));
var inst_119714 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_119709,new cljs.core.Keyword(null,"type-id","type-id",2030062700));
var inst_119715 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_119709,new cljs.core.Keyword(null,"api-key","api-key",1037904031));
var inst_119716 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_119709,new cljs.core.Keyword(null,"timeout","timeout",-318625318));
var inst_119718 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_119713,new cljs.core.Keyword(null,"user","user",1532431356));
var state_119784__$1 = (function (){var statearr_119797 = state_119784;
(statearr_119797[(8)] = inst_119710);

(statearr_119797[(9)] = inst_119711);

(statearr_119797[(10)] = inst_119714);

(statearr_119797[(11)] = inst_119715);

(statearr_119797[(12)] = inst_119716);

return statearr_119797;
})();
if(inst_119718){
var statearr_119800_120254 = state_119784__$1;
(statearr_119800_120254[(1)] = (3));

} else {
var statearr_119801_120255 = state_119784__$1;
(statearr_119801_120255[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119785 === (4))){
var state_119784__$1 = state_119784;
var statearr_119803_120258 = state_119784__$1;
(statearr_119803_120258[(2)] = "/groups/");

(statearr_119803_120258[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119785 === (15))){
var inst_119768 = (state_119784[(13)]);
var inst_119752 = (state_119784[(14)]);
var inst_119773 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(inst_119768,new cljs.core.Keyword(null,"count","count",2139924085),inst_119752);
var state_119784__$1 = state_119784;
var statearr_119804_120259 = state_119784__$1;
(statearr_119804_120259[(2)] = inst_119773);

(statearr_119804_120259[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119785 === (13))){
var inst_119763 = (state_119784[(15)]);
var state_119784__$1 = state_119784;
var statearr_119805_120262 = state_119784__$1;
(statearr_119805_120262[(2)] = inst_119763);

(statearr_119805_120262[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119785 === (6))){
var inst_119741 = (state_119784[(16)]);
var inst_119743 = (state_119784[(17)]);
var inst_119750 = (state_119784[(18)]);
var inst_119748 = camel_snake_kebab.extras.transform_keys(camel_snake_kebab.core.__GT_kebab_case_keyword,inst_119741);
var inst_119750__$1 = frontend.extensions.zotero.api.parse_start(inst_119743,new cljs.core.Keyword(null,"next","next",-117701485));
var inst_119751 = frontend.extensions.zotero.api.parse_start(inst_119743,new cljs.core.Keyword(null,"prev","prev",-1597069226));
var inst_119752 = frontend.extensions.zotero.api.get_results_count(inst_119743);
var inst_119756 = [new cljs.core.Keyword(null,"result","result",1415092211)];
var inst_119757 = [inst_119748];
var inst_119758 = cljs.core.PersistentHashMap.fromArrays(inst_119756,inst_119757);
var state_119784__$1 = (function (){var statearr_119807 = state_119784;
(statearr_119807[(18)] = inst_119750__$1);

(statearr_119807[(19)] = inst_119751);

(statearr_119807[(14)] = inst_119752);

(statearr_119807[(20)] = inst_119758);

return statearr_119807;
})();
if(cljs.core.truth_(inst_119750__$1)){
var statearr_119810_120265 = state_119784__$1;
(statearr_119810_120265[(1)] = (9));

} else {
var statearr_119811_120266 = state_119784__$1;
(statearr_119811_120266[(1)] = (10));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119785 === (17))){
var inst_119776 = (state_119784[(2)]);
var state_119784__$1 = state_119784;
var statearr_119813_120268 = state_119784__$1;
(statearr_119813_120268[(2)] = inst_119776);

(statearr_119813_120268[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119785 === (3))){
var state_119784__$1 = state_119784;
var statearr_119816_120270 = state_119784__$1;
(statearr_119816_120270[(2)] = "/users/");

(statearr_119816_120270[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119785 === (12))){
var inst_119763 = (state_119784[(15)]);
var inst_119751 = (state_119784[(19)]);
var inst_119765 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(inst_119763,new cljs.core.Keyword(null,"prev","prev",-1597069226),inst_119751);
var state_119784__$1 = state_119784;
var statearr_119821_120272 = state_119784__$1;
(statearr_119821_120272[(2)] = inst_119765);

(statearr_119821_120272[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119785 === (2))){
var inst_119739 = (state_119784[(7)]);
var inst_119738 = (state_119784[(2)]);
var inst_119739__$1 = cljs.core.__destructure_map(inst_119738);
var inst_119740 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_119739__$1,new cljs.core.Keyword(null,"success","success",1890645906));
var inst_119741 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_119739__$1,new cljs.core.Keyword(null,"body","body",-2049205669));
var inst_119743 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_119739__$1,new cljs.core.Keyword(null,"headers","headers",-835030129));
var state_119784__$1 = (function (){var statearr_119827 = state_119784;
(statearr_119827[(7)] = inst_119739__$1);

(statearr_119827[(16)] = inst_119741);

(statearr_119827[(17)] = inst_119743);

return statearr_119827;
})();
if(cljs.core.truth_(inst_119740)){
var statearr_119829_120273 = state_119784__$1;
(statearr_119829_120273[(1)] = (6));

} else {
var statearr_119830_120274 = state_119784__$1;
(statearr_119830_120274[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119785 === (11))){
var inst_119751 = (state_119784[(19)]);
var inst_119763 = (state_119784[(2)]);
var state_119784__$1 = (function (){var statearr_119833 = state_119784;
(statearr_119833[(15)] = inst_119763);

return statearr_119833;
})();
if(cljs.core.truth_(inst_119751)){
var statearr_119834_120278 = state_119784__$1;
(statearr_119834_120278[(1)] = (12));

} else {
var statearr_119837_120279 = state_119784__$1;
(statearr_119837_120279[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119785 === (9))){
var inst_119758 = (state_119784[(20)]);
var inst_119750 = (state_119784[(18)]);
var inst_119760 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(inst_119758,new cljs.core.Keyword(null,"next","next",-117701485),inst_119750);
var state_119784__$1 = state_119784;
var statearr_119841_120282 = state_119784__$1;
(statearr_119841_120282[(2)] = inst_119760);

(statearr_119841_120282[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119785 === (5))){
var inst_119711 = (state_119784[(9)]);
var inst_119714 = (state_119784[(10)]);
var inst_119715 = (state_119784[(11)]);
var inst_119710 = (state_119784[(8)]);
var inst_119716 = (state_119784[(12)]);
var inst_119723 = (state_119784[(2)]);
var inst_119724 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(inst_119711),inst_119723,cljs.core.str.cljs$core$IFn$_invoke$arity$1(inst_119714),cljs.core.str.cljs$core$IFn$_invoke$arity$1(api)].join('');
var inst_119729 = [new cljs.core.Keyword(null,"timeout","timeout",-318625318),new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222),new cljs.core.Keyword(null,"headers","headers",-835030129),new cljs.core.Keyword(null,"query-params","query-params",900640534)];
var inst_119730 = ["Zotero-API-Key","Zotero-API-Version"];
var inst_119731 = [inst_119715,inst_119710];
var inst_119732 = cljs.core.PersistentHashMap.fromArrays(inst_119730,inst_119731);
var inst_119733 = camel_snake_kebab.extras.transform_keys(camel_snake_kebab.core.__GT_camelCaseString,query_params);
var inst_119734 = [inst_119716,false,inst_119732,inst_119733];
var inst_119735 = cljs.core.PersistentHashMap.fromArrays(inst_119729,inst_119734);
var inst_119736 = cljs_http.client.get.cljs$core$IFn$_invoke$arity$variadic(inst_119724,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inst_119735], 0));
var state_119784__$1 = state_119784;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_119784__$1,(2),inst_119736);
} else {
if((state_val_119785 === (14))){
var inst_119752 = (state_119784[(14)]);
var inst_119768 = (state_119784[(2)]);
var state_119784__$1 = (function (){var statearr_119842 = state_119784;
(statearr_119842[(13)] = inst_119768);

return statearr_119842;
})();
if(cljs.core.truth_(inst_119752)){
var statearr_119843_120289 = state_119784__$1;
(statearr_119843_120289[(1)] = (15));

} else {
var statearr_119845_120290 = state_119784__$1;
(statearr_119845_120290[(1)] = (16));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119785 === (16))){
var inst_119768 = (state_119784[(13)]);
var state_119784__$1 = state_119784;
var statearr_119852_120292 = state_119784__$1;
(statearr_119852_120292[(2)] = inst_119768);

(statearr_119852_120292[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119785 === (10))){
var inst_119758 = (state_119784[(20)]);
var state_119784__$1 = state_119784;
var statearr_119853_120294 = state_119784__$1;
(statearr_119853_120294[(2)] = inst_119758);

(statearr_119853_120294[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119785 === (8))){
var inst_119780 = (state_119784[(2)]);
var state_119784__$1 = state_119784;
return cljs.core.async.impl.ioc_helpers.return_chan(state_119784__$1,inst_119780);
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
});
return (function() {
var frontend$extensions$zotero$api$state_machine__32004__auto__ = null;
var frontend$extensions$zotero$api$state_machine__32004__auto____0 = (function (){
var statearr_119854 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_119854[(0)] = frontend$extensions$zotero$api$state_machine__32004__auto__);

(statearr_119854[(1)] = (1));

return statearr_119854;
});
var frontend$extensions$zotero$api$state_machine__32004__auto____1 = (function (state_119784){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_119784);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e119855){var ex__32007__auto__ = e119855;
var statearr_119856_120297 = state_119784;
(statearr_119856_120297[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_119784[(4)]))){
var statearr_119857_120299 = state_119784;
(statearr_119857_120299[(1)] = cljs.core.first((state_119784[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__120301 = state_119784;
state_119784 = G__120301;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$extensions$zotero$api$state_machine__32004__auto__ = function(state_119784){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$api$state_machine__32004__auto____0.call(this);
case 1:
return frontend$extensions$zotero$api$state_machine__32004__auto____1.call(this,state_119784);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$api$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$api$state_machine__32004__auto____0;
frontend$extensions$zotero$api$state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$api$state_machine__32004__auto____1;
return frontend$extensions$zotero$api$state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_119859 = f__32196__auto__();
(statearr_119859[(6)] = c__32195__auto__);

return statearr_119859;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
}));

(frontend.extensions.zotero.api.get_STAR_.cljs$lang$maxFixedArity = 3);

frontend.extensions.zotero.api.item = (function frontend$extensions$zotero$api$item(key){
return new cljs.core.Keyword(null,"result","result",1415092211).cljs$core$IFn$_invoke$arity$1(frontend.extensions.zotero.api.get_STAR_.cljs$core$IFn$_invoke$arity$2(frontend.extensions.zotero.api.config(),["/items/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(key)].join('')));
});
frontend.extensions.zotero.api.all_top_items_count = (function frontend$extensions$zotero$api$all_top_items_count(){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_119880){
var state_val_119881 = (state_119880[(1)]);
if((state_val_119881 === (1))){
var inst_119869 = frontend.extensions.zotero.api.config();
var inst_119870 = [new cljs.core.Keyword(null,"limit","limit",-1355822363),new cljs.core.Keyword(null,"item-type","item-type",-73995695)];
var inst_119873 = [(1),"-attachment"];
var inst_119874 = cljs.core.PersistentHashMap.fromArrays(inst_119870,inst_119873);
var inst_119875 = frontend.extensions.zotero.api.get_STAR_.cljs$core$IFn$_invoke$arity$3(inst_119869,"/items/top",inst_119874);
var state_119880__$1 = state_119880;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_119880__$1,(2),inst_119875);
} else {
if((state_val_119881 === (2))){
var inst_119877 = (state_119880[(2)]);
var inst_119878 = new cljs.core.Keyword(null,"count","count",2139924085).cljs$core$IFn$_invoke$arity$1(inst_119877);
var state_119880__$1 = state_119880;
return cljs.core.async.impl.ioc_helpers.return_chan(state_119880__$1,inst_119878);
} else {
return null;
}
}
});
return (function() {
var frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32004__auto__ = null;
var frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32004__auto____0 = (function (){
var statearr_119891 = [null,null,null,null,null,null,null];
(statearr_119891[(0)] = frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32004__auto__);

(statearr_119891[(1)] = (1));

return statearr_119891;
});
var frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32004__auto____1 = (function (state_119880){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_119880);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e119896){var ex__32007__auto__ = e119896;
var statearr_119897_120305 = state_119880;
(statearr_119897_120305[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_119880[(4)]))){
var statearr_119898_120306 = state_119880;
(statearr_119898_120306[(1)] = cljs.core.first((state_119880[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__120307 = state_119880;
state_119880 = G__120307;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32004__auto__ = function(state_119880){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32004__auto____1.call(this,state_119880);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32004__auto____0;
frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32004__auto____1;
return frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_119901 = f__32196__auto__();
(statearr_119901[(6)] = c__32195__auto__);

return statearr_119901;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
frontend.extensions.zotero.api.all_top_items = (function frontend$extensions$zotero$api$all_top_items(){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_119944){
var state_val_119945 = (state_119944[(1)]);
if((state_val_119945 === (7))){
var inst_119940 = (state_119944[(2)]);
var state_119944__$1 = state_119944;
var statearr_119950_120317 = state_119944__$1;
(statearr_119950_120317[(2)] = inst_119940);

(statearr_119950_120317[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119945 === (1))){
var inst_119904 = cljs.core.PersistentVector.EMPTY;
var inst_119905 = "0";
var inst_119906 = inst_119904;
var state_119944__$1 = (function (){var statearr_119952 = state_119944;
(statearr_119952[(7)] = inst_119905);

(statearr_119952[(8)] = inst_119906);

return statearr_119952;
})();
var statearr_119954_120330 = state_119944__$1;
(statearr_119954_120330[(2)] = null);

(statearr_119954_120330[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119945 === (4))){
var inst_119916 = (state_119944[(2)]);
var inst_119917 = cljs.core.__destructure_map(inst_119916);
var inst_119918 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_119917,new cljs.core.Keyword(null,"success","success",1890645906));
var inst_119919 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_119917,new cljs.core.Keyword(null,"next","next",-117701485));
var inst_119920 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_119917,new cljs.core.Keyword(null,"result","result",1415092211));
var inst_119921 = inst_119918 === false;
var state_119944__$1 = (function (){var statearr_119958 = state_119944;
(statearr_119958[(9)] = inst_119919);

(statearr_119958[(10)] = inst_119920);

return statearr_119958;
})();
if(cljs.core.truth_(inst_119921)){
var statearr_119961_120337 = state_119944__$1;
(statearr_119961_120337[(1)] = (5));

} else {
var statearr_119962_120338 = state_119944__$1;
(statearr_119962_120338[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119945 === (13))){
var inst_119936 = (state_119944[(2)]);
var state_119944__$1 = state_119944;
var statearr_119963_120343 = state_119944__$1;
(statearr_119963_120343[(2)] = inst_119936);

(statearr_119963_120343[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119945 === (6))){
var inst_119919 = (state_119944[(9)]);
var state_119944__$1 = state_119944;
if(cljs.core.truth_(inst_119919)){
var statearr_119967_120348 = state_119944__$1;
(statearr_119967_120348[(1)] = (8));

} else {
var statearr_119969_120349 = state_119944__$1;
(statearr_119969_120349[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119945 === (3))){
var inst_119942 = (state_119944[(2)]);
var state_119944__$1 = state_119944;
return cljs.core.async.impl.ioc_helpers.return_chan(state_119944__$1,inst_119942);
} else {
if((state_val_119945 === (12))){
var state_119944__$1 = state_119944;
var statearr_119972_120362 = state_119944__$1;
(statearr_119972_120362[(2)] = null);

(statearr_119972_120362[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119945 === (2))){
var inst_119905 = (state_119944[(7)]);
var inst_119909 = frontend.extensions.zotero.api.config();
var inst_119911 = [new cljs.core.Keyword(null,"item-type","item-type",-73995695),new cljs.core.Keyword(null,"start","start",-355208981)];
var inst_119912 = ["-attachment",inst_119905];
var inst_119913 = cljs.core.PersistentHashMap.fromArrays(inst_119911,inst_119912);
var inst_119914 = frontend.extensions.zotero.api.get_STAR_.cljs$core$IFn$_invoke$arity$3(inst_119909,"/items/top",inst_119913);
var state_119944__$1 = state_119944;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_119944__$1,(4),inst_119914);
} else {
if((state_val_119945 === (11))){
var inst_119906 = (state_119944[(8)]);
var inst_119920 = (state_119944[(10)]);
var inst_119931 = cljs.core.PersistentVector.EMPTY;
var inst_119932 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(inst_119906,inst_119920);
var inst_119933 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(inst_119931,inst_119932);
var state_119944__$1 = state_119944;
var statearr_119976_120366 = state_119944__$1;
(statearr_119976_120366[(2)] = inst_119933);

(statearr_119976_120366[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119945 === (9))){
var state_119944__$1 = state_119944;
var statearr_119978_120368 = state_119944__$1;
(statearr_119978_120368[(1)] = (11));



return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119945 === (5))){
var inst_119906 = (state_119944[(8)]);
var state_119944__$1 = state_119944;
var statearr_119981_120370 = state_119944__$1;
(statearr_119981_120370[(2)] = inst_119906);

(statearr_119981_120370[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119945 === (10))){
var inst_119938 = (state_119944[(2)]);
var state_119944__$1 = state_119944;
var statearr_119984_120371 = state_119944__$1;
(statearr_119984_120371[(2)] = inst_119938);

(statearr_119984_120371[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_119945 === (8))){
var inst_119906 = (state_119944[(8)]);
var inst_119920 = (state_119944[(10)]);
var inst_119919 = (state_119944[(9)]);
var inst_119925 = cljs.core.PersistentVector.EMPTY;
var inst_119926 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(inst_119906,inst_119920);
var inst_119927 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(inst_119925,inst_119926);
var inst_119905 = inst_119919;
var inst_119906__$1 = inst_119927;
var state_119944__$1 = (function (){var statearr_119990 = state_119944;
(statearr_119990[(7)] = inst_119905);

(statearr_119990[(8)] = inst_119906__$1);

return statearr_119990;
})();
var statearr_119992_120373 = state_119944__$1;
(statearr_119992_120373[(2)] = null);

(statearr_119992_120373[(1)] = (2));


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
});
return (function() {
var frontend$extensions$zotero$api$all_top_items_$_state_machine__32004__auto__ = null;
var frontend$extensions$zotero$api$all_top_items_$_state_machine__32004__auto____0 = (function (){
var statearr_119995 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_119995[(0)] = frontend$extensions$zotero$api$all_top_items_$_state_machine__32004__auto__);

(statearr_119995[(1)] = (1));

return statearr_119995;
});
var frontend$extensions$zotero$api$all_top_items_$_state_machine__32004__auto____1 = (function (state_119944){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_119944);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e119998){var ex__32007__auto__ = e119998;
var statearr_120001_120377 = state_119944;
(statearr_120001_120377[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_119944[(4)]))){
var statearr_120007_120380 = state_119944;
(statearr_120007_120380[(1)] = cljs.core.first((state_119944[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__120382 = state_119944;
state_119944 = G__120382;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$extensions$zotero$api$all_top_items_$_state_machine__32004__auto__ = function(state_119944){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$api$all_top_items_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$extensions$zotero$api$all_top_items_$_state_machine__32004__auto____1.call(this,state_119944);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$api$all_top_items_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$api$all_top_items_$_state_machine__32004__auto____0;
frontend$extensions$zotero$api$all_top_items_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$api$all_top_items_$_state_machine__32004__auto____1;
return frontend$extensions$zotero$api$all_top_items_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_120009 = f__32196__auto__();
(statearr_120009[(6)] = c__32195__auto__);

return statearr_120009;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
/**
 * Query all top level items except attachments
 */
frontend.extensions.zotero.api.query_top_items = (function frontend$extensions$zotero$api$query_top_items(var_args){
var G__120019 = arguments.length;
switch (G__120019) {
case 1:
return frontend.extensions.zotero.api.query_top_items.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.extensions.zotero.api.query_top_items.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.extensions.zotero.api.query_top_items.cljs$core$IFn$_invoke$arity$1 = (function (term){
return frontend.extensions.zotero.api.query_top_items.cljs$core$IFn$_invoke$arity$2(term,"0");
}));

(frontend.extensions.zotero.api.query_top_items.cljs$core$IFn$_invoke$arity$2 = (function (term,start){
return frontend.extensions.zotero.api.get_STAR_.cljs$core$IFn$_invoke$arity$3(frontend.extensions.zotero.api.config(),"/items/top",new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"qmode","qmode",1066956365),"everything",new cljs.core.Keyword(null,"q","q",689001697),term,new cljs.core.Keyword(null,"limit","limit",-1355822363),(10),new cljs.core.Keyword(null,"item-type","item-type",-73995695),"-attachment",new cljs.core.Keyword(null,"start","start",-355208981),start], null));
}));

(frontend.extensions.zotero.api.query_top_items.cljs$lang$maxFixedArity = 2);

frontend.extensions.zotero.api.all_children_items = (function frontend$extensions$zotero$api$all_children_items(key,type){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_120093){
var state_val_120094 = (state_120093[(1)]);
if((state_val_120094 === (7))){
var inst_120087 = (state_120093[(2)]);
var state_120093__$1 = state_120093;
var statearr_120102_120395 = state_120093__$1;
(statearr_120102_120395[(2)] = inst_120087);

(statearr_120102_120395[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120094 === (1))){
var inst_120044 = cljs.core.PersistentVector.EMPTY;
var inst_120046 = "0";
var inst_120047 = inst_120044;
var state_120093__$1 = (function (){var statearr_120105 = state_120093;
(statearr_120105[(7)] = inst_120046);

(statearr_120105[(8)] = inst_120047);

return statearr_120105;
})();
var statearr_120106_120401 = state_120093__$1;
(statearr_120106_120401[(2)] = null);

(statearr_120106_120401[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120094 === (4))){
var inst_120063 = (state_120093[(2)]);
var inst_120064 = cljs.core.__destructure_map(inst_120063);
var inst_120065 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_120064,new cljs.core.Keyword(null,"success","success",1890645906));
var inst_120066 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_120064,new cljs.core.Keyword(null,"next","next",-117701485));
var inst_120067 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_120064,new cljs.core.Keyword(null,"result","result",1415092211));
var inst_120068 = inst_120065 === false;
var state_120093__$1 = (function (){var statearr_120112 = state_120093;
(statearr_120112[(9)] = inst_120066);

(statearr_120112[(10)] = inst_120067);

return statearr_120112;
})();
if(cljs.core.truth_(inst_120068)){
var statearr_120113_120408 = state_120093__$1;
(statearr_120113_120408[(1)] = (5));

} else {
var statearr_120114_120409 = state_120093__$1;
(statearr_120114_120409[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120094 === (13))){
var inst_120083 = (state_120093[(2)]);
var state_120093__$1 = state_120093;
var statearr_120116_120410 = state_120093__$1;
(statearr_120116_120410[(2)] = inst_120083);

(statearr_120116_120410[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120094 === (6))){
var inst_120066 = (state_120093[(9)]);
var state_120093__$1 = state_120093;
if(cljs.core.truth_(inst_120066)){
var statearr_120118_120414 = state_120093__$1;
(statearr_120118_120414[(1)] = (8));

} else {
var statearr_120119_120416 = state_120093__$1;
(statearr_120119_120416[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120094 === (3))){
var inst_120089 = (state_120093[(2)]);
var state_120093__$1 = state_120093;
return cljs.core.async.impl.ioc_helpers.return_chan(state_120093__$1,inst_120089);
} else {
if((state_val_120094 === (12))){
var state_120093__$1 = state_120093;
var statearr_120123_120420 = state_120093__$1;
(statearr_120123_120420[(2)] = null);

(statearr_120123_120420[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120094 === (2))){
var inst_120046 = (state_120093[(7)]);
var inst_120053 = frontend.extensions.zotero.api.config();
var inst_120055 = ["/items/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(key),"/children"].join('');
var inst_120057 = [new cljs.core.Keyword(null,"item-type","item-type",-73995695),new cljs.core.Keyword(null,"start","start",-355208981)];
var inst_120059 = [type,inst_120046];
var inst_120060 = cljs.core.PersistentHashMap.fromArrays(inst_120057,inst_120059);
var inst_120061 = frontend.extensions.zotero.api.get_STAR_.cljs$core$IFn$_invoke$arity$3(inst_120053,inst_120055,inst_120060);
var state_120093__$1 = state_120093;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_120093__$1,(4),inst_120061);
} else {
if((state_val_120094 === (11))){
var inst_120047 = (state_120093[(8)]);
var inst_120067 = (state_120093[(10)]);
var inst_120078 = cljs.core.PersistentVector.EMPTY;
var inst_120079 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(inst_120047,inst_120067);
var inst_120080 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(inst_120078,inst_120079);
var state_120093__$1 = state_120093;
var statearr_120127_120427 = state_120093__$1;
(statearr_120127_120427[(2)] = inst_120080);

(statearr_120127_120427[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120094 === (9))){
var state_120093__$1 = state_120093;
var statearr_120129_120429 = state_120093__$1;
(statearr_120129_120429[(1)] = (11));



return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120094 === (5))){
var inst_120047 = (state_120093[(8)]);
var state_120093__$1 = state_120093;
var statearr_120136_120433 = state_120093__$1;
(statearr_120136_120433[(2)] = inst_120047);

(statearr_120136_120433[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120094 === (10))){
var inst_120085 = (state_120093[(2)]);
var state_120093__$1 = state_120093;
var statearr_120137_120436 = state_120093__$1;
(statearr_120137_120436[(2)] = inst_120085);

(statearr_120137_120436[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_120094 === (8))){
var inst_120047 = (state_120093[(8)]);
var inst_120067 = (state_120093[(10)]);
var inst_120066 = (state_120093[(9)]);
var inst_120072 = cljs.core.PersistentVector.EMPTY;
var inst_120073 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(inst_120047,inst_120067);
var inst_120074 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(inst_120072,inst_120073);
var inst_120046 = inst_120066;
var inst_120047__$1 = inst_120074;
var state_120093__$1 = (function (){var statearr_120138 = state_120093;
(statearr_120138[(7)] = inst_120046);

(statearr_120138[(8)] = inst_120047__$1);

return statearr_120138;
})();
var statearr_120145_120440 = state_120093__$1;
(statearr_120145_120440[(2)] = null);

(statearr_120145_120440[(1)] = (2));


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
});
return (function() {
var frontend$extensions$zotero$api$all_children_items_$_state_machine__32004__auto__ = null;
var frontend$extensions$zotero$api$all_children_items_$_state_machine__32004__auto____0 = (function (){
var statearr_120146 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_120146[(0)] = frontend$extensions$zotero$api$all_children_items_$_state_machine__32004__auto__);

(statearr_120146[(1)] = (1));

return statearr_120146;
});
var frontend$extensions$zotero$api$all_children_items_$_state_machine__32004__auto____1 = (function (state_120093){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_120093);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e120149){var ex__32007__auto__ = e120149;
var statearr_120150_120444 = state_120093;
(statearr_120150_120444[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_120093[(4)]))){
var statearr_120153_120447 = state_120093;
(statearr_120153_120447[(1)] = cljs.core.first((state_120093[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__120450 = state_120093;
state_120093 = G__120450;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$extensions$zotero$api$all_children_items_$_state_machine__32004__auto__ = function(state_120093){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$api$all_children_items_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$extensions$zotero$api$all_children_items_$_state_machine__32004__auto____1.call(this,state_120093);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$api$all_children_items_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$api$all_children_items_$_state_machine__32004__auto____0;
frontend$extensions$zotero$api$all_children_items_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$api$all_children_items_$_state_machine__32004__auto____1;
return frontend$extensions$zotero$api$all_children_items_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_120156 = f__32196__auto__();
(statearr_120156[(6)] = c__32195__auto__);

return statearr_120156;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
frontend.extensions.zotero.api.notes = (function frontend$extensions$zotero$api$notes(key){
return frontend.extensions.zotero.api.all_children_items(key,"note");
});
frontend.extensions.zotero.api.attachments = (function frontend$extensions$zotero$api$attachments(key){
return frontend.extensions.zotero.api.all_children_items(key,"attachment");
});

//# sourceMappingURL=frontend.extensions.zotero.api.js.map
