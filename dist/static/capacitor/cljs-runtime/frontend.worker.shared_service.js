goog.provide('frontend.worker.shared_service');
goog.scope(function(){
  frontend.worker.shared_service.goog$module$goog$object = goog.module.get('goog.object');
});
lambdaisland.glogi.set_level(new cljs.core.Symbol(null,"frontend.worker.shared-service","frontend.worker.shared-service",924867568,null),new cljs.core.Keyword(null,"debug","debug",-1608172596));
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.shared_service !== 'undefined') && (typeof frontend.worker.shared_service._STAR_master_client_QMARK_ !== 'undefined')){
} else {
frontend.worker.shared_service._STAR_master_client_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.shared_service !== 'undefined') && (typeof frontend.worker.shared_service._STAR_master_re_check_trigger !== 'undefined')){
} else {
frontend.worker.shared_service._STAR_master_re_check_trigger = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.shared_service !== 'undefined') && (typeof frontend.worker.shared_service._STAR_common_channel !== 'undefined')){
} else {
frontend.worker.shared_service._STAR_common_channel = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.shared_service !== 'undefined') && (typeof frontend.worker.shared_service._STAR_client_channel !== 'undefined')){
} else {
frontend.worker.shared_service._STAR_client_channel = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.shared_service !== 'undefined') && (typeof frontend.worker.shared_service._STAR_master_slave_channels !== 'undefined')){
} else {
frontend.worker.shared_service._STAR_master_slave_channels = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.shared_service !== 'undefined') && (typeof frontend.worker.shared_service._STAR_common_channel_listener !== 'undefined')){
} else {
frontend.worker.shared_service._STAR_common_channel_listener = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.shared_service !== 'undefined') && (typeof frontend.worker.shared_service._STAR_client_channel_listener !== 'undefined')){
} else {
frontend.worker.shared_service._STAR_client_channel_listener = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.shared_service !== 'undefined') && (typeof frontend.worker.shared_service._STAR_current_request_id !== 'undefined')){
} else {
frontend.worker.shared_service._STAR_current_request_id = cljs.core.volatile_BANG_((0));
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.shared_service !== 'undefined') && (typeof frontend.worker.shared_service._STAR_requests_in_flight !== 'undefined')){
} else {
frontend.worker.shared_service._STAR_requests_in_flight = cljs.core.volatile_BANG_(cljs.core.sorted_map());
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.shared_service !== 'undefined') && (typeof frontend.worker.shared_service._STAR_client_id !== 'undefined')){
} else {
frontend.worker.shared_service._STAR_client_id = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof frontend !== 'undefined') && (typeof frontend.worker !== 'undefined') && (typeof frontend.worker.shared_service !== 'undefined') && (typeof frontend.worker.shared_service._STAR_master_client_lock !== 'undefined')){
} else {
frontend.worker.shared_service._STAR_master_client_lock = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
frontend.worker.shared_service.next_request_id = (function frontend$worker$shared_service$next_request_id(){
return frontend.worker.shared_service._STAR_current_request_id.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,(frontend.worker.shared_service._STAR_current_request_id.cljs$core$IDeref$_deref$arity$1(null) + (1)));
});
frontend.worker.shared_service.release_master_client_lock_BANG_ = (function frontend$worker$shared_service$release_master_client_lock_BANG_(){
var temp__5804__auto__ = cljs.core.deref(frontend.worker.shared_service._STAR_master_client_lock);
if(cljs.core.truth_(temp__5804__auto__)){
var d = temp__5804__auto__;
promesa.core.resolve_BANG_.cljs$core$IFn$_invoke$arity$1(d);

return null;
} else {
return null;
}
});
frontend.worker.shared_service.get_broadcast_channel_name = (function frontend$worker$shared_service$get_broadcast_channel_name(client_id,service_name){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(client_id),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(service_name)].join('');
});
frontend.worker.shared_service.random_id = (function frontend$worker$shared_service$random_id(){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.random_uuid());
});
frontend.worker.shared_service.do_not_wait = (function frontend$worker$shared_service$do_not_wait(promise){

return null;
});
frontend.worker.shared_service._LT_get_client_id = (function frontend$worker$shared_service$_LT_get_client_id(){
var id = frontend.worker.shared_service.random_id();
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(navigator.locks.request(id,({"mode": "exclusive"}),(function (_){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(navigator.locks.query()),(function (locks){
return promesa.protocols._promise(cljs.core.some((function (p1__130529_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__130529_SHARP_.name,id)){
return p1__130529_SHARP_;
} else {
return null;
}
}),locks.held).clientId);
}));
}));
}))),(function (client_id){
return promesa.protocols._mcat(promesa.protocols._promise((((!((client_id == null))))?null:(function(){throw (new Error("Assert failed: (some? client-id)"))})())),(function (___48186__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.shared_service.do_not_wait(navigator.locks.request(client_id,({"mode": "exclusive"}),(function (_){
return promesa.core.deferred();
})))),(function (___48186__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.shared-service",new cljs.core.Keyword(null,"debug","debug",-1608172596),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"client-id","client-id",-464622140),client_id,new cljs.core.Keyword(null,"line","line",212345235),74], null)),null)),(function (___48186__auto____$2){
return promesa.protocols._promise(client_id);
}));
}));
}));
}));
}));
});
frontend.worker.shared_service._LT_ensure_client_id = (function frontend$worker$shared_service$_LT_ensure_client_id(){
var or__5002__auto__ = cljs.core.deref(frontend.worker.shared_service._STAR_client_id);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.shared_service._LT_get_client_id()),(function (client_id){
return promesa.protocols._promise(cljs.core.reset_BANG_(frontend.worker.shared_service._STAR_client_id,client_id));
}));
}));
}
});
frontend.worker.shared_service.ensure_common_channel = (function frontend$worker$shared_service$ensure_common_channel(service_name){
var or__5002__auto__ = cljs.core.deref(frontend.worker.shared_service._STAR_common_channel);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.reset_BANG_(frontend.worker.shared_service._STAR_common_channel,(new BroadcastChannel(["shared-service-common-channel-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(service_name)].join(''))));
}
});
frontend.worker.shared_service.ensure_client_channel = (function frontend$worker$shared_service$ensure_client_channel(slave_client_id,service_name){
var or__5002__auto__ = cljs.core.deref(frontend.worker.shared_service._STAR_client_channel);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.reset_BANG_(frontend.worker.shared_service._STAR_client_channel,(new BroadcastChannel(frontend.worker.shared_service.get_broadcast_channel_name(slave_client_id,service_name))));
}
});
frontend.worker.shared_service.listen_common_channel = (function frontend$worker$shared_service$listen_common_channel(common_channel,listener_fn){
var temp__5804__auto___130944 = cljs.core.deref(frontend.worker.shared_service._STAR_common_channel_listener);
if(cljs.core.truth_(temp__5804__auto___130944)){
var old_listener_130945 = temp__5804__auto___130944;
common_channel.removeEventListener("message",old_listener_130945);
} else {
}

cljs.core.reset_BANG_(frontend.worker.shared_service._STAR_common_channel_listener,listener_fn);

return common_channel.addEventListener("message",listener_fn);
});
frontend.worker.shared_service.listen_client_channel = (function frontend$worker$shared_service$listen_client_channel(client_channel,listener_fn){
var temp__5804__auto___130946 = cljs.core.deref(frontend.worker.shared_service._STAR_client_channel_listener);
if(cljs.core.truth_(temp__5804__auto___130946)){
var old_listener_130947 = temp__5804__auto___130946;
client_channel.removeEventListener("message",old_listener_130947);
} else {
}

cljs.core.reset_BANG_(frontend.worker.shared_service._STAR_client_channel_listener,listener_fn);

return client_channel.addEventListener("message",listener_fn);
});
frontend.worker.shared_service._LT_apply_target_f_BANG_ = (function frontend$worker$shared_service$_LT_apply_target_f_BANG_(target,method,args){
var f = frontend.worker.shared_service.goog$module$goog$object.get(target,method);
if((!((f == null)))){
} else {
throw (new Error(["Assert failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"method","method",55703592),method], null)),"\n","(some? f)"].join('')));
}

return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,args);
});
/**
 * Check if the current client is the master (otherwise, it is a slave)
 */
frontend.worker.shared_service._LT_check_master_or_slave_client_BANG_ = (function frontend$worker$shared_service$_LT_check_master_or_slave_client_BANG_(service_name,_LT_on_become_master,_LT_on_become_slave){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.shared_service._LT_ensure_client_id()),(function (client_id){
return promesa.protocols._promise(frontend.worker.shared_service.do_not_wait(navigator.locks.request(service_name,({"mode": "exclusive", "ifAvailable": true}),(function (lock){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(navigator.locks.query()),(function (locks){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.some((function (p1__130605_SHARP_){
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__130605_SHARP_.name,service_name)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__130605_SHARP_.clientId,client_id)))){
return true;
} else {
return null;
}
}),locks.held)),(function (locked_QMARK_){
return promesa.protocols._promise((cljs.core.truth_((function (){var and__5000__auto__ = locked_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return lock;
} else {
return and__5000__auto__;
}
})())?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48196__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(frontend.worker.shared_service._STAR_master_client_QMARK_,true)),(function (___48186__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((_LT_on_become_master.cljs$core$IFn$_invoke$arity$0 ? _LT_on_become_master.cljs$core$IFn$_invoke$arity$0() : _LT_on_become_master.call(null))),(function (___48186__auto____$1){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(frontend.worker.shared_service._STAR_master_client_lock,promesa.core.deferred())),(function (___48186__auto____$2){
return promesa.protocols._promise(cljs.core.deref(frontend.worker.shared_service._STAR_master_client_lock));
}));
}));
}));
})):(cljs.core.truth_((function (){var and__5000__auto__ = locked_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (lock == null);
} else {
return and__5000__auto__;
}
})())?((cljs.core.deref(frontend.worker.shared_service._STAR_master_client_QMARK_) === true)?null:(function(){throw (new Error("Assert failed: (true? (clojure.core/deref *master-client?))"))})()):((cljs.core.not(locked_QMARK_))?promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48196__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.reset_BANG_(frontend.worker.shared_service._STAR_master_client_QMARK_,false)),(function (___48186__auto__){
return promesa.protocols._promise((_LT_on_become_slave.cljs$core$IFn$_invoke$arity$0 ? _LT_on_become_slave.cljs$core$IFn$_invoke$arity$0() : _LT_on_become_slave.call(null)));
}));
})):null))));
}));
}));
}));
}))));
}));
}));
});
frontend.worker.shared_service.clear_old_service_BANG_ = (function frontend$worker$shared_service$clear_old_service_BANG_(){
frontend.worker.shared_service.release_master_client_lock_BANG_();

cljs.core.reset_BANG_(frontend.worker.shared_service._STAR_master_client_QMARK_,false);

var channels_130959 = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.shared_service._STAR_master_slave_channels),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.deref(frontend.worker.shared_service._STAR_common_channel),cljs.core.deref(frontend.worker.shared_service._STAR_client_channel)], null));
var seq__130649_130963 = cljs.core.seq(channels_130959);
var chunk__130650_130964 = null;
var count__130651_130965 = (0);
var i__130652_130966 = (0);
while(true){
if((i__130652_130966 < count__130651_130965)){
var channel_130967 = chunk__130650_130964.cljs$core$IIndexed$_nth$arity$2(null,i__130652_130966);
if(cljs.core.truth_(channel_130967)){
channel_130967.close();
} else {
}


var G__130969 = seq__130649_130963;
var G__130970 = chunk__130650_130964;
var G__130971 = count__130651_130965;
var G__130972 = (i__130652_130966 + (1));
seq__130649_130963 = G__130969;
chunk__130650_130964 = G__130970;
count__130651_130965 = G__130971;
i__130652_130966 = G__130972;
continue;
} else {
var temp__5804__auto___130973 = cljs.core.seq(seq__130649_130963);
if(temp__5804__auto___130973){
var seq__130649_130977__$1 = temp__5804__auto___130973;
if(cljs.core.chunked_seq_QMARK_(seq__130649_130977__$1)){
var c__5525__auto___130978 = cljs.core.chunk_first(seq__130649_130977__$1);
var G__130979 = cljs.core.chunk_rest(seq__130649_130977__$1);
var G__130980 = c__5525__auto___130978;
var G__130981 = cljs.core.count(c__5525__auto___130978);
var G__130982 = (0);
seq__130649_130963 = G__130979;
chunk__130650_130964 = G__130980;
count__130651_130965 = G__130981;
i__130652_130966 = G__130982;
continue;
} else {
var channel_130983 = cljs.core.first(seq__130649_130977__$1);
if(cljs.core.truth_(channel_130983)){
channel_130983.close();
} else {
}


var G__130984 = cljs.core.next(seq__130649_130977__$1);
var G__130985 = null;
var G__130986 = (0);
var G__130987 = (0);
seq__130649_130963 = G__130984;
chunk__130650_130964 = G__130985;
count__130651_130965 = G__130986;
i__130652_130966 = G__130987;
continue;
}
} else {
}
}
break;
}

