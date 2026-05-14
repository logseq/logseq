goog.provide('missionary.impl.Propagator');


missionary.impl.Propagator.lt = (function missionary$impl$Propagator$lt(x,y){
var xl = x.length;
var yl = y.length;
var ml = (function (){var x__5090__auto__ = xl;
var y__5091__auto__ = yl;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var i = (0);
while(true){
if((i < ml)){
var xi = (x[i]);
var yi = (y[i]);
if((xi === yi)){
var G__58459 = (i + (1));
i = G__58459;
continue;
} else {
return (xi < yi);
}
} else {
return (xl > yl);
}
break;
}
});

/**
* @constructor
 * @implements {cljs.core.IFn}
 * @implements {cljs.core.IComparable}
*/
missionary.impl.Propagator.Publisher = (function (ranks,strategy,arg,effect,node,current){
this.ranks = ranks;
this.strategy = strategy;
this.arg = arg;
this.effect = effect;
this.node = node;
this.current = current;
this.cljs$lang$protocol_mask$partition0$ = 1;
this.cljs$lang$protocol_mask$partition1$ = 2048;
});
(missionary.impl.Propagator.Publisher.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__58077 = (arguments.length - (1));
switch (G__58077) {
case (2):
return self__.cljs$core$IFn$_invoke$arity$2((arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((arguments.length - (1)))].join('')));

}
}));

(missionary.impl.Propagator.Publisher.prototype.apply = (function (self__,args58076){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args58076)));
}));

(missionary.impl.Propagator.Publisher.prototype.cljs$core$IFn$_invoke$arity$2 = (function (lcb,rcb){
var self__ = this;
var this$ = this;
return (missionary.impl.Propagator.sub.cljs$core$IFn$_invoke$arity$3 ? missionary.impl.Propagator.sub.cljs$core$IFn$_invoke$arity$3(this$,lcb,rcb) : missionary.impl.Propagator.sub.call(null,this$,lcb,rcb));
}));

(missionary.impl.Propagator.Publisher.prototype.cljs$core$IComparable$_compare$arity$2 = (function (this$,that){
var self__ = this;
var this$__$1 = this;
if((this$__$1 === that)){
return (0);
} else {
if(missionary.impl.Propagator.lt(this$__$1.ranks,that.ranks)){
return (-1);
} else {
return (1);
}
}
}));

(missionary.impl.Propagator.Publisher.getBasis = (function (){
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"ranks","ranks",-162053339,null),new cljs.core.Symbol(null,"strategy","strategy",168899609,null),new cljs.core.Symbol(null,"arg","arg",-106730310,null),new cljs.core.Symbol(null,"effect","effect",1987874816,null),new cljs.core.Symbol(null,"node","node",-2073234571,null),new cljs.core.Symbol(null,"current","current",552492924,null)], null);
}));

(missionary.impl.Propagator.Publisher.cljs$lang$type = true);

(missionary.impl.Propagator.Publisher.cljs$lang$ctorStr = "missionary.impl.Propagator/Publisher");

(missionary.impl.Propagator.Publisher.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.Propagator/Publisher");
}));

/**
 * Positional factory function for missionary.impl.Propagator/Publisher.
 */
missionary.impl.Propagator.__GT_Publisher = (function missionary$impl$Propagator$__GT_Publisher(ranks,strategy,arg,effect,node,current){
return (new missionary.impl.Propagator.Publisher(ranks,strategy,arg,effect,node,current));
});


/**
* @constructor
*/
missionary.impl.Propagator.Process = (function (parent,pressure,owned,input,child,sibling,ready,pending,failed,dirty,flag,state){
this.parent = parent;
this.pressure = pressure;
this.owned = owned;
this.input = input;
this.child = child;
this.sibling = sibling;
this.ready = ready;
this.pending = pending;
this.failed = failed;
this.dirty = dirty;
this.flag = flag;
this.state = state;
});

(missionary.impl.Propagator.Process.getBasis = (function (){
return new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"parent","parent",761652748,null),new cljs.core.Symbol(null,"pressure","pressure",2145875274,null),new cljs.core.Symbol(null,"owned","owned",100739328,null),new cljs.core.Symbol(null,"input","input",-2097503808,null),new cljs.core.Symbol(null,"child","child",-2030468224,null),new cljs.core.Symbol(null,"sibling","sibling",456666527,null),new cljs.core.Symbol(null,"ready","ready",-1567969974,null),new cljs.core.Symbol(null,"pending","pending",1420494800,null),new cljs.core.Symbol(null,"failed","failed",243105765,null),new cljs.core.Symbol(null,"dirty","dirty",-1924882488,null),new cljs.core.Symbol(null,"flag","flag",-1565787888,null),new cljs.core.Symbol(null,"state","state",-348086572,null)], null);
}));

(missionary.impl.Propagator.Process.cljs$lang$type = true);

(missionary.impl.Propagator.Process.cljs$lang$ctorStr = "missionary.impl.Propagator/Process");

(missionary.impl.Propagator.Process.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.Propagator/Process");
}));

/**
 * Positional factory function for missionary.impl.Propagator/Process.
 */
missionary.impl.Propagator.__GT_Process = (function missionary$impl$Propagator$__GT_Process(parent,pressure,owned,input,child,sibling,ready,pending,failed,dirty,flag,state){
return (new missionary.impl.Propagator.Process(parent,pressure,owned,input,child,sibling,ready,pending,failed,dirty,flag,state));
});


/**
* @constructor
 * @implements {cljs.core.IFn}
 * @implements {cljs.core.IDeref}
*/
missionary.impl.Propagator.Subscription = (function (source,target,lcb,rcb,prev,next,ready,state){
this.source = source;
this.target = target;
this.lcb = lcb;
this.rcb = rcb;
this.prev = prev;
this.next = next;
this.ready = ready;
this.state = state;
this.cljs$lang$protocol_mask$partition0$ = 32769;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(missionary.impl.Propagator.Subscription.prototype.call = (function (unused__11818__auto__){
var self__ = this;
var self__ = this;
var G__58096 = (arguments.length - (1));
switch (G__58096) {
case (0):
return self__.cljs$core$IFn$_invoke$arity$0();

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((arguments.length - (1)))].join('')));

}
}));

(missionary.impl.Propagator.Subscription.prototype.apply = (function (self__,args58094){
var self__ = this;
var self____$1 = this;
return self____$1.call.apply(self____$1,[self____$1].concat(cljs.core.aclone(args58094)));
}));

(missionary.impl.Propagator.Subscription.prototype.cljs$core$IFn$_invoke$arity$0 = (function (){
var self__ = this;
var this$ = this;
return (missionary.impl.Propagator.unsub.cljs$core$IFn$_invoke$arity$1 ? missionary.impl.Propagator.unsub.cljs$core$IFn$_invoke$arity$1(this$) : missionary.impl.Propagator.unsub.call(null,this$));
}));

