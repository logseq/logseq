goog.provide('shadow.remote.runtime.shared');
shadow.remote.runtime.shared.init_state = (function shadow$remote$runtime$shared$init_state(client_info){
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"extensions","extensions",-1103629196),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"ops","ops",1237330063),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"client-info","client-info",1958982504),client_info,new cljs.core.Keyword(null,"call-id-seq","call-id-seq",-1679248218),(0),new cljs.core.Keyword(null,"call-handlers","call-handlers",386605551),cljs.core.PersistentArrayMap.EMPTY], null);
});
shadow.remote.runtime.shared.now = (function shadow$remote$runtime$shared$now(){
return Date.now();
});
shadow.remote.runtime.shared.get_client_id = (function shadow$remote$runtime$shared$get_client_id(p__37101){
var map__37102 = p__37101;
var map__37102__$1 = cljs.core.__destructure_map(map__37102);
var runtime = map__37102__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37102__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var or__5002__auto__ = new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("runtime has no assigned runtime-id",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"runtime","runtime",-1331573996),runtime], null));
}
});
shadow.remote.runtime.shared.relay_msg = (function shadow$remote$runtime$shared$relay_msg(runtime,msg){
var self_id_37186 = shadow.remote.runtime.shared.get_client_id(runtime);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"to","to",192099007).cljs$core$IFn$_invoke$arity$1(msg),self_id_37186)){
shadow.remote.runtime.api.relay_msg(runtime,msg);
} else {
Promise.resolve((1)).then((function (){
var G__37105 = runtime;
var G__37106 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(msg,new cljs.core.Keyword(null,"from","from",1815293044),self_id_37186);
return (shadow.remote.runtime.shared.process.cljs$core$IFn$_invoke$arity$2 ? shadow.remote.runtime.shared.process.cljs$core$IFn$_invoke$arity$2(G__37105,G__37106) : shadow.remote.runtime.shared.process.call(null,G__37105,G__37106));
}));
}

return msg;
});
shadow.remote.runtime.shared.reply = (function shadow$remote$runtime$shared$reply(runtime,p__37108,res){
var map__37109 = p__37108;
var map__37109__$1 = cljs.core.__destructure_map(map__37109);
var call_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37109__$1,new cljs.core.Keyword(null,"call-id","call-id",1043012968));
var from = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37109__$1,new cljs.core.Keyword(null,"from","from",1815293044));
var res__$1 = (function (){var G__37110 = res;
var G__37110__$1 = (cljs.core.truth_(call_id)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__37110,new cljs.core.Keyword(null,"call-id","call-id",1043012968),call_id):G__37110);
if(cljs.core.truth_(from)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__37110__$1,new cljs.core.Keyword(null,"to","to",192099007),from);
} else {
return G__37110__$1;
}
})();
return shadow.remote.runtime.api.relay_msg(runtime,res__$1);
});
shadow.remote.runtime.shared.call = (function shadow$remote$runtime$shared$call(var_args){
var G__37114 = arguments.length;
switch (G__37114) {
case 3:
return shadow.remote.runtime.shared.call.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return shadow.remote.runtime.shared.call.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.remote.runtime.shared.call.cljs$core$IFn$_invoke$arity$3 = (function (runtime,msg,handlers){
return shadow.remote.runtime.shared.call.cljs$core$IFn$_invoke$arity$4(runtime,msg,handlers,(0));
}));

(shadow.remote.runtime.shared.call.cljs$core$IFn$_invoke$arity$4 = (function (p__37116,msg,handlers,timeout_after_ms){
var map__37117 = p__37116;
var map__37117__$1 = cljs.core.__destructure_map(map__37117);
var runtime = map__37117__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37117__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
if(cljs.core.map_QMARK_(msg)){
} else {
throw (new Error("Assert failed: (map? msg)"));
}

if(cljs.core.map_QMARK_(handlers)){
} else {
throw (new Error("Assert failed: (map? handlers)"));
}

if(cljs.core.nat_int_QMARK_(timeout_after_ms)){
} else {
throw (new Error("Assert failed: (nat-int? timeout-after-ms)"));
}

var call_id = new cljs.core.Keyword(null,"call-id-seq","call-id-seq",-1679248218).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(state_ref,cljs.core.update,new cljs.core.Keyword(null,"call-id-seq","call-id-seq",-1679248218),cljs.core.inc);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(state_ref,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"call-handlers","call-handlers",386605551),call_id], null),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"handlers","handlers",79528781),handlers,new cljs.core.Keyword(null,"called-at","called-at",607081160),shadow.remote.runtime.shared.now(),new cljs.core.Keyword(null,"msg","msg",-1386103444),msg,new cljs.core.Keyword(null,"timeout","timeout",-318625318),timeout_after_ms], null));