cljs.core.reset_BANG_(frontend.worker.shared_service._STAR_common_channel,null);

cljs.core.reset_BANG_(frontend.worker.shared_service._STAR_client_channel,null);

cljs.core.reset_BANG_(frontend.worker.shared_service._STAR_master_slave_channels,cljs.core.PersistentHashSet.EMPTY);

cljs.core.reset_BANG_(frontend.worker.shared_service._STAR_common_channel_listener,null);

cljs.core.reset_BANG_(frontend.worker.shared_service._STAR_client_channel_listener,null);

cljs.core.vreset_BANG_(frontend.worker.shared_service._STAR_requests_in_flight,cljs.core.sorted_map());

return cljs.core.remove_watch(frontend.worker.shared_service._STAR_master_re_check_trigger,new cljs.core.Keyword(null,"check-master","check-master",-252155357));
});
frontend.worker.shared_service.on_response_handler = (function frontend$worker$shared_service$on_response_handler(event){
var map__130708 = cljs_bean.core.__GT_clj(event.data);
var map__130708__$1 = cljs.core.__destructure_map(map__130708);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130708__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130708__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var error = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130708__$1,new cljs.core.Keyword(null,"error","error",-978969032));
var result = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130708__$1,new cljs.core.Keyword(null,"result","result",1415092211));
if(("response" === type)){
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(frontend.worker.shared_service._STAR_requests_in_flight),id);
if(cljs.core.truth_(temp__5804__auto__)){
var map__130718 = temp__5804__auto__;
var map__130718__$1 = cljs.core.__destructure_map(map__130718);
var resolve_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130718__$1,new cljs.core.Keyword(null,"resolve-fn","resolve-fn",1786243756));
var reject_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130718__$1,new cljs.core.Keyword(null,"reject-fn","reject-fn",1456870982));
frontend.worker.shared_service._STAR_requests_in_flight.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(frontend.worker.shared_service._STAR_requests_in_flight.cljs$core$IDeref$_deref$arity$1(null),id));

