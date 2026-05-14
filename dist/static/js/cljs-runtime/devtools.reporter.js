goog.provide('devtools.reporter');
devtools.reporter.issues_url = "https://github.com/binaryage/cljs-devtools/issues";
devtools.reporter.report_internal_error_BANG_ = (function devtools$reporter$report_internal_error_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___36873 = arguments.length;
var i__5727__auto___36875 = (0);
while(true){
if((i__5727__auto___36875 < len__5726__auto___36873)){
args__5732__auto__.push((arguments[i__5727__auto___36875]));

var G__36878 = (i__5727__auto___36875 + (1));
i__5727__auto___36875 = G__36878;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return devtools.reporter.report_internal_error_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(devtools.reporter.report_internal_error_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (e,p__36863){
var vec__36864 = p__36863;
var context = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__36864,(0),null);
var footer = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__36864,(1),null);
var console__$1 = devtools.context.get_console.call(null);
try{var message = (((e instanceof Error))?(function (){var or__5002__auto__ = e.message;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return e;
}
})():e);
var header = ["%cCLJS DevTools Error%c%s","background-color:red;color:white;font-weight:bold;padding:0px 3px;border-radius:2px;","color:red",[" ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(message)].join('')];
var context_msg = ["In ",devtools.util.get_lib_info(),(cljs.core.truth_(context)?[", ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(context),"."].join(''):"."),"\n\n"].join('');
var footer_msg = (((!((footer == null))))?footer:["\n\n","---\n","Please report the issue here: ",devtools.reporter.issues_url].join(''));
var details = [context_msg,e,footer_msg];
var group_collapsed = (console__$1["groupCollapsed"]);
var log = (console__$1["log"]);
var group_end = (console__$1["groupEnd"]);
if(cljs.core.truth_(group_collapsed)){
} else {
throw (new Error("Assert failed: group-collapsed"));
}

if(cljs.core.truth_(log)){
} else {
throw (new Error("Assert failed: log"));
}

if(cljs.core.truth_(group_end)){
} else {
throw (new Error("Assert failed: group-end"));
}

group_collapsed.apply(console__$1,header);

log.apply(console__$1,details);

return group_end.call(console__$1);
}catch (e36867){var e__$1 = e36867;
return console__$1.error("FATAL: report-internal-error! failed",e__$1);
}}));

(devtools.reporter.report_internal_error_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(devtools.reporter.report_internal_error_BANG_.cljs$lang$applyTo = (function (seq36858){
var G__36859 = cljs.core.first(seq36858);
var seq36858__$1 = cljs.core.next(seq36858);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__36859,seq36858__$1);
}));


//# sourceMappingURL=devtools.reporter.js.map
