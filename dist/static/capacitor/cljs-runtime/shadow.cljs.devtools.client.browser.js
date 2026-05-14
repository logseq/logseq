goog.provide('shadow.cljs.devtools.client.browser');
shadow.cljs.devtools.client.browser.devtools_msg = (function shadow$cljs$devtools$client$browser$devtools_msg(var_args){
var args__5732__auto__ = [];
var len__5726__auto___43972 = arguments.length;
var i__5727__auto___43973 = (0);
while(true){
if((i__5727__auto___43973 < len__5726__auto___43972)){
args__5732__auto__.push((arguments[i__5727__auto___43973]));

var G__43974 = (i__5727__auto___43973 + (1));
i__5727__auto___43973 = G__43974;
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
(shadow.cljs.devtools.client.browser.devtools_msg.cljs$lang$applyTo = (function (seq43452){
var G__43453 = cljs.core.first(seq43452);
var seq43452__$1 = cljs.core.next(seq43452);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__43453,seq43452__$1);
}));

shadow.cljs.devtools.client.browser.script_eval = (function shadow$cljs$devtools$client$browser$script_eval(code){
return goog.globalEval(code);
});
shadow.cljs.devtools.client.browser.do_js_load = (function shadow$cljs$devtools$client$browser$do_js_load(sources){
var seq__43456 = cljs.core.seq(sources);
var chunk__43457 = null;
var count__43458 = (0);
var i__43459 = (0);
while(true){
if((i__43459 < count__43458)){
var map__43471 = chunk__43457.cljs$core$IIndexed$_nth$arity$2(null,i__43459);
var map__43471__$1 = cljs.core.__destructure_map(map__43471);
var src = map__43471__$1;
var resource_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43471__$1,new cljs.core.Keyword(null,"resource-id","resource-id",-1308422582));
var output_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43471__$1,new cljs.core.Keyword(null,"output-name","output-name",-1769107767));
var resource_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43471__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
var js = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43471__$1,new cljs.core.Keyword(null,"js","js",1768080579));
$CLJS.SHADOW_ENV.setLoaded(output_name);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load JS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([resource_name], 0));

shadow.cljs.devtools.client.env.before_load_src(src);

try{shadow.cljs.devtools.client.browser.script_eval([cljs.core.str.cljs$core$IFn$_invoke$arity$1(js),"\n//# sourceURL=",cljs.core.str.cljs$core$IFn$_invoke$arity$1($CLJS.SHADOW_ENV.scriptBase),cljs.core.str.cljs$core$IFn$_invoke$arity$1(output_name)].join(''));
}catch (e43472){var e_43976 = e43472;
if(shadow.cljs.devtools.client.env.log){
console.error(["Failed to load ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name)].join(''),e_43976);
} else {
}

throw (new Error(["Failed to load ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e_43976.message)].join('')));
}

var G__43977 = seq__43456;
var G__43978 = chunk__43457;
var G__43979 = count__43458;
var G__43980 = (i__43459 + (1));
seq__43456 = G__43977;
chunk__43457 = G__43978;
count__43458 = G__43979;
i__43459 = G__43980;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__43456);
if(temp__5804__auto__){
var seq__43456__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__43456__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__43456__$1);
var G__43981 = cljs.core.chunk_rest(seq__43456__$1);
var G__43982 = c__5525__auto__;
var G__43983 = cljs.core.count(c__5525__auto__);
var G__43984 = (0);
seq__43456 = G__43981;
chunk__43457 = G__43982;
count__43458 = G__43983;
i__43459 = G__43984;
continue;
} else {
var map__43474 = cljs.core.first(seq__43456__$1);
var map__43474__$1 = cljs.core.__destructure_map(map__43474);
var src = map__43474__$1;
var resource_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43474__$1,new cljs.core.Keyword(null,"resource-id","resource-id",-1308422582));
var output_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43474__$1,new cljs.core.Keyword(null,"output-name","output-name",-1769107767));
var resource_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43474__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
var js = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43474__$1,new cljs.core.Keyword(null,"js","js",1768080579));
$CLJS.SHADOW_ENV.setLoaded(output_name);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load JS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([resource_name], 0));

shadow.cljs.devtools.client.env.before_load_src(src);

try{shadow.cljs.devtools.client.browser.script_eval([cljs.core.str.cljs$core$IFn$_invoke$arity$1(js),"\n//# sourceURL=",cljs.core.str.cljs$core$IFn$_invoke$arity$1($CLJS.SHADOW_ENV.scriptBase),cljs.core.str.cljs$core$IFn$_invoke$arity$1(output_name)].join(''));
}catch (e43475){var e_43987 = e43475;
if(shadow.cljs.devtools.client.env.log){
console.error(["Failed to load ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name)].join(''),e_43987);
} else {
}

throw (new Error(["Failed to load ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e_43987.message)].join('')));
}

var G__43988 = cljs.core.next(seq__43456__$1);
var G__43989 = null;
var G__43990 = (0);
var G__43991 = (0);
seq__43456 = G__43988;
chunk__43457 = G__43989;
count__43458 = G__43990;
i__43459 = G__43991;
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
var seq__43476 = cljs.core.seq(js_requires);
var chunk__43477 = null;
var count__43478 = (0);
var i__43479 = (0);
while(true){
if((i__43479 < count__43478)){
var js_ns = chunk__43477.cljs$core$IIndexed$_nth$arity$2(null,i__43479);
var require_str_43997 = ["var ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(js_ns)," = shadow.js.require(\"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(js_ns),"\");"].join('');
shadow.cljs.devtools.client.browser.script_eval(require_str_43997);


var G__44002 = seq__43476;
var G__44003 = chunk__43477;
var G__44004 = count__43478;
var G__44005 = (i__43479 + (1));
seq__43476 = G__44002;
chunk__43477 = G__44003;
count__43478 = G__44004;
i__43479 = G__44005;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__43476);
if(temp__5804__auto__){
var seq__43476__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__43476__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__43476__$1);
var G__44007 = cljs.core.chunk_rest(seq__43476__$1);
var G__44008 = c__5525__auto__;
var G__44009 = cljs.core.count(c__5525__auto__);
var G__44010 = (0);
seq__43476 = G__44007;
chunk__43477 = G__44008;
count__43478 = G__44009;
i__43479 = G__44010;
continue;
} else {
var js_ns = cljs.core.first(seq__43476__$1);
var require_str_44011 = ["var ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(js_ns)," = shadow.js.require(\"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(js_ns),"\");"].join('');
shadow.cljs.devtools.client.browser.script_eval(require_str_44011);


var G__44012 = cljs.core.next(seq__43476__$1);
var G__44013 = null;
var G__44014 = (0);
var G__44015 = (0);
seq__43476 = G__44012;
chunk__43477 = G__44013;
count__43478 = G__44014;
i__43479 = G__44015;
continue;
}
} else {
return null;
}
}
break;
}
});
shadow.cljs.devtools.client.browser.handle_build_complete = (function shadow$cljs$devtools$client$browser$handle_build_complete(runtime,p__43485){
var map__43486 = p__43485;
var map__43486__$1 = cljs.core.__destructure_map(map__43486);
var msg = map__43486__$1;
var info = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43486__$1,new cljs.core.Keyword(null,"info","info",-317069002));
var reload_info = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43486__$1,new cljs.core.Keyword(null,"reload-info","reload-info",1648088086));
var warnings = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__43487(s__43488){
return (new cljs.core.LazySeq(null,(function (){
var s__43488__$1 = s__43488;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__43488__$1);
if(temp__5804__auto__){
var xs__6360__auto__ = temp__5804__auto__;
var map__43493 = cljs.core.first(xs__6360__auto__);
var map__43493__$1 = cljs.core.__destructure_map(map__43493);
var src = map__43493__$1;
var resource_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43493__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
var warnings = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43493__$1,new cljs.core.Keyword(null,"warnings","warnings",-735437651));
if(cljs.core.not(new cljs.core.Keyword(null,"from-jar","from-jar",1050932827).cljs$core$IFn$_invoke$arity$1(src))){
var iterys__5476__auto__ = ((function (s__43488__$1,map__43493,map__43493__$1,src,resource_name,warnings,xs__6360__auto__,temp__5804__auto__,map__43486,map__43486__$1,msg,info,reload_info){
return (function shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__43487_$_iter__43489(s__43490){
return (new cljs.core.LazySeq(null,((function (s__43488__$1,map__43493,map__43493__$1,src,resource_name,warnings,xs__6360__auto__,temp__5804__auto__,map__43486,map__43486__$1,msg,info,reload_info){
return (function (){
var s__43490__$1 = s__43490;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__43490__$1);
if(temp__5804__auto____$1){
var s__43490__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__43490__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__43490__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__43492 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__43491 = (0);
while(true){
if((i__43491 < size__5479__auto__)){
var warning = cljs.core._nth(c__5478__auto__,i__43491);
cljs.core.chunk_append(b__43492,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(warning,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100),resource_name));

var G__44019 = (i__43491 + (1));
i__43491 = G__44019;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__43492),shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__43487_$_iter__43489(cljs.core.chunk_rest(s__43490__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__43492),null);
}
} else {
var warning = cljs.core.first(s__43490__$2);
return cljs.core.cons(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(warning,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100),resource_name),shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__43487_$_iter__43489(cljs.core.rest(s__43490__$2)));
}
} else {
return null;
}
break;
}
});})(s__43488__$1,map__43493,map__43493__$1,src,resource_name,warnings,xs__6360__auto__,temp__5804__auto__,map__43486,map__43486__$1,msg,info,reload_info))
,null,null));
});})(s__43488__$1,map__43493,map__43493__$1,src,resource_name,warnings,xs__6360__auto__,temp__5804__auto__,map__43486,map__43486__$1,msg,info,reload_info))
;
var fs__5477__auto__ = cljs.core.seq(iterys__5476__auto__(warnings));
if(fs__5477__auto__){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(fs__5477__auto__,shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__43487(cljs.core.rest(s__43488__$1)));
} else {
var G__44020 = cljs.core.rest(s__43488__$1);
s__43488__$1 = G__44020;
continue;
}
} else {
var G__44021 = cljs.core.rest(s__43488__$1);
s__43488__$1 = G__44021;
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
var seq__43494_44022 = cljs.core.seq(warnings);
var chunk__43495_44023 = null;
var count__43496_44024 = (0);
var i__43497_44025 = (0);
while(true){
if((i__43497_44025 < count__43496_44024)){
var map__43504_44026 = chunk__43495_44023.cljs$core$IIndexed$_nth$arity$2(null,i__43497_44025);
var map__43504_44027__$1 = cljs.core.__destructure_map(map__43504_44026);
var w_44028 = map__43504_44027__$1;
var msg_44029__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43504_44027__$1,new cljs.core.Keyword(null,"msg","msg",-1386103444));
var line_44030 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43504_44027__$1,new cljs.core.Keyword(null,"line","line",212345235));
var column_44031 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43504_44027__$1,new cljs.core.Keyword(null,"column","column",2078222095));
var resource_name_44032 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43504_44027__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
console.warn(["BUILD-WARNING in ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name_44032)," at [",cljs.core.str.cljs$core$IFn$_invoke$arity$1(line_44030),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(column_44031),"]\n\t",cljs.core.str.cljs$core$IFn$_invoke$arity$1(msg_44029__$1)].join(''));


var G__44033 = seq__43494_44022;
var G__44034 = chunk__43495_44023;
var G__44035 = count__43496_44024;
var G__44036 = (i__43497_44025 + (1));
seq__43494_44022 = G__44033;
chunk__43495_44023 = G__44034;
count__43496_44024 = G__44035;
i__43497_44025 = G__44036;
continue;
} else {
var temp__5804__auto___44037 = cljs.core.seq(seq__43494_44022);
if(temp__5804__auto___44037){
var seq__43494_44038__$1 = temp__5804__auto___44037;
if(cljs.core.chunked_seq_QMARK_(seq__43494_44038__$1)){
var c__5525__auto___44039 = cljs.core.chunk_first(seq__43494_44038__$1);
var G__44040 = cljs.core.chunk_rest(seq__43494_44038__$1);
var G__44041 = c__5525__auto___44039;
var G__44042 = cljs.core.count(c__5525__auto___44039);
var G__44043 = (0);
seq__43494_44022 = G__44040;
chunk__43495_44023 = G__44041;
count__43496_44024 = G__44042;
i__43497_44025 = G__44043;
continue;
} else {
var map__43505_44044 = cljs.core.first(seq__43494_44038__$1);
var map__43505_44045__$1 = cljs.core.__destructure_map(map__43505_44044);
var w_44046 = map__43505_44045__$1;
var msg_44047__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43505_44045__$1,new cljs.core.Keyword(null,"msg","msg",-1386103444));
var line_44048 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43505_44045__$1,new cljs.core.Keyword(null,"line","line",212345235));
var column_44049 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43505_44045__$1,new cljs.core.Keyword(null,"column","column",2078222095));
var resource_name_44050 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43505_44045__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
console.warn(["BUILD-WARNING in ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name_44050)," at [",cljs.core.str.cljs$core$IFn$_invoke$arity$1(line_44048),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(column_44049),"]\n\t",cljs.core.str.cljs$core$IFn$_invoke$arity$1(msg_44047__$1)].join(''));


var G__44051 = cljs.core.next(seq__43494_44038__$1);
var G__44052 = null;
var G__44053 = (0);
var G__44054 = (0);
seq__43494_44022 = G__44051;
chunk__43495_44023 = G__44052;
count__43496_44024 = G__44053;
i__43497_44025 = G__44054;
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

return shadow.cljs.devtools.client.shared.load_sources(runtime,sources_to_get,(function (p1__43484_SHARP_){
return shadow.cljs.devtools.client.browser.do_js_reload(msg,p1__43484_SHARP_,shadow.cljs.devtools.client.hud.load_end_success,shadow.cljs.devtools.client.hud.load_failure);
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
return cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__43507 = node_uri;
G__43507.setQuery(null);

G__43507.setPath(new$);

return G__43507;
})());
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
});
shadow.cljs.devtools.client.browser.handle_asset_update = (function shadow$cljs$devtools$client$browser$handle_asset_update(p__43510){
var map__43511 = p__43510;
var map__43511__$1 = cljs.core.__destructure_map(map__43511);
var msg = map__43511__$1;
var updates = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43511__$1,new cljs.core.Keyword(null,"updates","updates",2013983452));
var reload_info = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43511__$1,new cljs.core.Keyword(null,"reload-info","reload-info",1648088086));
var seq__43512 = cljs.core.seq(updates);
var chunk__43514 = null;
var count__43515 = (0);
var i__43516 = (0);
while(true){
if((i__43516 < count__43515)){
var path = chunk__43514.cljs$core$IIndexed$_nth$arity$2(null,i__43516);
if(clojure.string.ends_with_QMARK_(path,"css")){
var seq__43695_44060 = cljs.core.seq(cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(document.querySelectorAll("link[rel=\"stylesheet\"]")));
var chunk__43699_44061 = null;
var count__43700_44062 = (0);
var i__43701_44063 = (0);
while(true){
if((i__43701_44063 < count__43700_44062)){
var node_44064 = chunk__43699_44061.cljs$core$IIndexed$_nth$arity$2(null,i__43701_44063);
if(cljs.core.not(node_44064.shadow$old)){
var path_match_44067 = shadow.cljs.devtools.client.browser.match_paths(node_44064.getAttribute("href"),path);
if(cljs.core.truth_(path_match_44067)){
var new_link_44068 = (function (){var G__43763 = node_44064.cloneNode(true);
G__43763.setAttribute("href",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(path_match_44067),"?r=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.rand.cljs$core$IFn$_invoke$arity$0())].join(''));

return G__43763;
})();
(node_44064.shadow$old = true);

(new_link_44068.onload = ((function (seq__43695_44060,chunk__43699_44061,count__43700_44062,i__43701_44063,seq__43512,chunk__43514,count__43515,i__43516,new_link_44068,path_match_44067,node_44064,path,map__43511,map__43511__$1,msg,updates,reload_info){
return (function (e){
var seq__43764_44070 = cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"reload-info","reload-info",1648088086),new cljs.core.Keyword(null,"asset-load","asset-load",-1925902322)], null)));
var chunk__43766_44071 = null;
var count__43767_44072 = (0);
var i__43768_44073 = (0);
while(true){
if((i__43768_44073 < count__43767_44072)){
var map__43774_44074 = chunk__43766_44071.cljs$core$IIndexed$_nth$arity$2(null,i__43768_44073);
var map__43774_44075__$1 = cljs.core.__destructure_map(map__43774_44074);
var task_44076 = map__43774_44075__$1;
var fn_str_44077 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43774_44075__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_44078 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43774_44075__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_44079 = goog.getObjectByName(fn_str_44077,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_44078)].join(''));

(fn_obj_44079.cljs$core$IFn$_invoke$arity$2 ? fn_obj_44079.cljs$core$IFn$_invoke$arity$2(path,new_link_44068) : fn_obj_44079.call(null,path,new_link_44068));


var G__44080 = seq__43764_44070;
var G__44081 = chunk__43766_44071;
var G__44082 = count__43767_44072;
var G__44083 = (i__43768_44073 + (1));
seq__43764_44070 = G__44080;
chunk__43766_44071 = G__44081;
count__43767_44072 = G__44082;
i__43768_44073 = G__44083;
continue;
} else {
var temp__5804__auto___44084 = cljs.core.seq(seq__43764_44070);
if(temp__5804__auto___44084){
var seq__43764_44085__$1 = temp__5804__auto___44084;
if(cljs.core.chunked_seq_QMARK_(seq__43764_44085__$1)){
var c__5525__auto___44086 = cljs.core.chunk_first(seq__43764_44085__$1);
var G__44087 = cljs.core.chunk_rest(seq__43764_44085__$1);
var G__44088 = c__5525__auto___44086;
var G__44089 = cljs.core.count(c__5525__auto___44086);
var G__44090 = (0);
seq__43764_44070 = G__44087;
chunk__43766_44071 = G__44088;
count__43767_44072 = G__44089;
i__43768_44073 = G__44090;
continue;
} else {
var map__43775_44094 = cljs.core.first(seq__43764_44085__$1);
var map__43775_44095__$1 = cljs.core.__destructure_map(map__43775_44094);
var task_44096 = map__43775_44095__$1;
var fn_str_44097 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43775_44095__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_44098 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43775_44095__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_44099 = goog.getObjectByName(fn_str_44097,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_44098)].join(''));

(fn_obj_44099.cljs$core$IFn$_invoke$arity$2 ? fn_obj_44099.cljs$core$IFn$_invoke$arity$2(path,new_link_44068) : fn_obj_44099.call(null,path,new_link_44068));


var G__44100 = cljs.core.next(seq__43764_44085__$1);
var G__44101 = null;
var G__44102 = (0);
var G__44103 = (0);
seq__43764_44070 = G__44100;
chunk__43766_44071 = G__44101;
count__43767_44072 = G__44102;
i__43768_44073 = G__44103;
continue;
}
} else {
}
}
break;
}

return goog.dom.removeNode(node_44064);
});})(seq__43695_44060,chunk__43699_44061,count__43700_44062,i__43701_44063,seq__43512,chunk__43514,count__43515,i__43516,new_link_44068,path_match_44067,node_44064,path,map__43511,map__43511__$1,msg,updates,reload_info))
);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load CSS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path_match_44067], 0));

goog.dom.insertSiblingAfter(new_link_44068,node_44064);


var G__44105 = seq__43695_44060;
var G__44106 = chunk__43699_44061;
var G__44107 = count__43700_44062;
var G__44108 = (i__43701_44063 + (1));
seq__43695_44060 = G__44105;
chunk__43699_44061 = G__44106;
count__43700_44062 = G__44107;
i__43701_44063 = G__44108;
continue;
} else {
var G__44109 = seq__43695_44060;
var G__44110 = chunk__43699_44061;
var G__44111 = count__43700_44062;
var G__44112 = (i__43701_44063 + (1));
seq__43695_44060 = G__44109;
chunk__43699_44061 = G__44110;
count__43700_44062 = G__44111;
i__43701_44063 = G__44112;
continue;
}
} else {
var G__44113 = seq__43695_44060;
var G__44114 = chunk__43699_44061;
var G__44115 = count__43700_44062;
var G__44116 = (i__43701_44063 + (1));
seq__43695_44060 = G__44113;
chunk__43699_44061 = G__44114;
count__43700_44062 = G__44115;
i__43701_44063 = G__44116;
continue;
}
} else {
var temp__5804__auto___44118 = cljs.core.seq(seq__43695_44060);
if(temp__5804__auto___44118){
var seq__43695_44120__$1 = temp__5804__auto___44118;
if(cljs.core.chunked_seq_QMARK_(seq__43695_44120__$1)){
var c__5525__auto___44121 = cljs.core.chunk_first(seq__43695_44120__$1);
var G__44123 = cljs.core.chunk_rest(seq__43695_44120__$1);
var G__44124 = c__5525__auto___44121;
var G__44125 = cljs.core.count(c__5525__auto___44121);
var G__44126 = (0);
seq__43695_44060 = G__44123;
chunk__43699_44061 = G__44124;
count__43700_44062 = G__44125;
i__43701_44063 = G__44126;
continue;
} else {
var node_44127 = cljs.core.first(seq__43695_44120__$1);
if(cljs.core.not(node_44127.shadow$old)){
var path_match_44128 = shadow.cljs.devtools.client.browser.match_paths(node_44127.getAttribute("href"),path);
if(cljs.core.truth_(path_match_44128)){
var new_link_44132 = (function (){var G__43776 = node_44127.cloneNode(true);
G__43776.setAttribute("href",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(path_match_44128),"?r=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.rand.cljs$core$IFn$_invoke$arity$0())].join(''));

return G__43776;
})();
(node_44127.shadow$old = true);

(new_link_44132.onload = ((function (seq__43695_44060,chunk__43699_44061,count__43700_44062,i__43701_44063,seq__43512,chunk__43514,count__43515,i__43516,new_link_44132,path_match_44128,node_44127,seq__43695_44120__$1,temp__5804__auto___44118,path,map__43511,map__43511__$1,msg,updates,reload_info){
return (function (e){
var seq__43779_44133 = cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"reload-info","reload-info",1648088086),new cljs.core.Keyword(null,"asset-load","asset-load",-1925902322)], null)));
var chunk__43781_44134 = null;
var count__43782_44135 = (0);
var i__43783_44136 = (0);
while(true){
if((i__43783_44136 < count__43782_44135)){
var map__43787_44137 = chunk__43781_44134.cljs$core$IIndexed$_nth$arity$2(null,i__43783_44136);
var map__43787_44138__$1 = cljs.core.__destructure_map(map__43787_44137);
var task_44139 = map__43787_44138__$1;
var fn_str_44140 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43787_44138__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_44141 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43787_44138__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_44145 = goog.getObjectByName(fn_str_44140,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_44141)].join(''));

(fn_obj_44145.cljs$core$IFn$_invoke$arity$2 ? fn_obj_44145.cljs$core$IFn$_invoke$arity$2(path,new_link_44132) : fn_obj_44145.call(null,path,new_link_44132));


var G__44147 = seq__43779_44133;
var G__44148 = chunk__43781_44134;
var G__44149 = count__43782_44135;
var G__44150 = (i__43783_44136 + (1));
seq__43779_44133 = G__44147;
chunk__43781_44134 = G__44148;
count__43782_44135 = G__44149;
i__43783_44136 = G__44150;
continue;
} else {
var temp__5804__auto___44152__$1 = cljs.core.seq(seq__43779_44133);
if(temp__5804__auto___44152__$1){
var seq__43779_44153__$1 = temp__5804__auto___44152__$1;
if(cljs.core.chunked_seq_QMARK_(seq__43779_44153__$1)){
var c__5525__auto___44154 = cljs.core.chunk_first(seq__43779_44153__$1);
var G__44155 = cljs.core.chunk_rest(seq__43779_44153__$1);
var G__44156 = c__5525__auto___44154;
var G__44157 = cljs.core.count(c__5525__auto___44154);
var G__44158 = (0);
seq__43779_44133 = G__44155;
chunk__43781_44134 = G__44156;
count__43782_44135 = G__44157;
i__43783_44136 = G__44158;
continue;
} else {
var map__43788_44159 = cljs.core.first(seq__43779_44153__$1);
var map__43788_44160__$1 = cljs.core.__destructure_map(map__43788_44159);
var task_44161 = map__43788_44160__$1;
var fn_str_44162 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43788_44160__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_44163 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43788_44160__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_44166 = goog.getObjectByName(fn_str_44162,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_44163)].join(''));

(fn_obj_44166.cljs$core$IFn$_invoke$arity$2 ? fn_obj_44166.cljs$core$IFn$_invoke$arity$2(path,new_link_44132) : fn_obj_44166.call(null,path,new_link_44132));


var G__44167 = cljs.core.next(seq__43779_44153__$1);
var G__44168 = null;
var G__44169 = (0);
var G__44170 = (0);
seq__43779_44133 = G__44167;
chunk__43781_44134 = G__44168;
count__43782_44135 = G__44169;
i__43783_44136 = G__44170;
continue;
}
} else {
}
}
break;
}

return goog.dom.removeNode(node_44127);
});})(seq__43695_44060,chunk__43699_44061,count__43700_44062,i__43701_44063,seq__43512,chunk__43514,count__43515,i__43516,new_link_44132,path_match_44128,node_44127,seq__43695_44120__$1,temp__5804__auto___44118,path,map__43511,map__43511__$1,msg,updates,reload_info))
);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load CSS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path_match_44128], 0));

