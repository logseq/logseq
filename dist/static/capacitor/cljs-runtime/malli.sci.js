goog.provide('malli.sci');
malli.sci.evaluator = (function malli$sci$evaluator(options,fail_BANG_){
var eval_string_STAR_ = borkdude.dynaload.__GT_LazyVar((function (){
if((typeof sci !== 'undefined') && (typeof sci.core !== 'undefined') && (typeof sci.core.eval_string_STAR_ !== 'undefined')){
return sci.core.eval_string_STAR_;
} else {
var temp__5802__auto__ = cljs.core.find(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"default","default",-1987822328),null], null),new cljs.core.Keyword(null,"default","default",-1987822328));
if(cljs.core.truth_(temp__5802__auto__)){
var e__51317__auto__ = temp__5802__auto__;
return cljs.core.val(e__51317__auto__);
} else {
throw (new Error(["Var ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Symbol("sci.core","eval-string*","sci.core/eval-string*",2134763594,null))," does not exist, ",cljs.core.namespace(new cljs.core.Symbol("sci.core","eval-string*","sci.core/eval-string*",2134763594,null))," never required"].join('')));
}
}
}),null);
var init = borkdude.dynaload.__GT_LazyVar((function (){
if((typeof sci !== 'undefined') && (typeof sci.core !== 'undefined') && (typeof sci.core.init !== 'undefined')){
return sci.core.init;
} else {
var temp__5802__auto__ = cljs.core.find(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"default","default",-1987822328),null], null),new cljs.core.Keyword(null,"default","default",-1987822328));
if(cljs.core.truth_(temp__5802__auto__)){
var e__51317__auto__ = temp__5802__auto__;
return cljs.core.val(e__51317__auto__);
} else {
throw (new Error(["Var ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Symbol("sci.core","init","sci.core/init",-622666095,null))," does not exist, ",cljs.core.namespace(new cljs.core.Symbol("sci.core","init","sci.core/init",-622666095,null))," never required"].join('')));
}
}
}),null);
var fork = borkdude.dynaload.__GT_LazyVar((function (){
if((typeof sci !== 'undefined') && (typeof sci.core !== 'undefined') && (typeof sci.core.fork !== 'undefined')){
return sci.core.fork;
} else {
var temp__5802__auto__ = cljs.core.find(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"default","default",-1987822328),null], null),new cljs.core.Keyword(null,"default","default",-1987822328));
if(cljs.core.truth_(temp__5802__auto__)){
var e__51317__auto__ = temp__5802__auto__;
return cljs.core.val(e__51317__auto__);
} else {
throw (new Error(["Var ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Symbol("sci.core","fork","sci.core/fork",-1806691042,null))," does not exist, ",cljs.core.namespace(new cljs.core.Symbol("sci.core","fork","sci.core/fork",-1806691042,null))," never required"].join('')));
}
}
}),null);
return (function (){
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.deref(eval_string_STAR_);
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = cljs.core.deref(init);
if(cljs.core.truth_(and__5000__auto____$1)){
return cljs.core.deref(fork);
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
var ctx = (init.cljs$core$IFn$_invoke$arity$1 ? init.cljs$core$IFn$_invoke$arity$1(options) : init.call(null,options));
(eval_string_STAR_.cljs$core$IFn$_invoke$arity$2 ? eval_string_STAR_.cljs$core$IFn$_invoke$arity$2(ctx,"(alias 'm 'malli.core)") : eval_string_STAR_.call(null,ctx,"(alias 'm 'malli.core)"));

return (function malli$sci$evaluator_$_eval(s){
var G__51626 = (fork.cljs$core$IFn$_invoke$arity$1 ? fork.cljs$core$IFn$_invoke$arity$1(ctx) : fork.call(null,ctx));
var G__51627 = cljs.core.str.cljs$core$IFn$_invoke$arity$1(s);
return (eval_string_STAR_.cljs$core$IFn$_invoke$arity$2 ? eval_string_STAR_.cljs$core$IFn$_invoke$arity$2(G__51626,G__51627) : eval_string_STAR_.call(null,G__51626,G__51627));
});
} else {
return fail_BANG_;
}
});
});

//# sourceMappingURL=malli.sci.js.map