if(cljs.core.truth_(error)){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.shared-service",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"error-process-request","error-process-request",225887164),error,new cljs.core.Keyword(null,"line","line",212345235),166], null)),null);

return (reject_fn.cljs$core$IFn$_invoke$arity$1 ? reject_fn.cljs$core$IFn$_invoke$arity$1(error) : reject_fn.call(null,error));
} else {
return (resolve_fn.cljs$core$IFn$_invoke$arity$1 ? resolve_fn.cljs$core$IFn$_invoke$arity$1(result) : resolve_fn.call(null,result));
}
} else {
return null;
}
} else {
return null;
}
});
frontend.worker.shared_service.create_on_request_handler = (function frontend$worker$shared_service$create_on_request_handler(client_channel,target){
return (function (event){
var map__130728 = cljs_bean.core.__GT_clj(event.data);
var map__130728__$1 = cljs.core.__destructure_map(map__130728);
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130728__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var method = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130728__$1,new cljs.core.Keyword(null,"method","method",55703592));
var args = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130728__$1,new cljs.core.Keyword(null,"args","args",1315556576));
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130728__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
if(("request" === type)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.core.then.cljs$core$IFn$_invoke$arity$2(frontend.worker.shared_service._LT_apply_target_f_BANG_(target,method,args),(function (res){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [res,null], null);
})),(function (e){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [null,(((e instanceof Error))?cljs_bean.core.__GT_clj(e):e)], null);
}))),(function (p__130738){
var vec__130739 = p__130738;
var result = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130739,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130739,(1),null);
return promesa.protocols._promise(client_channel.postMessage(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"type","type",1174270348),"response",new cljs.core.Keyword(null,"result","result",1415092211),result,new cljs.core.Keyword(null,"error","error",-978969032),error,new cljs.core.Keyword(null,"method-key","method-key",-1342880157),cljs.core.first(args)], null))));
}));
}));
} else {
return null;
}
});
});
frontend.worker.shared_service._LT_slave_registered_handler = (function frontend$worker$shared_service$_LT_slave_registered_handler(service_name,slave_client_id,event,_STAR_register_finish_promise_QMARK_){
var slave_client_id_STAR_ = new cljs.core.Keyword(null,"slave-client-id","slave-client-id",1828329663).cljs$core$IFn$_invoke$arity$1(event);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(slave_client_id,slave_client_id_STAR_)){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(navigator.locks.query()),(function (locks){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.some((function (l){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(service_name,l.name)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(slave_client_id,l.clientId)));
}),locks.pending)),(function (already_watching_QMARK_){
return promesa.protocols._mcat(promesa.protocols._promise((cljs.core.truth_(already_watching_QMARK_)?null:frontend.worker.shared_service.do_not_wait(navigator.locks.request(service_name,({"mode": "exclusive"}),(function (_lock){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.shared-service",new cljs.core.Keyword(null,"debug","debug",-1608172596),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, ["master has gone",null,new cljs.core.Keyword(null,"line","line",212345235),204], null)),null);

return cljs.core.reset_BANG_(frontend.worker.shared_service._STAR_master_re_check_trigger,new cljs.core.Keyword(null,"re-check","re-check",-1662695686));
}))))),(function (___48186__auto__){
return promesa.protocols._promise(promesa.core.resolve_BANG_.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(_STAR_register_finish_promise_QMARK_)));
}));
}));
}));
}));
} else {
return null;
}
});
frontend.worker.shared_service._LT_re_requests_in_flight_on_slave_BANG_ = (function frontend$worker$shared_service$_LT_re_requests_in_flight_on_slave_BANG_(client_channel){
if(cljs.core.seq(cljs.core.deref(frontend.worker.shared_service._STAR_requests_in_flight))){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.shared-service",new cljs.core.Keyword(null,"debug","debug",-1608172596),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, ["Requests were in flight when master changed. Requeuing...",cljs.core.count(cljs.core.deref(frontend.worker.shared_service._STAR_requests_in_flight)),new cljs.core.Keyword(null,"line","line",212345235),211], null)),null);

return promesa.core.run_BANG_.cljs$core$IFn$_invoke$arity$2((function (p__130771){
var vec__130772 = p__130771;
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130772,(0),null);
var map__130775 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130772,(1),null);
var map__130775__$1 = cljs.core.__destructure_map(map__130775);
var method = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130775__$1,new cljs.core.Keyword(null,"method","method",55703592));
var args = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130775__$1,new cljs.core.Keyword(null,"args","args",1315556576));
var _resolve_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130775__$1,new cljs.core.Keyword(null,"_resolve-fn","_resolve-fn",-29909245));
var _reject_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130775__$1,new cljs.core.Keyword(null,"_reject-fn","_reject-fn",1963381508));
return client_channel.postMessage(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"type","type",1174270348),"request",new cljs.core.Keyword(null,"method","method",55703592),method,new cljs.core.Keyword(null,"args","args",1315556576),args], null)));
}),cljs.core.deref(frontend.worker.shared_service._STAR_requests_in_flight));
} else {
return null;
}
});
frontend.worker.shared_service._LT_re_requests_in_flight_on_master_BANG_ = (function frontend$worker$shared_service$_LT_re_requests_in_flight_on_master_BANG_(target){
if(cljs.core.seq(cljs.core.deref(frontend.worker.shared_service._STAR_requests_in_flight))){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.shared-service",new cljs.core.Keyword(null,"debug","debug",-1608172596),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, ["Requests were in flight when tab became master. Requeuing...",cljs.core.count(cljs.core.deref(frontend.worker.shared_service._STAR_requests_in_flight)),new cljs.core.Keyword(null,"line","line",212345235),224], null)),null);

return promesa.core.run_BANG_.cljs$core$IFn$_invoke$arity$2((function (p__130781){
var vec__130783 = p__130781;
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130783,(0),null);
var map__130786 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__130783,(1),null);
var map__130786__$1 = cljs.core.__destructure_map(map__130786);
var method = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130786__$1,new cljs.core.Keyword(null,"method","method",55703592));
var args = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130786__$1,new cljs.core.Keyword(null,"args","args",1315556576));
var resolve_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130786__$1,new cljs.core.Keyword(null,"resolve-fn","resolve-fn",1786243756));
var reject_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130786__$1,new cljs.core.Keyword(null,"reject-fn","reject-fn",1456870982));
return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.shared_service._LT_apply_target_f_BANG_(target,method,args)),(function (result){
return promesa.protocols._promise((resolve_fn.cljs$core$IFn$_invoke$arity$1 ? resolve_fn.cljs$core$IFn$_invoke$arity$1(result) : resolve_fn.call(null,result)));
}));
})),(function (e){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.shared-service",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, ["Error processing request",e,new cljs.core.Keyword(null,"line","line",212345235),233], null)),null);

return (reject_fn.cljs$core$IFn$_invoke$arity$1 ? reject_fn.cljs$core$IFn$_invoke$arity$1(e) : reject_fn.call(null,e));
})),(function (){
return frontend.worker.shared_service._STAR_requests_in_flight.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(frontend.worker.shared_service._STAR_requests_in_flight.cljs$core$IDeref$_deref$arity$1(null),id));
}));
}),cljs.core.deref(frontend.worker.shared_service._STAR_requests_in_flight));
} else {
return null;
}
});
frontend.worker.shared_service._LT_on_become_slave = (function frontend$worker$shared_service$_LT_on_become_slave(slave_client_id,service_name,common_channel,broadcast_data_types,status_ready_promise){
var client_channel = frontend.worker.shared_service.ensure_client_channel(slave_client_id,service_name);
var _STAR_register_finish_promise_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var _LT_register = (function (){
common_channel.postMessage(({"type": "slave-register", "slave-client-id": slave_client_id}));

cljs.core.reset_BANG_(_STAR_register_finish_promise_QMARK_,promesa.core.deferred());

return cljs.core.deref(_STAR_register_finish_promise_QMARK_);
});
frontend.worker.shared_service.listen_client_channel(client_channel,frontend.worker.shared_service.on_response_handler);

frontend.worker.shared_service.listen_common_channel(common_channel,(function (event){
var map__130810 = cljs_bean.core.__GT_clj(event.data);
var map__130810__$1 = cljs.core.__destructure_map(map__130810);
var event_STAR_ = map__130810__$1;
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130810__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130810__$1,new cljs.core.Keyword(null,"data","data",-232669377));
if(cljs.core.contains_QMARK_(broadcast_data_types,type)){
return self.postMessage(data);
} else {
var G__130822 = type;
switch (G__130822) {
case "master-changed":
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48196__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.shared-service",new cljs.core.Keyword(null,"debug","debug",-1608172596),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, ["master-client change detected. Re-registering...",null,new cljs.core.Keyword(null,"line","line",212345235),256], null)),null)),(function (___48186__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(_LT_register()),(function (___48186__auto____$1){
return promesa.protocols._promise(frontend.worker.shared_service._LT_re_requests_in_flight_on_slave_BANG_(client_channel));
}));
}));
}));

