goog.provide('promesa.protocols');

/**
 * @interface
 */
promesa.protocols.IPromise = function(){};

var promesa$protocols$IPromise$_fmap$dyn_44355 = (function() {
var G__44356 = null;
var G__44356__2 = (function (it,f){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._fmap[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(it,f) : m__5351__auto__.call(null,it,f));
} else {
var m__5349__auto__ = (promesa.protocols._fmap["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(it,f) : m__5349__auto__.call(null,it,f));
} else {
throw cljs.core.missing_protocol("IPromise.-fmap",it);
}
}
});
var G__44356__3 = (function (it,f,executor){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._fmap[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(it,f,executor) : m__5351__auto__.call(null,it,f,executor));
} else {
var m__5349__auto__ = (promesa.protocols._fmap["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(it,f,executor) : m__5349__auto__.call(null,it,f,executor));
} else {
throw cljs.core.missing_protocol("IPromise.-fmap",it);
}
}
});
G__44356 = function(it,f,executor){
switch(arguments.length){
case 2:
return G__44356__2.call(this,it,f);
case 3:
return G__44356__3.call(this,it,f,executor);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__44356.cljs$core$IFn$_invoke$arity$2 = G__44356__2;
G__44356.cljs$core$IFn$_invoke$arity$3 = G__44356__3;
return G__44356;
})()
;
/**
 * Apply function to a computation
 */
promesa.protocols._fmap = (function promesa$protocols$_fmap(var_args){
var G__43726 = arguments.length;
switch (G__43726) {
case 2:
return promesa.protocols._fmap.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return promesa.protocols._fmap.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(promesa.protocols._fmap.cljs$core$IFn$_invoke$arity$2 = (function (it,f){
if((((!((it == null)))) && ((!((it.promesa$protocols$IPromise$_fmap$arity$2 == null)))))){
return it.promesa$protocols$IPromise$_fmap$arity$2(it,f);
} else {
return promesa$protocols$IPromise$_fmap$dyn_44355(it,f);
}
}));

(promesa.protocols._fmap.cljs$core$IFn$_invoke$arity$3 = (function (it,f,executor){
if((((!((it == null)))) && ((!((it.promesa$protocols$IPromise$_fmap$arity$3 == null)))))){
return it.promesa$protocols$IPromise$_fmap$arity$3(it,f,executor);
} else {
return promesa$protocols$IPromise$_fmap$dyn_44355(it,f,executor);
}
}));

(promesa.protocols._fmap.cljs$lang$maxFixedArity = 3);


var promesa$protocols$IPromise$_merr$dyn_44363 = (function() {
var G__44364 = null;
var G__44364__2 = (function (it,f){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._merr[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(it,f) : m__5351__auto__.call(null,it,f));
} else {
var m__5349__auto__ = (promesa.protocols._merr["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(it,f) : m__5349__auto__.call(null,it,f));
} else {
throw cljs.core.missing_protocol("IPromise.-merr",it);
}
}
});
var G__44364__3 = (function (it,f,executor){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._merr[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(it,f,executor) : m__5351__auto__.call(null,it,f,executor));
} else {
var m__5349__auto__ = (promesa.protocols._merr["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(it,f,executor) : m__5349__auto__.call(null,it,f,executor));
} else {
throw cljs.core.missing_protocol("IPromise.-merr",it);
}
}
});
G__44364 = function(it,f,executor){
switch(arguments.length){
case 2:
return G__44364__2.call(this,it,f);
case 3:
return G__44364__3.call(this,it,f,executor);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__44364.cljs$core$IFn$_invoke$arity$2 = G__44364__2;
G__44364.cljs$core$IFn$_invoke$arity$3 = G__44364__3;
return G__44364;
})()
;
/**
 * Apply function to a failed computation and flatten 1 level
 */
promesa.protocols._merr = (function promesa$protocols$_merr(var_args){
var G__43740 = arguments.length;
switch (G__43740) {
case 2:
return promesa.protocols._merr.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return promesa.protocols._merr.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(promesa.protocols._merr.cljs$core$IFn$_invoke$arity$2 = (function (it,f){
if((((!((it == null)))) && ((!((it.promesa$protocols$IPromise$_merr$arity$2 == null)))))){
return it.promesa$protocols$IPromise$_merr$arity$2(it,f);
} else {
return promesa$protocols$IPromise$_merr$dyn_44363(it,f);
}
}));

(promesa.protocols._merr.cljs$core$IFn$_invoke$arity$3 = (function (it,f,executor){
if((((!((it == null)))) && ((!((it.promesa$protocols$IPromise$_merr$arity$3 == null)))))){
return it.promesa$protocols$IPromise$_merr$arity$3(it,f,executor);
} else {
return promesa$protocols$IPromise$_merr$dyn_44363(it,f,executor);
}
}));

(promesa.protocols._merr.cljs$lang$maxFixedArity = 3);


var promesa$protocols$IPromise$_mcat$dyn_44373 = (function() {
var G__44374 = null;
var G__44374__2 = (function (it,f){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._mcat[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(it,f) : m__5351__auto__.call(null,it,f));
} else {
var m__5349__auto__ = (promesa.protocols._mcat["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(it,f) : m__5349__auto__.call(null,it,f));
} else {
throw cljs.core.missing_protocol("IPromise.-mcat",it);
}
}
});
var G__44374__3 = (function (it,f,executor){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._mcat[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(it,f,executor) : m__5351__auto__.call(null,it,f,executor));
} else {
var m__5349__auto__ = (promesa.protocols._mcat["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(it,f,executor) : m__5349__auto__.call(null,it,f,executor));
} else {
throw cljs.core.missing_protocol("IPromise.-mcat",it);
}
}
});
G__44374 = function(it,f,executor){
switch(arguments.length){
case 2:
return G__44374__2.call(this,it,f);
case 3:
return G__44374__3.call(this,it,f,executor);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__44374.cljs$core$IFn$_invoke$arity$2 = G__44374__2;
G__44374.cljs$core$IFn$_invoke$arity$3 = G__44374__3;
return G__44374;
})()
;
/**
 * Apply function to a computation and flatten 1 level
 */
promesa.protocols._mcat = (function promesa$protocols$_mcat(var_args){
var G__43746 = arguments.length;
switch (G__43746) {
case 2:
return promesa.protocols._mcat.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return promesa.protocols._mcat.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(promesa.protocols._mcat.cljs$core$IFn$_invoke$arity$2 = (function (it,f){
if((((!((it == null)))) && ((!((it.promesa$protocols$IPromise$_mcat$arity$2 == null)))))){
return it.promesa$protocols$IPromise$_mcat$arity$2(it,f);
} else {
return promesa$protocols$IPromise$_mcat$dyn_44373(it,f);
}
}));

(promesa.protocols._mcat.cljs$core$IFn$_invoke$arity$3 = (function (it,f,executor){
if((((!((it == null)))) && ((!((it.promesa$protocols$IPromise$_mcat$arity$3 == null)))))){
return it.promesa$protocols$IPromise$_mcat$arity$3(it,f,executor);
} else {
return promesa$protocols$IPromise$_mcat$dyn_44373(it,f,executor);
}
}));

(promesa.protocols._mcat.cljs$lang$maxFixedArity = 3);


var promesa$protocols$IPromise$_hmap$dyn_44383 = (function() {
var G__44384 = null;
var G__44384__2 = (function (it,f){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._hmap[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(it,f) : m__5351__auto__.call(null,it,f));
} else {
var m__5349__auto__ = (promesa.protocols._hmap["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(it,f) : m__5349__auto__.call(null,it,f));
} else {
throw cljs.core.missing_protocol("IPromise.-hmap",it);
}
}
});
var G__44384__3 = (function (it,f,executor){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._hmap[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(it,f,executor) : m__5351__auto__.call(null,it,f,executor));
} else {
var m__5349__auto__ = (promesa.protocols._hmap["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(it,f,executor) : m__5349__auto__.call(null,it,f,executor));
} else {
throw cljs.core.missing_protocol("IPromise.-hmap",it);
}
}
});
G__44384 = function(it,f,executor){
switch(arguments.length){
case 2:
return G__44384__2.call(this,it,f);
case 3:
return G__44384__3.call(this,it,f,executor);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__44384.cljs$core$IFn$_invoke$arity$2 = G__44384__2;
G__44384.cljs$core$IFn$_invoke$arity$3 = G__44384__3;
return G__44384;
})()
;
/**
 * Apply function to a computation independently if is failed or
 *  successful.
 */
promesa.protocols._hmap = (function promesa$protocols$_hmap(var_args){
var G__43761 = arguments.length;
switch (G__43761) {
case 2:
return promesa.protocols._hmap.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return promesa.protocols._hmap.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(promesa.protocols._hmap.cljs$core$IFn$_invoke$arity$2 = (function (it,f){
if((((!((it == null)))) && ((!((it.promesa$protocols$IPromise$_hmap$arity$2 == null)))))){
return it.promesa$protocols$IPromise$_hmap$arity$2(it,f);
} else {
return promesa$protocols$IPromise$_hmap$dyn_44383(it,f);
}
}));

(promesa.protocols._hmap.cljs$core$IFn$_invoke$arity$3 = (function (it,f,executor){
if((((!((it == null)))) && ((!((it.promesa$protocols$IPromise$_hmap$arity$3 == null)))))){
return it.promesa$protocols$IPromise$_hmap$arity$3(it,f,executor);
} else {
return promesa$protocols$IPromise$_hmap$dyn_44383(it,f,executor);
}
}));

(promesa.protocols._hmap.cljs$lang$maxFixedArity = 3);


var promesa$protocols$IPromise$_fnly$dyn_44390 = (function() {
var G__44391 = null;
var G__44391__2 = (function (it,f){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._fnly[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(it,f) : m__5351__auto__.call(null,it,f));
} else {
var m__5349__auto__ = (promesa.protocols._fnly["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(it,f) : m__5349__auto__.call(null,it,f));
} else {
throw cljs.core.missing_protocol("IPromise.-fnly",it);
}
}
});
var G__44391__3 = (function (it,f,executor){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._fnly[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(it,f,executor) : m__5351__auto__.call(null,it,f,executor));
} else {
var m__5349__auto__ = (promesa.protocols._fnly["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(it,f,executor) : m__5349__auto__.call(null,it,f,executor));
} else {
throw cljs.core.missing_protocol("IPromise.-fnly",it);
}
}
});
G__44391 = function(it,f,executor){
switch(arguments.length){
case 2:
return G__44391__2.call(this,it,f);
case 3:
return G__44391__3.call(this,it,f,executor);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__44391.cljs$core$IFn$_invoke$arity$2 = G__44391__2;
G__44391.cljs$core$IFn$_invoke$arity$3 = G__44391__3;
return G__44391;
})()
;
/**
 * Apply function to a computation independently if is failed or
 *  successful; the return value is ignored.
 */
promesa.protocols._fnly = (function promesa$protocols$_fnly(var_args){
var G__43773 = arguments.length;
switch (G__43773) {
case 2:
return promesa.protocols._fnly.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return promesa.protocols._fnly.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(promesa.protocols._fnly.cljs$core$IFn$_invoke$arity$2 = (function (it,f){
if((((!((it == null)))) && ((!((it.promesa$protocols$IPromise$_fnly$arity$2 == null)))))){
return it.promesa$protocols$IPromise$_fnly$arity$2(it,f);
} else {
return promesa$protocols$IPromise$_fnly$dyn_44390(it,f);
}
}));

(promesa.protocols._fnly.cljs$core$IFn$_invoke$arity$3 = (function (it,f,executor){
if((((!((it == null)))) && ((!((it.promesa$protocols$IPromise$_fnly$arity$3 == null)))))){
return it.promesa$protocols$IPromise$_fnly$arity$3(it,f,executor);
} else {
return promesa$protocols$IPromise$_fnly$dyn_44390(it,f,executor);
}
}));

(promesa.protocols._fnly.cljs$lang$maxFixedArity = 3);


var promesa$protocols$IPromise$_then$dyn_44410 = (function() {
var G__44411 = null;
var G__44411__2 = (function (it,f){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._then[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(it,f) : m__5351__auto__.call(null,it,f));
} else {
var m__5349__auto__ = (promesa.protocols._then["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(it,f) : m__5349__auto__.call(null,it,f));
} else {
throw cljs.core.missing_protocol("IPromise.-then",it);
}
}
});
var G__44411__3 = (function (it,f,executor){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._then[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(it,f,executor) : m__5351__auto__.call(null,it,f,executor));
} else {
var m__5349__auto__ = (promesa.protocols._then["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(it,f,executor) : m__5349__auto__.call(null,it,f,executor));
} else {
throw cljs.core.missing_protocol("IPromise.-then",it);
}
}
});
G__44411 = function(it,f,executor){
switch(arguments.length){
case 2:
return G__44411__2.call(this,it,f);
case 3:
return G__44411__3.call(this,it,f,executor);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__44411.cljs$core$IFn$_invoke$arity$2 = G__44411__2;
G__44411.cljs$core$IFn$_invoke$arity$3 = G__44411__3;
return G__44411;
})()
;
/**
 * Apply function to a computation and flatten multiple levels
 */
promesa.protocols._then = (function promesa$protocols$_then(var_args){
var G__43778 = arguments.length;
switch (G__43778) {
case 2:
return promesa.protocols._then.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return promesa.protocols._then.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(promesa.protocols._then.cljs$core$IFn$_invoke$arity$2 = (function (it,f){
if((((!((it == null)))) && ((!((it.promesa$protocols$IPromise$_then$arity$2 == null)))))){
return it.promesa$protocols$IPromise$_then$arity$2(it,f);
} else {
return promesa$protocols$IPromise$_then$dyn_44410(it,f);
}
}));

(promesa.protocols._then.cljs$core$IFn$_invoke$arity$3 = (function (it,f,executor){
if((((!((it == null)))) && ((!((it.promesa$protocols$IPromise$_then$arity$3 == null)))))){
return it.promesa$protocols$IPromise$_then$arity$3(it,f,executor);
} else {
return promesa$protocols$IPromise$_then$dyn_44410(it,f,executor);
}
}));

(promesa.protocols._then.cljs$lang$maxFixedArity = 3);



/**
 * Additional state/introspection abstraction.
 * @interface
 */
promesa.protocols.IState = function(){};

var promesa$protocols$IState$_extract$dyn_44417 = (function() {
var G__44418 = null;
var G__44418__1 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._extract[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._extract["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("IState.-extract",it);
}
}
});
var G__44418__2 = (function (it,default$){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._extract[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(it,default$) : m__5351__auto__.call(null,it,default$));
} else {
var m__5349__auto__ = (promesa.protocols._extract["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(it,default$) : m__5349__auto__.call(null,it,default$));
} else {
throw cljs.core.missing_protocol("IState.-extract",it);
}
}
});
G__44418 = function(it,default$){
switch(arguments.length){
case 1:
return G__44418__1.call(this,it);
case 2:
return G__44418__2.call(this,it,default$);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__44418.cljs$core$IFn$_invoke$arity$1 = G__44418__1;
G__44418.cljs$core$IFn$_invoke$arity$2 = G__44418__2;
return G__44418;
})()
;
/**
 * Extract the current value.
 */
promesa.protocols._extract = (function promesa$protocols$_extract(var_args){
var G__43790 = arguments.length;
switch (G__43790) {
case 1:
return promesa.protocols._extract.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return promesa.protocols._extract.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(promesa.protocols._extract.cljs$core$IFn$_invoke$arity$1 = (function (it){
if((((!((it == null)))) && ((!((it.promesa$protocols$IState$_extract$arity$1 == null)))))){
return it.promesa$protocols$IState$_extract$arity$1(it);
} else {
return promesa$protocols$IState$_extract$dyn_44417(it);
}
}));

(promesa.protocols._extract.cljs$core$IFn$_invoke$arity$2 = (function (it,default$){
if((((!((it == null)))) && ((!((it.promesa$protocols$IState$_extract$arity$2 == null)))))){
return it.promesa$protocols$IState$_extract$arity$2(it,default$);
} else {
return promesa$protocols$IState$_extract$dyn_44417(it,default$);
}
}));

(promesa.protocols._extract.cljs$lang$maxFixedArity = 2);


var promesa$protocols$IState$_resolved_QMARK_$dyn_44424 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._resolved_QMARK_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._resolved_QMARK_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("IState.-resolved?",it);
}
}
});
/**
 * Returns true if a promise is resolved.
 */
promesa.protocols._resolved_QMARK_ = (function promesa$protocols$_resolved_QMARK_(it){
if((((!((it == null)))) && ((!((it.promesa$protocols$IState$_resolved_QMARK_$arity$1 == null)))))){
return it.promesa$protocols$IState$_resolved_QMARK_$arity$1(it);
} else {
return promesa$protocols$IState$_resolved_QMARK_$dyn_44424(it);
}
});

var promesa$protocols$IState$_rejected_QMARK_$dyn_44425 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._rejected_QMARK_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._rejected_QMARK_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("IState.-rejected?",it);
}
}
});
/**
 * Returns true if a promise is rejected.
 */
promesa.protocols._rejected_QMARK_ = (function promesa$protocols$_rejected_QMARK_(it){
if((((!((it == null)))) && ((!((it.promesa$protocols$IState$_rejected_QMARK_$arity$1 == null)))))){
return it.promesa$protocols$IState$_rejected_QMARK_$arity$1(it);
} else {
return promesa$protocols$IState$_rejected_QMARK_$dyn_44425(it);
}
});

var promesa$protocols$IState$_pending_QMARK_$dyn_44426 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._pending_QMARK_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._pending_QMARK_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("IState.-pending?",it);
}
}
});
/**
 * Retutns true if a promise is pending.
 */
promesa.protocols._pending_QMARK_ = (function promesa$protocols$_pending_QMARK_(it){
if((((!((it == null)))) && ((!((it.promesa$protocols$IState$_pending_QMARK_$arity$1 == null)))))){
return it.promesa$protocols$IState$_pending_QMARK_$arity$1(it);
} else {
return promesa$protocols$IState$_pending_QMARK_$dyn_44426(it);
}
});


/**
 * A promise constructor abstraction.
 * @interface
 */
promesa.protocols.IPromiseFactory = function(){};

var promesa$protocols$IPromiseFactory$_promise$dyn_44427 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._promise[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._promise["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("IPromiseFactory.-promise",it);
}
}
});
/**
 * Create a promise instance from other types
 */
promesa.protocols._promise = (function promesa$protocols$_promise(it){
if((((!((it == null)))) && ((!((it.promesa$protocols$IPromiseFactory$_promise$arity$1 == null)))))){
return it.promesa$protocols$IPromiseFactory$_promise$arity$1(it);
} else {
return promesa$protocols$IPromiseFactory$_promise$dyn_44427(it);
}
});


/**
 * A cancellation abstraction.
 * @interface
 */
promesa.protocols.ICancellable = function(){};

var promesa$protocols$ICancellable$_cancel_BANG_$dyn_44429 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._cancel_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._cancel_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("ICancellable.-cancel!",it);
}
}
});
promesa.protocols._cancel_BANG_ = (function promesa$protocols$_cancel_BANG_(it){
if((((!((it == null)))) && ((!((it.promesa$protocols$ICancellable$_cancel_BANG_$arity$1 == null)))))){
return it.promesa$protocols$ICancellable$_cancel_BANG_$arity$1(it);
} else {
return promesa$protocols$ICancellable$_cancel_BANG_$dyn_44429(it);
}
});

var promesa$protocols$ICancellable$_cancelled_QMARK_$dyn_44432 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._cancelled_QMARK_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._cancelled_QMARK_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("ICancellable.-cancelled?",it);
}
}
});
promesa.protocols._cancelled_QMARK_ = (function promesa$protocols$_cancelled_QMARK_(it){
if((((!((it == null)))) && ((!((it.promesa$protocols$ICancellable$_cancelled_QMARK_$arity$1 == null)))))){
return it.promesa$protocols$ICancellable$_cancelled_QMARK_$arity$1(it);
} else {
return promesa$protocols$ICancellable$_cancelled_QMARK_$dyn_44432(it);
}
});


/**
 * @interface
 */
promesa.protocols.ICompletable = function(){};

var promesa$protocols$ICompletable$_resolve_BANG_$dyn_44435 = (function (it,v){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._resolve_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(it,v) : m__5351__auto__.call(null,it,v));
} else {
var m__5349__auto__ = (promesa.protocols._resolve_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(it,v) : m__5349__auto__.call(null,it,v));
} else {
throw cljs.core.missing_protocol("ICompletable.-resolve!",it);
}
}
});
/**
 * Deliver a value to empty promise.
 */
promesa.protocols._resolve_BANG_ = (function promesa$protocols$_resolve_BANG_(it,v){
if((((!((it == null)))) && ((!((it.promesa$protocols$ICompletable$_resolve_BANG_$arity$2 == null)))))){
return it.promesa$protocols$ICompletable$_resolve_BANG_$arity$2(it,v);
} else {
return promesa$protocols$ICompletable$_resolve_BANG_$dyn_44435(it,v);
}
});

var promesa$protocols$ICompletable$_reject_BANG_$dyn_44437 = (function (it,e){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._reject_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(it,e) : m__5351__auto__.call(null,it,e));
} else {
var m__5349__auto__ = (promesa.protocols._reject_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(it,e) : m__5349__auto__.call(null,it,e));
} else {
throw cljs.core.missing_protocol("ICompletable.-reject!",it);
}
}
});
/**
 * Deliver an error to empty promise.
 */
promesa.protocols._reject_BANG_ = (function promesa$protocols$_reject_BANG_(it,e){
if((((!((it == null)))) && ((!((it.promesa$protocols$ICompletable$_reject_BANG_$arity$2 == null)))))){
return it.promesa$protocols$ICompletable$_reject_BANG_$arity$2(it,e);
} else {
return promesa$protocols$ICompletable$_reject_BANG_$dyn_44437(it,e);
}
});


/**
 * @interface
 */
promesa.protocols.IExecutor = function(){};

var promesa$protocols$IExecutor$_exec_BANG_$dyn_44438 = (function (it,task){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._exec_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(it,task) : m__5351__auto__.call(null,it,task));
} else {
var m__5349__auto__ = (promesa.protocols._exec_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(it,task) : m__5349__auto__.call(null,it,task));
} else {
throw cljs.core.missing_protocol("IExecutor.-exec!",it);
}
}
});
/**
 * Submit a task and return nil
 */
promesa.protocols._exec_BANG_ = (function promesa$protocols$_exec_BANG_(it,task){
if((((!((it == null)))) && ((!((it.promesa$protocols$IExecutor$_exec_BANG_$arity$2 == null)))))){
return it.promesa$protocols$IExecutor$_exec_BANG_$arity$2(it,task);
} else {
return promesa$protocols$IExecutor$_exec_BANG_$dyn_44438(it,task);
}
});

var promesa$protocols$IExecutor$_run_BANG_$dyn_44440 = (function (it,task){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._run_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(it,task) : m__5351__auto__.call(null,it,task));
} else {
var m__5349__auto__ = (promesa.protocols._run_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(it,task) : m__5349__auto__.call(null,it,task));
} else {
throw cljs.core.missing_protocol("IExecutor.-run!",it);
}
}
});
/**
 * Submit a task and return a promise.
 */
