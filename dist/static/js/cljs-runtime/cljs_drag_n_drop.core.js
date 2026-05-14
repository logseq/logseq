goog.provide('cljs_drag_n_drop.core');
goog.scope(function(){
  cljs_drag_n_drop.core.goog$module$goog$object = goog.module.get('goog.object');
});
cljs_drag_n_drop.core.kill_timer_BANG_ = (function cljs_drag_n_drop$core$kill_timer_BANG_(_STAR_timer){
var temp__5808__auto__ = cljs.core.deref(_STAR_timer);
if((temp__5808__auto__ == null)){
return null;
} else {
var t = temp__5808__auto__;
clearTimeout(t);

return cljs.core.reset_BANG_(_STAR_timer,null);
}
});
cljs_drag_n_drop.core.dom_key = (function cljs_drag_n_drop$core$dom_key(key){
return ["cljs-drag-n-drop.",cljs.core.str.cljs$core$IFn$_invoke$arity$1(key)].join('');
});
cljs_drag_n_drop.core.noop = (function cljs_drag_n_drop$core$noop(var_args){
var G__124440 = arguments.length;
switch (G__124440) {
case 1:
return cljs_drag_n_drop.core.noop.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs_drag_n_drop.core.noop.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs_drag_n_drop.core.noop.cljs$core$IFn$_invoke$arity$1 = (function (_){
return null;
}));

(cljs_drag_n_drop.core.noop.cljs$core$IFn$_invoke$arity$2 = (function (_,___$1){
return null;
}));

(cljs_drag_n_drop.core.noop.cljs$lang$maxFixedArity = 2);

cljs_drag_n_drop.core.subscribe_BANG_ = (function cljs_drag_n_drop$core$subscribe_BANG_(el,key,opts){
var opts__$1 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"timeout-ms","timeout-ms",754221406),(500),new cljs.core.Keyword(null,"start","start",-355208981),cljs_drag_n_drop.core.noop,new cljs.core.Keyword(null,"enter","enter",1792452624),cljs_drag_n_drop.core.noop,new cljs.core.Keyword(null,"drop","drop",364481611),cljs_drag_n_drop.core.noop,new cljs.core.Keyword(null,"leave","leave",1022579443),cljs_drag_n_drop.core.noop,new cljs.core.Keyword(null,"end","end",-268185958),cljs_drag_n_drop.core.noop], null),opts], 0));
var _STAR_timer = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var _STAR_ignore_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var _STAR_enters = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0));
var dragstart = (function (_){
return cljs.core.reset_BANG_(_STAR_ignore_QMARK_,true);
});
var dragend = (function (_){
return cljs.core.reset_BANG_(_STAR_ignore_QMARK_,false);
});
var end_BANG_ = (function (e){
cljs_drag_n_drop.core.kill_timer_BANG_(_STAR_timer);

if((cljs.core.deref(_STAR_enters) > (0))){
cljs.core.reset_BANG_(_STAR_enters,(0));

var fexpr__124470_124553 = new cljs.core.Keyword(null,"leave","leave",1022579443).cljs$core$IFn$_invoke$arity$1(opts__$1);
(fexpr__124470_124553.cljs$core$IFn$_invoke$arity$1 ? fexpr__124470_124553.cljs$core$IFn$_invoke$arity$1(e) : fexpr__124470_124553.call(null,e));
} else {
}

var fexpr__124477 = new cljs.core.Keyword(null,"end","end",-268185958).cljs$core$IFn$_invoke$arity$1(opts__$1);
return (fexpr__124477.cljs$core$IFn$_invoke$arity$1 ? fexpr__124477.cljs$core$IFn$_invoke$arity$1(e) : fexpr__124477.call(null,e));
});
var dragover = (function (e){
if(cljs.core.truth_(cljs.core.deref(_STAR_ignore_QMARK_))){
return null;
} else {
e.preventDefault();

if(((((0) === cljs.core.deref(_STAR_enters))) && ((cljs.core.deref(_STAR_timer) == null)))){
setTimeout((function (){
var fexpr__124480 = new cljs.core.Keyword(null,"start","start",-355208981).cljs$core$IFn$_invoke$arity$1(opts__$1);
return (fexpr__124480.cljs$core$IFn$_invoke$arity$1 ? fexpr__124480.cljs$core$IFn$_invoke$arity$1(e) : fexpr__124480.call(null,e));
}),(0));
} else {
}

cljs_drag_n_drop.core.kill_timer_BANG_(_STAR_timer);

return cljs.core.reset_BANG_(_STAR_timer,setTimeout((function (){
cljs.core.reset_BANG_(_STAR_timer,null);

return end_BANG_(e);
}),new cljs.core.Keyword(null,"timeout-ms","timeout-ms",754221406).cljs$core$IFn$_invoke$arity$1(opts__$1)));
}
});
var drop = (function (e){
if(cljs.core.truth_(cljs.core.deref(_STAR_ignore_QMARK_))){
return null;
} else {
e.preventDefault();

var files_124554 = cljs_drag_n_drop.core.goog$module$goog$object.get(cljs_drag_n_drop.core.goog$module$goog$object.get(e,"dataTransfer"),"files");
var fexpr__124492_124555 = new cljs.core.Keyword(null,"drop","drop",364481611).cljs$core$IFn$_invoke$arity$1(opts__$1);
(fexpr__124492_124555.cljs$core$IFn$_invoke$arity$2 ? fexpr__124492_124555.cljs$core$IFn$_invoke$arity$2(e,files_124554) : fexpr__124492_124555.call(null,e,files_124554));

return end_BANG_(e);
}
});
var dragenter = (function (e){
if((cljs.core.deref(_STAR_timer) == null)){
setTimeout((function (){
var fexpr__124501 = new cljs.core.Keyword(null,"start","start",-355208981).cljs$core$IFn$_invoke$arity$1(opts__$1);
return (fexpr__124501.cljs$core$IFn$_invoke$arity$1 ? fexpr__124501.cljs$core$IFn$_invoke$arity$1(e) : fexpr__124501.call(null,e));
}),(0));
} else {
}

if(((0) === cljs.core.deref(_STAR_enters))){
var fexpr__124502_124562 = new cljs.core.Keyword(null,"enter","enter",1792452624).cljs$core$IFn$_invoke$arity$1(opts__$1);
(fexpr__124502_124562.cljs$core$IFn$_invoke$arity$1 ? fexpr__124502_124562.cljs$core$IFn$_invoke$arity$1(e) : fexpr__124502_124562.call(null,e));
} else {
}

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_enters,cljs.core.inc);
});
var dragleave = (function (e){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(_STAR_enters,(function (p1__124452_SHARP_){
var x__5087__auto__ = (0);
var y__5088__auto__ = (p1__124452_SHARP_ - (1));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
}));

if(((0) === cljs.core.deref(_STAR_enters))){
var fexpr__124512 = new cljs.core.Keyword(null,"leave","leave",1022579443).cljs$core$IFn$_invoke$arity$1(opts__$1);
return (fexpr__124512.cljs$core$IFn$_invoke$arity$1 ? fexpr__124512.cljs$core$IFn$_invoke$arity$1(e) : fexpr__124512.call(null,e));
} else {
return null;
}
});
document.documentElement.addEventListener("dragstart",dragstart);