break;
case "slave-registered":
return frontend.worker.shared_service._LT_slave_registered_handler(service_name,slave_client_id,event_STAR_,_STAR_register_finish_promise_QMARK_);

break;
case "slave-register":
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.shared-service",new cljs.core.Keyword(null,"debug","debug",-1608172596),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ignored-event","ignored-event",36065610),event_STAR_,new cljs.core.Keyword(null,"line","line",212345235),263], null)),null);

break;
default:
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.shared-service",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"unknown-event","unknown-event",1876631834),event_STAR_,new cljs.core.Keyword(null,"line","line",212345235),265], null)),null);

}
}
}));

return promesa.core.catch$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48196__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(_LT_register()),(function (___48186__auto__){
return promesa.protocols._promise(promesa.core.resolve_BANG_.cljs$core$IFn$_invoke$arity$1(status_ready_promise));
}));
})),(function (e){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.shared-service",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-become-slave","on-become-slave",1548344173),e,new cljs.core.Keyword(null,"line","line",212345235),271], null)),null);

return promesa.core.rejected(e);
}));
});
frontend.worker.shared_service._LT_on_become_master = (function frontend$worker$shared_service$_LT_on_become_master(master_client_id,service_name,common_channel,target,on_become_master_handler,status_ready_deferred_p){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.shared-service",new cljs.core.Keyword(null,"debug","debug",-1608172596),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"become-master","become-master",-1839192902),master_client_id,new cljs.core.Keyword(null,"service","service",-1963054559),service_name,new cljs.core.Keyword(null,"line","line",212345235),276], null)),null);

frontend.worker.shared_service.listen_common_channel(common_channel,(function (event){
var map__130854 = cljs_bean.core.__GT_clj(event.data);
var map__130854__$1 = cljs.core.__destructure_map(map__130854);
var slave_client_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130854__$1,new cljs.core.Keyword(null,"slave-client-id","slave-client-id",1828329663));
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130854__$1,new cljs.core.Keyword(null,"type","type",1174270348));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,"slave-register")){
var client_channel = (new BroadcastChannel(frontend.worker.shared_service.get_broadcast_channel_name(slave_client_id,service_name)));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(frontend.worker.shared_service._STAR_master_slave_channels,cljs.core.conj,client_channel);

frontend.worker.shared_service.do_not_wait(navigator.locks.request(slave_client_id,({"mode": "exclusive"}),(function (_){
lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.shared-service",new cljs.core.Keyword(null,"debug","debug",-1608172596),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"slave-has-gone","slave-has-gone",1903296848),slave_client_id,new cljs.core.Keyword(null,"line","line",212345235),287], null)),null);

return client_channel.close();
})));

frontend.worker.shared_service.listen_client_channel(client_channel,frontend.worker.shared_service.create_on_request_handler(client_channel,target));

return common_channel.postMessage(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),"slave-registered",new cljs.core.Keyword(null,"slave-client-id","slave-client-id",1828329663),slave_client_id,new cljs.core.Keyword(null,"master-client-id","master-client-id",-943136361),master_client_id,new cljs.core.Keyword(null,"serviceName","serviceName",1598755002),service_name], null)));
} else {
return null;
}
}));

