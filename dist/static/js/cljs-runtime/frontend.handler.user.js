goog.provide('frontend.handler.user');
frontend.handler.user.set_preferred_format_BANG_ = (function frontend$handler$user$set_preferred_format_BANG_(format){
if(cljs.core.truth_(format)){
frontend.handler.config.set_config_BANG_(new cljs.core.Keyword(null,"preferred-format","preferred-format",-1784393121),format);

return frontend.state.set_preferred_format_BANG_(format);
} else {
return null;
}
});
frontend.handler.user.set_preferred_workflow_BANG_ = (function frontend$handler$user$set_preferred_workflow_BANG_(workflow){
if(cljs.core.truth_(workflow)){
frontend.handler.config.set_config_BANG_(new cljs.core.Keyword(null,"preferred-workflow","preferred-workflow",-1794663444),workflow);

return frontend.state.set_preferred_workflow_BANG_(workflow);
} else {
return null;
}
});
frontend.handler.user.decode_username = (function frontend$handler$user$decode_username(username){
var arr = (new Uint8Array(cljs.core.count(username)));
var seq__106615_107495 = cljs.core.seq(cljs.core.range.cljs$core$IFn$_invoke$arity$1(cljs.core.count(username)));
var chunk__106616_107496 = null;
var count__106617_107497 = (0);
var i__106618_107498 = (0);
while(true){
if((i__106618_107498 < count__106617_107497)){
var i_107499 = chunk__106616_107496.cljs$core$IIndexed$_nth$arity$2(null,i__106618_107498);
(arr[i_107499] = username.charCodeAt(i_107499));


var G__107500 = seq__106615_107495;
var G__107501 = chunk__106616_107496;
var G__107502 = count__106617_107497;
var G__107503 = (i__106618_107498 + (1));
seq__106615_107495 = G__107500;
chunk__106616_107496 = G__107501;
count__106617_107497 = G__107502;
i__106618_107498 = G__107503;
continue;
} else {
var temp__5804__auto___107504 = cljs.core.seq(seq__106615_107495);
if(temp__5804__auto___107504){
var seq__106615_107505__$1 = temp__5804__auto___107504;
if(cljs.core.chunked_seq_QMARK_(seq__106615_107505__$1)){
var c__5525__auto___107507 = cljs.core.chunk_first(seq__106615_107505__$1);
var G__107508 = cljs.core.chunk_rest(seq__106615_107505__$1);
var G__107509 = c__5525__auto___107507;
var G__107510 = cljs.core.count(c__5525__auto___107507);
var G__107511 = (0);
seq__106615_107495 = G__107508;
chunk__106616_107496 = G__107509;
count__106617_107497 = G__107510;
i__106618_107498 = G__107511;
continue;
} else {
var i_107512 = cljs.core.first(seq__106615_107505__$1);
(arr[i_107512] = username.charCodeAt(i_107512));


var G__107513 = cljs.core.next(seq__106615_107505__$1);
var G__107514 = null;
var G__107515 = (0);
var G__107516 = (0);
seq__106615_107495 = G__107513;
chunk__106616_107496 = G__107514;
count__106617_107497 = G__107515;
i__106618_107498 = G__107516;
continue;
}
} else {
}
}
break;
}

return (new TextDecoder("utf-8")).decode(arr);
});
frontend.handler.user.parse_jwt = (function frontend$handler$user$parse_jwt(jwt){
var G__106627 = jwt;
var G__106627__$1 = (((G__106627 == null))?null:clojure.string.split.cljs$core$IFn$_invoke$arity$2(G__106627,"."));
var G__106627__$2 = (((G__106627__$1 == null))?null:cljs.core.second(G__106627__$1));
var G__106627__$3 = (((G__106627__$2 == null))?null:(function (p1__106626_SHARP_){
return goog.crypt.base64.decodeString(p1__106626_SHARP_,true);
})(G__106627__$2));
var G__106627__$4 = (((G__106627__$3 == null))?null:JSON.parse(G__106627__$3));
var G__106627__$5 = (((G__106627__$4 == null))?null:cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(G__106627__$4,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0)));
if((G__106627__$5 == null)){
return null;
} else {
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__106627__$5,new cljs.core.Keyword(null,"cognito:username","cognito:username",-2023950904),frontend.handler.user.decode_username);
}
});
frontend.handler.user.expired_QMARK_ = (function frontend$handler$user$expired_QMARK_(parsed_jwt){
var G__106630 = ((1000) * new cljs.core.Keyword(null,"exp","exp",-261706262).cljs$core$IFn$_invoke$arity$1(parsed_jwt));
var G__106630__$1 = (((G__106630 == null))?null:cljs_time.coerce.from_long(G__106630));
if((G__106630__$1 == null)){
return null;
} else {
return cljs_time.core.before_QMARK_(G__106630__$1,cljs_time.core.now());
}
});
/**
 * return true when jwt will expire after 1h
 */
frontend.handler.user.almost_expired_QMARK_ = (function frontend$handler$user$almost_expired_QMARK_(parsed_jwt){
var G__106631 = ((1000) * new cljs.core.Keyword(null,"exp","exp",-261706262).cljs$core$IFn$_invoke$arity$1(parsed_jwt));
var G__106631__$1 = (((G__106631 == null))?null:cljs_time.coerce.from_long(G__106631));
if((G__106631__$1 == null)){
return null;
} else {
return cljs_time.core.before_QMARK_(G__106631__$1,cljs_time.core.from_now(cljs_time.core.hours.cljs$core$IFn$_invoke$arity$1((1))));
}
});
frontend.handler.user.almost_expired_or_expired_QMARK_ = (function frontend$handler$user$almost_expired_or_expired_QMARK_(parsed_jwt){
var or__5002__auto__ = frontend.handler.user.almost_expired_QMARK_(parsed_jwt);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.handler.user.expired_QMARK_(parsed_jwt);
}
});
frontend.handler.user.email = (function frontend$handler$user$email(){
var G__106632 = frontend.state.get_auth_id_token();
var G__106632__$1 = (((G__106632 == null))?null:frontend.handler.user.parse_jwt(G__106632));
if((G__106632__$1 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"email","email",1415816706).cljs$core$IFn$_invoke$arity$1(G__106632__$1);
}
});
frontend.handler.user.username = (function frontend$handler$user$username(){
var G__106633 = frontend.state.get_auth_id_token();
var G__106633__$1 = (((G__106633 == null))?null:frontend.handler.user.parse_jwt(G__106633));
if((G__106633__$1 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"cognito:username","cognito:username",-2023950904).cljs$core$IFn$_invoke$arity$1(G__106633__$1);
}
});
frontend.handler.user.user_uuid = (function frontend$handler$user$user_uuid(){
var G__106634 = frontend.state.get_auth_id_token();
var G__106634__$1 = (((G__106634 == null))?null:frontend.handler.user.parse_jwt(G__106634));
if((G__106634__$1 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"sub","sub",-2093760025).cljs$core$IFn$_invoke$arity$1(G__106634__$1);
}
});
frontend.handler.user.logged_in_QMARK_ = (function frontend$handler$user$logged_in_QMARK_(){
return (!((frontend.state.get_auth_refresh_token() == null)));
});
frontend.handler.user.set_token_to_localstorage_BANG_ = (function frontend$handler$user$set_token_to_localstorage_BANG_(var_args){
var G__106637 = arguments.length;
switch (G__106637) {
case 2:
return frontend.handler.user.set_token_to_localstorage_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.handler.user.set_token_to_localstorage_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.user.set_token_to_localstorage_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (id_token,access_token){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),"set-token-to-localstorage!"], 0));

localStorage.setItem("id-token",id_token);

return localStorage.setItem("access-token",access_token);
}));

(frontend.handler.user.set_token_to_localstorage_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (id_token,access_token,refresh_token){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),"set-token-to-localstorage!"], 0));

localStorage.setItem("id-token",id_token);

localStorage.setItem("access-token",access_token);

return localStorage.setItem("refresh-token",refresh_token);
}));

(frontend.handler.user.set_token_to_localstorage_BANG_.cljs$lang$maxFixedArity = 3);

/**
 * Clear tokens for cognito's localstorage, prefix is 'CognitoIdentityServiceProvider'
 */
