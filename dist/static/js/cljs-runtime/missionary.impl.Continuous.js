goog.provide('missionary.impl.Continuous');




/**
* @constructor
 * @implements {cljs.core.IFn}
 * @implements {missionary.impl.Fiber.Fiber}
 * @implements {cljs.core.IDeref}
*/
missionary.impl.Continuous.Process = (function (notifier,terminator,value,choice,dirty,live,pending){
this.notifier = notifier;
this.terminator = terminator;
this.value = value;
this.choice = choice;
this.dirty = dirty;
this.live = live;
this.pending = pending;
this.cljs$lang$protocol_mask$partition0$ = 32769;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(missionary.impl.Continuous.Process.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__43473 = (arguments.length - (1));
switch (G__43473) {
case (0):
return self__.cljs$core$IFn$_invoke$arity$0();

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((arguments.length - (1)))].join('')));

}
}));

(missionary.impl.Continuous.Process.prototype.apply = (function (self__,args43472){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args43472)));
}));

(missionary.impl.Continuous.Process.prototype.cljs$core$IFn$_invoke$arity$0 = (function (){
var self__ = this;
var this$ = this;
(missionary.impl.Continuous.kill.cljs$core$IFn$_invoke$arity$1 ? missionary.impl.Continuous.kill.cljs$core$IFn$_invoke$arity$1(this$) : missionary.impl.Continuous.kill.call(null,this$));

return null;
}));

(missionary.impl.Continuous.Process.prototype.cljs$core$IDeref$_deref$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return (missionary.impl.Continuous.transfer.cljs$core$IFn$_invoke$arity$1 ? missionary.impl.Continuous.transfer.cljs$core$IFn$_invoke$arity$1(this$__$1) : missionary.impl.Continuous.transfer.call(null,this$__$1));
}));

(missionary.impl.Continuous.Process.prototype.missionary$impl$Fiber$Fiber$ = cljs.core.PROTOCOL_SENTINEL);

(missionary.impl.Continuous.Process.prototype.missionary$impl$Fiber$Fiber$park$arity$2 = (function (_,___$1){
var self__ = this;
var ___$2 = this;
throw (new Error("Unsupported operation."));
}));

(missionary.impl.Continuous.Process.prototype.missionary$impl$Fiber$Fiber$fork$arity$3 = (function (_,___$1,___$2){
var self__ = this;
var ___$3 = this;
throw (new Error("Unsupported operation."));
}));

(missionary.impl.Continuous.Process.prototype.missionary$impl$Fiber$Fiber$swich$arity$2 = (function (this$,flow){
var self__ = this;
var this$__$1 = this;
return (missionary.impl.Continuous.suspend.cljs$core$IFn$_invoke$arity$2 ? missionary.impl.Continuous.suspend.cljs$core$IFn$_invoke$arity$2(this$__$1,flow) : missionary.impl.Continuous.suspend.call(null,this$__$1,flow));
}));

(missionary.impl.Continuous.Process.prototype.missionary$impl$Fiber$Fiber$check$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
if(self__.live){
return null;
} else {
throw (new missionary.Cancelled("Process cancelled."));
}
}));

(missionary.impl.Continuous.Process.prototype.missionary$impl$Fiber$Fiber$unpark$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return (missionary.impl.Continuous.push.cljs$core$IFn$_invoke$arity$1 ? missionary.impl.Continuous.push.cljs$core$IFn$_invoke$arity$1(self__.choice) : missionary.impl.Continuous.push.call(null,self__.choice));
}));

(missionary.impl.Continuous.Process.getBasis = (function (){
return new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"notifier","notifier",1670358652,null),new cljs.core.Symbol(null,"terminator","terminator",-1051388676,null),new cljs.core.Symbol(null,"value","value",1946509744,null),new cljs.core.Symbol(null,"choice","choice",265360800,null),new cljs.core.Symbol(null,"dirty","dirty",-1924882488,null),cljs.core.with_meta(new cljs.core.Symbol(null,"live","live",30383488,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"boolean","boolean",-278886877,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"pending","pending",1420494800,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"number","number",-1084057331,null)], null))], null);
}));

(missionary.impl.Continuous.Process.cljs$lang$type = true);