(missionary.impl.Propagator.Subscription.prototype.cljs$core$IDeref$_deref$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return (missionary.impl.Propagator.transfer.cljs$core$IFn$_invoke$arity$1 ? missionary.impl.Propagator.transfer.cljs$core$IFn$_invoke$arity$1(this$__$1) : missionary.impl.Propagator.transfer.call(null,this$__$1));
}));

(missionary.impl.Propagator.Subscription.getBasis = (function (){
return new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"source","source",1206599988,null),new cljs.core.Symbol(null,"target","target",1893533248,null),new cljs.core.Symbol(null,"lcb","lcb",-1007960090,null),new cljs.core.Symbol(null,"rcb","rcb",-172851131,null),new cljs.core.Symbol(null,"prev","prev",43462301,null),new cljs.core.Symbol(null,"next","next",1522830042,null),new cljs.core.Symbol(null,"ready","ready",-1567969974,null),new cljs.core.Symbol(null,"state","state",-348086572,null)], null);
}));

(missionary.impl.Propagator.Subscription.cljs$lang$type = true);

(missionary.impl.Propagator.Subscription.cljs$lang$ctorStr = "missionary.impl.Propagator/Subscription");

(missionary.impl.Propagator.Subscription.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.Propagator/Subscription");
}));

/**
 * Positional factory function for missionary.impl.Propagator/Subscription.
 */
missionary.impl.Propagator.__GT_Subscription = (function missionary$impl$Propagator$__GT_Subscription(source,target,lcb,rcb,prev,next,ready,state){
return (new missionary.impl.Propagator.Subscription(source,target,lcb,rcb,prev,next,ready,state));
});


/**
* @constructor
*/
missionary.impl.Propagator.Context = (function (cursor,process,reacted,delayed,buffer){
this.cursor = cursor;
this.process = process;
this.reacted = reacted;
this.delayed = delayed;
this.buffer = buffer;
});

(missionary.impl.Propagator.Context.getBasis = (function (){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"cursor","cursor",-1642498285,null),new cljs.core.Symbol(null,"process","process",-1011242831,null),new cljs.core.Symbol(null,"reacted","reacted",-2130950267,null),new cljs.core.Symbol(null,"delayed","delayed",1892523756,null),new cljs.core.Symbol(null,"buffer","buffer",-2037140571,null)], null);
}));

(missionary.impl.Propagator.Context.cljs$lang$type = true);

(missionary.impl.Propagator.Context.cljs$lang$ctorStr = "missionary.impl.Propagator/Context");

(missionary.impl.Propagator.Context.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.Propagator/Context");
}));

/**
 * Positional factory function for missionary.impl.Propagator/Context.
 */
missionary.impl.Propagator.__GT_Context = (function missionary$impl$Propagator$__GT_Context(cursor,process,reacted,delayed,buffer){
return (new missionary.impl.Propagator.Context(cursor,process,reacted,delayed,buffer));
});


/**
 * @interface
 */
missionary.impl.Propagator.Strategy = function(){};