promesa.protocols._run_BANG_ = (function promesa$protocols$_run_BANG_(it,task){
if((((!((it == null)))) && ((!((it.promesa$protocols$IExecutor$_run_BANG_$arity$2 == null)))))){
return it.promesa$protocols$IExecutor$_run_BANG_$arity$2(it,task);
} else {
return promesa$protocols$IExecutor$_run_BANG_$dyn_44440(it,task);
}
});

var promesa$protocols$IExecutor$_submit_BANG_$dyn_44444 = (function (it,task){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._submit_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(it,task) : m__5351__auto__.call(null,it,task));
} else {
var m__5349__auto__ = (promesa.protocols._submit_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(it,task) : m__5349__auto__.call(null,it,task));
} else {
throw cljs.core.missing_protocol("IExecutor.-submit!",it);
}
}
});
/**
 * Submit a task and return a promise.
 */
promesa.protocols._submit_BANG_ = (function promesa$protocols$_submit_BANG_(it,task){
if((((!((it == null)))) && ((!((it.promesa$protocols$IExecutor$_submit_BANG_$arity$2 == null)))))){
return it.promesa$protocols$IExecutor$_submit_BANG_$arity$2(it,task);
} else {
return promesa$protocols$IExecutor$_submit_BANG_$dyn_44444(it,task);
}
});


