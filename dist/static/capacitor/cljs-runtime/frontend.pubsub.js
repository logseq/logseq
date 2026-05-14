goog.provide('frontend.pubsub');

/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.WritePort}
 * @implements {cljs.core.async.impl.protocols.ReadPort}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
frontend.pubsub.t_frontend$pubsub76346 = (function (ch__76302__auto__,meta76347){
this.ch__76302__auto__ = ch__76302__auto__;
this.meta76347 = meta76347;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(frontend.pubsub.t_frontend$pubsub76346.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_76348,meta76347__$1){
var self__ = this;
var _76348__$1 = this;
return (new frontend.pubsub.t_frontend$pubsub76346(self__.ch__76302__auto__,meta76347__$1));
}));

(frontend.pubsub.t_frontend$pubsub76346.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_76348){
var self__ = this;
var _76348__$1 = this;
return self__.meta76347;
}));

(frontend.pubsub.t_frontend$pubsub76346.prototype.cljs$core$async$impl$protocols$ReadPort$ = cljs.core.PROTOCOL_SENTINEL);

(frontend.pubsub.t_frontend$pubsub76346.prototype.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2 = (function (_,fn1_handler__76303__auto__){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.take_BANG_(self__.ch__76302__auto__,fn1_handler__76303__auto__);
}));

(frontend.pubsub.t_frontend$pubsub76346.prototype.cljs$core$async$impl$protocols$WritePort$ = cljs.core.PROTOCOL_SENTINEL);

(frontend.pubsub.t_frontend$pubsub76346.prototype.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3 = (function (_,val__76304__auto__,fn1_handler__76303__auto__){
var self__ = this;
var ___$1 = this;
if(cljs.core.truth_((frontend.pubsub.app_wake_up_from_sleep_validator.cljs$core$IFn$_invoke$arity$1 ? frontend.pubsub.app_wake_up_from_sleep_validator.cljs$core$IFn$_invoke$arity$1(val__76304__auto__) : frontend.pubsub.app_wake_up_from_sleep_validator.call(null,val__76304__auto__)))){
return cljs.core.async.impl.protocols.put_BANG_(self__.ch__76302__auto__,val__76304__auto__,fn1_handler__76303__auto__);
} else {
malli.dev.pretty.explain.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"last-activated-at","last-activated-at",560279298),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"now","now",-1650525531),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null),val__76304__auto__);

throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("validate chan value failed",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"val","val",128701612),val__76304__auto__], null));
}
}));

(frontend.pubsub.t_frontend$pubsub76346.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"ch__76302__auto__","ch__76302__auto__",-1317011845,null),new cljs.core.Symbol(null,"meta76347","meta76347",-701573084,null)], null);
}));

(frontend.pubsub.t_frontend$pubsub76346.cljs$lang$type = true);

(frontend.pubsub.t_frontend$pubsub76346.cljs$lang$ctorStr = "frontend.pubsub/t_frontend$pubsub76346");

(frontend.pubsub.t_frontend$pubsub76346.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"frontend.pubsub/t_frontend$pubsub76346");
}));

/**
 * Positional factory function for frontend.pubsub/t_frontend$pubsub76346.
 */
frontend.pubsub.__GT_t_frontend$pubsub76346 = (function frontend$pubsub$__GT_t_frontend$pubsub76346(ch__76302__auto__,meta76347){
return (new frontend.pubsub.t_frontend$pubsub76346(ch__76302__auto__,meta76347));
});


frontend.pubsub.app_wake_up_from_sleep_schema = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"last-activated-at","last-activated-at",560279298),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"now","now",-1650525531),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null);

frontend.pubsub.app_wake_up_from_sleep_validator = malli.core.validator.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"last-activated-at","last-activated-at",560279298),new cljs.core.Keyword(null,"int","int",-1741416922)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"now","now",-1650525531),new cljs.core.Keyword(null,"int","int",-1741416922)], null)], null));

/**
 * app wake up from sleep event
 * Malli-schema:
 * [:map [:last-activated-at :int] [:now :int]]
 */
frontend.pubsub.app_wake_up_from_sleep_ch = (function (){var ch__76302__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
return (new frontend.pubsub.t_frontend$pubsub76346(ch__76302__auto__,null));
})();

/**
 * app wake up from sleep event
 * Malli-schema:
 * [:map [:last-activated-at :int] [:now :int]]
 */