common_channel.postMessage(({"type": "master-changed", "master-client-id": master_client_id, "serviceName": service_name}));

return promesa.core.finally$.cljs$core$IFn$_invoke$arity$2(promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48196__auto__){
return promesa.protocols._mcat(promesa.protocols._promise((on_become_master_handler.cljs$core$IFn$_invoke$arity$1 ? on_become_master_handler.cljs$core$IFn$_invoke$arity$1(service_name) : on_become_master_handler.call(null,service_name))),(function (___48186__auto__){
return promesa.protocols._promise(frontend.worker.shared_service._LT_re_requests_in_flight_on_master_BANG_(target));
}));
})),(function (){
return promesa.core.resolve_BANG_.cljs$core$IFn$_invoke$arity$1(status_ready_deferred_p);
}));
});
/**
 * broadcast-data-types - For data matching these types,
 *                        forward the data broadcast from the master client directly to the UI thread.
 */
frontend.worker.shared_service._LT_create_service = (function frontend$worker$shared_service$_LT_create_service(service_name,target,on_become_master_handler,broadcast_data_types,p__130867){
var map__130868 = p__130867;
var map__130868__$1 = cljs.core.__destructure_map(map__130868);
var import_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__130868__$1,new cljs.core.Keyword(null,"import?","import?",-40157302));
frontend.worker.shared_service.clear_old_service_BANG_();

if(cljs.core.truth_(import_QMARK_)){
cljs.core.reset_BANG_(frontend.worker.shared_service._STAR_master_client_QMARK_,true);
} else {
}

return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48218__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.set(broadcast_data_types)),(function (broadcast_data_types__$1){
return promesa.protocols._mcat(promesa.protocols._promise(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ready","ready",1086465795),promesa.core.deferred()], null)),(function (status){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.shared_service.ensure_common_channel(service_name)),(function (common_channel){
return promesa.protocols._mcat(promesa.protocols._promise(frontend.worker.shared_service._LT_ensure_client_id()),(function (client_id){
return promesa.protocols._mcat(promesa.protocols._promise((function (){
return frontend.worker.shared_service._LT_check_master_or_slave_client_BANG_(service_name,(function (){
return frontend.worker.shared_service._LT_on_become_master(client_id,service_name,common_channel,target,on_become_master_handler,new cljs.core.Keyword(null,"ready","ready",1086465795).cljs$core$IFn$_invoke$arity$1(status));
}),(function (){
return frontend.worker.shared_service._LT_on_become_slave(client_id,service_name,common_channel,broadcast_data_types__$1,new cljs.core.Keyword(null,"ready","ready",1086465795).cljs$core$IFn$_invoke$arity$1(status));
}));
})),(function (_LT_check_master_slave_fn_BANG_){
return promesa.protocols._mcat(promesa.protocols._promise((_LT_check_master_slave_fn_BANG_.cljs$core$IFn$_invoke$arity$0 ? _LT_check_master_slave_fn_BANG_.cljs$core$IFn$_invoke$arity$0() : _LT_check_master_slave_fn_BANG_.call(null))),(function (___48186__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(cljs.core.add_watch(frontend.worker.shared_service._STAR_master_re_check_trigger,new cljs.core.Keyword(null,"check-master","check-master",-252155357),(function (_,___$1,___$2,new_value){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new_value,new cljs.core.Keyword(null,"re-check","re-check",-1662695686))){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___48196__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(promesa.core.delay.cljs$core$IFn$_invoke$arity$1((100))),(function (___48186__auto____$1){
return promesa.protocols._promise((_LT_check_master_slave_fn_BANG_.cljs$core$IFn$_invoke$arity$0 ? _LT_check_master_slave_fn_BANG_.cljs$core$IFn$_invoke$arity$0() : _LT_check_master_slave_fn_BANG_.call(null)));
}));
}));
} else {
return null;
}
}))),(function (___48186__auto____$1){
return promesa.protocols._promise(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"proxy","proxy",-117453614),(new Proxy(target,({"get": (function (target__$1,method){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("remoteInvoke",method)){
return (function (args){
if(cljs.core.truth_(cljs.core.deref(frontend.worker.shared_service._STAR_master_client_QMARK_))){
return frontend.worker.shared_service._LT_apply_target_f_BANG_(target__$1,method,args);
} else {
var request_id = frontend.worker.shared_service.next_request_id();
var client_channel = frontend.worker.shared_service.ensure_client_channel(client_id,service_name);
return promesa.core.create.cljs$core$IFn$_invoke$arity$1((function (resolve_fn,reject_fn){
frontend.worker.shared_service._STAR_requests_in_flight.cljs$core$IVolatile$_vreset_BANG_$arity$2(null,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(frontend.worker.shared_service._STAR_requests_in_flight.cljs$core$IDeref$_deref$arity$1(null),request_id,new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"method","method",55703592),method,new cljs.core.Keyword(null,"args","args",1315556576),args,new cljs.core.Keyword(null,"resolve-fn","resolve-fn",1786243756),resolve_fn,new cljs.core.Keyword(null,"reject-fn","reject-fn",1456870982),reject_fn], null)));

return client_channel.postMessage(cljs_bean.core.__GT_js(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),request_id,new cljs.core.Keyword(null,"type","type",1174270348),"request",new cljs.core.Keyword(null,"method","method",55703592),method,new cljs.core.Keyword(null,"args","args",1315556576),args], null)));
}));

}
});
} else {
return lambdaisland.glogi.log.cljs$core$IFn$_invoke$arity$4("frontend.worker.shared-service",new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.identity(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"invalid-invoke-method","invalid-invoke-method",-1943487477),method,new cljs.core.Keyword(null,"line","line",212345235),355], null)),null);
}
})}))),new cljs.core.Keyword(null,"status","status",-1997798413),status], null));
}));
}));
}));
}));
}));
}));
}));
}));
});
frontend.worker.shared_service.broadcast_to_clients_BANG_ = (function frontend$worker$shared_service$broadcast_to_clients_BANG_(type_SINGLEQUOTE_,data){
var transit_payload = logseq.db.write_transit_str(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [type_SINGLEQUOTE_,data], null));
if((typeof self !== 'undefined')){
self.postMessage(transit_payload);
} else {
}

var temp__5804__auto__ = cljs.core.deref(frontend.worker.shared_service._STAR_common_channel);
if(cljs.core.truth_(temp__5804__auto__)){
var common_channel = temp__5804__auto__;
var str_type_SINGLEQUOTE_ = logseq.common.util.keyword__GT_string(type_SINGLEQUOTE_);
return common_channel.postMessage(({"type": str_type_SINGLEQUOTE_, "data": transit_payload}));
} else {
return null;
}
});

//# sourceMappingURL=frontend.worker.shared_service.js.map
