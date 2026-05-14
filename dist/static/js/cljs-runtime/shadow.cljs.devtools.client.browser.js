goog.provide('shadow.cljs.devtools.client.browser');
shadow.cljs.devtools.client.browser.devtools_msg = (function shadow$cljs$devtools$client$browser$devtools_msg(var_args){
var args__5732__auto__ = [];
var len__5726__auto___44193 = arguments.length;
var i__5727__auto___44194 = (0);
while(true){
if((i__5727__auto___44194 < len__5726__auto___44193)){
args__5732__auto__.push((arguments[i__5727__auto___44194]));

var G__44195 = (i__5727__auto___44194 + (1));
i__5727__auto___44194 = G__44195;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic = (function (msg,args){
if(shadow.cljs.devtools.client.env.log){
if(cljs.core.seq(shadow.cljs.devtools.client.env.log_style)){
return console.log.apply(console,cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [["%cshadow-cljs: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(msg)].join(''),shadow.cljs.devtools.client.env.log_style], null),args)));
} else {
return console.log.apply(console,cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [["shadow-cljs: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(msg)].join('')], null),args)));
}
} else {
return null;
}
}));

(shadow.cljs.devtools.client.browser.devtools_msg.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(shadow.cljs.devtools.client.browser.devtools_msg.cljs$lang$applyTo = (function (seq43359){
var G__43360 = cljs.core.first(seq43359);
var seq43359__$1 = cljs.core.next(seq43359);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__43360,seq43359__$1);
}));

shadow.cljs.devtools.client.browser.script_eval = (function shadow$cljs$devtools$client$browser$script_eval(code){
return goog.globalEval(code);
});
shadow.cljs.devtools.client.browser.do_js_load = (function shadow$cljs$devtools$client$browser$do_js_load(sources){
var seq__43378 = cljs.core.seq(sources);
var chunk__43379 = null;
var count__43380 = (0);
var i__43381 = (0);
while(true){
if((i__43381 < count__43380)){
var map__43401 = chunk__43379.cljs$core$IIndexed$_nth$arity$2(null,i__43381);
var map__43401__$1 = cljs.core.__destructure_map(map__43401);
var src = map__43401__$1;
var resource_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43401__$1,new cljs.core.Keyword(null,"resource-id","resource-id",-1308422582));
var output_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43401__$1,new cljs.core.Keyword(null,"output-name","output-name",-1769107767));
var resource_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43401__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
var js = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43401__$1,new cljs.core.Keyword(null,"js","js",1768080579));
$CLJS.SHADOW_ENV.setLoaded(output_name);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load JS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([resource_name], 0));

shadow.cljs.devtools.client.env.before_load_src(src);

try{shadow.cljs.devtools.client.browser.script_eval([cljs.core.str.cljs$core$IFn$_invoke$arity$1(js),"\n//# sourceURL=",cljs.core.str.cljs$core$IFn$_invoke$arity$1($CLJS.SHADOW_ENV.scriptBase),cljs.core.str.cljs$core$IFn$_invoke$arity$1(output_name)].join(''));
}catch (e43403){var e_44204 = e43403;
if(shadow.cljs.devtools.client.env.log){
console.error(["Failed to load ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name)].join(''),e_44204);
} else {
}

throw (new Error(["Failed to load ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e_44204.message)].join('')));
}

var G__44205 = seq__43378;
var G__44206 = chunk__43379;
var G__44207 = count__43380;
var G__44208 = (i__43381 + (1));
seq__43378 = G__44205;
chunk__43379 = G__44206;
count__43380 = G__44207;
i__43381 = G__44208;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__43378);
if(temp__5804__auto__){
var seq__43378__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__43378__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__43378__$1);
var G__44210 = cljs.core.chunk_rest(seq__43378__$1);
var G__44211 = c__5525__auto__;
var G__44212 = cljs.core.count(c__5525__auto__);
var G__44213 = (0);
seq__43378 = G__44210;
chunk__43379 = G__44211;
count__43380 = G__44212;
i__43381 = G__44213;
continue;
} else {
var map__43407 = cljs.core.first(seq__43378__$1);
var map__43407__$1 = cljs.core.__destructure_map(map__43407);
var src = map__43407__$1;
var resource_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43407__$1,new cljs.core.Keyword(null,"resource-id","resource-id",-1308422582));
var output_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43407__$1,new cljs.core.Keyword(null,"output-name","output-name",-1769107767));
var resource_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43407__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
var js = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43407__$1,new cljs.core.Keyword(null,"js","js",1768080579));
$CLJS.SHADOW_ENV.setLoaded(output_name);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load JS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([resource_name], 0));

shadow.cljs.devtools.client.env.before_load_src(src);

try{shadow.cljs.devtools.client.browser.script_eval([cljs.core.str.cljs$core$IFn$_invoke$arity$1(js),"\n//# sourceURL=",cljs.core.str.cljs$core$IFn$_invoke$arity$1($CLJS.SHADOW_ENV.scriptBase),cljs.core.str.cljs$core$IFn$_invoke$arity$1(output_name)].join(''));
}catch (e43410){var e_44214 = e43410;
if(shadow.cljs.devtools.client.env.log){
console.error(["Failed to load ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name)].join(''),e_44214);
} else {
}

throw (new Error(["Failed to load ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e_44214.message)].join('')));
}

var G__44215 = cljs.core.next(seq__43378__$1);
var G__44216 = null;
var G__44217 = (0);
var G__44218 = (0);
seq__43378 = G__44215;
chunk__43379 = G__44216;
count__43380 = G__44217;
i__43381 = G__44218;
continue;
}
} else {
return null;
}
}
break;
}
});
shadow.cljs.devtools.client.browser.do_js_reload = (function shadow$cljs$devtools$client$browser$do_js_reload(msg,sources,complete_fn,failure_fn){
return shadow.cljs.devtools.client.env.do_js_reload.cljs$core$IFn$_invoke$arity$4(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(msg,new cljs.core.Keyword(null,"log-missing-fn","log-missing-fn",732676765),(function (fn_sym){
return null;
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"log-call-async","log-call-async",183826192),(function (fn_sym){
return shadow.cljs.devtools.client.browser.devtools_msg(["call async ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym)].join(''));
}),new cljs.core.Keyword(null,"log-call","log-call",412404391),(function (fn_sym){
return shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym)].join(''));
})], 0)),(function (next){
shadow.cljs.devtools.client.browser.do_js_load(sources);

return (next.cljs$core$IFn$_invoke$arity$0 ? next.cljs$core$IFn$_invoke$arity$0() : next.call(null));
}),complete_fn,failure_fn);
});
/**
 * when (require '["some-str" :as x]) is done at the REPL we need to manually call the shadow.js.require for it
 * since the file only adds the shadow$provide. only need to do this for shadow-js.
 */
shadow.cljs.devtools.client.browser.do_js_requires = (function shadow$cljs$devtools$client$browser$do_js_requires(js_requires){
var seq__43411 = cljs.core.seq(js_requires);
var chunk__43412 = null;
var count__43413 = (0);
var i__43414 = (0);
while(true){
if((i__43414 < count__43413)){
var js_ns = chunk__43412.cljs$core$IIndexed$_nth$arity$2(null,i__43414);
var require_str_44219 = ["var ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(js_ns)," = shadow.js.require(\"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(js_ns),"\");"].join('');
shadow.cljs.devtools.client.browser.script_eval(require_str_44219);


var G__44220 = seq__43411;
var G__44221 = chunk__43412;
var G__44222 = count__43413;
var G__44223 = (i__43414 + (1));
seq__43411 = G__44220;
chunk__43412 = G__44221;
count__43413 = G__44222;
i__43414 = G__44223;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__43411);
if(temp__5804__auto__){
var seq__43411__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__43411__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__43411__$1);
var G__44225 = cljs.core.chunk_rest(seq__43411__$1);
var G__44226 = c__5525__auto__;
var G__44227 = cljs.core.count(c__5525__auto__);
var G__44228 = (0);
seq__43411 = G__44225;
chunk__43412 = G__44226;
count__43413 = G__44227;
i__43414 = G__44228;
continue;
} else {
var js_ns = cljs.core.first(seq__43411__$1);
var require_str_44229 = ["var ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(js_ns)," = shadow.js.require(\"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(js_ns),"\");"].join('');
shadow.cljs.devtools.client.browser.script_eval(require_str_44229);


var G__44231 = cljs.core.next(seq__43411__$1);
var G__44232 = null;
var G__44233 = (0);
var G__44234 = (0);
seq__43411 = G__44231;
chunk__43412 = G__44232;
count__43413 = G__44233;
i__43414 = G__44234;
continue;
}
} else {
return null;
}
}
break;
}
});
shadow.cljs.devtools.client.browser.handle_build_complete = (function shadow$cljs$devtools$client$browser$handle_build_complete(runtime,p__43423){
var map__43424 = p__43423;
var map__43424__$1 = cljs.core.__destructure_map(map__43424);
var msg = map__43424__$1;
var info = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43424__$1,new cljs.core.Keyword(null,"info","info",-317069002));
var reload_info = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43424__$1,new cljs.core.Keyword(null,"reload-info","reload-info",1648088086));
var warnings = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__43426(s__43427){
return (new cljs.core.LazySeq(null,(function (){
var s__43427__$1 = s__43427;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__43427__$1);
if(temp__5804__auto__){
var xs__6360__auto__ = temp__5804__auto__;
var map__43434 = cljs.core.first(xs__6360__auto__);
var map__43434__$1 = cljs.core.__destructure_map(map__43434);
var src = map__43434__$1;
var resource_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43434__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
var warnings = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43434__$1,new cljs.core.Keyword(null,"warnings","warnings",-735437651));
if(cljs.core.not(new cljs.core.Keyword(null,"from-jar","from-jar",1050932827).cljs$core$IFn$_invoke$arity$1(src))){
var iterys__5476__auto__ = ((function (s__43427__$1,map__43434,map__43434__$1,src,resource_name,warnings,xs__6360__auto__,temp__5804__auto__,map__43424,map__43424__$1,msg,info,reload_info){
return (function shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__43426_$_iter__43428(s__43429){
return (new cljs.core.LazySeq(null,((function (s__43427__$1,map__43434,map__43434__$1,src,resource_name,warnings,xs__6360__auto__,temp__5804__auto__,map__43424,map__43424__$1,msg,info,reload_info){
return (function (){
var s__43429__$1 = s__43429;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__43429__$1);
if(temp__5804__auto____$1){
var s__43429__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__43429__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__43429__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__43431 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__43430 = (0);
while(true){
if((i__43430 < size__5479__auto__)){
var warning = cljs.core._nth(c__5478__auto__,i__43430);
cljs.core.chunk_append(b__43431,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(warning,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100),resource_name));

var G__44241 = (i__43430 + (1));
i__43430 = G__44241;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__43431),shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__43426_$_iter__43428(cljs.core.chunk_rest(s__43429__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__43431),null);
}
} else {
var warning = cljs.core.first(s__43429__$2);
return cljs.core.cons(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(warning,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100),resource_name),shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__43426_$_iter__43428(cljs.core.rest(s__43429__$2)));
}
} else {
return null;
}
break;
}
});})(s__43427__$1,map__43434,map__43434__$1,src,resource_name,warnings,xs__6360__auto__,temp__5804__auto__,map__43424,map__43424__$1,msg,info,reload_info))
,null,null));
});})(s__43427__$1,map__43434,map__43434__$1,src,resource_name,warnings,xs__6360__auto__,temp__5804__auto__,map__43424,map__43424__$1,msg,info,reload_info))
;
var fs__5477__auto__ = cljs.core.seq(iterys__5476__auto__(warnings));
if(fs__5477__auto__){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(fs__5477__auto__,shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__43426(cljs.core.rest(s__43427__$1)));
} else {
var G__44242 = cljs.core.rest(s__43427__$1);
s__43427__$1 = G__44242;
continue;
}
} else {
var G__44243 = cljs.core.rest(s__43427__$1);
s__43427__$1 = G__44243;
continue;
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.Keyword(null,"sources","sources",-321166424).cljs$core$IFn$_invoke$arity$1(info));
})()));
if(shadow.cljs.devtools.client.env.log){
var seq__43446_44244 = cljs.core.seq(warnings);
var chunk__43447_44245 = null;
var count__43448_44246 = (0);
var i__43449_44247 = (0);
while(true){
if((i__43449_44247 < count__43448_44246)){
var map__43463_44248 = chunk__43447_44245.cljs$core$IIndexed$_nth$arity$2(null,i__43449_44247);
var map__43463_44249__$1 = cljs.core.__destructure_map(map__43463_44248);
var w_44250 = map__43463_44249__$1;
var msg_44251__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43463_44249__$1,new cljs.core.Keyword(null,"msg","msg",-1386103444));
var line_44252 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43463_44249__$1,new cljs.core.Keyword(null,"line","line",212345235));
var column_44253 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43463_44249__$1,new cljs.core.Keyword(null,"column","column",2078222095));
var resource_name_44254 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43463_44249__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
console.warn(["BUILD-WARNING in ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name_44254)," at [",cljs.core.str.cljs$core$IFn$_invoke$arity$1(line_44252),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(column_44253),"]\n\t",cljs.core.str.cljs$core$IFn$_invoke$arity$1(msg_44251__$1)].join(''));


var G__44257 = seq__43446_44244;
var G__44258 = chunk__43447_44245;
var G__44259 = count__43448_44246;
var G__44260 = (i__43449_44247 + (1));
seq__43446_44244 = G__44257;
chunk__43447_44245 = G__44258;
count__43448_44246 = G__44259;
i__43449_44247 = G__44260;
continue;
} else {
var temp__5804__auto___44264 = cljs.core.seq(seq__43446_44244);
if(temp__5804__auto___44264){
var seq__43446_44265__$1 = temp__5804__auto___44264;
if(cljs.core.chunked_seq_QMARK_(seq__43446_44265__$1)){
var c__5525__auto___44266 = cljs.core.chunk_first(seq__43446_44265__$1);
var G__44267 = cljs.core.chunk_rest(seq__43446_44265__$1);
var G__44268 = c__5525__auto___44266;
var G__44269 = cljs.core.count(c__5525__auto___44266);
var G__44270 = (0);
seq__43446_44244 = G__44267;
chunk__43447_44245 = G__44268;
count__43448_44246 = G__44269;
i__43449_44247 = G__44270;
continue;
} else {
var map__43469_44271 = cljs.core.first(seq__43446_44265__$1);
var map__43469_44272__$1 = cljs.core.__destructure_map(map__43469_44271);
var w_44273 = map__43469_44272__$1;
var msg_44274__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43469_44272__$1,new cljs.core.Keyword(null,"msg","msg",-1386103444));
var line_44275 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43469_44272__$1,new cljs.core.Keyword(null,"line","line",212345235));
var column_44276 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43469_44272__$1,new cljs.core.Keyword(null,"column","column",2078222095));
var resource_name_44277 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43469_44272__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
console.warn(["BUILD-WARNING in ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name_44277)," at [",cljs.core.str.cljs$core$IFn$_invoke$arity$1(line_44275),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(column_44276),"]\n\t",cljs.core.str.cljs$core$IFn$_invoke$arity$1(msg_44274__$1)].join(''));


var G__44279 = cljs.core.next(seq__43446_44265__$1);
var G__44280 = null;
var G__44281 = (0);
var G__44282 = (0);
seq__43446_44244 = G__44279;
chunk__43447_44245 = G__44280;
count__43448_44246 = G__44281;
i__43449_44247 = G__44282;
continue;
}
} else {
}
}
break;
}
} else {
}