return shadow.remote.runtime.api.relay_msg(runtime,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(msg,new cljs.core.Keyword(null,"call-id","call-id",1043012968),call_id));
}));

(shadow.remote.runtime.shared.call.cljs$lang$maxFixedArity = 4);

shadow.remote.runtime.shared.trigger_BANG_ = (function shadow$remote$runtime$shared$trigger_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___37254 = arguments.length;
var i__5727__auto___37255 = (0);
while(true){
if((i__5727__auto___37255 < len__5726__auto___37254)){
args__5732__auto__.push((arguments[i__5727__auto___37255]));

var G__37257 = (i__5727__auto___37255 + (1));
i__5727__auto___37255 = G__37257;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return shadow.remote.runtime.shared.trigger_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(shadow.remote.runtime.shared.trigger_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (p__37125,ev,args){
var map__37126 = p__37125;
var map__37126__$1 = cljs.core.__destructure_map(map__37126);
var runtime = map__37126__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37126__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var seq__37127 = cljs.core.seq(cljs.core.vals(new cljs.core.Keyword(null,"extensions","extensions",-1103629196).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref))));
var chunk__37130 = null;
var count__37131 = (0);
var i__37132 = (0);
while(true){
if((i__37132 < count__37131)){
var ext = chunk__37130.cljs$core$IIndexed$_nth$arity$2(null,i__37132);
var ev_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(ext,ev);
if(cljs.core.truth_(ev_fn)){
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(ev_fn,args);


var G__37282 = seq__37127;
var G__37283 = chunk__37130;
var G__37284 = count__37131;
var G__37285 = (i__37132 + (1));
seq__37127 = G__37282;
chunk__37130 = G__37283;
count__37131 = G__37284;
i__37132 = G__37285;
continue;
} else {
var G__37289 = seq__37127;
var G__37290 = chunk__37130;
var G__37291 = count__37131;
var G__37292 = (i__37132 + (1));
seq__37127 = G__37289;
chunk__37130 = G__37290;
count__37131 = G__37291;
i__37132 = G__37292;
continue;
}
} else {
var temp__5804__auto__ = cljs.core.seq(seq__37127);
if(temp__5804__auto__){
var seq__37127__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__37127__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__37127__$1);
var G__37300 = cljs.core.chunk_rest(seq__37127__$1);
var G__37301 = c__5525__auto__;
var G__37302 = cljs.core.count(c__5525__auto__);
var G__37303 = (0);
seq__37127 = G__37300;
chunk__37130 = G__37301;
count__37131 = G__37302;
i__37132 = G__37303;
continue;
} else {
var ext = cljs.core.first(seq__37127__$1);
var ev_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(ext,ev);
if(cljs.core.truth_(ev_fn)){
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(ev_fn,args);


var G__37304 = cljs.core.next(seq__37127__$1);
var G__37305 = null;
var G__37306 = (0);
var G__37307 = (0);
seq__37127 = G__37304;
chunk__37130 = G__37305;
count__37131 = G__37306;
i__37132 = G__37307;
continue;
} else {
var G__37308 = cljs.core.next(seq__37127__$1);
var G__37309 = null;
var G__37310 = (0);
var G__37311 = (0);
seq__37127 = G__37308;
chunk__37130 = G__37309;
count__37131 = G__37310;
i__37132 = G__37311;
continue;
}
}
} else {
return null;
}
}
break;
}
}));

(shadow.remote.runtime.shared.trigger_BANG_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(shadow.remote.runtime.shared.trigger_BANG_.cljs$lang$applyTo = (function (seq37122){
var G__37123 = cljs.core.first(seq37122);
var seq37122__$1 = cljs.core.next(seq37122);
var G__37124 = cljs.core.first(seq37122__$1);
var seq37122__$2 = cljs.core.next(seq37122__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__37123,G__37124,seq37122__$2);
}));

shadow.remote.runtime.shared.welcome = (function shadow$remote$runtime$shared$welcome(p__37145,p__37146){
var map__37147 = p__37145;
var map__37147__$1 = cljs.core.__destructure_map(map__37147);
var runtime = map__37147__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37147__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var map__37148 = p__37146;
var map__37148__$1 = cljs.core.__destructure_map(map__37148);
var msg = map__37148__$1;
var client_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37148__$1,new cljs.core.Keyword(null,"client-id","client-id",-464622140));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(state_ref,cljs.core.assoc,new cljs.core.Keyword(null,"client-id","client-id",-464622140),client_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"welcome","welcome",-578152123),true], 0));

