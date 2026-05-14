goog.provide('frontend.components.encryption');
frontend.components.encryption.show_password_cp = rum.core.lazy_build(rum.core.build_defc,(function (_STAR_show_password_QMARK_){
return daiquiri.core.create_element("div",{'className':"flex flex-row items-center"},[daiquiri.core.create_element("label",{'className':"px-1",'htmlFor':"show-password"},[daiquiri.interpreter.interpret(frontend.ui.checkbox(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"value","value",305978217),cljs.core.deref(_STAR_show_password_QMARK_),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
return cljs.core.reset_BANG_(_STAR_show_password_QMARK_,frontend.util.echecked_QMARK_(e));
}),new cljs.core.Keyword(null,"id","id",-1388402092),"show-password"], null))),daiquiri.core.create_element("span",{'className':"text-sm ml-1 opacity-80 select-none px-1"},["Show password"])])]);
}),null,"frontend.components.encryption/show-password-cp");
frontend.components.encryption.input_password_inner = rum.core.lazy_build(rum.core.build_defcs,(function (state,repo_url,close_fn,p__93105){
var map__93106 = p__93105;
var map__93106__$1 = cljs.core.__destructure_map(map__93106);
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93106__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var GraphName = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93106__$1,new cljs.core.Keyword(null,"GraphName","GraphName",-960661337));
var GraphUUID = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93106__$1,new cljs.core.Keyword(null,"GraphUUID","GraphUUID",-237263531));
var init_graph_keys = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93106__$1,new cljs.core.Keyword(null,"init-graph-keys","init-graph-keys",-472669077));
var after_input_password = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__93106__$1,new cljs.core.Keyword(null,"after-input-password","after-input-password",72975665));
var _STAR_password = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.encryption","password","frontend.components.encryption/password",778875014));
var _STAR_pw_confirm = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.encryption","pw-confirm","frontend.components.encryption/pw-confirm",1857232954));
var _STAR_pw_confirm_focused_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.encryption","pw-confirm-focused?","frontend.components.encryption/pw-confirm-focused?",1772685568));
var _STAR_show_password_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.Keyword("frontend.components.encryption","show-password?","frontend.components.encryption/show-password?",424518490));
var _STAR_input_ref_0 = rum.core.create_ref();
var _STAR_input_ref_1 = rum.core.create_ref();
var remote_pw_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,new cljs.core.Keyword(null,"input-pwd-remote","input-pwd-remote",-1249532078));
var loading_QMARK_ = frontend.state.sub(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","loading?","ui/loading?",1905710757),new cljs.core.Keyword(null,"set-graph-password","set-graph-password",1225108135)], null));
var pw_strength = (cljs.core.truth_((function (){var and__5000__auto__ = init_graph_keys;
if(cljs.core.truth_(and__5000__auto__)){
return (!(clojure.string.blank_QMARK_(cljs.core.deref(_STAR_password))));
} else {
return and__5000__auto__;
}
})())?frontend.util.check_password_strength(cljs.core.deref(_STAR_password)):null);
var can_submit_QMARK_ = (function (){
if(cljs.core.truth_(init_graph_keys)){
return (((cljs.core.count(cljs.core.deref(_STAR_password)) >= (6))) && ((new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(pw_strength) >= (1))));
} else {
return true;
}
});
var set_remote_graph_pwd_result = frontend.state.sub(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","set-remote-graph-password-result","file-sync/set-remote-graph-password-result",-1161271382)], null));
var submit_handler = (function (){
var value = cljs.core.deref(_STAR_password);
if(clojure.string.blank_QMARK_(value)){
return null;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = init_graph_keys;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_password),cljs.core.deref(_STAR_pw_confirm));
} else {
return and__5000__auto__;
}
})())){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2("The passwords are not matched.",new cljs.core.Keyword(null,"error","error",-978969032));
} else {
var G__93113 = type;
var G__93113__$1 = (((G__93113 instanceof cljs.core.Keyword))?G__93113.fqn:null);
switch (G__93113__$1) {
case "create-pwd-remote":
case "input-pwd-remote":
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("ui","loading?","ui/loading?",1905710757),new cljs.core.Keyword(null,"set-graph-password","set-graph-password",1225108135)], null),true);

frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","set-remote-graph-password-result","file-sync/set-remote-graph-password-result",-1161271382)], null),cljs.core.PersistentArrayMap.EMPTY);

var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_93143){
var state_val_93145 = (state_93143[(1)]);
if((state_val_93145 === (7))){
var state_93143__$1 = state_93143;
var statearr_93152_93396 = state_93143__$1;
(statearr_93152_93396[(2)] = null);

(statearr_93152_93396[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93145 === (1))){
var inst_93115 = cljs.core.deref(_STAR_password);
var inst_93116 = frontend.fs.sync.encrypt_PLUS_persist_pwd_BANG_(inst_93115,GraphUUID);
var state_93143__$1 = state_93143;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_93143__$1,(2),inst_93116);
} else {
if((state_val_93145 === (4))){
var inst_93124 = cljs.core.fn_QMARK_(after_input_password);
var state_93143__$1 = state_93143;
if(inst_93124){
var statearr_93153_93399 = state_93143__$1;
(statearr_93153_93399[(1)] = (6));

} else {
var statearr_93154_93400 = state_93143__$1;
(statearr_93154_93400[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93145 === (6))){
var inst_93127 = cljs.core.deref(_STAR_password);
var inst_93128 = (after_input_password.cljs$core$IFn$_invoke$arity$1 ? after_input_password.cljs$core$IFn$_invoke$arity$1(inst_93127) : after_input_password.call(null,inst_93127));
var state_93143__$1 = (function (){var statearr_93158 = state_93143;
(statearr_93158[(7)] = inst_93128);

return statearr_93158;
})();
if(cljs.core.truth_(init_graph_keys)){
var statearr_93159_93401 = state_93143__$1;
(statearr_93159_93401[(1)] = (9));

} else {
var statearr_93161_93402 = state_93143__$1;
(statearr_93161_93402[(1)] = (10));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93145 === (3))){
var inst_93118 = (state_93143[(8)]);
var inst_93121 = console.error(inst_93118);
var state_93143__$1 = state_93143;
var statearr_93162_93405 = state_93143__$1;
(statearr_93162_93405[(2)] = inst_93121);

(statearr_93162_93405[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93145 === (2))){
var inst_93118 = (state_93143[(8)]);
var inst_93118__$1 = (state_93143[(2)]);
var inst_93119 = (inst_93118__$1 instanceof Error);
var state_93143__$1 = (function (){var statearr_93164 = state_93143;
(statearr_93164[(8)] = inst_93118__$1);

return statearr_93164;
})();
if(cljs.core.truth_(inst_93119)){
var statearr_93165_93408 = state_93143__$1;
(statearr_93165_93408[(1)] = (3));

} else {
var statearr_93169_93409 = state_93143__$1;
(statearr_93169_93409[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93145 === (11))){
var inst_93135 = (state_93143[(2)]);
var state_93143__$1 = state_93143;
var statearr_93172_93410 = state_93143__$1;
(statearr_93172_93410[(2)] = inst_93135);

(statearr_93172_93410[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93145 === (9))){
var inst_93118 = (state_93143[(8)]);
var inst_93130 = (function (){var persist_r = inst_93118;
return (function (){
return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","maybe-onboarding-show","file-sync/maybe-onboarding-show",1562674517),new cljs.core.Keyword(null,"sync-learn","sync-learn",-93764067)], null));
});
})();
var inst_93131 = setTimeout(inst_93130,(10000));
var state_93143__$1 = state_93143;
var statearr_93173_93412 = state_93143__$1;
(statearr_93173_93412[(2)] = inst_93131);

(statearr_93173_93412[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93145 === (5))){
var inst_93141 = (state_93143[(2)]);
var state_93143__$1 = state_93143;
return cljs.core.async.impl.ioc_helpers.return_chan(state_93143__$1,inst_93141);
} else {
if((state_val_93145 === (10))){
var state_93143__$1 = state_93143;
var statearr_93179_93413 = state_93143__$1;
(statearr_93179_93413[(2)] = null);

(statearr_93179_93413[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_93145 === (8))){
var inst_93139 = (state_93143[(2)]);
var state_93143__$1 = state_93143;
var statearr_93180_93415 = state_93143__$1;
(statearr_93180_93415[(2)] = inst_93139);

(statearr_93180_93415[(1)] = (5));


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
var frontend$components$encryption$state_machine__32051__auto__ = null;
var frontend$components$encryption$state_machine__32051__auto____0 = (function (){
var statearr_93181 = [null,null,null,null,null,null,null,null,null];
(statearr_93181[(0)] = frontend$components$encryption$state_machine__32051__auto__);

(statearr_93181[(1)] = (1));

return statearr_93181;
});
var frontend$components$encryption$state_machine__32051__auto____1 = (function (state_93143){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_93143);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e93182){var ex__32054__auto__ = e93182;
var statearr_93183_93418 = state_93143;
(statearr_93183_93418[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_93143[(4)]))){
var statearr_93185_93419 = state_93143;
(statearr_93185_93419[(1)] = cljs.core.first((state_93143[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__93420 = state_93143;
state_93143 = G__93420;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$components$encryption$state_machine__32051__auto__ = function(state_93143){
switch(arguments.length){
case 0:
return frontend$components$encryption$state_machine__32051__auto____0.call(this);
case 1:
return frontend$components$encryption$state_machine__32051__auto____1.call(this,state_93143);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$components$encryption$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$components$encryption$state_machine__32051__auto____0;
frontend$components$encryption$state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$components$encryption$state_machine__32051__auto____1;
return frontend$components$encryption$state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_93191 = f__32125__auto__();
(statearr_93191[(6)] = c__32124__auto__);

return statearr_93191;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__93113__$1)].join('')));

}

}
}
});
var cancel_handler = (function (){
frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","set-remote-graph-password-result","file-sync/set-remote-graph-password-result",-1161271382)], null),cljs.core.PersistentArrayMap.EMPTY);

return (close_fn.cljs$core$IFn$_invoke$arity$0 ? close_fn.cljs$core$IFn$_invoke$arity$0() : close_fn.call(null));
});
var enter_handler = (function (e){
var temp__5804__auto__ = (function (){var and__5000__auto__ = e;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((13),e.which);
if(and__5000__auto____$1){
return e.target;
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
if(clojure.string.blank_QMARK_(input.value)){
return null;
} else {
var input_0_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.util.safe_lower_case(input.placeholder),"password");
if(cljs.core.truth_(init_graph_keys)){
if(input_0_QMARK_){
return rum.core.deref(_STAR_input_ref_1).select();
} else {
return submit_handler();
}
} else {
return submit_handler();
}
}
} else {
return null;
}
});
return daiquiri.core.create_element("div",{'className':"encryption-password max-w-2xl -mb-2"},[daiquiri.core.create_element("div",{'className':"cp__file-sync-related-normal-modal"},[daiquiri.core.create_element("div",{'className':"flex justify-center pb-4"},[(function (){var attrs93205 = frontend.ui.icon("lock-access",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(28)], null));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs93205))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["icon-wrap"], null)], null),attrs93205], 0))):{'className':"icon-wrap"}),((cljs.core.map_QMARK_(attrs93205))?null:[daiquiri.interpreter.interpret(attrs93205)]));
})()]),daiquiri.core.create_element("div",{'className':"mt-3 text-center sm:mt-0 sm:text-left"},[daiquiri.core.create_element("h1",{'id':"modal-headline",'className':"text-2xl font-bold text-center"},[(cljs.core.truth_(init_graph_keys)?((remote_pw_QMARK_)?"Secure graph!":"Encrypt graph"):((remote_pw_QMARK_)?"Unlock graph!":"Decrypt graph"))])]),((((remote_pw_QMARK_) && (cljs.core.not(init_graph_keys))))?daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("div",{'className':"folder-tip flex flex-col items-center"},[daiquiri.core.create_element("h3",null,[(function (){var attrs93218 = frontend.ui.icon("cloud-lock",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"size","size",1098693007),(20)], null));
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs93218))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["flex","space-x-2","leading-none","pb-1"], null)], null),attrs93218], 0))):{'className':"flex space-x-2 leading-none pb-1"}),((cljs.core.map_QMARK_(attrs93218))?[(function (){var attrs93222 = GraphName;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs93222))?daiquiri.interpreter.element_attributes(attrs93222):null),((cljs.core.map_QMARK_(attrs93222))?null:[daiquiri.interpreter.interpret(attrs93222)]));
})(),(function (){var attrs93223 = frontend.ui.icon("arrow-right");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs93223))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["scale-75"], null)], null),attrs93223], 0))):{'className':"scale-75"}),((cljs.core.map_QMARK_(attrs93223))?null:[daiquiri.interpreter.interpret(attrs93223)]));
})(),(function (){var attrs93224 = frontend.ui.icon("folder");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs93224))?daiquiri.interpreter.element_attributes(attrs93224):null),((cljs.core.map_QMARK_(attrs93224))?null:[daiquiri.interpreter.interpret(attrs93224)]));
})()]:[daiquiri.interpreter.interpret(attrs93218),(function (){var attrs93226 = GraphName;
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs93226))?daiquiri.interpreter.element_attributes(attrs93226):null),((cljs.core.map_QMARK_(attrs93226))?null:[daiquiri.interpreter.interpret(attrs93226)]));
})(),(function (){var attrs93227 = frontend.ui.icon("arrow-right");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs93227))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, ["scale-75"], null)], null),attrs93227], 0))):{'className':"scale-75"}),((cljs.core.map_QMARK_(attrs93227))?null:[daiquiri.interpreter.interpret(attrs93227)]));
})(),(function (){var attrs93229 = frontend.ui.icon("folder");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs93229))?daiquiri.interpreter.element_attributes(attrs93229):null),((cljs.core.map_QMARK_(attrs93229))?null:[daiquiri.interpreter.interpret(attrs93229)]));
})()]));
})()]),(function (){var attrs93216 = frontend.config.get_string_repo_dir(repo_url);
return daiquiri.core.create_element("h4",((cljs.core.map_QMARK_(attrs93216))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["px-2","-mb-1","5"], null)], null),attrs93216], 0))):{'className':"px-2 -mb-1 5"}),((cljs.core.map_QMARK_(attrs93216))?null:[daiquiri.interpreter.interpret(attrs93216)]));
})()]),(function (){var attrs93215 = (function (){var temp__5802__auto__ = new cljs.core.Keyword(null,"fail","fail",1706214930).cljs$core$IFn$_invoke$arity$1(set_remote_graph_pwd_result);
if(cljs.core.truth_(temp__5802__auto__)){
var display_str = temp__5802__auto__;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.pr-1.text-error","span.flex.pr-1.text-error",1008896001),frontend.ui.icon("alert-circle",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-md mr-1"], null))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-error","span.text-error",121693154),display_str], null)], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.pr-1","span.flex.pr-1",1266166703),frontend.ui.icon("bulb",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-md mr-1"], null))], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Please enter the password for this graph to continue syncing."], null)], null);
}
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs93215))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, ["input-hints","text-sm","py-2","px-3","rounded","mb-2","mt-2","flex","items-center"], null)], null),attrs93215], 0))):{'className':"input-hints text-sm py-2 px-3 rounded mb-2 mt-2 flex items-center"}),((cljs.core.map_QMARK_(attrs93215))?null:[daiquiri.interpreter.interpret(attrs93215)]));
})()]):null),(cljs.core.truth_((function (){var and__5000__auto__ = remote_pw_QMARK_;
if(and__5000__auto__){
return init_graph_keys;
} else {
return and__5000__auto__;
}
})())?(function (){var pattern_ok_QMARK_ = (function (){
return (cljs.core.count(cljs.core.deref(_STAR_password)) >= (6));
});
return daiquiri.core.create_element(daiquiri.core.fragment,null,[daiquiri.core.create_element("h2",{'className':"text-center opacity-70 text-sm py-2"},["Each graph you want to synchronize via Logseq needs its own password for end-to-end encryption."]),(function (){var attrs93290 = (((((!(clojure.string.blank_QMARK_(cljs.core.deref(_STAR_password))))) || ((!(clojure.string.blank_QMARK_(cljs.core.deref(_STAR_pw_confirm)))))))?(((((!(pattern_ok_QMARK_()))) || (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_password),cljs.core.deref(_STAR_pw_confirm)))))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.pr-1.text-error","span.flex.pr-1.text-error",1008896001),frontend.ui.icon("alert-circle",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-md mr-1"], null))], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.pr-1.text-success","span.flex.pr-1.text-success",1500854956),frontend.ui.icon("circle-check",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-md mr-1"], null))], null)):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.flex.pr-1","span.flex.pr-1",1266166703),frontend.ui.icon("bulb",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-md mr-1"], null))], null));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs93290))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 9, 5, cljs.core.PersistentVector.EMPTY_NODE, ["input-hints","text-sm","py-2","px-3","rounded","mb-3","mt-4","flex","items-center"], null)], null),attrs93290], 0))):{'className':"input-hints text-sm py-2 px-3 rounded mb-3 mt-4 flex items-center"}),((cljs.core.map_QMARK_(attrs93290))?[(((!(clojure.string.blank_QMARK_(cljs.core.deref(_STAR_password)))))?(((!(pattern_ok_QMARK_())))?daiquiri.core.create_element("span",null,["Password can't be less than 6 characters"]):(((!(clojure.string.blank_QMARK_(cljs.core.deref(_STAR_pw_confirm)))))?((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_pw_confirm),cljs.core.deref(_STAR_password)))?daiquiri.core.create_element("span",null,["Password fields are not matching!"]):daiquiri.core.create_element("span",null,["Password fields are matching!"])):daiquiri.core.create_element("span",null,["Enter your chosen password again!"]))):daiquiri.core.create_element("span",null,["Choose a strong and hard to guess password!"]))]:[daiquiri.interpreter.interpret(attrs93290),(((!(clojure.string.blank_QMARK_(cljs.core.deref(_STAR_password)))))?(((!(pattern_ok_QMARK_())))?daiquiri.core.create_element("span",null,["Password can't be less than 6 characters"]):(((!(clojure.string.blank_QMARK_(cljs.core.deref(_STAR_pw_confirm)))))?((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(_STAR_pw_confirm),cljs.core.deref(_STAR_password)))?daiquiri.core.create_element("span",null,["Password fields are not matching!"]):daiquiri.core.create_element("span",null,["Password fields are matching!"])):daiquiri.core.create_element("span",null,["Enter your chosen password again!"]))):daiquiri.core.create_element("span",null,["Choose a strong and hard to guess password!"]))]));
})(),((clojure.string.blank_QMARK_(cljs.core.deref(_STAR_password)))?null:daiquiri.core.create_element(daiquiri.core.fragment,null,[(function (){var attrs93354 = (function (){var included_set = cljs.core.set(new cljs.core.Keyword(null,"contains","contains",676899812).cljs$core$IFn$_invoke$arity$1(pw_strength));
var iter__5480__auto__ = (function frontend$components$encryption$iter__93355(s__93356){
return (new cljs.core.LazySeq(null,(function (){
var s__93356__$1 = s__93356;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__93356__$1);
if(temp__5804__auto__){
var s__93356__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__93356__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__93356__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__93358 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__93357 = (0);
while(true){
if((i__93357 < size__5479__auto__)){
var i = cljs.core._nth(c__5478__auto__,i__93357);
var included_QMARK_ = cljs.core.contains_QMARK_(included_set,i);
cljs.core.chunk_append(b__93358,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.strength-item","span.strength-item",1188975224),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),i,new cljs.core.Keyword(null,"class","class",-2030961996),((included_QMARK_)?"included":null)], null),frontend.ui.icon(((included_QMARK_)?"check":"x"),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-1"], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.capitalize","span.capitalize",-2115789042),i], null)], null));

var G__93421 = (i__93357 + (1));
i__93357 = G__93421;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__93358),frontend$components$encryption$iter__93355(cljs.core.chunk_rest(s__93356__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__93358),null);
}
} else {
var i = cljs.core.first(s__93356__$2);
var included_QMARK_ = cljs.core.contains_QMARK_(included_set,i);
return cljs.core.cons(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.strength-item","span.strength-item",1188975224),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),i,new cljs.core.Keyword(null,"class","class",-2030961996),((included_QMARK_)?"included":null)], null),frontend.ui.icon(((included_QMARK_)?"check":"x"),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"mr-1"], null)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.capitalize","span.capitalize",-2115789042),i], null)], null),frontend$components$encryption$iter__93355(cljs.core.rest(s__93356__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["lowercase","uppercase","number","symbol"], null));
})();
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs93354))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, ["input-hints","text-sm","py-2","px-3","rounded","mb-2","-mt-1","5","flex","items-center","sm:space-x-3","strength-wrap"], null)], null),attrs93354], 0))):{'className':"input-hints text-sm py-2 px-3 rounded mb-2 -mt-1 5 flex items-center sm:space-x-3 strength-wrap"}),((cljs.core.map_QMARK_(attrs93354))?null:[daiquiri.interpreter.interpret(attrs93354)]));
})(),daiquiri.core.create_element("div",{'className':"input-pw-strength"},[daiquiri.core.create_element("div",{'className':"indicator flex"},[cljs.core.into_array.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function frontend$components$encryption$iter__93359(s__93360){
return (new cljs.core.LazySeq(null,(function (){
var s__93360__$1 = s__93360;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__93360__$1);
if(temp__5804__auto__){
var s__93360__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__93360__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__93360__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__93362 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__93361 = (0);
while(true){
if((i__93361 < size__5479__auto__)){
var i = cljs.core._nth(c__5478__auto__,i__93361);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Too weak","Weak","Medium","Strong"], null),i);
cljs.core.chunk_append(b__93362,daiquiri.core.create_element("i",{'key':i,'title':title,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [((((new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(pw_strength) | (0)) >= i))?"active":null)], null))},[daiquiri.interpreter.interpret(i)]));

var G__93422 = (i__93361 + (1));
i__93361 = G__93422;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__93362),frontend$components$encryption$iter__93359(cljs.core.chunk_rest(s__93360__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__93362),null);
}
} else {
var i = cljs.core.first(s__93360__$2);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, ["Too weak","Weak","Medium","Strong"], null),i);
return cljs.core.cons(daiquiri.core.create_element("i",{'key':i,'title':title,'className':daiquiri.util.join_classes(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [((((new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(pw_strength) | (0)) >= i))?"active":null)], null))},[daiquiri.interpreter.interpret(i)]),frontend$components$encryption$iter__93359(cljs.core.rest(s__93360__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.range.cljs$core$IFn$_invoke$arity$1((4)));
})())])])]))]);
})():null),daiquiri.core.create_element("input",{'type':(cljs.core.truth_(cljs.core.deref(_STAR_show_password_QMARK_))?"text":"password"),'ref':_STAR_input_ref_0,'placeholder':"Password",'autoFocus':true,'disabled':loading_QMARK_,'onKeyUp':enter_handler,'onChange':rum.core.mark_sync_update((function (e){
cljs.core.reset_BANG_(_STAR_password,frontend.util.evalue(e));

if(cljs.core.truth_(new cljs.core.Keyword(null,"fail","fail",1706214930).cljs$core$IFn$_invoke$arity$1(set_remote_graph_pwd_result))){
return frontend.state.set_state_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("file-sync","set-remote-graph-password-result","file-sync/set-remote-graph-password-result",-1161271382)], null),cljs.core.PersistentArrayMap.EMPTY);
} else {
return null;
}
})),'className':"form-input block w-full sm:text-sm sm:leading-5 my-2"},[]),(cljs.core.truth_(init_graph_keys)?daiquiri.core.create_element("input",{'placeholder':"Re-enter the password",'disabled':loading_QMARK_,'ref':_STAR_input_ref_1,'type':(cljs.core.truth_(cljs.core.deref(_STAR_show_password_QMARK_))?"text":"password"),'onBlur':(function (){
return cljs.core.reset_BANG_(_STAR_pw_confirm_focused_QMARK_,false);
}),'className':"form-input block w-full sm:text-sm sm:leading-5 my-2",'onKeyUp':enter_handler,'onChange':rum.core.mark_sync_update((function (e){
return cljs.core.reset_BANG_(_STAR_pw_confirm,frontend.util.evalue(e));
})),'onFocus':(function (){
return cljs.core.reset_BANG_(_STAR_pw_confirm_focused_QMARK_,true);
})},[]):null),frontend.components.encryption.show_password_cp(_STAR_show_password_QMARK_),(cljs.core.truth_(init_graph_keys)?daiquiri.core.create_element("div",{'className':"init-remote-pw-tips space-x-4 pt-2 hidden sm:flex"},[daiquiri.core.create_element("div",{'className':"flex-1 flex items-center"},[(function (){var attrs93368 = frontend.ui.icon("key");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs93368))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["px-3","flex"], null)], null),attrs93368], 0))):{'className':"px-3 flex"}),((cljs.core.map_QMARK_(attrs93368))?null:[daiquiri.interpreter.interpret(attrs93368)]));
})(),daiquiri.core.create_element("p",{'className':"dark:text-gray-100"},[daiquiri.core.create_element("span",null,["Please make sure you "]),"remember the password you have set, as we are unable to reset or retrieve it in case you forget it, ",daiquiri.core.create_element("span",null,["and we recommend you "]),"keep a secure backup ",daiquiri.core.create_element("span",null,["of the password."])])]),daiquiri.core.create_element("div",{'className':"flex-1 flex items-center"},[(function (){var attrs93371 = frontend.ui.icon("lock");
return daiquiri.core.create_element("span",((cljs.core.map_QMARK_(attrs93371))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["px-3","flex"], null)], null),attrs93371], 0))):{'className':"px-3 flex"}),((cljs.core.map_QMARK_(attrs93371))?null:[daiquiri.interpreter.interpret(attrs93371)]));
})(),daiquiri.core.create_element("p",{'className':"dark:text-gray-100"},["If you lose your password, all of your data in the cloud can\u2019t be decrypted. ",daiquiri.core.create_element("span",null,["You will still be able to access the local version of your graph."])])])]):null)]),(function (){var attrs93204 = frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"cancel","cancel",-1964088360)], 0)),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"background","background",-863952629),"gray",new cljs.core.Keyword(null,"disabled","disabled",-1529784218),loading_QMARK_,new cljs.core.Keyword(null,"class","class",-2030961996),"opacity-60",new cljs.core.Keyword(null,"on-click","on-click",1632826543),cancel_handler], 0));
return daiquiri.core.create_element("div",((cljs.core.map_QMARK_(attrs93204))?daiquiri.interpreter.element_attributes(daiquiri.normalize.merge_with_class.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, ["mt-5","sm:mt-4","flex","justify-center","sm:justify-end","space-x-3"], null)], null),attrs93204], 0))):{'className':"mt-5 sm:mt-4 flex justify-center sm:justify-end space-x-3"}),((cljs.core.map_QMARK_(attrs93204))?[daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.inline-flex.items-center.leading-none","span.inline-flex.items-center.leading-none",-2074931546),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"submit","submit",-49315317)], 0))], null),(cljs.core.truth_(loading_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ml-1","span.ml-1",-436032201),frontend.ui.loading.cljs$core$IFn$_invoke$arity$2("",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-4 h-4"], null))], null):null)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(function (){var or__5002__auto__ = (!(can_submit_QMARK_()));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return loading_QMARK_;
}
})(),new cljs.core.Keyword(null,"on-click","on-click",1632826543),submit_handler], 0)))]:[daiquiri.interpreter.interpret(attrs93204),daiquiri.interpreter.interpret(frontend.ui.button.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.inline-flex.items-center.leading-none","span.inline-flex.items-center.leading-none",-2074931546),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),frontend.context.i18n.t.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"submit","submit",-49315317)], 0))], null),(cljs.core.truth_(loading_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.ml-1","span.ml-1",-436032201),frontend.ui.loading.cljs$core$IFn$_invoke$arity$2("",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-4 h-4"], null))], null):null)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(function (){var or__5002__auto__ = (!(can_submit_QMARK_()));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return loading_QMARK_;
}
})(),new cljs.core.Keyword(null,"on-click","on-click",1632826543),submit_handler], 0)))]));
})()]);
}),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive,rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.components.encryption","password","frontend.components.encryption/password",778875014)),rum.core.local.cljs$core$IFn$_invoke$arity$2("",new cljs.core.Keyword("frontend.components.encryption","pw-confirm","frontend.components.encryption/pw-confirm",1857232954)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.encryption","pw-confirm-focused?","frontend.components.encryption/pw-confirm-focused?",1772685568)),rum.core.local.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword("frontend.components.encryption","show-password?","frontend.components.encryption/show-password?",424518490)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"will-mount","will-mount",-434633071),(function (state){
var G__93374_93423 = frontend.state.sub(new cljs.core.Keyword("file-sync","jstour-inst","file-sync/jstour-inst",-1545838291));
if((G__93374_93423 == null)){
} else {
G__93374_93423.complete();
}

return state;
})], null)], null),"frontend.components.encryption/input-password-inner");
frontend.components.encryption.input_password = (function frontend$components$encryption$input_password(var_args){
var G__93377 = arguments.length;
switch (G__93377) {
case 2:
return frontend.components.encryption.input_password.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.components.encryption.input_password.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.components.encryption.input_password.cljs$core$IFn$_invoke$arity$2 = (function (repo_url,close_fn){
return frontend.components.encryption.input_password.cljs$core$IFn$_invoke$arity$3(repo_url,close_fn,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"local","local",-1497766724)], null));
}));

(frontend.components.encryption.input_password.cljs$core$IFn$_invoke$arity$3 = (function (repo_url,close_fn,opts){
return (function (close_fn_SINGLEQUOTE_){
var close_fn_SINGLEQUOTE___$1 = ((cljs.core.fn_QMARK_(close_fn))?(function (p1__93375_SHARP_){
(close_fn.cljs$core$IFn$_invoke$arity$1 ? close_fn.cljs$core$IFn$_invoke$arity$1(p1__93375_SHARP_) : close_fn.call(null,p1__93375_SHARP_));

return (close_fn_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$0 ? close_fn_SINGLEQUOTE_.cljs$core$IFn$_invoke$arity$0() : close_fn_SINGLEQUOTE_.call(null));
}):close_fn_SINGLEQUOTE_);
return frontend.components.encryption.input_password_inner(repo_url,close_fn_SINGLEQUOTE___$1,opts);
});
}));

(frontend.components.encryption.input_password.cljs$lang$maxFixedArity = 3);


//# sourceMappingURL=frontend.components.encryption.js.map
