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
var seq__68309_69082 = cljs.core.seq(cljs.core.range.cljs$core$IFn$_invoke$arity$1(cljs.core.count(username)));
var chunk__68310_69084 = null;
var count__68311_69085 = (0);
var i__68312_69086 = (0);
while(true){
if((i__68312_69086 < count__68311_69085)){
var i_69087 = chunk__68310_69084.cljs$core$IIndexed$_nth$arity$2(null,i__68312_69086);
(arr[i_69087] = username.charCodeAt(i_69087));


var G__69089 = seq__68309_69082;
var G__69090 = chunk__68310_69084;
var G__69091 = count__68311_69085;
var G__69092 = (i__68312_69086 + (1));
seq__68309_69082 = G__69089;
chunk__68310_69084 = G__69090;
count__68311_69085 = G__69091;
i__68312_69086 = G__69092;
continue;
} else {
var temp__5804__auto___69093 = cljs.core.seq(seq__68309_69082);
if(temp__5804__auto___69093){
var seq__68309_69095__$1 = temp__5804__auto___69093;
if(cljs.core.chunked_seq_QMARK_(seq__68309_69095__$1)){
var c__5525__auto___69096 = cljs.core.chunk_first(seq__68309_69095__$1);
var G__69097 = cljs.core.chunk_rest(seq__68309_69095__$1);
var G__69098 = c__5525__auto___69096;
var G__69099 = cljs.core.count(c__5525__auto___69096);
var G__69100 = (0);
seq__68309_69082 = G__69097;
chunk__68310_69084 = G__69098;
count__68311_69085 = G__69099;
i__68312_69086 = G__69100;
continue;
} else {
var i_69101 = cljs.core.first(seq__68309_69095__$1);
(arr[i_69101] = username.charCodeAt(i_69101));


var G__69102 = cljs.core.next(seq__68309_69095__$1);
var G__69103 = null;
var G__69104 = (0);
var G__69105 = (0);
seq__68309_69082 = G__69102;
chunk__68310_69084 = G__69103;
count__68311_69085 = G__69104;
i__68312_69086 = G__69105;
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
var G__68318 = jwt;
var G__68318__$1 = (((G__68318 == null))?null:clojure.string.split.cljs$core$IFn$_invoke$arity$2(G__68318,"."));
var G__68318__$2 = (((G__68318__$1 == null))?null:cljs.core.second(G__68318__$1));
var G__68318__$3 = (((G__68318__$2 == null))?null:(function (p1__68317_SHARP_){
return goog.crypt.base64.decodeString(p1__68317_SHARP_,true);
})(G__68318__$2));
var G__68318__$4 = (((G__68318__$3 == null))?null:JSON.parse(G__68318__$3));
var G__68318__$5 = (((G__68318__$4 == null))?null:cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(G__68318__$4,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0)));
if((G__68318__$5 == null)){
return null;
} else {
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(G__68318__$5,new cljs.core.Keyword(null,"cognito:username","cognito:username",-2023950904),frontend.handler.user.decode_username);
}
});
frontend.handler.user.expired_QMARK_ = (function frontend$handler$user$expired_QMARK_(parsed_jwt){
var G__68319 = ((1000) * new cljs.core.Keyword(null,"exp","exp",-261706262).cljs$core$IFn$_invoke$arity$1(parsed_jwt));
var G__68319__$1 = (((G__68319 == null))?null:cljs_time.coerce.from_long(G__68319));
if((G__68319__$1 == null)){
return null;
} else {
return cljs_time.core.before_QMARK_(G__68319__$1,cljs_time.core.now());
}
});
/**
 * return true when jwt will expire after 1h
 */
frontend.handler.user.almost_expired_QMARK_ = (function frontend$handler$user$almost_expired_QMARK_(parsed_jwt){
var G__68320 = ((1000) * new cljs.core.Keyword(null,"exp","exp",-261706262).cljs$core$IFn$_invoke$arity$1(parsed_jwt));
var G__68320__$1 = (((G__68320 == null))?null:cljs_time.coerce.from_long(G__68320));
if((G__68320__$1 == null)){
return null;
} else {
return cljs_time.core.before_QMARK_(G__68320__$1,cljs_time.core.from_now(cljs_time.core.hours.cljs$core$IFn$_invoke$arity$1((1))));
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
var G__68325 = frontend.state.get_auth_id_token();
var G__68325__$1 = (((G__68325 == null))?null:frontend.handler.user.parse_jwt(G__68325));
if((G__68325__$1 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"email","email",1415816706).cljs$core$IFn$_invoke$arity$1(G__68325__$1);
}
});
frontend.handler.user.username = (function frontend$handler$user$username(){
var G__68327 = frontend.state.get_auth_id_token();
var G__68327__$1 = (((G__68327 == null))?null:frontend.handler.user.parse_jwt(G__68327));
if((G__68327__$1 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"cognito:username","cognito:username",-2023950904).cljs$core$IFn$_invoke$arity$1(G__68327__$1);
}
});
frontend.handler.user.user_uuid = (function frontend$handler$user$user_uuid(){
var G__68330 = frontend.state.get_auth_id_token();
var G__68330__$1 = (((G__68330 == null))?null:frontend.handler.user.parse_jwt(G__68330));
if((G__68330__$1 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"sub","sub",-2093760025).cljs$core$IFn$_invoke$arity$1(G__68330__$1);
}
});
frontend.handler.user.logged_in_QMARK_ = (function frontend$handler$user$logged_in_QMARK_(){
return (!((frontend.state.get_auth_refresh_token() == null)));
});
frontend.handler.user.set_token_to_localstorage_BANG_ = (function frontend$handler$user$set_token_to_localstorage_BANG_(var_args){
var G__68333 = arguments.length;
switch (G__68333) {
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
var seq__68338 = cljs.core.seq(Object.keys(localStorage));
var chunk__68339 = null;
var count__68340 = (0);
var i__68341 = (0);
while(true){
if((i__68341 < count__68340)){
var key = chunk__68339.cljs$core$IIndexed$_nth$arity$2(null,i__68341);
if(clojure.string.starts_with_QMARK_(key,prefix)){
localStorage.removeItem(key);
} else {
}


var G__69110 = seq__68338;
var G__69111 = chunk__68339;
var G__69112 = count__68340;
var G__69113 = (i__68341 + (1));
seq__68338 = G__69110;
chunk__68339 = G__69111;
count__68340 = G__69112;
i__68341 = G__69113;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__68338);
if(temp__5804__auto__){
var seq__68338__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__68338__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__68338__$1);
var G__69114 = cljs.core.chunk_rest(seq__68338__$1);
var G__69115 = c__5525__auto__;
var G__69116 = cljs.core.count(c__5525__auto__);
var G__69117 = (0);
seq__68338 = G__69114;
chunk__68339 = G__69115;
count__68340 = G__69116;
i__68341 = G__69117;
continue;
} else {
var key = cljs.core.first(seq__68338__$1);
if(clojure.string.starts_with_QMARK_(key,prefix)){
localStorage.removeItem(key);
} else {
}


var G__69118 = cljs.core.next(seq__68338__$1);
var G__69119 = null;
var G__69120 = (0);
var G__69121 = (0);
seq__68338 = G__69118;
chunk__68339 = G__69119;
count__68340 = G__69120;
i__68341 = G__69121;
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
var G__68349 = arguments.length;
switch (G__68349) {
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
var G__68352 = arguments.length;
switch (G__68352) {
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

var G__68354 = frontend.handler.user.parse_jwt(frontend.state.get_auth_id_token());
if((G__68354 == null)){
return null;
} else {
return cljs.core.reset_BANG_(frontend.flows._STAR_current_login_user,G__68354);
}
}));

(frontend.handler.user.set_tokens_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (id_token,access_token,refresh_token){
frontend.state.set_auth_id_token(id_token);

frontend.state.set_auth_access_token(access_token);

frontend.state.set_auth_refresh_token(refresh_token);

frontend.handler.user.set_token_to_localstorage_BANG_.cljs$core$IFn$_invoke$arity$3(id_token,access_token,refresh_token);

var G__68356 = frontend.handler.user.parse_jwt(frontend.state.get_auth_id_token());
if((G__68356 == null)){
return null;
} else {
return cljs.core.reset_BANG_(frontend.flows._STAR_current_login_user,G__68356);
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
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_68453){
var state_val_68454 = (state_68453[(1)]);
if((state_val_68454 === (7))){
var inst_68368 = (state_68453[(7)]);
var state_68453__$1 = state_68453;
var statearr_68457_69124 = state_68453__$1;
(statearr_68457_69124[(2)] = inst_68368);

(statearr_68457_69124[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (20))){
var inst_68406 = (state_68453[(2)]);
var state_68453__$1 = state_68453;
if(cljs.core.truth_(inst_68406)){
var statearr_68458_69125 = state_68453__$1;
(statearr_68458_69125[(1)] = (21));

} else {
var statearr_68461_69126 = state_68453__$1;
(statearr_68461_69126[(1)] = (22));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (27))){
var inst_68366 = (state_68453[(8)]);
var inst_68423 = (state_68453[(9)]);
var inst_68422 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(inst_68366);
var inst_68423__$1 = new cljs.core.Keyword(null,"id_token","id_token",148712273).cljs$core$IFn$_invoke$arity$1(inst_68422);
var state_68453__$1 = (function (){var statearr_68462 = state_68453;
(statearr_68462[(9)] = inst_68423__$1);

return statearr_68462;
})();
if(cljs.core.truth_(inst_68423__$1)){
var statearr_68464_69127 = state_68453__$1;
(statearr_68464_69127[(1)] = (30));

} else {
var statearr_68465_69128 = state_68453__$1;
(statearr_68465_69128[(1)] = (31));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (1))){
var inst_68361 = (state_68453[(10)]);
var inst_68361__$1 = frontend.state.get_auth_refresh_token();
var state_68453__$1 = (function (){var statearr_68466 = state_68453;
(statearr_68466[(10)] = inst_68361__$1);

return statearr_68466;
})();
if(cljs.core.truth_(inst_68361__$1)){
var statearr_68467_69129 = state_68453__$1;
(statearr_68467_69129[(1)] = (2));

} else {
var statearr_68468_69130 = state_68453__$1;
(statearr_68468_69130[(1)] = (3));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (24))){
var inst_68418 = frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3("exceptional status when refresh-token",new cljs.core.Keyword(null,"warning","warning",-1685650671),true);
var state_68453__$1 = state_68453;
var statearr_68469_69131 = state_68453__$1;
(statearr_68469_69131[(2)] = inst_68418);

(statearr_68469_69131[(1)] = (26));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (4))){
var inst_68450 = (state_68453[(2)]);
var state_68453__$1 = state_68453;
return cljs.core.async.impl.ioc_helpers.return_chan(state_68453__$1,inst_68450);
} else {
if((state_val_68454 === (15))){
var inst_68389 = frontend.handler.user.clear_tokens.cljs$core$IFn$_invoke$arity$0();
var state_68453__$1 = state_68453;
var statearr_68471_69132 = state_68453__$1;
(statearr_68471_69132[(2)] = inst_68389);

(statearr_68471_69132[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (21))){
var inst_68366 = (state_68453[(8)]);
var inst_68408 = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(inst_68366);
var inst_68409 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(inst_68366);
var inst_68410 = new cljs.core.Keyword(null,"error-code","error-code",180497232).cljs$core$IFn$_invoke$arity$1(inst_68366);
var inst_68411 = new cljs.core.Keyword(null,"error-text","error-text",2021893718).cljs$core$IFn$_invoke$arity$1(inst_68366);
var inst_68412 = cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"refresh-token-failed","refresh-token-failed",-110191038),new cljs.core.Keyword(null,"status","status",-1997798413),inst_68408,new cljs.core.Keyword(null,"body","body",-2049205669),inst_68409,new cljs.core.Keyword(null,"error-code","error-code",180497232),inst_68410,new cljs.core.Keyword(null,"error-text","error-text",2021893718),inst_68411], 0));
var state_68453__$1 = (function (){var statearr_68472 = state_68453;
(statearr_68472[(11)] = inst_68412);

return statearr_68472;
})();
var statearr_68473_69133 = state_68453__$1;
(statearr_68473_69133[(2)] = null);

(statearr_68473_69133[(1)] = (23));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (31))){
var inst_68423 = (state_68453[(9)]);
var state_68453__$1 = state_68453;
var statearr_68475_69134 = state_68453__$1;
(statearr_68475_69134[(2)] = inst_68423);

(statearr_68475_69134[(1)] = (32));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (32))){
var inst_68429 = (state_68453[(2)]);
var state_68453__$1 = state_68453;
if(cljs.core.truth_(inst_68429)){
var statearr_68477_69135 = state_68453__$1;
(statearr_68477_69135[(1)] = (33));

} else {
var statearr_68478_69136 = state_68453__$1;
(statearr_68478_69136[(1)] = (34));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (33))){
var inst_68366 = (state_68453[(8)]);
var inst_68431 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(inst_68366);
var inst_68432 = new cljs.core.Keyword(null,"id_token","id_token",148712273).cljs$core$IFn$_invoke$arity$1(inst_68431);
var inst_68433 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(inst_68366);
var inst_68434 = new cljs.core.Keyword(null,"access_token","access_token",1591156073).cljs$core$IFn$_invoke$arity$1(inst_68433);
var inst_68435 = frontend.handler.user.set_tokens_BANG_.cljs$core$IFn$_invoke$arity$2(inst_68432,inst_68434);
var state_68453__$1 = state_68453;
var statearr_68481_69137 = state_68453__$1;
(statearr_68481_69137[(2)] = inst_68435);

(statearr_68481_69137[(1)] = (35));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (13))){
var inst_68377 = (state_68453[(12)]);
var state_68453__$1 = state_68453;
var statearr_68483_69138 = state_68453__$1;
(statearr_68483_69138[(2)] = inst_68377);

(statearr_68483_69138[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (22))){
var inst_68366 = (state_68453[(8)]);
var inst_68414 = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(inst_68366);
var inst_68415 = (cljs_http.client.unexceptional_status_QMARK_.cljs$core$IFn$_invoke$arity$1 ? cljs_http.client.unexceptional_status_QMARK_.cljs$core$IFn$_invoke$arity$1(inst_68414) : cljs_http.client.unexceptional_status_QMARK_.call(null,inst_68414));
var inst_68416 = cljs.core.not(inst_68415);
var state_68453__$1 = state_68453;
if(inst_68416){
var statearr_68485_69139 = state_68453__$1;
(statearr_68485_69139[(1)] = (24));

} else {
var statearr_68487_69140 = state_68453__$1;
(statearr_68487_69140[(1)] = (25));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (29))){
var inst_68441 = (state_68453[(2)]);
var state_68453__$1 = state_68453;
var statearr_68488_69141 = state_68453__$1;
(statearr_68488_69141[(2)] = inst_68441);

(statearr_68488_69141[(1)] = (26));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (6))){
var inst_68366 = (state_68453[(8)]);
var inst_68370 = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(inst_68366);
var inst_68371 = ((500) > inst_68370);
var state_68453__$1 = state_68453;
var statearr_68490_69142 = state_68453__$1;
(statearr_68490_69142[(2)] = inst_68371);

(statearr_68490_69142[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (28))){
var state_68453__$1 = state_68453;
var statearr_68492_69143 = state_68453__$1;
(statearr_68492_69143[(2)] = null);

(statearr_68492_69143[(1)] = (29));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (25))){
var state_68453__$1 = state_68453;
var statearr_68493_69144 = state_68453__$1;
(statearr_68493_69144[(1)] = (27));



return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (34))){
var state_68453__$1 = state_68453;
var statearr_68495_69145 = state_68453__$1;
(statearr_68495_69145[(2)] = null);

(statearr_68495_69145[(1)] = (35));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (17))){
var inst_68392 = (state_68453[(2)]);
var state_68453__$1 = state_68453;
var statearr_68496_69146 = state_68453__$1;
(statearr_68496_69146[(2)] = inst_68392);

(statearr_68496_69146[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (3))){
var state_68453__$1 = state_68453;
var statearr_68497_69147 = state_68453__$1;
(statearr_68497_69147[(2)] = null);

(statearr_68497_69147[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (12))){
var inst_68366 = (state_68453[(8)]);
var inst_68380 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(inst_68366);
var inst_68381 = new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(inst_68380);
var inst_68382 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_68381,"invalid_grant");
var state_68453__$1 = state_68453;
var statearr_68498_69148 = state_68453__$1;
(statearr_68498_69148[(2)] = inst_68382);

(statearr_68498_69148[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (2))){
var inst_68361 = (state_68453[(10)]);
var inst_68364 = frontend.handler.user._LT_refresh_tokens(inst_68361);
var state_68453__$1 = state_68453;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_68453__$1,(5),inst_68364);
} else {
if((state_val_68454 === (23))){
var inst_68445 = (state_68453[(2)]);
var state_68453__$1 = state_68453;
var statearr_68500_69149 = state_68453__$1;
(statearr_68500_69149[(2)] = inst_68445);

(statearr_68500_69149[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (35))){
var inst_68438 = (state_68453[(2)]);
var state_68453__$1 = state_68453;
var statearr_68501_69150 = state_68453__$1;
(statearr_68501_69150[(2)] = inst_68438);

(statearr_68501_69150[(1)] = (29));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (19))){
var inst_68398 = (state_68453[(13)]);
var state_68453__$1 = state_68453;
var statearr_68503_69151 = state_68453__$1;
(statearr_68503_69151[(2)] = inst_68398);

(statearr_68503_69151[(1)] = (20));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (11))){
var inst_68447 = (state_68453[(2)]);
var state_68453__$1 = state_68453;
var statearr_68504_69152 = state_68453__$1;
(statearr_68504_69152[(2)] = inst_68447);

(statearr_68504_69152[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (9))){
var inst_68366 = (state_68453[(8)]);
var inst_68377 = (state_68453[(12)]);
var inst_68376 = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(inst_68366);
var inst_68377__$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((400),inst_68376);
var state_68453__$1 = (function (){var statearr_68506 = state_68453;
(statearr_68506[(12)] = inst_68377__$1);

return statearr_68506;
})();
if(inst_68377__$1){
var statearr_68507_69153 = state_68453__$1;
(statearr_68507_69153[(1)] = (12));

} else {
var statearr_68510_69154 = state_68453__$1;
(statearr_68510_69154[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (5))){
var inst_68366 = (state_68453[(8)]);
var inst_68368 = (state_68453[(7)]);
var inst_68366__$1 = (state_68453[(2)]);
var inst_68367 = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(inst_68366__$1);
var inst_68368__$1 = ((400) <= inst_68367);
var state_68453__$1 = (function (){var statearr_68511 = state_68453;
(statearr_68511[(8)] = inst_68366__$1);

(statearr_68511[(7)] = inst_68368__$1);

return statearr_68511;
})();
if(cljs.core.truth_(inst_68368__$1)){
var statearr_68512_69155 = state_68453__$1;
(statearr_68512_69155[(1)] = (6));

} else {
var statearr_68513_69156 = state_68453__$1;
(statearr_68513_69156[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (14))){
var inst_68366 = (state_68453[(8)]);
var inst_68385 = (state_68453[(2)]);
var inst_68386 = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(inst_68366);
var inst_68387 = cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"debug","debug",-1608172596),new cljs.core.Keyword(null,"refresh-token-failed","refresh-token-failed",-110191038),new cljs.core.Keyword(null,"status","status",-1997798413),inst_68386], 0));
var state_68453__$1 = (function (){var statearr_68514 = state_68453;
(statearr_68514[(14)] = inst_68387);

return statearr_68514;
})();
if(cljs.core.truth_(inst_68385)){
var statearr_68516_69157 = state_68453__$1;
(statearr_68516_69157[(1)] = (15));

} else {
var statearr_68517_69158 = state_68453__$1;
(statearr_68517_69158[(1)] = (16));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (26))){
var inst_68443 = (state_68453[(2)]);
var state_68453__$1 = state_68453;
var statearr_68518_69159 = state_68453__$1;
(statearr_68518_69159[(2)] = inst_68443);

(statearr_68518_69159[(1)] = (23));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (16))){
var state_68453__$1 = state_68453;
var statearr_68519_69160 = state_68453__$1;
(statearr_68519_69160[(2)] = null);

(statearr_68519_69160[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (30))){
var inst_68366 = (state_68453[(8)]);
var inst_68425 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(inst_68366);
var inst_68426 = new cljs.core.Keyword(null,"access_token","access_token",1591156073).cljs$core$IFn$_invoke$arity$1(inst_68425);
var state_68453__$1 = state_68453;
var statearr_68520_69161 = state_68453__$1;
(statearr_68520_69161[(2)] = inst_68426);

(statearr_68520_69161[(1)] = (32));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (10))){
var inst_68366 = (state_68453[(8)]);
var inst_68398 = (state_68453[(13)]);
var inst_68396 = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(inst_68366);
var inst_68397 = (cljs_http.client.unexceptional_status_QMARK_.cljs$core$IFn$_invoke$arity$1 ? cljs_http.client.unexceptional_status_QMARK_.cljs$core$IFn$_invoke$arity$1(inst_68396) : cljs_http.client.unexceptional_status_QMARK_.call(null,inst_68396));
var inst_68398__$1 = cljs.core.not(inst_68397);
var state_68453__$1 = (function (){var statearr_68521 = state_68453;
(statearr_68521[(13)] = inst_68398__$1);

return statearr_68521;
})();
if(inst_68398__$1){
var statearr_68522_69162 = state_68453__$1;
(statearr_68522_69162[(1)] = (18));

} else {
var statearr_68524_69163 = state_68453__$1;
(statearr_68524_69163[(1)] = (19));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (18))){
var inst_68400 = frontend.state.get_auth_id_token();
var inst_68401 = frontend.handler.user.parse_jwt(inst_68400);
var inst_68402 = frontend.handler.user.expired_QMARK_(inst_68401);
var inst_68403 = cljs.core.not(inst_68402);
var state_68453__$1 = state_68453;
var statearr_68525_69164 = state_68453__$1;
(statearr_68525_69164[(2)] = inst_68403);

(statearr_68525_69164[(1)] = (20));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68454 === (8))){
var inst_68374 = (state_68453[(2)]);
var state_68453__$1 = state_68453;
if(cljs.core.truth_(inst_68374)){
var statearr_68530_69165 = state_68453__$1;
(statearr_68530_69165[(1)] = (9));

} else {
var statearr_68531_69166 = state_68453__$1;
(statearr_68531_69166[(1)] = (10));

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
var frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32051__auto__ = null;
var frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32051__auto____0 = (function (){
var statearr_68534 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_68534[(0)] = frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32051__auto__);

(statearr_68534[(1)] = (1));

return statearr_68534;
});
var frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32051__auto____1 = (function (state_68453){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_68453);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e68536){var ex__32054__auto__ = e68536;
var statearr_68537_69167 = state_68453;
(statearr_68537_69167[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_68453[(4)]))){
var statearr_68539_69168 = state_68453;
(statearr_68539_69168[(1)] = cljs.core.first((state_68453[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__69169 = state_68453;
state_68453 = G__69169;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32051__auto__ = function(state_68453){
switch(arguments.length){
case 0:
return frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32051__auto____1.call(this,state_68453);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32051__auto____0;
frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32051__auto____1;
return frontend$handler$user$_LT_refresh_id_token_AMPERSAND_access_token_$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_68545 = f__32125__auto__();
(statearr_68545[(6)] = c__32124__auto__);

return statearr_68545;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
});
/**
 * Refresh id-token&access-token, pull latest repos, returns nil when tokens are not available.
 */
frontend.handler.user.restore_tokens_from_localstorage = (function frontend$handler$user$restore_tokens_from_localstorage(){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["restore-tokens-from-localstorage"], 0));

var refresh_token = localStorage.getItem("refresh-token");
if(cljs.core.truth_(refresh_token)){
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_68566){
var state_val_68567 = (state_68566[(1)]);
if((state_val_68567 === (1))){
var inst_68553 = frontend.handler.user._LT_refresh_id_token_AMPERSAND_access_token();
var state_68566__$1 = state_68566;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_68566__$1,(2),inst_68553);
} else {
if((state_val_68567 === (2))){
var inst_68555 = (state_68566[(2)]);
var inst_68556 = frontend.handler.user.user_uuid();
var state_68566__$1 = (function (){var statearr_68571 = state_68566;
(statearr_68571[(7)] = inst_68555);

return statearr_68571;
})();
if(cljs.core.truth_(inst_68556)){
var statearr_68572_69170 = state_68566__$1;
(statearr_68572_69170[(1)] = (3));

} else {
var statearr_68573_69171 = state_68566__$1;
(statearr_68573_69171[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68567 === (3))){
var inst_68558 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_68559 = [new cljs.core.Keyword("user","fetch-info-and-graphs","user/fetch-info-and-graphs",-1029959720)];
var inst_68560 = (new cljs.core.PersistentVector(null,1,(5),inst_68558,inst_68559,null));
var inst_68561 = frontend.state.pub_event_BANG_(inst_68560);
var state_68566__$1 = state_68566;
var statearr_68574_69172 = state_68566__$1;
(statearr_68574_69172[(2)] = inst_68561);

(statearr_68574_69172[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68567 === (4))){
var state_68566__$1 = state_68566;
var statearr_68575_69173 = state_68566__$1;
(statearr_68575_69173[(2)] = null);

(statearr_68575_69173[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68567 === (5))){
var inst_68564 = (state_68566[(2)]);
var state_68566__$1 = state_68566;
return cljs.core.async.impl.ioc_helpers.return_chan(state_68566__$1,inst_68564);
} else {
return null;
}
}
}
}
}
});
return (function() {
var frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32051__auto__ = null;
var frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32051__auto____0 = (function (){
var statearr_68576 = [null,null,null,null,null,null,null,null];
(statearr_68576[(0)] = frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32051__auto__);

(statearr_68576[(1)] = (1));

return statearr_68576;
});
var frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32051__auto____1 = (function (state_68566){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_68566);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e68578){var ex__32054__auto__ = e68578;
var statearr_68580_69174 = state_68566;
(statearr_68580_69174[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_68566[(4)]))){
var statearr_68581_69175 = state_68566;
(statearr_68581_69175[(1)] = cljs.core.first((state_68566[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__69176 = state_68566;
state_68566 = G__69176;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32051__auto__ = function(state_68566){
switch(arguments.length){
case 0:
return frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32051__auto____1.call(this,state_68566);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32051__auto____0;
frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32051__auto____1;
return frontend$handler$user$restore_tokens_from_localstorage_$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_68585 = f__32125__auto__();
(statearr_68585[(6)] = c__32124__auto__);

return statearr_68585;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
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
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_68647){
var state_val_68648 = (state_68647[(1)]);
if((state_val_68648 === (1))){
var inst_68597 = [new cljs.core.Keyword(null,"headers","headers",-835030129),new cljs.core.Keyword(null,"body","body",-2049205669)];
var inst_68598 = cljs.core.clj__GT_js(payload);
var inst_68599 = JSON.stringify(inst_68598);
var inst_68600 = [headers,inst_68599];
var inst_68601 = cljs.core.PersistentHashMap.fromArrays(inst_68597,inst_68600);
var inst_68602 = cljs_http.client.post.cljs$core$IFn$_invoke$arity$variadic(frontend.config.COGNITO_IDP,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inst_68601], 0));
var state_68647__$1 = state_68647;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_68647__$1,(2),inst_68602);
} else {
if((state_val_68648 === (2))){
var inst_68604 = (state_68647[(7)]);
var inst_68604__$1 = (state_68647[(2)]);
var inst_68606 = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(inst_68604__$1);
var inst_68607 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((200),inst_68606);
var state_68647__$1 = (function (){var statearr_68651 = state_68647;
(statearr_68651[(7)] = inst_68604__$1);

return statearr_68651;
})();
if(inst_68607){
var statearr_68652_69177 = state_68647__$1;
(statearr_68652_69177[(1)] = (3));

} else {
var statearr_68653_69178 = state_68647__$1;
(statearr_68653_69178[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68648 === (3))){
var state_68647__$1 = state_68647;
var statearr_68655_69179 = state_68647__$1;
(statearr_68655_69179[(2)] = null);

(statearr_68655_69179[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68648 === (4))){
var inst_68610 = (new Error("Assert failed: (= 200 (:status resp))"));
var inst_68611 = (function(){throw inst_68610})();
var state_68647__$1 = state_68647;
var statearr_68656_69180 = state_68647__$1;
(statearr_68656_69180[(2)] = inst_68611);

(statearr_68656_69180[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68648 === (5))){
var inst_68604 = (state_68647[(7)]);
var inst_68613 = (state_68647[(2)]);
var inst_68614 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(inst_68604);
var inst_68615 = JSON.parse(inst_68614);
var inst_68616 = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$1(inst_68615);
var inst_68617 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_68618 = ["AuthenticationResult","AccessToken"];
var inst_68619 = (new cljs.core.PersistentVector(null,2,(5),inst_68617,inst_68618,null));
var inst_68620 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(inst_68616,inst_68619);
var inst_68621 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_68623 = ["AuthenticationResult","IdToken"];
var inst_68624 = (new cljs.core.PersistentVector(null,2,(5),inst_68621,inst_68623,null));
var inst_68625 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(inst_68616,inst_68624);
var inst_68626 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_68627 = ["AuthenticationResult","RefreshToken"];
var inst_68628 = (new cljs.core.PersistentVector(null,2,(5),inst_68626,inst_68627,null));
var inst_68629 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(inst_68616,inst_68628);
var inst_68630 = frontend.handler.user.set_tokens_BANG_.cljs$core$IFn$_invoke$arity$3(inst_68625,inst_68620,inst_68629);
var inst_68635 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_68636 = [new cljs.core.Keyword("user","fetch-info-and-graphs","user/fetch-info-and-graphs",-1029959720)];
var inst_68637 = (new cljs.core.PersistentVector(null,1,(5),inst_68635,inst_68636,null));
var inst_68638 = frontend.state.pub_event_BANG_(inst_68637);
var inst_68640 = [new cljs.core.Keyword(null,"id-token","id-token",-339268306),new cljs.core.Keyword(null,"access-token","access-token",-654201199),new cljs.core.Keyword(null,"refresh-token","refresh-token",-1032003584)];
var inst_68641 = [inst_68625,inst_68620,inst_68629];
var inst_68642 = cljs.core.PersistentHashMap.fromArrays(inst_68640,inst_68641);
var state_68647__$1 = (function (){var statearr_68659 = state_68647;
(statearr_68659[(8)] = inst_68613);

(statearr_68659[(9)] = inst_68630);

(statearr_68659[(10)] = inst_68638);

return statearr_68659;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_68647__$1,inst_68642);
} else {
return null;
}
}
}
}
}
});
return (function() {
var frontend$handler$user$login_with_username_password_e2e_$_state_machine__32051__auto__ = null;
var frontend$handler$user$login_with_username_password_e2e_$_state_machine__32051__auto____0 = (function (){
var statearr_68662 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_68662[(0)] = frontend$handler$user$login_with_username_password_e2e_$_state_machine__32051__auto__);

(statearr_68662[(1)] = (1));

return statearr_68662;
});
var frontend$handler$user$login_with_username_password_e2e_$_state_machine__32051__auto____1 = (function (state_68647){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_68647);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e68663){var ex__32054__auto__ = e68663;
var statearr_68664_69181 = state_68647;
(statearr_68664_69181[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_68647[(4)]))){
var statearr_68665_69182 = state_68647;
(statearr_68665_69182[(1)] = cljs.core.first((state_68647[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__69183 = state_68647;
state_68647 = G__69183;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$user$login_with_username_password_e2e_$_state_machine__32051__auto__ = function(state_68647){
switch(arguments.length){
case 0:
return frontend$handler$user$login_with_username_password_e2e_$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$user$login_with_username_password_e2e_$_state_machine__32051__auto____1.call(this,state_68647);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$user$login_with_username_password_e2e_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$user$login_with_username_password_e2e_$_state_machine__32051__auto____0;
frontend$handler$user$login_with_username_password_e2e_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$user$login_with_username_password_e2e_$_state_machine__32051__auto____1;
return frontend$handler$user$login_with_username_password_e2e_$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_68673 = f__32125__auto__();
(statearr_68673[(6)] = c__32124__auto__);

return statearr_68673;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
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
var url = (function (){var G__68683 = base_upgrade_url;
if(cljs.core.truth_(user_uuid_SINGLEQUOTE_)){
return [G__68683,"?checkout[custom][user_uuid]=",cljs.core.name(user_uuid_SINGLEQUOTE_)].join('');
} else {
return G__68683;
}
})();
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ~~~ LEMON: ",url," ~~~ "], 0));

return window.open(url);
});
frontend.handler.user._LT_ensure_id_AMPERSAND_access_token = (function frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token(){
var id_token = frontend.state.get_auth_id_token();
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_68730){
var state_val_68731 = (state_68730[(1)]);
if((state_val_68731 === (7))){
var inst_68726 = (state_68730[(2)]);
var state_68730__$1 = state_68730;
return cljs.core.async.impl.ioc_helpers.return_chan(state_68730__$1,inst_68726);
} else {
if((state_val_68731 === (1))){
var inst_68691 = (state_68730[(7)]);
var inst_68691__$1 = (id_token == null);
var state_68730__$1 = (function (){var statearr_68733 = state_68730;
(statearr_68733[(7)] = inst_68691__$1);

return statearr_68733;
})();
if(cljs.core.truth_(inst_68691__$1)){
var statearr_68735_69184 = state_68730__$1;
(statearr_68735_69184[(1)] = (2));

} else {
var statearr_68736_69185 = state_68730__$1;
(statearr_68736_69185[(1)] = (3));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68731 === (4))){
var inst_68698 = (state_68730[(2)]);
var state_68730__$1 = state_68730;
if(cljs.core.truth_(inst_68698)){
var statearr_68738_69186 = state_68730__$1;
(statearr_68738_69186[(1)] = (5));

} else {
var statearr_68739_69187 = state_68730__$1;
(statearr_68739_69187[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68731 === (13))){
var state_68730__$1 = state_68730;
var statearr_68740_69188 = state_68730__$1;
(statearr_68740_69188[(2)] = null);

(statearr_68740_69188[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68731 === (6))){
var state_68730__$1 = state_68730;
var statearr_68742_69189 = state_68730__$1;
(statearr_68742_69189[(2)] = null);

(statearr_68742_69189[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68731 === (3))){
var inst_68695 = frontend.handler.user.parse_jwt(id_token);
var inst_68696 = frontend.handler.user.almost_expired_or_expired_QMARK_(inst_68695);
var state_68730__$1 = state_68730;
var statearr_68743_69190 = state_68730__$1;
(statearr_68743_69190[(2)] = inst_68696);

(statearr_68743_69190[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68731 === (12))){
var inst_68717 = [new cljs.core.Keyword(null,"anom","anom",230108965)];
var inst_68718 = [new cljs.core.Keyword(null,"expired-token","expired-token",-311690611)];
var inst_68719 = cljs.core.PersistentHashMap.fromArrays(inst_68717,inst_68718);
var inst_68720 = cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("empty or expired token and refresh failed",inst_68719);
var state_68730__$1 = state_68730;
var statearr_68744_69191 = state_68730__$1;
(statearr_68744_69191[(2)] = inst_68720);

(statearr_68744_69191[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68731 === (2))){
var inst_68691 = (state_68730[(7)]);
var state_68730__$1 = state_68730;
var statearr_68745_69192 = state_68730__$1;
(statearr_68745_69192[(2)] = inst_68691);

(statearr_68745_69192[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68731 === (11))){
var inst_68715 = (state_68730[(2)]);
var state_68730__$1 = state_68730;
if(cljs.core.truth_(inst_68715)){
var statearr_68746_69193 = state_68730__$1;
(statearr_68746_69193[(1)] = (12));

} else {
var statearr_68747_69194 = state_68730__$1;
(statearr_68747_69194[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68731 === (9))){
var inst_68708 = (state_68730[(8)]);
var state_68730__$1 = state_68730;
var statearr_68748_69195 = state_68730__$1;
(statearr_68748_69195[(2)] = inst_68708);

(statearr_68748_69195[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68731 === (5))){
var inst_68700 = cljs_time.core.now();
var inst_68701 = cljs_time.coerce.to_string(inst_68700);
var inst_68702 = ["refresh tokens... ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(inst_68701)].join('');
var inst_68703 = frontend.debug.pprint.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([inst_68702], 0));
var inst_68704 = frontend.handler.user._LT_refresh_id_token_AMPERSAND_access_token();
var state_68730__$1 = (function (){var statearr_68749 = state_68730;
(statearr_68749[(9)] = inst_68703);

return statearr_68749;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_68730__$1,(8),inst_68704);
} else {
if((state_val_68731 === (14))){
var inst_68723 = (state_68730[(2)]);
var state_68730__$1 = state_68730;
var statearr_68751_69196 = state_68730__$1;
(statearr_68751_69196[(2)] = inst_68723);

(statearr_68751_69196[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68731 === (10))){
var inst_68711 = frontend.state.get_auth_id_token();
var inst_68712 = frontend.handler.user.parse_jwt(inst_68711);
var inst_68713 = frontend.handler.user.expired_QMARK_(inst_68712);
var state_68730__$1 = state_68730;
var statearr_68752_69197 = state_68730__$1;
(statearr_68752_69197[(2)] = inst_68713);

(statearr_68752_69197[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68731 === (8))){
var inst_68708 = (state_68730[(8)]);
var inst_68706 = (state_68730[(2)]);
var inst_68707 = frontend.state.get_auth_id_token();
var inst_68708__$1 = (inst_68707 == null);
var state_68730__$1 = (function (){var statearr_68754 = state_68730;
(statearr_68754[(10)] = inst_68706);

(statearr_68754[(8)] = inst_68708__$1);

return statearr_68754;
})();
if(cljs.core.truth_(inst_68708__$1)){
var statearr_68755_69198 = state_68730__$1;
(statearr_68755_69198[(1)] = (9));

} else {
var statearr_68756_69199 = state_68730__$1;
(statearr_68756_69199[(1)] = (10));

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
var frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32051__auto__ = null;
var frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32051__auto____0 = (function (){
var statearr_68757 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_68757[(0)] = frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32051__auto__);

(statearr_68757[(1)] = (1));

return statearr_68757;
});
var frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32051__auto____1 = (function (state_68730){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_68730);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e68759){var ex__32054__auto__ = e68759;
var statearr_68760_69200 = state_68730;
(statearr_68760_69200[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_68730[(4)]))){
var statearr_68761_69201 = state_68730;
(statearr_68761_69201[(1)] = cljs.core.first((state_68730[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__69202 = state_68730;
state_68730 = G__69202;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32051__auto__ = function(state_68730){
switch(arguments.length){
case 0:
return frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32051__auto____1.call(this,state_68730);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32051__auto____0;
frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32051__auto____1;
return frontend$handler$user$_LT_ensure_id_AMPERSAND_access_token_$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_68764 = f__32125__auto__();
(statearr_68764[(6)] = c__32124__auto__);

return statearr_68764;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
});
frontend.handler.user.task__ensure_id_AMPERSAND_access_token = cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr68767_block_13 = (function frontend$handler$user$cr68767_block_13(cr68767_state){
try{var cr68767_place_13 = (cr68767_state[(1)]);
(cr68767_state[(0)] = null);

(cr68767_state[(1)] = null);

return cr68767_place_13;
}catch (e68829){var cr68767_exception = e68829;
(cr68767_state[(0)] = null);

(cr68767_state[(1)] = null);

throw cr68767_exception;
}});
var cr68767_block_0 = (function frontend$handler$user$cr68767_block_0(cr68767_state){
try{var cr68767_place_0 = frontend.state.get_auth_id_token;
var cr68767_place_1 = (function (){var fexpr__68831 = cr68767_place_0;
return (fexpr__68831.cljs$core$IFn$_invoke$arity$0 ? fexpr__68831.cljs$core$IFn$_invoke$arity$0() : fexpr__68831.call(null));
})();
var cr68767_place_2 = cr68767_place_1;
var cr68767_place_3 = null;
var cr68767_place_4 = (cr68767_place_2 == cr68767_place_3);
var cr68767_place_5 = cr68767_place_4;
var cr68767_place_6 = null;
if(cr68767_place_5){
(cr68767_state[(0)] = cr68767_block_2);

(cr68767_state[(1)] = cr68767_place_4);

(cr68767_state[(2)] = cr68767_place_6);

return cr68767_state;
} else {
(cr68767_state[(0)] = cr68767_block_1);

(cr68767_state[(1)] = cr68767_place_1);

(cr68767_state[(2)] = cr68767_place_6);

return cr68767_state;
}
}catch (e68830){var cr68767_exception = e68830;
(cr68767_state[(0)] = null);

throw cr68767_exception;
}});
var cr68767_block_11 = (function frontend$handler$user$cr68767_block_11(cr68767_state){
try{var cr68767_place_43 = cljs.core.ex_info;
var cr68767_place_44 = "empty or expired token and refresh failed";
var cr68767_place_45 = new cljs.core.Keyword(null,"type","type",1174270348);
var cr68767_place_46 = new cljs.core.Keyword(null,"expired-token","expired-token",-311690611);
var cr68767_place_47 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr68767_place_45,cr68767_place_46]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr68767_place_48 = (function (){var G__68834 = cr68767_place_44;
var G__68835 = cr68767_place_47;
var fexpr__68833 = cr68767_place_43;
return (fexpr__68833.cljs$core$IFn$_invoke$arity$2 ? fexpr__68833.cljs$core$IFn$_invoke$arity$2(G__68834,G__68835) : fexpr__68833.call(null,G__68834,G__68835));
})();
var cr68767_place_49 = (function(){throw cr68767_place_48})();
(cr68767_state[(0)] = null);

return null;
}catch (e68832){var cr68767_exception = e68832;
(cr68767_state[(0)] = null);

throw cr68767_exception;
}});
var cr68767_block_1 = (function frontend$handler$user$cr68767_block_1(cr68767_state){
try{var cr68767_place_1 = (cr68767_state[(1)]);
var cr68767_place_7 = frontend.handler.user.almost_expired_or_expired_QMARK_;
var cr68767_place_8 = frontend.handler.user.parse_jwt;
var cr68767_place_9 = cr68767_place_1;
var cr68767_place_10 = (function (){var G__68839 = cr68767_place_9;
var fexpr__68838 = cr68767_place_8;
return (fexpr__68838.cljs$core$IFn$_invoke$arity$1 ? fexpr__68838.cljs$core$IFn$_invoke$arity$1(G__68839) : fexpr__68838.call(null,G__68839));
})();
var cr68767_place_11 = (function (){var G__68841 = cr68767_place_10;
var fexpr__68840 = cr68767_place_7;
return (fexpr__68840.cljs$core$IFn$_invoke$arity$1 ? fexpr__68840.cljs$core$IFn$_invoke$arity$1(G__68841) : fexpr__68840.call(null,G__68841));
})();
(cr68767_state[(0)] = cr68767_block_3);

(cr68767_state[(1)] = null);

(cr68767_state[(2)] = cr68767_place_11);

return cr68767_state;
}catch (e68837){var cr68767_exception = e68837;
(cr68767_state[(0)] = null);

(cr68767_state[(1)] = null);

(cr68767_state[(2)] = null);

throw cr68767_exception;
}});
var cr68767_block_9 = (function frontend$handler$user$cr68767_block_9(cr68767_state){
try{var cr68767_place_33 = (cr68767_state[(2)]);
var cr68767_place_41 = null;
if(cljs.core.truth_(cr68767_place_33)){
(cr68767_state[(0)] = cr68767_block_11);

(cr68767_state[(1)] = null);

(cr68767_state[(2)] = null);

return cr68767_state;
} else {
(cr68767_state[(0)] = cr68767_block_10);

(cr68767_state[(2)] = null);

(cr68767_state[(2)] = cr68767_place_41);

return cr68767_state;
}
}catch (e68842){var cr68767_exception = e68842;
(cr68767_state[(0)] = null);

(cr68767_state[(1)] = null);

(cr68767_state[(2)] = null);

throw cr68767_exception;
}});
var cr68767_block_2 = (function frontend$handler$user$cr68767_block_2(cr68767_state){
try{var cr68767_place_4 = (cr68767_state[(1)]);
var cr68767_place_12 = cr68767_place_4;
(cr68767_state[(0)] = cr68767_block_3);

(cr68767_state[(1)] = null);

(cr68767_state[(2)] = cr68767_place_12);

return cr68767_state;
}catch (e68847){var cr68767_exception = e68847;
(cr68767_state[(0)] = null);

(cr68767_state[(1)] = null);

(cr68767_state[(2)] = null);

throw cr68767_exception;
}});
var cr68767_block_7 = (function frontend$handler$user$cr68767_block_7(cr68767_state){
try{var cr68767_place_34 = frontend.handler.user.expired_QMARK_;
var cr68767_place_35 = frontend.handler.user.parse_jwt;
var cr68767_place_36 = frontend.state.get_auth_id_token;
var cr68767_place_37 = (function (){var fexpr__68851 = cr68767_place_36;
return (fexpr__68851.cljs$core$IFn$_invoke$arity$0 ? fexpr__68851.cljs$core$IFn$_invoke$arity$0() : fexpr__68851.call(null));
})();
var cr68767_place_38 = (function (){var G__68853 = cr68767_place_37;
var fexpr__68852 = cr68767_place_35;
return (fexpr__68852.cljs$core$IFn$_invoke$arity$1 ? fexpr__68852.cljs$core$IFn$_invoke$arity$1(G__68853) : fexpr__68852.call(null,G__68853));
})();
var cr68767_place_39 = (function (){var G__68855 = cr68767_place_38;
var fexpr__68854 = cr68767_place_34;
return (fexpr__68854.cljs$core$IFn$_invoke$arity$1 ? fexpr__68854.cljs$core$IFn$_invoke$arity$1(G__68855) : fexpr__68854.call(null,G__68855));
})();
(cr68767_state[(0)] = cr68767_block_9);

(cr68767_state[(2)] = cr68767_place_39);

return cr68767_state;
}catch (e68848){var cr68767_exception = e68848;
(cr68767_state[(0)] = null);

(cr68767_state[(1)] = null);

(cr68767_state[(2)] = null);

throw cr68767_exception;
}});
var cr68767_block_4 = (function frontend$handler$user$cr68767_block_4(cr68767_state){
try{var cr68767_place_14 = null;
(cr68767_state[(0)] = cr68767_block_13);

(cr68767_state[(1)] = cr68767_place_14);

return cr68767_state;
}catch (e68862){var cr68767_exception = e68862;
(cr68767_state[(0)] = null);

(cr68767_state[(1)] = null);

throw cr68767_exception;
}});
var cr68767_block_3 = (function frontend$handler$user$cr68767_block_3(cr68767_state){
try{var cr68767_place_6 = (cr68767_state[(2)]);
var cr68767_place_13 = null;
if(cljs.core.truth_(cr68767_place_6)){
(cr68767_state[(0)] = cr68767_block_5);

(cr68767_state[(2)] = null);

(cr68767_state[(1)] = cr68767_place_13);

return cr68767_state;
} else {
(cr68767_state[(0)] = cr68767_block_4);

(cr68767_state[(2)] = null);

(cr68767_state[(1)] = cr68767_place_13);

return cr68767_state;
}
}catch (e68863){var cr68767_exception = e68863;
(cr68767_state[(0)] = null);

(cr68767_state[(2)] = null);

throw cr68767_exception;
}});
var cr68767_block_12 = (function frontend$handler$user$cr68767_block_12(cr68767_state){
try{var cr68767_place_41 = (cr68767_state[(2)]);
(cr68767_state[(0)] = cr68767_block_13);

(cr68767_state[(2)] = null);

(cr68767_state[(1)] = cr68767_place_41);

return cr68767_state;
}catch (e68867){var cr68767_exception = e68867;
(cr68767_state[(0)] = null);

(cr68767_state[(2)] = null);

(cr68767_state[(1)] = null);

throw cr68767_exception;
}});
var cr68767_block_10 = (function frontend$handler$user$cr68767_block_10(cr68767_state){
try{var cr68767_place_42 = null;
(cr68767_state[(0)] = cr68767_block_12);

(cr68767_state[(2)] = cr68767_place_42);

return cr68767_state;
}catch (e68869){var cr68767_exception = e68869;
(cr68767_state[(0)] = null);

(cr68767_state[(2)] = null);

(cr68767_state[(1)] = null);

throw cr68767_exception;
}});
var cr68767_block_6 = (function frontend$handler$user$cr68767_block_6(cr68767_state){
try{var cr68767_place_27 = missionary.core.unpark();
var cr68767_place_28 = frontend.state.get_auth_id_token;
var cr68767_place_29 = (function (){var fexpr__68872 = cr68767_place_28;
return (fexpr__68872.cljs$core$IFn$_invoke$arity$0 ? fexpr__68872.cljs$core$IFn$_invoke$arity$0() : fexpr__68872.call(null));
})();
var cr68767_place_30 = null;
var cr68767_place_31 = (cr68767_place_29 == cr68767_place_30);
var cr68767_place_32 = cr68767_place_31;
var cr68767_place_33 = null;
if(cr68767_place_32){
(cr68767_state[(0)] = cr68767_block_8);

(cr68767_state[(3)] = cr68767_place_31);

(cr68767_state[(2)] = cr68767_place_33);

return cr68767_state;
} else {
(cr68767_state[(0)] = cr68767_block_7);

(cr68767_state[(2)] = cr68767_place_33);

return cr68767_state;
}
}catch (e68871){var cr68767_exception = e68871;
(cr68767_state[(0)] = null);

(cr68767_state[(1)] = null);

throw cr68767_exception;
}});
var cr68767_block_5 = (function frontend$handler$user$cr68767_block_5(cr68767_state){
try{var cr68767_place_15 = cljs.core.prn;
var cr68767_place_16 = "refresh tokens... ";
var cr68767_place_17 = cljs_time.coerce.to_string;
var cr68767_place_18 = cljs_time.core.now;
var cr68767_place_19 = (function (){var fexpr__68874 = cr68767_place_18;
return (fexpr__68874.cljs$core$IFn$_invoke$arity$0 ? fexpr__68874.cljs$core$IFn$_invoke$arity$0() : fexpr__68874.call(null));
})();
var cr68767_place_20 = (function (){var G__68876 = cr68767_place_19;
var fexpr__68875 = cr68767_place_17;
return (fexpr__68875.cljs$core$IFn$_invoke$arity$1 ? fexpr__68875.cljs$core$IFn$_invoke$arity$1(G__68876) : fexpr__68875.call(null,G__68876));
})();
var cr68767_place_21 = [cr68767_place_16,cljs.core.str.cljs$core$IFn$_invoke$arity$1(cr68767_place_20)].join('');
var cr68767_place_22 = (function (){var G__68881 = cr68767_place_21;
var fexpr__68880 = cr68767_place_15;
return (fexpr__68880.cljs$core$IFn$_invoke$arity$1 ? fexpr__68880.cljs$core$IFn$_invoke$arity$1(G__68881) : fexpr__68880.call(null,G__68881));
})();
var cr68767_place_23 = frontend.common.missionary._LT__BANG_;
var cr68767_place_24 = frontend.handler.user._LT_refresh_id_token_AMPERSAND_access_token;
var cr68767_place_25 = (function (){var fexpr__68882 = cr68767_place_24;
return (fexpr__68882.cljs$core$IFn$_invoke$arity$0 ? fexpr__68882.cljs$core$IFn$_invoke$arity$0() : fexpr__68882.call(null));
})();
var cr68767_place_26 = (function (){var G__68884 = cr68767_place_25;
var fexpr__68883 = cr68767_place_23;
return (fexpr__68883.cljs$core$IFn$_invoke$arity$1 ? fexpr__68883.cljs$core$IFn$_invoke$arity$1(G__68884) : fexpr__68883.call(null,G__68884));
})();
(cr68767_state[(0)] = cr68767_block_6);

return missionary.core.park(cr68767_place_26);
}catch (e68873){var cr68767_exception = e68873;
(cr68767_state[(0)] = null);

(cr68767_state[(1)] = null);

throw cr68767_exception;
}});
var cr68767_block_8 = (function frontend$handler$user$cr68767_block_8(cr68767_state){
try{var cr68767_place_31 = (cr68767_state[(3)]);
var cr68767_place_40 = cr68767_place_31;
(cr68767_state[(0)] = cr68767_block_9);

(cr68767_state[(3)] = null);

(cr68767_state[(2)] = cr68767_place_40);

return cr68767_state;
}catch (e68885){var cr68767_exception = e68885;
(cr68767_state[(0)] = null);

(cr68767_state[(1)] = null);

(cr68767_state[(2)] = null);

(cr68767_state[(3)] = null);

throw cr68767_exception;
}});
return cloroutine.impl.coroutine((function (){var G__68886 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((4));
(G__68886[(0)] = cr68767_block_0);

return G__68886;
})());
})(),missionary.core.sp_run);
frontend.handler.user._LT_user_uuid = (function frontend$handler$user$_LT_user_uuid(){
var c__32124__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__32125__auto__ = (function (){var switch__32050__auto__ = (function (state_68904){
var state_val_68905 = (state_68904[(1)]);
if((state_val_68905 === (1))){
var inst_68892 = frontend.handler.user._LT_ensure_id_AMPERSAND_access_token();
var state_68904__$1 = state_68904;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_68904__$1,(2),inst_68892);
} else {
if((state_val_68905 === (2))){
var inst_68895 = (state_68904[(7)]);
var inst_68895__$1 = (state_68904[(2)]);
var inst_68897 = (inst_68895__$1 == null);
var state_68904__$1 = (function (){var statearr_68910 = state_68904;
(statearr_68910[(7)] = inst_68895__$1);

return statearr_68910;
})();
if(cljs.core.truth_(inst_68897)){
var statearr_68911_69203 = state_68904__$1;
(statearr_68911_69203[(1)] = (3));

} else {
var statearr_68913_69204 = state_68904__$1;
(statearr_68913_69204[(1)] = (4));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68905 === (3))){
var inst_68899 = frontend.handler.user.user_uuid();
var state_68904__$1 = state_68904;
var statearr_68916_69205 = state_68904__$1;
(statearr_68916_69205[(2)] = inst_68899);

(statearr_68916_69205[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68905 === (4))){
var inst_68895 = (state_68904[(7)]);
var state_68904__$1 = state_68904;
var statearr_68917_69206 = state_68904__$1;
(statearr_68917_69206[(2)] = inst_68895);

(statearr_68917_69206[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_68905 === (5))){
var inst_68902 = (state_68904[(2)]);
var state_68904__$1 = state_68904;
return cljs.core.async.impl.ioc_helpers.return_chan(state_68904__$1,inst_68902);
} else {
return null;
}
}
}
}
}
});
return (function() {
var frontend$handler$user$_LT_user_uuid_$_state_machine__32051__auto__ = null;
var frontend$handler$user$_LT_user_uuid_$_state_machine__32051__auto____0 = (function (){
var statearr_68918 = [null,null,null,null,null,null,null,null];
(statearr_68918[(0)] = frontend$handler$user$_LT_user_uuid_$_state_machine__32051__auto__);

(statearr_68918[(1)] = (1));

return statearr_68918;
});
var frontend$handler$user$_LT_user_uuid_$_state_machine__32051__auto____1 = (function (state_68904){
while(true){
var ret_value__32052__auto__ = (function (){try{while(true){
var result__32053__auto__ = switch__32050__auto__(state_68904);
if(cljs.core.keyword_identical_QMARK_(result__32053__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__32053__auto__;
}
break;
}
}catch (e68919){var ex__32054__auto__ = e68919;
var statearr_68920_69207 = state_68904;
(statearr_68920_69207[(2)] = ex__32054__auto__);


if(cljs.core.seq((state_68904[(4)]))){
var statearr_68923_69208 = state_68904;
(statearr_68923_69208[(1)] = cljs.core.first((state_68904[(4)])));

} else {
throw ex__32054__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__32052__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__69209 = state_68904;
state_68904 = G__69209;
continue;
} else {
return ret_value__32052__auto__;
}
break;
}
});
frontend$handler$user$_LT_user_uuid_$_state_machine__32051__auto__ = function(state_68904){
switch(arguments.length){
case 0:
return frontend$handler$user$_LT_user_uuid_$_state_machine__32051__auto____0.call(this);
case 1:
return frontend$handler$user$_LT_user_uuid_$_state_machine__32051__auto____1.call(this,state_68904);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
frontend$handler$user$_LT_user_uuid_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$0 = frontend$handler$user$_LT_user_uuid_$_state_machine__32051__auto____0;
frontend$handler$user$_LT_user_uuid_$_state_machine__32051__auto__.cljs$core$IFn$_invoke$arity$1 = frontend$handler$user$_LT_user_uuid_$_state_machine__32051__auto____1;
return frontend$handler$user$_LT_user_uuid_$_state_machine__32051__auto__;
})()
})();
var state__32126__auto__ = (function (){var statearr_68924 = f__32125__auto__();
(statearr_68924[(6)] = c__32124__auto__);

return statearr_68924;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__32126__auto__);
}));

return c__32124__auto__;
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
return new cljs.core.Keyword(null,"graph<->user-user-type","graph<->user-user-type",1524958981).cljs$core$IFn$_invoke$arity$1(cljs.core.some((function (p1__68934_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(repo,new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(p1__68934_SHARP_))){
return p1__68934_SHARP_;
} else {
return null;
}
}),new cljs.core.Keyword("rtc","graphs","rtc/graphs",-1584628267).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(frontend.state.state))));
});
frontend.handler.user.manager_QMARK_ = (function frontend$handler$user$manager_QMARK_(repo){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(frontend.handler.user.get_user_type(repo),"manager");
});
frontend.handler.user.new_task__upload_user_avatar = (function frontend$handler$user$new_task__upload_user_avatar(avatar_str){
return cljs.core.partial.cljs$core$IFn$_invoke$arity$2((function (){var cr68937_block_0 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr68937_block_0(cr68937_state){
try{var cr68937_place_0 = frontend.state.get_auth_id_token;
var cr68937_place_1 = (function (){var fexpr__69019 = cr68937_place_0;
return (fexpr__69019.cljs$core$IFn$_invoke$arity$0 ? fexpr__69019.cljs$core$IFn$_invoke$arity$0() : fexpr__69019.call(null));
})();
var cr68937_place_2 = cr68937_place_1;
var cr68937_place_3 = null;
if(cljs.core.truth_(cr68937_place_2)){
(cr68937_state[(0)] = cr68937_block_2);

(cr68937_state[(2)] = cr68937_place_1);

(cr68937_state[(1)] = cr68937_place_3);

return cr68937_state;
} else {
(cr68937_state[(0)] = cr68937_block_1);

(cr68937_state[(1)] = cr68937_place_3);

return cr68937_state;
}
}catch (e69018){var cr68937_exception = e69018;
(cr68937_state[(0)] = null);

throw cr68937_exception;
}});
var cr68937_block_8 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr68937_block_8(cr68937_state){
try{var cr68937_place_23 = (cr68937_state[(2)]);
var cr68937_place_69 = cljs.core.ex_info;
var cr68937_place_70 = "failed to upload avatar";
var cr68937_place_71 = new cljs.core.Keyword(null,"resp","resp",1418702376);
var cr68937_place_72 = cr68937_place_23;
var cr68937_place_73 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr68937_place_71,cr68937_place_72]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr68937_place_74 = (function (){var G__69029 = cr68937_place_70;
var G__69030 = cr68937_place_73;
var fexpr__69028 = cr68937_place_69;
return (fexpr__69028.cljs$core$IFn$_invoke$arity$2 ? fexpr__69028.cljs$core$IFn$_invoke$arity$2(G__69029,G__69030) : fexpr__69028.call(null,G__69029,G__69030));
})();
var cr68937_place_75 = (function(){throw cr68937_place_74})();
(cr68937_state[(0)] = null);

(cr68937_state[(2)] = null);

return null;
}catch (e69027){var cr68937_exception = e69027;
(cr68937_state[(0)] = null);

(cr68937_state[(2)] = null);

throw cr68937_exception;
}});
var cr68937_block_1 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr68937_block_1(cr68937_state){
try{var cr68937_place_4 = null;
(cr68937_state[(0)] = cr68937_block_11);

(cr68937_state[(1)] = cr68937_place_4);

return cr68937_state;
}catch (e69031){var cr68937_exception = e69031;
(cr68937_state[(0)] = null);

(cr68937_state[(1)] = null);

throw cr68937_exception;
}});
var cr68937_block_4 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr68937_block_4(cr68937_state){
try{var cr68937_place_23 = (cr68937_state[(2)]);
var cr68937_place_36 = cljs.core.ex_info;
var cr68937_place_37 = "failed to get presigned url";
var cr68937_place_38 = new cljs.core.Keyword(null,"resp","resp",1418702376);
var cr68937_place_39 = cr68937_place_23;
var cr68937_place_40 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr68937_place_38,cr68937_place_39]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr68937_place_41 = (function (){var G__69034 = cr68937_place_37;
var G__69035 = cr68937_place_40;
var fexpr__69033 = cr68937_place_36;
return (fexpr__69033.cljs$core$IFn$_invoke$arity$2 ? fexpr__69033.cljs$core$IFn$_invoke$arity$2(G__69034,G__69035) : fexpr__69033.call(null,G__69034,G__69035));
})();
var cr68937_place_42 = (function(){throw cr68937_place_41})();
(cr68937_state[(0)] = null);

(cr68937_state[(2)] = null);

return null;
}catch (e69032){var cr68937_exception = e69032;
(cr68937_state[(0)] = null);

(cr68937_state[(2)] = null);

throw cr68937_exception;
}});
var cr68937_block_2 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr68937_block_2(cr68937_state){
try{var cr68937_place_1 = (cr68937_state[(2)]);
var cr68937_place_5 = cr68937_place_1;
var cr68937_place_6 = frontend.common.missionary._LT__BANG_;
var cr68937_place_7 = cljs_http.client.post;
var cr68937_place_8 = "https://";
var cr68937_place_9 = frontend.config.API_DOMAIN;
var cr68937_place_10 = "/logseq/get_presigned_user_avatar_put_url";
var cr68937_place_11 = [cr68937_place_8,cr68937_place_9,cr68937_place_10].join('');
var cr68937_place_12 = new cljs.core.Keyword(null,"oauth-token","oauth-token",311415191);
var cr68937_place_13 = cr68937_place_5;
var cr68937_place_14 = new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222);
var cr68937_place_15 = false;
var cr68937_place_16 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr68937_place_14,cr68937_place_15,cr68937_place_12,cr68937_place_13]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr68937_place_17 = (function (){var G__69038 = cr68937_place_11;
var G__69039 = cr68937_place_16;
var fexpr__69037 = cr68937_place_7;
return (fexpr__69037.cljs$core$IFn$_invoke$arity$2 ? fexpr__69037.cljs$core$IFn$_invoke$arity$2(G__69038,G__69039) : fexpr__69037.call(null,G__69038,G__69039));
})();
var cr68937_place_18 = (function (){var G__69041 = cr68937_place_17;
var fexpr__69040 = cr68937_place_6;
return (fexpr__69040.cljs$core$IFn$_invoke$arity$1 ? fexpr__69040.cljs$core$IFn$_invoke$arity$1(G__69041) : fexpr__69040.call(null,G__69041));
})();
(cr68937_state[(0)] = cr68937_block_3);

(cr68937_state[(2)] = null);

return missionary.core.park(cr68937_place_18);
}catch (e69036){var cr68937_exception = e69036;
(cr68937_state[(0)] = null);

(cr68937_state[(1)] = null);

(cr68937_state[(2)] = null);

throw cr68937_exception;
}});
var cr68937_block_6 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr68937_block_6(cr68937_state){
try{var cr68937_place_35 = (cr68937_state[(3)]);
var cr68937_place_31 = (cr68937_state[(4)]);
var cr68937_place_44 = new cljs.core.Keyword(null,"presigned-url","presigned-url",90607137);
var cr68937_place_45 = cr68937_place_31;
var cr68937_place_46 = cr68937_place_44.cljs$core$IFn$_invoke$arity$1(cr68937_place_45);
var cr68937_place_47 = frontend.common.missionary._LT__BANG_;
var cr68937_place_48 = cljs_http.client.put;
var cr68937_place_49 = cr68937_place_46;
var cr68937_place_50 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr68937_place_51 = avatar_str;
var cr68937_place_52 = new cljs.core.Keyword(null,"with-credentials?","with-credentials?",-1773202222);
var cr68937_place_53 = false;
var cr68937_place_54 = cljs.core.with_meta(cljs.core.PersistentArrayMap.createAsIfByAssoc([cr68937_place_52,cr68937_place_53,cr68937_place_50,cr68937_place_51]),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),cljs.core.IMap], null));
var cr68937_place_55 = (function (){var G__69044 = cr68937_place_49;
var G__69045 = cr68937_place_54;
var fexpr__69043 = cr68937_place_48;
return (fexpr__69043.cljs$core$IFn$_invoke$arity$2 ? fexpr__69043.cljs$core$IFn$_invoke$arity$2(G__69044,G__69045) : fexpr__69043.call(null,G__69044,G__69045));
})();
var cr68937_place_56 = (function (){var G__69047 = cr68937_place_55;
var fexpr__69046 = cr68937_place_47;
return (fexpr__69046.cljs$core$IFn$_invoke$arity$1 ? fexpr__69046.cljs$core$IFn$_invoke$arity$1(G__69047) : fexpr__69046.call(null,G__69047));
})();
(cr68937_state[(0)] = cr68937_block_7);

(cr68937_state[(3)] = null);

(cr68937_state[(4)] = null);

return missionary.core.park(cr68937_place_56);
}catch (e69042){var cr68937_exception = e69042;
(cr68937_state[(0)] = null);

(cr68937_state[(1)] = null);

(cr68937_state[(2)] = null);

(cr68937_state[(3)] = null);

(cr68937_state[(4)] = null);

throw cr68937_exception;
}});
var cr68937_block_11 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr68937_block_11(cr68937_state){
try{var cr68937_place_3 = (cr68937_state[(1)]);
(cr68937_state[(0)] = null);

(cr68937_state[(1)] = null);

return cr68937_place_3;
}catch (e69048){var cr68937_exception = e69048;
(cr68937_state[(0)] = null);

(cr68937_state[(1)] = null);

throw cr68937_exception;
}});
var cr68937_block_3 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr68937_block_3(cr68937_state){
try{var cr68937_place_19 = missionary.core.unpark();
var cr68937_place_20 = cljs.core.__destructure_map;
var cr68937_place_21 = cr68937_place_19;
var cr68937_place_22 = (function (){var G__69051 = cr68937_place_21;
var fexpr__69050 = cr68937_place_20;
return (fexpr__69050.cljs$core$IFn$_invoke$arity$1 ? fexpr__69050.cljs$core$IFn$_invoke$arity$1(G__69051) : fexpr__69050.call(null,G__69051));
})();
var cr68937_place_23 = cr68937_place_22;
var cr68937_place_24 = cljs.core.get;
var cr68937_place_25 = cr68937_place_22;
var cr68937_place_26 = new cljs.core.Keyword(null,"status","status",-1997798413);
var cr68937_place_27 = (function (){var G__69053 = cr68937_place_25;
var G__69054 = cr68937_place_26;
var fexpr__69052 = cr68937_place_24;
return (fexpr__69052.cljs$core$IFn$_invoke$arity$2 ? fexpr__69052.cljs$core$IFn$_invoke$arity$2(G__69053,G__69054) : fexpr__69052.call(null,G__69053,G__69054));
})();
var cr68937_place_28 = cljs.core.get;
var cr68937_place_29 = cr68937_place_22;
var cr68937_place_30 = new cljs.core.Keyword(null,"body","body",-2049205669);
var cr68937_place_31 = (function (){var G__69056 = cr68937_place_29;
var G__69057 = cr68937_place_30;
var fexpr__69055 = cr68937_place_28;
return (fexpr__69055.cljs$core$IFn$_invoke$arity$2 ? fexpr__69055.cljs$core$IFn$_invoke$arity$2(G__69056,G__69057) : fexpr__69055.call(null,G__69056,G__69057));
})();
var cr68937_place_32 = cljs_http.client.unexceptional_status_QMARK_;
var cr68937_place_33 = cr68937_place_27;
var cr68937_place_34 = (function (){var G__69059 = cr68937_place_33;
var fexpr__69058 = cr68937_place_32;
return (fexpr__69058.cljs$core$IFn$_invoke$arity$1 ? fexpr__69058.cljs$core$IFn$_invoke$arity$1(G__69059) : fexpr__69058.call(null,G__69059));
})();
var cr68937_place_35 = null;
if(cljs.core.truth_(cr68937_place_34)){
(cr68937_state[(0)] = cr68937_block_5);

(cr68937_state[(2)] = cr68937_place_23);

(cr68937_state[(3)] = cr68937_place_35);

(cr68937_state[(4)] = cr68937_place_31);

return cr68937_state;
} else {
(cr68937_state[(0)] = cr68937_block_4);

(cr68937_state[(1)] = null);

(cr68937_state[(2)] = cr68937_place_23);

return cr68937_state;
}
}catch (e69049){var cr68937_exception = e69049;
(cr68937_state[(0)] = null);

(cr68937_state[(1)] = null);

throw cr68937_exception;
}});
var cr68937_block_10 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr68937_block_10(cr68937_state){
try{var cr68937_place_68 = (cr68937_state[(2)]);
(cr68937_state[(0)] = cr68937_block_11);

(cr68937_state[(2)] = null);

(cr68937_state[(1)] = cr68937_place_68);

return cr68937_state;
}catch (e69062){var cr68937_exception = e69062;
(cr68937_state[(0)] = null);

(cr68937_state[(1)] = null);

(cr68937_state[(2)] = null);

throw cr68937_exception;
}});
var cr68937_block_5 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr68937_block_5(cr68937_state){
try{var cr68937_place_43 = null;
(cr68937_state[(0)] = cr68937_block_6);

(cr68937_state[(3)] = cr68937_place_43);

return cr68937_state;
}catch (e69063){var cr68937_exception = e69063;
(cr68937_state[(0)] = null);

(cr68937_state[(1)] = null);

(cr68937_state[(2)] = null);

(cr68937_state[(3)] = null);

(cr68937_state[(4)] = null);

throw cr68937_exception;
}});
var cr68937_block_7 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr68937_block_7(cr68937_state){
try{var cr68937_place_57 = missionary.core.unpark();
var cr68937_place_58 = cljs.core.__destructure_map;
var cr68937_place_59 = cr68937_place_57;
var cr68937_place_60 = (function (){var G__69066 = cr68937_place_59;
var fexpr__69065 = cr68937_place_58;
return (fexpr__69065.cljs$core$IFn$_invoke$arity$1 ? fexpr__69065.cljs$core$IFn$_invoke$arity$1(G__69066) : fexpr__69065.call(null,G__69066));
})();
var cr68937_place_61 = cljs.core.get;
var cr68937_place_62 = cr68937_place_60;
var cr68937_place_63 = new cljs.core.Keyword(null,"status","status",-1997798413);
var cr68937_place_64 = (function (){var G__69068 = cr68937_place_62;
var G__69069 = cr68937_place_63;
var fexpr__69067 = cr68937_place_61;
return (fexpr__69067.cljs$core$IFn$_invoke$arity$2 ? fexpr__69067.cljs$core$IFn$_invoke$arity$2(G__69068,G__69069) : fexpr__69067.call(null,G__69068,G__69069));
})();
var cr68937_place_65 = cljs_http.client.unexceptional_status_QMARK_;
var cr68937_place_66 = cr68937_place_64;
var cr68937_place_67 = (function (){var G__69071 = cr68937_place_66;
var fexpr__69070 = cr68937_place_65;
return (fexpr__69070.cljs$core$IFn$_invoke$arity$1 ? fexpr__69070.cljs$core$IFn$_invoke$arity$1(G__69071) : fexpr__69070.call(null,G__69071));
})();
var cr68937_place_68 = null;
if(cljs.core.truth_(cr68937_place_67)){
(cr68937_state[(0)] = cr68937_block_9);

(cr68937_state[(2)] = null);

(cr68937_state[(2)] = cr68937_place_68);

return cr68937_state;
} else {
(cr68937_state[(0)] = cr68937_block_8);

(cr68937_state[(1)] = null);

return cr68937_state;
}
}catch (e69064){var cr68937_exception = e69064;
(cr68937_state[(0)] = null);

(cr68937_state[(1)] = null);

(cr68937_state[(2)] = null);

throw cr68937_exception;
}});
var cr68937_block_9 = (function frontend$handler$user$new_task__upload_user_avatar_$_cr68937_block_9(cr68937_state){
try{var cr68937_place_76 = null;
(cr68937_state[(0)] = cr68937_block_10);

(cr68937_state[(2)] = cr68937_place_76);

return cr68937_state;
}catch (e69072){var cr68937_exception = e69072;
(cr68937_state[(0)] = null);

(cr68937_state[(1)] = null);

(cr68937_state[(2)] = null);

throw cr68937_exception;
}});
return cloroutine.impl.coroutine((function (){var G__69074 = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1((5));
(G__69074[(0)] = cr68937_block_0);

return G__69074;
})());
})(),missionary.core.sp_run);
});

//# sourceMappingURL=frontend.handler.user.js.map