if((!(shadow.cljs.devtools.client.env.autoload))){
return shadow.cljs.devtools.client.hud.load_end_success();
} else {
if(((cljs.core.empty_QMARK_(warnings)) || (shadow.cljs.devtools.client.env.ignore_warnings))){
var sources_to_get = shadow.cljs.devtools.client.env.filter_reload_sources(info,reload_info);
if(cljs.core.not(cljs.core.seq(sources_to_get))){
return shadow.cljs.devtools.client.hud.load_end_success();
} else {
if(cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"reload-info","reload-info",1648088086),new cljs.core.Keyword(null,"after-load","after-load",-1278503285)], null)))){
} else {
shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("reloading code but no :after-load hooks are configured!",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["https://shadow-cljs.github.io/docs/UsersGuide.html#_lifecycle_hooks"], 0));
}

return shadow.cljs.devtools.client.shared.load_sources(runtime,sources_to_get,(function (p1__43418_SHARP_){
return shadow.cljs.devtools.client.browser.do_js_reload(msg,p1__43418_SHARP_,shadow.cljs.devtools.client.hud.load_end_success,shadow.cljs.devtools.client.hud.load_failure);
}));
}
} else {
return null;
}
}
});
shadow.cljs.devtools.client.browser.page_load_uri = (cljs.core.truth_(goog.global.document)?goog.Uri.parse(document.location.href):null);
shadow.cljs.devtools.client.browser.match_paths = (function shadow$cljs$devtools$client$browser$match_paths(old,new$){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("file",shadow.cljs.devtools.client.browser.page_load_uri.getScheme())){
var rel_new = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(new$,(1));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old,rel_new)) || (clojure.string.starts_with_QMARK_(old,[rel_new,"?"].join(''))))){
return rel_new;
} else {
return null;
}
} else {
var node_uri = goog.Uri.parse(old);
var node_uri_resolved = shadow.cljs.devtools.client.browser.page_load_uri.resolve(node_uri);
var node_abs = node_uri_resolved.getPath();
var and__5000__auto__ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$1(shadow.cljs.devtools.client.browser.page_load_uri.hasSameDomainAs(node_uri))) || (cljs.core.not(node_uri.hasDomain())));
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(node_abs,new$);
if(and__5000__auto____$1){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__43477 = node_uri;
G__43477.setQuery(null);

G__43477.setPath(new$);

return G__43477;
})());
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
});
shadow.cljs.devtools.client.browser.handle_asset_update = (function shadow$cljs$devtools$client$browser$handle_asset_update(p__43480){
var map__43481 = p__43480;
var map__43481__$1 = cljs.core.__destructure_map(map__43481);
var msg = map__43481__$1;
var updates = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43481__$1,new cljs.core.Keyword(null,"updates","updates",2013983452));
var reload_info = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43481__$1,new cljs.core.Keyword(null,"reload-info","reload-info",1648088086));
var seq__43482 = cljs.core.seq(updates);
var chunk__43484 = null;
var count__43485 = (0);
var i__43486 = (0);
while(true){
if((i__43486 < count__43485)){
var path = chunk__43484.cljs$core$IIndexed$_nth$arity$2(null,i__43486);
if(clojure.string.ends_with_QMARK_(path,"css")){
var seq__43846_44294 = cljs.core.seq(cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(document.querySelectorAll("link[rel=\"stylesheet\"]")));
var chunk__43850_44295 = null;
var count__43851_44296 = (0);
var i__43852_44297 = (0);
while(true){
if((i__43852_44297 < count__43851_44296)){
var node_44298 = chunk__43850_44295.cljs$core$IIndexed$_nth$arity$2(null,i__43852_44297);
if(cljs.core.not(node_44298.shadow$old)){
var path_match_44300 = shadow.cljs.devtools.client.browser.match_paths(node_44298.getAttribute("href"),path);
if(cljs.core.truth_(path_match_44300)){
var new_link_44302 = (function (){var G__43920 = node_44298.cloneNode(true);
G__43920.setAttribute("href",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(path_match_44300),"?r=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.rand.cljs$core$IFn$_invoke$arity$0())].join(''));

return G__43920;
})();
(node_44298.shadow$old = true);

(new_link_44302.onload = ((function (seq__43846_44294,chunk__43850_44295,count__43851_44296,i__43852_44297,seq__43482,chunk__43484,count__43485,i__43486,new_link_44302,path_match_44300,node_44298,path,map__43481,map__43481__$1,msg,updates,reload_info){
return (function (e){
var seq__43922_44304 = cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"reload-info","reload-info",1648088086),new cljs.core.Keyword(null,"asset-load","asset-load",-1925902322)], null)));
var chunk__43924_44305 = null;
var count__43925_44306 = (0);
var i__43926_44307 = (0);
while(true){
if((i__43926_44307 < count__43925_44306)){
var map__43947_44309 = chunk__43924_44305.cljs$core$IIndexed$_nth$arity$2(null,i__43926_44307);
var map__43947_44310__$1 = cljs.core.__destructure_map(map__43947_44309);
var task_44311 = map__43947_44310__$1;
var fn_str_44312 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43947_44310__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_44313 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43947_44310__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_44314 = goog.getObjectByName(fn_str_44312,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_44313)].join(''));

(fn_obj_44314.cljs$core$IFn$_invoke$arity$2 ? fn_obj_44314.cljs$core$IFn$_invoke$arity$2(path,new_link_44302) : fn_obj_44314.call(null,path,new_link_44302));


var G__44315 = seq__43922_44304;
var G__44316 = chunk__43924_44305;
var G__44317 = count__43925_44306;
var G__44318 = (i__43926_44307 + (1));
seq__43922_44304 = G__44315;
chunk__43924_44305 = G__44316;
count__43925_44306 = G__44317;
i__43926_44307 = G__44318;
continue;
} else {
var temp__5804__auto___44319 = cljs.core.seq(seq__43922_44304);
if(temp__5804__auto___44319){
var seq__43922_44320__$1 = temp__5804__auto___44319;
if(cljs.core.chunked_seq_QMARK_(seq__43922_44320__$1)){
var c__5525__auto___44321 = cljs.core.chunk_first(seq__43922_44320__$1);
var G__44322 = cljs.core.chunk_rest(seq__43922_44320__$1);
var G__44323 = c__5525__auto___44321;
var G__44324 = cljs.core.count(c__5525__auto___44321);
var G__44325 = (0);
seq__43922_44304 = G__44322;
chunk__43924_44305 = G__44323;
count__43925_44306 = G__44324;
i__43926_44307 = G__44325;
continue;
} else {
var map__43960_44326 = cljs.core.first(seq__43922_44320__$1);
var map__43960_44327__$1 = cljs.core.__destructure_map(map__43960_44326);
var task_44328 = map__43960_44327__$1;
var fn_str_44329 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43960_44327__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_44330 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43960_44327__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_44331 = goog.getObjectByName(fn_str_44329,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_44330)].join(''));

(fn_obj_44331.cljs$core$IFn$_invoke$arity$2 ? fn_obj_44331.cljs$core$IFn$_invoke$arity$2(path,new_link_44302) : fn_obj_44331.call(null,path,new_link_44302));


var G__44332 = cljs.core.next(seq__43922_44320__$1);
var G__44333 = null;
var G__44334 = (0);
var G__44335 = (0);
seq__43922_44304 = G__44332;
chunk__43924_44305 = G__44333;
count__43925_44306 = G__44334;
i__43926_44307 = G__44335;
continue;
}
} else {
}
}
break;
}

return goog.dom.removeNode(node_44298);
});})(seq__43846_44294,chunk__43850_44295,count__43851_44296,i__43852_44297,seq__43482,chunk__43484,count__43485,i__43486,new_link_44302,path_match_44300,node_44298,path,map__43481,map__43481__$1,msg,updates,reload_info))
);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load CSS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path_match_44300], 0));