frontend.handler.user.clear_cognito_tokens_BANG_ = (function frontend$handler$user$clear_cognito_tokens_BANG_(){
var prefix = "CognitoIdentityServiceProvider.";
var seq__106638 = cljs.core.seq(Object.keys(localStorage));
var chunk__106639 = null;
var count__106640 = (0);
var i__106641 = (0);
while(true){
if((i__106641 < count__106640)){
var key = chunk__106639.cljs$core$IIndexed$_nth$arity$2(null,i__106641);
if(clojure.string.starts_with_QMARK_(key,prefix)){
localStorage.removeItem(key);
} else {
}


var G__107520 = seq__106638;
var G__107521 = chunk__106639;
var G__107522 = count__106640;
var G__107523 = (i__106641 + (1));
seq__106638 = G__107520;
chunk__106639 = G__107521;
count__106640 = G__107522;
i__106641 = G__107523;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__106638);
if(temp__5804__auto__){
var seq__106638__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__106638__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__106638__$1);
var G__107524 = cljs.core.chunk_rest(seq__106638__$1);
var G__107525 = c__5525__auto__;
var G__107526 = cljs.core.count(c__5525__auto__);
var G__107527 = (0);
seq__106638 = G__107524;
chunk__106639 = G__107525;
count__106640 = G__107526;
i__106641 = G__107527;
continue;
} else {
var key = cljs.core.first(seq__106638__$1);
if(clojure.string.starts_with_QMARK_(key,prefix)){
localStorage.removeItem(key);
} else {
}


var G__107528 = cljs.core.next(seq__106638__$1);
var G__107529 = null;
var G__107530 = (0);
var G__107531 = (0);
seq__106638 = G__107528;
chunk__106639 = G__107529;
count__106640 = G__107530;
i__106641 = G__107531;
continue;
}
} else {
return null;
}
}
break;
}
});
frontend.handler.user.clear_tokens = (function frontend$handler$user$clear_tokens(var_args){
var G__106643 = arguments.length;
switch (G__106643) {
case 0:
return frontend.handler.user.clear_tokens.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return frontend.handler.user.clear_tokens.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.user.clear_tokens.cljs$core$IFn$_invoke$arity$0 = (function (){
frontend.state.set_auth_id_token(null);

frontend.state.set_auth_access_token(null);

frontend.state.set_auth_refresh_token(null);

frontend.handler.user.set_token_to_localstorage_BANG_.cljs$core$IFn$_invoke$arity$3("","","");

return frontend.handler.user.clear_cognito_tokens_BANG_();
}));

(frontend.handler.user.clear_tokens.cljs$core$IFn$_invoke$arity$1 = (function (except_refresh_token_QMARK_){
frontend.state.set_auth_id_token(null);

frontend.state.set_auth_access_token(null);

if(cljs.core.truth_(except_refresh_token_QMARK_)){
} else {
frontend.state.set_auth_refresh_token(null);
}

if(cljs.core.truth_(except_refresh_token_QMARK_)){
return frontend.handler.user.set_token_to_localstorage_BANG_.cljs$core$IFn$_invoke$arity$2("","");
} else {
return frontend.handler.user.set_token_to_localstorage_BANG_.cljs$core$IFn$_invoke$arity$3("","","");
}
}));

(frontend.handler.user.clear_tokens.cljs$lang$maxFixedArity = 1);

frontend.handler.user.set_tokens_BANG_ = (function frontend$handler$user$set_tokens_BANG_(var_args){
var G__106647 = arguments.length;
switch (G__106647) {
case 2:
return frontend.handler.user.set_tokens_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.handler.user.set_tokens_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.user.set_tokens_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (id_token,access_token){
frontend.state.set_auth_id_token(id_token);

frontend.state.set_auth_access_token(access_token);

frontend.handler.user.set_token_to_localstorage_BANG_.cljs$core$IFn$_invoke$arity$2(id_token,access_token);

var G__106650 = frontend.handler.user.parse_jwt(frontend.state.get_auth_id_token());
if((G__106650 == null)){
return null;
} else {
return cljs.core.reset_BANG_(frontend.flows._STAR_current_login_user,G__106650);
}
}));

(frontend.handler.user.set_tokens_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (id_token,access_token,refresh_token){
frontend.state.set_auth_id_token(id_token);

frontend.state.set_auth_access_token(access_token);

frontend.state.set_auth_refresh_token(refresh_token);

frontend.handler.user.set_token_to_localstorage_BANG_.cljs$core$IFn$_invoke$arity$3(id_token,access_token,refresh_token);

var G__106652 = frontend.handler.user.parse_jwt(frontend.state.get_auth_id_token());
if((G__106652 == null)){
return null;
} else {
return cljs.core.reset_BANG_(frontend.flows._STAR_current_login_user,G__106652);
}
}));

(frontend.handler.user.set_tokens_BANG_.cljs$lang$maxFixedArity = 3);

/**
 * return refreshed id-token, access-token
 */
frontend.handler.user._LT_refresh_tokens = (function frontend$handler$user$_LT_refresh_tokens(refresh_token){
return cljs_http.client.post.cljs$core$IFn$_invoke$arity$variadic(["https://",frontend.config.OAUTH_DOMAIN,"/oauth2/token"].join(''),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"form-params","form-params",1884296467),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"grant_type","grant_type",-293641122),"refresh_token",new cljs.core.Keyword(null,"client_id","client_id",48809273),frontend.config.COGNITO_CLIENT_ID,new cljs.core.Keyword(null,"refresh_token","refresh_token",-162233815),refresh_token], null)], null)], 0));
});
/**
 * Refresh id-token and access-token
 */
