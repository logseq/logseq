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
var c__32124__auto___72532 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_72093){
var state_val_72094 = (state_72093[(1)]);
if((state_val_72094 === (7))){
var inst_72023 = (state_72093[(2)]);
var state_72093__$1 = state_72093;
var statearr_72096_72533 = state_72093__$1;
(statearr_72096_72533[(2)] = inst_72023);

(statearr_72096_72533[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72094 === (20))){
var state_72093__$1 = state_72093;
var statearr_72097_72534 = state_72093__$1;
(statearr_72097_72534[(2)] = null);

(statearr_72097_72534[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72094 === (1))){
var inst_72018 = null;
var state_72093__$1 = (function (){var statearr_72098 = state_72093;
(statearr_72098[(7)] = inst_72018);

return statearr_72098;
})();
var statearr_72099_72535 = state_72093__$1;
(statearr_72099_72535[(2)] = null);

(statearr_72099_72535[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72094 === (4))){
var state_72093__$1 = state_72093;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_72093__$1,(7),in$);
} else {
if((state_val_72094 === (15))){
var inst_72045 = (state_72093[(8)]);
var inst_72026 = (state_72093[(9)]);
var inst_72074 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_72045,(0),null);
var state_72093__$1 = (function (){var statearr_72107 = state_72093;
(statearr_72107[(10)] = inst_72074);

return statearr_72107;
})();
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_72093__$1,(18),out,inst_72026);
} else {
if((state_val_72094 === (21))){
var inst_72085 = (state_72093[(2)]);
var state_72093__$1 = state_72093;
var statearr_72111_72536 = state_72093__$1;
(statearr_72111_72536[(2)] = inst_72085);

(statearr_72111_72536[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72094 === (13))){
var inst_72063 = cljs.core.async.close_BANG_(out);
var state_72093__$1 = state_72093;
var statearr_72114_72537 = state_72093__$1;
(statearr_72114_72537[(2)] = inst_72063);

(statearr_72114_72537[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72094 === (6))){
var inst_72036 = (state_72093[(11)]);
var inst_72027 = (state_72093[(12)]);
var inst_72026 = (state_72093[(2)]);
var inst_72027__$1 = cljs.core.async.timeout(ms);
var inst_72036__$1 = in$;
var inst_72041 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_72042 = [inst_72036__$1,inst_72027__$1];
var inst_72043 = (new cljs.core.PersistentVector(null,2,(5),inst_72041,inst_72042,null));
var state_72093__$1 = (function (){var statearr_72117 = state_72093;
(statearr_72117[(9)] = inst_72026);

(statearr_72117[(12)] = inst_72027__$1);

(statearr_72117[(11)] = inst_72036__$1);

return statearr_72117;
})();
return cljs.core.async.ioc_alts_BANG_(state_72093__$1,(8),inst_72043);
} else {
if((state_val_72094 === (17))){
var inst_72087 = (state_72093[(2)]);
var state_72093__$1 = state_72093;
var statearr_72119_72538 = state_72093__$1;
(statearr_72119_72538[(2)] = inst_72087);

(statearr_72119_72538[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72094 === (3))){
var inst_72091 = (state_72093[(2)]);
var state_72093__$1 = state_72093;
return cljs.core.async.impl.ioc_helpers.return_chan(state_72093__$1,inst_72091);
} else {
if((state_val_72094 === (12))){
var inst_72056 = (state_72093[(13)]);
var inst_72018 = inst_72056;
var state_72093__$1 = (function (){var statearr_72120 = state_72093;
(statearr_72120[(7)] = inst_72018);

return statearr_72120;
})();
var statearr_72121_72539 = state_72093__$1;
(statearr_72121_72539[(2)] = null);

(statearr_72121_72539[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72094 === (2))){
var inst_72018 = (state_72093[(7)]);
var inst_72020 = (inst_72018 == null);
var state_72093__$1 = state_72093;
if(cljs.core.truth_(inst_72020)){
var statearr_72122_72540 = state_72093__$1;
(statearr_72122_72540[(1)] = (4));

} else {
var statearr_72123_72541 = state_72093__$1;
(statearr_72123_72541[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72094 === (19))){
var inst_72046 = (state_72093[(14)]);
var state_72093__$1 = state_72093;
var statearr_72124_72542 = state_72093__$1;
(statearr_72124_72542[(2)] = inst_72046);

(statearr_72124_72542[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72094 === (11))){
var inst_72089 = (state_72093[(2)]);
var state_72093__$1 = state_72093;
var statearr_72127_72543 = state_72093__$1;
(statearr_72127_72543[(2)] = inst_72089);

(statearr_72127_72543[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72094 === (9))){
var inst_72045 = (state_72093[(8)]);
var inst_72056 = (state_72093[(13)]);
var inst_72056__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_72045,(0),null);
var state_72093__$1 = (function (){var statearr_72128 = state_72093;
(statearr_72128[(13)] = inst_72056__$1);

return statearr_72128;
})();
if(cljs.core.truth_(inst_72056__$1)){
var statearr_72129_72544 = state_72093__$1;
(statearr_72129_72544[(1)] = (12));

} else {
var statearr_72130_72545 = state_72093__$1;
(statearr_72130_72545[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72094 === (5))){
var inst_72018 = (state_72093[(7)]);
var state_72093__$1 = state_72093;
var statearr_72131_72546 = state_72093__$1;
(statearr_72131_72546[(2)] = inst_72018);

(statearr_72131_72546[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72094 === (14))){
var inst_72065 = (state_72093[(2)]);
var state_72093__$1 = state_72093;
var statearr_72132_72547 = state_72093__$1;
(statearr_72132_72547[(2)] = inst_72065);

(statearr_72132_72547[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72094 === (16))){
var inst_72047 = (state_72093[(15)]);
var inst_72081 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_72047,new cljs.core.Keyword(null,"default","default",-1987822328));
var state_72093__$1 = state_72093;
if(inst_72081){
var statearr_72133_72548 = state_72093__$1;
(statearr_72133_72548[(1)] = (19));

} else {
var statearr_72134_72549 = state_72093__$1;
(statearr_72134_72549[(1)] = (20));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72094 === (10))){
var inst_72047 = (state_72093[(15)]);
var inst_72027 = (state_72093[(12)]);
var inst_72067 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_72047,inst_72027);
var state_72093__$1 = state_72093;
if(inst_72067){
var statearr_72135_72550 = state_72093__$1;
(statearr_72135_72550[(1)] = (15));

} else {
var statearr_72136_72551 = state_72093__$1;
(statearr_72136_72551[(1)] = (16));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72094 === (18))){
var inst_72076 = (state_72093[(2)]);
var inst_72018 = null;
var state_72093__$1 = (function (){var statearr_72137 = state_72093;
(statearr_72137[(16)] = inst_72076);

(statearr_72137[(7)] = inst_72018);

return statearr_72137;
})();
var statearr_72138_72552 = state_72093__$1;
(statearr_72138_72552[(2)] = null);

(statearr_72138_72552[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72094 === (8))){
var inst_72045 = (state_72093[(8)]);
var inst_72047 = (state_72093[(15)]);
var inst_72036 = (state_72093[(11)]);
var inst_72045__$1 = (state_72093[(2)]);
var inst_72046 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_72045__$1,(0),null);
var inst_72047__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_72045__$1,(1),null);
var inst_72048 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_72047__$1,inst_72036);
var state_72093__$1 = (function (){var statearr_72139 = state_72093;
(statearr_72139[(8)] = inst_72045__$1);

(statearr_72139[(14)] = inst_72046);

(statearr_72139[(15)] = inst_72047__$1);

return statearr_72139;
})();
if(inst_72048){
var statearr_72140_72553 = state_72093__$1;
(statearr_72140_72553[(1)] = (9));

} else {
var statearr_72141_72554 = state_72093__$1;
(statearr_72141_72554[(1)] = (10));

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
var frontend$extensions$zotero$api$debounce_$_state_machine__32051__auto__ = null;
var frontend$extensions$zotero$api$debounce_$_state_machine__32051__auto____0 = (function (){
var statearr_72143 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_72143[(0)] = frontend$extensions$zotero$api$debounce_$_state_machine__32051__auto__);

(statearr_72143[(1)] = (1));

return statearr_72143;
});
var frontend$extensions$zotero$api$debounce_$_state_machine__32051__auto____1 = (function (state_72093){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_72093);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e72144){var ex__32054__auto__ = e72144;
var statearr_72145_72556 = state_72093;
(statearr_72145_72556[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_72093[(4)]))){
var statearr_72146_72557 = state_72093;
(statearr_72146_72557[(1)] = cljs.core.first((state_72093[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__72558 = state_72093;
state_72093 = G__72558;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$extensions$zotero$api$debounce_$_state_machine__32051__auto__ = function(state_72093){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$api$debounce_$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$extensions$zotero$api$debounce_$_state_machine__32051__auto____1.call(this,state_72093);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$api$debounce_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$api$debounce_$_state_machine__32051__auto____0;
frontend$extensions$zotero$api$debounce_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$api$debounce_$_state_machine__32051__auto____1;
return frontend$extensions$zotero$api$debounce_$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_72150 = f__32125__auto__();
(statearr_72150[(6)] = c__32124__auto___72532);

return statearr_72150;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));


return out;
});
frontend.extensions.zotero.api.parse_start = (function frontend$extensions$zotero$api$parse_start(headers,next_or_prev){
var include_text = (function (){var G__72151 = next_or_prev;
var G__72151__$1 = (((G__72151 instanceof cljs.core.Keyword))?G__72151.fqn:null);
switch (G__72151__$1) {
case "next":
return "rel=\"next\"";

break;
case "prev":
return "rel=\"prev\"";

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__72151__$1)].join('')));

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
var G__72158 = arguments.length;
switch (G__72158) {
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
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_72227){
var state_val_72228 = (state_72227[(1)]);
if((state_val_72228 === (7))){
var inst_72194 = (state_72227[(7)]);
var state_72227__$1 = state_72227;
var statearr_72229_72566 = state_72227__$1;
(statearr_72229_72566[(2)] = inst_72194);

(statearr_72229_72566[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72228 === (1))){
var inst_72164 = config_SINGLEQUOTE_;
var inst_72167 = cljs.core.__destructure_map(inst_72164);
var inst_72168 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_72167,new cljs.core.Keyword(null,"api-version","api-version",108847181));
var inst_72169 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_72167,new cljs.core.Keyword(null,"base","base",185279322));
var inst_72170 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_72167,new cljs.core.Keyword(null,"type","type",1174270348));
var inst_72171 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_72167,new cljs.core.Keyword(null,"type-id","type-id",2030062700));
var inst_72172 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_72167,new cljs.core.Keyword(null,"api-key","api-key",1037904031));
var inst_72177 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_72167,new cljs.core.Keyword(null,"timeout","timeout",-318625318));
var inst_72178 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_72170,new cljs.core.Keyword(null,"user","user",1532431356));
var state_72227__$1 = (function (){var statearr_72230 = state_72227;
(statearr_72230[(8)] = inst_72168);

(statearr_72230[(9)] = inst_72169);

(statearr_72230[(10)] = inst_72171);

(statearr_72230[(11)] = inst_72172);

(statearr_72230[(12)] = inst_72177);

return statearr_72230;
})();
if(inst_72178){
var statearr_72233_72568 = state_72227__$1;
(statearr_72233_72568[(1)] = (3));

} else {
var statearr_72234_72569 = state_72227__$1;
(statearr_72234_72569[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72228 === (4))){
var state_72227__$1 = state_72227;
var statearr_72235_72570 = state_72227__$1;
(statearr_72235_72570[(2)] = "/groups/");

(statearr_72235_72570[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72228 === (15))){
var inst_72216 = (state_72227[(13)]);
var inst_72202 = (state_72227[(14)]);
var inst_72218 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(inst_72216,new cljs.core.Keyword(null,"count","count",2139924085),inst_72202);
var state_72227__$1 = state_72227;
var statearr_72237_72571 = state_72227__$1;
(statearr_72237_72571[(2)] = inst_72218);

(statearr_72237_72571[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72228 === (13))){
var inst_72211 = (state_72227[(15)]);
var state_72227__$1 = state_72227;
var statearr_72238_72572 = state_72227__$1;
(statearr_72238_72572[(2)] = inst_72211);

(statearr_72238_72572[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72228 === (6))){
var inst_72196 = (state_72227[(16)]);
var inst_72197 = (state_72227[(17)]);
var inst_72200 = (state_72227[(18)]);
var inst_72199 = camel_snake_kebab.extras.transform_keys(camel_snake_kebab.core.__GT_kebab_case_keyword,inst_72196);
var inst_72200__$1 = frontend.extensions.zotero.api.parse_start(inst_72197,new cljs.core.Keyword(null,"next","next",-117701485));
var inst_72201 = frontend.extensions.zotero.api.parse_start(inst_72197,new cljs.core.Keyword(null,"prev","prev",-1597069226));
var inst_72202 = frontend.extensions.zotero.api.get_results_count(inst_72197);
var inst_72204 = [new cljs.core.Keyword(null,"result","result",1415092211)];
var inst_72205 = [inst_72199];
var inst_72206 = cljs.core.PersistentHashMap.fromArrays(inst_72204,inst_72205);
var state_72227__$1 = (function (){var statearr_72242 = state_72227;
(statearr_72242[(18)] = inst_72200__$1);

(statearr_72242[(19)] = inst_72201);

(statearr_72242[(14)] = inst_72202);

(statearr_72242[(20)] = inst_72206);

return statearr_72242;
})();
if(cljs.core.truth_(inst_72200__$1)){
var statearr_72243_72574 = state_72227__$1;
(statearr_72243_72574[(1)] = (9));

} else {
var statearr_72244_72575 = state_72227__$1;
(statearr_72244_72575[(1)] = (10));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72228 === (17))){
var inst_72221 = (state_72227[(2)]);
var state_72227__$1 = state_72227;
var statearr_72245_72577 = state_72227__$1;
(statearr_72245_72577[(2)] = inst_72221);

(statearr_72245_72577[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72228 === (3))){
var state_72227__$1 = state_72227;
var statearr_72247_72578 = state_72227__$1;
(statearr_72247_72578[(2)] = "/users/");

(statearr_72247_72578[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72228 === (12))){
var inst_72211 = (state_72227[(15)]);
var inst_72201 = (state_72227[(19)]);
var inst_72213 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(inst_72211,new cljs.core.Keyword(null,"prev","prev",-1597069226),inst_72201);
var state_72227__$1 = state_72227;
var statearr_72249_72579 = state_72227__$1;
(statearr_72249_72579[(2)] = inst_72213);

(statearr_72249_72579[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72228 === (2))){
var inst_72194 = (state_72227[(7)]);
var inst_72193 = (state_72227[(2)]);
var inst_72194__$1 = cljs.core.__destructure_map(inst_72193);
var inst_72195 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_72194__$1,new cljs.core.Keyword(null,"success","success",1890645906));
var inst_72196 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_72194__$1,new cljs.core.Keyword(null,"body","body",-2049205669));
var inst_72197 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_72194__$1,new cljs.core.Keyword(null,"headers","headers",-835030129));
var state_72227__$1 = (function (){var statearr_72254 = state_72227;
(statearr_72254[(7)] = inst_72194__$1);

(statearr_72254[(16)] = inst_72196);

(statearr_72254[(17)] = inst_72197);

return statearr_72254;
})();
if(cljs.core.truth_(inst_72195)){
var statearr_72255_72582 = state_72227__$1;
(statearr_72255_72582[(1)] = (6));

} else {
var statearr_72256_72583 = state_72227__$1;
(statearr_72256_72583[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72228 === (11))){
var inst_72201 = (state_72227[(19)]);
var inst_72211 = (state_72227[(2)]);
var state_72227__$1 = (function (){var statearr_72275 = state_72227;
(statearr_72275[(15)] = inst_72211);

return statearr_72275;
})();
if(cljs.core.truth_(inst_72201)){
var statearr_72279_72585 = state_72227__$1;
(statearr_72279_72585[(1)] = (12));

} else {
var statearr_72280_72586 = state_72227__$1;
(statearr_72280_72586[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72228 === (9))){
var inst_72206 = (state_72227[(20)]);
var inst_72200 = (state_72227[(18)]);
var inst_72208 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(inst_72206,new cljs.core.Keyword(null,"next","next",-117701485),inst_72200);
var state_72227__$1 = state_72227;
var statearr_72281_72587 = state_72227__$1;
(statearr_72281_72587[(2)] = inst_72208);

(statearr_72281_72587[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72228 === (5))){
var inst_72169 = (state_72227[(9)]);
var inst_72171 = (state_72227[(10)]);
var inst_72172 = (state_72227[(11)]);
var inst_72168 = (state_72227[(8)]);
var inst_72177 = (state_72227[(12)]);
var inst_72182 = (state_72227[(2)]);
var inst_72183 = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(inst_72169),inst_72182,cljs.core.str.cljs$core$IFn$_invoke$arity$1(inst_72171),cljs.core.str.cljs$core$IFn$_invoke$arity$1(api)].join('');
var inst_72184 = [new cljs.core.Keyword(null,"timeout","timeout",-318625318),new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222),new cljs.core.Keyword(null,"headers","headers",-835030129),new cljs.core.Keyword(null,"query-params","query-params",900640534)];
var inst_72185 = ["Zotero-API-Key","Zotero-API-Version"];
var inst_72186 = [inst_72172,inst_72168];
var inst_72187 = cljs.core.PersistentHashMap.fromArrays(inst_72185,inst_72186);
var inst_72188 = camel_snake_kebab.extras.transform_keys(camel_snake_kebab.core.__GT_camelCaseString,query_params);
var inst_72189 = [inst_72177,false,inst_72187,inst_72188];
var inst_72190 = cljs.core.PersistentHashMap.fromArrays(inst_72184,inst_72189);
var inst_72191 = cljs_http.client.get.cljs$core$IFn$_invoke$arity$variadic(inst_72183,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inst_72190], 0));
var state_72227__$1 = state_72227;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_72227__$1,(2),inst_72191);
} else {
if((state_val_72228 === (14))){
var inst_72202 = (state_72227[(14)]);
var inst_72216 = (state_72227[(2)]);
var state_72227__$1 = (function (){var statearr_72284 = state_72227;
(statearr_72284[(13)] = inst_72216);

return statearr_72284;
})();
if(cljs.core.truth_(inst_72202)){
var statearr_72285_72589 = state_72227__$1;
(statearr_72285_72589[(1)] = (15));

} else {
var statearr_72286_72590 = state_72227__$1;
(statearr_72286_72590[(1)] = (16));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72228 === (16))){
var inst_72216 = (state_72227[(13)]);
var state_72227__$1 = state_72227;
var statearr_72313_72591 = state_72227__$1;
(statearr_72313_72591[(2)] = inst_72216);

(statearr_72313_72591[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72228 === (10))){
var inst_72206 = (state_72227[(20)]);
var state_72227__$1 = state_72227;
var statearr_72314_72592 = state_72227__$1;
(statearr_72314_72592[(2)] = inst_72206);

(statearr_72314_72592[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72228 === (8))){
var inst_72224 = (state_72227[(2)]);
var state_72227__$1 = state_72227;
return cljs.core.async.impl.ioc_helpers.return_chan(state_72227__$1,inst_72224);
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
var frontend$extensions$zotero$api$state_machine__32051__auto__ = null;
var frontend$extensions$zotero$api$state_machine__32051__auto____0 = (function (){
var statearr_72323 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_72323[(0)] = frontend$extensions$zotero$api$state_machine__32051__auto__);

(statearr_72323[(1)] = (1));

return statearr_72323;
});
var frontend$extensions$zotero$api$state_machine__32051__auto____1 = (function (state_72227){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_72227);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e72342){var ex__32054__auto__ = e72342;
var statearr_72343_72593 = state_72227;
(statearr_72343_72593[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_72227[(4)]))){
var statearr_72344_72594 = state_72227;
(statearr_72344_72594[(1)] = cljs.core.first((state_72227[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__72595 = state_72227;
state_72227 = G__72595;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$extensions$zotero$api$state_machine__32051__auto__ = function(state_72227){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$api$state_machine__32051__auto____0.call(this);
case 1:
return frontend$extensions$zotero$api$state_machine__32051__auto____1.call(this,state_72227);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$api$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$api$state_machine__32051__auto____0;
frontend$extensions$zotero$api$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$api$state_machine__32051__auto____1;
return frontend$extensions$zotero$api$state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_72347 = f__32125__auto__();
(statearr_72347[(6)] = c__32124__auto__);

return statearr_72347;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
}));

(frontend.extensions.zotero.api.get_STAR_.cljs$lang$maxFixedArity = 3);

frontend.extensions.zotero.api.item = (function frontend$extensions$zotero$api$item(key){
return new cljs.core.Keyword(null,"result","result",1415092211).cljs$core$IFn$_invoke$arity$1(frontend.extensions.zotero.api.get_STAR_.cljs$core$IFn$_invoke$arity$2(frontend.extensions.zotero.api.config(),["/items/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(key)].join('')));
});
frontend.extensions.zotero.api.all_top_items_count = (function frontend$extensions$zotero$api$all_top_items_count(){
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_72360){
var state_val_72361 = (state_72360[(1)]);
if((state_val_72361 === (1))){
var inst_72351 = frontend.extensions.zotero.api.config();
var inst_72352 = [new cljs.core.Keyword(null,"limit","limit",-1355822363),new cljs.core.Keyword(null,"item-type","item-type",-73995695)];
var inst_72353 = [(1),"-attachment"];
var inst_72354 = cljs.core.PersistentHashMap.fromArrays(inst_72352,inst_72353);
var inst_72355 = frontend.extensions.zotero.api.get_STAR_.cljs$core$IFn$_invoke$arity$3(inst_72351,"/items/top",inst_72354);
var state_72360__$1 = state_72360;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_72360__$1,(2),inst_72355);
} else {
if((state_val_72361 === (2))){
var inst_72357 = (state_72360[(2)]);
var inst_72358 = new cljs.core.Keyword(null,"count","count",2139924085).cljs$core$IFn$_invoke$arity$1(inst_72357);
var state_72360__$1 = state_72360;
return cljs.core.async.impl.ioc_helpers.return_chan(state_72360__$1,inst_72358);
} else {
return null;
}
}
});
return (function() {
var frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32051__auto__ = null;
var frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32051__auto____0 = (function (){
var statearr_72362 = [null,null,null,null,null,null,null];
(statearr_72362[(0)] = frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32051__auto__);

(statearr_72362[(1)] = (1));

return statearr_72362;
});
var frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32051__auto____1 = (function (state_72360){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_72360);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e72363){var ex__32054__auto__ = e72363;
var statearr_72364_72596 = state_72360;
(statearr_72364_72596[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_72360[(4)]))){
var statearr_72365_72597 = state_72360;
(statearr_72365_72597[(1)] = cljs.core.first((state_72360[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__72598 = state_72360;
state_72360 = G__72598;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32051__auto__ = function(state_72360){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32051__auto____1.call(this,state_72360);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32051__auto____0;
frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32051__auto____1;
return frontend$extensions$zotero$api$all_top_items_count_$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_72366 = f__32125__auto__();
(statearr_72366[(6)] = c__32124__auto__);

return statearr_72366;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
});
frontend.extensions.zotero.api.all_top_items = (function frontend$extensions$zotero$api$all_top_items(){
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_72406){
var state_val_72407 = (state_72406[(1)]);
if((state_val_72407 === (7))){
var inst_72402 = (state_72406[(2)]);
var state_72406__$1 = state_72406;
var statearr_72408_72599 = state_72406__$1;
(statearr_72408_72599[(2)] = inst_72402);

(statearr_72408_72599[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72407 === (1))){
var inst_72367 = cljs.core.PersistentVector.EMPTY;
var inst_72368 = "0";
var inst_72369 = inst_72367;
var state_72406__$1 = (function (){var statearr_72409 = state_72406;
(statearr_72409[(7)] = inst_72368);

(statearr_72409[(8)] = inst_72369);

return statearr_72409;
})();
var statearr_72410_72600 = state_72406__$1;
(statearr_72410_72600[(2)] = null);

(statearr_72410_72600[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72407 === (4))){
var inst_72378 = (state_72406[(2)]);
var inst_72379 = cljs.core.__destructure_map(inst_72378);
var inst_72380 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_72379,new cljs.core.Keyword(null,"success","success",1890645906));
var inst_72381 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_72379,new cljs.core.Keyword(null,"next","next",-117701485));
var inst_72382 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_72379,new cljs.core.Keyword(null,"result","result",1415092211));
var inst_72383 = inst_72380 === false;
var state_72406__$1 = (function (){var statearr_72411 = state_72406;
(statearr_72411[(9)] = inst_72381);

(statearr_72411[(10)] = inst_72382);

return statearr_72411;
})();
if(cljs.core.truth_(inst_72383)){
var statearr_72412_72602 = state_72406__$1;
(statearr_72412_72602[(1)] = (5));

} else {
var statearr_72413_72603 = state_72406__$1;
(statearr_72413_72603[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72407 === (13))){
var inst_72398 = (state_72406[(2)]);
var state_72406__$1 = state_72406;
var statearr_72414_72604 = state_72406__$1;
(statearr_72414_72604[(2)] = inst_72398);

(statearr_72414_72604[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72407 === (6))){
var inst_72381 = (state_72406[(9)]);
var state_72406__$1 = state_72406;
if(cljs.core.truth_(inst_72381)){
var statearr_72415_72607 = state_72406__$1;
(statearr_72415_72607[(1)] = (8));

} else {
var statearr_72416_72608 = state_72406__$1;
(statearr_72416_72608[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72407 === (3))){
var inst_72404 = (state_72406[(2)]);
var state_72406__$1 = state_72406;
return cljs.core.async.impl.ioc_helpers.return_chan(state_72406__$1,inst_72404);
} else {
if((state_val_72407 === (12))){
var state_72406__$1 = state_72406;
var statearr_72417_72609 = state_72406__$1;
(statearr_72417_72609[(2)] = null);

(statearr_72417_72609[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72407 === (2))){
var inst_72368 = (state_72406[(7)]);
var inst_72372 = frontend.extensions.zotero.api.config();
var inst_72373 = [new cljs.core.Keyword(null,"item-type","item-type",-73995695),new cljs.core.Keyword(null,"start","start",-355208981)];
var inst_72374 = ["-attachment",inst_72368];
var inst_72375 = cljs.core.PersistentHashMap.fromArrays(inst_72373,inst_72374);
var inst_72376 = frontend.extensions.zotero.api.get_STAR_.cljs$core$IFn$_invoke$arity$3(inst_72372,"/items/top",inst_72375);
var state_72406__$1 = state_72406;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_72406__$1,(4),inst_72376);
} else {
if((state_val_72407 === (11))){
var inst_72369 = (state_72406[(8)]);
var inst_72382 = (state_72406[(10)]);
var inst_72393 = cljs.core.PersistentVector.EMPTY;
var inst_72394 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(inst_72369,inst_72382);
var inst_72395 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(inst_72393,inst_72394);
var state_72406__$1 = state_72406;
var statearr_72418_72611 = state_72406__$1;
(statearr_72418_72611[(2)] = inst_72395);

(statearr_72418_72611[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72407 === (9))){
var state_72406__$1 = state_72406;
var statearr_72419_72612 = state_72406__$1;
(statearr_72419_72612[(1)] = (11));



return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72407 === (5))){
var inst_72369 = (state_72406[(8)]);
var state_72406__$1 = state_72406;
var statearr_72421_72613 = state_72406__$1;
(statearr_72421_72613[(2)] = inst_72369);

(statearr_72421_72613[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72407 === (10))){
var inst_72400 = (state_72406[(2)]);
var state_72406__$1 = state_72406;
var statearr_72422_72615 = state_72406__$1;
(statearr_72422_72615[(2)] = inst_72400);

(statearr_72422_72615[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72407 === (8))){
var inst_72369 = (state_72406[(8)]);
var inst_72382 = (state_72406[(10)]);
var inst_72381 = (state_72406[(9)]);
var inst_72387 = cljs.core.PersistentVector.EMPTY;
var inst_72388 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(inst_72369,inst_72382);
var inst_72389 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(inst_72387,inst_72388);
var inst_72368 = inst_72381;
var inst_72369__$1 = inst_72389;
var state_72406__$1 = (function (){var statearr_72425 = state_72406;
(statearr_72425[(7)] = inst_72368);

(statearr_72425[(8)] = inst_72369__$1);

return statearr_72425;
})();
var statearr_72427_72616 = state_72406__$1;
(statearr_72427_72616[(2)] = null);

(statearr_72427_72616[(1)] = (2));


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
var frontend$extensions$zotero$api$all_top_items_$_state_machine__32051__auto__ = null;
var frontend$extensions$zotero$api$all_top_items_$_state_machine__32051__auto____0 = (function (){
var statearr_72429 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_72429[(0)] = frontend$extensions$zotero$api$all_top_items_$_state_machine__32051__auto__);

(statearr_72429[(1)] = (1));

return statearr_72429;
});
var frontend$extensions$zotero$api$all_top_items_$_state_machine__32051__auto____1 = (function (state_72406){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_72406);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e72430){var ex__32054__auto__ = e72430;
var statearr_72431_72617 = state_72406;
(statearr_72431_72617[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_72406[(4)]))){
var statearr_72434_72618 = state_72406;
(statearr_72434_72618[(1)] = cljs.core.first((state_72406[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__72619 = state_72406;
state_72406 = G__72619;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$extensions$zotero$api$all_top_items_$_state_machine__32051__auto__ = function(state_72406){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$api$all_top_items_$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$extensions$zotero$api$all_top_items_$_state_machine__32051__auto____1.call(this,state_72406);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$api$all_top_items_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$api$all_top_items_$_state_machine__32051__auto____0;
frontend$extensions$zotero$api$all_top_items_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$api$all_top_items_$_state_machine__32051__auto____1;
return frontend$extensions$zotero$api$all_top_items_$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_72437 = f__32125__auto__();
(statearr_72437[(6)] = c__32124__auto__);

return statearr_72437;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
});
/**
 * Query all top level items except attachments
 */
frontend.extensions.zotero.api.query_top_items = (function frontend$extensions$zotero$api$query_top_items(var_args){
var G__72442 = arguments.length;
switch (G__72442) {
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
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_72491){
var state_val_72492 = (state_72491[(1)]);
if((state_val_72492 === (7))){
var inst_72486 = (state_72491[(2)]);
var state_72491__$1 = state_72491;
var statearr_72494_72623 = state_72491__$1;
(statearr_72494_72623[(2)] = inst_72486);

(statearr_72494_72623[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72492 === (1))){
var inst_72447 = cljs.core.PersistentVector.EMPTY;
var inst_72448 = "0";
var inst_72449 = inst_72447;
var state_72491__$1 = (function (){var statearr_72496 = state_72491;
(statearr_72496[(7)] = inst_72448);

(statearr_72496[(8)] = inst_72449);

return statearr_72496;
})();
var statearr_72497_72624 = state_72491__$1;
(statearr_72497_72624[(2)] = null);

(statearr_72497_72624[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72492 === (4))){
var inst_72462 = (state_72491[(2)]);
var inst_72463 = cljs.core.__destructure_map(inst_72462);
var inst_72464 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_72463,new cljs.core.Keyword(null,"success","success",1890645906));
var inst_72465 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_72463,new cljs.core.Keyword(null,"next","next",-117701485));
var inst_72466 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_72463,new cljs.core.Keyword(null,"result","result",1415092211));
var inst_72467 = inst_72464 === false;
var state_72491__$1 = (function (){var statearr_72501 = state_72491;
(statearr_72501[(9)] = inst_72465);

(statearr_72501[(10)] = inst_72466);

return statearr_72501;
})();
if(cljs.core.truth_(inst_72467)){
var statearr_72502_72626 = state_72491__$1;
(statearr_72502_72626[(1)] = (5));

} else {
var statearr_72503_72627 = state_72491__$1;
(statearr_72503_72627[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72492 === (13))){
var inst_72482 = (state_72491[(2)]);
var state_72491__$1 = state_72491;
var statearr_72505_72628 = state_72491__$1;
(statearr_72505_72628[(2)] = inst_72482);

(statearr_72505_72628[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72492 === (6))){
var inst_72465 = (state_72491[(9)]);
var state_72491__$1 = state_72491;
if(cljs.core.truth_(inst_72465)){
var statearr_72508_72629 = state_72491__$1;
(statearr_72508_72629[(1)] = (8));

} else {
var statearr_72509_72630 = state_72491__$1;
(statearr_72509_72630[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72492 === (3))){
var inst_72488 = (state_72491[(2)]);
var state_72491__$1 = state_72491;
return cljs.core.async.impl.ioc_helpers.return_chan(state_72491__$1,inst_72488);
} else {
if((state_val_72492 === (12))){
var state_72491__$1 = state_72491;
var statearr_72511_72632 = state_72491__$1;
(statearr_72511_72632[(2)] = null);

(statearr_72511_72632[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72492 === (2))){
var inst_72448 = (state_72491[(7)]);
var inst_72454 = frontend.extensions.zotero.api.config();
var inst_72455 = ["/items/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(key),"/children"].join('');
var inst_72456 = [new cljs.core.Keyword(null,"item-type","item-type",-73995695),new cljs.core.Keyword(null,"start","start",-355208981)];
var inst_72457 = [type,inst_72448];
var inst_72458 = cljs.core.PersistentHashMap.fromArrays(inst_72456,inst_72457);
var inst_72459 = frontend.extensions.zotero.api.get_STAR_.cljs$core$IFn$_invoke$arity$3(inst_72454,inst_72455,inst_72458);
var state_72491__$1 = state_72491;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_72491__$1,(4),inst_72459);
} else {
if((state_val_72492 === (11))){
var inst_72449 = (state_72491[(8)]);
var inst_72466 = (state_72491[(10)]);
var inst_72477 = cljs.core.PersistentVector.EMPTY;
var inst_72478 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(inst_72449,inst_72466);
var inst_72479 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(inst_72477,inst_72478);
var state_72491__$1 = state_72491;
var statearr_72515_72635 = state_72491__$1;
(statearr_72515_72635[(2)] = inst_72479);

(statearr_72515_72635[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72492 === (9))){
var state_72491__$1 = state_72491;
var statearr_72517_72636 = state_72491__$1;
(statearr_72517_72636[(1)] = (11));



return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72492 === (5))){
var inst_72449 = (state_72491[(8)]);
var state_72491__$1 = state_72491;
var statearr_72521_72637 = state_72491__$1;
(statearr_72521_72637[(2)] = inst_72449);

(statearr_72521_72637[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72492 === (10))){
var inst_72484 = (state_72491[(2)]);
var state_72491__$1 = state_72491;
var statearr_72522_72639 = state_72491__$1;
(statearr_72522_72639[(2)] = inst_72484);

(statearr_72522_72639[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_72492 === (8))){
var inst_72449 = (state_72491[(8)]);
var inst_72466 = (state_72491[(10)]);
var inst_72465 = (state_72491[(9)]);
var inst_72471 = cljs.core.PersistentVector.EMPTY;
var inst_72472 = cljs.core.concat.cljs$core$IFn$_invoke$arity$2(inst_72449,inst_72466);
var inst_72473 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(inst_72471,inst_72472);
var inst_72448 = inst_72465;
var inst_72449__$1 = inst_72473;
var state_72491__$1 = (function (){var statearr_72523 = state_72491;
(statearr_72523[(7)] = inst_72448);

(statearr_72523[(8)] = inst_72449__$1);

return statearr_72523;
})();
var statearr_72524_72640 = state_72491__$1;
(statearr_72524_72640[(2)] = null);

(statearr_72524_72640[(1)] = (2));


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
var frontend$extensions$zotero$api$all_children_items_$_state_machine__32051__auto__ = null;
var frontend$extensions$zotero$api$all_children_items_$_state_machine__32051__auto____0 = (function (){
var statearr_72526 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_72526[(0)] = frontend$extensions$zotero$api$all_children_items_$_state_machine__32051__auto__);

(statearr_72526[(1)] = (1));

return statearr_72526;
});
var frontend$extensions$zotero$api$all_children_items_$_state_machine__32051__auto____1 = (function (state_72491){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_72491);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e72527){var ex__32054__auto__ = e72527;
var statearr_72528_72642 = state_72491;
(statearr_72528_72642[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_72491[(4)]))){
var statearr_72529_72643 = state_72491;
(statearr_72529_72643[(1)] = cljs.core.first((state_72491[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__72645 = state_72491;
state_72491 = G__72645;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$extensions$zotero$api$all_children_items_$_state_machine__32051__auto__ = function(state_72491){
switch(arguments.length){
case 0:
return frontend$extensions$zotero$api$all_children_items_$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$extensions$zotero$api$all_children_items_$_state_machine__32051__auto____1.call(this,state_72491);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$extensions$zotero$api$all_children_items_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$extensions$zotero$api$all_children_items_$_state_machine__32051__auto____0;
frontend$extensions$zotero$api$all_children_items_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$extensions$zotero$api$all_children_items_$_state_machine__32051__auto____1;
return frontend$extensions$zotero$api$all_children_items_$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_72530 = f__32125__auto__();
(statearr_72530[(6)] = c__32124__auto__);

return statearr_72530;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
});
frontend.extensions.zotero.api.notes = (function frontend$extensions$zotero$api$notes(key){
return frontend.extensions.zotero.api.all_children_items(key,"note");
});
frontend.extensions.zotero.api.attachments = (function frontend$extensions$zotero$api$attachments(key){
return frontend.extensions.zotero.api.all_children_items(key,"attachment");
});

//# sourceMappingURL=frontend.extensions.zotero.api.js.map