goog.dom.insertSiblingAfter(new_link_44302,node_44298);


var G__44336 = seq__43846_44294;
var G__44337 = chunk__43850_44295;
var G__44338 = count__43851_44296;
var G__44339 = (i__43852_44297 + (1));
seq__43846_44294 = G__44336;
chunk__43850_44295 = G__44337;
count__43851_44296 = G__44338;
i__43852_44297 = G__44339;
continue;
} else {
var G__44341 = seq__43846_44294;
var G__44342 = chunk__43850_44295;
var G__44343 = count__43851_44296;
var G__44344 = (i__43852_44297 + (1));
seq__43846_44294 = G__44341;
chunk__43850_44295 = G__44342;
count__43851_44296 = G__44343;
i__43852_44297 = G__44344;
continue;
}
} else {
var G__44345 = seq__43846_44294;
var G__44346 = chunk__43850_44295;
var G__44347 = count__43851_44296;
var G__44348 = (i__43852_44297 + (1));
seq__43846_44294 = G__44345;
chunk__43850_44295 = G__44346;
count__43851_44296 = G__44347;
i__43852_44297 = G__44348;
continue;
}
} else {
var temp__5804__auto___44350 = cljs.core.seq(seq__43846_44294);
if(temp__5804__auto___44350){
var seq__43846_44351__$1 = temp__5804__auto___44350;
if(cljs.core.chunked_seq_QMARK_(seq__43846_44351__$1)){
var c__5525__auto___44352 = cljs.core.chunk_first(seq__43846_44351__$1);
var G__44354 = cljs.core.chunk_rest(seq__43846_44351__$1);
var G__44355 = c__5525__auto___44352;
var G__44356 = cljs.core.count(c__5525__auto___44352);
var G__44357 = (0);
seq__43846_44294 = G__44354;
chunk__43850_44295 = G__44355;
count__43851_44296 = G__44356;
i__43852_44297 = G__44357;
continue;
} else {
var node_44359 = cljs.core.first(seq__43846_44351__$1);
if(cljs.core.not(node_44359.shadow$old)){
var path_match_44360 = shadow.cljs.devtools.client.browser.match_paths(node_44359.getAttribute("href"),path);
if(cljs.core.truth_(path_match_44360)){
var new_link_44363 = (function (){var G__43966 = node_44359.cloneNode(true);
G__43966.setAttribute("href",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(path_match_44360),"?r=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.rand.cljs$core$IFn$_invoke$arity$0())].join(''));

return G__43966;
})();
(node_44359.shadow$old = true);

(new_link_44363.onload = ((function (seq__43846_44294,chunk__43850_44295,count__43851_44296,i__43852_44297,seq__43482,chunk__43484,count__43485,i__43486,new_link_44363,path_match_44360,node_44359,seq__43846_44351__$1,temp__5804__auto___44350,path,map__43481,map__43481__$1,msg,updates,reload_info){
return (function (e){
var seq__43978_44364 = cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"reload-info","reload-info",1648088086),new cljs.core.Keyword(null,"asset-load","asset-load",-1925902322)], null)));
var chunk__43980_44365 = null;
var count__43981_44366 = (0);
var i__43982_44367 = (0);
while(true){
if((i__43982_44367 < count__43981_44366)){
var map__44000_44370 = chunk__43980_44365.cljs$core$IIndexed$_nth$arity$2(null,i__43982_44367);
var map__44000_44371__$1 = cljs.core.__destructure_map(map__44000_44370);
var task_44372 = map__44000_44371__$1;
var fn_str_44373 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44000_44371__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_44374 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44000_44371__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_44376 = goog.getObjectByName(fn_str_44373,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_44374)].join(''));

(fn_obj_44376.cljs$core$IFn$_invoke$arity$2 ? fn_obj_44376.cljs$core$IFn$_invoke$arity$2(path,new_link_44363) : fn_obj_44376.call(null,path,new_link_44363));


var G__44380 = seq__43978_44364;
var G__44381 = chunk__43980_44365;
var G__44382 = count__43981_44366;
var G__44383 = (i__43982_44367 + (1));
seq__43978_44364 = G__44380;
chunk__43980_44365 = G__44381;
count__43981_44366 = G__44382;
i__43982_44367 = G__44383;
continue;
} else {
var temp__5804__auto___44384__$1 = cljs.core.seq(seq__43978_44364);
if(temp__5804__auto___44384__$1){
var seq__43978_44385__$1 = temp__5804__auto___44384__$1;
if(cljs.core.chunked_seq_QMARK_(seq__43978_44385__$1)){
var c__5525__auto___44386 = cljs.core.chunk_first(seq__43978_44385__$1);
var G__44387 = cljs.core.chunk_rest(seq__43978_44385__$1);
var G__44388 = c__5525__auto___44386;
var G__44389 = cljs.core.count(c__5525__auto___44386);
var G__44390 = (0);
seq__43978_44364 = G__44387;
chunk__43980_44365 = G__44388;
count__43981_44366 = G__44389;
i__43982_44367 = G__44390;
continue;
} else {
var map__44006_44391 = cljs.core.first(seq__43978_44385__$1);
var map__44006_44392__$1 = cljs.core.__destructure_map(map__44006_44391);
var task_44393 = map__44006_44392__$1;
var fn_str_44394 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44006_44392__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_44395 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44006_44392__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_44397 = goog.getObjectByName(fn_str_44394,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_44395)].join(''));

(fn_obj_44397.cljs$core$IFn$_invoke$arity$2 ? fn_obj_44397.cljs$core$IFn$_invoke$arity$2(path,new_link_44363) : fn_obj_44397.call(null,path,new_link_44363));


var G__44398 = cljs.core.next(seq__43978_44385__$1);
var G__44399 = null;
var G__44400 = (0);
var G__44401 = (0);
seq__43978_44364 = G__44398;
chunk__43980_44365 = G__44399;
count__43981_44366 = G__44400;
i__43982_44367 = G__44401;
continue;
}
} else {
}
}
break;
}

return goog.dom.removeNode(node_44359);
});})(seq__43846_44294,chunk__43850_44295,count__43851_44296,i__43852_44297,seq__43482,chunk__43484,count__43485,i__43486,new_link_44363,path_match_44360,node_44359,seq__43846_44351__$1,temp__5804__auto___44350,path,map__43481,map__43481__$1,msg,updates,reload_info))
);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load CSS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path_match_44360], 0));