/**
 * A generic abstraction for scheduler facilities.
 * @interface
 */
promesa.protocols.IScheduler = function(){};

var promesa$protocols$IScheduler$_schedule_BANG_$dyn_44445 = (function (it,ms,func){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._schedule_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(it,ms,func) : m__5351__auto__.call(null,it,ms,func));
} else {
var m__5349__auto__ = (promesa.protocols._schedule_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(it,ms,func) : m__5349__auto__.call(null,it,ms,func));
} else {
throw cljs.core.missing_protocol("IScheduler.-schedule!",it);
}
}
});
/**
 * Schedule a function to be executed in future.
 */
promesa.protocols._schedule_BANG_ = (function promesa$protocols$_schedule_BANG_(it,ms,func){
if((((!((it == null)))) && ((!((it.promesa$protocols$IScheduler$_schedule_BANG_$arity$3 == null)))))){
return it.promesa$protocols$IScheduler$_schedule_BANG_$arity$3(it,ms,func);
} else {
return promesa$protocols$IScheduler$_schedule_BANG_$dyn_44445(it,ms,func);
}
});


/**
 * An experimental semaphore protocol, used internally; no public api
 * @interface
 */
promesa.protocols.ISemaphore = function(){};

var promesa$protocols$ISemaphore$_try_acquire_BANG_$dyn_44447 = (function() {
var G__44448 = null;
var G__44448__1 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._try_acquire_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._try_acquire_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("ISemaphore.-try-acquire!",it);
}
}
});
var G__44448__2 = (function (it,n){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._try_acquire_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(it,n) : m__5351__auto__.call(null,it,n));
} else {
var m__5349__auto__ = (promesa.protocols._try_acquire_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(it,n) : m__5349__auto__.call(null,it,n));
} else {
throw cljs.core.missing_protocol("ISemaphore.-try-acquire!",it);
}
}
});
var G__44448__3 = (function (it,n,t){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._try_acquire_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(it,n,t) : m__5351__auto__.call(null,it,n,t));
} else {
var m__5349__auto__ = (promesa.protocols._try_acquire_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(it,n,t) : m__5349__auto__.call(null,it,n,t));
} else {
throw cljs.core.missing_protocol("ISemaphore.-try-acquire!",it);
}
}
});
G__44448 = function(it,n,t){
switch(arguments.length){
case 1:
return G__44448__1.call(this,it);
case 2:
return G__44448__2.call(this,it,n);
case 3:
return G__44448__3.call(this,it,n,t);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__44448.cljs$core$IFn$_invoke$arity$1 = G__44448__1;
G__44448.cljs$core$IFn$_invoke$arity$2 = G__44448__2;
G__44448.cljs$core$IFn$_invoke$arity$3 = G__44448__3;
return G__44448;
})()
;
/**
 * Try acquire n or n permits, non-blocking or optional timeout
 */
