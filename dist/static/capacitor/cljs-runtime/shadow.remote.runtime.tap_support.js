goog.provide('shadow.remote.runtime.tap_support');
shadow.remote.runtime.tap_support.tap_subscribe = (function shadow$remote$runtime$tap_support$tap_subscribe(p__42833,p__42834){
var map__42835 = p__42833;
var map__42835__$1 = cljs.core.__destructure_map(map__42835);
var svc = map__42835__$1;
var subs_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42835__$1,new cljs.core.Keyword(null,"subs-ref","subs-ref",-1355989911));
var obj_support = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42835__$1,new cljs.core.Keyword(null,"obj-support","obj-support",1522559229));
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42835__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
var map__42836 = p__42834;
var map__42836__$1 = cljs.core.__destructure_map(map__42836);
var msg = map__42836__$1;
var from = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42836__$1,new cljs.core.Keyword(null,"from","from",1815293044));
var summary = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42836__$1,new cljs.core.Keyword(null,"summary","summary",380847952));
var history__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42836__$1,new cljs.core.Keyword(null,"history","history",-247395220));
var num = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__42836__$1,new cljs.core.Keyword(null,"num","num",1985240673),(10));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(subs_ref,cljs.core.assoc,from,msg);

if(cljs.core.truth_(history__$1)){
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"tap-subscribed","tap-subscribed",-1882247432),new cljs.core.Keyword(null,"history","history",-247395220),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (oid){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"oid","oid",-768692334),oid,new cljs.core.Keyword(null,"summary","summary",380847952),shadow.remote.runtime.obj_support.obj_describe_STAR_(obj_support,oid)], null);
}),shadow.remote.runtime.obj_support.get_tap_history(obj_support,num)))], null));
} else {
return null;
}
});
shadow.remote.runtime.tap_support.tap_unsubscribe = (function shadow$remote$runtime$tap_support$tap_unsubscribe(p__42837,p__42838){
var map__42839 = p__42837;
var map__42839__$1 = cljs.core.__destructure_map(map__42839);
var subs_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42839__$1,new cljs.core.Keyword(null,"subs-ref","subs-ref",-1355989911));
var map__42840 = p__42838;
var map__42840__$1 = cljs.core.__destructure_map(map__42840);
var from = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42840__$1,new cljs.core.Keyword(null,"from","from",1815293044));
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(subs_ref,cljs.core.dissoc,from);
});
shadow.remote.runtime.tap_support.request_tap_history = (function shadow$remote$runtime$tap_support$request_tap_history(p__42841,p__42842){
var map__42843 = p__42841;
var map__42843__$1 = cljs.core.__destructure_map(map__42843);
var obj_support = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42843__$1,new cljs.core.Keyword(null,"obj-support","obj-support",1522559229));
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42843__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
var map__42845 = p__42842;
var map__42845__$1 = cljs.core.__destructure_map(map__42845);
var msg = map__42845__$1;
var num = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__42845__$1,new cljs.core.Keyword(null,"num","num",1985240673),(10));
var tap_ids = shadow.remote.runtime.obj_support.get_tap_history(obj_support,num);
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"tap-history","tap-history",-282803347),new cljs.core.Keyword(null,"oids","oids",-1580877688),tap_ids], null));
});
shadow.remote.runtime.tap_support.tool_disconnect = (function shadow$remote$runtime$tap_support$tool_disconnect(p__42848,tid){
var map__42849 = p__42848;
var map__42849__$1 = cljs.core.__destructure_map(map__42849);
var svc = map__42849__$1;
var subs_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42849__$1,new cljs.core.Keyword(null,"subs-ref","subs-ref",-1355989911));
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(subs_ref,cljs.core.dissoc,tid);
});
shadow.remote.runtime.tap_support.start = (function shadow$remote$runtime$tap_support$start(runtime,obj_support){
var subs_ref = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var tap_fn = (function shadow$remote$runtime$tap_support$start_$_runtime_tap(obj){
if((!((obj == null)))){
var oid = shadow.remote.runtime.obj_support.register(obj_support,obj,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"from","from",1815293044),new cljs.core.Keyword(null,"tap","tap",-1086702463)], null));
var seq__42861 = cljs.core.seq(cljs.core.deref(subs_ref));
var chunk__42862 = null;
var count__42863 = (0);
var i__42864 = (0);
while(true){
if((i__42864 < count__42863)){
var vec__42889 = chunk__42862.cljs$core$IIndexed$_nth$arity$2(null,i__42864);
var tid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42889,(0),null);
var tap_config = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42889,(1),null);
shadow.remote.runtime.api.relay_msg(runtime,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"tap","tap",-1086702463),new cljs.core.Keyword(null,"to","to",192099007),tid,new cljs.core.Keyword(null,"oid","oid",-768692334),oid], null));


