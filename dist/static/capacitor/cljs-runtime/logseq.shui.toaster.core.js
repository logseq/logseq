goog.provide('logseq.shui.toaster.core');
if((typeof logseq !== 'undefined') && (typeof logseq.shui !== 'undefined') && (typeof logseq.shui.toaster !== 'undefined') && (typeof logseq.shui.toaster.core !== 'undefined') && (typeof logseq.shui.toaster.core.Toaster !== 'undefined')){
} else {
logseq.shui.toaster.core.Toaster = logseq.shui.util.lsui_wrap("Toaster");
}
if((typeof logseq !== 'undefined') && (typeof logseq.shui !== 'undefined') && (typeof logseq.shui.toaster !== 'undefined') && (typeof logseq.shui.toaster.core !== 'undefined') && (typeof logseq.shui.toaster.core._STAR_toast !== 'undefined')){
} else {
logseq.shui.toaster.core._STAR_toast = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
logseq.shui.toaster.core.gen_id = (function logseq$shui$toaster$core$gen_id(){
return window.LSUI.genToastId();
});
logseq.shui.toaster.core.use_toast = (function logseq$shui$toaster$core$use_toast(){
var temp__5804__auto__ = window.LSUI.useToast();
if(cljs.core.truth_(temp__5804__auto__)){
var js_toast = temp__5804__auto__;
var toast_fn_BANG_ = js_toast.toast;
var dismiss_BANG_ = js_toast.dismiss;
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (s){
var s__$1 = cljs_bean.core.__GT_js(s);
return (toast_fn_BANG_.cljs$core$IFn$_invoke$arity$1 ? toast_fn_BANG_.cljs$core$IFn$_invoke$arity$1(s__$1) : toast_fn_BANG_.call(null,s__$1));
}),dismiss_BANG_], null);
} else {
return null;
}
});
logseq.shui.toaster.core.install_toaster = rum.core.lazy_build(rum.core.build_defc,(function (){
var js_toast = window.LSUI.useToast();
logseq.shui.hooks.use_effect_BANG_((function (){
cljs.core.reset_BANG_(logseq.shui.toaster.core._STAR_toast,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"toast","toast",68598129),js_toast.toast,new cljs.core.Keyword(null,"dismiss","dismiss",412569545),js_toast.dismiss,new cljs.core.Keyword(null,"update","update",1045576396),js_toast.update], null));

return (function (){
return cljs.core.List.EMPTY;
});
}),cljs.core.PersistentVector.EMPTY);