goog.dom.insertSiblingAfter(new_link_44363,node_44359);


var G__44403 = cljs.core.next(seq__43846_44351__$1);
var G__44404 = null;
var G__44405 = (0);
var G__44406 = (0);
seq__43846_44294 = G__44403;
chunk__43850_44295 = G__44404;
count__43851_44296 = G__44405;
i__43852_44297 = G__44406;
continue;
} else {
var G__44408 = cljs.core.next(seq__43846_44351__$1);
var G__44409 = null;
var G__44410 = (0);
var G__44411 = (0);
seq__43846_44294 = G__44408;
chunk__43850_44295 = G__44409;
count__43851_44296 = G__44410;
i__43852_44297 = G__44411;
continue;
}
} else {
var G__44412 = cljs.core.next(seq__43846_44351__$1);
var G__44413 = null;
var G__44414 = (0);
var G__44415 = (0);
seq__43846_44294 = G__44412;
chunk__43850_44295 = G__44413;
count__43851_44296 = G__44414;
i__43852_44297 = G__44415;
continue;
}
}
} else {
}
}
break;
}


var G__44416 = seq__43482;
var G__44417 = chunk__43484;
var G__44418 = count__43485;
var G__44419 = (i__43486 + (1));
seq__43482 = G__44416;
chunk__43484 = G__44417;
count__43485 = G__44418;
i__43486 = G__44419;
continue;
} else {
var G__44420 = seq__43482;
var G__44421 = chunk__43484;
var G__44422 = count__43485;
var G__44423 = (i__43486 + (1));
seq__43482 = G__44420;
chunk__43484 = G__44421;
count__43485 = G__44422;
i__43486 = G__44423;
continue;
}
} else {
var temp__5804__auto__ = cljs.core.seq(seq__43482);
if(temp__5804__auto__){
var seq__43482__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__43482__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__43482__$1);
var G__44439 = cljs.core.chunk_rest(seq__43482__$1);
var G__44440 = c__5525__auto__;
var G__44441 = cljs.core.count(c__5525__auto__);
var G__44442 = (0);
seq__43482 = G__44439;
chunk__43484 = G__44440;
count__43485 = G__44441;
i__43486 = G__44442;
continue;
} else {
var path = cljs.core.first(seq__43482__$1);
if(clojure.string.ends_with_QMARK_(path,"css")){
var seq__44012_44446 = cljs.core.seq(cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(document.querySelectorAll("link[rel=\"stylesheet\"]")));
var chunk__44016_44448 = null;
var count__44017_44449 = (0);
var i__44018_44450 = (0);
while(true){
if((i__44018_44450 < count__44017_44449)){
var node_44453 = chunk__44016_44448.cljs$core$IIndexed$_nth$arity$2(null,i__44018_44450);
if(cljs.core.not(node_44453.shadow$old)){
var path_match_44454 = shadow.cljs.devtools.client.browser.match_paths(node_44453.getAttribute("href"),path);
if(cljs.core.truth_(path_match_44454)){
var new_link_44455 = (function (){var G__44098 = node_44453.cloneNode(true);
G__44098.setAttribute("href",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(path_match_44454),"?r=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.rand.cljs$core$IFn$_invoke$arity$0())].join(''));

return G__44098;
})();
(node_44453.shadow$old = true);

(new_link_44455.onload = ((function (seq__44012_44446,chunk__44016_44448,count__44017_44449,i__44018_44450,seq__43482,chunk__43484,count__43485,i__43486,new_link_44455,path_match_44454,node_44453,path,seq__43482__$1,temp__5804__auto__,map__43481,map__43481__$1,msg,updates,reload_info){
return (function (e){
var seq__44099_44456 = cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"reload-info","reload-info",1648088086),new cljs.core.Keyword(null,"asset-load","asset-load",-1925902322)], null)));
var chunk__44104_44457 = null;
var count__44105_44458 = (0);
var i__44106_44459 = (0);
while(true){
if((i__44106_44459 < count__44105_44458)){
var map__44112_44460 = chunk__44104_44457.cljs$core$IIndexed$_nth$arity$2(null,i__44106_44459);
var map__44112_44461__$1 = cljs.core.__destructure_map(map__44112_44460);
var task_44462 = map__44112_44461__$1;
var fn_str_44463 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44112_44461__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_44464 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44112_44461__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_44465 = goog.getObjectByName(fn_str_44463,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_44464)].join(''));

(fn_obj_44465.cljs$core$IFn$_invoke$arity$2 ? fn_obj_44465.cljs$core$IFn$_invoke$arity$2(path,new_link_44455) : fn_obj_44465.call(null,path,new_link_44455));


var G__44466 = seq__44099_44456;
var G__44467 = chunk__44104_44457;
var G__44468 = count__44105_44458;
var G__44469 = (i__44106_44459 + (1));
seq__44099_44456 = G__44466;
chunk__44104_44457 = G__44467;
count__44105_44458 = G__44468;
i__44106_44459 = G__44469;
continue;
} else {
var temp__5804__auto___44473__$1 = cljs.core.seq(seq__44099_44456);
if(temp__5804__auto___44473__$1){
var seq__44099_44474__$1 = temp__5804__auto___44473__$1;
if(cljs.core.chunked_seq_QMARK_(seq__44099_44474__$1)){
var c__5525__auto___44475 = cljs.core.chunk_first(seq__44099_44474__$1);
var G__44476 = cljs.core.chunk_rest(seq__44099_44474__$1);
var G__44477 = c__5525__auto___44475;
var G__44478 = cljs.core.count(c__5525__auto___44475);
var G__44479 = (0);
seq__44099_44456 = G__44476;
chunk__44104_44457 = G__44477;
count__44105_44458 = G__44478;
i__44106_44459 = G__44479;
continue;
} else {
var map__44113_44480 = cljs.core.first(seq__44099_44474__$1);
var map__44113_44481__$1 = cljs.core.__destructure_map(map__44113_44480);
var task_44482 = map__44113_44481__$1;
var fn_str_44483 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44113_44481__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_44484 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44113_44481__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_44485 = goog.getObjectByName(fn_str_44483,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_44484)].join(''));

(fn_obj_44485.cljs$core$IFn$_invoke$arity$2 ? fn_obj_44485.cljs$core$IFn$_invoke$arity$2(path,new_link_44455) : fn_obj_44485.call(null,path,new_link_44455));


var G__44486 = cljs.core.next(seq__44099_44474__$1);
var G__44487 = null;
var G__44488 = (0);
var G__44489 = (0);
seq__44099_44456 = G__44486;
chunk__44104_44457 = G__44487;
count__44105_44458 = G__44488;
i__44106_44459 = G__44489;
continue;
}
} else {
}
}
break;
}

return goog.dom.removeNode(node_44453);
});})(seq__44012_44446,chunk__44016_44448,count__44017_44449,i__44018_44450,seq__43482,chunk__43484,count__43485,i__43486,new_link_44455,path_match_44454,node_44453,path,seq__43482__$1,temp__5804__auto__,map__43481,map__43481__$1,msg,updates,reload_info))
);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load CSS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path_match_44454], 0));