promesa.protocols._try_acquire_BANG_ = (function promesa$protocols$_try_acquire_BANG_(var_args){
var G__43917 = arguments.length;
switch (G__43917) {
case 1:
return promesa.protocols._try_acquire_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return promesa.protocols._try_acquire_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return promesa.protocols._try_acquire_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(promesa.protocols._try_acquire_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (it){
if((((!((it == null)))) && ((!((it.promesa$protocols$ISemaphore$_try_acquire_BANG_$arity$1 == null)))))){
return it.promesa$protocols$ISemaphore$_try_acquire_BANG_$arity$1(it);
} else {
return promesa$protocols$ISemaphore$_try_acquire_BANG_$dyn_44447(it);
}
}));

(promesa.protocols._try_acquire_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (it,n){
if((((!((it == null)))) && ((!((it.promesa$protocols$ISemaphore$_try_acquire_BANG_$arity$2 == null)))))){
return it.promesa$protocols$ISemaphore$_try_acquire_BANG_$arity$2(it,n);
} else {
return promesa$protocols$ISemaphore$_try_acquire_BANG_$dyn_44447(it,n);
}
}));

(promesa.protocols._try_acquire_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (it,n,t){
if((((!((it == null)))) && ((!((it.promesa$protocols$ISemaphore$_try_acquire_BANG_$arity$3 == null)))))){
return it.promesa$protocols$ISemaphore$_try_acquire_BANG_$arity$3(it,n,t);
} else {
return promesa$protocols$ISemaphore$_try_acquire_BANG_$dyn_44447(it,n,t);
}
}));