goog.dom.insertSiblingAfter(new_link_44132,node_44127);


var G__44173 = cljs.core.next(seq__43695_44120__$1);
var G__44174 = null;
var G__44175 = (0);
var G__44176 = (0);
seq__43695_44060 = G__44173;
chunk__43699_44061 = G__44174;
count__43700_44062 = G__44175;
i__43701_44063 = G__44176;
continue;
} else {
var G__44178 = cljs.core.next(seq__43695_44120__$1);
var G__44180 = null;
var G__44181 = (0);
var G__44182 = (0);
seq__43695_44060 = G__44178;
chunk__43699_44061 = G__44180;
count__43700_44062 = G__44181;
i__43701_44063 = G__44182;
continue;
}
} else {
var G__44184 = cljs.core.next(seq__43695_44120__$1);
var G__44185 = null;
var G__44186 = (0);
var G__44187 = (0);
seq__43695_44060 = G__44184;
chunk__43699_44061 = G__44185;
count__43700_44062 = G__44186;
i__43701_44063 = G__44187;
continue;
}
}
} else {
}
}
break;
}


var G__44188 = seq__43512;
var G__44189 = chunk__43514;
var G__44190 = count__43515;
var G__44191 = (i__43516 + (1));
seq__43512 = G__44188;
chunk__43514 = G__44189;
count__43515 = G__44190;
i__43516 = G__44191;
continue;
} else {
var G__44192 = seq__43512;
var G__44193 = chunk__43514;
var G__44194 = count__43515;
var G__44195 = (i__43516 + (1));
seq__43512 = G__44192;
chunk__43514 = G__44193;
count__43515 = G__44194;
i__43516 = G__44195;
continue;
}
} else {
var temp__5804__auto__ = cljs.core.seq(seq__43512);
if(temp__5804__auto__){
var seq__43512__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__43512__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__43512__$1);
var G__44196 = cljs.core.chunk_rest(seq__43512__$1);
var G__44197 = c__5525__auto__;
var G__44198 = cljs.core.count(c__5525__auto__);
var G__44199 = (0);
seq__43512 = G__44196;
chunk__43514 = G__44197;
count__43515 = G__44198;
i__43516 = G__44199;
continue;
} else {
var path = cljs.core.first(seq__43512__$1);
if(clojure.string.ends_with_QMARK_(path,"css")){
var seq__43791_44202 = cljs.core.seq(cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(document.querySelectorAll("link[rel=\"stylesheet\"]")));
var chunk__43795_44203 = null;
var count__43796_44204 = (0);
var i__43797_44205 = (0);
while(true){
if((i__43797_44205 < count__43796_44204)){
var node_44206 = chunk__43795_44203.cljs$core$IIndexed$_nth$arity$2(null,i__43797_44205);
if(cljs.core.not(node_44206.shadow$old)){
var path_match_44207 = shadow.cljs.devtools.client.browser.match_paths(node_44206.getAttribute("href"),path);
if(cljs.core.truth_(path_match_44207)){
var new_link_44208 = (function (){var G__43873 = node_44206.cloneNode(true);
G__43873.setAttribute("href",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(path_match_44207),"?r=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.rand.cljs$core$IFn$_invoke$arity$0())].join(''));

return G__43873;
})();
(node_44206.shadow$old = true);

(new_link_44208.onload = ((function (seq__43791_44202,chunk__43795_44203,count__43796_44204,i__43797_44205,seq__43512,chunk__43514,count__43515,i__43516,new_link_44208,path_match_44207,node_44206,path,seq__43512__$1,temp__5804__auto__,map__43511,map__43511__$1,msg,updates,reload_info){
return (function (e){
var seq__43875_44219 = cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"reload-info","reload-info",1648088086),new cljs.core.Keyword(null,"asset-load","asset-load",-1925902322)], null)));
var chunk__43877_44220 = null;
var count__43878_44221 = (0);
var i__43879_44222 = (0);
while(true){
if((i__43879_44222 < count__43878_44221)){
var map__43888_44224 = chunk__43877_44220.cljs$core$IIndexed$_nth$arity$2(null,i__43879_44222);
var map__43888_44225__$1 = cljs.core.__destructure_map(map__43888_44224);
var task_44226 = map__43888_44225__$1;
var fn_str_44227 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43888_44225__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_44228 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43888_44225__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_44231 = goog.getObjectByName(fn_str_44227,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_44228)].join(''));

(fn_obj_44231.cljs$core$IFn$_invoke$arity$2 ? fn_obj_44231.cljs$core$IFn$_invoke$arity$2(path,new_link_44208) : fn_obj_44231.call(null,path,new_link_44208));


var G__44233 = seq__43875_44219;
var G__44234 = chunk__43877_44220;
var G__44235 = count__43878_44221;
var G__44236 = (i__43879_44222 + (1));
seq__43875_44219 = G__44233;
chunk__43877_44220 = G__44234;
count__43878_44221 = G__44235;
i__43879_44222 = G__44236;
continue;
} else {
var temp__5804__auto___44237__$1 = cljs.core.seq(seq__43875_44219);
if(temp__5804__auto___44237__$1){
var seq__43875_44238__$1 = temp__5804__auto___44237__$1;
if(cljs.core.chunked_seq_QMARK_(seq__43875_44238__$1)){
var c__5525__auto___44239 = cljs.core.chunk_first(seq__43875_44238__$1);
var G__44240 = cljs.core.chunk_rest(seq__43875_44238__$1);
var G__44241 = c__5525__auto___44239;
var G__44242 = cljs.core.count(c__5525__auto___44239);
var G__44243 = (0);
seq__43875_44219 = G__44240;
chunk__43877_44220 = G__44241;
count__43878_44221 = G__44242;
i__43879_44222 = G__44243;
continue;
} else {
var map__43891_44244 = cljs.core.first(seq__43875_44238__$1);
var map__43891_44245__$1 = cljs.core.__destructure_map(map__43891_44244);
var task_44246 = map__43891_44245__$1;
var fn_str_44247 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43891_44245__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_44248 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43891_44245__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_44249 = goog.getObjectByName(fn_str_44247,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_44248)].join(''));

(fn_obj_44249.cljs$core$IFn$_invoke$arity$2 ? fn_obj_44249.cljs$core$IFn$_invoke$arity$2(path,new_link_44208) : fn_obj_44249.call(null,path,new_link_44208));


var G__44250 = cljs.core.next(seq__43875_44238__$1);
var G__44251 = null;
var G__44252 = (0);
var G__44253 = (0);
seq__43875_44219 = G__44250;
chunk__43877_44220 = G__44251;
count__43878_44221 = G__44252;
i__43879_44222 = G__44253;
continue;
}
} else {
}
}
break;
}

return goog.dom.removeNode(node_44206);
});})(seq__43791_44202,chunk__43795_44203,count__43796_44204,i__43797_44205,seq__43512,chunk__43514,count__43515,i__43516,new_link_44208,path_match_44207,node_44206,path,seq__43512__$1,temp__5804__auto__,map__43511,map__43511__$1,msg,updates,reload_info))
);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load CSS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path_match_44207], 0));