var attrs73879 = (logseq.shui.toaster.core.Toaster.cljs$core$IFn$_invoke$arity$0 ? logseq.shui.toaster.core.Toaster.cljs$core$IFn$_invoke$arity$0() : logseq.shui.toaster.core.Toaster.call(null));
return daiquiri.core.create_element(daiquiri.core.fragment,((cljs.core.map_QMARK_(attrs73879))?daiquiri.interpreter.element_attributes(attrs73879):null),((cljs.core.map_QMARK_(attrs73879))?null:[daiquiri.interpreter.interpret(attrs73879)]));
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.static$], null),"logseq.shui.toaster.core/install-toaster");
logseq.shui.toaster.core.update_html_props = (function logseq$shui$toaster$core$update_html_props(v){
return cljs.core.update_keys(v,(function (p1__73891_SHARP_){
var G__73894 = p1__73891_SHARP_;
var G__73894__$1 = (((G__73894 instanceof cljs.core.Keyword))?G__73894.fqn:null);
switch (G__73894__$1) {
case "class":
return new cljs.core.Keyword(null,"className","className",-1983287057);

break;
case "for":
return new cljs.core.Keyword(null,"htmlFor","htmlFor",-1050291720);

break;
default:
return p1__73891_SHARP_;

}
}));
});
logseq.shui.toaster.core.interpret_vals = (function logseq$shui$toaster$core$interpret_vals(var_args){
var args__5732__auto__ = [];
var len__5726__auto___73951 = arguments.length;
var i__5727__auto___73952 = (0);
while(true){
if((i__5727__auto___73952 < len__5726__auto___73951)){
args__5732__auto__.push((arguments[i__5727__auto___73952]));

var G__73953 = (i__5727__auto___73952 + (1));
i__5727__auto___73952 = G__73953;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return logseq.shui.toaster.core.interpret_vals.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(logseq.shui.toaster.core.interpret_vals.cljs$core$IFn$_invoke$arity$variadic = (function (config,ks,args){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (config__$1,k){
var v = cljs.core.get.cljs$core$IFn$_invoke$arity$2(config__$1,k);
var v__$1 = ((cljs.core.fn_QMARK_(v))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(v,args):v);
if(cljs.core.vector_QMARK_(v__$1)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config__$1,k,daiquiri.interpreter.interpret(v__$1));
} else {
return config__$1;
}
}),config,ks);
}));

(logseq.shui.toaster.core.interpret_vals.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(logseq.shui.toaster.core.interpret_vals.cljs$lang$applyTo = (function (seq73900){
var G__73901 = cljs.core.first(seq73900);
var seq73900__$1 = cljs.core.next(seq73900);
var G__73902 = cljs.core.first(seq73900__$1);
var seq73900__$2 = cljs.core.next(seq73900__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__73901,G__73902,seq73900__$2);
}));

logseq.shui.toaster.core.toast_BANG_ = (function logseq$shui$toaster$core$toast_BANG_(var_args){
var G__73916 = arguments.length;
switch (G__73916) {
case 1:
return logseq.shui.toaster.core.toast_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return logseq.shui.toaster.core.toast_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return logseq.shui.toaster.core.toast_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.shui.toaster.core.toast_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (content_or_config){
return logseq.shui.toaster.core.toast_BANG_.cljs$core$IFn$_invoke$arity$3(content_or_config,new cljs.core.Keyword(null,"default","default",-1987822328),null);
}));

(logseq.shui.toaster.core.toast_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (content_or_config,status){
return logseq.shui.toaster.core.toast_BANG_.cljs$core$IFn$_invoke$arity$3(content_or_config,status,null);
}));

(logseq.shui.toaster.core.toast_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (content_or_config,status,opts){
var temp__5802__auto__ = cljs.core.deref(logseq.shui.toaster.core._STAR_toast);
if(cljs.core.truth_(temp__5802__auto__)){
var map__73920 = temp__5802__auto__;
var map__73920__$1 = cljs.core.__destructure_map(map__73920);
var toast = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73920__$1,new cljs.core.Keyword(null,"toast","toast",68598129));
var dismiss = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73920__$1,new cljs.core.Keyword(null,"dismiss","dismiss",412569545));
var config = ((cljs.core.map_QMARK_(content_or_config))?content_or_config:cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"description","description",-1428560544),content_or_config], null),((cljs.core.map_QMARK_(status))?status:new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"variant","variant",-424354234),status], null))], 0)));
var config__$1 = logseq.shui.toaster.core.update_html_props(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([config,opts], 0)));
var id = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(config__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return logseq.shui.toaster.core.gen_id();
}
})();
var config__$2 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(config__$1,new cljs.core.Keyword(null,"id","id",-1388402092),id);
var config__$3 = logseq.shui.toaster.core.interpret_vals.cljs$core$IFn$_invoke$arity$variadic(config__$2,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.Keyword(null,"description","description",-1428560544),new cljs.core.Keyword(null,"action","action",-811238024),new cljs.core.Keyword(null,"icon","icon",1679606541)], null),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"dismiss!","dismiss!",-2130034104),(function (){
return (dismiss.cljs$core$IFn$_invoke$arity$1 ? dismiss.cljs$core$IFn$_invoke$arity$1(id) : dismiss.call(null,id));
}),new cljs.core.Keyword(null,"update!","update!",-1453508586),(function (p1__73912_SHARP_){
return logseq.shui.toaster.core.toast_BANG_.cljs$core$IFn$_invoke$arity$1(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__73912_SHARP_,new cljs.core.Keyword(null,"id","id",-1388402092),id));
})], null)], 0));
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$1((function (){var G__73927 = cljs.core.clj__GT_js(config__$3);
return (toast.cljs$core$IFn$_invoke$arity$1 ? toast.cljs$core$IFn$_invoke$arity$1(G__73927) : toast.call(null,G__73927));
})());
} else {
return new cljs.core.Keyword(null,"exception","exception",-335277064);
}
}));

(logseq.shui.toaster.core.toast_BANG_.cljs$lang$maxFixedArity = 3);

logseq.shui.toaster.core.dismiss_BANG_ = (function logseq$shui$toaster$core$dismiss_BANG_(var_args){
var G__73932 = arguments.length;
switch (G__73932) {
case 0:
return logseq.shui.toaster.core.dismiss_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return logseq.shui.toaster.core.dismiss_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(logseq.shui.toaster.core.dismiss_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return logseq.shui.toaster.core.dismiss_BANG_.cljs$core$IFn$_invoke$arity$1(null);
}));

(logseq.shui.toaster.core.dismiss_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (id){
var temp__5804__auto__ = cljs.core.deref(logseq.shui.toaster.core._STAR_toast);
if(cljs.core.truth_(temp__5804__auto__)){
var map__73940 = temp__5804__auto__;
var map__73940__$1 = cljs.core.__destructure_map(map__73940);
var dismiss = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__73940__$1,new cljs.core.Keyword(null,"dismiss","dismiss",412569545));
return (dismiss.cljs$core$IFn$_invoke$arity$1 ? dismiss.cljs$core$IFn$_invoke$arity$1(id) : dismiss.call(null,id));
} else {
return null;
}
}));

(logseq.shui.toaster.core.dismiss_BANG_.cljs$lang$maxFixedArity = 1);


//# sourceMappingURL=logseq.shui.toaster.core.js.map