(missionary.impl.Continuous.Process.cljs$lang$ctorStr = "missionary.impl.Continuous/Process");

(missionary.impl.Continuous.Process.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.Continuous/Process");
}));

/**
 * Positional factory function for missionary.impl.Continuous/Process.
 */
missionary.impl.Continuous.__GT_Process = (function missionary$impl$Continuous$__GT_Process(notifier,terminator,value,choice,dirty,live,pending){
return (new missionary.impl.Continuous.Process(notifier,terminator,value,choice,dirty,live,pending));
});


/**
* @constructor
*/
missionary.impl.Continuous.Choice = (function (process,prev,next,child,sibling,backtrack,iterator,value,busy,done,rank){
this.process = process;
this.prev = prev;
this.next = next;
this.child = child;
this.sibling = sibling;
this.backtrack = backtrack;
this.iterator = iterator;
this.value = value;
this.busy = busy;
this.done = done;
this.rank = rank;
});

(missionary.impl.Continuous.Choice.getBasis = (function (){
return new cljs.core.PersistentVector(null, 11, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.with_meta(new cljs.core.Symbol(null,"process","process",-1011242831,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"Process","Process",841236867,null)], null)),new cljs.core.Symbol(null,"prev","prev",43462301,null),new cljs.core.Symbol(null,"next","next",1522830042,null),new cljs.core.Symbol(null,"child","child",-2030468224,null),new cljs.core.Symbol(null,"sibling","sibling",456666527,null),new cljs.core.Symbol(null,"backtrack","backtrack",-450871918,null),new cljs.core.Symbol(null,"iterator","iterator",-32550441,null),new cljs.core.Symbol(null,"value","value",1946509744,null),cljs.core.with_meta(new cljs.core.Symbol(null,"busy","busy",1312244726,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"boolean","boolean",-278886877,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"done","done",750687339,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"boolean","boolean",-278886877,null)], null)),cljs.core.with_meta(new cljs.core.Symbol(null,"rank","rank",-66196975,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol(null,"number","number",-1084057331,null)], null))], null);
}));

(missionary.impl.Continuous.Choice.cljs$lang$type = true);

(missionary.impl.Continuous.Choice.cljs$lang$ctorStr = "missionary.impl.Continuous/Choice");

(missionary.impl.Continuous.Choice.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.Continuous/Choice");
}));

/**
 * Positional factory function for missionary.impl.Continuous/Choice.
 */
missionary.impl.Continuous.__GT_Choice = (function missionary$impl$Continuous$__GT_Choice(process,prev,next,child,sibling,backtrack,iterator,value,busy,done,rank){
return (new missionary.impl.Continuous.Choice(process,prev,next,child,sibling,backtrack,iterator,value,busy,done,rank));
});


/**
* @constructor
 * @implements {cljs.core.IFn}
*/
missionary.impl.Continuous.Flow = (function (cr){
this.cr = cr;
this.cljs$lang$protocol_mask$partition0$ = 1;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(missionary.impl.Continuous.Flow.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__43515 = (arguments.length - (1));
switch (G__43515) {
case (2):
return self__.cljs$core$IFn$_invoke$arity$2((arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((arguments.length - (1)))].join('')));

}
}));

(missionary.impl.Continuous.Flow.prototype.apply = (function (self__,args43513){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args43513)));
}));

(missionary.impl.Continuous.Flow.prototype.cljs$core$IFn$_invoke$arity$2 = (function (n,t){
var self__ = this;
var _ = this;
(n.cljs$core$IFn$_invoke$arity$0 ? n.cljs$core$IFn$_invoke$arity$0() : n.call(null));

return missionary.impl.Continuous.__GT_Process(n,t,self__.cr,null,null,true,(0));
}));

(missionary.impl.Continuous.Flow.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"cr","cr",621502674,null)], null);
}));

(missionary.impl.Continuous.Flow.cljs$lang$type = true);

(missionary.impl.Continuous.Flow.cljs$lang$ctorStr = "missionary.impl.Continuous/Flow");

(missionary.impl.Continuous.Flow.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.Continuous/Flow");
}));

/**
 * Positional factory function for missionary.impl.Continuous/Flow.
 */