goog.dom.insertSiblingAfter(new_link_44208,node_44206);


var G__44255 = seq__43791_44202;
var G__44256 = chunk__43795_44203;
var G__44257 = count__43796_44204;
var G__44258 = (i__43797_44205 + (1));
seq__43791_44202 = G__44255;
chunk__43795_44203 = G__44256;
count__43796_44204 = G__44257;
i__43797_44205 = G__44258;
continue;
} else {
var G__44259 = seq__43791_44202;
var G__44260 = chunk__43795_44203;
var G__44261 = count__43796_44204;
var G__44262 = (i__43797_44205 + (1));
seq__43791_44202 = G__44259;
chunk__43795_44203 = G__44260;
count__43796_44204 = G__44261;
i__43797_44205 = G__44262;
continue;
}
} else {
var G__44263 = seq__43791_44202;
var G__44264 = chunk__43795_44203;
var G__44265 = count__43796_44204;
var G__44266 = (i__43797_44205 + (1));
seq__43791_44202 = G__44263;
chunk__43795_44203 = G__44264;
count__43796_44204 = G__44265;
i__43797_44205 = G__44266;
continue;
}
} else {
var temp__5804__auto___44267__$1 = cljs.core.seq(seq__43791_44202);
if(temp__5804__auto___44267__$1){
var seq__43791_44268__$1 = temp__5804__auto___44267__$1;
if(cljs.core.chunked_seq_QMARK_(seq__43791_44268__$1)){
var c__5525__auto___44269 = cljs.core.chunk_first(seq__43791_44268__$1);
var G__44270 = cljs.core.chunk_rest(seq__43791_44268__$1);
var G__44271 = c__5525__auto___44269;
var G__44272 = cljs.core.count(c__5525__auto___44269);
var G__44273 = (0);
seq__43791_44202 = G__44270;
chunk__43795_44203 = G__44271;
count__43796_44204 = G__44272;
i__43797_44205 = G__44273;
continue;
} else {
var node_44274 = cljs.core.first(seq__43791_44268__$1);
if(cljs.core.not(node_44274.shadow$old)){
var path_match_44276 = shadow.cljs.devtools.client.browser.match_paths(node_44274.getAttribute("href"),path);
if(cljs.core.truth_(path_match_44276)){
var new_link_44277 = (function (){var G__43899 = node_44274.cloneNode(true);
G__43899.setAttribute("href",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(path_match_44276),"?r=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.rand.cljs$core$IFn$_invoke$arity$0())].join(''));

return G__43899;
})();
(node_44274.shadow$old = true);

(new_link_44277.onload = ((function (seq__43791_44202,chunk__43795_44203,count__43796_44204,i__43797_44205,seq__43512,chunk__43514,count__43515,i__43516,new_link_44277,path_match_44276,node_44274,seq__43791_44268__$1,temp__5804__auto___44267__$1,path,seq__43512__$1,temp__5804__auto__,map__43511,map__43511__$1,msg,updates,reload_info){
return (function (e){
var seq__43901_44280 = cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"reload-info","reload-info",1648088086),new cljs.core.Keyword(null,"asset-load","asset-load",-1925902322)], null)));
var chunk__43903_44281 = null;
var count__43904_44282 = (0);
var i__43905_44283 = (0);
while(true){
if((i__43905_44283 < count__43904_44282)){
var map__43912_44286 = chunk__43903_44281.cljs$core$IIndexed$_nth$arity$2(null,i__43905_44283);
var map__43912_44287__$1 = cljs.core.__destructure_map(map__43912_44286);
var task_44288 = map__43912_44287__$1;
var fn_str_44289 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43912_44287__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_44290 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43912_44287__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_44291 = goog.getObjectByName(fn_str_44289,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_44290)].join(''));

(fn_obj_44291.cljs$core$IFn$_invoke$arity$2 ? fn_obj_44291.cljs$core$IFn$_invoke$arity$2(path,new_link_44277) : fn_obj_44291.call(null,path,new_link_44277));


var G__44294 = seq__43901_44280;
var G__44295 = chunk__43903_44281;
var G__44297 = count__43904_44282;
var G__44298 = (i__43905_44283 + (1));
seq__43901_44280 = G__44294;
chunk__43903_44281 = G__44295;
count__43904_44282 = G__44297;
i__43905_44283 = G__44298;
continue;
} else {
var temp__5804__auto___44299__$2 = cljs.core.seq(seq__43901_44280);
if(temp__5804__auto___44299__$2){
var seq__43901_44300__$1 = temp__5804__auto___44299__$2;
if(cljs.core.chunked_seq_QMARK_(seq__43901_44300__$1)){
var c__5525__auto___44302 = cljs.core.chunk_first(seq__43901_44300__$1);
var G__44303 = cljs.core.chunk_rest(seq__43901_44300__$1);
var G__44304 = c__5525__auto___44302;
var G__44305 = cljs.core.count(c__5525__auto___44302);
var G__44306 = (0);
seq__43901_44280 = G__44303;
chunk__43903_44281 = G__44304;
count__43904_44282 = G__44305;
i__43905_44283 = G__44306;
continue;
} else {
var map__43913_44307 = cljs.core.first(seq__43901_44300__$1);
var map__43913_44308__$1 = cljs.core.__destructure_map(map__43913_44307);
var task_44309 = map__43913_44308__$1;
var fn_str_44310 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43913_44308__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_44311 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43913_44308__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_44314 = goog.getObjectByName(fn_str_44310,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_44311)].join(''));

(fn_obj_44314.cljs$core$IFn$_invoke$arity$2 ? fn_obj_44314.cljs$core$IFn$_invoke$arity$2(path,new_link_44277) : fn_obj_44314.call(null,path,new_link_44277));


var G__44315 = cljs.core.next(seq__43901_44300__$1);
var G__44316 = null;
var G__44317 = (0);
var G__44318 = (0);
seq__43901_44280 = G__44315;
chunk__43903_44281 = G__44316;
count__43904_44282 = G__44317;
i__43905_44283 = G__44318;
continue;
}
} else {
}
}
break;
}

return goog.dom.removeNode(node_44274);
});})(seq__43791_44202,chunk__43795_44203,count__43796_44204,i__43797_44205,seq__43512,chunk__43514,count__43515,i__43516,new_link_44277,path_match_44276,node_44274,seq__43791_44268__$1,temp__5804__auto___44267__$1,path,seq__43512__$1,temp__5804__auto__,map__43511,map__43511__$1,msg,updates,reload_info))
);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load CSS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path_match_44276], 0));

