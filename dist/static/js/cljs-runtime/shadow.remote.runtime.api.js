goog.provide('shadow.remote.runtime.api');

/**
 * @interface
 */
shadow.remote.runtime.api.IRuntime = function(){};

var shadow$remote$runtime$api$IRuntime$relay_msg$dyn_37066 = (function (runtime,msg){
var x__5350__auto__ = (((runtime == null))?null:runtime);
var m__5351__auto__ = (shadow.remote.runtime.api.relay_msg[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(runtime,msg) : m__5351__auto__.call(null,runtime,msg));
} else {
var m__5349__auto__ = (shadow.remote.runtime.api.relay_msg["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(runtime,msg) : m__5349__auto__.call(null,runtime,msg));
} else {
throw cljs.core.missing_protocol("IRuntime.relay-msg",runtime);
}
}
});
shadow.remote.runtime.api.relay_msg = (function shadow$remote$runtime$api$relay_msg(runtime,msg){
if((((!((runtime == null)))) && ((!((runtime.shadow$remote$runtime$api$IRuntime$relay_msg$arity$2 == null)))))){
return runtime.shadow$remote$runtime$api$IRuntime$relay_msg$arity$2(runtime,msg);
} else {
return shadow$remote$runtime$api$IRuntime$relay_msg$dyn_37066(runtime,msg);
}
});

var shadow$remote$runtime$api$IRuntime$add_extension$dyn_37068 = (function (runtime,key,spec){
var x__5350__auto__ = (((runtime == null))?null:runtime);
var m__5351__auto__ = (shadow.remote.runtime.api.add_extension[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(runtime,key,spec) : m__5351__auto__.call(null,runtime,key,spec));
} else {
var m__5349__auto__ = (shadow.remote.runtime.api.add_extension["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(runtime,key,spec) : m__5349__auto__.call(null,runtime,key,spec));
} else {
throw cljs.core.missing_protocol("IRuntime.add-extension",runtime);
}
}
});
shadow.remote.runtime.api.add_extension = (function shadow$remote$runtime$api$add_extension(runtime,key,spec){
if((((!((runtime == null)))) && ((!((runtime.shadow$remote$runtime$api$IRuntime$add_extension$arity$3 == null)))))){
return runtime.shadow$remote$runtime$api$IRuntime$add_extension$arity$3(runtime,key,spec);
} else {
return shadow$remote$runtime$api$IRuntime$add_extension$dyn_37068(runtime,key,spec);
}
});

var shadow$remote$runtime$api$IRuntime$del_extension$dyn_37073 = (function (runtime,key){
var x__5350__auto__ = (((runtime == null))?null:runtime);
var m__5351__auto__ = (shadow.remote.runtime.api.del_extension[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(runtime,key) : m__5351__auto__.call(null,runtime,key));
} else {
var m__5349__auto__ = (shadow.remote.runtime.api.del_extension["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(runtime,key) : m__5349__auto__.call(null,runtime,key));
} else {
throw cljs.core.missing_protocol("IRuntime.del-extension",runtime);
}
}
});
shadow.remote.runtime.api.del_extension = (function shadow$remote$runtime$api$del_extension(runtime,key){
if((((!((runtime == null)))) && ((!((runtime.shadow$remote$runtime$api$IRuntime$del_extension$arity$2 == null)))))){
return runtime.shadow$remote$runtime$api$IRuntime$del_extension$arity$2(runtime,key);
} else {
return shadow$remote$runtime$api$IRuntime$del_extension$dyn_37073(runtime,key);
}
});


/**
 * @interface
 */
shadow.remote.runtime.api.Inspectable = function(){};

var shadow$remote$runtime$api$Inspectable$describe$dyn_37077 = (function (thing,opts){
var x__5350__auto__ = (((thing == null))?null:thing);
var m__5351__auto__ = (shadow.remote.runtime.api.describe[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(thing,opts) : m__5351__auto__.call(null,thing,opts));
} else {
var m__5349__auto__ = (shadow.remote.runtime.api.describe["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(thing,opts) : m__5349__auto__.call(null,thing,opts));
} else {
throw cljs.core.missing_protocol("Inspectable.describe",thing);
}
}
});
/**
 * returns a map descriptor that tells system how to handle things further
 */
shadow.remote.runtime.api.describe = (function shadow$remote$runtime$api$describe(thing,opts){
var temp__5802__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.meta(thing),cljs.core.with_meta(new cljs.core.Symbol("shadow.remote.runtime.api","describe","shadow.remote.runtime.api/describe",1388020131,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("cljs.analyzer","no-resolve","cljs.analyzer/no-resolve",-1872351017),true], null)));
if(temp__5802__auto__){
var meta_impl__5352__auto__ = temp__5802__auto__;
return (meta_impl__5352__auto__.cljs$core$IFn$_invoke$arity$2 ? meta_impl__5352__auto__.cljs$core$IFn$_invoke$arity$2(thing,opts) : meta_impl__5352__auto__.call(null,thing,opts));
} else {
if((((!((thing == null)))) && ((!((thing.shadow$remote$runtime$api$Inspectable$describe$arity$2 == null)))))){
return thing.shadow$remote$runtime$api$Inspectable$describe$arity$2(thing,opts);
} else {
return shadow$remote$runtime$api$Inspectable$describe$dyn_37077(thing,opts);
}
}
});


/**
 * @interface
 */
shadow.remote.runtime.api.IEvalCLJS = function(){};

var shadow$remote$runtime$api$IEvalCLJS$_cljs_eval$dyn_37090 = (function (runtime,input,callback){
var x__5350__auto__ = (((runtime == null))?null:runtime);
var m__5351__auto__ = (shadow.remote.runtime.api._cljs_eval[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(runtime,input,callback) : m__5351__auto__.call(null,runtime,input,callback));
} else {
var m__5349__auto__ = (shadow.remote.runtime.api._cljs_eval["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(runtime,input,callback) : m__5349__auto__.call(null,runtime,input,callback));
} else {
throw cljs.core.missing_protocol("IEvalCLJS.-cljs-eval",runtime);
}
}
});
shadow.remote.runtime.api._cljs_eval = (function shadow$remote$runtime$api$_cljs_eval(runtime,input,callback){
if((((!((runtime == null)))) && ((!((runtime.shadow$remote$runtime$api$IEvalCLJS$_cljs_eval$arity$3 == null)))))){
return runtime.shadow$remote$runtime$api$IEvalCLJS$_cljs_eval$arity$3(runtime,input,callback);
} else {
return shadow$remote$runtime$api$IEvalCLJS$_cljs_eval$dyn_37090(runtime,input,callback);
}
});



/**
 * @interface
 */
shadow.remote.runtime.api.IEvalJS = function(){};

var shadow$remote$runtime$api$IEvalJS$_js_eval$dyn_37096 = (function (runtime,code,success,fail){
var x__5350__auto__ = (((runtime == null))?null:runtime);
var m__5351__auto__ = (shadow.remote.runtime.api._js_eval[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$4 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$4(runtime,code,success,fail) : m__5351__auto__.call(null,runtime,code,success,fail));
} else {
var m__5349__auto__ = (shadow.remote.runtime.api._js_eval["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$4 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$4(runtime,code,success,fail) : m__5349__auto__.call(null,runtime,code,success,fail));
} else {
throw cljs.core.missing_protocol("IEvalJS.-js-eval",runtime);
}
}
});
shadow.remote.runtime.api._js_eval = (function shadow$remote$runtime$api$_js_eval(runtime,code,success,fail){
if((((!((runtime == null)))) && ((!((runtime.shadow$remote$runtime$api$IEvalJS$_js_eval$arity$4 == null)))))){
return runtime.shadow$remote$runtime$api$IEvalJS$_js_eval$arity$4(runtime,code,success,fail);
} else {
return shadow$remote$runtime$api$IEvalJS$_js_eval$dyn_37096(runtime,code,success,fail);
}
});


shadow.remote.runtime.api.cljs_eval = (function shadow$remote$runtime$api$cljs_eval(runtime,p__37058,callback){
var map__37059 = p__37058;
var map__37059__$1 = cljs.core.__destructure_map(map__37059);
var input = map__37059__$1;
var code = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37059__$1,new cljs.core.Keyword(null,"code","code",1586293142));
var ns = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__37059__$1,new cljs.core.Keyword(null,"ns","ns",441598760));
if(((typeof code === 'string') && (cljs.core.simple_symbol_QMARK_(ns)))){
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("invalid cljs-eval input",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"input","input",556931961),input], null));
}

return shadow.remote.runtime.api._cljs_eval(runtime,input,callback);
});

shadow.remote.runtime.api.js_eval = (function shadow$remote$runtime$api$js_eval(runtime,code,success,fail){
if(typeof code === 'string'){
} else {
throw (new Error("Assert failed: (string? code)"));
}

return shadow.remote.runtime.api._js_eval(runtime,code,success,fail);
});

//# sourceMappingURL=shadow.remote.runtime.api.js.map