var map__37149 = cljs.core.deref(state_ref);
var map__37149__$1 = cljs.core.__destructure_map(map__37149);
var client_info = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37149__$1,new cljs.core.Keyword(null,"client-info","client-info",1958982504));
var extensions = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37149__$1,new cljs.core.Keyword(null,"extensions","extensions",-1103629196));
shadow.remote.runtime.shared.relay_msg(runtime,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"hello","hello",-245025397),new cljs.core.Keyword(null,"client-info","client-info",1958982504),client_info], null));

return shadow.remote.runtime.shared.trigger_BANG_(runtime,new cljs.core.Keyword(null,"on-welcome","on-welcome",1895317125));
});
shadow.remote.runtime.shared.ping = (function shadow$remote$runtime$shared$ping(runtime,msg){
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"pong","pong",-172484958)], null));
});
shadow.remote.runtime.shared.request_supported_ops = (function shadow$remote$runtime$shared$request_supported_ops(p__37150,msg){
var map__37151 = p__37150;
var map__37151__$1 = cljs.core.__destructure_map(map__37151);
var runtime = map__37151__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37151__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"supported-ops","supported-ops",337914702),new cljs.core.Keyword(null,"ops","ops",1237330063),cljs.core.disj.cljs$core$IFn$_invoke$arity$variadic(cljs.core.set(cljs.core.keys(new cljs.core.Keyword(null,"ops","ops",1237330063).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref)))),new cljs.core.Keyword(null,"welcome","welcome",-578152123),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"unknown-relay-op","unknown-relay-op",170832753),new cljs.core.Keyword(null,"unknown-op","unknown-op",1900385996),new cljs.core.Keyword(null,"request-supported-ops","request-supported-ops",-1034994502),new cljs.core.Keyword(null,"tool-disconnect","tool-disconnect",189103996)], 0))], null));
});
shadow.remote.runtime.shared.unknown_relay_op = (function shadow$remote$runtime$shared$unknown_relay_op(msg){
return console.warn("unknown-relay-op",msg);
});
shadow.remote.runtime.shared.unknown_op = (function shadow$remote$runtime$shared$unknown_op(msg){
return console.warn("unknown-op",msg);
});
shadow.remote.runtime.shared.add_extension_STAR_ = (function shadow$remote$runtime$shared$add_extension_STAR_(p__37152,key,p__37153){
var map__37154 = p__37152;
var map__37154__$1 = cljs.core.__destructure_map(map__37154);
var state = map__37154__$1;
var extensions = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37154__$1,new cljs.core.Keyword(null,"extensions","extensions",-1103629196));
var map__37155 = p__37153;
var map__37155__$1 = cljs.core.__destructure_map(map__37155);
var spec = map__37155__$1;
var ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37155__$1,new cljs.core.Keyword(null,"ops","ops",1237330063));
var transit_write_handlers = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37155__$1,new cljs.core.Keyword(null,"transit-write-handlers","transit-write-handlers",1886308716));
if(cljs.core.contains_QMARK_(extensions,key)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("extension already registered",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),key,new cljs.core.Keyword(null,"spec","spec",347520401),spec], null));
} else {
}

return cljs.core.reduce_kv((function (state__$1,op_kw,op_handler){
if(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(state__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ops","ops",1237330063),op_kw], null)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("op already registered",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),key,new cljs.core.Keyword(null,"op","op",-1882987955),op_kw], null));
} else {
}

return cljs.core.assoc_in(state__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ops","ops",1237330063),op_kw], null),op_handler);
}),cljs.core.assoc_in(state,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"extensions","extensions",-1103629196),key], null),spec),ops);
});
shadow.remote.runtime.shared.add_extension = (function shadow$remote$runtime$shared$add_extension(p__37156,key,spec){
var map__37157 = p__37156;
var map__37157__$1 = cljs.core.__destructure_map(map__37157);
var runtime = map__37157__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37157__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(state_ref,shadow.remote.runtime.shared.add_extension_STAR_,key,spec);

var temp__5808__auto___37336 = new cljs.core.Keyword(null,"on-welcome","on-welcome",1895317125).cljs$core$IFn$_invoke$arity$1(spec);
if((temp__5808__auto___37336 == null)){
} else {
var on_welcome_37338 = temp__5808__auto___37336;
if(cljs.core.truth_(new cljs.core.Keyword(null,"welcome","welcome",-578152123).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref)))){
(on_welcome_37338.cljs$core$IFn$_invoke$arity$0 ? on_welcome_37338.cljs$core$IFn$_invoke$arity$0() : on_welcome_37338.call(null));
} else {
}
}