goog.dom.insertSiblingAfter(new_link_44277,node_44274);


var G__44319 = cljs.core.next(seq__43791_44268__$1);
var G__44320 = null;
var G__44321 = (0);
var G__44322 = (0);
seq__43791_44202 = G__44319;
chunk__43795_44203 = G__44320;
count__43796_44204 = G__44321;
i__43797_44205 = G__44322;
continue;
} else {
var G__44323 = cljs.core.next(seq__43791_44268__$1);
var G__44324 = null;
var G__44325 = (0);
var G__44326 = (0);
seq__43791_44202 = G__44323;
chunk__43795_44203 = G__44324;
count__43796_44204 = G__44325;
i__43797_44205 = G__44326;
continue;
}
} else {
var G__44327 = cljs.core.next(seq__43791_44268__$1);
var G__44328 = null;
var G__44329 = (0);
var G__44330 = (0);
seq__43791_44202 = G__44327;
chunk__43795_44203 = G__44328;
count__43796_44204 = G__44329;
i__43797_44205 = G__44330;
continue;
}
}
} else {
}
}
break;
}


var G__44331 = cljs.core.next(seq__43512__$1);
var G__44332 = null;
var G__44333 = (0);
var G__44334 = (0);
seq__43512 = G__44331;
chunk__43514 = G__44332;
count__43515 = G__44333;
i__43516 = G__44334;
continue;
} else {
var G__44335 = cljs.core.next(seq__43512__$1);
var G__44336 = null;
var G__44337 = (0);
var G__44338 = (0);
seq__43512 = G__44335;
chunk__43514 = G__44336;
count__43515 = G__44337;
i__43516 = G__44338;
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
try{var G__43925 = shadow.cljs.devtools.client.browser.global_eval(code);
return (success.cljs$core$IFn$_invoke$arity$1 ? success.cljs$core$IFn$_invoke$arity$1(G__43925) : success.call(null,G__43925));
}catch (e43924){var e = e43924;
return (fail.cljs$core$IFn$_invoke$arity$1 ? fail.cljs$core$IFn$_invoke$arity$1(e) : fail.call(null,e));
}}));

