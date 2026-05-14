goog.provide('frontend.loader');
frontend.loader.load = (function frontend$loader$load(var_args){
var G__69601 = arguments.length;
switch (G__69601) {
case 2:
return frontend.loader.load.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return frontend.loader.load.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.loader.load.cljs$core$IFn$_invoke$arity$2 = (function (url,ok_handler){
return frontend.loader.load.cljs$core$IFn$_invoke$arity$3(url,ok_handler,null);
}));

(frontend.loader.load.cljs$core$IFn$_invoke$arity$3 = (function (url,ok_handler,opts){
var loader = goog.net.jsloader.safeLoad(goog.html.legacyconversions.trustedResourceUrlFromString(cljs.core.str.cljs$core$IFn$_invoke$arity$1(url)),cljs_bean.core.__GT_js(opts));
return loader.addCallback(ok_handler);
}));

(frontend.loader.load.cljs$lang$maxFixedArity = 3);


//# sourceMappingURL=frontend.loader.js.map
