goog.provide('missionary.impl.Watch');


/**
* @constructor
 * @implements {cljs.core.IFn}
 * @implements {cljs.core.IDeref}
*/
missionary.impl.Watch.Process = (function (notifier,terminator,reference,value){
this.notifier = notifier;
this.terminator = terminator;
this.reference = reference;
this.value = value;
this.cljs$lang$protocol_mask$partition0$ = 32769;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(missionary.impl.Watch.Process.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__57320 = (arguments.length - (1));
switch (G__57320) {
case (0):
return self__.cljs$core$IFn$_invoke$arity$0();

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((arguments.length - (1)))].join('')));

}
}));

(missionary.impl.Watch.Process.prototype.apply = (function (self__,args57316){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args57316)));
}));

(missionary.impl.Watch.Process.prototype.cljs$core$IFn$_invoke$arity$0 = (function (){
var self__ = this;
var this$ = this;
(missionary.impl.Watch.kill.cljs$core$IFn$_invoke$arity$1 ? missionary.impl.Watch.kill.cljs$core$IFn$_invoke$arity$1(this$) : missionary.impl.Watch.kill.call(null,this$));

return null;
}));

(missionary.impl.Watch.Process.prototype.cljs$core$IDeref$_deref$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return (missionary.impl.Watch.transfer.cljs$core$IFn$_invoke$arity$1 ? missionary.impl.Watch.transfer.cljs$core$IFn$_invoke$arity$1(this$__$1) : missionary.impl.Watch.transfer.call(null,this$__$1));
}));

(missionary.impl.Watch.Process.getBasis = (function (){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"notifier","notifier",1670358652,null),new cljs.core.Symbol(null,"terminator","terminator",-1051388676,null),new cljs.core.Symbol(null,"reference","reference",-71163496,null),new cljs.core.Symbol(null,"value","value",1946509744,null)], null);
}));

(missionary.impl.Watch.Process.cljs$lang$type = true);

(missionary.impl.Watch.Process.cljs$lang$ctorStr = "missionary.impl.Watch/Process");

(missionary.impl.Watch.Process.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.Watch/Process");
}));

/**
 * Positional factory function for missionary.impl.Watch/Process.
 */
missionary.impl.Watch.__GT_Process = (function missionary$impl$Watch$__GT_Process(notifier,terminator,reference,value){
return (new missionary.impl.Watch.Process(notifier,terminator,reference,value));
});

missionary.impl.Watch.watch = (function missionary$impl$Watch$watch(ps,_,___$1,curr){
var temp__5808__auto__ = ps.notifier;
if((temp__5808__auto__ == null)){
return null;
} else {
var cb = temp__5808__auto__;
var x = ps.value;
(ps.value = curr);

if((x === ps)){
return (cb.cljs$core$IFn$_invoke$arity$0 ? cb.cljs$core$IFn$_invoke$arity$0() : cb.call(null));
} else {
return null;
}
}
});
missionary.impl.Watch.kill = (function missionary$impl$Watch$kill(ps){
var temp__5808__auto__ = ps.notifier;
if((temp__5808__auto__ == null)){
return null;
} else {
var cb = temp__5808__auto__;
(ps.notifier = null);

var x = ps.value;
(ps.value = null);

if((x === ps)){
return (cb.cljs$core$IFn$_invoke$arity$0 ? cb.cljs$core$IFn$_invoke$arity$0() : cb.call(null));
} else {
return null;
}
}
});
missionary.impl.Watch.transfer = (function missionary$impl$Watch$transfer(ps){
if((ps.notifier == null)){
var fexpr__57349_57370 = ps.terminator;
(fexpr__57349_57370.cljs$core$IFn$_invoke$arity$0 ? fexpr__57349_57370.cljs$core$IFn$_invoke$arity$0() : fexpr__57349_57370.call(null));

cljs.core.remove_watch(ps.reference,ps);

throw (new missionary.Cancelled("Watch cancelled."));
} else {
var x = ps.value;
(ps.value = ps);

return x;
}
});
missionary.impl.Watch.run = (function missionary$impl$Watch$run(r,n,t){
var ps = missionary.impl.Watch.__GT_Process(n,t,r,cljs.core.deref(r));
cljs.core.add_watch(r,ps,missionary.impl.Watch.watch);

(n.cljs$core$IFn$_invoke$arity$0 ? n.cljs$core$IFn$_invoke$arity$0() : n.call(null));

return ps;
});

//# sourceMappingURL=missionary.impl.Watch.js.map