frontend.handler.user._LT_refresh_id_token_AMPERSAND_access_token = (function frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token(){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_106742){
var state_val_106743 = (state_106742[(1)]);
if((state_val_106743 === (7))){
var inst_106662 = (state_106742[(7)]);
var state_106742__$1 = state_106742;
var statearr_106744_107535 = state_106742__$1;
(statearr_106744_107535[(2)] = inst_106662);

(statearr_106744_107535[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (20))){
var inst_106697 = (state_106742[(2)]);
var state_106742__$1 = state_106742;
if(cljs.core.truth_(inst_106697)){
var statearr_106745_107536 = state_106742__$1;
(statearr_106745_107536[(1)] = (21));

} else {
var statearr_106746_107537 = state_106742__$1;
(statearr_106746_107537[(1)] = (22));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (27))){
var inst_106660 = (state_106742[(8)]);
var inst_106713 = (state_106742[(9)]);
var inst_106712 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(inst_106660);
var inst_106713__$1 = new cljs.core.Keyword(null,"id_token","id_token",148712273).cljs$core$IFn$_invoke$arity$1(inst_106712);
var state_106742__$1 = (function (){var statearr_106747 = state_106742;
(statearr_106747[(9)] = inst_106713__$1);

return statearr_106747;
})();
if(cljs.core.truth_(inst_106713__$1)){
var statearr_106748_107538 = state_106742__$1;
(statearr_106748_107538[(1)] = (30));

} else {
var statearr_106749_107539 = state_106742__$1;
(statearr_106749_107539[(1)] = (31));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (1))){
var inst_106656 = (state_106742[(10)]);
var inst_106656__$1 = frontend.state.get_auth_refresh_token();
var state_106742__$1 = (function (){var statearr_106750 = state_106742;
(statearr_106750[(10)] = inst_106656__$1);

return statearr_106750;
})();
if(cljs.core.truth_(inst_106656__$1)){
var statearr_106751_107540 = state_106742__$1;
(statearr_106751_107540[(1)] = (2));

} else {
var statearr_106752_107541 = state_106742__$1;
(statearr_106752_107541[(1)] = (3));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (24))){
var inst_106709 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3("exceptional status when refresh-token",new cljs.core.Keyword(null,"warning","warning",-1685650671),true);
var state_106742__$1 = state_106742;
var statearr_106753_107543 = state_106742__$1;
(statearr_106753_107543[(2)] = inst_106709);

(statearr_106753_107543[(1)] = (26));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (4))){
var inst_106740 = (state_106742[(2)]);
var state_106742__$1 = state_106742;
return cljs.core.async.impl.ioc_helpers.return_chan(state_106742__$1,inst_106740);
} else {
if((state_val_106743 === (15))){
var inst_106682 = frontend.handler.user.clear_tokens.cljs$core$IFn$_invoke$arity$0();
var state_106742__$1 = state_106742;
var statearr_106756_107545 = state_106742__$1;
(statearr_106756_107545[(2)] = inst_106682);

(statearr_106756_107545[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (21))){
var inst_106660 = (state_106742[(8)]);
var inst_106699 = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(inst_106660);
var inst_106700 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(inst_106660);
var inst_106701 = new cljs.core.Keyword(null,"error-code","error-code",180497232).cljs$core$IFn$_invoke$arity$1(inst_106660);
var inst_106702 = new cljs.core.Keyword(null,"error-text","error-text",2021893718).cljs$core$IFn$_invoke$arity$1(inst_106660);
var inst_106703 = cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"refresh-token-failed","refresh-token-failed",-110191038),new cljs.core.Keyword(null,"status","status",-1997798413),inst_106699,new cljs.core.Keyword(null,"body","body",-2049205669),inst_106700,new cljs.core.Keyword(null,"error-code","error-code",180497232),inst_106701,new cljs.core.Keyword(null,"error-text","error-text",2021893718),inst_106702], 0));
var state_106742__$1 = (function (){var statearr_106768 = state_106742;
(statearr_106768[(11)] = inst_106703);

return statearr_106768;
})();
var statearr_106770_107546 = state_106742__$1;
(statearr_106770_107546[(2)] = null);

(statearr_106770_107546[(1)] = (23));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (31))){
var inst_106713 = (state_106742[(9)]);
var state_106742__$1 = state_106742;
var statearr_106777_107547 = state_106742__$1;
(statearr_106777_107547[(2)] = inst_106713);

(statearr_106777_107547[(1)] = (32));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (32))){
var inst_106719 = (state_106742[(2)]);
var state_106742__$1 = state_106742;
if(cljs.core.truth_(inst_106719)){
var statearr_106779_107548 = state_106742__$1;
(statearr_106779_107548[(1)] = (33));

} else {
var statearr_106780_107549 = state_106742__$1;
(statearr_106780_107549[(1)] = (34));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (33))){
var inst_106660 = (state_106742[(8)]);
var inst_106721 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(inst_106660);
var inst_106722 = new cljs.core.Keyword(null,"id_token","id_token",148712273).cljs$core$IFn$_invoke$arity$1(inst_106721);
var inst_106723 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(inst_106660);
var inst_106724 = new cljs.core.Keyword(null,"access_token","access_token",1591156073).cljs$core$IFn$_invoke$arity$1(inst_106723);
var inst_106725 = frontend.handler.user.set_tokens_BANG_.cljs$core$IFn$_invoke$arity$2(inst_106722,inst_106724);
var state_106742__$1 = state_106742;
var statearr_106782_107550 = state_106742__$1;
(statearr_106782_107550[(2)] = inst_106725);

(statearr_106782_107550[(1)] = (35));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (13))){
var inst_106671 = (state_106742[(12)]);
var state_106742__$1 = state_106742;
var statearr_106787_107551 = state_106742__$1;
(statearr_106787_107551[(2)] = inst_106671);

(statearr_106787_107551[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (22))){
var inst_106660 = (state_106742[(8)]);
var inst_106705 = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(inst_106660);
var inst_106706 = (cljs_http.client.unexceptional_status_QMARK_.cljs$core$IFn$_invoke$arity$1 ? cljs_http.client.unexceptional_status_QMARK_.cljs$core$IFn$_invoke$arity$1(inst_106705) : cljs_http.client.unexceptional_status_QMARK_.call(null,inst_106705));
var inst_106707 = cljs.core.not(inst_106706);
var state_106742__$1 = state_106742;
if(inst_106707){
var statearr_106791_107552 = state_106742__$1;
(statearr_106791_107552[(1)] = (24));

} else {
var statearr_106792_107553 = state_106742__$1;
(statearr_106792_107553[(1)] = (25));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (29))){
var inst_106731 = (state_106742[(2)]);
var state_106742__$1 = state_106742;
var statearr_106794_107554 = state_106742__$1;
(statearr_106794_107554[(2)] = inst_106731);

(statearr_106794_107554[(1)] = (26));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (6))){
var inst_106660 = (state_106742[(8)]);
var inst_106664 = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(inst_106660);
var inst_106665 = ((500) > inst_106664);
var state_106742__$1 = state_106742;
var statearr_106797_107555 = state_106742__$1;
(statearr_106797_107555[(2)] = inst_106665);

(statearr_106797_107555[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (28))){
var state_106742__$1 = state_106742;
var statearr_106798_107556 = state_106742__$1;
(statearr_106798_107556[(2)] = null);

(statearr_106798_107556[(1)] = (29));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (25))){
var state_106742__$1 = state_106742;
var statearr_106800_107557 = state_106742__$1;
(statearr_106800_107557[(1)] = (27));



return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (34))){
var state_106742__$1 = state_106742;
var statearr_106805_107558 = state_106742__$1;
(statearr_106805_107558[(2)] = null);

(statearr_106805_107558[(1)] = (35));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (17))){
var inst_106685 = (state_106742[(2)]);
var state_106742__$1 = state_106742;
var statearr_106808_107559 = state_106742__$1;
(statearr_106808_107559[(2)] = inst_106685);

(statearr_106808_107559[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (3))){
var state_106742__$1 = state_106742;
var statearr_106809_107560 = state_106742__$1;
(statearr_106809_107560[(2)] = null);

(statearr_106809_107560[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (12))){
var inst_106660 = (state_106742[(8)]);
var inst_106673 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(inst_106660);
var inst_106674 = new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(inst_106673);
var inst_106675 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_106674,"invalid_grant");
var state_106742__$1 = state_106742;
var statearr_106811_107561 = state_106742__$1;
(statearr_106811_107561[(2)] = inst_106675);

(statearr_106811_107561[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (2))){
var inst_106656 = (state_106742[(10)]);
var inst_106658 = frontend.handler.user._LT_refresh_tokens(inst_106656);
var state_106742__$1 = state_106742;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_106742__$1,(5),inst_106658);
} else {
if((state_val_106743 === (23))){
var inst_106735 = (state_106742[(2)]);
var state_106742__$1 = state_106742;
var statearr_106813_107562 = state_106742__$1;
(statearr_106813_107562[(2)] = inst_106735);

(statearr_106813_107562[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (35))){
var inst_106728 = (state_106742[(2)]);
var state_106742__$1 = state_106742;
var statearr_106814_107563 = state_106742__$1;
(statearr_106814_107563[(2)] = inst_106728);

(statearr_106814_107563[(1)] = (29));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (19))){
var inst_106689 = (state_106742[(13)]);
var state_106742__$1 = state_106742;
var statearr_106816_107564 = state_106742__$1;
(statearr_106816_107564[(2)] = inst_106689);

(statearr_106816_107564[(1)] = (20));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (11))){
var inst_106737 = (state_106742[(2)]);
var state_106742__$1 = state_106742;
var statearr_106819_107565 = state_106742__$1;
(statearr_106819_107565[(2)] = inst_106737);

(statearr_106819_107565[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (9))){
var inst_106660 = (state_106742[(8)]);
var inst_106671 = (state_106742[(12)]);
var inst_106670 = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(inst_106660);
var inst_106671__$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((400),inst_106670);
var state_106742__$1 = (function (){var statearr_106848 = state_106742;
(statearr_106848[(12)] = inst_106671__$1);

return statearr_106848;
})();
if(inst_106671__$1){
var statearr_106849_107566 = state_106742__$1;
(statearr_106849_107566[(1)] = (12));

} else {
var statearr_106854_107567 = state_106742__$1;
(statearr_106854_107567[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (5))){
var inst_106660 = (state_106742[(8)]);
var inst_106662 = (state_106742[(7)]);
var inst_106660__$1 = (state_106742[(2)]);
var inst_106661 = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(inst_106660__$1);
var inst_106662__$1 = ((400) <= inst_106661);
var state_106742__$1 = (function (){var statearr_106855 = state_106742;
(statearr_106855[(8)] = inst_106660__$1);

(statearr_106855[(7)] = inst_106662__$1);

return statearr_106855;
})();
if(cljs.core.truth_(inst_106662__$1)){
var statearr_106856_107568 = state_106742__$1;
(statearr_106856_107568[(1)] = (6));

} else {
var statearr_106857_107569 = state_106742__$1;
(statearr_106857_107569[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (14))){
var inst_106660 = (state_106742[(8)]);
var inst_106678 = (state_106742[(2)]);
var inst_106679 = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(inst_106660);
var inst_106680 = cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"refresh-token-failed","refresh-token-failed",-110191038),new cljs.core.Keyword(null,"status","status",-1997798413),inst_106679], 0));
var state_106742__$1 = (function (){var statearr_106860 = state_106742;
(statearr_106860[(14)] = inst_106680);

return statearr_106860;
})();
if(cljs.core.truth_(inst_106678)){
var statearr_106861_107570 = state_106742__$1;
(statearr_106861_107570[(1)] = (15));

} else {
var statearr_106862_107571 = state_106742__$1;
(statearr_106862_107571[(1)] = (16));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (26))){
var inst_106733 = (state_106742[(2)]);
var state_106742__$1 = state_106742;
var statearr_106863_107572 = state_106742__$1;
(statearr_106863_107572[(2)] = inst_106733);

(statearr_106863_107572[(1)] = (23));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (16))){
var state_106742__$1 = state_106742;
var statearr_106866_107573 = state_106742__$1;
(statearr_106866_107573[(2)] = null);

(statearr_106866_107573[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (30))){
var inst_106660 = (state_106742[(8)]);
var inst_106715 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(inst_106660);
var inst_106716 = new cljs.core.Keyword(null,"access_token","access_token",1591156073).cljs$core$IFn$_invoke$arity$1(inst_106715);
var state_106742__$1 = state_106742;
var statearr_106867_107574 = state_106742__$1;
(statearr_106867_107574[(2)] = inst_106716);

(statearr_106867_107574[(1)] = (32));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (10))){
var inst_106660 = (state_106742[(8)]);
var inst_106689 = (state_106742[(13)]);
var inst_106687 = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(inst_106660);
var inst_106688 = (cljs_http.client.unexceptional_status_QMARK_.cljs$core$IFn$_invoke$arity$1 ? cljs_http.client.unexceptional_status_QMARK_.cljs$core$IFn$_invoke$arity$1(inst_106687) : cljs_http.client.unexceptional_status_QMARK_.call(null,inst_106687));
var inst_106689__$1 = cljs.core.not(inst_106688);
var state_106742__$1 = (function (){var statearr_106870 = state_106742;
(statearr_106870[(13)] = inst_106689__$1);

return statearr_106870;
})();
if(inst_106689__$1){
var statearr_106871_107575 = state_106742__$1;
(statearr_106871_107575[(1)] = (18));

} else {
var statearr_106872_107576 = state_106742__$1;
(statearr_106872_107576[(1)] = (19));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (18))){
var inst_106691 = frontend.state.get_auth_id_token();
var inst_106692 = frontend.handler.user.parse_jwt(inst_106691);
var inst_106693 = frontend.handler.user.expired_QMARK_(inst_106692);
var inst_106694 = cljs.core.not(inst_106693);
var state_106742__$1 = state_106742;
var statearr_106873_107577 = state_106742__$1;
(statearr_106873_107577[(2)] = inst_106694);

(statearr_106873_107577[(1)] = (20));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106743 === (8))){
var inst_106668 = (state_106742[(2)]);
var state_106742__$1 = state_106742;
if(cljs.core.truth_(inst_106668)){
var statearr_106875_107578 = state_106742__$1;
(statearr_106875_107578[(1)] = (9));

} else {
var statearr_106876_107579 = state_106742__$1;
(statearr_106876_107579[(1)] = (10));

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
var frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32004__auto__ = null;
var frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32004__auto____0 = (function (){
var statearr_106880 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_106880[(0)] = frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32004__auto__);

(statearr_106880[(1)] = (1));

return statearr_106880;
});
var frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32004__auto____1 = (function (state_106742){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_106742);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e106881){var ex__32007__auto__ = e106881;
var statearr_106882_107580 = state_106742;
(statearr_106882_107580[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_106742[(4)]))){
var statearr_106883_107581 = state_106742;
(statearr_106883_107581[(1)] = cljs.core.first((state_106742[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__107582 = state_106742;
state_106742 = G__107582;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32004__auto__ = function(state_106742){
switch(arguments.length){
case 0:
return frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32004__auto____1.call(this,state_106742);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32004__auto____0;
frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32004__auto____1;
return frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_106886 = f__32196__auto__();
(statearr_106886[(6)] = c__32195__auto__);

return statearr_106886;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
/**
 * Refresh id-token&access-token, pull latest repos, returns nil when tokens are not available.
 */
frontend.handler.user.restore_tokens_from_localstorage = (function frontend$handler$user$restore_tokens_from_localstorage(){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["restore-tokens-from-localstorage"], 0));

var refresh_token = localStorage.getItem("refresh-token");
if(cljs.core.truth_(refresh_token)){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_106920){
var state_val_106921 = (state_106920[(1)]);
if((state_val_106921 === (1))){
var inst_106906 = frontend.handler.user._LT_refresh_id_token_AMPERSAND_access_token();
var state_106920__$1 = state_106920;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_106920__$1,(2),inst_106906);
} else {
if((state_val_106921 === (2))){
var inst_106908 = (state_106920[(2)]);
var inst_106909 = frontend.handler.user.user_uuid();
var state_106920__$1 = (function (){var statearr_106937 = state_106920;
(statearr_106937[(7)] = inst_106908);

return statearr_106937;
})();
if(cljs.core.truth_(inst_106909)){
var statearr_106938_107585 = state_106920__$1;
(statearr_106938_107585[(1)] = (3));

} else {
var statearr_106939_107586 = state_106920__$1;
(statearr_106939_107586[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106921 === (3))){
var inst_106911 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_106912 = [new cljs.core.Keyword("user","fetch-info-and-graphs","user/fetch-info-and-graphs",-1029959720)];
var inst_106913 = (new cljs.core.PersistentVector(null,1,(5),inst_106911,inst_106912,null));
var inst_106914 = frontend.state.pub_event_BANG_(inst_106913);
var state_106920__$1 = state_106920;
var statearr_106940_107587 = state_106920__$1;
(statearr_106940_107587[(2)] = inst_106914);

(statearr_106940_107587[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106921 === (4))){
var state_106920__$1 = state_106920;
var statearr_106941_107588 = state_106920__$1;
(statearr_106941_107588[(2)] = null);

(statearr_106941_107588[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_106921 === (5))){
var inst_106917 = (state_106920[(2)]);
var state_106920__$1 = state_106920;
return cljs.core.async.impl.ioc_helpers.return_chan(state_106920__$1,inst_106917);
} else {
return null;
}
}
}
}
}
});
return (function() {
var frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32004__auto__ = null;
var frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32004__auto____0 = (function (){
var statearr_106946 = [null,null,null,null,null,null,null,null];
(statearr_106946[(0)] = frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32004__auto__);

(statearr_106946[(1)] = (1));

return statearr_106946;
});
var frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32004__auto____1 = (function (state_106920){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_106920);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e106948){var ex__32007__auto__ = e106948;
var statearr_106949_107589 = state_106920;
(statearr_106949_107589[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_106920[(4)]))){
var statearr_106950_107590 = state_106920;
(statearr_106950_107590[(1)] = cljs.core.first((state_106920[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__107591 = state_106920;
state_106920 = G__107591;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32004__auto__ = function(state_106920){
switch(arguments.length){
case 0:
return frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32004__auto____1.call(this,state_106920);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32004__auto____0;
frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32004__auto____1;
return frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_106954 = f__32196__auto__();
(statearr_106954[(6)] = c__32195__auto__);

return statearr_106954;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
} else {
return null;
}
});
/**
 * Has refresh-token
 */
frontend.handler.user.has_refresh_token_QMARK_ = (function frontend$handler$user$has_refresh_token_QMARK_(){
return cljs.core.boolean$(localStorage.getItem("refresh-token"));
});
frontend.handler.user.login_callback = (function frontend$handler$user$login_callback(session){
frontend.handler.user.set_tokens_BANG_.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"jwtToken","jwtToken",-2095982914).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"idToken","idToken",922710925).cljs$core$IFn$_invoke$arity$1(session)),new cljs.core.Keyword(null,"jwtToken","jwtToken",-2095982914).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"accessToken","accessToken",1833707055).cljs$core$IFn$_invoke$arity$1(session)),new cljs.core.Keyword(null,"token","token",-1211463215).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"refreshToken","refreshToken",-1274875461).cljs$core$IFn$_invoke$arity$1(session)));

return frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("user","fetch-info-and-graphs","user/fetch-info-and-graphs",-1029959720)], null));
});
frontend.handler.user.login_with_username_password_e2e = (function frontend$handler$user$login_with_username_password_e2e(username_SINGLEQUOTE_,password,client_id,client_secret){
var text_encoder = (new TextEncoder());
var key = text_encoder.encode(client_secret);
var hasher = (new goog.crypt.Sha256());
var hmacer = (new goog.crypt.Hmac(hasher,key));
var secret_hash = goog.crypt.base64.encodeByteArray(hmacer.getHmac([cljs.core.str.cljs$core$IFn$_invoke$arity$1(username_SINGLEQUOTE_),cljs.core.str.cljs$core$IFn$_invoke$arity$1(client_id)].join('')));
var payload = new cljs.core.PersistentArrayMap(null, 3, ["AuthParameters",new cljs.core.PersistentArrayMap(null, 3, ["USERNAME",username_SINGLEQUOTE_,"PASSWORD",password,"SECRET_HASH",secret_hash], null),"AuthFlow","USER_PASSWORD_AUTH","ClientId",client_id], null);
var headers = new cljs.core.PersistentArrayMap(null, 2, ["X-Amz-Target","AWSCognitoIdentityProviderService.InitiateAuth","Content-Type","application/x-amz-json-1.1"], null);
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_107122){
var state_val_107123 = (state_107122[(1)]);
if((state_val_107123 === (1))){
var inst_107058 = [new cljs.core.Keyword(null,"headers","headers",-835030129),new cljs.core.Keyword(null,"body","body",-2049205669)];
var inst_107059 = cljs.core.clj__GT_js(payload);
var inst_107060 = JSON.stringify(inst_107059);
var inst_107061 = [headers,inst_107060];
var inst_107062 = cljs.core.PersistentHashMap.fromArrays(inst_107058,inst_107061);
var inst_107063 = cljs_http.client.post.cljs$core$IFn$_invoke$arity$variadic(frontend.config.COGNITO_IDP,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inst_107062], 0));
var state_107122__$1 = state_107122;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_107122__$1,(2),inst_107063);
} else {
if((state_val_107123 === (2))){
var inst_107066 = (state_107122[(7)]);
var inst_107066__$1 = (state_107122[(2)]);
var inst_107067 = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(inst_107066__$1);
var inst_107068 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((200),inst_107067);
var state_107122__$1 = (function (){var statearr_107136 = state_107122;
(statearr_107136[(7)] = inst_107066__$1);

return statearr_107136;
})();
if(inst_107068){
var statearr_107137_107592 = state_107122__$1;
(statearr_107137_107592[(1)] = (3));

} else {
var statearr_107138_107593 = state_107122__$1;
(statearr_107138_107593[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_107123 === (3))){
var state_107122__$1 = state_107122;
var statearr_107139_107594 = state_107122__$1;
(statearr_107139_107594[(2)] = null);

(statearr_107139_107594[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_107123 === (4))){
var inst_107071 = (new Error("Assert failed: (= 200 (:status resp))"));
var inst_107072 = (function(){throw inst_107071})();
var state_107122__$1 = state_107122;
var statearr_107140_107595 = state_107122__$1;
(statearr_107140_107595[(2)] = inst_107072);

(statearr_107140_107595[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_107123 === (5))){
var inst_107066 = (state_107122[(7)]);
var inst_107074 = (state_107122[(2)]);
var inst_107075 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(inst_107066);
var inst_107076 = JSON.parse(inst_107075);
var inst_107077 = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$1(inst_107076);
var inst_107098 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_107099 = ["AuthenticationResult","AccessToken"];
var inst_107100 = (new cljs.core.PersistentVector(null,2,(5),inst_107098,inst_107099,null));
var inst_107101 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(inst_107077,inst_107100);
var inst_107102 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_107103 = ["AuthenticationResult","IdToken"];
var inst_107104 = (new cljs.core.PersistentVector(null,2,(5),inst_107102,inst_107103,null));
var inst_107105 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(inst_107077,inst_107104);
var inst_107107 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_107108 = ["AuthenticationResult","RefreshToken"];
var inst_107109 = (new cljs.core.PersistentVector(null,2,(5),inst_107107,inst_107108,null));
var inst_107110 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(inst_107077,inst_107109);
var inst_107111 = frontend.handler.user.set_tokens_BANG_.cljs$core$IFn$_invoke$arity$3(inst_107105,inst_107101,inst_107110);
var inst_107112 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_107113 = [new cljs.core.Keyword("user","fetch-info-and-graphs","user/fetch-info-and-graphs",-1029959720)];
var inst_107114 = (new cljs.core.PersistentVector(null,1,(5),inst_107112,inst_107113,null));
var inst_107115 = frontend.state.pub_event_BANG_(inst_107114);
var inst_107116 = [new cljs.core.Keyword(null,"id-token","id-token",-339268306),new cljs.core.Keyword(null,"access-token","access-token",-654201199),new cljs.core.Keyword(null,"refresh-token","refresh-token",-1032003584)];
var inst_107117 = [inst_107105,inst_107101,inst_107110];
var inst_107118 = cljs.core.PersistentHashMap.fromArrays(inst_107116,inst_107117);
var state_107122__$1 = (function (){var statearr_107141 = state_107122;
(statearr_107141[(8)] = inst_107074);

(statearr_107141[(9)] = inst_107111);

(statearr_107141[(10)] = inst_107115);

return statearr_107141;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_107122__$1,inst_107118);
} else {
return null;
}
}
}
}
}
});
return (function() {
var frontend$handler$user$login_with_username_password_e2e_$_state_machine__32004__auto__ = null;
var frontend$handler$user$login_with_username_password_e2e_$_state_machine__32004__auto____0 = (function (){
var statearr_107142 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_107142[(0)] = frontend$handler$user$login_with_username_password_e2e_$_state_machine__32004__auto__);

(statearr_107142[(1)] = (1));

return statearr_107142;
});
var frontend$handler$user$login_with_username_password_e2e_$_state_machine__32004__auto____1 = (function (state_107122){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_107122);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e107143){var ex__32007__auto__ = e107143;
var statearr_107144_107596 = state_107122;
(statearr_107144_107596[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_107122[(4)]))){
var statearr_107145_107597 = state_107122;
(statearr_107145_107597[(1)] = cljs.core.first((state_107122[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__107598 = state_107122;
state_107122 = G__107598;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$user$login_with_username_password_e2e_$_state_machine__32004__auto__ = function(state_107122){
switch(arguments.length){
case 0:
return frontend$handler$user$login_with_username_password_e2e_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$user$login_with_username_password_e2e_$_state_machine__32004__auto____1.call(this,state_107122);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$user$login_with_username_password_e2e_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$user$login_with_username_password_e2e_$_state_machine__32004__auto____0;
frontend$handler$user$login_with_username_password_e2e_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$user$login_with_username_password_e2e_$_state_machine__32004__auto____1;
return frontend$handler$user$login_with_username_password_e2e_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_107146 = f__32196__auto__();
(statearr_107146[(6)] = c__32195__auto__);

return statearr_107146;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
goog.exportSymbol('frontend.handler.user.login_with_username_password_e2e', frontend.handler.user.login_with_username_password_e2e);
frontend.handler.user.logout = (function frontend$handler$user$logout(){
frontend.handler.user.clear_tokens.cljs$core$IFn$_invoke$arity$0();

frontend.state.clear_user_info_BANG_();

frontend.state.pub_event_BANG_(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("user","logout","user/logout",1413770948)], null));

return cljs.core.reset_BANG_(frontend.flows._STAR_current_login_user,new cljs.core.Keyword(null,"logout","logout",1418564329));
});
frontend.handler.user.upgrade = (function frontend$handler$user$upgrade(){
var base_upgrade_url = "https://logseqdemo.lemonsqueezy.com/checkout/buy/13e194b5-c927-41a8-af58-ed1a36d6000d";
var user_uuid_SINGLEQUOTE_ = frontend.handler.user.user_uuid();
var url = (function (){var G__107147 = base_upgrade_url;
if(cljs.core.truth_(user_uuid_SINGLEQUOTE_)){
return [G__107147,"?checkout[custom][user_uuid]=",cljs.core.name(user_uuid_SINGLEQUOTE_)].join('');
} else {
return G__107147;
}
})();
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ~~~ LEMON: ",url," ~~~ "], 0));

return window.open(url);
});
frontend.handler.user._LT_ensure_id_AMPERSAND_access_token = (function frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token(){
var id_token = frontend.state.get_auth_id_token();
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_107186){
var state_val_107187 = (state_107186[(1)]);
if((state_val_107187 === (7))){
var inst_107184 = (state_107186[(2)]);
var state_107186__$1 = state_107186;
return cljs.core.async.impl.ioc_helpers.return_chan(state_107186__$1,inst_107184);
} else {
if((state_val_107187 === (1))){
var inst_107148 = (state_107186[(7)]);
var inst_107148__$1 = (id_token == null);
var state_107186__$1 = (function (){var statearr_107188 = state_107186;
(statearr_107188[(7)] = inst_107148__$1);

return statearr_107188;
})();
if(cljs.core.truth_(inst_107148__$1)){
var statearr_107189_107599 = state_107186__$1;
(statearr_107189_107599[(1)] = (2));

} else {
var statearr_107190_107600 = state_107186__$1;
(statearr_107190_107600[(1)] = (3));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_107187 === (4))){
var inst_107154 = (state_107186[(2)]);
var state_107186__$1 = state_107186;
if(cljs.core.truth_(inst_107154)){
var statearr_107191_107601 = state_107186__$1;
(statearr_107191_107601[(1)] = (5));

} else {
var statearr_107192_107602 = state_107186__$1;
(statearr_107192_107602[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_107187 === (13))){
var state_107186__$1 = state_107186;
var statearr_107193_107603 = state_107186__$1;
(statearr_107193_107603[(2)] = null);

(statearr_107193_107603[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_107187 === (6))){
var state_107186__$1 = state_107186;
var statearr_107194_107604 = state_107186__$1;
(statearr_107194_107604[(2)] = null);

(statearr_107194_107604[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_107187 === (3))){
var inst_107151 = frontend.handler.user.parse_jwt(id_token);
var inst_107152 = frontend.handler.user.almost_expired_or_expired_QMARK_(inst_107151);
var state_107186__$1 = state_107186;
var statearr_107195_107605 = state_107186__$1;
(statearr_107195_107605[(2)] = inst_107152);

(statearr_107195_107605[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_107187 === (12))){
var inst_107175 = [new cljs.core.Keyword(null,"anom","anom",230108965)];
var inst_107176 = [new cljs.core.Keyword(null,"expired-token","expired-token",-311690611)];
var inst_107177 = cljs.core.PersistentHashMap.fromArrays(inst_107175,inst_107176);
var inst_107178 = cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("empty or expired token and refresh failed",inst_107177);
var state_107186__$1 = state_107186;
var statearr_107196_107606 = state_107186__$1;
(statearr_107196_107606[(2)] = inst_107178);

(statearr_107196_107606[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_107187 === (2))){
var inst_107148 = (state_107186[(7)]);
var state_107186__$1 = state_107186;
var statearr_107197_107607 = state_107186__$1;
(statearr_107197_107607[(2)] = inst_107148);

(statearr_107197_107607[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_107187 === (11))){
var inst_107172 = (state_107186[(2)]);
var state_107186__$1 = state_107186;
if(cljs.core.truth_(inst_107172)){
var statearr_107198_107608 = state_107186__$1;
(statearr_107198_107608[(1)] = (12));

} else {
var statearr_107199_107609 = state_107186__$1;
(statearr_107199_107609[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_107187 === (9))){
var inst_107164 = (state_107186[(8)]);
var state_107186__$1 = state_107186;
var statearr_107200_107610 = state_107186__$1;
(statearr_107200_107610[(2)] = inst_107164);

(statearr_107200_107610[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_107187 === (5))){
var inst_107156 = cljs_time.core.now();
var inst_107157 = cljs_time.coerce.to_string(inst_107156);
var inst_107158 = ["refresh tokens... ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(inst_107157)].join('');
var inst_107159 = frontend.debug.pprint.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inst_107158], 0));
var inst_107160 = frontend.handler.user._LT_refresh_id_token_AMPERSAND_access_token();
var state_107186__$1 = (function (){var statearr_107202 = state_107186;
(statearr_107202[(9)] = inst_107159);

return statearr_107202;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_107186__$1,(8),inst_107160);
} else {
if((state_val_107187 === (14))){
var inst_107181 = (state_107186[(2)]);
var state_107186__$1 = state_107186;
var statearr_107203_107613 = state_107186__$1;
(statearr_107203_107613[(2)] = inst_107181);

(statearr_107203_107613[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_107187 === (10))){
var inst_107167 = frontend.state.get_auth_id_token();
var inst_107168 = frontend.handler.user.parse_jwt(inst_107167);
var inst_107170 = frontend.handler.user.expired_QMARK_(inst_107168);
var state_107186__$1 = state_107186;
var statearr_107206_107614 = state_107186__$1;
(statearr_107206_107614[(2)] = inst_107170);

(statearr_107206_107614[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_107187 === (8))){
var inst_107164 = (state_107186[(8)]);
var inst_107162 = (state_107186[(2)]);
var inst_107163 = frontend.state.get_auth_id_token();
var inst_107164__$1 = (inst_107163 == null);
var state_107186__$1 = (function (){var statearr_107207 = state_107186;
(statearr_107207[(10)] = inst_107162);

(statearr_107207[(8)] = inst_107164__$1);

return statearr_107207;
})();
if(cljs.core.truth_(inst_107164__$1)){
var statearr_107208_107615 = state_107186__$1;
(statearr_107208_107615[(1)] = (9));

} else {
var statearr_107209_107616 = state_107186__$1;
(statearr_107209_107616[(1)] = (10));

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
});
return (function() {
var frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32004__auto__ = null;
var frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32004__auto____0 = (function (){
var statearr_107210 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_107210[(0)] = frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32004__auto__);

(statearr_107210[(1)] = (1));

return statearr_107210;
});
var frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32004__auto____1 = (function (state_107186){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_107186);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e107211){var ex__32007__auto__ = e107211;
var statearr_107212_107617 = state_107186;
(statearr_107212_107617[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_107186[(4)]))){
var statearr_107213_107618 = state_107186;
(statearr_107213_107618[(1)] = cljs.core.first((state_107186[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__107619 = state_107186;
state_107186 = G__107619;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32004__auto__ = function(state_107186){
switch(arguments.length){
case 0:
return frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32004__auto____1.call(this,state_107186);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32004__auto____0;
frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32004__auto____1;
return frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_107214 = f__32196__auto__();
(statearr_107214[(6)] = c__32195__auto__);

return statearr_107214;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
frontend.handler.user.task__ensure_id_AMPERSAND_access_token = cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr107215_block_10 = (function frontend$handler$user$cr107215_block_10(cr107215_state){
try{var cr107215_place_42 = null;
(cr107215_state[(0)] = cr107215_block_12);

(cr107215_state[(2)] = cr107215_place_42);

return cr107215_state;
}catch (e107253){var cr107215_exception = e107253;
(cr107215_state[(0)] = null);

(cr107215_state[(1)] = null);

(cr107215_state[(2)] = null);

throw cr107215_exception;
}});
var cr107215_block_3 = (function frontend$handler$user$cr107215_block_3(cr107215_state){
try{var cr107215_place_6 = (cr107215_state[(2)]);
var cr107215_place_13 = null;
if(cljs.core.truth_(cr107215_place_6)){
(cr107215_state[(0)] = cr107215_block_5);

(cr107215_state[(2)] = null);

(cr107215_state[(1)] = cr107215_place_13);

return cr107215_state;
} else {
(cr107215_state[(0)] = cr107215_block_4);

(cr107215_state[(2)] = null);

(cr107215_state[(1)] = cr107215_place_13);

return cr107215_state;
}
}catch (e107254){var cr107215_exception = e107254;
(cr107215_state[(0)] = null);

(cr107215_state[(2)] = null);

throw cr107215_exception;
}});
var cr107215_block_6 = (function frontend$handler$user$cr107215_block_6(cr107215_state){
try{var cr107215_place_27 = missionary.core.unpark();
var cr107215_place_28 = frontend.state.get_auth_id_token;
var cr107215_place_29 = (function (){var fexpr__107256 = cr107215_place_28;
return (fexpr__107256.cljs$core$IFn$_invoke$arity$0 ? fexpr__107256.cljs$core$IFn$_invoke$arity$0() : fexpr__107256.call(null));
})();
var cr107215_place_30 = null;
var cr107215_place_31 = (cr107215_place_29 == cr107215_place_30);
var cr107215_place_32 = cr107215_place_31;
var cr107215_place_33 = null;
if(cr107215_place_32){
(cr107215_state[(0)] = cr107215_block_8);

(cr107215_state[(3)] = cr107215_place_31);

(cr107215_state[(2)] = cr107215_place_33);

return cr107215_state;
} else {
(cr107215_state[(0)] = cr107215_block_7);

(cr107215_state[(2)] = cr107215_place_33);

return cr107215_state;
}
}catch (e107255){var cr107215_exception = e107255;
(cr107215_state[(0)] = null);

(cr107215_state[(1)] = null);

throw cr107215_exception;
}});
var cr107215_block_12 = (function frontend$handler$user$cr107215_block_12(cr107215_state){
try{var cr107215_place_41 = (cr107215_state[(2)]);
(cr107215_state[(0)] = cr107215_block_13);

(cr107215_state[(2)] = null);

(cr107215_state[(1)] = cr107215_place_41);

return cr107215_state;
}catch (e107257){var cr107215_exception = e107257;
(cr107215_state[(0)] = null);

(cr107215_state[(1)] = null);

(cr107215_state[(2)] = null);

throw cr107215_exception;
}});
var cr107215_block_4 = (function frontend$handler$user$cr107215_block_4(cr107215_state){
try{var cr107215_place_14 = null;
(cr107215_state[(0)] = cr107215_block_13);

(cr107215_state[(1)] = cr107215_place_14);

return cr107215_state;
}catch (e107258){var cr107215_exception = e107258;
(cr107215_state[(0)] = null);

(cr107215_state[(1)] = null);

throw cr107215_exception;
}});
var cr107215_block_5 = (function frontend$handler$user$cr107215_block_5(cr107215_state){
try{var cr107215_place_15 = cljs.core.prn;
var cr107215_place_16 = "refresh tokens... ";
var cr107215_place_17 = cljs_time.coerce.to_string;
var cr107215_place_18 = cljs_time.core.now;
var cr107215_place_19 = (function (){var fexpr__107263 = cr107215_place_18;
return (fexpr__107263.cljs$core$IFn$_invoke$arity$0 ? fexpr__107263.cljs$core$IFn$_invoke$arity$0() : fexpr__107263.call(null));
})();
var cr107215_place_20 = (function (){var G__107265 = cr107215_place_19;
var fexpr__107264 = cr107215_place_17;
return (fexpr__107264.cljs$core$IFn$_invoke$arity$1 ? fexpr__107264.cljs$core$IFn$_invoke$arity$1(G__107265) : fexpr__107264.call(null,G__107265));
})();
var cr107215_place_21 = [cr107215_place_16,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr107215_place_20)].join('');
var cr107215_place_22 = (function (){var G__107267 = cr107215_place_21;
var fexpr__107266 = cr107215_place_15;
return (fexpr__107266.cljs$core$IFn$_invoke$arity$1 ? fexpr__107266.cljs$core$IFn$_invoke$arity$1(G__107267) : fexpr__107266.call(null,G__107267));
})();
var cr107215_place_23 = frontend.common.missionary._LT__BANG_;
var cr107215_place_24 = frontend.handler.user._LT_refresh_id_token_AMPERSAND_access_token;
var cr107215_place_25 = (function (){var fexpr__107268 = cr107215_place_24;
return (fexpr__107268.cljs$core$IFn$_invoke$arity$0 ? fexpr__107268.cljs$core$IFn$_invoke$arity$0() : fexpr__107268.call(null));
})();
var cr107215_place_26 = (function (){var G__107270 = cr107215_place_25;
var fexpr__107269 = cr107215_place_23;
return (fexpr__107269.cljs$core$IFn$_invoke$arity$1 ? fexpr__107269.cljs$core$IFn$_invoke$arity$1(G__107270) : fexpr__107269.call(null,G__107270));
})();
(cr107215_state[(0)] = cr107215_block_6);

return missionary.core.park(cr107215_place_26);
}catch (e107262){var cr107215_exception = e107262;
(cr107215_state[(0)] = null);

(cr107215_state[(1)] = null);

throw cr107215_exception;
}});
var cr107215_block_2 = (function frontend$handler$user$cr107215_block_2(cr107215_state){
try{var cr107215_place_4 = (cr107215_state[(1)]);
var cr107215_place_12 = cr107215_place_4;
(cr107215_state[(0)] = cr107215_block_3);

(cr107215_state[(1)] = null);

(cr107215_state[(2)] = cr107215_place_12);

return cr107215_state;
}catch (e107271){var cr107215_exception = e107271;
(cr107215_state[(0)] = null);

(cr107215_state[(1)] = null);

(cr107215_state[(2)] = null);

throw cr107215_exception;
}});
var cr107215_block_1 = (function frontend$handler$user$cr107215_block_1(cr107215_state){
try{var cr107215_place_1 = (cr107215_state[(1)]);
var cr107215_place_7 = frontend.handler.user.almost_expired_or_expired_QMARK_;
var cr107215_place_8 = frontend.handler.user.parse_jwt;
var cr107215_place_9 = cr107215_place_1;
var cr107215_place_10 = (function (){var G__107274 = cr107215_place_9;
var fexpr__107273 = cr107215_place_8;
return (fexpr__107273.cljs$core$IFn$_invoke$arity$1 ? fexpr__107273.cljs$core$IFn$_invoke$arity$1(G__107274) : fexpr__107273.call(null,G__107274));
})();
var cr107215_place_11 = (function (){var G__107276 = cr107215_place_10;
var fexpr__107275 = cr107215_place_7;
return (fexpr__107275.cljs$core$IFn$_invoke$arity$1 ? fexpr__107275.cljs$core$IFn$_invoke$arity$1(G__107276) : fexpr__107275.call(null,G__107276));
})();
(cr107215_state[(0)] = cr107215_block_3);

(cr107215_state[(1)] = null);

(cr107215_state[(2)] = cr107215_place_11);

return cr107215_state;
}catch (e107272){var cr107215_exception = e107272;
(cr107215_state[(0)] = null);

(cr107215_state[(1)] = null);

(cr107215_state[(2)] = null);

throw cr107215_exception;
}});
var cr107215_block_13 = (function frontend$handler$user$cr107215_block_13(cr107215_state){
try{var cr107215_place_13 = (cr107215_state[(1)]);
(cr107215_state[(0)] = null);

(cr107215_state[(1)] = null);

return cr107215_place_13;
}catch (e107277){var cr107215_exception = e107277;
(cr107215_state[(0)] = null);

(cr107215_state[(1)] = null);

throw cr107215_exception;
}});
var cr107215_block_7 = (function frontend$handler$user$cr107215_block_7(cr107215_state){
try{var cr107215_place_34 = frontend.handler.user.expired_QMARK_;
var cr107215_place_35 = frontend.handler.user.parse_jwt;
var cr107215_place_36 = frontend.state.get_auth_id_token;
var cr107215_place_37 = (function (){var fexpr__107279 = cr107215_place_36;
return (fexpr__107279.cljs$core$IFn$_invoke$arity$0 ? fexpr__107279.cljs$core$IFn$_invoke$arity$0() : fexpr__107279.call(null));
})();
var cr107215_place_38 = (function (){var G__107281 = cr107215_place_37;
var fexpr__107280 = cr107215_place_35;
return (fexpr__107280.cljs$core$IFn$_invoke$arity$1 ? fexpr__107280.cljs$core$IFn$_invoke$arity$1(G__107281) : fexpr__107280.call(null,G__107281));
})();
var cr107215_place_39 = (function (){var G__107283 = cr107215_place_38;
var fexpr__107282 = cr107215_place_34;
return (fexpr__107282.cljs$core$IFn$_invoke$arity$1 ? fexpr__107282.cljs$core$IFn$_invoke$arity$1(G__107283) : fexpr__107282.call(null,G__107283));
})();
(cr107215_state[(0)] = cr107215_block_9);

(cr107215_state[(2)] = cr107215_place_39);

return cr107215_state;
}catch (e107278){var cr107215_exception = e107278;
(cr107215_state[(0)] = null);

(cr107215_state[(1)] = null);

(cr107215_state[(2)] = null);

throw cr107215_exception;
}});
var cr107215_block_11 = (function frontend$handler$user$cr107215_block_11(cr107215_state){
try{var cr107215_place_43 = cljs.core.ex_info;
var cr107215_place_44 = "empty or expired token and refresh failed";
var cr107215_place_45 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr107215_place_46 = new cljs.core.Keyword(null,"expired-token","expired-token",-311690611);
var cr107215_place_47 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr107215_place_45,cr107215_place_46]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr107215_place_48 = (function (){var G__107286 = cr107215_place_44;
var G__107287 = cr107215_place_47;
var fexpr__107285 = cr107215_place_43;
return (fexpr__107285.cljs$core$IFn$_invoke$arity$2 ? fexpr__107285.cljs$core$IFn$_invoke$arity$2(G__107286,G__107287) : fexpr__107285.call(null,G__107286,G__107287));
})();
var cr107215_place_49 = (function(){throw cr107215_place_48})();
(cr107215_state[(0)] = null);

return null;
}catch (e107284){var cr107215_exception = e107284;
(cr107215_state[(0)] = null);

throw cr107215_exception;
}});
var cr107215_block_8 = (function frontend$handler$user$cr107215_block_8(cr107215_state){
try{var cr107215_place_31 = (cr107215_state[(3)]);
var cr107215_place_40 = cr107215_place_31;
(cr107215_state[(0)] = cr107215_block_9);

(cr107215_state[(3)] = null);

(cr107215_state[(2)] = cr107215_place_40);

return cr107215_state;
}catch (e107288){var cr107215_exception = e107288;
(cr107215_state[(0)] = null);

(cr107215_state[(1)] = null);

(cr107215_state[(3)] = null);

(cr107215_state[(2)] = null);

throw cr107215_exception;
}});
var cr107215_block_9 = (function frontend$handler$user$cr107215_block_9(cr107215_state){
try{var cr107215_place_33 = (cr107215_state[(2)]);
var cr107215_place_41 = null;
if(cljs.core.truth_(cr107215_place_33)){
(cr107215_state[(0)] = cr107215_block_11);

(cr107215_state[(1)] = null);

(cr107215_state[(2)] = null);

return cr107215_state;
} else {
(cr107215_state[(0)] = cr107215_block_10);

(cr107215_state[(2)] = null);

(cr107215_state[(2)] = cr107215_place_41);

return cr107215_state;
}
}catch (e107289){var cr107215_exception = e107289;
(cr107215_state[(0)] = null);

(cr107215_state[(1)] = null);

(cr107215_state[(2)] = null);

throw cr107215_exception;
}});
var cr107215_block_0 = (function frontend$handler$user$cr107215_block_0(cr107215_state){
try{var cr107215_place_0 = frontend.state.get_auth_id_token;
var cr107215_place_1 = (function (){var fexpr__107291 = cr107215_place_0;
return (fexpr__107291.cljs$core$IFn$_invoke$arity$0 ? fexpr__107291.cljs$core$IFn$_invoke$arity$0() : fexpr__107291.call(null));
})();
var cr107215_place_2 = cr107215_place_1;
var cr107215_place_3 = null;
var cr107215_place_4 = (cr107215_place_2 == cr107215_place_3);
var cr107215_place_5 = cr107215_place_4;
var cr107215_place_6 = null;
if(cr107215_place_5){
(cr107215_state[(0)] = cr107215_block_2);

(cr107215_state[(1)] = cr107215_place_4);

(cr107215_state[(2)] = cr107215_place_6);

return cr107215_state;
} else {
(cr107215_state[(0)] = cr107215_block_1);

(cr107215_state[(1)] = cr107215_place_1);

(cr107215_state[(2)] = cr107215_place_6);

return cr107215_state;
}
}catch (e107290){var cr107215_exception = e107290;
(cr107215_state[(0)] = null);

throw cr107215_exception;
}});
return cloroutine.impl.coroutine((function (){var G__107292 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__107292[(0)] = cr107215_block_0);

return G__107292;
})());
})(),missionary.core.sp_run);
frontend.handler.user._LT_user_uuid = (function frontend$handler$user$_LT_user_uuid(){
var c__32195__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32196__auto__ = (function (){var switch__32003__auto__ = (function (state_107303){
var state_val_107304 = (state_107303[(1)]);
if((state_val_107304 === (1))){
var inst_107293 = frontend.handler.user._LT_ensure_id_AMPERSAND_access_token();
var state_107303__$1 = state_107303;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_107303__$1,(2),inst_107293);
} else {
if((state_val_107304 === (2))){
var inst_107295 = (state_107303[(7)]);
var inst_107295__$1 = (state_107303[(2)]);
var inst_107296 = (inst_107295__$1 == null);
var state_107303__$1 = (function (){var statearr_107306 = state_107303;
(statearr_107306[(7)] = inst_107295__$1);

return statearr_107306;
})();
if(cljs.core.truth_(inst_107296)){
var statearr_107307_107620 = state_107303__$1;
(statearr_107307_107620[(1)] = (3));

} else {
var statearr_107308_107627 = state_107303__$1;
(statearr_107308_107627[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_107304 === (3))){
var inst_107298 = frontend.handler.user.user_uuid();
var state_107303__$1 = state_107303;
var statearr_107309_107628 = state_107303__$1;
(statearr_107309_107628[(2)] = inst_107298);

(statearr_107309_107628[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_107304 === (4))){
var inst_107295 = (state_107303[(7)]);
var state_107303__$1 = state_107303;
var statearr_107310_107629 = state_107303__$1;
(statearr_107310_107629[(2)] = inst_107295);

(statearr_107310_107629[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_107304 === (5))){
var inst_107301 = (state_107303[(2)]);
var state_107303__$1 = state_107303;
return cljs.core.async.impl.ioc_helpers.return_chan(state_107303__$1,inst_107301);
} else {
return null;
}
}
}
}
}
});
return (function() {
var frontend$handler$user$_LT_user_uuid_$_state_machine__32004__auto__ = null;
var frontend$handler$user$_LT_user_uuid_$_state_machine__32004__auto____0 = (function (){
var statearr_107311 = [null,null,null,null,null,null,null,null];
(statearr_107311[(0)] = frontend$handler$user$_LT_user_uuid_$_state_machine__32004__auto__);

(statearr_107311[(1)] = (1));

return statearr_107311;
});
var frontend$handler$user$_LT_user_uuid_$_state_machine__32004__auto____1 = (function (state_107303){
while(true){
var ret_value__32005__auto__ = (function (){try{while(true){
var result__32006__auto__ = switch__32003__auto__(state_107303);
if(cljs.core.keyword_identical_QMARK_(result__32006__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32006__auto__;
}
break;
}
}catch (e107312){var ex__32007__auto__ = e107312;
var statearr_107313_107630 = state_107303;
(statearr_107313_107630[(2)] = ex__32007__auto__);


if(cljs.core.seq((state_107303[(4)]))){
var statearr_107314_107631 = state_107303;
(statearr_107314_107631[(1)] = cljs.core.first((state_107303[(4)])));

} else {
throw ex__32007__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32005__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__107632 = state_107303;
state_107303 = G__107632;
continue;
} else {
return ret_value__32005__auto__;
}
break;
}
});
frontend$handler$user$_LT_user_uuid_$_state_machine__32004__auto__ = function(state_107303){
switch(arguments.length){
case 0:
return frontend$handler$user$_LT_user_uuid_$_state_machine__32004__auto____0.call(this);
case 1:
return frontend$handler$user$_LT_user_uuid_$_state_machine__32004__auto____1.call(this,state_107303);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$user$_LT_user_uuid_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$user$_LT_user_uuid_$_state_machine__32004__auto____0;
frontend$handler$user$_LT_user_uuid_$_state_machine__32004__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$user$_LT_user_uuid_$_state_machine__32004__auto____1;
return frontend$handler$user$_LT_user_uuid_$_state_machine__32004__auto__;
})()
})();
var state__32197__auto__ = (function (){var statearr_107315 = f__32196__auto__();
(statearr_107315[(6)] = c__32195__auto__);

return statearr_107315;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32197__auto__);
}));

return c__32195__auto__;
});
frontend.handler.user.team_member_QMARK_ = (function frontend$handler$user$team_member_QMARK_(){
return cljs.core.contains_QMARK_(frontend.state.user_groups(),"team");
});
frontend.handler.user.alpha_user_QMARK_ = (function frontend$handler$user$alpha_user_QMARK_(){
var or__5002__auto__ = frontend.config.dev_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.contains_QMARK_(frontend.state.user_groups(),"alpha-tester");
}
});
frontend.handler.user.beta_user_QMARK_ = (function frontend$handler$user$beta_user_QMARK_(){
var or__5002__auto__ = frontend.config.dev_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.contains_QMARK_(frontend.state.user_groups(),"beta-tester");
}
});
frontend.handler.user.alpha_or_beta_user_QMARK_ = (function frontend$handler$user$alpha_or_beta_user_QMARK_(){
var or__5002__auto__ = frontend.handler.user.alpha_user_QMARK_();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return frontend.handler.user.beta_user_QMARK_();
}
});
frontend.handler.user.get_user_type = (function frontend$handler$user$get_user_type(repo){
return new cljs.core.Keyword(null,"graph<->user-user-type","graph<->user-user-type",1524958981).cljs$core$IFn$_invoke$arity$1(cljs.core.some((function (p1__107364_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(repo,new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(p1__107364_SHARP_))){
return p1__107364_SHARP_;
} else {
return null;
}
}),new cljs.core.Keyword("rtc","graphs","rtc/graphs",-1584628267).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))));
});
frontend.handler.user.manager_QMARK_ = (function frontend$handler$user$manager_QMARK_(repo){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.handler.user.get_user_type(repo),"manager");
});
frontend.handler.user.new_task__upload_user_avatar = (function frontend$handler$user$new_task__upload_user_avatar(avatar_str){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr107368_block_0 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr107368_block_0(cr107368_state){
try{var cr107368_place_0 = frontend.state.get_auth_id_token;
var cr107368_place_1 = (function (){var fexpr__107442 = cr107368_place_0;
return (fexpr__107442.cljs$core$IFn$_invoke$arity$0 ? fexpr__107442.cljs$core$IFn$_invoke$arity$0() : fexpr__107442.call(null));
})();
var cr107368_place_2 = cr107368_place_1;
var cr107368_place_3 = null;
if(cljs.core.truth_(cr107368_place_2)){
(cr107368_state[(0)] = cr107368_block_2);

(cr107368_state[(2)] = cr107368_place_1);

(cr107368_state[(1)] = cr107368_place_3);

return cr107368_state;
} else {
(cr107368_state[(0)] = cr107368_block_1);

(cr107368_state[(1)] = cr107368_place_3);

return cr107368_state;
}
}catch (e107441){var cr107368_exception = e107441;
(cr107368_state[(0)] = null);

throw cr107368_exception;
}});
var cr107368_block_4 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr107368_block_4(cr107368_state){
try{var cr107368_place_23 = (cr107368_state[(2)]);
var cr107368_place_36 = cljs.core.ex_info;
var cr107368_place_37 = "failed to get presigned url";
var cr107368_place_38 = new cljs.core.Keyword(null,"resp","resp",1418702376);
var cr107368_place_39 = cr107368_place_23;
var cr107368_place_40 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr107368_place_38,cr107368_place_39]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr107368_place_41 = (function (){var G__107445 = cr107368_place_37;
var G__107446 = cr107368_place_40;
var fexpr__107444 = cr107368_place_36;
return (fexpr__107444.cljs$core$IFn$_invoke$arity$2 ? fexpr__107444.cljs$core$IFn$_invoke$arity$2(G__107445,G__107446) : fexpr__107444.call(null,G__107445,G__107446));
})();
var cr107368_place_42 = (function(){throw cr107368_place_41})();
(cr107368_state[(0)] = null);

(cr107368_state[(2)] = null);

return null;
}catch (e107443){var cr107368_exception = e107443;
(cr107368_state[(0)] = null);

(cr107368_state[(2)] = null);

throw cr107368_exception;
}});
var cr107368_block_7 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr107368_block_7(cr107368_state){
try{var cr107368_place_57 = missionary.core.unpark();
var cr107368_place_58 = cljs.core.__destructure_map;
var cr107368_place_59 = cr107368_place_57;
var cr107368_place_60 = (function (){var G__107449 = cr107368_place_59;
var fexpr__107448 = cr107368_place_58;
return (fexpr__107448.cljs$core$IFn$_invoke$arity$1 ? fexpr__107448.cljs$core$IFn$_invoke$arity$1(G__107449) : fexpr__107448.call(null,G__107449));
})();
var cr107368_place_61 = cljs.core.get;
var cr107368_place_62 = cr107368_place_60;
var cr107368_place_63 = new cljs.core.Keyword(null,"status","status",-1997798413);
var cr107368_place_64 = (function (){var G__107451 = cr107368_place_62;
var G__107452 = cr107368_place_63;
var fexpr__107450 = cr107368_place_61;
return (fexpr__107450.cljs$core$IFn$_invoke$arity$2 ? fexpr__107450.cljs$core$IFn$_invoke$arity$2(G__107451,G__107452) : fexpr__107450.call(null,G__107451,G__107452));
})();
var cr107368_place_65 = cljs_http.client.unexceptional_status_QMARK_;
var cr107368_place_66 = cr107368_place_64;
var cr107368_place_67 = (function (){var G__107454 = cr107368_place_66;
var fexpr__107453 = cr107368_place_65;
return (fexpr__107453.cljs$core$IFn$_invoke$arity$1 ? fexpr__107453.cljs$core$IFn$_invoke$arity$1(G__107454) : fexpr__107453.call(null,G__107454));
})();
var cr107368_place_68 = null;
if(cljs.core.truth_(cr107368_place_67)){
(cr107368_state[(0)] = cr107368_block_9);

(cr107368_state[(2)] = null);

(cr107368_state[(2)] = cr107368_place_68);

return cr107368_state;
} else {
(cr107368_state[(0)] = cr107368_block_8);

(cr107368_state[(1)] = null);

return cr107368_state;
}
}catch (e107447){var cr107368_exception = e107447;
(cr107368_state[(0)] = null);

(cr107368_state[(2)] = null);

(cr107368_state[(1)] = null);

throw cr107368_exception;
}});
var cr107368_block_8 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr107368_block_8(cr107368_state){
try{var cr107368_place_23 = (cr107368_state[(2)]);
var cr107368_place_69 = cljs.core.ex_info;
var cr107368_place_70 = "failed to upload avatar";
var cr107368_place_71 = new cljs.core.Keyword(null,"resp","resp",1418702376);
var cr107368_place_72 = cr107368_place_23;
var cr107368_place_73 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr107368_place_71,cr107368_place_72]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr107368_place_74 = (function (){var G__107458 = cr107368_place_70;
var G__107459 = cr107368_place_73;
var fexpr__107457 = cr107368_place_69;
return (fexpr__107457.cljs$core$IFn$_invoke$arity$2 ? fexpr__107457.cljs$core$IFn$_invoke$arity$2(G__107458,G__107459) : fexpr__107457.call(null,G__107458,G__107459));
})();
var cr107368_place_75 = (function(){throw cr107368_place_74})();
(cr107368_state[(0)] = null);

(cr107368_state[(2)] = null);

return null;
}catch (e107456){var cr107368_exception = e107456;
(cr107368_state[(0)] = null);

(cr107368_state[(2)] = null);

throw cr107368_exception;
}});
var cr107368_block_2 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr107368_block_2(cr107368_state){
try{var cr107368_place_1 = (cr107368_state[(2)]);
var cr107368_place_5 = cr107368_place_1;
var cr107368_place_6 = frontend.common.missionary._LT__BANG_;
var cr107368_place_7 = cljs_http.client.post;
var cr107368_place_8 = "https://";
var cr107368_place_9 = frontend.config.API_DOMAIN;
var cr107368_place_10 = "/logseq/get_presigned_user_avatar_put_url";
var cr107368_place_11 = [cr107368_place_8,cr107368_place_9,cr107368_place_10].join('');
var cr107368_place_12 = new cljs.core.Keyword(null,"oauth-token","oauth-token",311415191);
var cr107368_place_13 = cr107368_place_5;
var cr107368_place_14 = new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222);
var cr107368_place_15 = false;
var cr107368_place_16 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr107368_place_12,cr107368_place_13,cr107368_place_14,cr107368_place_15]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr107368_place_17 = (function (){var G__107463 = cr107368_place_11;
var G__107464 = cr107368_place_16;
var fexpr__107462 = cr107368_place_7;
return (fexpr__107462.cljs$core$IFn$_invoke$arity$2 ? fexpr__107462.cljs$core$IFn$_invoke$arity$2(G__107463,G__107464) : fexpr__107462.call(null,G__107463,G__107464));
})();
var cr107368_place_18 = (function (){var G__107466 = cr107368_place_17;
var fexpr__107465 = cr107368_place_6;
return (fexpr__107465.cljs$core$IFn$_invoke$arity$1 ? fexpr__107465.cljs$core$IFn$_invoke$arity$1(G__107466) : fexpr__107465.call(null,G__107466));
})();
(cr107368_state[(0)] = cr107368_block_3);

(cr107368_state[(2)] = null);

return missionary.core.park(cr107368_place_18);
}catch (e107460){var cr107368_exception = e107460;
(cr107368_state[(0)] = null);

(cr107368_state[(1)] = null);

(cr107368_state[(2)] = null);

throw cr107368_exception;
}});
var cr107368_block_1 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr107368_block_1(cr107368_state){
try{var cr107368_place_4 = null;
(cr107368_state[(0)] = cr107368_block_11);

(cr107368_state[(1)] = cr107368_place_4);

return cr107368_state;
}catch (e107467){var cr107368_exception = e107467;
(cr107368_state[(0)] = null);

(cr107368_state[(1)] = null);

throw cr107368_exception;
}});
var cr107368_block_3 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr107368_block_3(cr107368_state){
try{var cr107368_place_19 = missionary.core.unpark();
var cr107368_place_20 = cljs.core.__destructure_map;
var cr107368_place_21 = cr107368_place_19;
var cr107368_place_22 = (function (){var G__107470 = cr107368_place_21;
var fexpr__107469 = cr107368_place_20;
return (fexpr__107469.cljs$core$IFn$_invoke$arity$1 ? fexpr__107469.cljs$core$IFn$_invoke$arity$1(G__107470) : fexpr__107469.call(null,G__107470));
})();
var cr107368_place_23 = cr107368_place_22;
var cr107368_place_24 = cljs.core.get;
var cr107368_place_25 = cr107368_place_22;
var cr107368_place_26 = new cljs.core.Keyword(null,"status","status",-1997798413);
var cr107368_place_27 = (function (){var G__107472 = cr107368_place_25;
var G__107473 = cr107368_place_26;
var fexpr__107471 = cr107368_place_24;
return (fexpr__107471.cljs$core$IFn$_invoke$arity$2 ? fexpr__107471.cljs$core$IFn$_invoke$arity$2(G__107472,G__107473) : fexpr__107471.call(null,G__107472,G__107473));
})();
var cr107368_place_28 = cljs.core.get;
var cr107368_place_29 = cr107368_place_22;
var cr107368_place_30 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr107368_place_31 = (function (){var G__107475 = cr107368_place_29;
var G__107476 = cr107368_place_30;
var fexpr__107474 = cr107368_place_28;
return (fexpr__107474.cljs$core$IFn$_invoke$arity$2 ? fexpr__107474.cljs$core$IFn$_invoke$arity$2(G__107475,G__107476) : fexpr__107474.call(null,G__107475,G__107476));
})();
var cr107368_place_32 = cljs_http.client.unexceptional_status_QMARK_;
var cr107368_place_33 = cr107368_place_27;
var cr107368_place_34 = (function (){var G__107479 = cr107368_place_33;
var fexpr__107478 = cr107368_place_32;
return (fexpr__107478.cljs$core$IFn$_invoke$arity$1 ? fexpr__107478.cljs$core$IFn$_invoke$arity$1(G__107479) : fexpr__107478.call(null,G__107479));
})();
var cr107368_place_35 = null;
if(cljs.core.truth_(cr107368_place_34)){
(cr107368_state[(0)] = cr107368_block_5);

(cr107368_state[(2)] = cr107368_place_23);

(cr107368_state[(3)] = cr107368_place_31);

(cr107368_state[(4)] = cr107368_place_35);

return cr107368_state;
} else {
(cr107368_state[(0)] = cr107368_block_4);

(cr107368_state[(1)] = null);

(cr107368_state[(2)] = cr107368_place_23);

return cr107368_state;
}
}catch (e107468){var cr107368_exception = e107468;
(cr107368_state[(0)] = null);

(cr107368_state[(1)] = null);

throw cr107368_exception;
}});
var cr107368_block_11 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr107368_block_11(cr107368_state){
try{var cr107368_place_3 = (cr107368_state[(1)]);
(cr107368_state[(0)] = null);

(cr107368_state[(1)] = null);

return cr107368_place_3;
}catch (e107480){var cr107368_exception = e107480;
(cr107368_state[(0)] = null);

(cr107368_state[(1)] = null);

throw cr107368_exception;
}});
var cr107368_block_5 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr107368_block_5(cr107368_state){
try{var cr107368_place_43 = null;
(cr107368_state[(0)] = cr107368_block_6);

(cr107368_state[(4)] = cr107368_place_43);

return cr107368_state;
}catch (e107481){var cr107368_exception = e107481;
(cr107368_state[(0)] = null);

(cr107368_state[(2)] = null);

(cr107368_state[(1)] = null);

(cr107368_state[(3)] = null);

(cr107368_state[(4)] = null);

throw cr107368_exception;
}});
var cr107368_block_6 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr107368_block_6(cr107368_state){
try{var cr107368_place_31 = (cr107368_state[(3)]);
var cr107368_place_35 = (cr107368_state[(4)]);
var cr107368_place_44 = new cljs.core.Keyword(null,"presigned-url","presigned-url",90607137);
var cr107368_place_45 = cr107368_place_31;
var cr107368_place_46 = cr107368_place_44.cljs$core$IFn$_invoke$arity$1(cr107368_place_45);
var cr107368_place_47 = frontend.common.missionary._LT__BANG_;
var cr107368_place_48 = cljs_http.client.put;
var cr107368_place_49 = cr107368_place_46;
var cr107368_place_50 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr107368_place_51 = avatar_str;
var cr107368_place_52 = new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222);
var cr107368_place_53 = false;
var cr107368_place_54 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr107368_place_52,cr107368_place_53,cr107368_place_50,cr107368_place_51]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr107368_place_55 = (function (){var G__107485 = cr107368_place_49;
var G__107486 = cr107368_place_54;
var fexpr__107484 = cr107368_place_48;
return (fexpr__107484.cljs$core$IFn$_invoke$arity$2 ? fexpr__107484.cljs$core$IFn$_invoke$arity$2(G__107485,G__107486) : fexpr__107484.call(null,G__107485,G__107486));
})();
var cr107368_place_56 = (function (){var G__107488 = cr107368_place_55;
var fexpr__107487 = cr107368_place_47;
return (fexpr__107487.cljs$core$IFn$_invoke$arity$1 ? fexpr__107487.cljs$core$IFn$_invoke$arity$1(G__107488) : fexpr__107487.call(null,G__107488));
})();
(cr107368_state[(0)] = cr107368_block_7);

(cr107368_state[(3)] = null);

(cr107368_state[(4)] = null);

return missionary.core.park(cr107368_place_56);
}catch (e107482){var cr107368_exception = e107482;
(cr107368_state[(0)] = null);

(cr107368_state[(2)] = null);

(cr107368_state[(1)] = null);

(cr107368_state[(3)] = null);

(cr107368_state[(4)] = null);

throw cr107368_exception;
}});
var cr107368_block_10 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr107368_block_10(cr107368_state){
try{var cr107368_place_68 = (cr107368_state[(2)]);
(cr107368_state[(0)] = cr107368_block_11);

(cr107368_state[(2)] = null);

(cr107368_state[(1)] = cr107368_place_68);

return cr107368_state;
}catch (e107489){var cr107368_exception = e107489;
(cr107368_state[(0)] = null);

(cr107368_state[(2)] = null);

(cr107368_state[(1)] = null);

throw cr107368_exception;
}});
var cr107368_block_9 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr107368_block_9(cr107368_state){
try{var cr107368_place_76 = null;
(cr107368_state[(0)] = cr107368_block_10);

(cr107368_state[(2)] = cr107368_place_76);

return cr107368_state;
}catch (e107490){var cr107368_exception = e107490;
(cr107368_state[(0)] = null);

(cr107368_state[(2)] = null);

(cr107368_state[(1)] = null);

throw cr107368_exception;
}});
return cloroutine.impl.coroutine((function (){var G__107491 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__107491[(0)] = cr107368_block_0);

return G__107491;
})());
})(),missionary.core.sp_run);
});

//# sourceMappingURL=frontend.handler.user.js.map
