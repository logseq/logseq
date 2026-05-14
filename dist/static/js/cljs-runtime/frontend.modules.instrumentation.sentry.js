goog.provide('frontend.modules.instrumentation.sentry');
var module$node_modules$$sentry$react$dist$index=shadow.js.require("module$node_modules$$sentry$react$dist$index", {});
/**
 * @define {string}
 */
frontend.modules.instrumentation.sentry.SENTRY_DSN = goog.define("frontend.modules.instrumentation.sentry.SENTRY_DSN","");
frontend.modules.instrumentation.sentry.config = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"dsn","dsn",1561266567),frontend.modules.instrumentation.sentry.SENTRY_DSN,new cljs.core.Keyword(null,"release","release",-1534371381),(function (){var G__127285 = "logseq%s@%s";
var G__127286 = (cljs.core.truth_(frontend.mobile.util.native_android_QMARK_())?"-android":(cljs.core.truth_(frontend.mobile.util.native_ios_QMARK_())?"-ios":""
));
var G__127287 = frontend.version.version;
return (frontend.util.format.cljs$core$IFn$_invoke$arity$3 ? frontend.util.format.cljs$core$IFn$_invoke$arity$3(G__127285,G__127286,G__127287) : frontend.util.format.call(null,G__127285,G__127286,G__127287));
})(),new cljs.core.Keyword(null,"environment","environment",-666037640),(cljs.core.truth_(frontend.config.dev_QMARK_)?"development":"production"),new cljs.core.Keyword(null,"initialScope","initialScope",-1985815457),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tags","tags",1771418977),(function (){var G__127288 = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"platform","platform",-1086422114),(cljs.core.truth_(frontend.util.electron_QMARK_())?"electron":(cljs.core.truth_(frontend.mobile.util.native_platform_QMARK_())?"mobile":"web"
)),new cljs.core.Keyword(null,"publishing","publishing",-244219384),frontend.config.publishing_QMARK_], null);
if(cljs.core.truth_(cljs.core.not_empty(frontend.config.revision))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__127288,new cljs.core.Keyword(null,"revision","revision",-1350113114),frontend.config.revision);
} else {
return G__127288;
}
})()], null),new cljs.core.Keyword(null,"debug","debug",-1608172596),frontend.config.dev_QMARK_,new cljs.core.Keyword(null,"tracesSampleRate","tracesSampleRate",446547798),1.0,new cljs.core.Keyword(null,"beforeSend","beforeSend",-1560616376),(function (event){
try{var temp__5804__auto___127293 = cljs.core.re_matches(/file:\/\/.*?\/(app\/index|static\/index)\.html(.*)/,event.request.url);
if(cljs.core.truth_(temp__5804__auto___127293)){
var vec__127290_127294 = temp__5804__auto___127293;
var __127295 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127290_127294,(0),null);
var __127296__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127290_127294,(1),null);
var query_and_fragment_127297 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__127290_127294,(2),null);
(event.request.url = ["http://localhost/index.html",cljs.core.str.cljs$core$IFn$_invoke$arity$1(query_and_fragment_127297)].join(''));
} else {
}
}catch (e127289){var e_127298 = e127289;
console.error(e_127298);
}
return event;
})], null);
frontend.modules.instrumentation.sentry.init = (function frontend$modules$instrumentation$sentry$init(){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.not(frontend.config.dev_QMARK_);
if(and__5000__auto__){
return cljs.core.not_empty(frontend.modules.instrumentation.sentry.SENTRY_DSN);
} else {
return and__5000__auto__;
}
})())){
var config_SINGLEQUOTE_ = cljs.core.clj__GT_js(frontend.modules.instrumentation.sentry.config);
return module$node_modules$$sentry$react$dist$index.init(config_SINGLEQUOTE_);
} else {
return null;
}
});
frontend.modules.instrumentation.sentry.set_user_BANG_ = (function frontend$modules$instrumentation$sentry$set_user_BANG_(id){
return module$node_modules$$sentry$react$dist$index.configureScope((function (scope){
return scope.setUser(({"id": id}));
}));
});

//# sourceMappingURL=frontend.modules.instrumentation.sentry.js.map