return runtime;
});
shadow.remote.runtime.shared.add_defaults = (function shadow$remote$runtime$shared$add_defaults(runtime){
return shadow.remote.runtime.shared.add_extension(runtime,new cljs.core.Keyword("shadow.remote.runtime.shared","defaults","shadow.remote.runtime.shared/defaults",-1821257543),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ops","ops",1237330063),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"welcome","welcome",-578152123),(function (p1__37159_SHARP_){
return shadow.remote.runtime.shared.welcome(runtime,p1__37159_SHARP_);
}),new cljs.core.Keyword(null,"unknown-relay-op","unknown-relay-op",170832753),(function (p1__37160_SHARP_){
return shadow.remote.runtime.shared.unknown_relay_op(p1__37160_SHARP_);
}),new cljs.core.Keyword(null,"unknown-op","unknown-op",1900385996),(function (p1__37161_SHARP_){
return shadow.remote.runtime.shared.unknown_op(p1__37161_SHARP_);
}),new cljs.core.Keyword(null,"ping","ping",-1670114784),(function (p1__37162_SHARP_){
return shadow.remote.runtime.shared.ping(runtime,p1__37162_SHARP_);
}),new cljs.core.Keyword(null,"request-supported-ops","request-supported-ops",-1034994502),(function (p1__37163_SHARP_){
return shadow.remote.runtime.shared.request_supported_ops(runtime,p1__37163_SHARP_);
})], null)], null));
});
shadow.remote.runtime.shared.del_extension_STAR_ = (function shadow$remote$runtime$shared$del_extension_STAR_(state,key){
var ext = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"extensions","extensions",-1103629196),key], null));
if(cljs.core.not(ext)){
return state;
} else {
return cljs.core.reduce_kv((function (state__$1,op_kw,op_handler){
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(state__$1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ops","ops",1237330063)], null),cljs.core.dissoc,op_kw);
}),cljs.core.update.cljs$core$IFn$_invoke$arity$4(state,new cljs.core.Keyword(null,"extensions","extensions",-1103629196),cljs.core.dissoc,key),new cljs.core.Keyword(null,"ops","ops",1237330063).cljs$core$IFn$_invoke$arity$1(ext));
}
});
shadow.remote.runtime.shared.del_extension = (function shadow$remote$runtime$shared$del_extension(p__37164,key){
var map__37165 = p__37164;
var map__37165__$1 = cljs.core.__destructure_map(map__37165);
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37165__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(state_ref,shadow.remote.runtime.shared.del_extension_STAR_,key);
});
shadow.remote.runtime.shared.unhandled_call_result = (function shadow$remote$runtime$shared$unhandled_call_result(call_config,msg){
return console.warn("unhandled call result",msg,call_config);
});
shadow.remote.runtime.shared.unhandled_client_not_found = (function shadow$remote$runtime$shared$unhandled_client_not_found(p__37166,msg){
var map__37167 = p__37166;
var map__37167__$1 = cljs.core.__destructure_map(map__37167);
var runtime = map__37167__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37167__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
return shadow.remote.runtime.shared.trigger_BANG_.cljs$core$IFn$_invoke$arity$variadic(runtime,new cljs.core.Keyword(null,"on-client-not-found","on-client-not-found",-642452849),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([msg], 0));
});
shadow.remote.runtime.shared.reply_unknown_op = (function shadow$remote$runtime$shared$reply_unknown_op(runtime,msg){
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"unknown-op","unknown-op",1900385996),new cljs.core.Keyword(null,"msg","msg",-1386103444),msg], null));
});
shadow.remote.runtime.shared.process = (function shadow$remote$runtime$shared$process(p__37168,p__37169){
var map__37170 = p__37168;
var map__37170__$1 = cljs.core.__destructure_map(map__37170);
var runtime = map__37170__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37170__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var map__37171 = p__37169;
var map__37171__$1 = cljs.core.__destructure_map(map__37171);
var msg = map__37171__$1;
var op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37171__$1,new cljs.core.Keyword(null,"op","op",-1882987955));
var call_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37171__$1,new cljs.core.Keyword(null,"call-id","call-id",1043012968));
var state = cljs.core.deref(state_ref);
var op_handler = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ops","ops",1237330063),op], null));
if(cljs.core.truth_(call_id)){
var cfg = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"call-handlers","call-handlers",386605551),call_id], null));
var call_handler = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cfg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"handlers","handlers",79528781),op], null));
if(cljs.core.truth_(call_handler)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(state_ref,cljs.core.update,new cljs.core.Keyword(null,"call-handlers","call-handlers",386605551),cljs.core.dissoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([call_id], 0));

return (call_handler.cljs$core$IFn$_invoke$arity$1 ? call_handler.cljs$core$IFn$_invoke$arity$1(msg) : call_handler.call(null,msg));
} else {
if(cljs.core.truth_(op_handler)){
return (op_handler.cljs$core$IFn$_invoke$arity$1 ? op_handler.cljs$core$IFn$_invoke$arity$1(msg) : op_handler.call(null,msg));
} else {
return shadow.remote.runtime.shared.unhandled_call_result(cfg,msg);

}
}
} else {
if(cljs.core.truth_(op_handler)){
return (op_handler.cljs$core$IFn$_invoke$arity$1 ? op_handler.cljs$core$IFn$_invoke$arity$1(msg) : op_handler.call(null,msg));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"client-not-found","client-not-found",-1754042614),op)){
return shadow.remote.runtime.shared.unhandled_client_not_found(runtime,msg);
} else {
return shadow.remote.runtime.shared.reply_unknown_op(runtime,msg);

}
}
}
});
shadow.remote.runtime.shared.run_on_idle = (function shadow$remote$runtime$shared$run_on_idle(state_ref){
var seq__37172 = cljs.core.seq(cljs.core.vals(new cljs.core.Keyword(null,"extensions","extensions",-1103629196).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref))));
var chunk__37174 = null;
var count__37175 = (0);
var i__37176 = (0);
while(true){
if((i__37176 < count__37175)){
var map__37180 = chunk__37174.cljs$core$IIndexed$_nth$arity$2(null,i__37176);
var map__37180__$1 = cljs.core.__destructure_map(map__37180);
var on_idle = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37180__$1,new cljs.core.Keyword(null,"on-idle","on-idle",2044706602));
if(cljs.core.truth_(on_idle)){
(on_idle.cljs$core$IFn$_invoke$arity$0 ? on_idle.cljs$core$IFn$_invoke$arity$0() : on_idle.call(null));


var G__37389 = seq__37172;
var G__37390 = chunk__37174;
var G__37391 = count__37175;
var G__37392 = (i__37176 + (1));
seq__37172 = G__37389;
chunk__37174 = G__37390;
count__37175 = G__37391;
i__37176 = G__37392;
continue;
} else {
var G__37393 = seq__37172;
var G__37394 = chunk__37174;
var G__37395 = count__37175;
var G__37396 = (i__37176 + (1));
seq__37172 = G__37393;
chunk__37174 = G__37394;
count__37175 = G__37395;
i__37176 = G__37396;
continue;
}
} else {
var temp__5804__auto__ = cljs.core.seq(seq__37172);
if(temp__5804__auto__){
var seq__37172__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__37172__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__37172__$1);
var G__37405 = cljs.core.chunk_rest(seq__37172__$1);
var G__37406 = c__5525__auto__;
var G__37407 = cljs.core.count(c__5525__auto__);
var G__37408 = (0);
seq__37172 = G__37405;
chunk__37174 = G__37406;
count__37175 = G__37407;
i__37176 = G__37408;
continue;
} else {
var map__37181 = cljs.core.first(seq__37172__$1);
var map__37181__$1 = cljs.core.__destructure_map(map__37181);
var on_idle = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37181__$1,new cljs.core.Keyword(null,"on-idle","on-idle",2044706602));
if(cljs.core.truth_(on_idle)){
(on_idle.cljs$core$IFn$_invoke$arity$0 ? on_idle.cljs$core$IFn$_invoke$arity$0() : on_idle.call(null));


var G__37419 = cljs.core.next(seq__37172__$1);
var G__37420 = null;
var G__37421 = (0);
var G__37422 = (0);
seq__37172 = G__37419;
chunk__37174 = G__37420;
count__37175 = G__37421;
i__37176 = G__37422;
continue;
} else {
var G__37423 = cljs.core.next(seq__37172__$1);
var G__37424 = null;
var G__37425 = (0);
var G__37426 = (0);
seq__37172 = G__37423;
chunk__37174 = G__37424;
count__37175 = G__37425;
i__37176 = G__37426;
continue;
}
}
} else {
return null;
}
}
break;
}
});

//# sourceMappingURL=shadow.remote.runtime.shared.js.map