goog.dom.insertSiblingAfter(new_link_44455,node_44453);


var G__44491 = seq__44012_44446;
var G__44492 = chunk__44016_44448;
var G__44493 = count__44017_44449;
var G__44494 = (i__44018_44450 + (1));
seq__44012_44446 = G__44491;
chunk__44016_44448 = G__44492;
count__44017_44449 = G__44493;
i__44018_44450 = G__44494;
continue;
} else {
var G__44495 = seq__44012_44446;
var G__44496 = chunk__44016_44448;
var G__44497 = count__44017_44449;
var G__44498 = (i__44018_44450 + (1));
seq__44012_44446 = G__44495;
chunk__44016_44448 = G__44496;
count__44017_44449 = G__44497;
i__44018_44450 = G__44498;
continue;
}
} else {
var G__44499 = seq__44012_44446;
var G__44500 = chunk__44016_44448;
var G__44501 = count__44017_44449;
var G__44502 = (i__44018_44450 + (1));
seq__44012_44446 = G__44499;
chunk__44016_44448 = G__44500;
count__44017_44449 = G__44501;
i__44018_44450 = G__44502;
continue;
}
} else {
var temp__5804__auto___44504__$1 = cljs.core.seq(seq__44012_44446);
if(temp__5804__auto___44504__$1){
var seq__44012_44505__$1 = temp__5804__auto___44504__$1;
if(cljs.core.chunked_seq_QMARK_(seq__44012_44505__$1)){
var c__5525__auto___44506 = cljs.core.chunk_first(seq__44012_44505__$1);
var G__44507 = cljs.core.chunk_rest(seq__44012_44505__$1);
var G__44508 = c__5525__auto___44506;
var G__44509 = cljs.core.count(c__5525__auto___44506);
var G__44510 = (0);
seq__44012_44446 = G__44507;
chunk__44016_44448 = G__44508;
count__44017_44449 = G__44509;
i__44018_44450 = G__44510;
continue;
} else {
var node_44511 = cljs.core.first(seq__44012_44505__$1);
if(cljs.core.not(node_44511.shadow$old)){
var path_match_44512 = shadow.cljs.devtools.client.browser.match_paths(node_44511.getAttribute("href"),path);
if(cljs.core.truth_(path_match_44512)){
var new_link_44513 = (function (){var G__44120 = node_44511.cloneNode(true);
G__44120.setAttribute("href",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(path_match_44512),"?r=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.rand.cljs$core$IFn$_invoke$arity$0())].join(''));

return G__44120;
})();
(node_44511.shadow$old = true);

(new_link_44513.onload = ((function (seq__44012_44446,chunk__44016_44448,count__44017_44449,i__44018_44450,seq__43482,chunk__43484,count__43485,i__43486,new_link_44513,path_match_44512,node_44511,seq__44012_44505__$1,temp__5804__auto___44504__$1,path,seq__43482__$1,temp__5804__auto__,map__43481,map__43481__$1,msg,updates,reload_info){
return (function (e){
var seq__44121_44517 = cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"reload-info","reload-info",1648088086),new cljs.core.Keyword(null,"asset-load","asset-load",-1925902322)], null)));
var chunk__44123_44518 = null;
var count__44124_44519 = (0);
var i__44125_44520 = (0);
while(true){
if((i__44125_44520 < count__44124_44519)){
var map__44141_44521 = chunk__44123_44518.cljs$core$IIndexed$_nth$arity$2(null,i__44125_44520);
var map__44141_44522__$1 = cljs.core.__destructure_map(map__44141_44521);
var task_44523 = map__44141_44522__$1;
var fn_str_44524 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44141_44522__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_44525 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44141_44522__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_44526 = goog.getObjectByName(fn_str_44524,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_44525)].join(''));

(fn_obj_44526.cljs$core$IFn$_invoke$arity$2 ? fn_obj_44526.cljs$core$IFn$_invoke$arity$2(path,new_link_44513) : fn_obj_44526.call(null,path,new_link_44513));


var G__44528 = seq__44121_44517;
var G__44529 = chunk__44123_44518;
var G__44530 = count__44124_44519;
var G__44531 = (i__44125_44520 + (1));
seq__44121_44517 = G__44528;
chunk__44123_44518 = G__44529;
count__44124_44519 = G__44530;
i__44125_44520 = G__44531;
continue;
} else {
var temp__5804__auto___44532__$2 = cljs.core.seq(seq__44121_44517);
if(temp__5804__auto___44532__$2){
var seq__44121_44533__$1 = temp__5804__auto___44532__$2;
if(cljs.core.chunked_seq_QMARK_(seq__44121_44533__$1)){
var c__5525__auto___44534 = cljs.core.chunk_first(seq__44121_44533__$1);
var G__44535 = cljs.core.chunk_rest(seq__44121_44533__$1);
var G__44536 = c__5525__auto___44534;
var G__44537 = cljs.core.count(c__5525__auto___44534);
var G__44538 = (0);
seq__44121_44517 = G__44535;
chunk__44123_44518 = G__44536;
count__44124_44519 = G__44537;
i__44125_44520 = G__44538;
continue;
} else {
var map__44143_44539 = cljs.core.first(seq__44121_44533__$1);
var map__44143_44540__$1 = cljs.core.__destructure_map(map__44143_44539);
var task_44541 = map__44143_44540__$1;
var fn_str_44542 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44143_44540__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_44543 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44143_44540__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_44544 = goog.getObjectByName(fn_str_44542,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_44543)].join(''));

(fn_obj_44544.cljs$core$IFn$_invoke$arity$2 ? fn_obj_44544.cljs$core$IFn$_invoke$arity$2(path,new_link_44513) : fn_obj_44544.call(null,path,new_link_44513));


var G__44545 = cljs.core.next(seq__44121_44533__$1);
var G__44546 = null;
var G__44547 = (0);
var G__44548 = (0);
seq__44121_44517 = G__44545;
chunk__44123_44518 = G__44546;
count__44124_44519 = G__44547;
i__44125_44520 = G__44548;
continue;
}
} else {
}
}
break;
}

return goog.dom.removeNode(node_44511);
});})(seq__44012_44446,chunk__44016_44448,count__44017_44449,i__44018_44450,seq__43482,chunk__43484,count__43485,i__43486,new_link_44513,path_match_44512,node_44511,seq__44012_44505__$1,temp__5804__auto___44504__$1,path,seq__43482__$1,temp__5804__auto__,map__43481,map__43481__$1,msg,updates,reload_info))
);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load CSS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path_match_44512], 0));