var missionary$impl$Propagator$Strategy$tick$dyn_58464 = (function (_,ps){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (missionary.impl.Propagator.tick[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(_,ps) : m__5351__auto__.call(null,_,ps));
} else {
var m__5349__auto__ = (missionary.impl.Propagator.tick["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(_,ps) : m__5349__auto__.call(null,_,ps));
} else {
throw cljs.core.missing_protocol("Strategy.tick",_);
}
}
});
missionary.impl.Propagator.tick = (function missionary$impl$Propagator$tick(_,ps){
if((((!((_ == null)))) && ((!((_.missionary$impl$Propagator$Strategy$tick$arity$2 == null)))))){
return _.missionary$impl$Propagator$Strategy$tick$arity$2(_,ps);
} else {
return missionary$impl$Propagator$Strategy$tick$dyn_58464(_,ps);
}
});

var missionary$impl$Propagator$Strategy$publish$dyn_58465 = (function (_,ps){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (missionary.impl.Propagator.publish[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(_,ps) : m__5351__auto__.call(null,_,ps));
} else {
var m__5349__auto__ = (missionary.impl.Propagator.publish["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(_,ps) : m__5349__auto__.call(null,_,ps));
} else {
throw cljs.core.missing_protocol("Strategy.publish",_);
}
}
});
missionary.impl.Propagator.publish = (function missionary$impl$Propagator$publish(_,ps){
if((((!((_ == null)))) && ((!((_.missionary$impl$Propagator$Strategy$publish$arity$2 == null)))))){
return _.missionary$impl$Propagator$Strategy$publish$arity$2(_,ps);
} else {
return missionary$impl$Propagator$Strategy$publish$dyn_58465(_,ps);
}
});

var missionary$impl$Propagator$Strategy$refresh$dyn_58466 = (function (_,ps){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (missionary.impl.Propagator.refresh[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(_,ps) : m__5351__auto__.call(null,_,ps));
} else {
var m__5349__auto__ = (missionary.impl.Propagator.refresh["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(_,ps) : m__5349__auto__.call(null,_,ps));
} else {
throw cljs.core.missing_protocol("Strategy.refresh",_);
}
}
});
missionary.impl.Propagator.refresh = (function missionary$impl$Propagator$refresh(_,ps){
if((((!((_ == null)))) && ((!((_.missionary$impl$Propagator$Strategy$refresh$arity$2 == null)))))){
return _.missionary$impl$Propagator$Strategy$refresh$arity$2(_,ps);
} else {
return missionary$impl$Propagator$Strategy$refresh$dyn_58466(_,ps);
}
});

var missionary$impl$Propagator$Strategy$subscribe$dyn_58468 = (function (_,sub,idle){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (missionary.impl.Propagator.subscribe[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(_,sub,idle) : m__5351__auto__.call(null,_,sub,idle));
} else {
var m__5349__auto__ = (missionary.impl.Propagator.subscribe["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(_,sub,idle) : m__5349__auto__.call(null,_,sub,idle));
} else {
throw cljs.core.missing_protocol("Strategy.subscribe",_);
}
}
});
missionary.impl.Propagator.subscribe = (function missionary$impl$Propagator$subscribe(_,sub,idle){
if((((!((_ == null)))) && ((!((_.missionary$impl$Propagator$Strategy$subscribe$arity$3 == null)))))){
return _.missionary$impl$Propagator$Strategy$subscribe$arity$3(_,sub,idle);
} else {
return missionary$impl$Propagator$Strategy$subscribe$dyn_58468(_,sub,idle);
}
});

var missionary$impl$Propagator$Strategy$unsubscribe$dyn_58472 = (function (_,sub,idle){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (missionary.impl.Propagator.unsubscribe[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(_,sub,idle) : m__5351__auto__.call(null,_,sub,idle));
} else {
var m__5349__auto__ = (missionary.impl.Propagator.unsubscribe["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(_,sub,idle) : m__5349__auto__.call(null,_,sub,idle));
} else {
throw cljs.core.missing_protocol("Strategy.unsubscribe",_);
}
}
});
missionary.impl.Propagator.unsubscribe = (function missionary$impl$Propagator$unsubscribe(_,sub,idle){
if((((!((_ == null)))) && ((!((_.missionary$impl$Propagator$Strategy$unsubscribe$arity$3 == null)))))){
return _.missionary$impl$Propagator$Strategy$unsubscribe$arity$3(_,sub,idle);
} else {
return missionary$impl$Propagator$Strategy$unsubscribe$dyn_58472(_,sub,idle);
}
});

var missionary$impl$Propagator$Strategy$accept$dyn_58473 = (function (_,sub,idle){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (missionary.impl.Propagator.accept[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(_,sub,idle) : m__5351__auto__.call(null,_,sub,idle));
} else {
var m__5349__auto__ = (missionary.impl.Propagator.accept["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(_,sub,idle) : m__5349__auto__.call(null,_,sub,idle));
} else {
throw cljs.core.missing_protocol("Strategy.accept",_);
}
}
});
missionary.impl.Propagator.accept = (function missionary$impl$Propagator$accept(_,sub,idle){
if((((!((_ == null)))) && ((!((_.missionary$impl$Propagator$Strategy$accept$arity$3 == null)))))){
return _.missionary$impl$Propagator$Strategy$accept$arity$3(_,sub,idle);
} else {
return missionary$impl$Propagator$Strategy$accept$dyn_58473(_,sub,idle);
}
});

var missionary$impl$Propagator$Strategy$reject$dyn_58478 = (function (_,sub,idle){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (missionary.impl.Propagator.reject[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(_,sub,idle) : m__5351__auto__.call(null,_,sub,idle));
} else {
var m__5349__auto__ = (missionary.impl.Propagator.reject["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(_,sub,idle) : m__5349__auto__.call(null,_,sub,idle));
} else {
throw cljs.core.missing_protocol("Strategy.reject",_);
}
}
});
missionary.impl.Propagator.reject = (function missionary$impl$Propagator$reject(_,sub,idle){
if((((!((_ == null)))) && ((!((_.missionary$impl$Propagator$Strategy$reject$arity$3 == null)))))){
return _.missionary$impl$Propagator$Strategy$reject$arity$3(_,sub,idle);
} else {
return missionary$impl$Propagator$Strategy$reject$dyn_58478(_,sub,idle);
}
});

missionary.impl.Propagator.context = missionary.impl.Propagator.__GT_Context(null,null,null,null,[null]);
missionary.impl.Propagator.ceiling = [];
missionary.impl.Propagator.root = (0);
missionary.impl.Propagator.acquire = (function missionary$impl$Propagator$acquire(_){
return null;
});
missionary.impl.Propagator.release = (function missionary$impl$Propagator$release(_){
return null;
});
missionary.impl.Propagator.link = (function missionary$impl$Propagator$link(x,y){
if(missionary.impl.Propagator.lt(x.parent.ranks,y.parent.ranks)){
(y.sibling = x.child);

(x.child = y);

return x;
} else {
(x.sibling = y.child);

(y.child = x);

return y;
}
});
missionary.impl.Propagator.dequeue = (function missionary$impl$Propagator$dequeue(ps){
var head = ps.child;
(ps.child = ps);

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
return missionary.impl.Propagator.link(heap,prev);
}
}
} else {
var next = head__$1.sibling;
(head__$1.sibling = null);

if((prev == null)){
var G__58485 = heap;
var G__58486 = head__$1;
var G__58487 = next;
heap = G__58485;
prev = G__58486;
head__$1 = G__58487;
continue;
} else {
var head__$2 = missionary.impl.Propagator.link(prev,head__$1);
var G__58488 = (((heap == null))?head__$2:missionary.impl.Propagator.link(heap,head__$2));
var G__58489 = null;
var G__58490 = next;
heap = G__58488;
prev = G__58489;
head__$1 = G__58490;
continue;
}
}
break;
}
});
missionary.impl.Propagator.enqueue = (function missionary$impl$Propagator$enqueue(r,p){
(p.child = null);

if((r == null)){
return p;
} else {
return missionary.impl.Propagator.link(p,r);
}
});
missionary.impl.Propagator.schedule = (function missionary$impl$Propagator$schedule(ps){
var ctx = missionary.impl.Propagator.context;
var pub = ps.parent;
if(missionary.impl.Propagator.lt(ctx.cursor,pub.ranks)){
return (ctx.reacted = missionary.impl.Propagator.enqueue(ctx.reacted,ps));
} else {
return (ctx.delayed = missionary.impl.Propagator.enqueue(ctx.delayed,ps));
}
});
missionary.impl.Propagator.crash = (function missionary$impl$Propagator$crash(ps,e){
var pub = ps.parent;
(ps.state = e);

(ps.failed = true);

if((pub.current === ps)){
var fexpr__58206 = ps.input;
return (fexpr__58206.cljs$core$IFn$_invoke$arity$0 ? fexpr__58206.cljs$core$IFn$_invoke$arity$0() : fexpr__58206.call(null));
} else {
return null;
}
});
missionary.impl.Propagator.ack = (function missionary$impl$Propagator$ack(ps){
return ((ps.pressure = (ps.pressure - (1))) === (0));
});
missionary.impl.Propagator.detach = (function missionary$impl$Propagator$detach(s){
var p = s.prev;
var n = s.next;
(s.prev = null);

(s.next = null);

if((p === s)){
return null;
} else {
(p.next = n);

return (n.prev = p);
}
});
missionary.impl.Propagator.attach = (function missionary$impl$Propagator$attach(p,s){
if((p == null)){
(s.prev = s);

return (s.next = s);
} else {
var n = p.next;
(p.next = s);

(s.prev = p);

(s.next = n);

return (n.prev = s);
}
});
missionary.impl.Propagator.union = (function missionary$impl$Propagator$union(p,s){
if((p == null)){
return null;
} else {
var n = p.next;
var t = s.next;
(p.next = t);

(t.prev = p);

(s.next = n);

return (n.prev = s);
}
});
missionary.impl.Propagator.clear = (function missionary$impl$Propagator$clear(head){
var sub = head;
while(true){
var n = sub.next;
(sub.prev = null);

(sub.next = null);

if((n === head)){
return null;
} else {
var G__58494 = n;
sub = G__58494;
continue;
}
break;
}
});
missionary.impl.Propagator.bufferize = (function missionary$impl$Propagator$bufferize(ctx,head){
var i = (0);
var sub = head;
var buf = ctx.buffer;
while(true){
(sub.ready = false);

(buf[i] = sub);

var i__$1 = (i + (1));
var sub__$1 = sub.next;
var cap = buf.length;
var buf__$1 = (((i__$1 === cap))?(function (){var arr = (new Array((cap << (1))));
var n__5593__auto___58499 = cap;
var i_58500__$2 = (0);
while(true){
if((i_58500__$2 < n__5593__auto___58499)){
(arr[i_58500__$2] = (buf[i_58500__$2]));

var G__58501 = (i_58500__$2 + (1));
i_58500__$2 = G__58501;
continue;
} else {
}
break;
}

return arr;
})():buf);
if((sub__$1 === head)){
return (ctx.buffer = buf__$1);
} else {
var G__58503 = i__$1;
var G__58504 = sub__$1;
var G__58505 = buf__$1;
i = G__58503;
sub = G__58504;
buf = G__58505;
continue;
}
break;
}
});
missionary.impl.Propagator.terminate = (function missionary$impl$Propagator$terminate(ctx,ps){
var pub = ps.parent;
(ps.input = null);

var temp__5808__auto___58506 = ps.ready;
if((temp__5808__auto___58506 == null)){
} else {
var ready_58507 = temp__5808__auto___58506;
(ps.ready = null);

missionary.impl.Propagator.bufferize(ctx,ready_58507);

missionary.impl.Propagator.clear(ready_58507);
}

return missionary.impl.Propagator.release(pub);
});
missionary.impl.Propagator.invalidate = (function missionary$impl$Propagator$invalidate(ctx,ps){
var pub = ps.parent;
(ps.dirty = true);

var temp__5808__auto___58508 = ps.ready;
if((temp__5808__auto___58508 == null)){
} else {
var ready_58509 = temp__5808__auto___58508;
(ps.ready = null);

missionary.impl.Propagator.bufferize(ctx,ready_58509);

missionary.impl.Propagator.union(ps.pending,(ps.pending = ready_58509));
}

return missionary.impl.Propagator.release(pub);
});
missionary.impl.Propagator.step_all = (function missionary$impl$Propagator$step_all(ps){
var ctx = missionary.impl.Propagator.context;
missionary.impl.Propagator.invalidate(ctx,ps);

var buf = ctx.buffer;
var i = (0);
while(true){
var temp__5808__auto__ = (buf[i]);
if((temp__5808__auto__ == null)){
return null;
} else {
var sub = temp__5808__auto__;
(buf[i] = null);

(ctx.process = sub.source);

var fexpr__58235_58510 = sub.lcb;
(fexpr__58235_58510.cljs$core$IFn$_invoke$arity$0 ? fexpr__58235_58510.cljs$core$IFn$_invoke$arity$0() : fexpr__58235_58510.call(null));

var G__58511 = (i + (1));
i = G__58511;
continue;
}
break;
}
});
missionary.impl.Propagator.done_all = (function missionary$impl$Propagator$done_all(ps){
var ctx = missionary.impl.Propagator.context;
missionary.impl.Propagator.terminate(ctx,ps);

var buf = ctx.buffer;
var i = (0);
while(true){
var temp__5808__auto__ = (buf[i]);
if((temp__5808__auto__ == null)){
return null;
} else {
var sub = temp__5808__auto__;
(buf[i] = null);

(ctx.process = sub.source);

var fexpr__58237_58512 = sub.rcb;
(fexpr__58237_58512.cljs$core$IFn$_invoke$arity$0 ? fexpr__58237_58512.cljs$core$IFn$_invoke$arity$0() : fexpr__58237_58512.call(null));

var G__58513 = (i + (1));
i = G__58513;
continue;
}
break;
}
});
missionary.impl.Propagator.success_all = (function missionary$impl$Propagator$success_all(ps){
var ctx = missionary.impl.Propagator.context;
missionary.impl.Propagator.terminate(ctx,ps);

var buf = ctx.buffer;
var i = (0);
while(true){
var temp__5808__auto__ = (buf[i]);
if((temp__5808__auto__ == null)){
return null;
} else {
var sub = temp__5808__auto__;
(buf[i] = null);

(ctx.process = sub.source);

var G__58240_58517 = ps.state;
var fexpr__58239_58518 = sub.lcb;
(fexpr__58239_58518.cljs$core$IFn$_invoke$arity$1 ? fexpr__58239_58518.cljs$core$IFn$_invoke$arity$1(G__58240_58517) : fexpr__58239_58518.call(null,G__58240_58517));

var G__58519 = (i + (1));
i = G__58519;
continue;
}
break;
}
});
missionary.impl.Propagator.failure_all = (function missionary$impl$Propagator$failure_all(ps){
var ctx = missionary.impl.Propagator.context;
missionary.impl.Propagator.terminate(ctx,ps);

var buf = ctx.buffer;
var i = (0);
while(true){
var temp__5808__auto__ = (buf[i]);
if((temp__5808__auto__ == null)){
return null;
} else {
var sub = temp__5808__auto__;
(buf[i] = null);

(ctx.process = sub.source);

var G__58244_58521 = ps.state;
var fexpr__58243_58522 = sub.rcb;
(fexpr__58243_58522.cljs$core$IFn$_invoke$arity$1 ? fexpr__58243_58522.cljs$core$IFn$_invoke$arity$1(G__58244_58521) : fexpr__58243_58522.call(null,G__58244_58521));

var G__58523 = (i + (1));
i = G__58523;
continue;
}
break;
}
});
missionary.impl.Propagator.stream_ack = (function missionary$impl$Propagator$stream_ack(sub){
var ps = sub.target;
if(((ps.pending = missionary.impl.Propagator.detach(sub)) == null)){
if(ps.owned){
return null;
} else {
(ps.state = ps);

if(missionary.impl.Propagator.ack(ps)){
return missionary.impl.Propagator.schedule(ps);
} else {
return null;
}
}
} else {
return null;
}
});
missionary.impl.Propagator.stream_emit = (function missionary$impl$Propagator$stream_emit(ps){
if(ps.flag){
return missionary.impl.Propagator.done_all(ps);
} else {
(ps.owned = true);

missionary.impl.Propagator.schedule(ps);

return missionary.impl.Propagator.step_all(ps);
}
});
missionary.impl.Propagator.signal_emit = (function missionary$impl$Propagator$signal_emit(ps){
if(ps.flag){
return missionary.impl.Propagator.done_all(ps);
} else {
return missionary.impl.Propagator.step_all(ps);
}
});
missionary.impl.Propagator.failed_emit = (function missionary$impl$Propagator$failed_emit(ps){
var pub = ps.parent;
while(true){
if(ps.flag){
return missionary.impl.Propagator.done_all(ps);
} else {
try{cljs.core.deref(ps.input);
}catch (e58252){var __58526 = e58252;
}
if(missionary.impl.Propagator.ack(ps)){
continue;
} else {
return missionary.impl.Propagator.release(pub);
}
}
break;
}
});
missionary.impl.Propagator.leave = (function missionary$impl$Propagator$leave(ctx,idle){
if(idle){
while(true){
var temp__5808__auto___58527 = ctx.delayed;
if((temp__5808__auto___58527 == null)){
} else {
var ps_58528 = temp__5808__auto___58527;
(ctx.delayed = null);

var ps_58529__$1 = ps_58528;
while(true){
var pub_58530 = ps_58529__$1.parent;
(ctx.cursor = pub_58530.ranks);

(ctx.reacted = missionary.impl.Propagator.dequeue(ps_58529__$1));

missionary.impl.Propagator.acquire(pub_58530);

if(ps_58529__$1.failed){
if(ps_58529__$1.owned){
(ps_58529__$1.owned = false);

if(missionary.impl.Propagator.ack(ps_58529__$1)){
missionary.impl.Propagator.failed_emit(ps_58529__$1);
} else {
missionary.impl.Propagator.release(pub_58530);
}
} else {
missionary.impl.Propagator.failed_emit(ps_58529__$1);
}
} else {
missionary.impl.Propagator.tick(pub_58530.strategy,ps_58529__$1);
}

var temp__5808__auto___58532__$1 = ctx.reacted;
if((temp__5808__auto___58532__$1 == null)){
} else {
var ps_58533__$2 = temp__5808__auto___58532__$1;
var G__58534 = ps_58533__$2;
ps_58529__$1 = G__58534;
continue;
}
break;
}

continue;
}
break;
}

(ctx.cursor = null);

return (ctx.process = null);
} else {
return null;
}
});
missionary.impl.Propagator.enter = (function missionary$impl$Propagator$enter(ctx){
if((ctx.cursor == null)){
(ctx.cursor = missionary.impl.Propagator.ceiling);

return true;
} else {
return false;
}
});
missionary.impl.Propagator.request = (function missionary$impl$Propagator$request(sub,idle){
var ps = sub.target;
var pub = ps.parent;
var ctx = missionary.impl.Propagator.context;
(sub.ready = true);

missionary.impl.Propagator.attach(ps.ready,(ps.ready = sub));

missionary.impl.Propagator.release(pub);

return missionary.impl.Propagator.leave(ctx,idle);
});
missionary.impl.Propagator.step = (function missionary$impl$Propagator$step(sub,idle){
var ps = sub.target;
var pub = ps.parent;
var ctx = missionary.impl.Propagator.context;
missionary.impl.Propagator.attach(ps.pending,(ps.pending = sub));

missionary.impl.Propagator.release(pub);

var fexpr__58296_58540 = sub.lcb;
(fexpr__58296_58540.cljs$core$IFn$_invoke$arity$0 ? fexpr__58296_58540.cljs$core$IFn$_invoke$arity$0() : fexpr__58296_58540.call(null));

return missionary.impl.Propagator.leave(ctx,idle);
});
missionary.impl.Propagator.done = (function missionary$impl$Propagator$done(sub,idle){
var ps = sub.target;
var pub = ps.parent;
var ctx = missionary.impl.Propagator.context;
missionary.impl.Propagator.release(pub);

var fexpr__58298_58543 = sub.rcb;
(fexpr__58298_58543.cljs$core$IFn$_invoke$arity$0 ? fexpr__58298_58543.cljs$core$IFn$_invoke$arity$0() : fexpr__58298_58543.call(null));

return missionary.impl.Propagator.leave(ctx,idle);
});
missionary.impl.Propagator.success = (function missionary$impl$Propagator$success(sub,idle){
var ps = sub.target;
var pub = ps.parent;
var ctx = missionary.impl.Propagator.context;
missionary.impl.Propagator.release(pub);

var G__58304_58544 = ps.state;
var fexpr__58303_58545 = sub.lcb;
(fexpr__58303_58545.cljs$core$IFn$_invoke$arity$1 ? fexpr__58303_58545.cljs$core$IFn$_invoke$arity$1(G__58304_58544) : fexpr__58303_58545.call(null,G__58304_58544));

return missionary.impl.Propagator.leave(ctx,idle);
});
missionary.impl.Propagator.failure = (function missionary$impl$Propagator$failure(sub,idle){
var ps = sub.target;
var pub = ps.parent;
var ctx = missionary.impl.Propagator.context;
missionary.impl.Propagator.release(pub);

var G__58307_58551 = ps.state;
var fexpr__58306_58552 = sub.rcb;
(fexpr__58306_58552.cljs$core$IFn$_invoke$arity$1 ? fexpr__58306_58552.cljs$core$IFn$_invoke$arity$1(G__58307_58551) : fexpr__58306_58552.call(null,G__58307_58551));

return missionary.impl.Propagator.leave(ctx,idle);
});
missionary.impl.Propagator.ready = (function missionary$impl$Propagator$ready(ps){
if(ps.owned){
return (ps.owned = false);
} else {
if(((ps.pressure = (ps.pressure + (1))) === (0))){
var ctx = missionary.impl.Propagator.context;
var idle = missionary.impl.Propagator.enter(ctx);
missionary.impl.Propagator.schedule(ps);

return missionary.impl.Propagator.leave(ctx,idle);
} else {
return null;
}
}
});
missionary.impl.Propagator.sub = (function missionary$impl$Propagator$sub(pub,lcb,rcb){
var ctx = missionary.impl.Propagator.context;
var idle = missionary.impl.Propagator.enter(ctx);
missionary.impl.Propagator.acquire(pub);

var source = ctx.process;
var target = (function (){var temp__5806__auto__ = pub.current;
if((temp__5806__auto__ == null)){
var ps = missionary.impl.Propagator.__GT_Process(pub,(0),true,null,null,null,null,null,false,false,false,null);
(ps.child = ps);

(ps.state = ps);

(pub.current = ps);

(ctx.process = ps);

(ps.input = (function (){var G__58316 = (function() {
var G__58555 = null;
var G__58555__0 = (function (){
return missionary.impl.Propagator.ready(ps);
});
var G__58555__1 = (function (x){
(ps.state = x);

return missionary.impl.Propagator.ready(ps);
});
G__58555 = function(x){
switch(arguments.length){
case 0:
return G__58555__0.call(this);
case 1:
return G__58555__1.call(this,x);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__58555.cljs$core$IFn$_invoke$arity$0 = G__58555__0;
G__58555.cljs$core$IFn$_invoke$arity$1 = G__58555__1;
return G__58555;
})()
;
var G__58317 = (function() {
var G__58558 = null;
var G__58558__0 = (function (){
(ps.flag = true);

return missionary.impl.Propagator.ready(ps);
});
var G__58558__1 = (function (x){
(ps.flag = true);

(ps.state = x);

return missionary.impl.Propagator.ready(ps);
});
G__58558 = function(x){
switch(arguments.length){
case 0:
return G__58558__0.call(this);
case 1:
return G__58558__1.call(this,x);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__58558.cljs$core$IFn$_invoke$arity$0 = G__58558__0;
G__58558.cljs$core$IFn$_invoke$arity$1 = G__58558__1;
return G__58558;
})()
;
var fexpr__58315 = pub.effect;
return (fexpr__58315.cljs$core$IFn$_invoke$arity$2 ? fexpr__58315.cljs$core$IFn$_invoke$arity$2(G__58316,G__58317) : fexpr__58315.call(null,G__58316,G__58317));
})());

(ctx.process = source);

missionary.impl.Propagator.publish(pub.strategy,ps);

return ps;
} else {
var ps = temp__5806__auto__;
return ps;
}
})();
var sub = missionary.impl.Propagator.__GT_Subscription(source,target,lcb,rcb,null,null,false,null);
if(target.failed){
missionary.impl.Propagator.step(sub,idle);
} else {
missionary.impl.Propagator.subscribe(pub.strategy,sub,idle);
}

return sub;
});
missionary.impl.Propagator.unsub = (function missionary$impl$Propagator$unsub(sub){
var ps = sub.target;
var pub = ps.parent;
var ctx = missionary.impl.Propagator.context;
var idle = missionary.impl.Propagator.enter(ctx);
missionary.impl.Propagator.acquire(pub);

if((((sub.next == null)) || ((((ps.input == null)) || ((!((pub.current === ps)))))))){
missionary.impl.Propagator.release(pub);

return missionary.impl.Propagator.leave(ctx,idle);
} else {
if((((((sub.ready)?ps.pending:ps.ready) == null)) && ((sub.next === sub)))){
(pub.current = null);

var fexpr__58341_58563 = ps.input;
(fexpr__58341_58563.cljs$core$IFn$_invoke$arity$0 ? fexpr__58341_58563.cljs$core$IFn$_invoke$arity$0() : fexpr__58341_58563.call(null));

missionary.impl.Propagator.release(pub);

return missionary.impl.Propagator.leave(ctx,idle);
} else {
return missionary.impl.Propagator.unsubscribe(pub.strategy,sub,idle);
}
}
});
missionary.impl.Propagator.transfer = (function missionary$impl$Propagator$transfer(sub){
var ps = sub.target;
var pub = ps.parent;
var ctx = missionary.impl.Propagator.context;
var idle = missionary.impl.Propagator.enter(ctx);
missionary.impl.Propagator.acquire(pub);

if((sub.next == null)){
return missionary.impl.Propagator.reject(pub.strategy,sub,idle);
} else {
if(ps.dirty){
(ps.dirty = false);

var p_58564 = ctx.process;
(ctx.process = ps);

missionary.impl.Propagator.refresh(pub.strategy,ps);

(ctx.process = p_58564);
} else {
}

if(ps.failed){
(ps.pending = missionary.impl.Propagator.detach(sub));

if((ps.input == null)){
missionary.impl.Propagator.done(sub,idle);
} else {
missionary.impl.Propagator.request(sub,idle);
}

throw ps.state;
} else {
return missionary.impl.Propagator.accept(pub.strategy,sub,idle);
}
}
});
missionary.impl.Propagator.ranks = (function missionary$impl$Propagator$ranks(ctx){
var temp__5806__auto__ = ctx.process;
if((temp__5806__auto__ == null)){
var a = [null];
var i = missionary.impl.Propagator.root;
(missionary.impl.Propagator.root = (i + (1)));

(a[(0)] = i);

return a;
} else {
var ps = temp__5806__auto__;
var pub = ps.parent;
var r = pub.ranks;
var n = r.length;
var a = (new Array((n + (1))));
var i = pub.node;
(pub.node = (i + (1)));

var n__5593__auto___58569 = n;
var i_58570__$1 = (0);
while(true){
if((i_58570__$1 < n__5593__auto___58569)){
(a[i_58570__$1] = (r[i_58570__$1]));

var G__58574 = (i_58570__$1 + (1));
i_58570__$1 = G__58574;
continue;
} else {
}
break;
}

(a[n] = i);

return a;
}
});
missionary.impl.Propagator.publisher = (function missionary$impl$Propagator$publisher(strategy,arg,effect){
return missionary.impl.Propagator.__GT_Publisher(missionary.impl.Propagator.ranks(missionary.impl.Propagator.context),strategy,arg,effect,(0),null);
});

/**
* @constructor
 * @implements {missionary.impl.Propagator.Strategy}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
missionary.impl.Propagator.t_missionary$impl$Propagator58356 = (function (meta58357){
this.meta58357 = meta58357;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(missionary.impl.Propagator.t_missionary$impl$Propagator58356.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_58358,meta58357__$1){
var self__ = this;
var _58358__$1 = this;
return (new missionary.impl.Propagator.t_missionary$impl$Propagator58356(meta58357__$1));
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58356.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_58358){
var self__ = this;
var _58358__$1 = this;
return self__.meta58357;
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58356.prototype.missionary$impl$Propagator$Strategy$ = cljs.core.PROTOCOL_SENTINEL);

(missionary.impl.Propagator.t_missionary$impl$Propagator58356.prototype.missionary$impl$Propagator$Strategy$tick$arity$2 = (function (_,ps){
var self__ = this;
var ___$1 = this;
if(ps.flag){
return missionary.impl.Propagator.failure_all(ps);
} else {
return missionary.impl.Propagator.success_all(ps);
}
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58356.prototype.missionary$impl$Propagator$Strategy$publish$arity$2 = (function (_,ps){
var self__ = this;
var ___$1 = this;
if(ps.owned){
(ps.owned = false);

if(missionary.impl.Propagator.ack(ps)){
return missionary.impl.Propagator.schedule(ps);
} else {
return null;
}
} else {
return (ps.input = null);
}
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58356.prototype.missionary$impl$Propagator$Strategy$subscribe$arity$3 = (function (_,sub,idle){
var self__ = this;
var ___$1 = this;
var ps = sub.target;
if((ps.input == null)){
if(ps.flag){
return missionary.impl.Propagator.failure(sub,idle);
} else {
return missionary.impl.Propagator.success(sub,idle);
}
} else {
return missionary.impl.Propagator.request(sub,idle);
}
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58356.prototype.missionary$impl$Propagator$Strategy$unsubscribe$arity$3 = (function (_,sub,idle){
var self__ = this;
var ___$1 = this;
var ps = sub.target;
var pub = ps.parent;
(ps.ready = missionary.impl.Propagator.detach(sub));

missionary.impl.Propagator.release(pub);

var G__58370_58575 = (new missionary.Cancelled("Memo subscription cancelled."));
var fexpr__58369_58576 = sub.rcb;
(fexpr__58369_58576.cljs$core$IFn$_invoke$arity$1 ? fexpr__58369_58576.cljs$core$IFn$_invoke$arity$1(G__58370_58575) : fexpr__58369_58576.call(null,G__58370_58575));

return missionary.impl.Propagator.leave(missionary.impl.Propagator.context,idle);
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58356.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"meta58357","meta58357",-822505846,null)], null);
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58356.cljs$lang$type = true);

(missionary.impl.Propagator.t_missionary$impl$Propagator58356.cljs$lang$ctorStr = "missionary.impl.Propagator/t_missionary$impl$Propagator58356");

(missionary.impl.Propagator.t_missionary$impl$Propagator58356.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.Propagator/t_missionary$impl$Propagator58356");
}));

/**
 * Positional factory function for missionary.impl.Propagator/t_missionary$impl$Propagator58356.
 */
missionary.impl.Propagator.__GT_t_missionary$impl$Propagator58356 = (function missionary$impl$Propagator$__GT_t_missionary$impl$Propagator58356(meta58357){
return (new missionary.impl.Propagator.t_missionary$impl$Propagator58356(meta58357));
});


missionary.impl.Propagator.memo = (new missionary.impl.Propagator.t_missionary$impl$Propagator58356(cljs.core.PersistentArrayMap.EMPTY));

/**
* @constructor
 * @implements {missionary.impl.Propagator.Strategy}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
missionary.impl.Propagator.t_missionary$impl$Propagator58375 = (function (meta58376){
this.meta58376 = meta58376;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(missionary.impl.Propagator.t_missionary$impl$Propagator58375.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_58377,meta58376__$1){
var self__ = this;
var _58377__$1 = this;
return (new missionary.impl.Propagator.t_missionary$impl$Propagator58375(meta58376__$1));
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58375.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_58377){
var self__ = this;
var _58377__$1 = this;
return self__.meta58376;
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58375.prototype.missionary$impl$Propagator$Strategy$ = cljs.core.PROTOCOL_SENTINEL);

(missionary.impl.Propagator.t_missionary$impl$Propagator58375.prototype.missionary$impl$Propagator$Strategy$tick$arity$2 = (function (_,ps){
var self__ = this;
var ___$1 = this;
var pub = ps.parent;
if(ps.owned){
(ps.owned = false);

if((ps.pending == null)){
(ps.state = ps);

if(missionary.impl.Propagator.ack(ps)){
return missionary.impl.Propagator.stream_emit(ps);
} else {
return missionary.impl.Propagator.release(pub);
}
} else {
return missionary.impl.Propagator.release(pub);
}
} else {
return missionary.impl.Propagator.stream_emit(ps);
}
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58375.prototype.missionary$impl$Propagator$Strategy$publish$arity$2 = (function (_,ps){
var self__ = this;
var ___$1 = this;
if(ps.owned){
(ps.owned = false);

if(missionary.impl.Propagator.ack(ps)){
return missionary.impl.Propagator.schedule(ps);
} else {
return null;
}
} else {
if(ps.flag){
return (ps.input = null);
} else {
(ps.dirty = true);

(ps.owned = true);

return missionary.impl.Propagator.schedule(ps);
}
}
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58375.prototype.missionary$impl$Propagator$Strategy$refresh$arity$2 = (function (_,ps){
var self__ = this;
var ___$1 = this;
var o = ps.owned;
try{(ps.owned = false);

(ps.state = cljs.core.deref(ps.input));

return (ps.owned = o);
}catch (e58383){var e = e58383;
missionary.impl.Propagator.crash(ps,e);

(ps.owned = o);

if(o){
return null;
} else {
if(missionary.impl.Propagator.ack(ps)){
return missionary.impl.Propagator.schedule(ps);
} else {
return null;
}
}
}}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58375.prototype.missionary$impl$Propagator$Strategy$subscribe$arity$3 = (function (_,sub,idle){
var self__ = this;
var ___$1 = this;
var ps = sub.target;
if((ps.input == null)){
return missionary.impl.Propagator.done(sub,idle);
} else {
if(ps.owned){
return missionary.impl.Propagator.step(sub,idle);
} else {
return missionary.impl.Propagator.request(sub,idle);
}
}
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58375.prototype.missionary$impl$Propagator$Strategy$unsubscribe$arity$3 = (function (_,sub,idle){
var self__ = this;
var ___$1 = this;
var ps = sub.target;
var pub = ps.parent;
if(sub.ready){
(ps.ready = missionary.impl.Propagator.detach(sub));

missionary.impl.Propagator.release(pub);

var fexpr__58393_58593 = sub.lcb;
(fexpr__58393_58593.cljs$core$IFn$_invoke$arity$0 ? fexpr__58393_58593.cljs$core$IFn$_invoke$arity$0() : fexpr__58393_58593.call(null));
} else {
missionary.impl.Propagator.stream_ack(sub);

missionary.impl.Propagator.release(pub);
}

return missionary.impl.Propagator.leave(missionary.impl.Propagator.context,idle);
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58375.prototype.missionary$impl$Propagator$Strategy$accept$arity$3 = (function (_,sub,idle){
var self__ = this;
var ___$1 = this;
var ps = sub.target;
var result = ps.state;
missionary.impl.Propagator.stream_ack(sub);

if((ps.input == null)){
missionary.impl.Propagator.done(sub,idle);
} else {
missionary.impl.Propagator.request(sub,idle);
}

return result;
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58375.prototype.missionary$impl$Propagator$Strategy$reject$arity$3 = (function (_,sub,idle){
var self__ = this;
var ___$1 = this;
missionary.impl.Propagator.done(sub,idle);

throw (new missionary.Cancelled("Stream subscription cancelled."));
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58375.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"meta58376","meta58376",-1584869444,null)], null);
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58375.cljs$lang$type = true);

(missionary.impl.Propagator.t_missionary$impl$Propagator58375.cljs$lang$ctorStr = "missionary.impl.Propagator/t_missionary$impl$Propagator58375");

(missionary.impl.Propagator.t_missionary$impl$Propagator58375.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.Propagator/t_missionary$impl$Propagator58375");
}));

/**
 * Positional factory function for missionary.impl.Propagator/t_missionary$impl$Propagator58375.
 */
missionary.impl.Propagator.__GT_t_missionary$impl$Propagator58375 = (function missionary$impl$Propagator$__GT_t_missionary$impl$Propagator58375(meta58376){
return (new missionary.impl.Propagator.t_missionary$impl$Propagator58375(meta58376));
});


missionary.impl.Propagator.stream = (new missionary.impl.Propagator.t_missionary$impl$Propagator58375(cljs.core.PersistentArrayMap.EMPTY));

/**
* @constructor
 * @implements {missionary.impl.Propagator.Strategy}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
missionary.impl.Propagator.t_missionary$impl$Propagator58397 = (function (meta58398){
this.meta58398 = meta58398;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(missionary.impl.Propagator.t_missionary$impl$Propagator58397.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_58399,meta58398__$1){
var self__ = this;
var _58399__$1 = this;
return (new missionary.impl.Propagator.t_missionary$impl$Propagator58397(meta58398__$1));
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58397.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_58399){
var self__ = this;
var _58399__$1 = this;
return self__.meta58398;
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58397.prototype.missionary$impl$Propagator$Strategy$ = cljs.core.PROTOCOL_SENTINEL);

(missionary.impl.Propagator.t_missionary$impl$Propagator58397.prototype.missionary$impl$Propagator$Strategy$tick$arity$2 = (function (_,ps){
var self__ = this;
var ___$1 = this;
var pub = ps.parent;
if(ps.owned){
(ps.owned = false);

if(missionary.impl.Propagator.ack(ps)){
return missionary.impl.Propagator.signal_emit(ps);
} else {
return missionary.impl.Propagator.release(pub);
}
} else {
return missionary.impl.Propagator.signal_emit(ps);
}
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58397.prototype.missionary$impl$Propagator$Strategy$publish$arity$2 = (function (_,ps){
var self__ = this;
var ___$1 = this;
if(ps.owned){
missionary.impl.Propagator.crash(ps,(new Error("Uninitialized flow.")));

return missionary.impl.Propagator.schedule(ps);
} else {
if(ps.flag){
missionary.impl.Propagator.crash(ps,(new Error("Empty flow.")));

return (ps.input = null);
} else {
return (ps.dirty = true);
}
}
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58397.prototype.missionary$impl$Propagator$Strategy$refresh$arity$2 = (function (_,ps){
var self__ = this;
var ___$1 = this;
var pub = ps.parent;
(ps.owned = true);

missionary.impl.Propagator.schedule(ps);

try{var input = ps.input;
var sg = pub.arg;
var r = (function (){var r = cljs.core.deref(input);
while(true){
if(((ps.owned) || (ps.flag))){
return r;
} else {
(ps.owned = true);

var G__58595 = (function (){var G__58415 = r;
var G__58416 = cljs.core.deref(input);
return (sg.cljs$core$IFn$_invoke$arity$2 ? sg.cljs$core$IFn$_invoke$arity$2(G__58415,G__58416) : sg.call(null,G__58415,G__58416));
})();
r = G__58595;
continue;
}
break;
}
})();
(ps.state = (((ps.state === ps))?r:(function (){var G__58418 = ps.state;
var G__58419 = r;
return (sg.cljs$core$IFn$_invoke$arity$2 ? sg.cljs$core$IFn$_invoke$arity$2(G__58418,G__58419) : sg.call(null,G__58418,G__58419));
})()));

var head = ps.pending;
var sub = head;
while(true){
(sub.state = (((sub.state === ps))?r:(function (){var G__58422 = sub.state;
var G__58423 = r;
return (sg.cljs$core$IFn$_invoke$arity$2 ? sg.cljs$core$IFn$_invoke$arity$2(G__58422,G__58423) : sg.call(null,G__58422,G__58423));
})()));

var sub__$1 = sub.next;
if((sub__$1 === head)){
return null;
} else {
var G__58596 = sub__$1;
sub = G__58596;
continue;
}
break;
}
}catch (e58414){var e = e58414;
return missionary.impl.Propagator.crash(ps,e);
}}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58397.prototype.missionary$impl$Propagator$Strategy$subscribe$arity$3 = (function (_,sub,idle){
var self__ = this;
var ___$1 = this;
var ps = sub.target;
(sub.state = ps.state);

return missionary.impl.Propagator.step(sub,idle);
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58397.prototype.missionary$impl$Propagator$Strategy$unsubscribe$arity$3 = (function (_,sub,idle){
var self__ = this;
var ___$1 = this;
var ps = sub.target;
var pub = ps.parent;
if(sub.ready){
(ps.ready = missionary.impl.Propagator.detach(sub));

missionary.impl.Propagator.release(pub);

var fexpr__58433_58597 = sub.lcb;
(fexpr__58433_58597.cljs$core$IFn$_invoke$arity$0 ? fexpr__58433_58597.cljs$core$IFn$_invoke$arity$0() : fexpr__58433_58597.call(null));
} else {
(ps.pending = missionary.impl.Propagator.detach(sub));

missionary.impl.Propagator.release(pub);
}

return missionary.impl.Propagator.leave(missionary.impl.Propagator.context,idle);
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58397.prototype.missionary$impl$Propagator$Strategy$accept$arity$3 = (function (_,sub,idle){
var self__ = this;
var ___$1 = this;
var ps = sub.target;
var result = sub.state;
(sub.state = ps);

(ps.pending = missionary.impl.Propagator.detach(sub));

if((ps.input == null)){
missionary.impl.Propagator.done(sub,idle);
} else {
missionary.impl.Propagator.request(sub,idle);
}

return result;
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58397.prototype.missionary$impl$Propagator$Strategy$reject$arity$3 = (function (_,sub,idle){
var self__ = this;
var ___$1 = this;
missionary.impl.Propagator.done(sub,idle);

throw (new missionary.Cancelled("Signal subscription cancelled."));
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58397.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"meta58398","meta58398",217176958,null)], null);
}));

(missionary.impl.Propagator.t_missionary$impl$Propagator58397.cljs$lang$type = true);

(missionary.impl.Propagator.t_missionary$impl$Propagator58397.cljs$lang$ctorStr = "missionary.impl.Propagator/t_missionary$impl$Propagator58397");

(missionary.impl.Propagator.t_missionary$impl$Propagator58397.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"missionary.impl.Propagator/t_missionary$impl$Propagator58397");
}));

/**
 * Positional factory function for missionary.impl.Propagator/t_missionary$impl$Propagator58397.
 */
missionary.impl.Propagator.__GT_t_missionary$impl$Propagator58397 = (function missionary$impl$Propagator$__GT_t_missionary$impl$Propagator58397(meta58398){
return (new missionary.impl.Propagator.t_missionary$impl$Propagator58397(meta58398));
});


missionary.impl.Propagator.signal = (new missionary.impl.Propagator.t_missionary$impl$Propagator58397(cljs.core.PersistentArrayMap.EMPTY));

//# sourceMappingURL=missionary.impl.Propagator.js.map