(promesa.protocols._try_acquire_BANG_.cljs$lang$maxFixedArity = 3);


var promesa$protocols$ISemaphore$_acquire_BANG_$dyn_44461 = (function() {
var G__44462 = null;
var G__44462__1 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._acquire_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._acquire_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("ISemaphore.-acquire!",it);
}
}
});
var G__44462__2 = (function (it,n){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._acquire_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(it,n) : m__5351__auto__.call(null,it,n));
} else {
var m__5349__auto__ = (promesa.protocols._acquire_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(it,n) : m__5349__auto__.call(null,it,n));
} else {
throw cljs.core.missing_protocol("ISemaphore.-acquire!",it);
}
}
});
G__44462 = function(it,n){
switch(arguments.length){
case 1:
return G__44462__1.call(this,it);
case 2:
return G__44462__2.call(this,it,n);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__44462.cljs$core$IFn$_invoke$arity$1 = G__44462__1;
G__44462.cljs$core$IFn$_invoke$arity$2 = G__44462__2;
return G__44462;
})()
;
/**
 * Acquire 1 or N permits
 */
promesa.protocols._acquire_BANG_ = (function promesa$protocols$_acquire_BANG_(var_args){
var G__43923 = arguments.length;
switch (G__43923) {
case 1:
return promesa.protocols._acquire_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return promesa.protocols._acquire_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(promesa.protocols._acquire_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (it){
if((((!((it == null)))) && ((!((it.promesa$protocols$ISemaphore$_acquire_BANG_$arity$1 == null)))))){
return it.promesa$protocols$ISemaphore$_acquire_BANG_$arity$1(it);
} else {
return promesa$protocols$ISemaphore$_acquire_BANG_$dyn_44461(it);
}
}));

(promesa.protocols._acquire_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (it,n){
if((((!((it == null)))) && ((!((it.promesa$protocols$ISemaphore$_acquire_BANG_$arity$2 == null)))))){
return it.promesa$protocols$ISemaphore$_acquire_BANG_$arity$2(it,n);
} else {
return promesa$protocols$ISemaphore$_acquire_BANG_$dyn_44461(it,n);
}
}));

(promesa.protocols._acquire_BANG_.cljs$lang$maxFixedArity = 2);


var promesa$protocols$ISemaphore$_release_BANG_$dyn_44467 = (function() {
var G__44468 = null;
var G__44468__1 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._release_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._release_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("ISemaphore.-release!",it);
}
}
});
var G__44468__2 = (function (it,n){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._release_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(it,n) : m__5351__auto__.call(null,it,n));
} else {
var m__5349__auto__ = (promesa.protocols._release_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(it,n) : m__5349__auto__.call(null,it,n));
} else {
throw cljs.core.missing_protocol("ISemaphore.-release!",it);
}
}
});
G__44468 = function(it,n){
switch(arguments.length){
case 1:
return G__44468__1.call(this,it);
case 2:
return G__44468__2.call(this,it,n);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__44468.cljs$core$IFn$_invoke$arity$1 = G__44468__1;
G__44468.cljs$core$IFn$_invoke$arity$2 = G__44468__2;
return G__44468;
})()
;
/**
 * Release 1 or N permits
 */