goog.dom.insertSiblingAfter(new_link_44513,node_44511);


var G__44552 = cljs.core.next(seq__44012_44505__$1);
var G__44553 = null;
var G__44554 = (0);
var G__44555 = (0);
seq__44012_44446 = G__44552;
chunk__44016_44448 = G__44553;
count__44017_44449 = G__44554;
i__44018_44450 = G__44555;
continue;
} else {
var G__44556 = cljs.core.next(seq__44012_44505__$1);
var G__44557 = null;
var G__44558 = (0);
var G__44559 = (0);
seq__44012_44446 = G__44556;
chunk__44016_44448 = G__44557;
count__44017_44449 = G__44558;
i__44018_44450 = G__44559;
continue;
}
} else {
var G__44560 = cljs.core.next(seq__44012_44505__$1);
var G__44561 = null;
var G__44562 = (0);
var G__44563 = (0);
seq__44012_44446 = G__44560;
chunk__44016_44448 = G__44561;
count__44017_44449 = G__44562;
i__44018_44450 = G__44563;
continue;
}
}
} else {
}
}
break;
}


var G__44564 = cljs.core.next(seq__43482__$1);
var G__44565 = null;
var G__44566 = (0);
var G__44567 = (0);
seq__43482 = G__44564;
chunk__43484 = G__44565;
count__43485 = G__44566;
i__43486 = G__44567;
continue;
} else {
var G__44569 = cljs.core.next(seq__43482__$1);
var G__44570 = null;
var G__44571 = (0);
var G__44572 = (0);
seq__43482 = G__44569;
chunk__43484 = G__44570;
count__43485 = G__44571;
i__43486 = G__44572;
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
shadow.cljs.devtools.client.browser.global_eval = (function shadow$cljs$devtools$client$browser$global_eval(js){
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2("undefined",typeof(module))){
return eval(js);
} else {
return (0,eval)(js);;
}
});
shadow.cljs.devtools.client.browser.runtime_info = (((typeof SHADOW_CONFIG !== 'undefined'))?shadow.json.to_clj.cljs$core$IFn$_invoke$arity$1(SHADOW_CONFIG):null);
shadow.cljs.devtools.client.browser.client_info = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([shadow.cljs.devtools.client.browser.runtime_info,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"host","host",-1558485167),(cljs.core.truth_(goog.global.document)?new cljs.core.Keyword(null,"browser","browser",828191719):new cljs.core.Keyword(null,"browser-worker","browser-worker",1638998282)),new cljs.core.Keyword(null,"user-agent","user-agent",1220426212),[(cljs.core.truth_(goog.userAgent.OPERA)?"Opera":(cljs.core.truth_(goog.userAgent.product.CHROME)?"Chrome":(cljs.core.truth_(goog.userAgent.IE)?"MSIE":(cljs.core.truth_(goog.userAgent.EDGE)?"Edge":(cljs.core.truth_(goog.userAgent.GECKO)?"Firefox":(cljs.core.truth_(goog.userAgent.SAFARI)?"Safari":(cljs.core.truth_(goog.userAgent.WEBKIT)?"Webkit":null)))))))," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(goog.userAgent.VERSION)," [",cljs.core.str.cljs$core$IFn$_invoke$arity$1(goog.userAgent.PLATFORM),"]"].join(''),new cljs.core.Keyword(null,"dom","dom",-1236537922),(!((goog.global.document == null)))], null)], 0));
if((typeof shadow !== 'undefined') && (typeof shadow.cljs !== 'undefined') && (typeof shadow.cljs.devtools !== 'undefined') && (typeof shadow.cljs.devtools.client !== 'undefined') && (typeof shadow.cljs.devtools.client.browser !== 'undefined') && (typeof shadow.cljs.devtools.client.browser.ws_was_welcome_ref !== 'undefined')){
} else {
shadow.cljs.devtools.client.browser.ws_was_welcome_ref = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
if(((shadow.cljs.devtools.client.env.enabled) && ((shadow.cljs.devtools.client.env.worker_client_id > (0))))){
(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$remote$runtime$api$IEvalJS$ = cljs.core.PROTOCOL_SENTINEL);

(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$remote$runtime$api$IEvalJS$_js_eval$arity$4 = (function (this$,code,success,fail){
var this$__$1 = this;
try{var G__44156 = shadow.cljs.devtools.client.browser.global_eval(code);
return (success.cljs$core$IFn$_invoke$arity$1 ? success.cljs$core$IFn$_invoke$arity$1(G__44156) : success.call(null,G__44156));
}catch (e44155){var e = e44155;
return (fail.cljs$core$IFn$_invoke$arity$1 ? fail.cljs$core$IFn$_invoke$arity$1(e) : fail.call(null,e));
}}));

(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$cljs$devtools$client$shared$IHostSpecific$ = cljs.core.PROTOCOL_SENTINEL);

(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$cljs$devtools$client$shared$IHostSpecific$do_invoke$arity$5 = (function (this$,ns,p__44157,success,fail){
var map__44158 = p__44157;
var map__44158__$1 = cljs.core.__destructure_map(map__44158);
var js = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44158__$1,new cljs.core.Keyword(null,"js","js",1768080579));
var this$__$1 = this;
try{var G__44160 = shadow.cljs.devtools.client.browser.global_eval(js);
return (success.cljs$core$IFn$_invoke$arity$1 ? success.cljs$core$IFn$_invoke$arity$1(G__44160) : success.call(null,G__44160));
}catch (e44159){var e = e44159;
return (fail.cljs$core$IFn$_invoke$arity$1 ? fail.cljs$core$IFn$_invoke$arity$1(e) : fail.call(null,e));
}}));

(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$cljs$devtools$client$shared$IHostSpecific$do_repl_init$arity$4 = (function (runtime,p__44161,done,error){
var map__44162 = p__44161;
var map__44162__$1 = cljs.core.__destructure_map(map__44162);
var repl_sources = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44162__$1,new cljs.core.Keyword(null,"repl-sources","repl-sources",723867535));
var runtime__$1 = this;
return shadow.cljs.devtools.client.shared.load_sources(runtime__$1,cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(shadow.cljs.devtools.client.env.src_is_loaded_QMARK_,repl_sources)),(function (sources){
shadow.cljs.devtools.client.browser.do_js_load(sources);

return (done.cljs$core$IFn$_invoke$arity$0 ? done.cljs$core$IFn$_invoke$arity$0() : done.call(null));
}));
}));

(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$cljs$devtools$client$shared$IHostSpecific$do_repl_require$arity$4 = (function (runtime,p__44163,done,error){
var map__44164 = p__44163;
var map__44164__$1 = cljs.core.__destructure_map(map__44164);
var msg = map__44164__$1;
var sources = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44164__$1,new cljs.core.Keyword(null,"sources","sources",-321166424));
var reload_namespaces = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44164__$1,new cljs.core.Keyword(null,"reload-namespaces","reload-namespaces",250210134));
var js_requires = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44164__$1,new cljs.core.Keyword(null,"js-requires","js-requires",-1311472051));
var runtime__$1 = this;
var sources_to_load = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__44165){
var map__44166 = p__44165;
var map__44166__$1 = cljs.core.__destructure_map(map__44166);
var src = map__44166__$1;
var provides = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44166__$1,new cljs.core.Keyword(null,"provides","provides",-1634397992));
var and__5000__auto__ = shadow.cljs.devtools.client.env.src_is_loaded_QMARK_(src);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(cljs.core.some(reload_namespaces,provides));
} else {
return and__5000__auto__;
}
}),sources));
if(cljs.core.not(cljs.core.seq(sources_to_load))){
var G__44169 = cljs.core.PersistentVector.EMPTY;
return (done.cljs$core$IFn$_invoke$arity$1 ? done.cljs$core$IFn$_invoke$arity$1(G__44169) : done.call(null,G__44169));
} else {
return shadow.remote.runtime.shared.call.cljs$core$IFn$_invoke$arity$3(runtime__$1,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"cljs-load-sources","cljs-load-sources",-1458295962),new cljs.core.Keyword(null,"to","to",192099007),shadow.cljs.devtools.client.env.worker_client_id,new cljs.core.Keyword(null,"sources","sources",-321166424),cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"resource-id","resource-id",-1308422582)),sources_to_load)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"cljs-sources","cljs-sources",31121610),(function (p__44170){
var map__44171 = p__44170;
var map__44171__$1 = cljs.core.__destructure_map(map__44171);
var msg__$1 = map__44171__$1;
var sources__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44171__$1,new cljs.core.Keyword(null,"sources","sources",-321166424));
try{shadow.cljs.devtools.client.browser.do_js_load(sources__$1);

if(cljs.core.seq(js_requires)){
shadow.cljs.devtools.client.browser.do_js_requires(js_requires);
} else {
}

return (done.cljs$core$IFn$_invoke$arity$1 ? done.cljs$core$IFn$_invoke$arity$1(sources_to_load) : done.call(null,sources_to_load));
}catch (e44172){var ex = e44172;
return (error.cljs$core$IFn$_invoke$arity$1 ? error.cljs$core$IFn$_invoke$arity$1(ex) : error.call(null,ex));
}})], null));
}
}));

