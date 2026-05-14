goog.provide('missionary.impl.Semaphore');
missionary.impl.Semaphore.nop = (function missionary$impl$Semaphore$nop(){
return null;
});

/**
* @constructor
 * @implements {cljs.core.IFn}
*/
missionary.impl.Semaphore.Port = (function (available,readers){
this.available = available;
this.readers = readers;
this.cljs$lang$protocol_mask$partition0$ = 1;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(missionary.impl.Semaphore.Port.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__43860 = (arguments.length - (1));
switch (G__43860) {
case (0):
return self__.cljs$core$IFn$_invoke$arity$0();

break;
case (2):
return self__.cljs$core$IFn$_invoke$arity$2((arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((arguments.length - (1)))].join('')));

}
}));

(missionary.impl.Semaphore.Port.prototype.apply = (function (self__,args43844){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args43844)));
}));

(missionary.impl.Semaphore.Port.prototype.cljs$core$IFn$_invoke$arity$0 = (function (){
var self__ = this;
var _ = this;
var temp__5806__auto__ = cljs.core.seq(self__.readers);
if((temp__5806__auto__ == null)){
(self__.available = (self__.available + (1)));

return null;
} else {
var vec__43880 = temp__5806__auto__;
var _BANG_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__43880,(0),null);
(self__.readers = cljs.core.disj.cljs$core$IFn$_invoke$arity$2(self__.readers,_BANG_));

return (_BANG_.cljs$core$IFn$_invoke$arity$0 ? _BANG_.cljs$core$IFn$_invoke$arity$0() : _BANG_.call(null));
}
}));

(missionary.impl.Semaphore.Port.prototype.cljs$core$IFn$_invoke$arity$2 = (function (s_BANG_,f_BANG_){
var self__ = this;
var _ = this;
if((self__.available === (0))){
var _BANG_ = (function (){
return (s_BANG_.cljs$core$IFn$_invoke$arity$1 ? s_BANG_.cljs$core$IFn$_invoke$arity$1(null) : s_BANG_.call(null,null));
});
(self__.readers = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(self__.readers,_BANG_));

return (function (){
if(cljs.core.contains_QMARK_(self__.readers,_BANG_)){
(self__.readers = cljs.core.disj.cljs$core$IFn$_invoke$arity$2(self__.readers,_BANG_));

var G__43884 = (new missionary.Cancelled("Semaphore acquire cancelled."));
return (f_BANG_.cljs$core$IFn$_invoke$arity$1 ? f_BANG_.cljs$core$IFn$_invoke$arity$1(G__43884) : f_BANG_.call(null,G__43884));
} else {
return null;
}
});
} else {
(self__.available = (self__.available - (1)));

(s_BANG_.cljs$core$IFn$_invoke$arity$1 ? s_BANG_.cljs$core$IFn$_invoke$arity$1(null) : s_BANG_.call(null,null));

return missionary.impl.Semaphore.nop;
}
}));

(missionary.impl.Semaphore.Port.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.with_meta(new cljs.core.Symbol(null,"available","available",169834400,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mutable","mutable",875778266),true], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"readers","readers",-477731503,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mutable","mutable",875778266),true], null))], null);
}));

(missionary.impl.Semaphore.Port.cljs$lang$type = true);

(missionary.impl.Semaphore.Port.cljs$lang$ctorStr = "missionary.impl.Semaphore/Port");

(missionary.impl.Semaphore.Port.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.Semaphore/Port");
}));

/**
 * Positional factory function for missionary.impl.Semaphore/Port.
 */
missionary.impl.Semaphore.__GT_Port = (function missionary$impl$Semaphore$__GT_Port(available,readers){
return (new missionary.impl.Semaphore.Port(available,readers));
});

missionary.impl.Semaphore.make = (function missionary$impl$Semaphore$make(n){
return missionary.impl.Semaphore.__GT_Port(n,cljs.core.PersistentHashSet.EMPTY);
});

//# sourceMappingURL=missionary.impl.Semaphore.js.map
