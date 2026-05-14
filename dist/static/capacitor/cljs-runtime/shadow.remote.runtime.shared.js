goog.provide('shadow.remote.runtime.shared');
shadow.remote.runtime.shared.init_state = (function shadow$remote$runtime$shared$init_state(client_info){
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"extensions","extensions",-1103629196),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"ops","ops",1237330063),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"client-info","client-info",1958982504),client_info,new cljs.core.Keyword(null,"call-id-seq","call-id-seq",-1679248218),(0),new cljs.core.Keyword(null,"call-handlers","call-handlers",386605551),cljs.core.PersistentArrayMap.EMPTY], null);
});
shadow.remote.runtime.shared.now = (function shadow$remote$runtime$shared$now(){
return Date.now();
});
shadow.remote.runtime.shared.get_client_id = (function shadow$remote$runtime$shared$get_client_id(p__38070){
var map__38071 = p__38070;
var map__38071__$1 = cljs.core.__destructure_map(map__38071);
var runtime = map__38071__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38071__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var or__5002__auto__ = new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("runtime has no assigned runtime-id",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"runtime","runtime",-1331573996),runtime], null));
}
});
shadow.remote.runtime.shared.relay_msg = (function shadow$remote$runtime$shared$relay_msg(runtime,msg){
var self_id_38179 = shadow.remote.runtime.shared.get_client_id(runtime);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"to","to",192099007).cljs$core$IFn$_invoke$arity$1(msg),self_id_38179)){
shadow.remote.runtime.api.relay_msg(runtime,msg);
} else {
Promise.resolve((1)).then((function (){
var G__38084 = runtime;
var G__38085 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(msg,new cljs.core.Keyword(null,"from","from",1815293044),self_id_38179);
return (shadow.remote.runtime.shared.process.cljs$core$IFn$_invoke$arity$2 ? shadow.remote.runtime.shared.process.cljs$core$IFn$_invoke$arity$2(G__38084,G__38085) : shadow.remote.runtime.shared.process.call(null,G__38084,G__38085));
}));
}