(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$cljs$devtools$client$shared$IHostSpecific$ = cljs.core.PROTOCOL_SENTINEL);

(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$cljs$devtools$client$shared$IHostSpecific$do_invoke$arity$5 = (function (this$,ns,p__43927,success,fail){
var map__43928 = p__43927;
var map__43928__$1 = cljs.core.__destructure_map(map__43928);
var js = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43928__$1,new cljs.core.Keyword(null,"js","js",1768080579));
var this$__$1 = this;
try{var G__43931 = shadow.cljs.devtools.client.browser.global_eval(js);
return (success.cljs$core$IFn$_invoke$arity$1 ? success.cljs$core$IFn$_invoke$arity$1(G__43931) : success.call(null,G__43931));
}catch (e43930){var e = e43930;
return (fail.cljs$core$IFn$_invoke$arity$1 ? fail.cljs$core$IFn$_invoke$arity$1(e) : fail.call(null,e));
}}));

(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$cljs$devtools$client$shared$IHostSpecific$do_repl_init$arity$4 = (function (runtime,p__43932,done,error){
var map__43933 = p__43932;
var map__43933__$1 = cljs.core.__destructure_map(map__43933);
var repl_sources = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43933__$1,new cljs.core.Keyword(null,"repl-sources","repl-sources",723867535));
var runtime__$1 = this;
return shadow.cljs.devtools.client.shared.load_sources(runtime__$1,cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(shadow.cljs.devtools.client.env.src_is_loaded_QMARK_,repl_sources)),(function (sources){
shadow.cljs.devtools.client.browser.do_js_load(sources);

return (done.cljs$core$IFn$_invoke$arity$0 ? done.cljs$core$IFn$_invoke$arity$0() : done.call(null));
}));
}));