frontend.pubsub.app_wake_up_from_sleep_mult = cljs.core.async.mult(frontend.pubsub.app_wake_up_from_sleep_ch);

/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.WritePort}
 * @implements {cljs.core.async.impl.protocols.ReadPort}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
frontend.pubsub.t_frontend$pubsub76362 = (function (ch__76302__auto__,meta76363){
this.ch__76302__auto__ = ch__76302__auto__;
this.meta76363 = meta76363;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(frontend.pubsub.t_frontend$pubsub76362.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_76364,meta76363__$1){
var self__ = this;
var _76364__$1 = this;
return (new frontend.pubsub.t_frontend$pubsub76362(self__.ch__76302__auto__,meta76363__$1));
}));

(frontend.pubsub.t_frontend$pubsub76362.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_76364){
var self__ = this;
var _76364__$1 = this;
return self__.meta76363;
}));

(frontend.pubsub.t_frontend$pubsub76362.prototype.cljs$core$async$impl$protocols$ReadPort$ = cljs.core.PROTOCOL_SENTINEL);

(frontend.pubsub.t_frontend$pubsub76362.prototype.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2 = (function (_,fn1_handler__76303__auto__){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.take_BANG_(self__.ch__76302__auto__,fn1_handler__76303__auto__);
}));

(frontend.pubsub.t_frontend$pubsub76362.prototype.cljs$core$async$impl$protocols$WritePort$ = cljs.core.PROTOCOL_SENTINEL);

(frontend.pubsub.t_frontend$pubsub76362.prototype.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3 = (function (_,val__76304__auto__,fn1_handler__76303__auto__){
var self__ = this;
var ___$1 = this;
if(cljs.core.truth_((frontend.pubsub.sync_events_validator.cljs$core$IFn$_invoke$arity$1 ? frontend.pubsub.sync_events_validator.cljs$core$IFn$_invoke$arity$1(val__76304__auto__) : frontend.pubsub.sync_events_validator.call(null,val__76304__auto__)))){
return cljs.core.async.impl.protocols.put_BANG_(self__.ch__76302__auto__,val__76304__auto__,fn1_handler__76303__auto__);
} else {
malli.dev.pretty.explain.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"event","event",301435442),new cljs.core.PersistentVector(null, 13, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"enum","enum",1679018432),new cljs.core.Keyword(null,"created-local-version-file","created-local-version-file",-1935718099),new cljs.core.Keyword(null,"finished-local->remote","finished-local->remote",2118586037),new cljs.core.Keyword(null,"finished-remote->local","finished-remote->local",1594006010),new cljs.core.Keyword(null,"start","start",-355208981),new cljs.core.Keyword(null,"pause","pause",-2095325672),new cljs.core.Keyword(null,"resume","resume",-118572261),new cljs.core.Keyword(null,"exception-decrypt-failed","exception-decrypt-failed",-2009470589),new cljs.core.Keyword(null,"remote->local-full-sync-failed","remote->local-full-sync-failed",641780),new cljs.core.Keyword(null,"local->remote-full-sync-failed","local->remote-full-sync-failed",1051396880),new cljs.core.Keyword(null,"get-remote-graph-failed","get-remote-graph-failed",-879957471),new cljs.core.Keyword(null,"get-deletion-logs-failed","get-deletion-logs-failed",1048563694),new cljs.core.Keyword(null,"get-remote-all-files-failed","get-remote-all-files-failed",369827780)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data","data",-232669377),new cljs.core.Keyword(null,"map","map",1371690461)], null)], null),val__76304__auto__);

throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("validate chan value failed",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"val","val",128701612),val__76304__auto__], null));
}
}));

(frontend.pubsub.t_frontend$pubsub76362.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"ch__76302__auto__","ch__76302__auto__",-1317011845,null),new cljs.core.Symbol(null,"meta76363","meta76363",-676589825,null)], null);
}));

(frontend.pubsub.t_frontend$pubsub76362.cljs$lang$type = true);

(frontend.pubsub.t_frontend$pubsub76362.cljs$lang$ctorStr = "frontend.pubsub/t_frontend$pubsub76362");

(frontend.pubsub.t_frontend$pubsub76362.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"frontend.pubsub/t_frontend$pubsub76362");
}));

/**
 * Positional factory function for frontend.pubsub/t_frontend$pubsub76362.
 */
frontend.pubsub.__GT_t_frontend$pubsub76362 = (function frontend$pubsub$__GT_t_frontend$pubsub76362(ch__76302__auto__,meta76363){
return (new frontend.pubsub.t_frontend$pubsub76362(ch__76302__auto__,meta76363));
});


