goog.provide('frontend.handler.notification');
frontend.handler.notification.clear_BANG_ = (function frontend$handler$notification$clear_BANG_(uid){
var contents = frontend.state.get_notification_contents();
var close_cb = new cljs.core.Keyword(null,"close-cb","close-cb",-1532621281).cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(contents,uid));
frontend.state.set_state_BANG_(new cljs.core.Keyword("notification","contents","notification/contents",-1760740618),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(contents,uid));

if(cljs.core.fn_QMARK_(close_cb)){
return (close_cb.cljs$core$IFn$_invoke$arity$1 ? close_cb.cljs$core$IFn$_invoke$arity$1(uid) : close_cb.call(null,uid));
} else {
return null;
}
});
frontend.handler.notification.clear_all_BANG_ = (function frontend$handler$notification$clear_all_BANG_(){
return frontend.state.set_state_BANG_(new cljs.core.Keyword("notification","contents","notification/contents",-1760740618),null);
});
frontend.handler.notification.show_BANG_ = (function frontend$handler$notification$show_BANG_(var_args){
var G__100425 = arguments.length;
switch (G__100425) {
case 1:
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
case 6:
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$6((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),(arguments[(5)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (content){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$6(content,new cljs.core.Keyword(null,"info","info",-317069002),true,null,(2000),null);
}));

(frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (content,status){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$6(content,status,cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(status,new cljs.core.Keyword(null,"error","error",-978969032)),null,(1500),null);
}));

(frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (content,status,clear_QMARK_){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$6(content,status,clear_QMARK_,null,(2000),null);
}));

(frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$4 = (function (content,status,clear_QMARK_,uid){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$6(content,status,clear_QMARK_,uid,(2000),null);
}));

(frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$5 = (function (content,status,clear_QMARK_,uid,timeout){
return frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$6(content,status,clear_QMARK_,uid,timeout,null);
}));

(frontend.handler.notification.show_BANG_.cljs$core$IFn$_invoke$arity$6 = (function (content,status,clear_QMARK_,uid,timeout,close_cb){
var contents = frontend.state.get_notification_contents();
var uid__$1 = (function (){var or__5002__auto__ = uid;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.keyword.cljs$core$IFn$_invoke$arity$1(frontend.util.unique_id());
}
})();
frontend.state.set_state_BANG_(new cljs.core.Keyword("notification","contents","notification/contents",-1760740618),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(contents,uid__$1,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"content","content",15833224),content,new cljs.core.Keyword(null,"status","status",-1997798413),status,new cljs.core.Keyword(null,"close-cb","close-cb",-1532621281),close_cb], null)));

if(((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(status,new cljs.core.Keyword(null,"error","error",-978969032))) && ((!(clear_QMARK_ === false))))){
setTimeout((function (){
return frontend.handler.notification.clear_BANG_(uid__$1);
}),(function (){var or__5002__auto__ = timeout;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (2000);
}
})());
} else {
}

return uid__$1;
}));

(frontend.handler.notification.show_BANG_.cljs$lang$maxFixedArity = 6);


//# sourceMappingURL=frontend.handler.notification.js.map