(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$cljs$devtools$client$shared$IHostSpecific$do_repl_require$arity$4 = (function (runtime,p__43935,done,error){
var map__43936 = p__43935;
var map__43936__$1 = cljs.core.__destructure_map(map__43936);
var msg = map__43936__$1;
var sources = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43936__$1,new cljs.core.Keyword(null,"sources","sources",-321166424));
var reload_namespaces = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43936__$1,new cljs.core.Keyword(null,"reload-namespaces","reload-namespaces",250210134));
var js_requires = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43936__$1,new cljs.core.Keyword(null,"js-requires","js-requires",-1311472051));
var runtime__$1 = this;
var sources_to_load = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__43937){
var map__43938 = p__43937;
var map__43938__$1 = cljs.core.__destructure_map(map__43938);
var src = map__43938__$1;
var provides = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43938__$1,new cljs.core.Keyword(null,"provides","provides",-1634397992));
var and__5000__auto__ = shadow.cljs.devtools.client.env.src_is_loaded_QMARK_(src);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(cljs.core.some(reload_namespaces,provides));
} else {
return and__5000__auto__;
}
}),sources));
if(cljs.core.not(cljs.core.seq(sources_to_load))){
var G__43941 = cljs.core.PersistentVector.EMPTY;
return (done.cljs$core$IFn$_invoke$arity$1 ? done.cljs$core$IFn$_invoke$arity$1(G__43941) : done.call(null,G__43941));
} else {
return shadow.remote.runtime.shared.call.cljs$core$IFn$_invoke$arity$3(runtime__$1,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"cljs-load-sources","cljs-load-sources",-1458295962),new cljs.core.Keyword(null,"to","to",192099007),shadow.cljs.devtools.client.env.worker_client_id,new cljs.core.Keyword(null,"sources","sources",-321166424),cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"resource-id","resource-id",-1308422582)),sources_to_load)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"cljs-sources","cljs-sources",31121610),(function (p__43942){
var map__43943 = p__43942;
var map__43943__$1 = cljs.core.__destructure_map(map__43943);
var msg__$1 = map__43943__$1;
var sources__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43943__$1,new cljs.core.Keyword(null,"sources","sources",-321166424));
try{shadow.cljs.devtools.client.browser.do_js_load(sources__$1);

if(cljs.core.seq(js_requires)){
shadow.cljs.devtools.client.browser.do_js_requires(js_requires);
} else {
}

return (done.cljs$core$IFn$_invoke$arity$1 ? done.cljs$core$IFn$_invoke$arity$1(sources_to_load) : done.call(null,sources_to_load));
}catch (e43944){var ex = e43944;
return (error.cljs$core$IFn$_invoke$arity$1 ? error.cljs$core$IFn$_invoke$arity$1(ex) : error.call(null,ex));
}})], null));
}
}));