return msg;
});
shadow.remote.runtime.shared.reply = (function shadow$remote$runtime$shared$reply(runtime,p__38091,res){
var map__38092 = p__38091;
var map__38092__$1 = cljs.core.__destructure_map(map__38092);
var call_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38092__$1,new cljs.core.Keyword(null,"call-id","call-id",1043012968));
var from = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38092__$1,new cljs.core.Keyword(null,"from","from",1815293044));
var res__$1 = (function (){var G__38093 = res;
var G__38093__$1 = (cljs.core.truth_(call_id)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__38093,new cljs.core.Keyword(null,"call-id","call-id",1043012968),call_id):G__38093);
if(cljs.core.truth_(from)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__38093__$1,new cljs.core.Keyword(null,"to","to",192099007),from);
} else {
return G__38093__$1;
}
})();
return shadow.remote.runtime.api.relay_msg(runtime,res__$1);
});
shadow.remote.runtime.shared.call = (function shadow$remote$runtime$shared$call(var_args){
var G__38102 = arguments.length;
switch (G__38102) {
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

(shadow.remote.runtime.shared.call.cljs$core$IFn$_invoke$arity$4 = (function (p__38104,msg,handlers,timeout_after_ms){
var map__38108 = p__38104;
var map__38108__$1 = cljs.core.__destructure_map(map__38108);
var runtime = map__38108__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38108__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
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
var len__5726__auto___38181 = arguments.length;
var i__5727__auto___38182 = (0);
while(true){
if((i__5727__auto___38182 < len__5726__auto___38181)){
args__5732__auto__.push((arguments[i__5727__auto___38182]));

var G__38183 = (i__5727__auto___38182 + (1));
i__5727__auto___38182 = G__38183;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return shadow.remote.runtime.shared.trigger_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(shadow.remote.runtime.shared.trigger_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (p__38115,ev,args){
var map__38116 = p__38115;
var map__38116__$1 = cljs.core.__destructure_map(map__38116);
var runtime = map__38116__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38116__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var seq__38117 = cljs.core.seq(cljs.core.vals(new cljs.core.Keyword(null,"extensions","extensions",-1103629196).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref))));
var chunk__38120 = null;
var count__38121 = (0);
var i__38122 = (0);
while(true){
if((i__38122 < count__38121)){
var ext = chunk__38120.cljs$core$IIndexed$_nth$arity$2(null,i__38122);
var ev_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(ext,ev);
if(cljs.core.truth_(ev_fn)){
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(ev_fn,args);


var G__38184 = seq__38117;
var G__38185 = chunk__38120;
var G__38186 = count__38121;
var G__38187 = (i__38122 + (1));
seq__38117 = G__38184;
chunk__38120 = G__38185;
count__38121 = G__38186;
i__38122 = G__38187;
continue;
} else {
var G__38188 = seq__38117;
var G__38189 = chunk__38120;
var G__38190 = count__38121;
var G__38191 = (i__38122 + (1));
seq__38117 = G__38188;
chunk__38120 = G__38189;
count__38121 = G__38190;
i__38122 = G__38191;
continue;
}
} else {
var temp__5804__auto__ = cljs.core.seq(seq__38117);
if(temp__5804__auto__){
var seq__38117__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__38117__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__38117__$1);
var G__38192 = cljs.core.chunk_rest(seq__38117__$1);
var G__38193 = c__5525__auto__;
var G__38194 = cljs.core.count(c__5525__auto__);
var G__38195 = (0);
seq__38117 = G__38192;
chunk__38120 = G__38193;
count__38121 = G__38194;
i__38122 = G__38195;
continue;
} else {
var ext = cljs.core.first(seq__38117__$1);
var ev_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(ext,ev);
if(cljs.core.truth_(ev_fn)){
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(ev_fn,args);


var G__38196 = cljs.core.next(seq__38117__$1);
var G__38197 = null;
var G__38198 = (0);
var G__38200 = (0);
seq__38117 = G__38196;
chunk__38120 = G__38197;
count__38121 = G__38198;
i__38122 = G__38200;
continue;
} else {
var G__38203 = cljs.core.next(seq__38117__$1);
var G__38204 = null;
var G__38205 = (0);
var G__38206 = (0);
seq__38117 = G__38203;
chunk__38120 = G__38204;
count__38121 = G__38205;
i__38122 = G__38206;
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
(shadow.remote.runtime.shared.trigger_BANG_.cljs$lang$applyTo = (function (seq38110){
var G__38111 = cljs.core.first(seq38110);
var seq38110__$1 = cljs.core.next(seq38110);
var G__38112 = cljs.core.first(seq38110__$1);
var seq38110__$2 = cljs.core.next(seq38110__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__38111,G__38112,seq38110__$2);
}));

shadow.remote.runtime.shared.welcome = (function shadow$remote$runtime$shared$welcome(p__38131,p__38132){
var map__38133 = p__38131;
var map__38133__$1 = cljs.core.__destructure_map(map__38133);
var runtime = map__38133__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38133__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var map__38134 = p__38132;
var map__38134__$1 = cljs.core.__destructure_map(map__38134);
var msg = map__38134__$1;
var client_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38134__$1,new cljs.core.Keyword(null,"client-id","client-id",-464622140));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(state_ref,cljs.core.assoc,new cljs.core.Keyword(null,"client-id","client-id",-464622140),client_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"welcome","welcome",-578152123),true], 0));

var map__38135 = cljs.core.deref(state_ref);
var map__38135__$1 = cljs.core.__destructure_map(map__38135);
var client_info = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38135__$1,new cljs.core.Keyword(null,"client-info","client-info",1958982504));
var extensions = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38135__$1,new cljs.core.Keyword(null,"extensions","extensions",-1103629196));
shadow.remote.runtime.shared.relay_msg(runtime,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"hello","hello",-245025397),new cljs.core.Keyword(null,"client-info","client-info",1958982504),client_info], null));

return shadow.remote.runtime.shared.trigger_BANG_(runtime,new cljs.core.Keyword(null,"on-welcome","on-welcome",1895317125));
});
shadow.remote.runtime.shared.ping = (function shadow$remote$runtime$shared$ping(runtime,msg){
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"pong","pong",-172484958)], null));
});
shadow.remote.runtime.shared.request_supported_ops = (function shadow$remote$runtime$shared$request_supported_ops(p__38137,msg){
var map__38138 = p__38137;
var map__38138__$1 = cljs.core.__destructure_map(map__38138);
var runtime = map__38138__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38138__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"supported-ops","supported-ops",337914702),new cljs.core.Keyword(null,"ops","ops",1237330063),cljs.core.disj.cljs$core$IFn$_invoke$arity$variadic(cljs.core.set(cljs.core.keys(new cljs.core.Keyword(null,"ops","ops",1237330063).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref)))),new cljs.core.Keyword(null,"welcome","welcome",-578152123),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"unknown-relay-op","unknown-relay-op",170832753),new cljs.core.Keyword(null,"unknown-op","unknown-op",1900385996),new cljs.core.Keyword(null,"request-supported-ops","request-supported-ops",-1034994502),new cljs.core.Keyword(null,"tool-disconnect","tool-disconnect",189103996)], 0))], null));
});
shadow.remote.runtime.shared.unknown_relay_op = (function shadow$remote$runtime$shared$unknown_relay_op(msg){
return console.warn("unknown-relay-op",msg);
});
shadow.remote.runtime.shared.unknown_op = (function shadow$remote$runtime$shared$unknown_op(msg){
return console.warn("unknown-op",msg);
});
shadow.remote.runtime.shared.add_extension_STAR_ = (function shadow$remote$runtime$shared$add_extension_STAR_(p__38140,key,p__38141){
var map__38142 = p__38140;
var map__38142__$1 = cljs.core.__destructure_map(map__38142);
var state = map__38142__$1;
var extensions = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38142__$1,new cljs.core.Keyword(null,"extensions","extensions",-1103629196));
var map__38143 = p__38141;
var map__38143__$1 = cljs.core.__destructure_map(map__38143);
var spec = map__38143__$1;
var ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38143__$1,new cljs.core.Keyword(null,"ops","ops",1237330063));
var transit_write_handlers = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38143__$1,new cljs.core.Keyword(null,"transit-write-handlers","transit-write-handlers",1886308716));
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
shadow.remote.runtime.shared.add_extension = (function shadow$remote$runtime$shared$add_extension(p__38147,key,spec){
var map__38148 = p__38147;
var map__38148__$1 = cljs.core.__destructure_map(map__38148);
var runtime = map__38148__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38148__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(state_ref,shadow.remote.runtime.shared.add_extension_STAR_,key,spec);

var temp__5808__auto___38211 = new cljs.core.Keyword(null,"on-welcome","on-welcome",1895317125).cljs$core$IFn$_invoke$arity$1(spec);
if((temp__5808__auto___38211 == null)){
} else {
var on_welcome_38212 = temp__5808__auto___38211;
if(cljs.core.truth_(new cljs.core.Keyword(null,"welcome","welcome",-578152123).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref)))){
(on_welcome_38212.cljs$core$IFn$_invoke$arity$0 ? on_welcome_38212.cljs$core$IFn$_invoke$arity$0() : on_welcome_38212.call(null));
} else {
}
}