promesa.protocols._release_BANG_ = (function promesa$protocols$_release_BANG_(var_args){
var G__43929 = arguments.length;
switch (G__43929) {
case 1:
return promesa.protocols._release_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return promesa.protocols._release_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(promesa.protocols._release_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (it){
if((((!((it == null)))) && ((!((it.promesa$protocols$ISemaphore$_release_BANG_$arity$1 == null)))))){
return it.promesa$protocols$ISemaphore$_release_BANG_$arity$1(it);
} else {
return promesa$protocols$ISemaphore$_release_BANG_$dyn_44467(it);
}
}));

(promesa.protocols._release_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (it,n){
if((((!((it == null)))) && ((!((it.promesa$protocols$ISemaphore$_release_BANG_$arity$2 == null)))))){
return it.promesa$protocols$ISemaphore$_release_BANG_$arity$2(it,n);
} else {
return promesa$protocols$ISemaphore$_release_BANG_$dyn_44467(it,n);
}
}));

(promesa.protocols._release_BANG_.cljs$lang$maxFixedArity = 2);



/**
 * An experimental lock protocol, used internally; no public api
 * @interface
 */
promesa.protocols.ILock = function(){};

var promesa$protocols$ILock$_lock_BANG_$dyn_44472 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._lock_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._lock_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("ILock.-lock!",it);
}
}
});
promesa.protocols._lock_BANG_ = (function promesa$protocols$_lock_BANG_(it){
if((((!((it == null)))) && ((!((it.promesa$protocols$ILock$_lock_BANG_$arity$1 == null)))))){
return it.promesa$protocols$ILock$_lock_BANG_$arity$1(it);
} else {
return promesa$protocols$ILock$_lock_BANG_$dyn_44472(it);
}
});

var promesa$protocols$ILock$_unlock_BANG_$dyn_44473 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._unlock_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._unlock_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("ILock.-unlock!",it);
}
}
});
promesa.protocols._unlock_BANG_ = (function promesa$protocols$_unlock_BANG_(it){
if((((!((it == null)))) && ((!((it.promesa$protocols$ILock$_unlock_BANG_$arity$1 == null)))))){
return it.promesa$protocols$ILock$_unlock_BANG_$arity$1(it);
} else {
return promesa$protocols$ILock$_unlock_BANG_$dyn_44473(it);
}
});


/**
 * @interface
 */
promesa.protocols.IReadChannel = function(){};

