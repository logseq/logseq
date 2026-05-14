goog.provide('electron.ipc');
electron.ipc.ipc = (function electron$ipc$ipc(var_args){
var args__5732__auto__ = [];
var len__5726__auto___56868 = arguments.length;
var i__5727__auto___56869 = (0);
while(true){
if((i__5727__auto___56869 < len__5726__auto___56868)){
args__5732__auto__.push((arguments[i__5727__auto___56869]));

var G__56870 = (i__5727__auto___56869 + (1));
i__5727__auto___56869 = G__56870;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(electron.ipc.ipc.cljs$core$IFn$_invoke$arity$variadic = (function (args){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(window.apis.doAction(cljs_bean.core.__GT_js(args))),(function (result){
return promesa.protocols._promise(result);
}));
}));
} else {
return null;
}
}));

(electron.ipc.ipc.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(electron.ipc.ipc.cljs$lang$applyTo = (function (seq56836){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq56836));
}));

electron.ipc.invoke = (function electron$ipc$invoke(var_args){
var args__5732__auto__ = [];
var len__5726__auto___56871 = arguments.length;
var i__5727__auto___56872 = (0);
while(true){
if((i__5727__auto___56872 < len__5726__auto___56871)){
args__5732__auto__.push((arguments[i__5727__auto___56872]));

var G__56873 = (i__5727__auto___56872 + (1));
i__5727__auto___56872 = G__56873;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return electron.ipc.invoke.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(electron.ipc.invoke.cljs$core$IFn$_invoke$arity$variadic = (function (channel,args){
if(cljs.core.truth_(frontend.util.electron_QMARK_())){
return promesa.protocols._mcat(promesa.protocols._promise(null),(function (___40979__auto__){
return promesa.protocols._mcat(promesa.protocols._promise(window.apis.invoke(channel,cljs_bean.core.__GT_js(args))),(function (result){
return promesa.protocols._promise(result);
}));
}));
} else {
return null;
}
}));

(electron.ipc.invoke.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(electron.ipc.invoke.cljs$lang$applyTo = (function (seq56853){
var G__56854 = cljs.core.first(seq56853);
var seq56853__$1 = cljs.core.next(seq56853);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__56854,seq56853__$1);
}));


//# sourceMappingURL=electron.ipc.js.map