var G__42925 = seq__42861;
var G__42926 = chunk__42862;
var G__42927 = count__42863;
var G__42928 = (i__42864 + (1));
seq__42861 = G__42925;
chunk__42862 = G__42926;
count__42863 = G__42927;
i__42864 = G__42928;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__42861);
if(temp__5804__auto__){
var seq__42861__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__42861__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__42861__$1);
var G__42929 = cljs.core.chunk_rest(seq__42861__$1);
var G__42930 = c__5525__auto__;
var G__42931 = cljs.core.count(c__5525__auto__);
var G__42932 = (0);
seq__42861 = G__42929;
chunk__42862 = G__42930;
count__42863 = G__42931;
i__42864 = G__42932;
continue;
} else {
var vec__42895 = cljs.core.first(seq__42861__$1);
var tid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42895,(0),null);
var tap_config = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__42895,(1),null);
shadow.remote.runtime.api.relay_msg(runtime,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"tap","tap",-1086702463),new cljs.core.Keyword(null,"to","to",192099007),tid,new cljs.core.Keyword(null,"oid","oid",-768692334),oid], null));


var G__42933 = cljs.core.next(seq__42861__$1);
var G__42934 = null;
var G__42935 = (0);
var G__42936 = (0);
seq__42861 = G__42933;
chunk__42862 = G__42934;
count__42863 = G__42935;
i__42864 = G__42936;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return null;
}
});
var svc = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"runtime","runtime",-1331573996),runtime,new cljs.core.Keyword(null,"obj-support","obj-support",1522559229),obj_support,new cljs.core.Keyword(null,"tap-fn","tap-fn",1573556461),tap_fn,new cljs.core.Keyword(null,"subs-ref","subs-ref",-1355989911),subs_ref], null);
shadow.remote.runtime.api.add_extension(runtime,new cljs.core.Keyword("shadow.remote.runtime.tap-support","ext","shadow.remote.runtime.tap-support/ext",1019069674),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ops","ops",1237330063),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"tap-subscribe","tap-subscribe",411179050),(function (p1__42855_SHARP_){
return shadow.remote.runtime.tap_support.tap_subscribe(svc,p1__42855_SHARP_);
}),new cljs.core.Keyword(null,"tap-unsubscribe","tap-unsubscribe",1183890755),(function (p1__42856_SHARP_){
return shadow.remote.runtime.tap_support.tap_unsubscribe(svc,p1__42856_SHARP_);
}),new cljs.core.Keyword(null,"request-tap-history","request-tap-history",-670837812),(function (p1__42857_SHARP_){
return shadow.remote.runtime.tap_support.request_tap_history(svc,p1__42857_SHARP_);
})], null),new cljs.core.Keyword(null,"on-tool-disconnect","on-tool-disconnect",693464366),(function (p1__42858_SHARP_){
return shadow.remote.runtime.tap_support.tool_disconnect(svc,p1__42858_SHARP_);
})], null));

cljs.core.add_tap(tap_fn);

return svc;
});
shadow.remote.runtime.tap_support.stop = (function shadow$remote$runtime$tap_support$stop(p__42907){
var map__42908 = p__42907;
var map__42908__$1 = cljs.core.__destructure_map(map__42908);
var svc = map__42908__$1;
var tap_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42908__$1,new cljs.core.Keyword(null,"tap-fn","tap-fn",1573556461));
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__42908__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
cljs.core.remove_tap(tap_fn);

return shadow.remote.runtime.api.del_extension(runtime,new cljs.core.Keyword("shadow.remote.runtime.tap-support","ext","shadow.remote.runtime.tap-support/ext",1019069674));
});

//# sourceMappingURL=shadow.remote.runtime.tap_support.js.map