var promesa$protocols$IReadChannel$_take_BANG_$dyn_44475 = (function (it,handler){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._take_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(it,handler) : m__5351__auto__.call(null,it,handler));
} else {
var m__5349__auto__ = (promesa.protocols._take_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(it,handler) : m__5349__auto__.call(null,it,handler));
} else {
throw cljs.core.missing_protocol("IReadChannel.-take!",it);
}
}
});
promesa.protocols._take_BANG_ = (function promesa$protocols$_take_BANG_(it,handler){
if((((!((it == null)))) && ((!((it.promesa$protocols$IReadChannel$_take_BANG_$arity$2 == null)))))){
return it.promesa$protocols$IReadChannel$_take_BANG_$arity$2(it,handler);
} else {
return promesa$protocols$IReadChannel$_take_BANG_$dyn_44475(it,handler);
}
});


/**
 * @interface
 */
promesa.protocols.IWriteChannel = function(){};

var promesa$protocols$IWriteChannel$_put_BANG_$dyn_44477 = (function (it,val,handler){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._put_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(it,val,handler) : m__5351__auto__.call(null,it,val,handler));
} else {
var m__5349__auto__ = (promesa.protocols._put_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(it,val,handler) : m__5349__auto__.call(null,it,val,handler));
} else {
throw cljs.core.missing_protocol("IWriteChannel.-put!",it);
}
}
});
promesa.protocols._put_BANG_ = (function promesa$protocols$_put_BANG_(it,val,handler){
if((((!((it == null)))) && ((!((it.promesa$protocols$IWriteChannel$_put_BANG_$arity$3 == null)))))){
return it.promesa$protocols$IWriteChannel$_put_BANG_$arity$3(it,val,handler);
} else {
return promesa$protocols$IWriteChannel$_put_BANG_$dyn_44477(it,val,handler);
}
});


/**
 * @interface
 */
promesa.protocols.IChannelInternal = function(){};

var promesa$protocols$IChannelInternal$_cleanup_BANG_$dyn_44478 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._cleanup_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._cleanup_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("IChannelInternal.-cleanup!",it);
}
}
});
promesa.protocols._cleanup_BANG_ = (function promesa$protocols$_cleanup_BANG_(it){
if((((!((it == null)))) && ((!((it.promesa$protocols$IChannelInternal$_cleanup_BANG_$arity$1 == null)))))){
return it.promesa$protocols$IChannelInternal$_cleanup_BANG_$arity$1(it);
} else {
return promesa$protocols$IChannelInternal$_cleanup_BANG_$dyn_44478(it);
}
});


/**
 * @interface
 */
promesa.protocols.IChannelMultiplexer = function(){};

var promesa$protocols$IChannelMultiplexer$_tap_BANG_$dyn_44482 = (function (it,ch,close_QMARK_){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._tap_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(it,ch,close_QMARK_) : m__5351__auto__.call(null,it,ch,close_QMARK_));
} else {
var m__5349__auto__ = (promesa.protocols._tap_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(it,ch,close_QMARK_) : m__5349__auto__.call(null,it,ch,close_QMARK_));
} else {
throw cljs.core.missing_protocol("IChannelMultiplexer.-tap!",it);
}
}
});
promesa.protocols._tap_BANG_ = (function promesa$protocols$_tap_BANG_(it,ch,close_QMARK_){
if((((!((it == null)))) && ((!((it.promesa$protocols$IChannelMultiplexer$_tap_BANG_$arity$3 == null)))))){
return it.promesa$protocols$IChannelMultiplexer$_tap_BANG_$arity$3(it,ch,close_QMARK_);
} else {
return promesa$protocols$IChannelMultiplexer$_tap_BANG_$dyn_44482(it,ch,close_QMARK_);
}
});

var promesa$protocols$IChannelMultiplexer$_untap_BANG_$dyn_44489 = (function (it,ch){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._untap_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(it,ch) : m__5351__auto__.call(null,it,ch));
} else {
var m__5349__auto__ = (promesa.protocols._untap_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(it,ch) : m__5349__auto__.call(null,it,ch));
} else {
throw cljs.core.missing_protocol("IChannelMultiplexer.-untap!",it);
}
}
});
promesa.protocols._untap_BANG_ = (function promesa$protocols$_untap_BANG_(it,ch){
if((((!((it == null)))) && ((!((it.promesa$protocols$IChannelMultiplexer$_untap_BANG_$arity$2 == null)))))){
return it.promesa$protocols$IChannelMultiplexer$_untap_BANG_$arity$2(it,ch);
} else {
return promesa$protocols$IChannelMultiplexer$_untap_BANG_$dyn_44489(it,ch);
}
});


/**
 * @interface
 */
promesa.protocols.ICloseable = function(){};

var promesa$protocols$ICloseable$_closed_QMARK_$dyn_44494 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._closed_QMARK_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._closed_QMARK_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("ICloseable.-closed?",it);
}
}
});
promesa.protocols._closed_QMARK_ = (function promesa$protocols$_closed_QMARK_(it){
if((((!((it == null)))) && ((!((it.promesa$protocols$ICloseable$_closed_QMARK_$arity$1 == null)))))){
return it.promesa$protocols$ICloseable$_closed_QMARK_$arity$1(it);
} else {
return promesa$protocols$ICloseable$_closed_QMARK_$dyn_44494(it);
}
});