shadow.cljs.devtools.client.shared.add_plugin_BANG_(new cljs.core.Keyword("shadow.cljs.devtools.client.browser","client","shadow.cljs.devtools.client.browser/client",-1461019282),cljs.core.PersistentHashSet.EMPTY,(function (p__43945){
var map__43946 = p__43945;
var map__43946__$1 = cljs.core.__destructure_map(map__43946);
var env = map__43946__$1;
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43946__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
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
}),new cljs.core.Keyword("shadow.cljs.devtools.client.env","worker-notify","shadow.cljs.devtools.client.env/worker-notify",-1456820670),(function (p__43952){
var map__43954 = p__43952;
var map__43954__$1 = cljs.core.__destructure_map(map__43954);
var event_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43954__$1,new cljs.core.Keyword(null,"event-op","event-op",200358057));
var client_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43954__$1,new cljs.core.Keyword(null,"client-id","client-id",-464622140));
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
}),(function (p__43958){
var map__43959 = p__43958;
var map__43959__$1 = cljs.core.__destructure_map(map__43959);
var svc = map__43959__$1;
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__43959__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
return shadow.remote.runtime.api.del_extension(runtime,new cljs.core.Keyword("shadow.cljs.devtools.client.browser","client","shadow.cljs.devtools.client.browser/client",-1461019282));
}));

shadow.cljs.devtools.client.shared.init_runtime_BANG_(shadow.cljs.devtools.client.browser.client_info,shadow.cljs.devtools.client.websocket.start,shadow.cljs.devtools.client.websocket.send,shadow.cljs.devtools.client.websocket.stop);
} else {
}

//# sourceMappingURL=shadow.cljs.devtools.client.browser.js.map