missionary.impl.Continuous.__GT_Flow = (function missionary$impl$Continuous$__GT_Flow(cr){
return (new missionary.impl.Continuous.Flow(cr));
});

missionary.impl.Continuous.top = (function missionary$impl$Continuous$top(ch){
if(cljs.core.truth_(ch.process.live)){
return null;
} else {
var fexpr__43532 = ch.iterator;
return (fexpr__43532.cljs$core$IFn$_invoke$arity$0 ? fexpr__43532.cljs$core$IFn$_invoke$arity$0() : fexpr__43532.call(null));
}
});
missionary.impl.Continuous.detach = (function missionary$impl$Continuous$detach(ch){
var ps = ch.process;
var p = ch.prev;
(ch.prev = null);

if((ch === p)){
(ps.choice = null);
} else {
var n_43795 = ch.next;
(n_43795.prev = p);

(p.next = n_43795);

if((ch === ps.choice)){
(ps.choice = p);
} else {
if((p === ps.choice)){
missionary.impl.Continuous.top(n_43795);
} else {
}
}
}

return (ch.next = null);
});
missionary.impl.Continuous.link = (function missionary$impl$Continuous$link(x,y){
if((x.rank < y.rank)){
(y.sibling = x.child);

(x.child = y);

return x;
} else {
(x.sibling = y.child);

(y.child = x);

return y;
}
});
missionary.impl.Continuous.prune = (function missionary$impl$Continuous$prune(ch){
var ps = ch.process;
while(true){
var c = ps.choice;
if((c === ch)){
return null;
} else {
var p = c.prev;
var n = c.next;
(c.prev = null);

(c.next = null);

(p.next = n);

(n.prev = p);

(ps.choice = p);

var fexpr__43558_43809 = c.iterator;
(fexpr__43558_43809.cljs$core$IFn$_invoke$arity$0 ? fexpr__43558_43809.cljs$core$IFn$_invoke$arity$0() : fexpr__43558_43809.call(null));

continue;
}
break;
}
});
missionary.impl.Continuous.step = (function missionary$impl$Continuous$step(ps,cr){
var f = missionary.impl.Fiber.fiber;
(missionary.impl.Fiber.fiber = ps);

var r = (function (){try{var cr__$1 = cr;
while(true){
var cr__$2 = (cr__$1.cljs$core$IFn$_invoke$arity$1 ? cr__$1.cljs$core$IFn$_invoke$arity$1(cljs.core.identity) : cr__$1.call(null,cljs.core.identity));
var r = (cr__$2.cljs$core$IFn$_invoke$arity$0 ? cr__$2.cljs$core$IFn$_invoke$arity$0() : cr__$2.call(null));
if((r === ps)){
var G__43811 = (ps.choice.backtrack = cr__$2);
cr__$1 = G__43811;
continue;
} else {
return r;
}
break;
}
}catch (e43564){var e = e43564;
var temp__5808__auto___43812 = ps.choice;
if((temp__5808__auto___43812 == null)){
} else {
var ch_43814 = temp__5808__auto___43812;
var ch_43815__$1 = ch_43814.next;
missionary.impl.Continuous.prune(ch_43815__$1);

(ch_43815__$1.prev = null);

(ch_43815__$1.next = null);

(ps.choice = null);

var fexpr__43573_43817 = ch_43815__$1.iterator;
(fexpr__43573_43817.cljs$core$IFn$_invoke$arity$0 ? fexpr__43573_43817.cljs$core$IFn$_invoke$arity$0() : fexpr__43573_43817.call(null));
}

(ps.notifier = null);

return e;
}})();
(missionary.impl.Fiber.fiber = f);

return r;
});
missionary.impl.Continuous.pull = (function missionary$impl$Continuous$pull(ch,x){
var ps = ch.process;
var bt = ch.backtrack;
try{while(true){
var r = cljs.core.deref(ch.iterator);
if(cljs.core.truth_(ch.busy)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(ch.value,(ch.value = r))){
(ch.busy = false);

return x;
} else {
missionary.impl.Continuous.prune(ch);

return missionary.impl.Continuous.step(ps,bt);
}
} else {
if(cljs.core.truth_(ch.done)){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(ch.value,(ch.value = r))){
(ps.pending = (ps.pending - (1)));

missionary.impl.Continuous.detach(ch);

return x;
} else {
missionary.impl.Continuous.prune(ch);

return missionary.impl.Continuous.step(ps,bt);
}
} else {
(ch.busy = true);

continue;
}
}
break;
}
}catch (e43589){var e = e43589;
(ch.iterator = null);

(ch.value = e);

missionary.impl.Continuous.prune(ch);

return missionary.impl.Continuous.step(ps,bt);
}});
missionary.impl.Continuous.dequeue = (function missionary$impl$Continuous$dequeue(c){
var head = c.child;
(c.child = null);

var heap = null;
var prev = null;
var head__$1 = head;
while(true){
if((head__$1 == null)){
if((prev == null)){
return heap;
} else {
if((heap == null)){
return prev;
} else {
return missionary.impl.Continuous.link(heap,prev);
}
}
} else {
var next = head__$1.sibling;
(head__$1.sibling = null);

if((prev == null)){
var G__43824 = heap;
var G__43825 = head__$1;
var G__43826 = next;
heap = G__43824;
prev = G__43825;
head__$1 = G__43826;
continue;
} else {
var head__$2 = missionary.impl.Continuous.link(prev,head__$1);
var G__43828 = (((heap == null))?head__$2:missionary.impl.Continuous.link(heap,head__$2));
var G__43829 = null;
var G__43830 = next;
heap = G__43828;
prev = G__43829;
head__$1 = G__43830;
continue;
}
}
break;
}
});
missionary.impl.Continuous.ready = (function missionary$impl$Continuous$ready(ch){
var ps = ch.process;
while(true){
if(cljs.core.truth_((ch.busy = cljs.core.not(ch.busy)))){
if(cljs.core.truth_(ch.done)){
if((ch.prev == null)){
} else {
missionary.impl.Continuous.detach(ch);
}

if(((ps.pending = (ps.pending - (1))) === (0))){
if((ps === ps.value)){
return null;
} else {
return ps.terminator;
}
} else {
return null;
}
} else {
if((ch.prev == null)){
try{cljs.core.deref(ch.iterator);
}catch (e43650){var __43832 = e43650;
}
continue;
} else {
var temp__5806__auto__ = ps.dirty;
if((temp__5806__auto__ == null)){
(ps.dirty = ch);

if((ps === ps.value)){
return null;
} else {
return ps.notifier;
}
} else {
var d = temp__5806__auto__;
(ps.dirty = missionary.impl.Continuous.link(d,ch));

return null;
}
}
}
} else {
return null;
}
break;
}
});
missionary.impl.Continuous.suspend = (function missionary$impl$Continuous$suspend(ps,f){
var ch = missionary.impl.Continuous.__GT_Choice(ps,null,null,null,null,null,null,ps,true,false,(0));
(ch.iterator = (function (){var G__43697 = (function (){
var temp__5808__auto__ = missionary.impl.Continuous.ready(ch);
if((temp__5808__auto__ == null)){
return null;
} else {
var cb = temp__5808__auto__;
return (cb.cljs$core$IFn$_invoke$arity$0 ? cb.cljs$core$IFn$_invoke$arity$0() : cb.call(null));
}
});
var G__43698 = (function (){
(ch.done = true);

var temp__5808__auto__ = missionary.impl.Continuous.ready(ch);
if((temp__5808__auto__ == null)){
return null;
} else {
var cb = temp__5808__auto__;
return (cb.cljs$core$IFn$_invoke$arity$0 ? cb.cljs$core$IFn$_invoke$arity$0() : cb.call(null));
}
});
return (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(G__43697,G__43698) : f.call(null,G__43697,G__43698));
})());

var temp__5806__auto___43836 = ps.choice;
if((temp__5806__auto___43836 == null)){
(ch.prev = ch);

(ch.next = ch);

missionary.impl.Continuous.top(ch);
} else {
var p_43838 = temp__5806__auto___43836;
var n_43839 = p_43838.next;
(ch.prev = p_43838);

(ch.next = n_43839);

(p_43838.next = ch);

(n_43839.prev = ch);

(ch.rank = (p_43838.rank + (1)));
}

(ps.choice = ch);

(ps.pending = (ps.pending + (1)));

return ps;
});
missionary.impl.Continuous.kill = (function missionary$impl$Continuous$kill(ps){
if(cljs.core.truth_(ps.live)){
(ps.live = false);

var temp__5808__auto__ = ps.choice;
if((temp__5808__auto__ == null)){
return null;
} else {
var ch = temp__5808__auto__;
var fexpr__43713 = ch.next.iterator;
return (fexpr__43713.cljs$core$IFn$_invoke$arity$0 ? fexpr__43713.cljs$core$IFn$_invoke$arity$0() : fexpr__43713.call(null));
}
} else {
return null;
}
});
missionary.impl.Continuous.push = (function missionary$impl$Continuous$push(ch){
var ps = ch.process;
var x = ch.value;
if((x === ps)){
if(cljs.core.truth_((ch.busy = cljs.core.not(ch.busy)))){
if(cljs.core.truth_(ch.done)){
(ps.pending = (ps.pending - (1)));

missionary.impl.Continuous.detach(ch);

throw (new Error("Undefined continuous flow."));
} else {
try{return (ch.value = (function (){while(true){
var x__$1 = cljs.core.deref(ch.iterator);
if(cljs.core.truth_(ch.busy)){
(ch.busy = false);

return x__$1;
} else {
if(cljs.core.truth_(ch.done)){
(ps.pending = (ps.pending - (1)));

missionary.impl.Continuous.detach(ch);

return x__$1;
} else {
(ch.busy = true);

continue;
}
}
break;
}
})());
}catch (e43726){var e = e43726;
if(cljs.core.truth_(ch.done)){
(ps.pending = (ps.pending - (1)));

missionary.impl.Continuous.detach(ch);
} else {
(ch.busy = false);
}

throw e;
}}
} else {
missionary.impl.Continuous.detach(ch);

var fexpr__43741_43845 = ch.iterator;
(fexpr__43741_43845.cljs$core$IFn$_invoke$arity$0 ? fexpr__43741_43845.cljs$core$IFn$_invoke$arity$0() : fexpr__43741_43845.call(null));

throw (new Error("Undefined continuous flow."));
}
} else {
if(cljs.core.truth_(ch.done)){
(ps.pending = (ps.pending - (1)));

missionary.impl.Continuous.detach(ch);
} else {
(ch.busy = false);
}

if((ch.iterator == null)){
throw x;
} else {
return x;
}
}
});
missionary.impl.Continuous.transfer = (function missionary$impl$Continuous$transfer(ps){
var x = ps.value;
(ps.value = ps);

var x__$1 = (function (){var temp__5806__auto__ = ps.dirty;
if((temp__5806__auto__ == null)){
return missionary.impl.Continuous.step(ps,x);
} else {
var d = temp__5806__auto__;
(ps.dirty = missionary.impl.Continuous.dequeue(d));

return missionary.impl.Continuous.pull(d,x);
}
})();
while(true){
var temp__5806__auto__ = ps.dirty;
if((temp__5806__auto__ == null)){
(ps.value = x__$1);

if((ps.pending === (0))){
var fexpr__43769_43861 = ps.terminator;
(fexpr__43769_43861.cljs$core$IFn$_invoke$arity$0 ? fexpr__43769_43861.cljs$core$IFn$_invoke$arity$0() : fexpr__43769_43861.call(null));
} else {
}

if((ps.notifier == null)){
throw x__$1;
} else {
return x__$1;
}
} else {
var d = temp__5806__auto__;
(ps.dirty = missionary.impl.Continuous.dequeue(d));

var G__43863 = (((d.prev == null))?(function (){
try{cljs.core.deref(d.iterator);
}catch (e43770){var __43865 = e43770;
}
missionary.impl.Continuous.ready(d);

return x__$1;
})()
:missionary.impl.Continuous.pull(d,x__$1));
x__$1 = G__43863;
continue;
}
break;
}
});
missionary.impl.Continuous.flow = missionary.impl.Continuous.__GT_Flow;

//# sourceMappingURL=missionary.impl.Continuous.js.map