var promesa$protocols$ICloseable$_close_BANG_$dyn_44496 = (function() {
var G__44497 = null;
var G__44497__1 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._close_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._close_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("ICloseable.-close!",it);
}
}
});
var G__44497__2 = (function (it,reason){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._close_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(it,reason) : m__5351__auto__.call(null,it,reason));
} else {
var m__5349__auto__ = (promesa.protocols._close_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(it,reason) : m__5349__auto__.call(null,it,reason));
} else {
throw cljs.core.missing_protocol("ICloseable.-close!",it);
}
}
});
G__44497 = function(it,reason){
switch(arguments.length){
case 1:
return G__44497__1.call(this,it);
case 2:
return G__44497__2.call(this,it,reason);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__44497.cljs$core$IFn$_invoke$arity$1 = G__44497__1;
G__44497.cljs$core$IFn$_invoke$arity$2 = G__44497__2;
return G__44497;
})()
;
promesa.protocols._close_BANG_ = (function promesa$protocols$_close_BANG_(var_args){
var G__44017 = arguments.length;
switch (G__44017) {
case 1:
return promesa.protocols._close_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return promesa.protocols._close_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(promesa.protocols._close_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (it){
if((((!((it == null)))) && ((!((it.promesa$protocols$ICloseable$_close_BANG_$arity$1 == null)))))){
return it.promesa$protocols$ICloseable$_close_BANG_$arity$1(it);
} else {
return promesa$protocols$ICloseable$_close_BANG_$dyn_44496(it);
}
}));

(promesa.protocols._close_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (it,reason){
if((((!((it == null)))) && ((!((it.promesa$protocols$ICloseable$_close_BANG_$arity$2 == null)))))){
return it.promesa$protocols$ICloseable$_close_BANG_$arity$2(it,reason);
} else {
return promesa$protocols$ICloseable$_close_BANG_$dyn_44496(it,reason);
}
}));

(promesa.protocols._close_BANG_.cljs$lang$maxFixedArity = 2);



/**
 * @interface
 */
promesa.protocols.IBuffer = function(){};

var promesa$protocols$IBuffer$_full_QMARK_$dyn_44514 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._full_QMARK_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._full_QMARK_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("IBuffer.-full?",it);
}
}
});
promesa.protocols._full_QMARK_ = (function promesa$protocols$_full_QMARK_(it){
if((((!((it == null)))) && ((!((it.promesa$protocols$IBuffer$_full_QMARK_$arity$1 == null)))))){
return it.promesa$protocols$IBuffer$_full_QMARK_$arity$1(it);
} else {
return promesa$protocols$IBuffer$_full_QMARK_$dyn_44514(it);
}
});

var promesa$protocols$IBuffer$_poll_BANG_$dyn_44519 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._poll_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._poll_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("IBuffer.-poll!",it);
}
}
});
promesa.protocols._poll_BANG_ = (function promesa$protocols$_poll_BANG_(it){
if((((!((it == null)))) && ((!((it.promesa$protocols$IBuffer$_poll_BANG_$arity$1 == null)))))){
return it.promesa$protocols$IBuffer$_poll_BANG_$arity$1(it);
} else {
return promesa$protocols$IBuffer$_poll_BANG_$dyn_44519(it);
}
});

var promesa$protocols$IBuffer$_offer_BANG_$dyn_44527 = (function (it,val){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._offer_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(it,val) : m__5351__auto__.call(null,it,val));
} else {
var m__5349__auto__ = (promesa.protocols._offer_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(it,val) : m__5349__auto__.call(null,it,val));
} else {
throw cljs.core.missing_protocol("IBuffer.-offer!",it);
}
}
});
promesa.protocols._offer_BANG_ = (function promesa$protocols$_offer_BANG_(it,val){
if((((!((it == null)))) && ((!((it.promesa$protocols$IBuffer$_offer_BANG_$arity$2 == null)))))){
return it.promesa$protocols$IBuffer$_offer_BANG_$arity$2(it,val);
} else {
return promesa$protocols$IBuffer$_offer_BANG_$dyn_44527(it,val);
}
});

var promesa$protocols$IBuffer$_size$dyn_44534 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._size[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._size["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("IBuffer.-size",it);
}
}
});
promesa.protocols._size = (function promesa$protocols$_size(it){
if((((!((it == null)))) && ((!((it.promesa$protocols$IBuffer$_size$arity$1 == null)))))){
return it.promesa$protocols$IBuffer$_size$arity$1(it);
} else {
return promesa$protocols$IBuffer$_size$dyn_44534(it);
}
});


/**
 * @interface
 */
promesa.protocols.IHandler = function(){};

var promesa$protocols$IHandler$_active_QMARK_$dyn_44537 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._active_QMARK_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._active_QMARK_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("IHandler.-active?",it);
}
}
});
promesa.protocols._active_QMARK_ = (function promesa$protocols$_active_QMARK_(it){
if((((!((it == null)))) && ((!((it.promesa$protocols$IHandler$_active_QMARK_$arity$1 == null)))))){
return it.promesa$protocols$IHandler$_active_QMARK_$arity$1(it);
} else {
return promesa$protocols$IHandler$_active_QMARK_$dyn_44537(it);
}
});

var promesa$protocols$IHandler$_commit_BANG_$dyn_44540 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._commit_BANG_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._commit_BANG_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("IHandler.-commit!",it);
}
}
});
promesa.protocols._commit_BANG_ = (function promesa$protocols$_commit_BANG_(it){
if((((!((it == null)))) && ((!((it.promesa$protocols$IHandler$_commit_BANG_$arity$1 == null)))))){
return it.promesa$protocols$IHandler$_commit_BANG_$arity$1(it);
} else {
return promesa$protocols$IHandler$_commit_BANG_$dyn_44540(it);
}
});

var promesa$protocols$IHandler$_blockable_QMARK_$dyn_44544 = (function (it){
var x__5350__auto__ = (((it == null))?null:it);
var m__5351__auto__ = (promesa.protocols._blockable_QMARK_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5351__auto__.call(null,it));
} else {
var m__5349__auto__ = (promesa.protocols._blockable_QMARK_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(it) : m__5349__auto__.call(null,it));
} else {
throw cljs.core.missing_protocol("IHandler.-blockable?",it);
}
}
});
promesa.protocols._blockable_QMARK_ = (function promesa$protocols$_blockable_QMARK_(it){
if((((!((it == null)))) && ((!((it.promesa$protocols$IHandler$_blockable_QMARK_$arity$1 == null)))))){
return it.promesa$protocols$IHandler$_blockable_QMARK_$arity$1(it);
} else {
return promesa$protocols$IHandler$_blockable_QMARK_$dyn_44544(it);
}
});


//# sourceMappingURL=promesa.protocols.js.map