frontend.pubsub.sync_events_schema = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"event","event",301435442),new cljs.core.PersistentVector(null, 13, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"enum","enum",1679018432),new cljs.core.Keyword(null,"created-local-version-file","created-local-version-file",-1935718099),new cljs.core.Keyword(null,"finished-local->remote","finished-local->remote",2118586037),new cljs.core.Keyword(null,"finished-remote->local","finished-remote->local",1594006010),new cljs.core.Keyword(null,"start","start",-355208981),new cljs.core.Keyword(null,"pause","pause",-2095325672),new cljs.core.Keyword(null,"resume","resume",-118572261),new cljs.core.Keyword(null,"exception-decrypt-failed","exception-decrypt-failed",-2009470589),new cljs.core.Keyword(null,"remote->local-full-sync-failed","remote->local-full-sync-failed",641780),new cljs.core.Keyword(null,"local->remote-full-sync-failed","local->remote-full-sync-failed",1051396880),new cljs.core.Keyword(null,"get-remote-graph-failed","get-remote-graph-failed",-879957471),new cljs.core.Keyword(null,"get-deletion-logs-failed","get-deletion-logs-failed",1048563694),new cljs.core.Keyword(null,"get-remote-all-files-failed","get-remote-all-files-failed",369827780)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data","data",-232669377),new cljs.core.Keyword(null,"map","map",1371690461)], null)], null);

frontend.pubsub.sync_events_validator = malli.core.validator.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"event","event",301435442),new cljs.core.PersistentVector(null, 13, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"enum","enum",1679018432),new cljs.core.Keyword(null,"created-local-version-file","created-local-version-file",-1935718099),new cljs.core.Keyword(null,"finished-local->remote","finished-local->remote",2118586037),new cljs.core.Keyword(null,"finished-remote->local","finished-remote->local",1594006010),new cljs.core.Keyword(null,"start","start",-355208981),new cljs.core.Keyword(null,"pause","pause",-2095325672),new cljs.core.Keyword(null,"resume","resume",-118572261),new cljs.core.Keyword(null,"exception-decrypt-failed","exception-decrypt-failed",-2009470589),new cljs.core.Keyword(null,"remote->local-full-sync-failed","remote->local-full-sync-failed",641780),new cljs.core.Keyword(null,"local->remote-full-sync-failed","local->remote-full-sync-failed",1051396880),new cljs.core.Keyword(null,"get-remote-graph-failed","get-remote-graph-failed",-879957471),new cljs.core.Keyword(null,"get-deletion-logs-failed","get-deletion-logs-failed",1048563694),new cljs.core.Keyword(null,"get-remote-all-files-failed","get-remote-all-files-failed",369827780)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"data","data",-232669377),new cljs.core.Keyword(null,"map","map",1371690461)], null)], null));

/**
 * file-sync events
 * Malli-schema:
 * [:map
 *  [:event
 *   [:enum
 * :created-local-version-file
 * :finished-local->remote
 * :finished-remote->local
 * :start
 * :pause
 * :resume
 * :exception-decrypt-failed
 * :remote->local-full-sync-failed
 * :local->remote-full-sync-failed
 * :get-remote-graph-failed
 * :get-deletion-logs-failed
 * :get-remote-all-files-failed]]
 *  [:data :map]]
 */
frontend.pubsub.sync_events_ch = (function (){var ch__76302__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(cljs.core.async.sliding_buffer((10)));
return (new frontend.pubsub.t_frontend$pubsub76362(ch__76302__auto__,null));
})();

/**
 * file-sync events
 * Malli-schema:
 * [:map
 *  [:event
 *   [:enum
 * :created-local-version-file
 * :finished-local->remote
 * :finished-remote->local
 * :start
 * :pause
 * :resume
 * :exception-decrypt-failed
 * :remote->local-full-sync-failed
 * :local->remote-full-sync-failed
 * :get-remote-graph-failed
 * :get-deletion-logs-failed
 * :get-remote-all-files-failed]]
 *  [:data :map]]
 */
frontend.pubsub.sync_events_pub = cljs.core.async.pub.cljs$core$IFn$_invoke$arity$2(frontend.pubsub.sync_events_ch,new cljs.core.Keyword(null,"event","event",301435442));

//# sourceMappingURL=frontend.pubsub.js.map