document.documentElement.addEventListener("drag",dragstart);

document.documentElement.addEventListener("dragend",dragend);

document.documentElement.addEventListener("dragover",dragover);

el.addEventListener("drop",drop);

el.addEventListener("dragenter",dragenter);

el.addEventListener("dragleave",dragleave);

return cljs_drag_n_drop.core.goog$module$goog$object.set(el,cljs_drag_n_drop.core.dom_key(key),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"dragover","dragover",-1169536926),new cljs.core.Keyword(null,"timer","timer",-1266967739),new cljs.core.Keyword(null,"drop","drop",364481611),new cljs.core.Keyword(null,"dragenter","dragenter",-237546900),new cljs.core.Keyword(null,"enters","enters",-845092721),new cljs.core.Keyword(null,"ignore?","ignore?",1868915892),new cljs.core.Keyword(null,"dragend","dragend",1096302264),new cljs.core.Keyword(null,"dragstart","dragstart",955864218),new cljs.core.Keyword(null,"end","end",-268185958),new cljs.core.Keyword(null,"dragleave","dragleave",-624601572)],[dragover,_STAR_timer,drop,dragenter,_STAR_enters,_STAR_ignore_QMARK_,dragend,dragstart,end_BANG_,dragleave]));
});
cljs_drag_n_drop.core.unsubscribe_BANG_ = (function cljs_drag_n_drop$core$unsubscribe_BANG_(el,key){
var s = cljs_drag_n_drop.core.goog$module$goog$object.get(el,cljs_drag_n_drop.core.dom_key(key));
cljs_drag_n_drop.core.goog$module$goog$object.remove(el,cljs_drag_n_drop.core.dom_key(key));

if((!((cljs.core.deref(new cljs.core.Keyword(null,"timer","timer",-1266967739).cljs$core$IFn$_invoke$arity$1(s)) == null)))){
var fexpr__124534_124568 = new cljs.core.Keyword(null,"end","end",-268185958).cljs$core$IFn$_invoke$arity$1(s);
(fexpr__124534_124568.cljs$core$IFn$_invoke$arity$1 ? fexpr__124534_124568.cljs$core$IFn$_invoke$arity$1(null) : fexpr__124534_124568.call(null,null));
} else {
}

document.documentElement.removeEventListener("dragstart",new cljs.core.Keyword(null,"dragstart","dragstart",955864218).cljs$core$IFn$_invoke$arity$1(s));

document.documentElement.removeEventListener("drag",new cljs.core.Keyword(null,"dragstart","dragstart",955864218).cljs$core$IFn$_invoke$arity$1(s));

document.documentElement.removeEventListener("dragend",new cljs.core.Keyword(null,"dragend","dragend",1096302264).cljs$core$IFn$_invoke$arity$1(s));

document.documentElement.removeEventListener("dragover",new cljs.core.Keyword(null,"dragover","dragover",-1169536926).cljs$core$IFn$_invoke$arity$1(s));

el.removeEventListener("drop",new cljs.core.Keyword(null,"drop","drop",364481611).cljs$core$IFn$_invoke$arity$1(s));

el.removeEventListener("dragenter",new cljs.core.Keyword(null,"dragenter","dragenter",-237546900).cljs$core$IFn$_invoke$arity$1(s));

return el.removeEventListener("dragleave",new cljs.core.Keyword(null,"dragleave","dragleave",-624601572).cljs$core$IFn$_invoke$arity$1(s));
});

//# sourceMappingURL=cljs_drag_n_drop.core.js.map
