goog.provide('missionary.impl.Sleep');

/**
* @constructor
 * @implements {cljs.core.IFn}
*/
missionary.impl.Sleep.Process = (function (failure,handler,pending){
this.failure = failure;
this.handler = handler;
this.pending = pending;
this.cljs$lang$protocol_mask$partition0$ = 1;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(missionary.impl.Sleep.Process.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__57894 = (arguments.length - (1));
switch (G__57894) {
case (0):
return self__.cljs$core$IFn$_invoke$arity$0();

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((arguments.length - (1)))].join('')));

}
}));

(missionary.impl.Sleep.Process.prototype.apply = (function (self__,args57892){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args57892)));
}));

(missionary.impl.Sleep.Process.prototype.cljs$core$IFn$_invoke$arity$0 = (function (){
var self__ = this;
var s = this;
return (missionary.impl.Sleep.cancel.cljs$core$IFn$_invoke$arity$1 ? missionary.impl.Sleep.cancel.cljs$core$IFn$_invoke$arity$1(s) : missionary.impl.Sleep.cancel.call(null,s));
}));

(missionary.impl.Sleep.Process.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"failure","failure",-1934019890,null),new cljs.core.Symbol(null,"handler","handler",1444934915,null),cljs.core.with_meta(new cljs.core.Symbol(null,"pending","pending",1420494800,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"boolean","boolean",-278886877,null)], null))], null);
}));

(missionary.impl.Sleep.Process.cljs$lang$type = true);

(missionary.impl.Sleep.Process.cljs$lang$ctorStr = "missionary.impl.Sleep/Process");

(missionary.impl.Sleep.Process.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.Sleep/Process");
}));

/**
 * Positional factory function for missionary.impl.Sleep/Process.
 */
missionary.impl.Sleep.__GT_Process = (function missionary$impl$Sleep$__GT_Process(failure,handler,pending){
return (new missionary.impl.Sleep.Process(failure,handler,pending));
});

missionary.impl.Sleep.cancel = (function missionary$impl$Sleep$cancel(s){
if(cljs.core.truth_(s.pending)){
(s.pending = false);

clearTimeout(s.handler);

var G__57909 = (new missionary.Cancelled("Sleep cancelled."));
var fexpr__57908 = s.failure;
return (fexpr__57908.cljs$core$IFn$_invoke$arity$1 ? fexpr__57908.cljs$core$IFn$_invoke$arity$1(G__57909) : fexpr__57908.call(null,G__57909));
} else {
return null;
}
});
missionary.impl.Sleep.run = (function missionary$impl$Sleep$run(d,x,s,f){
var slp = missionary.impl.Sleep.__GT_Process(f,null,true);
(slp.handler = setTimeout((function (){
(slp.pending = false);

return (s.cljs$core$IFn$_invoke$arity$1 ? s.cljs$core$IFn$_invoke$arity$1(x) : s.call(null,x));
}),d));

return slp;
});

//# sourceMappingURL=missionary.impl.Sleep.js.map