shadow.cljs.devtools.client.shared.add_plugin_BANG_(new cljs.core.Keyword("shadow.cljs.devtools.client.browser","client","shadow.cljs.devtools.client.browser/client",-1461019282),cljs.core.PersistentHashSet.EMPTY,(function (p__44173){
var map__44174 = p__44173;
var map__44174__$1 = cljs.core.__destructure_map(map__44174);
var env = map__44174__$1;
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44174__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
var svc = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"runtime","runtime",-1331573996),runtime], null);
shadow.remote.runtime.api.add_extension(runtime,new cljs.core.Keyword("shadow.cljs.devtools.client.browser","client","shadow.cljs.devtools.client.browser/client",-1461019282),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"on-welcome","on-welcome",1895317125),(function (){
cljs.core.reset_BANG_(shadow.cljs.devtools.client.browser.ws_was_welcome_ref,true);

shadow.cljs.devtools.client.hud.connection_error_clear_BANG_();

shadow.cljs.devtools.client.env.patch_goog_BANG_();

return shadow.cljs.devtools.client.browser.devtools_msg(["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(new cljs.core.Keyword(null,"state-ref","state-ref",2127874952).cljs$core$IFn$_invoke$arity$1(runtime))))," ready!"].join(''));
}),new cljs.core.Keyword(null,"on-disconnect","on-disconnect",-809021814),(function (e){
if(cljs.core.truth_(cljs.core.deref(shadow.cljs.devtools.client.browser.ws_was_welcome_ref))){
shadow.cljs.devtools.client.hud.connection_error("The Websocket connection was closed!");

return cljs.core.reset_BANG_(shadow.cljs.devtools.client.browser.ws_was_welcome_ref,false);
} else {
return null;
}
}),new cljs.core.Keyword(null,"on-reconnect","on-reconnect",1239988702),(function (e){
return shadow.cljs.devtools.client.hud.connection_error("Reconnecting ...");
}),new cljs.core.Keyword(null,"ops","ops",1237330063),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"access-denied","access-denied",959449406),(function (msg){
cljs.core.reset_BANG_(shadow.cljs.devtools.client.browser.ws_was_welcome_ref,false);

return shadow.cljs.devtools.client.hud.connection_error(["Stale Output! Your loaded JS was not produced by the running shadow-cljs instance."," Is the watch for this build running?"].join(''));
}),new cljs.core.Keyword(null,"cljs-asset-update","cljs-asset-update",1224093028),(function (msg){
return shadow.cljs.devtools.client.browser.handle_asset_update(msg);
}),new cljs.core.Keyword(null,"cljs-build-configure","cljs-build-configure",-2089891268),(function (msg){
return null;
}),new cljs.core.Keyword(null,"cljs-build-start","cljs-build-start",-725781241),(function (msg){
shadow.cljs.devtools.client.hud.hud_hide();

shadow.cljs.devtools.client.hud.load_start();

return shadow.cljs.devtools.client.env.run_custom_notify_BANG_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(msg,new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"build-start","build-start",-959649480)));
}),new cljs.core.Keyword(null,"cljs-build-complete","cljs-build-complete",273626153),(function (msg){
var msg__$1 = shadow.cljs.devtools.client.env.add_warnings_to_info(msg);
shadow.cljs.devtools.client.hud.connection_error_clear_BANG_();

shadow.cljs.devtools.client.hud.hud_warnings(msg__$1);

shadow.cljs.devtools.client.browser.handle_build_complete(runtime,msg__$1);

return shadow.cljs.devtools.client.env.run_custom_notify_BANG_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(msg__$1,new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"build-complete","build-complete",-501868472)));
}),new cljs.core.Keyword(null,"cljs-build-failure","cljs-build-failure",1718154990),(function (msg){
shadow.cljs.devtools.client.hud.load_end();

shadow.cljs.devtools.client.hud.hud_error(msg);

return shadow.cljs.devtools.client.env.run_custom_notify_BANG_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(msg,new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"build-failure","build-failure",-2107487466)));
}),new cljs.core.Keyword("shadow.cljs.devtools.client.env","worker-notify","shadow.cljs.devtools.client.env/worker-notify",-1456820670),(function (p__44177){
var map__44178 = p__44177;
var map__44178__$1 = cljs.core.__destructure_map(map__44178);
var event_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44178__$1,new cljs.core.Keyword(null,"event-op","event-op",200358057));
var client_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44178__$1,new cljs.core.Keyword(null,"client-id","client-id",-464622140));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"client-disconnect","client-disconnect",640227957),event_op)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(client_id,shadow.cljs.devtools.client.env.worker_client_id)))){
shadow.cljs.devtools.client.hud.connection_error_clear_BANG_();

return shadow.cljs.devtools.client.hud.connection_error("The watch for this build was stopped!");
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"client-connect","client-connect",-1113973888),event_op)){
shadow.cljs.devtools.client.hud.connection_error_clear_BANG_();

return shadow.cljs.devtools.client.hud.connection_error("The watch for this build was restarted. Reload required!");
} else {
return null;
}
}
})], null)], null));

return svc;
}),(function (p__44181){
var map__44182 = p__44181;
var map__44182__$1 = cljs.core.__destructure_map(map__44182);
var svc = map__44182__$1;
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__44182__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
return shadow.remote.runtime.api.del_extension(runtime,new cljs.core.Keyword("shadow.cljs.devtools.client.browser","client","shadow.cljs.devtools.client.browser/client",-1461019282));
}));

shadow.cljs.devtools.client.shared.init_runtime_BANG_(shadow.cljs.devtools.client.browser.client_info,shadow.cljs.devtools.client.websocket.start,shadow.cljs.devtools.client.websocket.send,shadow.cljs.devtools.client.websocket.stop);
} else {
}

//# sourceMappingURL=shadow.cljs.devtools.client.browser.js.map