return runtime;
});
shadow.remote.runtime.shared.add_defaults = (function shadow$remote$runtime$shared$add_defaults(runtime){
return shadow.remote.runtime.shared.add_extension(runtime,new cljs.core.Keyword("shadow.remote.runtime.shared","defaults","shadow.remote.runtime.shared/defaults",-1821257543),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ops","ops",1237330063),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"welcome","welcome",-578152123),(function (p1__38150_SHARP_){
return shadow.remote.runtime.shared.welcome(runtime,p1__38150_SHARP_);
}),new cljs.core.Keyword(null,"unknown-relay-op","unknown-relay-op",170832753),(function (p1__38151_SHARP_){
return shadow.remote.runtime.shared.unknown_relay_op(p1__38151_SHARP_);
}),new cljs.core.Keyword(null,"unknown-op","unknown-op",1900385996),(function (p1__38152_SHARP_){
return shadow.remote.runtime.shared.unknown_op(p1__38152_SHARP_);
}),new cljs.core.Keyword(null,"ping","ping",-1670114784),(function (p1__38153_SHARP_){
return shadow.remote.runtime.shared.ping(runtime,p1__38153_SHARP_);
}),new cljs.core.Keyword(null,"request-supported-ops","request-supported-ops",-1034994502),(function (p1__38154_SHARP_){
return shadow.remote.runtime.shared.request_supported_ops(runtime,p1__38154_SHARP_);
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
shadow.remote.runtime.shared.del_extension = (function shadow$remote$runtime$shared$del_extension(p__38155,key){
var map__38156 = p__38155;
var map__38156__$1 = cljs.core.__destructure_map(map__38156);
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38156__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(state_ref,shadow.remote.runtime.shared.del_extension_STAR_,key);
});
shadow.remote.runtime.shared.unhandled_call_result = (function shadow$remote$runtime$shared$unhandled_call_result(call_config,msg){
return console.warn("unhandled call result",msg,call_config);
});
shadow.remote.runtime.shared.unhandled_client_not_found = (function shadow$remote$runtime$shared$unhandled_client_not_found(p__38157,msg){
var map__38158 = p__38157;
var map__38158__$1 = cljs.core.__destructure_map(map__38158);
var runtime = map__38158__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38158__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
return shadow.remote.runtime.shared.trigger_BANG_.cljs$core$IFn$_invoke$arity$variadic(runtime,new cljs.core.Keyword(null,"on-client-not-found","on-client-not-found",-642452849),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([msg], 0));
});
shadow.remote.runtime.shared.reply_unknown_op = (function shadow$remote$runtime$shared$reply_unknown_op(runtime,msg){
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"unknown-op","unknown-op",1900385996),new cljs.core.Keyword(null,"msg","msg",-1386103444),msg], null));
});
shadow.remote.runtime.shared.process = (function shadow$remote$runtime$shared$process(p__38159,p__38160){
var map__38161 = p__38159;
var map__38161__$1 = cljs.core.__destructure_map(map__38161);
var runtime = map__38161__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38161__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var map__38162 = p__38160;
var map__38162__$1 = cljs.core.__destructure_map(map__38162);
var msg = map__38162__$1;
var op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38162__$1,new cljs.core.Keyword(null,"op","op",-1882987955));
var call_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38162__$1,new cljs.core.Keyword(null,"call-id","call-id",1043012968));
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
var seq__38165 = cljs.core.seq(cljs.core.vals(new cljs.core.Keyword(null,"extensions","extensions",-1103629196).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref))));
var chunk__38167 = null;
var count__38168 = (0);
var i__38169 = (0);
while(true){
if((i__38169 < count__38168)){
var map__38177 = chunk__38167.cljs$core$IIndexed$_nth$arity$2(null,i__38169);
var map__38177__$1 = cljs.core.__destructure_map(map__38177);
var on_idle = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38177__$1,new cljs.core.Keyword(null,"on-idle","on-idle",2044706602));
if(cljs.core.truth_(on_idle)){
(on_idle.cljs$core$IFn$_invoke$arity$0 ? on_idle.cljs$core$IFn$_invoke$arity$0() : on_idle.call(null));


var G__38215 = seq__38165;
var G__38216 = chunk__38167;
var G__38217 = count__38168;
var G__38218 = (i__38169 + (1));
seq__38165 = G__38215;
chunk__38167 = G__38216;
count__38168 = G__38217;
i__38169 = G__38218;
continue;
} else {
var G__38219 = seq__38165;
var G__38220 = chunk__38167;
var G__38221 = count__38168;
var G__38222 = (i__38169 + (1));
seq__38165 = G__38219;
chunk__38167 = G__38220;
count__38168 = G__38221;
i__38169 = G__38222;
continue;
}
} else {
var temp__5804__auto__ = cljs.core.seq(seq__38165);
if(temp__5804__auto__){
var seq__38165__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__38165__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__38165__$1);
var G__38224 = cljs.core.chunk_rest(seq__38165__$1);
var G__38225 = c__5525__auto__;
var G__38226 = cljs.core.count(c__5525__auto__);
var G__38227 = (0);
seq__38165 = G__38224;
chunk__38167 = G__38225;
count__38168 = G__38226;
i__38169 = G__38227;
continue;
} else {
var map__38178 = cljs.core.first(seq__38165__$1);
var map__38178__$1 = cljs.core.__destructure_map(map__38178);
var on_idle = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__38178__$1,new cljs.core.Keyword(null,"on-idle","on-idle",2044706602));
if(cljs.core.truth_(on_idle)){
(on_idle.cljs$core$IFn$_invoke$arity$0 ? on_idle.cljs$core$IFn$_invoke$arity$0() : on_idle.call(null));


var G__38228 = cljs.core.next(seq__38165__$1);
var G__38229 = null;
var G__38230 = (0);
var G__38231 = (0);
seq__38165 = G__38228;
chunk__38167 = G__38229;
count__38168 = G__38230;
i__38169 = G__38231;
continue;
} else {
var G__38232 = cljs.core.next(seq__38165__$1);
var G__38233 = null;
var G__38234 = (0);
var G__38235 = (0);
seq__38165 = G__38232;
chunk__38167 = G__38233;
count__38168 = G__38234;
i__38169 = G__38235;
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
